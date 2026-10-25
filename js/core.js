/* ============================
   FIREBASE CONFIGURATION
   ============================ */
const firebaseConfig = {
    databaseURL: "https://adnd-e2-default-rtdb.europe-west1.firebasedatabase.app/",
    apiKey: "AIzaSyDtbwi_5KoEXc4o44HnvLDgaNYsLplXqlQ",
    authDomain: "adnd-e2.firebaseapp.com",
    projectId: "adnd-e2",
    storageBucket: "adnd-e2.firebasestorage.app",
    messagingSenderId: "150901934296",
    appId: "1:150901934296:web:2157c16459f7d6bf996fad",
    measurementId: "G-E5QV2FJN0Y"
};

let db = null;
let firebaseAuth = null;
let firebaseConnected = false;
let firebaseListeners = [];
let firebaseCampaignLoaded = false;   // true once the current campaign was read from Firebase and merged
let accountsSynced = false;           // true once user accounts were read from Firebase and merged
let accountsSyncPromise = null;
let accountsListener = null;
let _resolveFirebaseUser;
const firebaseUserReady = new Promise(r => { _resolveFirebaseUser = r; });

// Shared, campaign-independent data (user accounts + list of campaigns) lives here.
// It sits under "campaigns/" because the database rules allow signed-in clients there.
const ACCOUNTS_PATH = 'campaigns/_accounts';

function fbKey(k) { return String(k).replace(/[.#$\[\]\/]/g, '_'); }
function toArray(v) { if (!v) return []; return Array.isArray(v) ? v.filter(Boolean) : Object.values(v).filter(Boolean); }
function currentPage() { return (location.pathname.split('/').pop() || 'index.html').replace('.html', '') || 'index'; }
function userIsTyping() {
    const el = document.activeElement;
    return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);
}
function safeRender() {
    // Re-render after remote changes, but never wipe a form the user is filling in.
    if (['login', 'create', 'index'].includes(currentPage())) return;
    if (userIsTyping()) return;
    if (typeof render === 'function') render();
}
function withTimeout(promise, ms) {
    return Promise.race([promise, new Promise(r => setTimeout(() => r(null), ms))]);
}

function initFirebase() {
    if (typeof firebase === 'undefined' || !firebaseConfig.apiKey || firebaseConfig.apiKey.includes('YOUR_')) {
        console.warn('Firebase not available. Using localStorage only.');
        _resolveFirebaseUser(null);
        return;
    }
    try {
        if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
        db = firebase.database();
        firebaseAuth = firebase.auth();

        firebaseAuth.signInAnonymously().catch(err => {
            console.error('Anonymous auth error:', err);
            _resolveFirebaseUser(null);
            if (currentPage() !== 'login') toast('Firebase auth failed. Working offline.', 'error');
        });

        firebaseAuth.onAuthStateChanged(user => {
            if (!user) return;
            _resolveFirebaseUser(user);
            syncAccounts();
            if (State.campaignId) setupFirebaseListeners();
        });

        db.ref('.info/connected').on('value', snap => {
            firebaseConnected = snap.val() === true;
            updateConnectionStatus();
        });
    } catch (e) {
        console.error('Firebase init error:', e);
        _resolveFirebaseUser(null);
    }
}

/* ---------- User accounts + campaign list (shared across devices) ---------- */
function loadDeletedUsers() {
    try { return JSON.parse(localStorage.getItem('adnd2e_deletedUsers') || '{}') || {}; } catch (e) { return {}; }
}
function loadKnownCampaigns() {
    try { return JSON.parse(localStorage.getItem('adnd2e_knownCampaigns') || '[]') || []; } catch (e) { return []; }
}
function rememberCampaign(cid) {
    if (!cid || cid === 'default') return;
    const list = loadKnownCampaigns();
    if (!list.includes(cid)) { list.push(cid); list.sort(); localStorage.setItem('adnd2e_knownCampaigns', JSON.stringify(list)); }
}
function getKnownCampaigns() {
    const fromChars = (State.characters || []).map(c => c.campaignId).filter(Boolean);
    return [...new Set([...loadKnownCampaigns(), ...fromChars])].filter(id => id !== 'default').sort();
}

function mergeUserLists(remoteUsers, localUsers, deleted) {
    const map = {};
    [...toArray(remoteUsers), ...toArray(localUsers)].forEach(u => {
        if (!u || !u.username) return;
        const cur = map[u.username];
        if (!cur || (u.updatedAt || 0) > (cur.updatedAt || 0)) map[u.username] = u;
    });
    return Object.values(map).filter(u => {
        const del = deleted[fbKey(u.username)];
        return !(del && del >= (u.updatedAt || 0));
    });
}

function applyRemoteAccounts(remote) {
    remote = remote || {};
    const deleted = loadDeletedUsers();
    Object.entries(remote.deletedUsers || {}).forEach(([k, v]) => { if (!deleted[k] || v > deleted[k]) deleted[k] = v; });
    const merged = mergeUserLists(remote.users, DB.users, deleted);
    const usersChanged = JSON.stringify(merged) !== JSON.stringify(DB.users);
    DB.users = merged;
    if (usersChanged && currentPage() === 'users') safeRender();
    localStorage.setItem('adnd2e_users', JSON.stringify(merged));
    localStorage.setItem('adnd2e_deletedUsers', JSON.stringify(deleted));

    const before = JSON.stringify(loadKnownCampaigns());
    Object.values(remote.campaignList || {}).forEach(cid => rememberCampaign(cid));
    if (JSON.stringify(loadKnownCampaigns()) !== before) refreshCampaignPickers();
}

function accountsPayload() {
    const campaignList = {};
    getKnownCampaigns().forEach(cid => { campaignList[fbKey(cid)] = cid; });
    return { users: DB.users || [], deletedUsers: loadDeletedUsers(), campaignList };
}

function syncAccounts() {
    if (!db) return Promise.resolve(false);
    if (accountsSyncPromise) return accountsSyncPromise;
    accountsSyncPromise = db.ref(ACCOUNTS_PATH).once('value').then(snap => {
        applyRemoteAccounts(snap.val());
        accountsSynced = true;
        // Upload the merged result so every device ends up with the same accounts
        db.ref(ACCOUNTS_PATH).update(accountsPayload()).catch(err => console.error('Accounts upload error:', err));
        if (!accountsListener) {
            accountsListener = db.ref(ACCOUNTS_PATH);
            accountsListener.on('value', s => applyRemoteAccounts(s.val()));
        }
        return true;
    }).catch(err => {
        console.error('Accounts sync error:', err);
        accountsSyncPromise = null;
        return false;
    });
    return accountsSyncPromise;
}

function pushAccounts() {
    if (!db || !accountsSynced) return;   // not synced yet: local changes get merged in on the next sync
    db.ref(ACCOUNTS_PATH).update(accountsPayload()).catch(err => console.error('Accounts upload error:', err));
}

// Wait (briefly) for the shared accounts so a fresh device/browser knows every user
function ensureAccountsLoaded(timeoutMs = 6000) {
    if (accountsSynced) return Promise.resolve(true);
    return withTimeout(firebaseUserReady.then(u => u ? syncAccounts() : false), timeoutMs);
}

function refreshCampaignPickers() {
    const sel = document.getElementById('loginCampaign');
    if (sel && document.activeElement !== sel) {
        const val = sel.value;
        const ids = getKnownCampaigns();
        sel.innerHTML = `<option value="">All Characters</option>` +
            ids.map(cid => `<option value="${cid}">${cid}</option>`).join('') +
            `<option value="default">Solo Play (default)</option>`;
        sel.value = val;
    }
    if (currentPage() === 'dashboard') safeRender();
}

/* ---------- Campaign data ---------- */
function mergeById(localArr, remoteArr, remoteStamp) {
    // Items on both sides: newest wins. Local-only items are kept only if they changed after the
    // last remote save (otherwise they were deleted on another device). remoteStamp === null keeps all local-only items.
    const byId = {};
    toArray(remoteArr).forEach(x => { if (x && x.id != null) byId[x.id] = x; });
    toArray(localArr).forEach(x => {
        if (!x || x.id == null) return;
        const r = byId[x.id];
        if (r) { if ((x.lastUpdated || 0) > (r.lastUpdated || 0)) byId[x.id] = x; }
        else if (remoteStamp === null || (x.lastUpdated || 0) > (remoteStamp || 0)) byId[x.id] = x;
    });
    return Object.values(byId);
}

function campaignChars(list, cid) {
    return toArray(list).filter(c => (c.campaignId || cid) === cid).map(c => c.campaignId ? c : { ...c, campaignId: cid });
}

function setupFirebaseListeners() {
    if (!db || !State.campaignId) return;
    firebaseListeners.forEach(ref => ref.off());
    firebaseListeners = [];
    firebaseCampaignLoaded = false;

    const cid = State.campaignId;
    const base = `campaigns/${cid}`;
    rememberCampaign(cid);

    // 1) Read once and merge with what this device has, so nothing is overwritten blindly
    db.ref(base).once('value').then(snap => {
        if (State.campaignId !== cid) return;
        const remote = snap.val() || {};
        const stamp = remote.lastUpdated || 0;
        const others = State.characters.filter(c => (c.campaignId || 'default') !== cid);
        const mine = State.characters.filter(c => (c.campaignId || 'default') === cid);
        State.characters = [...others, ...mergeById(mine, campaignChars(remote.characters, cid), stamp)];
        if (remote.creatures) State.creatures = mergeById(State.creatures, remote.creatures, null);
        if (remote.campaign && (!State.campaign || (remote.campaign.lastUpdated || 0) >= (State.campaign.lastUpdated || 0))) State.campaign = remote.campaign;
        if (remote.customSpells) {
            const cs = { wizard: [], priest: [] };
            ['wizard', 'priest'].forEach(t => {
                const seen = {};
                [...toArray(remote.customSpells[t]), ...toArray((State.customSpells || {})[t])].forEach(s => { if (s && s.name && !seen[s.name]) { seen[s.name] = 1; cs[t].push(s); } });
            });
            State.customSpells = cs;
        }
        if (remote.tacticalMap && Object.keys(remote.tacticalMap).length) State.tacticalMap = remote.tacticalMap;
        if (remote.maps) saveMapList(mergeById(getMapList(), remote.maps, null));
        if (remote.activeMapId) setActiveMapId(remote.activeMapId);
        if (State.currentCharacter) {
            const updated = State.characters.find(c => c.id === State.currentCharacter.id);
            if (updated) State.currentCharacter = updated;
        }
        firebaseCampaignLoaded = true;
        Storage.save({ silent: true });   // writes the merged result back to Firebase
        safeRender();
        attachCampaignListeners(cid);
    }).catch(err => console.error('Campaign load error:', err));
}

function attachCampaignListeners(cid) {
    const base = `campaigns/${cid}`;

    const charRef = db.ref(`${base}/characters`);
    charRef.on('value', snap => {
        if (State.campaignId !== cid) return;
        const others = State.characters.filter(c => (c.campaignId || 'default') !== cid);
        const merged = [...others, ...campaignChars(snap.val(), cid)];
        if (JSON.stringify(merged) !== JSON.stringify(State.characters)) {
            State.characters = merged;
            if (State.currentCharacter) {
                const updated = State.characters.find(c => c.id === State.currentCharacter.id);
                if (updated) State.currentCharacter = updated;
            }
            localStorage.setItem('adnd2e_chars', JSON.stringify(State.characters));
            safeRender();
        }
    });
    firebaseListeners.push(charRef);

    const creatureRef = db.ref(`${base}/creatures`);
    creatureRef.on('value', snap => {
        if (!snap.exists()) return;
        const val = toArray(snap.val());
        if (JSON.stringify(val) === JSON.stringify(State.creatures)) return;
        State.creatures = val;
        localStorage.setItem('adnd2e_creatures', JSON.stringify(State.creatures));
        if (['dm', 'bestiary'].includes(currentPage())) safeRender();
    });
    firebaseListeners.push(creatureRef);

    const campaignRef = db.ref(`${base}/campaign`);
    campaignRef.on('value', snap => {
        if (!snap.exists()) return;
        if (JSON.stringify(snap.val()) === JSON.stringify(State.campaign)) return;
        State.campaign = snap.val();
        localStorage.setItem('adnd2e_campaign', JSON.stringify(State.campaign));
        if (currentPage() === 'campaign') safeRender();
    });
    firebaseListeners.push(campaignRef);

    const spellsRef = db.ref(`${base}/customSpells`);
    spellsRef.on('value', snap => {
        if (snap.exists()) State.customSpells = snap.val() || { wizard: [], priest: [] };
    });
    firebaseListeners.push(spellsRef);

    const mapRef = db.ref(`${base}/tacticalMap`);
    mapRef.on('value', snap => {
        if (snap.exists()) {
            State.tacticalMap = snap.val();
            if (currentPage() === 'tactical' && typeof drawTacticalMap === 'function') drawTacticalMap();
        }
    });
    firebaseListeners.push(mapRef);

    const mapsRef = db.ref(`${base}/maps`);
    mapsRef.on('value', snap => {
        if (snap.exists()) saveMapList(toArray(snap.val()));
    });
    firebaseListeners.push(mapsRef);

    const activeMapRef = db.ref(`${base}/activeMapId`);
    activeMapRef.on('value', snap => {
        if (snap.exists()) {
            setActiveMapId(snap.val());
            if (currentPage() === 'tactical' && typeof drawTacticalMap === 'function') drawTacticalMap();
        }
    });
    firebaseListeners.push(activeMapRef);
}

function updateConnectionStatus() {
    const el = $('firebaseStatus');
    if (!el) return;
    if (firebaseConnected) {
        el.className = 'text-xs px-2 py-1 rounded bg-green-100 text-green-800 border border-green-300';
        el.innerHTML = '<i class="fas fa-wifi mr-1"></i>Online';
    } else {
        el.className = 'text-xs px-2 py-1 rounded bg-red-100 text-red-800 border border-red-300';
        el.innerHTML = '<i class="fas fa-wifi mr-1"></i>Offline';
    }
}

/* ============================
   MODULE: Real-Time Sync (Firebase + BroadcastChannel fallback)
   ============================ */
const Sync = {
    channel: null,
    clientId: null,
    init() {
        this.clientId = Math.random().toString(36).substr(2, 9);
        if (typeof BroadcastChannel !== 'undefined') {
            this.channel = new BroadcastChannel('adnd2e_campaign_sync');
            this.channel.onmessage = (e) => {
                if (e.data.source === this.clientId) return;
                if (e.data.type === 'state_update') {
                    this.mergeData(e.data.payload);
                }
            };
        }
        window.addEventListener('storage', (e) => {
            if (e.key === 'adnd2e_chars' || e.key === 'adnd2e_creatures' || e.key === 'adnd2e_campaign') {
                Storage.load();
                if (State.currentCharacter) {
                    const updated = State.characters.find(c => c.id === State.currentCharacter.id);
                    if (updated) State.currentCharacter = updated;
                }
                if (State.view !== 'create') render();
            }
        });
    },
    broadcast(type, payload) {
        if (!this.channel) return;
        this.channel.postMessage({ type, payload, source: this.clientId, timestamp: Date.now() });
    },
    mergeData(data) {
        let changed = false;
        if (data.characters) {
            data.characters.forEach(newChar => {
                const idx = State.characters.findIndex(c => c.id === newChar.id);
                if (idx === -1) {
                    State.characters.push(newChar);
                    changed = true;
                } else if ((newChar.lastUpdated || 0) > (State.characters[idx].lastUpdated || 0)) {
                    State.characters[idx] = newChar;
                    changed = true;
                }
            });
        }
        if (data.creatures) {
            (data.creatures || []).forEach(newC => {
                const idx = State.creatures.findIndex(c => c.id === newC.id);
                if (idx === -1) {
                    State.creatures.push(newC);
                    changed = true;
                } else if ((newC.lastUpdated || 0) > (State.creatures[idx].lastUpdated || 0)) {
                    State.creatures[idx] = newC;
                    changed = true;
                }
            });
        }
        if (data.campaign) {
            if ((data.campaign.lastUpdated || 0) > (State.campaign?.lastUpdated || 0)) {
                State.campaign = data.campaign;
                changed = true;
            }
        }
        if (data.tacticalMap) {
            State.tacticalMap = data.tacticalMap;
            changed = true;
        }
        if (data.maps) {
            saveMapList(data.maps);
            changed = true;
        }
        if (data.activeMapId) {
            setActiveMapId(data.activeMapId);
            changed = true;
        }
        if (changed) {
            if (State.currentCharacter) {
                const updated = State.characters.find(c => c.id === State.currentCharacter.id);
                if (updated) State.currentCharacter = updated;
            }
            Storage.save({ silent: true });
            if (State.view !== 'create') render();
        }
    }
};

const Storage = {
    save: (options = {}) => {
        const { silent = false } = options;
        const now = Date.now();
        State.characters.forEach(c => c.lastUpdated = now);
        if (State.campaign) State.campaign.lastUpdated = now;
        
        // Always persist locally
        localStorage.setItem('adnd2e_chars', JSON.stringify(State.characters));
        localStorage.setItem('adnd2e_creatures', JSON.stringify(State.creatures));
        localStorage.setItem('adnd2e_customSpells', JSON.stringify(State.customSpells));
        localStorage.setItem('adnd2e_campaign', JSON.stringify(State.campaign));
        localStorage.setItem('adnd2e_campaignId', State.campaignId || '');
        localStorage.setItem('adnd2e_currentUser', State.currentUser || '');
        localStorage.setItem('adnd2e_currentUserName', State.currentUserName || '');
        localStorage.setItem('adnd2e_isDM', JSON.stringify(State.isDM || false));
        localStorage.setItem('adnd2e_currentCharacter', State.currentCharacter ? State.currentCharacter.id : '');
        
        // Sync to Firebase if available
        // Sync to Firebase only after this campaign was loaded & merged (prevents overwriting other devices)
        if (firebaseConnected && db && State.campaignId && firebaseCampaignLoaded) {
            const cid = State.campaignId;
            const base = `campaigns/${cid}`;
            const updates = {};
            updates[`${base}/characters`] = State.characters.filter(c => (c.campaignId || 'default') === cid);
            if (cid !== 'default') updates[`${ACCOUNTS_PATH}/campaignList/${fbKey(cid)}`] = cid;
            updates[`${base}/creatures`] = State.creatures;
            updates[`${base}/customSpells`] = State.customSpells;
            updates[`${base}/campaign`] = State.campaign;
            updates[`${base}/tacticalMap`] = State.tacticalMap || {};
            updates[`${base}/maps`] = getMapList();
            updates[`${base}/activeMapId`] = getActiveMapId() || '';
            updates[`${base}/lastUpdated`] = now;
            db.ref().update(updates).catch(err => console.error('Firebase save error:', err));
        }
        
        if (!silent && Sync.channel) {
            Sync.broadcast('state_update', {
                characters: State.characters,
                creatures: State.creatures,
                campaign: State.campaign,
                tacticalMap: State.tacticalMap,
                maps: getMapList(),
                activeMapId: getActiveMapId()
            });
        }
    },
    load: () => {
        try {
            const chars = localStorage.getItem('adnd2e_chars');
            if (chars) {
                State.characters = JSON.parse(chars);
                State.characters.forEach(c => { if (!c.campaignId) c.campaignId = 'default'; });
            }
            const creatures = localStorage.getItem('adnd2e_creatures');
            if (creatures) State.creatures = JSON.parse(creatures);
            const spells = localStorage.getItem('adnd2e_customSpells');
            if (spells) State.customSpells = JSON.parse(spells);
            const campaign = localStorage.getItem('adnd2e_campaign');
            if (campaign) State.campaign = JSON.parse(campaign);
            else State.campaign = { story: '', dmNotes: '', sessions: [], playerNotes: {}, partyNotes: '', lastUpdated: 0 };

            const cid = localStorage.getItem('adnd2e_campaignId');
            if (cid) State.campaignId = cid;
            const maps = localStorage.getItem('adnd2e_maps');
            if (maps) saveMapList(JSON.parse(maps));
            const amid = localStorage.getItem('adnd2e_activeMapId');
            if (amid) setActiveMapId(amid);
            const users = localStorage.getItem('adnd2e_users');
            if (users) DB.users = JSON.parse(users);
            const cu = localStorage.getItem('adnd2e_currentUser');
            if (cu) { State.currentUser = cu; State.currentUserName = localStorage.getItem('adnd2e_currentUserName') || cu; }
            const dm = localStorage.getItem('adnd2e_isDM');
            if (dm) { try { State.isDM = JSON.parse(dm); } catch(e) {} }
            const ccid = localStorage.getItem('adnd2e_currentCharacter');
            if (ccid) { const cc = State.characters.find(c => c.id === ccid); if (cc) State.currentCharacter = cc; }
        } catch (e) {
            console.error('Storage.load error:', e);
            alert('Error loading saved data. Your local storage may be corrupted. Try clearing browser data for this site.');
        }
    },
    clear: () => {
        localStorage.removeItem('adnd2e_chars');
        localStorage.removeItem('adnd2e_creatures');
        localStorage.removeItem('adnd2e_customSpells');
        localStorage.removeItem('adnd2e_campaign');
        localStorage.removeItem('adnd2e_campaignId');
        localStorage.removeItem('adnd2e_currentUser');
        localStorage.removeItem('adnd2e_currentUserName');
        localStorage.removeItem('adnd2e_isDM');
        localStorage.removeItem('adnd2e_currentCharacter');
    }
};

function getAvailableSpells(char) {
    const isWizard = char.class === 'Mage';
    const isSpecialist = char.class === 'Specialist Wizard';
    const isPriest = ['Cleric','Druid','Paladin','Ranger'].includes(char.class);
    const isBard = char.class === 'Bard';
    let base = [];
    if (isWizard || isBard) base = [...DB.wizard_spells, ...(State.customSpells.wizard || [])];
    else if (isSpecialist) {
        const school = char.kit;
        base = [...DB.wizard_spells, ...(State.customSpells.wizard || [])].filter(s => 
            s.school === school
        );
    }
    else if (isPriest) base = [...DB.priest_spells, ...(State.customSpells.priest || [])];
    return base;
}
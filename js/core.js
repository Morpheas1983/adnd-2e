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

function initFirebase() {
    if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes('YOUR_')) {
        console.warn('Firebase not configured. Using localStorage only.');
        return;
    }
    try {
        firebase.initializeApp(firebaseConfig);
        db = firebase.database();
        firebaseAuth = firebase.auth();

        firebaseAuth.signInAnonymously().catch(err => {
            console.error('Anonymous auth error:', err);
            toast('Firebase auth failed. Working offline.', 'error');
        });

        firebaseAuth.onAuthStateChanged(user => {
            if (user && State.campaignId) {
                setupFirebaseListeners();
            }
        });

        db.ref('.info/connected').on('value', snap => {
            firebaseConnected = snap.val() === true;
            updateConnectionStatus();
        });
    } catch (e) {
        console.error('Firebase init error:', e);
    }
}

function setupFirebaseListeners() {
    if (!db || !State.campaignId) return;
    firebaseListeners.forEach(ref => ref.off());
    firebaseListeners = [];

    const base = `campaigns/${State.campaignId}`;

    const charRef = db.ref(`${base}/characters`);
    charRef.on('value', snap => {
        if (snap.exists()) {
            const val = snap.val();
            if (JSON.stringify(val) !== JSON.stringify(State.characters)) {
                State.characters = val || [];
                if (State.currentCharacter) {
                    const updated = State.characters.find(c => c.id === State.currentCharacter.id);
                    if (updated) State.currentCharacter = updated;
                }
                if (State.view !== 'create') render();
            }
        }
    });
    firebaseListeners.push(charRef);

    const creatureRef = db.ref(`${base}/creatures`);
    creatureRef.on('value', snap => {
        if (snap.exists()) {
            State.creatures = snap.val() || [];
            if (State.view === 'dm_view' || State.view === 'bestiary') render();
        }
    });
    firebaseListeners.push(creatureRef);

    const campaignRef = db.ref(`${base}/campaign`);
    campaignRef.on('value', snap => {
        if (snap.exists()) {
            State.campaign = snap.val();
            if (State.view === 'campaign') render();
        }
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
            if (State.view === 'tactical') drawTacticalMap();
        }
    });
    firebaseListeners.push(mapRef);

    const mapsRef = db.ref(`${base}/maps`);
    mapsRef.on('value', snap => {
        if (snap.exists()) saveMapList(snap.val() || []);
    });
    firebaseListeners.push(mapsRef);

    const activeMapRef = db.ref(`${base}/activeMapId`);
    activeMapRef.on('value', snap => {
        if (snap.exists()) {
            setActiveMapId(snap.val());
            if (State.view === 'tactical') drawTacticalMap();
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
        if (firebaseConnected && db && State.campaignId) {
            const base = `campaigns/${State.campaignId}`;
            const updates = {};
            updates[`${base}/characters`] = State.characters;
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
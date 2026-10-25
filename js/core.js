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


/* Admin accounts: can see and manage every campaign and user.
   Keep this list in sync with isAdmin() in firestore.rules. */
const ADMIN_EMAILS = ['billmamakos@gmail.com'];

/* ============================
   CLOUD LAYER (Firebase Auth + Cloud Firestore)
   ============================
   Data model
   users/{uid}                      profile: displayName, email
   campaigns/{cid}                  name, ownerUid, members{uid:'dm'|'player'}, memberUids[], memberNames{},
                                    inviteCode, story, sessionsJson, partyNotes, playerNotes{uid:text}
   campaigns/{cid}/private/dm       dmNotes                     (DM only)
   campaigns/{cid}/state/shared     creaturesJson, customSpellsJson (DM writes, members read)
   campaigns/{cid}/state/map        tacticalMapJson, mapsJson, activeMapId (members read/write)
   characters/{id}                  ownerUid, campaignId|null, name, playerName, data (JSON), updatedAt
   invites/{code}                   campaignId, campaignName
*/
let fbApp = null, auth = null, fs = null;
let firebaseConnected = false;
const Cloud = {
    user: null,
    isAdmin: false,
    campaigns: [],          // campaigns I belong to: [{id, name, role, ownerUid}]
    meta: null,             // current campaign document
    synced: {},             // key -> JSON last seen on the server (to send only real changes)
    unsubs: [],
    charsMine: {},          // id -> char (from "my characters" query)
    charsCampaign: {},      // id -> char (from "campaign characters" query)
    ready: false,
    pending: Promise.resolve()   // outstanding writes (page changes wait briefly for them)
};

function currentPage() { return (location.pathname.split('/').pop() || 'index.html').replace('.html', '') || 'index'; }
function userIsTyping() {
    const el = document.activeElement;
    return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);
}
function safeRender() {
    // Re-render after remote changes, but never wipe a form the user is filling in.
    if (!Cloud.ready) return;
    if (['login', 'create', 'index'].includes(currentPage())) return;
    if (userIsTyping() || document.querySelector('#modalContainer .modal-overlay')) return;
    if (typeof render === 'function') render();
}
function withTimeout(promise, ms) { return Promise.race([promise, new Promise(r => setTimeout(() => r(null), ms))]); }
function escapeHtml(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function parseJson(s, fallback) { try { return s ? JSON.parse(s) : fallback; } catch (e) { return fallback; } }
function clean(obj) { return JSON.parse(JSON.stringify(obj === undefined ? null : obj)); }
function serverTime() { return firebase.firestore.FieldValue.serverTimestamp(); }
function randomCode(n = 6) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let s = ''; const a = new Uint32Array(n); crypto.getRandomValues(a);
    for (let i = 0; i < n; i++) s += chars[a[i] % chars.length];
    return s;
}
function currentCampaignName() { return Cloud.meta?.name || (State.campaignId ? 'Campaign' : ''); }
function campaignNameById(cid) {
    if (!cid || cid === 'default') return '';
    const c = Cloud.campaigns.find(x => x.id === cid);
    return c ? c.name : (cid === State.campaignId && Cloud.meta ? Cloud.meta.name : '');
}
function memberName(uid) {
    if (!uid) return 'Unassigned';
    if (uid === State.currentUser) return State.currentUserName || 'You';
    return (Cloud.meta?.memberNames || {})[uid] || 'Unknown player';
}
function isCampaignDM(cid) {
    if (Cloud.isAdmin) return true;
    if (!cid || cid !== State.campaignId || !Cloud.meta) return false;
    return (Cloud.meta.members || {})[State.currentUser] === 'dm';
}

/* ---------- Start-up ---------- */
function initFirebaseApp() {
    if (fbApp) return;
    fbApp = firebase.apps.length ? firebase.app() : firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    fs = firebase.firestore();
    // Local testing against the Firebase emulators: add ?emulator=1 to the URL once
    const useEmu = new URLSearchParams(location.search).has('emulator') || localStorage.getItem('adnd2e_emulator') === '1';
    if (useEmu) {
        localStorage.setItem('adnd2e_emulator', '1');
        auth.useEmulator('http://localhost:9099');
        fs.useEmulator('localhost', 8080);
    } else {
        // Offline cache: the app keeps working on a bad connection and syncs later
        fs.enablePersistence({ synchronizeTabs: true }).catch(() => {});
    }
}

function waitForAuth() {
    return new Promise(resolve => {
        const off = auth.onAuthStateChanged(u => { off(); resolve(u); });
    });
}

const Cloud_start = async function () {
    initFirebaseApp();
    window.addEventListener('online', () => { firebaseConnected = true; updateConnectionStatus(); });
    window.addEventListener('offline', () => { firebaseConnected = false; updateConnectionStatus(); });
    firebaseConnected = navigator.onLine !== false;

    const user = await waitForAuth();
    if (!user) { State.currentUser = null; Cloud.ready = true; return; }

    Cloud.user = user;
    Cloud.isAdmin = !!user.email && user.emailVerified && ADMIN_EMAILS.includes(user.email.toLowerCase());
    State.currentUser = user.uid;
    State.currentUserName = user.displayName || (user.email ? user.email.split('@')[0] : 'Adventurer');
    State.currentUserEmail = user.email || '';

    // Keep the profile document up to date (used by the admin user list)
    fs.collection('users').doc(user.uid).set({
        displayName: State.currentUserName, email: user.email || '', lastLogin: serverTime()
    }, { merge: true }).catch(err => console.warn('Profile save failed', err));

    // Signed out in another tab / account disabled -> back to login
    auth.onAuthStateChanged(u => { if (!u && currentPage() !== 'login') { Storage.clear(); changeView('login'); } });

    await withTimeout(loadCampaignList(), 8000);

    // Right after signing in: if I'm in exactly one campaign, open it
    if (sessionStorage.getItem('adnd2e_justLoggedIn')) {
        sessionStorage.removeItem('adnd2e_justLoggedIn');
        const mine = Cloud.campaigns.filter(c => c.role === 'dm' || c.role === 'player');
        if (!State.campaignId && mine.length === 1) { State.campaignId = mine[0].id; Storage.savePrefs(); }
    }
    // The selected campaign must be one I'm a member of
    if (State.campaignId && !Cloud.campaigns.find(c => c.id === State.campaignId)) {
        State.campaignId = null;
        Storage.savePrefs();
    }
    const waits = [subscribeMyCharacters()];
    if (State.campaignId) waits.push(subscribeCampaign(State.campaignId));
    await withTimeout(Promise.all(waits), 10000);

    rebuildCharacters();
    restoreCurrentCharacter();
    Cloud.ready = true;
    await handlePendingJoin();
};

async function loadCampaignList() {
    const q = Cloud.isAdmin ? fs.collection('campaigns') : fs.collection('campaigns').where('memberUids', 'array-contains', State.currentUser);
    let first = true;
    return new Promise(resolve => {
        const unsub = q.onSnapshot(snap => {
            Cloud.campaigns = snap.docs.map(d => {
                const x = d.data();
                return { id: d.id, name: x.name || 'Unnamed campaign', ownerUid: x.ownerUid, role: (x.members || {})[State.currentUser] || (Cloud.isAdmin ? 'admin' : null) };
            }).sort((a, b) => a.name.localeCompare(b.name));
            if (first) { first = false; resolve(); } else if (currentPage() === 'dashboard') safeRender();
        }, err => { console.error('Campaign list error', err); resolve(); });
        Cloud.unsubs.push(unsub);
    });
}

/* ---------- Characters ---------- */
function docToChar(d) {
    const x = d.data();
    const c = parseJson(x.data, {});
    c.id = d.id;
    c.player = x.ownerUid;
    c.playerName = x.playerName || c.playerName || '';
    c.campaignId = x.campaignId || 'default';
    return c;
}
function charPayload(c) {
    const copy = clean(c);
    delete copy.lastUpdated;
    delete copy.player; delete copy.playerName; delete copy.campaignId; delete copy.id;
    return JSON.stringify(copy);
}
function charKey(c) { return 'char:' + c.id + ':' + (c.player || '') + ':' + (c.campaignId || 'default'); }

function subscribeMyCharacters() {
    return new Promise(resolve => {
        let first = true;
        const unsub = fs.collection('characters').where('ownerUid', '==', State.currentUser).onSnapshot(snap => {
            Cloud.charsMine = {};
            snap.docs.forEach(d => { Cloud.charsMine[d.id] = docToChar(d); });
            charsChanged();
            if (first) { first = false; resolve(); }
        }, err => { console.error('My characters error', err); resolve(); });
        Cloud.unsubs.push(unsub);
    });
}

function subscribeCampaignCharacters(cid) {
    return new Promise(resolve => {
        let first = true;
        const unsub = fs.collection('characters').where('campaignId', '==', cid).onSnapshot(snap => {
            Cloud.charsCampaign = {};
            snap.docs.forEach(d => { Cloud.charsCampaign[d.id] = docToChar(d); });
            charsChanged();
            if (first) { first = false; resolve(); }
        }, err => { console.error('Campaign characters error', err); resolve(); });
        Cloud.unsubs.push(unsub);
    });
}

function rebuildCharacters() {
    const all = { ...Cloud.charsMine, ...Cloud.charsCampaign };
    // Record what the server has, so Storage.save only writes what really changed
    Object.keys(Cloud.synced).filter(k => k.startsWith('c:')).forEach(k => delete Cloud.synced[k]);
    Object.values(all).forEach(c => { Cloud.synced['c:' + c.id] = { payload: charPayload(c), key: charKey(c) }; });
    // Keep local characters that haven't been uploaded yet (just created, or offline)
    const pending = (State.characters || []).filter(c => !all[c.id] && c._pending);
    State.characters = [...Object.values(all), ...pending];
}
function restoreCurrentCharacter() {
    const id = State.currentCharacter ? State.currentCharacter.id : localStorage.getItem('adnd2e_currentCharacter');
    State.currentCharacter = id ? (State.characters.find(c => c.id === id) || null) : null;
}
function charsChanged() {
    if (!Cloud.ready) return;
    rebuildCharacters();
    restoreCurrentCharacter();
    safeRender();
}

/* ---------- Current campaign ---------- */
function subscribeCampaign(cid) {
    const base = fs.collection('campaigns').doc(cid);
    const waits = [];

    waits.push(new Promise(resolve => {
        let first = true;
        Cloud.unsubs.push(base.onSnapshot(doc => {
            if (!doc.exists) { if (first) { first = false; resolve(); } return; }
            const x = doc.data();
            Cloud.meta = { id: cid, ...x };
            State.isDM = isCampaignDM(cid);
            const journal = {
                story: x.story || '',
                sessions: parseJson(x.sessionsJson, []),
                partyNotes: x.partyNotes || '',
                playerNotes: x.playerNotes || {}
            };
            Cloud.synced.journal = JSON.stringify(journal);
            State.campaign = { ...(State.campaign || {}), ...journal };
            if (first) {
                first = false;
                resolve();
            } else if (['campaign', 'dashboard', 'dm', 'users'].includes(currentPage())) safeRender();
        }, err => { console.error('Campaign error', err); resolve(); }));
    }).then(() => (State.isDM ? subscribePrivate(cid) : null)));   // DM-only notes: separate document players can't read

    waits.push(new Promise(resolve => {
        let first = true;
        Cloud.unsubs.push(base.collection('state').doc('shared').onSnapshot(doc => {
            const x = doc.exists ? doc.data() : {};
            State.creatures = parseJson(x.creaturesJson, []);
            State.customSpells = parseJson(x.customSpellsJson, { wizard: [], priest: [] });
            Cloud.synced.shared = JSON.stringify({ creatures: State.creatures, customSpells: State.customSpells });
            if (first) { first = false; resolve(); } else if (['dm', 'bestiary', 'monsters', 'tactical'].includes(currentPage())) safeRender();
        }, err => { console.error('Shared state error', err); resolve(); }));
    }));

    waits.push(new Promise(resolve => {
        let first = true;
        Cloud.unsubs.push(base.collection('state').doc('map').onSnapshot(doc => {
            const x = doc.exists ? doc.data() : {};
            State.tacticalMap = parseJson(x.tacticalMapJson, null);
            saveMapList(parseJson(x.mapsJson, []));
            setActiveMapId(x.activeMapId || null);
            Cloud.synced.map = JSON.stringify({ tacticalMap: State.tacticalMap, maps: getMapList(), activeMapId: getActiveMapId() });
            if (first) { first = false; resolve(); }
            else if (currentPage() === 'tactical' && !State.mapDragging && typeof drawTacticalMap === 'function') drawTacticalMap();
        }, err => { console.error('Map state error', err); resolve(); }));
    }));

    waits.push(subscribeCampaignCharacters(cid));
    return Promise.all(waits);
}

let privateSubscribed = false;
function subscribePrivate(cid) {
    if (privateSubscribed) return Promise.resolve();
    privateSubscribed = true;
    return new Promise(resolve => {
        let first = true;
        Cloud.unsubs.push(fs.collection('campaigns').doc(cid).collection('private').doc('dm').onSnapshot(doc => {
            const notes = doc.exists ? (doc.data().dmNotes || '') : '';
            Cloud.synced.dmNotes = notes;
            State.campaign = { ...(State.campaign || {}), dmNotes: notes };
            if (first) { first = false; resolve(); } else if (currentPage() === 'campaign') safeRender();
        }, err => { console.error('DM notes error', err); resolve(); }));
    });
}

/* ---------- Saving: send only what changed ---------- */
function canWriteChar(c) {
    if (Cloud.isAdmin) return true;
    if (!c.player || c.player === State.currentUser) return true;
    return c.campaignId && c.campaignId !== 'default' && isCampaignDM(c.campaignId);
}

function reportWriteError(what) {
    return err => {
        console.error(what + ' save failed', err);
        if (err && err.code === 'permission-denied') toast(`You don't have permission to change ${what}.`, 'error');
        else toast(`Could not save ${what}. It will retry when you're back online.`, 'error');
    };
}

function syncToCloud() {
    if (!fs || !State.currentUser || !Cloud.ready) return;
    const batch = fs.batch();
    let writes = 0;

    // Characters
    const seen = new Set();
    (State.characters || []).forEach(c => {
        if (!c.id) c.id = Date.now().toString(36) + Math.random().toString(36).substr(2);
        seen.add(c.id);
        if (!c.player) c.player = State.currentUser;
        if (!c.campaignId) c.campaignId = State.campaignId || 'default';
        const prev = Cloud.synced['c:' + c.id];
        const payload = charPayload(c);
        const key = charKey(c);
        if (prev && prev.payload === payload && prev.key === key) return;
        if (!canWriteChar(c)) return;
        const owner = c.player;
        const playerName = owner === State.currentUser ? State.currentUserName : (c.playerName || memberName(owner));
        c.playerName = playerName;
        batch.set(fs.collection('characters').doc(c.id), {
            ownerUid: owner,
            campaignId: c.campaignId && c.campaignId !== 'default' ? c.campaignId : null,
            name: c.name || 'Unnamed',
            playerName,
            data: payload,
            updatedAt: serverTime()
        });
        Cloud.synced['c:' + c.id] = { payload, key };
        delete c._pending;
        writes++;
    });
    // Deleted characters
    Object.keys(Cloud.synced).filter(k => k.startsWith('c:')).forEach(k => {
        const id = k.slice(2);
        if (seen.has(id)) return;
        const old = Cloud.charsMine[id] || Cloud.charsCampaign[id];
        if (old && !canWriteChar(old)) return;
        batch.delete(fs.collection('characters').doc(id));
        delete Cloud.synced[k];
        writes++;
    });

    if (State.campaignId && Cloud.meta) {
        const base = fs.collection('campaigns').doc(State.campaignId);
        const c = State.campaign || {};
        const journal = { story: c.story || '', sessions: c.sessions || [], partyNotes: c.partyNotes || '', playerNotes: c.playerNotes || {} };
        const jStr = JSON.stringify(journal);
        if (jStr !== Cloud.synced.journal) {
            const before = parseJson(Cloud.synced.journal, {});
            if (State.isDM) {
                batch.update(base, { story: journal.story, sessionsJson: JSON.stringify(journal.sessions), partyNotes: journal.partyNotes, playerNotes: clean(journal.playerNotes), updatedAt: serverTime() });
            } else {
                const upd = {};
                if (journal.partyNotes !== before.partyNotes) upd.partyNotes = journal.partyNotes;
                const mine = (journal.playerNotes || {})[State.currentUser] || '';
                if (mine !== ((before.playerNotes || {})[State.currentUser] || '')) upd['playerNotes.' + State.currentUser] = mine;
                if (Object.keys(upd).length) { upd.updatedAt = serverTime(); batch.update(base, upd); }
            }
            Cloud.synced.journal = jStr;
            writes++;
        }
        if (State.isDM && (c.dmNotes || '') !== (Cloud.synced.dmNotes || '')) {
            batch.set(base.collection('private').doc('dm'), { dmNotes: c.dmNotes || '' });
            Cloud.synced.dmNotes = c.dmNotes || '';
            writes++;
        }
        const shared = JSON.stringify({ creatures: State.creatures || [], customSpells: State.customSpells || { wizard: [], priest: [] } });
        if (State.isDM && shared !== Cloud.synced.shared) {
            batch.set(base.collection('state').doc('shared'), { creaturesJson: JSON.stringify(State.creatures || []), customSpellsJson: JSON.stringify(State.customSpells || { wizard: [], priest: [] }) });
            Cloud.synced.shared = shared;
            writes++;
        }
        const map = JSON.stringify({ tacticalMap: State.tacticalMap || null, maps: getMapList(), activeMapId: getActiveMapId() });
        if (map !== Cloud.synced.map) {
            batch.set(base.collection('state').doc('map'), { tacticalMapJson: JSON.stringify(State.tacticalMap || null), mapsJson: JSON.stringify(getMapList()), activeMapId: getActiveMapId() || '' });
            Cloud.synced.map = map;
            writes++;
        }
    }
    if (writes) {
        const p = batch.commit().catch(reportWriteError('this data'));
        Cloud.pending = Promise.all([Cloud.pending, p]);
    }
}

function updateConnectionStatus() {
    const el = document.getElementById('firebaseStatus');
    if (!el) return;
    if (firebaseConnected) {
        el.className = 'text-xs px-2 py-1 rounded bg-green-100 text-green-800 border border-green-300';
        el.innerHTML = '<i class="fas fa-wifi mr-1"></i>Online';
    } else {
        el.className = 'text-xs px-2 py-1 rounded bg-red-100 text-red-800 border border-red-300';
        el.innerHTML = '<i class="fas fa-wifi mr-1"></i>Offline';
    }
}

/* ---------- Accounts ---------- */
async function signInEmail(email, password) { initFirebaseApp(); return auth.signInWithEmailAndPassword(email, password); }
async function registerEmail(name, email, password) {
    initFirebaseApp();
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    await cred.user.updateProfile({ displayName: name });
    cred.user.sendEmailVerification().catch(() => {});
    return cred;
}
async function signInGoogle() {
    initFirebaseApp();
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
        return await auth.signInWithPopup(provider);
    } catch (err) {
        if (err.code === 'auth/popup-blocked' || err.code === 'auth/operation-not-supported-in-this-environment') {
            return auth.signInWithRedirect(provider);
        }
        throw err;
    }
}
async function resetPassword(email) { initFirebaseApp(); return auth.sendPasswordResetEmail(email); }
function authErrorMessage(err) {
    const map = {
        'auth/invalid-email': 'That email address is not valid.',
        'auth/user-not-found': 'No account with that email. Register first.',
        'auth/wrong-password': 'Wrong password.',
        'auth/invalid-credential': 'Wrong email or password.',
        'auth/invalid-login-credentials': 'Wrong email or password.',
        'auth/email-already-in-use': 'An account with this email already exists. Sign in instead.',
        'auth/weak-password': 'Password must be at least 6 characters.',
        'auth/too-many-requests': 'Too many attempts. Wait a minute and try again.',
        'auth/popup-closed-by-user': 'Google sign-in was closed before finishing.',
        'auth/network-request-failed': 'No internet connection.',
        'auth/unauthorized-domain': 'This website is not yet allowed in Firebase (Authentication > Settings > Authorized domains).',
        'auth/operation-not-allowed': 'This sign-in method is not enabled in Firebase yet.'
    };
    return map[err && err.code] || (err && err.message) || 'Something went wrong.';
}

async function logout() {
    Cloud.unsubs.forEach(u => { try { u(); } catch (e) {} });
    Cloud.unsubs = [];
    Storage.clear();
    try { initFirebaseApp(); await auth.signOut(); } catch (e) {}
    changeView('login');
}

/* ---------- Campaigns: create / join / leave / invite ---------- */
async function createCampaign(name) {
    if (!name || !name.trim()) return toast('Please enter a campaign name', 'error');
    name = name.trim().slice(0, 60);
    const uid = State.currentUser;
    const ref = fs.collection('campaigns').doc();
    const code = randomCode();
    const batch = fs.batch();
    batch.set(ref, {
        name, ownerUid: uid,
        members: { [uid]: 'dm' }, memberUids: [uid], memberNames: { [uid]: State.currentUserName },
        inviteCode: code, story: '', sessionsJson: '[]', partyNotes: '', playerNotes: {},
        createdAt: serverTime(), updatedAt: serverTime()
    });
    batch.set(fs.collection('invites').doc(code), { campaignId: ref.id, campaignName: name, createdBy: uid });
    try {
        await batch.commit();
    } catch (err) { return reportWriteError('campaigns')(err); }
    State.campaignId = ref.id;
    Storage.savePrefs();
    toast(`Campaign '${name}' created! Share the invite code ${code} with your players.`);
    setTimeout(() => changeView('dashboard'), 600);
}

function switchCampaign(campaignId) {
    State.campaignId = campaignId || null;
    State.currentCharacter = null;
    Storage.savePrefs();
    changeView('dashboard');
}

async function joinCampaign(code) {
    code = (code || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!code) return toast('Enter an invite code', 'error');
    try {
        const inv = await fs.collection('invites').doc(code).get();
        if (!inv.exists) return toast('Invite code not found', 'error');
        const cid = inv.data().campaignId;
        if (Cloud.campaigns.find(c => c.id === cid && c.role)) {
            State.campaignId = cid; Storage.savePrefs();
            toast('You are already in this campaign.');
            return setTimeout(() => changeView('dashboard'), 500);
        }
        const uid = State.currentUser;
        await fs.collection('campaigns').doc(cid).update({
            ['members.' + uid]: 'player',
            memberUids: firebase.firestore.FieldValue.arrayUnion(uid),
            ['memberNames.' + uid]: State.currentUserName,
            joinCode: code
        });
        State.campaignId = cid;
        Storage.savePrefs();
        toast(`Joined '${inv.data().campaignName}'!`);
        setTimeout(() => changeView('dashboard'), 600);
    } catch (err) {
        console.error(err);
        toast(err.code === 'permission-denied' ? 'That invite code is no longer valid.' : 'Could not join the campaign.', 'error');
    }
}

async function handlePendingJoin() {
    const params = new URLSearchParams(location.search);
    const code = params.get('join') || sessionStorage.getItem('adnd2e_pendingJoin');
    if (!code || !State.currentUser) return;
    sessionStorage.removeItem('adnd2e_pendingJoin');
    history.replaceState(null, '', location.pathname);
    await joinCampaign(code);
}

function inviteLink(code) {
    return location.href.replace(/[^/]*$/, '') + 'login.html?join=' + encodeURIComponent(code);
}

async function regenerateInvite() {
    if (!State.isDM || !Cloud.meta) return;
    const cid = State.campaignId;
    const old = Cloud.meta.inviteCode;
    const code = randomCode();
    const batch = fs.batch();
    batch.update(fs.collection('campaigns').doc(cid), { inviteCode: code });
    batch.set(fs.collection('invites').doc(code), { campaignId: cid, campaignName: Cloud.meta.name, createdBy: State.currentUser });
    if (old) batch.delete(fs.collection('invites').doc(old));
    try { await batch.commit(); toast('New invite code: ' + code); } catch (err) { reportWriteError('the invite code')(err); }
}

async function setMemberRole(uid, role) {
    if (!State.isDM || !Cloud.meta) return;
    if (uid === Cloud.meta.ownerUid && role !== 'dm') return toast('The campaign owner always stays a DM.', 'error');
    try { await fs.collection('campaigns').doc(State.campaignId).update({ ['members.' + uid]: role }); toast('Role updated'); }
    catch (err) { reportWriteError('members')(err); }
}

async function removeMember(uid) {
    if (!Cloud.meta) return;
    const self = uid === State.currentUser;
    if (!self && !State.isDM) return;
    if (uid === Cloud.meta.ownerUid) return toast('The campaign owner cannot be removed.', 'error');
    if (!confirm(self ? 'Leave this campaign?' : `Remove ${memberName(uid)} from the campaign?`)) return;
    const FV = firebase.firestore.FieldValue;
    try {
        await fs.collection('campaigns').doc(State.campaignId).update({
            ['members.' + uid]: FV.delete(), memberUids: FV.arrayRemove(uid), ['memberNames.' + uid]: FV.delete()
        });
        if (self) { State.campaignId = null; Storage.savePrefs(); changeView('dashboard'); }
        else toast('Player removed');
    } catch (err) { reportWriteError('members')(err); }
}

async function deleteCampaign() {
    if (!Cloud.meta) return;
    if (Cloud.meta.ownerUid !== State.currentUser && !Cloud.isAdmin) return toast('Only the campaign owner can delete it.', 'error');
    const name = Cloud.meta.name;
    if (prompt(`This permanently deletes the campaign "${name}" (characters stay with their owners). Type the campaign name to confirm:`) !== name) return;
    const cid = State.campaignId;
    const base = fs.collection('campaigns').doc(cid);
    try {
        const batch = fs.batch();
        ['private/dm', 'state/shared', 'state/map'].forEach(p => { const [c, d] = p.split('/'); batch.delete(base.collection(c).doc(d)); });
        if (Cloud.meta.inviteCode) batch.delete(fs.collection('invites').doc(Cloud.meta.inviteCode));
        // Characters become solo characters of their owners
        Object.values(Cloud.charsCampaign).forEach(c => {
            batch.update(fs.collection('characters').doc(c.id), { campaignId: null });
        });
        batch.delete(base);
        await batch.commit();
        State.campaignId = null; Storage.savePrefs();
        toast('Campaign deleted');
        setTimeout(() => changeView('dashboard'), 500);
    } catch (err) { reportWriteError('the campaign')(err); }
}

/* ============================
   STORAGE (facade used by the rest of the app)
   ============================ */
const Storage = {
    // All game data is saved to Firestore; only UI preferences stay in the browser.
    save: () => {
        if (State.campaign) State.campaign.lastUpdated = Date.now();
        Storage.savePrefs();
        syncToCloud();
    },
    savePrefs: () => {
        try {
            localStorage.setItem('adnd2e_campaignId', State.campaignId || '');
            localStorage.setItem('adnd2e_currentCharacter', State.currentCharacter ? State.currentCharacter.id : '');
            if (State.selectedCampaign) sessionStorage.setItem('adnd2e_selectedCampaign', JSON.stringify(State.selectedCampaign));
        } catch (e) {}
    },
    load: () => {
        try {
            // One-time backup of data from the old (browser-only) version, for the Import tool
            if (localStorage.getItem('adnd2e_chars') && !localStorage.getItem('adnd2e_legacy')) {
                const get = k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } };
                localStorage.setItem('adnd2e_legacy', JSON.stringify({
                    characters: get('adnd2e_chars') || [], creatures: get('adnd2e_creatures') || [],
                    customSpells: get('adnd2e_customSpells') || { wizard: [], priest: [] }, campaign: get('adnd2e_campaign'),
                    maps: get('adnd2e_maps') || [], activeMapId: localStorage.getItem('adnd2e_activeMapId') || null,
                    savedAt: new Date().toISOString()
                }));
            }
            const oldCid = localStorage.getItem('adnd2e_campaignId');
            if (oldCid && !localStorage.getItem('adnd2e_v2')) { localStorage.removeItem('adnd2e_campaignId'); }
            localStorage.setItem('adnd2e_v2', '1');
            State.campaignId = localStorage.getItem('adnd2e_campaignId') || null;
            if (State.campaignId === 'default') State.campaignId = null;
            const sel = sessionStorage.getItem('adnd2e_selectedCampaign');
            if (sel) State.selectedCampaign = JSON.parse(sel);
            State.campaign = { story: '', sessions: [], partyNotes: '', playerNotes: {}, dmNotes: '' };
        } catch (e) { console.error('Storage.load error:', e); }
    },
    clear: () => {
        ['adnd2e_campaignId', 'adnd2e_currentCharacter', 'adnd2e_maps', 'adnd2e_activeMapId'].forEach(k => localStorage.removeItem(k));
        sessionStorage.removeItem('adnd2e_selectedCampaign');
    }
};

/* ---------- Page start-up ---------- */
let _appStarted = null;
function initApp() {
    if (!_appStarted) {
        Storage.load();
        showBootSpinner();
        _appStarted = Cloud_start().catch(err => { console.error('Start-up error', err); Cloud.ready = true; }).finally(hideBootSpinner);
    }
    return _appStarted;
}

// Wraps a page's start-up: waits for sign-in + data, then checks access.
function bootPage(opts, start) {
    initApp().then(() => {
        if (!State.currentUser) return changeView('login');
        if (opts.campaign && !State.campaignId) { toast('Choose a campaign first'); return setTimeout(() => changeView('dashboard'), 700); }
        if (opts.dm && !State.isDM) return changeView('dashboard');
        if (opts.character && !State.currentCharacter) return changeView('dashboard');
        start();
        setTimeout(updateConnectionStatus, 0);
    });
}

function showBootSpinner() {
    if (document.getElementById('bootSpinner')) return;
    const d = document.createElement('div');
    d.id = 'bootSpinner';
    d.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;z-index:40;pointer-events:none';
    d.innerHTML = '<div style="color:#d4af37;font-family:Cinzel,serif;font-size:1.1rem;text-align:center"><i class="fas fa-dragon fa-2x fa-beat-fade"></i><div style="margin-top:10px">Loading…</div></div>';
    (document.body || document.documentElement).appendChild(d);
}
function hideBootSpinner() { const d = document.getElementById('bootSpinner'); if (d) d.remove(); }


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

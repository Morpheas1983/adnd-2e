/* importer.js - Export, and import of data from the old version of the app */

function exportCampaign() {
    const cid = State.campaignId;
    const data = {
        format: 'adnd2e-v2',
        campaignName: cid ? currentCampaignName() : null,
        characters: (cid ? State.characters.filter(c => c.campaignId === cid) : State.characters.filter(c => c.player === State.currentUser))
            .map(c => { const x = clean(c); delete x.player; delete x.playerName; return x; }),
        creatures: cid ? State.creatures : [],
        customSpells: cid ? State.customSpells : { wizard: [], priest: [] },
        campaign: cid ? State.campaign : null,
        maps: cid ? getMapList() : [],
        activeMapId: cid ? getActiveMapId() : null,
        tacticalMap: cid ? State.tacticalMap : null,
        exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `adnd_${(data.campaignName || 'my_characters').replace(/[^\w-]+/g, '_')}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Exported!');
}

/* ---------- Import ---------- */
let importBundle = null;

function legacyBrowserBundle() {
    const raw = localStorage.getItem('adnd2e_legacy');
    if (!raw) return null;
    try {
        const b = JSON.parse(raw);
        return (b.characters && b.characters.length) || (b.creatures && b.creatures.length) || b.campaign ? b : null;
    } catch (e) { return null; }
}

function normalizeBundle(d) {
    d = d || {};
    const toArr = v => !v ? [] : Array.isArray(v) ? v.filter(Boolean) : Object.values(v).filter(Boolean);
    const camp = d.campaign || {};
    return {
        characters: toArr(d.characters),
        creatures: toArr(d.creatures),
        customSpells: { wizard: toArr((d.customSpells || {}).wizard), priest: toArr((d.customSpells || {}).priest) },
        campaign: { story: camp.story || '', sessions: toArr(camp.sessions), partyNotes: camp.partyNotes || '', dmNotes: camp.dmNotes || '' },
        maps: toArr(d.maps),
        activeMapId: d.activeMapId || null,
        tacticalMap: d.tacticalMap && Object.keys(d.tacticalMap).length ? d.tacticalMap : null,
        sourceName: d.campaignName || d.sourceName || ''
    };
}

function showImportModal() {
    const legacy = legacyBrowserBundle();
    $('modalContainer').innerHTML = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal-content" onclick="event.stopPropagation()">
                <div class="p-6">
                    <h2 class="fantasy-font text-xl font-bold text-amber-900 mb-1">Import Data</h2>
                    <p class="text-sm text-amber-700 mb-4">Bring characters, journal, creatures and maps from the old version of the app into your account.</p>
                    <div class="space-y-3" id="importSources">
                        <button onclick="importFromBrowser()" class="w-full text-left p-3 rounded border-2 border-amber-300 bg-amber-50 hover:border-amber-600 ${legacy ? '' : 'opacity-50'}" ${legacy ? '' : 'disabled'}>
                            <div class="font-bold text-amber-900"><i class="fas fa-laptop mr-2"></i>Old data saved in this browser</div>
                            <div class="text-xs text-amber-700">${legacy ? `${(legacy.characters || []).length} character(s) found` : 'Nothing found in this browser. Open the new app in the browser you used before.'}</div>
                        </button>
                        <button onclick="importFromFile()" class="w-full text-left p-3 rounded border-2 border-amber-300 bg-amber-50 hover:border-amber-600">
                            <div class="font-bold text-amber-900"><i class="fas fa-file-import mr-2"></i>An Export file (.json)</div>
                            <div class="text-xs text-amber-700">A file made with the Export button (old or new version).</div>
                        </button>
                        <div class="p-3 rounded border-2 border-amber-300 bg-amber-50">
                            <div class="font-bold text-amber-900"><i class="fas fa-cloud-download-alt mr-2"></i>An old online campaign</div>
                            <div class="text-xs text-amber-700 mb-2">The campaign name you used in the old version (e.g. "default" for Solo Play).</div>
                            <div class="flex gap-2">
                                <input id="oldCampaignName" class="input-fantasy flex-1 px-2 py-1 text-sm" placeholder="Old campaign name">
                                <button onclick="importFromOldCloud($('oldCampaignName').value)" class="btn-fantasy px-3 py-1 rounded text-sm">Load</button>
                            </div>
                        </div>
                    </div>
                    <div id="importPreview"></div>
                    <div class="mt-4 flex justify-end"><button onclick="closeModal()" class="btn-galactic px-4 py-2 rounded">Close</button></div>
                </div>
            </div>
        </div>`;
}

function importFromBrowser() {
    const b = legacyBrowserBundle();
    if (!b) return toast('No old data found in this browser', 'error');
    showImportPreview(normalizeBundle({ ...b, sourceName: 'Imported campaign' }));
}

function importFromFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
            try { showImportPreview(normalizeBundle(JSON.parse(ev.target.result))); }
            catch (err) { toast('That file is not a valid export', 'error'); }
        };
        reader.readAsText(file);
    };
    input.click();
}

async function importFromOldCloud(name) {
    name = (name || '').trim();
    if (!name) return toast('Enter the old campaign name', 'error');
    try {
        const snap = await withTimeout(firebase.database().ref('campaigns/' + name).once('value'), 10000);
        if (!snap || !snap.exists()) return toast('No old online campaign with that name', 'error');
        showImportPreview(normalizeBundle({ ...snap.val(), sourceName: name === 'default' ? 'Solo play' : name }));
    } catch (err) {
        console.error(err);
        toast('Could not read the old online data', 'error');
    }
}

function showImportPreview(bundle) {
    importBundle = bundle;
    const dmCampaigns = Cloud.campaigns.filter(c => c.role === 'dm' || c.role === 'admin');
    const hasCampaignData = bundle.creatures.length || bundle.campaign.story || bundle.campaign.sessions.length || bundle.campaign.partyNotes || bundle.campaign.dmNotes || bundle.maps.length || bundle.tacticalMap;
    $('importSources').classList.add('hidden');
    $('importPreview').innerHTML = `
        <div class="p-3 rounded border border-amber-300 bg-amber-50 text-sm text-amber-900 mb-3">
            <div class="font-bold mb-1">Found:</div>
            <ul class="list-disc ml-5">
                <li>${bundle.characters.length} character(s)${bundle.characters.length ? ': ' + bundle.characters.slice(0, 8).map(c => escapeHtml(c.name || 'Unnamed')).join(', ') + (bundle.characters.length > 8 ? '…' : '') : ''}</li>
                <li>${bundle.creatures.length} creature(s), ${bundle.campaign.sessions.length} journal entr${bundle.campaign.sessions.length === 1 ? 'y' : 'ies'}, ${bundle.maps.length} saved map(s)</li>
            </ul>
        </div>
        <label class="block text-sm font-bold text-amber-900 mb-1">Import into</label>
        <select id="importTarget" class="input-fantasy w-full px-3 py-2 mb-2" onchange="$('newCampName').classList.toggle('hidden', this.value !== '__new')">
            <option value="__new">A new campaign (you are the DM)</option>
            ${dmCampaigns.map(c => `<option value="${c.id}" ${c.id === State.campaignId ? 'selected' : ''}>${escapeHtml(c.name)} (existing)</option>`).join('')}
            <option value="__solo">Solo: my characters only, no campaign${hasCampaignData ? ' (journal/creatures/maps are skipped)' : ''}</option>
        </select>
        <input id="newCampName" class="input-fantasy w-full px-3 py-2 mb-2 ${dmCampaigns.some(c => c.id === State.campaignId) ? 'hidden' : ''}" placeholder="New campaign name" value="${escapeHtml(bundle.sourceName || 'Imported campaign')}">
        <p class="text-xs text-amber-700 mb-3">All imported characters will belong to you. As DM you can give them to your players later with <b>Assign Chars</b> in the Party View.</p>
        <div class="flex justify-end gap-2">
            <button onclick="showImportModal()" class="btn-galactic px-4 py-2 rounded">Back</button>
            <button id="importGo" onclick="runImport()" class="btn-fantasy px-4 py-2 rounded"><i class="fas fa-file-import mr-1"></i>Import</button>
        </div>`;
    const sel = $('importTarget');
    if (sel.value !== '__new') $('newCampName').classList.add('hidden');
}

async function runImport() {
    const b = importBundle;
    if (!b) return;
    const btn = $('importGo'); btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Importing…';
    try {
        let target = $('importTarget').value;
        if (target === '__new') {
            const name = ($('newCampName').value || 'Imported campaign').trim();
            target = await createCampaignForImport(name);
        }
        const cid = target === '__solo' ? null : target;
        const uid = State.currentUser;

        // Characters (written in chunks: Firestore batches hold up to 500 writes)
        const chars = b.characters.map(c => {
            const x = clean(c);
            if (!x.id) x.id = Date.now().toString(36) + Math.random().toString(36).substr(2);
            return x;
        });
        for (let i = 0; i < chars.length; i += 400) {
            const batch = fs.batch();
            chars.slice(i, i + 400).forEach(c => {
                const payload = charPayload(c);
                batch.set(fs.collection('characters').doc(c.id), {
                    ownerUid: uid, campaignId: cid, name: c.name || 'Unnamed', playerName: State.currentUserName,
                    data: payload, updatedAt: serverTime()
                });
            });
            await batch.commit();
        }

        if (cid) await mergeCampaignData(cid, b);

        State.campaignId = cid;
        Storage.savePrefs();
        localStorage.setItem('adnd2e_legacy_imported', new Date().toISOString());
        closeModal();
        toast(`Imported ${chars.length} character(s)!`);
        setTimeout(() => changeView('dashboard'), 700);
    } catch (err) {
        console.error(err);
        btn.disabled = false; btn.innerHTML = '<i class="fas fa-file-import mr-1"></i>Import';
        toast(err.code === 'permission-denied' ? 'Import blocked: some of these characters already belong to another account.' : 'Import failed: ' + (err.message || err), 'error');
    }
}

async function createCampaignForImport(name) {
    const uid = State.currentUser;
    const ref = fs.collection('campaigns').doc();
    const code = randomCode();
    const batch = fs.batch();
    batch.set(ref, {
        name: name.slice(0, 60), ownerUid: uid,
        members: { [uid]: 'dm' }, memberUids: [uid], memberNames: { [uid]: State.currentUserName },
        inviteCode: code, story: '', sessionsJson: '[]', partyNotes: '', playerNotes: {},
        createdAt: serverTime(), updatedAt: serverTime()
    });
    batch.set(fs.collection('invites').doc(code), { campaignId: ref.id, campaignName: name, createdBy: uid });
    await batch.commit();
    return ref.id;
}

async function mergeCampaignData(cid, b) {
    const base = fs.collection('campaigns').doc(cid);
    const [campSnap, privSnap, sharedSnap, mapSnap] = await Promise.all([
        base.get(), base.collection('private').doc('dm').get(),
        base.collection('state').doc('shared').get(), base.collection('state').doc('map').get()
    ]);
    const cur = campSnap.data() || {};
    const join = (a, x) => !a ? x : !x ? a : (a.includes(x) ? a : a + '\n\n' + x);
    const unionBy = (a, x, key) => { const m = {}; [...a, ...x].forEach(i => { if (i && i[key] != null) m[i[key]] = m[i[key]] || i; }); return Object.values(m); };

    const batch = fs.batch();
    batch.update(base, {
        story: join(cur.story || '', b.campaign.story),
        sessionsJson: JSON.stringify([...parseJson(cur.sessionsJson, []), ...b.campaign.sessions]),
        partyNotes: join(cur.partyNotes || '', b.campaign.partyNotes),
        updatedAt: serverTime()
    });
    if (b.campaign.dmNotes) {
        batch.set(base.collection('private').doc('dm'), { dmNotes: join(privSnap.exists ? privSnap.data().dmNotes || '' : '', b.campaign.dmNotes) });
    }
    const sh = sharedSnap.exists ? sharedSnap.data() : {};
    const curSpells = parseJson(sh.customSpellsJson, { wizard: [], priest: [] });
    batch.set(base.collection('state').doc('shared'), {
        creaturesJson: JSON.stringify(unionBy(parseJson(sh.creaturesJson, []), b.creatures, 'id')),
        customSpellsJson: JSON.stringify({
            wizard: unionBy(curSpells.wizard || [], b.customSpells.wizard, 'name'),
            priest: unionBy(curSpells.priest || [], b.customSpells.priest, 'name')
        })
    });
    const mp = mapSnap.exists ? mapSnap.data() : {};
    const curMap = parseJson(mp.tacticalMapJson, null);
    batch.set(base.collection('state').doc('map'), {
        tacticalMapJson: JSON.stringify(curMap || b.tacticalMap || null),
        mapsJson: JSON.stringify(unionBy(parseJson(mp.mapsJson, []), b.maps, 'id')),
        activeMapId: mp.activeMapId || b.activeMapId || ''
    });
    await batch.commit();
}

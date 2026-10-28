/* dm.js - DM Party View */
function renderDMView(container) {
    const hasCampaignFilter = !!State.campaignId;
    const allChars = State.characters || []; const campaignChars = hasCampaignFilter ? allChars.filter(c => c.campaignId === State.campaignId) : allChars;
    container.innerHTML = `
        <div class="min-h-screen p-4">
            <div class="max-w-6xl mx-auto">
                <div class="parchment scroll-border p-4 mb-4 fade-in">
                    <div class="flex justify-between items-center flex-wrap gap-3">
                        <div class="flex items-center gap-3">
						<button onclick="changeView('dashboard')" class="btn-galactic px-3 py-2 rounded text-sm">
    <i class="fas fa-arrow-left"></i> Back
</button>
                            <h1 class="fantasy-font text-2xl font-bold text-amber-900">
                                <i class="fas fa-dungeon mr-2 text-amber-700"></i>DM Party View
                            </h1>
                        </div>
                        <div class="flex gap-2 flex-wrap items-center">
                            <div class="text-xs text-amber-800 flex items-center mr-2 border-r border-amber-300 pr-2">
                                <span class="font-bold mr-1">Campaign:</span> ${escapeHtml(currentCampaignName())}
                            </div>
                            <button onclick="changeView('campaign')" class="btn-fantasy px-4 py-2 rounded text-sm">
                                <i class="fas fa-book mr-1"></i>Campaign
                            </button>
                            <button onclick="changeView('bestiary')" class="btn-fantasy px-4 py-2 rounded text-sm">
                                <i class="fas fa-paw mr-1"></i>Bestiary
                            </button>
                            <button onclick="changeView('monsters')" class="btn-fantasy px-4 py-2 rounded text-sm">
                                <i class="fas fa-dragon mr-1"></i>Monsters
                            </button>
                            <button onclick="changeView('tactical')" class="btn-fantasy px-4 py-2 rounded text-sm">
                                <i class="fas fa-chess-board mr-1"></i>Tactical Map
                            </button>
                            <button onclick="changeView('campaigns')" class="btn-fantasy px-4 py-2 rounded text-sm">
                                <i class="fas fa-scroll mr-1"></i>Campaigns
                            </button>
                            <button onclick="changeView('users')" class="btn-fantasy px-4 py-2 rounded text-sm">
                                <i class="fas fa-user-friends mr-1"></i>Players
                            </button>
                            <button onclick="changeView('battle')" class="btn-magic px-4 py-2 rounded text-sm">
                                <i class="fas fa-khanda mr-1"></i>Battle
                            </button>
                            <button onclick="changeView('stats')" class="btn-fantasy px-4 py-2 rounded text-sm">
                                <i class="fas fa-chart-bar mr-1"></i>Stats & XP
                            </button>
                            <button onclick="showAssignCharModal()" class="btn-fantasy px-4 py-2 rounded text-sm">
                                <i class="fas fa-user-tag mr-1"></i>Assign Chars
                            </button>
                            <button onclick="restAll()" class="btn-fantasy px-4 py-2 rounded text-sm">
                                <i class="fas fa-bed mr-1"></i>Rest All
                            </button>
                            <div class="text-sm text-amber-800 flex items-center">
                                ${campaignChars.length} Characters | ${Object.values(Cloud.meta?.members || {}).filter(r => r === 'player').length} Players
                            </div>
                        </div>
                    </div>
                </div>
                ${renderBringPanel()}
                <div id="partyDrop" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 rounded"
                     ondragover="partyDragOver(event)" ondragleave="partyDragLeave(event)" ondrop="partyDrop(event)">
                    ${campaignChars.length === 0 ? `
                        <div class="col-span-full parchment scroll-border p-8 text-center">
                            <i class="fas fa-scroll text-4xl text-amber-700 mb-3"></i>
                            <p class="fantasy-font text-lg text-amber-900">No characters in this campaign</p>
                            ${outsideChars().length ? '<p class="text-sm text-amber-700 mt-1">Drag a character here from the list above, or press <b>Bring</b>.</p>' : ''}
                        </div>
                    ` : campaignChars.map(char => `
                        <div class="parchment scroll-border p-4 fade-in cursor-pointer" onclick="loadCharacter('${char.id}')">
                            <div class="flex justify-between items-start mb-2">
                                <div>
                                    <h3 class="fantasy-font font-bold text-amber-900">${char.name}</h3>
                                    <p class="text-xs text-amber-700">${escapeHtml(char.playerName || memberName(char.player))} • ${char.race} ${char.class}</p>
                                </div>
                                <div class="text-right">
                                    <div class="text-xl font-bold text-amber-900 fantasy-font">${char.level}</div>
                                    <div class="text-xs text-amber-700">Lvl</div>
                                </div>
                            </div>
                            <div class="grid grid-cols-3 gap-2 mb-2 text-center text-xs">
                                <div class="bg-amber-100 rounded p-1">
                                    <div class="text-amber-800">HP</div>
                                    <div class="font-bold text-amber-900">${char.hp}/${char.maxHp}</div>
                                </div>
                                <div class="bg-amber-100 rounded p-1">
                                    <div class="text-amber-800">AC</div>
                                    <div class="font-bold text-amber-900">${calcAC(char)}</div>
                                </div>
                                <div class="bg-amber-100 rounded p-1">
                                    <div class="text-amber-800">THAC0</div>
                                    <div class="font-bold text-amber-900">${calcTHAC0(char)}</div>
                                </div>
                            </div>
                            <div class="hp-bar mb-1">
                                <div class="hp-fill" style="width: ${Math.max(0, Math.min(100, (char.hp/char.maxHp)*100))}%"></div>
                            </div>
                            <div class="flex justify-between text-xs text-amber-700 mt-2">
                                <span>STR:${char.stats?.str||10} DEX:${char.stats?.dex||10} CON:${char.stats?.con||10}</span>
                                <span>XP: ${char.xp}</span>
                            </div>
                            <div class="flex flex-wrap gap-1 mt-2">
                                ${conditionBadges(char)}
                                ${(char.conditions || []).map(c => `<span class="condition-badge text-xs">${c}</span>`).join('')}
                            </div>
                            <div class="flex gap-1 mt-2">
                                <button onclick="event.stopPropagation(); endTurnById('${char.id}')" class="btn-galactic px-2 py-1 rounded text-xs">
                                    <i class="fas fa-hourglass-end mr-1"></i>End Turn
                                </button>
                                <button onclick="event.stopPropagation(); restById('${char.id}')" class="btn-fantasy px-2 py-1 rounded text-xs">
                                    <i class="fas fa-bed mr-1"></i>Rest
                                </button>
                                <button onclick="event.stopPropagation(); showConditionModal('${char.id}')" class="btn-magic px-2 py-1 rounded text-xs" title="Add a condition">
                                    <i class="fas fa-plus mr-1"></i>Condition
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

/* ---------- Bring members' characters into this campaign ---------- */
let outsideCloud = {};          // id -> char, other players' characters the DM may see (dmUids)
let outsideSubscribed = false;
let bringOpen = true;

function subscribeOutsideChars() {
    if (outsideSubscribed || !fs || !State.currentUser) return;
    outsideSubscribed = true;
    Cloud.unsubs.push(fs.collection('characters').where('dmUids', 'array-contains', State.currentUser).onSnapshot(snap => {
        outsideCloud = {};
        snap.docs.forEach(d => { outsideCloud[d.id] = docToChar(d); });
        safeRender();
    }, err => console.error('Members characters error', err)));
}

// Characters of this campaign's members (and my own) that are in another campaign or solo
function outsideChars() {
    const cid = State.campaignId;
    const members = Cloud.meta?.members || {};
    const byId = {};
    Object.values(outsideCloud).forEach(c => { byId[c.id] = c; });
    (State.characters || []).filter(c => c.player === State.currentUser).forEach(c => { byId[c.id] = c; });
    return Object.values(byId)
        .filter(c => c.campaignId !== cid && members[c.player])
        .sort((a, b) => memberName(a.player).localeCompare(memberName(b.player)) || (a.name || '').localeCompare(b.name || ''));
}

function whereIs(c) {
    if (!c.campaignId || c.campaignId === 'default') return 'Solo';
    const known = Cloud.campaigns.find(x => x.id === c.campaignId);
    return known ? known.name : 'Another campaign';
}

function renderBringPanel() {
    const list = outsideChars();
    if (!list.length) return '';
    return `
        <div class="parchment scroll-border p-4 mb-4 fade-in">
            <button onclick="bringOpen = !bringOpen; render()" class="w-full flex justify-between items-center text-left">
                <span class="fantasy-font font-bold text-amber-900"><i class="fas fa-people-arrows mr-2 text-amber-700"></i>Players' characters outside this campaign (${list.length})</span>
                <i class="fas fa-chevron-${bringOpen ? 'up' : 'down'} text-amber-700"></i>
            </button>
            ${bringOpen ? `
            <p class="text-xs text-amber-700 mt-1 mb-3">Drag a character onto the party below, or press <b>Bring</b>. It leaves its current campaign and joins this one.</p>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                ${list.map(c => `
                    <div draggable="true" ondragstart="bringDragStart(event, '${c.id}')" data-bring="${c.id}"
                         class="flex items-center justify-between gap-2 p-2 bg-amber-100 rounded border border-amber-300 cursor-grab">
                        <div class="min-w-0">
                            <div class="font-bold text-amber-900 truncate"><i class="fas fa-grip-vertical text-amber-500 mr-1 hidden md:inline"></i>${escapeHtml(c.name || 'Unnamed')}</div>
                            <div class="text-xs text-amber-700 truncate">${escapeHtml(memberName(c.player))} • ${escapeHtml(c.race || '')} ${escapeHtml(c.class || '')} ${c.level || 1} • <i>${escapeHtml(whereIs(c))}</i></div>
                        </div>
                        <button onclick="bringCharacter('${c.id}')" class="btn-fantasy px-3 py-1 rounded text-xs shrink-0"><i class="fas fa-sign-in-alt mr-1"></i>Bring</button>
                    </div>`).join('')}
            </div>` : ''}
        </div>`;
}

function bringDragStart(e, id) { e.dataTransfer.setData('text/plain', 'bring:' + id); e.dataTransfer.effectAllowed = 'move'; }
function partyDragOver(e) { e.preventDefault(); $('partyDrop').classList.add('ring-4', 'ring-green-500'); }
function partyDragLeave(e) { if (!e.currentTarget.contains(e.relatedTarget)) $('partyDrop').classList.remove('ring-4', 'ring-green-500'); }
function partyDrop(e) {
    e.preventDefault();
    $('partyDrop').classList.remove('ring-4', 'ring-green-500');
    const v = e.dataTransfer.getData('text/plain') || '';
    if (v.startsWith('bring:')) bringCharacter(v.slice(6));
}

async function bringCharacter(id) {
    const cid = State.campaignId;
    const c = outsideChars().find(x => x.id === id);
    if (!c || !cid) return;
    const from = whereIs(c);
    if (c.player === State.currentUser) {
        // my own character: the normal save moves it
        const mine = State.characters.find(x => x.id === id);
        mine.campaignId = cid;
        Storage.save();
    } else {
        try {
            await fs.collection('characters').doc(id).update({ campaignId: cid, updatedAt: serverTime() });
        } catch (err) {
            console.error(err);
            return toast(err.code === 'permission-denied' ? 'Not allowed. The player must be a member of this campaign.' : 'Could not move the character.', 'error');
        }
    }
    toast(`${c.name} joined ${currentCampaignName()} (from ${from})`);
}

function dmViewCharacter(id) {
    loadCharacter(id);
}

function showAssignCharModal() {
    const cid = State.campaignId;
    const chars = State.characters.filter(c => c.campaignId === cid);
    const members = Object.entries(Cloud.meta?.members || {}).map(([uid, role]) => ({ uid, role, name: memberName(uid) }))
        .sort((a, b) => a.name.localeCompare(b.name));
    $('modalContainer').innerHTML = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal-content wide" onclick="event.stopPropagation()">
                <div class="p-6">
                    <h2 class="fantasy-font text-xl font-bold text-amber-900 mb-1">Assign Characters to Players</h2>
                    <p class="text-sm text-amber-700 mb-4">The chosen player becomes the owner and can open and edit the character.</p>
                    <div class="space-y-3 max-h-96 overflow-y-auto">
                        ${chars.length === 0 ? '<p class="text-amber-700 italic">No characters in this campaign yet.</p>' : ''}
                        ${chars.map(char => `
                            <div class="flex items-center justify-between p-3 bg-amber-100 rounded border border-amber-300">
                                <div>
                                    <div class="font-bold text-amber-900">${escapeHtml(char.name)}</div>
                                    <div class="text-xs text-amber-700">${char.race} ${char.class} • Level ${char.level}</div>
                                </div>
                                <select onchange="assignCharacterToPlayer('${char.id}', this.value)" class="input-fantasy px-2 py-1 text-sm">
                                    ${members.map(m => `<option value="${m.uid}" ${m.uid === char.player ? 'selected' : ''}>${escapeHtml(m.name)}${m.role === 'dm' ? ' (DM)' : ''}</option>`).join('')}
                                    ${members.some(m => m.uid === char.player) ? '' : `<option value="" selected>${escapeHtml(char.playerName || 'Not in campaign')}</option>`}
                                </select>
                            </div>
                        `).join('')}
                    </div>
                    <div class="mt-4 flex justify-end">
                        <button onclick="closeModal()" class="btn-galactic px-4 py-2 rounded">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function assignCharacterToPlayer(charId, uid) {
    const char = State.characters.find(c => c.id === charId);
    if (!char || !uid) return;
    if (!(Cloud.meta?.members || {})[uid]) return toast('That player is not in this campaign', 'error');
    char.player = uid;
    char.playerName = memberName(uid);
    Storage.save();
    toast(`"${char.name}" now belongs to ${char.playerName}`);
}

function render() { renderDMView(document.getElementById('app')); }

/* Init */
bootPage({ campaign: true, dm: true }, () => { subscribeOutsideChars(); renderDMView(document.getElementById('app')); });

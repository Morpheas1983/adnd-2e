/* dm.js - DM Party View */
function renderDMView(container) {
    const hasCampaignFilter = !!State.campaignId;
    const allChars = State.characters || []; const campaignChars = hasCampaignFilter ? allChars.filter(c => c.campaignId === State.campaignId) : allChars;
    container.innerHTML = `
        <div class="min-h-screen p-4">
            <div class="max-w-6xl mx-auto">
                <div class="parchment scroll-border p-4 mb-4 fade-in">
                    <div class="flex justify-between items-center">
                        <div class="flex items-center gap-3">
						<button onclick="changeView('dashboard')" class="btn-galactic px-3 py-2 rounded text-sm">
    <i class="fas fa-arrow-left"></i> Back
</button>
                            <h1 class="fantasy-font text-2xl font-bold text-amber-900">
                                <i class="fas fa-dungeon mr-2 text-amber-700"></i>DM Party View
                            </h1>
                        </div>
                        <div class="flex gap-2">
                            <div class="text-xs text-amber-800 flex items-center mr-2 border-r border-amber-300 pr-2">
                                <span class="font-bold mr-1">Campaign:</span> ${State.campaignId || 'default'}
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
                                <i class="fas fa-users-cog mr-1"></i>Users
                            </button>
                            <button onclick="showAssignCharModal()" class="btn-fantasy px-4 py-2 rounded text-sm">
                                <i class="fas fa-user-tag mr-1"></i>Assign Chars
                            </button>
                            <button onclick="restAll()" class="btn-fantasy px-4 py-2 rounded text-sm">
                                <i class="fas fa-bed mr-1"></i>Rest All
                            </button>
                            <div class="text-sm text-amber-800 flex items-center">
                                ${campaignChars.length} Characters | ${new Set(campaignChars.map(c => c.player)).size} Players
                            </div>
                        </div>
                    </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    ${campaignChars.length === 0 ? `
                        <div class="col-span-full parchment scroll-border p-8 text-center">
                            <i class="fas fa-scroll text-4xl text-amber-700 mb-3"></i>
                            <p class="fantasy-font text-lg text-amber-900">No characters in this campaign</p>
                        </div>
                    ` : campaignChars.map(char => `
                        <div class="parchment scroll-border p-4 fade-in cursor-pointer" onclick="loadCharacter('${char.id}')">
                            <div class="flex justify-between items-start mb-2">
                                <div>
                                    <h3 class="fantasy-font font-bold text-amber-900">${char.name}</h3>
                                    <p class="text-xs text-amber-700">${char.player} • ${char.race} ${char.class}</p>
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
                                    <div class="font-bold text-amber-900">${getTHAC0(char.class, char.level)}</div>
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
                                ${(char.activeEffects || []).map(e => `<span class="effect-badge text-xs">${e.name}</span>`).join('')}
                                ${(char.conditions || []).map(c => `<span class="condition-badge text-xs">${c}</span>`).join('')}
                            </div>
                            <div class="flex gap-1 mt-2">
                                <button onclick="event.stopPropagation(); endTurnById('${char.id}')" class="btn-galactic px-2 py-1 rounded text-xs">
                                    <i class="fas fa-hourglass-end mr-1"></i>End Turn
                                </button>
                                <button onclick="event.stopPropagation(); restById('${char.id}')" class="btn-fantasy px-2 py-1 rounded text-xs">
                                    <i class="fas fa-bed mr-1"></i>Rest
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

function dmViewCharacter(id) {
    loadCharacter(id);
}

function showAssignCharModal() {
    const unassigned = State.characters.filter(c => !c.player || c.player === 'default' || !(DB.users || []).find(u => u.username === c.player));
    const players = (DB.users || []).filter(u => u.role === 'player');
    $('modalContainer').innerHTML = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal-content wide" onclick="event.stopPropagation()">
                <div class="p-6">
                    <h2 class="fantasy-font text-xl font-bold text-amber-900 mb-4">Assign Characters to Players</h2>
                    <div class="space-y-3 max-h-96 overflow-y-auto">
                        ${unassigned.length === 0 ? '<p class="text-amber-700 italic">All characters are already assigned to players.</p>' : ''}
                        ${unassigned.map(char => `
                            <div class="flex items-center justify-between p-3 bg-amber-100 rounded border border-amber-300">
                                <div>
                                    <div class="font-bold text-amber-900">${char.name}</div>
                                    <div class="text-xs text-amber-700">${char.race} ${char.class} • Level ${char.level}</div>
                                    <div class="text-xs text-amber-600">Current: ${char.player || 'Unassigned'}</div>
                                </div>
                                <select onchange="assignCharacterToPlayer('${char.id}', this.value)" class="input-fantasy px-2 py-1 text-sm">
                                    <option value="">-- Assign to --</option>
                                    ${players.map(u => `<option value="${u.username}">${u.name} (${u.username})</option>`).join('')}
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

function assignCharacterToPlayer(charId, username) {
    const char = State.characters.find(c => c.id === charId);
    if (!char) return toast('Character not found', 'error');
    const user = (DB.users || []).find(u => u.username === username);
    if (!user) return toast('User not found', 'error');
    char.player = username;
    char.lastUpdated = Date.now();
    Storage.save();
    toast(`Character "${char.name}" assigned to ${user.name} (${username})`);
    render();
}

function render() { renderDMView(document.getElementById('app')); }

/* Init */
initApp();
if (!State.currentUser) {
    changeView('login');
} else if (!State.isDM) {
    changeView('dashboard');
} else {
    renderDMView(document.getElementById('app'));
}

/* dashboard.js - Player Dashboard */
function renderDashboard(container) {
    const hasCampaignFilter = !!State.campaignId;
    const campaignChars = hasCampaignFilter 
        ? State.characters.filter(c => c.campaignId === State.campaignId)
        : State.characters;
    const myChars = State.isDM ? State.characters : campaignChars.filter(c => c.player === State.currentUser);

    // For player campaign switcher: only show campaigns this player has characters in
    const playerCampaigns = State.isDM 
        ? [...new Set([...State.characters.map(c => c.campaignId).filter(Boolean), ...getKnownCampaigns()])]
        : [...new Set([...State.characters.filter(c => c.player === State.currentUser).map(c => c.campaignId).filter(Boolean), ...getKnownCampaigns()])];

    container.innerHTML = `
        <div class="min-h-screen p-4">
            <div class="max-w-6xl mx-auto">
                <div class="parchment scroll-border p-6 mb-6 fade-in">
                    <div class="flex justify-between items-center flex-wrap gap-4">
                        <div class="flex items-center gap-3">
                            <i class="fas fa-dragon text-3xl text-amber-700"></i>
                            <div>
                                <h1 class="fantasy-font text-2xl font-bold text-amber-900">AD&D 2e Character Manager</h1>
                                <p class="text-sm text-amber-800">${State.isDM ? 'Dungeon Master View' : `Player: ${State.currentUserName || State.currentUser}`}${State.campaignId ? ` | Campaign: <span class="font-bold text-amber-900">${State.campaignId}</span>` : ' | <span class="font-bold text-amber-900">All Characters</span>'}</p>
                            </div>
                        </div>
                        <div class="flex gap-2 flex-wrap items-center">
                            <span id="firebaseStatus" class="text-xs px-2 py-1 rounded bg-amber-100 text-amber-800 border border-amber-300 mr-1">
                                <i class="fas fa-wifi mr-1"></i>Connecting...
                            </span>
                            <div class="campaign-row flex items-center gap-2 border-r border-amber-300 pr-2 mr-1">
                                <span class="text-xs text-amber-800 font-bold">View:</span>
                                <select id="campaignSwitcher" onchange="switchCampaign(this.value)" class="input-fantasy text-xs px-2 py-1" style="min-width:140px">
                                    <option value="" ${!State.campaignId ? 'selected' : ''}>All Characters</option>
                                    ${playerCampaigns.filter(id => id !== 'default').map(cid => `<option value="${cid}" ${State.campaignId === cid ? 'selected' : ''}>${cid}</option>`).join('')}
                                    ${State.campaignId && !playerCampaigns.includes(State.campaignId) && State.campaignId !== 'default' ? `<option value="${State.campaignId}" selected>${State.campaignId}</option>` : ''}
                                    <option value="default" ${State.campaignId === 'default' ? 'selected' : ''}>Solo Play</option>
                                </select>
                                ${State.isDM ? `
                                    <input type="text" id="newCampaignInput" placeholder="New campaign..." class="input-fantasy text-xs px-2 py-1" style="width:100px" onkeydown="if(event.key==='Enter'){createCampaign($('newCampaignInput').value);}">
                                    <button onclick="createCampaign($('newCampaignInput').value)" class="btn-fantasy px-2 py-1 rounded text-xs" title="Create Campaign"><i class="fas fa-plus"></i></button>
                                ` : ''}
                            </div>
                            ${State.isDM ? `
                                <button onclick="changeView('dm_view')" class="btn-fantasy px-4 py-2 rounded text-sm">
    <i class="fas fa-users mr-1"></i>Party View
</button>
                            ` : ''}
                            <button onclick="changeView('campaign')" class="btn-fantasy px-4 py-2 rounded text-sm">
                                <i class="fas fa-book mr-1"></i>Campaign
                            </button>
                            <button onclick="changeView('tactical')" class="btn-fantasy px-4 py-2 rounded text-sm">
                                <i class="fas fa-chess-board mr-1"></i>Tactical Map
                            </button>
                            <button onclick="changeView('create')" class="btn-fantasy px-4 py-2 rounded text-sm">
                                <i class="fas fa-plus mr-1"></i>New Character
                            </button>
                            <button onclick="restAll()" class="btn-fantasy px-4 py-2 rounded text-sm">
                                <i class="fas fa-bed mr-1"></i>Rest All
                            </button>
                            <button onclick="exportCampaign()" class="btn-galactic px-4 py-2 rounded text-sm">
                                <i class="fas fa-download mr-1"></i>Export
                            </button>
                            <button onclick="importCampaign()" class="btn-galactic px-4 py-2 rounded text-sm">
                                <i class="fas fa-upload mr-1"></i>Import
                            </button>
                            <button onclick="logout()" class="btn-galactic px-4 py-2 rounded text-sm">
                                <i class="fas fa-sign-out-alt mr-1"></i>Logout
                            </button>
                        </div>
                    </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    ${myChars.length === 0 ? `
                        <div class="col-span-full parchment scroll-border p-8 text-center">
                            <i class="fas fa-scroll text-4xl text-amber-700 mb-3"></i>
                            <p class="fantasy-font text-lg text-amber-900">${hasCampaignFilter ? 'No characters in this campaign' : 'No characters found'}</p>
                            <p class="text-amber-800 text-sm mt-2">${hasCampaignFilter ? 'Switch to All Characters or create a new character.' : 'Create your first character to begin your adventure!'}</p>
                        </div>
                    ` : myChars.map(char => `
                        <div class="parchment scroll-border p-4 cursor-pointer hover:shadow-xl transition-all duration-300 fade-in" 
                             onclick="loadCharacter('${char.id}')">
                            <div class="flex justify-between items-start mb-3">
                                <div>
                                    <h3 class="fantasy-font text-lg font-bold text-amber-900">${char.name || 'Unnamed'}</h3>
                                    <p class="text-sm text-amber-800">${char.race} ${char.kit !== 'None' ? char.kit : char.class}</p>
                                    <p class="text-xs text-amber-700">${char.alignment || ''}</p>
                                </div>
                                <div class="text-right">
                                    <div class="text-2xl font-bold text-amber-900 fantasy-font">${char.level || 1}</div>
                                    <div class="text-xs text-amber-700">Level</div>
                                </div>
                            </div>
                            <div class="grid grid-cols-3 gap-2 mb-3">
                                <div class="text-center bg-amber-100 rounded p-1">
                                    <div class="text-xs text-amber-800">HP</div>
                                    <div class="font-bold text-amber-900">${char.hp}/${char.maxHp}</div>
                                </div>
                                <div class="text-center bg-amber-100 rounded p-1">
                                    <div class="text-xs text-amber-800">AC</div>
                                    <div class="font-bold text-amber-900">${calcAC(char)}</div>
                                </div>
                                <div class="text-center bg-amber-100 rounded p-1">
                                    <div class="text-xs text-amber-800">THAC0</div>
                                    <div class="font-bold text-amber-900">${getTHAC0(char.class, char.level)}</div>
                                </div>
                            </div>
                            <div class="hp-bar mb-1">
                                <div class="hp-fill" style="width: ${((char.hp || 0)/(char.maxHp || 1))*100}%"></div>
                            </div>
                            <div class="xp-bar">
                                <div class="xp-fill" style="width: ${Math.min(((char.xp || 0)/getNextXP(char.class, char.level || 1))*100, 100)}%"></div>
                            </div>
                            <div class="flex justify-between text-xs text-amber-700 mt-1">
                                <span>XP: ${char.xp || 0}</span>
                                <span>Next: ${getNextXP(char.class, char.level || 1)}</span>
                            </div>
                            <div class="mt-2 flex flex-wrap gap-1 items-center">
                                ${char.campaignId && char.campaignId !== 'default' ? `<span class="text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded border border-amber-300"><i class="fas fa-campground mr-1"></i>${char.campaignId}</span>` : ''}
                                ${State.isDM ? `<span class="text-xs text-amber-600">${char.player}</span>` : ''}
                                ${(char.activeEffects || []).map(e => `<span class="effect-badge text-xs">${e.name}</span>`).join('')}
                                ${(char.conditions || []).map(c => `<span class="condition-badge text-xs">${c}</span>`).join('')}
                            </div>
                            <div class="mt-2 flex gap-1">
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
    setTimeout(updateConnectionStatus, 0);
}

function switchCampaign(campaignId) {
    const trimmed = campaignId ? campaignId.trim() : null;
    if (!trimmed) {
        State.campaignId = null;
    } else {
        State.campaignId = trimmed;
    }
    Storage.save();
    if (db && firebaseAuth && State.campaignId) {
        setupFirebaseListeners();
    }
    changeView('dashboard');
    if (State.campaignId) {
        toast(`Switched to campaign: ${State.campaignId}`);
    } else {
        toast(`Showing all characters.`);
    }
}

function createCampaign(name) {
    if (!name || !name.trim()) return toast('Please enter a campaign name', 'error');
    const trimmed = name.trim();
    // Check if already exists
    const exists = State.characters.some(c => c.campaignId === trimmed);
    if (exists) {
        switchCampaign(trimmed);
        return;
    }
    // Create by switching to it
    State.campaignId = trimmed;
    rememberCampaign(trimmed);
    Storage.save();
    if (db && firebaseAuth) {
        setupFirebaseListeners();
    }
    changeView('dashboard');
    toast(`Campaign '${trimmed}' created! Create your first character.`);
}

function exportCampaign() {
    const data = {
        characters: State.characters,
        creatures: State.creatures,
        customSpells: State.customSpells,
        campaign: State.campaign,
        exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `adnd_campaign_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Campaign exported!');
}

function importCampaign() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                if (data.characters) State.characters = data.characters;
                if (data.creatures) State.creatures = data.creatures;
                if (data.customSpells) State.customSpells = data.customSpells;
                if (data.campaign) State.campaign = data.campaign;
                Storage.save();
                render();
                toast('Campaign imported successfully!');
            } catch (err) {
                toast('Invalid file format', 'error');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

function render() { renderDashboard(document.getElementById('app')); }

/* Init */
initApp();
if (!State.currentUser) {
    changeView('login');
} else {
    renderDashboard(document.getElementById('app'));
    setTimeout(updateConnectionStatus, 0);
}

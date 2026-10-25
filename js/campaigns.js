/* campaigns.js - Campaign Browser */
function renderCampaigns(container) {
    const campaigns = DB.campaigns || [];
    const searchTerm = (State.campaignSearch || '').toLowerCase();
    const selectedSetting = State.campaignSetting || 'All';
    const settings = ['All', ...new Set(campaigns.map(c => c.setting))].sort();

    let filtered = campaigns;
    if (selectedSetting !== 'All') {
        filtered = filtered.filter(c => c.setting === selectedSetting);
    }
    if (searchTerm) {
        filtered = filtered.filter(c => 
            c.title.toLowerCase().includes(searchTerm) || 
            c.description.toLowerCase().includes(searchTerm) ||
            c.code.toLowerCase().includes(searchTerm)
        );
    }

    container.innerHTML = `
        <div class="min-h-screen p-4">
            <div class="max-w-6xl mx-auto">
                <div class="parchment scroll-border p-4 mb-4 fade-in">
                    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                        <div class="flex items-center gap-3">
                            <button onclick="changeView('dm_view')" class="btn-fantasy px-4 py-2 rounded text-sm">
    <i class="fas fa-users mr-1"></i>Party View
</button>
                            <h1 class="fantasy-font text-2xl font-bold text-amber-900">
                                <i class="fas fa-scroll mr-2 text-amber-700"></i>AD&D 2e Campaigns
                            </h1>
                        </div>
                        <div class="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                            <select onchange="State.campaignSetting=this.value; render();" class="input-fantasy px-3 py-2 rounded text-sm">
                                ${settings.map(s => `<option value="${s}" ${selectedSetting===s?'selected':''}>${s}</option>`).join('')}
                            </select>
                            <div class="flex gap-2">
                                <input type="text" id="campaignSearchInput" placeholder="Search campaigns..." 
                                       value="${State.campaignSearch||''}" 
                                       onkeydown="if(event.key==='Enter'){searchCampaigns();}"
                                       class="input-fantasy px-3 py-2 rounded text-sm w-full md:w-64">
                                <button onclick="searchCampaigns()" class="btn-fantasy px-3 py-2 rounded text-sm">
                                    <i class="fas fa-search mr-1"></i>Search
                                </button>
                                ${State.campaignSearch ? `<button onclick="clearCampaignSearch()" class="btn-galactic px-3 py-2 rounded text-sm"><i class="fas fa-times"></i></button>` : ''}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="parchment scroll-border p-3 mb-4 fade-in">
                    <div class="text-sm text-amber-800">
                        <span class="font-bold">${filtered.length}</span> of <span class="font-bold">${campaigns.length}</span> campaigns
                        ${selectedSetting !== 'All' ? ` • Setting: <span class="font-bold">${selectedSetting}</span>` : ''}
                        ${searchTerm ? ` • Search: "<span class="font-bold">${State.campaignSearch}</span>"` : ''}
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    ${filtered.length === 0 ? `
                        <div class="col-span-full parchment scroll-border p-8 text-center">
                            <i class="fas fa-search text-4xl text-amber-700 mb-3"></i>
                            <p class="fantasy-font text-lg text-amber-900">No campaigns found</p>
                        </div>
                    ` : filtered.map(c => `
                        <div class="parchment scroll-border p-4 fade-in hover:shadow-lg transition-shadow">
                            <div class="flex justify-between items-start mb-2">
                                <span class="text-xs bg-amber-200 text-amber-900 px-2 py-1 rounded">${c.code}</span>
                                <span class="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded border border-amber-300">${c.setting}</span>
                            </div>
                            <h3 class="fantasy-font font-bold text-amber-900 text-sm mb-1">${c.title}</h3>
                            <div class="flex gap-2 mb-2 text-xs">
                                <span class="text-amber-700"><i class="fas fa-layer-group mr-1"></i>${c.levels}</span>
                                <span class="text-amber-700"><i class="fas fa-tag mr-1"></i>${c.type}</span>
                            </div>
                            <p class="text-xs text-amber-800 leading-relaxed mb-3">${c.description}</p>
                            <div class="flex gap-2">
                                <button onclick="State.selectedCampaign = {code: '${c.code}', title: '${c.title.replace(/'/g, "\'")}', setting: '${c.setting}', levels: '${c.levels}', type: '${c.type}', description: '${c.description.replace(/'/g, "\'")}', fullStory: '${(c.fullStory || c.description).replace(/'/g, "\'")}'}; changeView('campaign_detail');" class="btn-fantasy px-3 py-1 rounded text-xs flex-1">
                                    <i class="fas fa-book-open mr-1"></i>Read Story
                                </button>
                                <button onclick="selectCampaign('${c.code.replace(/'/g, "\'")}')" class="btn-galactic px-3 py-1 rounded text-xs">
                                    <i class="fas fa-check"></i>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

function searchCampaigns() {
    const input = document.getElementById('campaignSearchInput');
    if (input) {
        State.campaignSearch = input.value;
        render();
    }
}

function clearCampaignSearch() {
    State.campaignSearch = '';
    render();
}

function selectCampaign(code) {
    const campaign = (DB.campaigns || []).find(c => c.code === code);
    if (!campaign) return;
    State.selectedCampaign = campaign;
    toast(`Campaign selected: ${campaign.title}`);
    Storage.save();
}

function render() { renderCampaigns(document.getElementById('app')); }

/* Init */
initApp();
if (!State.currentUser) {
    changeView('login');
} else if (!State.isDM) {
    changeView('dashboard');
} else {
    renderCampaigns(document.getElementById('app'));
}

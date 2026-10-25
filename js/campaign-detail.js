/* campaign-detail.js - Campaign Story Reader */
function renderCampaignDetail(container) {
    const campaign = State.selectedCampaign;
    if (!campaign) return changeView('campaigns');

    const linkedStory = linkifyStory(campaign.fullStory || campaign.description || 'No story available.');

    container.innerHTML = `
        <div class="min-h-screen p-4">
            <div class="max-w-4xl mx-auto">
                <div class="parchment scroll-border p-4 mb-4 fade-in">
                    <div class="flex justify-between items-center">
                        <div class="flex items-center gap-3">
                            <button onclick="goBack()" class="btn-galactic px-3 py-2 rounded text-sm"><i class="fas fa-arrow-left"></i> Back to Campaigns
                            </button>
                            <h1 class="fantasy-font text-2xl font-bold text-amber-900">${campaign.title}</h1>
                        </div>
                        <div class="flex gap-2">
                            <span class="text-xs bg-amber-200 text-amber-900 px-2 py-1 rounded">${campaign.code}</span>
                            <span class="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded border border-amber-300">${campaign.setting}</span>
                        </div>
                    </div>
                </div>

                <div class="parchment scroll-border p-6 mb-4 fade-in">
                    <div class="flex justify-between items-center mb-4">
                        <div class="flex gap-2 text-sm text-amber-800">
                            <span><i class="fas fa-layer-group mr-1"></i><strong>Levels:</strong> ${campaign.levels}</span>
                            <span><i class="fas fa-tag mr-1"></i><strong>Type:</strong> ${campaign.type}</span>
                        </div>
                        <button onclick="selectCampaign('${campaign.code.replace(/'/g, "\'")}')" class="btn-fantasy px-4 py-2 rounded text-sm">
                            <i class="fas fa-check mr-1"></i>Use This Campaign
                        </button>
                    </div>

                    <div class="section-header"><i class="fas fa-book-open"></i>Full Campaign Story</div>
                    <div class="text-sm text-amber-900 leading-relaxed space-y-4 parchment p-4 rounded border border-amber-300" style="min-height: 300px;">
                        ${linkedStory}
                    </div>
                    <p class="text-xs text-amber-700 mt-3 italic">
                        <i class="fas fa-mouse-pointer mr-1"></i>Click on any highlighted monster name to view its stats and details.
                    </p>
                </div>

                <div class="parchment scroll-border p-4 fade-in">
                    <div class="section-header"><i class="fas fa-dragon"></i>Featured Monsters</div>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                        ${(() => {
                            const storyText = (campaign.fullStory || campaign.description || '').toLowerCase();
                            const featured = Object.keys(DB.monsters).filter(m => storyText.includes(m.toLowerCase())).slice(0, 8);
                            if (featured.length === 0) return '<p class="text-amber-700 italic col-span-full">No specific monsters featured in this campaign summary.</p>';
                            return featured.map(m => {
                                const mon = DB.monsters[m];
                                return `
                                    <div class="p-2 bg-amber-100 rounded border border-amber-300 cursor-pointer hover:bg-amber-200 transition-colors" onclick="showMonsterDetail('${m.replace(/'/g, "\'")}')">
                                        <div class="font-bold text-amber-900 text-sm">${m}</div>
                                        <div class="text-xs text-amber-700">AC ${mon.ac} • HD ${mon.hd}</div>
                                        <div class="text-xs text-amber-600">${mon.category}</div>
                                    </div>
                                `;
                            }).join('');
                        })()}
                    </div>
                </div>
            </div>
        </div>
    `;
}

function render() { renderCampaignDetail(document.getElementById('app')); }

/* Init */
initApp();
if (!State.currentUser) {
    changeView('login');
} else if (!State.selectedCampaign) {
    changeView('campaigns');
} else {
    renderCampaignDetail(document.getElementById('app'));
}

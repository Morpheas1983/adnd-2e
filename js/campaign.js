/* campaign.js - Campaign Journal */
function renderCampaign(container) {
    const isDM = State.isDM;
    const campaign = State.campaign || {};
    const activeTab = State.campaignTab || 'story';
    
    container.innerHTML = `
        <div class="min-h-screen p-4">
            <div class="max-w-5xl mx-auto">
                <div class="parchment scroll-border p-4 mb-4 fade-in">
                    <div class="flex justify-between items-center flex-wrap gap-2">
                        <div class="flex items-center gap-3">
						<button onclick="changeView('dm_view')" class="btn-fantasy px-4 py-2 rounded text-sm">
    <i class="fas fa-users mr-1"></i>Party View
</button>
                            <h1 class="fantasy-font text-2xl font-bold text-amber-900">Campaign Journal</h1>
                        </div>
                        <div class="flex items-center gap-2">
                            <span id="firebaseStatus" class="text-xs px-2 py-1 rounded bg-amber-100 text-amber-800 border border-amber-300">
                                <i class="fas fa-wifi mr-1"></i>...
                            </span>
                        </div>
                    </div>
                </div>
                
                <div class="parchment scroll-border p-4 fade-in">
                    <div class="flex gap-1 mb-4 border-b-2 border-amber-300 pb-2 overflow-x-auto">
                        <button class="tab-btn ${activeTab==='story'?'active':''}" onclick="setCampaignTab('story')">
                            <i class="fas fa-book-open mr-1"></i>Story
                        </button>
                        <button class="tab-btn ${activeTab==='log'?'active':''}" onclick="setCampaignTab('log')">
                            <i class="fas fa-scroll mr-1"></i>Session Log
                        </button>
                        ${isDM ? `
                        <button class="tab-btn ${activeTab==='dmnotes'?'active':''}" onclick="setCampaignTab('dmnotes')">
                            <i class="fas fa-eye-slash mr-1"></i>DM Notes
                        </button>
                        ` : ''}
                        <button class="tab-btn ${activeTab==='party'?'active':''}" onclick="setCampaignTab('party')">
                            <i class="fas fa-users mr-1"></i>Party Notes
                        </button>
                        <button class="tab-btn ${activeTab==='mynotes'?'active':''}" onclick="setCampaignTab('mynotes')">
                            <i class="fas fa-user-secret mr-1"></i>My Notes
                        </button>
                    </div>
                    
                    <div id="campaignTabContent"></div>
                </div>
            </div>
        </div>
    `;
    
    setTimeout(() => renderCampaignTab(activeTab), 0);
}

function renderCampaignTab(tab) {
    const content = $('campaignTabContent');
    const campaign = State.campaign || {};
    const isDM = State.isDM;
    
    if (tab === 'story') {
        content.innerHTML = `
            <div class="space-y-4">
                <div class="flex justify-between items-center">
                    <h2 class="fantasy-font text-xl font-bold text-amber-900">Campaign Story</h2>
                    ${isDM ? `<button onclick="saveCampaignStory()" class="btn-fantasy px-4 py-2 rounded text-sm"><i class="fas fa-save mr-1"></i>Save</button>` : ''}
                </div>
                <textarea id="campaignStory" class="input-fantasy w-full px-4 py-3 h-96 resize-none font-serif text-amber-900 leading-relaxed" 
                    ${isDM ? '' : 'readonly'}>${campaign.story || ''}</textarea>
                ${!isDM ? '<p class="text-xs text-amber-700 italic mt-2"><i class="fas fa-lock mr-1"></i>Only the DM can edit the campaign story.</p>' : ''}
            </div>
        `;
    }
    else if (tab === 'log') {
        const sessions = campaign.sessions || [];
        content.innerHTML = `
            <div class="space-y-4">
                <div class="flex justify-between items-center">
                    <h2 class="fantasy-font text-xl font-bold text-amber-900">Session Log</h2>
                    ${isDM ? `<button onclick="showAddSessionModal()" class="btn-fantasy px-4 py-2 rounded text-sm"><i class="fas fa-plus mr-1"></i>Add Entry</button>` : ''}
                </div>
                <div class="space-y-3">
                    ${sessions.length === 0 ? '<p class="text-amber-700 italic text-center py-8">No sessions recorded yet. The DM can add session summaries here.</p>' : ''}
                    ${sessions.slice().reverse().map((s, i) => `
                        <div class="bg-amber-50 rounded border border-amber-300 p-4">
                            <div class="flex justify-between items-start mb-2">
                                <h3 class="font-bold text-amber-900 text-lg">${s.title || 'Untitled Session'}</h3>
                                <span class="text-xs text-amber-700 bg-amber-200 px-2 py-1 rounded">${s.date || 'Unknown date'}</span>
                            </div>
                            <p class="text-sm text-amber-800 whitespace-pre-wrap leading-relaxed">${s.content || ''}</p>
                            ${isDM ? `<button onclick="deleteSession(${sessions.length - 1 - i})" class="text-red-700 text-xs mt-2 hover:underline"><i class="fas fa-trash mr-1"></i>Delete</button>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    else if (tab === 'dmnotes' && isDM) {
        content.innerHTML = `
            <div class="space-y-4">
                <div class="flex justify-between items-center">
                    <h2 class="fantasy-font text-xl font-bold text-amber-900"><i class="fas fa-eye-slash mr-2"></i>DM Secret Notes</h2>
                    <button onclick="saveDMNotes()" class="btn-fantasy px-4 py-2 rounded text-sm"><i class="fas fa-save mr-1"></i>Save</button>
                </div>
                <textarea id="dmNotesArea" class="input-fantasy w-full px-4 py-3 h-96 resize-none leading-relaxed">${campaign.dmNotes || ''}</textarea>
            </div>
        `;
    }
    else if (tab === 'party') {
        content.innerHTML = `
            <div class="space-y-4">
                <div class="flex justify-between items-center">
                    <h2 class="fantasy-font text-xl font-bold text-amber-900">Party Notes</h2>
                    <button onclick="savePartyNotes()" class="btn-fantasy px-4 py-2 rounded text-sm"><i class="fas fa-save mr-1"></i>Save</button>
                </div>
                <p class="text-sm text-amber-700">These notes are shared with the whole party. Everyone can edit and they sync in real-time.</p>
                <textarea id="partyNotesArea" class="input-fantasy w-full px-4 py-3 h-96 resize-none leading-relaxed">${campaign.partyNotes || ''}</textarea>
            </div>
        `;
    }
    else if (tab === 'mynotes') {
        const myNotes = (campaign.playerNotes || {})[State.currentUser] || '';
        content.innerHTML = `
            <div class="space-y-4">
                <div class="flex justify-between items-center">
                    <h2 class="fantasy-font text-xl font-bold text-amber-900">My Personal Notes</h2>
                    <button onclick="saveMyNotes()" class="btn-fantasy px-4 py-2 rounded text-sm"><i class="fas fa-save mr-1"></i>Save</button>
                </div>
                <p class="text-sm text-amber-700">Only you can see these notes. They are tied to your login name.</p>
                <textarea id="myNotesArea" class="input-fantasy w-full px-4 py-3 h-96 resize-none leading-relaxed">${myNotes}</textarea>
            </div>
        `;
    }
    setTimeout(updateConnectionStatus, 0);
}

function setCampaignTab(tab) {
    State.campaignTab = tab;
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        const btnTab = btn.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
        if (btnTab === tab) btn.classList.add('active');
    });
    renderCampaignTab(tab);
}

function saveCampaignStory() {
    State.campaign = State.campaign || {};
    State.campaign.story = $('campaignStory').value;
    Storage.save();
    toast('Campaign story saved!');
}

function saveDMNotes() {
    State.campaign = State.campaign || {};
    State.campaign.dmNotes = $('dmNotesArea').value;
    Storage.save();
    toast('DM notes saved!');
}

function savePartyNotes() {
    State.campaign = State.campaign || {};
    State.campaign.partyNotes = $('partyNotesArea').value;
    Storage.save();
    toast('Party notes saved!');
}

function saveMyNotes() {
    State.campaign = State.campaign || {};
    State.campaign.playerNotes = State.campaign.playerNotes || {};
    State.campaign.playerNotes[State.currentUser] = $('myNotesArea').value;
    Storage.save();
    toast('Personal notes saved!');
}

function showAddSessionModal() {
    $('modalContainer').innerHTML = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal-content" onclick="event.stopPropagation()">
                <div class="p-6">
                    <h2 class="fantasy-font text-xl font-bold text-amber-900 mb-4">Add Session Entry</h2>
                    <div class="space-y-3">
                        <div>
                            <label class="block text-sm font-bold text-amber-900 mb-1">Session Title</label>
                            <input type="text" id="sessionTitle" class="input-fantasy w-full px-3 py-2" placeholder="e.g., The Dungeon of Shadows">
                        </div>
                        <div>
                            <label class="block text-sm font-bold text-amber-900 mb-1">Date</label>
                            <input type="date" id="sessionDate" class="input-fantasy w-full px-3 py-2" value="${new Date().toISOString().split('T')[0]}">
                        </div>
                        <div>
                            <label class="block text-sm font-bold text-amber-900 mb-1">What Happened?</label>
                            <textarea id="sessionContent" class="input-fantasy w-full px-3 py-2 h-32 resize-none" placeholder="Describe the events of the session..."></textarea>
                        </div>
                    </div>
                    <div class="flex justify-end gap-2 mt-4">
                        <button onclick="closeModal()" class="btn-galactic px-4 py-2 rounded">Cancel</button>
                        <button onclick="addSessionEntry()" class="btn-fantasy px-4 py-2 rounded">Add Entry</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function addSessionEntry() {
    const title = $('sessionTitle').value.trim();
    const date = $('sessionDate').value;
    const content = $('sessionContent').value.trim();
    if (!title) return toast('Title required', 'error');
    
    State.campaign = State.campaign || {};
    State.campaign.sessions = State.campaign.sessions || [];
    State.campaign.sessions.push({ title, date, content });
    Storage.save();
    closeModal();
    renderCampaignTab('log');
    toast('Session added!');
}

function deleteSession(idx) {
    if (!confirm('Delete this session entry?')) return;
    State.campaign.sessions.splice(idx, 1);
    Storage.save();
    renderCampaignTab('log');
}

function render() { renderCampaign(document.getElementById('app')); }

/* Init */
initApp();
if (!State.currentUser) {
    changeView('login');
} else {
    renderCampaign(document.getElementById('app'));
    setTimeout(updateConnectionStatus, 0);
}

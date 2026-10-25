/* dashboard.js - Player Dashboard */
function renderDashboard(container) {
    const cid = State.campaignId;
    const inCampaign = !!cid;
    const campaignChars = inCampaign ? State.characters.filter(c => c.campaignId === cid) : State.characters;
    // DM sees the whole party; players see their own characters
    const myChars = inCampaign
        ? (State.isDM ? campaignChars : campaignChars.filter(c => c.player === State.currentUser))
        : State.characters.filter(c => c.player === State.currentUser);
    const hasCampaignFilter = inCampaign;
    const role = inCampaign ? (Cloud.isAdmin && !(Cloud.meta?.members || {})[State.currentUser] ? 'Admin' : (State.isDM ? 'Dungeon Master' : 'Player')) : '';
    const invite = State.isDM && Cloud.meta ? Cloud.meta.inviteCode : '';

    container.innerHTML = `
        <div class="min-h-screen p-4">
            <div class="max-w-6xl mx-auto">
                <div class="parchment scroll-border p-6 mb-6 fade-in">
                    <div class="flex justify-between items-center flex-wrap gap-4">
                        <div class="flex items-center gap-3">
                            <i class="fas fa-dragon text-3xl text-amber-700"></i>
                            <div>
                                <h1 class="fantasy-font text-2xl font-bold text-amber-900">AD&D 2e Character Manager</h1>
                                <p class="text-sm text-amber-800">
                                    <i class="fas fa-user mr-1"></i>${escapeHtml(State.currentUserName)}${Cloud.isAdmin ? ' <span class="text-xs bg-amber-700 text-amber-50 px-1 rounded">ADMIN</span>' : ''}
                                    ${inCampaign ? ` | <span class="font-bold text-amber-900">${escapeHtml(currentCampaignName())}</span> (${role})` : ' | <span class="font-bold text-amber-900">All my characters</span>'}
                                </p>
                            </div>
                        </div>
                        <div class="flex gap-2 flex-wrap items-center">
                            <span id="firebaseStatus" class="text-xs px-2 py-1 rounded bg-amber-100 text-amber-800 border border-amber-300 mr-1">
                                <i class="fas fa-wifi mr-1"></i>Connecting...
                            </span>
                            <div class="campaign-row flex items-center gap-2 border-r border-amber-300 pr-2 mr-1">
                                <span class="text-xs text-amber-800 font-bold">Campaign:</span>
                                <select id="campaignSwitcher" onchange="onCampaignSelect(this.value)" class="input-fantasy text-xs px-2 py-1" style="min-width:160px">
                                    <option value="" ${!cid ? 'selected' : ''}>All my characters</option>
                                    ${Cloud.campaigns.map(c => `<option value="${c.id}" ${cid === c.id ? 'selected' : ''}>${escapeHtml(c.name)}${c.role === 'dm' ? ' (DM)' : c.role === 'admin' ? ' (admin)' : ''}</option>`).join('')}
                                    <option value="__new">+ Create a campaign…</option>
                                    <option value="__join">+ Join with invite code…</option>
                                </select>
                            </div>
                            ${State.isDM ? `
                                <button onclick="changeView('dm_view')" class="btn-fantasy px-4 py-2 rounded text-sm">
    <i class="fas fa-users mr-1"></i>Party View
</button>
                            ` : ''}
                            ${inCampaign ? `
                            <button onclick="changeView('campaign')" class="btn-fantasy px-4 py-2 rounded text-sm">
                                <i class="fas fa-book mr-1"></i>Campaign
                            </button>
                            <button onclick="changeView('tactical')" class="btn-fantasy px-4 py-2 rounded text-sm">
                                <i class="fas fa-chess-board mr-1"></i>Tactical Map
                            </button>
                            <button onclick="changeView('users')" class="btn-fantasy px-4 py-2 rounded text-sm">
                                <i class="fas fa-user-friends mr-1"></i>Players
                            </button>` : ''}
                            <button onclick="changeView('create')" class="btn-fantasy px-4 py-2 rounded text-sm">
                                <i class="fas fa-plus mr-1"></i>New Character
                            </button>
                            ${State.isDM ? `<button onclick="restAll()" class="btn-fantasy px-4 py-2 rounded text-sm">
                                <i class="fas fa-bed mr-1"></i>Rest All
                            </button>` : ''}
                            <button onclick="exportCampaign()" class="btn-galactic px-4 py-2 rounded text-sm">
                                <i class="fas fa-download mr-1"></i>Export
                            </button>
                            <button onclick="showImportModal()" class="btn-galactic px-4 py-2 rounded text-sm">
                                <i class="fas fa-upload mr-1"></i>Import
                            </button>
                            ${Cloud.isAdmin && !inCampaign ? `<button onclick="changeView('users')" class="btn-galactic px-4 py-2 rounded text-sm">
                                <i class="fas fa-users-cog mr-1"></i>Users
                            </button>` : ''}
                            <button onclick="logout()" class="btn-galactic px-4 py-2 rounded text-sm">
                                <i class="fas fa-sign-out-alt mr-1"></i>Logout
                            </button>
                        </div>
                    </div>
                    ${invite ? `
                    <div class="mt-4 p-3 rounded border border-amber-300 bg-amber-50 text-sm text-amber-900 flex flex-wrap items-center gap-2">
                        <i class="fas fa-ticket-alt text-amber-700"></i>
                        <span>Invite code: <b class="fantasy-font text-lg tracking-widest">${invite}</b></span>
                        <button onclick="copyInvite()" class="btn-galactic px-3 py-1 rounded text-xs"><i class="fas fa-link mr-1"></i>Copy invite link</button>
                        <span class="text-xs text-amber-700">Players open the link (or enter the code) to join this campaign.</span>
                    </div>` : ''}
                    ${Cloud.user && Cloud.user.email && !Cloud.user.emailVerified && Cloud.user.providerData.some(p => p.providerId === 'password') ? `
                    <div class="mt-3 text-xs text-amber-800"><i class="fas fa-envelope mr-1"></i>Please confirm your email address (check your inbox). <button class="underline" onclick="Cloud.user.sendEmailVerification().then(()=>toast('Verification email sent'))">Resend</button></div>` : ''}
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    ${myChars.length === 0 ? `
                        <div class="col-span-full parchment scroll-border p-8 text-center">
                            <i class="fas fa-scroll text-4xl text-amber-700 mb-3"></i>
                            <p class="fantasy-font text-lg text-amber-900">${hasCampaignFilter ? 'No characters in this campaign' : 'No characters found'}</p>
                            <p class="text-amber-800 text-sm mt-2">${hasCampaignFilter ? 'Create a new character for this campaign.' : 'Create your first character, or create/join a campaign from the Campaign menu.'}</p>
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
                                ${char.campaignId && char.campaignId !== 'default' && !inCampaign ? `<span class="text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded border border-amber-300"><i class="fas fa-campground mr-1"></i>${escapeHtml(campaignNameById(char.campaignId) || 'Campaign')}</span>` : ''}
                                ${State.isDM && char.player !== State.currentUser ? `<span class="text-xs text-amber-600"><i class="fas fa-user mr-1"></i>${escapeHtml(char.playerName || memberName(char.player))}</span>` : ''}
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





function render() { renderDashboard(document.getElementById('app')); }

function onCampaignSelect(value) {
    if (value === '__new') {
        const name = prompt('Name of the new campaign:');
        if (name) createCampaign(name); else render();
    } else if (value === '__join') {
        const code = prompt('Enter the invite code from your DM:');
        if (code) joinCampaign(code); else render();
    } else switchCampaign(value);
}

function copyInvite() {
    const link = inviteLink(Cloud.meta.inviteCode);
    const done = () => toast('Invite link copied: send it to your players');
    if (navigator.clipboard) navigator.clipboard.writeText(link).then(done, () => prompt('Copy this invite link:', link));
    else prompt('Copy this invite link:', link);
}

/* Init */
bootPage({}, () => renderDashboard(document.getElementById('app')));

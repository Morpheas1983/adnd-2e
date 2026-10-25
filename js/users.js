/* users.js - Players & campaign membership (and the admin's user list) */
let adminUsers = null;   // loaded on demand for admins

function renderUsers(container) {
    const meta = Cloud.meta;
    const inCampaign = !!(State.campaignId && meta);
    const members = inCampaign
        ? Object.entries(meta.members || {}).map(([uid, role]) => ({ uid, role, name: memberName(uid) }))
            .sort((a, b) => (a.role === b.role ? a.name.localeCompare(b.name) : a.role === 'dm' ? -1 : 1))
        : [];
    const isOwner = inCampaign && meta.ownerUid === State.currentUser;

    container.innerHTML = `
        <div class="min-h-screen p-4">
            <div class="max-w-4xl mx-auto">
                <div class="parchment scroll-border p-4 mb-4 fade-in">
                    <div class="flex justify-between items-center flex-wrap gap-3">
                        <div class="flex items-center gap-3">
                            <button onclick="changeView('dashboard')" class="btn-galactic px-3 py-2 rounded text-sm">
                                <i class="fas fa-arrow-left"></i> Back
                            </button>
                            <h1 class="fantasy-font text-2xl font-bold text-amber-900">
                                <i class="fas fa-user-friends mr-2 text-amber-700"></i>${inCampaign ? escapeHtml(meta.name) + ': Players' : 'Users'}
                            </h1>
                        </div>
                    </div>
                </div>

                ${inCampaign ? `
                ${State.isDM ? `
                <div class="parchment scroll-border p-4 mb-4 fade-in">
                    <div class="section-header"><i class="fas fa-ticket-alt"></i>Invite Players</div>
                    <p class="text-sm text-amber-800 mb-3">Send the link (or the code) to your players. They create an account (or sign in) and join automatically.</p>
                    <div class="flex flex-wrap items-center gap-2">
                        <span class="fantasy-font text-2xl tracking-widest text-amber-900 bg-amber-50 border border-amber-300 rounded px-3 py-1">${meta.inviteCode || '—'}</span>
                        <button onclick="copyInviteLink()" class="btn-fantasy px-3 py-2 rounded text-sm"><i class="fas fa-link mr-1"></i>Copy invite link</button>
                        <button onclick="if(confirm('Create a new code? The old code and link will stop working.')) regenerateInvite()" class="btn-galactic px-3 py-2 rounded text-sm"><i class="fas fa-sync-alt mr-1"></i>New code</button>
                    </div>
                </div>` : ''}

                <div class="parchment scroll-border p-4 mb-4 fade-in">
                    <div class="section-header"><i class="fas fa-users"></i>Members (${members.length})</div>
                    <div class="space-y-2">
                        ${members.map(m => `
                        <div class="flex flex-wrap items-center justify-between gap-2 p-3 bg-amber-100 rounded border border-amber-300">
                            <div>
                                <div class="font-bold text-amber-900">${escapeHtml(m.name)}${m.uid === State.currentUser ? ' <span class="text-xs text-amber-700">(you)</span>' : ''}</div>
                                <div class="text-xs text-amber-700">${m.role === 'dm' ? '<i class="fas fa-dungeon mr-1"></i>Dungeon Master' : '<i class="fas fa-user-shield mr-1"></i>Player'}${m.uid === meta.ownerUid ? ' • Owner' : ''}
                                    • ${State.characters.filter(c => c.campaignId === State.campaignId && c.player === m.uid).length} character(s)</div>
                            </div>
                            <div class="flex gap-2">
                                ${State.isDM && m.uid !== meta.ownerUid ? `
                                    ${m.role === 'dm'
                                        ? `<button onclick="setMemberRole('${m.uid}','player')" class="btn-galactic px-3 py-1 rounded text-xs">Make player</button>`
                                        : `<button onclick="setMemberRole('${m.uid}','dm')" class="btn-galactic px-3 py-1 rounded text-xs">Make co-DM</button>`}
                                    ${m.uid !== State.currentUser ? `<button onclick="removeMember('${m.uid}')" class="btn-danger px-3 py-1 rounded text-xs"><i class="fas fa-user-minus mr-1"></i>Remove</button>` : ''}
                                ` : ''}
                                ${m.uid === State.currentUser && m.uid !== meta.ownerUid ? `<button onclick="removeMember('${m.uid}')" class="btn-danger px-3 py-1 rounded text-xs"><i class="fas fa-door-open mr-1"></i>Leave campaign</button>` : ''}
                            </div>
                        </div>`).join('')}
                    </div>
                </div>

                ${isOwner || Cloud.isAdmin ? `
                <div class="parchment scroll-border p-4 mb-4 fade-in">
                    <div class="section-header"><i class="fas fa-exclamation-triangle"></i>Danger Zone</div>
                    <p class="text-sm text-amber-800 mb-3">Deleting the campaign removes its journal, notes, creatures and maps. Characters are kept and become solo characters of their owners.</p>
                    <button onclick="deleteCampaign()" class="btn-danger px-4 py-2 rounded text-sm"><i class="fas fa-trash mr-1"></i>Delete campaign</button>
                </div>` : ''}
                ` : ''}

                ${Cloud.isAdmin ? `
                <div class="parchment scroll-border p-4 mb-4 fade-in">
                    <div class="section-header"><i class="fas fa-users-cog"></i>All Registered Users (admin)</div>
                    <div id="adminUserList" class="space-y-2">${renderAdminUserList()}</div>
                </div>
                <div class="parchment scroll-border p-4 mb-4 fade-in">
                    <div class="section-header"><i class="fas fa-campground"></i>All Campaigns (admin)</div>
                    <div class="space-y-2">
                        ${Cloud.campaigns.length === 0 ? '<p class="text-amber-700 italic">No campaigns yet.</p>' : Cloud.campaigns.map(c => `
                        <div class="flex flex-wrap items-center justify-between gap-2 p-3 bg-amber-100 rounded border border-amber-300">
                            <div class="font-bold text-amber-900">${escapeHtml(c.name)}</div>
                            <button onclick="switchCampaign('${c.id}')" class="btn-galactic px-3 py-1 rounded text-xs">Open</button>
                        </div>`).join('')}
                    </div>
                </div>` : ''}
            </div>
        </div>
    `;
    if (Cloud.isAdmin && adminUsers === null) loadAdminUsers();
}

function renderAdminUserList() {
    if (adminUsers === null) return '<p class="text-amber-700 italic">Loading…</p>';
    if (!adminUsers.length) return '<p class="text-amber-700 italic">No users yet.</p>';
    return adminUsers.map(u => `
        <div class="p-3 bg-amber-100 rounded border border-amber-300 flex flex-wrap justify-between gap-2">
            <div>
                <div class="font-bold text-amber-900">${escapeHtml(u.displayName || '(no name)')}</div>
                <div class="text-xs text-amber-700">${escapeHtml(u.email || '')}</div>
            </div>
            <div class="text-xs text-amber-700 text-right">Last sign-in<br>${u.lastLogin && u.lastLogin.toDate ? u.lastLogin.toDate().toLocaleString() : '—'}</div>
        </div>`).join('');
}

async function loadAdminUsers() {
    try {
        const snap = await fs.collection('users').get();
        adminUsers = snap.docs.map(d => d.data()).sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));
    } catch (err) {
        console.error(err);
        adminUsers = [];
        toast('Could not load the user list', 'error');
    }
    const el = document.getElementById('adminUserList');
    if (el) el.innerHTML = renderAdminUserList();
}

function copyInviteLink() {
    const link = inviteLink(Cloud.meta.inviteCode);
    const done = () => toast('Invite link copied');
    if (navigator.clipboard) navigator.clipboard.writeText(link).then(done, () => prompt('Copy this invite link:', link));
    else prompt('Copy this invite link:', link);
}

function render() { renderUsers(document.getElementById('app')); }

bootPage({}, () => {
    if (!State.campaignId && !Cloud.isAdmin) return changeView('dashboard');
    renderUsers(document.getElementById('app'));
});

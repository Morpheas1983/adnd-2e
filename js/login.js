/* login.js - Login View */
function renderLogin(container) {
    const chars = State.characters || [];
    const allCampaigns = [...new Set(chars.map(c => c.campaignId).filter(Boolean))].filter(id => id !== 'default').sort();
    container.innerHTML = `
        <div class="min-h-screen flex items-center justify-center p-4">
            <div class="parchment scroll-border p-8 max-w-md w-full text-center fade-in">
                <div class="mb-6">
                    <i class="fas fa-dragon text-6xl text-amber-700 mb-4"></i>
                    <h1 class="fantasy-font text-3xl font-bold text-amber-900 mb-2">AD&D 2nd Edition</h1>
                    <p class="text-amber-800 italic">Character Sheet Manager</p>
                </div>
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-bold text-amber-900 mb-1">Username</label>
                        <input type="text" id="loginUsername" placeholder="Enter username..." 
                            class="input-fantasy w-full px-4 py-3 text-center text-lg">
                    </div>
                    <div>
                        <label class="block text-sm font-bold text-amber-900 mb-1">Password</label>
                        <input type="password" id="loginPassword" placeholder="Enter password..." 
                            class="input-fantasy w-full px-4 py-3 text-center text-lg">
                    </div>
                    <div>
                        <label class="block text-sm font-bold text-amber-900 mb-1">Campaign</label>
                        <select id="loginCampaign" class="input-fantasy w-full px-4 py-3 text-center text-lg">
                            <option value="">All Characters</option>
                            ${allCampaigns.map(cid => `<option value="${cid}">${cid}</option>`).join('')}
                            <option value="default">Solo Play (default)</option>
                        </select>
                        <p class="text-xs text-amber-700 mt-1">Select a campaign to join your party, or view all your characters.</p>
                    </div>
                    <div class="flex gap-3">
                        <button onclick="login('player')" class="btn-fantasy flex-1 py-3 rounded-lg font-bold">
                            <i class="fas fa-user-shield mr-2"></i>Player Login
                        </button>
                        <button onclick="login('dm')" class="btn-galactic flex-1 py-3 rounded-lg font-bold">
                            <i class="fas fa-dungeon mr-2"></i>DM Login
                        </button>
                    </div>
                </div>
                <div class="mt-6 text-xs text-amber-800 opacity-70">
                    <p>Data syncs via Firebase Realtime Database.</p>
                    <p>Local backup is always kept for offline play.</p>
                    <p class="mt-1 text-green-700"><i class="fas fa-wifi mr-1"></i>Live sync enabled across devices.</p>
                </div>
                <div class="mt-4 p-3 bg-amber-100 rounded border border-amber-300 text-xs text-amber-800">
                    <p class="font-bold mb-1">Default Accounts:</p>
                    <p><strong>DM:</strong> username: <code>dm</code> / password: <code>password</code></p>
                    <p><strong>Player:</strong> username: <code>player1</code> / password: <code>password</code></p>
                    <p><strong>Player:</strong> username: <code>player2</code> / password: <code>password</code></p>
                </div>
            </div>
        </div>
    `;
}

function login(requestedRole) {
    // Ensure users are loaded from localStorage before checking credentials
    const savedUsers = localStorage.getItem('adnd2e_users');
    if (savedUsers) {
        try { DB.users = JSON.parse(savedUsers); } catch(e) {}
    }

    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const campaignId = document.getElementById('loginCampaign')?.value || '';

    if (!username) return toast('Please enter your username', 'error');
    if (!password) return toast('Please enter your password', 'error');

    const user = verifyCredentials(username, password);
    if (!user) return toast('Invalid username or password', 'error');

    if (requestedRole === 'dm' && user.role !== 'dm') {
        return toast('You do not have DM privileges', 'error');
    }

    State.currentUser = user.username;
    State.currentUserName = user.name;
    State.isDM = user.role === 'dm';
    State.campaignId = campaignId || null;
    State.view = 'dashboard';
    Storage.save();
    render();
    toast(`Welcome, ${user.name}! (${user.role === 'dm' ? 'DM' : 'Player'})`);
}

function render() { changeView('dashboard'); }

/* Init */
initApp();
if (State.currentUser) {
    changeView('dashboard');
} else {
    renderLogin(document.getElementById('app'));
}

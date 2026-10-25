/* users.js - User Management (DM Only) */
function renderUsers(container) {
    if (!isDM()) {
        container.innerHTML = `
            <div class="min-h-screen p-8 text-center">
                <div class="parchment scroll-border p-6 max-w-lg mx-auto">
                    <i class="fas fa-lock text-4xl text-red-700 mb-4"></i>
                    <h2 class="fantasy-font text-xl text-red-900 mb-2">Access Denied</h2>
                    <p class="text-amber-800">Only the Dungeon Master can manage users.</p>
                    <button onclick="goBack()" class="btn-galactic px-4 py-2 rounded mt-4">Back to Dashboard</button>
                </div>
            </div>
        `;
        return;
    }

    const users = listUsers();

    container.innerHTML = `
        <div class="min-h-screen p-4">
            <div class="max-w-4xl mx-auto">
                <div class="parchment scroll-border p-4 mb-4 fade-in">
                    <div class="flex justify-between items-center">
                        <div class="flex items-center gap-3">
                            <button onclick="goBack()" class="btn-galactic px-3 py-2 rounded text-sm">
                                <i class="fas fa-arrow-left"></i> Back
                            </button>
                            <h1 class="fantasy-font text-2xl font-bold text-amber-900">
                                <i class="fas fa-users-cog mr-2 text-amber-700"></i>User Management
                            </h1>
                        </div>
                    </div>
                </div>

                <!-- Create User Form -->
                <div class="parchment scroll-border p-4 mb-4 fade-in">
                    <div class="section-header"><i class="fas fa-user-plus"></i>Create New User</div>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
                        <input type="text" id="newUsername" placeholder="Username" class="input-fantasy px-3 py-2 rounded text-sm">
                        <input type="password" id="newPassword" placeholder="Password" class="input-fantasy px-3 py-2 rounded text-sm">
                        <input type="text" id="newName" placeholder="Display Name" class="input-fantasy px-3 py-2 rounded text-sm">
                        <select id="newRole" class="input-fantasy px-3 py-2 rounded text-sm">
                            <option value="player">Player</option>
                            <option value="dm">DM</option>
                        </select>
                    </div>
                    <button onclick="createNewUser()" class="btn-fantasy px-4 py-2 rounded text-sm mt-3">
                        <i class="fas fa-plus mr-1"></i>Create User
                    </button>
                </div>

                <!-- User List -->
                <div class="parchment scroll-border p-4 fade-in">
                    <div class="section-header"><i class="fas fa-users"></i>All Users (${users.length})</div>
                    <div class="space-y-2 mt-3">
                        ${users.length === 0 ? '<p class="text-amber-700 italic">No users found.</p>' : ''}
                        ${users.map(u => `
                            <div class="flex justify-between items-center p-3 bg-amber-100 rounded border border-amber-300">
                                <div class="flex items-center gap-3">
                                    <span class="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${u.role === 'dm' ? 'bg-red-600' : 'bg-blue-600'}">
                                        ${u.role === 'dm' ? 'DM' : 'PC'}
                                    </span>
                                    <div>
                                        <div class="font-bold text-amber-900">${u.name}</div>
                                        <div class="text-xs text-amber-700">@${u.username} • ${u.role}</div>
                                    </div>
                                </div>
                                ${u.username !== 'dm' ? `
                                <button onclick="deleteUserAccount('${u.username}')" class="btn-danger px-3 py-1 rounded text-xs">
                                    <i class="fas fa-trash mr-1"></i>Delete
                                </button>
                                ` : '<span class="text-xs text-amber-600 italic">Protected</span>'}
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
}

function createNewUser() {
    const username = document.getElementById('newUsername').value.trim();
    const password = document.getElementById('newPassword').value;
    const name = document.getElementById('newName').value.trim();
    const role = document.getElementById('newRole').value;

    const result = createUser(username, password, role, name);
    if (result.success) {
        toast(result.message, 'success');
        // Clear form
        document.getElementById('newUsername').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('newName').value = '';
        render();
    } else {
        toast(result.message, 'error');
    }
}

function deleteUserAccount(username) {
    if (!confirm(`Are you sure you want to delete user "${username}"?`)) return;
    const result = deleteUser(username);
    if (result.success) {
        toast(result.message, 'success');
        render();
    } else {
        toast(result.message, 'error');
    }
}

function render() { renderUsers(document.getElementById('app')); }

/* Init */
initApp();
if (!State.currentUser) {
    changeView('login');
} else if (!State.isDM) {
    changeView('dashboard');
} else {
    renderUsers(document.getElementById('app'));
}

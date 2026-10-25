/* monsters.js - Monster Manual Browser */
function renderMonsters(container) {
    const monsters = DB.monsters || {};
    const monsterList = Object.entries(monsters).map(([name, data]) => ({ name, ...data }));
    const categories = [...new Set(monsterList.map(m => m.category))].sort();
    const searchTerm = (State.monsterSearch || '').toLowerCase();
    const selectedCategory = State.monsterCategory || 'All';

    let filtered = monsterList;
    if (selectedCategory !== 'All') {
        filtered = filtered.filter(m => m.category === selectedCategory);
    }
    if (searchTerm) {
        filtered = filtered.filter(m => m.name.toLowerCase().includes(searchTerm));
    }

    filtered.sort((a, b) => a.name.localeCompare(b.name));

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
                                <i class="fas fa-dragon mr-2 text-amber-700"></i>AD&D 2e Bestiary
                            </h1>
                        </div>
                        <div class="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                            <select onchange="State.monsterCategory=this.value; render();" class="input-fantasy px-3 py-2 rounded text-sm">
                                <option value="All">All Categories</option>
                                ${categories.map(c => `<option value="${c}" ${selectedCategory===c?'selected':''}>${c}</option>`).join('')}
                            </select>
                            <div class="flex gap-2">
                                <input type="text" id="monsterSearchInput" placeholder="Search monsters..." 
                                       value="${State.monsterSearch||''}" 
                                       onkeydown="if(event.key==='Enter'){searchMonsters();}"
                                       class="input-fantasy px-3 py-2 rounded text-sm w-full md:w-64">
                                <button onclick="searchMonsters()" class="btn-fantasy px-3 py-2 rounded text-sm">
                                    <i class="fas fa-search mr-1"></i>Search
                                </button>
                                ${State.monsterSearch ? `<button onclick="clearMonsterSearch()" class="btn-galactic px-3 py-2 rounded text-sm"><i class="fas fa-times"></i></button>` : ''}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="parchment scroll-border p-3 mb-4 fade-in">
                    <div class="text-sm text-amber-800">
                        <span class="font-bold">${filtered.length}</span> of <span class="font-bold">${monsterList.length}</span> monsters
                        ${selectedCategory !== 'All' ? ` • Category: <span class="font-bold">${selectedCategory}</span>` : ''}
                        ${searchTerm ? ` • Search: "<span class="font-bold">${State.monsterSearch}</span>"` : ''}
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    ${filtered.length === 0 ? `
                        <div class="col-span-full parchment scroll-border p-8 text-center">
                            <i class="fas fa-search text-4xl text-amber-700 mb-3"></i>
                            <p class="fantasy-font text-lg text-amber-900">No monsters found</p>
                        </div>
                    ` : filtered.map(m => `
                        <div class="parchment scroll-border p-3 fade-in hover:shadow-lg transition-shadow cursor-pointer" onclick="showMonsterDetail('${m.name.replace(/'/g, "\'")}')">
                            <div class="flex justify-between items-start mb-2">
                                <h3 class="fantasy-font font-bold text-amber-900 text-sm leading-tight">${m.name}</h3>
                                <span class="text-xs bg-amber-200 text-amber-900 px-2 py-1 rounded">${m.category}</span>
                            </div>
                            <div class="flex gap-1 mb-2">
                                <span class="text-xs bg-amber-50 text-amber-800 px-2 py-1 rounded border border-amber-200">${m.frequency}</span>
                                <span class="text-xs bg-amber-50 text-amber-800 px-2 py-1 rounded border border-amber-200">${m.encounter} encounter</span>
                            </div>
                            <div class="grid grid-cols-2 gap-1 text-xs mb-2">
                                <div class="bg-amber-100 rounded p-1 text-center">
                                    <div class="text-amber-700">AC</div>
                                    <div class="font-bold text-amber-900">${m.ac}</div>
                                </div>
                                <div class="bg-amber-100 rounded p-1 text-center">
                                    <div class="text-amber-700">HD</div>
                                    <div class="font-bold text-amber-900">${m.hd}</div>
                                    <div class="text-xs text-amber-600">${(() => { const h = parseMonsterHD(m.hd); return `${h.count}d${h.die}${h.bonus >= 0 ? '+' + h.bonus : h.bonus}`; })()}</div>
                                </div>
                                <div class="bg-amber-100 rounded p-1 text-center">
                                    <div class="text-amber-700">THAC0</div>
                                    <div class="font-bold text-amber-900">${m.thac0}</div>
                                </div>
                                <div class="bg-amber-100 rounded p-1 text-center">
                                    <div class="text-amber-700">XP</div>
                                    <div class="font-bold text-amber-900">${m.xp.toLocaleString()}</div>
                                </div>
                            </div>
                            <div class="text-xs text-amber-800 mb-1">
                                <span class="font-bold">Size:</span> ${m.size} • <span class="font-bold">Source:</span> ${m.source}
                            </div>
                            <div class="text-xs text-amber-700 truncate">
                                <span class="font-bold">Damage:</span> ${m.damage}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

function searchMonsters() {
    const input = document.getElementById('monsterSearchInput');
    if (input) {
        State.monsterSearch = input.value;
        render();
    }
}

function clearMonsterSearch() {
    State.monsterSearch = '';
    render();
}

function render() { renderMonsters(document.getElementById('app')); }

/* Init */
initApp();
if (!State.currentUser) {
    changeView('login');
} else if (!State.isDM) {
    changeView('dashboard');
} else {
    renderMonsters(document.getElementById('app'));
}

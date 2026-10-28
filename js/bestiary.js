/* bestiary.js - DM Bestiary & Encounters */
function renderBestiary(container) {
    container.innerHTML = `
        <div class="min-h-screen p-4">
            <div class="max-w-6xl mx-auto">
                <div class="parchment scroll-border p-4 mb-4 fade-in">
                    <div class="flex justify-between items-center flex-wrap gap-2">
                        <button onclick="changeView('dm_view')" class="btn-fantasy px-4 py-2 rounded text-sm">
    <i class="fas fa-users mr-1"></i>Party View
</button>
                        <h1 class="fantasy-font text-2xl font-bold text-amber-900">Bestiary & Encounters</h1>
                        <button onclick="showEnemyModal()" class="btn-fantasy px-4 py-2 rounded text-sm">
                            <i class="fas fa-plus mr-1"></i>Add enemies
                        </button>
                    </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    ${State.creatures.length === 0 ? `
                        <div class="col-span-full parchment scroll-border p-8 text-center">
                            <i class="fas fa-paw text-4xl text-amber-700 mb-3"></i>
                            <p class="fantasy-font text-lg text-amber-900">No creatures yet</p>
                            <p class="text-amber-800 text-sm mt-2">Add bandits, orcs, undead and other typical enemies: pick a rank and level, adjust the stats, add as many as you need.</p>
                            <button onclick="showEnemyModal()" class="btn-fantasy px-4 py-2 rounded text-sm mt-3"><i class="fas fa-plus mr-1"></i>Add enemies</button>
                        </div>
                    ` : State.creatures.map(c => `
                        <div class="creature-card p-4 fade-in relative">
                            <div class="flex justify-between items-start mb-2">
                                <div>
                                    <h3 class="fantasy-font font-bold text-amber-900">${escapeHtml(c.name)}</h3>
                                    <p class="text-xs text-amber-700">${escapeHtml(c.type || 'Creature')}${c.size ? ' · ' + escapeHtml(c.size) : ''}</p>
                                </div>
                                <div class="text-right">
                                    <div class="text-xl font-bold text-amber-900 fantasy-font">AC ${c.ac}</div>
                                    <div class="text-xs text-amber-700">THAC0 ${c.thac0}${c.hd ? ` · HD ${c.hd}` : ''}${c.xp ? ` · ${c.xp} XP` : ''}</div>
                                </div>
                            </div>
                            <div class="mb-2">
                                <div class="flex justify-between text-sm mb-1">
                                    <span>HP: ${c.hp}/${c.maxHp}</span>
                                    <span>${Math.round((c.hp/c.maxHp)*100)}%</span>
                                </div>
                                <div class="hp-bar">
                                    <div class="hp-fill" style="width: ${Math.max(0, Math.min(100, (c.hp/c.maxHp)*100))}%"></div>
                                </div>
                            </div>
                            <div class="text-xs text-amber-800 mb-1">
                                ${c.attacks ? `<b>#AT</b> ${escapeHtml(String(c.attacks))} · ` : ''}${c.damage ? `<b>Dmg</b> ${escapeHtml(c.damage)}` : ''}${c.morale ? ` · <b>ML</b> ${escapeHtml(String(c.morale))}` : ''}${c.move ? ` · <b>MV</b> ${escapeHtml(String(c.move))}` : ''}
                            </div>
                            ${c.saves && Object.keys(c.saves).length ? `<div class="text-xs text-amber-800 mb-1"><b>Saves</b> ${SAVE_TYPES.map(s => `${s.toUpperCase()} ${c.saves[s] ?? '–'}`).join(' · ')}</div>` : ''}
                            <div class="text-xs text-amber-800 mb-1">
                                ${c.weapons?.length ? `<b>Weapons:</b> ${c.weapons.map(w => escapeHtml(w.name + ' ' + w.damage)).join(', ')}` : ''}
                            </div>
                            ${c.special ? `<div class="text-xs text-purple-900 mb-1"><i class="fas fa-star mr-1"></i>${escapeHtml(c.special)}</div>` : ''}
                            ${c.notes ? `<div class="text-xs text-amber-700 italic mb-1">${escapeHtml(c.notes)}</div>` : ''}
                            <div class="flex gap-2 mt-2">
                                <button onclick="adjustCreatureHP('${c.id}', -1)" class="btn-galactic px-2 py-1 rounded text-xs">-1</button>
                                <button onclick="adjustCreatureHP('${c.id}', -5)" class="btn-galactic px-2 py-1 rounded text-xs">-5</button>
                                <button onclick="adjustCreatureHP('${c.id}', 5)" class="btn-fantasy px-2 py-1 rounded text-xs">+5</button>
                                <button onclick="adjustCreatureHP('${c.id}', 1)" class="btn-fantasy px-2 py-1 rounded text-xs">+1</button>
                                <div class="flex-1"></div>
                                <button onclick="duplicateCreature('${c.id}')" class="btn-galactic px-2 py-1 rounded text-xs" title="Duplicate"><i class="fas fa-clone"></i></button>
                                <button onclick="showEnemyModal('${c.id}')" class="btn-galactic px-2 py-1 rounded text-xs" title="Edit / change level"><i class="fas fa-edit"></i></button>
                                <button onclick="removeCreature('${c.id}')" class="btn-danger px-2 py-1 rounded text-xs"><i class="fas fa-trash"></i></button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

function adjustCreatureHP(id, amount) {
    const c = State.creatures.find(x => x.id === id);
    if (!c) return;
    c.hp = Math.max(0, Math.min(c.maxHp, c.hp + amount));
    Storage.save();
    render();
}

function removeCreature(id) {
    if (!confirm('Delete this creature?')) return;
    State.creatures = State.creatures.filter(c => c.id !== id);
    Storage.save();
    render();
}

function saveCreature(id) {
    const name = $('cName').value.trim();
    if (!name) return toast('Name required', 'error');
    const data = {
        id: id || Date.now().toString(36)+Math.random().toString(36).substr(2),
        lastUpdated: Date.now(),
        name,
        type: $('cType').value.trim(),
        hp: parseInt($('cHP').value) || 1,
        maxHp: parseInt($('cMaxHP').value) || 1,
        ac: parseInt($('cAC').value) || 10,
        thac0: parseInt($('cTHAC0').value) || 20,
        hd: ($('cHD')?.value || '').trim(),
        xp: parseInt($('cXP')?.value) || 0,
        weapons: $('cWeapons').value.split(',').map(s => {
            const parts = s.trim().split(':');
            return parts.length === 2 ? {name: parts[0].trim(), damage: parts[1].trim()} : null;
        }).filter(Boolean),
        notes: $('cNotes').value.trim()
    };
    if (id) {
        const idx = State.creatures.findIndex(c => c.id === id);
        if (idx > -1) State.creatures[idx] = data;
    } else {
        State.creatures.push(data);
    }
    Storage.save();
    closeModal();
    render();
    toast(id ? 'Creature updated' : 'Creature added');
}

function render() { renderBestiary(document.getElementById('app')); }

/* Init */
bootPage({ campaign: true, dm: true }, () => renderBestiary(document.getElementById('app')));

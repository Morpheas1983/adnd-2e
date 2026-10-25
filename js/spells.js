/* spells.js - Spell Management */
function renderSpells(container) {
    const char = State.currentCharacter;
    if (!char) return changeView('dashboard');
    const availableSpells = getAvailableSpells(char);
    const knownSpells = char.knownSpells || [];
    const preparedSpells = char.preparedSpells || [];
    const isCaster = ['Mage','Specialist Wizard','Cleric','Druid','Paladin','Ranger','Bard'].includes(char.class);
    const isWizard = ['Mage','Specialist Wizard','Bard'].includes(char.class);
    const isPriest = ['Cleric','Druid','Paladin','Ranger'].includes(char.class);
    const slots = getSpellSlots(char.class, char.level);
    const maxSpellLevel = slots.length; // highest level this caster can cast

    // Filter spells to only those the caster can actually cast at their level
    const castableSpells = availableSpells.filter(s => s.level <= maxSpellLevel);

    // Group by spell level
    const spellsByLevel = {};
    castableSpells.forEach(s => {
        if (!spellsByLevel[s.level]) spellsByLevel[s.level] = [];
        spellsByLevel[s.level].push(s);
    });

    // Sort spells within each level by name
    Object.keys(spellsByLevel).forEach(lvl => {
        spellsByLevel[lvl].sort((a, b) => a.name.localeCompare(b.name));
    });

    const levelOrder = Object.keys(spellsByLevel).map(Number).sort((a, b) => a - b);

    // Wizard INT-based max spells per level
    const intScore = char.stats?.int || 10;
    const maxSpellsPerLevel = isWizard ? getMaxSpellsPerLevel(intScore) : null;
    const maxSpellLevelByInt = isWizard ? getMaxSpellLevel(intScore) : null;

    // Count known spells per level
    const knownByLevel = {};
    knownSpells.forEach(name => {
        const sp = availableSpells.find(s => s.name === name);
        if (sp) {
            knownByLevel[sp.level] = (knownByLevel[sp.level] || 0) + 1;
        }
    });

    container.innerHTML = `
        <div class="min-h-screen p-4">
            <div class="max-w-5xl mx-auto">
                <div class="parchment scroll-border p-4 mb-4 fade-in">
                    <div class="flex justify-between items-center flex-wrap gap-2">
                        <div class="flex items-center gap-3">
                            <button onclick="goBack()" class="btn-galactic px-3 py-2 rounded text-sm">
                                <i class="fas fa-arrow-left"></i> Back to Sheet
                            </button>
                            <h1 class="fantasy-font text-2xl font-bold text-amber-900">${char.name}'s Spells</h1>
                        </div>
                        <div class="flex gap-2">
                            <button onclick="showAddSpellModal()" class="btn-magic px-3 py-2 rounded text-sm">
                                <i class="fas fa-plus mr-1"></i>Add Spell
                            </button>
                            <span class="text-sm text-amber-800">Known: ${knownSpells.length} | Prepared: ${preparedSpells.length}</span>
                        </div>
                    </div>
                </div>
                ${isCaster ? `
                <div class="parchment scroll-border p-4 mb-4 fade-in">
                    <div class="section-header"><i class="fas fa-hat-wizard"></i>Spell Slots</div>
                    <div class="flex justify-between items-center mb-3">
                        <span class="text-sm text-amber-800">${char.class} Level ${char.level} • Spellcasting: ${getCasterType(char.class) === 'wizard' ? 'Wizard' : 'Priest'}${DB.classes[char.class]?.spell_slots?.offset ? ` • Effective Caster Level ${Math.max(1, char.level - DB.classes[char.class].spell_slots.offset)}` : ''}</span>
                        <button onclick="restSpells()" class="btn-magic px-4 py-2 rounded text-sm">
                            <i class="fas fa-bed mr-1"></i>Rest & Restore All Slots
                        </button>
                    </div>
                    <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 mb-3">
                        ${slots.map((slotCount, idx) => {
                            const level = idx + 1;
                            const used = (char.usedSpellSlots || {})[level] || 0;
                            const available = slotCount - used;
                            const pct = slotCount > 0 ? (available / slotCount) * 100 : 0;
                            return `
                                <div class="bg-amber-100 rounded p-2 border border-amber-300 text-center ${available === 0 ? 'opacity-60' : ''}">
                                    <div class="text-xs text-amber-700 font-bold">Level ${level}</div>
                                    <div class="text-xl font-bold ${available === 0 ? 'text-red-700' : 'text-amber-900'}">${available}/${slotCount}</div>
                                    <div class="text-xs text-amber-600">${used > 0 ? used + ' cast' : 'Ready'}</div>
                                    <div class="hp-bar mt-1" style="height:4px">
                                        <div class="hp-fill" style="width: ${pct}%; ${available === 0 ? 'background:#991b1b' : 'background:linear-gradient(90deg, #d4af37, #fbbf24)'}"></div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                    ${!slots.length ? '<p class="text-xs text-amber-700 italic">No spell slots available at this character level. Level up to gain spell slots.</p>' : ''}
                </div>
                ` : ''}
                ${isWizard && maxSpellsPerLevel !== null ? `
                <div class="parchment scroll-border p-4 mb-4 fade-in">
                    <div class="section-header"><i class="fas fa-brain"></i>Spell Learning Capacity (INT ${intScore})</div>
                    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                        ${levelOrder.map(lvl => {
                            const known = knownByLevel[lvl] || 0;
                            const max = maxSpellsPerLevel === Infinity ? '∞' : maxSpellsPerLevel;
                            const atMax = maxSpellsPerLevel !== Infinity && known >= maxSpellsPerLevel;
                            const overIntLimit = maxSpellLevelByInt !== null && lvl > maxSpellLevelByInt;
                            return `
                                <div class="bg-amber-100 rounded p-2 border border-amber-300 text-center ${atMax ? 'border-red-500 bg-red-50' : ''} ${overIntLimit ? 'opacity-50' : ''}">
                                    <div class="text-xs text-amber-700 font-bold">Level ${lvl}</div>
                                    <div class="text-lg font-bold ${atMax ? 'text-red-700' : 'text-amber-900'}">${known} / ${max}</div>
                                    <div class="text-xs text-amber-600">${atMax ? 'MAX REACHED' : (overIntLimit ? 'INT too low' : 'Can learn')}</div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                    <p class="text-xs text-amber-700 mt-2">
                        <i class="fas fa-info-circle mr-1"></i>
                        ${maxSpellsPerLevel === Infinity 
                            ? `With INT ${intScore}, you can learn all spells of any level you can cast.` 
                            : `With INT ${intScore}, you can learn up to ${maxSpellsPerLevel} spells per spell level. Max spell level: ${maxSpellLevelByInt}.`}
                    </p>
                </div>
                ` : ''}
                <div class="parchment scroll-border p-4 mb-4 fade-in">
                    <div class="section-header"><i class="fas fa-book"></i>Known Spells</div>
                    ${knownSpells.length === 0 ? '<p class="text-amber-700 italic text-sm">No spells known yet. Click on spells below to learn them.</p>' : ''}
                    <div class="flex flex-wrap gap-2 mb-4">
                        ${knownSpells.map(spellName => {
                            const spell = availableSpells.find(s => s.name === spellName);
                            const isPrepared = preparedSpells.includes(spellName);
                            return spell ? `
                                <div class="spell-card ${isPrepared ? 'selected' : ''} flex items-center gap-2 relative" 
                                     onclick="togglePrepareSpell('${spell.name}')">
                                    <span class="spell-name">${spell.name}</span>
                                    <span class="spell-level-badge">${spell.level}</span>
                                    <span class="school-badge">${spell.school || spell.sphere}</span>
                                    ${isPrepared ? '<i class="fas fa-check-circle text-blue-400"></i>' : ''}
                                    ${isPrepared ? `<button onclick="event.stopPropagation(); castSpell('${spell.name}', ${spell.level})" class="ml-auto btn-fantasy px-2 py-1 rounded text-xs" title="Cast Spell"><i class="fas fa-fire"></i> Cast</button>` : ''}
                                </div>
                            ` : '';
                        }).join('')}
                    </div>
                </div>
                <div class="parchment scroll-border p-4 fade-in">
                    <div class="section-header"><i class="fas fa-scroll"></i>Spell Library</div>
                    <p class="text-sm text-amber-700 mb-3">
                        Showing spells up to Level ${maxSpellLevel} (your current casting limit). 
                        Click a spell to learn it. Click a known spell to prepare/unprepare it. 
                        <i class="fas fa-info-circle"></i> for details.
                        ${isWizard && maxSpellsPerLevel !== Infinity ? `<br><span class="text-red-700 font-bold"><i class="fas fa-exclamation-triangle mr-1"></i>You cannot learn more than ${maxSpellsPerLevel} spells per level due to your INT score.</span>` : ''}
                    </p>
                    ${levelOrder.length === 0 ? '<p class="text-amber-700 italic">No spells available for this character at their current level.</p>' : ''}
                    ${levelOrder.map(level => {
                        const spells = spellsByLevel[level];
                        const knownCount = knownByLevel[level] || 0;
                        const atMax = isWizard && maxSpellsPerLevel !== Infinity && knownCount >= maxSpellsPerLevel;
                        const overInt = isWizard && maxSpellLevelByInt !== null && level > maxSpellLevelByInt;
                        return `
                        <div class="mb-6">
                            <h3 class="fantasy-font text-xl text-amber-900 mb-3 border-b-2 border-amber-400 pb-1 flex items-center justify-between">
                                <span class="flex items-center gap-2">
                                    <i class="fas fa-hat-wizard"></i>
                                    Spell Level ${level}
                                </span>
                                <span class="text-sm ${atMax ? 'text-red-700 font-bold' : 'text-amber-700'}">
                                    ${knownCount} known ${isWizard && maxSpellsPerLevel !== Infinity ? `/ ${maxSpellsPerLevel} max` : ''}
                                    ${overInt ? '<span class="text-red-700 ml-2"><i class="fas fa-ban"></i> INT limit</span>' : ''}
                                </span>
                            </h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                                ${spells.map(spell => {
                                    const isKnown = knownSpells.includes(spell.name);
                                    const spellBlocked = isWizard && !isKnown && maxSpellsPerLevel !== Infinity && knownCount >= maxSpellsPerLevel;
                                    const intBlocked = isWizard && !isKnown && maxSpellLevelByInt !== null && level > maxSpellLevelByInt;
                                    const blocked = spellBlocked || intBlocked;
                                    return `
                                    <div class="spell-card ${isKnown ? 'selected' : ''} ${blocked ? 'opacity-50 cursor-not-allowed' : ''} flex items-center justify-between" 
                                         ${blocked ? '' : `onclick="toggleLearnSpell('${spell.name}')`}">
                                        <div class="flex items-center gap-2 flex-1 min-w-0">
                                            <span class="spell-name truncate">${spell.name}</span>
                                            <span class="school-badge">${spell.school || spell.sphere}</span>
                                        </div>
                                        <div class="flex items-center gap-2">
                                            ${blocked ? `<span class="text-xs text-red-700 font-bold" title="${intBlocked ? 'INT too low for this level' : 'Max spells reached for this level'}"><i class="fas fa-lock"></i></span>` : ''}
                                            <button onclick="event.stopPropagation(); showSpellDetail('${spell.name}')" 
                                                    class="text-blue-600 hover:text-blue-800 px-2">
                                                <i class="fas fa-info-circle"></i>
                                            </button>
                                        </div>
                                    </div>
                                `;
                                }).join('')}
                            </div>
                        </div>
                    `;
                    }).join('')}
                </div>
            </div>
        </div>
    `;
}

function castSpell(spellName, spellLevel) {
    const char = State.currentCharacter;
    if (!char) return;
    const slots = getSpellSlots(char.class, char.level);
    if (!slots[spellLevel - 1]) return toast('No slots for this spell level!', 'error');
    const totalSlots = slots[spellLevel - 1];
    char.usedSpellSlots = char.usedSpellSlots || {};
    const used = char.usedSpellSlots[spellLevel] || 0;
    if (used >= totalSlots) return toast('No spell slots remaining for Level ' + spellLevel + '! Rest to restore.', 'error');
    char.usedSpellSlots[spellLevel] = used + 1;
    char.lastUpdated = Date.now();
    Storage.save();
    toast(`Cast ${spellName}! ${totalSlots - used - 1} Level ${spellLevel} slot(s) remaining.`);
    render();
}

function restSpells() {
    const char = State.currentCharacter;
    if (!char) return;
    char.usedSpellSlots = {};
    char.lastUpdated = Date.now();
    Storage.save();
    toast('All spell slots restored after rest!');
    render();
}

function toggleLearnSpell(spellName) {
    const char = State.currentCharacter;
    char.knownSpells = char.knownSpells || [];
    const idx = char.knownSpells.indexOf(spellName);
    if (idx > -1) {
        char.knownSpells.splice(idx, 1);
        const prepIdx = char.preparedSpells.indexOf(spellName);
        if (prepIdx > -1) char.preparedSpells.splice(prepIdx, 1);
        toast(`Forgot ${spellName}`);
    } else {
        // Check wizard INT-based spell learning limits
        const isWizard = ['Mage','Specialist Wizard','Bard'].includes(char.class);
        if (isWizard) {
            const availableSpells = getAvailableSpells(char);
            const spell = availableSpells.find(s => s.name === spellName);
            if (!spell) return toast('Spell not found in library', 'error');

            const intScore = char.stats?.int || 10;
            const maxPerLevel = getMaxSpellsPerLevel(intScore);
            const maxLevelByInt = getMaxSpellLevel(intScore);

            // Check max spell level by INT
            if (maxLevelByInt !== null && spell.level > maxLevelByInt) {
                return toast(`Your INT (${intScore}) is too low to learn Level ${spell.level} spells. Max level: ${maxLevelByInt}.`, 'error');
            }

            // Check max spells per level
            if (maxPerLevel !== Infinity) {
                const knownAtLevel = char.knownSpells.filter(name => {
                    const sp = availableSpells.find(s => s.name === name);
                    return sp && sp.level === spell.level;
                }).length;
                if (knownAtLevel >= maxPerLevel) {
                    return toast(`Cannot learn more Level ${spell.level} spells! Max ${maxPerLevel} per level (INT ${intScore}).`, 'error');
                }
            }
        }
        char.knownSpells.push(spellName);
        toast(`Learned ${spellName}`);
    }
    Storage.save();
    render();
}

function togglePrepareSpell(spellName) {
    const char = State.currentCharacter;
    char.preparedSpells = char.preparedSpells || [];
    const idx = char.preparedSpells.indexOf(spellName);
    if (idx > -1) {
        char.preparedSpells.splice(idx, 1);
        toast(`Unprepared ${spellName}`);
    } else {
        char.preparedSpells.push(spellName);
        toast(`Prepared ${spellName}`);
    }
    Storage.save();
    render();
}

function saveCustomSpell() {
    const name = $('spellName').value.trim();
    if (!name) return toast('Spell name required', 'error');
    const char = State.currentCharacter;
    const isWizard = ['Mage','Specialist Wizard','Bard'].includes(char.class);
    const spell = {
        name,
        level: parseInt($('spellLevel').value) || 1,
        [isWizard ? 'school' : 'sphere']: $('spellSchool').value.trim() || 'Unknown',
        range: $('spellRange').value.trim(),
        duration: $('spellDuration').value.trim(),
        aoe: $('spellAOE').value.trim(),
        components: $('spellComponents').value.trim(),
        casting_time: $('spellCastTime').value.trim(),
        save: $('spellSave').value.trim(),
        desc: $('spellDesc').value.trim()
    };
    if (isWizard) {
        State.customSpells.wizard = State.customSpells.wizard || [];
        State.customSpells.wizard.push(spell);
    } else {
        State.customSpells.priest = State.customSpells.priest || [];
        State.customSpells.priest.push(spell);
    }
    Storage.save();
    closeModal();
    render();
    toast(`Added ${name} to spell library!`);
}

function render() { renderSpells(document.getElementById('app')); }

/* Init */
initApp();
if (!State.currentUser) {
    changeView('login');
} else if (!State.currentCharacter) {
    changeView('dashboard');
} else {
    renderSpells(document.getElementById('app'));
}

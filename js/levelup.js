/* levelup.js - Level Up Screen */
function renderLevelUp(container) {
    const char = State.currentCharacter;
    if (!char) return changeView('dashboard');
    const nextLevel = (char.level || 1) + 1;
    const nextXP = getNextXP(char.class, char.level || 1);
    const canLevel = (char.xp || 0) >= nextXP;
    const cls = DB.classes[char.class];
    const hd = cls ? cls.hd : 6;
    const conMod = getModifier(char.stats?.con || 10);

    const knownWP = char.weaponProfs || [];
    const knownNWP = char.nonweaponProfs || [];
    const availableWP = DB.weapon_proficiencies.filter(p => !knownWP.includes(p));
    const availableNWP = DB.nonweapon_proficiencies.filter(p => !knownNWP.includes(p.name));

    container.innerHTML = `
        <div class="min-h-screen p-4">
            <div class="max-w-2xl mx-auto">
                <div class="parchment scroll-border p-4 mb-4 fade-in">
                    <div class="flex justify-between items-center">
                        <button onclick="goBack()" class="btn-galactic px-3 py-2 rounded text-sm">
                            <i class="fas fa-arrow-left"></i> Back
                        </button>
                        <h1 class="fantasy-font text-2xl font-bold text-amber-900">Level Up</h1>
                        <div></div>
                    </div>
                </div>
                <div class="parchment scroll-border p-6 fade-in text-center">
                    <div class="mb-6">
                        <div class="text-6xl mb-2">${char.level} <i class="fas fa-arrow-right text-amber-600"></i> ${nextLevel}</div>
                        <p class="fantasy-font text-xl text-amber-800">${char.name}</p>
                    </div>
                    <div class="mb-6 p-4 bg-amber-100 rounded border border-amber-300">
                        <div class="flex justify-between text-sm mb-2">
                            <span>Current XP: ${char.xp}</span>
                            <span>Required: ${nextXP}</span>
                        </div>
                        <div class="xp-bar">
                            <div class="xp-fill" style="width: ${Math.min(((char.xp || 0)/nextXP)*100, 100)}%"></div>
                        </div>
                        ${!canLevel ? `<p class="text-red-700 font-bold mt-2">Not enough XP to level up!</p>` : ''}
                    </div>
                    ${canLevel ? `
                        <div class="grid-2 gap-4 mb-6 text-left">
                            <div class="p-4 bg-amber-50 rounded border border-amber-300">
                                <div class="text-sm text-amber-700 mb-1">Hit Die</div>
                                <div class="text-2xl font-bold text-amber-900 fantasy-font">1d${hd}</div>
                                <div class="text-xs text-amber-600">+ CON mod (${formatMod(conMod)})</div>
                            </div>
                            <div class="p-4 bg-amber-50 rounded border border-amber-300">
                                <label class="block text-sm text-amber-700 mb-1">HP Gained</label>
                                <div class="flex gap-2">
                                    <input type="number" id="levelUpHP" class="input-fantasy w-full px-3 py-2 text-center text-2xl font-bold" 
                                           value="${Math.max(1, rollDie(hd) + conMod)}" min="1">
                                    <button onclick="rollLevelUpHP()" class="btn-fantasy px-3 py-2 rounded" title="Roll HP">
                                        <i class="fas fa-dice"></i>
                                    </button>
                                </div>
                                <div class="text-xs text-amber-600 mt-1">Min 1 HP per level</div>
                            </div>
                        </div>
                        <div class="mb-6 text-left">
                            <h3 class="fantasy-font text-lg text-amber-900 mb-3">New Proficiencies</h3>
                            <p class="text-xs text-amber-700 mb-2">Already known proficiencies are hidden from selection.</p>
                            <div class="grid-2 gap-4">
                                <div>
                                    <label class="block text-sm font-bold text-amber-900 mb-1">Weapon Proficiency</label>
                                    <select id="newWeaponProf" class="input-fantasy w-full px-3 py-2">
                                        <option value="">Select...</option>
                                        ${availableWP.map(p => `<option value="${p}">${p}</option>`).join('')}
                                    </select>
                                    ${availableWP.length === 0 ? '<p class="text-xs text-red-600 mt-1">All weapon proficiencies already known!</p>' : ''}
                                </div>
                                <div>
                                    <label class="block text-sm font-bold text-amber-900 mb-1">Non-Weapon Proficiency</label>
                                    <select id="newNonweaponProf" class="input-fantasy w-full px-3 py-2">
                                        <option value="">Select...</option>
                                        ${availableNWP.map(p => `<option value="${p.name}">${p.name} (${p.ability})</option>`).join('')}
                                    </select>
                                    ${availableNWP.length === 0 ? '<p class="text-xs text-red-600 mt-1">All non-weapon proficiencies already known!</p>' : ''}
                                </div>
                            </div>
                        </div>
                        <button onclick="confirmLevelUp()" class="btn-fantasy px-8 py-3 rounded text-lg font-bold">
                            <i class="fas fa-level-up-alt mr-2"></i>Confirm Level Up
                        </button>
                    ` : `
                        <div class="p-4 bg-amber-100 rounded border border-amber-300">
                            <p class="text-amber-900">You need ${nextXP - (char.xp || 0)} more XP to reach level ${nextLevel}.</p>
                            <p class="text-sm text-amber-700 mt-2">Go on more adventures!</p>
                        </div>
                    `}
                </div>
            </div>
        </div>
    `;
}

function rollLevelUpHP() {
    const char = State.currentCharacter;
    const cls = DB.classes[char.class];
    const conMod = getModifier(char.stats?.con || 10);
    const roll = Math.max(1, rollDie(cls.hd) + conMod);
    $('levelUpHP').value = roll;
    toast(`Rolled ${roll} HP!`);
}

function confirmLevelUp() {
    const char = State.currentCharacter;
    const hpGain = parseInt($('levelUpHP').value) || 1;
    char.level = (char.level || 1) + 1;
    char.maxHp = (char.maxHp || 0) + hpGain;
    char.hp = char.maxHp;
    char.lastUpdated = Date.now();

    const newWP = $('newWeaponProf')?.value;
    const newNWP = $('newNonweaponProf')?.value;
    if (newWP) {
        char.weaponProfs = char.weaponProfs || [];
        char.weaponProfs.push(newWP);
    }
    if (newNWP) {
        char.nonweaponProfs = char.nonweaponProfs || [];
        char.nonweaponProfs.push(newNWP);
    }
    if (char.class === 'Thief' || char.class === 'Bard') {
        DB.thieving_skills.forEach(s => {
            char.thiefSkills[s.name] = (char.thiefSkills[s.name] || s.base) + Math.floor(Math.random() * 6) + 1;
        });
    }
    Storage.save();
    toast(`Level up! ${char.name} is now level ${char.level}!`);
    changeView('sheet');
}

function render() { renderLevelUp(document.getElementById('app')); }

/* Init */
initApp();
if (!State.currentUser) {
    changeView('login');
} else if (!State.currentCharacter) {
    changeView('dashboard');
} else {
    renderLevelUp(document.getElementById('app'));
}

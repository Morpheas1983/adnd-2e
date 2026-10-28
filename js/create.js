/* create.js - Character Creation Wizard */
let createStep = 1;
let tempInventory = [];
let tempGold = 0;
function renderCreate(container) {
    container.innerHTML = `
        <div class="min-h-screen p-4">
            <div class="max-w-4xl mx-auto">
                <div class="parchment scroll-border p-6 mb-4 fade-in">
                    <div class="flex justify-between items-center">
                        <h1 class="fantasy-font text-2xl font-bold text-amber-900">
                            <i class="fas fa-hat-wizard mr-2 text-amber-700"></i>Create Character
                        </h1>
                        <button onclick="goBack()" class="btn-galactic px-4 py-2 rounded text-sm">
                            <i class="fas fa-arrow-left mr-1"></i>Back
                        </button>
                    </div>
                </div>
                <div id="createWizard" class="parchment scroll-border p-6 fade-in">
                    <div class="flex gap-1 mb-6 border-b-2 border-amber-300 pb-2 overflow-x-auto">
                        <button class="tab-btn active" data-step="1">1. Basics</button>
                        <button class="tab-btn" data-step="2">2. Class & Kit</button>
                        <button class="tab-btn" data-step="3">3. Stats</button>
                        <button class="tab-btn" data-step="4">4. Proficiencies & Details</button>
                        <button class="tab-btn" data-step="5">5. HP & Equipment</button>
                    </div>
                    <div id="step1" class="create-step">
                        <div class="grid-2 gap-4">
                            <div>
                                <label class="block text-sm font-bold text-amber-900 mb-1">Character Name</label>
                                <input type="text" id="charName" class="input-fantasy w-full px-3 py-2" placeholder="Enter name...">
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-amber-900 mb-1">Player Name</label>
                                <input type="text" id="charPlayer" class="input-fantasy w-full px-3 py-2" value="${escapeHtml(State.currentUserName)}" readonly>
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-amber-900 mb-1">Race</label>
                                <select id="charRace" class="input-fantasy w-full px-3 py-2" onchange="updateRacePreview()">
                                    ${Object.keys(DB.races).map(r => `<option value="${r}">${r}</option>`).join('')}
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-amber-900 mb-1">Alignment</label>
                                <select id="charAlignment" class="input-fantasy w-full px-3 py-2" onchange="updateSchoolSphereSelection()">
                                    ${DB.alignments.map(a => `<option value="${a}">${a}</option>`).join('')}
                                </select>
                            </div>
                        </div>
                        <div id="racePreview" class="mt-4 p-3 bg-amber-100 rounded border border-amber-300 text-sm text-amber-900"></div>
                    </div>
                    <div id="step2" class="create-step hidden">
                        <div class="grid-2 gap-4 mb-4">
                            <div>
                                <label class="block text-sm font-bold text-amber-900 mb-1">Class</label>
                                <select id="charClass" class="input-fantasy w-full px-3 py-2" onchange="updateClassOptions()">
                                    <option value="">Select Class...</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-amber-900 mb-1">Kit</label>
                                <select id="charKit" class="input-fantasy w-full px-3 py-2" onchange="updateSchoolSphereSelection()">
                                    <option value="None">None</option>
                                </select>
                            </div>
                        </div>
                        <div id="classPreview" class="p-3 bg-amber-100 rounded border border-amber-300 text-sm mb-4"></div>
                        <div id="schoolSphereSelection" class="hidden mb-4">
                            <div class="section-header"><i class="fas fa-hat-wizard"></i>Magic Schools / Spheres</div>
                            <div id="schoolSphereContent" class="p-3 bg-amber-100 rounded border border-amber-300 text-sm"></div>
                        </div>
                    </div>
                    <div id="step3" class="create-step hidden">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="fantasy-font text-lg text-amber-900">Ability Scores</h3>
                            <button onclick="rollCharacterStats()" class="btn-fantasy px-4 py-2 rounded text-sm">
                                <i class="fas fa-dice-d20 mr-1"></i>Roll Stats
                            </button>
                        </div>
                        <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                            ${['str','dex','con','int','wis','cha'].map(stat => `
                                <div class="stat-box p-3">
                                    <div class="stat-label">${stat.toUpperCase()}</div>
                                    <input type="number" id="stat_${stat}" class="stat-value bg-transparent border-none text-center w-full" 
                                           value="10" min="3" max="19" onchange="updateStatPreview()">
                                    <div id="mod_${stat}" class="stat-mod">+0</div>
                                </div>
                            `).join('')}
                        </div>
                        <div id="statValidation" class="mb-2 text-sm font-bold"></div><div id="statPreview" class="p-3 bg-amber-100 rounded border border-amber-300 text-sm"></div>
                    </div>
                    <div id="step4" class="create-step hidden">
                        <div class="section-header"><i class="fas fa-shield-alt"></i>Proficiencies</div>
                        <p class="text-sm text-amber-800 mb-3">Spend all your proficiency slots. The counters turn green when you have used exactly the slots you have.</p>
                        <div id="profPicker" class="mb-6"></div>
                        <div class="section-header"><i class="fas fa-user-edit"></i>Details</div>
                        <div class="grid-2 gap-4">
                            <div>
                                <label class="block text-sm font-bold text-amber-900 mb-1">Age</label>
                                <input type="number" id="charAge" class="input-fantasy w-full px-3 py-2" value="20">
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-amber-900 mb-1">Height</label>
                                <input type="text" id="charHeight" class="input-fantasy w-full px-3 py-2" placeholder="5'10">
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-amber-900 mb-1">Weight</label>
                                <input type="text" id="charWeight" class="input-fantasy w-full px-3 py-2" placeholder="160 lbs">
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-amber-900 mb-1">Hair Color</label>
                                <input type="text" id="charHair" class="input-fantasy w-full px-3 py-2" placeholder="Brown">
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-amber-900 mb-1">Eye Color</label>
                                <input type="text" id="charEyes" class="input-fantasy w-full px-3 py-2" placeholder="Blue">
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-amber-900 mb-1">Deity</label>
                                <input type="text" id="charDeity" class="input-fantasy w-full px-3 py-2" placeholder="">
                            </div>
                        </div>
                        <div class="mt-4">
                            <label class="block text-sm font-bold text-amber-900 mb-1">Background / Personality</label>
                            <textarea id="charBackground" class="input-fantasy w-full px-3 py-2 h-24 resize-none" placeholder="Describe your character..."></textarea>
                        </div>
                    </div>
                    <div id="step5" class="create-step hidden">
                        <div class="section-header"><i class="fas fa-heart"></i>Starting Hit Points</div>
                        <div class="grid-2 gap-4 mb-4">
                            <div>
                                <label class="block text-sm font-bold text-amber-900 mb-1">Hit Die</label>
                                <div id="createHPDie" class="p-3 bg-amber-100 rounded border border-amber-300 text-center font-bold text-amber-900 fantasy-font">Select a class first</div>
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-amber-900 mb-1">Starting HP</label>
                                <div class="flex gap-2">
                                    <input type="number" id="createHP" class="input-fantasy w-full px-3 py-2 text-center text-lg font-bold" value="1" min="1">
                                    <button onclick="rollCreateHP()" class="btn-fantasy px-4 py-2 rounded" title="Roll HP">
                                        <i class="fas fa-dice"></i>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div class="section-header"><i class="fas fa-coins"></i>Starting Gold & Equipment</div>
                        <div class="flex gap-4 mb-4 items-center">
                            <div class="flex-1">
                                <label class="block text-sm font-bold text-amber-900 mb-1">Starting Gold (gp)</label>
                                <input type="number" id="charGold" class="input-fantasy w-full px-3 py-2" value="0">
                            </div>
                            <button onclick="rollStartingGold()" class="btn-fantasy px-4 py-2 rounded mt-6">
                                <i class="fas fa-dice mr-1"></i>Roll
                            </button>
                        </div>
                        <div class="grid-2 gap-4">
                            <div>
                                <label class="block text-sm font-bold text-amber-900 mb-1">Weapons</label>
                                <div class="max-h-48 overflow-y-auto border border-amber-300 rounded bg-amber-50 p-2">
                                    ${DB.weapons.map(w => `
                                        <div class="flex justify-between items-center p-1 hover:bg-amber-200 cursor-pointer" onclick="addToInventory('weapon', '${w.name}')">
                                            <span class="text-sm">${w.name}</span>
                                            <span class="text-xs text-amber-700">${w.cost}gp</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-amber-900 mb-1">Armor & Gear</label>
                                <div class="max-h-48 overflow-y-auto border border-amber-300 rounded bg-amber-50 p-2">
                                    ${DB.armor.map(a => `
                                        <div class="flex justify-between items-center p-1 hover:bg-amber-200 cursor-pointer" onclick="addToInventory('armor', '${a.name}')">
                                            <span class="text-sm">${a.name}</span>
                                            <span class="text-xs text-amber-700">${a.cost}gp</span>
                                        </div>
                                    `).join('')}
                                    <div class="border-t border-amber-300 my-1"></div>
                                    ${DB.gear.map(g => `
                                        <div class="flex justify-between items-center p-1 hover:bg-amber-200 cursor-pointer" onclick="addToInventory('gear', '${g.name}')">
                                            <span class="text-sm">${g.name}</span>
                                            <span class="text-xs text-amber-700">${g.cost}gp</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                        <div class="mt-4 p-3 bg-amber-100 rounded border border-amber-300">
                            <div class="flex justify-between items-center mb-2">
                                <span class="font-bold text-amber-900">Selected Items:</span>
                                <span class="text-sm text-amber-700">Gold Remaining: <span id="goldRemaining" class="font-bold">0</span> gp</span>
                            </div>
                            <div id="startingInventory" class="text-sm space-y-1"></div>
                        </div>
                    </div>
                    <div class="flex justify-between mt-6 pt-4 border-t-2 border-amber-300">
                        <button id="prevBtn" onclick="prevStep()" class="btn-galactic px-6 py-2 rounded hidden">
                            <i class="fas fa-arrow-left mr-1"></i>Previous
                        </button>
                        <div class="flex-1"></div>
                        <button id="nextBtn" onclick="nextStep()" class="btn-fantasy px-6 py-2 rounded">
                            Next<i class="fas fa-arrow-right ml-1"></i>
                        </button>
                        <button id="finishBtn" onclick="finishCreation()" class="btn-fantasy px-6 py-2 rounded hidden">
                            <i class="fas fa-check mr-1"></i>Create Character
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    setTimeout(() => {
        updateRacePreview();
        updateClassList();
        updateStatPreview();
        initProficiencySelectors();
        updateCreateHPDisplay();
    }, 0);
}

function nextStep() {
    if (createStep === 1) {
        if (!$('charName').value.trim()) return toast('Please enter a character name', 'error');
    }
    if (createStep === 2) {
        if (!$('charClass').value) return toast('Please select a class', 'error');
        const cls = $('charClass').value;
        if (cls === 'Specialist Wizard' && !SPECIALISTS[$('charKit').value]) return toast('Choose your specialty (kit) first', 'error');
    }
    if (createStep === 3) {
        const race = $('charRace').value;
        const r = DB.races[race];
        const clsName = $('charClass').value;
        const cls = DB.classes[clsName];
        const stats = ['str','dex','con','int','wis','cha'];
        for (let s of stats) {
            const val = parseInt($('stat_'+s).value);
            const raceMin = r['min_'+s], raceMax = r['max_'+s];
            const classMin = cls?.requirements?.[s] || 0;
            if (val < raceMin || val > raceMax) return toast(`${s.toUpperCase()} must be between ${raceMin} and ${raceMax} for ${race}`, 'error');
            if (val < classMin) return toast(`${s.toUpperCase()} must be at least ${classMin} for ${clsName}`, 'error');
        }
    }
    if (createStep === 4) {
        const problem = profStepProblem();
        if (problem) return toast('Proficiencies: ' + problem, 'error');
    }
    createStep++;
    updateWizardUI();
}

function prevStep() {
    createStep--;
    const nextBtn = $('nextBtn');
    if (nextBtn) nextBtn.disabled = false;
    updateWizardUI();
}

function updateWizardUI() {
    document.querySelectorAll('.create-step').forEach(el => el.classList.add('hidden'));
    $(`step${createStep}`).classList.remove('hidden');
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.step) === createStep);
    });
    $('prevBtn').classList.toggle('hidden', createStep === 1);
    $('nextBtn').classList.toggle('hidden', createStep === 5);
    $('finishBtn').classList.toggle('hidden', createStep !== 5);
    if (createStep === 2) updateClassOptions();
    if (createStep === 3) updateStatPreview();
    if (createStep === 4) initProficiencySelectors();
    else { const h = $('profGateHint'); if (h) h.remove(); const nb = $('nextBtn'); if (nb) { nb.disabled = false; nb.title = ''; } }
    if (createStep === 5) {
        updateGoldDisplay();
        updateCreateHPDisplay();
    }
}

function updateRacePreview() {
    const race = $('charRace').value;
    const r = DB.races[race];
    $('racePreview').innerHTML = `
        <strong>${race}</strong><br>
        STR: ${r.min_str}-${r.max_str} | DEX: ${r.min_dex}-${r.max_dex} | CON: ${r.min_con}-${r.max_con}<br>
        INT: ${r.min_int}-${r.max_int} | WIS: ${r.min_wis}-${r.max_wis} | CHA: ${r.min_cha}-${r.max_cha}<br>
        <em>${r.special}</em><br>
        Infravision: ${r.infravision}' | Size: ${r.size}
    `;
}

function rollCharacterStats() {
    const rolls = rollStats();
    ['str','dex','con','int','wis','cha'].forEach((s, i) => {
        $('stat_'+s).value = rolls[i];
    });
    updateStatPreview();
    toast('Stats rolled!');
}

function updateStatPreview() {
    const race = $('charRace').value;
    const r = DB.races[race];
    const clsName = $('charClass')?.value;
    const cls = clsName ? DB.classes[clsName] : null;
    let html = '<strong>Modifiers:</strong> ';
    let allValid = true;
    let invalidMsgs = [];

    ['str','dex','con','int','wis','cha'].forEach(s => {
        const val = parseInt($('stat_'+s).value) || 10;
        const mod = getModifier(val);
        const raceMin = r['min_'+s], raceMax = r['max_'+s];
        const classMin = cls?.requirements?.[s] || 0;
        const raceValid = val >= raceMin && val <= raceMax;
        const classValid = val >= classMin;
        const valid = raceValid && classValid;

        const box = $(`stat_${s}`).closest('.stat-box');
        if (valid) box.classList.remove('invalid');
        else box.classList.add('invalid');

        $(`mod_${s}`).textContent = formatMod(mod);
        $(`mod_${s}`).style.color = valid ? (mod >= 0 ? '#166534' : '#991b1b') : '#dc2626';
        html += `${s.toUpperCase()}:${formatMod(mod)} `;

        if (!valid) {
            allValid = false;
            if (!raceValid) invalidMsgs.push(`${s.toUpperCase()} must be ${raceMin}-${raceMax} for ${race}`);
            else if (!classValid) invalidMsgs.push(`${s.toUpperCase()} must be ≥${classMin} for ${clsName}`);
        }
    });

    $('statPreview').innerHTML = html;
    const validationDiv = $('statValidation');
    if (validationDiv) {
        if (!allValid) {
            validationDiv.innerHTML = '<span style="color:#dc2626"><i class="fas fa-exclamation-circle mr-1"></i>' + invalidMsgs.join(' | ') + '</span>';
        } else {
            validationDiv.innerHTML = '<span style="color:#166534"><i class="fas fa-check-circle mr-1"></i>Stats meet all requirements</span>';
        }
    }

    const nextBtn = $('nextBtn');
    if (createStep === 3 && nextBtn) {
        nextBtn.disabled = !allValid;
    }
}

function updateClassList() {
    const race = $('charRace').value;
    const r = DB.races[race];
    const select = $('charClass');
    select.innerHTML = '<option value="">Select Class...</option>' + 
        r.classes.map(c => `<option value="${c}">${c}</option>`).join('');
}

function updateClassOptions() {
    const cls = $('charClass').value;
    const kitSelect = $('charKit');
    const preview = $('classPreview');
    if (!cls) {
        kitSelect.innerHTML = '<option value="None">None</option>';
        preview.innerHTML = '';
        return;
    }
    const kits = DB.kits[cls] || [{name:'None', source:'PHB', desc:'Standard ' + cls}];
    kitSelect.innerHTML = kits.map(k => `<option value="${k.name}">${k.name} (${k.source})</option>`).join('');
    const c = DB.classes[cls];
    preview.innerHTML = `
        <strong>${cls}</strong><br>
        Hit Die: d${c.hd} | THAC0: ${c.thac0[0][1]} at 1st<br>
        Weapon Proficiency Slots: ${c.prof_slots.weapon} | Non-Weapon: ${c.prof_slots.nonweapon} (+ bonus slots from INT)<br>
        Prime Requisite: ${c.prime_req} | Alignment: ${c.alignment.join(', ')}
    `;
    initProficiencySelectors();
    updateCreateHPDisplay();
    updateSchoolSphereSelection();
}

function updateCreateHPDisplay() {
    const cls = $('charClass').value;
    const hpDiv = $('createHPDie');
    if (!cls || !hpDiv) return;
    const c = DB.classes[cls];
    const conMod = getModifier(parseInt($('stat_con')?.value) || 10);
    hpDiv.innerHTML = `d${c.hd} + CON ${formatMod(conMod)}`;
}

function rollCreateHP() {
    const cls = $('charClass').value;
    if (!cls) return;
    const c = DB.classes[cls];
    const conMod = getModifier(parseInt($('stat_con')?.value) || 10);
    const roll = Math.max(1, rollDie(c.hd) + conMod);
    $('createHP').value = roll;
    toast(`Rolled ${roll} HP!`);
}

function initProficiencySelectors() {
    const cls = $('charClass').value;
    const el = $('profPicker');
    if (!cls || !el) return;
    const intScore = parseInt($('stat_int')?.value) || 10;
    // Keep what was already ticked if the class is the same
    const prev = el._pp && el._pp.className === cls ? ProfPicker.value(el) : null;
    ProfPicker.mount(el, {
        className: cls, level: 1, intScore,
        selectedWP: prev ? prev.weaponProfs : [], selectedSpecs: prev ? prev.weaponSpecs : [], selectedNWP: prev ? prev.nonweaponProfs : [],
        onChange: updateProfGate
    });
    updateProfGate();
}

// Proficiency step: may only continue with exactly the available slots used
function profStepProblem() {
    const el = $('profPicker');
    if (!el || !el._pp) return 'Choose a class first';
    const sum = ProfPicker.summary(el);
    const parts = [];
    const describe = (label, x) => {
        if (x.used < x.total) parts.push(`${x.total - x.used} ${label} slot${x.total - x.used > 1 ? 's' : ''} left to spend`);
        if (x.used > x.total) parts.push(`${x.used - x.total} ${label} slot${x.used - x.total > 1 ? 's' : ''} too many`);
    };
    describe('weapon', sum.weapon);
    describe('non-weapon', sum.nonweapon);
    if (!parts.length) return null;
    // A DM may give extra proficiencies (over the limit), but not leave slots unspent
    if (canOverrideProfLimits() && sum.weapon.used >= sum.weapon.total && sum.nonweapon.used >= sum.nonweapon.total) return null;
    return parts.join(', ');
}

function updateProfGate() {
    if (createStep !== 4) return;
    const problem = profStepProblem();
    const btn = $('nextBtn');
    if (btn) { btn.disabled = !!problem; btn.title = problem || ''; }
    let hint = $('profGateHint');
    if (!hint && btn) {
        hint = document.createElement('div');
        hint.id = 'profGateHint';
        hint.className = 'text-sm text-right mt-2';
        btn.parentElement.after(hint);
    }
    if (hint) hint.innerHTML = problem ? `<span class="text-red-700"><i class="fas fa-exclamation-circle mr-1"></i>${problem}</span>` : '<span class="text-green-700"><i class="fas fa-check-circle mr-1"></i>All proficiency slots chosen</span>';
}

function rollStartingGold() {
    const cls = $('charClass').value;
    let gold = 0;
    if (['Fighter','Paladin','Ranger'].includes(cls)) gold = rollDie(6)*10 + rollDie(6)*10 + rollDie(6)*10 + rollDie(6)*10 + rollDie(6)*10;
    else if (['Mage','Specialist Wizard'].includes(cls)) gold = rollDie(4)*10 + rollDie(4)*10 + rollDie(4)*10 + rollDie(4)*10;
    else if (['Cleric','Druid'].includes(cls)) gold = rollDie(6)*10 + rollDie(6)*10 + rollDie(6)*10;
    else if (['Thief','Bard'].includes(cls)) gold = rollDie(6)*10 + rollDie(6)*10 + rollDie(6)*10;
    $('charGold').value = gold;
    tempGold = gold;
    updateGoldDisplay();
}

function addToInventory(type, name) {
    const item = type === 'weapon' ? DB.weapons.find(w => w.name === name) :
                 type === 'armor' ? DB.armor.find(a => a.name === name) :
                 DB.gear.find(g => g.name === name);
    if (!item) return;
    if (tempGold < item.cost) return toast('Not enough gold!', 'error');
    tempGold -= item.cost;
    if ($('charGold')) $('charGold').value = tempGold;   // keep the gold box in step (it is the source of truth)
    tempInventory.push({...item, type, qty: 1, equipped: false, ...(type === 'weapon' ? { baseName: item.name } : {})});
    updateGoldDisplay();
    toast(`Added ${name}`);
}

function updateGoldDisplay() {
    const goldInput = $('charGold');
    if (goldInput) tempGold = parseInt(goldInput.value) || 0;
    const remaining = $('goldRemaining');
    if (remaining) remaining.textContent = tempGold;
    const invDiv = $('startingInventory');
    if (invDiv) {
        invDiv.innerHTML = tempInventory.map(i => `
            <div class="flex justify-between">
                <span>${i.name}</span>
                <span class="text-xs">${i.weight} lbs</span>
            </div>
        `).join('');
    }
}

function finishCreation() {
    const name = $('charName').value.trim();
    const race = $('charRace').value;
    const cls = $('charClass').value;
    const kit = $('charKit').value;
    const alignment = $('charAlignment').value;
    const stats = {};
    ['str','dex','con','int','wis','cha'].forEach(s => {
        stats[s] = parseInt($('stat_'+s).value) || 10;
    });
    const maxHp = parseInt($('createHP').value) || 1;
    const profProblem = profStepProblem();
    if (profProblem) return toast('Proficiencies: ' + profProblem, 'error');
    const { weaponProfs, weaponSpecs, nonweaponProfs, customs } = ProfPicker.value($('profPicker'));
    const accPreview = magicAccess({ class: cls, kit: kit || 'None' });
    const selectedSchools = accPreview && accPreview.kind === 'wizard' ? WIZARD_SCHOOLS.filter(x => !accPreview.opposed.includes(x)) : [];
    const selectedSpheres = accPreview && accPreview.kind === 'priest' ? accPreview.major.concat(accPreview.minor) : [];

    const char = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2),
        name, player: State.currentUser, race, class: cls, kit: kit || 'None', alignment,
        level: 1, xp: 0, stats, hp: maxHp, maxHp,
        age: $('charAge').value, height: $('charHeight').value, weight: $('charWeight').value,
        hair: $('charHair').value, eyes: $('charEyes').value, deity: $('charDeity').value,
        background: $('charBackground').value,
        weaponProfs, weaponSpecs, nonweaponProfs,
        selectedSchools: selectedSchools.length ? selectedSchools : [],
        selectedSpheres: selectedSpheres.length ? selectedSpheres : [],
        inventory: tempInventory.map(i => ({...i, equipped: i.type === 'armor'})),
        wealth: { pp:0, gp: tempGold, ep:0, sp:0, cp:0 },
        thiefSkills: {}, knownSpells: [], preparedSpells: [], usedSpellSlots: {},
        campaignId: State.campaignId || 'default',
        lastUpdated: Date.now()
    };
    if (cls === 'Thief' || cls === 'Bard') {
        DB.thieving_skills.forEach(s => char.thiefSkills[s.name] = s.base);
    }
    saveNewCustomProfs(char, customs);
    State.characters.push(char);
    Storage.save();
    tempInventory = [];
    tempGold = 0;
    createStep = 1;
    toast('Character created successfully!');
    changeView('dashboard');
}

function updateSchoolSphereSelection() {
    // Schools and spheres follow the PHB automatically (see js/magic.js); this just shows them
    const cls = $('charClass').value;
    const container = $('schoolSphereSelection');
    const content = $('schoolSphereContent');
    if (!cls || !container || !content) return;
    const preview = { class: cls, kit: $('charKit')?.value || 'None', stats: { wis: parseInt($('stat_wis')?.value) || 10 }, activeEffects: [] };
    if (!magicAccess(preview)) { container.classList.add('hidden'); return; }
    container.classList.remove('hidden');
    content.innerHTML = magicAccessHtml(preview) + (cls === 'Specialist Wizard' && !SPECIALISTS[preview.kit] ? '<p class="text-xs text-red-700 mt-1">Choose a specialty (kit) above.</p>' : '');
}

function render() { renderCreate(document.getElementById('app')); }

/* Init */
bootPage({}, () => {
    renderCreate(document.getElementById('app'));
    setTimeout(() => {
        updateRacePreview();
        updateClassList();
        updateStatPreview();
        initProficiencySelectors();
        updateCreateHPDisplay();
    }, 0);
});

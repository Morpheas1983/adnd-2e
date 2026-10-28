/* conditions.js - Conditions that change ability scores, saving throws, AC, THAC0, damage and initiative.
   Stored on the character in char.activeEffects (same list as spell effects) with kind: 'condition'.
   Sign conventions (same as spell effects):
     abilities +  = higher score        sets.{stat} = score set to a value (e.g. Feeblemind INT 3)
     ac        +  = worse AC            thac0  +  = worse to hit
     damage    +  = more damage         saves / save_xxx  + = better saving throw
     init      +  = acts later
*/
const COND_ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
const COND_UNITS = { rounds: 'rounds', turns: 'turns (10 rounds)', hours: 'hours', days: 'days', permanent: 'Permanent' };

// Suggested conditions (2e rules where they exist; everything can be changed before applying)
const CONDITION_PRESETS = [
    { name: 'Blinded', description: 'Cannot see. -4 to attack rolls; opponents get +4 to hit (AC 4 worse).', mods: { thac0: 4, ac: 4 }, duration: 1, durationType: 'turns' },
    { name: 'Prone', description: 'Lying on the ground. Attackers get +4 to hit.', mods: { ac: 4 }, duration: 1, durationType: 'rounds' },
    { name: 'Stunned', description: 'Cannot act. Attackers get +4 to hit.', mods: { ac: 4 }, duration: 1, durationType: 'rounds' },
    { name: 'Deafened', description: 'Cannot hear. +1 to initiative (slower), may be surprised more easily.', mods: { init: 1 }, duration: 1, durationType: 'hours' },
    { name: 'Invisible', description: 'Unseen. +2 to hit; attackers -4 to hit.', mods: { thac0: -2, ac: -4 }, duration: 1, durationType: 'turns' },
    { name: 'Weakened (Ray of Enfeeblement)', description: 'Strength drained. Adjust the amount to the spell.', mods: { str: -4 }, duration: 3, durationType: 'rounds' },
    { name: 'Fatigued', description: 'Tired after forced march or no sleep (optional rule).', mods: { str: -1, dex: -1, thac0: 1 }, duration: 8, durationType: 'hours' },
    { name: 'Diseased', description: 'Sick. Weakened until cured (Cure Disease) or the disease runs its course.', mods: { str: -2, con: -2 }, duration: 7, durationType: 'days', keepOnRest: true },
    { name: 'Cursed (Bestow Curse)', description: '-4 to attack rolls and saving throws until Remove Curse.', mods: { thac0: 4, saves: -4 }, permanent: true, keepOnRest: true },
    { name: 'Feebleminded', description: 'Intelligence and Wisdom set to 3 until Heal, Restoration or Wish.', sets: { int: 3, wis: 3 }, permanent: true, keepOnRest: true },
    { name: 'Middle Age', description: 'PHB aging: -1 STR, -1 CON, +1 INT, +1 WIS.', mods: { str: -1, con: -1, int: 1, wis: 1 }, permanent: true, keepOnRest: true },
    { name: 'Old Age', description: 'PHB aging (total): -3 STR, -2 DEX, -2 CON, +1 INT, +2 WIS.', mods: { str: -3, dex: -2, con: -2, int: 1, wis: 2 }, permanent: true, keepOnRest: true },
    { name: 'Gauntlets of Ogre Power', description: 'Strength set to 18/00 (enter 18 here; exceptional STR as noted).', sets: { str: 18 }, mods: { damage: 6, thac0: -3 }, permanent: true, keepOnRest: true },
    { name: 'Ring of Protection +1', description: '+1 to AC and saving throws.', mods: { ac: -1, saves: 1 }, permanent: true, keepOnRest: true },
    { name: 'Lucky (vs poison)', description: '+2 to saving throws vs poison.', mods: { save_ppdm: 2 }, duration: 1, durationType: 'days', keepOnRest: true }
];

function conditionPresets() {
    return [...CONDITION_PRESETS.map(p => ({ ...p, source: 'builtin' })), ...((State.customConditions || []).map(p => ({ ...p, source: 'campaign' })))];
}

function condCharById(id) { return (State.characters || []).find(c => c.id === id) || (State.currentCharacter && State.currentCharacter.id === id ? State.currentCharacter : null); }

/* ---------- Text helpers ---------- */
function condModsSummary(e) {
    const parts = [];
    const L = { str: 'STR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'WIS', cha: 'CHA', ac: 'AC', thac0: 'THAC0', damage: 'Dmg', saves: 'All saves', init: 'Init' };
    const sv = typeof SAVE_NAMES !== 'undefined' ? SAVE_NAMES : {};
    Object.entries(e.sets || {}).forEach(([k, v]) => { if (v !== '' && v != null) parts.push(`${L[k] || k} = ${v}`); });
    Object.entries(e.mods || {}).forEach(([k, v]) => {
        if (!v) return;
        const label = k.startsWith('save_') ? `Save vs ${sv[k.slice(5)] || k.slice(5).toUpperCase()}` : (L[k] || k);
        parts.push(`${label} ${v > 0 ? '+' : ''}${v}`);
    });
    return parts.join(' · ');
}
function condDurationText(e) {
    if (e.permanent) return 'Permanent';
    const unit = e.durationType || 'rounds';
    return `${e.duration} ${unit} left`;
}

/* ---------- Sheet panel ---------- */
function renderConditionsPanel(char) {
    const list = char.activeEffects || [];
    const canEdit = canWriteChar(char);
    const oldConds = char.conditions || [];
    return `
        <div class="parchment scroll-border p-4 fade-in">
            <div class="flex justify-between items-center gap-2 mb-2">
                <div class="section-header mb-0 border-0"><i class="fas fa-bolt"></i>Conditions & Effects</div>
                ${canEdit ? `<button onclick="showConditionModal('${char.id}')" class="btn-fantasy px-3 py-1 rounded text-xs"><i class="fas fa-plus mr-1"></i>Add condition</button>` : ''}
            </div>
            ${list.length === 0 && oldConds.length === 0 ? '<p class="text-amber-700 italic text-sm">None. Add a condition to change ability scores, saving throws, AC, THAC0 and more.</p>' : ''}
            <div class="space-y-2">
                ${list.map((e, i) => `
                    <div class="p-3 rounded border ${e.permanent ? 'border-purple-400 bg-purple-50' : 'border-amber-300 bg-amber-50'}" data-cond="${escapeHtml(e.name)}">
                        <div class="flex justify-between items-start gap-2">
                            <div class="min-w-0">
                                <div class="flex items-center gap-2 flex-wrap">
                                    <i class="fas ${e.kind === 'condition' ? (e.permanent ? 'fa-infinity text-purple-700' : 'fa-hourglass-half text-amber-700') : 'fa-bolt text-amber-700'}"></i>
                                    <span class="font-bold text-amber-900">${escapeHtml(e.name)}</span>
                                    <span class="text-xs ${e.permanent ? 'bg-purple-200 text-purple-900' : 'bg-amber-200 text-amber-800'} px-2 py-0.5 rounded">${condDurationText(e)}</span>
                                    ${e.keepOnRest && !e.permanent ? '<span class="text-xs text-amber-700" title="Not removed by resting"><i class="fas fa-bed"></i> stays</span>' : ''}
                                </div>
                                ${e.description ? `<div class="text-sm text-amber-800 mt-1">${escapeHtml(e.description)}</div>` : ''}
                                ${condModsSummary(e) ? `<div class="text-xs text-amber-900 mt-1 font-mono">${escapeHtml(condModsSummary(e))}</div>` : ''}
                            </div>
                            ${canEdit ? `<div class="flex gap-2 shrink-0">
                                ${!e.permanent && (e.durationType === 'hours' || e.durationType === 'days') ? `<button onclick="tickConditionById('${char.id}', ${i})" class="text-amber-800 hover:text-amber-950 text-xs font-bold" title="One ${e.durationType === 'days' ? 'day' : 'hour'} passes">−1</button>` : ''}
                                <button onclick="showConditionModal('${char.id}', ${i})" class="text-blue-700 hover:text-blue-900" title="Edit"><i class="fas fa-edit"></i></button>
                                <button onclick="removeConditionAt('${char.id}', ${i})" class="text-red-700 hover:text-red-900" title="Remove"><i class="fas fa-times"></i></button>
                            </div>` : ''}
                        </div>
                    </div>`).join('')}
                ${oldConds.map(c => `
                    <div class="p-2 rounded border border-red-300 bg-red-50 flex items-center justify-between gap-2">
                        <span><i class="fas fa-skull-crossbones text-red-700 mr-1"></i><span class="font-bold text-red-900">${escapeHtml(c)}</span></span>
                        ${canEdit ? `<button onclick="removeOldCondition('${char.id}', '${escapeHtml(c).replace(/'/g, '&#39;')}')" class="text-red-700" title="Remove"><i class="fas fa-times"></i></button>` : ''}
                    </div>`).join('')}
            </div>
        </div>`;
}

/* ---------- Add / edit modal ---------- */
let condEdit = null;   // { charId, idx }

function showConditionModal(charId, idx) {
    const char = condCharById(charId);
    if (!char) return;
    condEdit = { charId, idx: idx == null ? null : idx };
    const e = idx != null ? (char.activeEffects || [])[idx] : null;
    const presets = conditionPresets();
    const num = (id, val, title) => `<input type="number" id="${id}" value="${val == null || val === 0 ? '' : val}" placeholder="0" class="input-fantasy w-full text-center px-1 py-1 text-sm" ${title ? `title="${title}"` : ''}>`;
    const saveTypes = typeof SAVE_TYPES !== 'undefined' ? SAVE_TYPES : ['ppdm', 'rsw', 'pp', 'bw', 'sp'];
    const saveNames = typeof SAVE_NAMES !== 'undefined' ? SAVE_NAMES : {};
    $('modalContainer').innerHTML = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal-content wide" onclick="event.stopPropagation()">
                <div class="p-4 sm:p-6">
                    <h2 class="fantasy-font text-xl font-bold text-amber-900 mb-1">${e ? 'Edit condition' : 'Add condition'} · ${escapeHtml(char.name)}</h2>
                    ${!e ? `<div class="mb-3">
                        <label class="block text-xs font-bold text-amber-900 mb-1">Start from</label>
                        <select id="condPreset" class="input-fantasy w-full px-2 py-1 text-sm" onchange="fillConditionPreset(this.value)">
                            <option value="">— Custom (empty) —</option>
                            <optgroup label="Suggested">${presets.filter(p => p.source === 'builtin').map((p, i) => `<option value="b${i}">${escapeHtml(p.name)}</option>`).join('')}</optgroup>
                            ${(State.customConditions || []).length ? `<optgroup label="Campaign conditions">${(State.customConditions || []).map((p, i) => `<option value="c${i}">${escapeHtml(p.name)}</option>`).join('')}</optgroup>` : ''}
                        </select></div>` : ''}
                    <div class="grid-2 gap-3">
                        <div><label class="block text-xs font-bold text-amber-900 mb-1">Name</label>
                            <input type="text" id="condName" class="input-fantasy w-full px-2 py-1" value="${escapeHtml(e ? e.name : '')}" placeholder="e.g. Poisoned"></div>
                        <div><label class="block text-xs font-bold text-amber-900 mb-1">Duration</label>
                            <div class="flex gap-2">
                                <input type="number" id="condDur" min="1" class="input-fantasy w-20 px-2 py-1 text-center" value="${e && !e.permanent ? e.duration : 1}">
                                <select id="condUnit" class="input-fantasy flex-1 px-2 py-1 text-sm" onchange="condUnitChanged()">
                                    ${Object.entries(COND_UNITS).map(([k, v]) => `<option value="${k}" ${(e ? (e.permanent ? 'permanent' : (e.durationType || 'rounds')) : 'rounds') === k ? 'selected' : ''}>${v}</option>`).join('')}
                                </select>
                            </div></div>
                    </div>
                    <div class="mt-2"><label class="block text-xs font-bold text-amber-900 mb-1">Description</label>
                        <input type="text" id="condDesc" class="input-fantasy w-full px-2 py-1 text-sm" value="${escapeHtml(e ? e.description || '' : '')}" placeholder="What it does, how it ends..."></div>
                    <label class="flex items-center gap-2 text-sm mt-2 cursor-pointer"><input type="checkbox" id="condKeep" class="accent-amber-700" ${e && (e.keepOnRest || e.permanent) ? 'checked' : ''}> Lasts through rest (not removed by Rest)</label>

                    <div class="mt-3 text-xs font-bold text-amber-900 uppercase tracking-wide">Ability scores</div>
                    <p class="text-xs text-amber-700 mb-1">Change: +/− points. Set to: the score becomes this value (leave empty for no change).</p>
                    <div class="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        ${COND_ABILITIES.map(s => `<div class="text-center">
                            <div class="text-xs font-bold text-amber-800">${s.toUpperCase()} <span class="font-normal">(${(char.stats || {})[s] || 10})</span></div>
                            ${num('cm_' + s, e && e.mods ? e.mods[s] : null, 'Change')}
                            <input type="number" id="cs_${s}" value="${e && e.sets && e.sets[s] != null ? e.sets[s] : ''}" placeholder="set" title="Set to" class="input-fantasy w-full text-center px-1 py-1 text-xs mt-1">
                        </div>`).join('')}
                    </div>

                    <div class="mt-3 text-xs font-bold text-amber-900 uppercase tracking-wide">Combat</div>
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div><div class="text-xs text-amber-800">AC <span class="opacity-70">(− better)</span></div>${num('cm_ac', e && e.mods ? e.mods.ac : null)}</div>
                        <div><div class="text-xs text-amber-800">THAC0 <span class="opacity-70">(− better)</span></div>${num('cm_thac0', e && e.mods ? e.mods.thac0 : null)}</div>
                        <div><div class="text-xs text-amber-800">Damage</div>${num('cm_damage', e && e.mods ? e.mods.damage : null)}</div>
                        <div><div class="text-xs text-amber-800">Initiative <span class="opacity-70">(+ slower)</span></div>${num('cm_init', e && e.mods ? e.mods.init : null)}</div>
                    </div>

                    <div class="mt-3 text-xs font-bold text-amber-900 uppercase tracking-wide">Saving throws <span class="normal-case font-normal">(+ = bonus, − = penalty)</span></div>
                    <div class="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        <div><div class="text-xs text-amber-800 font-bold">All</div>${num('cm_saves', e && e.mods ? e.mods.saves : null)}</div>
                        ${saveTypes.map(t => `<div><div class="text-xs text-amber-800 truncate" title="${escapeHtml(saveNames[t] || t)}">${t.toUpperCase()}</div>${num('cm_save_' + t, e && e.mods ? e.mods['save_' + t] : null, saveNames[t] || t)}</div>`).join('')}
                    </div>

                    ${State.isDM || (typeof Cloud !== 'undefined' && Cloud.isAdmin && State.campaignId) ? `<label class="flex items-center gap-2 text-sm mt-3 cursor-pointer"><input type="checkbox" id="condSavePreset" class="accent-amber-700"> Save as a campaign condition (reusable for every character)</label>` : ''}
                    <div class="flex justify-end gap-2 mt-4">
                        <button onclick="closeModal()" class="btn-galactic px-4 py-2 rounded">Cancel</button>
                        <button onclick="saveConditionFromModal()" class="btn-fantasy px-4 py-2 rounded"><i class="fas fa-check mr-1"></i>${e ? 'Save' : 'Apply'}</button>
                    </div>
                </div>
            </div>
        </div>`;
    condUnitChanged(true);
}

function condUnitChanged(initial) {
    const perm = $('condUnit').value === 'permanent';
    $('condDur').disabled = perm;
    $('condDur').classList.toggle('opacity-40', perm);
    if (!initial && (perm || $('condUnit').value === 'days')) $('condKeep').checked = true;
}

function fillConditionPreset(v) {
    if (!v) return;
    const p = v[0] === 'b' ? CONDITION_PRESETS[parseInt(v.slice(1))] : (State.customConditions || [])[parseInt(v.slice(1))];
    if (!p) return;
    $('condName').value = p.name;
    $('condDesc').value = p.description || '';
    $('condUnit').value = p.permanent ? 'permanent' : (p.durationType || 'rounds');
    $('condDur').value = p.duration || 1;
    $('condKeep').checked = !!(p.keepOnRest || p.permanent);
    document.querySelectorAll('[id^="cm_"],[id^="cs_"]').forEach(el => { el.value = ''; });
    Object.entries(p.mods || {}).forEach(([k, val]) => { if ($('cm_' + k)) $('cm_' + k).value = val || ''; });
    Object.entries(p.sets || {}).forEach(([k, val]) => { if ($('cs_' + k)) $('cs_' + k).value = val; });
    condUnitChanged(true);
}

function readConditionForm() {
    const name = $('condName').value.trim();
    if (!name) { toast('Give the condition a name', 'error'); return null; }
    const unit = $('condUnit').value;
    const mods = {}, sets = {};
    document.querySelectorAll('[id^="cm_"]').forEach(el => { const v = parseInt(el.value); if (v) mods[el.id.slice(3)] = v; });
    document.querySelectorAll('[id^="cs_"]').forEach(el => { const v = parseInt(el.value); if (!isNaN(v) && el.value.trim() !== '') sets[el.id.slice(3)] = Math.max(1, Math.min(25, v)); });
    const c = { kind: 'condition', name, description: $('condDesc').value.trim(), mods, keepOnRest: $('condKeep').checked };
    if (Object.keys(sets).length) c.sets = sets;
    if (unit === 'permanent') { c.permanent = true; c.keepOnRest = true; c.durationType = 'permanent'; c.duration = 0; }
    else { c.durationType = unit; c.duration = Math.max(1, parseInt($('condDur').value) || 1); }
    return c;
}

function saveConditionFromModal() {
    const c = readConditionForm();
    if (!c) return;
    const char = condCharById(condEdit.charId);
    if (!char) return;
    if (!canWriteChar(char)) return toast("You can't change this character", 'error');
    char.activeEffects = char.activeEffects || [];
    if (condEdit.idx != null && char.activeEffects[condEdit.idx]) {
        char.activeEffects[condEdit.idx] = { ...c, appliedAt: char.activeEffects[condEdit.idx].appliedAt || Date.now() };
    } else {
        char.activeEffects = char.activeEffects.filter(x => x.name !== c.name);
        char.activeEffects.push({ ...c, appliedAt: Date.now() });
    }
    if ($('condSavePreset') && $('condSavePreset').checked) {
        const { appliedAt, roundsInTurn, ...preset } = c;
        State.customConditions = (State.customConditions || []).filter(p => p.name !== c.name);
        State.customConditions.push(preset);
    }
    char.lastUpdated = Date.now();
    Storage.save();
    closeModal();
    toast(`${c.name} ${condEdit.idx != null ? 'updated' : 'applied to ' + char.name}`);
    if (typeof render === 'function') render();
}

function removeConditionAt(charId, idx) {
    const char = condCharById(charId);
    if (!char || !char.activeEffects || !char.activeEffects[idx]) return;
    const name = char.activeEffects[idx].name;
    char.activeEffects.splice(idx, 1);
    Storage.save();
    toast(`${name} removed`);
    if (typeof render === 'function') render();
}

function tickConditionById(charId, idx) {
    const char = condCharById(charId);
    const e = char && (char.activeEffects || [])[idx];
    if (!e) return;
    e.duration = (e.duration || 1) - 1;
    if (e.duration <= 0) { char.activeEffects.splice(idx, 1); toast(`${e.name} has ended`); }
    Storage.save();
    if (typeof render === 'function') render();
}

function removeOldCondition(charId, name) {
    const char = condCharById(charId);
    if (!char) return;
    char.conditions = (char.conditions || []).filter(c => c !== name);
    Storage.save();
    if (typeof render === 'function') render();
}

// Small badges for Party View / Battle
function conditionBadges(char) {
    return (char.activeEffects || []).map(e => `<span class="text-xs px-1.5 py-0.5 rounded ${e.permanent ? 'bg-purple-100 text-purple-900 border border-purple-300' : 'bg-amber-200 text-amber-900 border border-amber-400'}" title="${escapeHtml((e.description || '') + (condModsSummary(e) ? ' — ' + condModsSummary(e) : ''))}">${escapeHtml(e.name)}${e.permanent ? '' : ` (${e.duration} ${(e.durationType || 'rounds').slice(0, 3)})`}</span>`).join(' ');
}

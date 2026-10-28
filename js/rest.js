/* rest.js - Full rest, short rest and custom rest; limited-use abilities (Lay on Hands, Shapechange...).
   char.abilities = [{ id, name, max, used, recharge: 'short' | 'full' | 'manual', notes }]
     short  = comes back on a short rest (and a full rest)
     full   = comes back only on a full rest
     manual = never comes back on its own (e.g. 1/week, charges) */

const ABILITY_PRESETS = {
    'Paladin': [
        { name: 'Lay on Hands (2 HP/level)', max: 1, recharge: 'full', notes: 'Once per day.' },
        { name: 'Cure Disease', max: 1, recharge: 'manual', notes: 'Once per week per 5 levels.' }
    ],
    'Druid': [{ name: 'Shapechange (from level 7)', max: 3, recharge: 'full', notes: 'Three times per day: reptile, bird, mammal.' }],
    'Ranger': [],
    'Cleric': [],
    'Bard': [{ name: 'Inspire allies (song)', max: 1, recharge: 'full', notes: '+1 morale / attack for allies, once per fight (DM).' }]
};
const RECHARGE_LABEL = { short: 'Short rest', full: 'Full rest', manual: 'Manual only' };

/* ---------- Parsing "5", "1d8", "2d4+2", "1d6-1" ---------- */
function rollAmount(txt) {
    txt = String(txt || '').replace(/\s+/g, '').toLowerCase();
    if (!txt) return 0;
    let total = 0, ok = false;
    const re = /([+-]?)(\d*)d(\d+)|([+-]?)(\d+)/g;
    let m;
    while ((m = re.exec(txt))) {
        ok = true;
        if (m[3]) {
            const n = parseInt(m[2] || '1'), d = parseInt(m[3]); let s = 0;
            for (let i = 0; i < Math.min(n, 100); i++) s += rollDie(d);
            total += m[1] === '-' ? -s : s;
        } else total += (m[4] === '-' ? -1 : 1) * parseInt(m[5]);
    }
    return ok ? total : 0;
}

/* ---------- Limited-use abilities panel (sheet) ---------- */
function renderAbilitiesPanel(char) {
    const list = char.abilities || [];
    const canEdit = canWriteChar(char);
    const presets = (ABILITY_PRESETS[char.class] || []).filter(p => !list.some(a => a.name === p.name));
    if (!list.length && !canEdit) return '';
    return `
        <div class="parchment scroll-border p-4 fade-in">
            <div class="flex justify-between items-center gap-2 mb-2">
                <div class="section-header mb-0 border-0"><i class="fas fa-hand-sparkles"></i>Limited-use Abilities</div>
                ${canEdit ? `<button onclick="showAbilityModal('${char.id}')" class="btn-fantasy px-3 py-1 rounded text-xs"><i class="fas fa-plus mr-1"></i>Add</button>` : ''}
            </div>
            ${!list.length ? `<p class="text-amber-700 italic text-sm">Abilities with a number of uses (Lay on Hands, Shapechange, magic item charges...). Rest brings them back.</p>` : ''}
            ${canEdit && presets.length ? `<div class="flex flex-wrap gap-1 mb-2">${presets.map((p, i) => `<button onclick="addAbilityPreset('${char.id}', ${(ABILITY_PRESETS[char.class] || []).indexOf(p)})" class="text-xs px-2 py-0.5 rounded border border-amber-400 bg-amber-50 hover:bg-amber-100"><i class="fas fa-plus mr-1"></i>${escapeHtml(p.name)}</button>`).join('')}</div>` : ''}
            <div class="space-y-2">
                ${list.map((a, i) => {
                    const left = Math.max(0, (a.max || 0) - (a.used || 0));
                    return `
                    <div class="p-2 rounded border border-amber-300 bg-amber-50" data-ability="${escapeHtml(a.name)}">
                        <div class="flex justify-between items-center gap-2">
                            <div class="min-w-0">
                                <div class="font-bold text-amber-900">${escapeHtml(a.name)}</div>
                                <div class="text-xs text-amber-700">${RECHARGE_LABEL[a.recharge] || ''}${a.notes ? ' · ' + escapeHtml(a.notes) : ''}</div>
                            </div>
                            <div class="flex items-center gap-1 shrink-0">
                                <span class="text-lg font-bold ${left ? 'text-amber-900' : 'text-red-700'}">${left}</span><span class="text-xs text-amber-700">/ ${a.max}</span>
                                ${canEdit ? `
                                <button onclick="useAbility('${char.id}', ${i})" class="btn-fantasy px-2 py-1 rounded text-xs ${left ? '' : 'opacity-50'}" ${left ? '' : 'disabled'} title="Use one">Use</button>
                                <button onclick="regainAbility('${char.id}', ${i})" class="btn-galactic px-2 py-1 rounded text-xs" title="Get one use back"><i class="fas fa-undo"></i></button>
                                <button onclick="showAbilityModal('${char.id}', ${i})" class="text-blue-700 px-1" title="Edit"><i class="fas fa-edit"></i></button>` : ''}
                            </div>
                        </div>
                    </div>`;
                }).join('')}
            </div>
        </div>`;
}

function restCharById(id) { return (State.characters || []).find(c => c.id === id) || (State.currentCharacter && State.currentCharacter.id === id ? State.currentCharacter : null); }

function addAbilityPreset(charId, idx) {
    const char = restCharById(charId);
    const p = (ABILITY_PRESETS[char.class] || [])[idx];
    if (!char || !p) return;
    char.abilities = char.abilities || [];
    char.abilities.push({ id: Date.now().toString(36), ...p, used: 0 });
    Storage.save(); render();
}
function useAbility(charId, i) {
    const char = restCharById(charId); const a = char && (char.abilities || [])[i];
    if (!a || (a.used || 0) >= a.max) return;
    a.used = (a.used || 0) + 1;
    Storage.save(); toast(`${a.name} used (${a.max - a.used} left)`); render();
}
function regainAbility(charId, i) {
    const char = restCharById(charId); const a = char && (char.abilities || [])[i];
    if (!a) return;
    a.used = Math.max(0, (a.used || 0) - 1);
    Storage.save(); render();
}
function showAbilityModal(charId, idx) {
    const char = restCharById(charId); if (!char) return;
    const a = idx != null ? char.abilities[idx] : null;
    $('modalContainer').innerHTML = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal-content" onclick="event.stopPropagation()">
                <div class="p-6">
                    <h2 class="fantasy-font text-xl font-bold text-amber-900 mb-3">${a ? 'Edit ability' : 'New limited-use ability'}</h2>
                    <label class="block text-xs font-bold text-amber-900 mb-1">Name</label>
                    <input id="abName" class="input-fantasy w-full px-2 py-1 mb-2" value="${escapeHtml(a ? a.name : '')}" placeholder="e.g. Wand of Fire charges">
                    <div class="grid-2 gap-3">
                        <div><label class="block text-xs font-bold text-amber-900 mb-1">Uses</label>
                            <input id="abMax" type="number" min="1" class="input-fantasy w-full px-2 py-1 text-center" value="${a ? a.max : 1}"></div>
                        <div><label class="block text-xs font-bold text-amber-900 mb-1">Comes back on</label>
                            <select id="abRecharge" class="input-fantasy w-full px-2 py-1">
                                ${Object.entries(RECHARGE_LABEL).map(([k, v]) => `<option value="${k}" ${(a ? a.recharge : 'full') === k ? 'selected' : ''}>${v}</option>`).join('')}
                            </select></div>
                    </div>
                    <label class="block text-xs font-bold text-amber-900 mb-1 mt-2">Notes</label>
                    <input id="abNotes" class="input-fantasy w-full px-2 py-1" value="${escapeHtml(a ? a.notes || '' : '')}">
                    <div class="flex justify-between gap-2 mt-4">
                        ${a ? `<button onclick="deleteAbility('${charId}', ${idx})" class="btn-danger px-3 py-2 rounded"><i class="fas fa-trash"></i></button>` : '<span></span>'}
                        <div class="flex gap-2">
                            <button onclick="closeModal()" class="btn-galactic px-4 py-2 rounded">Cancel</button>
                            <button onclick="saveAbility('${charId}', ${idx == null ? 'null' : idx})" class="btn-fantasy px-4 py-2 rounded">Save</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
}
function saveAbility(charId, idx) {
    const char = restCharById(charId); if (!char) return;
    const name = $('abName').value.trim();
    if (!name) return toast('Give the ability a name', 'error');
    const a = { name, max: Math.max(1, parseInt($('abMax').value) || 1), recharge: $('abRecharge').value, notes: $('abNotes').value.trim() };
    char.abilities = char.abilities || [];
    if (idx != null && char.abilities[idx]) char.abilities[idx] = { ...char.abilities[idx], ...a, used: Math.min(char.abilities[idx].used || 0, a.max) };
    else char.abilities.push({ id: Date.now().toString(36), ...a, used: 0 });
    Storage.save(); closeModal(); render();
}
function deleteAbility(charId, idx) {
    const char = restCharById(charId); if (!char) return;
    char.abilities.splice(idx, 1);
    Storage.save(); closeModal(); render();
}

/* ---------- Restoring single spell slots ---------- */
function restoreSpellSlot(charId, level) {
    const char = restCharById(charId); if (!char || !char.usedSpellSlots) return;
    char.usedSpellSlots[level] = Math.max(0, (char.usedSpellSlots[level] || 0) - 1);
    Storage.save(); toast(`Level ${level} spell slot restored`); render();
}

/* ---------- Rest dialog ---------- */
let restIds = [];
const REST_PREF_KEY = 'adnd2e_restPrefs';
function loadRestPrefs() { try { return JSON.parse(localStorage.getItem(REST_PREF_KEY) || 'null') || {}; } catch (e) { return {}; } }
function saveRestPrefs(p) { try { localStorage.setItem(REST_PREF_KEY, JSON.stringify(p)); } catch (e) {} }

function showRestModal(ids) {
    restIds = (ids || []).filter(id => { const c = restCharById(id); return c && canWriteChar(c); });
    if (!restIds.length) return toast('No characters you can change', 'error');
    const chars = restIds.map(restCharById);
    const prefs = loadRestPrefs();
    const maxLevel = Math.max(0, ...chars.map(c => (typeof spellSlotsFor === 'function' ? spellSlotsFor(c).slots.length : 0)));
    const usedLevels = [...Array(maxLevel).keys()].map(i => i + 1);
    const abilityNames = [...new Set(chars.flatMap(c => (c.abilities || []).map(a => a.name)))];
    const one = chars.length === 1 ? chars[0] : null;
    $('modalContainer').innerHTML = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal-content wide" onclick="event.stopPropagation()">
                <div class="p-4 sm:p-6">
                    <h2 class="fantasy-font text-xl font-bold text-amber-900 mb-1"><i class="fas fa-bed mr-2"></i>Rest · ${one ? escapeHtml(one.name) : chars.length + ' characters'}</h2>
                    <div class="grid grid-cols-3 gap-2 my-3">
                        <button onclick="setRestType('full')" id="rt_full" class="rest-type px-2 py-2 rounded border-2 text-sm font-bold">Full rest</button>
                        <button onclick="setRestType('short')" id="rt_short" class="rest-type px-2 py-2 rounded border-2 text-sm font-bold">Short rest</button>
                        <button onclick="setRestType('custom')" id="rt_custom" class="rest-type px-2 py-2 rounded border-2 text-sm font-bold">Custom</button>
                    </div>
                    <p id="restTypeHelp" class="text-xs text-amber-700 mb-3"></p>

                    <div class="space-y-3 text-sm">
                        <div class="p-3 rounded bg-amber-50 border border-amber-300">
                            <div class="font-bold text-amber-900 mb-1"><i class="fas fa-heart mr-1 text-red-700"></i>Hit points</div>
                            <div class="flex flex-wrap gap-3 items-center">
                                <label class="flex items-center gap-1"><input type="radio" name="restHp" value="none" class="accent-amber-700"> None</label>
                                <label class="flex items-center gap-1"><input type="radio" name="restHp" value="full" class="accent-amber-700"> Full</label>
                                <label class="flex items-center gap-1"><input type="radio" name="restHp" value="amount" class="accent-amber-700"> Heal</label>
                                <input id="restHpAmount" class="input-fantasy w-24 px-2 py-0.5 text-center" placeholder="e.g. 1d8" value="${escapeHtml(prefs.hpAmount || '')}" oninput="document.querySelector('[name=restHp][value=amount]').checked = true">
                                <button onclick="$('restHpAmount').value='1'; document.querySelector('[name=restHp][value=amount]').checked = true" class="text-xs underline text-amber-800" title="PHB natural healing">1 day of rest = 1</button>
                            </div>
                        </div>

                        ${maxLevel ? `<div class="p-3 rounded bg-amber-50 border border-amber-300">
                            <div class="font-bold text-amber-900 mb-1"><i class="fas fa-hat-wizard mr-1 text-purple-700"></i>Spell slots</div>
                            <div class="flex flex-wrap gap-3 items-center mb-1">
                                <label class="flex items-center gap-1"><input type="radio" name="restSpells" value="none" class="accent-amber-700"> None</label>
                                <label class="flex items-center gap-1"><input type="radio" name="restSpells" value="all" class="accent-amber-700"> All</label>
                                <label class="flex items-center gap-1"><input type="radio" name="restSpells" value="some" class="accent-amber-700"> Choose per level:</label>
                            </div>
                            <div class="flex flex-wrap gap-2">
                                ${usedLevels.map(l => {
                                    const used = one ? ((one.usedSpellSlots || {})[l] || 0) : null;
                                    return `<label class="text-xs text-center">L${l}${one ? ` <span class="text-amber-600">(${used} used)</span>` : ''}<br>
                                    <input type="number" min="0" id="restSl_${l}" value="${(prefs.slots || {})[l] || 0}" class="input-fantasy w-14 px-1 py-0.5 text-center" oninput="document.querySelector('[name=restSpells][value=some]').checked = true"></label>`;
                                }).join('')}
                            </div>
                        </div>` : ''}

                        ${abilityNames.length ? `<div class="p-3 rounded bg-amber-50 border border-amber-300">
                            <div class="font-bold text-amber-900 mb-1"><i class="fas fa-hand-sparkles mr-1 text-amber-700"></i>Limited-use abilities</div>
                            <div class="flex flex-col gap-1">
                                ${abilityNames.map((n, i) => `<label class="flex items-center gap-2"><input type="checkbox" class="accent-amber-700 restAb" data-name="${escapeHtml(n)}"> ${escapeHtml(n)}</label>`).join('')}
                            </div>
                        </div>` : ''}

                        <div class="p-3 rounded bg-amber-50 border border-amber-300">
                            <div class="font-bold text-amber-900 mb-1"><i class="fas fa-bolt mr-1 text-amber-700"></i>Conditions & effects</div>
                            <label class="flex items-start gap-2" style="flex-wrap:nowrap"><input type="checkbox" id="restEndShort" class="accent-amber-700 shrink-0 mt-1" style="width:auto"><span>End combat effects and conditions (rounds / turns)</span></label>
                            <label class="flex items-start gap-2 mt-1" style="flex-wrap:nowrap"><input type="checkbox" id="restEndRest" class="accent-amber-700 shrink-0 mt-1" style="width:auto"><span>End everything a full rest removes (keeps permanent and "lasts through rest")</span></label>
                            <div class="flex items-center gap-2 mt-1">Time passed:
                                <input type="number" min="0" id="restHours" class="input-fantasy w-16 px-1 py-0.5 text-center" value="0"> hours
                                <span class="text-xs text-amber-700">(counts down hour/day conditions)</span></div>
                        </div>
                    </div>
                    <label class="flex items-center gap-2 text-xs mt-3"><input type="checkbox" id="restRemember" class="accent-amber-700" checked> Remember my custom choices</label>
                    <div class="flex justify-end gap-2 mt-4">
                        <button onclick="closeModal()" class="btn-galactic px-4 py-2 rounded">Cancel</button>
                        <button onclick="applyRest()" class="btn-fantasy px-4 py-2 rounded"><i class="fas fa-check mr-1"></i>Rest</button>
                    </div>
                </div>
            </div>
        </div>`;
    window.__restPrefs = prefs;
    setRestType(prefs.lastType || 'full');
}

function setRestType(type) {
    window.__restType = type;
    ['full', 'short', 'custom'].forEach(t => {
        const b = $('rt_' + t); if (!b) return;
        b.className = `rest-type px-2 py-2 rounded border-2 text-sm font-bold ${t === type ? 'bg-amber-700 text-white border-amber-900' : 'bg-amber-50 text-amber-900 border-amber-400'}`;
    });
    const help = {
        full: 'A night\'s sleep: everything comes back (HP, all spell slots, all abilities except "manual"), short conditions end, 8 hours pass.',
        short: 'A short break: abilities marked "Short rest" come back and combat effects end. Change anything below before resting.',
        custom: 'Pick exactly what comes back.'
    };
    $('restTypeHelp').textContent = help[type];
    const p = window.__restPrefs || {};
    const set = (name, v) => { const el = document.querySelector(`[name=${name}][value=${v}]`); if (el) el.checked = true; };
    const chars = restIds.map(restCharById);
    if (type === 'full') {
        set('restHp', 'full'); set('restSpells', 'all');
        document.querySelectorAll('.restAb').forEach(el => { el.checked = chars.some(c => (c.abilities || []).some(a => a.name === el.dataset.name && a.recharge !== 'manual')); });
        $('restEndShort').checked = true; $('restEndRest').checked = true; $('restHours').value = 8;
    } else if (type === 'short') {
        set('restHp', 'none'); set('restSpells', 'none');
        document.querySelectorAll('.restAb').forEach(el => { el.checked = chars.some(c => (c.abilities || []).some(a => a.name === el.dataset.name && a.recharge === 'short')); });
        $('restEndShort').checked = true; $('restEndRest').checked = false; $('restHours').value = 1;
    } else {
        set('restHp', p.hp || 'none'); set('restSpells', p.spells || 'none');
        document.querySelectorAll('.restAb').forEach(el => { el.checked = (p.abilities || []).includes(el.dataset.name); });
        $('restEndShort').checked = !!p.endShort; $('restEndRest').checked = !!p.endRest; $('restHours').value = p.hours || 0;
    }
}

function applyRest() {
    const type = window.__restType || 'full';
    const hpMode = (document.querySelector('[name=restHp]:checked') || {}).value || 'none';
    const hpTxt = $('restHpAmount').value.trim();
    const spMode = (document.querySelector('[name=restSpells]:checked') || {}).value || 'none';
    const slots = {};
    document.querySelectorAll('[id^="restSl_"]').forEach(el => { const n = parseInt(el.value) || 0; if (n > 0) slots[el.id.slice(7)] = n; });
    const abilities = [...document.querySelectorAll('.restAb')].filter(el => el.checked).map(el => el.dataset.name);
    const endShort = $('restEndShort').checked, endRest = $('restEndRest').checked;
    const hours = Math.max(0, parseInt($('restHours').value) || 0);
    if (type === 'custom' && $('restRemember').checked) saveRestPrefs({ lastType: 'custom', hp: hpMode, hpAmount: hpTxt, spells: spMode, slots, abilities, endShort, endRest, hours });
    else { const p = loadRestPrefs(); p.lastType = type; saveRestPrefs(p); }

    const report = [];
    restIds.map(restCharById).forEach(char => {
        if (!char || !canWriteChar(char)) return;
        const r = [];
        // HP
        if (hpMode === 'full' && char.hp < char.maxHp) { r.push(`+${char.maxHp - char.hp} HP`); char.hp = char.maxHp; }
        else if (hpMode === 'amount' && hpTxt) {
            const heal = Math.max(0, rollAmount(hpTxt));
            const before = char.hp;
            char.hp = Math.min(char.maxHp, (char.hp || 0) + heal);
            r.push(`+${char.hp - before} HP${/d/i.test(hpTxt) ? ` (rolled ${heal})` : ''}`);
        }
        // Spell slots
        if (spMode === 'all' && Object.values(char.usedSpellSlots || {}).some(v => v > 0)) { char.usedSpellSlots = {}; r.push('all spell slots'); }
        else if (spMode === 'some') {
            const got = [];
            Object.entries(slots).forEach(([l, n]) => {
                const used = (char.usedSpellSlots || {})[l] || 0;
                const back = Math.min(used, n);
                if (back) { char.usedSpellSlots[l] = used - back; got.push(`${back}×L${l}`); }
            });
            if (got.length) r.push('slots ' + got.join(', '));
        }
        // Abilities
        (char.abilities || []).forEach(a => { if (abilities.includes(a.name) && a.used) { a.used = 0; r.push(a.name); } });
        // Conditions & effects
        let effects = char.activeEffects || [];
        const n0 = effects.length;
        if (endRest) effects = effects.filter(e => e.permanent || e.keepOnRest);
        if (endShort) effects = effects.filter(e => !(!e.permanent && (!e.durationType || e.durationType === 'rounds' || e.durationType === 'turns')));
        if (hours) {
            effects = effects.filter(e => {
                if (e.permanent) return true;
                if (e.durationType === 'hours') { e.duration -= hours; return e.duration > 0; }
                if (e.durationType === 'days') {
                    e.hoursInDay = (e.hoursInDay || 0) + hours;
                    while (e.hoursInDay >= 24) { e.hoursInDay -= 24; e.duration--; }
                    return e.duration > 0;
                }
                return true;
            });
        }
        if (effects.length !== n0) r.push(`${n0 - effects.length} effect(s) ended`);
        char.activeEffects = effects;
        if (endRest) char.conditions = (char.conditions || []).filter(c => !['Fatigued', 'Exhausted', 'Berserking'].includes(c));
        char.lastUpdated = Date.now();
        report.push(`${char.name}: ${r.length ? r.join(', ') : 'nothing to restore'}`);
    });
    Storage.save();
    closeModal();
    toast((type === 'full' ? 'Full rest. ' : type === 'short' ? 'Short rest. ' : 'Rest. ') + report.join(' | '));
    if (typeof render === 'function') render();
}

// Old buttons now open the dialog
function restById(id) { showRestModal([id]); }
function restAll() {
    const ids = (State.characters || []).filter(c => !State.campaignId || c.campaignId === State.campaignId).filter(canWriteChar).map(c => c.id);
    showRestModal(ids);
}
function restSpells() { if (State.currentCharacter) showRestModal([State.currentCharacter.id]); }

/* ============================
   PROFICIENCY RULES (AD&D 2nd Edition PHB, Chapter 5)
   ============================
   - Slots per class group and level (PHB Table 34)
   - Bonus non-weapon slots from Intelligence ("# of languages", PHB Table 4)
   - Non-weapon proficiency groups and slot costs (PHB Table 37); +1 slot outside your groups
   - Non-proficiency attack penalty, fighter weapon specialization
   - Proficiency checks: ability score + modifier, roll d20 equal or under
*/

const PROF_GROUPS = {
    Fighter: 'warrior', Paladin: 'warrior', Ranger: 'warrior',
    Mage: 'wizard', 'Specialist Wizard': 'wizard',
    Cleric: 'priest', Druid: 'priest',
    Thief: 'rogue', Bard: 'rogue'
};

// PHB Table 34: initial slots, +1 slot every N levels, non-proficiency penalty
const PROF_TABLE = {
    warrior: { wp: 4, wpEvery: 3, penalty: -2, nwp: 3, nwpEvery: 3 },
    wizard:  { wp: 1, wpEvery: 6, penalty: -5, nwp: 4, nwpEvery: 3 },
    priest:  { wp: 2, wpEvery: 4, penalty: -3, nwp: 4, nwpEvery: 3 },
    rogue:   { wp: 2, wpEvery: 4, penalty: -3, nwp: 3, nwpEvery: 4 }
};

// Proficiencies some classes get for free
const FREE_NWP = { Ranger: ['Tracking'] };

// PHB Table 37. groups: which class groups can take it at normal cost ('general' = everyone).
const NWP_META = {
    'Agriculture': { slots: 1, groups: ['general'] },
    'Animal Handling': { slots: 1, groups: ['general'] },
    'Animal Training': { slots: 1, groups: ['general'] },
    'Artistic Ability': { slots: 1, groups: ['general'] },
    'Blacksmithing': { slots: 1, groups: ['general'] },
    'Brewing': { slots: 1, groups: ['general'] },
    'Carpentry': { slots: 1, groups: ['general'] },
    'Cobbling': { slots: 1, groups: ['general'] },
    'Cooking': { slots: 1, groups: ['general'] },
    'Dancing': { slots: 1, groups: ['general'] },
    'Direction Sense': { slots: 1, groups: ['general'] },
    'Etiquette': { slots: 1, groups: ['general'] },
    'Fire-building': { slots: 1, groups: ['general'] },
    'Fishing': { slots: 1, groups: ['general'] },
    'Heraldry': { slots: 1, groups: ['general'], ability: 'INT', mod: 0 },
    'Languages (Modern)': { slots: 1, groups: ['general'] },
    'Leatherworking': { slots: 1, groups: ['general'] },
    'Mining': { slots: 2, groups: ['general'], ability: 'WIS', mod: -3 },
    'Painting': { slots: 1, groups: ['general'] },
    'Pottery': { slots: 1, groups: ['general'] },
    'Riding (Airborne)': { slots: 2, groups: ['general'] },
    'Riding (Land-based)': { slots: 1, groups: ['general'] },
    'Rope Use': { slots: 1, groups: ['general'] },
    'Seamanship': { slots: 1, groups: ['general'] },
    'Sewing': { slots: 1, groups: ['general'] },
    'Singing': { slots: 1, groups: ['general'] },
    'Stonemasonry': { slots: 1, groups: ['general'] },
    'Swimming': { slots: 1, groups: ['general'] },
    'Weather Sense': { slots: 1, groups: ['general'] },
    'Weaving': { slots: 1, groups: ['general'] },
    // Priest
    'Astrology': { slots: 2, groups: ['priest', 'wizard'], ability: 'INT', mod: 0 },
    'Engineering': { slots: 2, groups: ['priest', 'wizard'], ability: 'INT', mod: -3 },
    'Healing': { slots: 2, groups: ['priest'] },
    'Herbalism': { slots: 2, groups: ['priest', 'wizard'] },
    'Languages (Ancient)': { slots: 1, groups: ['priest', 'wizard'], ability: 'INT', mod: 0 },
    'Local History': { slots: 1, groups: ['priest', 'rogue'] },
    'Musical Instrument': { slots: 1, groups: ['priest', 'rogue'] },
    'Navigation': { slots: 1, groups: ['priest', 'wizard'] },
    'Reading/Writing': { slots: 1, groups: ['priest', 'wizard'], ability: 'INT', mod: 1 },
    'Religion': { slots: 1, groups: ['priest', 'wizard'], ability: 'WIS', mod: 0 },
    'Spellcraft': { slots: 1, groups: ['priest', 'wizard'], ability: 'INT', mod: -2 },
    // Rogue
    'Ancient History': { slots: 1, groups: ['rogue', 'wizard'], ability: 'INT', mod: -1 },
    'Appraising': { slots: 1, groups: ['rogue'], ability: 'INT', mod: 0 },
    'Blind-fighting': { slots: 2, groups: ['rogue', 'warrior'], ability: 'N/A', mod: 0 },
    'Disguise': { slots: 1, groups: ['rogue'] },
    'Forgery': { slots: 1, groups: ['rogue'] },
    'Gaming': { slots: 1, groups: ['rogue', 'warrior'] },
    'Gem Cutting': { slots: 2, groups: ['rogue', 'wizard'], ability: 'DEX', mod: -2 },
    'Juggling': { slots: 1, groups: ['rogue'], ability: 'DEX', mod: -1 },
    'Jumping': { slots: 1, groups: ['rogue'], ability: 'STR', mod: 0 },
    'Reading Lips': { slots: 2, groups: ['rogue'], ability: 'INT', mod: -2 },
    'Set Snares': { slots: 1, groups: ['rogue', 'warrior'], ability: 'DEX', mod: -1 },
    'Tightrope Walking': { slots: 1, groups: ['rogue'], ability: 'DEX', mod: 0 },
    'Tumbling': { slots: 1, groups: ['rogue'], ability: 'DEX', mod: 0 },
    'Ventriloquism': { slots: 1, groups: ['rogue'], ability: 'INT', mod: -2 },
    // Warrior
    'Animal Lore': { slots: 1, groups: ['warrior'], ability: 'INT', mod: 0 },
    'Armorer': { slots: 2, groups: ['warrior'], ability: 'INT', mod: -2 },
    'Bowyer/Fletcher': { slots: 1, groups: ['warrior'], ability: 'DEX', mod: -1 },
    'Charioteering': { slots: 1, groups: ['warrior'], ability: 'DEX', mod: 2 },
    'Endurance': { slots: 2, groups: ['warrior'], ability: 'CON', mod: 0 },
    'Hunting': { slots: 1, groups: ['warrior'] },
    'Mountaineering': { slots: 1, groups: ['warrior'] },
    'Running': { slots: 1, groups: ['warrior'], ability: 'CON', mod: -6 },
    'Survival': { slots: 2, groups: ['warrior'], ability: 'INT', mod: 0 },
    'Tracking': { slots: 2, groups: ['warrior'] },
    'Weaponsmithing': { slots: 3, groups: ['warrior'], ability: 'INT', mod: -3 }
};

// Add the PHB proficiencies that the original list didn't have, then keep the list sorted
(function extendNonweaponList() {
    const have = new Set(DB.nonweapon_proficiencies.map(p => p.name));
    Object.entries(NWP_META).forEach(([name, m]) => {
        if (!have.has(name) && m.ability) DB.nonweapon_proficiencies.push({ name, ability: m.ability, mod: m.mod || 0 });
    });
    DB.nonweapon_proficiencies.sort((a, b) => a.name.localeCompare(b.name));
    ['Knife'].forEach(w => { if (!DB.weapon_proficiencies.includes(w)) DB.weapon_proficiencies.push(w); });
    DB.weapon_proficiencies.sort();
})();

const GROUP_LABEL = { general: 'General', warrior: 'Warrior', wizard: 'Wizard', priest: 'Priest', rogue: 'Rogue' };

function classGroup(className) { return PROF_GROUPS[className] || 'warrior'; }

// Bonus non-weapon slots from Intelligence (PHB Table 4, "# of Languages")
function intBonusSlots(intScore) {
    const i = parseInt(intScore) || 10;
    if (i <= 1) return 0;
    if (i <= 8) return 1;
    if (i <= 11) return 2;
    if (i <= 13) return 3;
    if (i <= 15) return 4;
    if (i === 16) return 5;
    if (i === 17) return 6;
    if (i === 18) return 7;
    return 8 + Math.max(0, i - 19); // 19: 8, 20: 9, ...
}

function nwpInfo(name) {
    const base = DB.nonweapon_proficiencies.find(p => p.name === name) || {};
    const meta = NWP_META[name] || { slots: 1, groups: ['general'] };
    return { name, ability: base.ability || meta.ability || 'N/A', mod: base.mod ?? meta.mod ?? 0, slots: meta.slots || 1, groups: meta.groups || ['general'] };
}

// Slot cost of a non-weapon proficiency for a class (+1 outside the class's groups, free for class bonus profs)
function nwpCost(className, name) {
    if ((FREE_NWP[className] || []).includes(name)) return 0;
    const info = nwpInfo(name);
    const g = classGroup(className);
    const inGroup = info.groups.includes('general') || info.groups.includes(g);
    return info.slots + (inGroup ? 0 : 1);
}

function canSpecialize(className) { return className === 'Fighter'; }
function isBowProf(name) { return /^Bow/.test(name); }
// Extra slots to specialize: 1 for most weapons, 2 for bows (crossbows count as normal)
function specializationCost(name) { return isBowProf(name) ? 2 : 1; }

/* Total slots and slots used.
   opts: { className, level, intScore, weaponProfs, weaponSpecs, nonweaponProfs } */
function profSlotSummary(opts) {
    const g = PROF_TABLE[classGroup(opts.className)];
    const level = Math.max(1, parseInt(opts.level) || 1);
    const wpTotal = g.wp + Math.floor((level - 1) / g.wpEvery);
    const intBonus = intBonusSlots(opts.intScore);
    const nwpBase = g.nwp + Math.floor((level - 1) / g.nwpEvery);
    const wps = opts.weaponProfs || [];
    const specs = (opts.weaponSpecs || []).filter(s => wps.includes(s));
    const wpUsed = wps.length + specs.reduce((n, s) => n + specializationCost(s), 0);
    const nwpUsed = (opts.nonweaponProfs || []).reduce((n, p) => n + nwpCost(opts.className, p), 0);
    return {
        group: classGroup(opts.className),
        penalty: g.penalty,
        weapon: { total: wpTotal, used: wpUsed, left: wpTotal - wpUsed },
        nonweapon: { total: nwpBase + intBonus, base: nwpBase, intBonus, used: nwpUsed, left: nwpBase + intBonus - nwpUsed }
    };
}

function charProfSummary(char) {
    return profSlotSummary({
        className: char.class, level: char.level, intScore: char.stats?.int || 10,
        weaponProfs: char.weaponProfs, weaponSpecs: char.weaponSpecs, nonweaponProfs: char.nonweaponProfs
    });
}

/* ---------- Weapons ---------- */
function profWords(s) {
    return String(s || '').toLowerCase().replace(/\+\d+/g, ' ').replace(/[^a-z' ]/g, ' ').replace(/'s\b/g, 's')
        .split(/\s+/).filter(w => w && !['of', 'the', 'and'].includes(w));
}
// Which weapon proficiency does an inventory weapon fall under?
function weaponProfFor(item) {
    if (!item) return null;
    if (item.profName) return item.profName;
    const words = new Set(profWords(item.baseName || item.name));
    let best = null, bestLen = 0;
    DB.weapon_proficiencies.forEach(p => {
        const pw = profWords(p);
        if (pw.every(w => words.has(w)) && pw.length > bestLen) { best = p; bestLen = pw.length; }
    });
    if (!best && ['halberd', 'glaive', 'guisarme', 'partisan', 'pike', 'voulge', 'bardiche', 'ranseur', 'spetum', 'fauchard'].some(w => words.has(w))) best = 'Polearm';
    return best;
}

// Attacks per round for warriors (PHB Table 14) and specialists (PHB Table 35); "3/2" means 3 every 2 rounds
function attacksPerRound(char, specialized) {
    const lvl = char.level || 1;
    const warrior = classGroup(char.class) === 'warrior';
    if (specialized) return lvl >= 13 ? '5/2' : lvl >= 7 ? '2' : '3/2';
    if (warrior) return lvl >= 13 ? '2' : lvl >= 7 ? '3/2' : '1';
    return '1';
}

/* Everything that changes a weapon attack. Used by the character sheet. */
function weaponAttackInfo(char, weapon) {
    const thac0 = getTHAC0(char.class, char.level);
    const strMod = getModifier(getModifiedStat(char, 'str'));
    const prof = weaponProfFor(weapon);
    const proficient = !!prof && (char.weaponProfs || []).includes(prof);
    const specialized = proficient && canSpecialize(char.class) && (char.weaponSpecs || []).includes(prof);
    const summary = PROF_TABLE[classGroup(char.class)];
    const nonProfPenalty = proficient ? 0 : summary.penalty;          // negative number
    const specHit = specialized ? 1 : 0;
    const specDmg = specialized ? 2 : 0;
    const toHit = (weapon.bonusAttack || 0) + strMod + specHit + nonProfPenalty;
    return {
        prof, proficient, specialized, nonProfPenalty, specHit, specDmg, strMod,
        baseThac0: thac0,
        effTHAC0: thac0 - toHit,
        dmgMod: strMod + (weapon.bonusDamage || 0) + specDmg,
        attacks: attacksPerRound(char, specialized)
    };
}

/* ---------- Non-weapon proficiency checks ---------- */
function nwpCheckScore(char, name) {
    const info = nwpInfo(name);
    if (!info.ability || info.ability === 'N/A') return null;   // no roll needed
    const stat = getModifiedStat(char, info.ability.toLowerCase());
    return Math.max(1, stat + (info.mod || 0));
}

function rollProficiencyCheck(name) {
    const char = State.currentCharacter;
    if (!char) return;
    const score = nwpCheckScore(char, name);
    if (score === null) return toast(`${name}: no roll needed`);
    const roll = rollDie(20);
    const ok = roll !== 20 && roll <= score;
    toast(`${name}: rolled ${roll} vs ${score}: ${ok ? 'Success!' : 'Failed'}`, ok ? 'success' : 'error');
}

// Can the current user break the slot limits? (DM / admin, e.g. to grant rewards)
function canOverrideProfLimits() {
    return !!(State.isDM || (typeof Cloud !== 'undefined' && Cloud.isAdmin));
}

/* ---------- Reusable proficiency picker (character creation + level up) ----------
   ProfPicker.mount(element, { className, level, intScore, lockedWP, lockedSpecs, lockedNWP, selectedWP, selectedSpecs, selectedNWP, onChange })
   Locked items are already known (shown ticked, can't be removed). */
const ProfPicker = {
    mount(el, opts) {
        el._pp = {
            className: opts.className, level: opts.level || 1, intScore: opts.intScore || 10,
            lockedWP: opts.lockedWP || [], lockedSpecs: opts.lockedSpecs || [], lockedNWP: opts.lockedNWP || [],
            wp: new Set([...(opts.lockedWP || []), ...(opts.selectedWP || [])]),
            specs: new Set([...(opts.lockedSpecs || []), ...(opts.selectedSpecs || [])]),
            nwp: new Set([...(opts.lockedNWP || []), ...(opts.selectedNWP || [])]),
            onChange: opts.onChange || (() => {})
        };
        // Class bonus proficiencies (e.g. Ranger tracking) are always included
        (FREE_NWP[opts.className] || []).forEach(n => el._pp.nwp.add(n));
        ProfPicker.render(el);
    },
    summary(el) {
        const st = el._pp;
        return profSlotSummary({ className: st.className, level: st.level, intScore: st.intScore,
            weaponProfs: [...st.wp], weaponSpecs: [...st.specs], nonweaponProfs: [...st.nwp] });
    },
    value(el) { const st = el._pp; return { weaponProfs: [...st.wp], weaponSpecs: [...st.specs].filter(x => st.wp.has(x)), nonweaponProfs: [...st.nwp] }; },
    toggle(el, kind, name, on) {
        const st = el._pp;
        if (kind === 'wp') { on ? st.wp.add(name) : (st.wp.delete(name), st.specs.delete(name)); }
        else if (kind === 'spec') { on ? st.specs.add(name) : st.specs.delete(name); }
        else { on ? st.nwp.add(name) : st.nwp.delete(name); }
        ProfPicker.render(el, true);
        st.onChange(ProfPicker.summary(el));
    },
    render(el, keepScroll) {
        const st = el._pp;
        const sum = ProfPicker.summary(el);
        const override = canOverrideProfLimits();
        const scrolls = keepScroll ? [...el.querySelectorAll('.pp-list')].map(x => x.scrollTop) : [];
        const g = classGroup(st.className);
        const counter = (label, x, extra) => {
            const cls = x.used > x.total ? 'bg-red-100 text-red-800 border-red-400' : x.used === x.total ? 'bg-green-100 text-green-800 border-green-400' : 'bg-amber-100 text-amber-900 border-amber-400';
            return `<div class="pp-counter px-3 py-2 rounded border ${cls} text-sm font-bold flex justify-between items-center gap-2">
                <span>${label}</span><span><span class="text-lg">${x.used}</span> / ${x.total} slots${extra || ''}</span></div>`;
        };
        const wpHtml = DB.weapon_proficiencies.map(p => {
            const checked = st.wp.has(p), locked = st.lockedWP.includes(p);
            const disabled = locked || (!checked && sum.weapon.left < 1 && !override);
            const spec = st.specs.has(p), specLocked = st.lockedSpecs.includes(p);
            const specCost = specializationCost(p);
            const specDisabled = specLocked || (!spec && sum.weapon.left < specCost && !override);
            return `<div class="flex items-center justify-between gap-2 p-1 rounded ${checked ? 'bg-amber-200' : 'hover:bg-amber-100'}">
                <label class="flex items-center gap-2 cursor-pointer flex-1 ${disabled && !checked ? 'opacity-50' : ''}">
                    <input type="checkbox" data-kind="wp" data-name="${p}" ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''} class="accent-amber-700">
                    <span class="text-sm">${p}</span>
                </label>
                ${checked && canSpecialize(st.className) ? `<label class="text-xs flex items-center gap-1 cursor-pointer ${specDisabled && !spec ? 'opacity-50' : ''}" title="Specialization: +1 to hit, +2 damage, extra attacks">
                    <input type="checkbox" data-kind="spec" data-name="${p}" ${spec ? 'checked' : ''} ${specDisabled ? 'disabled' : ''} class="accent-amber-700">Specialize (+${specCost})</label>` : ''}
            </div>`;
        }).join('');
        const nwpHtml = DB.nonweapon_proficiencies.map(p => {
            const info = nwpInfo(p.name);
            const cost = nwpCost(st.className, p.name);
            const checked = st.nwp.has(p.name), locked = st.lockedNWP.includes(p.name) || (FREE_NWP[st.className] || []).includes(p.name);
            const disabled = locked || (!checked && sum.nonweapon.left < cost && !override);
            const cross = !info.groups.includes('general') && !info.groups.includes(g);
            return `<label class="flex items-center gap-2 cursor-pointer p-1 rounded ${checked ? 'bg-amber-200' : 'hover:bg-amber-100'} ${disabled && !checked ? 'opacity-50' : ''}">
                <input type="checkbox" data-kind="nwp" data-name="${p.name}" ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''} class="accent-amber-700">
                <span class="text-sm flex-1">${p.name} <span class="text-xs text-amber-700">(${info.ability}${info.ability !== 'N/A' ? formatMod(info.mod) : ''})</span></span>
                <span class="text-xs whitespace-nowrap ${cross ? 'text-red-700' : 'text-amber-700'}" title="${cross ? 'Outside your class group: +1 slot' : info.groups.map(x => GROUP_LABEL[x]).join(', ')}">${cost === 0 ? 'free' : cost + ' slot' + (cost > 1 ? 's' : '')}</span>
            </label>`;
        }).join('');
        el.innerHTML = `
            <div class="grid-2 gap-4">
                <div>
                    ${counter('Weapon', sum.weapon)}
                    <p class="text-xs text-amber-700 my-1">Not proficient with a weapon: ${sum.penalty} to hit.${canSpecialize(st.className) ? ' Fighters may specialize: +1 to hit, +2 damage, more attacks.' : ''}</p>
                    <div class="pp-list space-y-1 max-h-64 overflow-y-auto p-2 border border-amber-300 rounded bg-amber-50">${wpHtml}</div>
                </div>
                <div>
                    ${counter('Non-weapon', sum.nonweapon, sum.nonweapon.intBonus ? ` <span class="text-xs font-normal">(incl. +${sum.nonweapon.intBonus} INT)</span>` : '')}
                    <p class="text-xs text-amber-700 my-1">Proficiencies outside the ${GROUP_LABEL[g]} group cost +1 slot (shown in red).</p>
                    <div class="pp-list space-y-1 max-h-64 overflow-y-auto p-2 border border-amber-300 rounded bg-amber-50">${nwpHtml}</div>
                </div>
            </div>
            ${override ? '<p class="text-xs text-amber-700 mt-2"><i class="fas fa-crown mr-1"></i>As DM you can go over the slot limits.</p>' : ''}`;
        el.querySelectorAll('input[type=checkbox]').forEach(cb => cb.addEventListener('change', () => ProfPicker.toggle(el, cb.dataset.kind, cb.dataset.name, cb.checked)));
        if (keepScroll) el.querySelectorAll('.pp-list').forEach((x, i) => { x.scrollTop = scrolls[i] || 0; });
    }
};

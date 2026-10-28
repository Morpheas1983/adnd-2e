/* abilities.js - PHB ability score tables 1-6 (Strength, Dexterity, Constitution, Intelligence, Wisdom, Charisma).
   Loaded right after utils.js on every page. */

/* ---------- Table 1: Strength ---------- */
// [hit, dmg, weight allowance (lbs), max press (lbs), open doors, open locked doors (0 = no), bend bars/lift gates %]
const STR_TABLE = {
    1: [-5, -4, 1, 3, 1, 0, 0], 2: [-3, -2, 1, 5, 1, 0, 0], 3: [-3, -1, 5, 10, 2, 0, 0], 4: [-2, -1, 10, 25, 3, 0, 0], 5: [-2, -1, 10, 25, 3, 0, 0],
    6: [-1, 0, 20, 55, 4, 0, 0], 7: [-1, 0, 20, 55, 4, 0, 0], 8: [0, 0, 35, 90, 5, 0, 1], 9: [0, 0, 35, 90, 5, 0, 1],
    10: [0, 0, 40, 115, 6, 0, 2], 11: [0, 0, 40, 115, 6, 0, 2], 12: [0, 0, 45, 140, 7, 0, 4], 13: [0, 0, 45, 140, 7, 0, 4],
    14: [0, 0, 55, 170, 8, 0, 7], 15: [0, 0, 55, 170, 8, 0, 7], 16: [0, 1, 70, 195, 9, 0, 10], 17: [1, 1, 85, 220, 10, 0, 13],
    18: [1, 2, 110, 255, 11, 0, 16],
    19: [3, 7, 485, 640, 16, 8, 50], 20: [3, 8, 535, 700, 17, 10, 60], 21: [4, 9, 635, 810, 17, 12, 70], 22: [4, 10, 785, 970, 18, 14, 80],
    23: [5, 11, 935, 1130, 18, 16, 90], 24: [6, 12, 1235, 1440, 19, 17, 95], 25: [7, 14, 1535, 1750, 19, 18, 99]
};
// Exceptional strength 18/01-18/00 (warriors only). Key = highest percentile of the band (100 = 18/00)
const STR_EX_TABLE = [
    [50, [1, 3, 135, 280, 12, 0, 20]], [75, [2, 3, 160, 305, 13, 0, 25]], [90, [2, 4, 185, 330, 14, 0, 30]],
    [99, [2, 5, 235, 380, 15, 3, 35]], [100, [3, 6, 335, 480, 16, 6, 40]]
];
function canHaveExStr(className) { return (typeof classGroup === 'function' ? classGroup(className) : '') === 'warrior'; }
function strRow(score, ex) {
    const s = Math.max(1, Math.min(25, parseInt(score) || 10));
    if (s === 18 && ex > 0) return (STR_EX_TABLE.find(([max]) => ex <= max) || STR_EX_TABLE[4])[1];
    return STR_TABLE[s];
}
function strLabel(score, ex) { return parseInt(score) === 18 && ex > 0 ? `18/${ex >= 100 ? '00' : String(ex).padStart(2, '0')}` : String(score); }
// Exceptional strength actually in effect for this character (a condition that SETS strength can give its own, e.g. 18/00)
function getStrEx(char) {
    let setEx = null, setStr = null;
    (char.activeEffects || []).forEach(e => { if (e.sets && e.sets.str != null && e.sets.str !== '') { setStr = parseInt(e.sets.str); setEx = e.sets.strEx != null ? parseInt(e.sets.strEx) : null; } });
    if (getModifiedStat(char, 'str') !== 18) return 0;
    if (setStr === 18) return setEx || 0;                               // magic item: its own value, any class
    if (!canHaveExStr(char.class)) return 0;
    if ((char.stats || {}).str !== 18) return 0;                         // raised to 18 by a +/- effect: no percentile
    return Math.max(0, Math.min(100, parseInt((char.stats || {}).strEx) || 0));
}
function strInfo(char) {
    const s = getModifiedStat(char, 'str'), ex = getStrEx(char);
    const r = strRow(s, ex);
    return { score: s, ex, label: strLabel(s, ex), hit: r[0], dmg: r[1], weight: r[2], press: r[3], doors: r[4], lockedDoors: r[5], bendBars: r[6] };
}
function strHitAdj(char) { return strInfo(char).hit; }
function strDmgAdj(char) { return strInfo(char).dmg; }

/* ---------- Table 2: Dexterity ---------- */
// [reaction adj, missile attack adj, defensive adj]
const DEX_TABLE = { 1: [-6, -6, 5], 2: [-4, -4, 5], 3: [-3, -3, 4], 4: [-2, -2, 3], 5: [-1, -1, 2], 6: [0, 0, 1],
    15: [0, 0, -1], 16: [1, 1, -2], 17: [2, 2, -3], 18: [2, 2, -4], 19: [3, 3, -4], 20: [3, 3, -4], 21: [4, 4, -5],
    22: [4, 4, -5], 23: [4, 4, -5], 24: [5, 5, -6], 25: [5, 5, -6] };
function dexRow(score) { const d = Math.max(1, Math.min(25, parseInt(score) || 10)); return DEX_TABLE[d] || [0, 0, 0]; }
function dexDefenseAdj(score) { return dexRow(score)[2]; }
function dexReactionAdj(score) { return dexRow(score)[0]; }
function dexMissileAdj(score) { return dexRow(score)[1]; }

/* ---------- Table 3: Constitution ---------- */
// [hp adj (non-warriors), hp adj (warriors), system shock %, resurrection survival %, poison save, regeneration]
const CON_TABLE = {
    1: [-3, -3, 25, 30, -2, ''], 2: [-2, -2, 30, 35, -1, ''], 3: [-2, -2, 35, 40, 0, ''], 4: [-1, -1, 40, 45, 0, ''], 5: [-1, -1, 45, 50, 0, ''],
    6: [-1, -1, 50, 55, 0, ''], 7: [0, 0, 55, 60, 0, ''], 8: [0, 0, 60, 65, 0, ''], 9: [0, 0, 65, 70, 0, ''], 10: [0, 0, 70, 75, 0, ''],
    11: [0, 0, 75, 80, 0, ''], 12: [0, 0, 80, 85, 0, ''], 13: [0, 0, 85, 90, 0, ''], 14: [0, 0, 88, 92, 0, ''], 15: [1, 1, 90, 94, 0, ''],
    16: [2, 2, 95, 96, 0, ''], 17: [2, 3, 97, 98, 0, ''], 18: [2, 4, 99, 100, 0, ''], 19: [2, 5, 99, 100, 1, ''],
    20: [2, 5, 99, 100, 1, '1 HP / 6 turns'], 21: [2, 6, 99, 100, 2, '1 HP / 5 turns'], 22: [2, 6, 99, 100, 2, '1 HP / 4 turns'],
    23: [2, 6, 99, 100, 3, '1 HP / 3 turns'], 24: [2, 7, 99, 100, 3, '1 HP / 2 turns'], 25: [2, 7, 100, 100, 4, '1 HP / turn']
};
function conRow(score) { return CON_TABLE[Math.max(1, Math.min(25, parseInt(score) || 10))]; }
function conHpAdj(score, className) { const r = conRow(score); return canHaveExStr(className) ? r[1] : r[0]; }
function conMinHpDie(score) { const c = parseInt(score) || 10; return c >= 25 ? 4 : c >= 23 ? 4 : c >= 21 ? 3 : c >= 20 ? 2 : 1; }
function conInfo(char) {
    const s = getModifiedStat(char, 'con'), r = conRow(s);
    return { score: s, hp: conHpAdj(s, char.class), hpOther: r[0], hpWarrior: r[1], shock: r[2], resurrection: r[3], poison: r[4], regen: r[5], minDie: conMinHpDie(s) };
}
// One hit die roll with the CON adjustment (high CON rerolls low dice; never below 1)
function rollHitDie(die, con, className) {
    const min = conMinHpDie(con);
    return Math.max(1, Math.max(min, rollDie(die)) + conHpAdj(con, className));
}

/* ---------- Table 4: Intelligence ---------- */
// [languages, max spell level, chance to learn %, max spells per level (0 = all), illusion immunity level]
const INT_TABLE = {
    1: [0, 0, 0, 0, 0], 2: [1, 0, 0, 0, 0], 3: [1, 0, 0, 0, 0], 4: [1, 0, 0, 0, 0], 5: [1, 0, 0, 0, 0], 6: [1, 0, 0, 0, 0], 7: [1, 0, 0, 0, 0], 8: [1, 0, 0, 0, 0],
    9: [2, 4, 35, 6, 0], 10: [2, 5, 40, 7, 0], 11: [2, 5, 45, 7, 0], 12: [3, 6, 50, 7, 0], 13: [3, 6, 55, 9, 0], 14: [4, 7, 60, 9, 0],
    15: [4, 7, 65, 11, 0], 16: [5, 8, 70, 11, 0], 17: [6, 8, 75, 14, 0], 18: [7, 9, 85, 18, 0], 19: [8, 9, 95, -1, 1], 20: [9, 9, 96, -1, 2],
    21: [10, 9, 97, -1, 3], 22: [11, 9, 98, -1, 4], 23: [12, 9, 99, -1, 5], 24: [15, 9, 100, -1, 6], 25: [20, 9, 100, -1, 7]
};
function intRow(score) { return INT_TABLE[Math.max(1, Math.min(25, parseInt(score) || 10))]; }
function getMaxSpellsPerLevel(intScore) { const m = intRow(intScore)[3]; return m === -1 ? Infinity : m; }
function getMaxSpellLevel(intScore) { return intRow(intScore)[1]; }
function chanceToLearn(intScore) { return intRow(intScore)[2]; }
function intInfo(char) {
    const s = getModifiedStat(char, 'int'), r = intRow(s);
    return { score: s, languages: r[0], spellLevel: r[1], learn: r[2], maxSpells: r[3] === -1 ? 'All' : r[3] || '–', illusionImmunity: r[4] };
}

/* ---------- Table 5: Wisdom ---------- */
// [magical defense adj, bonus spells text, spell failure %, spell immunity]
const WIS_TABLE = {
    1: [-6, '', 80, ''], 2: [-4, '', 60, ''], 3: [-3, '', 50, ''], 4: [-2, '', 45, ''], 5: [-1, '', 40, ''], 6: [-1, '', 35, ''], 7: [-1, '', 30, ''],
    8: [0, '', 25, ''], 9: [0, '0', 20, ''], 10: [0, '0', 15, ''], 11: [0, '0', 10, ''], 12: [0, '0', 5, ''], 13: [0, '1st', 0, ''], 14: [0, '1st', 0, ''],
    15: [1, '2nd', 0, ''], 16: [2, '2nd', 0, ''], 17: [3, '3rd', 0, ''], 18: [4, '4th', 0, ''],
    19: [4, '1st, 3rd', 0, 'Cause fear, Charm person, Command, Friends, Hypnotism'],
    20: [4, '2nd, 4th', 0, '+ Forget, Hold person, Ray of enfeeblement, Scare'],
    21: [4, '3rd, 5th', 0, '+ Fear'],
    22: [4, '4th, 5th', 0, '+ Charm monster, Confusion, Emotion, Fumble, Suggestion'],
    23: [4, '1st, 6th', 0, '+ Chaos, Feeblemind, Hold monster, Magic jar, Quest'],
    24: [4, '5th, 6th', 0, '+ Geas, Mass suggestion, Rod of rulership'],
    25: [4, '6th, 7th', 0, '+ Antipathy/sympathy, Death spell, Mass charm']
};
function wisRow(score) { return WIS_TABLE[Math.max(1, Math.min(25, parseInt(score) || 10))]; }
function wisMagicDefense(wis) { return wisRow(wis)[0]; }
function wisInfo(char) {
    const s = getModifiedStat(char, 'wis'), r = wisRow(s);
    return { score: s, magicDefense: r[0], bonusSpells: r[1] && r[1] !== '0' ? r[1] : '–', failure: r[2], immunity: r[3] };
}

/* ---------- Table 6: Charisma ---------- */
// [max henchmen, loyalty base, reaction adj]
const CHA_TABLE = {
    1: [0, -8, -7], 2: [1, -7, -6], 3: [1, -6, -5], 4: [1, -5, -4], 5: [2, -4, -3], 6: [2, -3, -2], 7: [3, -2, -1], 8: [3, -1, 0],
    9: [4, 0, 0], 10: [4, 0, 0], 11: [4, 0, 0], 12: [5, 0, 0], 13: [5, 0, 1], 14: [6, 1, 2], 15: [7, 3, 3], 16: [8, 4, 5],
    17: [10, 6, 6], 18: [15, 8, 7], 19: [20, 10, 8], 20: [25, 12, 9], 21: [30, 14, 10], 22: [35, 16, 11], 23: [40, 18, 12], 24: [45, 20, 13], 25: [50, 20, 14]
};
function chaRow(score) { return CHA_TABLE[Math.max(1, Math.min(25, parseInt(score) || 10))]; }
function chaInfo(char) { const s = getModifiedStat(char, 'cha'), r = chaRow(s); return { score: s, henchmen: r[0], loyalty: r[1], reaction: r[2] }; }

/* ---------- Short summary for the ability boxes ---------- */
function abilityBoxLine(char, s) {
    if (s === 'str') { const i = strInfo(char); return `Hit ${formatMod(i.hit)} · Dmg ${formatMod(i.dmg)}`; }
    if (s === 'dex') { const v = getModifiedStat(char, 'dex'); return `AC ${formatMod(dexDefenseAdj(v))} · Missile ${formatMod(dexMissileAdj(v))}`; }
    if (s === 'con') { const i = conInfo(char); return `HP ${formatMod(i.hp)}/lvl · Shock ${i.shock}%`; }
    if (s === 'int') { const i = intInfo(char); return `Lang ${i.languages}${i.learn ? ` · Learn ${i.learn}%` : ''}`; }
    if (s === 'wis') { const i = wisInfo(char); return `Magic def ${formatMod(i.magicDefense)}`; }
    if (s === 'cha') { const i = chaInfo(char); return `Reaction ${formatMod(i.reaction)} · Loyalty ${formatMod(i.loyalty)}`; }
    return '';
}

/* ---------- Sheet panel with every column of Tables 1-6 ---------- */
function renderAbilityDetails(char) {
    const st = strInfo(char), dx = getModifiedStat(char, 'dex'), co = conInfo(char), it = intInfo(char), wi = wisInfo(char), ch = chaInfo(char);
    const canEdit = typeof canWriteChar === 'function' ? canWriteChar(char) : true;
    const exEligible = canHaveExStr(char.class) && (char.stats || {}).str === 18;
    const open = State.abilityDetailsOpen !== false;
    const row = (label, value, title) => `<div class="flex justify-between gap-2 py-0.5 border-b border-amber-200 last:border-0" ${title ? `title="${escapeHtml(title)}"` : ''}><span class="text-amber-800">${label}</span><span class="font-bold text-amber-900 text-right">${value}</span></div>`;
    const block = (title, score, rows) => `<div class="bg-amber-50 rounded border border-amber-300 p-2"><div class="font-bold text-amber-900 text-sm mb-1 flex justify-between"><span>${title}</span><span class="fantasy-font">${score}</span></div><div class="text-xs">${rows}</div></div>`;
    return `
        <div class="parchment scroll-border p-4 fade-in" id="abilityDetails">
            <button onclick="State.abilityDetailsOpen = ${!open}; render()" class="w-full flex justify-between items-center text-left">
                <span class="section-header mb-0 border-0"><i class="fas fa-table"></i>Ability Details (PHB)</span>
                <i class="fas fa-chevron-${open ? 'up' : 'down'} text-amber-700"></i>
            </button>
            ${open ? `<div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                ${block('Strength', st.label, [
                    row('Hit probability', formatMod(st.hit)), row('Damage adjustment', formatMod(st.dmg)),
                    row('Weight allowance', st.weight + ' lbs'), row('Maximum press', st.press + ' lbs'),
                    row('Open doors', `${st.doors}${st.lockedDoors ? ` (${st.lockedDoors})` : ''} on d20`, 'In brackets: locked, barred or magically held doors'),
                    row('Bend bars / lift gates', st.bendBars + '%')].join('') +
                    (exEligible ? `<div class="flex justify-between items-center gap-2 pt-1"><span class="text-amber-800">Exceptional (18/xx)</span>
                        ${canEdit ? `<span class="flex items-center gap-1"><input type="number" min="0" max="100" id="strExInput" value="${(char.stats || {}).strEx || ''}" placeholder="01-00" class="input-fantasy w-16 text-center px-1 py-0 text-xs" onchange="setStrEx('${char.id}', this.value)" title="1-99, or 100 for 18/00. Empty = plain 18">
                        <button onclick="rollStrEx('${char.id}')" class="btn-fantasy px-1.5 py-0.5 rounded text-xs" title="Roll d100"><i class="fas fa-dice"></i></button></span>` : `<b>${st.label}</b>`}</div>` : ''))}
                ${block('Dexterity', dx, [
                    row('Reaction adjustment', formatMod(dexReactionAdj(dx)), 'Surprise rolls'), row('Missile attack adjustment', formatMod(dexMissileAdj(dx))),
                    row('Defensive adjustment (AC)', formatMod(dexDefenseAdj(dx)))].join(''))}
                ${block('Constitution', co.score, [
                    row('Hit point adjustment', `${formatMod(co.hp)} per level${co.hp !== co.hpWarrior ? ` <span class="font-normal text-amber-700">(warriors ${formatMod(co.hpWarrior)})</span>` : ''}`),
                    row('System shock', co.shock + '%'), row('Resurrection survival', co.resurrection + '%'),
                    row('Poison save', co.poison ? formatMod(co.poison) : '–'), row('Regeneration', co.regen || '–'),
                    co.minDie > 1 ? row('Hit dice rolls', `1s${co.minDie > 2 ? '–' + (co.minDie - 1) + 's' : ''} count as ${co.minDie}`) : ''].join(''))}
                ${block('Intelligence', it.score, [
                    row('Languages', it.languages), row('Max spell level', it.spellLevel ? it.spellLevel : '–'),
                    row('Chance to learn spell', it.learn ? it.learn + '%' : '–'), row('Max spells per level', it.maxSpells),
                    row('Illusion immunity', it.illusionImmunity ? `Level ${it.illusionImmunity} and below` : '–')].join(''))}
                ${block('Wisdom', wi.score, [
                    row('Magical defense adjustment', formatMod(wi.magicDefense), 'Saving throws vs mind-affecting spells'),
                    row('Bonus priest spells', wi.bonusSpells), row('Chance of spell failure', wi.failure ? wi.failure + '%' : '–'),
                    wi.immunity ? row('Spell immunity', `<span class="font-normal">${escapeHtml(wi.immunity)}</span>`) : ''].join(''))}
                ${block('Charisma', ch.score, [
                    row('Maximum henchmen', ch.henchmen), row('Loyalty base', formatMod(ch.loyalty)), row('Reaction adjustment', formatMod(ch.reaction))].join(''))}
            </div>` : ''}
        </div>`;
}

function setStrEx(charId, v) {
    const char = (State.characters || []).find(c => c.id === charId) || State.currentCharacter;
    if (!char) return;
    const n = parseInt(v);
    char.stats = char.stats || {};
    if (!n || n < 1) delete char.stats.strEx; else char.stats.strEx = Math.min(100, n);
    Storage.save(); render();
}
function rollStrEx(charId) {
    const r = rollDie(100);
    setStrEx(charId, r);
    toast(`Exceptional strength: 18/${r >= 100 ? '00' : String(r).padStart(2, '0')}`);
}

/* Missile weapons: hit uses DEX missile adjustment; bows, crossbows and slings get no STR damage */
const LAUNCHERS = /bow|crossbow|sling|blowgun/i;
const THROWN_ONLY = /dart|javelin|throwing|hammer, throwing/i;
function weaponIsMissile(w) { const n = (w && (w.baseName || w.name)) || ''; return LAUNCHERS.test(n) || THROWN_ONLY.test(n); }
function weaponIsLauncher(w) { const n = (w && (w.baseName || w.name)) || ''; return LAUNCHERS.test(n); }

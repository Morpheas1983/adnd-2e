/* magic.js - Schools (wizards) and spheres (priests) per AD&D 2nd Edition PHB.
   Loaded after spells-extra.js. Fixes the school/sphere data of the spell lists and decides
   which spells a character can use. Characters may have a custom access list (house rules / specialty priests). */

// 2e names: Conjuration = Conjuration/Summoning, Enchantment = Enchantment/Charm,
// Evocation = Invocation/Evocation, Illusion = Illusion/Phantasm. Divination of 1st-4th level is "lesser" (open to everyone).
const WIZARD_SCHOOLS = ['Abjuration', 'Alteration', 'Conjuration', 'Divination', 'Enchantment', 'Evocation', 'Illusion', 'Necromancy'];
const SCHOOL_LABEL = { Conjuration: 'Conjuration/Summoning', Enchantment: 'Enchantment/Charm', Evocation: 'Invocation/Evocation', Illusion: 'Illusion/Phantasm' };

// Specialist wizards (PHB Table 22): specialty school and opposition schools
const SPECIALISTS = {
    Abjurer:     { school: 'Abjuration',  opposed: ['Alteration', 'Illusion'] },
    Conjurer:    { school: 'Conjuration', opposed: ['Greater Divination', 'Evocation'] },
    Diviner:     { school: 'Divination',  opposed: ['Conjuration'] },
    Enchanter:   { school: 'Enchantment', opposed: ['Evocation', 'Necromancy'] },
    Illusionist: { school: 'Illusion',    opposed: ['Necromancy', 'Evocation', 'Abjuration'] },
    Invoker:     { school: 'Evocation',   opposed: ['Enchantment', 'Conjuration'] },
    Necromancer: { school: 'Necromancy',  opposed: ['Illusion', 'Enchantment'] },
    Transmuter:  { school: 'Alteration',  opposed: ['Abjuration', 'Necromancy'] }
};

// Priest sphere access (PHB): major = all spell levels, minor = spell levels 1-3
const CLASS_SPHERES = {
    Cleric:  { major: ['All', 'Astral', 'Charm', 'Combat', 'Creation', 'Divination', 'Guardian', 'Healing', 'Necromantic', 'Protection', 'Summoning', 'Sun'], minor: ['Elemental'] },
    Druid:   { major: ['All', 'Animal', 'Elemental', 'Healing', 'Plant', 'Weather'], minor: ['Divination'] },
    Paladin: { major: ['Combat', 'Divination', 'Healing', 'Protection'], minor: [] },
    Ranger:  { major: ['Animal', 'Plant'], minor: [] }
};
const ALL_SPHERES = ['All', 'Animal', 'Astral', 'Chaos', 'Charm', 'Combat', 'Creation', 'Divination', 'Elemental', 'Guardian', 'Healing', 'Law', 'Necromantic', 'Plant', 'Protection', 'Summoning', 'Sun', 'Weather', 'War', 'Wards'];

// Spells that belong to more than one sphere/school in the PHB (a caster needs access to only one sphere;
// a specialist is barred if ANY of the spell's schools is opposed)
const PRIEST_SPHERES_FIX = {
    'Detect Evil': ['Divination'], 'Shillelagh': ['Combat', 'Plant'], 'Barkskin': ['Protection', 'Plant'],
    'Negative Plane Protection': ['Protection', 'Necromantic'], 'Protection from Fire': ['Protection', 'Elemental (Fire)'],
    'Summon Insects': ['Combat', 'Animal'], 'Water Breathing': ['Elemental (Water)', 'Elemental (Air)'],
    'Protection from Lightning': ['Protection', 'Weather'], 'Repel Insects': ['Animal', 'Protection'],
    'Animal Summoning I': ['Animal', 'Summoning'], 'Animal Summoning II': ['Animal', 'Summoning'], 'Animal Summoning III': ['Animal', 'Summoning'],
    'Anti-Plant Shell': ['Plant', 'Protection'], 'Commune with Nature': ['Divination', 'Elemental'], 'Dispel Evil': ['Protection', 'Summoning'],
    'Rainbow': ['Weather', 'Sun'], 'Transmute Rock to Mud': ['Elemental (Earth)', 'Elemental (Water)'],
    'Animate Object': ['Creation', 'Summoning'], 'Anti-Animal Shell': ['Animal', 'Protection'], 'Blade Barrier': ['Guardian', 'Creation'],
    'Stone Tell': ['Elemental (Earth)', 'Divination'], 'Transmute Water to Dust': ['Elemental (Water)', 'Elemental (Earth)'],
    'Changestaff': ['Plant', 'Creation'], 'Chariot of Sustarre': ['Elemental (Fire)', 'Creation'], 'Creeping Doom': ['Animal', 'Summoning'],
    'Exaction': ['Charm', 'Summoning'], 'Call Woodland Beings': ['Summoning', 'Plant']
};
const WIZARD_SCHOOLS_FIX = {
    "Fools' Gold": ['Alteration', 'Illusion'], 'Phantom Steed': ['Conjuration', 'Illusion'], 'Fire Shield': ['Evocation', 'Alteration'],
    'Fire Trap': ['Abjuration', 'Evocation'], "Leomund's Secure Shelter": ['Alteration', 'Enchantment'], "Otiluke's Resilient Sphere": ['Alteration', 'Evocation'],
    "Leomund's Secret Chest": ['Alteration', 'Conjuration'], 'Death Fog': ['Alteration', 'Evocation'], 'Enchant an Item': ['Enchantment', 'Evocation'],
    'Guards and Wards': ['Evocation', 'Alteration', 'Enchantment'], "Otiluke's Freezing Sphere": ['Alteration', 'Evocation'], 'Project Image': ['Alteration', 'Illusion'],
    "Tenser's Transformation": ['Alteration', 'Evocation'], 'Sequester': ['Illusion', 'Abjuration'], 'Demand': ['Evocation', 'Enchantment'],
    'Incendiary Cloud': ['Alteration', 'Evocation'], "Otiluke's Telekinetic Sphere": ['Evocation', 'Alteration'], 'Screen': ['Divination', 'Illusion'],
    'Sink': ['Enchantment', 'Alteration'], 'Energy Drain': ['Evocation', 'Necromancy'], "Mordenkainen's Disjunction": ['Alteration', 'Enchantment'],
    'Prismatic Sphere': ['Abjuration', 'Conjuration']
};

(function fixSpellData() {
    DB.priest_spells.forEach(s => {
        const list = PRIEST_SPHERES_FIX[s.name] || [s.sphere || 'All'];
        s.spheres = list; s.sphere = list.join(', ');
    });
    DB.wizard_spells.forEach(s => {
        if (s.school === 'Transmutation') s.school = 'Alteration';
        const list = WIZARD_SCHOOLS_FIX[s.name] || [s.school];
        s.schools = list; s.school = list.join(', ');
    });
    DB.wizard_schools = WIZARD_SCHOOLS.slice();
    DB.priest_spheres = ALL_SPHERES.slice();
})();

function spellSchools(s) { return s.schools || String(s.school || '').split(',').map(x => x.trim()).filter(Boolean); }
function spellSpheres(s) { return s.spheres || String(s.sphere || 'All').split(',').map(x => x.trim()).filter(Boolean); }
function isGreaterDivination(s) { return spellSchools(s).includes('Divination') && s.level >= 5; }

function specialistInfo(char) { return char.class === 'Specialist Wizard' ? (SPECIALISTS[char.kit] || null) : null; }

/* Magic access of a character: { kind: 'wizard'|'priest', ... } — custom overrides in char.magicAccess */
function magicAccess(char) {
    const type = getCasterType(char.class);
    if (type === 'wizard') {
        const sp = specialistInfo(char);
        const custom = char.magicAccess && Array.isArray(char.magicAccess.opposed) ? char.magicAccess.opposed : null;
        return { kind: 'wizard', specialty: sp ? sp.school : null, opposed: custom || (sp ? sp.opposed : []), custom: !!custom };
    }
    if (type === 'priest') {
        const def = CLASS_SPHERES[char.class] || { major: ['All'], minor: [] };
        const c = char.magicAccess && Array.isArray(char.magicAccess.major) ? char.magicAccess : null;
        return { kind: 'priest', major: c ? c.major : def.major, minor: c ? (c.minor || []) : def.minor, custom: !!c };
    }
    return null;
}

// Can this character use (learn / pray for) this spell? Returns { ok, reason }
function spellAccess(char, spell) {
    const acc = magicAccess(char);
    if (!acc) return { ok: false, reason: 'Not a spellcaster' };
    if (acc.kind === 'wizard') {
        const bad = spellSchools(spell).filter(sc => acc.opposed.includes(sc) && !(sc === 'Divination' && spell.level <= 4))
            .concat(acc.opposed.includes('Greater Divination') && isGreaterDivination(spell) ? ['Greater Divination'] : []);
        return bad.length ? { ok: false, reason: `Opposition school: ${bad.join(', ')}` } : { ok: true };
    }
    const has = (list, sph) => list.includes(sph) || (sph.startsWith('Elemental') && list.includes('Elemental')) || list.includes(sph.replace(/ \(.*\)$/, ''));
    const sph = spellSpheres(spell);
    if (sph.some(x => has(acc.major, x))) return { ok: true };
    if (sph.some(x => has(acc.minor, x))) return spell.level <= 3 ? { ok: true } : { ok: false, reason: 'Minor access: spells up to 3rd level only' };
    return { ok: false, reason: `No access to the ${sph.join(' / ')} sphere` };
}

// Replaces the old version in core.js (loaded after it via bootstrap below)
function availableSpellsFor(char) {
    const type = getCasterType(char.class);
    if (!type) return [];
    const custom = (State.customSpells && State.customSpells[type]) || [];
    // The campaign's custom spells are always allowed (the DM decides who gets them)
    return [...(type === 'wizard' ? DB.wizard_spells : DB.priest_spells).filter(s => spellAccess(char, s).ok), ...custom];
}

/* Bonus priest spells from high Wisdom (PHB Table 5), cumulative. Index = spell level - 1 */
const WIS_BONUS = { 13: [1], 14: [1], 15: [2], 16: [2], 17: [3], 18: [4], 19: [1, 3], 20: [2, 4], 21: [3, 5], 22: [4, 5], 23: [1, 6], 24: [5, 6], 25: [6, 7] };
function wisdomBonusSpells(wis, maxLevel) {
    const bonus = [];
    for (let w = 13; w <= Math.min(25, parseInt(wis) || 0); w++) (WIS_BONUS[w] || []).forEach(l => { if (l <= maxLevel) bonus[l - 1] = (bonus[l - 1] || 0) + 1; });
    return bonus;
}
// Chance that a priest's spell fails because of low Wisdom (PHB Table 5)
function wisdomSpellFailure(wis) {
    const t = { 1: 80, 2: 60, 3: 50, 4: 45, 5: 40, 6: 35, 7: 30, 8: 25, 9: 20, 10: 15, 11: 10, 12: 5 };
    return t[parseInt(wis)] || 0;
}

/* Spell slots including bonus spells: specialist wizards +1 per level (for the specialty school), Cleric/Druid bonus from WIS */
function spellSlotsFor(char) {
    const base = getSpellSlots(char.class, char.level).slice();
    if (!base.length) return { slots: [], bonus: [], note: '' };
    const bonus = base.map(() => 0);
    let note = '';
    if (char.class === 'Specialist Wizard') { base.forEach((_, i) => { bonus[i] += 1; }); note = '+1 per level for the specialty school'; }
    if (['Cleric', 'Druid'].includes(char.class)) {
        const wb = wisdomBonusSpells(getModifiedStat(char, 'wis'), base.length);
        wb.forEach((n, i) => { if (n) bonus[i] += n; });
        if (wb.some(Boolean)) note = 'includes bonus spells for high Wisdom';
    }
    return { slots: base.map((n, i) => n + bonus[i]), bonus, note };
}

/* ---------- UI ---------- */
// Short summary used on the sheet, the spells page and in character creation
function magicAccessHtml(char, opts = {}) {
    const acc = magicAccess(char);
    if (!acc) return '';
    const tag = (t, cls) => `<span class="text-xs px-2 py-1 rounded border ${cls}">${escapeHtml(t)}</span>`;
    let html = '';
    if (acc.kind === 'wizard') {
        const open = WIZARD_SCHOOLS.filter(s => !acc.opposed.includes(s));
        html += `<div class="text-sm text-amber-900 mb-1">${acc.specialty ? `<b>Specialist (${escapeHtml(char.kit)})</b>: specialty school <b>${SCHOOL_LABEL[acc.specialty] || acc.specialty}</b> (+1 spell per level, +1 to saves vs it).` : char.class === 'Bard' ? '<b>Bard</b>: may learn wizard spells of every school.' : '<b>Mage (generalist)</b>: all eight schools.'}</div>
            <div class="flex flex-wrap gap-1 mb-1">${open.map(s => tag(SCHOOL_LABEL[s] || s, s === acc.specialty ? 'bg-green-100 text-green-800 border-green-400 font-bold' : 'bg-amber-50 text-amber-900 border-amber-300')).join('')}</div>
            ${acc.opposed.length ? `<div class="text-xs text-red-800"><i class="fas fa-ban mr-1"></i>Opposition school${acc.opposed.length > 1 ? 's' : ''} (cannot be learned): ${acc.opposed.map(s => SCHOOL_LABEL[s] || s).join(', ')}. Lesser divinations (1st-4th level) are open to every wizard.</div>` : ''}`;
    } else {
        html += `<div class="flex flex-wrap gap-1 mb-1"><span class="text-xs font-bold text-amber-900 mr-1 self-center">Major:</span>${acc.major.map(s => tag(s, 'bg-green-100 text-green-800 border-green-400')).join('') || '<span class="text-xs italic">none</span>'}</div>
            <div class="flex flex-wrap gap-1 mb-1"><span class="text-xs font-bold text-amber-900 mr-1 self-center">Minor:</span>${acc.minor.map(s => tag(s, 'bg-amber-50 text-amber-900 border-amber-300')).join('') || '<span class="text-xs italic">none</span>'}</div>
            <div class="text-xs text-amber-700">Major access: spells of every level. Minor access: spells of 1st-3rd level only. A spell listed in several spheres needs access to just one.</div>`;
        if (['Cleric', 'Druid'].includes(char.class)) {
            const wis = getModifiedStat(char, 'wis');
            const fail = wisdomSpellFailure(wis);
            const wb = wisdomBonusSpells(wis, 7);
            html += `<div class="text-xs text-amber-800 mt-1">WIS ${wis}: ${wb.some(Boolean) ? `bonus spells ${wb.map((n, i) => n ? `${n}×L${i + 1}` : '').filter(Boolean).join(', ')}` : 'no bonus spells'}${fail ? `, <b class="text-red-700">${fail}% chance each spell fails</b>` : ''}.</div>`;
        }
    }
    if (acc.custom) html += '<div class="text-xs text-purple-800 mt-1"><i class="fas fa-pen mr-1"></i>Custom access (changed from the class standard).</div>';
    return html;
}

function showMagicAccessModal() {
    const char = State.currentCharacter;
    const acc = magicAccess(char);
    if (!acc) return;
    const box = (name, list, val) => `<label class="flex items-center gap-2 p-1 rounded hover:bg-amber-100 cursor-pointer"><input type="checkbox" name="${name}" value="${escapeHtml(val)}" ${list.includes(val) ? 'checked' : ''} class="accent-amber-700"><span class="text-sm">${escapeHtml(SCHOOL_LABEL[val] || val)}</span></label>`;
    $('modalContainer').innerHTML = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal-content" onclick="event.stopPropagation()">
                <div class="p-6">
                    <h2 class="fantasy-font text-xl font-bold text-amber-900 mb-1">${acc.kind === 'wizard' ? 'Schools of Magic' : 'Spheres of Influence'}</h2>
                    <p class="text-sm text-amber-700 mb-3">Change only for house rules or specialty priests. "Reset" returns to the ${escapeHtml(char.class)} standard.</p>
                    ${acc.kind === 'wizard' ? `
                        <div class="font-bold text-sm text-amber-900 mb-1">Opposition schools (barred)</div>
                        <div class="grid-2 gap-1">${[...WIZARD_SCHOOLS, 'Greater Divination'].map(s => box('opp', acc.opposed, s)).join('')}</div>
                    ` : `
                        <div class="grid-2 gap-4">
                            <div><div class="font-bold text-sm text-amber-900 mb-1">Major access</div>${ALL_SPHERES.map(s => box('major', acc.major, s)).join('')}</div>
                            <div><div class="font-bold text-sm text-amber-900 mb-1">Minor access (1st-3rd)</div>${ALL_SPHERES.map(s => box('minor', acc.minor, s)).join('')}</div>
                        </div>`}
                    <div class="flex justify-between gap-2 mt-4">
                        <button onclick="saveMagicAccess(true)" class="btn-galactic px-4 py-2 rounded text-sm">Reset</button>
                        <span class="flex gap-2">
                            <button onclick="closeModal()" class="btn-galactic px-4 py-2 rounded text-sm">Cancel</button>
                            <button onclick="saveMagicAccess(false)" class="btn-fantasy px-4 py-2 rounded text-sm">Save</button>
                        </span>
                    </div>
                </div>
            </div>
        </div>`;
}

function saveMagicAccess(reset) {
    const char = State.currentCharacter;
    const vals = n => Array.from(document.querySelectorAll(`input[name="${n}"]:checked`)).map(x => x.value);
    if (reset) delete char.magicAccess;
    else if (magicAccess(char).kind === 'wizard') char.magicAccess = { opposed: vals('opp') };
    else {
        const major = vals('major');
        char.magicAccess = { major, minor: vals('minor').filter(s => !major.includes(s)) };
    }
    Storage.save();
    closeModal();
    render();
    toast(reset ? 'Back to the class standard' : 'Magic access updated');
}

/* phb-apply.js - Applies the Player's Handbook / DM's Guide data (js/phb-data.js) to the app's DB.
   Loaded right after phb-data.js, before magic.js, on every page. */
(function applyPHB() {
    if (typeof PHB === 'undefined' || typeof DB === 'undefined') return;
    const copy = x => JSON.parse(JSON.stringify(x));

    // ---------- Spells: complete PHB lists ----------
    DB.wizard_spells = copy(PHB.wizard_spells);
    DB.priest_spells = copy(PHB.priest_spells);
    DB.spell_renames = PHB.spell_renames;

    // ---------- Equipment & proficiencies ----------
    DB.weapons = copy(PHB.weapons);
    DB.armor = copy(PHB.armor);
    DB.gear = copy(PHB.gear);
    DB.weapon_proficiencies = PHB.weapon_proficiencies.slice();
    DB.nonweapon_proficiencies = copy(PHB.nonweapon_proficiencies);
    DB.nwp_meta = PHB.nwp_meta;
    DB.nwp_renames = PHB.nwp_renames;
    DB.class_crossovers = PHB.class_crossovers;
    DB.starting_gold = PHB.starting_gold;
    DB.magic_items = PHB.magic_items;

    // ---------- Races (PHB Tables 7 and 8) ----------
    Object.entries(PHB.races_min_max).forEach(([race, mm]) => { if (DB.races[race]) Object.assign(DB.races[race], mm); });
    Object.entries(PHB.race_classes).forEach(([race, cls]) => { if (DB.races[race]) DB.races[race].classes = cls.slice(); });
    Object.keys(DB.races).forEach(race => { DB.races[race].adjustments = PHB.racial_adjustments[race] || {}; });
    if (DB.races['Half-Orc']) {
        DB.races['Half-Orc'].nonPHB = true;
        DB.races['Half-Orc'].adjustments = { str: 1, con: 1, cha: -2 };
    }
    if (DB.races.Elf) DB.races.Elf.special = '+1 DEX, -1 CON; 90% resistance to sleep/charm; find secret doors; +1 to hit with bows and long/short swords';
    if (DB.races.Halfling) DB.races.Halfling.special = '+1 DEX, -1 STR; infravision 60 ft (15%) or 30 ft (25%); saving throw bonus from CON; +1 to hit with slings and thrown weapons; no exceptional Strength';
    if (DB.races.Gnome) DB.races.Gnome.specialistKits = ['Illusionist'];
    if (DB.races.Elf) DB.races.Elf.specialistKits = ['Diviner', 'Enchanter'];

    // ---------- Classes ----------
    const C = DB.classes;
    if (C.Paladin) { C.Paladin.requirements = { str: 12, con: 9, wis: 13, cha: 17 }; C.Paladin.prime_req = 'STR/CHA'; }
    if (C.Druid) C.Druid.prime_req = 'WIS/CHA';
    if (C.Thief) C.Thief.alignment = ['Any except Lawful Good'];
    if (C.Bard) C.Bard.alignment = ['Any partially Neutral'];
    ['Paladin', 'Ranger'].forEach(k => { if (C[k]) C[k].xp_table = PHB.xp_paladin_ranger.slice(); });
    if (C.Druid) C.Druid.xp_table = PHB.xp_druid.slice();
    if (C.Bard) C.Bard.xp_table = PHB.xp_bard.slice();
    ['Cleric', 'Druid'].forEach(k => { if (C[k]) C[k].thac0 = copy(PHB.thac0_priest); });
    const SS = PHB.spell_slots;
    ['Mage', 'Specialist Wizard'].forEach(k => { if (C[k]) C[k].spell_slots = { type: 'wizard', table: copy(SS.wizard) }; });
    if (C.Cleric) C.Cleric.spell_slots = { type: 'priest', table: copy(SS.priest) };
    if (C.Druid) C.Druid.spell_slots = { type: 'priest', table: copy(SS.druid) };   // no new spells after 15th
    if (C.Paladin) C.Paladin.spell_slots = copy(SS.paladin);
    if (C.Ranger) C.Ranger.spell_slots = copy(SS.ranger);
    if (C.Bard) C.Bard.spell_slots = copy(SS.bard);
    Object.values(C).forEach(c => { delete c.saves; });   // not used, and not PHB values

    // ---------- Thief / bard / ranger tables ----------
    DB.thief_race_adj = PHB.thief_race_adj;
    DB.thief_dex_adj = PHB.thief_dex_adj;
    DB.thief_armor_adj = PHB.thief_armor_adj;
    DB.bard_skills = PHB.bard_skills;
    DB.backstab = PHB.backstab;
    DB.ranger_hide_move = PHB.ranger_hide_move;
    DB.turn_undead = PHB.turn_undead;
    DB.dmg = PHB.dmg;
})();

/* Old names used by characters → PHB names */
function migrateCharNames(c) {
    if (!c) return c;
    const sr = (typeof DB !== 'undefined' && DB.spell_renames) || {};
    const nr = (typeof DB !== 'undefined' && DB.nwp_renames) || {};
    ['knownSpells', 'preparedSpells'].forEach(k => { if (Array.isArray(c[k])) c[k] = c[k].map(n => sr[n] || n); });
    if (Array.isArray(c.nonweaponProfs)) c.nonweaponProfs = c.nonweaponProfs.map(n => nr[n] || n);
    return c;
}

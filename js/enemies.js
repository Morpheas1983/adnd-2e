/* enemies.js - Typical enemies for the DM's Bestiary: pick a template (bandit, orc...), a rank and a level,
   the stats are worked out with the 2e rules and can then be changed before adding them.

   Rules used
   - Monsters: THAC0 from Hit Dice (MM table: 1 HD 19, 3-4 HD 17, 5-6 HD 15 ... a bonus of +3 or more counts as one more HD),
     saves as a Fighter of level = HD (less than 1 HD = 0-level), XP from DMG Table 31 (+ extra for special abilities).
   - NPCs (humans with a class): THAC0, saves and hit dice of their class and level; 0-level = d6 hit points, THAC0 20.
*/

const ENEMY_TEMPLATES = [
    // ---------- Humans & NPCs (class + level) ----------
    { id: 'bandit', group: 'Humans & NPCs', name: 'Bandit', kind: 'npc', cls: 'Fighter', level: 0, ac: 8, move: 12, morale: 11, size: 'M',
      weapons: 'Short Sword:1d6, Short Bow:1d6', notes: 'Highway robbers. Ambush from cover, flee when the leader falls.',
      ranks: [{ label: 'Bandit', level: 0 }, { label: 'Veteran', level: 1, ac: 7 }, { label: 'Sergeant', level: 3, ac: 5, weapons: 'Long Sword:1d8, Light Crossbow:1d4' },
              { label: 'Lieutenant', level: 5, ac: 4, weapons: 'Long Sword:1d8+1' }, { label: 'Bandit Chief', level: 7, ac: 3, weapons: 'Long Sword +1:1d8+2', morale: 14 }] },
    { id: 'brigand', group: 'Humans & NPCs', name: 'Brigand', kind: 'npc', cls: 'Fighter', level: 1, ac: 7, move: 12, morale: 12, size: 'M',
      weapons: 'Battle Axe:1d8, Spear:1d6', notes: 'Hardened outlaws, often mounted.',
      ranks: [{ label: 'Brigand', level: 1 }, { label: 'Leader', level: 4, ac: 5 }, { label: 'Warlord', level: 8, ac: 3, weapons: 'Two-Handed Sword:1d10+1' }] },
    { id: 'thug', group: 'Humans & NPCs', name: 'Thug', kind: 'npc', cls: 'Fighter', level: 0, ac: 10, move: 12, morale: 9, size: 'M',
      weapons: 'Club:1d6, Dagger:1d4', notes: 'Street toughs and hired muscle.',
      ranks: [{ label: 'Thug', level: 0 }, { label: 'Bruiser', level: 2, ac: 8 }, { label: 'Gang Boss', level: 4, ac: 7, weapons: 'Short Sword:1d6+1' }] },
    { id: 'guard', group: 'Humans & NPCs', name: 'Town Guard', kind: 'npc', cls: 'Fighter', level: 1, ac: 5, move: 12, morale: 12, size: 'M',
      weapons: 'Spear:1d6, Long Sword:1d8', notes: 'Chain mail. Can call for help (1d6 more guards in 1d4 rounds).',
      ranks: [{ label: 'Guard', level: 1 }, { label: 'Sergeant', level: 3, ac: 4 }, { label: 'Captain', level: 6, ac: 3 }] },
    { id: 'soldier', group: 'Humans & NPCs', name: 'Soldier', kind: 'npc', cls: 'Fighter', level: 1, ac: 4, move: 9, morale: 13, size: 'M',
      weapons: 'Long Sword:1d8, Heavy Crossbow:1d4+1', notes: 'Disciplined troops. Fight in formation.',
      ranks: [{ label: 'Soldier', level: 1 }, { label: 'Sergeant', level: 3 }, { label: 'Lieutenant', level: 5, ac: 3 }, { label: 'Captain', level: 7, ac: 2 }] },
    { id: 'archer', group: 'Humans & NPCs', name: 'Mercenary Archer', kind: 'npc', cls: 'Fighter', level: 1, ac: 7, move: 12, morale: 11, size: 'M',
      weapons: 'Long Bow:1d6 (2/round), Short Sword:1d6', notes: 'Stays at range.',
      ranks: [{ label: 'Archer', level: 1 }, { label: 'Marksman', level: 4, notes: 'Bow specialization: +1 hit, +2 damage at point blank.' }] },
    { id: 'knight', group: 'Humans & NPCs', name: 'Knight', kind: 'npc', cls: 'Fighter', level: 5, ac: 2, move: 6, morale: 15, size: 'M',
      weapons: 'Long Sword:1d8, Lance (mounted):1d8+1', notes: 'Plate mail and shield, usually on a war horse.',
      ranks: [{ label: 'Squire', level: 2, ac: 4 }, { label: 'Knight', level: 5 }, { label: 'Champion', level: 9, ac: 0, weapons: 'Long Sword +2:1d8+3' }] },
    { id: 'berserker', group: 'Humans & NPCs', name: 'Berserker', kind: 'npc', cls: 'Fighter', level: 1, ac: 7, move: 12, morale: 20, size: 'M',
      weapons: 'Battle Axe:1d8', notes: 'Berserk rage: +2 to hit, never checks morale.',
      ranks: [{ label: 'Berserker', level: 1 }, { label: 'Raider Chief', level: 6, ac: 5 }] },
    { id: 'pirate', group: 'Humans & NPCs', name: 'Pirate', kind: 'npc', cls: 'Fighter', level: 1, ac: 8, move: 12, morale: 11, size: 'M',
      weapons: 'Scimitar:1d8, Dagger:1d4', notes: 'Boarding parties, grappling hooks.',
      ranks: [{ label: 'Pirate', level: 1 }, { label: 'Bosun', level: 3, ac: 7 }, { label: 'Pirate Captain', level: 7, ac: 6, weapons: 'Scimitar +1:1d8+1' }] },
    { id: 'cutpurse', group: 'Humans & NPCs', name: 'Cutpurse', kind: 'npc', cls: 'Thief', level: 1, ac: 8, move: 12, morale: 8, size: 'M',
      weapons: 'Dagger:1d4, Sling:1d4', notes: 'Backstab +4 to hit, damage x2.',
      ranks: [{ label: 'Cutpurse', level: 1 }, { label: 'Thief', level: 3, ac: 7 }, { label: 'Guildmaster', level: 8, ac: 5, weapons: 'Short Sword +1:1d6+1', notes: 'Backstab x3.' }] },
    { id: 'assassin', group: 'Humans & NPCs', name: 'Assassin', kind: 'npc', cls: 'Thief', level: 5, ac: 6, move: 12, morale: 13, size: 'M',
      weapons: 'Short Sword:1d6, Poisoned Dart:1d3', notes: 'Poison: save vs poison or 2d6 extra (or death, DM). Backstab x3.',
      ranks: [{ label: 'Killer', level: 3 }, { label: 'Assassin', level: 5 }, { label: 'Master Assassin', level: 10, ac: 4, notes: 'Backstab x4.' }] },
    { id: 'cultist', group: 'Humans & NPCs', name: 'Cultist', kind: 'npc', cls: 'Cleric', level: 1, ac: 7, move: 12, morale: 12, size: 'M',
      weapons: 'Mace:1d6+1', notes: 'Spells: Cause Light Wounds, Command.',
      ranks: [{ label: 'Acolyte', level: 1 }, { label: 'Cult Priest', level: 5, ac: 5, notes: 'Spells: Hold Person, Silence 15ft, Cause Light Wounds.' },
              { label: 'High Priest', level: 9, ac: 3, notes: 'Spells: Flame Strike, Cause Serious Wounds, Hold Person, Dispel Magic.' }] },
    { id: 'mage', group: 'Humans & NPCs', name: 'Evil Mage', kind: 'npc', cls: 'Mage', level: 3, ac: 10, move: 12, morale: 10, size: 'M',
      weapons: 'Dagger:1d4, Staff:1d6', notes: 'Spells: Magic Missile, Sleep, Web.',
      ranks: [{ label: 'Apprentice', level: 1, notes: 'Spells: Magic Missile, Sleep.' }, { label: 'Mage', level: 3 },
              { label: 'Wizard', level: 7, ac: 8, notes: 'Spells: Fireball, Lightning Bolt, Hold Person, Web, Magic Missile x2.' },
              { label: 'Archmage', level: 12, ac: 4, notes: 'Spells: Cone of Cold, Wall of Fire, Fireball x2, Dimension Door, Stoneskin.' }] },

    // ---------- Humanoids (Hit Dice) ----------
    { id: 'kobold', group: 'Humanoids', name: 'Kobold', kind: 'monster', hd: '1/2', ac: 7, move: 6, morale: 6, size: 'S', attacks: 1, damage: '1d4 or weapon',
      weapons: 'Spear:1d6, Sling:1d4', special: 'Infravision 60 ft. Hate gnomes. -1 to hit in sunlight.',
      ranks: [{ label: 'Kobold', hd: '1/2' }, { label: 'Guard', hd: '1-1', ac: 6 }, { label: 'Chieftain', hd: '1+1', ac: 5, damage: '1d8 (weapon)' }] },
    { id: 'goblin', group: 'Humanoids', name: 'Goblin', kind: 'monster', hd: '1-1', ac: 6, move: 6, morale: 10, size: 'S', attacks: 1, damage: '1d6 (weapon)',
      weapons: 'Short Sword:1d6, Spear:1d6', special: 'Infravision 60 ft. -1 to hit in sunlight.',
      ranks: [{ label: 'Goblin', hd: '1-1' }, { label: 'Sergeant', hd: '1', ac: 5 }, { label: 'Sub-chief', hd: '1+1', ac: 5 }, { label: 'Chieftain', hd: '2', ac: 4, damage: '1d8 (weapon)' }] },
    { id: 'orc', group: 'Humanoids', name: 'Orc', kind: 'monster', hd: '1', ac: 6, move: 9, morale: 11, size: 'M', attacks: 1, damage: '1d8 (weapon)',
      weapons: 'Scimitar:1d8, Spear:1d6, Short Bow:1d6', special: 'Infravision 60 ft. -1 to hit in sunlight. Hate elves.',
      ranks: [{ label: 'Warrior', name: 'Orc', hd: '1' }, { label: 'Sergeant', hd: '2', ac: 5 }, { label: 'Sub-chief', hd: '3', ac: 4, damage: '1d8+1 (weapon)' },
              { label: 'Chieftain', hd: '4', ac: 4, damage: '1d10+1 (weapon)', morale: 13 }, { label: 'Shaman', hd: '3', ac: 6, special: 'Priest spells as a 3rd-level cleric (Cause Light Wounds, Darkness).' }] },
    { id: 'hobgoblin', group: 'Humanoids', name: 'Hobgoblin', kind: 'monster', hd: '1+1', ac: 5, move: 9, morale: 11, size: 'M', attacks: 1, damage: '1d8 (weapon)',
      weapons: 'Long Sword:1d8, Spear:1d6, Composite Bow:1d6', special: 'Infravision 60 ft. Disciplined: fight in formation.',
      ranks: [{ label: 'Hobgoblin', hd: '1+1' }, { label: 'Sergeant', hd: '2', ac: 4 }, { label: 'Sub-chief', hd: '3', ac: 3 }, { label: 'Chieftain', hd: '4', ac: 3, damage: '1d10 (weapon)' }] },
    { id: 'gnoll', group: 'Humanoids', name: 'Gnoll', kind: 'monster', hd: '2', ac: 5, move: 9, morale: 11, size: 'L', attacks: 1, damage: '2d4 (weapon)',
      weapons: 'Battle Axe:1d8, Long Bow:1d6', special: 'Infravision 60 ft.',
      ranks: [{ label: 'Gnoll', hd: '2' }, { label: 'Leader', hd: '3', ac: 4 }, { label: 'Chieftain', hd: '4', ac: 3, damage: '2d4+2 (weapon)' }] },
    { id: 'bugbear', group: 'Humanoids', name: 'Bugbear', kind: 'monster', hd: '3+1', ac: 5, move: 9, morale: 12, size: 'L', attacks: 1, damage: '2d4 (weapon +2)',
      weapons: 'Morning Star:2d4+2', special: 'Surprise opponents on 1-3. Infravision 60 ft.',
      ranks: [{ label: 'Bugbear', hd: '3+1' }, { label: 'Leader', hd: '4', ac: 4 }, { label: 'Chieftain', hd: '4+1', ac: 3, damage: '2d4+3 (weapon)' }] },
    { id: 'lizardman', group: 'Humanoids', name: 'Lizard Man', kind: 'monster', hd: '2+1', ac: 5, move: 6, morale: 12, size: 'M', attacks: 3, damage: '1d2/1d2/1d6',
      weapons: 'Club:1d6, Javelin:1d6', special: 'Swim 12. Hold breath for long periods.',
      ranks: [{ label: 'Lizard Man', hd: '2+1' }, { label: 'Champion', hd: '4+1', ac: 4 }, { label: 'Lizard King', name: 'Lizard King', hd: '8', ac: 3, damage: '5d6 (trident)', morale: 15 }] },
    { id: 'ogre', group: 'Giants & big brutes', name: 'Ogre', kind: 'monster', hd: '4+1', ac: 5, move: 9, morale: 12, size: 'L', attacks: 1, damage: '1d10 or weapon +6',
      weapons: 'Club:2d4+6', special: '',
      ranks: [{ label: 'Ogre', hd: '4+1' }, { label: 'Leader', hd: '5+2', ac: 4 }, { label: 'Chieftain', hd: '7+2', ac: 3, damage: '2d6+6 (weapon)', morale: 15 }] },
    { id: 'troll', group: 'Giants & big brutes', name: 'Troll', kind: 'monster', hd: '6+6', ac: 4, move: 12, morale: 14, size: 'L', attacks: 3, damage: '1d4+4/1d4+4/2d6',
      weapons: '', special: 'Regenerates 3 HP/round (not fire or acid). Rises again unless burned.', xpBonus: 980 },
    { id: 'hillgiant', group: 'Giants & big brutes', name: 'Hill Giant', kind: 'monster', hd: '12+2', ac: 3, move: 12, morale: 14, size: 'H', attacks: 1, damage: '1d6 or weapon 2d6+7',
      weapons: 'Club:2d6+7, Thrown Rock:2d8', special: 'Hurl rocks (2d8, 200 yards). Catch missiles 30%.' },

    // ---------- Undead ----------
    { id: 'skeleton', group: 'Undead', name: 'Skeleton', kind: 'monster', hd: '1', ac: 7, move: 12, morale: 20, size: 'M', attacks: 1, damage: '1d6 (weapon)',
      weapons: 'Rusty Sword:1d6', special: 'Half damage from edged/piercing weapons. Immune to sleep, charm, hold, cold. Holy water 2d4. Turned as skeleton.' },
    { id: 'zombie', group: 'Undead', name: 'Zombie', kind: 'monster', hd: '2', ac: 8, move: 6, morale: 20, size: 'M', attacks: 1, damage: '1d8',
      weapons: '', special: 'Always strike last. Immune to sleep, charm, hold, cold, poison. Holy water 2d4.' },
    { id: 'ghoul', group: 'Undead', name: 'Ghoul', kind: 'monster', hd: '2', ac: 6, move: 9, morale: 20, size: 'M', attacks: 3, damage: '1d3/1d3/1d6',
      weapons: '', special: 'Paralyzing touch (save vs paralyzation, 2d6 rounds; elves immune). Immune to sleep, charm.', xpBonus: 30,
      ranks: [{ label: 'Ghoul', hd: '2' }, { label: 'Ghast', name: 'Ghast', hd: '4', ac: 4, damage: '1d4/1d4/1d8', special: 'Paralysis (elves too), stench: save vs poison or -2 to hit.', xpBonus: 95 }] },
    { id: 'wight', group: 'Undead', name: 'Wight', kind: 'monster', hd: '4+3', ac: 5, move: 12, morale: 14, size: 'M', attacks: 1, damage: '1d4',
      weapons: '', special: 'Energy drain (1 level per hit). Hit only by silver or magic weapons.', xpBonus: 250 },

    // ---------- Beasts ----------
    { id: 'wolf', group: 'Beasts', name: 'Wolf', kind: 'monster', hd: '2+2', ac: 7, move: 18, morale: 10, size: 'S', attacks: 1, damage: '1d4+1',
      weapons: '', special: 'Hunts in packs. Surround and trip.',
      ranks: [{ label: 'Wolf', hd: '2+2' }, { label: 'Pack leader', hd: '3+3' }, { label: 'Worg', name: 'Worg', hd: '4+4', ac: 6, damage: '2d4', size: 'M' }] },
    { id: 'giantrat', group: 'Beasts', name: 'Giant Rat', kind: 'monster', hd: '1/2', ac: 7, move: 12, morale: 5, size: 'T', attacks: 1, damage: '1d3',
      weapons: '', special: '5% chance per bite of disease.' },
    { id: 'bear', group: 'Beasts', name: 'Black Bear', kind: 'monster', hd: '3+3', ac: 7, move: 12, morale: 9, size: 'M', attacks: 3, damage: '1d3/1d3/1d6',
      weapons: '', special: 'Hug for 2d4 on a natural 18+.',
      ranks: [{ label: 'Black Bear', hd: '3+3' }, { label: 'Brown Bear', name: 'Brown Bear', hd: '5+5', ac: 6, damage: '1d6/1d6/1d8', size: 'L' }, { label: 'Cave Bear', name: 'Cave Bear', hd: '6+6', ac: 6, damage: '1d8/1d8/1d12', size: 'L' }] },
    { id: 'giantspider', group: 'Beasts', name: 'Giant Spider', kind: 'monster', hd: '4+4', ac: 4, move: 3, morale: 13, size: 'L', attacks: 1, damage: '2d4',
      weapons: '', special: 'Poison (save vs poison or die; DM may use 2d6 damage). Webs.', xpBonus: 245 }
];

/* ---------- Rules ---------- */
function parseHD(str) {
    const s = String(str || '1').trim();
    if (/^1\/2|^½/.test(s)) return { n: 0, plus: 0, half: true };
    const m = s.match(/^(\d+)\s*([+-]\s*\d+)?/);
    if (!m) return { n: 1, plus: 0 };
    return { n: parseInt(m[1]), plus: m[2] ? parseInt(m[2].replace(/\s/g, '')) : 0 };
}
function hdText(h) { return h.half ? '1/2' : `${h.n}${h.plus > 0 ? '+' + h.plus : h.plus < 0 ? h.plus : ''}`; }
// "Effective" HD for THAC0 / saves: +3 or more counts as one more HD; less than 1 HD = 0
function effHD(h) { if (h.half || h.n < 1 || (h.n === 1 && h.plus < 0)) return 0; return h.n + (h.plus >= 3 ? 1 : 0); }
function monsterTHAC0(h) {
    const e = effHD(h);
    if (e === 0) return 20;
    return Math.max(1, 19 - 2 * Math.floor((e - 1) / 2));
}
// DMG Table 31
function xpForHD(h) {
    if (h.half || h.n < 1) return 7;
    const n = h.n, plus = h.plus;
    if (n === 1 && plus < 0) return 15;
    if (n === 1 && plus <= 0) return 15;
    if ((n === 1 && plus > 0) || (n === 2 && plus <= 0)) return 35;
    const table = [[3, 65], [4, 120], [5, 175], [6, 270], [7, 420], [8, 650], [9, 975], [10, 1400], [12, 2000]];
    const eff = plus > 0 ? n + 1 : n;   // "2+1 to 3" = 65
    for (const [max, xp] of table) if (eff <= max) return xp;
    return 3000 + 1000 * Math.max(0, n - 13);
}
function avgHP(h) { if (h.half) return 2; return Math.max(1, Math.round(h.n * 4.5 + h.plus)); }
function rollHP(h) { if (h.half) return rollDie(4); let t = h.plus; for (let i = 0; i < h.n; i++) t += rollDie(8); return Math.max(1, t); }
function maxHP(h) { if (h.half) return 4; return Math.max(1, h.n * 8 + h.plus); }

// NPC hit points by class and level (0-level = 1d6)
const NPC_HP_RULES = { warrior: { die: 10, cap: 9, after: 3 }, priest: { die: 8, cap: 9, after: 2 }, rogue: { die: 6, cap: 10, after: 2 }, wizard: { die: 4, cap: 10, after: 1 } };
function npcHPRule(cls) { return NPC_HP_RULES[typeof classGroup === 'function' ? classGroup(cls) : 'warrior'] || NPC_HP_RULES.warrior; }
function npcHD(cls, level) {
    if (level < 1) return '1d6 (0-level)';
    const r = npcHPRule(cls);
    const dice = Math.min(level, r.cap);
    const extra = Math.max(0, level - r.cap) * r.after;
    return `${dice}d${r.die}${extra ? '+' + extra : ''} (${cls} ${level})`;
}
function npcHP(cls, level, mode) {
    if (level < 1) return mode === 'max' ? 6 : mode === 'roll' ? rollDie(6) : 4;
    const r = npcHPRule(cls);
    const dice = Math.min(level, r.cap), extra = Math.max(0, level - r.cap) * r.after;
    if (mode === 'max') return dice * r.die + extra;
    if (mode === 'roll') { let t = extra; for (let i = 0; i < dice; i++) t += rollDie(r.die); return t; }
    return Math.round(dice * (r.die + 1) / 2) + extra;
}
function npcTHAC0(cls, level) { return level < 1 ? 20 : getTHAC0(cls, level); }

/* ---------- Building a creature from the form ---------- */
function enemyTemplates() {
    return [...(State.customEnemies || []).map(t => ({ ...t, group: 'Campaign templates' })), ...ENEMY_TEMPLATES, ...mmTemplates()];
}
// Every Monster Manual entry can be scaled too
function mmTemplates() {
    return Object.entries(DB.monsters || {}).map(([name, m]) => ({
        id: 'mm:' + name, group: 'Monster Manual (all)', name, kind: 'monster', hd: String(m.hd || '1'), ac: m.ac, size: m.size,
        attacks: (String(m.damage || '').match(/\//g) || []).length + 1, damage: m.damage || '', weapons: '',
        special: [m.special, m.immunities && m.immunities !== 'None' ? 'Immune: ' + m.immunities : ''].filter(Boolean).join('. '),
        xpBonus: Math.max(0, (m.xp || 0) - xpForHD(parseHD(m.hd))), move: '', morale: ''
    }));
}
function findTemplate(id) { return enemyTemplates().find(t => t.id === id) || null; }

function statsFor(t, rank, lvl, plus, cls) {
    const r = rank || {};
    const pick = k => (r[k] !== undefined ? r[k] : t[k]);
    const label = r.label || '';
    const autoName = !label || label === t.name ? t.name : (label.toLowerCase().includes(t.name.toLowerCase()) ? label : `${t.name} ${label}`);
    const base = { name: r.name || autoName, type: t.group === 'Humans & NPCs' ? `${cls} ${lvl}` : t.name,
        ac: pick('ac'), move: pick('move'), morale: pick('morale'), size: pick('size'), weapons: pick('weapons') || '',
        special: pick('special') || '', notes: [t.notes, r.notes].filter(Boolean).join(' '), attacks: pick('attacks') || 1 };
    if (t.kind === 'npc') {
        const saves = {}; SAVE_TYPES.forEach(s => { saves[s] = getSave(cls, lvl, s); });
        const h = { n: lvl, plus: 0, half: lvl < 1 };
        const xp = xpForHD(h) + (/(Mage|Cleric|Druid|Specialist)/.test(cls) && lvl > 0 ? Math.round(lvl * 20) : 0);
        return { ...base, kind: 'npc', cls, level: lvl, hd: npcHD(cls, lvl), thac0: npcTHAC0(cls, lvl), saves, xp,
            damage: (base.weapons || '').split(',').map(w => (w.split(':')[1] || '').trim()).filter(Boolean)[0] || '1d6', hpAvg: npcHP(cls, lvl, 'avg') };
    }
    const h = lvl === 'half' ? { n: 0, plus: 0, half: true } : { n: lvl, plus: plus || 0 };
    const e = effHD(h);
    const saves = {}; SAVE_TYPES.forEach(s => { saves[s] = getSave('Fighter', e, s); });
    const xpBonus = r.xpBonus !== undefined ? r.xpBonus : (t.xpBonus || 0);
    return { ...base, kind: 'monster', level: h.half ? 0 : h.n, plus: h.plus, hd: hdText(h), thac0: monsterTHAC0(h), saves,
        xp: xpForHD(h) + xpBonus, damage: pick('damage') || '', hpAvg: avgHP(h) };
}

/* ---------- Modal ---------- */
let enemyForm = null;   // { templateId, rankIdx, editId }

function showEnemyModal(editId, templateId) {
    const editing = editId ? State.creatures.find(c => c.id === editId) : null;
    const tpls = enemyTemplates();
    const groups = [...new Set(tpls.map(t => t.group))];
    const tid = templateId || (editing && editing.template) || '';
    enemyForm = { templateId: tid, rankIdx: editing && editing.rankIdx != null ? editing.rankIdx : 0, editId: editId || null };
    const num = (id, label, extra) => `<div><label class="block text-xs font-bold text-amber-900">${label}</label><input id="${id}" class="input-fantasy w-full px-2 py-1 text-center" ${extra || ''}></div>`;
    $('modalContainer').innerHTML = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal-content wide" onclick="event.stopPropagation()">
                <div class="p-4 sm:p-6">
                    <h2 class="fantasy-font text-xl font-bold text-amber-900 mb-3">${editing ? 'Edit creature' : 'Add enemies'}</h2>
                    <label class="block text-xs font-bold text-amber-900 mb-1">Type of enemy</label>
                    <select id="enTemplate" class="input-fantasy w-full px-2 py-1 mb-2" onchange="enemyTemplateChanged(this.value)">
                        <option value="">— Custom creature (fill in yourself) —</option>
                        ${groups.map(g => `<optgroup label="${escapeHtml(g)}">${tpls.filter(t => t.group === g).map(t => `<option value="${escapeHtml(t.id)}" ${t.id === tid ? 'selected' : ''}>${escapeHtml(t.name)}</option>`).join('')}</optgroup>`).join('')}
                    </select>
                    <div id="enRanks" class="flex flex-wrap gap-1 mb-2"></div>
                    <div id="enLevelRow" class="p-2 rounded bg-amber-50 border border-amber-300 mb-3 flex flex-wrap items-end gap-3"></div>

                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div class="col-span-2"><label class="block text-xs font-bold text-amber-900">Name</label><input id="enName" class="input-fantasy w-full px-2 py-1"></div>
                        <div class="col-span-2"><label class="block text-xs font-bold text-amber-900">Type / note</label><input id="enType" class="input-fantasy w-full px-2 py-1"></div>
                        ${num('enHD', 'Hit Dice')}
                        ${num('enHP', 'Hit points', 'type="number" min="1" oninput="$(\'enHpMode\').value=\'field\'"')}
                        ${num('enAC', 'AC', 'type="number"')}
                        ${num('enTHAC0', 'THAC0', 'type="number"')}
                        ${num('enAttacks', '# Attacks')}
                        <div class="col-span-1 sm:col-span-1">${num('enDamage', 'Damage')}</div>
                        ${num('enXP', 'XP each', 'type="number" min="0"')}
                        ${num('enMorale', 'Morale')}
                        ${num('enMove', 'Move')}
                        ${num('enSize', 'Size')}
                    </div>
                    <div class="mt-2 text-xs font-bold text-amber-900">Saving throws</div>
                    <div class="grid grid-cols-5 gap-2">
                        ${SAVE_TYPES.map(s => `<div><label class="block text-xs text-amber-800 text-center" title="${escapeHtml(SAVE_NAMES[s])}">${s.toUpperCase()}</label><input id="enSave_${s}" type="number" class="input-fantasy w-full px-1 py-1 text-center"></div>`).join('')}
                    </div>
                    <div class="mt-2"><label class="block text-xs font-bold text-amber-900">Weapons (name:damage, comma-separated)</label><input id="enWeapons" class="input-fantasy w-full px-2 py-1"></div>
                    <div class="mt-2"><label class="block text-xs font-bold text-amber-900">Special abilities</label><input id="enSpecial" class="input-fantasy w-full px-2 py-1"></div>
                    <div class="mt-2"><label class="block text-xs font-bold text-amber-900">Notes</label><textarea id="enNotes" class="input-fantasy w-full px-2 py-1 h-14 resize-none"></textarea></div>

                    ${editing ? '' : `
                    <div class="mt-3 flex flex-wrap items-end gap-3 p-2 rounded bg-amber-50 border border-amber-300">
                        <div><label class="block text-xs font-bold text-amber-900">How many</label><input id="enQty" type="number" min="1" max="50" value="1" class="input-fantasy w-20 px-2 py-1 text-center"></div>
                        <div><label class="block text-xs font-bold text-amber-900">Hit points</label>
                            <select id="enHpMode" class="input-fantasy px-2 py-1">
                                <option value="avg">Average</option><option value="roll">Roll each</option><option value="max">Maximum</option><option value="field">As typed above</option>
                            </select></div>
                    </div>`}
                    ${editing ? '<input type="hidden" id="enHpMode" value="field">' : ''}
                    <label class="flex items-start gap-2 text-sm mt-3" style="flex-wrap:nowrap"><input type="checkbox" id="enSaveTpl" class="accent-amber-700 mt-1 shrink-0" style="width:auto"><span>Save these stats as a campaign template (reuse it later from "Campaign templates")</span></label>
                    <div class="flex justify-end gap-2 mt-4">
                        <button onclick="closeModal()" class="btn-galactic px-4 py-2 rounded">Cancel</button>
                        <button onclick="saveEnemyFromModal()" class="btn-fantasy px-4 py-2 rounded"><i class="fas fa-check mr-1"></i>${editing ? 'Save' : 'Add to bestiary'}</button>
                    </div>
                </div>
            </div>
        </div>`;
    if (editing) {
        fillEnemyFields({ ...editing, weapons: (editing.weapons || []).map(w => w.name + ':' + w.damage).join(', ') });
        $('enHP').value = editing.maxHp;
        renderEnemyRanks(); renderEnemyLevelRow(editing.level, editing.plus, editing.cls);
    } else enemyTemplateChanged(tid);
}

function renderEnemyRanks() {
    const t = findTemplate(enemyForm.templateId);
    const ranks = t && t.ranks ? t.ranks : [];
    $('enRanks').innerHTML = ranks.length ? `<span class="text-xs text-amber-800 self-center mr-1">Rank:</span>` + ranks.map((r, i) =>
        `<button onclick="enemyRankChanged(${i})" class="text-xs px-2 py-1 rounded border ${i === enemyForm.rankIdx ? 'bg-amber-700 text-white border-amber-900' : 'bg-amber-50 border-amber-400 text-amber-900'}">${escapeHtml(r.label)} <span class="opacity-75">${r.hd ? 'HD ' + r.hd : 'Lvl ' + r.level}</span></button>`).join('') : '';
}

function renderEnemyLevelRow(level, plus, cls) {
    const t = findTemplate(enemyForm.templateId);
    const row = $('enLevelRow');
    if (!t) { row.classList.add('hidden'); return; }
    row.classList.remove('hidden');
    if (t.kind === 'npc') {
        row.innerHTML = `
            <div><label class="block text-xs font-bold text-amber-900">Class</label>
                <select id="enCls" class="input-fantasy px-2 py-1" onchange="enemyLevelChanged()">${Object.keys(DB.classes).map(c => `<option ${c === (cls || t.cls) ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
            <div><label class="block text-xs font-bold text-amber-900">Level</label>
                <div class="flex items-center gap-1"><button onclick="stepEnemyLevel(-1)" class="btn-galactic px-2 py-1 rounded text-xs">−</button>
                <input id="enLevel" type="number" min="0" max="20" value="${level}" class="input-fantasy w-16 px-1 py-1 text-center" oninput="enemyLevelChanged()">
                <button onclick="stepEnemyLevel(1)" class="btn-fantasy px-2 py-1 rounded text-xs">+</button></div></div>
            <p class="text-xs text-amber-700 flex-1 min-w-[10rem]">Changing class or level recalculates HD, HP, THAC0, saves and XP (0 = 0-level).</p>`;
    } else {
        row.innerHTML = `
            <div><label class="block text-xs font-bold text-amber-900">Hit Dice</label>
                <div class="flex items-center gap-1"><button onclick="stepEnemyLevel(-1)" class="btn-galactic px-2 py-1 rounded text-xs">−</button>
                <input id="enLevel" type="number" min="0" max="40" value="${level}" class="input-fantasy w-16 px-1 py-1 text-center" oninput="enemyLevelChanged()">
                <button onclick="stepEnemyLevel(1)" class="btn-fantasy px-2 py-1 rounded text-xs">+</button></div></div>
            <div><label class="block text-xs font-bold text-amber-900">HP bonus (+/−)</label>
                <input id="enPlus" type="number" min="-3" max="20" value="${plus || 0}" class="input-fantasy w-16 px-1 py-1 text-center" oninput="enemyLevelChanged()"></div>
            <p class="text-xs text-amber-700 flex-1 min-w-[10rem]">0 HD = ½ HD. Changing HD recalculates HP, THAC0, saves and XP; AC and damage stay as the rank sets them.</p>`;
    }
}

function fillEnemyFields(s) {
    const set = (id, v) => { if ($(id)) $(id).value = v == null ? '' : v; };
    set('enName', s.name); set('enType', s.type); set('enHD', s.hd); set('enHP', s.hpAvg != null ? s.hpAvg : s.maxHp);
    set('enAC', s.ac); set('enTHAC0', s.thac0); set('enAttacks', s.attacks); set('enDamage', s.damage); set('enXP', s.xp);
    set('enMorale', s.morale); set('enMove', s.move); set('enSize', s.size); set('enWeapons', s.weapons); set('enSpecial', s.special); set('enNotes', s.notes);
    SAVE_TYPES.forEach(k => set('enSave_' + k, (s.saves || {})[k]));
    if ($('enHpMode') && $('enHpMode').tagName === 'SELECT' && $('enHpMode').value === 'field') $('enHpMode').value = 'avg';
}

function currentEnemyStats() {
    const t = findTemplate(enemyForm.templateId);
    if (!t) return null;
    const rank = (t.ranks || [])[enemyForm.rankIdx];
    let lvl = parseInt($('enLevel') ? $('enLevel').value : '') ;
    if (isNaN(lvl)) lvl = 0;
    if (t.kind === 'npc') return statsFor(t, rank, Math.max(0, Math.min(20, lvl)), 0, $('enCls') ? $('enCls').value : t.cls);
    const plus = parseInt($('enPlus') ? $('enPlus').value : 0) || 0;
    return statsFor(t, rank, lvl < 1 && plus <= 0 ? 'half' : Math.max(lvl, 1), lvl < 1 && plus <= 0 ? 0 : plus);
}

function enemyTemplateChanged(id) {
    enemyForm.templateId = id;
    const t = findTemplate(id);
    renderEnemyRanks();
    if (!t) { renderEnemyLevelRow(); if (!enemyForm.editId) fillEnemyFields({ name: '', ac: 10, thac0: 20, hd: '1', hpAvg: 4, attacks: 1, xp: 15, saves: { ppdm: 14, rsw: 16, pp: 15, bw: 17, sp: 17 } }); return; }
    enemyForm.rankIdx = 0;
    applyRankDefaults();
}
function applyRankDefaults() {
    const t = findTemplate(enemyForm.templateId);
    const r = (t.ranks || [])[enemyForm.rankIdx] || {};
    if (t.kind === 'npc') renderEnemyLevelRow(r.level != null ? r.level : t.level, 0, t.cls);
    else { const h = parseHD(r.hd || t.hd); renderEnemyLevelRow(h.half ? 0 : h.n, h.plus); }
    fillEnemyFields(currentEnemyStats());
}
function enemyRankChanged(i) { enemyForm.rankIdx = i; renderEnemyRanks(); applyRankDefaults(); }
function enemyLevelChanged() {
    const s = currentEnemyStats(); if (!s) return;
    // Level-dependent numbers only: what the DM typed for AC, damage, weapons etc. stays
    ['enHD', 'enTHAC0', 'enXP'].forEach((id, i) => { $(id).value = [s.hd, s.thac0, s.xp][i]; });
    $('enHP').value = s.hpAvg;
    if ($('enHpMode') && $('enHpMode').tagName === 'SELECT' && $('enHpMode').value === 'field') $('enHpMode').value = 'avg';
    SAVE_TYPES.forEach(k => { $('enSave_' + k).value = s.saves[k]; });
    if (s.kind === 'npc' && $('enType')) $('enType').value = s.type;
}
function stepEnemyLevel(d) { const el = $('enLevel'); el.value = Math.max(0, (parseInt(el.value) || 0) + d); enemyLevelChanged(); }

function hpForCopy(mode) {
    const typed = Math.max(1, parseInt($('enHP').value) || 1);
    if (mode === 'field' || mode === 'avg') return mode === 'avg' ? (parseInt($('enHP').value) || 1) : typed;
    const t = findTemplate(enemyForm.templateId);
    if (!t) return typed;
    if (t.kind === 'npc') return npcHP($('enCls').value, parseInt($('enLevel').value) || 0, mode);
    const lvl = parseInt($('enLevel').value) || 0, plus = parseInt($('enPlus').value) || 0;
    const h = lvl < 1 && plus <= 0 ? { n: 0, plus: 0, half: true } : { n: Math.max(1, lvl), plus };
    return mode === 'max' ? maxHP(h) : rollHP(h);
}

function saveEnemyFromModal() {
    const name = $('enName').value.trim();
    if (!name) return toast('Name required', 'error');
    const saves = {}; SAVE_TYPES.forEach(k => { const v = parseInt($('enSave_' + k).value); if (!isNaN(v)) saves[k] = v; });
    const weapons = $('enWeapons').value.split(',').map(s => { const p = s.trim().split(':'); return p.length >= 2 && p[0].trim() ? { name: p[0].trim(), damage: p.slice(1).join(':').trim() } : null; }).filter(Boolean);
    const t = findTemplate(enemyForm.templateId);
    const common = {
        type: $('enType').value.trim(), hd: $('enHD').value.trim(), ac: parseInt($('enAC').value) || 10, thac0: parseInt($('enTHAC0').value) || 20,
        xp: parseInt($('enXP').value) || 0, attacks: $('enAttacks').value.trim(), damage: $('enDamage').value.trim(), morale: $('enMorale').value.trim(),
        move: $('enMove').value.trim(), size: $('enSize').value.trim(), saves, weapons, special: $('enSpecial').value.trim(), notes: $('enNotes').value.trim(),
        template: t ? t.id : '', rankIdx: enemyForm.rankIdx, level: $('enLevel') ? parseInt($('enLevel').value) || 0 : null,
        plus: $('enPlus') ? parseInt($('enPlus').value) || 0 : null, cls: $('enCls') ? $('enCls').value : null, lastUpdated: Date.now()
    };
    if ($('enSaveTpl') && $('enSaveTpl').checked) {
        const tpl = { id: 'c:' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), name, kind: t && t.kind === 'npc' ? 'npc' : 'monster',
            cls: common.cls || undefined, level: common.level || 0, hd: common.hd, ac: common.ac, move: common.move, morale: common.morale, size: common.size,
            attacks: common.attacks, damage: common.damage, weapons: $('enWeapons').value.trim(), special: common.special, notes: common.notes,
            xpBonus: Math.max(0, common.xp - xpForHD(t && t.kind === 'npc' ? { n: common.level || 0, plus: 0, half: !common.level } : parseHD(common.hd))) };
        if (tpl.kind === 'npc' && common.level < 1) tpl.level = 0;
        if (tpl.kind === 'monster') { const h = parseHD(common.hd); tpl.hd = hdText(h); }
        State.customEnemies = (State.customEnemies || []).filter(x => x.id !== tpl.id);
        State.customEnemies.push(tpl);
    }
    if (enemyForm.editId) {
        const c = State.creatures.find(x => x.id === enemyForm.editId);
        if (!c) return;
        const newMax = Math.max(1, parseInt($('enHP').value) || 1);
        const hp = c.hp >= c.maxHp ? newMax : Math.min(c.hp, newMax);
        Object.assign(c, common, { name, maxHp: newMax, hp });
        Storage.save(); closeModal(); render(); toast('Creature updated');
        return;
    }
    const qty = Math.max(1, Math.min(50, parseInt($('enQty').value) || 1));
    const mode = $('enHpMode').value;
    const existing = State.creatures.filter(c => c.name === name || c.name.startsWith(name + ' ')).length;
    for (let i = 0; i < qty; i++) {
        const hp = hpForCopy(mode);
        State.creatures.push({ id: Date.now().toString(36) + Math.random().toString(36).substr(2, 6), ...common,
            name: qty > 1 || existing ? `${name} ${existing + i + 1}` : name, hp, maxHp: hp });
    }
    Storage.save(); closeModal(); render();
    toast(`Added ${qty} × ${name}`);
}

function duplicateCreature(id) {
    const c = State.creatures.find(x => x.id === id); if (!c) return;
    const base = c.name.replace(/\s+\d+$/, '');
    const n = State.creatures.filter(x => x.name === base || x.name.startsWith(base + ' ')).length + 1;
    State.creatures.push({ ...JSON.parse(JSON.stringify(c)), id: Date.now().toString(36) + Math.random().toString(36).substr(2, 6), name: `${base} ${n}`, hp: c.maxHp });
    Storage.save(); render();
}

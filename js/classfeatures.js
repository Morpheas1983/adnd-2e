/* classfeatures.js - PHB class features: thief & bard skills (Tables 26-29, 33), backstab (Table 30),
   ranger hide/move silently (Table 18) and turning undead (Table 61). Loaded after abilities.js on every page. */

const THIEF_SKILL_ORDER = ['Pick Pockets', 'Open Locks', 'Find/Remove Traps', 'Move Silently', 'Hide in Shadows', 'Detect Noise', 'Climb Walls', 'Read Languages'];
const DEX_ADJ_INDEX = { 'Pick Pockets': 0, 'Open Locks': 1, 'Find/Remove Traps': 2, 'Move Silently': 3, 'Hide in Shadows': 4 };

function hasThiefSkills(char) { return char && (char.class === 'Thief' || char.class === 'Bard'); }

// Skills of the class with their PHB base score
function rogueSkillBases(char) {
    if (char.class === 'Bard') return (DB.bard_skills || []).map(s => ({ name: s.name, base: s.base }));
    return (DB.thieving_skills || []).map(s => ({ name: s.name, base: s.base }));
}

// Discretionary points (PHB p.38 / p.42): thief 60 at 1st + 30 per level; bard 20 at 1st + 15 per level
function rogueSkillBudget(char) {
    const lvl = Math.max(1, parseInt(char.level) || 1);
    return char.class === 'Bard' ? 20 + 15 * (lvl - 1) : 60 + 30 * (lvl - 1);
}
// Most points one skill may hold: 30 at 1st level (bard 20), then +15 per level
function rogueSkillCap(char) {
    const lvl = Math.max(1, parseInt(char.level) || 1);
    return (char.class === 'Bard' ? 20 : 30) + 15 * (lvl - 1);
}

// Points spent per skill. Older characters stored final percentages in char.thiefSkills: convert once.
function rogueSkillPoints(char) {
    if (char.thiefPoints) return char.thiefPoints;
    const pts = {};
    rogueSkillBases(char).forEach(s => {
        const old = (char.thiefSkills || {})[s.name];
        if (old != null) pts[s.name] = Math.max(0, parseInt(old) - s.base);
    });
    return pts;
}

function thiefArmorColumn(char) {
    const armor = (char.inventory || []).find(i => i.equipped && i.type === 'armor');
    if (!armor) return { col: 0, label: 'No armor' };
    const n = (armor.baseName || armor.name || '').toLowerCase();
    if (n.includes('elven chain')) return { col: 1, label: 'Elven chain' };
    if (n.includes('padded') || n.includes('studded')) return { col: 2, label: 'Padded / studded leather' };
    if (n.includes('leather')) return null;   // normal leather: the base scores already assume it
    return { col: 2, label: armor.name + ' (not allowed for thieves; studded penalty shown)' };
}

// Full breakdown of one skill
function rogueSkill(char, name) {
    const bases = rogueSkillBases(char);
    const b = bases.find(s => s.name === name);
    if (!b) return null;
    const race = ((DB.thief_race_adj || {})[char.race] || {})[name] || 0;
    const dexRow = (DB.thief_dex_adj || {})[String(Math.max(9, Math.min(19, getModifiedStat(char, 'dex'))))] || [0, 0, 0, 0, 0];
    const dex = DEX_ADJ_INDEX[name] != null ? (dexRow[DEX_ADJ_INDEX[name]] || 0) : 0;
    const ac = thiefArmorColumn(char);
    const armor = ac ? (((DB.thief_armor_adj || {})[name] || [0, 0, 0])[ac.col] || 0) : 0;
    const pts = parseInt(rogueSkillPoints(char)[name]) || 0;
    const total = Math.max(0, Math.min(95, b.base + race + dex + armor + pts));
    return { name, base: b.base, race, dex, armor, points: pts, total };
}

function backstabMultiplier(level) {
    const row = (DB.backstab || [[4, 2], [8, 3], [12, 4], [99, 5]]).find(r => (parseInt(level) || 1) <= r[0]);
    return row ? row[1] : 2;
}

function rangerHideMove(level) {
    const t = DB.ranger_hide_move || [];
    const row = t.find(r => r[0] === Math.min(15, Math.max(1, parseInt(level) || 1)));
    return row ? { hide: row[1], move: row[2] } : null;
}

/* ---------- Sheet panel: thief / bard skills ---------- */
function renderRogueSkillsPanel(char) {
    if (!hasThiefSkills(char)) return '';
    const canEdit = canWriteChar(char);
    const pts = rogueSkillPoints(char);
    const budget = rogueSkillBudget(char), cap = rogueSkillCap(char);
    const used = Object.values(pts).reduce((n, v) => n + (parseInt(v) || 0), 0);
    const left = budget - used;
    const ac = thiefArmorColumn(char);
    return `
        <div class="parchment scroll-border p-4 fade-in" id="rogueSkills">
            <div class="section-header"><i class="fas fa-mask"></i>${char.class === 'Bard' ? 'Bard Skills' : 'Thieving Skills'}</div>
            <div class="flex flex-wrap gap-2 items-center text-xs mb-2">
                <span class="px-2 py-1 rounded ${left < 0 ? 'bg-red-100 text-red-800 border border-red-300' : left > 0 ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-amber-100 text-amber-900 border border-amber-300'}">
                    Points: <b>${used}</b> / ${budget}${left > 0 ? ` · <b>${left}</b> to spend` : left < 0 ? ` · ${-left} too many` : ''}</span>
                <span class="text-amber-700">Max ${cap} points in one skill · no skill above 95% · ${escapeHtml(ac ? ac.label : 'Leather armor')}</span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                ${rogueSkillBases(char).map(s => {
                    const k = rogueSkill(char, s.name);
                    const parts = [`base ${k.base}`, k.race ? `race ${formatMod(k.race)}` : '', k.dex ? `DEX ${formatMod(k.dex)}` : '', k.armor ? `armor ${formatMod(k.armor)}` : ''].filter(Boolean).join(', ');
                    return `<div class="flex items-center justify-between gap-2 p-2 bg-amber-100 rounded border border-amber-300" data-skill="${escapeHtml(s.name)}">
                        <div class="min-w-0"><div class="font-bold text-amber-900 text-sm">${escapeHtml(s.name)}</div><div class="text-xs text-amber-700">${parts}${k.points ? `, +${k.points} points` : ''}</div></div>
                        <div class="flex items-center gap-1 shrink-0">
                            ${canEdit ? `<button onclick="spendRoguePoints('${char.id}', '${s.name.replace(/'/g, "\\'")}', -5)" class="btn-galactic px-1.5 py-0.5 rounded text-xs" title="−5 points" ${k.points <= 0 ? 'disabled' : ''}>−5</button>` : ''}
                            <span class="text-lg font-bold text-amber-900 w-12 text-center">${k.total}%</span>
                            ${canEdit ? `<button onclick="spendRoguePoints('${char.id}', '${s.name.replace(/'/g, "\\'")}', 5)" class="btn-fantasy px-1.5 py-0.5 rounded text-xs" title="+5 points" ${left <= 0 || k.points >= cap || k.total >= 95 ? 'disabled' : ''}>+5</button>
                            <button onclick="rollRogueSkill('${char.id}', '${s.name.replace(/'/g, "\\'")}')" class="text-amber-800 px-1" title="Roll d100"><i class="fas fa-dice"></i></button>` : ''}
                        </div>
                    </div>`;
                }).join('')}
            </div>
            ${char.class === 'Thief' ? `<div class="text-xs text-amber-800 mt-2"><i class="fas fa-user-ninja mr-1"></i><b>Backstab:</b> +4 to hit, damage ×${backstabMultiplier(char.level)} (PHB Table 30).</div>` : ''}
            <p class="text-xs text-amber-700 mt-1">PHB: ${char.class === 'Bard' ? '20 points at 1st level, 15 more each level' : '60 points at 1st level, 30 more each level'}, spent 5 at a time with the buttons.</p>
        </div>`;
}

function spendRoguePoints(charId, name, delta) {
    const char = (State.characters || []).find(c => c.id === charId) || State.currentCharacter;
    if (!char) return;
    const pts = { ...rogueSkillPoints(char) };
    const cur = parseInt(pts[name]) || 0;
    const used = Object.values(pts).reduce((n, v) => n + (parseInt(v) || 0), 0);
    let d = delta;
    if (d > 0) {
        d = Math.min(d, rogueSkillBudget(char) - used, rogueSkillCap(char) - cur);
        const k = rogueSkill(char, name);
        d = Math.min(d, 95 - k.total);
        if (d <= 0) return toast('No points left for this skill', 'error');
    } else d = Math.max(d, -cur);
    pts[name] = cur + d;
    char.thiefPoints = pts;
    Storage.save(); render();
}

function rollRogueSkill(charId, name) {
    const char = (State.characters || []).find(c => c.id === charId) || State.currentCharacter;
    const k = char && rogueSkill(char, name);
    if (!k) return;
    const r = rollDie(100);
    toast(`${name}: rolled ${r} vs ${k.total}% — ${r <= k.total ? 'Success!' : 'Failed'}`, r <= k.total ? 'success' : 'error');
}

function renderRangerPanel(char) {
    if (char.class !== 'Ranger') return '';
    const r = rangerHideMove(char.level);
    if (!r) return '';
    return `<div class="parchment scroll-border p-4 fade-in" id="rangerSkills">
        <div class="section-header"><i class="fas fa-tree"></i>Ranger Abilities</div>
        <div class="grid grid-cols-2 gap-3">
            <div class="saving-throw-box"><div class="value">${r.hide}%</div><div class="label">Hide in Shadows</div></div>
            <div class="saving-throw-box"><div class="value">${r.move}%</div><div class="label">Move Silently</div></div>
        </div>
        <p class="text-xs text-amber-700 mt-2">PHB Table 18, in natural surroundings and in studded leather or lighter armor.</p>
    </div>`;
}

/* ---------- Turning undead (PHB Table 61) ---------- */
function turnLevel(char) {
    if (char.class === 'Cleric') return char.level || 1;
    if (char.class === 'Paladin') return (char.level || 1) - 2;   // turns as a priest 2 levels lower
    return 0;
}
function turnColumn(lvl) { return lvl <= 0 ? -1 : lvl <= 9 ? lvl - 1 : lvl <= 11 ? 9 : lvl <= 13 ? 10 : 11; }

function renderTurnUndeadPanel(char) {
    const lvl = turnLevel(char);
    if (!DB.turn_undead || !['Cleric', 'Paladin'].includes(char.class)) return '';
    const col = turnColumn(lvl);
    const rows = Object.entries(DB.turn_undead).filter(([k]) => k !== 'columns' && k !== 'notes');
    const isEvil = /Evil/.test(char.alignment || '');
    return `
        <div class="parchment scroll-border p-4 fade-in" id="turnUndead">
            <div class="section-header"><i class="fas fa-sun"></i>${isEvil ? 'Command Undead' : 'Turn Undead'}</div>
            ${col < 0 ? `<p class="text-sm text-amber-700 italic">${char.class === 'Paladin' ? 'Paladins turn undead from 3rd level, as a priest 2 levels lower.' : 'Cannot turn undead yet.'}</p>` : `
            <p class="text-xs text-amber-700 mb-2">Turns as a level ${lvl} priest. Roll d20 equal or higher than the number; <b>T</b> = turned automatically, <b>D</b> = destroyed${isEvil ? ' (evil priests: commanded)' : ''}, <b>D*</b> = destroyed and 2d4 more affected. A success affects 2d6 undead.</p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-1">
                ${rows.map(([name, vals]) => {
                    const v = vals[col];
                    return `<div class="flex justify-between items-center gap-2 px-2 py-1 rounded ${v == null ? 'opacity-50' : 'bg-amber-50'} border border-amber-200 text-sm">
                        <span>${escapeHtml(name)}</span>
                        <span class="flex items-center gap-2"><b class="w-8 text-center">${v == null ? '–' : v}</b>
                        ${v != null && canWriteChar(char) ? `<button onclick="rollTurnUndead('${char.id}', '${name.replace(/'/g, "\\'")}')" class="btn-fantasy px-2 py-0.5 rounded text-xs">Turn</button>` : ''}</span>
                    </div>`;
                }).join('')}
            </div>`}
        </div>`;
}

function rollTurnUndead(charId, row) {
    const char = (State.characters || []).find(c => c.id === charId) || State.currentCharacter;
    const v = DB.turn_undead[row][turnColumn(turnLevel(char))];
    const count = rollDie(6) + rollDie(6);
    if (typeof v === 'string') {
        const extra = v.includes('*') ? ` plus ${rollDie(4) + rollDie(4)} more` : '';
        return toast(`${row}: automatic ${v.startsWith('D') ? 'destroy' : 'turn'} — ${count} undead affected${extra}`, 'success');
    }
    const r = rollDie(20);
    toast(`${row}: rolled ${r} vs ${v} — ${r >= v ? `Turned! ${count} undead flee` : 'Failed'}`, r >= v ? 'success' : 'error');
}

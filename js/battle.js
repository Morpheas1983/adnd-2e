/* battle.js - DM battle tracker: initiative order, hit dice & hit points of characters and creatures */
let Battle = { round: 1, turnKey: null, rerollEachRound: true, participants: [], startedAt: null };
let battleLoaded = false;
let battleSynced = '';

function battleRef() { return fs.collection('campaigns').doc(State.campaignId).collection('private').doc('battle'); }

function subscribeBattle() {
    return new Promise(resolve => {
        let first = true;
        Cloud.unsubs.push(battleRef().onSnapshot(doc => {
            const json = doc.exists ? (doc.data().battleJson || '') : '';
            if (json && json !== battleSynced) {
                battleSynced = json;
                Battle = Object.assign({ round: 1, turnKey: null, rerollEachRound: true, participants: [] }, parseJson(json, {}));
            }
            battleLoaded = true;
            if (first) { first = false; resolve(); } else safeRender();
        }, err => { console.error('Battle load error', err); resolve(); }));
    });
}

function saveBattle() {
    const json = JSON.stringify(Battle);
    if (json === battleSynced) return;
    battleSynced = json;
    const p = battleRef().set({ battleJson: json, updatedAt: serverTime() }).catch(reportWriteError('the battle'));
    Cloud.pending = Promise.all([Cloud.pending, p]);
}

/* ---------- participants ---------- */
function newKey() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function pcOf(p) { return p.kind === 'pc' ? State.characters.find(c => c.id === p.charId) : null; }

// Live view of a participant: characters are read from their sheet, so players' changes show up immediately
function view(p) {
    const c = pcOf(p);
    if (p.kind === 'pc') {
        const cls = DB.classes[c?.class] || {};
        const lvl = c?.level || 1;
        return {
            name: c ? c.name : (p.name + ' (left campaign)'), sub: c ? `${c.race} ${c.class} · ${escapeHtml(c.playerName || memberName(c.player))}` : '',
            hd: c ? `${lvl <= 9 ? lvl : 9}d${cls.hd || 8}${lvl > 9 ? `+${(lvl - 9) * (cls.hd >= 10 ? 3 : cls.hd >= 8 ? 2 : 1)}` : ''} (Lvl ${lvl})` : '?',
            hp: c ? (c.hp ?? 0) : 0, maxHp: c ? (c.maxHp || 1) : 1,
            ac: c ? calcAC(c) : '?', thac0: c ? calcTHAC0(c) : '?',
            down: c ? (c.hp ?? 0) <= 0 : false, dead: c ? (c.hp ?? 0) <= -10 : false
        };
    }
    return { name: p.name, sub: p.source || 'Creature', hd: p.hd || '—', hp: p.hp, maxHp: p.maxHp, ac: p.ac, thac0: p.thac0, down: p.hp <= 0, dead: !!p.defeated };
}

/* ---------- Speed factor of what each combatant does this round ---------- */
// Choices for a character: their weapons (equipped first) and prepared spells
function actionChoices(c) {
    if (!c) return [];
    const weapons = (c.inventory || []).filter(i => i.type === 'weapon').sort((a, b) => (b.equipped ? 1 : 0) - (a.equipped ? 1 : 0));
    const out = weapons.map(w => ({ id: 'w:' + w.name, label: `${w.name}${w.equipped ? '' : ' (not equipped)'}`, sf: weaponSpeed(w), group: 'Weapons' }));
    [...new Set(c.preparedSpells || [])].forEach(n => {
        const sf = spellSpeed(c, n);
        out.push({ id: 's:' + n, label: n, sf: sf.value === null ? 10 : sf.value, sfLabel: sf.label, group: 'Spells' });
    });
    return out;
}
function defaultAction(c) {
    const ch = actionChoices(c);
    return ch.find(x => x.id.startsWith('w:')) || null;
}
// Speed factor used in the initiative roll
function speedOf(p) {
    if (p.kind !== 'pc') return parseInt(p.speed) || 0;
    const c = pcOf(p);
    const ch = actionChoices(c);
    const a = p.action === 'other' ? null : (ch.find(x => x.id === p.action) || (p.action ? null : defaultAction(c)));
    return a ? a.sf : 0;
}
function condInit(p) { if (p.kind !== 'pc') return 0; const c = pcOf(p); return c ? (getEffectMods(c).init || 0) : 0; }
function initRoll(p) { return rollDie(10) + speedOf(p) + condInit(p) + (p.initMod || 0); }
function setAction(key, v) { const p = Battle.participants.find(x => x.key === key); if (!p) return; p.action = v; saveBattle(); render(); }
function setSpeed(key, v) { const p = Battle.participants.find(x => x.key === key); if (!p) return; p.speed = parseInt(v) || 0; saveBattle(); render(); }

function orderedParticipants() {
    return [...Battle.participants].sort((a, b) => {
        const ai = a.init == null ? 999 : a.init, bi = b.init == null ? 999 : b.init;
        if (ai !== bi) return ai - bi;                    // AD&D 2e: lowest initiative acts first
        const am = speedOf(a) + (a.initMod || 0), bm = speedOf(b) + (b.initMod || 0);
        if (am !== bm) return am - bm;
        return a.name.localeCompare(b.name);
    });
}
function activeParticipants() { return orderedParticipants().filter(p => !(p.kind === 'npc' && p.defeated)); }

function rollMonsterHPValue(hd) {
    const info = parseMonsterHD(hd || '1');
    let total = info.bonus;
    for (let i = 0; i < Math.max(1, info.count); i++) total += rollDie(info.die);
    return Math.max(1, total);
}

/* ---------- render ---------- */
function renderBattle(container) {
    const order = orderedParticipants();
    const current = Battle.participants.find(p => p.key === Battle.turnKey);
    const killsXP = Battle.participants.filter(p => p.kind === 'npc' && p.defeated).reduce((n, p) => n + (p.xp || 0), 0);
    const pcs = State.characters.filter(c => c.campaignId === State.campaignId);

    container.innerHTML = `
        <div class="min-h-screen p-4">
            <div class="max-w-6xl mx-auto">
                <div class="parchment scroll-border p-4 mb-4 fade-in">
                    <div class="flex justify-between items-center flex-wrap gap-3">
                        <div class="flex items-center gap-3">
                            <button onclick="changeView('dm_view')" class="btn-galactic px-3 py-2 rounded text-sm"><i class="fas fa-arrow-left"></i> Party</button>
                            <h1 class="fantasy-font text-2xl font-bold text-amber-900"><i class="fas fa-khanda mr-2 text-amber-700"></i>Battle</h1>
                        </div>
                        <div class="flex flex-wrap gap-2 items-center">
                            <span class="fantasy-font text-xl text-amber-900 mr-2">Round ${Battle.round || 1}</span>
                            <button onclick="showAddCombatants()" class="btn-fantasy px-3 py-2 rounded text-sm"><i class="fas fa-plus mr-1"></i>Add</button>
                            <button onclick="rollAllInitiative()" class="btn-fantasy px-3 py-2 rounded text-sm" ${!order.length ? 'disabled' : ''}><i class="fas fa-dice-d20 mr-1"></i>Roll initiative</button>
                            <button onclick="nextTurn()" class="btn-magic px-3 py-2 rounded text-sm" ${!order.length ? 'disabled' : ''}><i class="fas fa-forward mr-1"></i>Next turn</button>
                            <button onclick="changeView('stats')" class="btn-galactic px-3 py-2 rounded text-sm"><i class="fas fa-chart-bar mr-1"></i>Stats & XP</button>
                            <button onclick="endBattle()" class="btn-danger px-3 py-2 rounded text-sm" ${!order.length ? 'disabled' : ''}><i class="fas fa-flag-checkered mr-1"></i>End</button>
                        </div>
                    </div>
                    <div class="flex flex-wrap items-center gap-4 mt-3 text-sm text-amber-800">
                        ${current ? `<span><i class="fas fa-play text-green-700 mr-1"></i>Now acting: <b>${escapeHtml(view(current).name)}</b></span>` : order.length ? '<span>Roll initiative, then press <b>Next turn</b>.</span>' : ''}
                        <label class="flex items-center gap-1 cursor-pointer"><input type="checkbox" class="accent-amber-700" ${Battle.rerollEachRound ? 'checked' : ''} onchange="Battle.rerollEachRound=this.checked; saveBattle();">Re-roll initiative every round</label>
                        ${killsXP ? `<span><i class="fas fa-skull mr-1"></i>XP from defeated creatures: <b>${killsXP}</b></span>` : ''}
                    </div>
                    <p class="text-xs text-amber-700 mt-1">Initiative: d10 + <b>speed factor</b> of the chosen weapon or spell + modifier, <b>lowest acts first</b>. Spells cast in rounds take effect at the end of the round. Characters' hit points come straight from their sheets and update live.</p>
                </div>

                ${!order.length ? `
                <div class="parchment scroll-border p-8 text-center fade-in">
                    <i class="fas fa-khanda text-4xl text-amber-700 mb-3"></i>
                    <p class="fantasy-font text-lg text-amber-900">No battle yet</p>
                    <p class="text-amber-800 text-sm mt-2 mb-4">Add the party's characters and the creatures they face.</p>
                    <button onclick="showAddCombatants()" class="btn-fantasy px-4 py-2 rounded"><i class="fas fa-plus mr-1"></i>Add combatants</button>
                </div>` : `
                <div class="space-y-2">
                    ${order.map((p, i) => battleRow(p, i, pcs)).join('')}
                </div>`}
            </div>
        </div>`;
}

function battleRow(p, i, pcs) {
    const v = view(p);
    const isTurn = p.key === Battle.turnKey;
    const pct = Math.max(0, Math.min(100, (v.hp / (v.maxHp || 1)) * 100));
    const isNpc = p.kind === 'npc';
    const status = isNpc ? (p.defeated ? '<span class="text-xs px-2 py-0.5 rounded bg-gray-700 text-white"><i class="fas fa-skull mr-1"></i>Defeated</span>' : '')
        : v.dead ? '<span class="text-xs px-2 py-0.5 rounded bg-gray-800 text-white">Dead (−10)</span>' : v.down ? '<span class="text-xs px-2 py-0.5 rounded bg-red-700 text-white">Unconscious</span>' : '';
    return `
    <div class="parchment scroll-border p-3 fade-in ${isTurn ? 'ring-4 ring-green-600' : ''} ${isNpc && p.defeated ? 'opacity-60' : ''}" data-key="${p.key}">
        <div class="flex flex-wrap items-center gap-3">
            <div class="flex flex-col items-center w-16">
                <span class="text-xs text-amber-700">Init</span>
                <input type="number" value="${p.init ?? ''}" placeholder="–" class="input-fantasy w-14 text-center text-lg font-bold px-1 py-1" onchange="setInit('${p.key}', this.value)" aria-label="Initiative">
                <button onclick="rollInit('${p.key}')" class="text-xs text-amber-800 underline mt-1" title="Roll d10 + speed ${speedOf(p)}${p.initMod ? ' ' + formatMod(p.initMod) : ''}"><i class="fas fa-dice-d20"></i> roll</button>
            </div>
            <div class="flex-1 min-w-[180px]">
                <div class="flex items-center gap-2 flex-wrap">
                    ${isTurn ? '<i class="fas fa-play text-green-700"></i>' : ''}
                    <span class="fantasy-font font-bold text-amber-900 text-lg">${escapeHtml(v.name)}</span>
                    <span class="text-xs px-2 py-0.5 rounded ${isNpc ? 'bg-red-100 text-red-800 border border-red-300' : 'bg-blue-100 text-blue-800 border border-blue-300'}">${isNpc ? 'Creature' : 'Character'}</span>
                    ${status}
                </div>
                <div class="text-xs text-amber-700">${v.sub}</div>
                ${!isNpc && pcOf(p) ? `<div class="flex flex-wrap gap-1 mt-1 items-center">${conditionBadges(pcOf(p))}${condInit(p) ? `<span class="text-xs text-amber-800">init ${formatMod(condInit(p))}</span>` : ''}<button onclick="showConditionModal('${p.charId}')" class="text-xs text-purple-800 underline"><i class="fas fa-plus"></i> condition</button></div>` : ''}
                <div class="flex flex-wrap gap-3 text-sm mt-1">
                    <span title="Hit Dice"><b>HD</b> ${v.hd}</span>
                    <span><b>AC</b> ${v.ac}</span>
                    <span><b>THAC0</b> ${v.thac0}</span>
                    ${actionHtml(p)}
                    <span title="Other initiative modifier (surprise, haste, situational...)"><b>Mod</b> <input type="number" value="${p.initMod || 0}" class="input-fantasy w-12 text-center px-1 py-0 text-sm" onchange="setInitMod('${p.key}', this.value)"></span>
                    ${isNpc ? `<span><b>XP</b> <input type="number" value="${p.xp || 0}" class="input-fantasy w-16 text-center px-1 py-0 text-sm" onchange="setXp('${p.key}', this.value)"></span>` : ''}
                </div>
            </div>
            <div class="w-full sm:w-64">
                <div class="flex justify-between text-sm"><b>HP</b><span class="hp-text">${v.hp} / ${v.maxHp}</span></div>
                <div class="hp-bar my-1"><div class="hp-fill" style="width:${pct}%"></div></div>
                <div class="flex gap-1 flex-wrap">
                    <button onclick="adjustHP('${p.key}', -5)" class="btn-galactic px-2 py-1 rounded text-xs">−5</button>
                    <button onclick="adjustHP('${p.key}', -1)" class="btn-galactic px-2 py-1 rounded text-xs">−1</button>
                    <input type="number" id="amt_${p.key}" placeholder="±" class="input-fantasy w-14 text-center px-1 py-0 text-sm" onkeydown="if(event.key==='Enter'){adjustHP('${p.key}', -Math.abs(parseInt(this.value)||0)); this.value='';}">
                    <button onclick="const el=$('amt_${p.key}'); adjustHP('${p.key}', -Math.abs(parseInt(el.value)||0)); el.value='';" class="btn-danger px-2 py-1 rounded text-xs" title="Damage"><i class="fas fa-burst"></i></button>
                    <button onclick="const el=$('amt_${p.key}'); adjustHP('${p.key}', Math.abs(parseInt(el.value)||0)); el.value='';" class="btn-fantasy px-2 py-1 rounded text-xs" title="Heal"><i class="fas fa-heart"></i></button>
                    <button onclick="adjustHP('${p.key}', 1)" class="btn-fantasy px-2 py-1 rounded text-xs">+1</button>
                    <button onclick="adjustHP('${p.key}', 5)" class="btn-fantasy px-2 py-1 rounded text-xs">+5</button>
                </div>
                ${isNpc ? `<div class="mt-1 text-xs flex items-center gap-1">Killed by
                    <select class="input-fantasy text-xs px-1 py-0" onchange="setCredit('${p.key}', this.value)">
                        <option value="">— party —</option>
                        ${pcs.map(c => `<option value="${c.id}" ${p.creditCharId === c.id ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('')}
                    </select></div>` : ''}
            </div>
            <div class="flex sm:flex-col gap-1">
                ${isNpc ? `<button onclick="toggleDefeated('${p.key}')" class="btn-galactic px-2 py-1 rounded text-xs" title="${p.defeated ? 'Undo defeat' : 'Mark defeated'}"><i class="fas ${p.defeated ? 'fa-undo' : 'fa-skull'}"></i></button>` : `<button onclick="loadCharacter('${p.charId}')" class="btn-galactic px-2 py-1 rounded text-xs" title="Open sheet"><i class="fas fa-scroll"></i></button>`}
                <button onclick="removeCombatant('${p.key}')" class="btn-danger px-2 py-1 rounded text-xs" title="Remove from battle"><i class="fas fa-times"></i></button>
            </div>
        </div>
    </div>`;
}

function actionHtml(p) {
    if (p.kind !== 'pc') return `<span title="Speed factor of the creature's attack (0 for natural attacks)"><b>SF</b> <input type="number" value="${p.speed || 0}" class="input-fantasy w-12 text-center px-1 py-0 text-sm" onchange="setSpeed('${p.key}', this.value)"></span>`;
    const c = pcOf(p);
    const ch = actionChoices(c);
    const cur = p.action || (defaultAction(c) ? defaultAction(c).id : 'other');
    const groups = ['Weapons', 'Spells'].map(g => {
        const list = ch.filter(x => x.group === g);
        return list.length ? `<optgroup label="${g}">${list.map(x => `<option value="${escapeHtml(x.id)}" ${x.id === cur ? 'selected' : ''}>${escapeHtml(x.label)} (SF ${escapeHtml(String(x.sfLabel || x.sf))})</option>`).join('')}</optgroup>` : '';
    }).join('');
    return `<span class="flex items-center gap-1 max-w-full" title="What the character does this round: its speed factor is added to initiative">
        <b>Action</b>
        <select class="input-fantasy text-xs px-1 py-0 max-w-[11rem]" onchange="setAction('${p.key}', this.value)" aria-label="Action">
            ${groups}<option value="other" ${cur === 'other' ? 'selected' : ''}>Other / move (SF 0)</option>
        </select>
        <span class="text-xs px-1 rounded bg-amber-200 border border-amber-400" title="Speed factor">SF ${speedOf(p)}</span></span>`;
}

/* ---------- actions ---------- */
function rollInit(key) {
    const p = Battle.participants.find(x => x.key === key); if (!p) return;
    p.init = initRoll(p);
    saveBattle(); render();
}
function rollAllInitiative() {
    Battle.participants.forEach(p => { if (!(p.kind === 'npc' && p.defeated)) p.init = initRoll(p); });
    Battle.turnKey = null;
    saveBattle(); render();
    toast('Initiative rolled: lowest goes first');
}
function setInit(key, v) { const p = Battle.participants.find(x => x.key === key); if (!p) return; p.init = v === '' ? null : parseInt(v); saveBattle(); render(); }
function setInitMod(key, v) { const p = Battle.participants.find(x => x.key === key); if (!p) return; p.initMod = parseInt(v) || 0; saveBattle(); }
function setXp(key, v) { const p = Battle.participants.find(x => x.key === key); if (!p) return; p.xp = parseInt(v) || 0; saveBattle(); if (p.killLogId) updateKillLog(p); }
function setCredit(key, charId) { const p = Battle.participants.find(x => x.key === key); if (!p) return; p.creditCharId = charId || null; saveBattle(); if (p.killLogId) updateKillLog(p); }

function nextTurn() {
    let list = activeParticipants();
    if (!list.length) return;
    if (list.some(p => p.init == null)) { rollAllInitiative(); list = activeParticipants(); }
    const idx = list.findIndex(p => p.key === Battle.turnKey);
    if (idx === -1) { Battle.turnKey = list[0].key; }
    else if (idx + 1 < list.length) { Battle.turnKey = list[idx + 1].key; }
    else {
        // New round
        Battle.round = (Battle.round || 1) + 1;
        if (Battle.rerollEachRound) Battle.participants.forEach(p => { if (!(p.kind === 'npc' && p.defeated)) p.init = initRoll(p); });
        Battle.turnKey = activeParticipants()[0].key;
        toast(`Round ${Battle.round}${Battle.rerollEachRound ? ': initiative re-rolled' : ''}`);
    }
    saveBattle(); render();
}

function adjustHP(key, delta) {
    if (!delta) return;
    const p = Battle.participants.find(x => x.key === key); if (!p) return;
    if (p.kind === 'pc') {
        const c = pcOf(p); if (!c) return;
        c.hp = Math.min(c.maxHp || 0, (c.hp ?? 0) + delta);
        Storage.save();                       // goes to the character sheet: the player sees it live
    } else {
        p.hp = Math.max(0, Math.min(p.maxHp, p.hp + delta));
        if (p.hp <= 0 && !p.defeated) markDefeated(p);
        else if (p.hp > 0 && p.defeated) undoDefeat(p);
        saveBattle();
    }
    render();
}

function markDefeated(p) {
    p.defeated = true;
    if (!p.creditCharId) {
        const cur = Battle.participants.find(x => x.key === Battle.turnKey);
        if (cur && cur.kind === 'pc') p.creditCharId = cur.charId;
    }
    const credit = State.characters.find(c => c.id === p.creditCharId);
    logCampaignEvent('kill', { creature: p.name, hd: p.hd || '', xp: p.xp || 0, creditCharId: p.creditCharId || null, creditName: credit ? credit.name : null, round: Battle.round })
        .then(id => { if (id) { p.killLogId = id; saveBattle(); } });
    toast(`${p.name} defeated${p.xp ? ` (+${p.xp} XP logged)` : ''}`);
}
function undoDefeat(p) {
    p.defeated = false;
    if (p.killLogId) { fs.collection('campaigns').doc(State.campaignId).collection('log').doc(p.killLogId).delete().catch(() => {}); p.killLogId = null; }
}
function toggleDefeated(key) {
    const p = Battle.participants.find(x => x.key === key); if (!p) return;
    if (p.defeated) { undoDefeat(p); if (p.hp <= 0) p.hp = 1; }
    else { if (p.hp > 0) p.hp = 0; markDefeated(p); }
    saveBattle(); render();
}
function updateKillLog(p) {
    const credit = State.characters.find(c => c.id === p.creditCharId);
    fs.collection('campaigns').doc(State.campaignId).collection('log').doc(p.killLogId)
        .update({ xp: p.xp || 0, creditCharId: p.creditCharId || null, creditName: credit ? credit.name : null }).catch(() => {});
}
function removeCombatant(key) {
    Battle.participants = Battle.participants.filter(x => x.key !== key);
    if (Battle.turnKey === key) Battle.turnKey = null;
    saveBattle(); render();
}
function endBattle() {
    const kills = Battle.participants.filter(p => p.kind === 'npc' && p.defeated);
    const xp = kills.reduce((n, p) => n + (p.xp || 0), 0);
    if (!confirm(`End the battle? ${kills.length} creature(s) defeated, ${xp} XP logged for the Stats & XP page.`)) return;
    Battle = { round: 1, turnKey: null, rerollEachRound: Battle.rerollEachRound, participants: [] };
    saveBattle(); render();
    toast('Battle ended. Give out XP on the Stats & XP page.');
}

/* ---------- add combatants ---------- */
function showAddCombatants() {
    const inBattle = new Set(Battle.participants.filter(p => p.kind === 'pc').map(p => p.charId));
    const pcs = State.characters.filter(c => c.campaignId === State.campaignId);
    const monsters = Object.keys(DB.monsters || {}).sort();
    $('modalContainer').innerHTML = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal-content wide" onclick="event.stopPropagation()">
                <div class="p-6">
                    <h2 class="fantasy-font text-xl font-bold text-amber-900 mb-3">Add Combatants</h2>
                    <div class="section-header"><i class="fas fa-users"></i>Party characters</div>
                    <div class="grid-2 gap-2 mb-2">
                        ${pcs.length ? pcs.map(c => `<label class="flex items-center gap-2 p-2 rounded border border-amber-300 bg-amber-50 cursor-pointer ${inBattle.has(c.id) ? 'opacity-50' : ''}">
                            <input type="checkbox" name="addPc" value="${c.id}" ${inBattle.has(c.id) ? 'disabled' : 'checked'} class="accent-amber-700">
                            <span class="text-sm"><b>${escapeHtml(c.name)}</b> <span class="text-amber-700">${c.class} ${c.level} · HP ${c.hp}/${c.maxHp}</span>${inBattle.has(c.id) ? ' (already in)' : ''}</span></label>`).join('')
                          : '<p class="text-sm italic text-amber-700">No characters in this campaign.</p>'}
                    </div>
                    <div class="section-header mt-4"><i class="fas fa-paw"></i>Your bestiary</div>
                    <div class="space-y-1 mb-2 max-h-40 overflow-y-auto">
                        ${(State.creatures || []).length ? State.creatures.map(c => `<div class="flex items-center gap-2 p-1 rounded border border-amber-200 bg-amber-50">
                            <span class="flex-1 text-sm"><b>${escapeHtml(c.name)}</b> <span class="text-amber-700">AC ${c.ac} · HP ${c.maxHp} · THAC0 ${c.thac0}</span></span>
                            <input type="number" min="0" value="0" data-creature="${c.id}" class="input-fantasy w-16 text-center px-1 py-0" aria-label="How many">
                        </div>`).join('') : '<p class="text-sm italic text-amber-700">No custom creatures (add them in the Bestiary).</p>'}
                    </div>
                    <div class="section-header mt-4"><i class="fas fa-dragon"></i>Monster Manual</div>
                    <div class="flex flex-wrap gap-2 items-center">
                        <select id="mmMonster" class="input-fantasy flex-1 min-w-[180px] px-2 py-1">
                            <option value="">Choose a monster…</option>
                            ${monsters.map(m => `<option value="${escapeHtml(m)}">${escapeHtml(m)} (HD ${DB.monsters[m].hd}, ${DB.monsters[m].xp || 0} XP)</option>`).join('')}
                        </select>
                        <input id="mmQty" type="number" min="1" value="1" class="input-fantasy w-16 text-center px-1 py-1" aria-label="How many">
                        <select id="mmHp" class="input-fantasy px-2 py-1"><option value="roll">Roll HP</option><option value="avg">Average HP</option></select>
                    </div>
                    <div class="flex justify-end gap-2 mt-5">
                        <button onclick="closeModal()" class="btn-galactic px-4 py-2 rounded">Cancel</button>
                        <button onclick="addCombatants()" class="btn-fantasy px-4 py-2 rounded"><i class="fas fa-plus mr-1"></i>Add to battle</button>
                    </div>
                </div>
            </div>
        </div>`;
}

function addCombatants() {
    let added = 0;
    document.querySelectorAll('input[name="addPc"]:checked').forEach(cb => {
        const c = State.characters.find(x => x.id === cb.value); if (!c) return;
        // AD&D 2e initiative: d10 + speed factor of the weapon/spell used (+ other modifiers in "Mod")
        Battle.participants.push({ key: newKey(), kind: 'pc', charId: c.id, name: c.name, init: null, initMod: 0 });
        added++;
    });
    const sameNameCount = name => Battle.participants.filter(p => p.kind === 'npc' && p.baseName === name).length;
    document.querySelectorAll('input[data-creature]').forEach(inp => {
        const n = parseInt(inp.value) || 0;
        const c = (State.creatures || []).find(x => x.id === inp.dataset.creature);
        for (let i = 0; i < n && c; i++) {
            const num = sameNameCount(c.name) + 1;
            Battle.participants.push({ key: newKey(), kind: 'npc', baseName: c.name, name: n > 1 || num > 1 ? `${c.name} ${num}` : c.name, source: c.type || 'Bestiary',
                hd: c.hd || '', hp: c.maxHp || c.hp || 1, maxHp: c.maxHp || c.hp || 1, ac: c.ac, thac0: c.thac0, xp: c.xp || 0, init: null, initMod: 0 });
            added++;
        }
    });
    const mm = $('mmMonster').value;
    if (mm) {
        const m = DB.monsters[mm];
        const qty = Math.max(1, parseInt($('mmQty').value) || 1);
        const info = parseMonsterHD(m.hd);
        for (let i = 0; i < qty; i++) {
            const hp = $('mmHp').value === 'avg' ? Math.max(1, calculateMonsterHP(info, Math.max(1, info.count)).avg) : rollMonsterHPValue(m.hd);
            const num = sameNameCount(mm) + 1;
            Battle.participants.push({ key: newKey(), kind: 'npc', baseName: mm, name: qty > 1 || num > 1 ? `${mm} ${num}` : mm, source: m.category || 'Monster',
                hd: m.hd, hp, maxHp: hp, ac: m.ac, thac0: m.thac0, xp: m.xp || 0, init: null, initMod: 0 });
            added++;
        }
    }
    if (!added) return toast('Choose at least one combatant', 'error');
    if (!Battle.startedAt) Battle.startedAt = Date.now();
    saveBattle();
    closeModal();
    render();
    toast(`${added} combatant(s) added`);
}

function render() { renderBattle(document.getElementById('app')); }

bootPage({ campaign: true, dm: true }, async () => {
    await subscribeBattle();
    renderBattle(document.getElementById('app'));
});

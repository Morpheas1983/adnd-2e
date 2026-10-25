/* stats.js - Campaign statistics (creatures defeated, spells cast) and XP awards for the DM */
let statsFilter = 'open';     // 'open' = not yet awarded, 'all' = everything
const XP_RATES_KEY = 'adnd2e_xpRates';
// Optional individual class awards (PHB Table 32). The DM can change the numbers.
let xpRates = (() => { try { return Object.assign({ useClass: true, warriorPerHD: 10, wizardPerLevel: 50, priestPerLevel: 100, roguePerLevel: 0 }, JSON.parse(localStorage.getItem(XP_RATES_KEY) || '{}')); } catch (e) { return { useClass: true, warriorPerHD: 10, wizardPerLevel: 50, priestPerLevel: 100, roguePerLevel: 0 }; } })();
let awardSelection = null;    // Set of charIds receiving XP
let extraXP = {};             // charId -> extra XP typed by the DM

function hdCount(hd) { const m = String(hd || '').match(/^(\d+)/); return m ? parseInt(m[1]) : 1; }

function statsEntries() { return campaignLog.filter(e => statsFilter === 'all' || !e.awarded); }

function computeAwards() {
    const entries = campaignLog.filter(e => !e.awarded);
    const kills = entries.filter(e => e.type === 'kill');
    const spells = entries.filter(e => e.type === 'spell');
    const pcs = State.characters.filter(c => c.campaignId === State.campaignId);
    if (!awardSelection) awardSelection = new Set(pcs.filter(c => (c.hp ?? 1) > -10).map(c => c.id));
    const receivers = pcs.filter(c => awardSelection.has(c.id));
    // Personal entries (other XP given to one character) go to that character only; everything else is shared
    const personal = kills.filter(e => e.isNote && e.creditCharId);
    const killXP = kills.filter(e => !(e.isNote && e.creditCharId)).reduce((n, e) => n + (e.xp || 0), 0);
    const share = receivers.length ? Math.floor(killXP / receivers.length) : 0;
    const rows = pcs.map(c => {
        const g = classGroup(c.class);
        let classXP = 0; const why = [];
        if (xpRates.useClass && awardSelection.has(c.id)) {
            if (g === 'warrior') {
                const hd = kills.filter(e => e.creditCharId === c.id && !e.isNote).reduce((n, e) => n + hdCount(e.hd), 0);
                if (hd) { classXP += hd * xpRates.warriorPerHD; why.push(`${hd} HD defeated × ${xpRates.warriorPerHD}`); }
            }
            const lv = spells.filter(e => e.charId === c.id).reduce((n, e) => n + (e.level || 0), 0);
            const rate = g === 'wizard' ? xpRates.wizardPerLevel : g === 'priest' ? xpRates.priestPerLevel : g === 'rogue' ? xpRates.roguePerLevel : 0;
            if (lv && rate) { classXP += lv * rate; why.push(`${lv} spell level(s) × ${rate}`); }
        }
        const own = personal.filter(e => e.creditCharId === c.id).reduce((n, e) => n + (e.xp || 0), 0);
        if (own && awardSelection.has(c.id)) { classXP += own; why.push(`${own} personal XP`); }
        const extra = parseInt(extraXP[c.id]) || 0;
        const on = awardSelection.has(c.id);
        return { c, on, share: on ? share : 0, classXP, why, extra, total: on ? share + classXP + extra : 0 };
    });
    return { kills, spells, killXP, share, rows, entries };
}

function renderStats(container) {
    const list = statsEntries();
    const kills = list.filter(e => e.type === 'kill' && !e.isNote);
    const spells = list.filter(e => e.type === 'spell');
    const awards = campaignLog.filter(e => e.type === 'xp');
    const totalAwarded = awards.reduce((n, e) => n + (e.awards || []).reduce((m, a) => m + (a.xp || 0), 0), 0);

    // creatures grouped
    const byCreature = {};
    kills.forEach(e => {
        const k = (e.creature || 'Creature').replace(/ \d+$/, '');
        byCreature[k] = byCreature[k] || { name: k, count: 0, xp: 0, by: {} };
        byCreature[k].count++; byCreature[k].xp += e.xp || 0;
        const who = e.creditName || 'Party'; byCreature[k].by[who] = (byCreature[k].by[who] || 0) + 1;
    });
    // spells grouped by caster
    const byCaster = {};
    spells.forEach(e => {
        const k = e.charName || 'Unknown';
        byCaster[k] = byCaster[k] || { name: k, count: 0, levels: 0, spells: {} };
        byCaster[k].count++; byCaster[k].levels += e.level || 0;
        byCaster[k].spells[e.spell] = (byCaster[k].spells[e.spell] || 0) + 1;
    });
    const a = computeAwards();
    const totalToGive = a.rows.reduce((n, r) => n + r.total, 0);

    container.innerHTML = `
        <div class="min-h-screen p-4">
            <div class="max-w-6xl mx-auto">
                <div class="parchment scroll-border p-4 mb-4 fade-in">
                    <div class="flex justify-between items-center flex-wrap gap-3">
                        <div class="flex items-center gap-3">
                            <button onclick="changeView('dm_view')" class="btn-galactic px-3 py-2 rounded text-sm"><i class="fas fa-arrow-left"></i> Party</button>
                            <h1 class="fantasy-font text-2xl font-bold text-amber-900"><i class="fas fa-chart-bar mr-2 text-amber-700"></i>Campaign Stats & XP</h1>
                        </div>
                        <div class="flex flex-wrap gap-2 items-center">
                            <select class="input-fantasy text-sm px-2 py-1" onchange="statsFilter=this.value; render();">
                                <option value="open" ${statsFilter === 'open' ? 'selected' : ''}>Since last XP award</option>
                                <option value="all" ${statsFilter === 'all' ? 'selected' : ''}>Whole campaign</option>
                            </select>
                            <button onclick="changeView('battle')" class="btn-fantasy px-3 py-2 rounded text-sm"><i class="fas fa-khanda mr-1"></i>Battle</button>
                            <button onclick="showLogEntryModal()" class="btn-galactic px-3 py-2 rounded text-sm"><i class="fas fa-plus mr-1"></i>Log entry</button>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    ${statCard('fa-skull', 'Creatures defeated', kills.length)}
                    ${statCard('fa-coins', 'XP from creatures', kills.reduce((n, e) => n + (e.xp || 0), 0))}
                    ${statCard('fa-hat-wizard', 'Spells cast', spells.length)}
                    ${statCard('fa-trophy', 'XP awarded (total)', totalAwarded)}
                </div>

                <div class="grid-2 gap-4 mb-4">
                    <div class="parchment scroll-border p-4 fade-in">
                        <div class="section-header"><i class="fas fa-skull"></i>Creatures defeated</div>
                        ${Object.values(byCreature).length ? `<table class="w-full text-sm"><thead><tr class="text-left text-amber-800"><th>Creature</th><th class="text-center">#</th><th class="text-right">XP</th></tr></thead><tbody>
                            ${Object.values(byCreature).sort((x, y) => y.xp - x.xp).map(g => `<tr class="border-t border-amber-200"><td class="py-1"><b>${escapeHtml(g.name)}</b><div class="text-xs text-amber-700">${Object.entries(g.by).map(([w, n]) => `${escapeHtml(w)} ×${n}`).join(', ')}</div></td><td class="text-center">${g.count}</td><td class="text-right">${g.xp}</td></tr>`).join('')}
                        </tbody></table>` : '<p class="text-sm italic text-amber-700">None yet. Creatures defeated in a Battle are logged here automatically.</p>'}
                    </div>
                    <div class="parchment scroll-border p-4 fade-in">
                        <div class="section-header"><i class="fas fa-hat-wizard"></i>Spells cast</div>
                        ${Object.values(byCaster).length ? Object.values(byCaster).map(g => `<div class="border-t border-amber-200 py-1 text-sm"><div class="flex justify-between"><b>${escapeHtml(g.name)}</b><span>${g.count} spell(s), ${g.levels} level(s)</span></div>
                            <div class="text-xs text-amber-700">${Object.entries(g.spells).map(([s, n]) => `${escapeHtml(s)}${n > 1 ? ' ×' + n : ''}`).join(', ')}</div></div>`).join('')
                          : '<p class="text-sm italic text-amber-700">None yet. Spells players cast from their sheets are logged here automatically.</p>'}
                    </div>
                </div>

                <div class="parchment scroll-border p-4 mb-4 fade-in">
                    <div class="section-header"><i class="fas fa-trophy"></i>Give XP</div>
                    <p class="text-sm text-amber-800 mb-2">Uses everything not yet awarded: <b>${a.killXP} XP</b> from ${a.kills.length} creature(s)/entries is shared equally between the ticked characters (${a.share} each).</p>
                    <div class="flex flex-wrap items-center gap-3 text-sm mb-3 p-2 rounded bg-amber-50 border border-amber-300">
                        <label class="flex items-center gap-1 cursor-pointer"><input type="checkbox" class="accent-amber-700" ${xpRates.useClass ? 'checked' : ''} onchange="setRate('useClass', this.checked)">Class awards (PHB, optional):</label>
                        <span>Warrior <input type="number" value="${xpRates.warriorPerHD}" class="input-fantasy w-14 px-1 py-0 text-center" onchange="setRate('warriorPerHD', this.value)"> /HD defeated</span>
                        <span>Wizard <input type="number" value="${xpRates.wizardPerLevel}" class="input-fantasy w-14 px-1 py-0 text-center" onchange="setRate('wizardPerLevel', this.value)"> /spell level</span>
                        <span>Priest <input type="number" value="${xpRates.priestPerLevel}" class="input-fantasy w-14 px-1 py-0 text-center" onchange="setRate('priestPerLevel', this.value)"> /spell level</span>
                        <span>Rogue <input type="number" value="${xpRates.roguePerLevel}" class="input-fantasy w-14 px-1 py-0 text-center" onchange="setRate('roguePerLevel', this.value)"> /spell level</span>
                    </div>
                    <div class="overflow-x-auto">
                    <table class="w-full text-sm min-w-[520px]">
                        <thead><tr class="text-left text-amber-800"><th></th><th>Character</th><th class="text-right">Share</th><th class="text-right">Class</th><th class="text-right">Extra</th><th class="text-right">Total</th><th class="text-right">XP now</th></tr></thead>
                        <tbody>
                        ${a.rows.map(r => `<tr class="border-t border-amber-200 ${r.on ? '' : 'opacity-50'}">
                            <td><input type="checkbox" class="accent-amber-700" ${r.on ? 'checked' : ''} onchange="toggleAwardee('${r.c.id}', this.checked)" aria-label="Receives XP"></td>
                            <td class="py-1"><b>${escapeHtml(r.c.name)}</b> <span class="text-xs text-amber-700">${r.c.class} ${r.c.level}</span>${r.why.length ? `<div class="text-xs text-amber-700">${r.why.join('; ')}</div>` : ''}</td>
                            <td class="text-right">${r.share}</td>
                            <td class="text-right">${r.classXP}</td>
                            <td class="text-right"><input type="number" value="${extraXP[r.c.id] || ''}" placeholder="0" class="input-fantasy w-20 px-1 py-0 text-right" onchange="extraXP['${r.c.id}']=this.value; render();" aria-label="Extra XP"></td>
                            <td class="text-right font-bold">${r.total}</td>
                            <td class="text-right text-amber-700">${r.c.xp || 0}</td>
                        </tr>`).join('')}
                        </tbody>
                    </table>
                    </div>
                    <div class="flex justify-end mt-3">
                        <button onclick="awardXP()" class="btn-fantasy px-5 py-2 rounded" ${totalToGive ? '' : 'disabled'}><i class="fas fa-trophy mr-1"></i>Give ${totalToGive} XP</button>
                    </div>
                </div>

                <div class="parchment scroll-border p-4 mb-4 fade-in">
                    <div class="section-header"><i class="fas fa-history"></i>Log ${statsFilter === 'open' ? '(not yet awarded)' : ''}</div>
                    <div class="space-y-1 max-h-96 overflow-y-auto">
                        ${(statsFilter === 'all' ? campaignLog : campaignLog.filter(e => !e.awarded || e.type === 'xp')).map(logLine).join('') || '<p class="text-sm italic text-amber-700">Nothing logged yet.</p>'}
                    </div>
                </div>
            </div>
        </div>`;
}

function statCard(icon, label, value) {
    return `<div class="parchment scroll-border p-3 text-center fade-in"><i class="fas ${icon} text-amber-700"></i><div class="fantasy-font text-2xl font-bold text-amber-900">${value}</div><div class="text-xs text-amber-700">${label}</div></div>`;
}

function logLine(e) {
    const when = e.at ? new Date(e.at).toLocaleString() : '';
    let text = '';
    if (e.type === 'kill' && e.isNote) text = `<i class="fas fa-sticky-note mr-1"></i>${escapeHtml(e.creature)}${e.creditName ? ` (${escapeHtml(e.creditName)})` : ''} · ${e.xp || 0} XP`;
    else if (e.type === 'kill') text = `<i class="fas fa-skull mr-1"></i><b>${escapeHtml(e.creature)}</b> defeated${e.creditName ? ` by ${escapeHtml(e.creditName)}` : ''} · ${e.xp || 0} XP${e.hd ? ` · HD ${escapeHtml(e.hd)}` : ''}`;
    else if (e.type === 'spell') text = `<i class="fas fa-hat-wizard mr-1"></i><b>${escapeHtml(e.charName)}</b> cast ${escapeHtml(e.spell)} (level ${e.level})${e.target ? ` on ${escapeHtml(e.target)}` : ''}`;
    else if (e.type === 'xp') text = `<i class="fas fa-trophy mr-1"></i>XP given: ${(e.awards || []).map(a => `${escapeHtml(a.name)} +${a.xp}`).join(', ')}`;
    else text = `<i class="fas fa-sticky-note mr-1"></i>${escapeHtml(e.note || '')}${e.xp ? ` · ${e.xp} XP` : ''}`;
    return `<div class="flex justify-between items-center gap-2 text-sm p-2 rounded ${e.awarded && e.type !== 'xp' ? 'bg-gray-100 text-gray-500' : 'bg-amber-50'} border border-amber-200">
        <span>${text}${e.awarded && e.type !== 'xp' ? ' <span class="text-xs">(awarded)</span>' : ''}</span>
        <span class="flex items-center gap-2 whitespace-nowrap"><span class="text-xs text-amber-700">${when}</span>
        <button onclick="deleteLogEntry('${e.id}')" class="text-red-700 text-xs" title="Delete"><i class="fas fa-trash"></i></button></span></div>`;
}

function setRate(k, v) { xpRates[k] = k === 'useClass' ? v : (parseInt(v) || 0); try { localStorage.setItem(XP_RATES_KEY, JSON.stringify(xpRates)); } catch (e) {} render(); }
function toggleAwardee(id, on) { on ? awardSelection.add(id) : awardSelection.delete(id); render(); }

async function awardXP() {
    const a = computeAwards();
    const rows = a.rows.filter(r => r.total);
    if (!rows.length) return;
    if (!confirm(`Give XP?\n\n${rows.map(r => `${r.c.name}: +${r.total}`).join('\n')}`)) return;
    rows.forEach(r => { r.c.xp = (r.c.xp || 0) + r.total; });
    Storage.save();     // characters update live on the players' sheets
    const base = fs.collection('campaigns').doc(State.campaignId).collection('log');
    const ids = a.entries.filter(e => e.type !== 'xp').map(e => e.id);
    try {
        for (let i = 0; i < ids.length; i += 400) {
            const batch = fs.batch();
            ids.slice(i, i + 400).forEach(id => batch.update(base.doc(id), { awarded: true }));
            await batch.commit();
        }
        await logCampaignEvent('xp', { awards: rows.map(r => ({ charId: r.c.id, name: r.c.name, xp: r.total })), awarded: true });
        extraXP = {};
        toast('XP given! Players see it on their sheets.');
    } catch (err) { reportWriteError('the log')(err); }
}

async function deleteLogEntry(id) {
    if (!confirm('Delete this log entry?')) return;
    try { await fs.collection('campaigns').doc(State.campaignId).collection('log').doc(id).delete(); }
    catch (err) { reportWriteError('the log')(err); }
}

function showLogEntryModal() {
    const pcs = State.characters.filter(c => c.campaignId === State.campaignId);
    $('modalContainer').innerHTML = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal-content" onclick="event.stopPropagation()">
                <div class="p-6">
                    <h2 class="fantasy-font text-xl font-bold text-amber-900 mb-3">Add Log Entry</h2>
                    <div class="space-y-3">
                        <div><label class="block text-sm font-bold text-amber-900 mb-1">Type</label>
                            <select id="leType" class="input-fantasy w-full px-3 py-2" onchange="$('leKill').classList.toggle('hidden', this.value!=='kill'); $('leNote').classList.toggle('hidden', this.value!=='note');">
                                <option value="kill">Creature defeated</option><option value="note">Other XP (quest, treasure, role-play)</option>
                            </select></div>
                        <div id="leKill" class="grid-2 gap-2">
                            <input id="leCreature" class="input-fantasy px-3 py-2" placeholder="Creature (e.g. Orc)">
                            <input id="leHD" class="input-fantasy px-3 py-2" placeholder="HD (e.g. 1)">
                        </div>
                        <div id="leNote" class="hidden"><input id="leText" class="input-fantasy w-full px-3 py-2" placeholder="What happened?"></div>
                        <div class="grid-2 gap-2">
                            <input id="leXP" type="number" class="input-fantasy px-3 py-2" placeholder="XP">
                            <select id="leChar" class="input-fantasy px-3 py-2"><option value="">Whole party</option>${pcs.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('')}</select>
                        </div>
                    </div>
                    <div class="flex justify-end gap-2 mt-4">
                        <button onclick="closeModal()" class="btn-galactic px-4 py-2 rounded">Cancel</button>
                        <button onclick="saveLogEntry()" class="btn-fantasy px-4 py-2 rounded">Add</button>
                    </div>
                </div>
            </div>
        </div>`;
}

async function saveLogEntry() {
    const type = $('leType').value;
    const xp = parseInt($('leXP').value) || 0;
    const ch = State.characters.find(c => c.id === $('leChar').value);
    if (type === 'kill') {
        const creature = $('leCreature').value.trim();
        if (!creature) return toast('Enter the creature', 'error');
        await logCampaignEvent('kill', { creature, hd: $('leHD').value.trim(), xp, creditCharId: ch ? ch.id : null, creditName: ch ? ch.name : null });
    } else {
        const note = $('leText').value.trim();
        if (!note) return toast('Describe the entry', 'error');
        // "Other XP" for one character goes into their Extra; for the party it is shared like creature XP
        await logCampaignEvent('kill', { creature: note, hd: '', xp, creditCharId: ch ? ch.id : null, creditName: ch ? ch.name : null, isNote: true });
    }
    closeModal();
    toast('Logged');
}

function render() { renderStats(document.getElementById('app')); }

bootPage({ campaign: true, dm: true }, () => {
    subscribeCampaignLog(() => safeRender());
    renderStats(document.getElementById('app'));
});

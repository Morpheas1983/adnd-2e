/* sheet.js - Character Sheet View */
function renderEquippedGear(char) {
    const weapons = char.inventory?.filter(i => i.equipped && i.type === 'weapon') || [];
    const armor = char.inventory?.find(i => i.equipped && i.type === 'armor');
    const shield = char.inventory?.find(i => i.equipped && i.type === 'shield');
    const otherProtection = char.inventory?.filter(i => 
        i.equipped && 
        i.type !== 'armor' && 
        i.type !== 'shield' && 
        i.type !== 'weapon' && 
        (i.bonusAC || 0) !== 0
    ) || [];
    const strMod = getModifier(getModifiedStat(char, 'str'));
    const dexAdj = dexDefenseAdj(getModifiedStat(char, 'dex'));   // PHB Table 2 defensive adjustment
    const thac0 = getTHAC0(char.class, char.level);
    const effectMods = getEffectMods(char);

    let html = '<div class="grid-2 gap-3">';

    // WEAPONS - show ALL equipped weapons
    if (weapons.length > 0) {
        weapons.forEach((weapon, idx) => {
            const a = weaponAttackInfo(char, weapon);
            const effTHAC0 = a.effTHAC0;
            const effDmgMod = a.dmgMod;
            const dmgText = effDmgMod > 0 ? `+${effDmgMod}` : (effDmgMod < 0 ? `${effDmgMod}` : '');
            const parts = [`Base ${a.baseThac0}`];
            if (weapon.bonusAttack) parts.push(`Magic ${formatMod(weapon.bonusAttack)}`);
            if (a.strMod) parts.push(`Str ${formatMod(a.strMod)}`);
            if (a.specHit) parts.push(`Spec +1`);
            if (a.nonProfPenalty) parts.push(`Not proficient ${a.nonProfPenalty}`);
            if (a.effHit) parts.push(`Effects ${formatMod(a.effHit)}`);
            html += `
                <div class="bg-amber-100 rounded p-3 border ${a.proficient ? 'border-amber-300' : 'border-red-400'}">
                    <div class="text-xs text-amber-700 uppercase tracking-wide">Equipped Weapon${weapons.length > 1 ? ' #' + (idx+1) : ''}</div>
                    <div class="font-bold text-amber-900 text-lg">${weapon.name}</div>
                    <div class="text-xs mt-1">
                        ${a.specialized ? `<span class="item-bonus"><i class="fas fa-star mr-1"></i>Specialized (${a.prof})</span>`
                          : a.proficient ? `<span class="text-green-800"><i class="fas fa-check mr-1"></i>Proficient (${a.prof})</span>`
                          : `<span class="text-red-700 font-bold"><i class="fas fa-exclamation-triangle mr-1"></i>Not proficient${a.prof ? ` in ${a.prof}` : ''}: ${a.nonProfPenalty} to hit</span>`}
                    </div>
                    <div class="text-sm mt-1">
                        <span class="font-bold">Effective THAC0:</span> ${effTHAC0} 
                        <span class="text-xs text-amber-600">(${parts.join(', ')})</span>
                    </div>
                    <div class="text-sm">
                        <span class="font-bold">Damage:</span> ${weapon.damage || weapon.damage_sm || '?'} ${dmgText}${a.specDmg ? ' <span class="text-xs text-amber-600">(incl. spec +2)</span>' : ''}
                    </div>
                    <div class="text-sm"><span class="font-bold">Attacks/round:</span> ${a.attacks}</div>
                    <div class="text-sm"><span class="font-bold">Speed factor:</span> ${weaponSpeed(weapon)}${dbWeapon(weapon) && weaponSpeed(weapon) !== dbWeapon(weapon).speed ? ` <span class="text-xs text-amber-600">(PHB ${dbWeapon(weapon).speed})</span>` : ''}
                        ${canWriteChar(char) ? `<button onclick="showEditItemModal(${(char.inventory || []).indexOf(weapon)})" class="text-xs text-blue-700 underline ml-1" title="Change speed factor"><i class="fas fa-edit"></i></button>` : ''}</div>
                    ${weapon.special ? `<div class="text-xs text-blue-700 mt-1 font-italic"><i class="fas fa-star mr-1"></i>${weapon.special}</div>` : ''}
                </div>`;
        });
    } else {
        html += `
            <div class="bg-amber-100 rounded p-3 border border-amber-300 opacity-70">
                <div class="text-xs text-amber-700 uppercase tracking-wide">Equipped Weapon</div>
                <div class="text-sm text-amber-800 italic">No weapon equipped</div>
                <div class="text-sm">Unarmed damage: 1d2 ${formatMod(strMod)}</div>
            </div>`;
    }

    // PROTECTION - show all protection items and total AC
    if (armor || shield || otherProtection.length > 0) {
        let acHtml = '';
        let totalReduction = 0;

        if (armor) {
            const armorVal = armor.ac - (armor.bonusAC || 0);
            acHtml += `<div class="mb-1">
                <div class="font-bold text-amber-900">${armor.name}</div>
                <div class="text-xs text-amber-700">Base AC ${armor.ac}${armor.bonusAC ? ` <span class="item-bonus">- ${armor.bonusAC}</span>` : ''} = Effective ${armorVal}</div>
            </div>`;
            totalReduction += (10 - armorVal);
        }
        if (shield) {
            const shieldBonus = (shield.ac_bonus || 1) + (shield.bonusAC || 0);
            acHtml += `<div class="mb-1">
                <div class="font-bold text-amber-900">${shield.name}</div>
                <div class="text-xs text-amber-700">AC Bonus: ${shieldBonus}</div>
            </div>`;
            totalReduction += shieldBonus;
        }
        otherProtection.forEach(item => {
            acHtml += `<div class="mb-1">
                <div class="font-bold text-amber-900">${item.name}</div>
                <div class="text-xs text-amber-700">AC Bonus: ${item.bonusAC}</div>
            </div>`;
            totalReduction += item.bonusAC;
        });
        if (dexAdj !== 0) {
            acHtml += `<div class="text-xs text-amber-700"><span class="font-bold">DEX defensive adjustment:</span> ${formatMod(dexAdj)}</div>`;
        }

        html += `
            <div class="bg-amber-100 rounded p-3 border border-amber-300">
                <div class="text-xs text-amber-700 uppercase tracking-wide">Equipped Protection</div>
                <div class="mt-2 space-y-1">${acHtml}</div>
                <div class="border-t border-amber-300 mt-2 pt-2 text-sm font-bold">
                    Total AC: ${calcAC(char)}
                </div>
                <div class="text-xs text-amber-600 mt-1">Base 10 - ${totalReduction} protection${dexAdj ? ` ${formatMod(dexAdj)} DEX` : ''}${(getEffectMods(char).ac || 0) ? ` ${formatMod(getEffectMods(char).ac)} effects` : ''} = ${calcAC(char)}</div>
            </div>`;
    } else {
        html += `
            <div class="bg-amber-100 rounded p-3 border border-amber-300 opacity-70">
                <div class="text-xs text-amber-700 uppercase tracking-wide">Equipped Protection</div>
                <div class="text-sm text-amber-800 italic">No armor or shield</div>
                <div class="text-sm">Base AC 10${dexAdj ? ` ${formatMod(dexAdj)} DEX (defensive adj.)` : ''} = ${calcAC(char)}</div>
            </div>`;
    }
    html += '</div>';
    return html;
}

function renderSheet(container) {
    const char = State.currentCharacter;
    if (!char) return changeView('dashboard');
    const stats = char.stats || {};
    const mods = {
        str: getModifier(stats.str || 10), dex: getModifier(stats.dex || 10), con: getModifier(stats.con || 10),
        int: getModifier(stats.int || 10), wis: getModifier(stats.wis || 10), cha: getModifier(stats.cha || 10)
    };
    const kitMech = getKitMechanic(char);
    const effectiveStats = {};
    const effectiveMods = {};
    ['str','dex','con','int','wis','cha'].forEach(s => {
        effectiveStats[s] = getModifiedStat(char, s);
        effectiveMods[s] = getModifier(effectiveStats[s]);
    });
    const isCaster = ['Mage','Specialist Wizard','Cleric','Druid','Paladin','Ranger','Bard'].includes(char.class);
    const profSum = charProfSummary(char);
    const wpCount = (char.weaponProfs || []).length;
    const nwpCount = (char.nonweaponProfs || []).length;

    container.innerHTML = `
        <div class="min-h-screen p-4">
            <div class="max-w-6xl mx-auto">
                <div class="parchment scroll-border p-4 mb-4 fade-in">
                    <div class="flex justify-between items-center flex-wrap gap-2">
                        <div class="flex items-center gap-3">
                            <button onclick="goBack()" class="btn-galactic px-3 py-2 rounded text-sm">
                                <i class="fas fa-arrow-left"></i>
                            </button>
                            <div>
                                <h1 class="fantasy-font text-2xl font-bold text-amber-900">${char.name}</h1>
                                <p class="text-sm text-amber-800">${char.race} ${char.kit !== 'None' ? char.kit : char.class} • ${char.alignment} • Level ${char.level}</p>
                                ${char.campaignId && char.campaignId !== 'default' ? `<p class="text-xs text-amber-700 mt-1"><i class="fas fa-campground mr-1"></i>Campaign: <span class="font-bold text-amber-900">${escapeHtml(campaignNameById(char.campaignId) || 'Campaign')}</span>${char.campaignId !== State.campaignId && Cloud.campaigns.some(c => c.id === char.campaignId) ? ` <button onclick="switchCampaign('${char.campaignId}')" class="text-blue-700 hover:text-blue-900 underline ml-1 cursor-pointer">Switch to this campaign</button>` : ''}</p>` : '<p class="text-xs text-amber-700 mt-1">Solo character (not in a campaign)</p>'}
                            ${char.player === State.currentUser ? `
                            <div class="mt-2 flex items-center gap-2">
                                <span class="text-xs text-amber-800">Move to:</span>
                                <select id="moveCampaign" class="input-fantasy text-xs px-2 py-1" style="min-width:140px">
                                    <option value="">-- Select --</option>
                                    ${char.campaignId && char.campaignId !== 'default' ? '<option value="default">Solo (no campaign)</option>' : ''}
                                    ${Cloud.campaigns.filter(c => c.role && c.id !== char.campaignId).map(c => `<option value="${c.id}">${escapeHtml(c.name)}${c.role === 'admin' ? ' (you will join as player)' : c.role === 'dm' ? ' (DM)' : ''}</option>`).join('')}
                                </select>
                                <button onclick="changeCharacterCampaign('${char.id}', $('moveCampaign').value)" class="btn-fantasy px-2 py-1 rounded text-xs" title="Move"><i class="fas fa-exchange-alt"></i></button>
                            </div>
                            <button onclick="joinCampaignFromSheet()" class="text-xs text-amber-700 underline mt-1"><i class="fas fa-key mr-1"></i>Campaign not listed? Join with invite code</button>` : `<p class="text-xs text-amber-700 mt-1"><i class="fas fa-user mr-1"></i>Player: ${escapeHtml(char.playerName || memberName(char.player))}</p>`}
                            </div>
                        </div>
                        <div class="flex gap-2 flex-wrap">
                            <button onclick="changeView('campaign')" class="btn-fantasy px-3 py-2 rounded text-sm">
                                <i class="fas fa-book mr-1"></i>Campaign
                            </button>
                            ${isCaster ? `
                                <button onclick="changeView('spells')" class="btn-magic px-3 py-2 rounded text-sm">
                                    <i class="fas fa-hat-wizard mr-1"></i>Spells
                                </button>
                            ` : ''}
                            <button onclick="changeView('inventory')" class="btn-fantasy px-3 py-2 rounded text-sm">
                                <i class="fas fa-backpack mr-1"></i>Inventory
                            </button>
                            <button onclick="changeView('levelup')" class="btn-fantasy px-3 py-2 rounded text-sm">
                                <i class="fas fa-level-up-alt mr-1"></i>Level Up
                            </button>
                            <button onclick="showManageProfsModal()" class="btn-galactic px-3 py-2 rounded text-sm">
                                <i class="fas fa-shield-alt mr-1"></i>Profs
                            </button>
                            <button onclick="showEditLevelModal()" class="btn-galactic px-3 py-2 rounded text-sm">
                                <i class="fas fa-edit mr-1"></i>Edit Level
                            </button>
                            <button onclick="showChangeClassModal()" class="btn-galactic px-3 py-2 rounded text-sm">
                                <i class="fas fa-exchange-alt mr-1"></i>Change Class
                            </button>
                            ${kitMech ? `
                            <button onclick="activateKitMechanic()" class="btn-kit px-3 py-2 rounded text-sm" ${!kitMech.canActivate ? 'disabled' : ''}>
                                <i class="fas fa-fire mr-1"></i>${kitMech.name}
                            </button>
                            ` : ''}
                            <button onclick="endTurn(State.currentCharacter)" class="btn-galactic px-3 py-2 rounded text-sm">
                                <i class="fas fa-hourglass-end mr-1"></i>End Turn
                            </button>
                            <button onclick="restCharacter(State.currentCharacter)" class="btn-fantasy px-3 py-2 rounded text-sm">
                                <i class="fas fa-bed mr-1"></i>Rest
                            </button>
                            <button onclick="saveCharacter()" class="btn-galactic px-3 py-2 rounded text-sm">
                                <i class="fas fa-save mr-1"></i>Save
                            </button>
                            <button onclick="showDeleteConfirmModal()" class="btn-danger px-3 py-2 rounded text-sm">
                                <i class="fas fa-trash mr-1"></i>Delete
                            </button>
                        </div>
                    </div>
                </div>
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div class="lg:col-span-1 space-y-4">
                        <div class="parchment scroll-border p-4 fade-in">
                            <div class="section-header"><i class="fas fa-dumbbell"></i>Ability Scores</div>
                            <div class="grid grid-cols-2 gap-3">
                                ${['str','dex','con','int','wis','cha'].map(s => {
                                    const baseVal = stats[s] || 10;
                                    const effVal = effectiveStats[s];
                                    const isModified = effVal !== baseVal;
                                    const bd = formatEffectBreakdown(getEffectBreakdown(char, s));
                                    return `
                                    <div class="stat-box p-2 ${isModified ? 'stat-modified' : ''}">
                                        <div class="stat-label">${s.toUpperCase()}</div>
                                        <div class="stat-value ${isModified ? 'text-amber-700' : ''}">${effVal}${isModified ? `<span class="text-xs ml-1 opacity-70">(${baseVal})</span>` : ''}</div>
                                        ${s === 'dex'
                                            ? `<div class="stat-mod" title="PHB defensive adjustment (AC) and missile attack adjustment">AC ${formatMod(dexDefenseAdj(effVal))} · Missile ${formatMod(dexReactionAdj(effVal))}</div>`
                                            : `<div class="stat-mod">${formatMod(effectiveMods[s])}</div>`}
                                        ${bd ? `<div class="text-xs text-amber-800 font-bold mt-1">${bd}</div>` : ''}
                                    </div>
                                `}).join('')}
                            </div>
                        </div>
                        <div class="parchment scroll-border p-4 fade-in">
                            <div class="section-header"><i class="fas fa-heart"></i>Hit Points</div>
                            <div class="flex items-center gap-4 mb-2">
                                <div class="flex-1">
                                    <div class="flex justify-between text-sm mb-1">
                                        <span class="text-amber-900 font-bold">HP: ${char.hp}/${char.maxHp}</span>
                                        <span class="text-amber-700">${Math.round((char.hp/char.maxHp)*100)}%</span>
                                    </div>
                                    <div class="hp-bar">
                                        <div class="hp-fill" style="width: ${Math.max(0, Math.min(100, (char.hp/char.maxHp)*100))}%"></div>
                                    </div>
                                </div>
                            </div>
                            <div class="flex gap-2 mt-3 items-center flex-wrap">
                                <button onclick="adjustHP(-1)" class="btn-galactic px-3 py-1 rounded text-xs">-1</button>
                                <button onclick="adjustHP(-5)" class="btn-galactic px-3 py-1 rounded text-xs">-5</button>
                                <input type="number" id="hpAdjust" class="input-fantasy w-16 px-2 py-1 text-center text-sm" value="0" placeholder="Amt">
                                <button onclick="adjustHPFromInput()" class="btn-fantasy px-2 py-1 rounded text-xs" title="Apply Custom"><i class="fas fa-check"></i></button>
                                <button onclick="adjustHP(5)" class="btn-fantasy px-3 py-1 rounded text-xs">+5</button>
                                <button onclick="adjustHP(1)" class="btn-fantasy px-3 py-1 rounded text-xs">+1</button>
                            </div>
                        </div>
                        <div class="parchment scroll-border p-4 fade-in">
                            <div class="section-header"><i class="fas fa-star"></i>Experience</div>
                            <div class="flex justify-between text-sm mb-1">
                                <span class="text-amber-900">Level ${char.level}</span>
                                <span class="text-amber-700">${char.xp} / ${getNextXP(char.class, char.level)} XP</span>
                            </div>
                            <div class="xp-bar mb-2">
                                <div class="xp-fill" style="width: ${Math.min(((char.xp || 0)/getNextXP(char.class, char.level || 1))*100, 100)}%"></div>
                            </div>
                            <div class="flex gap-2">
                                <input type="number" id="xpAdd" class="input-fantasy flex-1 px-3 py-2 text-sm" placeholder="Add XP...">
                                <button onclick="addXP()" class="btn-fantasy px-4 py-2 rounded text-sm">Add</button>
                            </div>
                        </div>
                        <div class="parchment scroll-border p-4 fade-in">
                            <div class="section-header"><i class="fas fa-bolt"></i>Active Effects</div>
                            ${(char.activeEffects || []).length === 0 && (char.conditions || []).length === 0 ? '<p class="text-amber-700 italic text-sm">No active effects.</p>' : ''}
                            <div class="space-y-2">
                                ${(char.activeEffects || []).map(e => `
                                    <div class="effect-card p-3 rounded border border-amber-300 bg-amber-50">
                                        <div class="flex justify-between items-start">
                                            <div class="flex items-center gap-2">
                                                <i class="fas fa-bolt text-amber-700"></i>
                                                <span class="font-bold text-amber-900">${e.name}</span>
                                                <span class="text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded">${e.duration} ${e.durationType} left</span>
                                            </div>
                                            <button onclick="removeEffect(State.currentCharacter, '${e.name}'); render();" class="text-red-700 hover:text-red-900" title="Remove effect">
                                                <i class="fas fa-times"></i>
                                            </button>
                                        </div>
                                        <div class="text-sm text-amber-800 mt-1">${e.description || ''}</div>
                                        ${(() => {
                                            const modParts = [];
                                            if (e.mods) {
                                                const modLabels = { str: 'STR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'WIS', cha: 'CHA', ac: 'AC', thac0: 'THAC0', damage: 'Dmg', saves: 'Saves' };
                                                Object.keys(e.mods).forEach(k => {
                                                    if (e.mods[k] !== 0) {
                                                        const sign = e.mods[k] > 0 ? '+' : '';
                                                        modParts.push(`${modLabels[k] || k}: ${sign}${e.mods[k]}`);
                                                    }
                                                });
                                            }
                                            return modParts.length > 0 ? `<div class="text-xs text-amber-700 mt-1 font-mono">${modParts.join(' | ')}</div>` : '';
                                        })()}
                                    </div>
                                `).join('')}
                                ${(char.conditions || []).map(c => `
                                    <div class="condition-card p-2 rounded border border-red-300 bg-red-50">
                                        <div class="flex items-center gap-2">
                                            <i class="fas fa-skull-crossbones text-red-700"></i>
                                            <span class="font-bold text-red-900">${c}</span>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        <div class="parchment scroll-border p-4 fade-in">
                            <div class="section-header"><i class="fas fa-coins"></i>Wealth</div>
                            <div class="grid grid-cols-2 gap-2 text-sm">
                                <div class="flex justify-between bg-amber-100 rounded p-2">
                                    <span>PP:</span><input type="number" class="bg-transparent w-16 text-right font-bold" value="${char.wealth?.pp || 0}" onchange="updateWealth('pp', this.value)">
                                </div>
                                <div class="flex justify-between bg-amber-100 rounded p-2">
                                    <span>GP:</span><input type="number" class="bg-transparent w-16 text-right font-bold" value="${char.wealth?.gp || 0}" onchange="updateWealth('gp', this.value)">
                                </div>
                                <div class="flex justify-between bg-amber-100 rounded p-2">
                                    <span>EP:</span><input type="number" class="bg-transparent w-16 text-right font-bold" value="${char.wealth?.ep || 0}" onchange="updateWealth('ep', this.value)">
                                </div>
                                <div class="flex justify-between bg-amber-100 rounded p-2">
                                    <span>SP:</span><input type="number" class="bg-transparent w-16 text-right font-bold" value="${char.wealth?.sp || 0}" onchange="updateWealth('sp', this.value)">
                                </div>
                                <div class="flex justify-between bg-amber-100 rounded p-2">
                                    <span>CP:</span><input type="number" class="bg-transparent w-16 text-right font-bold" value="${char.wealth?.cp || 0}" onchange="updateWealth('cp', this.value)">
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="lg:col-span-2 space-y-4">
                        <div class="parchment scroll-border p-4 fade-in">
                            <div class="section-header"><i class="fas fa-shield-alt"></i>Combat</div>
                            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div class="saving-throw-box">
                                    <div class="value">${calcAC(char)}</div>
                                    <div class="label">Armor Class</div>
                                    <div class="text-xs text-amber-600 mt-1" style="line-height:1.2">${getACBreakdown(char)}</div>
                                    ${(() => { const bd = formatEffectBreakdown(getEffectBreakdown(char, 'ac')); return bd ? `<div class="text-xs text-red-700 font-bold mt-1">${bd}</div>` : ''; })()}
                                </div>
                                <div class="saving-throw-box">
                                    <div class="value">${calcTHAC0(char)}</div>
                                    <div class="label">THAC0</div>
                                    ${(() => { const w = (char.inventory || []).find(i => i.equipped && i.type === 'weapon'); return `<div class="text-xs text-amber-600 mt-1" style="line-height:1.2">${w ? `with ${escapeHtml(w.name)} · ` : ''}base ${getTHAC0(char.class, char.level)}</div>`; })()}
                                    ${(() => { const bd = formatEffectBreakdown(getEffectBreakdown(char, 'thac0')); return bd ? `<div class="text-xs text-green-700 font-bold mt-1">${bd}</div>` : ''; })()}
                                </div>
                                <div class="saving-throw-box">
                                    <div class="value">${effectiveMods.str}</div>
                                    <div class="label">Hit Mod</div>
                                    ${(() => { const bd = formatEffectBreakdown(getEffectBreakdown(char, 'str')); return bd ? `<div class="text-xs text-green-700 font-bold mt-1">${bd}</div>` : ''; })()}
                                </div>
                                <div class="saving-throw-box">
                                    <div class="value">${effectiveMods.dex}</div>
                                    <div class="label">Init Mod</div>
                                    ${(() => { const bd = formatEffectBreakdown(getEffectBreakdown(char, 'dex')); return bd ? `<div class="text-xs text-green-700 font-bold mt-1">${bd}</div>` : ''; })()}
                                </div>
                            </div>
                        </div>

                        <div class="parchment scroll-border p-4 fade-in">
                            <div class="section-header"><i class="fas fa-hand-fist"></i>Active Combat Gear</div>
                            ${renderEquippedGear(char)}
                        </div>
                        ${isCaster ? `
                        <div class="parchment scroll-border p-4 fade-in">
                            <div class="section-header"><i class="fas fa-hat-wizard"></i>Spell Slots</div>
                            <div class="flex justify-between items-center mb-2">
                                <span class="text-xs text-amber-700">${char.class} Level ${char.level} (${getCasterType(char.class) === 'wizard' ? 'Wizard' : 'Priest'} casting)</span>
                                <button onclick="restSpells()" class="btn-magic px-3 py-1 rounded text-xs" title="Restore all spell slots after rest">
                                    <i class="fas fa-bed mr-1"></i>Rest & Restore
                                </button>
                            </div>
                            <div class="space-y-3">
                                ${spellSlotsFor(char).slots.map((slots, idx) => {
                                    const level = idx + 1;
                                    const used = (char.usedSpellSlots || {})[level] || 0;
                                    const available = slots - used;
                                    const pct = slots > 0 ? (available / slots) * 100 : 0;
                                    const levelSpells = (char.preparedSpells || []).filter(name => {
                                        const allSpells = getAvailableSpells(char);
                                        const sp = allSpells.find(s => s.name === name);
                                        return sp && sp.level === level;
                                    });
                                    return `
                                        <div class="bg-amber-100 rounded border border-amber-300 p-2">
                                            <div class="flex items-center gap-3 mb-2">
                                                <div class="text-center min-w-[60px]">
                                                    <div class="text-xs text-amber-700 font-bold">Level ${level}</div>
                                                    <div class="text-lg font-bold ${available === 0 ? 'text-red-700' : 'text-amber-900'}">${available} <span class="text-xs font-normal">of ${slots}</span></div>
                                                    <div class="text-xs text-amber-600">${used > 0 ? used + ' used' : 'Ready'}</div>
                                                    <div class="hp-bar mt-1" style="height:4px">
                                                        <div class="hp-fill" style="width: ${pct}%; ${available === 0 ? 'background:#991b1b' : 'background:linear-gradient(90deg, #d4af37, #fbbf24)'}"></div>
                                                    </div>
                                                </div>
                                                <div class="flex-1">
                                                    ${levelSpells.length === 0 ? '<span class="text-xs text-amber-600 italic">No prepared spells</span>' : ''}
                                                    <div class="flex flex-wrap gap-1">
                                                        ${levelSpells.map(name => `
                                                            <div class="flex items-center gap-1 mb-1">
                                                                <button onclick="castSpell('${name}', ${level})" 
                                                                    class="btn-fantasy px-2 py-1 rounded text-xs ${available === 0 ? 'opacity-50 cursor-not-allowed' : ''}" 
                                                                    ${available === 0 ? 'disabled' : ''}
                                                                    title="Cast ${name}">
                                                                    <i class="fas fa-fire mr-1"></i>${name}
                                                                </button>
                                                                <button onclick="showSpellDetail('${name}')" title="Details / change speed factor">${speedBadge(spellSpeed(char, name))}</button>
                                                                ${available > 0 && isSpellTargetable(name) ? `
                                                                <button onclick="showSpellTargetModal('${name}', ${level})" 
                                                                    class="btn-magic px-2 py-1 rounded text-xs" title="Cast on another">
                                                                    <i class="fas fa-user-friends"></i>
                                                                </button>
                                                                ` : ''}
                                                            </div>
                                                        `).join('')}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                            ${!spellSlotsFor(char).slots.length ? '<p class="text-xs text-amber-700 italic mt-2">No spell slots at this level yet.</p>' : ''}
                        </div>
                        ` : ''}

                        <div class="parchment scroll-border p-4 fade-in" id="savesPanel">
                            ${renderSavesPanel(char)}
                        </div>
                        <div class="parchment scroll-border p-4 fade-in" id="profPanel">
                            ${renderProfPanel(char, profSum)}
                        </div>
                        ${char.class === 'Thief' || char.class === 'Bard' ? `
                        <div class="parchment scroll-border p-4 fade-in">
                            <div class="section-header"><i class="fas fa-mask"></i>Thieving Skills</div>
                            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                                ${DB.thieving_skills.map(s => `
                                    <div class="saving-throw-box">
                                        <div class="value">${(char.thiefSkills?.[s.name] || s.base)}%</div>
                                        <div class="label">${s.name}</div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        ` : ''}
                        ${magicAccess(char) ? `
                        <div class="parchment scroll-border p-4 fade-in">
                            <div class="section-header justify-between"><span><i class="fas fa-hat-wizard mr-2"></i>${magicAccess(char).kind === 'wizard' ? 'Schools of Magic' : 'Spheres of Influence'}</span>
                                ${canWriteChar(char) ? `<button onclick="showMagicAccessModal()" class="btn-galactic px-2 py-1 rounded text-xs normal-case"><i class="fas fa-edit mr-1"></i>Change</button>` : ''}</div>
                            ${magicAccessHtml(char)}
                        </div>
                        ` : ''}
                        <div class="parchment scroll-border p-4 fade-in">
                            <div class="section-header"><i class="fas fa-scroll"></i>Character Details</div>
                            <div class="grid-2 gap-4 text-sm">
                                <div><strong>Age:</strong> ${char.age || '?'}</div>
                                <div><strong>Height:</strong> ${char.height || '?'}</div>
                                <div><strong>Weight:</strong> ${char.weight || '?'}</div>
                                <div><strong>Hair:</strong> ${char.hair || '?'}</div>
                                <div><strong>Eyes:</strong> ${char.eyes || '?'}</div>
                                <div><strong>Deity:</strong> ${char.deity || 'None'}</div>
                            </div>
                            <div class="mt-3 p-3 bg-amber-100 rounded text-sm text-amber-900">
                                <strong>Background:</strong><br>
                                ${char.background || 'No background written yet.'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function adjustHP(amount) {
    const char = State.currentCharacter;
    if (!char) return;
    char.hp = Math.max(0, Math.min(char.maxHp, char.hp + amount));
    Storage.save();
    render();
}

function adjustHPFromInput() {
    const input = $('hpAdjust');
    const val = parseInt(input.value) || 0;
    if (val === 0) return;
    adjustHP(val);
    input.value = 0;
}

function addXP() {
    const input = $('xpAdd');
    const val = parseInt(input.value) || 0;
    if (val <= 0) return;
    State.currentCharacter.xp = (State.currentCharacter.xp || 0) + val;
    input.value = '';
    Storage.save();
    render();
    toast(`Added ${val} XP!`);
}

function updateWealth(type, val) {
    State.currentCharacter.wealth = State.currentCharacter.wealth || {};
    State.currentCharacter.wealth[type] = parseInt(val) || 0;
    Storage.save();
}

function saveCharacter() {
    Storage.save();
    toast('Character saved!');
}

function recalcHPForLevel() {
    const char = State.currentCharacter;
    const newLevel = parseInt($('editLevelValue').value) || char.level;
    const cls = DB.classes[char.class];
    const conMod = getModifier(char.stats?.con || 10);
    let total = 0;
    for (let i = 1; i <= newLevel; i++) {
        total += Math.max(1, rollDie(cls.hd) + conMod);
    }
    $('editHPValue').value = total;
    toast(`Calculated ${total} HP for level ${newLevel}`);
}

function confirmEditLevel() {
    const char = State.currentCharacter;
    const newLevel = parseInt($('editLevelValue').value);
    if (newLevel < 1 || newLevel > 20) return toast('Level must be between 1 and 20', 'error');
    const newHP = parseInt($('editHPValue').value);
    if (newHP < 1) return toast('HP must be at least 1', 'error');

    char.level = newLevel;
    char.xp = getXPForLevel(char.class, newLevel);
    char.maxHp = newHP;
    char.hp = Math.min(char.hp, char.maxHp);
    char.lastUpdated = Date.now();

    Storage.save();
    closeModal();
    render();
    toast(`Level updated to ${newLevel}, HP set to ${newHP}!`);
}



async function changeCharacterCampaign(charId, newCampaignId) {
    if (!newCampaignId) return toast('Please select a campaign', 'error');
    const char = State.characters.find(c => c.id === charId);
    if (!char) return toast('Character not found', 'error');
    const camp = Cloud.campaigns.find(c => c.id === newCampaignId);
    if (camp && camp.role === 'admin') {
        // Admin moving a character into a campaign they are not in yet: join it as a player first
        try {
            const uid = State.currentUser;
            await fs.collection('campaigns').doc(newCampaignId).update({
                ['members.' + uid]: 'player',
                memberUids: firebase.firestore.FieldValue.arrayUnion(uid),
                ['memberNames.' + uid]: State.currentUserName
            });
            camp.role = 'player';
        } catch (err) {
            console.error(err);
            return toast('Could not join that campaign.', 'error');
        }
    }
    char.campaignId = newCampaignId;
    Storage.save();
    toast(`${char.name} moved to ${newCampaignId === 'default' ? 'Solo play' : campaignNameById(newCampaignId)}`);
    render();
}

function joinCampaignFromSheet() {
    const code = prompt('Enter the invite code of the campaign (the campaign\'s DM finds it on the Players page):');
    if (code) joinCampaign(code);
}

function confirmChangeClass() {
    const char = State.currentCharacter;
    const newClass = document.querySelector('input[name="newClass"]:checked')?.value;
    if (!newClass || newClass === char.class) {
        closeModal();
        return;
    }

    char.class = newClass;
    char.kit = 'None';
    char.knownSpells = [];
    char.preparedSpells = [];
    char.usedSpellSlots = {};
    char.selectedSchools = [];
    char.selectedSpheres = [];

    if (newClass === 'Thief' || newClass === 'Bard') {
        char.thiefSkills = {};
        DB.thieving_skills.forEach(s => char.thiefSkills[s.name] = s.base);
    } else {
        char.thiefSkills = {};
    }

    char.lastUpdated = Date.now();
    Storage.save();
    closeModal();
    render();
    toast(`Class changed to ${newClass}!`);
}

function deleteCharacter() {
    const char = State.currentCharacter;
    if (!char) return;

    const idx = State.characters.findIndex(c => c.id === char.id);
    if (idx > -1) {
        State.characters.splice(idx, 1);
        State.currentCharacter = null;
        Storage.save();
        closeModal();
        changeView('dashboard');
        toast(`Character "${char.name}" has been deleted.`, 'success');
    }
}

function activateKitMechanic() {
    const mech = getKitMechanic(State.currentCharacter);
    if (mech && mech.canActivate) mech.action();
}

function render() { renderSheet(document.getElementById('app')); }

/* Init */
bootPage({ character: true }, () => renderSheet(document.getElementById('app')));

/* ---------- Proficiencies panel on the character sheet ---------- */
function uriArg(s) { return encodeURIComponent(s).replace(/'/g, '%27'); }
function renderProfPanel(char, profSum) {
    const edit = canWriteChar(char);
    const equipped = (char.inventory || []).filter(i => i.equipped && i.type === 'weapon');
    const chip = (label, x) => `<span class="text-xs px-2 py-1 rounded border ${x.left < 0 ? 'bg-red-100 text-red-800 border-red-300' : x.left > 0 ? 'bg-amber-100 text-amber-900 border-amber-400' : 'bg-green-100 text-green-800 border-green-300'}">${label}: <b>${x.used}/${x.total}</b> slots</span>`;
    const free = [profSum.weapon.left > 0 ? `${profSum.weapon.left} weapon` : '', profSum.nonweapon.left > 0 ? `${profSum.nonweapon.left} non-weapon` : ''].filter(Boolean).join(' and ');
    const wps = char.weaponProfs || [];
    const nwps = char.nonweaponProfs || [];
    const unarmedUse = equipped.filter(w => !wps.includes(weaponProfFor(w)));
    return `
        <div class="section-header justify-between flex-wrap gap-2">
            <span><i class="fas fa-fist-raised mr-2"></i>Proficiencies</span>
            <span class="flex gap-2 flex-wrap normal-case">
                ${chip('Weapon', profSum.weapon)} ${chip('Non-weapon', profSum.nonweapon)}
            </span>
        </div>
        ${edit ? `<div class="flex flex-wrap gap-2 mb-3">
            <button onclick="showManageProfsModal()" class="btn-fantasy px-3 py-1 rounded text-xs"><i class="fas fa-plus mr-1"></i>Add / change</button>
            <button onclick="showManageProfsModal('nonweapon')" class="btn-galactic px-3 py-1 rounded text-xs"><i class="fas fa-pen-fancy mr-1"></i>Create new proficiency</button>
        </div>` : ''}
        ${free && edit ? `<div class="mb-3 p-2 rounded bg-amber-100 border border-amber-400 text-sm text-amber-900"><i class="fas fa-info-circle mr-1"></i>You have ${free} slot(s) free. Use <b>Add / change</b> to learn new proficiencies.</div>` : ''}
        ${profSum.weapon.left < 0 || profSum.nonweapon.left < 0 ? `<div class="mb-3 p-2 rounded bg-red-50 border border-red-300 text-sm text-red-800"><i class="fas fa-exclamation-triangle mr-1"></i>More proficiencies than slots${canOverrideProfLimits() ? ' (allowed because you are the DM)' : ': ask your DM'}.</div>` : ''}
        <div class="grid-2 gap-4">
            <div>
                <h4 class="font-bold text-amber-900 text-sm mb-2"><i class="fas fa-khanda mr-1"></i>Weapon proficiencies</h4>
                <div class="space-y-1">
                    ${wps.map(p => {
                        const spec = (char.weaponSpecs || []).includes(p) && canSpecialize(char.class);
                        const using = equipped.filter(w => weaponProfFor(w) === p).map(w => w.name);
                        return `<div class="flex items-center justify-between gap-2 text-sm bg-amber-50 border border-amber-200 rounded px-2 py-1">
                            <span class="text-amber-900"><b>${escapeHtml(p)}</b>${isCustomProf('weapon', p) ? ' <span class="text-[10px] px-1 rounded bg-purple-100 text-purple-800 border border-purple-300">custom</span>' : ''}
                                ${spec ? '<span class="text-xs item-bonus ml-1"><i class="fas fa-star"></i> Specialized +1 hit / +2 dmg</span>' : ''}
                                ${using.length ? `<div class="text-xs text-green-800"><i class="fas fa-check mr-1"></i>${using.map(escapeHtml).join(', ')} equipped</div>` : ''}</span>
                            ${edit ? `<button onclick="removeProf('weapon', decodeURIComponent('${uriArg(p)}'))" class="text-red-700 hover:text-red-900 px-1" title="Forget this proficiency"><i class="fas fa-times"></i></button>` : ''}
                        </div>`; }).join('') || '<p class="text-sm italic text-amber-700">None yet</p>'}
                </div>
                <p class="text-xs mt-2 ${unarmedUse.length ? 'text-red-700 font-bold' : 'text-amber-700'}">${unarmedUse.length ? `<i class="fas fa-exclamation-triangle mr-1"></i>Not proficient with ${unarmedUse.map(w => escapeHtml(w.name)).join(', ')}: ${profSum.penalty} to hit` : `Weapons without proficiency: ${profSum.penalty} to hit`}</p>
            </div>
            <div>
                <h4 class="font-bold text-amber-900 text-sm mb-2"><i class="fas fa-tools mr-1"></i>Non-weapon proficiencies</h4>
                <div class="space-y-1">
                    ${nwps.map(p => { const info = nwpInfo(p); const sc = nwpCheckScore(char, p); const cost = nwpCost(char.class, p); return `
                    <div class="flex items-center justify-between gap-2 text-sm bg-amber-50 border border-amber-200 rounded px-2 py-1">
                        <span class="text-amber-900"><b>${escapeHtml(p)}</b>${isCustomProf('nonweapon', p) ? ' <span class="text-[10px] px-1 rounded bg-purple-100 text-purple-800 border border-purple-300">custom</span>' : ''}
                            <div class="text-xs text-amber-700">${info.ability !== 'N/A' ? `${info.ability} ${getModifiedStat(char, info.ability.toLowerCase())} ${formatMod(info.mod)}` : 'No roll needed'} · ${cost === 0 ? 'free' : cost + ' slot' + (cost > 1 ? 's' : '')}</div></span>
                        <span class="flex items-center gap-1">
                            ${sc === null ? '' : `<button onclick="rollProficiencyCheck(decodeURIComponent('${uriArg(p)}'))" class="text-xs px-2 py-1 rounded bg-amber-700 text-amber-50 whitespace-nowrap" title="Roll d20: succeed on ${sc} or less"><i class="fas fa-dice-d20 mr-1"></i>${sc}</button>`}
                            ${edit ? `<button onclick="removeProf('nonweapon', decodeURIComponent('${uriArg(p)}'))" class="text-red-700 hover:text-red-900 px-1" title="Forget this proficiency"><i class="fas fa-times"></i></button>` : ''}
                        </span>
                    </div>`; }).join('') || '<p class="text-sm italic text-amber-700">None yet</p>'}
                </div>
                <p class="text-xs text-amber-700 mt-2">Check: roll d20, equal or under the number succeeds (20 always fails).</p>
            </div>
        </div>`;
}

function removeProf(kind, name) {
    const char = State.currentCharacter;
    if (!char || !canWriteChar(char)) return;
    if ((FREE_NWP[char.class] || []).includes(name)) return toast(`${name} is a free class proficiency`, 'error');
    if (!confirm(`Forget the proficiency "${name}"? The slot becomes free again.`)) return;
    if (kind === 'weapon') {
        char.weaponProfs = (char.weaponProfs || []).filter(p => p !== name);
        char.weaponSpecs = (char.weaponSpecs || []).filter(p => p !== name);
    } else {
        char.nonweaponProfs = (char.nonweaponProfs || []).filter(p => p !== name);
    }
    Storage.save();
    render();
    toast(`${name} removed`);
}

/* ---------- Saving throws panel ---------- */
function renderSavesPanel(char) {
    const edit = canWriteChar(char);
    const short = { ppdm: 'PPDM', rsw: 'RSW', pp: 'PP', bw: 'BW', sp: 'SP' };
    return `
        <div class="section-header justify-between"><span><i class="fas fa-dice-d20 mr-2"></i>Saving Throws</span>
            ${edit ? `<button onclick="showSavesModal()" class="btn-fantasy px-3 py-1 rounded text-xs normal-case"><i class="fas fa-pen mr-1"></i>Edit saving throws</button>` : ''}</div>
        ${edit ? '<p class="text-xs text-amber-700 mb-2"><i class="fas fa-hand-pointer mr-1"></i>Tap a saving throw to change it.</p>' : ''}
        <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
            ${SAVE_TYPES.map(t => {
                const d = getSaveDetails(char, t);
                const changed = d.final !== d.base;
                return `
                <div class="saving-throw-box ${edit ? 'cursor-pointer hover:ring-2 hover:ring-amber-500' : ''}" ${edit ? `onclick="showSavesModal('${t}')" title="Change this saving throw"` : ''}>
                    <div class="value ${d.override != null ? 'text-purple-800' : changed ? 'text-green-700' : ''}">${d.final}${changed ? `<span class="text-xs ml-1 opacity-70">(${d.base})</span>` : ''}</div>
                    <div class="label" title="${SAVE_NAMES[t]}">${short[t]}</div>
                    ${d.parts.length ? `<div class="text-[11px] text-green-800 mt-1">${d.parts.map(p => `${escapeHtml(p.label)} ${formatMod(p.value)}`).join(', ')}</div>` : ''}
                    ${d.override != null ? '<div class="text-[11px] text-purple-800 mt-1"><i class="fas fa-lock mr-1"></i>set by hand</div>' : ''}
                    ${d.notes.length ? `<div class="text-[11px] text-amber-700 mt-1">${d.notes.map(escapeHtml).join('; ')}</div>` : ''}
                    <button onclick="event.stopPropagation(); rollSave('${t}')" class="text-xs mt-1 px-2 py-0.5 rounded bg-amber-700 text-amber-50" title="Roll d20: ${d.final} or more saves"><i class="fas fa-dice-d20 mr-1"></i>Roll</button>
                </div>`; }).join('')}
        </div>
        <div class="text-xs text-amber-700 mt-2 text-center">
            Roll d20 equal to or higher than the number. PPDM = Paralyzation/Poison/Death Magic · RSW = Rod/Staff/Wand · PP = Petrification/Polymorph · BW = Breath Weapon · SP = Spell
        </div>`;
}

function rollSave(t) {
    const char = State.currentCharacter;
    const d = getSaveDetails(char, t);
    const r = rollDie(20);
    const ok = r >= d.final;
    toast(`${SAVE_NAMES[t]}: rolled ${r} vs ${d.final}: ${ok ? 'Saved!' : 'Failed'}`, ok ? 'success' : 'error');
}

function showSavesModal(focusType) {
    const char = State.currentCharacter;
    const adj = char.saveAdjust || {}, ov = char.saveOverride || {};
    $('modalContainer').innerHTML = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal-content wide" onclick="event.stopPropagation()">
                <div class="p-6">
                    <h2 class="fantasy-font text-xl font-bold text-amber-900 mb-1">Adjust Saving Throws</h2>
                    <p class="text-sm text-amber-700 mb-3">Base numbers come from the PHB table for a level ${char.level} ${escapeHtml(char.class)}.
                        <b>Adjustment</b> adds a bonus (+) or penalty (−), e.g. +1 for a Ring of Protection +1. <b>Set to</b> replaces the number completely; leave it empty to calculate it.</p>
                    <div class="overflow-x-auto">
                    <table class="w-full text-sm min-w-[520px]">
                        <thead><tr class="text-left text-amber-800"><th>Saving throw</th><th class="text-center">Base</th><th class="text-center">Race/Class/Effects</th><th class="text-center">Adjustment</th><th class="text-center">Set to</th><th class="text-center">Result</th></tr></thead>
                        <tbody>
                        ${SAVE_TYPES.map(t => { const d = getSaveDetails(char, t); const auto = d.parts.filter(p => p.label !== 'Adjustment').reduce((n, p) => n + p.value, 0); return `
                        <tr class="border-t border-amber-200">
                            <td class="py-2"><b>${SAVE_NAMES[t]}</b></td>
                            <td class="text-center">${d.base}</td>
                            <td class="text-center">${auto ? formatMod(auto) : '—'}</td>
                            <td class="text-center"><input type="number" id="sadj_${t}" value="${adj[t] || ''}" placeholder="0" class="input-fantasy w-16 text-center px-1 py-1" oninput="previewSaves()"></td>
                            <td class="text-center"><input type="number" id="sov_${t}" value="${ov[t] ?? ''}" placeholder="auto" min="1" max="20" class="input-fantasy w-16 text-center px-1 py-1" oninput="previewSaves()"></td>
                            <td class="text-center font-bold text-lg" id="sres_${t}">${d.final}</td>
                        </tr>`; }).join('')}
                        </tbody>
                    </table>
                    </div>
                    ${canOverrideProfLimits() && State.campaignId ? `<div class="mt-3 p-2 rounded bg-purple-50 border border-purple-300 text-sm flex flex-wrap items-center justify-between gap-2">
                        <span><i class="fas fa-crown mr-1 text-purple-800"></i>DM: change the base table of the <b>${GROUP_LABEL[classGroup(char.class)]}</b> classes for every level, for the whole campaign.</span>
                        <button onclick="showSaveTableModal('${classGroup(char.class)}')" class="btn-galactic px-3 py-1 rounded text-xs">Edit table</button></div>` : ''}
                    <div class="flex justify-between gap-2 mt-4">
                        <button onclick="SAVE_TYPES.forEach(t => { $('sadj_'+t).value=''; $('sov_'+t).value=''; }); previewSaves();" class="btn-galactic px-4 py-2 rounded text-sm">Clear all</button>
                        <span class="flex gap-2">
                            <button onclick="closeModal()" class="btn-galactic px-4 py-2 rounded text-sm">Cancel</button>
                            <button onclick="saveSaves()" class="btn-fantasy px-4 py-2 rounded text-sm"><i class="fas fa-save mr-1"></i>Save</button>
                        </span>
                    </div>
                </div>
            </div>
        </div>`;
    if (focusType && $('sov_' + focusType)) {
        const row = $('sov_' + focusType).closest('tr');
        row.classList.add('bg-amber-100');
        $('sov_' + focusType).focus();
    }
}

function readSaveInputs() {
    const adjust = {}, override = {};
    SAVE_TYPES.forEach(t => {
        const a = parseInt($('sadj_' + t).value); if (a) adjust[t] = a;
        const o = $('sov_' + t).value.trim(); if (o !== '' && !isNaN(parseInt(o))) override[t] = Math.min(20, Math.max(1, parseInt(o)));
    });
    return { adjust, override };
}
function previewSaves() {
    const char = State.currentCharacter;
    const v = readSaveInputs();
    const tmp = { ...char, saveAdjust: v.adjust, saveOverride: v.override };
    SAVE_TYPES.forEach(t => { $('sres_' + t).textContent = getSaveDetails(tmp, t).final; });
}
function saveSaves() {
    const char = State.currentCharacter;
    const v = readSaveInputs();
    char.saveAdjust = v.adjust;
    char.saveOverride = v.override;
    Storage.save();
    closeModal();
    render();
    toast('Saving throws updated');
}

/* DM: edit a class group's saving throw table for the campaign */
function showSaveTableModal(group) {
    const custom = (State.saveTables || {})[group];
    const rows = (Array.isArray(custom) && custom.length ? custom : SAVE_TABLES[group]).map(r => r.slice());
    const def = SAVE_TABLES[group];
    const rangeLabel = (i) => { const lo = i === 0 ? (group === 'warrior' ? 0 : 1) : def[i - 1][0] + 1; const hi = def[i][0]; return hi >= 99 ? `${lo}+` : lo === hi ? `${lo}` : `${lo}-${hi}`; };
    $('modalContainer').innerHTML = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal-content wide" onclick="event.stopPropagation()">
                <div class="p-6">
                    <h2 class="fantasy-font text-xl font-bold text-amber-900 mb-1">${GROUP_LABEL[group]} saving throw table</h2>
                    <p class="text-sm text-amber-700 mb-3">Applies to every ${group === 'warrior' ? 'Fighter, Paladin and Ranger' : group === 'priest' ? 'Cleric and Druid' : group === 'rogue' ? 'Thief and Bard' : 'Mage and Specialist Wizard'} in this campaign. ${custom ? '<b class="text-purple-800">Currently changed from the PHB.</b>' : 'Currently the PHB values.'}</p>
                    <div class="overflow-x-auto">
                    <table class="w-full text-sm min-w-[480px]">
                        <thead><tr class="text-amber-800"><th class="text-left">Level</th>${SAVE_TYPES.map(t => `<th title="${SAVE_NAMES[t]}">${t.toUpperCase()}</th>`).join('')}</tr></thead>
                        <tbody>
                        ${rows.map((r, i) => `<tr class="border-t border-amber-200"><td class="py-1 font-bold">${rangeLabel(i)}</td>
                            ${SAVE_TYPES.map((t, j) => `<td class="text-center"><input type="number" min="1" max="20" id="st_${i}_${j}" value="${r[j + 1]}" class="input-fantasy w-14 text-center px-1 py-1 ${r[j + 1] !== def[i][j + 1] ? 'bg-purple-100' : ''}"></td>`).join('')}</tr>`).join('')}
                        </tbody>
                    </table>
                    </div>
                    <div class="flex justify-between gap-2 mt-4">
                        <button onclick="saveSaveTable('${group}', true)" class="btn-galactic px-4 py-2 rounded text-sm">Reset to PHB</button>
                        <span class="flex gap-2">
                            <button onclick="showSavesModal()" class="btn-galactic px-4 py-2 rounded text-sm">Back</button>
                            <button onclick="saveSaveTable('${group}', false)" class="btn-fantasy px-4 py-2 rounded text-sm"><i class="fas fa-save mr-1"></i>Save table</button>
                        </span>
                    </div>
                </div>
            </div>
        </div>`;
}

function saveSaveTable(group, reset) {
    State.saveTables = { ...(State.saveTables || {}) };
    if (reset) delete State.saveTables[group];
    else State.saveTables[group] = SAVE_TABLES[group].map((r, i) => [r[0], ...SAVE_TYPES.map((t, j) => Math.min(20, Math.max(1, parseInt($(`st_${i}_${j}`).value) || r[j + 1])))]);
    Storage.save();
    closeModal();
    render();
    toast(reset ? 'Table back to the PHB values' : 'Saving throw table saved for the campaign');
}

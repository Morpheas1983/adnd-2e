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
    const dexMod = getModifier(getModifiedStat(char, 'dex'));
    const thac0 = getTHAC0(char.class, char.level);
    const effectMods = getEffectMods(char);

    let html = '<div class="grid-2 gap-3">';

    // WEAPONS - show ALL equipped weapons
    if (weapons.length > 0) {
        weapons.forEach((weapon, idx) => {
            const effTHAC0 = thac0 - (weapon.bonusAttack || 0) - strMod;
            const effDmgMod = strMod + (weapon.bonusDamage || 0);
            const dmgText = effDmgMod > 0 ? `+${effDmgMod}` : (effDmgMod < 0 ? `${effDmgMod}` : '');
            html += `
                <div class="bg-amber-100 rounded p-3 border border-amber-300">
                    <div class="text-xs text-amber-700 uppercase tracking-wide">Equipped Weapon${weapons.length > 1 ? ' #' + (idx+1) : ''}</div>
                    <div class="font-bold text-amber-900 text-lg">${weapon.name}</div>
                    <div class="text-sm mt-1">
                        <span class="font-bold">Effective THAC0:</span> ${effTHAC0} 
                        <span class="text-xs text-amber-600">(Base ${thac0} - Atk ${weapon.bonusAttack||0} - Str ${strMod})</span>
                    </div>
                    <div class="text-sm">
                        <span class="font-bold">Damage:</span> ${weapon.damage || weapon.damage_sm || '?'} ${dmgText}
                    </div>
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
        if (dexMod !== 0) {
            acHtml += `<div class="text-xs text-amber-700"><span class="font-bold">DEX Modifier:</span> ${formatMod(dexMod)}</div>`;
        }

        html += `
            <div class="bg-amber-100 rounded p-3 border border-amber-300">
                <div class="text-xs text-amber-700 uppercase tracking-wide">Equipped Protection</div>
                <div class="mt-2 space-y-1">${acHtml}</div>
                <div class="border-t border-amber-300 mt-2 pt-2 text-sm font-bold">
                    Total AC: ${calcAC(char)}
                </div>
                <div class="text-xs text-amber-600 mt-1">Base 10 - ${totalReduction + dexMod} protection = ${calcAC(char)}</div>
            </div>`;
    } else {
        html += `
            <div class="bg-amber-100 rounded p-3 border border-amber-300 opacity-70">
                <div class="text-xs text-amber-700 uppercase tracking-wide">Equipped Protection</div>
                <div class="text-sm text-amber-800 italic">No armor or shield</div>
                <div class="text-sm">Base AC 10 - DEX ${formatMod(dexMod)} = ${calcAC(char)}</div>
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
    const expected = getExpectedProfs(char.class, char.level);
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
                                ${char.campaignId && char.campaignId !== 'default' ? `<p class="text-xs text-amber-700 mt-1"><i class="fas fa-campground mr-1"></i>Campaign: <span class="font-bold text-amber-900">${char.campaignId}</span> <button onclick="switchCampaign('${char.campaignId}'); changeView('dashboard');" class="text-blue-700 hover:text-blue-900 underline ml-1 cursor-pointer">Switch to this campaign</button></p>` : '<p class="text-xs text-amber-700 mt-1">Not assigned to a campaign</p>'}
                            <div class="mt-2 flex items-center gap-2">
                                <span class="text-xs text-amber-800">Move to:</span>
                                <select id="moveCampaign" class="input-fantasy text-xs px-2 py-1" style="min-width:120px">
                                    <option value="">-- Select --</option>
                                    <option value="default">Solo Play</option>
                                    ${[...new Set(State.characters.map(c => c.campaignId).filter(Boolean))].filter(id => id !== 'default' && id !== char.campaignId).map(cid => `<option value="${cid}">${cid}</option>`).join('')}
                                </select>
                                <input type="text" id="newCampaignMove" placeholder="New..." class="input-fantasy text-xs px-2 py-1" style="width:80px" onkeydown="if(event.key==='Enter'){changeCharacterCampaign('${char.id}', this.value);this.value='';}">
                                <button onclick="changeCharacterCampaign('${char.id}', $('moveCampaign').value || $('newCampaignMove').value)" class="btn-fantasy px-2 py-1 rounded text-xs" title="Move"><i class="fas fa-exchange-alt"></i></button>
                            </div>
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
                                        <div class="stat-mod">${formatMod(effectiveMods[s])}</div>
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
                                ${getSpellSlots(char.class, char.level).map((slots, idx) => {
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
                            ${!getSpellSlots(char.class, char.level).length ? '<p class="text-xs text-amber-700 italic mt-2">No spell slots at this level yet.</p>' : ''}
                        </div>
                        ` : ''}

                        <div class="parchment scroll-border p-4 fade-in">
                            <div class="section-header"><i class="fas fa-dice-d20"></i>Saving Throws</div>
                            <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
                                ${['ppdm','rsw','pp','bw','sp'].map(s => {
                                    const baseSave = getSave(char.class, char.level, s);
                                    const modSave = getModifiedSave(char, s);
                                    const isModified = modSave !== baseSave;
                                    return `
                                    <div class="saving-throw-box">
                                        <div class="value ${isModified ? 'text-green-700' : ''}">${modSave}${isModified ? `<span class="text-xs ml-1 opacity-70">(${baseSave})</span>` : ''}</div>
                                        <div class="label">${s.toUpperCase()}</div>
                                        ${(() => { const bd = formatEffectBreakdown(getEffectBreakdown(char, 'saves')); return bd ? `<div class="text-xs text-green-700 font-bold mt-1">${bd}</div>` : ''; })()}
                                    </div>
                                `}).join('')}
                            </div>
                            <div class="text-xs text-amber-700 mt-2 text-center">
                                PPDM = Paralyze/Poison/Death Magic | RSW = Rod/Staff/Wand | PP = Petrification/Polymorph | BW = Breath Weapon | SP = Spell
                            </div>
                        </div>
                        <div class="parchment scroll-border p-4 fade-in">
                            <div class="section-header"><i class="fas fa-fist-raised"></i>Proficiencies</div>
                            <div class="grid-2 gap-4">
                                <div>
                                    <div class="flex justify-between items-center mb-2">
                                        <h4 class="font-bold text-amber-900 text-sm">Weapon Profs</h4>
                                        <span class="text-xs ${wpCount > expected.weapon ? 'text-red-600' : (wpCount < expected.weapon ? 'text-amber-600' : 'text-green-600')}">${wpCount} / ${expected.weapon} expected</span>
                                    </div>
                                    <div class="flex flex-wrap gap-1">
                                        ${(char.weaponProfs || []).map(p => `<span class="prof-tag">${p}</span>`).join('') || '<span class="text-amber-700 text-sm italic">None selected</span>'}
                                    </div>
                                </div>
                                <div>
                                    <div class="flex justify-between items-center mb-2">
                                        <h4 class="font-bold text-amber-900 text-sm">Non-Weapon Profs</h4>
                                        <span class="text-xs ${nwpCount > expected.nonweapon ? 'text-red-600' : (nwpCount < expected.nonweapon ? 'text-amber-600' : 'text-green-600')}">${nwpCount} / ${expected.nonweapon} expected</span>
                                    </div>
                                    <div class="flex flex-wrap gap-1">
                                        ${(char.nonweaponProfs || []).map(p => `<span class="prof-tag">${p}</span>`).join('') || '<span class="text-amber-700 text-sm italic">None selected</span>'}
                                    </div>
                                </div>
                            </div>
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
                        ${(char.selectedSchools && char.selectedSchools.length) || (char.selectedSpheres && char.selectedSpheres.length) ? `
                        <div class="parchment scroll-border p-4 fade-in">
                            <div class="section-header"><i class="fas fa-hat-wizard"></i>Magic ${char.selectedSchools && char.selectedSchools.length ? 'Schools' : 'Spheres'}</div>
                            <div class="flex flex-wrap gap-1">
                                ${(char.selectedSchools || []).map(s => `<span class="prof-tag">${s}</span>`).join('')}
                                ${(char.selectedSpheres || []).map(s => `<span class="prof-tag">${s}</span>`).join('')}
                            </div>
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

function addProfFromModal(type) {
    const char = State.currentCharacter;
    const select = $(type === 'weapon' ? 'addWP' : 'addNWP');
    const val = select.value;
    if (!val) return;

    if (type === 'weapon') {
        char.weaponProfs = char.weaponProfs || [];
        char.weaponProfs.push(val);
    } else {
        char.nonweaponProfs = char.nonweaponProfs || [];
        char.nonweaponProfs.push(val);
    }
    Storage.save();
    showManageProfsModal();
    toast(`Added ${val}`);
}

function removeProfFromModal(type, idx) {
    const char = State.currentCharacter;
    if (type === 'weapon') {
        char.weaponProfs.splice(idx, 1);
    } else {
        char.nonweaponProfs.splice(idx, 1);
    }
    Storage.save();
    showManageProfsModal();
    toast('Proficiency removed');
}

function changeCharacterCampaign(charId, newCampaignId) {
    if (!newCampaignId || !newCampaignId.trim()) return toast('Please enter or select a campaign', 'error');
    const char = State.characters.find(c => c.id === charId);
    if (!char) return toast('Character not found', 'error');
    const oldCampaign = char.campaignId || 'default';
    const newCampaign = newCampaignId.trim();
    char.campaignId = newCampaign;
    char.lastUpdated = Date.now();
    Storage.save();
    toast(`${char.name} moved from ${oldCampaign} to ${newCampaign}`);
    render();
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
initApp();
if (!State.currentUser) {
    changeView('login');
} else if (!State.currentCharacter) {
    changeView('dashboard');
} else {
    renderSheet(document.getElementById('app'));
}

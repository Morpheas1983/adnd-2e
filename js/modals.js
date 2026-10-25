/* ============================
   MODULE: Modals (modals.js)
   ============================ */
function showSpellDetail(spellName) {
    const char = State.currentCharacter;
    const spells = getAvailableSpells(char);
    const spell = spells.find(s => s.name === spellName);
    if (!spell) return;
    $('modalContainer').innerHTML = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal-content wide" onclick="event.stopPropagation()">
                <div class="p-6">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <h2 class="fantasy-font text-2xl font-bold text-amber-900">${spell.name}</h2>
                            <div class="flex gap-2 mt-2">
                                <span class="spell-level-badge">Level ${spell.level}</span>
                                <span class="school-badge">${spell.school || spell.sphere}</span>
                            </div>
                        </div>
                        <button onclick="closeModal()" class="text-amber-700 hover:text-amber-900 text-xl">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="spell-detail-box mb-4">
                        <div class="detail-row"><span class="detail-label">Range:</span><span class="detail-value">${spell.range}</span></div>
                        <div class="detail-row"><span class="detail-label">Duration:</span><span class="detail-value">${spell.duration}</span></div>
                        <div class="detail-row"><span class="detail-label">Area:</span><span class="detail-value">${spell.aoe}</span></div>
                        <div class="detail-row"><span class="detail-label">Components:</span><span class="detail-value">${spell.components}</span></div>
                        <div class="detail-row"><span class="detail-label">Casting Time:</span><span class="detail-value">${spell.casting_time}</span></div>
                        <div class="detail-row"><span class="detail-label">Save:</span><span class="detail-value">${spell.save}</span></div>
                    </div>
                    <div class="p-4 bg-amber-50 rounded border border-amber-300">
                        <h3 class="font-bold text-amber-900 mb-2">Description</h3>
                        <p class="text-sm text-amber-800 leading-relaxed">${spell.desc}</p>
                    </div>
                    <div class="mt-4 flex justify-end">
                        <button onclick="closeModal()" class="btn-galactic px-6 py-2 rounded">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

let selectedAddItem = null;

function showAddItemModal() {
    $('modalContainer').innerHTML = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal-content wide" onclick="event.stopPropagation()">
                <div class="p-6">
                    <h2 class="fantasy-font text-xl font-bold text-amber-900 mb-4">Add Item to Inventory</h2>
                    <div class="flex gap-1 mb-4 border-b-2 border-amber-300 pb-2 overflow-x-auto">
                        <button class="tab-btn active" onclick="switchAddItemTab('weapons', this)">Weapons</button>
                        <button class="tab-btn" onclick="switchAddItemTab('armor', this)">Armor</button>
                        <button class="tab-btn" onclick="switchAddItemTab('gear', this)">Gear</button>
                        <button class="tab-btn" onclick="switchAddItemTab('custom', this)">Custom</button>
                    </div>
                    
                    <div id="addItemTab_weapons" class="add-item-tab">
                        <input type="text" id="weaponSearch" class="input-fantasy w-full px-3 py-2 mb-3" placeholder="Search weapons..." onkeyup="filterAddItems('weapons')">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto" id="weaponList">
                            ${DB.weapons.map((w, idx) => `
                                <div class="p-2 border border-amber-300 rounded bg-amber-50 hover:bg-amber-200 cursor-pointer transition-colors" onclick="selectAddItem('weapon', ${idx})">
                                    <div class="flex justify-between">
                                        <span class="font-bold text-sm">${w.name}</span>
                                        <span class="text-xs text-amber-700">${w.cost}gp</span>
                                    </div>
                                    <div class="text-xs text-amber-600">Dmg: ${w.damage_sm}/${w.damage_l} | Spd: ${w.speed} | ${w.type}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div id="addItemTab_armor" class="add-item-tab hidden">
                        <input type="text" id="armorSearch" class="input-fantasy w-full px-3 py-2 mb-3" placeholder="Search armor..." onkeyup="filterAddItems('armor')">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto" id="armorList">
                            ${DB.armor.map((a, idx) => `
                                <div class="p-2 border border-amber-300 rounded bg-amber-50 hover:bg-amber-200 cursor-pointer transition-colors" onclick="selectAddItem('armor', ${idx})">
                                    <div class="flex justify-between">
                                        <span class="font-bold text-sm">${a.name}</span>
                                        <span class="text-xs text-amber-700">${a.cost}gp</span>
                                    </div>
                                    <div class="text-xs text-amber-600">AC: ${a.ac} | Wt: ${a.weight} lbs</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div id="addItemTab_gear" class="add-item-tab hidden">
                        <input type="text" id="gearSearch" class="input-fantasy w-full px-3 py-2 mb-3" placeholder="Search gear..." onkeyup="filterAddItems('gear')">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto" id="gearList">
                            ${DB.gear.map((g, idx) => `
                                <div class="p-2 border border-amber-300 rounded bg-amber-50 hover:bg-amber-200 cursor-pointer transition-colors" onclick="selectAddItem('gear', ${idx})">
                                    <div class="flex justify-between">
                                        <span class="font-bold text-sm">${g.name}</span>
                                        <span class="text-xs text-amber-700">${g.cost}gp</span>
                                    </div>
                                    <div class="text-xs text-amber-600">Wt: ${g.weight} lbs</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div id="addItemTab_custom" class="add-item-tab hidden">
                        <div class="space-y-3">
                            <div>
                                <label class="block text-sm font-bold text-amber-900 mb-1">Item Name</label>
                                <input type="text" id="customItemName" class="input-fantasy w-full px-3 py-2" placeholder="Item name...">
                            </div>
                            <div class="grid-2 gap-3">
                                <div>
                                    <label class="block text-sm font-bold text-amber-900 mb-1">Type</label>
                                    <select id="customItemType" class="input-fantasy w-full px-3 py-2" onchange="updateCustomItemFields()">
                                        <option value="weapon">Weapon</option>
                                        <option value="armor">Armor</option>
                                        <option value="shield">Shield</option>
                                        <option value="gear">Gear</option>
                                        <option value="misc">Misc</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-sm font-bold text-amber-900 mb-1">Quantity</label>
                                    <input type="number" id="customItemQty" class="input-fantasy w-full px-3 py-2" value="1" min="1">
                                </div>
                            </div>
                            <div class="grid-2 gap-3">
                                <div>
                                    <label class="block text-sm font-bold text-amber-900 mb-1">Weight (lbs)</label>
                                    <input type="number" id="customItemWeight" class="input-fantasy w-full px-3 py-2" value="0" step="0.1">
                                </div>
                                <div>
                                    <label class="block text-sm font-bold text-amber-900 mb-1">Cost (gp)</label>
                                    <input type="number" id="customItemCost" class="input-fantasy w-full px-3 py-2" value="0" step="0.1">
                                </div>
                            </div>
                            <div id="customWeaponFields">
                                <div class="grid-2 gap-3">
                                    <div>
                                        <label class="block text-sm font-bold text-amber-900 mb-1">Damage (S/M)</label>
                                        <input type="text" id="customItemDamageSM" class="input-fantasy w-full px-3 py-2" placeholder="1d6">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-bold text-amber-900 mb-1">Damage (L)</label>
                                        <input type="text" id="customItemDamageL" class="input-fantasy w-full px-3 py-2" placeholder="1d8">
                                    </div>
                                </div>
                            </div>
                            <div id="customArmorFields" class="hidden">
                                <div>
                                    <label class="block text-sm font-bold text-amber-900 mb-1">Base AC</label>
                                    <input type="number" id="customItemAC" class="input-fantasy w-full px-3 py-2" value="10">
                                </div>
                            </div>
                            <div class="grid-2 gap-3">
                                <div>
                                    <label class="block text-sm font-bold text-amber-900 mb-1">Attack Bonus</label>
                                    <input type="number" id="customItemAtk" class="input-fantasy w-full px-3 py-2 text-center" value="0">
                                </div>
                                <div>
                                    <label class="block text-sm font-bold text-amber-900 mb-1">Damage Bonus</label>
                                    <input type="number" id="customItemDmg" class="input-fantasy w-full px-3 py-2 text-center" value="0">
                                </div>
                                <div>
                                    <label class="block text-sm font-bold text-amber-900 mb-1">AC Bonus</label>
                                    <input type="number" id="customItemACBonus" class="input-fantasy w-full px-3 py-2 text-center" value="0">
                                </div>
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-amber-900 mb-1">Special Properties</label>
                                <input type="text" id="customItemSpecial" class="input-fantasy w-full px-3 py-2" placeholder="e.g., +1, Flaming, Silvered...">
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-amber-900 mb-1">Notes / Description</label>
                                <textarea id="customItemNotes" class="input-fantasy w-full px-3 py-2 h-16 resize-none" placeholder="Optional notes..."></textarea>
                            </div>
                            <button onclick="addCustomItem()" class="btn-fantasy w-full py-2 rounded">Add Custom Item</button>
                        </div>
                    </div>
                    
                    <div id="itemModifierPanel" class="mt-4 p-4 bg-amber-100 rounded border border-amber-300 hidden">
                        <h3 class="font-bold text-amber-900 mb-3">Special Properties</h3>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div id="modAttackWrap">
                                <label class="block text-xs font-bold text-amber-900 mb-1">Attack Bonus</label>
                                <input type="number" id="modAttack" class="input-fantasy w-full px-2 py-1 text-center" value="0">
                            </div>
                            <div id="modDamageWrap">
                                <label class="block text-xs font-bold text-amber-900 mb-1">Damage Bonus</label>
                                <input type="number" id="modDamage" class="input-fantasy w-full px-2 py-1 text-center" value="0">
                            </div>
                            <div id="modACWrap">
                                <label class="block text-xs font-bold text-amber-900 mb-1">AC Bonus</label>
                                <input type="number" id="modAC" class="input-fantasy w-full px-2 py-1 text-center" value="0">
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-amber-900 mb-1">Quantity</label>
                                <input type="number" id="modQty" class="input-fantasy w-full px-2 py-1 text-center" value="1" min="1">
                            </div>
                        </div>
                        <div class="mt-3">
                            <label class="block text-xs font-bold text-amber-900 mb-1">Special Properties / Description</label>
                            <input type="text" id="modSpecial" class="input-fantasy w-full px-3 py-2" placeholder="e.g., +1 Flaming Sword, Glows in darkness...">
                        </div>
                        <div class="mt-3 flex justify-end">
                            <button onclick="addSelectedItem()" class="btn-fantasy px-6 py-2 rounded">Add to Inventory</button>
                        </div>
                    </div>
                    
                    <div class="mt-4 flex justify-end">
                        <button onclick="closeModal()" class="btn-galactic px-4 py-2 rounded">Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function switchAddItemTab(tab, btn) {
    document.querySelectorAll('.add-item-tab').forEach(el => el.classList.add('hidden'));
    $(`addItemTab_${tab}`).classList.remove('hidden');
    document.querySelectorAll('.modal-content .tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    $('itemModifierPanel').classList.add('hidden');
    selectedAddItem = null;
}

function filterAddItems(type) {
    const search = $(`${type}Search`).value.toLowerCase();
    const list = $(`${type}List`);
    const items = list.children;
    for (let item of items) {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(search) ? '' : 'none';
    }
}

function selectAddItem(type, idx) {
    let item;
    if (type === 'weapon') item = DB.weapons[idx];
    else if (type === 'armor') item = DB.armor[idx];
    else item = DB.gear[idx];
    selectedAddItem = { ...item, type, source: 'db' };
    $('itemModifierPanel').classList.remove('hidden');
    $('modAttack').value = 0;
    $('modDamage').value = 0;
    $('modAC').value = 0;
    $('modQty').value = 1;
    $('modSpecial').value = '';
    
    if (type === 'weapon') {
        $('modAttackWrap').style.display = '';
        $('modDamageWrap').style.display = '';
        $('modACWrap').style.display = 'none';
    } else if (type === 'armor' || type === 'shield') {
        $('modAttackWrap').style.display = 'none';
        $('modDamageWrap').style.display = 'none';
        $('modACWrap').style.display = '';
    } else {
        $('modAttackWrap').style.display = 'none';
        $('modDamageWrap').style.display = 'none';
        $('modACWrap').style.display = 'none';
    }
}

function addSelectedItem() {
    if (!selectedAddItem) return;
    const char = State.currentCharacter;
    const bonusAttack = parseInt($('modAttack').value) || 0;
    const bonusDamage = parseInt($('modDamage').value) || 0;
    const bonusAC = parseInt($('modAC').value) || 0;
    const qty = parseInt($('modQty').value) || 1;
    const special = $('modSpecial').value.trim();
    
    const newItem = {
        ...selectedAddItem,
        qty,
        equipped: false,
        bonusAttack: bonusAttack || undefined,
        bonusDamage: bonusDamage || undefined,
        bonusAC: bonusAC || undefined,
        special: special || undefined
    };
    
    Object.keys(newItem).forEach(key => {
        if (newItem[key] === undefined) delete newItem[key];
    });
    
    char.inventory = char.inventory || [];
    char.inventory.push(newItem);
    Storage.save();
    closeModal();
    render();
    toast(`Added ${newItem.name}${special ? ' ('+special+')' : ''}`);
}

function updateCustomItemFields() {
    const type = $('customItemType').value;
    const wpn = $('customWeaponFields');
    const arm = $('customArmorFields');
    if (wpn) wpn.classList.toggle('hidden', type !== 'weapon');
    if (arm) arm.classList.toggle('hidden', type !== 'armor' && type !== 'shield');
}

function showEditItemModal(idx) {
    const char = State.currentCharacter;
    const item = char.inventory[idx];
    $('modalContainer').innerHTML = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal-content" onclick="event.stopPropagation()">
                <div class="p-6">
                    <h2 class="fantasy-font text-xl font-bold text-amber-900 mb-4">Edit Item</h2>
                    <div class="space-y-3">
                        <div>
                            <label class="block text-sm font-bold text-amber-900 mb-1">Item Name</label>
                            <input type="text" id="editItemName" class="input-fantasy w-full px-3 py-2" value="${item.name}">
                        </div>
                        <div class="grid-2 gap-3">
                            <div>
                                <label class="block text-sm font-bold text-amber-900 mb-1">Quantity</label>
                                <input type="number" id="editItemQty" class="input-fantasy w-full px-3 py-2" value="${item.qty || 1}" min="1">
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-amber-900 mb-1">Weight (lbs)</label>
                                <input type="number" id="editItemWeight" class="input-fantasy w-full px-3 py-2" value="${item.weight || 0}" step="0.1">
                            </div>
                        </div>
                        ${item.type === 'weapon' ? `
                        <div class="grid-2 gap-3">
                            <div>
                                <label class="block text-sm font-bold text-amber-900 mb-1">Attack Bonus</label>
                                <input type="number" id="editItemAtk" class="input-fantasy w-full px-3 py-2 text-center" value="${item.bonusAttack || 0}">
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-amber-900 mb-1">Damage Bonus</label>
                                <input type="number" id="editItemDmg" class="input-fantasy w-full px-3 py-2 text-center" value="${item.bonusDamage || 0}">
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-bold text-amber-900 mb-1">Damage Dice</label>
                            <input type="text" id="editItemDamage" class="input-fantasy w-full px-3 py-2" value="${item.damage || item.damage_sm || ''}">
                        </div>
                        ` : ''}
                        ${item.type === 'armor' || item.type === 'shield' ? `
                        <div class="grid-2 gap-3">
                            <div>
                                <label class="block text-sm font-bold text-amber-900 mb-1">AC Bonus</label>
                                <input type="number" id="editItemAC" class="input-fantasy w-full px-3 py-2 text-center" value="${item.bonusAC || 0}">
                            </div>
                            ${item.type === 'armor' ? `
                            <div>
                                <label class="block text-sm font-bold text-amber-900 mb-1">Base AC</label>
                                <input type="number" id="editItemBaseAC" class="input-fantasy w-full px-3 py-2 text-center" value="${item.ac || 10}">
                            </div>
                            ` : ''}
                        </div>
                        ` : ''}
                        <div>
                            <label class="block text-sm font-bold text-amber-900 mb-1">Special Properties</label>
                            <input type="text" id="editItemSpecial" class="input-fantasy w-full px-3 py-2" value="${item.special || ''}" placeholder="e.g., +1, Flaming, Silvered...">
                        </div>
                        <div>
                            <label class="block text-sm font-bold text-amber-900 mb-1">Notes</label>
                            <textarea id="editItemNotes" class="input-fantasy w-full px-3 py-2 h-16 resize-none">${item.notes || ''}</textarea>
                        </div>
                    </div>
                    <div class="flex justify-end gap-2 mt-4">
                        <button onclick="closeModal()" class="btn-galactic px-4 py-2 rounded">Cancel</button>
                        <button onclick="saveItemEdit(${idx})" class="btn-fantasy px-4 py-2 rounded">Save Changes</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function saveItemEdit(idx) {
    try {
        const char = State.currentCharacter;
        if (!char || !char.inventory || !char.inventory[idx]) {
            toast('Error: item not found', 'error');
            return;
        }
        const item = char.inventory[idx];
        item.name = $('editItemName').value.trim() || item.name;
        item.qty = parseInt($('editItemQty').value) || 1;
        item.weight = parseFloat($('editItemWeight').value) || 0;
        item.special = $('editItemSpecial').value.trim() || undefined;
        item.notes = $('editItemNotes').value.trim() || undefined;

        if (item.type === 'weapon') {
            const atkVal = $('editItemAtk').value.trim();
            item.bonusAttack = atkVal === '' ? undefined : parseInt(atkVal);
            const dmgVal = $('editItemDmg').value.trim();
            item.bonusDamage = dmgVal === '' ? undefined : parseInt(dmgVal);
            item.damage = $('editItemDamage').value.trim() || item.damage;
            if (item.bonusAttack === 0 || item.bonusAttack === undefined) delete item.bonusAttack;
            if (item.bonusDamage === 0 || item.bonusDamage === undefined) delete item.bonusDamage;
        }
        if (item.type === 'armor') {
            const acVal = $('editItemAC').value.trim();
            item.bonusAC = acVal === '' ? undefined : parseInt(acVal);
            const baseVal = $('editItemBaseAC').value.trim();
            if (baseVal !== '') item.ac = parseInt(baseVal);
            if (item.bonusAC === 0 || item.bonusAC === undefined) delete item.bonusAC;
        }
        if (item.type === 'shield') {
            const acVal = $('editItemAC').value.trim();
            item.bonusAC = acVal === '' ? undefined : parseInt(acVal);
            if (item.bonusAC === 0 || item.bonusAC === undefined) delete item.bonusAC;
        }
        if (item.special === '' || item.special === undefined) delete item.special;
        if (item.notes === '' || item.notes === undefined) delete item.notes;

        Storage.save();
        closeModal();
        render();
        toast('Item updated!');
    } catch (err) {
        console.error('saveItemEdit error:', err);
        alert('Error saving item: ' + err.message);
    }
}
function showEditLevelModal() {
    const char = State.currentCharacter;
    const cls = DB.classes[char.class];
    const hd = cls ? cls.hd : 6;
    $('modalContainer').innerHTML = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal-content" onclick="event.stopPropagation()">
                <div class="p-6">
                    <h2 class="fantasy-font text-xl font-bold text-amber-900 mb-4">Edit Character Level</h2>
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-bold text-amber-900 mb-1">Current Level: ${char.level}</label>
                            <input type="number" id="editLevelValue" class="input-fantasy w-full px-3 py-2 text-center text-2xl" 
                                   value="${char.level}" min="1" max="20">
                        </div>
                        <div>
                            <label class="block text-sm font-bold text-amber-900 mb-1">Total Hit Points (Max HP)</label>
                            <div class="flex gap-2">
                                <input type="number" id="editHPValue" class="input-fantasy w-full px-3 py-2 text-center text-lg font-bold" 
                                       value="${char.maxHp}" min="1">
                                <button onclick="recalcHPForLevel()" class="btn-fantasy px-3 py-2 rounded text-sm" title="Auto-calculate">
                                    <i class="fas fa-calculator"></i>
                                </button>
                            </div>
                            <div class="text-xs text-amber-700 mt-1">Hit Die: d${hd} + CON mod (${formatMod(getModifier(char.stats?.con || 10))}) per level</div>
                        </div>
                        <div class="p-3 bg-amber-100 rounded border border-amber-300 text-sm text-amber-800">
                            <i class="fas fa-exclamation-triangle mr-1"></i>
                            Changing level updates THAC0, saves, and XP. You can manage proficiencies separately after.
                        </div>
                    </div>
                    <div class="flex justify-end gap-2 mt-4">
                        <button onclick="closeModal()" class="btn-galactic px-4 py-2 rounded">Cancel</button>
                        <button onclick="confirmEditLevel()" class="btn-fantasy px-4 py-2 rounded">Update Level</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function showManageProfsModal() {
    const char = State.currentCharacter;
    const expected = getExpectedProfs(char.class, char.level);
    const knownWP = char.weaponProfs || [];
    const knownNWP = char.nonweaponProfs || [];
    const availableWP = DB.weapon_proficiencies.filter(p => !knownWP.includes(p));
    const availableNWP = DB.nonweapon_proficiencies.filter(p => !knownNWP.includes(p.name));

    $('modalContainer').innerHTML = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal-content wide" onclick="event.stopPropagation()">
                <div class="p-6">
                    <h2 class="fantasy-font text-xl font-bold text-amber-900 mb-4">Manage Proficiencies</h2>
                    <div class="grid-2 gap-6">
                        <div>
                            <div class="flex justify-between items-center mb-3">
                                <h3 class="font-bold text-amber-900">Weapon Proficiencies</h3>
                                <span class="text-xs ${knownWP.length > expected.weapon ? 'text-red-600' : (knownWP.length < expected.weapon ? 'text-amber-600' : 'text-green-600')}">${knownWP.length} / ${expected.weapon} expected</span>
                            </div>
                            <div class="mb-3">
                                <div class="flex gap-2">
                                    <select id="addWP" class="input-fantasy flex-1 px-3 py-2 text-sm">
                                        <option value="">Add proficiency...</option>
                                        ${availableWP.map(p => `<option value="${p}">${p}</option>`).join('')}
                                    </select>
                                    <button onclick="addProfFromModal('weapon')" class="btn-fantasy px-3 py-2 rounded text-sm">Add</button>
                                </div>
                            </div>
                            <div class="max-h-48 overflow-y-auto border border-amber-300 rounded bg-amber-50 p-2">
                                ${knownWP.length === 0 ? '<p class="text-sm text-amber-700 italic">None</p>' : ''}
                                ${knownWP.map((p, idx) => `
                                    <div class="flex justify-between items-center p-2 border-b border-amber-200 last:border-0">
                                        <span class="text-sm font-bold text-amber-900">${p}</span>
                                        <button onclick="removeProfFromModal('weapon', ${idx})" class="text-red-700 hover:text-red-900 text-sm">
                                            <i class="fas fa-times"></i> Remove
                                        </button>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        <div>
                            <div class="flex justify-between items-center mb-3">
                                <h3 class="font-bold text-amber-900">Non-Weapon Proficiencies</h3>
                                <span class="text-xs ${knownNWP.length > expected.nonweapon ? 'text-red-600' : (knownNWP.length < expected.nonweapon ? 'text-amber-600' : 'text-green-600')}">${knownNWP.length} / ${expected.nonweapon} expected</span>
                            </div>
                            <div class="mb-3">
                                <div class="flex gap-2">
                                    <select id="addNWP" class="input-fantasy flex-1 px-3 py-2 text-sm">
                                        <option value="">Add proficiency...</option>
                                        ${availableNWP.map(p => `<option value="${p.name}">${p.name} (${p.ability})</option>`).join('')}
                                    </select>
                                    <button onclick="addProfFromModal('nonweapon')" class="btn-fantasy px-3 py-2 rounded text-sm">Add</button>
                                </div>
                            </div>
                            <div class="max-h-48 overflow-y-auto border border-amber-300 rounded bg-amber-50 p-2">
                                ${knownNWP.length === 0 ? '<p class="text-sm text-amber-700 italic">None</p>' : ''}
                                ${knownNWP.map((p, idx) => `
                                    <div class="flex justify-between items-center p-2 border-b border-amber-200 last:border-0">
                                        <span class="text-sm font-bold text-amber-900">${p}</span>
                                        <button onclick="removeProfFromModal('nonweapon', ${idx})" class="text-red-700 hover:text-red-900 text-sm">
                                            <i class="fas fa-times"></i> Remove
                                        </button>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                    <div class="mt-4 flex justify-end">
                        <button onclick="closeModal(); render();" class="btn-galactic px-6 py-2 rounded">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function showAddSpellModal() {
    const char = State.currentCharacter;
    const isWizard = ['Mage','Specialist Wizard','Bard'].includes(char.class);
    $('modalContainer').innerHTML = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal-content" onclick="event.stopPropagation()">
                <div class="p-6">
                    <h2 class="fantasy-font text-xl font-bold text-amber-900 mb-4">Add Custom Spell</h2>
                    <div class="space-y-3">
                        <div class="grid-2 gap-3">
                            <div><label class="block text-xs font-bold text-amber-900">Name</label><input id="spellName" class="input-fantasy w-full px-2 py-1"></div>
                            <div><label class="block text-xs font-bold text-amber-900">Level</label><input id="spellLevel" type="number" class="input-fantasy w-full px-2 py-1" value="1" min="1" max="9"></div>
                        </div>
                        <div class="grid-2 gap-3">
                            <div><label class="block text-xs font-bold text-amber-900">${isWizard?'School':'Sphere'}</label><input id="spellSchool" class="input-fantasy w-full px-2 py-1"></div>
                            <div><label class="block text-xs font-bold text-amber-900">Range</label><input id="spellRange" class="input-fantasy w-full px-2 py-1" value="0"></div>
                        </div>
                        <div class="grid-2 gap-3">
                            <div><label class="block text-xs font-bold text-amber-900">Duration</label><input id="spellDuration" class="input-fantasy w-full px-2 py-1"></div>
                            <div><label class="block text-xs font-bold text-amber-900">Area of Effect</label><input id="spellAOE" class="input-fantasy w-full px-2 py-1"></div>
                        </div>
                        <div class="grid-2 gap-3">
                            <div><label class="block text-xs font-bold text-amber-900">Components</label><input id="spellComponents" class="input-fantasy w-full px-2 py-1" value="V,S,M"></div>
                            <div><label class="block text-xs font-bold text-amber-900">Casting Time</label><input id="spellCastTime" class="input-fantasy w-full px-2 py-1" value="1"></div>
                        </div>
                        <div><label class="block text-xs font-bold text-amber-900">Save</label><input id="spellSave" class="input-fantasy w-full px-2 py-1" value="None"></div>
                        <div><label class="block text-xs font-bold text-amber-900">Description</label><textarea id="spellDesc" class="input-fantasy w-full px-2 py-1 h-20 resize-none"></textarea></div>
                    </div>
                    <div class="flex justify-end gap-2 mt-4">
                        <button onclick="closeModal()" class="btn-galactic px-4 py-2 rounded">Cancel</button>
                        <button onclick="saveCustomSpell()" class="btn-fantasy px-4 py-2 rounded">Add Spell</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function showCreatureModal(id) {
    const isEdit = !!id;
    const creature = isEdit ? State.creatures.find(c => c.id === id) : null;
    $('modalContainer').innerHTML = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal-content wide" onclick="event.stopPropagation()">
                <div class="p-6">
                    <h2 class="fantasy-font text-xl font-bold text-amber-900 mb-4">${isEdit ? 'Edit' : 'Add'} Creature</h2>
                    <div class="grid-2 gap-3">
                        <div><label class="block text-xs font-bold text-amber-900">Name</label><input id="cName" class="input-fantasy w-full px-2 py-1" value="${creature?.name||''}"></div>
                        <div><label class="block text-xs font-bold text-amber-900">Type</label><input id="cType" class="input-fantasy w-full px-2 py-1" value="${creature?.type||''}"></div>
                        <div><label class="block text-xs font-bold text-amber-900">HP / Max HP</label>
                            <div class="flex gap-2"><input id="cHP" type="number" class="input-fantasy w-full px-2 py-1" value="${creature?.hp||1}"><input id="cMaxHP" type="number" class="input-fantasy w-full px-2 py-1" value="${creature?.maxHp||1}"></div>
                        </div>
                        <div><label class="block text-xs font-bold text-amber-900">AC / THAC0</label>
                            <div class="flex gap-2"><input id="cAC" type="number" class="input-fantasy w-full px-2 py-1" value="${creature?.ac||10}"><input id="cTHAC0" type="number" class="input-fantasy w-full px-2 py-1" value="${creature?.thac0||20}"></div>
                        </div>
                    </div>
                    <div class="mt-3">
                        <label class="block text-xs font-bold text-amber-900 mb-1">Weapons (comma-separated name:damage)</label>
                        <input id="cWeapons" class="input-fantasy w-full px-2 py-1" value="${creature?.weapons?.map(w=>w.name+':'+w.damage).join(', ')||''}" placeholder="e.g., Claw:1d4, Bite:1d6">
                    </div>
                    <div class="mt-3">
                        <label class="block text-xs font-bold text-amber-900 mb-1">Notes</label>
                        <textarea id="cNotes" class="input-fantasy w-full px-2 py-1 h-16 resize-none">${creature?.notes||''}</textarea>
                    </div>
                    <div class="flex justify-end gap-2 mt-4">
                        <button onclick="closeModal()" class="btn-galactic px-4 py-2 rounded">Cancel</button>
                        <button onclick="saveCreature('${id||''}')" class="btn-fantasy px-4 py-2 rounded">${isEdit?'Save':'Create'}</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function closeModal(e) {
    if (e && e.target !== e.currentTarget) return;
    $('modalContainer').innerHTML = '';
}

function showChangeClassModal() {
    const char = State.currentCharacter;
    const raceData = DB.races[char.race];
    const availableClasses = raceData ? raceData.classes : [];

    $('modalContainer').innerHTML = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal-content" onclick="event.stopPropagation()">
                <div class="p-6">
                    <h2 class="fantasy-font text-xl font-bold text-amber-900 mb-4">Change Class</h2>
                    <p class="text-sm text-amber-800 mb-4">Current: <strong>${char.class}</strong></p>
                    <p class="text-xs text-red-700 mb-4"><i class="fas fa-exclamation-triangle mr-1"></i>Warning: Changing class will reset kit, spells, and class-specific skills. HP, XP, and inventory will be preserved.</p>
                    <div class="space-y-2 mb-4">
                        ${availableClasses.map(c => `
                            <label class="flex items-center gap-3 p-3 border border-amber-300 rounded bg-amber-50 cursor-pointer hover:bg-amber-200 transition-colors">
                                <input type="radio" name="newClass" value="${c}" ${c === char.class ? 'checked' : ''} class="accent-amber-700">
                                <div>
                                    <div class="font-bold text-amber-900">${c}</div>
                                    <div class="text-xs text-amber-700">${DB.classes[c]?.special || ''}</div>
                                </div>
                            </label>
                        `).join('')}
                    </div>
                    <div class="flex justify-end gap-2">
                        <button onclick="closeModal()" class="btn-galactic px-4 py-2 rounded">Cancel</button>
                        <button onclick="confirmChangeClass()" class="btn-fantasy px-4 py-2 rounded">Change Class</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function showMonsterDetail(monsterName, forcedLevel) {
    const m = DB.monsters[monsterName];
    if (!m) return;

    const hdInfo = parseMonsterHD(m.hd);
    const baseLevel = hdInfo.count || 1;
    const level = forcedLevel !== undefined ? parseInt(forcedLevel) : baseLevel;

    const hp = calculateMonsterHP(hdInfo, level);
    const thac0 = calculateMonsterTHAC0(m.thac0, baseLevel, level);
    const xp = calculateMonsterXP(m.xp, baseLevel, level);
    const saves = getMonsterSavesByHD(level);
    const scaledSpecial = scaleSpecialAttack(m.special, baseLevel, level);

    const saveLabels = ["Paralysis/Poison/Death", "Rod/Staff/Wand", "Petrification/Polymorph", "Breath Weapon", "Spell"];
    const saveValues = saves.split('/');

    const safeName = monsterName.replace(/'/g, "\'");

    $('modalContainer').innerHTML = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal-content max-w-3xl" onclick="event.stopPropagation()">
                <div class="p-6">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <h2 class="fantasy-font text-2xl font-bold text-amber-900">${monsterName}</h2>
                            <p class="text-sm text-amber-700">${m.category} • ${m.size} • ${m.source}</p>
                            <div class="flex gap-2 mt-1">
                                <span class="text-xs bg-amber-200 text-amber-900 px-2 py-1 rounded">${m.frequency}</span>
                                <span class="text-xs bg-amber-200 text-amber-900 px-2 py-1 rounded">${m.encounter} encounter</span>
                            </div>
                        </div>
                        <button onclick="previewMonsterImage('${safeName}')" class="btn-fantasy px-3 py-1 rounded text-sm mr-2" title="Preview monster image in new window">
                                <i class="fas fa-image mr-1"></i>Preview
                            </button>
                            <button onclick="closeModal()" class="text-amber-700 hover:text-amber-900 text-xl"><i class="fas fa-times"></i></button>
                    </div>

                    <!-- Level Selector -->
                    <div class="parchment scroll-border p-4 mb-4">
                        <div class="section-header"><i class="fas fa-layer-group"></i>Monster Level / Hit Dice</div>
                        <div class="flex items-center gap-4 mb-3">
                            <label class="text-sm font-bold text-amber-800">HD Level:</label>
                            <input type="range" id="monsterLevelSlider" min="1" max="30" value="${level}" 
                                   oninput="updateMonsterLevel('${safeName}', this.value)"
                                   class="flex-1 accent-amber-700">
                            <span id="monsterLevelDisplay" class="text-lg font-bold text-amber-900 w-12 text-center">${level}</span>
                        </div>
                        <div class="text-xs text-amber-700">
                            Base HD: <strong>${m.hd}</strong> (${hdInfo.count}d${hdInfo.die}${hdInfo.bonus >= 0 ? '+' + hdInfo.bonus : hdInfo.bonus}) 
                            • Die: <strong>d${hdInfo.die}</strong>
                            <button onclick="updateMonsterLevel('${safeName}', ${baseLevel})" 
                                    class="ml-3 text-xs btn-galactic px-2 py-1 rounded">Reset to Base</button>
                        </div>
                    </div>

                    <!-- Core Stats -->
                    <div class="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                        <div class="bg-amber-100 rounded p-3 text-center border border-amber-300">
                            <div class="text-xs text-amber-700 uppercase">Armor Class</div>
                            <div class="text-2xl font-bold text-amber-900">${m.ac}</div>
                            <div class="text-xs text-amber-600">Base AC</div>
                        </div>
                        <div class="bg-amber-100 rounded p-3 text-center border border-amber-300">
                            <div class="text-xs text-amber-700 uppercase">Hit Points</div>
                            <div class="text-2xl font-bold text-amber-900" id="monsterHPAvg">${hp.avg}</div>
                            <div class="text-xs text-amber-600">${hp.formula}</div>
                            <div class="text-xs text-amber-700">Range: ${hp.min}-${hp.max}</div>
                            <button onclick="rollMonsterHP('${safeName}', ${level})" 
                                    class="text-xs btn-fantasy px-2 py-1 rounded mt-1">Roll HP</button>
                            <div id="monsterHPRolled" class="text-sm font-bold text-red-700 mt-1"></div>
                        </div>
                        <div class="bg-amber-100 rounded p-3 text-center border border-amber-300">
                            <div class="text-xs text-amber-700 uppercase">THAC0</div>
                            <div class="text-2xl font-bold text-amber-900">${thac0}</div>
                            <div class="text-xs text-amber-600">Base: ${m.thac0}</div>
                        </div>
                        <div class="bg-amber-100 rounded p-3 text-center border border-amber-300">
                            <div class="text-xs text-amber-700 uppercase">Hit Dice</div>
                            <div class="text-2xl font-bold text-amber-900">${level}</div>
                            <div class="text-xs text-amber-600">${level}d${hdInfo.die}</div>
                        </div>
                        <div class="bg-amber-100 rounded p-3 text-center border border-amber-300">
                            <div class="text-xs text-amber-700 uppercase">XP Value</div>
                            <div class="text-2xl font-bold text-amber-900">${xp.toLocaleString()}</div>
                            <div class="text-xs text-amber-600">Base: ${m.xp.toLocaleString()}</div>
                        </div>
                    </div>

                    <!-- Saving Throws -->
                    <div class="parchment scroll-border p-4 mb-4">
                        <div class="section-header"><i class="fas fa-shield-alt"></i>Saving Throws (Level ${level})</div>
                        <div class="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                            ${saveLabels.map((label, i) => `
                                <div class="bg-amber-100 rounded p-2 text-center border border-amber-300">
                                    <div class="text-xs text-amber-700">${label}</div>
                                    <div class="text-xl font-bold text-amber-900">${saveValues[i] || '-'}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Combat Stats -->
                    <div class="parchment scroll-border p-4 mb-4">
                        <div class="section-header"><i class="fas fa-sword"></i>Combat Stats</div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm mb-3">
                            <div><span class="font-bold text-amber-800">Damage:</span> <span class="text-amber-900">${m.damage}</span></div>
                            <div><span class="font-bold text-amber-800">Size:</span> <span class="text-amber-900">${m.size}</span></div>
                            <div><span class="font-bold text-amber-800">Category:</span> <span class="text-amber-900">${m.category}</span></div>
                            <div><span class="font-bold text-amber-800">Source:</span> <span class="text-amber-900">${m.source}</span></div>
                        </div>
                        <div class="text-sm mb-2">
                            <span class="font-bold text-amber-800">Immunities:</span>
                            <span class="text-amber-900 ${m.immunities === 'None' ? 'italic' : ''}">${m.immunities}</span>
                        </div>
                        <div class="text-sm">
                            <span class="font-bold text-amber-800">Special Attacks/Abilities:</span>
                            <span class="text-amber-900">${scaledSpecial}</span>
                            ${level !== baseLevel ? `<span class="text-xs text-amber-600 ml-2">(scaled from base HD ${baseLevel})</span>` : ''}
                        </div>
                    </div>

                    <!-- Appearance -->
                    <div class="parchment scroll-border p-4 mb-4">
                        <div class="section-header"><i class="fas fa-eye"></i>Appearance & Ecology</div>
                        <p class="text-sm text-amber-800 leading-relaxed">${m.appearance}</p>
                        <div class="flex gap-3 mt-3 text-xs text-amber-700">
                            <span><i class="fas fa-chart-bar mr-1"></i><strong>Frequency:</strong> ${m.frequency}</span>
                            <span><i class="fas fa-dice mr-1"></i><strong>Encounter Chance:</strong> ${m.encounter}</span>
                        </div>
                    </div>

                    <div class="flex justify-end gap-2">
                        <button onclick="closeModal()" class="btn-galactic px-4 py-2 rounded">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function updateMonsterLevel(monsterName, level) {
    showMonsterDetail(monsterName, parseInt(level));
}

function rollMonsterHP(monsterName, level) {
    const m = DB.monsters[monsterName];
    if (!m) return;
    const hdInfo = parseMonsterHD(m.hd);
    let total = hdInfo.bonus;
    for (let i = 0; i < level; i++) {
        total += Math.floor(Math.random() * hdInfo.die) + 1;
    }
    const display = document.getElementById('monsterHPRolled');
    if (display) {
        display.innerText = 'Rolled: ' + total + ' HP';
    }
}

function previewMonsterImage(monsterName) {
    const imgPath = DB.monsterImages[monsterName];

    if (imgPath) {
        // Show local image
        $('modalContainer').innerHTML = `
            <div class="modal-overlay" onclick="closeModal(event)">
                <div class="modal-content max-w-4xl" onclick="event.stopPropagation()">
                    <div class="p-4">
                        <div class="flex justify-between items-center mb-3">
                            <h2 class="fantasy-font text-xl font-bold text-amber-900">${monsterName}</h2>
                            <button onclick="closeModal()" class="text-amber-700 hover:text-amber-900 text-xl"><i class="fas fa-times"></i></button>
                        </div>
                        <div class="text-center">
                            <img src="${imgPath}" alt="${monsterName}" 
                                 class="max-w-full max-h-[70vh] mx-auto rounded border-2 border-amber-400 shadow-lg"
                                 onerror="this.parentElement.innerHTML='<p class=\'text-amber-700 p-8\'>Image not found. Please ensure the images folder is in the same directory as index.html.</p>'">
                        </div>
                        <p class="text-xs text-amber-600 text-center mt-2">AD&D 2e Monstrous Manual illustration</p>
                    </div>
                </div>
            </div>
        `;
    } else {
        // Search web for image
        const searchQuery = encodeURIComponent(monsterName + ' AD&D 2e Monstrous Manual illustration');
        const searchUrl = 'https://www.google.com/search?tbm=isch&q=' + searchQuery;

        $('modalContainer').innerHTML = `
            <div class="modal-overlay" onclick="closeModal(event)">
                <div class="modal-content max-w-4xl" onclick="event.stopPropagation()">
                    <div class="p-4">
                        <div class="flex justify-between items-center mb-3">
                            <h2 class="fantasy-font text-xl font-bold text-amber-900">${monsterName}</h2>
                            <button onclick="closeModal()" class="text-amber-700 hover:text-amber-900 text-xl"><i class="fas fa-times"></i></button>
                        </div>
                        <div class="parchment scroll-border p-6 text-center">
                            <i class="fas fa-image text-4xl text-amber-400 mb-3"></i>
                            <p class="text-amber-800 mb-3">No local image available for <strong>${monsterName}</strong>.</p>
                            <p class="text-sm text-amber-700 mb-4">Click below to search the web for the most relevant AD&D 2e illustration.</p>
                            <a href="${searchUrl}" target="_blank" 
                               class="btn-fantasy px-4 py-2 rounded inline-block">
                                <i class="fas fa-search mr-1"></i>Search Web for Image
                            </a>
                            <p class="text-xs text-amber-600 mt-3">Opens Google Images in a new tab</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

function showDeleteConfirmModal() {
    const char = State.currentCharacter;
    if (!char) return;

    $('modalContainer').innerHTML = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal-content max-w-md" onclick="event.stopPropagation()">
                <div class="p-6 text-center">
                    <i class="fas fa-exclamation-triangle text-5xl text-red-700 mb-4"></i>
                    <h2 class="fantasy-font text-xl font-bold text-red-900 mb-2">Delete Character?</h2>
                    <p class="text-amber-800 mb-1">Are you sure you want to permanently delete</p>
                    <p class="fantasy-font text-lg font-bold text-amber-900 mb-4">${char.name}</p>
                    <p class="text-sm text-amber-700 mb-6">This action cannot be undone. All character data, inventory, spells, and notes will be lost forever.</p>
                    <div class="flex justify-center gap-3">
                        <button onclick="closeModal()" class="btn-galactic px-4 py-2 rounded">Cancel</button>
                        <button onclick="deleteCharacter()" class="btn-danger px-4 py-2 rounded">
                            <i class="fas fa-trash mr-1"></i>Yes, Delete Forever
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function showSpellTargetModal(spellName, spellLevel) {
    const char = State.currentCharacter;
    const campaignId = char.campaignId || 'default';
    const targets = State.characters.filter(c => (c.campaignId || 'default') === campaignId);

    $('modalContainer').innerHTML = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal-content" onclick="event.stopPropagation()">
                <div class="p-6">
                    <h2 class="fantasy-font text-xl font-bold text-amber-900 mb-4">Cast ${spellName} on Target</h2>
                    <p class="text-sm text-amber-700 mb-3">Select a character from your campaign (including yourself):</p>
                    <div class="space-y-2 max-h-64 overflow-y-auto">
                        ${targets.length === 0 ? '<p class="text-amber-700 italic">No characters in this campaign.</p>' : ''}
                        ${targets.map(t => `
                            <div class="flex justify-between items-center p-3 bg-amber-100 rounded border border-amber-300 cursor-pointer hover:bg-amber-200 ${t.id === char.id ? 'border-blue-500 bg-blue-50' : ''}" onclick="castSpellOnTarget('${spellName}', ${spellLevel}, '${t.id}')">
                                <div>
                                    <div class="font-bold text-amber-900">${t.name} ${t.id === char.id ? '<span class="text-xs text-blue-700">(You)</span>' : ''}</div>
                                    <div class="text-xs text-amber-700">${t.race} ${t.class} • HP ${t.hp}/${t.maxHp}</div>
                                </div>
                                <button class="btn-fantasy px-3 py-1 rounded text-xs">Select</button>
                            </div>
                        `).join('')}
                    </div>
                    <div class="mt-4 flex justify-end">
                        <button onclick="closeModal()" class="btn-galactic px-4 py-2 rounded">Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

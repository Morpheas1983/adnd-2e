/* inventory.js - Inventory Management */
function renderInventory(container) {
    const char = State.currentCharacter;
    if (!char) return changeView('dashboard');
    const items = char.inventory || [];
    const totalWeight = items.reduce((sum, i) => sum + ((i.weight || 0) * (i.qty || 1)), 0);
    const equippedArmor = items.find(i => i.equipped && i.type === 'armor');
    const equippedShield = items.find(i => i.equipped && i.type === 'shield');
    const equippedWeapons = items.filter(i => i.equipped && i.type === 'weapon');

    container.innerHTML = `
        <div class="min-h-screen p-4">
            <div class="max-w-5xl mx-auto">
                <div class="parchment scroll-border p-4 mb-4 fade-in">
                    <div class="flex justify-between items-center flex-wrap gap-2">
                        <div class="flex items-center gap-3">
                            <button onclick="goBack()" class="btn-galactic px-3 py-2 rounded text-sm">
                                <i class="fas fa-arrow-left"></i> Back to Sheet
                            </button>
                            <h1 class="fantasy-font text-2xl font-bold text-amber-900">${char.name}'s Inventory</h1>
                        </div>
                        <div class="flex gap-2 items-center">
                            <span class="text-sm text-amber-800">Total Weight: <strong>${totalWeight.toFixed(1)}</strong> lbs</span>
                            <button onclick="showAddItemModal()" class="btn-fantasy px-4 py-2 rounded text-sm">
                                <i class="fas fa-plus mr-1"></i>Add Item
                            </button>
                        </div>
                    </div>
                </div>
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div class="lg:col-span-2 parchment scroll-border p-4 fade-in">
                        <div class="section-header"><i class="fas fa-list"></i>All Items</div>
                        <div class="overflow-x-auto">
                            <table class="w-full text-sm">
                                <thead>
                                    <tr class="border-b-2 border-amber-400">
                                        <th class="text-left p-2 text-amber-900">Item</th>
                                        <th class="text-center p-2 text-amber-900">Qty</th>
                                        <th class="text-center p-2 text-amber-900">Wt</th>
                                        <th class="text-center p-2 text-amber-900">Cost</th>
                                        <th class="text-center p-2 text-amber-900">Eq</th>
                                        <th class="text-center p-2 text-amber-900">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${items.length === 0 ? `<tr><td colspan="6" class="text-center p-4 text-amber-700 italic">Inventory is empty</td></tr>` : ''}
                                    ${items.map((item, idx) => `
                                        <tr class="inventory-row border-b border-amber-200">
                                            <td class="p-2">
                                                <div class="font-bold text-amber-900">${item.name}</div>
                                                <div class="text-xs text-amber-700">
                                                    ${item.type}${item.damage ? ` • ${item.damage}${item.bonusDamage ? '+'+item.bonusDamage : ''}` : ''}${item.ac ? ` • AC ${item.ac}` : ''}
                                                    ${item.bonusAttack ? ` • <span class="item-bonus">Atk +${item.bonusAttack}</span>` : ''}
                                                    ${item.bonusDamage ? ` • <span class="item-bonus">Dmg +${item.bonusDamage}</span>` : ''}
                                                    ${item.bonusAC ? ` • <span class="item-bonus">AC +${item.bonusAC}</span>` : ''}
                                                </div>
                                                ${item.special ? `<div class="item-special text-xs">${item.special}</div>` : ''}
                                            </td>
                                            <td class="p-2 text-center">
                                                <input type="number" class="input-fantasy w-12 text-center py-1" value="${item.qty || 1}" 
                                                       onchange="updateItemQty(${idx}, this.value)">
                                            </td>
                                            <td class="p-2 text-center text-amber-800">${(item.weight || 0) * (item.qty || 1)}</td>
                                            <td class="p-2 text-center text-amber-800">${item.cost || 0}gp</td>
                                            <td class="p-2 text-center">
                                                <input type="checkbox" ${item.equipped ? 'checked' : ''} onchange="toggleEquip(${idx})" 
                                                       class="w-4 h-4 accent-amber-700">
                                            </td>
                                            <td class="p-2 text-center">
                                                <button onclick="showEditItemModal(${idx})" class="text-blue-700 hover:text-blue-900 mr-2" title="Edit Item">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                                <button onclick="removeItem(${idx})" class="text-red-700 hover:text-red-900" title="Remove Item">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="space-y-4">
                        <div class="parchment scroll-border p-4 fade-in">
                            <div class="section-header"><i class="fas fa-user-shield"></i>Equipped</div>
                            <div class="space-y-2 text-sm">
                                <div class="bg-amber-100 rounded p-2">
                                    <div class="text-xs text-amber-700">Armor</div>
                                    <div class="font-bold text-amber-900">${equippedArmor ? equippedArmor.name : 'None'}</div>
                                    ${equippedArmor ? `<div class="text-xs">AC ${equippedArmor.ac}${equippedArmor.bonusAC ? ` + ${equippedArmor.bonusAC}` : ''}</div>` : ''}
                                </div>
                                <div class="bg-amber-100 rounded p-2">
                                    <div class="text-xs text-amber-700">Shield</div>
                                    <div class="font-bold text-amber-900">${equippedShield ? equippedShield.name : 'None'}</div>
                                    ${equippedShield && equippedShield.bonusAC ? `<div class="text-xs">AC +${equippedShield.bonusAC}</div>` : ''}
                                </div>
                                <div class="bg-amber-100 rounded p-2">
                                    <div class="text-xs text-amber-700">Weapons</div>
                                    ${equippedWeapons.length ? equippedWeapons.map(w => `
                                        <div class="font-bold text-amber-900">${w.name}</div>
                                        ${w.bonusAttack || w.bonusDamage ? `<div class="text-xs">Atk ${w.bonusAttack ? '+'+w.bonusAttack : '0'}/Dmg ${w.bonusDamage ? '+'+w.bonusDamage : '0'}</div>` : ''}
                                    `).join('') : '<div class="text-amber-700 italic">None</div>'}
                                </div>
                            </div>
                        </div>
                        <div class="parchment scroll-border p-4 fade-in">
                            <div class="section-header"><i class="fas fa-shopping-cart"></i>Quick Add</div>
                            <div class="space-y-2 max-h-96 overflow-y-auto">
                                <div class="text-xs font-bold text-amber-800 border-b border-amber-300 pb-1">Weapons (${DB.weapons.length})</div>
                                ${DB.weapons.map(w => `
                                    <button onclick="addItemToChar('${w.name}', 'weapon')" class="w-full text-left text-sm p-2 hover:bg-amber-200 rounded flex justify-between">
                                        <span>${w.name}</span><span class="text-xs text-amber-700">${w.cost}gp</span>
                                    </button>
                                `).join('')}
                                <div class="text-xs font-bold text-amber-800 border-b border-amber-300 pb-1 mt-2">Armor (${DB.armor.length})</div>
                                ${DB.armor.map(a => `
                                    <button onclick="addItemToChar('${a.name}', 'armor')" class="w-full text-left text-sm p-2 hover:bg-amber-200 rounded flex justify-between">
                                        <span>${a.name}</span><span class="text-xs text-amber-700">${a.cost}gp</span>
                                    </button>
                                `).join('')}
                                <div class="text-xs font-bold text-amber-800 border-b border-amber-300 pb-1 mt-2">Gear (${DB.gear.length})</div>
                                ${DB.gear.map(g => `
                                    <button onclick="addItemToChar('${g.name}', 'gear')" class="w-full text-left text-sm p-2 hover:bg-amber-200 rounded flex justify-between">
                                        <span>${g.name}</span><span class="text-xs text-amber-700">${g.cost}gp</span>
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function addItemToChar(name, type) {
    const item = type === 'weapon' ? DB.weapons.find(w => w.name === name) :
                 type === 'armor' ? DB.armor.find(a => a.name === name) :
                 DB.gear.find(g => g.name === name);
    if (!item) return;
    State.currentCharacter.inventory = State.currentCharacter.inventory || [];
    State.currentCharacter.inventory.push({...item, type, qty: 1, equipped: false});
    Storage.save();
    render();
    toast(`Added ${name}`);
}

function addCustomItem() {
    const name = $('customItemName').value.trim();
    if (!name) return toast('Please enter an item name', 'error');
    const type = $('customItemType').value;
    const qty = parseInt($('customItemQty').value) || 1;
    const weight = parseFloat($('customItemWeight').value) || 0;
    const cost = parseFloat($('customItemCost').value) || 0;
    const special = $('customItemSpecial').value.trim();
    const notes = $('customItemNotes').value.trim();
    
    const item = { name, type, qty, weight, cost, equipped: false, notes: notes || undefined, special: special || undefined };
    
    if (type === 'weapon') {
        item.damage_sm = $('customItemDamageSM').value || '1d6';
        item.damage_l = $('customItemDamageL').value || '1d8';
        item.damage = item.damage_sm;
        item.bonusAttack = parseInt($('customItemAtk').value) || undefined;
        item.bonusDamage = parseInt($('customItemDmg').value) || undefined;
    }
    if (type === 'armor') {
        item.ac = parseInt($('customItemAC').value) || 10;
        item.bonusAC = parseInt($('customItemACBonus').value) || undefined;
    }
    if (type === 'shield') {
        item.ac_bonus = 1;
        item.bonusAC = parseInt($('customItemACBonus').value) || undefined;
    }
    if (type === 'gear' || type === 'misc') {
        item.bonusAC = parseInt($('customItemACBonus').value) || undefined;
    }
    
    if (item.bonusAttack === 0) delete item.bonusAttack;
    if (item.bonusDamage === 0) delete item.bonusDamage;
    if (item.bonusAC === 0) delete item.bonusAC;
    if (item.special === '') delete item.special;
    if (item.notes === '') delete item.notes;
    
    State.currentCharacter.inventory = State.currentCharacter.inventory || [];
    State.currentCharacter.inventory.push(item);
    Storage.save();
    closeModal();
    render();
    toast(`Added ${name}`);
}

function updateItemQty(idx, val) {
    State.currentCharacter.inventory[idx].qty = Math.max(1, parseInt(val) || 1);
    Storage.save();
    render();
}

function toggleEquip(idx) {
    const item = State.currentCharacter.inventory[idx];
    item.equipped = !item.equipped;
    if (item.equipped && (item.type === 'armor' || item.type === 'shield')) {
        State.currentCharacter.inventory.forEach((i, iidx) => {
            if (iidx !== idx && i.type === item.type) i.equipped = false;
        });
    }
    Storage.save();
    render();
}

function removeItem(idx) {
    if (!confirm('Remove this item?')) return;
    State.currentCharacter.inventory.splice(idx, 1);
    Storage.save();
    render();
}

function render() { renderInventory(document.getElementById('app')); }

/* Init */
initApp();
if (!State.currentUser) {
    changeView('login');
} else if (!State.currentCharacter) {
    changeView('dashboard');
} else {
    renderInventory(document.getElementById('app'));
}

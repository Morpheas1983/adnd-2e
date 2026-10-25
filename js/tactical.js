/* tactical.js - Tactical Battle Map */
function renderTacticalMap(container) {
    const isDM = State.isDM;
    const maps = getMapList();
    const activeId = getActiveMapId();
    const mapData = State.tacticalMap || { gridSize: 50, tokens: [], terrain: [], width: 20, height: 15 };
    State.tacticalMap = mapData;

    container.innerHTML = `
        <div class="min-h-screen p-4">
            <div class="max-w-7xl mx-auto">
                <div class="parchment scroll-border p-4 mb-4 fade-in">
                    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                        <div class="flex items-center gap-3">
                            <button onclick="changeView('${isDM ? 'dm_view' : 'dashboard'}')" class="btn-galactic px-3 py-2 rounded text-sm">
                                <i class="fas fa-arrow-left"></i> Back
                            </button>
                            <h1 class="fantasy-font text-2xl font-bold text-amber-900">
                                <i class="fas fa-chess-board mr-2 text-amber-700"></i>Tactical Battle Map
                            </h1>
                        </div>
                        <div class="flex flex-wrap gap-2">
                            <button onclick="setMapTool('select')" class="btn-tool px-3 py-2 rounded text-sm ${State.mapTool==='select'?'btn-fantasy':'btn-galactic'}">
                                <i class="fas fa-mouse-pointer mr-1"></i>Select
                            </button>
                            <button onclick="setMapTool('move')" class="btn-tool px-3 py-2 rounded text-sm ${State.mapTool==='move'?'btn-fantasy':'btn-galactic'}">
                                <i class="fas fa-arrows-alt mr-1"></i>Move
                            </button>
                            ${isDM ? `
                            <button onclick="setMapTool('wall')" class="btn-tool px-3 py-2 rounded text-sm ${State.mapTool==='wall'?'btn-fantasy':'btn-galactic'}">
                                <i class="fas fa-square mr-1"></i>Wall
                            </button>
                            <button onclick="setMapTool('door')" class="btn-tool px-3 py-2 rounded text-sm ${State.mapTool==='door'?'btn-fantasy':'btn-galactic'}">
                                <i class="fas fa-dungeon mr-1"></i>Door
                            </button>
                            <button onclick="setMapTool('water')" class="btn-tool px-3 py-2 rounded text-sm ${State.mapTool==='water'?'btn-fantasy':'btn-galactic'}">
                                <i class="fas fa-water mr-1"></i>Water
                            </button>
                            <button onclick="setMapTool('difficult')" class="btn-tool px-3 py-2 rounded text-sm ${State.mapTool==='difficult'?'btn-fantasy':'btn-galactic'}">
                                <i class="fas fa-mountain mr-1"></i>Difficult
                            </button>
                            <button onclick="setMapTool('erase')" class="btn-tool px-3 py-2 rounded text-sm ${State.mapTool==='erase'?'btn-fantasy':'btn-galactic'}">
                                <i class="fas fa-eraser mr-1"></i>Erase
                            </button>
                            <button onclick="clearMap()" class="btn-danger px-3 py-2 rounded text-sm">
                                <i class="fas fa-trash mr-1"></i>Clear
                            </button>
                            ` : ''}
                        </div>
                    </div>
                </div>

                <!-- Map Manager -->
                <div class="parchment scroll-border p-4 mb-4 fade-in">
                    <div class="flex flex-col md:flex-row gap-3 items-start md:items-center">
                        <div class="flex items-center gap-2">
                            <span class="text-sm font-bold text-amber-900">Saved Maps:</span>
                            <select id="mapSelector" onchange="loadMapById(this.value)" class="input-fantasy px-3 py-2 rounded text-sm" style="min-width:180px">
                                <option value="">-- Select a map --</option>
                                ${maps.map(m => `<option value="${m.id}" ${activeId === m.id ? 'selected' : ''}>${m.name}</option>`).join('')}
                            </select>
                            ${activeId ? `<span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded border border-green-300"><i class="fas fa-check mr-1"></i>Active</span>` : ''}
                        </div>
                        ${isDM ? `
                        <div class="flex items-center gap-2 flex-1">
                            <input type="text" id="mapNameInput" placeholder="Map name..." class="input-fantasy px-3 py-2 rounded text-sm flex-1" style="max-width:200px" value="${activeId ? (maps.find(m=>m.id===activeId)?.name||'') : ''}">
                            <button onclick="saveMapWithName()" class="btn-fantasy px-3 py-2 rounded text-sm">
                                <i class="fas fa-save mr-1"></i>Save
                            </button>
                            <button onclick="deleteMapById(document.getElementById('mapSelector').value)" class="btn-danger px-3 py-2 rounded text-sm" ${!activeId ? 'disabled' : ''}>
                                <i class="fas fa-trash mr-1"></i>Delete
                            </button>
                        </div>
                        ` : ''}
                    </div>
                </div>

                <div class="flex flex-col lg:flex-row gap-4">
                    <!-- Canvas -->
                    <div class="flex-1 min-w-0" style="min-width:0">
                        <div class="parchment scroll-border p-2 fade-in">
                            <div class="tactical-scroll">
                            <canvas id="tacticalCanvas" width="1000" height="750" 
                                    class="w-full border-2 border-amber-400 rounded cursor-crosshair tool-${State.mapTool || 'select'}"
                                    onpointerdown="handleMapPointerDown(event)"
                                    onpointermove="handleMapMouseMove(event)"
                                    onpointerup="handleMapMouseUp(event)"
                                    onpointercancel="handleMapMouseUp(event)"
                                    oncontextmenu="return false">
                            </canvas>
                            </div>
                            <div class="md:hidden text-xs text-amber-700 mt-1 px-1"><i class="fas fa-hand-pointer mr-1"></i>Swipe with the Select tool to pan the map. Use the Move tool to drag tokens.</div>
                        </div>
                        <div class="parchment scroll-border p-3 mt-2 fade-in">
                            <div class="text-sm text-amber-800">
                                <span class="font-bold">Grid:</span> ${mapData.gridSize}px • 
                                <span class="font-bold">Size:</span> ${mapData.width}×${mapData.height} squares • 
                                <span class="font-bold">Scale:</span> 1 square = 5 feet
                            </div>
                            <div class="text-xs text-amber-700 mt-1">
                                <i class="fas fa-info-circle mr-1"></i>
                                ${isDM 
                                    ? 'Select tool: click tokens. Move tool: click-drag tokens. Terrain tools: left-click to draw. Right-click also drags tokens.' 
                                    : 'Right-click and drag your character token (blue circle) to move (on a phone or tablet: pick the Move tool and drag). Click any token to see details and distance.'}
                            </div>
                        </div>
                    </div>

                    <!-- Sidebar -->
                    <div class="w-full lg:w-80 space-y-3">
                        <!-- Token Palette -->
                        <div class="parchment scroll-border p-3 fade-in">
                            <div class="section-header"><i class="fas fa-chess"></i>Token Palette</div>
                            <div class="space-y-2">
                                ${!isDM ? '<p class="text-xs text-amber-700 italic">Only the DM can add tokens. You can move any blue player token.</p>' : ''}
                                <div>
                                    <label class="text-xs font-bold text-amber-800">Players</label>
                                    <div class="flex flex-wrap gap-1 mt-1">
                                        <button onclick="addToken('player', 'PC 1', '#3b82f6')" class="w-8 h-8 rounded-full bg-blue-500 text-white text-xs font-bold" title="PC 1">P1</button>
                                        <button onclick="addToken('player', 'PC 2', '#10b981')" class="w-8 h-8 rounded-full bg-green-500 text-white text-xs font-bold" title="PC 2">P2</button>
                                        <button onclick="addToken('player', 'PC 3', '#f59e0b')" class="w-8 h-8 rounded-full bg-amber-500 text-white text-xs font-bold" title="PC 3">P3</button>
                                        <button onclick="addToken('player', 'PC 4', '#ef4444')" class="w-8 h-8 rounded-full bg-red-500 text-white text-xs font-bold" title="PC 4">P4</button>
                                        <button onclick="addToken('player', 'PC 5', '#8b5cf6')" class="w-8 h-8 rounded-full bg-purple-500 text-white text-xs font-bold" title="PC 5">P5</button>
                                        <button onclick="addToken('player', 'PC 6', '#ec4899')" class="w-8 h-8 rounded-full bg-pink-500 text-white text-xs font-bold" title="PC 6">P6</button>
                                    </div>
                                </div>
                                ${isDM ? `
                                <div>
                                    <label class="text-xs font-bold text-amber-800">Quick Monsters</label>
                                    <div class="flex flex-wrap gap-1 mt-1">
                                        <button onclick="addToken('monster', 'Goblin', '#6b7280')" class="px-2 py-1 rounded bg-gray-500 text-white text-xs">Goblin</button>
                                        <button onclick="addToken('monster', 'Orc', '#6b7280')" class="px-2 py-1 rounded bg-gray-500 text-white text-xs">Orc</button>
                                        <button onclick="addToken('monster', 'Skeleton', '#6b7280')" class="px-2 py-1 rounded bg-gray-500 text-white text-xs">Skeleton</button>
                                        <button onclick="addToken('monster', 'Zombie', '#6b7280')" class="px-2 py-1 rounded bg-gray-500 text-white text-xs">Zombie</button>
                                        <button onclick="addToken('monster', 'Ogre', '#6b7280')" class="px-2 py-1 rounded bg-gray-500 text-white text-xs">Ogre</button>
                                        <button onclick="addToken('monster', 'Dragon', '#6b7280')" class="px-2 py-1 rounded bg-gray-500 text-white text-xs">Dragon</button>
                                    </div>
                                </div>
                                <div>
                                    <label class="text-xs font-bold text-amber-800">Custom Token</label>
                                    <div class="flex gap-1 mt-1">
                                        <input type="text" id="customTokenName" placeholder="Name" class="input-fantasy px-2 py-1 rounded text-xs flex-1">
                                        <select id="customTokenType" class="input-fantasy px-2 py-1 rounded text-xs">
                                            <option value="monster">Monster</option>
                                            <option value="player">Player</option>
                                            <option value="npc">NPC</option>
                                            <option value="object">Object</option>
                                        </select>
                                        <button onclick="addCustomToken()" class="btn-fantasy px-2 py-1 rounded text-xs">Add</button>
                                    </div>
                                </div>
                                ` : ''}
                            </div>
                        </div>

                        <!-- Selected Token Info -->
                        <div class="parchment scroll-border p-3 fade-in">
                            <div class="section-header"><i class="fas fa-info-circle"></i>Selected Token</div>
                            <div id="tokenInfo" class="text-sm text-amber-800">
                                <p class="italic text-amber-600">Click a token to see details</p>
                            </div>
                        </div>

                        <!-- Distance Calculator -->
                        <div class="parchment scroll-border p-3 fade-in">
                            <div class="section-header"><i class="fas fa-ruler"></i>Distance</div>
                            <div id="distanceInfo" class="text-sm text-amber-800">
                                <p class="italic text-amber-600">Select two tokens to calculate distance</p>
                            </div>
                        </div>

                        <!-- Movement -->
                        <div class="parchment scroll-border p-3 fade-in">
                            <div class="section-header"><i class="fas fa-running"></i>Movement</div>
                            <div class="text-xs text-amber-700 space-y-1">
                                <div><span class="font-bold">Normal:</span> 1 square = 5 ft</div>
                                <div><span class="font-bold">Difficult:</span> 2 squares = 5 ft</div>
                                <div><span class="font-bold">Diagonal:</span> 1.5 squares = 5 ft</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Draw the map after a short delay to ensure canvas is in DOM
    setTimeout(() => drawTacticalMap(), 100);
}

function setMapTool(tool) {
    State.mapTool = tool;
    State.mapDragging = false;
    State.mapSelectedToken = null;
    render();
}

function addToken(type, name, color) {
    const map = State.tacticalMap || { gridSize: 50, tokens: [], terrain: [], width: 20, height: 15 };
    const token = {
        id: Date.now() + Math.random(),
        type: type,
        name: name,
        color: color,
        x: Math.floor(map.width / 2),
        y: Math.floor(map.height / 2),
        size: 1
    };
    map.tokens.push(token);
    State.tacticalMap = map;
    drawTacticalMap();
    toast(`${name} added to map`);
}

function addCustomToken() {
    const name = document.getElementById('customTokenName')?.value;
    const type = document.getElementById('customTokenType')?.value || 'monster';
    if (!name) return toast('Enter a token name', 'error');
    const colors = { monster: '#6b7280', player: '#3b82f6', npc: '#f59e0b', object: '#9ca3af' };
    addToken(type, name, colors[type] || '#6b7280');
}

function clearMap() {
    if (!confirm('Clear all tokens and terrain?')) return;
    State.tacticalMap = { gridSize: 50, tokens: [], terrain: [], width: 20, height: 15 };
    drawTacticalMap();
    toast('Map cleared');
}

function saveMap() {
    Storage.save();
    toast('Map saved');
}

function getCanvasCoords(evt) {
    const canvas = document.getElementById('tacticalCanvas');
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        x: (evt.clientX - rect.left) * scaleX,
        y: (evt.clientY - rect.top) * scaleY
    };
}

function getGridSquare(x, y, gridSize) {
    return { x: Math.floor(x / gridSize), y: Math.floor(y / gridSize) };
}

function handleMapPointerDown(evt) {
    // Pointer events cover mouse, touch and pen. Capture so drags keep tracking outside the canvas.
    if (evt.pointerType !== 'mouse') {
        const tool = State.mapTool || 'select';
        if (tool !== 'select') evt.preventDefault();
    }
    try { evt.target.setPointerCapture(evt.pointerId); } catch (e) {}
    handleMapMouseDown(evt);
}

function handleMapMouseDown(evt) {
    const map = State.tacticalMap || { gridSize: 50, tokens: [], terrain: [], width: 20, height: 15 };
    const coords = getCanvasCoords(evt);
    if (!coords) return;
    const grid = getGridSquare(coords.x, coords.y, map.gridSize);
    const tool = State.mapTool || 'select';
    const isDM = State.isDM;
    const token = map.tokens.find(t => t.x === grid.x && t.y === grid.y);

    // Dragging tokens: right-click, shift+click, or move tool left-click
    if (evt.button === 2 || evt.shiftKey || (tool === 'move' && evt.button === 0)) {
        if (token) {
            if (!isDM && token.type !== 'player') {
                toast('You can only move your own character!', 'error');
                return;
            }
            State.mapDragging = true;
            State.draggedToken = token;
            State.dragOffset = { x: coords.x - (token.x * map.gridSize), y: coords.y - (token.y * map.gridSize) };
            if (tool === 'move') State.mapSelectedToken = token;
        }
        return;
    }

    if (tool === 'select') {
        if (token) {
            if (State.mapSelectedToken && State.mapSelectedToken.id !== token.id) {
                const dist = calculateGridDistance(State.mapSelectedToken, token);
                const distEl = document.getElementById('distanceInfo');
                if (distEl) {
                    distEl.innerHTML = `<div class="text-amber-900"><div class="font-bold">${State.mapSelectedToken.name} → ${token.name}</div><div class="text-lg font-bold">${dist.squares} squares</div><div class="text-xs">${dist.feet} feet</div></div>`;
                }
            }
            State.mapSelectedToken = token;
            const infoEl = document.getElementById('tokenInfo');
            if (infoEl) {
                infoEl.innerHTML = `<div class="text-amber-900"><div class="font-bold">${token.name}</div><div class="text-xs">Type: ${token.type} • Position: (${token.x}, ${token.y})</div><div class="text-xs mt-1">${isDM ? 'Select Move tool or right-click drag to move tokens.' : 'Right-click and drag to move your character.'}</div></div>`;
            }
        } else {
            State.mapSelectedToken = null;
            const infoEl = document.getElementById('tokenInfo');
            if (infoEl) infoEl.innerHTML = '<p class="italic text-amber-600">Click a token to see details</p>';
            const distEl = document.getElementById('distanceInfo');
            if (distEl) distEl.innerHTML = '<p class="italic text-amber-600">Select two tokens to calculate distance</p>';
        }
    } else if (tool === 'erase') {
        if (!isDM) { toast('Only the DM can erase tokens.', 'error'); return; }
        map.terrain = map.terrain.filter(t => !(t.x === grid.x && t.y === grid.y));
        map.tokens = map.tokens.filter(t => !(t.x === grid.x && t.y === grid.y));
        State.tacticalMap = map;
        drawTacticalMap();
    } else if (tool === 'move') {
        // handled above
    } else {
        if (!isDM) { toast('Only the DM can edit terrain.', 'error'); return; }
        const terrainTypes = { wall: '#5c4033', door: '#8b6914', water: '#1e40af', difficult: '#92400e' };
        map.terrain = map.terrain.filter(t => !(t.x === grid.x && t.y === grid.y));
        map.terrain.push({ x: grid.x, y: grid.y, type: tool, color: terrainTypes[tool] || '#5c4033' });
        State.tacticalMap = map;
        drawTacticalMap();
    }
}

function handleMapMouseMove(evt) {
    if (!State.mapDragging || !State.draggedToken) return;
    const map = State.tacticalMap || { gridSize: 50 };
    const coords = getCanvasCoords(evt);
    if (!coords) return;
    const grid = getGridSquare(coords.x, coords.y, map.gridSize);
    State.draggedToken.x = Math.max(0, Math.min(grid.x, map.width - 1));
    State.draggedToken.y = Math.max(0, Math.min(grid.y, map.height - 1));
    drawTacticalMap();
}

function handleMapMouseUp(evt) {
    if (State.mapDragging && State.draggedToken) {
        toast(`${State.draggedToken.name} moved to (${State.draggedToken.x}, ${State.draggedToken.y})`);
        Storage.save();
    }
    State.mapDragging = false;
    State.draggedToken = null;
}

function calculateGridDistance(tokenA, tokenB) {
    const dx = Math.abs(tokenA.x - tokenB.x);
    const dy = Math.abs(tokenA.y - tokenB.y);
    const minDist = Math.min(dx, dy);
    const maxDist = Math.max(dx, dy);
    // AD&D 2e: diagonal = 1.5 squares
    const squares = maxDist + Math.floor(minDist / 2);
    const feet = squares * 5;
    return { squares, feet, diagonal: minDist };
}

function drawTacticalMap() {
    const canvas = document.getElementById('tacticalCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const map = State.tacticalMap || { gridSize: 50, tokens: [], terrain: [], width: 20, height: 15 };
    const gs = map.gridSize;

    // Clear
    ctx.fillStyle = '#f5e6c8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#d4a574';
    ctx.lineWidth = 1;
    for (let x = 0; x <= map.width; x++) {
        ctx.beginPath();
        ctx.moveTo(x * gs, 0);
        ctx.lineTo(x * gs, map.height * gs);
        ctx.stroke();
    }
    for (let y = 0; y <= map.height; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * gs);
        ctx.lineTo(map.width * gs, y * gs);
        ctx.stroke();
    }

    // Draw terrain
    map.terrain.forEach(t => {
        ctx.fillStyle = t.color || '#5c4033';
        ctx.fillRect(t.x * gs + 1, t.y * gs + 1, gs - 2, gs - 2);
        // Draw terrain icon
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = `${gs * 0.4}px FontAwesome`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const icons = { wall: '\uf0c8', door: '\uf6aa', water: '\uf773', difficult: '\uf6fc' };
        ctx.fillText(icons[t.type] || '', t.x * gs + gs/2, t.y * gs + gs/2);
    });

    // Draw tokens
    map.tokens.forEach(t => {
        const cx = t.x * gs + gs / 2;
        const cy = t.y * gs + gs / 2;
        const radius = gs * 0.4;

        // Token circle
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = t.color || '#6b7280';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Selection highlight
        if (State.mapSelectedToken && State.mapSelectedToken.id === t.id) {
            ctx.beginPath();
            ctx.arc(cx, cy, radius + 4, 0, Math.PI * 2);
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 3;
            ctx.stroke();
        }

        // Label
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${gs * 0.22}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(t.name.substring(0, 3), cx, cy);
    });

    // Draw distance line if two tokens selected
    if (State.mapSelectedToken) {
        const t = State.mapSelectedToken;
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(t.x * gs + gs/2, t.y * gs + gs/2, gs * 0.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
    }
}

function saveMapWithName() {
    const name = document.getElementById('mapNameInput')?.value.trim();
    if (!name) return toast('Please enter a map name', 'error');
    const maps = getMapList();
    const mapData = State.tacticalMap || { gridSize: 50, tokens: [], terrain: [], width: 20, height: 15 };
    const existing = maps.find(m => m.name === name);
    const entry = { id: existing ? existing.id : Date.now().toString(), name, data: JSON.parse(JSON.stringify(mapData)), savedAt: Date.now() };
    if (existing) {
        const idx = maps.findIndex(m => m.id === existing.id);
        maps[idx] = entry;
    } else {
        maps.push(entry);
    }
    saveMapList(maps);
    setActiveMapId(entry.id);
    Storage.save();
    toast(`Map "${name}" saved!`);
    render();
}

function loadMapById(id) {
    const maps = getMapList();
    const map = maps.find(m => m.id === id);
    if (!map) return toast('Map not found', 'error');
    State.tacticalMap = JSON.parse(JSON.stringify(map.data));
    setActiveMapId(id);
    Storage.save();
    toast(`Map "${map.name}" loaded!`);
    drawTacticalMap();
}

function deleteMapById(id) {
    if (!confirm('Delete this map?')) return;
    let maps = getMapList();
    const map = maps.find(m => m.id === id);
    maps = maps.filter(m => m.id !== id);
    saveMapList(maps);
    if (getActiveMapId() === id) {
        setActiveMapId(null);
        State.tacticalMap = { gridSize: 50, tokens: [], terrain: [], width: 20, height: 15 };
    }
    Storage.save();
    toast(`Map "${map?.name || id}" deleted`);
    render();
}

function setActiveMap(id) {
    setActiveMapId(id);
    const maps = getMapList();
    const map = maps.find(m => m.id === id);
    if (map) {
        State.tacticalMap = JSON.parse(JSON.stringify(map.data));
    }
    Storage.save();
    toast(`Active map: ${map?.name || 'Unknown'}`);
    if (currentPage() === 'tactical') drawTacticalMap();
}

function render() { renderTacticalMap(document.getElementById('app')); }

/* Init */
bootPage({ campaign: true }, () => renderTacticalMap(document.getElementById('app')));

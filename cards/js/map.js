// map.js — map generation, rendering, and navigation

const ACT_NAMES = ['The Mash', 'Fermentation', 'Conditioning'];

// ── Map shape (Slay the Spire style) ──
// Each act is a grid MAP_COLS wide and MAP_FLOORS tall, plus a boss floor.
// MAP_PATHS random paths are walked from the first floor to the last; wherever
// they overlap they merge, wherever they separate you get a fork.
const MAP_FLOORS = 10;
const MAP_COLS   = 7;
const MAP_PATHS  = 6;
const MAP_EXTRA_FORK = 0.6;    // chance a node gets an extra diagonal fork

// Weighted odds for floors that aren't fixed (see assignNodeTypes for the rules)
const NODE_WEIGHTS = {
  battle: 40, event: 14, draft: 10, festival: 9, rest: 8, shop: 7,
  barrel: 3, collab: 3, lab: 3, taproom: 3, contract: 3,
};
// These shouldn't follow themselves on a path
const NO_REPEAT = ['rest', 'shop', 'festival'];

const NODE_ICONS = {
  battle: '⚔',
  draft:  '🃏',
  shop:   '🛒',
  event:  '?',
  rest:     '🛌',
  boss:     '💀',
  festival: '🎪',
  barrel:   '🛢',
  collab:   '🤝',
  lab:      '🔬',
  taproom:  '🍺',
  contract: '📜',
};

const NODE_NAMES = {
  battle:'Rival Brewery', draft:'Draft', shop:'Shop', event:'Event', rest:'Rest Stop', boss:'Act Boss',
  festival:'Beer Festival (elite)', barrel:'Barrel Room', collab:'Collab Brew', lab:'Quality Lab',
  taproom:'Taproom Night', contract:'Supplier Contract',
};

const NODE_COLORS = {
  battle: '#c0392b',
  draft:  '#2980b9',
  shop:   '#f39c12',
  event:  '#8e44ad',
  rest:     '#27ae60',
  boss:     '#e74c3c',
  festival: '#e67e22',
  barrel:   '#a1887f',
  collab:   '#16a085',
  lab:      '#4fc3f7',
  taproom:  '#d4af37',
  contract: '#95a5a6',
};

// ── Run state additions ──
let mapState = {
  act:         0,       // 0,1,2
  currentNode: null,    // { layer, index }
  nodes:       [],      // 3D array [act][layer][index]
  gold:        100,
  visited:     {},      // key: "act-layer-index"
  edges:       [],      // [{from, to}] connections
};

// ── Map generation ──

function generateMap() {
  mapState.nodes = [];
  mapState.edges = [];
  for (let act = 0; act < 3; act++) generateAct(act);
}

function generateAct(act) {
  // 1. Walk random paths across the grid
  const cells = new Set();            // "floor:col" that have a node
  const links = new Set();            // "floor:col>col2" edges between floors
  let firstStart = -1;
  for (let p = 0; p < MAP_PATHS; p++) {
    let col = Math.floor(Math.random() * MAP_COLS);
    // The first two paths start apart, so there's always a real first choice
    if (p === 1) while (col === firstStart) col = Math.floor(Math.random() * MAP_COLS);
    if (p === 0) firstStart = col;
    cells.add(`0:${col}`);
    for (let f = 0; f < MAP_FLOORS - 1; f++) {
      const steps = shuffle([-1, 0, 1]).filter(d => col + d >= 0 && col + d < MAP_COLS);
      // Never cross an existing diagonal edge
      const step = steps.find(d => d === 0 || !links.has(`${f}:${col + d}>${col}`)) ?? 0;
      links.add(`${f}:${col}>${col + step}`);
      col += step;
      cells.add(`${f + 1}:${col}`);
    }
  }

  // 2. Build node objects floor by floor (sorted left to right)
  const actNodes = [];
  for (let f = 0; f < MAP_FLOORS; f++) {
    const cols = [...cells].filter(k => +k.split(':')[0] === f).map(k => +k.split(':')[1]).sort((x, y) => x - y);
    actNodes.push(cols.map((col, idx) => ({
      act, layer: f, index: idx, col, type: null,
      id: `${act}-${f}-${idx}`,
      accessible: f === 0 && act === mapState.act,
    })));
  }
  const at = (f, col) => actNodes[f].find(n => n.col === col);

  // Extra forks: sometimes link a node to a neighbouring node on the next floor too,
  // as long as the new line doesn't cross an existing one
  for (let f = 0; f < MAP_FLOORS - 1; f++) {
    for (const node of actNodes[f]) {
      if (Math.random() >= MAP_EXTRA_FORK) continue;
      for (const d of shuffle([-1, 1])) {
        const c2 = node.col + d;
        if (!at(f + 1, c2) || links.has(`${f}:${node.col}>${c2}`)) continue;
        if (links.has(`${f}:${c2}>${node.col}`)) continue;                 // would cross
        links.add(`${f}:${node.col}>${c2}`);
        break;
      }
    }
  }
  links.forEach(k => {
    const [f, rest] = k.split(':');
    const [c1, c2] = rest.split('>').map(Number);
    mapState.edges.push({ from: at(+f, c1).id, to: at(+f + 1, c2).id });
  });

  // 3. Boss floor: one node, every last-floor node leads to it
  const boss = { act, layer: MAP_FLOORS, index: 0, col: (MAP_COLS - 1) / 2, type: 'boss', id: `${act}-${MAP_FLOORS}-0` };
  actNodes.push([boss]);
  actNodes[MAP_FLOORS - 1].forEach(n => mapState.edges.push({ from: n.id, to: boss.id }));

  mapState.nodes.push(actNodes);
  assignNodeTypes(act, actNodes);
  actNodes.flat().forEach(n => { n.rival = assignRival(n); n.rivalSize = rivalSizeFor(n); });
}

function parentsOf(node) {
  return mapState.edges.filter(e => e.to === node.id).map(e => findNodeById(e.from)).filter(Boolean);
}
function childrenOf(node) {
  return mapState.edges.filter(e => e.from === node.id).map(e => findNodeById(e.to)).filter(Boolean);
}

// Room rules, modeled on Slay the Spire:
//   • floor 1 is always a fight, the floor before the boss is always a rest stop
//   • no festivals (elites) or rests on the first 3 floors, no shops on the first 2
//   • rests, shops and festivals never follow themselves on a path
//   • nodes that share a parent are different types, so forks are real choices
function assignNodeTypes(act, actNodes) {
  for (let f = 0; f < MAP_FLOORS; f++) {
    for (const node of actNodes[f]) {
      if (f === 0)              { node.type = 'battle'; continue; }
      if (f === MAP_FLOORS - 1) { node.type = 'rest';   continue; }
      const banned = new Set();
      if (f < 3) { banned.add('festival'); banned.add('rest'); }
      if (f < 2) banned.add('shop');
      if (f === MAP_FLOORS - 2) banned.add('rest');            // a rest row is coming
      const parents = parentsOf(node);
      parents.forEach(p => { if (NO_REPEAT.includes(p.type)) banned.add(p.type); });
      // Siblings: other children of my parents that already have a type
      parents.forEach(p => childrenOf(p).forEach(c => { if (c !== node && c.type) banned.add(c.type); }));
      node.type = weightedPick(NODE_WEIGHTS, banned);
    }
  }
}

function weightedPick(weights, banned) {
  const opts = Object.entries(weights).filter(([t]) => !banned.has(t));
  if (!opts.length) return 'battle';
  let r = Math.random() * opts.reduce((s, [, w]) => s + w, 0);
  for (const [t, w] of opts) { r -= w; if (r <= 0) return t; }
  return opts[opts.length - 1][0];
}

function getBossNode(act) {
  const floors = mapState.nodes[act];
  return floors ? floors[floors.length - 1][0] : null;
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function getNode(act, layer, index) {
  return mapState.nodes[act]?.[layer]?.[index];
}

function isVisited(node) {
  return !!mapState.visited[node.id];
}

function isAccessible(node) {
  // First layer of current act is always accessible
  if (node.layer === 0 && node.act === mapState.act) return true;
  // Must be reachable via a forward edge from a visited node
  return mapState.edges.some(e =>
    e.to === node.id &&
    mapState.visited[e.from]
  );
}

function canVisit(node) {
  // Can only visit if accessible and not already visited
  // Also enforce forward-only: layer must be > current node's layer
  if (isVisited(node)) return false;
  if (!isAccessible(node)) return false;
  // Enforce forward movement — can't go to a lower or equal layer
  if (mapState.currentNode && node.layer <= mapState.currentNode.layer) return false;
  return true;
}

function markVisited(node) {
  mapState.visited[node.id] = true;
  mapState.currentNode = node;
}

// ── Map Screen ──

function showMapScreen() {
  setScreen('map-screen');
  saveRun({ screen: 'map' });
  setTimeout(() => renderMap(), 50);
}

function renderMap() {
  const act      = mapState.act;
  const actNodes = mapState.nodes[act];
  const el       = document.getElementById('map-container');
  if (!el || !actNodes) return;

  document.getElementById('map-gold').textContent      = `💰 ${mapState.gold}`;
  const bossNode = actNodes[actNodes.length - 1][0];
  const boss     = bossNode && getRivalDef(bossNode.rival);
  document.getElementById('map-act-name').textContent  = ACT_NAMES[act] + (boss ? ` — 💀 ${boss.name}` : '');
  document.getElementById('map-deck-count').textContent= `🃏 ${draftState.deck.length} cards`;
  const repEl = document.getElementById('map-rep');
  if (repEl) {
    repEl.textContent = `⭐ ${mapState.rep}/${mapState.maxRep}`;
    repEl.style.color = mapState.rep <= mapState.maxRep * 0.3 ? 'var(--red)' : 'var(--gold)';
  }
  const extras = [];
  if (mapState.barrel && mapState.barrel.length) extras.push(`🛢 ${mapState.barrel.length} aging`);
  if (mapState.contract) extras.push(`📜 ${mapState.contract} contract`);
  const extraEl = document.getElementById('map-extras');
  const bDef = BREWERIES.find(b => b.id === runBrewery());
  const bIcon = bDef ? `<span class="relic-icon" title="${bDef.name} — Passive: ${bDef.passive} | Ability: ${bDef.ability.name}: ${bDef.ability.desc} | Perk: ${bDef.perk}">${bDef.icon}</span>` : '';
  if (extraEl) extraEl.innerHTML = bIcon + ' ' + extras.join(' ') + ' ' + relicIconsHtml();
  const noticeEl = document.getElementById('map-notice');
  if (noticeEl) { noticeEl.textContent = mapState.notice || ''; mapState.notice = ''; }

  const W      = Math.min(Math.max(el.offsetWidth || 0, 320), 640);
  const layers = actNodes.length;
  const layerH = 68;
  const H      = layers * layerH + 40;
  const pos    = n => ({ x: nodeX(n, W), y: nodeY(n.layer, H, layers) });
  const choices = new Set(actNodes.flat().filter(canVisit).map(n => n.id));

  let svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg" style="display:block;margin:0 auto;">`;

  // Edges: your path solid purple, the ways you can go next bright gold, the rest faint
  mapState.edges.forEach(edge => {
    const from = findNodeById(edge.from), to = findNodeById(edge.to);
    if (!from || !to || from.act !== act) return;
    const a = pos(from), b = pos(to);
    const walked = mapState.visited[edge.from] && mapState.visited[edge.to];
    const next   = choices.has(edge.to) && !!mapState.currentNode && mapState.currentNode.id === edge.from;
    const stroke = walked ? '#6c63ff' : next ? '#ffd700' : '#4a4a72';
    svg += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${stroke}"
      stroke-width="${walked || next ? 2.5 : 1.2}" stroke-dasharray="${walked || next ? 'none' : '3,4'}"
      opacity="${walked || next ? 0.95 : 0.7}"/>`;
  });

  // Nodes
  actNodes.flat().forEach(node => {
    const { x, y } = pos(node);
    const visited  = isVisited(node);
    const canClick = choices.has(node.id);
    const color    = NODE_COLORS[node.type] || '#555';
    const icon     = NODE_ICONS[node.type]  || '?';
    const r        = node.type === 'boss' ? 22 : 15;
    const stroke   = visited ? '#ffd700' : canClick ? color : '#3a3a5e';
    const opacity  = canClick || visited ? 1 : 0.8;   // the whole act stays readable for route planning
    const isHere   = mapState.currentNode && mapState.currentNode.id === node.id;

    svg += `<g transform="translate(${x},${y})" opacity="${opacity}" ${isHere || (canClick && !mapState.currentNode) ? 'data-focus="1"' : ''}
      ${canClick ? `onclick="clickMapNode('${node.id}')" style="cursor:pointer"` : ''}>
      <title>${nodeTooltip(node)}</title>
      ${canClick ? `<circle r="${r + 5}" fill="none" stroke="${color}" stroke-width="1.5" class="map-node-pulse"/>` : ''}
      <circle r="${r}" fill="${visited ? '#1a1a2e' : '#12121f'}" stroke="${stroke}" stroke-width="${visited || canClick ? 2.5 : 1.2}"/>
      <text text-anchor="middle" dominant-baseline="central" font-size="${node.type === 'boss' ? 14 : 11}"
        fill="${visited ? '#ffd700' : canClick ? color : '#666'}">${icon}</text>
      ${node.type === 'boss'
        ? `<text text-anchor="middle" y="${r + 12}" font-size="7" fill="#e74c3c" font-family="monospace">${(getRivalDef(node.rival) || {}).short || ''}</text>`
        : ''}
    </g>`;
  });

  svg += '</svg>';

  // Legend: only the room types in this act
  const types = [...new Set(actNodes.flat().map(n => n.type))];
  const legend = `<div class="map-legend">${types.map(t =>
    `<span style="color:${NODE_COLORS[t]}">${NODE_ICONS[t]} ${NODE_NAMES[t]}</span>`).join('')}</div>`;

  el.innerHTML = legend + svg;

  // Keep where you are (or your first choice) in view
  const focus = el.querySelector ? el.querySelector('[data-focus]') : null;
  if (focus && focus.scrollIntoView) focus.scrollIntoView({ block: 'center', behavior: 'smooth' });
}

function nodeTooltip(node) {
  const base = NODE_NAMES[node.type] || node.type;
  const r = node.rival && getRivalDef(node.rival);
  if (!r) return base;
  const trait = r.traitName ? ` | ${r.traitName}: ${r.traitDesc}` : '';
  return `${base}: ${r.name} (${r.style}, ${node.rivalSize} cards)${trait}`;
}

// Horizontal position comes from the node's grid column, with a small fixed
// wobble so the map looks hand-drawn rather than ruled.
function nodeX(node, W) {
  const padding = 40;
  const floor = mapState.nodes[node.act][node.layer];
  const col = node.col !== undefined ? node.col
            : floor.length > 1 ? node.index / (floor.length - 1) * (MAP_COLS - 1)
            : (MAP_COLS - 1) / 2;                           // older saves without columns
  const wobble = node.type === 'boss' ? 0 : ((node.layer * 7 + Math.round(col) * 13) % 9) - 4;
  return padding + (col / (MAP_COLS - 1)) * (W - padding * 2) + wobble;
}

function nodeY(layer, H, totalLayers) {
  const padding = 30;
  return padding + (layer / (totalLayers - 1)) * (H - padding * 2);
}

function clickMapNode(nodeId) {
  const [act, layer, index] = nodeId.split('-').map(Number);
  const node = getNode(act, layer, index);
  if (!node || !canVisit(node)) return;
  markVisited(node);
  mapState.nodeCount = (mapState.nodeCount || 0) + 1;
  checkBarrel();
  saveRun({ screen: 'node', nodeId: node.id });   // a refresh re-enters this node
  handleNode(node);
}

// ── Node handlers ──

function handleNode(node) {
  switch (node.type) {
    case 'battle':
    case 'boss':
    case 'festival':
      startMapBattle(node);
      break;
    case 'barrel':   showBarrelRoom(); break;
    case 'collab':   showCollab();     break;
    case 'lab':      showLab();        break;
    case 'taproom':  showTaproom();    break;
    case 'contract': showContract();   break;
    case 'draft':
      showMapDraft(node);
      break;
    case 'shop':
      showMapShop(node);
      break;
    case 'event':
      showMapEvent(node);
      break;
    case 'rest':
      showMapRest(node);
      break;
  }
}

// ── Battle node ──

function startMapBattle(node) {
  // Build rival deck scaled to node.rivalSize
  const rivalDeck = buildRivalDeck(node.rival, node.rivalSize, node.act, node.type === 'boss');
  const rival     = getRivalDef(node.rival);

  setScreen('game-screen');
  // Festival rivals are crowd favorites; Old Town Brewpub has its regulars
  let rivalBonus = 0, rivalBonusName = '';
  if (node.type === 'festival')            { rivalBonus = 10; rivalBonusName = 'Crowd Favorite'; }
  if (rival && rival.trait === 'regulars') { rivalBonus = 15; rivalBonusName = 'The Regulars'; }
  initGame({ rivalDeck, node, rival, rivalBonus, rivalBonusName });
}

function initGameWithRival(rivalDeck, node) {
  initGame({ rivalDeck, node });
}

// ── Draft node ──

function showMapDraft(node) {
  setScreen('map-draft-screen');
  mapDraftState.node    = node;
  mapDraftState.offer   = generateMapOffer();
  renderMapDraft();
}

let mapDraftState = { node: null, offer: [] };

function generateMapOffer() {
  const counts = {};
  draftState.deck.forEach(c => counts[c.id] = (counts[c.id] || 0) + 1);
  // A supplier contract focuses the next offer on one category, with 4 picks
  const contract = mapState.contract;
  // Hop House run perk: one extra option on every card offer
  const size = (contract ? 4 : 3) + (runBrewery() === 'hophouse' ? 1 : 0);
  mapState.contract = null;
  const pool = CARD_POOL.filter(c =>
    (counts[c.id] || 0) < MAX_COPIES && c.cat !== 'token' && (!contract || c.cat === contract)
  );
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const seen = new Set();
  const offer = [];
  for (const c of shuffled) {
    if (!seen.has(c.id)) { seen.add(c.id); offer.push({ ...c }); }
    if (offer.length >= size) break;
  }
  return offer;
}

// Festival prize: premium (cost 3+) cards
function generateRareOffer() {
  const pool = CARD_POOL.filter(c => c.cost >= 3 && c.cat !== 'token' && copiesInDeck(c.id) < MAX_COPIES);
  return shuffle(pool).slice(0, 3 + (runBrewery() === 'hophouse' ? 1 : 0)).map(c => ({ ...c }));
}

function pickMapCard(idx) {
  const card = mapDraftState.offer[idx];
  if (!card) return;
  if (draftState.deck.length >= MAX_DECK_SIZE) {
    document.getElementById('map-draft-msg').textContent = `Deck is full (${MAX_DECK_SIZE}/${MAX_DECK_SIZE})!`;
    return;
  }
  draftState.deck.push({ ...card });
  showMapScreen();
}

function skipMapDraft() {
  showMapScreen();
}

function renderMapDraft() {
  const el = document.getElementById('map-draft-offer');
  el.innerHTML = mapDraftState.offer.map((c, i) => {
    const pts  = c.points >= 0 ? `+${c.points}` : `${c.points}`;
    const lane = c.lane === 'both' ? 'HOT/COLD' : c.lane === 'hot' ? 'HOT SIDE' : 'COLD SIDE';
    return `<div class="card cat-${c.cat}" onclick="pickMapCard(${i})" style="width:130px;">
      <div class="card-cost-gem">${c.cost}</div>
      <div class="card-pts-gem">${pts}</div>
      <div class="card-art">${catIcon(c.cat)}</div>
      <div class="card-name-banner">${c.name}</div>
      <div class="card-tags-row">${tagHtml(c.tags)}</div>
      <div class="card-effect-text">${c.desc || ''}</div>
      <div class="card-restrict">${lane}</div>
    </div>`;
  }).join('');
  document.getElementById('map-draft-count').textContent =
    `${draftState.deck.length} / ${MAX_DECK_SIZE} cards`;
}

// ── Shop node ──

function showMapShop(node) {
  setScreen('map-shop-screen');
  shopInventory   = generateShopInventory();
  shopRemovalUsed = false;
  shopRemoving    = false;
  renderMapShop();
}

function generateShopInventory() {
  const shuffled = [...CARD_POOL]
    .filter(c => c.cat !== 'token' && copiesInDeck(c.id) < MAX_COPIES)
    .sort(() => Math.random() - 0.5)
    .slice(0, 6);
  return shuffled.map(c => ({
    ...c,
    price: getCardPrice(c),
  }));
}

function getCardPrice(c) {
  const base = c.cost * 8 + c.points / 3;
  return Math.round(base / 5) * 5 || 5;
}

let shopInventory   = [];
let shopRemovalUsed = false;   // one cleanout per shop visit
let shopRemoving    = false;   // is the removal picker open?

function getRemovalPrice() {
  return 50 + 25 * (mapState.removals || 0);
}

function renderMapShop() {
  document.getElementById('shop-gold').textContent = `💰 ${mapState.gold} gold`;
  renderShopRemoval();
  const el = document.getElementById('map-shop-items');
  document.getElementById('shop-gold').textContent = `💰 ${mapState.gold} gold`;
  el.innerHTML = shopInventory.map((c, i) => {
    const canAfford = mapState.gold >= c.price;
    const full      = draftState.deck.length >= MAX_DECK_SIZE;
    const maxed     = copiesInDeck(c.id) >= MAX_COPIES;
    const disabled  = !canAfford || full || maxed;
    const pts       = c.points >= 0 ? `+${c.points}` : `${c.points}`;
    const lane      = c.lane === 'both' ? 'HOT/COLD' : c.lane === 'hot' ? 'HOT SIDE' : 'COLD SIDE';
    return `<div class="card cat-${c.cat} ${disabled ? 'card-disabled' : ''}"
      onclick="${disabled ? 'void(0)' : `buyCard(${i})`}"
      style="width:110px;position:relative;">
      <div class="card-cost-gem">${c.cost}</div>
      <div class="card-pts-gem">${pts}</div>
      <div class="card-art">${catIcon(c.cat)}</div>
      <div class="card-name-banner">${c.name}</div>
      <div class="card-tags-row">${tagHtml(c.tags)}</div>
      <div class="card-effect-text">${c.desc || ''}</div>
      <div class="card-restrict">${lane}</div>
      <div class="shop-price ${canAfford ? '' : 'cant-afford'}">💰 ${c.price}</div>
    </div>`;
  }).join('');
}

function buyCard(idx) {
  const card = shopInventory[idx];
  if (!card) return;
  if (mapState.gold < card.price) return;
  if (draftState.deck.length >= MAX_DECK_SIZE) return;
  if (copiesInDeck(card.id) >= MAX_COPIES) return;
  mapState.gold -= card.price;
  const bought = { ...card };
  delete bought.price;
  draftState.deck.push(bought);
  shopInventory.splice(idx, 1);
  renderMapShop();
}

function leaveShop() {
  shopInventory = [];
  showMapScreen();
}

// ── Card removal (shared by shop and rest) ──

function canRemoveCard() {
  return draftState.deck.length > MIN_DECK_SIZE;
}

// Renders the deck as a clickable list. onPick is the name of a global function taking an index.
function deckPickerHtml(onPick, rowExtra) {
  return draftState.deck
    .map((c, i) => ({ c, i }))
    .sort((a, b) => a.c.cat.localeCompare(b.c.cat) || a.c.name.localeCompare(b.c.name))
    .map(({ c, i }) => {
      const pts = c.points >= 0 ? `+${c.points}` : `${c.points}`;
      const extra = rowExtra ? rowExtra(c) : { html: pts, disabled: false };
      return `<div class="deck-list-row" ${extra.disabled ? 'style="padding:6px 8px;opacity:0.4;cursor:default;"'
                                                         : `onclick="${onPick}(${i})" style="cursor:pointer;padding:6px 8px;"`}>
        <span class="deck-list-count" style="color:${catColor(c.cat)}">${catIcon(c.cat)}</span>
        <span class="deck-list-name">${c.name}${c._upgraded ? ' ★' : ''}</span>
        <span style="font-size:7px;color:var(--dim);">${extra.html}</span>
      </div>`;
    }).join('');
}

function renderShopRemoval() {
  const el = document.getElementById('shop-removal');
  if (!el) return;
  const price = getRemovalPrice();
  if (shopRemovalUsed) {
    el.innerHTML = `<div style="font-size:7px;color:var(--dim);">🧹 Cellar cleaned out. Come back next shop.</div>`;
  } else if (!canRemoveCard()) {
    el.innerHTML = `<div style="font-size:7px;color:var(--dim);">🧹 Your deck is at the minimum (${MIN_DECK_SIZE}) — nothing to clean out.</div>`;
  } else if (shopRemoving) {
    el.innerHTML = `<div style="font-size:8px;color:var(--gold);margin-bottom:6px;">Choose a card to remove (💰 ${price})</div>
      <div class="removal-list">${deckPickerHtml('shopRemoveCard')}</div>
      <button class="btn btn-primary" style="margin-top:6px;" onclick="shopRemoving=false;renderMapShop();">Cancel</button>`;
  } else {
    const afford = mapState.gold >= price;
    el.innerHTML = `<button class="btn ${afford ? 'btn-gold' : 'btn-primary'}" ${afford ? '' : 'style="opacity:0.4;cursor:not-allowed;"'}
      onclick="${afford ? 'shopRemoving=true;renderMapShop();' : 'void(0)'}">🧹 CLEAN OUT THE CELLAR — remove a card (💰 ${price})</button>`;
  }
}

function shopRemoveCard(idx) {
  const price = getRemovalPrice();
  if (shopRemovalUsed || !canRemoveCard() || mapState.gold < price) return;
  const [removed] = draftState.deck.splice(idx, 1);
  mapState.gold -= price;
  mapState.removals = (mapState.removals || 0) + 1;
  shopRemovalUsed = true;
  shopRemoving    = false;
  renderMapShop();
  const msg = document.getElementById('shop-removal');
  if (msg && removed) msg.innerHTML = `<div style="font-size:8px;color:var(--green);">🧹 ${removed.name} removed from your deck.</div>`;
}

// ── Event node ──

// ── Event pickers: options where the player chooses cards ──
const BULK_MALT_PRICE = 10;
const BULK_MALT_MAX   = 3;
let bulkBought = [];

function bulkMaltChoices() {
  return BASE_MALT_IDS.map(getCardDef).filter(c => c && copiesInDeck(c.id) < MAX_COPIES);
}

function showBulkMaltPicker() {
  const left   = BULK_MALT_MAX - bulkBought.length;
  const canBuy = left > 0 && mapState.gold >= BULK_MALT_PRICE && draftState.deck.length < MAX_DECK_SIZE;
  document.getElementById('event-result').textContent =
    `Picked ${bulkBought.length}/${BULK_MALT_MAX} · 💰 ${mapState.gold} gold` +
    (bulkBought.length ? ` · ${bulkBought.join(', ')}` : '');
  document.getElementById('event-options').innerHTML =
    (canBuy ? `<div class="special-cards">${bulkMaltChoices().map(c =>
      specialCardHtml(c, `buyBulkMalt('${c.id}')`)).join('')}</div>` : '') +
    `<button class="btn btn-gold" onclick="finishEvent(bulkBought.length ? 'Added ' + bulkBought.join(', ') + ' to your deck!' : 'You passed on the deal.')">${bulkBought.length ? 'Done' : 'Never mind'}</button>`;
}

function buyBulkMalt(id) {
  const c = getCardDef(id);
  if (!c || bulkBought.length >= BULK_MALT_MAX || mapState.gold < BULK_MALT_PRICE) return;
  if (copiesInDeck(id) >= MAX_COPIES || draftState.deck.length >= MAX_DECK_SIZE) return;
  mapState.gold -= BULK_MALT_PRICE;
  draftState.deck.push({ ...c });
  bulkBought.push(c.name);
  showBulkMaltPicker();
}

function showHopSalePicker() {
  document.getElementById('event-result').textContent = 'Which hop do you sell for 30 gold?';
  document.getElementById('event-options').innerHTML =
    `<div class="removal-list" style="width:100%;max-width:400px;">${deckPickerHtml('sellHop', c => c.cat === 'hop'
      ? { html: '<span style="color:var(--gold)">sell +30</span>', disabled: false }
      : { html: '', disabled: true })}</div>
     <button class="btn btn-primary" onclick="renderMapEvent()">← Back</button>`;
}

function sellHop(idx) {
  const c = draftState.deck[idx];
  if (!c || c.cat !== 'hop' || !canRemoveCard()) return;
  draftState.deck.splice(idx, 1);
  mapState.gold += 30;
  finishEvent(`Sold ${c.name} for 30 gold!`);
}

const MAP_EVENTS = [
  {
    title: 'Mystery Grain Delivery',
    desc: 'A shipment arrives with no label. Could be amazing, could be terrible.',
    options: [
      { label: 'Accept it (add random card)', action: () => {
        const pool = CARD_POOL.filter(c => copiesInDeck(c.id) < MAX_COPIES);
        const card = pool[Math.floor(Math.random() * pool.length)];
        if (!card || draftState.deck.length >= MAX_DECK_SIZE) return 'The shipment was empty. Odd.';
        draftState.deck.push({ ...card });
        return `Added ${card.name} to your deck!`;
      }},
      { label: 'Decline', action: () => 'You turned it down. Safe choice.' },
    ]
  },
  {
    title: 'Hop Shortage',
    desc: 'Your hop supplier is out of stock. Sell a hop card for gold?',
    options: [
      { label: 'Sell a hop of your choice (+30 gold)',
        can: () => canRemoveCard() && draftState.deck.some(c => c.cat === 'hop'),
        picker: () => showHopSalePicker() },
      { label: 'Keep your hops', action: () => 'You held on to your hops.' },
    ]
  },
  {
    title: 'Brewery Inspection',
    desc: 'A health inspector arrives unexpectedly. Pay them off or risk losing a card.',
    options: [
      { label: 'Pay 25 gold', can: () => mapState.gold >= 25, action: () => {
        mapState.gold -= 25;
        return 'Paid 25 gold. Inspector satisfied.';
      }},
      { label: 'Risk it (50%: lose a random card)', action: () => {
        if (Math.random() < 0.5) return 'The inspector found nothing. Lucky!';
        if (!canRemoveCard()) return 'The inspector took pity on your tiny brewery.';
        const idx = Math.floor(Math.random() * draftState.deck.length);
        const lost = draftState.deck.splice(idx, 1)[0];
        return `The inspector confiscated ${lost.name}!`;
      }},
    ]
  },
  {
    title: 'Fermentation Festival',
    desc: 'A local festival is offering prizes for experimental beers.',
    options: [
      { label: 'Enter (+20 gold, add wild yeast)', action: () => {
        mapState.gold += 20;
        if (draftState.deck.length < MAX_DECK_SIZE && copiesInDeck('brett') < MAX_COPIES) {
          draftState.deck.push({ ...getCardDef('brett') });
          return 'Won 20 gold and a Brettanomyces card!';
        }
        return 'Won 20 gold!';
      }},
      { label: 'Skip the festival', action: () => 'You stayed home and brewed quietly.' },
    ]
  },
  {
    title: 'Bulk Grain Deal',
    desc: 'A supplier offers you a deal on base malts.',
    options: [
      { label: `Choose up to ${BULK_MALT_MAX} base malts (${BULK_MALT_PRICE} gold each)`,
        can: () => mapState.gold >= BULK_MALT_PRICE && bulkMaltChoices().length > 0 && draftState.deck.length < MAX_DECK_SIZE,
        picker: () => { bulkBought = []; showBulkMaltPicker(); } },
      { label: 'Pass', action: () => 'You passed on the deal.' },
    ]
  },
];

let currentEvent = null;

function showMapEvent(node) {
  currentEvent = MAP_EVENTS[Math.floor(Math.random() * MAP_EVENTS.length)];
  setScreen('map-event-screen');
  renderMapEvent();
}

function renderMapEvent() {
  document.getElementById('event-title').textContent  = currentEvent.title;
  document.getElementById('event-desc').textContent   = currentEvent.desc;
  document.getElementById('event-result').textContent = '';
  const el = document.getElementById('event-options');
  // Options you can't take (not enough gold, deck too small) are shown greyed out
  el.innerHTML = eventOptions().map((opt, i) => (!opt.can || opt.can())
    ? `<button class="btn btn-primary" onclick="chooseEvent(${i})">${opt.label}</button>`
    : `<button class="btn btn-primary" style="opacity:0.4;cursor:not-allowed;">${opt.label}</button>`
  ).join('');
}

// Wild Cellar run perk: every event gets an extra gamble
const WILD_EVENT_OPTION = {
  label: '🦠 Let it ferment wild (50%: +40 gold · 50%: −10 Reputation)',
  can: () => mapState.rep > 10,
  action: () => {
    if (Math.random() < 0.5) { mapState.gold += 40; return 'The wild yeast worked its magic. +40 gold!'; }
    mapState.rep -= 10;
    return `It went sideways. −10 Reputation (⭐ ${mapState.rep}).`;
  },
};

function eventOptions() {
  return runBrewery() === 'wildcellar' ? [...currentEvent.options, WILD_EVENT_OPTION] : currentEvent.options;
}

function chooseEvent(idx) {
  const opt = eventOptions()[idx];
  if (!opt || (opt.can && !opt.can())) return;
  if (opt.picker) { opt.picker(); return; }          // options where you choose a card
  finishEvent(opt.action());
}

function finishEvent(result) {
  document.getElementById('event-result').textContent = result;
  document.getElementById('event-options').innerHTML =
    `<button class="btn btn-gold" onclick="showMapScreen()">Continue →</button>`;
}

// ── Rest node ──

const REST_UPGRADE = 5;

// Lagerhaus run perk: bigger rest-stop upgrades
function restUpgradeAmount() {
  return runBrewery() === 'lagerhaus' ? 8 : REST_UPGRADE;
}

function showMapRest(node) {
  setScreen('map-rest-screen');
  document.getElementById('rest-result').textContent = '';
  document.getElementById('rest-card-list').innerHTML = '';
  document.getElementById('rest-card-list').style.display = 'none';
  document.getElementById('rest-sub').textContent = 'Take a breather. Choose one:';
  const removeOk = canRemoveCard();
  const missing  = mapState.maxRep - mapState.rep;
  document.getElementById('rest-choices').innerHTML = `
    <button class="btn btn-gold" ${missing > 0 ? 'onclick="restRecover()"' : 'style="opacity:0.4;cursor:not-allowed;"'}>😌 RECOVER<br><span style="font-size:6px;">${missing > 0 ? `+${Math.min(REST_HEAL, missing)} reputation (⭐ ${mapState.rep}/${mapState.maxRep})` : 'reputation is full'}</span></button>
    <button class="btn btn-gold" onclick="renderMapRest('upgrade')">⬆ UPGRADE A CARD<br><span style="font-size:6px;">+${restUpgradeAmount()} pts for the rest of the run</span></button>
    <button class="btn btn-primary" ${removeOk ? `onclick="renderMapRest('remove')"` : 'style="opacity:0.4;cursor:not-allowed;"'}>🧹 REMOVE A CARD<br><span style="font-size:6px;">${removeOk ? 'trim your deck for free' : `deck is at minimum (${MIN_DECK_SIZE})`}</span></button>`;
  document.getElementById('rest-confirm').innerHTML =
    `<button class="btn btn-primary" onclick="showMapScreen()">Skip</button>`;
}

function renderMapRest(mode) {
  const list = document.getElementById('rest-card-list');
  document.getElementById('rest-choices').innerHTML = '';
  list.style.display = '';
  document.getElementById('rest-confirm').innerHTML =
    `<button class="btn btn-primary" onclick="showMapRest()">← Back</button>`;
  if (mode === 'upgrade') {
    document.getElementById('rest-sub').textContent = `Choose a card to upgrade (+${restUpgradeAmount()} pts for this run)`;
    list.innerHTML = deckPickerHtml('upgradeCard', c => {
      const pts = c.points >= 0 ? `+${c.points}` : `${c.points}`;
      return c._upgraded
        ? { html: `${pts} (already upgraded)`, disabled: true }
        : { html: `<span style="color:var(--green)">${pts} → +${c.points + restUpgradeAmount()}</span>`, disabled: false };
    });
  } else {
    document.getElementById('rest-sub').textContent = 'Choose a card to remove from your deck';
    list.innerHTML = deckPickerHtml('restRemoveCard', c => ({ html: '<span style="color:var(--red)">remove</span>', disabled: false }));
  }
}

function finishRest(message) {
  document.getElementById('rest-result').textContent = message;
  document.getElementById('rest-card-list').innerHTML = '';
  document.getElementById('rest-card-list').style.display = 'none';
  document.getElementById('rest-confirm').innerHTML =
    `<button class="btn btn-gold" onclick="showMapScreen()">Continue →</button>`;
}

function restRecover() {
  const healed = healRep(REST_HEAL);
  finishRest(`A good night's sleep. +${healed} reputation (⭐ ${mapState.rep}/${mapState.maxRep}).`);
}

function upgradeCard(idx) {
  const card = draftState.deck[idx];
  if (!card || card._upgraded) return;
  const bonus = restUpgradeAmount();
  card.points += bonus;
  card._upgraded = true;
  card._upgradeBonus = bonus;
  finishRest(`${card.name} upgraded to +${card.points} pts!`);
}

function restRemoveCard(idx) {
  if (!canRemoveCard()) return;
  const [card] = draftState.deck.splice(idx, 1);
  if (card) finishRest(`${card.name} removed from your deck.`);
}

// ── Act transition ──

function advanceAct() {
  mapState.act++;
  mapState.currentNode = null;
  if (mapState.act >= 3) {
    showFinalJudging();
  } else {
    // Make act 0 layer accessible
    mapState.nodes[mapState.act][0].forEach(n => n.accessible = true);
    showMapScreen();
  }
}

function showFinalJudging() {
  // Build a full 30 card rival for the final boss
  const rivalDeck = shuffle(buildEnemyDeck());
  const fakeNode  = { type:'boss', rivalSize:30, id:'final-boss', layer:99, act:99 };
  initGameWithRival(rivalDeck, fakeNode);
}

// ── Battle result handlers ──
// Called from game.js when a battle ends

function onBattleWin(node) {
  // Gold reward scaled to rival size
  const goldReward = Math.floor(node.rivalSize * 2 + Math.random() * 20);
  mapState.gold += goldReward;
  addLog(`Victory! +${goldReward} gold earned.`, 'player');

  if (node.type === 'boss') {
    if (mapState.act < 2) {
      healRep(BOSS_HEAL);
      saveRun({ screen: 'relic', gold: goldReward });
      showRelicChoice(goldReward);   // boss reward: pick a piece of equipment
    } else {
      showRunWin();
    }
  } else {
    saveRun({ screen: 'reward', gold: goldReward, nodeId: node.id });
    showBattleReward(node, goldReward);
  }
}

// ── Reputation (run health) ──
// Losing a regular fight costs Reputation based on how badly you lost.
// Losing a boss fight, or running out of Reputation, ends the run.
const START_REP = 100;
const REST_HEAL = 30;
const BOSS_HEAL = 25;

function repDamage(gap) {
  return Math.min(35, 5 + Math.floor(Math.max(0, gap) / 3));
}

function healRep(amount) {
  const before = mapState.rep;
  mapState.rep = Math.min(mapState.maxRep, mapState.rep + amount);
  return mapState.rep - before;
}

function onBattleLoss() {
  const node = state.currentNode;
  if (!node || node.type === 'boss') {
    showRunLoss('The judges crowned your rival. The boss must be beaten.');
    return;
  }
  const sc   = state.lastRoundScore || { p: 0, e: 0 };
  const gap  = sc.e - sc.p;
  const loss = repDamage(gap);
  mapState.rep -= loss;
  if (mapState.rep <= 0) {
    mapState.rep = 0;
    showRunLoss(`Your reputation hit zero after losing to ${state.rivalName} by ${gap}.`);
    return;
  }
  saveRun({ screen: 'map' });
  setScreen('battle-lost-screen');
  document.getElementById('lost-detail').textContent =
    gap > 0 ? `${state.rivalName} beat you ${sc.e} to ${sc.p} (by ${gap}).` : `A tie with ${state.rivalName} — the judges weren't impressed.`;
  document.getElementById('lost-rep').textContent =
    `−${loss} Reputation  ·  ⭐ ${mapState.rep}/${mapState.maxRep} left`;
}

let rewardOffer = [];

function showBattleReward(node, goldReward) {
  setScreen('battle-reward-screen');
  const festival = node.type === 'festival';
  document.getElementById('reward-gold').textContent =
    festival ? `🎪 Festival winner! +${goldReward} gold — pick a premium card` : `+${goldReward} gold earned!`;
  rewardOffer = festival ? generateRareOffer() : generateMapOffer();
  document.getElementById('reward-card-offer').innerHTML =
    rewardOffer.map((c, i) => specialCardHtml(c, `pickRewardCard(${i})`)).join('');
}

function pickRewardCard(idx) {
  const card = rewardOffer[idx];
  if (card && draftState.deck.length < MAX_DECK_SIZE) {
    draftState.deck.push({ ...getCardDef(card.id) });
  }
  rewardOffer = [];
  showMapScreen();
}

function skipReward() {
  showMapScreen();
}

function showActTransition(goldReward) {
  setScreen('act-transition-screen');
  document.getElementById('act-transition-title').textContent =
    `Act ${mapState.act + 1} Complete!`;
  const nextBossNode = mapState.nodes[mapState.act + 1] && getBossNode(mapState.act + 1);
  const nextBoss = nextBossNode && getRivalDef(nextBossNode.rival);
  document.getElementById('act-transition-next').textContent =
    `Next: ${ACT_NAMES[mapState.act + 1]}${nextBoss ? ` — boss: ${nextBoss.name}` : ''}`;
  document.getElementById('act-transition-deck').textContent =
    `Your deck: ${draftState.deck.length} cards`;
  document.getElementById('act-transition-gold').textContent =
    `Gold: ${mapState.gold}  ·  ⭐ ${mapState.rep}/${mapState.maxRep} (boss win: +${BOSS_HEAL} reputation)`;
  saveRun({ screen: 'act', gold: goldReward });
}

function showRunWin() {
  clearRun();
  setScreen('run-win-screen');
  document.getElementById('run-win-deck').textContent =
    `Final deck: ${draftState.deck.length} cards`;
  document.getElementById('run-win-gold').textContent =
    `Gold remaining: ${mapState.gold}`;
}

function showRunLoss(reason) {
  clearRun();
  setScreen('run-loss-screen');
  document.getElementById('run-loss-deck').textContent =
    reason || `You had ${draftState.deck.length} cards`;
  document.getElementById('run-loss-act').textContent =
    `Fell in Act ${mapState.act + 1} with ${draftState.deck.length} cards`;
}

// ── Start a run ──

// startRun is defined in draft.js as startRunWithDeck

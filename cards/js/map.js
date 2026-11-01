// map.js — map generation, rendering, and navigation

const ACT_NAMES = ['The Mash', 'Fermentation', 'Conditioning'];

// Rival deck sizes per layer per act
const RIVAL_SIZES_BY_ACT = [15, 20, 30];

// Boss is always 30
function getRivalSize(act, layer) {
  if (layer === 6) return 30; // boss
  return RIVAL_SIZES_BY_ACT[act];
}

// Node type distribution per layer (0-indexed)
const LAYER_TEMPLATES = [
  ['draft','draft','event'],              // Layer 0 — mostly draft/event
  ['battle','draft','shop','event'],      // Layer 1
  ['battle','battle','draft','rest'],     // Layer 2
  ['battle','battle','shop','event'],     // Layer 3
  ['battle','draft','event','rest'],      // Layer 4
  ['battle','battle','battle','rest'],    // Layer 5
  ['boss'],                               // Layer 6 — act boss
];

const NODE_ICONS = {
  battle: '⚔',
  draft:  '🃏',
  shop:   '🛒',
  event:  '?',
  rest:   '🛌',
  boss:   '💀',
};

const NODE_COLORS = {
  battle: '#c0392b',
  draft:  '#2980b9',
  shop:   '#f39c12',
  event:  '#8e44ad',
  rest:   '#27ae60',
  boss:   '#e74c3c',
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

  for (let act = 0; act < 3; act++) {
    const actNodes = [];
    for (let layer = 0; layer < LAYER_TEMPLATES.length; layer++) {
      const template = [...LAYER_TEMPLATES[layer]];
      // Shuffle non-boss layers
      if (layer < 6) shuffleArray(template);
      const layerNodes = template.map((type, idx) => ({
        act, layer, index: idx,
        type,
        rivalSize: getRivalSize(act, layer),
        id: `${act}-${layer}-${idx}`,
        accessible: layer === 0 && act === mapState.act,
      }));
      actNodes.push(layerNodes);
    }
    mapState.nodes.push(actNodes);
    generateEdges(act, actNodes);
  }
}

function generateEdges(act, actNodes) {
  for (let layer = 0; layer < actNodes.length - 1; layer++) {
    const fromLayer = actNodes[layer];
    const toLayer   = actNodes[layer + 1];
    // Each node connects to 1-2 nodes in next layer
    fromLayer.forEach((fromNode, fi) => {
      const targets = new Set();
      // Always connect to same-ish index
      targets.add(Math.min(fi, toLayer.length - 1));
      // Sometimes connect to neighbor
      if (Math.random() < 0.5 && toLayer.length > 1) {
        targets.add(Math.min(fi + 1, toLayer.length - 1));
      }
      targets.forEach(ti => {
        mapState.edges.push({
          from: fromNode.id,
          to:   toLayer[ti].id,
        });
      });
    });
  }
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
  setTimeout(() => renderMap(), 50);
}

function renderMap() {
  const act      = mapState.act;
  const actNodes = mapState.nodes[act];
  const el       = document.getElementById('map-container');
  if (!el || !actNodes) return;

  document.getElementById('map-gold').textContent      = `💰 ${mapState.gold}`;
  document.getElementById('map-act-name').textContent  = ACT_NAMES[act];
  document.getElementById('map-deck-count').textContent= `🃏 ${draftState.deck.length} cards`;

  const W      = Math.max(el.offsetWidth, 320);
  const layers = actNodes.length;
  const layerH = 90;
  const H      = layers * layerH + 60;

  let svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">`;

  // Draw edges first
  mapState.edges.forEach(edge => {
    const [fa, fl, fi] = edge.from.split('-').map(Number);
    const [ta, tl, ti] = edge.to.split('-').map(Number);
    if (fa !== act || ta !== act) return;

    const fromNodes = actNodes[fl];
    const toNodes   = actNodes[tl];
    const fx = nodeX(fi, fromNodes.length, W);
    const fy = nodeY(fl, H, layers);
    const tx = nodeX(ti, toNodes.length, W);
    const ty = nodeY(tl, H, layers);

    const fromVisited = mapState.visited[edge.from];
    const toVisited   = mapState.visited[edge.to];
    const active      = fromVisited;

    svg += `<line x1="${fx}" y1="${fy}" x2="${tx}" y2="${ty}"
      stroke="${active ? '#6c63ff' : '#2a2a4a'}"
      stroke-width="${active ? 2 : 1}"
      stroke-dasharray="${active ? 'none' : '4,4'}"
      opacity="${active ? 0.8 : 0.4}"/>`;
  });

  // Draw nodes
  actNodes.forEach((layerNodes, layer) => {
    layerNodes.forEach((node, idx) => {
      const x       = nodeX(idx, layerNodes.length, W);
      const y       = nodeY(layer, H, layers);
      const visited = isVisited(node);
      const access  = isAccessible(node);
      const canClick = canVisit(node);
      const color   = NODE_COLORS[node.type] || '#555';
      const icon    = NODE_ICONS[node.type]  || '?';

      const r      = node.type === 'boss' ? 22 : 18;
      const stroke = visited ? '#ffd700' : access ? color : '#2a2a4a';
      const fill   = visited ? '#1a1a2e' : access ? '#12121f' : '#0a0a14';
      const opacity = access || visited ? 1 : 0.4;

      svg += `<g transform="translate(${x},${y})" opacity="${opacity}"
        ${canClick ? `onclick="clickMapNode('${node.id}')" style="cursor:pointer"` : ''}>
        <circle r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${visited ? 2.5 : 1.5}"/>
        <text text-anchor="middle" dominant-baseline="central"
          font-size="${node.type === 'boss' ? 14 : 12}"
          fill="${visited ? '#ffd700' : access ? color : '#444'}">${icon}</text>
        ${node.type === 'battle' || node.type === 'boss'
          ? `<text text-anchor="middle" y="${r + 12}" font-size="7" fill="#666" font-family="monospace">${node.rivalSize}🃏</text>`
          : ''}
      </g>`;
    });
  });

  svg += '</svg>';
  el.innerHTML = svg;
}

function nodeX(idx, total, W) {
  const padding = 60;
  if (total === 1) return W / 2;
  return padding + (idx / (total - 1)) * (W - padding * 2);
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
  handleNode(node);
}

// ── Node handlers ──

function handleNode(node) {
  switch (node.type) {
    case 'battle':
    case 'boss':
      startMapBattle(node);
      break;
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
  const rivalIds = shuffle(ENEMY_DECK_IDS).slice(0, node.rivalSize);
  const rivalDeck = rivalIds.map(id => ({ ...getCardDef(id) }));

  setScreen('game-screen');
  initGameWithRival(rivalDeck, node);
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
  const pool = CARD_POOL.filter(c =>
    (counts[c.id] || 0) < MAX_COPIES && c.cat !== 'token'
  );
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const seen = new Set();
  const offer = [];
  for (const c of shuffled) {
    if (!seen.has(c.id)) { seen.add(c.id); offer.push({ ...c }); }
    if (offer.length >= 3) break;
  }
  return offer;
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
    .filter(c => c.cat !== 'token')
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
    const disabled  = !canAfford || full;
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
  mapState.gold -= card.price;
  draftState.deck.push({ ...card });
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

const MAP_EVENTS = [
  {
    title: 'Mystery Grain Delivery',
    desc: 'A shipment arrives with no label. Could be amazing, could be terrible.',
    options: [
      { label: 'Accept it (add random card)', action: () => {
        const card = CARD_POOL[Math.floor(Math.random() * CARD_POOL.length)];
        if (draftState.deck.length < MAX_DECK_SIZE) draftState.deck.push({ ...card });
        return `Added ${card.name} to your deck!`;
      }},
      { label: 'Decline', action: () => 'You turned it down. Safe choice.' },
    ]
  },
  {
    title: 'Hop Shortage',
    desc: 'Your hop supplier is out of stock. Sell a hop card for gold?',
    options: [
      { label: 'Sell a hop (+30 gold)', action: () => {
        const idx = draftState.deck.findIndex(c => c.cat === 'hop');
        if (idx >= 0) { draftState.deck.splice(idx, 1); mapState.gold += 30; return 'Sold a hop for 30 gold!'; }
        return 'No hops to sell.';
      }},
      { label: 'Keep your hops', action: () => 'You held on to your hops.' },
    ]
  },
  {
    title: 'Brewery Inspection',
    desc: 'A health inspector arrives unexpectedly. Pay them off or risk losing a card.',
    options: [
      { label: 'Pay 25 gold', action: () => {
        if (mapState.gold >= 25) { mapState.gold -= 25; return 'Paid 25 gold. Inspector satisfied.'; }
        return 'Not enough gold!';
      }},
      { label: 'Risk it (lose random card)', action: () => {
        if (draftState.deck.length > 0) {
          const idx = Math.floor(Math.random() * draftState.deck.length);
          const lost = draftState.deck.splice(idx, 1)[0];
          return `Lost ${lost.name} from your deck!`;
        }
        return 'Nothing to lose!';
      }},
    ]
  },
  {
    title: 'Fermentation Festival',
    desc: 'A local festival is offering prizes for experimental beers.',
    options: [
      { label: 'Enter (+20 gold, add wild yeast)', action: () => {
        mapState.gold += 20;
        if (draftState.deck.length < MAX_DECK_SIZE) draftState.deck.push({ ...getCardDef('brett') });
        return 'Won 20 gold and a Brett Yeast card!';
      }},
      { label: 'Skip the festival', action: () => 'You stayed home and brewed quietly.' },
    ]
  },
  {
    title: 'Bulk Grain Deal',
    desc: 'A supplier offers you a deal on base malts.',
    options: [
      { label: 'Buy 3 base malts (30 gold)', action: () => {
        if (mapState.gold >= 30) {
          mapState.gold -= 30;
          const malts = ['2row','pilsner','munich'];
          malts.forEach(id => { if (draftState.deck.length < MAX_DECK_SIZE) draftState.deck.push({ ...getCardDef(id) }); });
          return 'Added 2-Row, Pilsner, and Munich Malt!';
        }
        return 'Not enough gold!';
      }},
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
  el.innerHTML = currentEvent.options.map((opt, i) =>
    `<button class="btn btn-primary" onclick="chooseEvent(${i})">${opt.label}</button>`
  ).join('');
}

function chooseEvent(idx) {
  const result = currentEvent.options[idx].action();
  document.getElementById('event-result').textContent = result;
  document.getElementById('event-options').innerHTML =
    `<button class="btn btn-gold" onclick="showMapScreen()">Continue →</button>`;
}

// ── Rest node ──

const REST_UPGRADE = 5;

function showMapRest(node) {
  setScreen('map-rest-screen');
  document.getElementById('rest-result').textContent = '';
  document.getElementById('rest-card-list').innerHTML = '';
  document.getElementById('rest-card-list').style.display = 'none';
  document.getElementById('rest-sub').textContent = 'Take a breather. Choose one:';
  const removeOk = canRemoveCard();
  document.getElementById('rest-choices').innerHTML = `
    <button class="btn btn-gold" onclick="renderMapRest('upgrade')">⬆ UPGRADE A CARD<br><span style="font-size:6px;">+${REST_UPGRADE} pts for the rest of the run</span></button>
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
    document.getElementById('rest-sub').textContent = `Choose a card to upgrade (+${REST_UPGRADE} pts for this run)`;
    list.innerHTML = deckPickerHtml('upgradeCard', c => {
      const pts = c.points >= 0 ? `+${c.points}` : `${c.points}`;
      return c._upgraded
        ? { html: `${pts} (already upgraded)`, disabled: true }
        : { html: `<span style="color:var(--green)">${pts} → +${c.points + REST_UPGRADE}</span>`, disabled: false };
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

function upgradeCard(idx) {
  const card = draftState.deck[idx];
  if (!card || card._upgraded) return;
  card.points += REST_UPGRADE;
  card._upgraded = true;
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
      showActTransition(goldReward);
    } else {
      showRunWin();
    }
  } else {
    showBattleReward(node, goldReward);
  }
}

function onBattleLoss() {
  showRunLoss();
}

function showBattleReward(node, goldReward) {
  setScreen('battle-reward-screen');
  document.getElementById('reward-gold').textContent = `+${goldReward} gold earned!`;
  const offer = generateMapOffer();
  const el    = document.getElementById('reward-card-offer');
  el.innerHTML = offer.map((c, i) => {
    const pts  = c.points >= 0 ? `+${c.points}` : `${c.points}`;
    const lane = c.lane === 'both' ? 'HOT/COLD' : c.lane === 'hot' ? 'HOT SIDE' : 'COLD SIDE';
    return `<div class="card cat-${c.cat}" onclick="pickRewardCard(${i}, '${JSON.stringify(offer).replace(/'/g,"\\'")}')">
      <div class="card-cost-gem">${c.cost}</div>
      <div class="card-pts-gem">${pts}</div>
      <div class="card-art">${catIcon(c.cat)}</div>
      <div class="card-name-banner">${c.name}</div>
      <div class="card-tags-row">${tagHtml(c.tags)}</div>
      <div class="card-effect-text">${c.desc || ''}</div>
      <div class="card-restrict">${lane}</div>
    </div>`;
  }).join('');
}

function pickRewardCard(idx, offerJson) {
  const offer = JSON.parse(offerJson);
  const card  = offer[idx];
  if (card && draftState.deck.length < MAX_DECK_SIZE) {
    draftState.deck.push({ ...getCardDef(card.id) });
  }
  showMapScreen();
}

function skipReward() {
  showMapScreen();
}

function showActTransition(goldReward) {
  setScreen('act-transition-screen');
  document.getElementById('act-transition-title').textContent =
    `Act ${mapState.act + 1} Complete!`;
  document.getElementById('act-transition-next').textContent =
    `Next: ${ACT_NAMES[mapState.act + 1]}`;
  document.getElementById('act-transition-deck').textContent =
    `Your deck: ${draftState.deck.length} cards`;
  document.getElementById('act-transition-gold').textContent =
    `Gold: ${mapState.gold}`;
}

function showRunWin() {
  setScreen('run-win-screen');
  document.getElementById('run-win-deck').textContent =
    `Final deck: ${draftState.deck.length} cards`;
  document.getElementById('run-win-gold').textContent =
    `Gold remaining: ${mapState.gold}`;
}

function showRunLoss() {
  setScreen('run-loss-screen');
  document.getElementById('run-loss-deck').textContent =
    `You had ${draftState.deck.length} cards`;
  document.getElementById('run-loss-act').textContent =
    `Fell in Act ${mapState.act + 1}`;
}

// ── Start a run ──

// startRun is defined in draft.js as startRunWithDeck

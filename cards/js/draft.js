// draft.js — brewery selection, deck builder, run setup

// BREWERIES lives in breweries.js

const DECK_SIZE      = 15;   // starting deck you build before a run
const MAX_DECK_SIZE  = 50;   // safety cap only — dilution is the real limit
const MIN_DECK_SIZE  = 15;   // removal can't trim below this (a 15-card deck already nearly runs dry in 8 turns)
const MAX_COPIES = 3;
const MAX_DECKS  = 3;
const SAVE_KEY   = 'wortcraft_decks';

// ── Shared helpers (defined here so draft + ui can both use them) ──

function catIcon(cat) {
  const icons = { malt:'🌾', hop:'🌿', yeast:'🧫', adjunct:'✦', process:'⚙️', token:'⚠️' };
  return icons[cat] || '?';
}

function tagHtml(tags) {
  return (tags || []).map(t => `<span class="card-tag tag-${t}">${t}</span>`).join('');
}

// Rarity: a coloured strip under the art, and a label in the footer for uncommon/rare
function rarityBar(c) {
  const r = c.rarity || 'common';
  return `<div class="card-rarity rarity-${r}" title="${RARITY_NAMES[r] || ''}"></div>`;
}
function rarityLabel(c) {
  return c.rarity && c.rarity !== 'common' ? ` · <span class="rarity-text rarity-${c.rarity}">${RARITY_NAMES[c.rarity].toUpperCase()}</span>` : '';
}

function cardHtml(c, i, mode, extra='', shownCost=null, preview=null) {
  const cost   = shownCost === null ? c.cost : shownCost;
  const costCls = cost < c.cost ? ' cost-discounted' : '';
  // Formula cards show what they'd score right now: green if above printed, red if below
  const shownPts = preview ? preview.points : c.points;
  const ptsCls   = preview ? (shownPts > c.points ? ' pts-up' : shownPts < c.points ? ' pts-down' : '') : '';
  const nowNote  = preview ? ` <span class="now-note${ptsCls}">(${preview.note})</span>` : '';
  const pts    = shownPts >= 0 ? `+${shownPts}` : `${shownPts}`;
  const lane   = c.lane === 'both' ? 'HOT/COLD' : c.lane === 'hot' ? 'HOT SIDE' : 'COLD SIDE';
  let clickFn  = 'void(0)';
  if (mode === 'mulligan')   clickFn = `toggleMulligan(${i})`;
  else if (mode === 'play')  clickFn = `selectCard(${i})`;
  else if (mode === 'build') clickFn = `builderAddCard('${c.id}')`;
  return `<div class="card cat-${c.cat} ${extra}" onclick="${clickFn}">
    <div class="card-cost-gem${costCls}" ${cost < c.cost ? `title="Normally ${c.cost}"` : ''}>${cost}</div>
    <div class="card-pts-gem${ptsCls}" ${preview ? `title="Printed: ${c.points}"` : ''}>${pts}</div>
    <div class="card-art">${c.cat === 'token' && c.points >= 0 ? '✨' : catIcon(c.cat)}</div>
    ${rarityBar(c)}<div class="card-name-banner">${c.name}</div>
    <div class="card-tags-row">${tagHtml(c.tags)}</div>
    <div class="card-effect-text"><span>${c.desc || ''}${nowNote}</span></div>
    <div class="card-restrict">${lane}${rarityLabel(c)}</div>
  </div>`;
}

// ── Saved decks ──

function loadSavedDecks() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch(e) { return []; }
}

function saveDecksToDisk(decks) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(decks)); } catch(e) {}
}

// ── Run state ──

let draftState = {
  brewery:    null,
  deckIndex:  null,   // which saved deck slot they chose
  deck:       [],     // card instances for the current run
};

// ── Builder state ──

let builderState = {
  slotIndex:   null,  // which slot (0,1,2) we are editing
  name:        'My Deck',
  cards:       [],    // array of card ids
  activeTab:   'malt',
  costFilter:   'all',    // 'all' | 0 | 1 | 2 | 3 | '4+'
  rarityFilter: 'all',    // 'all' | 'common' | 'uncommon' | 'rare'
  showLocked:   true,
};

const RARITY_ORDER = { common: 0, uncommon: 1, rare: 2 };

// ── Screen manager ──

function setScreen(id) {
  if (typeof hideCardHover === 'function') hideCardHover();
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ── Title ──

function showTitleScreen() {
  setScreen('title-screen');
  // Shows which card data actually loaded — handy when a file didn't get replaced
  const ver = document.getElementById('version-label');
  if (ver) ver.textContent = typeof CARDS_VERSION !== 'undefined'
    ? `v0.2 — prototype · cards: ${CARDS_VERSION}`
    : 'v0.2 — prototype · cards: OLD FILE (replace js/cards.js)';
  const btn  = document.getElementById('continue-run-btn');
  const info = document.getElementById('continue-run-info');
  const has  = hasSavedRun();
  if (btn)  btn.style.display  = has ? '' : 'none';
  if (info) info.textContent   = has ? savedRunSummary() : '';
  const colEl = document.getElementById('title-collection');
  if (colEl) {
    const p = loadProfile();
    colEl.textContent = `Collection: ${collectionCount()}/${CARD_POOL.length} cards · Breweries: ${BREWERIES.filter(isBreweryUnlocked).length}/${BREWERIES.length} · Runs: ${p.runs} · Wins: ${p.wins}`;
  }
}

// ── Deck manager screen ──

function showDeckManager() {
  setScreen('deck-manager-screen');
  renderDeckManager();
}

function renderDeckManager() {
  const decks = loadSavedDecks();
  const el    = document.getElementById('deck-slots');
  el.innerHTML = '';

  for (let i = 0; i < MAX_DECKS; i++) {
    const deck = decks[i];
    const div  = document.createElement('div');
    div.className = 'deck-slot';
    if (deck) {
      div.innerHTML = `
        <div class="deck-slot-name">${deck.name}</div>
        <div class="deck-slot-count">${deck.cards.filter(id => getCardDef(id)).length} / ${DECK_SIZE} cards${deck.cards.some(id => !getCardDef(id)) ? ' <span style="color:var(--orange)">(retired cards removed — re-edit)</span>' : ''}</div>
        <div class="deck-slot-cats">${deckCatSummary(deck.cards)}</div>
        ${deckLockedCards(deck.cards).length ? `<div class="deck-slot-locked">🔒 Uses ${deckLockedCards(deck.cards).length} card(s) you don't own yet — edit to replace them.</div>` : ''}
        <div class="deck-slot-actions">
          <button class="btn btn-primary" onclick="openBuilder(${i})">EDIT</button>
          ${deck.cards.filter(id => getCardDef(id)).length === DECK_SIZE && !deckLockedCards(deck.cards).length
            ? `<button class="btn btn-gold" onclick="startRunWithDeck(${i})">▶ USE</button>`
            : `<button class="btn btn-gold" style="opacity:0.4;cursor:not-allowed;" title="Needs ${DECK_SIZE} cards">▶ USE</button>`}
          <button class="btn btn-danger"  onclick="deleteDeck(${i})">✕</button>
        </div>`;
    } else {
      div.innerHTML = `
        <div class="deck-slot-empty">Empty Slot</div>
        <button class="btn btn-primary" style="margin-top:8px" onclick="openBuilder(${i})">+ NEW DECK</button>`;
    }
    el.appendChild(div);
  }
  const col = loadCollection();
  const foot = document.getElementById('collection-footer');
  if (foot) foot.innerHTML = `
    <div style="font-size:8px;color:var(--gold);">Collection: ${collectionCount()}/${CARD_POOL.length} cards owned</div>
    <div style="font-size:6px;color:var(--dim);margin:4px 0;">Commons are free. Buy uncommons and rares in shops during runs to unlock them forever.</div>
    <label style="font-size:6px;color:var(--dim);cursor:pointer;">
      <input type="checkbox" ${col.unlockAll ? 'checked' : ''} onchange="setUnlockAll(this.checked);renderDeckManager();"> Playtest mode: treat every card as owned
    </label>`;
}

function deckCatSummary(cardIds) {
  const counts = {};
  cardIds.forEach(id => {
    const c = getCardDef(id);
    if (c) counts[c.cat] = (counts[c.cat] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([cat, n]) => `<span style="color:${catColor(cat)}">${catIcon(cat)}${n}</span>`)
    .join(' ');
}

function catColor(cat) {
  return cat==='malt'?'#d4af37':cat==='hop'?'#4caf50':cat==='yeast'?'#9c27b0':cat==='adjunct'?'#4fc3f7':'#b0bec5';
}

function deleteDeck(i) {
  const decks = loadSavedDecks();
  decks[i] = null;
  saveDecksToDisk(decks);
  renderDeckManager();
}

// ── Deck Builder ──

function openBuilder(slotIndex) {
  const decks = loadSavedDecks();
  const existing = decks[slotIndex];
  builderState.slotIndex = slotIndex;
  builderState.name  = existing ? existing.name  : `Deck ${slotIndex + 1}`;
  // Drop any card ids that no longer exist (e.g. after a card pool update)
  builderState.cards = existing ? existing.cards.filter(id => getCardDef(id)) : [];
  builderState.activeTab = 'malt';
  setScreen('builder-screen');
  renderBuilder();
}

function builderSetTab(tab) {
  builderState.activeTab = tab;
  renderBuilderFilters();
  renderBuilderCards();
  // Update tab buttons
  document.querySelectorAll('.builder-tab').forEach(t => {
    t.classList.toggle('active-tab', t.dataset.tab === tab);
  });
}

function builderAddCard(id) {
  if (!isOwned(id)) { showBuilderMsg('Locked — buy it in a shop during a run.', 'warn'); return; }
  const counts = {};
  builderState.cards.forEach(cid => counts[cid] = (counts[cid] || 0) + 1);
  if ((counts[id] || 0) >= MAX_COPIES) {
    showBuilderMsg(`Max ${MAX_COPIES} copies!`, 'warn'); return;
  }
  if (builderState.cards.length >= DECK_SIZE) {
    showBuilderMsg(`Deck is full (${DECK_SIZE}/${DECK_SIZE})!`, 'warn'); return;
  }
  builderState.cards.push(id);
  renderBuilderDeck();
  renderBuilderCards();
  updateBuilderCount();
}

function builderRemoveCard(id) {
  const idx = builderState.cards.lastIndexOf(id);
  if (idx >= 0) builderState.cards.splice(idx, 1);
  renderBuilderDeck();
  renderBuilderCards();
  updateBuilderCount();
}

function saveBuilderDeck() {
  const name = document.getElementById('deck-name-input').value.trim() || builderState.name;
  if (builderState.cards.length < 1) {
    showBuilderMsg('Add at least 1 card first!', 'warn'); return;
  }
  const decks = loadSavedDecks();
  while (decks.length <= builderState.slotIndex) decks.push(null);
  decks[builderState.slotIndex] = { name, cards: [...builderState.cards] };
  saveDecksToDisk(decks);
  showBuilderMsg('Deck saved!', 'good');
  setTimeout(() => showDeckManager(), 800);
}

function showBuilderMsg(msg, type) {
  const el = document.getElementById('builder-msg');
  el.textContent = msg;
  el.style.color = type === 'warn' ? 'var(--red)' : 'var(--green)';
  setTimeout(() => { el.textContent = ''; }, 2000);
}

function updateBuilderCount() {
  const el = document.getElementById('builder-count');
  if (el) el.textContent = `${builderState.cards.length} / ${DECK_SIZE}`;
}

function renderBuilder() {
  const nameEl = document.getElementById('deck-name-input');
  if (nameEl) nameEl.value = builderState.name;
  updateBuilderCount();
  renderBuilderFilters();
  renderBuilderCards();
  renderBuilderDeck();
  // Set active tab
  document.querySelectorAll('.builder-tab').forEach(t => {
    t.classList.toggle('active-tab', t.dataset.tab === builderState.activeTab);
  });
}

// Sorted like Hearthstone: by cost, then rarity, then name
function builderPool() {
  const f = builderState;
  return CARD_POOL
    .filter(c => c.cat === f.activeTab)
    .filter(c => f.costFilter === 'all' || (f.costFilter === '4+' ? c.cost >= 4 : c.cost === f.costFilter))
    .filter(c => f.rarityFilter === 'all' || c.rarity === f.rarityFilter)
    .filter(c => f.showLocked || isOwned(c.id))
    .sort((a, b) => a.cost - b.cost || RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity] || a.name.localeCompare(b.name));
}

function builderSetFilter(kind, value) {
  if (kind === 'cost')   builderState.costFilter   = value;
  if (kind === 'rarity') builderState.rarityFilter = value;
  if (kind === 'locked') builderState.showLocked   = !builderState.showLocked;
  renderBuilderFilters();
  renderBuilderCards();
}

function renderBuilderFilters() {
  const el = document.getElementById('builder-filters');
  if (!el) return;
  const f = builderState;
  const chip = (kind, value, label, active) =>
    `<button class="btn filter-chip ${active ? 'active-tab' : ''}" onclick="builderSetFilter('${kind}', ${typeof value === 'number' ? value : `'${value}'`})">${label}</button>`;
  el.innerHTML = `
    <div class="filter-group"><span>COST</span>${['all', 0, 1, 2, 3, '4+'].map(v => chip('cost', v, v === 'all' ? 'ALL' : v, f.costFilter === v)).join('')}</div>
    <div class="filter-group"><span>RARITY</span>${['all', 'common', 'uncommon', 'rare'].map(v => chip('rarity', v, v.toUpperCase(), f.rarityFilter === v)).join('')}</div>
    <div class="filter-group">${chip('locked', 'x', f.showLocked ? '🔒 SHOWING LOCKED' : '🔒 HIDING LOCKED', f.showLocked)}
      <span class="collection-count">Owned: ${collectionCount()}/${CARD_POOL.length}</span></div>`;
}

function renderBuilderCards() {
  const el   = document.getElementById('builder-card-pool');
  const pool = builderPool();
  const counts = {};
  builderState.cards.forEach(id => counts[id] = (counts[id] || 0) + 1);

  el.innerHTML = pool.map(c => {
    const n        = counts[c.id] || 0;
    const maxed    = n >= MAX_COPIES;
    const full     = builderState.cards.length >= DECK_SIZE;
    const locked   = !isOwned(c.id);
    const disabled = maxed || full || locked;
    const pts      = c.points >= 0 ? `+${c.points}` : `${c.points}`;
    const lane     = c.lane === 'both' ? 'HOT/COLD' : c.lane === 'hot' ? 'HOT SIDE' : 'COLD SIDE';
    return `<div class="card cat-${c.cat} ${disabled ? 'card-disabled' : ''} ${locked ? 'card-locked' : ''}"
      onclick="${disabled ? 'void(0)' : `builderAddCard('${c.id}')`}"
      ${locked ? 'title="Locked — buy this card in a shop during a run to unlock it for deck building."' : ''}
      style="position:relative;">
      ${locked ? '<div class="card-lock-badge">🔒</div>' : ''}
      <div class="card-cost-gem">${c.cost}</div>
      <div class="card-pts-gem">${pts}</div>
      ${n > 0 ? `<div class="card-copy-badge">${n}/${MAX_COPIES}</div>` : ''}
      <div class="card-art">${catIcon(c.cat)}</div>
      ${rarityBar(c)}<div class="card-name-banner">${c.name}</div>
      <div class="card-tags-row">${tagHtml(c.tags)}</div>
      <div class="card-effect-text">${c.desc || ''}</div>
      <div class="card-restrict">${lane}${rarityLabel(c)}</div>
    </div>`;
  }).join('');
}

function renderBuilderDeck() {
  const el = document.getElementById('builder-deck-list');
  const counts = {};
  builderState.cards.forEach(id => counts[id] = (counts[id] || 0) + 1);
  const unique = [...new Set(builderState.cards)];
  el.innerHTML = unique.map(id => {
    const c = getCardDef(id);
    if (!c) return '';
    const n = counts[id];
    return `<div class="deck-list-row">
      <span class="deck-list-count" style="color:${catColor(c.cat)}">${n}x</span>
      <span class="deck-list-name">${c.name}</span>
      <button class="deck-list-remove" onclick="builderRemoveCard('${id}')">−</button>
    </div>`;
  }).join('');
}

// ── Start Run ──

function startRunWithDeck(slotIndex) {
  if (hasSavedRun() && !confirm('You have a run in progress. Abandon it and start a new one?')) return;
  clearRun();
  const decks = loadSavedDecks();
  const deck  = decks[slotIndex];
  const valid = deck ? deck.cards.filter(id => getCardDef(id)) : [];
  if (deck && deckLockedCards(deck.cards).length) {
    alert('This deck uses cards you don\'t own yet. Edit it to replace them first.'); return;
  }
  if (valid.length !== DECK_SIZE) {
    alert(`A starting deck needs exactly ${DECK_SIZE} cards (this one has ${valid.length}). Edit it first!`); return;
  }
  draftState.deckIndex = slotIndex;
  const deckNameForStats = deck.name;
  draftState.deck = deck.cards.filter(id => getCardDef(id)).map(id => ({ ...getCardDef(id) }));

  // Init map state
  mapState = {
    act:         0,
    currentNode: null,
    nodes:       [],
    gold:        100,
    visited:     {},
    edges:       [],
    removals:    0,     // shop removal price goes up with each one
    rep:         START_REP,   // run health — see onBattleLoss in map.js
    maxRep:      START_REP,
    relics:      [],    // brewing equipment won from bosses
    barrel:      [],    // cards aging in the Barrel Room
    nodeCount:   0,     // stops visited this run (barrel timing)
    contract:    null,  // category for the next card offer
    notice:      '',
  };
  generateMap();
  mapState.stats = newRunStats(deckNameForStats);

  // Go to brewery select first
  setScreen('brewery-screen');
  renderBreweryChoices();
}

function selectBrewery(id) {
  const b = BREWERIES.find(x => x.id === id);
  if (!b || !isBreweryUnlocked(b)) return;
  draftState.brewery = b;
  mapState.stats = newRunStats(mapState.stats && mapState.stats.deckName);
  // Some breweries change what the map is made of (Taproom, Contract Brewer)
  generateMap();
  // Garage Brewer run perk: random commons, random equipment, lower Reputation
  if (id === 'garage') {
    const commons = CARD_POOL.filter(c => c.rarity === 'common');
    const ids = [];
    while (ids.length < DECK_SIZE) {
      const c = commons[Math.floor(Math.random() * commons.length)];
      if (ids.filter(x => x === c.id).length < MAX_COPIES) ids.push(c.id);
    }
    draftState.deck = ids.map(cid => ({ ...getCardDef(cid) }));
    mapState.relics = shuffle(RELICS).slice(0, 2).map(r => r.id);
    mapState.rep = GARAGE_REP; mapState.maxRep = GARAGE_REP;
  }
  // Wild Cellar run perk: lower Reputation ceiling
  if (id === 'wildcellar') { mapState.rep = WILD_START_REP; mapState.maxRep = WILD_START_REP; }
  showMapScreen();
}

function showDeckPreview() {
  setScreen('review-screen');
  renderDeckReview();
}

function startGame() {
  setScreen('game-screen');
  initGame();
}

// ── Brewery Select ──

function showBrewerySelect() {
  setScreen('brewery-screen');
  renderBreweryChoices();
}

function renderBreweryChoices() {
  const el = document.getElementById('brewery-choices');
  el.innerHTML = BREWERIES.map(breweryCardHtml).join('');
}

// ── Deck Review ──

function renderDeckReview() {
  const el = document.getElementById('review-cards');
  const groups = {};
  for (const c of draftState.deck) {
    if (!groups[c.cat]) groups[c.cat] = [];
    groups[c.cat].push(c);
  }
  const catOrder = ['malt','adjunct','hop','yeast','process'];
  el.innerHTML = catOrder.filter(cat => groups[cat]).map(cat => `
    <div class="review-group">
      <div class="review-group-label" style="color:${catColor(cat)}">${cat.toUpperCase()} (${groups[cat].length})</div>
      <div class="review-group-cards">
        ${groups[cat].map(c => `
          <div class="review-card cat-${c.cat}">
            <div class="card-name-banner" style="font-size:5px">${c.name}</div>
            <div style="font-size:11px;padding:2px;color:${catColor(c.cat)}">+${c.points}</div>
            <div style="font-size:5px;color:var(--dim);padding:2px;">cost ${c.cost}</div>
          </div>`).join('')}
      </div>
    </div>`).join('');
}

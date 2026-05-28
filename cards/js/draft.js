// draft.js — brewery selection, deck builder, run setup

const BREWERIES = [
  { id:'test', name:'Test Brewery', subtitle:'A blank slate. Good for learning.', icon:'🧪', bonus:'No special bonus yet.', unlocked:true },
];

const DECK_SIZE  = 30;
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

function cardHtml(c, i, mode, extra='') {
  const pts    = c.points >= 0 ? `+${c.points}` : `${c.points}`;
  const lane   = c.lane === 'both' ? 'HOT/COLD' : c.lane === 'hot' ? 'HOT SIDE' : 'COLD SIDE';
  let clickFn  = 'void(0)';
  if (mode === 'mulligan')   clickFn = `toggleMulligan(${i})`;
  else if (mode === 'play')  clickFn = `selectCard(${i})`;
  else if (mode === 'build') clickFn = `builderAddCard('${c.id}')`;
  return `<div class="card cat-${c.cat} ${extra}" onclick="${clickFn}">
    <div class="card-cost-gem">${c.cost}</div>
    <div class="card-pts-gem">${pts}</div>
    <div class="card-art">${catIcon(c.cat)}</div>
    <div class="card-name-banner">${c.name}</div>
    <div class="card-tags-row">${tagHtml(c.tags)}</div>
    <div class="card-effect-text">${c.desc || ''}</div>
    <div class="card-restrict">${lane}</div>
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
};

// ── Screen manager ──

function setScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ── Title ──

function showTitleScreen() {
  setScreen('title-screen');
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
        <div class="deck-slot-count">${deck.cards.length} / ${DECK_SIZE} cards</div>
        <div class="deck-slot-cats">${deckCatSummary(deck.cards)}</div>
        <div class="deck-slot-actions">
          <button class="btn btn-primary" onclick="openBuilder(${i})">EDIT</button>
          <button class="btn btn-gold"    onclick="startRunWithDeck(${i})">▶ USE</button>
          <button class="btn btn-danger"  onclick="deleteDeck(${i})">✕</button>
        </div>`;
    } else {
      div.innerHTML = `
        <div class="deck-slot-empty">Empty Slot</div>
        <button class="btn btn-primary" style="margin-top:8px" onclick="openBuilder(${i})">+ NEW DECK</button>`;
    }
    el.appendChild(div);
  }
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
  builderState.cards = existing ? [...existing.cards] : [];
  builderState.activeTab = 'malt';
  setScreen('builder-screen');
  renderBuilder();
}

function builderSetTab(tab) {
  builderState.activeTab = tab;
  renderBuilderCards();
  // Update tab buttons
  document.querySelectorAll('.builder-tab').forEach(t => {
    t.classList.toggle('active-tab', t.dataset.tab === tab);
  });
}

function builderAddCard(id) {
  const counts = {};
  builderState.cards.forEach(cid => counts[cid] = (counts[cid] || 0) + 1);
  if ((counts[id] || 0) >= MAX_COPIES) {
    showBuilderMsg(`Max ${MAX_COPIES} copies!`, 'warn'); return;
  }
  if (builderState.cards.length >= DECK_SIZE) {
    showBuilderMsg('Deck is full (30/30)!', 'warn'); return;
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
  renderBuilderCards();
  renderBuilderDeck();
  // Set active tab
  document.querySelectorAll('.builder-tab').forEach(t => {
    t.classList.toggle('active-tab', t.dataset.tab === builderState.activeTab);
  });
}

function renderBuilderCards() {
  const el   = document.getElementById('builder-card-pool');
  const tab  = builderState.activeTab;
  const pool = CARD_POOL.filter(c => c.cat === tab);
  const counts = {};
  builderState.cards.forEach(id => counts[id] = (counts[id] || 0) + 1);

  el.innerHTML = pool.map(c => {
    const n        = counts[c.id] || 0;
    const maxed    = n >= MAX_COPIES;
    const full     = builderState.cards.length >= DECK_SIZE;
    const disabled = maxed || full;
    const pts      = c.points >= 0 ? `+${c.points}` : `${c.points}`;
    const lane     = c.lane === 'both' ? 'HOT/COLD' : c.lane === 'hot' ? 'HOT SIDE' : 'COLD SIDE';
    return `<div class="card cat-${c.cat} ${disabled ? 'card-disabled' : ''}" 
      onclick="${disabled ? 'void(0)' : `builderAddCard('${c.id}')`}"
      style="position:relative;">
      <div class="card-cost-gem">${c.cost}</div>
      <div class="card-pts-gem">${pts}</div>
      ${n > 0 ? `<div class="card-copy-badge">${n}/${MAX_COPIES}</div>` : ''}
      <div class="card-art">${catIcon(c.cat)}</div>
      <div class="card-name-banner">${c.name}</div>
      <div class="card-tags-row">${tagHtml(c.tags)}</div>
      <div class="card-effect-text">${c.desc || ''}</div>
      <div class="card-restrict">${lane}</div>
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
  const decks = loadSavedDecks();
  const deck  = decks[slotIndex];
  if (!deck || deck.cards.length < 1) {
    alert('That deck is empty! Build a deck first.'); return;
  }
  draftState.deckIndex = slotIndex;
  draftState.deck = deck.cards.map(id => ({ ...getCardDef(id) }));
  setScreen('brewery-screen');
  renderBreweryChoices();
}

function selectBrewery(id) {
  draftState.brewery = BREWERIES.find(b => b.id === id);
  showDeckPreview();
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
  el.innerHTML = BREWERIES.map(b => `
    <div class="brewery-card ${b.unlocked ? '' : 'locked'}" onclick="${b.unlocked ? `selectBrewery('${b.id}')` : 'void(0)'}">
      <div class="brewery-icon">${b.icon}</div>
      <div class="brewery-name">${b.name}</div>
      <div class="brewery-sub">${b.subtitle}</div>
      <div class="brewery-bonus">${b.unlocked ? b.bonus : '🔒 LOCKED'}</div>
    </div>`).join('');
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

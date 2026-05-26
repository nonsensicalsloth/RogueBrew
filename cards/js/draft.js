// draft.js — brewery selection, card draft, deck review

const BREWERIES = [
  {
    id: 'test',
    name: 'Test Brewery',
    subtitle: 'A blank slate. Good for learning.',
    icon: '🧪',
    bonus: 'No special bonus yet.',
    unlocked: true,
  },
  // Add more brewery types here later
];

// Draft state
let draftState = {
  deck: [],         // cards picked so far
  pickNum: 0,       // how many picks made (0-29)
  offer: [],        // current 3 cards on offer
  brewery: null,
};

const DECK_SIZE    = 30;
const MAX_COPIES   = 3;
const OFFER_SIZE   = 3;

// ── Helpers ──

function getDeckCounts() {
  const counts = {};
  for (const c of draftState.deck) {
    counts[c.id] = (counts[c.id] || 0) + 1;
  }
  return counts;
}

function getAvailablePool() {
  const counts = getDeckCounts();
  return CARD_POOL.filter(c => (counts[c.id] || 0) < MAX_COPIES);
}

function generateOffer() {
  const pool = getAvailablePool();
  if (pool.length === 0) return [];
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  // Always distinct ids in one offer
  const seen = new Set();
  const offer = [];
  for (const c of shuffled) {
    if (!seen.has(c.id)) {
      seen.add(c.id);
      offer.push({ ...c });
      if (offer.length >= OFFER_SIZE) break;
    }
  }
  return offer;
}

// ── Flow entry points ──

function showTitleScreen() {
  setScreen('title-screen');
}

function showBrewerySelect() {
  setScreen('brewery-screen');
  renderBreweryChoices();
}

function selectBrewery(id) {
  draftState.brewery = BREWERIES.find(b => b.id === id);
  draftState.deck    = [];
  draftState.pickNum = 0;
  startDraft();
}

function startDraft() {
  setScreen('draft-screen');
  draftState.offer = generateOffer();
  renderDraft();
}

function pickCard(idx) {
  const card = draftState.offer[idx];
  if (!card) return;
  draftState.deck.push({ ...card });
  draftState.pickNum++;
  if (draftState.pickNum >= DECK_SIZE) {
    showDeckReview();
    return;
  }
  draftState.offer = generateOffer();
  renderDraft();
}

function showDeckReview() {
  setScreen('review-screen');
  renderDeckReview();
}

function startGame() {
  setScreen('game-screen');
  initGame();
}

// ── Screen manager ──

function setScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ── Render: Brewery Select ──

function renderBreweryChoices() {
  const el = document.getElementById('brewery-choices');
  el.innerHTML = BREWERIES.map(b => `
    <div class="brewery-card ${b.unlocked ? '' : 'locked'}" onclick="${b.unlocked ? `selectBrewery('${b.id}')` : 'void(0)'}">
      <div class="brewery-icon">${b.icon}</div>
      <div class="brewery-name">${b.name}</div>
      <div class="brewery-sub">${b.subtitle}</div>
      <div class="brewery-bonus">${b.unlocked ? b.bonus : '🔒 LOCKED'}</div>
    </div>
  `).join('');
}

// ── Render: Draft ──

function renderDraft() {
  const el       = document.getElementById('draft-offer');
  const progress = document.getElementById('draft-progress');
  const remaining = DECK_SIZE - draftState.pickNum;

  progress.textContent = `PICK ${draftState.pickNum + 1} / ${DECK_SIZE}`;

  if (draftState.offer.length === 0) {
    el.innerHTML = '<div style="color:var(--dim);font-size:8px;text-align:center;padding:20px;">No more cards available!</div>';
    return;
  }

  el.innerHTML = draftState.offer.map((c, i) => `
    <div class="draft-card cat-${c.cat}" onclick="pickCard(${i})">
      <div class="draft-card-icon">${catIcon(c.cat)}</div>
      <div class="card-name">${c.name}</div>
      <div class="card-pts">+${c.points}</div>
      <div class="card-cost">cost ${c.cost}</div>
      <div>${tagHtml(c.tags)}</div>
      <div class="card-restrict">${c.lane === 'both' ? 'HOT/COLD' : c.lane === 'hot' ? 'HOT SIDE' : 'COLD SIDE'}</div>
      <div class="draft-card-desc">${c.desc || ''}</div>
    </div>
  `).join('');

  // Show mini deck tally
  renderDraftTally();
}

function catIcon(cat) {
  return cat === 'malt' ? '🌾' : cat === 'hop' ? '🌿' : cat === 'yeast' ? '🧫' : '✦';
}

function renderDraftTally() {
  const el = document.getElementById('draft-tally');
  const counts = getDeckCounts();
  const total  = draftState.deck.length;
  // Group by category
  const byCat = {};
  for (const c of draftState.deck) {
    byCat[c.cat] = (byCat[c.cat] || 0) + 1;
  }
  el.innerHTML = `
    <span style="color:var(--dim)">DECK ${total}/${DECK_SIZE} —</span>
    ${Object.entries(byCat).map(([cat,n]) =>
      `<span style="color:${catColor(cat)}">${cat}: ${n}</span>`
    ).join(' &nbsp; ')}
  `;
}

function catColor(cat) {
  return cat==='malt'?'#d4af37':cat==='hop'?'#4caf50':cat==='yeast'?'#9c27b0':'#4fc3f7';
}

// ── Render: Deck Review ──

function renderDeckReview() {
  const el = document.getElementById('review-cards');
  // Group by category
  const groups = {};
  for (const c of draftState.deck) {
    if (!groups[c.cat]) groups[c.cat] = [];
    groups[c.cat].push(c);
  }
  const catOrder = ['malt','adjunct','hop','yeast'];
  el.innerHTML = catOrder.filter(cat => groups[cat]).map(cat => `
    <div class="review-group">
      <div class="review-group-label" style="color:${catColor(cat)}">${cat.toUpperCase()} (${groups[cat].length})</div>
      <div class="review-group-cards">
        ${groups[cat].map(c => `
          <div class="review-card cat-${c.cat}">
            <div class="card-name">${c.name}</div>
            <div class="card-pts">+${c.points}</div>
            <div class="card-cost">cost ${c.cost}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

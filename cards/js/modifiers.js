// modifiers.js — Run modifiers
// Optional twists picked on the brewery select screen, unlocked by winning a run.
// They stack with Brewmaster levels and are saved with the run (mapState.mods).
//   • Each modifier's effect lives where that system lives (map.js, game.js, draft.js);
//     those spots just ask modOn('id').
//   • A run with any modifier on never opens the next Brewmaster level.

const MODS_PICK_KEY = 'wortcraft_mods_pick';   // your last choices, remembered between runs

const DEEP_POCKETS_GOLD = 150;
const BUMPER_SHOP_MULT  = 1.25;
const GAUNTLET_BONUS    = 10;    // final-act bosses, who have no harder lineup to borrow from
const WILD_ROADS_WEIGHTS = { event: 35, battle: 26 };

const MODIFIERS = [
  { id: 'wildroads', name: 'Wild Roads',     kind: 'mixed',
    desc: 'Far more event stops and fewer battles on every map.' },
  { id: 'strange',   name: 'Strange Brew',   kind: 'mixed',
    desc: 'Every event gets its Wild Cellar option, whatever brewery you are.', not: ['wildcellar'] },
  { id: 'bumper',    name: 'Bumper Crop',    kind: 'mixed',
    desc: `Card offers show 1 more card. Shop prices go up ${Math.round((BUMPER_SHOP_MULT - 1) * 100)}%.` },
  { id: 'bigkettle', name: 'Big Kettle',     kind: 'mixed',
    desc: 'Budget keeps growing every turn instead of stopping at 5, so the last turn has 8. Same for every rival.' },
  { id: 'blind',     name: 'Blind Brew',     kind: 'mixed',
    desc: 'Your starting deck is 15 random cards from your collection instead of the deck you picked.', not: ['garage'] },
  { id: 'gauntlet',  name: 'Gauntlet',       kind: 'harder',
    desc: `Each boss comes from the next act's lineup. Final bosses get +${GAUNTLET_BONUS} instead.` },
  { id: 'noshops',   name: 'Homebrew Only',  kind: 'harder',
    desc: 'No shops on the map. Card offers after battles show 1 more card to make up for it.', not: ['taproom'] },
  { id: 'onestyle',  name: 'Single Style',   kind: 'harder',
    desc: "Card offers and shops only show cards that share your deck's most common tag." },
  { id: 'onebatch',  name: 'One Bad Batch',  kind: 'harder',
    desc: 'Lose any battle and the run is over. Reputation only matters for brew day disasters.' },
  { id: 'deep',      name: 'Deep Pockets',   kind: 'easier',
    desc: `Start with ${DEEP_POCKETS_GOLD} extra gold.` },
];
const MOD_KINDS = { easier: 'EASIER', mixed: 'TWIST', harder: 'HARDER' };

function getMod(id) { return MODIFIERS.find(m => m.id === id); }

// Is this modifier on for the run in progress?
function modOn(id) {
  return typeof mapState !== 'undefined' && !!mapState && Array.isArray(mapState.mods) && mapState.mods.includes(id);
}
function runMods() { return (typeof mapState !== 'undefined' && mapState && mapState.mods) || []; }

// Modifiers unlock with your first run win
function modsUnlocked() {
  const p = typeof loadProfile === 'function' ? loadProfile() : { wins: 0 };
  return p.wins > 0;
}
function modAllowedFor(m, breweryId) { return !(m.not || []).includes(breweryId); }

// ── Your picks on the select screen ──

function loadModPicks() {
  try { const a = JSON.parse(localStorage.getItem(MODS_PICK_KEY) || '[]'); return Array.isArray(a) ? a.filter(getMod) : []; }
  catch (e) { return []; }
}
function saveModPicks(a) { try { localStorage.setItem(MODS_PICK_KEY, JSON.stringify(a)); } catch (e) {} }
let modsOpen = false;

function toggleModPick(id) {
  const a = loadModPicks();
  const i = a.indexOf(id);
  if (i >= 0) a.splice(i, 1); else a.push(id);
  saveModPicks(a);
  renderModPicker();
}
function clearModPicks() { saveModPicks([]); renderModPicker(); }
function toggleModsOpen() { modsOpen = !modsOpen; renderModPicker(); }

// The modifiers a run with this brewery will actually get
function modsForBrewery(breweryId) {
  if (!modsUnlocked()) return [];
  return loadModPicks().filter(id => modAllowedFor(getMod(id), breweryId));
}

function renderModPicker() {
  const el = document.getElementById('mod-picker');
  if (!el) return;
  if (!modsUnlocked()) {
    el.innerHTML = `<div class="mod-bar mod-locked">RUN MODIFIERS · win a run to unlock</div>`;
    return;
  }
  const picks = loadModPicks();
  const chips = picks.map(id => getMod(id)).map(m => `<span class="mod-chip mod-${m.kind}">${m.name}</span>`).join('');
  const head = `<button class="mod-bar" onclick="toggleModsOpen()" aria-expanded="${modsOpen}">
      <span class="mod-bar-title">RUN MODIFIERS</span>
      <span class="mod-bar-chips">${chips || '<span class="mod-none">None. Tap to add a twist.</span>'}</span>
      <span class="mod-bar-arrow">${modsOpen ? '▲' : '▼'}</span></button>`;
  if (!modsOpen) { el.innerHTML = head; return; }
  const list = MODIFIERS.map(m => {
    const on = picks.includes(m.id);
    const not = (m.not || []).map(id => { const b = BREWERIES.find(x => x.id === id); return b ? b.name : id; });
    return `<button class="mod-opt ${on ? 'on' : ''}" onclick="toggleModPick('${m.id}')" aria-pressed="${on}">
        <span class="mod-body"><span class="mod-name">${m.name} <span class="mod-kind mod-${m.kind}">${MOD_KINDS[m.kind]}</span></span>
        <span class="mod-desc">${m.desc}${not.length ? ` <i>Not with ${not.join(', ')}.</i>` : ''}</span></span>
        <span class="mod-check">${on ? '✓' : ''}</span></button>`;
  }).join('');
  el.innerHTML = head + `<div class="mod-panel">
      <div class="mod-note">Modifiers stack with your Brewmaster level and stay on for the whole run. Achievements still count, but a run with any modifier on won't unlock the next Brewmaster level.</div>
      <div class="mod-list">${list}</div>
      ${picks.length ? `<div style="text-align:center;margin-top:8px;"><button class="btn btn-primary" onclick="clearModPicks()">CLEAR ALL</button></div>` : ''}
    </div>`;
}

// ── Applying them when the run starts (called from selectBrewery) ──

// Before the map is built: map-shaping modifiers need to be on already
function modsBeginRun(breweryId) {
  mapState.mods = modsForBrewery(breweryId);
}
// After the brewery's own setup
function modsAfterSetup() {
  if (modOn('deep')) mapState.gold += DEEP_POCKETS_GOLD;
  if (modOn('blind')) draftState.deck = blindDeck();
}

// 15 random cards you own, any rarity, respecting the copy limit
function blindDeck() {
  const owned = CARD_POOL.filter(c => c.cat !== 'token' && c.rarity !== 'legendary' && (typeof isOwned !== 'function' || isOwned(c.id)));
  const ids = [];
  let guard = 0;
  while (ids.length < DECK_SIZE && guard++ < 2000) {
    const c = owned[Math.floor(Math.random() * owned.length)];
    if (ids.filter(x => x === c.id).length < MAX_COPIES) ids.push(c.id);
  }
  return ids.map(id => ({ ...getCardDef(id) }));
}

// ── Effects used around the game ──

// Map: node weights
function modNodeWeights(w) {
  if (modOn('wildroads')) Object.assign(w, WILD_ROADS_WEIGHTS);
  if (modOn('noshops')) w.shop = 0;
  return w;
}
// Card offer size
function modOfferExtra() { return (modOn('bumper') ? 1 : 0) + (modOn('noshops') ? 1 : 0); }
// Shop prices
function modShopPrice(p) { return modOn('bumper') ? Math.ceil(p * BUMPER_SHOP_MULT) : p; }
// Budget cap in battle (run battles only): Big Kettle lifts it to the last turn of the round
function modBudgetCap(cap) {
  if (!(modOn('bigkettle') && typeof state !== 'undefined' && state && state.currentNode)) return cap;
  return Math.max(cap, state.maxTurns || 8);
}
// Runs with modifiers never open the next Brewmaster level
function modsBlockLevels() { return runMods().length > 0; }
// Gauntlet: which lineup a boss comes from
function modBossAct(act) { return modOn('gauntlet') ? Math.min(act + 1, BOSSES.length - 1) : act; }
function modBossBonus(node) {
  return modOn('gauntlet') && node && node.type === 'boss' && node.act >= BOSSES.length - 1 ? GAUNTLET_BONUS : 0;
}
// Single Style: every card offered shares the deck's top tag (when enough such cards exist)
function modStyleLean(list, pool) {
  if (!modOn('onestyle') || !list.length) return list;
  const top = deckTopTags(1)[0];
  if (!top) return list;
  const fits = c => (c.tags || []).includes(top);
  const out = [...list];
  for (let i = 0; i < out.length; i++) {
    if (fits(out[i])) continue;
    const spare = pool.filter(c => fits(c) && !out.some(o => o.id === c.id));
    const pick = spare.find(c => c.rarity === out[i].rarity) || spare[0];
    if (pick) out[i] = { ...pick };
  }
  return out;
}

// ── Showing them during the run ──

function modsBadgeHtml() {
  const mods = runMods().map(getMod).filter(Boolean);
  if (!mods.length) return '';
  return `<span class="relic-icon mod-badge" title="Run modifiers\n${mods.map(m => `${m.name}: ${m.desc}`).join('\n')}">MODS ${mods.length}</span>`;
}
function modsListText(ids) {
  return (ids || []).map(getMod).filter(Boolean).map(m => m.name).join(', ');
}

if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    const _render = renderBreweryChoices;
    renderBreweryChoices = function () { const r = _render.apply(this, arguments); renderModPicker(); return r; };
  });
}

// disaster.js — Brew Day Disaster map node
// No rival. Murphy's Law hits your brewhouse at the start of every turn after the first,
// and you can always see the next breakdown coming. Pay to fix things, with budget
// (hurts this fight) or gold (hurts your run). Score as much as you can: reward tiers.

const FIX_BUDGET = 2;
const FIX_GOLD   = 20;

// Score targets per act: [bronze, silver, gold]
const DISASTER_TIERS = [
  [130, 170, 205],
  [160, 205, 245],
  [180, 225, 260],
];
const DISASTER_GOLD = [30, 40, 50];   // bronze reward per act (silver and gold add more on top)
const DISASTER_FAIL_REP = 5;

const BREAKDOWNS = {
  boiler:     { name: 'Boiler down',        icon: '🔥', lasting: true,  desc: 'Your hot side scores half until you fix it.' },
  glycol:     { name: 'Glycol failure',     icon: '❄', lasting: true,  desc: 'Your cold side scores half until you fix it.' },
  power:      { name: 'Power flicker',      icon: '⚡', lasting: false, desc: 'You get 1 less budget this turn.' },
  pump:       { name: 'Pump clog',          icon: '🥣', lasting: false, desc: 'A Stuck Mash (−8) lands on your hot side.' },
  wildyeast:  { name: 'Wild yeast',         icon: '🦠', lasting: false, desc: 'A Contamination is shuffled into your deck.' },
  hose:       { name: 'Burst hose',         icon: '💦', lasting: false, desc: 'Your best card loses 8.' },
  inspection: { name: 'Surprise inspection', icon: '📋', lasting: false, desc: 'If any negative token is on your board, a −10 fine.' },
};
const BREAKDOWN_IDS = Object.keys(BREAKDOWNS);

function isDisaster() { return !!(state && state.disaster); }

function disasterTiers() {
  const act = state.currentNode ? state.currentNode.act || 0 : 0;
  return DISASTER_TIERS[Math.min(2, act)];
}

function startDisaster(node) {
  setScreen('game-screen');
  initGame({ node, disaster: true, testDummy: true });
}

// Called from initGame
function initDisasterState() {
  state.disaster = { next: rollBreakdown(), active: [], hits: 0 };
  state.rivalName = "Murphy's Law";
  addLog(`🔧 Brew Day Disaster! Things will go wrong every turn. Targets: 🥉 ${disasterTiers()[0]} · 🥈 ${disasterTiers()[1]} · 🥇 ${disasterTiers()[2]}.`, 'warn');
}

function rollBreakdown() {
  const d = state.disaster;
  // Don't announce a lasting breakdown that's already active
  const pool = BREAKDOWN_IDS.filter(id => !(BREAKDOWNS[id].lasting && d && d.active.includes(id)) && !(d && d.next === id));
  return pool[Math.floor(Math.random() * pool.length)];
}

// Start of each turn after the first: the announced breakdown hits, the next is revealed
function disasterTurn() {
  const d = state.disaster;
  if (!d) return;
  const id = d.next;
  if (id) applyBreakdown(id);
  d.next = state.turn < maxTurns() ? rollBreakdown() : null;
}

function applyBreakdown(id) {
  const d = state.disaster, b = BREAKDOWNS[id];
  d.hits++;
  if (b.lasting) {
    if (!d.active.includes(id)) d.active.push(id);
  } else if (id === 'power') {
    state.budget = Math.max(0, state.budget - 1);
  } else if (id === 'pump') {
    state.field.hot.p.push(createToken('stuckmash'));
  } else if (id === 'wildyeast') {
    shuffleIntoRemainingDeck('p', 'contamination');
  } else if (id === 'hose') {
    let best = null, bestPts = -Infinity;
    LANES.forEach(l => state.field[l].p.forEach(c => {
      if (c.cat === 'token') return;
      const pts = effectivePoints(c, l, 'p');
      if (pts > bestPts) { best = c; bestPts = pts; }
    }));
    if (best) best.points -= 8;
  } else if (id === 'inspection') {
    const dirty = LANES.some(l => state.field[l].p.some(c => c.cat === 'token' && c.points < 0));
    if (dirty) {
      const fine = createToken('mishap');
      fine.points = -10;
      fine.name = 'Inspection Fine';
      state.field.hot.p.push(fine);
    } else {
      addLog('📋 The inspector finds a clean brewhouse. No fine.', 'player');
      return;
    }
  }
  addLog(`${b.icon} ${b.name}! ${b.desc}`, 'warn');
  if (typeof juiceBanner === 'function') juiceBanner(`${b.icon} ${b.name.toUpperCase()}!<small>${b.desc}</small>`, 'red', 1500);
}

// Sour cards in a disaster: each Acid you'd give the rival becomes +TART_PER_ACID on your board
const TART_PER_ACID = 4;
function addTartness(n) {
  let t = state.field.cold.p.find(c => c.id === 'tartness');
  if (!t) { t = createToken('tartness'); state.field.cold.p.push(t); }
  t.points += n * TART_PER_ACID;
  addLog(`🍋 No rival to sour: tartness protects your beer, +${n * TART_PER_ACID}.`, 'player');
}

// Halving from lasting breakdowns (used by laneScore)
function disasterLaneMult(lane, who) {
  if (!isDisaster() || who !== 'p') return 1;
  const a = state.disaster.active;
  if (lane === 'hot' && a.includes('boiler')) return 0.5;
  if (lane === 'cold' && a.includes('glycol')) return 0.5;
  return 1;
}

// ── Fixing ──
// target: 'next' (prevent the announced breakdown) or a lasting breakdown id (repair it)

function canPayFix(how) {
  if (!isDisaster() || state.phase !== 'play' || !state.playerTurn || pendingChoiceActive()) return false;
  if (how === 'budget') return state.budget - state.budgetUsed >= FIX_BUDGET;
  return typeof mapState !== 'undefined' && mapState && mapState.gold >= FIX_GOLD;
}

function fixBreakdown(target, how) {
  if (!canPayFix(how)) return;
  const d = state.disaster;
  let what;
  if (target === 'next') {
    if (!d.next) return;
    what = BREAKDOWNS[d.next];
    d.next = null;
  } else {
    if (!d.active.includes(target)) return;
    what = BREAKDOWNS[target];
    d.active = d.active.filter(x => x !== target);
  }
  if (how === 'budget') state.budgetUsed += FIX_BUDGET;
  else mapState.gold -= FIX_GOLD;
  addLog(`🔧 Fixed: ${what.name} (${how === 'budget' ? `${FIX_BUDGET} budget` : `${FIX_GOLD} gold`}).`, 'player');
  render();
}

function fixButtons(target) {
  const b = canPayFix('budget'), g = canPayFix('gold');
  return `<button class="btn btn-fix" ${b ? `onclick="fixBreakdown('${target}','budget')"` : 'disabled'}>FIX: ${FIX_BUDGET} budget</button>
          <button class="btn btn-fix" ${g ? `onclick="fixBreakdown('${target}','gold')"` : 'disabled'}>FIX: 💰${FIX_GOLD}</button>`;
}

function disasterPanelHtml() {
  const d = state.disaster;
  const [b, s, g] = disasterTiers();
  const score = totalScore('p');
  const tierNow = score >= g ? '🥇' : score >= s ? '🥈' : score >= b ? '🥉' : '';
  const rows = [];
  if (d.next) {
    const nb = BREAKDOWNS[d.next];
    rows.push(`<div class="disaster-row disaster-next"><span><b>NEXT TURN:</b> ${nb.icon} ${nb.name}. ${nb.desc}</span><span>${fixButtons('next')}</span></div>`);
  } else if (state.phase === 'play') {
    rows.push(`<div class="disaster-row"><span><b>NEXT TURN:</b> nothing (for once).</span></div>`);
  }
  d.active.forEach(id => {
    const ab = BREAKDOWNS[id];
    rows.push(`<div class="disaster-row disaster-active"><span><b>BROKEN:</b> ${ab.icon} ${ab.name}. ${ab.desc}</span><span>${fixButtons(id)}</span></div>`);
  });
  return `<div class="disaster-panel">
    <div class="disaster-head">🔧 MURPHY'S LAW <span class="disaster-tiers">
      <span class="${score >= b ? 'tier-hit' : ''}">🥉 ${b}</span> · <span class="${score >= s ? 'tier-hit' : ''}">🥈 ${s}</span> · <span class="${score >= g ? 'tier-hit' : ''}">🥇 ${g}</span>
      ${tierNow ? `<span class="tier-now">now ${tierNow}</span>` : ''}</span></div>
    ${rows.join('')}
  </div>`;
}

function disasterTier(score) {
  const [b, s, g] = disasterTiers();
  return score >= g ? 3 : score >= s ? 2 : score >= b ? 1 : 0;
}

const TIER_NAMES = ['MISSED', '🥉 BRONZE', '🥈 SILVER', '🥇 GOLD'];

// ── End of the brew day ──

function onDisasterEnd(node) {
  const score = state.lastRoundScore ? state.lastRoundScore.p : totalScore('p');
  const tier  = disasterTier(score);
  const act   = Math.min(2, node.act || 0);
  let gold = 0, relic = null, rep = 0;
  if (tier === 0) {
    rep = DISASTER_FAIL_REP;
    mapState.rep = Math.max(0, mapState.rep - rep);
    if (typeof trackBattleLoss === 'function') trackBattleLoss(mapState.rep <= 0);
    if (mapState.rep <= 0) { showRunLoss('Your reputation hit zero after a brew day disaster.'); return; }
  } else {
    gold = DISASTER_GOLD[act] + (tier >= 2 ? 15 : 0) + (tier >= 3 ? 25 : 0);
    mapState.gold += gold;
    if (tier >= 3) {
      const owned = mapState.relics || [];
      const left = RELICS.filter(r => !owned.includes(r.id));
      if (left.length) {
        relic = left[Math.floor(Math.random() * left.length)];
        mapState.relics = [...owned, relic.id];
      }
    }
    if (typeof trackBattleWin === 'function') trackBattleWin(node, gold);
  }
  const offerKind = tier >= 3 ? 'festival' : tier === 2 ? 'normal' : null;
  saveRun({ screen: 'disaster', nodeId: node.id, score, tier, gold, relic: relic && relic.id, offerKind });
  showDisasterResult({ score, tier, gold, relic, rep, offerKind });
}

let disasterOffer = [];

function showDisasterResult(r) {
  const [b, s, g] = DISASTER_TIERS[Math.min(2, mapState.act || 0)];
  showSpecial('🔧 BREW DAY DISASTER', `You scored ${r.score}. Targets were 🥉 ${b} · 🥈 ${s} · 🥇 ${g}.`);
  const lines = [`<div class="disaster-result-tier tier-${r.tier}">${TIER_NAMES[r.tier]}</div>`];
  if (r.tier === 0) lines.push(`<div>The batch is a write-off. −${r.rep || DISASTER_FAIL_REP} Reputation.</div>`);
  else {
    lines.push(`<div>+${r.gold} gold</div>`);
    if (r.relic) lines.push(`<div>${r.relic.icon} New equipment: <b>${r.relic.name}</b>. ${r.relic.desc}</div>`);
  }
  disasterOffer = r.offerKind ? generateMapOffer(r.offerKind) : [];
  if (disasterOffer.length) {
    lines.push(`<div style="margin-top:8px;">${r.offerKind === 'festival' ? 'Pick a premium card:' : 'Pick a card:'}</div>`);
    lines.push(`<div class="special-cards">${disasterOffer.map((c, i) => specialCardHtml(c, `pickDisasterCard(${i})`)).join('')}</div>`);
  }
  setSpecialBody(`<div class="disaster-result">${lines.join('')}</div>`);
  setSpecialFooter(`<button class="btn btn-primary" onclick="leaveDisaster()">${disasterOffer.length ? 'Skip card' : 'Continue →'}</button>`);
}

function pickDisasterCard(i) {
  const c = disasterOffer[i];
  if (c && draftState.deck.length < MAX_DECK_SIZE) draftState.deck.push({ ...getCardDef(c.id) });
  leaveDisaster();
}

function leaveDisaster() {
  disasterOffer = [];
  saveRun({ screen: 'map' });
  showMapScreen();
}

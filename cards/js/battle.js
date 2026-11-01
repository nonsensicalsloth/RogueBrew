// battle.js — player card play, lane enforcement, enemy AI

let selectedCard = null;

// ── Player ──

function selectCard(idx) {
  if (!state.playerTurn || state.phase !== 'play') return;
  const c = state.pHand[idx];
  if (!c || getEffectiveCost(c) > state.budget - state.budgetUsed) return;
  selectedCard = (selectedCard === idx) ? null : idx;
  render();
}

function getEffectiveCost(c) {
  // Honey is free if it's the first adjunct on your board this round
  if (c.id === 'honey' && !getAllOnField('p').some(x => x.cat === 'adjunct')) return 0;
  // Grapefruit Zest makes the next hop free
  if (c.cat === 'hop' && state.nextHopFree) return 0;
  let discount = state.nextCardDiscount || 0;
  if (c.cat === 'yeast') discount += (state.nextYeastDiscount || 0);
  if (c.cat === 'hop')   discount += (state.nextHopDiscount   || 0);
  return Math.max(0, c.cost - discount);
}

function playToLane(lane) {
  if (selectedCard === null) return;
  const c = state.pHand[selectedCard];
  if (!c) return;

  // Lane restriction check
  const allowed = c.lane === 'both' ? ['hot', 'cold'] : [c.lane];
  if (!allowed.includes(lane)) {
    addLog(`Cannot play ${c.name} on ${LANE_NAMES[lane]}!`, 'warn');
    return;
  }

  const effectiveCost = getEffectiveCost(c);
  if (effectiveCost > state.budget - state.budgetUsed) {
    addLog('Not enough budget!', 'warn');
    return;
  }

  // Remove from hand, place on field
  state.pHand.splice(selectedCard, 1);
  state.budgetUsed += effectiveCost;

  // Consume discounts
  if (state.nextCardDiscount > 0) state.nextCardDiscount = 0;
  if (c.cat === 'yeast') state.nextYeastDiscount = 0;
  if (c.cat === 'hop')   { state.nextHopDiscount = 0; state.nextHopFree = false; }

  addLog(`You play ${c.name} (+${c.points}) → ${LANE_NAMES[lane]}`, 'player');
  resolvePlay(c, lane, 'p');

  selectedCard = null;
  render();
}

// ── Shared play resolution (player and rival) ──
// Places the card, runs its effect and synergies, then tidies up.
function resolvePlay(c, lane, who) {
  state.field[lane][who].push(c);

  // Pending hop buff from Extra Pale Pilsner / Wheat (player only)
  if (who === 'p' && c.cat === 'hop' && (state.pendingHopBuff || 0) > 0) {
    c.points += state.pendingHopBuff;
    addLog(`Hop buff applied: +${state.pendingHopBuff} to ${c.name}!`, 'player');
    state.pendingHopBuff = 0;
  }

  // Any hop in the boil clears one Sugar Clot
  if (c.cat === 'hop' && lane === 'hot') removeSugarClot(who);

  applyCardEffect(c, lane, who);
  applyThiolOnPlay(c, who);
  trackLastHop(c, who);
  trackLastMalt(c, who);

  if (c.tags && c.tags.includes('c-hop'))   applyCHopSynergy(lane, who);
  if (c.tags && c.tags.includes('nuanced')) applyNuancedSynergy(who);

  // Process cards that ended with no points leave the board after resolving
  if (c.cat === 'process' && c.points === 0) {
    LANES.forEach(l => {
      const i = state.field[l][who].indexOf(c);
      if (i >= 0) state.field[l][who].splice(i, 1);
    });
    (who === 'p' ? state.pDiscard : state.eDiscard).push(c);
  }

  // Track last played card AFTER effects, so Double Batch / Blueberry see the previous one
  if (who === 'p') {
    state.lastPlayedCard = c;
    state.lastPlayedLane = lane;
  }
  state.cardsThisTurn = state.cardsThisTurn || { p: 0, e: 0 };
  state.cardsThisTurn[who]++;

  checkContaminationInHand(who);
}

function endTurn() {
  selectedCard = null;
  state.playerTurn = false;
  render();
  setTimeout(() => { enemyTurn(); render(); }, 500);
}

// ── Enemy AI ──
// Prioritizes disruptive process cards when behind,
// otherwise plays highest scoring card it can afford.

const ENEMY_DISRUPT_CARDS = new Set([
  'badbatch','inspector','crosscontam','drunkcellar','drunkbrewer','hopthief'
]);
function enemyPlayCard(c) {
  const lane = c.lane === 'both' ? 'hot' : c.lane;
  addLog(c.cat === 'process' ? `Rival uses ${c.name}!` : `Rival plays ${c.name} (+${c.points}) → ${LANE_NAMES[lane]}`, 'enemy');
  resolvePlay(c, lane, 'e');
}

function enemyTurn() {
  const lead = totalScore('e') - totalScore('p');
  if (lead >= 50) {
    addLog(`Rival is ${lead} ahead — ends turn.`, 'enemy');
    setTimeout(() => advanceTurn(), 300);
    return;
  }

  let remaining = state.budget;
  let playedAny = false;

  // If behind, try a disruptive card first
  if (lead < 0) {
    const disrupt = state.eHand.filter(c => ENEMY_DISRUPT_CARDS.has(c.id) && c.cost <= remaining);
    if (disrupt.length > 0) {
      const c = disrupt[0];
      state.eHand.splice(state.eHand.indexOf(c), 1);
      remaining -= c.cost;
      enemyPlayCard(c);
      playedAny = true;
    }
  }

  // Keep playing highest scoring affordable cards until budget runs out
  let keepGoing = true;
  while (keepGoing && remaining > 0) {
    const sorted = state.eHand
      .filter(c => !ENEMY_DISRUPT_CARDS.has(c.id) && c.cost <= remaining)
      .sort((a, b) => b.points - a.points);

    if (sorted.length === 0) { keepGoing = false; break; }

    const c = sorted[0];
    state.eHand.splice(state.eHand.indexOf(c), 1);
    remaining -= c.cost;
    enemyPlayCard(c);
    playedAny = true;
  }

  if (!playedAny) addLog('Rival has nothing to play.', 'enemy');
  setTimeout(() => advanceTurn(), 300);
}

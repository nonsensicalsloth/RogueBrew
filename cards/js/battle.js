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
  state.field[lane].p.push(c);
  state.budgetUsed += effectiveCost;

  // Consume discount if used
  if (state.nextCardDiscount > 0)   state.nextCardDiscount  = 0;
  if (c.cat === 'yeast' && state.nextYeastDiscount > 0) state.nextYeastDiscount = 0;
  if (c.cat === 'hop'   && state.nextHopDiscount   > 0) state.nextHopDiscount   = 0;

  // Track last played card for Double Batch etc
  state.lastPlayedCard = { ...c };
  state.lastPlayedLane = lane;

  addLog(`You play ${c.name} (+${c.points}) → ${LANE_NAMES[lane]}`, 'player');

  // Apply pending hop buff from Extra Pale Pilsner/Wheat
  if (c.cat === 'hop' && (state.pendingHopBuff || 0) > 0) {
    c.points += state.pendingHopBuff;
    addLog(`Hop buff applied: +${state.pendingHopBuff} to ${c.name}!`, 'player');
    state.pendingHopBuff = 0;
  }

  // Auto-remove sugar clot when any hop lands on hot side
  if (c.cat === 'hop' && lane === 'hot') {
    removeFirstToken('p', 'sugar_clot');
    removeFirstToken('p', 'sugar_clot8');
  }

  // Apply on-play effects
  applyCardEffect(c, lane, 'p');

  // Check c-hop synergy if it's a hop
  if (c.tags && c.tags.includes('c-hop')) {
    applyCHopSynergy(lane, 'p');
  }

  // Check nuanced synergy
  if (c.tags && c.tags.includes('nuanced')) {
    applyNuancedSynergy('p');
  }

  // Check for contamination in hand (auto-plays immediately)
  checkContaminationInHand();

  selectedCard = null;
  render();
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
const ENEMY_PROCESS_CARDS = new Set([
  'badbatch','inspector','crosscontam','drunkcellar','drunkbrewer','hopthief',
  'doublebatch','barreltrans','fermlog','coldcrash','heatkill','cip','sip','filtration'
]);

function enemyPlayCard(c) {
  const lane = c.lane === 'both' ? 'hot' : c.lane;

  if (ENEMY_PROCESS_CARDS.has(c.id)) {
    // Process cards trigger effect but don't go on the field
    addLog(`Rival uses ${c.name}!`, 'enemy');
    applyCardEffect(c, lane, 'e');
  } else {
    state.field[lane].e.push(c);
    addLog(`Rival plays ${c.name} (+${c.points}) → ${LANE_NAMES[lane]}`, 'enemy');
    applyCardEffect(c, lane, 'e');
    if (c.tags && c.tags.includes('c-hop'))  applyCHopSynergy(lane, 'e');
    if (c.tags && c.tags.includes('nuanced')) applyNuancedSynergy('e');
  }
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

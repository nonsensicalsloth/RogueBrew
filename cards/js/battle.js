// battle.js — player card play, lane enforcement, enemy AI

let selectedCard = null;

// ── Player ──

function selectCard(idx) {
  if (!state.playerTurn || state.phase !== 'play') return;
  const c = state.pHand[idx];
  if (!c || getEffectiveCost(c) > state.budget - state.budgetUsed) return;
  // While Contamination is in hand, it's the only card you can pick
  if (playerMustPlayContamination() && !isContamination(c)) return;
  // Finish choosing a target for the last card first
  if (cardTargetingActive()) return;
  selectedCard = (selectedCard === idx) ? null : idx;
  render();
}

function getEffectiveCost(c) {
  // Honey is free if it's the first adjunct on your board this round
  if (c.id === 'honey' && !getAllOnField('p').some(x => x.cat === 'adjunct')) return 0;
  // Grapefruit Zest makes the next hop free; Hop Back makes the first hop each round free
  if (c.cat === 'hop' && state.nextHopFree) return 0;
  // Filtration: a re-pitched yeast is free on the turn it came back
  if (c._freeKey && c._freeKey === `${state.round}:${state.turn}`) return 0;
  if (c.cat === 'hop' && hasRelic('hopback') && !state.hopBackUsed) return 0;
  // Hop House ability: a scouted hop costs 1 less on the turn it was drawn
  const scout = c._scoutKey && c._scoutKey === abilityKey() ? 1 : 0;
  let discount = state.nextCardDiscount || 0;
  if (c.cat === 'yeast') discount += (state.nextYeastDiscount || 0);
  if (c.cat === 'hop')   discount += (state.nextHopDiscount   || 0);
  return Math.max(0, c.cost - discount - scout);
}

function playToLane(lane) {
  if (selectedCard === null) return;
  if (cardTargetingActive()) return;
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
  if (c.cat === 'hop')   { state.nextHopDiscount = 0; state.nextHopFree = false; state.hopBackUsed = true; }

  addLog(`You play ${c.name} (+${c.points}) → ${LANE_NAMES[lane]}`, 'player');
  resolvePlay(c, lane, 'p');

  selectedCard = null;
  render();
}

// Process cards that already draw on their own don't get the extra cantrip draw
const CANTRIP_EXEMPT = ['drunkcellar', 'drunkbrewer', 'inspector'];

// ── Shared play resolution (player and rival) ──
// Places the card, runs its effect and synergies, then tidies up.
function resolvePlay(c, lane, who) {
  c = softenContamination(c, who);
  state.field[lane][who].push(c);

  // Pending hop buff from Extra Pale Pilsner / Wheat (player only)
  if (who === 'p' && c.cat === 'hop' && (state.pendingHopBuff || 0) > 0) {
    c.points += state.pendingHopBuff;
    addLog(`Hop buff applied: +${state.pendingHopBuff} to ${c.name}!`, 'player');
    state.pendingHopBuff = 0;
  }

  // Brewery passives (map runs only)
  if (who === 'p' && c.cat !== 'token') {
    const brew = activeBrewery();
    if (brew === 'lagerhaus' && c.tags && c.tags.includes('crisp')) {
      c.points += 1;
      addLog(`Lagerhaus: ${c.name} +1 (crisp).`, 'player');
    }
    if (brew === 'hophouse' && c.cat === 'hop' && !state.firstHopBonusUsed) {
      c.points += 2;
      state.firstHopBonusUsed = true;
      addLog(`Hop House: first hop this turn — ${c.name} +2.`, 'player');
    }
  }

  // Hop Cannon relic: your cold side hops get +2
  if (who === 'p' && c.cat === 'hop' && lane === 'cold' && hasRelic('hopcannon')) {
    c.points += 2;
    addLog(`Hop Cannon: ${c.name} +2!`, 'player');
  }

  // Haze Lord boss: its hops get +3
  if (who === 'e' && c.cat === 'hop' && state.rivalTrait === 'juicebomb') c.points += 3;

  // Any hop in the boil clears one Sugar Clot
  if (c.cat === 'hop' && lane === 'hot') removeSugarClot(who);

  applyCardEffect(c, lane, who);
  applyThiolOnPlay(c, who);
  trackLastHop(c, who);
  trackLastMalt(c, who);

  if (c.tags && c.tags.includes('c-hop'))   applyCHopSynergy(lane, who);
  if (c.tags && c.tags.includes('nuanced')) applyNuancedSynergy(who);

  // Process cards that ended with no points leave the board after resolving,
  // and replace themselves with a card draw (a "cantrip", like Slay the Spire)
  if (c.cat === 'process' && c.points === 0) {
    LANES.forEach(l => {
      const i = state.field[l][who].indexOf(c);
      if (i >= 0) state.field[l][who].splice(i, 1);
    });
    (who === 'p' ? state.pDiscard : state.eDiscard).push(c);
    if (!CANTRIP_EXEMPT.includes(c.id)) drawFor(who, 1);
  }

  // Track last played card AFTER effects, so Double Batch / Blueberry see the previous one
  if (who === 'p') {
    state.lastPlayedCard = c;
    state.lastPlayedLane = lane;
  }
  // Forced Contamination plays don't count as your "first card" (Pilsner Malt etc.)
  state.cardsThisTurn = state.cardsThisTurn || { p: 0, e: 0 };
  if (!isContamination(c)) state.cardsThisTurn[who]++;

  checkContaminationInHand(who);
}

function endTurn() {
  if (cardTargetingActive()) { addLog('Choose a target for your card first.', 'warn'); render(); return; }
  state.abilityTargeting = false;
  if (playerMustPlayContamination()) {
    addLog('⚠ You must pour the Contamination before ending your turn.', 'warn');
    render();
    return;
  }
  selectedCard = null;
  state.newCards = new Set();
  state.rivalSummary = [];
  state.playerTurn = false;
  render();
  setTimeout(() => { enemyTurn(); render(); }, 500);
}

function enemyPass(reason) {
  state.ePassed = true;
  addLog(`Rival stops brewing this round${reason ? ' — ' + reason : ''}.`, 'enemy');
}

// ── Enemy AI ──
// Prioritizes disruptive process cards when behind,
// otherwise plays highest scoring card it can afford.

// Rival decisions live in rivalai.js (planning, intents). This just plays them out.
function enemyPlayCard(c, laneOverride) {
  const lane = laneOverride || rivalLaneFor(c);
  addLog(c.cat === 'process' ? `Rival uses ${c.name}!` : `Rival plays ${c.name} (+${c.points}) → ${LANE_NAMES[lane]}`, 'enemy');
  resolvePlay(c, lane, 'e');
}

function enemyTurn() {
  if (state.phase !== 'play') return;
  // Capture the log lines from this rival turn so the player sees a summary
  const logMark = state.logs[0];
  setTimeout(() => {
    const i = state.logs.indexOf(logMark);
    state.rivalSummary = state.logs.slice(0, i < 0 ? state.logs.length : i)
      .filter(l => l.type === 'enemy' || l.type === 'warn').map(l => l).reverse();
    render();
  }, 350);
  if (state.ePassed) { setTimeout(() => advanceTurn(), 300); return; }

  // Play the plan the rival committed to (shown as its intent during your turn)
  if (!state.rivalPlan) planRivalTurn();
  const played = executeRivalPlan();
  if (!played) addLog('Rival holds back this turn.', 'enemy');

  // Stop if completely out of cards
  if (state.eHand.length === 0 && state.eDeck.length === 0 && state.eDiscard.length === 0) enemyPass('out of ingredients');

  setTimeout(() => advanceTurn(), 300);
}

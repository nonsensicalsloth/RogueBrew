// battle.js — player card play, lane enforcement, enemy AI

let selectedCard = null;

// ── Player ──

function selectCard(idx) {
  if (!state.playerTurn || state.phase !== 'play') return;
  const c = state.pHand[idx];
  if (!c || getEffectiveCost(c) > state.budget - state.budgetUsed) return;
  // While Contamination is in hand, it's the only card you can pick
  if (playerMustPlayContamination() && !isContamination(c)) return;
  // Finish choosing for the last card first
  if (pendingChoiceActive()) return;
  selectedCard = (selectedCard === idx) ? null : idx;
  // Cards that don't care which lane they're in play straight away (no lane click needed)
  if (selectedCard === idx && isLaneFree(c)) { playToLane(c.lane === 'hot' ? 'hot' : 'cold'); return; }
  render();
}

// 0-point process cards that can go on either side: the lane makes no difference to them
const LANE_MATTERS = ['qc', 'doublebatch'];
function isLaneFree(c) {
  return c.cat === 'process' && c.lane === 'both' && c.points === 0 && !LANE_MATTERS.includes(c.id);
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
  let discount = (state.nextCardDiscount || 0) + (state.carryDiscount || 0);
  // Contract Brewer passive: process cards cost 1 less
  if (c.cat === 'process' && activeBrewery() === 'contract') discount += 1;
  if (c.cat === 'yeast') discount += (state.nextYeastDiscount || 0);
  if (c.cat === 'hop')   discount += (state.nextHopDiscount   || 0);
  if (c.cat === 'malt' && hasRelic('grainauger') && !state.augerUsed) discount += 1;   // Grain Auger
  return Math.max(0, c.cost + ruleCostMod(c) - discount - scout);
}

function playToLane(lane) {
  if (selectedCard === null) return;
  if (pendingChoiceActive()) return;
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

  // Session Beer Cup: a full side means choosing a card to replace first
  if (sideFull(lane, 'p')) { startSessionReplace(lane); return; }

  // Remove from hand, place on field
  juiceFlyStart(selectedCard, c);
  state.pHand.splice(selectedCard, 1);
  state.budgetUsed += effectiveCost;

  // Consume discounts
  if (state.nextCardDiscount > 0) state.nextCardDiscount = 0;
  if (state.carryDiscount > 0)    state.carryDiscount = 0;
  if (c.cat === 'yeast') state.nextYeastDiscount = 0;
  if (c.cat === 'hop')   { state.nextHopDiscount = 0; state.nextHopFree = false; state.hopBackUsed = true; }
  if (c.cat === 'malt')  state.augerUsed = true;

  addLog(`You play ${c.name} (+${c.points}) → ${LANE_NAMES[lane]}`, 'player');
  trackGoalPlay(c);
  resolvePlay(c, lane, 'p');

  selectedCard = null;
  render();
}

// Process cards that already draw on their own don't get the extra cantrip draw
const CANTRIP_EXEMPT = ['drunkcellar', 'drunkbrewer', 'inspector', 'grainout', 'trubdump', 'yeastharvest','grainreview'];

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
    if (brew === 'hophouse' && c.cat === 'hop' && !state.firstHopBonusUsed) {
      c.points += 2;
      state.firstHopBonusUsed = true;
      addLog(`Hop House: first hop this turn, ${c.name} +2.`, 'player');
    }
  }

  // Hop Cannon relic: your cold side hops get +2
  if (who === 'p' && c.cat === 'hop' && lane === 'cold' && hasRelic('hopcannon')) {
    c.points += 2;
    addLog(`Hop Cannon: ${c.name} +2!`, 'player');
  }

  // Haze Lord boss: its hops get +3
  if (who === 'e' && c.cat === 'hop' && state.rivalTrait === 'juicebomb') c.points += 3;


  const achB = who === 'p' && typeof achBeforePlay === 'function' ? achBeforePlay() : null;
  if (typeof statsBeforePlay === 'function') statsBeforePlay(who);
  consumeLagering(c, who);
  applyCardEffect(c, lane, who);
  if (c.tags && c.tags.includes('sticky') && lane === 'hot') checkStuckMash(who);
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
  if (!isContamination(c)) {
    state.cardsThisTurn[who]++;
    state.cardsThisRound = state.cardsThisRound || { p: 0, e: 0 };
    state.maltsThisRound = state.maltsThisRound || { p: 0, e: 0 };
    state.cardsThisRound[who]++;
    if (c.cat === 'malt') state.maltsThisRound[who]++;
    phillyFollowUp(c, who);
  }
  if (achB) achAfterPlay(c, lane, achB);
  if (typeof statsCardPlayed === 'function') statsCardPlayed(c, who);

  // Tamed Contamination fizzles out instead of taking up space
  if (c.id === 'contam_tamed') LANES.forEach(l => { state.field[l][who] = state.field[l][who].filter(x => x !== c); });
  checkContaminationInHand(who);
}

function endTurn() {
  if (pendingChoiceActive()) { addLog('Finish choosing for your card first.', 'warn'); render(); return; }
  state.abilityTargeting = false;
  if (playerMustPlayContamination()) {
    addLog('⚠ You must pour the Contamination before ending your turn.', 'warn');
    render();
    return;
  }
  selectedCard = null;
  if (typeof statsTurnEnded === 'function') statsTurnEnded();
  // Whatever budget you didn't spend goes into Lagering for your next crisp card
  if (state.phase === 'play') bankLagering('p', state.budget - state.budgetUsed);
  state.newCards = new Set();
  state.rivalSummary = [];
  state.playerTurn = false;
  render();
  setTimeout(() => { enemyTurn(); render(); }, jMs(500));
}

function enemyPass(reason) {
  state.ePassed = true;
  addLog(`Rival stops brewing this round${reason ? ': ' + reason : ''}.`, 'enemy');
}

// ── Enemy AI ──
// Prioritizes disruptive process cards when behind,
// otherwise plays highest scoring card it can afford.

// Rival decisions live in rivalai.js (planning, intents). This just plays them out.
function enemyPlayCard(c, laneOverride) {
  const lane = laneOverride || rivalLaneFor(c);
  rivalMakeRoom(lane);
  if (ruleOn('blind')) addLog(`Rival plays a card → ${LANE_NAMES[lane]} (hidden).`, 'enemy');
  else addLog(c.cat === 'process' ? `Rival uses ${c.name}!` : `Rival plays ${c.name} (+${c.points}) → ${LANE_NAMES[lane]}`, 'enemy');
  resolvePlay(c, lane, 'e');
}

function enemyTurn() {
  if (state.phase !== 'play') return;
  // Brew Day Disaster: nobody across the aisle, Murphy's Law acts at the start of your turn
  if (state.disaster) { setTimeout(() => advanceTurn(), 250); return; }
  // Capture the log lines from this rival turn so the player sees a summary
  const logMark = state.logs[0];
  const finish = () => {
    setTimeout(() => advanceTurn(), 300);
    setTimeout(() => {
      const i = state.logs.indexOf(logMark);
      state.rivalSummary = state.logs.slice(0, i < 0 ? state.logs.length : i)
        .filter(l => l.type === 'enemy' || l.type === 'warn').map(l => l).reverse();
      render();
    }, 350);
  };
  if (state.ePassed) { finish(); return; }

  // Play the plan the rival committed to (shown as its intent during your turn)
  if (!state.rivalPlan) planRivalTurn();
  const after = played => {
    if (!played) addLog('Rival holds back this turn.', 'enemy');
    // Stop if completely out of cards
    if (state.eHand.length === 0 && state.eDeck.length === 0 && state.eDiscard.length === 0) enemyPass('out of ingredients');
    finish();
  };
  // With animations on, the rival plays its cards one at a time so you can follow along
  if (juiceOn()) executeRivalPlanStepwise(after);
  else after(executeRivalPlan());
}

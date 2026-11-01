// game.js — game state, round/turn management, init

const LANES = ['hot', 'cold'];
const LANE_NAMES = { hot: 'Hot side', cold: 'Cold side' };

// ── Game State ──
let state = {};

// Transient flags that should never carry from one battle into the next
const BATTLE_FLAGS = ['_basePoints','_thiolReleased','_victory','_award','_locked','_noMultiplier','_mixedFerm'];

function freshCopy(c) {
  const copy = { ...c, tags: [...(c.tags || [])] };
  BATTLE_FLAGS.forEach(f => delete copy[f]);
  return copy;
}

// Single entry point for every battle.
//   initGame()                      — practice game (default rival, best of 3)
//   initGame({ rivalDeck, node })   — map battle (1 round, or best of 3 for bosses)
function initGame(opts = {}) {
  document.getElementById('overlay').classList.add('hidden');
  selectedCard = null;

  const node   = opts.node || null;
  const isBoss = node ? node.type === 'boss' : false;

  const pDeck = shuffle(draftState.deck.length > 0
    ? draftState.deck.map(freshCopy)
    : buildDefaultDeck());
  const eDeck = shuffle(opts.rivalDeck ? opts.rivalDeck.map(freshCopy) : buildEnemyDeck());

  state = {
    phase:      'mulligan',
    round:      1,
    turn:       0,
    playerTurn: true,
    budget:     0,
    budgetUsed: 0,
    pDeck,
    eDeck,
    pDiscard:   [],
    eDiscard:   [],
    pHand:      [],
    eHand:      [],
    field: {
      hot:  { p: [], e: [] },
      cold: { p: [], e: [] },
    },
    roundWins:        [],
    mulSel:           [],
    logs:             [],
    victoryCards:     [],
    maxRounds:        node ? (isBoss ? 3 : 1) : 3,
    currentNode:      node,
    isBoss,
    pPassed:          false,
    rivalBonus:       opts.rivalBonus || 0,
    rivalBonusName:   opts.rivalBonusName || 'Crowd Favorite',
    rivalName:        opts.rival ? opts.rival.name : 'Rival Brewery',
    rivalTrait:       opts.rival ? opts.rival.trait || null : null,
    hopBackUsed:      false,
    ePassed:          false,
    nextCardDiscount: 0,
    roastTokens:      0,
    roastSafe:        0,
    roastThreshold:   5,
    eRoastTokens:     0,
    eRoastSafe:       0,
    eRoastThreshold:  5,
    cardsThisTurn:    { p: 0, e: 0 },
    lastMalt:         {},
    lastHop:          {},
    nextHopFree:      false,
    nextYeastDiscount:0,
    nextHopDiscount:  0,
    pendingHopBuff:   0,
    lastPlayedCard:   null,
    lastPlayedLane:   null,
  };

  if (opts.rival) {
    addLog(`⚔ ${opts.rival.name} (${opts.rival.style})${opts.rival.traitName ? ` — ${opts.rival.traitName}: ${opts.rival.traitDesc}` : ''}`, 'enemy');
  }
  drawCards(5, state.pDeck, state.pHand);
  drawCards(5, state.eDeck, state.eHand);
  render();
}

// ── Budget ──
function getBudget(turn, who = 'p') {
  const cap = 5 + (who === 'p' && hasRelic('fermenter') ? 1 : 0);
  return Math.min(turn, cap);
}

// ── Scoring ──
function laneScore(lane, who) {
  const raw = state.field[lane][who].reduce((s, c) => s + c.points, 0);
  if (lane === 'hot') {
    const k = roastKeys(who);
    const roast = (state[k.t] || 0) - (state[k.s] || 0);
    if (roast >= (state[k.th] || 5)) return Math.floor(raw / 2);
  }
  return raw;
}
function totalScore(who) {
  return LANES.reduce((s, l) => s + laneScore(l, who), 0);
}

// ── Logging ──
function addLog(msg, type = 'sys') {
  state.logs.unshift({ msg, type });
  if (state.logs.length > 10) state.logs.pop();
}

// ── Round management ──
function startRound() {
  state.phase           = 'play';
  state.turn            = 1;
  state.budgetUsed      = 0;
  state.budget          = getBudget(1);
  state.playerTurn      = true;
  state.pPassed         = false;
  state.ePassed         = false;
  state.nextCardDiscount  = 0;
  state.lastPlayedCard    = null;
  state.lastPlayedLane    = null;
  state.lastHop           = {};
  state.roastTokens       = 0;
  state.roastSafe         = 0;
  state.roastThreshold    = 5 + (hasRelic('roaster') ? 2 : 0);
  state.hopBackUsed       = false;
  state.eRoastTokens      = 0;
  state.eRoastSafe        = 0;
  state.eRoastThreshold   = 5;
  state.cardsThisTurn     = { p: 0, e: 0 };
  state.lastMalt          = {};
  state.nextHopFree       = false;
  state.nextYeastDiscount = 0;
  state.nextHopDiscount   = 0;
  state.pendingHopBuff    = 0;
  state.field           = { hot: { p: [...(state.victoryCards || [])], e: [] }, cold: { p: [], e: [] } };
  state.victoryCards    = [];
  addLog(`▶ Round ${state.round} begins! Budget: ${state.budget}`);
  if (state.rivalBonus) {
    const fav = createToken('crowd_fav');
    fav.points = state.rivalBonus;
    fav.name   = state.rivalBonusName;
    state.field.hot.e.push(fav);
    addLog(`${state.rivalBonusName}: rival starts with +${state.rivalBonus}.`, 'enemy');
  }
  if (state.rivalTrait === 'roastmaster') state.eRoastThreshold = 10;
  drawCards(hasRelic('grainmill') ? 2 : 1, state.pDeck, state.pHand);
  drawCards(1, state.eDeck, state.eHand);
}

function endRound() {
  const ps = totalScore('p'), es = totalScore('e');
  addLog(`■ Round ${state.round} ends — You: ${ps}  Rival: ${es}`);
  if (ps > es)      { state.roundWins.push('player'); addLog(`★ You win round ${state.round}!`, 'player'); }
  else if (es > ps) { state.roundWins.push('enemy');  addLog(`✗ Rival wins round ${state.round}.`, 'enemy'); }
  else              { state.roundWins.push('draw');   addLog('— Draw!'); }

  // Handle Victory Malt — keep on board if player won this round
  const victoryCards = state.field.hot.p.filter(c => c._victory);
  // If you didn't win, Victory Malt goes to the discard like everything else
  if (!(ps > es)) victoryCards.forEach(c => delete c._victory);
  const awardCards   = state.field.hot.p.filter(c => c._award)
    .concat(state.field.cold.p.filter(c => c._award));

  LANES.forEach(l => {
    // Tokens (Haze, Body, Sugar Clots, Contamination...) leave the game at round end
    state.pDiscard.push(...state.field[l].p.filter(c => !c._victory && c.cat !== 'token'));
    state.eDiscard.push(...state.field[l].e.filter(c => c.cat !== 'token'));
    state.field[l].p = [];
    state.field[l].e = [];
  });

  // Award Entry — draw 3 if player won
  if (ps > es && awardCards.length > 0) {
    drawCards(3, state.pDeck, state.pHand);
    addLog('Award Entry: you won the round — drew 3 cards!', 'player');
  }

  // Victory Malt — store for next round start
  if (ps > es && victoryCards.length > 0) {
    state.victoryCards = victoryCards;
    addLog(`Victory Malt: carries over to next round!`, 'player');
  } else {
    state.victoryCards = [];
  }

  const pw = state.roundWins.filter(x => x === 'player').length;
  const ew = state.roundWins.filter(x => x === 'enemy').length;

  if (pw >= 2 || ew >= 2 || state.round >= state.maxRounds) {
    state.phase = 'end';
    // Map battles report back to the map; practice games show the overlay
    if (state.currentNode && pw > ew)      onBattleWin(state.currentNode);
    else if (state.currentNode)            onBattleLoss();
    else                                   showOverlay(pw, ew);
  } else {
    state.round++;
    state.phase = 'between';
    if (state.pHand.length) addLog(`Your ${state.pHand.length} card(s) in hand carry into round ${state.round}.`, 'sys');
  }
  render();
}

// ── Turn advancement ──
function advanceTurn() {
  if (state.phase !== 'play') return;
  if (state.pPassed && state.ePassed) { endRound(); return; }

  state.turn++;
  state.budgetUsed = 0;
  state.budget     = getBudget(state.turn);
  state.nextCardDiscount = 0;
  state.cardsThisTurn    = { p: 0, e: 0 };
  if (state.turn > 10) { endRound(); return; }
  addLog(`▸ Turn ${state.turn} — Budget: ${state.budget}`);

  // Passed brewers stop drawing — that's the price of saving cards
  if (!state.pPassed) drawCards(1, state.pDeck, state.pHand);
  if (!state.ePassed) drawCards(state.rivalTrait === 'massprod' ? 2 : 1, state.eDeck, state.eHand);
  if (state.rivalTrait === 'spontaneous' && state.turn % 3 === 0) {
    addLog('Spontaneous Fermentation: wild microbes drift into your deck...', 'enemy');
    shuffleIntoRemainingDeck('p', 'contamination');
  }

  // Persistent effects keep working whether or not you've passed (yeast keeps fermenting)
  applyTurnEffects('p');
  applyTurnEffects('e');
  checkContaminationInHand('p');
  checkContaminationInHand('e');

  if (state.pPassed) {
    // You've passed — the rival keeps brewing on its own
    state.playerTurn = false;
    render();
    setTimeout(() => { enemyTurn(); render(); }, 500);
    return;
  }
  state.playerTurn = true;
  render();
}

// ── Between rounds ──
function startNextRound() {
  drawCards(1, state.pDeck, state.pHand);
  drawCards(1, state.eDeck, state.eHand);
  startRound();
  render();
}

// ── Mulligan ──
function confirmMulligan() {
  state.pDeck  = mulliganCards(state.mulSel, state.pHand, state.pDeck);
  drawCards(state.mulSel.length, state.pDeck, state.pHand);
  state.mulSel = [];
  addLog(`Mulligan done.`);
  startRound();
  render();
}

function mulliganLimit() { return hasRelic('recipebook') ? 3 : 2; }

function toggleMulligan(idx) {
  const s = state.mulSel, pos = s.indexOf(idx);
  if (pos >= 0) s.splice(pos, 1);
  else if (s.length < mulliganLimit()) s.push(idx);
  render();
}

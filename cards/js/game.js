// game.js — game state, round/turn management, init

const LANES = ['hot', 'cold'];
const LANE_NAMES = { hot: 'Hot side', cold: 'Cold side' };

// ── Game State ──
let state = {};

function initGame() {
  document.getElementById('overlay').classList.add('hidden');
  selectedCard = null;

  // Use the player's built deck; enemy always uses default for now
  const pDeck = shuffle(draftState.deck.length > 0
    ? draftState.deck.map(c => ({ ...c }))
    : buildDefaultDeck());
  const eDeck = shuffle(buildEnemyDeck());

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
    maxRounds:        3,
    currentNode:      null,
    isBoss:           false,
    nextCardDiscount: 0,
    roastTokens:      0,
    roastSafe:        0,
    roastThreshold:   5,
    eRoastTokens:     0,
    nextYeastDiscount:0,
    nextHopDiscount:  0,
    pendingHopBuff:   0,
    lastPlayedCard:   null,
    lastPlayedLane:   null,
  };

  drawCards(5, state.pDeck, state.pHand);
  drawCards(5, state.eDeck, state.eHand);
  render();
}

// ── Budget ──
function getBudget(turn) { return Math.min(turn, 5); }

// ── Scoring ──
function laneScore(lane, who) {
  const raw = state.field[lane][who].reduce((s, c) => s + c.points, 0);
  if (lane === 'hot' && who === 'p') {
    const roast     = state.roastTokens || 0;
    const threshold = state.roastThreshold || 5;
    const safe      = state.roastSafe || 0;
    if (roast - safe >= threshold) return Math.floor(raw / 2);
  }
  if (lane === 'hot' && who === 'e') {
    const eRoast = state.eRoastTokens || 0;
    if (eRoast >= 5) return Math.floor(raw / 2);
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
  state.nextCardDiscount  = 0;
  state.lastPlayedCard    = null;
  state.lastPlayedLane    = null;
  state.roastTokens       = 0;
  state.roastSafe         = 0;
  state.roastThreshold    = 5;
  state.eRoastTokens      = 0;
  state.nextYeastDiscount = 0;
  state.nextHopDiscount   = 0;
  state.pendingHopBuff    = 0;
  state.field           = { hot: { p: [...(state.victoryCards || [])], e: [] }, cold: { p: [], e: [] } };
  state.victoryCards    = [];
  addLog(`▶ Round ${state.round} begins! Budget: ${state.budget}`);
  drawCards(1, state.pDeck, state.pHand);
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
  const awardCards   = state.field.hot.p.filter(c => c._award)
    .concat(state.field.cold.p.filter(c => c._award));

  LANES.forEach(l => {
    state.pDiscard.push(...state.field[l].p.filter(c => !c._victory));
    state.eDiscard.push(...state.field[l].e);
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
    if (pw > ew) {
      if (typeof onBattleWin === 'function') onBattleWin(state.currentNode);
      else showOverlay(pw, ew);
    } else {
      if (typeof onBattleLoss === 'function') onBattleLoss();
      else showOverlay(pw, ew);
    }
  } else {
    state.round++;
    state.phase = 'between';
  }
  render();
}

// ── Turn advancement ──
function advanceTurn() {
  state.turn++;
  state.budgetUsed = 0;
  state.budget     = getBudget(state.turn);
  state.playerTurn = true;
  state.nextCardDiscount = 0;
  if (state.turn > 10) { endRound(); return; }
  addLog(`▸ Turn ${state.turn} — Budget: ${state.budget}`);
  drawCards(1, state.pDeck, state.pHand);
  drawCards(1, state.eDeck, state.eHand);
  // Apply persistent effects (brett, lacto, contamination etc)
  applyTurnEffects('p');
  applyTurnEffects('e');
  // Auto-play any contamination drawn this turn
  checkContaminationInHand();
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

function toggleMulligan(idx) {
  const s = state.mulSel, pos = s.indexOf(idx);
  if (pos >= 0) s.splice(pos, 1);
  else if (s.length < 2) s.push(idx);
  render();
}

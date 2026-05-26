// game.js — game state, round/turn management, init

const LANES = ['hot', 'cold'];
const LANE_NAMES = { hot: 'Hot side', cold: 'Cold side' };

// ── Game State ──
let state = {};

function initGame() {
  document.getElementById('overlay').classList.add('hidden');
  selectedCard = null;

  const pDeck = shuffle(buildDefaultDeck());
  const eDeck = shuffle(buildDefaultDeck());

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
    roundWins:  [],
    mulSel:     [],
    logs:       [],
  };

  drawCards(5, state.pDeck, state.pHand);
  drawCards(5, state.eDeck, state.eHand);
  render();
}

// ── Budget ──
function getBudget(turn) { return Math.min(turn, 5); }

// ── Scoring ──
function laneScore(lane, who) {
  return state.field[lane][who].reduce((s, c) => s + c.points, 0);
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
  state.phase      = 'play';
  state.turn       = 1;
  state.budgetUsed = 0;
  state.budget     = getBudget(1);
  state.playerTurn = true;
  state.field      = { hot: { p: [], e: [] }, cold: { p: [], e: [] } };
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

  clearField(state.field, state.pDiscard, state.eDiscard);

  const pw = state.roundWins.filter(x => x === 'player').length;
  const ew = state.roundWins.filter(x => x === 'enemy').length;

  if (pw >= 2 || ew >= 2 || state.round >= 3) {
    state.phase = 'end';
    showOverlay(pw, ew);
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
  if (state.turn > 10) { endRound(); return; }
  addLog(`▸ Turn ${state.turn} — Budget: ${state.budget}`);
  drawCards(1, state.pDeck, state.pHand);
  drawCards(1, state.eDeck, state.eHand);
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

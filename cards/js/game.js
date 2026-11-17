// game.js — game state, round/turn management, init

const LANES = ['hot', 'cold'];
const LANE_NAMES = { hot: 'Hot side', cold: 'Cold side' };

// ── Game State ──
let state = {};

// Transient flags that should never carry from one battle into the next
const BATTLE_FLAGS = ['_basePoints','_thiolReleased','_victory','_award','_locked','_noMultiplier','_mixedFerm','_deckIdx','_heatKilled'];

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

  const pDeck = shuffle(opts.playerDeck ? opts.playerDeck.map(freshCopy)
    : draftState.deck.length > 0
    ? draftState.deck.map((c, i) => Object.assign(freshCopy(c), { _deckIdx: i }))
    : buildDefaultDeck());
  const eDeck = opts.testDummy ? []
    : shuffle(opts.rivalDeck ? opts.rivalDeck.map(freshCopy) : buildEnemyDeck());

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
    victoryWins:      [],   // deck indexes of Victory Malts on board for a round you won
    awardWon:         false,
    maxRounds:        node ? (isBoss ? 3 : 1) : opts.testDummy ? 1 : 3,
    testDeck:         opts.testDummy ? opts.playerDeck : null,
    currentNode:      node,
    isBoss,
    rivalBonus:       opts.rivalBonus || 0,
    rivalBonusName:   opts.rivalBonusName || 'Crowd Favorite',
    rivalName:        opts.testDummy ? 'Test Dummy' : opts.rival ? opts.rival.name : 'Rival Brewery',
    rivalTrait:       opts.rival ? opts.rival.trait || null : null,
    rule:             node && node.rule ? node.rule : null,
    goal:             node && node.goal ? node.goal : null,
    goalStats:        { played: 0, adjuncts: 0 },
    goalMet:          false,
    maxTurns:         node && node.rule === 'speed' ? SPEED_TURNS : MAX_TURNS,
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
    cardsThisRound:   { p: 0, e: 0 },
    maltsThisRound:   { p: 0, e: 0 },
    carryDiscount:    0,
    lastMalt:         {},
    lastHop:          {},
    nextHopFree:      false,
    nextYeastDiscount:0,
    nextHopDiscount:  0,
    pendingHopBuff:   0,
    lastPlayedCard:   null,
    lastPlayedLane:   null,
  };

  if (opts.disaster) initDisasterState();
  // Taproom: Tap List scores the variety on your board
  state.taproomActive = !!(node && activeBreweryAt() === 'taproom');
  if (opts.rival) {
    addLog(`⚔ ${opts.rival.name} (${opts.rival.style})${opts.rival.traitName ? ` · ${opts.rival.traitName}: ${opts.rival.traitDesc}` : ''}`, 'enemy');
  }
  drawCards(hasRelic('recipebook') ? 6 : 5, state.pDeck, state.pHand);   // Recipe Book: 1 extra opening card
  // Pilot System: a random rare to try out, this battle only (it's not added to your deck)
  if (node && hasRelic('pilotsystem')) {
    const rares = CARD_POOL.filter(c => c.rarity === 'rare' && c.cat !== 'token');
    const pick = rares[Math.floor(Math.random() * rares.length)];
    if (pick) {
      state.pDeck.push({ ...pick, tags: [...(pick.tags || [])], _pilot: true });
      state.pDeck = shuffle(state.pDeck);
      addLog(`⚗️ Pilot System: a test batch of ${pick.name} is shuffled into your deck for this battle.`, 'player');
    }
  }
  drawCards(5, state.eDeck, state.eHand);
  // Brewmaster 9: a Contamination lurks in your deck every battle
  if (node && bm(9)) { state.pDeck.push(createToken('contamination')); state.pDeck = shuffle(state.pDeck); }
  // Brewmaster 10: bosses come in with a bigger hand
  if (isBoss && bm(10)) drawCards(BM_BOSS_CARDS, state.eDeck, state.eHand);
  render();
}

// ── Judging categories (3-round fights: bosses and practice games) ──
// Each round of a best-of-3 is scored like a real beer competition category.
const JUDGING = [
  { id:'aroma',   name:'Aroma',              icon:'👃', lane:'cold', desc:'Cold side scores double' },
  { id:'flavor',  name:'Flavor',             icon:'👅', lane:'hot',  desc:'Hot side scores double' },
  { id:'overall', name:'Overall Impression', icon:'🏆', lane:null,   desc:'Standard scoring' },
];

function judgingFor(round) {
  return state.maxRounds === 3 ? JUDGING[round - 1] || null : null;
}

function laneMultiplier(lane) {
  return state.judging && state.judging.lane === lane ? 2 : 1;
}

// ── Round length ──
const MAX_TURNS = 8;

// ── Budget ──
function getBudget(turn, who = 'p') {
  const cap = 5 + (who === 'p' && hasRelic('fermenter') ? 1 : 0);
  // Speed Brew: a shorter round, but everyone gets +1 budget every turn
  const speed = typeof ruleOn === 'function' && ruleOn('speed') ? SPEED_BUDGET : 0;
  return Math.min(turn + speed, cap + speed);
}

// ── Scoring ──
function laneScore(lane, who) {
  let score = state.field[lane][who].reduce((s, c) => s + effectivePoints(c, lane, who), 0);
  if (lane === 'hot' && isBurnt(who)) score = Math.floor(score * (who === 'p' && hasRelic('steamjacket') ? 0.75 : 0.5));
  if (state.disaster) score = Math.floor(score * disasterLaneMult(lane, who));
  return score * laneMultiplier(lane);
}
// ── Complete Beer bonus ──
// You can't make beer without malt, hops and yeast. Having all three on your board
// earns a flat bonus; adding an adjunct makes it a Specialty Beer for a bit more.
// It counts live, so the scoreboard always includes it.
const COMPLETE_BEER_BONUS  = 30;
const SPECIALTY_BEER_BONUS = 10;
const BEER_PARTS = ['malt', 'hop', 'yeast'];

function beerStatus(who) {
  const cats    = new Set(LANES.flatMap(l => state.field[l][who].map(c => c.cat)));
  // Landrace Barley (legendary) counts as an adjunct too
  if (LANES.some(l => state.field[l][who].some(c => c.id === 'landrace'))) cats.add('adjunct');
  const missing = BEER_PARTS.filter(c => !cats.has(c));
  const complete  = missing.length === 0;
  const specialty = complete && cats.has('adjunct');
  const bonus = complete ? COMPLETE_BEER_BONUS + (specialty ? SPECIALTY_BEER_BONUS : 0) : 0;
  return { complete, specialty, missing, bonus };
}

function totalScore(who) {
  return LANES.reduce((s, l) => s + laneScore(l, who), 0) + beerStatus(who).bonus + tapListPoints(who);
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
  state.ePassed         = false;
  state.nextCardDiscount  = 0;
  state.lastPlayedCard    = null;
  state.lastPlayedLane    = null;
  state.lastHop           = {};
  state.roastTokens       = 0;
  state.roastSafe         = 0;
  state.roastThreshold    = 5 + (hasRelic('roaster') ? 2 : 0) + (activeBreweryAt() === 'stouthouse' ? STOUT_HOUSE_LIMIT : 0);
  state.garageUsedRound   = false;
  state.hopBackUsed       = false;
  state.abilityUsed       = false;
  state.abilityTargeting  = false;
  state.firstHopBonusUsed = false;
  state.wildUsedRound     = false;
  state.cardTargeting     = null;
  state.eRoastTokens      = 0;
  state.eRoastSafe        = 0;
  state.eRoastThreshold   = 5;
  state.cardsThisTurn     = { p: 0, e: 0 };
  state.cardsThisRound    = { p: 0, e: 0 };
  state.maltsThisRound    = { p: 0, e: 0 };
  state.carryDiscount     = 0;
  state.lastMalt          = {};
  state.nextHopFree       = false;
  state.nextYeastDiscount = 0;
  state.nextHopDiscount   = 0;
  state.pendingHopBuff    = 0;
  state.acid              = { p: 0, e: 0 };
  state.lager             = { p: hasRelic('britetank') ? BRITE_TANK_LAGER : 0, e: 0 };
  state.augerUsed         = false;
  state.field           = { hot: { p: [], e: [] }, cold: { p: [], e: [] } };
  state.judging = judgingFor(state.round);
  addLog(`▶ Round ${state.round} begins! Budget: ${state.budget}`);
  if (state.judging) addLog(`${state.judging.icon} Judging: ${state.judging.name} (${state.judging.desc}).`, 'sys');
  if (state.rivalBonus) {
    const fav = createToken('crowd_fav');
    fav.points = state.rivalBonus;
    fav.name   = state.rivalBonusName;
    state.field.hot.e.push(fav);
    addLog(`${state.rivalBonusName}: rival starts with +${state.rivalBonus}.`, 'enemy');
  }
  if (state.rivalTrait === 'roastmaster') state.eRoastThreshold = 7;
  applyRuleAtRoundStart();
  if (state.rule) addLog(`📜 Competition rule: ${COMP_RULES[state.rule].name}. ${COMP_RULES[state.rule].desc}`, 'sys');
  drawCards(hasRelic('grainmill') ? 2 : 1, state.pDeck, state.pHand);
  drawCards(1, state.eDeck, state.eHand);
  planRivalTurn();
}

function endRound() {
  // Show the judges' tally first (board still on the table), then carry on
  if (!state._tallied && juiceOn() && document.getElementById('tally-overlay')) {
    state._tallied = true;
    state.phase = 'tally';
    render();
    showRoundTally(() => endRound());
    return;
  }
  state._tallied = false;
  const ps = totalScore('p'), es = totalScore('e');
  state.lastRoundScore = { p: ps, e: es };
  checkGoalAtRoundEnd(ps, es);
  ['p', 'e'].forEach(w => {
    const b = beerStatus(w);
    if (b.complete) addLog(`🍺 ${w === 'p' ? 'Your' : "Rival's"} ${b.specialty ? 'Specialty' : 'Complete'} Beer: +${b.bonus}`, w === 'p' ? 'player' : 'enemy');
  });
  addLog(`■ Round ${state.round}${state.judging ? ` (${state.judging.name})` : ''} ends. You: ${ps}, Rival: ${es}`);
  if (ps > es)      { state.roundWins.push('player'); addLog(`★ You win round ${state.round}!`, 'player'); }
  else if (es > ps) { state.roundWins.push('enemy');  addLog(`✗ Rival wins round ${state.round}.`, 'enemy'); }
  else              { state.roundWins.push('draw');   addLog('Draw!'); }

  // Victory Malt / Award Entry — remember them if you won this round with them on your board
  if (ps > es) {
    LANES.forEach(l => state.field[l].p.forEach(c => {
      if (c.id === 'victory' && c._deckIdx !== undefined && !state.victoryWins.includes(c._deckIdx)) state.victoryWins.push(c._deckIdx);
      if (c.id === 'award') state.awardWon = true;
    }));
  }

  LANES.forEach(l => {
    // Tokens (Haze, Stuck Mash, Contamination...) leave the game at round end
    // copies made during the battle (Second Runnings) leave with the tokens
    state.pDiscard.push(...state.field[l].p.filter(c => c.cat !== 'token' && !c._copy));
    state.eDiscard.push(...state.field[l].e.filter(c => c.cat !== 'token'));
    state.field[l].p = [];
    state.field[l].e = [];
  });

  const pw = state.roundWins.filter(x => x === 'player').length;
  const ew = state.roundWins.filter(x => x === 'enemy').length;

  if (pw >= 2 || ew >= 2 || state.round >= state.maxRounds) {
    state.phase = 'end';
    // Map battles report back to the map; practice games show the overlay
    if (state.disaster)                    onDisasterEnd(state.currentNode);
    else if (state.currentNode && pw > ew) onBattleWin(state.currentNode);
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
  state.turn++;
  state.budgetUsed = 0;
  state.budget     = getBudget(state.turn);
  state.nextCardDiscount = 0;
  state.cardsThisTurn    = { p: 0, e: 0 };
  state.abilityUsed      = false;
  state.abilityTargeting = false;
  state.firstHopBonusUsed = false;
  state.augerUsed        = false;
  if (state.turn > maxTurns()) { endRound(); return; }
  if (state.disaster) disasterTurn();
  addLog(`▸ Turn ${state.turn} · Budget: ${state.budget}`);

  drawCards(1, state.pDeck, state.pHand);
  if (!state.ePassed) drawCards(state.rivalTrait === 'massprod' && state.turn % 3 === 0 ? 2 : 1, state.eDeck, state.eHand);
  if (state.rivalTrait === 'spontaneous' && state.turn % 3 === 0) {
    addLog('Spontaneous Fermentation: wild microbes drift into your deck...', 'enemy');
    shuffleIntoRemainingDeck('p', 'contamination');
  }

  // Acid eats into the beer
  tickAcid('p');
  tickAcid('e');

  // Persistent effects keep working whether or not you've passed (yeast keeps fermenting)
  applyTurnEffects('p');
  applyTurnEffects('e');
  checkContaminationInHand('p');
  checkContaminationInHand('e');

  state.playerTurn = true;
  planRivalTurn();          // rival commits to next turn; you see it as an intent
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

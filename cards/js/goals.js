// goals.js — Judge's Challenge: an optional side goal on some map battles.
// You still have to win the battle. Acts 1 and 2 pay gold; act 3 challenges are hard
// and pay a legendary card, which is unlocked in your collection for good.

const GOAL_CHANCE = [0.25, 0.25, 0.3];   // chance a battle carries a challenge, per act
const GOAL_GOLD   = [25, 40];

const boardNegative = who => LANES.some(l => state.field[l][who].some(c => c.cat === 'token' && c.points < 0));
const boardCount    = (who, f) => LANES.reduce((n, l) => n + state.field[l][who].filter(f).length, 0);

const JUDGE_GOALS = {
  // Acts 1 and 2: gold
  hopfwd:   { acts: [0, 1], name: 'Hop Forward',  desc: 'Win with 4 or more hops on your board.',  check: () => boardCount('p', c => c.cat === 'hop') >= 4 },
  blowout:  { acts: [0, 1], name: 'Blowout',      desc: 'Win by 50 or more.',                      check: s => s.margin >= 50 },
  bigpour:  { acts: [0, 1], name: 'Big Pour',     desc: 'Score 280 or more.',                      check: s => s.score >= 280 },
  purist:   { acts: [0, 1], name: 'Purist',       desc: 'Win without playing any adjuncts.',       check: s => s.adjuncts === 0 },
  lean:     { acts: [0, 1], name: 'Lean Brew',    desc: 'Win playing 10 cards or fewer.',          check: s => s.played <= 10 },
  // Act 3: hard, pays a legendary card
  masterpiece: { acts: [2], name: 'Masterpiece',  desc: 'Win by 70 or more.',                      check: s => s.margin >= 70 },
  goldmedal:   { acts: [2], name: 'Gold Medal',   desc: 'Score 300 or more.',                      check: s => s.score >= 300 },
  minimalist:  { acts: [2], name: 'Minimalist',   desc: 'Win playing 9 cards or fewer.',           check: s => s.played <= 9 },
  bestinshow:  { acts: [2], name: 'Best in Show', desc: 'Win by 50 or more with a Specialty Beer and no negative tokens on your board.',
                 check: s => s.margin >= 50 && beerStatus('p').specialty && !boardNegative('p') },
};

function assignGoal(node) {
  if (node.type !== 'battle' && node.type !== 'festival') return null;
  const act = Math.min(2, node.act || 0);
  if (Math.random() >= GOAL_CHANCE[act]) return null;
  const ids = Object.keys(JUDGE_GOALS).filter(id => JUDGE_GOALS[id].acts.includes(act));
  return ids[Math.floor(Math.random() * ids.length)];
}

function currentGoal() { return state && state.goal ? JUDGE_GOALS[state.goal] : null; }

// Called from playToLane: cards you play from your hand
function trackGoalPlay(c) {
  if (!state.goal) return;
  state.goalStats = state.goalStats || { played: 0, adjuncts: 0 };
  state.goalStats.played++;
  if (c.cat === 'adjunct') state.goalStats.adjuncts++;
}

// Called from endRound while the board is still out
function checkGoalAtRoundEnd(ps, es) {
  const g = currentGoal();
  if (!g || ps <= es) { state.goalMet = false; return; }
  const s = { ...(state.goalStats || { played: 0, adjuncts: 0 }), score: ps, margin: ps - es };
  state.goalMet = !!g.check(s);
}

// Called from onBattleWin: pay out and return a line for the reward screen
function payGoal(node) {
  const g = currentGoal();
  if (!g) return '';
  if (!state.goalMet) return `🎯 Challenge missed: ${g.name}.`;
  const act = Math.min(2, node.act || 0);
  if (act < 2) {
    mapState.gold += GOAL_GOLD[act];
    return `🎯 Challenge complete: ${g.name}! +${GOAL_GOLD[act]} gold.`;
  }
  // Act 3: a legendary, preferring ones you haven't unlocked yet
  const all = CARD_POOL.filter(c => c.rarity === 'legendary');
  const fresh = all.filter(c => !isOwned(c.id));
  const pick = (fresh.length ? fresh : all)[Math.floor(Math.random() * (fresh.length || all.length))];
  if (!pick) return '';
  const isNew = unlockCard(pick.id);
  if (draftState.deck.length < MAX_DECK_SIZE) draftState.deck.push({ ...getCardDef(pick.id) });
  return `🎯 Challenge complete: ${g.name}! Legendary card: ${pick.name}${isNew ? ' (unlocked for good!)' : ''}.`;
}

function goalPillText() {
  const g = currentGoal();
  if (!g) return '';
  const act = state.currentNode ? Math.min(2, state.currentNode.act || 0) : 0;
  const reward = act < 2 ? `+${GOAL_GOLD[act]} gold` : 'a legendary card';
  return `🎯 CHALLENGE: ${g.name}. ${g.desc} (${reward})`;
}

// rivalai.js — how rivals decide what to brew, and the intents you see.
//
// At the start of YOUR turn the rival plans its next turn and commits to it
// (like Slay the Spire intents). The plan is shown above its board, and the
// rival plays exactly that plan when you end your turn.
//
// Two kinds of rival:
//   • Simple (act 1 local brewers): play the biggest cards they can afford.
//   • Smart (craft breweries, festivals, all bosses): try every card on every
//     side in a copy of the game, and pick whatever improves the score gap most.
//     That naturally covers synergies, Complete Beer, judging rounds, roast,
//     and attacks on your board.

let rivalUid = 0;
function tagRivalCards() {
  [state.eHand, state.eDeck, state.eDiscard].forEach(pile =>
    pile.forEach(c => { if (c._uid === undefined) c._uid = ++rivalUid; }));
}

function rivalIsSmart() {
  const n = state.currentNode;
  if (!n) return true;                                  // practice games
  return n.type === 'boss' || n.type === 'festival' || n.act > 0;
}

// Run fn with `state` temporarily swapped for a sandbox copy
function withState(sandbox, fn) {
  const real = state;
  state = sandbox;
  try { return fn(); } finally { state = real; }
}

function cloneState(s) {
  return typeof structuredClone === 'function' ? structuredClone(s) : deepClone(s);
}

// Fallback for older browsers: copies arrays, objects and Sets, keeping shared
// references shared (the same card object in two places stays one object)
function deepClone(v, seen = new Map()) {
  if (v === null || typeof v !== 'object') return v;
  if (seen.has(v)) return seen.get(v);
  if (v instanceof Set) { const out = new Set(); seen.set(v, out); v.forEach(x => out.add(deepClone(x, seen))); return out; }
  const out = Array.isArray(v) ? [] : {};
  seen.set(v, out);
  for (const k of Object.keys(v)) out[k] = deepClone(v[k], seen);
  return out;
}

const RIVAL_ATTACKS = new Set(['peatmalt', 'chili', 'inspector', 'badbatch', 'crosscontam', 'hopthief', 'columbus', 'drunkcellar', 'drunkbrewer']);

function lanesFor(c) {
  if (c.lane !== 'both') return [c.lane];
  return ['hot', 'cold'];
}

function scoreGap() { return totalScore('e') - totalScore('p'); }

// How much better off is the rival after playing this card here?
function evaluatePlay(sim, uid, lane) {
  const s = cloneState(sim);
  return withState(s, () => {
    const i = state.eHand.findIndex(c => c._uid === uid);
    if (i < 0) return null;
    const card = state.eHand[i];
    const gapBefore  = scoreGap();
    const ownBefore  = totalScore('e');
    const handBefore = state.eHand.length;
    state.eHand.splice(i, 1);
    resolvePlay(card, lane, 'e');
    let value = scoreGap() - gapBefore;
    // Things a one-step look can't see:
    const turnsLeft = MAX_TURNS - state.turn;
    if (card.cat === 'yeast' && card.id !== 'kveik') value += 2 * turnsLeft;      // it grows every turn
    value += 6 * Math.max(0, state.eHand.length - (handBefore - 1));              // cards drawn
    return { value, gain: totalScore('e') - ownBefore, sim: state };
  });
}

// Smart plan: repeatedly pick the single best play until nothing helps or budget runs out
function planSmart(budget) {
  let sim = cloneState(state);
  const plan = [];
  let remaining = budget;
  for (let step = 0; step < 8; step++) {
    let best = null;
    for (const c of sim.eHand) {
      if ((c.cat === 'token' && c.points < 0) || c.cost > remaining) continue;   // helpful tokens (like Haze) are worth playing
      for (const lane of lanesFor(c)) {
        const r = evaluatePlay(sim, c._uid, lane);
        if (r && (!best || r.value > best.value || (r.value === best.value && c.cost < best.card.cost))) {
          best = { ...r, card: c, lane };
        }
      }
    }
    if (!best || best.value <= 0) break;
    plan.push(planEntry(best.card, best.lane, best.gain));
    remaining -= best.card.cost;
    sim = best.sim;
  }
  return plan;
}

// Simple plan: the old habits. Biggest affordable cards first, sensible lanes, no self-overload
function planSimple(budget) {
  const plan = [];
  const hand = [...state.eHand];
  let remaining = budget;
  while (remaining > 0) {
    const pick = hand
      .filter(c => c.cost <= remaining && c.points >= 0 && !RIVAL_ATTACKS.has(c.id) && !rivalWouldOverload(c))
      .sort((a, b) => b.points - a.points)[0];
    if (!pick) break;
    hand.splice(hand.indexOf(pick), 1);
    remaining -= pick.cost;
    plan.push(planEntry(pick, rivalLaneFor(pick), pick.points));
  }
  return plan;
}

function planEntry(c, lane, gain) {
  return { uid: c._uid, id: c.id, name: c.name, cat: c.cat, cost: c.cost, lane, gain: Math.round(gain), attack: RIVAL_ATTACKS.has(c.id) };
}

// Called at the start of each of your turns
function planRivalTurn() {
  if (!state || state.phase !== 'play' || state.ePassed) { if (state) state.rivalPlan = null; return; }
  tagRivalCards();
  const budget = getBudget(state.turn, 'e');
  state.rivalPlan = rivalIsSmart() ? planSmart(budget) : planSimple(budget);
}

// Called when you end your turn: play exactly what was announced
function executeRivalPlan() {
  const plan = state.rivalPlan || [];
  let remaining = getBudget(state.turn, 'e');
  let played = 0;
  for (const step of plan) {
    // Cards created during the turn (like a Haze token from Mango) are matched by name
    const i = step.uid !== undefined
      ? state.eHand.findIndex(c => c._uid === step.uid)
      : state.eHand.findIndex(c => c.id === step.id);
    if (i < 0) continue;
    const c = state.eHand[i];
    if (c.cost > remaining) continue;
    state.eHand.splice(i, 1);
    remaining -= c.cost;
    enemyPlayCard(c, step.lane);
    played++;
  }
  state.rivalPlan = null;
  return played;
}

// ── Intent display ──
const INTENT_ICONS = { malt: '🌾', hop: '🌿', yeast: '🧫', adjunct: '✦', process: '⚙️' };

function rivalIntentHtml() {
  const plan = state.rivalPlan;
  if (!plan) return '';
  if (!plan.length) return `<span class="intent-label">RIVAL NEXT:</span> <span class="intent-quiet">nothing — holding back</span>`;
  const total   = plan.reduce((s, p) => s + Math.max(0, p.gain), 0);
  const attacks = plan.filter(p => p.attack);
  const icons   = plan.filter(p => !p.attack).map(p =>
    `<span class="intent-icon" title="${p.cat} → ${p.lane} side">${INTENT_ICONS[p.cat] || '?'}<small>${p.lane === 'hot' ? 'H' : 'C'}</small></span>`).join('');
  return `<span class="intent-label">RIVAL NEXT:</span> ${icons}
    ${total > 0 ? `<span class="intent-gain">≈ +${total}</span>` : ''}
    ${attacks.map(a => `<span class="intent-attack" title="The rival will play this against you">⚔️ ${a.name}</span>`).join('')}`;
}

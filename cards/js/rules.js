// rules.js — Competition Rules
// Some map battles are held under a special rule. You can see it on the map before you
// choose your path, and it applies to both you and the rival.

const COMP_RULES = {
  freshhop:    { name: 'Fresh Hop Festival', short: 'Fresh Hop',  icon: '🌿', desc: 'Hops score +50%.' },
  hopshortage: { name: 'Hop Shortage',       short: 'Shortage',   icon: '📉', desc: 'Hops cost 1 more.' },
  session:     { name: 'Session Beer Cup',   short: 'Session',    icon: '🍺', desc: 'Max 4 cards per side. Play to a full side to replace one of its cards.' },
  speed:       { name: 'Speed Brew',         short: 'Speed',      icon: '⏱️', desc: 'The round is only 6 turns, but you get +1 budget every turn.' },
  darknight:   { name: 'Dark Night',         short: 'Dark Night', icon: '🌙', desc: 'Roast limit −2. Roasty cards +5.' },
  blind:       { name: 'Blind Tasting',      short: 'Blind',      icon: '🙈', desc: "The rival's board stays hidden until judging." },
};
const COMP_RULE_IDS  = Object.keys(COMP_RULES);
const RULE_CHANCE    = [0.2, 0.35, 0.45];   // chance a battle has a rule, per act
const SESSION_LIMIT  = 4;
const SPEED_TURNS    = 6;
const SPEED_BUDGET   = 1;
const DARK_NIGHT_ROAST = 2;
const DARK_NIGHT_BONUS = 5;

function ruleOn(id) { return !!(state && state.rule === id); }
function currentRule() { return state && state.rule ? COMP_RULES[state.rule] : null; }

// Map generation: give some battles a rule
function assignRule(node) {
  if (node.type !== 'battle' && node.type !== 'festival') return null;
  return Math.random() < RULE_CHANCE[Math.min(2, node.act || 0)]
    ? COMP_RULE_IDS[Math.floor(Math.random() * COMP_RULE_IDS.length)] : null;
}

// ── Effects ──

function maxTurns() { return (state && state.maxTurns) || MAX_TURNS; }

function ruleCostMod(c) {
  return ruleOn('hopshortage') && c.cat === 'hop' ? 1 : 0;
}

// What a card costs the rival this battle
function rivalCost(c) { return c.cost + ruleCostMod(c); }

function rulePoints(c, pts) {
  if (c.cat === 'token') return pts;
  if (ruleOn('freshhop') && c.cat === 'hop') return Math.floor(pts * 1.5);
  if (ruleOn('darknight') && c.tags && c.tags.includes('roasty')) return pts + DARK_NIGHT_BONUS;
  return pts;
}

function applyRuleAtRoundStart() {
  if (ruleOn('darknight')) {
    state.roastThreshold  = Math.max(1, state.roastThreshold - DARK_NIGHT_ROAST);
    state.eRoastThreshold = Math.max(1, state.eRoastThreshold - DARK_NIGHT_ROAST);
  }
}

// ── Session Beer Cup: a full side makes you pick a card to replace ──

function sideCount(lane, who) { return state.field[lane][who].filter(c => c.cat !== 'token').length; }
function sideFull(lane, who) { return ruleOn('session') && sideCount(lane, who) >= SESSION_LIMIT; }

// Player: picked a card and clicked a full side. Ask which card it replaces.
function startSessionReplace(lane) {
  state.sessionReplace = { lane, handIdx: selectedCard };
  addLog(`Session Beer Cup: your ${LANE_NAMES[lane].toLowerCase()} is full. Click the card to replace.`, 'warn');
  render();
}

function isSessionTarget(c, lane) {
  return !!(state.sessionReplace && state.sessionReplace.lane === lane && c.cat !== 'token');
}

function sessionPick(lane, idx) {
  const sr = state.sessionReplace;
  if (!sr || sr.lane !== lane) return;
  const c = state.field[lane].p[idx];
  if (!c || c.cat === 'token') return;
  state.field[lane].p.splice(idx, 1);
  state.pDiscard.push(c);
  addLog(`Session Beer Cup: ${c.name} makes room.`, 'player');
  state.sessionReplace = null;
  selectedCard = sr.handIdx;
  playToLane(lane);
}

function cancelSessionReplace() {
  state.sessionReplace = null;
  selectedCard = null;
  render();
}

// Rival: when its side is full, the weakest card goes
function rivalMakeRoom(lane) {
  if (!sideFull(lane, 'e')) return;
  let worst = -1, worstPts = Infinity;
  state.field[lane].e.forEach((c, i) => {
    if (c.cat === 'token') return;
    const p = effectivePoints(c, lane, 'e');
    if (p < worstPts) { worst = i; worstPts = p; }
  });
  if (worst >= 0) {
    const [gone] = state.field[lane].e.splice(worst, 1);
    state.eDiscard.push(gone);
    addLog(`Session Beer Cup: rival swaps out ${ruleOn('blind') ? 'a card' : gone.name}.`, 'enemy');
  }
}

// ── Blind Tasting ──

function rivalHidden() { return ruleOn('blind') && state.phase === 'play'; }

// ── Display ──

function rulePillText() {
  const r = currentRule();
  return r ? `${r.icon} ${r.name.toUpperCase()}: ${r.desc}` : '';
}

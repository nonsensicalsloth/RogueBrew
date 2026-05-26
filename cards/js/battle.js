// battle.js — player card play, lane enforcement, enemy AI

let selectedCard = null;

// ── Player ──

function selectCard(idx) {
  if (!state.playerTurn || state.phase !== 'play') return;
  const c = state.pHand[idx];
  if (!c || c.cost > state.budget - state.budgetUsed) return;
  selectedCard = (selectedCard === idx) ? null : idx;
  render();
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
  if (c.cost > state.budget - state.budgetUsed) {
    addLog('Not enough budget!', 'warn');
    return;
  }

  state.pHand.splice(selectedCard, 1);
  state.field[lane].p.push(c);
  state.budgetUsed += c.cost;
  addLog(`You play ${c.name} (+${c.points}) → ${LANE_NAMES[lane]}`, 'player');
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
// Simple: plays highest cost card it can afford.
// Stops early if already 50+ pts ahead.

function enemyTurn() {
  const lead = totalScore('e') - totalScore('p');
  if (lead >= 50) {
    addLog(`Rival is ${lead} ahead — ends turn.`, 'enemy');
    setTimeout(() => advanceTurn(), 300);
    return;
  }

  let remaining = state.budget;
  const hand = [...state.eHand].sort((a, b) => b.cost - a.cost);
  let played = false;

  for (const c of hand) {
    if (c.cost <= remaining) {
      const lane = c.lane === 'both' ? 'hot' : c.lane;
      state.eHand.splice(state.eHand.indexOf(c), 1);
      state.field[lane].e.push(c);
      remaining -= c.cost;
      addLog(`Rival plays ${c.name} → ${LANE_NAMES[lane]}`, 'enemy');
      played = true;
      break;
    }
  }

  if (!played) addLog('Rival has nothing to play.', 'enemy');
  setTimeout(() => advanceTurn(), 300);
}

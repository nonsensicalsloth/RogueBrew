// ui.js — all render functions and DOM updates







function renderField() {
  LANES.forEach(l => {
    const pe = document.getElementById('plane-' + l);
    const ee = document.getElementById('elane-' + l);
    const selC = selectedCard !== null ? state.pHand[selectedCard] : null;
    const canTarget = selC && state.playerTurn && state.phase === 'play'
      && (selC.lane === 'both' || selC.lane === l);

    pe.innerHTML = state.field[l].p.length
      ? state.field[l].p.map(c => `
          <div class="field-card p">
            <div class="field-card-name">${c.name}</div>
            <div class="field-card-pts">+${c.points}</div>
          </div>`).join('')
      : '<span class="empty-msg">— empty —</span>';

    ee.innerHTML = state.field[l].e.length
      ? state.field[l].e.map(c => `
          <div class="field-card e">
            <div class="field-card-name">${c.name}</div>
            <div class="field-card-pts">+${c.points}</div>
          </div>`).join('')
      : '<span class="empty-msg">— empty —</span>';

    const playerLane = document.getElementById('plane-' + l).closest('.lane');
    if (playerLane) {
      if (canTarget) {
        playerLane.style.outline = '2px solid var(--gold)';
        playerLane.style.cursor  = 'pointer';
        playerLane.onclick = () => playToLane(l);
      } else {
        playerLane.style.outline = '';
        playerLane.style.cursor  = '';
        playerLane.onclick = null;
      }
    }

    document.getElementById(l === 'hot' ? 'hs-p' : 'cs-p').textContent = laneScore(l, 'p') + ' pts';
    document.getElementById(l === 'hot' ? 'hs-e' : 'cs-e').textContent = laneScore(l, 'e') + ' pts';
  });
}

function renderHand() {
  const el  = document.getElementById('hand');
  const rem = state.budget - state.budgetUsed;

  if (state.phase === 'mulligan') {
    el.innerHTML = state.pHand.map((c, i) => {
      const sel = state.mulSel.includes(i);
      return cardHtml(c, i, 'mulligan', sel ? 'mulligan-on' : '');
    }).join('');
  } else {
    const canAct = state.playerTurn && state.phase === 'play';
    el.innerHTML = state.pHand.map((c, i) => {
      const ok    = canAct && getEffectiveCost(c) <= rem;
      const isSel = selectedCard === i;
      let extra = '';
      if (!ok) extra = 'card-disabled';
      if (isSel) extra = 'selected-card';
      return cardHtml(c, i, ok ? 'play' : 'disabled', extra);
    }).join('');
  }

  document.getElementById('deck-count').textContent    = state.pDeck.length;
  document.getElementById('discard-count').textContent = state.pDiscard.length;
  document.getElementById('e-deck-count').textContent  = state.eDeck.length;
  document.getElementById('e-hand-count').textContent  = state.eHand.length;
}

function renderActions() {
  const el   = document.getElementById('actions');
  const hint = selectedCard !== null
    ? '<span style="font-size:7px;color:var(--gold);margin-left:8px">▲ CLICK YOUR LANE TO PLAY</span>'
    : '';

  if (state.phase === 'mulligan') {
    el.innerHTML = `<button class="btn btn-primary" onclick="confirmMulligan()">CONFIRM MULLIGAN (${state.mulSel.length})</button>`;
  } else if (state.phase === 'play' && state.playerTurn) {
    el.innerHTML = `<button class="btn btn-primary" onclick="endTurn()">END TURN</button>${hint}`;
  } else if (state.phase === 'play' && !state.playerTurn) {
    el.innerHTML = `<div class="status-tag">RIVAL BREWING...</div>`;
  } else if (state.phase === 'between') {
    el.innerHTML = `<button class="btn btn-gold" onclick="startNextRound()">▶ START ROUND ${state.round}</button>`;
  } else if (state.phase === 'end') {
    el.innerHTML = `<button class="btn btn-gold" onclick="initGame()">PLAY AGAIN</button>`;
  }
}

function renderRoundWins() {
  const ep = document.getElementById('enemy-pips');
  const pp = document.getElementById('player-pips');
  let eh = '', ph = '';
  for (let i = 0; i < 3; i++) {
    const w = state.roundWins[i] || '';
    eh += `<div class="win-pip ${w === 'enemy' ? 'enemy' : w === 'draw' ? 'draw' : ''}"></div>`;
    ph += `<div class="win-pip ${w === 'player' ? 'player' : w === 'draw' ? 'draw' : ''}"></div>`;
  }
  ep.innerHTML = eh;
  pp.innerHTML = ph;
}

function renderLog() {
  document.getElementById('log').innerHTML = state.logs
    .map(l => `<div class="log-line log-${l.type}">${l.msg}</div>`)
    .join('');
}

function showOverlay(pw, ew) {
  const won = pw > ew, draw = pw === ew;
  document.getElementById('ov-title').textContent = won ? 'YOU WIN!' : draw ? 'DRAW!' : 'RIVAL WINS.';
  document.getElementById('ov-title').style.color = won ? 'var(--gold)' : draw ? 'var(--dim)' : 'var(--enemy)';
  document.getElementById('ov-sub').textContent   = won ? 'The judges loved your beer!' : draw ? 'Too close to call.' : 'The rival took the trophy.';
  document.getElementById('ov-wins').textContent  = `You won ${pw} round${pw !== 1 ? 's' : ''}, rival won ${ew}.`;
  document.getElementById('overlay').classList.remove('hidden');
}

function render() {
  const ps = totalScore('p'), es = totalScore('e');

  document.getElementById('player-score').textContent = ps;
  document.getElementById('enemy-score').textContent  = es;

  const sb_p = document.getElementById('score-player');
  const sb_e = document.getElementById('score-enemy');
  const pt   = document.getElementById('player-lead-tag');
  const et   = document.getElementById('enemy-lead-tag');

  sb_p.classList.toggle('leading', ps > es && ps > 0);
  sb_e.classList.toggle('leading', es > ps && es > 0);

  const diff = Math.abs(ps - es);
  pt.textContent = (ps > es && diff > 0) ? `▲ +${diff}` : '';
  et.textContent = (es > ps && diff > 0) ? `▲ +${diff}` : '';

  document.getElementById('round-num').textContent   = state.round;
  const maxRoundsEl = document.getElementById('max-rounds');
  if (maxRoundsEl) maxRoundsEl.textContent = state.maxRounds || 3;
  document.getElementById('turn-num').textContent   = state.phase === 'play' ? state.turn : '—';
  document.getElementById('budget-rem').textContent = state.phase === 'play'
    ? `${state.budget - state.budgetUsed}/${state.budget}` : '—';

  document.getElementById('phase-label').textContent =
    state.phase === 'mulligan'  ? 'MULLIGAN' :
    state.phase === 'play'      ? (state.playerTurn ? 'YOUR TURN' : 'RIVAL TURN') :
    state.phase === 'between'   ? 'BETWEEN ROUNDS' : 'GAME OVER';

  // Roast tracker
  const roast     = state.roastTokens || 0;
  const threshold = state.roastThreshold || 5;
  const eRoast    = state.eRoastTokens || 0;
  const roastEl   = document.getElementById('roast-tracker');
  const roastCnt  = document.getElementById('roast-count');
  if (roastEl && roastCnt) {
    roastCnt.textContent = `${roast}/${threshold}${eRoast > 0 ? ` | rival:${eRoast}/5` : ''}`;
    roastEl.style.color  = roast >= threshold ? 'var(--red)' : roast >= threshold - 1 ? 'var(--orange)' : 'var(--dim)';
  }
  const discountMsg = (state.nextCardDiscount || 0) > 0 ? ` ★-${state.nextCardDiscount}` : '';
  document.getElementById('hand-lbl').textContent =
    state.phase === 'mulligan'
      ? 'YOUR HAND — SELECT UP TO 2 TO SEND BACK'
      : `YOUR HAND (${state.pHand.length}) — BUDGET: ${state.budget - state.budgetUsed}/${state.budget}${discountMsg}`;

  renderField();
  renderHand();
  renderActions();
  renderRoundWins();
  renderLog();
}

// ui.js — all render functions and DOM updates







// One card on the board: shows what it actually scores, plus any synergy multiplier
function fieldCardHtml(c, lane, who, idx) {
  const target = who === 'p' && isBoardTarget(c, lane);
  const mult = synergyMultiplier(c, lane, who);
  const pts  = c.points * mult;
  const sign = pts >= 0 ? '+' : '';
  return `<div class="field-card ${who}${pts < 0 ? ' field-card-neg' : ''}${target ? ' field-card-target' : ''}" ${target ? `onclick="event.stopPropagation();pickBoardTarget('${lane}', ${idx})"` : ''} title="${c.name}: ${c.points} pts${mult > 1 ? ` × ${mult} synergy = ${pts}` : ''}">
    <div class="field-card-name">${c.name}</div>
    <div class="field-card-pts">${sign}${pts}${mult > 1 ? `<span class="field-card-mult"> ×${mult}</span>` : ''}</div>
  </div>`;
}

function renderField() {
  LANES.forEach(l => {
    const pe = document.getElementById('plane-' + l);
    const ee = document.getElementById('elane-' + l);
    const selC = selectedCard !== null ? state.pHand[selectedCard] : null;
    const canTarget = selC && state.playerTurn && state.phase === 'play'
      && (selC.lane === 'both' || selC.lane === l);

    pe.innerHTML = state.field[l].p.length
      ? state.field[l].p.map((c, i) => `
${fieldCardHtml(c, l, 'p', i)}`).join('')
      : '<span class="empty-msg">— empty —</span>';

    ee.innerHTML = state.field[l].e.length
      ? state.field[l].e.map(c => `
${fieldCardHtml(c, l, 'e')}`).join('')
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
      return cardHtml(c, i, 'mulligan', sel ? 'mulligan-on' : '', null, formulaPreview(c));
    }).join('');
  } else {
    const canAct  = state.playerTurn && state.phase === 'play';
    const mustPour = canAct && playerMustPlayContamination();
    el.innerHTML = state.pHand.map((c, i) => {
      const cost  = getEffectiveCost(c);
      const ok    = canAct && cost <= rem && (!mustPour || isContamination(c));
      const isSel = selectedCard === i;
      const cls = [];
      if (!ok) cls.push('card-disabled');
      if (isSel) cls.push('selected-card');
      if (mustPour && isContamination(c)) cls.push('must-play');
      if (state.newCards && state.newCards.has(c)) cls.push('card-new');
      return cardHtml(c, i, ok ? 'play' : 'disabled', cls.join(' '), cost, formulaPreview(c));
    }).join('');
  }

  document.getElementById('deck-count').textContent    = state.pDeck.length;
  document.getElementById('discard-count').textContent = state.pDiscard.length;
  document.getElementById('e-deck-count').textContent  = state.eDeck.length;
  document.getElementById('e-hand-count').textContent  = state.eHand.length;
}

// The brewery's once-per-turn ability, next to End Turn
function abilityButtonHtml() {
  const b = breweryDef();
  if (!b) return '';
  if (state.abilityTargeting) {
    return ` <button class="btn btn-gold" onclick="useAbility()">${b.icon} CHOOSE A TARGET — CANCEL</button>`;
  }
  const st = abilityStatus();
  const label = `${b.icon} ${b.ability.name.toUpperCase()} (${b.ability.cost})`;
  return st.ok
    ? ` <button class="btn btn-gold" onclick="useAbility()" title="${b.ability.desc}">${label}</button>`
    : ` <button class="btn btn-primary" style="opacity:0.4;cursor:not-allowed;" title="${b.ability.desc}${st.reason ? ' — ' + st.reason : ''}">${label}</button>`;
}

function renderActions() {
  const el   = document.getElementById('actions');
  const hint = selectedCard !== null
    ? '<span style="font-size:7px;color:var(--gold);margin-left:8px">▲ CLICK YOUR LANE TO PLAY</span>'
    : '';

  if (state.phase === 'mulligan') {
    el.innerHTML = `<button class="btn btn-primary" onclick="confirmMulligan()">CONFIRM MULLIGAN (${state.mulSel.length})</button>`;
  } else if (state.phase === 'play' && state.playerTurn && cardTargetingActive()) {
    el.innerHTML = `<button class="btn btn-primary" style="opacity:0.4;cursor:not-allowed;">END TURN</button>
      <span style="font-size:7px;color:var(--gold);margin-left:8px">▲ ${CARD_TARGETS[state.cardTargeting.kind].prompt}</span>`;
  } else if (state.phase === 'play' && state.playerTurn && playerMustPlayContamination()) {
    el.innerHTML = `<button class="btn btn-primary" style="opacity:0.4;cursor:not-allowed;">END TURN</button>
      <span style="font-size:7px;color:var(--red);margin-left:8px">⚠ POUR THE CONTAMINATION ONTO YOUR COLD SIDE FIRST</span>`;
  } else if (state.phase === 'play' && state.playerTurn) {
    el.innerHTML = `<button class="btn btn-primary" onclick="endTurn()">END TURN</button>${abilityButtonHtml()}${hint}`;
  } else if (state.phase === 'play' && !state.playerTurn) {
    el.innerHTML = `<div class="status-tag">RIVAL BREWING...</div>`;
  } else if (state.phase === 'between') {
    const next = judgingFor(state.round);
    el.innerHTML = `<button class="btn btn-gold" onclick="startNextRound()">▶ START ROUND ${state.round}${next ? ` — ${next.icon} ${next.name.toUpperCase()}` : ''}</button>
      ${next ? `<span style="font-size:7px;color:var(--dim);margin-left:8px">${next.desc}</span>` : ''}`;
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
  const repPill = document.getElementById('rep-pill');
  if (repPill) {
    const show = state.currentNode && typeof mapState !== 'undefined' && mapState && mapState.maxRep;
    repPill.style.display = show ? '' : 'none';
    if (show) repPill.textContent = `⭐ ${mapState.rep}/${mapState.maxRep}${state.isBoss ? ' · MUST WIN' : ''}`;
  }
  const maxTurnsEl = document.getElementById('max-turns');
  if (maxTurnsEl) maxTurnsEl.textContent = MAX_TURNS;
  const maxRoundsEl = document.getElementById('max-rounds');
  if (maxRoundsEl) maxRoundsEl.textContent = state.maxRounds || 3;
  document.getElementById('turn-num').textContent   = state.phase === 'play' ? state.turn : '—';
  document.getElementById('budget-rem').textContent = state.phase === 'play'
    ? `${state.budget - state.budgetUsed}/${state.budget}` : '—';

  document.getElementById('phase-label').textContent =
    state.phase === 'mulligan'  ? 'MULLIGAN' :
    state.phase === 'play'      ? (state.playerTurn
                                    ? (state.ePassed ? 'YOUR TURN — RIVAL PASSED' : 'YOUR TURN')
                                    : 'RIVAL TURN') :
    state.phase === 'between'   ? 'BETWEEN ROUNDS' : 'GAME OVER';

  // Roast tracker
  const roast     = state.roastTokens || 0;
  const threshold = state.roastThreshold || 5;
  const eRoast    = state.eRoastTokens || 0;
  const roastEl   = document.getElementById('roast-tracker');
  const roastCnt  = document.getElementById('roast-count');
  if (roastEl && roastCnt) {
    roastCnt.textContent = `${roast}/${threshold}${eRoast > 0 ? ` | rival:${eRoast}/${state.eRoastThreshold || 5}` : ''}`;
    roastEl.style.color  = roast >= threshold ? 'var(--red)' : roast >= threshold - 1 ? 'var(--orange)' : 'var(--dim)';
  }
  const discountMsg = (state.nextCardDiscount || 0) > 0 ? ` ★-${state.nextCardDiscount}` : '';
  document.getElementById('hand-lbl').textContent =
    state.phase === 'mulligan'
      ? `YOUR HAND — SELECT UP TO ${mulliganLimit()} TO SEND BACK`
      : playerMustPlayContamination() && state.phase === 'play'
        ? '⚠ CONTAMINATION! CLICK IT, THEN YOUR COLD SIDE'
        : `YOUR HAND (${state.pHand.length}) — BUDGET: ${state.budget - state.budgetUsed}/${state.budget}${discountMsg}`;

  const rivalNameEl = document.getElementById('rival-name');
  if (rivalNameEl) rivalNameEl.textContent = (state.rivalName || 'Rival Brewery').toUpperCase();

  // Judging category for this round
  const judgingEl = document.getElementById('judging-pill');
  if (judgingEl) {
    const j = state.phase === 'between' ? judgingFor(state.round) : state.judging;
    judgingEl.style.display = j ? '' : 'none';
    judgingEl.textContent   = j ? `${j.icon} ${j.name.toUpperCase()}${j.lane ? ` — ${j.lane.toUpperCase()} ×2` : ''}` : '';
  }
  LANES.forEach(l => ['p','e'].forEach(w => {
    const m = document.getElementById(`mult-${l}-${w}`);
    if (m) m.textContent = state.phase === 'play' && state.judging && laneMultiplier(l) > 1 ? ' ×2' : '';
  }));

  // Complete Beer indicator
  const beerEl = document.getElementById('beer-pill');
  if (beerEl) {
    const show = state.phase === 'play' || state.phase === 'between';
    beerEl.style.display = show ? '' : 'none';
    if (show) {
      const b = beerStatus('p');
      const mine = b.specialty ? `SPECIALTY BEER +${b.bonus}`
                 : b.complete  ? `COMPLETE BEER +${b.bonus}`
                 : `NEED: ${b.missing.join(', ').toUpperCase()}`;
      beerEl.textContent = mine;
      beerEl.style.color = b.complete ? 'var(--gold)' : 'var(--dim)';
      beerEl.title = `+${COMPLETE_BEER_BONUS} points for a complete beer (malt, hop and yeast). +${SPECIALTY_BEER_BONUS} bonus with an adjunct.`;
    }
  }

  const relicBar = document.getElementById('relic-bar');
  const bDef = breweryDef();
  const bIcon = bDef ? `<span class="relic-icon" title="${bDef.name} — Passive: ${bDef.passive} | Ability: ${bDef.ability.name}: ${bDef.ability.desc}">${bDef.icon}</span>` : '';
  if (relicBar) relicBar.innerHTML = state.currentNode ? bIcon + relicIconsHtml() : '';

  // What the rival is about to do (committed plan)
  const intentEl = document.getElementById('rival-intent');
  if (intentEl) {
    const show = state.phase === 'play' && state.playerTurn && state.rivalPlan;
    intentEl.style.display = show ? '' : 'none';
    intentEl.innerHTML = show ? rivalIntentHtml() : '';
  }

  // What the rival just did, shown until you end your turn
  const sumEl = document.getElementById('rival-summary');
  if (sumEl) {
    const lines = (state.phase === 'play' && state.playerTurn && state.rivalSummary) || [];
    sumEl.style.display = lines.length ? '' : 'none';
    sumEl.innerHTML = lines.length
      ? `<div class="rival-summary-title">RIVAL'S LAST TURN</div>` +
        lines.map(l => `<div class="${l.type === 'warn' ? 'rival-summary-bad' : ''}">${l.msg}</div>`).join('')
      : '';
  }

  renderField();
  renderHand();
  renderActions();
  renderRoundWins();
  renderLog();
}

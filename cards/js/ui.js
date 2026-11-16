// ui.js — all render functions and DOM updates







// One card on the board: shows what it actually scores, plus any synergy multiplier
function fieldCardHtml(c, lane, who, idx) {
  // Blind Tasting: the rival's cards stay face down until judging
  if (who === 'e' && rivalHidden()) {
    return `<div class="field-card e field-card-hidden" title="Blind Tasting: hidden until judging"><div class="field-card-name">? ? ?</div><div class="field-card-pts">??</div></div>`;
  }
  const session = who === 'p' && isSessionTarget(c, lane);
  const target = who === 'p' && (session || isBoardTarget(c, lane));
  const mult = synergyMultiplier(c, lane, who);
  const pts  = effectivePoints(c, lane, who);
  const sign = pts >= 0 ? '+' : '';
  const fx   = juiceCardAttrs(c);
  const tags = (c.tags || []);
  const refs = cardRefs(c);
  return `<div class="field-card ${who}${pts < 0 ? ' field-card-neg' : ''}${target ? ' field-card-target' : ''}${fx.cls}"${fx.attrs}
    data-lane="${lane}" data-idx="${idx}" data-refs="${refs.join(' ')}" onmouseenter="tagHoverRefs(this.dataset.refs, this)" onmouseleave="tagHover(null)"
    ${target ? `onclick="event.stopPropagation();${session ? `sessionPick('${lane}', ${idx})` : `pickBoardTarget('${lane}', ${idx})`}"` : ''} title="${c.name}: ${c.points} pts${pts !== c.points ? ` + ${pts - c.points} synergy = ${pts}` : ''}${c.desc ? `\n${c.desc.replace(/"/g, '&quot;')}` : ''}">
    <div class="field-card-art">${cardArtMini(c)}</div>
    <div class="field-card-main">
      <div class="field-card-name">${c.name}</div>
      ${tags.length ? `<div class="field-card-tags">${tags.map(t => `<span class="ftag tag-${t}" data-tag="${t}" title="${t}">${t}</span>`).join('')}</div>` : ''}
    </div>
    <div class="field-card-pts">${sign}${pts}${mult > 1 ? `<span class="field-card-mult"> ×${mult}</span>` : ''}</div>
  </div>`;
}

const COMPACT_LANE_AT = 8;   // more cards than this in a lane and it switches to compact cards

// ── Tag highlighting ──
// Hover (or select) a card that mentions tags, and your board cards with those tags light up.
let _hoverRefs = null, _hoverEl = null;
function tagHover(handIdx) {
  _hoverRefs = handIdx === null || !state.pHand[handIdx] ? null : cardRefs(state.pHand[handIdx]);
  _hoverEl = null;
  applyTagHighlight();
}
function tagHoverRefs(refStr, el) {
  _hoverRefs = refStr ? refStr.split(' ') : [];
  _hoverEl = el || null;
  applyTagHighlight();
}
function applyTagHighlight() {
  const sel = typeof selectedCard !== 'undefined' && selectedCard !== null && state.pHand ? state.pHand[selectedCard] : null;
  const refs = _hoverRefs !== null ? _hoverRefs : sel ? cardRefs(sel) : [];
  const on = refs.length > 0;
  const tagRefs = refs.filter(r => r.startsWith('tag:')).map(r => r.slice(4).split('@')[0]);
  document.querySelectorAll('.field-card.p').forEach(el => {
    const c = state.field[el.dataset.lane] && state.field[el.dataset.lane].p[+el.dataset.idx];
    const hit = on && c && el !== _hoverEl && refs.some(r => refMatches(r, c, el.dataset.lane));
    el.classList.toggle('tag-match', !!hit);
    el.classList.toggle('tag-dim', on && !hit && el !== _hoverEl);
    el.querySelectorAll('.ftag').forEach(s => s.classList.toggle('tag-hit', !!hit && tagRefs.includes(s.dataset.tag)));
  });
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
      : '<span class="empty-msg">empty</span>';

    ee.innerHTML = state.field[l].e.length
      ? state.field[l].e.map(c => `
${fieldCardHtml(c, l, 'e')}`).join('')
      : '<span class="empty-msg">empty</span>';

    // Crowded lanes go compact: tags shrink to colored dots so each card is one line
    pe.classList.toggle('lane-compact', state.field[l].p.length > COMPACT_LANE_AT);
    ee.classList.toggle('lane-compact', state.field[l].e.length > COMPACT_LANE_AT);

    const playerLane = document.getElementById('plane-' + l).closest('.lane');
    if (playerLane) {
      // While a hand choice is pending, the board steps back and points you to your hand
      playerLane.classList.toggle('lane-dimmed', !!state.handTargeting);
      if (state.handTargeting) {
        playerLane.style.outline = '';
        playerLane.style.cursor  = '';
        playerLane.onclick = () => { addLog('Pick the card to discard from your hand, below.', 'warn'); render(); };
      } else if (canTarget) {
        playerLane.style.outline = '2px solid var(--gold)';
        playerLane.style.cursor  = 'pointer';
        playerLane.onclick = () => playToLane(l);
      } else {
        playerLane.style.outline = '';
        playerLane.style.cursor  = '';
        playerLane.onclick = null;
      }
    }

    juiceCount(document.getElementById(l === 'hot' ? 'hs-p' : 'cs-p'), laneScore(l, 'p'), v => v + ' pts');
    if (rivalHidden()) { const he = document.getElementById(l === 'hot' ? 'hs-e' : 'cs-e'); he._jv = undefined; he.textContent = '?? pts'; }
    else juiceCount(document.getElementById(l === 'hot' ? 'hs-e' : 'cs-e'), laneScore(l, 'e'), v => v + ' pts');
  });
  _hoverRefs = null;          // the board was redrawn, so any hover is stale; the selected card still counts
  applyTagHighlight();
}

// Keep the hand on one row: cards space out normally, then overlap a little once it gets crowded
function fitHand(el) {
  const cards = el.children, n = cards.length;
  if (!n) return;
  const cw = cards[0].offsetWidth || 90, room = el.clientWidth - 20;
  const gap = n > 1 && room > 0 ? Math.min(14, Math.floor((room - n * cw) / (n - 1))) : 14;
  // Overlapping: each card sits fully on top of the one before it (gems included); hover or select lifts it
  el.classList.toggle('hand-fanned', gap < 0);
  for (let i = 0; i < n; i++) {
    cards[i].style.marginLeft = i ? `${gap}px` : '0';
    cards[i].style.zIndex = gap < 0 ? i + 1 : '';
  }
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
      // Grain Out: click a card in your hand to discard it
      if (state.handTargeting && canAct) {
        if (isContamination(c)) return cardHtml(c, i, 'disabled', 'card-disabled', cost, formulaPreview(c));
        return cardHtml(c, i, 'view', 'hand-target', cost, formulaPreview(c)).replace('onclick="void(0)"', `onclick="handPickTarget(${i})"`);
      }
      return cardHtml(c, i, ok ? 'play' : 'disabled', cls.join(' '), cost, formulaPreview(c));
    }).join('');
  }

  fitHand(el);

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
    return ` <button class="btn btn-gold" onclick="useAbility()">${b.icon} CHOOSE A TARGET (CLICK TO CANCEL)</button>`;
  }
  const st = abilityStatus();
  const label = `${b.icon} ${b.ability.name.toUpperCase()} (${b.ability.cost})`;
  return st.ok
    ? ` <button class="btn btn-gold" onclick="useAbility()" title="${b.ability.desc}">${label}</button>`
    : ` <button class="btn btn-primary" style="opacity:0.4;cursor:not-allowed;" title="${b.ability.desc}${st.reason ? ' (' + st.reason + ')' : ''}">${label}</button>`;
}

function renderActions() {
  const el   = document.getElementById('actions');
  const hint = selectedCard !== null
    ? `<span style="font-size:7px;color:var(--gold);margin-left:8px">▲ CLICK YOUR LANE TO PLAY</span>`
    : '';

  if (state.phase === 'mulligan') {
    el.innerHTML = `<button class="btn btn-primary" onclick="confirmMulligan()">CONFIRM MULLIGAN (${state.mulSel.length})</button>`;
  } else if (state.phase === 'play' && state.playerTurn && pendingChoiceActive()) {
    el.innerHTML = `<button class="btn btn-primary" style="opacity:0.4;cursor:not-allowed;">END TURN</button>
      <span style="font-size:7px;color:var(--gold);margin-left:8px">▲ ${pendingChoicePrompt()}</span>`;
  } else if (state.phase === 'play' && state.playerTurn && playerMustPlayContamination()) {
    el.innerHTML = `<button class="btn btn-primary" style="opacity:0.4;cursor:not-allowed;">END TURN</button>
      <span style="font-size:7px;color:var(--red);margin-left:8px">⚠ POUR THE CONTAMINATION ONTO YOUR COLD SIDE FIRST</span>`;
  } else if (state.phase === 'play' && state.playerTurn) {
    el.innerHTML = `<button class="btn btn-primary" onclick="endTurn()">END TURN</button>${abilityButtonHtml()}${hint}`;
  } else if (state.phase === 'play' && !state.playerTurn) {
    el.innerHTML = `<div class="status-tag">RIVAL BREWING...</div>`;
  } else if (state.phase === 'between') {
    const next = judgingFor(state.round);
    el.innerHTML = `<button class="btn btn-gold" onclick="startNextRound()">▶ START ROUND ${state.round}${next ? ` · ${next.icon} ${next.name.toUpperCase()}` : ''}</button>
      ${next ? `<span style="font-size:7px;color:var(--dim);margin-left:8px">${next.desc}</span>` : ''}`;
  } else if (state.sessionReplace && state.phase === 'play') {
    el.innerHTML = `<button class="btn btn-primary" onclick="cancelSessionReplace()">CANCEL</button> <span class="status-tag" style="color:var(--gold)">${pendingChoicePrompt()}</span>`;
  } else if (state.phase === 'tally') {
    el.innerHTML = `<div class="status-tag">THE JUDGES ARE TASTING...</div>`;
  } else if (state.phase === 'end') {
    el.innerHTML = `<button class="btn btn-gold" onclick="replayBattle()">PLAY AGAIN</button>`;
  }
  // Test brews can be stopped at any time
  if (state.testDeck && state.phase !== 'end') {
    el.innerHTML += ` <button class="btn btn-danger" onclick="endTestBrew()">✕ STOP TEST</button>`;
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
  const btns = document.getElementById('ov-buttons');
  if (state.testDeck) {
    const s = state.lastRoundScore ? state.lastRoundScore.p : totalScore('p');
    document.getElementById('ov-title').textContent = 'TEST BREW DONE';
    document.getElementById('ov-title').style.color = 'var(--gold)';
    document.getElementById('ov-sub').textContent   = `Your beer scored ${s} points in ${maxTurns()} turns.`;
    document.getElementById('ov-wins').textContent  = 'The dummy never plays a card, so this is your deck on its own.';
    if (btns) btns.innerHTML = `<button class="btn btn-gold" onclick="startTestBrew()">TEST AGAIN</button>
      <button class="btn btn-primary" onclick="endTestBrew()">← BACK TO BUILDER</button>`;
    document.getElementById('overlay').classList.remove('hidden');
    return;
  }
  if (btns) btns.innerHTML = `<button class="btn btn-gold" onclick="replayBattle()">PLAY AGAIN</button>
      <button class="btn btn-primary" onclick="showTitleScreen()">MAIN MENU</button>`;
  const won = pw > ew, draw = pw === ew;
  document.getElementById('ov-title').textContent = won ? 'YOU WIN!' : draw ? 'DRAW!' : 'RIVAL WINS.';
  document.getElementById('ov-title').style.color = won ? 'var(--gold)' : draw ? 'var(--dim)' : 'var(--enemy)';
  document.getElementById('ov-sub').textContent   = won ? 'The judges loved your beer!' : draw ? 'Too close to call.' : 'The rival took the trophy.';
  document.getElementById('ov-wins').textContent  = `You won ${pw} round${pw !== 1 ? 's' : ''}, rival won ${ew}.`;
  document.getElementById('overlay').classList.remove('hidden');
}

function render() {
  const ps = totalScore('p'), es = totalScore('e');

  juiceCount(document.getElementById('player-score'), ps);
  if (rivalHidden()) { const ee = document.getElementById('enemy-score'); ee._jv = undefined; ee.textContent = '??'; }
  else juiceCount(document.getElementById('enemy-score'),  es);

  const sb_p = document.getElementById('score-player');
  const sb_e = document.getElementById('score-enemy');
  const pt   = document.getElementById('player-lead-tag');
  const et   = document.getElementById('enemy-lead-tag');

  sb_p.classList.toggle('leading', !rivalHidden() && ps > es && ps > 0);
  sb_e.classList.toggle('leading', !rivalHidden() && es > ps && es > 0);

  const diff = Math.abs(ps - es);
  // Blind Tasting: don't give away who's ahead
  pt.textContent = !rivalHidden() && (ps > es && diff > 0) ? `▲ +${diff}` : '';
  et.textContent = !rivalHidden() && (es > ps && diff > 0) ? `▲ +${diff}` : '';

  document.getElementById('round-num').textContent   = state.round;
  const repPill = document.getElementById('rep-pill');
  if (repPill) {
    const show = state.currentNode && typeof mapState !== 'undefined' && mapState && mapState.maxRep;
    repPill.style.display = show ? '' : 'none';
    if (show) { repPill.textContent = `⭐ ${mapState.rep}/${mapState.maxRep}${state.isBoss ? ' · MUST WIN' : ''}`; repPill.title = 'Reputation. Lose a battle and it drops; hit 0 and the run is over.'; }
  }
  const maxTurnsEl = document.getElementById('max-turns');
  if (maxTurnsEl) maxTurnsEl.textContent = maxTurns();
  const maxRoundsEl = document.getElementById('max-rounds');
  if (maxRoundsEl) maxRoundsEl.textContent = state.maxRounds || 3;
  document.getElementById('turn-num').textContent   = state.phase === 'play' ? state.turn : '-';
  document.getElementById('budget-rem').textContent = state.phase === 'play'
    ? `${state.budget - state.budgetUsed}/${state.budget}` : '-';

  document.getElementById('phase-label').textContent =
    state.phase === 'mulligan'  ? 'MULLIGAN' :
    state.phase === 'play'      ? (state.playerTurn
                                    ? (state.ePassed ? 'YOUR TURN · RIVAL PASSED' : 'YOUR TURN')
                                    : 'RIVAL TURN') :
    state.phase === 'between'   ? 'BETWEEN ROUNDS' :
    state.phase === 'tally'     ? 'JUDGING...'     : 'GAME OVER';

  // Status chips: each one sits on the lane (or hand) it affects, and only shows when it matters
  const inPlay = state.phase === 'play' || state.phase === 'between';
  const chipsFor = { 'hot-p': [], 'cold-p': [], 'hot-e': [], 'cold-e': [], hand: [] };
  const chip = (where, cls, text, title) => chipsFor[where].push(`<span class="lchip ${cls}" title="${title}">${text}</span>`);
  if (inPlay) {
    // Roast: on the hot side, where roasty malts live
    [['p', state.roastTokens || 0, state.roastThreshold || 5], ['e', state.eRoastTokens || 0, state.eRoastThreshold || 5]].forEach(([w, roast, threshold]) => {
      if (!roast) return;
      const burnt = isBurnt(w);
      const near = w === 'p' && roast - (state.roastSafe || 0) >= threshold - 1;
      chip(`hot-${w}`, burnt ? 'lc-bad lc-pulse' : near ? 'lc-warn' : 'lc-roast',
        burnt ? `🔥 BURNT ${roast}/${threshold}: half points` : `🔥 roast ${roast}/${threshold} · roasty +${ROAST_POWER * roast}`,
        `Each roast token gives every roasty card +${ROAST_POWER}. Reach ${threshold} and the beer is Burnt: hot side scores half.`);
    });
    // Stuck mash: sticky grains in a row at the end of your hot side
    const run = trailingSticky('p'), stuck = isMashStuck('p');
    if (run > 0 || stuck) chip('hot-p', stuck ? 'lc-bad lc-pulse' : run >= CLUMP_SIZE - 1 ? 'lc-warn' : 'lc-mash',
      stuck ? '🥣 MASH STUCK −8' : `🥣 sticky ${run}/${CLUMP_SIZE}`,
      `Sticky grains clump: ${CLUMP_SIZE} in a row on your hot side = Stuck Mash (−8). Play something else in between, like a base malt or Rice Hulls.`);
  }
  if (state.phase === 'play') {
    // Acid: shown on the lane it will eat next turn (that side's best lane)
    ['p', 'e'].forEach(w => {
      const a = acidOn(w);
      if (!a) return;
      const lane = laneScore('hot', w) >= laneScore('cold', w) ? 'hot' : 'cold';
      chip(`${lane}-${w}`, w === 'p' ? 'lc-bad' : 'lc-acid', `🍋 acid ${a} · −${a} next turn`,
        'At the start of each turn, Acid eats that many points from the brewery\'s best lane (an Acid Burn), then drops by 1. The lost points stay gone unless CIP Cycle, Fining Agent or Sanitize (cold side) clears the burn.');
    });
    // Lagering: waits in your hand for the next crisp card
    const lag = lagering('p');
    if (lag) chip('hand', 'lc-lager', (state.pHand.some(isCrisp) ? `🧊 lagering ${lag} · next crisp card +${lag * lagerPower('p')}` : `🧊 lagering ${lag} · waiting for a crisp card (+${lag * lagerPower('p')})`),
      `Unspent budget becomes Lagering (max ${LAGER_MAX}) if you end your turn with a crisp card in hand. The next crisp card you play gets +${lagerPower('p')} per Lagering, then it empties.`);
  }
  Object.entries(chipsFor).forEach(([k, list]) => {
    const el = document.getElementById(k === 'hand' ? 'hand-chips' : `chips-${k}`);
    if (el) el.innerHTML = list.join('');
  });

  // Taproom: Tap List
  const tapEl = document.getElementById('taplist-pill');
  if (tapEl) {
    const on = state.taproomActive && state.phase === 'play';
    tapEl.style.display = on ? '' : 'none';
    if (on) {
      const n = boardTagCount('p'), pts = tapListPoints('p');
      tapEl.textContent = pts ? `🍻 TAP LIST: ${n} tags, +${pts}` : `🍻 TAP LIST: ${n}/${TAP_LIST_FLOOR + 1} tags`;
      tapEl.classList.toggle('on', pts > 0);
      tapEl.title = `At judging, +${TAP_LIST_POINTS} for every different tag on your board beyond ${TAP_LIST_FLOOR}.`;
    }
  }

  const discountMsg = (state.nextCardDiscount || 0) > 0 ? ` ★-${state.nextCardDiscount}` : '';
  const handCol = document.getElementById('hand-lbl').closest('.hand-col');
  if (handCol) handCol.classList.toggle('hand-picking', !!state.handTargeting && state.phase === 'play');
  document.getElementById('hand-lbl').textContent =
    state.phase === 'mulligan'
      ? `YOUR HAND: SELECT UP TO ${mulliganLimit()} TO SEND BACK`
      : state.handTargeting && state.phase === 'play'
        ? 'GRAIN OUT: CLICK A CARD IN YOUR HAND TO DISCARD IT'
      : playerMustPlayContamination() && state.phase === 'play'
        ? '⚠ CONTAMINATION! CLICK IT, THEN YOUR COLD SIDE'
        : `YOUR HAND (${state.pHand.length})${discountMsg}`;

  const rivalNameEl = document.getElementById('rival-name');
  if (rivalNameEl) rivalNameEl.textContent = (state.rivalName || 'Rival Brewery').toUpperCase();

  // Judging category for this round
  const ruleEl = document.getElementById('rule-pill');
  const r = currentRule(), gl = currentGoal(), live = state.phase !== 'end';
  if (ruleEl) {
    ruleEl.style.display = r && live ? '' : 'none';
    ruleEl.innerHTML = r ? `${r.icon} ${r.name.toUpperCase()} <i>${r.desc}</i>` : '';
    ruleEl.title = rulePillText();
  }
  const goalEl = document.getElementById('goal-pill');
  if (goalEl) {
    const t = goalPillText();
    goalEl.style.display = t && live ? '' : 'none';
    if (gl) {
      const act = state.currentNode ? Math.min(2, state.currentNode.act || 0) : 0;
      const reward = act < 2 ? `+${GOAL_GOLD[act]} gold` : 'legendary card';
      goalEl.innerHTML = `🎯 CHALLENGE: ${gl.name} <i>${gl.desc}</i> <b>${reward}</b>`;
    } else goalEl.textContent = '';
    goalEl.title = t;
  }
  const judgingEl = document.getElementById('judging-pill');
  const j = state.phase === 'between' ? judgingFor(state.round) : state.judging;
  if (judgingEl) {
    judgingEl.style.display = j ? '' : 'none';
    judgingEl.textContent   = j ? `${j.icon} ${j.name.toUpperCase()}${j.lane ? ` · ${j.lane.toUpperCase()} ×2` : ''}` : '';
  }
  const jl = document.getElementById('judging-line');
  if (jl) jl.style.display = (r || gl) && live || j ? '' : 'none';
  LANES.forEach(l => ['p','e'].forEach(w => {
    const m = document.getElementById(`mult-${l}-${w}`);
    if (m) m.textContent = state.phase === 'play' && state.judging && laneMultiplier(l) > 1 ? ' ×2' : '';
  }));

  // Complete Beer checklist: malt / hop / yeast light up as the beer comes together
  const beerEl = document.getElementById('beer-pill');
  if (beerEl) {
    const show = state.phase === 'play' || state.phase === 'between';
    beerEl.style.display = show ? '' : 'none';
    if (show) {
      const b = beerStatus('p');
      const boxes = ['malt', 'hop', 'yeast'].map(k => {
        const ok = !b.missing.includes(k);
        return `<span class="${ok ? 'ok' : ''}">${k.toUpperCase()}${ok ? ' ✓' : ''}</span>`;
      }).join('');
      const bonus = b.complete ? `<span class="bonus">${b.specialty ? 'SPECIALTY' : 'COMPLETE'} +${b.bonus}</span>` : '';
      beerEl.innerHTML = boxes + bonus;
      beerEl.title = `+${COMPLETE_BEER_BONUS} points for a complete beer (malt, hop and yeast). +${SPECIALTY_BEER_BONUS} bonus with an adjunct.`;
    }
  }

  const relicBar = document.getElementById('relic-bar');
  const bDef = breweryDef();
  const bIcon = bDef ? `<span class="relic-icon" title="${bDef.name} | Passive: ${bDef.passive} | Ability: ${bDef.ability.name}: ${bDef.ability.desc}">${bDef.icon}</span>` : '';
  if (relicBar) relicBar.innerHTML = state.currentNode ? bIcon + relicIconsHtml() : '';

  // Choosing from the top of your deck / your discard pile
  const pickEl = document.getElementById('battle-picker');
  if (pickEl) {
    const show = state.phase === 'play' && state.playerTurn && state.battlePicker;
    pickEl.style.display = show ? '' : 'none';
    pickEl.innerHTML = show ? battlePickerHtml() : '';
  }

  // What the rival is about to do (committed plan)
  const intentEl = document.getElementById('rival-intent');
  if (intentEl) {
    if (state.disaster) {
      const show = state.phase === 'play';
      intentEl.style.display = show ? '' : 'none';
      intentEl.innerHTML = show ? disasterPanelHtml() : '';
    } else {
      const show = state.phase === 'play' && state.playerTurn && state.rivalPlan && !rivalHidden();
      intentEl.style.display = show ? '' : 'none';
      intentEl.innerHTML = show ? rivalIntentHtml() : '';
    }
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

  juiceBeforeField();
  renderField();
  renderHand();
  renderActions();
  renderRoundWins();
  renderLog();
  juiceAfterField();
  juiceMoments();
}

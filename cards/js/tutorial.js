// tutorial.js — the Guided Brew
// One short scripted battle that teaches one idea at a time. Fixed hands, a rival
// that plays a set script, and a coach box that points at the right spot.
//   • Offered once, the first time a new player presses START GAME
//   • Replayable from How to Play
//   • Counts for nothing: no achievements, unlocks, runs or stats
// Normal battles never see any of this: every hook checks state.tutorial first.

const TUT_KEY   = 'wortcraft_tutorial';
const TUT_TURNS = 5;

// Your cards: the opening hand, then one draw per turn (in order)
const TUT_HAND  = ['paleale', 'cascade', 'cascade', 'chico', 'choc'];
const TUT_DRAWS = ['marshm', 'paleale', 'crystal40', 'palechoc', 'munich', '2row', '2row'];
// The rival: its whole hand up front, played on a fixed script
const TUT_RIVAL_HAND  = ['pilsner', 'munich', 'kolsch', 'hallertau', 'caramun', 'choc'];
const TUT_RIVAL_DECK  = ['6row', '6row', '6row', '6row', '6row'];
const TUT_RIVAL_SCRIPT = {
  1: [['pilsner', 'hot']],
  2: [['munich', 'hot']],
  3: [['kolsch', 'cold'], ['hallertau', 'cold']],
  4: [['caramun', 'hot']],
  5: [['choc', 'hot']],
};

// Card names come from the card data, so renames never leave the guide behind
const tutName = id => { const c = getCardDef(id); return c ? c.name : id; };

// Each step waits for one thing: 'next' (a button), a play, or ending the turn.
//   play: card id, lane: where it must go, glow: what to light up, free: anything goes
const TUT_STEPS = [
  { turn: 1, wait: 'next', glow: ['score'],
    text: `Welcome to <b>Judging Day</b>. You and a rival each brew a beer at the same time. When the round ends, the judges score both beers and the higher score wins.` },
  { turn: 1, wait: 'next', glow: ['hand', 'budget'],
    text: `This is your hand. A card's <b>cost</b> is in its top-left corner and its <b>points</b> are top-right. You get 1 budget on turn 1, then 1 more each turn.` },
  { turn: 1, play: 'paleale', lane: 'hot',
    text: `Malts are the backbone of a beer, and they go on your <b>hot side</b>. Tap <b>${tutName('paleale')}</b>, then tap your hot side.` },
  { turn: 1, wait: 'end', glow: ['end'],
    text: `Its points now count toward your score. That's all your budget, so tap <b>END TURN</b>.` },

  { turn: 2, wait: 'next', glow: ['intent', 'summary'],
    text: `The rival just brewed too. Up top, <b>RIVAL NEXT</b> shows what it plans to play after you, and roughly how many points it will gain. No surprises.` },
  { turn: 2, play: 'cascade', lane: 'cold',
    text: `Hops can go on either side. Tap <b>${tutName('cascade')}</b>, then your <b>cold side</b>.` },
  { turn: 2, play: 'cascade', lane: 'cold',
    text: `Card text matters. ${tutName('cascade')} says two <b>c-hops</b> on the same side boost each other. Play the other ${tutName('cascade')} on your cold side too.` },
  { turn: 2, wait: 'end', glow: ['end', 'coldLane'],
    text: `Both jumped from 10 to 15. Combos like that are how big beers get made. End your turn.` },

  { turn: 3, play: 'chico', lane: 'cold', glow: ['beer'],
    text: `Every beer needs <b>malt, hops and yeast</b>. Yeast lives on the <b>cold side</b>. Play <b>${tutName('chico')}</b>.` },
  { turn: 3, wait: 'next', glow: ['beer'],
    text: `<b>Complete beer!</b> The MALT, HOP, YEAST checklist lit up for <b>+30</b>. Yeast keeps working too: ${tutName('chico')} grows +2 every turn.` },
  { turn: 3, play: 'paleale', lane: 'hot',
    text: `You have 1 budget left, and unspent budget is wasted. Play your other <b>${tutName('paleale')}</b>.` },
  { turn: 3, wait: 'end', glow: ['end'], text: `End your turn.` },

  { turn: 4, play: 'choc', lane: 'hot',
    text: `Dark malts add <b>roast</b>. Play <b>${tutName('choc')}</b> on your hot side.` },
  { turn: 4, wait: 'next', glow: ['roast'],
    text: `Roast makes roasty cards stronger, but your hot side can only hold <b>4</b>. Go past that and the beer is <b>Burnt</b>: your hot side scores half.` },
  { turn: 4, play: 'crystal40', lane: 'hot',
    text: `Spend your last budget on <b>${tutName('crystal40')}</b>.` },
  { turn: 4, wait: 'end', glow: ['end'], text: `End your turn.` },

  { turn: 5, wait: 'next', glow: ['beer'],
    text: `Last turn! <b>Adjuncts</b> like ${tutName('marshm')} turn a complete beer into a <b>Specialty Beer</b> for +10 more.` },
  { turn: 5, free: true, wait: 'end', glow: ['hand'],
    text: `Your call now. Spend your 5 budget however you like, then end your turn. The rival makes its last move, then the judges taste.` },
];

let tut = null;   // { step } while the guided brew runs

function tutOn() { return typeof state !== 'undefined' && state && state.tutorial && tut; }
function tutStep() { return tut ? TUT_STEPS[tut.step] || null : null; }
function tutSeen() { try { return !!localStorage.getItem(TUT_KEY); } catch (e) { return true; } }
function tutMarkSeen(how) { try { localStorage.setItem(TUT_KEY, how || 'seen'); } catch (e) {} }

// Offer it to brand-new players only
function shouldOfferTutorial() {
  if (tutSeen()) return false;
  const p = typeof loadProfile === 'function' ? loadProfile() : { runs: 0 };
  return !p.runs && !(typeof hasSavedRun === 'function' && hasSavedRun());
}

// ── Start / leave ──

function startTutorial() {
  closeTutorialOffer();
  tutMarkSeen('started');
  setScreen('game-screen');
  initGame({ playerDeck: [], rivalDeck: [] });
  const mk = id => freshCopy(getCardDef(id));
  state.tutorial = true;
  state.rivalName = 'Friendly Rival';
  state.maxRounds = 1;
  state.maxTurns  = TUT_TURNS;
  state.pHand = TUT_HAND.map(mk);
  state.pDeck = TUT_DRAWS.map(mk);
  state.eHand = TUT_RIVAL_HAND.map(mk);
  state.eDeck = TUT_RIVAL_DECK.map(mk);
  state.newCards = new Set();
  state.logs = [];
  tut = { step: 0 };
  startRound();          // no mulligan in the guided brew
  render();
}

function leaveTutorial() {
  if (state && state.tutorial) state.phase = 'end';
  tut = null;
  const t = document.getElementById('tally-overlay'); if (t) t.classList.add('hidden');
  document.getElementById('overlay').classList.add('hidden');
  tutHideCoach();
  showTitleScreen();
}

function tutAdvance() {
  if (!tut) return;
  tut.step++;
  if (typeof render === 'function') render();
}

// ── Gates: in the guided brew, only the move the coach asks for goes through ──

function tutAllowsSelect(idx) {
  const s = tutStep();
  if (!s) return true;
  if (s.free) return true;
  const c = state.pHand[idx];
  return !!(s.play && c && c.id === s.play);
}
function tutAllowsLane(lane) {
  const s = tutStep();
  if (!s || s.free) return true;
  return !!(s.play && s.lane === lane);
}
function tutAllowsEnd() {
  const s = tutStep();
  return !s || s.wait === 'end';
}
function tutNudge() {
  const el = document.getElementById('tut-coach');
  if (!el) return;
  el.classList.remove('tut-nudge'); void el.offsetWidth; el.classList.add('tut-nudge');
}

const _tutSelect = selectCard, _tutPlay = playToLane, _tutEnd = endTurn, _tutPlan = planRivalTurn,
      _tutOverlay = showOverlay, _tutReplay = replayBattle;

selectCard = function (idx) {
  if (tutOn() && state.playerTurn && state.phase === 'play' && !tutAllowsSelect(idx)) { tutNudge(); return; }
  return _tutSelect(idx);
};

playToLane = function (lane) {
  if (!tutOn()) return _tutPlay(lane);
  if (!tutAllowsLane(lane)) { tutNudge(); return; }
  const s = tutStep();
  const before = s && s.play ? state.field[lane].p.filter(c => c.id === s.play).length : 0;
  const r = _tutPlay(lane);
  if (s && s.play && state.field[lane].p.filter(c => c.id === s.play).length > before) tutAdvance();
  return r;
};

endTurn = function () {
  if (!tutOn()) return _tutEnd();
  if (!tutAllowsEnd()) { tutNudge(); return; }
  tut.step++;
  return _tutEnd();
};

// The rival follows its script, so RIVAL NEXT is exactly what happens
planRivalTurn = function () {
  if (!(state && state.tutorial)) return _tutPlan();
  if (state.phase !== 'play' || state.ePassed) { state.rivalPlan = null; return; }
  tagRivalCards();
  const used = new Set();
  state.rivalPlan = (TUT_RIVAL_SCRIPT[state.turn] || []).map(([id, lane]) => {
    const c = state.eHand.find(x => x.id === id && !used.has(x));
    if (!c) return null;
    used.add(c);
    return planEntry(c, lane, c.points);
  }).filter(Boolean);
};

showOverlay = function (pw, ew) {
  if (!(state && state.tutorial)) return _tutOverlay(pw, ew);
  tutMarkSeen('done');
  tut = null;
  tutHideCoach();
  const s = state.lastRoundScore || { p: totalScore('p'), e: totalScore('e') };
  const won = s.p > s.e;
  document.getElementById('ov-title').textContent = won ? 'GUIDED BREW DONE!' : 'GUIDED BREW DONE';
  document.getElementById('ov-title').style.color = 'var(--gold)';
  document.getElementById('ov-sub').textContent = won
    ? `Your beer beat the rival ${s.p} to ${s.e}. You're ready for a real run.`
    : `The rival edged it ${s.e} to ${s.p}, but you've got the basics. You're ready for a real run.`;
  document.getElementById('ov-wins').textContent =
    'In a run you pick a brewery, build your deck as you go, and face tougher rivals. Tap any keyword on a card to read what it does.';
  document.getElementById('ov-buttons').innerHTML =
    `<button class="btn btn-gold" onclick="tutFinish('play')">▶ START A RUN</button>
     <button class="btn btn-primary" onclick="tutFinish('menu')">MAIN MENU</button>`;
  document.getElementById('overlay').classList.remove('hidden');
};

replayBattle = function () {
  if (state && state.tutorial) return startTutorial();
  return _tutReplay();
};

function tutFinish(where) {
  document.getElementById('overlay').classList.add('hidden');
  if (state) state.tutorial = false;
  if (where === 'play') _tutShowDeckManager('play'); else showTitleScreen();
}

// ── The coach box ──

function tutGlowTargets(keys) {
  const s = tutStep(), out = [];
  const lane = l => { const e = document.getElementById('plane-' + l); return e && e.closest('.lane'); };
  const map = {
    score:   () => document.querySelector('.scoreboard'),
    hand:    () => document.getElementById('hand'),
    budget:  () => { const e = document.getElementById('budget-rem'); return e && e.closest('.st-item'); },
    end:     () => [...document.querySelectorAll('#actions button')].find(b => /END TURN/.test(b.textContent)),
    intent:  () => document.getElementById('rival-intent'),
    summary: () => document.getElementById('rival-summary'),
    beer:    () => document.getElementById('beer-pill'),
    roast:   () => document.getElementById('chips-hot-p'),
    coldLane:() => lane('cold'),
  };
  (keys || []).forEach(k => { const e = map[k] && map[k](); if (e) out.push(e); });
  // Play steps: the card first, then where it goes
  if (s && s.play) {
    const sel = typeof selectedCard === 'number' ? state.pHand[selectedCard] : null;
    if (sel && sel.id === s.play) {
      out.push(lane(s.lane));
      const btn = document.querySelector('#m-preview .mp-' + s.lane);
      if (btn) out.push(btn);
    } else {
      const i = state.pHand.findIndex(c => c.id === s.play);
      const hand = document.getElementById('hand');
      if (i >= 0 && hand && hand.children[i]) {
        out.push(hand.children[i]);
        // Phones: bring the card into view in the sideways hand
        try { if (typeof phoneUI === 'function' && phoneUI()) hand.children[i].scrollIntoView({ block: 'nearest', inline: 'center' }); } catch (e) {}
      }
    }
  }
  return out.filter(Boolean);
}

// Push the board down so the coach box never covers it
function tutPad(px) {
  const app = document.getElementById('app');
  if (app) app.style.paddingTop = px ? px + 'px' : '';
}

function tutHideCoach() {
  const el = document.getElementById('tut-coach');
  if (el) el.style.display = 'none';
  tutPad(0);
  document.querySelectorAll('.tut-glow').forEach(e => e.classList.remove('tut-glow'));
}

function tutRender() {
  document.querySelectorAll('.tut-glow').forEach(e => e.classList.remove('tut-glow'));
  const screen = document.getElementById('game-screen');
  if (!tutOn() || !screen || !screen.classList.contains('active')) { tutHideCoach(); return; }
  let el = document.getElementById('tut-coach');
  if (!el) {
    el = document.createElement('div');
    el.id = 'tut-coach';
    el.className = 'tut-coach';
    document.body.appendChild(el);
  }
  const s = tutStep();
  const live = s && state.phase === 'play' && state.playerTurn && state.turn === s.turn;
  let body, btn = '';
  if (live) {
    body = s.text;
    if (s.wait === 'next') btn = `<button class="btn btn-gold tut-next" onclick="tutAdvance()">NEXT ▶</button>`;
    tutGlowTargets(s.glow).forEach(e => e.classList.add('tut-glow'));
  } else if (state.phase === 'play' && !state.playerTurn) {
    body = `The rival is brewing. Watch its cards land.`;
  } else if (state.phase === 'tally') {
    body = `The judges are tasting both beers...`;
  } else {
    tutHideCoach();
    return;
  }
  const n = Math.min(state.turn || 1, TUT_TURNS);
  el.innerHTML = `<div class="tut-head"><span>GUIDED BREW · TURN ${n}/${TUT_TURNS}</span>
      <button class="tut-x" onclick="leaveTutorial()" title="Leave the guided brew">✕ LEAVE</button></div>
    <div class="tut-text">${body}</div>${btn}`;
  el.style.display = '';
  tutPad(el.offsetHeight + 14);
}

// ── First-time offer and How to Play entry ──

const _tutShowDeckManager = showDeckManager;
showDeckManager = function (mode) {
  if (mode === 'play' && shouldOfferTutorial()) { showTutorialOffer(); return; }
  return _tutShowDeckManager(mode);
};

function showTutorialOffer() {
  let el = document.getElementById('tut-offer');
  if (!el) {
    el = document.createElement('div');
    el.id = 'tut-offer';
    el.className = 'overlay';
    document.body.appendChild(el);
  }
  el.innerHTML = `<div class="overlay-box tut-offer-box">
      <div class="overlay-title" style="color:var(--gold)">FIRST TIME BREWING?</div>
      <div class="overlay-sub">Try a short guided brew. It walks you through one battle, a step at a time, in about 5 minutes.</div>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:12px;">
        <button class="btn btn-gold" onclick="startTutorial()">▶ GUIDED BREW</button>
        <button class="btn btn-primary" onclick="skipTutorial()">SKIP, I KNOW HOW</button>
      </div>
      <div class="tut-offer-note">You can replay it any time from How to Play.</div>
    </div>`;
  el.classList.remove('hidden');
}
function closeTutorialOffer() { const el = document.getElementById('tut-offer'); if (el) el.classList.add('hidden'); }
function skipTutorial() {
  tutMarkSeen('skipped');
  closeTutorialOffer();
  _tutShowDeckManager('play');
}

if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    const _render = render;
    render = function () { const r = _render.apply(this, arguments); try { tutRender(); } catch (e) {} return r; };
    const _title = showTitleScreen;
    showTitleScreen = function () { tutHideCoach(); closeTutorialOffer(); return _title.apply(this, arguments); };
  });
}

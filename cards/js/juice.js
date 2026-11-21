// juice.js — feedback animations
//   • cards land on the board, and fly there from your hand
//   • floating +N / −N numbers whenever a card's score changes
//   • scores tick up instead of jumping
//   • banners for big moments (Burnt, Stuck Mash, Complete Beer, last turn, new round)
//   • the end-of-round judging tally
// Everything here is visual only. Turn it off with JUICE.on = false (tests do this),
// and it switches itself off for players who ask their system for reduced motion.

const JUICE = { on: true };
const RIVAL_PLAY_DELAY = 550;   // ms between the rival's cards (scaled by game speed)
const jMs = ms => (typeof speedMs === 'function' ? speedMs(ms) : ms);

function juiceOn() {
  if (!JUICE.on || typeof document === 'undefined') return false;
  if (typeof SETTINGS !== 'undefined' && !SETTINGS.anim) return false;
  try {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  } catch (e) { /* old browsers */ }
  return true;
}

function juiceLayer() {
  let el = document.getElementById('juice-layer');
  if (!el) {
    el = document.createElement('div');
    el.id = 'juice-layer';
    document.body.appendChild(el);
  }
  return el;
}

const juiceFrame = cb => (typeof requestAnimationFrame === 'function' ? requestAnimationFrame(cb) : setTimeout(() => cb(Date.now()), 16));
const juiceNow   = () => (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now());

// ── Field cards: landing, buffs, floating numbers ──

const _jSeen = new WeakMap();   // card -> points last shown
const _jFx   = new WeakMap();   // card -> { cls, t0 } animation in progress
const _jIds  = new WeakMap();
let   _jUid  = 0;
let   _jFloaters = [];          // [{ card, delta }] waiting for the board to be drawn
const FX_MS  = { 'fc-enter': 420, 'fc-up': 650, 'fc-down': 650 };

function juiceId(c) {
  if (!_jIds.has(c)) _jIds.set(c, ++_jUid);
  return _jIds.get(c);
}

// Before the board is redrawn: compare every card with what we showed last time
function juiceBeforeField() {
  if (!juiceOn() || !state || !state.field) return;
  const now = juiceNow();
  const all = [];
  LANES.forEach(l => ['p', 'e'].forEach(w => state.field[l][w].forEach(c => all.push([c, effectivePoints(c, l, w)]))));
  all.forEach(([c, pts]) => {
    const prev = _jSeen.get(c);
    if (prev === undefined)  _jFx.set(c, { cls: 'fc-enter', t0: now });
    else if (prev !== pts) {
      _jFx.set(c, { cls: pts > prev ? 'fc-up' : 'fc-down', t0: now });
      _jFloaters.push({ card: c, delta: pts - prev });
    }
    _jSeen.set(c, pts);
  });
}

// Extra class + attributes for one field card. Animations that are already running keep
// their place (negative delay), so frequent redraws don't restart them.
function juiceCardAttrs(c) {
  if (!juiceOn()) return { cls: '', attrs: '' };
  let cls = '', attrs = ` data-jid="${juiceId(c)}"`;
  const fx = _jFx.get(c);
  if (fx) {
    const age = juiceNow() - fx.t0;
    if (age < FX_MS[fx.cls]) {
      cls = ' ' + fx.cls;
      attrs += ` style="animation-delay:-${Math.round(age)}ms"`;
    } else _jFx.delete(c);
  }
  return { cls, attrs };
}

function juiceCardEl(c) {
  return document.querySelector(`.field-card[data-jid="${juiceId(c)}"]`);
}

// After the board is drawn: float numbers over the cards that changed
function juiceAfterField() {
  if (!juiceOn()) { _jFloaters = []; return; }
  const list = _jFloaters;
  _jFloaters = [];
  list.forEach(({ card, delta }, i) => {
    const el = juiceCardEl(card);
    if (!el) return;
    const r = el.getBoundingClientRect();
    const f = document.createElement('div');
    f.className = 'floater ' + (delta > 0 ? 'up' : 'down');
    f.textContent = (delta > 0 ? '+' : '') + delta;
    f.style.left = (r.left + r.width / 2) + 'px';
    f.style.top  = (r.top - 2) + 'px';
    f.style.animationDelay = (i % 6) * 60 + 'ms';   // a little ripple when lots change at once
    juiceLayer().appendChild(f);
    setTimeout(() => f.remove(), 1100 + (i % 6) * 60);
  });
  juiceFlyLand();
}

// ── Card flying from your hand to the board ──

let _jFly = null;

// Called just before a card leaves your hand
function juiceFlyStart(handIdx, card) {
  _jFly = null;
  if (!juiceOn()) return;
  const el = document.querySelectorAll('#hand .card')[handIdx];
  if (!el) return;
  _jFly = { rect: el.getBoundingClientRect(), html: el.outerHTML, card };
}

function juiceFlyLand() {
  const fly = _jFly;
  _jFly = null;
  if (!fly) return;
  const target = juiceCardEl(fly.card);
  if (!target) return;
  const to   = target.getBoundingClientRect();
  const wrap = document.createElement('div');
  wrap.className = 'fly-ghost';
  wrap.innerHTML = fly.html;
  Object.assign(wrap.style, { left: fly.rect.left + 'px', top: fly.rect.top + 'px', width: fly.rect.width + 'px', height: fly.rect.height + 'px' });
  juiceLayer().appendChild(wrap);
  if (typeof wrap.animate !== 'function') { wrap.remove(); return; }
  const dx = (to.left + to.width / 2) - (fly.rect.left + fly.rect.width / 2);
  const dy = (to.top + to.height / 2) - (fly.rect.top + fly.rect.height / 2);
  const s  = Math.max(0.2, to.width / fly.rect.width);
  wrap.animate([
    { transform: 'translate(0,0) scale(1)', opacity: 1 },
    { transform: `translate(${dx * 0.6}px,${dy * 0.6 - 30}px) scale(${(1 + s) / 2}) rotate(-4deg)`, opacity: 0.95, offset: 0.6 },
    { transform: `translate(${dx}px,${dy}px) scale(${s})`, opacity: 0 },
  ], { duration: 340, easing: 'cubic-bezier(.4,0,.6,1)' }).onfinish = () => wrap.remove();
}

// ── Numbers that count up ──

function juiceCount(el, value, fmt = v => String(v)) {
  if (!el) return;
  const from = el._jv;
  el._jv = value;
  if (!juiceOn() || from === undefined || from === value) { el.textContent = fmt(value); return; }
  el.classList.remove('num-up', 'num-down');
  void el.offsetWidth;   // restart the pop
  el.classList.add(value > from ? 'num-up' : 'num-down');
  const t0 = juiceNow(), dur = 450, token = {};
  el._jTok = token;
  const step = () => {
    if (el._jTok !== token) return;     // a newer count took over
    const k = Math.min(1, (juiceNow() - t0) / dur);
    const eased = 1 - Math.pow(1 - k, 3);
    el.textContent = fmt(Math.round(from + (value - from) * eased));
    if (k < 1) juiceFrame(step);
  };
  juiceFrame(step);
}

// ── Banners and shakes ──

// A new banner takes over from the one on screen (it slides away quickly)
function juiceBanner(html, kind = 'gold', ms = 1300) {
  if (!juiceOn()) return;
  ms = jMs(ms);
  const layer = juiceLayer();
  layer.querySelectorAll('.juice-banner:not(.banner-out)').forEach(old => {
    old.classList.add('banner-out');
    setTimeout(() => old.remove(), 220);
  });
  const b = document.createElement('div');
  b.className = `juice-banner banner-${kind}`;
  b.style.animationDuration = ms + 'ms';
  b.innerHTML = html;
  layer.appendChild(b);
  setTimeout(() => b.remove(), ms);
}

function juiceShake(el) {
  if (!juiceOn() || !el) return;
  if (typeof SETTINGS !== 'undefined' && !SETTINGS.shake) return;
  el.classList.remove('shake');
  void el.offsetWidth;
  el.classList.add('shake');
  setTimeout(() => el.classList.remove('shake'), 450);
}

function laneEl(lane, who) {
  const inner = document.getElementById((who === 'p' ? 'plane-' : 'elane-') + lane);
  return inner ? inner.closest('.lane') : null;
}

// ── Big moments: compare this render with the last one ──

let _jPrev = null;

function juiceMoments() {
  if (!juiceOn() || !state || !state.field) return;
  const now = {
    ref:     state,
    phase:   state.phase,
    round:   state.round,
    turn:    state.turn,
    myTurn:  state.playerTurn,
    burntP:  state.phase === 'play' && isBurnt('p'),
    burntE:  state.phase === 'play' && isBurnt('e'),
    stuck:   state.phase === 'play' && isMashStuck('p'),
    beerP:   state.phase === 'play' ? beerStatus('p').bonus : 0,
    beerE:   state.phase === 'play' ? beerStatus('e').bonus : 0,
    lead:    Math.sign(totalScore('p') - totalScore('e')),
  };
  const was = _jPrev;
  _jPrev = now;
  if (!was || was.ref !== state) return;    // new battle: just take a baseline

  if (now.phase === 'play' && was.phase !== 'play') {
    const j = state.judging;
    juiceBanner(`ROUND ${state.round}${j ? `<small>${j.icon} ${j.name.toUpperCase()}: ${j.desc}</small>` : ''}`, 'gold', 1500);
  }
  if (now.phase === 'play' && now.myTurn && now.turn === maxTurns() && (was.turn !== now.turn || !was.myTurn)) {
    juiceBanner('⏳ LAST TURN!', 'orange', 1200);
  }
  if (now.burntP && !was.burntP) {
    juiceBanner(`🔥 BURNT!<small>Your hot side scores ${hasRelic('steamjacket') ? 'three quarters' : 'half'}</small>`, 'red', 1600);
    juiceShake(laneEl('hot', 'p'));
  }
  if (now.burntE && !was.burntE) {
    juiceBanner('🔥 RIVAL BURNT!<small>Their hot side scores half</small>', 'gold', 1400);
    juiceShake(laneEl('hot', 'e'));
  }
  if (now.stuck && !was.stuck) {
    if (hasRelic('decoction')) juiceBanner('🫕 DECOCTION! +8', 'gold', 1400);
    else { juiceBanner('🧱 STUCK MASH! −8', 'red', 1400); juiceShake(laneEl('hot', 'p')); }
  }
  if (now.beerP > was.beerP && now.phase === 'play' && was.phase === 'play') {
    juiceBanner(was.beerP === 0
      ? `🍺 ${now.beerP > COMPLETE_BEER_BONUS ? 'SPECIALTY' : 'COMPLETE'} BEER +${now.beerP}`
      : `✦ SPECIALTY BEER +${now.beerP - was.beerP}`, 'gold', 1500);
  }
  if (now.beerE > was.beerE && was.beerE === 0 && now.phase === 'play' && was.phase === 'play') {
    juiceBanner(`Rival brewed a complete beer +${now.beerE}`, 'enemy', 1200);
  }
  if (now.lead !== was.lead && now.phase === 'play' && now.lead !== 0 && !rivalHidden()) {
    const box = document.getElementById(now.lead > 0 ? 'score-player' : 'score-enemy');
    if (box) { box.classList.remove('lead-pop'); void box.offsetWidth; box.classList.add('lead-pop'); }
  }
}

// Meter styling that goes with roast and mash danger
function juiceMeters(roastEl, mashEl) {
  if (roastEl) {
    const roast = state.roastTokens || 0;
    const eff   = roast - (state.roastSafe || 0);
    const th    = getRoastThreshold('p');
    const burnt = state.phase === 'play' && isBurnt('p');
    roastEl.classList.toggle('roast-warm',   !burnt && roast > 0 && eff < th);
    roastEl.classList.toggle('roast-danger', !burnt && eff >= th && roast > 0);
    roastEl.classList.toggle('roast-burnt',  burnt);
  }
  if (mashEl) {
    const run = state.phase === 'play' ? trailingSticky('p') : 0;
    mashEl.classList.toggle('mash-danger', run >= CLUMP_SIZE - 1 || (state.phase === 'play' && isMashStuck('p')));
  }
}

// ── End-of-round judging tally ──

function showRoundTally(done) {
  const ov  = document.getElementById('tally-overlay');
  const box = document.getElementById('tally-box');
  if (!ov || !box) { done(); return; }

  const j   = state.judging;
  const row = (label, p, e, note) => ({ label, p, e, note });
  const rows = [
    row(`🔥 Hot side${j && j.lane === 'hot' ? ' ×2' : ''}`, laneScore('hot', 'p'), laneScore('hot', 'e'),
        isBurnt('p') || isBurnt('e') ? `${isBurnt('p') ? 'you' : 'rival'} burnt, ${isBurnt('p') && hasRelic('steamjacket') ? '¾' : '½'}` : ''),
    row(`❄ Cold side${j && j.lane === 'cold' ? ' ×2' : ''}`, laneScore('cold', 'p'), laneScore('cold', 'e'), ''),
    row('🍺 Beer bonus', beerStatus('p').bonus, beerStatus('e').bonus, ''),
  ];
  if (state.taproomActive) rows.push(row(`🍻 Tap List (${boardTagCount('p')} tags)`, tapListPoints('p'), 0, ''));
  const ps = totalScore('p'), es = totalScore('e');
  let result = ps > es ? 'win' : es > ps ? 'lose' : 'draw';
  let stamp  = result === 'win' ? '★ YOU WIN THE ROUND!' : result === 'lose' ? '✗ RIVAL WINS THE ROUND' : 'DRAW';
  if (state.disaster) {
    const tier = disasterTier(ps);
    result = tier ? 'win' : 'lose';
    stamp  = tier ? `${TIER_NAMES[tier]} TIER!` : 'TARGET MISSED';
  }

  box.innerHTML = `
    <div class="tally-title">ROUND ${state.round}: THE JUDGES TASTE</div>
    ${j ? `<div class="tally-cat">${j.icon} ${j.name.toUpperCase()}</div>` : ''}
    <div class="tally-grid">
      <div class="tally-head"></div><div class="tally-head you">YOU</div><div class="tally-head rival">${(state.rivalName || 'RIVAL').toUpperCase()}</div>
      ${rows.map((r, i) => `
        <div class="tally-label tally-r${i}">${r.label}${r.note ? `<small>${r.note}</small>` : ''}</div>
        <div class="tally-num you tally-r${i}" data-v="${r.p}">0</div>
        <div class="tally-num rival tally-r${i}" data-v="${r.e}">0</div>`).join('')}
      <div class="tally-label tally-total tally-rt">TOTAL</div>
      <div class="tally-num you tally-total tally-rt" data-v="${ps}">0</div>
      <div class="tally-num rival tally-total tally-rt" data-v="${es}">0</div>
    </div>
    <div class="tally-stamp stamp-${result}">${stamp}</div>
    <button class="btn btn-gold tally-continue" id="tally-continue">CONTINUE ▶</button>`;
  ov.classList.remove('hidden');

  const timers = [];
  let finished = false;
  const reveal = (cls, dur) => box.querySelectorAll('.' + cls).forEach(el => {
    el.classList.add('shown');
    if (el.dataset.v !== undefined) { el._jv = 0; juiceCount(el, +el.dataset.v); }
  });
  const finish = () => {
    if (finished) return;
    finished = true;
    timers.forEach(clearTimeout);
    box.querySelectorAll('.tally-num').forEach(el => { el._jTok = null; el.textContent = el.dataset.v; });
    box.querySelectorAll('.tally-label, .tally-num').forEach(el => el.classList.add('shown'));
    box.querySelectorAll('.tally-num.tally-total').forEach(el => {
      const mine = el.classList.contains('you');
      if ((mine && result === 'win') || (!mine && result === 'lose')) el.classList.add('tally-winner');
    });
    box.querySelector('.tally-stamp').classList.add('shown');
    box.querySelector('.tally-continue').classList.add('shown');
  };

  rows.forEach((r, i) => timers.push(setTimeout(() => reveal('tally-r' + i), jMs(250 + i * 550))));
  timers.push(setTimeout(() => reveal('tally-rt'), jMs(250 + rows.length * 550)));
  timers.push(setTimeout(finish, jMs(250 + rows.length * 550 + 900)));

  // Click anywhere to skip ahead; once everything is shown, Continue closes it
  box.onclick = e => {
    if (!finished) { finish(); return; }
    if (e.target && e.target.id === 'tally-continue') {
      ov.classList.add('hidden');
      box.onclick = null;
      done();
    }
  };
}

// stats.js — lifetime records and totals, shown on the Stats tab of the Achievements shelf
//   • Only run battles count (no practice games, guided brew or playtest mode)
//   • Runs, wins, bosses and recent runs come from the profile, so they go back to day one
//   • Everything else counts from the day this update was installed (stats.since)

const STATS_KEY = 'wortcraft_stats';

function blankStats() {
  return { v: 1, since: Date.now(), cardsPlayed: 0, rounds: 0, beers: 0, specialty: 0, burnt: 0, acid: 0,
           battlesWon: 0, battlesLost: 0, bestWin: null, bestMargin: null, bestCard: null, bestTurn: null,
           plays: {}, losses: {}, styles: {}, byBrew: {} };
}
function loadStats() {
  let s = null;
  try { s = JSON.parse(localStorage.getItem(STATS_KEY) || 'null'); } catch (e) {}
  return Object.assign(blankStats(), s || {});
}
function saveStats(s) { try { localStorage.setItem(STATS_KEY, JSON.stringify(s)); } catch (e) {} }
function bumpStats(fn) { const s = loadStats(); fn(s); saveStats(s); }

// Only real run battles count
function statsLive() {
  if (typeof state === 'undefined' || !state || state.tutorial || !state.currentNode) return false;
  return typeof achAllowed !== 'function' || achAllowed();
}
function statsWhere() {
  const b = typeof runBrewery === 'function' ? runBrewery() : null;
  return { rival: state.rivalName || 'a rival', brewery: b || null, boss: !!state.isBoss, at: Date.now() };
}

// ── Hooks ──

// Before your card resolves: remember your score at the start of this turn
function statsBeforePlay(who) {
  if (who !== 'p' || !statsLive()) return;
  const key = state.round + '-' + state.turn;
  if (state._stKey !== key) { state._stKey = key; state._stTurnStart = totalScore('p'); }
}
function statsCardPlayed(c, who) {
  if (who !== 'p' || !statsLive() || !c || c.cat === 'token') return;
  bumpStats(s => { s.cardsPlayed++; s.plays[c.id] = (s.plays[c.id] || 0) + 1; });
}
function statsTurnEnded() {
  if (!statsLive() || state._stKey !== state.round + '-' + state.turn) return;
  const gain = totalScore('p') - (state._stTurnStart || 0);
  if (gain <= 0) return;
  bumpStats(s => { if (!s.bestTurn || gain > s.bestTurn.pts) s.bestTurn = { pts: gain, ...statsWhere() }; });
}
function statsRoundEnd(ps, es) {
  if (!statsLive()) return;
  const b = beerStatus('p');
  let top = null;
  LANES.forEach(l => getLaneCards(l, 'p').forEach(c => {
    if (c.cat === 'token') return;
    const pts = effectivePoints(c, l, 'p');
    if (!top || pts > top.pts) top = { pts, id: c.id };
  }));
  bumpStats(s => {
    s.rounds++;
    if (b.complete) s.beers++;
    if (b.specialty) s.specialty++;
    if (isBurnt('p')) s.burnt++;
    s.acid += state._acidGiven ? state._acidGiven - (state._stAcidCounted || 0) : 0;
    if (top && (!s.bestCard || top.pts > s.bestCard.pts)) s.bestCard = { ...top, ...statsWhere() };
  });
  state._stAcidCounted = state._acidGiven || 0;
}
function statsBattleWon() {
  if (!statsLive()) return;
  const sc = state.lastRoundScore || { p: 0, e: 0 };
  bumpStats(s => {
    s.battlesWon++;
    if (!s.bestWin || sc.p > s.bestWin.score) s.bestWin = { score: sc.p, vs: sc.e, ...statsWhere() };
    const m = sc.p - sc.e;
    if (!s.bestMargin || m > s.bestMargin.margin) s.bestMargin = { margin: m, p: sc.p, e: sc.e, ...statsWhere() };
  });
}
function statsBattleLost(fatal) {
  if (!statsLive()) return;
  bumpStats(s => {
    s.battlesLost++;
    if (fatal) { const r = state.rivalName || 'a rival'; s.losses[r] = (s.losses[r] || 0) + 1; }
  });
}
function statsRunEnd(won, brew, deck) {
  if (typeof achAllowed === 'function' && !achAllowed()) return;
  bumpStats(s => {
    const b = s.byBrew[brew] = s.byBrew[brew] || { runs: 0, wins: 0 };
    b.runs++; if (won) b.wins++;
    const st = typeof achDeckStyle === 'function' ? achDeckStyle(deck || []) : null;
    if (st) s.styles[st.tag] = (s.styles[st.tag] || 0) + 1;
  });
}

// ── The Stats tab ──

function statsDate(t) { return t ? new Date(t).toLocaleDateString() : ''; }
function statsBrewName(id) {
  const b = typeof BREWERIES !== 'undefined' && BREWERIES.find(x => x.id === id);
  return b ? `${b.icon} ${b.name}` : 'No brewery';
}
function statsCardName(id) { const c = getCardDef(id); return c ? c.name : id; }

function renderStats() {
  const el = document.getElementById('ach-stats');
  if (!el) return;
  const s = loadStats(), p = loadProfile();
  const tile = (label, value, sub) => `<div class="st-tile"><div class="st-val">${value}</div><div class="st-lab">${label}</div>${sub ? `<div class="st-sub">${sub}</div>` : ''}</div>`;
  const none = '<span class="st-none">-</span>';
  const ctx = r => r ? `vs ${r.rival}${r.brewery ? ' · ' + statsBrewName(r.brewery) : ''} · ${statsDate(r.at)}` : 'No record yet';
  const pct = (w, n) => n ? Math.round(100 * w / n) + '%' : '-';

  const records = [
    tile('Best winning score', s.bestWin ? s.bestWin.score : none, s.bestWin ? `${s.bestWin.score} to ${s.bestWin.vs}, ${ctx(s.bestWin)}` : ctx()),
    tile('Biggest win', s.bestMargin ? '+' + s.bestMargin.margin : none, s.bestMargin ? `${s.bestMargin.p} to ${s.bestMargin.e}, ${ctx(s.bestMargin)}` : ctx()),
    tile('Best single card', s.bestCard ? s.bestCard.pts : none, s.bestCard ? `${statsCardName(s.bestCard.id)}, ${ctx(s.bestCard)}` : ctx()),
    tile('Best turn', s.bestTurn ? '+' + s.bestTurn.pts : none, s.bestTurn ? ctx(s.bestTurn) : ctx()),
  ].join('');

  const totals = [
    tile('Runs', p.runs), tile('Run wins', p.wins, pct(p.wins, p.runs) + ' win rate'),
    tile('Bosses beaten', p.bossesBeaten),
    tile('Battles won', s.battlesWon, s.battlesWon + s.battlesLost ? pct(s.battlesWon, s.battlesWon + s.battlesLost) + ' of battles' : ''),
    tile('Cards played', s.cardsPlayed), tile('Complete beers', s.beers),
    tile('Specialty beers', s.specialty), tile('Times Burnt', s.burnt), tile('Acid dealt', s.acid),
  ].join('');

  const brewRows = (typeof BREWERIES !== 'undefined' ? BREWERIES : []).map(b => {
    const bs = s.byBrew[b.id] || { runs: 0, wins: 0 };
    const wins = Math.max(bs.wins, p.winsBy[b.id] || 0);
    const lvl = p.levels && p.levels[b.id] ? p.levels[b.id] : 0;
    const locked = typeof isBreweryUnlocked === 'function' && !isBreweryUnlocked(b);
    return `<tr class="${locked ? 'st-locked' : ''}"><td>${b.icon} ${locked ? '???' : b.name}</td><td>${bs.runs || '-'}</td><td>${wins || '-'}</td><td>${lvl ? 'Level ' + lvl : '-'}</td></tr>`;
  }).join('');

  const top = (obj, n) => Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, n);
  const favCards = top(s.plays, 3).map(([id, n]) => `${statsCardName(id)} <span class="st-n">×${n}</span>`).join('<br>') || none;
  const favStyle = top(s.styles, 1).map(([tag, n]) => { const st = ACH_STYLES.find(x => x.tag === tag); return st ? `${st.icon} ${st.style[0].toUpperCase() + st.style.slice(1)} <span class="st-n">${n} run${n > 1 ? 's' : ''}</span>` : tag; })[0] || none;
  const nemesis = top(s.losses, 1).map(([r, n]) => `${r} <span class="st-n">ended ${n} run${n > 1 ? 's' : ''}</span>`)[0] || none;

  const runs = p.history.map(h => {
    const deck = (h.cards || []).map(statsCardName);
    return `<details class="st-run ${h.won ? 'st-won' : ''}"><summary>
        <span class="st-res">${h.won ? '🏆 WON' : 'Act ' + h.act}</span>
        <span>${statsBrewName(h.brewery)}</span><span class="st-dim">BM ${h.level || 0}</span>
        <span class="st-dim">best ${h.best || 0}</span><span class="st-dim">${statsDate(h.at)}</span>${(h.mods || []).length ? `<span class="st-mods" title="${modsListText(h.mods)}">MODS ${h.mods.length}</span>` : ''}</summary>
      ${(h.mods || []).length ? `<div class="st-deck"><b>Modifiers:</b> ${modsListText(h.mods)}</div>` : ''}<div class="st-deck">${deck.length ? `<b>${deck.length} cards:</b> ${deck.join(', ')}` : 'Deck list not recorded for this run.'}</div></details>`;
  }).join('') || '<div class="st-empty">No runs yet. Your last 10 runs will show up here.</div>';

  el.innerHTML = `
    <div class="ach-cat"><div class="ach-cat-head"><span>RECORDS</span></div><div class="st-grid st-records">${records}</div></div>
    <div class="ach-cat"><div class="ach-cat-head"><span>TOTALS</span></div><div class="st-grid">${totals}</div></div>
    <div class="ach-cat"><div class="ach-cat-head"><span>BY BREWERY</span></div>
      <table class="st-table"><tr><th>Brewery</th><th>Runs</th><th>Wins</th><th>Brewmaster unlocked</th></tr>${brewRows}</table></div>
    <div class="ach-cat"><div class="ach-cat-head"><span>FAVORITES</span></div><div class="st-grid">
      ${tile('Most played cards', '', favCards)}${tile('Favorite style', '', favStyle)}${tile('Nemesis', '', nemesis)}</div></div>
    <div class="ach-cat"><div class="ach-cat-head"><span>RECENT RUNS</span><span class="ach-cat-n">tap a run to see its deck</span></div>${runs}</div>
    <div class="st-since">Records, totals and favorites count run battles since ${statsDate(s.since)}. Runs, wins and bosses go back to your first run.</div>`;
}

// Start the clock the first time this version runs
if (typeof localStorage !== 'undefined') { try { if (!localStorage.getItem(STATS_KEY)) saveStats(blankStats()); } catch (e) {} }

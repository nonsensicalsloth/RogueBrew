// progress.js — your long-term record and the end-of-run summary
//
//   • Profile (stored in the browser): runs played, wins, wins per brewery,
//     bosses beaten, and the last 10 runs. Breweries unlock from this.
//   • Run stats: tracked during a run and shown on the summary screen.

const PROFILE_KEY = 'wortcraft_profile';

function loadProfile() {
  try {
    const p = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null') || {};
    return { runs: p.runs || 0, wins: p.wins || 0, winsBy: p.winsBy || {}, bossesBeaten: p.bossesBeaten || 0, history: p.history || [] };
  } catch (e) { return { runs: 0, wins: 0, winsBy: {}, bossesBeaten: 0, history: [] }; }
}

function saveProfile(p) {
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); } catch (e) {}
}

function newRunStats(deckName) {
  return { deckName: deckName || '', battlesWon: 0, battlesLost: 0, festivalsWon: 0, bossesBeaten: 0,
           bestScore: 0, goldEarned: 0, unlocked: [], endedBy: null };
}

function runStats() {
  if (!mapState.stats) mapState.stats = newRunStats();
  return mapState.stats;
}

// ── Hooks called from the map and battles ──

function trackBattleWin(node, gold) {
  const s = runStats();
  s.battlesWon++;
  if (node.type === 'festival') s.festivalsWon++;
  if (node.type === 'boss')     s.bossesBeaten++;
  s.goldEarned += gold || 0;
  trackBestScore();
}

function trackBattleLoss(fatal) {
  const s = runStats();
  s.battlesLost++;
  trackBestScore();
  if (fatal) {
    const sc = (typeof state !== 'undefined' && state && state.lastRoundScore) || { p: 0, e: 0 };
    s.endedBy = { rival: state.rivalName || 'a rival', p: sc.p, e: sc.e, boss: !!state.isBoss };
  }
}

function trackBestScore() {
  const sc = typeof state !== 'undefined' && state && state.lastRoundScore;
  if (sc) runStats().bestScore = Math.max(runStats().bestScore, sc.p);
}

function trackUnlock(name) {
  runStats().unlocked.push(name);
}

// ── End of run ──

// Records the run in your profile and returns any breweries it unlocked
function recordRun(won) {
  const before = BREWERIES.filter(b => isBreweryUnlocked(b)).map(b => b.id);
  const p = loadProfile();
  const s = runStats();
  const brew = runBrewery() || 'none';
  p.runs++;
  if (won) { p.wins++; p.winsBy[brew] = (p.winsBy[brew] || 0) + 1; }
  p.bossesBeaten += s.bossesBeaten;
  p.history.unshift({ won, brewery: brew, act: mapState.act + 1, deck: draftState.deck.length, best: s.bestScore, at: Date.now() });
  p.history = p.history.slice(0, 10);
  saveProfile(p);
  return BREWERIES.filter(b => isBreweryUnlocked(b) && !before.includes(b.id));
}

function summaryNoop() {}

function runSummaryHtml(won, reason, newBreweries) {
  const s = runStats();
  const b = BREWERIES.find(x => x.id === runBrewery());
  const relics = (mapState.relics || []).map(id => getRelic(id)).filter(Boolean);
  const stat = (label, value) => `<div class="sum-stat"><span>${label}</span><b>${value}</b></div>`;

  const counts = {};
  draftState.deck.forEach(c => counts[c.cat] = (counts[c.cat] || 0) + 1);

  return `
    ${newBreweries.length ? newBreweries.map(nb => `<div class="sum-unlock">🎉 NEW BREWERY UNLOCKED: ${nb.icon} ${nb.name}</div>`).join('') : ''}
    ${reason ? `<div class="sum-reason">${reason}</div>` : ''}
    <div class="sum-grid">
      ${stat('Brewery', b ? `${b.icon} ${b.name}` : '—')}
      ${stat('Deck', s.deckName || '—')}
      ${stat('Reached', won ? 'Champion!' : `Act ${mapState.act + 1}`)}
      ${stat('Rooms visited', mapState.nodeCount || 0)}
      ${stat('Battles won', s.battlesWon)}
      ${stat('Battles lost', s.battlesLost)}
      ${stat('Festivals won', s.festivalsWon)}
      ${stat('Bosses beaten', s.bossesBeaten)}
      ${stat('Best round score', s.bestScore)}
      ${stat('Gold earned', s.goldEarned)}
      ${stat('Reputation left', `${mapState.rep}/${mapState.maxRep}`)}
      ${stat('Final deck', `${draftState.deck.length} cards`)}
    </div>
    ${s.endedBy ? `<div class="sum-line">Ended by <b>${s.endedBy.rival}</b>, ${s.endedBy.e} to ${s.endedBy.p}.</div>` : ''}
    <div class="sum-line">🔓 Unlocked this run: ${s.unlocked.length ? s.unlocked.join(', ') : 'nothing new'}</div>
    <div class="sum-line">🧰 Equipment: ${relics.length ? relics.map(r => `<span title="${r.desc}">${r.icon} ${r.name}</span>`).join(', ') : 'none'}</div>
    <div class="sum-deck-title">FINAL DECK · ${['malt','hop','yeast','adjunct','process'].filter(c => counts[c]).map(c => `${catIcon(c)} ${counts[c]}`).join('  ')}</div>
    <div class="removal-list sum-deck">${deckPickerHtml('summaryNoop', c => ({ html: `${c.points >= 0 ? '+' : ''}${c.points}`, disabled: false }))}</div>
    <div class="sum-line" style="color:var(--dim);">Hover a card to see it. Lifetime: ${loadProfile().runs} runs, ${loadProfile().wins} wins.</div>`;
}

function showRunSummary(won, reason) {
  const newBreweries = recordRun(won);
  const el = document.getElementById(won ? 'run-win-summary' : 'run-loss-summary');
  if (el) el.innerHTML = runSummaryHtml(won, reason, newBreweries);
}

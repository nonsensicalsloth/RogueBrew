// ── Achievements ──
// Earned once, kept forever (separate save key, so resetting decks or runs never clears them).
// Checks are called from hooks in battle.js, game.js, effects.js, nodes.js and progress.js.

const ACH_KEY = 'wortcraft_achievements';
const FULL_MENU_TAGS = 22;   // of the 31 tags in the game

const ACH_CATS = [
  { id: 'progress',  name: 'Progress',          desc: 'Milestones you reach by playing.' },
  { id: 'mechanic',  name: 'Brewing Technique', desc: 'Pull off the tricks each system allows.' },
  { id: 'challenge', name: 'Weird Little Builds', desc: 'Win with odd decks and strange plans.' },
  { id: 'style',     name: 'Style Medals',      desc: 'Win a run with a deck built around one style.' },
];

// Style medals: your deck's most common style tag when you win the run
const ACH_STYLES = [
  { tag: 'roasty', id: 'style_stout',   name: 'Black as Night',  icon: '☕', style: 'stout' },
  { tag: 'hazy',   id: 'style_hazy',    name: 'Juice Box',       icon: '🥭', style: 'hazy' },
  { tag: 'crisp',  id: 'style_lager',   name: 'Crisp and Clean', icon: '🧊', style: 'lager' },
  { tag: 'sour',   id: 'style_sour',    name: 'Pucker Factory',  icon: '🍒', style: 'sour' },
  { tag: 'belgian',id: 'style_belgian', name: 'Trappist',        icon: '⛪', style: 'Belgian' },
  { tag: 'funky',  id: 'style_wild',    name: 'Barnyard',        icon: '🐐', style: 'wild' },
  { tag: 'sweet',  id: 'style_pastry',  name: 'Pastry Chef',     icon: '🧁', style: 'pastry' },
];

const ACHIEVEMENTS = [
  // Progress
  { id: 'first_pour',   cat: 'progress',  icon: '🍺', name: 'First Pour',        desc: 'Win a run.' },
  { id: 'every_tap',    cat: 'progress',  icon: '🏭', name: 'Every Tap',         desc: 'Win a run with every brewery.' },
  { id: 'brewmaster5',  cat: 'progress',  icon: '🎖', name: 'Brewmaster',        desc: 'Win a run at Brewmaster 5 or higher.' },
  { id: 'brewmaster10', cat: 'progress',  icon: '👑', name: 'Master Brewer',     desc: 'Win a run at Brewmaster 10.' },
  { id: 'full_cellar',  cat: 'progress',  icon: '📚', name: 'Full Cellar',       desc: 'Unlock every card.' },
  // Mechanics
  { id: 'patience',     cat: 'mechanic',  icon: '⏳', name: 'Patience',          desc: 'Spend 5 or more Lagering on one crisp card.' },
  { id: 'edge',         cat: 'mechanic',  icon: '🔥', name: 'Right on the Edge', desc: 'Win a round with exactly as many roast tokens as your roast limit.' },
  { id: 'pucker',       cat: 'mechanic',  icon: '🍋', name: 'Pucker Up',         desc: 'Give a rival 20 or more Acid in one battle.' },
  { id: 'clean_bill',   cat: 'mechanic',  icon: '🧽', name: 'Clean Bill',        desc: 'Clean away an Acid Burn of −20 or worse.' },
  { id: 'rice_rescue',  cat: 'mechanic',  icon: '🌾', name: 'Rice to the Rescue', desc: 'Free a Stuck Mash with Rice Hulls.' },
  { id: 'full_menu',    cat: 'mechanic',  icon: '🍻', name: 'Full Menu',         desc: 'End a round with 22 or more different tags on your board.' },
  // Weird builds
  { id: 'single_hop',   cat: 'challenge', icon: '🌿', name: 'Single Hop',        desc: 'Win a run with only one hop in your deck.' },
  { id: 'lab_rat',      cat: 'challenge', icon: '🔬', name: 'Lab Rat',           desc: 'Win a run after using all three Quality Lab services.' },
  { id: 'return_sender',cat: 'challenge', icon: '📮', name: 'Return to Sender',  desc: 'Win a battle after your Brett spread Contamination to the rival.' },
  { id: 'repitch',      cat: 'challenge', icon: '🧪', name: 'Re-Pitch Perfect',  desc: 'Re-pitch a yeast with 25 or more points using Filtration.' },
  { id: 'biscuit_tin',  cat: 'challenge', icon: '🍪', name: 'Biscuit Tin',       desc: 'Score 30 or more with a single Biscuit Malt.' },
  { id: 'no_kettle',    cat: 'challenge', icon: '🫙', name: 'No Kettle Needed',  desc: 'Win a round with nothing on your hot side.' },
  // Style medals
  ...ACH_STYLES.map(s => ({ id: s.id, cat: 'style', icon: s.icon, name: s.name, desc: `Win a run with a ${s.style} deck: ${s.tag} cards outnumber every other style.` })),
];

function loadAchievements() {
  try { return JSON.parse(localStorage.getItem(ACH_KEY) || '{}') || {}; } catch (e) { return {}; }
}
function hasAch(id) { return !!loadAchievements()[id]; }

// Playtest mode (every card owned) doesn't earn achievements
function achAllowed() { return !(typeof loadCollection === 'function' && loadCollection().unlockAll); }

function unlockAch(id) {
  const a = ACHIEVEMENTS.find(x => x.id === id);
  if (!a || !achAllowed()) return false;
  const got = loadAchievements();
  if (got[id]) return false;
  got[id] = Date.now();
  try { localStorage.setItem(ACH_KEY, JSON.stringify(got)); } catch (e) {}
  achToast(a);
  const r = typeof COSMETICS !== 'undefined' && COSMETICS.find(c => c.ach === id);
  if (r) achToastReward(r);
  return true;
}

// ── Pop-up when you earn one ──
let achQueue = [], achShowing = false;
// The toast for an achievement also names its cosmetic reward
function achToastReward(r) {
  const kind = { theme: 'board theme', frame: 'card frame', title: 'title' }[r.kind];
  const last = achQueue[achQueue.length - 1];
  if (last) last.reward = `the ${r.name} ${kind}`;
}
function achToast(a) {
  if (typeof document === 'undefined') return;
  achQueue.push({ ...a });
  if (!achShowing) { achShowing = true; setTimeout(achNextToast, 0); }
}
function achNextToast() {
  const a = achQueue.shift();
  if (!a) { achShowing = false; return; }
  achShowing = true;
  let el = document.getElementById('ach-toast');
  if (!el) { el = document.createElement('div'); el.id = 'ach-toast'; document.body.appendChild(el); }
  el.innerHTML = `<span class="ach-toast-icon">${a.icon}</span><span><span class="ach-toast-kicker">🏆 ACHIEVEMENT</span><br><b>${a.name}</b><br><span class="ach-toast-desc">${a.desc}</span>${a.reward ? `<br><span class="ach-toast-reward">🍾 Unlocked ${a.reward}. Wear it in the Cellar.</span>` : ''}</span>`;
  el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
  setTimeout(() => { el.classList.remove('show'); setTimeout(achNextToast, 350); }, 3200);
}

// ── Hooks ──

// Snapshot before a card of yours resolves, so the after-play check can see what changed
function achBeforePlay() {
  const burn = Math.min(0, ...LANES.flatMap(l => state.field[l].p.filter(c => c.id === 'acidburn').map(c => c.points)));
  return { lager: lagering('p'), burn, stuck: isMashStuck('p') };
}
function achAfterPlay(c, lane, before) {
  if (!before) return;
  if (before.lager >= 5 && isCrisp(c) && lagering('p') === 0) unlockAch('patience');
  const burnNow = LANES.some(l => state.field[l].p.some(x => x.id === 'acidburn'));
  if (before.burn <= -20 && !burnNow) unlockAch('clean_bill');
  if (c.id === 'ricehulls' && before.stuck && !isMashStuck('p')) unlockAch('rice_rescue');
  if (c.id === 'biscuit' && c.points >= 30) unlockAch('biscuit_tin');
}

function achAcidGiven(n) {
  state._acidGiven = (state._acidGiven || 0) + n;
  if (state._acidGiven >= 20) unlockAch('pucker');
}

// Called once per round, after the scores are final
function achRoundEnd(ps, es) {
  achRoundTags();
  if (ps <= es) return;
  const roast = getRoast('p'), limit = getRoastThreshold('p');
  if (limit > 0 && roast === limit && !isBurnt('p')) unlockAch('edge');
  if (!getLaneCards('hot', 'p').some(c => c.cat !== 'token')) unlockAch('no_kettle');
}
// Full Menu counts even in a round you lose
function achRoundTags() { if (typeof boardTagCount === 'function' && boardTagCount('p') >= FULL_MENU_TAGS) unlockAch('full_menu'); }

function achBattleWon() { if (state && state._brettSpread) unlockAch('return_sender'); }

function achLabUsed(service) {
  const s = runStats();
  s.lab = s.lab || [];
  if (!s.lab.includes(service)) s.lab.push(service);
}

function achDeckStyle(deck) {
  const cnt = {};
  deck.forEach(c => (c.tags || []).forEach(t => cnt[t] = (cnt[t] || 0) + 1));
  let best = null;
  ACH_STYLES.forEach(s => { if ((cnt[s.tag] || 0) >= 3 && (!best || cnt[s.tag] > (cnt[best.tag] || 0))) best = s; });
  return best;
}

function achRunEnd(won, profile, level) {
  if (!won) return;
  unlockAch('first_pour');
  if (BREWERIES.every(b => (profile.winsBy[b.id] || 0) > 0)) unlockAch('every_tap');
  if (level >= 5)  unlockAch('brewmaster5');
  if (level >= 10) unlockAch('brewmaster10');
  const deck = draftState.deck || [];
  if (deck.filter(c => c.cat === 'hop').length === 1) unlockAch('single_hop');
  const lab = (runStats().lab || []);
  if (['prop', 'panel', 'rework'].every(x => lab.includes(x))) unlockAch('lab_rat');
  const st = achDeckStyle(deck);
  if (st) unlockAch(st.id);
}

function achCollectionCheck() {
  if (typeof CARD_POOL === 'undefined' || typeof loadCollection !== 'function') return;
  const col = loadCollection();
  if (!col.unlockAll && CARD_POOL.every(c => isOwned(c.id))) unlockAch('full_cellar');
}

// ── The shelf ──
function showAchievements(tab) {
  setScreen('achievements-screen');
  showAchTab(tab || 'trophies');
}
function renderAchievements() {
  const got = loadAchievements();
  const n = ACHIEVEMENTS.filter(a => got[a.id]).length;
  document.getElementById('ach-count').textContent = `${n} / ${ACHIEVEMENTS.length} earned`;
  document.getElementById('ach-playtest').style.display = achAllowed() ? 'none' : 'block';
  document.getElementById('ach-shelf').innerHTML = ACH_CATS.map(cat => {
    const list = ACHIEVEMENTS.filter(a => a.cat === cat.id);
    const have = list.filter(a => got[a.id]).length;
    return `<div class="ach-cat">
      <div class="ach-cat-head"><span>${cat.name}</span><span class="ach-cat-n">${have}/${list.length}</span></div>
      <div class="ach-cat-desc">${cat.desc}</div>
      <div class="ach-row">${list.map(a => {
        const when = got[a.id] ? new Date(got[a.id]).toLocaleDateString() : '';
        return `<div class="ach ${got[a.id] ? 'ach-got' : 'ach-locked'}">
          <div class="ach-icon">${a.icon}</div>
          <div class="ach-name">${a.name}</div>
          <div class="ach-desc">${a.desc}</div>
          <div class="ach-when">${when ? 'Earned ' + when : 'Not yet'}</div>
        </div>`; }).join('')}</div>
    </div>`;
  }).join('');
}

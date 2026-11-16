// difficulty.js — Brewmaster levels (like Ascension in Slay the Spire)
// Climbed separately for each brewery. Winning a run at your highest level unlocks the next.
// Each level keeps every twist below it and adds one more.

const BREWMASTER_MAX = 10;

const BREWMASTER_LEVELS = [
  null,
  { name: 'Tough Crowd',       desc: 'Every rival starts with +5.' },
  { name: 'Pricey Suppliers',  desc: 'Shop prices are 20% higher.' },
  { name: 'Thin Reputation',   desc: 'Start each run with 15 less Reputation.' },
  { name: 'Sharp Rivals',      desc: 'Rivals plan their turns carefully from act 1 on.' },
  { name: 'Strict Judges',     desc: 'Losing a battle costs 50% more Reputation.' },
  { name: 'Busy Circuit',      desc: 'Competition Rules show up twice as often.' },
  { name: 'Rough Brew Days',   desc: 'Brew Day Disaster targets are 20 higher.' },
  { name: 'Headliners',        desc: 'Bosses start with +15.' },
  { name: 'Wild Cellar',       desc: 'A Contamination is shuffled into your deck every battle.' },
  { name: 'Grand Champion',    desc: 'Bosses start with 2 extra cards in hand.' },
];

const BM_RIVAL_BONUS   = 5;
const BM_SHOP_MULT     = 1.2;
const BM_REP_LOSS      = 15;
const BM_LOSS_MULT     = 1.5;
const BM_RULE_MULT     = 2;
const BM_DISASTER_PLUS = 20;
const BM_BOSS_BONUS    = 15;
const BM_BOSS_CARDS    = 2;

// The level of the run in progress (0 = normal)
function bmLevel() {
  return (typeof mapState !== 'undefined' && mapState && mapState.level) || 0;
}
function bm(n) { return bmLevel() >= n; }

// ── Profile: highest level unlocked for each brewery ──

function bmUnlocked(breweryId) {
  const p = loadProfile();
  return Math.min(BREWMASTER_MAX, (p.levels && p.levels[breweryId]) || 0);
}

// Called from recordRun when you win: winning at your top level opens the next one
function bmRecordWin(p, breweryId, level) {
  p.levels = p.levels || {};
  const top = p.levels[breweryId] || 0;
  if (level >= top && top < BREWMASTER_MAX) {
    p.levels[breweryId] = top + 1;
    return top + 1;
  }
  return null;
}

// ── Level picker on the brewery cards ──

const bmPick = {};     // brewery id -> level chosen on the select screen
const bmSeenTop = {};  // brewery id -> highest level when that choice was made

// Defaults to your highest level, and jumps up to a newly unlocked one
function bmChosen(breweryId) {
  const top = bmUnlocked(breweryId);
  if (bmPick[breweryId] === undefined || bmPick[breweryId] > top || top > (bmSeenTop[breweryId] || 0)) bmPick[breweryId] = top;
  bmSeenTop[breweryId] = top;
  return bmPick[breweryId];
}

function bmStep(breweryId, delta, ev) {
  if (ev) ev.stopPropagation();
  const top = bmUnlocked(breweryId);
  bmPick[breweryId] = Math.max(0, Math.min(top, bmChosen(breweryId) + delta));
  renderBreweryChoices();
}

function bmPickerHtml(b) {
  const top = bmUnlocked(b.id);
  if (top === 0) return `<div class="bm-picker bm-none" title="Win a run with this brewery to unlock Brewmaster 1.">BREWMASTER 0 · win a run to unlock harder levels</div>`;
  const lv = bmChosen(b.id);
  const info = lv ? BREWMASTER_LEVELS[lv] : null;
  return `<div class="bm-picker" onclick="event.stopPropagation()">
    <button class="bm-btn" ${lv > 0 ? `onclick="bmStep('${b.id}', -1, event)"` : 'disabled'}>−</button>
    <span class="bm-level">BREWMASTER ${lv}</span>
    <button class="bm-btn" ${lv < top ? `onclick="bmStep('${b.id}', 1, event)"` : 'disabled'}>+</button>
    <div class="bm-desc">${info ? `${info.name}: ${info.desc}${lv > 1 ? ' (plus everything below)' : ''}` : 'Normal difficulty.'} Unlocked up to ${top}.</div>
  </div>`;
}

// Everything active at the current level, for tooltips and the run summary
function bmActiveList(level = bmLevel()) {
  return BREWMASTER_LEVELS.slice(1, level + 1).map((l, i) => `${i + 1}. ${l.name}: ${l.desc}`);
}

function bmBadgeHtml() {
  const lv = bmLevel();
  if (!lv) return '';
  return `<span class="relic-icon bm-badge" title="Brewmaster ${lv}\n${bmActiveList(lv).join('\n')}">🎖 ${lv}</span>`;
}

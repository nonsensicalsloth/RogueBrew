// ═══════════════════════════════════════════ HELPERS
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// ═══════════════════════════════════════════ CALENDAR
function gameDate() {
  let d = (G.day || 1) - 1, mo = START_MONTH, dy = START_DAY, yr = START_YEAR;
  dy += d;
  while (dy > MONTH_DAYS[mo]) { dy -= MONTH_DAYS[mo]; mo++; if (mo > 11) { mo = 0; yr++; } }
  return dy + ' ' + MONTHS[mo] + ' ' + yr;
}

function currentMonth() {
  let d = (G.day || 1) - 1, mo = START_MONTH, dy = START_DAY;
  dy += d;
  while (dy > MONTH_DAYS[mo]) { dy -= MONTH_DAYS[mo]; mo++; if (mo > 11) mo = 0; }
  return mo; // 0-indexed
}

// ═══════════════════════════════════════════ PARTY UTIL
function livingMembers() {
  const out = [];
  if (G.health > 0) out.push({ name: G.playerName, isPlayer: true, health: G.health, maxHealth: G.maxHealth });
  G.companions.forEach(c => { if (c.health > 0) out.push(c); });
  return out;
}

function partySize() { return livingMembers().length; }

function damageRandom(amt) {
  const alive = livingMembers();
  if (!alive.length) return null;
  const v = pick(alive);
  if (v.isPlayer) G.health = Math.max(0, G.health - amt);
  else v.health = Math.max(0, v.health - amt);
  return v;
}

function damageAll(amt) {
  G.health = Math.max(0, G.health - amt);
  G.companions.forEach(c => { if (c.health > 0) c.health = Math.max(0, c.health - amt); });
}

function healAll(amt) {
  G.health = Math.min(G.maxHealth, G.health + amt);
  G.companions.forEach(c => { if (c.health > 0) c.health = Math.min(c.maxHealth, c.health + amt); });
}

function avgHealth() {
  const all = [G.health, ...G.companions.filter(c => c.health > 0).map(c => c.health)];
  if (!all.length) return 0;
  return Math.round(all.reduce((a,b) => a+b, 0) / all.length);
}

function healthLabel() {
  const h = avgHealth();
  if (h >= 85) return 'Good';
  if (h >= 60) return 'Fair';
  if (h >= 35) return 'Poor';
  if (h >  0) return 'Very Poor';
  return 'Dead';
}

// ═══════════════════════════════════════════ BREW
function brewCondition() {
  const p = G.beer;
  if (p >= 85) return { label: 'Pristine',       color: '#5aaa3a' };
  if (p >= 65) return { label: 'Road-Worn',      color: '#9aa030' };
  if (p >= 40) return { label: 'Battle-Scarred', color: '#c08a2a' };
  if (p >= 20) return { label: 'Diminished',     color: '#c04a2a' };
  return        { label: 'The Last Drops',       color: '#8a2a18' };
}

function addNote(n) { if (!G.tastingNotes.includes(n)) G.tastingNotes.push(n); }
function addAch(id, label) { if (!G.achievements.find(a => a.id === id)) G.achievements.push({ id, label }); }

// ═══════════════════════════════════════════ ILLNESS
function infectRandom(illnessId) {
  const alive = livingMembers();
  if (!alive.length) return null;
  const t = pick(alive);
  if (!G.illnesses[t.name]) {
    G.illnesses[t.name] = illnessId;
    return t.name;
  }
  return null;
}

function tickIllnesses() {
  Object.entries(G.illnesses).forEach(([name, id]) => {
    const ill = ILLNESSES.find(i => i.id === id);
    if (!ill) return;
    if (name === G.playerName) {
      G.health = Math.max(0, G.health - ill.dmg);
    } else {
      const c = G.companions.find(c => c.name === name);
      if (c && c.health > 0) c.health = Math.max(0, c.health - ill.dmg);
    }
  });
}

function useAthelas(name) {
  if (G.supplies.athelas < 1) return false;
  if (!G.illnesses[name]) return false;
  G.supplies.athelas--;
  delete G.illnesses[name];
  if (name === G.playerName) G.health = Math.min(G.maxHealth, G.health + 15);
  else {
    const c = G.companions.find(c => c.name === name);
    if (c) c.health = Math.min(c.maxHealth, c.health + 15);
  }
  return true;
}

// ═══════════════════════════════════════════ WEATHER
function rollWeather() {
  const mo = currentMonth();
  const roll = Math.random();
  const winter = (mo >= 10 || mo <= 2);
  if (winter) {
    if (roll < 0.22) G.weather = { type: 'snow',  label: 'Snow',     dmg: 2 };
    else if (roll < 0.42) G.weather = { type: 'cold', label: 'Cold', dmg: 1 };
    else if (roll < 0.58) G.weather = { type: 'rain', label: 'Rain', dmg: 0 };
    else G.weather = { type: 'clear', label: 'Clear', dmg: 0 };
  } else {
    if (roll < 0.10) G.weather = { type: 'storm', label: 'Storm',    dmg: 2 };
    else if (roll < 0.22) G.weather = { type: 'rain', label: 'Rain', dmg: 0 };
    else if (roll < 0.32) G.weather = { type: 'heat', label: 'Hot',  dmg: 1 };
    else G.weather = { type: 'clear', label: 'Clear', dmg: 0 };
  }
}

// ═══════════════════════════════════════════ THE TRAVEL TICK — ONE DAY
// This is the heart of the game. Called once per day of travel.
// Returns an event string if something happened, or null.
function travelDay() {
  G.day += 1;
  G.miles += PACE[G.pace].miles;

  // Eat food
  const perPerson = RATIONS[G.rations].lbs * PACE[G.pace].foodMult;
  const consumed = Math.round(perPerson * partySize());
  G.supplies.food = Math.max(0, G.supplies.food - consumed);

  // Starvation
  if (G.supplies.food === 0) {
    G.starveDays++;
    damageAll(4 + G.starveDays * 2);
  } else {
    G.starveDays = 0;
  }

  // Ration health effect
  const rmod = RATIONS[G.rations].healthMod;
  if (rmod > 0) healAll(rmod);
  else if (rmod < 0) damageAll(-rmod);

  // Pace strain
  if (G.pace === 'grueling') {
    damageAll(1);
    if (Math.random() < 0.05) infectRandom('exhaustion');
  } else if (G.pace === 'strenuous') {
    if (Math.random() < 0.02) infectRandom('exhaustion');
  }

  // Weather
  if (Math.random() < 0.15 || !G.weather) rollWeather();
  if (G.weather && G.weather.dmg) damageAll(G.weather.dmg);

  // Illness tick
  tickIllnesses();

  // Random illness chance
  if (Math.random() < 0.02) {
    const pool = ['fever','dysentery','typhoid','chill','infection'];
    infectRandom(pick(pool));
  }

  // Slow natural recovery when well-fed & not strained
  if (G.supplies.food > 0 && G.pace !== 'grueling' && Object.keys(G.illnesses).length === 0) {
    healAll(2);
  }

  // Death check
  checkDeaths();
}

// Globals read by Game — simple flags, avoid referring to Game here (TDZ)
window._pendingDeath = null;
window._pendingPlayerDeath = false;

function checkDeaths() {
  G.companions.forEach(c => {
    if (c.health <= 0 && c.status !== 'dead') {
      c.status = 'dead';
      if (G.illnesses[c.name]) delete G.illnesses[c.name];
      window._pendingDeath = c.name;
    }
  });
  // Ent draught auto-trigger: if player health below 25 in Mordor and draught
  // hasn't been used yet, drink it. Full party heal.
  if (G.pathFlags.inMordor && G.pathFlags.entDraught && !G.pathFlags.entDraughtUsed
      && G.health > 0 && G.health < 25) {
    G.pathFlags.entDraughtUsed = true;
    G.health = G.maxHealth;
    G.companions.forEach(c => { if (c.health > 0) c.health = c.maxHealth; });
    window._entDraughtFired = true;
  }
  if (G.health <= 0 && !G.gameOver) {
    G.gameOver = true;
    window._pendingPlayerDeath = true;
  }
}

// ═══════════════════════════════════════════ LANDMARK DETECTION
// We aim for G.targetLandmarkName. When G.miles >= target.miles, we arrive.
function landmarkReached() {
  const target = LANDMARKS.find(l => l.name === G.targetLandmarkName);
  if (!target) return null;
  if (G.miles >= target.miles) {
    G.miles = target.miles; // snap
    G.location = target.name;
    return target;
  }
  return null;
}

function nextLandmark() {
  return LANDMARKS.find(l => l.name === G.targetLandmarkName) || null;
}

function milesToNext() {
  const n = nextLandmark();
  return n ? Math.max(0, n.miles - G.miles) : 0;
}

// ═══════════════════════════════════════════ RIVERS
// Roll a fresh depth for a river. Depth fluctuates with a random walk.
// Weather modifies the roll — storms/rain raise depth, heat lowers it.
function rollRiverDepth(riverId, currentDepth) {
  const r = RIVERS[riverId];
  if (!r) return 3;
  let base = currentDepth != null ? currentDepth : r.baseDepth;
  // Random drift toward base depth
  const drift = (r.baseDepth - base) * 0.3;
  // Random perturbation
  const noise = (Math.random() - 0.5) * r.variance;
  // Weather influence
  let weather = 0;
  if (G.weather) {
    if (G.weather.type === 'storm') weather = 1.5;
    else if (G.weather.type === 'rain') weather = 0.7;
    else if (G.weather.type === 'heat') weather = -0.5;
    else if (G.weather.type === 'snow') weather = -0.3;
  }
  let next = base + drift + noise + weather;
  return clamp(Math.round(next * 10) / 10, 1, r.maxDepth);
}

// Risk of fording at a given depth — returns probability of a bad outcome
function fordRisk(depth) {
  // <2 ft: 5%, 3 ft: 15%, 4 ft: 30%, 5 ft: 50%, 6+ ft: 70%+
  if (depth < 2) return 0.05;
  if (depth < 3) return 0.12;
  if (depth < 4) return 0.22;
  if (depth < 5) return 0.38;
  if (depth < 6) return 0.55;
  return 0.75;
}

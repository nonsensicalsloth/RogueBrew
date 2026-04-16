// ═══════════════════════════════════════════ RANDOM TRAVEL EVENTS
// Each event: { id, weight, bad, title, text, apply() }
// apply() mutates state and returns an optional "aftermath" string.

const TRAVEL_EVENTS = [
  {
    id: 'rain', weight: 8, bad: true,
    title: 'Heavy rain',
    text: 'A cold drenching rain slows the party. The road turns to mud.',
    apply() { damageAll(3); G.day += 1; return 'Lost a day.'; }
  },
  {
    id: 'fog', weight: 5, bad: true,
    title: 'Thick fog',
    text: 'A grey fog swallows the road. You navigate half-blind.',
    apply() { G.miles = Math.max(0, G.miles - 8); return 'Lost 8 miles.'; }
  },
  {
    id: 'wolves', weight: 6, bad: true,
    title: 'Wolves',
    text: 'Wolves howl at the edge of camp. They test the fire and are driven off.',
    apply() { const v = damageRandom(6); return (v ? v.name : 'Someone') + ' was bitten.'; }
  },
  {
    id: 'orc_scouts', weight: 5, bad: true,
    title: 'Orc scouts',
    text: 'A small orc patrol spots the party. You scatter them with torch and steel.',
    apply() { damageAll(4); damageRandom(10); return 'Wounds taken.'; }
  },
  {
    id: 'lame_pony', weight: 5, bad: true,
    title: 'A pony goes lame',
    text: 'One of the pack ponies pulls up lame on rocky ground.',
    apply() {
      if (G.supplies.ponies > 0) G.supplies.ponies--;
      const lost = rand(20, 50);
      G.supplies.food = Math.max(0, G.supplies.food - lost);
      return '−1 pony · −' + lost + ' lbs food.';
    }
  },
  {
    id: 'barrel_leak', weight: 5, bad: true,
    title: 'Barrel fitting works loose',
    text: 'A hoop shifts on the keg. Some of the brew is lost before you can stop it.',
    apply() {
      if (G.supplies.parts > 0) {
        G.supplies.parts--;
        G.beer = Math.max(0, G.beer - 4);
        return 'Spare part used. −1 part · −4% brew.';
      }
      G.beer = Math.max(0, G.beer - rand(8, 15));
      return 'No spare parts. Brew lost.';
    }
  },
  {
    id: 'exhaustion', weight: 4, bad: true,
    title: 'A companion is exhausted',
    text: 'Too many days without rest. Someone cannot keep pace.',
    apply() { const n = infectRandom('exhaustion'); return n ? n + ' is exhausted.' : ''; }
  },
  {
    id: 'illness', weight: 5, bad: true,
    title: 'Illness in camp',
    text: 'Someone wakes feverish and weak.',
    apply() {
      const id = pick(['fever','dysentery','chill']);
      const n = infectRandom(id);
      const ill = ILLNESSES.find(i => i.id === id);
      return n ? n + ' has ' + ill.label + '.' : '';
    }
  },
  {
    id: 'wrong_turn', weight: 4, bad: true,
    title: 'Wrong turn',
    text: 'A fork in the road, a wrong guess, hours of backtracking.',
    apply() { G.miles = Math.max(0, G.miles - 15); return 'Lost 15 miles.'; }
  },
  {
    id: 'thief', weight: 3, bad: true,
    title: 'Thieves in the night',
    text: 'In the morning, supplies are missing.',
    apply() {
      const lost = rand(20, 60);
      G.supplies.food = Math.max(0, G.supplies.food - lost);
      const coin = rand(5, 20);
      G.supplies.coin = Math.max(0, G.supplies.coin - coin);
      return '−' + lost + ' lbs food · −' + coin + ' coin.';
    }
  },
  {
    id: 'clear_stream', weight: 8, bad: false,
    title: 'A clear stream',
    text: 'Cold clean water. Everyone drinks deep and refills every skin.',
    apply() { healAll(5); return 'All +5 health.'; }
  },
  {
    id: 'abandoned_camp', weight: 5, bad: false,
    title: 'Abandoned camp',
    text: 'A cold fire and scattered packs. Something useful was left behind.',
    apply() {
      const f = rand(20, 60);
      G.supplies.food += f;
      const c = rand(5, 20);
      G.supplies.coin += c;
      return '+' + f + ' lbs food · +' + c + ' coin.';
    }
  },
  {
    id: 'good_weather', weight: 6, bad: false,
    title: 'Fair weather',
    text: 'Clear skies and a firm road. The ponies step lightly.',
    apply() { G.miles += 10; return '+10 miles.'; }
  },
  {
    id: 'shortcut', weight: 3, bad: false,
    title: 'A local shortcut',
    text: 'An old path, barely visible. It cuts a full day off the road.',
    apply() { G.miles += 18; return '+18 miles.'; }
  },
  {
    id: 'ranger', weight: 3, bad: false,
    title: 'Ranger waymark',
    text: 'Three cuts on a roadside stone — a ranger cache nearby.',
    apply() {
      G.supplies.food += rand(15, 35);
      return '+food found.';
    }
  },
  {
    id: 'eagle', weight: 2, bad: false,
    title: 'A great eagle overhead',
    text: 'A vast shadow crosses the sun. The party takes heart.',
    apply() { healAll(3); addNote('a hint of altitude and open sky'); return 'All +3 health.'; }
  },
  {
    id: 'wild_berries', weight: 6, bad: false,
    title: 'Wild berries',
    text: 'A hillside thick with brambles and ripe fruit.',
    apply() { const f = rand(10, 25); G.supplies.food += f; return '+' + f + ' lbs food.'; }
  },
];

function pickTravelEvent() {
  const total = TRAVEL_EVENTS.reduce((s,e) => s + e.weight, 0);
  let r = Math.random() * total;
  for (const e of TRAVEL_EVENTS) { r -= e.weight; if (r <= 0) return e; }
  return TRAVEL_EVENTS[0];
}

// Chance per day of a random event firing
function rollEvent() {
  if (Math.random() < 0.22) return pickTravelEvent();
  return null;
}

// ═══════════════════════════════════════════ HUNTING
// OT-style: returns lbs of meat found
function doHunt() {
  const roll = Math.random();
  let lbs;
  if      (roll < 0.15) lbs = 0;
  else if (roll < 0.45) lbs = rand(20, 50);
  else if (roll < 0.80) lbs = rand(50, 120);
  else                  lbs = rand(120, 200);
  // Hop farmer bonus
  if (G.companions.some(c => c.rk === 'hop_farmer' && c.health > 0)) lbs = Math.round(lbs * 1.3);
  // Cap carry capacity
  const cap = 100 + G.supplies.ponies * 50;
  if (lbs > cap) lbs = cap;
  G.supplies.food += lbs;
  G.day += 1;
  return lbs;
}

// ═══════════════════════════════════════════ RIVER CROSSING
// Choices: ford, caulk-and-float, ferry (if available), wait
function riverFord(river) {
  // Risk rises sharply with depth
  const risk = Math.min(0.9, river.depth * 0.12);
  if (Math.random() < risk) {
    const lostFood = rand(30, 100);
    G.supplies.food = Math.max(0, G.supplies.food - lostFood);
    G.beer = Math.max(0, G.beer - rand(4, 12));
    if (Math.random() < 0.35) damageRandom(15);
    return { ok: false, msg: 'The ford went badly. −' + lostFood + ' lbs food, brew shaken, a companion hurt.' };
  }
  return { ok: true, msg: 'Forded the river without trouble.' };
}

function riverFloat(river) {
  const risk = Math.min(0.7, 0.15 + river.depth * 0.04);
  if (Math.random() < risk) {
    const lostFood = rand(50, 150);
    G.supplies.food = Math.max(0, G.supplies.food - lostFood);
    G.beer = Math.max(0, G.beer - rand(10, 25));
    return { ok: false, msg: 'The wagon rolled. −' + lostFood + ' lbs food, brew spilling, packs soaked.' };
  }
  return { ok: true, msg: 'Caulked the wagon and floated it across. Safe.' };
}

function riverFerry(river) {
  const cost = Math.round(river.width / 10);
  if (G.supplies.coin < cost) return { ok: false, msg: 'Not enough coin for the ferry (need ' + cost + ').' };
  G.supplies.coin -= cost;
  G.day += 1;
  return { ok: true, msg: 'Took the ferry. −' + cost + ' coin.' };
}

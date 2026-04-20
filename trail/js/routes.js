// ═══════════════════════════════════════════ ROUTE / FORK SYSTEM
//
// Each FORK entry is keyed by the landmark the player is leaving.
// fork.routes can be an array OR a function(G) returning an array — use a
// function when the available routes depend on arrival point or pathFlags.
//
// Each route:
//   label, note       — display
//   to                — destination landmark name
//   arrivalPoint      — string set on G.arrivalPoint when the leg completes
//                       (lets the next fork branch on HOW we arrived)
//   requires(G)       — optional gate
//   apply(G)          — called the instant the player picks the route
//                       (immediate costs: coin, day delays for detours, flags)
//   modifier          — { eventRate, goodBias, flavor, dayExtra }
//   dailyRoll(G)      — called each day of travel on this leg. Returns one of:
//                         null                           — nothing today
//                         { title, text, aftermath, bad, sideEffect? }
//                         { decision: {title, body, choices} }  — pause & ask
//
// The tick loop fires dailyRoll BEFORE rolling random travel events, so
// route-specific encounters take priority over generic ones.
// ═══════════════════════════════════════════

// ── SPY / AMBUSH / BANDIT SYSTEM ─────────────────────────────────────
// Road dangers scale by region. rollRoadDangers() accepts a region key;
// each region defines per-day base rates for spies, ambushes, and bandits.
// Brigand encounters are passive (they steal some food and flip spyFlag),
// distinct from ambushes (which are full fight/run/bribe decisions).
//
// Escalation:
//   After 2+ ambushes: +3% to each rate in the current region.
//   After 3+ ambushes: Gap of Rohan leg gets its own harassment.
//
// Called from road-flavored dailyRoll: rollRoadDangers(G, 'shire') etc.

const ROAD_REGION_RATES = {
  // region: { spy: per-day, ambush: per-day (only when tracked), bandit: per-day }
  shire:      { spy: 0.03, ambush: 0.06, bandit: 0.00 }, // no brigands in the Shire
  eriador:    { spy: 0.05, ambush: 0.09, bandit: 0.05 },
  wilderness: { spy: 0.07, ambush: 0.12, bandit: 0.08 },
};

function roadRates(region) {
  const base = ROAD_REGION_RATES[region] || ROAD_REGION_RATES.eriador;
  const esc  = G.totalAmbushes >= 2 ? 0.03 : 0;
  return {
    spy:     base.spy     + esc,
    ambush:  base.ambush  + esc,
    bandit:  base.bandit  + esc,
  };
}

function rollRoadDangers(G, region) {
  const rates = roadRates(region || 'eriador');

  // Ambush (if being tracked) — highest priority
  if (G.spyFlag && Math.random() < rates.ambush) {
    return buildAmbushDecision();
  }

  // Brigands — decision encounter. Smaller than a full ambush.
  // Sets spyFlag (they're working with spies). Player gets fight/run/bribe.
  if (rates.bandit > 0 && Math.random() < rates.bandit) {
    const hidden = G.totalAmbushes < 2;
    return {
      decision: {
        title: 'Brigands on the road',
        body:  'A small band of men step out and demand a toll. They are armed but few.' +
               (hidden ? '' : ' They do not act like common thieves — more like scouts.'),
        choices: [
          {
            label: 'Fight them off',
            note:  'Small risk of injury',
            handler: () => {
              G.spyFlag = true;
              if (Math.random() < 0.35) {
                const v = damageRandom(rand(5, 12));
                UI.log('Drove the brigands off — ' + (v ? v.name : 'someone') + ' took a nick.', 'bad');
              } else {
                UI.log('Drove them off easily. They scattered.', 'good');
              }
            },
          },
          {
            label: 'Hand over some food',
            note:  'Lose food · no fight',
            handler: () => {
              G.spyFlag = true;
              const lost = rand(15, 40);
              G.supplies.food = Math.max(0, G.supplies.food - lost);
              UI.log('Gave them what they asked. −' + lost + ' lbs food.', 'bad');
            },
          },
          {
            label: 'Bribe them with coin',
            note:  '15 coin · they leave happy',
            disabled: G.supplies.coin < 15,
            disabledNote: 'Not enough coin (need 15)',
            handler: () => {
              G.spyFlag = true;
              G.supplies.coin -= 15;
              UI.log('Tossed them a small purse. They touched their caps and left.', 'dim');
            },
          },
        ],
      },
    };
  }

  // Spy sighting
  if (Math.random() < rates.spy) {
    const wasAlreadyTracked = G.spyFlag;
    G.spyFlag = true;
    const hidden = G.totalAmbushes < 2;
    if (wasAlreadyTracked) return null; // don't spam spy events
    if (hidden) {
      return { title: 'Watched from the hedgerow', text: 'A figure slipped back into the trees the moment you looked up. Probably nothing.', aftermath: '', bad: false };
    }
    return { title: 'Spies on the road', text: 'A figure watches from the ridge and vanishes. You are being followed.', aftermath: 'You feel tracked.', bad: true };
  }
  return null;
}

function buildAmbushDecision() {
  return {
    decision: {
      title: 'Ambush on the road',
      body:  'Men step out of the trees with drawn blades. Too many to push through without thinking.',
      choices: [
        {
          label: 'Fight them off',
          note:  'Risk of injury',
          handler: () => {
            G.spyFlag = false;
            G.totalAmbushes++;
            if (Math.random() < 0.6) {
              const v = damageRandom(rand(8, 16));
              UI.log('Drove them off — but ' + (v ? v.name : 'someone') + ' took a blow.', 'bad');
            } else {
              UI.log('Drove them off cleanly. No serious wounds.', 'good');
            }
          },
        },
        {
          label: 'Run — leave some supplies',
          note:  'Lose food · avoid injury',
          handler: () => {
            G.spyFlag = false;
            G.totalAmbushes++;
            const lost = rand(30, 70);
            G.supplies.food = Math.max(0, G.supplies.food - lost);
            UI.log('Bolted into the trees. Dropped −' + lost + ' lbs food behind you.', 'bad');
          },
        },
        {
          label: 'Bribe them off',
          note:  'Lose coin · avoid everything else',
          disabled: G.supplies.coin < 30,
          disabledNote: 'Not enough coin (need 30)',
          handler: () => {
            G.spyFlag = false;
            G.totalAmbushes++;
            G.supplies.coin -= 30;
            UI.log('Threw them a purse. They waved you through, watching.', 'dim');
          },
        },
      ],
    },
  };
}

// ── BARROW DOWNS event ──────────────────────────────────────────────
// Fires when the player gets so lost in the Old Forest that they wander
// into the Barrow Downs. Only reachable if the player has NOT met Tom
// Bombadil — meeting Tom in the forest causes him to lead the party
// safely out, bypassing the Downs entirely.
//
// Outcomes here:
//   - 25% Tom appears at the Downs: small damage from wights, swords gained.
//   - 75% Escape on own:           damage + supply loss, no swords.
function barrowDownsEvent(G) {
  if (Math.random() < 0.25) {
    G.pathFlags.dunedainSwords = true;
    const dmg = rand(4, 8);
    damageAll(dmg);
    return {
      title: 'Barrow Wights — and a song',
      text:  'Stone hands closing around you. Then Tom Bombadil arrived, singing them back into the earth. The wights had come close enough to wound. Tom pressed Dúnedain blades into your hands.',
      aftermath: 'All −' + dmg + ' health · Dúnedain swords gained.',
      bad:   true,
    };
  }
  // Escape on own
  const lost = rand(30, 60);
  G.supplies.food = Math.max(0, G.supplies.food - lost);
  damageAll(rand(8, 14));
  if (Math.random() < 0.4) damageRandom(rand(8, 16));
  return {
    title: 'Barrow Wights',
    text:  'You ran from the mist with packs half-open and shadows behind you. Some of you were touched before the daylight took the wights back.',
    aftermath: '−' + lost + ' lbs food · injuries.',
    bad:   true,
  };
}

// ── NAZGUL AT WEATHERTOP ────────────────────────────────────────────
// Returns a decision object for the Black Riders encounter.
// Choices depend on which flags the player has earned:
//   pathFlags.dunedainSwords → boosts Stand outcome
//   pathFlags.metStrider     → reduces Stand damage
//   BOTH                     → adds 'Drive them off' clean-win option
function buildNazgulEncounter() {
  const haveSwords  = !!G.pathFlags.dunedainSwords;
  const haveStrider = !!G.pathFlags.metStrider;
  const haveBoth    = haveSwords && haveStrider;

  const choices = [];

  // Drive them off (only if both flags) — clean win
  if (haveBoth) {
    choices.push({
      label: 'Drive them off',
      note:  'Strider knows the Riders. The Dúnedain blades bite. Clean victory.',
      handler: () => {
        G.spyFlag = false;
        G.pathFlags.weathertopSurvived = true;
        addNote('forged in firelight at Amon Sûl');
        UI.log('Strider drove them with fire while the Dúnedain blades found their cloaks. The Riders fled into the night.', 'good');
      },
    });
  }

  // Stand and fight
  choices.push({
    label: 'Stand and fight with fire',
    note:  haveStrider ? 'Strider lessens the blow' : haveSwords ? 'The Dúnedain blades may turn them' : 'Risk of a Morgul wound',
    handler: () => {
      G.spyFlag = false;
      G.pathFlags.weathertopSurvived = true;
      // Rare clean win if you have swords
      if (haveSwords && Math.random() < 0.30) {
        UI.log('The Dúnedain blades caught one of them — they fled into the dark.', 'good');
        addNote('forged in firelight at Amon Sûl');
        return;
      }
      let dmg = rand(15, 25);
      if (haveStrider) dmg = Math.max(5, dmg - 5);
      const v = damageRandom(dmg);
      if (!haveStrider && Math.random() < 0.5) {
        if (v && !G.illnesses[v.name]) G.illnesses[v.name] = 'infection';
        UI.log('Stood your ground at Amon Sûl. ' + (v ? v.name : 'Someone') + ' was struck by a Morgul blade — the wound burns.', 'bad');
      } else {
        UI.log('Stood your ground at Amon Sûl. ' + (v ? v.name : 'Someone') + ' was wounded.', 'bad');
      }
    },
  });

  // Flee
  choices.push({
    label: 'Flee into the dark',
    note:  '+1 day · all take damage · still tracked',
    handler: () => {
      G.day += 1;
      G.pathFlags.weathertopSurvived = true;
      damageAll(rand(5, 10));
      // Fleeing keeps you tracked — don't clear spyFlag
      UI.log('Fled Weathertop in darkness. The Riders are still out there.', 'bad');
    },
  });

  return {
    decision: {
      title: 'Five Black Riders at Weathertop',
      body:  'In the deep of the night, five dark shapes climb the hill in silence. There is no time to argue.',
      choices: choices,
    },
  };
}

// ── BRUINEN FLEE ────────────────────────────────────────────────────
// When the Nazgûl appear at the Bruinen, the only escape is to flee
// across the ford. Two options: a desperate rush (fast but bad), or
// invoke the river (safer if you have any way to). Per the books, the
// river itself rises against the Riders — but here, that flavor is
// expressed as a steep flee with a single-or-multi-companion penalty.
function buildBruinenFleeDecision() {
  return {
    decision: {
      title: 'Black Riders at the ford',
      body:  'They came down the road behind you. Five of them, hooves slow on the stones. The water is the only way out.',
      choices: [
        {
          label: 'Plunge across the ford',
          note:  'Fast · supplies lost · injuries',
          handler: () => {
            G.spyFlag = false;
            G.pathFlags.weathertopSurvived = true;
            const lost = rand(40, 90);
            G.supplies.food = Math.max(0, G.supplies.food - lost);
            damageAll(rand(6, 12));
            const v = damageRandom(rand(8, 16));
            UI.log('Plunged into the Bruinen. Packs swept downstream. ' + (v ? v.name : 'Someone') + ' was dragged under and barely fished out.', 'bad');
            UI.log('On the far bank, the river itself seemed to rise against the Riders. They were gone.', 'good');
          },
        },
        {
          label: 'Hold the bank, then cross',
          note:  'Slower · companion injury risk · less food lost',
          handler: () => {
            G.spyFlag = false;
            G.pathFlags.weathertopSurvived = true;
            const lost = rand(15, 35);
            G.supplies.food = Math.max(0, G.supplies.food - lost);
            const v = damageRandom(rand(15, 25));
            UI.log('Held the near bank long enough to get the keg across. ' + (v ? v.name : 'Someone') + ' was struck while covering the rear.', 'bad');
            // Possible Morgul wound if you don't have Strider
            if (!G.pathFlags.metStrider && Math.random() < 0.4) {
              if (v && !G.illnesses[v.name]) G.illnesses[v.name] = 'infection';
              UI.log('A Morgul blade reached ' + (v ? v.name : 'someone') + ' before the river took the Riders.', 'bad');
            }
          },
        },
      ],
    },
  };
}

// ── BLIZZARD on Caradhras ───────────────────────────────────────────
// Decision: wait it out (1 day, no damage) or push through (some damage,
// possible frostbite, no day cost).
function buildBlizzardDecision() {
  return {
    decision: {
      title: 'Blizzard on the Redhorn',
      body:  'Snow comes down sideways. The wind is so loud you cannot hear the person beside you. The road is gone under drifts.',
      choices: [
        {
          label: 'Wait it out',
          note:  '+1 day · safe',
          handler: () => {
            G.day += 1;
            UI.log('Hunkered behind a rock until the blizzard passed. Lost a day.', 'dim');
          },
        },
        {
          label: 'Push through',
          note:  'No delay · damage · possible frostbite',
          handler: () => {
            damageAll(rand(5, 10));
            if (Math.random() < 0.5) {
              const alive = livingMembers();
              const unhealthy = alive.filter(p => !G.illnesses[p.name]);
              if (unhealthy.length > 0) {
                const t = pick(unhealthy);
                G.illnesses[t.name] = 'frostbite';
                UI.log('Pushed through the storm. ' + t.name + ' has frostbite.', 'bad');
                return;
              }
            }
            UI.log('Pushed through the storm. Everyone hurt by the cold.', 'bad');
          },
        },
      ],
    },
  };
}

// ── MORIA tick — daily roll inside the mines ────────────────────────
// Falling rocks (low chance, like snake bites in OT Deluxe).
// Lost in the dark (delays).
// Orc attacks (rare). Each attack increases Balrog wake chance.
// Balrog (low chance, increased by orc attacks AND rests).
function rollMoriaTick(G) {
  // Balrog chance — escalated by orcs killed and rests taken
  const orcs = G.pathFlags._moriaOrcAttacks || 0;
  const rests = G.pathFlags._moriaRests || 0;
  const balrogChance = 0.005 + orcs * 0.02 + rests * 0.03;
  if (Math.random() < balrogChance) {
    return buildBalrogEncounter();
  }

  // Orc attacks — base 4%, +2% per rest
  const orcChance = 0.04 + rests * 0.02;
  if (Math.random() < orcChance) {
    G.pathFlags._moriaOrcAttacks = orcs + 1;
    const v = damageRandom(rand(10, 20));
    damageAll(rand(3, 8));
    return {
      title: 'Orcs in the dark',
      text:  'Goblin scouts. Drove them off with torches and steel. ' + (v ? v.name : 'Someone') + ' was wounded.',
      aftermath: 'All injured. The deep is awake now.',
      bad:   true,
    };
  }

  // Falling rocks — 4% (snake-bite analog)
  if (Math.random() < 0.04) {
    const v = damageRandom(rand(8, 16));
    return {
      title: 'Falling rock',
      text:  'A piece of the ceiling came loose without warning. ' + (v ? v.name : 'Someone') + ' was struck.',
      aftermath: 'Companion injured.',
      bad:   true,
    };
  }

  // Lost in the dark — 5% (just a delay)
  if (Math.random() < 0.05) {
    G.day += 1;
    return {
      title: 'Lost in the dark',
      text:  'Took a wrong tunnel. Backtracked through galleries that all looked the same.',
      aftermath: '+1 day.',
      bad:   true,
    };
  }

  // Old dwarf hoard — 2% (rare positive)
  if (Math.random() < 0.02) {
    const c = rand(20, 50);
    G.supplies.coin += c;
    return {
      title: 'A forgotten cache',
      text:  'A small dwarf-cache, untouched since Khazad-dûm fell. Old coin, still good.',
      aftermath: '+' + c + ' coin.',
      bad:   false,
    };
  }

  return null;
}

// ── BALROG ─────────────────────────────────────────────────────────
// The worst possible Moria outcome. A companion dies almost certainly.
function buildBalrogEncounter() {
  return {
    decision: {
      title: 'Drums in the deep',
      body:  'Something vast comes up out of the darkness. Wreathed in shadow and fire. You have woken the Balrog.',
      choices: [
        {
          label: 'Run for the bridge',
          note:  'Someone will hold it · grim cost',
          handler: () => {
            // One companion dies holding the bridge
            const alive = G.companions.filter(c => c.health > 0);
            if (alive.length > 0) {
              const v = pick(alive);
              v.health = 0; v.status = 'dead';
              window._pendingDeath = v.name;
              UI.log(v.name + ' held the bridge of Khazad-dûm. The bridge broke. They did not return.', 'bad');
            }
            damageAll(rand(15, 25));
            G.spyFlag = false;
            addNote('forged in fire and shadow, never quite the same after');
          },
        },
      ],
    },
  };
}

// ── WATCHER IN THE WATER ────────────────────────────────────────────
// Fires when player rests at the West-gate. Forces them inside the mines.
function buildWatcherEncounter() {
  return {
    decision: {
      title: 'The Watcher in the Water',
      body:  'Long pale arms came out of the black pool. The doors swung open. The decision is made for you.',
      choices: [
        {
          label: 'Into the mines, fast',
          note:  'Lose supplies · take damage · enter Moria',
          handler: () => {
            const lost = rand(40, 80);
            G.supplies.food = Math.max(0, G.supplies.food - lost);
            damageAll(rand(8, 14));
            const v = damageRandom(rand(10, 20));
            UI.log('Bolted through the doors as the Watcher dragged a pony under. −' + lost + ' lbs food. ' + (v ? v.name : 'Someone') + ' badly wounded.', 'bad');
            if (G.supplies.ponies > 0) G.supplies.ponies--;
            G.pathFlags._moriaOrcAttacks = 0;
            G.pathFlags._moriaRests = 0;
            // Force the player into the mines
            G.location = 'West-gate of Moria';
            G.targetLandmarkName = 'Khazad-dûm';
            G.miles = 770; // start of Moria leg
          },
        },
      ],
    },
  };
}

// ── URUK-HAI AMBUSH at the Fords of Isen ────────────────────────────
// Fires when sarumanCounter >= 3 at the crossing. Worse than a normal
// ambush — Uruk-hai are professional soldiers.
function buildIsenAmbushDecision() {
  return {
    decision: {
      title: 'Uruk-hai at the Fords',
      body:  'Black-armored troops in close ranks. Not Dunlendings — these are Saruman\'s own. They are not here to rob you. They are here to take you.',
      choices: [
        {
          label: 'Fight through',
          note:  'Hard fight · injuries certain · clear the road after',
          handler: () => {
            G.sarumanCounter = 0;
            G.spyFlag = false;
            damageAll(rand(12, 20));
            const v1 = damageRandom(rand(15, 25));
            if (v1) UI.log(v1.name + ' was wounded breaking through the Uruk line.', 'bad');
            // 30% chance one falls
            if (Math.random() < 0.3) {
              const stillAlive = G.companions.filter(c => c.health > 0);
              if (stillAlive.length > 0) {
                const v = pick(stillAlive);
                v.health = 0; v.status = 'dead';
                window._pendingDeath = v.name;
              }
            }
            UI.log('Cut through them and across the fords. Most of you made it.', 'bad');
          },
        },
        {
          label: 'Scatter and try to slip past',
          note:  'Lose supplies and the keg shaken · less chance of death',
          handler: () => {
            G.sarumanCounter = 0;
            G.spyFlag = false;
            const lost = rand(60, 120);
            G.supplies.food = Math.max(0, G.supplies.food - lost);
            G.beer = Math.max(0, G.beer - rand(8, 18));
            damageAll(rand(8, 14));
            UI.log('Scattered through the reeds. Re-grouped on the far bank with less of everything. −' + lost + ' lbs food, brew shaken.', 'bad');
          },
        },
      ],
    },
  };
}

// ── ANDUIN ORC AMBUSH ───────────────────────────────────────────────
// Orcs shoot arrows from the eastern bank as you drift past. Two options:
// paddle hard (lose food/water-damage to brew, no injury) or shoot back
// (someone gets injured, no supply loss).
function buildAnduinOrcAmbush() {
  return {
    decision: {
      title: 'Orcs on the eastern bank',
      body:  'Arrows from the willows on the east bank. The current is fast — you have moments to choose.',
      choices: [
        {
          label: 'Paddle hard, drift with the current',
          note:  'No injury · supplies and brew shaken',
          handler: () => {
            const lost = rand(20, 50);
            G.supplies.food = Math.max(0, G.supplies.food - lost);
            G.beer = Math.max(0, G.beer - rand(3, 8));
            UI.log('Drove the boats out into the channel. −' + lost + ' lbs food, brew shaken.', 'bad');
          },
        },
        {
          label: 'Shoot back from the boats',
          note:  'No supplies lost · companion injury',
          handler: () => {
            const v = damageRandom(rand(12, 22));
            UI.log('Returned fire. Drove them off — but ' + (v ? v.name : 'someone') + ' was hit.', 'bad');
            // 25% chance they get a Morgul-equivalent infection
            if (v && Math.random() < 0.25 && !G.illnesses[v.name]) {
              G.illnesses[v.name] = 'infection';
              UI.log('The arrow was poisoned. ' + v.name + ' has Wound Infection.', 'bad');
            }
          },
        },
      ],
    },
  };
}

// ── PONY BITE / LAMENESS ────────────────────────────────────────────
// A pony being lost is a two-step: a snake bite (warning), then going
// lame if not rested within ~3 days. Resting clears the bite.
// Call rollPonyBite(G) on grass / trail / hill legs.
// Call rollPonyLame(G) on those same legs.
function rollPonyBite(G) {
  if (G.pathFlags.ponyBittenAt != null) return null; // already one in progress
  if (G.supplies.ponies < 1) return null;
  if (Math.random() < 0.03) {
    G.pathFlags.ponyBittenAt = G.day;
    return {
      title: 'A pony was bitten by a snake',
      text:  'One of the pack ponies took a snake bite to the foreleg. The wound is swelling. If you do not rest her, she will go lame.',
      aftermath: 'Rest the party in the next few days to save the pony.',
      bad:   true,
    };
  }
  return null;
}

function rollPonyLame(G) {
  if (G.pathFlags.ponyBittenAt == null) return null;
  const elapsed = G.day - G.pathFlags.ponyBittenAt;
  if (elapsed < 2) return null; // grace period
  if (G.supplies.ponies < 1) {
    G.pathFlags.ponyBittenAt = null;
    return null;
  }
  // Per-day chance grows with neglect: day 2 = 15%, day 3 = 25%, day 4+ = 40%
  const chance = elapsed === 2 ? 0.15 : elapsed === 3 ? 0.25 : 0.40;
  if (Math.random() < chance) {
    G.supplies.ponies--;
    const lost = rand(15, 35);
    G.supplies.food = Math.max(0, G.supplies.food - lost);
    G.pathFlags.ponyBittenAt = null;
    return {
      title: 'The bitten pony went lame',
      text:  'The wound never had a chance to heal. She could not go on. Some of her load had to be left behind.',
      aftermath: '−1 pony · −' + lost + ' lbs food.',
      bad:   true,
    };
  }
  return null;
}

const FORKS = {

  // ── Leaving The Shire ─────────────────────────────────────────────
  //
  // East Road:
  //   Each day a 25% chance of being pulled into one of 4 pubs (at most one
  //   per day). Pub = +1 day, −5 coin, +5 health, tasting note on first.
  //   Road also rolls spy chance (handled by rollRoadDangers).
  //   Shire bandit rate: 10% per day (on top of regular events).
  //   Arrives at: Brandywine Bridge.
  //
  // Cross-country:
  //   Daily 12% chance of getting lost (+ half-day delay).
  //   Daily 8% chance of a farmer chasing party off (−small food).
  //   Arrives at: Bucklebury Ferry landing.
  //
  'The Shire': {
    title: 'Leaving the Shire',
    body:  'The East Road runs through comfortable hobbit country to the Brandywine Bridge. Or cut across fields and hills toward the Bucklebury Ferry.',
    routes: [
      {
        label: 'Take the East Road',
        note:  'Safe · possible pub delays · arrives at the Bridge',
        to:    'Brandywine River',
        arrivalPoint: 'bridge',
        modifier: { eventRate: 0.18, goodBias: 0.6, flavor: 'road' },
        dailyRoll: (G) => {
          // Road dangers (spy/ambush) first — shire rates, no brigands
          const road = rollRoadDangers(G, 'shire');
          if (road) return road;
          // Pub stop — 14% chance per day to be pulled into one available pub
          const pubs = ['The Green Dragon', 'The Ivy Bush', 'The Golden Perch', 'The Floating Log'];
          G.pathFlags._pubsVisited = G.pathFlags._pubsVisited || [];
          const available = pubs.filter(p => !G.pathFlags._pubsVisited.includes(p));
          if (available.length > 0 && Math.random() < 0.14) {
            const pub = pick(available);
            G.pathFlags._pubsVisited.push(pub);
            G.day += 1;
            G.supplies.coin = Math.max(0, G.supplies.coin - 5);
            healAll(5);
            if (G.pathFlags._pubsVisited.length === 1) {
              addNote('unhurried, followed familiar roads');
            }
            return {
              title: 'Pulled into ' + pub,
              text:  'Old friends. Fresh ale. The kind of evening that lasts into the next morning.',
              aftermath: '+1 day · −5 coin · party +5 health.',
              bad:   false,
            };
          }
          return null;
        },
      },
      {
        label: 'Cut cross-country',
        note:  'Faster · risk of delays · arrives at the Ferry',
        to:    'Brandywine River',
        arrivalPoint: 'ferry_landing',
        modifier: { eventRate: 0.15, goodBias: 0.6, flavor: 'wild' },
        dailyRoll: (G) => {
          // Getting lost — 12%
          if (Math.random() < 0.12) {
            G.day += 1;
            return {
              title: 'Lost in the lanes',
              text:  'Paths wound back on themselves through hedge and hollow. Half a day retracing steps.',
              aftermath: '+1 day.',
              bad:   true,
            };
          }
          // Angry farmer — 8%
          if (Math.random() < 0.08) {
            const lost = rand(10, 25);
            G.supplies.food = Math.max(0, G.supplies.food - lost);
            return {
              title: 'Farmer Maggot\'s dogs',
              text:  'Crossed a barley field without asking. A red-faced farmer and three dogs saw you off.',
              aftermath: '−' + lost + ' lbs food.',
              bad:   true,
            };
          }
          return null;
        },
      },
    ],
  },

  // ── Leaving Brandywine River ──────────────────────────────────────
  //
  // Options depend on where you arrived:
  //
  // arrivalPoint === 'bridge':
  //   1. Cross the Brandywine Bridge  — free, no delay (you're already there)
  //   2. Ford the river here          — free, risk based on current depth
  //   3. Detour south to the Ferry    — +1 day, then pay 20 coin
  //
  // arrivalPoint === 'ferry_landing':
  //   1. Take the Bucklebury Ferry    — 20 coin, no delay
  //   2. Ford the river here          — free, risk based on current depth
  //   3. Detour north to the Bridge   — +1 day, free crossing
  //
  // If you took the ferry you end up closer to an Old Forest entrance → the
  // next leg to Bree via the Old Forest is shorter (−10 miles). Set
  // pathFlags.ferryCrossing = true to mark this.
  //
  'Brandywine River': {
    title: 'Crossing the Brandywine',
    body:  (G) => {
      const arr = G.arrivalPoint === 'bridge' ? 'the Brandywine Bridge' : 'the Bucklebury Ferry landing';
      const depth = G.pathFlags.brandywineDepth || 4;
      return 'You stand at ' + arr + '. The river runs deep and wide — currently ' + depth + ' ft at the ford.';
    },
    routes: (G) => {
      const depth = G.pathFlags.brandywineDepth || 4;
      const arrivedAtBridge = G.arrivalPoint === 'bridge';

      const fordRoute = {
        label: 'Ford the river here',
        note:  depth + ' ft deep · ' + Math.round(fordRisk(depth) * 100) + '% chance of trouble',
        _chainTo: 'Brandywine East Bank',
        apply: (G) => {
          const risk = fordRisk(depth);
          if (Math.random() < risk) {
            const lost = rand(20, 60);
            G.supplies.food = Math.max(0, G.supplies.food - lost);
            if (Math.random() < 0.4) {
              G.beer = Math.max(0, G.beer - rand(4, 10));
              UI.log('Forded the Brandywine — the wagon rolled in the current. −' + lost + ' lbs food, brew shaken.', 'bad');
            } else {
              UI.log('Forded the Brandywine — hard crossing. −' + lost + ' lbs food.', 'bad');
            }
          } else {
            UI.log('Forded the Brandywine — cold but uneventful.', 'good');
          }
          G.pathFlags.brandywineCrossingPoint = 'ford';
        },
      };

      const waitRoute = {
        label: 'Wait a day for the water to drop',
        note:  'Do not cross yet — re-roll depth',
        to:    null,
        _wait: true,
      };

      if (arrivedAtBridge) {
        return [
          {
            label: 'Cross the Brandywine Bridge',
            note:  'Free · already at the bridge',
            _chainTo: 'Brandywine East Bank',
            apply: (G) => {
              UI.log('Crossed the Brandywine Bridge. Solid stone underfoot.', 'good');
              G.pathFlags.brandywineCrossingPoint = 'bridge';
            },
          },
          fordRoute,
          {
            label: 'Detour south to the Ferry',
            note:  '+1 day · 20 coin · sets up the southern approach',
            _chainTo: 'Brandywine East Bank',
            requires: (G) => G.supplies.coin >= 20,
            requiresNote: 'Not enough coin (need 20)',
            apply: (G) => {
              G.day += 1;
              G.supplies.coin -= 20;
              G.pathFlags.brandywineCrossingPoint = 'ferry';
              UI.log('Walked south to the Ferry. −20 coin.', 'dim');
            },
          },
          {
            label: 'Detour south — pour the ferryman a drink',
            note:  '+1 day · −5% brew · free crossing',
            _chainTo: 'Brandywine East Bank',
            requires: (G) => G.beer >= 5,
            requiresNote: 'Not enough brew (need 5%)',
            apply: (G) => {
              G.day += 1;
              G.beer -= 5;
              G.brewSharedWith.push('the Bucklebury ferryman');
              G.pathFlags.brandywineCrossingPoint = 'ferry';
              addNote('poured at the riverbank, foam on the current');
              UI.log('Walked south, poured the ferryman a cup. −5% brew.', 'good');
            },
          },
          waitRoute,
        ];
      }

      // Arrived at ferry landing
      return [
        {
          label: 'Take the Bucklebury Ferry',
          note:  '20 coin · safe crossing',
          _chainTo: 'Brandywine East Bank',
          requires: (G) => G.supplies.coin >= 20,
          requiresNote: 'Not enough coin (need 20)',
          apply: (G) => {
            G.supplies.coin -= 20;
            G.pathFlags.brandywineCrossingPoint = 'ferry';
            UI.log('Took the Bucklebury Ferry. −20 coin.', 'good');
          },
        },
        {
          label: 'Pour the ferryman a drink',
          note:  '−5% brew · free crossing',
          _chainTo: 'Brandywine East Bank',
          requires: (G) => G.beer >= 5,
          requiresNote: 'Not enough brew (need 5%)',
          apply: (G) => {
            G.beer -= 5;
            G.brewSharedWith.push('the Bucklebury ferryman');
            G.pathFlags.brandywineCrossingPoint = 'ferry';
            addNote('poured at the riverbank, foam on the current');
            UI.log('Poured the ferryman a cup. He waved you across with a grin. −5% brew.', 'good');
          },
        },
        fordRoute,
        {
          label: 'Detour north to the Bridge',
          note:  '+1 day · free crossing',
          _chainTo: 'Brandywine East Bank',
          apply: (G) => {
            G.day += 1;
            G.pathFlags.brandywineCrossingPoint = 'bridge';
            UI.log('Walked north to the Brandywine Bridge. A day lost but a safe crossing.', 'dim');
          },
        },
        waitRoute,
      ];
    },
  },

  // ── Leaving Brandywine River → Bree ──────────────────────────────
  //
  // North-then-east road around the Old Forest:
  //   - Came via Bridge: −1 day shorter (you're on the right side already)
  //   - Came via Ferry:  +1 day longer  (must loop further north)
  //   Daily rolls: road dangers (spy/ambush/bandits), snake bite,
  //   trader on road, wagon wheel break / pony loses shoe.
  //
  // Old Forest shortcut:
  //   - Came via Ferry:  −1 day shorter (closer entrance)
  //   - Came via Bridge: +1 day longer  (must backtrack to enter)
  //   Daily rolls:
  //     - 35% chance of getting lost (~70% over a 2-day leg).
  //         On lost: 30% sub-roll → wandered into the Barrow Downs.
  //     - 15% chance of meeting Tom Bombadil → sets metBombadil.
  //     - 10% chance of tree injury.
  //   At Barrow Downs:
  //     - If metBombadil:           Tom rescues, gives Dúnedain swords, no damage.
  //     - Else 25% chance Tom shows: small damage + swords.
  //     - Else escape on own:       damage + supply loss, no swords.
  //
  'Brandywine East Bank': {
    title: 'Path to Bree',
    body: (G) => {
      const camePoint = G.pathFlags.brandywineCrossingPoint;
      const roadDays = camePoint === 'bridge' ? '−1 day' : camePoint === 'ferry' ? '+1 day' : 'normal';
      const forestDays = camePoint === 'ferry' ? '−1 day' : camePoint === 'bridge' ? '+1 day' : 'normal';
      let preface = '';
      if (camePoint === 'bridge')      preface = 'You crossed at the Bridge — the road north is shorter for you. The Old Forest entrance is further south.\n\n';
      else if (camePoint === 'ferry')  preface = 'You crossed at the Ferry — the Old Forest entrance is right at hand. The road north loops well around.\n\n';
      return preface + 'Two ways to Bree.';
    },
    routes: (G) => {
      const camePoint = G.pathFlags.brandywineCrossingPoint;
      const roadModifier  = camePoint === 'bridge' ? -1 : camePoint === 'ferry' ? 1 : 0;
      const forestModifier= camePoint === 'ferry'  ? -1 : camePoint === 'bridge' ? 1 : 0;

      return [
        {
          label: 'North then east on the road',
          note:  roadModifier === -1 ? 'Safe · 1 day shorter for you' :
                 roadModifier === 1  ? 'Safe · 1 extra day to loop around' :
                                       'Safe · normal length',
          to:    'Bree',
          apply: (G) => {
            if (roadModifier !== 0) {
              G.day += roadModifier;
              const word = roadModifier > 0 ? 'longer' : 'shorter';
              UI.log('Road north — ' + Math.abs(roadModifier) + ' day ' + word + ' from where you crossed.', 'dim');
            }
          },
          modifier: { eventRate: 0.16, goodBias: 0.55, flavor: 'road' },
          dailyRoll: (G) => {
            // Road dangers (spy/ambush/bandits)
            const road = rollRoadDangers(G, 'eriador');
            if (road) return road;

            // Snake bite — 8% per day
            if (Math.random() < 0.08) {
              const v = damageRandom(rand(8, 18));
              return {
                title: 'Snake bite',
                text:  (v ? v.name : 'Someone') + ' was bitten in the long grass at the roadside.',
                aftermath: 'Companion injured.',
                bad:   true,
              };
            }

            // Wagon wheel / pony shoe — 6% per day
            if (Math.random() < 0.06) {
              if (G.supplies.parts > 0) {
                G.supplies.parts--;
                return {
                  title: 'A pony loses a shoe',
                  text:  'One of the pack ponies threw a shoe on the rough verge. Your cooper fitted a spare.',
                  aftermath: '−1 spare part.',
                  bad:   false,
                };
              }
              // No spare part: lose the pony or take a delay
              if (G.supplies.ponies > 0) {
                G.supplies.ponies--;
                const lost = rand(20, 50);
                G.supplies.food = Math.max(0, G.supplies.food - lost);
                return {
                  title: 'Wagon wheel cracked',
                  text:  'A wheel split on a rut and there is no spare part. Had to abandon a pony to lighten the load.',
                  aftermath: '−1 pony · −' + lost + ' lbs food.',
                  bad:   true,
                };
              }
              G.day += 1;
              return {
                title: 'Wagon repair',
                text:  'A wheel split on a rut. Lost a day patching it with what you had.',
                aftermath: '+1 day.',
                bad:   true,
              };
            }

            // Trader on the road — 7% per day
            if (Math.random() < 0.07) {
              const food = rand(30, 60);
              const coin = rand(8, 18);
              G.supplies.food += food;
              G.supplies.coin += coin;
              G.pathFlags._traderUntilDay = G.day;
              return {
                title: 'Trader on the road',
                text:  'A peddler with a cart full of dried meat and small wares. Friendly, fair prices.',
                aftermath: '+' + food + ' lbs food · +' + coin + ' coin.',
                bad:   false,
              };
            }

            return null;
          },
        },

        {
          label: 'Through the Old Forest',
          note:  forestModifier === -1 ? 'Faster · 1 day shorter for you · trees and worse' :
                 forestModifier === 1  ? 'Faster on paper · +1 day to enter · trees and worse' :
                                         'Shorter on paper · trees and worse',
          to:    'Bree',
          apply: (G) => {
            if (forestModifier !== 0) {
              G.day += forestModifier;
              const word = forestModifier > 0 ? 'longer' : 'shorter';
              UI.log('Old Forest entrance — ' + Math.abs(forestModifier) + ' day ' + word + ' from where you crossed.', 'dim');
            }
            G.pathFlags._forestLostCount = 0;
            G.pathFlags._sentToBarrowDowns = false;
          },
          modifier: { eventRate: 0.10, goodBias: 0.4, flavor: 'forest' },
          dailyRoll: (G) => {
            // Tom Bombadil — 15% per day if not met yet.
            // Tom always leads you out. Pour him a drink for Dúnedain swords.
            if (!G.pathFlags.metBombadil && Math.random() < 0.15) {
              G.pathFlags.metBombadil = true;
              healAll(8);
              addNote('a strange music in the finish, old as the hills');
              return {
                decision: {
                  title: 'Tom Bombadil',
                  body: 'A man in a tall blue feathered hat, singing nonsense. He led you from the trees, fed you, sang to the keg. The forest forgot you were there.\n\nHe eyes the keg with open curiosity.',
                  choices: [
                    {
                      label: 'Pour Tom a drink',
                      note: '−8% brew · gain Dúnedain swords',
                      disabled: G.beer < 8,
                      disabledNote: 'Not enough brew',
                      handler: () => {
                        G.beer -= 8;
                        G.pathFlags.dunedainSwords = true;
                        G.brewSharedWith.push('Tom Bombadil');
                        addNote('poured for Tom under the willows');
                        UI.log('Tom drank deep and laughed. He pressed old Dúnedain blades into your hands. −8% brew · swords gained.', 'good');
                      },
                    },
                    {
                      label: 'Thank him and move on',
                      note: 'Tom led you out safely · no swords',
                      handler: () => {
                        UI.log('Tom sang you out of the forest with a wave. All +8 health.', 'good');
                      },
                    },
                  ],
                },
              };
            }

            // After meeting Bombadil, the forest is friendly the rest of the leg
            if (G.pathFlags.metBombadil) return null;

            // Tree injury — 10% per day
            if (Math.random() < 0.10) {
              const v = damageRandom(rand(8, 16));
              return {
                title: 'A grasping branch',
                text:  'A willow leaned out and snatched at ' + (v ? v.name : 'someone') + ' before the others could pull them free.',
                aftermath: 'Companion injured.',
                bad:   true,
              };
            }

            // Barrow Downs fires the day AFTER the warning
            if (G.pathFlags._barrowDownsPending) {
              G.pathFlags._barrowDownsPending = false;
              return barrowDownsEvent(G);
            }

            // Getting lost — 35% per day
            if (Math.random() < 0.35) {
              G.day += 1;
              // Sub-roll: 30% chance of wandering into the Barrow Downs
              if (!G.pathFlags._sentToBarrowDowns && Math.random() < 0.30) {
                G.pathFlags._sentToBarrowDowns = true;
                G.pathFlags._barrowDownsPending = true;
                return {
                  title: 'Lost deep — the Barrow Downs',
                  text:  'Paths closed. The trees thinned. Mist rolled in. Standing stones rose from the grass ahead. You have wandered into the Barrow Downs.',
                  aftermath: '+1 day. Something stirs in the mist...',
                  bad:   true,
                };
              }
              return {
                title: 'Lost in the Old Forest',
                text:  'Paths closed behind you. Trees that were one place a moment ago are somewhere else now. Half a day gone before the way opened again.',
                aftermath: '+1 day.',
                bad:   true,
              };
            }
            return null;
          },
        },
      ];
    },
  },

  // ── At Bree ──────────────────────────────────────────────────────
  //
  // Bree is an OT-style "fort". Town actions are available:
  //   - Stay at the Prancing Pony (paid rest, faster heal, no food cost,
  //     illness damage halved during the stay)
  //   - Leave Bree → chains to the path-to-Weathertop fork
  // The free Time Out → Rest menu works anywhere including Bree, so players
  // who can't afford the Pony still have an option.
  //
  'Bree': {
    title: 'Bree — The Prancing Pony',
    body: (G) => {
      return 'The Prancing Pony smells of pipeweed and roast pork. Barliman Butterbur eyes the keg with open interest. ' +
             'The road east grows emptier from here.';
    },
    routes: (G) => {
      return [
        {
          label: 'Stay at the Prancing Pony',
          note:  '10 coin/day · +10 hp/day · illness damage halved · no food cost',
          _chainTo: 'Bree',
          requires: (G) => G.supplies.coin >= 10,
          requiresNote: 'Not enough coin (need 10)',
          apply: (G) => {
            G.day += 1;
            G.supplies.coin -= 10;
            healAll(10);
            Object.entries(G.illnesses).forEach(([name, id]) => {
              const ill = ILLNESSES.find(i => i.id === id);
              if (!ill) return;
              const recover = Math.ceil(ill.dmg / 2);
              if (name === G.playerName) G.health = Math.min(G.maxHealth, G.health + recover);
              else {
                const c = G.companions.find(c => c.name === name);
                if (c && c.health > 0) c.health = Math.min(c.maxHealth, c.health + recover);
              }
            });
            if (G.pathFlags.ponyBittenAt != null) {
              G.pathFlags.ponyBittenAt = null;
              UI.log('The bitten pony recovered in the inn\'s stable.', 'good');
            }
            UI.log('Stayed a night at the Prancing Pony. −10 coin · +10 health.', 'good');
          },
        },
        {
          label: G.brewSharedWith.includes('Barliman Butterbur') ? 'Already poured for Butterbur' : 'Pour Butterbur a drink for the night',
          note:  G.brewSharedWith.includes('Barliman Butterbur') ? 'Already shared' : '−5% brew · free night · same benefits as paying',
          _chainTo: 'Bree',
          disabled: G.brewSharedWith.includes('Barliman Butterbur'),
          requires: (G) => !G.brewSharedWith.includes('Barliman Butterbur') && G.beer >= 5,
          requiresNote: G.brewSharedWith.includes('Barliman Butterbur') ? 'Already shared' : 'Not enough brew (need 5%)',
          apply: (G) => {
            G.day += 1;
            G.beer -= 5;
            if (!G.brewSharedWith.includes('Barliman Butterbur')) G.brewSharedWith.push('Barliman Butterbur');
            healAll(10);
            Object.entries(G.illnesses).forEach(([name, id]) => {
              const ill = ILLNESSES.find(i => i.id === id);
              if (!ill) return;
              const recover = Math.ceil(ill.dmg / 2);
              if (name === G.playerName) G.health = Math.min(G.maxHealth, G.health + recover);
              else {
                const c = G.companions.find(c => c.name === name);
                if (c && c.health > 0) c.health = Math.min(c.maxHealth, c.health + recover);
              }
            });
            if (G.pathFlags.ponyBittenAt != null) {
              G.pathFlags.ponyBittenAt = null;
              UI.log('The bitten pony recovered in the inn\'s stable.', 'good');
            }
            addNote('poured at the Prancing Pony, Butterbur beaming');
            UI.log('Poured Butterbur a cup. He gave you the best room. −5% brew · +10 health.', 'good');
          },
        },
        {
          label: 'Leave Bree',
          note:  'Head east toward Weathertop',
          _chainTo: 'Bree East',
        },
      ];
    },
  },

  // ── Bree East — path to Weathertop ────────────────────────────────
  //
  // Great East Road:
  //   Safe, standard. Daily rolls: road dangers (spy/ambush/bandits),
  //   snake bite, wagon trouble, traders.
  //
  // Midgewater Marshes through the Weather Hills:
  //   Faster on paper but miserable. Rare, varied hazards:
  //     - Marsh fever (mosquito)               5%/day
  //     - Trench foot                          4%/day
  //     - Sleepless (neekerbreekers)           6%/day
  //     - Stuck wagon / pony                   5%/day
  //     - Lost in fog                          6%/day
  //     - Strider the Ranger                   8%/day (sets metStrider)
  //
  'Bree East': {
    title: 'East of Bree',
    body:  'East of Bree the road empties. The Great East Road leads toward Weathertop. Or cut through the Midgewater Marshes and the Weather Hills — shorter, but miserable.',
    routes: [
      {
        label: 'Great East Road to Weathertop',
        note:  'Safe · 1 day shorter · the direct road',
        to:    'Weathertop',
        apply: (G) => {
          G.day -= 1;
          UI.log('The Great East Road runs straight east. About a day quicker than cutting through the wild.', 'dim');
        },
        modifier: { eventRate: 0.16, goodBias: 0.55, flavor: 'road' },
        dailyRoll: (G) => {
          const road = rollRoadDangers(G, 'eriador');
          if (road) return road;

          // Snake bite — 8%
          if (Math.random() < 0.08) {
            const v = damageRandom(rand(8, 18));
            return {
              title: 'Snake bite',
              text:  (v ? v.name : 'Someone') + ' was struck by a serpent in the long roadside grass.',
              aftermath: 'Companion injured.',
              bad:   true,
            };
          }
          // Wagon wheel / pony shoe — 6%
          if (Math.random() < 0.06) {
            if (G.supplies.parts > 0) {
              G.supplies.parts--;
              return {
                title: 'A pony loses a shoe',
                text:  'One of the pack ponies threw a shoe on the stony road. Your cooper fitted a spare.',
                aftermath: '−1 spare part.',
                bad:   false,
              };
            }
            if (G.supplies.ponies > 0) {
              G.supplies.ponies--;
              const lost = rand(20, 50);
              G.supplies.food = Math.max(0, G.supplies.food - lost);
              return {
                title: 'Wagon wheel cracked',
                text:  'A wheel split on a rut and no spare. Had to abandon a pony to lighten the load.',
                aftermath: '−1 pony · −' + lost + ' lbs food.',
                bad:   true,
              };
            }
            G.day += 1;
            return {
              title: 'Wagon repair',
              text:  'A wheel split. Lost a day patching it.',
              aftermath: '+1 day.',
              bad:   true,
            };
          }
          // Trader — 7%
          if (Math.random() < 0.07) {
            const food = rand(30, 60);
            const coin = rand(8, 18);
            G.supplies.food += food;
            G.supplies.coin += coin;
            G.pathFlags._traderUntilDay = G.day;
            return {
              title: 'Trader on the road',
              text:  'A peddler with a cart full of dried meat and small wares.',
              aftermath: '+' + food + ' lbs food · +' + coin + ' coin.',
              bad:   false,
            };
          }
          return null;
        },
      },
      {
        label: 'Through the Midgewater Marshes & Weather Hills',
        note:  'Wilder · marsh first, then climb · same length',
        to:    'Weathertop',
        apply: (G) => {
          UI.log('Left the road for the marshes. Wet, dark, and full of small pests.', 'dim');
        },
        modifier: { eventRate: 0.10, goodBias: 0.35, flavor: 'marsh' },
        dailyRoll: (G) => {
          // Phase: first half of the leg = marsh, second half = hills
          // Bree at mile 200, Weathertop at mile 430 — halfway is mile 315
          const inHills = G.miles >= 315;

          // Halbarad — 3% per day across the whole leg (~30% cumulative)
          // He always shares food. Pour him a drink (−8%) for his protection (metStrider flag).
          if (!G.pathFlags._halbaradMet && Math.random() < 0.03) {
            G.pathFlags._halbaradMet = true;
            healAll(5);
            G.supplies.food += rand(20, 40);
            const where = inHills
              ? 'On the slope of the Weather Hills, a grim man stepped out from behind a rock — Halbarad, a Ranger of the North.'
              : 'A grim man stepped out of the reeds — Halbarad, a Ranger of the North.';
            return {
              decision: {
                title: 'Halbarad of the Dúnedain',
                body: where + ' He shared dried meat and quiet words about what lies ahead at Weathertop. He eyes the keg.\n\nAll +5 health · food found.',
                choices: [
                  {
                    label: 'Pour Halbarad a drink',
                    note: '−8% brew · gain his protection at Weathertop',
                    disabled: G.beer < 8,
                    disabledNote: 'Not enough brew',
                    handler: () => {
                      G.beer -= 8;
                      G.pathFlags.metStrider = true;
                      G.brewSharedWith.push('Halbarad');
                      addNote('poured for the Ranger in the heather');
                      UI.log('Halbarad drank and nodded. "I will watch the road ahead." −8% brew · his protection gained.', 'good');
                    },
                  },
                  {
                    label: 'Thank him and part ways',
                    note: 'He shared food, but moves on',
                    handler: () => {
                      UI.log('Halbarad nodded and slipped back into the wild. All +5 health · food found.', 'good');
                    },
                  },
                ],
              },
            };
          }

          if (!inHills) {
            // ── MARSH PHASE ──
            // Marsh fever (mosquito) — 4%
            if (Math.random() < 0.04) {
              const n = infectRandom('fever');
              if (n) {
                return {
                  title: 'Mosquitoes at dusk',
                  text:  'Clouds of biting flies. ' + n + ' woke in the night burning with fever.',
                  aftermath: n + ' has Marsh Fever.',
                  bad:   true,
                };
              }
            }
            // Trench foot — 4%
            if (Math.random() < 0.04) {
              const alive = livingMembers();
              const unhealthy = alive.filter(p => !G.illnesses[p.name]);
              if (unhealthy.length > 0) {
                const t = pick(unhealthy);
                G.illnesses[t.name] = 'trench_foot';
                return {
                  title: 'Trench foot',
                  text:  t.name + '\'s boots have not been dry for three days. Skin is splitting.',
                  aftermath: t.name + ' has Trench Foot.',
                  bad:   true,
                };
              }
            }
            // Sleepless (neekerbreekers) — 5%
            if (Math.random() < 0.05) {
              const alive = livingMembers();
              const unhealthy = alive.filter(p => !G.illnesses[p.name]);
              if (unhealthy.length > 0) {
                const t = pick(unhealthy);
                G.illnesses[t.name] = 'sleepless';
                damageAll(3);
                return {
                  title: 'Neekerbreekers',
                  text:  'Something small in the reeds made an unending chirping noise. Nobody slept. ' + t.name + ' is worst off.',
                  aftermath: 'All −3 health · ' + t.name + ' is sleepless.',
                  bad:   true,
                };
              }
            }
            // Stuck wagon / pony — 4%
            if (Math.random() < 0.04) {
              G.day += 1;
              const lost = rand(10, 25);
              G.supplies.food = Math.max(0, G.supplies.food - lost);
              return {
                title: 'Stuck in a sinkhole',
                text:  'A pony went into a bog to its belly. Took half a day and a lot of pulling to free her. Some packs slipped loose.',
                aftermath: '+1 day · −' + lost + ' lbs food.',
                bad:   true,
              };
            }
            // Lost in fog — 5%
            if (Math.random() < 0.05) {
              G.day += 1;
              return {
                title: 'Lost in the fog',
                text:  'A white fog rose off the water and swallowed every landmark. Walked in circles for half a day.',
                aftermath: '+1 day.',
                bad:   true,
              };
            }
          } else {
            // ── HILLS PHASE ──
            // Snake bite — 4%
            if (Math.random() < 0.02) {
              const v = damageRandom(rand(8, 18));
              return {
                title: 'Snake on the hillside',
                text:  (v ? v.name : 'Someone') + ' was bitten by an adder coiled in the warm rocks.',
                aftermath: 'Companion injured.',
                bad:   true,
              };
            }
            // Lost in the hills — 3%
            if (Math.random() < 0.02) {
              G.day += 1;
              return {
                title: 'Lost in the hills',
                text:  'The Weather Hills look the same in every direction at dusk. Backtracked half a day to find the right ridgeline.',
                aftermath: '+1 day.',
                bad:   true,
              };
            }
            // Sheltered camp — 4% (positive)
            if (Math.random() < 0.02) {
              healAll(4);
              return {
                title: 'A sheltered camp',
                text:  'Found a hollow under an overhang. First proper sleep in days.',
                aftermath: 'All +4 health.',
                bad:   false,
              };
            }
            // Wargs — 3% (negative)
            if (Math.random() < 0.02) {
              const v = damageRandom(rand(6, 14));
              return {
                title: 'Wargs in the hills',
                text:  'Howls along the ridge. Drove them off with torches before they reached the ponies. ' + (v ? v.name : 'Someone') + ' was clawed.',
                aftermath: 'Companion injured.',
                bad:   true,
              };
            }
          }

          return null;
        },
      },
    ],
  },

  // ── At Weathertop ────────────────────────────────────────────────
  //
  // Pure landscape landmark. The player can:
  //   - Continue east immediately (skip the Nazgûl entirely)
  //   - Rest a night (50% chance of Nazgûl attack, +25% if being tracked)
  //
  // Each night rested rolls again. A successful escape clears the spy flag
  // (the Nazgûl have found you here, no need for further scouting).
  //
  // Nazgûl outcome modified by:
  //   - pathFlags.dunedainSwords (from Old Forest)  → 30% chance of clean win on Stand
  //   - pathFlags.metStrider     (from Midgewater)  → −5 damage on Stand
  //   - BOTH                                        → unlocks "Drive them off" option (clean win)
  //
  'Weathertop': {
    title: 'Weathertop — Amon Sûl',
    body: (G) => {
      const havePony = G.supplies.coin >= 0; // unused, just keeps form consistent
      let s = 'The ruined watchtower of Amon Sûl. From here you can see the whole road behind you, and the dim line of the Misty Mountains far ahead. ';
      s += 'A wise traveler does not linger. The hill is too open. The road east toward the Hoarwell beckons.';
      if (G.spyFlag) s += '\n\nYou feel watched even on the wind.';
      return s;
    },
    routes: (G) => {
      return [
        {
          label: 'Push on east',
          note:  'Leave Weathertop now · no rest, no risk',
          _chainTo: 'Weathertop East',
        },
        {
          label: 'Rest one night atop Amon Sûl',
          note: (G) => {
            const base = 50;
            const bonus = G.spyFlag ? 25 : 0;
            const total = base + bonus;
            return total + '% chance of attack tonight' + (bonus ? ' (you are tracked)' : '');
          },
          _chainTo: 'Weathertop',
          apply: (G) => {
            G.day += 1;
            healAll(8);
            UI.log('Rested a night atop Weathertop.', 'dim');
            const chance = G.spyFlag ? 0.75 : 0.50;
            if (Math.random() < chance) {
              window._weathertopNazgul = true;
            }
          },
        },
      ];
    },
  },

  // ── East of Weathertop — path to the Hoarwell ────────────────────
  //
  // Same shape as the Shire fork:
  //   Main road    → arrives at the Last Bridge directly. Light hazards.
  //   Wilderness   → arrives upstream at the Hoarwell, must ford or
  //                  detour 1 day south to the Last Bridge.
  //
  'Weathertop East': {
    title: 'East of Weathertop',
    body:  'The Great East Road runs straight to the Last Bridge over the Hoarwell. Or you can cut through the wild — faster, but you arrive upstream where there is no bridge.',
    routes: [
      {
        label: 'Take the Great East Road',
        note:  'Safe · arrives at the Last Bridge',
        to:    'Hoarwell River',
        arrivalPoint: 'last_bridge',
        modifier: { eventRate: 0.18, goodBias: 0.55, flavor: 'road' },
        dailyRoll: (G) => {
          const road = rollRoadDangers(G, 'wilderness');
          if (road) return road;
          // Pony bite + lame followup
          const lame = rollPonyLame(G);
          if (lame) return lame;
          const bite = rollPonyBite(G);
          if (bite) return bite;
          // Snake — 4%
          if (Math.random() < 0.04) {
            const v = damageRandom(rand(8, 18));
            return {
              title: 'Snake bite',
              text:  (v ? v.name : 'Someone') + ' was struck by a serpent on the long verge.',
              aftermath: 'Companion injured.',
              bad:   true,
            };
          }
          return null;
        },
      },
      {
        label: 'Cut through the wilderness',
        note:  'Faster · arrives upstream at the river',
        to:    'Hoarwell River',
        arrivalPoint: 'upstream',
        apply: (G) => {
          G.day -= 1;  // shorter on paper
          UI.log('Left the road for the wild. The Hoarwell waits ahead — no bridge there.', 'dim');
        },
        modifier: { eventRate: 0.15, goodBias: 0.45, flavor: 'wild' },
        dailyRoll: (G) => {
          const lame = rollPonyLame(G);
          if (lame) return lame;
          const bite = rollPonyBite(G);
          if (bite) return bite;
          // Wrong path / lost — 4%
          if (Math.random() < 0.04) {
            G.day += 1;
            return {
              title: 'Lost in the lone-lands',
              text:  'No road, no clear landmarks. Walked half a day in the wrong direction before realizing.',
              aftermath: '+1 day.',
              bad:   true,
            };
          }
          // Wargs — 3%
          if (Math.random() < 0.03) {
            const v = damageRandom(rand(6, 12));
            return {
              title: 'Wargs in the night',
              text:  'Howls close in. Drove them off with torches before they reached the ponies. ' + (v ? v.name : 'Someone') + ' was bitten.',
              aftermath: 'Companion injured.',
              bad:   true,
            };
          }
          // Sheltered hollow — 4% (positive)
          if (Math.random() < 0.04) {
            healAll(3);
            return {
              title: 'A sheltered hollow',
              text:  'Found a dry cleft out of the wind. Real sleep, for once.',
              aftermath: 'All +3 health.',
              bad:   false,
            };
          }
          return null;
        },
      },
    ],
  },

  // ── Leaving Hoarwell River (PLACEHOLDER) ─────────────────────────
  // ── At the Hoarwell ──────────────────────────────────────────────
  //
  // arrivalPoint determines what's possible:
  //   'last_bridge' (came via road): cross the Last Bridge for free, no fork.
  //                                  Auto-chains to 'Trollshaws' leg.
  //   'upstream'    (came via wild): choose ford-here OR detour 1 day south
  //                                  to the Last Bridge. Then chains to Trollshaws.
  //
  'Hoarwell River': {
    title: 'The Hoarwell',
    body: (G) => {
      if (G.arrivalPoint === 'last_bridge') {
        return 'You arrive at the Last Bridge — a single span of dark stone over the cold water. Nothing blocks the way.';
      }
      const depth = G.pathFlags.hoarwellDepth || 4;
      return 'You stand on the bank of the Hoarwell, well upstream of any bridge. Currently ' + depth + ' ft at the ford.';
    },
    routes: (G) => {
      if (G.arrivalPoint === 'last_bridge') {
        return [
          {
            label: 'Cross the Last Bridge',
            note:  'Free · already at the bridge',
            _chainTo: 'Trollshaws',
            apply: (G) => {
              UI.log('Crossed the Last Bridge over the Hoarwell.', 'good');
              G.pathFlags.hoarwellCrossingPoint = 'bridge';
            },
          },
        ];
      }
      // Upstream
      const depth = G.pathFlags.hoarwellDepth || 4;
      return [
        {
          label: 'Ford the river here',
          note:  depth + ' ft deep · ' + Math.round(fordRisk(depth) * 100) + '% chance of trouble',
          _chainTo: 'Trollshaws',
          apply: (G) => {
            const risk = fordRisk(depth);
            if (Math.random() < risk) {
              const lost = rand(20, 50);
              G.supplies.food = Math.max(0, G.supplies.food - lost);
              const v = damageRandom(rand(8, 14));
              UI.log('Fording the Hoarwell — current took ' + (v ? v.name : 'someone') + '. −' + lost + ' lbs food.', 'bad');
            } else {
              UI.log('Fording the Hoarwell — cold but everyone across intact.', 'good');
            }
            G.pathFlags.hoarwellCrossingPoint = 'ford';
          },
        },
        {
          label: 'Walk south to the Last Bridge',
          note:  '+1 day · safe crossing',
          _chainTo: 'Trollshaws',
          apply: (G) => {
            G.day += 1;
            UI.log('Walked south to the Last Bridge. A day lost but a safe crossing.', 'dim');
            G.pathFlags.hoarwellCrossingPoint = 'bridge';
          },
        },
        {
          label: 'Wait a day for the water to drop',
          note:  'Re-roll depth',
          to:    null,
          _wait: true,
        },
      ];
    },
  },

  // ── Trollshaws — leg into the Ford of Bruinen ────────────────────
  //
  // No fork choice — you're going to the Bruinen. This is just the leg.
  // OT-style hazards: snake bites, wrong path, trolls (rare), sheltered camp.
  // Ranger cache is a small positive find.
  //
  'Trollshaws': {
    title: 'The Trollshaws',
    body:  'The road climbs into a country of broken hills and standing stones. Bilbo passed this way long ago, but the woods are not friendly.',
    routes: [
      {
        label: 'Continue east through the Trollshaws',
        note:  'On to the Ford of Bruinen',
        to:    'Ford of Bruinen',
        modifier: { eventRate: 0.18, goodBias: 0.5, flavor: 'forest' },
        dailyRoll: (G) => {
          // Pony bite + lame
          const lame = rollPonyLame(G);
          if (lame) return lame;
          const bite = rollPonyBite(G);
          if (bite) return bite;
          // Snake — 4%
          if (Math.random() < 0.04) {
            const v = damageRandom(rand(8, 16));
            return {
              title: 'Snake in the rocks',
              text:  (v ? v.name : 'Someone') + ' was bitten reaching for a handhold on a stone.',
              aftermath: 'Companion injured.',
              bad:   true,
            };
          }
          // Wrong path — 4%
          if (Math.random() < 0.04) {
            G.day += 1;
            return {
              title: 'Wrong path',
              text:  'A track that promised a shortcut petered out in dense brush. Backtracked half a day.',
              aftermath: '+1 day.',
              bad:   true,
            };
          }
          // Stone trolls (Bilbo\'s cache) — 3% (positive)
          if (Math.random() < 0.03) {
            G.supplies.coin += rand(15, 30);
            return {
              title: 'Bilbo\'s old trolls',
              text:  'Three stone shapes in a clearing — old trolls turned by the sun. A pouch of forgotten coin lay buried in the leaves.',
              aftermath: '+coin.',
              bad:   false,
            };
          }
          // Live trolls — 2% (negative)
          if (Math.random() < 0.02) {
            damageAll(rand(6, 12));
            return {
              title: 'Live trolls',
              text:  'Three large shapes blundered out of a thicket. Ran for it. Some bumps and scrapes for everyone.',
              aftermath: 'All injured.',
              bad:   true,
            };
          }
          // Ranger cache — 3%
          if (Math.random() < 0.03) {
            const food = rand(20, 45);
            G.supplies.food += food;
            return {
              title: 'Ranger waymark',
              text:  'Three cuts on a roadside stone — a Ranger cache nearby with wrapped food and oil.',
              aftermath: '+' + food + ' lbs food.',
              bad:   false,
            };
          }
          // Sheltered grove — 4%
          if (Math.random() < 0.04) {
            healAll(3);
            return {
              title: 'Sheltered grove',
              text:  'A still grove out of the wind. A real night\'s sleep.',
              aftermath: 'All +3 health.',
              bad:   false,
            };
          }
          return null;
        },
      },
    ],
  },

  // ── At the Ford of Bruinen ───────────────────────────────────────
  //
  // No bridge here — only the ford. The water level is rolled on arrival.
  // Options: ford now, or wait for water to drop. Each waiting day rolls
  // a Nazgûl chance: starts at 10%, +5% per day waited.
  //
  // If Nazgûl appear while waiting, the player must flee across the ford
  // (lose supplies + take damage) — there's no other escape.
  //
  'Ford of Bruinen': {
    title: 'The Ford of Bruinen',
    body: (G) => {
      const depth = G.pathFlags.bruinenDepth || 3;
      const waited = G.pathFlags.bruinenDaysWaited || 0;
      let s = 'A shallow rocky crossing — the last river before Rivendell. Currently ' + depth + ' ft.';
      if (waited > 0) s += '\n\nYou have waited ' + waited + ' day(s) here.';
      if (G.spyFlag) s += '\n\nThe road behind you feels watched.';
      return s;
    },
    routes: (G) => {
      const depth = G.pathFlags.bruinenDepth || 3;
      const waited = G.pathFlags.bruinenDaysWaited || 0;
      const nazgulChance = Math.min(0.5, 0.10 + waited * 0.05);
      return [
        {
          label: 'Ford the Bruinen',
          note:  depth + ' ft deep · ' + Math.round(fordRisk(depth) * 100) + '% chance of trouble',
          to:    'Rivendell',
          apply: (G) => {
            const risk = fordRisk(depth);
            if (Math.random() < risk) {
              const lost = rand(15, 40);
              G.supplies.food = Math.max(0, G.supplies.food - lost);
              const v = damageRandom(rand(6, 12));
              UI.log('Fording the Bruinen — current was strong. −' + lost + ' lbs food. ' + (v ? v.name : 'Someone') + ' wounded.', 'bad');
            } else {
              UI.log('Forded the Bruinen — water cold but the way held.', 'good');
            }
            G.pathFlags.bruinenDaysWaited = 0;
          },
          modifier: { eventRate: 0.10, goodBias: 0.6, flavor: 'wild' },
        },
        {
          label: 'Wait a day for better water',
          note:  Math.round(nazgulChance * 100) + '% chance of Nazgûl tonight · re-roll depth',
          _chainTo: 'Ford of Bruinen',
          apply: (G) => {
            G.day += 1;
            G.pathFlags.bruinenDaysWaited = (G.pathFlags.bruinenDaysWaited || 0) + 1;
            // Re-roll depth
            const newDepth = rollRiverDepth('bruinen', G.pathFlags.bruinenDepth);
            G.pathFlags.bruinenDepth = newDepth;
            UI.log('Waited a day at the Bruinen. Water now ' + newDepth + ' ft.', 'dim');
            // Roll for Nazgûl
            if (Math.random() < nazgulChance) {
              window._bruinenNazgul = true;
            }
          },
        },
      ];
    },
  },

  // ── Rivendell — fort ─────────────────────────────────────────────
  //
  // Free 1-day rest (+15 hp, no food cost, no coin cost). The 'See Elrond'
  // option costs 1 day and cures all illnesses + heals 30 hp — for when
  // someone has a Morgul wound or several illnesses stacked.
  // Leaving chains to 'Rivendell South' fork which presents the 3 paths.
  // Once a path is chosen, you cannot back out (per design).
  //
  'Rivendell': {
    title: 'Rivendell — The Last Homely House',
    body: (G) => {
      let s = 'The valley of Imladris. Quiet halls, hot food, the smell of fires. Elrond himself watches the keg with curiosity.';
      if (Object.keys(G.illnesses).length > 0) s += '\n\nElrond can be asked to tend to the sick.';
      return s;
    },
    routes: (G) => {
      return [
        {
          label: 'Rest a day',
          note:  'Free · +15 health · no food cost',
          _chainTo: 'Rivendell',
          apply: (G) => {
            G.day += 1;
            healAll(15);
            // Clear pony bite, exhaustion (same as other rests)
            if (G.pathFlags.ponyBittenAt != null) {
              G.pathFlags.ponyBittenAt = null;
              UI.log('The bitten pony recovered in Elrond\'s stables.', 'good');
            }
            Object.keys(G.illnesses).forEach(n => {
              if (G.illnesses[n] === 'exhaustion') delete G.illnesses[n];
            });
            UI.log('Rested a day at Rivendell. All +15 health.', 'good');
          },
        },
        {
          label: 'See Elrond',
          note:  '1 day · cures all illness · all +30 health',
          _chainTo: 'Rivendell',
          apply: (G) => {
            G.day += 1;
            G.illnesses = {};
            healAll(30);
            if (G.pathFlags.ponyBittenAt != null) G.pathFlags.ponyBittenAt = null;
            UI.log('Elrond tended to the wounded. All illness gone. All +30 health.', 'good');
          },
        },
        {
          label: (G.brewSharedWith || []).includes('Elrond') ? 'Already poured for Elrond' : 'Pour Elrond a drink',
          note:  (G.brewSharedWith || []).includes('Elrond') ? 'Already shared' : '−5% brew · 1 day · cures all · all +50 health',
          _chainTo: 'Rivendell',
          disabled: (G.brewSharedWith || []).includes('Elrond'),
          requires: (G) => !(G.brewSharedWith || []).includes('Elrond') && G.beer >= 5,
          requiresNote: (G.brewSharedWith || []).includes('Elrond') ? 'Already shared' : 'Not enough brew (need 5%)',
          apply: (G) => {
            G.day += 1;
            G.beer -= 5;
            G.illnesses = {};
            healAll(50);
            if (G.pathFlags.ponyBittenAt != null) G.pathFlags.ponyBittenAt = null;
            if (!G.brewSharedWith.includes('Elrond')) G.brewSharedWith.push('Elrond');
            addNote('poured for Elrond in the Last Homely House');
            UI.log('Elrond drank thoughtfully and worked with renewed vigour. −5% brew · All illness gone · All +50 health.', 'good');
          },
        },
        {
          label: 'Leave Rivendell',
          note:  'Choose your path south',
          _chainTo: 'Rivendell South',
        },
      ];
    },
  },

  // ── Rivendell South — choose path (commits permanently) ───────────
  //
  // All three roads run south from Rivendell. Once chosen you are stuck.
  //
  'Rivendell South': {
    title: 'South from Rivendell — choose your road',
    body: (G) => {
      let s = 'Three roads south. Once you commit you cannot turn back from your choice.';
      if (G.totalAmbushes >= 3) s += '\n\nYou have been tracked hard. The Gap of Rohan road may be the worst-watched right now.';
      return s;
    },
    routes: (G) => {
      return [
        {
          label: 'Climb the Redhorn Pass to Caradhras',
          note:  'High pass over the Misty Mountains · cold and snow',
          to:    'Redhorn Gate',
          arrivalPoint: 'redhorn_approach',
          apply: (G) => {
            G.pathFlags.route = 'redhorn';
            UI.log('Turned south, then west, climbing the Redhorn road.', 'dim');
          },
          modifier: { eventRate: 0.16, goodBias: 0.5, flavor: 'mountain' },
          dailyRoll: (G) => {
            // Approach to the Redhorn Gate — light hazards, just getting there
            const lame = rollPonyLame(G); if (lame) return lame;
            const bite = rollPonyBite(G); if (bite) return bite;
            if (Math.random() < 0.04) {
              G.day += 1;
              return {
                title: 'Steep climb',
                text:  'The road grew rocky and steep. Slow going, lost time.',
                aftermath: '+1 day.',
                bad:   true,
              };
            }
            return null;
          },
        },
        {
          label: 'Make for the West-gate of Moria',
          note:  'Ancient dwarf-realm · dark and full of orcs',
          to:    'West-gate of Moria',
          arrivalPoint: 'moria_approach',
          apply: (G) => {
            G.pathFlags.route = 'moria';
            addNote('dark roast, smoke in the finish');
            UI.log('Turned south toward the western gates of Khazad-dûm.', 'dim');
          },
          modifier: { eventRate: 0.16, goodBias: 0.5, flavor: 'mountain' },
          dailyRoll: (G) => {
            const lame = rollPonyLame(G); if (lame) return lame;
            const bite = rollPonyBite(G); if (bite) return bite;
            if (Math.random() < 0.04) {
              G.day += 1;
              return {
                title: 'Wolf country',
                text:  'Howls along the foothills. Drove them off, but the night was sleepless.',
                aftermath: '+1 day.',
                bad:   true,
              };
            }
            return null;
          },
        },
        {
          label: 'Take the long road south to the Gap of Rohan',
          note:  'Longest path · skips Lothlórien · Saruman watches',
          to:    'Glanduin',
          arrivalPoint: 'gap_approach',
          apply: (G) => {
            G.pathFlags.route = 'gap';
            addNote('wind-dried, crispy cold');
            UI.log('Turning for the long road south toward the Gap of Rohan.', 'dim');
          },
          modifier: { eventRate: 0.18, goodBias: 0.5, flavor: 'wild' },
          dailyRoll: (G) => {
            const lame = rollPonyLame(G); if (lame) return lame;
            const bite = rollPonyBite(G); if (bite) return bite;
            // Light road dangers as you head south
            return rollRoadDangers(G, 'wilderness');
          },
        },
      ];
    },
  },

  // ── Redhorn Gate — entrance to the high pass ─────────────────────
  //
  // Pure landmark. Decision: enter the pass (no turning back) or rest at
  // the gate. Resting heals a bit but increases blizzard severity slightly
  // because the season is turning.
  //
  'Redhorn Gate': {
    title: 'The Redhorn Gate',
    body:  'You stand at the foot of the high pass. Sheer cliffs to the left, a deep ravine to the right. Snow blows down from above even on a calm day.',
    routes: (G) => {
      return [
        {
          label: 'Enter the pass',
          note:  'Begin the climb — no turning back',
          to:    'Caradhras Pass',
          apply: (G) => {
            G.pathFlags._blizzardsHit = 0;
            G.pathFlags._blizzardForced = false;
            UI.log('Began the climb up the Redhorn road. Snow already to the knee.', 'dim');
          },
          modifier: { eventRate: 0.10, goodBias: 0.3, flavor: 'mountain' },
          dailyRoll: (G) => {
            // Blizzard system: at least 1 blizzard guaranteed somewhere on the leg.
            // Force one if we've passed the halfway mark and none has fired.
            const blizzardsHit = G.pathFlags._blizzardsHit || 0;
            const past_halfway = G.miles >= 820; // halfway between 770 and 870
            const trackedBonus = G.spyFlag ? 0.04 : 0;
            const baseRate = 0.10 + trackedBonus;
            // Force a blizzard if past halfway and none yet
            const force = past_halfway && blizzardsHit === 0 && !G.pathFlags._blizzardForced;
            if (force || (blizzardsHit < 2 && Math.random() < baseRate)) {
              G.pathFlags._blizzardsHit = blizzardsHit + 1;
              if (force) G.pathFlags._blizzardForced = true;
              return buildBlizzardDecision();
            }
            // Frostbite — 4% per day
            if (Math.random() < 0.04) {
              const alive = livingMembers();
              const unhealthy = alive.filter(p => !G.illnesses[p.name]);
              if (unhealthy.length > 0) {
                const t = pick(unhealthy);
                G.illnesses[t.name] = 'frostbite';
                return {
                  title: 'Frostbite',
                  text:  t.name + '\'s fingers are pale and numb. The cold is in the bone now.',
                  aftermath: t.name + ' has Frostbite.',
                  bad:   true,
                };
              }
            }
            // Deep snow stuck — 4% (capped to once per leg)
            if (!G.pathFlags._deepSnowHit && Math.random() < 0.04) {
              G.pathFlags._deepSnowHit = true;
              G.day += 2;
              damageAll(rand(4, 8));
              return {
                title: 'Stuck in deep snow',
                text:  'A drift to the chest. Took two days digging the ponies free. Everyone cold to the marrow.',
                aftermath: '+2 days · all hurt by exposure.',
                bad:   true,
              };
            }
            // Orc patrol from the heights — 3%
            if (Math.random() < 0.03) {
              const v = damageRandom(rand(8, 16));
              return {
                title: 'Orcs from the heights',
                text:  'Arrows from above. Drove them back with torches. ' + (v ? v.name : 'Someone') + ' was wounded.',
                aftermath: 'Companion injured.',
                bad:   true,
              };
            }
            return null;
          },
        },
      ];
    },
  },

  // After Caradhras Pass, route descends to Lothlórien
  'Caradhras Pass': {
    title: 'Crested Caradhras',
    body:  'The high point of the pass. Below to the south, the Golden Wood. The descent is gentler than the climb.',
    routes: (G) => {
      return [
        {
          label: 'Descend to Lothlórien',
          note:  'Down the southern slope · safer ground',
          to:    'Lothlórien',
          modifier: { eventRate: 0.12, goodBias: 0.55, flavor: 'mountain' },
          dailyRoll: (G) => {
            const lame = rollPonyLame(G); if (lame) return lame;
            const bite = rollPonyBite(G); if (bite) return bite;
            // Lingering cold
            if (Math.random() < 0.03) {
              const alive = livingMembers();
              const unhealthy = alive.filter(p => !G.illnesses[p.name]);
              if (unhealthy.length > 0) {
                const t = pick(unhealthy);
                G.illnesses[t.name] = 'chill';
                return {
                  title: 'Mountain chill',
                  text:  t.name + ' came down with a deep cough on the descent.',
                  aftermath: t.name + ' has Mountain Chill.',
                  bad:   true,
                };
              }
            }
            return null;
          },
        },
      ];
    },
  },

  // ── West-gate of Moria ───────────────────────────────────────────
  //
  // You can rest here, but each rest day risks the Watcher in the Water.
  // The Watcher attack damages the party + supplies and FORCES you into
  // the mines. Or you can simply enter without resting.
  //
  'West-gate of Moria': {
    title: 'The West-gate of Moria',
    body: (G) => {
      const restCount = G.pathFlags._moriaGateRests || 0;
      let s = 'A still black pool before two great doors of mithril and ithildin. The doors are sealed.';
      if (restCount > 0) s += '\n\nYou have rested ' + restCount + ' day(s) at the gate.';
      return s;
    },
    routes: (G) => {
      const restCount = G.pathFlags._moriaGateRests || 0;
      const watcherChance = Math.min(0.7, 0.15 + restCount * 0.20);
      return [
        {
          label: 'Speak the password and enter',
          note:  'Begin the journey through Khazad-dûm — no turning back',
          to:    'Khazad-dûm',
          apply: (G) => {
            G.pathFlags._moriaOrcAttacks = 0;
            G.pathFlags._moriaRests = 0;
            UI.log('"Mellon." The doors swung wide. Into the dark.', 'dim');
          },
          modifier: { eventRate: 0.16, goodBias: 0.25, flavor: 'dark' },
          dailyRoll: (G) => {
            return rollMoriaTick(G);
          },
        },
        {
          label: 'Rest at the gate',
          note:  Math.round(watcherChance * 100) + '% chance the Watcher stirs',
          _chainTo: 'West-gate of Moria',
          apply: (G) => {
            G.day += 1;
            healAll(8);
            G.pathFlags._moriaGateRests = (G.pathFlags._moriaGateRests || 0) + 1;
            UI.log('Rested at the gates of Moria.', 'dim');
            if (Math.random() < watcherChance) {
              window._watcherAttack = true;
            }
          },
        },
      ];
    },
  },

  // ── Khazad-dûm — the mines ───────────────────────────────────────
  //
  // The mines. Player travels through. Hazards:
  //   - Falling rocks (snake-bite analog, low chance)
  //   - Lost in the dark (delays)
  //   - Orc attacks (rare). Each attack increases Balrog wake chance.
  //   - Balrog (low chance, increased by orc attacks)
  // Resting in the mines is bad — increases orc chance, no health benefit.
  //
  'Khazad-dûm': {
    title: 'Out of Khazad-dûm — Dimrill Dale',
    body:  'You stand at the East-gate of Moria, blinking in daylight. The road descends down through Dimrill Dale toward the Golden Wood.',
    routes: (G) => {
      return [
        {
          label: 'Descend to Lothlórien',
          note:  'Down through Dimrill Dale',
          to:    'Lothlórien',
          modifier: { eventRate: 0.10, goodBias: 0.55, flavor: 'mountain' },
          dailyRoll: (G) => {
            const lame = rollPonyLame(G); if (lame) return lame;
            const bite = rollPonyBite(G); if (bite) return bite;
            // Lingering cold from the mines
            if (Math.random() < 0.03) {
              const alive = livingMembers();
              const unhealthy = alive.filter(p => !G.illnesses[p.name]);
              if (unhealthy.length > 0) {
                const t = pick(unhealthy);
                G.illnesses[t.name] = 'chill';
                return {
                  title: 'Sickness in the open air',
                  text:  t.name + ' fell ill once they were back in daylight.',
                  aftermath: t.name + ' has Mountain Chill.',
                  bad:   true,
                };
              }
            }
            return null;
          },
        },
      ];
    },
  },

  // ── Glanduin — first river south on the Gap of Rohan road ────────
  //
  // No bridge. Ford here. Then chains to 'Dunland' leg south.
  //
  'Glanduin': {
    title: 'The Glanduin',
    body: (G) => {
      const depth = G.pathFlags.glanduinDepth || 3;
      return 'A cold quick river running west out of the mountains. Currently ' + depth + ' ft at the ford.';
    },
    routes: (G) => {
      const depth = G.pathFlags.glanduinDepth || 3;
      return [
        {
          label: 'Ford the Glanduin',
          note:  depth + ' ft · ' + Math.round(fordRisk(depth) * 100) + '% chance of trouble',
          _chainTo: 'Dunland',
          apply: (G) => {
            const risk = fordRisk(depth);
            if (Math.random() < risk) {
              const lost = rand(20, 50);
              G.supplies.food = Math.max(0, G.supplies.food - lost);
              const v = damageRandom(rand(6, 12));
              UI.log('Fording the Glanduin — current took ' + (v ? v.name : 'someone') + '. −' + lost + ' lbs food.', 'bad');
            } else {
              UI.log('Forded the Glanduin without trouble.', 'good');
            }
          },
        },
        {
          label: 'Wait a day for the water to drop',
          note:  'Re-roll depth',
          to:    null,
          _wait: true,
        },
      ];
    },
  },

  // ── Dunland — long road south through hostile country ────────────
  //
  // This is THE long leg. Saruman's spies watch — crebain spy variant
  // increments sarumanCounter. Brigand/ambush rates ramp UP as you go
  // further south (we use mile threshold to escalate).
  //
  'Dunland': {
    title: 'The Long Road through Dunland',
    body:  'Open hostile country. Hill-men of Dunland have no love for travelers. The Misty Mountains rise jagged to the east.',
    routes: (G) => {
      return [
        {
          label: 'Continue south to the Fords of Isen',
          note:  'Long road · brigands and crebain',
          to:    'Fords of Isen',
          modifier: { eventRate: 0.18, goodBias: 0.4, flavor: 'wild' },
          dailyRoll: (G) => {
            const lame = rollPonyLame(G); if (lame) return lame;
            const bite = rollPonyBite(G); if (bite) return bite;
            // Crebain — Saruman's spies (variant on spy event)
            if (Math.random() < 0.04) {
              G.spyFlag = true;
              G.sarumanCounter = (G.sarumanCounter || 0) + 1;
              return {
                title: 'Crebain from Dunland',
                text:  'A flock of black crows swept low overhead, circled twice, and sped south. Saruman\'s spies, surely.',
                aftermath: 'Saruman knows where you are.',
                bad:   true,
              };
            }
            // Road dangers — wilderness rates. Only spy/watch events bump
            // the Saruman counter (brigands are just thugs, not necessarily
            // Saruman's eyes — though they leave you tracked).
            const road = rollRoadDangers(G, 'wilderness');
            if (road && (road.title === 'Watched from the hedgerow' || road.title === 'Spies on the road')) {
              G.sarumanCounter = (G.sarumanCounter || 0) + 1;
            }
            return road;
          },
        },
      ];
    },
  },

  // ── Fords of Isen ────────────────────────────────────────────────
  //
  // Crossing into Rohan. If sarumanCounter >= 3, Uruk-hai ambush is
  // GUARANTEED at the crossing — the bad ambush per design.
  //
  'Fords of Isen': {
    title: 'The Fords of Isen',
    body: (G) => {
      const depth = G.pathFlags.isenDepth || 4;
      const sc = G.sarumanCounter || 0;
      let s = 'The Isen runs cold and broad. Currently ' + depth + ' ft at the fords.';
      if (sc >= 3) s += '\n\nThere is movement on the far bank. Black shapes. Many of them.';
      return s;
    },
    routes: (G) => {
      const depth = G.pathFlags.isenDepth || 4;
      const sc = G.sarumanCounter || 0;
      const sarumanAmbush = sc >= 3;

      const cross = {
        label: sarumanAmbush ? 'Cross — they\'re waiting' : 'Cross the Fords',
        note:  depth + ' ft · ' + (sarumanAmbush ? 'Uruk-hai are on the far bank!' : Math.round(fordRisk(depth) * 100) + '% chance of trouble'),
        to:    'Edoras',
        apply: (G) => {
          // Normal ford risk first
          const risk = fordRisk(depth);
          if (Math.random() < risk) {
            const lost = rand(20, 40);
            G.supplies.food = Math.max(0, G.supplies.food - lost);
            UI.log('The fords were rougher than they looked. −' + lost + ' lbs food.', 'bad');
          } else {
            UI.log('Crossed the Fords of Isen.', 'good');
          }
          // Then guaranteed ambush if counter is high
          if (sarumanAmbush) {
            window._isenUrukhaiAmbush = true;
          }
        },
      };

      return [
        cross,
        {
          label: 'Wait a day for better water',
          note:  'Re-roll depth · Saruman gets closer',
          to:    null,
          _wait: true,
        },
      ];
    },
  },

  // ── Leaving Lothlórien ────────────────────────────────────────────
  // ── Lothlórien — fort ────────────────────────────────────────────
  //
  // Same idea as Rivendell: free rest, free food at the inn (no food cost),
  // 'See Galadriel' option that costs 1 day, full heals, cures all illness,
  // AND grants the Phial of Galadriel (helps later vs Shelob/Mordor).
  // Leaving chains to 'Lothlórien South' to choose Anduin or Fangorn.
  //
  'Lothlórien': {
    title: 'Lothlórien — the Golden Wood',
    body: (G) => {
      let s = 'Mallorn-leaves overhead, gold against the sky. The Galadhrim watch in silence. There is wine and bread and time slowing down.';
      if (Object.keys(G.illnesses).length > 0) s += '\n\nGaladriel\'s healers are nearby.';
      if (G.pathFlags.phialOfGaladriel) s += '\n\nThe Phial sits in your pack, faintly bright.';
      return s;
    },
    routes: (G) => {
      return [
        {
          label: 'Rest a day',
          note:  'Free · +15 health · no food cost',
          _chainTo: 'Lothlórien',
          apply: (G) => {
            G.day += 1;
            healAll(15);
            if (G.pathFlags.ponyBittenAt != null) {
              G.pathFlags.ponyBittenAt = null;
              UI.log('The bitten pony recovered in the Galadhrim stables.', 'good');
            }
            Object.keys(G.illnesses).forEach(n => {
              if (G.illnesses[n] === 'exhaustion') delete G.illnesses[n];
            });
            UI.log('Rested a day in Lothlórien. All +15 health.', 'good');
          },
        },
        {
          label: 'See Galadriel',
          note:  '1 day · cures all illness · all +30 health',
          _chainTo: 'Lothlórien',
          apply: (G) => {
            G.day += 1;
            G.illnesses = {};
            healAll(30);
            if (G.pathFlags.ponyBittenAt != null) G.pathFlags.ponyBittenAt = null;
            UI.log('Galadriel tended to the wounded. All illness gone. All +30 health.', 'good');
          },
        },
        {
          label: G.pathFlags.phialOfGaladriel ? 'Already received the Phial' : 'Pour Galadriel a drink for the Phial',
          note:  G.pathFlags.phialOfGaladriel ? 'Already given' : '−10% brew · 1 day · cures all · +30 hp · gain the Phial',
          _chainTo: 'Lothlórien',
          disabled: !!G.pathFlags.phialOfGaladriel,
          requires: (G) => !G.pathFlags.phialOfGaladriel && G.beer >= 10,
          requiresNote: G.pathFlags.phialOfGaladriel ? 'Already received' : 'Not enough brew (need 10%)',
          apply: (G) => {
            G.day += 1;
            G.beer -= 10;
            G.illnesses = {};
            healAll(30);
            if (G.pathFlags.ponyBittenAt != null) G.pathFlags.ponyBittenAt = null;
            G.pathFlags.phialOfGaladriel = true;
            G.brewSharedWith.push('Galadriel');
            addNote('poured for Galadriel under the mallorn-trees');
            UI.log('Galadriel drank and smiled. She pressed the Phial into your hands. −10% brew · Phial gained.', 'good');
          },
        },
        {
          label: 'Leave Lothlórien',
          note:  'Choose your path south',
          _chainTo: 'Lothlórien South',
        },
      ];
    },
  },

  // ── Lothlórien South — choose path ────────────────────────────────
  //
  // Both routes converge at Edoras. Anduin is faster (boats), Fangorn is
  // slower but no rivers to cross.
  //
  'Lothlórien South': {
    title: 'South from Lothlórien — choose your road',
    body:  'Two roads. Sail the Anduin south, or walk through the strange forest of Fangorn.',
    routes: (G) => {
      return [
        {
          label: 'Sail down the Anduin',
          note:  'Faster · river · boats from the Galadhrim',
          to:    'Argonath',
          apply: (G) => {
            G.pathFlags.route = 'anduin';
            UI.log('Galadhrim brought elven boats. Pushed off into the river.', 'dim');
          },
          modifier: { eventRate: 0.16, goodBias: 0.45, flavor: 'river' },
          dailyRoll: (G) => {
            // Orc-arrow ambush — 6%/day, full decision encounter
            if (Math.random() < 0.04) {
              return buildAnduinOrcAmbush();
            }
            // Supplies dropped overboard — 5%/day
            if (Math.random() < 0.05) {
              const lost = rand(20, 50);
              G.supplies.food = Math.max(0, G.supplies.food - lost);
              return {
                title: 'A pack went over the side',
                text:  'A boat tipped on a current. A bundle slipped into the river before you could grab it.',
                aftermath: '−' + lost + ' lbs food.',
                bad:   true,
              };
            }
            // Calm water — 5%/day positive
            if (Math.random() < 0.05) {
              healAll(3);
              return {
                title: 'A still stretch of river',
                text:  'The water ran flat for hours. Drifted easy, ate well, watched the banks.',
                aftermath: 'All +3 health.',
                bad:   false,
              };
            }
            return null;
          },
        },
        {
          label: 'Walk south through Fangorn',
          note:  'Slower · strange forest · no river crossings',
          to:    'Fangorn',
          apply: (G) => {
            G.pathFlags.route = 'fangorn';
            UI.log('Turned south on foot, into the eaves of Fangorn.', 'dim');
          },
          modifier: { eventRate: 0.14, goodBias: 0.45, flavor: 'forest' },
          dailyRoll: (G) => {
            const lame = rollPonyLame(G); if (lame) return lame;
            const bite = rollPonyBite(G); if (bite) return bite;
            // Approach to Fangorn — light hazards
            if (Math.random() < 0.04) {
              G.day += 1;
              return {
                title: 'Tangled paths',
                text:  'The land between Lothlórien and Fangorn is broken. Lost half a day finding a way through.',
                aftermath: '+1 day.',
                bad:   true,
              };
            }
            return null;
          },
        },
      ];
    },
  },

  // ── Argonath — pillar of kings, exit point on the river ──────────
  //
  // Pure landmark. From here, you walk west across the Eastfold, ford
  // the Entwash, and arrive at Edoras.
  //
  'Argonath': {
    title: 'The Argonath',
    body:  'Two great stone kings rise from the river, hands raised in warning. The boats can go no further — Rauros falls thunder downriver. Time to walk.',
    routes: (G) => {
      return [
        {
          label: 'Walk west across the Eastfold',
          note:  'Open grassland · then the Entwash to ford',
          to:    'Entwash',
          apply: (G) => {
            UI.log('Beached the boats. Began the walk west across the grass.', 'dim');
          },
          modifier: { eventRate: 0.16, goodBias: 0.5, flavor: 'plains' },
          dailyRoll: (G) => {
            const lame = rollPonyLame(G); if (lame) return lame;
            const bite = rollPonyBite(G); if (bite) return bite;
            // Snake — 2% (dry grass)
            if (Math.random() < 0.02) {
              const v = damageRandom(rand(8, 18));
              return {
                title: 'Snake in the grass',
                text:  (v ? v.name : 'Someone') + ' was struck by a serpent in the long grass.',
                aftermath: 'Companion injured.',
                bad:   true,
              };
            }
            // Lost in tall grass — 3%
            if (Math.random() < 0.03) {
              G.day += 1;
              return {
                title: 'Lost in the grass',
                text:  'The grass is taller than a horse here. Walked half a day in a circle.',
                aftermath: '+1 day.',
                bad:   true,
              };
            }
            // Dry day — 3% (heat exhaustion / no water)
            if (Math.random() < 0.03) {
              damageAll(rand(3, 6));
              return {
                title: 'No water',
                text:  'No streams in this country. The party is parched by sundown.',
                aftermath: 'All injured.',
                bad:   true,
              };
            }
            // Rohirrim patrol — 4% (positive)
            if (Math.random() < 0.04) {
              const food = rand(20, 40);
              G.supplies.food += food;
              return {
                title: 'Rohirrim patrol',
                text:  'A band of riders crested the rise. They watched a long moment, then shared what they had.',
                aftermath: '+' + food + ' lbs food.',
                bad:   false,
              };
            }
            return null;
          },
        },
      ];
    },
  },

  // ── Entwash — final river crossing before Edoras (Anduin path) ────
  //
  // Standard depth-based ford. Wait re-rolls.
  //
  'Entwash': {
    title: 'The Entwash',
    body: (G) => {
      const depth = G.pathFlags.entwashDepth || 3;
      return 'A wide green river running south to the Anduin. Currently ' + depth + ' ft at the ford.';
    },
    routes: (G) => {
      const depth = G.pathFlags.entwashDepth || 3;
      return [
        {
          label: 'Ford the Entwash',
          note:  depth + ' ft · ' + Math.round(fordRisk(depth) * 100) + '% chance of trouble',
          to:    'Edoras',
          apply: (G) => {
            const risk = fordRisk(depth);
            if (Math.random() < risk) {
              const lost = rand(15, 35);
              G.supplies.food = Math.max(0, G.supplies.food - lost);
              UI.log('The Entwash took some packs. −' + lost + ' lbs food.', 'bad');
            } else {
              UI.log('Forded the Entwash without trouble. Edoras is in sight.', 'good');
            }
          },
        },
        {
          label: 'Wait a day for better water',
          note:  'Re-roll depth',
          to:    null,
          _wait: true,
        },
      ];
    },
  },

  // ── Fangorn forest ───────────────────────────────────────────────
  //
  // Treated like the Old Forest. Good chance to get lost, ent encounter
  // possible (10% per day, capped 1 per leg, 50/50 friendly).
  // No rivers to cross. No Barrow Downs analog.
  //
  'Fangorn': {
    title: 'Fangorn — the strange forest',
    body:  'Old trees. Older than the Shire. The light is green and the air does not move quite right.',
    routes: (G) => {
      return [
        {
          label: 'Press south through Fangorn',
          note:  'On to the Westemnet · then to Edoras',
          to:    'Edoras',
          apply: (G) => {
            G.pathFlags._fangornEntMet = false;
          },
          modifier: { eventRate: 0.14, goodBias: 0.4, flavor: 'forest' },
          dailyRoll: (G) => {
            const lame = rollPonyLame(G); if (lame) return lame;
            const bite = rollPonyBite(G); if (bite) return bite;
            // PHASE: in the forest first (~half the leg, by mileage)
            // Fangorn at mile 1400, Edoras at 1700 — halfway is ~1550.
            const inForest = G.miles < 1550;
            if (inForest) {
              // Ent encounter — 12% per day, capped 1 per leg
              if (!G.pathFlags._fangornEntMet && Math.random() < 0.12) {
                G.pathFlags._fangornEntMet = true;
                if (Math.random() < 0.5) {
                  // Friendly — Ent draught
                  G.companions.forEach(c => { if (c.health > 0) c.health = c.maxHealth; });
                  G.health = G.maxHealth;
                  G.pathFlags.entDraught = true;
                  addNote('green and earthy, an old taste');
                  return {
                    title: 'A friendly Ent',
                    text:  'A great voice spoke from what you took for a tree. He listened to your road and your purpose, and offered a draught from a stone bowl.',
                    aftermath: 'All fully healed · ent draught remembered.',
                    bad:   false,
                  };
                } else {
                  // Wary — walks past
                  return {
                    title: 'A wary Ent',
                    text:  'A great shape watched from the trees a long time. Eventually it turned and walked away without a word.',
                    aftermath: 'Felt small.',
                    bad:   false,
                  };
                }
              }
              // Lost in the forest — 4%
              if (Math.random() < 0.04) {
                G.day += 1;
                return {
                  title: 'Lost in Fangorn',
                  text:  'Trees that were one place a moment ago are somewhere else now. Half a day gone before the way opened again.',
                  aftermath: '+1 day.',
                  bad:   true,
                };
              }
              // Tree injury — 4%
              if (Math.random() < 0.04) {
                const v = damageRandom(rand(6, 12));
                return {
                  title: 'A grasping branch',
                  text:  'A bough swung low and caught ' + (v ? v.name : 'someone') + ' across the shoulder.',
                  aftermath: 'Companion injured.',
                  bad:   true,
                };
              }
            } else {
              // PHASE: out of forest, on the Westemnet (open grassland)
              // Snake — 2%
              if (Math.random() < 0.02) {
                const v = damageRandom(rand(8, 16));
                return {
                  title: 'Snake in the grass',
                  text:  (v ? v.name : 'Someone') + ' was struck by a serpent in the tall grass.',
                  aftermath: 'Companion injured.',
                  bad:   true,
                };
              }
              // Lost — 3%
              if (Math.random() < 0.03) {
                G.day += 1;
                return {
                  title: 'Lost in tall grass',
                  text:  'No landmarks here. Walked half a day in the wrong direction.',
                  aftermath: '+1 day.',
                  bad:   true,
                };
              }
              // Sheltered camp — 4% positive
              if (Math.random() < 0.04) {
                healAll(3);
                return {
                  title: 'Sheltered camp',
                  text:  'Found a hollow out of the wind. A real night\'s sleep.',
                  aftermath: 'All +3 health.',
                  bad:   false,
                };
              }
              // Rohirrim patrol — 4%
              if (Math.random() < 0.04) {
                const food = rand(20, 40);
                G.supplies.food += food;
                return {
                  title: 'Rohirrim patrol',
                  text:  'A band of riders met you on the plain. They shared rations and pointed the way to Edoras.',
                  aftermath: '+' + food + ' lbs food.',
                  bad:   false,
                };
              }
            }
            return null;
          },
        },
      ];
    },
  },

  // ── Edoras — fort ────────────────────────────────────────────────
  //
  // Like Bree: paid rest at the Golden Hall, trade, then leave east toward
  // Minas Tirith.
  //
  'Edoras': {
    title: 'Edoras — the Golden Hall',
    body: (G) => {
      return 'Meduseld stands on its hill, thatch gold in the late sun. The Riders of Rohan watch the keg with curiosity. The road east leads to Minas Tirith.';
    },
    routes: (G) => {
      return [
        {
          label: 'Stay at Meduseld',
          note:  '8 coin/day · +12 hp/day · illness damage halved · no food cost',
          _chainTo: 'Edoras',
          requires: (G) => G.supplies.coin >= 8,
          requiresNote: 'Not enough coin (need 8)',
          apply: (G) => {
            G.day += 1;
            G.supplies.coin -= 8;
            healAll(12);
            Object.entries(G.illnesses).forEach(([name, id]) => {
              const ill = ILLNESSES.find(i => i.id === id);
              if (!ill) return;
              const recover = Math.ceil(ill.dmg / 2);
              if (name === G.playerName) G.health = Math.min(G.maxHealth, G.health + recover);
              else {
                const c = G.companions.find(c => c.name === name);
                if (c && c.health > 0) c.health = Math.min(c.maxHealth, c.health + recover);
              }
            });
            if (G.pathFlags.ponyBittenAt != null) {
              G.pathFlags.ponyBittenAt = null;
              UI.log('The bitten pony recovered in the king\'s stables.', 'good');
            }
            UI.log('Stayed a night at Meduseld. −8 coin · +12 health.', 'good');
          },
        },
        {
          label: G.pathFlags.rohirrimEscort ? 'Théoden has already pledged an escort' : 'Pour Théoden a drink',
          note:  G.pathFlags.rohirrimEscort ? 'Already received' : '−12% brew · Rohirrim escort to Minas Tirith',
          _chainTo: 'Edoras',
          disabled: !!G.pathFlags.rohirrimEscort,
          requires: (G) => !G.pathFlags.rohirrimEscort && G.beer >= 12,
          requiresNote: G.pathFlags.rohirrimEscort ? 'Already pledged' : 'Not enough brew (need 12%)',
          apply: (G) => {
            G.beer -= 12;
            G.pathFlags.rohirrimEscort = true;
            G.brewSharedWith.push('Théoden King');
            addNote('poured for the king in the Golden Hall');
            UI.log('Théoden drank slowly and called for his riders. "You will have an escort to the White City." −12% brew.', 'good');
          },
        },
        {
          label: 'Leave Edoras',
          note: (G) => G.pathFlags.rohirrimEscort ? 'Ride east · Rohirrim escort · safer road' : 'Ride east toward Minas Tirith',
          to:    'Minas Tirith',
          apply: (G) => {
            if (G.pathFlags.rohirrimEscort) {
              UI.log('Rode east with a column of Rohirrim. The road feels safer.', 'good');
            } else {
              UI.log('Rode east out of Edoras toward Minas Tirith.', 'dim');
            }
          },
          modifier: { eventRate: 0.16, goodBias: 0.5, flavor: 'plains' },
          dailyRoll: (G) => {
            // If escorted, halve all bad-event chances
            const escorted = !!G.pathFlags.rohirrimEscort;
            const road = rollRoadDangers(G, 'eriador');
            if (road) {
              if (escorted && road.decision && Math.random() < 0.5) return null; // escort deflects ambush
              return road;
            }
            const lame = rollPonyLame(G); if (lame) return lame;
            const bite = rollPonyBite(G); if (bite) return bite;
            // Snake — 2% (1% if escorted)
            if (Math.random() < (escorted ? 0.01 : 0.02)) {
              const v = damageRandom(rand(8, 18));
              return {
                title: 'Snake in the grass',
                text:  (v ? v.name : 'Someone') + ' was bitten in the long roadside grass.',
                aftermath: 'Companion injured.',
                bad:   true,
              };
            }
            // Wagon wheel — 4%
            if (Math.random() < 0.04) {
              if (G.supplies.parts > 0) {
                G.supplies.parts--;
                return {
                  title: 'A pony loses a shoe',
                  text:  'A pony threw a shoe on a flint-rock. Your cooper fitted a spare.',
                  aftermath: '−1 spare part.',
                  bad:   false,
                };
              }
              G.day += 1;
              return {
                title: 'Wagon repair',
                text:  'A wheel split. Lost a day patching it with what you had.',
                aftermath: '+1 day.',
                bad:   true,
              };
            }
            // Trader — 6%
            if (Math.random() < 0.06) {
              const food = rand(30, 60);
              const coin = rand(8, 18);
              G.supplies.food += food;
              G.supplies.coin += coin;
              G.pathFlags._traderUntilDay = G.day;
              return {
                title: 'Trader on the road',
                text:  'A wagon out of the south, headed for Edoras. Friendly, fair prices.',
                aftermath: '+' + food + ' lbs food · +' + coin + ' coin.',
                bad:   false,
              };
            }
            // Sheltered camp — 4% positive
            if (Math.random() < 0.04) {
              healAll(3);
              return {
                title: 'Sheltered camp',
                text:  'Found a stand of trees out of the wind. A good night\'s sleep.',
                aftermath: 'All +3 health.',
                bad:   false,
              };
            }
            return null;
          },
        },
      ];
    },
  },

  // ── Minas Tirith — fort ──────────────────────────────────────────
  //
  // Like Edoras: paid stay heals + halves illness damage. Then 'Leave'
  // chains to a path-commit fork (no turning back from Mordor choice).
  //
  'Minas Tirith': {
    title: 'Minas Tirith — the White City',
    body:  'Tier upon tier of stone walls. The Tower of Ecthelion bright in the morning. Beyond the Pelennor, the dark line of the Ephel Dúath.',
    routes: (G) => {
      return [
        {
          label: 'Stay in the Citadel',
          note:  '8 coin/day · +12 hp/day · illness damage halved · no food cost',
          _chainTo: 'Minas Tirith',
          requires: (G) => G.supplies.coin >= 8,
          requiresNote: 'Not enough coin (need 8)',
          apply: (G) => {
            G.day += 1;
            G.supplies.coin -= 8;
            healAll(12);
            Object.entries(G.illnesses).forEach(([name, id]) => {
              const ill = ILLNESSES.find(i => i.id === id);
              if (!ill) return;
              const recover = Math.ceil(ill.dmg / 2);
              if (name === G.playerName) G.health = Math.min(G.maxHealth, G.health + recover);
              else {
                const c = G.companions.find(c => c.name === name);
                if (c && c.health > 0) c.health = Math.min(c.maxHealth, c.health + recover);
              }
            });
            if (G.pathFlags.ponyBittenAt != null) G.pathFlags.ponyBittenAt = null;
            UI.log('Stayed a night in the Citadel. −8 coin · +12 health.', 'good');
          },
        },
        {
          label: 'Leave Minas Tirith',
          note:  'Choose your road into Mordor',
          _chainTo: 'Minas Tirith South',
        },
      ];
    },
  },

  // ── Choose your Mordor path (commits) ─────────────────────────────
  //
  // All three roads commit. No turning back. Sets G.pathFlags.inMordor
  // which blocks hunting and arms the ent draught auto-trigger.
  //
  'Minas Tirith South': {
    title: 'Three Roads into Mordor — choose your path',
    body: (G) => {
      let s = 'Three roads. None safe. Once you commit, you cannot turn back.';
      if (G.supplies.food < 200) s += '\n\nYour food is low. Hunting will not work in Mordor.';
      return s;
    },
    routes: (G) => {
      return [
        {
          label: 'North — Dead Marshes to the Black Gate',
          note:  'Medium length · haunted water · then the Gate',
          to:    'Dead Marshes',
          apply: (G) => {
            G.pathFlags.route = 'morannon';
            G.pathFlags.inMordor = true;
            UI.log('Set out north toward the Dead Marshes.', 'dim');
          },
          modifier: { eventRate: 0.16, goodBias: 0.4, flavor: 'wild' },
          dailyRoll: (G) => {
            const lame = rollPonyLame(G); if (lame) return lame;
            const bite = rollPonyBite(G); if (bite) return bite;
            return null;
          },
        },
        {
          label: 'East — past Minas Morgul, up Cirith Ungol',
          note:  'Shortest · stairs · spiders · no turning back',
          to:    'Minas Morgul',
          apply: (G) => {
            G.pathFlags.route = 'cirith';
            G.pathFlags.inMordor = true;
            G.day -= 8; // shortest path — cuts significant time
            UI.log('Set out east on the Morgul road. The shortest way.', 'dim');
          },
          modifier: { eventRate: 0.16, goodBias: 0.4, flavor: 'mountain' },
          dailyRoll: (G) => {
            const lame = rollPonyLame(G); if (lame) return lame;
            const bite = rollPonyBite(G); if (bite) return bite;
            return null;
          },
        },
        {
          label: 'South — Crossings of Poros, Nargil Pass, through Nurn',
          note:  'Longest · river ford · pass · slave country',
          to:    'Crossings of Poros',
          apply: (G) => {
            G.pathFlags.route = 'nargil';
            G.pathFlags.inMordor = true;
            G.day += 8; // longest path — much more time on the road
            UI.log('Set out south, the long way around.', 'dim');
          },
          modifier: { eventRate: 0.14, goodBias: 0.45, flavor: 'wild' },
          dailyRoll: (G) => {
            const lame = rollPonyLame(G); if (lame) return lame;
            const bite = rollPonyBite(G); if (bite) return bite;
            return null;
          },
        },
      ];
    },
  },

  // ── PATH A: NORTH ────────────────────────────────────────────────
  //
  // Dead Marshes leg → arrive at Black Gate landmark → sneak past or fight
  // Then converge at Plateau of Gorgoroth.
  //
  'Dead Marshes': {
    title: 'The Dead Marshes',
    body:  'Pale lights under the water. Faces. The path between is narrow and uncertain.',
    routes: (G) => {
      return [
        {
          label: 'Push north through the marshes',
          note:  'Toward the Black Gate',
          to:    'Black Gate',
          modifier: { eventRate: 0.18, goodBias: 0.3, flavor: 'marsh' },
          dailyRoll: (G) => {
            // Visions in the water — 4%, illness chance
            if (Math.random() < 0.04) {
              const alive = livingMembers();
              const unhealthy = alive.filter(p => !G.illnesses[p.name]);
              if (unhealthy.length > 0) {
                const t = pick(unhealthy);
                G.illnesses[t.name] = 'fever';
                return {
                  title: 'Faces under the water',
                  text:  t.name + ' looked too long into the pools. The fever caught them by morning.',
                  aftermath: t.name + ' has Marsh Fever.',
                  bad:   true,
                };
              }
            }
            // Lost on the path — 4%
            if (Math.random() < 0.04) {
              G.day += 1;
              return {
                title: 'Lost on the marsh path',
                text:  'The path vanished into bog. Backtracked half a day to find it again.',
                aftermath: '+1 day.',
                bad:   true,
              };
            }
            // Pulled in — 3%
            if (Math.random() < 0.03) {
              const v = damageRandom(rand(8, 14));
              const lost = rand(10, 25);
              G.supplies.food = Math.max(0, G.supplies.food - lost);
              return {
                title: 'Into the pool',
                text:  (v ? v.name : 'Someone') + ' missed the path and went in to the chest. Some packs lost.',
                aftermath: 'Companion injured · −' + lost + ' lbs food.',
                bad:   true,
              };
            }
            // Nazgûl flying overhead — 3% (no damage if you crouch in time)
            if (Math.random() < 0.03) {
              return {
                title: 'A shadow overhead',
                text:  'A winged shape passed low over the marsh. Lay flat in the reeds until it was gone.',
                aftermath: 'Held breath. No damage.',
                bad:   false,
              };
            }
            return null;
          },
        },
      ];
    },
  },

  // Black Gate — decision: sneak around (slow, ok) or charge (catastrophic)
  // Sneaking takes you west and around to the Morannon, then south to Gorgoroth.
  'Black Gate': {
    title: 'The Black Gate',
    body:  'The Morannon. Two great iron towers and a wall like a cliff. Patrols of orcs everywhere.',
    routes: (G) => {
      return [
        {
          label: 'Sneak west around the Morannon',
          note:  '+2 days · careful',
          to:    'Plateau of Gorgoroth',
          apply: (G) => {
            G.day += 2;
            UI.log('Crawled west through the gullies. Two nights of moving in the dark.', 'dim');
          },
          modifier: { eventRate: 0.12, goodBias: 0.35, flavor: 'dark' },
          dailyRoll: (G) => {
            // Orc patrol — 3%
            if (Math.random() < 0.03) {
              const v = damageRandom(rand(6, 12));
              return {
                title: 'Orc patrol',
                text:  'A small band came up the gully. Drove them off in the dark. ' + (v ? v.name : 'Someone') + ' was wounded.',
                aftermath: 'Companion injured.',
                bad:   true,
              };
            }
            return null;
          },
        },
        {
          label: 'Charge the gate',
          note:  'Suicidal · the gate is held by an army',
          to:    'Plateau of Gorgoroth',
          apply: (G) => {
            // Brutal damage to all, possible companion death
            damageAll(rand(25, 40));
            const v = damageRandom(rand(30, 50));
            UI.log('Charged the Morannon. Did not get far. ' + (v ? v.name : 'Someone') + ' fell.', 'bad');
            // 60% one companion dies
            if (Math.random() < 0.6) {
              const alive = G.companions.filter(c => c.health > 0);
              if (alive.length > 0) {
                const dead = pick(alive);
                dead.health = 0; dead.status = 'dead';
                window._pendingDeath = dead.name;
              }
            }
          },
          modifier: { eventRate: 0.20, goodBias: 0.2, flavor: 'dark' },
        },
      ];
    },
  },

  // ── PATH B: EAST (CIRITH UNGOL) ──────────────────────────────────
  //
  // Minas Morgul (creep past the Witch-king) → Cirith Ungol stair (climb) → Shelob → Plateau.
  //
  'Minas Morgul': {
    title: 'Minas Morgul',
    body:  'A green-witch light from the windows. The bridge to the city is empty. The road turns up into the mountains.',
    routes: (G) => {
      return [
        {
          label: 'Creep past the city in darkness',
          note:  'Slow · risky · gets you to the stairs',
          to:    'Cirith Ungol',
          apply: (G) => {
            UI.log('Crept past the bridge with held breath. The light did not turn.', 'dim');
          },
          modifier: { eventRate: 0.15, goodBias: 0.3, flavor: 'dark' },
          dailyRoll: (G) => {
            // Wraith-light — 6%
            if (Math.random() < 0.06) {
              damageAll(rand(2, 6));
              return {
                title: 'Wraith-light from the city',
                text:  'A pulse of green light from the tower. The keg shivered. Everyone felt cold to the bone.',
                aftermath: 'All injured.',
                bad:   true,
              };
            }
            // Falling rocks on the stair — 6%
            if (Math.random() < 0.06) {
              const v = damageRandom(rand(6, 12));
              return {
                title: 'Loose stone on the stair',
                text:  'A step gave way under ' + (v ? v.name : 'someone') + '. They caught themselves but it cost a hand.',
                aftermath: 'Companion injured.',
                bad:   true,
              };
            }
            // Frostbite from the cold mountain air — 5%
            if (Math.random() < 0.05) {
              const alive = livingMembers();
              const unhealthy = alive.filter(p => !G.illnesses[p.name]);
              if (unhealthy.length > 0) {
                const t = pick(unhealthy);
                G.illnesses[t.name] = 'frostbite';
                return {
                  title: 'Cold of the high stairs',
                  text:  t.name + '\'s hands went numb on the rock.',
                  aftermath: t.name + ' has Frostbite.',
                  bad:   true,
                };
              }
            }
            return null;
          },
        },
      ];
    },
  },

  // Cirith Ungol — Shelob encounter at the top, then descent to the Plateau
  'Cirith Ungol': {
    title: 'Cirith Ungol',
    body: (G) => {
      let s = 'A black tunnel cuts through the mountain. The smell is unbearable. There is something living in here.';
      if (G.pathFlags.phialOfGaladriel) s += '\n\nThe Phial in your pack glows steady, even in this dark.';
      return s;
    },
    routes: (G) => {
      return [
        {
          label: 'Through the tunnel',
          note:  G.pathFlags.phialOfGaladriel ? 'The Phial will help' : 'No light · hard fight ahead',
          _chainTo: 'Cirith Ungol Shelob',
          apply: (G) => {
            // Shelob will fire next via the chained fork
          },
        },
      ];
    },
  },

  // Shelob virtual fork — presents the Shelob decision then continues to Plateau
  'Cirith Ungol Shelob': {
    title: 'Shelob in the Dark',
    body: (G) => {
      let s = 'Eyes the size of plates. A great spider, ancient and hungry. She comes for the keg.';
      if (G.pathFlags.phialOfGaladriel) s += '\n\nYou raise the Phial. She recoils from the light.';
      return s;
    },
    routes: (G) => {
      const havePhial = !!G.pathFlags.phialOfGaladriel;
      const haveSwords = !!G.pathFlags.dunedainSwords;
      const haveStrider = !!G.pathFlags.metStrider;
      return [
        {
          label: havePhial ? 'Raise the Phial and drive her back' : 'Stand and fight',
          note:  havePhial ? 'The light blinds her' : haveSwords ? 'Swords will help' : 'No light, no advantage',
          to:    'Mount Doom',
          apply: (G) => {
            if (havePhial) {
              // No phial: brutal damage, companion injury, possible death
              damageAll(rand(15, 25));
              let dmg = rand(25, 40);
              if (haveStrider) dmg = Math.max(10, dmg - 8);
              if (haveSwords) dmg = Math.max(8, dmg - 5);
              const v = damageRandom(dmg);
              UI.log('Fought Shelob in the dark. ' + (v ? v.name : 'Someone') + ' was badly wounded.', 'bad');
              // 35% chance one companion dies
              if (Math.random() < 0.35) {
                const alive = G.companions.filter(c => c.health > 0);
                if (alive.length > 0) {
                  const dead = pick(alive);
                  dead.health = 0; dead.status = 'dead';
                  window._pendingDeath = dead.name;
                }
              }
              // 50% Morgul-blade-style infection
              if (v && Math.random() < 0.5 && !G.illnesses[v.name]) {
                G.illnesses[v.name] = 'infection';
                UI.log('Shelob\'s sting. ' + v.name + ' has a wound that will not close.', 'bad');
              }
            }
          },
          modifier: { eventRate: 0.10, goodBias: 0.3, flavor: 'dark' },
          dailyRoll: (G) => {
            // Light hazards on the descent into Gorgoroth
            if (Math.random() < 0.04) {
              const v = damageRandom(rand(6, 12));
              return {
                title: 'Orc patrol on the pass',
                text:  'Goblin tower-guards. Driven off. ' + (v ? v.name : 'Someone') + ' was wounded.',
                aftermath: 'Companion injured.',
                bad:   true,
              };
            }
            return null;
          },
        },
      ];
    },
  },

  // ── PATH C: SOUTH (NARGIL PASS / NURN) ───────────────────────────
  //
  // Crossings of Poros (river ford) → Nargil Pass → Nurn → Plateau.
  //
  'Crossings of Poros': {
    title: 'The Crossings of Poros',
    body: (G) => {
      const depth = G.pathFlags.porosDepth || 3;
      return 'A small river running west out of the Ephel Dúath. Currently ' + depth + ' ft at the ford.';
    },
    routes: (G) => {
      const depth = G.pathFlags.porosDepth || 3;
      return [
        {
          label: 'Ford the Poros',
          note:  depth + ' ft · ' + Math.round(fordRisk(depth) * 100) + '% chance of trouble',
          _chainTo: 'Nargil Pass',
          apply: (G) => {
            const risk = fordRisk(depth);
            if (Math.random() < risk) {
              const lost = rand(15, 35);
              G.supplies.food = Math.max(0, G.supplies.food - lost);
              UI.log('Forded the Poros. Some packs swept away. −' + lost + ' lbs food.', 'bad');
            } else {
              UI.log('Forded the Poros without trouble.', 'good');
            }
          },
        },
        {
          label: 'Wait a day for the water to drop',
          note:  'Re-roll depth',
          to:    null,
          _wait: true,
        },
      ];
    },
  },

  'Nargil Pass': {
    title: 'The Nargil Pass',
    body:  'A bare cleft through the southern Ephel Dúath. Cold, high, watched.',
    routes: (G) => {
      return [
        {
          label: 'Climb the pass into Nurn',
          note:  'Cold · steep · few patrols',
          to:    'Nurn',
          modifier: { eventRate: 0.14, goodBias: 0.4, flavor: 'mountain' },
          dailyRoll: (G) => {
            const lame = rollPonyLame(G); if (lame) return lame;
            const bite = rollPonyBite(G); if (bite) return bite;
            // Frostbite — 4%
            if (Math.random() < 0.04) {
              const alive = livingMembers();
              const unhealthy = alive.filter(p => !G.illnesses[p.name]);
              if (unhealthy.length > 0) {
                const t = pick(unhealthy);
                G.illnesses[t.name] = 'frostbite';
                return {
                  title: 'Frostbite on the pass',
                  text:  t.name + '\'s fingers went pale and numb in the wind.',
                  aftermath: t.name + ' has Frostbite.',
                  bad:   true,
                };
              }
            }
            // Lost in mist — 3%
            if (Math.random() < 0.03) {
              G.day += 1;
              return {
                title: 'Lost in the high mist',
                text:  'Cloud rolled up the pass and hid the way for half a day.',
                aftermath: '+1 day.',
                bad:   true,
              };
            }
            // Falling rock — 3%
            if (Math.random() < 0.03) {
              const v = damageRandom(rand(8, 14));
              return {
                title: 'Falling rock',
                text:  'Stone dislodged from above struck ' + (v ? v.name : 'someone') + '.',
                aftermath: 'Companion injured.',
                bad:   true,
              };
            }
            // Sheltered hollow — 4%
            if (Math.random() < 0.04) {
              healAll(3);
              return {
                title: 'Sheltered camp',
                text:  'Found a deep cleft out of the wind. A real night\'s sleep.',
                aftermath: 'All +3 health.',
                bad:   false,
              };
            }
            return null;
          },
        },
      ];
    },
  },

  'Nurn': {
    title: 'Nurn — the Slave Country',
    body:  'A great inland sea, with fields and slave-camps along the shore. The smoke of Orodruin to the north.',
    routes: (G) => {
      return [
        {
          label: 'Skirt the lake north toward the Plateau',
          note:  'Long way around · slave-driver patrols',
          to:    'Plateau of Gorgoroth',
          modifier: { eventRate: 0.16, goodBias: 0.35, flavor: 'wild' },
          dailyRoll: (G) => {
            const lame = rollPonyLame(G); if (lame) return lame;
            const bite = rollPonyBite(G); if (bite) return bite;
            // Slave-driver patrol — 4%
            if (Math.random() < 0.04) {
              const v = damageRandom(rand(8, 16));
              return {
                title: 'Slave-driver patrol',
                text:  'Mounted men with whips and short bows. Drove them off, but ' + (v ? v.name : 'someone') + ' was wounded.',
                aftermath: 'Companion injured.',
                bad:   true,
              };
            }
            // Snake — 3%
            if (Math.random() < 0.03) {
              const v = damageRandom(rand(8, 14));
              return {
                title: 'Snake in the rocks',
                text:  (v ? v.name : 'Someone') + ' was bitten reaching for a handhold.',
                aftermath: 'Companion injured.',
                bad:   true,
              };
            }
            // Foul water — 3%, illness
            if (Math.random() < 0.03) {
              const alive = livingMembers();
              const unhealthy = alive.filter(p => !G.illnesses[p.name]);
              if (unhealthy.length > 0) {
                const t = pick(unhealthy);
                G.illnesses[t.name] = 'dysentery';
                return {
                  title: 'Foul water',
                  text:  'The lake is poisoned by Mordor\'s smoke. ' + t.name + ' fell ill in the night.',
                  aftermath: t.name + ' has Dysentery.',
                  bad:   true,
                };
              }
            }
            // Hidden food cache from a slave's family — 3% (positive)
            if (Math.random() < 0.03) {
              const food = rand(20, 40);
              G.supplies.food += food;
              return {
                title: 'A hidden cache',
                text:  'A small bundle wedged in the rocks. A slave\'s hidden food. You take it and leave coin.',
                aftermath: '+' + food + ' lbs food.',
                bad:   false,
              };
            }
            return null;
          },
        },
      ];
    },
  },

  // ── Plateau of Gorgoroth (final convergence) → Mount Doom ────────
  //
  // All three paths funnel here. One last leg.
  //
  'Plateau of Gorgoroth': {
    title: 'The Plateau of Gorgoroth',
    body:  'A black plain of cinders. Orodruin smokes ahead, red at the heart.',
    routes: (G) => {
      return [
        {
          label: 'Cross the plateau by night',
          note:  'Slower · avoids the Eye',
          to:    'Mount Doom',
          apply: (G) => {
            G.day += 2;
            damageAll(rand(3, 6));
            UI.log('Crossed by night, in short stages. The cinders cut their feet.', 'dim');
          },
          modifier: { eventRate: 0.16, goodBias: 0.3, flavor: 'dark' },
          dailyRoll: (G) => {
            // Orc patrol — 4%
            if (Math.random() < 0.04) {
              const v = damageRandom(rand(8, 14));
              return {
                title: 'Orc patrol',
                text:  'A small troop crossed your path. Hid in the ash, and one of them found you. ' + (v ? v.name : 'Someone') + ' was wounded.',
                aftermath: 'Companion injured.',
                bad:   true,
              };
            }
            // Burning ash — 3%, all damage
            if (Math.random() < 0.03) {
              damageAll(rand(2, 5));
              return {
                title: 'Falling ash',
                text:  'The mountain spat. Hot ash on the wind, and nowhere to hide.',
                aftermath: 'All injured.',
                bad:   true,
              };
            }
            return null;
          },
        },
        {
          label: 'Push across in daylight',
          note:  'Fast · the Eye is awake',
          to:    'Mount Doom',
          apply: (G) => {
            damageAll(rand(5, 10));
            UI.log('Crossed in the open. The Eye saw you — the ground shook. Faster, now.', 'bad');
          },
          modifier: { eventRate: 0.20, goodBias: 0.25, flavor: 'dark' },
          dailyRoll: (G) => {
            if (Math.random() < 0.05) {
              const v = damageRandom(rand(8, 14));
              return {
                title: 'Orc patrol',
                text:  'Spotted in the open. Fought free. ' + (v ? v.name : 'Someone') + ' was wounded.',
                aftermath: 'Companion injured.',
                bad:   true,
              };
            }
            return null;
          },
        },
      ];
    },
  },
};
// ═══════════════════════════════════════════ ROUTE STATE
// G.currentRoute tracks the leg currently being traveled. Each day of travel
// the route's dailyRoll (if present) is called; it may return nothing, an
// event to show, or a decision to present.

function initRouteState() {
  G.currentRoute = null;
  G.routeDaysElapsed = 0;
}

// Called when the player picks a route from a fork
function setRoute(fromName, route) {
  if (route.apply) route.apply(G);

  // Set arrival point on route completion (used by next fork)
  G.arrivalPoint = route.arrivalPoint || null;

  G.currentRoute = {
    from: fromName,
    to: route.to,
    modifier: route.modifier || {},
    dailyRoll: route.dailyRoll || null,
    label: route.label,
  };
  G.routeDaysElapsed = 0;
}

// Called each day of the tick loop. Returns whatever dailyRoll returns
// (null, an event object, or a decision).
function routeTick() {
  if (!G.currentRoute) return null;
  G.routeDaysElapsed++;
  if (G.currentRoute.dailyRoll) {
    return G.currentRoute.dailyRoll(G);
  }
  return null;
}

// Returns the fork object for the current location, or null
function forkFor(landmarkName) {
  return FORKS[landmarkName] || null;
}

// Resolve fork.routes to an array (handle function form)
function forkRoutes(fork) {
  if (typeof fork.routes === 'function') return fork.routes(G);
  return fork.routes;
}

// Resolve fork.body to a string (handle function form)
function forkBody(fork) {
  if (typeof fork.body === 'function') return fork.body(G);
  return fork.body || '';
}

// Route-aware event roll: uses modifier.eventRate and goodBias
function rollEventForRoute() {
  const mod = G.currentRoute && G.currentRoute.modifier ? G.currentRoute.modifier : {};
  const rate = mod.eventRate != null ? mod.eventRate : 0.20;
  if (Math.random() > rate) return null;

  const flavor = mod.flavor || 'road';
  // Filter out events that don't make sense underground or in Mordor
  const outdoorOnly = ['rain', 'fog', 'good_weather', 'clear_stream', 'shortcut'];
  const wildOnly = ['wolves', 'ranger', 'thief']; // no wolves in mines, no rangers in Mordor
  const skipIds = [];
  if (flavor === 'dark') skipIds.push(...outdoorOnly, ...wildOnly, 'lame_pony');
  if (G.pathFlags.inMordor) skipIds.push('ranger', 'shortcut', 'clear_stream', 'good_weather');

  const goodBias = mod.goodBias != null ? mod.goodBias : 0.5;
  const pool = TRAVEL_EVENTS.filter(e => {
    if (skipIds.includes(e.id)) return false;
    return Math.random() < goodBias ? !e.bad : e.bad;
  });
  if (pool.length === 0) return null;
  const total = pool.reduce((s, e) => s + e.weight, 0);
  let r = Math.random() * total;
  for (const e of pool) { r -= e.weight; if (r <= 0) return e; }
  return pool[0];
}

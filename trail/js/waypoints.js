// ═══════════════════════════════════════════ SHIRE
window.chooseD1 = function (c) {
  G.pathFlags.d1 = c;
  if (c === 'road') {
    let pubDays = 0;
    const pubs = ['The Green Dragon', 'The Ivy Bush', 'The Golden Perch', 'The Floating Log'];
    const stopped = pubs.filter(() => Math.random() < 0.5);
    if (stopped.length) {
      pubDays = stopped.length * 1 + (stopped.includes('The Green Dragon') || stopped.includes('The Golden Perch') ? 1 : 0);
      log('Pub stops on the East Road: ' + stopped.join(', ') + '. +' + pubDays + ' day(s) lost.', 'bad');
    }
    addNote('unhurried, following familiar roads');
    travelTo(3 + pubDays, 'Brandywine River', decision2);
  } else {
    const roll = Math.random();
    if (roll < 0.25) {
      travelTo(2, 'Brandywine River', function () {
        log('Farmer chased us off his barley — lost an afternoon finding the path.', 'bad');
        decision2();
      });
    } else if (roll < 0.5) {
      const v = damageRandom(8);
      travelTo(3, 'Brandywine River', function () {
        log((v?.name || 'A companion') + ' exhausted by detour through Woodhall forest. +2 days.', 'bad');
        decision2();
      });
    } else {
      travelTo(1, 'Brandywine River', function () {
        log('Cross-country route clear — reached the Brandywine a full day ahead of the road.', 'good');
        decision2();
      });
    }
  }
};

// ═══ DECISION 2: BRANDYWINE CROSSING
function decision2() {
  G.location = 'Brandywine River'; addMiles(80);
  setScene('Brandywine River');
  log('Reached the Brandywine River.', 'landmark');
  showDecision(
    'Brandywine River — How do you cross?',
    'The river is wide. Three ways across.',
    [
      { label: 'Take the Bucklebury Ferry',   note: '20 coin · Safe crossing',            fn: () => chooseD2('ferry')  },
      { label: 'Cross the Brandywine Bridge', note: 'Free · 1–2 days extra',              fn: () => chooseD2('bridge') },
      { label: 'Wade across',                 note: 'Free · Risk of supply loss · Fast',  fn: () => chooseD2('wade')   },
    ]
  );
}
window.chooseD2 = function (c) {
  if (c === 'ferry') {
    if (G.supplies.coin >= 20) {
      G.supplies.coin -= 20;
      log('Took the Bucklebury Ferry. −20 coin. Safe crossing.', 'good');
      travelTo(1, 'Bree', () => travelStretch(1, decision3));
    } else {
      log('Not enough coin for the ferry (need 20).', 'bad');
      decision2();
    }
  } else if (c === 'bridge') {
    log('Crossed the Brandywine Bridge. Solid underfoot. Left the Shire behind.');
    travelTo(2, 'Bree', () => travelStretch(1, decision3));
  } else {
    const roll = Math.random();
    if (roll < 0.4) {
      const lost = rand(20,50); G.supplies.food = Math.max(0, G.supplies.food - lost);
      damageRandom(12);
      log(`Waded the Brandywine — current stronger than expected. ${lost} lbs food ruined.`, 'bad');
    } else if (roll < 0.65) {
      G.beer = Math.max(0, G.beer - rand(5,12));
      log('Waded the Brandywine — keg rolled in the current. Seal took a hit.', 'bad');
    } else {
      log('Waded the Brandywine — cold but intact. Everyone across.', 'good');
    }
    travelTo(1, 'Bree', () => travelStretch(1, decision3));
  }
};

// ═══ DECISION 3: OLD FOREST vs ROAD TO BREE
function decision3() {
  G.location = 'East of the Brandywine'; addMiles(50);
  showDecision(
    'East of the Brandywine — Which road to Bree?',
    'The main road north is safe but long. The Old Forest is shorter — but the trees there have a reputation.',
    [
      { label: 'Take the main road north to Bree', note: '2 days · Possible brigands or traders', fn: () => chooseD3('road')   },
      { label: 'Cut through the Old Forest',        note: '1 day saved · Strange things in the trees', fn: () => chooseD3('forest') },
    ]
  );
}
window.chooseD3 = function (c) {
  if (c === 'forest') {
    const roll = Math.random();
    if (roll < 0.35) {
      const v = damageRandom(20);
      log('Old Man Willow — ' + (v?.name||'a companion') + ' nearly dragged in before we pulled them free.', 'bad');
      travelTo(1, 'Bree', reachBree);
    } else if (roll < 0.5) {
      damageRandom(8);
      log('Lost in the Old Forest — paths twisted back. Two extra days, someone injured.', 'bad');
      travelTo(3, 'Bree', reachBree);
    } else {
      log('The Old Forest: trees murmured the whole way through, but the path never closed. Emerged at Bree unsettled but unharmed.', 'good');
      travelTo(1, 'Bree', reachBree);
    }
  } else {
    const roll = Math.random();
    if (roll < 0.25) {
      const lost = rand(20,50); G.supplies.food = Math.max(0, G.supplies.food - lost);
      log(`Brigands on the road — surrendered ${lost} lbs food before they disappeared.`, 'bad');
    } else if (roll < 0.5) {
      G.supplies.food += rand(30,60); G.supplies.coin += rand(10,25);
      log('Merchants heading west — traded fairly. +food, +coin.', 'good');
    } else {
      log('Long road to Bree — grey and uneventful.');
    }
    travelTo(2, 'Bree', reachBree);
  }
};

// ═══ BREE
function reachBree() {
  G.location = 'Bree'; addMiles(130);
  healAll(15); morale(12);
  G.companions.forEach(c => { if (c.status === 'injured leg') { c.status = ''; c.maxHealth = 100; } });
  G.maxHealth = 100;
  Object.keys(G.illnesses||{}).forEach(n => { if (G.illnesses[n]==='exhaustion') delete G.illnesses[n]; });
  setScene('Bree');
  log('Reached Bree — The Prancing Pony. All party members +15 health.', 'landmark');
  if (G.illnesses && Object.keys(G.illnesses).length > 0) log('Exhaustion cleared at the inn.', 'good');
  showDecision(
    'Bree — The Prancing Pony',
    'Barliman Butterbur spots your barrel immediately. "That smells extraordinary," he says.',
    [
      { label: 'Buy supplies at the Bree market',          fn: () => showSupplyShop('Bree', 'The market has most of what you need.', decision4) },
      { label: 'Treat the sick',                           note: G.supplies.athelas > 0 ? `${G.supplies.athelas} athelas available` : 'No athelas', fn: () => showTreatSick(decision4) },
      { label: 'Talk to the locals',                       note: 'Hear about the road ahead', fn: () => { showTownTalk('bree', null); decision4(); } },
      { label: 'Offer Butterbur a pour (−8% brew)',        note: 'Free rooms + 30 coin',       fn: () => { useBeer(8,'Butterbur'); G.supplies.coin+=30; addNote('open-hearted, shared freely at an inn'); log('Butterbur: "By the stars!" — free rooms and extra bread. +30 coin.','good'); decision4(); } },
      { label: 'Head east in the morning',                 fn: decision4 },
    ]
  );
}

// ═══ DECISION 4: EAST ROAD vs MIDGEWATER
function decision4() {
  G.location = 'East of Bree';
  showDecision(
    'East of Bree — The road to Weathertop',
    'East of Bree the road grows emptier. The main road leads toward Weathertop. Or cut through the Midgewater Marshes — shorter but miserable.',
    [
      { label: 'Follow the East Road toward Weathertop', note: '3 days · Brigand risk · Trader chance',                              fn: () => chooseD4('road')  },
      { label: 'Cut through the Midgewater Marshes',     note: '2 days · Insects and illness · Possible Strider encounter',          fn: () => chooseD4('wilds') },
    ]
  );
}
window.chooseD4 = function (c) {
  if (c === 'road') {
    const roll = Math.random();
    travelTo(3, 'Weathertop', function () {
      if (roll < 0.3) {
        const lost = rand(20,60); G.supplies.food = Math.max(0, G.supplies.food - lost);
        log(`Brigands on the East Road — took ${lost} lbs food.`, 'bad');
      } else if (roll < 0.45) {
        G.supplies.food += rand(40,80); G.supplies.coin += rand(15,30);
        log('Merchants convoy heading west — traded well. +food, +coin.', 'good');
      } else {
        log('The Lone-lands: grey sky and empty road. Arrived at Weathertop on schedule.');
      }
      travelStretch(2, weathertop);
    });
  } else {
    G.pathFlags.wilds = true;
    travelTo(1, 'Midgewater Marshes', midgewaterMarshes);
  }
};

function midgewaterMarshes() {
  G.location = 'Midgewater Marshes';
  setScene('Midgewater Marshes');
  const roll = Math.random();
  if (roll < 0.4) {
    const dmg = rand(8,15); damageAll(dmg);
    const mf = infectRandom('marsh_fever');
    log(`Midgewater Marshes: Neekerbreekers all night. All −${dmg} health.${mf ? ' ' + mf + ' has Marsh Fever.' : ''}`, 'bad');
    travelTo(2, 'Weather Hills', weatherHills);
  } else if (roll < 0.65) {
    const dmg = rand(5,10); damageAll(dmg);
    log(`Midgewater Marshes: unpleasant but passable. All −${dmg} health.`, 'bad');
    travelTo(1, 'Weather Hills', weatherHills);
  } else {
    log('Midgewater Marshes: foul but passable. Nobody ill. Waded through faster than expected.', 'good');
    travelTo(1, 'Weather Hills', weatherHills);
  }
}

function weatherHills() {
  G.location = 'The Weather Hills';
  setScene('The Weather Hills');
  const roll = Math.random();
  if (roll < 0.55) {
    G.pathFlags.metStrider = true; healAll(12); G.supplies.food += 60;
    log('Strider in the Weather Hills — he scouts ahead and leads us safely to Weathertop. +60 food, +12 health.', 'good');
    travelStretch(2, weathertop);
  } else if (roll < 0.8) {
    const v = damageRandom(18);
    log(`Wargs in the Weather Hills — drove them off with torches. ${v?.name||'A companion'} injured.`, 'bad');
    travelStretch(2, weathertop);
  } else {
    log('Weather Hills: steep but clear. Descended to Weathertop before nightfall.', 'good');
    travelStretch(2, weathertop);
  }
}

// ═══ WEATHERTOP
function weathertop() {
  G.location = 'Weathertop'; addMiles(280);
  setScene('Weathertop');
  log('Reached Weathertop — Amon Sûl.', 'landmark');
  showDecision(
    'Weathertop — Five shapes on the hill',
    'The ruined watchtower. Clear view in all directions. That night, five dark shapes come up the hill in silence.' +
    (G.pathFlags.metStrider ? ' Strider stands ready.' : ''),
    [
      { label: 'Stand your ground — fight with fire',
        note: G.pathFlags.metStrider ? 'Strider fights with you' : 'Risk of Morgul wound',
        fn: () => weathertopFight() },
      { label: 'Run immediately into the dark',
        note: 'All take damage · Risk of Black Breath',
        fn: () => weathertopRun() },
    ]
  );
}
function weathertopFight() {
  addNote('sharp acidity forged by conflict');
  if (G.pathFlags.metStrider) {
    const v = damageRandom(12); if (v) v.status = 'Morgul wound';
    G.health = Math.max(1, G.health - 8);
    log(`Nazgûl at Weathertop — Strider's blade drives them back. ${v?.name||'A companion'} takes a Morgul wound.`, 'bad');
  } else {
    const v = damageRandom(25); if (v) v.status = 'Morgul wound';
    G.health = Math.max(1, G.health - 15);
    log(`Nazgûl at Weathertop — drove them back with fire. ${v?.name||'A companion'} struck by a Morgul blade.`, 'bad');
  }
  decision5();
}
function weathertopRun() {
  damageAll(10); morale(-8);
  const n = infectRandom('black_breath');
  log('Fled Weathertop in darkness. All −10 health.' + (n ? ' ' + n + ' has the Black Breath.' : ''), 'bad');
  travelTo(1, 'East of Weathertop', () => showTreatSick(decision5));
}

// ═══ DECISION 5: LAST BRIDGE vs WILDS
function decision5() {
  G.location = 'East of Weathertop';
  showDecision(
    'East of Weathertop — The Hoarwell',
    'Still being followed. The road east leads to the Last Bridge. Or cut south through the wilds — harder to track.',
    [
      { label: 'Take the road east to the Last Bridge', note: '2 days · Safe · More exposed',             fn: () => chooseD5('road')  },
      { label: 'Cut south through the wilds',           note: '1 day saved · Must ford the Hoarwell',     fn: () => chooseD5('wilds') },
    ]
  );
}
window.chooseD5 = function (c) {
  if (c === 'road') {
    travelTo(2, 'Trollshaws', function () {
      log('Crossed the Last Bridge without incident.', 'good');
      travelStretch(1, trollshaws);
    });
  } else {
    travelTo(1, 'Hoarwell River', function () {
      setScene('Hoarwell River');
      log('Reached the Hoarwell — no bridge here.', 'landmark');
      showDecision(
        'The Hoarwell — Ford or detour?',
        'The river runs fast. Ford it here or walk north to the Last Bridge.',
        [
          { label: 'Ford the Hoarwell here',                  note: 'Fast · Risk of supply loss',    fn: () => hoarwellFord()   },
          { label: 'Walk north to the Last Bridge after all', note: '+1 day · Safe',                 fn: () => hoarwellBridge() },
        ]
      );
    });
  }
};
function hoarwellFord() {
  if (Math.random() < 0.45) {
    const lost = rand(20,50); G.supplies.food = Math.max(0, G.supplies.food - lost);
    const v = damageRandom(14);
    log(`Fording the Hoarwell — current took ${v?.name||'a companion'}. ${lost} lbs food lost.`, 'bad');
  } else {
    log('Fording the Hoarwell — cold but everyone across intact.', 'good');
  }
  travelStretch(1, trollshaws);
}
function hoarwellBridge() {
  travelTo(1, 'Trollshaws', function () {
    log('Walked north to the Last Bridge. Lost the time saved, but all safe.', 'good');
    travelStretch(1, trollshaws);
  });
}

// ═══ TROLLSHAWS
function trollshaws() {
  G.location = 'The Trollshaws'; addMiles(100);
  setScene('The Trollshaws');
  log('Into the Trollshaws.', 'landmark');
  const evts = [
    { t:"Bilbo's Stone Trolls",  fn:()=>{ G.supplies.coin+=25; return {good:true,  msg:'Stone trolls in a clearing — found a leather sack of old coin. +25 coin.'}; }},
    { t:'Live Trolls',           fn:()=>{ damageAll(15);        return {good:false, msg:'Live trolls — ran for it. All −15 health.'}; }},
    { t:'Broken Pony',           fn:()=>{ G.supplies.ponies=Math.max(0,G.supplies.ponies-1); G.supplies.food=Math.floor(G.supplies.food*0.82); return {good:false,msg:'Pony went lame — abandoned. Food lost.'}; }},
    { t:'Rockfall',              fn:()=>{ if(!hasRole('maintenance')){G.beer=Math.max(0,G.beer-10);return{good:false,msg:'Rockfall — keg rolled and took a knock. −10% brew.'};} return{good:true,msg:'Rockfall — maintenance hand secured the keg in time. Nothing lost.'}; }},
    { t:'Sheltered Camp',        fn:()=>{ healAll(12);           return {good:true,  msg:'Found a sheltered dell — full night of uninterrupted rest. All +12 health.'}; }},
    { t:'Orc Scouts',            fn:()=>{ damageRandom(15);      return {good:false, msg:'Orc scouts at dusk — drove them off. Companion injured.'}; }},
    { t:'Ranger Stash',          fn:()=>{ G.supplies.food+=60; G.supplies.parts+=1; return {good:true,msg:'Ranger cache found — wrapped food, oil, note in Elvish. +60 food, +1 parts.'}; }},
    { t:'Bear in the Supplies',  fn:()=>{ G.supplies.food=Math.max(0,G.supplies.food-rand(40,80)); G.beer=Math.max(0,G.beer-rand(5,15)); return {good:false,msg:'Bear found the food sacks — drove it off but not before real damage.'}; }},
    { t:'Rough Trail',           fn:()=>{ advance(1); damageAll(5); return {good:false,msg:'Road crumbled to nothing — ponies struggling. +1 day, all −5 health.'}; }},
  ];
  const [ev1, ev2] = [...evts].sort(()=>Math.random()-0.5).slice(0,2);
  const r1 = ev1.fn(), r2 = ev2.fn();
  log(r1.msg, r1.good?'good':'bad');
  log(r2.msg, r2.good?'good':'bad');
  travelTo(2, 'Ford of Bruinen', bruinenCrossing);
}

// ═══ BRUINEN
function bruinenCrossing() {
  G.location = 'Ford of Bruinen'; addMiles(80);
  setScene('Ford of Bruinen');
  log('Reached the Ford of Bruinen — last river before Rivendell.', 'landmark');
  const nazgul = Math.random() < 0.25;
  G.pathFlags.bruinenNazgul = nazgul;
  if (nazgul) log('Dark shapes on the far bank. The Nazgûl. Very little time.', 'bad');
  showDecision(
    'The Ford of Bruinen',
    nazgul ? 'The Nazgûl are on the far bank. Cross immediately or hold and fight?' : 'The Bruinen runs fast and cold between you and Rivendell.',
    [
      { label: 'Ford the river immediately',                        note: 'Fastest · Risk of injury',          fn: () => chooseBruinen('ford')  },
      { label: nazgul ? 'Hold the bank to cover the crossing' : 'Fight rearguard then cross', note: 'Companion injury risk · Safer for the keg', fn: () => chooseBruinen('fight') },
    ]
  );
}
window.chooseBruinen = function (c) {
  addNote('washed clean by cold water, clarified under pressure');
  if (c === 'ford') {
    if (Math.random() < 0.4) {
      const lost = Math.floor(G.supplies.food*0.2); G.supplies.food -= lost; damageRandom(18);
      log(`Fording the Bruinen — current fierce. ${lost} lbs food lost.${G.pathFlags.bruinenNazgul?' River rose behind us — Nazgûl swept away.':''}`, 'bad');
    } else {
      log('Fording the Bruinen — plunged across. All safe.' + (G.pathFlags.bruinenNazgul?' River roared up — Nazgûl swept away in a great wave.':''), 'good');
    }
  } else {
    damageRandom(22);
    log('Rearguard at the Bruinen — held the bank while others crossed. Companion took a serious wound.' + (G.pathFlags.bruinenNazgul?' River rose. Nazgûl gone.':''), 'bad');
  }
  rivendell();
};

// ═══ RIVENDELL
function rivendell() {
  G.location = 'Rivendell'; addMiles(100);
  healAll(10); morale(20); G.maxHealth = 100;
  G.companions.forEach(c => { if (c.health>0) { c.maxHealth=100; c.status=''; } });
  G.illnesses = {};
  setScene('Rivendell');
  log('Reached Rivendell — The Last Homely House. All wounds healed. All Morgul wounds cured. All +10 health.', 'landmark');
  showDecision(
    'Rivendell — Elrond\'s House',
    'Three days of rest. All wounds healed. Elrond examines the keg: "A remarkable beer. But what road do you plan to take through the mountains?"',
    [
      { label: 'Buy supplies before departing', fn: () => showSupplyShop('Rivendell', "Elrond's stores are well-stocked.", decision6) },
      { label: 'Talk to the elves',             note: 'Hear about the passes', fn: () => { showTownTalk('rivendell', null); decision6(); } },
      { label: 'Continue to the mountains',     fn: decision6 },
    ]
  );
}

// ═══ DECISION 6 — THE MISTY MOUNTAINS FORK
function decision6() {
  G.location = 'South of Rivendell';
  const partyWeak  = G.companions.filter(c => c.health > 0 && c.health < 40).length;
  const foodDays   = G.supplies.food > 0 ? Math.floor(G.supplies.food/7) : 0;
  const advice = partyWeak >= 2
    ? 'Several companions badly wounded — Moria may finish them.'
    : foodDays < 10 ? 'Food running low — the Gap of Rohan saves the most time.'
    : 'Full party healthy — you can afford the risk of Moria if you choose.';
  showDecision(
    'The Misty Mountains — Three roads, three dangers',
    advice + '\n\n' +
    'Moria: fastest, 30% chance someone dies, 60% all −20 health → Lothlórien.\n' +
    'Redhorn: cold pass, 35% blizzard (all −20 + chill), 25% avalanche → Lothlórien.\n' +
    'Gap of Rohan: safest, skips Lothlórien entirely, Saruman watches this road → Edoras.',
    [
      { label: 'The Mines of Moria — through Khazad-dûm', note: 'Fastest · Highest danger · Someone may not come out', fn: () => chooseD6('moria')   },
      { label: 'The Redhorn Gate — over Caradhras',        note: 'Cold · Storm risk · Leads to Lothlórien',             fn: () => chooseD6('redhorn') },
      { label: 'The Gap of Rohan — south then east',       note: 'Safest · Skips Lothlórien · Saruman watches this road', fn: () => chooseD6('gap')    },
    ]
  );
}
window.chooseD6 = function (c) {
  G.pathFlags.d6 = c;
  if (c === 'moria') {
    addNote('dark roast, smoke in the finish, something ancient in the depths');
    setScene('Mines of Moria');
    travelTo(3, 'Mines of Moria', function () {
      const roll = Math.random();
      if (roll < 0.3) {
        const v = G.companions.find(x=>x.health>0); if(v) v.health = Math.max(0,v.health-45);
        const dead = v&&v.health<=0; if(dead&&v) v.status='dead';
        morale(dead?-20:-10);
        log('The Watcher in the Water — '+(dead&&v?v.name+' lost at the gates.':((v?.name||'a companion')+' barely survived.')), 'bad');
      } else if (roll < 0.6) {
        const v = G.companions.find(x=>x.health>0);
        if(v){v.health=0;v.status='dead';} damageAll(15); morale(-20);
        log('Drums in the Deep — the Balrog. '+(v?.name||'A companion')+' did not make it across Durin\'s Bridge. All −15 health.', 'bad');
      } else {
        damageAll(20); morale(-8);
        log('Survived the Mines of Moria — three days of absolute darkness. All −20 health from the ordeal.', 'bad');
      }
      checkDeaths(() => travelStretch(2, reachLothlorien));
    });
  } else if (c === 'redhorn') {
    addNote('crisp alpine bitterness, cold-conditioned clarity from the high pass');
    setScene('Caradhras');
    travelTo(3, 'Caradhras', function () {
      const roll = Math.random();
      if (roll < 0.35) {
        damageAll(20); const ch = infectRandom('mountain_chill'); morale(-10);
        log('Caradhras the Cruel — blizzard. Snow to chest height. Turned back. All −20 health.' + (ch?' '+ch+' has Mountain Chill.':''), 'bad');
        travelTo(2, 'Lothlórien', () => travelStretch(2, reachLothlorien));
      } else if (roll < 0.6) {
        const v = damageRandom(35); morale(-8);
        log('Avalanche on the Redhorn Gate — '+(v&&v.health<=0?v.name+' did not survive.':v?.name+' badly injured.'), 'bad');
        checkDeaths(() => travelStretch(2, reachLothlorien));
      } else {
        log('The Redhorn Gate — bitter cold but passable. Crested the pass and descended safely.', 'good');
        travelStretch(2, reachLothlorien);
      }
    });
  } else {
    addNote('wind-dried, crispy cold, a long road in the open air');
    travelTo(2, 'Fords of Isen', function () {
      log('The Gap of Rohan — long road south through Dunland. Open ground, cold winds. No Lothlórien resupply.', '');
      fordsOfIsen();
    });
  }
};

// ═══ LOTHLÓRIEN
function reachLothlorien() {
  G.location = 'Lothlórien'; addMiles(520);
  healAll(10); morale(20);
  G.companions.forEach(c=>{if(c.health>0){c.maxHealth=100;c.status='';}});
  G.maxHealth=100; G.illnesses={};
  setScene('Lothlórien');
  log('Reached Lothlórien — The Golden Wood. All wounds healed. All +10 health.', 'landmark');
  showDecision(
    'Lothlórien — Galadriel\'s care',
    '"I see your road ahead," she says. "Take lembas for the journey. Two paths lie south."',
    [
      { label: 'Buy supplies at the Lothlórien stores', fn: () => showSupplyShop('Lothlórien', 'The stores of the Golden Wood are generous.', chooseD7Prompt) },
      { label: 'Talk to the Galadhrim',                 note: 'Hear about the paths south', fn: () => { showTownTalk('lothlorien',null); chooseD7Prompt(); } },
      { label: 'Down the Anduin by boat',               fn: () => chooseD7('anduin')  },
      { label: 'Through Fangorn Forest on foot',        fn: () => chooseD7('fangorn') },
    ]
  );
}
function chooseD7Prompt() {
  showDecision(
    'Lothlórien — Departing',
    'Which way south?',
    [
      { label: 'Down the Anduin by boat',        fn: () => chooseD7('anduin')  },
      { label: 'Through Fangorn Forest on foot', fn: () => chooseD7('fangorn') },
    ]
  );
}
window.chooseD7 = function (c) {
  G.pathFlags.d7 = c;
  if (c === 'anduin') {
    travelTo(3, 'Anduin River', function () {
      if (Math.random() < 0.45) {
        const lost = Math.floor(G.supplies.food*0.15); G.supplies.food -= lost; damageAll(12);
        log(`Ambush on the Anduin — Uruk-hai arrows. Beached boats and ran. −${lost} food, all −12 health.`, 'bad');
      } else {
        log('Down the Anduin — three days on the river. Current kind, weather holds. Beached at Emyn Muil.', 'good');
      }
      travelStretch(2, reachEdoras);
    });
  } else {
    addNote('wild, untamed, notes of ancient wood and something that predates memory');
    setScene('Fangorn Forest');
    travelTo(2, 'Fangorn Forest', function () {
      if (Math.random() < 0.5) {
        healAll(5); G.supplies.food += 80;
        log('Treebeard — he decided we are not Orcs. Ent-draughts and food. "Do not be hasty." +80 food, +5 health.', 'good');
      } else {
        damageAll(10);
        log('Lost in Fangorn — trees whispered, nothing helped. Two days behind. All −10 health.', 'bad');
        travelTo(2, 'Edoras', () => travelStretch(2, reachEdoras));
        return;
      }
      travelStretch(2, reachEdoras);
    });
  }
};

// ═══ FORDS OF ISEN
function fordsOfIsen() {
  G.location = 'Fords of Isen'; addMiles(300);
  setScene('Fords of Isen');
  log('Reached the Fords of Isen — Orthanc looms on the horizon.', 'landmark');
  const crebain = Math.random() < 0.4;
  G.pathFlags.crebainSeen = crebain;
  if (crebain) log('Crebain from Dunland wheel overhead — Saruman\'s spies.', 'bad');
  const crossChoices = crebain
    ? [
        { label: 'Hide under the trees until they pass', note: '+1 day · Saruman may not notice', fn: () => { travelTo(1,'Fords of Isen', isenCrossPrompt); } },
        { label: 'Move on quickly and cross now',                                                  fn: () => isenCrossOrSaruman() },
      ]
    : isenCrossOptions();
  showDecision('Fords of Isen', crebain ? 'The crebain circle twice.' : 'The Isen runs cold and strong.', crossChoices);
}
function isenCrossOptions() {
  return [
    { label: 'Ford the river now',                     note: 'Free · Risk of injury',     fn: () => chooseIsen('ford') },
    { label: 'Wait for the water to drop',             note: '+2 days · Safer',            fn: () => chooseIsen('wait') },
    { label: 'Build a raft for the keg',               note: 'Risk to the brew · Faster', fn: () => chooseIsen('raft') },
  ];
}
function isenCrossPrompt() {
  log('Crebain gone. Time to cross the Isen.');
  showDecision('Fords of Isen', 'The crebain have passed.', isenCrossOptions());
}
function isenCrossOrSaruman() {
  if (G.pathFlags.crebainSeen && Math.random() < 0.35) {
    damageAll(12); G.supplies.food = Math.max(0, G.supplies.food - rand(30,60));
    log('Dunlending patrol at the ford — Saruman\'s interference. Fought them off. All −12 health.', 'bad');
    travelStretch(2, reachEdoras);
  } else {
    isenCrossPrompt();
  }
}
window.chooseIsen = function (c) {
  if (c === 'ford') {
    if (Math.random() < 0.4) { const v=damageRandom(20); log(`Fording the Isen — current took ${v?.name||'a companion'} off their feet.`,'bad'); }
    else log('Fording the Isen — cold and fast but everyone across intact.','good');
  } else if (c === 'wait') {
    travelTo(2, 'Fords of Isen', function () { log('Waited two days — water dropped. Crossed safely.','good'); });
  } else {
    if (Math.random() < 0.45) { G.beer=Math.max(0,G.beer-15); log('Raft tipped in the current — saved the keg, barely. −15% brew.','bad'); }
    else log('Raft crossing — keg dry, everyone swam. Cold but successful.','good');
  }
  travelStretch(2, reachEdoras);
};

// ═══ EDORAS
function reachEdoras() {
  G.location = 'Edoras'; addMiles(380);
  healAll(5); morale(12);
  G.companions.forEach(c=>{if(c.health>0&&c.status==='injured leg'){c.status='';c.maxHealth=100;}});
  G.maxHealth=100;
  setScene('Edoras');
  log('Reached Edoras — The Golden Hall of Rohan. All +5 health.', 'landmark');
  showDecision(
    'Edoras — Meduseld',
    'A rider eyes your keg: "We have mead. But that smells better!"',
    [
      { label: 'Buy supplies at the Edoras market',           fn: () => showSupplyShop('Edoras','The Edoras market stocks the essentials.',minasRoad) },
      { label: 'Talk to the Rohirrim',                        note: 'Hear about the road ahead', fn: () => { showTownTalk('edoras',null); minasRoad(); } },
      { label: 'Offer the Rohirrim a taste (−6% brew)',       note: 'Road escort to Minas Tirith', fn: () => { useBeer(6,'Rohirrim'); healAll(5); log('Rohirrim escort: three riders accompanied us east. Road clear. +5 health.','good'); travelStretch(1,reachMinasTirith); } },
      { label: 'Continue east to Minas Tirith',               fn: minasRoad },
    ]
  );
}
function minasRoad() {
  travelTo(2, 'Minas Tirith', function () {
    if (Math.random() < 0.3) {
      damageAll(10); log('Orc raid on the Pelennor road — drove them off. All −10 health.','bad');
    } else {
      log('Road to Minas Tirith — two days on the Pelennor. White walls visible from miles away.');
    }
    travelStretch(1, reachMinasTirith);
  });
}

// ═══ MINAS TIRITH
function reachMinasTirith() {
  G.location = 'Minas Tirith'; addMiles(220);
  healAll(10); morale(15); G.illnesses = {};
  setScene('Minas Tirith');
  log('Reached Minas Tirith — The White City. All +10 health. Last stop before Mordor.', 'landmark');
  showDecision(
    'Minas Tirith — Last resupply',
    'The seven-tiered city. This is the last chance to buy supplies before Mordor. Spend wisely.',
    [
      { label: 'Buy supplies — last chance', fn: () => showSupplyShop('Minas Tirith','Last supply stop. Spend wisely.',decision8) },
      { label: 'Choose your road into Mordor', fn: decision8 },
    ]
  );
}

// ═══ DECISION 8 — INTO MORDOR
function decision8() {
  G.location = 'Gates of Mordor';
  setScene('Mordor');
  const foodDays = G.supplies.food>0 ? Math.floor(G.supplies.food/7) : 0;
  const advice = foodDays < 8
    ? 'Food low — Dead Marshes takes the most days. Cirith Ungol fastest if you can survive it.'
    : G.companions.filter(c=>c.health>0).length <= 2
      ? 'Few companions left — Shelob will likely claim another. Consider Dead Marshes or Poros.'
      : 'Three approaches into Mordor.';
  showDecision(
    'The Road into Mordor',
    advice + '\n\nDead Marshes: 5 days · faces in pools · leads to the Black Gate.\n' +
    'Cirith Ungol: 3 days · 55% Shelob kills a companion · fastest to Orodruin.\n' +
    'Poros Ford: 7 days · river + mountain pass · fewest ambushes · most food used.',
    [
      { label: 'North — Dead Marshes to the Morannon',         note: 'Black Gate confrontation',              fn: () => chooseD8('north') },
      { label: 'East — Minas Morgul and Cirith Ungol',          note: 'Fastest · Shelob risk · Most dangerous', fn: () => chooseD8('east')  },
      { label: 'South — Cross the Poros, through Ephel Dúath', note: 'Slowest · Different dangers',            fn: () => chooseD8('south') },
    ]
  );
}
window.chooseD8 = function (c) {
  G.pathFlags.d8 = c;
  if (c === 'north') {
    addNote('murky and complex, something haunted in the depth');
    travelTo(5, 'Dead Marshes', function () {
      if (Math.random() < 0.5) {
        const v=damageRandom(25);
        log(`The Dead Marshes — faces in the pools. ${v?.name||'A companion'} nearly walked into one.`, 'bad');
      } else {
        damageAll(8); log('The Dead Marshes — terrible but passable. Kept eyes up and feet on the path. All −8 health.','bad');
      }
      travelStretch(2, blackGate);
    });
  } else if (c === 'east') {
    addNote('tense acidity, sharp and unforgiving, a spider-thread edge to every sip');
    travelTo(3, 'Cirith Ungol', function () {
      if (Math.random() < 0.55) {
        const v=G.companions.find(x=>x.health>0); if(v){v.health=0;v.status='dead';} morale(-20);
        log(`Shelob's Lair — she dropped from the ceiling. ${v?.name||'A companion'} taken before anyone could react.`,'bad');
        checkDeaths(()=>travelStretch(2, mountDoomApproach));
      } else {
        log('Cirith Ungol — something breathed in the dark tunnel. Torch kept her back. Emerged onto Gorgoroth.','good');
        travelStretch(2, mountDoomApproach);
      }
    });
  } else {
    addNote('a long southern warmth, rounded and unhurried, the road less travelled');
    travelTo(7, 'Ford of Poros', function () {
      if (Math.random() < 0.4) {
        const lost=Math.floor(G.supplies.food*0.2); G.supplies.food-=lost; damageAll(10);
        log(`The Ford of Poros — river ran deep. ${lost} lbs food lost in the crossing. All −10 health.`,'bad');
      } else {
        log('The Ford of Poros — passable. Cold and deep but nobody fell.','good');
      }
      travelTo(3, 'Ephel Dúath', function () {
        damageAll(12);
        log('The Ephel Dúath — ash, heat, sulphur. Climbing north toward Orodruin. All −12 health.','bad');
        travelStretch(2, mountDoomApproach);
      });
    });
  }
};

// ═══ BLACK GATE
function blackGate() {
  G.location = 'The Morannon'; addMiles(200);
  setScene('The Morannon');
  log('The Morannon — the Black Gate. Briefly open as a column of Orcs marches through.', 'landmark');
  showDecision(
    'The Morannon — How do you get through?',
    'The great iron gates. The Eye is somewhere above.',
    [
      { label: 'Slip through in the shadow of the column', note: '55% fail — all −30 health · Direct',    fn: () => morannon('slip')  },
      { label: 'Roll the keg as a distraction (−20% brew)', note: 'Medium risk · Guards go for the beer', fn: () => morannon('beer')  },
      { label: 'Find a crack in the northern wall',         note: '+1 day · Avoids the main gate',        fn: () => morannon('crack') },
    ]
  );
}
window.morannon = function (c) {
  if (c==='slip') {
    if (Math.random()<0.55) { damageAll(30); log('An eye turned. Alarm raised — ran through. All −30 health.','bad'); }
    else log('Shadow and silence. The column passed. Slipped through unseen.','good');
  } else if (c==='beer') {
    useBeer(20,'distraction at the Morannon');
    log('Keg burst open — guards scrambled toward the smell. Crossed in the confusion. −20% brew.','good');
  } else {
    travelTo(1,'Morannon',function(){
      if (Math.random()<0.35){damageAll(15);log('Crack in the wall — found it but so did a patrol. Fought through. All −15 health.','bad');}
      else log('Narrow gap in the northern wall — squeezed through one by one into Mordor.','good');
    });
  }
  travelStretch(2, mountDoomApproach);
};

// ═══ MOUNT DOOM APPROACH
function mountDoomApproach() {
  G.location = 'Plateau of Gorgoroth'; addMiles(160);
  damageAll(10);
  setScene('Mordor');
  log('The Plateau of Gorgoroth. Nothing lives here. Ground black, sky red. Orodruin burns ahead. All −10 health.','bad');
  if (G.beer < 25) log('The keg is nearly empty. What remains sloshes faintly.','bad');
  setMainAction('Climb to the Sammath Naur →', mountDoom, 'stopped');
}

// ═══ MOUNT DOOM
function mountDoom() {
  G.location = 'Mount Doom'; addMiles(160); advance(1);
  setScene('Orodruin');
  log('Climbed to the Sammath Naur. The Crack of Doom. Heat unbearable.', 'landmark');
  const s = getStarter();
  const brewName = s?.name || 'The Brew';
  const cond = brewCondition();
  const survivors = G.companions.filter(x=>x.health>0).map(x=>x.name);
  showDecision(
    'Orodruin — The Crack of Doom',
    `${brewName} — ${Math.round(G.beer)}% remains. Condition: ${cond.label}. ${cond.desc}\n\n` +
    (survivors.length > 0 ? survivors.join(', ') + ' stand beside you.' : 'You stand alone.') +
    '\n\nOne final choice.',
    [
      { label: 'Pour the brew into the fire',            note: 'Brew score = 0. Journey and party are all that counts.', fn: () => finalChoice('pour')  },
      { label: 'Carry it home — you earned it',          note: 'Keep the full ' + Math.round(G.beer) + '%. Full brew bonus.',  fn: () => finalChoice('keep')  },
      { label: 'Share a final pour with your companions', note: survivors.length + ' companions share it. +morale bonus.',  fn: () => finalChoice('share') },
    ]
  );
}
window.finalChoice = function (c) {
  const s = getStarter();
  const brewName = s?.name || 'The Brew';
  if (c==='pour') {
    G.beer=0; addNote('consumed by fire, leaving only the memory of what it was');
    addAch('sacrificed','The brew was returned to the fire of Orodruin');
    log(brewName + ' poured into the Crack of Doom. For one moment the whole mountain smells of malt and hops. Then nothing.','landmark');
    showEnding();
  } else if (c==='keep') {
    addNote('survived intact, a testament to every road taken');
    addAch('keeper','Carried the brew to the fires and brought it home');
    morale(10);
    log('Turned back from the fire. The keg still in your arms. Carried it here — will carry it back.','good');
    showEnding();
  } else {
    const amt=Math.min(G.beer,15); useBeer(amt,'final pour');
    addNote('shared at the last, generous to the very end');
    addAch('shared','The final pour shared at the fires of Orodruin');
    morale(15);
    const survs=G.companions.filter(x=>x.health>0).map(x=>x.name);
    log(survs.length>0
      ? 'Passed it to '+survs.join(', ')+'. One pour each. Nobody speaks. The fire roars below.'
      : 'Drank alone at the edge of the world. Still the best thing ever tasted.', 'good');
    showEnding();
  }
};

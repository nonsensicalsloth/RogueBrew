// ═══════════════════════════════════════════ GAME CONTROLLER
const Game = (() => {

  // Tick pacing: 2 seconds per day
  const TICK_MS = 2000;

  let _tickTimer = null;
  let _traveling = false;
  let _afterFork = null;       // callback to resume travel after a fork decision
  let _currentChoices = null;  // for decision panel
  let _onContinue = null;      // what Continue button does (besides start travel)
  let _decisionActive = false; // true when a fork/decision panel is showing

  // ── BOOT ──────────────────────────────────────────────────────────
  function start() {
    UI.init();
    showTitle();
  }

  function showTitle() {
    UI.showModal('The Brewery Trail',
      '<div class="splash">' +
      '<div class="splash-title">The Brewery Trail</div>' +
      '<div class="splash-sub">FROM THE SHIRE TO MOUNT DOOM</div>' +
      '<p>Seven of you will carry the keg 2,900 miles across Middle-earth to the fires of Orodruin.</p>' +
      '<p class="splash-quote">"It\'s a dangerous business, going out your door."</p>' +
      '</div>',
      '<button class="btn" onclick="Game.setupBrew()">Begin →</button>',
      true
    );
  }

  // ── SETUP ─────────────────────────────────────────────────────────
  function setupBrew() {
    UI.showModal('Name Your Brew',
      '<p>Before you set out, name the brew. It will travel with you and may survive to the end.</p>' +
      '<div class="form-row"><label>Brew name</label><input id="bn" type="text" maxlength="24" placeholder="Bywater Best"></div>' +
      '<div class="form-row"><label>Style</label>' +
      '<select id="bs">' +
      '<option>Pale Ale</option><option>Stout</option><option>Lager</option>' +
      '<option>Wheat</option><option>Porter</option><option>IPA</option>' +
      '</select></div>',
      '<button class="btn" onclick="Game.setupRole()">Pack the barrel →</button>',
      true
    );
  }

  function setupRole() {
    const name  = document.getElementById('bn').value.trim() || 'Shire Best';
    const style = document.getElementById('bs').value;
    G.brew = { name, style };

    const items = Object.entries(ROLES).map(([k, r]) =>
      '<button class="role-btn" onclick="Game.pickRole(\'' + k + '\')">' +
      '<span class="rb-label">' + r.label + '</span>' +
      '<span class="rb-note">Starts with ' + r.coin + ' coin · Score ×' + r.mult + '</span>' +
      '<span class="rb-desc">' + r.desc + '</span>' +
      '</button>'
    ).join('');

    UI.showModal('Who are you?',
      '<p>Your role determines starting coin and final score multiplier.</p>' +
      '<div class="role-list">' + items + '</div>',
      '', true
    );
  }

  function pickRole(k) {
    G.role = k;
    G.supplies.coin = ROLES[k].coin;

    const inputs = CROLES.map((c, i) =>
      '<div class="form-row"><label>' + c.role + '</label>' +
      '<input id="cn' + i + '" type="text" maxlength="12" placeholder="' + c.def + '"></div>'
    ).join('');

    UI.showModal('Name Your Companions',
      '<p>Five hobbits travel with you. Leave blank for defaults.</p>' +
      '<div class="form-row"><label>Your name</label><input id="pn" type="text" maxlength="12" placeholder="Frodo"></div>' +
      inputs,
      '<button class="btn" onclick="Game.confirmParty()">Set out →</button>',
      true
    );
  }

  function confirmParty() {
    G.playerName = document.getElementById('pn').value.trim() || 'Frodo';
    G.companions = CROLES.map((c, i) => ({
      name: document.getElementById('cn' + i).value.trim() || c.def,
      role: c.role,
      rk: c.rk,
      health: 100,
      maxHealth: 100,
      status: '',
    }));
    initRouteState();
    openShop('Michel Delving — Outfitter', 'Buy supplies before leaving the Shire.', beginJourney);
  }

  function beginJourney() {
    UI.closeModal();
    UI.logClear();
    UI.log('Set out from the Shire.', 'bold');
    UI.log(G.companions.map(c => c.name).join(', ') + ' shoulder their packs.', '');
    UI.log('The keg — ' + G.brew.name + ', ' + G.brew.style + ' — is lashed to the lead pony.', 'dim');
    UI.log('2,900 miles to Mount Doom.', 'dim');
    UI.updateConditions();
    UI.drawScene();
    // First fork is at The Shire (leaving for Brandywine)
    showFork('The Shire');
  }

  // ── TRAVEL TICK LOOP (auto, 2s per day) ────────────────────────────
  function startTravel() {
    if (_traveling) return;
    _traveling = true;
    UI.setMoving(true);
    UI.hideDecision();
    UI.log('On the trail...', 'dim');
    UI.updateConditions();
    scheduleTick();
  }

  function stopTravel() {
    _traveling = false;
    UI.setMoving(false);
    if (_tickTimer) { clearTimeout(_tickTimer); _tickTimer = null; }
  }

  function scheduleTick() {
    _tickTimer = setTimeout(tick, TICK_MS);
  }

  function tick() {
    if (!_traveling) return;
    _tickTimer = null;

    travelDay();
    UI.updateConditions();

    // Deaths from tick
    flushPostDeathFlags();
    if (window._pendingPlayerDeath) { window._pendingPlayerDeath = false; return endGame(false); }
    if (window._pendingDeath)       { const n = window._pendingDeath; window._pendingDeath = null; stopTravel(); return announceDeath(n); }

    // Landmark arrival
    const lm = landmarkReached();
    if (lm) {
      stopTravel();
      UI.drawScene();
      return arriveLandmark(lm);
    }

    // Route-scheduled dailyRoll (may return event, decision, or null)
    const routeResult = routeTick();
    if (routeResult) {
      stopTravel();
      if (routeResult.decision) {
        return showRouteDecision(routeResult.decision);
      }
      return applyOneShot(routeResult);
    }

    // Random travel event
    const ev = rollEventForRoute();
    if (ev) {
      stopTravel();
      return handleEvent(ev);
    }

    // Starvation halt
    if (G.supplies.food === 0 && G.starveDays >= 2) {
      stopTravel();
      UI.log('The party is starving. No food left.', 'bad');
      return promptContinue();
    }

    scheduleTick();
  }

  // Show a decision returned by a route's dailyRoll (e.g. ambush) or by a
  // landmark interaction (e.g. Nazgul). afterFn (if given) runs after the
  // chosen handler resolves; otherwise we promptContinue().
  function showRouteDecision(dec, afterFn) {
    const choices = dec.choices.map(c => ({
      label: c.label,
      note:  c.disabled ? (c.disabledNote || 'Unavailable') : c.note,
      disabled: !!c.disabled,
      _handler: () => {
        if (c.disabled) return;
        UI.hideDecision();
        _decisionActive = false;
        c.handler();
        UI.updateConditions();
        checkDeaths();
        flushPostDeathFlags();
        if (window._pendingPlayerDeath) { window._pendingPlayerDeath = false; return endGame(false); }
        if (window._pendingDeath)       { const n = window._pendingDeath; window._pendingDeath = null; return announceDeath(n); }
        if (afterFn) afterFn();
        else promptContinue();
      },
    }));
    _currentChoices = choices;
    _decisionActive = true;
    UI.showDecision(dec.title, dec.body, choices);
  }

  // ── EVENTS ─────────────────────────────────────────────────────────
  function handleEvent(ev) {
    const aftermath = ev.apply();
    checkDeaths();
    UI.log(ev.title, ev.bad ? 'bad' : 'good');
    UI.log(ev.text, '');
    if (aftermath) UI.log('→ ' + aftermath, 'dim');
    UI.updateConditions();

    flushPostDeathFlags();

    if (window._pendingPlayerDeath) { window._pendingPlayerDeath = false; return endGame(false); }
    if (window._pendingDeath)       { const n = window._pendingDeath; window._pendingDeath = null; return announceDeath(n); }

    promptContinue();
  }

  function applyOneShot(ev) {
    if (ev.sideEffect) ev.sideEffect(G);
    UI.log(ev.title, ev.bad ? 'bad' : 'good');
    UI.log(ev.text, '');
    if (ev.aftermath) UI.log('→ ' + ev.aftermath, 'dim');
    UI.updateConditions();
    checkDeaths();
    flushPostDeathFlags();
    if (window._pendingPlayerDeath) { window._pendingPlayerDeath = false; return endGame(false); }
    if (window._pendingDeath)       { const n = window._pendingDeath; window._pendingDeath = null; return announceDeath(n); }
    promptContinue();
  }

  function promptContinue() {
    UI.setContinueLabel('Continue');
    UI.setContinueEnabled(true);
    UI.setTimeOutEnabled(true);
    _onContinue = () => startTravel();
  }

  // Logs side-effects of checkDeaths() (currently: ent draught auto-trigger).
  // Call after every checkDeaths() invocation in game.js.
  function flushPostDeathFlags() {
    if (window._entDraughtFired) {
      window._entDraughtFired = false;
      UI.log('Ent draught — green and earthy, glowing in the gut. The party is whole again.', 'good');
      UI.updateConditions();
    }
  }

  // ── DEATH ──────────────────────────────────────────────────────────
  function announceDeath(name) {
    UI.log(name + ' has died.', 'bad');
    UI.updateConditions();
    UI.showModal('A Death in the Party',
      '<div class="death">' +
      '<div class="death-icon">†</div>' +
      '<div class="death-name">' + name + '</div>' +
      '<div class="death-cause">Lost on the road east.</div>' +
      '</div>',
      '<button class="btn" onclick="Game.resumeAfterDeath()">Press on</button>',
      true
    );
  }

  function resumeAfterDeath() {
    UI.closeModal();
    flushPostDeathFlags();
    if (window._pendingPlayerDeath) { window._pendingPlayerDeath = false; return endGame(false); }
    if (window._pendingDeath)       { const n = window._pendingDeath; window._pendingDeath = null; return announceDeath(n); }
    promptContinue();
  }

  // ── LANDMARK ARRIVAL ───────────────────────────────────────────────
  function arriveLandmark(lm) {
    UI.log('Arrived at ' + lm.name + '.', 'landmark');

    // Towns clear only exhaustion (the act of stopping); no free heal.
    // To actually recover, stay at an inn (paid) or Time Out → Rest.
    if (lm.town) {
      Object.keys(G.illnesses).forEach(n => {
        if (G.illnesses[n] === 'exhaustion') delete G.illnesses[n];
      });
    }

    // River: roll a starting depth
    if (lm.river) {
      const depth = rollRiverDepth(lm.river);
      G.pathFlags[lm.river + 'Depth'] = depth;
    }

    G.currentRoute = null;

    if (lm.name === 'Mount Doom') return finalChoice();

    showFork(lm.name);
  }

  // ── FORKS ──────────────────────────────────────────────────────────
  function showFork(fromName) {
    const fork = forkFor(fromName);
    if (!fork) {
      // No defined fork — continue toward next landmark in LANDMARKS order
      const idx = LANDMARKS.findIndex(l => l.name === fromName);
      const next = LANDMARKS[idx + 1];
      G.targetLandmarkName = next ? next.name : 'Mount Doom';
      promptContinue();
      return;
    }

    const routes = forkRoutes(fork);
    const body   = forkBody(fork);

    const choices = routes.map(r => {
      const blocked = r.disabled || (r.requires && !r.requires(G));
      const noteVal = typeof r.note === 'function' ? r.note(G) : r.note;
      return {
        label: r.label,
        note:  blocked ? (r.requiresNote || 'Unavailable') : noteVal,
        disabled: blocked,
        _route: r,
      };
    });

    _currentChoices = choices;
    _afterFork = (idx) => {
      const route = choices[idx]._route;
      if (choices[idx].disabled) return;
      UI.hideDecision();
      _decisionActive = false;

      // Special: "wait a day" pseudo-route re-rolls river depth
      if (route._wait) {
        G.day += 1;
        // Re-roll the river depth using the current one as seed
        const here = LANDMARKS.find(l => l.name === fromName);
        if (here && here.river) {
          const current = G.pathFlags[here.river + 'Depth'];
          const newDepth = rollRiverDepth(here.river, current);
          G.pathFlags[here.river + 'Depth'] = newDepth;
          UI.log('Waited a day. The ' + here.name + ' is now ' + newDepth + ' ft deep.', 'dim');
        }
        UI.updateConditions();
        // Re-show the same fork
        showFork(fromName);
        return;
      }

      setRoute(fromName, route);

      // Weathertop Nazgûl trigger: apply() may have set this flag during a rest
      if (window._weathertopNazgul) {
        window._weathertopNazgul = false;
        UI.log('Chose: ' + route.label, 'dim');
        UI.updateConditions();
        G.currentRoute = null;
        const enc = buildNazgulEncounter();
        return showRouteDecision(enc.decision, () => showFork('Weathertop'));
      }

      // Bruinen Nazgûl trigger: Riders catch up while waiting at the ford.
      // Only escape is to flee across — guaranteed crossing, but costly.
      if (window._bruinenNazgul) {
        window._bruinenNazgul = false;
        UI.log('Chose: ' + route.label, 'dim');
        UI.updateConditions();
        G.currentRoute = null;
        const enc = buildBruinenFleeDecision();
        return showRouteDecision(enc.decision, () => {
          // After resolution, the player is at Rivendell.
          G.location = 'Rivendell';
          G.miles = 690;
          G.targetLandmarkName = 'Rivendell';
          G.pathFlags.bruinenDaysWaited = 0;
          arriveLandmark(LANDMARKS.find(l => l.name === 'Rivendell'));
        });
      }

      // Watcher in the Water trigger: rest at West-gate may have woken it.
      // Forces the party into the mines after the encounter resolves.
      if (window._watcherAttack) {
        window._watcherAttack = false;
        UI.log('Chose: ' + route.label, 'dim');
        UI.updateConditions();
        G.currentRoute = null;
        const enc = buildWatcherEncounter();
        return showRouteDecision(enc.decision, () => {
          // The handler set location/target to push us into Khazad-dûm.
          // Show the Khazad-dûm fork (which has the "press on" route).
          showFork('Khazad-dûm');
        });
      }

      // Fords of Isen Uruk-hai ambush: triggers on crossing if sarumanCounter >= 3.
      // After resolution, continue normal travel toward Edoras.
      if (window._isenUrukhaiAmbush) {
        window._isenUrukhaiAmbush = false;
        UI.log('Chose: ' + route.label, 'dim');
        UI.updateConditions();
        G.currentRoute = null;
        const enc = buildIsenAmbushDecision();
        return showRouteDecision(enc.decision, () => {
          // Continue toward Edoras (the route's `to` is already 'Edoras')
          G.targetLandmarkName = route.to;
          setRoute('Fords of Isen', route);
          promptContinue();
        });
      }

      // Special: _chainTo shows another fork without travel.
      // If the route had an apply (something happened), show the log first
      // and let the player click Continue before re-displaying the fork.
      // If no apply (pure navigation like "Leave Bree"), go straight to the fork.
      if (route._chainTo) {
        UI.log('Chose: ' + route.label, 'dim');
        UI.updateConditions();
        G.currentRoute = null;
        if (route.apply) {
          // Something happened — let the player read the log, then show next fork
          UI.setContinueLabel('Continue');
          UI.setContinueEnabled(true);
          UI.setTimeOutEnabled(false);
          _onContinue = () => showFork(route._chainTo);
        } else {
          // Pure navigation — go straight to the next fork
          showFork(route._chainTo);
        }
        return;
      }

      G.targetLandmarkName = route.to;
      UI.log('Chose: ' + route.label, 'dim');
      UI.updateConditions();
      promptContinue();
    };

    _decisionActive = true;
    UI.showDecision(fork.title, body, choices);
  }

  function _pickDecision(idx) {
    if (_afterFork) { const f = _afterFork; _afterFork = null; f(idx); return; }
    // Generic: choices stored _handler
    if (_currentChoices && _currentChoices[idx] && _currentChoices[idx]._handler) {
      _currentChoices[idx]._handler();
    }
  }

  // ── BUTTON HANDLERS ────────────────────────────────────────────────
  function pressContinue() {
    if (_onContinue) { const f = _onContinue; _onContinue = null; f(); }
  }

  function pressTimeOut() {
    stopTravel();
    showTrailMenu();
  }

  function showTrailMenu() {
    const choices = [
      { label: 'Resume travel',  note: 'Continue on the trail',        _handler: () => { UI.hideDecision(); promptContinue(); } },
      { label: 'Rest the party', note: '1 day · heal · spend food',    _handler: () => { UI.hideDecision(); restDay(); promptContinue(); } },
      { label: 'Hunt for food',  note: '1 day · variable return',      _handler: () => { UI.hideDecision(); actHunt(); } },
      { label: 'Change pace',    note: 'Current: ' + PACE[G.pace].label,_handler: () => { UI.hideDecision(); actPace(); } },
      { label: 'Change rations', note: 'Current: ' + RATIONS[G.rations].label,_handler: () => { UI.hideDecision(); actRations(); } },
    ];
    const sick = Object.keys(G.illnesses);
    if (sick.length > 0 && G.supplies.athelas > 0) {
      choices.splice(2, 0, {
        label: 'Use athelas on the sick',
        note: sick.length + ' ill · ' + G.supplies.athelas + ' athelas',
        _handler: () => { UI.hideDecision(); actAthelas(); },
      });
    }
    _currentChoices = choices;
    UI.showDecision('Time Out — make camp', 'Day ' + G.day + ' · ' + G.location, choices);
  }

  // ── NAV BAR (left) ─────────────────────────────────────────────────
  function navMap() {
    const pct = Math.round((G.miles / TOTAL_MILES) * 100);
    UI.showModal('Map of Middle-earth',
      '<div class="map-wrap">' +
      '<div class="map-progress"><div class="map-bar" style="width:' + pct + '%"></div></div>' +
      '<div class="map-pct">' + G.miles + ' of ' + TOTAL_MILES + ' miles (' + pct + '%)</div>' +
      '<img src="img/map.jpg" onerror="this.style.display=\'none\'">' +
      '<ul class="landmark-list">' +
      LANDMARKS.map(l => '<li class="' + (G.miles >= l.miles ? 'visited' : '') + '">' +
        l.name + ' <span>(mile ' + l.miles + ')</span></li>').join('') +
      '</ul>' +
      '</div>', '', false);
  }

  function navGuide() {
    UI.showModal('Brewer\'s Guide',
      '<h4>The Journey</h4>' +
      '<p>Travel from The Shire to Mount Doom, 2,900 miles east. Each day ticks by automatically. Press Time Out to pause and make camp.</p>' +
      '<h4>Pace</h4>' +
      '<p>Steady (18 mi/day) is balanced. Strenuous (26 mi/day) is faster but harder. Grueling (34 mi/day) risks injury.</p>' +
      '<h4>Rations</h4>' +
      '<p>Filling (3 lb/day) keeps the party healthy. Meager (2) is neutral. Bare Bones (1) damages everyone over time.</p>' +
      '<h4>Routes</h4>' +
      '<p>At each major landmark you will be offered a choice of routes. Each route has different risks, benefits, and unique encounters.</p>' +
      '<h4>Brew condition</h4>' +
      '<p>The keg starts at 100%. Every hardship, river crossing, and generous pour chips away at it. Your final score depends partly on what arrives.</p>',
      '', false);
  }

  function navStatus() {
    const bcond = brewCondition();
    const partyHtml = '<ul class="party-list">' +
      '<li><span>' + G.playerName + ' (you)</span><strong>' + G.health + '/100</strong></li>' +
      G.companions.map(c => '<li class="' + (c.health <= 0 ? 'dead' : '') + '"><span>' + c.name + ' — ' + c.role + '</span><strong>' + (c.health <= 0 ? '†' : c.health + '/100') + '</strong></li>').join('') +
      '</ul>';
    const supplyHtml = '<div class="stat-grid">' +
      '<div><span>Food</span><strong>' + G.supplies.food + ' lbs</strong></div>' +
      '<div><span>Coin</span><strong>' + G.supplies.coin + '</strong></div>' +
      '<div><span>Spare parts</span><strong>' + G.supplies.parts + '</strong></div>' +
      '<div><span>Pack ponies</span><strong>' + G.supplies.ponies + '</strong></div>' +
      '<div><span>Athelas</span><strong>' + G.supplies.athelas + '</strong></div>' +
      '<div><span>Brew</span><strong>' + Math.round(G.beer) + '% · ' + bcond.label + '</strong></div>' +
      '</div>';
    const illHtml = Object.keys(G.illnesses).length
      ? '<h4>Illnesses</h4><ul class="ill-list">' +
        Object.entries(G.illnesses).map(([n, id]) => {
          const ill = ILLNESSES.find(i => i.id === id);
          return '<li>' + n + ': ' + ill.label + ' (−' + ill.dmg + '/day)</li>';
        }).join('') + '</ul>'
      : '';
    UI.showModal('Party Status',
      '<h4>Party</h4>' + partyHtml + '<h4>Supplies</h4>' + supplyHtml + illHtml,
      '', false);
  }

  function navRations() { actRations(); }
  function navBuy() {
    // Only allow buying at towns
    const here = LANDMARKS.find(l => l.name === G.location);
    if (here && here.town) {
      openShop(G.location + ' Store', 'Resupply at ' + G.location + '.', () => UI.closeModal());
    } else {
      UI.log('No store here. Wait until the next town.', 'dim');
    }
  }

  // ── ACTION BAR (right) ─────────────────────────────────────────────
  function actTrade() {
    if (_decisionActive) { UI.log('Finish the current decision first.', 'dim'); return; }
    // Only allow trading at towns (or if a trader event has set tradeAvailableUntil)
    const here = LANDMARKS.find(l => l.name === G.location);
    const atTown = here && here.town;
    const traderHere = G.pathFlags._traderUntilDay && G.day <= G.pathFlags._traderUntilDay;
    if (!atTown && !traderHere) {
      UI.log('No one to trade with here. Try a town or wait for a trader on the road.', 'dim');
      return;
    }
    _currentChoices = [
      { label: 'Sell 50 lbs food for 10 coin',
        note: G.supplies.food >= 50 ? 'Have ' + G.supplies.food + ' lbs' : 'Not enough food',
        disabled: G.supplies.food < 50,
        _handler: () => { G.supplies.food -= 50; G.supplies.coin += 10; UI.log('Sold 50 lbs food for 10 coin.', 'dim'); UI.hideDecision(); UI.updateConditions(); promptContinue(); } },
      { label: 'Buy 30 lbs food for 10 coin',
        note: G.supplies.coin >= 10 ? 'Have ' + G.supplies.coin + ' coin' : 'Not enough coin',
        disabled: G.supplies.coin < 10,
        _handler: () => { G.supplies.coin -= 10; G.supplies.food += 30; UI.log('Bought 30 lbs food for 10 coin.', 'dim'); UI.hideDecision(); UI.updateConditions(); promptContinue(); } },
      { label: 'Cancel', _handler: () => { UI.hideDecision(); promptContinue(); } },
    ];
    stopTravel();
    UI.showDecision('Trade', 'What would you like to trade?', _currentChoices);
  }

  function actTalk() {
    const lines = {
      'Bree':         '"The road east is too empty. Watch your back past Weathertop." — a weathered dwarf',
      'Rivendell':    '"The Misty Mountains are unquiet. Go swiftly by any path that will take you." — an elf',
      'Lothlórien':   '"The Anduin is watched. But the river is swift. You will outrun them." — a Galadhrim',
      'Edoras':       '"Orc bands have been seen on the eastern road. Do not linger." — a Rohirrim rider',
      'Minas Tirith': '"Beyond the gate is only ruin. Whatever hope you carry, carry it quickly." — a guard',
    };
    const line = lines[G.location];
    if (line) { UI.log(line, 'good'); UI.updateConditions(); }
    else UI.log('Nobody nearby to talk to.', 'dim');
  }

  function actRest() {
    if (_decisionActive) { UI.log('Finish the current decision first.', 'dim'); return; }
    stopTravel();
    _currentChoices = [
      { label: 'Rest 1 day',  note: 'Heal +10 · eat food',     _handler: () => { restDay(); UI.hideDecision(); promptContinue(); } },
      { label: 'Rest 3 days', note: 'Heal +30 · eat more food', _handler: () => { restDay(); restDay(); restDay(); UI.hideDecision(); promptContinue(); } },
      { label: 'Cancel', _handler: () => { UI.hideDecision(); promptContinue(); } },
    ];
    UI.showDecision('Rest', 'Stop and rest the party.', _currentChoices);
  }

  function restDay() {
    G.day += 1;
    const eat = Math.round(RATIONS[G.rations].lbs * partySize());
    G.supplies.food = Math.max(0, G.supplies.food - eat);
    healAll(10);
    Object.keys(G.illnesses).forEach(n => {
      if (G.illnesses[n] === 'exhaustion') delete G.illnesses[n];
    });
    // Clear any pending pony bite — proper rest saves the pony
    if (G.pathFlags.ponyBittenAt != null) {
      G.pathFlags.ponyBittenAt = null;
      UI.log('The bitten pony recovered with rest.', 'good');
    }
    UI.log('Rested a day. Party recovers.', 'good');
    UI.updateConditions();
  }

  function actPace() {
    stopTravel();
    _currentChoices = Object.entries(PACE).map(([k, p]) => ({
      label: p.label,
      note: p.miles + ' mi/day · ' + (p.foodMult === 1 ? 'normal food' : p.foodMult > 1 ? 'more food' : 'less food'),
      _handler: () => { G.pace = k; UI.log('Pace set to ' + p.label + '.', 'dim'); UI.hideDecision(); UI.updateConditions(); promptContinue(); },
    }));
    _currentChoices.push({ label: 'Cancel', _handler: () => { UI.hideDecision(); promptContinue(); } });
    UI.showDecision('Change pace', 'Current: ' + PACE[G.pace].label, _currentChoices);
  }

  function actRations() {
    stopTravel();
    _currentChoices = Object.entries(RATIONS).map(([k, r]) => ({
      label: r.label,
      note: r.lbs + ' lb/person/day · ' + (r.healthMod > 0 ? 'heals' : r.healthMod < 0 ? 'weakens' : 'neutral'),
      _handler: () => { G.rations = k; UI.log('Rations set to ' + r.label + '.', 'dim'); UI.hideDecision(); UI.updateConditions(); promptContinue(); },
    }));
    _currentChoices.push({ label: 'Cancel', _handler: () => { UI.hideDecision(); promptContinue(); } });
    UI.showDecision('Change rations', 'Current: ' + RATIONS[G.rations].label, _currentChoices);
  }

  function actHunt() {
    if (G.pathFlags.inMordor) {
      UI.log('Nothing lives here that you would want to eat.', 'dim');
      return;
    }
    // Block during active decision
    if (_decisionActive) {
      UI.log('Finish the current decision first.', 'dim');
      return;
    }
    if (G.pathFlags._lastHuntDay === G.day) {
      UI.log('Already hunted today. Try again tomorrow.', 'dim');
      return;
    }
    stopTravel();
    G.pathFlags._lastHuntDay = G.day;
    G.day += 1; // hunting takes a day
    const eat = Math.round(RATIONS[G.rations].lbs * partySize());
    G.supplies.food = Math.max(0, G.supplies.food - eat);
    const lbs = doHunt();
    G.supplies.food += lbs;
    if (lbs === 0) UI.log('Hunting: found nothing. Lost a day. −' + eat + ' lbs food eaten.', 'bad');
    else if (lbs < 50)  UI.log('Hunting: rabbits and birds. +' + lbs + ' lbs (−' + eat + ' lbs eaten). 1 day.', 'good');
    else if (lbs < 120) UI.log('Hunting: a good deer. +' + lbs + ' lbs (−' + eat + ' lbs eaten). 1 day.', 'good');
    else                UI.log('Hunting: a fat stag. +' + lbs + ' lbs (−' + eat + ' lbs eaten). 1 day.', 'good');
    UI.updateConditions();
    promptContinue();
  }

  function actAthelas() {
    stopTravel();
    const names = Object.keys(G.illnesses);
    if (!names.length) { UI.log('Nobody is ill.', 'dim'); promptContinue(); return; }
    _currentChoices = names.map(n => {
      const ill = ILLNESSES.find(i => i.id === G.illnesses[n]);
      return {
        label: 'Treat ' + n,
        note: ill.label + ' (−' + ill.dmg + '/day)',
        _handler: () => {
          useAthelas(n);
          UI.log(n + ' treated with athelas.', 'good');
          UI.hideDecision(); UI.updateConditions(); promptContinue();
        },
      };
    });
    _currentChoices.push({ label: 'Cancel', _handler: () => { UI.hideDecision(); promptContinue(); } });
    UI.showDecision('Use athelas', 'Which of the sick?', _currentChoices);
  }

  // ── SHOP ───────────────────────────────────────────────────────────
  const SHOP_ITEMS = [
    { key: 'food',    label: 'Food',        step: 50, price: 3 },
    { key: 'parts',   label: 'Spare Parts', step: 1,  price: 15 },
    { key: 'ponies',  label: 'Pack Ponies', step: 1,  price: 40 },
    { key: 'athelas', label: 'Athelas',     step: 1,  price: 20 },
  ];

  let _shopDone = null;
  let _shopBuys = {};
  let _shopTitle = '';

  function openShop(title, intro, done) {
    _shopDone = done;
    _shopTitle = title;
    _shopBuys = { food: 0, parts: 0, ponies: 0, athelas: 0 };
    renderShop(intro);
  }

  function renderShop(intro, err) {
    const rows = SHOP_ITEMS.map(it =>
      '<div class="shop-row">' +
        '<span class="shop-label">' + it.label + '</span>' +
        '<span class="shop-price">' + it.price + ' coin / ' + it.step + '</span>' +
        '<span class="shop-qty">' +
          '<button onclick="Game.shopAdj(\'' + it.key + '\',-' + it.step + ')">−</button>' +
          '<span>' + _shopBuys[it.key] + '</span>' +
          '<button onclick="Game.shopAdj(\'' + it.key + '\',' + it.step + ')">+</button>' +
        '</span>' +
        '<span class="shop-cost">' + (_shopBuys[it.key] / it.step * it.price) + ' coin</span>' +
      '</div>'
    ).join('');
    const total = shopTotal();
    UI.showModal(_shopTitle,
      (intro ? '<p>' + intro + '</p>' : '') +
      (err ? '<p class="err">' + err + '</p>' : '') +
      '<div class="shop">' + rows + '</div>' +
      '<div class="shop-total">Total: <strong>' + total + '</strong> coin · Have: <strong>' + G.supplies.coin + '</strong></div>',
      '<button class="btn" onclick="Game.shopBuy()">Buy</button>' +
      '<button class="btn-sec" onclick="Game.shopDone()">Done</button>',
      true
    );
  }

  function shopTotal() {
    return SHOP_ITEMS.reduce((s, it) => s + (_shopBuys[it.key] / it.step) * it.price, 0);
  }

  function shopAdj(key, delta) {
    _shopBuys[key] = Math.max(0, _shopBuys[key] + delta);
    renderShop('');
  }

  function shopBuy() {
    const total = shopTotal();
    if (total > G.supplies.coin) return renderShop('', 'Not enough coin.');
    G.supplies.coin -= total;
    SHOP_ITEMS.forEach(it => { G.supplies[it.key] += _shopBuys[it.key]; });
    if (total > 0) UI.log('Bought supplies. −' + total + ' coin.', 'dim');
    UI.updateConditions();
    UI.closeModal();
    if (_shopDone) _shopDone();
  }

  function shopDone() {
    UI.closeModal();
    if (_shopDone) _shopDone();
  }

  // ── FINAL CHOICE / ENDING ──────────────────────────────────────────
  function finalChoice() {
    // Mount Doom: arrival is the victory. No more keg/brew final decision —
    // the brew system will be reworked. Just end the game with a win.
    UI.log('You stand at the foot of Orodruin. The road ends here.', 'landmark');
    endGame(true);
  }

  function endGame(won) {
    G.gameOver = true;
    G.won = won;
    stopTravel();

    const r = ROLES[G.role];
    const alive = G.companions.filter(c => c.health > 0);
    const dead  = G.companions.filter(c => c.health <= 0);
    const bcond = brewCondition();
    const shared = G.brewSharedWith || [];

    let score = 0;
    if (won) {
      score = Math.round((avgHealth() + G.beer/2 + alive.length * 15 + (G.health > 0 ? 25 : 0)) * r.mult);
    }

    let title, body;
    if (!won) {
      title = 'Lost on the road';
      body = '<div class="end-fail">' +
        '<div class="end-icon">†</div>' +
        '<p>You did not reach Mount Doom.</p>' +
        '<p>Reached mile ' + G.miles + ' of ' + TOTAL_MILES + '. Day ' + G.day + '.</p>' +
        (shared.length ? '<p>Shared the brew with: ' + shared.join(', ') + '</p>' : '<p>The keg arrived untouched.</p>') +
        '</div>';
    } else {
      let grade;
      if (score >= 90) grade = '🥇 Gold — Legendary';
      else if (score >= 70) grade = '🥈 Silver — Remarkable';
      else if (score >= 50) grade = '🥉 Bronze — Solid';
      else grade = '🍺 Participation Pour';

      body = '<div class="end-win">' +
        '<div class="end-grade">' + grade + '</div>' +
        '<p>Reached Mount Doom on day ' + G.day + '.</p>' +
        '<div class="end-brew"><strong>' + G.brew.name + '</strong> — ' + G.brew.style + '<br>' +
          'Arrived at ' + Math.round(G.beer) + '% — <span style="color:' + bcond.color + '">' + bcond.label + '</span></div>' +
        '<div class="end-shared">' +
          (shared.length
            ? '<strong>Shared with ' + shared.length + ' of 7 allies:</strong> ' + shared.join(', ')
            : 'The keg went unshared — every drop intact.') +
        '</div>' +
        '<div class="end-party">' +
          '<div>Survivors: ' + (alive.length ? alive.map(c => c.name).join(', ') : 'none') + '</div>' +
          (dead.length ? '<div class="lost">Lost: ' + dead.map(c => c.name).join(', ') + '</div>' : '') +
        '</div>' +
        '<div class="end-score">Final Score: <strong>' + score + '</strong> / 100</div>' +
        '</div>';
      title = "Journey's End";
    }

    UI.showModal(title, body,
      '<button class="btn" onclick="location.reload()">Play Again</button>',
      true);
  }

  return {
    start, setupBrew, setupRole, pickRole, confirmParty, beginJourney,
    pressContinue, pressTimeOut, resumeAfterDeath,
    navMap, navGuide, navStatus, navRations, navBuy,
    actTrade, actTalk, actRest, actPace, actRations, actHunt,
    shopAdj, shopBuy, shopDone,
    bgClose: (e) => UI.bgClose(e),
    _pickDecision,
  };
})();

window.addEventListener('DOMContentLoaded', () => Game.start());

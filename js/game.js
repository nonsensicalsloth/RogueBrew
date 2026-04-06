// game.js - Central game state and entry point

let state = {
  currentMap: 0,
  currentNode: null,
  team: [],
  items: [],
  badges: 0,
  map: null,
  eliteIndex: 0,
  trainer: 'boy',
  starterSpeciesId: null,
  maxTeamSize: 1,
  hardMode: false,
  breweryName: 'Nonsense Sloth Co.',
  perfectQC: true,
  stuckStandingPending: false,
  modifiers: new Set(),
  nuzlockePerfect: true,
};

// ---- Initialization ----

// ---- brewName migration ----
function migrateBrewNames() {
  try {
    const dex = JSON.parse(localStorage.getItem('poke_dex') || '{}');
    let changed = false;
    for (const id in dex) {
      if (!dex[id].brewName) {
        const species = getSpeciesById(Number(id));
        if (species?.brewName) { dex[id].brewName = species.brewName; changed = true; }
      }
    }
    if (changed) localStorage.setItem('poke_dex', JSON.stringify(dex));
  } catch(e) {}
  try {
    const dex = JSON.parse(localStorage.getItem('poke_shiny_dex') || '{}');
    let changed = false;
    for (const id in dex) {
      if (!dex[id].brewName) {
        const species = getSpeciesById(Number(id));
        if (species?.brewName) { dex[id].brewName = species.brewName; changed = true; }
      }
    }
    if (changed) localStorage.setItem('poke_shiny_dex', JSON.stringify(dex));
  } catch(e) {}
  try {
    const hof = JSON.parse(localStorage.getItem('poke_hall_of_fame') || '[]');
    let changed = false;
    for (const entry of hof) {
      for (const p of (entry.team || [])) {
        if (!p.brewName) {
          const species = getSpeciesById(p.speciesId);
          if (species?.brewName) { p.brewName = species.brewName; changed = true; }
        }
      }
    }
    if (changed) localStorage.setItem('poke_hall_of_fame', JSON.stringify(hof));
  } catch(e) {}
}

async function initGame() {
  migrateBrewNames();

  // ── Auto-resume any in-progress run ──────────────────────────────────────
  if (hasSavedRun()) {
    const resumed = await resumeSavedRun();
    if (resumed) {
      // Wire up the "new run" button in case the player wants to abandon
      document.getElementById('btn-new-run').addEventListener('click', () => startNewRun(false));
      // Unlock hard/modifiers buttons in the background (they may return to title)
      _setupTitleButtons();
      return;
    }
  }

  showScreen('title-screen');
  document.getElementById('btn-new-run').addEventListener('click', () => startNewRun(false));

  _setupTitleButtons();
}

function updateModifierHint() {
  const modHint = document.getElementById('modifiers-hint');
  if (!modHint) return;
  const active = getActiveModifiers();
  if (active.size > 0) {
    modHint.textContent = `${active.size} modifier${active.size > 1 ? 's' : ''} active`;
    modHint.style.color = 'var(--accent, #fa0)';
  } else {
    modHint.textContent = '';
    modHint.style.color = '';
  }
}

function _setupTitleButtons() {
  const hardBtn  = document.getElementById('btn-hard-run');
  const hardHint = document.getElementById('hard-mode-hint');
  if (isBrewlogAt150()) {
    hardBtn.disabled = false;
    hardBtn.textContent = '💀 Hard Mode';
    hardHint.textContent = 'Every fight grants exactly 1 level';
  } else {
    hardHint.textContent = 'Complete the Brewlog to unlock';
  }
  // Use onclick to avoid stacking listeners on repeated initGame calls
  hardBtn.onclick = () => startNewRun(true);

  const modBtn  = document.getElementById('btn-modifiers');
  const modHint = document.getElementById('modifiers-hint');
  if (modBtn) {
    const hasWon = getEliteWins() >= 1;
    if (hasWon) {
      modBtn.disabled = false;
      modBtn.textContent = '🧪 Run Modifiers';
      updateModifierHint();
    } else {
      modBtn.disabled = true;
      modBtn.textContent = '🔒 Run Modifiers';
      if (modHint) modHint.textContent = 'Beat the Championship to unlock';
    }
    // Use onclick to avoid stacking listeners on repeated initGame calls
    modBtn.onclick = () => openModifiersModal();
  }
}

async function startNewRun(hardMode = false) {
  clearRun(); // wipe any previous save before starting fresh
  const mods = getActiveModifiers();
  state = { currentMap: 0, currentNode: null, team: [], items: [], badges: 0, map: null, eliteIndex: 0, trainer: 'boy', starterSpeciesId: null, maxTeamSize: 1, hardMode, breweryName: 'Nonsense Sloth Co.', perfectQC: true, stuckStandingPending: false, modifiers: mods, nuzlockePerfect: true };
  await showTrainerSelect();
}

async function showTrainerSelect() {
  showScreen('trainer-screen');
  const boyCard  = document.getElementById('trainer-boy');
  const girlCard = document.getElementById('trainer-girl');
  boyCard.querySelector('.trainer-icon-wrap').innerHTML  = TRAINER_SVG.boy;
  girlCard.querySelector('.trainer-icon-wrap').innerHTML = TRAINER_SVG.girl;

  await new Promise(resolve => {
    function pick(gender) { state.trainer = gender; resolve(); }
    boyCard.onclick   = () => pick('boy');
    boyCard.onkeydown = e => { if (e.key==='Enter'||e.key===' ') pick('boy'); };
    girlCard.onclick   = () => pick('girl');
    girlCard.onkeydown = e => { if (e.key==='Enter'||e.key===' ') pick('girl'); };
  });
  await showBreweryNameScreen();
  await showStarterSelect();
}

async function showBreweryNameScreen() {
  showScreen('brewery-name-screen');
  return new Promise(resolve => {
    const input = document.getElementById('brewery-name-input');
    const confirm = document.getElementById('brewery-name-confirm');
    input.value = '';
    input.placeholder = 'e.g. Nonsense Sloth Co.';
    input.focus();
    function finish() {
      const val = input.value.trim();
      state.breweryName = val || 'Nonsense Sloth Co.';
      if (val) { const a = unlockAchievement('grand_opening'); if (a) showAchievementToast(a); }
      resolve();
    }
    confirm.onclick = finish;
    input.onkeydown = e => { if (e.key === 'Enter') finish(); };
  });
}

 async function showStarterSelect() {
  state.modifiers = getActiveModifiers();
  // 1. Setup the basic Screen & Container
  showScreen('starter-screen');
  const container = document.getElementById('starter-choices');
  if (!container) return;
  container.innerHTML = '';

  // --- SHINY HUNT PATH ---
  if (state.modifiers && state.modifiers.has('shiny_hunt')) {
    const header = document.createElement('h2');
    header.innerText = '✨ Shiny Hunt: Choose Your Shiny Starter!';
    header.style.cssText = 'text-align:center;width:100%;margin-bottom:20px;';
    container.appendChild(header);

    const starters = STARTER_IDS.map(id => getSpeciesById(id));
    for (const species of starters) {
      if (!species) continue;
      const inst = createInstance(species, 5, true); // 100% shiny
      const wrapper = document.createElement('div');
      wrapper.innerHTML = renderPokemonCard(inst, true, false);
      const card = wrapper.querySelector('.poke-card');
      if (card) {
        card.style.cursor = 'pointer';
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.addEventListener('click', () => selectStarter(inst));
        card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') selectStarter(inst); });
        container.appendChild(card);
      }
    }
    return;
  }
  // --- END SHINY HUNT PATH ---

  // --- START OF EXPERIMENTAL BATCH PATH ---
  if (state.modifiers && state.modifiers.has('experimental_batch')) {
    // Pick ONE truly random species from the entire game
    const randomSpecies = SPECIES_DATA[Math.floor(Math.random() * SPECIES_DATA.length)];
    
    // Create the instance (1% natural shiny chance)
    const inst = createInstance(randomSpecies, 5, Math.random() < 0.01);
    
    // Add a special header so the player knows what's happening
    const header = document.createElement('h2');
    header.innerText = "Experimental Batch: Your Random Brew";
    header.style.textAlign = 'center';
    header.style.width = '100%';
    header.style.marginBottom = '20px';
    container.appendChild(header);

    // Reuse the card rendering logic
    const wrapper = document.createElement('div');
    wrapper.innerHTML = renderPokemonCard(inst, true, false);
    const card = wrapper.querySelector('.poke-card');
    
    if (card) {
      card.style.cursor = 'pointer';
      card.addEventListener('click', () => {
        // Capture brewery name from input before moving to map
        const nameInput = document.getElementById('brewery-name-input');
        if (nameInput) state.breweryName = nameInput.value.trim() || "Nonsense Sloth Co.";
        selectStarter(inst);
      });
      container.appendChild(card);
    }
    
    return; // Exit the function here so the Normal Flow doesn't run
  }
  // --- END OF EXPERIMENTAL BATCH PATH ---


  // --- START OF NORMAL FLOW (Your Original Code) ---
  container.innerHTML = '<div class="loading">Loading starters...</div>';
  const starters = STARTER_IDS.map(id => getSpeciesById(id));
  container.innerHTML = '';

  for (const species of starters) {
    if (!species) continue;
    const inst = createInstance(species, 5, Math.random() < 0.01);
    const wrapper = document.createElement('div');
    wrapper.innerHTML = renderPokemonCard(inst, true, false);
    const card = wrapper.querySelector('.poke-card');
    
    if (card) {
      card.style.cursor = 'pointer';
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.addEventListener('click', () => selectStarter(inst));
      card.addEventListener('keydown', e => { 
        if (e.key === 'Enter' || e.key === ' ') selectStarter(inst); 
      });
      container.appendChild(card);
    }
  }
}

// ---- Nickname Prompt ----
function showNicknamePrompt(anchorEl, defaultValue, onConfirm) {
  document.querySelectorAll('.nickname-prompt').forEach(el => el.remove());
  const wrap = document.createElement('div');
  wrap.className = 'nickname-prompt';
  wrap.innerHTML = `
    <div class="nickname-prompt-label">Name this brew</div>
    <div class="nickname-prompt-row">
      <input class="nickname-prompt-input" type="text" maxlength="28"
             value="${defaultValue}" placeholder="Up to 28 chars" autocomplete="off" spellcheck="false">
      <button class="nickname-prompt-confirm btn-primary">Confirm</button>
    </div>`;
  anchorEl.after(wrap);
  const input = wrap.querySelector('.nickname-prompt-input');
  input.focus();
  input.select();
  wrap.querySelector('.nickname-prompt-confirm').addEventListener('click', () => {
    const val = input.value.trim();
    if (val) { const a = unlockAchievement('house_special'); if (a) showAchievementToast(a); }
    onConfirm(val || null);
  });
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') wrap.querySelector('.nickname-prompt-confirm').click();
  });
}

function selectStarter(pokemon) {
  const normalUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.speciesId}.png`;
  markPokedexCaught(pokemon.speciesId, pokemon.name, pokemon.types, normalUrl, pokemon.brewName);
  if (pokemon.isShiny) { markShinyDexCaught(pokemon.speciesId, pokemon.name, pokemon.types, pokemon.spriteUrl, pokemon.brewName); const a = unlockAchievement('rare_find'); if (a) showAchievementToast(a); }
  state.team = [pokemon];
  state.starterSpeciesId = pokemon.speciesId;
  // Small Tap List: hard cap of 3
  state.maxTeamSize = state.modifiers && state.modifiers.has('small_tap_list') ? 3 : 1;
  const cards = document.querySelectorAll('#starter-choices .poke-card');
  const defaultName = pokemon.brewName || pokemon.name;
  cards.forEach(card => { card.style.opacity = '0.3'; card.style.pointerEvents = 'none'; });
  const chosenCard = [...cards].find(card => card.querySelector('img')?.src?.includes(`/${pokemon.speciesId}.png`)) || cards[0];
  if (chosenCard) chosenCard.style.opacity = '1';
  showNicknamePrompt(chosenCard, defaultName, (nick) => {
    pokemon.nickname = nick;
    pokemon.caughtOnMap = 0; // starter is always map 0
    startMap(0);
    saveRun(); // 🔒 lock in the starter choice immediately
  });
}

// ---- Map Management ----

function startMap(mapIndex) {
  state.currentMap = mapIndex;
  state.map = generateMap(mapIndex);

  // Full heal between arenas (skip the very first map)
  if (mapIndex > 0) {
    for (const p of state.team) {
      p.currentHp = p.maxHp;
    }
  }

  const startNode = state.map.nodes['n0_0'];
  state.currentNode = startNode;

  saveRun(); // save whenever a new map is entered
  showMapScreen();
}

function showMapScreen() {
  showScreen('map-screen');
  const mapInfo = document.getElementById('map-info');
  if (mapInfo) {
    const isFinal = state.currentMap === 8;
    const leader = isFinal ? null : GYM_LEADERS[state.currentMap];
    const range = MAP_LEVEL_RANGES[state.currentMap];
    mapInfo.innerHTML = isFinal
      ? `<span>Elite Four & Champion</span><span>Levels ${range[0]}–${range[1]}</span>`
      : `<span>Map ${state.currentMap+1}: vs <b>${leader.name}</b> (${leader.type})</span><span>Levels ${range[0]}–${range[1]}</span>`;
  }
  const badgeEl = document.getElementById('badge-count');
  if (badgeEl) {
    const BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/badges/';
    badgeEl.innerHTML = Array.from({ length: 8 }, (_, i) => {
      const earned = i < state.badges;
      const label = GYM_LEADERS[i].badge;
      return earned
        ? `<img src="${BASE}${i + 1}.png" alt="${label}" title="${label}" class="badge-icon-img">`
        : `<span class="badge-icon-empty" title="${label}"></span>`;
    }).join('');
  }
  const winsEl = document.getElementById('elite-wins-count');
  if (winsEl) winsEl.textContent = `Wins: ${getEliteWins()}`;

  renderTeamBar(state.team);
  renderItemBadges(state.items);

  const mapContainer = document.getElementById('map-container');
  saveRun(); // lock map layout — prevents refreshing to reroll node positions
  renderMap(state.map, mapContainer, onNodeClick);
}

async function onNodeClick(node) {
  state.currentNode = node;
  saveRun(); // lock node choice before RNG runs for catches, items, events
  let resolvedType = node.type;

  if (node.type === NODE_TYPES.QUESTION) {
    await doBreweryEventNode(node);
    return;
  }

  switch (resolvedType) {
    case NODE_TYPES.BATTLE:
      await doBattleNode(node);
      break;
    case NODE_TYPES.CATCH:
      await doCatchNode(node);
      break;
    case NODE_TYPES.ITEM:
      doItemNode(node);
      break;
    case NODE_TYPES.BOSS:
      await doBossNode(node);
      break;
    case NODE_TYPES.POKECENTER:
      doQCLabNode(node);
      break;
    case NODE_TYPES.TRADE:
      await doTradeNode(node);
      break;
    case 'shiny':
      await doShinyNode(node);
      break;
    case 'mega':
      doMegaNode(node);
      break;
    default:
      await doBattleNode(node);
  }
}

// ---- Brewery Random Events ----

// ── Helper: show a single result card with an OK button, then advance ──
function showEventResult(node, { icon, title, lines, okLabel = 'OK', badgeClass = '' }) {
  document.getElementById('event-icon').textContent = icon;
  document.getElementById('event-title').textContent = title;
  document.getElementById('event-flavor').textContent = '';

  const choicesEl = document.getElementById('event-choices');
  choicesEl.innerHTML = '';

  const card = document.createElement('div');
  card.className = `event-card event-result ${badgeClass}`;
  card.innerHTML = `
    <div class="event-card-icon">${icon}</div>
    <div class="event-card-body">${lines.map(l => `<p class="event-card-desc">${l}</p>`).join('')}</div>
    <button class="btn-primary event-ok-btn">${okLabel}</button>`;
  card.querySelector('.event-ok-btn').addEventListener('click', () => {
    advanceFromNode(state.map, node.id);
    saveRun();
    showMapScreen();
  });
  choicesEl.appendChild(card);
}

const BREWERY_EVENTS = [
  // ── GOOD EVENTS (weight 10 each) ──────────────────────────────────────
  {
    id: 'tap_release',
    weight: 10,
    icon: '🍺',
    title: 'Surprise Tap Release!',
    flavor: 'A limited batch just cleared QC. Word got out — pick night.',
    type: 'item_choice',
  },
  {
    id: 'head_brewer',
    weight: 10,
    icon: '👨‍🍳',
    title: 'Head Brewer Returns!',
    flavor: `The head brewer's back from sabbatical. Everyone gets a top-up.`,
    type: 'announce',
    apply(node) {
      for (const p of state.team) p.currentHp = p.maxHp;
    },
    result(node) {
      showEventResult(node, {
        icon: '👨‍🍳',
        title: 'Head Brewer Returns!',
        lines: ['The whole team has been fully restored.'],
        okLabel: 'Nice!',
      });
    },
  },
  {
    id: 'gabf_medal',
    weight: 10,
    icon: '🏅',
    title: 'Medal Won!',
    flavor: 'One of your recipes just took gold at the competition. The whole team levels up.',
    type: 'announce',
    apply(node) {
      for (const p of state.team) {
        p.level = Math.min(p.level + 1, 100);
        const newMaxHp = calcHp(p.baseStats.hp, p.level);
        p.currentHp = Math.min(p.currentHp + (newMaxHp - p.maxHp), newMaxHp);
        p.maxHp = newMaxHp;
      }
    },
    result(node) {
      document.getElementById('event-flavor').textContent = 'Every brew gained a level!';
      const choicesEl = document.getElementById('event-choices');
      choicesEl.innerHTML = '';
      for (const p of state.team) {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = renderPokemonCard(p, false, false);
        const card = wrapper.querySelector('.poke-card');
        card.style.cursor = 'default';
        choicesEl.appendChild(card);
      }
      const okWrap = document.createElement('div');
      okWrap.style.cssText = 'width:100%;text-align:center;margin-top:8px;';
      const okBtn = document.createElement('button');
      okBtn.className = 'btn-primary';
      okBtn.textContent = 'Cheers! 🥂';
      okBtn.addEventListener('click', () => { advanceFromNode(state.map, node.id); saveRun(); showMapScreen(); });
      okWrap.appendChild(okBtn);
      choicesEl.appendChild(okWrap);
    },
  },
  {
    id: 'perfect_pitch',
    weight: 10,
    icon: '🧫',
    title: 'Perfect Yeast Pitch!',
    flavor: 'Ideal temp, ideal cell count. Pick a brew to fully restore.',
    type: 'pick_pokemon',
    apply(node, pokemon) {
      pokemon.currentHp = pokemon.maxHp;
      showEventResult(node, {
        icon: '🧫',
        title: 'Perfect Pitch!',
        lines: [`${pokemon.nickname || pokemon.name} is back to full health.`],
        okLabel: `Let's go!`,
      });
    },
  },

  // ── RISKY EVENTS (weight 10 each) ─────────────────────────────────────
  {
    id: 'stuck_sparge',
    weight: 10,
    icon: '🥣',
    title: 'Stuck Sparge!',
    flavor: 'The sparge has stalled and runoff has stopped. Cut your losses or push through the pain?',
    type: 'choice',
    options: [
      {
        icon: '🗑️',
        label: 'Dump It',
        desc: 'Lose a random held item or bag item. Team stays healthy.',
        style: 'event-risky',
        apply(node) {
          const bagIdx = state.items.findIndex(it => !it.usable);
          if (bagIdx >= 0) {
            const lost = state.items.splice(bagIdx, 1)[0];
            showEventResult(node, {
              icon: '🗑️', title: 'Batch Dumped',
              lines: [`${lost.name} went down the drain.`, 'Team is unharmed.'],
            });
            return;
          }
          for (const p of state.team) {
            if ((p.heldItems || []).length > 0) {
              const lost = p.heldItems.splice(0, 1)[0];
              showEventResult(node, {
                icon: '🗑️', title: 'Batch Dumped',
                lines: [`${p.nickname || p.name} lost ${lost.name}.`, 'Team is unharmed.'],
              });
              return;
            }
          }
          showEventResult(node, {
            icon: '🗑️', title: 'Nothing to Dump',
            lines: ['Nothing to lose — you dodged it completely.'],
          });
        },
      },
      {
        icon: '😤',
        label: 'Push Through',
        desc: 'Keep everything. Each brew loses ~15% of their max HP.',
        style: 'event-risky',
        apply(node) {
          state.stuckStandingPending = true;
          for (const p of state.team) {
            const dmg = Math.max(1, Math.floor(p.maxHp * 0.15));
            p.currentHp = Math.max(1, p.currentHp - dmg);
          }
          showEventResult(node, {
            icon: '😤', title: 'Pushed Through',
            lines: ['The sparge was forced through — barely.', 'Every brew took ~15% damage.'],
            badgeClass: 'event-bad',
          });
        },
      },
    ],
  },
  {
    id: 'new_technique',
    weight: 10,
    icon: '⚗️',
    title: 'Explore a New Technique!',
    flavor: 'An experimental process. Could be a breakthrough — or a blowout. 50/50.',
    type: 'pick_pokemon',
    risky: true,
    apply(node, pokemon) {
      if (Math.random() < 0.5) {
        const gained = 2;
        pokemon.level = Math.min(pokemon.level + gained, 100);
        const newMaxHp = calcHp(pokemon.baseStats.hp, pokemon.level);
        pokemon.currentHp = Math.min(pokemon.currentHp + (newMaxHp - pokemon.maxHp), newMaxHp);
        pokemon.maxHp = newMaxHp;
        showEventResult(node, {
          icon: '⚗️', title: 'Breakthrough!',
          lines: [`${pokemon.nickname || pokemon.name} nailed it.`, `Gained 2 levels — now Lv. ${pokemon.level}.`],
          okLabel: `Let's go!`,
        });
      } else {
        const dmg = Math.max(1, Math.floor(pokemon.maxHp * 0.25));
        pokemon.currentHp = Math.max(1, pokemon.currentHp - dmg);
        showEventResult(node, {
          icon: '💥', title: 'Blowout!',
          lines: [`${pokemon.nickname || pokemon.name} took a hit from the failed experiment.`, 'Lost 25% HP.'],
          badgeClass: 'event-bad',
        });
      }
    },
  },

  // ── TAP TAKEOVER (weight 10) ───────────────────────────────────────────
  {
    id: 'tap_takeover',
    weight: 10,
    icon: '🔄',
    title: 'Tap Takeover Night!',
    flavor: 'A visiting brewery wants a spot on your line. Agree to swap out a brew — or send them packing.',
    type: 'tap_takeover',
  },

  // ── BAD EVENTS (weight 4 each) ─────────────────────────────────────────
  {
    id: 'glycol_fail',
    weight: 4,
    icon: '🌡️',
    title: 'Glycol Chiller Failed!',
    flavor: 'The fermentation temps spiked overnight.',
    type: 'announce',
    apply(node) {
      for (const p of state.team) {
        const dmg = Math.max(1, Math.floor(p.maxHp * 0.1));
        p.currentHp = Math.max(1, p.currentHp - dmg);
      }
    },
    result(node) {
      showEventResult(node, {
        icon: '🌡️',
        title: 'Glycol Chiller Failed!',
        lines: ['Fermentation temps spiked overnight.', 'Every brew lost 10% HP.'],
        okLabel: 'Damn.',
        badgeClass: 'event-bad',
      });
    },
  },
  {
    id: 'osha_inspection',
    weight: 4,
    icon: '📋',
    title: 'OSHA Inspection!',
    flavor: 'Inspectors showed up unannounced.',
    type: 'announce',
    apply(node) {
      const bagIdx = state.items.findIndex(it => !it.usable);
      if (bagIdx >= 0) {
        this._lost = state.items.splice(bagIdx, 1)[0];
        this._lostFrom = 'bag';
        return;
      }
      for (const p of state.team) {
        if ((p.heldItems || []).length > 0) {
          this._lost = p.heldItems.splice(0, 1)[0];
          this._lostFrom = p.nickname || p.name;
          return;
        }
      }
      this._lost = null;
    },
    result(node) {
      const lines = this._lost
        ? [
            `Inspectors took ${this._lost.name}${this._lostFrom === 'bag' ? ' from your bag' : ` from ${this._lostFrom}`}.`,
            'Keep the floor clear next time.',
          ]
        : ['They found nothing to cite. You got lucky.'];
      showEventResult(node, {
        icon: '📋',
        title: 'OSHA Inspection!',
        lines,
        okLabel: 'Noted.',
        badgeClass: this._lost ? 'event-bad' : '',
      });
    },
  },
  {
    id: 'keg_recall',
    weight: 4,
    icon: '⬇️',
    title: 'Keg Recall!',
    flavor: 'A distributor returned a full pallet.',
    type: 'announce',
    apply(node) {
      const target = [...state.team].sort((a, b) => b.level - a.level)[0];
      if (target && target.level > 1) {
        this._target = target;
        target.level = Math.max(1, target.level - 1);
        const newMaxHp = calcHp(target.baseStats.hp, target.level);
        target.maxHp = newMaxHp;
        target.currentHp = Math.min(target.currentHp, newMaxHp);
      } else {
        this._target = null;
      }
    },
    result(node) {
      const lines = this._target
        ? [`${this._target.nickname || this._target.name} took the hit.`, `Dropped to Lv. ${this._target.level}.`]
        : ['The recall came in but nothing was lost.'];
      showEventResult(node, {
        icon: '⬇️',
        title: 'Keg Recall!',
        lines,
        okLabel: 'Ouch.',
        badgeClass: this._target ? 'event-bad' : '',
      });
    },
  },

  // ── WILD EVENTS (weight 0 normally — only active with wild_events modifier) ──
  {
    id: 'beer_festival',
    weight: 0,
    icon: '🎪',
    title: 'Beer Festival!',
    flavor: 'The annual fest is in town. Six breweries have taps pouring — your pick.',
    type: 'beer_festival',
  },
  {
    id: 'collab_brew',
    weight: 0,
    icon: '🤝',
    title: 'Collaboration Brew!',
    flavor: 'A respected local brewery wants to collaborate. They bring one of their best — free of charge.',
    type: 'collab_brew',
  },
  {
    id: 'ingredient_windfall',
    weight: 0,
    icon: '🌿',
    title: 'Ingredient Windfall!',
    flavor: 'A hop supplier massively overshipped your order. Pick any held item already in your bag — you just got a free duplicate.',
    type: 'ingredient_windfall',
  },
  {
    id: 'high_gravity',
    weight: 0,
    icon: '⚗️',
    title: 'High Gravity Experiment!',
    flavor: 'You push a brew to imperial strength. Pure gamble — greatness or catastrophe, no in-between.',
    type: 'pick_pokemon_custom',
    apply(node, pokemon) {
      if (Math.random() < 0.5) {
        // Success: +3 levels and goes shiny
        pokemon.level = Math.min(pokemon.level + 3, 100);
        const newMax = calcHp(pokemon.baseStats.hp, pokemon.level);
        pokemon.currentHp = Math.min(pokemon.currentHp + (newMax - pokemon.maxHp), newMax);
        pokemon.maxHp = newMax;
        if (!pokemon.isShiny) {
          pokemon.isShiny = true;
          pokemon.spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${pokemon.speciesId}.png`;
          markShinyDexCaught(pokemon.speciesId, pokemon.name, pokemon.types, pokemon.spriteUrl, pokemon.brewName);
          checkDexAchievements();
        }
        showEventResult(node, {
          icon: '✨',
          title: 'Imperial Success!',
          lines: [
            `${pokemon.nickname || pokemon.name} nailed the high-gravity process.`,
            `Gained 3 levels and went shiny!`,
          ],
          okLabel: `Let's go!`,
        });
      } else {
        // Failure: faints immediately
        pokemon.currentHp = 0;
        // Nuzlocke: permanently remove if modifier active
        if (state.modifiers && state.modifiers.has('nuzlocke')) {
          state.nuzlockePerfect = false;
          state.team = state.team.filter(p => p !== pokemon);
          showEventResult(node, {
            icon: '💥', title: 'Blowout — Gone for Good!',
            lines: [
              `${pokemon.nickname || pokemon.name} couldn't handle the pressure.`,
              `Nuzlocke: permanently released.`,
            ],
            badgeClass: 'event-bad',
          });
        } else {
          showEventResult(node, {
            icon: '💥', title: 'Catastrophic Blowout!',
            lines: [
              `${pokemon.nickname || pokemon.name} couldn't handle the pressure.`,
              `Fainted. Revive it before the next battle.`,
            ],
            badgeClass: 'event-bad',
          });
        }
      }
    },
  },
  {
    id: 'ghost_tap',
    weight: 0,
    icon: '👻',
    title: 'Ghost Tap!',
    flavor: 'A mysterious handle nobody can explain appeared on your bar overnight. Something poured itself.',
    type: 'ghost_tap',
  },
  {
    id: 'anniversary_batch',
    weight: 0,
    icon: '🎂',
    title: 'Anniversary Batch!',
    flavor: "It's your brewery's anniversary. The OG recipes get love — brews you've had since the beginning gain 2 levels.",
    type: 'announce',
    apply(node) {
      // "Since map 1" = on team at the start of map 1, i.e. caught on map 0 (starter + map-0 catches).
      // We track this via pokemon.caughtOnMap. Starter is always map 0.
      let boosted = 0;
      for (const p of state.team) {
        if ((p.caughtOnMap ?? 0) === 0) {
          p.level = Math.min(p.level + 2, 100);
          const newMax = calcHp(p.baseStats.hp, p.level);
          p.currentHp = Math.min(p.currentHp + (newMax - p.maxHp), newMax);
          p.maxHp = newMax;
          boosted++;
        }
      }
      this._boosted = boosted;
    },
    result(node) {
      showEventResult(node, {
        icon: '🎂',
        title: 'Anniversary Batch!',
        lines: this._boosted > 0
          ? [`${this._boosted} original brew${this._boosted > 1 ? 's' : ''} gained 2 levels!`, `Here's to the classics.`]
          : [`None of your current brews have been around since day one.`, `Maybe next run.`],
        okLabel: 'Cheers! 🥂',
      });
    },
  },
];

// Wild Events modifier — event IDs and their weights when active
const FESTIVAL_EVENT_WEIGHTS = {
  beer_festival:       8,
  collab_brew:         4,
  ingredient_windfall: 6,
  high_gravity:        5,
  ghost_tap:           4,
  anniversary_batch:   5,
};

function pickBreweryEvent() {
  const festivalActive = typeof hasModifier === 'function' && hasModifier('wild_events');
  const pool = BREWERY_EVENTS.map(ev => {
    const festWeight = FESTIVAL_EVENT_WEIGHTS[ev.id];
    if (festWeight !== undefined) return { ...ev, weight: festivalActive ? festWeight : 0 };
    return ev;
  }).filter(ev => ev.weight > 0);

  const total = pool.reduce((s, e) => s + e.weight, 0);
  let r = Math.random() * total;
  for (const ev of pool) {
    r -= ev.weight;
    if (r <= 0) return ev;
  }
  return pool[0];
}

async function doBreweryEventNode(node) {
  // Lock the event choice on first visit so refresh can't reroll it
  if (!node.lockedEventId) {
    node.lockedEventId = pickBreweryEvent().id;
    saveRun();
  }
  const ev = BREWERY_EVENTS.find(e => e.id === node.lockedEventId) || BREWERY_EVENTS[0];

  if (ev.type === 'item_choice') {
    doItemNode(node);
    return;
  }

  if (ev.type === 'tap_takeover') {
    await doTapTakeoverEvent(node, ev);
    return;
  }

  if (ev.type === 'beer_festival') {
    await doBeerFestivalEvent(node);
    return;
  }

  if (ev.type === 'collab_brew') {
    await doCollabBrewEvent(node);
    return;
  }

  if (ev.type === 'ingredient_windfall') {
    doIngredientWindfallEvent(node);
    return;
  }

  if (ev.type === 'ghost_tap') {
    await doGhostTapEvent(node);
    return;
  }

  // All other events show the event screen with title + flavor first
  showScreen('event-screen');
  renderTeamBar(state.team, document.getElementById('event-team-bar'));
  document.getElementById('event-icon').textContent = ev.icon;
  document.getElementById('event-title').textContent = ev.title;
  document.getElementById('event-flavor').textContent = ev.flavor;

  const choicesEl = document.getElementById('event-choices');
  choicesEl.innerHTML = '';

  // 'announce' — apply effect immediately, then show result card with OK button
  if (ev.type === 'announce') {
    ev.apply(node);
    ev.result(node);
    return;
  }

  // 'choice' — two clickable option cards
  if (ev.type === 'choice') {
    for (const opt of ev.options) {
      const card = document.createElement('div');
      card.className = `event-card ${opt.style || ''}`;
      card.innerHTML = `
        <div class="event-card-icon">${opt.icon}</div>
        <div class="event-card-label">${opt.label}</div>
        <div class="event-card-desc">${opt.desc}</div>`;
      card.addEventListener('click', () => opt.apply(node));
      choicesEl.appendChild(card);
    }
  }

  // 'pick_pokemon' — full poke-cards for each team member
  if (ev.type === 'pick_pokemon') {
    for (const p of state.team) {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = renderPokemonCard(p, true, false);
      const card = wrapper.querySelector('.poke-card');
      if (ev.risky) card.style.borderColor = '#b8860b';
      card.addEventListener('click', () => ev.apply(node, p));
      card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') card.click(); });
      choicesEl.appendChild(card);
    }
  }

  // 'pick_pokemon_custom' — same as pick_pokemon but with gold border (high-stakes)
  if (ev.type === 'pick_pokemon_custom') {
    for (const p of state.team) {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = renderPokemonCard(p, true, false);
      const card = wrapper.querySelector('.poke-card');
      card.style.borderColor = '#b8860b';
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.addEventListener('click', () => { ev.apply(node, p); saveRun(); });
      card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') card.click(); });
      choicesEl.appendChild(card);
    }
  }
}

async function doTapTakeoverEvent(node, ev) {
  // Phase 1: offer flee or accept — fetch species now so pool is locked either way
  showScreen('event-screen');
  document.getElementById('event-icon').textContent = '🔄';
  document.getElementById('event-title').textContent = 'Tap Takeover Night!';
  document.getElementById('event-flavor').textContent =
    'A visiting brewery wants a spot on your line. Agree to swap out a brew — or send them packing.';
  renderTeamBar(state.team, document.getElementById('event-team-bar'));

  // ── Lock species on first load — prevents refreshing to reroll the visiting taps ──
  if (!node.lockedTakeoverSpecies) {
    document.getElementById('event-choices').innerHTML =
      '<div style="color:var(--text-dim);font-size:11px;">Scouting visiting taps…</div>';
    node.lockedTakeoverSpecies = await getCatchChoices(state.currentMap);
    saveRun(); // 🔒 freeze the visiting taps now
  }

  const species = node.lockedTakeoverSpecies;
  const choicesEl = document.getElementById('event-choices');
  choicesEl.innerHTML = '';

  // Flee card
  const fleeCard = document.createElement('div');
  fleeCard.className = 'event-card';
  fleeCard.innerHTML = `
    <div class="event-card-icon">🚪</div>
    <div class="event-card-label">Send Them Packing</div>
    <div class="event-card-desc">Turn down the offer. Keep your lineup as-is.</div>`;
  fleeCard.addEventListener('click', () => {
    advanceFromNode(state.map, node.id);
    saveRun();
    showMapScreen();
  });
  choicesEl.appendChild(fleeCard);

  // Accept card
  const acceptCard = document.createElement('div');
  acceptCard.className = 'event-card event-risky';
  acceptCard.innerHTML = `
    <div class="event-card-icon">🤝</div>
    <div class="event-card-label">Make the Swap</div>
    <div class="event-card-desc">Choose a brew to rotate out. Pick your replacement from 3 visiting taps.</div>`;
  acceptCard.addEventListener('click', () => {
    if (!species || species.length === 0) {
      advanceFromNode(state.map, node.id);
      saveRun();
      showMapScreen();
      return;
    }
    doTapTakeoverOffer(node, species);
  });
  choicesEl.appendChild(acceptCard);
}

function doTapTakeoverOffer(node, species) {
  // Phase 2a: player picks which brew rotates out
  showScreen('event-screen');
  document.getElementById('event-icon').textContent = '🔄';
  document.getElementById('event-title').textContent = `Who's Rotating Out?`;
  document.getElementById('event-flavor').textContent =
    `Choose which brew to swap out. Once you pick, you'll be shown 3 replacements — no backing out.`;
  renderTeamBar(state.team, document.getElementById('event-team-bar'));

  const choicesEl = document.getElementById('event-choices');
  choicesEl.innerHTML = '';

  for (const [outIdx, p] of state.team.entries()) {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = renderPokemonCard(p, true, false);
    const card = wrapper.querySelector('.poke-card');
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.addEventListener('click', () => doTapTakeoverReplace(node, species, outIdx));
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') card.click(); });
    choicesEl.appendChild(card);
  }
}

function doTapTakeoverReplace(node, species, outIdx) {
  // Phase 2b: outgoing locked, show 3 replacements — no escape
  const outgoing = state.team[outIdx];

  showScreen('catch-screen');
  document.querySelector('#catch-screen h2').textContent = '🔄 Tap Takeover Night!';
  document.querySelector('#catch-screen p').textContent =
    `${outgoing.nickname || outgoing.name} is rotating out. Pick your replacement:`;

  const choicesEl = document.getElementById('catch-choices');
  choicesEl.innerHTML = '';

  const skipBtn = document.getElementById('btn-skip-catch');
  skipBtn.style.display = 'none';

  const offers = species.map(s => createInstance(s, outgoing.level));

  for (const offer of offers) {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = renderPokemonCard(offer, true, false);
    const card = wrapper.querySelector('.poke-card');
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.addEventListener('click', () => {
      for (const it of (outgoing.heldItems || [])) state.items.push(it);
      state.team.splice(outIdx, 1, offer);
      skipBtn.style.display = '';
      advanceFromNode(state.map, node.id);
      saveRun();
      showMapScreen();
      showMapNotification(`🔄 Swapped in ${offer.name}!`);
    });
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') card.click(); });
    choicesEl.appendChild(card);
  }

  renderTeamBar(state.team, document.getElementById('catch-team-bar'));
}

// ---- Wild Events Handlers ----

async function doBeerFestivalEvent(node) {
  const isShinyHunt = !!(state.modifiers && state.modifiers.has('shiny_hunt'));

  showScreen('catch-screen');
  document.querySelector('#catch-screen h2').textContent = isShinyHunt ? '✨ Beer Festival — Shiny Hunt!' : '🎪 Beer Festival!';
  document.querySelector('#catch-screen p').textContent = isShinyHunt
    ? 'Six taps are pouring — only shinies can be caught!'
    : 'Six taps are pouring — pick your favourite.';
  document.getElementById('btn-skip-catch').style.display = '';
  renderTeamBar(state.team, document.getElementById('catch-team-bar'));
  const choicesEl = document.getElementById('catch-choices');
  choicesEl.innerHTML = '<div class="loading">Pouring samples…</div>';

  // Lock 6 choices on first visit — call twice and deduplicate for genuine variety
  if (!node.lockedFestivalInstances) {
    const level = getLevelForNode(node);
    const glitterCount = state.team.filter(p => (p.heldItems||[]).some(it => it.id === 'edible_glitter')).length;
    const cardShinyChance = (isShinyHunt ? 0.10 : 0.01) + (glitterCount * 0.05);
    const pool1 = await getCatchChoices(state.currentMap);
    const pool2 = await getCatchChoices(state.currentMap);
    const seen = new Set();
    const unique = [...pool1, ...pool2].filter(sp => {
      const id = sp.id ?? sp.speciesId;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    }).slice(0, 6);
    node.lockedFestivalInstances = unique.map(sp =>
      createInstance(sp, level, Math.random() < cardShinyChance, getMoveTierForMap(state.currentMap))
    );
    saveRun();
  }

  choicesEl.innerHTML = '';
  const dex = getPokedex();
  for (const inst of node.lockedFestivalInstances) {
    const caught = !!(dex[inst.speciesId]?.caught);
    const canCatch = !isShinyHunt || inst.isShiny;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = renderPokemonCard(inst, true, false, caught);
    const card = wrapper.querySelector('.poke-card');

    if (canCatch) {
      card.style.cursor = 'pointer';
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.addEventListener('click', () => catchPokemon(inst, node));
      card.addEventListener('keydown', e => { if (e.key==='Enter'||e.key===' ') catchPokemon(inst, node); });
    } else {
      card.style.opacity = '0.4';
      card.style.cursor = 'not-allowed';
      const label = document.createElement('div');
      label.style.cssText = 'text-align:center;font-size:9px;color:#f88;margin-top:4px;font-family:"Press Start 2P",monospace;';
      label.textContent = 'Not shiny — cannot catch';
      card.appendChild(label);
    }
    choicesEl.appendChild(card);
  }

  // If shiny hunt and no shinies poured, show a helpful message
  if (isShinyHunt && node.lockedFestivalInstances.every(i => !i.isShiny)) {
    const msg = document.createElement('div');
    msg.style.cssText = 'text-align:center;color:var(--text-dim);font-size:10px;margin-top:8px;font-family:"Press Start 2P",monospace;line-height:1.8;';
    msg.textContent = '✨ No shinies on tap. Skip and try the next node.';
    choicesEl.appendChild(msg);
  }

  document.getElementById('btn-skip-catch').onclick = () => {
    advanceFromNode(state.map, node.id);
    saveRun();
    showMapScreen();
  };
}

async function doCollabBrewEvent(node) {
  const isShinyHunt = !!(state.modifiers && state.modifiers.has('shiny_hunt'));

  // Lock the collab pokemon on first visit
  if (!node.lockedCollabInstance) {
    // Pick a random species with BST >= 500, scaled to current map level
    const highBst = SPECIES_DATA.filter(s => (s.bst || 0) >= 500);
    const species = highBst[Math.floor(Math.random() * highBst.length)];
    const [minL, maxL] = MAP_LEVEL_RANGES[state.currentMap];
    const level = Math.round(minL + (maxL - minL) * (0.67 + Math.random() * 0.33));
    // Shiny Hunt: collab brew is always shiny — it wouldn't make sense to offer a non-shiny
    const forceShiny = isShinyHunt;
    node.lockedCollabInstance = createInstance(species, Math.min(level, maxL), forceShiny, getMoveTierForMap(state.currentMap));
    saveRun();
  }

  const pokemon = node.lockedCollabInstance;

  showScreen('event-screen');
  document.getElementById('event-icon').textContent = '🤝';
  document.getElementById('event-title').textContent = 'Collaboration Brew!';
  document.getElementById('event-flavor').textContent = isShinyHunt
    ? 'A respected local brewery wants to collaborate. They brought their rarest shiny brew — free of charge.'
    : 'A respected local brewery wants to collaborate. They bring one of their best — free of charge.';
  renderTeamBar(state.team, document.getElementById('event-team-bar'));

  const choicesEl = document.getElementById('event-choices');
  choicesEl.innerHTML = '';

  const dex = getPokedex();
  const caught = !!(dex[pokemon.speciesId]?.caught);
  const wrapper = document.createElement('div');
  wrapper.innerHTML = renderPokemonCard(pokemon, false, false, caught);
  choicesEl.appendChild(wrapper.querySelector('.poke-card'));

  const btnWrap = document.createElement('div');
  btnWrap.style.cssText = 'width:100%;text-align:center;margin-top:12px;display:flex;gap:10px;justify-content:center;';

  const acceptBtn = document.createElement('button');
  acceptBtn.className = 'btn-primary';
  acceptBtn.textContent = `Add ${pokemon.brewName || pokemon.name} to Team!`;
  acceptBtn.addEventListener('click', () => {
    const normalUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.speciesId}.png`;
    markPokedexCaught(pokemon.speciesId, pokemon.name, pokemon.types, normalUrl, pokemon.brewName);
    if (pokemon.isShiny) markShinyDexCaught(pokemon.speciesId, pokemon.name, pokemon.types, pokemon.spriteUrl, pokemon.brewName);
    checkDexAchievements();
    const teamCap = (state.modifiers && state.modifiers.has('small_tap_list')) ? 3 : 6;
    if (state.team.length < teamCap) {
      state.team.push(pokemon);
      if (state.team.length > state.maxTeamSize) state.maxTeamSize = state.team.length;
      // Deep Cellar: team grew so the per-pokemon item cap may have dropped.
      // Trim any overflow held items back to the bag.
      if (state.modifiers && state.modifiers.has('deep_cellar')) {
        const newCap = getMaxHeldItems();
        for (const p of state.team) {
          if ((p.heldItems || []).length > newCap) {
            const overflow = p.heldItems.splice(newCap);
            for (const it of overflow) state.items.push(it);
          }
        }
      }
      advanceFromNode(state.map, node.id);
      saveRun();
      showMapScreen();
      showMapNotification(`🤝 ${pokemon.name} joined the team!`);
    } else {
      showSwapScreen(pokemon, node);
    }
  });

  const declineBtn = document.createElement('button');
  declineBtn.className = 'btn-secondary';
  declineBtn.textContent = 'Decline';
  declineBtn.addEventListener('click', () => {
    advanceFromNode(state.map, node.id);
    saveRun();
    showMapScreen();
  });

  btnWrap.appendChild(acceptBtn);
  btnWrap.appendChild(declineBtn);
  choicesEl.appendChild(btnWrap);
}

function doIngredientWindfallEvent(node) {
  // Get all unique held items currently in the bag (non-usable only — usables can't be duped meaningfully)
  const bagHeld = state.items.filter(it => !it.usable);

  showScreen('event-screen');
  document.getElementById('event-icon').textContent = '🌿';
  document.getElementById('event-title').textContent = 'Ingredient Windfall!';
  renderTeamBar(state.team, document.getElementById('event-team-bar'));
  const choicesEl = document.getElementById('event-choices');
  choicesEl.innerHTML = '';

  if (bagHeld.length === 0) {
    // No held items in bag — convert to a small item node instead
    document.getElementById('event-flavor').textContent =
      'A hop supplier overshipped — but your bag is empty! They left a mystery crate instead.';
    showEventResult(node, {
      icon: '🌿',
      title: 'Nothing to Duplicate!',
      lines: ['Your bag has no held items to copy.', 'The supplier left a mystery crate — check the next item node.'],
      okLabel: 'Fair enough.',
    });
    return;
  }

  document.getElementById('event-flavor').textContent =
    'A hop supplier massively overshipped. Pick any held item from your bag — you just got a free duplicate.';

  for (const item of bagHeld) {
    const div = document.createElement('div');
    div.className = 'item-card';
    div.style.cursor = 'pointer';
    div.innerHTML = `
      <div class="item-icon">${itemIconHtml(item, 36)}</div>
      <div class="item-name">${item.name}</div>
      <div class="item-desc">${item.desc}</div>
      <div style="font-size:9px;color:#4fa;margin-top:4px;">Duplicate this item ✓</div>`;
    div.addEventListener('click', () => {
      state.items.push({ ...item });
      saveRun();
      showEventResult(node, {
        icon: '🌿',
        title: 'Windfall!',
        lines: [`You got a free duplicate of ${item.name}.`, 'The supplier apologised for the mix-up.'],
        okLabel: 'No complaints here.',
      });
    });
    choicesEl.appendChild(div);
  }
}

async function doGhostTapEvent(node) {
  const teamCap = (state.modifiers && state.modifiers.has('small_tap_list')) ? 3 : 6;
  const hasSlot = state.team.length < teamCap;

  showScreen('event-screen');
  document.getElementById('event-icon').textContent = '👻';
  document.getElementById('event-title').textContent = 'Ghost Tap!';
  document.getElementById('event-flavor').textContent =
    'A mysterious handle nobody can explain appeared on your bar overnight. Something poured itself.';
  renderTeamBar(state.team, document.getElementById('event-team-bar'));
  const choicesEl = document.getElementById('event-choices');
  choicesEl.innerHTML = '';

  if (!hasSlot) {
    showEventResult(node, {
      icon: '👻',
      title: 'No Room at the Bar!',
      lines: ['The ghost tried to join, but your tap list is full.', 'It vanished without a trace.'],
      okLabel: 'Spooky.',
    });
    return;
  }

  // Lock the ghost pokemon on first visit
  if (!node.lockedGhostInstance) {
    // Seltzer = Ghost type, Cascadian = Dark type in this game's type system
    const pool = SPECIES_DATA.filter(s =>
      s.types && s.types.some(t => t === 'Seltzer' || t === 'Cascadian')
    );
    const species = pool[Math.floor(Math.random() * pool.length)];
    const level = getLevelForNode(node);
    node.lockedGhostInstance = createInstance(species, level, Math.random() < 0.05);
    saveRun();
  }

  const ghost = node.lockedGhostInstance;
  const dex = getPokedex();
  const caught = !!(dex[ghost.speciesId]?.caught);
  const wrapper = document.createElement('div');
  wrapper.innerHTML = renderPokemonCard(ghost, false, false, caught);
  choicesEl.appendChild(wrapper.querySelector('.poke-card'));

  const btnWrap = document.createElement('div');
  btnWrap.style.cssText = 'width:100%;text-align:center;margin-top:12px;display:flex;gap:10px;justify-content:center;';

  const takeBtn = document.createElement('button');
  takeBtn.className = 'btn-primary';
  takeBtn.textContent = `Let it pour.`;
  takeBtn.addEventListener('click', () => {
    const normalUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${ghost.speciesId}.png`;
    markPokedexCaught(ghost.speciesId, ghost.name, ghost.types, normalUrl, ghost.brewName);
    if (ghost.isShiny) markShinyDexCaught(ghost.speciesId, ghost.name, ghost.types, ghost.spriteUrl, ghost.brewName);
    checkDexAchievements();
    state.team.push(ghost);
    if (state.team.length > state.maxTeamSize) state.maxTeamSize = state.team.length;
    // Deep Cellar: team grew so the per-pokemon item cap may have dropped.
    if (state.modifiers && state.modifiers.has('deep_cellar')) {
      const newCap = getMaxHeldItems();
      for (const p of state.team) {
        if ((p.heldItems || []).length > newCap) {
          const overflow = p.heldItems.splice(newCap);
          for (const it of overflow) state.items.push(it);
        }
      }
    }
    advanceFromNode(state.map, node.id);
    saveRun();
    showMapScreen();
    showMapNotification(`👻 ${ghost.name} joined from the ghost tap!`);
  });

  const passBtn = document.createElement('button');
  passBtn.className = 'btn-secondary';
  passBtn.textContent = 'Unplug the tap';
  passBtn.addEventListener('click', () => {
    advanceFromNode(state.map, node.id);
    saveRun();
    showMapScreen();
  });

  btnWrap.appendChild(takeBtn);
  btnWrap.appendChild(passBtn);
  choicesEl.appendChild(btnWrap);
}

// ---- Node Handlers ----

// Returns a level scaled to the node's layer (layer 1 = map min, layer 6 = map max).
function getLevelForNode(node) {
  const [minL, maxL] = MAP_LEVEL_RANGES[state.currentMap];
  const t = Math.min(1, Math.max(0, (node.layer - 1) / 5)); // 0.0 at layer 1, 1.0 at layer 6
  const base = Math.round(minL + t * (maxL - minL));
  const spread = Math.max(1, Math.round((maxL - minL) / 8));
  return Math.min(maxL, Math.max(minL, base + Math.floor(Math.random() * spread)));
}

async function doBattleNode(node) {
  // ── Lock enemy on first load — prevents refreshing to reroll for an easier fight ──
  if (!node.lockedEnemy) {
    const level = getLevelForNode(node);
    let choices = await getCatchChoices(state.currentMap);

    // On the first layer of the first map, exclude enemies super effective against the starter
    if (state.currentMap === 0 && node.layer === 1 && state.team.length > 0) {
      const starterTypes = state.team[0].types || [];
      const isSafe = sp => !(sp.types || []).some(et =>
        starterTypes.some(st => (TYPE_CHART[et]?.[st] || 1) >= 2)
      );
      const safe = choices.filter(isSafe);
      if (safe.length > 0) {
        choices = safe;
      } else {
        const eevee = getSpeciesById(133);
        if (eevee) choices = [eevee];
      }
    }

    const enemySpecies = choices[Math.floor(Math.random() * choices.length)];
    if (!enemySpecies) {
      advanceFromNode(state.map, node.id);
      saveRun();
      showMapScreen();
      return;
    }
    node.lockedEnemy = createInstance(enemySpecies, level);
    saveRun(); // 🔒 enemy is now frozen — refreshing loads the same opponent
  }

  const enemy = node.lockedEnemy;
  const titleEl = document.getElementById('battle-title');
  const subEl = document.getElementById('battle-subtitle');
  if (titleEl) titleEl.textContent = `Wild ${enemy.name} appeared!`;
  if (subEl) subEl.textContent = `Level ${enemy.level}`;
  await runBattleScreen([enemy], false, () => {
    advanceFromNode(state.map, node.id);
    saveRun();
    showMapScreen();
  }, () => {
    showGameOver();
  });
}

async function doBossNode(node) {
  if (state.currentMap === 8) {
    await doElite4();
    return;
  }
  const leader = GYM_LEADERS[state.currentMap];
  const enemyTeam = leader.team.map(p => createInstance(p, p.level));

  showScreen('battle-screen');
  document.getElementById('battle-title').textContent = `Gym Battle vs ${leader.name}!`;
  document.getElementById('battle-subtitle').textContent = `${leader.badge} is on the line!`;
  await runBattleScreen(enemyTeam, true, () => {
    state.badges++;
    advanceFromNode(state.map, node.id);
    saveRun();
    showBadgeScreen(leader);
    const ach = unlockAchievement(`gym_${state.currentMap}`);
    if (ach) showAchievementToast(ach);
  }, () => {
    showGameOver();
  }, leader.name);
}

async function doElite4() {
  const bosses = ELITE_4;
  for (let i = state.eliteIndex; i < bosses.length; i++) {
    state.eliteIndex = i;
    const boss = bosses[i];
    const enemyTeam = boss.team.map(p => createInstance(p, p.level));

    showScreen('battle-screen');
    document.getElementById('battle-title').textContent = `${boss.title}: ${boss.name}!`;
    document.getElementById('battle-subtitle').textContent = i === 4 ? 'Final Battle!' : `Elite Four - Battle ${i+1}/4`;
    const won = await new Promise(resolve => {
      runBattleScreen(enemyTeam, true, () => resolve(true), () => resolve(false), boss.name);
    });

    if (!won) { showGameOver(); return; }
    if (i < bosses.length - 1) {
      await showEliteTransition(boss.name, i + 1);
    }
  }
  const eliteAch = unlockAchievement('elite_four');
  if (eliteAch) showAchievementToast(eliteAch);
  showWinScreen();
}

function showEliteTransition(defeatedName, nextIndex) {
  return new Promise(resolve => {
    const el = document.getElementById('transition-screen');
    if (!el) { resolve(); return; }
    document.getElementById('transition-msg').textContent = `${defeatedName} defeated!`;
    document.getElementById('transition-sub').textContent =
      nextIndex < 4 ? `Next: ${ELITE_4[nextIndex].name}...` : `The Champion awaits!`;
    showScreen('transition-screen');
    setTimeout(() => resolve(), 2000);
  });
}

async function doCatchNode(node) {
  const isShinyHunt = !!(state.modifiers && state.modifiers.has('shiny_hunt'));

  showScreen('catch-screen');
  document.querySelector('#catch-screen h2').textContent = isShinyHunt ? '✨ Shiny Hunt — Brew New Batch!' : '⬟ Brew New Batch!';
  document.querySelector('#catch-screen p').textContent = isShinyHunt
    ? 'Only shiny pokemon can be caught this run!'
    : 'Choose one Pokemon to add to your team';
  document.getElementById('btn-skip-catch').style.display = '';
  renderTeamBar(state.team, document.getElementById('catch-team-bar'));
  const choicesEl = document.getElementById('catch-choices');
  choicesEl.innerHTML = '<div class="loading">Finding Pokemon...</div>';

  // ── Locked choices: generate once, store on node, reuse on refresh ──
  if (!node.lockedCatchInstances && !node.lockedShiny) {
    // Shiny Hunt: 10% redirect to dedicated shiny node; normal: 1%
    // Edible Glitter: each holder adds +5% to the redirect chance (stackable)
    const glitterCount = state.team.filter(p => (p.heldItems||[]).some(it => it.id === 'edible_glitter')).length;
    const shinyRedirectChance = (isShinyHunt ? 0.10 : 0.01) + (glitterCount * 0.05);
    if (Math.random() < shinyRedirectChance) {
      node.lockedShiny = true;
      saveRun();
      await doShinyNode(node);
      return;
    }

    const level = getLevelForNode(node);
    let choices = await getCatchChoices(state.currentMap);

    // Limited Release: only show 1 catch option instead of 3
    if (state.modifiers && state.modifiers.has('limited_release')) {
      choices = [choices[0]].filter(Boolean);
    }

    // Map 1, layer 1: guarantee at least one IPA or Lager Pokemon
    if (state.currentMap === 0 && node.layer === 1) {
      const hasIPAOrLager = choices.some(p => p.types?.some(t => t === 'IPA' || t === 'Lager'));
      if (!hasIPAOrLager) {
        const ipaLagerIds = [54, 60, 69, 72, 79, 86, 98, 116, 118, 120, 129];
        const id = ipaLagerIds[Math.floor(Math.random() * ipaLagerIds.length)];
        const replacement = getSpeciesById(id);
        if (replacement) choices = [replacement, ...choices.slice(1)];
      }
    }

    // In shiny_hunt mode each card gets its own 10% shiny roll, locked now.
    // In normal mode each card gets the standard 1% shiny chance.
    // Edible Glitter adds +5% per holder.
    const cardShinyChance = (isShinyHunt ? 0.10 : 0.01) + (glitterCount * 0.05);
    node.lockedCatchInstances = choices.map(sp =>
      createInstance(sp, level, Math.random() < cardShinyChance)
    );
    saveRun(); // 🔒 freeze choices — refreshing reloads the same cards
  } else if (node.lockedShiny) {
    // Was a shiny redirect — honour it on restore
    await doShinyNode(node);
    return;
  }

  const instances = node.lockedCatchInstances;
  choicesEl.innerHTML = '';
  const dex = getPokedex();
  for (const inst of instances) {
    const caught = !!(dex[inst.speciesId]?.caught);
    const canCatch = !isShinyHunt || inst.isShiny;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = renderPokemonCard(inst, true, false, caught);
    const card = wrapper.querySelector('.poke-card');

    if (canCatch) {
      card.style.cursor = 'pointer';
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.addEventListener('click', () => catchPokemon(inst, node));
      card.addEventListener('keydown', e => { if(e.key==='Enter'||e.key===' ') catchPokemon(inst, node); });
    } else {
      card.style.opacity = '0.4';
      card.style.cursor = 'not-allowed';
      const label = document.createElement('div');
      label.style.cssText = 'text-align:center;font-size:9px;color:#f88;margin-top:4px;font-family:"Press Start 2P",monospace;';
      label.textContent = 'Not shiny — cannot catch';
      card.appendChild(label);
    }
    choicesEl.appendChild(card);
  }

  // If shiny hunt and ALL cards are non-shiny, show a helpful message
  if (isShinyHunt && instances.every(i => !i.isShiny)) {
    const msg = document.createElement('div');
    msg.style.cssText = 'text-align:center;color:var(--text-dim);font-size:10px;margin-top:8px;font-family:"Press Start 2P",monospace;line-height:1.8;';
    msg.textContent = '✨ No shinies this batch. Skip and try the next node.';
    choicesEl.appendChild(msg);
  }

  document.getElementById('btn-skip-catch').onclick = () => {
    advanceFromNode(state.map, node.id);
    saveRun();
    showMapScreen();
  };
}

function checkDexAchievements() {
  if (isBrewlogAt150()) {
    const ach = unlockAchievement('the_brewlog');
    if (ach) showAchievementToast(ach);
  }
  if (isShinyDexComplete()) {
    const ach = unlockAchievement('shinydex_complete');
    if (ach) showAchievementToast(ach);
  }
}

function catchPokemon(pokemon, node) {
  markPokedexCaught(pokemon.speciesId, pokemon.name, pokemon.types, pokemon.spriteUrl, pokemon.brewName);
  checkDexAchievements();
  const cards = document.querySelectorAll('#catch-choices .poke-card');
  cards.forEach(card => { card.style.opacity = '0.3'; card.style.pointerEvents = 'none'; });
  const chosenCard = [...cards].find(card => card.querySelector('img')?.src?.includes(`/${pokemon.speciesId}.png`)) || cards[0];
  if (chosenCard) chosenCard.style.opacity = '1';
  document.getElementById('btn-skip-catch').style.display = 'none';
  const defaultName = pokemon.brewName || pokemon.name;
  showNicknamePrompt(chosenCard, defaultName, (nick) => {
    pokemon.nickname = nick;
    pokemon.caughtOnMap = state.currentMap; // for Anniversary Batch tracking
    const teamCap = (state.modifiers && state.modifiers.has('small_tap_list')) ? 3 : 6;
    if (state.team.length < teamCap) {
      state.team.push(pokemon);
      if (state.team.length > state.maxTeamSize) state.maxTeamSize = state.team.length;
      // Deep Cellar: team grew so the per-pokemon item cap may have dropped.
      // Trim any overflow items back to the bag so the modal never sees a negative slot count.
      if (state.modifiers && state.modifiers.has('deep_cellar')) {
        const newCap = getMaxHeldItems();
        for (const p of state.team) {
          if ((p.heldItems || []).length > newCap) {
            const overflow = p.heldItems.splice(newCap);
            for (const it of overflow) state.items.push(it);
          }
        }
      }
      advanceFromNode(state.map, node.id);
      saveRun();
      showMapScreen();
    } else {
      showSwapScreen(pokemon, node);
    }
  });
}

function showSwapScreen(newPoke, node) {
  showScreen('swap-screen');
  const el = document.getElementById('swap-choices');
  el.innerHTML = `<p class="swap-prompt">Your team is full! Choose a Pokemon to release:</p>`;
  for (let i = 0; i < state.team.length; i++) {
    const p = state.team[i];
    const wrapper = document.createElement('div');
    wrapper.innerHTML = renderPokemonCard(p, true, false);
    const card = wrapper.querySelector('.poke-card');
    card.style.cursor = 'pointer';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    const idx = i;
    card.addEventListener('click', () => {
      if (newPoke.isShiny) markShinyDexCaught(newPoke.speciesId, newPoke.name, newPoke.types, newPoke.spriteUrl);
      const released = state.team[idx];
      for (const it of (released.heldItems || [])) state.items.push(it);
      state.team.splice(idx, 1, newPoke);
      advanceFromNode(state.map, node.id);
      saveRun();
      showMapScreen();
    });
    el.appendChild(card);
  }
  document.getElementById('btn-cancel-swap').onclick = () => {
    advanceFromNode(state.map, node.id);
    saveRun();
    showMapScreen();
  };
}

function doItemNode(node) {
  // No Adjuncts: skip item nodes entirely
  if (state.modifiers && state.modifiers.has('no_adjuncts')) {
    showMapNotification('🚫 No Adjuncts — item skipped.');
    advanceFromNode(state.map, node.id);
    saveRun();
    showMapScreen();
    return;
  }

  showScreen('item-screen');
  renderTeamBar(state.team, document.getElementById('item-team-bar'));

  // ── Locked choices: generate once, store on node, reuse on refresh ──
  if (!node.lockedItemPicks) {
    // Exclude held-type items already in bag or on a Pokemon (usable and stackable items can appear multiple times)
    const usedIds = new Set([
      ...state.items.filter(it => !it.usable).map(it => it.id),
      ...state.team.flatMap(p => (p.heldItems || []).map(it => it.id)),
    ]);
    const heldAvailable = ITEM_POOL.filter(it =>
      (it.stackable || !usedIds.has(it.id)) && (it.minMap === undefined || state.currentMap >= it.minMap)
    );

    // Usable items: filter out ones that can't be applied to current team
    const canUseMaxRevive = state.team.some(p => p.currentHp <= 0);
    const canUseEvoStone  = state.team.some(p => {
      if (p.speciesId === 133) return true;
      const evo = EVOLUTIONS[p.speciesId];
      return evo && evo.into !== p.speciesId;
    });
    const usableAvailable = USABLE_ITEM_POOL.filter(it => {
      if (it.id === 'max_revive') return canUseMaxRevive;
      if (it.id === 'evo_stone')  return canUseEvoStone;
      return true;
    });

    const available = [...heldAvailable, ...usableAvailable];
    const shuffled = [...available].sort(() => Math.random() - 0.5);
    node.lockedItemPicks = shuffled.slice(0, 2);
    saveRun(); // 🔒 items are now frozen — refreshing reloads the same two
  }

  const picks = node.lockedItemPicks;
  const el = document.getElementById('item-choices');
  el.innerHTML = '';
  for (const item of picks) {
    const div = document.createElement('div');
    div.className = 'item-card';
    div.innerHTML = `<div class="item-icon">${itemIconHtml(item, 36)}</div>
      <div class="item-name">${item.name}</div>
      <div class="item-desc">${item.desc}</div>
      ${item.usable ? '<div style="font-size:9px;color:#4af;margin-top:4px;">USABLE ITEM</div>' : ''}`;
    div.style.cursor = 'pointer';
    div.addEventListener('click', () => {
      if (item.usable) {
        state.items.push({ ...item });
        advanceFromNode(state.map, node.id);
        saveRun();
        showMapScreen();
      } else {
        openItemEquipModal(item, {
          onComplete: () => { advanceFromNode(state.map, node.id); saveRun(); showMapScreen(); },
        });
      }
    });
    el.appendChild(div);
  }

  document.getElementById('btn-skip-item').onclick = () => {
    advanceFromNode(state.map, node.id);
    saveRun();
    showMapScreen();
  };
}

// Returns the max items a single brew can hold.
// With the Deep Cellar modifier this scales inversely with team size.
function getMaxHeldItems() {
  if (state.modifiers && state.modifiers.has('deep_cellar')) {
    const size = state.team.length || 1;
    if (size >= 6) return 2;
    if (size === 5) return 3;
    if (size === 4) return 4;
    if (size === 3) return 5;
    if (size === 2) return 7;
    return 8; // 1 brew
  }
  return 3;
}

function openItemEquipModal(item, { fromBagIdx = -1, fromPokemonIdx = -1, fromPokemonItemIdx = -1, onComplete = null } = {}) {
  // No Adjuncts: silently block all item equipping
  if (state.modifiers && state.modifiers.has('no_adjuncts')) {
    if (onComplete) onComplete();
    return;
  }
  document.getElementById('item-equip-modal')?.remove();

  const done = onComplete || (() => {
    renderItemBadges(state.items);
    renderTeamBar(state.team);
  });

  const modal = document.createElement('div');
  modal.id = 'item-equip-modal';
  modal.className = 'item-equip-overlay';

  const rows = state.team.map((p, i) => {
    p.heldItems = p.heldItems || [];
    const isSelf = fromPokemonIdx === i;
    const maxHeld = getMaxHeldItems();
    const full = p.heldItems.length >= maxHeld;
    const alreadyHolding = isSelf && fromPokemonItemIdx >= 0;

    // Render the item slots for this pokemon
    const slotsHtml = p.heldItems.map((it, slotIdx) => {
      const isThisItem = isSelf && fromPokemonItemIdx === slotIdx;
      return `<span class="equip-held-item${isThisItem ? ' equip-held-self' : ''}" title="${it.desc}">
        ${itemIconHtml(it, 16)} ${it.name}
        <button class="equip-btn equip-btn-unequip equip-btn-xs" data-unequip-poke="${i}" data-unequip-slot="${slotIdx}" title="Unequip ${it.name}">×</button>
      </span>`;
    }).join('');

    const emptySlots = maxHeld - p.heldItems.length;
    const emptyHtml = Array(emptySlots).fill('<span class="equip-empty-slot">— empty —</span>').join('');

    const canEquip = !alreadyHolding && !full;
    const equipBtn = canEquip
      ? `<button class="equip-btn" data-equip="${i}">Equip</button>`
      : (!alreadyHolding && full ? `<button class="equip-btn" disabled title="Already holding ${maxHeld} items">Full</button>` : '');

    return `<div class="equip-pokemon-row">
      <img src="${p.spriteUrl}" class="equip-poke-sprite" onerror="this.style.display='none'">
      <div class="equip-poke-info">
        <div class="equip-poke-name">${p.nickname || p.name}</div>
        <div class="equip-poke-lv">Lv${p.level}</div>
      </div>
      <div class="equip-held-slot">${slotsHtml}${emptyHtml}</div>
      <div class="equip-btn-group">${equipBtn}</div>
    </div>`;
  }).join('');

  modal.innerHTML = `
    <div class="item-equip-box">
      <div class="equip-item-header">
        <span class="equip-item-icon">${itemIconHtml(item, 32)}</span>
        <div>
          <div class="equip-item-name">${item.name}</div>
          <div class="equip-item-desc">${item.desc}</div>
        </div>
      </div>
      <div class="equip-pokemon-list">${rows}</div>
      <button id="btn-equip-to-bag" class="btn-secondary" style="width:100%;margin-top:8px;">
        ${fromPokemonIdx >= 0 ? '⬇ Unequip (return to bag)' : 'Keep in Bag'}
      </button>
    </div>`;

  document.body.appendChild(modal);

  // Unequip a specific item slot from a pokemon — send it to bag, don't equip current item
  modal.querySelectorAll('[data-unequip-poke]').forEach(btn => {
    btn.addEventListener('click', () => {
      const pokeIdx = parseInt(btn.dataset.unequipPoke);
      const slotIdx = parseInt(btn.dataset.unequipSlot);
      const pokemon = state.team[pokeIdx];
      const removed = pokemon.heldItems.splice(slotIdx, 1)[0];
      if (removed) state.items.push(removed);
      // If the incoming item wasn't from the bag or another pokemon, it's a brand-new
      // item that only existed in the modal — save it to the bag so it isn't lost.
      if (fromBagIdx < 0 && fromPokemonIdx < 0) state.items.push(item);
      modal.remove();
      saveRun();
      done();
    });
  });

  // Equip item to a pokemon
  modal.querySelectorAll('button[data-equip]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.equip);
      const pokemon = state.team[idx];

      // Remove item from its source
      if (fromBagIdx >= 0) {
        state.items.splice(fromBagIdx, 1);
      } else if (fromPokemonIdx >= 0 && fromPokemonItemIdx >= 0) {
        state.team[fromPokemonIdx].heldItems.splice(fromPokemonItemIdx, 1);
      }

      pokemon.heldItems = pokemon.heldItems || [];
      pokemon.heldItems.push(item);
      if (pokemon.heldItems.length >= getMaxHeldItems()) { const a = unlockAchievement('the_cellar'); if (a) showAchievementToast(a); }
      modal.remove();
      saveRun();
      done();
    });
  });

  modal.querySelector('#btn-equip-to-bag').addEventListener('click', () => {
    if (fromPokemonIdx >= 0 && fromPokemonItemIdx >= 0) {
      state.team[fromPokemonIdx].heldItems.splice(fromPokemonItemIdx, 1);
      state.items.push(item);
    } else if (fromBagIdx < 0) {
      // Brand new item — put in bag
      state.items.push(item);
    }
    // fromBagIdx >= 0 means it's already in bag — do nothing
    modal.remove();
    saveRun();
    done();
  });

  modal.addEventListener('click', e => { if (e.target === modal) { modal.remove(); done(); } });
}

function openUsableItemModal(item, bagIdx) {
  document.getElementById('usable-item-modal')?.remove();

  const canTarget = p => {
    if (item.id === 'max_revive') return p.currentHp <= 0;
    if (item.id === 'evo_stone') {
      if (p.speciesId === 133) return true;
      const evo = EVOLUTIONS[p.speciesId];
      return !!(evo && evo.into !== p.speciesId);
    }
    return true; // rare_candy works on everyone
  };

  const rows = state.team.map((p, i) => {
    const enabled = canTarget(p);
    const statusText = p.currentHp <= 0 ? 'Fainted' : `${p.currentHp}/${p.maxHp} HP`;
    return `<div class="equip-pokemon-row" data-idx="${i}"
        style="${enabled ? 'cursor:pointer;' : 'opacity:0.4;cursor:default;pointer-events:none;'}">
      <img src="${p.spriteUrl}" class="equip-poke-sprite" onerror="this.style.display='none'">
      <div class="equip-poke-info">
        <div class="equip-poke-name">${p.nickname || p.name}</div>
        <div class="equip-poke-lv">Lv${p.level} — ${statusText}</div>
      </div>
    </div>`;
  }).join('');

  const modal = document.createElement('div');
  modal.id = 'usable-item-modal';
  modal.className = 'item-equip-overlay';
  modal.innerHTML = `
    <div class="item-equip-box">
      <div class="equip-item-header">
        <span class="equip-item-icon">${itemIconHtml(item, 32)}</span>
        <div>
          <div class="equip-item-name">${item.name}</div>
          <div class="equip-item-desc">${item.desc}</div>
        </div>
      </div>
      <div class="equip-pokemon-list">${rows}</div>
      <button id="btn-cancel-use" class="btn-secondary" style="width:100%;margin-top:8px;">Cancel</button>
    </div>`;
  document.body.appendChild(modal);

  modal.querySelector('#btn-cancel-use').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

  modal.querySelectorAll('[data-idx]').forEach(row => {
    if (row.style.pointerEvents === 'none') return;
    row.addEventListener('click', async () => {
      const idx = parseInt(row.dataset.idx);
      const pokemon = state.team[idx];
      modal.remove();
      state.items.splice(bagIdx, 1);

      if (item.id === 'max_revive') {
        pokemon.currentHp = pokemon.maxHp;
        showMapNotification(`${pokemon.nickname || pokemon.name} was revived!`);
        renderItemBadges(state.items);
        renderTeamBar(state.team);
        saveRun();

      } else if (item.id === 'rare_candy') {
        pokemon.level = Math.min(100, pokemon.level + 3);
        const newMax = calcHp(pokemon.baseStats.hp, pokemon.level);
        pokemon.currentHp = Math.min(newMax, pokemon.currentHp + (newMax - pokemon.maxHp));
        pokemon.maxHp = newMax;
        showMapNotification(`${pokemon.nickname || pokemon.name} grew to Lv. ${pokemon.level}!`);
        renderItemBadges(state.items);
        renderTeamBar(state.team);
        // Check if now eligible to evolve
        const canEvo = pokemon.speciesId === 133
          ? pokemon.level >= 36
          : (EVOLUTIONS[pokemon.speciesId]?.level <= pokemon.level);
        if (canEvo) await applyEvolution(pokemon);
        saveRun();

      } else if (item.id === 'evo_stone') {
        await applyEvolution(pokemon);
        saveRun();
      }
    });
  });
}

async function applyEvolution(pokemon) {
  let evo;
  if (pokemon.speciesId === 133) {
    evo = await showEeveeChoice(pokemon);
  } else if (pokemon.speciesId === 44) {
    evo = await showGloomChoice(pokemon);
  } else if (pokemon.speciesId === 61) {
    evo = await showPoliwhirlChoice(pokemon);
  } else if (pokemon.speciesId === 79) {
    evo = await showSlowpokeChoice(pokemon);
  } else {
    evo = EVOLUTIONS[pokemon.speciesId];
    if (!evo) return;
  }

  await playEvoAnimation(pokemon, evo);

  const oldHpRatio = pokemon.currentHp / pokemon.maxHp;
  const newSpecies = getSpeciesById(evo.into);

  pokemon.speciesId = evo.into;
  pokemon.name      = evo.name;
  pokemon.spriteUrl = pokemon.isShiny
    ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${evo.into}.png`
    : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${evo.into}.png`;

  if (newSpecies) {
    pokemon.types     = newSpecies.types;
    pokemon.baseStats = newSpecies.baseStats;
    const newMax      = calcHp(newSpecies.baseStats.hp, pokemon.level);
    pokemon.maxHp     = newMax;
    pokemon.currentHp = Math.max(1, Math.floor(oldHpRatio * newMax));
  }

  const normalUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.speciesId}.png`;
  markPokedexCaught(pokemon.speciesId, pokemon.name, pokemon.types, normalUrl);
  if (pokemon.isShiny) markShinyDexCaught(pokemon.speciesId, pokemon.name, pokemon.types, pokemon.spriteUrl);
  checkDexAchievements();
  renderItemBadges(state.items);
  renderTeamBar(state.team);
  saveRun();
}

// ---- Beer Trade Node ----

async function doTradeNode(node) {
  showScreen('trade-screen');
  renderTeamBar(state.team, document.getElementById('trade-team-bar'));

  const listEl = document.getElementById('trade-list');
  listEl.innerHTML = '';

  for (let i = 0; i < state.team.length; i++) {
    const mine = state.team[i];
    // Only allow trading living pokemon
    if (mine.currentHp <= 0) continue;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = renderPokemonCard(mine, true, false);
    const card = wrapper.querySelector('.poke-card');
    if (!card) continue; // safety guard

    card.style.cursor = 'pointer';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');

    const idx = i;
    const doTrade = async () => {
      // Lock the trade offer on first click so refresh can't reroll it
      if (!node.lockedTrades) node.lockedTrades = {};
      if (!node.lockedTrades[idx]) {
        const pool = await getCatchChoices(state.currentMap);
        const myBst = mine.baseStats
          ? Object.values(mine.baseStats).reduce((a, b) => a + b, 0)
          : 400;
        // Filter to species within ±50 BST — use sp.bst if available, fall back to baseStats sum
        const matched = pool.filter(sp => {
          const bst = sp.bst || Object.values(sp.baseStats || {}).reduce((a, b) => a + b, 0);
          return Math.abs(bst - myBst) <= 50;
        });
        // Fall back to full pool if nothing matches
        const finalPool = matched.length > 0 ? matched : pool;
        const species = finalPool[Math.floor(Math.random() * finalPool.length)];
        if (!species) { advanceFromNode(state.map, node.id); saveRun(); showMapScreen(); return; }
        const offerLevel = Math.min(100, mine.level + 3);
        node.lockedTrades[idx] = createInstance(species, offerLevel, Math.random() < 0.01);
        saveRun(); // 🔒 lock the offer so refresh doesn't reroll
      }

      const offer = node.lockedTrades[idx];
      const released = state.team[idx];

      // Return held items to bag
      for (const it of (released.heldItems || [])) state.items.push(it);
      state.team.splice(idx, 1, offer);

      // Mark in dex
      const normalUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${offer.speciesId}.png`;
      markPokedexCaught(offer.speciesId, offer.name, offer.types, normalUrl);
      if (offer.isShiny) markShinyDexCaught(offer.speciesId, offer.name, offer.types, offer.spriteUrl);
      checkDexAchievements();

      advanceFromNode(state.map, node.id);
      saveRun();

      // Show result — reuse shiny screen for the reveal
      showScreen('shiny-screen');
      const defaultName = offer.brewName || offer.name;
      document.getElementById('shiny-content').innerHTML = `
        <div class="shiny-title">⇄ Beer Trade!</div>
        <p style="color:var(--text-dim);font-size:10px;margin-bottom:8px;">
          ${released.nickname || released.brewName || released.name} was traded away.</p>
        ${renderPokemonCard(offer, false, false)}
        <div style="display:flex;flex-direction:column;align-items:center;gap:10px;margin-top:12px;width:100%;max-width:300px;margin-left:auto;margin-right:auto;">
          <input id="trade-nickname-input" type="text" maxlength="28"
            style="width:100%;background:var(--bg3);border:2px solid var(--border);border-radius:6px;
                   color:var(--text);font-family:'Press Start 2P',monospace;font-size:10px;
                   padding:10px 12px;box-sizing:border-box;outline:none;text-align:center;"
            placeholder="${defaultName}" autocomplete="off" value="${defaultName}">
          <button id="btn-trade-confirm" class="btn-primary" style="width:100%;">Welcome to the team!</button>
        </div>`;

      const input = document.getElementById('trade-nickname-input');
      const confirmBtn = document.getElementById('btn-trade-confirm');
      const finish = () => {
        const val = input.value.trim();
        offer.nickname = val || null;
        if (val) { const a = unlockAchievement('house_special'); if (a) showAchievementToast(a); }
        saveRun();
        showMapScreen();
      };
      confirmBtn.addEventListener('click', finish);
      input.addEventListener('keydown', e => { if (e.key === 'Enter') finish(); });
      input.focus();
      input.select();
    };

    card.addEventListener('click', doTrade);
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') doTrade(); });
    listEl.appendChild(card);
  }

  // If somehow no cards were added (all fainted), show a message
  if (listEl.children.length === 0) {
    listEl.innerHTML = '<p style="text-align:center;color:var(--text-dim);font-size:11px;">No brews available to trade.</p>';
  }

  document.getElementById('btn-skip-trade').onclick = () => {
    advanceFromNode(state.map, node.id);
    saveRun();
    showMapScreen();
  };
}

function doQCLabNode(node) {
  for (const p of state.team) p.currentHp = p.maxHp;

  showScreen('event-screen');
  document.getElementById('event-icon').textContent = '🧪';
  document.getElementById('event-title').textContent = 'QC Lab';
  document.getElementById('event-flavor').textContent = 'Your team has been fully restored. Rename any brew while you\'re here.';
  renderTeamBar(state.team, document.getElementById('event-team-bar'));

  const choicesEl = document.getElementById('event-choices');
  choicesEl.innerHTML = '';

  for (const p of state.team) {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = renderPokemonCard(p, false, false);
    const card = wrapper.querySelector('.poke-card');
    card.style.cursor = 'pointer';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.addEventListener('click', () => {
      choicesEl.querySelectorAll('.poke-card').forEach(c => {
        c.style.opacity = '0.3'; c.style.pointerEvents = 'none';
      });
      card.style.opacity = '1';
      const defaultName = p.nickname || p.brewName || p.name;
      showNicknamePrompt(card, defaultName, (nick) => {
        p.nickname = nick || null;
        advanceFromNode(state.map, node.id);
        saveRun();
        showMapScreen();
        showMapNotification('🧪 Team restored. Brew names updated!');
      });
    });
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') card.click(); });
    choicesEl.appendChild(card);
  }

  const skipWrap = document.createElement('div');
  skipWrap.style.cssText = 'width:100%;text-align:center;margin-top:10px;';
  const skipBtn = document.createElement('button');
  skipBtn.className = 'btn-secondary';
  skipBtn.textContent = 'Skip renaming';
  skipBtn.addEventListener('click', () => {
    advanceFromNode(state.map, node.id);
    saveRun();
    showMapScreen();
    showMapNotification('🧪 Your team was fully restored at the QC Lab!');
  });
  skipWrap.appendChild(skipBtn);
  choicesEl.appendChild(skipWrap);
}

async function doShinyNode(node) {
  // ── Lock the shiny instance on first generation — prevents rerolling species on refresh ──
  if (!node.lockedShinyInstance) {
    const choices = await getCatchChoices(state.currentMap);
    const level = getLevelForNode(node);
    const species = choices[0];
    if (!species) { advanceFromNode(state.map, node.id); saveRun(); showMapScreen(); return; }
    node.lockedShinyInstance = createInstance(species, level, true);
    saveRun(); // 🔒 freeze the shiny species and level
  }

  const shiny = node.lockedShinyInstance;
  const shinyCaught = !!(getShinyDex()[shiny.speciesId]);
  showScreen('shiny-screen');
  document.getElementById('shiny-content').innerHTML = `
    <div class="shiny-title">✨ A Shiny Pokemon appeared!</div>
    ${renderPokemonCard(shiny, false, false, shinyCaught)}
    <button id="btn-take-shiny" class="btn-primary">Take ${shiny.name}!</button>
  `;
  document.getElementById('btn-take-shiny').onclick = () => {
    const teamCap = (state.modifiers && state.modifiers.has('small_tap_list')) ? 3 : 6;
    if (state.team.length < teamCap) {
      const normalUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${shiny.speciesId}.png`;
      markPokedexCaught(shiny.speciesId, shiny.name, shiny.types, normalUrl);
      markShinyDexCaught(shiny.speciesId, shiny.name, shiny.types, shiny.spriteUrl);
      checkDexAchievements();
      state.team.push(shiny);
      if (state.team.length > state.maxTeamSize) state.maxTeamSize = state.team.length;
      advanceFromNode(state.map, node.id);
      saveRun();
      showMapScreen();
    } else {
      showSwapScreen(shiny, node);
    }
  };
}

function doMegaNode(node) {
  doItemNode(node);
}

// ---- Battle Screen ----

function runBattleScreen(enemyTeam, isBoss, onWin, onLose, enemyName = null, enemyItems = []) {
  return new Promise(async resolve => {
    showScreen('battle-screen');
    renderTrainerIcons(state.trainer, isBoss ? enemyName : null);

    const pTeamCopy = state.team.map(p => ({ ...p }));
    // enemyTeam HP init (runBattle will deep-copy, but we need initial state for animation)
    const eTeamInit = enemyTeam.map(p => ({
      ...p,
      currentHp: p.currentHp !== undefined ? p.currentHp : calcHp(p.baseStats.hp, p.level),
      maxHp: p.maxHp !== undefined ? p.maxHp : calcHp(p.baseStats.hp, p.level),
    }));

    renderBattleField(pTeamCopy, eTeamInit);

    // Pre-compute the full battle result
    const { playerWon, detailedLog, pTeam: resultP, eTeam: resultE, playerParticipants } = runBattle(
      pTeamCopy, enemyTeam, state.items, enemyItems, null
    );

    // Set up Skip button
    const skipBtn = document.getElementById('btn-auto-battle');
    skipBtn.disabled = false;
    skipBtn.textContent = 'Skip';
    skipBtn.onclick = () => { skipBattleAnimation = true; };

    document.getElementById('btn-continue-battle').style.display = 'none';
    document.getElementById('btn-continue-battle').textContent = 'Continue';

    // Speed Run: immediately skip all animation
    skipBattleAnimation = !!(state.modifiers && state.modifiers.has('speed_run'));
    await animateBattleVisually(detailedLog, pTeamCopy, eTeamInit);

    // Show final HP state after animation
    renderBattleField(resultP, resultE);

    // perfectQC — clear if any player brew fainted this battle
    if (detailedLog.some(e => e.type === 'faint' && e.side === 'player')) {
      state.perfectQC = false;
    }

    if (playerWon) {
    // Bottom of the Brite — whole team below 20% HP
    const allLow = state.team.filter(p => p.currentHp > 0).every(p => p.currentHp / p.maxHp < 0.2);
    if (allLow) { const a = unlockAchievement('brite_bottom'); if (a) showAchievementToast(a); }
    // Stuck But Standing — won battle after pushing through Stuck Sparge
    if (state.stuckStandingPending) {
      state.stuckStandingPending = false;
      const a = unlockAchievement('stuck_standing');
      if (a) showAchievementToast(a);
    }
      // Sync battle-result HP onto state team, then apply level gains
      for (let i = 0; i < state.team.length; i++) {
        if (resultP[i]) state.team[i].currentHp = resultP[i].currentHp;
        // Reset Overcarbonated flags so it fires again next battle
        delete state.team[i]._overcarb_fired;
        delete state.team[i]._overcarb_vented;
      }

      // Pizza Party: heal 5% max HP per holder after every battle
      const pizzaHeals = applyPizzaParty(state.team);

      // Nuzlocke: permanently release any brews that fainted this battle
      if (state.modifiers && state.modifiers.has('nuzlocke')) {
        const fainted = state.team.filter(p => p.currentHp <= 0);
        if (fainted.length > 0) {
          state.nuzlockePerfect = false;
          state.team = state.team.filter(p => p.currentHp > 0);
          const names = fainted.map(p => p.nickname || p.brewName || p.name).join(', ');
          showMapNotification(`💀 Nuzlocke: ${names} permanently released.`);
        }
      }

      // Show Pizza Party notification after Nuzlocke so released pokemon aren't mentioned
      if (pizzaHeals.length > 0) {
        showMapNotification('🍕 Pizza Party! ' + pizzaHeals.map(h => `${h.name} +${h.amount}HP`).join(', '));
      }

      const maxEnemyLevel = Math.max(...resultE.map(p => p.level));
      const levelUps = applyLevelGain(state.team, state.hardMode ? [] : state.items, playerParticipants, maxEnemyLevel, state.hardMode);
      // Keep Skip active for level-up animation too
      skipBtn.disabled = false;
      skipBtn.textContent = 'Skip';
      skipBtn.onclick = () => { skipBattleAnimation = true; };
      await animateLevelUp(levelUps);
      skipBtn.disabled = true;
      await checkAndEvolveTeam();
      document.getElementById('btn-continue-battle').style.display = 'block';
      document.getElementById('btn-continue-battle').onclick = () => {
        if (onWin) onWin();
        resolve(true);
      };
    } else {
      // Reset Overcarbonated flags even on a loss
      for (let i = 0; i < state.team.length; i++) {
        delete state.team[i]._overcarb_fired;
        delete state.team[i]._overcarb_vented;
      }
      // Sync HP so fainted pokemon don't incorrectly count as Pizza Party holders
      for (let i = 0; i < state.team.length; i++) {
        if (resultP[i]) state.team[i].currentHp = resultP[i].currentHp;
      }
      // Pizza Party heals even on a loss
      const pizzaHeals = applyPizzaParty(state.team);
      if (pizzaHeals.length > 0) {
        showMapNotification('🍕 Pizza Party! ' + pizzaHeals.map(h => `${h.name} +${h.amount}HP`).join(', '));
      }
      document.getElementById('btn-continue-battle').style.display = 'block';
      document.getElementById('btn-continue-battle').textContent = 'Continue...';
      document.getElementById('btn-continue-battle').onclick = () => {
        if (onLose) onLose();
        resolve(false);
      };
    }
  });
}

// ---- End Screens ----

function showBadgeScreen(leader) {
  showScreen('badge-screen');
  document.getElementById('badge-msg').textContent = `You earned the ${leader.badge}!`;
  document.getElementById('badge-leader').textContent = `Defeated ${leader.name}!`;
  document.getElementById('badge-count-display').textContent = `Badges: ${state.badges}/8`;
  const badgeImg = document.getElementById('badge-icon-img');
  if (badgeImg) badgeImg.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/badges/${state.badges}.png`;

  document.getElementById('btn-next-map').onclick = () => {
    if (state.currentMap >= 7) {
      state.eliteIndex = 0;
      startMap(8);
    } else {
      startMap(state.currentMap + 1);
    }
  };
}

function showGameOver() {
  clearRun();
  initGame();
}

function showWinScreen() {
  clearRun(); // run complete — wipe save so title screen is clean
  showScreen('win-screen');
  document.getElementById('win-team').innerHTML = state.team.map(p =>
    renderPokemonCard(p, false, false)).join('');
  document.getElementById('btn-play-again').onclick = startNewRun;

  // Track elite four wins
  const wins = incrementEliteWins();
  saveHallOfFameEntry(state.team, wins, state.hardMode);
  const winsEl = document.getElementById('win-run-count');
  if (winsEl) winsEl.textContent = `Championship #${wins}`;

  // Queue achievements with staggered toasts
  const toasts = [];
  function queueAch(id, delay) {
    const ach = unlockAchievement(id);
    if (ach) toasts.push({ ach, delay });
  }

  // Elite four milestones
  if (wins === 1)   queueAch('elite_four', 200);
  if (wins === 10)  queueAch('elite_10', 400);

  // Starter achievements
  const sid = state.starterSpeciesId;
  const starterAchId = [1,2,3].includes(sid) ? 'starter_1'
    : [4,5,6].includes(sid) ? 'starter_4'
    : [7,8,9].includes(sid) ? 'starter_7' : null;
  if (starterAchId) queueAch(starterAchId, 800);

  // Seasonal release — track which starter types won
  if (starterAchId) {
    try {
      const won = new Set(JSON.parse(localStorage.getItem('poke_seasonal_wins') || '[]'));
      won.add(starterAchId);
      localStorage.setItem('poke_seasonal_wins', JSON.stringify([...won]));
      if (won.size >= 3) queueAch('seasonal', 1000);
    } catch(e) {}
  }

  // Solo run
  if (state.maxTeamSize === 1) queueAch('solo_run', 1200);

  // Vertical tasting — all team share at least one common type (primary or secondary)
  if (state.team.length >= 2) {
    // Collect all types from the first pokemon, then find if any appear on every team member
    const firstTypes = state.team[0].types || [];
    const sharedType = firstTypes.find(t =>
      state.team.every(p => (p.types || []).includes(t))
    );
    if (sharedType) queueAch('vertical', 1400);
  }

  // Mixed fermentation — no two share primary type
  const primaryTypes = state.team.map(p => (p.types || [])[0]).filter(Boolean);
  if (primaryTypes.length >= 2 && new Set(primaryTypes).size === primaryTypes.length) {
    queueAch('mixed_ferm', 1600);
  }

  // Perfect QC — no brew fainted all run
  if (state.perfectQC) queueAch('perfect_qc', 1800);

  // Hard mode win
  if (state.hardMode) queueAch('hard_mode_win', 2000);

  // ---- Modifier achievements ----
  const mods = state.modifiers || new Set();
  let modDelay = 2200;
  const nextModDelay = () => { const d = modDelay; modDelay += 200; return d; };

  if (mods.has('experimental_batch'))  queueAch('exp_batch_win',       nextModDelay());
  if (mods.has('no_adjuncts'))         queueAch('no_adjuncts_win',     nextModDelay());
  if (mods.has('small_tap_list'))      queueAch('small_tap_win',       nextModDelay());
  if (mods.has('speed_run'))           queueAch('speed_run_win',       nextModDelay());
  if (mods.has('limited_release'))     queueAch('limited_release_win', nextModDelay());
  if (mods.has('shiny_hunt'))          queueAch('shiny_hunt_win',      nextModDelay());
  if (mods.has('wild_events'))         queueAch('wild_events_win',     nextModDelay());

  if (mods.has('nuzlocke')) {
    queueAch('nuzlocke_win', nextModDelay());
    if (state.nuzlockePerfect) queueAch('nuzlocke_flawless', nextModDelay());
  }

  // Stacking achievements
  if (mods.size >= 3)                  queueAch('modifier_stacker',    nextModDelay());

  // Fire all toasts
  toasts.forEach(({ ach, delay }) => setTimeout(() => showAchievementToast(ach), delay));
}

// ---- Boot ----
window.addEventListener('DOMContentLoaded', initGame);

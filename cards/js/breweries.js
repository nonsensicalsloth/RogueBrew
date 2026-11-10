// breweries.js — the brewery you run as. Each has three tiers:
//   • Passive  — always on during battles
//   • Ability  — once per turn, costs budget (like a Hearthstone hero power)
//   • Run perk — changes the map, rests, rewards or events
// Any deck can be used with any brewery.
//
// Where each hook lives:
//   passives  → battle.js resolvePlay, effects.js softenContamination
//   abilities → this file (useAbility / abilityPickTarget), ui.js renderActions
//   run perks → map.js (rest upgrade, offers, events), draft.js selectBrewery

const BREWERIES = [
  {
    id: 'lagerhaus', name: 'Lagerhaus', icon: '🍺', subtitle: 'Patience and consistency.',
    passive: 'Crisp cards you play get +1.',
    ability: { name: 'Cold Condition', cost: 1, desc: 'Choose a yeast on your cold side. It gains +5.' },
    perk:    'Rest-stop upgrades give +8 instead of +5.',
    unlocked: true,
  },
  {
    id: 'hophouse', name: 'Hop House', icon: '🌿', subtitle: 'Speed and card draw.',
    passive: 'Your first hop each turn gets +2.',
    ability: { name: 'Hop Scout', cost: 3, desc: 'Draw a card. If it is a hop, it costs 1 less this turn.' },
    perk:    'Card rewards show 1 extra option.',
    unlocked: true,
  },
  {
    id: 'wildcellar', name: 'Wild Cellar', icon: '🦠', subtitle: 'Risk for power.',
    passive: 'Contamination on your side is only −5.',
    ability: { name: 'Spontaneous', cost: 0, desc: 'Once per round: pay 5 Reputation to draw 2 cards.' },
    perk:    'Start with 80 max Reputation. Events offer an extra wild option.',
    unlocked: true,
  },
];

const WILD_START_REP   = 80;
const WILD_ABILITY_REP = 5;

// The brewery for this run (map-level perks)
function runBrewery() {
  return typeof draftState !== 'undefined' && draftState.brewery ? draftState.brewery.id : null;
}

// The brewery during a battle — only in map runs, not practice games
function activeBrewery() {
  if (typeof state === 'undefined' || !state || !state.currentNode) return null;
  return runBrewery();
}

function breweryDef() {
  return BREWERIES.find(b => b.id === activeBrewery()) || null;
}

// ── Brewery Ability ──

function abilityKey() { return `${state.round}:${state.turn}`; }

// Can the ability be used right now? Returns { ok, reason }
function abilityStatus() {
  const b = breweryDef();
  if (!b) return { ok: false, reason: '' };
  if (state.phase !== 'play' || !state.playerTurn)     return { ok: false, reason: 'Not your turn' };
  if (state.abilityUsed)                               return { ok: false, reason: 'Already used this turn' };
  if (playerMustPlayContamination())                   return { ok: false, reason: 'Pour the Contamination first' };
  if (cardTargetingActive())                           return { ok: false, reason: 'Choose a target for your card first' };
  if (b.ability.cost > state.budget - state.budgetUsed) return { ok: false, reason: 'Not enough budget' };
  if (b.id === 'lagerhaus' && !getLaneCards('cold', 'p').some(c => c.cat === 'yeast'))
    return { ok: false, reason: 'No yeast on your cold side' };
  if (b.id === 'hophouse' && !state.pDeck.length && !state.pDiscard.some(c => c.cat !== 'token'))
    return { ok: false, reason: 'Nothing left to draw' };
  if (b.id === 'wildcellar' && state.wildUsedRound)    return { ok: false, reason: 'Already used this round' };
  if (b.id === 'wildcellar' && (typeof mapState === 'undefined' || !mapState || mapState.rep <= WILD_ABILITY_REP))
    return { ok: false, reason: 'Not enough Reputation' };
  return { ok: true, reason: '' };
}

function finishAbility(b) {
  state.budgetUsed += b.ability.cost;
  state.abilityUsed = true;
  state.abilityTargeting = false;
  render();
}

function useAbility() {
  const b = breweryDef();
  if (!b) return;
  // Clicking again while choosing a target cancels
  if (state.abilityTargeting) { state.abilityTargeting = false; render(); return; }
  if (!abilityStatus().ok) return;
  selectedCard = null;

  switch (b.id) {
    case 'lagerhaus':
      // Needs a target: highlight your yeasts and wait for a click
      state.abilityTargeting = true;
      addLog('Cold Condition: click a yeast on your cold side.', 'player');
      render();
      return;

    case 'hophouse': {
      const before = state.pHand.length;
      drawForPlayer(1);
      const drawn = state.pHand.length > before ? state.pHand[state.pHand.length - 1] : null;
      if (drawn && drawn.cat === 'hop') {
        drawn._scoutKey = abilityKey();
        addLog(`Hop Scout: drew ${drawn.name} — it costs 1 less this turn!`, 'player');
      } else if (drawn) {
        addLog(`Hop Scout: drew ${drawn.name}.`, 'player');
      }
      checkContaminationInHand('p');
      finishAbility(b);
      return;
    }

    case 'wildcellar':
      mapState.rep -= WILD_ABILITY_REP;
      state.wildUsedRound = true;
      addLog(`Spontaneous: −${WILD_ABILITY_REP} Reputation (⭐ ${mapState.rep}) to draw 2.`, 'warn');
      drawForPlayer(2);
      checkContaminationInHand('p');
      finishAbility(b);
      return;
  }
}

// Called when you click a highlighted card on your board
function abilityPickTarget(lane, idx) {
  const b = breweryDef();
  if (!b || !state.abilityTargeting) return;
  const card = state.field[lane].p[idx];
  if (b.id === 'lagerhaus' && card && lane === 'cold' && card.cat === 'yeast') {
    card.points += 5;
    addLog(`Cold Condition: ${card.name} +5!`, 'player');
    finishAbility(b);
  }
}

// Which of your board cards can be clicked as a target right now
function isAbilityTarget(c, lane) {
  if (!state.abilityTargeting) return false;
  const id = activeBrewery();
  return id === 'lagerhaus' && lane === 'cold' && c.cat === 'yeast';
}

// ── Brewery select screen ──

function breweryCardHtml(b) {
  return `
    <div class="brewery-card ${b.unlocked ? '' : 'locked'}" onclick="${b.unlocked ? `selectBrewery('${b.id}')` : 'void(0)'}">
      <div class="brewery-icon">${b.icon}</div>
      <div class="brewery-name">${b.name}</div>
      <div class="brewery-sub">${b.subtitle}</div>
      ${b.unlocked ? `
        <div class="brewery-tier"><span>PASSIVE</span>${b.passive}</div>
        <div class="brewery-tier"><span>ABILITY · ${b.ability.name} (${b.ability.cost})</span>${b.ability.desc}</div>
        <div class="brewery-tier"><span>RUN PERK</span>${b.perk}</div>`
      : '<div class="brewery-bonus">🔒 LOCKED</div>'}
    </div>`;
}

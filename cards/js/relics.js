// relics.js — brewing equipment relics (permanent passives for the run)
// Awarded by beating an act boss. Hooks live where each effect applies:
//   glycol      → effects.js applyTurnEffects
//   hopback     → battle.js getEffectiveCost / playToLane
//   grainmill   → game.js startRound
//   fermenter   → game.js getBudget
//   microscope  → effects.js softenContamination
//   roaster     → game.js startRound
//   hopcannon   → battle.js resolvePlay
//   recipebook  → game.js toggleMulligan

const RELICS = [
  { id:'glycol',     name:'Glycol Chiller',    icon:'❄️', desc:'Your yeast gains +1 extra point every other turn.' },
  { id:'hopback',    name:'Hop Back',          icon:'🫖', desc:'Your first hop each round costs 0.' },
  { id:'grainmill',  name:'Grain Mill',        icon:'⚙️', desc:'Draw 1 extra card at the start of each round.' },
  { id:'fermenter',  name:'Second Fermenter',  icon:'🛢️', desc:'Your max budget is 6 instead of 5.' },
  { id:'microscope', name:'Lab Microscope',    icon:'🔬', desc:'Contamination that lands on your board is always softened to −5.' },
  { id:'roaster',    name:'Coffee Roaster',    icon:'☕', desc:'Your roast threshold starts 2 higher.' },
  { id:'hopcannon',  name:'Hop Cannon',        icon:'🌿', desc:'Hops you play on your cold side get +2.' },
  { id:'recipebook', name:'Recipe Book',       icon:'📖', desc:'Start each battle with 1 extra card, and mulligan up to 3 instead of 2.' },
];

function getRelic(id) {
  return RELICS.find(r => r.id === id);
}

// Relics only apply during map runs (not practice games)
function hasRelic(id) {
  if (typeof mapState === 'undefined' || !mapState || !mapState.relics) return false;
  if (typeof state !== 'undefined' && state && state.phase && !state.currentNode) return false;
  return mapState.relics.includes(id);
}

function relicIconsHtml() {
  const owned = (typeof mapState !== 'undefined' && mapState && mapState.relics) || [];
  return owned.map(id => {
    const r = getRelic(id);
    return r ? `<span class="relic-icon" title="${r.name}: ${r.desc}">${r.icon}</span>` : '';
  }).join('');
}

// ── Boss reward: pick 1 of 3 ──

let pendingRelicGold = 0;
let relicOffer = [];

function showRelicChoice(goldReward) {
  pendingRelicGold = goldReward;
  const owned = mapState.relics || [];
  relicOffer = shuffle(RELICS.filter(r => !owned.includes(r.id))).slice(0, 3);
  if (relicOffer.length === 0) { showActTransition(goldReward); return; }

  setScreen('relic-screen');
  document.getElementById('relic-gold').textContent = `+${goldReward} gold earned!`;
  document.getElementById('relic-choices').innerHTML = relicOffer.map((r, i) => `
    <div class="relic-card" onclick="pickRelic(${i})">
      <div class="relic-card-icon">${r.icon}</div>
      <div class="relic-card-name">${r.name}</div>
      <div class="relic-card-desc">${r.desc}</div>
    </div>`).join('');
}

function pickRelic(i) {
  const r = relicOffer[i];
  if (!r) return;
  mapState.relics = mapState.relics || [];
  mapState.relics.push(r.id);
  relicOffer = [];
  showActTransition(pendingRelicGold);
}

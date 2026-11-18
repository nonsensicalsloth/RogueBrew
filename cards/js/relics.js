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
//   steamjacket → game.js laneScore
//   phmeter     → effects.js giveAcid
//   britetank   → game.js startRound
//   decoction   → effects.js makeStuckMash
//   grainauger  → battle.js getEffectiveCost / playToLane
//   canningline → map.js onBattleWin
//   pilotsystem → game.js initGame
//   contractdeal (boss only) → map.js startMapBattle / onBattleWin
// Relics marked boss:true have a catch, and only show up as boss rewards.

const RELICS = [
  { id:'glycol',     name:'Glycol Chiller',    icon:'❄️', desc:'Your yeast gains +1 extra point every other turn.' },
  { id:'hopback',    name:'Hop Back',          icon:'🫖', desc:'Your first hop each round costs 0.' },
  { id:'grainmill',  name:'Grain Mill',        icon:'⚙️', desc:'Draw 1 extra card at the start of each round.' },
  { id:'fermenter',  name:'Second Fermenter',  icon:'🛢️', desc:'+1 budget on each of your first 3 turns every round.' },
  { id:'microscope', name:'Lab Microscope',    icon:'🔬', desc:'Contamination that lands on your board is always softened to −5.' },
  { id:'roaster',    name:'Coffee Roaster',    icon:'☕', desc:'Your roast threshold starts 2 higher.' },
  { id:'hopcannon',  name:'Hop Cannon',        icon:'🌿', desc:'Hops you play on your cold side get +2.' },
  { id:'recipebook', name:'Recipe Book',       icon:'📖', desc:'Start each battle with 1 extra card, and mulligan up to 3 instead of 2.' },
  { id:'steamjacket', name:'Steam Jacket',     icon:'♨️', desc:'Going Burnt only takes a quarter off your hot side instead of half.' },
  { id:'phmeter',     name:'pH Meter',         icon:'🧪', desc:'The first time you give the rival Acid each round, give 2 more.' },
  { id:'britetank',   name:'Brite Tank',       icon:'🛢️', desc:'Start every round with 2 Lagering.' },
  { id:'decoction',   name:'Decoction Kettle', icon:'🫕', desc:'A Stuck Mash gives you +8 instead of −8.' },
  { id:'grainauger',  name:'Grain Auger',      icon:'🌾', desc:'The first malt you play each turn costs 1 less.' },
  { id:'canningline', name:'Canning Line',     icon:'🥫', desc:'+15 gold after every battle you win.' },
  { id:'pilotsystem', name:'Pilot System',     icon:'⚗️', desc:'Each battle, a random rare card that shares a tag with your deck is shuffled in. It only lasts that battle.' },
  // Boss rewards only: strong, with a catch
  { id:'contractdeal', name:'Contract Brewing Deal', icon:'🏭', boss: true,
    desc:"You brew another brewery's beer on the side: +25 gold after every battle you win. But every rival starts with +10." },
];
const CANNING_GOLD  = 15;
const CONTRACT_GOLD = 25;
const CONTRACT_RIVAL_BONUS = 10;
const BRITE_TANK_LAGER = 2;
const PH_METER_BONUS   = 2;

function getRelic(id) {
  return RELICS.find(r => r.id === id);
}

// Relics only apply during map runs (not practice games)
function hasRelic(id) {
  if (typeof mapState === 'undefined' || !mapState || !mapState.relics) return false;
  if (typeof state !== 'undefined' && state && state.phase && !state.currentNode) return false;
  return mapState.relics.includes(id);
}

// Same, for run-level effects that happen outside a battle (rewards, map)
function hasRelicNow(id) {
  return typeof mapState !== 'undefined' && !!mapState && !!mapState.relics && mapState.relics.includes(id);
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
  relicOffer = shuffle(RELICS.filter(r => !owned.includes(r.id))).slice(0, 3);   // bosses can offer boss-only equipment
  if (relicOffer.length === 0) { showActTransition(goldReward); return; }

  setScreen('relic-screen');
  document.getElementById('relic-gold').innerHTML = `<span class="res-chip gold">💰 +${goldReward} gold</span>`;
  document.getElementById('relic-choices').innerHTML = relicOffer.map((r, i) => `
    <div class="relic-card" onclick="pickRelic(${i})">
      <div class="relic-card-icon">${r.icon}</div>
      <div class="relic-card-name">${r.name}${r.boss ? '<div class="relic-catch">HAS A CATCH</div>' : ''}</div>
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

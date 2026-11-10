// nodes.js — special map nodes
//   barrel   — age a card for 3 stops, it returns with +10 and the oaky tag
//   collab   — trade one of your cards for one from a themed brewery
//   lab      — transform a card into a random card of the same category
//   taproom  — sell your beer for gold based on your deck
//   contract — pay gold now for a focused pick at your next card offer
// (Beer Festival is a battle node, handled in map.js startMapBattle / onBattleWin)

// ── Shared screen helpers ──

function showSpecial(title, desc) {
  setScreen('map-special-screen');
  document.getElementById('special-title').textContent  = title;
  document.getElementById('special-desc').textContent   = desc;
  document.getElementById('special-body').innerHTML     = '';
  document.getElementById('special-result').textContent = '';
  setSpecialFooter(`<button class="btn btn-primary" onclick="showMapScreen()">Leave</button>`);
}

function setSpecialBody(html)   { document.getElementById('special-body').innerHTML = html; }
function setSpecialFooter(html) { document.getElementById('special-footer').innerHTML = html; }

function finishSpecial(message) {
  document.getElementById('special-result').textContent = message;
  setSpecialBody('');
  setSpecialFooter(`<button class="btn btn-gold" onclick="showMapScreen()">Continue →</button>`);
}

function specialCardHtml(c, onclick) {
  const pts  = c.points >= 0 ? `+${c.points}` : `${c.points}`;
  const lane = c.lane === 'both' ? 'HOT/COLD' : c.lane === 'hot' ? 'HOT SIDE' : 'COLD SIDE';
  return `<div class="card cat-${c.cat}" onclick="${onclick}" style="width:120px;">
    <div class="card-cost-gem">${c.cost}</div>
    <div class="card-pts-gem">${pts}</div>
    <div class="card-art">${catIcon(c.cat)}</div>
    ${rarityBar(c)}<div class="card-name-banner">${c.name}</div>
    <div class="card-tags-row">${tagHtml(c.tags)}</div>
    <div class="card-effect-text">${c.desc || ''}</div>
    <div class="card-restrict">${lane}${rarityLabel(c)}</div>
  </div>`;
}

function copiesInDeck(id) {
  return draftState.deck.filter(c => c.id === id).length;
}

// ═════════════ Barrel Room ═════════════

const BARREL_STOPS = 3;    // stops the card sits out
const BARREL_BONUS = 10;

function showBarrelRoom() {
  showSpecial('🛢 BARREL ROOM',
    `Put a card in a barrel. It leaves your deck for the next ${BARREL_STOPS} stops, then returns with +${BARREL_BONUS} pts and the oaky tag.`);
  if (!canRemoveCard()) {
    finishSpecial(`Your deck is too small to spare a card (minimum ${MIN_DECK_SIZE}).`);
    return;
  }
  setSpecialBody(`<div class="removal-list">${deckPickerHtml('barrelCard', c => c._barrelAged
    ? { html: 'already aged', disabled: true }
    : { html: `<span style="color:var(--gold)">+${c.points} → +${c.points + BARREL_BONUS}</span>`, disabled: false })}</div>`);
}

function barrelCard(idx) {
  if (!canRemoveCard()) return;
  const card = draftState.deck[idx];
  if (!card || card._barrelAged) return;
  draftState.deck.splice(idx, 1);
  // Returns when you click the stop after BARREL_STOPS more stops
  card._barrelReturn = (mapState.nodeCount || 0) + BARREL_STOPS + 1;
  mapState.barrel = mapState.barrel || [];
  mapState.barrel.push(card);
  if (mapState.barrelBroker) { mapState.gold -= 40; mapState.barrelBroker = false; }   // Barrel Broker event
  finishSpecial(`${card.name} is resting in oak. Back in ${BARREL_STOPS} stops.`);
}

// Called each time you step onto a map node
function checkBarrel() {
  if (!mapState.barrel || !mapState.barrel.length) return;
  const ready = mapState.barrel.filter(c => c._barrelReturn <= mapState.nodeCount);
  if (!ready.length) return;
  mapState.barrel = mapState.barrel.filter(c => c._barrelReturn > mapState.nodeCount);
  ready.forEach(c => {
    delete c._barrelReturn;
    c._barrelAged = true;
    c.points += BARREL_BONUS;
    c.name = `Barrel-Aged ${c.name}`;
    c.tags = [...(c.tags || []), 'oaky'];
    draftState.deck.push(c);
  });
  mapState.notice = `🛢 Out of the barrel: ${ready.map(c => c.name).join(', ')}!`;
}

// ═════════════ Collab Brew ═════════════

const COLLAB_BREWERIES = [
  { name:'Fog Lantern Brewing',  style:'hazy',       ids:['london3','oats','flakedwheat','citra','galaxy','mosaic','nectaron','talus','mango','hopoil','cosmicpunch'] },
  { name:'Abbey of St. Wort',    style:'Belgian',    ids:['abbey','saison','candisugarcl','candisugarab','candisugardk','coriander','orangepeel','grainspara','cardamom'] },
  { name:'Black Kettle Stoutworks', style:'stout',   ids:['choc','patent','roastedbar','carafaIII','midnightw','coffee','coldbrewcof','cacaonibs','lactose','vanilla'] },
  { name:'Kühlhaus Lagerei',     style:'lager',      ids:['pilsner','floorpilsner','saaz','hallertau','tettnang','w3470','czechlager','kolsch','vienna','hallblanc'] },
  { name:'Pine & Pellet Co.',    style:'West Coast', ids:['cascade','centennial','chinook','columbus','simcoe','magnum','chico','crystal10','2row'] },
  { name:'Tart Cellars',         style:'sour',       ids:['lacto','sourvisiae','brett','raspberry','cherry','passionfr','blueberry','phantasm'] },
];

let collabState = { brewery: null, offer: [], pick: null };

function showCollab() {
  const b = COLLAB_BREWERIES[Math.floor(Math.random() * COLLAB_BREWERIES.length)];
  const offer = shuffle(b.ids.filter(id => getCardDef(id) && copiesInDeck(id) < MAX_COPIES))
    .slice(0, 3).map(id => ({ ...getCardDef(id) }));
  collabState = { brewery: b, offer, pick: null };
  showSpecial('🤝 COLLAB BREW',
    `${b.name} wants to brew a ${b.style} beer with you. Pick one of their ingredients, then choose one of yours to trade away.`);
  if (!offer.length) { finishSpecial("They didn't have anything new for you. Maybe next time."); return; }
  setSpecialBody(`<div class="special-cards">${offer.map((c, i) => specialCardHtml(c, `collabPick(${i})`)).join('')}</div>`);
}

function collabPick(i) {
  collabState.pick = collabState.offer[i];
  if (!collabState.pick) return;
  document.getElementById('special-desc').textContent =
    `Trading for ${collabState.pick.name}. Which of your cards goes to ${collabState.brewery.name}?`;
  setSpecialBody(`<div class="removal-list">${deckPickerHtml('collabTrade', () => ({ html: '<span style="color:var(--red)">trade</span>', disabled: false }))}</div>`);
  setSpecialFooter(`<button class="btn btn-primary" onclick="showCollab()">← Back</button>`);
}

function collabTrade(idx) {
  const given = draftState.deck[idx];
  if (!given || !collabState.pick) return;
  draftState.deck.splice(idx, 1, { ...collabState.pick });
  finishSpecial(`Traded ${given.name} for ${collabState.pick.name}. Cheers! 🍻`);
}

// ═════════════ Quality Lab ═════════════

function showLab() {
  showSpecial('🔬 QUALITY LAB',
    'The lab can rework one card into a random card of the same category. Upgrades and aging are lost.');
  setSpecialBody(`<div class="removal-list">${deckPickerHtml('labTransform', c => ({ html: `<span style="color:var(--accent)">→ random ${c.cat}</span>`, disabled: false }))}</div>`);
}

function labTransform(idx) {
  const old = draftState.deck[idx];
  if (!old) return;
  const pool = CARD_POOL.filter(c => c.cat === old.cat && c.id !== old.id && copiesInDeck(c.id) < MAX_COPIES);
  if (!pool.length) { finishSpecial(`The lab couldn't find another ${old.cat} to make.`); return; }
  const neu = { ...pool[Math.floor(Math.random() * pool.length)] };
  draftState.deck.splice(idx, 1, neu);
  finishSpecial(`${old.name} became ${neu.name}!`);
}

// ═════════════ Taproom Night ═════════════

// Family and style tags don't count as a "signature flavor"
const NON_FLAVOR_TAGS = ['c-hop','noble','thiol','nuanced','clean','belgian'];
const SIGNATURE_MIN   = 6;

function taproomPayout() {
  const hopsYeast = draftState.deck.filter(c => c.cat === 'hop' || c.cat === 'yeast').length;
  const counts = {};
  draftState.deck.forEach(c => (c.tags || []).forEach(t => {
    if (!NON_FLAVOR_TAGS.includes(t)) counts[t] = (counts[t] || 0) + 1;
  }));
  const [sigTag, sigCount] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0] || [null, 0];
  const signature = sigCount >= SIGNATURE_MIN;
  return {
    base: 15,
    hopsYeast, hopsYeastGold: hopsYeast * 3,
    sigTag, sigCount, signature, sigGold: signature ? 20 : 0,
    total: 15 + hopsYeast * 3 + (signature ? 20 : 0),
  };
}

function showTaproom() {
  const p = taproomPayout();
  showSpecial('🍺 TAPROOM NIGHT', 'Locals pack the taproom. What you sell depends on what you brew.');
  setSpecialBody(`<div class="taproom-breakdown">
    <div>House pour: <span>+${p.base}</span></div>
    <div>${p.hopsYeast} hop &amp; yeast cards × 3: <span>+${p.hopsYeastGold}</span></div>
    <div>${p.signature
      ? `Signature flavor — ${p.sigTag} (${p.sigCount} cards): <span>+${p.sigGold}</span>`
      : `No signature flavor yet (need ${SIGNATURE_MIN}+ cards sharing one): <span>+0</span>`}</div>
    <div class="taproom-total">Total: <span>💰 ${p.total}</span></div>
  </div>`);
  setSpecialFooter(`<button class="btn btn-gold" onclick="collectTaproom()">Pour &amp; collect</button>`);
}

function collectTaproom() {
  const p = taproomPayout();
  mapState.gold += p.total;
  finishSpecial(`Great night! +${p.total} gold.`);
}

// ═════════════ Supplier Contract ═════════════

const CONTRACT_COST = 40;
const CONTRACT_CATS = ['malt','adjunct','hop','yeast','process'];

function showContract() {
  showSpecial('📜 SUPPLIER CONTRACT',
    `Pay ${CONTRACT_COST} gold now. Your next card offer (draft or battle reward) shows 4 cards from the category you choose.`);
  if (mapState.contract) {
    finishSpecial(`You already have a ${mapState.contract} contract waiting.`);
    return;
  }
  const afford = mapState.gold >= CONTRACT_COST;
  setSpecialBody(`<div class="special-cards">${CONTRACT_CATS.map(cat =>
    `<button class="btn ${afford ? 'btn-primary' : ''}" ${afford ? `onclick="signContract('${cat}')"` : 'style="opacity:0.4;cursor:not-allowed;"'}
      style="border-color:${catColor(cat)};color:${catColor(cat)}">${catIcon(cat)} ${cat.toUpperCase()}</button>`).join('')}</div>
    ${afford ? '' : `<div style="font-size:7px;color:var(--red);margin-top:8px;">Not enough gold (need ${CONTRACT_COST}).</div>`}`);
}

function signContract(cat) {
  if (mapState.gold < CONTRACT_COST || mapState.contract) return;
  mapState.gold -= CONTRACT_COST;
  mapState.contract = cat;
  finishSpecial(`Contract signed: your next card offer is all ${cat}.`);
}

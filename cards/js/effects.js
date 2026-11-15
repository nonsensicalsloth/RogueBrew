// effects.js — card effect system
// Called from battle.js after a card is placed on the field.
// applyCardEffect(card, lane, who) — 'who' is 'p' or 'e'
// applyTurnEffects(who) — called at start of each turn for persistent effects

// ── Helpers ──

function getField(who) {
  return {
    hot:  state.field.hot[who],
    cold: state.field.cold[who],
  };
}

function getAllOnField(who) {
  return [...state.field.hot[who], ...state.field.cold[who]];
}

function getLaneCards(lane, who) {
  return state.field[lane][who];
}

// ── Live values for formula cards in your hand ──
// These cards' scores come from a formula based on the board (not on which lane
// you pick — they're all hot-side only), so the hand can show what they're worth
// right now. Returns null for every other card.
function formulaPreview(c, who = 'p') {
  const def    = getCardDef(c.id);
  if (!def) return null;
  const earned = c.points - def.points;                  // upgrades, aging, etc.
  const hotNow = getLaneCards('hot', who).filter(x => x.cat !== 'token').length;
  // Roasty cards: show the roast bonus they'd have once played (counting roast they add)
  const roastyLive = () => {
    if (!(c.tags && c.tags.includes('roasty'))) return null;
    const r = getRoast(who) + (ROAST_ADDS[c.id] || 0);
    return { points: c.points + ROAST_POWER * r, note: `now: ${r} roast` };
  };
  switch (c.id) {
    case 'crystal80': {
      const r = getRoast(who);
      return { points: r * 8 + earned + ROAST_POWER * r, note: `now: ${r} roast` };
    }
    case 'specialb': {
      const r = getRoast(who);
      return { points: c.points + r * 6 + ROAST_POWER * r, note: `now: ${r} roast` };
    }
    case 'biscuit': {
      const rows = hotNow + 1;                            // counts itself once played
      return { points: def.points * rows + earned, note: `now: ${rows} cards` };
    }
    case 'crystal75':
      return { points: c.points + hotNow * 4, note: `now: ${hotNow} other cards` };
    case 'melanoidin': {
      const n = (who === 'p' ? state.pDiscard : state.eDiscard).filter(x => x.id === 'melanoidin').length;
      return { points: c.points * (n + 1), note: `now: ${n} in discard` };
    }
  }
  const roasty = roastyLive();
  if (roasty) return roasty;
  if (isCrisp(c) && lagering(who) > 0) {
    return { points: c.points + lagering(who) * lagerPower(who), note: `+${lagering(who) * lagerPower(who)} lagering` };
  }
  return null;
}

// Like countTag, but never counts the card itself
function countOthers(tag, who, self, lane = null) {
  const cards = lane ? getLaneCards(lane, who) : getAllOnField(who);
  return cards.filter(c => c !== self && c.tags && c.tags.includes(tag)).length;
}

function countTag(tag, who, lane = null) {
  if (lane) return getLaneCards(lane, who).filter(c => c.tags && c.tags.includes(tag)).length;
  return getAllOnField(who).filter(c => c.tags && c.tags.includes(tag)).length;
}

function countCat(cat, who, lane = null) {
  if (lane) return getLaneCards(lane, who).filter(c => c.cat === cat).length;
  return getAllOnField(who).filter(c => c.cat === cat).length;
}

function isDarkOrCrystal(c) {
  return (c.tags && (c.tags.includes('roasty'))) ||
    (c.id && (c.id.startsWith('crystal') || c.id === 'specialb' || c.id === 'caramun' || c.id === 'carapils'));
}

// ── Roast (tracked per side as counters, not cards) ──
function roastKeys(who) {
  return who === 'p'
    ? { t: 'roastTokens',  s: 'roastSafe',  th: 'roastThreshold'  }
    : { t: 'eRoastTokens', s: 'eRoastSafe', th: 'eRoastThreshold' };
}

function getRoastThreshold(who) { return state[roastKeys(who).th] || 5; }

function addRoastToken(who, amount = 1) {
  const k = roastKeys(who);
  state[k.t] = (state[k.t] || 0) + amount;
  const effective = state[k.t] - (state[k.s] || 0);
  const whose = who === 'p' ? 'you' : 'rival';
  addLog(`🔥 +${amount} roast (${whose}): ${state[k.t]}/${getRoastThreshold(who)}`, who === 'p' ? 'warn' : 'enemy');
  if (effective >= getRoastThreshold(who)) {
    addLog(`🔥 BURNT (${whose})! Too much roast — hot side scores half.`, who === 'p' ? 'warn' : 'enemy');
  }
}

// Roast that adds color but never counts toward the penalty (Midnight Wheat)
function addSafeRoast(who, amount = 1) {
  const k = roastKeys(who);
  state[k.t] = (state[k.t] || 0) + amount;
  state[k.s] = (state[k.s] || 0) + amount;
}

function removeRoast(who, amount = 1) {
  const k = roastKeys(who);
  const before = state[k.t] || 0;
  state[k.t] = Math.max(0, before - amount);
  state[k.s] = Math.min(state[k.s] || 0, state[k.t]);
  return before - state[k.t];
}

function raiseRoastThreshold(who, amount = 1) {
  const k = roastKeys(who);
  state[k.th] = getRoastThreshold(who) + amount;
  return state[k.th];
}

function drawFor(who, n) {
  if (who === 'p') drawForPlayer(n);
  else drawCards(n, state.eDeck, state.eHand);
}

function addToHand(who, tokenId) {
  const token = createToken(tokenId);
  if (!token) return;
  if (who === 'p') state.pHand.push(token);
  else state.eHand.push(token);
  addLog(`${token.name} added to ${who === 'p' ? 'your' : 'rival\'s'} hand.`, who === 'p' ? 'player' : 'enemy');
}

function shuffleIntoRemainingDeck(who, tokenId) {
  const token = createToken(tokenId);
  if (!token) return;
  const deck = who === 'p' ? state.pDeck : state.eDeck;
  const pos = Math.floor(Math.random() * (deck.length + 1));
  deck.splice(pos, 0, token);
  addLog(`Contamination shuffled into ${who === 'p' ? 'your' : 'rival\'s'} deck!`, who === 'p' ? 'warn' : 'enemy');
}

function buffLaneCards(lane, who, amount, filterFn = null) {
  const cards = getLaneCards(lane, who);
  let count = 0;
  cards.forEach(c => {
    // Respect protection flags
    if (amount < 0 && c._locked) return;
    if (amount !== 0 && Math.abs(amount) !== amount && c._noMultiplier) return; // debuffs skip noMultiplier too
    if (!filterFn || filterFn(c)) {
      c.points += amount;
      count++;
    }
  });
  return count;
}

// Removes ONE matching card. With no tokenId, removes the first negative token.
// Optionally limited to one lane. Returns the removed card (or null).
function removeFirstToken(who, tokenId = null, lane = null) {
  for (const l of (lane ? [lane] : LANES)) {
    const cards = state.field[l][who];
    const idx = tokenId
      ? cards.findIndex(c => c.id === tokenId)
      : cards.findIndex(c => c.cat === 'token' && c.points < 0);
    if (idx >= 0) {
      const removed = cards.splice(idx, 1)[0];
      addLog(`${removed.name} removed from ${LANE_NAMES[l]}.`, 'sys');
      return removed;
    }
  }
  return null;
}

// ── Stuck Mash (clumping) ──
// Sticky grains (oats, wheat, rye, spelt) clump when packed together. Three sticky
// cards IN A ROW on your hot side stick the mash: a Stuck Mash token (−8) appears.
// Anything played between them (a base malt, a crystal, Rice Hulls...) keeps the
// grain bed loose. Rice Hulls also clear a Stuck Mash.
const CLUMP_SIZE = 3;

function isSticky(c) { return !!(c && c.tags && c.tags.includes('sticky')); }

// Length of the sticky run at the end of your hot side (what your next play extends)
function trailingSticky(who) {
  const lane = getLaneCards('hot', who);
  let n = 0;
  for (let i = lane.length - 1; i >= 0 && isSticky(lane[i]); i--) n++;
  return n;
}

function hasClump(who) {
  let run = 0;
  for (const c of getLaneCards('hot', who)) { run = isSticky(c) ? run + 1 : 0; if (run >= CLUMP_SIZE) return true; }
  return false;
}

function stickyCount(who) { return getLaneCards('hot', who).filter(isSticky).length; }
function isMashStuck(who) { return getLaneCards('hot', who).some(c => c.id === 'stuckmash'); }

function checkStuckMash(who) {
  if (!hasClump(who) || isMashStuck(who)) return;
  getLaneCards('hot', who).push(createToken('stuckmash'));
  addLog(`🥣 ${who === 'p' ? 'Your' : "Rival's"} sticky grains clumped — Stuck Mash (−8)! Space them out, or add Rice Hulls.`, who === 'p' ? 'warn' : 'enemy');
}

function removeAllTokens(who, tokenId) {
  LANES.forEach(lane => {
    const before = state.field[lane][who].length;
    state.field[lane][who] = state.field[lane][who].filter(c => c.id !== tokenId);
    const removed = before - state.field[lane][who].length;
    if (removed > 0) addLog(`${removed} ${tokenId} removed from ${LANE_NAMES[lane]}.`, 'sys');
  });
}

function drawForPlayer(n) {
  const before = state.pHand.length;
  drawCards(n, state.pDeck, state.pHand);
  const drawn = state.pHand.length - before;
  if (drawn > 0) addLog(`Drew ${drawn} card${drawn > 1 ? 's' : ''}.`, 'player');
  else           addLog('Tried to draw, but your deck and discard are empty.', 'warn');
  return drawn;
}

// 2-Row is the brewhouse workhorse: it counts as two base malts
function baseMaltCount(cards) {
  return cards.reduce((n, c) => n + (BASE_MALT_IDS.includes(c.id) ? (c.id === '2row' ? 2 : 1) : 0), 0);
}
const BASE_MALT_IDS = ['2row','pilsner','6row','marisotter','goldenprom','vienna','munich','wheatwhite',
  'expilsner','floorpilsner','darkmunich','expwheat','paleale','heritage'];
const NZ_HOPS = ['nelson','motueka','riwaka','nectaron'];
const THIOL_YEASTS = ['cosmicpunch'];

function getRoast(who) {
  return who === 'p' ? (state.roastTokens || 0) : (state.eRoastTokens || 0);
}

function hasThiolYeast(who) {
  return getLaneCards('cold', who).some(c => THIOL_YEASTS.includes(c.id));
}

// Thiol cards get a one-time bonus when a thiol-releasing yeast is (or arrives) on the cold side.
function releaseThiol(c) {
  if (c._thiolReleased) return;
  const bonus = c.id === 'phantasm' ? 8 : 6;
  c.points += bonus;
  c._thiolReleased = true;
  addLog(`Thiols released: ${c.name} +${bonus}!`, 'player');
}

// Called after a card is played. If it carries thiols and a thiol yeast is already working, release them.
function applyThiolOnPlay(card, who) {
  if (card.cat === 'yeast') return;
  if (card.tags && card.tags.includes('thiol') && hasThiolYeast(who)) releaseThiol(card);
}

// Hop products (Cryo, Hop Oil) take on the flavor of the last real hop variety played this round.
const HOP_PRODUCTS = ['cryo','hopoil'];

function copyLastHopFlavor(card, who) {
  const last = state.lastHop && state.lastHop[who];
  if (!last) {
    addLog(`${card.name}: no hop played yet this round — no flavor to carry.`, who === 'p' ? 'player' : 'enemy');
    return;
  }
  card.tags = [...(last.tags || [])];
  card.name = `${card.name.split(' (')[0]} (${last.name})`;
  addLog(`${card.name}: carries ${last.name}'s flavor — ${card.tags.join(', ')}.`, who === 'p' ? 'player' : 'enemy');
}

// Remember the last real hop variety each side played.
function trackLastHop(card, who) {
  if (card.cat !== 'hop' || HOP_PRODUCTS.includes(card.id)) return;
  state.lastHop = state.lastHop || {};
  state.lastHop[who] = { name: card.name, tags: [...(card.tags || [])] };
}

function trackLastMalt(card, who) {
  if (card.cat !== 'malt' || card.id === 'aromatic') return;
  state.lastMalt = state.lastMalt || {};
  state.lastMalt[who] = card;
}

// Dry hop bonuses — used on play (cold side) and by Dry Hop Addition when a hop is moved.
function applyDryHopBonus(card, who) {
  switch (card.id) {
    case 'hallblanc':
      card.points += 4;
      addLog('Hallertau Blanc: dry hopped — +4 pts!', 'player');
      break;
    case 'talus': {
      const ok = c => c !== card && c.tags && (c.tags.includes('citrus') || c.tags.includes('piney'));
      const n = buffLaneCards('hot', who, 2, ok) + buffLaneCards('cold', who, 2, ok);
      addLog(`Talus: dry hopped — +2 to ${n} citrus/piney card(s).`, 'player');
      break;
    }
    case 'riwaka':
      card.points += 6;
      addLog('Riwaka: dry hopped — +6 pts!', 'player');
      break;
  }
}

// ══ Choosing a card on your board ══
// Some cards ask you to pick one of your board cards after they resolve
// (Filtration, Recipe Tweak, Crystal 120). The rival picks automatically.
const DRY_HOP_BONUS = 5;

const CARD_TARGETS = {
  pedio: {
    prompt: 'PEDIOCOCCUS: CHOOSE A FRUIT ON YOUR BOARD TO EAT',
    ok:     c => isFruit(c),
    aiPick: list => list.reduce((a, b) => b.c.points > a.c.points ? b : a),
    pick(t, who, eater) {
      const lane  = state.field[t.lane][who];
      lane.splice(lane.indexOf(t.c), 1);
      (who === 'p' ? state.pDiscard : state.eDiscard).push(t.c);
      const gain = Math.round(t.c.points * 1.5);
      if (eater) eater.points += gain;
      addLog(`Pediococcus eats the ${t.c.name}: +${gain}!`, who === 'p' ? 'player' : 'enemy');
    },
  },
  filtration: {
    prompt: 'FILTRATION: CHOOSE A YEAST TO RETURN TO YOUR HAND',
    ok:     (c, lane) => lane === 'cold' && c.cat === 'yeast',
    aiPick: list => list.reduce((a, b) => b.c.points < a.c.points ? b : a),   // replay its cheapest yeast
    pick(t, who) {
      const back = returnToHand(t.c, t.lane, who);
      back._freeKey = `${state.round}:${state.turn}`;          // re-pitch it for free this turn
      addLog(`Filtration: ${t.c.name} back in hand — free to pitch again this turn.`, who === 'p' ? 'player' : 'enemy');
    },
  },
  recipetweak: {
    prompt: 'RECIPE TWEAK: CHOOSE A CARD TO RETURN TO YOUR HAND',
    ok:     (c, lane, src) => c.cat !== 'token' && c !== src,
    aiPick: list => list.reduce((a, b) => b.c.points < a.c.points ? b : a),
    pick(t, who) {
      returnToHand(t.c, t.lane, who);
      if (who === 'p') state.nextCardDiscount = (state.nextCardDiscount || 0) + 1;
      addLog(`Recipe Tweak: ${t.c.name} back to hand. Next card costs 1 less.`, who === 'p' ? 'player' : 'enemy');
    },
  },
  dryhop: {
    prompt: 'DRY HOP ADDITION: CHOOSE A HOP ON YOUR HOT SIDE TO MOVE COLD',
    ok:     (c, lane) => lane === 'hot' && c.cat === 'hop' && c.lane !== 'hot',
    aiPick: list => list.reduce((a, b) => b.c.points > a.c.points ? b : a),
    pick(t, who) {
      const hot = state.field.hot[who];
      hot.splice(hot.indexOf(t.c), 1);
      state.field.cold[who].push(t.c);
      t.c.points += DRY_HOP_BONUS;
      addLog(`Dry Hop Addition: ${t.c.name} moved to the cold side, +${DRY_HOP_BONUS}!`, who === 'p' ? 'player' : 'enemy');
    },
  },
  crystal120: {
    prompt: 'CRYSTAL 120: CHOOSE A CRYSTAL MALT TO ABSORB',
    ok:     (c, lane, src) => lane === 'hot' && c !== src && c.id && c.id.startsWith('crystal'),
    aiPick: list => list.reduce((a, b) => b.c.points > a.c.points ? b : a),
    pick(t, who, src) {
      const lane = state.field[t.lane][who];
      lane.splice(lane.indexOf(t.c), 1);
      src.points += t.c.points * 2;
      addLog(`Crystal 120: absorbed ${t.c.name} — +${t.c.points * 2} pts (double)!`, who === 'p' ? 'player' : 'enemy');
    },
  },
};

// Puts a card back in its owner's hand at its printed stats
function returnToHand(c, lane, who) {
  const list = state.field[lane][who];
  const i = list.indexOf(c);
  if (i >= 0) list.splice(i, 1);
  // Back to how the card is in your deck: bonuses gained this battle are lost,
  // but run upgrades and barrel aging stay (same rebuild used for saved runs)
  const fresh = typeof refreshRunCard === 'function' ? refreshRunCard(c) : { ...(getCardDef(c.id) || c) };
  delete fresh._barrelReturn;
  if (c._deckIdx !== undefined) fresh._deckIdx = c._deckIdx;
  (who === 'p' ? state.pHand : state.eHand).push(fresh);
  return fresh;
}

function targetCandidates(kind, who, src) {
  const t = CARD_TARGETS[kind];
  return LANES.flatMap(lane => state.field[lane][who]
    .filter(c => t.ok(c, lane, src)).map(c => ({ c, lane })));
}

// Called from a card's effect. Player: wait for a click. Rival: choose now.
function startCardTargeting(kind, src, who) {
  const list = targetCandidates(kind, who, src);
  if (!list.length) { addLog(`${src.name}: nothing to choose.`, 'sys'); return; }
  if (who === 'e') { CARD_TARGETS[kind].pick(CARD_TARGETS[kind].aiPick(list), 'e', src); return; }
  state.cardTargeting = { kind, src };
}

function cardTargetingActive() { return !!(state && state.cardTargeting); }

function isCardTarget(c, lane) {
  if (!cardTargetingActive()) return false;
  const { kind, src } = state.cardTargeting;
  return CARD_TARGETS[kind].ok(c, lane, src);
}

function cardPickTarget(lane, idx) {
  if (!cardTargetingActive()) return;
  const { kind, src } = state.cardTargeting;
  const c = state.field[lane].p[idx];
  if (!c || !CARD_TARGETS[kind].ok(c, lane, src)) return;
  state.cardTargeting = null;
  CARD_TARGETS[kind].pick({ c, lane }, 'p', src);
  checkContaminationInHand('p');
  render();
}

// One entry point for the board: card effects first, then the brewery ability
function isBoardTarget(c, lane) { return isCardTarget(c, lane) || isAbilityTarget(c, lane); }
function pickBoardTarget(lane, idx) {
  if (cardTargetingActive()) cardPickTarget(lane, idx);
  else abilityPickTarget(lane, idx);
}

// ── On-play effects (Tier 1 & 2) ──

function applyCardEffect(card, lane, who) {
  const field = getField(who);
  const allMine = getAllOnField(who);
  const hotCards = getLaneCards('hot', who);
  const coldCards = getLaneCards('cold', who);
  const isPlayer = who === 'p';

  switch (card.id) {

    // ── Tier 1: Simple ──

    case 'pilsner':
      // Opening the brew day with it draws a card (cardsThisTurn counts after effects)
      if (!(state.cardsThisTurn && state.cardsThisTurn[who])) {
        drawFor(who, 1);
        addLog('Pilsner Malt: first card this turn — drew 1.', who === 'p' ? 'player' : 'enemy');
      }
      break;

    case '6row':
      // Next card costs 1 less this turn
      state.nextCardDiscount = (state.nextCardDiscount || 0) + 1;
      addLog('6-Row Malt: next card costs 1 less.', 'player');
      break;

    case 'mango':
    case 'flakedwheat': {
      const side = card.id === 'flakedwheat' ? 'hot' : lane;
      const n = buffLaneCards(side, who, 2, c => c.cat === 'hop');
      addLog(`${card.name}: +2 to ${n} hop(s) on ${LANE_NAMES[side]}.`, who === 'p' ? 'player' : 'enemy');
      break;
    }

    case 'pilotbatch':
      drawFor(who, 2);
      addLog('Pilot Batch: drew 2 cards.', 'player');
      break;


    case 'maltodex':
      state.nextCardDiscount = (state.nextCardDiscount || 0) + card.cost;
      addLog('Maltodextrin: next card costs 2 less.', 'player');
      break;

    case 'lactose':
      addLog(`Lactose: removed ${removeRoast(who, 2)} roast token(s).`, 'player');
      break;

    case 'sip':
      if (!removeFirstToken(who, null, 'hot')) addLog('Sanitize: nothing to clean on hot side.', 'sys');
      break;

    case 'fining': {
      removeFirstToken(who);
      const n = buffLaneCards('cold', who, 2, c => c.cat === 'yeast');
      addLog(`Fining Agent: clearer beer — ${n} yeast(s) +2.`, 'player');
      break;
    }

    case 'heatkill': {
      // Kills everything alive: Contamination is gone, yeasts get a burst but stop growing this round
      removeAllTokens(who, 'contamination');
      removeAllTokens(who, 'contam_soft');
      const yeasts = getLaneCards('cold', who).filter(c => c.cat === 'yeast');
      yeasts.forEach(y => { y.points += 5; y._heatKilled = true; });
      addLog(`Heat Kill: Contamination cleared. ${yeasts.length} yeast(s) +5, but they never grow again.`, 'player');
      break;
    }

    case 'cip': {
      let n = 0;
      LANES.forEach(l => {
        const before = state.field[l][who].length;
        state.field[l][who] = state.field[l][who].filter(c => !(c.cat === 'token' && c.points < 0));
        n += before - state.field[l][who].length;
      });
      addLog(`CIP Cycle: removed ${n} negative token(s) from your board.`, 'player');
      break;
    }

    case 'fermlog':
      coldCards.forEach(c => { if (c !== card && c.cat !== 'token' && !c._locked) c.points += 3; });
      addLog('Fermentation Log: +2 pts to all cold side cards.', 'player');
      break;

    case 'coldcrash':  addLagering(who, COLD_CRASH_LAGER, 'Cold Crash'); break;

    case 'acidmalt':   giveAcid(other(who), 2); break;
    case 'kettlesour': giveAcid(other(who), 5); break;
    case 'lacticacid': {
      const a = acidOn(other(who));
      if (a > 0) giveAcid(other(who), a);
      else addLog('Lactic Acid: no Acid to double yet.', 'sys');
      break;
    }
    case 'pedio':
      giveAcid(other(who), 2);
      startCardTargeting('pedio', card, who);
      break;

    // ── Tier 2: Board reading ──

    case 'crystal10':
      LANES.forEach(l => buffLaneCards(l, who, 3, c => c !== card && c.cost <= 1 && c.cat !== 'token'));
      addLog('Crystal 10: +3 to all other cost-1 cards on your board.', 'player');
      break;

    case 'crystal20':
      buffLaneCards('hot', who, 4, c => c !== card && c.cost <= 1 && c.cat !== 'token');
      addLog('Crystal 20: +4 to all cost-1 hot side cards.', 'player');
      break;

    case 'crystal30':
      buffLaneCards('hot', who, 5, c => c.cost <= 1 && c.cat !== 'token');
      addLog('Crystal 30: +5 to all cost-1 hot side cards.', 'player');
      break;

    case 'crystal40': {
      const baseMalts = baseMaltCount(hotCards);
      card.points += baseMalts * 2;
      addLog(`Crystal 40: +${baseMalts * 2} pts (${baseMalts} base malts).`, 'player');
      break;
    }

    case 'crystal50': {
      const baseMaltsOnHot = hotCards.filter(c => BASE_MALT_IDS.includes(c.id) && !c._noMultiplier);
      if (baseMaltsOnHot.length >= 1) {
        const target = baseMaltsOnHot[baseMaltsOnHot.length - 1];
        if (target) {
          target.points *= 2;
          addLog(`Crystal 50: ${target.name} now scores double!`, 'player');
        }
      }
      break;
    }

    case 'crystal60': {
      const baseMalts = baseMaltCount(hotCards);
      card.points += baseMalts * 3;
      addLog(`Crystal 60: +${baseMalts * 3} pts (${baseMalts} base malts).`, 'player');
      break;
    }

    case 'crystal75': {
      const total = hotCards.filter(c => c !== card && c.cat !== 'token').length;
      card.points += total * 4;
      addLog(`Crystal 75: +${total * 4} pts (${total} hot side cards).`, 'player');
      break;
    }

    case 'marisotter': {
      const darkCrystal = hotCards.filter(isDarkOrCrystal).length;
      if (darkCrystal >= 3) {
        card.points += 8;
        addLog(`Maris Otter: 3+ crystal/dark malts — +8 pts!`, 'player');
      }
      break;
    }

    case 'vienna':
      buffLaneCards('hot', who, 2, c => c.cat === 'malt' && c.id !== 'vienna');
      addLog('Vienna Malt: +2 to all other malts on hot side.', 'player');
      break;

    case 'floorpilsner': {
      const hasDarkCrystal = hotCards.some(isDarkOrCrystal);
      if (!hasDarkCrystal) {
        card.points += 10;
        addLog('Floor Malted Pilsner: no dark/crystal malts — +10 pts!', 'player');
      }
      break;
    }

    case 'darkmunich':
      buffLaneCards('hot', who, 4, c => c.id && c.id.startsWith('crystal'));
      addLog('Dark Munich: +4 to all crystal malts on hot side.', 'player');
      break;

    case 'expilsner':
      // Buff hops played AFTER this card
      state.pendingHopBuff = (state.pendingHopBuff || 0) + 2;
      if (isPlayer) state.nextHopDiscount = (state.nextHopDiscount || 0) + 1;
      addLog('Extra Pale Pilsner: your next hop costs 1 less and gets +2 pts.', 'player');
      break;

    case 'expwheat':
      // Buff hops played AFTER this card
      state.pendingHopBuff = (state.pendingHopBuff || 0) + 3;
      addLog('Extra Pale Wheat: your next hop this round gets +3 pts.', 'player');
      break;















    case 'vanilla':
      buffLaneCards('hot', who, 2, c => c !== card && c.tags && c.tags.includes('sweet'));
      buffLaneCards('cold', who, 2, c => c !== card && c.tags && c.tags.includes('sweet'));
      addLog('Vanilla: +2 to all sweet cards on board.', 'player');
      break;

    case 'vanillabn':
      buffLaneCards('hot', who, 3, c => c !== card && c.tags && c.tags.includes('sweet'));
      buffLaneCards('cold', who, 3, c => c !== card && c.tags && c.tags.includes('sweet'));
      addLog('Vanilla Bean: +3 to all sweet cards on board.', 'player');
      break;

    case 'marshm':
      buffLaneCards('hot', who, 2, c => c !== card && c.tags && c.tags.includes('smooth'));
      buffLaneCards('cold', who, 2, c => c !== card && c.tags && c.tags.includes('smooth'));
      addLog('Marshmallow: +2 to all smooth cards this round.', 'player');
      break;

    case 'raspberry': {
      const sweetCount = countOthers('sweet', who, card, 'hot');
      card.points += sweetCount * 2;
      addLog(`Raspberries: +${sweetCount * 2} pts (${sweetCount} sweet cards).`, 'player');
      break;
    }

    case 'cherry': {
      const darkCount = hotCards.filter(c => c.cat === 'malt' && c.tags && c.tags.includes('roasty')).length;
      if (darkCount >= 2) {
        card.points += 8;
        addLog('Cherries: 2+ dark malts — +8 pts!', 'player');
      }
      break;
    }

    case 'passionfr': {
      const n = buffLaneCards('cold', who, 2, c => c.cat === 'hop');
      addLog(`Passion Fruit: +2 to ${n} hop(s) on cold side.`, 'player');
      break;
    }





    case 'maple': {
      const maltyCount = countOthers('malty', who, card, 'hot');
      card.points += maltyCount * 4;
      addLog(`Maple Syrup: +${maltyCount * 4} pts (${maltyCount} malty cards).`, 'player');
      break;
    }

    case 'cinnamon': {
      const sweetCount = countOthers('sweet', who, card, 'hot');
      card.points += sweetCount * 3;
      addLog(`Cinnamon: +${sweetCount * 3} pts (${sweetCount} sweet cards on hot side).`, 'player');
      break;
    }

    case 'chili': {
      // Turn up the heat: the rival's best card loses points
      const opp = isPlayer ? 'e' : 'p';
      const oppCards = LANES.flatMap(l => getLaneCards(l, opp).filter(c => c.cat !== 'token' && !c._locked).map(c => ({ c, l })));
      if (oppCards.length) {
        const best = oppCards.reduce((a, b) => effectivePoints(b.c, b.l, opp) > effectivePoints(a.c, a.l, opp) ? b : a);
        const cut = Math.min(6, Math.max(0, best.c.points));
        best.c.points -= cut;
        addLog(`Chili Pepper: ${isPlayer ? "rival's" : 'your'} ${best.c.name} −${cut} pts. Too hot!`, isPlayer ? 'player' : 'warn');
      } else addLog('Chili Pepper: nothing to scorch.', 'sys');
      break;
    }

    case 'drunkcellar':
      // Adds +8 to OPPONENT's cold side, caster draws 2
      if (isPlayer) {
        state.field.cold.e.push({ id:'drunk_bonus', name:'Drunk Bonus', cat:'token', lane:'cold', points:8, cost:0, tags:[] });
        drawForPlayer(3);
        addLog('Drunk Cellarman: +8 to rival cold side, you draw 3!', 'player');
      } else {
        state.field.cold.p.push({ id:'drunk_bonus', name:'Drunk Bonus', cat:'token', lane:'cold', points:8, cost:0, tags:[] });
        drawCards(3, state.eDeck, state.eHand);
        addLog('Rival plays Drunk Cellarman: +8 to YOUR cold side, rival draws 3!', 'enemy');
      }
      break;

    case 'drunkbrewer':
      // Adds +8 to OPPONENT's hot side, caster draws 2
      if (isPlayer) {
        state.field.hot.e.push({ id:'drunk_bonus', name:'Drunk Bonus', cat:'token', lane:'hot', points:8, cost:0, tags:[] });
        drawForPlayer(3);
        addLog('Drunk Brewer: +8 to rival hot side, you draw 3!', 'player');
      } else {
        state.field.hot.p.push({ id:'drunk_bonus', name:'Drunk Bonus', cat:'token', lane:'hot', points:8, cost:0, tags:[] });
        drawCards(3, state.eDeck, state.eHand);
        addLog('Rival plays Drunk Brewer: +8 to YOUR hot side, rival draws 3!', 'enemy');
      }
      break;

    case 'crosscontam': {
      const opp = who === 'p' ? 'e' : 'p';
      shuffleIntoRemainingDeck(opp, 'contamination');
      shuffleIntoRemainingDeck(opp, 'contamination');
      addLog(`Cross Contamination: 2 Contamination cards into ${isPlayer ? "rival's" : "your"} deck!`, isPlayer ? 'player' : 'enemy');
      break;
    }

    case 'qc': {
      const opp = who === 'p' ? 'e' : 'p';
      if (totalScore(who) > totalScore(opp)) {
        card.points += 14;
        addLog(`Quality Control: ${isPlayer ? "you're" : "rival is"} ahead — +14 pts!`, isPlayer ? 'player' : 'enemy');
      }
      break;
    }





    // ── Belgian adjuncts ──
    case 'candisugarcl': {
      const belgYeasts = getLaneCards('cold', who).filter(c => c.tags && c.tags.includes('belgian')).length;
      card.points += belgYeasts * 3;
      addLog(`Clear Candi Sugar: +${belgYeasts * 3} pts (${belgYeasts} belgian yeasts).`, 'player');
      break;
    }
    case 'candisugarab': {
      const belgYeastsAB = getLaneCards('cold', who).filter(c => c.tags && c.tags.includes('belgian')).length;
      card.points += belgYeastsAB * 4;
      addLog(`Amber Candi Sugar: +${belgYeastsAB * 4} pts.`, 'player');
      break;
    }
    case 'candisugardk': {
      const belgYeastsDK = getLaneCards('cold', who).filter(c => c.tags && c.tags.includes('belgian')).length;
      card.points += belgYeastsDK * 5;
      addLog(`Dark Candi Sugar: +${belgYeastsDK * 5} pts.`, 'player');
      break;
    }
    case 'coriander': {
      const hasBelgYeast = getLaneCards('cold', who).some(c => c.cat === 'yeast' && c.tags && c.tags.includes('belgian'));
      if (hasBelgYeast) { card.points += 8; addLog('Coriander: Belgian yeast present — +8 pts!', 'player'); }
      break;
    }
    case 'orangepeel': {
      const isCB = c => c !== card && c.tags && (c.tags.includes('citrus') || c.tags.includes('belgian'));
      const n = buffLaneCards('hot', who, 2, isCB) + buffLaneCards('cold', who, 2, isCB);
      addLog(`Orange Peel: +2 to ${n} citrus/belgian card(s).`, 'player');
      break;
    }
    case 'grainspara': {
      const belgCount = getAllOnField(who).filter(c => c.tags && c.tags.includes('belgian')).length;
      if (belgCount >= 3) { card.points += 12; addLog('Grains of Paradise: 3+ belgian cards — +12 pts!', 'player'); }
      break;
    }
    case 'cardamom': {
      const sweetCount  = countOthers('sweet', who, card);
      const spicyCount  = countOthers('spicy', who, card);
      card.points += (sweetCount + spicyCount) * 3;
      addLog(`Cardamom: +${sweetCount} sweet, +${spicyCount} spicy cards × 3 = +${(sweetCount + spicyCount) * 3} pts.`, 'player');
      break;
    }
    case 'choc':      addRoastToken(who, 1); break;
    case 'patent':    addRoastToken(who, 2); break;
    case 'palechoc':  addRoastToken(who, 1); break;

    case 'roastedbar': {
      addRoastToken(who, 2);
      if (getRoast(who) >= 3) {
        card.points += 10;
        addLog('Roasted Barley: 3+ roast — +10 pts!', 'player');
      }
      break;
    }

    case 'carafaI':
      addRoastToken(who, 1);
      addLog('Carafa I: roast threshold → ' + raiseRoastThreshold(who), 'player');
      break;

    case 'carafaII':
      addRoastToken(who, 1);
      addLog('Carafa II: roast threshold → ' + raiseRoastThreshold(who), 'player');
      break;

    case 'carafaIII':
      addRoastToken(who, 2);
      addLog('Carafa III: roast threshold → ' + raiseRoastThreshold(who), 'player');
      break;

    case 'blackmalt': {
      addRoastToken(who, 2);
      const idxBM = hotCards.indexOf(card);
      const adjCrystal = [hotCards[idxBM - 1], hotCards[idxBM + 1]]
        .filter(c => c && c.id && c.id.startsWith('crystal') && !c._noMultiplier);
      adjCrystal.forEach(c => { c.points *= 2; });
      if (adjCrystal.length) addLog(`Black Malt: adjacent ${adjCrystal[0].name} doubled!`, 'player');
      break;
    }

    case 'midnightw': {
      const n = buffLaneCards('hot', who, 3, c => c !== card && c.tags && c.tags.includes('roasty') && c.cat !== 'token');
      addLog(`Midnight Wheat: dark color without the roast — +3 to ${n} roasty card(s).`, who === 'p' ? 'player' : 'enemy');
      break;
    }

    case 'debittered':
      if (removeRoast(who, 1)) addLog('De-bittered Black: removed 1 roast. Total: ' + getRoast(who), 'player');
      break;

    case 'smokedmalt':
      addRoastToken(who, 1);
      buffLaneCards('hot', who, 2, c => c !== card && c.tags && c.tags.includes('roasty'));
      addLog('Smoked Malt: +2 to all roasty cards.', 'player');
      break;

    case 'cacaonibs': {
      addRoastToken(who, 1);
      const hasChoc = getLaneCards('hot', who).some(c => c.id === 'choc');
      if (hasChoc) { card.points *= 2; addLog('Cacao Nibs: Chocolate Malt present — doubled!', 'player'); }
      break;
    }

    case 'coldbrewcof':
      addRoastToken(who, 1);
      addLog('Cold Brew Coffee: roast threshold → ' + raiseRoastThreshold(who), 'player');
      break;

    case 'crystal80': {
      const roast80 = getRoast(who);
      card.points = roast80 * 8 + (card.points - getCardDef('crystal80').points);
      addLog(`Crystal 80: ${roast80} roast × 8 = ${card.points} pts!`, 'player');
      break;
    }

    case 'specialb': {
      // Special B: a safer roast payoff (base 6). Crystal 80 is the bigger swing.
      const roastSB = getRoast(who);
      card.points += roastSB * 6;
      addLog(`Special B: 6 + ${roastSB} roast × 6 = ${card.points} pts!`, 'player');
      break;
    }

    // ── Malts: specialty ──

    case 'carapils': {
      const hotList = getLaneCards('hot', who);
      const idx = hotList.indexOf(card);
      const neighbors = [hotList[idx-1], hotList[idx+1]].filter(Boolean);
      neighbors.forEach(n => { if (n.cat !== 'token' && !n._locked) n.points += 3; });
      if (neighbors.length) addLog(`Carapils: +3 to ${neighbors.length} adjacent card(s).`, 'player');
      break;
    }

    case 'melanoidin': {
      const discardCount = (who === 'p' ? state.pDiscard : state.eDiscard)
        .filter(c => c.id === 'melanoidin').length;
      if (discardCount > 0) {
        card.points *= (discardCount + 1);
        card._locked = true;
        addLog(`Melanoidin: ${discardCount} in discard — score x${discardCount+1}! Value locked.`, 'player');
      }
      break;
    }

    case 'aromatic': {
      // Re-runs the last malt's on-play effect as if Aromatic were that malt.
      // Self-buffs land on Aromatic; board effects hit the board again.
      const AROMATIC_BLOCKED = new Set(['crystal80','crystal120','specialb','melanoidin','biscuit','victory']);
      const prev = state.lastMalt && state.lastMalt[who];
      if (!prev) {
        addLog('Aromatic Malt: no malt played yet this round.', 'sys');
      } else if (AROMATIC_BLOCKED.has(prev.id)) {
        addLog(`Aromatic Malt: ${prev.name}'s effect can't be copied.`, 'sys');
      } else {
        addLog(`Aromatic Malt: copying ${prev.name}...`, 'player');
        const realId = card.id, realCost = card.cost;
        card.id = prev.id; card.cost = prev.cost;
        applyCardEffect(card, lane, who);
        card.id = realId; card.cost = realCost;
      }
      break;
    }

    case 'biscuit': {
      // Immune to multipliers, scores base × row count
      const rowCount = getLaneCards('hot', who).filter(c => c.cat !== 'token').length;
      const baseDef  = getCardDef('biscuit');
      const basePts  = baseDef ? baseDef.points : 3;
      const earned   = card.points - basePts;          // upgrades, aging, act bonus
      card.points    = basePts * rowCount + earned;
      card._noMultiplier = true;
      addLog(`Biscuit Malt: ${rowCount} cards in hot side row — ${card.points} pts!`, 'player');
      break;
    }

    case 'victory':
      // Run growth handled in endRound / onBattleWin (+VICTORY_GROWTH if you win the battle)
      if (isPlayer) addLog(`Victory Malt: win this battle and it grows +${VICTORY_GROWTH} for the rest of the run!`, 'player');
      break;

    case 'crystal120':
      // You choose a crystal malt on your hot side; it's absorbed for double its points
      startCardTargeting('crystal120', card, who);
      break;

    case 'oats': {
      const oatHot = getLaneCards('hot', who);
      const oatIdx = oatHot.indexOf(card);
      const darkNeighbors = [oatHot[oatIdx-1], oatHot[oatIdx+1]]
        .filter(n => n && n.tags && n.tags.includes('roasty') && !n._noMultiplier);
      darkNeighbors.forEach(n => { n.points *= 2; });
      if (darkNeighbors.length) addLog(`Flaked Oats: doubled adjacent dark malt!`, 'player');
      break;
    }

    case 'coffee': {
      const darkMalts = getLaneCards('hot', who).filter(c => c.tags && c.tags.includes('roasty') && c.cat === 'malt' && !c._noMultiplier);
      darkMalts.forEach(c => { c.points *= 2; });
      addLog(`Coffee Beans: doubled ${darkMalts.length} dark malt(s)!`, 'player');
      break;
    }

    case 'blueberry': {
      // Double if last card played was a crystal malt
      if (state.lastPlayedCard && state.lastPlayedCard.id && state.lastPlayedCard.id.startsWith('crystal')) {
        card.points *= 2;
        addLog('Blueberry: played after crystal malt — doubled!', 'player');
      }
      break;
    }

    case 'bloodorange': {
      const hasCitrusHop = getLaneCards('cold', who).some(c => c.tags && c.tags.includes('citrus'));
      if (hasCitrusHop) {
        card.points += 6;
        addLog('Blood Orange: citrus hop on cold side — +6 pts!', 'player');
      }
      break;
    }

    case 'honey': {
      // Free-if-first is handled in getEffectiveCost
      const floral = allMine.filter(c => c !== card && c.tags && c.tags.includes('floral')).length;
      card.points += floral * 3;
      addLog(`Honey: +${floral * 3} pts (${floral} floral cards).`, 'player');
      break;
    }

    case 'flakedrye':
      state.nextYeastDiscount = (state.nextYeastDiscount || 0) + 1;
      addLog('Flaked Rye: next yeast card costs 1 less.', 'player');
      break;

    case 'flakedcorn': {
      const neutralCount = countTag('neutral', who);
      if (neutralCount >= 3) {
        card.points += 10;
        addLog('Flaked Corn: 3+ neutral cards — +10 pts!', 'player');
      }
      break;
    }

    case 'ricehulls':
      if (isPlayer) state.nextCardDiscount = (state.nextCardDiscount || 0) + 1;
      if (isMashStuck(who)) { removeAllTokens(who, 'stuckmash'); addLog('Rice Hulls: stuck mash freed!', 'player'); }
      addLog('Rice Hulls: next card costs 1 less.', 'player');
      break;

    case 'buckwheat': {
      const nuancedCount = countTag('nuanced', who);
      if (nuancedCount >= 2) {
        drawFor(who, 1);
        addLog('Buckwheat: 2+ nuanced cards — drew 1 card!', 'player');
      }
      break;
    }

    case 'citrazest':
      if (isPlayer) state.nextHopFree = true;
      addLog('Grapefruit Zest: your next hop costs 0.', 'player');
      break;

    case 'toastedcoc': {
      const hasSweet  = countOthers('sweet', who, card, 'hot') > 0;
      const hasToasty = countOthers('toasty', who, card, 'hot') > 0;
      if (hasSweet && hasToasty) {
        card.points += 8;
        addLog('Toasted Coconut: sweet + toasty both present — +8 pts!', 'player');
      }
      break;
    }

    case 'spelt':
      // Nuanced synergy handled by applyNuancedSynergy
      break;

    // ── Process: Disruption ──

    case 'filtration': {
      // Destroy every negative card on your cold side, then pull a yeast back to pitch again
      const before = state.field.cold[who].length;
      state.field.cold[who] = state.field.cold[who].filter(c => !(c.cat === 'token' && c.points < 0));
      const gone = before - state.field.cold[who].length;
      if (gone) addLog(`Filtration: filtered out ${gone} negative card(s).`, 'player');
      startCardTargeting('filtration', card, who);
      break;
    }

    case 'hopthief': {
      // Copy highest scoring hop from enemy board
      const oppHops = getAllOnField(isPlayer ? 'e' : 'p').filter(c => c.cat === 'hop');
      if (oppHops.length > 0) {
        const best = oppHops.reduce((a, b) => a.points > b.points ? a : b);
        const copy = { ...getCardDef(best.id) || best };
        (isPlayer ? state.pHand : state.eHand).push(copy);
        addLog(`Hop Thief: copied ${best.name} from ${isPlayer ? "rival's" : 'your'} board!`, isPlayer ? 'player' : 'enemy');
      } else {
        addLog('Hop Thief: no hops to steal.', 'player');
      }
      break;
    }

    case 'badbatch': {
      const opp = who === 'p' ? 'e' : 'p';
      const oppHot = getLaneCards('hot', opp);
      if (oppHot.length > 0) {
        const bestIdx = oppHot.reduce((bi, c, i) => effectivePoints(c, 'hot', opp) > effectivePoints(oppHot[bi], 'hot', opp) ? i : bi, 0);
        const removedPts = effectivePoints(oppHot[bestIdx], 'hot', opp);
        const removed = oppHot.splice(bestIdx, 1)[0];
        addLog(`Bad Batch: removed ${isPlayer ? "rival's" : "your"} ${removed.name} (+${removedPts})!`, isPlayer ? 'player' : 'warn');
      } else {
        addLog(`Bad Batch: ${isPlayer ? 'rival' : 'your'} hot side is empty.`, 'sys');
      }
      break;
    }

    case 'inspector': {
      const opp = who === 'p' ? 'e' : 'p';
      const allOpp = [...getLaneCards('hot', opp), ...getLaneCards('cold', opp)];
      if (allOpp.length > 0) {
        // "Highest scoring" means what it actually scores, synergies included
        const scoreOf = c => effectivePoints(c, getLaneCards('hot', opp).includes(c) ? 'hot' : 'cold', opp);
        const best = allOpp.reduce((a, b) => scoreOf(a) >= scoreOf(b) ? a : b);
        ['hot', 'cold'].forEach(l => {
          const idx = state.field[l][opp].indexOf(best);
          if (idx >= 0) state.field[l][opp].splice(idx, 1);
        });
        addLog(`Health Inspector: removed ${isPlayer ? "rival's" : "your"} ${best.name} (+${scoreOf(best)})!`, isPlayer ? 'player' : 'warn');
      }
      break;
    }

    case 'dryhop':
      // You choose a hop on your hot side; it moves to the cold side with +DRY_HOP_BONUS
      startCardTargeting('dryhop', card, who);
      break;

    case 'kettletrans': {
      // Whirlpool: every hop on your hot side gets +3
      const n = buffLaneCards('hot', who, 2, c => c.cat === 'hop');
      addLog(`Whirlpool: +2 to ${n} hop(s) on hot side.`, 'player');
      break;
    }

    case 'doublebatch': {
      // Copy the last card played onto the same lane
      if (state.lastPlayedCard && state.lastPlayedCard.cat === 'process') {
        addLog("Double Batch: can't copy a process card.", 'sys');
      } else if (state.lastPlayedCard && state.lastPlayedLane) {
        const copy = { ...state.lastPlayedCard };
        delete copy._basePoints; delete copy._deckIdx;
        state.field[state.lastPlayedLane][who].push(copy);
        addLog(`Double Batch: copied ${copy.name} to ${LANE_NAMES[state.lastPlayedLane]}!`, 'player');
      } else {
        addLog('Double Batch: no previous card to copy.', 'player');
      }
      break;
    }

    case 'barreltrans': {
      // Best cold side card gets +50%
      const coldCards2 = getLaneCards('cold', who).filter(c => c.cat !== 'token' && c !== card);
      if (coldCards2.length > 0) {
        const best2 = coldCards2.reduce((a, b) => effectivePoints(a, 'cold', who) >= effectivePoints(b, 'cold', who) ? a : b);
        const oaky   = best2.tags && best2.tags.includes('oaky');
        const bonus  = Math.floor(best2.points * (oaky ? 1 : 0.5));
        best2.points += bonus;
        addLog(`Barrel Transfer: ${best2.name} gets +${bonus} pts (${oaky ? '+100%, oaky' : '+50%'})!`, 'player');
      }
      break;
    }

    case 'recipetweak':
      // You choose any card on your board to return to hand (reset); next card costs 1 less
      startCardTargeting('recipetweak', card, who);
      break;

    case 'tasting':
      // Show enemy hand in log
      if (isPlayer) {
        const eHandStr = state.eHand.map(c => `${c.name}(${c.points})`).join(', ');
        addLog(`Tasting Notes: rival's hand — ${eHandStr || 'empty'}`, 'player');
      }
      break;

    case 'award':
      if (isPlayer) addLog(`Award Entry: win this battle for +${AWARD_GOLD} gold!`, 'player');
      break;

    case 'grainreview':
      grainBillReview(who);
      break;


    case 'cascade':
    case 'centennial':
      // C-hop synergy handled by applyCHopSynergy in battle.js
      break;
















    case '2row':
    case 'goldenprom':
    case 'munich':
    case 'paleale':
    case 'heritage':
    case 'caramun':
      // Flat score cards — no effect needed
      break;


    // ══ SPENT GRAIN ══
    case 'grainout':       startGrainOut(card, who);     break;
    case 'trubdump':       startTrubDump(card, who);     break;
    case 'yeastharvest':   startYeastHarvest(card, who); break;
    case 'secondrunnings': secondRunnings(card, who);    break;

    case 'spentbread': {
      const n = discardOf(who).filter(c => c.cat !== 'token').length;
      card.points += n * 2;
      addLog(`Spent Grain Bread: +${n * 2} pts (${n} cards in discard).`, 'player');
      break;
    }

    case 'solera': {
      const n = discardOf(who).filter(c => c.cat !== 'token').length;
      card.points += n * 2;
      addLog(`Solera: +${n * 2} pts (${n} cards in discard).`, 'player');
      break;
    }

    case 'peatmalt': {
      const opp = isPlayer ? 'e' : 'p';
      addRoastToken(opp, 2);
      addLog(`Peated Malt: smoke drifts over — ${isPlayer ? 'rival' : 'you'} +2 roast!`, isPlayer ? 'player' : 'warn');
      break;
    }

    // ══ FLAVOUR PAYOFFS ══
    case 'brownmalt': {
      const n = countOthers('toasty', who, card, 'hot');
      card.points += n * 3;
      addLog(`Brown Malt: +${n * 3} pts (${n} toasty cards).`, 'player');
      break;
    }

    case 'honeymalt': {
      const n = countOthers('bitter', who, card);
      card.points += n * 3;
      addLog(`Honey Malt: +${n * 3} pts (${n} bitter cards balanced).`, 'player');
      break;
    }

    case 'ryemalt': {
      const n = countOthers('bready', who, card, 'hot');
      card.points += n * 3;
      addLog(`Rye Malt: +${n * 3} pts (${n} bready cards).`, 'player');
      break;
    }

    case 'fuggle': {
      const n = countOthers('earthy', who, card);
      card.points += n * 3;
      addLog(`Fuggle: +${n * 3} pts (${n} earthy cards).`, 'player');
      break;
    }

    case 'summit': {
      const n = allMine.filter(c => c !== card && c.tags && (c.tags.includes('piney') || c.tags.includes('dank'))).length;
      card.points += n * 3;
      addLog(`Summit: +${n * 3} pts (${n} piney/dank cards).`, 'player');
      break;
    }

    case 'elderflower': {
      const n = countOthers('floral', who, card);
      card.points += n * 3;
      addLog(`Elderflower: +${n * 3} pts (${n} floral cards).`, 'player');
      break;
    }

    case 'brutenzyme': {
      const isDry = c => c !== card && c.tags && c.tags.includes('dry');
      const n = buffLaneCards('hot', who, 3, isDry) + buffLaneCards('cold', who, 3, isDry);
      addLog(`Brut Enzyme: +3 to ${n} dry card(s).`, 'player');
      break;
    }

    case 'flakedrice': {
      const n = hotCards.filter(c => c !== card && c.tags && (c.tags.includes('neutral') || c.tags.includes('crisp'))).length;
      card.points += n * 2;
      addLog(`Flaked Rice: +${n * 2} pts (${n} neutral/crisp cards).`, 'player');
      break;
    }

    case 'yeastnutrient': {
      const n = buffLaneCards('cold', who, 3, c => c.cat === 'yeast');
      addLog(`Yeast Nutrient: +3 to ${n} yeast(s).`, 'player');
      break;
    }

    case 'oakfoeder': {
      const wild = c => c !== card && c.tags && (c.tags.includes('funky') || c.tags.includes('sour'));
      const n = buffLaneCards('cold', who, 5, wild);
      addLog(`Oak Foeder: +5 to ${n} funky/sour card(s).`, 'player');
      break;
    }

    // ══ HOPS ══

    // Noble & European
    case 'saaz': {
      const hasPils = hotCards.some(c => c.id === 'pilsner' || c.id === 'expilsner' || c.id === 'floorpilsner');
      if (hasPils) { card.points += 8; addLog('Saaz: Pilsner malt on hot side — +8 pts!', 'player'); }
      break;
    }

    case 'hallertau':
      if (getRoast(who) === 0) { card.points += 6; addLog('Hallertau Mittelfrüh: no roast — +6 pts!', 'player'); }
      break;

    case 'tettnang': {
      const crisp = countTag('crisp', who);
      card.points += crisp * 2;
      addLog(`Tettnang: +${crisp * 2} pts (${crisp} crisp cards).`, 'player');
      break;
    }

    case 'hallblanc': {
      const noble = countTag('noble', who);
      card.points += noble * 3;
      addLog(`Hallertau Blanc: +${noble * 3} pts (${noble} noble hops).`, 'player');
      if (lane === 'cold') applyDryHopBonus(card, who);
      break;
    }

    case 'ekg':
      if (hotCards.some(c => c.tags && c.tags.includes('biscuity'))) {
        card.points += 8;
        addLog('East Kent Goldings: biscuity malt on hot side — +8 pts!', 'player');
      }
      break;

    // Bittering
    case 'magnum': {
      const others = allMine.filter(c => c.cat === 'hop' && c !== card);
      others.forEach(h => { if (!h._locked) h.points += 2; });
      addLog(`Magnum: +2 to ${others.length} other hop(s).`, 'player');
      break;
    }

    // West Coast
    case 'cascade':
    case 'centennial':
      // C-hop doubling handled by applyCHopSynergy in battle.js
      break;

    case 'chinook':
      if (lane === 'hot') { card.points += 4; addLog('Chinook: boil addition — +4 pts!', 'player'); }
      break;

    case 'columbus':
      addRoastToken(isPlayer ? 'e' : 'p', 1);
      addLog(`Columbus: +1 roast token to ${isPlayer ? 'rival' : 'you'}!`, isPlayer ? 'player' : 'enemy');
      break;

    case 'simcoe':
      drawFor(who, 1);
      addLog('Simcoe: drew 1 card.', who === 'p' ? 'player' : 'enemy');
      break;

    // Modern American
    case 'citra':
      drawFor(who, 1);
      addLog('Citra: drew 1 card.', 'player');
      break;

    case 'mosaic': {
      const varieties = new Set(allMine.filter(c => c !== card && c.cat === 'hop').map(c => c.id)).size;
      card.points += varieties * 2;
      addLog(`Mosaic: +${varieties * 2} pts (${varieties} hop varieties).`, 'player');
      break;
    }

    case 'idaho7': {
      const others = allMine.filter(c => c !== card);
      const hasTropical = others.some(c => c.tags && c.tags.includes('tropical'));
      const hasPiney    = others.some(c => c.tags && c.tags.includes('piney'));
      if (hasTropical && hasPiney) {
        card.points += 6;
        addLog('Idaho 7: tropical + piney on board — +6 pts!', 'player');
      }
      break;
    }

    case 'strata': {
      const n = allMine.filter(c => c !== card && c.tags && (c.tags.includes('dank') || c.tags.includes('tropical'))).length;
      card.points += n * 3;
      addLog(`Strata: +${n * 3} pts (${n} dank/tropical cards).`, 'player');
      break;
    }

    case 'talus':
      if (lane === 'cold') applyDryHopBonus(card, who);
      break;

    case 'sabro':
      buffLaneCards('hot', who, 2, c => c !== card && c.tags && c.tags.includes('smooth'));
      buffLaneCards('cold', who, 2, c => c !== card && c.tags && c.tags.includes('smooth'));
      addLog('Sabro: +2 to all smooth cards.', 'player');
      break;

    case 'eldorado': {
      const sweetAdj = hotCards.filter(c => c.cat === 'adjunct' && c.tags && c.tags.includes('sweet')).length;
      card.points += sweetAdj * 2;
      addLog(`El Dorado: +${sweetAdj * 2} pts (${sweetAdj} sweet adjuncts).`, 'player');
      break;
    }

    case 'amarillo': {
      const fruityAdj = hotCards.filter(c => c.cat === 'adjunct' && c.tags && c.tags.includes('fruity')).length;
      card.points += fruityAdj * 2;
      addLog(`Amarillo: +${fruityAdj * 2} pts (${fruityAdj} fruity adjuncts).`, 'player');
      break;
    }

    // Southern Hemisphere
    case 'galaxy':
      if (countTag('hazy', who) >= 2) { card.points += 8; addLog('Galaxy: 2+ hazy cards — +8 pts!', 'player'); }
      break;

    case 'nelson':
      // Nuanced handled by applyNuancedSynergy, thiol by applyThiolOnPlay
      break;

    case 'motueka': {
      const citrus = countOthers('citrus', who, card);
      card.points += citrus * 2;
      addLog(`Motueka: +${citrus * 2} pts (${citrus} citrus cards).`, 'player');
      break;
    }

    case 'nectaron': {
      const nz = allMine.filter(c => NZ_HOPS.includes(c.id) && c !== card).length;
      card.points += nz * 3;
      addLog(`Nectaron: +${nz * 3} pts (${nz} other NZ hops).`, 'player');
      break;
    }

    case 'riwaka':
      if (lane === 'cold') applyDryHopBonus(card, who);
      break;

    // Hop products
    case 'cryo':
      copyLastHopFlavor(card, who);
      if (isPlayer) state.nextHopDiscount = (state.nextHopDiscount || 0) + 1;
      addLog('Cryo Hops: next hop costs 1 less.', 'player');
      break;

    case 'hopoil': {
      copyLastHopFlavor(card, who);
      const n = buffLaneCards('cold', who, 3, c => c.cat === 'hop' && c !== card);
      addLog(`Hop Oil: +3 to ${n} hop(s) on cold side.`, 'player');
      break;
    }

    // ══ YEAST ══

    // Clean ale
    case 'chico': {
      const hops  = countCat('hop', who);
      const bases = baseMaltCount(hotCards);
      card.points += hops + bases;
      addLog(`Cal Ale: +${hops + bases} (hops + base malts).`, 'player');
      break;
    }

    case 'barbarian': {
      const hops = countCat('hop', who);
      card.points += hops * 2;
      addLog(`Barbarian: +${hops * 2} pts (${hops} hops).`, 'player');
      break;
    }

    case 'london3': {
      const n = buffLaneCards('cold', who, 3, c => c.cat === 'hop');
      const hazy = countTag('hazy', who) - 1; // don't count itself
      card.points += hazy * 2;
      addLog(`London Ale III: biotransformed ${n} cold side hop(s) +3, +${hazy * 2} from hazy cards.`, 'player');
      break;
    }

    case 'englishale': {
      const n = allMine.filter(c => c !== card && c.tags && (c.tags.includes('biscuity') || c.tags.includes('malty') || c.tags.includes('earthy'))).length;
      card.points += n * 3;
      addLog(`English Ale: +${n * 3} pts (${n} biscuity/malty/earthy cards).`, 'player');
      break;
    }

    case 'kveik': {
      const hops = countCat('hop', who);
      card.points += hops * 2;
      addLog(`Voss Kveik: +${hops * 2} pts (${hops} hops).`, 'player');
      break;
    }

    // Lager & hybrid
    case 'w3470': {
      const noble = countTag('noble', who);
      card.points += noble * 2;
      const hot = hotCards.filter(c => c.cat !== 'token');
      const clean = hot.length > 0 && hot.every(c => c.cost <= 2);
      if (clean) card.points += 10;
      addLog(`W-34/70: +${noble * 2} from noble hops${clean ? ' +10 clean grist bonus!' : '.'}`, 'player');
      break;
    }

    case 'czechlager': {
      const hops = countCat('hop', who);
      card.points += hops;
      const classic = allMine.some(c => c.id === 'saaz' || c.id === 'pilsner' || c.id === 'expilsner' || c.id === 'floorpilsner');
      if (classic) card.points += 8;
      addLog(`Czech Pils Lager: +${hops} from hops${classic ? ' +8 Saaz/Pilsner bonus!' : '.'}`, 'player');
      break;
    }

    case 'kolsch': {
      const hops = countCat('hop', who);
      card.points += hops;
      const noRoast = getRoast(who) === 0;
      if (noRoast) card.points += 8;
      addLog(`Kölsch: +${hops} from hops${noRoast ? ' +8 no-roast bonus!' : '.'}`, 'player');
      break;
    }

    // Belgian & wheat
    case 'abbey': {
      const belg  = hotCards.filter(c => c.tags && c.tags.includes('belgian')).length;
      const sweet = countTag('sweet', who, 'hot');
      card.points += belg * 3 + sweet * 2;
      addLog(`Abbey Ale: +${belg * 3} belgian, +${sweet * 2} sweet.`, 'player');
      break;
    }

    case 'saison': {
      const n = allMine.filter(c => c !== card && c.tags && ['belgian','spicy','dry'].some(t => c.tags.includes(t))).length;
      card.points += n * 2;
      addLog(`Saison: +${n * 2} pts (${n} belgian/spicy/dry cards).`, 'player');
      break;
    }

    case 'hefeweizen': {
      const bready = allMine.filter(c => c !== card && c.tags && ['bready','fruity','spicy'].some(t => c.tags.includes(t))).length;
      card.points += bready * 3;
      addLog(`Hefeweizen: +${bready * 3} pts (${bready} bready/fruity/spicy cards).`, 'player');
      break;
    }

    // Wild & sour
    case 'brett': {
      const sweet = countTag('sweet', who, 'hot');
      card.points += sweet * 3;
      addLog(`Brettanomyces: ate the residual sugar — +${sweet * 3} pts.`, 'player');
      break;
    }

    case 'lacto': {
      // Hops hold Lactobacillus back
      const hotHops = getLaneCards('hot', who).filter(c => c.cat === 'hop').length;
      const acid    = Math.max(0, 4 - hotHops);
      if (acid) giveAcid(other(who), acid);
      else addLog('Lactobacillus: too many hops — no Acid.', 'warn');
      break;
    }

    // Engineered strains
    case 'sourvisiae': {
      const fruity = allMine.filter(c => c.tags && (c.tags.includes('fruity') || c.tags.includes('tropical'))).length;
      card.points += fruity * 2;
      giveAcid(other(who), 2);
      addLog(`Sourvisiae: +${fruity * 2} from fruit.`, isPlayer ? 'player' : 'enemy');
      break;
    }

    case 'cosmicpunch': {
      const coldHops = getLaneCards('cold', who).filter(c => c.cat === 'hop').length;
      card.points += coldHops * 2;
      const freed = allMine.filter(c => c !== card && c.tags && c.tags.includes('thiol') && !c._thiolReleased);
      freed.forEach(c => releaseThiol(c));
      addLog(`Cosmic Punch: released thiols from ${freed.length} card(s)!`, 'player');
      break;
    }

    case 'phantasm':
      // Handled by applyThiolOnPlay
      break;

    // ── Tokens: on-play effects ──


    default:
      break;
  }
}

// ── Nuanced synergy ──
// Called after any nuanced card is played.
// All nuanced cards on the board multiply each other's base score.

// ── Live synergy multipliers ──
// C-hop doubling and nuanced multiplication are NOT baked into a card's points.
// They're worked out whenever the board is scored, so:
//   • flat buffs added later (Haze, Magnum, Whirlpool...) are kept and multiplied too
//   • if a partner card is removed, the multiplier drops back down
function synergyMultiplier(c, lane, who) {
  if (c.cat === 'token' || c._noMultiplier || !c.tags) return 1;
  let m = 1;
  if (c.tags.includes('c-hop')) {
    const cHops = getLaneCards(lane, who).filter(x => x.tags && x.tags.includes('c-hop')).length;
    if (cHops >= 2) m *= CHOP_MULT;
  }
  if (c.tags.includes('nuanced')) {
    const nuanced = getAllOnField(who).filter(x => x.cat !== 'token' && x.tags && x.tags.includes('nuanced')).length;
    if (nuanced >= 2) m *= NUANCED_MULT;
  }
  return m;
}

const CHOP_MULT    = 1.5;   // c-hops sharing a side
const NUANCED_MULT = 2;     // two or more nuanced cards on your board

// ── Roast power ──
// Every roast token you hold (safe roast included) gives each of your roasty cards
// +ROAST_POWER. Push toward your roast limit for big dark beers, but reach it and
// your beer is Burnt: the hot side scores half.
const ROAST_POWER = 2;

function roastBonus(c, who) {
  return c.tags && c.tags.includes('roasty') && c.cat !== 'token' ? ROAST_POWER * getRoast(who) : 0;
}

function isBurnt(who) {
  const k = roastKeys(who);
  return (state[k.t] || 0) - (state[k.s] || 0) >= (state[k.th] || 5);
}

// A card's "printed" points for this run: card + upgrades + barrel aging (not battle buffs)
function printedPoints(c) {
  const d = getCardDef(c.id);
  if (!d) return c.points;
  return d.points + (c._upgraded ? (c._upgradeBonus || REST_UPGRADE) : 0) + (c._barrelAged ? BARREL_BONUS : 0)
       + (c._victoryBonus || 0);
}

// Synergy multiplies the card's printed points only. Bonuses gained in battle
// (Haze, Magnum, Whirlpool...) are added once, so they can't snowball.
const other = who => (who === 'p' ? 'e' : 'p');

// ── Lagering ──
// Budget you don't spend by the end of your turn becomes Lagering (up to LAGER_MAX).
// The next crisp card you play gets +LAGER_POWER per Lagering, and that empties it.
const LAGER_POWER      = 3;
const LAGER_MAX        = 10;
const COLD_CRASH_LAGER = 3;

const isCrisp = c => c && c.cat !== 'token' && c.tags && c.tags.includes('crisp');
function lagering(who) { return (state.lager && state.lager[who]) || 0; }
function lagerPower(who) {
  return LAGER_POWER + (who === 'p' && typeof activeBrewery === 'function' && activeBrewery() === 'lagerhaus' ? 1 : 0);
}

function addLagering(who, n, source) {
  if (!n || n <= 0) return;
  state.lager = state.lager || { p: 0, e: 0 };
  const before = state.lager[who];
  state.lager[who] = Math.min(LAGER_MAX, before + n);
  if (state.lager[who] > before) {
    addLog(`🧊 ${source ? source + ': ' : ''}${who === 'p' ? 'Lagering' : 'Rival Lagering'} ${state.lager[who]} — next crisp card +${state.lager[who] * lagerPower(who)}.`, who === 'p' ? 'player' : 'enemy');
  }
}

// Called when a card is played: a crisp card drinks the whole tank
function consumeLagering(c, who) {
  const n = lagering(who);
  if (!n || !isCrisp(c)) return;
  const bonus = n * lagerPower(who);
  c.points += bonus;
  state.lager[who] = 0;
  addLog(`🧊 ${c.name} was lagering: +${bonus}!`, who === 'p' ? 'player' : 'enemy');
  if (who === 'p' && typeof juiceBanner === 'function') juiceBanner(`🧊 LAGERED +${bonus}`, 'gold', 1100);
}


// ── Acidity ──
// Acid sits on a brewery (state.acid.p = Acid on YOU). At the start of each turn their
// best lane loses points equal to their Acid (an Acid Burn token), then Acid drops by 1.
function acidOn(who) { return (state.acid && state.acid[who]) || 0; }

function giveAcid(victim, n) {
  if (!n || n <= 0) return;
  state.acid = state.acid || { p: 0, e: 0 };
  state.acid[victim] += n;
  addLog(`🍋 ${victim === 'e' ? 'Rival' : 'You'} +${n} Acid (now ${state.acid[victim]}).`, victim === 'e' ? 'player' : 'enemy');
}

// Total points the Acid on `who` will still eat this round
function acidFutureDamage(who, turnsLeft) {
  let a = acidOn(who), dmg = 0;
  for (let t = 0; t < turnsLeft && a > 0; t++, a--) dmg += a;
  return dmg;
}

function tickAcid(who) {
  const a = acidOn(who);
  if (a <= 0) return;
  const lane = laneScore('hot', who) >= laneScore('cold', who) ? 'hot' : 'cold';
  let burn = state.field[lane][who].find(c => c.id === 'acidburn');
  if (!burn) { burn = createToken('acidburn'); state.field[lane][who].push(burn); }
  burn.points -= a;
  state.acid[who] = a - 1;
  addLog(`🍋 Acid eats ${a} from ${who === 'p' ? 'your' : "the rival's"} ${LANE_NAMES[lane].toLowerCase()} (Acid now ${a - 1}).`, who === 'p' ? 'warn' : 'player');
}

// Fruit Pediococcus can eat
const isFruit = c => c.cat === 'adjunct' && c.tags && (c.tags.includes('fruity') || c.tags.includes('tropical'));

function effectivePoints(c, lane, who) {
  const roast = roastBonus(c, who);
  const m = synergyMultiplier(c, lane, who);
  if (m === 1) return c.points + roast;
  const base = Math.max(0, Math.min(printedPoints(c), c.points));
  return Math.floor(c.points + base * (m - 1)) + roast;
}

// These just announce the synergy; the math lives in synergyMultiplier
function applyNuancedSynergy(who) {
  const n = getAllOnField(who).filter(c => c.cat !== 'token' && c.tags && c.tags.includes('nuanced')).length;
  if (n < 2) return;
  addLog(`Nuanced synergy! ${n} nuanced cards — each scores double its printed points.`, who === 'p' ? 'player' : 'enemy');
}

function applyCHopSynergy(lane, who) {
  const n = getLaneCards(lane, who).filter(c => c.tags && c.tags.includes('c-hop')).length;
  if (n < 2) return;
  addLog(`C-Hop synergy! ${n} c-hops on ${LANE_NAMES[lane]} — each scores +50%.`, who === 'p' ? 'player' : 'enemy');
}

// ── Per-turn persistent effects ──
// Called at the start of each turn in advanceTurn()

function applyTurnEffects(who) {
  const coldCards = getLaneCards('cold', who);
  const isPlayer  = who === 'p';
  const NO_ACCUMULATION = ['kveik'];

  coldCards.forEach(c => {
    if (c.cat !== 'yeast' || NO_ACCUMULATION.includes(c.id)) return;
    if (c._heatKilled) return;                                 // Heat Kill

    if (c.id === 'brett') {
      c.points += 3 + (isPlayer && hasRelic('glycol') && state.turn % 2 === 0 ? 1 : 0);
      if (Math.random() < 0.5) {
        if (isPlayer) addLog('Brettanomyces: +3 pts — and it got loose in the cellar...', 'warn');
        shuffleIntoRemainingDeck(who, 'contamination');
      } else if (isPlayer) {
        addLog('Brettanomyces: +3 pts (accumulating).', 'player');
      }
      return;
    }

    // Glycol Chiller: +1 extra on even turns
    const chill = isPlayer ? (hasRelic('glycol') && state.turn % 2 === 0 ? 1 : 0)
                           : (state.rivalTrait === 'patience' ? 2 : 0);
    c.points += 2 + chill;
    if (isPlayer) addLog(`${c.name}: +${2 + chill} pts (accumulating).`, 'player');
  });
}

// ── Contamination auto-play check ──
// Called at start of player's turn — if a contamination card is in hand, auto-play it

// A clean yeast (or the Lab Microscope) outcompetes Contamination when it lands
function softenContamination(c, who) {
  if (c.id !== 'contamination') return c;
  const cleanYeast = getLaneCards('cold', who).some(y => y.cat === 'yeast' && y.tags && y.tags.includes('clean'))
                  || (who === 'p' && hasRelic('microscope'))
                  || (who === 'p' && activeBrewery() === 'wildcellar');   // Wild Cellar passive
  if (!cleanYeast) return c;
  addLog('A clean yeast outcompetes the Contamination — softened to −5.', who === 'p' ? 'player' : 'enemy');
  return createToken('contam_soft');
}

function isContamination(c) {
  return c && (c.id === 'contamination' || c.id === 'contam_soft');
}

// The player must pour Contamination from their hand before doing anything else
function playerMustPlayContamination() {
  return state.pHand.some(isContamination);
}

// The rival auto-plays any Contamination it draws. The player's stays in hand (see battle.js).
function checkContaminationInHand(who = 'p') {
  if (who === 'p') {
    if (playerMustPlayContamination()) addLog('⚠ Contamination in your hand — you must pour it onto your cold side!', 'warn');
    return;
  }
  let idx;
  while ((idx = state.eHand.findIndex(isContamination)) >= 0) {
    const c = softenContamination(state.eHand.splice(idx, 1)[0], 'e');
    state.field.cold.e.push(c);
    addLog(`⚠ Rival drew Contamination — poured onto its cold side (${c.points} pts).`, 'enemy');
  }
}

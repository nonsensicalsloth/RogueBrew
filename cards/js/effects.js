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
    if (!filterFn || filterFn(c)) {
      c.points += amount;
      count++;
    }
  });
  return count;
}

function removeFirstToken(who, tokenId = null) {
  LANES.forEach(lane => {
    const cards = state.field[lane][who];
    const idx = tokenId
      ? cards.findIndex(c => c.id === tokenId)
      : cards.findIndex(c => c.cat === 'token' && c.points < 0);
    if (idx >= 0) {
      const removed = cards.splice(idx, 1)[0];
      addLog(`${removed.name} removed from ${LANE_NAMES[lane]}.`, 'sys');
    }
  });
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
  drawCards(n, state.pDeck, state.pHand);
  addLog(`Drew ${n} card${n > 1 ? 's' : ''}.`, 'player');
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
      // If first card played this turn, draw 1
      if (state.budgetUsed === card.cost) {
        drawForPlayer(1);
        addLog('Pilsner Malt: first card this turn — drew 1 card.', 'player');
      }
      break;

    case '6row':
      // Next card costs 1 less this turn
      state.nextCardDiscount = (state.nextCardDiscount || 0) + 1;
      addLog('6-Row Malt: next card costs 1 less.', 'player');
      break;

    case 'wheatwhite':
      addToHand(who, 'body');
      addLog('White Wheat: Body token added to hand.', 'player');
      break;

    case 'mango':
    case 'flakedwheat':
    case 'strata':
      addToHand(who, 'haze');
      addLog(`${card.name}: Haze token added to hand.`, 'player');
      break;

    case 'cryo':
      removeFirstToken(who, 'sugar_clot');
      removeFirstToken(who, 'sugar_clot8');
      addToHand(who, 'haze');
      addLog('Cryo Hops: Sugar Clot removed, Haze added to hand.', 'player');
      break;

    case 'citra':
    case 'simcoe':
      if (isPlayer) {
        drawForPlayer(1);
        addLog(`${card.name}: drew 1 card.`, 'player');
      }
      break;

    case 'pilotbatch':
      if (isPlayer) {
        drawForPlayer(2);
        addLog('Pilot Batch: drew 2 cards.', 'player');
      }
      break;

    case 'lacto':
      // Mark for +5 next turn
      card._lactoTurn = state.turn + 1;
      addLog('Lacto: will gain +5 pts next turn.', 'player');
      break;

    case 'brettcl':
    case 'lachancea':
      if (isPlayer) {
        drawForPlayer(1);
        addLog(`${card.name}: drew 1 on play.`, 'player');
      }
      break;

    case 'maltodex':
      state.nextCardDiscount = (state.nextCardDiscount || 0) + card.cost;
      addLog('Maltodextrin: next malt or adjunct costs 0.', 'player');
      break;

    case 'lactose':
      // Remove up to 2 roast tokens
      for (let i = 0; i < 2; i++) removeFirstToken(who, 'roast_token');
      addLog('Lactose: removed up to 2 roast tokens.', 'player');
      break;

    case 'sip':
    case 'fining':
      removeFirstToken(who);
      addLog(`${card.name}: removed a negative token.`, 'player');
      if (card.id === 'fining' && allMine.filter(c => c.cat === 'token' && c.points < 0).length === 0) {
        if (isPlayer) drawForPlayer(1);
      }
      break;

    case 'heatkill':
      removeAllTokens(who, 'contamination');
      removeAllTokens(who, 'contam_soft');
      addLog('Heat Kill: all Contamination removed from cold side.', 'player');
      break;

    case 'cip':
      // Flag that player needs to pick a card to remove — handled in UI later
      state.pendingRemoval = { who, type: 'any' };
      addLog('CIP Cycle: select a card on your board to remove.', 'player');
      break;

    case 'fermlog':
      coldCards.forEach(c => { if (c.cat !== 'token') c.points += 2; });
      addLog('Fermentation Log: +2 pts to all cold side cards.', 'player');
      break;

    case 'coldcrash': {
      removeFirstToken(who);
      addLog('Cold Crash: token removed from cold side.', 'player');
      break;
    }

    // ── Tier 2: Board reading ──

    case 'crystal10':
      buffLaneCards('hot', who, 3, c => c.cost <= 1 && c.cat !== 'token');
      addLog('Crystal 10: +3 to all cost-1 hot side cards.', 'player');
      break;

    case 'crystal20':
      buffLaneCards('hot', who, 4, c => c.cost <= 1 && c.cat !== 'token');
      addLog('Crystal 20: +4 to all cost-1 hot side cards.', 'player');
      break;

    case 'crystal30':
      buffLaneCards('hot', who, 5, c => c.cost <= 1 && c.cat !== 'token');
      addLog('Crystal 30: +5 to all cost-1 hot side cards.', 'player');
      break;

    case 'crystal40': {
      const baseMalts = hotCards.filter(c => c.cat === 'malt' && !c.id.startsWith('crystal') && !isDarkOrCrystal(c)).length;
      card.points += baseMalts * 2;
      addLog(`Crystal 40: +${baseMalts * 2} pts (${baseMalts} base malts).`, 'player');
      break;
    }

    case 'crystal50': {
      // Find last base malt played (second to last card on hot side)
      const baseMaltsOnHot = hotCards.filter(c => c.cat === 'malt' && !c.id.startsWith('crystal'));
      if (baseMaltsOnHot.length >= 1) {
        const target = baseMaltsOnHot[baseMaltsOnHot.length - 2] || baseMaltsOnHot[0];
        if (target) {
          target.points *= 2;
          addLog(`Crystal 50: ${target.name} now scores double!`, 'player');
        }
      }
      break;
    }

    case 'crystal60': {
      const baseMalts = hotCards.filter(c => c.cat === 'malt' && !c.id.startsWith('crystal') && !isDarkOrCrystal(c)).length;
      card.points += baseMalts * 3;
      addLog(`Crystal 60: +${baseMalts * 3} pts (${baseMalts} base malts).`, 'player');
      break;
    }

    case 'crystal75': {
      const total = hotCards.filter(c => c.cat !== 'token').length;
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
      buffLaneCards('hot', who, 2, c => c.cat === 'hop');
      buffLaneCards('cold', who, 2, c => c.cat === 'hop');
      addLog('Extra Pale Pilsner: +2 to all hops on board.', 'player');
      break;

    case 'expwheat':
      buffLaneCards('hot', who, 3, c => c.cat === 'hop');
      buffLaneCards('cold', who, 3, c => c.cat === 'hop');
      addLog('Extra Pale Wheat: +3 to all hops on board.', 'player');
      break;

    case 'hallertau': {
      const roastCount = (state.roastTokens || 0);
      if (roastCount === 0) {
        card.points += 6;
        addLog('Hallertau: no roast on board — +6 pts!', 'player');
      }
      break;
    }

    case 'saaz': {
      const hasPilsner = hotCards.some(c => c.id === 'pilsner' || c.id === 'expilsner' || c.id === 'floorpilsner');
      if (hasPilsner) {
        card.points += 8;
        addLog('Saaz: Pilsner Malt on hot side — +8 pts!', 'player');
      }
      break;
    }

    case 'tettnang': {
      const crispCount = countTag('crisp', who);
      card.points += crispCount * 2;
      addLog(`Tettnang: +${crispCount * 2} pts (${crispCount} crisp cards).`, 'player');
      break;
    }

    case 'calale': {
      const hopCount = [...hotCards, ...coldCards].filter(c => c.cat === 'hop').length;
      if (hopCount >= 3) {
        card.points += 8;
        addLog('California Ale: 3+ hops on board — +8 pts!', 'player');
      }
      break;
    }

    case 'kolsch': {
      const roastCount = (state.roastTokens || 0);
      if (roastCount === 0) {
        card.points += 8;
        addLog('Kolsch Yeast: no roast — +8 pts!', 'player');
      }
      break;
    }

    case 'germanlager': {
      const allHot = hotCards.filter(c => c.cat !== 'token');
      const allCheap = allHot.every(c => c.cost <= 2);
      if (allHot.length > 0 && allCheap) {
        card.points += 10;
        addLog('German Lager: all hot side cards cost ≤2 — +10 pts!', 'player');
      }
      break;
    }

    case 'czechlager': {
      const hasPilsnerOrSaaz = [...hotCards, ...coldCards].some(c => c.id === 'pilsner' || c.id === 'saaz');
      if (hasPilsnerOrSaaz) {
        card.points += 8;
        addLog('Czech Lager: Pilsner or Saaz on board — +8 pts!', 'player');
      }
      break;
    }

    case 'belgianstr': {
      const sweetCount = countTag('sweet', who, 'hot');
      if (sweetCount >= 2) {
        card.points *= 2;
        addLog('Belgian Strong: 2+ sweet cards on hot side — score doubled!', 'player');
      }
      break;
    }

    case 'tripel': {
      const sweetCount = countTag('sweet', who);
      card.points += sweetCount * 4;
      addLog(`Tripel Yeast: +${sweetCount * 4} pts (${sweetCount} sweet cards).`, 'player');
      break;
    }

    case 'abbey': {
      const maltyCount = countTag('malty', who, 'hot');
      card.points += maltyCount * 4;
      addLog(`Abbey Yeast: +${maltyCount * 4} pts (${maltyCount} malty cards).`, 'player');
      break;
    }

    case 'hefeweizen': {
      const breadyCount = countTag('bready', who, 'hot');
      card.points += breadyCount * 3;
      addLog(`Hefeweizen: +${breadyCount * 3} pts (${breadyCount} bready cards).`, 'player');
      break;
    }

    case 'styrianG': {
      const yeastCount = coldCards.filter(c => c.cat === 'yeast').length;
      card.points += yeastCount * 3;
      addLog(`Styrian Goldings: +${yeastCount * 3} pts (${yeastCount} yeasts).`, 'player');
      break;
    }

    case 'ekg': {
      const hasBiscuity = hotCards.some(c => c.tags && c.tags.includes('biscuity'));
      if (hasBiscuity) {
        card.points += 8;
        addLog('East Kent Goldings: biscuity malt on hot side — +8 pts!', 'player');
      }
      break;
    }

    case 'ctz': {
      const bitterCount = countTag('bitter', who, lane);
      card.points += bitterCount * 2;
      addLog(`CTZ: +${bitterCount * 2} pts (${bitterCount} bitter cards on ${LANE_NAMES[lane]}).`, 'player');
      break;
    }

    case 'warrior':
      if (lane === 'hot') {
        buffLaneCards('hot', who, 4, c => c.cost === 3 && c.cat === 'malt');
        addLog('Warrior: +4 to all cost-3 malts on hot side.', 'player');
      }
      break;

    case 'vanilla':
      buffLaneCards('hot', who, 2, c => c.tags && c.tags.includes('sweet'));
      buffLaneCards('cold', who, 2, c => c.tags && c.tags.includes('sweet'));
      addLog('Vanilla: +2 to all sweet cards on board.', 'player');
      break;

    case 'vanillabn':
      buffLaneCards('hot', who, 3, c => c.tags && c.tags.includes('sweet'));
      buffLaneCards('cold', who, 3, c => c.tags && c.tags.includes('sweet'));
      addLog('Vanilla Bean: +3 to all sweet cards on board.', 'player');
      break;

    case 'marshm':
      buffLaneCards('hot', who, 2, c => c.tags && c.tags.includes('smooth'));
      buffLaneCards('cold', who, 2, c => c.tags && c.tags.includes('smooth'));
      addLog('Marshmallow: +2 to all smooth cards this round.', 'player');
      break;

    case 'raspberry': {
      const sweetCount = countTag('sweet', who, 'hot');
      card.points += sweetCount * 2;
      addLog(`Raspberries: +${sweetCount * 2} pts (${sweetCount} sweet cards).`, 'player');
      break;
    }

    case 'cherry': {
      const darkCount = hotCards.filter(c => c.tags && c.tags.includes('roasty')).length;
      if (darkCount >= 2) {
        card.points += 8;
        addLog('Cherries: 2+ dark malts — +8 pts!', 'player');
      }
      break;
    }

    case 'passionfr': {
      const hopCount = coldCards.filter(c => c.cat === 'hop').length;
      card.points += hopCount * 2;
      addLog(`Passion Fruit: +${hopCount * 2} pts (${hopCount} hops on cold side).`, 'player');
      break;
    }

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

    case 'galaxy': {
      const hazyCount = countTag('hazy', who);
      if (hazyCount >= 2) {
        card.points += 8;
        addLog('Galaxy: 2+ hazy cards on board — +8 pts!', 'player');
      }
      break;
    }

    case 'motueka': {
      const citrusCount = countTag('citrus', who);
      card.points += citrusCount * 2;
      addLog(`Motueka: +${citrusCount * 2} pts (${citrusCount} citrus cards).`, 'player');
      break;
    }

    case 'maple': {
      const maltyCount = countTag('malty', who, 'hot');
      card.points += maltyCount * 4;
      addLog(`Maple Syrup: +${maltyCount * 4} pts (${maltyCount} malty cards).`, 'player');
      break;
    }

    case 'cinnamon': {
      const sweetCount = countTag('sweet', who, 'hot');
      card.points += sweetCount * 3;
      addLog(`Cinnamon: +${sweetCount * 3} pts (${sweetCount} sweet cards on hot side).`, 'player');
      break;
    }

    case 'chili':
      removeFirstToken(who, 'sugar_clot');
      removeFirstToken(who, 'sugar_clot8');
      addLog('Chili Pepper: Sugar Clot removed!', 'player');
      break;

    case 'nugget':
      removeFirstToken(who, 'sugar_clot');
      removeFirstToken(who, 'sugar_clot8');
      addLog('Nugget: Sugar Clot removed!', 'player');
      break;

    case 'chinook':
      removeFirstToken(who, 'sugar_clot');
      removeFirstToken(who, 'sugar_clot8');
      addLog('Chinook: Sugar Clot removed!', 'player');
      break;

    case 'drunkcellar':
      // Played on enemy cold side — handled specially in battle.js
      break;

    case 'drunkbrewer':
      // Played on enemy hot side — handled specially in battle.js
      break;

    case 'crosscontam':
      shuffleIntoRemainingDeck('e', 'contamination');
      shuffleIntoRemainingDeck('e', 'contamination');
      addLog('Cross Contamination: 2 Contamination cards into enemy deck!', 'player');
      break;

    case 'fermlog':
      coldCards.forEach(c => { if (c.cat !== 'token') c.points += 2; });
      addLog('Fermentation Log: +2 to all cold side cards.', 'player');
      break;

    case 'qc': {
      if (totalScore('p') > totalScore('e')) {
        card.points += 10;
        addLog('Quality Control: you\'re ahead — +10 pts!', 'player');
      }
      break;
    }

    case 'witbier': {
      const spicyCount = countTag('spicy', who);
      card.points += spicyCount * 3;
      addLog(`Witbier Yeast: +${spicyCount * 3} pts (${spicyCount} spicy cards).`, 'player');
      break;
    }

    case 'creamale': {
      const neutralCount = countTag('neutral', who);
      card.points += neutralCount * 2;
      addLog(`Cream Ale: +${neutralCount * 2} pts (${neutralCount} neutral cards).`, 'player');
      break;
    }

    case 'americanlag': {
      const neutralCount = countTag('neutral', who);
      if (neutralCount >= 3) {
        card.points += 8;
        addLog('American Lager: 3+ neutral cards — +8 pts!', 'player');
      }
      break;
    }

    case 'gose': {
      const hasWheatRye = hotCards.some(c =>
        c.id === 'wheatwhite' || c.id === 'flakedwheat' || c.id === 'flakedrye' || c.id === 'rye' || c.id === '6row'
      );
      if (hasWheatRye) {
        card.points += 8;
        addLog('Gose Yeast: wheat/rye on hot side — +8 pts!', 'player');
      }
      break;
    }

    default:
      break;
  }
}

// ── C-Hop doubling check ──
// Called after any hop is placed to check if c-hop doubling applies

function applyCHopSynergy(lane, who) {
  const laneCards = getLaneCards(lane, who);
  const cHops = laneCards.filter(c => c.tags && c.tags.includes('c-hop'));
  if (cHops.length >= 2) {
    // Reset to base then double all c-hops on this lane
    cHops.forEach(c => {
      const baseDef = getCardDef(c.id);
      if (baseDef) c.points = baseDef.points * 2;
    });
    addLog(`C-Hop synergy! ${cHops.length} c-hops on ${LANE_NAMES[lane]} — all doubled!`, 'player');
  }
}

// ── Per-turn persistent effects ──
// Called at the start of each turn in advanceTurn()

function applyTurnEffects(who) {
  const coldCards = getLaneCards('cold', who);
  const isPlayer = who === 'p';

  coldCards.forEach(c => {
    switch (c.id) {
      case 'brett':
        c.points += 3;
        if (isPlayer) addLog('Brett Brux: +3 pts this turn.', 'player');
        shuffleIntoRemainingDeck('p', 'contamination');
        break;

      case 'brettcl':
        c.points += 2;
        if (isPlayer) addLog('Brett Claussenii: +2 pts this turn.', 'player');
        // 50/50 contamination
        if (Math.random() < 0.5) shuffleIntoRemainingDeck('p', 'contamination');
        else shuffleIntoRemainingDeck('e', 'contamination');
        break;

      case 'brettano': {
        const hasFruity = getLaneCards('hot', who).some(c => c.tags && c.tags.includes('fruity'));
        c.points += hasFruity ? 5 : 3;
        if (isPlayer) addLog(`Brett Anomalus: +${hasFruity ? 5 : 3} pts this turn.`, 'player');
        shuffleIntoRemainingDeck('e', 'contamination');
        break;
      }

      case 'pedio':
        if (isPlayer) addLog('Pediococcus: 50/50 contamination...', 'player');
        if (Math.random() < 0.5) shuffleIntoRemainingDeck('p', 'contamination');
        else shuffleIntoRemainingDeck('e', 'contamination');
        break;

      case 'lachancea':
        if (isPlayer) addLog('Lachancea: 50/50 soft contamination...', 'player');
        if (Math.random() < 0.5) shuffleIntoRemainingDeck('p', 'contam_soft');
        else shuffleIntoRemainingDeck('e', 'contam_soft');
        break;

      case 'lacto':
        // +5 only on the turn after played
        if (c._lactoTurn && state.turn === c._lactoTurn) {
          c.points += 5;
          if (isPlayer) addLog('Lacto: +5 pts this turn!', 'player');
          c._lactoTurn = null;
        }
        break;
    }
  });
}

// ── Contamination auto-play check ──
// Called at start of player's turn — if a contamination card is in hand, auto-play it

function checkContaminationInHand() {
  const contamIdx = state.pHand.findIndex(c =>
    c.id === 'contamination' || c.id === 'contam_soft'
  );
  if (contamIdx >= 0) {
    const c = state.pHand.splice(contamIdx, 1)[0];
    state.field.cold.p.push(c);
    addLog(`⚠ Contamination drawn — auto-played to your cold side! (${c.points} pts)`, 'warn');
    render();
  }
}

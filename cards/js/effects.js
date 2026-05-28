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

function addRoastToken(who, amount = 1) {
  if (who === 'p') {
    state.roastTokens = (state.roastTokens || 0) + amount;
    addLog(`🔥 +${amount} roast token${amount > 1 ? 's' : ''}! Total: ${state.roastTokens}/5`, 'warn');
    if (state.roastTokens >= 5) {
      addLog('⚠ ROAST OVERLOAD! Hot side score halved!', 'warn');
    }
  }
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
      // Plays on enemy cold side, adds +8 to their score, you draw 2
      state.field.cold.e.push({ id:'drunk_bonus', name:'Drunk Cellarman', cat:'token', lane:'cold', points:8, cost:0, tags:[] });
      if (isPlayer) drawForPlayer(2);
      addLog('Drunk Cellarman: +8 to rival cold side, you draw 2!', 'player');
      break;

    case 'drunkbrewer':
      // Plays on enemy hot side, adds +8 to their score, you draw 2
      state.field.hot.e.push({ id:'drunk_bonus', name:'Drunk Brewer', cat:'token', lane:'hot', points:8, cost:0, tags:[] });
      if (isPlayer) drawForPlayer(2);
      addLog('Drunk Brewer: +8 to rival hot side, you draw 2!', 'player');
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

    // ── Dark Malts — roast token generation ──
    case 'choc':      addRoastToken(who, 1); break;
    case 'patent':    addRoastToken(who, 2); break;
    case 'palechoc':  addRoastToken(who, 1); break;

    case 'roastedbar': {
      addRoastToken(who, 2);
      if ((state.roastTokens || 0) >= 3) {
        card.points += 10;
        addLog('Roasted Barley: 3+ roast — +10 pts!', 'player');
      }
      break;
    }

    case 'carafaI':
      addRoastToken(who, 1);
      state.roastThreshold = (state.roastThreshold || 5) + 1;
      addLog('Carafa I: threshold → ' + state.roastThreshold, 'player');
      break;

    case 'carafaII':
      addRoastToken(who, 1);
      state.roastThreshold = (state.roastThreshold || 5) + 1;
      addLog('Carafa II: threshold → ' + state.roastThreshold, 'player');
      break;

    case 'carafaIII':
      addRoastToken(who, 2);
      state.roastThreshold = (state.roastThreshold || 5) + 1;
      addLog('Carafa III: threshold → ' + state.roastThreshold, 'player');
      break;

    case 'blackmalt': {
      addRoastToken(who, 2);
      const adjCrystal = getLaneCards('hot', who).filter(c => c.id && c.id.startsWith('crystal'));
      adjCrystal.forEach(c => { c.points *= 2; });
      if (adjCrystal.length) addLog(`Black Malt: ${adjCrystal.length} crystal malt(s) doubled!`, 'player');
      break;
    }

    case 'midnightw':
      state.roastTokens = (state.roastTokens || 0) + 1;
      state.roastSafe   = (state.roastSafe   || 0) + 1;
      addLog('Midnight Wheat: +1 roast (safe, no penalty).', 'player');
      break;

    case 'debittered':
      if ((state.roastTokens || 0) > 0) {
        state.roastTokens--;
        addLog('De-bittered Black: removed 1 roast. Total: ' + state.roastTokens, 'player');
      }
      break;

    case 'smokedmalt':
      addRoastToken(who, 1);
      buffLaneCards('hot', who, 2, c => c.tags && c.tags.includes('roasty'));
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
      state.roastThreshold = (state.roastThreshold || 5) + 1;
      addLog('Cold Brew Coffee: threshold → ' + state.roastThreshold, 'player');
      break;

    case 'crystal80': {
      const roast80 = state.roastTokens || 0;
      card.points = roast80 * 8;
      addLog(`Crystal 80: ${roast80} roast × 8 = ${card.points} pts! Sugar Clot added.`, 'warn');
      state.field['hot'].p.push(createToken('sugar_clot'));
      break;
    }

    case 'specialb': {
      const roastSB = state.roastTokens || 0;
      card.points = roastSB * 6;
      addLog(`Special B: ${roastSB} roast × 6 = ${card.points} pts! Sugar Clot added.`, 'warn');
      state.field['hot'].p.push(createToken('sugar_clot8'));
      break;
    }

    // ── Malts: specialty ──

    case 'carapils': {
      const hotList = getLaneCards('hot', who);
      const idx = hotList.indexOf(card);
      const neighbors = [hotList[idx-1], hotList[idx+1]].filter(Boolean);
      neighbors.forEach(n => { if (n.cat !== 'token') n.points += 3; });
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
      // Copy effect of last malt played this round
      if (state.lastPlayedCard && state.lastPlayedCard.cat === 'malt' && state.lastPlayedCard.id !== 'aromatic') {
        const prev = state.lastPlayedCard;
        addLog(`Aromatic Malt: copying effect of ${prev.name}...`, 'player');
        applyCardEffect(prev, lane, who);
      }
      break;
    }

    case 'biscuit': {
      // Immune to multipliers, scores base × row count
      const rowCount = getLaneCards('hot', who).filter(c => c.cat !== 'token').length;
      const baseDef  = getCardDef('biscuit');
      card.points    = (baseDef ? baseDef.points : 4) * rowCount;
      card._noMultiplier = true;
      addLog(`Biscuit Malt: ${rowCount} cards in hot side row — ${card.points} pts!`, 'player');
      break;
    }

    case 'victory':
      // Victory malt persistence handled in endRound — flag it here
      card._victory = true;
      addLog('Victory Malt: will stay on board if you win this round!', 'player');
      break;

    case 'crystal120': {
      // Sacrifice a crystal malt already on hot side
      const hotList120 = getLaneCards('hot', who);
      const sacrificeIdx = hotList120.findIndex(c => c.id && c.id.startsWith('crystal') && c !== card);
      if (sacrificeIdx >= 0) {
        const sacrificed = hotList120.splice(sacrificeIdx, 1)[0];
        card.points += sacrificed.points;
        addLog(`Crystal 120: sacrificed ${sacrificed.name} (+${sacrificed.points}) — bonus pts gained!`, 'player');
      } else {
        addLog('Crystal 120: no crystal to sacrifice — played at base score.', 'player');
      }
      break;
    }

    case 'oats': {
      // Double adjacent dark malt
      const oatHot = getLaneCards('hot', who);
      const oatIdx = oatHot.indexOf(card);
      const darkNeighbors = [oatHot[oatIdx-1], oatHot[oatIdx+1]]
        .filter(n => n && n.tags && n.tags.includes('roasty'));
      darkNeighbors.forEach(n => { n.points *= 2; });
      if (darkNeighbors.length) addLog(`Flaked Oats: doubled adjacent dark malt!`, 'player');
      break;
    }

    case 'coffee': {
      // Double all dark malt values on hot side
      const darkMalts = getLaneCards('hot', who).filter(c => c.tags && c.tags.includes('roasty') && c.cat === 'malt');
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

    case 'coconut':
      addToHand(who, 'body');
      addLog('Coconut: Body token added to hand.', 'player');
      break;

    case 'honey': {
      // Free if first adjunct this round
      const adjCount = getAllOnField(who).filter(c => c.cat === 'adjunct').length;
      if (adjCount === 1) { // just placed, so 1 means it's the first
        state.budgetUsed -= card.cost;
        addLog('Honey: first adjunct this round — played for free!', 'player');
      }
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
      state.nextCardDiscount = (state.nextCardDiscount || 0) + 1;
      addLog('Rice Hulls: next card costs 1 less.', 'player');
      break;

    case 'oatflakes':
      // No special effect, just smooth points
      break;

    case 'buckwheat': {
      const nuancedCount = countTag('nuanced', who);
      if (nuancedCount >= 2 && isPlayer) {
        drawForPlayer(1);
        addLog('Buckwheat: 2+ nuanced cards — drew 1 card!', 'player');
      }
      break;
    }

    case 'citrazest':
      state.nextHopDiscount = (state.nextHopDiscount || 0) + card.cost;
      addLog('Citra Zest: next hop card costs 0.', 'player');
      break;

    case 'toastedcoc': {
      const hasSweet  = countTag('sweet', who, 'hot') > 0;
      const hasToasty = countTag('toasty', who, 'hot') > 0;
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

    case 'filtration':
      if (isPlayer) {
        // Remove last card on cold side
        const coldList = getLaneCards('cold', who);
        if (coldList.length > 0) {
          const removed = coldList.splice(coldList.length - 1, 1)[0];
          addLog(`Filtration: removed ${removed.name} from cold side.`, 'player');
          drawForPlayer(1);
        } else {
          addLog('Filtration: nothing to remove.', 'player');
        }
      }
      break;

    case 'hopthief': {
      // Copy highest scoring hop from enemy board
      const enemyHops = getAllOnField('e').filter(c => c.cat === 'hop');
      if (enemyHops.length > 0) {
        const best = enemyHops.reduce((a, b) => a.points > b.points ? a : b);
        const copy = { ...best };
        if (isPlayer) state.pHand.push(copy);
        addLog(`Hop Thief: copied ${best.name} from rival's board!`, 'player');
      } else {
        addLog('Hop Thief: no hops to steal.', 'player');
      }
      break;
    }

    case 'badbatch': {
      // Remove highest scoring card from enemy hot side
      const enemyHot = getLaneCards('hot', 'e');
      if (enemyHot.length > 0) {
        const bestIdx = enemyHot.reduce((bi, c, i) => c.points > enemyHot[bi].points ? i : bi, 0);
        const removed = enemyHot.splice(bestIdx, 1)[0];
        addLog(`Bad Batch: removed rival's ${removed.name} (+${removed.points})!`, 'player');
      } else {
        addLog('Bad Batch: rival hot side is empty.', 'player');
      }
      break;
    }

    case 'inspector': {
      // Remove highest scoring card from any enemy lane
      const allEnemy = [...getLaneCards('hot','e'), ...getLaneCards('cold','e')];
      if (allEnemy.length > 0) {
        const best = allEnemy.reduce((a, b) => a.points > b.points ? a : b);
        ['hot','cold'].forEach(l => {
          const idx = state.field[l].e.indexOf(best);
          if (idx >= 0) state.field[l].e.splice(idx, 1);
        });
        addLog(`Health Inspector: removed rival's ${best.name} (+${best.points})!`, 'player');
      }
      break;
    }

    case 'dryhop': {
      // Move a hop from hot side to cold side
      const hotHops = getLaneCards('hot', who).filter(c => c.cat === 'hop');
      if (hotHops.length > 0) {
        const hop = hotHops[hotHops.length - 1];
        const hi  = getLaneCards('hot', who).indexOf(hop);
        getLaneCards('hot', who).splice(hi, 1);
        getLaneCards('cold', who).push(hop);
        addLog(`Dry Hop: moved ${hop.name} to cold side!`, 'player');
      } else {
        addLog('Dry Hop: no hops on hot side to move.', 'player');
      }
      break;
    }

    case 'kettletrans': {
      // Move last card from cold side to hot side if allowed
      const coldList2 = getLaneCards('cold', who);
      if (coldList2.length > 0) {
        const c2 = coldList2[coldList2.length - 1];
        if (c2.lane === 'hot' || c2.lane === 'both') {
          coldList2.splice(coldList2.length - 1, 1);
          getLaneCards('hot', who).push(c2);
          addLog(`Kettle Transfer: moved ${c2.name} to hot side!`, 'player');
        } else {
          addLog(`Kettle Transfer: ${c2.name} can't go on hot side.`, 'warn');
        }
      }
      break;
    }

    case 'doublebatch': {
      // Copy the last card played onto the same lane
      if (state.lastPlayedCard && state.lastPlayedLane) {
        const copy = { ...state.lastPlayedCard };
        state.field[state.lastPlayedLane][who].push(copy);
        addLog(`Double Batch: copied ${copy.name} to ${LANE_NAMES[state.lastPlayedLane]}!`, 'player');
      } else {
        addLog('Double Batch: no previous card to copy.', 'player');
      }
      break;
    }

    case 'barreltrans': {
      // Best cold side card gets +50%
      const coldCards2 = getLaneCards('cold', who).filter(c => c.cat !== 'token');
      if (coldCards2.length > 0) {
        const best2 = coldCards2.reduce((a, b) => a.points > b.points ? a : b);
        const bonus  = Math.floor(best2.points * 0.5);
        best2.points += bonus;
        addLog(`Barrel Transfer: ${best2.name} gets +${bonus} pts (+50%)!`, 'player');
      }
      break;
    }

    case 'recipetweak': {
      // Swap last hand card with last hot side card
      if (isPlayer && state.pHand.length > 0 && getLaneCards('hot', who).length > 0) {
        const handCard  = state.pHand.splice(state.pHand.length - 1, 1)[0];
        const hotList2  = getLaneCards('hot', who);
        const fieldCard = hotList2.splice(hotList2.length - 1, 1)[0];
        hotList2.push(handCard);
        state.pHand.push(fieldCard);
        addLog(`Recipe Tweak: swapped ${handCard.name} ↔ ${fieldCard.name}!`, 'player');
      }
      break;
    }

    case 'tasting':
      // Show enemy hand in log
      if (isPlayer) {
        const eHandStr = state.eHand.map(c => `${c.name}(${c.points})`).join(', ');
        addLog(`Tasting Notes: rival's hand — ${eHandStr || 'empty'}`, 'player');
      }
      break;

    case 'award':
      card._award = true;
      addLog('Award Entry: draw 3 if you win this round!', 'player');
      break;

    case 'grainreview':
      // Just log top 3 cards so player knows what's coming
      if (isPlayer) {
        const top3 = state.pDeck.slice(0, 3).map(c => c.name).join(', ');
        addLog(`Grain Bill Review: next 3 cards — ${top3 || 'deck empty'}`, 'player');
      }
      break;

    // ── Hops: remaining ──

    case 'cascade':
    case 'centennial':
      // C-hop synergy handled by applyCHopSynergy in battle.js
      break;

    case 'columbus':
      // C-hop synergy + adds roast token to rival
      state.eRoastTokens = (state.eRoastTokens || 0) + 1;
      addLog('Columbus: +1 roast token added to rival!', 'player');
      break;

    case 'cluster': {
      const hopCount2 = [...getLaneCards('hot',who),...getLaneCards('cold',who)].filter(c=>c.cat==='hop').length;
      if (hopCount2 >= 3) {
        card.points += 6;
        addLog('Cluster: 3+ hops on board — +6 pts!', 'player');
      }
      break;
    }

    case 'mosaic':
      // Counts as two tags — handled in tag-counting functions via special check
      addLog('Mosaic: counts as two tags for synergy purposes.', 'player');
      break;

    case 'azacca': {
      if (lane === 'cold') {
        const fruityAdj2 = getLaneCards('hot', who).filter(c => c.cat === 'adjunct' && c.tags && c.tags.includes('fruity'));
        if (fruityAdj2.length > 0) {
          fruityAdj2[fruityAdj2.length - 1].points += 4;
          addLog(`Azacca: +4 to ${fruityAdj2[fruityAdj2.length-1].name} on hot side!`, 'player');
        }
      }
      break;
    }

    case 'sabro': {
      buffLaneCards('hot', who, 2, c => c.tags && c.tags.includes('smooth'));
      buffLaneCards('cold', who, 2, c => c.tags && c.tags.includes('smooth'));
      addLog('Sabro: +2 to all smooth cards.', 'player');
      break;
    }

    case 'magnum':
      // Flat score, no effect needed
      break;

    case 'nelson':
      // Nuanced handled by applyNuancedSynergy
      break;

    case 'waiiti': {
      if (lane === 'cold') {
        buffLaneCards('cold', who, 3, c => c.cat === 'yeast' && c.tags && c.tags.includes('crisp'));
        addLog('Wai-iti: +3 to crisp yeasts on cold side!', 'player');
      }
      break;
    }

    case 'idaho7': {
      const hasFruity2 = countTag('fruity', who) > 0;
      const hasBitter2 = countTag('bitter', who) > 0;
      if (hasFruity2 && hasBitter2) {
        card.points += 6;
        addLog('Idaho 7: fruity + bitter both on board — +6 pts!', 'player');
      }
      break;
    }

    // ── Yeasts: remaining ──

    case 'americanale': {
      const hasFunky = countTag('funky', who, 'cold') > 0;
      if (!hasFunky) {
        card.points += 6;
        addLog('American Ale: no funky cards — +6 pts!', 'player');
      }
      break;
    }

    case 'englishale': {
      const biscCount = countTag('biscuity', who, 'hot');
      card.points += biscCount * 2;
      addLog(`English Ale: +${biscCount * 2} pts (${biscCount} biscuity cards).`, 'player');
      break;
    }

    case 'irishale':
      // Reliable anchor, no special effect
      break;

    case 'belgian':
      // Base score only
      break;

    case 'saison':
      // Base score only
      break;

    case 'munichlager': {
      const maltyCount2 = countTag('malty', who);
      card.points += maltyCount2 * 3;
      addLog(`Munich Lager: +${maltyCount2 * 3} pts (${maltyCount2} malty cards).`, 'player');
      break;
    }

    case 'kveik':
      // High flat score, no special effect
      break;

    case 'kvass': {
      const breadyCount2 = countTag('bready', who);
      card.points += breadyCount2 * 2;
      addLog(`Kvass: +${breadyCount2 * 2} pts (${breadyCount2} bready cards).`, 'player');
      break;
    }

    case 'champagne': {
      // Remove all funky tags from cold side cards
      getLaneCards('cold', who).forEach(c => {
        if (c.tags) c.tags = c.tags.filter(t => t !== 'funky');
      });
      addLog('Champagne Yeast: all funky tags removed from cold side!', 'player');
      break;
    }

    case 'mixedferm':
      // Counts as all yeast types — log it, synergy checks reference this flag
      card._mixedFerm = true;
      addLog('Mixed Ferm: counts as ale, lager, and wild for all synergies!', 'player');
      break;

    case '2row':
    case 'goldenprom':
    case 'munich':
    case 'paleale':
    case 'heritage':
    case 'caramun':
    case 'oatflakes':
      // Flat score cards — no effect needed
      break;

    default:
      break;
  }
}

// ── Nuanced synergy ──
// Called after any nuanced card is played.
// All nuanced cards on the board multiply each other's base score.

function applyNuancedSynergy(who) {
  const allCards = getAllOnField(who);
  const nuanced  = allCards.filter(c => c.tags && c.tags.includes('nuanced') && c.cat !== 'token');
  if (nuanced.length < 2) return;
  // Each nuanced card's score gets multiplied by the count of OTHER nuanced cards
  nuanced.forEach(c => {
    const baseDef = getCardDef(c.id);
    const base    = baseDef ? baseDef.points : c.points;
    c.points = base * nuanced.length;
  });
  addLog(`Nuanced synergy! ${nuanced.length} nuanced cards — all scores x${nuanced.length}!`, 'player');
}
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

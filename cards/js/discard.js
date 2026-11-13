// discard.js — the spent-grain cards that use your discard pile
//
//   Grain Out        discard a card from your hand, draw 2
//   Trub Dump        look at your top 3 cards: keep one, discard the other two
//   Yeast Harvest    take a yeast back from your discard pile; it costs 0 this turn
//   Second Runnings  play the top malt of your discard pile for free
//   Grain Bill Review  look at your next 5 cards, put a malt from among them into your hand
//   Spent Grain Bread / Solera  score from what's in your discard pile
//
// Two kinds of choice live here (cards on the board use effects.js targeting):
//   • choosing a card in your HAND      (state.handTargeting)
//   • choosing from a row of cards shown above your hand (state.battlePicker)
// The rival always chooses automatically.

function discardOf(who) { return who === 'p' ? state.pDiscard : state.eDiscard; }
function handOf(who)    { return who === 'p' ? state.pHand    : state.eHand;    }
function deckOf(who)    { return who === 'p' ? state.pDeck    : state.eDeck;    }

// Anything waiting on the player to choose blocks other actions
function pendingChoiceActive() {
  return !!(state && (state.cardTargeting || state.handTargeting || state.battlePicker));
}

function pendingChoicePrompt() {
  if (state.cardTargeting) return CARD_TARGETS[state.cardTargeting.kind].prompt;
  if (state.handTargeting) return 'GRAIN OUT: CHOOSE A CARD IN YOUR HAND TO DISCARD';
  if (state.battlePicker)  return state.battlePicker.prompt;
  return '';
}

// ── Grain Out: discard from hand ──

function startGrainOut(src, who) {
  const hand = handOf(who).filter(c => !isContamination(c));
  if (!hand.length) { drawFor(who, 2); addLog('Grain Out: nothing to discard — drew 2.', who === 'p' ? 'player' : 'enemy'); return; }
  if (who === 'e') {
    const worst = hand.reduce((a, b) => b.points < a.points ? b : a);
    finishGrainOut(worst, 'e');
    return;
  }
  state.handTargeting = { kind: 'grainout' };
}

function finishGrainOut(card, who) {
  const hand = handOf(who);
  hand.splice(hand.indexOf(card), 1);
  discardOf(who).push(card);
  addLog(`Grain Out: discarded ${card.name}, drew 2.`, who === 'p' ? 'player' : 'enemy');
  drawFor(who, 2);
  checkContaminationInHand(who);
}

function handPickTarget(idx) {
  if (!state.handTargeting) return;
  const c = state.pHand[idx];
  if (!c || isContamination(c)) return;
  state.handTargeting = null;
  finishGrainOut(c, 'p');
  render();
}

// ── Pickers shown above your hand ──

function openBattlePicker(kind, prompt, cards, src) {
  state.battlePicker = { kind, prompt, cards, src };
}

function pickBattleCard(i) {
  const p = state.battlePicker;
  if (!p || !p.cards[i]) return;
  state.battlePicker = null;
  BATTLE_PICKS[p.kind](p.cards, i, 'p', p.src);
  checkContaminationInHand('p');
  render();
}

const BATTLE_PICKS = {
  // Keep one of the top three, the other two go to the discard pile
  trubdump(cards, i, who) {
    const keep = cards[i];
    handOf(who).push(keep);
    cards.forEach((c, k) => { if (k !== i) discardOf(who).push(c); });
    addLog(`Trub Dump: kept ${keep.name}, dumped ${cards.length - 1} card(s).`, who === 'p' ? 'player' : 'enemy');
  },
  // Take a yeast back from the discard pile (reset to how it is in your deck); free this turn
  yeastharvest(cards, i, who) {
    const pick = cards[i];
    const pile = discardOf(who);
    pile.splice(pile.indexOf(pick), 1);
    const fresh = typeof refreshRunCard === 'function' ? refreshRunCard(pick) : { ...(getCardDef(pick.id) || pick) };
    delete fresh._barrelReturn;
    fresh._freeKey = `${state.round}:${state.turn}`;
    handOf(who).push(fresh);
    addLog(`Yeast Harvest: ${fresh.name} back in hand, free to pitch this turn.`, who === 'p' ? 'player' : 'enemy');
  },
  // Take the chosen malt out of the deck; the rest stay on top in the same order
  grainreview(cards, i, who) {
    const pick = cards[i];
    const deck = deckOf(who);
    const k = deck.indexOf(pick);
    if (k >= 0) deck.splice(k, 1);
    handOf(who).push(pick);
    if (who === 'p' && state.newCards) state.newCards.add(pick);
    addLog(`Grain Bill Review: pulled ${pick.name} into hand.`, who === 'p' ? 'player' : 'enemy');
  },
};

const GRAIN_REVIEW_DEPTH = 5;

function grainBillReview(who) {
  const deck = deckOf(who);
  if (deck.length < GRAIN_REVIEW_DEPTH) reshuffleDiscard(deck);
  const top   = deck.slice(0, GRAIN_REVIEW_DEPTH);
  const malts = top.filter(c => c.cat === 'malt');
  const tag   = who === 'p' ? 'player' : 'enemy';
  if (who === 'p') addLog(`Grain Bill Review: next ${top.length} — ${top.map(c => c.name).join(', ') || 'deck empty'}`, 'player');
  if (!malts.length) { drawFor(who, 1); addLog('Grain Bill Review: no malt in sight — drew 1 instead.', tag); return; }
  if (who === 'e' || malts.length === 1) {
    const best = malts.reduce((bi, c, k) => c.points > malts[bi].points ? k : bi, 0);
    BATTLE_PICKS.grainreview(malts, best, who);
    return;
  }
  openBattlePicker('grainreview', 'GRAIN BILL REVIEW: CHOOSE A MALT TO PUT IN YOUR HAND', malts, null);
}

function startTrubDump(src, who) {
  const deck = deckOf(who);
  const cards = [];
  while (cards.length < 3) {
    if (!deck.length && !reshuffleDiscard(deck)) break;
    cards.push(deck.shift());
  }
  if (!cards.length) { addLog('Trub Dump: your deck is empty.', 'sys'); return; }
  if (who === 'e') {
    const best = cards.reduce((bi, c, k) => c.points > cards[bi].points ? k : bi, 0);
    BATTLE_PICKS.trubdump(cards, best, 'e');
    return;
  }
  openBattlePicker('trubdump', 'TRUB DUMP: KEEP ONE CARD — THE OTHERS GO TO YOUR DISCARD PILE', cards, src);
}

function startYeastHarvest(src, who) {
  const yeasts = discardOf(who).filter(c => c.cat === 'yeast');
  if (!yeasts.length) { drawFor(who, 1); addLog('Yeast Harvest: no yeast in your discard pile — drew 1 instead.', who === 'p' ? 'player' : 'enemy'); return; }
  if (who === 'e') {
    const best = yeasts.reduce((bi, c, k) => c.points > yeasts[bi].points ? k : bi, 0);
    BATTLE_PICKS.yeastharvest(yeasts, best, 'e');
    return;
  }
  openBattlePicker('yeastharvest', 'YEAST HARVEST: CHOOSE A YEAST FROM YOUR DISCARD PILE', yeasts, src);
}

// ── Second Runnings: replay the most recent malt in your discard pile ──

function secondRunnings(src, who) {
  const pile = discardOf(who);
  for (let k = pile.length - 1; k >= 0; k--) {
    const c = pile[k];
    if (c.cat !== 'malt') continue;
    pile.splice(k, 1);
    const fresh = typeof refreshRunCard === 'function' ? refreshRunCard(c) : { ...(getCardDef(c.id) || c) };
    delete fresh._barrelReturn;
    if (c._deckIdx !== undefined) fresh._deckIdx = c._deckIdx;
    const lane = fresh.lane === 'cold' ? 'cold' : 'hot';
    addLog(`Second Runnings: ${fresh.name} brewed again from the spent grain!`, who === 'p' ? 'player' : 'enemy');
    resolvePlay(fresh, lane, who);
    return;
  }
  src.points += 8;
  addLog('Second Runnings: no malt to rebrew — +8 pts instead.', who === 'p' ? 'player' : 'enemy');
}

// ── Picker markup (shown above your hand) ──

function battlePickerHtml() {
  const p = state.battlePicker;
  if (!p) return '';
  return `<div class="battle-picker-title">${p.prompt}</div>
    <div class="battle-picker-cards">${p.cards.map((c, i) => cardHtml(c, i, 'view').replace('onclick="void(0)"', `onclick="pickBattleCard(${i})"`)).join('')}</div>`;
}

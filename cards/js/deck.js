// deck.js — deck utilities: shuffle, draw, discard

function shuffle(arr) {
  let a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Draw n cards from a deck into a hand.
// When the deck runs out, the matching discard pile is shuffled back in
// (tokens are left out — they don't recycle).
function drawCards(n, deck, hand) {
  for (let i = 0; i < n; i++) {
    if (deck.length === 0 && !reshuffleDiscard(deck)) break;
    const card = deck.shift();
    hand.push(card);
    // Remember what the player just drew so the hand can highlight it
    if (typeof state !== 'undefined' && state && hand === state.pHand) {
      state.newCards = state.newCards || new Set();
      state.newCards.add(card);
    }
  }
}

function reshuffleDiscard(deck) {
  if (typeof state === 'undefined' || !state) return false;
  const discard = deck === state.pDeck ? state.pDiscard
                : deck === state.eDeck ? state.eDiscard : null;
  if (!discard || discard.length === 0) return false;
  const cards = shuffle(discard.filter(c => c.cat !== 'token'));
  discard.length = 0;
  if (cards.length === 0) return false;
  deck.push(...cards);
  if (typeof addLog === 'function') {
    addLog(`↻ ${deck === state.pDeck ? 'Your' : "Rival's"} discard reshuffled into deck (${cards.length} cards).`, 'sys');
  }
  return true;
}

// Move hand cards back into deck (mulligan).
function mulliganCards(indices, hand, deck) {
  // Remove highest indices first to avoid shifting problems
  [...indices].sort((a, b) => b - a).forEach(i => {
    deck.push(hand.splice(i, 1)[0]);
  });
  return shuffle(deck);
}

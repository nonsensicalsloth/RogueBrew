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
// Does NOT reshuffle — when deck is empty, drawing stops.
function drawCards(n, deck, hand) {
  let amt = Math.min(n, deck.length);
  if (amt > 0) hand.push(...deck.splice(0, amt));
}

// Move all field cards to discard at end of round.
// Hand cards are NOT discarded between rounds.
function clearField(field, pDiscard, eDiscard) {
  const LANES = ['hot', 'cold'];
  LANES.forEach(l => {
    pDiscard.push(...field[l].p);
    eDiscard.push(...field[l].e);
    field[l].p = [];
    field[l].e = [];
  });
}

// Move hand cards back into deck (mulligan).
function mulliganCards(indices, hand, deck) {
  // Remove highest indices first to avoid shifting problems
  [...indices].sort((a, b) => b - a).forEach(i => {
    deck.push(hand.splice(i, 1)[0]);
  });
  return shuffle(deck);
}

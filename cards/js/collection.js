// collection.js — the cards you own permanently (Hearthstone / Gungeon style)
//
//   • Every common card is owned from the start.
//   • Uncommons and rares are unlocked forever by buying them in a shop during a run.
//   • Cards drafted or won in a run can be used in that run, but aren't unlocked.
//   • You can only build decks from cards you own.
//
// Stored in the browser like saved decks, so it survives closing the game.

const COLLECTION_KEY = 'wortcraft_collection';

function loadCollection() {
  try {
    const raw  = localStorage.getItem(COLLECTION_KEY);
    const data = raw ? JSON.parse(raw) : null;
    return { unlocked: (data && data.unlocked) || [], unlockAll: !!(data && data.unlockAll) };
  } catch (e) { return { unlocked: [], unlockAll: false }; }
}

function saveCollection(col) {
  try { localStorage.setItem(COLLECTION_KEY, JSON.stringify(col)); } catch (e) {}
}

function isOwned(id) {
  const c = getCardDef(id);
  if (!c) return false;
  if (c.rarity === 'common') return true;
  const col = loadCollection();
  return col.unlockAll || col.unlocked.includes(id);
}

// Returns true if this was a new unlock
function unlockCard(id) {
  if (isOwned(id)) return false;
  const col = loadCollection();
  col.unlocked.push(id);
  saveCollection(col);
  return true;
}

function collectionCount() {
  return CARD_POOL.filter(c => isOwned(c.id)).length;
}

// Playtesting switch: treat every card as owned without touching what you've really unlocked
function setUnlockAll(on) {
  const col = loadCollection();
  col.unlockAll = !!on;
  saveCollection(col);
}

function deckLockedCards(cardIds) {
  return [...new Set(cardIds.filter(id => getCardDef(id) && !isOwned(id)))];
}

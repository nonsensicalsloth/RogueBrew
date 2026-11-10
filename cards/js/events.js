// events.js — extra map events (added to MAP_EVENTS from map.js at load)
//
// Each event: { title, desc, options: [{ label, can?, action? | picker? }] }
//   action() changes the run and returns the result text
//   picker() opens a card choice instead (finish with finishEvent(text))
//   can()   greys the option out when it isn't possible (not enough gold, etc.)
// Every event keeps at least one option without a can(), so there's always a way out.

// ── Helpers ──

function addCardToDeck(id) {
  const c = getCardDef(id);
  if (!c || draftState.deck.length >= MAX_DECK_SIZE || copiesInDeck(id) >= MAX_COPIES) return null;
  draftState.deck.push({ ...c });
  return c.name;
}

function randomDeckIndex(filter) {
  const idx = draftState.deck.map((c, i) => [c, i]).filter(([c]) => filter(c)).map(([, i]) => i);
  return idx.length ? idx[Math.floor(Math.random() * idx.length)] : -1;
}

function loseRep(n) {
  mapState.rep = Math.max(1, mapState.rep - n);
  return `−${n} Reputation (⭐ ${mapState.rep}/${mapState.maxRep}).`;
}

function gainRep(n) {
  const got = healRep(n);
  return got > 0 ? `+${got} Reputation (⭐ ${mapState.rep}/${mapState.maxRep}).` : 'Your reputation is already as good as it gets.';
}

function upgradeDeckCard(c) {
  const bonus = restUpgradeAmount();
  c.points += bonus;
  c._upgraded = true;
  c._upgradeBonus = bonus;
  return bonus;
}

// Choose a card from your deck. onPick is the name of a global function taking a deck index.
function showEventDeckPicker(prompt, filter, onPick, note) {
  document.getElementById('event-result').textContent = prompt;
  document.getElementById('event-options').innerHTML =
    `<div class="removal-list" style="width:100%;max-width:400px;">${deckPickerHtml(onPick, c => filter(c)
      ? { html: `<span style="color:var(--gold)">${note}</span>`, disabled: false }
      : { html: '', disabled: true })}</div>
     <button class="btn btn-primary" onclick="renderMapEvent()">← Back</button>`;
}

// Choose one of a few new cards. onPick is the name of a global function taking an offer index.
let eventOffer = [];
function showEventCardOffer(prompt, cards, onPick) {
  eventOffer = cards;
  document.getElementById('event-result').textContent = prompt;
  document.getElementById('event-options').innerHTML =
    `<div class="special-cards">${cards.map((c, i) => specialCardHtml(c, `${onPick}(${i})`)).join('')}</div>
     <button class="btn btn-primary" onclick="renderMapEvent()">← Back</button>`;
}

function randomCardsWhere(filter, n) {
  return shuffle(CARD_POOL.filter(c => filter(c) && copiesInDeck(c.id) < MAX_COPIES)).slice(0, n).map(c => ({ ...c }));
}

// ── Picker callbacks ──

function eventPickHop(i) {
  const c = eventOffer[i];
  const name = c && addCardToDeck(c.id);
  finishEvent(name ? `You rubbed the cones and fell in love. ${name} added to your deck!` : 'Your deck has no room for it.');
}

function eventJudgeRemove(idx) {
  const c = draftState.deck[idx];
  if (!c || !canRemoveCard()) return;
  draftState.deck.splice(idx, 1);
  finishEvent(`"Honestly? Drop the ${c.name}." You take the judge's advice.`);
}

function eventSellToHomebrewer(idx) {
  const c = draftState.deck[idx];
  if (!c || !canRemoveCard()) return;
  draftState.deck.splice(idx, 1);
  mapState.gold += 20;
  finishEvent(`The homebrewer happily buys your ${c.name}. +20 gold.`);
}

function eventStudyRecipe(idx) {
  const c = draftState.deck[idx];
  if (!c || c._upgraded) return;
  const bonus = upgradeDeckCard(c);
  finishEvent(`The old notes reveal a trick. ${c.name} upgraded (+${bonus}).`);
}

// ── The events ──

const EXTRA_EVENTS = [
  {
    title: '❄️ Glycol Chiller Breakdown',
    desc: 'Your glycol chiller dies mid-fermentation and the tanks are warming up fast.',
    options: [
      { label: 'Emergency repair (−40 gold)', can: () => mapState.gold >= 40,
        action: () => { mapState.gold -= 40; return 'The tech arrives just in time. Crisis averted.'; } },
      { label: 'Ride it out (a random yeast becomes Voss Kveik)',
        can: () => draftState.deck.some(c => c.cat === 'yeast' && c.id !== 'kveik'),
        action: () => {
          const i = randomDeckIndex(c => c.cat === 'yeast' && c.id !== 'kveik');
          const old = draftState.deck[i].name;
          draftState.deck.splice(i, 1, { ...getCardDef('kveik') });
          return `It got hot... but ${old} mutated into something that loves the heat: Voss Kveik!`;
        } },
      { label: 'Let it go (−8 Reputation)', action: () => `A few batches came out rough. ${loseRep(8)}` },
    ],
  },
  {
    title: '🎖️ A Beer Judge Drops By',
    desc: 'A certified beer judge walks into your taproom and orders a flight.',
    options: [
      { label: 'Pour your best (upgrade a random card)',
        can: () => draftState.deck.some(c => !c._upgraded),
        action: () => {
          const c = draftState.deck[randomDeckIndex(c => !c._upgraded)];
          const bonus = upgradeDeckCard(c);
          return `"That ${c.name} is excellent." Upgraded (+${bonus}).`;
        } },
      { label: 'Ask for honest feedback (remove a card of your choice)', can: () => canRemoveCard(),
        picker: () => showEventDeckPicker('Which card does the judge tell you to drop?', () => true, 'eventJudgeRemove', 'drop') },
      { label: 'Just talk shop (+6 Reputation)', action: () => `Word gets around that you know your stuff. ${gainRep(6)}` },
    ],
  },
  {
    title: '🌿 Hop Farm Tour',
    desc: 'A hop grower invites you out for the harvest. The air smells incredible.',
    options: [
      { label: 'Rub some cones (choose 1 of 3 hops)',
        can: () => draftState.deck.length < MAX_DECK_SIZE,
        picker: () => showEventCardOffer('Pick a hop to take home:', randomCardsWhere(c => c.cat === 'hop', 3), 'eventPickHop') },
      { label: 'Buy from the farm (−30 gold, 2 random hops)',
        can: () => mapState.gold >= 30 && draftState.deck.length < MAX_DECK_SIZE - 1,
        action: () => {
          mapState.gold -= 30;
          const got = randomCardsWhere(c => c.cat === 'hop', 2).map(c => addCardToDeck(c.id)).filter(Boolean);
          return got.length ? `Fresh off the bine: ${got.join(' and ')}.` : 'They were sold out. You got your gold back.';
        } },
      { label: 'Just enjoy the view', action: () => 'A lovely afternoon. Nothing gained, nothing lost.' },
    ],
  },
  {
    title: '🏭 Contract Brewing Offer',
    desc: 'A big brewery wants to rent your spare tank time to brew their light lager.',
    options: [
      { label: 'Take the money (+60 gold, −10 Reputation)', can: () => mapState.rep > 10,
        action: () => { mapState.gold += 60; return `+60 gold. Some regulars noticed. ${loseRep(10)}`; } },
      { label: 'Politely decline', action: () => 'Your tanks, your beer.' },
    ],
  },
  {
    title: '🧑‍🔬 A Homebrewer Asks for Advice',
    desc: 'An eager homebrewer corners you with a notebook full of questions.',
    options: [
      { label: 'Mentor them (+8 Reputation)', action: () => `They go on to brag about you to everyone. ${gainRep(8)}` },
      { label: 'Sell them some spare ingredients (remove a card, +20 gold)', can: () => canRemoveCard(),
        picker: () => showEventDeckPicker('What do you sell them?', () => true, 'eventSellToHomebrewer', 'sell +20') },
      { label: "You're too busy", action: () => 'Maybe next time.' },
    ],
  },
  {
    title: '⚡ Power Outage',
    desc: 'The lights flicker and die halfway through brew day.',
    options: [
      { label: 'Rent a generator (−30 gold)', can: () => mapState.gold >= 30,
        action: () => { mapState.gold -= 30; return 'Back up and running. The batch is saved.'; } },
      { label: 'Wait it out (−6 Reputation)', action: () => `You dump a stalled batch. ${loseRep(6)}` },
    ],
  },
  {
    title: '💦 Spilled Fermenter',
    desc: 'A fermenter tips over. There is beer everywhere.',
    options: [
      { label: 'Salvage what you can (lose a random yeast)',
        can: () => canRemoveCard() && draftState.deck.some(c => c.cat === 'yeast'),
        action: () => { const [c] = draftState.deck.splice(randomDeckIndex(c => c.cat === 'yeast'), 1); return `${c.name} is gone, but the floor is clean.`; } },
      { label: 'Rebrew it (−25 gold)', can: () => mapState.gold >= 25,
        action: () => { mapState.gold -= 25; return 'Same recipe, second try. Nobody will know.'; } },
      { label: 'Mop up and move on (−5 Reputation)', action: () => `Tasters notice the missing beer. ${loseRep(5)}` },
    ],
  },
  {
    title: '🎉 Release Party',
    desc: 'Your newest beer is ready. Throw a party?',
    options: [
      { label: 'Go all out (−30 gold, +12 Reputation)', can: () => mapState.gold >= 30,
        action: () => { mapState.gold -= 30; return `The line goes around the block. ${gainRep(12)}`; } },
      { label: 'Keep it low-key (+4 Reputation)', action: () => `A few regulars stop by. ${gainRep(4)}` },
    ],
  },
  {
    title: '🧪 A Mysterious Yeast Vial',
    desc: 'In the back of the fridge: an old vial labeled only "DO NOT OPEN".',
    options: [
      { label: 'Pitch it (50%: a rare yeast · 50%: Brettanomyces and −5 Reputation)',
        can: () => draftState.deck.length < MAX_DECK_SIZE,
        action: () => {
          if (Math.random() < 0.5) {
            const pick = randomCardsWhere(c => c.cat === 'yeast' && c.rarity === 'rare', 1)[0];
            const name = pick && addCardToDeck(pick.id);
            return name ? `It's something special: ${name}!` : 'It was... just regular yeast.';
          }
          const name = addCardToDeck('brett');
          return `It's wild. Very wild. ${name ? name + ' added. ' : ''}${loseRep(5)}`;
        } },
      { label: 'Toss it', action: () => 'Probably for the best.' },
    ],
  },
  {
    title: '⚙️ Grain Mill Malfunction',
    desc: 'Your mill is crushing too fine and the mash keeps getting stuck.',
    options: [
      { label: 'Fix the mill (−35 gold)', can: () => mapState.gold >= 35,
        action: () => { mapState.gold -= 35; return 'Gap reset. Perfect crush.'; } },
      { label: 'Add rice hulls (a Rice Hulls card joins your deck)',
        can: () => draftState.deck.length < MAX_DECK_SIZE && copiesInDeck('ricehulls') < MAX_COPIES,
        action: () => `Old brewer's trick. ${addCardToDeck('ricehulls')} added to your deck.` },
      { label: 'Deal with it (−6 Reputation)', action: () => `Long, sticky brew days. ${loseRep(6)}` },
    ],
  },
  {
    title: '🏅 Regional Competition Results',
    desc: 'A beer you entered months ago just placed at a regional competition!',
    options: [
      { label: 'Take the medal (+12 Reputation)', action: () => `Gold medal on the wall. ${gainRep(12)}` },
      { label: 'Take the prize money (+50 gold)', action: () => { mapState.gold += 50; return '+50 gold. The medal goes in a drawer.'; } },
    ],
  },
  {
    title: '📓 A Retired Brewer\'s Notebook',
    desc: 'At a flea market you find a dusty notebook full of recipes and margin notes.',
    options: [
      { label: 'Study it (upgrade a card of your choice)', can: () => draftState.deck.some(c => !c._upgraded),
        picker: () => showEventDeckPicker('Which card do the notes improve?', c => !c._upgraded, 'eventStudyRecipe', 'upgrade') },
      { label: 'Sell it to a collector (+35 gold)', action: () => { mapState.gold += 35; return '+35 gold. Someone will treasure it.'; } },
    ],
  },
  {
    title: '🛢️ Barrel Broker',
    desc: 'A broker is offloading freshly emptied bourbon barrels.',
    options: [
      { label: 'Buy one (−40 gold, age a card in it now)', can: () => mapState.gold >= 40 && canRemoveCard(),
        picker: () => { mapState.barrelBroker = true; showBarrelRoom(); } },   // charged only if you age a card
      { label: 'Pass', action: () => 'Maybe next time.' },
    ],
  },
];

// Join the built-in events, and pick ones you haven't seen this run where possible
MAP_EVENTS.push(...EXTRA_EVENTS);

function pickMapEvent() {
  mapState.seenEvents = mapState.seenEvents || [];
  let pool = MAP_EVENTS.filter(e => !mapState.seenEvents.includes(e.title));
  if (!pool.length) { mapState.seenEvents = []; pool = MAP_EVENTS; }
  const ev = pool[Math.floor(Math.random() * pool.length)];
  mapState.seenEvents.push(ev.title);
  return ev;
}

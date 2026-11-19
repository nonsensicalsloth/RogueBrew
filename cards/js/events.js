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
  return shuffle(CARD_POOL.filter(c => filter(c) && c.rarity !== 'legendary' && copiesInDeck(c.id) < MAX_COPIES)).slice(0, n).map(c => ({ ...c }));
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
    title: 'Contract Brewing Offer',
    desc: 'A big brewery wants to rent your spare tank time to brew their light lager.',
    options: [
      { label: 'Squeeze it in (+60 gold, 1 in 4 chance the batch goes bad)',
        action: () => {
          if (Math.random() < 0.25) return `The batch picked up an infection and they refuse to pay. ${loseRep(8)}`;
          mapState.gold += 60;
          return 'A clean batch, paid in full. +60 gold.';
        } },
      { label: 'Brew it with extra care (+35 gold)',
        action: () => { mapState.gold += 35; return 'Slow and careful. Nothing goes wrong. +35 gold.'; } },
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
    title: 'Wrong Tri-Clamp',
    desc: 'Someone undoes the wrong tri-clamp and a valve fell off a full fermenter. There is beer everywhere.',
    options: [
      { label: 'Salvage what you can (lose a random yeast)',
        can: () => canRemoveCard() && draftState.deck.some(c => c.cat === 'yeast'),
        action: () => { const [c] = draftState.deck.splice(randomDeckIndex(c => c.cat === 'yeast'), 1); return `${c.name} went down the floor drain, but at least the floor is clean.`; } },
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
      { get label() { return `Buy one (−40 gold): barrel a card. It returns in ${BARREL_STOPS} stops with +${BARREL_BONUS} and the oaky tag`; }, can: () => mapState.gold >= 40 && canRemoveCard(),
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

// ═════════════ Wild Cellar: a wild option for every event ═════════════
// Each event gets its own on-theme gamble or trade. Keyed by the event title without its icon.

const WILD_CARDS      = ['brett', 'pedio', 'lacto', 'sourvisiae', 'roeselare', 'gueuze'];
const WILD_RARE_CARDS = ['brett', 'roeselare', 'gueuze'];
const coin = (p = 0.5) => Math.random() < p;

// Wild touches stick to the card for the run (saved via refreshRunCard)
function wildTouch(c, tags, pts) {
  c._wildTags = c._wildTags || [];
  (tags || []).forEach(t => { if (!c.tags.includes(t)) { c.tags = [...c.tags, t]; c._wildTags.push(t); } });
  if (pts) { c.points += pts; c._wildBonus = (c._wildBonus || 0) + pts; }
  return c;
}
// Contamination from a wild option is shuffled into your NEXT battle only
function wildContaminate(n = 1) {
  mapState.pendingContam = (mapState.pendingContam || 0) + n;
  return `A Contamination will creep into your next battle.`;
}
function addWildCard(ids) {
  const pick = shuffle(ids.filter(id => getCardDef(id) && copiesInDeck(id) < MAX_COPIES));
  for (const id of pick) { const n = addCardToDeck(id); if (n) return n; }
  return null;
}
const deckHas = f => draftState.deck.some(f);
const pickDeck = f => { const i = randomDeckIndex(f); return i >= 0 ? draftState.deck[i] : null; };

const WILD_EVENT_OPTIONS = {
  'Mystery Grain Delivery': {
    label: '🦠 Spontaneously ferment it (50%: a random wild card · 50%: Contamination in your next battle)',
    action: () => { if (coin()) { const n = addWildCard(WILD_RARE_CARDS); if (n) return `Something wonderful moved in. ${n} added to your deck!`; }
      return `It smells... off. ${wildContaminate()}`; } },
  'Hop Shortage': {
    label: '🦠 Use the aged hops in the attic (a hop of your choice gains funky and +6)',
    can: () => deckHas(c => c.cat === 'hop'),
    picker: () => showEventDeckPicker('Which hop gets the aged-hop treatment?', c => c.cat === 'hop', 'wildAgedHop', 'funky +6') },
  'Brewery Inspection': {
    label: '🦠 Show them the coolship (50%: +10 Reputation, +20 gold · 50%: lose a random card, −5 Reputation)',
    action: () => { if (coin()) { mapState.gold += 20; return `The inspector is fascinated and asks for a tour. +20 gold. ${gainRep(10)}`; }
      if (canRemoveCard()) { const [c] = draftState.deck.splice(randomDeckIndex(() => true), 1); return `"Open fermentation? Absolutely not." ${c.name} is confiscated. ${loseRep(5)}`; }
      return `"Open fermentation? Absolutely not." ${loseRep(5)}`; } },
  'Fermentation Festival': {
    label: '🦠 Enter a spontaneous ale (50%: +50 gold and a random wild card · 50%: −8 Reputation)',
    action: () => { if (coin()) { mapState.gold += 50; const n = addWildCard(WILD_CARDS); return `Best in show! +50 gold${n ? ` and ${n} for your deck` : ''}.`; }
      return `The judges called it "challenging." ${loseRep(8)}`; } },
  'Bulk Grain Deal': {
    label: '🦠 Take the rained-on sacks (2 free base malts with the funky tag · 50%: Contamination in your next battle)',
    can: () => draftState.deck.length < MAX_DECK_SIZE,
    action: () => {
      const got = randomCardsWhere(c => c.cat === 'malt' && c.tags.includes('neutral') || ['2row','pilsner','paleale','marisotter','6row'].includes(c.id), 2)
        .map(c => { const n = addCardToDeck(c.id); if (n) wildTouch(draftState.deck[draftState.deck.length - 1], ['funky'], 0); return n; }).filter(Boolean);
      const bad = coin() ? ` ${wildContaminate()}` : '';
      return `${got.length ? `Free malt: ${got.join(' and ')}, a little funky.` : 'No room for them.'}${bad}`; } },
  'Glycol Chiller Breakdown': {
    label: '🦠 Let it free-rise warm (a random yeast becomes Brett or Roeselare · −5 Reputation)',
    can: () => deckHas(c => c.cat === 'yeast' && !['brett', 'roeselare'].includes(c.id)),
    action: () => {
      const i = randomDeckIndex(c => c.cat === 'yeast' && !['brett', 'roeselare'].includes(c.id));
      const old = draftState.deck[i].name, id = coin() ? 'brett' : 'roeselare';
      draftState.deck.splice(i, 1, { ...getCardDef(id), tags: [...getCardDef(id).tags] });
      return `The tanks got warm and wild. ${old} turned into ${getCardDef(id).name}. ${loseRep(5)}`; } },
  'A Beer Judge Drops By': {
    label: '🦠 Pour them your sour experiment (50%: upgrade 2 random cards, +5 Reputation · 50%: −10 Reputation)',
    action: () => { if (coin()) { const ups = [];
        for (let k = 0; k < 2; k++) { const c = pickDeck(c => !c._upgraded); if (c) { upgradeDeckCard(c); ups.push(c.name); } }
        return `"Now THIS is interesting." ${ups.length ? `Upgraded ${ups.join(' and ')}. ` : ''}${gainRep(5)}`; }
      return `They make a face and leave half the glass. ${loseRep(10)}`; } },
  'Hop Farm Tour': {
    label: '🦠 Forage the wild hedgerow (choose 1 of 3 hops with funky and +3 · 25%: Contamination in your next battle)',
    can: () => draftState.deck.length < MAX_DECK_SIZE,
    picker: () => showEventCardOffer('Pick a wild hop from the hedgerow:', randomCardsWhere(c => c.cat === 'hop', 3), 'wildPickHedgeHop') },
  'Contract Brewing Offer': {
    label: '🦠 Sneak your house culture in (50%: +80 gold · 50%: no pay, −10 Reputation)',
    action: () => coin() ? (mapState.gold += 80, 'They loved the "accident" and paid a bonus. +80 gold!')
                         : `Their light lager came out sour. No pay. ${loseRep(10)}` },
  'A Homebrewer Asks for Advice': {
    label: '🦠 Trade cultures (gain Brett, Pediococcus, Lactobacillus or Sourvisiae; give them a card)',
    can: () => canRemoveCard(),
    picker: () => showEventDeckPicker('What do you give them in return?', () => true, 'wildTradeCultures', 'trade') },
  'Power Outage': {
    label: '🦠 Open the windows to the night air (50%: a random card gains funky and +5 · 50%: Contamination in your next battle)',
    action: () => { const c = coin() && pickDeck(c => c.cat !== 'token');
      if (c) { wildTouch(c, ['funky'], 5); return `Wild microbes drifted in and settled into ${c.name}: funky, +5.`; }
      return `Something drifted in that you didn't want. ${wildContaminate()}`; } },
  'Wrong Tri-Clamp': {
    label: '🦠 Blend the spill into the solera (50%: a random oaky or sour card gets +8 · 50%: lose a random yeast)',
    action: () => { const c = coin() && pickDeck(c => c.tags.includes('oaky') || c.tags.includes('sour'));
      if (c) { wildTouch(c, [], 8); return `The blend came out beautiful. ${c.name} gets +8.`; }
      if (canRemoveCard() && deckHas(c => c.cat === 'yeast')) { const [y] = draftState.deck.splice(randomDeckIndex(c => c.cat === 'yeast'), 1); return `The solera rejected it. ${y.name} is lost.`; }
      return 'The blend went nowhere, but nothing was lost.'; } },
  'Release Party': {
    label: '🦠 Pour the funky stuff (50%: +15 Reputation, +20 gold · 50%: −6 Reputation)',
    action: () => coin() ? (mapState.gold += 20, `The sour fans showed up in force. +20 gold. ${gainRep(15)}`)
                         : `Half the crowd wanted a lager. ${loseRep(6)}` },
  'A Mysterious Yeast Vial': {
    label: '🦠 Pitch it into a barrel (a random wild yeast, barrel-aged; it sits out 3 stops)',
    can: () => draftState.deck.length < MAX_DECK_SIZE,
    action: () => {
      const id = shuffle(['brett', 'roeselare', 'pedio'])[0];
      const c = { ...getCardDef(id), tags: [...getCardDef(id).tags] };
      c._barrelReturn = (mapState.nodeCount || 0) + BARREL_STOPS + 1;
      mapState.barrel = mapState.barrel || []; mapState.barrel.push(c);
      return `You pitch the vial into an oak barrel. It turns out to be ${c.name}. Back in ${BARREL_STOPS} stops, barrel-aged.`; } },
  'Grain Mill Malfunction': {
    label: '🦠 Turbid mash it, lambic style (50%: 2 random malts gain funky and +4 · 50%: −6 Reputation)',
    action: () => { if (coin()) { const got = [];
        for (let k = 0; k < 2; k++) { const c = pickDeck(c => c.cat === 'malt' && !got.includes(c)); if (c) { wildTouch(c, ['funky'], 4); got.push(c); } }
        return got.length ? `Cloudy, starchy and perfect for a lambic. ${got.map(c => c.name).join(' and ')} gain funky, +4.` : 'No malts to mash.'; }
      return `It just made a mess. ${loseRep(6)}`; } },
  'Regional Competition Results': {
    label: '🦠 Re-enter in the wild category (50%: +20 Reputation, +50 gold · 50%: nothing)',
    action: () => coin() ? (mapState.gold += 50, `Gold in Wild Ale! +50 gold. ${gainRep(20)}`) : 'No placing this time. At least you tried.' },
  "A Retired Brewer's Notebook": {
    label: '🦠 Read the stained pages (a card of your choice gains sour, funky and +6 · 25%: a random card gets it instead)',
    picker: () => showEventDeckPicker('Which recipe do the stained pages describe?', c => c.cat !== 'token', 'wildNotebook', 'sour funky +6') },
  'Barrel Broker': {
    get label() { return `🦠 Fill it with your house culture (−40 gold: barrel a card. Back in ${BARREL_STOPS} stops with +16, oaky and funky · 25%: only +5)`; },
    can: () => mapState.gold >= 40 && canRemoveCard(),
    picker: () => { mapState.barrelBroker = true; mapState.barrelCulture = true; showBarrelRoom(); } },
};

function wildAgedHop(idx) {
  const c = draftState.deck[idx]; if (!c || c.cat !== 'hop') return;
  wildTouch(c, ['funky'], 6);
  finishEvent(`Cheesy, aged and perfect for a lambic. ${c.name} gains funky, +6.`);
}
function wildPickHedgeHop(i) {
  const c = eventOffer[i];
  const n = c && addCardToDeck(c.id);
  if (!n) { finishEvent('Your deck has no room for it.'); return; }
  wildTouch(draftState.deck[draftState.deck.length - 1], ['funky'], 3);
  finishEvent(`Wild ${n} added, funky, +3.${coin(0.25) ? ' ' + wildContaminate() : ''}`);
}
function wildTradeCultures(idx) {
  const c = draftState.deck[idx]; if (!c || !canRemoveCard()) return;
  draftState.deck.splice(idx, 1);
  const n = addWildCard(['brett', 'pedio', 'lacto', 'sourvisiae']);
  finishEvent(`You hand over ${c.name}${n ? ` and get a jar of ${n} in return` : ', but they had nothing you could take'}.`);
}
function wildNotebook(idx) {
  let c = draftState.deck[idx]; if (!c) return;
  const smudged = coin(0.25);
  if (smudged) c = pickDeck(x => x.cat !== 'token') || c;
  wildTouch(c, ['sour', 'funky'], 6);
  finishEvent(smudged ? `The page was smudged. It turned out to describe ${c.name}: sour, funky, +6.` : `${c.name} gains sour and funky, +6.`);
}

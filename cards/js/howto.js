// howto.js — the How to Play guide on the title screen.
// Numbers are read from the game's own settings, so the guide stays accurate
// when rules change (deck size, turns, bonuses, rest healing...).

const HOWTO_PAGES = [
  { id: 'goal',   title: 'The Goal' },
  { id: 'deck',   title: 'Your Deck' },
  { id: 'cards',  title: 'Reading a Card' },
  { id: 'tags',   title: 'Tags & Synergy' },
  { id: 'battle', title: 'Battles' },
  { id: 'map',    title: 'The Map' },
  { id: 'run',    title: 'Reputation & Runs' },
  { id: 'unlock', title: 'Collecting Cards' },
];

let howtoPage = 0;

function showHowTo(page = 0) {
  howtoPage = page;
  setScreen('howto-screen');
  renderHowTo();
}

function howtoGo(delta) {
  howtoPage = Math.max(0, Math.min(HOWTO_PAGES.length - 1, howtoPage + delta));
  renderHowTo();
}

function renderHowTo() {
  const page = HOWTO_PAGES[howtoPage];
  document.getElementById('howto-tabs').innerHTML = HOWTO_PAGES.map((p, i) =>
    `<button class="btn filter-chip ${i === howtoPage ? 'active-tab' : ''}" onclick="showHowTo(${i})">${i + 1}. ${p.title.toUpperCase()}</button>`
  ).join('');
  document.getElementById('howto-body').innerHTML =
    `<div class="howto-heading">${page.title}</div>` + HOWTO_CONTENT[page.id]();
  document.getElementById('howto-nav').innerHTML = `
    <button class="btn btn-primary" ${howtoPage === 0 ? 'style="opacity:0.4;cursor:not-allowed;"' : 'onclick="howtoGo(-1)"'}>← PREV</button>
    <span style="font-size:7px;color:var(--dim);">${howtoPage + 1} / ${HOWTO_PAGES.length}</span>
    ${howtoPage === HOWTO_PAGES.length - 1
      ? '<button class="btn btn-gold" onclick="showTitleScreen()">DONE ✓</button>'
      : '<button class="btn btn-gold" onclick="howtoGo(1)">NEXT →</button>'}`;
}

// Small helpers for laying out the guide
const hp  = text => `<p class="howto-p">${text}</p>`;
const hli = items => `<ul class="howto-list">${items.map(i => `<li>${i}</li>`).join('')}</ul>`;
const hbox = (title, text) => `<div class="howto-box"><div class="howto-box-title">${title}</div>${text}</div>`;
const tag = t => `<span class="card-tag tag-${t}">${t}</span>`;

function exampleCard(id) {
  const c = getCardDef(id);
  return c ? cardHtml(c, 0, 'view') : '';
}

const HOWTO_CONTENT = {
  goal: () =>
    hp(`You run a brewery. Each <b>run</b>, you take one deck across <b>3 acts</b> of competitions, beating rival brewers until you face each act's <b>boss</b>.`) +
    hp(`Every battle is a judging: you and a rival brew at the same time, and whoever's beer scores the most points wins.`) +
    hli([
      `Win the third act's boss and you're the champion.`,
      `Lose too many judgings and your <b>Reputation</b> runs out, ending the run.`,
      `Along the way you grow your deck, collect equipment (relics), and unlock new cards forever.`,
    ]),

  deck: () =>
    hp(`Before a run, build a deck in <b>Build Deck</b>.`) +
    hli([
      `A starting deck is exactly <b>${DECK_SIZE} cards</b>, with up to <b>${MAX_COPIES} copies</b> of any card.`,
      `You can save <b>${MAX_DECKS} decks</b> and give each a name, like "Hazy IPA" or "Imperial Stout".`,
      `Cards are grouped by ingredient: Malt, Adjunct, Hop, Yeast and Process. Use the cost and rarity filters to find what you need.`,
      `Greyed-out cards with a 🔒 aren't in your collection yet (see <b>Collecting Cards</b>).`,
    ]) +
    hbox('Choose a brewery', hp(`When you start a run you pick a brewery. Each has a <b>passive</b> bonus, a once-per-turn <b>ability</b> button in battle, and a <b>run perk</b>. Any deck works with any brewery.`) +
      hli(BREWERIES.filter(b => b.unlocked).map(b => `${b.icon} <b>${b.name}</b>: ${b.subtitle}`))),

  cards: () =>
    `<div class="howto-split"><div class="howto-example">${exampleCard('cascade')}</div><div>` +
    hli([
      `<b>Top left (blue):</b> cost. You spend budget to play it. It glows green when a discount applies.`,
      `<b>Top right:</b> points it adds to your score. On some cards it updates live, green if better than printed, red if worse.`,
      `<b>Coloured strip:</b> rarity. Grey is common, blue is uncommon, gold is rare.`,
      `<b>Tags:</b> the card's flavours (next page).`,
      `<b>Text:</b> what it does when played.`,
      `<b>Bottom:</b> where it can go: <b>HOT SIDE</b>, <b>COLD SIDE</b>, or <b>HOT/COLD</b>.`,
    ]) + `</div></div>` +
    hbox('The two sides of your brewery',
      hli([
        `<b>Hot side</b> is the mash and boil: malts, bittering hops, most adjuncts.`,
        `<b>Cold side</b> is fermentation and dry hopping: yeasts, aroma hops, some fruit and coffee.`,
        `Some cards get a bonus for <b>Boil (hot side)</b> or <b>Dry hop (cold side)</b>.`,
      ])) +
    hbox('Card types',
      hli([
        `🌾 <b>Malt</b>: the backbone. Steady points, hot side.`,
        `🌿 <b>Hop</b>: flexible and synergy-heavy. Either side.`,
        `🧫 <b>Yeast</b>: cold side, and <b>gains +2 points every turn</b> it's on the board, so play it early.`,
        `✦ <b>Adjunct</b>: fruit, sugar, spices and more. Flavour and support.`,
        `⚙️ <b>Process</b>: brewing tricks. Most score nothing, do their effect, and draw you a card.`,
      ])),

  tags: () =>
    hp(`Tags are flavour labels like ${tag('citrus')} ${tag('roasty')} ${tag('sweet')} ${tag('crisp')}. On their own they do nothing; <b>other cards care about them</b>.`) +
    hli([
      `Motueka gets <b>+2 for each other ${tag('citrus')} card</b> on your board.`,
      `Vanilla gives <b>+2 to every other ${tag('sweet')} card</b>.`,
      `Lactobacillus <b>loses points for each ${tag('bitter')} card</b>, since bacteria hate hops.`,
    ]) +
    hp(`Building around a few tags that feed each other is how big scores happen.`) +
    hbox('Special tags',
      hli([
        `${tag('c-hop')} Two or more c-hops on the <b>same side</b> each score <b>double</b>.`,
        `${tag('nuanced')} Two or more nuanced cards <b>multiply</b> each other (up to ×3).`,
        `${tag('noble')} The classic lager hops. Lager yeasts reward them.`,
        `${tag('thiol')} Hidden tropical flavour that a thiol-releasing yeast unlocks for a big bonus.`,
        `${tag('oaky')} Barrel-aged cards. Barrel Transfer loves them.`,
      ])) +
    hbox('🍺 Complete Beer',
      hp(`You can't brew beer without malt, hops and yeast. Have at least one <b>malt, hop and yeast</b> on your board for <b>+${COMPLETE_BEER_BONUS}</b>. Add an <b>adjunct</b> too for a Specialty Beer: <b>+${SPECIALTY_BEER_BONUS}</b> more. The info bar shows what you're missing.`)) +
    hbox('🔥 Roast',
      hp(`Dark malts add <b>roast tokens</b>. Hit the roast limit (shown in the info bar, normally 5) and your <b>hot side scores half</b>. Some cards raise the limit or remove roast.`)),

  battle: () =>
    hli([
      `A round lasts <b>${MAX_TURNS} turns</b>. Your budget each turn equals the turn number, up to <b>5</b>.`,
      `You start with 5 cards (you can send back up to 2), then <b>draw 1 each turn</b>. When your deck runs out, your discard pile is shuffled back in.`,
      `<b>To play a card:</b> click it in your hand, then click the side you want.`,
      `Click <b>END TURN</b> when you're done. Then the rival brews, and the panel above your hand shows what they did.`,
      `<b>RIVAL NEXT</b>, above the rival's board, shows what they've committed to playing on their turn: ingredient icons, which side (H or C), roughly how many points, and any ⚔️ attacks coming your way. Plan around it.`,
      `Cards stay on the board all round. Highest total score at the end wins.`,
    ]) +
    hbox('Things to watch for',
      hli([
        `⚠️ <b>Contamination</b> goes into your hand when drawn and <b>must be poured onto your cold side</b> before you can do anything else. A clean yeast softens it.`,
        `Some cards ask you to <b>choose a card on your board</b>. Valid choices glow gold.`,
        `Your brewery <b>ability button</b> sits next to End Turn. You can use it once per turn.`,
        `Rivals can fight back: removing your best card, scorching it with chili, or contaminating you.`,
      ])) +
    hbox('💀 Boss judgings',
      hp(`Bosses are <b>best of 3 rounds</b>, each judged differently: <b>👃 Aroma</b> (cold side ×2), <b>👅 Flavor</b> (hot side ×2), then <b>🏆 Overall Impression</b>. Cards left in your hand carry into the next round. Each boss also has a signature rule; hover the boss on the map to see it.`)),

  map: () =>
    hp(`Each act is a map of <b>${MAP_FLOORS} floors</b> plus the boss. Pick a starting room, then move down one floor at a time along the lines. Gold lines show where you can go next. Plan your route: you can see the whole act.`) +
    `<div class="howto-rooms">` + Object.keys(NODE_NAMES).map(t =>
      `<div class="howto-room"><span style="color:${NODE_COLORS[t]}">${NODE_ICONS[t]}</span><div><b>${NODE_NAMES[t]}</b><br>${HOWTO_ROOM_TEXT[t] || ''}</div></div>`
    ).join('') + `</div>`,

  run: () =>
    hbox(`⭐ Reputation (starts at ${START_REP})`,
      hli([
        `Lose a normal battle and you lose Reputation. <b>Close losses cost little, blowouts cost a lot</b> (5 to 35).`,
        `<b>Bosses must be won.</b> Losing a boss judging ends the run.`,
        `Reach 0 Reputation and the run is over.`,
        `Recover it at <b>Rest Stops</b> (+${REST_HEAL}) and by beating a boss (+${BOSS_HEAL}).`,
      ])) +
    hbox('Growing your deck',
      hli([
        `Win battles to earn gold and pick a new card.`,
        `Drafts, shops, collabs and events add and change cards.`,
        `Upgrade or remove cards at rest stops and shops. A lean deck draws its best cards more often. You can't go below ${MIN_DECK_SIZE} cards.`,
        `Beat an act boss to choose a piece of <b>brewing equipment</b>, a permanent bonus for the run.`,
      ])) +
    hbox('Saving',
      hp(`Your run saves automatically. Close the game and pick <b>▶ CONTINUE RUN</b> on the title screen to carry on. A battle you leave will restart from the beginning.`)),

  unlock: () =>
    hli([
      `You start with every <b>common</b> card (${CARD_POOL.filter(c => c.rarity === 'common').length} of ${CARD_POOL.length}).`,
      `<b>Uncommon</b> and <b>rare</b> cards appear in runs as rewards, drafts and shop stock. You can use them in that run straight away.`,
      `<b>Buy one in a shop</b> and it's unlocked <b>forever</b>, so you can build decks with it. Look for "🔓 UNLOCKS FOREVER" on shop cards.`,
      `Drafted and reward cards don't unlock; only shop purchases do.`,
      `Your progress shows on the title screen and in the deck builder.`,
    ]) +
    hbox('Rarity',
      hli([
        `<b>Common</b>: the basics. Reliable, and most of what you'll see.`,
        `<b>Uncommon</b>: synergy builders and special ingredients.`,
        `<b>Rare</b>: powerful build-around cards. Beer Festivals are the best place to find them.`,
      ])),
};

const HOWTO_ROOM_TEXT = {
  battle:   'A judging against a rival brewery. Win gold and a card.',
  festival: 'A tougher rival with the crowd on their side. Better prizes: uncommons and rares.',
  boss:     'The act boss. Best of 3, with a special rule. Must be won.',
  draft:    'Pick one of several cards to add to your deck.',
  shop:     'Buy cards (and unlock them forever) or pay to remove one.',
  event:    'A random situation with choices and gambles.',
  rest:     'Recover Reputation, upgrade a card, or remove one.',
  barrel:   'Age a card for 3 stops. It returns stronger and oaky.',
  collab:   'Trade one of your cards for one from a themed brewery.',
  lab:      'Turn a card into a random card of the same type.',
  taproom:  'Sell beer for gold. Pays more if your deck has a signature flavour.',
  contract: 'Pay now so your next card offer is all one type you choose.',
};

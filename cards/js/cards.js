// cards.js — card definitions and deck building
// Add new cards here. Each card needs:
//   id, name, cat (malt/hop/yeast/adjunct), lane (hot/cold/both),
//   points, cost, tags[], desc (optional, for tooltips later)

const CARD_POOL = [
  // ── Base Malts ──
  { id:'2row',     name:'2-Row Malt',      cat:'malt',    lane:'hot',  points:10, cost:1, tags:['toasty'],          desc:'Simple base. Clean and reliable.' },
  { id:'pilsner',  name:'Pilsner Malt',    cat:'malt',    lane:'hot',  points:14, cost:1, tags:['crisp'],           desc:'Light crisp base malt.' },

  // ── Crystal / Caramel Malts ──
  { id:'crystal',  name:'Crystal 40',      cat:'malt',    lane:'hot',  points:10, cost:2, tags:['sweet'],           desc:'+sweet tag. Adds body.' },
  { id:'caramun',  name:'Caramunich',      cat:'malt',    lane:'hot',  points:12, cost:2, tags:['sweet','toasty'],  desc:'Rich caramel and bread.' },

  // ── Dark Malts ──
  { id:'choc',     name:'Chocolate Malt',  cat:'malt',    lane:'hot',  points:18, cost:3, tags:['toasty','roasty'], desc:'Deep roasty character.' },
  { id:'patent',   name:'Black Patent',    cat:'malt',    lane:'hot',  points:20, cost:2, tags:['roasty'],          desc:'High score, heavy roast.' },

  // ── Adjuncts ──
  { id:'oats',     name:'Flaked Oats',     cat:'adjunct', lane:'hot',  points:8,  cost:1, tags:['smooth'],          desc:'Adds soft body.' },
  { id:'coffee',   name:'Coffee Beans',    cat:'adjunct', lane:'hot',  points:12, cost:3, tags:['toasty','roasty'], desc:'Doubles dark malt value.' },
  { id:'maltodex', name:'Maltodextrin',    cat:'adjunct', lane:'hot',  points:6,  cost:2, tags:['smooth'],          desc:'Next malt costs 0.' },
  { id:'lactose',  name:'Lactose',         cat:'adjunct', lane:'hot',  points:8,  cost:2, tags:['sweet'],           desc:'Removes 2 roast counters.' },

  // ── Hops (can go hot or cold side) ──
  { id:'cascade',  name:'Cascade Hops',    cat:'hop',     lane:'both', points:10, cost:1, tags:['bitter'],          desc:'C-family synergy.' },
  { id:'citra',    name:'Citra Hops',      cat:'hop',     lane:'both', points:14, cost:2, tags:['bitter','crisp'],  desc:'Draw a card on play.' },
  { id:'mosaic',   name:'Mosaic Hops',     cat:'hop',     lane:'both', points:12, cost:2, tags:['bitter','hazy'],   desc:'Counts as two tags.' },
  { id:'magnum',   name:'Magnum Hops',     cat:'hop',     lane:'both', points:16, cost:3, tags:['bitter'],          desc:'Flat high score, no frills.' },

  // ── Yeast ──
  { id:'brett',    name:'Brett Yeast',     cat:'yeast',   lane:'cold', points:6,  cost:2, tags:['funky'],           desc:'+3 pts per turn on field.' },
  { id:'lacto',    name:'Lacto',           cat:'yeast',   lane:'cold', points:10, cost:1, tags:['crisp'],           desc:'+5 pts next turn only.' },
  { id:'belgian',  name:'Belgian Yeast',   cat:'yeast',   lane:'cold', points:12, cost:3, tags:['sweet','funky'],   desc:'Rich ester profile.' },
  { id:'saison',   name:'Saison Yeast',    cat:'yeast',   lane:'cold', points:10, cost:2, tags:['crisp','funky'],   desc:'Dry spicy finish.' },
  { id:'kveik',    name:'Kveik Yeast',     cat:'yeast',   lane:'cold', points:14, cost:3, tags:['dry','crisp'],     desc:'Fast clean fermentation.' },
];

// ── Default deck composition (30 cards) ──
// Change this list to change the starting deck makeup.
const DEFAULT_DECK_IDS = [
  '2row','2row','2row',
  'pilsner','pilsner','pilsner',
  'crystal','crystal',
  'caramun','caramun',
  'choc','patent',
  'oats','oats',
  'lactose','maltodex',
  'cascade','cascade','cascade',
  'citra','citra',
  'mosaic',
  'brett','brett',
  'lacto','lacto','lacto',
  'belgian',
  'saison','saison',
];

function getCardDef(id) {
  return CARD_POOL.find(c => c.id === id);
}

function buildDeck(idList) {
  // Returns fresh card instances from an id list
  return idList.map(id => ({ ...getCardDef(id) }));
}

function buildDefaultDeck() {
  return buildDeck(DEFAULT_DECK_IDS);
}

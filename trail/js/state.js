// ═══════════════════════════════════════════ GAME STATE
const G = {
  // setup
  role: null,
  playerName: 'Frodo',
  companions: [],
  brew: null,

  // resources
  supplies: { food: 600, coin: 200, parts: 3, ponies: 4, athelas: 2 },
  beer: 100,
  brewSharedWith: [],          // names of allies you poured for (for end screen)

  // travel
  day: 1,
  miles: 0,
  location: 'The Shire',
  arrivalPoint: null,        // sub-location within current landmark (e.g. 'bridge' or 'ferry_landing')
  targetLandmarkName: 'Brandywine River',
  pace: 'steady',
  rations: 'filling',

  // fork system
  currentRoute: null,
  routeOneShotDay: -1,
  routeDaysElapsed: 0,
  pathFlags: {},

  // spy / tracked system
  spyFlag: false,            // currently being tracked? resets after ambush
  totalAmbushes: 0,          // lifetime count of ambush encounters resolved
  sarumanCounter: 0,         // ratchets up on spy/brigand events south of Rivendell

  // health
  health: 100,
  maxHealth: 100,
  illnesses: {},
  starveDays: 0,

  // environment
  weather: null,

  // meta
  tastingNotes: [],
  achievements: [],
  gameOver: false,
  won: false,
};

// Pace: miles/day and food consumption/day per person
const PACE = {
  steady:   { label: 'Steady',   miles: 18, foodMult: 1.0 },
  strenuous:{ label: 'Strenuous',miles: 26, foodMult: 1.2 },
  grueling: { label: 'Grueling', miles: 34, foodMult: 1.4 },
};

// Rations: lbs/person/day
const RATIONS = {
  filling:  { label: 'Filling',  lbs: 3, healthMod: +1 },
  meager:   { label: 'Meager',   lbs: 2, healthMod:  0 },
  bare:     { label: 'Bare Bones', lbs: 1, healthMod: -2 },
};

const ROLES = {
  head_brewer: { label: 'Head Brewer from Michel Delving', coin: 400, mult: 0.7, desc: 'The most coin. Easier start, smaller final score.' },
  assistant:   { label: 'Assistant Brewer from Hobbiton',  coin: 200, mult: 1.0, desc: 'Balanced coin. The middle path.' },
  cellarman:   { label: 'Cellarman from Bywater',          coin: 100, mult: 1.5, desc: 'Least coin. Hardest start, biggest score.' },
};

const CROLES = [
  { rk: 'hop_farmer',   role: 'Hop Farmer',             def: 'Sam'      },
  { rk: 'maltster',     role: 'Maltster',               def: 'Merry'    },
  { rk: 'taproom_hand', role: 'Taproom Hand',           def: 'Pippin'   },
  { rk: 'cellarman_c',  role: 'Cellarman',              def: 'Fredegar' },
  { rk: 'cooper',       role: 'Cooper',                 def: 'Folco'    },
];

// Landmarks. Some entries are alt-path (only reachable on certain routes).
// Travel always targets G.targetLandmarkName, so alt-path entries that the
// current route doesn't aim for are simply skipped over.
const LANDMARKS = [
  { name: 'The Shire',          miles: 0    },
  { name: 'Brandywine River',   miles: 80,   river: 'brandywine' },
  { name: 'Bree',               miles: 200,  town: true },
  { name: 'Weathertop',         miles: 430 },
  { name: 'Hoarwell River',     miles: 560,  river: 'hoarwell' },
  { name: 'Trollshaws',         miles: 615 },
  { name: 'Ford of Bruinen',    miles: 660,  river: 'bruinen' },
  { name: 'Rivendell',          miles: 690,  town: true },

  // ── Three paths from Rivendell ──
  // Path 1: Redhorn Pass → Lothlórien
  { name: 'Redhorn Gate',       miles: 770,  altPath: 'redhorn' },
  { name: 'Caradhras Pass',     miles: 870,  altPath: 'redhorn', pass: true },

  // Path 2: Moria → Lothlórien
  { name: 'West-gate of Moria', miles: 770,  altPath: 'moria' },
  { name: 'Khazad-dûm',         miles: 870,  altPath: 'moria' },

  // All three paths converge at Lothlórien (Redhorn/Moria) or Edoras (Gap)
  { name: 'Lothlórien',         miles: 1100, town: true },

  // Path 3: Gap of Rohan (longest route, skips Lothlórien)
  { name: 'Glanduin',           miles: 800,  river: 'glanduin', altPath: 'gap' },
  { name: 'Fords of Isen',      miles: 1500, river: 'isen',     altPath: 'gap' },

  // ── Two paths from Lothlórien ──
  // Path A: Anduin river → Argonath/Rauros → Eastfold → Entwash → Edoras
  { name: 'Argonath',           miles: 1450, altPath: 'anduin' },
  { name: 'Entwash',            miles: 1620, river: 'entwash', altPath: 'anduin' },

  // Path B: Fangorn forest → Westemnet → Edoras
  { name: 'Fangorn',            miles: 1400, altPath: 'fangorn' },

  { name: 'Edoras',             miles: 1700, town: true },
  { name: 'Minas Tirith',        miles: 1990, town: true },

  // ── Three paths into Mordor ──
  // Path A: North through Dead Marshes → Black Gate → Gorgoroth → Mount Doom
  { name: 'Dead Marshes',        miles: 2150, altPath: 'morannon' },
  { name: 'Black Gate',          miles: 2300, altPath: 'morannon' },

  // Path B: East via Minas Morgul → Cirith Ungol → Plateau of Gorgoroth → Mount Doom
  { name: 'Minas Morgul',        miles: 2080, altPath: 'cirith' },
  { name: 'Cirith Ungol',        miles: 2200, altPath: 'cirith' },

  // Path C: South via Poros → Nargil Pass → Nurn → Plateau of Gorgoroth → Mount Doom
  { name: 'Crossings of Poros',  miles: 2110, river: 'poros', altPath: 'nargil' },
  { name: 'Nargil Pass',         miles: 2280, altPath: 'nargil' },
  { name: 'Nurn',                miles: 2500, altPath: 'nargil' },

  // All three converge here
  { name: 'Plateau of Gorgoroth', miles: 2700 },
  { name: 'Mount Doom',           miles: 2900 },
];

// River definitions
const RIVERS = {
  brandywine: { width: 220, baseDepth: 3.5, variance: 2.0, maxDepth: 7 },
  hoarwell:   { width: 180, baseDepth: 4.0, variance: 2.5, maxDepth: 8 },
  bruinen:    { width: 90,  baseDepth: 2.5, variance: 2.0, maxDepth: 6 },
  glanduin:   { width: 110, baseDepth: 3.5, variance: 2.0, maxDepth: 6 },
  isen:       { width: 200, baseDepth: 4.5, variance: 2.5, maxDepth: 8 },
  entwash:    { width: 140, baseDepth: 3.0, variance: 2.0, maxDepth: 6 },
  poros:      { width: 100, baseDepth: 3.0, variance: 2.0, maxDepth: 6 },
  anduin:     { width: 400, baseDepth: 7.0, variance: 2.0, maxDepth: 10 },
};

const TOTAL_MILES = 2900;

// Calendar
const START_MONTH = 8, START_DAY = 23, START_YEAR = 3018; // 23 September 3018
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTH_DAYS = [31,28,31,30,31,30,31,31,30,31,30,31];

const ILLNESSES = [
  { id: 'fever',       label: 'Marsh Fever',    dmg: 4 },
  { id: 'chill',       label: 'Mountain Chill', dmg: 3 },
  { id: 'infection',   label: 'Wound Infection',dmg: 5 },
  { id: 'exhaustion',  label: 'Exhaustion',     dmg: 2 },
  { id: 'dysentery',   label: 'Dysentery',      dmg: 4 },
  { id: 'typhoid',     label: 'Typhoid',        dmg: 6 },
  { id: 'trench_foot', label: 'Trench Foot',    dmg: 2 },
  { id: 'sleepless',   label: 'Sleepless',      dmg: 1 },
  { id: 'frostbite',   label: 'Frostbite',      dmg: 3 },
];

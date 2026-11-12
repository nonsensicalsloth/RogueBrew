// Bump this whenever card stats change — the title screen shows it so you can
// confirm the browser is loading the latest card file.
const CARDS_VERSION = 'spent grain 1 (Nov 13)';

// cards.js — card definitions and deck building
// Add new cards here. Each card needs:
//   id, name, cat (malt/hop/yeast/adjunct), lane (hot/cold/both),
//   points, cost, tags[], desc (optional, for tooltips later)

const CARD_POOL = [
  // ── Base Malts ──
  { id:'2row',        name:'2-Row Malt',           cat:'malt', lane:'hot', points:10, cost:1, tags:['neutral'],         desc:'No effect.' },
  { id:'pilsner',     name:'Pilsner Malt',          cat:'malt', lane:'hot', points:8,  cost:1, tags:['crisp'],           desc:'The first Pilsner Malt you play each round draws 1 card.' },
  { id:'6row',        name:'6-Row Malt',            cat:'malt', lane:'hot', points:6,  cost:1, tags:['neutral'],          desc:'Next card you play this turn costs 1 less.' },
  { id:'marisotter',  name:'Maris Otter',           cat:'malt', lane:'hot', points:12, cost:2, tags:['biscuity'],        desc:'If you have 3+ combined crystal/dark malts on hot side, +8 pts.' },
  { id:'goldenprom',  name:'Golden Promise',        cat:'malt', lane:'hot', points:18, cost:2, tags:['sweet'],           desc:'No effect, big base score.' },
  { id:'vienna',      name:'Vienna Malt',           cat:'malt', lane:'hot', points:10,  cost:2, tags:['malty','toasty'],          desc:'Increases base score of all other malts on your hot side by +2.' },
  { id:'munich',      name:'Munich Malt',           cat:'malt', lane:'hot', points:18, cost:2, tags:['malty'],           desc:'No effect, big base score.' },
  { id:'wheatwhite',  name:'White Wheat Malt',      cat:'malt', lane:'hot', points:8,  cost:1, tags:['bready','hazy'],          desc:'Add a Body card (0 cost, +5 pts) to your hand when played.' },
  { id:'expilsner',   name:'Extra Pale Pilsner',    cat:'malt', lane:'hot', points:12, cost:2, tags:['crisp'],           desc:'Your next hop this round gets +2 pts.' },
  { id:'floorpilsner',name:'Floor Malted Pilsner',  cat:'malt', lane:'hot', points:19, cost:3, tags:['crisp'],           desc:'If no crystal or dark malts on hot side, +10 bonus pts.' },
  { id:'darkmunich',  name:'Dark Munich',           cat:'malt', lane:'hot', points:19, cost:3, tags:['bready','toasty'], desc:'Each crystal malt already on your hot side gets +4 pts.' },
  { id:'expwheat',    name:'Extra Pale Wheat',      cat:'malt', lane:'hot', points:12, cost:2, tags:['bready','crisp'], desc:'Your next hop this round gets +3 pts.' },
  { id:'paleale',     name:'Pale Ale Malt',         cat:'malt', lane:'hot', points:11, cost:1, tags:['biscuity'],        desc:'No effect. A touch richer than 2-Row.' },
  { id:'heritage',    name:'Local Grown Heritage',  cat:'malt', lane:'hot', points:13, cost:3, tags:['nuanced'],         desc:'With another nuanced card on your board, it scores double its printed points.' },

  // ── Light Crystal (multiply cheap cards) ──
  { id:'crystal10',  name:'Crystal 10',    cat:'malt', lane:'hot', points:6,  cost:1, tags:['sweet'],           desc:'All other cost-1 cards on your hot side get +3 pts.' },
  { id:'crystal20',  name:'Crystal 20',    cat:'malt', lane:'hot', points:8,  cost:1, tags:['sweet'],           desc:'All other cost-1 cards on your hot side get +4 pts.' },
  { id:'crystal30',  name:'Crystal 30',    cat:'malt', lane:'hot', points:12, cost:2, tags:['sweet'],                   desc:'All cost-1 cards on your hot side get +5 pts.' },

  // ── Medium Crystal (board composition) ──
  { id:'crystal40',  name:'Crystal 40',    cat:'malt', lane:'hot', points:12, cost:2, tags:['sweet'],                   desc:'+2 pts for each base malt on your hot side.' },
  { id:'crystal50',  name:'Crystal 50',    cat:'malt', lane:'hot', points:14, cost:2, tags:['sweet','toasty'],          desc:'Doubles the last base malt on your hot side.' },
  { id:'crystal60',  name:'Crystal 60',    cat:'malt', lane:'hot', points:16, cost:2, tags:['sweet','toasty'],          desc:'+3 pts for each base malt on your hot side.' },
  { id:'crystal75',  name:'Crystal 75',    cat:'malt', lane:'hot', points:16, cost:4, tags:['sweet','toasty'],          desc:'+4 pts for each other card on your hot side.' },

  // ── Dark Crystal (explosive but dangerous) ──
  { id:'crystal80',  name:'Crystal 80',    cat:'malt', lane:'hot', points:18, cost:2, tags:['sweet','roasty'],          desc:'Score = roast tokens x8. With fewer than 3 roast, adds a Sugar Clot (-10 pts) to your hot side.' },
  { id:'crystal120', name:'Crystal 120',   cat:'malt', lane:'hot', points:12, cost:2, tags:['sweet','roasty'],          desc:'Choose a crystal malt on your hot side. Crystal 120 absorbs it and gains double its points.' },

  // ── Specialty / Mid-range ──
  { id:'carapils',   name:'Carapils',      cat:'malt', lane:'hot', points:6,  cost:1, tags:['smooth'],          desc:'Adjacent cards on hot side each get +3 pts.' },
  { id:'specialb',   name:'Special B',     cat:'malt', lane:'hot', points:6, cost:2, tags:['sweet','roasty'],          desc:'Score = 6 + roast tokens x6.' },
  { id:'melanoidin', name:'Melanoidin',    cat:'malt', lane:'hot', points:14, cost:2, tags:['malty','toasty'],          desc:'Scores ×2 with 1 copy in your discard pile, ×3 with 2, and so on. Its value cannot be reduced by other cards.' },
  { id:'aromatic',   name:'Aromatic Malt', cat:'malt', lane:'hot', points:14, cost:2, tags:['malty','bready'],          desc:'Copies the on-play effect of the last malt you played this round.' },
  { id:'biscuit',    name:'Biscuit Malt',  cat:'malt', lane:'hot', points:3,  cost:2, tags:['biscuity','toasty'],       desc:'Scores 3 × the number of cards on your hot side (including itself). Cannot benefit from multipliers.' },
  { id:'victory',    name:'Victory Malt',  cat:'malt', lane:'hot', points:18, cost:3, tags:['biscuity','toasty'],       desc:'If you win the round this was played in, it stays on the board next round instead of discarding.' },
  { id:'caramun',    name:'Caramunich',    cat:'malt', lane:'hot', points:17, cost:2, tags:['sweet','toasty'],          desc:'No effect, but sweet and toasty for synergies.' },

  // ── Dark Malts ──
  { id:'choc',        name:'Chocolate Malt',   cat:'malt', lane:'hot', points:21, cost:3, tags:['toasty','roasty'],  desc:'Adds 1 roast token.' },
  { id:'patent',      name:'Black Patent',     cat:'malt', lane:'hot', points:20, cost:2, tags:['roasty'],           desc:'Adds 2 roast tokens.' },
  { id:'roastedbar',  name:'Roasted Barley',   cat:'malt', lane:'hot', points:21, cost:3, tags:['roasty','dry'],     desc:'Adds 2 roast tokens. If 3+ roast tokens total, +10 bonus pts.' },
  { id:'carafaI',     name:'Carafa I',         cat:'malt', lane:'hot', points:14, cost:2, tags:['roasty','smooth'],  desc:'Adds 1 roast token. Roast penalty threshold increases by 1.' },
  { id:'carafaII',    name:'Carafa II',        cat:'malt', lane:'hot', points:21, cost:3, tags:['roasty','smooth'],  desc:'Adds 1 roast token. Roast penalty threshold increases by 1.' },
  { id:'carafaIII',   name:'Carafa III',       cat:'malt', lane:'hot', points:22, cost:3, tags:['roasty','smooth'],  desc:'Adds 2 roast tokens. Roast penalty threshold increases by 1.' },
  { id:'blackmalt',   name:'Black Malt',       cat:'malt', lane:'hot', points:18, cost:2, tags:['roasty','toasty'],  desc:'Adds 2 roast tokens. An adjacent crystal malt scores double.' },
  { id:'palechoc',    name:'Pale Chocolate',   cat:'malt', lane:'hot', points:16, cost:2, tags:['toasty','roasty'],  desc:'Adds 1 roast token. Milder chocolate character.' },
  { id:'midnightw',   name:'Midnight Wheat',   cat:'malt', lane:'hot', points:21, cost:3, tags:['roasty','smooth'],  desc:'Adds 1 roast token but counts as 0 toward the penalty threshold.' },
  { id:'debittered',  name:'De-bittered Black',cat:'malt', lane:'hot', points:16, cost:2, tags:['roasty','smooth'],  desc:'Removes 1 roast token when played.' },
  { id:'smokedmalt',  name:'Smoked Malt',      cat:'malt', lane:'hot', points:14, cost:2, tags:['roasty','dry'],     desc:'Adds 1 roast token. All other roasty cards on your hot side get +2 pts.' },

  // ── Adjuncts ──

  // Carried over
  { id:'oats',       name:'Flaked Oats',     cat:'adjunct', lane:'hot', points:8,  cost:1, tags:['smooth','hazy'],               desc:'If played next to a dark malt, double that malt\'s base score.' },
  { id:'coffee',     name:'Coffee Beans',    cat:'adjunct', lane:'both', points:12, cost:4, tags:['toasty','roasty'],       desc:'Doubles every dark malt on your hot side.' },
  { id:'maltodex',   name:'Maltodextrin',    cat:'adjunct', lane:'hot', points:6,  cost:1, tags:['smooth'],               desc:'Your next card costs 2 less.' },
  { id:'lactose',    name:'Lactose',         cat:'adjunct', lane:'hot', points:12,  cost:2, tags:['sweet','smooth'],                desc:'Removes 2 roast tokens.' },

  // Fruit adjuncts
  { id:'raspberry',  name:'Raspberries',     cat:'adjunct', lane:'both', points:12, cost:2, tags:['sweet','fruity'],       desc:'+2 pts for each other sweet card on your hot side.' },
  { id:'cherry',     name:'Cherries',        cat:'adjunct', lane:'both', points:12, cost:2, tags:['sweet','fruity'],       desc:'If 2+ dark malts are on your hot side, +8 pts.' },
  { id:'mango',      name:'Mango',           cat:'adjunct', lane:'both', points:6,  cost:1, tags:['sweet','tropical','hazy'],desc:'Adds a Haze token to your hand.' },
  { id:'passionfr',  name:'Passion Fruit',   cat:'adjunct', lane:'both', points:12, cost:2, tags:['tropical','fruity'],       desc:'Every hop on your cold side gets +2.' },
  { id:'blueberry',  name:'Blueberry',       cat:'adjunct', lane:'both', points:12,  cost:2, tags:['sweet','fruity'],       desc:'If played after a crystal malt, score double.' },
  { id:'bloodorange',name:'Blood Orange',    cat:'adjunct', lane:'both', points:12, cost:2, tags:['citrus','fruity'],      desc:'If you have a citrus hop on cold side, +6 pts.' },

  // Sweet/pastry adjuncts
  { id:'vanilla',    name:'Vanilla',         cat:'adjunct', lane:'both', points:12, cost:2, tags:['sweet','smooth'],       desc:'All other sweet cards on your board get +2 pts.' },
  { id:'coconut',    name:'Coconut',         cat:'adjunct', lane:'both', points:10,  cost:2, tags:['sweet','smooth'],       desc:'Adds a Body token to your hand.' },
  { id:'cacaonibs',  name:'Cacao Nibs',      cat:'adjunct', lane:'both', points:19, cost:3, tags:['roasty','bitter'],       desc:'Adds 1 roast token. If Chocolate Malt on hot side, score double.' },
  { id:'honey',      name:'Honey',           cat:'adjunct', lane:'hot', points:12, cost:2, tags:['sweet','floral'],        desc:'Costs 0 if it is your first adjunct this round. +3 per floral card on your board.' },
  { id:'maple',      name:'Maple Syrup',     cat:'adjunct', lane:'hot', points:12, cost:2, tags:['sweet','malty'],        desc:'+4 pts for each other malty card on your hot side.' },
  { id:'marshm',     name:'Marshmallow',     cat:'adjunct', lane:'hot', points:8,  cost:1, tags:['sweet','smooth'],       desc:'All other smooth cards on your board get +2 pts.' },

  // Grain/texture adjuncts
  { id:'flakedwheat',name:'Flaked Wheat',    cat:'adjunct', lane:'hot', points:6,  cost:1, tags:['smooth','bready','hazy'],      desc:'Adds a Haze token to your hand.' },
  { id:'flakedrye',  name:'Flaked Rye',      cat:'adjunct', lane:'hot', points:8,  cost:1, tags:['dry','spicy'],          desc:'Next yeast card costs 1 less.' },
  { id:'flakedcorn', name:'Flaked Corn',     cat:'adjunct', lane:'hot', points:6,  cost:1, tags:['neutral','crisp'],      desc:'If 3+ neutral cards on board, +10 pts.' },
  { id:'ricehulls',  name:'Rice Hulls',      cat:'adjunct', lane:'hot', points:2,  cost:0, tags:['neutral'],              desc:'Free play. Next card costs 1 less.' },
  { id:'spelt',      name:'Spelt',           cat:'adjunct', lane:'hot', points:10, cost:2, tags:['bready','nuanced'],     desc:'With another nuanced card on your board, it scores double its printed points.' },
  { id:'buckwheat',  name:'Buckwheat',       cat:'adjunct', lane:'hot', points:9,  cost:2, tags:['dry','nuanced'],        desc:'Nuanced: double printed points with another nuanced card. If 2+ nuanced cards are on your board, draw 1.' },

  // Belgian adjuncts
  { id:'candisugarcl', name:'Clear Candi Sugar',  cat:'adjunct', lane:'hot', points:6,  cost:1, tags:['sweet','belgian'],            desc:'+3 pts for each Belgian yeast on cold side.' },
  { id:'candisugarab', name:'Amber Candi Sugar',  cat:'adjunct', lane:'hot', points:12,  cost:2, tags:['sweet','belgian','toasty'],   desc:'+4 pts for each Belgian yeast on cold side. Adds body and color.' },
  { id:'candisugardk', name:'Dark Candi Sugar',   cat:'adjunct', lane:'hot', points:12, cost:2, tags:['sweet','belgian','roasty'],   desc:'+5 pts for each Belgian yeast on cold side. Rich dark fruit.' },
  { id:'coriander',   name:'Coriander',           cat:'adjunct', lane:'hot', points:8,  cost:1, tags:['spicy','belgian'],            desc:'If a Belgian yeast is on your cold side, +8 pts.' },
  { id:'orangepeel',  name:'Orange Peel',         cat:'adjunct', lane:'hot', points:8,  cost:1, tags:['citrus','belgian','fruity'],  desc:'Every other citrus and belgian card on your board gets +2.' },
  { id:'grainspara',  name:'Grains of Paradise',  cat:'adjunct', lane:'hot', points:12, cost:2, tags:['spicy','belgian','dry'],      desc:'If 3+ belgian tagged cards on board, +12 pts.' },
  { id:'cardamom',    name:'Cardamom',             cat:'adjunct', lane:'hot', points:10,  cost:2, tags:['spicy','sweet','belgian'],    desc:'+3 pts for each other sweet card and each other spicy card on your board.' },
  { id:'citrazest',  name:'Grapefruit Zest',      cat:'adjunct', lane:'hot', points:8, cost:1, tags:['citrus','bitter'],      desc:'Your next hop costs 0.' },
  { id:'vanillabn',  name:'Vanilla Bean',    cat:'adjunct', lane:'both', points:17, cost:3, tags:['sweet','smooth'],       desc:'All other sweet cards on your board get +3 pts.' },
  { id:'toastedcoc', name:'Toasted Coconut', cat:'adjunct', lane:'both', points:12, cost:2, tags:['sweet','toasty'],       desc:'If another sweet card and a toasty card are on your hot side, +8 pts.' },
  { id:'coldbrewcof',name:'Cold Brew Coffee',cat:'adjunct', lane:'both', points:21, cost:3, tags:['toasty','roasty','smooth'], desc:'Adds 1 roast token. Roast penalty threshold +1.' },
  { id:'chili',      name:'Chili Pepper',    cat:'adjunct', lane:'both', points:8,  cost:2, tags:['spicy','dry'],          desc:'Turn up the heat: the rival\'s highest-scoring card loses 6 pts.' },
  { id:'cinnamon',   name:'Cinnamon',        cat:'adjunct', lane:'hot', points:10,  cost:2, tags:['spicy','sweet'],        desc:'+3 pts for each other sweet card on your hot side.' },
  { id:'phantasm',   name:'Phantasm',        cat:'adjunct', lane:'hot', points:6,  cost:1, tags:['fruity','thiol'],       desc:'Grape-derived bound thiols. A thiol-releasing yeast unlocks +8.' },

  // ── Process Cards ──

  // Cleaning/Removal (your side)
  { id:'cip',          name:'CIP Cycle',        cat:'process', lane:'both', points:0,  cost:2, tags:[],           desc:'Remove every negative token from your board. Draw 1.' },
  { id:'sip',          name:'SIP Rinse',         cat:'process', lane:'hot',  points:0,  cost:1, tags:[],           desc:'Remove one negative token from your hot side. Draw 1.' },
  { id:'heatkill',     name:'Heat Kill',         cat:'process', lane:'cold', points:0,  cost:2, tags:[],           desc:'Remove all Contamination from your cold side. Each yeast there gets +5 now, but stops growing this round. Draw 1.' },
  { id:'filtration',   name:'Filtration',        cat:'process', lane:'cold', points:0,  cost:2, tags:[],           desc:'Destroy every negative card on your cold side, then choose a yeast there to return to your hand. It costs 0 this turn. Draw 1.' },
  { id:'fining',       name:'Fining Agent',      cat:'process', lane:'both',  points:0,  cost:1, tags:[],  desc:'Remove one negative token from your board. Every yeast on your cold side gets +2. Draw 1.' },
  { id:'coldcrash',    name:'Cold Crash',        cat:'process', lane:'cold', points:14,  cost:2, tags:[],   desc:'Scores points and clears one negative token from your cold side.' },

  // Disruption (enemy side)
  { id:'drunkcellar',  name:'Drunk Cellarman',   cat:'process', lane:'cold', points:0,  cost:1, tags:[],           desc:'Gives the rival +8 on their cold side, but you draw 2 cards.' },
  { id:'drunkbrewer',  name:'Drunk Brewer',      cat:'process', lane:'hot',  points:0,  cost:1, tags:[],           desc:'Gives the rival +8 on their hot side, but you draw 2 cards.' },
  { id:'crosscontam',  name:'Cross Contamination',cat:'process',lane:'cold', points:0,  cost:2, tags:[],    desc:'Shuffle 2 Contamination cards into the rival\'s deck. Draw 1.' },
  { id:'hopthief',     name:'Hop Thief',         cat:'process', lane:'both', points:0,  cost:1, tags:[],          desc:'Copy the highest scoring hop on the rival\'s board into your hand. Draw 1.' },
  { id:'badbatch',     name:'Bad Batch',         cat:'process', lane:'hot',  points:0,  cost:3, tags:[],           desc:'Remove the highest scoring card from the rival\'s hot side. Draw 1.' },
  { id:'inspector',    name:'Health Inspector',  cat:'process', lane:'both', points:0,  cost:3, tags:[],           desc:'Remove the highest scoring card from the rival\'s board.' },

  // Row manipulation (your side)
  { id:'dryhop',       name:'Dry Hop Addition',  cat:'process', lane:'cold', points:14, cost:2, tags:[],   desc:'Move your last hot side hop to the cold side. It keeps its points and triggers its dry hop bonus.' },
  { id:'kettletrans',  name:'Whirlpool',   cat:'process', lane:'hot',  points:0,  cost:1, tags:[],           desc:'Every hop on your hot side gets +2. Draw 1.' },
  { id:'doublebatch',  name:'Double Batch',      cat:'process', lane:'both', points:0,  cost:2, tags:[],           desc:'Copy the last card you played and add a second instance to the same lane. Draw 1.' },
  { id:'barreltrans',  name:'Barrel Transfer',   cat:'process', lane:'cold', points:12, cost:3, tags:[],  desc:'The highest scoring card on your cold side gets +50% pts (+100% if it is oaky).' },
  { id:'recipetweak',  name:'Recipe Tweak',      cat:'process', lane:'both', points:0,  cost:1, tags:[],         desc:'Choose any card on your board and return it to your hand. It loses bonuses gained this battle, but keeps upgrades and aging. Your next card costs 1 less. Draw 1.' },

  // Scoring/multiplier process cards
  { id:'qc',           name:'Quality Control',   cat:'process', lane:'both', points:0,  cost:1, tags:[],   desc:'If your total score is higher than the rival\'s, +14 pts. Otherwise, draw 1.' },
  { id:'tasting',      name:'Tasting Notes',     cat:'process', lane:'both', points:0,  cost:0, tags:[],         desc:"Reveal rival's hand for this turn." },
  { id:'award',        name:'Award Entry',       cat:'process', lane:'both', points:28, cost:4, tags:[],  desc:'If you win this round, draw 3 cards.' },
  { id:'pilotbatch',   name:'Pilot Batch',       cat:'process', lane:'hot',  points:8,  cost:2, tags:[],         desc:'Draw 2 cards when played.' },
  { id:'grainreview',  name:'Grain Bill Review', cat:'process', lane:'hot',  points:0,  cost:0, tags:[],           desc:'Reveal the top 3 cards of your deck. Draw 1.' },
  { id:'fermlog',      name:'Fermentation Log',  cat:'process', lane:'cold', points:0,  cost:1, tags:[],           desc:'+3 pts to every other card on your cold side. Draw 1.' },

  // ══════════════════════════════════════════════════════════════
  // ── HOPS ──
  // Hot side = boil / whirlpool (bittering). Cold side = dry hop (aroma).
  // ══════════════════════════════════════════════════════════════

  // Noble & European — the lager hops
  { id:'saaz',       name:'Saaz',               cat:'hop', lane:'both', points:8,  cost:1, tags:['spicy','earthy','noble'],        desc:'+8 if a Pilsner malt is on your hot side.' },
  { id:'hallertau',  name:'Hallertau Mittelfrüh',cat:'hop', lane:'both', points:8, cost:1, tags:['floral','spicy','noble'],        desc:'+6 if you have no roast tokens.' },
  { id:'tettnang',   name:'Tettnang',           cat:'hop', lane:'both', points:8,  cost:1, tags:['floral','earthy','noble'],        desc:'+2 for each crisp card on your board.' },
  { id:'hallblanc',  name:'Hallertau Blanc',    cat:'hop', lane:'both', points:14, cost:2, tags:['fruity','tropical','citrus'],       desc:'+3 for each noble hop on your board. Dry hop (cold side): +4.' },
  { id:'ekg',        name:'East Kent Goldings', cat:'hop', lane:'both', points:14, cost:2, tags:['earthy','floral','spicy'],             desc:'+8 if a biscuity malt is on your hot side.' },

  // Bittering
  { id:'magnum',     name:'Magnum',             cat:'hop', lane:'hot',  points:16, cost:2, tags:['bitter','clean'],              desc:'Boil only. Clean bittering backbone: every other hop on your board gets +2.' },

  // West Coast — the C-hops still double each other
  { id:'cascade',    name:'Cascade',            cat:'hop', lane:'both', points:10, cost:1, tags:['citrus','floral','c-hop'],      desc:'With another c-hop on the same side, all c-hops there score +50% of their printed points.' },
  { id:'centennial', name:'Centennial',         cat:'hop', lane:'both', points:12, cost:2, tags:['citrus','floral','bitter','c-hop'],      desc:'With another c-hop on the same side, all c-hops there score +50% of their printed points.' },
  { id:'chinook',    name:'Chinook',            cat:'hop', lane:'both', points:10, cost:2, tags:['bitter','piney','spicy','c-hop'],       desc:'C-hop (+50% with another c-hop on its side). Boil (hot side): +4.' },
  { id:'columbus',   name:'Columbus',           cat:'hop', lane:'both', points:14, cost:3, tags:['bitter','dank','spicy','c-hop'],        desc:'C-hop (+50% with another c-hop on its side). Adds 1 roast token to the rival.' },
  { id:'simcoe',     name:'Simcoe',             cat:'hop', lane:'both', points:12, cost:2, tags:['piney','dank','fruity'],        desc:'Dry hop (cold side): draw 1 card.' },

  // Modern American
  { id:'citra',      name:'Citra',              cat:'hop', lane:'both', points:12, cost:2, tags:['citrus','tropical'],               desc:'Draw a card when played.' },
  { id:'mosaic',     name:'Mosaic',             cat:'hop', lane:'both', points:14, cost:2, tags:['fruity','tropical','piney'],                desc:'+2 for each other hop variety on your board.' },
  { id:'strata',     name:'Strata',             cat:'hop', lane:'both', points:19, cost:3, tags:['dank','fruity','tropical'],         desc:'+3 for each other dank or tropical card on your board.' },
  { id:'idaho7',     name:'Idaho 7',            cat:'hop', lane:'both', points:14, cost:2, tags:['tropical','piney','earthy'],       desc:'+6 if both a tropical and a piney card are on your board.' },
  { id:'talus',      name:'Talus',              cat:'hop', lane:'both', points:14, cost:2, tags:['citrus','piney','earthy'],     desc:'Dry hop (cold side): every hazy card on your board gets +2.' },
  { id:'sabro',      name:'Sabro',              cat:'hop', lane:'both', points:14, cost:2, tags:['tropical','citrus','smooth'],     desc:'All other smooth cards on your board get +2.' },
  { id:'eldorado',   name:'El Dorado',          cat:'hop', lane:'both', points:14, cost:2, tags:['fruity','sweet'],               desc:'+2 for each sweet adjunct on your hot side.' },
  { id:'amarillo',   name:'Amarillo',           cat:'hop', lane:'both', points:14, cost:2, tags:['citrus','floral'],              desc:'+2 for each fruity adjunct on your hot side.' },

  // Southern Hemisphere
  { id:'galaxy',     name:'Galaxy',             cat:'hop', lane:'both', points:16, cost:2, tags:['tropical','fruity','citrus'],       desc:'+8 if 2+ hazy cards are on your board.' },
  { id:'nelson',     name:'Nelson Sauvin',      cat:'hop', lane:'both', points:12, cost:3, tags:['fruity','nuanced','thiol'], desc:'Nuanced (double printed points with another nuanced card). Thiol.' },
  { id:'motueka',    name:'Motueka',            cat:'hop', lane:'both', points:12, cost:2, tags:['citrus','earthy'],               desc:'+2 for each other citrus card on your board.' },
  { id:'nectaron',   name:'Nectaron',           cat:'hop', lane:'both', points:16, cost:2, tags:['tropical','fruity','citrus'],       desc:'+3 for each other NZ hop on your board (Nelson, Motueka, Riwaka).' },
  { id:'riwaka',     name:'Riwaka',             cat:'hop', lane:'both', points:14, cost:3, tags:['citrus','tropical','thiol'],        desc:'Dry hop (cold side): +6. Thiol.' },

  // Hop products
  { id:'cryo',       name:'Cryo Hops',          cat:'hop', lane:'both', points:14, cost:2, tags:[],                         desc:'Concentrated lupulin. Copies the flavor tags of the last hop you played. Your next hop costs 1 less.' },
  { id:'hopoil',     name:'Hop Oil',            cat:'hop', lane:'both', points:6,  cost:1, tags:[],                         desc:'Copies the flavor tags of the last hop you played. Every hop on your cold side gets +3.' },

  // ══════════════════════════════════════════════════════════════
  // ── YEAST ── (all gain +2 pts per turn on the field unless noted)
  // ══════════════════════════════════════════════════════════════

  // Clean ale
  { id:'chico',      name:'Cal Ale',            cat:'yeast', lane:'cold', points:6,  cost:2, tags:['crisp','clean'],              desc:'+2 per turn. On play: +1 per hop and per base malt on your board.' },
  { id:'barbarian',  name:'Barbarian',          cat:'yeast', lane:'cold', points:6,  cost:2, tags:['fruity','clean'],             desc:'+2 per turn. On play: +2 per hop on your board.' },
  { id:'london3',    name:'London Ale III',     cat:'yeast', lane:'cold', points:6,  cost:2, tags:['hazy','smooth','fruity'],     desc:'+2 per turn. On play: biotransformation — every hop on your cold side gets +3. +2 per hazy card.' },
  { id:'englishale', name:'English Ale',        cat:'yeast', lane:'cold', points:6,  cost:2, tags:['fruity','malty'],          desc:'+2 per turn. On play: +3 per biscuity, malty, or earthy card on your board.' },
  { id:'kveik',      name:'Voss Kveik',         cat:'yeast', lane:'cold', points:17, cost:3, tags:['fruity','dry'],               desc:'No accumulation — it ferments hot and fast. On play: +2 per hop on your board.' },

  // Lager & hybrid
  { id:'w3470',      name:'W-34/70',            cat:'yeast', lane:'cold', points:6,  cost:2, tags:['crisp','clean'],              desc:'+2 per turn. On play: +2 per noble hop. +10 if every hot side card costs 2 or less.' },
  { id:'czechlager', name:'Czech Pils Lager',   cat:'yeast', lane:'cold', points:6,  cost:2, tags:['crisp','clean','malty'],      desc:'+2 per turn. On play: +1 per hop. +8 if Saaz or a Pilsner malt is on your board.' },
  { id:'kolsch',     name:'Kölsch',             cat:'yeast', lane:'cold', points:6,  cost:2, tags:['crisp','clean'],              desc:'+2 per turn. On play: +1 per hop. +8 if you have no roast tokens.' },

  // Belgian & wheat
  { id:'abbey',      name:'Abbey Ale',          cat:'yeast', lane:'cold', points:9,  cost:3, tags:['fruity','spicy','belgian'],    desc:'+2 per turn. On play: +3 per belgian card and +2 per sweet card on your hot side.' },
  { id:'saison',     name:'Saison',             cat:'yeast', lane:'cold', points:6,  cost:2, tags:['dry','spicy','belgian'], desc:'+2 per turn. On play: +2 per belgian, spicy, or dry card. Ferments bone dry — removes a Sugar Clot.' },
  { id:'hefeweizen', name:'Hefeweizen',         cat:'yeast', lane:'cold', points:6,  cost:2, tags:['fruity','spicy','hazy'],    desc:'+2 per turn. On play: +3 per bready, fruity, or spicy card on your board (banana and clove).' },

  // Wild & sour
  { id:'brett',      name:'Brettanomyces',      cat:'yeast', lane:'cold', points:6,  cost:2, tags:['funky','dry'],                desc:'+3 per turn. On play: eats residual sugar — +3 per sweet card on hot side. Each turn, 50% chance to shuffle Contamination into your deck.' },
  { id:'lacto',      name:'Lactobacillus',      cat:'yeast', lane:'cold', points:6,  cost:1, tags:['sour','crisp'],               desc:'+2 per turn. On play: +6, but −4 for each bitter card on your board. Shuffles 1 Contamination into your deck.' },

  // Engineered strains
  { id:'sourvisiae', name:'Sourvisiae',         cat:'yeast', lane:'cold', points:6,  cost:2, tags:['sour','crisp','clean'],       desc:'+2 per turn. Clean sour, no contamination. On play: +2 per fruity or tropical card and +2 per hop (not hop-sensitive).' },
  { id:'cosmicpunch',name:'Cosmic Punch',       cat:'yeast', lane:'cold', points:6,  cost:2, tags:['fruity','hazy','thiol'],      desc:'+2 per turn. On play: +2 per hop on your cold side. Thiol release: every thiol card on your board gets +6 (Phantasm +8), including ones played later.' },

  // ══════════════════════════════════════════════════════════════
  // ── FLAVOUR PAYOFFS ── cards that reward the less-used tags
  // ══════════════════════════════════════════════════════════════
  // ── SPENT GRAIN ── cards that fill and use your discard pile
  { id:'grainout',      name:'Grain Out',       cat:'process', lane:'both', points:0,  cost:0, tags:[],                 desc:'Discard a card from your hand, then draw 2.' },
  { id:'trubdump',      name:'Trub Dump',       cat:'process', lane:'both', points:0,  cost:1, tags:[],                 desc:'Look at the top 3 cards of your deck. Keep one in your hand and discard the other two.' },
  { id:'yeastharvest',  name:'Yeast Harvest',   cat:'process', lane:'cold', points:0,  cost:1, tags:[],                 desc:'Choose a yeast in your discard pile and return it to your hand. It costs 0 this turn. If there is none, draw 1.' },
  { id:'secondrunnings',name:'Second Runnings', cat:'malt',    lane:'hot',  points:6,  cost:2, tags:['malty'],          desc:'Brew the most recent malt in your discard pile again, for free. If there is none, +8 pts instead.' },
  { id:'spentbread',    name:'Spent Grain Bread',cat:'adjunct',lane:'both', points:6,  cost:1, tags:['bready'],         desc:'+2 pts for each card in your discard pile.' },
  { id:'solera',        name:'Solera',          cat:'adjunct', lane:'cold', points:16, cost:3, tags:['oaky','smooth'],  desc:'Old beer blended with new: +2 pts for each card in your discard pile.' },
  { id:'peatmalt',    name:'Peated Malt',    cat:'malt',    lane:'hot',  points:8,  cost:1, tags:['roasty','earthy'], desc:'Smoke them out: give the rival 2 roast tokens.' },
  { id:'brownmalt',   name:'Brown Malt',     cat:'malt',    lane:'hot',  points:12, cost:2, tags:['toasty','malty'],  desc:'+3 pts for each other toasty card on your hot side.' },
  { id:'honeymalt',   name:'Honey Malt',     cat:'malt',    lane:'hot',  points:7,  cost:1, tags:['sweet'],           desc:'Balances bitterness: +3 pts for each bitter card on your board.' },
  { id:'ryemalt',     name:'Rye Malt',       cat:'malt',    lane:'hot',  points:12, cost:2, tags:['spicy','bready'],  desc:'+3 pts for each other bready card on your hot side.' },
  { id:'fuggle',      name:'Fuggle',         cat:'hop',     lane:'both', points:7,  cost:1, tags:['earthy','floral'], desc:'+3 pts for each other earthy card on your board.' },
  { id:'summit',      name:'Summit',         cat:'hop',     lane:'both', points:13, cost:2, tags:['bitter','dank'],   desc:'+3 pts for each other piney or dank card on your board.' },
  { id:'elderflower', name:'Elderflower',    cat:'adjunct', lane:'both', points:7,  cost:1, tags:['floral','sweet'],  desc:'+3 pts for each other floral card on your board.' },
  { id:'brutenzyme',  name:'Brut Enzyme',    cat:'adjunct', lane:'both', points:12,  cost:2, tags:['dry'],             desc:'Ferments bone dry: every other dry card on your board gets +3.' },
  { id:'flakedrice',  name:'Flaked Rice',    cat:'adjunct', lane:'hot',  points:7,  cost:1, tags:['neutral','crisp'], desc:'+2 pts for each other neutral or crisp card on your hot side.' },
  { id:'yeastnutrient', name:'Yeast Nutrient', cat:'adjunct', lane:'cold', points:6, cost:1, tags:['clean'],         desc:'Every clean yeast on your cold side gets +4.' },
  { id:'oakfoeder',   name:'Oak Foeder',     cat:'adjunct', lane:'cold', points:20, cost:3, tags:['oaky','funky'],    desc:'Wild cultures thrive in oak: every other funky or sour card on your cold side gets +5.' },
];

// ── Default deck composition (30 cards) ──
// Change this list to change the starting deck makeup.
// ══════════════════════════════════════════════════════════════
// ── RARITY ── (anything not listed is common)
//   Common   ~55%  plain malts, simple hops/yeasts, single-condition cards
//   Uncommon ~30%  synergy builders, special hops/yeasts, most process cards
//   Rare     ~15%  build-arounds and standouts
// ══════════════════════════════════════════════════════════════
const RARE_CARDS = [
  'nelson','riwaka','cosmicpunch','kveik','phantasm',
  'crystal75','crystal80','crystal120','coffee','aromatic','melanoidin','biscuit','victory','blackmalt',
  'heritage','spelt','buckwheat',
  'award','doublebatch','inspector','barreltrans',
  'oakfoeder','solera',
];
const UNCOMMON_CARDS = [
  'floorpilsner','darkmunich','expwheat','expilsner','crystal50','crystal60','specialb','carafaIII',
  'roastedbar','midnightw','smokedmalt','patent',
  'cacaonibs','coldbrewcof','vanillabn','toastedcoc','maple','honey','cardamom','grainspara','candisugardk','citrazest',
  'filtration','heatkill','recipetweak','hopthief','crosscontam','badbatch','dryhop','kettletrans','fermlog',
  'hallblanc','strata','talus','nectaron','cryo','hopoil',
  'london3','barbarian','abbey','brett','sourvisiae',
  'summit','brutenzyme','yeastnutrient','peatmalt','yeastharvest','secondrunnings',
];
const RARITY_NAMES = { common: 'Common', uncommon: 'Uncommon', rare: 'Rare' };
CARD_POOL.forEach(c => {
  c.rarity = RARE_CARDS.includes(c.id) ? 'rare' : UNCOMMON_CARDS.includes(c.id) ? 'uncommon' : 'common';
});

const DEFAULT_DECK_IDS = [
  '2row','2row','2row',
  'pilsner','pilsner','pilsner',
  'crystal40','crystal40',
  'caramun','caramun',
  'choc','patent',
  'oats','oats',
  'lactose','maltodex',
  'cascade','cascade','cascade',
  'citra','citra',
  'mosaic',
  'chico','chico',
  'london3',
  'lacto','lacto',
  'sourvisiae',
  'saison','saison',
];

const ENEMY_DECK_IDS = [
  '2row','2row','2row',
  'pilsner','pilsner',
  'crystal40','crystal40',
  'caramun',
  'choc','patent',
  'oats','oats',
  'cascade','cascade',
  'citra','citra',
  'mosaic','magnum',
  'lacto','chico',
  'saison','saison',
  'abbey',
  'badbatch','badbatch',
  'crosscontam',
  'drunkbrewer','drunkcellar',
  'inspector',
  'coldcrash',
];

function buildEnemyDeck() {
  return ENEMY_DECK_IDS.map(id => ({ ...getCardDef(id) }));
}

// ── Token Cards (generated during play, not draftable) ──
const TOKEN_CARDS = [
  { id:'sugar_clot',  name:'Sugar Clot',   cat:'token', lane:'hot',  points:-10, cost:0, tags:['roasty'], desc:'Negative points. Removed when a hop card is played on hot side.' },
  { id:'sugar_clot8', name:'Sugar Clot',   cat:'token', lane:'hot',  points:-8,  cost:0, tags:['roasty'], desc:'Negative points. Removed when a hop card is played on hot side.' },
  { id:'body',        name:'Body',         cat:'token', lane:'hot',  points:5,   cost:0, tags:['smooth'], desc:'Simple +5 pts. Created by White Wheat Malt and Coconut.' },
  { id:'haze',        name:'Haze',         cat:'token', lane:'both', points:4,   cost:1, tags:['hazy'],   desc:'When played, +2 pts to every hop on the same side. Stays in play as a hazy token.' },
  { id:'contamination', name:'Contamination',  cat:'token', lane:'cold', points:-10, cost:0, tags:['funky'],  desc:'Auto-plays to cold side when drawn. Interrupts your turn but costs 0.' },
  { id:'crowd_fav',     name:'Crowd Favorite', cat:'token', lane:'hot',  points:10,  cost:0, tags:[],         desc:'Festival rivals start each round with the crowd on their side.' },
  { id:'contam_soft',   name:'Contamination',  cat:'token', lane:'cold', points:-5,  cost:0, tags:['funky'],  desc:'Softened Contamination (a clean yeast outcompeted it). Auto-plays to cold side when drawn.' },
];

function getTokenDef(id) {
  return TOKEN_CARDS.find(c => c.id === id);
}

function createToken(id) {
  return { ...getTokenDef(id) };
}

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

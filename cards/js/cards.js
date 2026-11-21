// Bump this whenever card stats change — the title screen shows it so you can
// confirm the browser is loading the latest card file.
const CARDS_VERSION = 'guided brew + settings (Nov 21)';

// cards.js — card definitions and deck building
// Add new cards here. Each card needs:
//   id, name, cat (malt/hop/yeast/adjunct), lane (hot/cold/both),
//   points, cost, tags[], desc (optional, for tooltips later)

const CARD_POOL = [
  // ── Base Malts ──
  { id:'2row',        name:'2-Row Malt',           cat:'malt', lane:'hot', points:10, cost:1, tags:['neutral'],         desc:'Every adjunct on your hot side gets +2.' },
  { id:'pilsner',     name:'Pilsner Malt',          cat:'malt', lane:'hot', points:7,  cost:1, tags:['crisp'],           desc:'If this is the first card you play this turn, draw 1.' },
  { id:'6row',        name:'6-Row Malt',            cat:'malt', lane:'hot', points:8,  cost:1, tags:['neutral'],          desc:'Your next card this round costs 1 less.' },
  { id:'marisotter',  name:'Maris Otter',           cat:'malt', lane:'hot', points:12, cost:2, tags:['biscuity'],        desc:'+8 pts while 2+ crystal or dark malts are on your hot side.' },
  { id:'goldenprom',  name:'Golden Promise',        cat:'malt', lane:'hot', points:18, cost:2, tags:['sweet'],           desc:'' },
  { id:'vienna',      name:'Vienna Malt',           cat:'malt', lane:'hot', points:10,  cost:2, tags:['malty','toasty'],          desc:'Increases base score of all other malts on your hot side by +2.' },
  { id:'munich',      name:'Munich Malt',           cat:'malt', lane:'hot', points:18, cost:2, tags:['malty'],           desc:'' },
  { id:'wheatwhite',  name:'White Wheat Malt',      cat:'malt', lane:'hot', points:12,  cost:1, tags:['bready','hazy','sticky'],          desc:'' },
  { id:'expilsner',   name:'Extra Pale Pilsner',    cat:'malt', lane:'hot', points:12, cost:2, tags:['crisp'],           desc:'Your next hop this round costs 1 less and gets +2.' },
  { id:'floorpilsner',name:'Floor Malted Pilsner',  cat:'malt', lane:'hot', points:19, cost:3, tags:['crisp'],           desc:'If no crystal or dark malts on hot side, +10 bonus pts.' },
  { id:'darkmunich',  name:'Dark Munich',           cat:'malt', lane:'hot', points:19, cost:3, tags:['bready','toasty'], desc:'Each crystal malt already on your hot side gets +4 pts.' },
  { id:'expwheat',    name:'Extra Pale Wheat',      cat:'malt', lane:'hot', points:15, cost:2, tags:['bready','crisp','sticky'], desc:'Your next hop this round gets +3 pts.' },
  { id:'paleale',     name:'Pale Ale Malt',         cat:'malt', lane:'hot', points:11, cost:1, tags:['biscuity'],        desc:'' },
  { id:'heritage',    name:'Local Grown Heritage',  cat:'malt', lane:'hot', points:13, cost:3, tags:['nuanced'],         desc:'With another nuanced card on your board, it scores double its printed points.' },

  // ── Light Crystal (multiply cheap cards) ──
  { id:'crystal10',  name:'Crystal 10',    cat:'malt', lane:'hot', points:8,  cost:1, tags:['sweet'],           desc:'All other cost-1 cards on your board get +3.' },
  { id:'crystal20',  name:'Crystal 20',    cat:'malt', lane:'hot', points:8,  cost:1, tags:['sweet'],           desc:'All other cost-1 cards on your hot side get +4 pts.' },
  { id:'crystal30',  name:'Crystal 30',    cat:'malt', lane:'hot', points:12, cost:2, tags:['sweet'],                   desc:'All cost-1 cards on your hot side get +5 pts.' },

  // ── Medium Crystal (board composition) ──
  { id:'crystal40',  name:'Crystal 40',    cat:'malt', lane:'hot', points:8, cost:1, tags:['sweet'],                   desc:'+2 pts for each base malt on your hot side.' },
  { id:'crystal50',  name:'Crystal 50',    cat:'malt', lane:'hot', points:14, cost:2, tags:['sweet','toasty'],          desc:'Doubles the last base malt on your hot side.' },
  { id:'crystal60',  name:'Crystal 60',    cat:'malt', lane:'hot', points:16, cost:2, tags:['sweet','toasty'],          desc:'+3 pts for each base malt on your hot side.' },
  { id:'crystal75',  name:'Crystal 75',    cat:'malt', lane:'hot', points:16, cost:4, tags:['sweet','toasty'],          desc:'+4 pts for each other card on your hot side.' },

  // ── Dark Crystal (explosive but dangerous) ──
  { id:'crystal80',  name:'Crystal 80',    cat:'malt', lane:'hot', points:18, cost:2, tags:['sweet','toasty'],          desc:'Score = roast tokens x6.' },
  { id:'crystal120', name:'Crystal 120',   cat:'malt', lane:'hot', points:12, cost:2, tags:['sweet','toasty'],          desc:'Choose a crystal malt on your hot side. Crystal 120 absorbs it and gains double its current points.' },

  // ── Specialty / Mid-range ──
  { id:'carapils',   name:'Carapils',      cat:'malt', lane:'hot', points:6,  cost:1, tags:['smooth'],          desc:'Cards next to this on your hot side get +3.' },
  { id:'specialb',   name:'Special B',     cat:'malt', lane:'hot', points:6, cost:2, tags:['sweet','fruity'],          desc:'Score = 6 + roast tokens x6.' },
  { id:'melanoidin', name:'Melanoidin',    cat:'malt', lane:'hot', points:11, cost:2, tags:['malty','toasty'],          desc:'Scores double if it is the 3rd or later malt you play this round. Its value cannot be reduced by other cards.' },
  { id:'aromatic',   name:'Aromatic Malt', cat:'malt', lane:'hot', points:14, cost:2, tags:['malty','bready'],          desc:'Copies the on-play effect of the last malt you played this round.' },
  { id:'biscuit',    name:'Biscuit Malt',  cat:'malt', lane:'hot', points:3,  cost:2, tags:['biscuity','toasty'],       desc:'Scores 3 × the number of cards on your hot side (including itself). Cannot benefit from multipliers.' },
  { id:'victory',    name:'Victory Malt',  cat:'malt', lane:'hot', points:16, cost:3, tags:['biscuity','toasty'],       desc:'Every time this is on your board when you win a battle, it gets +3 for the rest of the run.' },
  { id:'caramun',    name:'Caramunich',    cat:'malt', lane:'hot', points:17, cost:2, tags:['sweet','toasty'],          desc:'' },

  // ── Dark Malts ──
  { id:'choc',        name:'Chocolate Malt',   cat:'malt', lane:'hot', points:21, cost:3, tags:['toasty','roasty'],  desc:'Adds 1 roast token.' },
  { id:'patent',      name:'Black Patent',     cat:'malt', lane:'hot', points:17, cost:3, tags:['roasty'],           desc:'Adds 2 roast tokens.' },
  { id:'roastedbar',  name:'Roasted Barley',   cat:'malt', lane:'hot', points:21, cost:3, tags:['roasty','dry'],     desc:'Adds 2 roast tokens. If 3+ roast tokens total, +10 bonus pts.' },
  { id:'carafaI',     name:'Carafa I',         cat:'malt', lane:'hot', points:14, cost:2, tags:['roasty','smooth'],  desc:'Adds 1 roast token. Roast penalty threshold increases by 1.' },
  { id:'carafaII',    name:'Carafa II',        cat:'malt', lane:'hot', points:21, cost:3, tags:['roasty','smooth'],  desc:'Adds 1 roast token. Roast penalty threshold increases by 1.' },
  { id:'carafaIII',   name:'Carafa III',       cat:'malt', lane:'hot', points:22, cost:3, tags:['roasty','smooth'],  desc:'Adds 2 roast tokens. Roast penalty threshold increases by 1.' },
  { id:'blackmalt',   name:'Black Malt',       cat:'malt', lane:'hot', points:18, cost:2, tags:['roasty','toasty'],  desc:'Adds 2 roast tokens. An adjacent crystal malt scores double.' },
  { id:'palechoc',    name:'Pale Chocolate',   cat:'malt', lane:'hot', points:16, cost:2, tags:['toasty','roasty'],  desc:'Adds 1 roast token.' },
  { id:'acidmalt',    name:'Acidulated Malt',       cat:'malt', lane:'hot', points:7,  cost:1, tags:['sour'],            desc:'Give the rival 2 Acid.' },
  { id:'midnightw',   name:'Midnight Wheat',   cat:'malt', lane:'hot', points:16, cost:3, tags:['roasty','smooth'],  desc:'Adds no roast. Every other roasty card on your hot side gets +3.' },
  { id:'debittered',  name:'De-bittered Black',cat:'malt', lane:'hot', points:16, cost:2, tags:['roasty','smooth'],  desc:'Removes 1 roast token when played.' },
  { id:'smokedmalt',  name:'Smoked Malt',      cat:'malt', lane:'hot', points:14, cost:2, tags:['roasty','dry'],     desc:'Adds 1 roast token. All other roasty cards on your hot side get +2 pts.' },

  // ── Adjuncts ──

  // Carried over
  { id:'oats',       name:'Flaked Oats',     cat:'adjunct', lane:'hot', points:7,  cost:1, tags:['smooth','hazy','sticky'],               desc:'Silky body: every other hazy or roasty card on your board gets +2, including ones played later.' },
  { id:'coffee',     name:'Coffee Beans',    cat:'adjunct', lane:'both', points:12, cost:4, tags:['toasty','roasty'],       desc:'Doubles every roasty malt on your hot side.' },
  { id:'maltodex',   name:'Maltodextrin',    cat:'adjunct', lane:'hot', points:6,  cost:1, tags:['smooth'],               desc:'Your next card this round costs 2 less.' },
  { id:'lactose',    name:'Lactose',         cat:'adjunct', lane:'hot', points:12,  cost:2, tags:['sweet','smooth'],                desc:'Raises your roast limit by 2.' },

  // Fruit adjuncts
  { id:'raspberry',  name:'Raspberries',     cat:'adjunct', lane:'both', points:12, cost:2, tags:['sour','fruity'],       desc:'+2 pts for each other sour or funky card on your board.' },
  { id:'cherry',     name:'Cherries',        cat:'adjunct', lane:'both', points:12, cost:2, tags:['sweet','fruity'],       desc:'+8 pts while 2+ dark malts are on your hot side.' },
  { id:'mango',      name:'Mango',           cat:'adjunct', lane:'both', points:9,  cost:1, tags:['sweet','tropical','hazy'],desc:'Every hop on the same side gets +3.' },
  { id:'passionfr',  name:'Passion Fruit',   cat:'adjunct', lane:'both', points:12, cost:2, tags:['tropical','fruity'],       desc:'Every hop on your cold side gets +3.' },
  { id:'blueberry',  name:'Blueberry',       cat:'adjunct', lane:'both', points:12,  cost:2, tags:['sweet','fruity'],       desc:'If played after a crystal malt, score double.' },
  { id:'bloodorange',name:'Blood Orange',    cat:'adjunct', lane:'both', points:12, cost:2, tags:['citrus','fruity'],      desc:'If you have a citrus hop on cold side, +6 pts.' },

  // Sweet/pastry adjuncts
  { id:'vanilla',    name:'Vanilla',         cat:'adjunct', lane:'both', points:12, cost:2, tags:['sweet','smooth'],       desc:'Every other sweet card on your board gets +2, including ones played later.' },
  { id:'coconut',    name:'Coconut',         cat:'adjunct', lane:'both', points:11,  cost:2, tags:['sweet','smooth','tropical'], desc:'+2 pts for each other smooth or tropical card on your board.' },
  { id:'cacaonibs',  name:'Cacao Nibs',      cat:'adjunct', lane:'both', points:19, cost:3, tags:['roasty','bitter'],       desc:'Adds 1 roast token. If Chocolate Malt on hot side, score double.' },
  { id:'honey',      name:'Honey',           cat:'adjunct', lane:'hot', points:12, cost:2, tags:['sweet','floral'],        desc:'Costs 0 if it is your first adjunct this round. +3 per floral card on your board.' },
  { id:'maple',      name:'Maple Syrup',     cat:'adjunct', lane:'hot', points:12, cost:2, tags:['sweet','malty'],        desc:'+4 pts for each other malty card on your hot side.' },
  { id:'marshm',     name:'Marshmallow',     cat:'adjunct', lane:'both', points:8,  cost:1, tags:['sweet','smooth'],       desc:'All other smooth cards on your board get +2 pts.' },

  // Grain/texture adjuncts
  { id:'flakedwheat',name:'Flaked Wheat',    cat:'adjunct', lane:'hot', points:9,  cost:1, tags:['smooth','bready','hazy','sticky'],      desc:'Every hop on your hot side gets +3.' },
  { id:'flakedrye',  name:'Flaked Rye',      cat:'adjunct', lane:'hot', points:9,  cost:1, tags:['dry','spicy','sticky'],          desc:'Next yeast card costs 1 less.' },
  { id:'flakedcorn', name:'Flaked Corn',     cat:'adjunct', lane:'hot', points:6,  cost:1, tags:['neutral','crisp'],      desc:'If 3+ neutral cards on board, +10 pts.' },
  { id:'ricehulls',  name:'Rice Hulls',      cat:'adjunct', lane:'hot', points:3,  cost:0, tags:['neutral'],              desc:'Draw 1 card. While this is on your hot side, sticky grains never clump (it clears a Stuck Mash too).' },
  { id:'spelt',      name:'Spelt',           cat:'adjunct', lane:'hot', points:11, cost:2, tags:['bready','nuanced','sticky'],     desc:'With another nuanced card on your board, it scores double its printed points.' },
  { id:'buckwheat',  name:'Buckwheat',       cat:'adjunct', lane:'hot', points:9,  cost:2, tags:['dry','nuanced'],        desc:'Nuanced: double printed points with another nuanced card. If 2+ nuanced cards are on your board, draw 1.' },

  // Belgian adjuncts
  { id:'candisugarcl', name:'Clear Candi Sugar',  cat:'adjunct', lane:'hot', points:6,  cost:1, tags:['sweet','belgian'],            desc:'+3 pts for each Belgian yeast on cold side.' },
  { id:'candisugarab', name:'Amber Candi Sugar',  cat:'adjunct', lane:'hot', points:12,  cost:2, tags:['sweet','belgian','toasty'],   desc:'+3 pts for each Belgian yeast on your cold side.' },
  { id:'candisugardk', name:'Dark Candi Sugar',   cat:'adjunct', lane:'hot', points:12, cost:2, tags:['sweet','belgian','toasty'],   desc:'+4 pts for each Belgian yeast on your cold side.' },
  { id:'coriander',   name:'Coriander',           cat:'adjunct', lane:'hot', points:8,  cost:1, tags:['spicy'],            desc:'Draw 1 card. If a Belgian yeast is on your cold side, +6 pts.' },
  { id:'orangepeel',  name:'Orange Peel',         cat:'adjunct', lane:'hot', points:8,  cost:1, tags:['citrus','fruity'],  desc:'Every other citrus and spicy card on your board gets +2, including ones played later.' },
  { id:'grainspara',  name:'Grains of Paradise',  cat:'adjunct', lane:'hot', points:12, cost:2, tags:['spicy','belgian','dry'],      desc:'If 3+ other spicy or belgian cards are on your board, +12 pts.' },
  { id:'cardamom',    name:'Cardamom',             cat:'adjunct', lane:'hot', points:10,  cost:2, tags:['spicy','floral'],    desc:'+2 pts for each other sweet card and each other spicy card on your board.' },
  { id:'citrazest',  name:'Grapefruit Zest',      cat:'adjunct', lane:'both', points:8, cost:1, tags:['citrus','bitter'],      desc:'Your next hop costs 1 less.' },
  { id:'vanillabn',  name:'Vanilla Bean',    cat:'adjunct', lane:'both', points:17, cost:3, tags:['sweet','smooth'],       desc:'Every other sweet card on your board gets +3, including ones played later.' },
  { id:'toastedcoc', name:'Toasted Coconut', cat:'adjunct', lane:'both', points:12, cost:2, tags:['sweet','toasty'],       desc:'If another sweet card and a toasty card are on your hot side, +8 pts.' },
  { id:'coldbrewcof',name:'Cold Brew Coffee',cat:'adjunct', lane:'cold', points:21, cost:3, tags:['toasty','roasty','smooth'], desc:'Adds 1 roast token. Roast penalty threshold +1.' },
  { id:'chili',      name:'Chili Pepper',    cat:'adjunct', lane:'both', points:8,  cost:2, tags:['spicy'],          desc:'The rival\'s highest-scoring card loses 6 pts.' },
  { id:'cinnamon',   name:'Cinnamon',        cat:'adjunct', lane:'hot', points:10,  cost:2, tags:['spicy','sweet'],        desc:'+3 pts for each other sweet card on your hot side.' },
  { id:'phantasm',   name:'Phantasm',        cat:'adjunct', lane:'both', points:6,  cost:1, tags:['fruity','thiol'],       desc:'A thiol yeast gives this +8.' },

  // ── Process Cards ──

  // Cleaning/Removal (your side)
  { id:'cip',          name:'CIP Cycle',        cat:'process', lane:'both', points:0,  cost:2, tags:[],           desc:'Remove every negative token from your board. Draw 1.' },
  { id:'sip',          name:'Sanitize',         cat:'process', lane:'cold',  points:0,  cost:1, tags:[],           desc:'Remove one negative token from your cold side. Draw 1.' },
  { id:'heatkill',     name:'Heat Kill',         cat:'process', lane:'cold', points:0,  cost:2, tags:[],           desc:'Remove all Contamination from your cold side. Each yeast there gets +5 but never grows again. Draw 1.' },
  { id:'filtration',   name:'Filtration',        cat:'process', lane:'cold', points:0,  cost:2, tags:[],           desc:'Destroy negative cards on your cold side. Draw 1, or 2 if there were none. You may re-pitch a yeast there.' },
  { id:'fining',       name:'Fining Agent',      cat:'process', lane:'both',  points:0,  cost:1, tags:[],  desc:'Remove one negative token from your board. Every yeast on your cold side gets +2. Draw 1.' },
  { id:'coldcrash',    name:'Cold Crash',        cat:'process', lane:'cold', points:3,  cost:1, tags:[],   desc:'Add 3 Lagering.' },
  { id:'kettlesour',   name:'Kettle Sour',       cat:'process', lane:'hot', points:4,  cost:2, tags:[],   desc:'Give the rival 5 Acid.' },
  { id:'lacticacid',   name:'Lactic Acid',       cat:'process', lane:'both', points:0,  cost:1, tags:[],   desc:"Double the rival's Acid." },

  // Disruption (enemy side)
  { id:'drunkcellar',  name:'Drunk Cellarman',   cat:'process', lane:'cold', points:0,  cost:1, tags:[],           desc:'Gives the rival +8 on their cold side, but you draw 3 cards.' },
  { id:'drunkbrewer',  name:'Drunk Brewer',      cat:'process', lane:'hot',  points:0,  cost:1, tags:[],           desc:'Gives the rival +8 on their hot side, but you draw 3 cards.' },
  { id:'crosscontam',  name:'Cross Contamination',cat:'process',lane:'cold', points:0,  cost:2, tags:[],    desc:'Shuffle 2 Contamination cards into the top 5 cards of the rival\'s deck. Draw 1.' },
  { id:'hopthief',     name:'Hop Thief',         cat:'process', lane:'both', points:0,  cost:1, tags:[],          desc:'Copy the highest scoring hop on the rival\'s board into your hand. Draw 1.' },
  { id:'badbatch',     name:'Bad Batch',         cat:'process', lane:'hot',  points:0,  cost:3, tags:[],           desc:'Remove the highest scoring card from the rival\'s hot side. Draw 1.' },
  { id:'inspector',    name:'Health Inspector',  cat:'process', lane:'both', points:0,  cost:3, tags:[],           desc:'Remove the highest scoring card from the rival\'s board.' },

  // Row manipulation (your side)
  { id:'dryhop',       name:'Dry Hop Addition',  cat:'process', lane:'cold', points:8, cost:1, tags:[],   desc:'Choose a hop on your hot side. Move it to your cold side; it gets +5.' },
  { id:'kettletrans',  name:'Whirlpool',   cat:'process', lane:'hot',  points:0,  cost:1, tags:[],           desc:'Every hop on your hot side gets +2. Draw 1.' },
  { id:'doublebatch',  name:'Double Batch',      cat:'process', lane:'both', points:0,  cost:2, tags:[],           desc:'Copy the last card you played and add a second instance to the same lane. Draw 1.' },
  { id:'barreltrans',  name:'Barrel Transfer',   cat:'process', lane:'cold', points:12, cost:3, tags:[],  desc:'The highest scoring card on your cold side gets +50% pts (+100% if it is oaky).' },
  { id:'recipetweak',  name:'Recipe Tweak',      cat:'process', lane:'both', points:0,  cost:0, tags:[],         desc:'Return a card on your board to your hand. It loses this battle\'s bonuses. Your next card costs 1 less. Draw 1.' },

  // Scoring/multiplier process cards
  { id:'qc',           name:'Quality Control',   cat:'process', lane:'both', points:0,  cost:1, tags:[],   desc:'If your total score is higher than the rival\'s, +14 pts. Otherwise, draw 1.' },
  { id:'tasting',      name:'Tasting Notes',     cat:'process', lane:'both', points:0,  cost:0, tags:[],         desc:"Reveal rival's hand for this turn." },
  { id:'award',        name:'Award Entry',       cat:'process', lane:'both', points:26, cost:4, tags:[],  desc:'If this is on your board when you win a battle, gain 25 gold.' },
  { id:'pilotbatch',   name:'Pilot Batch',       cat:'process', lane:'hot',  points:8,  cost:2, tags:[],         desc:'Draw 2 cards when played.' },
  { id:'grainreview',  name:'Grain Bill Review', cat:'process', lane:'hot',  points:0,  cost:0, tags:[],           desc:'Look at your next 5 cards. Put a malt from among them into your hand.' },
  { id:'fermlog',      name:'Fermentation Log',  cat:'process', lane:'cold', points:0,  cost:1, tags:[],           desc:'+3 pts to every other card on your cold side. Draw 1.' },

  // ══════════════════════════════════════════════════════════════
  // ── HOPS ──
  // Hot side = boil / whirlpool (bittering). Cold side = dry hop (aroma).
  // ══════════════════════════════════════════════════════════════

  // Noble & European — the lager hops
  { id:'saaz',       name:'Saaz',               cat:'hop', lane:'both', points:8,  cost:1, tags:['spicy','earthy','noble'],        desc:'+8 if a Pilsner malt is on your hot side.' },
  { id:'hallertau',  name:'Hallertau Mittelfrüh',cat:'hop', lane:'both', points:8, cost:1, tags:['floral','spicy','noble'],        desc:'+6 if you have no roast tokens.' },
  { id:'tettnang',   name:'Tettnang',           cat:'hop', lane:'both', points:8,  cost:1, tags:['floral','earthy','noble'],        desc:'+2 for each crisp card on your board.' },
  { id:'spalt',      name:'Spalt',              cat:'hop', lane:'both', points:8,  cost:1, tags:['spicy','floral','noble'],        desc:'+2 for each other noble hop on your board.' },
  { id:'hersbrucker',name:'Hersbrucker',        cat:'hop', lane:'both', points:8,  cost:1, tags:['floral','spicy','noble'],        desc:'+2 for each malty card on your board.' },
  { id:'perle',      name:'Perle',              cat:'hop', lane:'both', points:14, cost:2, tags:['bitter','spicy','noble'],        desc:'Boil (hot side): every other noble hop on your board gets +2.' },
  { id:'saphir',     name:'Saphir',             cat:'hop', lane:'both', points:8,  cost:1, tags:['floral','citrus','noble'],       desc:'+2 for each Lagering you have banked (it stays banked).' },
  { id:'hallblanc',  name:'Hallertau Blanc',    cat:'hop', lane:'both', points:14, cost:2, tags:['fruity','tropical','citrus'],       desc:'+3 for each noble hop on your board. Dry hop (cold side): +4.' },
  { id:'ekg',        name:'East Kent Goldings', cat:'hop', lane:'both', points:14, cost:2, tags:['earthy','floral','spicy'],             desc:'+3 for each biscuity card on your board.' },

  // Bittering
  { id:'magnum',     name:'Magnum',             cat:'hop', lane:'hot',  points:17, cost:2, tags:['bitter'],              desc:'Every other hop on your board gets +2.' },

  // West Coast — the C-hops still double each other
  { id:'cascade',    name:'Cascade',            cat:'hop', lane:'both', points:10, cost:1, tags:['citrus','floral','c-hop'],      desc:'With another c-hop on the same side, all c-hops there score +50% of their printed points.' },
  { id:'centennial', name:'Centennial',         cat:'hop', lane:'both', points:14, cost:2, tags:['citrus','floral','bitter','c-hop'],      desc:'With another c-hop on the same side, all c-hops there score +50% of their printed points.' },
  { id:'chinook',    name:'Chinook',            cat:'hop', lane:'both', points:10, cost:2, tags:['bitter','piney','spicy','c-hop'],       desc:'C-hop (+50% with another c-hop on its side). Boil (hot side): +4.' },
  { id:'columbus',   name:'Columbus',           cat:'hop', lane:'both', points:18, cost:3, tags:['bitter','dank','spicy','c-hop'],        desc:'C-hop (+50% with another c-hop on its side). Adds 1 roast token to the rival.' },
  { id:'simcoe',     name:'Simcoe',             cat:'hop', lane:'both', points:15, cost:2, tags:['piney','dank','fruity'],        desc:'Draw 1 card.' },

  // Modern American
  { id:'citra',      name:'Citra',              cat:'hop', lane:'both', points:15, cost:2, tags:['citrus','tropical'],               desc:'Draw a card when played.' },
  { id:'mosaic',     name:'Mosaic',             cat:'hop', lane:'both', points:14, cost:2, tags:['fruity','tropical','piney'],                desc:'+2 for each other tropical or fruity card on your board.' },
  { id:'strata',     name:'Strata',             cat:'hop', lane:'both', points:19, cost:3, tags:['dank','fruity','tropical'],         desc:'+3 for each other dank or tropical card on your board.' },
  { id:'idaho7',     name:'Idaho 7',            cat:'hop', lane:'both', points:14, cost:2, tags:['tropical','piney','earthy'],       desc:'+6 if both a tropical and a piney card are on your board.' },
  { id:'talus',      name:'Talus',              cat:'hop', lane:'both', points:14, cost:2, tags:['citrus','piney','earthy'],     desc:'Dry hop (cold side): every other citrus or piney card on your board gets +2.' },
  { id:'sabro',      name:'Sabro',              cat:'hop', lane:'both', points:14, cost:2, tags:['tropical','citrus','smooth'],     desc:'All other smooth cards on your board get +2.' },
  { id:'eldorado',   name:'El Dorado',          cat:'hop', lane:'both', points:14, cost:2, tags:['fruity','tropical','sweet'],               desc:'+2 for each other fruity card on your board.' },
  { id:'amarillo',   name:'Amarillo',           cat:'hop', lane:'both', points:14, cost:2, tags:['citrus','floral'],              desc:'Every other citrus card on your board gets +2.' },

  // Southern Hemisphere
  { id:'galaxy',     name:'Galaxy',             cat:'hop', lane:'both', points:16, cost:2, tags:['tropical','fruity','citrus'],       desc:'+8 if 2+ hazy cards are on your board.' },
  { id:'nelson',     name:'Nelson Sauvin',      cat:'hop', lane:'both', points:14, cost:2, tags:['fruity','thiol'], desc:'' },
  { id:'motueka',    name:'Motueka',            cat:'hop', lane:'both', points:12, cost:2, tags:['citrus','earthy'],               desc:'+2 for each other citrus card on your board.' },
  { id:'nectaron',   name:'Nectaron',           cat:'hop', lane:'both', points:16, cost:2, tags:['tropical','fruity','citrus'],       desc:'+3 for each other NZ hop on your board (Nelson, Motueka, Riwaka).' },
  { id:'riwaka',     name:'Riwaka',             cat:'hop', lane:'both', points:14, cost:3, tags:['citrus','tropical','thiol'],        desc:'Dry hop (cold side): +6. Thiol.' },

  // Hop products
  { id:'cryo',       name:'Cryo Hops',          cat:'hop', lane:'both', points:14, cost:2, tags:[],                         desc:'Copies the flavor tags of the last hop you played. Your next hop costs 1 less.' },
  { id:'hopoil',     name:'Hop Oil',            cat:'hop', lane:'both', points:8,  cost:1, tags:[],                         desc:'Copies the flavor tags of the last hop you played. Every hop on your cold side gets +3.' },

  // ══════════════════════════════════════════════════════════════
  // ── YEAST ── (all gain +2 pts per turn on the field unless noted)
  // ══════════════════════════════════════════════════════════════

  // Clean ale
  { id:'chico',      name:'Cal Ale',            cat:'yeast', lane:'cold', points:6,  cost:2, tags:['crisp'],              desc:'+2 per turn. On play: +2 per citrus, piney or dank card on your board.' },
  { id:'barbarian',  name:'Barbarian',          cat:'yeast', lane:'cold', points:6,  cost:2, tags:['fruity','hazy'],     desc:'+2 per turn. On play: +2 per hop on your board.' },
  { id:'london3',    name:'London Ale III',     cat:'yeast', lane:'cold', points:6,  cost:2, tags:['hazy','smooth','fruity'],     desc:'+2 per turn. On play: biotransformation, every hop on your cold side gets +4. +2 per hazy card.' },
  { id:'englishale', name:'English Ale',        cat:'yeast', lane:'cold', points:6,  cost:2, tags:['fruity','malty'],          desc:'+2 per turn. On play: +3 per biscuity, malty, or earthy card on your board.' },
  { id:'kveik',      name:'Voss Kveik',         cat:'yeast', lane:'cold', points:17, cost:3, tags:['fruity','dry'],               desc:'Doesn\'t grow. On play: +2 per hop on your board.' },

  // Lager & hybrid
  { id:'w3470',      name:'W-34/70',            cat:'yeast', lane:'cold', points:6,  cost:2, tags:['crisp'],              desc:'+2 per turn. On play: +2 per noble hop. +10 if every hot side card costs 2 or less.' },
  { id:'czechlager', name:'Czech Pils Lager',   cat:'yeast', lane:'cold', points:6,  cost:2, tags:['crisp','malty'],      desc:'+2 per turn. On play: +1 per hop. +8 if Saaz or a Pilsner malt is on your board.' },
  { id:'kolsch',     name:'Kölsch',             cat:'yeast', lane:'cold', points:6,  cost:2, tags:['crisp'],              desc:'+2 per turn. On play: +1 per hop. +8 if you have no roast tokens.' },

  // Belgian & wheat
  { id:'abbey',      name:'Abbey Ale',          cat:'yeast', lane:'cold', points:9,  cost:3, tags:['fruity','spicy','belgian'],    desc:'+2 per turn. On play: +3 per belgian card and +2 per sweet card on your hot side.' },
  { id:'saison',     name:'Saison',             cat:'yeast', lane:'cold', points:6,  cost:2, tags:['dry','spicy','belgian'], desc:'+2 per turn. On play: +2 per belgian, spicy, or dry card.' },
  { id:'hefeweizen', name:'Hefeweizen',         cat:'yeast', lane:'cold', points:6,  cost:2, tags:['fruity','spicy','hazy'],    desc:'+2 per turn. On play: +3 per bready, fruity, or spicy card on your board.' },

  // Wild & sour
  { id:'brett',      name:'Brettanomyces',      cat:'yeast', lane:'cold', points:6,  cost:2, tags:['funky','dry'],                desc:'+3 per turn. On play: +3 per sweet hot-side card. Always: +2 per other funky card. Each turn, 50%: Contamination for you or the rival.' },
  { id:'lacto',      name:'Lactobacillus',      cat:'yeast', lane:'cold', points:6,  cost:1, tags:['sour'],               desc:'+2 per turn. On play: give the rival 4 Acid, minus 1 for each hop on your hot side.' },
  { id:'pedio',      name:'Pediococcus',        cat:'yeast', lane:'cold', points:4,  cost:2, tags:['sour','funky'],               desc:'+2 per turn. On play: eat a fruit on your board. This gets 1.5× its points. Give the rival 2 Acid.' },

  // Engineered strains
  { id:'sourvisiae', name:'Sourvisiae',         cat:'yeast', lane:'cold', points:6,  cost:2, tags:['sour'],       desc:'+2 per turn. On play: give the rival 2 Acid. +2 per fruity or tropical card on your board.' },
  { id:'cosmicpunch',name:'Cosmic Punch',       cat:'yeast', lane:'cold', points:6,  cost:2, tags:['fruity','hazy','thiol'],      desc:'+2 per turn. On play: +2 per hop on your cold side. Thiol release: thiol cards get +6 (Phantasm +8), even ones played later.' },
  // Real strains that fill gaps: stout, sweet/dessert, hazy tropical, adjunct lager, Lagering
  { id:'irishale',   name:'Irish Ale',          cat:'yeast', lane:'cold', points:6,  cost:2, tags:['smooth'],             desc:'+2 per turn. On play: +1 per roasty card on your board. Raises your roast limit by 1.' },
  { id:'londonesb',  name:'London ESB',         cat:'yeast', lane:'cold', points:6,  cost:2, tags:['malty','fruity'],             desc:'+2 per turn. On play: +2 per sweet card on your board.' },
  { id:'vermont',    name:'Vermont Ale',        cat:'yeast', lane:'cold', points:6,  cost:2, tags:['hazy','fruity'],              desc:'+2 per turn. On play: +2 per tropical card. Tropical hops on your cold side get +2, including ones played later.' },
  { id:'mexlager',   name:'Mexican Lager',      cat:'yeast', lane:'cold', points:6,  cost:2, tags:['crisp'],              desc:'+2 per turn. +3 for each Flaked Corn, Flaked Rice or neutral card on your board, including ones played later.' },
  { id:'augustiner', name:'Augustiner Lager',   cat:'yeast', lane:'cold', points:6,  cost:2, tags:['crisp','malty'],      desc:'Grows +3 per turn instead of +2 while you have Lagering banked. On play: +2 per crisp card.' },
  { id:'scottish',   name:'Scottish Ale',       cat:'yeast', lane:'cold', points:6,  cost:2, tags:['malty','smooth'],             desc:'+2 per turn. On play: +3 per toasty card on your hot side.' },
  { id:'belgianwit', name:'Belgian Wit',        cat:'yeast', lane:'cold', points:6,  cost:2, tags:['spicy','hazy','belgian'],     desc:'+2 per turn. On play: +2 per bready, citrus or spicy adjunct on your board.' },
  { id:'roeselare',  name:'Roeselare Blend',    cat:'yeast', lane:'cold', points:6,  cost:2, tags:['sour','funky'],               desc:'+2 per turn. Each turn, give the rival 2 Acid. Oaky cards on your board get +3.' },

  // ══════════════════════════════════════════════════════════════
  // ── FLAVOUR PAYOFFS ── cards that reward the less-used tags
  // ══════════════════════════════════════════════════════════════
  // ── SPENT GRAIN ── cards that fill and use your discard pile
  { id:'grainout',      name:'Grain Out',       cat:'process', lane:'both', points:0,  cost:0, tags:[],                 desc:'Discard a card from your hand, then draw 2.' },
  { id:'trubdump',      name:'Trub Dump',       cat:'process', lane:'both', points:0,  cost:0, tags:[],                 desc:'Look at the top 3 cards of your deck. Keep one in your hand and discard the other two.' },
  { id:'yeastharvest',  name:'Yeast Harvest',   cat:'process', lane:'cold', points:0,  cost:1, tags:[],                 desc:'Find a yeast in your discard pile or deck and put it in your hand. It costs 0 this turn. If there is none, draw 1.' },
  { id:'secondrunnings',name:'Second Runnings', cat:'process',    lane:'hot',  points:6,  cost:3, tags:[],          desc:'Brew the last malt you played this round again, for free. If you have not played one, +8 pts instead.' },
  { id:'spentbread',    name:'Spent Grain Bread',cat:'adjunct',lane:'both', points:6,  cost:1, tags:['bready'],         desc:'+1 pt for each card you have played this round.' },
  { id:'solera',        name:'Solera',          cat:'adjunct', lane:'cold', points:16, cost:3, tags:['oaky','smooth'],  desc:'+2 pts for each card you have played this round.' },
  { id:'peatmalt',    name:'Peated Malt',    cat:'malt',    lane:'hot',  points:8,  cost:1, tags:['roasty','earthy'], desc:'Give the rival 2 roast tokens.' },
  { id:'brownmalt',   name:'Brown Malt',     cat:'malt',    lane:'hot',  points:12, cost:2, tags:['toasty','malty'],  desc:'+3 pts for each other toasty card on your hot side.' },
  { id:'honeymalt',   name:'Honey Malt',     cat:'malt',    lane:'hot',  points:7,  cost:1, tags:['sweet'],           desc:'Balances bitterness: +4 pts for each bitter card on your board.' },
  { id:'ryemalt',     name:'Rye Malt',       cat:'malt',    lane:'hot',  points:14, cost:2, tags:['spicy','bready','sticky'],  desc:'+3 pts for each other bready card on your hot side.' },
  { id:'fuggle',      name:'Fuggle',         cat:'hop',     lane:'both', points:7,  cost:1, tags:['earthy','floral'], desc:'+3 pts for each other earthy card on your board.' },
  { id:'summit',      name:'Summit',         cat:'hop',     lane:'both', points:13, cost:2, tags:['bitter','dank'],   desc:'+3 pts for each other piney or dank card on your board.' },
  { id:'elderflower', name:'Elderflower',    cat:'adjunct', lane:'both', points:7,  cost:1, tags:['floral','sweet'],  desc:'+3 pts for each other floral card on your board.' },
  { id:'brutenzyme',  name:'Brut Enzyme',    cat:'adjunct', lane:'both', points:12,  cost:2, tags:['dry'],             desc:'Every other dry card on your board gets +3.' },
  { id:'flakedrice',  name:'Flaked Rice',    cat:'adjunct', lane:'hot',  points:7,  cost:1, tags:['neutral','crisp'], desc:'+2 pts for each other neutral or crisp card on your hot side.' },
  { id:'yeastnutrient', name:'Yeast Nutrient', cat:'adjunct', lane:'hot', points:8, cost:1, tags:[],         desc:'Every yeast on your cold side gets +2, including ones pitched later.' },
  { id:'oakfoeder',   name:'Oak Foeder',     cat:'adjunct', lane:'cold', points:20, cost:3, tags:['oaky','funky'],    desc:'Every other funky or sour card on your cold side gets +5.' },
  // Pastry stout, pastry sour and witbier support
  { id:'hazelnut',     name:'Hazelnut',          cat:'adjunct', lane:'both', points:10, cost:2, tags:['sweet','toasty','roasty'], desc:'+2 pts for each other roasty card and each other sweet card on your hot side.' },
  { id:'bourbonbarrel',name:'Bourbon Barrel',    cat:'adjunct', lane:'cold', points:16, cost:3, tags:['oaky','sweet'],            desc:'Every other sweet card on your hot side gets +2 per roast token, including ones played later.' },
  { id:'fruitpuree',   name:'Fruit Purée',       cat:'adjunct', lane:'cold', points:12, cost:2, tags:['sweet','fruity'],          desc:'+2 pts for each other sweet or sour card on your board.' },
  { id:'graham',       name:'Graham Cracker',    cat:'adjunct', lane:'hot',  points:8,  cost:1, tags:['sweet','biscuity','toasty'], desc:'+2 pts for each other sweet card on your board.' },
  { id:'phillysour',   name:'Philly Sour',       cat:'yeast',   lane:'cold', points:6,  cost:2, tags:['sour','fruity'],   desc:'+2 per turn. On play: the rival gets 1 Acid per other sweet or fruity card (max 5). Later sweet or fruity plays add 1 more.' },
  { id:'rawwheat',     name:'Raw Wheat',         cat:'malt',    lane:'hot',  points:14, cost:2, tags:['bready','hazy'],           desc:'Unmalted, so not sticky. +2 pts for each spicy or citrus adjunct on your board.' },
  { id:'chamomile',    name:'Chamomile',         cat:'adjunct', lane:'hot',  points:7,  cost:1, tags:['floral','spicy'], desc:'+3 pts for each bready card on your hot side.' },
  { id:'sweetorange',  name:'Sweet Orange Peel', cat:'adjunct', lane:'hot',  points:8,  cost:1, tags:['citrus','sweet'], desc:'+2 pts for each other spicy card and each other sweet card on your board.' },
  // Belgian: hop, tripel/golden strong yeast, dubbel/quad yeast
  { id:'styrian',      name:'Styrian Goldings',  cat:'hop',     lane:'both', points:8,  cost:1, tags:['spicy','earthy','belgian'], desc:'+4 while a Belgian yeast is on your cold side.' },
  { id:'belgiangolden',name:'Belgian Golden Ale',cat:'yeast',   lane:'cold', points:6,  cost:2, tags:['fruity','dry','belgian'],   desc:'+2 per turn. On play: +5 per Clear Candi Sugar and +3 per crisp or dry card on your board.' },
  { id:'trappist',     name:'Trappist High Gravity', cat:'yeast', lane:'cold', points:10, cost:3, tags:['fruity','spicy','belgian'], desc:'+3 per turn. On play: +5 per candi sugar and +2 per toasty or roasty malt on your board.' },
  { id:'gueuze',       name:'Gueuze Blend',      cat:'process', lane:'cold', points:8,  cost:1, tags:['sour','funky','belgian'], desc:'Give the rival 1 Acid per other funky or sour card on your board. Oaky cards on your board get +2, including ones played later.' },
  // Payoffs for floral, smooth and bitter
  { id:'hibiscus',     name:'Hibiscus',          cat:'adjunct', lane:'both', points:10, cost:2, tags:['floral','sour','fruity'], desc:'+2 pts for each other floral or sour card on your board.' },
  { id:'nitro',        name:'Nitro Pour',        cat:'process', lane:'cold', points:6,  cost:2, tags:['smooth'],               desc:'Every other smooth card on your board gets +2, including ones played later.' },
  { id:'oatmalt',      name:'Oat Malt',          cat:'malt',    lane:'hot',  points:8,  cost:1, tags:['smooth','hazy'],         desc:'+2 pts for each other smooth card on your hot side.' },
  { id:'warrior',      name:'Warrior',           cat:'hop',     lane:'both', points:7,  cost:1, tags:['bitter'],                desc:'+3 pts for each other bitter card on your board, including ones played later.' },
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
  'gueuze',
  'trappist',
  'bourbonbarrel','phillysour',
  'nelson','riwaka','cosmicpunch','kveik','phantasm',
  'crystal75','crystal80','crystal120','coffee','aromatic','melanoidin','biscuit','victory','blackmalt',
  'heritage','spelt','buckwheat',
  'award','doublebatch','inspector','barreltrans',
  'oakfoeder','solera','lacticacid','roeselare',
];
const UNCOMMON_CARDS = [
  'hibiscus','nitro',
  'belgiangolden',
  'rawwheat','sweetorange',
  'floorpilsner','darkmunich','expwheat','expilsner','crystal50','crystal60','specialb','carafaIII',
  'roastedbar','midnightw','smokedmalt','patent',
  'cacaonibs','coldbrewcof','vanillabn','toastedcoc','maple','honey','cardamom','grainspara','candisugardk','citrazest',
  'filtration','heatkill','recipetweak','hopthief','crosscontam','badbatch','dryhop','kettletrans','fermlog',
  'hallblanc','strata','talus','nectaron','cryo','hopoil',
  'london3','barbarian','abbey','brett','sourvisiae','pedio','kettlesour',
  'irishale','vermont','augustiner','perle','saphir','belgianwit',
  'summit','brutenzyme','yeastnutrient','peatmalt','yeastharvest','secondrunnings',
];
const RARITY_NAMES = { common: 'Common', uncommon: 'Uncommon', rare: 'Rare', legendary: 'Legendary' };

// Legendary cards: never offered, sold or transformed. The only way to get one is to beat a
// hard Judge's Challenge in act 3, which unlocks it in your collection for good.
const LEGENDARY_CARDS = [
  { id:'heirloom',    name:'Heirloom Yeast',     cat:'yeast',   lane:'cold', points:10, cost:3, tags:[],            desc:'+3 per turn. Every other yeast on your board grows +1 more each turn.' },
  { id:'wethop',      name:'Wet Hop Harvest',    cat:'hop',     lane:'both', points:18, cost:3, tags:['floral','fruity'],  desc:'Every other hop on your board gets +4.' },
  { id:'landrace',    name:'Landrace Barley',    cat:'malt',    lane:'hot',  points:20, cost:2, tags:['nuanced','bready'], desc:'Also counts as an adjunct, for a Specialty Beer.' },
  { id:'imperial',    name:'Imperial Roast',     cat:'malt',    lane:'hot',  points:16, cost:3, tags:['roasty','toasty'], desc:'Adds 2 roast. Raises your roast limit by 3.' },
  { id:'coolship',    name:'Coolship',           cat:'process', lane:'cold', points:6,  cost:2, tags:['sour','funky'],     desc:'Give the rival 1 Acid for each turn left this round.' },
  { id:'masterblend', name:'Master Blender',     cat:'process', lane:'both', points:0,  cost:2, tags:[],                   desc:'Double the points of your highest-scoring card.' },
];
LEGENDARY_CARDS.forEach(c => { CARD_POOL.push(c); });

CARD_POOL.forEach(c => {
  c.rarity = LEGENDARY_CARDS.some(l => l.id === c.id) ? 'legendary' : RARE_CARDS.includes(c.id) ? 'rare' : UNCOMMON_CARDS.includes(c.id) ? 'uncommon' : 'common';
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
  { id:'contamination', name:'Contamination',  cat:'token', lane:'cold', points:-10, cost:0, tags:['funky'],  desc:'Auto-plays to cold side when drawn. Interrupts your turn but costs 0.' },
  { id:'crowd_fav',     name:'Crowd Favorite', cat:'token', lane:'hot',  points:10,  cost:0, tags:[],         desc:'Festival rivals start each round with the crowd on their side.' },
  { id:'tartness',    name:'Tartness',     cat:'token', lane:'cold', points:0,   cost:0, tags:['sour'],   desc:'Acidity keeping your beer safe from a brew day disaster.' },
  { id:'mishap',      name:'Brew Day Mishap', cat:'token', lane:'hot', points:-10, cost:0, tags:[],   desc:'Something went wrong. CIP Cycle or Fining Agent clear it.' },
  { id:'acidburn',    name:'Acid Burn',    cat:'token', lane:'cold', points:0,   cost:0, tags:['sour'],   desc:'Points eaten away by the rival\'s Acid. CIP Cycle, Fining Agent or (on your cold side) Sanitize clear it.' },
  { id:'stuckmash',   name:'Stuck Mash',   cat:'token', lane:'hot',  points:-8,  cost:0, tags:[],         desc:'Three sticky grains in a row clumped. Rice Hulls, CIP Cycle or Fining Agent clear it.' },
  { id:'contam_soft',   name:'Contamination',  cat:'token', lane:'cold', points:-5,  cost:0, tags:['funky'],  desc:'Softened Contamination, caught early by the right equipment. Must be poured onto your cold side when drawn.' },
  { id:'contam_tamed',  name:'Contamination',  cat:'token', lane:'cold', points:0,   cost:0, tags:['funky'],  desc:'Tamed by your house culture and the Lab Microscope. It fizzles out harmlessly.' },
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

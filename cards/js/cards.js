// cards.js — card definitions and deck building
// Add new cards here. Each card needs:
//   id, name, cat (malt/hop/yeast/adjunct), lane (hot/cold/both),
//   points, cost, tags[], desc (optional, for tooltips later)

const CARD_POOL = [
  // ── Base Malts ──
  { id:'2row',        name:'2-Row Malt',           cat:'malt', lane:'hot', points:10, cost:1, tags:['neutral'],         desc:'Basic points, no frills.' },
  { id:'pilsner',     name:'Pilsner Malt',          cat:'malt', lane:'hot', points:8,  cost:1, tags:['crisp'],           desc:'If first card played this turn, draw 1 card.' },
  { id:'6row',        name:'6-Row Malt',            cat:'malt', lane:'hot', points:6,  cost:1, tags:['grainy'],          desc:'Next card you play this turn costs 1 less.' },
  { id:'marisotter',  name:'Maris Otter',           cat:'malt', lane:'hot', points:12, cost:2, tags:['biscuity'],        desc:'If you have 3+ combined crystal/dark malts on hot side, +8 pts.' },
  { id:'goldenprom',  name:'Golden Promise',        cat:'malt', lane:'hot', points:16, cost:2, tags:['sweet'],           desc:'Premium base malt. High flat score.' },
  { id:'vienna',      name:'Vienna Malt',           cat:'malt', lane:'hot', points:8,  cost:2, tags:['smooth'],          desc:'Increases base score of all other malts on your hot side by +2.' },
  { id:'munich',      name:'Munich Malt',           cat:'malt', lane:'hot', points:10, cost:3, tags:['malty'],           desc:'Rich bready character.' },
  { id:'wheatwhite',  name:'White Wheat Malt',      cat:'malt', lane:'hot', points:8,  cost:1, tags:['bready','hazy'],          desc:'Add a Body card (0 cost, +5 pts) to your hand when played.' },
  { id:'expilsner',   name:'Extra Pale Pilsner',    cat:'malt', lane:'hot', points:10, cost:2, tags:['crisp'],           desc:'The next hop card you play this round gets +2 pts.' },
  { id:'floorpilsner',name:'Floor Malted Pilsner',  cat:'malt', lane:'hot', points:14, cost:3, tags:['crisp'],           desc:'If no crystal or dark malts on hot side, +10 bonus pts.' },
  { id:'darkmunich',  name:'Dark Munich',           cat:'malt', lane:'hot', points:14, cost:3, tags:['bready','toasty'], desc:'Each crystal malt already on your hot side gets +4 pts.' },
  { id:'expwheat',    name:'Extra Pale Wheat',      cat:'malt', lane:'hot', points:10, cost:3, tags:['neutral','crisp'], desc:'The next hop card you play this round gets +3 pts.' },
  { id:'paleale',     name:'Pale Ale Malt',         cat:'malt', lane:'hot', points:10, cost:1, tags:['biscuity'],        desc:'Simple reliable base malt.' },
  { id:'heritage',    name:'Local Grown Heritage',  cat:'malt', lane:'hot', points:10, cost:3, tags:['nuanced'],         desc:'Nuanced cards multiply each other.' },

  // ── Light Crystal (multiply cheap cards) ──
  { id:'crystal10',  name:'Crystal 10',    cat:'malt', lane:'hot', points:6,  cost:1, tags:['sweet','crisp'],           desc:'All cost-1 cards on your hot side get +3 pts.' },
  { id:'crystal20',  name:'Crystal 20',    cat:'malt', lane:'hot', points:8,  cost:1, tags:['sweet','crisp'],           desc:'All cost-1 cards on your hot side get +4 pts.' },
  { id:'crystal30',  name:'Crystal 30',    cat:'malt', lane:'hot', points:10, cost:2, tags:['sweet'],                   desc:'All cost-1 cards on your hot side get +5 pts.' },

  // ── Medium Crystal (board composition) ──
  { id:'crystal40',  name:'Crystal 40',    cat:'malt', lane:'hot', points:10, cost:2, tags:['sweet'],                   desc:'+2 pts for each base malt on your hot side.' },
  { id:'crystal50',  name:'Crystal 50',    cat:'malt', lane:'hot', points:12, cost:2, tags:['sweet','toasty'],          desc:'Binds to the last base malt played — that malt scores double.' },
  { id:'crystal60',  name:'Crystal 60',    cat:'malt', lane:'hot', points:14, cost:2, tags:['sweet','toasty'],          desc:'+3 pts for each base malt on your hot side.' },
  { id:'crystal75',  name:'Crystal 75',    cat:'malt', lane:'hot', points:16, cost:3, tags:['sweet','toasty'],          desc:'+4 pts for each card currently on your hot side.' },

  // ── Dark Crystal (explosive but dangerous) ──
  { id:'crystal80',  name:'Crystal 80',    cat:'malt', lane:'hot', points:18, cost:3, tags:['sweet','roasty'],          desc:'Score = roast tokens x8. Adds a Sugar Clot (-10 pts) to hot side. Hops played hot side remove it.' },
  { id:'crystal120', name:'Crystal 120',   cat:'malt', lane:'hot', points:10, cost:2, tags:['sweet','roasty'],          desc:'Sacrifice a crystal malt on your hot side to play. Gains that card\'s point value as a bonus.' },

  // ── Specialty / Mid-range ──
  { id:'carapils',   name:'Carapils',      cat:'malt', lane:'hot', points:6,  cost:1, tags:['smooth','sweet'],          desc:'Adjacent cards on hot side each get +3 pts.' },
  { id:'specialb',   name:'Special B',     cat:'malt', lane:'hot', points:14, cost:3, tags:['sweet','roasty'],          desc:'Score = roast tokens x6. Adds a Sugar Clot (-8 pts) to hot side.' },
  { id:'melanoidin', name:'Melanoidin',    cat:'malt', lane:'hot', points:12, cost:2, tags:['malty','toasty'],          desc:'Scores double for each copy in discard pile. Its value cannot be reduced by other cards.' },
  { id:'aromatic',   name:'Aromatic Malt', cat:'malt', lane:'hot', points:12, cost:2, tags:['malty','bready'],          desc:'Copies the effect of the last malt played this round.' },
  { id:'biscuit',    name:'Biscuit Malt',  cat:'malt', lane:'hot', points:4,  cost:1, tags:['biscuity','toasty'],       desc:'Cannot benefit from multipliers. Multiplies base score by number of cards in your hot side row.' },
  { id:'victory',    name:'Victory Malt',  cat:'malt', lane:'hot', points:14, cost:3, tags:['biscuity','toasty'],       desc:'If you win the round this was played in, it stays on the board next round instead of discarding.' },
  { id:'caramun',    name:'Caramunich',    cat:'malt', lane:'hot', points:12, cost:2, tags:['sweet','toasty'],          desc:'Rich caramel and bread character.' },

  // ── Dark Malts ──
  { id:'choc',        name:'Chocolate Malt',   cat:'malt', lane:'hot', points:16, cost:3, tags:['toasty','roasty'],  desc:'Adds 1 roast token.' },
  { id:'patent',      name:'Black Patent',     cat:'malt', lane:'hot', points:20, cost:2, tags:['roasty'],           desc:'Adds 2 roast tokens.' },
  { id:'roastedbar',  name:'Roasted Barley',   cat:'malt', lane:'hot', points:18, cost:3, tags:['roasty','dry'],     desc:'Adds 2 roast tokens. If 3+ roast tokens total, +10 bonus pts.' },
  { id:'carafaI',     name:'Carafa I',         cat:'malt', lane:'hot', points:12, cost:2, tags:['roasty','smooth'],  desc:'Adds 1 roast token. Roast penalty threshold increases by 1.' },
  { id:'carafaII',    name:'Carafa II',        cat:'malt', lane:'hot', points:16, cost:3, tags:['roasty','smooth'],  desc:'Adds 1 roast token. Roast penalty threshold increases by 1.' },
  { id:'carafaIII',   name:'Carafa III',       cat:'malt', lane:'hot', points:20, cost:3, tags:['roasty','smooth'],  desc:'Adds 2 roast tokens. Roast penalty threshold increases by 1.' },
  { id:'blackmalt',   name:'Black Malt',       cat:'malt', lane:'hot', points:18, cost:2, tags:['roasty','toasty'],  desc:'Adds 2 roast tokens. Adjacent crystal malt scores double.' },
  { id:'palechoc',    name:'Pale Chocolate',   cat:'malt', lane:'hot', points:14, cost:2, tags:['toasty','roasty'],  desc:'Adds 1 roast token. Milder chocolate character.' },
  { id:'midnightw',   name:'Midnight Wheat',   cat:'malt', lane:'hot', points:16, cost:3, tags:['roasty','smooth'],  desc:'Adds 1 roast token but counts as 0 toward the penalty threshold.' },
  { id:'debittered',  name:'De-bittered Black',cat:'malt', lane:'hot', points:14, cost:2, tags:['roasty','smooth'],  desc:'Removes 1 roast token when played.' },
  { id:'smokedmalt',  name:'Smoked Malt',      cat:'malt', lane:'hot', points:12, cost:2, tags:['roasty','dry'],     desc:'Adds 1 roast token. All roasty cards on hot side get +2 pts.' },

  // ── Adjuncts ──

  // Carried over
  { id:'oats',       name:'Flaked Oats',     cat:'adjunct', lane:'hot', points:8,  cost:1, tags:['smooth','hazy'],               desc:'If played next to a dark malt, double that malt\'s base score.' },
  { id:'coffee',     name:'Coffee Beans',    cat:'adjunct', lane:'hot', points:12, cost:3, tags:['toasty','roasty'],       desc:'Doubles the effect of dark malts.' },
  { id:'maltodex',   name:'Maltodextrin',    cat:'adjunct', lane:'hot', points:6,  cost:2, tags:['smooth'],               desc:'Next malt or adjunct you play costs 0.' },
  { id:'lactose',    name:'Lactose',         cat:'adjunct', lane:'hot', points:8,  cost:2, tags:['sweet'],                desc:'Removes 2 roast tokens.' },

  // Fruit adjuncts
  { id:'raspberry',  name:'Raspberries',     cat:'adjunct', lane:'hot', points:10, cost:2, tags:['sweet','fruity'],       desc:'Each sweet tagged card on hot side gets +2 pts.' },
  { id:'cherry',     name:'Cherries',        cat:'adjunct', lane:'hot', points:10, cost:2, tags:['sweet','fruity'],       desc:'If 2+ dark malts on hot side, +8 bonus pts.' },
  { id:'mango',      name:'Mango',           cat:'adjunct', lane:'hot', points:8,  cost:1, tags:['sweet','tropical','hazy'],desc:'Adds a Haze token to your hand.' },
  { id:'passionfr',  name:'Passion Fruit',   cat:'adjunct', lane:'hot', points:10, cost:2, tags:['tropical','fruity'],       desc:'Each hop on cold side gets +2 pts.' },
  { id:'blueberry',  name:'Blueberry',       cat:'adjunct', lane:'hot', points:8,  cost:2, tags:['sweet','fruity'],       desc:'If played after a crystal malt, score double.' },
  { id:'bloodorange',name:'Blood Orange',    cat:'adjunct', lane:'hot', points:10, cost:2, tags:['fruity','bitter'],      desc:'If you have a citrus hop on cold side, +6 pts.' },

  // Sweet/pastry adjuncts
  { id:'vanilla',    name:'Vanilla',         cat:'adjunct', lane:'hot', points:10, cost:2, tags:['sweet','smooth'],       desc:'All sweet tagged cards on your board get +2 pts.' },
  { id:'coconut',    name:'Coconut',         cat:'adjunct', lane:'hot', points:8,  cost:2, tags:['sweet','smooth'],       desc:'Adds a Body token to your hand.' },
  { id:'cacaonibs',  name:'Cacao Nibs',      cat:'adjunct', lane:'hot', points:14, cost:3, tags:['sweet','roasty'],       desc:'Adds 1 roast token. If Chocolate Malt on hot side, score double.' },
  { id:'honey',      name:'Honey',           cat:'adjunct', lane:'hot', points:10, cost:2, tags:['sweet','crisp'],        desc:'If first adjunct played this round, costs 0.' },
  { id:'maple',      name:'Maple Syrup',     cat:'adjunct', lane:'hot', points:12, cost:3, tags:['sweet','malty'],        desc:'+4 pts for each malty tagged card on hot side.' },
  { id:'marshm',     name:'Marshmallow',     cat:'adjunct', lane:'hot', points:8,  cost:1, tags:['sweet','smooth'],       desc:'All smooth tagged cards get +2 pts this round.' },

  // Grain/texture adjuncts
  { id:'flakedwheat',name:'Flaked Wheat',    cat:'adjunct', lane:'hot', points:8,  cost:1, tags:['smooth','bready','hazy'],      desc:'Adds a Haze token to your hand.' },
  { id:'flakedrye',  name:'Flaked Rye',      cat:'adjunct', lane:'hot', points:8,  cost:1, tags:['dry','spicy'],          desc:'Next yeast card costs 1 less.' },
  { id:'flakedcorn', name:'Flaked Corn',     cat:'adjunct', lane:'hot', points:6,  cost:1, tags:['neutral','crisp'],      desc:'If 3+ neutral cards on board, +10 pts.' },
  { id:'ricehulls',  name:'Rice Hulls',      cat:'adjunct', lane:'hot', points:2,  cost:0, tags:['neutral'],              desc:'Free play. Next card costs 1 less.' },
  { id:'oatflakes',  name:'Oat Flakes',      cat:'adjunct', lane:'hot', points:8,  cost:1, tags:['smooth','hazy'],               desc:'Smooth body. Counts as adjunct not malt.' },
  { id:'spelt',      name:'Spelt',           cat:'adjunct', lane:'hot', points:10, cost:2, tags:['bready','nuanced'],     desc:'Nuanced cards multiply each other.' },
  { id:'buckwheat',  name:'Buckwheat',       cat:'adjunct', lane:'hot', points:8,  cost:2, tags:['dry','nuanced'],        desc:'If 2+ nuanced cards on board, draw 1 card.' },

  // Belgian adjuncts
  { id:'candisugarcl', name:'Clear Candi Sugar',  cat:'adjunct', lane:'hot', points:6,  cost:1, tags:['sweet','belgian'],            desc:'+3 pts for each Belgian yeast on cold side.' },
  { id:'candisugarab', name:'Amber Candi Sugar',  cat:'adjunct', lane:'hot', points:8,  cost:2, tags:['sweet','belgian','toasty'],   desc:'+4 pts for each Belgian yeast on cold side. Adds body and color.' },
  { id:'candisugardk', name:'Dark Candi Sugar',   cat:'adjunct', lane:'hot', points:10, cost:2, tags:['sweet','belgian','roasty'],   desc:'+5 pts for each Belgian yeast on cold side. Rich dark fruit.' },
  { id:'coriander',   name:'Coriander',           cat:'adjunct', lane:'hot', points:8,  cost:1, tags:['spicy','belgian'],            desc:'If a Belgian yeast is on your cold side, +8 pts.' },
  { id:'orangepeel',  name:'Orange Peel',         cat:'adjunct', lane:'hot', points:8,  cost:1, tags:['citrus','belgian','fruity'],  desc:'Bridges fruit and belgian — +2 to each citrus and belgian tagged card.' },
  { id:'grainspara',  name:'Grains of Paradise',  cat:'adjunct', lane:'hot', points:10, cost:2, tags:['spicy','belgian','dry'],      desc:'If 3+ belgian tagged cards on board, +12 pts.' },
  { id:'cardamom',    name:'Cardamom',             cat:'adjunct', lane:'hot', points:8,  cost:2, tags:['spicy','sweet','belgian'],    desc:'+3 pts for each sweet card and each spicy card on board.' },
  { id:'citrazest',  name:'Citra Zest',      cat:'adjunct', lane:'hot', points:10, cost:2, tags:['fruity','bitter'],      desc:'Next hop card you play this turn costs 0.' },
  { id:'vanillabn',  name:'Vanilla Bean',    cat:'adjunct', lane:'hot', points:12, cost:3, tags:['sweet','smooth'],       desc:'All sweet cards get +3 pts instead of +2.' },
  { id:'toastedcoc', name:'Toasted Coconut', cat:'adjunct', lane:'hot', points:10, cost:2, tags:['sweet','toasty'],       desc:'If both sweet and toasty tags present on hot side, +8 pts.' },
  { id:'coldbrewcof',name:'Cold Brew Coffee',cat:'adjunct', lane:'hot', points:16, cost:3, tags:['toasty','roasty','smooth'], desc:'Adds 1 roast token. Roast penalty threshold +1.' },
  { id:'chili',      name:'Chili Pepper',    cat:'adjunct', lane:'hot', points:8,  cost:2, tags:['spicy','dry'],          desc:'Removes a Sugar Clot from your board if present.' },
  { id:'cinnamon',   name:'Cinnamon',        cat:'adjunct', lane:'hot', points:8,  cost:2, tags:['spicy','sweet'],        desc:'+3 pts for each sweet card on hot side.' },
  { id:'phantasm',   name:'Phantasm',        cat:'adjunct', lane:'hot', points:2,  cost:2, tags:['fruity','thiol'],       desc:'Grape-derived bound thiols. Worth little alone — a thiol-releasing yeast unlocks +12.' },

  // ── Process Cards ──

  // Cleaning/Removal (your side)
  { id:'cip',          name:'CIP Cycle',        cat:'process', lane:'both', points:0,  cost:2, tags:['clean'],           desc:'Remove any one card from your hot or cold side.' },
  { id:'sip',          name:'SIP Rinse',         cat:'process', lane:'hot',  points:0,  cost:1, tags:['clean'],           desc:'Remove a token card from your hot side.' },
  { id:'heatkill',     name:'Heat Kill',         cat:'process', lane:'cold', points:0,  cost:2, tags:['clean'],           desc:'Remove all Contamination cards from your cold side.' },
  { id:'filtration',   name:'Filtration',        cat:'process', lane:'cold', points:0,  cost:3, tags:['clean'],           desc:'Remove any one card from your cold side and draw 1.' },
  { id:'fining',       name:'Fining Agent',      cat:'process', lane:'hot',  points:0,  cost:1, tags:['clean','smooth'],  desc:'Remove a negative token from your board. Draw 1 if nothing to remove.' },
  { id:'coldcrash',    name:'Cold Crash',        cat:'process', lane:'cold', points:8,  cost:2, tags:['crisp','clean'],   desc:'Scores points AND removes one token from cold side.' },

  // Disruption (enemy side)
  { id:'drunkcellar',  name:'Drunk Cellarman',   cat:'process', lane:'cold', points:0,  cost:1, tags:['funky'],           desc:'Play on ENEMY cold side. Adds +8 to their score but you draw 2 cards.' },
  { id:'drunkbrewer',  name:'Drunk Brewer',      cat:'process', lane:'hot',  points:0,  cost:1, tags:['funky'],           desc:'Play on ENEMY hot side. Adds +8 to their score but you draw 2 cards.' },
  { id:'crosscontam',  name:'Cross Contamination',cat:'process',lane:'cold', points:0,  cost:2, tags:['funky','sour'],    desc:'Shuffle 2 Contamination cards into enemy deck.' },
  { id:'hopthief',     name:'Hop Thief',         cat:'process', lane:'both', points:0,  cost:2, tags:['bitter'],          desc:'Copy the highest scoring hop on enemy board and add it to your hand.' },
  { id:'badbatch',     name:'Bad Batch',         cat:'process', lane:'hot',  points:0,  cost:3, tags:['funky'],           desc:'Remove the highest scoring card from enemy hot side.' },
  { id:'inspector',    name:'Health Inspector',  cat:'process', lane:'both', points:0,  cost:3, tags:['clean'],           desc:'Remove any one card from enemy board.' },

  // Row manipulation (your side)
  { id:'dryhop',       name:'Dry Hop Addition',  cat:'process', lane:'cold', points:10, cost:2, tags:['bitter','hazy'],   desc:'Move a hop from your hot side to cold side. It keeps its points.' },
  { id:'kettletrans',  name:'Kettle Transfer',   cat:'process', lane:'hot',  points:0,  cost:1, tags:['clean'],           desc:'Move any card from cold side to hot side if lane allows.' },
  { id:'doublebatch',  name:'Double Batch',      cat:'process', lane:'both', points:0,  cost:3, tags:['malty'],           desc:'Copy the last card you played and add a second instance to the same lane.' },
  { id:'barreltrans',  name:'Barrel Transfer',   cat:'process', lane:'cold', points:12, cost:3, tags:['smooth','malty'],  desc:'The highest scoring card on your cold side gets +50% pts this round.' },
  { id:'recipetweak',  name:'Recipe Tweak',      cat:'process', lane:'both', points:0,  cost:2, tags:['nuanced'],         desc:'Swap one card in your hand with one on your hot side.' },

  // Scoring/multiplier process cards
  { id:'qc',           name:'Quality Control',   cat:'process', lane:'both', points:0,  cost:2, tags:['clean','crisp'],   desc:'If your total score is higher than rival, +10 pts.' },
  { id:'tasting',      name:'Tasting Notes',     cat:'process', lane:'both', points:0,  cost:1, tags:['nuanced'],         desc:"Reveal rival's hand for this turn." },
  { id:'award',        name:'Award Entry',       cat:'process', lane:'both', points:20, cost:4, tags:['nuanced','clean'],  desc:'If you win this round, draw 3 cards.' },
  { id:'pilotbatch',   name:'Pilot Batch',       cat:'process', lane:'hot',  points:8,  cost:1, tags:['neutral'],         desc:'Draw 2 cards when played.' },
  { id:'grainreview',  name:'Grain Bill Review', cat:'process', lane:'hot',  points:0,  cost:1, tags:['malty'],           desc:'Reveal the top 3 cards of your deck.' },
  { id:'fermlog',      name:'Fermentation Log',  cat:'process', lane:'cold', points:0,  cost:1, tags:['clean'],           desc:'+2 pts to every card currently on your cold side.' },

  // ══════════════════════════════════════════════════════════════
  // ── HOPS ──
  // Hot side = boil / whirlpool (bittering). Cold side = dry hop (aroma).
  // ══════════════════════════════════════════════════════════════

  // Noble & European — the lager hops
  { id:'saaz',       name:'Saaz',               cat:'hop', lane:'both', points:8,  cost:1, tags:['spicy','earthy','noble'],        desc:'+8 if a Pilsner malt is on your hot side.' },
  { id:'hallertau',  name:'Hallertau Mittelfrüh',cat:'hop', lane:'both', points:10, cost:1, tags:['floral','spicy','noble'],        desc:'+6 if you have no roast tokens.' },
  { id:'tettnang',   name:'Tettnang',           cat:'hop', lane:'both', points:8,  cost:1, tags:['floral','earthy','noble'],        desc:'+2 for each crisp card on your board.' },
  { id:'hallblanc',  name:'Hallertau Blanc',    cat:'hop', lane:'both', points:12, cost:2, tags:['fruity','tropical','citrus'],       desc:'+3 for each noble hop on your board. Dry hop (cold side): +4.' },
  { id:'ekg',        name:'East Kent Goldings', cat:'hop', lane:'both', points:12, cost:2, tags:['earthy','floral','spicy'],             desc:'+8 if a biscuity malt is on your hot side.' },

  // Bittering
  { id:'magnum',     name:'Magnum',             cat:'hop', lane:'hot',  points:14, cost:2, tags:['bitter','clean'],              desc:'Boil only. Clean bittering backbone: every other hop on your board gets +2.' },

  // West Coast — the C-hops still double each other
  { id:'cascade',    name:'Cascade',            cat:'hop', lane:'both', points:10, cost:1, tags:['citrus','floral','c-hop'],      desc:'If another c-hop is on the same lane, all c-hops there score double.' },
  { id:'centennial', name:'Centennial',         cat:'hop', lane:'both', points:12, cost:2, tags:['citrus','floral','bitter','c-hop'],      desc:'If another c-hop is on the same lane, all c-hops there score double.' },
  { id:'chinook',    name:'Chinook',            cat:'hop', lane:'both', points:12, cost:2, tags:['bitter','piney','spicy','c-hop'],       desc:'C-hop doubling. Boil (hot side): +4.' },
  { id:'columbus',   name:'Columbus',           cat:'hop', lane:'both', points:14, cost:2, tags:['bitter','dank','spicy','c-hop'],        desc:'C-hop doubling. Adds 1 roast token to the rival.' },
  { id:'simcoe',     name:'Simcoe',             cat:'hop', lane:'both', points:14, cost:2, tags:['piney','dank','fruity'],        desc:'Dry hop (cold side): draw 1 card.' },

  // Modern American
  { id:'citra',      name:'Citra',              cat:'hop', lane:'both', points:14, cost:2, tags:['citrus','tropical'],               desc:'Draw a card when played.' },
  { id:'mosaic',     name:'Mosaic',             cat:'hop', lane:'both', points:12, cost:2, tags:['fruity','tropical','piney'],                desc:'+2 for each different hop variety on your board.' },
  { id:'strata',     name:'Strata',             cat:'hop', lane:'both', points:14, cost:3, tags:['dank','fruity','tropical'],         desc:'+3 for each other dank or tropical card on your board.' },
  { id:'idaho7',     name:'Idaho 7',            cat:'hop', lane:'both', points:12, cost:2, tags:['tropical','piney','earthy'],       desc:'+6 if both a tropical and a piney card are on your board.' },
  { id:'talus',      name:'Talus',              cat:'hop', lane:'both', points:12, cost:2, tags:['citrus','piney','earthy'],     desc:'Dry hop (cold side): every hazy card on your board gets +2.' },
  { id:'sabro',      name:'Sabro',              cat:'hop', lane:'both', points:12, cost:2, tags:['tropical','citrus','smooth'],     desc:'All smooth cards on your board get +2.' },
  { id:'eldorado',   name:'El Dorado',          cat:'hop', lane:'both', points:12, cost:2, tags:['fruity','sweet'],               desc:'+2 for each sweet adjunct on your hot side.' },
  { id:'amarillo',   name:'Amarillo',           cat:'hop', lane:'both', points:12, cost:2, tags:['citrus','floral'],              desc:'+2 for each fruity adjunct on your hot side.' },

  // Southern Hemisphere
  { id:'galaxy',     name:'Galaxy',             cat:'hop', lane:'both', points:14, cost:2, tags:['tropical','fruity','citrus'],       desc:'+8 if 2+ hazy cards are on your board.' },
  { id:'nelson',     name:'Nelson Sauvin',      cat:'hop', lane:'both', points:14, cost:3, tags:['fruity','nuanced','thiol'], desc:'Nuanced cards multiply each other. Thiol.' },
  { id:'motueka',    name:'Motueka',            cat:'hop', lane:'both', points:10, cost:2, tags:['citrus','earthy'],               desc:'+2 for each citrus card on your board.' },
  { id:'nectaron',   name:'Nectaron',           cat:'hop', lane:'both', points:14, cost:2, tags:['tropical','fruity','citrus'],       desc:'+3 for each other NZ hop on your board (Nelson, Motueka, Riwaka).' },
  { id:'riwaka',     name:'Riwaka',             cat:'hop', lane:'both', points:14, cost:3, tags:['citrus','tropical','thiol'],        desc:'Dry hop (cold side): +6. Thiol.' },

  // Hop products
  { id:'cryo',       name:'Cryo Hops',          cat:'hop', lane:'both', points:14, cost:2, tags:[],                         desc:'Concentrated lupulin. Copies the flavor tags of the last hop you played. Your next hop costs 1 less.' },
  { id:'hopoil',     name:'Hop Oil',            cat:'hop', lane:'cold', points:6,  cost:1, tags:[],                         desc:'Dry hop only. Copies the flavor tags of the last hop you played. Every hop on your cold side gets +3.' },

  // ══════════════════════════════════════════════════════════════
  // ── YEAST ── (all gain +2 pts per turn on the field unless noted)
  // ══════════════════════════════════════════════════════════════

  // Clean ale
  { id:'chico',      name:'Chico (Cal Ale)',    cat:'yeast', lane:'cold', points:4,  cost:2, tags:['crisp','clean'],              desc:'+2 per turn. On play: +1 per hop and per base malt on your board. +6 if no funky or sour cards on cold side.' },
  { id:'barbarian',  name:'Barbarian',          cat:'yeast', lane:'cold', points:4,  cost:2, tags:['fruity','clean'],             desc:'+2 per turn. On play: +2 per hop on your board. Draw 1 if 3+ hops.' },
  { id:'london3',    name:'London Ale III',     cat:'yeast', lane:'cold', points:4,  cost:2, tags:['hazy','smooth','fruity'],     desc:'+2 per turn. On play: biotransformation — every hop on your cold side gets +3. +2 per hazy card.' },
  { id:'englishale', name:'English Ale',        cat:'yeast', lane:'cold', points:4,  cost:2, tags:['biscuity','smooth'],          desc:'+2 per turn. On play: +2 per biscuity or malty card on your hot side.' },
  { id:'kveik',      name:'Voss Kveik',         cat:'yeast', lane:'cold', points:12, cost:3, tags:['fruity','dry'],               desc:'No accumulation — it ferments hot and fast. On play: +2 per hop on your board.' },

  // Lager & hybrid
  { id:'w3470',      name:'W-34/70',            cat:'yeast', lane:'cold', points:4,  cost:2, tags:['crisp','clean'],              desc:'+2 per turn. On play: +2 per noble hop. +10 if every hot side card costs 2 or less.' },
  { id:'czechlager', name:'Czech Pils Lager',   cat:'yeast', lane:'cold', points:4,  cost:2, tags:['crisp','clean','malty'],      desc:'+2 per turn. On play: +1 per hop. +8 if Saaz or a Pilsner malt is on your board.' },
  { id:'kolsch',     name:'Kölsch',             cat:'yeast', lane:'cold', points:4,  cost:2, tags:['crisp','clean'],              desc:'+2 per turn. On play: +1 per hop. +8 if you have no roast tokens.' },

  // Belgian & wheat
  { id:'abbey',      name:'Abbey Ale',          cat:'yeast', lane:'cold', points:4,  cost:3, tags:['sweet','funky','belgian'],    desc:'+2 per turn. On play: +3 per belgian card and +2 per sweet card on your hot side.' },
  { id:'saison',     name:'Saison',             cat:'yeast', lane:'cold', points:4,  cost:2, tags:['dry','spicy','funky','belgian'], desc:'+2 per turn. On play: +2 per belgian or spicy card. Ferments bone dry — removes a Sugar Clot.' },
  { id:'hefeweizen', name:'Hefeweizen',         cat:'yeast', lane:'cold', points:4,  cost:2, tags:['sweet','bready','smooth'],    desc:'+2 per turn. On play: +2 per bready card on your hot side.' },

  // Wild & sour
  { id:'brett',      name:'Brettanomyces',      cat:'yeast', lane:'cold', points:4,  cost:2, tags:['funky','dry'],                desc:'+3 per turn. On play: eats residual sugar — +3 per sweet card on hot side. Each turn, 50% chance to shuffle Contamination into your deck.' },
  { id:'lacto',      name:'Lactobacillus',      cat:'yeast', lane:'cold', points:6,  cost:1, tags:['sour','crisp'],               desc:'+2 per turn. Hop-sensitive: on play +6 if no hops on your board, −4 if any. Shuffles 1 Contamination into your deck.' },

  // Engineered strains
  { id:'sourvisiae', name:'Sourvisiae',         cat:'yeast', lane:'cold', points:4,  cost:2, tags:['sour','crisp','clean'],       desc:'+2 per turn. Clean sour, no contamination. On play: +2 per fruity or tropical card and +2 per hop (not hop-sensitive).' },
  { id:'cosmicpunch',name:'Cosmic Punch',       cat:'yeast', lane:'cold', points:4,  cost:2, tags:['fruity','hazy','thiol'],      desc:'+2 per turn. Thiol release: every thiol card on your board gets +6 (Phantasm +12), including ones played later.' },
];

// ── Default deck composition (30 cards) ──
// Change this list to change the starting deck makeup.
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
  { id:'body',        name:'Body',         cat:'token', lane:'hot',  points:5,   cost:0, tags:['smooth'], desc:'Simple +5 pts. Generated by White Wheat Malt.' },
  { id:'haze',        name:'Haze',         cat:'token', lane:'both', points:4,   cost:1, tags:['hazy'],   desc:'When played, +4 pts to all hops currently on your board. Stays in play as a hazy token.' },
  { id:'roast_token',   name:'Roast',          cat:'token', lane:'hot',  points:0,   cost:0, tags:['roasty'], desc:'Roast counter. At 5 roast, total hot side score is halved.' },
  { id:'contamination', name:'Contamination',  cat:'token', lane:'cold', points:-10, cost:0, tags:['funky'],  desc:'Auto-plays to cold side when drawn. Interrupts your turn but costs 0.' },
  { id:'contam_soft',   name:'Contamination',  cat:'token', lane:'cold', points:-5,  cost:0, tags:['funky'],  desc:'Softer contamination from Lachancea. Auto-plays to cold side when drawn.' },
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

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
  { id:'wheatwhite',  name:'White Wheat Malt',      cat:'malt', lane:'hot', points:8,  cost:1, tags:['bready'],          desc:'Add a Body card (0 cost, +5 pts) to your hand when played.' },
  { id:'expilsner',   name:'Extra Pale Pilsner',    cat:'malt', lane:'hot', points:10, cost:2, tags:['crisp'],           desc:'Each hop card on your field gets +2 pts when played.' },
  { id:'floorpilsner',name:'Floor Malted Pilsner',  cat:'malt', lane:'hot', points:14, cost:3, tags:['crisp'],           desc:'If no crystal or dark malts on hot side, +10 bonus pts.' },
  { id:'darkmunich',  name:'Dark Munich',           cat:'malt', lane:'hot', points:14, cost:3, tags:['bready','toasty'], desc:'Each crystal malt on your hot side gets +4 pts when played.' },
  { id:'expwheat',    name:'Extra Pale Wheat',      cat:'malt', lane:'hot', points:10, cost:3, tags:['neutral','crisp'], desc:'Each hop card on your field gets +3 pts when played.' },
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
  { id:'oats',       name:'Flaked Oats',     cat:'adjunct', lane:'hot', points:8,  cost:1, tags:['smooth'],               desc:'If played next to a dark malt, double that malt\'s base score.' },
  { id:'coffee',     name:'Coffee Beans',    cat:'adjunct', lane:'hot', points:12, cost:3, tags:['toasty','roasty'],       desc:'Doubles the effect of dark malts.' },
  { id:'maltodex',   name:'Maltodextrin',    cat:'adjunct', lane:'hot', points:6,  cost:2, tags:['smooth'],               desc:'Next malt or adjunct you play costs 0.' },
  { id:'lactose',    name:'Lactose',         cat:'adjunct', lane:'hot', points:8,  cost:2, tags:['sweet'],                desc:'Removes 2 roast tokens.' },

  // Fruit adjuncts
  { id:'raspberry',  name:'Raspberries',     cat:'adjunct', lane:'hot', points:10, cost:2, tags:['sweet','fruity'],       desc:'Each sweet tagged card on hot side gets +2 pts.' },
  { id:'cherry',     name:'Cherries',        cat:'adjunct', lane:'hot', points:10, cost:2, tags:['sweet','fruity'],       desc:'If 2+ dark malts on hot side, +8 bonus pts.' },
  { id:'mango',      name:'Mango',           cat:'adjunct', lane:'hot', points:8,  cost:1, tags:['sweet','fruity','hazy'],desc:'Adds a Haze token to your hand.' },
  { id:'passionfr',  name:'Passion Fruit',   cat:'adjunct', lane:'hot', points:10, cost:2, tags:['fruity','crisp'],       desc:'Each hop on cold side gets +2 pts.' },
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
  { id:'flakedwheat',name:'Flaked Wheat',    cat:'adjunct', lane:'hot', points:8,  cost:1, tags:['smooth','bready'],      desc:'Adds a Haze token to your hand.' },
  { id:'flakedrye',  name:'Flaked Rye',      cat:'adjunct', lane:'hot', points:8,  cost:1, tags:['dry','spicy'],          desc:'Next yeast card costs 1 less.' },
  { id:'flakedcorn', name:'Flaked Corn',     cat:'adjunct', lane:'hot', points:6,  cost:1, tags:['neutral','crisp'],      desc:'If 3+ neutral cards on board, +10 pts.' },
  { id:'ricehulls',  name:'Rice Hulls',      cat:'adjunct', lane:'hot', points:2,  cost:0, tags:['neutral'],              desc:'Free play. Next card costs 1 less.' },
  { id:'oatflakes',  name:'Oat Flakes',      cat:'adjunct', lane:'hot', points:8,  cost:1, tags:['smooth'],               desc:'Smooth body. Counts as adjunct not malt.' },
  { id:'spelt',      name:'Spelt',           cat:'adjunct', lane:'hot', points:10, cost:2, tags:['bready','nuanced'],     desc:'Nuanced cards multiply each other.' },
  { id:'buckwheat',  name:'Buckwheat',       cat:'adjunct', lane:'hot', points:8,  cost:2, tags:['dry','nuanced'],        desc:'If 2+ nuanced cards on board, draw 1 card.' },

  // Specialty adjuncts
  { id:'citrazest',  name:'Citra Zest',      cat:'adjunct', lane:'hot', points:10, cost:2, tags:['fruity','bitter'],      desc:'Next hop card you play this turn costs 0.' },
  { id:'vanillabn',  name:'Vanilla Bean',    cat:'adjunct', lane:'hot', points:12, cost:3, tags:['sweet','smooth'],       desc:'All sweet cards get +3 pts instead of +2.' },
  { id:'toastedcoc', name:'Toasted Coconut', cat:'adjunct', lane:'hot', points:10, cost:2, tags:['sweet','toasty'],       desc:'If both sweet and toasty tags present on hot side, +8 pts.' },
  { id:'coldbrewcof',name:'Cold Brew Coffee',cat:'adjunct', lane:'hot', points:16, cost:3, tags:['toasty','roasty','smooth'], desc:'Adds 1 roast token. Roast penalty threshold +1.' },
  { id:'chili',      name:'Chili Pepper',    cat:'adjunct', lane:'hot', points:8,  cost:2, tags:['spicy','dry'],          desc:'Removes a Sugar Clot from your board if present.' },
  { id:'cinnamon',   name:'Cinnamon',        cat:'adjunct', lane:'hot', points:8,  cost:2, tags:['spicy','sweet'],        desc:'+3 pts for each sweet card on hot side.' },

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
  { id:'grainreview',  name:'Grain Bill Review', cat:'process', lane:'hot',  points:0,  cost:1, tags:['malty'],           desc:'Look at top 3 cards of your deck, put them back in any order.' },
  { id:'fermlog',      name:'Fermentation Log',  cat:'process', lane:'cold', points:0,  cost:1, tags:['clean'],           desc:'+2 pts to every card currently on your cold side.' },

  // C-Family power team
  { id:'cascade',    name:'Cascade',          cat:'hop', lane:'both', points:10, cost:1, tags:['bitter','citrus','c-hop'],        desc:'If another c-hop on same lane, all c-hops on that lane score double.' },
  { id:'centennial', name:'Centennial',       cat:'hop', lane:'both', points:12, cost:2, tags:['bitter','citrus','c-hop'],        desc:'If another c-hop on same lane, all c-hops on that lane score double.' },
  { id:'chinook',    name:'Chinook',          cat:'hop', lane:'both', points:12, cost:2, tags:['bitter','piney','spicy','c-hop'], desc:'If another c-hop on same lane, all c-hops score double. Removes a Sugar Clot.' },
  { id:'columbus',   name:'Columbus',         cat:'hop', lane:'both', points:14, cost:2, tags:['bitter','piney','c-hop'],         desc:'If another c-hop on same lane, all c-hops score double. Adds 1 roast token to rival.' },

  // Other C hops (no c-hop tag)
  { id:'citra',      name:'Citra',            cat:'hop', lane:'both', points:14, cost:2, tags:['bitter','citrus','hazy'],         desc:'Draw a card when played.' },
  { id:'cluster',    name:'Cluster',          cat:'hop', lane:'both', points:8,  cost:1, tags:['bitter','fruity'],               desc:'If 3+ hops on board, +6 pts.' },

  // Aroma/New World
  { id:'mosaic',     name:'Mosaic',           cat:'hop', lane:'both', points:12, cost:2, tags:['bitter','hazy'],                 desc:'Counts as two different tags for synergy purposes.' },
  { id:'simcoe',     name:'Simcoe',           cat:'hop', lane:'both', points:14, cost:2, tags:['bitter','piney','citrus'],       desc:'If played on cold side, draw 1 card.' },
  { id:'amarillo',   name:'Amarillo',         cat:'hop', lane:'both', points:12, cost:2, tags:['citrus','fruity'],               desc:'Each fruity adjunct on hot side gets +2 pts.' },
  { id:'galaxy',     name:'Galaxy',           cat:'hop', lane:'both', points:14, cost:2, tags:['fruity','hazy','citrus'],        desc:'If 2+ hazy tagged cards on board, +8 pts.' },
  { id:'eldorado',   name:'El Dorado',        cat:'hop', lane:'both', points:12, cost:2, tags:['fruity','sweet'],               desc:'Each sweet adjunct on hot side gets +2 pts.' },
  { id:'azacca',     name:'Azacca',           cat:'hop', lane:'both', points:10, cost:2, tags:['fruity','citrus'],              desc:'When played on cold side, give a fruity adjunct on hot side +4 pts.' },
  { id:'strata',     name:'Strata',           cat:'hop', lane:'both', points:14, cost:3, tags:['fruity','hazy','citrus'],        desc:'Generates a Haze token when played.' },
  { id:'sabro',      name:'Sabro',            cat:'hop', lane:'both', points:12, cost:2, tags:['fruity','smooth','citrus'],      desc:'All smooth tagged cards get +2 pts.' },

  // Noble/European
  { id:'hallertau',  name:'Hallertau',        cat:'hop', lane:'both', points:10, cost:1, tags:['crisp','spicy'],                desc:'If no roast tokens on board, +6 pts.' },
  { id:'saaz',       name:'Saaz',             cat:'hop', lane:'both', points:10, cost:1, tags:['crisp','spicy'],                desc:'If Pilsner Malt on hot side, +8 pts.' },
  { id:'tettnang',   name:'Tettnang',         cat:'hop', lane:'both', points:10, cost:1, tags:['crisp','spicy'],                desc:'+2 pts for each crisp tagged card on board.' },
  { id:'styrianG',   name:'Styrian Goldings', cat:'hop', lane:'both', points:12, cost:2, tags:['spicy','smooth','earthy'],      desc:'+3 pts for each yeast card on cold side.' },
  { id:'ekg',        name:'East Kent Goldings',cat:'hop',lane:'both', points:12, cost:2, tags:['earthy','biscuity','smooth'],   desc:'If biscuity malt on hot side, +8 pts.' },

  // High Alpha/Bittering
  { id:'magnum',     name:'Magnum',           cat:'hop', lane:'both', points:16, cost:3, tags:['bitter'],                       desc:'Flat high score, no frills.' },
  { id:'nugget',     name:'Nugget',           cat:'hop', lane:'both', points:12, cost:2, tags:['bitter','smooth'],              desc:'Removes a Sugar Clot if present.' },
  { id:'ctz',        name:'CTZ',              cat:'hop', lane:'both', points:14, cost:2, tags:['bitter','piney'],               desc:'+2 pts for each bitter tagged card on same lane.' },
  { id:'warrior',    name:'Warrior',          cat:'hop', lane:'both', points:16, cost:3, tags:['bitter','dry'],                 desc:'If played on hot side, +4 pts to all cost-3 malts.' },

  // Wild/Experimental
  { id:'nelson',     name:'Nelson Sauvin',    cat:'hop', lane:'both', points:14, cost:3, tags:['fruity','crisp','nuanced'],     desc:'Nuanced cards multiply each other.' },
  { id:'waiiti',     name:'Wai-iti',          cat:'hop', lane:'both', points:10, cost:2, tags:['fruity','crisp'],              desc:'If played cold side, each crisp yeast gets +3 pts.' },
  { id:'motueka',    name:'Motueka',          cat:'hop', lane:'both', points:10, cost:2, tags:['citrus','crisp'],              desc:'+2 pts for each citrus tagged card on board.' },
  { id:'idaho7',     name:'Idaho 7',          cat:'hop', lane:'both', points:12, cost:2, tags:['fruity','bitter','citrus'],    desc:'If both fruity and bitter on board, +6 pts.' },
  { id:'cryo',       name:'Cryo Hops',        cat:'hop', lane:'both', points:16, cost:3, tags:['bitter','hazy'],              desc:'Removes a Sugar Clot AND adds a Haze token to hand.' },

  // ── Yeast ──

  // Ale Yeasts
  { id:'americanale', name:'American Ale',    cat:'yeast', lane:'cold', points:12, cost:2, tags:['crisp','clean'],           desc:'If no funky cards on cold side, +6 pts.' },
  { id:'englishale',  name:'English Ale',     cat:'yeast', lane:'cold', points:12, cost:2, tags:['biscuity','smooth'],        desc:'+2 pts for each biscuity card on hot side.' },
  { id:'irishale',    name:'Irish Ale',       cat:'yeast', lane:'cold', points:10, cost:1, tags:['smooth','clean'],           desc:'Cheap reliable cold side anchor.' },
  { id:'calale',      name:'California Ale',  cat:'yeast', lane:'cold', points:14, cost:2, tags:['crisp','clean'],            desc:'If 3+ hop cards on board, +8 pts.' },
  { id:'kolsch',      name:'Kolsch Yeast',    cat:'yeast', lane:'cold', points:12, cost:2, tags:['crisp','clean'],            desc:'If no roast tokens on board, +8 pts.' },
  { id:'creamale',    name:'Cream Ale',       cat:'yeast', lane:'cold', points:10, cost:1, tags:['smooth','crisp'],           desc:'+2 pts for each neutral tagged card on board.' },

  // Belgian Yeasts
  { id:'belgian',     name:'Belgian Ale',     cat:'yeast', lane:'cold', points:12, cost:3, tags:['sweet','funky'],            desc:'Rich ester profile.' },
  { id:'belgianstr',  name:'Belgian Strong',  cat:'yeast', lane:'cold', points:16, cost:3, tags:['sweet','funky'],            desc:'If 2+ sweet cards on hot side, score double.' },
  { id:'tripel',      name:'Tripel Yeast',    cat:'yeast', lane:'cold', points:14, cost:3, tags:['sweet','crisp','funky'],    desc:'+4 pts for each sweet tagged card on board.' },
  { id:'witbier',     name:'Witbier Yeast',   cat:'yeast', lane:'cold', points:10, cost:2, tags:['sweet','spicy','smooth'],   desc:'+3 pts for each spicy card on board.' },
  { id:'saison',      name:'Saison Yeast',    cat:'yeast', lane:'cold', points:10, cost:2, tags:['crisp','funky'],            desc:'Dry spicy finish.' },
  { id:'abbey',       name:'Abbey Yeast',     cat:'yeast', lane:'cold', points:14, cost:3, tags:['sweet','funky','malty'],    desc:'+4 pts for each malty card on hot side.' },

  // Wild/Sour Yeasts (all generate Contamination cards)
  { id:'brett',       name:'Brett Brux',      cat:'yeast', lane:'cold', points:6,  cost:2, tags:['funky','dry'],              desc:'+3 pts per turn on field. Each turn shuffles 1 Contamination into YOUR deck.' },
  { id:'brettcl',     name:'Brett Claussenii',cat:'yeast', lane:'cold', points:8,  cost:2, tags:['funky','crisp'],            desc:'+2 pts per turn. Draw 1 on play. Each turn 50/50 Contamination to your deck or enemy deck.' },
  { id:'brettano',    name:'Brett Anomalus',  cat:'yeast', lane:'cold', points:10, cost:3, tags:['funky','fruity'],           desc:'+3 pts per turn (+2 extra if fruity adjunct on hot side). Contamination always goes to ENEMY deck.' },
  { id:'lacto',       name:'Lacto',           cat:'yeast', lane:'cold', points:10, cost:1, tags:['crisp','sour'],             desc:'+5 pts next turn only. On play, shuffle 1 Contamination into your deck.' },
  { id:'pedio',       name:'Pediococcus',     cat:'yeast', lane:'cold', points:6,  cost:1, tags:['funky','dry','sour'],       desc:'Each turn 50/50 Contamination to your deck or enemy deck. Contaminations stack on cold side.' },
  { id:'lachancea',   name:'Lachancea',       cat:'yeast', lane:'cold', points:10, cost:2, tags:['crisp','dry'],              desc:'Draw 1 on play. Each turn 50/50 Contamination — yours cost -5 instead of -10.' },

  // Lager Yeasts
  { id:'germanlager', name:'German Lager',    cat:'yeast', lane:'cold', points:14, cost:2, tags:['crisp','clean'],            desc:'If all hot side cards cost 1 or 2, +10 pts.' },
  { id:'czechlager',  name:'Czech Lager',     cat:'yeast', lane:'cold', points:14, cost:2, tags:['crisp','clean'],            desc:'If Pilsner Malt or Saaz on board, +8 pts.' },
  { id:'munichlager', name:'Munich Lager',    cat:'yeast', lane:'cold', points:12, cost:2, tags:['malty','clean'],            desc:'+3 pts for each malty tagged card on board.' },
  { id:'americanlag', name:'American Lager',  cat:'yeast', lane:'cold', points:10, cost:1, tags:['crisp','neutral','clean'],  desc:'If 3+ neutral cards on board, +8 pts.' },

  // Specialty Yeasts
  { id:'kveik',       name:'Kveik',           cat:'yeast', lane:'cold', points:14, cost:3, tags:['dry','crisp'],              desc:'Fast clean fermentation. High flat score.' },
  { id:'hefeweizen',  name:'Hefeweizen',      cat:'yeast', lane:'cold', points:12, cost:2, tags:['sweet','bready','smooth'],  desc:'+3 pts for each bready card on hot side.' },
  { id:'gose',        name:'Gose Yeast',      cat:'yeast', lane:'cold', points:10, cost:2, tags:['crisp','dry','spicy'],      desc:'If wheat or rye adjunct on hot side, +8 pts.' },
  { id:'kvass',       name:'Kvass Yeast',     cat:'yeast', lane:'cold', points:8,  cost:1, tags:['bready','neutral'],         desc:'+2 pts for each bready card on board.' },
  { id:'champagne',   name:'Champagne Yeast', cat:'yeast', lane:'cold', points:16, cost:3, tags:['dry','crisp'],              desc:'Removes all funky tags from your cold side. High score but wipes funk synergies.' },
  { id:'mixedferm',   name:'Mixed Ferm',      cat:'yeast', lane:'cold', points:12, cost:2, tags:['funky','sweet','crisp'],    desc:'Counts as ale, lager, and wild for all synergy purposes.' },
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
  'brett','brett',
  'lacto','lacto','lacto',
  'belgian',
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
  'lacto','lacto',
  'saison','saison',
  'belgian',
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
  { id:'haze',        name:'Haze',         cat:'token', lane:'both', points:0,   cost:1, tags:['hazy'],   desc:'Attach to a hop on the field to add a score multiplier to that hop.' },
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

// species.js — static Gen 1–3 species data (IDs 1–386)
// Replaces PokeAPI runtime fetches. Types use brew names via TYPE_MAPPING.
// Each entry: { id, name, types[], baseStats{hp,atk,def,speed,special,spdef}, bst }

const SPECIES_DATA = [
  { id:  1, name:'Bulbasaur'       , types:['Ipa', 'Brett'], baseStats:{hp: 45,atk: 49,def: 49,speed: 45,special: 65,spdef: 65}, bst:318 , brewName:'Bulba Seed Farmhouse' },

  { id:  2, name:'Ivysaur'         , types:['Ipa', 'Brett'], baseStats:{hp: 60,atk: 62,def: 63,speed: 60,special: 80,spdef: 80}, bst:405 , brewName:'Ivy Saur IPA' },

  { id:  3, name:'Venusaur'        , types:['Ipa', 'Brett'], baseStats:{hp: 80,atk: 82,def: 83,speed: 80,special:100,spdef:100}, bst:525 , brewName:'Venus Saur Imperial IPA' },

  { id:  4, name:'Charmander'      , types:['Red'], baseStats:{hp: 39,atk: 52,def: 43,speed: 65,special: 60,spdef: 50}, bst:309 , brewName:'Char Mander Ember' },

  { id:  5, name:'Charmeleon'      , types:['Red'], baseStats:{hp: 58,atk: 64,def: 58,speed: 80,special: 80,spdef: 65}, bst:405 , brewName:'Char Meleon Red' },

  { id:  6, name:'Charizard'       , types:['Red', 'Wheat'], baseStats:{hp: 78,atk: 84,def: 78,speed:100,special:109,spdef: 85}, bst:534 , brewName:'Char Izard Imperial Red' },

  { id:  7, name:'Squirtle'        , types:['Lager'], baseStats:{hp: 44,atk: 48,def: 65,speed: 43,special: 50,spdef: 64}, bst:314 , brewName:'Squrt Lager' },

  { id:  8, name:'Wartortle'       , types:['Lager'], baseStats:{hp: 59,atk: 63,def: 80,speed: 58,special: 65,spdef: 80}, bst:405 , brewName:'War Turtle Märzen' },

  { id:  9, name:'Blastoise'       , types:['Lager'], baseStats:{hp: 79,atk: 83,def:100,speed: 78,special: 85,spdef:105}, bst:530 , brewName:'Blastoise Imperial Lager' },

  { id: 10, name:'Caterpie'        , types:['Saison'], baseStats:{hp: 45,atk: 30,def: 35,speed: 45,special: 20,spdef: 20}, bst:195 , brewName:'Cater Pea Session Saison' },

  { id: 11, name:'Metapod'         , types:['Saison'], baseStats:{hp: 50,atk: 20,def: 55,speed: 30,special: 25,spdef: 25}, bst:205 , brewName:'Meta Pod Saison' },

  { id: 12, name:'Butterfree'      , types:['Saison', 'Wheat'], baseStats:{hp: 60,atk: 45,def: 50,speed: 70,special: 90,spdef: 80}, bst:395 , brewName:'Butter Free Saison Wheat' },

  { id: 13, name:'Weedle'          , types:['Saison', 'Brett'], baseStats:{hp: 40,atk: 35,def: 30,speed: 50,special: 20,spdef: 20}, bst:195 , brewName:'Wee Dul Session Brett' },

  { id: 14, name:'Kakuna'          , types:['Saison', 'Brett'], baseStats:{hp: 45,atk: 25,def: 50,speed: 35,special: 25,spdef: 25}, bst:205 , brewName:'Kah Kuna Brett' },

  { id: 15, name:'Beedrill'        , types:['Saison', 'Brett'], baseStats:{hp: 65,atk: 90,def: 40,speed: 75,special: 45,spdef: 80}, bst:395 , brewName:'Bee Drill Brett IPA' },

  { id: 16, name:'Pidgey'          , types:['Blonde', 'Wheat'], baseStats:{hp: 40,atk: 45,def: 40,speed: 56,special: 35,spdef: 35}, bst:251 , brewName:'Pid Gee Session Wheat' },

  { id: 17, name:'Pidgeotto'       , types:['Blonde', 'Wheat'], baseStats:{hp: 63,atk: 60,def: 55,speed: 71,special: 50,spdef: 50}, bst:349 , brewName:'Pid Geotto Wheat' },

  { id: 18, name:'Pidgeot'         , types:['Blonde', 'Wheat'], baseStats:{hp: 83,atk: 80,def: 75,speed:101,special: 70,spdef: 70}, bst:479 , brewName:'Pid Jot Imperial Wheat' },

  { id: 19, name:'Rattata'         , types:['Blonde'], baseStats:{hp: 30,atk: 56,def: 35,speed: 72,special: 25,spdef: 35}, bst:253 , brewName:'Rat Tata Session Blonde' },

  { id: 20, name:'Raticate'        , types:['Blonde'], baseStats:{hp: 55,atk: 81,def: 60,speed: 97,special: 50,spdef: 70}, bst:413 , brewName:'Rat Eye Kat Blonde' },

  { id: 21, name:'Spearow'         , types:['Blonde', 'Wheat'], baseStats:{hp: 40,atk: 60,def: 30,speed: 70,special: 31,spdef: 31}, bst:262 , brewName:'Spear O Session Wheat' },

  { id: 22, name:'Fearow'          , types:['Blonde', 'Wheat'], baseStats:{hp: 65,atk: 90,def: 65,speed:100,special: 61,spdef: 61}, bst:442 , brewName:'Fear O Wheat' },

  { id: 23, name:'Ekans'           , types:['Brett'], baseStats:{hp: 35,atk: 60,def: 44,speed: 55,special: 40,spdef: 54}, bst:288 , brewName:'Ee Kanz Brett' },

  { id: 24, name:'Arbok'           , types:['Brett'], baseStats:{hp: 60,atk: 95,def: 69,speed: 80,special: 65,spdef: 79}, bst:448 , brewName:'Ar Bok Imperial Brett' },

  { id: 25, name:'Pikachu'         , types:['Sour'], baseStats:{hp: 35,atk: 55,def: 40,speed: 90,special: 50,spdef: 50}, bst:320 , brewName:'Pika Chu Sour' },

  { id: 26, name:'Raichu'          , types:['Sour'], baseStats:{hp: 60,atk: 90,def: 55,speed:110,special: 90,spdef: 80}, bst:485 , brewName:'Rai Chu Imperial Sour' },

  { id: 27, name:'Sandshrew'       , types:['Brown'], baseStats:{hp: 50,atk: 75,def: 85,speed: 40,special: 20,spdef: 30}, bst:300 , brewName:'Sand Shrew Brown' },

  { id: 28, name:'Sandslash'       , types:['Brown'], baseStats:{hp: 75,atk:100,def:110,speed: 65,special: 45,spdef: 55}, bst:450 , brewName:'Sand Slash Imperial Brown' },

  { id: 29, name:'Nidoran♀'        , types:['Brett'], baseStats:{hp: 55,atk: 47,def: 52,speed: 41,special: 40,spdef: 40}, bst:275 , brewName:'Nido Ran Session Brett' },

  { id: 30, name:'Nidorina'        , types:['Brett'], baseStats:{hp: 70,atk: 62,def: 67,speed: 56,special: 55,spdef: 55}, bst:365 , brewName:'Nido Rina Brett' },

  { id: 31, name:'Nidoqueen'       , types:['Brett', 'Brown'], baseStats:{hp: 90,atk: 92,def: 87,speed: 76,special: 75,spdef: 85}, bst:505 , brewName:'Nido Queen Imperial Brett' },

  { id: 32, name:'Nidoran♂'        , types:['Brett'], baseStats:{hp: 46,atk: 57,def: 40,speed: 50,special: 40,spdef: 40}, bst:273 , brewName:'Nido Ron Session Brett' },

  { id: 33, name:'Nidorino'        , types:['Brett'], baseStats:{hp: 61,atk: 72,def: 57,speed: 65,special: 55,spdef: 55}, bst:365 , brewName:'Nido Rino Brett' },

  { id: 34, name:'Nidoking'        , types:['Brett', 'Brown'], baseStats:{hp: 81,atk:102,def: 77,speed: 85,special: 85,spdef: 75}, bst:505 , brewName:'Nido King Imperial Brett' },

  { id: 35, name:'Clefairy'        , types:['Pastry'], baseStats:{hp: 70,atk: 45,def: 48,speed: 35,special: 60,spdef: 65}, bst:323 , brewName:'Clef Airy Pastry' },

  { id: 36, name:'Clefable'        , types:['Pastry'], baseStats:{hp: 95,atk: 70,def: 73,speed: 60,special: 95,spdef: 90}, bst:483 , brewName:'Clef Able Imperial Pastry' },

  { id: 37, name:'Vulpix'          , types:['Red'], baseStats:{hp: 38,atk: 41,def: 40,speed: 65,special: 50,spdef: 65}, bst:299 , brewName:'Vul Pix Red' },

  { id: 38, name:'Ninetales'       , types:['Red'], baseStats:{hp: 73,atk: 76,def: 75,speed:100,special: 81,spdef:100}, bst:505 , brewName:'Nine Tails Imperial Red' },

  { id: 39, name:'Jigglypuff'      , types:['Blonde', 'Pastry'], baseStats:{hp:115,atk: 45,def: 20,speed: 20,special: 45,spdef: 25}, bst:270 , brewName:'Jiggle Puff Blonde' },

  { id: 40, name:'Wigglytuff'      , types:['Blonde', 'Pastry'], baseStats:{hp:140,atk: 70,def: 45,speed: 45,special: 85,spdef: 50}, bst:435 , brewName:'Wiggly Tuff Imperial Pastry Blonde' },

  { id: 41, name:'Zubat'           , types:['Brett', 'Wheat'], baseStats:{hp: 40,atk: 45,def: 35,speed: 55,special: 30,spdef: 40}, bst:245 , brewName:'Zu Bat Session Brett Wheat' },

  { id: 42, name:'Golbat'          , types:['Brett', 'Wheat'], baseStats:{hp: 75,atk: 80,def: 70,speed: 90,special: 75,spdef: 75}, bst:465 , brewName:'Gol Bat Brett Wheat' },

  { id: 43, name:'Oddish'          , types:['Ipa', 'Brett'], baseStats:{hp: 45,atk: 50,def: 55,speed: 30,special: 75,spdef: 65}, bst:320 , brewName:'Odd Ish Session IPA' },

  { id: 44, name:'Gloom'           , types:['Ipa', 'Brett'], baseStats:{hp: 60,atk: 65,def: 70,speed: 40,special: 85,spdef: 75}, bst:395 , brewName:'Gloom IPA Brett' },

  { id: 45, name:'Vileplume'       , types:['Ipa', 'Brett'], baseStats:{hp: 75,atk: 80,def: 85,speed: 50,special:110,spdef: 90}, bst:490 , brewName:'Vile Plume Imperial IPA Brett' },

  { id: 46, name:'Paras'           , types:['Saison', 'Ipa'], baseStats:{hp: 35,atk: 70,def: 55,speed: 25,special: 55,spdef: 55}, bst:295 , brewName:'Para S Session Saison' },

  { id: 47, name:'Parasect'        , types:['Saison', 'Ipa'], baseStats:{hp: 60,atk: 95,def: 80,speed: 30,special: 80,spdef: 80}, bst:425 , brewName:'Para Sect Saison IPA' },

  { id: 48, name:'Venonat'         , types:['Saison', 'Brett'], baseStats:{hp: 60,atk: 55,def: 50,speed: 45,special: 40,spdef: 55}, bst:305 , brewName:'Vee No Nat Session Brett' },

  { id: 49, name:'Venomoth'        , types:['Saison', 'Brett'], baseStats:{hp: 70,atk: 65,def: 60,speed: 90,special: 90,spdef: 75}, bst:450 , brewName:'Vee No Moth Brett Saison' },

  { id: 50, name:'Diglett'         , types:['Brown'], baseStats:{hp: 10,atk: 55,def: 25,speed: 95,special: 35,spdef: 45}, bst:265 , brewName:'Dig Let Session Brown' },

  { id: 51, name:'Dugtrio'         , types:['Brown'], baseStats:{hp: 35,atk:100,def: 50,speed:120,special: 50,spdef: 70}, bst:425 , brewName:'Dug Trio Brown' },

  { id: 52, name:'Meowth'          , types:['Blonde'], baseStats:{hp: 40,atk: 45,def: 35,speed: 90,special: 40,spdef: 40}, bst:290 , brewName:'Mee Owth Session Blonde' },

  { id: 53, name:'Persian'         , types:['Blonde'], baseStats:{hp: 65,atk: 70,def: 60,speed:115,special: 65,spdef: 65}, bst:440 , brewName:'Per Sian Blonde' },

  { id: 54, name:'Psyduck'         , types:['Lager'], baseStats:{hp: 50,atk: 52,def: 48,speed: 55,special: 65,spdef: 50}, bst:320 , brewName:'Sigh Duck Session Lager' },

  { id: 55, name:'Golduck'         , types:['Lager'], baseStats:{hp: 80,atk: 82,def: 78,speed: 85,special: 95,spdef: 80}, bst:500 , brewName:'Gold Duck Lager' },

  { id: 56, name:'Mankey'          , types:['Barleywine'], baseStats:{hp: 40,atk: 80,def: 35,speed: 70,special: 35,spdef: 45}, bst:305 , brewName:'Man Key Barleywine' },

  { id: 57, name:'Primeape'        , types:['Barleywine'], baseStats:{hp: 65,atk:105,def: 60,speed: 95,special: 60,spdef: 70}, bst:455 , brewName:'Prime Ape Imperial Barleywine' },

  { id: 58, name:'Growlithe'       , types:['Red'], baseStats:{hp: 55,atk: 70,def: 45,speed: 60,special: 70,spdef: 50}, bst:350 , brewName:'Growl Ith Red' },

  { id: 59, name:'Arcanine'        , types:['Red'], baseStats:{hp: 90,atk:110,def: 80,speed: 95,special:100,spdef: 80}, bst:555 , brewName:'Ar Canine Imperial Red' },

  { id: 60, name:'Poliwag'         , types:['Lager'], baseStats:{hp: 40,atk: 50,def: 40,speed: 90,special: 40,spdef: 40}, bst:300 , brewName:'Poly Wag Session Lager' },

  { id: 61, name:'Poliwhirl'       , types:['Lager'], baseStats:{hp: 65,atk: 65,def: 65,speed: 90,special: 50,spdef: 50}, bst:385 , brewName:'Poly Whirl Lager' },

  { id: 62, name:'Poliwrath'       , types:['Lager', 'Barleywine'], baseStats:{hp: 90,atk: 95,def: 95,speed: 70,special: 70,spdef: 90}, bst:510 , brewName:'Poly Wrath Imperial Lager' },

  { id: 63, name:'Abra'            , types:['Belgian'], baseStats:{hp: 25,atk: 20,def: 15,speed: 90,special:105,spdef: 55}, bst:310 , brewName:'Ay Bra Session Belgian' },

  { id: 64, name:'Kadabra'         , types:['Belgian'], baseStats:{hp: 40,atk: 35,def: 30,speed:105,special:120,spdef: 70}, bst:400 , brewName:'Kah Dabra Belgian' },

  { id: 65, name:'Alakazam'        , types:['Belgian'], baseStats:{hp: 55,atk: 50,def: 45,speed:120,special:135,spdef: 95}, bst:500 , brewName:'Ala Kazam Imperial Belgian' },

  { id: 66, name:'Machop'          , types:['Barleywine'], baseStats:{hp: 70,atk: 80,def: 50,speed: 35,special: 35,spdef: 35}, bst:305 , brewName:'Mah Chop Barleywine' },

  { id: 67, name:'Machoke'         , types:['Barleywine'], baseStats:{hp: 80,atk:100,def: 70,speed: 45,special: 50,spdef: 60}, bst:405 , brewName:'Mah Choke Imperial Barleywine' },

  { id: 68, name:'Machamp'         , types:['Barleywine'], baseStats:{hp: 90,atk:130,def: 80,speed: 55,special: 65,spdef: 85}, bst:505 , brewName:'Mah Champ Double Barleywine' },

  { id: 69, name:'Bellsprout'      , types:['Ipa', 'Brett'], baseStats:{hp: 50,atk: 75,def: 35,speed: 40,special: 70,spdef: 30}, bst:300 , brewName:'Bell Sprout Session IPA' },

  { id: 70, name:'Weepinbell'      , types:['Ipa', 'Brett'], baseStats:{hp: 65,atk: 90,def: 50,speed: 55,special: 85,spdef: 45}, bst:390 , brewName:'Wee Pin Bell IPA Brett' },

  { id: 71, name:'Victreebel'      , types:['Ipa', 'Brett'], baseStats:{hp: 80,atk:105,def: 65,speed: 70,special:100,spdef: 60}, bst:480 , brewName:'Vik Tree Bell Imperial IPA Brett' },

  { id: 72, name:'Tentacool'       , types:['Lager', 'Brett'], baseStats:{hp: 40,atk: 40,def: 35,speed: 70,special: 50,spdef:100}, bst:335 , brewName:'Ten Ta Cool Session Lager Brett' },

  { id: 73, name:'Tentacruel'      , types:['Lager', 'Brett'], baseStats:{hp: 80,atk: 70,def: 65,speed:100,special: 80,spdef:120}, bst:515 , brewName:'Ten Ta Cruel Lager Brett' },

  { id: 74, name:'Geodude'         , types:['Barrel-aged', 'Brown'], baseStats:{hp: 40,atk: 80,def:100,speed: 20,special: 30,spdef: 30}, bst:300 , brewName:'Jee O Dude Session Barrel-aged' },

  { id: 75, name:'Graveler'        , types:['Barrel-aged', 'Brown'], baseStats:{hp: 55,atk: 95,def:115,speed: 35,special: 45,spdef: 45}, bst:390 , brewName:'Grav Ler Barrel-aged Brown' },

  { id: 76, name:'Golem'           , types:['Barrel-aged', 'Brown'], baseStats:{hp: 80,atk:120,def:130,speed: 45,special: 55,spdef: 65}, bst:495 , brewName:'Go Lem Imperial Barrel-aged Brown' },

  { id: 77, name:'Ponyta'          , types:['Red'], baseStats:{hp: 50,atk: 85,def: 55,speed: 90,special: 65,spdef: 65}, bst:410 , brewName:'Poe Nyta Red' },

  { id: 78, name:'Rapidash'        , types:['Red'], baseStats:{hp: 65,atk:100,def: 70,speed:105,special: 80,spdef: 80}, bst:500 , brewName:'Rapid Ash Imperial Red' },

  { id: 79, name:'Slowpoke'        , types:['Lager', 'Belgian'], baseStats:{hp: 90,atk: 65,def: 65,speed: 15,special: 40,spdef: 40}, bst:315 , brewName:'Slow Poke Session Lager' },

  { id: 80, name:'Slowbro'         , types:['Lager', 'Belgian'], baseStats:{hp: 95,atk: 75,def:110,speed: 30,special:100,spdef: 80}, bst:490 , brewName:'Slow Bro Lager Belgian' },

  { id: 81, name:'Magnemite'       , types:['Sour', 'Export'], baseStats:{hp: 25,atk: 35,def: 70,speed: 45,special: 95,spdef: 55}, bst:325 , brewName:'Mag Nee Mite Session Export' },

  { id: 82, name:'Magneton'        , types:['Sour', 'Export'], baseStats:{hp: 50,atk: 60,def: 95,speed: 70,special:120,spdef: 70}, bst:465 , brewName:'Mag Nee Ton Export Sour' },

  { id: 83, name:"Farfetch'd"      , types:['Blonde', 'Wheat'], baseStats:{hp: 52,atk: 90,def: 55,speed: 60,special: 58,spdef: 62}, bst:377 , brewName:'Far Fetchd Blonde Wheat' },

  { id: 84, name:'Doduo'           , types:['Blonde', 'Wheat'], baseStats:{hp: 35,atk: 85,def: 45,speed: 75,special: 35,spdef: 35}, bst:310 , brewName:'Doe Duo Session Wheat' },

  { id: 85, name:'Dodrio'          , types:['Blonde', 'Wheat'], baseStats:{hp: 60,atk:110,def: 70,speed:100,special: 60,spdef: 60}, bst:460 , brewName:'Doe Trio Wheat' },

  { id: 86, name:'Seel'            , types:['Lager'], baseStats:{hp: 65,atk: 45,def: 55,speed: 45,special: 45,spdef: 70}, bst:325 , brewName:'Seel Session Lager' },

  { id: 87, name:'Dewgong'         , types:['Lager', 'Cryo'], baseStats:{hp: 90,atk: 70,def: 80,speed: 70,special: 70,spdef: 95}, bst:475 , brewName:'Dew Gong Lager Cryo' },

  { id: 88, name:'Grimer'          , types:['Brett'], baseStats:{hp: 80,atk: 80,def: 50,speed: 25,special: 40,spdef: 50}, bst:325 , brewName:'Grime R Brett' },

  { id: 89, name:'Muk'             , types:['Brett'], baseStats:{hp:105,atk:105,def: 75,speed: 50,special: 65,spdef:100}, bst:500 , brewName:'Muk Imperial Brett' },

  { id: 90, name:'Shellder'        , types:['Lager'], baseStats:{hp: 30,atk: 65,def:100,speed: 40,special: 45,spdef: 25}, bst:305 , brewName:'Shell Dur Session Lager' },

  { id: 91, name:'Cloyster'        , types:['Lager', 'Cryo'], baseStats:{hp: 50,atk: 95,def:180,speed: 70,special: 85,spdef: 45}, bst:525 , brewName:'Cloy Ster Lager Cryo' },

  { id: 92, name:'Gastly'          , types:['Seltzer', 'Brett'], baseStats:{hp: 30,atk: 35,def: 30,speed: 80,special:100,spdef: 35}, bst:310 , brewName:'Gas Lee Session Seltzer' },

  { id: 93, name:'Haunter'         , types:['Seltzer', 'Brett'], baseStats:{hp: 45,atk: 50,def: 45,speed: 95,special:115,spdef: 55}, bst:405 , brewName:'Haunt Er Seltzer Brett' },

  { id: 94, name:'Gengar'          , types:['Seltzer', 'Brett'], baseStats:{hp: 60,atk: 65,def: 60,speed:110,special:130,spdef: 75}, bst:500 , brewName:'Gen Gar Imperial Seltzer' },

  { id: 95, name:'Onix'            , types:['Barrel-aged', 'Brown'], baseStats:{hp: 35,atk: 45,def:160,speed: 70,special: 30,spdef: 45}, bst:385 , brewName:'Oh Nix Barrel-aged Brown' },

  { id: 96, name:'Drowzee'         , types:['Belgian'], baseStats:{hp: 60,atk: 48,def: 45,speed: 42,special: 43,spdef: 90}, bst:328 , brewName:'Drow Zee Session Belgian' },

  { id: 97, name:'Hypno'           , types:['Belgian'], baseStats:{hp: 85,atk: 73,def: 70,speed: 67,special: 73,spdef:115}, bst:483 , brewName:'Hyp No Belgian' },

  { id: 98, name:'Krabby'          , types:['Lager'], baseStats:{hp: 30,atk:105,def: 90,speed: 50,special: 25,spdef: 25}, bst:325 , brewName:'Krab By Session Lager' },

  { id: 99, name:'Kingler'         , types:['Lager'], baseStats:{hp: 55,atk:130,def:115,speed: 75,special: 50,spdef: 50}, bst:475 , brewName:'King Ler Imperial Lager' },

  { id:100, name:'Voltorb'         , types:['Sour'], baseStats:{hp: 40,atk: 30,def: 50,speed:100,special: 55,spdef: 55}, bst:330 , brewName:'Volt Orb Session Sour' },

  { id:101, name:'Electrode'       , types:['Sour'], baseStats:{hp: 60,atk: 50,def: 70,speed:140,special: 80,spdef: 80}, bst:480 , brewName:'Elec Trode Sour' },

  { id:102, name:'Exeggcute'       , types:['Ipa', 'Belgian'], baseStats:{hp: 60,atk: 40,def: 80,speed: 40,special: 60,spdef: 45}, bst:325 , brewName:'Egg Sekute Session IPA' },

  { id:103, name:'Exeggutor'       , types:['Ipa', 'Belgian'], baseStats:{hp: 95,atk: 95,def: 85,speed: 55,special:125,spdef: 65}, bst:520 , brewName:'Egg Secutor IPA Belgian' },

  { id:104, name:'Cubone'          , types:['Brown'], baseStats:{hp: 50,atk: 50,def: 95,speed: 35,special: 40,spdef: 50}, bst:320 , brewName:'Que Bone Session Brown' },

  { id:105, name:'Marowak'         , types:['Brown'], baseStats:{hp: 60,atk: 80,def:110,speed: 45,special: 50,spdef: 80}, bst:425 , brewName:'Mar O Wak Brown' },

  { id:106, name:'Hitmonlee'       , types:['Barleywine'], baseStats:{hp: 50,atk:120,def: 53,speed: 87,special: 35,spdef:110}, bst:455 , brewName:'Hit Mon Lee Barleywine' },

  { id:107, name:'Hitmonchan'      , types:['Barleywine'], baseStats:{hp: 50,atk:105,def: 79,speed: 76,special: 35,spdef:110}, bst:455 , brewName:'Hit Mon Chan Imperial Barleywine' },

  { id:108, name:'Lickitung'       , types:['Blonde'], baseStats:{hp: 90,atk: 55,def: 75,speed: 30,special: 60,spdef: 75}, bst:385 , brewName:'Lick It Tung Blonde' },

  { id:109, name:'Koffing'         , types:['Brett'], baseStats:{hp: 40,atk: 65,def: 95,speed: 35,special: 60,spdef: 45}, bst:340 , brewName:'Koff Ing Brett' },

  { id:110, name:'Weezing'         , types:['Brett'], baseStats:{hp: 65,atk: 90,def:120,speed: 60,special: 85,spdef: 70}, bst:490 , brewName:'Wheeze Ing Imperial Brett' },

  { id:111, name:'Rhyhorn'         , types:['Brown', 'Barrel-aged'], baseStats:{hp: 80,atk: 85,def: 95,speed: 25,special: 30,spdef: 30}, bst:345 , brewName:'Rye Horn Barrel-aged Brown' },

  { id:112, name:'Rhydon'          , types:['Brown', 'Barrel-aged'], baseStats:{hp:105,atk:130,def:120,speed: 40,special: 45,spdef: 45}, bst:485 , brewName:'Rye Don Imperial Barrel-aged Brown' },

  { id:113, name:'Chansey'         , types:['Blonde'], baseStats:{hp:250,atk:  5,def:  5,speed: 50,special: 35,spdef:105}, bst:450 , brewName:'Chan Zee Pastry Blonde' },

  { id:114, name:'Tangela'         , types:['Ipa'], baseStats:{hp: 65,atk: 55,def:115,speed: 60,special:100,spdef: 40}, bst:435 , brewName:'Tang Ela IPA' },

  { id:115, name:'Kangaskhan'      , types:['Blonde'], baseStats:{hp:105,atk: 95,def: 80,speed: 90,special: 40,spdef: 80}, bst:490 , brewName:'Kanga Scan Blonde' },

  { id:116, name:'Horsea'          , types:['Lager'], baseStats:{hp: 30,atk: 40,def: 70,speed: 60,special: 70,spdef: 25}, bst:295 , brewName:'Hor Sea Session Lager' },

  { id:117, name:'Seadra'          , types:['Lager'], baseStats:{hp: 55,atk: 65,def: 95,speed: 85,special: 95,spdef: 45}, bst:440 , brewName:'Sea Dra Lager' },

  { id:118, name:'Goldeen'         , types:['Lager'], baseStats:{hp: 45,atk: 67,def: 60,speed: 63,special: 35,spdef: 50}, bst:320 , brewName:'Gol Deen Session Lager' },

  { id:119, name:'Seaking'         , types:['Lager'], baseStats:{hp: 80,atk: 92,def: 65,speed: 68,special: 65,spdef: 80}, bst:450 , brewName:'Sea King Lager' },

  { id:120, name:'Staryu'          , types:['Lager'], baseStats:{hp: 30,atk: 45,def: 55,speed: 85,special: 70,spdef: 55}, bst:340 , brewName:'Star You Session Lager' },

  { id:121, name:'Starmie'         , types:['Lager', 'Belgian'], baseStats:{hp: 60,atk: 75,def: 85,speed:115,special:100,spdef: 85}, bst:520 , brewName:'Star Me Lager Belgian' },

  { id:122, name:'Mr. Mime'        , types:['Belgian', 'Pastry'], baseStats:{hp: 40,atk: 45,def: 65,speed: 90,special:100,spdef:120}, bst:460 , brewName:'Mist Er Mime Belgian' },

  { id:123, name:'Scyther'         , types:['Saison', 'Wheat'], baseStats:{hp: 70,atk:110,def: 80,speed:105,special: 55,spdef: 80}, bst:500 , brewName:'Sigh Ther Saison Wheat' },

  { id:124, name:'Jynx'            , types:['Cryo', 'Belgian'], baseStats:{hp: 65,atk: 50,def: 35,speed: 95,special:115,spdef: 95}, bst:455 , brewName:'Jynx Cryo Belgian' },

  { id:125, name:'Electabuzz'      , types:['Sour'], baseStats:{hp: 65,atk: 83,def: 57,speed:105,special: 95,spdef: 85}, bst:490 , brewName:'Elec Ta Buzz Imperial Sour' },

  { id:126, name:'Magmar'          , types:['Red'], baseStats:{hp: 65,atk: 95,def: 57,speed: 93,special:100,spdef: 85}, bst:495 , brewName:'Mag Mar Imperial Red' },

  { id:127, name:'Pinsir'          , types:['Saison'], baseStats:{hp: 65,atk:125,def:100,speed: 85,special: 55,spdef: 70}, bst:500 , brewName:'Pin Sir Saison' },

  { id:128, name:'Tauros'          , types:['Blonde'], baseStats:{hp: 75,atk:100,def: 95,speed:110,special: 70,spdef: 70}, bst:520 , brewName:'Tor Os Blonde' },

  { id:129, name:'Magikarp'        , types:['Lager'], baseStats:{hp: 20,atk: 10,def: 55,speed: 80,special: 15,spdef: 20}, bst:200 , brewName:'Magi Karp Session Lager' },

  { id:130, name:'Gyarados'        , types:['Lager', 'Wheat'], baseStats:{hp: 95,atk:125,def: 79,speed: 81,special: 60,spdef:100}, bst:540 , brewName:'Guy A Dos Imperial Lager Wheat' },

  { id:131, name:'Lapras'          , types:['Lager', 'Cryo'], baseStats:{hp:130,atk: 85,def: 80,speed: 60,special: 85,spdef: 95}, bst:535 , brewName:'Lap Ras Imperial Lager Cryo' },

  { id:132, name:'Ditto'           , types:['Blonde'], baseStats:{hp: 48,atk: 48,def: 48,speed: 48,special: 48,spdef: 48}, bst:288 , brewName:'Dit Toe Blonde' },

  { id:133, name:'Eevee'           , types:['Blonde'], baseStats:{hp: 55,atk: 55,def: 50,speed: 55,special: 45,spdef: 65}, bst:325 , brewName:'Ee Vee Blonde' },

  { id:134, name:'Vaporeon'        , types:['Lager'], baseStats:{hp:130,atk: 65,def: 60,speed: 65,special:110,spdef: 95}, bst:525 , brewName:'Vay Por Eon Imperial Lager' },

  { id:135, name:'Jolteon'         , types:['Sour'], baseStats:{hp: 65,atk: 65,def: 60,speed:130,special:110,spdef: 95}, bst:525 , brewName:'Jolt Eon Imperial Sour' },

  { id:136, name:'Flareon'         , types:['Red'], baseStats:{hp: 65,atk:130,def: 60,speed: 65,special: 95,spdef:110}, bst:525 , brewName:'Flair Eon Imperial Red' },

  { id:137, name:'Porygon'         , types:['Blonde'], baseStats:{hp: 65,atk: 60,def: 70,speed: 40,special: 85,spdef: 75}, bst:395 , brewName:'Pory Gone Blonde' },

  { id:138, name:'Omanyte'         , types:['Barrel-aged', 'Lager'], baseStats:{hp: 35,atk: 40,def:100,speed: 35,special: 90,spdef: 55}, bst:355 , brewName:'Ohm A Night Barrel-aged Lager' },

  { id:139, name:'Omastar'         , types:['Barrel-aged', 'Lager'], baseStats:{hp: 70,atk: 60,def:125,speed: 55,special:115,spdef: 70}, bst:495 , brewName:'Ohm A Star Imperial Barrel-aged Lager' },

  { id:140, name:'Kabuto'          , types:['Barrel-aged', 'Lager'], baseStats:{hp: 30,atk: 80,def: 90,speed: 55,special: 45,spdef: 45}, bst:345 , brewName:'Ka Boo Toe Barrel-aged Lager' },

  { id:141, name:'Kabutops'        , types:['Barrel-aged', 'Lager'], baseStats:{hp: 60,atk:115,def:105,speed: 80,special: 65,spdef: 70}, bst:495 , brewName:'Ka Boo Tops Imperial Barrel-aged Lager' },

  { id:142, name:'Aerodactyl'      , types:['Barrel-aged', 'Wheat'], baseStats:{hp: 80,atk:105,def: 65,speed:130,special: 60,spdef: 75}, bst:515 , brewName:'Aero Dactyl Imperial Barrel-aged Wheat' },

  { id:143, name:'Snorlax'         , types:['Blonde'], baseStats:{hp:160,atk:110,def: 65,speed: 30,special: 65,spdef:110}, bst:540 , brewName:'Snor Lax Imperial Blonde' },

  { id:144, name:'Articuno'        , types:['Cryo', 'Wheat'], baseStats:{hp: 90,atk: 85,def:100,speed: 85,special: 95,spdef:125}, bst:580 , brewName:'Artic Uno Imperial Cryo Wheat' },

  { id:145, name:'Zapdos'          , types:['Sour', 'Wheat'], baseStats:{hp: 90,atk: 90,def: 85,speed:100,special:125,spdef: 90}, bst:580 , brewName:'Zap Dos Imperial Sour Wheat' },

  { id:146, name:'Moltres'         , types:['Red', 'Wheat'], baseStats:{hp: 90,atk:100,def: 90,speed: 90,special:125,spdef: 85}, bst:580 , brewName:'Molt Res Imperial Red Wheat' },

  { id:147, name:'Dratini'         , types:['Stout'], baseStats:{hp: 41,atk: 64,def: 45,speed: 50,special: 50,spdef: 50}, bst:300 , brewName:'Drat Ini Stout' },

  { id:148, name:'Dragonair'       , types:['Stout'], baseStats:{hp: 61,atk: 84,def: 65,speed: 70,special: 70,spdef: 70}, bst:420 , brewName:'Dragon Air Imperial Stout' },

  { id:149, name:'Dragonite'       , types:['Stout', 'Wheat'], baseStats:{hp: 91,atk:134,def: 95,speed: 80,special:100,spdef:100}, bst:600 , brewName:'Dragon Ite Imperial Stout Wheat' },

  { id:150, name:'Mewtwo'          , types:['Belgian'], baseStats:{hp:106,atk:110,def: 90,speed:130,special:154,spdef: 90}, bst:680 , brewName:'Mew Two Imperial Belgian' },

  { id:151, name:'Mew'             , types:['Belgian'], baseStats:{hp:100,atk:100,def:100,speed:100,special:100,spdef:100}, bst:600 , brewName:'Mew Imperial Blonde' },

  { id:152, name:'Chikorita'       , types:['Ipa'], baseStats:{hp: 45,atk: 49,def: 65,speed: 45,special: 49,spdef: 65}, bst:318 , brewName:'Chico Rita Session IPA' },

  { id:153, name:'Bayleef'         , types:['Ipa'], baseStats:{hp: 60,atk: 62,def: 80,speed: 60,special: 63,spdef: 80}, bst:405 , brewName:'Bay Leaf IPA' },

  { id:154, name:'Meganium'        , types:['Ipa'], baseStats:{hp: 80,atk: 82,def:100,speed: 80,special: 83,spdef:100}, bst:525 , brewName:'Mega Nium Imperial IPA' },

  { id:155, name:'Cyndaquil'       , types:['Red'], baseStats:{hp: 39,atk: 52,def: 43,speed: 65,special: 60,spdef: 50}, bst:309 , brewName:'Cinder Quil Red' },

  { id:156, name:'Quilava'         , types:['Red'], baseStats:{hp: 58,atk: 64,def: 58,speed: 80,special: 80,spdef: 65}, bst:405 , brewName:'Quil Ava Red Ale' },

  { id:157, name:'Typhlosion'      , types:['Red'], baseStats:{hp: 78,atk: 84,def: 78,speed:100,special:109,spdef: 85}, bst:534 , brewName:'Ty Flosion Imperial Red' },

  { id:158, name:'Totodile'        , types:['Lager'], baseStats:{hp: 50,atk: 65,def: 64,speed: 43,special: 44,spdef: 48}, bst:314 , brewName:'Tote O Dial Session Lager' },

  { id:159, name:'Croconaw'        , types:['Lager'], baseStats:{hp: 65,atk: 80,def: 80,speed: 58,special: 59,spdef: 63}, bst:405 , brewName:'Croc O Naw Lager' },

  { id:160, name:'Feraligatr'      , types:['Lager'], baseStats:{hp: 85,atk:105,def:100,speed: 78,special: 79,spdef: 83}, bst:530 , brewName:'Fer Ali Gatr Imperial Lager' },

  { id:161, name:'Sentret'         , types:['Blonde'], baseStats:{hp: 35,atk: 46,def: 34,speed: 20,special: 35,spdef: 45}, bst:215 , brewName:'Sen Tret Session Blonde' },

  { id:162, name:'Furret'          , types:['Blonde'], baseStats:{hp: 85,atk: 76,def: 64,speed: 90,special: 45,spdef: 55}, bst:415 , brewName:'Fur Ret Blonde' },

  { id:163, name:'Hoothoot'        , types:['Blonde', 'Wheat'], baseStats:{hp: 60,atk: 30,def: 30,speed: 50,special: 36,spdef: 56}, bst:262 , brewName:'Hoot Hoot Session Wheat' },

  { id:164, name:'Noctowl'         , types:['Blonde', 'Wheat'], baseStats:{hp:100,atk: 50,def: 50,speed: 70,special: 86,spdef: 96}, bst:452 , brewName:'Noc Towl Blonde Wheat' },

  { id:165, name:'Ledyba'          , types:['Saison', 'Wheat'], baseStats:{hp: 40,atk: 20,def: 30,speed: 55,special: 40,spdef: 80}, bst:265 , brewName:'Led E Bah Session Saison' },

  { id:166, name:'Ledian'          , types:['Saison', 'Wheat'], baseStats:{hp: 55,atk: 35,def: 50,speed: 85,special: 55,spdef:110}, bst:390 , brewName:'Led Ian Saison Wheat' },

  { id:167, name:'Spinarak'        , types:['Saison', 'Brett'], baseStats:{hp: 40,atk: 60,def: 40,speed: 30,special: 40,spdef: 40}, bst:250 , brewName:'Spin A Rack Session Brett' },

  { id:168, name:'Ariados'         , types:['Saison', 'Brett'], baseStats:{hp: 70,atk: 90,def: 70,speed: 40,special: 60,spdef: 60}, bst:390 , brewName:'Ari A Dos Brett Saison' },

  { id:169, name:'Crobat'          , types:['Brett', 'Wheat'], baseStats:{hp: 85,atk: 90,def: 80,speed:130,special: 70,spdef: 80}, bst:535 , brewName:'Crow Bat Imperial Brett Wheat' },

  { id:170, name:'Chinchou'        , types:['Lager', 'Sour'], baseStats:{hp: 75,atk: 38,def: 38,speed: 67,special: 56,spdef: 56}, bst:330 , brewName:'Chin Chow Session Lager Sour' },

  { id:171, name:'Lanturn'         , types:['Lager', 'Sour'], baseStats:{hp:125,atk: 58,def: 58,speed: 67,special: 76,spdef: 76}, bst:460 , brewName:'Lan Turn Lager Sour' },

  { id:172, name:'Pichu'           , types:['Sour'], baseStats:{hp: 20,atk: 40,def: 15,speed: 60,special: 35,spdef: 35}, bst:205 , brewName:'Pie Choo Session Sour' },

  { id:173, name:'Cleffa'          , types:['Pastry'], baseStats:{hp: 50,atk: 25,def: 28,speed: 15,special: 45,spdef: 55}, bst:218 , brewName:'Clef Ah Session Pastry' },

  { id:174, name:'Igglybuff'       , types:['Blonde', 'Pastry'], baseStats:{hp: 90,atk: 30,def: 15,speed: 15,special: 40,spdef: 20}, bst:210 , brewName:'Igg Lee Buff Pastry Blonde' },

  { id:175, name:'Togepi'          , types:['Pastry'], baseStats:{hp: 35,atk: 20,def: 65,speed: 20,special: 40,spdef: 65}, bst:245 , brewName:'Toe Guh Pee Session Blonde' },

  { id:176, name:'Togetic'         , types:['Wheat', 'Pastry'], baseStats:{hp: 55,atk: 40,def: 85,speed: 40,special: 80,spdef:105}, bst:405 , brewName:'Toe Get Ik Blonde Wheat' },

  { id:177, name:'Natu'            , types:['Belgian', 'Wheat'], baseStats:{hp: 40,atk: 50,def: 45,speed: 70,special: 70,spdef: 45}, bst:320 , brewName:'Nah Too Session Belgian' },

  { id:178, name:'Xatu'            , types:['Belgian', 'Wheat'], baseStats:{hp: 65,atk: 75,def: 70,speed: 95,special: 95,spdef: 70}, bst:470 , brewName:'Zah Too Belgian Wheat' },

  { id:179, name:'Mareep'          , types:['Sour'], baseStats:{hp: 55,atk: 40,def: 40,speed: 35,special: 65,spdef: 45}, bst:280 , brewName:'Mare Eep Session Sour' },

  { id:180, name:'Flaaffy'         , types:['Sour'], baseStats:{hp: 70,atk: 55,def: 55,speed: 45,special: 80,spdef: 60}, bst:365 , brewName:'Fla Fy Sour' },

  { id:181, name:'Ampharos'        , types:['Sour'], baseStats:{hp: 90,atk: 75,def: 85,speed: 55,special:115,spdef: 90}, bst:510 , brewName:'Am Fah Ros Imperial Sour' },

  { id:182, name:'Bellossom'       , types:['Ipa'], baseStats:{hp: 75,atk: 80,def: 95,speed: 50,special: 90,spdef:100}, bst:490 , brewName:'Bell O Blossom IPA' },

  { id:183, name:'Marill'          , types:['Lager', 'Pastry'], baseStats:{hp: 70,atk: 20,def: 50,speed: 40,special: 20,spdef: 50}, bst:250 , brewName:'Mar Ill Session Lager' },

  { id:184, name:'Azumarill'       , types:['Lager', 'Pastry'], baseStats:{hp:100,atk: 50,def: 80,speed: 50,special: 60,spdef: 80}, bst:420 , brewName:'Az U Mar Ill Lager' },

  { id:185, name:'Sudowoodo'       , types:['Barrel-aged'], baseStats:{hp: 70,atk:100,def:115,speed: 30,special: 30,spdef: 65}, bst:410 , brewName:'Soo Doe Wood Barrel-aged' },

  { id:186, name:'Politoed'        , types:['Lager'], baseStats:{hp: 90,atk: 75,def: 75,speed: 70,special: 90,spdef:100}, bst:500 , brewName:'Poli Toed Imperial Lager' },

  { id:187, name:'Hoppip'          , types:['Ipa', 'Wheat'], baseStats:{hp: 35,atk: 35,def: 40,speed: 50,special: 35,spdef: 55}, bst:250 , brewName:'Hop Pip Session IPA Wheat' },

  { id:188, name:'Skiploom'        , types:['Ipa', 'Wheat'], baseStats:{hp: 55,atk: 45,def: 50,speed: 80,special: 45,spdef: 65}, bst:340 , brewName:'Skip Loom IPA Wheat' },

  { id:189, name:'Jumpluff'        , types:['Ipa', 'Wheat'], baseStats:{hp: 75,atk: 55,def: 70,speed:110,special: 55,spdef: 85}, bst:450 , brewName:'Jump Luff Imperial IPA Wheat' },

  { id:190, name:'Aipom'           , types:['Blonde'], baseStats:{hp: 55,atk: 70,def: 55,speed: 85,special: 40,spdef: 55}, bst:360 , brewName:'Ay Pom Session Blonde' },

  { id:191, name:'Sunkern'         , types:['Ipa'], baseStats:{hp: 30,atk: 30,def: 30,speed: 30,special: 30,spdef: 30}, bst:180 , brewName:'Sun Kern Session IPA' },

  { id:192, name:'Sunflora'        , types:['Ipa'], baseStats:{hp: 75,atk: 75,def: 55,speed: 30,special:105,spdef: 85}, bst:425 , brewName:'Sun Flora IPA' },

  { id:193, name:'Yanma'           , types:['Saison', 'Wheat'], baseStats:{hp: 65,atk: 65,def: 45,speed: 95,special: 75,spdef: 45}, bst:390 , brewName:'Yan Ma Saison Wheat' },

  { id:194, name:'Wooper'          , types:['Lager', 'Brown'], baseStats:{hp: 55,atk: 45,def: 45,speed: 15,special: 25,spdef: 25}, bst:210 , brewName:'Woo Per Session Lager Brown' },

  { id:195, name:'Quagsire'        , types:['Lager', 'Brown'], baseStats:{hp: 95,atk: 85,def: 85,speed: 35,special: 65,spdef: 65}, bst:430 , brewName:'Quag Sire Lager Brown' },

  { id:196, name:'Espeon'          , types:['Belgian'], baseStats:{hp: 65,atk: 65,def: 60,speed:110,special:130,spdef: 95}, bst:525 , brewName:'Es Peon Imperial Belgian' },

  { id:197, name:'Umbreon'         , types:['Cascadian'], baseStats:{hp: 95,atk: 65,def:110,speed: 65,special: 60,spdef:130}, bst:525 , brewName:'Um Breon Imperial Cascadian' },

  { id:198, name:'Murkrow'         , types:['Cascadian', 'Wheat'], baseStats:{hp: 60,atk: 85,def: 42,speed: 91,special: 85,spdef: 42}, bst:405 , brewName:'Mur Crow Cascadian Wheat' },

  { id:199, name:'Slowking'        , types:['Lager', 'Belgian'], baseStats:{hp: 95,atk: 75,def: 80,speed: 30,special:100,spdef:110}, bst:490 , brewName:'Slow King Imperial Lager Belgian' },

  { id:200, name:'Misdreavus'      , types:['Seltzer'], baseStats:{hp: 60,atk: 60,def: 60,speed: 85,special: 85,spdef: 85}, bst:435 , brewName:'Mis Dreav Us Seltzer' },

  { id:201, name:'Unown'           , types:['Belgian'], baseStats:{hp: 48,atk: 72,def: 48,speed: 48,special: 72,spdef: 48}, bst:336 , brewName:'Un Own Session Belgian' },

  { id:202, name:'Wobbuffet'       , types:['Belgian'], baseStats:{hp:190,atk: 33,def: 58,speed: 33,special: 33,spdef: 58}, bst:405 , brewName:'Wob Buffet Imperial Belgian' },

  { id:203, name:'Girafarig'       , types:['Blonde', 'Belgian'], baseStats:{hp: 70,atk: 80,def: 65,speed: 85,special: 90,spdef: 65}, bst:455 , brewName:'Giraff A Rig Blonde Belgian' },

  { id:204, name:'Pineco'          , types:['Saison'], baseStats:{hp: 50,atk: 65,def: 90,speed: 15,special: 35,spdef: 35}, bst:290 , brewName:'Pine Cone Oh Session Saison' },

  { id:205, name:'Forretress'      , types:['Saison', 'Export'], baseStats:{hp: 75,atk: 90,def:140,speed: 40,special: 60,spdef: 60}, bst:465 , brewName:'For Ress Saison Export' },

  { id:206, name:'Dunsparce'       , types:['Blonde'], baseStats:{hp:100,atk: 70,def: 70,speed: 45,special: 65,spdef: 65}, bst:415 , brewName:'Dun Sparce Blonde' },

  { id:207, name:'Gligar'          , types:['Brown', 'Wheat'], baseStats:{hp: 65,atk: 75,def:105,speed: 85,special: 35,spdef: 65}, bst:430 , brewName:'Gly Gar Brown Wheat' },

  { id:208, name:'Steelix'         , types:['Export', 'Brown'], baseStats:{hp: 75,atk: 85,def:200,speed: 30,special: 55,spdef: 65}, bst:510 , brewName:'Steel Ix Imperial Export Brown' },

  { id:209, name:'Snubbull'        , types:['Pastry'], baseStats:{hp: 60,atk: 80,def: 50,speed: 30,special: 40,spdef: 40}, bst:300 , brewName:'Snub Bull Session Blonde' },

  { id:210, name:'Granbull'        , types:['Pastry'], baseStats:{hp: 90,atk:120,def: 75,speed: 45,special: 60,spdef: 60}, bst:450 , brewName:'Gran Bull Blonde' },

  { id:211, name:'Qwilfish'        , types:['Lager', 'Brett'], baseStats:{hp: 65,atk: 95,def: 85,speed: 85,special: 55,spdef: 55}, bst:440 , brewName:'Quill Fish Lager Brett' },

  { id:212, name:'Scizor'          , types:['Saison', 'Export'], baseStats:{hp: 70,atk:130,def:100,speed: 65,special: 55,spdef: 80}, bst:500 , brewName:'Sci Zor Saison Export' },

  { id:213, name:'Shuckle'         , types:['Saison', 'Barrel-aged'], baseStats:{hp: 20,atk: 10,def:230,speed:  5,special: 10,spdef:230}, bst:505 , brewName:'Shuck El Saison Barrel-aged' },

  { id:214, name:'Heracross'       , types:['Saison', 'Barleywine'], baseStats:{hp: 80,atk:125,def: 75,speed: 85,special: 40,spdef: 95}, bst:500 , brewName:'Hera Cross Saison Barleywine' },

  { id:215, name:'Sneasel'         , types:['Cascadian', 'Cryo'], baseStats:{hp: 55,atk: 95,def: 55,speed:115,special: 35,spdef: 75}, bst:430 , brewName:'Snee Zel Cascadian Cryo' },

  { id:216, name:'Teddiursa'       , types:['Blonde'], baseStats:{hp: 60,atk: 80,def: 50,speed: 40,special: 50,spdef: 50}, bst:330 , brewName:'Ted Di Ursa Session Blonde' },

  { id:217, name:'Ursaring'        , types:['Blonde'], baseStats:{hp: 90,atk:130,def: 75,speed: 55,special: 75,spdef: 75}, bst:500 , brewName:'Ur Saring Imperial Blonde' },

  { id:218, name:'Slugma'          , types:['Red'], baseStats:{hp: 40,atk: 40,def: 40,speed: 20,special: 70,spdef: 40}, bst:250 , brewName:'Slug Ma Session Red' },

  { id:219, name:'Magcargo'        , types:['Red', 'Barrel-aged'], baseStats:{hp: 50,atk: 50,def:120,speed: 30,special: 80,spdef: 80}, bst:410 , brewName:'Mag Cargo Red Barrel-aged' },

  { id:220, name:'Swinub'          , types:['Cryo', 'Brown'], baseStats:{hp: 50,atk: 50,def: 40,speed: 50,special: 30,spdef: 30}, bst:250 , brewName:'Swi Nub Session Cryo' },

  { id:221, name:'Piloswine'       , types:['Cryo', 'Brown'], baseStats:{hp:100,atk:100,def: 80,speed: 50,special: 60,spdef: 60}, bst:450 , brewName:'Pilo Swine Cryo Brown' },

  { id:222, name:'Corsola'         , types:['Lager', 'Barrel-aged'], baseStats:{hp: 55,atk: 55,def: 85,speed: 35,special: 65,spdef: 85}, bst:380 , brewName:'Cor Sola Lager Barrel-aged' },

  { id:223, name:'Remoraid'        , types:['Lager'], baseStats:{hp: 35,atk: 65,def: 35,speed: 65,special: 65,spdef: 35}, bst:300 , brewName:'Rem O Raid Session Lager' },

  { id:224, name:'Octillery'       , types:['Lager'], baseStats:{hp: 75,atk:105,def: 75,speed: 45,special:105,spdef: 75}, bst:480 , brewName:'Ok Till Ery Lager' },

  { id:225, name:'Delibird'        , types:['Cryo', 'Wheat'], baseStats:{hp: 45,atk: 55,def: 45,speed: 75,special: 65,spdef: 45}, bst:330 , brewName:'Del E Bird Cryo Wheat' },

  { id:226, name:'Mantine'         , types:['Lager', 'Wheat'], baseStats:{hp: 65,atk: 40,def: 70,speed: 70,special: 80,spdef:140}, bst:465 , brewName:'Man Teen Lager Wheat' },

  { id:227, name:'Skarmory'        , types:['Export', 'Wheat'], baseStats:{hp: 65,atk: 80,def:140,speed: 70,special: 40,spdef: 70}, bst:465 , brewName:'Skar More E Export Wheat' },

  { id:228, name:'Houndour'        , types:['Cascadian', 'Red'], baseStats:{hp: 45,atk: 60,def: 30,speed: 65,special: 80,spdef: 50}, bst:330 , brewName:'Hound Our Cascadian Red' },

  { id:229, name:'Houndoom'        , types:['Cascadian', 'Red'], baseStats:{hp: 75,atk: 90,def: 50,speed: 95,special:110,spdef: 80}, bst:500 , brewName:'Hound Oom Imperial Cascadian Red' },

  { id:230, name:'Kingdra'         , types:['Lager', 'Stout'], baseStats:{hp: 75,atk: 95,def: 95,speed: 85,special: 95,spdef: 95}, bst:540 , brewName:'King Dra Imperial Lager Stout' },

  { id:231, name:'Phanpy'          , types:['Brown'], baseStats:{hp: 90,atk: 60,def: 60,speed: 40,special: 40,spdef: 40}, bst:330 , brewName:'Fan Pee Session Brown' },

  { id:232, name:'Donphan'         , types:['Brown'], baseStats:{hp: 90,atk:120,def:120,speed: 50,special: 60,spdef: 60}, bst:500 , brewName:'Don Fan Imperial Brown' },

  { id:233, name:'Porygon2'        , types:['Blonde'], baseStats:{hp: 85,atk: 80,def: 90,speed: 60,special:105,spdef: 95}, bst:515 , brewName:'Pory Gone Too Blonde' },

  { id:234, name:'Stantler'        , types:['Blonde'], baseStats:{hp: 73,atk: 95,def: 62,speed: 85,special: 85,spdef: 65}, bst:465 , brewName:'Stan Tler Session Blonde' },

  { id:235, name:'Smeargle'        , types:['Blonde'], baseStats:{hp: 55,atk: 20,def: 35,speed: 75,special: 20,spdef: 45}, bst:250 , brewName:'Smear Gull Blonde' },

  { id:236, name:'Tyrogue'         , types:['Barleywine'], baseStats:{hp: 35,atk: 35,def: 35,speed: 35,special: 35,spdef: 35}, bst:210 , brewName:'Tie Rogue Session Barleywine' },

  { id:237, name:'Hitmontop'       , types:['Barleywine'], baseStats:{hp: 50,atk: 95,def: 95,speed: 70,special: 35,spdef:110}, bst:455 , brewName:'Hit Mon Top Barleywine' },

  { id:238, name:'Smoochum'        , types:['Cryo', 'Belgian'], baseStats:{hp: 45,atk: 30,def: 15,speed: 65,special: 85,spdef: 65}, bst:305 , brewName:'Smoo Chum Cryo Belgian' },

  { id:239, name:'Elekid'          , types:['Sour'], baseStats:{hp: 45,atk: 63,def: 37,speed: 95,special: 65,spdef: 55}, bst:360 , brewName:'Ellek Id Session Sour' },

  { id:240, name:'Magby'           , types:['Red'], baseStats:{hp: 45,atk: 75,def: 37,speed: 83,special: 70,spdef: 55}, bst:365 , brewName:'Mag By Session Red' },

  { id:241, name:'Miltank'         , types:['Blonde'], baseStats:{hp: 95,atk: 80,def:105,speed:100,special: 40,spdef: 70}, bst:490 , brewName:'Mill Tank Pastry Blonde' },

  { id:242, name:'Blissey'         , types:['Blonde'], baseStats:{hp:255,atk: 10,def: 10,speed: 55,special: 75,spdef:135}, bst:540 , brewName:'Bliss Ee Imperial Pastry Blonde' },

  { id:243, name:'Raikou'          , types:['Sour'], baseStats:{hp: 90,atk: 85,def: 75,speed:115,special:115,spdef:100}, bst:580 , brewName:'Rye Koo Imperial Sour' },

  { id:244, name:'Entei'           , types:['Red'], baseStats:{hp:115,atk:115,def: 85,speed:100,special: 90,spdef: 75}, bst:580 , brewName:'En Tay Imperial Red' },

  { id:245, name:'Suicune'         , types:['Lager'], baseStats:{hp:100,atk: 75,def:115,speed: 85,special: 90,spdef:115}, bst:580 , brewName:'Soo E Cune Imperial Lager' },

  { id:246, name:'Larvitar'        , types:['Barrel-aged', 'Brown'], baseStats:{hp: 50,atk: 64,def: 50,speed: 41,special: 45,spdef: 50}, bst:300 , brewName:'Lar Vitar Session Barrel-aged' },

  { id:247, name:'Pupitar'         , types:['Barrel-aged', 'Brown'], baseStats:{hp: 70,atk: 84,def: 70,speed: 51,special: 65,spdef: 70}, bst:410 , brewName:'Pew Pitar Barrel-aged Brown' },

  { id:248, name:'Tyranitar'       , types:['Barrel-aged', 'Cascadian'], baseStats:{hp:100,atk:134,def:110,speed: 61,special: 95,spdef:100}, bst:600 , brewName:'Ty Ran I Tar Imperial Barrel-aged Cascadian' },

  { id:249, name:'Lugia'           , types:['Belgian', 'Wheat'], baseStats:{hp:106,atk: 90,def:130,speed:110,special: 90,spdef:154}, bst:680 , brewName:'Lou Gia Imperial Belgian Wheat' },

  { id:250, name:'Ho Oh'           , types:['Red', 'Wheat'], baseStats:{hp:106,atk:130,def: 90,speed: 90,special:110,spdef:154}, bst:680 , brewName:'Ho Oh Imperial Red Wheat' },

  { id:251, name:'Celebi'          , types:['Belgian', 'Ipa'], baseStats:{hp:100,atk:100,def:100,speed:100,special:100,spdef:100}, bst:600 , brewName:'Sell A Bee Imperial IPA Belgian' },

  { id:252, name:'Treecko'         , types:['Ipa'], baseStats:{hp: 40,atk: 45,def: 35,speed: 70,special: 65,spdef: 55}, bst:310 , brewName:'Tree Koe Session IPA' },

  { id:253, name:'Grovyle'         , types:['Ipa'], baseStats:{hp: 50,atk: 65,def: 45,speed: 95,special: 85,spdef: 65}, bst:405 , brewName:'Grove Isle IPA' },

  { id:254, name:'Sceptile'        , types:['Ipa'], baseStats:{hp: 70,atk: 85,def: 65,speed:120,special:105,spdef: 85}, bst:530 , brewName:'Sep Tile Imperial IPA' },

  { id:255, name:'Torchic'         , types:['Red'], baseStats:{hp: 45,atk: 60,def: 40,speed: 45,special: 70,spdef: 50}, bst:310 , brewName:'Torch Ik Session Red' },

  { id:256, name:'Combusken'       , types:['Red', 'Barleywine'], baseStats:{hp: 60,atk: 85,def: 60,speed: 55,special: 85,spdef: 60}, bst:405 , brewName:'Comb Us Ken Red Barleywine' },

  { id:257, name:'Blaziken'        , types:['Red', 'Barleywine'], baseStats:{hp: 80,atk:120,def: 70,speed: 80,special:110,spdef: 70}, bst:530 , brewName:'Blaze E Ken Imperial Red Barleywine' },

  { id:258, name:'Mudkip'          , types:['Lager'], baseStats:{hp: 50,atk: 70,def: 50,speed: 40,special: 50,spdef: 50}, bst:310 , brewName:'Mud Kip Session Lager' },

  { id:259, name:'Marshtomp'       , types:['Lager', 'Brown'], baseStats:{hp: 70,atk: 85,def: 70,speed: 50,special: 60,spdef: 70}, bst:405 , brewName:'Marsh Stomp Lager Brown' },

  { id:260, name:'Swampert'        , types:['Lager', 'Brown'], baseStats:{hp:100,atk:110,def: 90,speed: 60,special: 85,spdef: 90}, bst:535 , brewName:'Swamp Ert Imperial Lager Brown' },

  { id:261, name:'Poochyena'       , types:['Cascadian'], baseStats:{hp: 35,atk: 55,def: 35,speed: 35,special: 30,spdef: 30}, bst:220 , brewName:'Pooch E Ena Session Cascadian' },

  { id:262, name:'Mightyena'       , types:['Cascadian'], baseStats:{hp: 70,atk: 90,def: 70,speed: 70,special: 60,spdef: 60}, bst:420 , brewName:'My Tee Ena Imperial Cascadian' },

  { id:263, name:'Zigzagoon'       , types:['Blonde'], baseStats:{hp: 38,atk: 30,def: 41,speed: 60,special: 30,spdef: 41}, bst:240 , brewName:'Zig Zag Goon Session Blonde' },

  { id:264, name:'Linoone'         , types:['Blonde'], baseStats:{hp: 78,atk: 70,def: 61,speed:100,special: 50,spdef: 61}, bst:420 , brewName:'Lye No One Blonde' },

  { id:265, name:'Wurmple'         , types:['Saison'], baseStats:{hp: 45,atk: 45,def: 35,speed: 20,special: 20,spdef: 30}, bst:195 , brewName:'Worm Pull Session Saison' },

  { id:266, name:'Silcoon'         , types:['Saison'], baseStats:{hp: 50,atk: 35,def: 55,speed: 15,special: 25,spdef: 25}, bst:205 , brewName:'Sil Coon Saison' },

  { id:267, name:'Beautifly'       , types:['Saison', 'Wheat'], baseStats:{hp: 60,atk: 70,def: 50,speed: 65,special:100,spdef: 50}, bst:395 , brewName:'Beau Ti Fly Saison Wheat' },

  { id:268, name:'Cascoon'         , types:['Saison'], baseStats:{hp: 50,atk: 35,def: 55,speed: 15,special: 25,spdef: 25}, bst:205 , brewName:'Kas Coon Brett Saison' },

  { id:269, name:'Dustox'          , types:['Saison', 'Brett'], baseStats:{hp: 60,atk: 50,def: 70,speed: 65,special: 50,spdef: 90}, bst:385 , brewName:'Dusk Ox Brett Saison Wheat' },

  { id:270, name:'Lotad'           , types:['Lager', 'Ipa'], baseStats:{hp: 40,atk: 30,def: 30,speed: 30,special: 40,spdef: 50}, bst:220 , brewName:'Low Tad Session Lager IPA' },

  { id:271, name:'Lombre'          , types:['Lager', 'Ipa'], baseStats:{hp: 60,atk: 50,def: 50,speed: 50,special: 60,spdef: 70}, bst:340 , brewName:'Lom Bray Lager IPA' },

  { id:272, name:'Ludicolo'        , types:['Lager', 'Ipa'], baseStats:{hp: 80,atk: 70,def: 70,speed: 70,special: 90,spdef:100}, bst:480 , brewName:'Lou Di Colo Imperial Lager IPA' },

  { id:273, name:'Seedot'          , types:['Ipa'], baseStats:{hp: 40,atk: 40,def: 50,speed: 30,special: 30,spdef: 30}, bst:220 , brewName:'Seed Dot Session IPA' },

  { id:274, name:'Nuzleaf'         , types:['Ipa', 'Cascadian'], baseStats:{hp: 70,atk: 70,def: 40,speed: 60,special: 60,spdef: 40}, bst:340 , brewName:'Noo Zee Leaf IPA Cascadian' },

  { id:275, name:'Shiftry'         , types:['Ipa', 'Cascadian'], baseStats:{hp: 90,atk:100,def: 60,speed: 80,special: 90,spdef: 60}, bst:480 , brewName:'Shift Ree Imperial IPA Cascadian' },

  { id:276, name:'Taillow'         , types:['Blonde', 'Wheat'], baseStats:{hp: 40,atk: 55,def: 30,speed: 85,special: 29,spdef: 30}, bst:269 , brewName:'Tail O Session Wheat' },

  { id:277, name:'Swellow'         , types:['Blonde', 'Wheat'], baseStats:{hp: 60,atk: 85,def: 60,speed:125,special: 75,spdef: 50}, bst:455 , brewName:'Swell Oh Blonde Wheat' },

  { id:278, name:'Wingull'         , types:['Lager', 'Wheat'], baseStats:{hp: 40,atk: 30,def: 30,speed: 85,special: 55,spdef: 30}, bst:270 , brewName:'Wing Gull Session Lager Wheat' },

  { id:279, name:'Pelipper'        , types:['Lager', 'Wheat'], baseStats:{hp: 60,atk: 50,def:100,speed: 65,special: 95,spdef: 70}, bst:440 , brewName:'Pell I Per Imperial Lager Wheat' },

  { id:280, name:'Ralts'           , types:['Belgian', 'Pastry'], baseStats:{hp: 28,atk: 25,def: 25,speed: 40,special: 45,spdef: 35}, bst:198 , brewName:'Ralts Session Belgian' },

  { id:281, name:'Kirlia'          , types:['Belgian', 'Pastry'], baseStats:{hp: 38,atk: 35,def: 35,speed: 50,special: 65,spdef: 55}, bst:278 , brewName:'Keer Lee Ah Belgian' },

  { id:282, name:'Gardevoir'       , types:['Belgian', 'Pastry'], baseStats:{hp: 68,atk: 65,def: 65,speed: 80,special:125,spdef:115}, bst:518 , brewName:'Gar Dee Vwar Imperial Belgian' },

  { id:283, name:'Surskit'         , types:['Saison', 'Lager'], baseStats:{hp: 40,atk: 30,def: 32,speed: 65,special: 50,spdef: 52}, bst:269 , brewName:'Sir Skit Session Saison Lager' },

  { id:284, name:'Masquerain'      , types:['Saison', 'Wheat'], baseStats:{hp: 70,atk: 60,def: 62,speed: 60,special: 80,spdef: 82}, bst:414 , brewName:'Mas Ker Rain Saison Wheat' },

  { id:285, name:'Shroomish'       , types:['Ipa'], baseStats:{hp: 60,atk: 40,def: 60,speed: 35,special: 40,spdef: 60}, bst:295 , brewName:'Shroo Mish Session IPA' },

  { id:286, name:'Breloom'         , types:['Ipa', 'Barleywine'], baseStats:{hp: 60,atk:130,def: 80,speed: 70,special: 60,spdef: 60}, bst:460 , brewName:'Bree Loom IPA Barleywine' },

  { id:287, name:'Slakoth'         , types:['Blonde'], baseStats:{hp: 60,atk: 60,def: 60,speed: 30,special: 35,spdef: 35}, bst:280 , brewName:'Slake Oth Session Blonde' },

  { id:288, name:'Vigoroth'        , types:['Blonde'], baseStats:{hp: 80,atk: 80,def: 80,speed: 90,special: 55,spdef: 55}, bst:440 , brewName:'Vig O Roth Blonde' },

  { id:289, name:'Slaking'         , types:['Blonde'], baseStats:{hp:150,atk:160,def:100,speed:100,special: 95,spdef: 65}, bst:670 , brewName:'Slake Ing Imperial Blonde' },

  { id:290, name:'Nincada'         , types:['Saison', 'Brown'], baseStats:{hp: 31,atk: 45,def: 90,speed: 40,special: 30,spdef: 30}, bst:266 , brewName:'Nin Kah Dah Session Saison' },

  { id:291, name:'Ninjask'         , types:['Saison', 'Wheat'], baseStats:{hp: 61,atk: 90,def: 45,speed:160,special: 50,spdef: 50}, bst:456 , brewName:'Nin Jask Saison Wheat' },

  { id:292, name:'Shedinja'        , types:['Saison', 'Seltzer'], baseStats:{hp:  1,atk: 90,def: 45,speed: 40,special: 30,spdef: 30}, bst:236 , brewName:'Shed In Jah Seltzer Saison' },

  { id:293, name:'Whismur'         , types:['Blonde'], baseStats:{hp: 64,atk: 51,def: 23,speed: 28,special: 51,spdef: 23}, bst:240 , brewName:'Whis Mur Session Blonde' },

  { id:294, name:'Loudred'         , types:['Blonde'], baseStats:{hp: 84,atk: 71,def: 43,speed: 48,special: 71,spdef: 43}, bst:360 , brewName:'Loud Red Blonde' },

  { id:295, name:'Exploud'         , types:['Blonde'], baseStats:{hp:104,atk: 91,def: 63,speed: 68,special: 91,spdef: 63}, bst:480 , brewName:'Ex Ploud Imperial Blonde' },

  { id:296, name:'Makuhita'        , types:['Barleywine'], baseStats:{hp: 72,atk: 60,def: 30,speed: 25,special: 20,spdef: 30}, bst:237 , brewName:'Mah Koo Hita Session Barleywine' },

  { id:297, name:'Hariyama'        , types:['Barleywine'], baseStats:{hp:144,atk:120,def: 60,speed: 50,special: 40,spdef: 60}, bst:474 , brewName:'Har E Yama Imperial Barleywine' },

  { id:298, name:'Azurill'         , types:['Blonde', 'Pastry'], baseStats:{hp: 50,atk: 20,def: 40,speed: 20,special: 20,spdef: 40}, bst:190 , brewName:'Az U Rill Session Lager' },

  { id:299, name:'Nosepass'        , types:['Barrel-aged'], baseStats:{hp: 30,atk: 45,def:135,speed: 30,special: 45,spdef: 90}, bst:375 , brewName:'Nose Pass Session Barrel-aged' },

  { id:300, name:'Skitty'          , types:['Blonde'], baseStats:{hp: 50,atk: 45,def: 45,speed: 50,special: 35,spdef: 35}, bst:260 , brewName:'Skit Ee Session Blonde' },

  { id:301, name:'Delcatty'        , types:['Blonde'], baseStats:{hp: 70,atk: 65,def: 65,speed: 70,special: 55,spdef: 55}, bst:380 , brewName:'Del Catty Blonde' },

  { id:302, name:'Sableye'         , types:['Cascadian', 'Seltzer'], baseStats:{hp: 50,atk: 75,def: 75,speed: 50,special: 65,spdef: 65}, bst:380 , brewName:'Say Bull Eye Cascadian Seltzer' },

  { id:303, name:'Mawile'          , types:['Export', 'Pastry'], baseStats:{hp: 50,atk: 85,def: 85,speed: 50,special: 55,spdef: 55}, bst:380 , brewName:'Maw Wile Session Export' },

  { id:304, name:'Aron'            , types:['Export', 'Barrel-aged'], baseStats:{hp: 50,atk: 70,def:100,speed: 30,special: 40,spdef: 40}, bst:330 , brewName:'Air On Session Export Barrel-aged' },

  { id:305, name:'Lairon'          , types:['Export', 'Barrel-aged'], baseStats:{hp: 60,atk: 90,def:140,speed: 40,special: 50,spdef: 50}, bst:430 , brewName:'Lay Ron Export Barrel-aged' },

  { id:306, name:'Aggron'          , types:['Export', 'Barrel-aged'], baseStats:{hp: 70,atk:110,def:180,speed: 50,special: 60,spdef: 60}, bst:530 , brewName:'Ag Ron Imperial Export Barrel-aged' },

  { id:307, name:'Meditite'        , types:['Barleywine', 'Belgian'], baseStats:{hp: 30,atk: 40,def: 55,speed: 60,special: 40,spdef: 55}, bst:280 , brewName:'Med E Tite Session Barleywine Belgian' },

  { id:308, name:'Medicham'        , types:['Barleywine', 'Belgian'], baseStats:{hp: 60,atk: 60,def: 75,speed: 80,special: 60,spdef: 75}, bst:410 , brewName:'Med E Cham Barleywine Belgian' },

  { id:309, name:'Electrike'       , types:['Sour'], baseStats:{hp: 40,atk: 45,def: 40,speed: 65,special: 65,spdef: 40}, bst:295 , brewName:'Ellek Trike Session Sour' },

  { id:310, name:'Manectric'       , types:['Sour'], baseStats:{hp: 70,atk: 75,def: 60,speed:105,special:105,spdef: 60}, bst:475 , brewName:'Mane Ek Trik Imperial Sour' },

  { id:311, name:'Plusle'          , types:['Sour'], baseStats:{hp: 60,atk: 50,def: 40,speed: 95,special: 85,spdef: 75}, bst:405 , brewName:'Plus L Session Sour' },

  { id:312, name:'Minun'           , types:['Sour'], baseStats:{hp: 60,atk: 40,def: 50,speed: 95,special: 75,spdef: 85}, bst:405 , brewName:'Min Un Sour' },

  { id:313, name:'Volbeat'         , types:['Saison'], baseStats:{hp: 65,atk: 73,def: 55,speed: 85,special: 47,spdef: 75}, bst:400 , brewName:'Vole Beet Session Saison' },

  { id:314, name:'Illumise'        , types:['Saison'], baseStats:{hp: 65,atk: 47,def: 55,speed: 85,special: 73,spdef: 75}, bst:400 , brewName:'Illu Meese Saison' },

  { id:315, name:'Roselia'         , types:['Ipa', 'Brett'], baseStats:{hp: 50,atk: 60,def: 45,speed: 65,special:100,spdef: 80}, bst:400 , brewName:'Rose Eel Ee A IPA Brett' },

  { id:316, name:'Gulpin'          , types:['Brett'], baseStats:{hp: 70,atk: 43,def: 53,speed: 40,special: 43,spdef: 53}, bst:302 , brewName:'Gull Pin Session Brett' },

  { id:317, name:'Swalot'          , types:['Brett'], baseStats:{hp:100,atk: 73,def: 83,speed: 55,special: 73,spdef: 83}, bst:467 , brewName:'Swall Ot Imperial Brett' },

  { id:318, name:'Carvanha'        , types:['Lager', 'Cascadian'], baseStats:{hp: 45,atk: 90,def: 20,speed: 65,special: 65,spdef: 20}, bst:305 , brewName:'Car Van Ha Session Lager Cascadian' },

  { id:319, name:'Sharpedo'        , types:['Lager', 'Cascadian'], baseStats:{hp: 70,atk:120,def: 40,speed: 95,special: 95,spdef: 40}, bst:460 , brewName:'Sharp Eedo Imperial Lager Cascadian' },

  { id:320, name:'Wailmer'         , types:['Lager'], baseStats:{hp:130,atk: 70,def: 35,speed: 60,special: 70,spdef: 35}, bst:400 , brewName:'Wail Mer Session Lager' },

  { id:321, name:'Wailord'         , types:['Lager'], baseStats:{hp:170,atk: 90,def: 45,speed: 60,special: 90,spdef: 45}, bst:500 , brewName:'Wail Lord Imperial Lager' },

  { id:322, name:'Numel'           , types:['Red', 'Brown'], baseStats:{hp: 60,atk: 60,def: 40,speed: 35,special: 65,spdef: 45}, bst:305 , brewName:'New Mel Session Red Brown' },

  { id:323, name:'Camerupt'        , types:['Red', 'Brown'], baseStats:{hp: 70,atk:100,def: 70,speed: 40,special:105,spdef: 75}, bst:460 , brewName:'Camerupt Red Brown' },

  { id:324, name:'Torkoal'         , types:['Red'], baseStats:{hp: 70,atk: 85,def:140,speed: 20,special: 85,spdef: 70}, bst:470 , brewName:'Tor Coal Imperial Red' },

  { id:325, name:'Spoink'          , types:['Belgian'], baseStats:{hp: 60,atk: 25,def: 35,speed: 60,special: 70,spdef: 80}, bst:330 , brewName:'Spoy Ink Session Belgian' },

  { id:326, name:'Grumpig'         , types:['Belgian'], baseStats:{hp: 80,atk: 45,def: 65,speed: 80,special:110,spdef:110}, bst:490 , brewName:'Grump Ig Belgian' },

  { id:327, name:'Spinda'          , types:['Blonde'], baseStats:{hp: 60,atk: 60,def: 60,speed: 60,special: 60,spdef: 60}, bst:360 , brewName:'Spin Dah Session Blonde' },

  { id:328, name:'Trapinch'        , types:['Brown'], baseStats:{hp: 45,atk:100,def: 45,speed: 10,special: 45,spdef: 45}, bst:290 , brewName:'Trap Inch Session Brown' },

  { id:329, name:'Vibrava'         , types:['Brown', 'Stout'], baseStats:{hp: 50,atk: 70,def: 50,speed: 70,special: 50,spdef: 50}, bst:340 , brewName:'Vye Brava Brown Stout' },

  { id:330, name:'Flygon'          , types:['Brown', 'Stout'], baseStats:{hp: 80,atk:100,def: 80,speed:100,special: 80,spdef: 80}, bst:520 , brewName:'Fly Gone Imperial Brown Stout' },

  { id:331, name:'Cacnea'          , types:['Ipa'], baseStats:{hp: 50,atk: 85,def: 40,speed: 35,special: 85,spdef: 40}, bst:335 , brewName:'Kak Nee Ah Session IPA' },

  { id:332, name:'Cacturne'        , types:['Ipa', 'Cascadian'], baseStats:{hp: 70,atk:115,def: 60,speed: 55,special:115,spdef: 60}, bst:475 , brewName:'Kak Turn IPA Cascadian' },

  { id:333, name:'Swablu'          , types:['Blonde', 'Wheat'], baseStats:{hp: 45,atk: 40,def: 60,speed: 50,special: 40,spdef: 75}, bst:310 , brewName:'Swab Loo Session Blonde Wheat' },

  { id:334, name:'Altaria'         , types:['Stout', 'Wheat'], baseStats:{hp: 75,atk: 70,def: 90,speed: 80,special: 70,spdef:105}, bst:490 , brewName:'All Taria Imperial Stout Wheat' },

  { id:335, name:'Zangoose'        , types:['Blonde'], baseStats:{hp: 73,atk:115,def: 60,speed: 90,special: 60,spdef: 60}, bst:458 , brewName:'Zan Goose Session Blonde' },

  { id:336, name:'Seviper'         , types:['Brett'], baseStats:{hp: 73,atk:100,def: 60,speed: 65,special:100,spdef: 60}, bst:458 , brewName:'Sev Eye Per Imperial Brett' },

  { id:337, name:'Lunatone'        , types:['Barrel-aged', 'Belgian'], baseStats:{hp: 70,atk: 55,def: 65,speed: 70,special: 95,spdef: 85}, bst:440 , brewName:'Luna Stone Barrel-aged Belgian' },

  { id:338, name:'Solrock'         , types:['Barrel-aged', 'Belgian'], baseStats:{hp: 70,atk: 95,def: 85,speed: 70,special: 55,spdef: 65}, bst:440 , brewName:'Sol Rock Imperial Barrel-aged Belgian' },

  { id:339, name:'Barboach'        , types:['Lager', 'Brown'], baseStats:{hp: 50,atk: 48,def: 43,speed: 60,special: 46,spdef: 41}, bst:288 , brewName:'Bar Boach Session Lager Brown' },

  { id:340, name:'Whiscash'        , types:['Lager', 'Brown'], baseStats:{hp:110,atk: 78,def: 73,speed: 60,special: 76,spdef: 71}, bst:468 , brewName:'Whis Cash Lager Brown' },

  { id:341, name:'Corphish'        , types:['Lager'], baseStats:{hp: 43,atk: 80,def: 65,speed: 35,special: 50,spdef: 35}, bst:308 , brewName:'Cor Fish Session Lager' },

  { id:342, name:'Crawdaunt'       , types:['Lager', 'Cascadian'], baseStats:{hp: 63,atk:120,def: 85,speed: 55,special: 90,spdef: 55}, bst:468 , brewName:'Crawl Daunt Lager Cascadian' },

  { id:343, name:'Baltoy'          , types:['Brown', 'Belgian'], baseStats:{hp: 40,atk: 40,def: 55,speed: 55,special: 40,spdef: 70}, bst:300 , brewName:'Bal Toy Session Brown Belgian' },

  { id:344, name:'Claydol'         , types:['Brown', 'Belgian'], baseStats:{hp: 60,atk: 70,def:105,speed: 75,special: 70,spdef:120}, bst:500 , brewName:'Clay Doll Brown Belgian' },

  { id:345, name:'Lileep'          , types:['Barrel-aged', 'Ipa'], baseStats:{hp: 66,atk: 41,def: 77,speed: 40,special: 61,spdef: 87}, bst:372 , brewName:'Lily Eep Session Barrel-aged IPA' },

  { id:346, name:'Cradily'         , types:['Barrel-aged', 'Ipa'], baseStats:{hp: 86,atk: 81,def: 97,speed: 43,special: 81,spdef:107}, bst:495 , brewName:'Cray Dilly Barrel-aged IPA' },

  { id:347, name:'Anorith'         , types:['Barrel-aged', 'Saison'], baseStats:{hp: 45,atk: 95,def: 50,speed: 75,special: 40,spdef: 50}, bst:355 , brewName:'An O Rith Session Barrel-aged Saison' },

  { id:348, name:'Armaldo'         , types:['Barrel-aged', 'Saison'], baseStats:{hp: 75,atk:125,def:100,speed: 45,special: 70,spdef: 80}, bst:495 , brewName:'Arm Aldo Barrel-aged Saison' },

  { id:349, name:'Feebas'          , types:['Lager'], baseStats:{hp: 20,atk: 15,def: 20,speed: 80,special: 10,spdef: 55}, bst:200 , brewName:'Fee Bas Session Lager' },

  { id:350, name:'Milotic'         , types:['Lager'], baseStats:{hp: 95,atk: 60,def: 79,speed: 81,special:100,spdef:125}, bst:540 , brewName:'My Lot Ik Imperial Lager' },

  { id:351, name:'Castform'        , types:['Blonde'], baseStats:{hp: 70,atk: 70,def: 70,speed: 70,special: 70,spdef: 70}, bst:420 , brewName:'Cast Form Session Blonde' },

  { id:352, name:'Kecleon'         , types:['Blonde'], baseStats:{hp: 60,atk: 90,def: 70,speed: 40,special: 60,spdef:120}, bst:440 , brewName:'Keck Leon Blonde' },

  { id:353, name:'Shuppet'         , types:['Seltzer'], baseStats:{hp: 44,atk: 75,def: 35,speed: 45,special: 63,spdef: 33}, bst:295 , brewName:'Shup It Session Seltzer' },

  { id:354, name:'Banette'         , types:['Seltzer'], baseStats:{hp: 64,atk:115,def: 65,speed: 65,special: 83,spdef: 63}, bst:455 , brewName:'Bah Net Imperial Seltzer' },

  { id:355, name:'Duskull'         , types:['Seltzer'], baseStats:{hp: 20,atk: 40,def: 90,speed: 25,special: 30,spdef: 90}, bst:295 , brewName:'Dusk Ull Session Seltzer' },

  { id:356, name:'Dusclops'        , types:['Seltzer'], baseStats:{hp: 40,atk: 70,def:130,speed: 25,special: 60,spdef:130}, bst:455 , brewName:'Dusk Lops Seltzer' },

  { id:357, name:'Tropius'         , types:['Ipa', 'Wheat'], baseStats:{hp: 99,atk: 68,def: 83,speed: 51,special: 72,spdef: 87}, bst:460 , brewName:'Trop E Us IPA Wheat' },

  { id:358, name:'Chimecho'        , types:['Belgian'], baseStats:{hp: 65,atk: 50,def: 70,speed: 65,special: 95,spdef: 80}, bst:425 , brewName:'Chime Echo Session Belgian' },

  { id:359, name:'Absol'           , types:['Cascadian'], baseStats:{hp: 65,atk:130,def: 60,speed: 75,special: 75,spdef: 60}, bst:465 , brewName:'Ab Sol Imperial Cascadian' },

  { id:360, name:'Wynaut'          , types:['Belgian'], baseStats:{hp: 95,atk: 23,def: 48,speed: 23,special: 23,spdef: 48}, bst:260 , brewName:'Why Knot Session Belgian' },

  { id:361, name:'Snorunt'         , types:['Cryo'], baseStats:{hp: 50,atk: 50,def: 50,speed: 50,special: 50,spdef: 50}, bst:300 , brewName:'Snore Runt Session Cryo' },

  { id:362, name:'Glalie'          , types:['Cryo'], baseStats:{hp: 80,atk: 80,def: 80,speed: 80,special: 80,spdef: 80}, bst:480 , brewName:'Gla Lee Imperial Cryo' },

  { id:363, name:'Spheal'          , types:['Cryo', 'Lager'], baseStats:{hp: 70,atk: 40,def: 50,speed: 25,special: 55,spdef: 50}, bst:290 , brewName:'S Pheel Session Cryo Lager' },

  { id:364, name:'Sealeo'          , types:['Cryo', 'Lager'], baseStats:{hp: 90,atk: 60,def: 70,speed: 45,special: 75,spdef: 70}, bst:410 , brewName:'Seal E Oh Cryo Lager' },

  { id:365, name:'Walrein'         , types:['Cryo', 'Lager'], baseStats:{hp:110,atk: 80,def: 90,speed: 65,special: 95,spdef: 90}, bst:530 , brewName:'Wall Rine Imperial Cryo Lager' },

  { id:366, name:'Clamperl'        , types:['Lager'], baseStats:{hp: 35,atk: 64,def: 85,speed: 32,special: 74,spdef: 55}, bst:345 , brewName:'Clam Perl Session Lager' },

  { id:367, name:'Huntail'         , types:['Lager'], baseStats:{hp: 55,atk:104,def:105,speed: 52,special: 94,spdef: 75}, bst:485 , brewName:'Hunt Tail Lager' },

  { id:368, name:'Gorebyss'        , types:['Lager'], baseStats:{hp: 55,atk: 84,def:105,speed: 52,special:114,spdef: 75}, bst:485 , brewName:'Gore E Bis Imperial Lager' },

  { id:369, name:'Relicanth'       , types:['Lager', 'Barrel-aged'], baseStats:{hp:100,atk: 90,def:130,speed: 55,special: 45,spdef: 65}, bst:485 , brewName:'Reel E Canth Lager Barrel-aged' },

  { id:370, name:'Luvdisc'         , types:['Lager'], baseStats:{hp: 43,atk: 30,def: 55,speed: 97,special: 40,spdef: 65}, bst:330 , brewName:'Luv Disc Session Lager' },

  { id:371, name:'Bagon'           , types:['Stout'], baseStats:{hp: 45,atk: 75,def: 60,speed: 50,special: 40,spdef: 30}, bst:300 , brewName:'Bay Gone Session Stout' },

  { id:372, name:'Shelgon'         , types:['Stout'], baseStats:{hp: 65,atk: 95,def:100,speed: 50,special: 60,spdef: 50}, bst:420 , brewName:'Shell Gone Stout' },

  { id:373, name:'Salamence'       , types:['Stout', 'Wheat'], baseStats:{hp: 95,atk:135,def: 80,speed:100,special:110,spdef: 80}, bst:600 , brewName:'Sal A Mence Imperial Stout Wheat' },

  { id:374, name:'Beldum'          , types:['Export', 'Belgian'], baseStats:{hp: 40,atk: 55,def: 80,speed: 30,special: 35,spdef: 60}, bst:300 , brewName:'Bell Dum Session Export Belgian' },

  { id:375, name:'Metang'          , types:['Export', 'Belgian'], baseStats:{hp: 60,atk: 75,def:100,speed: 50,special: 55,spdef: 80}, bst:420 , brewName:'Meh Tang Export Belgian' },

  { id:376, name:'Metagross'       , types:['Export', 'Belgian'], baseStats:{hp: 80,atk:135,def:130,speed: 70,special: 95,spdef: 90}, bst:600 , brewName:'Meta Gross Imperial Export Belgian' },

  { id:377, name:'Regirock'        , types:['Barrel-aged'], baseStats:{hp: 80,atk:100,def:200,speed: 50,special: 50,spdef:100}, bst:580 , brewName:'Reg E Rock Imperial Barrel-aged' },

  { id:378, name:'Regice'          , types:['Cryo'], baseStats:{hp: 80,atk: 50,def:100,speed: 50,special:100,spdef:200}, bst:580 , brewName:'Reg E Ice Imperial Cryo' },

  { id:379, name:'Registeel'       , types:['Export'], baseStats:{hp: 80,atk: 75,def:150,speed: 50,special: 75,spdef:150}, bst:580 , brewName:'Reg E Steel Imperial Export' },

  { id:380, name:'Latias'          , types:['Stout', 'Belgian'], baseStats:{hp: 80,atk: 80,def: 90,speed:110,special:110,spdef:130}, bst:600 , brewName:'Lah Tee Ahs Imperial Stout Belgian' },

  { id:381, name:'Latios'          , types:['Stout', 'Belgian'], baseStats:{hp: 80,atk: 90,def: 80,speed:110,special:130,spdef:110}, bst:600 , brewName:'Lah Tee Os Imperial Stout Belgian' },

  { id:382, name:'Kyogre'          , types:['Lager'], baseStats:{hp:100,atk:100,def: 90,speed: 90,special:150,spdef:140}, bst:670 , brewName:'Ky Ogre Imperial Lager' },

  { id:383, name:'Groudon'         , types:['Brown'], baseStats:{hp:100,atk:150,def:140,speed: 90,special:100,spdef: 90}, bst:670 , brewName:'Groo Don Imperial Brown' },

  { id:384, name:'Rayquaza'        , types:['Stout', 'Wheat'], baseStats:{hp:105,atk:150,def: 90,speed: 95,special:150,spdef: 90}, bst:680 , brewName:'Ray Kwaz Ah Imperial Stout Wheat' },

  { id:385, name:'Jirachi'         , types:['Export', 'Belgian'], baseStats:{hp:100,atk:100,def:100,speed:100,special:100,spdef:100}, bst:600 , brewName:'Jee Rachi Imperial Export Belgian' },

  { id:386, name:'Deoxys'          , types:['Belgian'], baseStats:{hp: 50,atk:150,def: 50,speed:150,special:150,spdef: 50}, bst:600 , brewName:'Dee Ox Is Imperial Belgian' },

  { id:6666, name:'Charlie'         , types:['Stout', 'Cryo'], baseStats:{hp: 125,atk:170,def: 100,speed:95,special:120,spdef: 90}, bst:700 , brewName:'Frosted Whiskers' }

];

// ---- Drop-in replacements for PokeAPI fetch functions ----

// Index by ID for O(1) lookup
const SPECIES_BY_ID = Object.fromEntries(SPECIES_DATA.map(s => [s.id, s]));

function getSpeciesById(id) {
  return SPECIES_BY_ID[id] || null;
}

// BST buckets — replaces GEN1_BST_APPROX, now covers Gen 1-3
// Bucketed by actual BST values computed from SPECIES_DATA
const BST_BUCKETS = (() => {
  const buckets = { low:[], midLow:[], mid:[], midHigh:[], high:[], veryHigh:[] };
  for (const s of SPECIES_DATA) {
    if (s.bst >= 530)      buckets.veryHigh.push(s.id);
    else if (s.bst >= 460) buckets.high.push(s.id);
    else if (s.bst >= 400) buckets.midHigh.push(s.id);
    else if (s.bst >= 340) buckets.mid.push(s.id);
    else if (s.bst >= 280) buckets.midLow.push(s.id);
    else                   buckets.low.push(s.id);
  }
  return buckets;
})();

// Async wrapper matching the existing getCatchChoices() API signature
// Returns 3 random species objects from the right BST bucket for mapIndex
async function getSpeciesForMap(mapIndex) {
  const MAP_BST_RANGES_LOCAL = [
    { min:200,max:310 }, { min:280,max:360 }, { min:340,max:420 },
    { min:340,max:420 }, { min:400,max:480 }, { min:400,max:480 },
    { min:460,max:530 }, { min:460,max:530 }, { min:530,max:999 },
  ];
  const range = MAP_BST_RANGES_LOCAL[Math.min(mapIndex, MAP_BST_RANGES_LOCAL.length - 1)];
  let bucket;
  if      (range.min >= 530) bucket = BST_BUCKETS.veryHigh;
  else if (range.min >= 460) bucket = BST_BUCKETS.high;
  else if (range.min >= 400) bucket = BST_BUCKETS.midHigh;
  else if (range.min >= 340) bucket = BST_BUCKETS.mid;
  else if (range.min >= 280) bucket = BST_BUCKETS.midLow;
  else                       bucket = BST_BUCKETS.low;
  const shuffled = [...bucket].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3).map(id => getSpeciesById(id)).filter(Boolean);
}

// All catchable IDs (1-387)
const ALL_CATCHABLE_IDS = new Set(SPECIES_DATA.map(s => s.id));

// data.js - Pokemon data, gym leaders, items, type chart

const TYPE_CHART = {
  Blonde:     { Blonde:1, Red:1, Lager:1, Sour:1, Ipa:1, Cryo:1, Barleywine:1, Brett:1, Brown:1, Wheat:1, Belgian:1, Saison:1, "Barrel-aged":0.5, Seltzer:0, Stout:1, Export:0.5, Cascadian:1, Pastry:1 },
  Red:        { Blonde:1, Red:0.5, Lager:0.5, Sour:1, Ipa:2, Cryo:2, Barleywine:1, Brett:1, Brown:1, Wheat:1, Belgian:1, Saison:2, "Barrel-aged":0.5, Seltzer:1, Stout:0.5, Export:2, Cascadian:1, Pastry:1 },
  Lager:      { Blonde:1, Red:2, Lager:0.5, Sour:1, Ipa:0.5, Cryo:1, Barleywine:1, Brett:1, Brown:2, Wheat:1, Belgian:1, Saison:1, "Barrel-aged":2, Seltzer:1, Stout:0.5, Export:1, Cascadian:1, Pastry:1 },
  Sour:       { Blonde:1, Red:1, Lager:2, Sour:0.5, Ipa:0.5, Cryo:1, Barleywine:1, Brett:1, Brown:0, Wheat:2, Belgian:1, Saison:1, "Barrel-aged":1, Seltzer:1, Stout:0.5, Export:1, Cascadian:1, Pastry:1 },
  Ipa:        { Blonde:1, Red:0.5, Lager:2, Sour:1, Ipa:0.5, Cryo:1, Barleywine:1, Brett:0.5, Brown:2, Wheat:0.5, Belgian:1, Saison:0.5, "Barrel-aged":2, Seltzer:1, Stout:0.5, Export:0.5, Cascadian:1, Pastry:1 },
  Cryo:       { Blonde:1, Red:0.5, Lager:0.5, Sour:1, Ipa:2, Cryo:0.5, Barleywine:1, Brett:1, Brown:2, Wheat:2, Belgian:1, Saison:1, "Barrel-aged":1, Seltzer:1, Stout:2, Export:0.5, Cascadian:1, Pastry:1 },
  Barleywine: { Blonde:2, Red:1, Lager:1, Sour:1, Ipa:1, Cryo:2, Barleywine:1, Brett:0.5, Brown:1, Wheat:0.5, Belgian:0.5, Saison:0.5, "Barrel-aged":2, Seltzer:0, Stout:1, Export:2, Cascadian:2, Pastry:0.5 },
  Brett:      { Blonde:1, Red:1, Lager:1, Sour:1, Ipa:2, Cryo:1, Barleywine:1, Brett:0.5, Brown:0.5, Wheat:1, Belgian:1, Saison:1, "Barrel-aged":0.5, Seltzer:0.5, Stout:1, Export:0, Cascadian:1, Pastry:2 },
  Brown:      { Blonde:1, Red:2, Lager:1, Sour:2, Ipa:0.5, Cryo:1, Barleywine:1, Brett:2, Brown:1, Wheat:0, Belgian:1, Saison:0.5, "Barrel-aged":2, Seltzer:1, Stout:1, Export:2, Cascadian:1, Pastry:1 },
  Wheat:      { Blonde:1, Red:1, Lager:1, Sour:0.5, Ipa:2, Cryo:1, Barleywine:2, Brett:1, Brown:1, Wheat:1, Belgian:1, Saison:2, "Barrel-aged":0.5, Seltzer:1, Stout:1, Export:0.5, Cascadian:1, Pastry:1 },
  Belgian:    { Blonde:1, Red:1, Lager:1, Sour:1, Ipa:1, Cryo:1, Barleywine:2, Brett:2, Brown:1, Wheat:1, Belgian:0.5, Saison:1, "Barrel-aged":1, Seltzer:1, Stout:1, Export:0.5, Cascadian:0, Pastry:1 },
  Saison:     { Blonde:1, Red:0.5, Lager:1, Sour:1, Ipa:2, Cryo:1, Barleywine:0.5, Brett:0.5, Brown:1, Wheat:0.5, Belgian:2, Saison:1, "Barrel-aged":1, Seltzer:0.5, Stout:1, Export:0.5, Cascadian:2, Pastry:0.5 },
  "Barrel-aged":{ Blonde:1, Red:2, Lager:1, Sour:1, Ipa:1, Cryo:2, Barleywine:0.5, Brett:1, Brown:0.5, Wheat:2, Belgian:1, Saison:2, "Barrel-aged":1, Seltzer:1, Stout:1, Export:0.5, Cascadian:1, Pastry:1 },
  Seltzer:    { Blonde:0, Red:1, Lager:1, Sour:1, Ipa:1, Cryo:1, Barleywine:1, Brett:1, Brown:1, Wheat:1, Belgian:2, Saison:1, "Barrel-aged":1, Seltzer:2, Stout:1, Export:1, Cascadian:0.5, Pastry:1 },
  Stout:      { Blonde:1, Red:1, Lager:1, Sour:1, Ipa:1, Cryo:1, Barleywine:1, Brett:1, Brown:1, Wheat:1, Belgian:1, Saison:1, "Barrel-aged":1, Seltzer:1, Stout:2, Export:0.5, Cascadian:1, Pastry:0 },
  Export:     { Blonde:1, Red:0.5, Lager:0.5, Sour:0.5, Ipa:1, Cryo:2, Barleywine:1, Brett:1, Brown:1, Wheat:1, Belgian:1, Saison:1, "Barrel-aged":2, Seltzer:1, Stout:1, Export:0.5, Cascadian:1, Pastry:2 },
  Cascadian:  { Blonde:1, Red:1, Lager:1, Sour:1, Ipa:1, Cryo:1, Barleywine:0.5, Brett:1, Brown:1, Wheat:1, Belgian:2, Saison:1, "Barrel-aged":1, Seltzer:2, Stout:1, Export:1, Cascadian:0.5, Pastry:0.5 },
  Pastry:     { Blonde:1, Red:0.5, Lager:1, Sour:1, Ipa:1, Cryo:1, Barleywine:2, Brett:0.5, Brown:1, Wheat:1, Belgian:1, Saison:1, "Barrel-aged":1, Seltzer:1, Stout:2, Export:0.5, Cascadian:2, Pastry:1 }
};

// Type mapping: PokeAPI names → Game names
const TYPE_MAPPING = {
  'fire': 'Red',
  'water': 'Lager',
  'grass': 'Ipa',
  'electric': 'Sour',
  'ice': 'Cryo',
  'fighting': 'Barleywine',
  'poison': 'Brett',
  'ground': 'Brown',
  'flying': 'Wheat',
  'psychic': 'Belgian',
  'bug': 'Saison',
  'rock': 'Barrel-aged',
  'ghost': 'Seltzer',
  'dragon': 'Stout',
  'dark': 'Cascadian',
  'steel': 'Export',
  'fairy': 'Pastry',
  'normal': 'Blonde',
};

function mapPokeAPIType(type) {
  return TYPE_MAPPING[type.toLowerCase()] || type;
}

function getTypeEffectiveness(attackType, defenderTypes) {
  let mult = 1;
  for (const dt of defenderTypes) {
    const cap = dt.charAt(0).toUpperCase() + dt.slice(1).toLowerCase();
    const atCap = attackType.charAt(0).toUpperCase() + attackType.slice(1).toLowerCase();
    if (TYPE_CHART[atCap] && TYPE_CHART[atCap][cap] !== undefined) {
      mult *= TYPE_CHART[atCap][cap];
    }
  }
  return mult;
}

// PokeAPI type ID map for type icon sprites
const TYPE_IDS = {
  Blonde:1, Barleywine:2, Wheat:3, Brett:4, Brown:5, "Barrel-aged":6, Saison:7, Seltzer:8,
  Red:10, Lager:11, Ipa:12, Sour:13, Belgian:14, Cryo:15, Stout:16,
};

// Move pools by type — each has physical/special arrays of [tier0, tier1, tier2]
// Tier 0: weak early moves (~40–55 power), Tier 1: standard moves (~75–100), Tier 2: powerful moves (~110–130)
const MOVE_POOL = {
  Blonde:        { physical: [{name:'Well-Balanced Flavor',    power:40,  desc:'A reliable, approachable strike with no rough edges.'},
                               {name:'Balanced Body',           power:80,  desc:'A fuller, more confident mouthfeel from a refined grain bill.'},
                               {name:'Session Mastery',         power:120, desc:'A deceptively powerful hit — all substance, no fluff.'}],
                   special:  [{name:'Light Malty Aroma',        power:45,  desc:'A gentle, sweet scent of pale grains.'},
                               {name:'Bready Bouquet',          power:90,  desc:'A richer, more complex grain aroma from a longer mash.'},
                               {name:'Imperial Nose',           power:130, desc:'An overwhelming wave of sweet malt that fills the room.'}] },

  Red:           { physical: [{name:'Maillard Hit',             power:40,  desc:'A light, bready impact from lightly toasted malt.'},
                               {name:'Crystal Malt Crush',      power:75,  desc:'A deeper, caramel-forward strike from specialty grain.'},
                               {name:'Roast Charge',            power:120, desc:'A full roast assault — rich, dark, and unrelenting.'}],
                   special:  [{name:'Caramel Wisp',             power:50,  desc:'A faint, sweet scent of lightly kilned malt.'},
                               {name:'Caramelized Nose',        power:90,  desc:'Rich notes of burnt sugar and toffee.'},
                               {name:'Toffee Bomb',             power:120, desc:'An intense dark-sugar aroma that hits before you even lift the glass.'}] },

  Lager:         { physical: [{name:'Crisp Snap',               power:40,  desc:'A light, quick-finishing strike with clean attenuation.'},
                               {name:'Cold Conditioning Blow',  power:80,  desc:'A firm, lagered strike with zero off-flavors.'},
                               {name:'Lagered to Perfection',   power:120, desc:'A devastating clean-lager hit — weeks of conditioning behind it.'}],
                   special:  [{name:'Delicate Hop Scent',        power:45,  desc:'A faint, fresh aroma of noble hops.'},
                               {name:'Noble Hop Scent',         power:90,  desc:'A classic, floral, and herbal aroma from traditional European hops.'},
                               {name:'Saaz Surge',              power:110, desc:'An assertive, spicy noble-hop blast from dry-hopping at lager temps.'}] },

  Sour:          { physical: [{name:'Pucker Punch',             power:40,  desc:'A small, sharp strike of citric acidity.'},
                               {name:'Acid Spike',              power:80,  desc:'A bold, lactic strike that cuts right through.'},
                               {name:'Kettle Sour Assault',     power:120, desc:'A scorching, pH-dropping hit from an overnight souring tank.'}],
                   special:  [{name:'Tart Wisp',                power:45,  desc:'A faint prickle of acidity on the nose.'},
                               {name:'Tart Vapor',              power:90,  desc:'An effervescent, sharp scent that tickles the nose.'},
                               {name:'Wild Ferment Blast',      power:110, desc:'A complex cloud of lactic, acetic, and funky acids all at once.'}] },

  Ipa:           { physical: [{name:'Resinous Bite',            power:45,  desc:'A sticky, piney nip of alpha acids.'},
                               {name:'Lupulin Slam',            power:80,  desc:'A heavy resin-forward strike from high-alpha hop additions.'},
                               {name:'Double Dry Hop Crush',    power:120, desc:'An overwhelming hop-matter hit from a massive late-addition charge.'}],
                   special:  [{name:'Fresh Hop Scent',          power:50,  desc:'A bright, grassy aroma from first-run whole-cone hops.'},
                               {name:'Dry Hop Bomb',            power:90,  desc:'An explosive late-addition nose of citrus and pine.'},
                               {name:'Hazy Cloud',              power:120, desc:'A saturating, juice-forward aromatic surge from biotransformed hops.'}] },

  Cryo:          { physical: [{name:'Cold Strike',              power:40,  desc:'A clean, crisp hit from a well-chilled bright tank.'},
                               {name:'Zero-Sulfur Snap',        power:80,  desc:'A flawlessly clean hit that proves the lager fermentation was perfect.'},
                               {name:'Cryogenic Finish',        power:120, desc:'An ice-cold, spotless blow from a beer that spent months at near-freezing temps.'}],
                   special:  [{name:'Lupulin Chill',            power:45,  desc:'A delicate, concentrated hop aroma from early cryo additions.'},
                               {name:'Frigid Lupulin',          power:90,  desc:'A sharp, herbal scent of concentrated hop oils.'},
                               {name:'Cryo Bomb',               power:110, desc:'A massive, pure-lupulin aromatic detonation from cryo pellet dry hopping.'}] },

  Barleywine:    { physical: [{name:'Warming Sip',              power:50,  desc:'A gentle burn of residual alcohol on the palate.'},
                               {name:'Warming Aftertaste',      power:100, desc:'A luxurious mouthfeel that coats the palate completely.'},
                               {name:'Barleywine Bludgeon',     power:130, desc:'A massive, viscous, high-ABV haymaker that staggers the senses.'}],
                   special:  [{name:'Caramel Hint',             power:45,  desc:'A faint sweetness from high residual sugars.'},
                               {name:'Muscovado Nose',          power:80,  desc:'A rich, dark, unrefined sugar scent that suggests a massive original gravity.'},
                               {name:'Spirit-Forward Surge',    power:110, desc:'An almost wine-like aromatic wall of dark fruit and alcohol.'}] },

  Brett:         { physical: [{name:'Light Dryness',            power:40,  desc:'A gentle dryness from partial brett attenuation.'},
                               {name:'Rustic Dryness',          power:80,  desc:'A bone-dry finish from brett eating every last sugar.'},
                               {name:'Total Attenuation',       power:123, desc:'A devastating, desiccating blow — brett has consumed everything.'}],
                   special:  [{name:'Barnyard Hint',            power:45,  desc:'A faint whiff of brett character just beginning to develop.'},
                               {name:'Barnyard Bouquet',        power:90,  desc:'The classic, prized horse-blanket and hay-like aroma.'},
                               {name:'Funky Flood',             power:110, desc:'An overwhelming brett bomb — leather, earth, and tropical fruit colliding at once.'}] },

  Brown:         { physical: [{name:'Biscuit Nip',              power:45,  desc:'A light, toasty malt snap on the front palate.'},
                               {name:'Biscuity Balance',        power:85,  desc:'A toasted bread strike that proves the base malt was high-quality.'},
                               {name:'Full Mash Wallop',        power:120, desc:'A dense, complex malt hit from a protein-rich, multi-step mash.'}],
                   special:  [{name:'Mild Nutty Note',          power:45,  desc:'A faint roasted nut character from lightly kilned brown malt.'},
                               {name:'Nutty Nose',              power:90,  desc:'A classic, warm scent of toasted nutty malt.'},
                               {name:'Brown Malt Blast',        power:110, desc:'A deep, roasty-nutty aromatic surge from a heavy specialty malt bill.'}] },

  Wheat:         { physical: [{name:'Soft Touch',               power:42,  desc:'A delicate, pillowy mouthfeel from high wheat content.'},
                               {name:'Fluffy Strike',           power:82,  desc:'A soft, pillowy mouthfeel that feels light and airy on the palate.'},
                               {name:'Protein Haze Hammer',     power:122, desc:'A thick, cloud-dense, wheat-forward hit from an unfiltered, high-adjunct grain bill.'}],
                   special:  [{name:'Clove Whisper',            power:45,  desc:'A faint clove note from a low-temp wheat ale fermentation.'},
                               {name:'Phenolic Spice',          power:90,  desc:'A sharp clove and banana nose that proves a traditional yeast strain was used.'},
                               {name:'Hefeweizen Hurricane',    power:120, desc:'An explosive ester-and-phenol aromatic storm from an open fermentation.'}] },

  Belgian:       { physical: [{name:'Gentle Fizz',              power:40,  desc:'A light, prickling carbonation on the front of the tongue.'},
                               {name:'Sneaky ABV Slam',         power:80,  desc:'A powerful yet sneaky hit that stays smooth on the palate.'},
                               {name:'Tripel Takedown',         power:120, desc:'A deceptively elegant but devastating high-gravity blow.'}],
                   special:  [{name:'Ester Hint',               power:45,  desc:'A faint, fruity nose from a warm Belgian fermentation start.'},
                               {name:'Bohemian Esters',         power:90,  desc:'A fruity nose that suggests a high-temperature fermentation.'},
                               {name:'Belgian Funk Surge',      power:120, desc:'An all-out ester and phenol eruption from an unconstrained Belgian yeast.'}] },

  Saison:        { physical: [{name:'Grain Graze',              power:40,  desc:'A light, rustic mouthfeel from unmalted adjunct grains.'},
                               {name:'Rustic Grain Hit',        power:80,  desc:'A textured strike from spelt, rye, or unmalted wheat.'},
                               {name:'Farmhouse Fury',          power:120, desc:'A full-force rustic blow from a high-gravity, bottle-conditioned saison.'}],
                   special:  [{name:'Field Bloom',              power:45,  desc:'A faint, floral note from low-hopped farmhouse fermentation.'},
                               {name:'Orchard Bloom',          power:90,  desc:'Sweet, rustic scents of pear, apple, and lemon zest.'},
                               {name:'Wild Orchard Storm',      power:110, desc:'A volatile, complex fruit-and-spice aromatic explosion from a high-temp saison finish.'}] },

  "Barrel-aged": { physical: [{name:'Light Oak Touch',          power:40,  desc:'A subtle hint of wood tannin from a short barrel rest.'},
                               {name:'Vanilla Velvet',          power:80,  desc:'A smooth, coating mouthfeel from long-term vanillin extraction.'},
                               {name:'Oak Obliteration',        power:122, desc:'A massive, structured tannin blow from a fully integrated, long-aged barrel beer.'}],
                   special:  [{name:'Spirit Whisper',           power:45,  desc:'A faint background note of the spirit that once filled the barrel.'},
                               {name:'Spirit-Soaked Nose',      power:80,  desc:'Bold aromatics of bourbon, rye, or rum pulled from the staves.'},
                               {name:'Barrel Bomb',             power:110, desc:'An overwhelming aromatic convergence of wood, spirit, and aged beer.'}] },

  Seltzer:       { physical: [{name:'Light Fizz',               power:40,  desc:'A prickling, effervescent hit with no residual sweetness.'},
                               {name:'Crystalline Strike',      power:75,  desc:'A clear, transparent impact with no lingering sweetness.'},
                               {name:'Force Carbonation Blast', power:120, desc:'A pressurized, ultra-carbonated strike force-carbed to maximum volume.'}],
                   special:  [{name:'CO2 Wisp',                 power:45,  desc:'A faint, clean carbonic bite on the nose.'},
                               {name:'Effervescent Vapor',      power:90,  desc:'A sharp, prickly aroma carried purely by carbonation.'},
                               {name:'Flavor-Neutral Surge',    power:110, desc:'A clean, pure aromatic burst that proves the base spirit was truly neutral.'}] },

  Stout:         { physical: [{name:'Dark Malt Tap',            power:45,  desc:'A light roast note from a modest charge of black patent malt.'},
                               {name:'Obsidian Structure',      power:85,  desc:'A firm, unbreakable mouthfeel that carries the roasted flavors.'},
                               {name:'Nitro Surge',             power:120, desc:'A cascading, nitrogen-driven tidal wave of roasted grain and creamy body.'}],
                   special:  [{name:'Roast Hint',               power:45,  desc:'A faint coffee note from a small roasted barley addition.'},
                               {name:'Midnight Roast',          power:90,  desc:'A deep aroma of coffee beans and dark cocoa.'},
                               {name:'Imperial Darkness',       power:120, desc:'A crushing, high-gravity aromatic onslaught of espresso, dark chocolate, and molasses.'}] },

  Export:        { physical: [{name:'Clean Bitter Nip',         power:40,  desc:'A light, crisp bitterness from a modest hopping rate.'},
                               {name:'Clean Bitter Finish',     power:83,  desc:'A precise, pointed bitterness that lingers just long enough to refresh.'},
                               {name:'Export Assault',          power:120, desc:'A formidable, high-bitterness broadside from an aggressively hopped export lager.'}],
                   special:  [{name:'Green Note',               power:40,  desc:'A faint aroma suggesting the hops were added early and survived.'},
                               {name:'Skunky Nose',             power:80,  desc:'A powerful dank aroma from green or clear bottles.'},
                               {name:'Isohumulone Flood',       power:110, desc:'A stunning wall of iso-alpha acid aroma — raw, polarizing, unforgettable.'}] },

  Pastry:        { physical: [{name:'Soft Sweetness',           power:45,  desc:'A gentle residual sugar coating on the front palate.'},
                               {name:'Lactose Hug',             power:90,  desc:'A massive, viscous sensation that feels like drinking a melted milkshake.'},
                               {name:'Milkshake Mauling',       power:130, desc:'An absurdly thick, lactose-and-adjunct impact that hits like dessert at full gravity.'}],
                   special:  [{name:'Vanilla Hint',             power:45,  desc:'A faint extract note from a light vanilla addition.'},
                               {name:"Confectioner's Extract",  power:95,  desc:'A bright sugary nose that mimics the icing on a donut.'},
                               {name:'Sugar Rush Surge',        power:120, desc:'An overwhelming adjunct aromatic blast of vanilla, coconut, and peanut butter.'}] },

  Cascadian:     { physical: [{name:'Dark Base Touch',          power:40,  desc:'A subtle roast note that barely hints at the black malt underneath.'},
                               {name:'Light-Absorbing Body',    power:80,  desc:'A medium-light mouthfeel that defies the visual expectation of a heavy dark beer.'},
                               {name:'Black IPA Broadside',     power:120, desc:'A punishing dual-threat blow — roasted malt body with a hop-forward finish.'}],
                   special:  [{name:'Dehusked Grain Wisp',      power:40,  desc:'A subtle, smooth roast note from dehusked Carafa.'},
                               {name:'Dehusked Grain Whiff',    power:80,  desc:'A smooth, subtle roast aroma that lacks any burnt or acrid notes.'},
                               {name:'Dark Hop Fusion',         power:110, desc:'An aromatic collision of dark malt and assertive Pacific Northwest hops.'}] },
};

// Returns the move tier for wild encounters based on map index.
// Maps 0-2: tier 0 (weak), maps 3-6: tier 1 (standard), maps 7-8: tier 2 (powerful).
function getMoveTierForMap(mapIndex) {
  if (mapIndex <= 2) return 0;
  if (mapIndex <= 6) return 1;
  return 2;
}

function getBestMove(types, baseStats, speciesId, moveTier = 1) {
  if (speciesId === 129) return { name: 'Splash',   power: 0, type: 'Blonde', isSpecial: false, noDamage: true };
  if (speciesId === 63)  return { name: 'Run Away', power: 0, type: 'Blonde', isSpecial: false, noDamage: true };
  const isSpecial = (baseStats?.special || 0) >= (baseStats?.atk || 0);
  const tier = Math.max(0, Math.min(2, moveTier ?? 1));
  // Check all types and pick the highest-power move at this tier (preserves dual-type best-pick logic)
  let best = null;
  for (const t of types) {
    const cap = t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
    if (MOVE_POOL[cap]) {
      const move = isSpecial ? MOVE_POOL[cap].special[tier] : MOVE_POOL[cap].physical[tier];
      if (move && (!best || move.power > best.power)) {
        best = { ...move, type: cap, isSpecial };
      }
    }
  }
  return best || { name: 'Standard Pour', power: 40, type: 'Blonde', isSpecial: false };
}

// Gym leader teams (hardcoded)
const GYM_LEADERS = [
  {
    name: 'Brock', badge: 'Boulder Badge', type: '"Barrel-aged"',
    team: [
      { speciesId: 74, name: 'Geodude', types: ['"Barrel-aged"','Brown'], baseStats: { hp:40,atk:80,def:100,speed:20,special:30 }, level: 12 },
      { speciesId: 95, name: 'Onix',    types: ['"Barrel-aged"','Brown'], baseStats: { hp:35,atk:45,def:160,speed:70,special:30 }, level: 14 },
    ]
  },
  {
    name: 'Misty', badge: 'Cascade Badge', type: 'Lager',
    team: [
      { speciesId: 120, name: 'Staryu',  types: ['Lager'], baseStats: { hp:30,atk:45,def:55,speed:85,special:70 }, level: 18 },
      { speciesId: 121, name: 'Starmie', types: ['Lager','Belgian'], baseStats: { hp:60,atk:75,def:85,speed:115,special:100 }, level: 21 },
    ]
  },
  {
    name: 'Lt. Surge', badge: 'Thunder Badge', type: 'Sour',
    team: [
      { speciesId: 25,  name: 'Pikachu',  types: ['Sour'], baseStats: { hp:35,atk:55,def:40,speed:90,special:50 }, level: 18 },
      { speciesId: 100, name: 'Voltorb',  types: ['Sour'], baseStats: { hp:40,atk:30,def:50,speed:100,special:55 }, level: 21 },
      { speciesId: 26,  name: 'Raichu',   types: ['Sour'], baseStats: { hp:60,atk:90,def:55,speed:110,special:90 }, level: 24 },
    ]
  },
  {
    name: 'Erika', badge: 'Rainbow Badge', type: 'Ipa',
    team: [
      { speciesId: 114, name: 'Tangela',     types: ['Ipa'], baseStats: { hp:65,atk:55,def:115,speed:60,special:100 }, level: 24 },
      { speciesId: 71,  name: 'Victreebel',  types: ['Ipa','Brett'], baseStats: { hp:80,atk:105,def:65,speed:70,special:100 }, level: 29 },
      { speciesId: 45,  name: 'Vileplume',   types: ['Ipa','Brett'], baseStats: { hp:75,atk:80,def:85,speed:50,special:110 }, level: 29 },
    ]
  },
  {
    name: 'Koga', badge: 'Soul Badge', type: 'Brett',
    team: [
      { speciesId: 109, name: 'Koffing',  types: ['Brett'], baseStats: { hp:40,atk:65,def:95,speed:35,special:60 }, level: 37 },
      { speciesId: 109, name: 'Koffing',  types: ['Brett'], baseStats: { hp:40,atk:65,def:95,speed:35,special:60 }, level: 37 },
      { speciesId: 89,  name: 'Muk',      types: ['Brett'], baseStats: { hp:105,atk:105,def:75,speed:50,special:65 }, level: 39 },
      { speciesId: 110, name: 'Weezing',  types: ['Brett'], baseStats: { hp:65,atk:90,def:120,speed:60,special:85 }, level: 43 },
    ]
  },
  {
    name: 'Sabrina', badge: 'Marsh Badge', type: 'Belgian',
    team: [
      { speciesId: 122, name: 'Mr. Mime', types: ['Belgian'], baseStats: { hp:40,atk:45,def:65,speed:90,special:100 }, level: 37, heldItems: [{ id: 'twisted_spoon', name: 'Candi Sugar', icon: '🍬' }] },
      { speciesId: 49,  name: 'Venomoth', types: ['Saison','Brett'], baseStats: { hp:70,atk:65,def:60,speed:90,special:90 }, level: 38, heldItems: [{ id: 'silver_powder', name: 'Warm Temps', icon: '🌡️' }] },
      { speciesId: 64,  name: 'Kadabra',  types: ['Belgian'], baseStats: { hp:40,atk:35,def:30,speed:105,special:120 }, level: 38, heldItems: [{ id: 'eviolite', name: 'WIP Recipe', icon: '📋' }] },
      { speciesId: 65,  name: 'Alakazam', types: ['Belgian'], baseStats: { hp:55,atk:50,def:45,speed:120,special:135 }, level: 43, heldItems: [{ id: 'scope_lens', name: 'Centrifuge', icon: '🔬' }] },
    ]
  },
  {
    name: 'Blaine', badge: 'Volcano Badge', type: 'Red',
    team: [
      { speciesId: 77,  name: 'Ponyta',   types: ['Red'], baseStats: { hp:50,atk:85,def:55,speed:90,special:65 }, level: 40, heldItems: [{ id: 'charcoal', name: 'Crystal Malt', icon: '🍂' }] },
      { speciesId: 58,  name: 'Growlithe',types: ['Red'], baseStats: { hp:55,atk:70,def:45,speed:60,special:50 }, level: 42, heldItems: [{ id: 'eviolite', name: 'WIP Recipe', icon: '📋' }] },
      { speciesId: 78,  name: 'Rapidash', types: ['Red'], baseStats: { hp:65,atk:100,def:70,speed:105,special:80 }, level: 42, heldItems: [{ id: 'charcoal', name: 'Crystal Malt', icon: '🍂' }] },
      { speciesId: 59,  name: 'Arcanine', types: ['Red'], baseStats: { hp:90,atk:110,def:80,speed:95,special:100 }, level: 47, heldItems: [{ id: 'life_orb', name: 'Banquet Beer Stash', icon: '🍻' }] },
    ]
  },
  {
    name: 'Giovanni', badge: 'Earth Badge', type: 'Brown',
    team: [
      { speciesId: 51,  name: 'Dugtrio',  types: ['Brown'], baseStats: { hp:35,atk:100,def:50,speed:120,special:50 }, level: 42, heldItems: [{ id: 'soft_sand', name: 'Biscuit Malt', icon: '🍞' }] },
      { speciesId: 31,  name: 'Nidoqueen',types: ['Brett','Brown'], baseStats: { hp:90,atk:82,def:87,speed:76,special:75 }, level: 44, heldItems: [{ id: 'brett_barb', name: 'Funky Dregs', icon: '🦠' }] },
      { speciesId: 34,  name: 'Nidoking', types: ['Brett','Brown'], baseStats: { hp:81,atk:92,def:77,speed:85,special:75 }, level: 45, heldItems: [{ id: 'soft_sand', name: 'Biscuit Malt', icon: '🍞' }] },
      { speciesId: 111, name: 'Rhyhorn',  types: ['Brown','"Barrel-aged"'], baseStats: { hp:80,atk:85,def:95,speed:25,special:30 }, level: 45, heldItems: [{ id: 'hard_stone', name: 'Specialty Barrel', icon: '🛢️' }] },
      { speciesId: 112, name: 'Rhydon',   types: ['Brown','"Barrel-aged"'], baseStats: { hp:105,atk:130,def:120,speed:40,special:45 }, level: 50, heldItems: [{ id: '"barrel-aged"_helmet', name: 'Steel Jacket', icon: '🧥' }] },
    ]
  },
];

const ELITE_4 = [
  {
    name: 'Lorelei', title: 'Elite Four', type: 'Cryo',
    team: [
      { speciesId: 87,  name: 'Dewgong',   types: ['Lager','Cryo'], baseStats: { hp:90,atk:70,def:80,speed:70,special:95 }, level: 54, heldItems: [{ id: 'mystic_lager', name: 'Noble Hops', icon: '🌿' }] },
      { speciesId: 91,  name: 'Cloyster',  types: ['Lager','Cryo'], baseStats: { hp:50,atk:95,def:180,speed:70,special:85 }, level: 53, heldItems: [{ id: '"barrel-aged"_helmet', name: 'Steel Jacket', icon: '🧥' }] },
      { speciesId: 80,  name: 'Slowbro',   types: ['Lager','Belgian'], baseStats: { hp:95,atk:75,def:110,speed:30,special:100 }, level: 54, heldItems: [{ id: 'leftovers', name: 'Yeast Nutrient', icon: '🧫' }] },
      { speciesId: 124, name: 'Jynx',      types: ['Cryo','Belgian'], baseStats: { hp:65,atk:50,def:35,speed:95,special:95 }, level: 56, heldItems: [{ id: 'wise_glasses', name: 'Sensory Class', icon: '🌀' }] },
      { speciesId: 131, name: 'Lapras',    types: ['Lager','Cryo'], baseStats: { hp:130,atk:85,def:80,speed:60,special:95 }, level: 56, heldItems: [{ id: 'shell_bell', name: 'Closed Loop', icon: '🔄' }] },
    ]
  },
  {
    name: 'Bruno', title: 'Elite Four', type: 'Barleywine',
    team: [
      { speciesId: 95,  name: 'Onix',      types: ['"Barrel-aged"','Brown'], baseStats: { hp:35,atk:45,def:160,speed:70,special:30 }, level: 53, heldItems: [{ id: '"barrel-aged"_helmet', name: 'Steel Jacket', icon: '🧥' }] },
      { speciesId: 107, name: 'Hitmonchan',types: ['Barleywine'], baseStats: { hp:50,atk:105,def:79,speed:76,special:35 }, level: 55, heldItems: [{ id: 'black_belt', name: 'Extra Long Boil', icon: '🔥' }] },
      { speciesId: 106, name: 'Hitmonlee', types: ['Barleywine'], baseStats: { hp:50,atk:120,def:53,speed:87,special:35 }, level: 55, heldItems: [{ id: 'muscle_band', name: 'Grain Mill', icon: '⚙️' }] },
      { speciesId: 95,  name: 'Onix',      types: ['"Barrel-aged"','Brown'], baseStats: { hp:35,atk:45,def:160,speed:70,special:30 }, level: 54, heldItems: [{ id: 'hard_stone', name: 'Specialty Barrel', icon: '🛢️' }] },
      { speciesId: 68,  name: 'Machamp',   types: ['Barleywine'], baseStats: { hp:90,atk:130,def:80,speed:55,special:65 }, level: 58, heldItems: [{ id: 'choice_band', name: 'European Malt', icon: '🌾' }] },
    ]
  },
  {
    name: 'Agatha', title: 'Elite Four', type: 'Seltzer',
    team: [
      { speciesId: 94,  name: 'Gengar',    types: ['Seltzer','Brett'], baseStats: { hp:60,atk:65,def:60,speed:110,special:130 }, level: 54, heldItems: [{ id: 'spell_tag', name: 'Carbon Filter', icon: '⬛' }] },
      { speciesId: 42,  name: 'Golbat',    types: ['Brett','Wheat'], baseStats: { hp:75,atk:80,def:70,speed:90,special:75 }, level: 54, heldItems: [{ id: 'brett_barb', name: 'Funky Dregs', icon: '🦠' }] },
      { speciesId: 93,  name: 'Haunter',   types: ['Seltzer','Brett'], baseStats: { hp:45,atk:50,def:45,speed:95,special:115 }, level: 56, heldItems: [{ id: 'life_orb', name: 'Banquet Beer Stash', icon: '🍻' }] },
      { speciesId: 42,  name: 'Golbat',    types: ['Brett','Wheat'], baseStats: { hp:75,atk:80,def:70,speed:90,special:75 }, level: 56, heldItems: [{ id: 'sharp_beak', name: 'Bitter Orange Peel', icon: '🍊' }] },
      { speciesId: 94,  name: 'Gengar',    types: ['Seltzer','Brett'], baseStats: { hp:60,atk:65,def:60,speed:110,special:130 }, level: 58, heldItems: [{ id: 'scope_lens', name: 'Centrifuge', icon: '🔬' }] },
    ]
  },
  {
    name: 'Lance', title: 'Elite Four', type: 'Stout',
    team: [
      { speciesId: 130, name: 'Gyarados',  types: ['Lager','Wheat'], baseStats: { hp:95,atk:125,def:79,speed:81,special:100 }, level: 56, heldItems: [{ id: 'mystic_lager', name: 'Noble Hops', icon: '🌿' }] },
      { speciesId: 149, name: 'Stoutite', types: ['Stout','Wheat'], baseStats: { hp:91,atk:134,def:95,speed:80,special:100 }, level: 56, heldItems: [{ id: 'stout_fang', name: 'Double Mash', icon: '🫕' }] },
      { speciesId: 148, name: 'Stoutair', types: ['Stout'], baseStats: { hp:61,atk:84,def:65,speed:70,special:70 }, level: 58, heldItems: [{ id: 'eviolite', name: 'WIP Recipe', icon: '📋' }] },
      { speciesId: 148, name: 'Stoutair', types: ['Stout'], baseStats: { hp:61,atk:84,def:65,speed:70,special:70 }, level: 60, heldItems: [{ id: 'stout_fang', name: 'Double Mash', icon: '🫕' }] },
      { speciesId: 149, name: 'Stoutite', types: ['Stout','Wheat'], baseStats: { hp:91,atk:134,def:95,speed:80,special:100 }, level: 62, heldItems: [{ id: 'choice_band', name: 'European Malt', icon: '🌾' }] },
    ]
  },
  {
    name: 'Gary', title: 'Champion', type: 'Mixed',
    team: [
      { speciesId: 18,  name: 'Pidgeot',   types: ['Blonde','Wheat'], baseStats: { hp:83,atk:80,def:75,speed:101,special:70 }, level: 61, heldItems: [{ id: 'sharp_beak', name: 'Bitter Orange Peel', icon: '🍊' }] },
      { speciesId: 65,  name: 'Alakazam',  types: ['Belgian'], baseStats: { hp:55,atk:50,def:45,speed:120,special:135 }, level: 59, heldItems: [{ id: 'twisted_spoon', name: 'Candi Sugar', icon: '🍬' }] },
      { speciesId: 112, name: 'Rhydon',    types: ['Brown','"Barrel-aged"'], baseStats: { hp:105,atk:130,def:120,speed:40,special:45 }, level: 61, heldItems: [{ id: 'soft_sand', name: 'Biscuit Malt', icon: '🍞' }] },
      { speciesId: 103, name: 'Exeggutor', types: ['Ipa','Belgian'], baseStats: { hp:95,atk:95,def:85,speed:55,special:125 }, level: 61, heldItems: [{ id: 'miracle_seed', name: 'Double Dry Hop', icon: '🍃' }] },
      { speciesId: 6,   name: 'Charizard', types: ['Red','Wheat'], baseStats: { hp:78,atk:84,def:78,speed:100,special:109 }, level: 65, heldItems: [{ id: 'charcoal', name: 'Crystal Malt', icon: '🍂' }] },
    ]
  },
];

// Item pool
const ITEM_POOL = [
  // ── XP & levelling ───────────────────────────────────────────────────────
  { id: 'lucky_egg',          name: 'Previous Batch Notes', desc: '+3 levels per win instead of +2',                                    icon: '📓', minMap: 4 },
  // ── Universal damage boosters ─────────────────────────────────────────────
  { id: 'life_orb',           name: 'Banquet Beer Stash',   desc: '+30% damage; holder loses 10% max HP per hit',                        icon: '🍻' },
  { id: 'choice_band',        name: 'European Malt',        desc: '+30% flavor damage; holder takes +30% more aroma damage',             icon: '🌾' },
  { id: 'choice_specs',       name: 'Hop Oils',             desc: '+30% aroma damage; holder takes +30% more flavor damage',             icon: '🫙' },
  { id: 'muscle_band',        name: 'Grain Mill',           desc: '+20% flavor damage',                                                  icon: '⚙️' },
  { id: 'wise_glasses',       name: 'Sensory Class',        desc: '+20% aroma damage',                                                   icon: '🌀' },
  { id: 'adaptability_band',  name: 'House Yeast',          desc: '+50% damage if your team has ≤2 different types',                     icon: '🧬' },
  { id: 'scope_lens',         name: 'Centrifuge',           desc: 'Double crit chance (12.5%); normal 1.5x crit damage',                 icon: '🔬' },
  { id: 'razor_claw',         name: 'C-Box',                desc: 'Normal crit chance; crits deal 3x damage instead of 1.5x',            icon: '📦' },
  { id: 'hop_extract',        name: 'Hop Extract',          desc: '+20% damage dealt; take 20% of damage dealt as recoil',               icon: '🌿' },
  { id: 'oak_barrel',         name: 'Oak Barrel',           desc: '-20% damage taken; -20% speed',                                       icon: '🛢️' },
  { id: 'late_lunch',         name: 'Late Lunch',           desc: 'Always goes last; +50% damage',                                       icon: '🍱', minMap: 3 },
  { id: 'overcarbonated',     name: 'Overcarbonated',       desc: 'First hit deals 2x damage, then lose 50% current HP (min 10% max HP)', icon: '💥' },
  { id: 'pasteurization',     name: 'Pasteurization',       desc: '+100% damage; holder can never gain levels',                          icon: '🧪', minMap: 4 },
  // ── Defensive & battle-effect ─────────────────────────────────────────────
  { id: '"barrel-aged"_helmet', name: 'Steel Jacket',       desc: 'Attacker takes 15% of their max HP on each hit',                      icon: '🧥' },
  { id: 'shell_bell',         name: 'Closed Transfer Loop', desc: 'Heal 20% of damage dealt',                                            icon: '🔄' },
  { id: 'eviolite',           name: 'WIP Recipe',           desc: '+50% DEF & Sp.Def if holder is not fully evolved',                    icon: '📋' },
  { id: 'assault_vest',       name: 'Thermal Insulation',   desc: '+40% DEF & Sp.Def',                                                   icon: '🧊' },
  { id: 'choice_scarf',       name: 'Powerful Pump',        desc: '+50% Speed, -25% ATK',                                               icon: '💨' },
  { id: 'leftovers',          name: 'Yeast Nutrient',       desc: 'Restore 6% max HP per turn',                                          icon: '🧫' },
  { id: 'expert_belt',        name: 'Gold Medal',           desc: '+20% damage on super effective hits',                                  icon: '🏅' },
  { id: 'focus_band',         name: 'Steel Toe Boots',      desc: '15% chance to survive a KO with 1 HP',                               icon: '🥾' },
  { id: 'air_balloon',        name: 'CO2 Purge',            desc: 'Immune to Brown-type moves',                                          icon: '💨' },
  // ── Team-wide ─────────────────────────────────────────────────────────────
  { id: 'pizza_party',        name: 'Pizza Party',          desc: 'After every battle, the whole team heals 5% max HP (stackable)',      icon: '🍕', stackable: true },
  { id: 'edible_glitter',     name: 'Edible Glitter',       desc: '+5% shiny encounter chance per holder (stackable)',                   icon: '✨', stackable: true },
  // ── Type-boosting items (all 18 types) — 40% boost ────────────────────────
  { id: 'silk_scarf',         name: 'Pale Malt',            desc: '+40% Blonde flavor/aroma damage',                                     icon: '🌾' },
  { id: 'charcoal',           name: 'Crystal Malt',         desc: '+40% Red flavor/aroma damage',                                        icon: '🍂' },
  { id: 'mystic_lager',       name: 'Noble Hops',           desc: '+40% Lager flavor/aroma damage',                                      icon: '🌿' },
  { id: 'magnet',             name: 'Sourvisiae',           desc: '+40% Sour flavor/aroma damage',                                       icon: '🧪', minMap: 4 },
  { id: 'miracle_seed',       name: 'Double Dry Hop',       desc: '+40% IPA flavor/aroma damage',                                        icon: '🍃' },
  { id: 'hop_kief',           name: 'Hop Kief',             desc: '+40% Cryo flavor/aroma damage',                                       icon: '❄️', minMap: 4 },
  { id: 'black_belt',         name: 'Extra Long Boil',      desc: '+40% Barleywine flavor/aroma damage',                                 icon: '🔥' },
  { id: 'brett_barb',         name: 'Funky Dregs',          desc: '+40% Brett flavor/aroma damage',                                      icon: '🦠', minMap: 4 },
  { id: 'soft_sand',          name: 'Biscuit Malt',         desc: '+40% Brown flavor/aroma damage',                                      icon: '🍞', minMap: 4 },
  { id: 'sharp_beak',         name: 'Bitter Orange Peel',   desc: '+40% Wheat flavor/aroma damage',                                      icon: '🍊' },
  { id: 'twisted_spoon',      name: 'Candi Sugar',          desc: '+40% Belgian flavor/aroma damage',                                    icon: '🍬', minMap: 4 },
  { id: 'silver_powder',      name: 'Warm Temps',           desc: '+40% Saison flavor/aroma damage',                                     icon: '🌡️', minMap: 4 },
  { id: 'hard_stone',         name: 'Specialty Barrel',     desc: '+40% Barrel-aged flavor/aroma damage',                                icon: '🛢️', minMap: 4 },
  { id: 'spell_tag',          name: 'Carbon Filter',        desc: '+40% Seltzer flavor/aroma damage',                                    icon: '⬛', minMap: 4 },
  { id: 'stout_fang',         name: 'Double Mash',          desc: '+40% Stout flavor/aroma damage',                                      icon: '🫕', minMap: 6 },
  { id: 'trade_agreement',    name: 'Trade Agreement',      desc: '+40% Export flavor/aroma damage',                                     icon: '🤝', minMap: 4 },
  { id: 'dehusked_malts',     name: 'Dehusked Malts',       desc: '+40% Cascadian flavor/aroma damage',                                  icon: '🖤', minMap: 4 },
  { id: 'marshmallow_fluff',  name: 'Marshmallow Fluff',    desc: '+40% Pastry flavor/aroma damage',                                     icon: '🍡', minMap: 4 },
];

const USABLE_ITEM_POOL = [
  { id: 'max_revive',  name: 'Fresh Pitch',       desc: 'Fully revives a fainted Pokémon',              icon: '🧬', usable: true },
  { id: 'rare_candy',  name: 'Instant Optimization',        desc: 'Gives a Pokémon +3 levels',                    icon: '🍬', usable: true },
  { id: 'evo_stone',   name: 'Style Shift',   desc: 'Force evolves a Pokémon regardless of level',  icon: '🌟', usable: true },
];

const TYPE_ITEM_MAP = {
  Blonde: 'silk_scarf',        Red: 'charcoal',          Lager: 'mystic_lager',
  Sour: 'magnet',              Ipa: 'miracle_seed',      Cryo: 'hop_kief',
  Barleywine: 'black_belt',    Brett: 'brett_barb',      Brown: 'soft_sand',
  Wheat: 'sharp_beak',         Belgian: 'twisted_spoon', Saison: 'silver_powder',
  'Barrel-aged': 'hard_stone', Seltzer: 'spell_tag',     Stout: 'stout_fang',
  Export: 'trade_agreement',   Cascadian: 'dehusked_malts', Pastry: 'marshmallow_fluff',
};

// Bust stale pokemon species cache entries missing the 'special' stat
(function bustStaleCache() {
  try {
    for (const key of Object.keys(localStorage)) {
      if (!key.startsWith('pkrl_poke_')) continue;
      const val = getCached(key);
      if (val && val.baseStats && (val.baseStats.special === undefined || val.baseStats.spdef === undefined)) {
        localStorage.removeItem(key);
      }
    }
  } catch {}
})();

// BST ranges per map
const MAP_BST_RANGES = [
  { min: 200, max: 310 },   // Map 1
  { min: 280, max: 360 },   // Map 2
  { min: 340, max: 420 },   // Map 3
  { min: 340, max: 420 },   // Map 4
  { min: 400, max: 480 },   // Map 5
  { min: 400, max: 480 },   // Map 6
  { min: 460, max: 530 },   // Map 7
  { min: 460, max: 530 },   // Map 8
  { min: 530, max: 999 },   // Final
];

const MAP_LEVEL_RANGES = [
  [2, 6], [8, 15], [15, 22], [22, 30],
  [30, 38], [38, 44], [44, 48], [48, 53], [54, 65]
];

// PokeAPI cache helpers
function getCached(key) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : null;
  } catch { return null; }
}

function setCached(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

function formatPokemonName(apiName) {
  const overrides = {
    'nidoran-m':   'Nidoran♂',
    'nidoran-f':   'Nidoran♀',
    'mr-mime':     'Mr. Mime',
    'farfetchd':   "Farfetch'd",
    'ho-oh':       'Ho-Oh',
    'mime-jr':     'Mime Jr.',
    'porygon-z':   'Porygon-Z',
    'jangmo-o':    'Jangmo-o',
    'hakamo-o':    'Hakamo-o',
    'kommo-o':     'Kommo-o',
    'mr-rime':     'Mr. Rime',
    'type-null':   'Type: Null',
  };
  if (overrides[apiName]) return overrides[apiName];
  // Capitalise each hyphen-separated word, then join with space
  return apiName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// getCatchChoices — delegates to species.js (getSpeciesForMap)
async function getCatchChoices(mapIndex) {
  return getSpeciesForMap(mapIndex);
}

function isPokedexComplete() {
  const dex = getPokedex();
  const caughtIds = new Set(Object.values(dex).filter(e => e.caught).map(e => e.id));
  for (const id of ALL_CATCHABLE_IDS) {
    if (!caughtIds.has(id)) return false;
  }
  return true;
}

function isBrewlogAt150() {
  const dex = getPokedex();
  const caught = Object.values(dex).filter(e => e.caught).length;
  return caught >= 150;
}

function calcHp(baseHp, level) {
  return Math.floor(baseHp * level / 50) + level + 10;
}

function createInstance(species, level, isShiny = false, moveTier = 1) {
  const lvl = level || 5;
  const maxHp = calcHp(species.baseStats.hp, lvl);
  const id = species.id ?? species.speciesId;
  const spriteUrl = isShiny
    ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${id}.png`
    : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
  return {
    speciesId: id,
    name: species.name,
    brewName: species.brewName || null,
    nickname: null,
    level: lvl,
    currentHp: maxHp,
    maxHp,
    isShiny,
    types: species.types,
    baseStats: species.baseStats,
    spriteUrl,
    megaStone: null,
    heldItems: [],
    moveTier: Math.max(0, Math.min(2, moveTier ?? 1)),
  };
}

// Starters
const STARTER_IDS = [1, 4, 7];

// Trainer sprites from Pokemon Showdown CDN
const TRAINER_SVG = {
  boy:  `<img src="https://play.pokemonshowdown.com/sprites/trainers/red.png"  alt="Red"  class="trainer-sprite-img" onerror="this.style.opacity='.3'">`,
  girl: `<img src="https://play.pokemonshowdown.com/sprites/trainers/dawn.png" alt="Dawn" class="trainer-sprite-img" onerror="this.style.opacity='.3'">`,
  npc:  `<img src="https://play.pokemonshowdown.com/sprites/trainers/youngster.png" alt="Trainer" class="trainer-sprite-img" onerror="this.style.opacity='.3'">`,
};

// Name overrides for Pokemon Showdown trainer sprite filenames
const SHOWDOWN_NAME_MAP = { 'gary': 'blue', 'lt. surge': 'lt-surge', 'lorelei': 'lorelei-gen1', 'agatha': 'agatha-gen1' };

function getTrainerImgHtml(trainerName) {
  const key = trainerName.toLowerCase();
  const slug = SHOWDOWN_NAME_MAP[key] || key.replace(/[.']/g, '').replace(/\s+/g, '-');
  return `<img src="https://play.pokemonshowdown.com/sprites/trainers/${slug}.png"
    alt="${trainerName}" class="trainer-sprite-img"
    onerror="this.src='https://play.pokemonshowdown.com/sprites/trainers/youngster.png';this.onerror=null">`;
}

// All Gen 1 evolutions — stone/trade converted to sensible levels
const EVOLUTIONS = {
  // Starters
  1:  { into: 2,   level: 16, name: 'Ivysaur' },
  2:  { into: 3,   level: 32, name: 'Venusaur' },
  4:  { into: 5,   level: 16, name: 'Charmeleon' },
  5:  { into: 6,   level: 36, name: 'Charizard' },
  7:  { into: 8,   level: 16, name: 'Wartortle' },
  8:  { into: 9,   level: 36, name: 'Blastoise' },
  // Saisons
  10: { into: 11,  level: 7,  name: 'Metapod' },
  11: { into: 12,  level: 10, name: 'Butterfree' },
  13: { into: 14,  level: 7,  name: 'Kakuna' },
  14: { into: 15,  level: 10, name: 'Beedrill' },
  // Birds / blondes
  16: { into: 17,  level: 18, name: 'Pidgeotto' },
  17: { into: 18,  level: 36, name: 'Pidgeot' },
  19: { into: 20,  level: 20, name: 'Raticate' },
  21: { into: 22,  level: 20, name: 'Fearow' },
  // Snakes / brown
  23: { into: 24,  level: 22, name: 'Arbok' },
  27: { into: 28,  level: 22, name: 'Sandslash' },
  // Nidos
  29: { into: 30,  level: 16, name: 'Nidorina' },
  30: { into: 31,  level: 36, name: 'Nidoqueen' },  // stone → lv 36
  32: { into: 33,  level: 16, name: 'Nidorino' },
  33: { into: 34,  level: 36, name: 'Nidoking' },   // stone → lv 36
  // Fairies / Ipa
  35: { into: 36,  level: 36, name: 'Clefable' },   // moon stone → lv 36
  37: { into: 38,  level: 32, name: 'Ninetales' },  // Red stone → lv 32
  39: { into: 40,  level: 36, name: 'Wigglytuff' }, // moon stone → lv 36
  // Zubat
  41: { into: 42,  level: 22, name: 'Golbat' },
  // Ipa
  43: { into: 44,  level: 21, name: 'Gloom' },
  44: { into: 45,  level: 36, name: 'Vileplume' },  // player gets to choose between Vileplume (45) and Bellossom (182) — see applyEvolution
  // Parasect / Venomoth
  46: { into: 47,  level: 24, name: 'Parasect' },
  48: { into: 49,  level: 31, name: 'Venomoth' },
  // Diglett / Meowth / Psyduck / Mankey
  50: { into: 51,  level: 26, name: 'Dugtrio' },
  52: { into: 53,  level: 28, name: 'Persian' },
  54: { into: 55,  level: 33, name: 'Golduck' },
  56: { into: 57,  level: 28, name: 'Primeape' },
  // Growlithe
  58: { into: 59,  level: 34, name: 'Arcanine' },   // Red stone → lv 34
  // Poliwag
  60: { into: 61,  level: 25, name: 'Poliwhirl' },
  61: { into: 62,  level: 40, name: 'Poliwrath' },  // player chooses Poliwrath (62) or Politoed (186) — see applyEvolution
  // Abra / Machop / Bellsprout
  63: { into: 64,  level: 16, name: 'Kadabra' },
  64: { into: 65,  level: 36, name: 'Alakazam' },   // trade → lv 36
  66: { into: 67,  level: 28, name: 'Machoke' },
  67: { into: 68,  level: 40, name: 'Machamp' },    // trade → lv 40
  69: { into: 70,  level: 21, name: 'Weepinbell' },
  70: { into: 71,  level: 36, name: 'Victreebel' }, // leaf stone → lv 36
  // Tentacool / Geodude / Ponyta
  72: { into: 73,  level: 30, name: 'Tentacruel' },
  74: { into: 75,  level: 25, name: 'Graveler' },
  75: { into: 76,  level: 40, name: 'Golem' },      // trade → lv 40
  77: { into: 78,  level: 40, name: 'Rapidash' },
  // Slowpoke / Magnemite / Doduo / Seel / Grimer
  79: { into: 80,  level: 37, name: 'Slowbro' },    // player chooses Slowbro (80) or Slowking (199) — see applyEvolution
  81: { into: 82,  level: 30, name: 'Magneton' },
  84: { into: 85,  level: 31, name: 'Dodrio' },
  86: { into: 87,  level: 34, name: 'Dewgong' },
  88: { into: 89,  level: 38, name: 'Muk' },
  // Shellder / Gastly / Onix / Drowzee / Krabby / Voltorb
  90: { into: 91,  level: 36, name: 'Cloyster' },   // lager stone → lv 36
  92: { into: 93,  level: 25, name: 'Haunter' },
  93: { into: 94,  level: 38, name: 'Gengar' },     // trade → lv 38
  95: { into: 208, level: 40, name: 'Steelix' },    // trade → lv 40 (Steelix #208)
  96: { into: 97,  level: 26, name: 'Hypno' },
  98: { into: 99,  level: 28, name: 'Kingler' },
  100:{ into: 101, level: 30, name: 'Electrode' },
  // Exeggcute / Cubone / Lickitung / Koffing / Rhyhorn
  102:{ into: 103, level: 36, name: 'Exeggutor' },  // leaf stone → lv 36
  104:{ into: 105, level: 28, name: 'Marowak' },
  109:{ into: 110, level: 35, name: 'Weezing' },
  111:{ into: 112, level: 42, name: 'Rhydon' },
  // Horsea / Goldeen / Staryu / Scyther / Electabuzz / Magmar / Pinsir
  116:{ into: 117, level: 32, name: 'Seadra' },
  118:{ into: 119, level: 33, name: 'Seaking' },
  120:{ into: 121, level: 36, name: 'Starmie' },    // lager stone → lv 36
  123:{ into: 212, level: 40, name: 'Scizor' },     // trade → lv 40 (Scizor #212)
  // Eevee — branching, handled separately
  // Omanyte / Kabuto / Aerodactyl (fossils — no evolution here)
  138:{ into: 139, level: 40, name: 'Omastar' },
  140:{ into: 141, level: 40, name: 'Kabutops' },
  // Dratini
  129:{ into: 130, level: 20, name: 'Gyarados' },
  147:{ into: 148, level: 30, name: 'Stoutair' },
  148:{ into: 149, level: 55, name: 'Stoutite' },

  // ── Gen 2 ──────────────────────────────────────────────────────────────
  // Johto starters
  152:{ into: 153, level: 16, name: 'Bayleef' },
  153:{ into: 154, level: 32, name: 'Meganium' },
  155:{ into: 156, level: 16, name: 'Quilava' },
  156:{ into: 157, level: 36, name: 'Typhlosion' },
  158:{ into: 159, level: 18, name: 'Croconaw' },
  159:{ into: 160, level: 30, name: 'Feraligatr' },
  // Birds / Normals
  161:{ into: 162, level: 15, name: 'Furret' },
  163:{ into: 164, level: 20, name: 'Noctowl' },
  // Bugs
  165:{ into: 166, level: 18, name: 'Ledian' },
  167:{ into: 168, level: 22, name: 'Ariados' },
  // Zubat → Crobat (friendship, treated as lv 22+)
  42: { into: 169, level: 35, name: 'Crobat' },
  // Water/Electric
  170:{ into: 171, level: 27, name: 'Lanturn' },
  // Baby pokemon
  172:{ into: 25,  level: 15, name: 'Pikachu' },
  173:{ into: 35,  level: 15, name: 'Clefairy' },
  174:{ into: 39,  level: 15, name: 'Jigglypuff' },
  175:{ into: 176, level: 20, name: 'Togetic' },
  // Natu / Mareep
  177:{ into: 178, level: 25, name: 'Xatu' },
  179:{ into: 180, level: 15, name: 'Flaaffy' },
  180:{ into: 181, level: 30, name: 'Ampharos' },
  // Bellossom (alternate Gloom evo — choice offered alongside Vileplume in applyEvolution)
  // Marill
  183:{ into: 184, level: 18, name: 'Azumarill' },
  // Politoed (alternate Poliwhirl evo — trade+item, lv 40)
  // Politoed (alternate Poliwhirl evo — choice offered alongside Poliwrath in applyEvolution)
  // Hoppip
  187:{ into: 188, level: 18, name: 'Skiploom' },
  188:{ into: 189, level: 27, name: 'Jumpluff' },
  // Wooper / Yanma / Espeon / Umbreon
  194:{ into: 195, level: 20, name: 'Quagsire' },
  // Eevee → Espeon / Umbreon handled in EEVEE_EVOLUTIONS below
  // Slowking (alternate Slowpoke evo — choice offered alongside Slowbro in applyEvolution)
  // Pineco / Dunsparce chain
  204:{ into: 205, level: 31, name: 'Forretress' },
  // Snubbull
  209:{ into: 210, level: 23, name: 'Granbull' },
  // Teddiursa / Slugma / Swinub
  216:{ into: 217, level: 30, name: 'Ursaring' },
  218:{ into: 219, level: 38, name: 'Magcargo' },
  220:{ into: 221, level: 33, name: 'Piloswine' },
  // Remoraid
  223:{ into: 224, level: 25, name: 'Octillery' },
  // Houndour / Phanpy / Stantler chain
  228:{ into: 229, level: 24, name: 'Houndoom' },
  231:{ into: 232, level: 25, name: 'Donphan' },
  // Tyrogue evos (all at lv 20, into Hitmonlee/chan/top depending on stats — simplified to top)
  236:{ into: 237, level: 20, name: 'Hitmontop' },
  // Smoochum / Elekid / Magby
  238:{ into: 124, level: 30, name: 'Jynx' },
  239:{ into: 125, level: 30, name: 'Electabuzz' },
  240:{ into: 126, level: 30, name: 'Magmar' },
  // Larvitar
  246:{ into: 247, level: 30, name: 'Pupitar' },
  247:{ into: 248, level: 55, name: 'Tyranitar' },

  // ── Gen 3 ──────────────────────────────────────────────────────────────
  // Hoenn starters
  252:{ into: 253, level: 16, name: 'Grovyle' },
  253:{ into: 254, level: 36, name: 'Sceptile' },
  255:{ into: 256, level: 16, name: 'Combusken' },
  256:{ into: 257, level: 36, name: 'Blaziken' },
  258:{ into: 259, level: 16, name: 'Marshtomp' },
  259:{ into: 260, level: 36, name: 'Swampert' },
  // Route 1 normals
  261:{ into: 262, level: 18, name: 'Mightyena' },
  263:{ into: 264, level: 20, name: 'Linoone' },
  // Wurmple branches (simplified: → Beautifly at lv 10)
  265:{ into: 266, level: 7,  name: 'Silcoon' },
  266:{ into: 267, level: 10, name: 'Beautifly' },
  268:{ into: 269, level: 10, name: 'Dustox' },
  // Lotad / Seedot
  270:{ into: 271, level: 14, name: 'Lombre' },
  271:{ into: 272, level: 30, name: 'Ludicolo' },
  273:{ into: 274, level: 14, name: 'Nuzleaf' },
  274:{ into: 275, level: 30, name: 'Shiftry' },
  // Birds
  276:{ into: 277, level: 22, name: 'Swellow' },
  278:{ into: 279, level: 25, name: 'Pelipper' },
  // Ralts
  280:{ into: 281, level: 20, name: 'Kirlia' },
  281:{ into: 282, level: 30, name: 'Gardevoir' },
  // Shroomish / Slakoth
  285:{ into: 286, level: 23, name: 'Breloom' },
  287:{ into: 288, level: 18, name: 'Vigoroth' },
  288:{ into: 289, level: 36, name: 'Slaking' },
  // Nincada
  290:{ into: 291, level: 20, name: 'Ninjask' },
  // Whismur
  293:{ into: 294, level: 20, name: 'Loudred' },
  294:{ into: 295, level: 40, name: 'Exploud' },
  // Makuhita / Azurill / Skitty
  296:{ into: 297, level: 24, name: 'Hariyama' },
  298:{ into: 183, level: 15, name: 'Marill' },
  300:{ into: 301, level: 20, name: 'Delcatty' },
  // Aron
  304:{ into: 305, level: 32, name: 'Lairon' },
  305:{ into: 306, level: 42, name: 'Aggron' },
  // Meditite / Electrike
  307:{ into: 308, level: 37, name: 'Medicham' },
  309:{ into: 310, level: 26, name: 'Manectric' },
  // Roselia / Gulpin
  315:{ into: 407, level: 40, name: 'Roserade' }, // Gen 4 evo, use lv 40 as proxy
  316:{ into: 317, level: 26, name: 'Swalot' },
  // Carvanha / Wailmer
  318:{ into: 319, level: 30, name: 'Sharpedo' },
  320:{ into: 321, level: 40, name: 'Wailord' },
  // Numel / Spoink / Trapinch
  322:{ into: 323, level: 33, name: 'Camerupt' },
  325:{ into: 326, level: 32, name: 'Grumpig' },
  328:{ into: 329, level: 35, name: 'Vibrava' },
  329:{ into: 330, level: 45, name: 'Flygon' },
  // Cacnea / Swablu
  331:{ into: 332, level: 32, name: 'Cacturne' },
  333:{ into: 334, level: 35, name: 'Altaria' },
  // Barboach / Corphish
  339:{ into: 340, level: 30, name: 'Whiscash' },
  341:{ into: 342, level: 30, name: 'Crawdaunt' },
  // Baltoy / Lileep / Anorith / Feebas
  343:{ into: 344, level: 36, name: 'Claydol' },
  345:{ into: 346, level: 40, name: 'Cradily' },
  347:{ into: 348, level: 40, name: 'Armaldo' },
  349:{ into: 350, level: 30, name: 'Milotic' },
  // Shuppet / Duskull / Chimecho
  353:{ into: 354, level: 37, name: 'Banette' },
  355:{ into: 356, level: 37, name: 'Dusclops' },
  // Snorunt / Spheal
  361:{ into: 362, level: 42, name: 'Glalie' },
  363:{ into: 364, level: 32, name: 'Sealeo' },
  364:{ into: 365, level: 44, name: 'Walrein' },
  // Bagon / Beldum
  371:{ into: 372, level: 30, name: 'Shelgon' },
  372:{ into: 373, level: 50, name: 'Salamence' },
  374:{ into: 375, level: 20, name: 'Metang' },
  375:{ into: 376, level: 45, name: 'Metagross' },
};

// Eevee branching evolution options (shown as a choice at level 36)
const EEVEE_EVOLUTIONS = [
  { into: 136, level: 36, name: 'Flareon',  types: ['Red'] },
  { into: 134, level: 36, name: 'Vaporeon', types: ['Lager'] },
  { into: 135, level: 36, name: 'Jolteon',  types: ['Sour'] },
  { into: 196, level: 36, name: 'Espeon',   types: ['Belgian'] },
  { into: 197, level: 36, name: 'Umbreon',  types: ['Cascadian'] },
];

// ---- Achievements ----

const ACHIEVEMENTS = [
  { id: 'gym_0',            name: 'Barrel Aging Complete', desc: 'Defeat the Barrel-aged master for the first time',                icon: '🛢️' },
  { id: 'gym_1',            name: 'License to Lager',      desc: 'Defeat the Lager master for the first time',                     icon: '🍺' },
  { id: 'gym_2',            name: 'Pucker Up',             desc: 'Defeat the Sour master for the first time',                      icon: '⚡' },
  { id: 'gym_3',            name: 'Dry Hop Champion',      desc: 'Defeat the IPA master for the first time',                       icon: '🍃' },
  { id: 'gym_4',            name: "Funk n' Wild",          desc: 'Defeat the Brett master for the first time',                     icon: '🦠' },
  { id: 'gym_5',            name: 'Brew Like a Monk',      desc: 'Defeat the Belgian master for the first time',                   icon: '🔮' },
  { id: 'gym_6',            name: 'Seeing Red',            desc: 'Defeat the Red Ale master for the first time',                   icon: '🍂' },
  { id: 'gym_7',            name: 'Nutty by Nature',       desc: 'Defeat the Brown Ale master for the first time',                 icon: '🍞' },
  { id: 'elite_four',       name: 'Head Brewer',           desc: 'Win your first Championship run',                                icon: '👑' },
  { id: 'elite_10',         name: 'Master Brewer',         desc: 'Claim the Championship title 10 times',                          icon: '🏆' },
  { id: 'starter_1',        name: 'IPA Run',               desc: 'Win a run starting with the OG IPA brew',                            icon: '🌱' },
  { id: 'starter_4',        name: 'Red Ale Run',           desc: 'Win a run starting with the OG Red Ale brew',                         icon: '🔥' },
  { id: 'starter_7',        name: 'Lager Run',             desc: 'Win a run starting with the OG Lager brew',                           icon: '🌊' },
  { id: 'seasonal',         name: 'Seasonal Release',      desc: 'Win a run starting with each of the 3 starter styles',           icon: '📅' },
  { id: 'vertical',         name: 'Vertical Tasting',      desc: 'Win a run where every brew shares at least one common type',         icon: '🎯' },
  { id: 'mixed_ferm',       name: 'Mixed Fermentation',    desc: 'Win a run with a team where no two brews share a primary type',  icon: '🧪' },
  { id: 'the_cellar',       name: 'The Cellar',            desc: 'Equip all 3 item slots on a single brew',                        icon: '📦' },
  { id: 'brite_bottom',     name: 'Bottom of the Brite',   desc: 'Win a battle with your whole team below 20% HP',                 icon: '😤' },
  { id: 'perfect_qc',       name: 'Perfect QC',            desc: 'Reach the Championship without a single brew fainting',          icon: '🧫' },
  { id: 'solo_run',         name: 'One is Enough',         desc: 'Win a run with only 1 brew on your team',                        icon: '⭐' },
  { id: 'house_special',    name: 'House Special',         desc: 'Give a brew a custom name',                                      icon: '✏️' },
  { id: 'grand_opening',    name: 'Grand Opening',         desc: 'Name your brewery at the start of a run',                        icon: '🏗️' },
  { id: 'stuck_standing',   name: 'Stuck But Standing',    desc: 'Push through a Stuck Sparge and win the very next battle',       icon: '🥣' },
  { id: 'rare_find',        name: 'Rare Find',             desc: 'Catch a shiny brew',                                             icon: '✨' },
  { id: 'the_brewlog',      name: 'The Brewlog',           desc: 'Add 150 unique brews to your Brewlog — unlocks Hard Mode',       icon: '📖' },
  { id: 'shinydex_complete',name: 'Shiny Cellar',          desc: 'Complete the Shiny Brewlog',                                     icon: '🌟' },
  { id: 'hard_mode_win',       name: 'True Brewmaster',        desc: 'Win a run on Hard Mode',                                                    icon: '💀' },
  // ---- Modifier achievements ----
  { id: 'exp_batch_win',       name: 'Happy Accident',         desc: 'Win a run with Experimental Batch active',                                  icon: '🎲' },
  { id: 'no_adjuncts_win',     name: 'Purist',                 desc: 'Win a run with No Adjuncts active — no items at all',                        icon: '🚫' },
  { id: 'nuzlocke_win',        name: 'Permadeath Pour',        desc: 'Win a run with Nuzlocke active',                                             icon: '💀' },
  { id: 'nuzlocke_flawless',   name: 'Immortal Batch',         desc: 'Win a Nuzlocke run without losing a single brew',                            icon: '🛡️' },
  { id: 'small_tap_win',       name: 'Tight Tap List',         desc: 'Win a run with Small Tap List active (max 3 brews)',                         icon: '🍺' },
  { id: 'speed_run_win',       name: 'Rapid Fermentation',     desc: 'Win a run with Speed Run active',                                            icon: '⚡' },
  { id: 'limited_release_win', name: 'No Choice, No Problem',  desc: 'Win a run with Limited Release active',                                      icon: '🔒' },
  { id: 'shiny_hunt_win',      name: 'Glitter in the Glass',   desc: 'Win a run with Shiny Hunt active',                                           icon: '✨' },
  { id: 'wild_events_win',     name: 'Wild Brewer',            desc: 'Win a run with Wild Events active',                                          icon: '🎪' },
  { id: 'modifier_stacker',    name: 'Complex Recipe',         desc: 'Win a run with 3 or more modifiers active at once',                          icon: '🧪' },
];

function getUnlockedAchievements() {
  try { return new Set(JSON.parse(localStorage.getItem('poke_achievements') || '[]')); }
  catch { return new Set(); }
}

function unlockAchievement(id) {
  const unlocked = getUnlockedAchievements();
  if (unlocked.has(id)) return null;
  unlocked.add(id);
  localStorage.setItem('poke_achievements', JSON.stringify([...unlocked]));
  return ACHIEVEMENTS.find(a => a.id === id) || null;
}

// ---- Pokedex ----

function getPokedex() {
  try { return JSON.parse(localStorage.getItem('poke_dex') || '{}'); }
  catch { return {}; }
}

function markPokedexSeen(id, name, types, spriteUrl) {
  if (!id) return;
  const dex = getPokedex();
  if (!dex[id]) {
    dex[id] = { id, name, types, spriteUrl, caught: false };
    localStorage.setItem('poke_dex', JSON.stringify(dex));
  }
}

function markPokedexCaught(id, name, types, spriteUrl) {
  if (!id) return;
  const dex = getPokedex();
  dex[id] = { ...(dex[id] || {}), id, caught: true,
    name:      name      || dex[id]?.name,
    types:     types     || dex[id]?.types,
    spriteUrl: spriteUrl || dex[id]?.spriteUrl,
  };
  localStorage.setItem('poke_dex', JSON.stringify(dex));
}

function getShinyDex() {
  try { return JSON.parse(localStorage.getItem('poke_shiny_dex') || '{}'); }
  catch { return {}; }
}

function hasHardModeWin() {
  return getUnlockedAchievements().has('hard_mode_win');
}

function getEliteWins() {
  return parseInt(localStorage.getItem('poke_elite_wins') || '0', 10);
}

function incrementEliteWins() {
  const wins = getEliteWins() + 1;
  localStorage.setItem('poke_elite_wins', String(wins));
  return wins;
}

// Returns an <img> for the item's official sprite, falling back to its emoji if the sprite 404s
function itemIconHtml(item, size = 24) {
  const slug = item.id.replace(/_/g, '-');
  const url = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${slug}.png`;
  const esc = item.icon.replace(/'/g, "\\'");
  return `<img src="${url}" alt="${item.name}" title="${item.name}" class="item-sprite-icon" `
       + `style="width:${size}px;height:${size}px;image-rendering:pixelated;vertical-align:middle;" `
       + `onerror="this.replaceWith(document.createTextNode('${esc}'))">`;
}

function isShinyDexComplete() {
  const dex = getShinyDex();
  const caughtIds = new Set(Object.values(dex).map(e => e.id));
  for (const id of ALL_CATCHABLE_IDS) {
    if (!caughtIds.has(id)) return false;
  }
  return true;
}

function markShinyDexCaught(id, name, types, shinySpriteUrl) {
  if (!id) return;
  const dex = getShinyDex();
  dex[id] = { id, name, types, shinySpriteUrl };
  localStorage.setItem('poke_shiny_dex', JSON.stringify(dex));
}

// ---- Hall of Fame ----

function getHallOfFame() {
  try { return JSON.parse(localStorage.getItem('poke_hall_of_fame') || '[]'); }
  catch { return []; }
}

function saveHallOfFameEntry(team, runNumber, hardMode) {
  const entries = getHallOfFame();
  entries.push({
    runNumber,
    hardMode: !!hardMode,
    date: new Date().toLocaleDateString(),
    team: team.map(p => ({
      speciesId: p.speciesId,
      name: p.name,
      brewName: p.brewName || null,
      nickname: p.nickname || null,
      level: p.level,
      types: p.types,
      spriteUrl: p.spriteUrl,
      isShiny: !!p.isShiny,
    })),
  });
  localStorage.setItem('poke_hall_of_fame', JSON.stringify(entries));
}

// ---- Run Modifiers ----

const RUN_MODIFIERS = [
  {
    id: 'experimental_batch',
    name: 'Experimental Batch',
    icon: '🎲',
    desc: 'Your starting brew is completely random — from all total available — no selection screen.',
    hint: 'For the adventurous brewer.',
    conflicts: [],
  },
  {
    id: 'no_adjuncts',
    name: 'No Adjuncts',
    icon: '🚫',
    desc: 'No items can be found or equipped during the entire run.',
    hint: 'Pure brewing. No shortcuts.',
    conflicts: [],
  },
  {
    id: 'nuzlocke',
    name: 'Nuzlocke',
    icon: '💀',
    desc: 'Any brew that faints is permanently released from your team.',
    hint: 'Every loss is final.',
    conflicts: [],
  },
  {
    id: 'small_tap_list',
    name: 'Small Tap List',
    icon: '🍺',
    desc: 'Maximum team size is 3 instead of 6.',
    hint: 'Quality over quantity.',
    conflicts: [],
  },
  {
    id: 'speed_run',
    name: 'Speed Run',
    icon: '⚡',
    desc: 'All battles auto-skip instantly with no animation.',
    hint: 'Blink and you\'ll miss it.',
    conflicts: [],
  },
  {
    id: 'limited_release',
    name: 'Limited Release',
    icon: '🔒',
    desc: 'Brew New Batch screens only show 1 option instead of 3.',
    hint: 'Take it or leave it.',
    conflicts: [],
  },
  {
    id: 'shiny_hunt',
    name: 'Shiny Hunt',
    icon: '✨',
    desc: 'Shiny rate boosted to 10%. Your starter is guaranteed shiny. Only shiny pokemon can be caught — non-shinies cannot be selected.',
    hint: 'Unlocks when Hard Mode unlocks (151 brewlog entries).',
    conflicts: ['experimental_batch'],
    requiresBrewlog: true,
  },
  {
    id: 'wild_events',
    name: 'Wild Events',
    icon: '🎪',
    desc: 'Adds extra events to the random nodes — Beer Festival, Collaboration Brew, Ghost Tap, and more.',
    hint: 'Unlocks after your first Championship win.',
    conflicts: [],
  },
  {
    id: 'deep_cellar',
    name: 'Deep Cellar',
    icon: '📦',
    desc: 'Brews can hold more items the smaller your team is. From 8 items on a solo beer, down to 2 items for a full team of 6.',
    hint: 'Rewards commitment to a small tap list.',
    conflicts: [],
  },
];

// conflicts map — which modifier IDs block each other
// (populated here so it's easy to extend)
RUN_MODIFIERS.find(m => m.id === 'no_adjuncts').conflicts   = [];
RUN_MODIFIERS.find(m => m.id === 'small_tap_list').conflicts = ['nuzlocke'];
RUN_MODIFIERS.find(m => m.id === 'shiny_hunt').conflicts     = ['experimental_batch', 'limited_release'];
// Note: we handle conflicts as soft warnings, not hard blocks,
// so players can still combine them if they want the challenge.

function getActiveModifiers() {
  try { return new Set(JSON.parse(localStorage.getItem('run_modifiers') || '[]')); }
  catch { return new Set(); }
}

function saveActiveModifiers(set) {
  localStorage.setItem('run_modifiers', JSON.stringify([...set]));
}

function hasModifier(modId) {
  // Check state first (mid-run), fall back to localStorage
  if (typeof state !== 'undefined' && state.modifiers) {
    return state.modifiers.has(modId);
  }
  return getActiveModifiers().has(modId);
}

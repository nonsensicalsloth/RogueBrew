// rivals.js — themed rival breweries and act bosses
//
// Act 1: small, simple local brewers (no disruption)
// Act 2: themed craft breweries with real synergies (+1 pt per card)
// Act 3: the same breweries, now veterans (+2 pts per card)
// Bosses: a signature trait that bends the rules of the fight
//
// Lists can contain duplicates; buildRivalDeck repeats the list if the
// requested size is larger than the list.

const RIVAL_SIZES = { battle: [15, 20, 25], boss: [20, 25, 30], festival: 30 };
const RIVAL_ACT_BONUS = [0, 1, 2];   // flat points added to each scoring card
const BOSS_EXTRA_BONUS = [1, 0, 0];  // extra per-card points for bosses, by act (act 1 bosses need a boost)

const LOCAL_RIVALS = [
  { id:'homebrewer', name:'Garage Homebrewer', style:'pale ale',
    cards:['2row','2row','2row','paleale','paleale','crystal40','crystal40','cascade','cascade','centennial',
           'chico','chico','caramun','oats','maltodex'] },
  { id:'pub', name:'Corner Pub Brewery', style:'English bitter',
    cards:['marisotter','2row','paleale','paleale','crystal40','crystal20','ekg','oats','englishale','paleale',
           'victory','biscuit','oats','caramun','crystal20'] },
  { id:'lagerclub', name:'Weekend Lager Club', style:'lager',
    cards:['pilsner','pilsner','pilsner','vienna','vienna','saaz','saaz','hallertau','hallertau','kolsch','kolsch',
           'tettnang','munich','crystal10','czechlager'] },
];

const CRAFT_RIVALS = [
  { id:'foglantern', name:'Fog Lantern Brewing', style:'hazy',
    cards:['wheatwhite','wheatwhite','oats','oats','flakedwheat','paleale','2row','2row','2row','citra','citra','mosaic',
           'galaxy','nectaron','talus','strata','london3','mango','paleale','paleale','chico',
           'passionfr','drunkcellar'] },
  { id:'blackkettle', name:'Black Kettle Stoutworks', style:'stout',
    cards:['marisotter','marisotter','2row','2row','choc','choc','roastedbar','carafaII','carafaII','carafaIII','midnightw',
           'midnightw','debittered','oats','oats','lactose','lactose','coffee','coldbrewcof','vanilla','englishale','englishale',
           'magnum','badbatch'] },
  { id:'stwort', name:'Abbey of St. Wort', style:'Belgian',
    cards:['pilsner','pilsner','pilsner','munich','munich','candisugarcl','candisugarcl','candisugarab','candisugarab',
           'candisugardk','coriander','coriander','orangepeel','grainspara','cardamom','abbey','abbey','saison','saison',
           'hallertau','hallertau','tettnang','inspector'] },
  { id:'pinepellet', name:'Pine & Pellet Co.', style:'West Coast',
    cards:['2row','2row','2row','crystal10','crystal10','carapils','cascade','cascade','cascade','centennial','centennial',
           'chinook','chinook','columbus','columbus','simcoe','simcoe','magnum','chico','chico','kettletrans','citrazest','hopthief'] },
  { id:'kuhlhaus', name:'Kühlhaus Lagerei', style:'lager',
    cards:['pilsner','pilsner','pilsner','floorpilsner','floorpilsner','vienna','vienna','saaz','saaz','saaz','hallertau',
           'hallertau','tettnang','tettnang','hallblanc','w3470','w3470','czechlager','czechlager','kolsch','coldcrash',
           'ricehulls','qc'] },
  { id:'tartcellars', name:'Tart Cellars', style:'sour',
    cards:['pilsner','pilsner','wheatwhite','wheatwhite','goldenprom','lacto','lacto','sourvisiae','sourvisiae','sourvisiae',
           'raspberry','raspberry','cherry','vanilla','passionfr','passionfr','blueberry','phantasm','cosmicpunch','honey',
           'crosscontam','crystal20','cherry'] },
];

// Two possible bosses per act; one is picked when the map is generated
const BOSSES = [
  [ // Act 1
    { id:'macro', name:'Big Macro Brewing Co.', short:'Big Macro', style:'light lager', trait:'massprod',
      traitName:'Mass Production', traitDesc:'Draws 2 cards each turn instead of 1.',
      cards:['6row','6row','6row','2row','2row','2row','flakedcorn','flakedcorn','flakedcorn','ricehulls','ricehulls',
             'pilotbatch','pilotbatch','kolsch','kolsch','chico','chico','magnum','cascade','crystal10','filtration',
             'drunkbrewer','coldcrash'] },
    { id:'brewpub', name:'Old Town Brewpub', short:'Old Town', style:'pub ales', trait:'regulars',
      traitName:'The Regulars', traitDesc:'Starts every round with +15 on its hot side.',
      cards:['marisotter','marisotter','goldenprom','paleale','paleale','crystal60','crystal60','crystal40','ekg','ekg',
             'englishale','englishale','victory','biscuit','oats','caramun','caramun','choc','cascade','fermlog'] },
  ],
  [ // Act 2
    { id:'hazelord', name:'The Haze Lord', short:'Haze Lord', style:'hazy IPA', trait:'juicebomb',
      traitName:'Juice Bomb', traitDesc:'Its hops get +3 when played.',
      cards: null /* uses Fog Lantern's list */, base:'foglantern' },
    { id:'ambrose', name:'Brother Ambrose', short:'Br. Ambrose', style:'Belgian', trait:'patience',
      traitName:'Monastic Patience', traitDesc:'Its yeast gains +2 extra each turn.',
      cards: null, base:'stwort' },
  ],
  [ // Act 3
    { id:'syndicate', name:'Imperial Stout Syndicate', short:'Syndicate', style:'imperial stout', trait:'roastmaster',
      traitName:'Roast Masters', traitDesc:'Its roast penalty threshold is 10.',
      cards: null, base:'blackkettle', extra:['patent','patent','blackmalt','roastedbar','cacaonibs','choc'] },
    { id:'collective', name:'The Sour Collective', short:'Sour Collective', style:'wild ale', trait:'spontaneous',
      traitName:'Spontaneous Fermentation', traitDesc:'Every 3rd turn, shuffles a Contamination into YOUR deck.',
      cards: null, base:'tartcellars' },
  ],
];

function getRivalDef(id) {
  return [...LOCAL_RIVALS, ...CRAFT_RIVALS, ...BOSSES.flat()].find(r => r.id === id);
}

function rivalCardList(r) {
  if (r.cards) return r.cards;
  const base = getRivalDef(r.base);
  return [...(base ? base.cards : []), ...(r.extra || [])];
}

function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// Chooses a rival for a map node when the map is generated
function assignRival(node) {
  if (node.type === 'boss')     return pickRandom(BOSSES[node.act]).id;
  if (node.type === 'festival') return pickRandom(CRAFT_RIVALS).id;
  if (node.type === 'battle')   return pickRandom(node.act === 0 ? LOCAL_RIVALS : CRAFT_RIVALS).id;
  return null;
}

function rivalSizeFor(node) {
  if (node.type === 'festival') return RIVAL_SIZES.festival;
  if (node.type === 'boss')     return RIVAL_SIZES.boss[node.act] || 30;
  return RIVAL_SIZES.battle[node.act] || 25;
}

// Builds the actual card instances for a fight
function buildRivalDeck(rivalId, size, act, isBoss = false) {
  const r = getRivalDef(rivalId);
  const list = r ? rivalCardList(r).filter(id => getCardDef(id)) : ENEMY_DECK_IDS;
  const ids = [];
  while (ids.length < size) ids.push(...shuffle(list));
  const bonus = (RIVAL_ACT_BONUS[act] || 0) + (isBoss ? (BOSS_EXTRA_BONUS[act] || 0) : 0);
  return ids.slice(0, size).map(id => {
    const c = { ...getCardDef(id) };
    if (bonus && c.points > 0 && c.cat !== 'process') c.points += bonus;
    return c;
  });
}

// ── Rival AI helpers ──

// Roast each card adds, and how much it raises the threshold (for the AI to avoid overloading itself)
const ROAST_ADDS = {
  choc:1, patent:2, palechoc:1, roastedbar:2, carafaI:1, carafaII:1, carafaIII:2, blackmalt:2,
  smokedmalt:1, cacaonibs:1, coldbrewcof:1,
};
const ROAST_RAISES = { carafaI:1, carafaII:1, carafaIII:1, coldbrewcof:1 };

function rivalWouldOverload(c) {
  const add = ROAST_ADDS[c.id] || 0;
  if (!add) return false;
  const effective = (state.eRoastTokens || 0) - (state.eRoastSafe || 0) + add;
  const threshold = (state.eRoastThreshold || 5) + (ROAST_RAISES[c.id] || 0);
  return effective >= threshold;
}

// Where the rival puts a card that can go on either side
function rivalLaneFor(c) {
  if (c.lane !== 'both') return c.lane;
  if (c.cat === 'hop') {
    // Bittering hops go in the boil; aroma hops get dry hopped
    return c.tags && c.tags.includes('bitter') ? 'hot' : 'cold';
  }
  return 'hot';
}

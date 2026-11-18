// ── Keyword tooltips ──
// Hover a game term in card text (Acid, Lagering, roast...) or a tag chip (crisp, sticky...)
// for a one-line explanation. Any element with a data-tip attribute gets the tooltip.

// Game terms found in card text. Longest first, so "Acid Burn" wins over "Acid".
function gameKeywords() {
  const lagerPow = typeof LAGER_POWER !== 'undefined' ? LAGER_POWER : 3;
  const roastPow = typeof ROAST_POWER !== 'undefined' ? ROAST_POWER : 1;
  const clump    = typeof CLUMP_SIZE !== 'undefined' ? CLUMP_SIZE : 3;
  const complete = typeof COMPLETE_BEER_BONUS !== 'undefined' ? COMPLETE_BEER_BONUS : 30;
  const special  = typeof SPECIALTY_BEER_BONUS !== 'undefined' ? SPECIALTY_BEER_BONUS : 10;
  return [
    ['Acid Burn',          'Acid Burn: points eaten by Acid pile up here. Cleaning cards (CIP Cycle, Fining Agent, Sanitize on the cold side) give them back.'],
    ['Acid',               'Acid: at the start of each turn, Acid eats that many points from the best lane, then drops by 1.'],
    ['Lagering',           `Lagering: budget you don't spend becomes Lagering if you end your turn holding a crisp card. Your next crisp card gets +${lagerPow} per Lagering.`],
    ['roast limit',        'Roast limit: how many roast tokens your hot side can hold. Reach it and the beer is Burnt (the limit starts at 5).'],
    ['roast penalty threshold', 'Roast limit: how many roast tokens your hot side can hold. Reach it and the beer is Burnt (the limit starts at 5).'],
    ['roast tokens',       `Roast: each roast token gives every roasty card +${roastPow}. Reach your roast limit and the beer is Burnt.`],
    ['roast token',        `Roast: each roast token gives every roasty card +${roastPow}. Reach your roast limit and the beer is Burnt.`],
    ['roast',              `Roast: each roast token gives every roasty card +${roastPow}. Reach your roast limit and the beer is Burnt.`],
    ['Burnt',              'Burnt: too much roast. Your hot side scores half.'],
    ['Stuck Mash',         `Stuck Mash: ${clump} sticky grains in a row on your hot side clump together for −8.`],
    ['Contamination',      'Contamination: a −10 card that plays itself to your cold side when drawn. CIP Cycle, Fining Agent and Sanitize clean it up.'],
    ['Dry hop',            'Dry hop: this bonus only happens when the hop goes on your cold side.'],
    ['Boil',               'Boil: this bonus only happens when the hop goes on your hot side.'],
    ['biotransformation',  'Biotransformation: the yeast reacts with the hops on your cold side and boosts them.'],
    ['Thiol release',      'Thiol release: thiol cards get a big boost once a thiol yeast like Cosmic Punch is on your board.'],
    ['Specialty Beer',     `Specialty Beer: a complete beer (malt, hop and yeast) that also has an adjunct. +${special} on top of the +${complete}.`],
    ['complete beer',      `Complete beer: at least one malt, hop and yeast on your board. +${complete} at judging.`],
    ['per turn',           'Grows at the start of each of your turns while it is on your cold side.'],
  ];
}

// Tags that drive a mechanic get their own explanation; the rest are flavor tags other cards count
const TAG_TIPS = {
  crisp:   'Crisp: spends your Lagering. Unspent budget banks as Lagering only while you hold a crisp card.',
  sticky:  'Sticky: 3 sticky grains in a row on your hot side make a Stuck Mash (−8).',
  roasty:  'Roasty: gets +1 for each roast token on your board.',
  'c-hop': 'C-hop: with another c-hop on the same side, each scores +50% of its printed points.',
  thiol:   'Thiol: gets a big boost once a thiol yeast like Cosmic Punch releases it.',
  noble:   'Noble: classic German and Czech hops. W-34/70, Spalt, Perle and Hallertau Blanc count them.',
  sour:    'Sour: sour decks win by giving the rival Acid.',
  neutral: 'Neutral: plain base malt. Mexican Lager counts these.',
};
function tagTip(t) {
  return TAG_TIPS[t] || `${t[0].toUpperCase() + t.slice(1)}: a flavor tag. Cards that mention ${t} count this card.`;
}

const escAttr = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

// ── The floating tooltip ──
(function setupTips() {
  if (typeof document === 'undefined') return;
  let tip = null;
  const show = (el, x, y) => {
    if (!tip) { tip = document.createElement('div'); tip.id = 'kw-tip'; document.body.appendChild(tip); }
    tip.textContent = el.getAttribute('data-tip');
    tip.style.display = 'block';
    const r = tip.getBoundingClientRect();
    const left = Math.min(Math.max(8, x - r.width / 2), window.innerWidth - r.width - 8);
    const top  = y - r.height - 14 < 8 ? y + 18 : y - r.height - 14;
    tip.style.left = left + 'px'; tip.style.top = top + 'px';
  };
  document.addEventListener('mouseover', e => {
    const el = e.target.closest && e.target.closest('[data-tip]');
    if (el) show(el, e.clientX, e.clientY);
    else if (tip) tip.style.display = 'none';
  });
  document.addEventListener('mouseout', e => {
    if (tip && e.target.closest && e.target.closest('[data-tip]') && !(e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('[data-tip]'))) tip.style.display = 'none';
  });
  document.addEventListener('scroll', () => { if (tip) tip.style.display = 'none'; }, true);
})();

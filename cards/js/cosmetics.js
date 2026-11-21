// ── Cosmetics: board themes, card frames and brewer titles ──
// Every achievement unlocks exactly one. Picked in the Cellar tab of the achievements screen.
// Themes and frames are classes on #game-screen (styles in css/cosmetics.css).

const COS_KEY = 'wortcraft_cosmetics';

const COSMETICS = [
  // Board themes (style medals)
  { id: 'roastery', kind: 'theme', name: 'Roastery',        ach: 'style_stout',   blurb: 'Coffee beans and a glowing ember edge.' },
  { id: 'juicebox', kind: 'theme', name: 'Juice Box',       ach: 'style_hazy',    blurb: 'Rising bubbles and a pulpy orange rim.' },
  { id: 'frost',    kind: 'theme', name: 'Lagerhaus Frost', ach: 'style_lager',   blurb: 'Snowflakes, icicles and a slow glint.' },
  { id: 'pucker',   kind: 'theme', name: 'Pucker',          ach: 'style_sour',    blurb: 'Cherries, lime slices and a candy stripe.' },
  { id: 'abbey',    kind: 'theme', name: 'Abbey Cellar',    ach: 'style_belgian', blurb: 'Stained-glass arches set in stone.' },
  { id: 'barnyard', kind: 'theme', name: 'Barnyard',        ach: 'style_wild',    blurb: 'Barn planks, nails and hay on the floor.' },
  { id: 'bakery',   kind: 'theme', name: 'Bakery',          ach: 'style_pastry',  blurb: 'Sprinkles and a frosting drip.' },
  // Card frames (progress and technique)
  { id: 'copper',    kind: 'frame', name: 'Copper',      ach: 'first_pour',   blurb: 'Hammered copper with rivets.' },
  { id: 'oak',       kind: 'frame', name: 'Oak Barrel',  ach: 'every_tap',    blurb: 'Oak staves and iron hoops.' },
  { id: 'stainless', kind: 'frame', name: 'Stainless',   ach: 'brewmaster5',  blurb: 'Brushed steel, screws and a sheen.' },
  { id: 'gold',      kind: 'frame', name: 'Gold Leaf',   ach: 'brewmaster10', blurb: 'Gilded edges and ornate corners.' },
  { id: 'frost',     kind: 'frame', name: 'Frosted',     ach: 'patience',     blurb: 'Ice creeping in from the corners.' },
  { id: 'charred',   kind: 'frame', name: 'Charred',     ach: 'edge',         blurb: 'Scorched edge, glowing embers.' },
  { id: 'burlap',    kind: 'frame', name: 'Burlap',      ach: 'rice_rescue',  blurb: 'Woven sackcloth with a stitched seam.' },
  { id: 'chalk',     kind: 'frame', name: 'Chalkboard',  ach: 'full_menu',    blurb: 'A slate in a wooden frame.' },
  // Brewer titles (the rest)
  { id: 'collector',  kind: 'title', name: 'Collector',        ach: 'full_cellar' },
  { id: 'acid',       kind: 'title', name: 'Acid Tongue',      ach: 'pucker' },
  { id: 'sanitation', kind: 'title', name: 'Sanitation Chief', ach: 'clean_bill' },
  { id: 'singlehop',  kind: 'title', name: 'Single Hopper',    ach: 'single_hop' },
  { id: 'labrat',     kind: 'title', name: 'Lab Rat',          ach: 'lab_rat' },
  { id: 'postmaster', kind: 'title', name: 'Postmaster',       ach: 'return_sender' },
  { id: 'whisperer',  kind: 'title', name: 'Yeast Whisperer',  ach: 'repitch' },
  { id: 'biscuit',    kind: 'title', name: 'Biscuit Baron',    ach: 'biscuit_tin' },
  { id: 'coldsider',  kind: 'title', name: 'Cold Sider',       ach: 'no_kettle' },
  { id: 'trailblazer',kind: 'title', name: 'Trailblazer',      ach: 'mod_trio' },
  { id: 'flawless',   kind: 'title', name: 'Never Dumped a Batch', ach: 'mod_onebatch' },
  { id: 'blindtaster',kind: 'title', name: 'Blind Taster',     ach: 'mod_blind' },
];
const COS_KINDS = [
  { kind: 'theme', name: 'Board Theme', none: 'Classic' },
  { kind: 'frame', name: 'Card Frame',  none: 'Classic' },
  { kind: 'title', name: 'Brewer Title', none: 'No title' },
];

function getCosmetic(kind, id) { return COSMETICS.find(c => c.kind === kind && c.id === id); }
function cosOwned(c) { return !!c && hasAch(c.ach); }

function loadCosmetics() {
  try { const v = JSON.parse(localStorage.getItem(COS_KEY) || '{}') || {}; return { theme: v.theme || null, frame: v.frame || null, title: v.title || null }; }
  catch (e) { return { theme: null, frame: null, title: null }; }
}
// What's actually worn: only things you've earned
function wornCosmetics() {
  const v = loadCosmetics(), out = {};
  COS_KINDS.forEach(k => { const c = getCosmetic(k.kind, v[k.kind]); out[k.kind] = cosOwned(c) ? c : null; });
  return out;
}
function equipCosmetic(kind, id) {
  const c = id ? getCosmetic(kind, id) : null;
  if (id && !cosOwned(c)) return false;
  const v = loadCosmetics(); v[kind] = id || null;
  try { localStorage.setItem(COS_KEY, JSON.stringify(v)); } catch (e) {}
  applyCosmetics();
  return true;
}

function cosClasses(theme, frame) {
  return [theme ? `cos-themed theme-${theme}` : '', frame ? `cos-framed frame-${frame}` : ''].join(' ').trim();
}
function applyCosmetics() {
  if (typeof document === 'undefined') return;
  const w = wornCosmetics();
  const bs = document.getElementById('game-screen');
  if (bs) {
    bs.className = bs.className.split(/\s+/).filter(c => c && !/^(cos-themed|cos-framed|theme-|frame-)/.test(c)).join(' ');
    const add = cosClasses(w.theme && w.theme.id, w.frame && w.frame.id);
    if (add) add.split(' ').forEach(c => bs.classList.add(c));
  }
  const st = document.getElementById('score-title');
  if (st) st.textContent = w.title ? w.title.name : '';
  const tb = document.getElementById('title-brewer');
  if (tb) { tb.textContent = w.title ? `Head Brewer · ${w.title.name}` : ''; tb.style.display = w.title ? '' : 'none'; }
}

// ── The Cellar tab ──
let achTab = 'trophies';
function showAchTab(tab) {
  achTab = tab;
  document.querySelectorAll('.ach-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.getElementById('ach-shelf').style.display  = tab === 'trophies' ? '' : 'none';
  document.getElementById('ach-cellar').style.display = tab === 'cellar' ? '' : 'none';
  const st = document.getElementById('ach-stats'); if (st) st.style.display = tab === 'stats' ? '' : 'none';
  if (tab === 'cellar') renderCellar(); else if (tab === 'stats') renderStats(); else renderAchievements();
}

function cosPreviewHtml(kind, id) {
  const C = cid => ({ ...getCardDef(cid), tags: [...getCardDef(cid).tags] });
  const fcard = (c, pts) => `<div class="field-card p"><div class="field-card-art">${typeof cardArtMini === 'function' ? cardArtMini(c) : ''}</div>
      <div class="field-card-main"><div class="field-card-name">${c.name}</div><div class="field-card-tags">${c.tags.slice(0, 2).map(t => `<span class="ftag tag-${t}">${t}</span>`).join(' ')}</div></div>
      <div class="field-card-pts">+${pts}</div></div>`;
  if (kind === 'title') return `<div class="cos-title-prev"><span class="cos-you">YOU</span><span class="cos-you-title">${id ? getCosmetic('title', id).name : '—'}</span></div>`;
  const cls = kind === 'theme' ? cosClasses(id, null) : cosClasses(null, id);
  return `<div class="cos-prev ${cls}">
    <div class="lane player-lane hot-lane"><div class="lane-header"><span class="lane-name">HOT SIDE</span><span class="lane-score">43 pts</span></div>
      <div class="lane-cards">${fcard(C('munich'), 18)}${fcard(C('choc'), 25)}</div></div>
    ${kind === 'theme' ? `<div class="lane player-lane cold-lane"><div class="lane-header"><span class="lane-name">COLD SIDE</span><span class="lane-score">15 pts</span></div>
      <div class="lane-cards">${fcard(C('citra'), 15)}</div></div>` : ''}
  </div>`;
}

function renderCellar() {
  const w = wornCosmetics();
  document.getElementById('ach-cellar').innerHTML = COS_KINDS.map(k => {
    const items = [{ id: null, name: k.none, blurb: k.kind === 'title' ? 'Show no title.' : 'The standard look.' }, ...COSMETICS.filter(c => c.kind === k.kind)];
    const owned = COSMETICS.filter(c => c.kind === k.kind && cosOwned(c)).length;
    return `<div class="ach-cat cos-cat">
      <div class="ach-cat-head"><span>${k.name}</span><span class="ach-cat-n">${owned}/${COSMETICS.filter(c => c.kind === k.kind).length} unlocked</span></div>
      <div class="cos-row cos-row-${k.kind}">${items.map(c => {
        const have = !c.id || cosOwned(c);
        const on = (w[k.kind] ? w[k.kind].id : null) === c.id;
        const a = c.ach ? ACHIEVEMENTS.find(x => x.id === c.ach) : null;
        return `<div class="cos-tile ${have ? 'cos-have' : 'cos-locked'} ${on ? 'cos-on' : ''}" ${have ? `onclick="equipCosmetic('${k.kind}', ${c.id ? `'${c.id}'` : 'null'}); renderCellar();"` : ''}>
          ${cosPreviewHtml(k.kind, c.id)}
          <div class="cos-name">${c.name}${on ? ' <span class="cos-worn">✓ ON</span>' : ''}</div>
          <div class="cos-blurb">${have ? (c.blurb || (a ? `From ${a.name}.` : '')) : `🔒 ${a ? `${a.icon} ${a.name}: ${a.desc}` : ''}`}</div>
        </div>`; }).join('')}</div>
    </div>`;
  }).join('');
}

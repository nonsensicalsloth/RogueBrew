// ── Phone and touch support ──
// Everything here is gated on phone-sized or touch-only screens, so desktop play is untouched.
//   Portrait phones:  width up to 700px
//   Landscape phones: height up to 500px on a touch screen
const MQ_PHONE = '(max-width: 700px), (max-height: 500px) and (hover: none) and (pointer: coarse)';
const MQ_TOUCH = '(hover: none) and (pointer: coarse)';
const mqMatch = q => typeof window !== 'undefined' && window.matchMedia && window.matchMedia(q).matches;
function phoneUI() { return mqMatch(MQ_PHONE); }
function touchUI() { return mqMatch(MQ_TOUCH); }

// The selected card, shown large in the hand dock, with buttons to play it to a side
function renderMobilePreview() {
  const el = document.getElementById('m-preview');
  if (!el) return;
  const c = phoneUI() && typeof selectedCard === 'number' && state && state.pHand ? state.pHand[selectedCard] : null;
  if (!c || state.phase !== 'play') {
    el.innerHTML = ''; el.style.display = 'none';
    if (phoneUI() && typeof tagHover === 'function' && el.dataset.lit) { delete el.dataset.lit; tagHover(null); }
    return;
  }
  // No hover on phones: the selected card lights up the cards it cares about instead
  if (typeof tagHover === 'function') { tagHover(selectedCard); el.dataset.lit = '1'; }
  const lanes = c.lane === 'both' ? ['hot', 'cold'] : [c.lane === 'cold' ? 'cold' : 'hot'];
  el.style.display = '';
  el.innerHTML = `<div class="mp-head"><span class="mp-cost">${getEffectiveCost(c)}</span><span class="mp-name">${c.name}</span><span class="mp-pts">+${c.points}</span>
      <button class="mp-x" onclick="selectedCard = null; render();" aria-label="Cancel">✕</button></div>
    <div class="mp-tags">${tagHtml(c.tags)}</div>
    <div class="mp-desc">${richDesc(c.desc) || '<span style="color:var(--dim)">No effect. Just points.</span>'}</div>
    <div class="mp-play">${lanes.map(l => `<button class="btn btn-primary mp-lane mp-${l}" onclick="playToLane('${l}')">▶ ${l === 'hot' ? 'HOT' : 'COLD'} SIDE</button>`).join('')}</div>`;
}

if (typeof window !== 'undefined') {
  // Re-render the preview after every game render (only does anything on phones)
  window.addEventListener('load', () => {
    if (typeof render === 'function') {
      const _render = render;
      render = function () { const r = _render.apply(this, arguments); try { renderMobilePreview(); } catch (e) {} return r; };
    }
    // Tap the battle log to open or close it on phones
    const log = document.getElementById('log');
    if (log) log.addEventListener('click', () => { if (phoneUI()) log.classList.toggle('log-open'); });
    // Re-fit the hand when the phone rotates
    window.addEventListener('resize', () => { const h = document.getElementById('hand'); if (h && typeof fitHand === 'function') fitHand(h); });
  });
}

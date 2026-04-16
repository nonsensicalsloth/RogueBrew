// ═══════════════════════════════════════════ UI
const UI = (() => {
  const el = id => document.getElementById(id);

  // ── CONDITIONS PANEL ────────────────────────────────────────────────
  function updateConditions() {
    el('c-date').textContent    = gameDate();
    el('c-mnext').textContent   = milesToNext() + ' mi.';
    el('c-mtot').textContent    = G.miles + ' mi.';
    el('c-pace').textContent    = PACE[G.pace].label;
    el('c-rations').textContent = RATIONS[G.rations].label;
    el('c-food').textContent    = G.supplies.food + ' lbs';
    el('c-food').className      = 'cv' + (G.supplies.food < 80 ? ' crit' : G.supplies.food < 200 ? ' warn' : '');
    el('c-health').textContent  = healthLabel();
    const h = avgHealth();
    el('c-health').className    = 'cv' + (h >= 70 ? ' good' : h >= 35 ? ' warn' : ' crit');
    el('c-brew').textContent    = Math.round(G.beer) + '%';
    el('c-status').textContent  = _moving ? 'Moving' : 'Stopped';

    // Weather
    const wi = _weatherInfo();
    el('c-wicon').textContent  = wi.icon;
    el('c-wlabel').textContent = wi.label;

    // Illnesses
    const ills = Object.keys(G.illnesses || {});
    el('c-ill').innerHTML = ills.length
      ? '<div class="ill-head">Ill</div>' + ills.map(n => {
          const ill = ILLNESSES.find(i => i.id === G.illnesses[n]);
          return '<div class="ill-row">' + n + ': ' + (ill ? ill.label : G.illnesses[n]) + '</div>';
        }).join('')
      : '';
  }

  function _weatherInfo() {
    if (!G.weather) return { icon: '☀', label: 'Clear' };
    const map = {
      clear: { icon: '☀', label: 'Clear' },
      rain:  { icon: '☂', label: 'Rainy' },
      storm: { icon: '⛈', label: 'Storm' },
      heat:  { icon: '☼', label: 'Hot' },
      snow:  { icon: '❄', label: 'Snow' },
      cold:  { icon: '❅', label: 'Cold' },
      fog:   { icon: '▒', label: 'Foggy' },
    };
    return map[G.weather.type] || { icon: '○', label: G.weather.label };
  }

  // ── SCENE CANVAS (static, no animation) ────────────────────────────
  const PALETTES = {
    shire:    { sky:'#9dd3e8', ground:'#5a8a3a', horizon:'#3a6a1a' },
    plains:   { sky:'#9dd3e8', ground:'#8a9a4a', horizon:'#5a7a2a' },
    mountain: { sky:'#7a9ab0', ground:'#6a6a58', horizon:'#3a3a4a' },
    forest:   { sky:'#7abaa0', ground:'#2a5a2a', horizon:'#1a3a1a' },
    river:    { sky:'#9dd3e8', ground:'#5a8a3a', water:'#3a6a9a', horizon:'#3a6a1a' },
    marsh:    { sky:'#8a9a7a', ground:'#4a5a3a', water:'#2a3a2a', horizon:'#2a3a1a' },
    dark:     { sky:'#1a1a2a', ground:'#1a1408', horizon:'#2a1a08' },
    mordor:   { sky:'#3a1a0a', ground:'#2a1a0a', horizon:'#6a3a0a' },
  };

  function paletteFor(loc) {
    const l = (loc || '').toLowerCase();
    if (/mordor|doom|gates|gorgoroth/.test(l))         return 'mordor';
    if (/moria|mines/.test(l))                          return 'dark';
    if (/mountain|misty|caradhras|redhorn|white/.test(l))return 'mountain';
    if (/forest|fangorn|lothlórien|lothlorien/.test(l))  return 'forest';
    if (/marsh|midgewater|dead/.test(l))                return 'marsh';
    if (/river|brandywine|hoarwell|anduin|bruinen|ford/.test(l)) return 'river';
    if (/bree|edoras|minas|rohan|pelennor/.test(l))     return 'plains';
    return 'shire';
  }

  function drawScene() {
    const c = el('scene-canvas');
    if (!c) return;
    const ctx = c.getContext('2d');
    const W = c.width, H = c.height;
    const key = paletteFor(G.location);
    const p = PALETTES[key];

    // Sky
    const sg = ctx.createLinearGradient(0, 0, 0, H * 0.65);
    sg.addColorStop(0, p.sky);
    sg.addColorStop(1, shade(p.sky, -25));
    ctx.fillStyle = sg; ctx.fillRect(0, 0, W, H * 0.65);

    // Sun
    ctx.fillStyle = key === 'mordor' ? 'rgba(255,60,0,0.7)' : (key === 'dark' ? 'rgba(200,200,255,0.4)' : 'rgba(255,240,180,0.9)');
    ctx.beginPath(); ctx.arc(W * 0.78, H * 0.22, 16, 0, Math.PI * 2); ctx.fill();

    // Mountains if mountain scene
    if (key === 'mountain') {
      ctx.fillStyle = shade(p.horizon, 20);
      for (let i = 0; i < 6; i++) {
        const mx = i * (W / 5) - 30;
        ctx.beginPath();
        ctx.moveTo(mx, H * 0.65);
        ctx.lineTo(mx + 60, H * 0.25);
        ctx.lineTo(mx + 120, H * 0.65);
        ctx.closePath(); ctx.fill();
      }
    }

    // Trees if forest
    if (key === 'forest') {
      ctx.fillStyle = shade(p.horizon, -10);
      for (let i = 0; i < 12; i++) {
        const tx = i * (W / 11);
        ctx.beginPath();
        ctx.moveTo(tx, H * 0.65);
        ctx.lineTo(tx + 14, H * 0.35);
        ctx.lineTo(tx + 28, H * 0.65);
        ctx.closePath(); ctx.fill();
      }
    }

    // Horizon
    ctx.fillStyle = p.horizon;
    ctx.fillRect(0, H * 0.60, W, H * 0.08);

    // Ground
    const gg = ctx.createLinearGradient(0, H * 0.65, 0, H);
    gg.addColorStop(0, p.ground);
    gg.addColorStop(1, shade(p.ground, -30));
    ctx.fillStyle = gg; ctx.fillRect(0, H * 0.65, W, H * 0.35);

    // Water
    if (p.water) {
      ctx.fillStyle = p.water;
      ctx.fillRect(0, H * 0.55, W, H * 0.15);
    }

    // Road
    if (key !== 'mordor' && key !== 'dark') {
      ctx.fillStyle = shade(p.ground, -15);
      ctx.beginPath();
      ctx.moveTo(W * 0.2, H);
      ctx.lineTo(W * 0.45, H * 0.67);
      ctx.lineTo(W * 0.55, H * 0.67);
      ctx.lineTo(W * 0.8, H);
      ctx.closePath(); ctx.fill();
    }

    // Mordor glow
    if (key === 'mordor') {
      const rg = ctx.createRadialGradient(W * 0.85, H * 0.7, 0, W * 0.85, H * 0.7, H * 0.8);
      rg.addColorStop(0, 'rgba(255,60,0,0.6)');
      rg.addColorStop(1, 'rgba(255,60,0,0)');
      ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
    }

    // Label
    el('scene-label').textContent = G.location;
  }

  function shade(hex, amt) {
    const n = parseInt(hex.replace('#', ''), 16);
    const r = clamp((n >> 16) + amt, 0, 255);
    const g = clamp(((n >> 8) & 0xff) + amt, 0, 255);
    const b = clamp((n & 0xff) + amt, 0, 255);
    return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
  }

  // ── MOVING FLAG (for Status text only) ─────────────────────────────
  let _moving = false;
  function setMoving(on) { _moving = on; updateConditions(); }

  // ── LOG ────────────────────────────────────────────────────────────
  let _lastDate = null;
  function log(text, cls) {
    const logEl = el('log');
    // Insert date header if date changed
    const today = gameDate();
    if (today !== _lastDate) {
      _lastDate = today;
      const d = document.createElement('div');
      d.className = 'log-date';
      d.textContent = today.toUpperCase();
      logEl.appendChild(d);
    }
    const d = document.createElement('div');
    d.className = 'log-line' + (cls ? ' log-' + cls : '');
    d.textContent = text;
    logEl.appendChild(d);
    logEl.scrollTop = logEl.scrollHeight;
  }

  function logClear() {
    el('log').innerHTML = '';
    _lastDate = null;
  }

  // ── DECISION PANEL (inline, replaces log) ──────────────────────────
  function showDecision(title, body, choices) {
    const dec = el('decision');
    const logEl = el('log');
    logEl.classList.add('hidden');
    dec.classList.remove('hidden');

    const html =
      '<div class="dec-title">' + title + '</div>' +
      (body ? '<div class="dec-body">' + body + '</div>' : '') +
      '<ul class="dec-list">' +
      choices.map((c, i) => {
        const disabled = c.disabled ? ' disabled' : '';
        const note = typeof c.note === 'function' ? c.note(G) : c.note;
        return '<li><button class="dec-btn"' + disabled +
          ' onclick="Game._pickDecision(' + i + ')">' +
          '<span class="dec-num">' + (i + 1) + '.</span>' +
          '<span class="dec-lbl">' + c.label + '</span>' +
          (note ? '<span class="dec-note">' + note + '</span>' : '') +
          '</button></li>';
      }).join('') +
      '</ul>';
    dec.innerHTML = html;

    // Disable continue/timeout during decision
    el('btn-continue').disabled = true;
    el('btn-timeout').disabled  = true;
  }

  function hideDecision() {
    const dec = el('decision');
    const logEl = el('log');
    dec.classList.add('hidden');
    dec.innerHTML = '';
    logEl.classList.remove('hidden');
    el('btn-continue').disabled = false;
    el('btn-timeout').disabled  = false;
  }

  // ── MODAL ──────────────────────────────────────────────────────────
  let _modalLock = false;

  function showModal(title, bodyHtml, footerHtml, lock) {
    _modalLock = !!lock;
    el('modal-box').innerHTML =
      '<div class="modal-header">' + title +
      (lock ? '' : '<button class="modal-x" onclick="UI.closeModal()">×</button>') +
      '</div>' +
      '<div class="modal-body">' + bodyHtml + '</div>' +
      (footerHtml ? '<div class="modal-footer">' + footerHtml + '</div>' : '');
    el('modal').classList.remove('hidden');
  }

  function closeModal() {
    el('modal').classList.add('hidden');
    el('modal-box').innerHTML = '';
    _modalLock = false;
  }

  function bgClose(e) {
    if (!_modalLock && e.target === el('modal')) closeModal();
  }

  // ── CONTINUE/TIMEOUT BUTTONS ───────────────────────────────────────
  function setContinueLabel(lbl) { el('btn-continue').textContent = lbl; }
  function setContinueEnabled(on) { el('btn-continue').disabled = !on; }
  function setTimeOutEnabled(on) { el('btn-timeout').disabled = !on; }

  // ── INIT ───────────────────────────────────────────────────────────
  function init() {
    drawScene();
    updateConditions();
  }

  return {
    updateConditions, drawScene, setMoving,
    log, logClear,
    showDecision, hideDecision,
    showModal, closeModal, bgClose,
    setContinueLabel, setContinueEnabled, setTimeOutEnabled,
    init,
  };
})();

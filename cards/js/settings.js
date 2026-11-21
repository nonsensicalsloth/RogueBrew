// settings.js — the Settings screen (gear on the title screen)
//   • Animations on/off, game speed, screen shake, keyword tips, larger card text
//   • Save data: export to a file, import from a file, erase everything
// Settings live in their own key so erasing progress can keep them if you like.

const SETTINGS_KEY = 'wortcraft_settings';
const SAVE_FORMAT  = 1;              // bump when the save layout changes
const FAST_SPEED   = 0.45;           // Fast mode runs timers at this fraction
const SETTING_DEFAULTS = { anim: true, speed: 'normal', shake: true, tips: true, bigText: false };

const SETTING_ROWS = [
  { key: 'anim',    label: 'Animations',       hint: 'Card flights, floating numbers, banners and the judging tally.', opts: [[true, 'ON'], [false, 'OFF']] },
  { key: 'speed',   label: 'Game speed',       hint: 'How quickly the rival plays and the tally counts up.',           opts: [['normal', 'NORMAL'], ['fast', 'FAST']] },
  { key: 'shake',   label: 'Screen shake',     hint: 'The board shakes on Burnt, Stuck Mash and big hits.',            opts: [[true, 'ON'], [false, 'OFF']] },
  { key: 'tips',    label: 'Keyword tips',     hint: 'Hover (or tap on a phone) a keyword or tag to read what it does.', opts: [[true, 'ON'], [false, 'OFF']] },
  { key: 'bigText', label: 'Larger card text', hint: 'Bigger rules text on cards, handy on small screens.',           opts: [[true, 'ON'], [false, 'OFF']] },
];

let SETTINGS = loadSettings();

function loadSettings() {
  let s = {};
  try { s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') || {}; } catch (e) { s = {}; }
  return Object.assign({}, SETTING_DEFAULTS, s);
}
function saveSettings() {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(SETTINGS)); } catch (e) {}
}
function setSetting(key, val) {
  SETTINGS[key] = val;
  saveSettings();
  applySettings();
  renderSettings();
}

// Timers scale with game speed. Use for any wait the player sits through.
function speedMs(ms) { return SETTINGS.speed === 'fast' ? Math.round(ms * FAST_SPEED) : ms; }

function applySettings() {
  if (typeof document === 'undefined' || !document.body) return;
  const b = document.body.classList;
  b.toggle('set-no-anim',  !SETTINGS.anim);
  b.toggle('set-no-shake', !SETTINGS.shake);
  b.toggle('set-no-tips',  !SETTINGS.tips);
  b.toggle('set-big-text', !!SETTINGS.bigText);
  if (!SETTINGS.tips) { const t = document.getElementById('kw-tip'); if (t) t.style.display = 'none'; }
}

// ── Screen ──

function showSettings() {
  setScreen('settings-screen');
  _eraseArmed = false;
  renderSettings();
}

function renderSettings() {
  const box = document.getElementById('settings-body');
  if (!box) return;
  const rows = SETTING_ROWS.map(r => `
    <div class="set-row">
      <div class="set-text"><div class="set-label">${r.label}</div><div class="set-hint">${r.hint}</div></div>
      <div class="set-opts">${r.opts.map(([v, txt]) =>
        `<button class="set-opt${SETTINGS[r.key] === v ? ' on' : ''}" onclick='setSetting("${r.key}", ${JSON.stringify(v)})'>${txt}</button>`).join('')}</div>
    </div>`).join('');
  box.innerHTML = `
    <div class="set-group">GAMEPLAY</div>${rows}
    <div class="set-group">SAVE DATA</div>
    <div class="set-row">
      <div class="set-text"><div class="set-label">Move your save</div><div class="set-hint">Export a save file here, then import it on another device or browser. Includes decks, collection, unlocks, achievements and any run in progress.</div></div>
      <div class="set-opts"><button class="set-opt" onclick="exportSave()">EXPORT</button><button class="set-opt" onclick="document.getElementById('import-file').click()">IMPORT</button></div>
    </div>
    <div class="set-row">
      <div class="set-text"><div class="set-label">Erase all progress</div><div class="set-hint">Deletes decks, collection, unlocks, achievements and your current run. Settings stay. This cannot be undone.</div></div>
      <div class="set-opts"><button class="set-opt set-danger${_eraseArmed ? ' armed' : ''}" onclick="eraseProgress()">${_eraseArmed ? 'TAP AGAIN TO ERASE' : 'ERASE'}</button></div>
    </div>
    <div id="set-msg" class="set-msg">${_setMsg}</div>`;
  _setMsg = '';
}
let _setMsg = '';
function settingsMsg(txt) { _setMsg = txt; renderSettings(); }

// ── Save data ──

function saveKeys() {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.indexOf('wortcraft_') === 0 && k !== SETTINGS_KEY) keys.push(k);
  }
  return keys.sort();
}

function buildSaveFile() {
  const data = {};
  saveKeys().forEach(k => { data[k] = localStorage.getItem(k); });
  return { game: 'wortcraft', format: SAVE_FORMAT, exported: new Date().toISOString(),
           cards: typeof CARDS_VERSION !== 'undefined' ? CARDS_VERSION : '', data };
}

function exportSave() {
  const file = buildSaveFile();
  const blob = new Blob([JSON.stringify(file)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `wortcraft-save-${file.exported.slice(0, 10)}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  settingsMsg('Save exported. Look for it in your downloads.');
}

// Returns an error message, or '' when it worked
function applySaveFile(file) {
  if (!file || file.game !== 'wortcraft' || typeof file.data !== 'object' || !file.data) return "That file isn't a Wortcraft save.";
  if (typeof file.format !== 'number' || file.format > SAVE_FORMAT) return 'That save comes from a newer version of the game. Refresh the page and try again.';
  const keys = Object.keys(file.data).filter(k => k.indexOf('wortcraft_') === 0 && k !== SETTINGS_KEY && typeof file.data[k] === 'string');
  if (!keys.length) return 'That save file is empty.';
  saveKeys().forEach(k => localStorage.removeItem(k));
  keys.forEach(k => localStorage.setItem(k, file.data[k]));
  return '';
}

function importSaveFrom(input) {
  const f = input.files && input.files[0];
  input.value = '';
  if (!f) return;
  const rd = new FileReader();
  rd.onload = () => {
    let parsed = null;
    try { parsed = JSON.parse(rd.result); } catch (e) {}
    const err = applySaveFile(parsed);
    if (err) { settingsMsg(err); return; }
    settingsMsg('Save imported. Reloading...');
    setTimeout(() => location.reload(), 700);
  };
  rd.readAsText(f);
}

let _eraseArmed = false, _eraseT = null;
function eraseProgress() {
  if (!_eraseArmed) {
    _eraseArmed = true;
    renderSettings();
    clearTimeout(_eraseT);
    _eraseT = setTimeout(() => { _eraseArmed = false; if (document.getElementById('settings-screen').classList.contains('active')) renderSettings(); }, 4000);
    return;
  }
  clearTimeout(_eraseT);
  _eraseArmed = false;
  saveKeys().forEach(k => localStorage.removeItem(k));
  settingsMsg('Progress erased. Reloading...');
  setTimeout(() => location.reload(), 700);
}

if (typeof document !== 'undefined') {
  if (document.body) applySettings(); else document.addEventListener('DOMContentLoaded', applySettings);
}

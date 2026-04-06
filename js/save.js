// save.js - Run persistence (anti-save-scum auto-save system)
//
// TWO save slots:
//   'roguebrew_run'        — current in-progress run (wiped on win/loss/new run)
//   poke_dex / poke_shiny_dex / poke_achievements / poke_hall_of_fame / poke_elite_wins
//                          — persistent meta-progress (never wiped by this file)
//
// Save is called AFTER every irreversible player decision so refreshing
// puts you back exactly where you committed, not before.

const RUN_SAVE_KEY = 'roguebrew_run';

// ─── Serialise ────────────────────────────────────────────────────────────────

function serializeRun() {
  // state.modifiers is a Set — convert to array for JSON
  const modifiersArr = state.modifiers ? [...state.modifiers] : [];

  // Map nodes / edges need special handling: visited/accessible flags live on
  // node objects inside state.map.nodes; layers/edges are plain arrays.
  const mapData = state.map ? {
    mapIndex: state.map.mapIndex,
    layers: state.map.layers,
    edges: state.map.edges,
    nodes: state.map.nodes,   // includes visited/accessible/revealed flags
  } : null;

  return {
    version: 2,
    currentMap: state.currentMap,
    currentNodeId: state.currentNode ? state.currentNode.id : null,
    team: state.team,
    items: state.items,
    badges: state.badges,
    eliteIndex: state.eliteIndex,
    trainer: state.trainer,
    starterSpeciesId: state.starterSpeciesId,
    maxTeamSize: state.maxTeamSize,
    hardMode: state.hardMode,
    breweryName: state.breweryName,
    perfectQC: state.perfectQC,
    stuckStandingPending: state.stuckStandingPending,
    modifiers: modifiersArr,
    nuzlockePerfect: state.nuzlockePerfect,
    rivalId: state.rivalId || null,
    map: mapData,
    // Which screen the player was on so we can route them back
    activeScreen: getCurrentActiveScreen(),
  };
}

function getCurrentActiveScreen() {
  const active = document.querySelector('.screen.active');
  return active ? active.id : null;
}

// ─── Save ─────────────────────────────────────────────────────────────────────

function saveRun() {
  try {
    localStorage.setItem(RUN_SAVE_KEY, JSON.stringify(serializeRun()));
  } catch (e) {
    console.warn('[RogueBrew] Could not save run:', e);
  }
}

function clearRun() {
  try {
    localStorage.removeItem(RUN_SAVE_KEY);
  } catch (e) {}
}

// ─── Restore ──────────────────────────────────────────────────────────────────

function hasSavedRun() {
  try {
    const raw = localStorage.getItem(RUN_SAVE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    // Must have a map and at least one team member to be worth restoring
    return !!(data && data.map && data.team && data.team.length > 0);
  } catch (e) {
    return false;
  }
}

// Restore state from localStorage. Returns true if successful.
function restoreRun() {
  try {
    const raw = localStorage.getItem(RUN_SAVE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (!data || !data.map || !data.team || data.team.length === 0) return false;

    // Rebuild modifiers Set
    const mods = new Set(Array.isArray(data.modifiers) ? data.modifiers : []);

    // Restore map — reconstruct node references
    const mapData = data.map;
    const restoredMap = {
      mapIndex: mapData.mapIndex,
      layers: mapData.layers,
      edges: mapData.edges,
      nodes: mapData.nodes,
    };

    state.currentMap           = data.currentMap;
    state.team                 = data.team;
    state.items                = data.items || [];
    state.badges               = data.badges || 0;
    state.eliteIndex           = data.eliteIndex || 0;
    state.trainer              = data.trainer || 'boy';
    state.starterSpeciesId     = data.starterSpeciesId || null;
    state.maxTeamSize          = data.maxTeamSize || 1;
    state.hardMode             = !!data.hardMode;
    state.breweryName          = data.breweryName || 'Nonsense Sloth Co.';
    state.perfectQC            = data.perfectQC !== undefined ? data.perfectQC : true;
    state.stuckStandingPending = !!data.stuckStandingPending;
    state.modifiers            = mods;
    state.nuzlockePerfect      = data.nuzlockePerfect !== undefined ? data.nuzlockePerfect : true;
    state.rivalId              = data.rivalId || RIVAL_BREWERIES[0].id;
    state.map                  = restoredMap;
    state.currentNode          = data.currentNodeId
      ? restoredMap.nodes[data.currentNodeId]
      : null;

    return true;
  } catch (e) {
    console.warn('[RogueBrew] Could not restore run:', e);
    return false;
  }
}

// ─── Resume ───────────────────────────────────────────────────────────────────
// Called by initGame() when a save exists. Routes the player back to the map.
// We always drop them to the map screen (the safest recovery point) rather
// than trying to recreate a mid-battle or mid-event state.

async function resumeSavedRun() {
  const ok = restoreRun();
  if (!ok) return false;
  showMapScreen();
  showMapNotification('🍺 Run restored — right where you left off.');
  return true;
}

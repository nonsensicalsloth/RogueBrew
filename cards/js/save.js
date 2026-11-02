// save.js — save the run in progress so a refresh (or closing the tab) doesn't lose it
//
// Like Slay the Spire, the game saves at safe points rather than mid-action:
//   • on the map                     → resume on the map
//   • when you step onto a node      → resume by re-entering that node (a battle restarts)
//   • after winning a battle         → resume on the reward / relic / act screen
// Finishing or losing the run deletes the save.

const RUN_SAVE_KEY = 'wortcraft_run';
const RUN_SAVE_VERSION = 1;

function saveRun(resume) {
  if (typeof mapState === 'undefined' || !mapState || !mapState.nodes) return;
  const data = {
    v: RUN_SAVE_VERSION,
    savedAt: Date.now(),
    draft: {
      breweryId: draftState.brewery ? draftState.brewery.id : null,
      deckIndex: draftState.deckIndex,
      deck:      draftState.deck,
    },
    // The current node is stored by id; it's re-linked to the node object on load
    map: { ...mapState, currentNode: mapState.currentNode ? mapState.currentNode.id : null },
    resume,
  };
  try { localStorage.setItem(RUN_SAVE_KEY, JSON.stringify(data)); } catch (e) {}
}

function loadRunData() {
  try {
    const raw  = localStorage.getItem(RUN_SAVE_KEY);
    const data = raw ? JSON.parse(raw) : null;
    return data && data.v === RUN_SAVE_VERSION ? data : null;
  } catch (e) { return null; }
}

function hasSavedRun() {
  return !!loadRunData();
}

function clearRun() {
  try { localStorage.removeItem(RUN_SAVE_KEY); } catch (e) {}
}

function findNodeById(id) {
  if (!id) return null;
  for (const act of mapState.nodes) for (const layer of act) for (const n of layer) if (n.id === id) return n;
  return null;
}

function savedRunSummary() {
  const d = loadRunData();
  if (!d) return '';
  const m = d.map;
  return `Act ${m.act + 1} · ⭐ ${m.rep}/${m.maxRep} · 💰 ${m.gold} · 🃏 ${d.draft.deck.length}`;
}

function continueRun() {
  const d = loadRunData();
  if (!d) { showTitleScreen(); return; }

  draftState.deck      = d.draft.deck;
  draftState.deckIndex = d.draft.deckIndex;
  draftState.brewery   = BREWERIES.find(b => b.id === d.draft.breweryId) || null;
  mapState             = d.map;
  mapState.currentNode = findNodeById(d.map.currentNode);

  const r = d.resume || { screen: 'map' };
  switch (r.screen) {
    case 'node': {
      const node = findNodeById(r.nodeId);
      if (node) { handleNode(node); return; }
      break;
    }
    case 'reward': {
      const node = findNodeById(r.nodeId);
      if (node) { showBattleReward(node, r.gold || 0); return; }
      break;
    }
    case 'relic': showRelicChoice(r.gold || 0); return;
    case 'act':   showActTransition(r.gold || 0); return;
  }
  showMapScreen();
}

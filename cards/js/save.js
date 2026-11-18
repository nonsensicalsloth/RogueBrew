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

// A saved run stores full card copies, so a card that was rebalanced since the
// run started would keep its old cost and points. Rebuild each card from the
// current definition, then re-apply what the run did to it (upgrades, aging).
// Quality Lab: show a propagated yeast's real growth on the card ("+2 per turn" becomes "+3 per turn")
function propagatedDesc(desc) {
  const n = typeof PROP_GROWTH !== 'undefined' ? PROP_GROWTH : 1;
  const bump = (m, a) => `+${Number(a) + n}`;
  if (/\+\d+ per turn instead of \+\d+/.test(desc))
    return desc.replace(/\+(\d+)( per turn instead of )\+(\d+)/, (m, a, mid, b) => `+${Number(a) + n}${mid}+${Number(b) + n}`) + ' (propagated)';
  if (/\+\d+ per turn/.test(desc)) return desc.replace(/\+(\d+)(?= per turn)/, bump) + ' (propagated)';
  return `${desc} Propagated: +${n} more per turn.`;
}

function refreshRunCard(c) {
  const def = getCardDef(c.id);
  if (!def) return c;                     // retired card: leave as-is
  const fresh = { ...def, tags: [...(def.tags || [])] };
  if (c._upgraded) {
    fresh.points += c._upgradeBonus || REST_UPGRADE;
    fresh._upgradeBonus = c._upgradeBonus || REST_UPGRADE;
    fresh._upgraded = true;
  }
  if (c._barrelAged) {
    fresh.points += BARREL_BONUS;
    fresh.name = `Barrel-Aged ${def.name}`;
    fresh.tags.push('oaky');
    fresh._barrelAged = true;
  }
  if (c._victoryBonus) {
    fresh.points += c._victoryBonus;
    fresh._victoryBonus = c._victoryBonus;
  }
  if (c._barrelReturn !== undefined) fresh._barrelReturn = c._barrelReturn;
  // Quality Lab: propagated yeast, Sensory Panel tag
  if (c._propagated) {
    fresh._propagated = true;
    fresh.desc = propagatedDesc(fresh.desc);
  }
  if (c._panelTag) {
    fresh._panelTag = c._panelTag;
    if (!fresh.tags.includes(c._panelTag)) fresh.tags.push(c._panelTag);
  }
  return fresh;
}

function continueRun() {
  const d = loadRunData();
  if (!d) { showTitleScreen(); return; }

  draftState.deck      = d.draft.deck.map(refreshRunCard);
  draftState.deckIndex = d.draft.deckIndex;
  draftState.brewery   = BREWERIES.find(b => b.id === d.draft.breweryId) || null;
  mapState             = d.map;
  mapState.barrel      = (mapState.barrel || []).map(refreshRunCard);
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
    case 'disaster': {
      const relic = r.relic ? RELICS.find(x => x.id === r.relic) : null;
      showDisasterResult({ score: r.score, tier: r.tier, gold: r.gold, relic, offerKind: r.offerKind });
      return;
    }
    case 'act':   showActTransition(r.gold || 0); return;
  }
  showMapScreen();
}

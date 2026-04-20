// ═══════════════════════════════════════════ MAP SYSTEM
// Renders the Middle-earth map with path lines and a moving position dot.
// Coordinates are pixel positions on map.jpg (5517×4384).

const MAP_W = 5517;
const MAP_H = 4384;

// ── PATH DEFINITIONS ────────────────────────────────────────────────
// Each path segment is: { from, to, points: [[x,y],...], route? }
// 'route' is optional — if set, this segment only shows if G.pathFlags.route matches
// or if specific flags match.

const MAP_PATHS = {
  // === MAIN ROAD: SHIRE → BRANDYWINE ===
  shire_road: {
    from: 'The Shire', to: 'Brandywine River',
    arrivalPoint: 'bridge',
    points: [[325,917],[441,907],[531,865],[589,851]],
  },
  shire_xc: {
    from: 'The Shire', to: 'Brandywine River',
    arrivalPoint: 'ferry_landing',
    points: [[325,917],[435,967],[591,969]],
  },

  // === BRANDYWINE → BREE ===
  bwy_road: {
    from: 'Brandywine River', to: 'Bree',
    pathFlag: '_roadToBree',
    points: [[589,851],[630,855],[676,835],[803,831],[860,853],[913,914]],
  },
  old_forest: {
    from: 'Brandywine River', to: 'Bree',
    pathFlag: '_forestToBree',
    points: [[591,969],[625,965],[669,941],[753,966],[775,919],[913,914]],
  },
  barrow_downs: {
    from: 'Brandywine River', to: 'Bree',
    pathFlag: '_barrowDownsVisited',
    points: [[753,966],[762,1041],[833,985],[775,919]],
    style: 'detour',
  },

  // === BREE → WEATHERTOP ===
  bree_east_road: {
    from: 'Bree', to: 'Weathertop',
    pathFlag: '_roadToWT',
    points: [[913,914],[1074,893],[1287,891],[1282,837]],
  },
  midgewater: {
    from: 'Bree', to: 'Weathertop',
    pathFlag: '_marshToWT',
    points: [[913,914],[1053,833],[1221,793],[1282,837]],
  },

  // === WEATHERTOP → HOARWELL ===
  wt_road: {
    from: 'Weathertop', to: 'Hoarwell River',
    arrivalPoint: 'last_bridge',
    points: [[1282,837],[1327,883],[1527,813],[1633,806],[1696,813]],
  },
  wt_wild: {
    from: 'Weathertop', to: 'Hoarwell River',
    arrivalPoint: 'upstream',
    points: [[1282,837],[1341,755],[1566,806],[1681,665],[1750,653]],
  },

  // === HOARWELL → TROLLSHAWS → BRUINEN → RIVENDELL (shared) ===
  // Two entry points converge at Trollshaws
  hoarwell_bridge_to_trollshaws: {
    from: 'Hoarwell River', to: 'Trollshaws',
    points: [[1696,813],[1759,825]],
  },
  hoarwell_upstream_to_trollshaws: {
    from: 'Hoarwell River', to: 'Trollshaws',
    points: [[1750,653],[1759,825]],
  },
  trollshaws_to_rivendell: {
    from: 'Trollshaws', to: 'Rivendell',
    points: [[1759,825],[1906,847],[2052,868],[2118,830]],
  },

  // === RIVENDELL → REDHORN (Path 1) ===
  riv_to_redhorn: {
    from: 'Rivendell', to: 'Redhorn Gate',
    route: 'redhorn',
    points: [[2118,830],[2085,1058],[1929,1260],[2012,1409],[2042,1392]],
  },
  redhorn_to_lorien: {
    from: 'Redhorn Gate', to: 'Lothlórien',
    route: 'redhorn',
    points: [[2042,1392],[2088,1377],[2120,1461],[2258,1608],[2364,1715]],
  },

  // === RIVENDELL → MORIA (Path 2) ===
  riv_to_moria: {
    from: 'Rivendell', to: 'West-gate of Moria',
    route: 'moria',
    points: [[2118,830],[2085,1058],[1929,1260],[1916,1529],[2009,1508]],
  },
  moria_to_lorien: {
    from: 'West-gate of Moria', to: 'Lothlórien',
    route: 'moria',
    points: [[2009,1508],[2051,1505],[2109,1515],[2234,1661],[2364,1715]],
  },

  // === RIVENDELL → GAP OF ROHAN (Path 3) ===
  riv_to_glanduin: {
    from: 'Rivendell', to: 'Glanduin',
    route: 'gap',
    points: [[2118,830],[2085,1058],[1929,1260],[1878,1574],[1808,1592]],
  },
  glanduin_to_isen: {
    from: 'Glanduin', to: 'Fords of Isen',
    route: 'gap',
    points: [[1808,1592],[1661,2000],[1512,2156],[1533,2466],[1649,2555],[1782,2561]],
  },
  isen_to_edoras: {
    from: 'Fords of Isen', to: 'Edoras',
    route: 'gap',
    points: [[1782,2561],[1870,2627],[2051,2725],[2182,2856]],
  },

  // === LOTHLÓRIEN → ANDUIN PATH ===
  lorien_to_argonath: {
    from: 'Lothlórien', to: 'Argonath',
    route: 'anduin',
    points: [[2364,1715],[2493,1745],[2539,1856],[2779,1993],[2742,2113],
             [2784,2157],[2885,2125],[2910,2180],[2827,2255],[2905,2327],
             [2919,2415],[2874,2522],[2905,2655],[2925,2695]],
  },
  argonath_to_edoras: {
    from: 'Argonath', to: 'Edoras',
    route: 'anduin',
    points: [[2925,2695],[2759,2723],[2485,2854],[2182,2856]],
  },

  // === LOTHLÓRIEN → FANGORN PATH ===
  lorien_to_fangorn: {
    from: 'Lothlórien', to: 'Fangorn',
    route: 'fangorn',
    points: [[2364,1715],[2307,1890],[2228,1979],[2129,2169],[2172,2345]],
  },
  fangorn_to_edoras: {
    from: 'Fangorn', to: 'Edoras',
    route: 'fangorn',
    points: [[2172,2345],[2043,2559],[2182,2856]],
  },

  // === EDORAS → MINAS TIRITH ===
  edoras_to_mt: {
    from: 'Edoras', to: 'Minas Tirith',
    points: [[2182,2856],[2326,2986],[2398,3030],[2551,3097],[2643,3143],
             [2959,3172],[3259,3273],[3288,3320]],
  },

  // === MORDOR PATH A: NORTH ===
  mt_to_deadmarshes: {
    from: 'Minas Tirith', to: 'Dead Marshes',
    route: 'morannon',
    points: [[3288,3320],[3365,3141],[3297,2771]],
  },
  deadmarshes_to_gate: {
    from: 'Dead Marshes', to: 'Black Gate',
    route: 'morannon',
    points: [[3297,2771],[3548,2792]],
  },
  gate_to_doom: {
    from: 'Black Gate', to: 'Mount Doom',
    route: 'morannon',
    points: [[3548,2792],[3683,3142],[3808,3123]],
  },

  // === MORDOR PATH B: EAST ===
  mt_to_morgul: {
    from: 'Minas Tirith', to: 'Minas Morgul',
    route: 'cirith',
    points: [[3288,3320],[3425,3282],[3473,3271]],
  },
  morgul_to_ungol: {
    from: 'Minas Morgul', to: 'Cirith Ungol',
    route: 'cirith',
    points: [[3473,3271],[3567,3252]],
  },
  ungol_to_doom: {
    from: 'Cirith Ungol', to: 'Mount Doom',
    route: 'cirith',
    points: [[3567,3252],[3796,3226],[3808,3123]],
  },

  // === MORDOR PATH C: SOUTH ===
  mt_to_poros: {
    from: 'Minas Tirith', to: 'Crossings of Poros',
    route: 'nargil',
    points: [[3288,3320],[3311,3360],[3396,3587],[3383,3899]],
  },
  poros_to_nargil: {
    from: 'Crossings of Poros', to: 'Nargil Pass',
    route: 'nargil',
    points: [[3383,3899],[3530,4194],[4194,4188],[4221,4148]],
  },
  nargil_to_nurn: {
    from: 'Nargil Pass', to: 'Nurn',
    route: 'nargil',
    points: [[4221,4148],[4110,3699]],
  },
  nurn_to_doom: {
    from: 'Nurn', to: 'Mount Doom',
    route: 'nargil',
    points: [[4110,3699],[3966,3524],[3808,3123]],
  },
};

// ── LANDMARK PIXEL POSITIONS (for the dot) ──────────────────────────
// Derived from the path endpoints. Used to place the dot when exactly at a landmark.
const MAP_LANDMARK_PX = {
  'The Shire':          [325, 917],
  'Brandywine River':   [589, 851],  // bridge default; ferry is [591,969]
  'Bree':               [913, 914],
  'Weathertop':         [1282, 837],
  'Hoarwell River':     [1696, 813],
  'Trollshaws':         [1759, 825],
  'Ford of Bruinen':    [2052, 868],
  'Rivendell':          [2118, 830],
  'Redhorn Gate':       [2042, 1392],
  'Caradhras Pass':     [2088, 1377],
  'West-gate of Moria': [2009, 1508],
  'Khazad-dûm':         [2051, 1505],
  'Glanduin':           [1808, 1592],
  'Fords of Isen':      [1782, 2561],
  'Lothlórien':         [2364, 1715],
  'Argonath':           [2925, 2695],
  'Entwash':            [2485, 2854],
  'Fangorn':            [2172, 2345],
  'Edoras':             [2182, 2856],
  'Minas Tirith':       [3288, 3320],
  'Dead Marshes':       [3297, 2771],
  'Black Gate':         [3548, 2792],
  'Minas Morgul':       [3473, 3271],
  'Cirith Ungol':       [3567, 3252],
  'Crossings of Poros': [3383, 3899],
  'Nargil Pass':        [4221, 4148],
  'Nurn':               [4110, 3699],
  'Plateau of Gorgoroth': [3683, 3142],
  'Mount Doom':         [3808, 3123],
};

// ── DETERMINE WHICH SEGMENTS TO DRAW ────────────────────────────────
// Returns an array of { points, traveled, active } objects.
// 'traveled' = fully completed segment (solid line).
// 'active' = currently traveling this segment (partial line + dot).
function getVisibleSegments() {
  const segs = [];
  const visited = []; // landmark names we've passed through

  // Build the ordered list of segments the player has traveled or is traveling.
  // Walk through MAP_PATHS and match against game state.
  for (const [key, seg] of Object.entries(MAP_PATHS)) {
    // Skip route-specific segments that don't match the player's chosen route
    if (seg.route && G.pathFlags.route !== seg.route) continue;

    // Skip arrival-point segments that don't match
    if (seg.arrivalPoint) {
      if (seg.from === 'The Shire') {
        const usedRoad = G.arrivalPoint === 'bridge' || G.pathFlags.brandywineCrossingPoint === 'bridge';
        const usedXC = G.arrivalPoint === 'ferry_landing' || G.pathFlags.brandywineCrossingPoint === 'ferry';
        if (seg.arrivalPoint === 'bridge' && !usedRoad) continue;
        if (seg.arrivalPoint === 'ferry_landing' && !usedXC) continue;
      }
      if (seg.from === 'Weathertop' || seg.from === 'Weathertop East') {
        if (seg.arrivalPoint === 'last_bridge' && G.pathFlags.hoarwellCrossingPoint !== 'bridge' && G.arrivalPoint !== 'last_bridge') continue;
        if (seg.arrivalPoint === 'upstream' && G.pathFlags.hoarwellCrossingPoint !== 'ford' && G.arrivalPoint !== 'upstream') continue;
      }
    }

    // Skip detour-style paths (Barrow Downs) unless the flag is set
    if (seg.style === 'detour') {
      if (!G.pathFlags._sentToBarrowDowns) continue;
    }

    // Skip pathFlag-gated segments
    if (seg.pathFlag) {
      // These are for road-vs-forest choices at Brandywine East Bank / Bree East
      // We determine which was taken by checking which route the player walked
      // Simple approach: check if the 'to' landmark has been reached
      // and the path's geographic feel matches
    }

    // Determine if this segment has been traveled, is active, or is future
    const fromLm = LANDMARKS.find(l => l.name === seg.from);
    const toLm = LANDMARKS.find(l => l.name === seg.to);
    if (!fromLm || !toLm) continue;

    const fromMile = fromLm.miles;
    const toMile = toLm.miles;

    if (G.miles >= toMile) {
      // Fully traveled
      segs.push({ points: seg.points, status: 'traveled' });
    } else if (G.miles >= fromMile && G.miles < toMile) {
      // Currently on this segment
      const progress = (G.miles - fromMile) / (toMile - fromMile);
      segs.push({ points: seg.points, status: 'active', progress });
    }
    // else: future segment — don't draw
  }

  return segs;
}

// ── INTERPOLATE POSITION ALONG A POLYLINE ───────────────────────────
function interpolatePolyline(points, t) {
  if (t <= 0) return points[0];
  if (t >= 1) return points[points.length - 1];

  // Compute total length
  let totalLen = 0;
  const segLens = [];
  for (let i = 1; i < points.length; i++) {
    const dx = points[i][0] - points[i-1][0];
    const dy = points[i][1] - points[i-1][1];
    const len = Math.sqrt(dx*dx + dy*dy);
    segLens.push(len);
    totalLen += len;
  }

  let targetLen = t * totalLen;
  for (let i = 0; i < segLens.length; i++) {
    if (targetLen <= segLens[i]) {
      const segT = targetLen / segLens[i];
      return [
        points[i][0] + (points[i+1][0] - points[i][0]) * segT,
        points[i][1] + (points[i+1][1] - points[i][1]) * segT,
      ];
    }
    targetLen -= segLens[i];
  }
  return points[points.length - 1];
}

// ── RENDER THE MAP ──────────────────────────────────────────────────
function renderMap() {
  const segments = getVisibleSegments();

  // Find the player dot position
  let dotPos = MAP_LANDMARK_PX[G.location] || MAP_LANDMARK_PX['The Shire'];

  // If on an active segment, interpolate the dot
  const activeSeg = segments.find(s => s.status === 'active');
  if (activeSeg) {
    dotPos = interpolatePolyline(activeSeg.points, activeSeg.progress);
  }

  // Build SVG overlay — coordinates match the map image
  const lineWidth = 12;
  const dotRadius = 18;

  let svg = '';

  // Draw traveled segments (solid gold line)
  for (const seg of segments) {
    if (seg.status === 'traveled') {
      const d = 'M ' + seg.points.map(p => p[0] + ' ' + p[1]).join(' L ');
      svg += '<path d="' + d + '" stroke="#c4922a" stroke-width="' + lineWidth + '" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.8"/>';
    }
  }

  // Draw active segment (partial — up to the dot)
  if (activeSeg) {
    // Draw full segment faintly
    const dFull = 'M ' + activeSeg.points.map(p => p[0] + ' ' + p[1]).join(' L ');
    svg += '<path d="' + dFull + '" stroke="#c4922a" stroke-width="' + (lineWidth - 2) + '" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.3" stroke-dasharray="20 15"/>';

    // Draw traveled portion solid
    const traveledPts = [];
    const progress = activeSeg.progress;
    let totalLen = 0;
    const segLens = [];
    for (let i = 1; i < activeSeg.points.length; i++) {
      const dx = activeSeg.points[i][0] - activeSeg.points[i-1][0];
      const dy = activeSeg.points[i][1] - activeSeg.points[i-1][1];
      segLens.push(Math.sqrt(dx*dx + dy*dy));
      totalLen += segLens[segLens.length-1];
    }
    let targetLen = progress * totalLen;
    traveledPts.push(activeSeg.points[0]);
    for (let i = 0; i < segLens.length; i++) {
      if (targetLen <= segLens[i]) {
        const segT = targetLen / segLens[i];
        traveledPts.push([
          activeSeg.points[i][0] + (activeSeg.points[i+1][0] - activeSeg.points[i][0]) * segT,
          activeSeg.points[i][1] + (activeSeg.points[i+1][1] - activeSeg.points[i][1]) * segT,
        ]);
        break;
      }
      targetLen -= segLens[i];
      traveledPts.push(activeSeg.points[i+1]);
    }
    if (traveledPts.length >= 2) {
      const dT = 'M ' + traveledPts.map(p => p[0] + ' ' + p[1]).join(' L ');
      svg += '<path d="' + dT + '" stroke="#c4922a" stroke-width="' + lineWidth + '" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.8"/>';
    }
  }

  // Draw player dot
  svg += '<circle cx="' + dotPos[0] + '" cy="' + dotPos[1] + '" r="' + dotRadius + '" fill="#e63946" stroke="#2b1810" stroke-width="5"/>';
  svg += '<circle cx="' + dotPos[0] + '" cy="' + dotPos[1] + '" r="' + (dotRadius + 8) + '" fill="none" stroke="#e63946" stroke-width="3" opacity="0.5"/>';

  // Draw landmark labels for visited places
  for (const [name, pos] of Object.entries(MAP_LANDMARK_PX)) {
    const lm = LANDMARKS.find(l => l.name === name);
    if (!lm || G.miles < lm.miles) continue;
    // Small circle at visited landmarks
    svg += '<circle cx="' + pos[0] + '" cy="' + pos[1] + '" r="8" fill="#2b1810" stroke="#c4922a" stroke-width="3" opacity="0.7"/>';
  }

  return {
    svg: svg,
    dotPos: dotPos,
    mapW: MAP_W,
    mapH: MAP_H,
  };
}

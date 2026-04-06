// map.js - Node map generation and rendering

const NODE_TYPES = {
  START: 'start',
  BATTLE: 'battle',
  CATCH: 'catch',
  ITEM: 'item',
  QUESTION: 'question',
  BOSS: 'boss',
  POKECENTER: 'qclab',
  TRADE: 'trade',
  UPGRADE: 'upgrade',
  MINIBOSS: 'miniboss',
};

const NODE_WEIGHTS = [
  // L1 — no trade yet, team not established
  { battle: 50, catch: 30, item: 20, question: 0,  qclab: 0,  trade: 0,  upgrade: 0 },
  // L2 — no trade yet
  { battle: 40, catch: 25, item: 20, question: 15, qclab: 0,  trade: 0,  upgrade: 0 },
  // L3 — upgrade appears for the first time
  { battle: 30, catch: 13, item: 13, question: 22, qclab: 10, trade: 8,  upgrade: 4 },
  // L4 — peak upgrade window
  { battle: 28, catch: 18, item: 13, question: 17, qclab: 10, trade: 8,  upgrade: 6 },
  // L5 — resource only: catch, item, event, trade, upgrade (no battles, no qclab)
  { battle: 0,  catch: 34, item: 30, question: 22, qclab: 0,  trade: 6,  upgrade: 8 },
  // L6 — final push before QC, no trade, no upgrade
  { battle: 40, catch: 15, item: 10, question: 25, qclab: 10, trade: 0,  upgrade: 0 },
  // L7 — QC lab guaranteed separately, this is for extra nodes
  { battle: 45, catch: 20, item: 20, question: 15, qclab: 0,  trade: 0,  upgrade: 0 },
];

function weightedRandom(weights) {
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (const [k, v] of Object.entries(weights)) {
    r -= v;
    if (r <= 0) return k;
  }
  return Object.keys(weights)[0];
}

function generateMap(mapIndex) {
  // Fixed layer sizes for consistent branching (Slay the Spire style):
  // Start(1) → L1(3) → L2(4) → L3(3) → L4(4) → L5(3) → L6(2) → L7(3, QC guaranteed) → Boss(1)
  const CONTENT_SIZES = [3, 4, 3, 4, 3, 2]; // layers 1–6
  const layers = [];

  // ── Positional edge builder ───────────────────────────────────────────────
  // Each node connects to the 2 positionally nearest nodes in the next layer,
  // producing clean diagonal paths rather than random crossings.
  function makeLayerEdges(fromLayer, toLayer) {
    const N = fromLayer.length;
    const M = toLayer.length;
    const edges = [];
    if (N === 1) {
      return toLayer.map(t => ({ from: fromLayer[0].id, to: t.id }));
    }
    for (let i = 0; i < N; i++) {
      let left, right;
      if (M === 1) {
        left = right = 0;
      } else if (M < N && i === 0) {
        left = right = 0;
      } else if (M < N && i === N - 1) {
        left = right = M - 1;
      } else {
        const pos = i * (M - 1) / (N - 1);
        left  = Math.floor(pos);
        right = left + 1;
        if (right >= M) { right = M - 1; left = M - 2; }
      }
      edges.push({ from: fromLayer[i].id, to: toLayer[left].id });
      if (left !== right) {
        edges.push({ from: fromLayer[i].id, to: toLayer[right].id });
      }
    }
    return edges;
  }

  // ── Layer 0: Start ────────────────────────────────────────────────────────
  layers.push([{ id: 'n0_0', type: NODE_TYPES.START, layer: 0, col: 0 }]);

  // ── Layers 1–6: fixed-size content layers ────────────────────────────────
  for (let li = 0; li < CONTENT_SIZES.length; li++) {
    const l     = li + 1;
    const count = CONTENT_SIZES[li];
    const w     = NODE_WEIGHTS[li];
    const layer = [];

    for (let c = 0; c < count; c++) {
      layer.push({ id: `n${l}_${c}`, type: weightedRandom(w), layer: l, col: c });
    }

    // Content guarantees (same as before)
    // L1: at least one catch
    if (l === 1 && !layer.some(n => n.type === 'catch')) {
      layer[0].type = 'catch';
    }
    // L1, L3: at least one battle
    if ((l === 1 || l === 3) && !layer.some(n => n.type === 'battle')) {
      const idx = layer.findIndex(n => n.type !== 'catch');
      layer[idx >= 0 ? idx : 0].type = 'battle';
    }
    // L5: guaranteed miniboss at centre (col 1); col 0 and col 2 stay resource-only
    if (l === 5) {
      layer[1].type = NODE_TYPES.MINIBOSS;
      // Ensure the flanking nodes are resource nodes, not miniboss
      if (layer[0].type === 'miniboss') layer[0].type = 'catch';
      if (layer[2].type === 'miniboss') layer[2].type = 'catch';
    }
    // L6: at least one battle (final push before QC)
    if (l === 6 && !layer.some(n => n.type === 'battle')) {
      const idx = layer.findIndex(n => n.type !== 'catch');
      layer[idx >= 0 ? idx : 0].type = 'battle';
    }

    layers.push(layer);
  }

  // ── Layer 7: guaranteed QC Lab at centre + 1 random node each side ───────
  {
    const w = NODE_WEIGHTS[NODE_WEIGHTS.length - 1];
    let left  = weightedRandom(w); if (left  === 'qclab') left  = 'battle';
    let right = weightedRandom(w); if (right === 'qclab') right = 'battle';
    const layer7 = [
      { id: 'n7_0', type: left,               layer: 7, col: 0 },
      { id: 'n7_1', type: NODE_TYPES.POKECENTER, layer: 7, col: 1 },
      { id: 'n7_2', type: right,              layer: 7, col: 2 },
    ];
    layers.push(layer7);
  }

  // ── Layer 8: Boss ─────────────────────────────────────────────────────────
  layers.push([{ id: 'n8_0', type: NODE_TYPES.BOSS, layer: 8, col: 0 }]);

  // ── Build all edges using positional algorithm ────────────────────────────
  const edges = [];
  for (let l = 0; l < layers.length - 1; l++) {
    edges.push(...makeLayerEdges(layers[l], layers[l + 1]));
  }

  // ── Flatten nodes — all start revealed (Slay the Spire style) ────────────
  const nodes = {};
  for (const layer of layers) {
    for (const n of layer) {
      n.visited    = false;
      n.accessible = false;
      n.revealed   = true;
      nodes[n.id]  = n;
    }
  }

  nodes['n0_0'].visited = true;
  for (const edge of edges) {
    if (edge.from === 'n0_0') nodes[edge.to].accessible = true;
  }

  return { nodes, edges, layers, mapIndex };
}

function getAccessibleNodes(map) {
  return Object.values(map.nodes).filter(n => n.accessible && !n.visited);
}

function advanceFromNode(map, nodeId) {
  const node = map.nodes[nodeId];
  if (!node) return;
  node.visited = true;
  node.accessible = false;

  // Lock sibling nodes in the same layer — the unchosen branches are gone
  for (const n of Object.values(map.nodes)) {
    if (n.layer === node.layer && n.id !== nodeId && n.accessible) {
      n.accessible = false;
    }
  }

  // Make next layer nodes accessible
  for (const edge of map.edges) {
    if (edge.from === nodeId) {
      const target = map.nodes[edge.to];
      if (target) {
        target.revealed = true;
        target.accessible = true;
      }
    }
  }
}

// Rendering — top-to-bottom layout
const _mapTooltip = (() => {
  let el = null;
  return {
    show(label, x, y) {
      if (!el) el = document.getElementById('map-node-tooltip');
      if (!el) return;
      el.textContent = label;
      el.style.left = x + 'px';
      el.style.top = y + 'px';
      el.classList.add('visible');
    },
    move(x, y) {
      if (!el) return;
      el.style.left = x + 'px';
      el.style.top = y + 'px';
    },
    hide() {
      if (!el) el = document.getElementById('map-node-tooltip');
      if (el) el.classList.remove('visible');
    },
  };
})();

// ── Shape builder — returns an SVG element for each node type ──────────────
function makeNodeShape(node, fill, stroke, strokeWidth) {
  const ns = 'http://www.w3.org/2000/svg';

  function applyStyle(el) {
    el.setAttribute('fill', fill);
    el.setAttribute('stroke', stroke);
    el.setAttribute('stroke-width', strokeWidth);
    return el;
  }

  function polygon(pts) {
    const el = document.createElementNS(ns, 'polygon');
    el.setAttribute('points', pts.map(([x,y]) => `${x},${y}`).join(' '));
    return applyStyle(el);
  }

  function path(d) {
    const el = document.createElementNS(ns, 'path');
    el.setAttribute('d', d);
    return applyStyle(el);
  }

  function circle(r) {
    const el = document.createElementNS(ns, 'circle');
    el.setAttribute('r', r);
    el.setAttribute('cx', 0);
    el.setAttribute('cy', 0);
    return applyStyle(el);
  }

  function rect(w, h, rx = 0) {
    const el = document.createElementNS(ns, 'rect');
    el.setAttribute('x', -w/2);
    el.setAttribute('y', -h/2);
    el.setAttribute('width', w);
    el.setAttribute('height', h);
    if (rx) el.setAttribute('rx', rx);
    return applyStyle(el);
  }

  // Helper: regular polygon points
  function regPoly(sides, r, offsetAngle = 0) {
    const pts = [];
    for (let i = 0; i < sides; i++) {
      const a = (Math.PI * 2 * i / sides) + offsetAngle;
      pts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
    return pts;
  }

  switch (node.type) {

    // START — 6-point star
    case NODE_TYPES.START: {
      const outer = 22, inner = 10;
      const pts = [];
      for (let i = 0; i < 12; i++) {
        const r = i % 2 === 0 ? outer : inner;
        const a = (Math.PI * 2 * i / 12) - Math.PI / 2;
        pts.push([Math.cos(a) * r, Math.sin(a) * r]);
      }
      return polygon(pts);
    }

    // BATTLE — circle (baseline, most common node)
    case NODE_TYPES.BATTLE:
      return circle(22);

    // CATCH — diamond (rotated square, matches ⬟ icon)
    case NODE_TYPES.CATCH:
      return polygon([[ 0,-26],[22, 0],[ 0,26],[-22, 0]]);

    // ITEM — rounded rectangle (loot/chest feel)
    case NODE_TYPES.ITEM:
      return rect(42, 34, 7);

    // QUESTION — hexagon (multifaceted / unknown)
    case NODE_TYPES.QUESTION:
      return polygon(regPoly(6, 23, 0));

    // BOSS — large spiked octagon
    case NODE_TYPES.BOSS: {
      const outer = 28, inner = 22;
      const pts = [];
      for (let i = 0; i < 16; i++) {
        const r = i % 2 === 0 ? outer : inner;
        const a = (Math.PI * 2 * i / 16) - Math.PI / 2;
        pts.push([Math.cos(a) * r, Math.sin(a) * r]);
      }
      return polygon(pts);
    }

    // QC LAB — cross / plus shape
    case NODE_TYPES.POKECENTER: {
      const arm = 9, len = 23;
      return path(`M ${-arm},${-len} L ${arm},${-len} L ${arm},${-arm}
                   L ${len},${-arm} L ${len},${arm} L ${arm},${arm}
                   L ${arm},${len} L ${-arm},${len} L ${-arm},${arm}
                   L ${-len},${arm} L ${-len},${-arm} L ${-arm},${-arm} Z`);
    }

    // TRADE — parallelogram (suggests movement/exchange)
    case NODE_TYPES.TRADE: {
      const skew = 8;
      return polygon([
        [-22 + skew, -14],
        [ 22 + skew, -14],
        [ 22 - skew,  14],
        [-22 - skew,  14],
      ]);
    }

    // UPGRADE — upward-pointing pentagon (arrow/progress feel)
    case NODE_TYPES.UPGRADE:
      return polygon([[ 0,-26],[18,-8],[11,18],[-11,18],[-18,-8]]);

    // MINIBOSS — spiked octagon, between regular and boss size
    case NODE_TYPES.MINIBOSS: {
      const outer = 25, inner = 20;
      const pts = [];
      for (let i = 0; i < 16; i++) {
        const r = i % 2 === 0 ? outer : inner;
        const a = (Math.PI * 2 * i / 16) - Math.PI / 2;
        pts.push([Math.cos(a) * r, Math.sin(a) * r]);
      }
      return polygon(pts);
    }

    default:
      return circle(22);
  }
}

function renderMap(map, container, onNodeClick) {
  container.innerHTML = '';
  const W = container.clientWidth || 600;
  const H = container.clientHeight || 500;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', W);
  svg.setAttribute('height', H);
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.style.width = '100%';
  svg.style.height = '100%';

  const layerCount = map.layers.length; // 9 total (0–7 = start + 6 content + boss)
  const layerGap = H / (layerCount + 1);

  // Positions: layers go DOWN, nodes spread ACROSS
  const positions = {};
  for (let l = 0; l < map.layers.length; l++) {
    const layer = map.layers[l];
    const y = layerGap * (l + 1);
    const nodeGap = W / (layer.length + 1);
    for (let c = 0; c < layer.length; c++) {
      positions[layer[c].id] = { x: nodeGap * (c + 1), y };
    }
  }

  // Draw ALL edges
  for (const edge of map.edges) {
    const from = positions[edge.from];
    const to = positions[edge.to];
    if (!from || !to) continue;
    const fromNode = map.nodes[edge.from];
    const toNode = map.nodes[edge.to];
    // "on path" = both endpoints are visited or accessible
    const onPath = (fromNode.visited || fromNode.accessible) && (toNode.visited || toNode.accessible);

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', from.x);
    line.setAttribute('y1', from.y);
    line.setAttribute('x2', to.x);
    line.setAttribute('y2', to.y);
    line.setAttribute('stroke', onPath ? '#888' : '#333');
    line.setAttribute('stroke-width', onPath ? '2.5' : '1.5');
    if (!onPath) line.setAttribute('stroke-dasharray', '4,5');
    svg.appendChild(line);
  }

  // Draw ALL nodes (all are revealed)
  for (const [id, node] of Object.entries(map.nodes)) {
    const pos = positions[id];
    if (!pos) continue;

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', `translate(${pos.x},${pos.y})`);

    const isClickable = node.accessible && !node.visited;
    const isInaccessible = !node.accessible && !node.visited;

    g.style.cursor = isClickable ? 'pointer' : 'default';
    if (isInaccessible) g.style.opacity = '0.7';
    if (node.visited) g.style.opacity = '0.35';

    const fill    = isInaccessible ? '#2a2a3a' : getNodeColor(node);
    const stroke  = isClickable ? '#fff' : (isInaccessible ? '#444' : '#555');
    const strokeW = isClickable ? '3' : '1';

    const shape = makeNodeShape(node, fill, stroke, strokeW);

    if (isClickable) {
      const anim = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
      anim.setAttribute('attributeName', 'stroke-opacity');
      anim.setAttribute('values', '1;0.3;1');
      anim.setAttribute('dur', '1.5s');
      anim.setAttribute('repeatCount', 'indefinite');
      shape.appendChild(anim);
    }

    const hitTarget = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    hitTarget.setAttribute('r', '32');
    hitTarget.setAttribute('fill', 'transparent');
    hitTarget.setAttribute('stroke', 'none');

    const label = getNodeLabel(node);
    g.addEventListener('mouseenter', e => _mapTooltip.show(label, e.clientX, e.clientY));
    g.addEventListener('mousemove',  e => _mapTooltip.move(e.clientX, e.clientY));
    g.addEventListener('mouseleave', () => _mapTooltip.hide());

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'central');
    text.setAttribute('font-size', '14');
    text.setAttribute('fill', isInaccessible ? '#aaa' : '#fff');
    text.textContent = node.visited ? '✓' : getNodeIcon(node);

    g.appendChild(shape);
    g.appendChild(text);
    g.appendChild(hitTarget);

    if (isClickable) {
      g.addEventListener('click', () => onNodeClick(node));
    }

    svg.appendChild(g);
  }

  container.appendChild(svg);
}

function getNodeColor(node) {
  if (node.visited) return '#333';
  const colors = {
    [NODE_TYPES.START]:      '#4a4a6a',
    [NODE_TYPES.BATTLE]:     '#6a2a2a',
    [NODE_TYPES.CATCH]:      '#2a6a2a',
    [NODE_TYPES.ITEM]:       '#2a4a6a',
    [NODE_TYPES.QUESTION]:   '#6a4a2a',
    [NODE_TYPES.BOSS]:       '#8a2a8a',
    [NODE_TYPES.POKECENTER]: '#006666',
    [NODE_TYPES.TRADE]:      '#1a5a5a',
    [NODE_TYPES.UPGRADE]:    '#4a2a6a',
    [NODE_TYPES.MINIBOSS]:   '#7a3a1a',
  };
  return colors[node.type] || '#444';
}

function getNodeIcon(node) {
  if (node.visited) return '✓';
  const icons = {
    [NODE_TYPES.START]:      '★',
    [NODE_TYPES.BATTLE]:     '⚔',
    [NODE_TYPES.CATCH]:      '⬟',
    [NODE_TYPES.ITEM]:       '✦',
    [NODE_TYPES.QUESTION]:   '?',
    [NODE_TYPES.BOSS]:       '♛',
    [NODE_TYPES.POKECENTER]: '+',
    [NODE_TYPES.TRADE]:      '⇄',
    [NODE_TYPES.UPGRADE]:    '↑',
    [NODE_TYPES.MINIBOSS]:   '☆',
  };
  return icons[node.type] || '●';
}

function getNodeLabel(node) {
  if (node.visited) return 'Visited';
  const labels = {
    [NODE_TYPES.START]:      'Start',
    [NODE_TYPES.BATTLE]:     'Battle',
    [NODE_TYPES.CATCH]:      'Brew New Batch',
    [NODE_TYPES.ITEM]:       'Item',
    [NODE_TYPES.QUESTION]:   'Random Event',
    [NODE_TYPES.BOSS]:       'Boss Battle',
    [NODE_TYPES.POKECENTER]: 'QC Lab',
    [NODE_TYPES.TRADE]:      'Beer Trade',
    [NODE_TYPES.UPGRADE]:    'Upgrade Move',
    [NODE_TYPES.MINIBOSS]:   'Rival Brewery',
  };
  return labels[node.type] || node.type;
}

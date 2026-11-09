export interface CanvasPoint { x: number; y: number }
export type AnchorHandle = 'top' | 'bottom' | 'left' | 'right';
export type ConnectorKind = 'straight' | 'elbow' | 'curve' | 'bezier' | 'freehand';

export interface CanvasNode {
  id: string;
  title: string;
  body: string;
  icon?: string;
  color?: string;
  position: CanvasPoint;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
}

export interface CanvasEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle: AnchorHandle;
  targetHandle: AnchorHandle;
  kind: ConnectorKind;
  controls: [CanvasPoint, CanvasPoint];
  direction: 'forward' | 'reverse' | 'both' | 'none';
  label: string;
  color: string;
  width: number;
  dash: 'solid' | 'dashed' | 'dotted';
  animation: { enabled: boolean; reverse: boolean; duration: number; particles: number };
}

export interface CanvasDocument {
  version: 1;
  id: string;
  title: string;
  frame: { x: number; y: number; width: number; height: number };
  viewport: { x: number; y: number; zoom: number };
  background: { color: string; grid: 'none' | 'lines' | 'dots'; gridSize: number; snap: boolean };
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

export interface EdgeGeometry {
  start: CanvasPoint;
  end: CanvasPoint;
  controls: [CanvasPoint, CanvasPoint];
  path: string;
}

const DEFAULT_NODE_WIDTH = 260;
const DEFAULT_NODE_HEIGHT = 150;

function finite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function seedDocument(title: string, items: Array<Pick<CanvasNode, 'id' | 'title' | 'body'> & Partial<Pick<CanvasNode, 'icon' | 'color'>>>): CanvasDocument {
  const nodes = items.map((item, index): CanvasNode => ({
    ...item,
    icon: item.icon ?? '',
    color: item.color ?? '#60a5fa',
    position: { x: 80 + index * 120, y: 120 + index * 180 },
    width: DEFAULT_NODE_WIDTH,
    height: DEFAULT_NODE_HEIGHT,
    rotation: 0,
    zIndex: index,
  }));
  const edges = nodes.slice(0, -1).map((node, index): CanvasEdge => ({
    id: `edge-${node.id}-${nodes[index + 1].id}`,
    source: node.id,
    target: nodes[index + 1].id,
    sourceHandle: 'right',
    targetHandle: 'left',
    kind: 'curve',
    controls: [{ x: 80, y: 0 }, { x: -80, y: 0 }],
    direction: 'forward',
    label: '',
    color: '#38bdf8',
    width: 2,
    dash: 'solid',
    animation: { enabled: true, reverse: false, duration: 2, particles: 3 },
  }));
  return {
    version: 1,
    id: `canvas-${Date.now().toString(36)}`,
    title,
    frame: { x: 0, y: 0, width: 1080, height: 1080 },
    viewport: { x: 0, y: 0, zoom: 1 },
    background: { color: '#101820', grid: 'dots', gridSize: 24, snap: false },
    nodes,
    edges,
  };
}

export function anchorPoint(node: CanvasNode, handle: AnchorHandle): CanvasPoint {
  const centerX = node.position.x + node.width / 2;
  const centerY = node.position.y + node.height / 2;
  switch (handle) {
    case 'top': return { x: centerX, y: node.position.y };
    case 'bottom': return { x: centerX, y: node.position.y + node.height };
    case 'left': return { x: node.position.x, y: centerY };
    case 'right': return { x: node.position.x + node.width, y: centerY };
  }
}

function number(value: number) {
  return Number(value.toFixed(2));
}

export function edgeGeometry(edge: CanvasEdge, nodes: CanvasNode[]): EdgeGeometry {
  const source = nodes.find(node => node.id === edge.source);
  const target = nodes.find(node => node.id === edge.target);
  if (!source || !target) throw new Error(`Connector ${edge.id} references a missing node.`);
  const start = anchorPoint(source, edge.sourceHandle);
  const end = anchorPoint(target, edge.targetHandle);
  const controls: [CanvasPoint, CanvasPoint] = [
    { x: start.x + edge.controls[0].x, y: start.y + edge.controls[0].y },
    { x: end.x + edge.controls[1].x, y: end.y + edge.controls[1].y },
  ];
  const point = (value: CanvasPoint) => `${number(value.x)} ${number(value.y)}`;
  let path: string;
  if (edge.kind === 'straight') {
    path = `M ${point(start)} L ${point(end)}`;
  } else if (edge.kind === 'elbow') {
    const middleX = number((start.x + end.x) / 2);
    path = `M ${point(start)} L ${middleX} ${number(start.y)} L ${middleX} ${number(end.y)} L ${point(end)}`;
  } else if (edge.kind === 'freehand') {
    const horizontal = Math.abs(end.x - start.x) >= Math.abs(end.y - start.y);
    const first = horizontal ? { x: start.x + (end.x - start.x) / 3, y: start.y + edge.controls[0].y } : { x: start.x + edge.controls[0].x, y: start.y + (end.y - start.y) / 3 };
    const second = horizontal ? { x: start.x + 2 * (end.x - start.x) / 3, y: end.y + edge.controls[1].y } : { x: end.x + edge.controls[1].x, y: start.y + 2 * (end.y - start.y) / 3 };
    path = `M ${point(start)} Q ${point(first)} ${point(second)} T ${point(end)}`;
  } else {
    let first = controls[0];
    let second = controls[1];
    if (edge.kind === 'curve') {
      const horizontal = Math.abs(end.x - start.x) >= Math.abs(end.y - start.y);
      const distance = Math.max(48, Math.hypot(end.x - start.x, end.y - start.y) * 0.35);
      first = { x: start.x + (horizontal ? Math.sign(end.x - start.x || 1) * distance : 0), y: start.y + (horizontal ? 0 : Math.sign(end.y - start.y || 1) * distance) };
      second = { x: end.x - (horizontal ? Math.sign(end.x - start.x || 1) * distance : 0), y: end.y - (horizontal ? 0 : Math.sign(end.y - start.y || 1) * distance) };
      controls[0] = first;
      controls[1] = second;
    }
    path = `M ${point(start)} C ${point(first)} ${point(second)} ${point(end)}`;
  }
  return { start, end, controls, path };
}

export function exportBounds(document: CanvasDocument, mode: 'all' | 'frame' | 'selection', selectedIds: string[]) {
  if (mode === 'frame') return { ...document.frame };
  const selected = mode === 'selection' ? new Set(selectedIds) : null;
  const nodes = document.nodes.filter(node => !selected || selected.has(node.id));
  if (!nodes.length) return { x: 0, y: 0, width: 1, height: 1 };
  const left = Math.min(...nodes.map(node => node.position.x));
  const top = Math.min(...nodes.map(node => node.position.y));
  const right = Math.max(...nodes.map(node => node.position.x + node.width));
  const bottom = Math.max(...nodes.map(node => node.position.y + node.height));
  return { x: left, y: top, width: right - left, height: bottom - top };
}

export function restoreDocument(serialized: string): CanvasDocument {
  const value: unknown = JSON.parse(serialized);
  if (!value || typeof value !== 'object') throw new Error('Invalid canvas document.');
  const document = value as Partial<CanvasDocument>;
  if (document.version !== 1 || typeof document.id !== 'string' || typeof document.title !== 'string' || !Array.isArray(document.nodes) || !Array.isArray(document.edges) || !document.frame || !document.viewport || !document.background) {
    throw new Error('Invalid canvas document.');
  }
  if (!finite(document.frame.width) || !finite(document.frame.height) || document.frame.width <= 0 || document.frame.height <= 0 || !finite(document.viewport.x) || !finite(document.viewport.y) || !finite(document.viewport.zoom) || document.viewport.zoom <= 0) {
    throw new Error('Invalid canvas dimensions or viewport.');
  }
  const nodeIds = new Set<string>();
  for (const node of document.nodes) {
    if (!node || typeof node.id !== 'string' || nodeIds.has(node.id) || !node.position || !finite(node.position.x) || !finite(node.position.y) || !finite(node.width) || !finite(node.height) || node.width <= 0 || node.height <= 0 || typeof node.title !== 'string' || typeof node.body !== 'string') {
      throw new Error('Invalid canvas node.');
    }
    nodeIds.add(node.id);
  }
  const edgeIds = new Set<string>();
  for (const edge of document.edges) {
    if (!edge || typeof edge.id !== 'string' || edgeIds.has(edge.id) || !nodeIds.has(edge.source) || !nodeIds.has(edge.target) || !['top', 'bottom', 'left', 'right'].includes(edge.sourceHandle) || !['top', 'bottom', 'left', 'right'].includes(edge.targetHandle) || !Array.isArray(edge.controls) || edge.controls.length !== 2 || !edge.controls.every(point => point && finite(point.x) && finite(point.y))) {
      throw new Error('Invalid canvas connector.');
    }
    edgeIds.add(edge.id);
  }
  return value as CanvasDocument;
}
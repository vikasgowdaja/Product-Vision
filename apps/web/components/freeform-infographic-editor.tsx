'use client';

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent } from 'react';
import { ArrowDown, ArrowLeftRight, ArrowUp, Hand, Link2, Minus, MousePointer2, Plus, Redo2, RotateCcw, Trash2, ZoomIn, ZoomOut } from 'lucide-react';
import { anchorPoint, edgeGeometry, exportBounds, restoreDocument, seedDocument, type AnchorHandle, type CanvasDocument, type CanvasEdge, type CanvasNode, type CanvasPoint } from '../lib/freeform-canvas';

type Tool = 'select' | 'pan' | 'connect';
type ExportRegion = 'all' | 'frame' | 'selection';
type Gesture =
  | { kind: 'pan'; client: CanvasPoint; viewport: CanvasDocument['viewport'] }
  | { kind: 'move'; client: CanvasPoint; before: CanvasDocument; ids: string[] }
  | { kind: 'resize'; client: CanvasPoint; before: CanvasDocument; id: string }
  | { kind: 'control'; client: CanvasPoint; before: CanvasDocument; edgeId: string; index: 0 | 1 }
  | { kind: 'connect'; source: string; handle: AnchorHandle };

const STORAGE_PREFIX = 'infographai-freeform:';
const HANDLES: AnchorHandle[] = ['top', 'right', 'bottom', 'left'];
const BUTTON = 'inline-flex h-9 w-9 items-center justify-center rounded border border-slate-600 bg-slate-900 text-slate-200 hover:bg-slate-800 disabled:opacity-40';
const INPUT = 'min-w-0 w-full rounded border border-slate-600 bg-slate-950 px-2 py-1.5 text-xs text-slate-100';

function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function screenToWorld(event: { clientX: number; clientY: number }, rect: DOMRect, viewport: CanvasDocument['viewport']): CanvasPoint {
  return { x: (event.clientX - rect.left - viewport.x) / viewport.zoom, y: (event.clientY - rect.top - viewport.y) / viewport.zoom };
}

function escapeXml(value: string) {
  return value.replace(/[<>&"']/g, character => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[character]!);
}

function wrapText(value: string, limit: number) {
  const lines: string[] = [];
  value.split('\n').forEach(paragraph => {
    let line = '';
    paragraph.split(/\s+/).forEach(word => {
      if (line && `${line} ${word}`.length > limit) { lines.push(line); line = word; }
      else line = line ? `${line} ${word}` : word;
    });
    if (line) lines.push(line);
  });
  return lines;
}

function svgPathPoint(pathData: string, progress: number): CanvasPoint {
  const svg = window.document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const path = window.document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', pathData);
  svg.appendChild(path);
  Object.assign(svg.style, { position: 'fixed', left: '-10000px', top: '0' });
  window.document.body.appendChild(svg);
  const length = path.getTotalLength();
  const point = path.getPointAtLength(length * Math.min(1, Math.max(0, progress)));
  svg.remove();
  return { x: point.x, y: point.y };
}

function canvasSvg(document: CanvasDocument, region: ExportRegion, selectedIds: string[], animationTime?: number) {
  const bounds = exportBounds(document, region, selectedIds);
  const selected = region === 'selection' ? new Set(selectedIds) : null;
  const nodes = document.nodes.filter(node => !selected || selected.has(node.id));
  const visibleIds = new Set(nodes.map(node => node.id));
  const edges = document.edges.filter(edge => visibleIds.has(edge.source) && visibleIds.has(edge.target));
  const paths = edges.map(edge => {
    const geometry = edgeGeometry(edge, document.nodes);
    const animated = edge.animation.enabled;
    const dash = edge.dash === 'dashed' ? '8 6' : edge.dash === 'dotted' ? '2 6' : 'none';
    const marker = edge.direction === 'forward' ? 'url(#arrow)' : edge.direction === 'reverse' ? 'url(#arrow-reverse)' : edge.direction === 'both' ? 'url(#arrow) url(#arrow-reverse)' : 'none';
    const label = edge.label ? `<text x="${(geometry.start.x + geometry.end.x) / 2}" y="${(geometry.start.y + geometry.end.y) / 2 - 8}" fill="#e2e8f0" font-size="13" text-anchor="middle">${escapeXml(edge.label)}</text>` : '';
    const path = `<path d="${geometry.path}" fill="none" stroke="${escapeXml(edge.color)}" stroke-width="${edge.width}" stroke-dasharray="${dash}" marker-end="${marker}"/>`;
    const particles = !animated ? '' : Array.from({ length: edge.animation.particles }, (_, index) => {
      if (animationTime === undefined) {
        const keyPoints = edge.animation.reverse ? '1;0' : '0;1';
        return `<circle r="4" fill="${escapeXml(edge.color)}"><animateMotion dur="${edge.animation.duration}s" begin="${-index * edge.animation.duration / Math.max(1, edge.animation.particles)}s" repeatCount="indefinite" path="${geometry.path}" keyPoints="${keyPoints}" keyTimes="0;1" calcMode="linear"/></circle>`;
      }
      const phase = ((animationTime / edge.animation.duration + index / Math.max(1, edge.animation.particles)) % 1 + 1) % 1;
      const point = svgPathPoint(geometry.path, edge.animation.reverse ? 1 - phase : phase);
      return `<circle cx="${point.x}" cy="${point.y}" r="4" fill="${escapeXml(edge.color)}"/>`;
    }).join('');
    return `${path}${label}${particles}`;
  }).join('');
  const cards = nodes.map(node => {
    const textLines = wrapText(node.body, Math.max(12, Math.floor((node.width - 32) / 7))).slice(0, Math.max(0, Math.floor((node.height - 54) / 18)));
    const body = textLines.map((line, index) => `<tspan x="${node.position.x + 16}" dy="${index ? 18 : 0}">${escapeXml(line)}</tspan>`).join('');
    const color = node.color ?? '#60a5fa';
    const icon = node.icon ? `<text x="${node.position.x + 16}" y="${node.position.y + 26}" fill="${escapeXml(color)}" font-family="sans-serif" font-size="16">${escapeXml(node.icon)}</text>` : '';
    const titleX = node.position.x + (node.icon ? 42 : 16);
    return `<rect x="${node.position.x}" y="${node.position.y}" width="${node.width}" height="${node.height}" rx="8" fill="${escapeXml(color)}" fill-opacity="0.12" stroke="${escapeXml(color)}"/><text x="${titleX}" y="${node.position.y + 26}" fill="${escapeXml(color)}" font-family="sans-serif" font-size="16" font-weight="700">${escapeXml(node.title)}</text>${icon}<path d="M ${node.position.x + 12} ${node.position.y + 38} H ${node.position.x + node.width - 12}" stroke="${escapeXml(color)}" stroke-opacity="0.35"/><text x="${node.position.x + 16}" y="${node.position.y + 58}" fill="#cbd5e1" font-family="sans-serif" font-size="13">${body}</text>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${bounds.width}" height="${bounds.height}" viewBox="${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}"><defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke"/></marker><marker id="arrow-reverse" viewBox="0 0 10 10" refX="1" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M 10 0 L 0 5 L 10 10 z" fill="context-stroke"/></marker></defs><rect x="${bounds.x}" y="${bounds.y}" width="${bounds.width}" height="${bounds.height}" fill="${escapeXml(document.background.color)}"/>${paths}${cards}</svg>`;
}

function gifWorkerRequest(worker: Worker, message: object, transfer: Transferable[] = []) {
  return new Promise<{ bytes?: ArrayBuffer }>((resolve, reject) => {
    const onMessage = (event: MessageEvent) => {
      worker.removeEventListener('message', onMessage);
      if (event.data.type === 'error') reject(new Error(event.data.message));
      else resolve(event.data);
    };
    const onError = (event: ErrorEvent) => {
      worker.removeEventListener('message', onMessage);
      worker.removeEventListener('error', onError);
      reject(new Error(event.message || 'The GIF encoder failed.'));
    };
    worker.addEventListener('message', onMessage);
    worker.addEventListener('error', onError, { once: true });
    worker.postMessage(message, transfer);
  });
}

async function exportCanvasGif(document: CanvasDocument, region: ExportRegion, selectedIds: string[]) {
  const bounds = exportBounds(document, region, selectedIds);
  const scale = Math.min(1, 1280 / bounds.width, Math.sqrt(8000000 / (bounds.width * bounds.height)));
  const width = Math.max(1, Math.round(bounds.width * scale));
  const height = Math.max(1, Math.round(bounds.height * scale));
  const duration = Math.max(2, Math.min(8, ...document.edges.filter(edge => edge.animation.enabled).map(edge => edge.animation.duration)));
  const fps = 12;
  const frames = Math.max(2, Math.round(duration * fps));
  const canvas = window.document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('GIF export is not supported in this browser.');
  const render = async (time: number) => {
    const url = URL.createObjectURL(new Blob([canvasSvg(document, region, selectedIds, time)], { type: 'image/svg+xml;charset=utf-8' }));
    try {
      const image = new Image(); image.src = url; await image.decode();
      context.clearRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);
    } finally { URL.revokeObjectURL(url); }
  };
  const worker = new Worker(new URL('../workers/gif-encoder.worker.ts', import.meta.url));
  try {
    await render(0);
    const palette = context.getImageData(0, 0, width, height).data.buffer;
    await gifWorkerRequest(worker, { type: 'start', width, height, colors: 128, repeat: 0, palette, color: '#67e8f9' }, [palette]);
    for (let index = 0; index < frames; index += 1) {
      await render(index / fps);
      const rgba = context.getImageData(0, 0, width, height).data.buffer;
      await gifWorkerRequest(worker, { type: 'frame', rgba, delay: Math.round(1000 / fps) }, [rgba]);
    }
    const result = await gifWorkerRequest(worker, { type: 'finish' });
    if (!result.bytes) throw new Error('The GIF encoder returned an empty file.');
    return new Blob([result.bytes], { type: 'image/gif' });
  } finally { worker.terminate(); }
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const anchor = window.document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function FreeformInfographicEditor({ topic, nodes }: { topic: string; nodes: Array<Pick<CanvasNode, 'id' | 'title' | 'body'> & Partial<Pick<CanvasNode, 'icon' | 'color'>>> }) {
  const [document, setDocument] = useState(() => seedDocument(topic, nodes));
  const [tool, setTool] = useState<Tool>('select');
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [connectionPointer, setConnectionPointer] = useState<CanvasPoint | null>(null);
  const [documentReady, setDocumentReady] = useState(false);
  const [history, setHistory] = useState<{ past: CanvasDocument[]; future: CanvasDocument[] }>({ past: [], future: [] });
  const [exportRegion, setExportRegion] = useState<ExportRegion>('all');
  const [status, setStatus] = useState('');
  const workspace = useRef<HTMLDivElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const clipboard = useRef<CanvasNode[]>([]);
  const restoredDocument = useRef(false);
  const storageKey = `${STORAGE_PREFIX}${topic}`;

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    if (stored) {
      try { setDocument(restoreDocument(stored)); restoredDocument.current = true; } catch { window.localStorage.removeItem(storageKey); }
    }
    setDocumentReady(true);
  }, [storageKey]);

  useEffect(() => {
    if (!documentReady || restoredDocument.current) return;
    const bounds = exportBounds(document, 'all', []);
    const rect = workspace.current?.getBoundingClientRect();
    if (!rect || !document.nodes.length) return;
    const zoom = Math.max(0.12, Math.min(1.5, Math.min((rect.width - 80) / bounds.width, (rect.height - 80) / bounds.height)));
    setDocument(current => ({ ...current, viewport: { zoom, x: (rect.width - bounds.width * zoom) / 2 - bounds.x * zoom, y: (rect.height - bounds.height * zoom) / 2 - bounds.y * zoom } }));
  }, [documentReady]);

  useEffect(() => {
    if (!documentReady) return;
    window.localStorage.setItem(storageKey, JSON.stringify(document));
  }, [document, documentReady, storageKey]);

  function commit(next: CanvasDocument) {
    setHistory(current => ({ past: [...current.past.slice(-49), document], future: [] }));
    setDocument(next);
  }

  function updateNode(id: string, patch: Partial<CanvasNode>) {
    commit({ ...document, nodes: document.nodes.map(node => node.id === id ? { ...node, ...patch } : node) });
  }

  function updateEdge(id: string, patch: Partial<CanvasEdge>) {
    commit({ ...document, edges: document.edges.map(edge => edge.id === id ? { ...edge, ...patch } : edge) });
  }

  function undo() {
    setHistory(current => {
      const previous = current.past.at(-1);
      if (!previous) return current;
      setDocument(previous);
      return { past: current.past.slice(0, -1), future: [document, ...current.future] };
    });
  }

  function redo() {
    setHistory(current => {
      const next = current.future[0];
      if (!next) return current;
      setDocument(next);
      return { past: [...current.past, document], future: current.future.slice(1) };
    });
  }

  function addNode() {
    const position = { x: 120, y: 120 };
    while (document.nodes.some(item => position.x < item.position.x + item.width && position.x + 260 > item.position.x && position.y < item.position.y + item.height && position.y + 150 > item.position.y)) position.y += 182;
    const node: CanvasNode = { id: makeId('card'), title: 'New card', body: 'Add your content', icon: '✦', color: '#38bdf8', position, width: 260, height: 150, rotation: 0, zIndex: Math.max(0, ...document.nodes.map(item => item.zIndex)) + 1 };
    commit({ ...document, nodes: [...document.nodes, node] });
    setSelectedNodes([node.id]); setSelectedEdge(null); setTool('select');
  }

  function deleteSelection() {
    const removed = new Set(selectedNodes);
    commit({ ...document, nodes: document.nodes.filter(node => !removed.has(node.id)), edges: document.edges.filter(edge => edge.id !== selectedEdge && !removed.has(edge.source) && !removed.has(edge.target)) });
    setSelectedNodes([]); setSelectedEdge(null);
  }

  function duplicateSelection() {
    const originals = document.nodes.filter(node => selectedNodes.includes(node.id));
    if (!originals.length) return;
    const idMap = new Map(originals.map(node => [node.id, makeId('card')]));
    const copies = originals.map(node => ({ ...node, id: idMap.get(node.id)!, title: `${node.title} copy`, position: { x: node.position.x + 32, y: node.position.y + 32 }, zIndex: node.zIndex + 1 }));
    commit({ ...document, nodes: [...document.nodes, ...copies] });
    setSelectedNodes(copies.map(node => node.id));
  }

  function fitToScreen() {
    const bounds = exportBounds(document, 'all', []);
    const rect = workspace.current?.getBoundingClientRect();
    if (!rect || !document.nodes.length) return;
    const zoom = Math.max(0.12, Math.min(1.5, Math.min((rect.width - 80) / bounds.width, (rect.height - 80) / bounds.height)));
    commit({ ...document, viewport: { zoom, x: (rect.width - bounds.width * zoom) / 2 - bounds.x * zoom, y: (rect.height - bounds.height * zoom) / 2 - bounds.y * zoom } });
  }

  function onWheel(event: ReactWheelEvent<HTMLDivElement>) {
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const before = screenToWorld(event, rect, document.viewport);
    const zoom = Math.max(0.12, Math.min(2.5, document.viewport.zoom * Math.exp(-event.deltaY * 0.001)));
    commit({ ...document, viewport: { zoom, x: event.clientX - rect.left - before.x * zoom, y: event.clientY - rect.top - before.y * zoom } });
  }

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || !['select', 'pan'].includes(tool)) return;
    if ((event.target as HTMLElement).closest('[data-node-id], [data-edge-id], [data-anchor], [data-control]')) return;
    if (tool === 'pan') {
      gesture.current = { kind: 'pan', client: { x: event.clientX, y: event.clientY }, viewport: document.viewport };
      event.currentTarget.setPointerCapture(event.pointerId);
    } else {
      setSelectedNodes([]); setSelectedEdge(null);
    }
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const current = gesture.current;
    if (!current) return;
    if (current.kind === 'connect') {
      const rect = event.currentTarget.getBoundingClientRect();
      setConnectionPointer(screenToWorld(event, rect, document.viewport));
      return;
    }
    if (current.kind === 'pan') {
      setDocument(value => ({ ...value, viewport: { ...current.viewport, x: current.viewport.x + event.clientX - current.client.x, y: current.viewport.y + event.clientY - current.client.y } }));
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const point = screenToWorld(event, rect, current.before.viewport);
    const start = screenToWorld({ clientX: current.client.x, clientY: current.client.y }, rect, current.before.viewport);
    const dx = point.x - start.x;
    const dy = point.y - start.y;
    if (current.kind === 'move') {
      const ids = new Set(current.ids);
      const snap = current.before.background.snap ? current.before.background.gridSize : 1;
      setDocument({ ...current.before, nodes: current.before.nodes.map(node => ids.has(node.id) ? { ...node, position: { x: Math.round((node.position.x + dx) / snap) * snap, y: Math.round((node.position.y + dy) / snap) * snap } } : node) });
    } else if (current.kind === 'resize') {
      const node = current.before.nodes.find(item => item.id === current.id);
      if (!node) return;
      setDocument({ ...current.before, nodes: current.before.nodes.map(item => item.id === node.id ? { ...item, width: Math.max(120, node.width + dx), height: Math.max(80, node.height + dy) } : item) });
    } else {
      const edge = current.before.edges.find(item => item.id === current.edgeId);
      if (!edge) return;
      const endpoint = edgeGeometry(edge, current.before.nodes)[current.index === 0 ? 'start' : 'end'];
      const controls = [...edge.controls] as CanvasEdge['controls'];
      controls[current.index] = { x: point.x - endpoint.x, y: point.y - endpoint.y };
      setDocument({ ...current.before, edges: current.before.edges.map(item => item.id === edge.id ? { ...item, kind: 'bezier', controls } : item) });
    }
  }

  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const current = gesture.current;
    if (!current) return;
    if (current.kind === 'connect') {
      const target = window.document.elementFromPoint(event.clientX, event.clientY);
      const anchor = target?.closest<HTMLElement>('[data-anchor]');
      const targetNode = anchor?.dataset.nodeId;
      const targetHandle = anchor?.dataset.anchor as AnchorHandle | undefined;
      if (targetNode && targetNode !== current.source && targetHandle) {
        const edge: CanvasEdge = { id: makeId('edge'), source: current.source, target: targetNode, sourceHandle: current.handle, targetHandle, kind: 'bezier', controls: [{ x: 80, y: 0 }, { x: -80, y: 0 }], direction: 'forward', label: '', color: '#67e8f9', width: 2, dash: 'solid', animation: { enabled: true, reverse: false, duration: 2, particles: 3 } };
        commit({ ...document, edges: [...document.edges, edge] });
        setSelectedEdge(edge.id); setSelectedNodes([]);
      }
      setConnectionPointer(null);
    } else if (current.kind === 'move' || current.kind === 'resize' || current.kind === 'control') {
      setHistory(value => ({ past: [...value.past.slice(-49), current.before], future: [] }));
    }
    gesture.current = null;
  }

  function startMove(event: ReactPointerEvent<HTMLElement>, node: CanvasNode) {
    if (tool !== 'select' || event.button !== 0) return;
    event.stopPropagation();
    if (event.shiftKey) setSelectedNodes(value => value.includes(node.id) ? value.filter(id => id !== node.id) : [...value, node.id]);
    else if (!selectedNodes.includes(node.id)) setSelectedNodes([node.id]);
    setSelectedEdge(null);
    const ids = selectedNodes.includes(node.id) ? selectedNodes : event.shiftKey ? [...selectedNodes, node.id] : [node.id];
    gesture.current = { kind: 'move', client: { x: event.clientX, y: event.clientY }, before: document, ids };
    workspace.current?.setPointerCapture(event.pointerId);
  }

  function startConnect(event: ReactPointerEvent<HTMLButtonElement>, node: CanvasNode, handle: AnchorHandle) {
    event.stopPropagation(); event.preventDefault();
    const rect = workspace.current?.getBoundingClientRect();
    if (!rect) return;
    const point = anchorPoint(node, handle);
    gesture.current = { kind: 'connect', source: node.id, handle };
    setConnectionPointer(point);
    workspace.current?.setPointerCapture(event.pointerId);
    setSelectedNodes([node.id]); setSelectedEdge(null);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes((event.target as HTMLElement).tagName)) return;
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); event.shiftKey ? redo() : undo(); }
    else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') { event.preventDefault(); redo(); }
    else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'd') { event.preventDefault(); duplicateSelection(); }
    else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'c') { clipboard.current = document.nodes.filter(node => selectedNodes.includes(node.id)); }
    else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'v' && clipboard.current.length) {
      const copies = clipboard.current.map(node => ({ ...node, id: makeId('card'), position: { x: node.position.x + 36, y: node.position.y + 36 }, zIndex: node.zIndex + 1 }));
      commit({ ...document, nodes: [...document.nodes, ...copies] }); setSelectedNodes(copies.map(node => node.id));
    } else if (event.key === 'Delete' || event.key === 'Backspace') { event.preventDefault(); deleteSelection(); }
  }

  async function exportCanvas(format: 'svg' | 'png' | 'gif') {
    if (format === 'gif') {
      try {
        const blob = await exportCanvasGif(document, exportRegion, selectedNodes);
        download(blob, `${topic.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.gif`);
        setStatus('GIF exported');
      } catch (error) { setStatus(error instanceof Error ? error.message : 'GIF export failed'); }
      return;
    }
    const svg = canvasSvg(document, exportRegion, selectedNodes);
    if (format === 'svg') {
      download(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }), `${topic.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.svg`);
      setStatus('SVG exported');
      return;
    }
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
    try {
      const image = new Image(); image.src = url; await image.decode();
      const canvas = window.document.createElement('canvas');
      canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('PNG export is not supported in this browser.');
      context.drawImage(image, 0, 0);
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('PNG encoding failed.')), 'image/png'));
      download(blob, `${topic.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`);
      setStatus('PNG exported');
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Export failed'); }
    finally { URL.revokeObjectURL(url); }
  }

  const activeNode = document.nodes.find(node => selectedNodes.length === 1 && node.id === selectedNodes[0]);
  const activeEdge = document.edges.find(edge => edge.id === selectedEdge);
  const gridStyle = document.background.grid === 'dots'
    ? { backgroundImage: 'radial-gradient(#526171 0.8px, transparent 0.8px)', backgroundSize: `${document.background.gridSize}px ${document.background.gridSize}px` }
    : document.background.grid === 'lines'
      ? { backgroundImage: 'linear-gradient(to right, #334155 1px, transparent 1px), linear-gradient(to bottom, #334155 1px, transparent 1px)', backgroundSize: `${document.background.gridSize}px ${document.background.gridSize}px` }
      : {};

  return <section className="flex min-h-0 min-w-0 flex-1 flex-col gap-3" onKeyDown={onKeyDown} tabIndex={0} aria-label="Freeform infographic editor">
    <div className="flex shrink-0 flex-wrap items-center gap-1 border-y border-slate-700 py-2">
      <button type="button" className={`${BUTTON} ${tool === 'select' ? '!border-cyan-400 !text-cyan-200' : ''}`} title="Select and move" aria-label="Select tool" onClick={() => setTool('select')}><MousePointer2 size={16} /></button>
      <button type="button" className={`${BUTTON} ${tool === 'pan' ? '!border-cyan-400 !text-cyan-200' : ''}`} title="Pan workspace" aria-label="Pan tool" onClick={() => setTool('pan')}><Hand size={16} /></button>
      <button type="button" className={`${BUTTON} ${tool === 'connect' ? '!border-cyan-400 !text-cyan-200' : ''}`} title="Draw connections" aria-label="Connection tool" onClick={() => setTool('connect')}><Link2 size={16} /></button>
      <span className="mx-1 h-6 border-l border-slate-700" />
      <button type="button" className={BUTTON} title="Add card" aria-label="Add card" onClick={addNode}><Plus size={16} /></button>
      <button type="button" className={BUTTON} title="Zoom out" aria-label="Zoom out" onClick={() => commit({ ...document, viewport: { ...document.viewport, zoom: Math.max(0.12, document.viewport.zoom / 1.2) } })}><ZoomOut size={16} /></button>
      <span className="min-w-12 text-center text-xs tabular-nums text-slate-400">{Math.round(document.viewport.zoom * 100)}%</span>
      <button type="button" className={BUTTON} title="Zoom in" aria-label="Zoom in" onClick={() => commit({ ...document, viewport: { ...document.viewport, zoom: Math.min(2.5, document.viewport.zoom * 1.2) } })}><ZoomIn size={16} /></button>
      <button type="button" className={BUTTON} title="Fit content" aria-label="Fit content" onClick={fitToScreen}><ArrowDown size={16} /></button>
      <span className="mx-1 h-6 border-l border-slate-700" />
      <button type="button" className={BUTTON} title="Undo" aria-label="Undo" disabled={!history.past.length} onClick={undo}><RotateCcw size={15} /></button>
      <button type="button" className={BUTTON} title="Redo" aria-label="Redo" disabled={!history.future.length} onClick={redo}><Redo2 size={15} /></button>
      <button type="button" className={BUTTON} title="Duplicate selected cards" aria-label="Duplicate selected cards" disabled={!selectedNodes.length} onClick={duplicateSelection}><Plus size={16} /></button>
      <button type="button" className={BUTTON} title="Delete selection" aria-label="Delete selection" disabled={!selectedNodes.length && !selectedEdge} onClick={deleteSelection}><Trash2 size={15} /></button>
      <span className="ml-auto text-xs text-slate-400">{document.nodes.length} cards · {document.edges.length} connections</span>
    </div>

    <div className="grid min-h-0 min-w-0 flex-1 gap-3 md:grid-cols-[minmax(0,1fr)_230px] md:grid-rows-[minmax(0,1fr)]">
      <div ref={workspace} data-testid="freeform-workspace" className="relative h-full min-h-0 min-w-0 touch-none overflow-hidden rounded border border-slate-700 outline-none" style={{ backgroundColor: document.background.color, ...gridStyle, cursor: tool === 'pan' ? 'grab' : tool === 'connect' ? 'crosshair' : 'default' }} onWheel={onWheel} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
        <div className="pointer-events-none absolute inset-0" style={{ transform: `translate(${document.viewport.x}px, ${document.viewport.y}px) scale(${document.viewport.zoom})`, transformOrigin: '0 0' }}>
          <div className="absolute border border-dashed border-slate-500/60" style={{ left: document.frame.x, top: document.frame.y, width: document.frame.width, height: document.frame.height }} />
        </div>
        <div className="absolute left-0 top-0 h-px w-px" style={{ transform: `translate(${document.viewport.x}px, ${document.viewport.y}px) scale(${document.viewport.zoom})`, transformOrigin: '0 0' }}>
          <svg width="1" height="1" viewBox="0 0 1 1" className="absolute left-0 top-0 overflow-visible">
            <defs><marker id="freeform-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" /></marker></defs>
            {document.edges.map(edge => {
              const geometry = edgeGeometry(edge, document.nodes);
              const dash = edge.dash === 'dashed' ? '8 6' : edge.dash === 'dotted' ? '2 6' : 'none';
              return <g key={edge.id} data-edge-id={edge.id} onPointerDown={event => { event.stopPropagation(); setSelectedEdge(edge.id); setSelectedNodes([]); }}>
                <path d={geometry.path} fill="none" stroke="transparent" strokeWidth={18} className="pointer-events-stroke" />
                <path d={geometry.path} fill="none" stroke={selectedEdge === edge.id ? '#fbbf24' : edge.color} strokeWidth={edge.width} strokeDasharray={dash} markerEnd={edge.direction === 'forward' || edge.direction === 'both' ? 'url(#freeform-arrow)' : undefined} markerStart={edge.direction === 'reverse' || edge.direction === 'both' ? 'url(#freeform-arrow)' : undefined} />
                {edge.label && <text x={(geometry.start.x + geometry.end.x) / 2} y={(geometry.start.y + geometry.end.y) / 2 - 8} fill="#e2e8f0" fontSize="13" textAnchor="middle">{edge.label}</text>}
                {edge.animation.enabled && Array.from({ length: edge.animation.particles }, (_, index) => <circle key={index} r="4" fill={edge.color}><animateMotion dur={`${edge.animation.duration}s`} begin={`${-index * edge.animation.duration / Math.max(1, edge.animation.particles)}s`} repeatCount="indefinite" path={geometry.path} /></circle>)}
                {selectedEdge === edge.id && edge.kind === 'bezier' && geometry.controls.map((point, index) => <g key={index} data-control="true" onPointerDown={event => { event.stopPropagation(); gesture.current = { kind: 'control', client: { x: event.clientX, y: event.clientY }, before: document, edgeId: edge.id, index: index as 0 | 1 }; workspace.current?.setPointerCapture(event.pointerId); }}><line x1={geometry.start.x} y1={geometry.start.y} x2={point.x} y2={point.y} stroke="#fbbf24" strokeDasharray="3 3" /><circle cx={point.x} cy={point.y} r="7" fill="#fbbf24" stroke="#0f172a" strokeWidth="2" className="cursor-move" /></g>)}
              </g>;
            })}
            {gesture.current?.kind === 'connect' && connectionPointer && (() => {
              const node = document.nodes.find(item => item.id === (gesture.current as Extract<Gesture, { kind: 'connect' }>).source);
              if (!node) return null;
              const active = gesture.current as Extract<Gesture, { kind: 'connect' }>;
              const point = anchorPoint(node, active.handle);
              return <path d={`M ${point.x} ${point.y} L ${connectionPointer.x} ${connectionPointer.y}`} stroke="#67e8f9" strokeWidth="2" strokeDasharray="6 4" fill="none" />;
            })()}
          </svg>
          {document.nodes.slice().sort((a, b) => a.zIndex - b.zIndex).map(node => {
            const color = node.color ?? '#60a5fa';
            return <article key={node.id} data-node-id={node.id} onPointerEnter={() => setHoveredNode(node.id)} onPointerLeave={() => setHoveredNode(value => value === node.id ? null : value)} onPointerDown={event => startMove(event, node)} className={`pointer-events-auto absolute box-border select-none rounded border p-3 text-slate-100 shadow-lg ${selectedNodes.includes(node.id) ? 'ring-2 ring-cyan-400/30' : ''}`} style={{ left: node.position.x, top: node.position.y, width: node.width, height: node.height, zIndex: node.zIndex + 1, borderColor: selectedNodes.includes(node.id) ? '#22d3ee' : color, background: `color-mix(in srgb, ${color} 12%, #17212b)`, cursor: tool === 'select' ? 'move' : 'default' }}>
            <div className="mb-2 flex items-center justify-between gap-2 border-b border-slate-700 pb-2">
              <span className="flex min-w-0 items-center gap-2 truncate text-sm font-semibold"><span className="shrink-0" style={{ color }}>{node.icon}</span><span className="truncate" style={{ color }}>{node.title}</span></span>
              <button type="button" className="text-[10px] text-slate-500 hover:text-slate-200" title="Bring card forward" aria-label="Bring card forward" onPointerDown={event => event.stopPropagation()} onClick={() => updateNode(node.id, { zIndex: Math.max(...document.nodes.map(item => item.zIndex)) + 1 })}><ArrowUp size={13} /></button>
            </div>
            <p className="overflow-hidden whitespace-pre-wrap text-xs leading-5 text-slate-300">{node.body}</p>
            {HANDLES.map(handle => <button key={handle} type="button" data-anchor={handle} data-node-id={node.id} aria-label={`Connect from ${node.title} ${handle}`} title={`Connect ${handle}`} onPointerDown={event => startConnect(event, node, handle)} className={`absolute h-3 w-3 rounded-full border border-slate-950 bg-cyan-300 transition-opacity ${hoveredNode === node.id || selectedNodes.includes(node.id) || tool === 'connect' ? 'opacity-100' : 'opacity-0'}`} style={{ left: handle === 'left' ? -6 : handle === 'right' ? 'auto' : '50%', right: handle === 'right' ? -6 : 'auto', top: handle === 'top' ? -6 : handle === 'bottom' ? 'auto' : '50%', bottom: handle === 'bottom' ? -6 : 'auto', transform: handle === 'left' || handle === 'right' ? 'translateY(-50%)' : 'translateX(-50%)' }} />)}
            {selectedNodes.includes(node.id) && <button type="button" aria-label="Resize card" title="Resize card" onPointerDown={event => { event.stopPropagation(); gesture.current = { kind: 'resize', client: { x: event.clientX, y: event.clientY }, before: document, id: node.id }; workspace.current?.setPointerCapture(event.pointerId); }} className="absolute -bottom-1 -right-1 h-3 w-3 cursor-nwse-resize rounded-sm border border-slate-950 bg-cyan-300" />}
          </article>;
          })}
        </div>
        <style>{'@media(prefers-reduced-motion:reduce){[data-edge-id] circle animateMotion{display:none}}'}</style>
      </div>

      <aside className="min-h-0 min-w-0 space-y-3 overflow-y-auto border-t border-slate-700 pt-3 md:border-l md:border-t-0 md:pl-3 md:pt-0">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-300">{activeNode ? 'Card properties' : activeEdge ? 'Connection properties' : 'Canvas properties'}</h3>
        {activeNode ? <>
          <label className="block space-y-1 text-xs text-slate-400">Title<input className={INPUT} value={activeNode.title} onChange={event => updateNode(activeNode.id, { title: event.target.value })} /></label>
          <label className="block space-y-1 text-xs text-slate-400">Icon<input aria-label="Card icon" className={INPUT} value={activeNode.icon ?? ''} maxLength={8} onChange={event => updateNode(activeNode.id, { icon: event.target.value })} /></label>
          <label className="block space-y-1 text-xs text-slate-400">Card color<input aria-label="Card color" className="block h-8 w-full" type="color" value={activeNode.color ?? '#60a5fa'} onChange={event => updateNode(activeNode.id, { color: event.target.value })} /></label>
          <label className="block space-y-1 text-xs text-slate-400">Content<textarea className={`${INPUT} min-h-24 resize-y`} value={activeNode.body} onChange={event => updateNode(activeNode.id, { body: event.target.value })} /></label>
          <div className="grid grid-cols-2 gap-2">{(['width', 'height'] as const).map(key => <label key={key} className="space-y-1 text-xs capitalize text-slate-400">{key}<input className={INPUT} type="number" min="80" value={activeNode[key]} onChange={event => updateNode(activeNode.id, { [key]: Math.max(80, Number(event.target.value)) })} /></label>)}</div>
        </> : activeEdge ? <>
          <label className="block space-y-1 text-xs text-slate-400">Path type<select className={INPUT} value={activeEdge.kind} onChange={event => updateEdge(activeEdge.id, { kind: event.target.value as CanvasEdge['kind'] })}><option value="straight">Straight</option><option value="elbow">Orthogonal</option><option value="curve">Smooth curve</option><option value="bezier">Editable Bezier</option><option value="freehand">Custom curve</option></select></label>
          <label className="block space-y-1 text-xs text-slate-400">Label<input className={INPUT} value={activeEdge.label} onChange={event => updateEdge(activeEdge.id, { label: event.target.value })} /></label>
          <div className="grid grid-cols-2 gap-2"><label className="space-y-1 text-xs text-slate-400">Color<input className="block h-8 w-full" type="color" value={activeEdge.color} onChange={event => updateEdge(activeEdge.id, { color: event.target.value })} /></label><label className="space-y-1 text-xs text-slate-400">Weight<input className={INPUT} type="number" min="1" max="12" value={activeEdge.width} onChange={event => updateEdge(activeEdge.id, { width: Math.min(12, Math.max(1, Number(event.target.value))) })} /></label></div>
          <label className="block space-y-1 text-xs text-slate-400">Line<select className={INPUT} value={activeEdge.dash} onChange={event => updateEdge(activeEdge.id, { dash: event.target.value as CanvasEdge['dash'] })}><option value="solid">Solid</option><option value="dashed">Dashed</option><option value="dotted">Dotted</option></select></label>
          <label className="block space-y-1 text-xs text-slate-400">Direction<select className={INPUT} value={activeEdge.direction} onChange={event => updateEdge(activeEdge.id, { direction: event.target.value as CanvasEdge['direction'] })}><option value="forward">Forward</option><option value="reverse">Reverse</option><option value="both">Bidirectional</option><option value="none">No arrows</option></select></label>
          <label className="block space-y-1 text-xs text-slate-400">Source<select className={INPUT} value={activeEdge.source} onChange={event => updateEdge(activeEdge.id, { source: event.target.value })}>{document.nodes.filter(node => node.id !== activeEdge.target).map(node => <option key={node.id} value={node.id}>{node.title}</option>)}</select></label>
          <label className="block space-y-1 text-xs text-slate-400">Destination<select className={INPUT} value={activeEdge.target} onChange={event => updateEdge(activeEdge.id, { target: event.target.value })}>{document.nodes.filter(node => node.id !== activeEdge.source).map(node => <option key={node.id} value={node.id}>{node.title}</option>)}</select></label>
          <label className="flex items-center gap-2 text-xs text-slate-300"><input type="checkbox" checked={activeEdge.animation.enabled} onChange={event => updateEdge(activeEdge.id, { animation: { ...activeEdge.animation, enabled: event.target.checked } })} />Animate particles</label>
          <label className="block space-y-1 text-xs text-slate-400">Particle speed (seconds)<input className={INPUT} type="number" min="0.25" max="20" step="0.25" value={activeEdge.animation.duration} onChange={event => updateEdge(activeEdge.id, { animation: { ...activeEdge.animation, duration: Math.max(0.25, Number(event.target.value)) } })} /></label>
          <label className="block space-y-1 text-xs text-slate-400">Particle count<input className={INPUT} type="number" min="1" max="12" value={activeEdge.animation.particles} onChange={event => updateEdge(activeEdge.id, { animation: { ...activeEdge.animation, particles: Math.max(1, Math.min(12, Number(event.target.value))) } })} /></label>
          <button type="button" className={`${BUTTON} !w-auto gap-2 px-2`} onClick={() => updateEdge(activeEdge.id, { direction: activeEdge.direction === 'reverse' ? 'forward' : 'reverse' })}><ArrowLeftRight size={14} />Reverse direction</button>
          {activeEdge.kind === 'bezier' && <p className="text-xs text-slate-500">Drag either yellow handle to reshape this connection.</p>}
        </> : <>
          <label className="block space-y-1 text-xs text-slate-400">Background<input className="block h-8 w-full" type="color" value={document.background.color} onChange={event => commit({ ...document, background: { ...document.background, color: event.target.value } })} /></label>
          <label className="block space-y-1 text-xs text-slate-400">Grid<select className={INPUT} value={document.background.grid} onChange={event => commit({ ...document, background: { ...document.background, grid: event.target.value as CanvasDocument['background']['grid'] } })}><option value="none">None</option><option value="dots">Dotted</option><option value="lines">Lines</option></select></label>
          <label className="block space-y-1 text-xs text-slate-400">Grid spacing<input className={INPUT} type="number" min="8" max="100" value={document.background.gridSize} onChange={event => commit({ ...document, background: { ...document.background, gridSize: Math.min(100, Math.max(8, Number(event.target.value))) } })} /></label>
          <label className="flex items-center gap-2 text-xs text-slate-300"><input type="checkbox" checked={document.background.snap} onChange={event => commit({ ...document, background: { ...document.background, snap: event.target.checked } })} />Snap to grid</label>
          <div className="grid grid-cols-2 gap-2">{(['width', 'height'] as const).map(key => <label key={key} className="space-y-1 text-xs capitalize text-slate-400">Frame {key}<input className={INPUT} type="number" min="100" value={document.frame[key]} onChange={event => commit({ ...document, frame: { ...document.frame, [key]: Math.max(100, Number(event.target.value)) } })} /></label>)}</div>
        </>}
        <label className="block space-y-1 text-xs text-slate-400">Export boundary<select className={INPUT} value={exportRegion} onChange={event => setExportRegion(event.target.value as ExportRegion)}><option value="all">All content</option><option value="frame">Fixed frame</option><option value="selection">Selected cards</option></select></label>
        <div className="flex gap-2"><button type="button" className="h-9 flex-1 rounded border border-slate-600 text-xs text-slate-200 hover:bg-slate-800" onClick={() => void exportCanvas('svg')}>Export SVG</button><button type="button" className="h-9 flex-1 rounded border border-slate-600 text-xs text-slate-200 hover:bg-slate-800" onClick={() => void exportCanvas('png')}>Export PNG</button><button type="button" className="h-9 flex-1 rounded border border-slate-600 text-xs text-slate-200 hover:bg-slate-800" onClick={() => void exportCanvas('gif')}>Export GIF</button></div>
        {status && <p role="status" className="text-xs text-emerald-300">{status}</p>}
      </aside>
    </div>
  </section>;
}
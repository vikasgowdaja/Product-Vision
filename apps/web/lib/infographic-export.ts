import { getFontEmbedCSS, toCanvas, toSvg } from 'html-to-image';
import { frameAt, timelineSchedule, type AnimationConfig, type FrameState } from './infographic-animation';
import { measureScene, pointOnPath, type DomScene } from './infographic-dom';

export interface ExportOptions { width: number; fps: number; colors: number; loopDuration: number }
export interface ExportProgress { stage: string; progress: number }

export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

function ensureActive(signal: AbortSignal) {
  if (signal.aborted) throw new DOMException('Export cancelled.', 'AbortError');
}

function workerRequest(worker: Worker, message: object, signal: AbortSignal, transfer: Transferable[] = []) {
  return new Promise<{ type: string; bytes?: ArrayBuffer }>((resolve, reject) => {
    const cleanup = () => {
      worker.removeEventListener('message', onMessage);
      worker.removeEventListener('error', onError);
      signal.removeEventListener('abort', onAbort);
    };
    const onMessage = (event: MessageEvent) => {
      cleanup();
      if (event.data.type === 'error') reject(new Error(event.data.message));
      else resolve(event.data);
    };
    const onError = (event: ErrorEvent) => { cleanup(); reject(new Error(event.message || 'The GIF worker failed.')); };
    const onAbort = () => { cleanup(); reject(new DOMException('Export cancelled.', 'AbortError')); };
    worker.addEventListener('message', onMessage);
    worker.addEventListener('error', onError);
    signal.addEventListener('abort', onAbort, { once: true });
    if (signal.aborted) { onAbort(); return; }
    worker.postMessage(message, transfer);
  });
}

interface Layers { background: HTMLCanvasElement; nodes: HTMLCanvasElement[]; scale: number }

function cloneScene(source: HTMLElement, scene: DomScene, config: AnimationConfig) {
  const container = document.createElement('div');
  container.setAttribute('aria-hidden', 'true');
  Object.assign(container.style, { position: 'fixed', left: '-100000px', top: '0', width: `${scene.width}px`, pointerEvents: 'none' });
  const root = source.cloneNode(true) as HTMLElement;
  root.querySelectorAll('[data-connector-layer]').forEach(element => element.remove());
  root.querySelectorAll<HTMLElement>('[data-node-id]').forEach(element => {
    const node = scene.nodes.find(item => item.id === element.dataset.nodeId);
    if (node) element.setAttribute('style', node.originalStyle);
  });
  root.style.width = `${scene.width}px`;
  root.style.margin = '0';
  container.appendChild(root);
  document.body.appendChild(container);
  const measured = measureScene(root, source.dataset.infographicLayout ?? 'tips', config);
  return { root, scene: measured, dispose: () => { measured.dispose(); container.remove(); } };
}

async function captureLayers(root: HTMLElement, scene: DomScene, width: number, signal: AbortSignal, progress: (value: ExportProgress) => void): Promise<Layers> {
  scene.reset();
  await document.fonts.ready;
  await Promise.all(Array.from(root.querySelectorAll('img')).map(image => image.decode()));
  ensureActive(signal);
  const scale = width / scene.width;
  const fontEmbedCSS = await getFontEmbedCSS(root);
  const options = { pixelRatio: scale, fontEmbedCSS, cacheBust: false };
  try {
    scene.nodes.forEach(node => { node.element.style.visibility = 'hidden'; });
    const background = await toCanvas(root, { ...options, width: scene.width, height: scene.height, backgroundColor: '#0f172a' });
    const nodes: HTMLCanvasElement[] = [];
    for (let index = 0; index < scene.nodes.length; index += 1) {
      ensureActive(signal);
      const node = scene.nodes[index];
      node.element.style.visibility = 'visible';
      nodes.push(await toCanvas(node.element, { ...options, width: node.bounds.width, height: node.bounds.height, style: { opacity: '1', transform: 'none', visibility: 'visible' } }));
      node.element.style.visibility = 'hidden';
      progress({ stage: 'Preparing layers', progress: (index + 1) / scene.nodes.length * 0.15 });
    }
    return { background, nodes, scale };
  } finally { scene.reset(); }
}

function composite(context: CanvasRenderingContext2D, scene: DomScene, layers: Layers, config: AnimationConfig, frame: FrameState, time: number) {
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, context.canvas.width, context.canvas.height);
  context.drawImage(layers.background, 0, 0, context.canvas.width, context.canvas.height);
  context.scale(layers.scale, layers.scale);
  scene.nodes.forEach((node, index) => {
    const state = frame.nodes[node.id];
    const box = node.bounds;
    context.save();
    context.globalAlpha = state.opacity;
    context.translate(box.x + box.width / 2, box.y + box.height / 2);
    context.scale(state.scale, state.scale);
    context.drawImage(layers.nodes[index], -box.width / 2, -box.height / 2, box.width, box.height);
    context.restore();
    if (state.active > 0) {
      context.save();
      context.globalAlpha = state.active * 0.63;
      context.strokeStyle = config.particleColor;
      context.lineWidth = 2;
      context.beginPath();
      context.roundRect(box.x - 1, box.y - 1, box.width + 2, box.height + 2, 8);
      context.stroke();
      context.restore();
    }
  });
  if (!config.enabled) return;
  const loopFade = config.infinite || config.loops > 1 ? Math.min(1, (config.duration - time) / 0.25) : 1;
  scene.connectors.forEach(connector => {
    const state = frame.connectors[connector.id];
    context.save();
    context.strokeStyle = config.particleColor;
    context.fillStyle = config.particleColor;
    context.lineWidth = 1.4;
    context.lineCap = 'round';
    const length = connector.path.getTotalLength();
    context.setLineDash([length * state.draw, length + 1]);
    context.globalAlpha = 0.65 * loopFade;
    if (state.draw > 0) context.stroke(new Path2D(connector.path.getAttribute('d')!));
    context.setLineDash([]);
    const end = pointOnPath(connector.points, config.reverse ? 0 : 1);
    const before = pointOnPath(connector.points, config.reverse ? 0.015 : 0.985);
    if (state.draw >= 0.99) {
      context.save();
      context.translate(end.x, end.y);
      context.rotate(Math.atan2(end.y - before.y, end.x - before.x));
      context.beginPath();
      context.moveTo(-5, -3); context.lineTo(0, 0); context.lineTo(-5, 3); context.closePath();
      context.fill();
      context.restore();
    }
    context.globalAlpha = state.particleOpacity;
    state.particles.forEach(phase => {
      if (phase < 0) return;
      const point = pointOnPath(connector.points, phase);
      context.beginPath(); context.arc(point.x, point.y, config.particleSize, 0, Math.PI * 2); context.fill();
    });
    context.restore();
  });
  scene.nodes.forEach(node => {
    const state = frame.nodes[node.id];
    if (!state.border) return;
    context.save();
    const box = node.bounds;
    const perimeter = (box.width + box.height) * 2;
    context.strokeStyle = config.particleColor;
    context.globalAlpha = state.opacity;
    context.lineWidth = 1.5;
    context.setLineDash([perimeter * state.border, perimeter + 1]);
    context.beginPath(); context.roundRect(box.x, box.y, box.width, box.height, 7); context.stroke();
    context.restore();
  });
}

export async function exportGif(source: HTMLElement, original: DomScene, config: AnimationConfig, options: ExportOptions, signal: AbortSignal, progress: (value: ExportProgress) => void) {
  const width = Math.round(options.width || original.width);
  const height = Math.round(width / original.width * original.height);
  const seconds = options.loopDuration;
  const frameCount = Math.max(2, Math.round(seconds * options.fps));
  if (frameCount > 360 || width * height > 8000000 || width * height * frameCount > 350000000) {
    throw new Error('This export is too large. Reduce resolution, duration, or frame rate, or increase playback speed (maximum 360 frames and 350 million total pixels).');
  }
  const { root, scene, dispose } = cloneScene(source, original, config);
  const worker = new Worker(new URL('../workers/gif-encoder.worker.ts', import.meta.url));
  try {
    progress({ stage: 'Preparing layers', progress: 0 });
    const layers = await captureLayers(root, scene, width, signal, progress);
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('Canvas export is not supported in this browser.');
    composite(context, scene, layers, config, frameAt(scene.model, { ...config, enabled: false }, 0), config.duration / 2);
    const palette = context.getImageData(0, 0, width, height).data.buffer;
    const repeat = config.infinite ? 0 : config.loops === 1 ? -1 : config.loops - 1;
    await workerRequest(worker, { type: 'start', width, height, repeat, colors: options.colors, palette, color: config.particleColor }, signal, [palette]);
    const schedule = timelineSchedule(scene.model, config);
    for (let index = 0; index < frameCount; index += 1) {
      ensureActive(signal);
      const time = index / (frameCount - 1) * config.duration;
      const frame = frameAt(scene.model, config, time, schedule);
      composite(context, scene, layers, config, frame, time);
      const rgba = context.getImageData(0, 0, width, height).data.buffer;
      const delay = (Math.round((index + 1) * seconds * 100 / frameCount) - Math.round(index * seconds * 100 / frameCount)) * 10;
      await workerRequest(worker, { type: 'frame', rgba, delay }, signal, [rgba]);
      progress({ stage: 'Encoding GIF', progress: 0.15 + (index + 1) / frameCount * 0.84 });
    }
    const result = await workerRequest(worker, { type: 'finish' }, signal);
    if (!result.bytes) throw new Error('The GIF encoder returned an empty file.');
    progress({ stage: 'Complete', progress: 1 });
    return new Blob([result.bytes], { type: 'image/gif' });
  } finally { worker.terminate(); dispose(); }
}

export async function exportStatic(source: HTMLElement, original: DomScene, config: AnimationConfig, format: 'png' | 'svg', width: number) {
  const { root, scene, dispose } = cloneScene(source, original, config);
  try {
  await document.fonts.ready;
  await Promise.all(Array.from(root.querySelectorAll('img')).map(image => image.decode()));
  scene.paint(config.duration, { ...config, lines: false, particles: false, reveal: false, pulse: false, border: false, infinite: false, loops: 1, endState: 'hold' });
  const fontEmbedCSS = await getFontEmbedCSS(root);
  const options = { pixelRatio: (width || scene.width) / scene.width, fontEmbedCSS, width: scene.width, height: scene.height };
  if (format === 'svg') {
    const data = await toSvg(root, options);
    const document = new DOMParser().parseFromString(await (await fetch(data)).text(), 'image/svg+xml');
    const svg = document.documentElement;
    svg.setAttribute('viewBox', `0 0 ${scene.width} ${scene.height}`);
    svg.setAttribute('width', `${width || scene.width}`);
    svg.setAttribute('height', `${Math.round((width || scene.width) / scene.width * scene.height)}`);
    return new Blob([new XMLSerializer().serializeToString(document)], { type: 'image/svg+xml' });
  }
  const canvas = await toCanvas(root, options);
  return await new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('PNG encoding failed.')), 'image/png'));
  } finally { dispose(); }
}
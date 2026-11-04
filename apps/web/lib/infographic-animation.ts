export type AnimationPreset = 'flow' | 'particles' | 'sequential' | 'network' | 'pipeline' | 'radial' | 'loop' | 'presentation';

export interface SceneNode {
  id: string;
  order: number;
}

export interface SceneConnector {
  id: string;
  from: string;
  to: string;
  kind: 'straight' | 'curve' | 'branch';
}

export interface InfographicScene {
  nodes: SceneNode[];
  connectors: SceneConnector[];
}

export interface AnimationConfig {
  enabled: boolean;
  preset: AnimationPreset;
  lines: boolean;
  particles: boolean;
  reveal: boolean;
  pulse: boolean;
  border: boolean;
  execution: 'sequential' | 'parallel';
  duration: number;
  delay: number;
  elementDuration: number;
  stagger: number;
  speed: number;
  loops: number;
  infinite: boolean;
  startState: 'visible' | 'hidden';
  endState: 'hold' | 'fade';
  particleCount: number;
  particleSize: number;
  particleColor: string;
  particleSpeed: number;
  reverse: boolean;
}

export const DEFAULT_ANIMATION: AnimationConfig = {
  enabled: false, preset: 'flow', lines: true, particles: true, reveal: false,
  pulse: false, border: false, execution: 'parallel', duration: 6, delay: 0.3,
  elementDuration: 0.6, stagger: 0.15, speed: 1, loops: 1, infinite: true,
  startState: 'visible', endState: 'hold', particleCount: 3, particleSize: 2.5,
  particleColor: '#38bdf8', particleSpeed: 1, reverse: false,
};

export const PRESETS: { id: AnimationPreset; label: string; settings: Partial<AnimationConfig> }[] = [
  { id: 'flow', label: 'Flow Animation', settings: { lines: true, particles: false, reveal: false, execution: 'parallel' } },
  { id: 'particles', label: 'Particle Flow', settings: { lines: false, particles: true, reveal: false, execution: 'parallel' } },
  { id: 'sequential', label: 'Sequential Reveal', settings: { lines: true, particles: true, reveal: true, execution: 'sequential' } },
  { id: 'network', label: 'Network Animation', settings: { lines: true, particles: true, reveal: false, pulse: true, execution: 'parallel' } },
  { id: 'pipeline', label: 'Pipeline Animation', settings: { lines: true, particles: true, reveal: true, execution: 'sequential' } },
  { id: 'radial', label: 'Radial Animation', settings: { lines: true, particles: true, reveal: true, execution: 'parallel' } },
  { id: 'loop', label: 'Loop Animation', settings: { lines: false, particles: true, reveal: false, infinite: true, execution: 'parallel' } },
  { id: 'presentation', label: 'Presentation Animation', settings: { lines: true, particles: true, reveal: true, border: true, execution: 'sequential' } },
];

export function applyPreset(config: AnimationConfig, preset: AnimationPreset): AnimationConfig {
  return { ...config, pulse: false, border: false, ...PRESETS.find(item => item.id === preset)?.settings, preset };
}

export function buildScene(ids: string[], layout: string, preset: AnimationPreset): InfographicScene {
  const nodes = ids.map((id, order) => ({ id, order }));
  const connectors = ids.slice(1).map((id, index) => {
    const chain = (layout === 'steps' || preset === 'pipeline') && preset !== 'radial';
    const from = chain ? ids[index] : ids[0];
    return { id: `${from}--${id}`, from, to: id, kind: chain ? 'curve' as const : 'branch' as const };
  });
  if (preset === 'network' && ids.length > 3) {
    connectors.push({ id: `${ids[1]}--${ids[ids.length - 1]}`, from: ids[1], to: ids[ids.length - 1], kind: 'curve' });
  }
  return { nodes, connectors };
}

const clamp = (value: number) => Math.min(1, Math.max(0, value));

export function timelineSchedule(scene: InfographicScene, config: AnimationConfig) {
  const depth = new Map(scene.nodes.map(node => [node.id, 0]));
  for (let iteration = 0; iteration < scene.nodes.length; iteration += 1) {
    let changed = false;
    for (const connector of scene.connectors) {
      const current = depth.get(connector.to) ?? 0;
      const candidate = Math.min(scene.nodes.length, (depth.get(connector.from) ?? 0) + 1);
      if (candidate > current) { depth.set(connector.to, candidate); changed = true; }
    }
    if (!changed) break;
  }
  const raw = scene.connectors.map((connector, index) => ({
    id: connector.id,
    start: config.delay + config.elementDuration + (config.execution === 'parallel'
      ? (depth.get(connector.from) ?? 0) * (config.elementDuration * (1 + 1 / config.particleSpeed) + config.stagger)
      : index * (config.elementDuration * (1 + 1 / config.particleSpeed) + config.stagger)),
  }));
  const required = Math.max(config.duration, config.delay + config.elementDuration,
    ...raw.map(item => item.start + config.elementDuration * (2 + 1 / config.particleSpeed) + 0.4));
  const scale = config.duration / required;
  return {
    scale,
    duration: config.duration,
    connectors: raw.map(item => ({ ...item, start: item.start * scale, duration: config.elementDuration * scale })),
  };
}

export interface FrameState {
  nodes: Record<string, { opacity: number; scale: number; active: number; border: number }>;
  connectors: Record<string, { draw: number; particles: number[]; particleOpacity: number }>;
}

export function frameAt(scene: InfographicScene, config: AnimationConfig, time: number, schedule = timelineSchedule(scene, config)): FrameState {
  const nodes: FrameState['nodes'] = {};
  const connectors: FrameState['connectors'] = {};
  const fade = config.endState === 'fade' ? clamp((config.duration - time) / 0.35) : 1;
  const loopFade = config.infinite || config.loops > 1 ? clamp((config.duration - time) / 0.25) : 1;
  for (const node of scene.nodes) {
    const incoming = scene.connectors.filter(connector => connector.to === node.id)
      .map(connector => schedule.connectors.find(item => item.id === connector.id)!);
    const activation = incoming.length ? Math.min(...incoming.map(item => item.start + item.duration * (1 + 1 / config.particleSpeed))) : config.delay * schedule.scale;
    const reveal = clamp((time - activation) / Math.max(0.01, config.elementDuration * schedule.scale));
    const interval = config.elementDuration * schedule.scale / config.particleSpeed / config.particleCount;
    const sinceArrival = config.particles && incoming.length && time >= activation
      ? (time - activation) % interval : time - activation;
    const active = time >= activation ? Math.max(0, 1 - sinceArrival / Math.min(0.7, interval)) : 0;
    const opacity = !config.enabled || !config.reveal || config.startState === 'visible' ? 1 : reveal;
    nodes[node.id] = {
      opacity: config.enabled ? opacity * fade : 1,
      scale: config.enabled && config.reveal ? 0.98 + reveal * 0.02 : 1,
      active: config.enabled ? Math.max(active, config.pulse && time >= activation ? 0.15 + Math.sin(time * 3) * 0.1 : 0) * loopFade : 0,
      border: config.enabled && config.border ? reveal : 0,
    };
  }
  for (const connector of scene.connectors) {
    const entry = schedule.connectors.find(item => item.id === connector.id)!;
    const draw = config.enabled && config.lines ? clamp((time - entry.start) / Math.max(0.01, entry.duration)) : 1;
    const particleStart = entry.start + entry.duration;
    const travelDuration = Math.max(0.05, entry.duration / config.particleSpeed);
    const elapsed = (time - particleStart) / travelDuration;
    const particles = Array.from({ length: config.particleCount }, (_, index) => {
      const travelled = elapsed - index / config.particleCount;
      if (travelled < 0) return -1;
      const phase = (travelled % 1 + 1) % 1;
      return config.reverse ? 1 - phase : phase;
    });
    const envelope = Math.min(clamp(elapsed * 4), clamp((config.duration - time) / 0.3));
    connectors[connector.id] = {
      draw,
      particles,
      particleOpacity: config.enabled && config.particles && time >= particleStart ? envelope * fade : 0,
    };
  }
  return { nodes, connectors };
}

export function playbackTime(elapsed: number, config: AnimationConfig) {
  const duration = Math.max(0.1, config.duration);
  const scaled = Math.max(0, elapsed) * config.speed;
  const finished = !config.infinite && scaled >= duration * Math.max(1, config.loops);
  return { time: finished ? duration : scaled % duration, finished };
}

export interface Point { x: number; y: number }
export interface NodeBounds extends Point { width: number; height: number }

export function connectorPath(from: NodeBounds, to: NodeBounds, kind: SceneConnector['kind']): string {
  const start = { x: from.x + from.width / 2, y: from.y + from.height };
  const end = { x: to.x + to.width / 2, y: to.y };
  if (to.y < from.y + from.height) {
    const rightward = to.x > from.x;
    start.x = rightward ? from.x + from.width : from.x;
    start.y = from.y + from.height / 2;
    end.x = rightward ? to.x : to.x + to.width;
    end.y = to.y + to.height / 2;
    const middle = (start.x + end.x) / 2;
    return `M ${start.x} ${start.y} C ${middle} ${start.y}, ${middle} ${end.y}, ${end.x} ${end.y}`;
  }
  if (kind === 'straight') return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
  if (kind === 'branch') {
    const left = end.x <= start.x;
    const rail = left ? to.x - 7 : to.x + to.width + 7;
    const destinationX = left ? to.x : to.x + to.width;
    const destinationY = to.y + Math.min(to.height / 2, 24);
    const junction = start.y + 6;
    return `M ${start.x} ${start.y} C ${start.x} ${junction}, ${rail} ${junction}, ${rail} ${junction + 5} L ${rail} ${destinationY - 5} Q ${rail} ${destinationY}, ${destinationX} ${destinationY}`;
  }
  const middle = (start.y + end.y) / 2;
  return `M ${start.x} ${start.y} C ${start.x} ${middle}, ${end.x} ${middle}, ${end.x} ${end.y}`;
}
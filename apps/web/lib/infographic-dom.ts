import { buildScene, connectorPath, frameAt, timelineSchedule, type AnimationConfig, type FrameState, type InfographicScene, type NodeBounds, type Point } from './infographic-animation';

const SVG_NS = 'http://www.w3.org/2000/svg';

function svgElement<Tag extends keyof SVGElementTagNameMap>(tag: Tag, attributes: Record<string, string>) {
  const element = document.createElementNS(SVG_NS, tag);
  Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
  return element;
}

export interface MeasuredNode { id: string; element: HTMLElement; bounds: NodeBounds; originalStyle: string }
export interface MeasuredConnector {
  id: string;
  path: SVGPathElement;
  arrow: SVGPathElement;
  dots: SVGCircleElement[];
  points: Point[];
}

export interface DomScene {
  model: InfographicScene;
  nodes: MeasuredNode[];
  connectors: MeasuredConnector[];
  borders: Map<string, SVGRectElement>;
  overlay: SVGSVGElement;
  width: number;
  height: number;
  paint: (time: number, config: AnimationConfig) => FrameState;
  reset: () => void;
  dispose: () => void;
}

export function pointOnPath(points: Point[], progress: number): Point {
  const position = Math.min(points.length - 1, Math.max(0, progress * (points.length - 1)));
  const index = Math.floor(position);
  const next = points[Math.min(index + 1, points.length - 1)];
  const fraction = position - index;
  return { x: points[index].x + (next.x - points[index].x) * fraction, y: points[index].y + (next.y - points[index].y) * fraction };
}

export function measureScene(root: HTMLElement, layout: string, config: AnimationConfig): DomScene {
  const bounds = root.getBoundingClientRect();
  const width = root.offsetWidth;
  const height = root.offsetHeight;
  const ratio = width / Math.max(1, bounds.width);
  const nodes = Array.from(root.querySelectorAll<HTMLElement>('[data-node-id]')).map(element => {
    const box = element.getBoundingClientRect();
    return {
      id: element.dataset.nodeId!, element, originalStyle: element.getAttribute('style') ?? '',
      bounds: { x: (box.left - bounds.left) * ratio, y: (box.top - bounds.top) * ratio, width: box.width * ratio, height: box.height * ratio },
    };
  });
  const model = buildScene(nodes.map(node => node.id), layout, config.preset);
  const overlay = svgElement('svg', { viewBox: `0 0 ${width} ${height}`, width: `${width}`, height: `${height}`, 'aria-hidden': 'true', 'data-connector-layer': '' });
  Object.assign(overlay.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none', zIndex: '20' });
  root.appendChild(overlay);
  const connectors = model.connectors.map(connector => {
    const from = nodes.find(node => node.id === connector.from)!;
    const to = nodes.find(node => node.id === connector.to)!;
    const path = svgElement('path', {
      id: connector.id, d: connectorPath(from.bounds, to.bounds, connector.kind),
      fill: 'none', stroke: config.particleColor, 'stroke-width': '1.4',
      'stroke-linecap': 'round', pathLength: '1', 'stroke-dasharray': '1',
      'data-connector-id': connector.id,
    });
    overlay.appendChild(path);
    const length = path.getTotalLength();
    const points = Array.from({ length: 201 }, (_, index) => {
      const point = path.getPointAtLength(length * index / 200);
      return { x: point.x, y: point.y };
    });
    const arrow = svgElement('path', { fill: config.particleColor, 'data-arrow-id': connector.id });
    overlay.appendChild(arrow);
    const dots = Array.from({ length: config.particleCount }, (_, index) => {
      const dot = svgElement('circle', { r: `${config.particleSize}`, fill: config.particleColor, 'data-particle-id': `${connector.id}-${index}` });
      overlay.appendChild(dot);
      return dot;
    });
    return { id: connector.id, path, arrow, dots, points };
  });
  const borders = new Map<string, SVGRectElement>();
  nodes.forEach(node => {
    const box = node.bounds;
    const border = svgElement('rect', {
      x: `${box.x}`, y: `${box.y}`, width: `${box.width}`, height: `${box.height}`,
      rx: '7', fill: 'none', stroke: config.particleColor, 'stroke-width': '1.5',
      pathLength: '1', 'stroke-dasharray': '1', 'data-border-id': node.id,
    });
    overlay.appendChild(border);
    borders.set(node.id, border);
  });
  function reset() {
    nodes.forEach(node => node.element.setAttribute('style', node.originalStyle));
    overlay.style.visibility = 'hidden';
  }
  let scheduledConfig = config;
  let schedule = timelineSchedule(model, config);
  function paint(time: number, current: AnimationConfig) {
    if (scheduledConfig !== current) {
      scheduledConfig = current;
      schedule = timelineSchedule(model, current);
    }
    const frame = frameAt(model, current, time, schedule);
    overlay.style.visibility = current.enabled ? 'visible' : 'hidden';
    nodes.forEach(node => {
      const state = frame.nodes[node.id];
      node.element.style.opacity = `${state.opacity}`;
      node.element.style.transform = state.scale === 1 ? 'none' : `scale(${state.scale})`;
      node.element.style.boxShadow = current.enabled && state.active > 0 ? `0 0 0 2px ${current.particleColor}${Math.round(state.active * 160).toString(16).padStart(2, '0')}` : '';
      const border = borders.get(node.id)!;
      border.style.opacity = `${state.border > 0 ? state.opacity : 0}`;
      border.setAttribute('stroke-dashoffset', `${1 - state.border}`);
    });
    const loopFade = current.infinite || current.loops > 1 ? Math.min(1, (current.duration - time) / 0.25) : 1;
    connectors.forEach(connector => {
      const state = frame.connectors[connector.id];
      connector.path.setAttribute('stroke-dashoffset', `${1 - state.draw}`);
      connector.path.style.opacity = `${state.draw > 0 ? 0.65 * loopFade : 0}`;
      const end = pointOnPath(connector.points, current.reverse ? 0 : 1);
      const before = pointOnPath(connector.points, current.reverse ? 0.015 : 0.985);
      const angle = Math.atan2(end.y - before.y, end.x - before.x) * 180 / Math.PI;
      connector.arrow.setAttribute('d', 'M -5 -3 L 0 0 L -5 3 Z');
      connector.arrow.setAttribute('transform', `translate(${end.x} ${end.y}) rotate(${angle})`);
      connector.arrow.style.opacity = `${state.draw >= 0.99 ? loopFade : 0}`;
      connector.dots.forEach((dot, index) => {
        const point = pointOnPath(connector.points, state.particles[index]);
        dot.setAttribute('cx', `${point.x}`);
        dot.setAttribute('cy', `${point.y}`);
        dot.style.opacity = `${state.particles[index] < 0 ? 0 : state.particleOpacity}`;
      });
    });
    return frame;
  }
  return { model, nodes, connectors, borders, overlay, width, height, paint, reset, dispose: () => { reset(); overlay.remove(); } };
}
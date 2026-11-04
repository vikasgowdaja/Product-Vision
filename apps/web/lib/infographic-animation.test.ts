import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DEFAULT_ANIMATION, buildScene, frameAt, playbackTime, timelineSchedule, connectorPath } from './infographic-animation';

test('parallel branches share a start and independent stable identifiers', () => {
  const scene = buildScene(['root', 'left', 'right'], 'comparison', 'flow');
  const schedule = timelineSchedule(scene, { ...DEFAULT_ANIMATION, enabled: true });
  assert.equal(schedule.connectors[0].start, schedule.connectors[1].start);
  assert.deepEqual(scene.connectors.map(item => item.id), ['root--left', 'root--right']);
});

test('pipeline activates downstream stages after their parents', () => {
  const scene = buildScene(['root', 'first', 'second'], 'steps', 'pipeline');
  const config = { ...DEFAULT_ANIMATION, enabled: true, reveal: true, startState: 'hidden' as const };
  const schedule = timelineSchedule(scene, config);
  assert.ok(schedule.connectors[1].start > schedule.connectors[0].start);
  assert.equal(frameAt(scene, config, 0).nodes.second.opacity, 0);
  assert.equal(frameAt(scene, config, config.duration).nodes.second.opacity, 1);
  assert.ok(Object.values(frameAt(scene, config, config.duration).connectors).every(item => item.draw === 1));
});

test('static state is fully visible and particle free', () => {
  const scene = buildScene(['root', 'leaf'], 'tips', 'flow');
  const state = frameAt(scene, DEFAULT_ANIMATION, 0);
  assert.equal(state.nodes.leaf.opacity, 1);
  assert.equal(state.connectors['root--leaf'].draw, 1);
  assert.equal(state.connectors['root--leaf'].particleOpacity, 0);
});

test('finite playback stops at the final state and infinite playback wraps', () => {
  assert.deepEqual(playbackTime(12, { ...DEFAULT_ANIMATION, infinite: false, loops: 2 }), { time: 6, finished: true });
  assert.deepEqual(playbackTime(12, DEFAULT_ANIMATION), { time: 0, finished: false });
  assert.deepEqual(playbackTime(2, { ...DEFAULT_ANIMATION, speed: 2 }), { time: 4, finished: false });
});

test('particle phases are deterministic and reverse follows the same path', () => {
  const scene = buildScene(['root', 'leaf'], 'tips', 'flow');
  const config = { ...DEFAULT_ANIMATION, enabled: true };
  const forward = frameAt(scene, config, 2).connectors['root--leaf'];
  const backward = frameAt(scene, { ...config, reverse: true }, 2).connectors['root--leaf'];
  assert.deepEqual(frameAt(scene, config, 2), frameAt(scene, config, 2));
  forward.particles.forEach((value, index) => assert.equal(value + backward.particles[index], 1));
  assert.equal(frameAt(scene, config, 0).connectors['root--leaf'].particleOpacity, 0);
  assert.equal(frameAt(scene, config, config.duration).connectors['root--leaf'].particleOpacity, 0);
});

test('connector geometry supports straight, curved and side by side paths', () => {
  const root = { x: 0, y: 0, width: 100, height: 50 };
  assert.equal(connectorPath(root, { ...root, y: 100 }, 'straight'), 'M 50 50 L 50 100');
  assert.match(connectorPath(root, { ...root, y: 100 }, 'branch'), / C /);
  assert.match(connectorPath(root, { ...root, x: 200 }, 'curve'), /^M 100 25 C/);
});

test('destination activation follows actual particle speed and loop highlights settle', () => {
  const scene = buildScene(['root', 'leaf'], 'tips', 'flow');
  const config = { ...DEFAULT_ANIMATION, enabled: true, particleSpeed: 2 };
  const entry = timelineSchedule(scene, config).connectors[0];
  const arrival = entry.start + entry.duration * 1.5;
  assert.equal(frameAt(scene, config, arrival - 0.01).nodes.leaf.active, 0);
  assert.ok(frameAt(scene, config, arrival + 0.001).nodes.leaf.active > 0.9);
  assert.equal(frameAt(scene, config, config.duration).nodes.leaf.active, 0);
  assert.equal(frameAt(scene, config, entry.start + entry.duration + 0.001).connectors['root--leaf'].particles[1], -1);
});
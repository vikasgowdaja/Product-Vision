import { test } from 'node:test';
import assert from 'node:assert/strict';
import { anchorPoint, edgeGeometry, exportBounds, restoreDocument, seedDocument } from './freeform-canvas';

test('manual Bezier controls follow anchors without changing their offsets', () => {
  const document = seedDocument('Architecture', [{ id: 'root', title: 'Root', body: 'Start' }, { id: 'worker', title: 'Worker', body: 'Process' }]);
  const edge = document.edges[0];
  edge.kind = 'bezier';
  edge.controls = [{ x: 120, y: -90 }, { x: -80, y: 100 }];
  const original = edgeGeometry(edge, document.nodes);
  document.nodes[0].position.x += 175;
  const moved = edgeGeometry(edge, document.nodes);
  assert.equal(moved.start.x - original.start.x, 175);
  assert.equal(moved.controls[0].x - original.controls[0].x, 175);
  assert.deepEqual(moved.end, original.end);
  assert.deepEqual(edge.controls, [{ x: 120, y: -90 }, { x: -80, y: 100 }]);
  assert.match(moved.path, / C /);
});

test('all connector types use current node bounds and explicit anchors', () => {
  const document = seedDocument('Flow', [{ id: 'one', title: 'One', body: '' }, { id: 'two', title: 'Two', body: '' }]);
  const edge = document.edges[0];
  edge.sourceHandle = 'right'; edge.targetHandle = 'left';
  document.nodes[0].width = 400;
  assert.deepEqual(edgeGeometry(edge, document.nodes).start, anchorPoint(document.nodes[0], 'right'));
  for (const kind of ['straight', 'elbow', 'curve', 'bezier', 'freehand'] as const) {
    edge.kind = kind;
    const geometry = edgeGeometry(edge, document.nodes);
    assert.ok(geometry.path.startsWith('M '));
    assert.ok(!geometry.path.includes('NaN'));
  }
});

test('documents round-trip positions, handles, curvature and animation settings', () => {
  const document = seedDocument('Saved', [
    { id: 'one', title: 'One', body: '', icon: '◆', color: '#f97316' },
    { id: 'two', title: 'Two', body: '', icon: '●', color: '#22c55e' },
  ]);
  document.nodes[1].position = { x: -600, y: 1300 };
  document.edges[0].controls = [{ x: 45, y: 12 }, { x: -35, y: 80 }];
  document.edges[0].animation.reverse = true;
  assert.deepEqual(restoreDocument(JSON.stringify(document)), document);
  assert.equal(document.nodes[0].icon, '◆');
  assert.equal(document.nodes[0].color, '#f97316');
  assert.throws(() => restoreDocument('{"version":1,"nodes":[]}'));
});

test('export boundaries are independent from the viewport and include negative positions', () => {
  const document = seedDocument('Bounds', [{ id: 'one', title: 'One', body: '' }]);
  document.nodes[0].position = { x: -350, y: -250 };
  const bounds = exportBounds(document, 'all', []);
  assert.ok(bounds.x <= -350 && bounds.y <= -250);
  assert.ok(bounds.width >= document.nodes[0].width);
  assert.deepEqual(exportBounds(document, 'frame', []), document.frame);
});
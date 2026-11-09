import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSequentialAutomationWorkflow, validateAutomationWorkflow, type AutomationWorkflow } from '@infograph-ai/shared';

const workflow: AutomationWorkflow = {
  schemaVersion: 1,
  id: 'workflow-1',
  name: 'Release pipeline',
  revision: 1,
  nodes: [
    { id: 'build', kind: 'action', label: 'Build', config: {} },
    { id: 'verify', kind: 'agent', label: 'Verify', config: { agentId: 'quality-verifier' } },
  ],
  edges: [{ id: 'build-to-verify', source: 'build', target: 'verify' }],
};

test('validates workflow identity and edge references', () => {
  assert.equal(validateAutomationWorkflow(workflow), null);
  assert.match(validateAutomationWorkflow({ ...workflow, edges: [{ ...workflow.edges[0], target: 'missing' }] }) ?? '', /target node/);
  assert.match(validateAutomationWorkflow({ ...workflow, nodes: [...workflow.nodes, workflow.nodes[0]] }) ?? '', /duplicate node id/);
});

test('rejects unsupported kinds and invalid configuration records', () => {
  assert.match(validateAutomationWorkflow({ ...workflow, nodes: [{ ...workflow.nodes[0], kind: 'unknown' }] }) ?? '', /kind/);
  assert.match(validateAutomationWorkflow({ ...workflow, nodes: [{ ...workflow.nodes[0], config: [] }] }) ?? '', /config/);
});

test('generates stable sequential edges and permits explicit loops', () => {
  const generated = createSequentialAutomationWorkflow('workflow-2', 'Deploy', workflow.nodes);
  assert.deepEqual(generated.edges, [{ id: 'edge-build-verify', source: 'build', target: 'verify' }]);
  assert.equal(validateAutomationWorkflow({ ...generated, edges: [...generated.edges, { id: 'loop', source: 'verify', target: 'build' }] }), null);
});

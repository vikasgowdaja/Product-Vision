/**
 * @infograph-ai/shared
 * Shared TypeScript types, DTOs, and constants used across
 * the web app, API, and agent packages.
 */

// ── Niches ───────────────────────────────────────────────────────────────────

export const NICHES = [
  'AI Agents',
  'System Design',
  'Software Architecture',
  'Salesforce',
  'Cloud (AWS/Azure)',
  'Full Stack Dev',
  'DevOps',
  'Career Growth',
  'Tech Leadership',
] as const;

export type Niche = (typeof NICHES)[number];

// ── Infographic ───────────────────────────────────────────────────────────────

export type InfographicStatus =
  | 'pending'
  | 'researching'
  | 'strategizing'
  | 'writing'
  | 'designing'
  | 'verifying'
  | 'scheduled'
  | 'published'
  | 'failed';

export interface Infographic {
  id: string;
  niche: Niche;
  topic: string;
  trendScore: number;
  hook: string;
  bodyContent: string;
  caption: string;
  hashtags: string[];
  imageUrl: string;
  status: InfographicStatus;
  scheduledAt?: string;
  publishedAt?: string;
  createdAt: string;
}

// ── Agent Pipeline ────────────────────────────────────────────────────────────

export type AgentId =
  | 'trend-research'
  | 'content-strategist'
  | 'content-writer'
  | 'infographic-designer'
  | 'quality-verifier'
  | 'linkedin-publisher';

export type AgentStatus = 'idle' | 'running' | 'completed' | 'failed';

export interface AgentStepEvent {
  infographicId: string;
  agentId: AgentId;
  status: AgentStatus;
  output?: unknown;
  durationMs?: number;
  error?: string;
}

// ── Automation Workflows ────────────────────────────────────────────────────

export const AUTOMATION_NODE_KINDS = [
  'trigger',
  'agent',
  'action',
  'condition',
  'approval',
  'output',
] as const;

export type AutomationNodeKind = (typeof AUTOMATION_NODE_KINDS)[number];

export interface AutomationFlowNode {
  id: string;
  kind: AutomationNodeKind;
  label: string;
  config: Record<string, unknown>;
}

export interface AutomationFlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  condition?: string;
}

export interface AutomationWorkflow {
  schemaVersion: 1;
  id: string;
  name: string;
  revision: number;
  nodes: AutomationFlowNode[];
  edges: AutomationFlowEdge[];
}

/** Returns a validation message, or null when the workflow is well-formed. */
export function validateAutomationWorkflow(value: unknown): string | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return 'workflow must be an object';
  }

  const workflow = value as Partial<AutomationWorkflow>;
  if (workflow.schemaVersion !== 1) return 'unsupported workflow schemaVersion';
  if (typeof workflow.id !== 'string' || !workflow.id.trim()) return 'workflow id is required';
  if (typeof workflow.name !== 'string' || !workflow.name.trim()) return 'workflow name is required';
  if (!Number.isInteger(workflow.revision) || (workflow.revision ?? 0) < 1) return 'workflow revision must be a positive integer';
  if (!Array.isArray(workflow.nodes) || !Array.isArray(workflow.edges)) return 'workflow nodes and edges must be arrays';

  const nodeIds = new Set<string>();
  for (const node of workflow.nodes) {
    if (!node || typeof node !== 'object' || typeof node.id !== 'string' || !node.id.trim()) return 'node id is required';
    if (nodeIds.has(node.id)) return `duplicate node id: ${node.id}`;
    nodeIds.add(node.id);
    if (!AUTOMATION_NODE_KINDS.includes(node.kind as AutomationNodeKind)) return `unsupported node kind: ${String(node.kind)}`;
    if (typeof node.label !== 'string' || !node.label.trim()) return `node ${node.id} label is required`;
    if (!node.config || typeof node.config !== 'object' || Array.isArray(node.config)) return `node ${node.id} config must be an object`;
  }

  const edgeIds = new Set<string>();
  for (const edge of workflow.edges) {
    if (!edge || typeof edge !== 'object' || typeof edge.id !== 'string' || !edge.id.trim()) return 'edge id is required';
    if (edgeIds.has(edge.id)) return `duplicate edge id: ${edge.id}`;
    edgeIds.add(edge.id);
    if (!nodeIds.has(edge.source)) return `edge ${edge.id} source node does not exist`;
    if (!nodeIds.has(edge.target)) return `edge ${edge.id} target node does not exist`;
    if (edge.label !== undefined && typeof edge.label !== 'string') return `edge ${edge.id} label must be a string`;
    if (edge.condition !== undefined && typeof edge.condition !== 'string') return `edge ${edge.id} condition must be a string`;
  }

  return null;
}

/** Builds the common linear case; branches can be added as explicit edges. */
export function createSequentialAutomationWorkflow(
  id: string,
  name: string,
  nodes: AutomationFlowNode[],
): AutomationWorkflow {
  return {
    schemaVersion: 1,
    id,
    name,
    revision: 1,
    nodes,
    edges: nodes.slice(1).map((node, index) => ({
      id: `edge-${nodes[index].id}-${node.id}`,
      source: nodes[index].id,
      target: node.id,
    })),
  };
}

// ── User / Auth ───────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  plan: 'free' | 'pro' | 'enterprise';
  infographicsUsedThisMonth: number;
}

// ── Billing ───────────────────────────────────────────────────────────────────

export const PLAN_LIMITS: Record<User['plan'], number> = {
  free: 5,
  pro: 100,
  enterprise: Infinity,
};

export const PLAN_PRICING_INR: Record<Exclude<User['plan'], 'free'>, number> = {
  pro: 999,
  enterprise: 9999,
};

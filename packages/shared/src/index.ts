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

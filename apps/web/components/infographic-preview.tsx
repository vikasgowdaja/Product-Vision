'use client';

import { useState } from 'react';
import { useBrandAssets } from '../lib/brand-assets';
import { InfographicAnimationEditor } from './infographic-animation-editor';
import { FreeformInfographicEditor } from './freeform-infographic-editor';

interface InfographicPreviewProps {
  topic: string;
  niche: string;
}

// ── Content database ─────────────────────────────────────────────────────────

const CONTENT: Record<string, {
  type: 'comparison' | 'steps' | 'tips' | 'pillars';
  subtitle?: string;
  left?: { label: string; color: string; accent: string; icon: string; points: string[] };
  right?: { label: string; color: string; accent: string; icon: string; points: string[] };
  steps?: { num: string; title: string; desc: string; color: string }[];
  tips?: { icon: string; title: string; desc: string }[];
  pillars?: { icon: string; title: string; points: string[] }[];
}> = {
  'GitOps vs Traditional CI/CD': {
    type: 'comparison',
    subtitle: 'How modern teams deploy software',
    left: {
      label: 'Traditional CI/CD', color: '#f97316', accent: 'rgba(249,115,22,0.12)',
      icon: '🔧',
      points: ['Push-based deployments', 'Manual cluster access', 'Imperative scripts', 'Drift goes undetected', 'Hard to audit changes', 'Single source of failure'],
    },
    right: {
      label: 'GitOps', color: '#22c55e', accent: 'rgba(34,197,94,0.12)',
      icon: '🌿',
      points: ['Pull-based sync loop', 'No direct cluster access', 'Git is the source of truth', 'Drift auto-corrected', 'Full Git audit trail', 'Self-healing clusters'],
    },
  },
  'LangGraph vs CrewAI Comparison': {
    type: 'comparison',
    subtitle: 'Choosing the right agent orchestration framework',
    left: {
      label: 'LangGraph', color: '#3b82f6', accent: 'rgba(59,130,246,0.12)',
      icon: '🕸️',
      points: ['Graph-based state machine', 'Fine-grained control flow', 'Built-in checkpointing', 'Ideal for complex loops', 'LangChain ecosystem', 'Lower-level API'],
    },
    right: {
      label: 'CrewAI', color: '#8b5cf6', accent: 'rgba(139,92,246,0.12)',
      icon: '🤝',
      points: ['Role-based agent teams', 'High-level abstractions', 'Built-in task delegation', 'Rapid prototyping', 'Human-readable configs', 'Less customization'],
    },
  },
  'Single Agent vs Multi-Agent Architecture': {
    type: 'comparison',
    subtitle: 'Scaling AI systems for enterprise',
    left: {
      label: 'Single Agent', color: '#f59e0b', accent: 'rgba(245,158,11,0.12)',
      icon: '🤖',
      points: ['Simple to build & debug', 'Lower infrastructure cost', 'Fewer failure points', 'Fast iteration cycles', 'Good for narrow tasks', 'Limited context window'],
    },
    right: {
      label: 'Multi-Agent', color: '#22c55e', accent: 'rgba(34,197,94,0.12)',
      icon: '🕸️',
      points: ['Parallel execution', 'Specialization per task', 'Independent validation', 'Scales to complex flows', 'Enterprise workflows', 'Higher observability'],
    },
  },
  'Kubernetes Cost Optimization': {
    type: 'steps',
    subtitle: '6 steps to cut cloud spending by 40%',
    steps: [
      { num: '01', title: 'Right-size workloads', desc: 'Set CPU/memory requests & limits based on real usage, not guesses.', color: '#3b82f6' },
      { num: '02', title: 'Use Spot/Preemptible nodes', desc: 'Run stateless workloads on spot instances — 70% cheaper.', color: '#8b5cf6' },
      { num: '03', title: 'Enable cluster autoscaler', desc: 'Scale node pools down automatically when utilization drops.', color: '#22c55e' },
      { num: '04', title: 'Namespace-level quotas', desc: 'Prevent runaway resource consumption per team.', color: '#f59e0b' },
      { num: '05', title: 'Delete idle resources', desc: 'Prune unused PVCs, LoadBalancers, and zombie deployments.', color: '#ec4899' },
      { num: '06', title: 'Monitor with Kubecost', desc: 'Attribute cost to teams, namespaces, and workloads in real time.', color: '#06b6d4' },
    ],
  },
  'AWS vs Azure vs GCP 2026': {
    type: 'pillars',
    subtitle: 'Cloud provider comparison — 2026 edition',
    pillars: [
      { icon: '🟠', title: 'AWS', points: ['Largest service catalog (250+)', 'Best ML tooling (SageMaker)', 'Strongest enterprise adoption', 'Highest learning curve'] },
      { icon: '🔵', title: 'Azure', points: ['Best Microsoft/Office 365 integration', 'Strongest hybrid cloud (Arc)', 'Preferred for .NET workloads', 'OpenAI partnership'] },
      { icon: '🟡', title: 'GCP', points: ['Best Kubernetes (GKE)', 'Google-grade data analytics', 'Competitive pricing', 'Smallest market share'] },
    ],
  },
};

const FALLBACK_CONTENT = (topic: string, niche: string) => ({
  type: 'tips' as const,
  tips: [
    { icon: '🔍', title: 'Research Phase', desc: `Analyzed 50+ sources to surface the top signal for "${topic}".` },
    { icon: '🎯', title: 'Key Insight', desc: `The #1 thing ${niche} engineers need to know about this topic.` },
    { icon: '⚡', title: 'Quick Win', desc: 'Implement this today and see measurable results by next sprint.' },
    { icon: '📈', title: 'Why It Matters', desc: 'Teams that adopt this pattern ship 2x faster with fewer incidents.' },
    { icon: '⚠️', title: 'Common Mistake', desc: 'Most engineers skip the fundamentals and wonder why things break.' },
    { icon: '✅', title: 'Best Practice', desc: 'Follow this checklist on every project to stay consistent.' },
  ],
});

// ── Sub-renderers ─────────────────────────────────────────────────────────────

function ComparisonLayout({ data, topic }: { data: NonNullable<ReturnType<typeof getContent>>; topic: string }) {
  const { left, right, subtitle } = data;
  if (!left || !right) return null;
  return (
    <div className="w-full">
      {/* Header */}
      <div data-infographic-part data-node-id="root" className="text-center mb-4">
        <p className="text-xs font-semibold tracking-widest mb-1" style={{ color: '#60a5fa' }}>COMPARISON</p>
        <h2 className="text-base font-bold text-white leading-snug">{topic}</h2>
        {subtitle && <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{subtitle}</p>}
      </div>

      {/* VS layout */}
      <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-3">
        {[left, right].map((side, sideIndex) => (
          <div data-infographic-part data-node-id={`comparison-${sideIndex}`} key={side.label} className="min-w-0 rounded-lg p-3" style={{ background: side.accent, border: `1px solid ${side.color}40` }}>
            <div className="flex items-center gap-1.5 mb-3 pb-2" style={{ borderBottom: `1px solid ${side.color}30` }}>
              <span className="text-base">{side.icon}</span>
              <span className="text-sm font-bold" style={{ color: side.color }}>{side.label}</span>
            </div>
            <ul className="space-y-1.5">
              {side.points.map((pt, pointIndex) => (
                <li data-infographic-part data-element-id={`comparison-${sideIndex}-point-${pointIndex}`} key={pt} className="flex items-start gap-1.5 text-xs" style={{ color: '#e2e8f0' }}>
                  <span className="mt-0.5 text-xs flex-shrink-0" style={{ color: side.color }}>▸</span>
                  {pt}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* VS badge */}
      <div className="hidden min-[400px]:flex justify-center -mt-px">
        <span className="text-xs font-black px-3 py-1 rounded-full border"
          style={{ background: '#0f172a', borderColor: '#334155', color: '#94a3b8', marginTop: '-1.1rem', position: 'relative', zIndex: 1 }}>
          VS
        </span>
      </div>
    </div>
  );
}

function StepsLayout({ data, topic }: { data: NonNullable<ReturnType<typeof getContent>>; topic: string }) {
  const { steps, subtitle } = data;
  if (!steps) return null;
  return (
    <div className="w-full">
      <div data-infographic-part data-node-id="root" className="text-center mb-4">
        <p className="text-xs font-semibold tracking-widest mb-1" style={{ color: '#60a5fa' }}>STEP-BY-STEP</p>
        <h2 className="text-base font-bold text-white leading-snug">{topic}</h2>
        {subtitle && <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{subtitle}</p>}
      </div>
      <div className="space-y-2">
        {steps.map((step) => (
          <div data-infographic-part data-node-id={`step-${step.num}`} key={step.num} className="flex items-start gap-3 p-2.5 rounded-lg"
            style={{ background: `${step.color}10`, border: `1px solid ${step.color}30` }}>
            <span className="text-sm font-black flex-shrink-0 w-7 text-center" style={{ color: step.color }}>{step.num}</span>
            <div>
              <p className="text-xs font-semibold text-white">{step.title}</p>
              <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TipsLayout({ data, topic, niche }: { data: ReturnType<typeof FALLBACK_CONTENT>; topic: string; niche: string }) {
  const { tips } = data;
  return (
    <div className="w-full">
      <div data-infographic-part data-node-id="root" className="text-center mb-4">
        <p className="text-xs font-semibold tracking-widest mb-1" style={{ color: '#60a5fa' }}>{niche.toUpperCase()}</p>
        <h2 className="text-base font-bold text-white leading-snug">{topic}</h2>
      </div>
      <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-2">
        {tips.map((tip, i) => (
          <div data-infographic-part data-node-id={`tip-${i}`} key={i} className="min-w-0 p-2.5 rounded-lg" style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.15)' }}>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-base">{tip.icon}</span>
              <span className="text-xs font-semibold text-white">{tip.title}</span>
            </div>
            <p className="text-xs" style={{ color: '#94a3b8' }}>{tip.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PillarsLayout({ data, topic }: { data: NonNullable<ReturnType<typeof getContent>>; topic: string }) {
  const { pillars, subtitle } = data;
  if (!pillars) return null;
  const colors = ['#f97316', '#3b82f6', '#eab308'];
  return (
    <div className="w-full">
      <div data-infographic-part data-node-id="root" className="text-center mb-4">
        <p className="text-xs font-semibold tracking-widest mb-1" style={{ color: '#60a5fa' }}>OVERVIEW</p>
        <h2 className="text-base font-bold text-white leading-snug">{topic}</h2>
        {subtitle && <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{subtitle}</p>}
      </div>
      <div className="grid grid-cols-1 min-[480px]:grid-cols-3 gap-2">
        {pillars.map((pillar, i) => (
          <div data-infographic-part data-node-id={`pillar-${i}`} key={pillar.title} className="min-w-0 p-3 rounded-lg" style={{ background: `${colors[i]}10`, border: `1px solid ${colors[i]}30` }}>
            <div className="text-xl mb-1">{pillar.icon}</div>
            <p className="text-xs font-bold mb-2" style={{ color: colors[i] }}>{pillar.title}</p>
            <ul className="space-y-1">
              {pillar.points.map((p, pointIndex) => (
                <li data-infographic-part data-element-id={`pillar-${i}-point-${pointIndex}`} key={p} className="text-xs flex items-start gap-1" style={{ color: '#94a3b8' }}>
                  <span style={{ color: colors[i] }}>·</span> {p}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function getContent(topic: string) {
  return CONTENT[topic] ?? null;
}

// ── Main component ────────────────────────────────────────────────────────────

export function InfographicPreview({ topic, niche }: InfographicPreviewProps) {
  const content = getContent(topic);
  const { assets } = useBrandAssets();
  const [editorMode, setEditorMode] = useState<'preview' | 'canvas'>('preview');
  const canvasNodes = [
    { id: 'headline', title: topic, body: content?.subtitle ?? `${niche} infographic`, color: '#60a5fa' },
    ...(content?.type === 'comparison' ? [content.left, content.right].filter((side): side is NonNullable<typeof side> => Boolean(side)).map(side => ({ id: side.label.toLowerCase().replace(/[^a-z0-9]+/g, '-'), title: side.label, body: side.points.join('\n'), icon: side.icon, color: side.color })) : []),
    ...(content?.type === 'steps' ? (content.steps ?? []).map(step => ({ id: `step-${step.num}`, title: step.title, body: step.desc, icon: step.num, color: step.color })) : []),
    ...(content?.type === 'tips' ? (content.tips ?? []).map((tip, index) => ({ id: `tip-${index}`, title: tip.title, body: tip.desc, icon: tip.icon, color: ['#3b82f6', '#22c55e', '#f59e0b', '#ec4899'][index % 4] })) : []),
    ...(content?.type === 'pillars' ? (content.pillars ?? []).map((pillar, index) => ({ id: pillar.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'), title: pillar.title, body: pillar.points.join('\n'), icon: pillar.icon, color: ['#f97316', '#3b82f6', '#eab308'][index % 3] })) : []),
    ...(!content ? FALLBACK_CONTENT(topic, niche).tips.map((tip, index) => ({ id: `tip-${index}`, title: tip.title, body: tip.desc, icon: tip.icon, color: ['#3b82f6', '#22c55e', '#f59e0b', '#ec4899'][index % 4] })) : []),
  ];

  return (
    <div className={`min-w-0 ${editorMode === 'canvas' ? 'flex h-full min-h-0 flex-1 flex-col' : 'space-y-3'}`}>
    <div className="flex shrink-0 gap-1 border-b border-slate-800" role="tablist" aria-label="Infographic view">
      <button type="button" role="tab" aria-selected={editorMode === 'preview'} onClick={() => setEditorMode('preview')} className={`border-b-2 px-3 py-2 text-xs ${editorMode === 'preview' ? 'border-cyan-400 text-cyan-200' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>Preview and animation</button>
      <button type="button" role="tab" aria-selected={editorMode === 'canvas'} onClick={() => setEditorMode('canvas')} className={`border-b-2 px-3 py-2 text-xs ${editorMode === 'canvas' ? 'border-cyan-400 text-cyan-200' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>Freeform canvas</button>
    </div>
    {editorMode === 'canvas' ? <FreeformInfographicEditor topic={topic} nodes={canvasNodes} /> :
    <InfographicAnimationEditor key={topic} topic={topic} layout={content?.type ?? 'tips'}>
    <div data-infographic-canvas data-infographic-layout={content?.type ?? 'tips'} className="w-full rounded-lg overflow-hidden break-words"
      style={{ position: 'relative', background: 'linear-gradient(160deg,#0d1b2e 0%,#0f172a 60%,#0d1b2e 100%)', border: '1px solid #1e3a8a' }}>

      {/* Top brand bar */}
      <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,#3b82f6,#8b5cf6,#ec4899)' }} />

      {/* Niche pill */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <span className="text-xs font-semibold tracking-widest px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)' }}>
          {niche.toUpperCase()}
        </span>
        {assets.logo ? (
          <img src={assets.logo.dataUrl} alt="Brand logo" style={{ width: 90, height: 32, objectFit: 'contain' }} />
        ) : <span className="text-xs" style={{ color: '#1e3a8a' }}>InfographAI</span>}
      </div>

      {/* Content */}
      <div className="px-4 pb-4">
        {!content && <TipsLayout data={FALLBACK_CONTENT(topic, niche)} topic={topic} niche={niche} />}
        {content?.type === 'comparison' && <ComparisonLayout data={content} topic={topic} />}
        {content?.type === 'steps' && <StepsLayout data={content} topic={topic} />}
        {content?.type === 'pillars' && <PillarsLayout data={content} topic={topic} />}
        {assets.image && <div data-node-id="uploaded-image" className="mt-3">
          <img src={assets.image.dataUrl} alt={assets.image.name} style={{ display: 'block', maxHeight: 240, width: '100%', objectFit: 'contain' }} />
        </div>}
      </div>

      {/* Footer bar */}
      <div className="px-4 py-2 flex items-center justify-between" style={{ borderTop: '1px solid #1e3a5f' }}>
        <span className="text-xs font-bold" style={{ color: '#3b82f6' }}>InfographAI</span>
        <span className="text-xs" style={{ color: '#1e3a8a' }}>1080 × 1080</span>
      </div>
    </div>
    </InfographicAnimationEditor>
    }
    </div>
  );
}

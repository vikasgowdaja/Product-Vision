'use client';
import { useState } from 'react';
import { InfographicPreview } from '../../../components/infographic-preview';

const NICHES = [
  { id: 'ai-agents', label: 'AI Agents', icon: '🤖' },
  { id: 'system-design', label: 'System Design', icon: '🏗️' },
  { id: 'software-arch', label: 'Software Architecture', icon: '📐' },
  { id: 'salesforce', label: 'Salesforce', icon: '☁️' },
  { id: 'cloud', label: 'Cloud (AWS/Azure)', icon: '⚡' },
  { id: 'fullstack', label: 'Full Stack Dev', icon: '💻' },
  { id: 'devops', label: 'DevOps', icon: '🔄' },
  { id: 'career', label: 'Career Growth', icon: '📈' },
  { id: 'leadership', label: 'Tech Leadership', icon: '🎯' },
];

type AgentId = 'trend' | 'strategist' | 'writer' | 'designer' | 'verifier' | 'publisher';
type AgentStatus = 'idle' | 'running' | 'done' | 'error';

const AGENTS: { id: AgentId; name: string; desc: string }[] = [
  { id: 'trend', name: 'Trend Research', desc: 'Scanning GitHub, HN, Reddit…' },
  { id: 'strategist', name: 'Content Strategist', desc: 'Crafting LinkedIn hook & angle…' },
  { id: 'writer', name: 'Content Writer', desc: 'Writing body, caption, CTA…' },
  { id: 'designer', name: 'Infographic Designer', desc: 'Generating SVG layout…' },
  { id: 'verifier', name: 'Quality Verifier', desc: 'Checking accuracy & brand safety…' },
  { id: 'publisher', name: 'LinkedIn Publisher', desc: 'Formatting post & hashtags…' },
];

const MOCK_TREND_TOPICS: Record<string, string[]> = {
  'ai-agents': ['Single Agent vs Multi-Agent Architecture', 'LangGraph vs CrewAI Comparison', 'OpenAI Agents SDK Deep Dive'],
  'system-design': ['CAP Theorem Explained Simply', 'Event-Driven Architecture Patterns', 'Database Sharding Strategies'],
  'salesforce': ['Salesforce AgentForce Overview', 'Flow Builder Best Practices', 'Data Cloud Architecture'],
  'devops': ['GitOps vs Traditional CI/CD', 'Kubernetes Cost Optimization', 'Platform Engineering in 2026'],
  'cloud': ['AWS vs Azure vs GCP 2026', 'Serverless Architecture Patterns', 'Multi-Cloud Strategy Guide'],
};

export default function GeneratePage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedNiche, setSelectedNiche] = useState('');
  const [topic, setTopic] = useState('');
  const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);
  const [agentStatuses, setAgentStatuses] = useState<Record<AgentId, AgentStatus>>(
    Object.fromEntries(AGENTS.map(a => [a.id, 'idle'])) as Record<AgentId, AgentStatus>
  );
  const [isRunning, setIsRunning] = useState(false);
  const [done, setDone] = useState(false);

  function selectNiche(id: string) {
    setSelectedNiche(id);
    const topics = MOCK_TREND_TOPICS[id] ?? ['Top 5 Trends in 2026', 'Beginner to Expert Guide', 'Common Mistakes to Avoid'];
    setSuggestedTopics(topics);
    setTopic('');
  }

  async function runPipeline() {
    setStep(3);
    setIsRunning(true);
    const ids = AGENTS.map(a => a.id);
    for (const id of ids) {
      setAgentStatuses(prev => ({ ...prev, [id]: 'running' }));
      await new Promise(r => setTimeout(r, 1200 + Math.random() * 800));
      setAgentStatuses(prev => ({ ...prev, [id]: 'done' }));
    }
    setIsRunning(false);
    setDone(true);
  }

  const nicheLabel = NICHES.find(n => n.id === selectedNiche)?.label ?? '';

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Generate Infographic</h1>
        <p className="text-sm mt-1" style={{ color: '#64748b' }}>
          {step === 1 && 'Step 1 of 2 · Choose your niche'}
          {step === 2 && 'Step 2 of 2 · Select or enter a topic'}
          {step === 3 && (done ? 'Done! Your infographic is ready.' : 'Running 6-agent pipeline…')}
        </p>
      </div>

      {/* Progress bar */}
      {step < 3 && (
        <div className="flex gap-2 mb-8">
          {[1, 2].map(s => (
            <div key={s} className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: '#1e293b' }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: step >= s ? '100%' : '0%', background: 'linear-gradient(90deg,#3b82f6,#8b5cf6)' }} />
            </div>
          ))}
        </div>
      )}

      {/* ── Step 1: Niche ── */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Choose your niche</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {NICHES.map(niche => (
              <button key={niche.id} onClick={() => selectNiche(niche.id)}
                className="flex flex-col items-start gap-2 p-4 rounded-xl text-left transition hover:-translate-y-0.5"
                style={{
                  background: selectedNiche === niche.id ? 'rgba(59,130,246,0.15)' : '#1e293b',
                  border: `1px solid ${selectedNiche === niche.id ? '#3b82f6' : '#334155'}`,
                }}>
                <span className="text-2xl">{niche.icon}</span>
                <span className="text-sm font-medium" style={{ color: selectedNiche === niche.id ? '#93c5fd' : '#f1f5f9' }}>
                  {niche.label}
                </span>
              </button>
            ))}
          </div>
          <div className="flex justify-end pt-2">
            <button onClick={() => setStep(2)} disabled={!selectedNiche}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)' }}>
              Next: Choose Topic →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Topic ── */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium px-2 py-0.5 rounded" style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa' }}>
                {NICHES.find(n => n.id === selectedNiche)?.icon} {nicheLabel}
              </span>
            </div>
            <h2 className="text-lg font-semibold text-white">Select or enter a topic</h2>
          </div>

          {/* Trending suggestions */}
          <div>
            <p className="text-xs font-medium mb-3 flex items-center gap-2" style={{ color: '#64748b' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block animate-pulse" />
              TRENDING NOW
            </p>
            <div className="space-y-2">
              {suggestedTopics.map(t => (
                <button key={t} onClick={() => setTopic(t)}
                  className="w-full text-left px-4 py-3 rounded-xl text-sm transition hover:border-blue-500"
                  style={{
                    background: topic === t ? 'rgba(59,130,246,0.1)' : '#1e293b',
                    border: `1px solid ${topic === t ? '#3b82f6' : '#334155'}`,
                    color: topic === t ? '#93c5fd' : '#f1f5f9',
                  }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Manual input */}
          <div>
            <p className="text-xs font-medium mb-2" style={{ color: '#64748b' }}>OR TYPE YOUR OWN</p>
            <input
              type="text"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="e.g. Event-driven architecture patterns"
              className="w-full px-4 py-3 rounded-xl text-sm bg-transparent outline-none transition focus:border-blue-500"
              style={{ background: '#1e293b', border: '1px solid #334155', color: '#f1f5f9' }}
            />
          </div>

          <div className="flex justify-between pt-2">
            <button onClick={() => setStep(1)} className="px-5 py-2.5 rounded-xl text-sm transition hover:bg-slate-800"
              style={{ color: '#94a3b8', border: '1px solid #334155' }}>
              ← Back
            </button>
            <button onClick={runPipeline} disabled={!topic}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)' }}>
              ✦ Start Generation
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Pipeline ── */}
      {step === 3 && (
        <div className="space-y-6">
          {/* Topic summary */}
          <div className="px-5 py-4 rounded-xl" style={{ background: '#1e293b', border: '1px solid #334155' }}>
            <p className="text-xs mb-1" style={{ color: '#64748b' }}>Generating for</p>
            <p className="text-white font-semibold">{topic}</p>
            <p className="text-xs mt-1" style={{ color: '#60a5fa' }}>{nicheLabel}</p>
          </div>

          {/* Agent steps */}
          <div className="space-y-3">
            {AGENTS.map((agent, i) => {
              const status = agentStatuses[agent.id];
              const icon = status === 'done' ? '✓' : status === 'running' ? '◐' : status === 'error' ? '✗' : String(i + 1);
              const color = status === 'done' ? '#22c55e' : status === 'running' ? '#3b82f6' : status === 'error' ? '#ef4444' : '#475569';
              const bg = status === 'done' ? 'rgba(34,197,94,0.08)' : status === 'running' ? 'rgba(59,130,246,0.1)' : '#1e293b';
              const border = status === 'done' ? 'rgba(34,197,94,0.25)' : status === 'running' ? 'rgba(59,130,246,0.4)' : '#334155';

              return (
                <div key={agent.id} className="flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all"
                  style={{ background: bg, border: `1px solid ${border}` }}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all"
                    style={{ background: `${color}20`, color, ...(status === 'running' ? { animation: 'pulse 1.5s ease-in-out infinite' } : {}) }}>
                    {icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: status === 'idle' ? '#64748b' : '#f1f5f9' }}>
                      {agent.name}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: status === 'running' ? '#60a5fa' : '#475569' }}>
                      {status === 'running' ? agent.desc : status === 'done' ? 'Completed' : status === 'idle' ? 'Waiting…' : 'Error'}
                    </p>
                  </div>
                  {status === 'running' && (
                    <div className="flex gap-1">
                      {[0, 1, 2].map(j => (
                        <div key={j} className="w-1.5 h-1.5 rounded-full bg-blue-400"
                          style={{ animation: `pulse 1.2s ease-in-out ${j * 0.2}s infinite` }} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Result card — shown when done */}
          {done && (
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(34,197,94,0.3)' }}>
              <div className="px-5 py-3 flex flex-wrap items-center gap-2" style={{ background: 'rgba(34,197,94,0.08)', borderBottom: '1px solid rgba(34,197,94,0.2)' }}>
                <span style={{ color: '#22c55e' }}>✓</span>
                <p className="text-sm font-semibold" style={{ color: '#86efac' }}>Infographic ready!</p>
                <span className="ml-auto text-xs" style={{ color: '#64748b' }}>Generated in ~8s</span>
              </div>
              <div className="p-3 sm:p-5 space-y-4" style={{ background: '#0f172a' }}>

                {/* Rich infographic preview */}
                <InfographicPreview topic={topic} niche={nicheLabel} />

                {/* LinkedIn caption */}
                <div className="rounded-xl p-4" style={{ background: '#1e293b', border: '1px solid #334155' }}>
                  <p className="text-xs font-semibold tracking-wider mb-2" style={{ color: '#64748b' }}>LINKEDIN CAPTION</p>
                  <p className="text-sm leading-relaxed" style={{ color: '#cbd5e1' }}>
                    {topic.includes('vs') || topic.includes('VS')
                      ? `The debate between ${topic.split(/\s+vs\s+/i)[0]} and ${topic.split(/\s+vs\s+/i)[1]} isn't about which is "better" — it's about which fits your team's maturity and scale.\n\nMost teams start simple. The best teams evolve deliberately.\n\nKey takeaway: Know when to upgrade your architecture, not just your tools.`
                      : `${topic} is one of the most searched topics in ${nicheLabel} right now — for good reason.\n\nThe engineers who master this early will be the ones leading teams in 2027.\n\nSave this. Share it with your team.`
                    }
                  </p>
                  <p className="text-xs mt-3" style={{ color: '#60a5fa' }}>
                    #{nicheLabel.replace(/\s+/g, '')} #SoftwareEngineering #TechLeadership #SystemDesign
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)' }}>
                    Schedule to LinkedIn
                  </button>
                  <button className="px-4 py-2.5 rounded-xl text-sm transition hover:bg-slate-700"
                    style={{ background: '#1e293b', color: '#94a3b8', border: '1px solid #334155' }}>
                    Download PNG
                  </button>
                  <button onClick={() => { setStep(1); setSelectedNiche(''); setTopic(''); setDone(false); setAgentStatuses(Object.fromEntries(AGENTS.map(a => [a.id, 'idle'])) as Record<AgentId, AgentStatus>); }}
                    className="px-4 py-2.5 rounded-xl text-sm transition hover:bg-slate-700"
                    style={{ background: '#1e293b', color: '#94a3b8', border: '1px solid #334155' }}>
                    New ✦
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

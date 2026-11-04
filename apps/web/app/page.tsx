import Link from 'next/link';

const FEATURES = [
  { icon: '🔍', title: 'Trend Research Agent', desc: 'Scans GitHub, Hacker News, Reddit & engineering blogs to surface the most relevant topic for your niche — every morning.' },
  { icon: '🎯', title: 'Content Strategist', desc: 'Crafts a compelling LinkedIn hook, selects the right content angle, and plans key takeaways for maximum engagement.' },
  { icon: '✍️', title: 'Content Writer', desc: 'Writes structured infographic body copy, a LinkedIn caption, and a strong CTA — all optimized for mobile readability.' },
  { icon: '🎨', title: 'Infographic Designer', desc: 'Generates a polished SVG/PNG infographic using brand-consistent layouts. Exports to 1080×1080px ready for LinkedIn.' },
  { icon: '✅', title: 'Quality Verifier', desc: 'An independent Claude 3.5 model checks technical accuracy, grammar, and brand safety before anything gets published.' },
  { icon: '📤', title: 'LinkedIn Publisher', desc: 'Formats the post with optimized hashtags and schedules publishing via the LinkedIn API — no manual steps.' },
];

const NICHES = ['AI Agents', 'System Design', 'Salesforce', 'Cloud (AWS/Azure)', 'Full Stack Dev', 'DevOps', 'Career Growth', 'Tech Leadership', 'Software Architecture'];

const PLANS = [
  { name: 'Free', price: '₹0', per: '/month', features: ['5 infographics/month', '3 niches', 'Basic templates', 'Manual copy-paste', 'Watermarked'], cta: 'Start Free', accent: false },
  { name: 'Pro', price: '₹999', per: '/month', features: ['100 infographics/month', 'All 9 niches', 'LinkedIn auto-scheduling', 'Brand templates', 'No watermark', 'Priority generation'], cta: 'Start Pro Trial', accent: true },
  { name: 'Enterprise', price: '₹9,999+', per: '/month', features: ['Unlimited infographics', 'Team workspaces', 'Approval workflows', 'Custom branding', 'Multi-account LinkedIn', 'Dedicated support'], cta: 'Contact Sales', accent: false },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: '#0f172a', color: '#f1f5f9' }}>

      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4"
        style={{ background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #1e293b' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
            style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)' }}>IG</div>
          <span className="font-semibold text-white text-lg">InfographAI</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-slate-400">
          <a href="#features" className="hover:text-white transition">Features</a>
          <a href="#niches" className="hover:text-white transition">Niches</a>
          <a href="#pricing" className="hover:text-white transition">Pricing</a>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-slate-400 hover:text-white transition px-3 py-1.5">Log in</Link>
          <Link href="/dashboard" className="text-sm font-medium text-white px-4 py-2 rounded-lg transition"
            style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)' }}>
            Get Started →
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="pt-36 pb-24 px-6 text-center relative overflow-hidden">
        {/* background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #3b82f6, transparent)' }} />
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-6"
          style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse inline-block" />
          AI-Powered · 6-Agent Pipeline · LinkedIn-Ready
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 leading-tight">
          ByteByteGo,<br />
          <span style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6,#ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            but automated.
          </span>
        </h1>

        <p className="text-lg md:text-xl max-w-2xl mx-auto mb-10" style={{ color: '#94a3b8' }}>
          Every morning, 6 AI agents research trending topics in your niche, write the content,
          design a polished infographic, and publish it to LinkedIn — automatically.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/dashboard" className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-white font-semibold text-base transition hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)' }}>
            Start for Free
            <span>→</span>
          </Link>
          <Link href="/generate" className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-base transition hover:bg-slate-800"
            style={{ border: '1px solid #334155', color: '#f1f5f9' }}>
            See it in action
          </Link>
        </div>

        <p className="mt-5 text-sm" style={{ color: '#64748b' }}>No credit card required · 5 free infographics/month</p>

        {/* Mock infographic preview */}
        <div className="mt-16 max-w-3xl mx-auto relative">
          <div className="rounded-2xl overflow-hidden shadow-2xl" style={{ border: '1px solid #1e293b' }}>
            <div className="h-10 flex items-center gap-2 px-4" style={{ background: '#111827', borderBottom: '1px solid #1e293b' }}>
              <div className="w-3 h-3 rounded-full" style={{ background: '#ef4444' }} />
              <div className="w-3 h-3 rounded-full" style={{ background: '#eab308' }} />
              <div className="w-3 h-3 rounded-full" style={{ background: '#22c55e' }} />
              <span className="ml-4 text-xs" style={{ color: '#475569' }}>InfographAI — Generate</span>
            </div>
            <div className="p-6" style={{ background: '#0f172a' }}>
              {/* Mock pipeline progress */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {['Trend Research', 'Content Writer', 'Designer', 'Verifier', 'Publisher'].map((step, i) => (
                  <div key={step} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
                    style={{ background: i < 4 ? 'rgba(34,197,94,0.1)' : 'rgba(59,130,246,0.1)', border: `1px solid ${i < 4 ? 'rgba(34,197,94,0.3)' : 'rgba(59,130,246,0.3)'}` }}>
                    <span className="text-xs">{i < 4 ? '✓' : '◐'}</span>
                    <span style={{ color: i < 4 ? '#86efac' : '#93c5fd' }}>{step}</span>
                  </div>
                ))}
              </div>
              {/* Mock infographic card */}
              <div className="rounded-xl p-6 text-left" style={{ background: 'linear-gradient(135deg,#0f172a,#1e3a5f)', border: '1px solid #1e3a8a' }}>
                <div className="text-xs font-medium mb-3" style={{ color: '#60a5fa' }}>AI AGENTS · TRENDING NOW</div>
                <h3 className="text-xl font-bold text-white mb-4">Single Agent vs Multi-Agent Architecture</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-semibold mb-2" style={{ color: '#94a3b8' }}>Single Agent</p>
                    {['Simple to build', 'Lower cost', 'Fast iterations', 'Limited scope'].map(t => (
                      <p key={t} className="text-sm flex items-center gap-2 mb-1"><span style={{ color: '#22c55e' }}>✓</span><span style={{ color: '#cbd5e1' }}>{t}</span></p>
                    ))}
                  </div>
                  <div>
                    <p className="text-sm font-semibold mb-2" style={{ color: '#94a3b8' }}>Multi-Agent</p>
                    {['Scalable pipelines', 'Parallel execution', 'Specialization', 'Enterprise-ready'].map(t => (
                      <p key={t} className="text-sm flex items-center gap-2 mb-1"><span style={{ color: '#3b82f6' }}>✓</span><span style={{ color: '#cbd5e1' }}>{t}</span></p>
                    ))}
                  </div>
                </div>
                <div className="mt-4 pt-4 flex items-center justify-between" style={{ borderTop: '1px solid #1e3a8a' }}>
                  <span className="text-xs" style={{ color: '#475569' }}>Generated in 42s · Scheduled for 9:00 AM</span>
                  <span className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(34,197,94,0.1)', color: '#86efac' }}>Ready to publish</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Niches ── */}
      <section id="niches" className="py-16 px-6" style={{ borderTop: '1px solid #1e293b' }}>
        <p className="text-center text-sm font-medium mb-6" style={{ color: '#64748b' }}>SUPPORTED NICHES</p>
        <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
          {NICHES.map(niche => (
            <span key={niche} className="px-4 py-2 rounded-full text-sm font-medium transition hover:border-blue-500"
              style={{ background: '#1e293b', border: '1px solid #334155', color: '#94a3b8' }}>
              {niche}
            </span>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">6 specialized AI agents,<br />one seamless pipeline</h2>
          <p style={{ color: '#94a3b8' }}>Each agent is an expert in its domain. They work in sequence — research → strategy → write → design → verify → publish.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <div key={f.title} className="p-5 rounded-xl transition hover:-translate-y-0.5"
              style={{ background: '#1e293b', border: '1px solid #334155' }}>
              <div className="text-2xl mb-3">{f.icon}</div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa' }}>Agent {i + 1}</span>
                <h3 className="font-semibold text-white text-sm">{f.title}</h3>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Simple, transparent pricing</h2>
          <p style={{ color: '#94a3b8' }}>Start free. Scale when you grow.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map(plan => (
            <div key={plan.name} className={`p-6 rounded-2xl flex flex-col ${plan.accent ? 'ring-2' : ''}`}
              style={{ background: plan.accent ? '#0f1f3d' : '#1e293b', border: plan.accent ? '1px solid #3b82f6' : '1px solid #334155', ...(plan.accent ? { ringColor: '#3b82f6' } : {}) }}>
              {plan.accent && (
                <div className="text-xs font-semibold text-center mb-4 py-1 rounded-full"
                  style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}>
                  MOST POPULAR
                </div>
              )}
              <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-3xl font-bold text-white">{plan.price}</span>
                <span className="text-sm" style={{ color: '#64748b' }}>{plan.per}</span>
              </div>
              <ul className="space-y-3 flex-1 mb-6">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm" style={{ color: '#94a3b8' }}>
                    <span style={{ color: '#22c55e' }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link href="/dashboard" className={`text-center py-3 rounded-xl text-sm font-semibold transition ${plan.accent ? 'text-white hover:opacity-90' : 'hover:bg-slate-700'}`}
                style={plan.accent
                  ? { background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)' }
                  : { background: '#334155', color: '#f1f5f9' }}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-10 px-6 text-center text-sm" style={{ borderTop: '1px solid #1e293b', color: '#475569' }}>
        <p>© 2026 InfographAI · Built with a 6-agent AI pipeline</p>
      </footer>
    </div>
  );
}

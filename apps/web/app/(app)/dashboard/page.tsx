import Link from 'next/link';

const STATS = [
  { label: 'Total Generated', value: '3', change: '+1 today', up: true },
  { label: 'Published', value: '2', change: 'This month', up: true },
  { label: 'Scheduled', value: '1', change: 'Next: 9:00 AM', up: true },
  { label: 'Avg. Impressions', value: '—', change: 'Connect LinkedIn', up: false },
];

const RECENT: {
  id: string; title: string; niche: string; status: 'published' | 'scheduled' | 'draft' | 'failed';
  time: string; hook: string; hashtags: string[];
}[] = [
  {
    id: '1', title: 'Single Agent vs Multi-Agent Architecture', niche: 'AI Agents',
    status: 'published', time: '2 hours ago',
    hook: 'Most teams build a single AI agent. Enterprise teams build agent ecosystems.',
    hashtags: ['#AI', '#AIAgents', '#SystemDesign'],
  },
  {
    id: '2', title: 'LangGraph vs CrewAI: Which to Pick?', niche: 'AI Agents',
    status: 'scheduled', time: 'Tomorrow 9:00 AM',
    hook: 'Two leading orchestration frameworks. One decision that shapes your architecture.',
    hashtags: ['#LangGraph', '#CrewAI', '#LLM'],
  },
  {
    id: '3', title: '10 Salesforce Flow Best Practices', niche: 'Salesforce',
    status: 'draft', time: '3 days ago',
    hook: 'Bad flows break production. Great flows scale with your org.',
    hashtags: ['#Salesforce', '#Flow', '#Admin'],
  },
];

const STATUS_CONFIG = {
  published: { label: 'Published', bg: 'rgba(34,197,94,0.1)', color: '#86efac', dot: '#22c55e' },
  scheduled: { label: 'Scheduled', bg: 'rgba(59,130,246,0.1)', color: '#93c5fd', dot: '#3b82f6' },
  draft: { label: 'Draft', bg: 'rgba(234,179,8,0.1)', color: '#fde047', dot: '#eab308' },
  failed: { label: 'Failed', bg: 'rgba(239,68,68,0.1)', color: '#fca5a5', dot: '#ef4444' },
};

export default function DashboardPage() {
  return (
    <div className="p-8 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>Sunday, June 22 · Free Plan</p>
        </div>
        <Link href="/generate"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90"
          style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)' }}>
          ✦ Generate Infographic
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STATS.map(stat => (
          <div key={stat.label} className="p-5 rounded-xl" style={{ background: '#1e293b', border: '1px solid #334155' }}>
            <p className="text-sm mb-1" style={{ color: '#64748b' }}>{stat.label}</p>
            <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
            <p className="text-xs" style={{ color: stat.up ? '#86efac' : '#64748b' }}>{stat.change}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { icon: '🤖', title: 'Auto-generate daily', desc: 'Schedule a daily 9AM generation', action: 'Enable', href: '/settings' },
          { icon: '🔗', title: 'Connect LinkedIn', desc: 'Link your LinkedIn account to auto-publish', action: 'Connect', href: '/settings' },
          { icon: '🎨', title: 'Set brand kit', desc: 'Upload logo, choose brand colors', action: 'Setup', href: '/settings' },
        ].map(card => (
          <div key={card.title} className="p-5 rounded-xl flex flex-col gap-3" style={{ background: '#1e293b', border: '1px solid #334155' }}>
            <span className="text-2xl">{card.icon}</span>
            <div>
              <p className="text-sm font-semibold text-white">{card.title}</p>
              <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{card.desc}</p>
            </div>
            <Link href={card.href} className="text-xs font-medium px-3 py-1.5 rounded-lg self-start transition hover:opacity-90"
              style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)' }}>
              {card.action} →
            </Link>
          </div>
        ))}
      </div>

      {/* Recent infographics */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #334155' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ background: '#1e293b', borderBottom: '1px solid #334155' }}>
          <h2 className="font-semibold text-white text-sm">Recent Infographics</h2>
          <Link href="/generate" className="text-xs" style={{ color: '#60a5fa' }}>View all →</Link>
        </div>

        <div style={{ background: '#0f172a' }}>
          {RECENT.map((item, i) => {
            const s = STATUS_CONFIG[item.status];
            return (
              <div key={item.id}
                className="flex items-start gap-4 px-5 py-4 transition hover:bg-slate-900 cursor-pointer"
                style={{ borderBottom: i < RECENT.length - 1 ? '1px solid #1e293b' : 'none' }}>

                {/* Thumbnail placeholder */}
                <div className="w-16 h-16 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold"
                  style={{ background: 'linear-gradient(135deg,#0f172a,#1e3a5f)', border: '1px solid #1e3a8a', color: '#60a5fa' }}>
                  {item.niche.slice(0, 2).toUpperCase()}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-medium text-sm text-white truncate">{item.title}</span>
                    <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: s.bg, color: s.color }}>
                      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: s.dot }} />
                      {s.label}
                    </span>
                  </div>
                  <p className="text-xs mb-2 line-clamp-1" style={{ color: '#64748b' }}>{item.hook}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(59,130,246,0.1)', color: '#93c5fd' }}>{item.niche}</span>
                    {item.hashtags.map(h => (
                      <span key={h} className="text-xs" style={{ color: '#475569' }}>{h}</span>
                    ))}
                  </div>
                </div>

                {/* Time + actions */}
                <div className="flex-shrink-0 text-right">
                  <p className="text-xs mb-2" style={{ color: '#475569' }}>{item.time}</p>
                  <div className="flex items-center gap-2">
                    <button className="text-xs px-2 py-1 rounded transition hover:bg-slate-700" style={{ color: '#94a3b8', border: '1px solid #334155' }}>
                      Edit
                    </button>
                    {item.status === 'draft' && (
                      <button className="text-xs px-2 py-1 rounded transition hover:opacity-90"
                        style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)' }}>
                        Schedule
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Empty state prompt */}
          <div className="px-5 py-6 text-center">
            <Link href="/generate"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition hover:opacity-90 text-white"
              style={{ background: 'rgba(59,130,246,0.1)', border: '1px dashed rgba(59,130,246,0.4)' }}>
              ✦ Generate your next infographic
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

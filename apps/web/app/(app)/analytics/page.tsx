const MOCK = [
  { label: 'Total Generated', value: '3', delta: '+1', up: true },
  { label: 'Total Published', value: '2', delta: '+2', up: true },
  { label: 'Avg. Pipeline Time', value: '42s', delta: '-3s', up: true },
  { label: 'Agent Success Rate', value: '100%', delta: '+0%', up: true },
];

export default function AnalyticsPage() {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-2">Analytics</h1>
      <p className="text-sm mb-8" style={{ color: '#64748b' }}>Platform usage · Connect LinkedIn to see post impressions.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {MOCK.map(m => (
          <div key={m.label} className="p-5 rounded-xl" style={{ background: '#1e293b', border: '1px solid #334155' }}>
            <p className="text-sm mb-1" style={{ color: '#64748b' }}>{m.label}</p>
            <p className="text-3xl font-bold text-white">{m.value}</p>
            <p className="text-xs mt-1" style={{ color: m.up ? '#86efac' : '#fca5a5' }}>{m.delta} this month</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl p-8 text-center" style={{ background: '#1e293b', border: '1px dashed #334155' }}>
        <p className="text-3xl mb-3">◈</p>
        <p className="text-white font-medium">LinkedIn impressions coming soon</p>
        <p className="text-sm mt-1" style={{ color: '#64748b' }}>Connect your LinkedIn account to track post performance.</p>
      </div>
    </div>
  );
}

import { BrandKit } from '../../../components/brand-kit';

export default function SettingsPage() {
  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm mt-1" style={{ color: '#64748b' }}>Manage your account, integrations, and brand kit.</p>
      </div>

      {[
        { title: 'LinkedIn Integration', desc: 'Connect your LinkedIn account to enable auto-publishing.', action: 'Connect LinkedIn', color: '#0a66c2' },
        { title: 'Brand Kit', desc: 'Upload your logo and set brand colors for custom infographic templates.', action: 'Upload Logo', color: '#3b82f6' },
        { title: 'Auto-Generation', desc: 'Generate a fresh infographic every morning at 9:00 AM automatically.', action: 'Enable', color: '#22c55e' },
        { title: 'API Keys', desc: 'Manage your OpenAI and Anthropic API key overrides.', action: 'Configure', color: '#8b5cf6' },
      ].map(s => s.title === 'Brand Kit' ? <BrandKit key={s.title} /> : (
        <div key={s.title} className="flex items-center justify-between p-5 rounded-xl" style={{ background: '#1e293b', border: '1px solid #334155' }}>
          <div>
            <p className="font-semibold text-white text-sm">{s.title}</p>
            <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{s.desc}</p>
          </div>
          <button className="flex-shrink-0 ml-4 px-4 py-2 rounded-lg text-xs font-semibold text-white transition hover:opacity-80"
            style={{ background: s.color }}>
            {s.action}
          </button>
        </div>
      ))}
    </div>
  );
}

'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: '▦' },
  { href: '/generate', label: 'Generate', icon: '✦' },
  { href: '/schedule', label: 'Schedule', icon: '◷' },
  { href: '/analytics', label: 'Analytics', icon: '◈' },
  { href: '/settings', label: 'Settings', icon: '⚙' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-14 sm:w-56 flex flex-col z-30"
      style={{ background: '#111827', borderRight: '1px solid #1e293b' }}>

      {/* Logo */}
      <Link href="/" aria-label="InfographAI home" title="InfographAI home" className="flex items-center gap-2 px-3 sm:px-5 py-5 group">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
          style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)' }}>
          IG
        </div>
        <span className="hidden sm:inline font-semibold text-white tracking-tight">InfographAI</span>
      </Link>

      {/* Nav */}
      <nav className="flex-1 px-1 sm:px-3 py-2 space-y-0.5">
        {NAV_ITEMS.map(item => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
              title={item.label}
              className={`flex items-center justify-center sm:justify-start gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                active
                  ? 'text-white font-medium'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              style={active ? { background: 'rgba(59,130,246,0.15)', color: '#60a5fa' } : {}}
            >
              <span className="text-base w-4 text-center">{item.icon}</span>
              <span className="hidden sm:inline">{item.label}</span>
              {item.href === '/generate' && (
                <span className="hidden sm:inline ml-auto text-xs px-1.5 py-0.5 rounded font-medium"
                  style={{ background: '#1d4ed8', color: '#93c5fd' }}>New</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Usage meter */}
      <div className="hidden sm:block mx-3 mb-3 p-3 rounded-xl" style={{ background: '#1e293b' }}>
        <div className="flex justify-between text-xs mb-2">
          <span className="text-slate-400">Monthly usage</span>
          <span className="text-white font-medium">3 / 5</span>
        </div>
        <div className="h-1.5 rounded-full" style={{ background: '#334155' }}>
          <div className="h-1.5 rounded-full" style={{ width: '60%', background: 'linear-gradient(90deg,#3b82f6,#8b5cf6)' }} />
        </div>
        <p className="text-xs mt-2" style={{ color: '#64748b' }}>Free plan · <span className="text-blue-400 cursor-pointer hover:underline">Upgrade</span></p>
      </div>

      {/* User */}
      <div className="px-1 sm:px-3 pb-4 pt-2" style={{ borderTop: '1px solid #1e293b' }}>
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-800 cursor-pointer transition">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)' }}>
            U
          </div>
          <div className="hidden sm:block flex-1 min-w-0">
            <p className="text-sm text-white font-medium truncate">Dev User</p>
            <p className="text-xs truncate" style={{ color: '#64748b' }}>Free plan</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

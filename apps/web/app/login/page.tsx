import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0f172a' }}>

      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #3b82f6, transparent)' }} />
      </div>

      <div className="w-full max-w-sm relative">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 justify-center">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
              style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)' }}>IG</div>
          </Link>
          <h1 className="text-xl font-bold text-white mt-4">Welcome back</h1>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>Sign in to your InfographAI account</p>
        </div>

        {/* Card */}
        <div className="p-6 rounded-2xl space-y-4" style={{ background: '#1e293b', border: '1px solid #334155' }}>

          {/* LinkedIn OAuth */}
          <button className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-3 transition hover:opacity-90 text-white"
            style={{ background: '#0a66c2' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            Continue with LinkedIn
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: '#334155' }} />
            <span className="text-xs" style={{ color: '#475569' }}>or</span>
            <div className="flex-1 h-px" style={{ background: '#334155' }} />
          </div>

          {/* Email form */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#94a3b8' }}>Email</label>
              <input type="email" placeholder="you@example.com"
                className="w-full px-4 py-2.5 rounded-xl text-sm bg-transparent outline-none transition focus:border-blue-500"
                style={{ background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9' }} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium" style={{ color: '#94a3b8' }}>Password</label>
                <a href="#" className="text-xs" style={{ color: '#60a5fa' }}>Forgot?</a>
              </div>
              <input type="password" placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl text-sm bg-transparent outline-none transition focus:border-blue-500"
                style={{ background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9' }} />
            </div>
          </div>

          <Link href="/dashboard"
            className="block w-full py-3 rounded-xl text-sm font-semibold text-white text-center transition hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)' }}>
            Sign in
          </Link>
        </div>

        <p className="text-center text-sm mt-5" style={{ color: '#64748b' }}>
          No account?{' '}
          <Link href="/dashboard" className="font-medium transition hover:text-white" style={{ color: '#60a5fa' }}>
            Start free
          </Link>
        </p>
      </div>
    </div>
  );
}

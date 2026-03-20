// src/pages/LoginPage.js
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#0f2244',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'DM Sans, system-ui, sans-serif', padding: 20,
    }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(77,166,255,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(167,139,250,0.06) 0%, transparent 50%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 860, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, borderRadius: 16, overflow: 'hidden', boxShadow: '0 25px 80px rgba(0,0,0,0.4)', position: 'relative' }}>

        {/* Left branding panel */}
        <div style={{ background: 'linear-gradient(135deg, #1a3460 0%, #0f2244 100%)', padding: '52px 44px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 30, fontWeight: 700, color: '#fff', letterSpacing: '-0.5px', marginBottom: 8 }}>
              Fin<span style={{ color: '#4da6ff' }}>Flow</span>
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 40 }}>Finance Workflow System</div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff', lineHeight: 1.3, marginBottom: 16 }}>
              Streamline every approval across your organisation
            </h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.8 }}>
              32 workflow types · Role-based approvals · Email notifications · GL posting
            </p>
          </div>

          <div style={{ marginTop: 48 }}>
            {[
              { icon: '✓', text: 'Initiator → Dept Recommendation → CEO → Approval → HR → Finance → GL Post' },
              { icon: '🔔', text: 'Real-time email notifications at every stage' },
              { icon: '📊', text: 'Analytics and reports dashboard' },
            ].map((f, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 14, marginTop: 1 }}>{f.icon}</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right login form */}
        <div style={{ background: '#fff', padding: '52px 44px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h3 style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 6 }}>Sign in</h3>
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 36 }}>Enter your credentials to access FinFlow</p>

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-control" type="email" value={email}
                onChange={e => setEmail(e.target.value)} placeholder="you@finflow.lk" required autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-control" type="password" value={password}
                onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>

            {error && (
              <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                ⚠ {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: 12, fontSize: 14 }}
              disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in →'}
            </button>
          </form>

          <div style={{ marginTop: 32, padding: '18px', background: '#f9fafb', borderRadius: 10, border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>
              Demo Accounts
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { email: 'admin@finflow.lk',    pass: 'admin123',    role: 'Admin',    color: '#f87171' },
                { email: 'malith@finflow.lk',   pass: 'password123', role: 'Initiator',color: '#4da6ff' },
                { email: 'ravi@finflow.lk',     pass: 'password123', role: 'Supervisor',color: '#34d399' },
                { email: 'sunethra@finflow.lk', pass: 'password123', role: 'HR',       color: '#f472b6' },
                { email: 'amal@finflow.lk',     pass: 'password123', role: 'Finance',  color: '#fbbf24' },
                { email: 'pradeep@finflow.lk',  pass: 'password123', role: 'CEO',      color: '#a78bfa' },
              ].map(u => (
                <div key={u.email} onClick={() => { setEmail(u.email); setPassword(u.pass); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 7, cursor: 'pointer', transition: 'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: u.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: '#374151', fontFamily: 'DM Mono, monospace', flex: 1 }}>{u.email}</span>
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: `${u.color}20`, color: u.color, fontWeight: 600 }}>{u.role}</span>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 10 }}>Click any row to auto-fill credentials</div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiCall } from '../../utils/api';

const ROLES = ['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst'];

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [selectedRole, setSelectedRole] = useState('');
  const [roleOpen, setRoleOpen] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      const res = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      router.push('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Left Info Panel */}
      <div className="auth-left-panel">
        {/* Logo */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 0 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <rect x="1" y="3" width="15" height="13" rx="1" />
                <polygon points="16 8 20 8 23 11 23 16 16 16" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#0b1120', letterSpacing: '-0.5px' }}>TransitOps</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>Fleet Intelligence</div>
            </div>
          </div>

          {/* Role list */}
          <div style={{ marginTop: 64 }}>
            <p style={{ fontSize: 14, letterSpacing: '1.4px', textTransform: 'uppercase', color: '#334155', marginBottom: 24 }}>
              One login, four roles
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst'].map((role) => (
                <div key={role} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', flexShrink: 0 }} />
                  <span style={{ fontSize: 14, color: '#1e293b', fontWeight: 500 }}>{role}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Access scoped box */}
          <div style={{ marginTop: 48 }}>
            <div style={{
              background: 'rgba(255,255,255,0.5)',
              border: '1px solid #cbd5e1',
              borderRadius: 14,
              padding: 17,
            }}>
              <p style={{ fontSize: 12, letterSpacing: '0.3px', textTransform: 'uppercase', color: '#475569', marginBottom: 8 }}>
                Access scoped by role
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {[
                  '• Fleet Manager → Fleet, Maintenance',
                  '• Dispatcher → Dashboard, Trips',
                  '• Safety Officer → Drivers, Compliance',
                  '• Financial Analyst → Fuel & Expenses, Analytics',
                ].map((line) => (
                  <p key={line} style={{ fontSize: 12, color: '#64748b' }}>{line}</p>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p style={{ fontSize: 12, color: '#94a3b8' }}>TRANSITOPS © 2026 · RBAC ENABLED</p>
      </div>

      {/* Right Form Panel */}
      <div className="auth-right-panel">
        <div style={{ width: '100%', maxWidth: 384, padding: '0 0' }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
            Sign in to your account
          </h1>
          <p style={{ fontSize: 14, color: '#90a1b9', marginBottom: 32 }}>
            Enter your credentials to continue
          </p>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.12)',
              border: '1px solid rgba(239,68,68,0.4)',
              borderRadius: 10,
              padding: '12px 16px',
              marginBottom: 20,
              fontSize: 14,
              color: '#ef4444',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, letterSpacing: '0.6px', textTransform: 'uppercase', color: '#90a1b9', marginBottom: 8 }}>
                Email
              </label>
              <input
                type="email"
                className="input-field"
                placeholder="you@transitops.in"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                style={{
                  background: '#1a2640',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 10,
                  padding: '13px 17px',
                  fontSize: 14,
                  color: '#e2e8f0',
                }}
                required
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, letterSpacing: '0.6px', textTransform: 'uppercase', color: '#90a1b9', marginBottom: 8 }}>
                Password
              </label>
              <input
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                style={{
                  background: '#1a2640',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 10,
                  padding: '13px 17px',
                  fontSize: 14,
                  color: '#e2e8f0',
                }}
                required
              />
            </div>

            {/* Role dropdown */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, letterSpacing: '0.6px', textTransform: 'uppercase', color: '#90a1b9', marginBottom: 8 }}>
                Role (RBAC)
              </label>
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setRoleOpen(!roleOpen)}
                  style={{
                    width: '100%',
                    background: '#1a2640',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 10,
                    padding: '13px 17px',
                    fontSize: 14,
                    color: selectedRole ? '#e2e8f0' : '#64748b',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span>{selectedRole || 'Select your role...'}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#90a1b9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    style={{ transform: roleOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {roleOpen && (
                  <div style={{
                    position: 'absolute', top: '105%', left: 0, right: 0, zIndex: 50,
                    background: '#1a2640',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 10,
                    overflow: 'hidden',
                    boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
                  }}>
                    {ROLES.map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => { setSelectedRole(role); setRoleOpen(false); }}
                        style={{
                          width: '100%', textAlign: 'left', padding: '12px 17px',
                          background: selectedRole === role ? 'rgba(245,158,11,0.1)' : 'transparent',
                          border: 'none',
                          color: selectedRole === role ? '#f59e0b' : '#e2e8f0',
                          fontSize: 14, cursor: 'pointer',
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                        }}
                        onMouseEnter={(e) => { if (selectedRole !== role) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                        onMouseLeave={(e) => { if (selectedRole !== role) e.currentTarget.style.background = 'transparent'; }}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Remember me + Forgot password */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <div
                  onClick={() => setRememberMe(!rememberMe)}
                  style={{
                    width: 16, height: 16, borderRadius: 3,
                    background: rememberMe ? '#fe9a00' : '#fff',
                    border: `1px solid ${rememberMe ? '#fe9a00' : '#767676'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {rememberMe && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                <span style={{ fontSize: 14, color: '#90a1b9' }}>Remember me</span>
              </label>
              <button
                type="button"
                style={{ background: 'none', border: 'none', color: '#ffb900', fontSize: 14, cursor: 'pointer' }}
              >
                Forgot password?
              </button>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                background: 'linear-gradient(173deg, #f59e0b 0%, #d97706 100%)',
                border: 'none',
                borderRadius: 10,
                padding: '13px',
                fontSize: 14,
                fontWeight: 600,
                color: '#0b1120',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.8 : 1,
                boxShadow: '0 4px 10px rgba(245,158,11,0.35)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Demo credentials hint */}
          <div style={{
            marginTop: 28,
            padding: '14px 16px',
            background: 'rgba(59,130,246,0.06)',
            border: '1px solid rgba(59,130,246,0.15)',
            borderRadius: 10,
            fontSize: 12,
            color: '#64748b',
          }}>
            <strong style={{ color: '#3b82f6' }}>Demo credentials:</strong>{' '}
            manager@transitops.com / demo123
          </div>
        </div>
      </div>
    </div>
  );
}

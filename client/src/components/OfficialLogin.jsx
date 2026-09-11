import React, { useState } from 'react';
import { ShieldCheck, Mail, Lock, AlertCircle, LogIn, Eye, EyeOff } from 'lucide-react';

/**
 * OfficialLogin — Premium login page for government officials only.
 * Victims never see or need this page; it is gated behind the official nav tab.
 */
export default function OfficialLogin({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await onLoginSuccess(email, password);
      if (!result.success) {
        setError(result.error || 'Invalid credentials.');
      }
    } catch (err) {
      setError('Unable to connect to the authentication server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '70vh',
      padding: '24px'
    }}>
      <div className="glass-card" style={{
        width: '100%',
        maxWidth: '460px',
        padding: '40px 36px'
      }}>
        {/* Header Shield & Branding */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '68px',
            height: '68px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(76, 123, 244, 0.15), rgba(76, 123, 244, 0.05))',
            border: '2px solid rgba(76, 123, 244, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 18px auto'
          }}>
            <ShieldCheck size={32} color="var(--primary-blue)" />
          </div>

          <h2 style={{
            fontSize: '1.45rem',
            fontWeight: '800',
            color: 'var(--text-primary)',
            marginBottom: '6px'
          }}>
            Authorized Official Portal
          </h2>
          <p style={{
            fontSize: '0.84rem',
            color: 'var(--text-secondary)',
            lineHeight: '1.4'
          }}>
            NHAA Nodal Command Center Access<br />
            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              Ministry of Social Justice & Empowerment, Government of India
            </span>
          </p>
        </div>

        {/* Security Notice */}
        <div style={{
          background: 'var(--bg-surface-subtle)',
          border: '1px solid var(--border-glass)',
          borderRadius: 'var(--radius-xs)',
          padding: '12px 14px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px'
        }}>
          <ShieldCheck size={16} color="var(--accent-emerald)" style={{ marginTop: '2px', flexShrink: 0 }} />
          <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
            <strong style={{ color: 'var(--text-primary)' }}>Restricted Access:</strong>{' '}
            This portal is exclusively for designated government officials with issued credentials. 
            Complainants should use the "Track Your Complaint" feature instead.
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            background: 'var(--risk-critical-bg)',
            border: '1px solid var(--risk-critical-border)',
            borderRadius: 'var(--radius-xs)',
            padding: '12px 14px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} color="var(--risk-critical-text)" />
            <span style={{ fontSize: '0.84rem', color: 'var(--risk-critical-text)', fontWeight: '600' }}>
              {error}
            </span>
          </div>
        )}

        {/* Quick Role Selection for Audit Log Verification */}
        <div style={{ marginBottom: '22px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: '700',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}>
              Quick Fill Demo Credentials by Role
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '8px'
          }}>
            {[
              { label: 'Admin', role: 'admin', badge: 'All Logs', email: 'admin@nhaa.gov.in', pass: 'NhaaAdmin@2026', color: '#60a5fa' },
              { label: 'Supervisor', role: 'supervisor', badge: 'All Logs', email: 'supervisor@nhaa.gov.in', pass: 'Supervisor@2026', color: '#a78bfa' },
              { label: 'Officer Rao', role: 'officer', badge: 'Case #1 Only', email: 'officer.rao@nhaa.gov.in', pass: 'Officer@2026', color: '#34d399' },
              { label: 'Officer Kadam', role: 'officer', badge: 'Case #2 Only', email: 'officer.kadam@nhaa.gov.in', pass: 'Officer@2026', color: '#fbbf24' }
            ].map((acc) => {
              const isSelected = email === acc.email;
              return (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => {
                    setEmail(acc.email);
                    setPassword(acc.pass);
                    setError(null);
                  }}
                  style={{
                    background: isSelected ? 'var(--accent-blue-subtle)' : 'var(--bg-surface-subtle)',
                    border: isSelected ? '1px solid var(--accent-blue)' : '1px solid var(--border-glass)',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: '800', color: acc.color }}>
                      {acc.label}
                    </span>
                    <span style={{
                      fontSize: '0.64rem',
                      fontWeight: '700',
                      padding: '1px 5px',
                      borderRadius: '4px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      color: 'var(--text-muted)'
                    }}>
                      {acc.badge}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {acc.email}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          {/* Email Field */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{
              display: 'block',
              fontSize: '0.74rem',
              fontWeight: '700',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: '6px'
            }}>
              Official Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} color="var(--text-muted)" style={{
                position: 'absolute', left: '14px', top: '13px'
              }} />
              <input
                id="official-email"
                type="email"
                placeholder="e.g. admin@nhaa.gov.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                style={{
                  width: '100%',
                  padding: '11px 14px 11px 40px',
                  borderRadius: 'var(--radius-xs)',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-glass)',
                  color: 'var(--text-primary)',
                  fontSize: '0.92rem',
                  fontWeight: '600',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--primary-blue)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border-glass)'}
              />
            </div>
          </div>

          {/* Password Field */}
          <div style={{ marginBottom: '26px' }}>
            <label style={{
              display: 'block',
              fontSize: '0.74rem',
              fontWeight: '700',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: '6px'
            }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="var(--text-muted)" style={{
                position: 'absolute', left: '14px', top: '13px'
              }} />
              <input
                id="official-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                style={{
                  width: '100%',
                  padding: '11px 44px 11px 40px',
                  borderRadius: 'var(--radius-xs)',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-glass)',
                  color: 'var(--text-primary)',
                  fontSize: '0.92rem',
                  fontWeight: '600',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--primary-blue)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border-glass)'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '10px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px'
                }}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            id="official-login-btn"
            type="submit"
            className="btn-primary"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '13px',
              fontSize: '0.95rem',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              opacity: isLoading ? 0.7 : 1,
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
          >
            <LogIn size={18} />
            {isLoading ? 'Authenticating...' : 'Sign In to Command Center'}
          </button>
        </form>

        {/* Footer Notice */}
        <div style={{
          marginTop: '24px',
          textAlign: 'center',
          fontSize: '0.72rem',
          color: 'var(--text-muted)',
          lineHeight: '1.5'
        }}>
          Secure session with JWT encryption · 8-hour expiry<br />
          All access is logged and auditable under IT Act 2000 §43A
        </div>
      </div>
    </div>
  );
}

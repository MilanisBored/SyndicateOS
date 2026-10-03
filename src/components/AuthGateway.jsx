import React, { useState } from 'react';
import { signInWithEmail, signUpWithEmail, isSupabaseConfigured } from '../lib/supabaseClient';

export default function AuthGateway({ onAuthenticated, onGuestAccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const isConfigured = isSupabaseConfigured();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email.trim() || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    if (mode === 'signup') {
      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match.');
        return;
      }
    }

    setIsLoading(true);

    try {
      if (mode === 'login') {
        const data = await signInWithEmail(email, password);
        if (data?.user) {
          onAuthenticated(data.user);
        }
      } else {
        const data = await signUpWithEmail(email, password);
        if (data?.session) {
          onAuthenticated(data.user);
        } else if (data?.user) {
          setSuccessMsg('Account created successfully! If email confirmation is enabled on your Supabase project, check your inbox to confirm.');
          setMode('login');
        }
      }
    } catch (err) {
      console.error('Auth Gateway Error:', err);
      let msg = err.message || 'Authentication failed.';
      if (msg.includes('Invalid login credentials')) {
        msg = 'Invalid email or password. Please verify and retry.';
      } else if (msg.includes('Email not confirmed')) {
        msg = 'Email not confirmed yet. Check your inbox or disable email confirmation in your Supabase dashboard.';
      } else if (msg.includes('User already registered')) {
        msg = 'An account with this email already exists. Please Sign In.';
        setMode('login');
      }
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-app)',
      padding: '24px 16px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '32px 28px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.45)',
      }}>
        {/* Terminal Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '3px 10px',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)',
            marginBottom: '12px',
          }}>
            <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }}></span>
            SYNDICATE_OS • SECURE GATEWAY
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
            SyndicateOS Terminal
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
            {mode === 'login' ? 'Authenticate to access private syndicate ledger' : 'Register a new manager account'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-subtle)',
          borderRadius: 'var(--radius-sm)',
          padding: '2px',
          marginBottom: '20px',
          border: '1px solid var(--border-subtle)',
        }}>
          <button
            type="button"
            style={{
              flex: 1,
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 500,
              background: mode === 'login' ? 'var(--bg-surface)' : 'transparent',
              color: mode === 'login' ? 'var(--text-primary)' : 'var(--text-muted)',
              border: mode === 'login' ? '1px solid var(--border-subtle)' : 'none',
              borderRadius: 'var(--radius-xs)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
          >
            Sign In
          </button>
          <button
            type="button"
            style={{
              flex: 1,
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 500,
              background: mode === 'signup' ? 'var(--bg-surface)' : 'transparent',
              color: mode === 'signup' ? 'var(--text-primary)' : 'var(--text-muted)',
              border: mode === 'signup' ? '1px solid var(--border-subtle)' : 'none',
              borderRadius: 'var(--radius-xs)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onClick={() => { setMode('signup'); setErrorMsg(''); setSuccessMsg(''); }}
          >
            Create Account
          </button>
        </div>

        {/* Status Alerts */}
        {errorMsg && (
          <div style={{
            background: 'var(--loss-subtle)',
            border: '1px solid var(--loss)',
            color: 'var(--loss)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 12px',
            fontSize: '12px',
            marginBottom: '16px',
            lineHeight: 1.4,
          }}>
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div style={{
            background: 'var(--profit-subtle)',
            border: '1px solid var(--profit)',
            color: 'var(--profit)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 12px',
            fontSize: '12px',
            marginBottom: '16px',
            lineHeight: 1.4,
          }}>
            {successMsg}
          </div>
        )}

        {!isConfigured && (
          <div style={{
            background: 'rgba(234, 179, 8, 0.1)',
            border: '1px solid rgba(234, 179, 8, 0.3)',
            color: '#eab308',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 12px',
            fontSize: '11px',
            marginBottom: '16px',
            lineHeight: 1.4,
          }}>
            ⚠️ Cloud database URL & Key not detected in environment. You can enter as Guest to configure settings inside.
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '14px' }}>
            <label className="form-label" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. milan@syndicate.io"
              className="form-input"
              required
              autoFocus
              autoComplete="email"
            />
          </div>

          <div className="form-group" style={{ marginBottom: mode === 'signup' ? '14px' : '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label className="form-label" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                Password
              </label>
              <button
                type="button"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '11px',
                  cursor: 'pointer',
                  padding: 0,
                }}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="form-input mono"
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          {mode === 'signup' && (
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Confirm Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="form-input mono"
                required
                autoComplete="new-password"
              />
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 500,
              justifyContent: 'center',
            }}
            disabled={isLoading}
          >
            {isLoading
              ? 'Authenticating...'
              : mode === 'login'
              ? 'Unlock Terminal'
              : 'Create Manager Account'}
          </button>
        </form>

        {/* Footer info & Guest bypass */}
        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)', textAlign: 'center' }}>
          <button
            type="button"
            onClick={onGuestAccess}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '11px',
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: '4px',
            }}
          >
            Continue in Local Demo / Offline Mode →
          </button>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '8px' }}>
            Encrypted with Supabase JWT • End-to-end Ledger isolation
          </div>
        </div>
      </div>
    </div>
  );
}

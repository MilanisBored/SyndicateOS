import React, { useState } from 'react';
import { signInWithEmail, signUpWithEmail, signInWithGoogle, isSupabaseConfigured } from '../lib/supabaseClient';

export default function AuthGateway({ onAuthenticated, onGuestAccess, onBackToLanding }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const isConfigured = isSupabaseConfigured();

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error('Google Auth Error:', err);
      setErrorMsg(err.message || 'Failed to initialize Google login. Ensure Google provider is enabled in Supabase.');
      setIsGoogleLoading(false);
    }
  };

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
        {onBackToLanding && (
          <button
            type="button"
            onClick={onBackToLanding}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginBottom: '16px',
              padding: 0,
            }}
          >
            ← Back to Overview
          </button>
        )}

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

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isGoogleLoading || isLoading}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '9px 16px',
            color: 'var(--text-primary)',
            fontSize: '13px',
            fontWeight: 500,
            cursor: isGoogleLoading ? 'wait' : 'pointer',
            transition: 'all 0.15s ease',
            marginBottom: '16px',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.borderColor = 'var(--border-focus)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-subtle)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          {isGoogleLoading ? 'Connecting to Google...' : (mode === 'login' ? 'Continue with Google' : 'Sign up with Google')}
        </button>

        {/* Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '16px',
          color: 'var(--text-muted)',
          fontSize: '11px',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
          <span>or with email</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
        </div>

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

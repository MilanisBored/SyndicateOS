import React from 'react';

export default function LandingPage({ 
  onLaunchTerminal, 
  onGuestAccess, 
  theme, 
  toggleTheme,
  isAuthenticated 
}) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      background: 'var(--bg-app)',
      color: 'var(--text-primary)',
      fontFamily: 'var(--font-sans)',
      padding: '24px 32px',
      boxSizing: 'border-box',
    }}>
      {/* Top Header */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        maxWidth: '800px',
        margin: '0 auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#22c55e',
          }} />
          <span style={{
            fontSize: '14px',
            fontWeight: 600,
            letterSpacing: '-0.02em',
            fontFamily: 'var(--font-mono)',
          }}>
            SyndicateOS
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={toggleTheme}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '11px', padding: '3px 8px' }}
          >
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
          <a
            href="https://github.com/MilanisBored/SyndicateOS"
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '11px', textDecoration: 'none', color: 'inherit' }}
          >
            GitHub
          </a>
        </div>
      </header>

      {/* Main Single-Screen Hero */}
      <main style={{
        maxWidth: '640px',
        margin: '0 auto',
        width: '100%',
        textAlign: 'center',
        padding: '32px 0',
      }}>
        <div style={{
          display: 'inline-block',
          fontSize: '11px',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '16px',
        }}>
          Institutional Wealth & Ledger
        </div>

        <h1 style={{
          fontSize: 'clamp(28px, 4.5vw, 42px)',
          fontWeight: 600,
          letterSpacing: '-0.03em',
          lineHeight: 1.2,
          margin: '0 0 16px 0',
          color: 'var(--text-primary)',
        }}>
          Unitized Capital Ledger for Co-Invested Wealth.
        </h1>

        <p style={{
          fontSize: '14px',
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          margin: '0 auto 32px auto',
          maxWidth: '520px',
        }}>
          Track pooled capital with partner accounts at exact Net Asset Value (NAV). Mark-to-market mutual fund pricing via official AMFI feeds with zero dilution.
        </p>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: '40px',
        }}>
          <button
            type="button"
            onClick={onLaunchTerminal}
            className="btn btn-primary"
            style={{
              padding: '8px 20px',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            {isAuthenticated ? 'Open Terminal →' : 'Sign In / Register →'}
          </button>

          <button
            type="button"
            onClick={onGuestAccess}
            className="btn btn-secondary"
            style={{
              padding: '8px 18px',
              fontSize: '13px',
            }}
          >
            Demo Mode ⚡
          </button>
        </div>

        {/* Minimal Spec Strip */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
          textAlign: 'left',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
        }}>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>
              Ledger Engine
            </div>
            <div style={{ fontSize: '12px', fontWeight: 500, marginTop: '2px', color: 'var(--text-primary)' }}>
              Unitized NAV
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Anti-dilution entries & exits
            </div>
          </div>

          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>
              Market Pricing
            </div>
            <div style={{ fontSize: '12px', fontWeight: 500, marginTop: '2px', color: 'var(--text-primary)' }}>
              AMFI Live Feed
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Official closing NAV sync
            </div>
          </div>

          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>
              Cloud & Storage
            </div>
            <div style={{ fontSize: '12px', fontWeight: 500, marginTop: '2px', color: 'var(--text-primary)' }}>
              Supabase Postgres
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Encrypted session sync
            </div>
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer style={{
        textAlign: 'center',
        fontSize: '11px',
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-mono)',
        width: '100%',
        maxWidth: '800px',
        margin: '0 auto',
      }}>
        SyndicateOS • MIT License • Zero Tracking
      </footer>
    </div>
  );
}

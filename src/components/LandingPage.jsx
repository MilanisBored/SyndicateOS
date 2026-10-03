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
            fontSize: '15px',
            fontWeight: 600,
            letterSpacing: '-0.02em',
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
          Shared Investment Tracker
        </div>

        {/* 3 Simple Words Headline */}
        <h1 style={{
          fontSize: 'clamp(32px, 5vw, 44px)',
          fontWeight: 600,
          letterSpacing: '-0.03em',
          lineHeight: 1.2,
          margin: '0 0 16px 0',
          color: 'var(--text-primary)',
        }}>
          Invest Together Fairly.
        </h1>

        {/* Simple Plain-English Explanation */}
        <p style={{
          fontSize: '15px',
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          margin: '0 auto 32px auto',
          maxWidth: '520px',
        }}>
          Track investments you make with your partner or friends. Clearly see who owns what, track real-time profits, and make sure everyone gets their fair share.
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
              padding: '9px 22px',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            {isAuthenticated ? 'Open Dashboard →' : 'Sign In / Register →'}
          </button>

          <button
            type="button"
            onClick={onGuestAccess}
            className="btn btn-secondary"
            style={{
              padding: '9px 18px',
              fontSize: '13px',
            }}
          >
            Try Demo Mode ⚡
          </button>
        </div>

        {/* Simple 3-Box Explanation */}
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
              Fair Shares
            </div>
            <div style={{ fontSize: '13px', fontWeight: 500, marginTop: '2px', color: 'var(--text-primary)' }}>
              100% Transparent
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '3px', lineHeight: 1.4 }}>
              Know exactly who owns what, even if you invest at different times.
            </div>
          </div>

          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>
              Live Prices
            </div>
            <div style={{ fontSize: '13px', fontWeight: 500, marginTop: '2px', color: 'var(--text-primary)' }}>
              Auto Updates
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '3px', lineHeight: 1.4 }}>
              Mutual fund prices update daily so you always see your real profit.
            </div>
          </div>

          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>
              Private & Safe
            </div>
            <div style={{ fontSize: '13px', fontWeight: 500, marginTop: '2px', color: 'var(--text-primary)' }}>
              Keep Separate
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '3px', lineHeight: 1.4 }}>
              Keep your personal salary and savings separate from shared money.
            </div>
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer style={{
        textAlign: 'center',
        fontSize: '11px',
        color: 'var(--text-muted)',
        width: '100%',
        maxWidth: '800px',
        margin: '0 auto',
      }}>
        SyndicateOS • Built for partners & friends to invest together
      </footer>
    </div>
  );
}

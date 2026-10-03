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
      padding: '32px 24px',
      boxSizing: 'border-box',
    }}>
      {/* Top Header */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        maxWidth: '680px',
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

        <button
          type="button"
          onClick={toggleTheme}
          className="btn btn-secondary btn-sm"
          style={{ fontSize: '11px', padding: '3px 8px' }}
        >
          {theme === 'dark' ? 'Light' : 'Dark'}
        </button>
      </header>

      {/* Main Minimal Centerpiece */}
      <main style={{
        maxWidth: '560px',
        margin: '0 auto',
        width: '100%',
        textAlign: 'center',
      }}>
        <h1 style={{
          fontSize: 'clamp(36px, 5.5vw, 48px)',
          fontWeight: 600,
          letterSpacing: '-0.035em',
          lineHeight: 1.15,
          margin: '0 0 16px 0',
          color: 'var(--text-primary)',
        }}>
          Pooled capital, perfected.
        </h1>

        <p style={{
          fontSize: '16px',
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          margin: '0 auto 32px auto',
          maxWidth: '500px',
        }}>
          Monitor pooled investments, track live portfolio valuations, and manage partner equity with effortless precision.
        </p>

        {/* Action Button */}
        <div>
          <button
            type="button"
            onClick={onLaunchTerminal}
            className="btn btn-primary"
            style={{
              padding: '10px 28px',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            {isAuthenticated ? 'Open SyndicateOS' : 'Launch SyndicateOS'}
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        fontSize: '11px',
        color: 'var(--text-muted)',
      }}>
        SyndicateOS
      </footer>
    </div>
  );
}

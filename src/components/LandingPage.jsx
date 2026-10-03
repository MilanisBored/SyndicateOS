import React from 'react';

export default function LandingPage({ 
  onLaunchTerminal, 
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
      background: 'var(--bg-app, #09090b)',
      color: 'var(--text-primary, #f4f4f5)',
      fontFamily: 'var(--font-sans, sans-serif)',
      padding: '32px 24px',
      boxSizing: 'border-box',
    }}>
      {/* Top Header */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        maxWidth: '920px',
        margin: '0 auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#22c55e',
            boxShadow: '0 0 10px rgba(34, 197, 94, 0.4)',
          }} />
          <span style={{
            fontSize: '15px',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            fontFamily: 'var(--font-mono, monospace)',
          }}>
            SYNDICATE_OS
          </span>
          <span style={{
            fontSize: '10px',
            background: 'var(--bg-subtle, #18181b)',
            border: '1px solid var(--border-subtle, #27272a)',
            padding: '2px 6px',
            borderRadius: '3px',
            color: 'var(--text-muted, #71717a)',
            fontFamily: 'var(--font-mono, monospace)',
          }}>
            v2.4 LIVE
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={toggleTheme}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '11px', padding: '4px 10px', fontFamily: 'var(--font-mono, monospace)' }}
          >
            {theme === 'dark' ? 'LIGHT' : 'DARK'}
          </button>
          <button
            type="button"
            onClick={onLaunchTerminal}
            className="btn btn-primary btn-sm"
            style={{ fontSize: '11px', padding: '5px 14px', fontWeight: 600, fontFamily: 'var(--font-mono, monospace)' }}
          >
            {isAuthenticated ? 'OPEN TERMINAL' : 'SIGN IN'}
          </button>
        </div>
      </header>

      {/* Main Hero Centerpiece */}
      <main style={{
        maxWidth: '820px',
        margin: '40px auto',
        width: '100%',
        textAlign: 'center',
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'var(--bg-subtle, #18181b)',
          border: '1px solid var(--border-subtle, #27272a)',
          borderRadius: '4px',
          padding: '4px 12px',
          fontSize: '11px',
          fontFamily: 'var(--font-mono, monospace)',
          color: 'var(--text-secondary, #a1a1aa)',
          marginBottom: '20px',
        }}>
          <span>POOL MANAGEMENT &bull; UNITIZED NAV &bull; DUAL PERSPECTIVE</span>
        </div>

        <h1 style={{
          fontSize: 'clamp(36px, 6vw, 54px)',
          fontWeight: 700,
          letterSpacing: '-0.035em',
          lineHeight: 1.12,
          margin: '0 0 18px 0',
          color: 'var(--text-primary, #f4f4f5)',
        }}>
          Pooled capital, perfected.
        </h1>

        <p style={{
          fontSize: '15px',
          color: 'var(--text-secondary, #a1a1aa)',
          lineHeight: 1.6,
          margin: '0 auto 36px auto',
          maxWidth: '560px',
        }}>
          Run investment pools for friends and partners with institutional-grade NAV fairness. Track live asset valuations, automate unit accounting, and verify every transaction.
        </p>

        {/* Primary Call to Action */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', marginBottom: '48px' }}>
          <button
            type="button"
            onClick={onLaunchTerminal}
            className="btn btn-primary"
            style={{
              padding: '12px 32px',
              fontSize: '13px',
              fontWeight: 600,
              fontFamily: 'var(--font-mono, monospace)',
              letterSpacing: '0.02em',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            {isAuthenticated ? 'OPEN SYNDICATE_OS &rarr;' : 'LAUNCH TERMINAL &rarr;'}
          </button>
        </div>

        {/* Architecture Grid Highlights */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          textAlign: 'left',
          marginTop: '24px',
        }}>
          <div style={{
            background: 'var(--bg-surface, #121215)',
            border: '1px solid var(--border-subtle, #27272a)',
            borderRadius: '6px',
            padding: '20px',
          }}>
            <div style={{
              fontSize: '11px',
              fontFamily: 'var(--font-mono, monospace)',
              color: 'var(--profit, #22c55e)',
              marginBottom: '6px',
              fontWeight: 600,
            }}>
              [01] MATHEMATICAL FAIRNESS
            </div>
            <h3 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
              Unitized NAV Engine
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              New member deposits buy units at prevailing NAV without diluting early profits. Redemptions exit cleanly at market valuation.
            </p>
          </div>

          <div style={{
            background: 'var(--bg-surface, #121215)',
            border: '1px solid var(--border-subtle, #27272a)',
            borderRadius: '6px',
            padding: '20px',
          }}>
            <div style={{
              fontSize: '11px',
              fontFamily: 'var(--font-mono, monospace)',
              color: '#6366f1',
              marginBottom: '6px',
              fontWeight: 600,
            }}>
              [02] DUAL PERSPECTIVE
            </div>
            <h3 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
              Manager & Investor Views
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Managers execute fund operations while investors receive read-only personal statements, audit trails, and two-way verification.
            </p>
          </div>

          <div style={{
            background: 'var(--bg-surface, #121215)',
            border: '1px solid var(--border-subtle, #27272a)',
            borderRadius: '6px',
            padding: '20px',
          }}>
            <div style={{
              fontSize: '11px',
              fontFamily: 'var(--font-mono, monospace)',
              color: '#eab308',
              marginBottom: '6px',
              fontWeight: 600,
            }}>
              [03] LIVE ASSET REVALUATION
            </div>
            <h3 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
              Holdings & Valuation Sync
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Track mutual funds, equity positions, bullion, and cash. Sync holdings valuation directly into NAV with one click.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        fontSize: '11px',
        color: 'var(--text-muted, #71717a)',
        paddingTop: '20px',
        fontFamily: 'var(--font-mono, monospace)',
      }}>
        SYNDICATE_OS &bull; PRIVATE LEDGER TERMINAL
      </footer>
    </div>
  );
}

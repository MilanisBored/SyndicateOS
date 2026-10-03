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
      background: 'var(--bg-app)',
      color: 'var(--text-primary)',
      fontFamily: 'var(--font-sans)',
      overflowX: 'hidden',
    }}>
      {/* Top Navigation */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(12px)',
        backgroundColor: 'rgba(9, 9, 11, 0.8)',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {/* Brand */}
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
            <span style={{
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: 'var(--radius-xs)',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
            }}>
              v2.0
            </span>
          </div>

          {/* Links */}
          <nav style={{ display: 'none', gap: '24px', alignItems: 'center' }} className="landing-nav-links">
            <a href="#how-it-works" style={{ fontSize: '13px', color: 'var(--text-secondary)', textDecoration: 'none' }}>
              Unitized NAV Math
            </a>
            <a href="#features" style={{ fontSize: '13px', color: 'var(--text-secondary)', textDecoration: 'none' }}>
              Architecture
            </a>
            <a href="#live-feed" style={{ fontSize: '13px', color: 'var(--text-secondary)', textDecoration: 'none' }}>
              AMFI Live Sync
            </a>
            <a 
              href="https://github.com/MilanisBored/SyndicateOS" 
              target="_blank" 
              rel="noreferrer"
              style={{ fontSize: '13px', color: 'var(--text-secondary)', textDecoration: 'none' }}
            >
              GitHub ↗
            </a>
          </nav>

          {/* Right Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={toggleTheme}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '11px', padding: '4px 8px' }}
              title="Toggle theme"
            >
              {theme === 'dark' ? 'Light' : 'Dark'}
            </button>

            <button
              type="button"
              onClick={onGuestAccess}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '12px' }}
            >
              Explore Demo ⚡
            </button>

            <button
              type="button"
              onClick={onLaunchTerminal}
              className="btn btn-primary btn-sm"
              style={{ fontSize: '12px', fontWeight: 500 }}
            >
              {isAuthenticated ? 'Enter Terminal →' : 'Launch Terminal →'}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '72px 24px 48px 24px',
        textAlign: 'center',
      }}>
        {/* Release Tag */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          padding: '4px 12px',
          fontSize: '11px',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-secondary)',
          marginBottom: '24px',
        }}>
          <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }} />
          INSTITUTIONAL UNITIZED WEALTH & LEDGER OS
        </div>

        {/* Hero Title */}
        <h1 style={{
          fontSize: 'clamp(32px, 5vw, 54px)',
          fontWeight: 700,
          letterSpacing: '-0.035em',
          lineHeight: 1.1,
          maxWidth: '850px',
          margin: '0 auto 20px auto',
          color: 'var(--text-primary)',
        }}>
          Mathematical Fairness for Co-Invested Wealth.
        </h1>

        {/* Hero Description */}
        <p style={{
          fontSize: 'clamp(14px, 1.8vw, 17px)',
          color: 'var(--text-secondary)',
          maxWidth: '680px',
          margin: '0 auto 36px auto',
          lineHeight: 1.6,
        }}>
          The unitized capital ledger engineered for partners, family syndicates, and angel pools. Reconcile capital entries, redemptions, and underlying holdings at exact Net Asset Value with zero dilution.
        </p>

        {/* Primary CTA Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          alignItems: 'center',
          flexWrap: 'wrap',
          marginBottom: '48px',
        }}>
          <button
            type="button"
            onClick={onLaunchTerminal}
            className="btn btn-primary"
            style={{
              padding: '10px 24px',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            {isAuthenticated ? 'Open Syndicate Terminal →' : 'Launch Terminal (Sign In) →'}
          </button>

          <button
            type="button"
            onClick={onGuestAccess}
            className="btn btn-secondary"
            style={{
              padding: '10px 20px',
              fontSize: '14px',
            }}
          >
            Explore Live Demo ⚡
          </button>
        </div>

        {/* Real-time Ticker Ribbon */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '24px',
          flexWrap: 'wrap',
          justifyContent: 'center',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 20px',
          fontSize: '12px',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-secondary)',
          marginBottom: '54px',
        }}>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>MARKET SYNC: </span>
            <span style={{ color: '#22c55e' }}>● AMFI LIVE FEED (0% API COST)</span>
          </div>
          <div style={{ color: 'var(--border-subtle)' }}>|</div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>NAV ENGINE: </span>
            <span style={{ color: 'var(--text-primary)' }}>UNITIZED ANTI-DILUTION</span>
          </div>
          <div style={{ color: 'var(--border-subtle)' }}>|</div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>DATABASE: </span>
            <span style={{ color: 'var(--text-primary)' }}>SUPABASE POSTGRESQL</span>
          </div>
        </div>

        {/* High-Density Terminal Preview Card */}
        <div style={{
          maxWidth: '960px',
          margin: '0 auto',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.5)',
          textAlign: 'left',
        }}>
          {/* Terminal Window Top Bar */}
          <div style={{
            background: 'var(--bg-subtle)',
            padding: '10px 16px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', opacity: 0.8 }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#eab308', opacity: 0.8 }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e', opacity: 0.8 }} />
            </div>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              syndicate_terminal :: active_fund_nav_monitor
            </span>
            <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#22c55e' }}>
              ● LIVE 104.00 NAV
            </span>
          </div>

          {/* Terminal Content Mock */}
          <div style={{ padding: '20px' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              marginBottom: '20px',
            }}>
              <div style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
                  Total Syndicate AUM
                </div>
                <div style={{ fontSize: '18px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                  ₹3,73,476.48
                </div>
                <div style={{ fontSize: '11px', color: '#22c55e', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                  +₹14,294 (+4.0%)
                </div>
              </div>

              <div style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
                  Unit Net Asset Value
                </div>
                <div style={{ fontSize: '18px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                  ₹104.00
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                  Base: ₹100.00 • 3,591.12 units
                </div>
              </div>

              <div style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
                  Partners & Allocation
                </div>
                <div style={{ fontSize: '18px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                  2 Members
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                  Parul: 50.0% • Milan: 50.0%
                </div>
              </div>
            </div>

            {/* Holdings Sample Table */}
            <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
              <div style={{
                background: 'var(--bg-subtle)',
                padding: '8px 12px',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-muted)',
                display: 'grid',
                gridTemplateColumns: '1fr 2fr 1fr 1fr 1fr',
                gap: '8px',
                borderBottom: '1px solid var(--border-subtle)',
              }}>
                <span>TICKER</span>
                <span>ASSET NAME</span>
                <span>UNITS</span>
                <span>INVESTED</span>
                <span>MARKET VAL</span>
              </div>
              <div style={{
                padding: '8px 12px',
                fontSize: '12px',
                display: 'grid',
                gridTemplateColumns: '1fr 2fr 1fr 1fr 1fr',
                gap: '8px',
                borderBottom: '1px solid var(--border-subtle)',
                fontFamily: 'var(--font-mono)',
              }}>
                <span style={{ fontWeight: 600 }}>118632</span>
                <span style={{ fontFamily: 'var(--font-sans)' }}>Nippon India Large Cap Fund (Direct Growth)</span>
                <span style={{ color: 'var(--text-muted)' }}>789.230</span>
                <span style={{ color: 'var(--text-muted)' }}>₹76,296</span>
                <span style={{ color: '#22c55e' }}>₹78,412.50</span>
              </div>
              <div style={{
                padding: '8px 12px',
                fontSize: '12px',
                display: 'grid',
                gridTemplateColumns: '1fr 2fr 1fr 1fr 1fr',
                gap: '8px',
                fontFamily: 'var(--font-mono)',
              }}>
                <span style={{ fontWeight: 600 }}>122639</span>
                <span style={{ fontFamily: 'var(--font-sans)' }}>Parag Parikh Flexi Cap Fund (Direct Growth)</span>
                <span style={{ color: 'var(--text-muted)' }}>1,124.500</span>
                <span style={{ color: 'var(--text-muted)' }}>₹74,396</span>
                <span style={{ color: '#22c55e' }}>₹85,670.58</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Core Problem & Mathematical Solution */}
      <section id="how-it-works" style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '64px 24px',
        borderTop: '1px solid var(--border-subtle)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
            Mathematical Proof
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: 600, letterSpacing: '-0.02em', margin: 0 }}>
            Why Simple Percentages Fail & Unitized NAV Wins
          </h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px',
        }}>
          {/* Card 1: The Broken Way */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '28px',
          }}>
            <div style={{ display: 'inline-block', padding: '3px 8px', borderRadius: 'var(--radius-xs)', background: 'var(--loss-subtle)', color: 'var(--loss)', fontSize: '11px', fontFamily: 'var(--font-mono)', marginBottom: '14px' }}>
              ❌ THE FLAWED APPROACH (RAW PERCENTAGES)
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>
              Capital Dilution & Unfair Loss Exposure
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
              Partner A deposits ₹1,00,000. It doubles to ₹2,00,000 (+100%). Partner B joins later with ₹1,00,000. Total pool is ₹3,00,000.
            </p>
            <div style={{ background: 'var(--bg-subtle)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              If split 2:1, any subsequent market correction unfairly erodes Partner A's historical gains or exposes Partner B to legacy losses they never took part in.
            </div>
          </div>

          {/* Card 2: The SyndicateOS Way */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '28px',
          }}>
            <div style={{ display: 'inline-block', padding: '3px 8px', borderRadius: 'var(--radius-xs)', background: 'var(--profit-subtle)', color: 'var(--profit)', fontSize: '11px', fontFamily: 'var(--font-mono)', marginBottom: '14px' }}>
              ✓ THE SYNDICATE_OS WAY (UNITIZED NAV)
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>
              Hedge-Fund Grade Mark-to-Market Units
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
              Partner A buys 1,000 units @ ₹100. When valuation reaches ₹2,00,000, NAV rises to ₹200. Partner B deposits ₹1,00,000 and buys 500 units @ ₹200.
            </p>
            <div style={{ background: 'var(--bg-subtle)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--profit)' }}>
              Total units = 1,500. Partner A owns 66.7% (₹2L value), Partner B owns 33.3% (₹1L value). Zero dilution. 100% mathematical fairness.
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '64px 24px',
        borderTop: '1px solid var(--border-subtle)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
            System Architecture
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: 600, letterSpacing: '-0.02em', margin: 0 }}>
            Built for True Financial Clarity
          </h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '20px',
        }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '24px' }}>
            <div style={{ fontSize: '20px', marginBottom: '12px' }}>⚡</div>
            <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '8px' }}>Official AMFI Feed</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Live autocomplete suggestions and official end-of-day closing NAVs from all Indian Mutual Funds via AMFI. 100% free and unlimited.
            </p>
          </div>

          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '24px' }}>
            <div style={{ fontSize: '20px', marginBottom: '12px' }}>📄</div>
            <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '8px' }}>Audit Statements</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Printable capital account statements for partners, transaction ledgers, and one-click WhatsApp/Telegram distribution summaries.
            </p>
          </div>

          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '24px' }}>
            <div style={{ fontSize: '20px', marginBottom: '12px' }}>🔒</div>
            <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '8px' }}>Solo vs Syndicate Isolation</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Track private salaries and solo emergency FDs separately so personal finances are never co-mingled with pooled syndicate investments.
            </p>
          </div>

          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '24px' }}>
            <div style={{ fontSize: '20px', marginBottom: '12px' }}>☁️</div>
            <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '8px' }}>Supabase PostgreSQL</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Real-time multi-device cloud synchronization, encrypted authentication, and instant failover to local offline storage.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action Footer Section */}
      <section style={{
        maxWidth: '960px',
        margin: '0 auto 64px auto',
        padding: '54px 24px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        textAlign: 'center',
      }}>
        <h2 style={{ fontSize: '28px', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: '12px' }}>
          Take Command of Your Co-Invested Wealth.
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '540px', margin: '0 auto 28px auto', lineHeight: 1.6 }}>
          Join your partner or friends on an institutional ledger with live mutual fund sync and automated unit accounting.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={onLaunchTerminal}
            className="btn btn-primary"
            style={{ padding: '10px 24px', fontSize: '14px' }}
          >
            {isAuthenticated ? 'Open Syndicate Terminal →' : 'Launch Terminal (Sign In) →'}
          </button>
          <button
            type="button"
            onClick={onGuestAccess}
            className="btn btn-secondary"
            style={{ padding: '10px 20px', fontSize: '14px' }}
          >
            Explore Live Demo ⚡
          </button>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-subtle)',
        padding: '24px',
        textAlign: 'center',
        fontSize: '12px',
        color: 'var(--text-muted)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '10px' }}>
          <span>SyndicateOS Open Architecture</span>
          <span>•</span>
          <a 
            href="https://github.com/MilanisBored/SyndicateOS" 
            target="_blank" 
            rel="noreferrer" 
            style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}
          >
            GitHub Repository
          </a>
          <span>•</span>
          <span>MIT License</span>
        </div>
        <div>
          Engineered for mathematical equity and complete capital transparency.
        </div>
      </footer>
    </div>
  );
}

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
        backgroundColor: 'rgba(9, 9, 11, 0.85)',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <div style={{
          maxWidth: '1100px',
          margin: '0 auto',
          padding: '14px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '9px',
              height: '9px',
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
            <span style={{
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: 'var(--radius-xs)',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              color: '#22c55e',
              fontFamily: 'var(--font-mono)',
            }}>
              ● Free Live Prices
            </span>
          </div>

          {/* Quick Header Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={toggleTheme}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '11px', padding: '4px 8px' }}
              title="Toggle light or dark theme"
            >
              {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
            </button>

            <button
              type="button"
              onClick={onGuestAccess}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '12px', padding: '5px 12px' }}
            >
              Try Demo ⚡
            </button>

            <button
              type="button"
              onClick={onLaunchTerminal}
              className="btn btn-primary btn-sm"
              style={{ fontSize: '12px', fontWeight: 500, padding: '5px 14px' }}
            >
              {isAuthenticated ? 'Open App →' : 'Sign In →'}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '64px 24px 40px 24px',
        textAlign: 'center',
      }}>
        {/* Pill Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '20px',
          padding: '5px 14px',
          fontSize: '12px',
          color: 'var(--text-secondary)',
          marginBottom: '24px',
        }}>
          <span>✨</span>
          <span>The smarter way to invest with someone else</span>
        </div>

        {/* 3-Word Punchy Headline */}
        <h1 style={{
          fontSize: 'clamp(36px, 6vw, 56px)',
          fontWeight: 700,
          letterSpacing: '-0.035em',
          lineHeight: 1.15,
          margin: '0 auto 20px auto',
          color: 'var(--text-primary)',
        }}>
          Invest Together Fairly.
        </h1>

        {/* Friendly Subtitle */}
        <p style={{
          fontSize: 'clamp(15px, 2vw, 18px)',
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          maxWidth: '620px',
          margin: '0 auto 32px auto',
        }}>
          The simple tracker for couples and friends who pool money. See who owns what down to the rupee, get automatic daily mutual fund updates, and keep personal savings completely separate.
        </p>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          alignItems: 'center',
          flexWrap: 'wrap',
          marginBottom: '28px',
        }}>
          <button
            type="button"
            onClick={onLaunchTerminal}
            className="btn btn-primary"
            style={{
              padding: '10px 26px',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            {isAuthenticated ? 'Open SyndicateOS Dashboard →' : 'Get Started Free →'}
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

        {/* Reassuring Micro Pills */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '20px',
          flexWrap: 'wrap',
          fontSize: '12px',
          color: 'var(--text-muted)',
          marginBottom: '50px',
        }}>
          <span>✓ No messy spreadsheets</span>
          <span>✓ Free daily AMFI price updates</span>
          <span>✓ 100% private & secure</span>
        </div>

        {/* Interactive App Visual Preview Card */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          boxShadow: '0 20px 48px rgba(0, 0, 0, 0.5)',
          textAlign: 'left',
          maxWidth: '850px',
          margin: '0 auto',
        }}>
          {/* Mock Top bar */}
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
              Syndicate Pool • Milan & Parul
            </span>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#22c55e' }}>
              ● Live Today
            </span>
          </div>

          {/* Visual Inner Metrics */}
          <div style={{ padding: '24px' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '14px',
              marginBottom: '20px',
            }}>
              {/* Joint Total */}
              <div style={{
                background: 'var(--bg-input)',
                padding: '16px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
              }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Total Joint Investments
                </div>
                <div style={{ fontSize: '24px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                  ₹3,73,476.48
                </div>
                <div style={{ fontSize: '12px', color: '#22c55e', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                  +₹14,294.35 Profit (+4.0%)
                </div>
              </div>

              {/* Partner 1 */}
              <div style={{
                background: 'var(--bg-input)',
                padding: '16px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Parul's Share</span>
                  <span style={{ fontSize: '11px', background: 'var(--bg-subtle)', padding: '2px 6px', borderRadius: '3px', color: 'var(--text-primary)' }}>50.0%</span>
                </div>
                <div style={{ fontSize: '20px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                  ₹1,86,738.24
                </div>
                <div style={{ fontSize: '11px', color: '#22c55e', marginTop: '4px' }}>
                  +₹7,147 net profit
                </div>
              </div>

              {/* Partner 2 */}
              <div style={{
                background: 'var(--bg-input)',
                padding: '16px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Milan's Share</span>
                  <span style={{ fontSize: '11px', background: 'var(--bg-subtle)', padding: '2px 6px', borderRadius: '3px', color: 'var(--text-primary)' }}>50.0%</span>
                </div>
                <div style={{ fontSize: '20px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                  ₹1,86,738.24
                </div>
                <div style={{ fontSize: '11px', color: '#22c55e', marginTop: '4px' }}>
                  +₹7,147 net profit
                </div>
              </div>
            </div>

            {/* Live Funds Preview Table */}
            <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
              <div style={{
                background: 'var(--bg-subtle)',
                padding: '8px 14px',
                fontSize: '11px',
                color: 'var(--text-muted)',
                display: 'flex',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--border-subtle)',
              }}>
                <span>INVESTMENT (MUTUAL FUND)</span>
                <span>UNITS</span>
                <span>VALUE TODAY</span>
              </div>
              <div style={{
                padding: '10px 14px',
                fontSize: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid var(--border-subtle)',
              }}>
                <div>
                  <div style={{ fontWeight: 500 }}>Nippon India Large Cap Fund</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Direct Growth • AMFI #118632</div>
                </div>
                <span className="mono text-muted">789.230</span>
                <span className="mono" style={{ color: '#22c55e', fontWeight: 500 }}>₹73,894.20</span>
              </div>
              <div style={{
                padding: '10px 14px',
                fontSize: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontWeight: 500 }}>Axis Nifty Smallcap 50 Index Fund</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Direct Growth • Live Synced</div>
                </div>
                <span className="mono text-muted">1,420.550</span>
                <span className="mono" style={{ color: '#22c55e', fontWeight: 500 }}>₹85,670.58</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works in 3 Easy Steps */}
      <section style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '60px 24px',
        borderTop: '1px solid var(--border-subtle)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
            Simple 3-Step Process
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: 600, letterSpacing: '-0.02em', margin: 0 }}>
            How Investing Together Works
          </h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
        }}>
          {/* Step 1 */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '24px',
          }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 600,
              marginBottom: '14px',
            }}>
              1
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
              Add Money When You Invest
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Whenever either of you adds money (like a monthly ₹5,000 SIP), log it with 1 click. You don't have to put in equal amounts or on the same day.
            </p>
          </div>

          {/* Step 2 */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '24px',
          }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 600,
              marginBottom: '14px',
            }}>
              2
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
              Automatic Daily Price Updates
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              The app automatically pulls official daily mutual fund prices from AMFI. Your current wealth and profit update by themselves every evening.
            </p>
          </div>

          {/* Step 3 */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '24px',
          }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 600,
              marginBottom: '14px',
            }}>
              3
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
              Withdraw Anytime With Zero Confusion
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              If anyone needs money back, the app calculates their exact fair share. Past profits are never diluted, and everyone leaves happy.
            </p>
          </div>
        </div>
      </section>

      {/* Everything You Get (The 6 Features in Simple Words) */}
      <section style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '60px 24px',
        borderTop: '1px solid var(--border-subtle)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
            Built For Real Life
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: 600, letterSpacing: '-0.02em', margin: 0 }}>
            Everything You Need to Track Money Together
          </h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '16px',
        }}>
          {/* Feature 1 */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
            <div style={{ fontSize: '20px', marginBottom: '10px' }}>📈</div>
            <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>Automatic Live Mutual Fund Prices</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Type any fund name (Nippon, HDFC, Parag Parikh, Quant) to get instant suggestions and official daily NAV closing prices. 100% free with zero API keys.
            </p>
          </div>

          {/* Feature 2 */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
            <div style={{ fontSize: '20px', marginBottom: '10px' }}>🍰</div>
            <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>Fair Shares (Units Math)</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Just like mutual funds or hedge funds: when you deposit, you get units. When profits rise, your units become worth more. Completely fair even if one person joins later.
            </p>
          </div>

          {/* Feature 3 */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
            <div style={{ fontSize: '20px', marginBottom: '10px' }}>🔒</div>
            <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>Personal Money Stays Separate</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Track your private monthly salary, freelance income, and solo emergency FDs in a dedicated "Personal" tab that never mixes with the shared pool.
            </p>
          </div>

          {/* Feature 4 */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
            <div style={{ fontSize: '20px', marginBottom: '10px' }}>📄</div>
            <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>1-Click WhatsApp & PDF Statements</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Generate beautiful, transparent monthly statement slips. Send a quick summary straight to your partner via WhatsApp with a single click.
            </p>
          </div>

          {/* Feature 5 */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
            <div style={{ fontSize: '20px', marginBottom: '10px' }}>☁️</div>
            <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>Synced Across All Devices</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Sign in with Google or Email on your phone, tablet, or laptop. Powered by an encrypted cloud database so your data is always backed up and ready.
            </p>
          </div>

          {/* Feature 6 */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
            <div style={{ fontSize: '20px', marginBottom: '10px' }}>💰</div>
            <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>Track All Asset Types</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Not just mutual funds: track stocks, fixed deposits (FDs), gold, crypto, and emergency cash reserves all together in one clean portfolio.
            </p>
          </div>
        </div>
      </section>

      {/* Comparison: Spreadsheets vs SyndicateOS */}
      <section style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '60px 24px',
        borderTop: '1px solid var(--border-subtle)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '26px', fontWeight: 600, letterSpacing: '-0.02em', margin: 0 }}>
            Why Not Just Use Excel or Google Sheets?
          </h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '16px',
        }}>
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '24px',
          }}>
            <div style={{ color: 'var(--loss)', fontWeight: 600, fontSize: '13px', marginBottom: '10px' }}>
              ❌ Traditional Spreadsheets
            </div>
            <ul style={{ fontSize: '13px', color: 'var(--text-secondary)', paddingLeft: '18px', margin: 0, lineHeight: 1.8 }}>
              <li>Broken formulas when someone adds or takes out money</li>
              <li>Manually looking up mutual fund prices every week</li>
              <li>Arguments over who gets how much profit when withdrawing</li>
              <li>Hard to use on mobile phones</li>
            </ul>
          </div>

          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--profit)',
            borderRadius: 'var(--radius-md)',
            padding: '24px',
          }}>
            <div style={{ color: 'var(--profit)', fontWeight: 600, fontSize: '13px', marginBottom: '10px' }}>
              ✓ SyndicateOS
            </div>
            <ul style={{ fontSize: '13px', color: 'var(--text-secondary)', paddingLeft: '18px', margin: 0, lineHeight: 1.8 }}>
              <li>Automatic unit accounting that calculates exact fair shares</li>
              <li>Automatic official AMFI daily closing prices with 1 click</li>
              <li>Crystal-clear profit statements with zero disputes</li>
              <li>Clean, beautiful, and encrypted on any device</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section style={{
        maxWidth: '850px',
        margin: '0 auto 60px auto',
        padding: '48px 24px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        textAlign: 'center',
      }}>
        <h2 style={{ fontSize: '28px', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: '12px' }}>
          Ready to Invest Together With 100% Peace of Mind?
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto 28px auto', lineHeight: 1.6 }}>
          Set up your pool in 60 seconds. Sign in with Google or Email and track your wealth together today.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={onLaunchTerminal}
            className="btn btn-primary"
            style={{ padding: '10px 24px', fontSize: '14px' }}
          >
            {isAuthenticated ? 'Open SyndicateOS Dashboard →' : 'Sign In / Register Free →'}
          </button>
          <button
            type="button"
            onClick={onGuestAccess}
            className="btn btn-secondary"
            style={{ padding: '10px 20px', fontSize: '14px' }}
          >
            Try Demo Mode ⚡
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-subtle)',
        padding: '24px',
        textAlign: 'center',
        fontSize: '12px',
        color: 'var(--text-muted)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '8px' }}>
          <span>SyndicateOS</span>
          <span>•</span>
          <a
            href="https://github.com/MilanisBored/SyndicateOS"
            target="_blank"
            rel="noreferrer"
            style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}
          >
            GitHub
          </a>
          <span>•</span>
          <span>MIT License</span>
        </div>
        <div>
          Built for couples, partners, and friends to grow their money together fairly.
        </div>
      </footer>
    </div>
  );
}

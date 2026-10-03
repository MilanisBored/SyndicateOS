import React, { useState } from 'react';

export default function LandingPage({ 
  onLaunchTerminal, 
  onGuestAccess, 
  theme, 
  toggleTheme, 
  isAuthenticated 
}) {
  const [activeTab, setActiveTab] = useState('portfolio'); // 'portfolio' | 'math' | 'whatsapp'
  const [hoveredCard, setHoveredCard] = useState(null);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      background: theme === 'dark' 
        ? 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(34, 197, 94, 0.12), transparent 70%), var(--bg-app)'
        : 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(34, 197, 94, 0.08), transparent 70%), var(--bg-app)',
      color: 'var(--text-primary)',
      fontFamily: 'var(--font-sans)',
      padding: '16px 24px',
      boxSizing: 'border-box',
    }}>
      {/* 1. Sleek Navigation Header */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        maxWidth: '1240px',
        margin: '0 auto',
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '9px',
            height: '9px',
            borderRadius: '50%',
            backgroundColor: '#22c55e',
            boxShadow: '0 0 10px rgba(34, 197, 94, 0.6)',
          }} />
          <span style={{
            fontSize: '16px',
            fontWeight: 700,
            letterSpacing: '-0.03em',
          }}>
            SyndicateOS
          </span>
          <span style={{
            fontSize: '10px',
            padding: '2px 8px',
            borderRadius: '12px',
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.25)',
            color: '#22c55e',
            fontFamily: 'var(--font-mono)',
            fontWeight: 500,
          }}>
            ● Live AMFI Feed
          </span>
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={toggleTheme}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '11px', padding: '5px 9px', borderRadius: '6px' }}
            title="Toggle theme"
          >
            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
          </button>

          <a
            href="https://github.com/MilanisBored/SyndicateOS"
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '11px', textDecoration: 'none', color: 'inherit', borderRadius: '6px' }}
          >
            GitHub ↗
          </a>

          <button
            type="button"
            onClick={onGuestAccess}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '12px', borderRadius: '6px' }}
          >
            Try Demo ⚡
          </button>

          <button
            type="button"
            onClick={onLaunchTerminal}
            className="btn btn-primary btn-sm"
            style={{ fontSize: '12px', fontWeight: 600, borderRadius: '6px', padding: '6px 14px' }}
          >
            {isAuthenticated ? 'Open Dashboard →' : 'Sign In →'}
          </button>
        </div>
      </header>

      {/* 2. Hero Headline Area (3-Word Mandate + Plain English Subtitle) */}
      <div style={{
        maxWidth: '820px',
        margin: '12px auto 14px auto',
        textAlign: 'center',
        width: '100%',
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '20px',
          padding: '4px 12px',
          fontSize: '11px',
          color: 'var(--text-secondary)',
          marginBottom: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}>
          <span style={{ color: '#22c55e' }}>●</span>
          <span>The transparent, fair money tracker for couples & co-investors</span>
        </div>

        <h1 style={{
          fontSize: 'clamp(28px, 4vw, 42px)',
          fontWeight: 800,
          letterSpacing: '-0.04em',
          lineHeight: 1.12,
          margin: '0 0 8px 0',
          color: 'var(--text-primary)',
        }}>
          Invest Together Fairly.
        </h1>

        <p style={{
          fontSize: '13.5px',
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
          maxWidth: '600px',
          margin: '0 auto',
        }}>
          Pool money with your partner or friend without messy spreadsheets. Track live mutual fund profits, own exact fair shares, and keep your personal savings private.
        </p>
      </div>

      {/* 3. Comprehensive Bento Grid: Product Explained In One Screen */}
      <div style={{
        maxWidth: '1240px',
        width: '100%',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gap: '12px',
      }}>
        {/* Main Interactive Showcase Card (Takes 6 of 12 columns) */}
        <div style={{
          gridColumn: 'span 6',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '10px',
          padding: '16px 18px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
        }}>
          <div>
            {/* Top Interactive Tabs */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: '8px',
            }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('portfolio')}
                  style={{
                    background: activeTab === 'portfolio' ? 'var(--bg-subtle)' : 'transparent',
                    border: activeTab === 'portfolio' ? '1px solid var(--border-subtle)' : '1px solid transparent',
                    color: activeTab === 'portfolio' ? 'var(--text-primary)' : 'var(--text-muted)',
                    fontSize: '11px',
                    fontWeight: 500,
                    padding: '4px 8px',
                    borderRadius: '5px',
                    cursor: 'pointer',
                  }}
                >
                  Live Portfolio
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('math')}
                  style={{
                    background: activeTab === 'math' ? 'var(--bg-subtle)' : 'transparent',
                    border: activeTab === 'math' ? '1px solid var(--border-subtle)' : '1px solid transparent',
                    color: activeTab === 'math' ? 'var(--text-primary)' : 'var(--text-muted)',
                    fontSize: '11px',
                    fontWeight: 500,
                    padding: '4px 8px',
                    borderRadius: '5px',
                    cursor: 'pointer',
                  }}
                >
                  How Fair Math Works
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('whatsapp')}
                  style={{
                    background: activeTab === 'whatsapp' ? 'var(--bg-subtle)' : 'transparent',
                    border: activeTab === 'whatsapp' ? '1px solid var(--border-subtle)' : '1px solid transparent',
                    color: activeTab === 'whatsapp' ? 'var(--text-primary)' : 'var(--text-muted)',
                    fontSize: '11px',
                    fontWeight: 500,
                    padding: '4px 8px',
                    borderRadius: '5px',
                    cursor: 'pointer',
                  }}
                >
                  WhatsApp Report
                </button>
              </div>

              <span style={{ fontSize: '10px', color: '#22c55e', fontFamily: 'var(--font-mono)' }}>
                ● Real-Time
              </span>
            </div>

            {/* TAB 1: Live Joint Portfolio View */}
            {activeTab === 'portfolio' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                    ₹3,73,476.48
                  </span>
                  <span style={{ fontSize: '12px', color: '#22c55e', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                    +₹14,294 (+4.0%)
                  </span>
                </div>

                {/* Partner Split Badges */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                  <div style={{
                    background: 'var(--bg-input)',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                      <span>Parul's Share</span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>50.0%</span>
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 600, fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                      ₹1,86,738
                    </div>
                    <div style={{ fontSize: '10px', color: '#22c55e', marginTop: '1px' }}>+₹7,147 profit</div>
                  </div>

                  <div style={{
                    background: 'var(--bg-input)',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                      <span>Milan's Share</span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>50.0%</span>
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 600, fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                      ₹1,86,738
                    </div>
                    <div style={{ fontSize: '10px', color: '#22c55e', marginTop: '1px' }}>+₹7,147 profit</div>
                  </div>
                </div>

                {/* Holdings Micro-Table */}
                <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '6px', overflow: 'hidden', fontSize: '11px' }}>
                  <div style={{ padding: '5px 10px', background: 'var(--bg-subtle)', display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '10px', textTransform: 'uppercase' }}>
                    <span>Holding (Official AMFI Daily NAV)</span>
                    <span>Current Value</span>
                  </div>
                  <div style={{ padding: '6px 10px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span>Nippon India Large Cap (789.2 units)</span>
                    <span className="mono" style={{ color: '#22c55e', fontWeight: 500 }}>₹73,894.20</span>
                  </div>
                  <div style={{ padding: '6px 10px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Axis Nifty Smallcap 50 (1,420.5 units)</span>
                    <span className="mono" style={{ color: '#22c55e', fontWeight: 500 }}>₹85,670.58</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: How Fair Math Works (Units Explained In Simple Plain English) */}
            {activeTab === 'math' && (
              <div style={{ fontSize: '12px', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                <div style={{
                  background: 'var(--bg-input)',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-subtle)',
                  marginBottom: '10px',
                }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    🍰 Think of it like buying slices of a growing cake
                  </div>
                  <p style={{ margin: 0, fontSize: '11px' }}>
                    When you add money, you buy "slices" (units) at today's real valuation. If the fund has grown 20%, your partner's past gains stay 100% protected. Neither person ever loses out!
                  </p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', textAlign: 'center' }}>
                  <div style={{ background: 'var(--bg-subtle)', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Step 1</div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>Deposit Anytime</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>Any amount, big or small</div>
                  </div>
                  <div style={{ background: 'var(--bg-subtle)', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Step 2</div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>Units Auto-Issued</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>At today's exact unit NAV</div>
                  </div>
                  <div style={{ background: 'var(--bg-subtle)', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Step 3</div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>Zero Arguments</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>Math is 100% audited & fair</div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: WhatsApp Report Preview */}
            {activeTab === 'whatsapp' && (
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                <div style={{
                  background: 'rgba(34, 197, 94, 0.05)',
                  border: '1px solid rgba(34, 197, 94, 0.2)',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  color: 'var(--text-primary)',
                  lineHeight: 1.6,
                }}>
                  <div style={{ fontWeight: 600, color: '#22c55e', marginBottom: '4px' }}>
                    📱 One-Tap WhatsApp Message Format:
                  </div>
                  <div>📊 <b>SyndicateOS Monthly Portfolio Update</b></div>
                  <div>• Total Joint Wealth: ₹3,73,476 (+₹14,294 profit)</div>
                  <div>• Parul: ₹1,86,738 (50.0%) | Milan: ₹1,86,738 (50.0%)</div>
                  <div>• Top Fund: Nippon Large Cap (+12.4% return)</div>
                  <div style={{ marginTop: '4px', color: 'var(--text-muted)' }}>
                    Sent automatically with 1 click. No formatting needed!
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Card Footer */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '10px',
            marginTop: '12px',
            fontSize: '11px',
            color: 'var(--text-muted)',
          }}>
            <span>🔒 Bank-grade encrypted database via Supabase</span>
            <button
              type="button"
              onClick={onGuestAccess}
              style={{
                background: 'none',
                border: 'none',
                color: '#22c55e',
                cursor: 'pointer',
                fontWeight: 600,
                padding: 0,
                fontSize: '11px',
              }}
            >
              Interactive Demo ⚡
            </button>
          </div>
        </div>

        {/* 6 Feature Blocks (Right 6 Columns in a 2x3 Grid) */}
        <div style={{
          gridColumn: 'span 6',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
        }}>
          {/* Feature 1: Fair Slices (Units Math) */}
          <div 
            onMouseEnter={() => setHoveredCard(1)}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              background: 'var(--bg-surface)',
              border: hoveredCard === 1 ? '1px solid #22c55e' : '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '12px 14px',
              transition: 'border-color 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <span style={{ fontSize: '15px' }}>🍰</span>
              <span style={{ fontSize: '12px', fontWeight: 600 }}>Fair Shares (Units Math)</span>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
              Deposit anytime. New money gets units at today's value so earlier profits are never diluted.
            </p>
          </div>

          {/* Feature 2: Free Live AMFI Prices */}
          <div 
            onMouseEnter={() => setHoveredCard(2)}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              background: 'var(--bg-surface)',
              border: hoveredCard === 2 ? '1px solid #22c55e' : '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '12px 14px',
              transition: 'border-color 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <span style={{ fontSize: '15px' }}>📈</span>
              <span style={{ fontSize: '12px', fontWeight: 600 }}>Auto Live Fund Prices</span>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
              44,000+ mutual funds (Nippon, HDFC, Parag Parikh) update daily for free directly from AMFI.
            </p>
          </div>

          {/* Feature 3: Personal Money Stays Separate */}
          <div 
            onMouseEnter={() => setHoveredCard(3)}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              background: 'var(--bg-surface)',
              border: hoveredCard === 3 ? '1px solid #22c55e' : '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '12px 14px',
              transition: 'border-color 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <span style={{ fontSize: '15px' }}>🔒</span>
              <span style={{ fontSize: '12px', fontWeight: 600 }}>Keep Personal Money Safe</span>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
              A dedicated private tab for your personal salary, solo emergency FDs, and individual stocks.
            </p>
          </div>

          {/* Feature 4: 1-Click WhatsApp Reports */}
          <div 
            onMouseEnter={() => setHoveredCard(4)}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              background: 'var(--bg-surface)',
              border: hoveredCard === 4 ? '1px solid #22c55e' : '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '12px 14px',
              transition: 'border-color 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <span style={{ fontSize: '15px' }}>💬</span>
              <span style={{ fontSize: '12px', fontWeight: 600 }}>1-Click WhatsApp Updates</span>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
              Send clean, transparent monthly summaries to your partner on WhatsApp or download PDFs.
            </p>
          </div>

          {/* Feature 5: All Assets (Stocks, FDs, Gold) */}
          <div 
            onMouseEnter={() => setHoveredCard(5)}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              background: 'var(--bg-surface)',
              border: hoveredCard === 5 ? '1px solid #22c55e' : '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '12px 14px',
              transition: 'border-color 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <span style={{ fontSize: '15px' }}>🪙</span>
              <span style={{ fontSize: '12px', fontWeight: 600 }}>Mutual Funds, FDs & Gold</span>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
              Track everything you own together in one clean place without jumping between 5 bank apps.
            </p>
          </div>

          {/* Feature 6: Fast Google Login & Cloud Sync */}
          <div 
            onMouseEnter={() => setHoveredCard(6)}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              background: 'var(--bg-surface)',
              border: hoveredCard === 6 ? '1px solid #22c55e' : '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '12px 14px',
              transition: 'border-color 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <span style={{ fontSize: '15px' }}>⚡</span>
              <span style={{ fontSize: '12px', fontWeight: 600 }}>1-Click Google Sign-In</span>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
              Instant login on your phone, tablet, or laptop. Cloud-synced so both partners stay updated.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Bottom Compact Action Footer */}
      <footer style={{
        width: '100%',
        maxWidth: '1240px',
        margin: '12px auto 0 auto',
        paddingTop: '10px',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '11px',
        color: 'var(--text-muted)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>SyndicateOS</span>
          <span>•</span>
          <span>Simple, fair wealth tracking for couples and partners</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={onGuestAccess}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: '11px',
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: 0,
            }}
          >
            Launch Guest Demo Mode ⚡
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={onLaunchTerminal}
            style={{
              background: 'none',
              border: 'none',
              color: '#22c55e',
              fontSize: '11px',
              cursor: 'pointer',
              fontWeight: 600,
              padding: 0,
            }}
          >
            Sign In with Google / Email →
          </button>
          <span>•</span>
          <a
            href="https://github.com/MilanisBored/SyndicateOS"
            target="_blank"
            rel="noreferrer"
            style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}
          >
            GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}

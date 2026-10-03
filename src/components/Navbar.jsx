import React from 'react';
import { CURRENCIES } from '../utils/navEngine';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  fundInfo, 
  currency, 
  setCurrency, 
  theme, 
  toggleTheme, 
  onOpenTransactionModal,
  isCloudConnected,
  isLoadingCloud,
  onRefreshCloud,
  currentUser,
  onSignOut,
  isGuest,
  onOpenLanding,
  availableFunds = [],
  onSwitchFund
}) {
  const tabs = [
    { id: 'dashboard', label: 'Overview' },
    { id: 'syndicate', label: 'Syndicate Pool' },
    { id: 'holdings', label: 'Holdings' },
    { id: 'personal', label: 'Personal & Solo' },
    { id: 'statements', label: 'Statements' },
    { id: 'settings', label: 'Settings & DB' },
  ];

  const brandTitle = fundInfo?.name?.trim() || 'SyndicateOS';
  const userDisplay = isGuest 
    ? 'Guest' 
    : (currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || 'User');

  return (
    <header className="topbar">
      {/* Upper Bar: Brand & Action Controls */}
      <div className="topbar-main">
        <div className="topbar-main-inner">
          {/* Brand & Pool Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="brand" onClick={() => setActiveTab('dashboard')} title="Back to Overview">
              <div className="brand-dot" />
              <span className="brand-name">{brandTitle}</span>
            </div>

            {availableFunds && availableFunds.length > 1 && (
              <select
                value={fundInfo?.id || ''}
                onChange={(e) => onSwitchFund && onSwitchFund(e.target.value)}
                className="currency-select-minimal mono"
                title="Switch Syndicate Pool"
                style={{ fontSize: '11px', maxWidth: '160px' }}
              >
                {availableFunds.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name || 'Syndicate Pool'}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Right Action Tools */}
          <div className="topbar-actions">
            {/* Supabase Status */}
            {isCloudConnected ? (
              <button 
                type="button" 
                className="badge badge-profit mono topbar-badge"
                onClick={onRefreshCloud}
                title="Connected to Supabase PostgreSQL (Click to refresh)"
              >
                <span className="status-dot-pulse">●</span>
                <span className="badge-text">{isLoadingCloud ? 'Syncing...' : 'Supabase Live'}</span>
              </button>
            ) : (
              <button
                type="button"
                className="badge badge-neutral mono topbar-badge"
                onClick={() => setActiveTab('settings')}
                title="Using Local Storage (Click to connect Supabase)"
              >
                ○ Local DB
              </button>
            )}

            {/* Currency Select */}
            <select 
              value={currency} 
              onChange={(e) => setCurrency(e.target.value)}
              className="currency-select-minimal mono"
              title="Display Currency"
            >
              {Object.keys(CURRENCIES).map((cKey) => (
                <option key={cKey} value={cKey}>
                  {cKey} ({CURRENCIES[cKey].symbol})
                </option>
              ))}
            </select>

            {/* Theme Toggle */}
            <button 
              type="button" 
              className="btn btn-secondary btn-sm theme-btn" 
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            {/* Primary Action Button */}
            <button 
              type="button" 
              className="btn btn-primary btn-sm topbar-cta-btn"
              onClick={onOpenTransactionModal}
            >
              + Transaction
            </button>

            {/* User Session & Lock */}
            {onSignOut && (
              <div className="user-auth-cluster">
                <span 
                  className="badge badge-neutral mono user-chip"
                  title={currentUser?.email || (isGuest ? 'Guest Mode' : 'Authenticated')}
                >
                  {userDisplay}
                </span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm lock-btn"
                  onClick={onSignOut}
                  title="Lock Terminal / Sign Out"
                >
                  🔒
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lower Bar: Clean Horizontal Navigation Tabs */}
      <div className="topbar-nav">
        <div className="topbar-nav-inner">
          <nav className="nav-tabs-scroll">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`nav-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              >
                {tab.label}
              </button>
            ))}
            {onOpenLanding && (
              <button
                type="button"
                onClick={onOpenLanding}
                className="nav-tab-btn nav-tab-about"
                title="View SyndicateOS Landing Page"
              >
                About ↗
              </button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}

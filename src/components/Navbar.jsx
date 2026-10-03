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
  onOpenStatementModal,
  onOpenActionCenter,
  pendingActionCount = 0,
  disputedCount = 0,
  onCreateFund,
  perspective = 'manager',
  onTogglePerspective,
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

  const isInvestorView = perspective === 'investor' || fundInfo?.userRole === 'investor';
  const isActualManager = fundInfo?.isOwner || fundInfo?.userRole === 'manager';

  const managedFunds = availableFunds.filter(f => f.role === 'manager' || f.isOwner);
  const investedFunds = availableFunds.filter(f => f.role === 'investor' && !f.isOwner);

  return (
    <header className="topbar">
      {/* Upper Bar: Brand & Action Controls */}
      <div className="topbar-main">
        <div className="topbar-main-inner">
          {/* Left Cluster: Brand & Pool Switcher */}
          <div className="topbar-left">
            <div className="brand" onClick={() => setActiveTab('dashboard')} title="Back to Overview">
              <div className="brand-dot" />
              <span className="brand-name">{brandTitle}</span>
            </div>

            <div className="topbar-pool-cluster">
              {/* Role Badge */}
              <span 
                className={`badge mono font-semibold ${isInvestorView ? 'badge-profit' : 'badge-neutral'}`}
                style={{ fontSize: 10, padding: '2px 7px' }}
                title={isInvestorView ? 'Viewing as Investor in this pool' : 'Viewing as Fund Manager'}
              >
                {isInvestorView ? 'INVESTOR' : 'MANAGER'}
              </span>

              {/* Fund Switcher Dropdown */}
              {(availableFunds.length > 0 || onCreateFund) && (
                <select
                  value={fundInfo?.id || ''}
                  onChange={(e) => {
                    if (e.target.value === '__new_pool__') {
                      onCreateFund && onCreateFund();
                    } else if (onSwitchFund) {
                      onSwitchFund(e.target.value);
                    }
                  }}
                  className="currency-select-minimal mono pool-switcher-select"
                  title="Switch Syndicate Pool"
                >
                  {managedFunds.length > 0 && (
                    <optgroup label="Managed Pools">
                      {managedFunds.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name || 'Syndicate Pool'}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {investedFunds.length > 0 && (
                    <optgroup label="Invested Pools">
                      {investedFunds.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name || 'Syndicate'} ({f.managerName})
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {onCreateFund && (
                    <optgroup label="Actions">
                      <option value="__new_pool__">+ New Pool...</option>
                    </optgroup>
                  )}
                </select>
              )}

              {/* Manager Perspective Preview Toggle */}
              {isActualManager && onTogglePerspective && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm perspective-toggle-btn"
                  onClick={onTogglePerspective}
                  title="Toggle between Manager view and Investor perspective preview"
                >
                  {perspective === 'manager' ? 'Preview Investor' : 'Exit Preview'}
                </button>
              )}
            </div>
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

            {/* Action & Notification Center Key */}
            {onOpenActionCenter && (
              <button
                type="button"
                className={`badge mono topbar-badge ${
                  pendingActionCount > 0 
                    ? 'badge-warning' 
                    : disputedCount > 0 
                    ? 'badge-loss' 
                    : 'badge-neutral'
                }`}
                onClick={onOpenActionCenter}
                title="Action Center: Approvals, Rejections, and Fund Updates"
                style={{ padding: '3px 8px', fontWeight: 600 }}
              >
                <span className="mono">
                  {pendingActionCount > 0 
                    ? `[ACT: ${pendingActionCount}]` 
                    : disputedCount > 0 
                    ? `[DISP: ${disputedCount}]` 
                    : '[ACT: 0]'}
                </span>
              </button>
            )}

            {/* Theme Toggle */}
            <button 
              type="button" 
              className="btn btn-secondary btn-sm theme-btn mono" 
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
              style={{ fontSize: 10, padding: '3px 8px' }}
            >
              {theme === 'dark' ? 'LIGHT' : 'DARK'}
            </button>

            {/* Adaptive Action Button */}
            {isInvestorView ? (
              <button 
                type="button" 
                className="btn btn-primary btn-sm topbar-cta-btn mono"
                onClick={onOpenStatementModal}
                title="View your investor statement of account"
              >
                Statement
              </button>
            ) : (
              <button 
                type="button" 
                className="btn btn-primary btn-sm topbar-cta-btn mono"
                onClick={onOpenTransactionModal}
              >
                + Transaction
              </button>
            )}

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
                  className="btn btn-secondary btn-sm lock-btn mono"
                  onClick={onSignOut}
                  title="Lock Terminal / Sign Out"
                  style={{ fontSize: 10, padding: '3px 7px' }}
                >
                  Lock
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

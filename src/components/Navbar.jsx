import React, { useState, useRef, useEffect } from 'react';
import { CURRENCIES, generateUserCode } from '../utils/navEngine';

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
  availableFunds = [],
  onSwitchFund,
  onOpenPriceSync
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

  const myUserCode = generateUserCode(currentUser?.email || (isGuest ? 'guest@syndicate.internal' : 'user@syndicate.internal'));

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    }
    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  const handleCopyCode = (e) => {
    e.stopPropagation();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(myUserCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } else {
      prompt('Your User Code:', myUserCode);
    }
  };

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
                <span className="badge-text">{isLoadingCloud ? 'SYNCING...' : 'LIVE DB'}</span>
              </button>
            ) : (
              <button
                type="button"
                className="badge badge-neutral mono topbar-badge"
                onClick={() => setActiveTab('settings')}
                title="Using Local Storage (Click to connect Supabase)"
              >
                LOCAL DB
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
              <div className="flex items-center gap-1">
                {onOpenPriceSync && (
                  <button 
                    type="button" 
                    className="btn btn-secondary btn-sm mono"
                    onClick={onOpenPriceSync}
                    title="1-Click Universal Sync: Fetch latest official AMFI NAVs, Stock & Crypto prices"
                    style={{ fontSize: 11, padding: '3px 8px' }}
                  >
                    Sync Prices
                  </button>
                )}
                <button 
                  type="button" 
                  className="btn btn-primary btn-sm topbar-cta-btn mono"
                  onClick={onOpenTransactionModal}
                  style={{ fontSize: 11, padding: '3px 8px' }}
                >
                  + Transaction
                </button>
              </div>
            )}

            {/* User Session: Name Tab with Code Underneath & Dropdown with Lock/SignOut */}
            {onSignOut && (
              <div className="user-menu-wrapper" ref={userMenuRef}>
                <button
                  type="button"
                  className={`user-name-tab mono ${isUserMenuOpen ? 'active' : ''}`}
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  title="Account menu: User Code & Session Options"
                >
                  <span className="user-name-title">{userDisplay}</span>
                </button>

                {isUserMenuOpen && (
                  <div className="user-profile-dropdown mono">
                    <div className="user-dropdown-header">
                      <span className="user-dropdown-name">{userDisplay}</span>
                      <span className="user-dropdown-email">
                        {currentUser?.email || (isGuest ? 'Guest Session' : 'Local Terminal')}
                      </span>
                    </div>

                    {myUserCode && (
                      <div className="user-dropdown-code-box">
                        <div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Your Unique User Code
                        </div>
                        <div className="flex items-center justify-between gap-1">
                          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-primary)' }}>
                            {myUserCode}
                          </span>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: 9, padding: '2px 6px' }}
                            onClick={handleCopyCode}
                            title="Copy User Code to clipboard"
                          >
                            {codeCopied ? 'COPIED' : 'COPY'}
                          </button>
                        </div>
                        <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.3 }}>
                          Share with Fund Manager along with your email to join pools.
                        </div>
                      </div>
                    )}

                    <div className="user-dropdown-actions">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm lock-btn mono w-full"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onSignOut();
                        }}
                        style={{ fontSize: 11, padding: '5px 10px', textAlign: 'center', width: '100%' }}
                        title="Lock Terminal / Sign Out"
                      >
                        Lock Terminal / Sign Out
                      </button>
                    </div>
                  </div>
                )}
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
          </nav>
        </div>
      </div>
    </header>
  );
}

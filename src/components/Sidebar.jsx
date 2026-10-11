import React, { useState, useRef, useEffect } from 'react';
import { CURRENCIES, generateUserCode } from '../utils/navEngine';

export const NAV_SECTIONS = [
  {
    domain: 'PORTFOLIO & TRADING',
    items: [
      { id: 'cockpit', tab: 'dashboard', subTab: 'cockpit', label: 'Cockpit Overview', badge: 'LIVE' },
      { id: 'holdings', tab: 'holdings', subTab: 'positions', label: 'Asset Holdings & Trims', badge: null },
      { id: 'taxlots', tab: 'holdings', subTab: 'taxlots', label: 'Tax Lots (FIFO/LIFO)', badge: null },
      { id: 'treasury', tab: 'holdings', subTab: 'treasury', label: 'Treasury & Cash Pool', badge: null },
      { id: 'exposures', tab: 'holdings', subTab: 'exposures', label: 'Attribution & Risk', badge: null },
    ]
  },
  {
    domain: 'CAPITAL & PARTNERS',
    items: [
      { id: 'captable', tab: 'syndicate', subTab: 'captable', label: 'Cap Table & Partners', badge: 'UNITIZED' },
      { id: 'ledger', tab: 'syndicate', subTab: 'ledger', label: 'Syndicate Ledger', badge: null },
    ]
  },
  {
    domain: 'INSTITUTIONAL ACCOUNTING',
    items: [
      { id: 'fees', tab: 'statements', subTab: 'fees', label: 'Fee Waterfalls & Carry', badge: 'ACTUAL/365' },
      { id: 'factsheet', tab: 'statements', subTab: 'factsheet', label: 'Hurdle & HWM Matrix', badge: null },
      { id: 'statements', tab: 'statements', subTab: 'statements', label: 'Member Statements', badge: null },
    ]
  },
  {
    domain: 'PRIVATE WEALTH',
    items: [
      { id: 'solo_assets', tab: 'personal', subTab: 'assets', label: 'Personal Balance Sheet', badge: 'SOLO' },
      { id: 'incomes', tab: 'personal', subTab: 'income', label: 'Cash Flows & Income', badge: null },
    ]
  },
  {
    domain: 'SYSTEM & GOVERNANCE',
    items: [
      { id: 'fund_params', tab: 'settings', subTab: 'parameters', label: 'Fund Parameters', badge: null },
      { id: 'database', tab: 'settings', subTab: 'database', label: 'Database & Security', badge: null },
    ]
  }
];

export default function Sidebar({
  activeTab,
  setActiveTab,
  activeSubTab,
  setActiveSubTab,
  fundInfo,
  currency,
  setCurrency,
  theme,
  toggleTheme,
  onCreateFund,
  perspective = 'manager',
  onTogglePerspective,
  currentUser,
  onSignOut,
  isGuest,
  availableFunds = [],
  onSwitchFund,
  isMobileOpen,
  onCloseMobile
}) {
  const brandTitle = fundInfo?.name?.trim() || 'SyndicateOS';
  const userDisplay = isGuest 
    ? 'Guest' 
    : (currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || 'User');

  const myUserCode = generateUserCode(currentUser?.email || (isGuest ? 'guest@syndicate.internal' : 'user@syndicate.internal'));

  const [codeCopied, setCodeCopied] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
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

  const handleNavClick = (tab, subTab) => {
    setActiveTab(tab);
    if (setActiveSubTab) {
      setActiveSubTab(subTab);
    }
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <aside className={`app-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
      {/* 1. Header: Brand, Syndicate Switcher, Role */}
      <div className="sidebar-header">
        <div className="sidebar-brand-row">
          <div 
            className="brand cursor-pointer" 
            onClick={() => handleNavClick('dashboard', 'cockpit')} 
            title="Cockpit Overview"
          >
            <div className="brand-dot" />
            <span className="brand-name">{brandTitle}</span>
          </div>

          {onCloseMobile && (
            <button 
              type="button" 
              className="sidebar-close-mobile-btn btn btn-secondary btn-sm mono"
              onClick={onCloseMobile}
              title="Close Navigation"
            >
              [X]
            </button>
          )}
        </div>

        {/* Pool Switcher & Role */}
        <div className="sidebar-pool-box mt-2">
          <div className="flex items-center justify-between gap-1 mb-1">
            <span 
              className={`badge mono font-semibold ${isInvestorView ? 'badge-profit' : 'badge-neutral'}`}
              style={{ fontSize: 9, padding: '2px 6px' }}
              title={isInvestorView ? 'Viewing as Investor in this pool' : 'Viewing as Fund Manager'}
            >
              {isInvestorView ? 'INVESTOR' : 'MANAGER'}
            </span>

            {isActualManager && onTogglePerspective && (
              <button
                type="button"
                className="btn btn-secondary btn-sm perspective-toggle-btn mono"
                onClick={onTogglePerspective}
                style={{ fontSize: 9, padding: '2px 6px' }}
                title="Toggle between Manager view and Investor perspective preview"
              >
                {perspective === 'manager' ? 'Preview LP' : 'Exit LP'}
              </button>
            )}
          </div>

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
              className="sidebar-select mono w-full"
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
        </div>
      </div>

      {/* 2. Scrollable Navigation Hierarchy */}
      <nav className="sidebar-nav-scroll">
        {NAV_SECTIONS.map((section) => (
          <div key={section.domain} className="sidebar-domain-group">
            <div className="sidebar-domain-title mono">
              {section.domain}
            </div>
            <ul className="sidebar-nav-list">
              {section.items.map((item) => {
                const defaultSubTabMap = {
                  dashboard: 'cockpit',
                  holdings: 'positions',
                  syndicate: 'captable',
                  statements: 'fees',
                  personal: 'assets',
                  settings: 'parameters'
                };
                const currentResolvedSub = activeSubTab || defaultSubTabMap[activeTab] || null;
                const isItemActive = activeTab === item.tab && (item.subTab ? item.subTab === currentResolvedSub : true);

                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={`sidebar-nav-item ${isItemActive ? 'active' : ''}`}
                      onClick={() => handleNavClick(item.tab, item.subTab)}
                    >
                      <span className="sidebar-nav-label truncate">{item.label}</span>
                      {item.badge && (
                        <span className="sidebar-item-badge mono">
                          [{item.badge}]
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* 3. Footer: Currency, Theme, User Account */}
      <div className="sidebar-footer">
        <div className="sidebar-footer-controls flex items-center justify-between gap-1 mb-2">
          {/* Currency Select */}
          <select 
            value={currency} 
            onChange={(e) => setCurrency(e.target.value)}
            className="sidebar-select mono"
            style={{ fontSize: 10, padding: '3px 6px', width: 'auto', flex: 1 }}
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
            className="btn btn-secondary btn-sm theme-btn mono" 
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            style={{ fontSize: 10, padding: '3px 8px' }}
          >
            {theme === 'dark' ? 'LIGHT' : 'DARK'}
          </button>
        </div>

        {/* User Session Bar */}
        {onSignOut && (
          <div className="sidebar-user-block mono" ref={userMenuRef}>
            <button
              type="button"
              className={`sidebar-user-btn mono ${isUserMenuOpen ? 'active' : ''}`}
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              title="Account Menu"
            >
              <div className="flex flex-col text-left min-w-0 flex-1">
                <span className="sidebar-user-name truncate font-semibold">{userDisplay}</span>
                <span className="sidebar-user-code text-muted truncate" style={{ fontSize: 10 }}>
                  {myUserCode}
                </span>
              </div>
              <span className="text-muted" style={{ fontSize: 10 }}>&gt;</span>
            </button>

            {isUserMenuOpen && (
              <div className="sidebar-user-dropdown mono">
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
                  </div>
                )}

                <div className="user-dropdown-actions mt-2">
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
    </aside>
  );
}

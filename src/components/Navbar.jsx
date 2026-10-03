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
  onRefreshCloud
}) {
  const tabs = [
    { id: 'dashboard', label: 'Overview' },
    { id: 'syndicate', label: 'Syndicate Pool' },
    { id: 'holdings', label: 'Holdings' },
    { id: 'personal', label: 'Personal & Solo' },
    { id: 'statements', label: 'Statements' },
    { id: 'settings', label: 'Settings & DB' },
  ];

  return (
    <header className="topbar">
      <div className="topbar-inner">
        {/* Brand */}
        <div className="brand" onClick={() => setActiveTab('dashboard')}>
          <div className="brand-dot" />
          <span className="brand-name">{fundInfo?.name || 'Syndicate Ledger'}</span>
        </div>

        {/* Minimal Navigation Tabs */}
        <nav className="nav-tabs">
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

        {/* Right Tools */}
        <div className="flex items-center gap-2">
          {/* Database Live Status Badge */}
          {isCloudConnected ? (
            <button 
              type="button" 
              className="badge badge-profit mono"
              style={{ cursor: 'pointer', border: 'none' }}
              onClick={onRefreshCloud}
              title="Connected to Supabase PostgreSQL (Click to refresh)"
            >
              {isLoadingCloud ? 'Syncing...' : '● Supabase Live'}
            </button>
          ) : (
            <button
              type="button"
              className="badge badge-neutral mono"
              style={{ cursor: 'pointer', border: '1px solid var(--border-subtle)' }}
              onClick={() => setActiveTab('settings')}
              title="Using Local Storage (Click to connect Supabase)"
            >
              ○ Local DB
            </button>
          )}

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

          <button 
            type="button" 
            className="btn btn-secondary btn-sm" 
            onClick={toggleTheme}
            title="Toggle theme"
          >
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>

          <button 
            type="button" 
            className="btn btn-primary btn-sm"
            onClick={onOpenTransactionModal}
          >
            + Transaction
          </button>
        </div>
      </div>
    </header>
  );
}

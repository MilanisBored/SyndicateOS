import React from 'react';
import { NAV_SECTIONS } from './Sidebar';

export default function TopHeader({
  activeTab,
  activeSubTab,
  onOpenMobileSidebar,
  isCloudConnected,
  isLoadingCloud,
  onRefreshCloud,
  onOpenTransactionModal,
  onOpenStatementModal,
  onOpenActionCenter,
  pendingActionCount = 0,
  disputedCount = 0,
  perspective = 'manager',
  onOpenPriceSync
}) {
  const isInvestorView = perspective === 'investor';

  // Find active domain and subpage label
  let activeDomain = 'SYNDICATE';
  let activePageLabel = 'Overview';

  for (const sec of NAV_SECTIONS) {
    for (const item of sec.items) {
      if (item.tab === activeTab && (!activeSubTab || item.subTab === activeSubTab)) {
        activeDomain = sec.domain;
        activePageLabel = item.label;
        break;
      }
    }
  }

  return (
    <header className="app-topheader">
      <div className="app-topheader-left">
        {/* Mobile Sidebar Trigger */}
        <button
          type="button"
          className="sidebar-mobile-toggle-btn btn btn-secondary btn-sm mono"
          onClick={onOpenMobileSidebar}
          title="Open Navigation Menu"
        >
          [MENU]
        </button>

        {/* Breadcrumb Navigation */}
        <div className="app-breadcrumb mono">
          <span className="breadcrumb-domain text-muted">{activeDomain}</span>
          <span className="breadcrumb-separator text-muted">/</span>
          <span className="breadcrumb-active text-primary font-semibold">{activePageLabel}</span>
        </div>
      </div>

      <div className="app-topheader-right">
        {/* Cloud Connection Badge */}
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
          <span
            className="badge badge-neutral mono topbar-badge"
            title="Local Cache / Offline"
          >
            LOCAL DB
          </span>
        )}

        {/* Action Center Badge */}
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

        {/* Universal Price Sync (AMFI / Stocks / Crypto) */}
        {!isInvestorView && onOpenPriceSync && (
          <button 
            type="button" 
            className="btn btn-secondary btn-sm mono"
            onClick={onOpenPriceSync}
            title="Sync AMFI NAVs, Stock & Crypto prices"
            style={{ fontSize: 11, padding: '4px 8px' }}
          >
            Sync Prices
          </button>
        )}

        {/* Primary CTA: + Transaction or Statement */}
        {isInvestorView ? (
          <button 
            type="button" 
            className="btn btn-primary btn-sm topbar-cta-btn mono"
            onClick={onOpenStatementModal}
            title="View investor statement of account"
            style={{ fontSize: 11, padding: '4px 10px' }}
          >
            Statement
          </button>
        ) : (
          <button 
            type="button" 
            className="btn btn-primary btn-sm topbar-cta-btn mono"
            onClick={onOpenTransactionModal}
            title="Record Syndicate Deposit, Withdrawal or Fee Settlement"
            style={{ fontSize: 11, padding: '4px 10px' }}
          >
            + Transaction
          </button>
        )}
      </div>
    </header>
  );
}

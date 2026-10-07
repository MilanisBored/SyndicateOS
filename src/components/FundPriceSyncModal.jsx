import React, { useState } from 'react';
import { formatCurrency, formatNumber } from '../utils/navEngine';
import { syncUniversalHoldingsBatch } from '../services/marketDataService';

export default function FundPriceSyncModal({
  isOpen,
  onClose,
  holdings = [],
  fundInfo = {},
  fundMetrics = {},
  currency = 'INR',
  onSaveHolding,
  onAddTransaction,
  onSyncValuationToNAV,
}) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [progress, setProgress] = useState(null);
  const [syncSummary, setSyncSummary] = useState(null);
  const [recordValuationTx, setRecordValuationTx] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [syncApplied, setSyncApplied] = useState(false);

  if (!isOpen) return null;

  const activeHoldings = holdings.filter((h) => h.status !== 'closed');
  const mfCount = activeHoldings.filter((h) => {
    const c = (h.category || '').toLowerCase();
    return c.includes('mutual') || c.includes('sip') || c.includes('fund');
  }).length;
  const stockCount = activeHoldings.filter((h) => {
    const c = (h.category || '').toLowerCase();
    return c.includes('equit') || c.includes('stock') || c.includes('etf');
  }).length;
  const cryptoCount = activeHoldings.filter((h) => {
    const c = (h.category || '').toLowerCase();
    return c.includes('crypto') || c.includes('web3');
  }).length;
  const manualCount = activeHoldings.length - mfCount - stockCount - cryptoCount;

  const handleStartSync = async () => {
    setIsSyncing(true);
    setProgress({ current: 0, total: activeHoldings.length, name: 'Initializing market feeds...' });
    setSyncSummary(null);
    setSyncApplied(false);

    try {
      const summary = await syncUniversalHoldingsBatch(activeHoldings, currency || 'USD', (p) => {
        setProgress({ current: p.currentIndex, total: p.total, name: p.currentHolding });
      });

      // Calculate projected new AUM and NAV
      const previousAUM = Number(fundMetrics.totalFundAUM) || 0;
      const previousNav = Number(fundMetrics.currentNav) || 100;
      const totalUnits = Number(fundMetrics.totalUnits) || 0;

      let newHoldingsTotal = 0;
      summary.results.forEach((res) => {
        if (res.success) {
          newHoldingsTotal += Number(res.newValue) || 0;
        } else {
          newHoldingsTotal += Number(res.oldValue) || 0;
        }
      });

      const undeployedCash = Number(fundMetrics.undeployedCash) || 0;
      const newFundAUM = newHoldingsTotal + undeployedCash;
      const newNav = totalUnits > 0 ? (newFundAUM / totalUnits) : previousNav;
      const navDelta = newNav - previousNav;
      const navDeltaPct = previousNav > 0 ? (navDelta / previousNav) * 100 : 0;

      setSyncSummary({
        ...summary,
        previousAUM,
        newFundAUM,
        previousNav,
        newNav,
        navDelta,
        navDeltaPct,
      });
    } catch (err) {
      alert(`Valuation sync failed: ${err.message}`);
    } finally {
      setIsSyncing(false);
      setProgress(null);
    }
  };

  const handleApplySync = async () => {
    if (!syncSummary) return;
    setIsApplying(true);

    try {
      // 1. Update each holding with live value, last NAV, native currency, and exchange
      for (const res of syncSummary.results) {
        if (res.success) {
          const target = holdings.find((h) => h.id === res.holdingId);
          if (target && onSaveHolding) {
            await onSaveHolding({
              ...target,
              currentValue: res.newValue,
              lastNav: res.liveNav || res.livePrice,
              lastPrice: res.livePrice || res.liveNav,
              nativeCurrency: res.nativeCurrency || target.nativeCurrency,
              exchange: res.exchange || target.exchange,
              schemeCode: res.schemeCode || target.schemeCode || target.ticker,
            });
          }
        }
      }

      // 2. Optionally record valuation update transaction in the ledger
      if (recordValuationTx && onAddTransaction) {
        const todayStr = new Date().toISOString().split('T')[0];
        const newTx = {
          id: `tx_${Date.now()}`,
          date: todayStr,
          type: 'valuation_update',
          memberId: null,
          amount: syncSummary.newFundAUM,
          nav: syncSummary.newNav,
          units: 0,
          note: `Live Price Sync: ${syncSummary.totalUpdated} assets updated to official closing prices`,
        };
        await onAddTransaction(newTx);
      } else if (onSyncValuationToNAV) {
        onSyncValuationToNAV();
      }

      setSyncApplied(true);
    } catch (err) {
      alert(`Failed to apply updated valuation: ${err.message}`);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => !isSyncing && !isApplying && onClose()}>
      <div 
        className="modal-content" 
        style={{ maxWidth: 640 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-3 pb-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div>
            <h3 className="font-semibold text-sm">Universal Fund Price Sync</h3>
            <span className="text-xs text-muted">
              Auto-fetch official closing prices for all active assets across AMFI, CoinGecko & Global Markets.
            </span>
          </div>
          <button 
            type="button" 
            className="btn btn-secondary btn-sm mono" 
            onClick={onClose}
            disabled={isSyncing || isApplying}
          >
            Close
          </button>
        </div>

        {/* Positions Coverage Strip */}
        <div className="grid grid-cols-4 gap-2 mb-3 text-xs mono">
          <div className="card p-2 bg-secondary">
            <span className="text-muted block" style={{ fontSize: 10 }}>MUTUAL FUNDS</span>
            <span className="font-semibold">{mfCount} (AMFI Feed)</span>
          </div>
          <div className="card p-2 bg-secondary">
            <span className="text-muted block" style={{ fontSize: 10 }}>EQUITIES & ETFS</span>
            <span className="font-semibold">{stockCount} (Global)</span>
          </div>
          <div className="card p-2 bg-secondary">
            <span className="text-muted block" style={{ fontSize: 10 }}>CRYPTO / WEB3</span>
            <span className="font-semibold">{cryptoCount} (CoinGecko)</span>
          </div>
          <div className="card p-2 bg-secondary">
            <span className="text-muted block" style={{ fontSize: 10 }}>MANUAL / CASH</span>
            <span className="font-semibold">{manualCount} (Preserved)</span>
          </div>
        </div>

        {/* Active Progress Indicator */}
        {isSyncing && progress && (
          <div className="card p-3 mb-3 text-xs mono">
            <div className="flex justify-between mb-1">
              <span>Syncing live market data...</span>
              <span>{progress.current} / {progress.total}</span>
            </div>
            <div style={{ background: 'var(--bg-subtle)', height: 6, borderRadius: 3, overflow: 'hidden' }}>
              <div 
                style={{ 
                  background: 'var(--accent)', 
                  height: '100%', 
                  width: `${(progress.current / Math.max(1, progress.total)) * 100}%`,
                  transition: 'width 0.2s ease'
                }} 
              />
            </div>
            <span className="text-muted mt-2 block truncate">Querying: {progress.name}</span>
          </div>
        )}

        {/* Sync Summary & Impact */}
        {syncSummary && (
          <div className="mb-3">
            {/* Impact Metric Strip */}
            <div className="metric-strip mb-3">
              <div className="metric-cell">
                <span className="metric-label">Previous NAV</span>
                <span className="metric-val mono">{formatCurrency(syncSummary.previousNav, currency, { decimals: 2 })}</span>
                <span className="text-muted text-xs mono">Baseline</span>
              </div>
              <div className="metric-cell">
                <span className="metric-label">New Live NAV</span>
                <span className="metric-val mono text-primary">{formatCurrency(syncSummary.newNav, currency, { decimals: 2 })}</span>
                <div className="metric-delta">
                  <span className={syncSummary.navDelta >= 0 ? 'text-profit' : 'text-loss'}>
                    {syncSummary.navDelta >= 0 ? '+' : ''}{formatCurrency(syncSummary.navDelta, currency, { decimals: 2 })} ({formatNumber(syncSummary.navDeltaPct, 2)}%)
                  </span>
                </div>
              </div>
              <div className="metric-cell">
                <span className="metric-label">Previous AUM</span>
                <span className="metric-val mono">{formatCurrency(syncSummary.previousAUM, currency, { decimals: 0 })}</span>
                <span className="text-muted text-xs mono">Booked</span>
              </div>
              <div className="metric-cell">
                <span className="metric-label">Mark-to-Market AUM</span>
                <span className="metric-val mono font-semibold">{formatCurrency(syncSummary.newFundAUM, currency, { decimals: 0 })}</span>
                <div className="metric-delta">
                  <span className={syncSummary.newFundAUM >= syncSummary.previousAUM ? 'text-profit' : 'text-loss'}>
                    {syncSummary.newFundAUM >= syncSummary.previousAUM ? '+' : ''}{formatCurrency(syncSummary.newFundAUM - syncSummary.previousAUM, currency, { decimals: 0 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Asset Breakdown Table */}
            <div className="table-responsive" style={{ maxHeight: 220, border: '1px solid var(--border-subtle)' }}>
              <table className="dense-table text-xs">
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th>Previous</th>
                    <th>Live Price / NAV</th>
                    <th>New Value</th>
                    <th>Source & Status</th>
                  </tr>
                </thead>
                <tbody>
                  {syncSummary.results.map((r, idx) => (
                    <tr key={idx}>
                      <td className="font-medium">{r.ticker || r.name}</td>
                      <td className="mono text-muted">{formatCurrency(r.oldValue, currency, { decimals: 0 })}</td>
                      <td className="mono font-semibold">
                        {r.liveNav ? formatCurrency(r.liveNav, currency, { decimals: 4 }) : (r.livePrice ? formatCurrency(r.livePrice, currency, { decimals: 2 }) : '—')}
                      </td>
                      <td className="mono font-semibold">{formatCurrency(r.newValue, currency, { decimals: 0 })}</td>
                      <td className={`text-xs mono ${r.success ? 'text-profit' : r.skipped ? 'text-muted' : 'text-loss'}`}>
                        {r.success ? (r.source || 'Verified') : r.skipped ? 'Manual' : (r.error || 'Failed')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Ledger Revaluation Option */}
            {!syncApplied && (
              <div className="flex items-center gap-2 mt-3 pt-2 text-xs" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <input
                  type="checkbox"
                  id="recordValuationTx"
                  checked={recordValuationTx}
                  onChange={(e) => setRecordValuationTx(e.target.checked)}
                />
                <label htmlFor="recordValuationTx" className="text-muted cursor-pointer">
                  Record official <strong className="text-primary">[Valuation Update]</strong> transaction in Fund Ledger to update timeline & historical charts.
                </label>
              </div>
            )}

            {syncApplied && (
              <div className="card p-2 mt-3 text-xs mono text-profit bg-profit-subtle flex justify-between items-center">
                <span>Valuation mark-to-market applied successfully to fund state.</span>
                <span className="badge badge-profit">CONFIRMED</span>
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex justify-between items-center mt-3 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <div className="text-xs text-muted mono">
            {activeHoldings.length} total active holdings
          </div>
          <div className="flex gap-2">
            {!syncSummary ? (
              <button
                type="button"
                className="btn btn-primary mono"
                onClick={handleStartSync}
                disabled={isSyncing || activeHoldings.length === 0}
              >
                {isSyncing ? 'Fetching Live Feeds...' : `Start Full Fund Sync (${activeHoldings.length})`}
              </button>
            ) : syncApplied ? (
              <button
                type="button"
                className="btn btn-primary mono"
                onClick={onClose}
              >
                Done
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="btn btn-secondary mono"
                  onClick={handleStartSync}
                  disabled={isSyncing || isApplying}
                >
                  Re-Run Sync
                </button>
                <button
                  type="button"
                  className="btn btn-primary mono"
                  onClick={handleApplySync}
                  disabled={isApplying}
                >
                  {isApplying ? 'Applying...' : 'Apply Mark-to-Market NAV'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { formatCurrency, formatNumber, generateShareableSummary } from '../utils/navEngine';

export default function StatementModal({ 
  member, 
  fundInfo, 
  fundMetrics = {},
  currentNav, 
  currency, 
  onClose 
}) {
  const [copied, setCopied] = useState(false);

  if (!member) return null;

  const effectiveNav = Number(currentNav || fundMetrics?.currentNav || 100);
  const totalFundUnits = Number(fundMetrics?.totalUnits) > 0 ? Number(fundMetrics.totalUnits) : (Number(member.units) || 1);
  const ownershipRatio = totalFundUnits > 0 ? (Number(member.units || 0) / totalFundUnits) : ((Number(member.ownershipPct) || 0) / 100);

  // Proportional Balance Sheet Share
  const memberCashShare = (Number(fundMetrics?.undeployedCash) || 0) * ownershipRatio;
  const memberAssetShare = (Number(fundMetrics?.holdingsTotal) || 0) * ownershipRatio;

  // Multi-Timeframe Performance on Member Equity
  const tf = fundMetrics?.timeframes || {};
  const day1 = tf['1D'] || { pct: 0, delta: 0 };
  const month1 = tf['1M'] || { pct: 0, delta: 0 };
  const ytd = tf['YTD'] || { pct: 0, delta: 0 };

  const dayProfit = (Number(member.units) || 0) * (day1.delta || 0);
  const mtdProfit = (Number(member.units) || 0) * (month1.delta || 0);
  const ytdProfit = (Number(member.units) || 0) * (ytd.delta || 0);

  const handleCopy = () => {
    const text = generateShareableSummary(member, fundInfo, effectiveNav);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content modal-statement-sheet"
        style={{ maxWidth: 640 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Actions bar (no-print) */}
        <div className="flex justify-between items-center pb-3 mb-4 no-print" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <span className="font-semibold text-xs text-muted uppercase">Investor Account Tear Sheet</span>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-secondary btn-sm mono"
              onClick={handleCopy}
            >
              {copied ? 'Copied' : 'Copy Text'}
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm mono"
              onClick={() => window.print()}
            >
              Print / PDF
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm mono"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>

        {/* Statement Document */}
        <div className="statement-sheet">
          <div className="statement-title-block">
            <div>
              <div className="font-semibold text-base">{fundInfo?.name || 'Syndicate Fund'}</div>
              <div className="text-xs text-muted">Manager: {fundInfo?.managerName || 'Fund Manager'}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted">Date: {new Date().toISOString().split('T')[0]}</div>
              <div className="text-xs text-muted mono">Prevailing NAV: {formatCurrency(effectiveNav, currency, { decimals: 2 })}</div>
            </div>
          </div>

          {/* Member Profile Banner */}
          <div className="flex justify-between items-center p-3 mb-3 card">
            <div>
              <span className="font-semibold text-sm block">{member.name}</span>
              <span className="text-xs text-muted mono">{member.role} {member.email ? `• ${member.email}` : ''}</span>
            </div>
            <div className="text-right">
              <span className="text-xs text-muted block mono">Ownership Stake</span>
              <span className="mono font-semibold">{formatNumber(member.ownershipPct, 2)}%</span>
            </div>
          </div>

          {/* Primary KPI Metric Strip */}
          <div className="metric-strip mb-3">
            <div className="metric-cell">
              <span className="metric-label">Member Equity</span>
              <span className="metric-val mono text-base">{formatCurrency(member.currentValue, currency)}</span>
              <div className="metric-delta">
                <span className={member.totalProfit >= 0 ? 'text-profit' : 'text-loss'}>
                  {member.totalProfit >= 0 ? '+' : ''}{formatCurrency(member.totalProfit, currency, { decimals: 0 })} ({formatNumber(member.roiPercentage, 1)}%)
                </span>
              </div>
            </div>

            <div className="metric-cell">
              <span className="metric-label">Prevailing NAV & Units</span>
              <span className="metric-val mono text-base">{formatCurrency(effectiveNav, currency, { decimals: 2 })}</span>
              <div className="metric-delta text-muted">
                <span>{formatNumber(member.units, 4)} units</span>
              </div>
            </div>

            <div className="metric-cell">
              <span className="metric-label">Contributed Capital</span>
              <span className="metric-val mono text-base">{formatCurrency(member.totalDeposited, currency, { decimals: 0 })}</span>
              <div className="metric-delta text-muted">
                <span>Withdrawn: {formatCurrency(member.totalWithdrawn, currency, { decimals: 0 })}</span>
              </div>
            </div>

            <div className="metric-cell">
              <span className="metric-label">Day Profit (1D)</span>
              <span className={`metric-val mono text-base ${dayProfit >= 0 ? 'text-profit' : 'text-loss'}`}>
                {dayProfit >= 0 ? '+' : ''}{formatCurrency(dayProfit, currency, { decimals: 0 })}
              </span>
              <div className="metric-delta">
                <span className={day1.pct >= 0 ? 'text-profit' : 'text-loss'}>
                  {day1.pct >= 0 ? '+' : ''}{formatNumber(day1.pct, 2)}% 24h delta
                </span>
              </div>
            </div>
          </div>

          {/* Secondary Balance Sheet & Horizon Metric Strip */}
          <div className="metric-strip mb-4">
            <div className="metric-cell">
              <span className="metric-label">Liquid Cash Share</span>
              <span className="metric-val mono text-base">{formatCurrency(memberCashShare, currency, { decimals: 0 })}</span>
              <div className="metric-delta text-muted">
                <span>Dry powder reserve buffer</span>
              </div>
            </div>

            <div className="metric-cell">
              <span className="metric-label">Invested Assets Share</span>
              <span className="metric-val mono text-base">{formatCurrency(memberAssetShare, currency, { decimals: 0 })}</span>
              <div className="metric-delta text-muted">
                <span>Underlying portfolio backing</span>
              </div>
            </div>

            <div className="metric-cell">
              <span className="metric-label">Month-to-Date (MTD)</span>
              <span className={`metric-val mono text-base ${mtdProfit >= 0 ? 'text-profit' : 'text-loss'}`}>
                {mtdProfit >= 0 ? '+' : ''}{formatCurrency(mtdProfit, currency, { decimals: 0 })}
              </span>
              <div className="metric-delta">
                <span className={month1.pct >= 0 ? 'text-profit' : 'text-loss'}>
                  {month1.pct >= 0 ? '+' : ''}{formatNumber(month1.pct, 2)}% 30d
                </span>
              </div>
            </div>

            <div className="metric-cell">
              <span className="metric-label">Year-to-Date (YTD)</span>
              <span className={`metric-val mono text-base ${ytdProfit >= 0 ? 'text-profit' : 'text-loss'}`}>
                {ytdProfit >= 0 ? '+' : ''}{formatCurrency(ytdProfit, currency, { decimals: 0 })}
              </span>
              <div className="metric-delta">
                <span className={ytd.pct >= 0 ? 'text-profit' : 'text-loss'}>
                  {ytd.pct >= 0 ? '+' : ''}{formatNumber(ytd.pct, 2)}% YTD
                </span>
              </div>
            </div>
          </div>

          {/* Investor Balance Sheet Statement */}
          <div className="card p-3 mb-4">
            <div className="section-head mb-2">
              <span className="section-title text-xs">Investor Balance Sheet & Capital Account</span>
              <span className="text-xs text-muted mono">As of {new Date().toISOString().split('T')[0]}</span>
            </div>
            <table className="dense-table w-full">
              <thead>
                <tr>
                  <th>Balance Sheet Position</th>
                  <th className="text-right">Allocation</th>
                  <th className="text-right">Amount ({currency})</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-medium">Liquid Cash Reserve (Dry Powder)</td>
                  <td className="text-right mono text-muted">
                    {formatNumber(member.currentValue > 0 ? (memberCashShare / member.currentValue) * 100 : 0, 1)}%
                  </td>
                  <td className="text-right mono font-semibold">{formatCurrency(memberCashShare, currency)}</td>
                </tr>
                <tr>
                  <td className="font-medium">Portfolio Asset Backing (Invested Holdings)</td>
                  <td className="text-right mono text-muted">
                    {formatNumber(member.currentValue > 0 ? (memberAssetShare / member.currentValue) * 100 : 0, 1)}%
                  </td>
                  <td className="text-right mono font-semibold">{formatCurrency(memberAssetShare, currency)}</td>
                </tr>
                <tr style={{ borderTop: '2px solid var(--border-subtle)', background: 'var(--bg-subtle)' }}>
                  <td className="font-semibold">Total Member Net Equity</td>
                  <td className="text-right mono font-semibold">100.0%</td>
                  <td className="text-right mono font-semibold text-base">{formatCurrency(member.currentValue, currency)}</td>
                </tr>
                <tr>
                  <td className="text-muted">Net Contributed Capital</td>
                  <td className="text-right mono text-muted">—</td>
                  <td className="text-right mono font-medium">
                    {formatCurrency(member.totalDeposited - member.totalWithdrawn, currency)}
                    <span className="text-xs text-muted font-normal ml-1">
                      (Deposited: {formatCurrency(member.totalDeposited, currency, { decimals: 0 })} / Withdrawn: {formatCurrency(member.totalWithdrawn, currency, { decimals: 0 })})
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="font-semibold">Cumulative Net Profit (All-Time PnL)</td>
                  <td className="text-right mono font-semibold">{formatNumber(member.roiPercentage, 2)}% ROI</td>
                  <td className={`text-right mono font-semibold ${member.totalProfit >= 0 ? 'text-profit' : 'text-loss'}`}>
                    {member.totalProfit >= 0 ? '+' : ''}{formatCurrency(member.totalProfit, currency)}
                  </td>
                </tr>
                <tr>
                  <td className="text-muted">1-Day Period Profit (Day Profit)</td>
                  <td className="text-right mono text-muted">{day1.pct >= 0 ? '+' : ''}{formatNumber(day1.pct, 2)}%</td>
                  <td className={`text-right mono ${dayProfit >= 0 ? 'text-profit' : 'text-loss'}`}>
                    {dayProfit >= 0 ? '+' : ''}{formatCurrency(dayProfit, currency)}
                  </td>
                </tr>
                <tr>
                  <td className="text-muted">Month-to-Date Profit (MTD)</td>
                  <td className="text-right mono text-muted">{month1.pct >= 0 ? '+' : ''}{formatNumber(month1.pct, 2)}%</td>
                  <td className={`text-right mono ${mtdProfit >= 0 ? 'text-profit' : 'text-loss'}`}>
                    {mtdProfit >= 0 ? '+' : ''}{formatCurrency(mtdProfit, currency)}
                  </td>
                </tr>
                <tr>
                  <td className="text-muted">Year-to-Date Profit (YTD)</td>
                  <td className="text-right mono text-muted">{ytd.pct >= 0 ? '+' : ''}{formatNumber(ytd.pct, 2)}%</td>
                  <td className={`text-right mono ${ytdProfit >= 0 ? 'text-profit' : 'text-loss'}`}>
                    {ytdProfit >= 0 ? '+' : ''}{formatCurrency(ytdProfit, currency)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Activity Table */}
          <div className="section-head mt-4">
            <span className="section-title">Member Ledger History</span>
          </div>

          <table className="dense-table w-full">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Amount</th>
                <th>NAV</th>
                <th>Units Impact</th>
                <th>Memo</th>
              </tr>
            </thead>
            <tbody>
              {member.history.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center text-muted py-4">No records.</td>
                </tr>
              ) : (
                member.history.map((tx, idx) => {
                  const isDeposit = tx.type === 'deposit';
                  return (
                    <tr key={tx.id || idx}>
                      <td className="mono text-muted">{tx.date}</td>
                      <td>
                        <span className={`badge ${isDeposit ? 'badge-profit' : 'badge-loss'}`}>
                          {isDeposit ? 'Deposit' : 'Withdrawal'}
                        </span>
                      </td>
                      <td className="mono font-semibold">
                        <span className={isDeposit ? 'text-profit' : 'text-loss'}>
                          {isDeposit ? '+' : '-'}{formatCurrency(tx.amount, currency)}
                        </span>
                      </td>
                      <td className="mono text-muted">{formatCurrency(tx.navUsed, currency, { decimals: 2 })}</td>
                      <td className="mono text-muted">
                        {isDeposit ? '+' : '-'}{formatNumber(tx.unitsCalculated, 2)}
                      </td>
                      <td className="text-muted text-xs truncate" style={{ maxWidth: 180 }}>
                        {tx.note || '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

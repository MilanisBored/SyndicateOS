import React, { useState } from 'react';
import { formatCurrency, formatNumber } from '../utils/navEngine';

export default function DashboardView({ 
  fundMetrics, 
  fundInfo, 
  currency, 
  transactions, 
  members, 
  holdings, 
  personalFinances,
  onOpenTransactionModal,
  onSelectMember 
}) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Solo Assets Total
  const soloAssetsTotal = personalFinances.personalSoloAssets.reduce(
    (acc, a) => acc + (Number(a.value) || 0), 
    0
  );
  const totalCombinedNetWorth = fundMetrics.myStakeValue + soloAssetsTotal;

  // Chart coordinates
  const timeline = fundMetrics.timeline || [];
  const minNav = timeline.length > 0 ? Math.min(...timeline.map((t) => t.nav)) * 0.98 : 95;
  const maxNav = timeline.length > 0 ? Math.max(...timeline.map((t) => t.nav)) * 1.02 : 150;
  const navRange = maxNav - minNav || 1;

  const chartWidth = 560;
  const chartHeight = 130;
  const paddingX = 35;
  const paddingY = 15;

  const points = timeline.map((item, index) => {
    const x = paddingX + (index / Math.max(1, timeline.length - 1)) * (chartWidth - paddingX * 2);
    const y = chartHeight - paddingY - ((item.nav - minNav) / navRange) * (chartHeight - paddingY * 2);
    return { ...item, x, y };
  });

  const svgPath = points.length > 0
    ? points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '')
    : '';

  const recentTx = [...transactions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 6);

  return (
    <div>
      {/* Compact Metric Strip */}
      <div className="metric-strip">
        <div className="metric-cell">
          <span className="metric-label">Syndicate Pool AUM</span>
          <span className="metric-val mono">{formatCurrency(fundMetrics.totalFundAUM, currency)}</span>
          <div className="metric-delta">
            <span className={fundMetrics.totalFundNetProfit >= 0 ? 'text-profit' : 'text-loss'}>
              {fundMetrics.totalFundNetProfit >= 0 ? '+' : ''}{formatCurrency(fundMetrics.totalFundNetProfit, currency, { decimals: 0 })} ({formatNumber(fundMetrics.totalFundRoiPct, 1)}%)
            </span>
          </div>
        </div>

        <div className="metric-cell">
          <span className="metric-label">Unit NAV Price</span>
          <span className="metric-val mono">{formatCurrency(fundMetrics.currentNav, currency, { decimals: 2 })}</span>
          <div className="metric-delta text-muted">
            <span>{formatNumber(fundMetrics.totalUnits, 1)} total units</span>
          </div>
        </div>

        <div className="metric-cell">
          <span className="metric-label">My Equity (Milan)</span>
          <span className="metric-val mono">{formatCurrency(fundMetrics.myStakeValue, currency)}</span>
          <div className="metric-delta text-muted">
            <span>{formatNumber((fundMetrics.myStakeValue / (fundMetrics.totalFundAUM || 1)) * 100, 1)}% ownership</span>
          </div>
        </div>

        <div className="metric-cell">
          <span className="metric-label">Partner & Friends</span>
          <span className="metric-val mono">
            {formatCurrency(fundMetrics.partnerStakeValue + fundMetrics.friendsStakeValue, currency)}
          </span>
          <div className="metric-delta text-muted">
            <span>{fundMetrics.members.length - 1} external participants</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Chart & Ownership */}
      <div className="clean-grid-dual">
        {/* NAV Trajectory Chart */}
        <div className="card chart-box">
          <div className="section-head">
            <span className="section-title">NAV Trajectory</span>
            <span className="text-xs text-muted mono">
              Current: {formatCurrency(fundMetrics.currentNav, currency, { decimals: 2 })}
            </span>
          </div>

          <div style={{ position: 'relative' }}>
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="clean-svg">
              {/* Horizontal gridlines */}
              {[0, 0.5, 1].map((r, i) => {
                const y = paddingY + r * (chartHeight - paddingY * 2);
                const val = maxNav - r * navRange;
                return (
                  <g key={i}>
                    <line 
                      x1={paddingX} 
                      y1={y} 
                      x2={chartWidth - paddingX} 
                      y2={y} 
                      stroke="var(--border-subtle)" 
                      strokeDasharray="2 3" 
                    />
                    <text 
                      x={paddingX - 6} 
                      y={y + 3} 
                      fill="var(--text-muted)" 
                      fontSize="9" 
                      textAnchor="end"
                      fontFamily="var(--font-mono)"
                    >
                      {formatNumber(val, 0)}
                    </text>
                  </g>
                );
              })}

              {/* Minimal Line */}
              {svgPath && (
                <path 
                  d={svgPath} 
                  fill="none" 
                  stroke="var(--text-primary)" 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
              )}

              {/* Points */}
              {points.map((p, idx) => (
                <circle 
                  key={idx}
                  cx={p.x} 
                  cy={p.y} 
                  r="3" 
                  fill="var(--bg-app)" 
                  stroke="var(--text-primary)" 
                  strokeWidth="1.5"
                  onMouseEnter={() => setHoveredPoint(p)}
                  onMouseLeave={() => setHoveredPoint(null)}
                  style={{ cursor: 'pointer' }}
                />
              ))}
            </svg>

            {hoveredPoint && (
              <div 
                style={{
                  position: 'absolute',
                  left: `${(hoveredPoint.x / chartWidth) * 100}%`,
                  top: `${(hoveredPoint.y / chartHeight) * 100}%`,
                  transform: 'translate(-50%, -125%)',
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-subtle)',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  pointerEvents: 'none',
                  whiteSpace: 'nowrap',
                  zIndex: 10,
                }}
              >
                <div className="text-muted">{hoveredPoint.date}</div>
                <div className="mono font-semibold">{formatCurrency(hoveredPoint.nav, currency, { decimals: 2 })}</div>
              </div>
            )}
          </div>
        </div>

        {/* Member Equity Breakdown */}
        <div className="card chart-box">
          <div className="section-head">
            <span className="section-title">Participants ({fundMetrics.members.length})</span>
            <button 
              type="button" 
              className="btn btn-secondary btn-sm"
              onClick={() => onOpenTransactionModal()}
            >
              + Entry
            </button>
          </div>

          <div className="compact-list">
            {fundMetrics.members.map((m) => (
              <div 
                key={m.id} 
                className="compact-list-row"
                style={{ cursor: 'pointer' }}
                onClick={() => onSelectMember(m)}
                title="View Statement"
              >
                <div>
                  <div className="font-medium">{m.name}</div>
                  <div className="text-xs text-muted mono">
                    {formatNumber(m.units, 2)} units &bull; {formatNumber(m.ownershipPct, 1)}%
                  </div>
                </div>
                <div className="text-right">
                  <div className="mono font-semibold">{formatCurrency(m.currentValue, currency)}</div>
                  <div className={`text-xs mono ${m.totalProfit >= 0 ? 'text-profit' : 'text-loss'}`}>
                    {m.totalProfit >= 0 ? '+' : ''}{formatNumber(m.roiPercentage, 1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Ledger Activity */}
      <div className="card p-4">
        <div className="section-head">
          <span className="section-title">Recent Transactions</span>
        </div>

        <div className="table-responsive">
          <table className="dense-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Participant</th>
                <th>Type</th>
                <th>Amount</th>
                <th>NAV</th>
                <th>Units Impact</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {recentTx.map((tx) => {
                const member = members.find((m) => 
                  m.id === tx.memberId ||
                  (tx.memberId && String(m.id).toLowerCase() === String(tx.memberId).toLowerCase()) ||
                  (tx.memberName && m.name.toLowerCase() === tx.memberName.toLowerCase()) ||
                  (tx.note && tx.note.toLowerCase().includes(m.name.toLowerCase()))
                );
                const isDeposit = tx.type === 'deposit';
                const isWithdrawal = tx.type === 'withdrawal';
                const isValuation = tx.type === 'valuation_update';

                return (
                  <tr key={tx.id}>
                    <td className="mono text-muted">{tx.date}</td>
                    <td>{member ? member.name : isValuation ? 'Fund Revaluation' : (tx.memberName || 'Investor')}</td>
                    <td>
                      <span className={`badge ${
                        isDeposit ? 'badge-profit' : isWithdrawal ? 'badge-loss' : 'badge-neutral'
                      }`}>
                        {isDeposit ? 'Deposit' : isWithdrawal ? 'Withdrawal' : 'Valuation'}
                      </span>
                    </td>
                    <td className="mono font-semibold">
                      <span className={isDeposit ? 'text-profit' : isWithdrawal ? 'text-loss' : ''}>
                        {isDeposit ? '+' : isWithdrawal ? '-' : ''}{formatCurrency(tx.amount, currency)}
                      </span>
                    </td>
                    <td className="mono text-muted">{formatCurrency(tx.nav, currency, { decimals: 2 })}</td>
                    <td className="mono text-muted">
                      {isValuation ? '—' : `${formatNumber(tx.units, 2)} u`}
                    </td>
                    <td className="text-muted text-xs truncate" style={{ maxWidth: 220 }}>
                      {tx.note || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

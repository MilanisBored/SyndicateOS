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
  currentUser,
  perspective = 'manager',
  onOpenTransactionModal,
  onConfirmTransaction,
  onSelectMember,
  onOpenActionCenter
}) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const isInvestor = perspective === 'investor' || fundInfo?.userRole === 'investor';
  const userEmail = (currentUser?.email || '').toLowerCase().trim();

  // Resolve current member profile
  const currentMember = fundMetrics.members.find(m => 
    m.isMe || 
    (userEmail && m.email && m.email.toLowerCase().trim() === userEmail) ||
    m.id === fundInfo?.myMemberId
  ) || fundMetrics.members[0];

  const [txFilter, setTxFilter] = useState(isInvestor ? 'my' : 'all');

  // Pending transfers awaiting this investor's confirmation
  const pendingInvestorTx = currentMember ? transactions.filter(t => 
    (t.memberId === currentMember.id || t.isMyTx) && t.status === 'pending'
  ) : [];

  // Solo Assets Total
  const soloAssetsTotal = personalFinances?.personalSoloAssets?.reduce(
    (acc, a) => acc + (Number(a.value) || 0), 
    0
  ) || 0;

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

  const managerName = fundInfo?.managerName || 'Fund Manager';

  return (
    <div>
      {/* Investor Portal Header Banner */}
      {isInvestor && currentMember && (
        <div 
          className="card p-3 mb-3 investor-portal-banner flex justify-between items-center"
          style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.25)' }}
        >
          <div className="flex items-center gap-3">
            <span className="badge badge-profit mono font-semibold" style={{ fontSize: 10, padding: '2px 7px' }}>INVESTOR PORTAL</span>
            <div>
              <span className="font-semibold block text-sm">
                {currentMember.name} • Syndicate Managed by {managerName}
              </span>
              <span className="text-xs text-muted">
                Your capital is unitized at current NAV ({formatCurrency(fundMetrics.currentNav, currency)}). Deposits & withdrawals reflect live.
              </span>
            </div>
          </div>
          <button 
            type="button" 
            className="btn btn-primary btn-sm mono"
            onClick={() => onSelectMember(currentMember)}
            style={{ fontSize: 11 }}
          >
            Full Statement
          </button>
        </div>
      )}

      {/* Compact Action Strip Linking Directly to Top-Right Action Center */}
      {pendingInvestorTx.length > 0 && onOpenActionCenter && (
        <div 
          className="card px-3 py-2 mb-3 flex justify-between items-center text-xs"
          style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.3)' }}
        >
          <div className="flex items-center gap-2">
            <span className="badge badge-warning mono font-semibold" style={{ fontSize: 9, padding: '2px 6px' }}>ACTION REQUIRED</span>
            <span className="font-medium text-xs">
              {pendingInvestorTx.length} pending transfer{pendingInvestorTx.length > 1 ? 's' : ''} awaiting your confirmation
            </span>
          </div>
          <button 
            type="button" 
            className="btn btn-secondary btn-sm mono"
            onClick={onOpenActionCenter}
            style={{ fontSize: 11, padding: '2px 8px' }}
          >
            Review in Action Center [ACT: {pendingInvestorTx.length}] &rarr;
          </button>
        </div>
      )}

      {/* Adaptive Metric Strip */}
      <div className="metric-strip">
        {isInvestor && currentMember ? (
          <>
            <div className="metric-cell">
              <span className="metric-label">My Portfolio Equity</span>
              <span className="metric-val mono">{formatCurrency(currentMember.currentValue, currency)}</span>
              <div className="metric-delta">
                <span className={currentMember.totalProfit >= 0 ? 'text-profit' : 'text-loss'}>
                  {currentMember.totalProfit >= 0 ? '+' : ''}{formatCurrency(currentMember.totalProfit, currency, { decimals: 0 })} ({formatNumber(currentMember.roiPercentage, 1)}%)
                </span>
              </div>
            </div>

            <div className="metric-cell">
              <span className="metric-label">My Total Invested</span>
              <span className="metric-val mono">{formatCurrency(currentMember.totalDeposited, currency)}</span>
              <div className="metric-delta text-muted">
                <span>Withdrawn: {formatCurrency(currentMember.totalWithdrawn, currency, { decimals: 0 })}</span>
              </div>
            </div>

            <div className="metric-cell">
              <span className="metric-label">My Units & Share</span>
              <span className="metric-val mono">{formatNumber(currentMember.units, 2)} units</span>
              <div className="metric-delta text-muted">
                <span>{formatNumber(currentMember.ownershipPct, 1)}% of total pool</span>
              </div>
            </div>

            <div className="metric-cell">
              <span className="metric-label">Syndicate Pool AUM</span>
              <span className="metric-val mono">{formatCurrency(fundMetrics.totalFundAUM, currency)}</span>
              <div className="metric-delta text-muted">
                <span>Current NAV: {formatCurrency(fundMetrics.currentNav, currency, { decimals: 2 })}</span>
              </div>
            </div>
          </>
        ) : (
          <>
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
              <span className="metric-label">Manager Equity ({managerName})</span>
              <span className="metric-val mono">{formatCurrency(fundMetrics.myStakeValue, currency)}</span>
              <div className="metric-delta text-muted">
                <span>{formatNumber((fundMetrics.myStakeValue / (fundMetrics.totalFundAUM || 1)) * 100, 1)}% ownership</span>
              </div>
            </div>

            <div className="metric-cell">
              <span className="metric-label">Investors Pool Capital</span>
              <span className="metric-val mono">
                {formatCurrency(fundMetrics.partnerStakeValue + fundMetrics.friendsStakeValue, currency)}
              </span>
              <div className="metric-delta text-muted">
                <span>{Math.max(0, fundMetrics.members.length - 1)} external investors</span>
              </div>
            </div>
          </>
        )}
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
            {!isInvestor && (
              <button 
                type="button" 
                className="btn btn-secondary btn-sm"
                onClick={() => onOpenTransactionModal()}
              >
                + Entry
              </button>
            )}
          </div>

          <div className="compact-list">
            {fundMetrics.members.map((m) => {
              const isThisMe = m.id === currentMember?.id || m.isMe;
              return (
                <div 
                  key={m.id} 
                  className="compact-list-row"
                  style={{ cursor: 'pointer', background: isThisMe ? 'rgba(99, 102, 241, 0.06)' : undefined }}
                  onClick={() => onSelectMember(m)}
                  title="View Statement"
                >
                  <div>
                    <div className="font-medium flex items-center gap-1">
                      {m.name}
                      {isThisMe && (
                        <span className="badge badge-profit mono" style={{ fontSize: 9, padding: '1px 5px' }}>
                          You
                        </span>
                      )}
                    </div>
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
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Ledger Activity */}
      <div className="card p-4">
        <div className="section-head">
          <span className="section-title">Recent Transactions</span>

          <div className="flex gap-2">
            <button
              type="button"
              className={`btn btn-sm ${txFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: 11, padding: '3px 9px' }}
              onClick={() => setTxFilter('all')}
            >
              All Pool Activity
            </button>
            {currentMember && (
              <button
                type="button"
                className={`btn btn-sm ${txFilter === 'my' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: 11, padding: '3px 9px' }}
                onClick={() => setTxFilter('my')}
              >
                My Investments Only
              </button>
            )}
          </div>
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
                <th>Status</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {[...transactions]
                .filter(tx => {
                  if (txFilter === 'my' && currentMember) {
                    return tx.memberId === currentMember.id || 
                           (tx.memberName && tx.memberName.toLowerCase() === currentMember.name.toLowerCase()) ||
                           (tx.note && tx.note.toLowerCase().includes(currentMember.name.toLowerCase())) ||
                           tx.isMyTx;
                  }
                  return true;
                })
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 8)
                .map((tx) => {
                  const member = members.find((m) => 
                    m.id === tx.memberId ||
                    (tx.memberId && String(m.id).toLowerCase() === String(tx.memberId).toLowerCase()) ||
                    (tx.memberName && m.name.toLowerCase() === tx.memberName.toLowerCase()) ||
                    (tx.note && tx.note.toLowerCase().includes(m.name.toLowerCase()))
                  );
                  const isDeposit = tx.type === 'deposit';
                  const isWithdrawal = tx.type === 'withdrawal';
                  const isValuation = tx.type === 'valuation_update';
                  const isThisMyTx = currentMember && (
                    tx.memberId === currentMember.id || 
                    tx.isMyTx || 
                    (member && member.id === currentMember.id)
                  );
                  const txStatus = tx.status || 'verified';

                  return (
                    <tr key={tx.id} style={isThisMyTx ? { background: 'rgba(99, 102, 241, 0.05)' } : {}}>
                      <td className="mono text-muted">{tx.date}</td>
                      <td>
                        <span className="font-medium">
                          {member ? member.name : isValuation ? 'Fund Revaluation' : (tx.memberName || 'Investor')}
                        </span>
                        {isThisMyTx && (
                          <span className="badge badge-profit mono ml-2" style={{ fontSize: 9, padding: '1px 4px' }}>
                            You
                          </span>
                        )}
                      </td>
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
                      <td>
                        {txStatus === 'pending' ? (
                          <div className="flex items-center gap-1">
                            <span className="badge badge-warning mono" style={{ fontSize: 10, padding: '2px 5px' }}>
                              PENDING
                            </span>
                            {isThisMyTx && onConfirmTransaction && (
                              <button
                                type="button"
                                className="btn btn-primary btn-sm mono"
                                style={{ fontSize: 9, padding: '1px 5px', lineHeight: 1.2 }}
                                onClick={() => onConfirmTransaction(tx.id, 'verified', 'Confirmed by investor')}
                              >
                                Confirm
                              </button>
                            )}
                          </div>
                        ) : txStatus === 'disputed' ? (
                          <span className="badge badge-loss mono" style={{ fontSize: 10, padding: '2px 5px' }} title={tx.verificationNotes || 'Disputed'}>
                            DISPUTED
                          </span>
                        ) : (
                          <span className="badge badge-profit mono" style={{ fontSize: 10, padding: '2px 5px' }}>
                            VERIFIED
                          </span>
                        )}
                      </td>
                      <td className="text-muted text-xs truncate" style={{ maxWidth: 200 }}>
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

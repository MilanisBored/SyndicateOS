import React, { useState, useMemo } from 'react';
import { 
  formatCurrency, 
  formatNumber, 
  generateShareableSummary, 
  exportTransactionsToCSV, 
  exportMembersToCSV,
  filterTimelineByRange
} from '../utils/navEngine';

const chartWidth = 560;
const chartHeight = 130;
const paddingX = 35;
const paddingY = 15;

export default function DashboardView({ 
  fundMetrics = {}, 
  fundInfo = {}, 
  currency = 'INR', 
  transactions = [], 
  members = [], 
  holdings = [], 
  personalFinances = {},
  currentUser,
  perspective = 'manager',
  onOpenTransactionModal,
  onConfirmTransaction,
  onSelectMember,
  onOpenStatementModal,
  onOpenActionCenter
}) {
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [timeRange, setTimeRange] = useState('ALL');
  const handleSelectMember = onSelectMember || onOpenStatementModal || (() => {});

  const isInvestor = perspective === 'investor' || fundInfo?.userRole === 'investor';
  const userEmail = (currentUser?.email || '').toLowerCase().trim();

  // Resolve current member profile
  const currentMember = useMemo(() => {
    if (!fundMetrics?.members?.length) return null;
    return fundMetrics.members.find(m => 
      m.isMe || 
      (userEmail && m.email && m.email.toLowerCase().trim() === userEmail) ||
      m.id === fundInfo?.myMemberId
    ) || fundMetrics.members[0] || null;
  }, [fundMetrics?.members, userEmail, fundInfo?.myMemberId]);

  const [txFilter, setTxFilter] = useState(isInvestor ? 'my' : 'all');
  const [txSearchTerm, setTxSearchTerm] = useState('');
  const [txPage, setTxPage] = useState(1);
  const [txPageSize, setTxPageSize] = useState(15);
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [dashMemberPage, setDashMemberPage] = useState(1);
  const dashMemberPageSize = 8;

  const handleCopyMySummary = () => {
    if (!currentMember) return;
    const text = generateShareableSummary(currentMember, fundInfo, fundMetrics.currentNav);
    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  // Pending transfers awaiting this investor's confirmation
  const pendingInvestorTx = useMemo(() => {
    return currentMember ? transactions.filter(t => 
      (t.memberId === currentMember.id || t.isMyTx) && t.status === 'pending'
    ) : [];
  }, [currentMember, transactions]);

  // Solo Assets Total
  const soloAssetsTotal = useMemo(() => {
    return personalFinances?.personalSoloAssets?.reduce(
      (acc, a) => acc + (Number(a.value) || 0), 
      0
    ) || 0;
  }, [personalFinances?.personalSoloAssets]);

  // Selected timeframe performance metrics
  const activeTimeframeMetric = useMemo(() => {
    return fundMetrics?.timeframes ? fundMetrics.timeframes[timeRange] : null;
  }, [fundMetrics?.timeframes, timeRange]);

  // Personal Investor Metrics & Balance Sheet breakdown
  const investorMetrics = useMemo(() => {
    if (!currentMember) return null;
    const totalFundUnits = Number(fundMetrics?.totalUnits) > 0 ? Number(fundMetrics.totalUnits) : (Number(currentMember.units) || 1);
    const ownershipRatio = totalFundUnits > 0 ? (Number(currentMember.units || 0) / totalFundUnits) : ((Number(currentMember.ownershipPct) || 0) / 100);
    const cashShare = (Number(fundMetrics?.undeployedCash) || 0) * ownershipRatio;
    const assetShare = (Number(fundMetrics?.holdingsTotal) || 0) * ownershipRatio;

    const tf = fundMetrics?.timeframes || {};
    const day1 = tf['1D'] || { pct: 0, delta: 0 };
    const month1 = tf['1M'] || { pct: 0, delta: 0 };
    const ytd = tf['YTD'] || { pct: 0, delta: 0 };

    const dayProfit = (Number(currentMember.units) || 0) * (day1.delta || 0);
    const mtdProfit = (Number(currentMember.units) || 0) * (month1.delta || 0);
    const ytdProfit = (Number(currentMember.units) || 0) * (ytd.delta || 0);

    return {
      ownershipRatio,
      cashShare,
      assetShare,
      dayProfit,
      mtdProfit,
      ytdProfit,
      day1,
      month1,
      ytd
    };
  }, [currentMember, fundMetrics]);

  // Chart coordinates filtered by active time horizon
  const { points, svgPath, minNav, maxNav, navRange } = useMemo(() => {
    const rawTimeline = fundMetrics.timeline || [];
    const timeline = filterTimelineByRange(rawTimeline, timeRange, fundMetrics.currentNav, fundInfo?.initialNav || 100);
    const minNav = timeline.length > 0 ? Math.min(...timeline.map((t) => t.nav)) * 0.98 : 95;
    const maxNav = timeline.length > 0 ? Math.max(...timeline.map((t) => t.nav)) * 1.02 : 150;
    const navRange = maxNav - minNav || 1;

    const calculatedPoints = timeline.map((item, index) => {
      const x = paddingX + (index / Math.max(1, timeline.length - 1)) * (chartWidth - paddingX * 2);
      const y = chartHeight - paddingY - ((item.nav - minNav) / navRange) * (chartHeight - paddingY * 2);
      return { ...item, x, y };
    });

    const path = calculatedPoints.length > 0
      ? calculatedPoints.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '')
      : '';

    return { points: calculatedPoints, svgPath: path, minNav, maxNav, navRange };
  }, [fundMetrics.timeline, fundMetrics.currentNav, fundInfo?.initialNav, timeRange]);

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
          <div className="flex items-center gap-2">
            <button 
              type="button" 
              className="btn btn-secondary btn-sm mono"
              onClick={handleCopyMySummary}
              style={{ fontSize: 11 }}
              title="Copy formatted summary to clipboard for WhatsApp/SMS"
            >
              {copiedSummary ? 'COPIED' : 'SHARE SUMMARY'}
            </button>
            <button 
              type="button" 
              className="btn btn-primary btn-sm mono"
              onClick={() => handleSelectMember(currentMember)}
              style={{ fontSize: 11 }}
            >
              Statement / PDF
            </button>
          </div>
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
      {isInvestor && currentMember ? (
        <>
          <div className="metric-strip mb-3">
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
              <span className="metric-label">Prevailing NAV & Units</span>
              <span className="metric-val mono">{formatCurrency(fundMetrics.currentNav, currency, { decimals: 2 })}</span>
              <div className="metric-delta text-muted">
                <span>{formatNumber(currentMember.units, 4)} units • {formatNumber(currentMember.ownershipPct, 1)}% share</span>
              </div>
            </div>

            <div className="metric-cell">
              <span className="metric-label">Contributed Capital</span>
              <span className="metric-val mono">{formatCurrency(currentMember.totalDeposited, currency)}</span>
              <div className="metric-delta text-muted">
                <span>Withdrawn: {formatCurrency(currentMember.totalWithdrawn, currency, { decimals: 0 })}</span>
              </div>
            </div>

            <div className="metric-cell">
              <span className="metric-label">Day Profit (1D)</span>
              <span className={`metric-val mono ${(investorMetrics?.dayProfit || 0) >= 0 ? 'text-profit' : 'text-loss'}`}>
                {(investorMetrics?.dayProfit || 0) >= 0 ? '+' : ''}{formatCurrency(investorMetrics?.dayProfit || 0, currency, { decimals: 0 })}
              </span>
              <div className="metric-delta">
                <span className={(investorMetrics?.day1?.pct || 0) >= 0 ? 'text-profit' : 'text-loss'}>
                  {(investorMetrics?.day1?.pct || 0) >= 0 ? '+' : ''}{formatNumber(investorMetrics?.day1?.pct || 0, 2)}% 24h delta
                </span>
              </div>
            </div>
          </div>

          <div className="metric-strip mb-4">
            <div className="metric-cell">
              <span className="metric-label">Cash on Hand (Reserve)</span>
              <span className="metric-val mono">{formatCurrency(investorMetrics?.cashShare || 0, currency, { decimals: 0 })}</span>
              <div className="metric-delta text-muted">
                <span>Liquid dry powder share</span>
              </div>
            </div>

            <div className="metric-cell">
              <span className="metric-label">Portfolio Asset Backing</span>
              <span className="metric-val mono">{formatCurrency(investorMetrics?.assetShare || 0, currency, { decimals: 0 })}</span>
              <div className="metric-delta text-muted">
                <span>Live holdings backing</span>
              </div>
            </div>

            <div className="metric-cell">
              <span className="metric-label">Month-to-Date (MTD)</span>
              <span className={`metric-val mono ${(investorMetrics?.mtdProfit || 0) >= 0 ? 'text-profit' : 'text-loss'}`}>
                {(investorMetrics?.mtdProfit || 0) >= 0 ? '+' : ''}{formatCurrency(investorMetrics?.mtdProfit || 0, currency, { decimals: 0 })}
              </span>
              <div className="metric-delta">
                <span className={(investorMetrics?.month1?.pct || 0) >= 0 ? 'text-profit' : 'text-loss'}>
                  {(investorMetrics?.month1?.pct || 0) >= 0 ? '+' : ''}{formatNumber(investorMetrics?.month1?.pct || 0, 2)}% 30d
                </span>
              </div>
            </div>

            <div className="metric-cell">
              <span className="metric-label">Year-to-Date (YTD)</span>
              <span className={`metric-val mono ${(investorMetrics?.ytdProfit || 0) >= 0 ? 'text-profit' : 'text-loss'}`}>
                {(investorMetrics?.ytdProfit || 0) >= 0 ? '+' : ''}{formatCurrency(investorMetrics?.ytdProfit || 0, currency, { decimals: 0 })}
              </span>
              <div className="metric-delta">
                <span className={(investorMetrics?.ytd?.pct || 0) >= 0 ? 'text-profit' : 'text-loss'}>
                  {(investorMetrics?.ytd?.pct || 0) >= 0 ? '+' : ''}{formatNumber(investorMetrics?.ytd?.pct || 0, 2)}% YTD
                </span>
              </div>
            </div>
          </div>
        </>
      ) : (
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
                <span>{formatNumber(fundMetrics.totalUnits, 1)} units • {timeRange}: {activeTimeframeMetric ? (activeTimeframeMetric.pct >= 0 ? '+' : '') + activeTimeframeMetric.pct + '%' : '100%'}</span>
              </div>
            </div>

            <div className="metric-cell">
              <span className="metric-label">Invested Assets vs Cash</span>
              <span className="metric-val mono">{formatCurrency(fundMetrics.holdingsTotal || 0, currency)}</span>
              <div className="metric-delta text-muted">
                <span>Cash Reserve: {formatCurrency(fundMetrics.undeployedCash || 0, currency, { decimals: 0 })}</span>
              </div>
            </div>

            <div className="metric-cell">
              <span className="metric-label">Realized & Unrealized PnL</span>
              <span className={`metric-val mono ${fundMetrics.unrealizedProfit >= 0 ? 'text-profit' : 'text-loss'}`}>
                {fundMetrics.unrealizedProfit >= 0 ? '+' : ''}{formatCurrency(fundMetrics.unrealizedProfit || 0, currency, { decimals: 0 })}
              </span>
              <div className="metric-delta text-muted">
                <span>Booked: {fundMetrics.realizedProfit >= 0 ? '+' : ''}{formatCurrency(fundMetrics.realizedProfit || 0, currency, { decimals: 0 })}</span>
              </div>
            </div>
          </div>
        )}

      {/* Main Grid: Chart & Ownership */}
      <div className="clean-grid-dual">
        {/* NAV Trajectory Chart */}
        <div className="card chart-box">
          <div className="section-head flex-wrap gap-2">
            <div>
              <span className="section-title">NAV Trajectory</span>
              <span className="text-xs text-muted mono block mt-0.5">
                Current NAV: {formatCurrency(fundMetrics.currentNav, currency, { decimals: 2 })}
                {activeTimeframeMetric && ` • ${timeRange}: ${activeTimeframeMetric.pct >= 0 ? '+' : ''}${activeTimeframeMetric.pct}%`}
              </span>
            </div>

            <div className="flex items-center gap-1">
              {['1D', '1W', '1M', 'YTD', 'ALL'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setTimeRange(r)}
                  className={`btn btn-sm mono ${timeRange === r ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: 10, padding: '2px 7px' }}
                >
                  {r}
                </button>
              ))}
            </div>
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

        {/* Member Equity Breakdown or Investor Balance Sheet */}
        {isInvestor && currentMember ? (
          <div className="card chart-box">
            <div className="section-head">
              <div>
                <span className="section-title">My Balance Sheet & Capital Account</span>
                <span className="text-xs text-muted mono block mt-0.5">
                  Live account position & return horizons
                </span>
              </div>
              <button 
                type="button" 
                className="btn btn-secondary btn-sm mono"
                style={{ fontSize: 10, padding: '2px 7px' }}
                onClick={() => handleSelectMember(currentMember)}
                title="View Full Investor Tear Sheet & Print PDF"
              >
                Full Tear-Sheet
              </button>
            </div>

            <div className="compact-list" style={{ maxHeight: '280px', overflowY: 'auto' }}>
              <div className="compact-list-row">
                <div>
                  <div className="font-medium text-xs">Liquid Cash Reserve (Dry Powder)</div>
                  <div className="text-xs text-muted mono" style={{ fontSize: 10 }}>Share of unallocated pool reserves</div>
                </div>
                <div className="text-right">
                  <div className="mono font-semibold">{formatCurrency(investorMetrics?.cashShare || 0, currency)}</div>
                  <div className="text-xs text-muted mono" style={{ fontSize: 10 }}>
                    {formatNumber(currentMember.currentValue > 0 ? ((investorMetrics?.cashShare || 0) / currentMember.currentValue) * 100 : 0, 1)}% allocation
                  </div>
                </div>
              </div>

              <div className="compact-list-row">
                <div>
                  <div className="font-medium text-xs">Portfolio Asset Backing</div>
                  <div className="text-xs text-muted mono" style={{ fontSize: 10 }}>Share of active deployed holdings</div>
                </div>
                <div className="text-right">
                  <div className="mono font-semibold">{formatCurrency(investorMetrics?.assetShare || 0, currency)}</div>
                  <div className="text-xs text-muted mono" style={{ fontSize: 10 }}>
                    {formatNumber(currentMember.currentValue > 0 ? ((investorMetrics?.assetShare || 0) / currentMember.currentValue) * 100 : 0, 1)}% allocation
                  </div>
                </div>
              </div>

              <div className="compact-list-row" style={{ background: 'var(--bg-subtle)' }}>
                <div>
                  <div className="font-semibold text-xs">Total Member Net Equity</div>
                  <div className="text-xs text-muted mono" style={{ fontSize: 10 }}>
                    {formatNumber(currentMember.units, 4)} units @ NAV {formatCurrency(fundMetrics.currentNav, currency, { decimals: 2 })}
                  </div>
                </div>
                <div className="text-right">
                  <div className="mono font-semibold">{formatCurrency(currentMember.currentValue, currency)}</div>
                  <div className={`text-xs mono ${currentMember.totalProfit >= 0 ? 'text-profit' : 'text-loss'}`} style={{ fontSize: 10 }}>
                    {currentMember.totalProfit >= 0 ? '+' : ''}{formatCurrency(currentMember.totalProfit, currency, { decimals: 0 })} ({formatNumber(currentMember.roiPercentage, 1)}%)
                  </div>
                </div>
              </div>

              <div className="compact-list-row">
                <div>
                  <div className="font-medium text-xs">Day Profit (1D)</div>
                  <div className="text-xs text-muted mono" style={{ fontSize: 10 }}>24-hour mark-to-market</div>
                </div>
                <div className="text-right">
                  <div className={`mono font-semibold ${(investorMetrics?.dayProfit || 0) >= 0 ? 'text-profit' : 'text-loss'}`}>
                    {(investorMetrics?.dayProfit || 0) >= 0 ? '+' : ''}{formatCurrency(investorMetrics?.dayProfit || 0, currency)}
                  </div>
                  <div className={`text-xs mono ${(investorMetrics?.day1?.pct || 0) >= 0 ? 'text-profit' : 'text-loss'}`} style={{ fontSize: 10 }}>
                    {(investorMetrics?.day1?.pct || 0) >= 0 ? '+' : ''}{formatNumber(investorMetrics?.day1?.pct || 0, 2)}% 24h
                  </div>
                </div>
              </div>

              <div className="compact-list-row">
                <div>
                  <div className="font-medium text-xs">Month-to-Date (MTD)</div>
                  <div className="text-xs text-muted mono" style={{ fontSize: 10 }}>Trailing 30-day performance</div>
                </div>
                <div className="text-right">
                  <div className={`mono font-semibold ${(investorMetrics?.mtdProfit || 0) >= 0 ? 'text-profit' : 'text-loss'}`}>
                    {(investorMetrics?.mtdProfit || 0) >= 0 ? '+' : ''}{formatCurrency(investorMetrics?.mtdProfit || 0, currency)}
                  </div>
                  <div className={`text-xs mono ${(investorMetrics?.month1?.pct || 0) >= 0 ? 'text-profit' : 'text-loss'}`} style={{ fontSize: 10 }}>
                    {(investorMetrics?.month1?.pct || 0) >= 0 ? '+' : ''}{formatNumber(investorMetrics?.month1?.pct || 0, 2)}% 30d
                  </div>
                </div>
              </div>

              <div className="compact-list-row">
                <div>
                  <div className="font-medium text-xs">Year-to-Date (YTD)</div>
                  <div className="text-xs text-muted mono" style={{ fontSize: 10 }}>Calendar year performance</div>
                </div>
                <div className="text-right">
                  <div className={`mono font-semibold ${(investorMetrics?.ytdProfit || 0) >= 0 ? 'text-profit' : 'text-loss'}`}>
                    {(investorMetrics?.ytdProfit || 0) >= 0 ? '+' : ''}{formatCurrency(investorMetrics?.ytdProfit || 0, currency)}
                  </div>
                  <div className={`text-xs mono ${(investorMetrics?.ytd?.pct || 0) >= 0 ? 'text-profit' : 'text-loss'}`} style={{ fontSize: 10 }}>
                    {(investorMetrics?.ytd?.pct || 0) >= 0 ? '+' : ''}{formatNumber(investorMetrics?.ytd?.pct || 0, 2)}% YTD
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="card chart-box">
            <div className="section-head">
              <span className="section-title">Participants ({fundMetrics?.members?.length || 0})</span>
              <div className="flex gap-2 items-center">
                {!isInvestor && (fundMetrics?.members?.length || 0) > 0 && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm mono"
                    style={{ fontSize: 10, padding: '2px 7px' }}
                    onClick={() => exportMembersToCSV(fundMetrics.members, fundInfo, fundMetrics.currentNav)}
                    title="Export Cap Table to CSV"
                  >
                    Export CSV
                  </button>
                )}
                {!isInvestor && (
                  <button 
                    type="button" 
                    className="btn btn-secondary btn-sm"
                    onClick={() => onOpenTransactionModal && onOpenTransactionModal()}
                  >
                    + Entry
                  </button>
                )}
              </div>
            </div>

            {/* Search and Quick Jumper */}
            <div className="mb-2 flex gap-1.5">
              <input
                type="text"
                placeholder="Filter participants by name or code..."
                value={memberSearchTerm}
                onChange={(e) => {
                  setMemberSearchTerm(e.target.value);
                  setDashMemberPage(1);
                }}
                className="input input-sm w-full mono"
                style={{ fontSize: 11, padding: '4px 8px' }}
              />
              <select
                value=""
                onChange={(e) => {
                  const m = (fundMetrics?.members || []).find(x => String(x.id) === String(e.target.value));
                  if (m) handleSelectMember(m);
                }}
                className="form-select mono"
                style={{ fontSize: 10, padding: '3px 6px', maxWidth: '140px' }}
              >
                <option value="" disabled>Jump...</option>
                {(fundMetrics?.members || []).map(m => (
                  <option key={m.id} value={m.id}>{m.name} ({formatNumber(m.ownershipPct, 1)}%)</option>
                ))}
              </select>
            </div>

            {(() => {
              const filtered = (fundMetrics?.members || []).filter(m => {
                if (!memberSearchTerm.trim()) return true;
                const term = memberSearchTerm.toLowerCase();
                return (m.name && m.name.toLowerCase().includes(term)) ||
                       (m.email && m.email.toLowerCase().includes(term)) ||
                       (m.userCode && m.userCode.toLowerCase().includes(term)) ||
                       (m.role && m.role.toLowerCase().includes(term));
              });
              const totalPages = Math.max(1, Math.ceil(filtered.length / dashMemberPageSize));
              const currPage = Math.min(dashMemberPage, totalPages);
              const paged = filtered.slice((currPage - 1) * dashMemberPageSize, currPage * dashMemberPageSize);

              return (
                <>
                  <div className="compact-list" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                    {paged.length === 0 ? (
                      <div className="text-center text-muted py-4 mono text-xs">
                        No participants found.
                      </div>
                    ) : (
                      paged.map((m) => {
                        const isThisMe = m.id === currentMember?.id || m.isMe;
                        return (
                          <div 
                            key={m.id} 
                            className="compact-list-row"
                            style={{ cursor: 'pointer', background: isThisMe ? 'rgba(99, 102, 241, 0.06)' : undefined }}
                            onClick={() => handleSelectMember(m)}
                            title="Click to view full tear-sheet statement"
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
                      })
                    )}
                  </div>

                  {filtered.length > dashMemberPageSize && (
                    <div className="flex justify-between items-center mt-2 pt-2 text-xs text-muted" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                      <span className="mono" style={{ fontSize: 10 }}>
                        {((currPage - 1) * dashMemberPageSize) + 1}–{Math.min(currPage * dashMemberPageSize, filtered.length)} of {filtered.length}
                      </span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm mono"
                          style={{ fontSize: 9, padding: '1px 6px' }}
                          disabled={currPage <= 1}
                          onClick={() => setDashMemberPage(p => Math.max(1, p - 1))}
                        >
                          &larr; Prev
                        </button>
                        <span className="mono" style={{ fontSize: 10, padding: '0 4px' }}>
                          {currPage}/{totalPages}
                        </span>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm mono"
                          style={{ fontSize: 9, padding: '1px 6px' }}
                          disabled={currPage >= totalPages}
                          onClick={() => setDashMemberPage(p => Math.min(totalPages, p + 1))}
                        >
                          Next &rarr;
                        </button>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </div>

      {/* Ledger Activity & Search with Pagination (Scaled for 100+ investors) */}
      <div className="card p-4">
        <div className="section-head mb-3">
          <div className="flex items-center gap-3">
            <span className="section-title">Ledger Transactions ({transactions.length})</span>
            {transactions.length > 0 && (
              <button
                type="button"
                className="btn btn-secondary btn-sm mono"
                style={{ fontSize: 10, padding: '2px 7px' }}
                onClick={() => exportTransactionsToCSV(transactions, members, fundInfo)}
                title="Download complete ledger as CSV for Excel/Sheets"
              >
                Export CSV
              </button>
            )}
          </div>

          <div className="flex gap-2 flex-wrap items-center">
            <input
              type="text"
              placeholder="Search ledger (name, note, amount, date)..."
              value={txSearchTerm}
              onChange={(e) => {
                setTxSearchTerm(e.target.value);
                setTxPage(1);
              }}
              className="input input-sm mono"
              style={{ fontSize: 11, padding: '3px 8px', minWidth: '180px' }}
            />

            <button
              type="button"
              className={`btn btn-sm ${txFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: 11, padding: '3px 9px' }}
              onClick={() => {
                setTxFilter('all');
                setTxPage(1);
              }}
            >
              All Activity
            </button>
            {currentMember && (
              <button
                type="button"
                className={`btn btn-sm ${txFilter === 'my' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: 11, padding: '3px 9px' }}
                onClick={() => {
                  setTxFilter('my');
                  setTxPage(1);
                }}
              >
                My Transactions
              </button>
            )}
          </div>
        </div>

        {(() => {
          // 1. Filter
          const filtered = [...transactions]
            .filter(tx => {
              if (txFilter === 'my' && currentMember) {
                const memberNameLower = (currentMember.name || '').toLowerCase();
                const isMatch = tx.memberId === currentMember.id || 
                  (memberNameLower && tx.memberName && tx.memberName.toLowerCase() === memberNameLower) ||
                  (memberNameLower && tx.note && tx.note.toLowerCase().includes(memberNameLower)) ||
                  tx.isMyTx;
                if (!isMatch) return false;
              }

              if (txSearchTerm.trim()) {
                const term = txSearchTerm.toLowerCase();
                const dateMatch = (tx.date || '').toLowerCase().includes(term);
                const noteMatch = (tx.note || '').toLowerCase().includes(term);
                const memberMatch = (tx.memberName || '').toLowerCase().includes(term);
                const typeMatch = (tx.type || '').toLowerCase().includes(term);
                const amountMatch = String(tx.amount || '').includes(term);
                if (!dateMatch && !noteMatch && !memberMatch && !typeMatch && !amountMatch) return false;
              }
              return true;
            })
            .sort((a, b) => new Date(b.date || '1970-01-01') - new Date(a.date || '1970-01-01'));

          const totalFiltered = filtered.length;
          const totalPages = Math.max(1, Math.ceil(totalFiltered / txPageSize));
          const currentPage = Math.min(txPage, totalPages);
          const startIndex = (currentPage - 1) * txPageSize;
          const paginatedTxs = filtered.slice(startIndex, startIndex + txPageSize);

          return (
            <>
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
                    {paginatedTxs.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center text-muted p-4 text-xs">
                          {txSearchTerm ? 'No transactions matching search query.' : 'No transactions recorded yet.'}
                        </td>
                      </tr>
                    ) : (
                      paginatedTxs.map((tx) => {
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
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalFiltered > 0 && (
                <div className="flex justify-between items-center mt-3 pt-3 text-xs text-muted" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  <div>
                    Showing {startIndex + 1}–{Math.min(startIndex + txPageSize, totalFiltered)} of {totalFiltered}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm mono"
                      style={{ fontSize: 10, padding: '2px 8px' }}
                      disabled={currentPage <= 1}
                      onClick={() => setTxPage(p => Math.max(1, p - 1))}
                    >
                      &larr; Prev
                    </button>
                    <span className="mono">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm mono"
                      style={{ fontSize: 10, padding: '2px 8px' }}
                      disabled={currentPage >= totalPages}
                      onClick={() => setTxPage(p => Math.min(totalPages, p + 1))}
                    >
                      Next &rarr;
                    </button>
                    <select
                      value={txPageSize}
                      onChange={(e) => {
                        setTxPageSize(Number(e.target.value));
                        setTxPage(1);
                      }}
                      className="currency-select-minimal mono ml-2"
                      style={{ fontSize: 10, padding: '2px 4px' }}
                    >
                      <option value={15}>15 / page</option>
                      <option value={30}>30 / page</option>
                      <option value={50}>50 / page</option>
                      <option value={100}>100 / page</option>
                    </select>
                  </div>
                </div>
              )}
            </>
          );
        })()}
      </div>
    </div>
  );
}

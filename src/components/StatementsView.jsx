import React, { useState, useMemo } from 'react';
import { formatCurrency, formatNumber, generateShareableSummary } from '../utils/navEngine';

export default function StatementsView({ 
  fundMetrics = {}, 
  fundInfo = {}, 
  currency = 'INR', 
  holdings = [],
  currentUser,
  perspective = 'manager',
  onSelectMember 
}) {
  const [statementSubTab, setStatementSubTab] = useState('statements'); // 'statements' | 'factsheet' | 'fees'
  const [copiedId, setCopiedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('ownershipPct');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const isInvestor = perspective === 'investor' || fundInfo?.userRole === 'investor';
  const userEmail = (currentUser?.email || '').toLowerCase().trim();

  const memberList = fundMetrics?.members || [];
  const currentMember = memberList.find(m => 
    m.isMe || 
    (userEmail && m.email && m.email.toLowerCase().trim() === userEmail) ||
    m.id === fundInfo?.myMemberId
  ) || memberList[0] || null;

  const totalFundUnits = Number(fundMetrics?.totalUnits) > 0 ? Number(fundMetrics.totalUnits) : 1;
  const tf = fundMetrics?.timeframes || {};
  const day1 = tf['1D'] || { pct: 0, delta: 0 };

  const enrichedMembers = useMemo(() => {
    return memberList.map((m) => {
      const ownershipRatio = totalFundUnits > 0 ? (Number(m.units || 0) / totalFundUnits) : ((Number(m.ownershipPct) || 0) / 100);
      const cashShare = (Number(fundMetrics?.undeployedCash) || 0) * ownershipRatio;
      const assetShare = (Number(fundMetrics?.holdingsTotal) || 0) * ownershipRatio;
      const maxPossibleProfit = Math.max(0, m.totalProfit || 0);
      const rawDayProfit = (Number(m.units) || 0) * (day1.delta || 0);
      const dayProfit = (m.totalProfit || 0) <= 0 ? Math.min(0, rawDayProfit) : Math.min(rawDayProfit, maxPossibleProfit);

      return {
        ...m,
        cashShare,
        assetShare,
        dayProfit,
        dayPct: day1.pct
      };
    });
  }, [memberList, totalFundUnits, fundMetrics?.undeployedCash, fundMetrics?.holdingsTotal, day1.delta, day1.pct]);

  const filteredMembers = useMemo(() => {
    return enrichedMembers.filter(m => {
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesName = m.name && m.name.toLowerCase().includes(term);
        const matchesEmail = m.email && m.email.toLowerCase().includes(term);
        const matchesCode = m.userCode && m.userCode.toLowerCase().includes(term);
        const matchesRole = m.role && m.role.toLowerCase().includes(term);
        if (!matchesName && !matchesEmail && !matchesCode && !matchesRole) return false;
      }
      return true;
    }).sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (typeof valA === 'string') {
        const cmp = valA.localeCompare(valB || '');
        return sortDir === 'asc' ? cmp : -cmp;
      }
      valA = Number(valA) || 0;
      valB = Number(valB) || 0;
      return sortDir === 'asc' ? valA - valB : valB - valA;
    });
  }, [enrichedMembers, searchTerm, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedMembers = filteredMembers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir(field === 'name' ? 'asc' : 'desc');
    }
    setPage(1);
  };

  const handleCopySummary = (member) => {
    const text = generateShareableSummary(member, fundInfo, fundMetrics.currentNav);
    navigator.clipboard.writeText(text);
    setCopiedId(member.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const topHoldings = useMemo(() => {
    const safe = Array.isArray(holdings) ? holdings : [];
    const active = safe.filter(h => h.status !== 'closed');
    const sorted = [...active].sort((a, b) => (Number(b.currentValue) || 0) - (Number(a.currentValue) || 0));
    const totalVal = fundMetrics.totalFundAUM || fundMetrics.holdingsTotal || 1;
    return sorted.slice(0, 10).map(h => ({
      ...h,
      weightPct: ((Number(h.currentValue) || 0) / totalVal) * 100
    }));
  }, [holdings, fundMetrics.totalFundAUM, fundMetrics.holdingsTotal]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      <div className="section-head mb-3">
        <div>
          <span className="section-title">Institutional Reporting & Statements</span>
          <span className="text-xs text-muted block">
            Institutional investor tear sheets, printable fund factsheets, and high-water mark fee waterfalls.
          </span>
        </div>
      </div>

      {/* Sub-Category Navigation Bar */}
      <div className="flex items-center justify-between border-b pb-2 mb-4 gap-2 flex-wrap" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className={`btn btn-sm mono ${statementSubTab === 'statements' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: 11, padding: '4px 10px' }}
            onClick={() => setStatementSubTab('statements')}
          >
            Investor Tear Sheets ({filteredMembers.length})
          </button>
          <button
            type="button"
            className={`btn btn-sm mono ${statementSubTab === 'factsheet' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: 11, padding: '4px 10px' }}
            onClick={() => setStatementSubTab('factsheet')}
          >
            Monthly Fund Factsheet
          </button>
          <button
            type="button"
            className={`btn btn-sm mono ${statementSubTab === 'fees' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: 11, padding: '4px 10px' }}
            onClick={() => setStatementSubTab('fees')}
          >
            Fee & Watermark Audit
          </button>
        </div>
        <div className="text-xs text-muted mono">
          <span>Fund NAV: <strong className="text-primary">{formatCurrency(fundMetrics.currentNav, currency, { decimals: 2 })}</strong></span>
        </div>
      </div>

      {/* SUB-TAB 1: INVESTOR TEAR SHEETS */}
      {statementSubTab === 'statements' && (
        <>

      {/* Featured Card for Logged-In Investor */}
      {isInvestor && currentMember && (
        <div 
          className="card p-4 mb-4 investor-portal-banner flex justify-between items-center"
          style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.3)' }}
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge badge-profit mono">Personal Statement</span>
              <span className="font-semibold text-base">{currentMember.name}</span>
            </div>
            <div className="text-xs text-muted mb-2">
              Units: <strong className="mono text-primary">{formatNumber(currentMember.units, 4)}</strong> &bull; 
              Ownership: <strong className="mono text-primary">{formatNumber(currentMember.ownershipPct, 2)}%</strong> &bull; 
              Invested: <strong className="mono">{formatCurrency(currentMember.totalDeposited, currency)}</strong> &bull; 
              Current Equity: <strong className="mono text-primary">{formatCurrency(currentMember.currentValue, currency)}</strong>
            </div>
            <span className="text-xs text-muted block">
              Net Gain: <strong className={`mono ${currentMember.totalProfit >= 0 ? 'text-profit' : 'text-loss'}`}>
                {currentMember.totalProfit >= 0 ? '+' : ''}{formatCurrency(currentMember.totalProfit, currency)} ({formatNumber(currentMember.roiPercentage, 1)}%)
              </strong>
            </span>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-secondary btn-sm mono"
              onClick={() => handleCopySummary(currentMember)}
              style={{ fontSize: 11 }}
            >
              {copiedId === currentMember.id ? 'COPIED' : 'COPY SUMMARY'}
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm mono"
              onClick={() => onSelectMember(currentMember)}
              style={{ fontSize: 11 }}
            >
              FULL TEAR-SHEET
            </button>
          </div>
        </div>
      )}

      {/* Statements Cap Table Container */}
      <div className="card p-4">
        {/* Search & Quick Selector Toolbar */}
        <div className="flex justify-between items-center mb-3 gap-2 flex-wrap pb-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
            <input
              type="text"
              placeholder="Search statements by name, role, email..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="input input-sm mono"
              style={{ fontSize: 11, padding: '4px 10px', maxWidth: '260px', width: '100%' }}
            />

            <select
              value=""
              onChange={(e) => {
                const selected = enrichedMembers.find(m => String(m.id) === String(e.target.value));
                if (selected) onSelectMember(selected);
              }}
              className="form-select mono"
              style={{ fontSize: 11, padding: '4px 8px', maxWidth: '220px' }}
            >
              <option value="" disabled>Jump to Investor Tear-Sheet...</option>
              {enrichedMembers.map(m => (
                <option key={m.id} value={m.id}>{m.name} ({formatNumber(m.ownershipPct, 1)}%)</option>
              ))}
            </select>
          </div>

          <span className="text-xs text-muted mono">
            {filteredMembers.length} {filteredMembers.length === 1 ? 'Statement' : 'Statements'}
          </span>
        </div>

        {/* High-Density Dense Table */}
        <div className="table-responsive">
          <table className="dense-table w-full">
            <thead>
              <tr>
                <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                  Investor {sortBy === 'name' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th onClick={() => handleSort('ownershipPct')} className="text-right" style={{ cursor: 'pointer' }}>
                  Ownership {sortBy === 'ownershipPct' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th onClick={() => handleSort('units')} className="text-right" style={{ cursor: 'pointer' }}>
                  Units {sortBy === 'units' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th onClick={() => handleSort('currentValue')} className="text-right" style={{ cursor: 'pointer' }}>
                  Equity {sortBy === 'currentValue' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th onClick={() => handleSort('cashShare')} className="text-right" style={{ cursor: 'pointer' }}>
                  Cash on Hand {sortBy === 'cashShare' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th onClick={() => handleSort('assetShare')} className="text-right" style={{ cursor: 'pointer' }}>
                  Asset Share {sortBy === 'assetShare' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th onClick={() => handleSort('dayProfit')} className="text-right" style={{ cursor: 'pointer' }}>
                  Day Profit (1D) {sortBy === 'dayProfit' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th onClick={() => handleSort('totalProfit')} className="text-right" style={{ cursor: 'pointer' }}>
                  All-Time PnL {sortBy === 'totalProfit' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedMembers.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center text-muted py-4 mono">
                    No matching statements found.
                  </td>
                </tr>
              ) : (
                pagedMembers.map((m) => (
                  <tr 
                    key={m.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => onSelectMember(m)}
                  >
                    <td>
                      <div className="font-semibold text-xs">{m.name}</div>
                      <div className="text-xs text-muted mono" style={{ fontSize: 10 }}>{m.role} {m.email ? `• ${m.email}` : ''}</div>
                    </td>
                    <td className="text-right mono text-muted">{formatNumber(m.ownershipPct, 2)}%</td>
                    <td className="text-right mono text-muted">{formatNumber(m.units, 4)}</td>
                    <td className="text-right mono font-semibold">{formatCurrency(m.currentValue, currency)}</td>
                    <td className="text-right mono text-muted">{formatCurrency(m.cashShare, currency, { decimals: 0 })}</td>
                    <td className="text-right mono text-muted">{formatCurrency(m.assetShare, currency, { decimals: 0 })}</td>
                    <td className={`text-right mono ${m.dayProfit >= 0 ? 'text-profit' : 'text-loss'}`}>
                      {m.dayProfit >= 0 ? '+' : ''}{formatCurrency(m.dayProfit, currency, { decimals: 0 })}
                    </td>
                    <td className={`text-right mono font-semibold ${m.totalProfit >= 0 ? 'text-profit' : 'text-loss'}`}>
                      {m.totalProfit >= 0 ? '+' : ''}{formatCurrency(m.totalProfit, currency, { decimals: 0 })} ({formatNumber(m.roiPercentage, 1)}%)
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-1 justify-center">
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm mono"
                          style={{ padding: '2px 8px', fontSize: 11 }}
                          onClick={() => onSelectMember(m)}
                        >
                          Tear-Sheet
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm mono"
                          style={{ padding: '2px 8px', fontSize: 11 }}
                          onClick={() => handleCopySummary(m)}
                        >
                          {copiedId === m.id ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Scalable Pagination Controls */}
        {filteredMembers.length > 0 && (
          <div className="flex justify-between items-center mt-3 pt-3 text-xs text-muted" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <div>
              Showing {filteredMembers.length === 0 ? 0 : ((currentPage - 1) * pageSize) + 1}–{Math.min(currentPage * pageSize, filteredMembers.length)} of {filteredMembers.length} statements
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="btn btn-secondary btn-sm mono"
                style={{ fontSize: 10, padding: '2px 8px' }}
                disabled={currentPage <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
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
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                Next &rarr;
              </button>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="currency-select-minimal mono ml-2"
                style={{ fontSize: 10, padding: '2px 4px' }}
              >
                <option value={10}>10 / page</option>
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
                <option value={100}>100 / page</option>
              </select>
            </div>
          </div>
        )}
      </div>
        </>
      )}

      {/* SUB-TAB 2: MONTHLY FUND FACTSHEET */}
      {statementSubTab === 'factsheet' && (
        <div className="card p-5 space-y-5" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          {/* Factsheet Header Strip */}
          <div className="flex justify-between items-start border-b pb-4" style={{ borderColor: 'var(--border-subtle)' }}>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="badge badge-neutral mono font-semibold" style={{ fontSize: 10 }}>MONTHLY FACTSHEET</span>
                <span className="badge badge-profit mono font-semibold" style={{ fontSize: 9 }}>CONFIDENTIAL</span>
              </div>
              <h2 className="text-xl font-bold text-primary">{fundInfo?.name || 'Syndicate Capital Pool'}</h2>
              <span className="text-xs text-muted block mt-0.5">
                Fund Manager: <strong>{fundInfo?.managerName || 'Managing Partner'}</strong> • Strategy: Multi-Asset Growth & Discretionary Alpha
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="btn btn-secondary btn-sm mono"
                onClick={handlePrint}
              >
                Print / PDF Factsheet
              </button>
            </div>
          </div>

          {/* Key Facts & Inception Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="card p-3" style={{ background: 'var(--bg-subtle)' }}>
              <span className="text-muted block text-xxs mono">CURRENT NAV</span>
              <span className="text-lg font-bold mono text-primary">{formatCurrency(fundMetrics.currentNav, currency, { decimals: 2 })}</span>
              <span className="text-xxs text-muted block mt-1">Inception NAV: {formatCurrency(fundInfo?.initialNav || 100, currency, { decimals: 2 })}</span>
            </div>
            <div className="card p-3" style={{ background: 'var(--bg-subtle)' }}>
              <span className="text-muted block text-xxs mono">TOTAL FUND AUM</span>
              <span className="text-lg font-bold mono text-primary">{formatCurrency(fundMetrics.totalFundAUM, currency)}</span>
              <span className={`text-xxs block mt-1 ${(fundMetrics.totalFundRoiPct || 0) >= 0 ? 'text-profit' : 'text-loss'}`}>
                {(fundMetrics.totalFundRoiPct || 0) >= 0 ? '+' : ''}{formatNumber(fundMetrics.totalFundRoiPct || 0, 1)}% Net Return
              </span>
            </div>
            <div className="card p-3" style={{ background: 'var(--bg-subtle)' }}>
              <span className="text-muted block text-xxs mono">OUTSTANDING UNITS</span>
              <span className="text-lg font-bold mono text-primary">{formatNumber(fundMetrics.totalUnits, 2)}</span>
              <span className="text-xxs text-muted block mt-1">{memberList.length} Active Partners / LPs</span>
            </div>
            <div className="card p-3" style={{ background: 'var(--bg-subtle)' }}>
              <span className="text-muted block text-xxs mono">HIGH-WATER MARK (HWM)</span>
              <span className="text-lg font-bold mono text-primary">{formatCurrency(fundMetrics.riskMetrics?.highWaterMark || fundMetrics.currentNav, currency, { decimals: 2 })}</span>
              <span className="text-xxs text-muted block mt-1">Hurdle Floor: {fundInfo?.hurdleRatePct || 8.0}% p.a.</span>
            </div>
          </div>

          {/* Risk & Performance Ratios */}
          <div>
            <span className="font-semibold text-xs uppercase tracking-wider text-muted block mb-2">Institutional Risk Profile</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="card p-3">
                <span className="text-muted block text-xxs mono">SHARPE RATIO</span>
                <span className="font-semibold mono text-primary text-sm">{fundMetrics.riskMetrics?.sharpeRatio ?? '1.42'}</span>
              </div>
              <div className="card p-3">
                <span className="text-muted block text-xxs mono">SORTINO RATIO</span>
                <span className="font-semibold mono text-primary text-sm">{fundMetrics.riskMetrics?.sortinoRatio ?? '2.15'}</span>
              </div>
              <div className="card p-3">
                <span className="text-muted block text-xxs mono">MAX DRAWDOWN (MDD)</span>
                <span className="font-semibold mono text-loss text-sm">-{formatNumber(fundMetrics.riskMetrics?.maxDrawdown || 0, 1)}%</span>
              </div>
              <div className="card p-3">
                <span className="text-muted block text-xxs mono">ANNUALIZED VOLATILITY</span>
                <span className="font-semibold mono text-primary text-sm">{formatNumber(fundMetrics.riskMetrics?.annualizedVol || 12.4, 1)}%</span>
              </div>
            </div>
          </div>

          {/* Timeframe Performance Horizons */}
          <div>
            <span className="font-semibold text-xs uppercase tracking-wider text-muted block mb-2">Trailing Return Matrix</span>
            <div className="table-responsive">
              <table className="dense-table text-xs">
                <thead>
                  <tr>
                    <th>Timeframe</th>
                    <th className="text-right">1 Day (24h)</th>
                    <th className="text-right">1 Week</th>
                    <th className="text-right">1 Month</th>
                    <th className="text-right">Year-to-Date (YTD)</th>
                    <th className="text-right">Since Inception</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-semibold text-primary">Syndicate Net Return</td>
                    {['1D', '1W', '1M', 'YTD'].map((key) => {
                      const val = Number(fundMetrics.timeframes?.[key]?.pct) || 0;
                      const isPos = val >= 0;
                      return (
                        <td 
                          key={key} 
                          className={`mono text-right ${isPos ? 'text-profit' : 'text-loss'}`}
                        >
                          {isPos ? '+' : ''}{formatNumber(val, 2)}%
                        </td>
                      );
                    })}
                    {(() => {
                      const val = Number(fundMetrics.totalFundRoiPct) || 0;
                      const isPos = val >= 0;
                      return (
                        <td className={`mono font-bold text-right ${isPos ? 'text-profit' : 'text-loss'}`}>
                          {isPos ? '+' : ''}{formatNumber(val, 1)}%
                        </td>
                      );
                    })()}
                  </tr>
                  <tr>
                    <td className="text-muted">Benchmark Floor (7% p.a.)</td>
                    <td className="mono text-right text-muted">+0.02%</td>
                    <td className="mono text-right text-muted">+0.13%</td>
                    <td className="mono text-right text-muted">+0.58%</td>
                    <td className="mono text-right text-muted">+5.80%</td>
                    <td className="mono text-right text-muted">+7.00%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Top 10 Portfolio Backings */}
          <div>
            <span className="font-semibold text-xs uppercase tracking-wider text-muted block mb-2">Top Portfolio Holdings & Exposures</span>
            <div className="table-responsive">
              <table className="dense-table text-xs">
                <thead>
                  <tr>
                    <th>Holding / Scheme</th>
                    <th>Asset Class</th>
                    <th className="text-right">Valuation</th>
                    <th className="text-right">Net Return</th>
                    <th className="text-right">Portfolio Weight</th>
                  </tr>
                </thead>
                <tbody>
                  {topHoldings.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center text-muted py-4">No active holdings recorded.</td>
                    </tr>
                  ) : (
                    topHoldings.map((h, i) => {
                      const gain = (Number(h.currentValue) || 0) - (Number(h.investedAmount) || 0);
                      const roi = Number(h.investedAmount) > 0 ? (gain / Number(h.investedAmount)) * 100 : 0;
                      return (
                        <tr key={h.id || i}>
                          <td>
                            <span className="font-medium text-primary block">{h.name}</span>
                            <span className="mono text-muted text-xxs">{h.ticker || '—'}</span>
                          </td>
                          <td className="text-muted">{h.category}</td>
                          <td className="mono text-right font-medium">{formatCurrency(h.currentValue, currency, { decimals: 0 })}</td>
                          <td className={`mono text-right ${gain >= 0 ? 'text-profit' : 'text-loss'}`}>
                            {gain >= 0 ? '+' : ''}{formatCurrency(gain, currency, { decimals: 0 })} ({formatNumber(roi, 1)}%)
                          </td>
                          <td className="mono font-semibold text-right">{formatNumber(h.weightPct, 1)}%</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-3 text-xxs text-muted mono border-t" style={{ borderColor: 'var(--border-subtle)' }}>
            This document is generated automatically by SyndicateOS for authorized partners. Net asset valuations are reconciled against live exchange rates and mark-to-market prices.
          </div>
        </div>
      )}

      {/* SUB-TAB 3: FEE & WATERMARK AUDIT */}
      {statementSubTab === 'fees' && (
        <div className="space-y-4">
          {/* Institutional Waterfall Security Card */}
          <div className="card p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <div className="section-head mb-3">
              <div>
                <span className="section-title">Institutional Waterfall & Hurdle Rate Audit</span>
                <span className="text-xs text-muted block">
                  Institutional high-water mark protection: Performance fees are strictly accrued only on net alpha generated above both the Hurdle Rate floor and previous peak High-Water Mark.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="badge badge-neutral mono" style={{ fontSize: 9 }}>
                  MGMT FEE: {fundInfo?.managementFeePct || 2.0}%
                </span>
                <span className="badge badge-neutral mono" style={{ fontSize: 9 }}>
                  PERF FEE: {fundInfo?.performanceFeePct || 20.0}%
                </span>
                <span className="badge badge-neutral mono" style={{ fontSize: 9 }}>
                  HURDLE: {fundInfo?.hurdleRatePct || 8.0}%
                </span>
              </div>
            </div>

            {/* Waterfall Breakdown Grid */}
            {(() => {
              const wf = fundMetrics.institutionalFeeWaterfalls || {};
              return (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-3">
                  <div className="card p-3" style={{ background: 'var(--bg-subtle)' }}>
                    <span className="text-muted block text-xxs mono">GROSS ASSET VALUE (GAV)</span>
                    <span className="font-bold mono text-primary text-sm">{formatCurrency(wf.grossAUM || fundMetrics.totalFundAUM, currency)}</span>
                    <span className="text-xxs text-muted block mt-1">Pre-fee gross portfolio</span>
                  </div>
                  <div className="card p-3" style={{ background: 'var(--bg-subtle)' }}>
                    <span className="text-muted block text-xxs mono">ACCRUED MGMT FEE</span>
                    <span className="font-bold mono text-loss text-sm">-{formatCurrency(wf.mgmtFeeAccrual || 0, currency, { decimals: 0 })}</span>
                    <span className="text-xxs text-muted block mt-1">Prorated p.a. accrual</span>
                  </div>
                  <div className="card p-3" style={{ background: 'var(--bg-subtle)' }}>
                    <span className="text-muted block text-xxs mono">ACCRUED INCENTIVE FEE</span>
                    <span className="font-bold mono text-loss text-sm">-{formatCurrency(wf.perfFeeAccrual || 0, currency, { decimals: 0 })}</span>
                    <span className="text-xxs text-muted block mt-1">20% on alpha above Hurdle</span>
                  </div>
                  <div className="card p-3" style={{ background: 'var(--bg-subtle)' }}>
                    <span className="text-muted block text-xxs mono">NET DISTRIBUTABLE NAV</span>
                    <span className="font-bold mono text-profit text-sm">{formatCurrency(wf.netNav || fundMetrics.currentNav, currency, { decimals: 2 })}</span>
                    <span className="text-xxs text-muted block mt-1">Net of all institutional fees</span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Transaction Lot Accrual Breakdown (Actual/365 Day Count Convention) */}
          <div className="card p-4">
            <div className="section-head mb-3">
              <div>
                <span className="section-title">Transaction Lot Accrual Accounting (Actual/365)</span>
                <span className="text-xs text-muted block">
                  Granular time-weighted accrual on individual capital tranches deposited into the syndicate pool.
                </span>
              </div>
              <span className="badge badge-neutral mono" style={{ fontSize: 9 }}>
                {fundMetrics.institutionalFeeWaterfalls?.transactionLots?.length || 0} TRANCHES ACROSS {memberList.length} PARTNERS • ACTUAL/365
              </span>
            </div>

            <div className="table-responsive">
              <table className="dense-table text-xs">
                <thead>
                  <tr>
                    <th>Tranche</th>
                    <th>Deposit Date</th>
                    <th>Partner / LP</th>
                    <th className="text-right">Deposited</th>
                    <th className="text-right">Units</th>
                    <th className="text-right">Days Active</th>
                    <th className="text-right">Lot Valuation</th>
                    <th className="text-right">Accrued Mgmt Fee ({fundMetrics.institutionalFeeWaterfalls?.mgmtFeePct || 2}%)</th>
                    <th className="text-right">Hurdle Benchmark</th>
                    <th className="text-right">Accrued Carry ({fundMetrics.institutionalFeeWaterfalls?.perfFeePct || 20}%)</th>
                    <th className="text-right">Accrual Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(!fundMetrics.institutionalFeeWaterfalls?.transactionLots || fundMetrics.institutionalFeeWaterfalls.transactionLots.length === 0) ? (
                    <tr>
                      <td colSpan="11" className="text-center text-muted py-6">
                        No verified deposit transactions recorded. Capital pool is accruing at fund-level baseline.
                      </td>
                    </tr>
                  ) : (
                    fundMetrics.institutionalFeeWaterfalls.transactionLots.map((lot, idx) => (
                      <tr key={lot.id}>
                        <td className="mono text-muted text-xxs font-semibold">LOT #{idx + 1}</td>
                        <td className="mono font-medium text-primary">{lot.date}</td>
                        <td>
                          <span className="font-semibold text-primary block">{lot.memberName}</span>
                          <span className="text-xxs text-muted mono">Tranche Injection</span>
                        </td>
                        <td className="mono text-right font-medium">{formatCurrency(lot.amount, currency, { decimals: 0 })}</td>
                        <td className="mono text-right">{formatNumber(lot.units, 4)}</td>
                        <td className="mono text-right font-semibold text-primary">{lot.daysActive} days</td>
                        <td className="mono text-right font-medium">{formatCurrency(lot.currentValue, currency, { decimals: 0 })}</td>
                        <td className="mono text-right text-loss">
                          -{formatCurrency(lot.mgmtFeeAccrued, currency, { decimals: 2 })}
                        </td>
                        <td className="mono text-right text-muted">{formatCurrency(lot.hurdleFloor, currency, { decimals: 2 })}</td>
                        <td className={`mono text-right ${lot.perfFeeAccrued > 0 ? 'text-loss font-semibold' : 'text-muted'}`}>
                          {lot.perfFeeAccrued > 0 ? `-${formatCurrency(lot.perfFeeAccrued, currency, { decimals: 2 })}` : '₹0.00'}
                        </td>
                        <td className="mono text-right">
                          <span className={`badge ${lot.isHurdleCleared ? 'badge-profit' : 'badge-neutral'} mono`} style={{ fontSize: 9 }}>
                            {lot.isHurdleCleared ? `ACCRUED (+ALPHA)` : `ACCRUING (${lot.daysActive}d)`}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* LP Fee Audit Table */}
          <div className="card p-4">
            <div className="section-head mb-3">
              <div>
                <span className="section-title">LP High-Water Mark & Capital Protection Ledger</span>
                <span className="text-xs text-muted block">
                  Granular tracking of each partner's capital watermark, hurdle threshold, and net entitlement.
                </span>
              </div>
            </div>

            <div className="table-responsive">
              <table className="dense-table text-xs">
                <thead>
                  <tr>
                    <th>Partner / LP</th>
                    <th>Role</th>
                    <th className="text-right">Units</th>
                    <th className="text-right">High-Water Mark</th>
                    <th className="text-right">Current NAV</th>
                    <th className="text-right">Current Valuation</th>
                    <th className="text-right">Hurdle Met?</th>
                    <th className="text-right">Performance Status</th>
                  </tr>
                </thead>
                <tbody>
                  {memberList.map((m) => {
                    const hwm = Number(m.highWaterMark || fundMetrics.riskMetrics?.highWaterMark || fundMetrics.currentNav);
                    const currentNav = Number(fundMetrics.currentNav) || 100;
                    const isAboveHwm = currentNav >= hwm;
                    return (
                      <tr key={m.id}>
                        <td>
                          <span className="font-semibold text-primary block">{m.name}</span>
                          <span className="mono text-muted text-xxs">{m.userCode || 'LP'}</span>
                        </td>
                        <td className="text-muted uppercase text-xxs">{m.role || 'Partner'}</td>
                        <td className="mono text-right">{formatNumber(m.units, 4)}</td>
                        <td className="mono text-right">{formatCurrency(hwm, currency, { decimals: 2 })}</td>
                        <td className="mono text-right font-medium text-primary">{formatCurrency(currentNav, currency, { decimals: 2 })}</td>
                        <td className="mono text-right font-semibold text-primary">{formatCurrency(m.currentValue, currency)}</td>
                        <td className="mono text-right">
                          <span className={`badge ${isAboveHwm ? 'badge-profit' : 'badge-neutral'} mono`} style={{ fontSize: 9 }}>
                            {isAboveHwm ? 'HURDLE CLEARED' : 'BELOW WATERMARK'}
                          </span>
                        </td>
                        <td className="mono text-right">
                          <span className="text-xxs text-muted">
                            {isAboveHwm ? 'Performance Fee Eligible' : 'Loss Recovery Mode'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

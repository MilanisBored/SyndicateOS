import React, { useState, useMemo } from 'react';
import { formatCurrency, formatNumber, generateShareableSummary } from '../utils/navEngine';

export default function StatementsView({ 
  fundMetrics = {}, 
  fundInfo = {}, 
  currency = 'INR', 
  currentUser,
  perspective = 'manager',
  onSelectMember 
}) {
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
      const dayProfit = (Number(m.units) || 0) * (day1.delta || 0);

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

  return (
    <div>
      <div className="section-head mb-3">
        <div>
          <span className="section-title">Investor Statements</span>
          <span className="text-xs text-muted block">
            {isInvestor 
              ? 'Your personalized account statement and unitized capital records.' 
              : 'Generate, export, and inspect account tear-sheets for every syndicate investor at scale.'}
          </span>
        </div>
      </div>

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
    </div>
  );
}

import React, { useState, useMemo } from 'react';
import { 
  formatCurrency, 
  formatNumber, 
  exportMembersToCSV, 
  exportTransactionsToCSV 
} from '../utils/navEngine';
import MemberDeleteGatekeeperModal from './MemberDeleteGatekeeperModal';

export default function SyndicateView({ 
  fundMetrics = {}, 
  fundInfo = {}, 
  currency = 'INR', 
  transactions = [], 
  holdings = [], 
  currentUser,
  perspective = 'manager',
  onOpenTransactionModal, 
  onOpenMemberModal, 
  onDeleteMember,
  onConfirmTransaction,
  onSelectMember 
}) {
  const [filterMember, setFilterMember] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Cap Table Scalability States
  const [viewMode, setViewMode] = useState('table'); // 'table' (default, institutional) | 'cards'
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [memberRoleFilter, setMemberRoleFilter] = useState('all');
  const [memberSortBy, setMemberSortBy] = useState('ownershipPct');
  const [memberSortDir, setMemberSortDir] = useState('desc');
  const [memberPage, setMemberPage] = useState(1);
  const [memberPageSize, setMemberPageSize] = useState(25);

  const [ledgerPage, setLedgerPage] = useState(1);
  const [ledgerPageSize, setLedgerPageSize] = useState(25);
  const [memberForDeletion, setMemberForDeletion] = useState(null);

  const isInvestor = perspective === 'investor' || fundInfo?.userRole === 'investor';
  const userEmail = (currentUser?.email || '').toLowerCase().trim();

  const currentMember = fundMetrics.members.find(m => 
    m.isMe || 
    (userEmail && m.email && m.email.toLowerCase().trim() === userEmail) ||
    m.id === fundInfo?.myMemberId
  );

  const totalFundUnits = Number(fundMetrics?.totalUnits) > 0 ? Number(fundMetrics.totalUnits) : 1;
  const tf = fundMetrics?.timeframes || {};
  const day1 = tf['1D'] || { pct: 0, delta: 0 };
  const month1 = tf['1M'] || { pct: 0, delta: 0 };
  const ytd = tf['YTD'] || { pct: 0, delta: 0 };

  // Enriched member dataset with proportional balance sheet and time horizons
  const enrichedMembers = useMemo(() => {
    return (fundMetrics?.members || []).map((m) => {
      const ownershipRatio = totalFundUnits > 0 ? (Number(m.units || 0) / totalFundUnits) : ((Number(m.ownershipPct) || 0) / 100);
      const cashShare = (Number(fundMetrics?.undeployedCash) || 0) * ownershipRatio;
      const assetShare = (Number(fundMetrics?.holdingsTotal) || 0) * ownershipRatio;
      const dayProfit = (Number(m.units) || 0) * (day1.delta || 0);
      const mtdProfit = (Number(m.units) || 0) * (month1.delta || 0);
      const ytdProfit = (Number(m.units) || 0) * (ytd.delta || 0);

      return {
        ...m,
        ownershipRatio,
        cashShare,
        assetShare,
        dayProfit,
        mtdProfit,
        ytdProfit,
        dayPct: day1.pct,
        mtdPct: month1.pct,
        ytdPct: ytd.pct
      };
    });
  }, [fundMetrics?.members, totalFundUnits, fundMetrics?.undeployedCash, fundMetrics?.holdingsTotal, day1.delta, month1.delta, ytd.delta, day1.pct, month1.pct, ytd.pct]);

  const uniqueRoles = useMemo(() => {
    return Array.from(new Set(enrichedMembers.map(m => m.role).filter(Boolean)));
  }, [enrichedMembers]);

  // Scalable search, filter, and multi-column sorting
  const filteredMembers = useMemo(() => {
    return enrichedMembers.filter(m => {
      if (memberRoleFilter !== 'all' && m.role !== memberRoleFilter) return false;
      if (memberSearchTerm.trim()) {
        const term = memberSearchTerm.toLowerCase();
        const matchesName = m.name && m.name.toLowerCase().includes(term);
        const matchesEmail = m.email && m.email.toLowerCase().includes(term);
        const matchesCode = m.userCode && m.userCode.toLowerCase().includes(term);
        const matchesRole = m.role && m.role.toLowerCase().includes(term);
        if (!matchesName && !matchesEmail && !matchesCode && !matchesRole) return false;
      }
      return true;
    }).sort((a, b) => {
      let valA = a[memberSortBy];
      let valB = b[memberSortBy];

      if (typeof valA === 'string') {
        const cmp = valA.localeCompare(valB || '');
        return memberSortDir === 'asc' ? cmp : -cmp;
      }
      valA = Number(valA) || 0;
      valB = Number(valB) || 0;
      return memberSortDir === 'asc' ? valA - valB : valB - valA;
    });
  }, [enrichedMembers, memberRoleFilter, memberSearchTerm, memberSortBy, memberSortDir]);

  const totalMemberPages = Math.max(1, Math.ceil(filteredMembers.length / memberPageSize));
  const currentMemberPage = Math.min(memberPage, totalMemberPages);
  const pagedMembers = filteredMembers.slice((currentMemberPage - 1) * memberPageSize, currentMemberPage * memberPageSize);

  const handleSortMembers = (field) => {
    if (memberSortBy === field) {
      setMemberSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setMemberSortBy(field);
      setMemberSortDir(field === 'name' ? 'asc' : 'desc');
    }
    setMemberPage(1);
  };

  const resolveMember = (tx) => {
    if (!tx) return null;
    return fundMetrics.members.find((m) => 
      m.id === tx.memberId ||
      (tx.memberId && String(m.id).toLowerCase() === String(tx.memberId).toLowerCase()) ||
      (tx.memberName && m.name.toLowerCase() === tx.memberName.toLowerCase()) ||
      (tx.note && tx.note.toLowerCase().includes(m.name.toLowerCase()))
    );
  };

  const filteredTx = transactions
    .filter((tx) => {
      const member = resolveMember(tx);
      if (filterMember !== 'all' && tx.memberId !== filterMember && member?.id !== filterMember) return false;
      if (filterType !== 'all' && tx.type !== filterType) return false;
      if (filterStatus !== 'all' && (tx.status || 'verified') !== filterStatus) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesNote = tx.note?.toLowerCase().includes(term);
        const matchesMember = member?.name.toLowerCase().includes(term);
        if (!matchesNote && !matchesMember) return false;
      }
      return true;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const totalHoldingsVal = holdings.reduce((sum, h) => sum + (Number(h.currentValue) || 0), 0);

  return (
    <div>
      {/* Top Header */}
      <div className="section-head mb-3">
        <div>
          <h2 className="section-title">Syndicate Participants</h2>
          <span className="text-xs text-muted block">
            Institutional unitized cap table: tracks investor ownership, cash reserves, NAV, and returns at scale.
          </span>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          {!isInvestor && (fundMetrics?.members?.length || 0) > 0 && (
            <button 
              type="button" 
              className="btn btn-secondary btn-sm mono"
              style={{ fontSize: 11 }}
              onClick={() => exportMembersToCSV(fundMetrics.members, fundInfo, fundMetrics.currentNav)}
              title="Download Cap Table as CSV for Excel/Sheets"
            >
              Export Cap Table CSV
            </button>
          )}
          {!isInvestor ? (
            <>
              <button 
                type="button" 
                className="btn btn-secondary btn-sm"
                onClick={onOpenMemberModal}
              >
                + Add Member
              </button>
              <button 
                type="button" 
                className="btn btn-primary btn-sm"
                onClick={() => onOpenTransactionModal()}
              >
                + Transaction
              </button>
            </>
          ) : (
            <span className="badge badge-neutral mono text-xs">
              Managed by {fundInfo?.managerName || 'Fund Manager'}
            </span>
          )}
        </div>
      </div>

      {/* Top Roll-Up Metric Strip (4 Columns) */}
      <div className="metric-strip mb-4">
        <div className="metric-cell">
          <span className="metric-label">Syndicate Pool Equity</span>
          <span className="metric-val mono">{formatCurrency(fundMetrics.totalFundAUM, currency)}</span>
          <div className="metric-delta text-muted">
            <span>NAV: {formatCurrency(fundMetrics.currentNav, currency, { decimals: 2 })}</span>
          </div>
        </div>

        <div className="metric-cell">
          <span className="metric-label">Cap Table Scale</span>
          <span className="metric-val mono">{enrichedMembers.length} Investors</span>
          <div className="metric-delta text-muted">
            <span>{formatNumber(fundMetrics.totalUnits, 2)} pool units</span>
          </div>
        </div>

        <div className="metric-cell">
          <span className="metric-label">Cash vs Portfolio Assets</span>
          <span className="metric-val mono">{formatCurrency(fundMetrics.undeployedCash || 0, currency, { decimals: 0 })}</span>
          <div className="metric-delta text-muted">
            <span>Assets: {formatCurrency(fundMetrics.holdingsTotal || 0, currency, { decimals: 0 })}</span>
          </div>
        </div>

        <div className="metric-cell">
          <span className="metric-label">Net Contributed Capital</span>
          <span className="metric-val mono">
            {formatCurrency((fundMetrics.totalDeposited || 0) - (fundMetrics.totalWithdrawn || 0), currency, { decimals: 0 })}
          </span>
          <div className="metric-delta text-muted">
            <span>Deposits: {formatCurrency(fundMetrics.totalDeposited || 0, currency, { decimals: 0 })}</span>
          </div>
        </div>
      </div>

      {/* Unallocated Holdings Notice */}
      {holdings.length > 0 && fundMetrics.totalUnits === 0 && !isInvestor && (
        <div 
          className="card p-3 mb-4 flex justify-between items-center text-xs"
          style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)' }}
        >
          <div>
            <span className="font-semibold text-amber block text-sm mb-1">
              Holdings of {formatCurrency(totalHoldingsVal, currency)} Detected (0 Member Units Issued)
            </span>
            <span className="text-muted block">
              Holdings represent the assets owned by the pool. To give members their ownership units & equity, record their initial deposit transactions using the <strong>Deposit</strong> buttons below.
            </span>
          </div>
          <div className="flex gap-2 shrink-0 ml-3">
            {(fundMetrics?.members || []).map(m => (
              <button
                key={m.id}
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => onOpenTransactionModal({ memberId: m.id, type: 'deposit' })}
              >
                + Deposit for {m.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Institutional Cap Table Container */}
      <div className="card p-4 mb-4">
        {/* Controls Toolbar: Search, Role Filter, Quick Selector, View Mode */}
        <div className="flex justify-between items-center mb-3 gap-2 flex-wrap pb-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
            <input
              type="text"
              placeholder="Search by name, role, email, code..."
              value={memberSearchTerm}
              onChange={(e) => {
                setMemberSearchTerm(e.target.value);
                setMemberPage(1);
              }}
              className="input input-sm mono"
              style={{ fontSize: 11, padding: '4px 10px', maxWidth: '240px', width: '100%' }}
            />

            {uniqueRoles.length > 1 && (
              <select
                value={memberRoleFilter}
                onChange={(e) => {
                  setMemberRoleFilter(e.target.value);
                  setMemberPage(1);
                }}
                className="form-select mono"
                style={{ fontSize: 11, padding: '4px 8px', maxWidth: '140px' }}
              >
                <option value="all">All Roles</option>
                {uniqueRoles.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            )}

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

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-muted mono">
              {filteredMembers.length} {filteredMembers.length === 1 ? 'Investor' : 'Investors'}
            </span>

            <div className="flex border rounded" style={{ borderColor: 'var(--border-subtle)' }}>
              <button
                type="button"
                className={`btn btn-sm mono ${viewMode === 'table' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: 10, padding: '3px 8px' }}
                onClick={() => setViewMode('table')}
              >
                Table
              </button>
              <button
                type="button"
                className={`btn btn-sm mono ${viewMode === 'cards' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: 10, padding: '3px 8px' }}
                onClick={() => setViewMode('cards')}
              >
                Cards
              </button>
            </div>
          </div>
        </div>

        {/* View Mode 1: High-Density Institutional Cap Table (Scales to 100+ investors) */}
        {viewMode === 'table' ? (
          <div className="table-responsive">
            <table className="dense-table w-full">
              <thead>
                <tr>
                  <th onClick={() => handleSortMembers('name')} style={{ cursor: 'pointer' }}>
                    Investor {memberSortBy === 'name' ? (memberSortDir === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th onClick={() => handleSortMembers('ownershipPct')} className="text-right" style={{ cursor: 'pointer' }}>
                    Stake % {memberSortBy === 'ownershipPct' ? (memberSortDir === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th onClick={() => handleSortMembers('units')} className="text-right" style={{ cursor: 'pointer' }}>
                    Units {memberSortBy === 'units' ? (memberSortDir === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th onClick={() => handleSortMembers('currentValue')} className="text-right" style={{ cursor: 'pointer' }}>
                    Equity {memberSortBy === 'currentValue' ? (memberSortDir === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th onClick={() => handleSortMembers('cashShare')} className="text-right" style={{ cursor: 'pointer' }}>
                    Cash on Hand {memberSortBy === 'cashShare' ? (memberSortDir === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th onClick={() => handleSortMembers('assetShare')} className="text-right" style={{ cursor: 'pointer' }}>
                    Asset Share {memberSortBy === 'assetShare' ? (memberSortDir === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th onClick={() => handleSortMembers('dayProfit')} className="text-right" style={{ cursor: 'pointer' }}>
                    Day Profit (1D) {memberSortBy === 'dayProfit' ? (memberSortDir === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th onClick={() => handleSortMembers('mtdProfit')} className="text-right" style={{ cursor: 'pointer' }}>
                    MTD Profit {memberSortBy === 'mtdProfit' ? (memberSortDir === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th onClick={() => handleSortMembers('totalProfit')} className="text-right" style={{ cursor: 'pointer' }}>
                    All-Time PnL {memberSortBy === 'totalProfit' ? (memberSortDir === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedMembers.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="text-center text-muted py-4 mono">
                      No matching participants found.
                    </td>
                  </tr>
                ) : (
                  pagedMembers.map((member) => {
                    const isThisMe = member.isMe || (userEmail && member.email && member.email.toLowerCase().trim() === userEmail);
                    const displayName = (isInvestor && !isThisMe && member.relationship !== 'self') 
                      ? `Co-Investor (${member.role || 'Member'})` 
                      : member.name;

                    return (
                      <tr 
                        key={member.id} 
                        style={{ cursor: 'pointer' }}
                        onClick={() => onSelectMember(member)}
                      >
                        <td>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-xs">{displayName}</span>
                            {isThisMe && (
                              <span className="badge badge-profit mono" style={{ fontSize: 9, padding: '1px 4px' }}>
                                You
                              </span>
                            )}
                            <span className="text-xs text-muted mono" style={{ fontSize: 10 }}>
                              [{member.role}]
                            </span>
                          </div>
                          {member.email && (
                            <div className="text-xs text-muted mono" style={{ fontSize: 10 }}>
                              {member.email}
                            </div>
                          )}
                        </td>

                        <td className="text-right mono font-semibold">
                          {formatNumber(member.ownershipPct, 2)}%
                        </td>

                        <td className="text-right mono text-muted">
                          {formatNumber(member.units, 4)}
                        </td>

                        <td className="text-right mono font-semibold">
                          {formatCurrency(member.currentValue, currency)}
                        </td>

                        <td className="text-right mono text-muted">
                          {formatCurrency(member.cashShare, currency, { decimals: 0 })}
                        </td>

                        <td className="text-right mono text-muted">
                          {formatCurrency(member.assetShare, currency, { decimals: 0 })}
                        </td>

                        <td className={`text-right mono ${member.dayProfit >= 0 ? 'text-profit' : 'text-loss'}`}>
                          {member.dayProfit >= 0 ? '+' : ''}{formatCurrency(member.dayProfit, currency, { decimals: 0 })}
                          <span className="block text-muted" style={{ fontSize: 10 }}>
                            {member.dayPct >= 0 ? '+' : ''}{formatNumber(member.dayPct, 1)}%
                          </span>
                        </td>

                        <td className={`text-right mono ${member.mtdProfit >= 0 ? 'text-profit' : 'text-loss'}`}>
                          {member.mtdProfit >= 0 ? '+' : ''}{formatCurrency(member.mtdProfit, currency, { decimals: 0 })}
                          <span className="block text-muted" style={{ fontSize: 10 }}>
                            {member.mtdPct >= 0 ? '+' : ''}{formatNumber(member.mtdPct, 1)}%
                          </span>
                        </td>

                        <td className={`text-right mono font-semibold ${member.totalProfit >= 0 ? 'text-profit' : 'text-loss'}`}>
                          {member.totalProfit >= 0 ? '+' : ''}{formatCurrency(member.totalProfit, currency, { decimals: 0 })}
                          <span className="block text-muted font-normal" style={{ fontSize: 10 }}>
                            {member.roiPercentage >= 0 ? '+' : ''}{formatNumber(member.roiPercentage, 1)}%
                          </span>
                        </td>

                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="flex gap-1 justify-center">
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm mono"
                              style={{ padding: '2px 6px', fontSize: 10 }}
                              onClick={() => onSelectMember(member)}
                              title="Open Full Tear-Sheet Statement"
                            >
                              Tear-Sheet
                            </button>
                            {!isInvestor && (
                              <>
                                <button
                                  type="button"
                                  className="btn btn-primary btn-sm mono"
                                  style={{ padding: '2px 6px', fontSize: 10 }}
                                  onClick={() => onOpenTransactionModal({ memberId: member.id, type: 'deposit' })}
                                  title="Deposit Capital"
                                >
                                  + Dep
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm mono"
                                  style={{ padding: '2px 6px', fontSize: 10 }}
                                  onClick={() => onOpenTransactionModal({ memberId: member.id, type: 'withdrawal' })}
                                  title="Withdraw Capital"
                                >
                                  - W/D
                                </button>
                                {member.relationship !== 'self' && onDeleteMember && (
                                  <button
                                    type="button"
                                    className="btn btn-secondary btn-sm btn-danger-subtle mono"
                                    style={{ padding: '2px 5px', fontSize: 10 }}
                                    onClick={() => setMemberForDeletion(member)}
                                    title="Remove Participant"
                                  >
                                    Del
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* View Mode 2: Paginated Cards Grid */
          <div className="member-cards-grid">
            {pagedMembers.map((member) => {
              const isThisMe = member.isMe || (userEmail && member.email && member.email.toLowerCase().trim() === userEmail);
              const displayName = (isInvestor && !isThisMe && member.relationship !== 'self') 
                ? `Co-Investor (${member.role || 'Member'})` 
                : member.name;

              return (
                <div 
                  key={member.id} 
                  className="card member-box"
                  style={isThisMe ? { border: '1px solid var(--accent)', boxShadow: '0 0 0 1px var(--accent)' } : {}}
                >
                  <div className="member-box-head">
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm truncate">{displayName}</span>
                        {isThisMe && (
                          <span className="badge badge-profit mono" style={{ fontSize: 9, padding: '1px 5px' }}>
                            You
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted mono">
                          {member.role}
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <span className="badge badge-neutral mono font-semibold">
                        {formatNumber(member.ownershipPct, 1)}%
                      </span>
                    </div>
                  </div>

                  <div className="member-box-data">
                    <div className="data-col">
                      <span className="lbl">Current Equity</span>
                      <span className="val mono">{formatCurrency(member.currentValue, currency)}</span>
                      <span className="text-xs text-secondary mono font-medium mt-0.5 block">
                        {formatNumber(member.units, 4)} units
                      </span>
                      <span className="text-xs text-muted mono" style={{ fontSize: 10 }}>
                        @ NAV {formatCurrency(fundMetrics?.currentNav || 100, currency, { decimals: 2 })}
                      </span>
                    </div>
                    <div className="data-col">
                      <span className="lbl">Net Return</span>
                      <span className={`val mono ${member.totalProfit >= 0 ? 'text-profit' : 'text-loss'}`}>
                        {member.totalProfit >= 0 ? '+' : ''}{formatCurrency(member.totalProfit, currency, { decimals: 0 })}
                      </span>
                      <span className={`text-xs mono ${member.roiPercentage >= 0 ? 'text-profit' : 'text-loss'}`}>
                        {member.roiPercentage >= 0 ? '+' : ''}{formatNumber(member.roiPercentage, 1)}%
                      </span>
                    </div>
                    <div className="data-col">
                      <span className="lbl">Capital Contributed</span>
                      <span className="text-xs mono font-medium mt-1 block">
                        {formatCurrency(member.totalDeposited, currency, { decimals: 0 })}
                      </span>
                      <span className="text-xs text-muted mono block" style={{ fontSize: 10 }}>
                        Out: {formatCurrency(member.totalWithdrawn, currency, { decimals: 0 })}
                      </span>
                    </div>
                    <div className="data-col">
                      <span className="lbl">Day Profit (1D)</span>
                      <span className={`text-xs mono font-medium mt-1 block ${member.dayProfit >= 0 ? 'text-profit' : 'text-loss'}`}>
                        {member.dayProfit >= 0 ? '+' : ''}{formatCurrency(member.dayProfit, currency, { decimals: 0 })}
                      </span>
                      <span className={`text-xs mono block ${member.dayPct >= 0 ? 'text-profit' : 'text-loss'}`} style={{ fontSize: 10 }}>
                        {member.dayPct >= 0 ? '+' : ''}{formatNumber(member.dayPct, 2)}% 24h
                      </span>
                    </div>
                  </div>

                  {/* Balance Sheet Sub-Strip */}
                  <div 
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: '8px',
                      borderTop: '1px solid var(--border-subtle)',
                      paddingTop: '6px',
                      marginTop: '6px'
                    }}
                  >
                    <div>
                      <span className="text-xs text-muted block mono" style={{ fontSize: 9 }}>Cash on it</span>
                      <span className="mono font-medium text-xs">{formatCurrency(member.cashShare, currency, { decimals: 0 })}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted block mono" style={{ fontSize: 9 }}>Asset Share</span>
                      <span className="mono font-medium text-xs">{formatCurrency(member.assetShare, currency, { decimals: 0 })}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted block mono" style={{ fontSize: 9 }}>MTD Profit</span>
                      <span className={`mono font-medium text-xs ${member.mtdProfit >= 0 ? 'text-profit' : 'text-loss'}`}>
                        {member.mtdProfit >= 0 ? '+' : ''}{formatCurrency(member.mtdProfit, currency, { decimals: 0 })}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-muted block mono" style={{ fontSize: 9 }}>YTD Return</span>
                      <span className={`mono font-medium text-xs ${member.ytdProfit >= 0 ? 'text-profit' : 'text-loss'}`}>
                        {member.ytdProfit >= 0 ? '+' : ''}{formatCurrency(member.ytdProfit, currency, { decimals: 0 })} ({member.ytdPct >= 0 ? '+' : ''}{member.ytdPct}%)
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm mono"
                      onClick={() => onSelectMember(member)}
                    >
                      Tear-Sheet
                    </button>
                    {!isInvestor && (
                      <div className="flex gap-1">
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm mono"
                          onClick={() => onOpenTransactionModal({ memberId: member.id, type: 'withdrawal' })}
                        >
                          Withdraw
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm mono"
                          onClick={() => onOpenTransactionModal({ memberId: member.id, type: 'deposit' })}
                        >
                          Deposit
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Cap Table Scalable Pagination Controls */}
        {filteredMembers.length > 0 && (
          <div className="flex justify-between items-center mt-3 pt-3 text-xs text-muted" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <div>
              Showing {filteredMembers.length === 0 ? 0 : ((currentMemberPage - 1) * memberPageSize) + 1}–{Math.min(currentMemberPage * memberPageSize, filteredMembers.length)} of {filteredMembers.length} investors
              {filteredMembers.length < enrichedMembers.length && ` (filtered from ${enrichedMembers.length})`}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="btn btn-secondary btn-sm mono"
                style={{ fontSize: 10, padding: '2px 8px' }}
                disabled={currentMemberPage <= 1}
                onClick={() => setMemberPage(p => Math.max(1, p - 1))}
              >
                &larr; Prev
              </button>
              <span className="mono">
                {currentMemberPage} / {totalMemberPages}
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-sm mono"
                style={{ fontSize: 10, padding: '2px 8px' }}
                disabled={currentMemberPage >= totalMemberPages}
                onClick={() => setMemberPage(p => Math.min(totalMemberPages, p + 1))}
              >
                Next &rarr;
              </button>
              <select
                value={memberPageSize}
                onChange={(e) => {
                  setMemberPageSize(Number(e.target.value));
                  setMemberPage(1);
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

      {/* Compact Ledger Section */}
      <div className="card p-4 mt-4">
        <div className="section-head mb-3">
          <div className="flex items-center gap-3">
            <span className="section-title">Transactions Ledger ({filteredTx.length})</span>
            {filteredTx.length > 0 && (
              <button
                type="button"
                className="btn btn-secondary btn-sm mono"
                style={{ fontSize: 10, padding: '2px 7px' }}
                onClick={() => exportTransactionsToCSV(filteredTx, fundMetrics?.members || [], fundInfo)}
                title="Download filtered transactions as CSV"
              >
                Export CSV
              </button>
            )}
            {transactions.filter(t => t.status === 'pending').length > 0 && (
              <span className="badge badge-warning mono text-xs font-semibold" style={{ padding: '2px 7px' }}>
                PENDING: {transactions.filter(t => t.status === 'pending').length}
              </span>
            )}
          </div>

          {/* Filters */}
          <div className="ledger-filters flex gap-2">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ width: 140, padding: '4px 8px', fontSize: 11 }}
            />
            <select
              value={filterMember}
              onChange={(e) => setFilterMember(e.target.value)}
              className="form-select"
              style={{ width: 120, padding: '4px 8px', fontSize: 11 }}
            >
              <option value="all">All Members</option>
              {fundMetrics.members.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="form-select"
              style={{ width: 110, padding: '4px 8px', fontSize: 11 }}
            >
              <option value="all">All Types</option>
              <option value="deposit">Deposits</option>
              <option value="withdrawal">Withdrawals</option>
              <option value="valuation_update">Valuation</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="form-select"
              style={{ width: 110, padding: '4px 8px', fontSize: 11 }}
            >
              <option value="all">All Status</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
              <option value="disputed">Disputed</option>
            </select>
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
                <th>Units</th>
                <th>Status</th>
                <th>Memo</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const totalFiltered = filteredTx.length;
                const totalPages = Math.max(1, Math.ceil(totalFiltered / ledgerPageSize));
                const currentPage = Math.min(ledgerPage, totalPages);
                const startIndex = (currentPage - 1) * ledgerPageSize;
                const paginatedTxs = filteredTx.slice(startIndex, startIndex + ledgerPageSize);

                if (paginatedTxs.length === 0) {
                  return (
                    <tr>
                      <td colSpan="8" className="text-center text-muted py-6">
                        No transactions found matching current filters.
                      </td>
                    </tr>
                  );
                }

                return paginatedTxs.map((tx) => {
                  const member = resolveMember(tx);
                  const isDeposit = tx.type === 'deposit';
                  const isWithdrawal = tx.type === 'withdrawal';
                  const isValuation = tx.type === 'valuation_update';
                  const txStatus = tx.status || 'verified';
                  const isThisMyTx = currentMember && (
                    tx.memberId === currentMember.id || 
                    tx.isMyTx || 
                    (member && member.id === currentMember.id)
                  );

                  return (
                    <tr key={tx.id} style={isThisMyTx ? { background: 'rgba(99, 102, 241, 0.05)' } : {}}>
                      <td className="mono text-muted">{tx.date}</td>
                      <td className="font-medium">
                        {member ? member.name : isValuation ? 'Valuation Update' : (tx.memberName || 'Investor')}
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
                          {isDeposit ? 'Deposit' : isWithdrawal ? 'Withdrawal' : 'Revaluation'}
                        </span>
                      </td>
                      <td className="mono font-semibold">
                        <span className={isDeposit ? 'text-profit' : isWithdrawal ? 'text-loss' : ''}>
                          {isDeposit ? '+' : isWithdrawal ? '-' : ''}{formatCurrency(tx.amount, currency)}
                        </span>
                      </td>
                      <td className="mono text-muted">{formatCurrency(tx.nav, currency, { decimals: 2 })}</td>
                      <td className="mono text-muted">
                        {isValuation ? '—' : `${formatNumber(tx.units, 2)}`}
                      </td>
                      <td>
                        {txStatus === 'pending' ? (
                          <div className="flex items-center gap-1">
                            <span className="badge badge-warning mono" style={{ fontSize: 10, padding: '2px 5px' }}>
                              PENDING
                            </span>
                            {(isThisMyTx || !isInvestor) && onConfirmTransaction && (
                              <button
                                type="button"
                                className="btn btn-primary btn-sm mono"
                                style={{ fontSize: 9, padding: '1px 5px', lineHeight: 1.2 }}
                                title="Confirm receipt"
                                onClick={() => onConfirmTransaction(tx.id, 'verified', isInvestor ? 'Confirmed by investor' : 'Verified by manager')}
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
                      <td className="text-muted text-xs truncate" style={{ maxWidth: 220 }}>
                        {tx.note || '—'}
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>

        {/* Ledger Pagination Controls */}
        {filteredTx.length > 0 && (
          <div className="flex justify-between items-center mt-3 pt-3 text-xs text-muted" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <div>
              Showing {((Math.min(ledgerPage, Math.max(1, Math.ceil(filteredTx.length / ledgerPageSize))) - 1) * ledgerPageSize) + 1}–{Math.min(Math.min(ledgerPage, Math.max(1, Math.ceil(filteredTx.length / ledgerPageSize))) * ledgerPageSize, filteredTx.length)} of {filteredTx.length} records
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="btn btn-secondary btn-sm mono"
                style={{ fontSize: 10, padding: '2px 8px' }}
                disabled={ledgerPage <= 1}
                onClick={() => setLedgerPage(p => Math.max(1, p - 1))}
              >
                &larr; Prev
              </button>
              <span className="mono">
                {ledgerPage} / {Math.max(1, Math.ceil(filteredTx.length / ledgerPageSize))}
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-sm mono"
                style={{ fontSize: 10, padding: '2px 8px' }}
                disabled={ledgerPage >= Math.max(1, Math.ceil(filteredTx.length / ledgerPageSize))}
                onClick={() => setLedgerPage(p => Math.min(Math.max(1, Math.ceil(filteredTx.length / ledgerPageSize)), p + 1))}
              >
                Next &rarr;
              </button>
              <select
                value={ledgerPageSize}
                onChange={(e) => {
                  setLedgerPageSize(Number(e.target.value));
                  setLedgerPage(1);
                }}
                className="currency-select-minimal mono ml-2"
                style={{ fontSize: 10, padding: '2px 4px' }}
              >
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
                <option value={100}>100 / page</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Member Removal Gatekeeper Modal */}
      {memberForDeletion && (
        <MemberDeleteGatekeeperModal
          isOpen={Boolean(memberForDeletion)}
          onClose={() => setMemberForDeletion(null)}
          member={memberForDeletion}
          fundMetrics={fundMetrics}
          fundInfo={fundInfo}
          currency={currency}
          onConfirmDelete={(memberId) => onDeleteMember(memberId, { action: 'purge' })}
          onRecordPayoutAndRemove={async (mem, amount, units, note) => {
            const currentNav = fundMetrics?.currentNav > 0 ? fundMetrics.currentNav : fundInfo?.initialNav || 100.0;
            const exitTx = {
              id: `tx_${Date.now()}`,
              date: new Date().toISOString().split('T')[0],
              type: 'withdrawal',
              memberId: mem.id,
              memberName: mem.name,
              amount: Number(amount) || 0,
              nav: currentNav,
              units: Number(units) || 0,
              status: 'verified',
              note: note,
            };
            await onDeleteMember(mem.id, { action: 'payout', exitTransaction: exitTx });
          }}
          onOpenTransactionModal={onOpenTransactionModal}
        />
      )}
    </div>
  );
}

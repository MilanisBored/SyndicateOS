import React, { useState } from 'react';
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
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
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
            Unitized pool: capital entries and redemptions buy/redeem units at current NAV.
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

      {/* Participant Search Filter */}
      {(fundMetrics?.members?.length || 0) > 4 && (
        <div className="flex justify-between items-center mb-3 gap-2 flex-wrap">
          <input
            type="text"
            placeholder="Search participants by name, role, email, code..."
            value={memberSearchTerm}
            onChange={(e) => setMemberSearchTerm(e.target.value)}
            className="input input-sm mono"
            style={{ fontSize: 11, padding: '4px 10px', maxWidth: '300px', width: '100%' }}
          />
          <div className="text-xs text-muted mono">
            Participants: {(fundMetrics?.members || []).filter(m => {
              if (!memberSearchTerm.trim()) return true;
              const term = memberSearchTerm.toLowerCase();
              return (m.name && m.name.toLowerCase().includes(term)) ||
                     (m.email && m.email.toLowerCase().includes(term)) ||
                     (m.userCode && m.userCode.toLowerCase().includes(term)) ||
                     (m.role && m.role.toLowerCase().includes(term));
            }).length} of {(fundMetrics?.members || []).length}
          </div>
        </div>
      )}

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

      {/* Compact Member Cards Grid */}
      <div className="member-cards-grid">
        {(fundMetrics?.members || [])
          .filter(member => {
            if (!memberSearchTerm.trim()) return true;
            const term = memberSearchTerm.toLowerCase();
            return (member.name && member.name.toLowerCase().includes(term)) ||
                   (member.email && member.email.toLowerCase().includes(term)) ||
                   (member.userCode && member.userCode.toLowerCase().includes(term)) ||
                   (member.role && member.role.toLowerCase().includes(term));
          })
          .map((member) => {
          const isThisMe = member.isMe || (userEmail && member.email && member.email.toLowerCase().trim() === userEmail);
          const displayName = (isInvestor && !isThisMe && member.relationship !== 'self') 
            ? `Co-Investor (${member.role || 'Member'})` 
            : member.name;

          const totalFundUnits = Number(fundMetrics?.totalUnits) > 0 ? Number(fundMetrics.totalUnits) : (Number(member.units) || 1);
          const mOwnershipRatio = totalFundUnits > 0 ? (Number(member.units || 0) / totalFundUnits) : ((Number(member.ownershipPct) || 0) / 100);
          const mCashShare = (Number(fundMetrics?.undeployedCash) || 0) * mOwnershipRatio;
          const mAssetShare = (Number(fundMetrics?.holdingsTotal) || 0) * mOwnershipRatio;

          const tf = fundMetrics?.timeframes || {};
          const mDay1 = tf['1D'] || { pct: 0, delta: 0 };
          const mMonth1 = tf['1M'] || { pct: 0, delta: 0 };
          const mYtd = tf['YTD'] || { pct: 0, delta: 0 };

          const mDayProfit = (Number(member.units) || 0) * (mDay1.delta || 0);
          const mMtdProfit = (Number(member.units) || 0) * (mMonth1.delta || 0);
          const mYtdProfit = (Number(member.units) || 0) * (mYtd.delta || 0);

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
                      <span className="text-xs text-muted">
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
                    <span className={`text-xs mono font-medium mt-1 block ${mDayProfit >= 0 ? 'text-profit' : 'text-loss'}`}>
                      {mDayProfit >= 0 ? '+' : ''}{formatCurrency(mDayProfit, currency, { decimals: 0 })}
                    </span>
                    <span className={`text-xs mono block ${mDay1.pct >= 0 ? 'text-profit' : 'text-loss'}`} style={{ fontSize: 10 }}>
                      {mDay1.pct >= 0 ? '+' : ''}{formatNumber(mDay1.pct, 2)}% 24h
                    </span>
                  </div>
                </div>

                {/* Balance Sheet & Horizons Sub-Strip */}
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
                    <span className="mono font-medium text-xs">{formatCurrency(mCashShare, currency, { decimals: 0 })}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted block mono" style={{ fontSize: 9 }}>Asset Share</span>
                    <span className="mono font-medium text-xs">{formatCurrency(mAssetShare, currency, { decimals: 0 })}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted block mono" style={{ fontSize: 9 }}>MTD Profit</span>
                    <span className={`mono font-medium text-xs ${mMtdProfit >= 0 ? 'text-profit' : 'text-loss'}`}>
                      {mMtdProfit >= 0 ? '+' : ''}{formatCurrency(mMtdProfit, currency, { decimals: 0 })}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-muted block mono" style={{ fontSize: 9 }}>YTD Return</span>
                    <span className={`mono font-medium text-xs ${mYtdProfit >= 0 ? 'text-profit' : 'text-loss'}`}>
                      {mYtdProfit >= 0 ? '+' : ''}{formatCurrency(mYtdProfit, currency, { decimals: 0 })} ({mYtd.pct >= 0 ? '+' : ''}{mYtd.pct}%)
                    </span>
                  </div>
                </div>

              <div className="flex justify-between items-center pt-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => onSelectMember(member)}
                  >
                    Statement
                  </button>
                  {!isInvestor && member.relationship !== 'self' && onDeleteMember && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm btn-danger-subtle"
                      style={{ padding: '2px 8px', fontSize: 11 }}
                      title={`Remove ${member.name} from syndicate`}
                      onClick={() => setMemberForDeletion(member)}
                    >
                      Remove
                    </button>
                  )}
                </div>
                {!isInvestor && (
                  <div className="flex gap-1">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => onOpenTransactionModal({ memberId: member.id, type: 'withdrawal' })}
                    >
                      Withdraw
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
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

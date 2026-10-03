import React, { useState } from 'react';
import { formatCurrency, formatNumber } from '../utils/navEngine';
import MemberDeleteGatekeeperModal from './MemberDeleteGatekeeperModal';

export default function SyndicateView({ 
  fundMetrics, 
  fundInfo, 
  currency, 
  transactions, 
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
        <div className="flex gap-2">
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
            {fundMetrics.members.map(m => (
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
        {fundMetrics.members.map((member) => {
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
                  <span className="text-xs text-muted mono">{formatNumber(member.units, 2)} units</span>
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
                  <span className="lbl">Total Deposited</span>
                  <span className="text-xs mono font-medium mt-1 block">
                    {formatCurrency(member.totalDeposited, currency, { decimals: 0 })}
                  </span>
                </div>
                <div className="data-col">
                  <span className="lbl">Total Withdrawn</span>
                  <span className="text-xs mono font-medium mt-1 block">
                    {formatCurrency(member.totalWithdrawn, currency, { decimals: 0 })}
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
        <div className="section-head">
          <div className="flex items-center gap-2">
            <span className="section-title">Transactions Ledger</span>
            {transactions.filter(t => t.status === 'pending').length > 0 && (
              <span className="badge badge-warning mono text-xs font-semibold" style={{ padding: '2px 7px' }}>
                PENDING CONFIRMATION: {transactions.filter(t => t.status === 'pending').length}
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
              {filteredTx.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center text-muted py-6">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                filteredTx.map((tx) => {
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
                })
              )}
            </tbody>
          </table>
        </div>
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

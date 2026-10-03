import React, { useState } from 'react';
import { formatCurrency, formatNumber } from '../utils/navEngine';

export default function SyndicateView({ 
  fundMetrics, 
  fundInfo, 
  currency, 
  transactions, 
  holdings = [],
  onOpenTransactionModal, 
  onOpenMemberModal, 
  onSelectMember 
}) {
  const [filterMember, setFilterMember] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

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
          <span className="section-title">Syndicate Participants</span>
          <span className="text-xs text-muted block">
            Unitized pool: capital entries and redemptions buy/redeem units at current NAV.
          </span>
        </div>
        <div className="flex gap-2">
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
        </div>
      </div>

      {/* Unallocated Holdings Notice */}
      {holdings.length > 0 && fundMetrics.totalUnits === 0 && (
        <div 
          className="card p-3 mb-4 flex justify-between items-center text-xs"
          style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)' }}
        >
          <div>
            <span className="font-semibold text-amber block text-sm mb-1">
              Holdings of {formatCurrency(totalHoldingsVal, currency)} Detected (0 Member Units Issued)
            </span>
            <span className="text-muted block">
              Holdings represent the assets owned by the pool. To give Milan or Parul their ownership units & equity, record their initial deposit transactions using the <strong>Deposit</strong> buttons below.
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
        {fundMetrics.members.map((member) => (
          <div key={member.id} className="card member-box">
            <div className="member-box-head">
              <div>
                <span className="font-semibold text-base block">{member.name}</span>
                <span className="text-xs text-muted">{member.role}</span>
              </div>
              <span className="badge badge-neutral mono font-semibold">
                {formatNumber(member.ownershipPct, 1)}%
              </span>
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
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => onSelectMember(member)}
              >
                Statement
              </button>
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
            </div>
          </div>
        ))}
      </div>

      {/* Compact Ledger Section */}
      <div className="card p-4 mt-4">
        <div className="section-head">
          <span className="section-title">Transactions Ledger</span>

          {/* Filters */}
          <div className="flex gap-2">
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
                <th>Memo</th>
              </tr>
            </thead>
            <tbody>
              {filteredTx.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center text-muted py-6">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                filteredTx.map((tx) => {
                  const member = resolveMember(tx);
                  const isDeposit = tx.type === 'deposit';
                  const isWithdrawal = tx.type === 'withdrawal';
                  const isValuation = tx.type === 'valuation_update';

                  return (
                    <tr key={tx.id}>
                      <td className="mono text-muted">{tx.date}</td>
                      <td className="font-medium">
                        {member ? member.name : isValuation ? 'Valuation Update' : (tx.memberName || 'Investor')}
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
                      <td className="text-muted text-xs truncate" style={{ maxWidth: 260 }}>
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

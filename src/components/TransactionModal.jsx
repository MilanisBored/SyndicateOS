import React, { useState } from 'react';
import { formatCurrency, formatNumber } from '../utils/navEngine';

export default function TransactionModal({ 
  initialData = {}, 
  members, 
  fundMetrics, 
  fundInfo, 
  currency, 
  onSave, 
  onClose 
}) {
  const [type, setType] = useState(initialData.type || 'deposit');
  const [memberId, setMemberId] = useState(() => {
    return initialData.memberId || (members && members.length > 0 ? members[0].id : '');
  });
  const [amount, setAmount] = useState(initialData.amount || '');
  const [date, setDate] = useState(initialData.date || new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState(initialData.note || '');
  const [status, setStatus] = useState(() => {
    if (initialData.status) return initialData.status;
    return initialData.type === 'valuation_update' ? 'verified' : 'pending';
  });

  // Keep memberId in sync if members list loads/changes
  React.useEffect(() => {
    if ((!memberId || !members.some(m => m.id === memberId)) && members && members.length > 0) {
      setMemberId(members[0].id);
    }
  }, [members, memberId]);

  const selectedMember = members.find((m) => m.id === memberId) || members[0];
  const currentNav = fundMetrics.currentNav > 0 ? fundMetrics.currentNav : fundInfo.initialNav || 100.0;

  const numAmount = Number(amount) || 0;
  const unitsCalculated = currentNav > 0 ? numAmount / currentNav : 0;

  let validationError = '';
  if (type === 'withdrawal' && selectedMember) {
    if (numAmount > selectedMember.currentValue) {
      validationError = `Exceeds current equity of ${formatCurrency(selectedMember.currentValue, currency)}`;
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || numAmount <= 0) return;
    if (validationError) return;

    const resolvedMember = type === 'valuation_update' ? null : (selectedMember || members[0]);
    const finalStatus = (type === 'valuation_update' || resolvedMember?.relationship === 'self') 
      ? 'verified' 
      : status;

    onSave({
      id: `tx_${Date.now()}`,
      date,
      type,
      memberId: resolvedMember ? resolvedMember.id : null,
      memberName: resolvedMember ? resolvedMember.name : null,
      amount: numAmount,
      nav: currentNav,
      units: type === 'valuation_update' ? 0 : unitsCalculated,
      status: finalStatus,
      note: note.trim() || (type === 'deposit' ? `Deposit by ${resolvedMember?.name || 'Investor'}` : type === 'withdrawal' ? `Withdrawal by ${resolvedMember?.name || 'Investor'}` : 'Valuation Update'),
    });

    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="section-head mb-3">
          <span className="section-title">New Transaction</span>
          <button type="button" className="btn btn-secondary btn-sm mono" onClick={onClose}>Close</button>
        </div>

        {/* Transaction Type Toggle */}
        <div className="flex gap-1 mb-3">
          <button
            type="button"
            className={`btn btn-sm flex-1 ${type === 'deposit' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setType('deposit')}
          >
            Deposit
          </button>
          <button
            type="button"
            className={`btn btn-sm flex-1 ${type === 'withdrawal' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setType('withdrawal')}
          >
            Withdrawal
          </button>
          <button
            type="button"
            className={`btn btn-sm flex-1 ${type === 'valuation_update' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setType('valuation_update')}
          >
            Valuation
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {type !== 'valuation_update' && (
            <div className="form-group">
              <label className="form-label">
                <span>Participant</span>
                <span className="text-muted mono">
                  Balance: {selectedMember ? formatCurrency(selectedMember.currentValue, currency) : '—'}
                </span>
              </label>
              <select
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                className="form-select"
                required
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.role}) — {formatCurrency(m.currentValue, currency)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">
              <span>{type === 'valuation_update' ? 'New Total Fund Portfolio Value' : 'Amount'}</span>
              <span className="text-muted mono">NAV: {formatCurrency(currentNav, currency, { decimals: 2 })}</span>
            </label>
            <input
              type="number"
              step="any"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="form-input mono"
              required
              autoFocus
            />
            {validationError && (
              <span className="text-xs text-loss mt-1">{validationError}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="form-input"
              required
            />
          </div>

          {/* Simple Calculation Preview */}
          {numAmount > 0 && (
            <div className="card p-2 text-xs text-secondary mb-3 mono">
              {type === 'deposit' && (
                <span>Units to issue: +{formatNumber(unitsCalculated, 3)} units @ NAV {formatNumber(currentNav, 2)}</span>
              )}
              {type === 'withdrawal' && (
                <span>Units to redeem: -{formatNumber(unitsCalculated, 3)} units @ NAV {formatNumber(currentNav, 2)}</span>
              )}
              {type === 'valuation_update' && (
                <span>New NAV: {formatCurrency(fundMetrics.totalUnits > 0 ? numAmount / fundMetrics.totalUnits : currentNav, currency, { decimals: 2 })}</span>
              )}
            </div>
          )}

          {type !== 'valuation_update' && selectedMember?.relationship !== 'self' && (
            <div className="form-group">
              <label className="form-label">Two-Way Transfer Verification</label>
              <div className="flex gap-2">
                <label className="flex items-center gap-1 text-xs" style={{ cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="tx_status"
                    value="pending"
                    checked={status === 'pending'}
                    onChange={() => setStatus('pending')}
                  />
                  <span>Awaiting Investor Confirmation</span>
                </label>
                <label className="flex items-center gap-1 text-xs" style={{ cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="tx_status"
                    value="verified"
                    checked={status === 'verified'}
                    onChange={() => setStatus('verified')}
                  />
                  <span>Pre-Verified (Direct Settlement)</span>
                </label>
              </div>
              <span className="text-xs text-muted block mt-1">
                {status === 'pending'
                  ? `When ${selectedMember?.name} logs into their portal, they will see a prompt to verify that this transfer matches their bank/UPI record.`
                  : 'Transaction will be marked as verified immediately without requiring investor acknowledgment.'}
              </span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Memo / Note</label>
            <input
              type="text"
              placeholder="e.g. UPI Ref, HDFC Bank Transfer, Monthly SIP"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="flex justify-end gap-2 mt-4 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={!!validationError}>
              Confirm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

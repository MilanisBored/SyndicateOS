import React, { useState } from 'react';
import { formatCurrency, formatNumber } from '../utils/navEngine';

export default function MemberDeleteGatekeeperModal({
  isOpen,
  onClose,
  member,
  fundMetrics,
  fundInfo,
  currency,
  onConfirmDelete,
  onRecordPayoutAndRemove,
  onOpenTransactionModal
}) {
  const [selectedDirection, setSelectedDirection] = useState('payout');
  const [payoutNote, setPayoutNote] = useState('');
  const [confirmPurgeText, setConfirmPurgeText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !member) return null;

  const currentNav = fundMetrics?.currentNav > 0 ? fundMetrics.currentNav : fundInfo?.initialNav || 100.0;
  const memberEquity = Number(member.currentValue) || 0;
  const memberUnits = Number(member.units) || 0;
  const hasActiveEquity = memberEquity > 0.01 || memberUnits > 0.0001;

  const handleSimpleDelete = async () => {
    setIsProcessing(true);
    try {
      await onConfirmDelete(member.id);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayoutAndRemove = async () => {
    setIsProcessing(true);
    try {
      const exitNote = payoutNote.trim() || `Full exit redemption & capital payout to ${member.name}`;
      await onRecordPayoutAndRemove(member, memberEquity, memberUnits, exitNote);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVoidAndPurge = async () => {
    if (confirmPurgeText.trim().toUpperCase() !== 'VOID') return;
    setIsProcessing(true);
    try {
      await onConfirmDelete(member.id);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content modal-statement-sheet" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 560 }}
      >
        {/* Header */}
        <div className="section-head mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="section-title">
                {hasActiveEquity ? 'SETTLEMENT GATEKEEPER' : 'REMOVE PARTICIPANT'}
              </span>
              <span className={`badge mono font-semibold ${hasActiveEquity ? 'badge-warning' : 'badge-neutral'}`} style={{ fontSize: 9 }}>
                {hasActiveEquity ? 'EQUITY DETECTED' : 'READY TO REMOVE'}
              </span>
            </div>
            <span className="text-xs text-muted block mt-1">
              Participant: <strong className="text-primary">{member.name}</strong> ({member.role || 'Investor'})
            </span>
          </div>
          <button 
            type="button" 
            className="btn btn-secondary btn-sm mono" 
            onClick={onClose}
          >
            Close
          </button>
        </div>

        {/* Case 1: Member has ₹0 equity (Settled) */}
        {!hasActiveEquity ? (
          <div>
            <div className="card p-3 mb-3" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted">Current Equity</span>
                <span className="mono font-semibold">{formatCurrency(0, currency)}</span>
              </div>
              <div className="flex justify-between items-center text-xs mt-1">
                <span className="text-muted">Units Owned</span>
                <span className="mono font-semibold">0.00 units</span>
              </div>
            </div>

            <p className="text-xs text-secondary mb-4 leading-relaxed">
              This participant has no outstanding equity or units in this syndicate. Removing them will cleanly take them off the participant roster.
            </p>

            <div className="flex gap-2 justify-end pt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <button 
                type="button" 
                className="btn btn-secondary btn-sm mono" 
                onClick={onClose}
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-primary btn-sm mono" 
                style={{ background: 'var(--loss)' }}
                onClick={handleSimpleDelete}
                disabled={isProcessing}
              >
                {isProcessing ? 'Removing...' : 'Confirm Removal'}
              </button>
            </div>
          </div>
        ) : (
          /* Case 2: Member has active equity (Gatekeeper Triggered) */
          <div>
            {/* Gatekeeper Alert Box */}
            <div 
              className="card p-3 mb-3" 
              style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.35)' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="badge badge-warning mono font-semibold" style={{ fontSize: 9, padding: '2px 6px' }}>GATEKEEPER ACTIVE</span>
                <span className="font-semibold text-xs text-primary">Cannot Delete Unsettled Participant</span>
              </div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-muted">Outstanding Equity:</span>
                <span className="mono font-semibold text-sm text-profit">{formatCurrency(memberEquity, currency)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted">Units to Redeem:</span>
                <span className="mono font-semibold text-xs">{formatNumber(memberUnits, 4)} units @ NAV {formatCurrency(currentNav, currency)}</span>
              </div>
            </div>

            <p className="text-xs text-muted mb-3 leading-relaxed">
              Syndicate rules protect investor capital: You cannot remove a participant without either recording their exit payout or explicitly voiding a test entry. Select a direction below:
            </p>

            {/* Direction Selection Options */}
            <div className="flex flex-col gap-2 mb-3">
              {/* Option 1: Record Full Exit Payout */}
              <div 
                className={`card p-3 cursor-pointer ${selectedDirection === 'payout' ? 'border-primary' : ''}`}
                style={{ 
                  background: selectedDirection === 'payout' ? 'var(--bg-hover)' : 'var(--bg-subtle)',
                  border: selectedDirection === 'payout' ? '1px solid var(--border-focus)' : '1px solid var(--border-subtle)',
                  cursor: 'pointer'
                }}
                onClick={() => setSelectedDirection('payout')}
              >
                <div className="flex items-start gap-2">
                  <input 
                    type="radio" 
                    id="dir_payout" 
                    name="settle_dir" 
                    checked={selectedDirection === 'payout'} 
                    onChange={() => setSelectedDirection('payout')}
                    style={{ marginTop: 2 }}
                  />
                  <div>
                    <label htmlFor="dir_payout" className="font-semibold text-xs block cursor-pointer">
                      Direction 1: Record Full Exit Payout & Settle (Recommended)
                    </label>
                    <span className="text-xs text-muted block mt-1">
                      Pays out <strong className="text-primary">{formatCurrency(memberEquity, currency)}</strong> to {member.name}. Automatically redeems all {formatNumber(memberUnits, 2)} units at NAV {formatCurrency(currentNav, currency)}, records the withdrawal in the audit ledger, settles equity to ₹0, and removes the participant.
                    </span>
                  </div>
                </div>

                {selectedDirection === 'payout' && (
                  <div className="mt-3 pt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    <label className="text-xs text-muted block mb-1">Settlement Memo / Payout Method:</label>
                    <input 
                      type="text" 
                      placeholder={`e.g. Paid ${formatCurrency(memberEquity, currency)} via UPI/IMPS upon leaving syndicate`}
                      value={payoutNote}
                      onChange={(e) => setPayoutNote(e.target.value)}
                      className="form-input text-xs"
                      autoFocus
                    />
                  </div>
                )}
              </div>

              {/* Option 2: Void / Purge Erroneous Entry */}
              <div 
                className={`card p-3 cursor-pointer ${selectedDirection === 'void' ? 'border-loss' : ''}`}
                style={{ 
                  background: selectedDirection === 'void' ? 'var(--bg-hover)' : 'var(--bg-subtle)',
                  border: selectedDirection === 'void' ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border-subtle)',
                  cursor: 'pointer'
                }}
                onClick={() => setSelectedDirection('void')}
              >
                <div className="flex items-start gap-2">
                  <input 
                    type="radio" 
                    id="dir_void" 
                    name="settle_dir" 
                    checked={selectedDirection === 'void'} 
                    onChange={() => setSelectedDirection('void')}
                    style={{ marginTop: 2 }}
                  />
                  <div>
                    <label htmlFor="dir_void" className="font-semibold text-xs block cursor-pointer text-loss">
                      Direction 2: Void Test / Mistake Entry (Purge Without Payout)
                    </label>
                    <span className="text-xs text-muted block mt-1">
                      Use only if this was an accidental test entry or entered for the wrong person. Purges the uninvested capital and resets your equity to 100% without recording a cash payout.
                    </span>
                  </div>
                </div>

                {selectedDirection === 'void' && (
                  <div className="mt-3 pt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    <span className="text-xs text-loss block mb-1">
                      Type <strong>VOID</strong> to confirm purging this capital:
                    </span>
                    <input 
                      type="text" 
                      placeholder="Type VOID to confirm"
                      value={confirmPurgeText}
                      onChange={(e) => setConfirmPurgeText(e.target.value)}
                      className="form-input text-xs"
                      autoFocus
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <button 
                type="button" 
                className="btn btn-secondary btn-sm mono" 
                onClick={onClose}
                disabled={isProcessing}
              >
                Cancel
              </button>

              <div className="flex gap-2">
                {selectedDirection === 'payout' ? (
                  <button 
                    type="button" 
                    className="btn btn-primary btn-sm mono" 
                    onClick={handlePayoutAndRemove}
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Processing Payout...' : `Pay Out ${formatCurrency(memberEquity, currency, { decimals: 0 })} & Remove`}
                  </button>
                ) : (
                  <button 
                    type="button" 
                    className="btn btn-primary btn-sm mono" 
                    style={{ background: 'var(--loss)' }}
                    onClick={handleVoidAndPurge}
                    disabled={isProcessing || confirmPurgeText.trim().toUpperCase() !== 'VOID'}
                  >
                    {isProcessing ? 'Purging...' : 'Void Capital & Remove'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

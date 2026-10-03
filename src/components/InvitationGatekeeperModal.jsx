import React, { useState } from 'react';

export default function InvitationGatekeeperModal({
  isOpen,
  invitations = [],
  onAccept,
  onDecline
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  if (!isOpen || invitations.length === 0) return null;

  const handleAccept = async (inv) => {
    setIsProcessing(true);
    setProcessingId(inv.memberId);
    try {
      await onAccept(inv);
    } finally {
      setIsProcessing(false);
      setProcessingId(null);
    }
  };

  const handleDecline = async (inv) => {
    if (!confirm(`Decline invitation to join "${inv.fundName}"?`)) return;
    setIsProcessing(true);
    setProcessingId(inv.memberId);
    try {
      await onDecline(inv);
    } finally {
      setIsProcessing(false);
      setProcessingId(null);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1200 }}>
      <div 
        className="modal-content modal-statement-sheet" 
        style={{ maxWidth: 540 }}
      >
        {/* Header */}
        <div className="section-head mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="section-title">SYNDICATE ACCESS GATEKEEPER</span>
              <span className="badge badge-warning mono font-semibold" style={{ fontSize: 9 }}>
                VERIFICATION REQUIRED
              </span>
            </div>
            <span className="text-xs text-muted block mt-1">
              You have {invitations.length} pending syndicate invitation{invitations.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Security & Verification Notice */}
        <div 
          className="card p-3 mb-3" 
          style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.3)' }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="badge badge-neutral mono" style={{ fontSize: 9, padding: '1px 6px' }}>SECURITY HANDSHAKE</span>
            <span className="font-semibold text-xs text-primary">Mutual Verification Gatekeeper</span>
          </div>
          <p className="text-xs text-secondary leading-relaxed" style={{ margin: 0 }}>
            To safeguard both fund managers and investors from unverified access, syndicates require an explicit mutual handshake. You must review and accept an invitation before connecting to a fund.
          </p>
        </div>

        {/* Invitations List */}
        <div className="flex flex-col gap-3 mb-3">
          {invitations.map((inv) => (
            <div 
              key={inv.memberId} 
              className="card p-3" 
              style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="font-semibold text-sm block">
                    {inv.fundName}
                  </span>
                  <span className="text-xs text-muted block">
                    Manager: <strong className="text-primary">{inv.managerName}</strong> &bull; Role: <strong className="text-primary">{inv.role}</strong>
                  </span>
                  {inv.invitedAt && (
                    <span className="text-xs text-muted mono block mt-1">
                      Invited: {inv.invitedAt.split('T')[0]}
                    </span>
                  )}
                </div>
                <span className="badge badge-warning mono text-xs">
                  PENDING
                </span>
              </div>

              <div className="card p-2 text-xs text-muted mb-3" style={{ background: 'var(--bg-surface)' }}>
                <span>
                  • Live NAV tracking of any deposited capital<br />
                  • Private investor account statement<br />
                  • Discretionary portfolio management by {inv.managerName}
                </span>
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm mono"
                  onClick={() => handleDecline(inv)}
                  disabled={isProcessing}
                  style={{ fontSize: 11, padding: '3px 10px' }}
                >
                  {isProcessing && processingId === inv.memberId ? 'Declining...' : 'Decline'}
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm mono"
                  onClick={() => handleAccept(inv)}
                  disabled={isProcessing}
                  style={{ fontSize: 11, padding: '3px 14px' }}
                >
                  {isProcessing && processingId === inv.memberId ? 'Connecting...' : 'Accept & Connect'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

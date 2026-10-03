import React, { useState } from 'react';
import { formatCurrency, formatNumber } from '../utils/navEngine';

export default function ActionCenterModal({
  isOpen,
  onClose,
  transactions = [],
  members = [],
  fundInfo,
  fundMetrics,
  currency,
  perspective = 'manager',
  currentUser,
  pendingInvitations = [],
  onAcceptInvitation,
  onDeclineInvitation,
  onConfirmTransaction,
  onOpenTransactionModal
}) {
  const [activeTab, setActiveTab] = useState('pending');
  const [disputeInputId, setDisputeInputId] = useState(null);
  const [disputeReason, setDisputeReason] = useState('');

  if (!isOpen) return null;

  const isInvestor = perspective === 'investor' || fundInfo?.userRole === 'investor';
  const userEmail = (currentUser?.email || '').toLowerCase().trim();

  const currentMember = members.find(m => 
    m.isMe || 
    (userEmail && m.email && m.email.toLowerCase().trim() === userEmail) ||
    m.id === fundInfo?.myMemberId
  ) || members[0];

  // Outgoing invitations sent by manager that are awaiting friend acceptance
  const outgoingPendingMembers = !isInvestor
    ? members.filter(m => m.status === 'invited')
    : [];

  const handleCopyInviteLink = (member) => {
    const inviteUrl = window.location.origin;
    const msg = `Hey ${member.name}! I've invited you to join our syndicate on SyndicateOS. Open this link to sign in with your email (${member.email}) and connect: ${inviteUrl}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(msg);
      alert(`Invitation message copied to clipboard! Send this to ${member.name} via WhatsApp or Email.`);
    } else {
      prompt('Copy this invitation message:', msg);
    }
  };

  // Filter transactions based on perspective
  const userTransactions = isInvestor && currentMember
    ? transactions.filter(t => t.memberId === currentMember.id || t.isMyTx)
    : transactions;

  // 1. Pending Approvals
  const pendingItems = userTransactions.filter(t => t.status === 'pending');

  // 2. Disputed / Rejected Items
  const disputedItems = userTransactions.filter(t => t.status === 'disputed');

  // 3. Fund Additions & Verified Activity
  const activityItems = [
    // Verified or Valuation Transactions
    ...transactions
      .filter(t => t.status === 'verified' || t.type === 'valuation_update')
      .slice(0, 15)
      .map(t => ({
        id: `act_tx_${t.id}`,
        rawId: t.id,
        category: t.type === 'valuation_update' ? 'valuation' : 'transaction',
        date: t.date,
        title: t.type === 'valuation_update' 
          ? `NAV Valuation Synced` 
          : `${t.type === 'deposit' ? 'Deposit' : 'Withdrawal'} Verified`,
        detail: t.type === 'valuation_update'
          ? `AUM updated to ${formatCurrency(t.amount, currency)} (NAV ${formatCurrency(t.nav, currency)})`
          : `${t.memberName || 'Member'}: ${formatCurrency(t.amount, currency)} (${formatNumber(t.units, 2)} units @ NAV ${formatCurrency(t.nav, currency)})`,
        memo: t.note || '',
        status: t.status,
      })),
    // Member additions
    ...members.map(m => ({
      id: `act_mem_${m.id}`,
      rawId: m.id,
      category: 'member_addition',
      date: m.dateJoined || 'Active',
      title: `Participant Enrolled: ${m.name}`,
      detail: `Role: ${m.role} • Relationship: ${m.relationship || 'Member'}`,
      memo: m.email || '',
      status: 'active',
    }))
  ].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const handleConfirm = (txId) => {
    onConfirmTransaction && onConfirmTransaction(txId, 'verified', 'Confirmed via Action Center');
  };

  const handleStartDispute = (txId) => {
    setDisputeInputId(txId);
    setDisputeReason('');
  };

  const handleCancelDispute = () => {
    setDisputeInputId(null);
    setDisputeReason('');
  };

  const handleSubmitDispute = (txId) => {
    if (!disputeReason.trim()) return;
    onConfirmTransaction && onConfirmTransaction(txId, 'disputed', disputeReason.trim());
    setDisputeInputId(null);
    setDisputeReason('');
  };

  const handleResolveDispute = (txId) => {
    onConfirmTransaction && onConfirmTransaction(txId, 'verified', 'Discrepancy resolved and audited');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content modal-statement-sheet" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 620 }}
      >
        {/* Header */}
        <div className="section-head mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="section-title">ACTION & NOTIFICATION CENTER</span>
              {pendingItems.length > 0 && (
                <span className="badge badge-warning mono text-xs font-semibold" style={{ padding: '2px 7px' }}>
                  {pendingItems.length} ACTION REQUIRED
                </span>
              )}
            </div>
            <span className="text-xs text-muted block mt-1">
              Syndicate: {fundInfo?.name || 'Pool'} &bull; Managed by {fundInfo?.managerName || 'Manager'}
            </span>
          </div>
          <button 
            type="button" 
            className="btn btn-secondary btn-sm mono" 
            onClick={onClose}
            title="Close (Esc)"
          >
            ✕
          </button>
        </div>

        {/* Tab Filters */}
        <div className="flex gap-1 mb-3" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8 }}>
          <button
            type="button"
            className={`btn btn-sm mono ${activeTab === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: 11, padding: '3px 9px' }}
            onClick={() => setActiveTab('pending')}
          >
            PENDING ({pendingItems.length + pendingInvitations.length + outgoingPendingMembers.length})
          </button>
          <button
            type="button"
            className={`btn btn-sm mono ${activeTab === 'disputed' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: 11, padding: '3px 9px' }}
            onClick={() => setActiveTab('disputed')}
          >
            DISPUTED ({disputedItems.length})
          </button>
          <button
            type="button"
            className={`btn btn-sm mono ${activeTab === 'updates' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: 11, padding: '3px 9px' }}
            onClick={() => setActiveTab('updates')}
          >
            UPDATES ({activityItems.length})
          </button>
        </div>

        {/* Tab 1: Pending Approvals & Invitations */}
        {activeTab === 'pending' && (
          <div className="flex flex-col gap-3">
            {/* 1. Incoming Syndicate Invitations Awaiting Handshake */}
            {pendingInvitations.length > 0 && (
              <div className="mb-2">
                <span className="text-xs font-semibold mono text-amber block mb-2 flex items-center gap-1">
                  <span>📩 SYNDICATE INVITATIONS AWAITING ACCEPTANCE ({pendingInvitations.length})</span>
                </span>
                {pendingInvitations.map((inv) => (
                  <div 
                    key={inv.memberId}
                    className="card p-3 mb-2"
                    style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.35)' }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="badge badge-warning mono text-xs font-semibold" style={{ fontSize: 9 }}>
                            NEW INVITATION
                          </span>
                          <span className="text-xs text-muted mono">{inv.date ? inv.date.split('T')[0] : 'Recent'}</span>
                        </div>
                        <span className="font-semibold text-sm block mt-1">
                          {inv.fundName || 'Syndicate Pool'}
                        </span>
                        <span className="text-xs text-muted block">
                          Manager: <strong>{inv.managerName || 'Fund Manager'}</strong> • Currency: {inv.currency || 'INR'}
                        </span>
                        <span className="text-xs text-secondary block mt-1">
                          You were invited as a participating investor. Review terms and connect to access unitized NAV and equity.
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end pt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm mono"
                        style={{ fontSize: 11, padding: '3px 10px' }}
                        onClick={() => onDeclineInvitation(inv)}
                      >
                        Decline
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm mono"
                        style={{ fontSize: 11, padding: '3px 14px' }}
                        onClick={() => onAcceptInvitation(inv)}
                      >
                        ✓ Accept & Connect
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 2. Outgoing Invitations Sent by Manager */}
            {outgoingPendingMembers.length > 0 && (
              <div className="mb-2">
                <span className="text-xs font-semibold mono text-secondary block mb-2">
                  ⏳ OUTGOING INVITATIONS PENDING FRIEND ACCEPTANCE ({outgoingPendingMembers.length})
                </span>
                {outgoingPendingMembers.map((m) => (
                  <div 
                    key={m.id}
                    className="card p-3 mb-2 flex justify-between items-center"
                    style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-color)' }}
                  >
                    <div>
                      <span className="font-semibold text-xs block text-primary">{m.name}</span>
                      <span className="text-xs text-muted mono">{m.email || 'No email specified'}</span>
                      <span className="badge badge-neutral mono mt-1 block" style={{ fontSize: 9, width: 'fit-content' }}>
                        Awaiting friend to log in & accept
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm mono"
                      style={{ fontSize: 10, padding: '3px 8px' }}
                      onClick={() => handleCopyInviteLink(m)}
                    >
                      📋 Copy Invite Link
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 3. Pending Transaction Verifications */}
            {pendingItems.length === 0 && pendingInvitations.length === 0 && outgoingPendingMembers.length === 0 ? (
              <div className="p-4 text-center text-muted card text-xs" style={{ background: 'var(--bg-subtle)' }}>
                <span className="mono font-semibold block text-sm mb-1 text-primary">✓ ALL CLEAR</span>
                No pending transfer verifications, approvals, or invitations awaiting review.
              </div>
            ) : (
              pendingItems.map((tx) => (
                <div 
                  key={tx.id} 
                  className="card p-3 action-required-item"
                  style={{ background: 'var(--bg-subtle)', border: '1px solid rgba(245, 158, 11, 0.35)' }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="badge badge-warning mono text-xs font-semibold" style={{ fontSize: 9 }}>
                          {tx.type === 'deposit' ? 'PENDING DEPOSIT' : 'PENDING WITHDRAWAL'}
                        </span>
                        <span className="font-semibold text-xs mono">{tx.date}</span>
                      </div>
                      <span className="font-semibold text-sm block mt-1">
                        {tx.memberName || 'Investor'}: {formatCurrency(tx.amount, currency)}
                      </span>
                      <span className="text-xs text-muted mono block">
                        {formatNumber(tx.units, 2)} units @ NAV {formatCurrency(tx.nav, currency)}
                      </span>
                      {tx.note && (
                        <span className="text-xs text-muted block mt-1">
                          Memo: "{tx.note}"
                        </span>
                      )}
                    </div>
                  </div>

                  {disputeInputId === tx.id ? (
                    <div className="mt-2 p-2 card" style={{ background: 'var(--bg-surface)' }}>
                      <span className="text-xs font-semibold block mb-1 text-loss">
                        State Discrepancy / Rejection Reason:
                      </span>
                      <input
                        type="text"
                        placeholder="e.g. Received ₹9,500 instead of ₹10,000, or wrong transfer date"
                        value={disputeReason}
                        onChange={(e) => setDisputeReason(e.target.value)}
                        className="form-input text-xs mb-2"
                        autoFocus
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm mono"
                          style={{ fontSize: 10, padding: '2px 7px' }}
                          onClick={handleCancelDispute}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm mono"
                          style={{ fontSize: 10, padding: '2px 9px', background: 'var(--loss)' }}
                          disabled={!disputeReason.trim()}
                          onClick={() => handleSubmitDispute(tx.id)}
                        >
                          Submit Discrepancy
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2 justify-end pt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm mono"
                        style={{ fontSize: 11, padding: '3px 9px', color: 'var(--loss)' }}
                        onClick={() => handleStartDispute(tx.id)}
                        title="Flag a discrepancy or reject this transaction"
                      >
                        Dispute / Reject
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm mono"
                        style={{ fontSize: 11, padding: '3px 12px' }}
                        onClick={() => handleConfirm(tx.id)}
                        title="Confirm audit match and finalize units"
                      >
                        ✓ Confirm & Verify
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Disputed / Rejections */}
        {activeTab === 'disputed' && (
          <div className="flex flex-col gap-2">
            {disputedItems.length === 0 ? (
              <div className="p-4 text-center text-muted card text-xs" style={{ background: 'var(--bg-subtle)' }}>
                <span className="mono font-semibold block text-sm mb-1 text-primary">✓ NO DISPUTES</span>
                There are no rejected or disputed transactions. All ledger records match.
              </div>
            ) : (
              disputedItems.map((tx) => (
                <div 
                  key={tx.id} 
                  className="card p-3 action-required-item"
                  style={{ background: 'var(--bg-subtle)', border: '1px solid rgba(239, 68, 68, 0.4)' }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="badge badge-loss mono text-xs font-semibold" style={{ fontSize: 9 }}>
                          DISPUTED / REJECTED
                        </span>
                        <span className="font-semibold text-xs mono">{tx.date}</span>
                      </div>
                      <span className="font-semibold text-sm block mt-1">
                        {tx.memberName || 'Investor'}: {formatCurrency(tx.amount, currency)} ({formatNumber(tx.units, 2)} units)
                      </span>
                      <div className="mt-2 p-2 card" style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                        <span className="text-xs text-loss font-semibold block">
                          Recorded Discrepancy Reason:
                        </span>
                        <span className="text-xs text-muted block mt-1">
                          "{tx.verificationNotes || 'Marked as disputed by participant'}"
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm mono"
                      style={{ fontSize: 11, padding: '3px 9px' }}
                      onClick={() => handleResolveDispute(tx.id)}
                      title="Re-verify after resolving discrepancy"
                    >
                      Resolve & Mark Verified
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Activity & Fund Updates */}
        {activeTab === 'updates' && (
          <div className="flex flex-col gap-2">
            {activityItems.length === 0 ? (
              <div className="p-4 text-center text-muted card text-xs" style={{ background: 'var(--bg-subtle)' }}>
                No recent activity recorded yet.
              </div>
            ) : (
              activityItems.map((item) => (
                <div 
                  key={item.id} 
                  className="card p-2 flex justify-between items-center text-xs"
                  style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`badge mono font-semibold ${item.category === 'valuation' ? 'badge-profit' : item.category === 'member_addition' ? 'badge-neutral' : 'badge-profit'}`} style={{ fontSize: 9, padding: '1px 5px' }}>
                        {item.category === 'valuation' ? 'VALUATION' : item.category === 'member_addition' ? 'PARTICIPANT' : 'TRANSFER'}
                      </span>
                      <span className="font-semibold text-xs">{item.title}</span>
                    </div>
                    <span className="text-xs text-muted block mt-1">
                      {item.detail}
                    </span>
                    {item.memo && (
                      <span className="text-xs text-muted block" style={{ fontSize: 10 }}>
                        {item.memo}
                      </span>
                    )}
                  </div>
                  <span className="mono text-muted text-xs whitespace-nowrap ml-2">
                    {item.date}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between items-center mt-4 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <span className="text-xs text-muted mono">
            Current NAV: {formatCurrency(fundMetrics?.currentNav || 100, currency, { decimals: 2 })}
          </span>
          <div className="flex gap-2">
            {!isInvestor && onOpenTransactionModal && (
              <button
                type="button"
                className="btn btn-secondary btn-sm mono"
                style={{ fontSize: 11 }}
                onClick={() => {
                  onClose();
                  onOpenTransactionModal();
                }}
              >
                + New Transaction
              </button>
            )}
            <button
              type="button"
              className="btn btn-primary btn-sm mono"
              style={{ fontSize: 11 }}
              onClick={onClose}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

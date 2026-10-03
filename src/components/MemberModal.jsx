import React, { useState } from 'react';

export default function MemberModal({ onAddMember, onClose }) {
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('friend');
  const [role, setRole] = useState('Investor');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [createdInvite, setCreatedInvite] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newMember = {
      id: `mem_${Date.now()}`,
      name: name.trim(),
      relationship,
      role: role.trim() || 'Investor',
      email: email.trim(),
      notes: notes.trim(),
    };

    onAddMember(newMember);

    // If an email was provided, show shareable invite card
    if (newMember.email && newMember.relationship !== 'self') {
      setCreatedInvite(newMember);
    } else {
      onClose();
    }
  };

  const getInviteMessage = () => {
    const appUrl = window.location.origin;
    return `Hey ${createdInvite?.name}! I've invited you to join our syndicate pool on SyndicateOS. Open this link, sign in with your email (${createdInvite?.email}), and review/accept your invitation: ${appUrl}`;
  };

  const handleCopyLink = () => {
    const msg = getInviteMessage();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(msg);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } else {
      prompt('Copy this invite message:', msg);
    }
  };

  const handleWhatsAppShare = () => {
    const msg = encodeURIComponent(getInviteMessage());
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Invitation to join Syndicate Pool on SyndicateOS`);
    const body = encodeURIComponent(getInviteMessage());
    window.open(`mailto:${createdInvite?.email}?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {createdInvite ? (
          <div>
            <div className="section-head mb-3">
              <div>
                <span className="section-title">Syndicate Invitation Created!</span>
                <span className="text-xs text-profit block mt-1">✓ Added to syndicate roster</span>
              </div>
              <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>✕</button>
            </div>

            <div className="card p-3 mb-3" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-color)' }}>
              <span className="font-semibold text-xs block text-primary mb-1">
                Participant: {createdInvite.name} ({createdInvite.email})
              </span>
              <p className="text-xs text-muted leading-relaxed mb-3">
                Since automated email services require external mail API keys, send your friend this direct invite message via WhatsApp or Email so they can sign in and accept their invitation:
              </p>

              <div className="p-2 card text-xs mono mb-3" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
                {getInviteMessage()}
              </div>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  className="btn btn-primary btn-sm flex items-center justify-center gap-2"
                  onClick={handleCopyLink}
                >
                  <span>📋</span>
                  <span>{copied ? '✓ Copied to Clipboard!' : 'Copy Invite Message'}</span>
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm flex-1 flex items-center justify-center gap-1"
                    onClick={handleWhatsAppShare}
                  >
                    <span>💬</span>
                    <span>Share on WhatsApp</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm flex-1 flex items-center justify-center gap-1"
                    onClick={handleEmailShare}
                  >
                    <span>✉️</span>
                    <span>Open Email Draft</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
                Done
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="section-head mb-3">
              <span className="section-title">Add Participant</span>
              <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              placeholder="e.g. Priya Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input"
              required
              autoFocus
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Relationship</label>
              <select
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className="form-select"
              >
                <option value="investor">External Investor</option>
                <option value="friend">Friend / Colleague</option>
                <option value="partner">Partner / Spouse</option>
                <option value="family">Family Member</option>
                <option value="self">Self (Manager)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Role</label>
              <input
                type="text"
                placeholder="e.g. Investor, LP, Partner"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Investor Login Email <span className="text-muted text-xs font-normal">(Generates syndicate invitation)</span>
            </label>
            <input
              type="email"
              placeholder="investor@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
            />
            <span className="text-xs text-muted block mt-1">
              Adding this email generates a pending invitation. The member must explicitly verify and accept the syndicate terms before accessing the pool.
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Notes / Terms</label>
            <input
              type="text"
              placeholder="e.g. Profit split, lock-in period, goals"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="form-input"
            />
          </div>

          {/* Security and Confidentiality Assurance */}
          <div 
            className="p-3 mb-3 card text-xs mono" 
            style={{ background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.2)' }}
          >
            <div className="font-semibold text-primary mb-1 flex items-center gap-1">
              <span>🔒 DISCRETIONARY MANDATE & PORTFOLIO PRIVACY</span>
            </div>
            <span className="text-muted block leading-relaxed">
              Your specific stock picks, buy levels, and broker notes will remain <strong>strictly confidential</strong> from this investor unless you switch to transparent mode in Settings. Investors only track unitized NAV and asset class breakdown.
            </span>
          </div>

          <div className="flex justify-end gap-2 mt-4 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm">
              Save Member
            </button>
          </div>
        </form>
      </div>
      )}
    </div>
  </div>
);
}

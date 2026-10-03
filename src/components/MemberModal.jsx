import React, { useState } from 'react';

export default function MemberModal({ onAddMember, onClose }) {
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('friend');
  const [role, setRole] = useState('Investor');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

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
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
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
    </div>
  );
}

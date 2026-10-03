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
                <option value="partner">Partner / Girlfriend</option>
                <option value="friend">Friend / Colleague</option>
                <option value="family">Family</option>
                <option value="self">Self (Manager)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Role</label>
              <input
                type="text"
                placeholder="e.g. Partner, Investor"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Contact / Email (Optional)</label>
            <input
              type="text"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Notes</label>
            <input
              type="text"
              placeholder="Optional notes or goals"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="form-input"
            />
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

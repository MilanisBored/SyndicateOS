import React, { useState } from 'react';
import { generateUserCode, normalizeUserCode } from '../utils/navEngine';

export default function MemberModal({ onAddMember, onClose }) {
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('investor');
  const [role, setRole] = useState('Investor');
  const [email, setEmail] = useState('');
  const [userCode, setUserCode] = useState('');
  const [notes, setNotes] = useState('');
  const [validationError, setValidationError] = useState('');

  const trimmedEmail = email.trim().toLowerCase();
  const expectedCode = trimmedEmail ? generateUserCode(trimmedEmail) : '';
  const normalizedInputCode = userCode ? normalizeUserCode(userCode) : '';
  const isCodeMatch = Boolean(expectedCode && normalizedInputCode && normalizedInputCode === expectedCode);
  const isCodeMismatch = Boolean(expectedCode && normalizedInputCode && normalizedInputCode !== expectedCode);

  const handleAutoFillCode = () => {
    if (expectedCode) {
      setUserCode(expectedCode);
      setValidationError('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError('');

    if (!name.trim()) {
      setValidationError('Please enter the participant full name.');
      return;
    }
    if (!trimmedEmail) {
      setValidationError('Please enter the investor Gmail / email address.');
      return;
    }
    if (!normalizedInputCode) {
      setValidationError('Please enter the investor Unique User Code (e.g. USR-XXXXXX).');
      return;
    }

    const newMember = {
      id: `mem_${Date.now()}`,
      name: name.trim(),
      relationship,
      role: role.trim() || 'Investor',
      email: trimmedEmail,
      userCode: normalizedInputCode,
      notes: notes.trim(),
      status: 'active', // Immediately active, no handshake needed
    };

    onAddMember(newMember);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        <div className="section-head mb-3">
          <div>
            <h3 className="section-title">Add Syndicate Participant</h3>
            <span className="text-xs text-muted block">
              Directly links an investor using their Gmail and Unique User Code.
            </span>
          </div>
          <button type="button" className="btn btn-secondary btn-sm mono" onClick={onClose}>
            Close
          </button>
        </div>

        {validationError && (
          <div className="p-2 mb-3 bg-loss-subtle text-loss text-xs rounded mono">
            {validationError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              placeholder="e.g. Parul Sehrawat"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Investor Gmail / Email Address
            </label>
            <input
              type="email"
              placeholder="investor@gmail.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setValidationError('');
              }}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <div className="flex justify-between items-center mb-1">
              <label className="form-label" style={{ marginBottom: 0 }}>
                Unique User Code
              </label>
              {expectedCode && (
                <button
                  type="button"
                  onClick={handleAutoFillCode}
                  className="btn btn-secondary btn-sm mono"
                  style={{ fontSize: 10, padding: '1px 6px' }}
                >
                  Auto-fill Expected Code
                </button>
              )}
            </div>
            <input
              type="text"
              placeholder={expectedCode ? `e.g. ${expectedCode}` : "e.g. USR-9CC360"}
              value={userCode}
              onChange={(e) => {
                setUserCode(e.target.value.toUpperCase());
                setValidationError('');
              }}
              className="form-input mono"
              required
            />
            <div className="mt-1 flex items-center justify-between text-xs">
              <span className="text-muted">
                Each investor has a unique 6-character user code shown on their SyndicateOS screen.
              </span>
            </div>
            {isCodeMatch && (
              <span className="badge badge-profit mono text-xs mt-1 inline-block">
                VERIFIED: Code matches investor Gmail
              </span>
            )}
            {isCodeMismatch && (
              <span className="badge badge-warning mono text-xs mt-1 inline-block">
                NOTICE: Expected {expectedCode} for this Gmail
              </span>
            )}
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
              <label className="form-label">Role Title</label>
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
            <label className="form-label">Notes / Syndicate Terms</label>
            <input
              type="text"
              placeholder="e.g. Profit split, lock-in period, goals"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="form-input"
            />
          </div>

          {/* Privacy Guarantee Note */}
          <div 
            className="p-3 mb-3 card text-xs mono" 
            style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}
          >
            <span className="font-semibold text-primary mb-1 block">
              DIRECT INVESTOR LINKING
            </span>
            <span className="text-muted block leading-relaxed">
              Upon saving, this participant is immediately active with verified unit accounting. No handshake or invitation acceptance is required.
            </span>
          </div>

          <div className="flex justify-end gap-2 mt-4 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <button type="button" className="btn btn-secondary btn-sm mono" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm mono">
              Save & Link Member
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { CURRENCIES } from '../utils/navEngine';

export default function CreateFundModal({ isOpen, onClose, onCreateFund, currentUser }) {
  const [name, setName] = useState('');
  const [managerName, setManagerName] = useState(
    currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || ''
  );
  const [currency, setCurrency] = useState('INR');
  const [initialNav, setInitialNav] = useState('100');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a name for your Syndicate Pool');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onCreateFund({
        name: name.trim(),
        managerName: managerName.trim() || 'Fund Manager',
        currency,
        initialNav: parseFloat(initialNav) || 100.0,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create fund');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
        <div className="section-head mb-3">
          <div>
            <span className="section-title">Create Syndicate Pool</span>
            <span className="text-xs text-muted block">
              Launch a new multi-investor pooled portfolio as Fund Manager.
            </span>
          </div>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>✕</button>
        </div>

        {error && (
          <div className="p-2 mb-3 bg-loss-subtle text-loss text-xs rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Syndicate Name</label>
            <input
              type="text"
              placeholder="e.g. Apex Tech Syndicate, Family Growth Fund"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input"
              required
              autoFocus
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Fund Manager Name</label>
              <input
                type="text"
                placeholder="e.g. Milan"
                value={managerName}
                onChange={(e) => setManagerName(e.target.value)}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Base Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="form-select"
              >
                {Object.keys(CURRENCIES).map((cKey) => (
                  <option key={cKey} value={cKey}>
                    {cKey} ({CURRENCIES[cKey].symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Initial Unit NAV (Starting Unit Price)</label>
            <input
              type="number"
              step="0.01"
              value={initialNav}
              onChange={(e) => setInitialNav(e.target.value)}
              className="form-input mono"
              required
            />
            <span className="text-xs text-muted block mt-1">
              Standard default is 100.00. First deposits buy units at this price.
            </span>
          </div>

          <div className="flex justify-end gap-2 mt-4 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={isSubmitting}>
              {isSubmitting ? 'Creating Pool...' : 'Launch Syndicate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

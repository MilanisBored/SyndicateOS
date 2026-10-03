import React, { useState } from 'react';
import { formatCurrency, formatNumber, generateShareableSummary } from '../utils/navEngine';

export default function StatementModal({ 
  member, 
  fundInfo, 
  currentNav, 
  currency, 
  onClose 
}) {
  const [copied, setCopied] = useState(false);

  if (!member) return null;

  const handleCopy = () => {
    const text = generateShareableSummary(member, fundInfo, currentNav);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content modal-statement-sheet"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Actions bar (no-print) */}
        <div className="flex justify-between items-center pb-3 mb-4 no-print" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <span className="font-semibold text-xs text-muted uppercase">Statement of Account</span>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleCopy}
            >
              {copied ? 'Copied' : 'Copy Text'}
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => window.print()}
            >
              Print / PDF
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm mono"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>

        {/* Statement Document */}
        <div className="statement-sheet">
          <div className="statement-title-block">
            <div>
              <div className="font-semibold text-base">{fundInfo.name}</div>
              <div className="text-xs text-muted">Manager: {fundInfo.managerName}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted">Date: {new Date().toISOString().split('T')[0]}</div>
              <div className="text-xs text-muted mono">NAV: {formatCurrency(currentNav, currency, { decimals: 2 })}</div>
            </div>
          </div>

          {/* Member Banner */}
          <div className="flex justify-between items-center p-3 mb-4 card">
            <div>
              <span className="font-semibold text-sm block">{member.name}</span>
              <span className="text-xs text-muted">{member.role} {member.email ? `• ${member.email}` : ''}</span>
            </div>
            <div className="text-right">
              <span className="text-xs text-muted block">Ownership</span>
              <span className="mono font-semibold">{formatNumber(member.ownershipPct, 1)}%</span>
            </div>
          </div>

          {/* Summary Strip */}
          <div className="metric-strip mb-4">
            <div className="metric-cell">
              <span className="metric-label">Equity</span>
              <span className="metric-val mono text-base">{formatCurrency(member.currentValue, currency)}</span>
              <span className="text-xs text-muted mono">{formatNumber(member.units, 2)} units</span>
            </div>
            <div className="metric-cell">
              <span className="metric-label">Net Profit</span>
              <span className={`metric-val mono text-base ${member.totalProfit >= 0 ? 'text-profit' : 'text-loss'}`}>
                {member.totalProfit >= 0 ? '+' : ''}{formatCurrency(member.totalProfit, currency, { decimals: 0 })}
              </span>
              <span className={`text-xs mono ${member.roiPercentage >= 0 ? 'text-profit' : 'text-loss'}`}>
                {member.roiPercentage >= 0 ? '+' : ''}{formatNumber(member.roiPercentage, 1)}%
              </span>
            </div>
            <div className="metric-cell">
              <span className="metric-label">Deposited</span>
              <span className="text-xs mono font-semibold mt-1 block">
                {formatCurrency(member.totalDeposited, currency, { decimals: 0 })}
              </span>
            </div>
            <div className="metric-cell">
              <span className="metric-label">Withdrawn</span>
              <span className="text-xs mono font-semibold mt-1 block">
                {formatCurrency(member.totalWithdrawn, currency, { decimals: 0 })}
              </span>
            </div>
          </div>

          {/* Activity Table */}
          <div className="section-head mt-4">
            <span className="section-title">Ledger History</span>
          </div>

          <table className="dense-table w-full">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Amount</th>
                <th>NAV</th>
                <th>Units Impact</th>
                <th>Memo</th>
              </tr>
            </thead>
            <tbody>
              {member.history.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center text-muted py-4">No records.</td>
                </tr>
              ) : (
                member.history.map((tx, idx) => {
                  const isDeposit = tx.type === 'deposit';
                  return (
                    <tr key={tx.id || idx}>
                      <td className="mono text-muted">{tx.date}</td>
                      <td>
                        <span className={`badge ${isDeposit ? 'badge-profit' : 'badge-loss'}`}>
                          {isDeposit ? 'Deposit' : 'Withdrawal'}
                        </span>
                      </td>
                      <td className="mono font-semibold">
                        <span className={isDeposit ? 'text-profit' : 'text-loss'}>
                          {isDeposit ? '+' : '-'}{formatCurrency(tx.amount, currency)}
                        </span>
                      </td>
                      <td className="mono text-muted">{formatCurrency(tx.navUsed, currency, { decimals: 2 })}</td>
                      <td className="mono text-muted">
                        {isDeposit ? '+' : '-'}{formatNumber(tx.unitsCalculated, 2)}
                      </td>
                      <td className="text-muted text-xs truncate" style={{ maxWidth: 180 }}>
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

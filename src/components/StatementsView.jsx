import React, { useState } from 'react';
import { formatCurrency, formatNumber, generateShareableSummary } from '../utils/navEngine';

export default function StatementsView({ 
  fundMetrics, 
  fundInfo, 
  currency, 
  onSelectMember 
}) {
  const [copiedId, setCopiedId] = useState(null);

  const handleCopySummary = (member) => {
    const text = generateShareableSummary(member, fundInfo, fundMetrics.currentNav);
    navigator.clipboard.writeText(text);
    setCopiedId(member.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div>
      <div className="section-head mb-3">
        <div>
          <span className="section-title">Investor Statements</span>
          <span className="text-xs text-muted block">
            Generate and copy account summaries for each syndicate member.
          </span>
        </div>
      </div>

      <div className="table-responsive card p-4">
        <table className="dense-table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Role</th>
              <th>Ownership</th>
              <th>Current Equity</th>
              <th>Total Inflow</th>
              <th>Total Outflow</th>
              <th>Net Profit</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {fundMetrics.members.map((m) => (
              <tr key={m.id}>
                <td className="font-semibold">{m.name}</td>
                <td className="text-muted text-xs">{m.role}</td>
                <td className="mono text-muted">{formatNumber(m.ownershipPct, 1)}%</td>
                <td className="mono font-semibold">{formatCurrency(m.currentValue, currency)}</td>
                <td className="mono text-muted">{formatCurrency(m.totalDeposited, currency, { decimals: 0 })}</td>
                <td className="mono text-muted">{formatCurrency(m.totalWithdrawn, currency, { decimals: 0 })}</td>
                <td className={`mono ${m.totalProfit >= 0 ? 'text-profit' : 'text-loss'}`}>
                  {m.totalProfit >= 0 ? '+' : ''}{formatCurrency(m.totalProfit, currency, { decimals: 0 })} ({formatNumber(m.roiPercentage, 1)}%)
                </td>
                <td>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '2px 8px', fontSize: 11 }}
                      onClick={() => onSelectMember(m)}
                    >
                      View
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '2px 8px', fontSize: 11 }}
                      onClick={() => handleCopySummary(m)}
                    >
                      {copiedId === m.id ? 'Copied' : 'Copy Text'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

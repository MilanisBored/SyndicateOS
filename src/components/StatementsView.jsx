import React, { useState } from 'react';
import { formatCurrency, formatNumber, generateShareableSummary } from '../utils/navEngine';

export default function StatementsView({ 
  fundMetrics, 
  fundInfo, 
  currency, 
  currentUser,
  perspective = 'manager',
  onSelectMember 
}) {
  const [copiedId, setCopiedId] = useState(null);

  const isInvestor = perspective === 'investor' || fundInfo?.userRole === 'investor';
  const userEmail = (currentUser?.email || '').toLowerCase().trim();

  const memberList = fundMetrics?.members || [];
  const currentMember = memberList.find(m => 
    m.isMe || 
    (userEmail && m.email && m.email.toLowerCase().trim() === userEmail) ||
    m.id === fundInfo?.myMemberId
  ) || memberList[0] || null;

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
            {isInvestor 
              ? 'Your personalized account statement and unitized capital records.' 
              : 'Generate, export, and copy account summaries for each syndicate member.'}
          </span>
        </div>
      </div>

      {/* Featured Card for Logged-In Investor */}
      {isInvestor && currentMember && (
        <div 
          className="card p-4 mb-4 investor-portal-banner flex justify-between items-center"
          style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.3)' }}
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge badge-profit mono">Personal Statement</span>
              <span className="font-semibold text-base">{currentMember.name}</span>
            </div>
            <div className="text-xs text-muted mb-2">
              Units: <strong className="mono text-primary">{formatNumber(currentMember.units, 2)}</strong> &bull; 
              Ownership: <strong className="mono text-primary">{formatNumber(currentMember.ownershipPct, 1)}%</strong> &bull; 
              Invested: <strong className="mono">{formatCurrency(currentMember.totalDeposited, currency)}</strong> &bull; 
              Current Equity: <strong className="mono text-primary">{formatCurrency(currentMember.currentValue, currency)}</strong>
            </div>
            <span className="text-xs text-muted block">
              Net Gain: <strong className={`mono ${currentMember.totalProfit >= 0 ? 'text-profit' : 'text-loss'}`}>
                {currentMember.totalProfit >= 0 ? '+' : ''}{formatCurrency(currentMember.totalProfit, currency)} ({formatNumber(currentMember.roiPercentage, 1)}%)
              </strong>
            </span>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-secondary btn-sm mono"
              onClick={() => handleCopySummary(currentMember)}
              style={{ fontSize: 11 }}
            >
              {copiedId === currentMember.id ? 'COPIED' : 'COPY SUMMARY'}
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm mono"
              onClick={() => onSelectMember(currentMember)}
              style={{ fontSize: 11 }}
            >
              FULL STATEMENT
            </button>
          </div>
        </div>
      )}

      <div className="table-responsive card p-4">
        <table className="dense-table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Role</th>
              <th>Ownership</th>
              <th>Equity</th>
              <th>Cash on Hand</th>
              <th>Asset Share</th>
              <th>Day Profit (1D)</th>
              <th>Net Profit</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(fundMetrics?.members || []).map((m) => {
              const totalFundUnits = Number(fundMetrics?.totalUnits) > 0 ? Number(fundMetrics.totalUnits) : (Number(m.units) || 1);
              const mOwnershipRatio = totalFundUnits > 0 ? (Number(m.units || 0) / totalFundUnits) : ((Number(m.ownershipPct) || 0) / 100);
              const mCashShare = (Number(fundMetrics?.undeployedCash) || 0) * mOwnershipRatio;
              const mAssetShare = (Number(fundMetrics?.holdingsTotal) || 0) * mOwnershipRatio;

              const tf = fundMetrics?.timeframes || {};
              const mDay1 = tf['1D'] || { pct: 0, delta: 0 };
              const mDayProfit = (Number(m.units) || 0) * (mDay1.delta || 0);

              return (
                <tr key={m.id}>
                  <td className="font-semibold">{m.name}</td>
                  <td className="text-muted text-xs">{m.role}</td>
                  <td className="mono text-muted">{formatNumber(m.ownershipPct, 1)}%</td>
                  <td className="mono font-semibold">{formatCurrency(m.currentValue, currency)}</td>
                  <td className="mono text-muted">{formatCurrency(mCashShare, currency, { decimals: 0 })}</td>
                  <td className="mono text-muted">{formatCurrency(mAssetShare, currency, { decimals: 0 })}</td>
                  <td className={`mono ${mDayProfit >= 0 ? 'text-profit' : 'text-loss'}`}>
                    {mDayProfit >= 0 ? '+' : ''}{formatCurrency(mDayProfit, currency, { decimals: 0 })}
                  </td>
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
                        Tear-Sheet
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '2px 8px', fontSize: 11 }}
                        onClick={() => handleCopySummary(m)}
                      >
                        {copiedId === m.id ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

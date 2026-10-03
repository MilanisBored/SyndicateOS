import React from 'react';

export default function HowNavWorksModal({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content p-6" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '640px' }}
      >
        <div className="modal-header pb-3 border-b border-subtle flex justify-between items-center">
          <div>
            <h3 className="modal-title font-semibold text-base">Why Unitized NAV is Fair</h3>
            <p className="text-xs text-muted">How SyndicateOS eliminates confusion when members join or withdraw capital</p>
          </div>
          <button type="button" className="btn btn-secondary btn-sm mono" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-4 text-sm">
          {/* The Core Problem */}
          <div className="p-3 card" style={{ background: 'var(--bg-subtle)' }}>
            <span className="badge badge-loss mono text-xs font-semibold mb-2 inline-block">
              THE PITFALL OF STATIC CASH ACCOUNTING
            </span>
            <p className="text-xs text-secondary leading-relaxed">
              If you invest $1,000 and it doubles to $2,000, and your friend then deposits $2,000: simple cash addition says you both put in $1,000 and $2,000 (total $4,000). 
              If the market drops 10% next week, who absorbs the loss? Without unit accounting, calculating past vs. new returns causes endless disputes.
            </p>
          </div>

          {/* The Solution */}
          <div className="p-3 card" style={{ background: 'var(--profit-subtle)', borderColor: 'rgba(34, 197, 94, 0.25)' }}>
            <span className="badge badge-profit mono text-xs font-semibold mb-2 inline-block">
              THE SYNDICATE_OS UNITIZED NAV SOLUTION
            </span>
            <p className="text-xs text-secondary leading-relaxed">
              Just like mutual funds and institutional syndicates, your pool is divided into <strong>Units</strong> with a price called <strong>Net Asset Value (NAV)</strong>.
            </p>
          </div>

          {/* 3 Step Visual Walkthrough */}
          <div className="flex flex-col gap-2">
            <div className="card p-3 flex items-start gap-3">
              <span className="mono font-semibold text-xs badge badge-neutral shrink-0">
                01
              </span>
              <div>
                <h5 className="font-semibold text-xs text-primary">Fund Genesis</h5>
                <p className="text-xs text-muted mt-0.5">
                  Base NAV starts at <strong>100.00</strong>. You deposit 10,000 and receive <strong>100 units</strong>. (Total Fund: 10,000 | Units: 100).
                </p>
              </div>
            </div>

            <div className="card p-3 flex items-start gap-3">
              <span className="mono font-semibold text-xs badge badge-neutral shrink-0">
                02
              </span>
              <div>
                <h5 className="font-semibold text-xs text-primary">Portfolio Growth & Member Entry</h5>
                <p className="text-xs text-muted mt-0.5">
                  The portfolio grows to 15,000 (+50%). NAV increases to <strong>150.00</strong>. 
                  When a co-investor enters with 7,500, they buy units at current NAV 150, receiving <strong>50 units</strong> (7,500 / 150). 
                  Your prior 50% profit remains 100% yours.
                </p>
              </div>
            </div>

            <div className="card p-3 flex items-start gap-3">
              <span className="mono font-semibold text-xs badge badge-neutral shrink-0">
                03
              </span>
              <div>
                <h5 className="font-semibold text-xs text-primary">Capital Redemption</h5>
                <p className="text-xs text-muted mt-0.5">
                  When fund NAV reaches <strong>180.00</strong>, a member withdrawing 3,600 redeems 20 units (3,600 / 180) at fair value. 
                  Remaining members maintain their exact per-unit value with zero dilution.
                </p>
              </div>
            </div>
          </div>

          {/* Summary Box */}
          <div className="p-3 card flex items-center justify-between text-xs" style={{ background: 'var(--bg-subtle)' }}>
            <span className="text-secondary">
              <strong>Mathematical Certainty:</strong> Every member verifies their exact units, entry NAV, and live equity at all times.
            </span>
          </div>

          <div className="flex justify-end pt-2">
            <button type="button" className="btn btn-primary btn-sm mono" onClick={onClose}>
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

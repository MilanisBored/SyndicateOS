import React from 'react';
import { 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  HelpCircle,
  TrendingUp,
  Award
} from 'lucide-react';

export default function HowNavWorksModal({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content p-7" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '680px' }}
      >
        <div className="modal-header pb-4 border-b border-subtle flex-row justify-between items-center">
          <div className="flex-row items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="modal-title font-bold text-lg">Why Unitized NAV is 100% Fair</h3>
              <p className="text-xs text-muted">How SyndicateVault eliminates the headache of friends entering & exiting</p>
            </div>
          </div>
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="mt-4 space-y-5 text-sm">
          {/* The Core Problem */}
          <div className="p-4 rounded-xl bg-input/40 border border-subtle">
            <h4 className="font-semibold text-rose-400 flex-row items-center gap-1.5 text-xs uppercase tracking-wider mb-2">
              <XCircle size={15} /> The Problem with Simple Cash Percentages
            </h4>
            <p className="text-xs text-secondary leading-relaxed">
              If you invest $1,000 and it doubles to $2,000, and then your friend deposits $2,000: simple addition would say you both put in $1,000 and $2,000 (total $4,000). 
              If the market later drops or dividend pays, who gets what? Tracking who joined when and their fair cut becomes a nightmare without unit accounting.
            </p>
          </div>

          {/* The Solution */}
          <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
            <h4 className="font-semibold text-indigo-300 flex-row items-center gap-1.5 text-xs uppercase tracking-wider mb-2">
              <CheckCircle2 size={15} className="text-emerald-400" /> The SyndicateVault Solution: Unitized NAV Pool
            </h4>
            <p className="text-xs text-secondary leading-relaxed">
              Just like mutual funds and hedge funds, your pool is divided into <strong>Units</strong> with a price called <strong>Net Asset Value (NAV)</strong>.
            </p>
          </div>

          {/* 3 Step Visual Walkthrough */}
          <div className="space-y-3">
            <div className="step-card p-3 rounded-lg border border-subtle bg-card flex-row items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                1
              </span>
              <div>
                <h5 className="font-bold text-xs text-text-primary">You Start the Fund</h5>
                <p className="text-xs text-muted mt-0.5">
                  Base NAV is set to <strong>100.00</strong>. You deposit 10,000 &rarr; You receive <strong>100 units</strong>. (Total Fund: 10,000 | Total Units: 100).
                </p>
              </div>
            </div>

            <div className="step-card p-3 rounded-lg border border-subtle bg-card flex-row items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                2
              </span>
              <div>
                <h5 className="font-bold text-xs text-text-primary">Portfolio Grows & Partner / Friend Joins Later</h5>
                <p className="text-xs text-muted mt-0.5">
                  The portfolio grows to 15,000 (+50%). NAV increases to <strong>150.00</strong>. 
                  Now your girlfriend or friend invests 7,500. Because they enter at NAV 150, they receive <strong>50 units</strong> (7,500 &divide; 150). 
                  They don't steal any of your past 50% profit!
                </p>
              </div>
            </div>

            <div className="step-card p-3 rounded-lg border border-subtle bg-card flex-row items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                3
              </span>
              <div>
                <h5 className="font-bold text-xs text-text-primary">Friend Takes Out Money (Redemption)</h5>
                <p className="text-xs text-muted mt-0.5">
                  Later, fund NAV climbs to <strong>180.00</strong>. Your friend wants 3,600 back for vacation. 
                  They redeem 20 units (3,600 &divide; 180) at current NAV. 
                  They take their earned profit, your remaining 100 units are still worth 180 each, and no math is disrupted!
                </p>
              </div>
            </div>
          </div>

          {/* Summary Box */}
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex-row items-center gap-2">
            <Award size={18} className="shrink-0" />
            <span>
              <strong>Zero Arguments, 100% Peace of Mind:</strong> Everyone can see their exact units, entry NAV, and live balance at all times.
            </span>
          </div>

          <div className="modal-actions pt-2 flex-row justify-end">
            <button type="button" className="btn btn-primary" onClick={onClose}>
              Got It, Makes Total Sense!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

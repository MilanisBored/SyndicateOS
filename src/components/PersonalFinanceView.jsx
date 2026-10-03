import React, { useState } from 'react';
import { formatCurrency, formatNumber } from '../utils/navEngine';

export default function PersonalFinanceView({ 
  personalFinances, 
  setPersonalFinances, 
  fundMetrics, 
  currency,
  onAddIncome,
  onDeleteIncome,
  onAddSoloAsset,
  onDeleteSoloAsset
}) {
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [showAddSoloAsset, setShowAddSoloAsset] = useState(false);

  const [incSource, setIncSource] = useState('');
  const [incAmount, setIncAmount] = useState('');
  const [incCategory, setIncCategory] = useState('Salary');
  const [incRecurrence, setIncRecurrence] = useState('Monthly');

  const [astName, setAstName] = useState('');
  const [astCategory, setAstCategory] = useState('Fixed Deposit');
  const [astValue, setAstValue] = useState('');
  const [astInstitution, setAstInstitution] = useState('');

  const totalMonthlyIncome = personalFinances.monthlyIncome.reduce(
    (acc, inc) => acc + (Number(inc.amount) || 0), 
    0
  );
  const totalSoloAssets = personalFinances.personalSoloAssets.reduce(
    (acc, ast) => acc + (Number(ast.value) || 0), 
    0
  );
  const mySyndicateStake = fundMetrics.myStakeValue;
  const myCombinedNetWorth = mySyndicateStake + totalSoloAssets;

  const handleAddIncome = (e) => {
    e.preventDefault();
    if (!incSource.trim() || !incAmount) return;

    const newInc = {
      id: `inc_${Date.now()}`,
      source: incSource.trim(),
      amount: Number(incAmount),
      category: incCategory,
      recurrence: incRecurrence,
      date: new Date().toISOString().split('T')[0],
    };

    if (onAddIncome) {
      onAddIncome(newInc);
    } else {
      setPersonalFinances((prev) => ({
        ...prev,
        monthlyIncome: [newInc, ...prev.monthlyIncome],
      }));
    }

    setIncSource('');
    setIncAmount('');
    setShowAddIncome(false);
  };

  const handleDeleteIncome = (id) => {
    if (confirm('Delete this income entry?')) {
      if (onDeleteIncome) {
        onDeleteIncome(id);
      } else {
        setPersonalFinances((prev) => ({
          ...prev,
          monthlyIncome: prev.monthlyIncome.filter((i) => i.id !== id),
        }));
      }
    }
  };

  const handleAddSoloAsset = (e) => {
    e.preventDefault();
    if (!astName.trim() || !astValue) return;

    const newAst = {
      id: `p_ast_${Date.now()}`,
      name: astName.trim(),
      category: astCategory,
      value: Number(astValue),
      institution: astInstitution.trim() || null,
    };

    if (onAddSoloAsset) {
      onAddSoloAsset(newAst);
    } else {
      setPersonalFinances((prev) => ({
        ...prev,
        personalSoloAssets: [...prev.personalSoloAssets, newAst],
      }));
    }

    setAstName('');
    setAstValue('');
    setAstInstitution('');
    setShowAddSoloAsset(false);
  };

  const handleDeleteSoloAsset = (id) => {
    if (confirm('Delete this solo asset?')) {
      if (onDeleteSoloAsset) {
        onDeleteSoloAsset(id);
      } else {
        setPersonalFinances((prev) => ({
          ...prev,
          personalSoloAssets: prev.personalSoloAssets.filter((a) => a.id !== id),
        }));
      }
    }
  };

  return (
    <div>
      {/* Metric Strip */}
      <div className="metric-strip">
        <div className="metric-cell">
          <span className="metric-label">Combined Net Worth</span>
          <span className="metric-val mono">{formatCurrency(myCombinedNetWorth, currency)}</span>
          <div className="metric-delta text-muted">
            <span>Pool equity + Solo assets</span>
          </div>
        </div>

        <div className="metric-cell">
          <span className="metric-label">Pool Equity</span>
          <span className="metric-val mono">{formatCurrency(mySyndicateStake, currency)}</span>
          <div className="metric-delta text-muted">
            <span>{formatNumber((mySyndicateStake / (myCombinedNetWorth || 1)) * 100, 1)}% of net worth</span>
          </div>
        </div>

        <div className="metric-cell">
          <span className="metric-label">Solo Assets</span>
          <span className="metric-val mono">{formatCurrency(totalSoloAssets, currency)}</span>
          <div className="metric-delta text-muted">
            <span>{personalFinances.personalSoloAssets.length} private holdings</span>
          </div>
        </div>

        <div className="metric-cell">
          <span className="metric-label">Monthly Income</span>
          <span className="metric-val mono">{formatCurrency(totalMonthlyIncome, currency)}</span>
          <div className="metric-delta text-muted">
            <span>{personalFinances.monthlyIncome.length} sources</span>
          </div>
        </div>
      </div>

      {/* Dual Table Grid */}
      <div className="clean-grid-dual">
        {/* Personal Incomes */}
        <div className="card p-4">
          <div className="section-head">
            <span className="section-title">Personal Incomes</span>
            <button 
              type="button" 
              className="btn btn-secondary btn-sm"
              onClick={() => setShowAddIncome(true)}
            >
              + Add
            </button>
          </div>

          <div className="table-responsive">
            <table className="dense-table">
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Category</th>
                  <th>Freq</th>
                  <th>Amount</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {personalFinances.monthlyIncome.map((inc) => (
                  <tr key={inc.id}>
                    <td className="font-medium">{inc.source}</td>
                    <td className="text-muted text-xs">{inc.category}</td>
                    <td className="text-muted text-xs">{inc.recurrence}</td>
                    <td className="mono font-semibold text-profit">
                      +{formatCurrency(inc.amount, currency)}
                    </td>
                    <td className="text-right">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '1px 5px', fontSize: 10 }}
                        onClick={() => handleDeleteIncome(inc.id)}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Solo Holdings */}
        <div className="card p-4">
          <div className="section-head">
            <span className="section-title">Solo Assets (Private)</span>
            <button 
              type="button" 
              className="btn btn-secondary btn-sm"
              onClick={() => setShowAddSoloAsset(true)}
            >
              + Add
            </button>
          </div>

          <div className="table-responsive">
            <table className="dense-table">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Category</th>
                  <th>Value</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {personalFinances.personalSoloAssets.map((ast) => (
                  <tr key={ast.id}>
                    <td className="font-medium">{ast.name}</td>
                    <td className="text-muted text-xs">{ast.category}</td>
                    <td className="mono font-semibold">{formatCurrency(ast.value, currency)}</td>
                    <td className="text-right">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '1px 5px', fontSize: 10 }}
                        onClick={() => handleDeleteSoloAsset(ast.id)}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Income Modal */}
      {showAddIncome && (
        <div className="modal-overlay" onClick={() => setShowAddIncome(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="section-head mb-3">
              <span className="section-title">Add Income</span>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAddIncome(false)}>✕</button>
            </div>
            <form onSubmit={handleAddIncome}>
              <div className="form-group">
                <label className="form-label">Source / Employer</label>
                <input
                  type="text"
                  placeholder="e.g. Primary Salary"
                  value={incSource}
                  onChange={(e) => setIncSource(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Amount</label>
                  <input
                    type="number"
                    value={incAmount}
                    onChange={(e) => setIncAmount(e.target.value)}
                    className="form-input mono"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    value={incCategory}
                    onChange={(e) => setIncCategory(e.target.value)}
                    className="form-select"
                  >
                    <option value="Salary">Salary</option>
                    <option value="Freelance">Freelance</option>
                    <option value="Passive">Passive</option>
                    <option value="Bonus">Bonus</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAddIncome(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Solo Asset Modal */}
      {showAddSoloAsset && (
        <div className="modal-overlay" onClick={() => setShowAddSoloAsset(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="section-head mb-3">
              <span className="section-title">Add Solo Asset</span>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAddSoloAsset(false)}>✕</button>
            </div>
            <form onSubmit={handleAddSoloAsset}>
              <div className="form-group">
                <label className="form-label">Asset Name</label>
                <input
                  type="text"
                  placeholder="e.g. Emergency FD"
                  value={astName}
                  onChange={(e) => setAstName(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Value</label>
                  <input
                    type="number"
                    value={astValue}
                    onChange={(e) => setAstValue(e.target.value)}
                    className="form-input mono"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    value={astCategory}
                    onChange={(e) => setAstCategory(e.target.value)}
                    className="form-select"
                  >
                    <option value="Fixed Deposit">Fixed Deposit</option>
                    <option value="Retirement">Retirement (EPF/401k)</option>
                    <option value="Crypto">Crypto (Cold Storage)</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAddSoloAsset(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

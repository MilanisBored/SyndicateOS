import React, { useState, useRef, useEffect } from 'react';
import { formatCurrency, formatNumber } from '../utils/navEngine';
import { 
  searchMutualFundsAMFI,
  fetchMutualFundNav,
  syncMutualFundHoldingsBatch
} from '../services/marketDataService';

export default function HoldingsView({ 
  holdings, 
  onSaveHolding,
  onDeleteHolding,
  fundMetrics, 
  currency, 
  fundInfo,
  perspective = 'manager',
  onSyncValuationToNAV 
}) {
  const isInvestor = perspective === 'investor' || fundInfo?.userRole === 'investor';
  const isPrivateMandate = isInvestor && (fundInfo?.portfolioVisibility === 'private' || !fundInfo?.portfolioVisibility);
  const [isEditing, setIsEditing] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);

  // Quick inline price and units update state
  const [inlineEditingId, setInlineEditingId] = useState(null);
  const [inlinePriceVal, setInlinePriceVal] = useState('');
  const [inlineUnitsEditingId, setInlineUnitsEditingId] = useState(null);
  const [inlineUnitsVal, setInlineUnitsVal] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [ticker, setTicker] = useState('');
  const [category, setCategory] = useState('Mutual Funds / ETFs');
  const [investedAmount, setInvestedAmount] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [units, setUnits] = useState('');
  const [notes, setNotes] = useState('');
  const [holdingStatus, setHoldingStatus] = useState('active');
  const [realizedPnlInput, setRealizedPnlInput] = useState('');
  const [positionFilter, setPositionFilter] = useState('all');
  const [isFetchingSingleQuote, setIsFetchingSingleQuote] = useState(false);
  const [singleQuoteStatus, setSingleQuoteStatus] = useState('');

  // Live AMFI search suggestions state
  const [fundSuggestions, setFundSuggestions] = useState([]);
  const [isSearchingFund, setIsSearchingFund] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [latestNavPrice, setLatestNavPrice] = useState(null);
  const searchDebounceRef = useRef(null);
  const autocompleteContainerRef = useRef(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (autocompleteContainerRef.current && !autocompleteContainerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Batch Sync Live Prices Modal State
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isBatchSyncing, setIsBatchSyncing] = useState(false);
  const [batchProgress, setBatchProgress] = useState(null);
  const [batchSummary, setBatchSummary] = useState(null);

  const activeHoldings = holdings.filter((h) => h.status !== 'closed');
  const closedHoldings = holdings.filter((h) => h.status === 'closed');
  const totalInvested = activeHoldings.reduce((sum, h) => sum + (Number(h.investedAmount) || 0), 0);
  const totalHoldingsValue = activeHoldings.reduce((sum, h) => sum + (Number(h.currentValue) || 0), 0);
  const unrealizedProfit = totalHoldingsValue - totalInvested;
  const unrealizedRoi = totalInvested > 0 ? (unrealizedProfit / totalInvested) * 100 : 0;
  const realizedProfit = holdings.reduce((sum, h) => sum + (Number(h.realizedPnl) || 0), 0);
  const totalHoldingsProfit = unrealizedProfit + realizedProfit;
  const totalHoldingsRoi = totalInvested > 0 ? (totalHoldingsProfit / totalInvested) * 100 : 0;

  const categoryBreakdown = activeHoldings.reduce((acc, h) => {
    const cat = h.category || 'Asset Allocation';
    if (!acc[cat]) {
      acc[cat] = { category: cat, costBasis: 0, currentValue: 0, count: 0 };
    }
    acc[cat].costBasis += (Number(h.investedAmount) || 0);
    acc[cat].currentValue += (Number(h.currentValue) || 0);
    acc[cat].count += 1;
    return acc;
  }, {});
  const categoryList = Object.values(categoryBreakdown);

  const handleOpenAdd = () => {
    setEditingAsset(null);
    setName('');
    setTicker('');
    setCategory('Mutual Funds / ETFs');
    setInvestedAmount('');
    setCurrentValue('');
    setUnits('');
    setHoldingStatus('active');
    setRealizedPnlInput('');
    setNotes('');
    setSingleQuoteStatus('');
    setFundSuggestions([]);
    setShowSuggestions(false);
    setLatestNavPrice(null);
    setIsEditing(true);
  };

  const handleOpenEdit = (ast) => {
    setEditingAsset(ast);
    setName(ast.name);
    setTicker(ast.ticker);
    setCategory(ast.category);
    setInvestedAmount(ast.investedAmount);
    setCurrentValue(ast.currentValue);
    setUnits(ast.units || ast.quantity || '');
    setHoldingStatus(ast.status || 'active');
    setRealizedPnlInput(ast.realizedPnl !== undefined && ast.realizedPnl !== null ? ast.realizedPnl : '');
    setNotes(ast.notes || '');
    setSingleQuoteStatus('');
    setFundSuggestions([]);
    setShowSuggestions(false);
    setLatestNavPrice(null);
    setIsEditing(true);
  };

  const handleNameChange = (val) => {
    setName(val);

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    const trimmed = val.trim();
    if (trimmed.length < 2) {
      setFundSuggestions([]);
      setShowSuggestions(false);
      setIsSearchingFund(false);
      return;
    }

    // Live search AMFI as user types
    setIsSearchingFund(true);
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const results = await searchMutualFundsAMFI(trimmed);
        setFundSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch (err) {
        console.error('AMFI search error:', err);
      } finally {
        setIsSearchingFund(false);
      }
    }, 200);
  };

  const handleSelectSuggestion = async (item) => {
    setName(item.schemeName);
    setTicker(String(item.schemeCode));
    setCategory('Mutual Funds / ETFs');
    setFundSuggestions([]);
    setShowSuggestions(false);

    // Auto-fetch latest NAV immediately
    setIsFetchingSingleQuote(true);
    setSingleQuoteStatus(`Fetching live NAV for ${item.schemeName}...`);
    try {
      const res = await fetchMutualFundNav(item.schemeCode);
      setLatestNavPrice(res.nav);
      setSingleQuoteStatus(`Live AMFI NAV: ${formatCurrency(res.nav, currency, { decimals: 4 })} (Declared: ${res.date})`);

      const numUnits = Number(units);
      if (numUnits && numUnits > 0) {
        setCurrentValue(Math.round(numUnits * res.nav * 100) / 100);
      }
    } catch (err) {
      setSingleQuoteStatus(`Error fetching NAV: ${err.message}`);
    } finally {
      setIsFetchingSingleQuote(false);
    }
  };

  const handleUnitsChange = (val) => {
    setUnits(val);
    const numUnits = Number(val);
    if (latestNavPrice && numUnits > 0) {
      setCurrentValue(Math.round(numUnits * latestNavPrice * 100) / 100);
    }
  };

  const handleFetchSingleQuote = async () => {
    const term = ticker.trim() || name.trim();
    if (!term) {
      alert('Please enter a Mutual Fund Scheme Name or 6-digit Code (e.g. Parag Parikh Flexi Cap, SBI Small Cap, HDFC Top 100).');
      return;
    }

    setIsFetchingSingleQuote(true);
    setSingleQuoteStatus('Fetching official NAV from AMFI (mfapi.in)...');

    try {
      const res = await fetchMutualFundNav(term);
      setLatestNavPrice(res.nav);
      setSingleQuoteStatus(`NAV: ${formatCurrency(res.nav, currency, { decimals: 4 })} (Date: ${res.date})`);
      if (!name) setName(res.schemeName);
      if (!ticker && res.schemeCode) setTicker(String(res.schemeCode));

      const numUnits = Number(units);
      if (numUnits && numUnits > 0) {
        setCurrentValue(Math.round(numUnits * res.nav * 100) / 100);
      } else if (!currentValue) {
        setCurrentValue(res.nav);
      }
    } catch (err) {
      setSingleQuoteStatus(`Error: ${err.message}`);
    } finally {
      setIsFetchingSingleQuote(false);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!name.trim() || !investedAmount || !currentValue) return;

    const payload = {
      id: editingAsset ? editingAsset.id : `ast_${Date.now()}`,
      name: name.trim(),
      ticker: ticker.toUpperCase() || name.substring(0, 4).toUpperCase(),
      category,
      investedAmount: Number(investedAmount),
      currentValue: Number(currentValue),
      units: Number(units) || null,
      status: holdingStatus,
      realizedPnl: realizedPnlInput !== '' ? Number(realizedPnlInput) : 0,
      notes: notes.trim(),
    };

    onSaveHolding(payload);
    setIsEditing(false);
  };

  // Run the 1-Click Batch Price Sync for Mutual Funds
  const handleRunBatchSync = async () => {
    setIsBatchSyncing(true);
    setBatchProgress({ current: 0, total: holdings.length, name: 'Starting AMFI live sync...' });
    setBatchSummary(null);

    try {
      const syncResult = await syncMutualFundHoldingsBatch(holdings, (p) => {
        setBatchProgress({ current: p.currentIndex, total: p.total, name: p.currentHolding });
      });

      // Apply each updated holding value
      for (const res of syncResult.results) {
        if (res.success) {
          const target = holdings.find(h => h.id === res.holdingId);
          if (target) {
            await onSaveHolding({
              ...target,
              currentValue: res.newValue,
              lastNav: res.liveNav,
            });
          }
        }
      }

      // Sync fund NAV to match new total valuation
      if (onSyncValuationToNAV) {
        onSyncValuationToNAV();
      }

      setBatchSummary(syncResult);
    } catch (err) {
      alert(`AMFI sync failed: ${err.message}`);
    } finally {
      setIsBatchSyncing(false);
      setBatchProgress(null);
    }
  };

  const handleInlineSave = (ast) => {
    const val = Number(inlinePriceVal);
    if (!val || val <= 0) {
      setInlineEditingId(null);
      return;
    }

    onSaveHolding({
      ...ast,
      currentValue: val,
    });
    setInlineEditingId(null);
  };

  const handleInlineUnitsSave = async (ast) => {
    const val = Number(inlineUnitsVal);
    if (isNaN(val) || val < 0) {
      setInlineUnitsEditingId(null);
      return;
    }

    let newCurrentVal = ast.currentValue;
    // If live NAV is accessible, update market value
    if (val > 0) {
      try {
        const quote = await fetchMutualFundNav(ast.ticker || ast.name);
        if (quote && quote.nav) {
          newCurrentVal = Math.round(val * quote.nav * 100) / 100;
        }
      } catch (e) {
        // keep current value
      }
    }

    await onSaveHolding({
      ...ast,
      units: val > 0 ? val : null,
      currentValue: newCurrentVal,
    });
    setInlineUnitsEditingId(null);
  };

  const handleDelete = (id) => {
    if (confirm('Delete this asset position?')) {
      onDeleteHolding(id);
    }
  };

  return (
    <div>
      {/* Metric Strip */}
      <div className="metric-strip">
        <div className="metric-cell">
          <span className="metric-label">Holdings Valuation</span>
          <span className="metric-val mono">{formatCurrency(totalHoldingsValue, currency)}</span>
          <div className="metric-delta">
            <span className={unrealizedProfit >= 0 ? 'text-profit' : 'text-loss'}>
              {unrealizedProfit >= 0 ? '+' : ''}{formatCurrency(unrealizedProfit, currency, { decimals: 0 })} ({formatNumber(unrealizedRoi, 1)}%)
            </span>
          </div>
        </div>

        <div className="metric-cell">
          <span className="metric-label">Current Fund NAV</span>
          <span className="metric-val mono">{formatCurrency(fundMetrics.currentNav, currency, { decimals: 2 })}</span>
          <div className="metric-delta text-muted">
            <span>Directly derived from holdings</span>
          </div>
        </div>

        <div className="metric-cell">
          <span className="metric-label">Total Cost Basis</span>
          <span className="metric-val mono">{formatCurrency(totalInvested, currency)}</span>
          <div className="metric-delta text-muted">
            <span>Booked: {realizedProfit >= 0 ? '+' : ''}{formatCurrency(realizedProfit, currency, { decimals: 0 })} • {activeHoldings.length} active</span>
          </div>
        </div>

        <div className="metric-cell flex items-center justify-end gap-2">
          {!isInvestor ? (
            <>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setBatchSummary(null);
                  setIsSyncModalOpen(true);
                }}
                disabled={isBatchSyncing || holdings.length === 0}
                title="Auto-fetch live NSE/BSE stock and AMFI mutual fund prices in 1 batch"
              >
                {isBatchSyncing ? 'SYNCING...' : 'SYNC LIVE PRICES'}
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleOpenAdd}
              >
                + Add Asset / FD
              </button>
            </>
          ) : (
            <span className="badge badge-neutral mono text-xs">
              Portfolio Backing • Managed by {fundInfo?.managerName || 'Fund Manager'}
            </span>
          )}
        </div>
      </div>

      {/* Unallocated Liquid Cash Banner */}
      {fundMetrics.undeployedCash > 0 && (
        <div 
          className="card p-3 mb-3 flex justify-between items-center text-xs"
          style={{ background: 'rgba(99, 102, 241, 0.06)', border: '1px solid rgba(99, 102, 241, 0.25)' }}
        >
          <div className="flex items-center gap-2">
            <span className="badge badge-profit mono font-semibold" style={{ fontSize: 10 }}>UNALLOCATED CASH</span>
            <span>
              <strong>{formatCurrency(fundMetrics.undeployedCash, currency)}</strong> of newly deposited member capital is held as liquid bank balance (100% NAV protected).
            </span>
          </div>
          {!isInvestor && (
            <span className="text-muted">
              Add new positions or record SIP investments to deploy this capital.
            </span>
          )}
        </div>
      )}

      {/* Holdings Content: Discretionary Trust Mandate for Investors or Full Positions Table for Managers/Transparent */}
      {isPrivateMandate ? (
        <div className="space-y-4">
          {/* Institutional Discretionary Mandate Security Card */}
          <div 
            className="card p-4" 
            style={{ 
              background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)', 
              border: '1px solid var(--border-color)' 
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="badge badge-warning mono font-semibold" style={{ fontSize: 10 }}>
                  DISCRETIONARY TRUST MANDATE
                </span>
                <span className="badge badge-neutral mono" style={{ fontSize: 9 }}>
                  CONFIDENTIAL PORTFOLIO
                </span>
              </div>
              <span className="text-xs text-muted mono">
                Fund Manager: <strong>{fundInfo?.managerName || 'Manager'}</strong>
              </span>
            </div>
            <p className="text-sm leading-relaxed mb-3 text-secondary">
              Under this syndicate pool mandate, granular underlying stock tickers, intraday trade logs, and broker execution notes remain <strong>strictly confidential</strong> to the Fund Manager. This eliminates retail panic over daily market fluctuations, prevents strategy front-running, and safeguards proprietary trading execution.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs mono pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <div>
                <span className="text-muted block text-xxs">NAV PROTECTION</span>
                <span className="text-primary font-medium">Unitized Daily NAV Tracking</span>
              </div>
              <div>
                <span className="text-muted block text-xxs">TRANSACTION AUDIT</span>
                <span className="text-profit font-medium">100% Verified Two-Way Ledger</span>
              </div>
              <div>
                <span className="text-muted block text-xxs">CONFIDENTIALITY</span>
                <span className="text-secondary font-medium">Proprietary Alpha Shield</span>
              </div>
            </div>
          </div>

          {/* Asset Allocation Breakdown Table */}
          <div className="card p-4">
            <div className="section-head mb-3">
              <div>
                <span className="section-title">Syndicate Asset Class Allocation</span>
                <span className="text-xs text-muted block">
                  Broad asset classes backing current fund NAV. Granular stock positions are managed confidentially by the manager.
                </span>
              </div>
            </div>

            <div className="table-responsive">
              <table className="dense-table">
                <thead>
                  <tr>
                    <th>Asset Class</th>
                    <th>Positions</th>
                    <th>Allocation Cost</th>
                    <th>Current Valuation</th>
                    <th>Net Return</th>
                    <th>Portfolio Weight</th>
                    <th>Mandate Status</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryList.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center text-muted py-6">
                        No asset positions logged yet. Pool is currently held in 100% liquid cash.
                      </td>
                    </tr>
                  ) : (
                    categoryList.map((cat) => {
                      const gain = cat.currentValue - cat.costBasis;
                      const roi = cat.costBasis > 0 ? (gain / cat.costBasis) * 100 : 0;
                      const weight = totalHoldingsValue > 0 ? (cat.currentValue / totalHoldingsValue) * 100 : 0;
                      return (
                        <tr key={cat.category}>
                          <td className="font-semibold text-primary">{cat.category}</td>
                          <td className="mono text-muted">{cat.count} position{cat.count > 1 ? 's' : ''}</td>
                          <td className="mono text-muted">{formatCurrency(cat.costBasis, currency)}</td>
                          <td className="mono font-semibold">{formatCurrency(cat.currentValue, currency)}</td>
                          <td className={`mono ${gain >= 0 ? 'text-profit' : 'text-loss'}`}>
                            {gain >= 0 ? '+' : ''}{formatCurrency(gain, currency, { decimals: 0 })} ({formatNumber(roi, 1)}%)
                          </td>
                          <td className="mono font-medium">{formatNumber(weight, 1)}%</td>
                          <td>
                            <span className="badge badge-neutral mono" style={{ fontSize: 9 }}>
                              DISCRETIONARY
                            </span>
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
      ) : (
        <div className="card p-4">
          <div className="section-head flex-wrap gap-2">
            <div>
              <span className="section-title">Syndicate Portfolio Positions</span>
              <span className="text-xs text-muted block">
                Updating any FD or asset price updates the fund NAV and all participants' balances automatically.
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                className={`btn btn-sm mono ${positionFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: 10, padding: '2px 8px' }}
                onClick={() => setPositionFilter('all')}
              >
                All ({holdings.length})
              </button>
              <button
                type="button"
                className={`btn btn-sm mono ${positionFilter === 'active' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: 10, padding: '2px 8px' }}
                onClick={() => setPositionFilter('active')}
              >
                Active ({activeHoldings.length})
              </button>
              {closedHoldings.length > 0 && (
                <button
                  type="button"
                  className={`btn btn-sm mono ${positionFilter === 'closed' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: 10, padding: '2px 8px' }}
                  onClick={() => setPositionFilter('closed')}
                >
                  Closed ({closedHoldings.length})
                </button>
              )}
            </div>
          </div>

        <div className="table-responsive">
          <table className="dense-table">
            <thead>
              <tr>
                <th>Ticker / Code</th>
                <th>Asset Name</th>
                <th>Category</th>
                <th>Units / Qty</th>
                <th>Cost Basis</th>
                <th>Market Value (Current)</th>
                <th>Return</th>
                <th>Weight</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(positionFilter === 'active' ? activeHoldings : positionFilter === 'closed' ? closedHoldings : holdings).length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center text-muted py-6">
                    {positionFilter === 'closed' ? 'No closed positions logged yet.' : 'No holdings yet. Click "+ Add Asset / FD" to log an investment or Fixed Deposit.'}
                  </td>
                </tr>
              ) : (
                (positionFilter === 'active' ? activeHoldings : positionFilter === 'closed' ? closedHoldings : holdings).map((ast) => {
                  const gain = ast.status === 'closed' && ast.realizedPnl !== undefined ? ast.realizedPnl : (ast.currentValue - ast.investedAmount);
                  const roi = ast.investedAmount > 0 ? (gain / ast.investedAmount) * 100 : 0;
                  const weight = totalHoldingsValue > 0 && ast.status !== 'closed' ? (ast.currentValue / totalHoldingsValue) * 100 : 0;
                  const isInline = inlineEditingId === ast.id;
                  const isUnitsInline = inlineUnitsEditingId === ast.id;

                  return (
                    <tr key={ast.id}>
                      <td className="mono font-semibold">
                        {ast.ticker}
                        {ast.status === 'closed' && (
                          <span className="badge badge-neutral mono" style={{ fontSize: 9, marginLeft: 6 }}>CLOSED</span>
                        )}
                      </td>
                      <td className="font-medium">
                        <div>{ast.name}</div>
                        {ast.notes && <div className="text-xs text-muted truncate" style={{ maxWidth: 160 }}>{ast.notes}</div>}
                      </td>
                      <td className="text-muted text-xs">{ast.category}</td>
                      
                      {/* Units / Qty */}
                      <td>
                        {isUnitsInline ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="any"
                              placeholder="Units"
                              value={inlineUnitsVal}
                              onChange={(e) => setInlineUnitsVal(e.target.value)}
                              className="form-input mono"
                              style={{ width: 85, padding: '2px 5px', fontSize: 11 }}
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleInlineUnitsSave(ast);
                                if (e.key === 'Escape') setInlineUnitsEditingId(null);
                              }}
                            />
                            <button
                              type="button"
                              className="btn btn-primary btn-sm mono"
                              style={{ padding: '2px 6px', fontSize: 10 }}
                              onClick={() => handleInlineUnitsSave(ast)}
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm mono"
                              style={{ padding: '2px 6px', fontSize: 10 }}
                              onClick={() => setInlineUnitsEditingId(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : ast.units && Number(ast.units) > 0 ? (
                          <div 
                            style={{ cursor: 'pointer' }}
                            onClick={() => {
                              setInlineUnitsEditingId(ast.id);
                              setInlineUnitsVal(ast.units);
                            }}
                            title="Click to edit units"
                          >
                            <span className="mono text-muted">{formatNumber(ast.units, 3)}</span>
                          </div>
                        ) : (
                          <span
                            className="text-muted"
                            style={{ cursor: 'pointer', fontSize: 12 }}
                            onClick={() => {
                              setInlineUnitsEditingId(ast.id);
                              setInlineUnitsVal('');
                            }}
                            title="Click to add units"
                          >
                            —
                          </span>
                        )}
                      </td>

                      <td className="mono text-muted">{formatCurrency(ast.investedAmount, currency, { decimals: 0 })}</td>
                      
                      {/* Current Value (Quick inline editable) */}
                      <td>
                        {isInline ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="any"
                              value={inlinePriceVal}
                              onChange={(e) => setInlinePriceVal(e.target.value)}
                              className="form-input mono"
                              style={{ width: 100, padding: '2px 6px', fontSize: 11 }}
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleInlineSave(ast);
                                if (e.key === 'Escape') setInlineEditingId(null);
                              }}
                            />
                            <button
                              type="button"
                              className="btn btn-primary btn-sm mono"
                              style={{ padding: '2px 6px', fontSize: 10 }}
                              onClick={() => handleInlineSave(ast)}
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm mono"
                              style={{ padding: '2px 6px', fontSize: 10 }}
                              onClick={() => setInlineEditingId(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div 
                            className="flex items-center gap-1"
                            style={{ cursor: 'pointer' }}
                            onClick={() => {
                              setInlineEditingId(ast.id);
                              setInlinePriceVal(ast.currentValue);
                            }}
                            title="Click to quickly update weekly/daily price"
                          >
                            <span className="mono font-semibold">{formatCurrency(ast.currentValue, currency)}</span>
                            <span className="text-xs text-muted hover:underline" style={{ fontSize: 10 }}>(edit)</span>
                          </div>
                        )}
                      </td>

                      <td className={`mono ${gain >= 0 ? 'text-profit' : 'text-loss'}`}>
                        {gain >= 0 ? '+' : ''}{formatCurrency(gain, currency, { decimals: 0 })} ({formatNumber(roi, 1)}%)
                        {ast.status === 'closed' && (
                          <span className="text-xxs text-muted block mono">[BOOKED]</span>
                        )}
                      </td>
                      <td className="mono text-muted">{formatNumber(weight, 1)}%</td>
                      <td>
                        {!isInvestor ? (
                          <div className="flex gap-1">
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '2px 6px', fontSize: 11 }}
                              onClick={async () => {
                                const amount = prompt(`Enter SIP Amount to add to ${ast.name}:`);
                                if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return;
                                const addAmt = Number(amount);

                                let addUnits = 0;
                                const unitsStr = prompt(`(Optional) Enter Units bought with this SIP (or leave blank to auto-calculate via live NAV):`);
                                if (unitsStr && !isNaN(Number(unitsStr)) && Number(unitsStr) > 0) {
                                  addUnits = Number(unitsStr);
                                } else {
                                  try {
                                    const quote = await fetchMutualFundNav(ast.ticker || ast.name);
                                    if (quote?.nav) {
                                      addUnits = Math.round((addAmt / quote.nav) * 1000) / 1000;
                                    }
                                  } catch (e) {}
                                }

                                const currentUnits = Number(ast.units) || 0;
                                const updatedUnits = currentUnits + addUnits;

                                onSaveHolding({
                                  ...ast,
                                  investedAmount: ast.investedAmount + addAmt,
                                  currentValue: ast.currentValue + addAmt,
                                  units: updatedUnits > 0 ? updatedUnits : null,
                                });
                              }}
                              title="Add monthly/weekly SIP purchase amount"
                            >
                              + SIP
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '2px 6px', fontSize: 11 }}
                              onClick={() => handleOpenEdit(ast)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm mono"
                              style={{ padding: '2px 6px', fontSize: 11 }}
                              onClick={() => handleDelete(ast.id)}
                            >
                              Del
                            </button>
                          </div>
                        ) : (
                          <span className="badge badge-neutral mono" style={{ fontSize: 10, padding: '2px 6px' }}>
                            ASSET BACKING
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Add / Edit Modal */}
      {isEditing && (
        <div className="modal-overlay" onClick={() => setIsEditing(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="section-head mb-3">
              <span className="section-title">{editingAsset ? 'Edit Position' : 'New Position / FD'}</span>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsEditing(false)}>Cancel</button>
            </div>

            <form onSubmit={handleSave}>
              <div className="form-group" ref={autocompleteContainerRef}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>Investment / Scheme Name</label>
                  {category === 'Mutual Funds / ETFs' && (
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      Type 2+ characters for live AMFI suggestions
                    </span>
                  )}
                </div>
                <div className="autocomplete-container">
                  <input
                    type="text"
                    placeholder={
                      category === 'Mutual Funds / ETFs'
                        ? "Search fund (e.g. Parag Parikh, Quant Small Cap, Mirae, HDFC)..."
                        : "e.g. HDFC 1-Year FD (7.4%) or Gold ETF"
                    }
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    onFocus={() => {
                      if (fundSuggestions.length > 0) setShowSuggestions(true);
                    }}
                    className="form-input"
                    required
                    autoComplete="off"
                  />
                  {isSearchingFund && (
                    <div style={{ position: 'absolute', right: 10, top: 7, fontSize: 11, color: 'var(--text-muted)' }}>
                      Searching AMFI...
                    </div>
                  )}
                  {showSuggestions && fundSuggestions.length > 0 && (
                    <div className="autocomplete-dropdown">
                      {fundSuggestions.map((item) => {
                        const isDirect = item.schemeName.toLowerCase().includes('direct');
                        const isGrowth = item.schemeName.toLowerCase().includes('growth');
                        return (
                          <div
                            key={item.schemeCode}
                            className="autocomplete-item"
                            onClick={() => handleSelectSuggestion(item)}
                          >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, minWidth: 0 }}>
                              <span className="autocomplete-item-name" style={{ wordBreak: 'break-word' }}>
                                {item.schemeName}
                              </span>
                              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                {isDirect && (
                                  <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', fontWeight: 600 }}>
                                    DIRECT
                                  </span>
                                )}
                                {isGrowth && (
                                  <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                    GROWTH
                                  </span>
                                )}
                                <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                                  #{item.schemeCode}
                                </span>
                              </div>
                            </div>
                            <span className="btn btn-secondary btn-sm" style={{ fontSize: 10, padding: '2px 8px', pointerEvents: 'none' }}>
                              Select
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group flex-1">
                  <label className="form-label">Ticker / Code</label>
                  <input
                    type="text"
                    placeholder="e.g. 122639, RELIANCE, etc."
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value)}
                    className="form-input mono"
                  />
                </div>
                <div className="form-group flex-1">
                  <label className="form-label">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="form-select"
                  >
                    <option value="Equities / Stocks">Equities / Stocks</option>
                    <option value="Mutual Funds / ETFs">Mutual Funds / ETFs</option>
                    <option value="Fixed Deposit (FD)">Fixed Deposit (FD)</option>
                    <option value="Govt Bonds / Debt">Govt Bonds / Debt</option>
                    <option value="Precious Metals (Gold)">Precious Metals (Gold)</option>
                    <option value="Crypto">Crypto</option>
                    <option value="Liquid Cash / Overnight">Liquid Cash / Overnight</option>
                  </select>
                </div>
              </div>

              {/* Units & Live Quote Fetcher */}
              <div className="form-row items-end">
                <div className="form-group flex-1">
                  <label className="form-label">Units / Quantity (Optional)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 50 shares or 1240.5 units"
                    value={units}
                    onChange={(e) => handleUnitsChange(e.target.value)}
                    className="form-input mono"
                  />
                </div>
                <div className="form-group pb-1">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleFetchSingleQuote}
                    disabled={isFetchingSingleQuote || (!ticker.trim() && !name.trim())}
                  >
                    {isFetchingSingleQuote ? 'FETCHING...' : 'FETCH LIVE PRICE'}
                  </button>
                </div>
              </div>
              {singleQuoteStatus && (
                <div className="text-xs mono mb-2 text-secondary">{singleQuoteStatus}</div>
              )}

              <div className="form-row">
                <div className="form-group flex-1">
                  <label className="form-label">Cost Basis (Invested Amount)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 50000"
                    value={investedAmount}
                    onChange={(e) => setInvestedAmount(e.target.value)}
                    className="form-input mono"
                    required
                  />
                </div>
                <div className="form-group flex-1">
                  <label className="form-label">Current Value (Market Value)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 51850"
                    value={currentValue}
                    onChange={(e) => setCurrentValue(e.target.value)}
                    className="form-input mono"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group flex-1">
                  <label className="form-label">Position Status</label>
                  <select
                    value={holdingStatus}
                    onChange={(e) => setHoldingStatus(e.target.value)}
                    className="form-select mono"
                  >
                    <option value="active">Active (Open Position)</option>
                    <option value="closed">Closed / Realized (Exited Trade)</option>
                  </select>
                </div>
                <div className="form-group flex-1">
                  <label className="form-label">Realized Profit / Booked PnL</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 12500 or -3500"
                    value={realizedPnlInput}
                    onChange={(e) => setRealizedPnlInput(e.target.value)}
                    className="form-input mono"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Notes / Maturity Date / Interest Rate</label>
                <input
                  type="text"
                  placeholder="e.g. SIP Active, Matures Oct 2027 @ 7.4% p.a."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="flex justify-end gap-2 mt-4 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsEditing(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">Save Position</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 1-Click Batch Live Sync Modal */}
      {isSyncModalOpen && (
        <div className="modal-overlay" onClick={() => !isBatchSyncing && setIsSyncModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
            <div className="section-head mb-3">
              <div>
                <span className="section-title">Live Market Price Synchronizer</span>
                <span className="text-xs text-muted block">
                  1-Click Batch Sync via IndianAPI (NSE/BSE) & AMFI Free Data Feeds
                </span>
              </div>
              <button 
                type="button" 
                className="btn btn-secondary btn-sm mono" 
                onClick={() => setIsSyncModalOpen(false)}
                disabled={isBatchSyncing}
              >
                Close
              </button>
            </div>

            {/* AMFI Overview */}
            {(() => {
              const mfHoldings = holdings.filter(h => {
                const c = (h.category || '').toLowerCase();
                return c.includes('mutual') || c.includes('sip') || c.includes('fund');
              });

              return (
                <div>
                  <div className="card p-3 mb-3 bg-secondary text-xs mono">
                    <div className="flex justify-between items-center mb-1">
                      <span>Data Feed:</span>
                      <strong className="text-profit">
                        Official AMFI Database (mfapi.in)
                      </strong>
                    </div>
                    <div className="text-muted">
                      Eligible Mutual Funds & SIPs: <strong>{mfHoldings.length} positions</strong>
                    </div>
                    <div className="text-muted mt-1 text-xs">
                      100% Free, zero API key required, pulls official SEBI daily closing NAVs.
                    </div>
                  </div>

                  {/* Progress Indicator */}
                  {isBatchSyncing && batchProgress && (
                    <div className="card p-3 mb-3 text-xs mono">
                      <div className="flex justify-between mb-1">
                        <span>Fetching latest NAV from AMFI...</span>
                        <span>{batchProgress.current} / {batchProgress.total}</span>
                      </div>
                      <div style={{ background: 'var(--bg-tertiary)', height: 6, borderRadius: 3, overflow: 'hidden' }}>
                        <div 
                          style={{ 
                            background: 'var(--accent-primary)', 
                            height: '100%', 
                            width: `${(batchProgress.current / Math.max(1, batchProgress.total)) * 100}%`,
                            transition: 'width 0.2s ease'
                          }} 
                        />
                      </div>
                      <span className="text-muted mt-2 block truncate">Querying: {batchProgress.name}</span>
                    </div>
                  )}

                  {/* Batch Summary */}
                  {batchSummary && (
                    <div className="card p-3 mb-3 text-xs">
                      <div className="font-semibold text-profit mb-2 mono">
                        Sync Complete: Updated {batchSummary.totalUpdated} of {batchSummary.results.length} mutual funds to latest official AMFI NAVs.
                      </div>
                      <div className="table-responsive" style={{ maxHeight: 220 }}>
                        <table className="dense-table text-xs">
                          <thead>
                            <tr>
                              <th>Fund</th>
                              <th>Previous</th>
                              <th>New Value</th>
                              <th>Latest NAV</th>
                              <th>Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {batchSummary.results.map((r, idx) => {
                              const diff = r.newValue - r.oldValue;
                              const pct = r.oldValue > 0 ? (diff / r.oldValue) * 100 : 0;
                              return (
                                <tr key={idx}>
                                  <td className="font-medium">{r.ticker || r.name}</td>
                                  <td className="mono text-muted">{formatCurrency(r.oldValue, currency, { decimals: 0 })}</td>
                                  <td className="mono font-semibold">{formatCurrency(r.newValue, currency, { decimals: 0 })}</td>
                                  <td className="mono text-primary font-semibold">{r.liveNav ? formatCurrency(r.liveNav, currency, { decimals: 4 }) : '—'}</td>
                                  <td className="text-muted text-xs mono">{r.navDate || (r.success ? 'Today' : r.error)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 mt-3">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setIsSyncModalOpen(false)}
                      disabled={isBatchSyncing}
                    >
                      {batchSummary ? 'Close' : 'Cancel'}
                    </button>
                    {!batchSummary && (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={handleRunBatchSync}
                        disabled={isBatchSyncing || mfHoldings.length === 0}
                      >
                        {isBatchSyncing ? 'Syncing...' : `Sync All Mutual Funds (${mfHoldings.length})`}
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

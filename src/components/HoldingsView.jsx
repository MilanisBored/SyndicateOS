import React, { useState, useRef, useEffect, useMemo } from 'react';
import { formatCurrency, formatNumber, CURRENCIES } from '../utils/navEngine';
import { 
  searchMutualFundsAMFI,
  fetchMutualFundNav,
  fetchCryptoQuote,
  fetchGlobalStockQuote,
  fetchUniversalQuote,
  syncUniversalHoldingsBatch
} from '../services/marketDataService';
import { 
  convertCurrency, 
  fetchFxRates, 
  getExchangeRate 
} from '../services/fxService';

// Asset Class Grouping Definitions
const ASSET_CLASSES = [
  { id: 'ALL', label: 'All Positions', icon: '🌐' },
  { id: 'STOCKS', label: 'Equities & Stocks', icon: '📈', match: ['stock', 'equit'] },
  { id: 'MUTUAL_FUNDS', label: 'Mutual Funds / ETFs', icon: '🏛️', match: ['mutual', 'sip', 'etf', 'fund'] },
  { id: 'CRYPTO', label: 'Crypto & Web3', icon: '🪙', match: ['crypto', 'btc', 'eth', 'token'] },
  { id: 'FIXED_INCOME', label: 'Fixed Income & Debt', icon: '🔒', match: ['deposit', 'fd', 'bond', 'debt', 'fixed'] },
  { id: 'REAL_ESTATE', label: 'Real Estate & Private', icon: '🏠', match: ['estate', 'realty', 'private', 'property'] },
  { id: 'CASH', label: 'Liquid Cash & Reserves', icon: '💵', match: ['cash', 'liquid', 'treasury', 'reserve'] },
];

function getHoldingClassId(holding) {
  const cat = (holding.category || '').toLowerCase();
  for (const ac of ASSET_CLASSES) {
    if (ac.id === 'ALL') continue;
    if (ac.match.some(m => cat.includes(m))) return ac.id;
  }
  return 'STOCKS';
}

export default function HoldingsView({ 
  holdings = [], 
  onSaveHolding,
  onDeleteHolding,
  fundMetrics = {}, 
  currency = 'INR', 
  fundInfo,
  perspective = 'manager',
  onSyncValuationToNAV 
}) {
  const isInvestor = perspective === 'investor' || fundInfo?.userRole === 'investor';
  const isPrivateMandate = isInvestor && (fundInfo?.portfolioVisibility === 'private' || !fundInfo?.portfolioVisibility);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL');
  const [fxRates, setFxRates] = useState(null);

  // Quick inline price and units update state
  const [inlineEditingId, setInlineEditingId] = useState(null);
  const [inlinePriceVal, setInlinePriceVal] = useState('');
  const [inlineUnitsEditingId, setInlineUnitsEditingId] = useState(null);
  const [inlineUnitsVal, setInlineUnitsVal] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [ticker, setTicker] = useState('');
  const [category, setCategory] = useState('Mutual Funds / ETFs');
  const [nativeCurrency, setNativeCurrency] = useState(currency || 'INR');
  const [investedAmount, setInvestedAmount] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [units, setUnits] = useState('');
  const [notes, setNotes] = useState('');
  const [isFetchingSingleQuote, setIsFetchingSingleQuote] = useState(false);
  const [singleQuoteStatus, setSingleQuoteStatus] = useState('');

  // Live search suggestions state
  const [fundSuggestions, setFundSuggestions] = useState([]);
  const [isSearchingFund, setIsSearchingFund] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [latestNavPrice, setLatestNavPrice] = useState(null);
  const searchDebounceRef = useRef(null);
  const autocompleteContainerRef = useRef(null);

  // Batch Sync Live Prices Modal State
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isBatchSyncing, setIsBatchSyncing] = useState(false);
  const [batchProgress, setBatchProgress] = useState(null);
  const [batchSummary, setBatchSummary] = useState(null);

  // Load live FX rates on mount
  useEffect(() => {
    fetchFxRates().then(rates => {
      setFxRates(rates);
    }).catch(e => console.warn('FX init error:', e));
  }, []);

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

  // Filtered holdings based on active asset tab
  const filteredHoldings = useMemo(() => {
    if (activeTab === 'ALL') return holdings;
    return holdings.filter(h => getHoldingClassId(h) === activeTab);
  }, [holdings, activeTab]);

  // Tab counts
  const tabCounts = useMemo(() => {
    const counts = { ALL: holdings.length };
    ASSET_CLASSES.forEach(ac => {
      if (ac.id !== 'ALL') {
        counts[ac.id] = holdings.filter(h => getHoldingClassId(h) === ac.id).length;
      }
    });
    return counts;
  }, [holdings]);

  // Compute Total Metrics Converted to Fund Base Currency
  const totalInvested = useMemo(() => {
    return holdings.reduce((sum, h) => {
      const raw = Number(h.investedAmount) || 0;
      const hCur = h.nativeCurrency || h.currency || currency;
      return sum + convertCurrency(raw, hCur, currency, fxRates);
    }, 0);
  }, [holdings, currency, fxRates]);

  const totalHoldingsValue = useMemo(() => {
    return holdings.reduce((sum, h) => {
      const raw = Number(h.currentValue) || 0;
      const hCur = h.nativeCurrency || h.currency || currency;
      return sum + convertCurrency(raw, hCur, currency, fxRates);
    }, 0);
  }, [holdings, currency, fxRates]);

  const totalHoldingsProfit = totalHoldingsValue - totalInvested;
  const totalHoldingsRoi = totalInvested > 0 ? (totalHoldingsProfit / totalInvested) * 100 : 0;

  // Category breakdown for summary and charts
  const categoryBreakdown = useMemo(() => {
    return holdings.reduce((acc, h) => {
      const cat = h.category || 'Asset Allocation';
      if (!acc[cat]) {
        acc[cat] = { category: cat, costBasis: 0, currentValue: 0, count: 0 };
      }
      const hCur = h.nativeCurrency || h.currency || currency;
      acc[cat].costBasis += convertCurrency(Number(h.investedAmount) || 0, hCur, currency, fxRates);
      acc[cat].currentValue += convertCurrency(Number(h.currentValue) || 0, hCur, currency, fxRates);
      acc[cat].count += 1;
      return acc;
    }, {});
  }, [holdings, currency, fxRates]);

  const categoryList = Object.values(categoryBreakdown);

  const handleOpenAdd = () => {
    setEditingAsset(null);
    setName('');
    setTicker('');
    setCategory('Mutual Funds / ETFs');
    setNativeCurrency(currency || 'INR');
    setInvestedAmount('');
    setCurrentValue('');
    setUnits('');
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
    setNativeCurrency(ast.nativeCurrency || ast.currency || currency || 'INR');
    setInvestedAmount(ast.investedAmount);
    setCurrentValue(ast.currentValue);
    setUnits(ast.units || ast.quantity || '');
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

    // Live search AMFI if Mutual Fund category or unspecified
    if (category.toLowerCase().includes('mutual') || category.toLowerCase().includes('sip') || !category) {
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
    }
  };

  const handleSelectSuggestion = async (item) => {
    setName(item.schemeName);
    setTicker(String(item.schemeCode));
    setCategory('Mutual Funds / ETFs');
    setNativeCurrency('INR');
    setFundSuggestions([]);
    setShowSuggestions(false);

    // Auto-fetch latest NAV immediately
    setIsFetchingSingleQuote(true);
    setSingleQuoteStatus(`Fetching live NAV for ${item.schemeName}...`);
    try {
      const res = await fetchMutualFundNav(item.schemeCode);
      setLatestNavPrice(res.nav);
      setSingleQuoteStatus(`Live AMFI NAV: ₹${formatNumber(res.nav, 4)} (Declared: ${res.date})`);

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

  // Universal Single Quote Fetcher (Stocks, Crypto, Mutual Funds)
  const handleFetchSingleQuote = async () => {
    const term = ticker.trim() || name.trim();
    if (!term) {
      alert('Please enter a Stock Ticker, Crypto Symbol, or Mutual Fund Name (e.g. AAPL, BTC, RELIANCE, Parag Parikh).');
      return;
    }

    setIsFetchingSingleQuote(true);
    setSingleQuoteStatus(`Resolving live quote for "${term}"...`);

    try {
      const res = await fetchUniversalQuote(term, category);
      setLatestNavPrice(res.price);
      
      const quoteCur = res.currency || nativeCurrency;
      if (res.currency) {
        setNativeCurrency(res.currency);
      }
      
      setSingleQuoteStatus(`Live ${res.source || 'Quote'}: ${formatCurrency(res.price, quoteCur, { decimals: res.price < 10 ? 4 : 2 })} ${res.change24h ? `(${res.change24h >= 0 ? '+' : ''}${formatNumber(res.change24h, 2)}% 24h)` : ''}`);
      
      if (!name) setName(res.name);
      if (!ticker && res.symbol) setTicker(res.symbol);
      if (res.category && (!category || category === 'Mutual Funds / ETFs')) {
        setCategory(res.category);
      }

      const numUnits = Number(units);
      if (numUnits && numUnits > 0) {
        const computedNative = Math.round(numUnits * res.price * 100) / 100;
        setCurrentValue(computedNative);
      } else if (!currentValue) {
        setCurrentValue(res.price);
      }
    } catch (err) {
      setSingleQuoteStatus(`Notice: ${err.message}. You may enter valuation manually.`);
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
      nativeCurrency: nativeCurrency || currency || 'INR',
      investedAmount: Number(investedAmount),
      currentValue: Number(currentValue),
      units: Number(units) || null,
      notes: notes.trim(),
    };

    onSaveHolding(payload);
    setIsEditing(false);
  };

  // Quick inline price save
  const handleInlineSave = (ast) => {
    const val = Number(inlinePriceVal);
    if (!isNaN(val) && val >= 0) {
      onSaveHolding({
        ...ast,
        currentValue: val,
      });
    }
    setInlineEditingId(null);
  };

  // Quick inline units save
  const handleInlineUnitsSave = (ast) => {
    const u = Number(inlineUnitsVal);
    if (!isNaN(u) && u >= 0) {
      let updatedVal = ast.currentValue;
      if (ast.units && Number(ast.units) > 0 && u > 0) {
        const pricePerUnit = ast.currentValue / Number(ast.units);
        updatedVal = Math.round(u * pricePerUnit * 100) / 100;
      }
      onSaveHolding({
        ...ast,
        units: u > 0 ? u : null,
        currentValue: updatedVal,
      });
    }
    setInlineUnitsEditingId(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('Remove this asset position from the syndicate pool?')) {
      onDeleteHolding(id);
    }
  };

  // Run the 1-Click Universal Batch Live Sync
  const handleRunBatchSync = async () => {
    setIsBatchSyncing(true);
    setBatchProgress({ current: 0, total: holdings.length, name: 'Starting Universal Live Price Sync...' });
    setBatchSummary(null);

    try {
      const syncResult = await syncUniversalHoldingsBatch(holdings, currency, (p) => {
        setBatchProgress({ current: p.currentIndex, total: p.total, name: p.currentHolding });
      });

      // Update state with updated holdings
      for (const res of syncResult.results) {
        if (res.success) {
          const target = holdings.find(h => h.id === res.holdingId);
          if (target) {
            await onSaveHolding({
              ...target,
              currentValue: res.newValue,
              nativeCurrency: res.nativeCurrency,
              lastPrice: res.livePrice,
            });
          }
        }
      }

      if (onSyncValuationToNAV) {
        onSyncValuationToNAV();
      }

      setBatchSummary(syncResult);
    } catch (err) {
      alert(`Batch sync failed: ${err.message}`);
    } finally {
      setIsBatchSyncing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Kubera-Style Clean Header & Allocation Stats */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="section-title text-base font-semibold">Syndicate Portfolio Assets</span>
              <span className="badge badge-profit mono text-xxs font-semibold" title="Powered by European Central Bank feed">
                ECB FX CONNECTED
              </span>
            </div>
            <span className="text-xs text-muted block mt-0.5">
              Multi-Asset, Multi-Currency Balance Sheet • Denominated in {currency}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {!isInvestor && (
              <>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm mono"
                  onClick={() => {
                    setBatchSummary(null);
                    setIsSyncModalOpen(true);
                  }}
                  disabled={isBatchSyncing || holdings.length === 0}
                  title="Auto-fetch live prices for Stocks, Crypto, and Mutual Funds in 1 click"
                >
                  ⚡ {isBatchSyncing ? 'SYNCING...' : 'SYNC LIVE PRICES'}
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleOpenAdd}
                >
                  + Add Asset / Position
                </button>
              </>
            )}
          </div>
        </div>

        {/* Kubera Top Portfolio Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <div>
            <span className="text-xxs text-muted mono uppercase tracking-wider block">Total Portfolio Value</span>
            <span className="text-lg font-bold mono text-primary">
              {formatCurrency(totalHoldingsValue, currency)}
            </span>
          </div>
          <div>
            <span className="text-xxs text-muted mono uppercase tracking-wider block">Cost Basis</span>
            <span className="text-base font-semibold mono text-secondary">
              {formatCurrency(totalInvested, currency)}
            </span>
          </div>
          <div>
            <span className="text-xxs text-muted mono uppercase tracking-wider block">Unrealized Gain / Return</span>
            <span className={`text-base font-semibold mono ${totalHoldingsProfit >= 0 ? 'text-profit' : 'text-loss'}`}>
              {totalHoldingsProfit >= 0 ? '+' : ''}{formatCurrency(totalHoldingsProfit, currency)} ({formatNumber(totalHoldingsRoi, 1)}%)
            </span>
          </div>
          <div>
            <span className="text-xxs text-muted mono uppercase tracking-wider block">Undeployed Liquidity</span>
            <span className="text-base font-semibold mono text-primary">
              {formatCurrency(fundMetrics.undeployedCash || 0, currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Kubera Clean Asset Class Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {ASSET_CLASSES.map(ac => {
          const count = tabCounts[ac.id] || 0;
          const isActive = activeTab === ac.id;
          return (
            <button
              key={ac.id}
              type="button"
              onClick={() => setActiveTab(ac.id)}
              className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                borderRadius: '20px',
                fontSize: 11,
                padding: '4px 12px',
                whiteSpace: 'nowrap',
                fontWeight: isActive ? 600 : 400,
              }}
            >
              <span style={{ marginRight: 4 }}>{ac.icon}</span>
              {ac.label}
              <span 
                className="mono text-xxs ml-1.5" 
                style={{ 
                  opacity: isActive ? 0.9 : 0.6,
                  background: isActive ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)',
                  padding: '1px 5px',
                  borderRadius: '10px'
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Table / Position Sheet */}
      <div className="card p-4">
        <div className="table-responsive">
          <table className="dense-table">
            <thead>
              <tr>
                <th>Ticker / Code</th>
                <th>Asset Name</th>
                <th>Class</th>
                <th>Price / NAV</th>
                <th>Units / Qty</th>
                <th>Cost Basis</th>
                <th>Market Value ({currency})</th>
                <th>Return</th>
                <th>Weight</th>
                {!isInvestor && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredHoldings.length === 0 ? (
                <tr>
                  <td colSpan={isInvestor ? 9 : 10} className="text-center text-muted py-8">
                    No positions found under this asset class.
                  </td>
                </tr>
              ) : (
                filteredHoldings.map((ast) => {
                  const hCur = ast.nativeCurrency || ast.currency || currency;
                  const isCrossCurrency = hCur !== currency;
                  
                  // Convert raw values to Fund Base Currency
                  const convertedInvested = convertCurrency(ast.investedAmount, hCur, currency, fxRates);
                  const convertedCurrent = convertCurrency(ast.currentValue, hCur, currency, fxRates);
                  
                  const gain = convertedCurrent - convertedInvested;
                  const roi = convertedInvested > 0 ? (gain / convertedInvested) * 100 : 0;
                  const weight = totalHoldingsValue > 0 ? (convertedCurrent / totalHoldingsValue) * 100 : 0;
                  
                  const isInline = inlineEditingId === ast.id;
                  const isUnitsInline = inlineUnitsEditingId === ast.id;

                  // Price per unit in native currency
                  const unitsNum = Number(ast.units || ast.quantity);
                  const nativePrice = unitsNum > 0 ? (ast.currentValue / unitsNum) : (ast.lastPrice || null);

                  return (
                    <tr key={ast.id}>
                      {/* Ticker & Exchange */}
                      <td className="mono font-semibold" style={{ minWidth: 100 }}>
                        <div className="flex items-center gap-1.5">
                          <span>{ast.ticker}</span>
                          {isCrossCurrency && (
                            <span className="badge badge-neutral mono" style={{ fontSize: 9, padding: '1px 4px' }}>
                              {hCur}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Name & Memo */}
                      <td className="font-medium" style={{ minWidth: 180 }}>
                        <div style={{ wordBreak: 'break-word' }}>{ast.name}</div>
                        {ast.notes && <div className="text-xs text-muted truncate" style={{ maxWidth: 220 }}>{ast.notes}</div>}
                      </td>

                      {/* Asset Class Badge */}
                      <td style={{ minWidth: 110 }}>
                        <span 
                          className="badge mono text-xxs font-medium"
                          style={{
                            background: ast.category?.includes('Crypto') ? 'rgba(168, 85, 247, 0.15)' :
                                        ast.category?.includes('Stock') ? 'rgba(59, 130, 246, 0.15)' :
                                        ast.category?.includes('Mutual') ? 'rgba(34, 197, 94, 0.15)' :
                                        ast.category?.includes('Fixed') ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                            color: ast.category?.includes('Crypto') ? '#c084fc' :
                                   ast.category?.includes('Stock') ? '#60a5fa' :
                                   ast.category?.includes('Mutual') ? '#4ade80' :
                                   ast.category?.includes('Fixed') ? '#fbbf24' : 'var(--text-secondary)',
                            border: 'none',
                            padding: '2px 6px',
                          }}
                        >
                          {ast.category || 'Asset'}
                        </span>
                      </td>

                      {/* Price / NAV */}
                      <td className="mono text-xs" style={{ minWidth: 90 }}>
                        {nativePrice ? (
                          <span>{formatCurrency(nativePrice, hCur, { decimals: nativePrice < 10 ? 4 : 2 })}</span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>

                      {/* Units / Quantity */}
                      <td style={{ minWidth: 80 }}>
                        {isUnitsInline ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="any"
                              value={inlineUnitsVal}
                              onChange={(e) => setInlineUnitsVal(e.target.value)}
                              className="form-input mono"
                              style={{ width: 75, padding: '2px 4px', fontSize: 11 }}
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleInlineUnitsSave(ast);
                                if (e.key === 'Escape') setInlineUnitsEditingId(null);
                              }}
                            />
                            <button
                              type="button"
                              className="btn btn-primary btn-sm mono"
                              style={{ padding: '2px 5px', fontSize: 10 }}
                              onClick={() => handleInlineUnitsSave(ast)}
                            >
                              ✓
                            </button>
                          </div>
                        ) : unitsNum > 0 ? (
                          <span 
                            className="mono text-muted cursor-pointer hover:underline"
                            onClick={() => {
                              if (!isInvestor) {
                                setInlineUnitsEditingId(ast.id);
                                setInlineUnitsVal(unitsNum);
                              }
                            }}
                            title="Click to edit quantity"
                          >
                            {formatNumber(unitsNum, 3)}
                          </span>
                        ) : (
                          <span 
                            className="text-muted cursor-pointer"
                            onClick={() => {
                              if (!isInvestor) {
                                setInlineUnitsEditingId(ast.id);
                                setInlineUnitsVal('');
                              }
                            }}
                          >
                            —
                          </span>
                        )}
                      </td>

                      {/* Cost Basis */}
                      <td className="mono text-muted text-xs" style={{ minWidth: 90 }}>
                        {formatCurrency(convertedInvested, currency, { decimals: 0 })}
                        {isCrossCurrency && (
                          <div className="text-xxs opacity-75">{formatCurrency(ast.investedAmount, hCur, { decimals: 0 })}</div>
                        )}
                      </td>

                      {/* Market Value (Base Currency) */}
                      <td style={{ minWidth: 120 }}>
                        {isInline ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="any"
                              value={inlinePriceVal}
                              onChange={(e) => setInlinePriceVal(e.target.value)}
                              className="form-input mono"
                              style={{ width: 90, padding: '2px 5px', fontSize: 11 }}
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleInlineSave(ast);
                                if (e.key === 'Escape') setInlineEditingId(null);
                              }}
                            />
                            <button
                              type="button"
                              className="btn btn-primary btn-sm mono"
                              style={{ padding: '2px 5px', fontSize: 10 }}
                              onClick={() => handleInlineSave(ast)}
                            >
                              ✓
                            </button>
                          </div>
                        ) : (
                          <div 
                            className="cursor-pointer"
                            onClick={() => {
                              if (!isInvestor) {
                                setInlineEditingId(ast.id);
                                setInlinePriceVal(ast.currentValue);
                              }
                            }}
                            title="Click to edit value directly"
                          >
                            <span className="mono font-semibold">{formatCurrency(convertedCurrent, currency)}</span>
                            {isCrossCurrency && (
                              <div className="text-xxs text-muted mono">
                                {formatCurrency(ast.currentValue, hCur)} (1 {hCur} ≈ {formatNumber(getExchangeRate(hCur, currency, fxRates), 2)} {currency})
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Return */}
                      <td className={`mono text-xs ${gain >= 0 ? 'text-profit' : 'text-loss'}`} style={{ minWidth: 90 }}>
                        {gain >= 0 ? '+' : ''}{formatCurrency(gain, currency, { decimals: 0 })}
                        <div className="text-xxs font-semibold">({formatNumber(roi, 1)}%)</div>
                      </td>

                      {/* Portfolio Weight */}
                      <td className="mono text-xs font-medium" style={{ minWidth: 70 }}>
                        {formatNumber(weight, 1)}%
                      </td>

                      {/* Actions */}
                      {!isInvestor && (
                        <td style={{ minWidth: 120 }}>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '2px 6px', fontSize: 10 }}
                              onClick={() => handleOpenEdit(ast)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm mono"
                              style={{ padding: '2px 6px', fontSize: 10 }}
                              onClick={() => handleDelete(ast.id)}
                            >
                              Del
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Position Modal */}
      {isEditing && (
        <div className="modal-overlay" onClick={() => setIsEditing(false)}>
          <div className="modal-content" style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
            <div className="section-head mb-3">
              <span className="section-title">{editingAsset ? 'Edit Position' : 'New Position / Asset'}</span>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsEditing(false)}>Cancel</button>
            </div>

            <form onSubmit={handleSave}>
              <div className="form-group" ref={autocompleteContainerRef}>
                <div className="flex justify-between items-baseline mb-1">
                  <label className="form-label mb-0">Asset / Ticker / Scheme Name</label>
                  <span className="text-xxs text-muted">Supports Stocks, Crypto, Mutual Funds & FDs</span>
                </div>
                <div className="autocomplete-container">
                  <input
                    type="text"
                    placeholder="e.g. AAPL, BTC, RELIANCE, Parag Parikh Flexi Cap, or HDFC FD..."
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
                      {fundSuggestions.map((item) => (
                        <div
                          key={item.schemeCode}
                          className="autocomplete-item"
                          onClick={() => handleSelectSuggestion(item)}
                        >
                          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                            <span className="autocomplete-item-name">{item.schemeName}</span>
                            <span className="text-xxs text-muted mono">#{item.schemeCode}</span>
                          </div>
                          <span className="btn btn-secondary btn-sm" style={{ fontSize: 10, padding: '2px 8px' }}>
                            Select
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group flex-1">
                  <label className="form-label">Ticker / Symbol</label>
                  <input
                    type="text"
                    placeholder="e.g. AAPL, BTC, 122639"
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value)}
                    className="form-input mono"
                  />
                </div>
                <div className="form-group flex-1">
                  <label className="form-label">Asset Class / Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="form-select"
                  >
                    <option value="Equities / Stocks">Equities / Stocks (US & Global)</option>
                    <option value="Mutual Funds / ETFs">Mutual Funds / ETFs (AMFI & Index)</option>
                    <option value="Crypto">Crypto & Digital Assets</option>
                    <option value="Fixed Deposit (FD)">Fixed Deposit (FD) / Debt</option>
                    <option value="Precious Metals (Gold)">Precious Metals (Gold / Silver)</option>
                    <option value="Real Estate">Real Estate / Private Equity</option>
                    <option value="Liquid Cash / Overnight">Liquid Cash / Currency Reserve</option>
                  </select>
                </div>
              </div>

              <div className="form-row items-end">
                <div className="form-group flex-1">
                  <label className="form-label">Native Currency</label>
                  <select
                    value={nativeCurrency}
                    onChange={(e) => setNativeCurrency(e.target.value)}
                    className="form-select mono"
                  >
                    {Object.keys(CURRENCIES).map(c => (
                      <option key={c} value={c}>{CURRENCIES[c].label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group pb-1">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleFetchSingleQuote}
                    disabled={isFetchingSingleQuote || (!ticker.trim() && !name.trim())}
                  >
                    ⚡ {isFetchingSingleQuote ? 'FETCHING...' : 'FETCH LIVE PRICE'}
                  </button>
                </div>
              </div>

              {singleQuoteStatus && (
                <div className="card p-2 mb-3 text-xs mono text-secondary" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  {singleQuoteStatus}
                </div>
              )}

              <div className="form-row">
                <div className="form-group flex-1">
                  <label className="form-label">Units / Quantity</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 25 shares or 0.15 BTC"
                    value={units}
                    onChange={(e) => handleUnitsChange(e.target.value)}
                    className="form-input mono"
                  />
                </div>
                <div className="form-group flex-1">
                  <label className="form-label">Cost Basis ({nativeCurrency})</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="Invested Amount"
                    value={investedAmount}
                    onChange={(e) => setInvestedAmount(e.target.value)}
                    className="form-input mono"
                    required
                  />
                </div>
                <div className="form-group flex-1">
                  <label className="form-label">Current Value ({nativeCurrency})</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="Market Value"
                    value={currentValue}
                    onChange={(e) => setCurrentValue(e.target.value)}
                    className="form-input mono"
                    required
                  />
                </div>
              </div>

              {/* Converted Fund Base Currency Preview */}
              {nativeCurrency !== currency && currentValue && (
                <div className="card p-2.5 mb-3 text-xs mono" style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                  <div className="flex justify-between items-center">
                    <span className="text-muted">Converted in Fund Currency ({currency}):</span>
                    <strong className="text-primary">
                      {formatCurrency(convertCurrency(currentValue, nativeCurrency, currency, fxRates), currency)}
                    </strong>
                  </div>
                  <div className="text-xxs text-muted mt-1">
                    Live FX: 1 {nativeCurrency} ≈ {formatNumber(getExchangeRate(nativeCurrency, currency, fxRates), 4)} {currency}
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Notes / Maturity Date / Staking Yield</label>
                <input
                  type="text"
                  placeholder="e.g. Stored in Ledger Cold Wallet, or Matures Oct 2027 @ 7.4% p.a."
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

      {/* 1-Click Universal Batch Live Sync Modal */}
      {isSyncModalOpen && (
        <div className="modal-overlay" onClick={() => !isBatchSyncing && setIsSyncModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
            <div className="section-head mb-3">
              <div>
                <span className="section-title">Universal Live Market Sync</span>
                <span className="text-xs text-muted block">
                  Batch syncs live quotes across Global Stocks, Crypto (CoinGecko), and AMFI Mutual Funds.
                </span>
              </div>
              <button 
                type="button" 
                className="btn btn-secondary btn-sm" 
                onClick={() => setIsSyncModalOpen(false)}
                disabled={isBatchSyncing}
              >
                Close
              </button>
            </div>

            <div className="card p-3 mb-3 text-xs" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <div className="flex justify-between mb-1">
                <span className="text-muted">Holdings to Refresh:</span>
                <span className="font-semibold mono">{holdings.length} assets</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Target Valuation Currency:</span>
                <span className="font-semibold mono">{currency}</span>
              </div>
            </div>

            {isBatchSyncing && batchProgress && (
              <div className="mb-4">
                <div className="flex justify-between text-xs mono mb-1">
                  <span className="text-secondary">{batchProgress.name}</span>
                  <span>{batchProgress.current} / {batchProgress.total}</span>
                </div>
                <div style={{ height: 6, background: 'var(--border-subtle)', borderRadius: 3, overflow: 'hidden' }}>
                  <div 
                    style={{ 
                      height: '100%', 
                      width: `${batchProgress.total > 0 ? (batchProgress.current / batchProgress.total) * 100 : 0}%`, 
                      background: 'var(--accent-primary)',
                      transition: 'width 0.2s ease'
                    }} 
                  />
                </div>
              </div>
            )}

            {batchSummary && (
              <div className="card p-3 mb-3 text-xs mono space-y-1.5" style={{ background: 'rgba(34, 197, 94, 0.05)', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                <div className="text-profit font-semibold">
                  ✓ Live Sync Complete! Updated {batchSummary.totalUpdated} positions.
                </div>
                {batchSummary.totalSkipped > 0 && (
                  <div className="text-muted text-xxs">
                    {batchSummary.totalSkipped} manual positions (Real Estate / Cash) maintained.
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setIsSyncModalOpen(false)}
                disabled={isBatchSyncing}
              >
                Done
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm mono"
                onClick={handleRunBatchSync}
                disabled={isBatchSyncing}
              >
                {isBatchSyncing ? 'Syncing...' : 'Start Live Sync'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

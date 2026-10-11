import React, { useState, useRef, useEffect, useMemo } from 'react';
import { formatCurrency, formatNumber, resolveHoldingCurrency } from '../utils/navEngine';
import { 
  searchGlobalMarkets,
  searchMutualFundsAMFI,
  fetchMutualFundNav,
  fetchUniversalQuote,
  syncUniversalHoldingsBatch,
  syncMutualFundHoldingsBatch
} from '../services/marketDataService';
import { convertCurrency, fetchFxRates } from '../services/fxService';

export default function HoldingsView({ 
  holdings, 
  onSaveHolding,
  onDeleteHolding,
  onExecuteTradeTrim,
  onAddTransaction,
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
  const [fundingSource, setFundingSource] = useState('pool_cash'); // 'pool_cash' | 'in_kind'
  const [positionFilter, setPositionFilter] = useState('all');
  const [isFetchingSingleQuote, setIsFetchingSingleQuote] = useState(false);
  const [singleQuoteStatus, setSingleQuoteStatus] = useState('');

  // Institutional Sub-Categorizations: 'positions' | 'exposures' | 'attribution' | 'taxlots' | 'treasury'
  const [activeSubTab, setActiveSubTab] = useState('positions');
  const [taxLotStrategy, setTaxLotStrategy] = useState('FIFO'); // 'FIFO' | 'LIFO' | 'HIFO' | 'AVG'
  const [selectedLotAssetId, setSelectedLotAssetId] = useState('all');

  // Treasury sub-tab & cash adjustment modal state
  const [treasuryFilter, setTreasuryFilter] = useState('all'); // 'all' | 'inflow' | 'deployment' | 'proceeds' | 'adjustment'
  const [isCashAdjModalOpen, setIsCashAdjModalOpen] = useState(false);
  const [adjType, setAdjType] = useState('bank_interest');
  const [adjAmount, setAdjAmount] = useState('');
  const [adjDate, setAdjDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [adjNote, setAdjNote] = useState('');
  const [isSubmittingAdj, setIsSubmittingAdj] = useState(false);
  const [adjFeedback, setAdjFeedback] = useState(null);

  // Universal search suggestions state (US, CA, AU, KR, UK, IN, Crypto)
  const [assetSuggestions, setAssetSuggestions] = useState([]);
  const [isSearchingAsset, setIsSearchingAsset] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSearchField, setActiveSearchField] = useState('name'); // 'name' | 'ticker'
  const [latestNavPrice, setLatestNavPrice] = useState(null);
  const [latestNativeCurrency, setLatestNativeCurrency] = useState(currency || 'INR');
  const [latestExchange, setLatestExchange] = useState('');
  const [latestIsin, setLatestIsin] = useState('');
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

  const {
    activeHoldings,
    closedHoldings,
    totalInvested,
    totalHoldingsValue,
    unrealizedProfit,
    unrealizedRoi,
    realizedProfit,
    totalHoldingsProfit,
    totalHoldingsRoi,
    categoryList
  } = useMemo(() => {
    const safeHoldings = Array.isArray(holdings) ? holdings : [];
    const active = safeHoldings.filter((h) => h.status !== 'closed');
    const closed = safeHoldings.filter((h) => h.status === 'closed');
    const invested = active.reduce((sum, h) => sum + (Number(h.investedAmount) || 0), 0);
    const value = active.reduce((sum, h) => sum + (Number(h.currentValue) || 0), 0);
    const unrealized = value - invested;
    const uRoi = invested > 0 ? (unrealized / invested) * 100 : 0;
    const realized = safeHoldings.reduce((sum, h) => sum + (Number(h.realizedPnl) || 0), 0);
    const totalProfit = unrealized + realized;
    const tRoi = invested > 0 ? (totalProfit / invested) * 100 : 0;

    const catBreakdown = active.reduce((acc, h) => {
      const cat = h.category || 'Asset Allocation';
      if (!acc[cat]) {
        acc[cat] = { category: cat, costBasis: 0, currentValue: 0, count: 0 };
      }
      acc[cat].costBasis += (Number(h.investedAmount) || 0);
      acc[cat].currentValue += (Number(h.currentValue) || 0);
      acc[cat].count += 1;
      return acc;
    }, {});

    return {
      activeHoldings: active,
      closedHoldings: closed,
      totalInvested: invested,
      totalHoldingsValue: value,
      unrealizedProfit: unrealized,
      unrealizedRoi: uRoi,
      realizedProfit: realized,
      totalHoldingsProfit: totalProfit,
      totalHoldingsRoi: tRoi,
      categoryList: Object.values(catBreakdown),
    };
  }, [holdings]);

  // Institutional Tax Lots computation & simulation
  const [trimHoldingId, setTrimHoldingId] = useState('');
  const [trimUnits, setTrimUnits] = useState('');
  const [isExecutingTrim, setIsExecutingTrim] = useState(false);
  const [trimFeedback, setTrimFeedback] = useState(null);

  const taxLotsData = useMemo(() => {
    const safeHoldings = Array.isArray(holdings) ? holdings : [];
    const active = safeHoldings.filter(h => h.status !== 'closed');
    const lots = [];

    active.forEach((h, hIdx) => {
      const units = Number(h.units) || 1;
      const costBasis = Number(h.investedAmount) || 0;
      const currentVal = Number(h.currentValue) || 0;
      const unitPrice = units > 0 ? currentVal / units : 0;

      if (Array.isArray(h.lots) && h.lots.length > 0) {
        h.lots.forEach((dbLot, lIdx) => {
          const lotRemaining = Number(dbLot.remainingUnits ?? dbLot.remaining_units ?? dbLot.units ?? 0);
          if (lotRemaining <= 0) return; // skip fully depleted lots
          const lotCost = Number(dbLot.costPrice ?? dbLot.cost_price ?? 0);
          const lotCostBasis = lotRemaining * lotCost;
          const lotVal = lotRemaining * unitPrice;
          const lotGain = lotVal - lotCostBasis;
          const lotGainPct = lotCostBasis > 0 ? (lotGain / lotCostBasis) * 100 : 0;
          const buyDate = dbLot.purchaseDate || dbLot.purchase_date || h.created_at || '2026-01-15';
          const daysHeld = Math.max(1, Math.floor((Date.now() - new Date(buyDate).getTime()) / (1000 * 60 * 60 * 24)));
          const isLTCG = daysHeld >= 365;

          lots.push({
            lotId: dbLot.id ? `LOT-${String(dbLot.id).slice(0, 8)}` : `LOT-${h.ticker || hIdx}-${lIdx + 1}`,
            dbId: dbLot.id,
            holdingId: h.id,
            ticker: h.ticker || h.name,
            name: h.name,
            category: h.category,
            date: buyDate,
            daysHeld,
            units: lotRemaining,
            unitCost: lotCost,
            unitPrice,
            costBasis: lotCostBasis,
            currentVal: lotVal,
            gain: lotGain,
            gainPct: lotGainPct,
            taxType: isLTCG ? 'LTCG (>365d)' : 'STCG (<=365d)',
            isLTCG
          });
        });
      } else {
        const unitCost = units > 0 ? costBasis / units : 0;
        const buyDate = h.buyDate || h.created_at || '2026-01-15';
        const daysHeld = Math.max(1, Math.floor((Date.now() - new Date(buyDate).getTime()) / (1000 * 60 * 60 * 24)));
        const isLTCG = daysHeld >= 365;
        const gain = currentVal - costBasis;
        const gainPct = costBasis > 0 ? (gain / costBasis) * 100 : 0;

        lots.push({
          lotId: `LOT-${h.ticker || hIdx}-01`,
          holdingId: h.id,
          ticker: h.ticker || h.name,
          name: h.name,
          category: h.category,
          date: buyDate,
          daysHeld,
          units,
          unitCost,
          unitPrice,
          costBasis,
          currentVal,
          gain,
          gainPct,
          taxType: isLTCG ? 'LTCG (>365d)' : 'STCG (<=365d)',
          isLTCG
        });
      }
    });

    // Apply Institutional Tax Accounting Strategy Ordering
    const sorted = [...lots].sort((a, b) => {
      if (taxLotStrategy === 'FIFO') return a.date.localeCompare(b.date);
      if (taxLotStrategy === 'LIFO') return b.date.localeCompare(a.date);
      if (taxLotStrategy === 'HIFO') return b.unitCost - a.unitCost; // highest cost basis first (minimum taxable gain)
      return a.ticker.localeCompare(b.ticker); // default
    });

    return sorted;
  }, [holdings, taxLotStrategy]);

  // Filtered Tax Lots
  const filteredTaxLots = useMemo(() => {
    if (selectedLotAssetId === 'all') return taxLotsData;
    return taxLotsData.filter(l => String(l.holdingId) === String(selectedLotAssetId));
  }, [taxLotsData, selectedLotAssetId]);

  // Trim simulation output
  const simulatedTrimResult = useMemo(() => {
    if (!trimHoldingId || !trimUnits || Number(trimUnits) <= 0) return null;
    const targetLots = taxLotsData.filter(l => String(l.holdingId) === String(trimHoldingId));
    if (!targetLots.length) return null;

    let unitsRemainingToTrim = Number(trimUnits);
    let totalProceeds = 0;
    let totalCostBasisOfTrim = 0;
    let stcgGain = 0;
    let ltcgGain = 0;
    const consumedLots = [];
    const exitPrice = targetLots[0]?.unitPrice || 0;

    for (const lot of targetLots) {
      if (unitsRemainingToTrim <= 0) break;
      const qtyToTake = Math.min(unitsRemainingToTrim, lot.units);
      const proceeds = qtyToTake * lot.unitPrice;
      const cost = qtyToTake * lot.unitCost;
      const gain = proceeds - cost;

      if (lot.isLTCG) {
        ltcgGain += gain;
      } else {
        stcgGain += gain;
      }

      totalProceeds += proceeds;
      totalCostBasisOfTrim += cost;
      consumedLots.push({ ...lot, unitsTrimmed: qtyToTake, lotProceeds: proceeds, lotGain: gain });
      unitsRemainingToTrim -= qtyToTake;
    }

    const netRealized = totalProceeds - totalCostBasisOfTrim;
    return {
      totalProceeds,
      totalCostBasis: totalCostBasisOfTrim,
      netRealized,
      stcgGain,
      ltcgGain,
      exitPrice,
      holdingTicker: targetLots[0]?.ticker || '',
      consumedLots,
      unfilledUnits: Math.max(0, unitsRemainingToTrim)
    };
  }, [trimHoldingId, trimUnits, taxLotsData]);

  const handleExecuteTrimClick = async () => {
    if (!trimHoldingId || !trimUnits || Number(trimUnits) <= 0 || !simulatedTrimResult) return;
    if (!onExecuteTradeTrim) return;

    try {
      setIsExecutingTrim(true);
      setTrimFeedback(null);
      const res = await onExecuteTradeTrim({
        holdingId: trimHoldingId,
        units: Number(trimUnits),
        exitPrice: simulatedTrimResult.exitPrice,
        strategy: taxLotStrategy
      });
      setTrimFeedback({
        type: 'success',
        message: `Trade trim executed: Depleted ${trimUnits} units. Booked Realized P&L: ${simulatedTrimResult.netRealized >= 0 ? '+' : ''}${formatCurrency(simulatedTrimResult.netRealized, currency)}. Liquid cash pool updated.`
      });
      setTrimHoldingId('');
      setTrimUnits('');
    } catch (err) {
      setTrimFeedback({
        type: 'error',
        message: `Trim execution failed: ${err.message}`
      });
    } finally {
      setIsExecutingTrim(false);
    }
  };

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
    setFundingSource('pool_cash');
    setNotes('');
    setSingleQuoteStatus('');
    setAssetSuggestions([]);
    setShowSuggestions(false);
    setLatestNavPrice(null);
    setLatestNativeCurrency(currency || 'INR');
    setLatestExchange('');
    setLatestIsin('');
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
    setFundingSource((ast.notes && /\[FUNDING:\s*IN_KIND\]/i.test(ast.notes)) ? 'in_kind' : 'pool_cash');
    setNotes(ast.notes || '');
    setSingleQuoteStatus('');
    setAssetSuggestions([]);
    setShowSuggestions(false);
    setLatestNavPrice(ast.lastPrice || ast.lastNav || null);
    setLatestNativeCurrency(resolveHoldingCurrency(ast, currency || 'INR'));
    setLatestExchange(ast.exchange || '');
    setLatestIsin(ast.isin || '');
    setIsEditing(true);
  };

  const performSearch = (val, field = 'name') => {
    setActiveSearchField(field);

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    const trimmed = String(val || '').trim();
    if (trimmed.length < 2) {
      setAssetSuggestions([]);
      setShowSuggestions(false);
      setIsSearchingAsset(false);
      return;
    }

    // Universal multi-market search as user types
    setIsSearchingAsset(true);
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const results = await searchGlobalMarkets(trimmed);
        setAssetSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch (err) {
        console.error('Universal asset search error:', err);
      } finally {
        setIsSearchingAsset(false);
      }
    }, 150);
  };

  const handleNameChange = (val) => {
    setName(val);
    performSearch(val, 'name');
  };

  const handleTickerChange = (val) => {
    setTicker(val);
    performSearch(val, 'ticker');
  };

  const handleSelectSuggestion = async (item) => {
    setName(item.name || item.symbol);
    setTicker(item.symbol);
    if (item.category) setCategory(item.category);
    const quoteCur = item.currency || currency || 'USD';
    setLatestNativeCurrency(quoteCur);
    setLatestExchange(item.exchange || '');
    if (item.isin) setLatestIsin(item.isin);
    setAssetSuggestions([]);
    setShowSuggestions(false);

    // Auto-fetch latest quote & convert to fund base currency
    setIsFetchingSingleQuote(true);
    setSingleQuoteStatus(`Fetching live quote for ${item.symbol}...`);
    try {
      const res = await fetchUniversalQuote(item.symbol, item.category, currency);
      const quotePrice = res.price || res.nav;
      setLatestNavPrice(quotePrice);
      const resolvedCur = res.currency || quoteCur;
      setLatestNativeCurrency(resolvedCur);
      setLatestExchange(res.exchange || item.exchange || '');

      let quoteStatusText = `Live: ${formatNumber(quotePrice, 4)} ${resolvedCur}`;
      let basePrice = quotePrice;

      if (resolvedCur.toUpperCase() !== (currency || 'USD').toUpperCase()) {
        const rates = await fetchFxRates();
        basePrice = convertCurrency(quotePrice, resolvedCur, currency, rates);
        quoteStatusText += ` (~ ${formatCurrency(basePrice, currency, { decimals: 4 })})`;
      }
      setSingleQuoteStatus(`${quoteStatusText} [${res.badge || res.exchange || 'GLOBAL'}]`);

      const numUnits = Number(units);
      if (numUnits && numUnits > 0) {
        setCurrentValue(Math.round(numUnits * basePrice * 100) / 100);
      } else if (!currentValue) {
        setCurrentValue(Math.round(basePrice * 100) / 100);
      }
    } catch (err) {
      setSingleQuoteStatus(`Note: ${err.message}`);
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
      alert('Please enter an Asset Name, Ticker (e.g. AAPL, SHOP.TO, BHP.AX, 005930.KS), ISIN, or AMFI code.');
      return;
    }

    setIsFetchingSingleQuote(true);
    setSingleQuoteStatus('Fetching live market quote across global exchanges...');

    try {
      const res = await fetchUniversalQuote(term, category, currency);
      const quotePrice = res.price || res.nav;
      setLatestNavPrice(quotePrice);
      const quoteCur = res.currency || currency;
      setLatestNativeCurrency(quoteCur);
      setLatestExchange(res.exchange || '');
      if (res.isin) setLatestIsin(res.isin);

      let quoteStatusText = `Live: ${formatNumber(quotePrice, 4)} ${quoteCur}`;
      let basePrice = quotePrice;

      if (quoteCur.toUpperCase() !== (currency || 'USD').toUpperCase()) {
        const rates = await fetchFxRates();
        basePrice = convertCurrency(quotePrice, quoteCur, currency, rates);
        quoteStatusText += ` (~ ${formatCurrency(basePrice, currency, { decimals: 4 })})`;
      }
      setSingleQuoteStatus(`${quoteStatusText} [${res.badge || res.exchange || 'GLOBAL'}]`);

      if (!name) setName(res.name || term);
      if (!ticker && res.symbol) setTicker(res.symbol);

      const numUnits = Number(units);
      if (numUnits && numUnits > 0) {
        setCurrentValue(Math.round(numUnits * basePrice * 100) / 100);
      } else if (!currentValue) {
        setCurrentValue(Math.round(basePrice * 100) / 100);
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

    let cleanNotes = (notes || '').replace(/\[FUNDING:\s*[^\]]+\]/gi, '').trim();
    const fundingTag = fundingSource === 'in_kind' ? '[FUNDING: IN_KIND]' : '[FUNDING: POOL_CASH]';
    cleanNotes = cleanNotes ? `${cleanNotes} ${fundingTag}` : fundingTag;

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
      notes: cleanNotes,
      nativeCurrency: resolveHoldingCurrency({
        ticker,
        name,
        isin: latestIsin || editingAsset?.isin,
        nativeCurrency: latestNativeCurrency || editingAsset?.nativeCurrency
      }, currency || 'INR'),
      exchange: latestExchange || editingAsset?.exchange || '',
      isin: latestIsin || editingAsset?.isin || '',
      lastPrice: latestNavPrice || editingAsset?.lastPrice || null,
      lastPriceAt: latestNavPrice ? new Date().toISOString() : editingAsset?.lastPriceAt || null,
    };

    onSaveHolding(payload);
    setIsEditing(false);
  };

  const handleRecordCashAdjustment = async (e) => {
    e.preventDefault();
    const numAmt = Number(adjAmount);
    if (!numAmt || isNaN(numAmt)) return;

    setIsSubmittingAdj(true);
    setAdjFeedback(null);

    try {
      const isNegative = adjType === 'operating_expense';
      const signedAmt = isNegative ? -Math.abs(numAmt) : Math.abs(numAmt);
      const typeLabel = adjType === 'bank_interest' ? 'Bank Interest Earned' :
                        adjType === 'dividend' ? 'Portfolio Dividend Received' :
                        adjType === 'operating_expense' ? 'Syndicate Operating Expense' :
                        'Bank Balance Reconciliation';

      const noteText = `[CASH_ADJUSTMENT: ${signedAmt >= 0 ? '+' : ''}${signedAmt}] ${typeLabel}: ${adjNote.trim() || 'Treasury Adjustment'}`;

      if (onAddTransaction) {
        await onAddTransaction({
          type: 'valuation_update',
          amount: (fundMetrics?.totalFundAUM || 0) + signedAmt,
          nav: fundMetrics?.currentNav || 100,
          units: 0,
          note: noteText,
          date: adjDate || new Date().toISOString().split('T')[0],
          status: 'verified',
        });
      }

      setAdjFeedback({
        type: 'success',
        message: `Successfully recorded ${formatCurrency(signedAmt, currency)} ${typeLabel}. Pool cash updated.`
      });

      setTimeout(() => {
        setIsCashAdjModalOpen(false);
        setAdjAmount('');
        setAdjNote('');
        setAdjFeedback(null);
      }, 1200);
    } catch (err) {
      console.error('Failed to record cash adjustment:', err);
      setAdjFeedback({
        type: 'error',
        message: `Failed to record cash adjustment: ${err.message}`
      });
    } finally {
      setIsSubmittingAdj(false);
    }
  };

  // Run the 1-Click Batch Price Sync for Mutual Funds
  const handleRunBatchSync = async () => {
    setIsBatchSyncing(true);
    setBatchProgress({ current: 0, total: holdings.length, name: 'Starting Universal Multi-Asset Live Sync...' });
    setBatchSummary(null);

    try {
      const syncResult = await syncUniversalHoldingsBatch(holdings, currency || 'USD', (p) => {
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
              lastNav: res.liveNav || res.livePrice,
              lastPrice: res.livePrice || res.liveNav,
              nativeCurrency: res.nativeCurrency || target.nativeCurrency,
              exchange: res.exchange || target.exchange,
              schemeCode: res.schemeCode || target.schemeCode || target.ticker,
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
      alert(`Universal sync failed: ${err.message}`);
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

      {/* Institutional Sub-Category Navigation Bar */}
      <div className="flex items-center justify-between border-b pb-2 mb-4 gap-2 flex-wrap" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className={`btn btn-sm mono ${activeSubTab === 'positions' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: 11, padding: '4px 10px' }}
            onClick={() => setActiveSubTab('positions')}
          >
            Positions ({holdings.length})
          </button>
          <button
            type="button"
            className={`btn btn-sm mono ${activeSubTab === 'exposures' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: 11, padding: '4px 10px' }}
            onClick={() => setActiveSubTab('exposures')}
          >
            Portfolio Exposures
          </button>
          <button
            type="button"
            className={`btn btn-sm mono ${activeSubTab === 'attribution' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: 11, padding: '4px 10px' }}
            onClick={() => setActiveSubTab('attribution')}
          >
            FX & Attribution ({fundMetrics?.fxAttributions?.length || 0})
          </button>
          {!isPrivateMandate && (
            <button
              type="button"
              className={`btn btn-sm mono ${activeSubTab === 'taxlots' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: 11, padding: '4px 10px' }}
              onClick={() => setActiveSubTab('taxlots')}
            >
              Tax Lots & Trims
            </button>
          )}
          <button
            type="button"
            className={`btn btn-sm mono ${activeSubTab === 'treasury' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: 11, padding: '4px 10px' }}
            onClick={() => setActiveSubTab('treasury')}
          >
            Pool Cash & Treasury ({formatCurrency(fundMetrics?.undeployedCash || 0, currency, { decimals: 0 })})
          </button>
        </div>
        <div className="text-xs text-muted mono flex items-center gap-2">
          <span>AUM: <strong className="text-primary">{formatCurrency(fundMetrics.totalFundAUM || totalHoldingsValue, currency)}</strong></span>
          <span>•</span>
          <span>Cash: <strong className="text-primary">{formatCurrency(fundMetrics.undeployedCash || 0, currency, { decimals: 0 })}</strong></span>
        </div>
      </div>

      {/* 1. POSITIONS SUB-TAB */}
      {activeSubTab === 'positions' && (
        <>
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
                        <div>
                          <span>{ast.ticker}</span>
                          {ast.exchange && (
                            <span className="badge badge-neutral mono" style={{ fontSize: 9, marginLeft: 6 }}>
                              {ast.exchange}
                            </span>
                          )}
                          {ast.nativeCurrency && ast.nativeCurrency !== currency && (
                            <span className="badge badge-neutral mono" style={{ fontSize: 9, marginLeft: 4 }}>
                              {ast.nativeCurrency}
                            </span>
                          )}
                        </div>
                        {ast.status === 'closed' && (
                          <span className="badge badge-neutral mono" style={{ fontSize: 9, marginTop: 2, display: 'inline-block' }}>CLOSED</span>
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
                            {ast.nativeCurrency && ast.nativeCurrency !== currency && ast.lastPrice && (
                              <div className="text-xxs text-muted mono">
                                @ {formatNumber(ast.lastPrice, 2)} {ast.nativeCurrency}
                              </div>
                            )}
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
        </>
      )}

      {/* 2. PORTFOLIO EXPOSURES SUB-TAB */}
      {activeSubTab === 'exposures' && (
        <div className="space-y-4">
          {/* Exposure KPIs */}
          <div className="metric-strip mb-3">
            <div className="metric-cell">
              <span className="metric-label">Top 5 Concentration</span>
              <span className="metric-val mono">{formatNumber(fundMetrics.exposureAnalytics?.top5Concentration || 0, 1)}%</span>
              <div className="metric-delta text-muted">
                <span>{(fundMetrics.exposureAnalytics?.top5Concentration || 0) > 50 ? 'Concentrated Portfolio' : 'Diversified Spread'}</span>
              </div>
            </div>
            <div className="metric-cell">
              <span className="metric-label">Cash Drag / Dry Powder</span>
              <span className="metric-val mono">{formatNumber(fundMetrics.exposureAnalytics?.cashDragPct || 0, 1)}%</span>
              <div className="metric-delta text-muted">
                <span>{formatCurrency(fundMetrics.undeployedCash || 0, currency, { decimals: 0 })} Liquid Cash</span>
              </div>
            </div>
            <div className="metric-cell">
              <span className="metric-label">Active Asset Positions</span>
              <span className="metric-val mono">{activeHoldings.length}</span>
              <div className="metric-delta text-muted">
                <span>Across {Object.keys(fundMetrics.exposureAnalytics?.byAssetClass || {}).length} asset classes</span>
              </div>
            </div>
            <div className="metric-cell">
              <span className="metric-label">Fund Base Currency</span>
              <span className="metric-val mono">{currency}</span>
              <div className="metric-delta text-muted">
                <span>Global FX conversion active</span>
              </div>
            </div>
          </div>

          {/* 3-Column Exposure Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* 1. Asset Class */}
            <div className="card p-3">
              <div className="section-head mb-2">
                <span className="section-title text-xs font-semibold uppercase">Asset Class Exposure</span>
              </div>
              <div className="table-responsive">
                <table className="dense-table text-xs">
                  <thead>
                    <tr>
                      <th>Class</th>
                      <th className="text-right">Valuation</th>
                      <th className="text-right">Weight</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(fundMetrics.exposureAnalytics?.byAssetClass || {}).map(([cls, d]) => (
                      <tr key={cls}>
                        <td className="font-medium text-primary">{cls}</td>
                        <td className="mono text-right">{formatCurrency(d.value, currency, { decimals: 0 })}</td>
                        <td className="mono font-semibold text-right">{formatNumber(d.weightPct, 1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2. Currency Exposure */}
            <div className="card p-3">
              <div className="section-head mb-2">
                <span className="section-title text-xs font-semibold uppercase">Currency Exposure</span>
              </div>
              <div className="table-responsive">
                <table className="dense-table text-xs">
                  <thead>
                    <tr>
                      <th>Currency</th>
                      <th className="text-right">Positions</th>
                      <th className="text-right">Valuation</th>
                      <th className="text-right">Weight</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(fundMetrics.exposureAnalytics?.byCurrency || {}).map(([cur, d]) => (
                      <tr key={cur}>
                        <td className="mono font-semibold text-primary">{cur}</td>
                        <td className="mono text-muted text-right">{d.count}</td>
                        <td className="mono text-right">{formatCurrency(d.value, currency, { decimals: 0 })}</td>
                        <td className="mono font-semibold text-right">{formatNumber(d.weightPct, 1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. Sector Breakdown */}
            <div className="card p-3">
              <div className="section-head mb-2">
                <span className="section-title text-xs font-semibold uppercase">Sector Breakdown</span>
              </div>
              <div className="table-responsive">
                <table className="dense-table text-xs">
                  <thead>
                    <tr>
                      <th>Sector</th>
                      <th className="text-right">Positions</th>
                      <th className="text-right">Valuation</th>
                      <th className="text-right">Weight</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(fundMetrics.exposureAnalytics?.bySector || {}).map(([sec, d]) => (
                      <tr key={sec}>
                        <td className="font-medium text-primary truncate" style={{ maxWidth: 120 }}>{sec}</td>
                        <td className="mono text-muted text-right">{d.count}</td>
                        <td className="mono text-right">{formatCurrency(d.value, currency, { decimals: 0 })}</td>
                        <td className="mono font-semibold text-right">{formatNumber(d.weightPct, 1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. FX & ATTRIBUTION SUB-TAB */}
      {activeSubTab === 'attribution' && (
        <div className="card p-4">
          <div className="section-head mb-3">
            <div>
              <span className="section-title">Brinson-Fachler Multi-Currency Performance Attribution</span>
              <span className="text-xs text-muted block">
                Isolates local asset alpha from currency exchange fluctuations against fund base currency ({currency}).
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="badge badge-neutral mono" style={{ fontSize: 10 }}>BASE: {currency}</span>
            </div>
          </div>

          <div className="table-responsive">
            <table className="dense-table text-xs">
              <thead>
                <tr>
                  <th>Asset / Ticker</th>
                  <th>Native CCY</th>
                  <th className="text-right">Units</th>
                  <th className="text-right">Native Price</th>
                  <th className="text-right">Local Return</th>
                  <th className="text-right">FX Impact</th>
                  <th className="text-right">Total Base Gain</th>
                  <th className="text-right">Weight</th>
                </tr>
              </thead>
              <tbody>
                {(!fundMetrics.fxAttributions || fundMetrics.fxAttributions.length === 0) ? (
                  <tr>
                    <td colSpan="8" className="text-center text-muted py-6">
                      No active asset positions available for attribution calculation.
                    </td>
                  </tr>
                ) : (
                  fundMetrics.fxAttributions.map((item, idx) => (
                    <tr key={item.ticker || idx}>
                      <td>
                        <span className="font-semibold text-primary block">{item.name || item.ticker}</span>
                        <span className="mono text-muted text-xxs">{item.ticker}</span>
                      </td>
                      <td className="mono text-muted">{item.nativeCurrency}</td>
                      <td className="mono text-right">{formatNumber(item.units, 2)}</td>
                      <td className="mono text-right">{formatNumber(item.nativePrice, 2)} {item.nativeCurrency}</td>
                      <td className={`mono text-right ${item.assetGainLocal >= 0 ? 'text-profit' : 'text-loss'}`}>
                        {item.assetGainLocal >= 0 ? '+' : ''}{formatNumber(item.assetGainLocal, 2)} ({formatNumber(item.assetGainLocalPct, 1)}%)
                      </td>
                      <td className={`mono text-right ${item.fxGainBase >= 0 ? 'text-profit' : 'text-loss'}`}>
                        {item.fxGainBase >= 0 ? '+' : ''}{formatCurrency(item.fxGainBase, currency, { decimals: 0 })}
                      </td>
                      <td className={`mono font-semibold text-right ${item.totalGainBase >= 0 ? 'text-profit' : 'text-loss'}`}>
                        {item.totalGainBase >= 0 ? '+' : ''}{formatCurrency(item.totalGainBase, currency, { decimals: 0 })} ({formatNumber(item.totalGainBasePct, 1)}%)
                      </td>
                      <td className="mono font-medium text-right">{formatNumber(item.weightPct, 1)}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. TAX LOTS & TRIMS SUB-TAB */}
      {activeSubTab === 'taxlots' && (
        <div className="space-y-4">
          {/* Strategy & Filter Bar */}
          <div className="card p-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="font-semibold text-sm block">Tax-Lot Depletion Engine & Cost Basis Accounting</span>
                <span className="text-xs text-muted">
                  Simulate partial position trims under Institutional Tax Accounting methods (FIFO, LIFO, HIFO/Highest Cost).
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted mono">METHOD:</span>
                {['FIFO', 'LIFO', 'HIFO', 'AVG'].map((strat) => (
                  <button
                    key={strat}
                    type="button"
                    className={`btn btn-sm mono ${taxLotStrategy === strat ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: 10, padding: '3px 8px' }}
                    onClick={() => setTaxLotStrategy(strat)}
                  >
                    {strat === 'FIFO' ? 'FIFO (First In)' : strat === 'LIFO' ? 'LIFO (Last In)' : strat === 'HIFO' ? 'HIFO (Tax Loss)' : 'Avg Cost'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Partial Trim Simulator */}
          <div className="card p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <div className="section-head mb-3">
              <span className="section-title text-xs font-semibold uppercase">Simulate Partial Trim / Exit</span>
              <span className="badge badge-neutral mono" style={{ fontSize: 10 }}>STRATEGY: {taxLotStrategy}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <div>
                <label className="form-label text-xs">Target Position</label>
                <select 
                  value={trimHoldingId} 
                  onChange={(e) => setTrimHoldingId(e.target.value)} 
                  className="form-select mono text-xs"
                >
                  <option value="">-- Select Holding to Trim --</option>
                  {activeHoldings.map(h => (
                    <option key={h.id} value={h.id}>
                      {h.ticker || h.name} ({formatNumber(h.units, 2)} units @ {formatCurrency(h.currentValue, currency)})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label text-xs">Units to Liquidate / Trim</label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 5"
                  value={trimUnits}
                  onChange={(e) => setTrimUnits(e.target.value)}
                  className="form-input mono text-xs"
                />
              </div>
              <div className="flex items-end">
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm mono w-full"
                  onClick={() => { setTrimHoldingId(''); setTrimUnits(''); }}
                >
                  Clear Simulation
                </button>
              </div>
            </div>

            {simulatedTrimResult && (
              <div className="card p-3 text-xs mono" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-2">
                  <div>
                    <span className="text-muted block text-xxs">GROSS PROCEEDS</span>
                    <span className="font-semibold text-primary">{formatCurrency(simulatedTrimResult.totalProceeds, currency)}</span>
                  </div>
                  <div>
                    <span className="text-muted block text-xxs">COST BASIS TRIMMED</span>
                    <span className="font-semibold text-secondary">{formatCurrency(simulatedTrimResult.totalCostBasis, currency)}</span>
                  </div>
                  <div>
                    <span className="text-muted block text-xxs">REALIZED P&L</span>
                    <span className={`font-semibold ${simulatedTrimResult.netRealized >= 0 ? 'text-profit' : 'text-loss'}`}>
                      {simulatedTrimResult.netRealized >= 0 ? '+' : ''}{formatCurrency(simulatedTrimResult.netRealized, currency)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted block text-xxs">TAX CLASSIFICATION</span>
                    <span className="font-semibold text-primary">
                      STCG: {formatCurrency(simulatedTrimResult.stcgGain, currency)} • LTCG: {formatCurrency(simulatedTrimResult.ltcgGain, currency)}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 mt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div className="text-xxs text-muted">
                    Lots depleted: {simulatedTrimResult.consumedLots.length} under {taxLotStrategy} priority order directly in PostgreSQL database.
                  </div>
                  {!isInvestor && (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm mono"
                      disabled={isExecutingTrim || !onExecuteTradeTrim}
                      onClick={handleExecuteTrimClick}
                      style={{ minWidth: 200 }}
                    >
                      {isExecutingTrim ? 'EXECUTING ON DATABASE...' : 'EXECUTE TRIM ON DATABASE'}
                    </button>
                  )}
                </div>
              </div>
            )}

            {trimFeedback && (
              <div 
                className="card p-3 text-xs mono mt-3"
                style={{ 
                  background: trimFeedback.type === 'success' ? 'var(--profit-subtle)' : 'var(--loss-subtle)',
                  borderColor: trimFeedback.type === 'success' ? 'var(--profit)' : 'var(--loss)'
                }}
              >
                <div className="flex justify-between items-center">
                  <span className={trimFeedback.type === 'success' ? 'text-profit font-semibold' : 'text-loss font-semibold'}>
                    {trimFeedback.message}
                  </span>
                  <button 
                    type="button" 
                    className="btn btn-secondary btn-sm text-xxs mono"
                    onClick={() => setTrimFeedback(null)}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Granular Tax Lots Table */}
          <div className="card p-4">
            <div className="section-head mb-3">
              <span className="section-title">Open Position Tax Lots ({filteredTaxLots.length})</span>
              <div className="flex items-center gap-2">
                <select 
                  value={selectedLotAssetId} 
                  onChange={(e) => setSelectedLotAssetId(e.target.value)}
                  className="form-select mono text-xs"
                  style={{ width: 'auto', padding: '2px 8px' }}
                >
                  <option value="all">All Holdings</option>
                  {activeHoldings.map(h => (
                    <option key={h.id} value={h.id}>{h.ticker || h.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="table-responsive">
              <table className="dense-table text-xs">
                <thead>
                  <tr>
                    <th>Lot ID</th>
                    <th>Acquired Date</th>
                    <th>Holding / Ticker</th>
                    <th className="text-right">Units</th>
                    <th className="text-right">Cost / Unit</th>
                    <th className="text-right">Market Price</th>
                    <th className="text-right">Valuation</th>
                    <th className="text-right">Unrealized Gain</th>
                    <th>Tax Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTaxLots.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="text-center text-muted py-6">
                        No tax lots found.
                      </td>
                    </tr>
                  ) : (
                    filteredTaxLots.map((lot) => (
                      <tr key={lot.lotId}>
                        <td className="mono text-muted">{lot.lotId}</td>
                        <td className="mono text-secondary">{lot.date} ({lot.daysHeld}d)</td>
                        <td>
                          <span className="font-semibold text-primary block">{lot.name}</span>
                          <span className="mono text-muted text-xxs">{lot.ticker}</span>
                        </td>
                        <td className="mono text-right">{formatNumber(lot.units, 2)}</td>
                        <td className="mono text-right">{formatCurrency(lot.unitCost, currency, { decimals: 2 })}</td>
                        <td className="mono text-right">{formatCurrency(lot.unitPrice, currency, { decimals: 2 })}</td>
                        <td className="mono font-semibold text-right">{formatCurrency(lot.currentVal, currency, { decimals: 0 })}</td>
                        <td className={`mono text-right ${lot.gain >= 0 ? 'text-profit' : 'text-loss'}`}>
                          {lot.gain >= 0 ? '+' : ''}{formatCurrency(lot.gain, currency, { decimals: 0 })} ({formatNumber(lot.gainPct, 1)}%)
                        </td>
                        <td>
                          <span className={`badge ${lot.isLTCG ? 'badge-profit' : 'badge-neutral'} mono`} style={{ fontSize: 9 }}>
                            {lot.taxType}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. POOL CASH & TREASURY SUB-TAB */}
      {activeSubTab === 'treasury' && (
        <div className="space-y-4">
          {/* Executive Treasury Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="card p-3">
              <span className="text-xxs text-muted block mono font-semibold">LIQUID POOL CASH (DRY POWDER)</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl font-bold mono text-primary">
                  {formatCurrency(fundMetrics?.treasury?.availableCash ?? fundMetrics?.undeployedCash ?? 0, currency, { decimals: 0 })}
                </span>
                <span className="badge badge-neutral mono" style={{ fontSize: 9 }}>
                  {formatNumber(fundMetrics?.treasury?.cashDragPct || 0, 1)}% OF AUM
                </span>
              </div>
              <span className="text-xxs text-muted block mt-1">
                Unallocated bank buffer • 100% NAV protected
              </span>
            </div>

            <div className="card p-3">
              <span className="text-xxs text-muted block mono font-semibold">DEPLOYED IN ACTIVE ASSETS</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl font-bold mono text-primary">
                  {formatCurrency(fundMetrics?.treasury?.deployedCapital ?? fundMetrics?.activeHoldingsCost ?? 0, currency, { decimals: 0 })}
                </span>
                <span className="badge badge-profit mono" style={{ fontSize: 9 }}>
                  {formatNumber(fundMetrics?.treasury?.cashUtilizationPct || 0, 1)}% DEPLOYED
                </span>
              </div>
              <span className="text-xxs text-muted block mt-1">
                Cost basis invested in stocks, funds, and assets
              </span>
            </div>

            <div className="card p-3">
              <span className="text-xxs text-muted block mono font-semibold">CUMULATIVE POOL INFLOWS</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl font-bold mono text-primary">
                  {formatCurrency(fundMetrics?.treasury?.totalInflows ?? fundMetrics?.totalDeposited ?? 0, currency, { decimals: 0 })}
                </span>
                <span className="badge badge-neutral mono" style={{ fontSize: 9 }}>
                  DEPOSITS
                </span>
              </div>
              <span className="text-xxs text-muted block mt-1">
                Net member capital contributed into the syndicate
              </span>
            </div>

            <div className="card p-3">
              <span className="text-xxs text-muted block mono font-semibold">REALIZED TRADE PROCEEDS</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className={`text-xl font-bold mono ${(fundMetrics?.treasury?.realizedTradeProceeds ?? fundMetrics?.realizedProfit ?? 0) >= 0 ? 'text-profit' : 'text-loss'}`}>
                  {(fundMetrics?.treasury?.realizedTradeProceeds ?? fundMetrics?.realizedProfit ?? 0) >= 0 ? '+' : ''}
                  {formatCurrency(fundMetrics?.treasury?.realizedTradeProceeds ?? fundMetrics?.realizedProfit ?? 0, currency, { decimals: 0 })}
                </span>
                <span className="badge badge-neutral mono" style={{ fontSize: 9 }}>
                  LIQUIDATED
                </span>
              </div>
              <span className="text-xxs text-muted block mt-1">
                Cash returned from exited positions and trims
              </span>
            </div>
          </div>

          {/* Institutional Money Flow Lifecycle Card */}
          <div className="card p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="badge badge-neutral mono font-semibold" style={{ fontSize: 10 }}>
                  TREASURY RECONCILIATION & CASH FLOW LIFECYCLE
                </span>
                <span className="badge badge-profit mono" style={{ fontSize: 9 }}>
                  LIQUID TREASURY POOL
                </span>
              </div>
              <div className="flex items-center gap-2">
                {!isInvestor && (
                  <>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm mono"
                      onClick={() => setIsCashAdjModalOpen(true)}
                    >
                      + Record Cash Adjustment
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm mono"
                      onClick={handleOpenAdd}
                    >
                      + Deploy Cash into Asset
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs mono pt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <div className="p-2" style={{ background: 'var(--bg-subtle)', borderRadius: 4 }}>
                <span className="text-muted block font-semibold text-xxs">1. CAPITAL DEPOSIT</span>
                <span className="text-primary block font-medium mt-1">Member Inflow</span>
                <span className="text-xxs text-secondary block mt-1 leading-normal">
                  Cash credited to bank reserve (+₹). Units issued at prevailing NAV. NAV does not dilute.
                </span>
              </div>
              <div className="p-2" style={{ background: 'var(--bg-subtle)', borderRadius: 4 }}>
                <span className="text-muted block font-semibold text-xxs">2. TREASURY DEPLOYMENT</span>
                <span className="text-primary block font-medium mt-1">Asset Purchase / SIP</span>
                <span className="text-xxs text-secondary block mt-1 leading-normal">
                  Cost basis cut from Liquid Pool Cash (-₹). Asset cost basis credited (+₹). AUM neutral at trade date.
                </span>
              </div>
              <div className="p-2" style={{ background: 'var(--bg-subtle)', borderRadius: 4 }}>
                <span className="text-muted block font-semibold text-xxs">3. ASSET COMPOUNDING</span>
                <span className="text-primary block font-medium mt-1">Market Appreciation</span>
                <span className="text-xxs text-secondary block mt-1 leading-normal">
                  Asset prices fluctuate daily. Portfolio expands/contracts. NAV increases for all members.
                </span>
              </div>
              <div className="p-2" style={{ background: 'var(--bg-subtle)', borderRadius: 4 }}>
                <span className="text-muted block font-semibold text-xxs">4. CASH REPLENISHMENT</span>
                <span className="text-primary block font-medium mt-1">Trim / Liquidation</span>
                <span className="text-xxs text-secondary block mt-1 leading-normal">
                  Units trimmed. Proceeds replenished back into Liquid Pool Cash (+₹). Realized gain locked.
                </span>
              </div>
            </div>
          </div>

          {/* Treasury Cash Flow Ledger Table */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div>
                <span className="section-title">Institutional Treasury Cash Ledger</span>
                <span className="text-xs text-muted block">
                  Chronological audit of every cash inflow, deployment debit, trim replenishment, and bank reconciliation.
                </span>
              </div>

              <div className="flex items-center gap-1">
                {['all', 'inflow', 'deployment', 'trade', 'adjustment'].map((flt) => (
                  <button
                    key={flt}
                    type="button"
                    className={`btn btn-sm mono ${treasuryFilter === flt ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: 10, padding: '3px 8px', textTransform: 'uppercase' }}
                    onClick={() => setTreasuryFilter(flt)}
                  >
                    {flt === 'trade' ? 'Proceeds' : flt}
                  </button>
                ))}
              </div>
            </div>

            <div className="table-responsive">
              <table className="dense-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Transaction Type</th>
                    <th>Reference / Allocation</th>
                    <th>Category</th>
                    <th className="text-right">Cash Flow Delta</th>
                    <th className="text-right">Running Pool Cash</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const fullLedger = fundMetrics?.treasury?.ledger || [];
                    const filtered = fullLedger.filter((entry) => {
                      if (treasuryFilter === 'inflow') return entry.flow === 'inflow' || entry.type.includes('deposit');
                      if (treasuryFilter === 'deployment') return entry.flow === 'deployment' || entry.type.includes('asset_deployment');
                      if (treasuryFilter === 'trade') return entry.type.includes('trade_proceeds') || entry.type.includes('trade_loss');
                      if (treasuryFilter === 'adjustment') return entry.type.includes('bank') || entry.type.includes('expense') || entry.type.includes('adjustment');
                      return true;
                    });

                    if (filtered.length === 0) {
                      return (
                        <tr>
                          <td colSpan="7" className="text-center py-6 text-muted mono">
                            No treasury ledger movements recorded for this filter.
                          </td>
                        </tr>
                      );
                    }

                    return filtered.map((entry) => {
                      const isPositive = entry.delta > 0;
                      const isNegative = entry.delta < 0;

                      return (
                        <tr key={entry.id}>
                          <td className="mono text-muted">{entry.date}</td>
                          <td>
                            <span 
                              className={`badge mono ${
                                entry.type.includes('deposit') ? 'badge-profit' :
                                entry.type.includes('deployment') ? 'badge-neutral' :
                                entry.type.includes('proceeds') ? 'badge-profit' :
                                entry.type.includes('outflow') ? 'badge-loss' : 'badge-neutral'
                              }`} 
                              style={{ fontSize: 9 }}
                            >
                              [{entry.typeLabel || entry.type.toUpperCase()}]
                            </span>
                          </td>
                          <td className="font-medium text-primary">
                            {entry.reference}
                            {entry.note && (
                              <span className="text-xxs text-muted block mono mt-0.5">{entry.note}</span>
                            )}
                          </td>
                          <td className="text-muted text-xs mono">{entry.category || 'Treasury'}</td>
                          <td className={`mono text-right font-semibold ${isPositive ? 'text-profit' : isNegative ? 'text-loss' : 'text-muted'}`}>
                            {isPositive ? '+' : ''}{formatCurrency(entry.delta, currency, { decimals: 0 })}
                          </td>
                          <td className="mono text-right font-semibold text-primary">
                            {formatCurrency(entry.runningBalance, currency, { decimals: 0 })}
                          </td>
                          <td>
                            <span className="badge badge-neutral mono" style={{ fontSize: 9 }}>
                              [{String(entry.status || 'VERIFIED').toUpperCase()}]
                            </span>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
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

            <form onSubmit={handleSave} ref={autocompleteContainerRef}>
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>Investment / Asset / Scheme Name</label>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    Universal search (US, CA, AU, KR, UK, IN, Crypto, ISIN)
                  </span>
                </div>
                <div className="autocomplete-container">
                  <input
                    type="text"
                    placeholder="Search name or stock (e.g. Reliance, Apple, Shopify, BHP, Parag Parikh)..."
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    onFocus={() => {
                      if (assetSuggestions.length > 0) {
                        setActiveSearchField('name');
                        setShowSuggestions(true);
                      }
                    }}
                    className="form-input"
                    required
                    autoComplete="off"
                  />
                  {isSearchingAsset && activeSearchField === 'name' && (
                    <div style={{ position: 'absolute', right: 10, top: 7, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      Searching markets...
                    </div>
                  )}
                  {showSuggestions && assetSuggestions.length > 0 && activeSearchField === 'name' && (
                    <div className="autocomplete-dropdown" style={{ maxHeight: 280, overflowY: 'auto' }}>
                      {assetSuggestions.map((item) => (
                        <div
                          key={`${item.symbol}_${item.exchange}`}
                          className="autocomplete-item"
                          onClick={() => handleSelectSuggestion(item)}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, minWidth: 0 }}>
                            <span className="autocomplete-item-name" style={{ wordBreak: 'break-word', fontWeight: 500 }}>
                              {item.name}
                            </span>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                              <span className="mono font-semibold" style={{ fontSize: 11, color: 'var(--text-primary)' }}>
                                {item.symbol}
                              </span>
                              {item.badge && (
                                <span className="badge badge-neutral mono" style={{ fontSize: 9 }}>
                                  {item.badge}
                                </span>
                              )}
                              {item.currency && (
                                <span className="mono text-muted" style={{ fontSize: 10 }}>
                                  {item.currency}
                                </span>
                              )}
                              {item.isin && (
                                <span className="mono text-muted" style={{ fontSize: 9 }}>
                                  ISIN: {item.isin}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="btn btn-secondary btn-sm mono" style={{ fontSize: 10, padding: '2px 8px', pointerEvents: 'none' }}>
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
                  <label className="form-label">Ticker / Code</label>
                  <div className="autocomplete-container">
                    <input
                      type="text"
                      placeholder="e.g. RELIANCE, AAPL, SHOP.TO, BHP.AX, 122639"
                      value={ticker}
                      onChange={(e) => handleTickerChange(e.target.value)}
                      onFocus={() => {
                        if (assetSuggestions.length > 0) {
                          setActiveSearchField('ticker');
                          setShowSuggestions(true);
                        }
                      }}
                      className="form-input mono"
                      autoComplete="off"
                    />
                    {isSearchingAsset && activeSearchField === 'ticker' && (
                      <div style={{ position: 'absolute', right: 10, top: 7, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        Searching...
                      </div>
                    )}
                    {showSuggestions && assetSuggestions.length > 0 && activeSearchField === 'ticker' && (
                      <div className="autocomplete-dropdown" style={{ maxHeight: 280, overflowY: 'auto' }}>
                        {assetSuggestions.map((item) => (
                          <div
                            key={`${item.symbol}_${item.exchange}`}
                            className="autocomplete-item"
                            onClick={() => handleSelectSuggestion(item)}
                          >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, minWidth: 0 }}>
                              <span className="autocomplete-item-name" style={{ wordBreak: 'break-word', fontWeight: 500 }}>
                                {item.name}
                              </span>
                              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                                <span className="mono font-semibold" style={{ fontSize: 11, color: 'var(--text-primary)' }}>
                                  {item.symbol}
                                </span>
                                {item.badge && (
                                  <span className="badge badge-neutral mono" style={{ fontSize: 9 }}>
                                    {item.badge}
                                  </span>
                                )}
                                {item.currency && (
                                  <span className="mono text-muted" style={{ fontSize: 10 }}>
                                    {item.currency}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="btn btn-secondary btn-sm mono" style={{ fontSize: 10, padding: '2px 8px', pointerEvents: 'none' }}>
                              Select
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
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

              {/* Funding Source & Treasury Cash Impact */}
              <div className="card p-3 mb-3" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="mono font-semibold" style={{ fontSize: 11, color: 'var(--text-primary)' }}>
                    FUNDING SOURCE & TREASURY CASH IMPACT
                  </span>
                  <span className="badge badge-neutral mono" style={{ fontSize: 9 }}>
                    POOL CASH: {formatCurrency(fundMetrics?.undeployedCash || 0, currency, { decimals: 0 })}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                  <label 
                    className="card p-2 flex items-start gap-2 cursor-pointer" 
                    style={{ 
                      background: fundingSource === 'pool_cash' ? 'var(--bg-hover)' : 'var(--bg-surface)',
                      border: fundingSource === 'pool_cash' ? '1px solid var(--border-focus)' : '1px solid var(--border-subtle)' 
                    }}
                  >
                    <input 
                      type="radio" 
                      name="fundingSource" 
                      value="pool_cash" 
                      checked={fundingSource === 'pool_cash'} 
                      onChange={() => setFundingSource('pool_cash')}
                      style={{ marginTop: 2 }}
                    />
                    <div>
                      <span className="text-xs font-medium block text-primary">Deduct from Pool Cash</span>
                      <span className="text-xxs text-muted block">Cuts money from syndicate bank reserve.</span>
                    </div>
                  </label>

                  <label 
                    className="card p-2 flex items-start gap-2 cursor-pointer" 
                    style={{ 
                      background: fundingSource === 'in_kind' ? 'var(--bg-hover)' : 'var(--bg-surface)',
                      border: fundingSource === 'in_kind' ? '1px solid var(--border-focus)' : '1px solid var(--border-subtle)' 
                    }}
                  >
                    <input 
                      type="radio" 
                      name="fundingSource" 
                      value="in_kind" 
                      checked={fundingSource === 'in_kind'} 
                      onChange={() => setFundingSource('in_kind')}
                      style={{ marginTop: 2 }}
                    />
                    <div>
                      <span className="text-xs font-medium block text-primary">External / In-Kind Capital</span>
                      <span className="text-xxs text-muted block">External holdings transfer (does not cut pool cash).</span>
                    </div>
                  </label>
                </div>

                {fundingSource === 'pool_cash' && (() => {
                  const availableCash = Number(fundMetrics?.undeployedCash || 0);
                  const cost = Number(investedAmount || 0);
                  const rem = availableCash - cost;
                  return (
                    <div className="flex items-center justify-between pt-2 text-xs mono" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                      <span className="text-muted">
                        Available: {formatCurrency(availableCash, currency, { decimals: 0 })} → Cost: -{formatCurrency(cost, currency, { decimals: 0 })}
                      </span>
                      <span className={rem >= 0 ? 'text-profit font-semibold' : 'text-loss font-semibold'}>
                        {rem >= 0 
                          ? `Remaining Cash: ${formatCurrency(rem, currency, { decimals: 0 })}` 
                          : `[DEFICIT: -${formatCurrency(Math.abs(rem), currency, { decimals: 0 })}]`}
                      </span>
                    </div>
                  );
                })()}
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
                                  <td className="mono text-primary font-semibold">
                                    {r.liveNav ? formatCurrency(r.liveNav, currency, { decimals: 4 }) : (r.livePrice ? formatCurrency(r.livePrice, currency, { decimals: 2 }) : '—')}
                                  </td>
                                  <td className={`text-xs mono ${r.success ? 'text-muted' : 'text-loss'}`} title={r.error || ''}>
                                    {r.navDate || (r.success ? 'Today' : (r.error ? `Failed: ${r.error}` : 'Failed'))}
                                  </td>
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
      {/* Cash Adjustment & Bank Reconciliation Modal */}
      {isCashAdjModalOpen && (
        <div className="modal-overlay" onClick={() => !isSubmittingAdj && setIsCashAdjModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
            <div className="section-head mb-3">
              <div>
                <span className="section-title">Record Bank & Treasury Adjustment</span>
                <span className="text-xs text-muted block">
                  Synchronize syndicate liquid cash with bank account interest, dividends, fees, or reconciliations.
                </span>
              </div>
              <button 
                type="button" 
                className="btn btn-secondary btn-sm" 
                onClick={() => setIsCashAdjModalOpen(false)}
                disabled={isSubmittingAdj}
              >
                Cancel
              </button>
            </div>

            {adjFeedback && (
              <div 
                className={`p-3 mb-3 text-xs mono ${adjFeedback.type === 'success' ? 'badge-profit' : 'badge-loss'}`}
                style={{ borderRadius: 4, border: '1px solid currentColor' }}
              >
                {adjFeedback.message}
              </div>
            )}

            <form onSubmit={handleRecordCashAdjustment}>
              <div className="form-group">
                <label className="form-label">Adjustment Type</label>
                <select
                  value={adjType}
                  onChange={(e) => setAdjType(e.target.value)}
                  className="form-select mono"
                >
                  <option value="bank_interest">Bank Interest Earned (+ Liquid Cash)</option>
                  <option value="dividend">Portfolio Dividend Received (+ Liquid Cash)</option>
                  <option value="operating_expense">Syndicate Operating Expense / Fee (- Liquid Cash)</option>
                  <option value="bank_reconciliation">Bank Statement Reconciliation (+/-)</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group flex-1">
                  <label className="form-label">Adjustment Amount ({currency})</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 1500"
                    value={adjAmount}
                    onChange={(e) => setAdjAmount(e.target.value)}
                    className="form-input mono"
                    required
                  />
                </div>
                <div className="form-group flex-1">
                  <label className="form-label">Effective Date</label>
                  <input
                    type="date"
                    value={adjDate}
                    onChange={(e) => setAdjDate(e.target.value)}
                    className="form-input mono"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Bank Reference / Description Note</label>
                <input
                  type="text"
                  placeholder="e.g. HDFC Bank Q3 Savings Interest Ref #98124"
                  value={adjNote}
                  onChange={(e) => setAdjNote(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="card p-3 mb-3 mono text-xs" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
                <div className="flex items-center justify-between">
                  <span className="text-muted">Current Pool Cash:</span>
                  <span className="text-primary font-semibold">{formatCurrency(fundMetrics?.undeployedCash || 0, currency, { decimals: 0 })}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-muted">Adjustment Delta:</span>
                  <span className={adjType === 'operating_expense' ? 'text-loss font-semibold' : 'text-profit font-semibold'}>
                    {adjType === 'operating_expense' ? '-' : '+'}{formatCurrency(Number(adjAmount) || 0, currency, { decimals: 0 })}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1 pt-1" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  <span className="text-muted">Resulting Cash Reserve:</span>
                  <span className="text-primary font-semibold">
                    {formatCurrency(
                      Math.max(0, (Number(fundMetrics?.undeployedCash) || 0) + (adjType === 'operating_expense' ? -(Number(adjAmount) || 0) : (Number(adjAmount) || 0))),
                      currency,
                      { decimals: 0 }
                    )}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsCashAdjModalOpen(false)}
                  disabled={isSubmittingAdj}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm mono"
                  disabled={isSubmittingAdj || !adjAmount || Number(adjAmount) === 0}
                >
                  {isSubmittingAdj ? 'Recording...' : 'Record Treasury Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

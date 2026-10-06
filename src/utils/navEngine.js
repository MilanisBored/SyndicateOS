// Unitized NAV Fund Accounting Engine & Types
// Solves fair profit/loss distribution for multi-person pooled investments where capital is added/withdrawn at different times.

import { convertCurrency } from '../services/fxService.js';

export const CURRENCIES = {
  INR: { symbol: '₹', code: 'INR', label: 'INR (₹) - Indian Rupee', locale: 'en-IN' },
  USD: { symbol: '$', code: 'USD', label: 'USD ($) - US Dollar', locale: 'en-US' },
  EUR: { symbol: '€', code: 'EUR', label: 'EUR (€) - Euro', locale: 'de-DE' },
  GBP: { symbol: '£', code: 'GBP', label: 'GBP (£) - British Pound', locale: 'en-GB' },
  CAD: { symbol: 'CA$', code: 'CAD', label: 'CAD ($) - Canadian Dollar', locale: 'en-CA' },
  AUD: { symbol: 'A$', code: 'AUD', label: 'AUD ($) - Australian Dollar', locale: 'en-AU' },
  SGD: { symbol: 'S$', code: 'SGD', label: 'SGD ($) - Singapore Dollar', locale: 'en-SG' },
  AED: { symbol: 'AED', code: 'AED', label: 'AED - UAE Dirham', locale: 'en-AE' },
};

export const CLEAN_EMPTY_DATA = {
  fundInfo: {
    name: "My Syndicate Fund",
    managerName: "Manager",
    initialNav: 100.0,
    currency: "INR",
  },
  members: [],
  transactions: [],
  holdings: [],
  personalFinances: {
    monthlyIncome: [],
    personalSoloAssets: [],
  },
};

export const INITIAL_DEMO_DATA = {
  fundInfo: {
    name: "Apex Growth Syndicate",
    managerName: "Fund Manager",
    initialNav: 100.0,
    currency: "INR",
    createdDate: "2026-01-15",
  },
  members: [
    {
      id: "mem_self",
      name: "Fund Manager (Lead)",
      role: "Manager & Owner",
      relationship: "self",
      color: "#6366f1",
      email: "manager@syndicate.internal",
      notes: "Primary fund manager.",
    },
    {
      id: "mem_partner",
      name: "Partner Investor",
      role: "Partner",
      relationship: "partner",
      color: "#ec4899",
      email: "partner@syndicate.internal",
      notes: "Long-term investment for joint travel & future goals.",
    },
    {
      id: "mem_alex",
      name: "Syndicate Member A",
      role: "Investor",
      relationship: "friend",
      color: "#10b981",
      email: "investor.a@syndicate.internal",
      notes: "Invests quarterly; withdrew partial for vacation in June.",
    },
    {
      id: "mem_sam",
      name: "Syndicate Member B",
      role: "Investor",
      relationship: "friend",
      color: "#f59e0b",
      email: "investor.b@syndicate.internal",
      notes: "Joined in March after seeing fund performance.",
    },
  ],
  transactions: [
    {
      id: "tx_1",
      date: "2026-01-15",
      type: "deposit",
      memberId: "mem_self",
      amount: 100000,
      nav: 100.0,
      units: 1000.0,
      note: "Initial seed capital by Manager",
    },
    {
      id: "tx_2",
      date: "2026-01-15",
      type: "deposit",
      memberId: "mem_partner",
      amount: 50000,
      nav: 100.0,
      units: 500.0,
      note: "Partner initial contribution",
    },
    {
      id: "tx_3",
      date: "2026-02-01",
      type: "deposit",
      memberId: "mem_alex",
      amount: 60000,
      nav: 100.0,
      units: 600.0,
      note: "Member A first deposit",
    },
    {
      id: "tx_4",
      date: "2026-03-01",
      type: "valuation_update",
      memberId: null,
      amount: 242000, // Assets appreciated from 210,000 to 242,000 (15.23% gain)
      nav: 115.238, // 242000 / 2100 units
      units: 0,
      note: "Monthly market valuation: Strong rally in Tech ETFs & Midcap stocks",
    },
    {
      id: "tx_5",
      date: "2026-03-05",
      type: "deposit",
      memberId: "mem_sam",
      amount: 50000,
      nav: 115.238,
      units: 433.885, // 50000 / 115.238 => Member B buys at higher NAV (fair!)
      note: "Member B joins the syndicate at NAV 115.24",
    },
    {
      id: "tx_6",
      date: "2026-04-10",
      type: "deposit",
      memberId: "mem_self",
      amount: 40000,
      nav: 115.238,
      units: 347.108,
      note: "Manager monthly contribution",
    },
    {
      id: "tx_7",
      date: "2026-05-15",
      type: "valuation_update",
      memberId: null,
      amount: 380000, // Appreciated further
      nav: 131.899, // 380000 / 2880.993 units
      units: 0,
      note: "Quarterly revaluation: Dividend inflows and stock gains",
    },
    {
      id: "tx_8",
      date: "2026-06-01",
      type: "withdrawal",
      memberId: "mem_alex",
      amount: 25000,
      nav: 131.899,
      units: 189.539, // Redeemed at 131.899 => cashes out profit fairly without hurting others
      note: "Member A partial redemption for summer vacation",
    },
    {
      id: "tx_9",
      date: "2026-07-20",
      type: "deposit",
      memberId: "mem_partner",
      amount: 30000,
      nav: 131.899,
      units: 227.447,
      note: "Partner mid-year bonus allocation",
    },
    {
      id: "tx_10",
      date: "2026-09-25",
      type: "valuation_update",
      memberId: null,
      amount: 448500,
      nav: 143.805, // 448500 / 3118.901
      units: 0,
      note: "Q3 valuation update: Market highs",
    },
  ],
  holdings: [
    {
      id: "ast_1",
      name: "Apple Inc. (NASDAQ)",
      ticker: "AAPL",
      category: "Equities / Stocks",
      nativeCurrency: "USD",
      units: 12,
      investedAmount: 2400,
      currentValue: 3200,
      notes: "US Big Tech allocation",
    },
    {
      id: "ast_2",
      name: "Parag Parikh Flexi Cap Fund - Direct Growth",
      ticker: "122639",
      category: "Mutual Funds / ETFs",
      nativeCurrency: "INR",
      units: 1850.5,
      investedAmount: 110000,
      currentValue: 148500,
      notes: "Core Indian equity compounding",
    },
    {
      id: "ast_3",
      name: "Bitcoin (Cold Storage)",
      ticker: "BTC",
      category: "Crypto",
      nativeCurrency: "USD",
      units: 0.12,
      investedAmount: 6500,
      currentValue: 8850,
      notes: "Hardware wallet vault",
    },
    {
      id: "ast_4",
      name: "High-Yield Liquid Treasury & Cash",
      ticker: "CASH-LIQUID",
      category: "Liquid Cash / Overnight",
      nativeCurrency: "INR",
      investedAmount: 72000,
      currentValue: 72000,
      notes: "Dry powder for dips & instant redemption buffer",
    },
  ],
  personalFinances: {
    monthlyIncome: [
      { id: "inc_1", date: "2026-09-01", source: "Primary Job Salary", amount: 145000, category: "Salary", recurrence: "Monthly" },
      { id: "inc_2", date: "2026-09-12", source: "Freelance UI/Fullstack Contract", amount: 45000, category: "Freelance", recurrence: "One-off" },
      { id: "inc_3", date: "2026-09-20", source: "Portfolio Dividends", amount: 3800, category: "Passive", recurrence: "Quarterly" },
    ],
    personalSoloAssets: [
      { id: "p_ast_1", name: "Personal Emergency Fund (FD)", category: "Fixed Deposit", value: 300000, institution: "HDFC Bank" },
      { id: "p_ast_2", name: "Solo Crypto Wallet (BTC/ETH)", category: "Crypto", value: 85000, institution: "Ledger Cold Storage" },
      { id: "p_ast_3", name: "Company Provident Fund (EPF)", category: "Retirement", value: 240000, institution: "EPFO" },
    ],
    monthlySavingsGoalPct: 40,
  },
};

/**
 * Calculates complete state of the Fund and each Member's fair share
 */
export function computeFundState(fundInfo = {}, members = [], transactions = [], holdings = []) {
  const safeFundInfo = fundInfo || {};
  const safeMembers = Array.isArray(members) ? members : [];
  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const safeHoldings = Array.isArray(holdings) ? holdings : [];

  // Sort transactions chronologically
  const sortedTx = [...safeTransactions].sort((a, b) => new Date(a.date || '1970-01-01') - new Date(b.date || '1970-01-01'));

  // Initialize tracking
  let currentNav = Number(safeFundInfo.initialNav) || 100.0;
  let totalUnits = 0;
  let totalDeposited = 0;
  let totalWithdrawn = 0;

  const memberStats = {};
  safeMembers.forEach((m) => {
    if (!m || !m.id) return;
    memberStats[m.id] = {
      ...m,
      units: 0,
      totalDeposited: 0,
      totalWithdrawn: 0,
      transactionCount: 0,
      lastActivityDate: null,
      history: [],
    };
  });


  const timeline = [];

  sortedTx.forEach((tx) => {
    const isValuation = tx.type === "valuation_update";
    const isDeposit = tx.type === "deposit";
    const isWithdrawal = tx.type === "withdrawal";

    // Helper to find member stat across UUIDs, names, or notes
    const targetStat = (() => {
      // 1. Exact ID match
      if (tx.memberId && memberStats[tx.memberId]) return memberStats[tx.memberId];

      // 2. Case-insensitive ID match
      if (tx.memberId) {
        const idMatch = members.find(m => String(m.id).toLowerCase() === String(tx.memberId).toLowerCase());
        if (idMatch && memberStats[idMatch.id]) return memberStats[idMatch.id];
      }

      // 3. Member Name match (e.g. John Doe, Alex Smith)
      const nameToMatch = (tx.memberName || '').trim().toLowerCase();
      if (nameToMatch) {
        const nameMatch = members.find(m => m.name.trim().toLowerCase() === nameToMatch);
        if (nameMatch && memberStats[nameMatch.id]) return memberStats[nameMatch.id];
      }

      // 4. Note / Memo mention of member name (e.g. "Deposit by John Doe")
      if (tx.note) {
        const noteLower = tx.note.toLowerCase();
        const noteMatch = members.find(m => noteLower.includes(m.name.toLowerCase()));
        if (noteMatch && memberStats[noteMatch.id]) return memberStats[noteMatch.id];
      }

      return null;
    })();

    // Propagate resolved member onto transaction object for consistent UI rendering
    if (targetStat && !tx.memberId) {
      tx.memberId = targetStat.id;
      tx.memberName = targetStat.name;
    }

    if (isValuation) {
      if (totalUnits > 0) {
        currentNav = tx.amount / totalUnits;
      }
    } else if (isDeposit) {
      // Guard against orphaned transactions: deposits without an active member cannot issue phantom units
      if (!targetStat) return;

      const navAtTx = tx.nav || currentNav || fundInfo.initialNav || 100.0;
      // Derive exact units from amount / navAtTx to avoid database decimal truncation
      const unitsCreated = (navAtTx > 0 && tx.amount > 0)
        ? (tx.amount / navAtTx)
        : (Number(tx.units) || 0);

      totalUnits += unitsCreated;
      totalDeposited += tx.amount;

      targetStat.units += unitsCreated;
      targetStat.totalDeposited += tx.amount;
      targetStat.transactionCount += 1;
      targetStat.lastActivityDate = tx.date;
      targetStat.history.push({
        ...tx,
        navUsed: navAtTx,
        unitsCalculated: unitsCreated,
        memberUnitsAfter: targetStat.units,
      });
    } else if (isWithdrawal) {
      // Guard against orphaned transactions
      if (!targetStat) return;

      const navAtTx = tx.nav || currentNav || fundInfo.initialNav || 100.0;
      const unitsRedeemed = (navAtTx > 0 && tx.amount > 0)
        ? (tx.amount / navAtTx)
        : (Number(tx.units) || 0);

      totalUnits = Math.max(0, totalUnits - unitsRedeemed);
      totalWithdrawn += tx.amount;

      targetStat.units = Math.max(0, targetStat.units - unitsRedeemed);
      targetStat.totalWithdrawn += tx.amount;
      targetStat.transactionCount += 1;
      targetStat.lastActivityDate = tx.date;
      targetStat.history.push({
        ...tx,
        navUsed: navAtTx,
        unitsCalculated: unitsRedeemed,
        memberUnitsAfter: targetStat.units,
      });
    }

    const currentPortfolioValue = totalUnits * currentNav;

    timeline.push({
      date: tx.date,
      nav: currentNav,
      totalUnits,
      portfolioValue: currentPortfolioValue,
      txType: tx.type,
      txAmount: tx.amount,
      note: tx.note,
    });
  });

  // Strict Invariant: Total fund units must strictly equal the sum of active members' units
  // Guarantees zero phantom dilution even if orphaned records exist in database
  totalUnits = Object.values(memberStats).reduce((sum, s) => sum + (Number(s.units) || 0), 0);
  totalDeposited = Object.values(memberStats).reduce((sum, s) => sum + (Number(s.totalDeposited) || 0), 0);
  totalWithdrawn = Object.values(memberStats).reduce((sum, s) => sum + (Number(s.totalWithdrawn) || 0), 0);

  // Calculate current fund total AUM
  // Holdings represent the invested portion of the fund.
  // Cash deposited by members that has not yet been deployed into holdings must be added to AUM
  // to avoid diluting newly deposited capital.
  const fundCur = safeFundInfo.currency || 'INR';
  const holdingsTotal = safeHoldings.reduce((sum, h) => {
    const rawVal = Number(h.currentValue) || 0;
    const hCur = h.nativeCurrency || h.currency || fundCur;
    return sum + convertCurrency(rawVal, hCur, fundCur);
  }, 0);

  // Find the most recent valuation_update in chronological transaction history
  let lastValIdx = -1;
  for (let i = sortedTx.length - 1; i >= 0; i--) {
    if (sortedTx[i].type === 'valuation_update') {
      lastValIdx = i;
      break;
    }
  }

  let undeployedCash = 0;
  if (lastValIdx >= 0) {
    // Net cash deposited after the last portfolio revaluation is undeployed liquidity in the bank/wallet
    const postValTxs = sortedTx.slice(lastValIdx + 1);
    postValTxs.forEach((t) => {
      if (t.type === 'deposit') undeployedCash += Number(t.amount) || 0;
      if (t.type === 'withdrawal') undeployedCash -= Number(t.amount) || 0;
    });
  } else {
    // If no valuation sync transaction exists, cash is total net deposits minus cost basis spent on holdings
    const holdingsCost = safeHoldings.reduce((s, h) => {
      const rawCost = Number(h.investedAmount) || Number(h.currentValue) || 0;
      const hCur = h.nativeCurrency || h.currency || fundCur;
      return s + convertCurrency(rawCost, hCur, fundCur);
    }, 0);
    undeployedCash = totalDeposited - totalWithdrawn - holdingsCost;
  }
  undeployedCash = Math.max(0, undeployedCash);

  // Fund AUM is the combined market value of invested assets plus liquid undeployed cash
  const totalFundAUM = holdingsTotal > 0 
    ? (holdingsTotal + undeployedCash) 
    : (totalUnits > 0 ? totalUnits * currentNav : 0);

  // Ensure current NAV accurately reflects total AUM per unit
  if (totalUnits > 0) {
    currentNav = totalFundAUM / totalUnits;
  }

  // Calculate Member Metrics using exact ownership allocation invariant
  const computedMembers = safeMembers.map((m) => {
    const stats = memberStats[m.id] || {
      units: 0,
      totalDeposited: 0,
      totalWithdrawn: 0,
      transactionCount: 0,
      lastActivityDate: null,
      history: [],
    };
    const units = stats.units || 0;
    const ownershipRatio = totalUnits > 0 ? (units / totalUnits) : 0;
    const ownershipPct = ownershipRatio * 100;

    // Exact proportional allocation of Fund AUM guarantees zero rounding drift
    const currentValue = totalUnits > 0 ? (totalFundAUM * ownershipRatio) : 0;

    const deposited = stats.totalDeposited;
    const withdrawn = stats.totalWithdrawn;
    const netInvested = deposited - withdrawn;
    
    // Profit = (Current Value + Withdrawn Amount) - Deposited
    let totalProfit = (currentValue + withdrawn) - deposited;
    if (Math.abs(totalProfit) < 0.005) totalProfit = 0; // eliminate sub-cent floating point epsilon
    
    let roiPercentage = deposited > 0 ? (totalProfit / deposited) * 100 : 0;
    if (Math.abs(roiPercentage) < 0.0001) roiPercentage = 0;

    return {
      ...m,
      units,
      currentValue,
      totalDeposited: deposited,
      totalWithdrawn: withdrawn,
      netInvested,
      totalProfit,
      roiPercentage,
      ownershipPct,
      transactionCount: stats.transactionCount,
      lastActivityDate: stats.lastActivityDate,
      history: stats.history,
    };
  });

  // Calculate Fund Totals
  const totalFundDeposited = computedMembers.reduce((acc, m) => acc + m.totalDeposited, 0);
  const totalFundWithdrawn = computedMembers.reduce((acc, m) => acc + m.totalWithdrawn, 0);
  let totalFundNetProfit = (totalFundAUM + totalFundWithdrawn) - totalFundDeposited;
  if (Math.abs(totalFundNetProfit) < 0.01) totalFundNetProfit = 0;
  let totalFundRoiPct = totalFundDeposited > 0 ? (totalFundNetProfit / totalFundDeposited) * 100 : 0;
  if (Math.abs(totalFundRoiPct) < 0.001) totalFundRoiPct = 0;

  // Institutional PnL & Balance Sheet Breakdown
  const activeHoldings = safeHoldings.filter((h) => h.status !== 'closed');
  const activeHoldingsCost = activeHoldings.reduce((sum, h) => {
    const rawCost = Number(h.investedAmount) || 0;
    const hCur = h.nativeCurrency || h.currency || fundCur;
    return sum + convertCurrency(rawCost, hCur, fundCur);
  }, 0);
  const activeHoldingsVal = activeHoldings.reduce((sum, h) => {
    const rawVal = Number(h.currentValue) || 0;
    const hCur = h.nativeCurrency || h.currency || fundCur;
    return sum + convertCurrency(rawVal, hCur, fundCur);
  }, 0);

  let unrealizedProfit = activeHoldingsVal - activeHoldingsCost;
  if (Math.abs(unrealizedProfit) < 0.01) unrealizedProfit = 0;
  const unrealizedRoiPct = activeHoldingsCost > 0 ? (unrealizedProfit / activeHoldingsCost) * 100 : 0;

  const realizedProfit = safeHoldings.reduce((sum, h) => {
    const rawRealized = Number(h.realizedPnl) || 0;
    const hCur = h.nativeCurrency || h.currency || fundCur;
    return sum + convertCurrency(rawRealized, hCur, fundCur);
  }, 0);

  // Append live NAV point to timeline if it reflects recent holdings revaluation
  const todayStr = new Date().toISOString().split('T')[0];
  const lastTimelinePoint = timeline[timeline.length - 1];
  if (!lastTimelinePoint || lastTimelinePoint.date !== todayStr || Math.abs(lastTimelinePoint.nav - currentNav) > 0.0001) {
    timeline.push({
      date: todayStr,
      nav: currentNav,
      totalUnits,
      portfolioValue: totalFundAUM,
      txType: 'live_nav',
      txAmount: 0,
      note: 'Live Portfolio Mark-to-Market',
    });
  }

  // Calculate multi-timeframe returns
  const timeframes = calculateNavTimeframes(timeline, currentNav, Number(safeFundInfo.initialNav) || 100.0);

  // Personal vs Outside Capital Breakdown
  const selfMember = computedMembers.find((m) => m.relationship === "self");
  const partnerMember = computedMembers.find((m) => m.relationship === "partner");
  const friendsMembers = computedMembers.filter((m) => m.relationship === "friend" || m.relationship === "family");

  const myStakeValue = selfMember ? selfMember.currentValue : 0;
  const partnerStakeValue = partnerMember ? partnerMember.currentValue : 0;
  const friendsStakeValue = friendsMembers.reduce((sum, f) => sum + f.currentValue, 0);

  return {
    currentNav,
    totalUnits,
    totalFundAUM,
    totalFundDeposited,
    totalFundWithdrawn,
    totalFundNetProfit,
    totalFundRoiPct,
    members: computedMembers,
    timeline,
    myStakeValue,
    partnerStakeValue,
    friendsStakeValue,
    holdingsTotal,
    undeployedCash,
    unrealizedProfit,
    unrealizedRoiPct,
    realizedProfit,
    activeHoldingsCost,
    activeHoldingsVal,
    timeframes,
  };
}

/**
 * Calculates multi-timeframe performance metrics (1D, 1W, 1M, YTD, ALL)
 */
export function calculateNavTimeframes(timeline = [], currentNav = 100, initialNav = 100) {
  const safeTimeline = Array.isArray(timeline) ? [...timeline] : [];
  safeTimeline.sort((a, b) => new Date(a.date || '1970-01-01') - new Date(b.date || '1970-01-01'));

  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const ytdStart = new Date(now.getFullYear(), 0, 1);

  function getNavAtOrBefore(targetDate, fallbackNav) {
    if (safeTimeline.length === 0) return fallbackNav;
    const targetMs = targetDate.getTime();
    let best = null;
    for (let i = safeTimeline.length - 1; i >= 0; i--) {
      const pointMs = new Date(safeTimeline[i].date).getTime();
      if (pointMs <= targetMs) {
        best = safeTimeline[i].nav;
        break;
      }
    }
    return best !== null ? best : (safeTimeline[0]?.nav || fallbackNav);
  }

  let nav1D = currentNav;
  if (safeTimeline.length > 1) {
    nav1D = getNavAtOrBefore(oneDayAgo, safeTimeline[safeTimeline.length - 2]?.nav || currentNav);
  } else {
    nav1D = initialNav;
  }

  const nav1W = getNavAtOrBefore(oneWeekAgo, initialNav);
  const nav1M = getNavAtOrBefore(oneMonthAgo, initialNav);
  const navYtd = getNavAtOrBefore(ytdStart, initialNav);
  const navAll = initialNav || (safeTimeline[0]?.nav || 100);

  function calcMetric(startNav, endNav) {
    const s = Number(startNav) || 100;
    const e = Number(endNav) || s;
    const delta = e - s;
    const pct = s > 0 ? (delta / s) * 100 : 0;
    return {
      startNav: s,
      endNav: e,
      delta: Math.round(delta * 10000) / 10000,
      pct: Math.round(pct * 100) / 100,
    };
  }

  return {
    '1D': calcMetric(nav1D, currentNav),
    '1W': calcMetric(nav1W, currentNav),
    '1M': calcMetric(nav1M, currentNav),
    'YTD': calcMetric(navYtd, currentNav),
    'ALL': calcMetric(navAll, currentNav),
  };
}

/**
 * Filters timeline points to a specified time horizon
 */
export function filterTimelineByRange(timeline = [], rangeKey = 'ALL', currentNav = 100, initialNav = 100) {
  if (!Array.isArray(timeline) || timeline.length === 0) {
    return [];
  }

  const sorted = [...timeline].sort((a, b) => new Date(a.date || '1970-01-01') - new Date(b.date || '1970-01-01'));
  const now = new Date();

  let cutoffDate = null;
  if (rangeKey === '1D') {
    cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  } else if (rangeKey === '1W') {
    cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (rangeKey === '1M') {
    cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else if (rangeKey === 'YTD') {
    cutoffDate = new Date(now.getFullYear(), 0, 1);
  }

  if (!cutoffDate || rangeKey === 'ALL') {
    return sorted;
  }

  const cutoffMs = cutoffDate.getTime();
  const filtered = sorted.filter((p) => new Date(p.date).getTime() >= cutoffMs);

  if (filtered.length === 0) {
    const lastPrior = sorted[sorted.length - 1];
    return [
      { date: cutoffDate.toISOString().split('T')[0], nav: lastPrior?.nav || initialNav },
      { date: now.toISOString().split('T')[0], nav: currentNav },
    ];
  } else if (filtered.length === 1) {
    let priorNav = initialNav;
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (new Date(sorted[i].date).getTime() < cutoffMs) {
        priorNav = sorted[i].nav;
        break;
      }
    }
    const anchor = {
      date: cutoffDate.toISOString().split('T')[0],
      nav: priorNav,
      synthetic: true,
    };
    return [anchor, ...filtered];
  }

  return filtered;
}

/**
 * Format currency with locale and symbol
 */
export function formatCurrency(amount, currencyCode = 'INR', options = {}) {
  let num = Number(amount) || 0;
  if (Math.abs(num) < 0.01) num = 0;
  const curr = CURRENCIES[currencyCode] || CURRENCIES.INR;
  
  const maximumFractionDigits = options.decimals !== undefined ? options.decimals : 2;
  const minimumFractionDigits = options.decimals !== undefined ? options.decimals : 0;

  try {
    return new Intl.NumberFormat(curr.locale, {
      style: 'currency',
      currency: curr.code,
      maximumFractionDigits,
      minimumFractionDigits,
    }).format(num);
  } catch {
    return `${curr.symbol}${num.toLocaleString(undefined, { maximumFractionDigits, minimumFractionDigits })}`;
  }
}

/**
 * Format general numbers (NAV, Units, Percentages)
 */
export function formatNumber(val, decimals = 2) {
  let num = Number(val) || 0;
  if (Math.abs(num) < 0.0001) num = 0;
  return num.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Generates an easily shareable text statement for WhatsApp/SMS/Email
 */
export function generateShareableSummary(member, fundInfo, currentNav) {
  const curr = CURRENCIES[fundInfo.currency] || CURRENCIES.INR;
  const sym = curr.symbol;
  
  return `STATEMENT OF ACCOUNT - ${fundInfo.name.toUpperCase()}
Investor: ${member.name}
Date: ${new Date().toISOString().split('T')[0]}
---------------------------------
Total Contributed: ${sym}${formatNumber(member.totalDeposited, 0)}
Total Withdrawn:   ${sym}${formatNumber(member.totalWithdrawn, 0)}
Current Equity:    ${sym}${formatNumber(member.currentValue, 0)}
Net Return:        ${member.totalProfit >= 0 ? '+' : ''}${sym}${formatNumber(member.totalProfit, 0)} (${member.roiPercentage >= 0 ? '+' : ''}${formatNumber(member.roiPercentage, 2)}%)
Units Held:        ${formatNumber(member.units, 3)} units @ ${sym}${formatNumber(currentNav, 2)}
Ownership Share:   ${formatNumber(member.ownershipPct, 2)}%
---------------------------------
Accounting: Unitized NAV pool`;
}

/**
 * Generates a unique, deterministic 6-character User Code for an investor (e.g. USR-A7F92B)
 * based on their email or user ID.
 */
export function generateUserCode(emailOrId) {
  if (!emailOrId) return '';
  const seed = String(emailOrId).toLowerCase().trim();
  let hash = 5381;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) + hash) + seed.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(6, '0').slice(-6);
  return `USR-${hex}`;
}

/**
 * Normalizes user code input (ensures USR- prefix and uppercase)
 */
export function normalizeUserCode(input) {
  if (!input) return '';
  let str = input.trim().toUpperCase();
  if (!str.startsWith('USR-')) {
    str = `USR-${str.replace(/^USR[-_]?/i, '')}`;
  }
  return str;
}

/**
 * Downloads a string payload as a CSV file in browser
 */
export function downloadCSV(filename, csvContent) {
  if (typeof window === 'undefined') return;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports all transactions to standard audit CSV
 */
export function exportTransactionsToCSV(transactions = [], members = [], fundInfo = {}) {
  const headers = ['Date', 'Participant', 'Role', 'Type', 'Amount', 'Currency', 'NAV', 'Units', 'Status', 'Verified At', 'Note'];
  const rows = transactions.map(t => {
    const mem = members.find(m => m.id === t.memberId || String(m.id).toLowerCase() === String(t.memberId).toLowerCase());
    const name = mem ? mem.name : (t.type === 'valuation_update' ? 'Fund Revaluation' : (t.memberName || 'Investor'));
    const role = mem ? mem.role : '';
    const safeNote = `"${String(t.note || '').replace(/"/g, '""')}"`;
    return [
      t.date || '',
      `"${String(name).replace(/"/g, '""')}"`,
      role,
      t.type || 'deposit',
      t.amount || 0,
      fundInfo?.currency || 'INR',
      t.nav || 100,
      t.units || 0,
      t.status || 'verified',
      t.verifiedAt || '',
      safeNote
    ].join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');
  const filename = `${String(fundInfo?.name || 'Syndicate').replace(/[^a-zA-Z0-9]/g, '_')}_transactions_${new Date().toISOString().split('T')[0]}.csv`;
  downloadCSV(filename, csv);
}

/**
 * Exports complete member cap-table to CSV
 */
export function exportMembersToCSV(members = [], fundInfo = {}, currentNav = 100) {
  const headers = ['Name', 'Role', 'Email', 'User Code', 'Units', 'Current NAV', 'Current Equity', 'Total Deposited', 'Total Withdrawn', 'Net Return', 'ROI %', 'Ownership %'];
  const rows = members.map(m => [
    `"${String(m.name || '').replace(/"/g, '""')}"`,
    m.role || 'Investor',
    m.email || '',
    m.userCode || '',
    Number(m.units || 0).toFixed(4),
    Number(currentNav || 100).toFixed(4),
    Number(m.currentValue || 0).toFixed(2),
    Number(m.totalDeposited || 0).toFixed(2),
    Number(m.totalWithdrawn || 0).toFixed(2),
    Number(m.totalProfit || 0).toFixed(2),
    `${Number(m.roiPercentage || 0).toFixed(2)}%`,
    `${Number(m.ownershipPct || 0).toFixed(2)}%`
  ].join(','));

  const csv = [headers.join(','), ...rows].join('\n');
  const filename = `${String(fundInfo?.name || 'Syndicate').replace(/[^a-zA-Z0-9]/g, '_')}_cap_table_${new Date().toISOString().split('T')[0]}.csv`;
  downloadCSV(filename, csv);
}




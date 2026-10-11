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
  KRW: { symbol: '₩', code: 'KRW', label: 'KRW (₩) - Korean Won', locale: 'ko-KR' },
  JPY: { symbol: '¥', code: 'JPY', label: 'JPY (¥) - Japanese Yen', locale: 'ja-JP' },
  CHF: { symbol: 'CHF', code: 'CHF', label: 'CHF - Swiss Franc', locale: 'de-CH' },
  HKD: { symbol: 'HK$', code: 'HKD', label: 'HKD ($) - Hong Kong Dollar', locale: 'zh-HK' },
  NZD: { symbol: 'NZ$', code: 'NZD', label: 'NZD ($) - New Zealand Dollar', locale: 'en-NZ' },
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
 * Resolves the true native currency of an asset using multi-factor detection
 */
export function resolveHoldingCurrency(holding = {}, fundCurrency = 'INR') {
  const ticker = String(holding.ticker || holding.symbol || '').trim().toUpperCase();
  const name = String(holding.name || '').trim().toLowerCase();
  const isin = String(holding.isin || '').trim().toUpperCase();
  const explicit = holding.nativeCurrency || holding.native_currency || holding.currency;

  // 1. Numeric scheme codes (5-7 digits) are Indian Mutual Funds (AMFI)
  if (/^\d{5,7}$/.test(ticker)) return 'INR';

  // 2. Indian stock exchanges or ISIN prefixes
  if (ticker.endsWith('.NS') || ticker.endsWith('.BO') || ticker.startsWith('NSE:') || ticker.startsWith('BSE:') || isin.startsWith('INF') || isin.startsWith('INE')) {
    return 'INR';
  }

  // 3. Global market suffixes
  if (ticker.endsWith('.KS') || ticker.endsWith('.KQ') || isin.startsWith('KR')) return 'KRW';
  if (ticker.endsWith('.T') || isin.startsWith('JP')) return 'JPY';
  if (ticker.endsWith('.L') || ticker.endsWith('.LON') || isin.startsWith('GB')) return 'GBP';
  if (ticker.endsWith('.TO') || ticker.endsWith('.V') || ticker.endsWith('.CN') || isin.startsWith('CA')) return 'CAD';
  if (ticker.endsWith('.AX') || isin.startsWith('AU')) return 'AUD';
  if (ticker.endsWith('.PA') || ticker.endsWith('.DE') || ticker.endsWith('.AS') || ticker.endsWith('.MC') || ticker.endsWith('.MI')) return 'EUR';

  // 4. Well-known Indian AMC names
  const indianKeywords = ['nifty', 'sensex', 'direct plan', 'growth option', 'hdfc', 'nippon', 'axis', 'zerodha', 'icici', 'sbi', 'dsp', 'kotak', 'parag parikh', 'mirae', 'uti', 'tata', 'motilal'];
  if (indianKeywords.some(kw => name.includes(kw))) return 'INR';

  // 5. Explicit currency if provided and valid
  if (explicit && explicit.trim() !== '') return explicit.trim().toUpperCase();

  // 6. Inherit fund currency
  return fundCurrency || 'INR';
}

/**
 * Calculates complete state of the Fund and each Member's fair share
 */
export function computeFundState(fundInfo = {}, members = [], transactions = [], holdings = []) {
  const safeFundInfo = fundInfo || {};
  const safeMembers = Array.isArray(members) ? members : [];
  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const safeHoldings = Array.isArray(holdings) ? holdings : [];
  const fundCur = safeFundInfo.currency || 'INR';
  const initialNav = Number(safeFundInfo.initialNav || safeFundInfo.initial_nav) || 100.0;

  // Property normalizers for holdings
  const getHoldingCurrentVal = (h) => Number(h.currentValue ?? h.current_value ?? h.market_value ?? 0);
  const getHoldingCost = (h) => Number(h.investedAmount ?? h.invested_amount ?? h.cost_price ?? 0);
  const getHoldingUnits = (h) => Number(h.units ?? h.quantity ?? 0);
  const getHoldingRealized = (h) => Number(h.realizedPnl ?? h.realized_pnl ?? 0);

  // Active Holdings Calculations
  const activeHoldings = safeHoldings.filter((h) => h.status !== 'closed');
  const activeHoldingsCost = activeHoldings.reduce((sum, h) => sum + getHoldingCost(h), 0);
  const activeHoldingsVal = activeHoldings.reduce((sum, h) => sum + getHoldingCurrentVal(h), 0);
  const holdingsTotal = activeHoldingsVal;

  // High-performance chronological sort: ISO strings 'YYYY-MM-DD' compare directly in O(1)
  const sortedTx = [...safeTransactions].sort((a, b) => {
    const da = a.date || a.event_date || a.created_at || '';
    const db = b.date || b.event_date || b.created_at || '';
    return da < db ? -1 : (da > db ? 1 : 0);
  });

  // Identify Primary Owner / Manager
  const primaryMember = safeMembers.find((m) => m.relationship === 'self') || safeMembers[0];

  // Map member deposits recorded in the transaction ledger
  const memberLedgerDeposits = new Map();
  sortedTx.forEach((t) => {
    const mId = t.memberId || t.member_id;
    if (t.type === 'deposit' && mId) {
      const key = String(mId).toLowerCase();
      memberLedgerDeposits.set(key, (memberLedgerDeposits.get(key) || 0) + (Number(t.amount) || 0));
    }
  });

  // Institutional Capital Reconciliation:
  // If active holdings exist in the fund but the founder/manager has not recorded matching cash deposits in the ledger,
  // the cost basis of the holdings represents in-kind Seed Portfolio Capital injected at initial NAV.
  let seedCapitalGap = 0;
  let seedCapitalUnits = 0;
  if (primaryMember && activeHoldingsCost > 0) {
    const primaryDeposits = memberLedgerDeposits.get(String(primaryMember.id).toLowerCase()) || 0;
    if (activeHoldingsCost > primaryDeposits) {
      seedCapitalGap = activeHoldingsCost - primaryDeposits;
      seedCapitalUnits = initialNav > 0 ? (seedCapitalGap / initialNav) : seedCapitalGap;
    }
  }

  // Pre-index members into O(1) Hash Maps
  const memberStats = {};
  const memberByIdLower = new Map();
  const memberByNameLower = new Map();

  safeMembers.forEach((m) => {
    if (!m || !m.id) return;
    const isPrimary = primaryMember && (m.id === primaryMember.id || String(m.id).toLowerCase() === String(primaryMember.id).toLowerCase());
    const initUnits = isPrimary ? seedCapitalUnits : 0;
    const initDeposited = isPrimary ? seedCapitalGap : 0;

    const stat = {
      ...m,
      units: initUnits,
      totalDeposited: initDeposited,
      totalWithdrawn: 0,
      transactionCount: isPrimary && seedCapitalGap > 0 ? 1 : 0,
      lastActivityDate: isPrimary && seedCapitalGap > 0 ? (safeFundInfo.createdDate || safeFundInfo.created_at?.split('T')[0] || null) : null,
      history: isPrimary && seedCapitalGap > 0 ? [{
        id: 'seed_init',
        date: safeFundInfo.createdDate || safeFundInfo.created_at?.split('T')[0] || (sortedTx[0]?.date) || new Date().toISOString().split('T')[0],
        type: 'seed_contribution',
        amount: seedCapitalGap,
        nav: initialNav,
        units: seedCapitalUnits,
        note: 'Initial Seed Portfolio Capital (Underlying Asset Backing)',
      }] : [],
    };
    memberStats[m.id] = stat;
    memberByIdLower.set(String(m.id).toLowerCase(), stat);
    if (m.name) {
      memberByNameLower.set(m.name.trim().toLowerCase(), stat);
    }
  });

  let currentNav = initialNav;
  let totalUnits = seedCapitalUnits;
  let totalDeposited = seedCapitalGap;
  let totalWithdrawn = 0;

  const timeline = [];

  sortedTx.forEach((tx) => {
    const isValuation = tx.type === "valuation_update";
    const isDeposit = tx.type === "deposit";
    const isWithdrawal = tx.type === "withdrawal";

    // O(1) Hash Map resolution
    const targetStat = 
      (tx.memberId && memberStats[tx.memberId]) ||
      (tx.member_id && memberStats[tx.member_id]) ||
      (tx.memberId && memberByIdLower.get(String(tx.memberId).toLowerCase())) ||
      (tx.member_id && memberByIdLower.get(String(tx.member_id).toLowerCase())) ||
      (tx.memberName && memberByNameLower.get(tx.memberName.trim().toLowerCase())) ||
      (tx.note && (() => {
        const noteLower = tx.note.toLowerCase();
        for (const [nameLower, stat] of memberByNameLower.entries()) {
          if (noteLower.includes(nameLower)) return stat;
        }
        return null;
      })()) ||
      null;

    if (targetStat && !tx.memberId) {
      tx.memberId = targetStat.id;
      tx.memberName = targetStat.name;
    }

    if (isValuation) {
      // If historical valuation transaction has a reasonable NAV, respect it; otherwise calculate from amount / totalUnits
      const isRealisticNav = tx.nav > 0 && tx.nav < (initialNav * 20) && tx.nav > (initialNav * 0.05);
      if (isRealisticNav) {
        currentNav = tx.nav;
      } else if (totalUnits > 0) {
        currentNav = tx.amount / totalUnits;
      }
    } else if (isDeposit) {
      if (!targetStat) return;

      const isRealisticNav = tx.nav > 0 && tx.nav < (initialNav * 20) && tx.nav > (initialNav * 0.05);
      const navAtTx = isRealisticNav ? tx.nav : (currentNav || initialNav);
      if (isRealisticNav) {
        currentNav = tx.nav;
      }
      const unitsCreated = (navAtTx > 0 && tx.amount > 0)
        ? (tx.amount / navAtTx)
        : (Number(tx.units) || 0);

      totalUnits += unitsCreated;
      totalDeposited += tx.amount;

      targetStat.units += unitsCreated;
      targetStat.totalDeposited += tx.amount;
      targetStat.transactionCount += 1;
      targetStat.lastActivityDate = tx.date || tx.event_date;
      targetStat.history.push({
        ...tx,
        navUsed: navAtTx,
        unitsCalculated: unitsCreated,
        memberUnitsAfter: targetStat.units,
      });
    } else if (isWithdrawal) {
      if (!targetStat) return;

      const isRealisticNav = tx.nav > 0 && tx.nav < (initialNav * 20) && tx.nav > (initialNav * 0.05);
      const navAtTx = isRealisticNav ? tx.nav : (currentNav || initialNav);
      if (isRealisticNav) {
        currentNav = tx.nav;
      }
      const unitsRedeemed = (navAtTx > 0 && tx.amount > 0)
        ? (tx.amount / navAtTx)
        : (Number(tx.units) || 0);

      totalUnits = Math.max(0, totalUnits - unitsRedeemed);
      totalWithdrawn += tx.amount;

      targetStat.units = Math.max(0, targetStat.units - unitsRedeemed);
      targetStat.totalWithdrawn += tx.amount;
      targetStat.transactionCount += 1;
      targetStat.lastActivityDate = tx.date || tx.event_date;
      targetStat.history.push({
        ...tx,
        navUsed: navAtTx,
        unitsCalculated: unitsRedeemed,
        memberUnitsAfter: targetStat.units,
      });
    }

    const currentPortfolioValue = totalUnits * currentNav;

    timeline.push({
      date: tx.date || tx.event_date,
      nav: currentNav,
      totalUnits,
      portfolioValue: currentPortfolioValue,
      txType: tx.type,
      txAmount: tx.amount,
      note: tx.note,
    });
  });

  // Strict Invariant: Total fund units must strictly equal the sum of active members' units
  totalUnits = Object.values(memberStats).reduce((sum, s) => sum + (Number(s.units) || 0), 0);
  totalDeposited = Object.values(memberStats).reduce((sum, s) => sum + (Number(s.totalDeposited) || 0), 0);
  totalWithdrawn = Object.values(memberStats).reduce((sum, s) => sum + (Number(s.totalWithdrawn) || 0), 0);

  // Institutional PnL & Balance Sheet Breakdown
  const realizedProfit = safeHoldings.reduce((sum, h) => sum + getHoldingRealized(h), 0);
  let unrealizedProfit = activeHoldingsVal - activeHoldingsCost;
  if (Math.abs(unrealizedProfit) < 0.01) unrealizedProfit = 0;
  const unrealizedRoiPct = activeHoldingsCost > 0 ? (unrealizedProfit / activeHoldingsCost) * 100 : 0;

  // Parse any bank reconciliation or cash adjustments embedded in transaction notes
  let cashAdjustmentsTotal = 0;
  sortedTx.forEach((tx) => {
    if (tx.note && /\[CASH_ADJUSTMENT:\s*([+-]?[\d.]+)\]/i.test(tx.note)) {
      const match = tx.note.match(/\[CASH_ADJUSTMENT:\s*([+-]?[\d.]+)/i);
      if (match && match[1]) {
        cashAdjustmentsTotal += Number(match[1]) || 0;
      }
    }
  });

  // Undeployed Cash: Total net capital contributed minus capital deployed into active holdings plus realized trading profits from lot liquidations plus cash adjustments
  const netMemberCapital = totalDeposited - totalWithdrawn;
  const undeployedCash = Math.max(0, (netMemberCapital - activeHoldingsCost) + realizedProfit + cashAdjustmentsTotal);

  // Fund Total AUM: Active market value of holdings plus liquid undeployed reserve cash
  const totalFundAUM = holdingsTotal > 0 
    ? (holdingsTotal + undeployedCash) 
    : (totalUnits > 0 ? totalUnits * currentNav : undeployedCash);

  // Prevailing NAV strictly equals Fund AUM divided by Total Fund Units
  if (totalUnits > 0) {
    currentNav = totalFundAUM / totalUnits;
  } else {
    currentNav = initialNav;
  }

  // Calculate Member Metrics using exact ownership allocation invariant and lot-by-lot capital accounting
  const nowMs = Date.now();
  const mgmtPctVal = Number(safeFundInfo.managementFeePct ?? safeFundInfo.management_fee_pct ?? 2.0);
  const perfPctVal = Number(safeFundInfo.performanceFeePct ?? safeFundInfo.performance_fee_pct ?? 20.0);
  const hurdlePctVal = Number(safeFundInfo.hurdleRatePct ?? safeFundInfo.hurdle_rate_pct ?? 8.0);
  const hwmVal = Number(safeFundInfo.highWaterMark ?? safeFundInfo.high_water_mark ?? initialNav);

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
    if (Math.abs(totalProfit) < 0.005) totalProfit = 0;
    
    let roiPercentage = netInvested > 0 
      ? (totalProfit / netInvested) * 100 
      : (deposited > 0 ? (totalProfit / deposited) * 100 : 0);
    if (Math.abs(roiPercentage) < 0.0001) roiPercentage = 0;

    // Granular Lot-by-Lot Capital Accounting for Member (Money In / Money Out)
    const isPrimary = primaryMember && (m.id === primaryMember.id || String(m.id).toLowerCase() === String(primaryMember.id).toLowerCase());
    const memberTxs = sortedTx.filter(t => {
      const tMid = String(t.memberId || t.member_id || '').toLowerCase();
      const mId = String(m.id || '').toLowerCase();
      return (tMid && tMid === mId) || (t.memberName && m.name && t.memberName.trim().toLowerCase() === m.name.trim().toLowerCase());
    });

    const memberDepositLots = [];

    // Seed capital lot for primary manager if backing underlying holdings
    if (isPrimary && seedCapitalGap > 0) {
      memberDepositLots.push({
        id: 'seed_init_lot',
        date: safeFundInfo.createdDate || safeFundInfo.created_at?.split('T')[0] || (sortedTx[0]?.date) || '2026-01-15',
        type: 'seed_capital',
        initialAmount: seedCapitalGap,
        remainingAmount: seedCapitalGap,
        initialUnits: seedCapitalUnits,
        remainingUnits: seedCapitalUnits,
        entryNav: initialNav,
        status: 'active',
        note: 'Seed Portfolio Capital (Underlying Asset Backing)'
      });
    }

    // Process cash deposit transactions
    memberTxs.forEach((tx) => {
      if (tx.type === 'deposit') {
        const amt = Number(tx.amount) || 0;
        const entryNav = Number(tx.nav) || initialNav;
        const lotUnits = Number(tx.units) || (entryNav > 0 ? amt / entryNav : 0);
        memberDepositLots.push({
          id: tx.id || `lot_${memberDepositLots.length}`,
          date: tx.date || tx.event_date || new Date().toISOString().split('T')[0],
          type: 'deposit',
          initialAmount: amt,
          remainingAmount: amt,
          initialUnits: lotUnits,
          remainingUnits: lotUnits,
          entryNav,
          status: 'active',
          note: tx.note || ''
        });
      }
    });

    // Deplete capital lots FIFO on member withdrawals
    memberTxs.forEach((tx) => {
      if (tx.type === 'withdrawal') {
        const withdrawalAmt = Number(tx.amount) || 0;
        const withdrawalNav = Number(tx.nav) || currentNav;
        let unitsToRedeem = Number(tx.units) || (withdrawalNav > 0 ? withdrawalAmt / withdrawalNav : 0);

        for (const lot of memberDepositLots) {
          if (unitsToRedeem <= 0.000001) break;
          if (lot.remainingUnits <= 0.000001) continue;

          const unitsDeducted = Math.min(unitsToRedeem, lot.remainingUnits);
          const ratioDeducted = lot.remainingUnits > 0 ? unitsDeducted / lot.remainingUnits : 1;
          lot.remainingUnits = Math.max(0, lot.remainingUnits - unitsDeducted);
          lot.remainingAmount = Math.max(0, lot.remainingAmount - (lot.remainingAmount * ratioDeducted));
          unitsToRedeem -= unitsDeducted;

          if (lot.remainingUnits <= 0.000001) {
            lot.status = 'redeemed';
          }
        }
      }
    });

    // Compute Actual/365 Day Count metrics on each lot
    const capitalLots = memberDepositLots.map((lot) => {
      const lotDate = new Date(lot.date || Date.now());
      const daysActive = Math.max(1, Math.round((nowMs - lotDate.getTime()) / (1000 * 60 * 60 * 24)));
      const lotValuation = lot.remainingUnits * currentNav;
      const accruedMgmt = lotValuation * (mgmtPctVal / 100) * (daysActive / 365);
      const hurdleFloorNav = lot.entryNav * (1 + (hurdlePctVal / 100) * (daysActive / 365));
      const effectiveHwmFloor = Math.max(hwmVal, hurdleFloorNav);
      let accruedCarry = 0;
      if (currentNav > effectiveHwmFloor && perfPctVal > 0 && lot.remainingUnits > 0) {
        accruedCarry = ((currentNav - effectiveHwmFloor) * lot.remainingUnits) * (perfPctVal / 100);
      }
      const netProfit = (lotValuation - lot.remainingAmount);

      return {
        ...lot,
        daysActive,
        currentValue: lotValuation,
        accruedMgmtFee: Math.round(accruedMgmt * 100) / 100,
        accruedCarry: Math.round(accruedCarry * 100) / 100,
        totalFees: Math.round((accruedMgmt + accruedCarry) * 100) / 100,
        hurdleFloorNav: Math.round(hurdleFloorNav * 100) / 100,
        netProfit: Math.round(netProfit * 100) / 100,
        isHurdleCleared: currentNav > effectiveHwmFloor,
      };
    });

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
      capitalLots,
    };
  });

  // Calculate Fund Totals
  const totalFundDeposited = computedMembers.reduce((acc, m) => acc + m.totalDeposited, 0);
  const totalFundWithdrawn = computedMembers.reduce((acc, m) => acc + m.totalWithdrawn, 0);
  let totalFundNetProfit = (totalFundAUM + totalFundWithdrawn) - totalFundDeposited;
  if (Math.abs(totalFundNetProfit) < 0.01) totalFundNetProfit = 0;
  const netFundInvested = totalFundDeposited - totalFundWithdrawn;
  let totalFundRoiPct = netFundInvested > 0 
    ? (totalFundNetProfit / netFundInvested) * 100 
    : (totalFundDeposited > 0 ? (totalFundNetProfit / totalFundDeposited) * 100 : 0);
  if (Math.abs(totalFundRoiPct) < 0.001) totalFundRoiPct = 0;

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
  const timeframes = calculateNavTimeframes(timeline, currentNav, initialNav);

  // Personal vs Outside Capital Breakdown
  const selfMember = computedMembers.find((m) => m.relationship === "self");
  const partnerMember = computedMembers.find((m) => m.relationship === "partner");
  const friendsMembers = computedMembers.filter((m) => m.relationship === "friend" || m.relationship === "family");

  const myStakeValue = selfMember ? selfMember.currentValue : 0;
  const partnerStakeValue = partnerMember ? partnerMember.currentValue : 0;
  const friendsStakeValue = friendsMembers.reduce((sum, f) => sum + f.currentValue, 0);

  // Institutional Analytics
  const riskMetrics = calculateFundRiskMetrics(timeline, currentNav, initialNav);
  const exposureAnalytics = calculateExposureAnalytics(safeHoldings, totalFundAUM, undeployedCash, fundCur);
  const feeWaterfalls = calculateInstitutionalFeeWaterfalls(safeFundInfo, totalFundAUM, totalUnits, currentNav, initialNav, safeTransactions, computedMembers);
  const fxAttributions = safeHoldings
    .filter((h) => h.status !== 'closed')
    .map((h) => calculateFxAttribution(h, fundCur));

  const treasury = calculateTreasuryState({
    transactions: sortedTx,
    holdings: safeHoldings,
    totalDeposited,
    totalWithdrawn,
    activeHoldingsCost,
    realizedProfit,
    undeployedCash,
    totalFundAUM,
    cashAdjustmentsTotal,
    baseCurrency: fundCur,
  });

  return {
    currentNav,
    totalUnits,
    totalFundAUM,
    totalFundDeposited,
    totalFundWithdrawn,
    totalDeposited: totalFundDeposited, // Alias for SyndicateView
    totalWithdrawn: totalFundWithdrawn, // Alias for SyndicateView
    totalFundNetProfit,
    totalFundRoiPct,
    members: computedMembers,
    timeline,
    myStakeValue,
    partnerStakeValue,
    friendsStakeValue,
    holdingsTotal,
    undeployedCash,
    treasury,
    unrealizedProfit,
    unrealizedRoiPct,
    realizedProfit,
    activeHoldingsCost,
    activeHoldingsVal,
    timeframes,
    riskMetrics,
    exposureAnalytics,
    feeWaterfalls,
    institutionalFeeWaterfalls: feeWaterfalls,
    fxAttributions,
  };
}

/**
 * Calculates multi-timeframe performance metrics (1D, 1W, 1M, YTD, ALL)
 */
export function calculateNavTimeframes(timeline = [], currentNav = 100, initialNav = 100) {
  if (!Array.isArray(timeline) || timeline.length === 0) {
    const defaultM = { startNav: currentNav, endNav: currentNav, delta: 0, pct: 0 };
    return { '1D': defaultM, '1W': defaultM, '1M': defaultM, 'YTD': defaultM, 'ALL': defaultM };
  }

  // Fast chronological sort using direct string comparison without date object allocations
  const safeTimeline = [...timeline].sort((a, b) => {
    const da = a.date || '';
    const db = b.date || '';
    return da < db ? -1 : (da > db ? 1 : 0);
  });

  const now = new Date();
  const oneDayAgoStr = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const oneWeekAgoStr = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const oneMonthAgoStr = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const ytdStartStr = `${now.getFullYear()}-01-01`;

  // Zero-allocation lookup using ISO string comparison (O(T) worst case, O(1) typical)
  function getNavAtOrBefore(targetDateStr, fallbackNav) {
    for (let i = safeTimeline.length - 1; i >= 0; i--) {
      const pDate = safeTimeline[i].date || '';
      if (pDate <= targetDateStr) {
        return safeTimeline[i].nav;
      }
    }
    return safeTimeline[0]?.nav || fallbackNav;
  }

  let nav1D = currentNav;
  if (safeTimeline.length > 1) {
    nav1D = getNavAtOrBefore(oneDayAgoStr, safeTimeline[safeTimeline.length - 2]?.nav || currentNav);
  } else {
    nav1D = initialNav;
  }

  const nav1W = getNavAtOrBefore(oneWeekAgoStr, initialNav);
  const nav1M = getNavAtOrBefore(oneMonthAgoStr, initialNav);
  const navYtd = getNavAtOrBefore(ytdStartStr, initialNav);
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
 * Calculates hedge fund institutional risk metrics:
 * Sharpe Ratio, Sortino Ratio, Maximum Drawdown (MDD), Annualized Volatility, High-Water Mark
 */
export function calculateFundRiskMetrics(timeline = [], currentNav = 100, initialNav = 100) {
  const safeTimeline = Array.isArray(timeline) ? timeline : [];
  const navs = safeTimeline.map(t => Number(t.nav) || initialNav).filter(n => n > 0);
  if (navs.length === 0) navs.push(initialNav);
  if (navs[navs.length - 1] !== currentNav) navs.push(currentNav);

  // High-Water Mark and Drawdowns
  let peak = navs[0] || initialNav;
  let maxDd = 0;
  for (const n of navs) {
    if (n > peak) peak = n;
    const dd = peak > 0 ? (peak - n) / peak : 0;
    if (dd > maxDd) maxDd = dd;
  }
  const currentDd = peak > 0 ? (peak - currentNav) / peak : 0;

  // Daily returns for Volatility & Sharpe
  const returns = [];
  for (let i = 1; i < navs.length; i++) {
    const prev = navs[i - 1];
    if (prev > 0) {
      returns.push((navs[i] - prev) / prev);
    }
  }

  const n = returns.length;
  const meanReturn = n > 0 ? returns.reduce((s, r) => s + r, 0) / n : 0;
  const variance = n > 1 
    ? returns.reduce((s, r) => s + Math.pow(r - meanReturn, 2), 0) / (n - 1) 
    : 0;
  const dailyVol = Math.sqrt(variance);
  const annualizedVol = dailyVol * Math.sqrt(252);

  // Downside variance for Sortino
  const downsideReturns = returns.filter(r => r < 0);
  const downsideVar = downsideReturns.length > 0
    ? downsideReturns.reduce((s, r) => s + Math.pow(r, 2), 0) / downsideReturns.length
    : 0;
  const downsideVol = Math.sqrt(downsideVar) * Math.sqrt(252);

  const totalReturn = initialNav > 0 ? (currentNav - initialNav) / initialNav : 0;
  const annReturn = totalReturn;

  const rf = 0.065; // standard 6.5% risk free rate
  const excessReturn = annReturn - rf;
  const sharpeRatio = annualizedVol > 0.0001 ? excessReturn / annualizedVol : (excessReturn > 0 ? 1.25 : 0);
  const sortinoRatio = downsideVol > 0.0001 ? excessReturn / downsideVol : (excessReturn > 0 ? 2.0 : 0);

  return {
    highWaterMark: Math.round(peak * 100) / 100,
    currentDrawdownPct: Math.round(currentDd * 10000) / 100,
    maxDrawdownPct: Math.round(maxDd * 10000) / 100,
    annualizedVolPct: Math.round(annualizedVol * 10000) / 100,
    sharpeRatio: Math.round(sharpeRatio * 100) / 100,
    sortinoRatio: Math.round(sortinoRatio * 100) / 100,
  };
}

/**
 * Calculates multi-dimensional portfolio exposure breakdown
 * (Asset Class, Currency, Sector, Top 5 Concentration, Cash Drag)
 */
export function calculateExposureAnalytics(holdings = [], totalFundAUM = 0, undeployedCash = 0, baseCurrency = 'INR') {
  const active = (Array.isArray(holdings) ? holdings : []).filter(h => h.status !== 'closed');
  const aum = Number(totalFundAUM) > 0 ? Number(totalFundAUM) : 1;
  const cash = Number(undeployedCash) || 0;

  const assetClassMap = {};
  const currencyMap = {};
  const sectorMap = {};

  active.forEach(h => {
    const val = Number(h.currentValue ?? h.current_value) || 0;
    const cat = h.category || 'Mutual Funds / ETFs';
    assetClassMap[cat] = (assetClassMap[cat] || 0) + val;

    const cur = (h.nativeCurrency || h.native_currency || baseCurrency).toUpperCase();
    currencyMap[cur] = (currencyMap[cur] || 0) + val;

    let sector = h.sector || '';
    if (!sector) {
      if (cat.includes('Mutual Fund') || cat.includes('ETF') || cat.includes('Index')) {
        sector = 'Diversified Indices & Funds';
      } else if (cat.includes('Precious Metals') || String(h.name).toLowerCase().includes('silver') || String(h.name).toLowerCase().includes('gold')) {
        sector = 'Precious Metals / Commodities';
      } else {
        sector = 'Equities & Thematic';
      }
    }
    sectorMap[sector] = (sectorMap[sector] || 0) + val;
  });

  if (cash > 0) {
    assetClassMap['Liquid Reserve (Cash)'] = (assetClassMap['Liquid Reserve (Cash)'] || 0) + cash;
    currencyMap[baseCurrency.toUpperCase()] = (currencyMap[baseCurrency.toUpperCase()] || 0) + cash;
    sectorMap['Cash & Dry Powder'] = (sectorMap['Cash & Dry Powder'] || 0) + cash;
  }

  const toList = (map) => Object.entries(map).map(([label, value]) => ({
    label,
    value: Math.round(value * 100) / 100,
    pct: Math.round((value / aum) * 10000) / 100
  })).sort((a, b) => b.value - a.value);

  // Top 5 Concentration
  const sortedHoldings = [...active].sort((a, b) => (Number(b.currentValue ?? b.current_value) || 0) - (Number(a.currentValue ?? a.current_value) || 0));
  const top5Val = sortedHoldings.slice(0, 5).reduce((s, h) => s + (Number(h.currentValue ?? h.current_value) || 0), 0);
  const top5WeightPct = Math.round((top5Val / aum) * 10000) / 100;
  const cashDragPct = Math.round((cash / aum) * 10000) / 100;

  return {
    assetClasses: toList(assetClassMap),
    currencies: toList(currencyMap),
    sectors: toList(sectorMap),
    top5WeightPct,
    cashDragPct,
    activePositionsCount: active.length,
  };
}

/**
 * Institutional Treasury & Cash Reserve Accounting
 * Models the lifecycle of fund liquid cash:
 * 1. LP Inflow: Cash deposited -> Enters liquid bank reserve
 * 2. Asset Deployment: Manager buys position / executes SIP -> Cuts liquid cash reserve
 * 3. Trade Proceeds: Positions trimmed / exited -> Replenishes liquid cash reserve
 * 4. Cash Adjustments: Bank interest, dividends, operating expenses, bank reconciliations
 */
export function calculateTreasuryState({
  transactions = [],
  holdings = [],
  totalDeposited = 0,
  totalWithdrawn = 0,
  activeHoldingsCost = 0,
  realizedProfit = 0,
  undeployedCash = 0,
  totalFundAUM = 0,
  cashAdjustmentsTotal = 0,
  baseCurrency = 'INR'
} = {}) {
  const ledger = [];

  // 1. Inflows & Outflows from Member Transactions & Treasury Adjustments
  (Array.isArray(transactions) ? transactions : []).forEach((tx) => {
    const isDeposit = tx.type === 'deposit';
    const isWithdrawal = tx.type === 'withdrawal';
    const isValuation = tx.type === 'valuation_update';
    const txDate = tx.date || tx.event_date || (tx.created_at ? tx.created_at.split('T')[0] : '2026-10-01');
    const amt = Number(tx.amount) || 0;

    if (isDeposit) {
      ledger.push({
        id: tx.id || `cash_dep_${Math.random()}`,
        date: txDate,
        type: 'deposit_inflow',
        typeLabel: 'MEMBER DEPOSIT',
        flow: 'inflow',
        delta: amt,
        reference: tx.memberName || (tx.note ? tx.note.split('[')[0].trim() : 'Member Deposit'),
        category: 'Capital Inflow',
        status: tx.status || 'verified',
        note: tx.note || null,
      });
    } else if (isWithdrawal) {
      ledger.push({
        id: tx.id || `cash_wth_${Math.random()}`,
        date: txDate,
        type: 'redemption_outflow',
        typeLabel: 'REDEMPTION PAYOUT',
        flow: 'outflow',
        delta: -amt,
        reference: tx.memberName || (tx.note ? tx.note.split('[')[0].trim() : 'Redemption Payout'),
        category: 'Capital Outflow',
        status: tx.status || 'verified',
        note: tx.note || null,
      });
    } else if (isValuation && tx.note && /\[CASH_ADJUSTMENT:\s*([+-]?[\d.]+)\]/i.test(tx.note)) {
      const match = tx.note.match(/\[CASH_ADJUSTMENT:\s*([+-]?[\d.]+)/i);
      const adjAmt = match ? Number(match[1]) || 0 : 0;
      ledger.push({
        id: tx.id || `cash_adj_${Math.random()}`,
        date: txDate,
        type: adjAmt >= 0 ? 'bank_interest' : 'operating_expense',
        typeLabel: adjAmt >= 0 ? 'BANK ADJUSTMENT' : 'FUND EXPENSE',
        flow: adjAmt >= 0 ? 'inflow' : 'outflow',
        delta: adjAmt,
        reference: tx.note.replace(/\[CASH_ADJUSTMENT:[^\]]+\]/i, '').trim() || 'Bank Reconciliation',
        category: 'Treasury Adjustment',
        status: 'verified',
        note: tx.note,
      });
    }
  });

  // 2. Deployments from Asset Purchases & Inflows from Liquidations
  (Array.isArray(holdings) ? holdings : []).forEach((h) => {
    const cost = Number(h.investedAmount ?? h.invested_amount ?? 0);
    const realized = Number(h.realizedPnl ?? h.realized_pnl ?? 0);
    const hDate = h.created_at ? h.created_at.split('T')[0] : '2026-10-03';

    if (cost > 0 && h.category !== 'Liquid Cash / Overnight') {
      const isInKind = h.notes && /\[FUNDING:\s*IN_KIND\]/i.test(h.notes);
      ledger.push({
        id: `h_buy_${h.id}`,
        date: hDate,
        type: isInKind ? 'in_kind_transfer' : 'asset_deployment',
        typeLabel: isInKind ? 'IN-KIND ASSET SEED' : 'ASSET PURCHASE',
        flow: isInKind ? 'neutral' : 'deployment',
        delta: isInKind ? 0 : -cost,
        reference: `${h.name} (${h.ticker || 'N/A'})`,
        category: h.category || 'Portfolio Holding',
        status: h.status || 'active',
        note: isInKind ? 'In-kind solo contribution (not cut from pool cash)' : 'Cut from liquid pool cash',
      });
    }

    if (realized !== 0) {
      ledger.push({
        id: `h_pnl_${h.id}`,
        date: h.updated_at ? h.updated_at.split('T')[0] : hDate,
        type: realized > 0 ? 'trade_proceeds' : 'trade_loss',
        typeLabel: realized > 0 ? 'TRADE PROCEEDS' : 'LIQUIDATION LOSS',
        flow: realized > 0 ? 'inflow' : 'outflow',
        delta: realized,
        reference: `Realized Proceeds (${h.ticker || h.name})`,
        category: 'Trade Realization',
        status: 'closed',
        note: 'Proceeds credited back to liquid pool cash',
      });
    }
  });

  // Sort chronologically to compute exact running cash balances
  ledger.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  let runningCash = 0;
  ledger.forEach((item) => {
    runningCash += item.delta;
    item.runningBalance = Math.max(0, runningCash);
  });

  const netMemberCapital = totalDeposited - totalWithdrawn;
  const cashUtilizationPct = (netMemberCapital > 0 && activeHoldingsCost > 0)
    ? Math.min(100, Math.max(0, (activeHoldingsCost / netMemberCapital) * 100))
    : 0;

  const cashDragPct = totalFundAUM > 0
    ? ((undeployedCash / totalFundAUM) * 100)
    : 0;

  return {
    availableCash: undeployedCash,
    totalInflows: totalDeposited,
    totalOutflows: totalWithdrawn,
    netContributedCapital: netMemberCapital,
    deployedCapital: activeHoldingsCost,
    realizedTradeProceeds: realizedProfit,
    cashAdjustmentsTotal,
    cashUtilizationPct,
    cashDragPct,
    totalFundAUM,
    ledger: [...ledger].reverse(),
    chronologicalLedger: ledger,
  };
}

/**
 * Calculates institutional fee waterfall (Management Fee, Performance Fee, Hurdle, High-Water Mark)
 * Follows Institutional Actual/365 Day Count Convention on Transaction Lots
 */
export function calculateInstitutionalFeeWaterfalls(
  fundInfo = {}, 
  totalFundAUM = 0, 
  totalUnits = 0, 
  currentNav = 100, 
  initialNav = 100,
  transactions = [],
  members = []
) {
  // Institutional default fee structure: 2% management fee, 20% performance carry, 8% hurdle floor
  const rawMgmt = fundInfo.management_fee_pct ?? fundInfo.managementFeePct;
  const rawPerf = fundInfo.performance_fee_pct ?? fundInfo.performanceFeePct;
  const rawHurdle = fundInfo.hurdle_rate_pct ?? fundInfo.hurdleRatePct;
  const rawHwm = fundInfo.high_water_mark ?? fundInfo.highWaterMark;

  const mgmtFeePct = Number((rawMgmt !== undefined && rawMgmt !== null && rawMgmt !== '' && Number(rawMgmt) >= 0) ? rawMgmt : 2.0);
  const perfFeePct = Number((rawPerf !== undefined && rawPerf !== null && rawPerf !== '' && Number(rawPerf) >= 0) ? rawPerf : 20.0);
  const hurdleRatePct = Number((rawHurdle !== undefined && rawHurdle !== null && rawHurdle !== '' && Number(rawHurdle) >= 0) ? rawHurdle : 8.0);
  const hwm = Number((rawHwm !== undefined && rawHwm !== null && rawHwm !== '' && Number(rawHwm) > 0) ? rawHwm : (initialNav || 100.0));

  const aum = Number(totalFundAUM) || 0;
  const units = Number(totalUnits) || 0;

  // Actual/365 Day Count Convention on Transaction & Capital Lots
  const nowMs = Date.now();
  const safeTransactions = Array.isArray(transactions) ? transactions : [];

  // Extract active member capital lots (with FIFO withdrawal depletion)
  const activeMemberLots = [];
  if (Array.isArray(members) && members.length > 0) {
    members.forEach((m) => {
      if (Array.isArray(m.capitalLots)) {
        m.capitalLots.forEach((lot) => {
          if (lot.remainingUnits > 0.000001 && lot.status !== 'redeemed') {
            activeMemberLots.push({
              id: lot.id,
              memberName: m.name || 'Member',
              memberId: m.id,
              date: lot.date,
              units: lot.remainingUnits,
              amount: lot.remainingAmount,
              depositNav: lot.entryNav,
              daysActive: lot.daysActive,
            });
          }
        });
      }
    });
  }

  const lotsToProcess = activeMemberLots.length > 0 ? activeMemberLots : safeTransactions
    .filter(t => t.type === 'deposit' && t.status !== 'rejected')
    .map((tx, idx) => {
      const txDate = new Date(tx.date || Date.now());
      const daysActive = Math.max(1, Math.round((nowMs - txDate.getTime()) / (1000 * 60 * 60 * 24)));
      const lotUnits = Number(tx.units) || (Number(tx.amount) / (Number(tx.nav) || currentNav || 100));
      return {
        id: tx.id || `lot-${idx}`,
        memberName: tx.memberName || 'Member',
        memberId: tx.memberId,
        date: tx.date || new Date().toISOString().split('T')[0],
        units: lotUnits,
        amount: Number(tx.amount) || (lotUnits * (Number(tx.nav) || initialNav)),
        depositNav: Number(tx.nav) || initialNav,
        daysActive,
      };
    });

  // Pre-index members to determine GP/Manager fee exemption status
  const memberObjMap = new Map();
  if (Array.isArray(members)) {
    members.forEach(m => {
      if (m.id) memberObjMap.set(String(m.id).toLowerCase(), m);
      if (m.name) memberObjMap.set(m.name.toLowerCase().trim(), m);
    });
  }

  function isMemberFeeExempt(memberId, memberName) {
    let target = null;
    if (memberId && memberObjMap.has(String(memberId).toLowerCase())) {
      target = memberObjMap.get(String(memberId).toLowerCase());
    } else if (memberName && memberObjMap.has(String(memberName).toLowerCase().trim())) {
      target = memberObjMap.get(String(memberName).toLowerCase().trim());
    }
    if (!target) return false;
    if (target.relationship === 'self') return true;
    const roleLower = String(target.role || '').toLowerCase();
    return roleLower.includes('manager') || roleLower.includes('owner') || roleLower.includes('lead');
  }

  let mgmtFeeAccrued = 0;
  let perfFeeAccrued = 0;
  const transactionLots = [];

  if (lotsToProcess.length > 0) {
    lotsToProcess.forEach((lot, idx) => {
      const daysActive = lot.daysActive || Math.max(1, Math.round((nowMs - new Date(lot.date || Date.now()).getTime()) / (1000 * 60 * 60 * 24)));
      const lotUnits = Number(lot.units) || 0;
      const lotCurrentVal = lotUnits * currentNav;
      const isExempt = isMemberFeeExempt(lot.memberId, lot.memberName);

      // 1. Management Fee Accrual (GP capital is 100% Fee-Exempt; only outside LP capital accrues fee)
      const lotMgmtFee = isExempt ? 0 : lotCurrentVal * (mgmtFeePct / 100) * (daysActive / 365);
      mgmtFeeAccrued += lotMgmtFee;

      // 2. Hurdle Floor & High-Water Mark Benchmark for this Lot
      const lotDepositNav = Number(lot.depositNav) || initialNav;
      const lotHurdleNav = lotDepositNav * (1 + (hurdleRatePct / 100) * (daysActive / 365));
      const lotHwmFloor = Math.max(hwm, lotHurdleNav);

      // 3. Performance Fee Accrual on Alpha above Hurdle & HWM (Exempt for Manager)
      let lotPerfFee = 0;
      if (!isExempt && currentNav > lotHwmFloor && perfFeePct > 0 && lotUnits > 0) {
        const excessAlphaPerUnit = currentNav - lotHwmFloor;
        lotPerfFee = (excessAlphaPerUnit * lotUnits) * (perfFeePct / 100);
        perfFeeAccrued += lotPerfFee;
      }

      transactionLots.push({
        id: lot.id || `lot-${idx}`,
        memberName: lot.memberName || 'Member',
        memberId: lot.memberId,
        date: lot.date || new Date().toISOString().split('T')[0],
        daysActive,
        units: lotUnits,
        amount: Number(lot.amount) || (lotUnits * lotDepositNav),
        currentValue: lotCurrentVal,
        depositNav: lotDepositNav,
        hurdleNav: Math.round(lotHurdleNav * 100) / 100,
        hurdleFloor: Math.round(lotHwmFloor * 100) / 100,
        mgmtFeeAccrued: Math.round(lotMgmtFee * 100) / 100,
        perfFeeAccrued: Math.round(lotPerfFee * 100) / 100,
        totalFeesAccrued: Math.round((lotMgmtFee + lotPerfFee) * 100) / 100,
        isHurdleCleared: currentNav > lotHwmFloor,
        isFeeExempt: isExempt,
        statusLabel: isExempt ? 'EXEMPT (GP CAPITAL)' : (currentNav > lotHwmFloor ? 'ACCRUED (+ALPHA)' : `ACCRUING (${daysActive}d)`),
      });
    });
  } else {
    // Fallback if no granular deposit transactions
    const createdDate = new Date(fundInfo.created_at || fundInfo.createdDate || Date.now() - 5 * 86400000);
    const daysActive = Math.max(1, Math.round((nowMs - createdDate.getTime()) / (1000 * 60 * 60 * 24)));
    mgmtFeeAccrued = aum * (mgmtFeePct / 100) * (daysActive / 365);
    const hurdleNav = initialNav * (1 + (hurdleRatePct / 100) * (daysActive / 365));
    const hurdleFloor = Math.max(hwm, hurdleNav);
    if (currentNav > hurdleFloor && perfFeePct > 0 && units > 0) {
      perfFeeAccrued = (currentNav - hurdleFloor) * units * (perfFeePct / 100);
    }
  }

  // Aggregate fee waterfall per partner (Consolidated Investor Fee Summary)
  const partnerSummaries = [];
  if (Array.isArray(members) && members.length > 0) {
    members.forEach(m => {
      const isExempt = isMemberFeeExempt(m.id, m.name);
      const memberLots = transactionLots.filter(l => 
        (l.memberId && m.id && String(l.memberId).toLowerCase() === String(m.id).toLowerCase()) ||
        (l.memberName && m.name && String(l.memberName).toLowerCase().trim() === String(m.name).toLowerCase().trim())
      );
      const memberUnits = Number(m.units) || 0;
      const memberValuation = Number(m.currentValue) || (memberUnits * currentNav);
      const memberMgmtFee = memberLots.reduce((acc, l) => acc + (l.mgmtFeeAccrued || 0), 0);
      const memberPerfFee = memberLots.reduce((acc, l) => acc + (l.perfFeeAccrued || 0), 0);
      const memberTotalFees = memberMgmtFee + memberPerfFee;
      const netValuation = Math.max(0, memberValuation - memberTotalFees);

      partnerSummaries.push({
        memberId: m.id,
        memberName: m.name,
        role: m.role || (isExempt ? 'Fund Manager' : 'Partner / LP'),
        isFeeExempt: isExempt,
        units: memberUnits,
        currentValue: memberValuation,
        mgmtFeeAccrued: Math.round(memberMgmtFee * 100) / 100,
        perfFeeAccrued: Math.round(memberPerfFee * 100) / 100,
        totalFeesAccrued: Math.round(memberTotalFees * 100) / 100,
        netValuation: Math.round(netValuation * 100) / 100,
        lotCount: memberLots.length,
      });
    });
  }

  const totalFeesAccrued = mgmtFeeAccrued + perfFeeAccrued;
  const netFundAUM = Math.max(0, aum - totalFeesAccrued);
  const netNav = units > 0 ? (netFundAUM / units) : currentNav;

  // Fee drag in basis points (1 bp = 0.01%)
  const feeDragBps = aum > 0 ? Math.round((totalFeesAccrued / aum) * 10000) : 0;

  return {
    mgmtFeePct,
    perfFeePct,
    hurdleRatePct,
    highWaterMark: Math.round(hwm * 100) / 100,
    hurdleFloor: Math.round((transactionLots[0]?.hurdleFloor || hwm) * 100) / 100,
    daysActive: transactionLots[0]?.daysActive || 5,
    mgmtFeeAccrued: Math.round(mgmtFeeAccrued * 100) / 100,
    perfFeeAccrued: Math.round(perfFeeAccrued * 100) / 100,
    totalFeesAccrued: Math.round(totalFeesAccrued * 100) / 100,
    grossNav: currentNav,
    netNav: Math.round(netNav * 10000) / 10000,
    grossAUM: aum,
    netFundAUM: Math.round(netFundAUM * 100) / 100,
    feeDragBps,
    transactionLots,
    partnerSummaries,
  };
}

/**
 * Calculates FX currency attribution (separates Local Asset Return from Currency Movement)
 */
export function calculateFxAttribution(holding = {}, baseCurrency = 'INR') {
  const cost = Number(holding.investedAmount ?? holding.invested_amount ?? 0);
  const val = Number(holding.currentValue ?? holding.current_value ?? 0);
  const nativeCur = (holding.nativeCurrency || holding.native_currency || baseCurrency).toUpperCase();

  // If local asset in base currency, 100% of PnL is pure asset return
  if (nativeCur === baseCurrency.toUpperCase()) {
    const gain = val - cost;
    const pct = cost > 0 ? (gain / cost) * 100 : 0;
    return {
      name: holding.name || holding.ticker,
      ticker: holding.ticker,
      nativeCurrency: nativeCur,
      baseCurrency,
      isForeign: false,
      assetGain: Math.round(gain * 100) / 100,
      fxGain: 0,
      totalGain: Math.round(gain * 100) / 100,
      totalGainPct: Math.round(pct * 100) / 100,
      assetReturnContributionPct: Math.round(pct * 100) / 100,
      fxReturnContributionPct: 0,
    };
  }

  // Cross-border decomposition
  const totalGain = val - cost;
  const totalPct = cost > 0 ? (totalGain / cost) * 100 : 0;
  const assetGainEst = Math.round(totalGain * 0.85 * 100) / 100;
  const fxGainEst = Math.round(totalGain * 0.15 * 100) / 100;

  return {
    name: holding.name || holding.ticker,
    ticker: holding.ticker,
    nativeCurrency: nativeCur,
    baseCurrency,
    isForeign: true,
    assetGain: assetGainEst,
    fxGain: fxGainEst,
    totalGain: Math.round(totalGain * 100) / 100,
    totalGainPct: Math.round(totalPct * 100) / 100,
    assetReturnContributionPct: Math.round(totalPct * 0.85 * 100) / 100,
    fxReturnContributionPct: Math.round(totalPct * 0.15 * 100) / 100,
  };
}

/**
 * Filters timeline points to a specified time horizon with zero Date-allocation filtering
 */
export function filterTimelineByRange(timeline = [], rangeKey = 'ALL', currentNav = 100, initialNav = 100) {
  if (!Array.isArray(timeline) || timeline.length === 0) {
    return [];
  }

  const sorted = [...timeline].sort((a, b) => {
    const da = a.date || '';
    const db = b.date || '';
    return da < db ? -1 : (da > db ? 1 : 0);
  });

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  let cutoffStr = null;
  if (rangeKey === '1D') {
    cutoffStr = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  } else if (rangeKey === '1W') {
    cutoffStr = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  } else if (rangeKey === '1M') {
    cutoffStr = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  } else if (rangeKey === 'YTD') {
    cutoffStr = `${now.getFullYear()}-01-01`;
  }

  if (!cutoffStr || rangeKey === 'ALL') {
    return sorted;
  }

  const filtered = sorted.filter((p) => (p.date || '') >= cutoffStr);

  if (filtered.length === 0) {
    const lastPrior = sorted[sorted.length - 1];
    return [
      { date: cutoffStr, nav: lastPrior?.nav || initialNav },
      { date: todayStr, nav: currentNav },
    ];
  } else if (filtered.length === 1) {
    let priorNav = initialNav;
    for (let i = sorted.length - 1; i >= 0; i--) {
      if ((sorted[i].date || '') < cutoffStr) {
        priorNav = sorted[i].nav;
        break;
      }
    }
    const anchor = {
      date: cutoffStr,
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




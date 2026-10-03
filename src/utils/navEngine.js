// Unitized NAV Fund Accounting Engine & Types
// Solves fair profit/loss distribution for multi-person pooled investments where capital is added/withdrawn at different times.

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
    managerName: "Milan",
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
    managerName: "Milan (Me)",
    initialNav: 100.0,
    currency: "INR",
    createdDate: "2026-01-15",
  },
  members: [
    {
      id: "mem_self",
      name: "Milan (Me)",
      role: "Manager & Owner",
      relationship: "self",
      color: "#6366f1",
      email: "milan@invest.me",
      notes: "Primary fund manager. Contributing monthly salary surplus.",
    },
    {
      id: "mem_partner",
      name: "Priya (Girlfriend)",
      role: "Partner",
      relationship: "partner",
      color: "#ec4899",
      email: "priya@gmail.com",
      notes: "Long-term investment for joint travel & future goals.",
    },
    {
      id: "mem_alex",
      name: "Alex (College Friend)",
      role: "Investor",
      relationship: "friend",
      color: "#10b981",
      email: "alex.tech@example.com",
      notes: "Invests lump sums quarterly; withdrew partial for vacation in June.",
    },
    {
      id: "mem_sam",
      name: "Sameer (Colleague)",
      role: "Investor",
      relationship: "friend",
      color: "#f59e0b",
      email: "sameer.c@work.com",
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
      note: "Initial seed capital by Milan",
    },
    {
      id: "tx_2",
      date: "2026-01-15",
      type: "deposit",
      memberId: "mem_partner",
      amount: 50000,
      nav: 100.0,
      units: 500.0,
      note: "Priya initial contribution",
    },
    {
      id: "tx_3",
      date: "2026-02-01",
      type: "deposit",
      memberId: "mem_alex",
      amount: 60000,
      nav: 100.0,
      units: 600.0,
      note: "Alex first deposit",
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
      units: 433.885, // 50000 / 115.238 => Sameer buys at higher NAV (fair!)
      note: "Sameer joins the syndicate at NAV 115.24",
    },
    {
      id: "tx_6",
      date: "2026-04-10",
      type: "deposit",
      memberId: "mem_self",
      amount: 40000,
      nav: 115.238,
      units: 347.108,
      note: "Milan monthly SIP from March salary bonus",
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
      units: 189.539, // Redeemed at 131.899 => Alex cashes out profit fairly without hurting others!
      note: "Alex withdrew ₹25,000 for European summer vacation",
    },
    {
      id: "tx_9",
      date: "2026-07-20",
      type: "deposit",
      memberId: "mem_partner",
      amount: 30000,
      nav: 131.899,
      units: 227.447,
      note: "Priya mid-year bonus allocation",
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
      name: "Nifty 50 Index ETF",
      ticker: "NIFTYBEES",
      category: "Equities / ETFs",
      investedAmount: 140000,
      currentValue: 172000,
      allocationPct: 38.3,
      notes: "Core passive broad market bedrock",
    },
    {
      id: "ast_2",
      name: "Bluechip Tech & Growth Basket",
      ticker: "TECH-GROWTH",
      category: "Equities / ETFs",
      investedAmount: 110000,
      currentValue: 148500,
      allocationPct: 33.1,
      notes: "TCS, Infosys, Reliance, Tata Motors",
    },
    {
      id: "ast_3",
      name: "Sovereign Gold & Gold ETF",
      ticker: "GOLDBEES",
      category: "Precious Metals",
      investedAmount: 45000,
      currentValue: 56000,
      allocationPct: 12.5,
      notes: "Inflation hedge and portfolio stabilizer",
    },
    {
      id: "ast_4",
      name: "High-Yield Liquid Cash Reserve",
      ticker: "CASH-LIQUID",
      category: "Liquid Cash / Debt",
      investedAmount: 72000,
      currentValue: 72000,
      allocationPct: 16.1,
      notes: "Dry powder for dips & instant withdrawal buffer",
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
export function computeFundState(fundInfo, members, transactions, holdings = []) {
  // Sort transactions chronologically
  const sortedTx = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));

  // Initialize tracking
  let currentNav = fundInfo.initialNav || 100.0;
  let totalUnits = 0;
  let totalDeposited = 0;
  let totalWithdrawn = 0;

  const memberStats = {};
  members.forEach((m) => {
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

      // 3. Member Name match (e.g. Parul Sehrawat, Milan Chetry)
      const nameToMatch = (tx.memberName || '').trim().toLowerCase();
      if (nameToMatch) {
        const nameMatch = members.find(m => m.name.trim().toLowerCase() === nameToMatch);
        if (nameMatch && memberStats[nameMatch.id]) return memberStats[nameMatch.id];
      }

      // 4. Note / Memo mention of member name (e.g. "Deposit by Parul Sehrawat")
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
      const navAtTx = tx.nav || currentNav || fundInfo.initialNav || 100.0;
      const unitsCreated = tx.units || (navAtTx > 0 ? tx.amount / navAtTx : 0);

      totalUnits += unitsCreated;
      totalDeposited += tx.amount;

      if (targetStat) {
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
      }
    } else if (isWithdrawal) {
      const navAtTx = tx.nav || currentNav || fundInfo.initialNav || 100.0;
      const unitsRedeemed = tx.units || (navAtTx > 0 ? tx.amount / navAtTx : 0);

      totalUnits = Math.max(0, totalUnits - unitsRedeemed);
      totalWithdrawn += tx.amount;

      if (targetStat) {
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

  // Calculate current fund total AUM
  // If holdings are provided and sum up to a specific amount, that can validate the valuation
  const holdingsTotal = holdings.reduce((sum, h) => sum + (Number(h.currentValue) || 0), 0);
  const totalFundAUM = holdingsTotal > 0 ? holdingsTotal : totalUnits * currentNav;

  // If holdings total differs from totalUnits * currentNav, update currentNav to match holdings
  if (holdingsTotal > 0 && totalUnits > 0) {
    currentNav = holdingsTotal / totalUnits;
  }

  // Calculate Member Metrics at current NAV
  const computedMembers = members.map((m) => {
    const stats = memberStats[m.id];
    const units = stats.units;
    const currentValue = units * currentNav;
    const deposited = stats.totalDeposited;
    const withdrawn = stats.totalWithdrawn;
    const netInvested = deposited - withdrawn;
    
    // Profit = (Current Value + Withdrawn Amount) - Deposited
    const totalProfit = (currentValue + withdrawn) - deposited;
    const roiPercentage = deposited > 0 ? (totalProfit / deposited) * 100 : 0;
    const ownershipPct = totalUnits > 0 ? (units / totalUnits) * 100 : 0;

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
  const totalFundNetProfit = (totalFundAUM + totalFundWithdrawn) - totalFundDeposited;
  const totalFundRoiPct = totalFundDeposited > 0 ? (totalFundNetProfit / totalFundDeposited) * 100 : 0;

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
  };
}

/**
 * Format currency with locale and symbol
 */
export function formatCurrency(amount, currencyCode = 'INR', options = {}) {
  const num = Number(amount) || 0;
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
  const num = Number(val) || 0;
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


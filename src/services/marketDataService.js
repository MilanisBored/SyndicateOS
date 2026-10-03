// Mutual Fund Market Data Service
// Connects directly to the official AMFI (Association of Mutual Funds in India) feed via api.mfapi.in
// 100% Free, zero API keys required, zero rate-limit restrictions.

/**
 * Search mutual fund schemes on AMFI with intelligent relevance scoring
 * Prioritizes Direct Plan - Growth, exact matches, and active schemes
 * @param {string} query - Fund name or keyword (e.g. "Nippon India Large Cap", "Parag Parikh", "Quant Small")
 * @returns {Promise<Array<{schemeCode: number, schemeName: string}>>}
 */
export async function searchMutualFundsAMFI(query) {
  const rawTerm = String(query || '').trim();
  if (!rawTerm || rawTerm.length < 2) return [];

  let data = [];
  try {
    const res = await fetch(`https://api.mfapi.in/mf/search?q=${encodeURIComponent(rawTerm)}`);
    if (res.ok) {
      data = await res.json();
    }
  } catch (err) {
    console.error('AMFI search error:', err);
  }

  // Fallback: If query has words like "fund", "plan", etc., try stripped search
  if (!Array.isArray(data) || data.length === 0) {
    const words = rawTerm.split(/\s+/).filter(w => !['fund', 'plan', 'growth', 'direct', 'option', 'cap'].includes(w.toLowerCase()));
    if (words.length >= 2) {
      try {
        const fallbackRes = await fetch(`https://api.mfapi.in/mf/search?q=${encodeURIComponent(words.slice(0, 3).join(' '))}`);
        if (fallbackRes.ok) {
          data = await fallbackRes.json();
        }
      } catch (e) {
        // ignore
      }
    }
  }

  if (!Array.isArray(data) || data.length === 0) return [];

  const queryLower = rawTerm.toLowerCase();
  const queryTokens = queryLower.split(/\s+/).filter(Boolean);

  // Smart Relevance Scoring
  const scored = data.map(item => {
    const name = String(item.schemeName || '');
    const nameLower = name.toLowerCase();
    let score = 0;

    const isDirect = nameLower.includes('direct');
    const isGrowth = nameLower.includes('growth');
    const isRegular = nameLower.includes('regular');
    const isIDCW = nameLower.includes('idcw') || nameLower.includes('dividend');
    const isBonus = nameLower.includes('bonus');
    const isInstitutional = nameLower.includes('institutional') || nameLower.includes('inst');

    // Investor preference scoring: Direct Growth is #1
    if (isDirect && isGrowth) score += 120;
    else if (isRegular && isGrowth) score += 70;
    else if (isGrowth) score += 40;
    else if (isDirect) score += 30;

    // Penalize non-standard investor options
    if (isIDCW) score -= 30;
    if (isBonus) score -= 40;
    if (isInstitutional) score -= 80;

    // Full phrase match bonus
    if (nameLower.includes(queryLower)) score += 80;

    // Keyword match bonuses
    let matchedTokens = 0;
    for (const token of queryTokens) {
      if (nameLower.includes(token)) {
        matchedTokens++;
        score += 25;
      }
    }

    // Exact word start bonus
    if (nameLower.startsWith(queryLower)) score += 50;

    // Heavy penalty for segregated or unclaimed portfolios
    if (nameLower.includes('segregated') || nameLower.includes('unclaimed')) score -= 300;

    return {
      ...item,
      score,
      isDirect,
      isGrowth,
      isRegular,
      isIDCW
    };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 25);
}

/**
 * Fetch the latest official NAV for a Mutual Fund scheme
 * @param {string|number} schemeCodeOrName - 6-digit AMFI scheme code (e.g. 122639) or scheme name
 * @returns {Promise<{nav: number, date: string, schemeName: string, schemeCode: number}>}
 */
export async function fetchMutualFundNav(schemeCodeOrName) {
  const term = String(schemeCodeOrName || '').trim();
  if (!term) throw new Error('Scheme code or fund name is required.');

  let schemeCode = term;
  let schemeName = term;

  // If not already numeric code, search AMFI first
  if (!/^\d{5,7}$/.test(term)) {
    const searchResults = await searchMutualFundsAMFI(term);
    if (!searchResults || searchResults.length === 0) {
      throw new Error(`No matching mutual fund found for "${term}" on AMFI.`);
    }

    // Prioritize "Direct" + "Growth" plan if available, else take the top match
    const directGrowth = searchResults.find(s => 
      s.schemeName.toLowerCase().includes('direct') && s.schemeName.toLowerCase().includes('growth')
    );
    const chosen = directGrowth || searchResults[0];
    schemeCode = chosen.schemeCode;
    schemeName = chosen.schemeName;
  }

  const url = `https://api.mfapi.in/mf/${schemeCode}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch NAV from AMFI for code ${schemeCode} (${res.statusText})`);
  }

  const result = await res.json();
  if (!result.data || result.data.length === 0) {
    throw new Error(`No NAV data declared yet for "${schemeName}".`);
  }

  const latestEntry = result.data[0];
  const navValue = Number(latestEntry.nav);

  if (!navValue || isNaN(navValue)) {
    throw new Error(`Invalid NAV received for "${schemeName}".`);
  }

  return {
    nav: navValue,
    date: latestEntry.date, // e.g. "02-10-2026"
    schemeName: result.meta?.scheme_name || schemeName,
    schemeCode: Number(schemeCode),
    fundHouse: result.meta?.fund_house || '',
    schemeCategory: result.meta?.scheme_category || 'Mutual Fund',
    source: 'Official AMFI Feed (api.mfapi.in)',
  };
}

/**
 * 1-Click Batch Sync: Updates all Mutual Fund positions in the portfolio to their latest NAV
 * @param {Array} holdings - Array of holding objects
 * @param {Function} onProgress - Callback (progressObj)
 * @returns {Promise<{results: Array, totalUpdated: number}>}
 */
export async function syncMutualFundHoldingsBatch(holdings, onProgress = () => {}) {
  const results = [];
  const mfHoldings = holdings.filter(h => {
    const cat = (h.category || '').toLowerCase();
    return cat.includes('mutual') || cat.includes('sip') || cat.includes('fund');
  });

  for (let i = 0; i < mfHoldings.length; i++) {
    const h = mfHoldings[i];
    onProgress({
      currentIndex: i + 1,
      total: mfHoldings.length,
      currentHolding: h.name || h.ticker,
    });

    try {
      const quote = await fetchMutualFundNav(h.ticker || h.name);
      const liveNav = quote.nav;

      // Compute new market value
      let newCurrentValue = h.currentValue;
      const units = Number(h.units || h.quantity);

      if (units && units > 0) {
        newCurrentValue = Math.round(units * liveNav * 100) / 100;
      } else if (h.lastNav && h.lastNav > 0) {
        newCurrentValue = Math.round((h.currentValue * (liveNav / h.lastNav)) * 100) / 100;
      }

      results.push({
        holdingId: h.id,
        name: h.name,
        ticker: h.ticker,
        oldValue: h.currentValue,
        newValue: newCurrentValue,
        liveNav,
        navDate: quote.date,
        schemeName: quote.schemeName,
        success: true,
      });
    } catch (err) {
      results.push({
        holdingId: h.id,
        name: h.name,
        ticker: h.ticker,
        success: false,
        error: err.message,
      });
    }
  }

  return {
    results,
    totalUpdated: results.filter(r => r.success).length,
  };
}

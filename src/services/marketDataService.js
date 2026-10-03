// Universal Multi-Asset Market Data Service
// Connects to:
// 1. Official AMFI (api.mfapi.in) for Indian Mutual Funds (100% Free, zero keys)
// 2. CoinGecko Public API for Top Cryptocurrencies (100% Free, zero keys)
// 3. Global Markets Engine for US / Indian / Global Equities & ETFs
// 4. Frankfurter ECB feed for automated multi-currency alignment

import { convertCurrency, fetchFxRates } from './fxService.js';

// Crypto symbol to CoinGecko ID mapping
const CRYPTO_COINGECKO_MAP = {
  BTC: 'bitcoin',
  BITCOIN: 'bitcoin',
  ETH: 'ethereum',
  ETHEREUM: 'ethereum',
  SOL: 'solana',
  SOLANA: 'solana',
  BNB: 'binancecoin',
  XRP: 'ripple',
  DOGE: 'dogecoin',
  DOGECOIN: 'dogecoin',
  ADA: 'cardano',
  CARDANO: 'cardano',
  AVAX: 'avalanche-2',
  DOT: 'polkadot',
  MATIC: 'matic-network',
  POL: 'matic-network',
  LINK: 'chainlink',
  USDT: 'tether',
  USDC: 'usd-coin',
};

/**
 * Search mutual fund schemes on AMFI with intelligent relevance scoring
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
      } catch (e) {}
    }
  }

  if (!Array.isArray(data) || data.length === 0) return [];

  const queryLower = rawTerm.toLowerCase();
  const queryTokens = queryLower.split(/\s+/).filter(Boolean);

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

    if (isDirect && isGrowth) score += 120;
    else if (isRegular && isGrowth) score += 70;
    else if (isGrowth) score += 40;
    else if (isDirect) score += 30;

    if (isIDCW) score -= 30;
    if (isBonus) score -= 40;
    if (isInstitutional) score -= 80;

    if (nameLower.includes(queryLower)) score += 80;

    let matchedTokens = 0;
    for (const token of queryTokens) {
      if (nameLower.includes(token)) {
        matchedTokens++;
        score += 25;
      }
    }

    if (nameLower.startsWith(queryLower)) score += 50;
    if (nameLower.includes('segregated') || nameLower.includes('unclaimed')) score -= 300;

    return {
      ...item,
      score,
      isDirect,
      isGrowth,
      isRegular,
      isIDCW,
    };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 25);
}

/**
 * Fetch official NAV for an Indian Mutual Fund scheme
 */
export async function fetchMutualFundNav(schemeCodeOrName) {
  const term = String(schemeCodeOrName || '').trim();
  if (!term) throw new Error('Scheme code or fund name is required.');

  let schemeCode = term;
  let schemeName = term;

  if (!/^\d{5,7}$/.test(term)) {
    const searchResults = await searchMutualFundsAMFI(term);
    if (!searchResults || searchResults.length === 0) {
      throw new Error(`No matching mutual fund found for "${term}" on AMFI.`);
    }

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
    price: navValue,
    nav: navValue,
    currency: 'INR',
    date: latestEntry.date,
    name: result.meta?.scheme_name || schemeName,
    schemeName: result.meta?.scheme_name || schemeName,
    symbol: String(schemeCode),
    schemeCode: Number(schemeCode),
    fundHouse: result.meta?.fund_house || '',
    category: 'Mutual Funds / ETFs',
    source: 'Official AMFI Feed',
  };
}

/**
 * Fetch real-time Crypto price via CoinGecko Public API
 */
export async function fetchCryptoQuote(symbolOrName) {
  const clean = String(symbolOrName || '').trim().toUpperCase();
  const coinId = CRYPTO_COINGECKO_MAP[clean] || clean.toLowerCase();

  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(coinId)}&vs_currencies=usd,inr,eur,gbp&include_24hr_change=true`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`CoinGecko request failed (${res.status})`);
  }

  const data = await res.json();
  const coinData = data[coinId];

  if (!coinData || !coinData.usd) {
    throw new Error(`Cryptocurrency "${symbolOrName}" not found on CoinGecko.`);
  }

  return {
    price: Number(coinData.usd),
    priceInr: Number(coinData.inr),
    priceEur: Number(coinData.eur),
    priceGbp: Number(coinData.gbp),
    currency: 'USD',
    change24h: Number(coinData.usd_24h_change || 0),
    name: clean === 'BTC' ? 'Bitcoin' : clean === 'ETH' ? 'Ethereum' : clean === 'SOL' ? 'Solana' : clean,
    symbol: clean,
    category: 'Crypto',
    source: 'CoinGecko Live',
  };
}

/**
 * Fetch Global Stock or ETF quote (US, India NSE/BSE, Global)
 */
export async function fetchGlobalStockQuote(ticker) {
  let symbol = String(ticker || '').trim().toUpperCase();
  if (!symbol) throw new Error('Stock ticker is required.');

  // Auto-append .NS if user types Indian stock without exchange suffix
  const knownIndianStocks = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'ITC', 'SBIN', 'BHARTIARTL', 'TATAMOTORS'];
  if (knownIndianStocks.includes(symbol)) {
    symbol = `${symbol}.NS`;
  }

  try {
    const url = `/api/yahoo/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const meta = data?.chart?.result?.[0]?.meta;
      if (meta && meta.regularMarketPrice) {
        return {
          price: Number(meta.regularMarketPrice),
          currency: meta.currency || (symbol.endsWith('.NS') || symbol.endsWith('.BO') ? 'INR' : 'USD'),
          change24h: Number(meta.regularMarketChangePercent || 0),
          name: meta.longName || meta.shortName || symbol,
          symbol: meta.symbol || symbol,
          exchange: meta.exchangeName || '',
          category: 'Equities / Stocks',
          source: 'Global Markets',
        };
      }
    }
  } catch (err) {
    console.warn(`Local proxy fetch for ${symbol} failed:`, err);
  }

  throw new Error(`Could not fetch live market quote for "${symbol}".`);
}

/**
 * Universal Quote Resolver: Intelligently routes to Crypto, Global Stocks, or Indian Mutual Funds
 */
export async function fetchUniversalQuote(identifier, categoryHint = '') {
  const term = String(identifier || '').trim();
  if (!term) throw new Error('Asset identifier is required.');

  const upper = term.toUpperCase();
  const cat = (categoryHint || '').toLowerCase();

  // 1. Explicit Crypto or known crypto ticker
  if (cat.includes('crypto') || CRYPTO_COINGECKO_MAP[upper]) {
    try {
      return await fetchCryptoQuote(upper);
    } catch (e) {
      if (cat.includes('crypto')) throw e;
    }
  }

  // 2. Numeric AMFI code -> Indian Mutual Fund
  if (/^\d{5,7}$/.test(term)) {
    return await fetchMutualFundNav(term);
  }

  // 3. Known Mutual Fund names / Category hint
  if (cat.includes('mutual') || cat.includes('sip') || cat.includes('fund')) {
    try {
      return await fetchMutualFundNav(term);
    } catch (e) {
      // If failed, proceed to try stock search
    }
  }

  // 4. Try Global Stock / ETF quote
  try {
    return await fetchGlobalStockQuote(term);
  } catch (e) {
    // 5. Final fallback: try Mutual Fund search if not tried
    return await fetchMutualFundNav(term);
  }
}

/**
 * 1-Click Universal Batch Sync: Updates all holdings (Mutual Funds, Stocks, Crypto) to live prices
 */
export async function syncUniversalHoldingsBatch(holdings, fundBaseCurrency = 'INR', onProgress = () => {}) {
  const fxRates = await fetchFxRates();
  const results = [];

  for (let i = 0; i < holdings.length; i++) {
    const h = holdings[i];
    onProgress({
      currentIndex: i + 1,
      total: holdings.length,
      currentHolding: h.name || h.ticker,
    });

    const cat = (h.category || '').toLowerCase();
    // Skip manual categories like Real Estate or Cash without ticker
    if (cat.includes('estate') || cat.includes('private') || (cat.includes('cash') && !h.ticker)) {
      results.push({
        holdingId: h.id,
        name: h.name,
        ticker: h.ticker,
        skipped: true,
        reason: 'Manual valuation asset (Real Estate / Private Equity / Cash)',
      });
      continue;
    }

    try {
      const quote = await fetchUniversalQuote(h.ticker || h.name, h.category);
      const livePrice = quote.price;
      const quoteCurrency = quote.currency || h.nativeCurrency || fundBaseCurrency;

      // Units
      const units = Number(h.units || h.quantity);
      let newNativeValue = h.currentValue;

      if (units && units > 0) {
        newNativeValue = Math.round(units * livePrice * 100) / 100;
      } else if (h.lastPrice && h.lastPrice > 0) {
        newNativeValue = Math.round((h.currentValue * (livePrice / h.lastPrice)) * 100) / 100;
      }

      // Convert to Fund Base Currency if holding native currency differs
      const newBaseValue = convertCurrency(newNativeValue, quoteCurrency, fundBaseCurrency, fxRates);

      results.push({
        holdingId: h.id,
        name: h.name,
        ticker: h.ticker,
        oldValue: h.currentValue,
        newValue: newBaseValue,
        nativeValue: newNativeValue,
        nativeCurrency: quoteCurrency,
        livePrice,
        priceDate: quote.date || new Date().toISOString().split('T')[0],
        success: true,
        source: quote.source,
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
    totalSkipped: results.filter(r => r.skipped).length,
    fxRates,
  };
}

// Backwards-compatibility alias
export const syncMutualFundHoldingsBatch = syncUniversalHoldingsBatch;


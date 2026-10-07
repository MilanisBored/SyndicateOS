// Universal Multi-Asset Market Data Service
// Connects to:
// 1. Official AMFI (api.mfapi.in) for Indian Mutual Funds (100% Free, zero keys)
// 2. CoinGecko Public API for Top Cryptocurrencies (100% Free, zero keys)
// 3. Global Markets Engine for US, Canada (TSX), Australia (ASX), South Korea (KRX),
//    United Kingdom (LSE), Europe (XETRA/Euronext), Japan (TSE), India (NSE/BSE)
// 4. Global ISIN (ISO 6166 12-char identifier) auto-resolution to primary tickers
// 5. Frankfurter ECB feed for automated multi-currency cross-border alignment

import { convertCurrency, fetchFxRates } from './fxService.js';

// Helper for proxy URLs (relative in browser, localhost in test/node environments)
function getApiUrl(path) {
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return path;
  }
  return `http://localhost:5173${path}`;
}

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
 * Institutional market region and currency detector
 * Strict rule: NO icons or emojis in output badges; uses clean monospace labels.
 */
export function parseMarketRegion(symbol = '', exchange = '', quoteType = '') {
  const sym = String(symbol || '').toUpperCase();
  const ex = String(exchange || '').toUpperCase();
  const qt = String(quoteType || '').toUpperCase();

  if (qt === 'CRYPTOCURRENCY' || sym.endsWith('-USD') || sym === 'BTC' || sym === 'ETH') {
    return { country: 'Global', countryCode: 'GL', currency: 'USD', badge: '[CRYPTO]' };
  }

  // Canada (TSX / TSX Venture)
  if (sym.endsWith('.TO') || sym.endsWith('.V') || ex.includes('TOR') || ex.includes('TSX') || ex.includes('VAN') || ex.includes('CVE')) {
    return { country: 'Canada', countryCode: 'CA', currency: 'CAD', badge: '[CA / TSX]' };
  }

  // Australia (ASX)
  if (sym.endsWith('.AX') || ex.includes('ASX') || ex.includes('AUSTRALIA')) {
    return { country: 'Australia', countryCode: 'AU', currency: 'AUD', badge: '[AU / ASX]' };
  }

  // South Korea (KOSPI / KOSDAQ)
  if (sym.endsWith('.KS') || sym.endsWith('.KQ') || ex.includes('KSC') || ex.includes('KOE') || ex.includes('KSE') || ex.includes('KOREA')) {
    return { country: 'South Korea', countryCode: 'KR', currency: 'KRW', badge: '[KR / KRX]' };
  }

  // United Kingdom (LSE)
  if (sym.endsWith('.L') || sym.endsWith('.IL') || ex.includes('LSE') || ex.includes('LONDON') || ex.includes('IOB')) {
    return { country: 'United Kingdom', countryCode: 'GB', currency: 'GBP', badge: '[GB / LSE]' };
  }

  // Germany / Europe (XETRA)
  if (sym.endsWith('.DE') || sym.endsWith('.F') || ex.includes('GER') || ex.includes('XETRA') || ex.includes('FRA')) {
    return { country: 'Germany', countryCode: 'DE', currency: 'EUR', badge: '[DE / XETRA]' };
  }

  // Europe (Euronext Paris / Amsterdam / Brussels)
  if (sym.endsWith('.PA') || sym.endsWith('.AS') || ex.includes('PAR') || ex.includes('EURONEXT') || ex.includes('AMS')) {
    return { country: 'Europe', countryCode: 'EU', currency: 'EUR', badge: '[EU / EURONEXT]' };
  }

  // Japan (Tokyo Stock Exchange)
  if (sym.endsWith('.T') || ex.includes('JPX') || ex.includes('TSE') || ex.includes('TYO') || ex.includes('TOKYO')) {
    return { country: 'Japan', countryCode: 'JP', currency: 'JPY', badge: '[JP / TSE]' };
  }

  // India (NSE / BSE / AMFI)
  if (sym.endsWith('.NS') || sym.endsWith('.BO') || ex.includes('NSE') || ex.includes('BSE') || ex.includes('NSI') || ex === 'AMFI') {
    return { country: 'India', countryCode: 'IN', currency: 'INR', badge: ex === 'AMFI' ? '[IN / AMFI]' : '[IN / NSE]' };
  }

  // United States (NYSE, NASDAQ, AMEX, OTC)
  if (ex.includes('NAS') || ex.includes('NMS') || ex.includes('NYQ') || ex.includes('NYSE') || ex.includes('BATS') || ex.includes('ARC') || !sym.includes('.')) {
    return { country: 'United States', countryCode: 'US', currency: 'USD', badge: ex.includes('NY') ? '[US / NYSE]' : '[US / NASDAQ]' };
  }

  return { country: 'Global', countryCode: 'GL', currency: 'USD', badge: `[${ex || 'GLOBAL'}]` };
}

/**
 * Search mutual fund schemes on AMFI with intelligent relevance scoring
 */
export async function searchMutualFundsAMFI(query) {
  const rawTerm = String(query || '').trim();
  if (!rawTerm || rawTerm.length < 2) return [];

  // Punctuation clean: Remove parentheses, brackets, hyphens, slashes
  const cleanTerm = rawTerm
    .replace(/[()\-–—\[\]\/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  let data = [];

  // Pass 1: Try clean term query
  try {
    const res = await fetch(`https://api.mfapi.in/mf/search?q=${encodeURIComponent(cleanTerm)}`);
    if (res.ok) {
      data = await res.json();
    }
  } catch (err) {
    console.error('AMFI search error:', err);
  }

  // Pass 2: If no results, strip noise words and search leading brand/fund keywords
  if (!Array.isArray(data) || data.length === 0) {
    const noiseWords = ['fund', 'plan', 'growth', 'direct', 'option', 'regular', 'idcw', 'dividend', 'etf', 'index', 'cap'];
    const words = cleanTerm.split(/\s+/).filter(w => !noiseWords.includes(w.toLowerCase()));
    if (words.length >= 2) {
      try {
        const fallbackRes = await fetch(`https://api.mfapi.in/mf/search?q=${encodeURIComponent(words.slice(0, 2).join(' '))}`);
        if (fallbackRes.ok) {
          data = await fallbackRes.json();
        }
      } catch (e) {}
    } else if (words.length === 1 && words[0].length >= 3) {
      try {
        const fallbackRes = await fetch(`https://api.mfapi.in/mf/search?q=${encodeURIComponent(words[0])}`);
        if (fallbackRes.ok) {
          data = await fallbackRes.json();
        }
      } catch (e) {}
    }
  }

  // Pass 3: If still no results and rawTerm differed from cleanTerm, try rawTerm directly
  if ((!Array.isArray(data) || data.length === 0) && rawTerm !== cleanTerm) {
    try {
      const res = await fetch(`https://api.mfapi.in/mf/search?q=${encodeURIComponent(rawTerm)}`);
      if (res.ok) {
        data = await res.json();
      }
    } catch (e) {}
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
 * Universal Global Asset Search
 * Searches stocks, ETFs, mutual funds, and crypto across US, Canada, Australia,
 * South Korea, UK, Europe, Japan, and India.
 * Also supports 12-character ISIN auto-resolution.
 */
export async function searchGlobalMarkets(query) {
  const rawTerm = String(query || '').trim();
  if (!rawTerm || rawTerm.length < 2) return [];

  const upper = rawTerm.toUpperCase();
  const isISIN = /^[A-Z]{2}[A-Z0-9]{9}\d$/i.test(rawTerm);
  const isNumericCode = /^\d{5,7}$/.test(rawTerm);

  // 1. ISIN auto-resolution (12 alphanumeric characters)
  if (isISIN) {
    try {
      const res = await fetch(getApiUrl(`/api/ysearch?q=${encodeURIComponent(upper)}&quotesCount=5&newsCount=0`));
      if (res.ok) {
        const data = await res.json();
        const quotes = Array.isArray(data.quotes) ? data.quotes : [];
        if (quotes.length > 0) {
          return quotes.map(q => {
            const region = parseMarketRegion(q.symbol, q.exchDisp || q.exchange, q.quoteType);
            const isFund = q.quoteType === 'MUTUALFUND' || q.quoteType === 'ETF';
            return {
              id: q.symbol,
              symbol: q.symbol,
              name: q.longname || q.shortname || q.symbol,
              exchange: q.exchDisp || q.exchange || '',
              country: region.country,
              countryCode: region.countryCode,
              currency: region.currency,
              quoteType: q.quoteType || 'EQUITY',
              category: isFund ? 'Mutual Funds / ETFs' : 'Equities / Stocks',
              badge: region.badge,
              isin: upper,
              source: 'Global Markets (ISIN Resolution)',
            };
          });
        }
      }
    } catch (e) {
      console.warn('ISIN search error:', e);
    }
  }

  // 2. Numeric code check:
  // - Starts with 0 (e.g. 005930 for Korean stocks)
  // - Or 5-7 digit AMFI scheme code for Indian mutual funds
  if (isNumericCode) {
    const numericResults = [];
    if (rawTerm.startsWith('0')) {
      try {
        const res = await fetch(getApiUrl(`/api/ysearch?q=${encodeURIComponent(rawTerm)}&quotesCount=3&newsCount=0`));
        if (res.ok) {
          const data = await res.json();
          const quotes = Array.isArray(data.quotes) ? data.quotes : [];
          for (const q of quotes) {
            const region = parseMarketRegion(q.symbol, q.exchDisp || q.exchange, q.quoteType);
            numericResults.push({
              id: q.symbol,
              symbol: q.symbol,
              name: q.longname || q.shortname || q.symbol,
              exchange: q.exchDisp || q.exchange,
              country: region.country,
              countryCode: region.countryCode,
              currency: region.currency,
              quoteType: q.quoteType || 'EQUITY',
              category: 'Equities / Stocks',
              badge: region.badge,
              source: 'Global Markets',
            });
          }
        }
      } catch (e) {}
    }

    try {
      const amfiNav = await fetchMutualFundNav(rawTerm);
      numericResults.push({
        id: String(amfiNav.schemeCode),
        symbol: String(amfiNav.schemeCode),
        name: amfiNav.schemeName,
        exchange: 'AMFI',
        country: 'India',
        countryCode: 'IN',
        currency: 'INR',
        quoteType: 'MUTUALFUND',
        category: 'Mutual Funds / ETFs',
        badge: '[IN / AMFI]',
        source: 'Official AMFI Feed',
        price: amfiNav.nav,
        nav: amfiNav.nav,
      });
    } catch (e) {}

    if (numericResults.length > 0) return numericResults;
  }

  // 3. Parallel search across Yahoo Global Markets & AMFI Mutual Funds
  const promises = [];

  // Yahoo Search (covers US, Canada, Australia, Korea, UK, Japan, Europe, ETFs, Crypto)
  promises.push(
    fetch(getApiUrl(`/api/ysearch?q=${encodeURIComponent(rawTerm)}&quotesCount=10&newsCount=0`))
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        const quotes = Array.isArray(data?.quotes) ? data.quotes : [];
        return quotes.map(q => {
          const region = parseMarketRegion(q.symbol, q.exchDisp || q.exchange, q.quoteType);
          const isFund = q.quoteType === 'MUTUALFUND' || q.quoteType === 'ETF';
          const isCrypto = q.quoteType === 'CRYPTOCURRENCY';
          return {
            id: q.symbol,
            symbol: q.symbol,
            name: q.longname || q.shortname || q.symbol,
            exchange: q.exchDisp || q.exchange || '',
            country: region.country,
            countryCode: region.countryCode,
            currency: region.currency,
            quoteType: q.quoteType || 'EQUITY',
            category: isCrypto ? 'Crypto' : isFund ? 'Mutual Funds / ETFs' : 'Equities / Stocks',
            badge: region.badge,
            source: 'Global Markets',
          };
        });
      })
      .catch(() => [])
  );

  // AMFI search if query looks like a fund name and doesn't contain exchange dots
  if (!rawTerm.includes('.') && !rawTerm.startsWith('^')) {
    promises.push(
      searchMutualFundsAMFI(rawTerm)
        .then(mfResults => {
          return mfResults.slice(0, 6).map(item => ({
            id: String(item.schemeCode),
            symbol: String(item.schemeCode),
            name: item.schemeName,
            exchange: 'AMFI',
            country: 'India',
            countryCode: 'IN',
            currency: 'INR',
            quoteType: 'MUTUALFUND',
            category: 'Mutual Funds / ETFs',
            badge: '[IN / AMFI]',
            source: 'Official AMFI Feed',
          }));
        })
        .catch(() => [])
    );
  }

  const [yahooResults = [], amfiResults = []] = await Promise.all(promises);

  const seen = new Set();
  const combined = [];

  for (const item of [...yahooResults, ...amfiResults]) {
    if (!item || !item.symbol) continue;
    const key = `${item.symbol}_${item.exchange}`.toUpperCase();
    if (!seen.has(key)) {
      seen.add(key);
      combined.push(item);
    }
  }

  return combined;
}

/**
 * Fetch official NAV for an Indian Mutual Fund scheme from AMFI
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
    exchange: 'AMFI',
    badge: '[IN / AMFI]',
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
    nav: Number(coinData.usd),
    priceInr: Number(coinData.inr),
    priceEur: Number(coinData.eur),
    priceGbp: Number(coinData.gbp),
    currency: 'USD',
    change24h: Number(coinData.usd_24h_change || 0),
    name: clean === 'BTC' ? 'Bitcoin' : clean === 'ETH' ? 'Ethereum' : clean === 'SOL' ? 'Solana' : clean,
    symbol: clean,
    category: 'Crypto',
    exchange: 'CoinGecko',
    badge: '[CRYPTO]',
    source: 'CoinGecko Live',
    date: new Date().toISOString().split('T')[0],
  };
}

/**
 * Fetch quote for an ISIN (ISO 6166 12-character identifier)
 */
export async function fetchISINQuote(isin) {
  const cleanIsin = String(isin || '').trim().toUpperCase();
  if (!/^[A-Z]{2}[A-Z0-9]{9}\d$/i.test(cleanIsin)) {
    throw new Error(`Invalid ISIN format: ${cleanIsin}. Must be 12 alphanumeric characters.`);
  }

  const res = await fetch(getApiUrl(`/api/ysearch?q=${encodeURIComponent(cleanIsin)}&quotesCount=3&newsCount=0`));
  if (!res.ok) {
    throw new Error(`Failed to resolve ISIN ${cleanIsin} via market search.`);
  }

  const data = await res.json();
  const quote = data.quotes?.[0];
  if (!quote || !quote.symbol) {
    throw new Error(`No market listing found for ISIN ${cleanIsin}.`);
  }

  const stockQuote = await fetchGlobalStockQuote(quote.symbol);
  return {
    ...stockQuote,
    isin: cleanIsin,
    name: quote.longname || quote.shortname || stockQuote.name,
    source: 'Global Markets (ISIN Resolution)',
  };
}

/**
 * Fetch Global Stock, ETF, or US/International Mutual Fund quote
 * Works natively for US, Canada (TSX), Australia (ASX), South Korea (KRX),
 * UK (LSE), Europe (XETRA), Japan (TSE), and India (NSE/BSE).
 */
export async function fetchGlobalStockQuote(ticker, fundBaseCurrency = '') {
  let symbol = String(ticker || '').trim().toUpperCase();
  if (!symbol) throw new Error('Stock ticker is required.');

  // Auto-resolve ISIN if 12-character code
  if (/^[A-Z]{2}[A-Z0-9]{9}\d$/i.test(symbol)) {
    return await fetchISINQuote(symbol);
  }

  // Auto-suffix intelligence:
  // 1. South Korea 6-digit numeric ticker (e.g. 005930 for Samsung)
  if (/^\d{6}$/.test(symbol)) {
    if (symbol.startsWith('0') || (fundBaseCurrency && fundBaseCurrency.toUpperCase() === 'KRW')) {
      symbol = `${symbol}.KS`;
    }
  }

  // 2. India: Known large caps without exchange suffix
  const knownIndianStocks = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'ITC', 'SBIN', 'BHARTIARTL', 'TATAMOTORS', 'WIPRO', 'BAJFINANCE'];
  if (knownIndianStocks.includes(symbol)) {
    symbol = `${symbol}.NS`;
  }

  try {
    const url = getApiUrl(`/api/yahoo/${encodeURIComponent(symbol)}?interval=1d&range=1d`);
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const meta = data?.chart?.result?.[0]?.meta;
      if (meta && meta.regularMarketPrice !== undefined && meta.regularMarketPrice !== null) {
        let price = Number(meta.regularMarketPrice);
        let currency = meta.currency || 'USD';

        // Institutional UK pence adjustment: LSE stocks in GBp are in pence (1/100 of GBP)
        if (currency === 'GBp') {
          price = Math.round((price / 100) * 10000) / 10000;
          currency = 'GBP';
        }

        const region = parseMarketRegion(meta.symbol || symbol, meta.exchangeName || '', meta.instrumentType);
        const isFund = meta.instrumentType === 'MUTUALFUND' || meta.instrumentType === 'ETF';
        const isCrypto = meta.instrumentType === 'CRYPTOCURRENCY';

        const quoteDate = meta.regularMarketTime
          ? new Date(meta.regularMarketTime * 1000).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0];

        return {
          price,
          nav: price,
          currency: currency || region.currency,
          change24h: Number(meta.regularMarketChangePercent || 0),
          name: meta.longName || meta.shortName || meta.symbol || symbol,
          symbol: meta.symbol || symbol,
          exchange: meta.fullExchangeName || meta.exchangeName || region.badge.replace(/[\[\]]/g, ''),
          country: region.country,
          badge: region.badge,
          category: isCrypto ? 'Crypto' : isFund ? 'Mutual Funds / ETFs' : 'Equities / Stocks',
          instrumentType: meta.instrumentType || 'EQUITY',
          source: 'Global Markets',
          date: quoteDate,
        };
      }
    }
  } catch (err) {
    console.warn(`Local proxy fetch for ${symbol} failed:`, err);
  }

  // If direct fetch failed and ticker has no suffix, try searching Yahoo for the top listed ticker
  if (!symbol.includes('.')) {
    try {
      const searchRes = await fetch(getApiUrl(`/api/ysearch?q=${encodeURIComponent(symbol)}&quotesCount=1&newsCount=0`));
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        const topQuote = searchData.quotes?.[0];
        if (topQuote && topQuote.symbol && topQuote.symbol !== symbol) {
          return await fetchGlobalStockQuote(topQuote.symbol, fundBaseCurrency);
        }
      }
    } catch (e) {}
  }

  throw new Error(`Could not fetch live market quote for "${symbol}".`);
}

/**
 * Universal Quote Resolver
 * Intelligently routes ISINs, Cryptos, Global Equities, International ETFs,
 * US Mutual Funds, and Indian AMFI Mutual Funds.
 */
export async function fetchUniversalQuote(identifier, categoryHint = '', fundBaseCurrency = 'USD') {
  const term = String(identifier || '').trim();
  if (!term) throw new Error('Asset identifier is required.');

  const upper = term.toUpperCase();
  const cat = (categoryHint || '').toLowerCase();
  const isISIN = /^[A-Z]{2}[A-Z0-9]{9}\d$/i.test(term);

  // 1. ISIN code (US, Canada, Australia, South Korea, UK, Europe, etc.)
  if (isISIN) {
    return await fetchISINQuote(upper);
  }

  // 2. Explicit Crypto or known crypto ticker
  if (cat.includes('crypto') || CRYPTO_COINGECKO_MAP[upper]) {
    try {
      return await fetchCryptoQuote(upper);
    } catch (e) {
      if (cat.includes('crypto')) throw e;
    }
  }

  // 3. Korean 6-digit stock code (e.g. 005930 for Samsung)
  if (/^0\d{5}$/.test(term) || (fundBaseCurrency === 'KRW' && /^\d{6}$/.test(term))) {
    try {
      return await fetchGlobalStockQuote(`${term}.KS`, fundBaseCurrency);
    } catch (e) {}
  }

  // 4. Numeric AMFI code -> Indian Mutual Fund (5-7 digits)
  if (/^\d{5,7}$/.test(term)) {
    try {
      return await fetchMutualFundNav(term);
    } catch (e) {
      // If AMFI fails, try global stock
    }
  }

  // 5. Explicit Indian Mutual Fund category / name
  if (cat.includes('mutual') || cat.includes('sip') || cat.includes('fund')) {
    if (fundBaseCurrency === 'INR' || (!term.includes('.') && /^[a-zA-Z\s]{4,}$/.test(term))) {
      try {
        return await fetchMutualFundNav(term);
      } catch (e) {}
    }
  }

  // 6. Try Global Stock / ETF / US Mutual Fund quote
  try {
    return await fetchGlobalStockQuote(term, fundBaseCurrency);
  } catch (e) {
    // 7. Final fallback: try AMFI search
    return await fetchMutualFundNav(term);
  }
}

/**
 * 1-Click Universal Batch Sync
 * Updates all holdings (Mutual Funds, Stocks, ETFs, Crypto) across US, Canada,
 * Australia, South Korea, UK, Europe, Japan, and India to live market prices,
 * aligning multi-currency values into the Fund's Base Currency via the European
 * Central Bank FX Engine.
 */
export async function syncUniversalHoldingsBatch(holdings, fundBaseCurrency = 'USD', onProgress = () => {}) {
  // Support flexible signature: (holdings, onProgress) or (holdings, fundBaseCurrency, onProgress)
  let baseCurrency = fundBaseCurrency;
  let progressFn = onProgress;

  if (typeof fundBaseCurrency === 'function') {
    progressFn = fundBaseCurrency;
    baseCurrency = 'USD';
  }
  if (typeof baseCurrency !== 'string') {
    baseCurrency = 'USD';
  }
  if (typeof progressFn !== 'function') {
    progressFn = () => {};
  }

  const fxRates = await fetchFxRates();
  const results = [];
  const safeHoldings = Array.isArray(holdings) ? holdings : [];

  for (let i = 0; i < safeHoldings.length; i++) {
    const h = safeHoldings[i];
    progressFn({
      currentIndex: i + 1,
      total: safeHoldings.length,
      currentHolding: h.name || h.ticker,
    });

    const cat = (h.category || '').toLowerCase();
    // Skip manual valuation assets like Real Estate or Private Equity or Cash without ticker
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
      let quote = null;
      const isMutualFund = cat.includes('mutual') || cat.includes('sip') || cat.includes('fund');

      if (isMutualFund) {
        const tickerClean = String(h.ticker || '').trim();
        const codeClean = String(h.schemeCode || h.amfiCode || '').trim();

        // 1. Direct 5-7 digit AMFI scheme code
        if (/^\d{5,7}$/.test(codeClean)) {
          quote = await fetchMutualFundNav(codeClean);
        } else if (/^\d{5,7}$/.test(tickerClean)) {
          quote = await fetchMutualFundNav(tickerClean);
        } else {
          // 2. Try official name query first
          try {
            quote = await fetchMutualFundNav(h.name);
          } catch (nameErr) {
            // 3. Fallback to universal quote (handles US/Global Mutual Funds e.g. VFIAX)
            try {
              quote = await fetchUniversalQuote(tickerClean || h.name, h.category, baseCurrency);
            } catch (uErr) {
              throw nameErr;
            }
          }
        }
      } else {
        quote = await fetchUniversalQuote(h.ticker || h.name, h.category, baseCurrency);
      }

      const livePrice = quote.price || quote.nav;
      const liveNav = quote.nav || livePrice;
      const quoteCurrency = quote.currency || h.nativeCurrency || baseCurrency;

      // Units calculation
      const units = Number(h.units || h.quantity);
      let newNativeValue = h.currentValue;

      if (units && units > 0) {
        newNativeValue = Math.round(units * livePrice * 100) / 100;
      } else if (h.lastPrice && h.lastPrice > 0) {
        newNativeValue = Math.round((h.currentValue * (livePrice / h.lastPrice)) * 100) / 100;
      } else if (h.lastNav && h.lastNav > 0) {
        newNativeValue = Math.round((h.currentValue * (liveNav / h.lastNav)) * 100) / 100;
      }

      // Convert to Fund Base Currency if holding native currency differs
      const newBaseValue = convertCurrency(newNativeValue, quoteCurrency, baseCurrency, fxRates);

      results.push({
        holdingId: h.id,
        name: h.name,
        ticker: h.ticker,
        schemeCode: quote.schemeCode || (isMutualFund && /^\d{5,7}$/.test(h.ticker) ? h.ticker : undefined),
        oldValue: h.currentValue,
        newValue: newBaseValue,
        nativeValue: newNativeValue,
        nativeCurrency: quoteCurrency,
        livePrice,
        liveNav,
        navDate: quote.date,
        priceDate: quote.date || new Date().toISOString().split('T')[0],
        exchange: quote.exchange,
        badge: quote.badge,
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

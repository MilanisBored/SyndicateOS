// Universal Cross-Border FX Engine
// Uses the official European Central Bank (ECB) feed via open-source api.frankfurter.app
// 100% Free, zero authentication, real-time rates with resilient in-memory caching and offline fallbacks.

const FX_CACHE_KEY = 'syndicate_fx_rates_cache_v1';
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour cache

// Offline fallback rates (USD Base) in case network is disconnected
const BASE_FALLBACK_RATES_USD = {
  USD: 1.0,
  INR: 86.50,
  EUR: 0.915,
  GBP: 0.775,
  AED: 3.6725,
  SGD: 1.325,
  CAD: 1.395,
  AUD: 1.515,
  JPY: 152.0,
  CHF: 0.885,
  KRW: 1338.0,
  HKD: 7.85,
  NZD: 1.78,
  CNY: 7.15,
};

let memoryRates = null;
let lastFetchTime = 0;

/**
 * Fetch latest FX rates with USD as reference base
 */
export async function fetchFxRates(forceRefresh = false) {
  const now = Date.now();

  // Check in-memory cache
  if (!forceRefresh && memoryRates && (now - lastFetchTime < CACHE_TTL_MS)) {
    return memoryRates;
  }

  // Check sessionStorage
  if (!forceRefresh && typeof window !== 'undefined' && window.sessionStorage) {
    try {
      const cached = sessionStorage.getItem(FX_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (now - parsed.timestamp < CACHE_TTL_MS) {
          memoryRates = parsed.rates;
          lastFetchTime = parsed.timestamp;
          return memoryRates;
        }
      }
    } catch (e) {
      // ignore storage parse errors
    }
  }

  try {
    const res = await fetch('https://api.frankfurter.dev/v1/latest?from=USD');
    if (res.ok) {
      const data = await res.json();
      const rates = {
        USD: 1.0,
        AED: 3.6725, // Pegged
        ...data.rates,
      };

      memoryRates = rates;
      lastFetchTime = now;

      if (typeof window !== 'undefined' && window.sessionStorage) {
        try {
          sessionStorage.setItem(FX_CACHE_KEY, JSON.stringify({
            timestamp: now,
            rates,
          }));
        } catch (e) {}
      }

      return rates;
    }
  } catch (err) {
    console.warn('Live FX fetch failed, utilizing resilient currency peg fallback:', err);
  }

  // Fallback to static USD table
  memoryRates = BASE_FALLBACK_RATES_USD;
  return memoryRates;
}

/**
 * Convert any amount from one currency to another
 * @param {number} amount
 * @param {string} fromCurrency - e.g. 'USD', 'INR', 'EUR', 'AED'
 * @param {string} toCurrency - e.g. 'INR', 'USD'
 * @param {Object} [ratesOverride] - Optional rates object
 * @returns {number} converted amount
 */
export function convertCurrency(amount, fromCurrency = 'INR', toCurrency = 'INR', ratesOverride = null) {
  const amt = Number(amount) || 0;
  const from = (fromCurrency || 'INR').toUpperCase();
  const to = (toCurrency || 'INR').toUpperCase();

  if (amt === 0 || from === to) return amt;

  const rates = ratesOverride || memoryRates || BASE_FALLBACK_RATES_USD;

  const fromRateInUSD = rates[from] || (from === 'USD' ? 1.0 : BASE_FALLBACK_RATES_USD[from] || 1.0);
  const toRateInUSD = rates[to] || (to === 'USD' ? 1.0 : BASE_FALLBACK_RATES_USD[to] || 1.0);

  // Amount in USD = amt / fromRate
  // Amount in Target = (amt / fromRate) * toRate
  const converted = (amt / fromRateInUSD) * toRateInUSD;
  return Math.round(converted * 100) / 100;
}

/**
 * Get the direct exchange multiplier between two currencies (e.g. 1 USD = 86.5 INR)
 */
export function getExchangeRate(fromCurrency = 'USD', toCurrency = 'INR', ratesOverride = null) {
  const from = (fromCurrency || 'USD').toUpperCase();
  const to = (toCurrency || 'INR').toUpperCase();
  if (from === to) return 1.0;

  const rates = ratesOverride || memoryRates || BASE_FALLBACK_RATES_USD;
  const fromRateInUSD = rates[from] || (from === 'USD' ? 1.0 : BASE_FALLBACK_RATES_USD[from] || 1.0);
  const toRateInUSD = rates[to] || (to === 'USD' ? 1.0 : BASE_FALLBACK_RATES_USD[to] || 1.0);

  return toRateInUSD / fromRateInUSD;
}

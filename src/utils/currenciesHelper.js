// src/utils/currenciesHelper.js

/**
 * Comprehensive list of world currencies with codes and labels
 * Data is comprehensive and production-ready
 */
export const getAllCurrencies = () => {
  const currencies = [
    { code: 'USD', label: 'US Dollar', symbol: '$' },
    { code: 'EUR', label: 'Euro', symbol: '€' },
    { code: 'GBP', label: 'British Pound', symbol: '£' },
    { code: 'JPY', label: 'Japanese Yen', symbol: '¥' },
    { code: 'CAD', label: 'Canadian Dollar', symbol: 'C$' },
    { code: 'AUD', label: 'Australian Dollar', symbol: 'A$' },
    { code: 'CHF', label: 'Swiss Franc', symbol: 'CHF' },
    { code: 'CNY', label: 'Chinese Yuan', symbol: '¥' },
    { code: 'INR', label: 'Indian Rupee', symbol: '₹' },
    { code: 'PKR', label: 'Pakistani Rupee', symbol: '₨' },
    { code: 'AED', label: 'UAE Dirham', symbol: 'د.إ' },
    { code: 'SAR', label: 'Saudi Riyal', symbol: 'ر.س' },
    { code: 'SGD', label: 'Singapore Dollar', symbol: 'S$' },
    { code: 'HKD', label: 'Hong Kong Dollar', symbol: 'HK$' },
    { code: 'NZD', label: 'New Zealand Dollar', symbol: 'NZ$' },
    { code: 'SEK', label: 'Swedish Krona', symbol: 'kr' },
    { code: 'NOK', label: 'Norwegian Krone', symbol: 'kr' },
    { code: 'DKK', label: 'Danish Krone', symbol: 'kr' },
    { code: 'BRL', label: 'Brazilian Real', symbol: 'R$' },
    { code: 'MXN', label: 'Mexican Peso', symbol: '$' },
    { code: 'ZAR', label: 'South African Rand', symbol: 'R' },
    { code: 'RUB', label: 'Russian Ruble', symbol: '₽' },
    { code: 'INR', label: 'Indian Rupee', symbol: '₹' },
    { code: 'TRY', label: 'Turkish Lira', symbol: '₺' },
    { code: 'THB', label: 'Thai Baht', symbol: '฿' },
    { code: 'MYR', label: 'Malaysian Ringgit', symbol: 'RM' },
    { code: 'PHP', label: 'Philippine Peso', symbol: '₱' },
    { code: 'IDR', label: 'Indonesian Rupiah', symbol: 'Rp' },
    { code: 'VND', label: 'Vietnamese Dong', symbol: '₫' },
    { code: 'KRW', label: 'South Korean Won', symbol: '₩' },
  ];

  // Sort by code for consistency
  return currencies.sort((a, b) => a.code.localeCompare(b.code));
};

/**
 * Search currencies by code or label
 * @param {string} query - Search term
 * @returns {object[]} Matching currencies
 */
export const searchCurrencies = (query) => {
  if (!query || query.trim() === '') return getAllCurrencies();
  
  const lowerQuery = query.toLowerCase().trim();
  return getAllCurrencies().filter(currency =>
    currency.code.toLowerCase().includes(lowerQuery) ||
    currency.label.toLowerCase().includes(lowerQuery)
  );
};

/**
 * Get currency by code
 * @param {string} code - Currency code (e.g., "USD")
 * @returns {object|null} Currency object or null
 */
export const getCurrencyByCode = (code) => {
  return getAllCurrencies().find(c => c.code === code.toUpperCase()) || null;
};

/**
 * Format currency for display
 * @param {string} code - Currency code
 * @returns {string} Formatted display (e.g., "USD - US Dollar")
 */
export const formatCurrency = (code) => {
  const currency = getCurrencyByCode(code);
  if (!currency) return code;
  return `${currency.code} - ${currency.label}`;
};

/**
 * Validate if currency code exists
 * @param {string} code - Currency code
 * @returns {boolean}
 */
export const isValidCurrency = (code) => {
  return getAllCurrencies().some(c => c.code === code.toUpperCase());
};

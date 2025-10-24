/**
 * Formats Unix timestamp to Pakistan local time
 * @param {number} unixTimestamp - Unix timestamp in seconds
 * @returns {string} Formatted date string in Pakistan time
 */
export const formatUnixToPakistanTime = (unixTimestamp) => {
  try {
    const date = new Date(unixTimestamp * 1000);
    
    // Format to Pakistan time (Asia/Karachi)
    const options = {
      timeZone: 'Asia/Karachi',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };
    
    return date.toLocaleString('en-US', options);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

/**
 * Gets current Unix timestamp minus specified seconds
 * @param {number} secondsToSubtract - Number of seconds to subtract from current time
 * @returns {number} Unix timestamp
 */
export const getUnixTimestamp = (secondsToSubtract = 0) => {
  return Math.floor(Date.now() / 1000) - secondsToSubtract;
};

/**
 * Formats currency amount
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: USD)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = 'USD') => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch (error) {
    return `${currency} ${amount}`;
  }
};

/**
 * formatPakistanDate - convert an ISO/UTC date string to Pakistan time string
 * and format as "DD/MM/YYYY, hh:mm:ss AM/PM" (defaults to 12-hour).
 *
 * @param {string|Date} isoDate - ISO date string or Date object (UTC or local).
 * @param {object} opts - options:
 *    { boolean hour12 } - true for 12-hour format (default true)
 *    { string locale } - locale for formatting (default 'en-GB' -> dd/mm/yyyy)
 * @returns {string} formatted date-time in Pakistan timezone or empty string on bad input
 */
export function formatPakistanDate(isoDate, opts = {}) {
  const { hour12 = true, locale = 'en-GB' } = opts;
  if (!isoDate) return '';

  // Ensure we have a Date object
  const date = (isoDate instanceof Date) ? isoDate : new Date(isoDate);
  if (Number.isNaN(date.getTime())) return ''; // invalid date

  const options = {
    timeZone: 'Asia/Karachi',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: !!hour12
  };

  return new Intl.DateTimeFormat(locale, options).format(date);
}

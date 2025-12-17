// src/utils/countriesHelper.js
import countries from 'i18n-iso-countries';
import enLocale from 'i18n-iso-countries/langs/en.json';

// Register locale once
countries.registerLocale(enLocale);

/**
 * Get all country names sorted alphabetically
 * @returns {string[]} Array of country names
 */
export const getAllCountries = () => {
  try {
    const countryNames = Object.values(countries.getNames('en'));
    return countryNames.sort();
  } catch (error) {
    console.error('Error getting countries:', error);
    return getDefaultCountriesFallback();
  }
};

/**
 * Fallback countries if library fails
 * @returns {string[]} Array of default countries
 */
export const getDefaultCountriesFallback = () => {
  return [
    'Pakistan', 'United Kingdom', 'Germany', 'Netherlands', 'Spain', 'Malaysia',
    'Philippines', 'South Africa', 'Mexico', 'United States', 'Australia',
    'Saudi Arabia', 'France', 'Indonesia', 'Nigeria', 'Turkey', 'Sweden',
    'India', 'Canada', 'United Arab Emirates', 'Egypt', 'Italy', 'Singapore',
    'Brazil', 'Russian Federation'
  ];
};

/**
 * Search countries by query
 * @param {string} query - Search term
 * @returns {string[]} Matching countries
 */
export const searchCountries = (query) => {
  if (!query || query.trim() === '') return getAllCountries();
  
  const lowerQuery = query.toLowerCase().trim();
  return getAllCountries().filter(country =>
    country.toLowerCase().includes(lowerQuery)
  );
};

/**
 * Validate if country exists
 * @param {string} country - Country name
 * @returns {boolean}
 */
export const isValidCountry = (country) => {
  return getAllCountries().includes(country);
};

export default {
  getAllCountries,
  getDefaultCountriesFallback,
  searchCountries,
  isValidCountry,
};

// /**
//  * Builds query parameters for Freelancer API
//  * @param {Object} params - Parameters object
//  * @returns {string} Query string
//  */
// export const buildQueryParams = (params) => {
//   const searchParams = new URLSearchParams();
  
//   Object.entries(params).forEach(([key, value]) => {
//     if (Array.isArray(value)) {
//       value.forEach(item => searchParams.append(key, item));
//     } else if (value !== undefined && value !== null) {
//       searchParams.append(key, value);
//     }
//   });
  
//   return searchParams.toString();
// };

// /**
//  * Default API configuration for Freelancer.com
//  */
// export const API_CONFIG = {
//   BASE_URL: 'https://www.freelancer.com/api',
//   ENDPOINTS: {
//     ACTIVE_PROJECTS: '/projects/0.1/projects/active/'
//   },
//   DEFAULT_PARAMS: {
//     limit: 10,
//     sort_field: 'submitdate',
//     sort_order: 'desc',
//     'project_types[]': 'fixed',
//     'frontend_project_statuses[]': 'open',
//     currency: 'USD',
//     query: 'Full Stack OR Web development OR Mobile app development'
//   }
// };

// /**
//  * Storage keys for localStorage
//  */
// export const STORAGE_KEYS = {
//   PROJECTS: 'freelancer_projects',
//   LAST_FETCH: 'last_fetch_time'
// };

/**
 * Builds query parameters for Freelancer API
 * @param {Object} params - Parameters object
 * @returns {string} Query string
 */
export const buildQueryParams = (params) => {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach(item => searchParams.append(key, item));
    } else if (value !== undefined && value !== null) {
      searchParams.append(key, value);
    }
  });
  
  return searchParams.toString();
};

/**
 * Default API configuration for Freelancer.com
 */
export const API_CONFIG = {
  BASE_URL: 'https://www.freelancer.com/api',
  ENDPOINTS: {
    ACTIVE_PROJECTS: '/projects/0.1/projects/active/',
    PLACE_BID: '/projects/0.1/bids/'
  },
  DEFAULT_PARAMS: {
    // limit: 20,
    //   user_details: true,
    // user_responsiveness: true,
    // user_portfolio_details: true,
    // user_reputation: true,
    // 'project_types[]': 'hourly',
    // sort_field: 'submitdate',
    // sort_order: 'desc',
    // 'project_types[]': 'fixed',
    // 'frontend_project_statuses[]': 'open',
    // currency: 'USD',
    // query: 'Mern Stack Development OR Mobile app Development OR Backend Development OR Frontend Development',
    // query: 'UI/UX Design OR Web development OR Mobile app development OR Full Stack Development OR AI Development',
    // min_avg_price: 500,
    // max_avg_price: 1000
  }
};

/**
 * Storage keys for localStorage
 */
export const STORAGE_KEYS = {
  PROJECTS: 'freelancer_projects',
  LAST_FETCH: 'last_fetch_time',
  BIDS: 'freelancer_bids'
};

// Persist per-project proposal drafts
export const PROPOSAL_STORAGE_PREFIX = 'proposal_draft_';

/**
 * Get environment variables (DEPRECATED - use useAuth hook instead)
 * @deprecated Use useAuth hook from AuthContext for multi-account support
 */
// export const getEnvConfig = () => {
//   console.warn('getEnvConfig is deprecated. Use useAuth hook for multi-account support.');
  
//   // Support new token name (primary) and fallback to old one if present
//   const authToken =
//     process.env.REACT_APP_FREELANCER_TOKEN ||
//     process.env.REACT_APP_FREELANCER_AUTH_TOKEN;
//   const bidderId = process.env.REACT_APP_BIDDER_ID;
  
//   if (!authToken || !bidderId) {
//     console.warn('Missing environment variables. Please check .env.local file.');
//   }
  
//   return {
//     authToken,
//     bidderId: bidderId ? parseInt(bidderId, 10) : null
//   };
// };
/**
 * Get environment configuration for the current user
 * This should work with your AuthContext to get the current user's token
 */
export const getEnvConfig = () => {
  // Try to get token from localStorage (set by AuthContext)
  const storedToken = localStorage.getItem('freelancer_token');
  const storedBidderId = localStorage.getItem('freelancer_bidder_id');
  
  if (storedToken && storedBidderId) {
    console.log(`🔍 getEnvConfig: Using stored credentials`);
    return {
      token: storedToken,
      authToken: storedToken, // For backward compatibility
      bidderId: parseInt(storedBidderId, 10)
    };
  }
  
  // Fallback to default environment variables
  console.log(`🔍 getEnvConfig: Using default environment variables`);
  return {
    token: process.env.REACT_APP_DEFAULT_TOKEN,
    authToken: process.env.REACT_APP_DEFAULT_TOKEN,
    bidderId: process.env.REACT_APP_DEFAULT_BIDDER ? parseInt(process.env.REACT_APP_DEFAULT_BIDDER, 10) : null,
  };
};


/**
 * Get default headers for API requests
 * @param {boolean} includeAuth - Whether to include authentication headers
 * @param {string} token - OAuth token (if not provided, will use deprecated getEnvConfig)
 */

export const getApiHeaders = (includeAuth = false, token = null) => {
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };
  
  if (includeAuth) {
    // Use custom token if provided, otherwise fall back to getEnvConfig
    const authToken = token || getEnvConfig().token;
    
    if (authToken) {
      headers['freelancer-oauth-v1'] = authToken;
      
      // Enhanced logging for multi-account debugging
      const tokenPreview = authToken.substring(0, 15) + '...';
      console.log(`🔑 Using API token: ${tokenPreview}`);
      
      // Log source of token for debugging
      if (token) {
        console.log(`📤 Token source: Custom parameter (dynamic)`);
      } else {
        console.log(`📤 Token source: Environment config (fallback)`);
      }
    } else {
      console.warn('⚠️ No access token available for API request');
      console.warn('   - Custom token:', token ? 'PROVIDED' : 'NOT PROVIDED');
      console.warn('   - Env config token:', getEnvConfig().token ? 'AVAILABLE' : 'MISSING');
    }
  }
  
  return headers;
};

// export const getApiHeaders = (includeAuth = false, token = null) => {
//   const headers = {
//     'Accept': 'application/json',
//     'Content-Type': 'application/json',
//   };
  
//   if (includeAuth) {
//     const authToken = token || getEnvConfig().authToken;
//     if (authToken) {
//       headers['freelancer-oauth-v1'] = authToken;
//     }
//   }
  
//   return headers;
// };

// New: determine "new" vs "old" projects and constants
export const NEW_THRESHOLD_SECONDS = 60;

export const isProjectNew = (submitUnixSeconds, nowUnix = Math.floor(Date.now() / 1000)) => {
  if (!submitUnixSeconds || Number.isNaN(submitUnixSeconds)) return false;
  return (nowUnix - submitUnixSeconds) <= NEW_THRESHOLD_SECONDS;
};

// export const getApiHeaders = (includeAuth = false) => {
  
//   const headers = {
//     'Accept': 'application/json',
//     'Content-Type': 'application/json',
//   };
  
//   if (includeAuth) {
//     const { authToken } = getEnvConfig();
//     if (authToken) {
//       headers['Authorization'] = `Bearer ${authToken}`;
//     }
//   }
  
//   return headers;
// };
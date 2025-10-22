// import axios from 'axios';
// import { API_CONFIG, getApiHeaders, STORAGE_KEYS } from '../utils/apiUtils';

// class BidService {
//   async placeBid(projectId, amount, period, description, token = null, bidderId = null) {
//     if (!bidderId) {
//       return { success: false, message: 'Bidder ID not configured. Please select a valid account.' };
//     }

//     const body = {
//       project_id: projectId,
//       bidder_id: bidderId,
//       amount,
//       period,
//       description,
//       milestone_percentage: 50
//     };

//     try {
//       const res = await axios.post(
//         `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PLACE_BID}`,
//         body,
//         { headers: getApiHeaders(true, token), timeout: 15000 }
//       );
//       // Optional local cache of submitted bids
//       try {
//         const key = STORAGE_KEYS.BIDS;
//         const prev = JSON.parse(localStorage.getItem(key) || '[]');
//         prev.push({ projectId, amount, period, description, ts: Date.now() });
//         localStorage.setItem(key, JSON.stringify(prev));
//       } catch {}
//       return { success: true, data: res.data };
//     } catch (error) {
//       let message = 'Failed to place bid';
//       if (error.response) {
//         const s = error.response.status;
//         const d = error.response.data;
//         if (s === 401) message = 'Authentication failed. Check your API token.';
//         else if (s === 403) message = 'Permission denied.';
//         else if (s === 400) message = d?.message || 'Invalid bid data.';
//         else if (s === 429) message = 'Too many requests. Please wait.';
//         else message = `API Error: ${s} - ${d?.message || error.response.statusText}`;
//       } else if (error.request) {
//         message = 'Network error. Please try again.';
//       } else if (error.message) {
//         message = error.message;
//       }
//       return { success: false, message };
//     }
//   }

//   /**
//    * Get locally stored bids
//    * @returns {Array} Array of stored bids
//    */
//   getLocalBids() {
//     try {
//       return JSON.parse(localStorage.getItem(STORAGE_KEYS.BIDS) || '[]');
//     } catch (error) {
//       console.error('Error retrieving local bids:', error);
//       return [];
//     }
//   }

//   /**
//    * Check if user has already bid on a project
//    * @param {number} projectId - Project ID to check
//    * @returns {boolean} True if user has bid on this project
//    */
//   hasBidOnProject(projectId) {
//     const localBids = this.getLocalBids();
//     return localBids.some(bid => bid.projectId === projectId);
//   }

//   /**
//    * Store bid information locally
//    * @param {number} projectId - Project ID
//    * @param {Object} bidData - Bid data sent to API
//    * @param {Object} response - API response
//    */
//   storeBidLocally(projectId, bidData, response) {
//     try {
//       const existingBids = JSON.parse(localStorage.getItem(STORAGE_KEYS.BIDS) || '[]');
      
//       const bidRecord = {
//         id: response.result?.id || Date.now(),
//         projectId,
//         amount: bidData.amount,
//         period: bidData.period,
//         description: bidData.description,
//         timestamp: Date.now(),
//         status: 'submitted'
//       };
      
//       existingBids.push(bidRecord);
//       localStorage.setItem(STORAGE_KEYS.BIDS, JSON.stringify(existingBids));
//     } catch (error) {
//       console.error('Error storing bid locally:', error);
//     }
//   }
// }

// export const bidService = new BidService();
// export default bidService;


import axios from 'axios';
import { API_CONFIG, getApiHeaders, STORAGE_KEYS } from '../utils/apiUtils';

class BidService {
  async placeBid(projectId, amount, period, description, token = null, bidderId = null) {
    // Enhanced validation and logging
    console.log(`🔄 BidService.placeBid called:`);
    console.log(`   Project ID: ${projectId}`);
    console.log(`   Amount: $${amount}`);
    console.log(`   Period: ${period} days`);
    console.log(`   Token provided: ${token ? 'YES' : 'NO'}`);
    console.log(`   Bidder ID: ${bidderId || 'MISSING'}`);
    
    if (!bidderId) {
      console.error('❌ No bidder ID provided');
      return {
        success: false,
        message: 'Bidder ID not configured. Please select a valid account.'
      };
    }

    if (!token) {
      console.error('❌ No access token provided');
      return {
        success: false,
        message: 'Access token not available. Please check your account configuration.'
      };
    }

    const body = {
      project_id: projectId,
      bidder_id: bidderId,
      amount,
      period,
      description,
      milestone_percentage: 50
    };

    console.log('📤 Sending bid request:', body);

    try {
      const res = await axios.post(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PLACE_BID}`,
        body,
        {
          headers: getApiHeaders(true, token), // Pass token to your getApiHeaders function
          timeout: 15000
        }
      );

      console.log('✅ Bid API response:', res.data);

      // Optional local cache of submitted bids
      try {
        const key = STORAGE_KEYS.BIDS;
        const prev = JSON.parse(localStorage.getItem(key) || '[]');
        prev.push({
          projectId,
          amount,
          period,
          description,
          bidderId,
          ts: Date.now()
        });
        localStorage.setItem(key, JSON.stringify(prev));
        console.log('💾 Bid cached locally');
      } catch (cacheError) {
        console.warn('⚠️ Failed to cache bid locally:', cacheError);
      }

      return { success: true, data: res.data };

    } catch (error) {
      console.error('❌ Bid API error:', error);
      
      let message = 'Failed to place bid';
      
      if (error.response) {
        const s = error.response.status;
        const message= error.response.message;
        const d = error.response.data;
        
        console.error(`❌ API Error ${s}:`, d);
        
        if (s === 401) {
          message = 'Authentication failed. Check your API token or account permissions.';
        } else if (s === 403) {
          message = message;
        } else if (s === 400) {
          message = d?.message || 'Invalid bid data. Please check your bid parameters.';
        } else if (s === 429) {
          message = 'Too many requests. Please wait before placing another bid.';
        } else {
          message = `API Error: ${s} - ${d?.message || error.response.statusText}`;
        }
      } else if (error.request) {
        console.error('❌ Network error:', error.request);
        message = 'Network error. Please check your connection and try again.';
      } else if (error.message) {
        message = error.message;
      }

      return { success: false, message };
    }
  }

  /**
   * Get locally stored bids
   * @returns {Array} Array of stored bids
   */
  getLocalBids() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.BIDS) || '[]');
    } catch (error) {
      console.error('Error retrieving local bids:', error);
      return [];
    }
  }

  /**
   * Check if user has already bid on a project
   * @param {number} projectId - Project ID to check
   * @returns {boolean} True if user has bid on this project
   */
  hasBidOnProject(projectId) {
    const localBids = this.getLocalBids();
    return localBids.some(bid => bid.projectId === projectId);
  }

  /**
   * Check if current user has already bid on a project (multi-account aware)
   * @param {number} projectId - Project ID to check
   * @param {number} bidderId - Current bidder ID
   * @returns {boolean} True if current user has bid on this project
   */
  hasCurrentUserBidOnProject(projectId, bidderId) {
    const localBids = this.getLocalBids();
    return localBids.some(bid => 
      bid.projectId === projectId && 
      bid.bidderId === bidderId
    );
  }

  /**
   * Get bids for current user session
   * @param {number} bidderId - Current bidder ID
   * @returns {Array} Array of bids for current bidder
   */
  getBidsForCurrentUser(bidderId) {
    const allBids = this.getLocalBids();
    return allBids.filter(bid => bid.bidderId === bidderId);
  }

  /**
   * Store bid information locally
   * @param {number} projectId - Project ID
   * @param {Object} bidData - Bid data sent to API
   * @param {Object} response - API response
   */
  storeBidLocally(projectId, bidData, response) {
    try {
      const existingBids = JSON.parse(localStorage.getItem(STORAGE_KEYS.BIDS) || '[]');
      const bidRecord = {
        id: response.result?.id || Date.now(),
        projectId,
        amount: bidData.amount,
        period: bidData.period,
        description: bidData.description,
        bidderId: bidData.bidder_id,
        timestamp: Date.now(),
        status: 'submitted'
      };

      existingBids.push(bidRecord);
      localStorage.setItem(STORAGE_KEYS.BIDS, JSON.stringify(existingBids));
      console.log('💾 Bid record stored locally:', bidRecord);
    } catch (error) {
      console.error('Error storing bid locally:', error);
    }
  }

  /**
   * Clear all stored bids
   */
  clearAllBids() {
    try {
      localStorage.removeItem(STORAGE_KEYS.BIDS);
      console.log('🗑️ All bid records cleared');
    } catch (error) {
      console.error('Error clearing bid records:', error);
    }
  }

  /**
   * Clear bids for specific user
   * @param {number} bidderId - Bidder ID to clear bids for
   */
  clearBidsForUser(bidderId) {
    try {
      const allBids = this.getLocalBids();
      const filteredBids = allBids.filter(bid => bid.bidderId !== bidderId);
      localStorage.setItem(STORAGE_KEYS.BIDS, JSON.stringify(filteredBids));
      console.log(`🗑️ Bid records cleared for bidder ${bidderId}`);
    } catch (error) {
      console.error('Error clearing user bid records:', error);
    }
  }
}

export const bidService = new BidService();
export default bidService;

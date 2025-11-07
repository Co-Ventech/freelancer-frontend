import { useState, useCallback } from 'react';
import { bidService } from '../services/bidService';
import { useAuth } from '../contexts/AuthContext';
import { postBid } from '../utils/api';
import { useUsersStore } from '../store/useUsersStore';
import { useFirebaseAuth } from '../contexts/FirebaseAuthContext';

/**
 * Custom hook for handling bidding operations with multi-account support
 */
export const useBidding = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const usersStore = useUsersStore.getState();
  const getSelectedUser = usersStore.getSelectedUser;
  const { user: fbUser } = useFirebaseAuth?.() || {};

  
  const { token, bidderId, currentUser } = useAuth();

  /**
   * Place a bid on a project
   */
  // const placeBid = useCallback(async (
  //   projectId, 
  //   amount , 
  //   period = 5, 
  //   description =''
  // ) => {
  //   setLoading(true);
  //   setError(null);
  //   setSuccess(false);

  //   // Enhanced logging for multi-account debugging
  //   console.log(`🎯 Placing bid for ${currentUser}:`);
  //   console.log(`   Project ID: ${projectId}`);
  //   console.log(`   Amount: $${amount}`);
  //   console.log(`   Period: ${period} days`);
  //   // Try to resolve selected sub-user from Zustand store if available
  //   const selected = useUsersStore.getState().getSelectedUser?.() || null;
  //   const tokenToUse = selected?.sub_user_access_token || token || null;
  //   const bidderIdToUse = selected?.user_bid_id ? Number(selected.user_bid_id) : (bidderId || null);

  //   console.log(`   Token (resolved): ${tokenToUse ? `${String(tokenToUse).substring(0, 15)}...` : 'MISSING'}`);
  //   console.log(`   Bidder ID (resolved): ${bidderIdToUse || 'MISSING'}`);

  //   try {
  //     // Validate required credentials (prefer selected sub-user values)
  //     if (!tokenToUse) {
  //       throw new Error(`No access token available for ${selected?.sub_username || currentUser}. Please check your account configuration.`);
  //     }

  //     if (!bidderIdToUse) {
  //       throw new Error(`No bidder ID configured for ${selected?.sub_username || currentUser}. Please check your account configuration.`);
  //     }

  //     const result = await bidService.placeBid(projectId, amount, period, description, tokenToUse, bidderIdToUse);

  //     if (result.success) {
  //       setSuccess(true);
  //       console.log(`✅ Bid placed successfully for ${currentUser}!`);
        
  //       // Show success alert with user info
  //       alert(`✅ Bid placed successfully for ${currentUser}!\n\nAmount: $${amount}\nPeriod: ${period} days\nProject ID: ${projectId}`);
        
  //       return result;
  //     } else {
  //       console.log(`❌ Bid failed for ${currentUser}:`, result.message);
  //       setError(result.message);
  //       return result;
  //     }
  //   } catch (err) {
  //     const errorMessage = err.message || 'An unexpected error occurred';
  //     console.error(`❌ Bidding error for ${currentUser}:`, errorMessage);
  //     setError(errorMessage);
  //     return { success: false, error: errorMessage };
  //   } finally {
  //     setLoading(false);
  //   }
  // }, [token, bidderId, currentUser]);



   const placeBid = async (projectId, amount, period = 5, description = '', seo_url = null, projectType = null, projectTitle = '', projectDescription = '', budget = null) => {
    setLoading(true);
    try {
      // Resolve selected sub-user from Zustand
      const selected = typeof getSelectedUser === 'function' ? getSelectedUser() : null;
      if (!selected) {
        throw new Error('No sub-user selected. Please select an account before placing bids.');
      }

      // Ensure backend knows which sub-user (e.g., "sub_0") and bidder id
      const bidVia = selected.sub_user || selected.subUser || selected.sub_username || selected.sub_username?.toLowerCase?.() || null;
      const bidderId = selected.user_bid_id || selected.bidder_id || null;
      const bidderName = selected.sub_username || selected.name || null;
      if (!bidVia) {
        throw new Error('Selected sub-user does not include sub_user identifier (e.g. "sub_0").');
      }
      if (!bidderId) {
        throw new Error('Selected sub-user does not include bidder id (user_bid_id).');
      }

      // Build payload expected by backend
      const payload = {
        bid_via: bidVia,
        projectId: Number(projectId),
        seo_url: seo_url || null,
        projectType: projectType || null,
        bidderId: Number(bidderId),
        bidAmount: Number(amount),
        proposal: description || '',
        bidderName: bidderName || '',
        projectTitle: projectTitle || '',
        projectDescription: projectDescription || '',
        budget: budget || null
      };

      // If firebase user token is needed to pass backend, attempt to get it
      let idToken = null;
      try {
        if (fbUser && typeof fbUser.getIdToken === 'function') {
          idToken = await fbUser.getIdToken();
        }
      } catch (e) {
        // ignore - getAuthHeaders will fallback to cookie
      }

      // Call backend /bid
      const res = await postBid(payload, idToken);

      if (!(res.status >= 200 && res.status < 300)) {
        const msg = res?.data?.message || `Failed to place bid: ${res.status}`;
        throw new Error(msg);
      }

      // Optionally log/return server response
      return { success: true, data: res.data };
    } catch (err) {
      console.error('placeBid error:', err);
      return { success: false, message: err?.message || 'Failed to place bid' };
    } finally {
      setLoading(false);
    }
  };
  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Clear success state
   */
  const clearSuccess = useCallback(() => {
    setSuccess(false);
  }, []);

  /**
   * Reset all states
   */
  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setSuccess(false);
  }, []);

  return {
    loading,
    error,
    success,
    placeBid,
    clearError,
    clearSuccess,
    reset,
    
    // Debug info for multi-account
    currentUser,
    hasToken: !!token,
    hasBidderId: !!bidderId
  };
};

import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    updateProfile,
    sendPasswordResetEmail
  } from "firebase/auth";
  import { doc, setDoc, getDoc } from "firebase/firestore";
  import { auth, db } from "../config/firebase";
  import axios from 'axios';
  

  
  class FirebaseAuthService {
    // Register new user
  async register(email, password, name, role = 'user') {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await updateProfile(user, {
      displayName: name
    });

    // Store user data with role
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      name: name,
      email: email,
      role: role, // 'admin' or 'user'
      createdAt: new Date().toISOString(),
      freelancerAccounts: [],
    
    });

    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        name: name,
        role: role
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

    // Login user
    async login(email, password) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const token = await user.getIdToken();

         // persist idToken to cookie for backend auth (used by fetchUsers and other calls)
    try {
        const maxAge = 60 * 60; // 1 hour
        const secureFlag = (typeof window !== 'undefined' && window.location && window.location.protocol === 'https:') ? '; Secure' : '';
        // SameSite=Lax to allow navigation-based requests, path=/ to be available site-wide
        document.cookie = `idToken=${token}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secureFlag}`;
      } catch (cookieErr) {
        // swallow cookie errors in environments without document
        console.warn('Could not set idToken cookie', cookieErr);
      }
       // --- NEW: request backend access-token using Firebase idToken and persist it ---
      try {
        const accessRes = await axios.post(
          `${process.env.REACT_APP_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:5000'}/access-token`,
          {}, // body optional — backend usually uses Authorization header
          { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, validateStatus: () => true }
        );

        // Accept common response shapes: { token }, { access_token }, or { data: { token } }
        const accessToken =
          accessRes?.data?.data?.accessToken ||
          accessRes?.data?.data?.access_token ||
          accessRes?.data?.token ||
          accessRes?.data?.access_token ||
          null;

        if (accessToken) {
          try {
            // persist access token in cookie for backend APIs
            const maxAge = 60 * 60 * 24 * 7; // 7 days (adjust as needed)
            const isSecure = (typeof window !== 'undefined' && window.location && window.location.protocol === 'https:');
            const sameSite = isSecure ? 'None' : 'Lax';
             const secureFlag = isSecure ? '; Secure' : '';
               const enc = encodeURIComponent(accessToken);
            // SameSite=None may be required for cross-site cookies; adjust per your backend CORS setup
            document.cookie = `accessToken=${enc}; Path=/; Max-Age=${maxAge}; SameSite=${sameSite}${secureFlag}`;
            document.cookie = `access_token=${enc}; Path=/; Max-Age=${maxAge}; SameSite=${sameSite}${secureFlag}`;
            console.log('Saved access_token cookie from /access-token');
          } catch (cErr) {
            console.warn('Could not set access_token cookie', cErr);
          }

        } else if (accessRes && accessRes.status >= 200 && accessRes.status < 300) {
          console.warn('access-token endpoint responded OK but no token found in body', accessRes.data);
        } else {
          console.warn('access-token request failed', accessRes?.status, accessRes?.data);
        }
      } catch (atErr) {
        console.warn('Failed to obtain access-token from backend:', atErr?.message || atErr);
      }

        
        // Get additional user data from Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.exists() ? userDoc.data() : {};
        
        return {
          success: true,
          user: {
            uid: user.uid,
            email: user.email,
            name: user.displayName || userData.name,
            ...userData
          }
        };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    }
    
    // Logout user
    async logout() {
      try {
        await signOut(auth);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    }
    
    // Reset password
    async resetPassword(email) {
      try {
        await sendPasswordResetEmail(auth, email);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    }
    
    // Get current user data from Firestore
    async getCurrentUserData(uid) {
      try {
        const userDoc = await getDoc(doc(db, "users", uid));
        if (userDoc.exists()) {
          return {
            success: true,
            userData: userDoc.data()
          };
        } else {
          return {
            success: false,
            error: "User data not found"
          };
        }
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    }
    
    // Update user preferences
    async updateUserPreferences(uid, preferences) {
      try {
        await setDoc(doc(db, "users", uid), {
          preferences: preferences,
          updatedAt: new Date().toISOString()
        }, { merge: true });
        
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    }
    
    // Listen to auth state changes
    onAuthStateChange(callback) {
      return onAuthStateChanged(auth, callback);
    }
  }
  
  export const firebaseAuthService = new FirebaseAuthService();
  export default firebaseAuthService;
  
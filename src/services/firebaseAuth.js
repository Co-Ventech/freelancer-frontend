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
  
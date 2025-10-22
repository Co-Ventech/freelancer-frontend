// // src/contexts/FirebaseAuthContext.js
// import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
// import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
// import { auth } from '../config/firebase'; // your existing firebase config exports 'auth'

// const FirebaseAuthContext = createContext(null);

// export const useFirebaseAuth = () => {
//   const ctx = useContext(FirebaseAuthContext);
//   if (!ctx) throw new Error('useFirebaseAuth must be used within FirebaseAuthProvider');
//   return ctx;
// };

// export const FirebaseAuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);         // Firebase User | null
//   const [loading, setLoading] = useState(true);   // auth bootstrapping
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     const unsub = onAuthStateChanged(auth, (u) => {
//       setUser(u || null);
//       setLoading(false);
//     }, (err) => {
//       setError(err?.message || 'Auth error');
//       setLoading(false);
//     });
//     return () => unsub();
//   }, []);

//   const value = useMemo(() => ({
//     user,
//     loading,
//     error,
//     login: (email, password) => signInWithEmailAndPassword(auth, email, password),
//     register: (email, password) => createUserWithEmailAndPassword(auth, email, password),
//     logout: () => signOut(auth),
//   }), [user, loading, error]);

//   return (
//     <FirebaseAuthContext.Provider value={value}>
//       {children}
//     </FirebaseAuthContext.Provider>
//   );
// };


import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const FirebaseAuthContext = createContext(null);

export const useFirebaseAuth = () => {
  const ctx = useContext(FirebaseAuthContext);
  if (!ctx) throw new Error('useFirebaseAuth must be used within FirebaseAuthProvider');
  return ctx;
};

export const FirebaseAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch user data from Firestore to get role
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({
              ...firebaseUser,
              role: userData.role || 'user',
              name: userData.name
            });
          } else {
            setUser({ ...firebaseUser, role: 'user' });
          }
        } catch (err) {
          console.error('Error fetching user data:', err);
          setUser({ ...firebaseUser, role: 'user' });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    }, (err) => {
      setError(err?.message || 'Auth error');
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const login = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const register = async (email, password) => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const logout = () => signOut(auth);

  return (
    <FirebaseAuthContext.Provider value={{ user, loading, error, login, register, logout }}>
      {children}
    </FirebaseAuthContext.Provider>
  );
};

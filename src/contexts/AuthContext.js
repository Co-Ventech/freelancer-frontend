import React, { useContext, useState, useEffect } from 'react';

// import React, { createContext, useContext, useState } from 'react';
import firebaseAuthService from '../services/firebaseAuth';

export const AuthContext = React.createContext();


const AVAILABLE_USERS = {
  DEFAULT: { name: 'Zubair', color: 'gray' },
  COVENTECH: { name: 'Co-Ventech', color: 'blue' },
  ZAMEER: { name: 'Zameer', color: 'green' },
  AHSAN: { name: 'Ahsan', color: 'purple' },

};

const TOKENS = {
  DEFAULT: process.env.REACT_APP_DEFAULT_TOKEN,
  AHSAN: process.env.REACT_APP_TOKEN_AHSAN,
  ZAMEER: process.env.REACT_APP_TOKEN_ZAMEER,
  COVENTECH: process.env.REACT_APP_TOKEN_COVENTECH

};

const BIDDERS = {
  DEFAULT: process.env.REACT_APP_DEFAULT_BIDDER,
  AHSAN: process.env.REACT_APP_BIDDER_AHSAN,
  ZAMEER: process.env.REACT_APP_BIDDER_ZAMEER,
  COVENTECH: process.env.REACT_APP_BIDDER_COVENTECH
};

const resolveCredsForUser = (keyRaw) => {
  const key = (keyRaw || 'DEFAULT').toUpperCase();
  const token = TOKENS[key] || null;
  const bidderEnv = BIDDERS[key];
  const bidderId = bidderEnv ? parseInt(bidderEnv, 10) : null;

  if (!token || !bidderId) {
    console.error(`Missing credentials for user: ${key}`);
  }

  return { token, bidderId };
};


export const AuthProvider = ({ children }) => {
  // const [loading, setLoading] = useState(true);
  // const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState('DEFAULT');
  const [token, setToken] = useState(null);
  const [bidderId, setBidderId] = useState(null);

  const login = async (email, password) => {
    // setLoading(true);
    // setError(null);
    try {
      await firebaseAuthService.login(email, password);
    } catch (err) {
      // setError(err.message);
    } finally {
      // setLoading(false);
    }
  };

   // Register wrapper — ensure register is exposed to components
 const register = async (email, password, name) => {
    // setLoading(true);
    // setError(null);
    try {
      // Use firebaseAuthService.register if available; adjust if your service uses a different method name
      if (typeof firebaseAuthService.register === 'function') {
        await firebaseAuthService.register(email, password, name);
      } else if (typeof firebaseAuthService.createUser === 'function') {
        await firebaseAuthService.createUser(email, password, name);
      } else {
        throw new Error('Registration method not implemented in firebaseAuthService');
      }
    } catch (err) {
      // setError(err.message || 'Registration failed');
      throw err; // rethrow so forms can handle the error if needed
    } finally {
      // setLoading(false);
    }
  };

  useEffect(() => {
    const creds = resolveCredsForUser(currentUser);
    setToken(creds.token);
    setBidderId(creds.bidderId);
  }, [currentUser]);

  const switchUser = (userKey) => {
    const key = (userKey || 'DEFAULT').toUpperCase();
    if (!AVAILABLE_USERS[key]) {
      console.error(`Unknown user: ${key}`);
      return;
    }
    setCurrentUser(key);
  };

  const value = {
    currentUser,
    token,
    bidderId,
    login,
    switchUser,
    register,
    availableUsers: AVAILABLE_USERS,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { resolveCredsForUser };

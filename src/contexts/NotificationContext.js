import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'NOTIFICATIONS_V1';

const NotificationContext = createContext(null);

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};

export const NotificationProvider = ({ children }) => {
  const shouldPersist = useCallback((n) => {
    if (!n || n.type !== 'success') return false;
    if (n.persist === true || n.category === 'bid_success') return true;
    return n.title === 'Bid placed' || n.title === 'AutoBid completed';
  }, []);

  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      // Only hydrate persisted-eligible notifications
      return Array.isArray(parsed) ? parsed.filter((n) => {
        if (!n.createdAt) n.createdAt = Date.now();
        return n && (n.type === 'success') && (n.persist === true || n.category === 'bid_success' || n.title === 'Bid placed' || n.title === 'AutoBid completed');
      }) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      const toStore = items.filter(shouldPersist);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    } catch {
      // ignore storage failures
    }
  }, [items, shouldPersist]);

  const add = useCallback((notif) => {
    const id = notif.id || Math.random().toString(36).slice(2);
    const createdAt = notif.createdAt || Date.now();
    const item = { id, createdAt, read: false, ...notif };
    // Only show in the bell and persist if eligible; others are toast-only
    if (shouldPersist(item)) {
      setItems((prev) => [item, ...prev].slice(0, 200));
    }
    return id;
  }, [shouldPersist]);

  const addSuccess = useCallback((title, message) => add({ type: 'success', title, message }), [add]);
  const addError = useCallback((title, message) => add({ type: 'error', title, message }), [add]);
  const addInfo = useCallback((title, message) => add({ type: 'info', title, message }), [add]);

  const markRead = useCallback((id) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllRead = useCallback(() => {
    setItems((prev) => prev.map((n) => (n.read ? n : { ...n, read: true })));
  }, []);

  const remove = useCallback((id) => {
    setItems((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const unreadCount = useMemo(() => items.reduce((acc, n) => acc + (n.read ? 0 : 1), 0), [items]);

  const value = useMemo(() => ({
    items,
    unreadCount,
    add,
    addSuccess,
    addError,
    addInfo,
    markRead,
    markAllRead,
    remove,
  }), [items, unreadCount, add, addSuccess, addError, addInfo, markRead, markAllRead, remove]);

  return (
    <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
  );
};



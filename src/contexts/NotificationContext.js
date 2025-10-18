import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const STORAGE_PREFIX = 'NOTIFICATIONS_V1';

const NotificationContext = createContext(null);

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};

export const NotificationProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const storageKey = useMemo(() => `${STORAGE_PREFIX}:${currentUser || 'DEFAULT'}`, [currentUser]);
  const shouldPersist = useCallback((n) => {
    if (!n || n.type !== 'success') return false;
    if (n.persist === true || n.category === 'bid_success') return true;
    return n.title === 'Bid placed' || n.title === 'AutoBid completed';
  }, []);

  const [items, setItems] = useState([]);

  // Load items whenever the account changes
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : [];
      const hydrated = Array.isArray(parsed) ? parsed.filter((n) => {
        if (!n.createdAt) n.createdAt = Date.now();
        return shouldPersist(n);
      }) : [];
      setItems(hydrated);
    } catch {
      setItems([]);
    }
  }, [storageKey, shouldPersist]);

  useEffect(() => {
    try {
      const toStore = items.filter(shouldPersist);
      localStorage.setItem(storageKey, JSON.stringify(toStore));
    } catch {
      // ignore storage failures
    }
  }, [items, shouldPersist, storageKey]);

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

  const addSuccess = useCallback((title, message, projectData = null) => add({ type: 'success', title, message, projectData }), [add]);
  const addError = useCallback((title, message, projectData = null) => add({ type: 'error', title, message, projectData }), [add]);
  const addInfo = useCallback((title, message, projectData = null) => add({ type: 'info', title, message, projectData }), [add]);

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

  // Update document title and favicon badge when user or unread count changes
  useEffect(() => {
    const baseTitle = document.__sf_baseTitle || document.title || 'Smart Freelance';
    // Persist base title on first run
    if (!document.__sf_baseTitle) {
      document.__sf_baseTitle = baseTitle;
    }

    const userSuffix = currentUser ? ` – ${currentUser}` : '';
    document.title = unreadCount > 0
      ? `(${unreadCount}) ${baseTitle}${userSuffix}`
      : `${baseTitle}${userSuffix}`;

    const setFavicon = (count) => {
      // Ensure <link rel="icon"> exists
      const ensureFaviconLink = () => {
        let link = document.querySelector("link[rel='icon']");
        if (!link) {
          link = document.createElement('link');
          link.setAttribute('rel', 'icon');
          document.head.appendChild(link);
        }
        return link;
      };

      const link = ensureFaviconLink();

      // If no unread, clear to a minimal emoji-based icon to avoid 404s
      if (!count) {
        // Simple gray dot as data URL
        const size = 64;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = '#6c757d';
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size * 0.18, 0, Math.PI * 2);
        ctx.fill();
        link.href = canvas.toDataURL('image/png');
        return;
      }

      // Draw a bell-ish circle with red badge and count
      const size = 64;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');

      // background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);

      // bell base (simple glyph replacement)
      ctx.fillStyle = '#495057';
      ctx.beginPath();
      ctx.arc(size * 0.5, size * 0.55, size * 0.22, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(size * 0.35, size * 0.40, size * 0.30, size * 0.20);
      ctx.beginPath();
      ctx.arc(size * 0.5, size * 0.78, size * 0.06, 0, Math.PI * 2);
      ctx.fill();

      // red badge
      const badgeR = size * 0.18;
      const badgeX = size * 0.72;
      const badgeY = size * 0.20;
      ctx.fillStyle = '#dc3545';
      ctx.beginPath();
      ctx.arc(badgeX, badgeY, badgeR, 0, Math.PI * 2);
      ctx.fill();

      // count text
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.round(size * 0.32)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const countText = count > 99 ? '99+' : String(count);
      ctx.fillText(countText, badgeX, badgeY + 1);

      link.href = canvas.toDataURL('image/png');
    };

    setFavicon(unreadCount);
  }, [unreadCount, currentUser]);

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



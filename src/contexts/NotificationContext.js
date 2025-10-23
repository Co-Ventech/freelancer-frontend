// import React, { createContext, useCallback, useContext, useEffect, useMemo, useState,useRef } from 'react';
// import { useAuth } from '../contexts/AuthContext';

// const STORAGE_PREFIX = 'NOTIFICATIONS_V1';

// const NotificationContext = createContext(null);

// export const useNotifications = () => {
//   const ctx = useContext(NotificationContext);
//   if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
//   return ctx;
// };

// export const NotificationProvider = ({ children }) => {
//   const { currentUser } = useAuth();
//   const storageKey = useMemo(() => `${STORAGE_PREFIX}:${currentUser || 'DEFAULT'}`, [currentUser]);
//   const shouldPersist = useCallback((n) => {
//     if (!n || n.type !== 'success') return false;
//     if (n.persist === true || n.category === 'bid_success') return true;
//     return n.title === 'Bid placed' || n.title === 'AutoBid completed';
//   }, []);

//   const [items, setItems] = useState([]);

//     // audio ref + previous count ref to play sound only on new notifications
//   const audioRef = useRef(null);
//   const prevCountRef = useRef(null);
//   const initialLoadedRef = useRef(false);

//     // create audio element once
//   useEffect(() => {
//     try {
//       // audio file placed at public/sounds/notification.mp3
//       audioRef.current = new Audio('/sounds/notification.mp3');
//       audioRef.current.preload = 'auto';
//     } catch (err) {
//       console.warn('Failed to create audio element for notifications', err);
//       audioRef.current = null;
//     }
//   }, []);

//   // Load items whenever the account changes
//   useEffect(() => {
//     try {
//       const raw = localStorage.getItem(storageKey);
//       const parsed = raw ? JSON.parse(raw) : [];
//       const hydrated = Array.isArray(parsed) ? parsed.filter((n) => {
//         if (!n.createdAt) n.createdAt = Date.now();
//         return shouldPersist(n);
//       }) : [];
//       setItems(hydrated);

//     // initialize prevCountRef only after loading stored items so initial render won't trigger sound
//       prevCountRef.current = hydrated.length;
//       initialLoadedRef.current = true;
//     } catch (err) {
//       console.error('Failed to load notifications from storage', storageKey, err);
//       setItems([]);
//       prevCountRef.current = 0;
//       initialLoadedRef.current = true;
//     }
//   }, [storageKey, shouldPersist]);

//   useEffect(() => {
//     try {
//       const toStore = items.filter(shouldPersist);
//       localStorage.setItem(storageKey, JSON.stringify(toStore));
//     } catch {
//       // ignore storage failures
//     }
//   }, [items, shouldPersist, storageKey]);

//    // Play sound when new notification(s) are added — only for bid-success style notifications
//   useEffect(() => {
//     // don't run until initial load for current account completed
//     if (!initialLoadedRef.current) return;

//     const prev = typeof prevCountRef.current === 'number' ? prevCountRef.current : 0;
//     const curr = Array.isArray(items) ? items.length : 0;

//     if (curr > prev) {
//       // new items are at the start (we prepend), so take the slice of newly added items
//       const newCount = curr - prev;
//       const newItems = items.slice(0, newCount);

//       // Only trigger sound for bid-success notifications
//       const hasBidSuccess = newItems.some((n) => {
//         if (!n) return false;
//         if (n.type !== 'success') return false;
//         // treat explicit category or recognized title as bid success
//         if (n.category === 'bid_success') return true;
//         if (typeof n.title === 'string' && (n.title === 'Bid placed' || n.title === 'AutoBid completed')) return true;
//         return false;
//       });

//       if (hasBidSuccess && audioRef.current) {
//         try {
//           audioRef.current.currentTime = 0;
//           const playPromise = audioRef.current.play();
//           if (playPromise && typeof playPromise.then === 'function') {
//             playPromise.catch((err) => {
//               // Autoplay might be blocked — don't treat as fatal
//               console.warn('Notification sound play prevented:', err);
//             });
//           }
//         } catch (err) {
//           console.warn('Error playing notification sound', err);
//         }
//       }
//     }

//     // update previous count for next comparison
//     prevCountRef.current = curr;
//   }, [items]);


//   const add = useCallback((notif) => {
//     const id = notif.id || Math.random().toString(36).slice(2);
//     const createdAt = notif.createdAt || Date.now();
//     const item = { id, createdAt, read: false, ...notif };
//     // Only show in the bell and persist if eligible; others are toast-only
//     if (shouldPersist(item)) {
//       setItems((prev) => [item, ...prev].slice(0, 200));
//     }
//     return id;
//   }, [shouldPersist]);

//   const addSuccess = useCallback((title, message, projectData = null) => add({ type: 'success', title, message, projectData }), [add]);
//   const addError = useCallback((title, message, projectData = null) => add({ type: 'error', title, message, projectData }), [add]);
//   const addInfo = useCallback((title, message, projectData = null) => add({ type: 'info', title, message, projectData }), [add]);

//   const markRead = useCallback((id) => {
//     setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
//   }, []);

//   const markAllRead = useCallback(() => {
//     setItems((prev) => prev.map((n) => (n.read ? n : { ...n, read: true })));
//   }, []);

//   const remove = useCallback((id) => {
//     setItems((prev) => prev.filter((n) => n.id !== id));
//   }, []);

//   const unreadCount = useMemo(() => items.reduce((acc, n) => acc + (n.read ? 0 : 1), 0), [items]);

//   // Update document title and favicon badge when user or unread count changes
//   useEffect(() => {
//     const baseTitle = document.__sf_baseTitle || document.title || 'Smart Freelance';
//     // Persist base title on first run
//     if (!document.__sf_baseTitle) {
//       document.__sf_baseTitle = baseTitle;
//     }

//     const userSuffix = currentUser ? ` – ${currentUser}` : '';
//     document.title = unreadCount > 0
//       ? `(${unreadCount}) ${baseTitle}${userSuffix}`
//       : `${baseTitle}${userSuffix}`;

//     const setFavicon = (count) => {
//       // Ensure <link rel="icon"> exists
//       const ensureFaviconLink = () => {
//         let link = document.querySelector("link[rel='icon']");
//         if (!link) {
//           link = document.createElement('link');
//           link.setAttribute('rel', 'icon');
//           document.head.appendChild(link);
//         }
//         return link;
//       };

//       const link = ensureFaviconLink();

//       // If no unread, clear to a minimal emoji-based icon to avoid 404s
//       if (!count) {
//         // Simple gray dot as data URL
//         const size = 64;
//         const canvas = document.createElement('canvas');
//         canvas.width = size;
//         canvas.height = size;
//         const ctx = canvas.getContext('2d');
//         ctx.fillStyle = '#ffffff';
//         ctx.fillRect(0, 0, size, size);
//         ctx.fillStyle = '#6c757d';
//         ctx.beginPath();
//         ctx.arc(size / 2, size / 2, size * 0.18, 0, Math.PI * 2);
//         ctx.fill();
//         link.href = canvas.toDataURL('image/png');
//         return;
//       }

//       // Draw a bell-ish circle with red badge and count
//       const size = 64;
//       const canvas = document.createElement('canvas');
//       canvas.width = size;
//       canvas.height = size;
//       const ctx = canvas.getContext('2d');

//       // background
//       ctx.fillStyle = '#ffffff';
//       ctx.fillRect(0, 0, size, size);

//       // bell base (simple glyph replacement)
//       ctx.fillStyle = '#495057';
//       ctx.beginPath();
//       ctx.arc(size * 0.5, size * 0.55, size * 0.22, Math.PI, 0);
//       ctx.fill();
//       ctx.fillRect(size * 0.35, size * 0.40, size * 0.30, size * 0.20);
//       ctx.beginPath();
//       ctx.arc(size * 0.5, size * 0.78, size * 0.06, 0, Math.PI * 2);
//       ctx.fill();

//       // red badge
//       const badgeR = size * 0.18;
//       const badgeX = size * 0.72;
//       const badgeY = size * 0.20;
//       ctx.fillStyle = '#dc3545';
//       ctx.beginPath();
//       ctx.arc(badgeX, badgeY, badgeR, 0, Math.PI * 2);
//       ctx.fill();

//       // count text
//       ctx.fillStyle = '#ffffff';
//       ctx.font = `bold ${Math.round(size * 0.32)}px Arial`;
//       ctx.textAlign = 'center';
//       ctx.textBaseline = 'middle';
//       const countText = count > 99 ? '99+' : String(count);
//       ctx.fillText(countText, badgeX, badgeY + 1);

//       link.href = canvas.toDataURL('image/png');
//     };

//     setFavicon(unreadCount);
//   }, [unreadCount, currentUser]);

//   const value = useMemo(() => ({
//     items,
//     unreadCount,
//     add,
//     addSuccess,
//     addError,
//     addInfo,
//     markRead,
//     markAllRead,
//     remove,
//   }), [items, unreadCount, add, addSuccess, addError, addInfo, markRead, markAllRead, remove]);

//   return (
//     <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
//   );
// };


import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

const STORAGE_PREFIX = 'NOTIFICATIONS_V1';
const NotificationContext = createContext(null);

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};

export const NotificationProvider = ({ children }) => {
  const { currentUser,bidderId } = useAuth();
  const storageKey = useMemo(
    () => `${STORAGE_PREFIX}:${String(currentUser || 'DEFAULT')}:${String(bidderId ?? 'NO_BIDDER')}`,
    [currentUser, bidderId]
  );

  const getAllPersistedNotifications = useCallback(() => {
    try {
      const keys = Object.keys(localStorage).filter((k) => k && k.startsWith(`${STORAGE_PREFIX}:`));
      const all = keys.flatMap((k) => {
        try {
          const raw = localStorage.getItem(k);
          const parsed = raw ? JSON.parse(raw) : [];
          return Array.isArray(parsed) ? parsed.map((n) => ({ ...n, _storageKey: k })) : [];
        } catch {
          return [];
        }
      });
      // sort by createdAt desc
      all.sort((a, b) => (b?.createdAt || 0) - (a?.createdAt || 0));
      return all;
    } catch (err) {
      console.error('Failed to read all persisted notifications', err);
      return [];
    }
  }, []);

  const shouldPersist = useCallback((n) => {
    if (!n || n.type !== 'success') return false;
    if (n.persist === true || n.category === 'bid_success') return true;
    return n.title === 'Bid placed' || n.title === 'AutoBid completed';
  }, []);

  const [items, setItems] = useState([]);

  // Audio refs + previous count ref to play sound only on new notifications
  const audioRef = useRef(null);
  const prevCountRef = useRef(null);
  const initialLoadedRef = useRef(false);
  const audioUnlockedRef = useRef(false); // Track if audio is unlocked

  // Create audio element once and unlock on first user interaction
  useEffect(() => {
    try {
      // Audio file placed at public/sounds/notification.mp3
      audioRef.current = new Audio('/sounds/notification.mp3');
      audioRef.current.preload = 'auto';
      audioRef.current.volume = 0.7; // Set volume to 70%

      // Debug: Check if audio loads successfully
      audioRef.current.addEventListener('canplaythrough', () => {
        console.log('✅ Notification sound loaded successfully');
      });

      audioRef.current.addEventListener('error', (e) => {
        console.error('❌ Audio file failed to load:', e);
      });

      // Unlock audio on first user interaction (required by browser autoplay policies)
      const unlockAudio = () => {
        if (!audioUnlockedRef.current && audioRef.current) {
          audioRef.current.play()
            .then(() => {
              audioRef.current.pause();
              audioRef.current.currentTime = 0;
              audioUnlockedRef.current = true;
              console.log('🔊 Notification audio unlocked - sounds will now play');
            })
            .catch((err) => {
              console.warn('Audio unlock attempt:', err.message);
            });
        }
      };

      // Listen for any user interaction to unlock audio
      const events = ['click', 'keydown', 'touchstart'];
      events.forEach(event => {
        document.addEventListener(event, unlockAudio, { once: true });
      });

      return () => {
        // Cleanup event listeners
        events.forEach(event => {
          document.removeEventListener(event, unlockAudio);
        });
      };
    } catch (err) {
      console.warn('Failed to create audio element for notifications', err);
      audioRef.current = null;
    }
  }, []);

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

      // Initialize prevCountRef only after loading stored items so initial render won't trigger sound
      prevCountRef.current = hydrated.length;
      initialLoadedRef.current = true;
    } catch (err) {
      console.error('Failed to load notifications from storage', storageKey, err);
      setItems([]);
      prevCountRef.current = 0;
      initialLoadedRef.current = true;
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

  // Play sound when new notification(s) are added — only for bid-success style notifications
  useEffect(() => {
    // Don't run until initial load for current account completed
    if (!initialLoadedRef.current) return;

    const prev = typeof prevCountRef.current === 'number' ? prevCountRef.current : 0;
    const curr = Array.isArray(items) ? items.length : 0;

    if (curr > prev) {
      // New items are at the start (we prepend), so take the slice of newly added items
      const newCount = curr - prev;
      const newItems = items.slice(0, newCount);

      // Only trigger sound for bid-success notifications
      const hasBidSuccess = newItems.some((n) => {
        if (!n) return false;
        if (n.type !== 'success') return false;
        // Treat explicit category or recognized title as bid success
        if (n.category === 'bid_success') return true;
        if (typeof n.title === 'string' && (n.title === 'Bid placed' || n.title === 'AutoBid completed')) return true;
        return false;
      });

      if (hasBidSuccess && audioRef.current) {
        try {
          audioRef.current.currentTime = 0;
          const playPromise = audioRef.current.play();
          
          if (playPromise && typeof playPromise.then === 'function') {
            playPromise
              .then(() => {
                console.log('🔔 Notification sound played successfully');
              })
              .catch((err) => {
                // Autoplay might be blocked — don't treat as fatal
                console.warn('Notification sound play prevented:', err.message);
                console.info('💡 Click anywhere on the page to enable notification sounds');
              });
          }
        } catch (err) {
          console.warn('Error playing notification sound', err);
        }
      }
    }

    // Update previous count for next comparison
    prevCountRef.current = curr;
  }, [items]);

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
      // Ensure favicon link exists
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
    getAllPersistedNotifications,
  }), [items, unreadCount, add, addSuccess, addError, addInfo, markRead, markAllRead, remove,getAllPersistedNotifications]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

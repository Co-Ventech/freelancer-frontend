
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUsersStore } from '../store/useUsersStore';
import { getNotifications } from '../utils/api';

const STORAGE_PREFIX = 'NOTIFICATIONS_V1';
const NotificationContext = createContext(null);

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};

export const NotificationProvider = ({ children }) => {

  // get current auth info (was missing - caused ReferenceError)
  const { currentUser, bidderId } = useAuth();

  // include selected sub-user id in storage key so notifications are scoped per sub-user
  const selectedSubUser = useUsersStore((s) => s.getSelectedUser && s.getSelectedUser());
  const subUserIdForStorage = selectedSubUser?.document_id || selectedSubUser?.sub_user_id || selectedSubUser?.id || 'NO_SUB';
  const storageKey = useMemo(
    () => `${STORAGE_PREFIX}:${String(currentUser || 'DEFAULT')}:${String(bidderId ?? 'NO_BIDDER')}:${String(subUserIdForStorage)}`,
    [currentUser, bidderId, subUserIdForStorage]
  );
  const itemsRef = useRef([]);

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

  useEffect(() => { itemsRef.current = items; }, [items]);

  // Audio refs + previous count ref to play sound only on new notifications
  const audioRef = useRef(null);
  const prevCountRef = useRef(null);
  const initialLoadedRef = useRef(false);
  const audioUnlockedRef = useRef(false); // Track if audio is unlocked

  // Create audio element once and unlock on first user interaction
  useEffect(() => {

     // Only create audio when a user is present to avoid logs / attempts before login
    if (!currentUser) return undefined;

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
        // Cleanup event listeners and audio
        events.forEach(event => {
          document.removeEventListener(event, unlockAudio);
        });
        try {
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = '';
            audioRef.current = null;
          }
        } catch (e) { /* ignore */ }
      };
    } catch (err) {
      console.warn('Failed to create audio element for notifications', err);
      audioRef.current = null;
    }
  }, [currentUser]);

  // Load items whenever the account changes
  useEffect(() => {
    try {
      // mark that we're doing an initial load for this sub-user (prevent sound)
      initialLoadedRef.current = false;

      const raw = localStorage.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : [];
      const hydrated = Array.isArray(parsed) ? parsed.map((n) => {
        if (!n.createdAt) n.createdAt = Date.now();
        if (typeof n.read === 'undefined') n.read = !!n.is_read;
       return n;
     }).filter(n => shouldPersist(n)) : [];

      setItems(hydrated);

      // Initialize prevCountRef to unread count so initial render won't trigger sound
      prevCountRef.current = hydrated.filter((i) => !i.read).length;
      // mark initial load as complete for this sub-user

    } catch (err) {
      console.error('Failed to load notifications from storage', storageKey, err);
      setItems([]);
      prevCountRef.current = 0;
      initialLoadedRef.current = false;
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

  // Play sound when new UNREAD notification(s) are added — only for bid-success style notifications
  // useEffect(() => {
  //   // Don't run until initial load for current account completed
  //   if (!initialLoadedRef.current) return;

  //   const prevUnread = typeof prevCountRef.current === 'number' ? prevCountRef.current : 0;
  //   const currUnread = Array.isArray(items) ? items.filter(i => !i.read).length : 0;

  //   if (currUnread > prevUnread) {
  //     // Determine which incoming unread items are new by checking the head of items
  //     // We'll consider up to (currUnread - prevUnread) newest unread items
  //     const addedCount = currUnread - prevUnread;
  //     const newItems = items.filter(i => !i.read).slice(0, addedCount);
  //     const hasBidSuccess = newItems.some((n) => {
  //       if (!n) return false;
  //       if (n.type !== 'success') return false;
  //       if (n.category === 'bid_success') return true;
  //       if (typeof n.title === 'string' && (n.title === 'Bid placed' || n.title === 'AutoBid completed')) return true;
  //       return false;
  //     });

  //     if (hasBidSuccess && audioRef.current) {
  //       try {
  //         audioRef.current.currentTime = 0;
  //         const playPromise = audioRef.current.play();
  //         if (playPromise && typeof playPromise.then === 'function') {
  //           playPromise.catch((err) => {
  //             console.warn('Notification sound play prevented:', err.message);
  //           });
  //         }
  //       } catch (err) {
  //         console.warn('Error playing notification sound', err);
  //       }
  //     }
  //   }

  //   // Update previous unread count for next comparison
  //   prevCountRef.current = currUnread;
  // }, [items]);

  useEffect(() => {
    // Don't run until initial load for current account completed
    if (!initialLoadedRef.current) return;

    const prevUnread = typeof prevCountRef.current === 'number' ? prevCountRef.current : 0;
    const currUnread = Array.isArray(items) ? items.filter(i => !i.read).length : 0;

    if (currUnread > prevUnread) {
      // Determine which incoming unread items are new by checking the head of items
      // We'll consider up to (currUnread - prevUnread) newest unread items
      const addedCount = currUnread - prevUnread;
      const newItems = items.filter(i => !i.read).slice(0, addedCount);

      const hasBidSuccess = newItems.some((n) => {
        if (!n) return false;
        if (n.type !== 'success') return false;
        if (n.category === 'bid_success') return true;
        if (typeof n.title === 'string' && (n.title === 'Bid placed' || n.title === 'AutoBid completed')) return true;
        return false;
      });

      if (hasBidSuccess && audioRef.current) {
        try {
          // If audio hasn't been unlocked by a user interaction, attempt a muted-play unlock.
          // Many browsers allow play when muted; this often lets future unmuted plays succeed.
          const audio = audioRef.current;

          const tryUnlock = async () => {
            if (!audio) return false;
            if (audioUnlockedRef.current) return true;
            try {
              // ensure muted to increase chance of play success
              const prevMuted = audio.muted;
              audio.muted = true;
              audio.currentTime = 0;
              const p = audio.play();
              if (p && typeof p.then === 'function') {
                await p;
              }
              // pause immediately and restore muted flag
              audio.pause();
              audio.currentTime = 0;
              audio.muted = prevMuted;
              audioUnlockedRef.current = true;
              return true;
            } catch (err) {
              // unlock failed (likely autoplay block) — will still attempt unmuted play below and catch error
              console.warn('Audio unlock attempt failed:', err?.message || err);
              return false;
            }
          };

          (async () => {
            // try unlock if not unlocked yet
            if (!audioUnlockedRef.current) {
              await tryUnlock();
            }

            // Now attempt to play the notification sound normally (unmuted)
            try {
              audio.currentTime = 0;
              const playPromise = audio.play();
              if (playPromise && typeof playPromise.then === 'function') {
                playPromise.catch((err) => {
                  // still might be blocked — log and instruct user
                  console.warn('Notification sound play prevented:', err?.message || err);
                });
              }
            } catch (err) {
              console.warn('Error playing notification sound', err);
            }
          })();
        } catch (err) {
          console.warn('Error preparing notification sound', err);
        }
      }
    }

    // Update previous unread count for next comparison
    prevCountRef.current = currUnread;
  }, [items]);

 // Always add incoming notification to the in-memory list so NotificationBell shows it.
  // Persist only those matching shouldPersist (persisted storage is handled in the effect below).
  const add = useCallback((notif) => {
    const id = notif.id || Math.random().toString(36).slice(2);
    const createdAt = notif.createdAt || Date.now();
    const item = { id, createdAt, read: false, ...notif };

    setItems((prev) => [item, ...prev].slice(0, 200));
    return id;
  }, []);

  const addSuccess = useCallback((title, message, projectData = null) => add({ type: 'success', title, message, projectData }), [add]);
  const addError = useCallback((title, message, projectData = null) => add({ type: 'error', title, message, projectData }), [add]);
  const addInfo = useCallback((title, message, projectData = null) => add({ type: 'info', title, message, projectData }), [add]);

  const playNotificationSoundFor = useCallback(async (incomingItems) => {
    if (!audioRef.current || !Array.isArray(incomingItems) || incomingItems.length === 0) return;
    // only play for success-style notifications (adjust criteria as needed)
    const shouldPlay = incomingItems.some((n) => n && (n.isSuccess || n.type === 'success' || n.category === 'bid_success' || (n.title && /bid/i.test(n.title))));
    if (!shouldPlay) return;

    const audio = audioRef.current;

    const tryUnlock = async () => {
      if (audioUnlockedRef.current) return true;
      try {
        const prevMuted = audio.muted;
        audio.muted = true;
        audio.currentTime = 0;
        const p = audio.play();
        if (p && typeof p.then === 'function') await p;
        audio.pause();
        audio.currentTime = 0;
        audio.muted = prevMuted;
        audioUnlockedRef.current = true;
        return true;
      } catch (err) {
        // unlock failed
        return false;
      }
    };

    try {
      // Only play after initial load to avoid noise on app start
      if (!initialLoadedRef.current) return;
      await tryUnlock();
      // attempt to play unmuted (best effort)
      try {
        audio.currentTime = 0;
        const p = audio.play();
        if (p && typeof p.then === 'function') {
          p.catch((err) => {
            // swallow autoplay block errors
            console.warn('Notification audio blocked:', err?.message || err);
          });
        }
      } catch (err) {
        console.warn('Audio play error', err);
      }
    } catch (err) {
      // ignore
    }
  }, []);

   // Poll backend every 10s for notifications for the selected sub-user
  useEffect(() => {
    let mounted = true;
    let intervalId = null;

        const fetchAndMerge = async () => {
      if (!selectedSubUser) {
        // clear in-memory items for no-selection; keep persisted storage untouched
        if (mounted) setItems([]);
        return;
      }

      try {
        const res = await getNotifications(subUserIdForStorage);
        if (!(res.status >= 200 && res.status < 300)) {
          // Even if the request failed, ensure we mark initial load complete so we don't block future detection.
          if (!initialLoadedRef.current) {
            initialLoadedRef.current = true;
            prevCountRef.current = itemsRef.current ? itemsRef.current.filter(i => !i.read).length : 0;
          }
          return;
        }
        const data = res?.data?.data || [];

        // normalize incoming notifications
        const incoming = Array.isArray(data) ? data.map((n) => {
          const id = n.id || `${n.project_id || ''}_${n.created_at?._seconds || Date.now()}`;
          const createdAt = (n.created_at && typeof n.created_at._seconds === 'number') ? n.created_at._seconds * 1000 : (n.createdAt || Date.now());
          return {
            id,
            title: n.title || '',
            message: n.description || '',
            type: n.isSuccess ? 'success' : 'info',
            isSuccess: !!n.isSuccess,
            projectData: n.project_id ? { projectId: n.project_id } : null,
            createdAt,
            read: !!n.is_read,
          };
        }) : [];

        const existingIds = new Set(itemsRef.current.map(i => i.id));
        const newItems = incoming.filter(i => !existingIds.has(i.id));

        if (!initialLoadedRef.current) {
          // First remote poll for this sub-user: merge incoming and set initialLoadedRef but DO NOT play sound.
          if (newItems.length > 0 && mounted) {
            const mapped = newItems.map((n) => ({
              id: n.id,
              title: n.title || '',
              message: n.message || n.description || '',
              type: n.type || (n.isSuccess ? 'success' : 'info'),
              isSuccess: !!n.isSuccess,
              projectData: n.projectData || n.project_id ? { projectId: n.project_id } : null,
              createdAt: n.createdAt || Date.now(),
              read: !!n.read,
            }));

            setItems((prev) => {
              const existing = new Set(prev.map(i => i.id));
              const toPrepend = mapped.filter(m => !existing.has(m.id));
              const merged = [...toPrepend, ...prev].slice(0, 200);
              return merged;
            });
          }
          // Mark initial load done and sync unread counter
          initialLoadedRef.current = true;
          prevCountRef.current = itemsRef.current ? itemsRef.current.filter(i => !i.read).length : (incoming.filter(i => !i.read).length);
        } else if (newItems.length > 0 && mounted) {
          // Subsequent polls: only now play sound for new incoming mapped items
          const mapped = newItems.map((n) => ({
            id: n.id,
            title: n.title || '',
            message: n.message || n.description || '',
            type: n.type || (n.isSuccess ? 'success' : 'info'),
            isSuccess: !!n.isSuccess,
            projectData: n.projectData || n.project_id ? { projectId: n.project_id } : null,
            createdAt: n.createdAt || Date.now(),
            read: !!n.read,
          }));

          setItems((prev) => {
            const existing = new Set(prev.map(i => i.id));
            const toPrepend = mapped.filter(m => !existing.has(m.id));
            const merged = [...toPrepend, ...prev].slice(0, 200);
            return merged;
          });

          (async () => {
            try {
              await playNotificationSoundFor(mapped);
            } catch (e) {
              console.warn('playNotificationSoundFor error', e);
            }
          })();

          // update prev unread count
          prevCountRef.current = itemsRef.current ? itemsRef.current.filter(i => !i.read).length : 0;
        }
      } catch (err) {
        console.warn('Failed to poll notifications:', err);
        // ensure initial load is marked complete to avoid indefinite blocking
        if (!initialLoadedRef.current) {
          initialLoadedRef.current = true;
          prevCountRef.current = itemsRef.current ? itemsRef.current.filter(i => !i.read).length : 0;
        }
      }
    };
      
  
    // run immediately and then every 10s
    fetchAndMerge();
    intervalId = setInterval(fetchAndMerge, 20 * 1000);

    return () => {
      mounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [subUserIdForStorage, selectedSubUser, addSuccess, addInfo, playNotificationSoundFor]);



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

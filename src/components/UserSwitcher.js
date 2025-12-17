
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUsersStore } from '../store/useUsersStore';
import { useFirebaseAuth } from '../contexts/FirebaseAuthContext';

const UserSwitcher = ({ parentUid = null, onLogout = null }) => {
  const navigate = useNavigate();
  const { logout: fbLogout } = useFirebaseAuth();
  const users = useUsersStore((s) => s.users ?? []);
  // store's selectedKey is the canonical value (sub_username or id string)
  const selectedKey = useUsersStore((s) => s.selectedKey ?? '');
  // many stores expose a getter; keep it for display convenience
  const selectedFromStore = useUsersStore((s) =>
    typeof s.getSelectedUser === 'function' ? s.getSelectedUser() : null
  );
  // selection action provided by the store - expects a key string (sub_username or id)
  const selectUserAction = useUsersStore((s) => s.selectUser ?? null);

  const [open, setOpen] = useState(false);
  const [showSwitchList, setShowSwitchList] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target)) {
        setOpen(false);
        setShowSwitchList(false);
      }
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  const handleToggle = () => setOpen((s) => !s);

  const handleSelectUser = (key) => {
    if (!key) return;
    // key should match store.selectedKey shape: sub_username or String(id)
    // find user object for logging/fallback
    const u = users.find((x) => (x.sub_username && x.sub_username === key) || String(x.id) === String(key) || String(x.user_bid_id) === String(key));
    if (typeof selectUserAction === 'function') {
      try {
        selectUserAction(key);
      } catch (e) {
        console.warn('selectUserAction failed when passing key, attempting fallback', e);
        // fallback to localStorage
        if (u) try { localStorage.setItem('SF_SELECTED_SUBUSER', JSON.stringify(u)); } catch (err) {}
      }
    } else {
      // fallback: store selection in localStorage so other components can read it
      if (u) try { localStorage.setItem('SF_SELECTED_SUBUSER', JSON.stringify(u)); } catch (err) {}
      console.warn('No store action found to switch user; saved selection in localStorage as fallback.');
    }
    setOpen(false);
    setShowSwitchList(false);
  };

  const handleMoreSettings = () => {
    const id =
      selectedFromStore?.document_id ??
      selectedFromStore?.sub_user_id ??
      selectedFromStore?.user_bid_id ??
      selectedFromStore?.id ??
      null;
    const q = id ? `?selected=${encodeURIComponent(id)}` : '';
    // open More Settings page for the selected sub-user
    navigate(`/more-settings${q}`);
    // navigate(`/update-profile${q}`);
    setOpen(false);
  };

  const handleLogout = async () => {
    setOpen(false);
    if (typeof onLogout === 'function') {
      try { await onLogout(); return; } catch (e) { console.warn(e); }
    }
    if (typeof fbLogout === 'function') {
      try { await fbLogout(); } catch (e) { console.warn('Firebase logout failed', e); }
    }
  };

  const displayLabel =
    selectedFromStore?.sub_username ??
    selectedFromStore?.username ??
    selectedFromStore?.name ??
    selectedFromStore?.displayName ??
    'Switch account';

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        onClick={handleToggle}
        className="px-3 py-1 bg-white border rounded flex items-center gap-2"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <span className="text-sm">{displayLabel}</span>
        <svg className="w-3 h-3 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
          <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white border rounded shadow-lg z-50 p-2">
          <button
            onClick={() => setShowSwitchList((s) => !s)}
            className="w-full text-left px-2 py-2 rounded hover:bg-gray-100"
          >
            Switch account
          </button>

          {showSwitchList && (
            <div className="px-2 py-2">
              <select
                onChange={(e) => handleSelectUser(e.target.value)}
                className="w-full border rounded px-2 py-1"
                value={String(selectedKey || '')}
              >
                <option value="">Select account...</option>
                {users.map((u) => {
                  const key = u.sub_username || String(u.id || u.user_bid_id || u.document_id || '');
                  const label = u.sub_username ?? u.username ?? u.name ?? `User ${key}`;
                  return (
                    <option key={String(key)} value={String(key)}>
                      {label}
                    </option>
                  );
                })}
              </select>
              <div className="mt-2 text-xs text-gray-500"></div>
            </div>
          )}

          <button onClick={handleMoreSettings} className="w-full text-left px-2 py-2 rounded hover:bg-gray-100">
            More settings
          </button>

          <button onClick={handleLogout} className="w-full text-left px-2 py-2 rounded hover:bg-gray-100 text-red-600">
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default UserSwitcher;
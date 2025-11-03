import {create} from 'zustand';
import axios from 'axios';
import { API_BASE } from '../utils/apiUtils';

// Zustand store for managing sub-users fetched from backend
export const useUsersStore = create((set, get) => {
  // hydrate selectedKey from localStorage
  const persistedKey = (() => {
    try {
      return localStorage.getItem('SELECTED_SUB_USER') || null;
    } catch {
      return null;
    }
  })();

  return {
    users: [],
    selectedKey: persistedKey,
    loading: false,
    error: null,

  
  // Fetch sub-users from backend and populate store
  fetchUsers: async (parentUid) => {
    set({ loading: true, error: null });
    try {
      if (!parentUid) {
        throw new Error('parentUid is required to fetch sub-users');
      }
      const url = `${API_BASE.replace(/\/$/, '')}/sub-users?uid=${encodeURIComponent(parentUid)}`;
      const res = await axios.get(url, { validateStatus: () => true });

      if (!(res.status >= 200 && res.status < 300)) {
        const msg = res?.data?.message || `Failed to fetch sub-users: ${res.status}`;
        set({ error: msg, loading: false });
        throw new Error(msg);
      }

      const data = res?.data?.data || res?.data || [];
      const users = Array.isArray(data) ? data : [];

         const currentSelected = get().selectedKey;
       const selectedKey = currentSelected || (users[0] ? (users[0].sub_username || String(users[0].id)) : null);

      set({ users, selectedKey, loading: false });
      try { if (selectedKey) localStorage.setItem('SELECTED_SUB_USER', selectedKey); } catch {}
      return users;
    } catch (err) {
      console.error('Failed to fetch sub-users', err);
      set({ error: err?.message || String(err), loading: false });
      throw err;
    }
  },

  // Select a user by key (sub_username or id string)
  selectUser: (key) => {
    set({ selectedKey: key });
    try { if (key) localStorage.setItem('SELECTED_SUB_USER', key); else localStorage.removeItem('SELECTED_SUB_USER'); } catch {}
  },

  // Helper to get currently selected user object
  getSelectedUser: () => {
    const { users, selectedKey } = get();
    if (!selectedKey) return null;
    return users.find(u => (u.sub_username || String(u.id)) === selectedKey) || null;
  }
  };
});
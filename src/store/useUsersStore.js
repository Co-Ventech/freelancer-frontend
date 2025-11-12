import { create } from 'zustand';
import { getSubUsers, updateSubUser as apiUpdateSubUser } from '../utils/api';

// Zustand store for managing sub-users fetched from backend
export const useUsersStore = create((set, get) => {
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

    fetchUsers: async (parentUid, idToken = null) => {
      set({ loading: true, error: null });
      try {
        if (!parentUid) throw new Error('parentUid is required to fetch sub-users');
        const res = await getSubUsers(parentUid, idToken);
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

    // update sub-user (PATCH) and update local store on success
    updateSubUser: async (subUserIdOrObj, payload = {}, idToken = null) => {
      set({ loading: true, error: null });
      try {
        // resolve id: allow passing full user object or id string
        let subUserId = subUserIdOrObj;
        if (typeof subUserIdOrObj === 'object' && subUserIdOrObj !== null) {
          subUserId = subUserIdOrObj.document_id || subUserIdOrObj.sub_user_id || subUserIdOrObj.id;
        }
        if (!subUserId) {
          throw new Error('subUserId could not be resolved for update');
        }

        console.log(`[useUsersStore] updating sub-user ${subUserId} with`, payload);

        // optimistic update locally (will be replaced by server response)
        set((state) => ({
          users: state.users.map(u => {
            const match = String(u.document_id || u.sub_user_id || u.id) === String(subUserId);
            return match ? { ...u, ...payload } : u;
          }),
        }));

        const res = await apiUpdateSubUser(subUserId, payload, idToken);

        // merge server returned data if present
        const updated = res?.data?.data || res?.data || null;
        set((state) => ({
          users: state.users.map((u) => {
            const match = String(u.document_id || u.sub_user_id || u.id) === String(subUserId);
            return match ? { ...u, ...(updated || {}), ...payload } : u;
          }),
          loading: false,
        }));

        // emit event for UI listeners
        try {
          console.log(`[useUsersStore] sub-user updated => ${subUserId}`, payload);
          if (typeof window !== 'undefined' && window.CustomEvent) {
            window.dispatchEvent(new CustomEvent('subUserUpdated', { detail: { subUserId, payload } }));
          }
        } catch (e) { /* non-blocking */ }

        return updated;
      } catch (err) {
        console.error('Failed to update sub-user', err);
        // revert optimistic update by re-fetching single list (simple approach)
        try {
          const parentUid = get().parentUid || null;
          if (parentUid) await get().fetchUsers(parentUid);
        } catch (e) { /* ignore */ }
        set({ error: err?.message || String(err), loading: false });
        throw err;
      }
    },

    selectUser: (key) => {
      set({ selectedKey: key });
      try { if (key) localStorage.setItem('SELECTED_SUB_USER', key); else localStorage.removeItem('SELECTED_SUB_USER'); } catch {}
      try {
        console.log(`[useUsersStore] sub-user selected => ${key}`);
        if (typeof window !== 'undefined' && window.CustomEvent) {
          window.dispatchEvent(new CustomEvent('subUserChanged', { detail: { selectedKey: key } }));
        }
      } catch (e) {
        console.warn('Failed to emit subUserChanged event', e);
      }
    },

    getSelectedUser: () => {
      const { users, selectedKey } = get();
      if (!selectedKey) return null;
      return users.find(u => (u.sub_username || String(u.id)) === selectedKey) || null;
    }
  };
});
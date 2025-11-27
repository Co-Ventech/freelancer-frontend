import { create } from 'zustand';
import { getSubUsers, updateSubUser as apiUpdateSubUser } from '../utils/api';

/* lightweight shallow compare for objects */
const shallowEqual = (a, b) => {
  if (a === b) return true;
  if (!a || !b) return false;
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  for (let i = 0; i < aKeys.length; i++) {
    if (a[aKeys[i]] !== b[aKeys[i]]) return false;
  }
  return true;
};

/* compare user arrays shallowly (order assumed stable) */
const usersShallowEqual = (arrA = [], arrB = []) => {
  if (arrA === arrB) return true;
  if (!Array.isArray(arrA) || !Array.isArray(arrB)) return false;
  if (arrA.length !== arrB.length) return false;
  for (let i = 0; i < arrA.length; i++) {
    const a = arrA[i];
    const b = arrB[i];
    if (a === b) continue;
    if (!shallowEqual(a, b)) return false;
  }
  return true;
};

/* helper to detect plain object (not arrays) */
const isPlainObject = (v) => v && typeof v === 'object' && !Array.isArray(v);

/* merge multiple plain-object sources into a new shallow object */
const mergeNestedMaps = (existing = {}, ...sources) => {
  const out = { ...(existing || {}) };
  for (const s of sources) {
    if (!isPlainObject(s)) continue;
    Object.keys(s).forEach((k) => { out[k] = s[k]; });
  }
  return out;
};

export const useUsersStore = create((set, get) => {
  const persistedKey = (() => {
    try { return localStorage.getItem('SELECTED_SUB_USER') || null; } catch { return null; }
  })();

  return {
    users: [],
    selectedKey: persistedKey,
    parentUid: null,
    loading: false,
    error: null,

    fetchUsers: async (parentUid, idToken = null) => {
      const prevLoading = get().loading;
      if (!prevLoading) set({ loading: true, error: null });

      try {
        if (!parentUid) throw new Error('parentUid is required to fetch sub-users');
        if (get().parentUid !== parentUid) set({ parentUid });

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

        const prevState = get();
        const shouldUpdateUsers = !usersShallowEqual(prevState.users, users);
        const shouldUpdateSelected = prevState.selectedKey !== selectedKey;

        const nextState = {};
        if (shouldUpdateUsers) nextState.users = users;
        if (shouldUpdateSelected) nextState.selectedKey = selectedKey;
        nextState.loading = false;
        nextState.error = null;

        // set only if changes
        if (Object.keys(nextState).length > 1 || shouldUpdateUsers || shouldUpdateSelected) {
          set(nextState);
        } else {
          set({ loading: false });
        }

        try { if (selectedKey) localStorage.setItem('SELECTED_SUB_USER', selectedKey); } catch {}
        return users;
      } catch (err) {
        set({ error: err?.message || String(err), loading: false });
        throw err;
      }
    },

    updateSubUser: async (subUserIdOrObj, payload = {}, idToken = null) => {
      // resolve id
      let subUserId = subUserIdOrObj;
      if (typeof subUserIdOrObj === 'object' && subUserIdOrObj !== null) {
        subUserId = subUserIdOrObj.document_id || subUserIdOrObj.sub_user_id || subUserIdOrObj.id;
      }
      if (!subUserId) throw new Error('subUserId required');

      // set loading flag once
      const wasLoading = get().loading;
      if (!wasLoading) set({ loading: true, error: null });

      // OPTIMISTIC: merge nested plain-object fields (e.g., project_filters, client_filters, etc.)
      const prevUsers = get().users || [];
      const optimisticUsers = prevUsers.map((u) => {
        const id = String(u.document_id || u.sub_user_id || u.id);
        if (id !== String(subUserId)) return u;

        // shallow merge top-level, but for any plain-object fields in payload, merge them with existing
        let merged = { ...u, ...payload };

        Object.keys(payload || {}).forEach((key) => {
          const incoming = payload[key];
          const existing = u[key];
          if (isPlainObject(incoming) && isPlainObject(existing)) {
            merged = { ...merged, [key]: mergeNestedMaps(existing, incoming) };
          } else {
            // arrays or primitives - just set incoming (already handled by ...payload)
          }
        });

        return merged;
      });

      if (!usersShallowEqual(prevUsers, optimisticUsers)) {
        set({ users: optimisticUsers });
      }

      try {
        const res = await apiUpdateSubUser(subUserId, payload, idToken);
        const serverData = res?.data?.data || res?.data || null;

        // merge server response with current users and set only if changed
        const currentUsers = get().users || [];
        const mergedUsers = currentUsers.map((u) => {
          const id = String(u.document_id || u.sub_user_id || u.id);
          if (id !== String(subUserId)) return u;

          // start with current user, then apply serverData and payload; merge plain-object nested fields
          let merged = { ...u, ...(serverData || {}), ...payload };

          // collect keys that may be plain objects from serverData or payload or existing user
          const candidateKeys = new Set([
            ...Object.keys(u || {}),
            ...Object.keys(payload || {}),
            ...(serverData ? Object.keys(serverData) : []),
          ]);

          candidateKeys.forEach((key) => {
            const existingVal = u[key];
            const payloadVal = payload ? payload[key] : undefined;
            const serverVal = serverData ? serverData[key] : undefined;

            // if any of these is a plain object, do a shallow merge: existing <- payload <- server
            if (isPlainObject(existingVal) || isPlainObject(payloadVal) || isPlainObject(serverVal)) {
              merged = {
                ...merged,
                [key]: mergeNestedMaps(
                  isPlainObject(existingVal) ? existingVal : {},
                  isPlainObject(payloadVal) ? payloadVal : {},
                  isPlainObject(serverVal) ? serverVal : {}
                ),
              };
            }
          });

          return merged;
        });

        if (!usersShallowEqual(currentUsers, mergedUsers)) {
          set({ users: mergedUsers, loading: false });
        } else {
          set({ loading: false });
        }

        return serverData;
      } catch (err) {
        // on error, revert by re-fetching if possible (safe)
        const parentUid = get().parentUid || null;
        if (parentUid) {
          try { await get().fetchUsers(parentUid); } catch (_) { /* ignore */ }
        }
        set({ error: err?.message || String(err), loading: false });
        throw err;
      }
    },

    selectUser: (key) => {
      const prevKey = get().selectedKey;
      if (prevKey === key) return;
      set({ selectedKey: key });
      try { if (key) localStorage.setItem('SELECTED_SUB_USER', key); } catch {}
    },

    getSelectedUser: () => {
      const { users, selectedKey } = get();
      if (!selectedKey) return null;
      return users.find(u => (u.sub_username || String(u.id)) === selectedKey) || null;
    }
  };
});
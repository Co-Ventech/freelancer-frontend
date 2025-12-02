import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { getSubUsers, updateSubUser as apiUpdateSubUser } from '../utils/api';

const DEFAULT_TEMPLATE_CATEGORIES = [
  { name: 'Greetings', alwaysInclude: true },
  { name: 'Introduction', alwaysInclude: true },
  { name: 'Skills', alwaysInclude: true },
  { name: 'Portfolio', alwaysInclude: true },
  { name: 'Closing line', alwaysInclude: true },
  { name: 'Signature', alwaysInclude: true },
];

const isPlainObject = (v) => v && typeof v === 'object' && !Array.isArray(v);
const mergeNestedMaps = (existing = {}, ...sources) => {
  const out = { ...(existing || {}) };
  for (const s of sources) {
    if (!isPlainObject(s)) continue;
    Object.keys(s).forEach((k) => { out[k] = s[k]; });
  }
  return out;
};
const shallowEqual = (a = {}, b = {}) => {
  if (a === b) return true;
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  for (let i = 0; i < aKeys.length; i++) {
    if (a[aKeys[i]] !== b[aKeys[i]]) return false;
  }
  return true;
};
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


const findUserIndexById = (users = [], subUserIdOrKey) => {
  if (!Array.isArray(users) || typeof subUserIdOrKey === 'undefined' || subUserIdOrKey === null) return -1;
  const sid = String(subUserIdOrKey);
  return users.findIndex((u) => {
    const idCandidates = [
      u.document_id, u.documentId, u.sub_user_id, u.subUserId, u.id, u._id,
      u.sub_username, u.subUsername, u.username, u.email,
    ];
    return idCandidates.some((c) => typeof c !== 'undefined' && c !== null && String(c) === sid);
  });
};

// resolve canonical id to use with API: prefer document_id, then sub_user_id, then id
const resolveCanonicalUserId = (user = {}) => {
  return user.document_id || user.sub_user_id || user.id || null;
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
    /* SUB-USERS */
    

    fetchUsers: async (parentUid, idToken = null) => {
      if (!parentUid) throw new Error('parentUid is required to fetch sub-users');
      set({ loading: true, error: null });
      try {
        const res = await getSubUsers(parentUid, idToken);
        if (!(res.status >= 200 && res.status < 300)) {
          const msg = res?.data?.message || `Failed to fetch sub-users: ${res.status}`;
          set({ error: msg, loading: false });
          throw new Error(msg);
        }
        const data = res?.data?.data || res?.data || [];
        const users = Array.isArray(data) ? data : [];

        const currentSelected = get().selectedKey;
        const defaultSelected = users[0] ? (users[0].sub_username || users[0].sub_user_id || String(users[0].id)) : null;
        const selectedKey = currentSelected || defaultSelected;

        const prevState = get();
        const shouldUpdateUsers = !usersShallowEqual(prevState.users, users);
        const shouldUpdateSelected = prevState.selectedKey !== selectedKey;

        const nextState = {};
        if (shouldUpdateUsers) nextState.users = users;
        if (shouldUpdateSelected) nextState.selectedKey = selectedKey;
        nextState.loading = false;
        nextState.error = null;

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
        subUserId = resolveCanonicalUserId(subUserIdOrObj);
      }
      if (!subUserId) throw new Error('subUserId required');

      const wasLoading = get().loading;
      if (!wasLoading) set({ loading: true, error: null });

      // optimistic update: merge nested plain objects
      const prevUsers = get().users || [];
      const optimisticUsers = prevUsers.map((u) => {
        const id = resolveCanonicalUserId(u);
        if (!id || String(id) !== String(subUserId)) return u;

        let merged = { ...u, ...payload };
        Object.keys(payload || {}).forEach((key) => {
          const incoming = payload[key];
          const existing = u[key];
          if (isPlainObject(incoming) && isPlainObject(existing)) {
            merged = { ...merged, [key]: mergeNestedMaps(existing, incoming) };
          }
        });
        return merged;
      });

      if (!usersShallowEqual(prevUsers, optimisticUsers)) set({ users: optimisticUsers });

      try {
        const res = await apiUpdateSubUser(subUserId, payload, idToken);
        const serverData = res?.data?.data || res?.data || null;

        // reconcile with store
        const currentUsers = get().users || [];
        const mergedUsers = currentUsers.map((u) => {
          const id = resolveCanonicalUserId(u);
          if (!id || String(id) !== String(subUserId)) return u;

          let merged = { ...u, ...(serverData || {}), ...payload };

          const candidateKeys = new Set([
            ...Object.keys(u || {}),
            ...Object.keys(payload || {}),
            ...(serverData ? Object.keys(serverData) : []),
          ]);

          candidateKeys.forEach((key) => {
            const existingVal = u[key];
            const payloadVal = payload ? payload[key] : undefined;
            const serverVal = serverData ? serverData[key] : undefined;
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
        // revert by re-fetching users if possible
        const parentUid = get().parentUid || null;
        if (parentUid) {
          try { await get().fetchUsers(parentUid); } catch (_) { /* ignore */ }
        }
        set({ error: err?.message || String(err), loading: false });
        throw err;
      }
    },

    /* TEMPLATE CATEGORIES */
    loadTemplateCategories: async (subUserIdOrKey) => {
      if (!subUserIdOrKey) return [];
      const users = get().users || [];
      let idx = findUserIndexById(users, subUserIdOrKey);
      if (idx === -1 && get().selectedKey) idx = findUserIndexById(users, get().selectedKey);

      let categories = [];
      if (idx !== -1) categories = Array.isArray(users[idx].template_categories) ? [...users[idx].template_categories] : [];

      if (!Array.isArray(categories) || categories.length === 0) {
        const seeded = DEFAULT_TEMPLATE_CATEGORIES.map((c, i) => ({
          id: uuidv4(),
          name: c.name,
          alwaysInclude: c.alwaysInclude,
          order: i,
        }));
        const userObj = idx !== -1 ? users[idx] : null;
        const canonicalId = userObj ? resolveCanonicalUserId(userObj) : null;

        if (canonicalId) {
          try {
            await apiUpdateSubUser(canonicalId, { template_categories: seeded });
            const nextUsers = [...users];
            nextUsers[idx] = { ...nextUsers[idx], template_categories: seeded };
            set({ users: nextUsers });
            return seeded;
          } catch (err) {
            console.error('Failed to persist seeded template categories', err);
            return seeded;
          }
        }
        return seeded;
      }

      const normalized = [...categories].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((c, i) => ({ ...c, order: i, id: c.id || uuidv4() }));
      if (idx !== -1 && JSON.stringify(normalized) !== JSON.stringify(categories)) {
        try {
          const canonicalId = resolveCanonicalUserId(users[idx]);
          if (canonicalId) {
            await apiUpdateSubUser(canonicalId, { template_categories: normalized });
            const nextUsers = [...users];
            nextUsers[idx] = { ...nextUsers[idx], template_categories: normalized };
            set({ users: nextUsers });
          }
        } catch (err) { /* ignore */ }
      }
      return normalized;
    },

    addTemplateCategory: async (subUserIdOrKey, payload) => {
      if (!subUserIdOrKey || !payload) throw new Error('subUserId & payload required');
      const users = get().users || [];
      const idx = findUserIndexById(users, subUserIdOrKey);
      if (idx === -1) throw new Error('Sub-user not found in store');

      const existing = Array.isArray(users[idx].template_categories) ? [...users[idx].template_categories] : [];
      const newCat = { id: uuidv4(), name: String(payload.name || 'Untitled'), alwaysInclude: !!payload.alwaysInclude, order: existing.length };
      const next = [...existing, newCat];

      const canonicalId = resolveCanonicalUserId(users[idx]);
      if (!canonicalId) throw new Error('Cannot resolve canonical sub-user id to persist');

      await apiUpdateSubUser(canonicalId, { template_categories: next });
      const nextUsers = [...users];
      nextUsers[idx] = { ...nextUsers[idx], template_categories: next };
      set({ users: nextUsers });
      return newCat;
    },

    updateTemplateCategory: async (subUserIdOrKey, categoryId, patch) => {
      if (!subUserIdOrKey || !categoryId) throw new Error('subUserId & categoryId required');
      const users = get().users || [];
      const idx = findUserIndexById(users, subUserIdOrKey);
      if (idx === -1) throw new Error('Sub-user not found in store');

      const existing = Array.isArray(users[idx].template_categories) ? [...users[idx].template_categories] : [];
      const next = existing.map((c) => (c.id === categoryId ? { ...c, ...patch } : c));

      const canonicalId = resolveCanonicalUserId(users[idx]);
      if (!canonicalId) throw new Error('Cannot resolve canonical sub-user id to persist');

      await apiUpdateSubUser(canonicalId, { template_categories: next });
      const nextUsers = [...users];
      nextUsers[idx] = { ...nextUsers[idx], template_categories: next };
      set({ users: nextUsers });
      return next.find((c) => c.id === categoryId);
    },

    deleteTemplateCategory: async (subUserIdOrKey, categoryId) => {
      if (!subUserIdOrKey || !categoryId) throw new Error('subUserId & categoryId required');
      const users = get().users || [];
      const idx = findUserIndexById(users, subUserIdOrKey);
      if (idx === -1) throw new Error('Sub-user not found in store');

      const existing = Array.isArray(users[idx].template_categories) ? [...users[idx].template_categories] : [];
      const next = existing.filter((c) => c.id !== categoryId).map((c, i) => ({ ...c, order: i }));

      const canonicalId = resolveCanonicalUserId(users[idx]);
      if (!canonicalId) throw new Error('Cannot resolve canonical sub-user id to persist');

      await apiUpdateSubUser(canonicalId, { template_categories: next });
      const nextUsers = [...users];
      nextUsers[idx] = { ...nextUsers[idx], template_categories: next };
      set({ users: nextUsers });
      return true;
    },

    moveCategoryUp: async (subUserIdOrKey, categoryId) => {
      if (!subUserIdOrKey || !categoryId) return false;
      const users = get().users || [];
      const idx = findUserIndexById(users, subUserIdOrKey);
      if (idx === -1) return false;

      const existing = Array.isArray(users[idx].template_categories) ? [...users[idx].template_categories].sort((a,b) => (a.order||0)-(b.order||0)) : [];
      const i = existing.findIndex((c) => c.id === categoryId);
      if (i <= 0) return false;

      const next = [...existing];
      [next[i-1], next[i]] = [next[i], next[i-1]];
      const reindexed = next.map((c, j) => ({ ...c, order: j }));

      const canonicalId = resolveCanonicalUserId(users[idx]);
      if (!canonicalId) return false;
      await apiUpdateSubUser(canonicalId, { template_categories: reindexed });

      const nextUsers = [...users];
      nextUsers[idx] = { ...nextUsers[idx], template_categories: reindexed };
      set({ users: nextUsers });
      return true;
    },

    moveCategoryDown: async (subUserIdOrKey, categoryId) => {
      if (!subUserIdOrKey || !categoryId) return false;
      const users = get().users || [];
      const idx = findUserIndexById(users, subUserIdOrKey);
      if (idx === -1) return false;

      const existing = Array.isArray(users[idx].template_categories) ? [...users[idx].template_categories].sort((a,b) => (a.order||0)-(b.order||0)) : [];
      const i = existing.findIndex((c) => c.id === categoryId);
      if (i === -1 || i >= existing.length - 1) return false;

      const next = [...existing];
      [next[i], next[i+1]] = [next[i+1], next[i]];
      const reindexed = next.map((c, j) => ({ ...c, order: j }));

      const canonicalId = resolveCanonicalUserId(users[idx]);
      if (!canonicalId) return false;
      await apiUpdateSubUser(canonicalId, { template_categories: reindexed });

      const nextUsers = [...users];
      nextUsers[idx] = { ...nextUsers[idx], template_categories: reindexed };
      set({ users: nextUsers });
      return true;
    },

    /* TEMPLATES: add/load/update/delete/duplicate for per-sub-user templates */
    loadTemplates: async (subUserIdOrKey) => {
     if (!subUserIdOrKey) return [];
      const users = get().users || [];
      const idx = findUserIndexById(users, subUserIdOrKey);
      if (idx === -1) return [];
      const templates = Array.isArray(users[idx].templates) ? [...users[idx].templates] : [];
      const categories = Array.isArray(users[idx].template_categories) ? users[idx].template_categories : [];
      // Normalize and ensure each template carries categoryAlwaysInclude
      const normalized = templates.map((t, i) => {
        const id = t.id || uuidv4();
        const order = typeof t.order === 'number' ? t.order : i;
        // try find category by id first then by name
        const catId = t.categoryId || t.category_id || null;
        let cat = null;
        if (catId) cat = categories.find((c) => String(c.id) === String(catId));
        if (!cat && (t.categoryName || t.category_name || t.category)) {
          const name = String(t.categoryName || t.category_name || t.category).toLowerCase();
          cat = categories.find((c) => String(c.name || '').toLowerCase() === name);
        }
        const alwaysInclude = !!(cat && (cat.alwaysInclude || cat.always_include));
        return { ...t, id, order, alwaysInclude };
      });
      if (JSON.stringify(normalized) !== JSON.stringify(templates)) {
        try {
          const canonicalId = resolveCanonicalUserId(users[idx]);
          if (canonicalId) {
            await apiUpdateSubUser(canonicalId, { templates: normalized });
            const nextUsers = [...users];
            nextUsers[idx] = { ...nextUsers[idx], templates: normalized };
            set({ users: nextUsers });
          }
        } catch (err) { /* ignore */ }
      }
      return normalized.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
     },

    addTemplate: async (subUserIdOrKey, payload) => {
      if (!subUserIdOrKey || !payload) throw new Error('subUserId & payload required');
      const users = get().users || [];
      const idx = findUserIndexById(users, subUserIdOrKey);
      if (idx === -1) throw new Error('Sub-user not found in store');

      const existing = Array.isArray(users[idx].templates) ? [...users[idx].templates] : [];
      const categories = Array.isArray(users[idx].template_categories) ? users[idx].template_categories : [];
      // determine alwaysInclude from selected category
      let alwaysInclude = false;
      if (payload.categoryId) {
        const c = categories.find((x) => String(x.id) === String(payload.categoryId));
        if (c) alwaysInclude = !!(c.alwaysInclude || c.always_include);
      } else if (payload.categoryName) {
        const name = String(payload.categoryName).toLowerCase();
        const c = categories.find((x) => String(x.name || '').toLowerCase() === name);
        if (c) alwaysInclude = !!(c.alwaysInclude || c.always_include);
      }

      const newTpl = {
        id: uuidv4(),
        categoryId: payload.categoryId || payload.category_id || null,
        categoryName: payload.categoryName || payload.category_name || payload.category || '',
        content: payload.content || '',
        skills: payload.skills || 'All skills',
        createdAt: Date.now(),
        order: existing.length,
        alwaysInclude,
      };
      const next = [...existing, newTpl];
      const canonicalId = resolveCanonicalUserId(users[idx]);
      if (!canonicalId) throw new Error('Cannot resolve canonical sub-user id to persist');
      await apiUpdateSubUser(canonicalId, { templates: next });
      const nextUsers = [...users];
      nextUsers[idx] = { ...nextUsers[idx], templates: next };
      set({ users: nextUsers });
      return newTpl;
     },

    updateTemplate: async (subUserIdOrKey, templateId, patch) => {
      if (!subUserIdOrKey || !templateId) throw new Error('subUserId & templateId required');
      const users = get().users || [];
      const idx = findUserIndexById(users, subUserIdOrKey);
      if (idx === -1) throw new Error('Sub-user not found in store');

      const existing = Array.isArray(users[idx].templates) ? [...users[idx].templates] : [];
      const next = existing.map((t) => (t.id === templateId ? { ...t, ...patch } : t));
      const canonicalId = resolveCanonicalUserId(users[idx]);
      if (!canonicalId) throw new Error('Cannot resolve canonical sub-user id to persist');
      await apiUpdateSubUser(canonicalId, { templates: next });
      const nextUsers = [...users];
      nextUsers[idx] = { ...nextUsers[idx], templates: next };
      set({ users: nextUsers });
      return next.find((t) => t.id === templateId);
    },

    deleteTemplate: async (subUserIdOrKey, templateId) => {
      if (!subUserIdOrKey || !templateId) throw new Error('subUserId & templateId required');
      const users = get().users || [];
      const idx = findUserIndexById(users, subUserIdOrKey);
      if (idx === -1) throw new Error('Sub-user not found in store');

      const existing = Array.isArray(users[idx].templates) ? [...users[idx].templates] : [];
      const next = existing.filter((t) => t.id !== templateId).map((t, i) => ({ ...t, order: i }));
      const canonicalId = resolveCanonicalUserId(users[idx]);
      if (!canonicalId) throw new Error('Cannot resolve canonical sub-user id to persist');
      await apiUpdateSubUser(canonicalId, { templates: next });
      const nextUsers = [...users];
      nextUsers[idx] = { ...nextUsers[idx], templates: next };
      set({ users: nextUsers });
      return true;
    },

    duplicateTemplate: async (subUserIdOrKey, templateId) => {
      if (!subUserIdOrKey || !templateId) throw new Error('subUserId & templateId required');
      const users = get().users || [];
      const idx = findUserIndexById(users, subUserIdOrKey);
      if (idx === -1) throw new Error('Sub-user not found in store');

      const existing = Array.isArray(users[idx].templates) ? [...users[idx].templates] : [];
      const tpl = existing.find((t) => t.id === templateId);
      if (!tpl) throw new Error('Template not found');
      const copy = { ...tpl, id: uuidv4(), content: `${tpl.content} (copy)`, createdAt: Date.now(), order: existing.length };
      const next = [...existing, copy];
      const canonicalId = resolveCanonicalUserId(users[idx]);
      if (!canonicalId) throw new Error('Cannot resolve canonical sub-user id to persist');
      await apiUpdateSubUser(canonicalId, { templates: next });
      const nextUsers = [...users];
      nextUsers[idx] = { ...nextUsers[idx], templates: next };
      set({ users: nextUsers });
      return copy;
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
      const idx = findUserIndexById(users, selectedKey);
      return idx === -1 ? null : users[idx];
    },
  };
});
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { shallow } from 'zustand/shallow';
import { useUsersStore } from '../../store/useUsersStore';


const getPossibleParentUid = () => {
  const keys = ['PARENT_UID', 'parentUid', 'PARENTUID', 'parent_uid'];
  for (const k of keys) {
    try {
      const v = localStorage.getItem(k);
      if (v) return v;
    } catch {}
  }
  return null;
};

const UpdateProfile = () => {
  const { userId: paramUserId } = useParams();
  const users = useUsersStore((s) => s.users);
  const errorStore = useUsersStore((s) => s.error);
   const selectedKey = useUsersStore((s) => s.selectedKey);
   const updateSubUser = useUsersStore((s) => s.updateSubUser);
    const fetchUsers = useUsersStore((s) => s.fetchUsers);
    const storeParentUid = useUsersStore((s) => s.parentUid);
     useUsersStore( shallow);
 
  // Resolve subUserId: route param overrides selectedKey/store lookup
  const resolvedSubUserId = useMemo(() => {
    if (paramUserId) return String(paramUserId);
    if (!selectedKey || !Array.isArray(users)) return null;
    const found = users.find((u) => {
      const id = u.sub_user_id || u.document_id || u.id;
      if (String(id) === String(selectedKey)) return true;
      if (u.sub_username && String(u.sub_username) === String(selectedKey)) return true;
      return false;
    });
    return found ? String(found.sub_user_id || found.document_id || found.id) : null;
  }, [paramUserId, selectedKey, users]);

  // derive current user object from store
  const currentUser = useMemo(() => {
    if (!resolvedSubUserId || !Array.isArray(users)) return null;
    return users.find((u) => {
      const id = String(u.sub_user_id || u.document_id || u.id);
      if (id === String(resolvedSubUserId)) return true;
      if (u.sub_username && String(u.sub_username) === String(resolvedSubUserId)) return true;
      return false;
    }) || null;
  }, [resolvedSubUserId, users]);

    // If user not present, attempt one fetch (safe guarded)
  const fetchAttemptedRef = useRef(false);
  useEffect(() => {
    let mounted = true;
    const tryFetch = async () => {
      if (currentUser) return;
      if (fetchAttemptedRef.current) return;
      // prefer store parentUid then localStorage fallback
      const parentUid = storeParentUid || getPossibleParentUid();
      if (!parentUid) {
        // nothing we can do; do not throw — show friendly message in UI
        fetchAttemptedRef.current = true;
        return;
      }
      fetchAttemptedRef.current = true;
      try {
        await fetchUsers(parentUid);
      } catch (err) {
        // swallow - store.error will surface in UI
        if (mounted) console.warn('Failed to fetch users for UpdateProfile:', err);
      }
    };
    tryFetch();
    return () => { mounted = false; };
  }, [currentUser, fetchUsers, storeParentUid]);


  // initial snapshot of editable fields
  const initialValues = useMemo(() => ({
    sub_username: currentUser?.sub_username || '',
    autobid_enabled: !!currentUser?.autobid_enabled,
    autobid_enabled_for_job_type: currentUser?.autobid_enabled_for_job_type || '',
    autobid_proposal_type: currentUser?.autobid_proposal_type || '',
    general_proposal: currentUser?.general_proposal || '',
  }), [currentUser]);

  const snapshotJson = useMemo(() => JSON.stringify(initialValues), [initialValues]);

  // local state
  const [form, setForm] = useState(initialValues);
  const prevSnapshotRef = useRef(snapshotJson);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  // sync store -> local only when user or snapshot changes
  useEffect(() => {
    if (prevSnapshotRef.current !== snapshotJson) {
      setForm(initialValues);
      prevSnapshotRef.current = snapshotJson;
    }
    setMsg(null);
    setErr(null);
  }, [snapshotJson, initialValues, resolvedSubUserId]);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  }, []);

  const handleSave = useCallback(async () => {
    setErr(null);
    setMsg(null);

    if (!resolvedSubUserId) {
      setErr('No sub-user selected.');
      return;
    }

    const payload = {
      sub_username: form.sub_username,
      autobid_enabled: !!form.autobid_enabled,
      autobid_enabled_for_job_type: form.autobid_enabled_for_job_type || '',
      autobid_proposal_type: form.autobid_proposal_type || '',
      general_proposal: form.general_proposal || '',
    };

    setSaving(true);
    try {
      await updateSubUser(resolvedSubUserId, { ...payload });
      setMsg('Profile updated successfully.');
    } catch (e) {
      console.error('Error saving profile:', e);
      setErr(e?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  }, [resolvedSubUserId, form, updateSubUser]);

  if (!currentUser) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Update Profile</h2>
        <div className="text-gray-600">No sub-user selected or user data not loaded.</div>
        {errorStore && <div className="text-red-500 mt-2">Store error: {errorStore}</div>}
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Update Profile</h2>

      {msg && <div className="text-green-600 mb-3">{msg}</div>}
      {err && <div className="text-red-600 mb-3">{err}</div>}

      <form onSubmit={(e) => e.preventDefault()}>
        <div className="mb-4">
          <label className="block text-gray-700">Username</label>
          <input
            name="sub_username"
            type="text"
            value={form.sub_username || ''}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>

        <div className="mb-4 flex items-center gap-3">
          <label className="text-gray-700">Autobid Enabled</label>
          <input
            name="autobid_enabled"
            type="checkbox"
            checked={!!form.autobid_enabled}
            onChange={handleChange}
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700">Autobid Job Type</label>
          <select
            name="autobid_enabled_for_job_type"
            value={form.autobid_enabled_for_job_type || ''}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          >
            <option value="">Select...</option>
            <option value="all">All Job Types</option>
            <option value="fixed">Fixed Price Only</option>
            <option value="hourly">Hourly Only</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700">Proposal Type</label>
          <select
            name="autobid_proposal_type"
            value={form.autobid_proposal_type || ''}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          >
            <option value="">Select...</option>
            <option value="general">General Proposal</option>
            <option value="ai-generated">AI-Generated Proposal</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700">General Proposal</label>
          <textarea
            name="general_proposal"
            value={form.general_proposal || ''}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>

          <button
            type="button"
            onClick={() => {
              setForm(initialValues);
              setMsg(null);
              setErr(null);
            }}
            className="px-4 py-2 border rounded"
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  );
};

export default memo(UpdateProfile);
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { shallow } from 'zustand/shallow';
import { useUsersStore } from '../../store/useUsersStore';


const ProjectBudget = ({ subUserId: propSubUserId }) => {
  const users = useUsersStore((s) => s.users);
   const selectedKey = useUsersStore((s) => s.selectedKey);
   const updateSubUser = useUsersStore((s) => s.updateSubUser);
     useUsersStore( shallow);

  // resolve active subUserId (prop overrides store selection)
  const resolvedSubUserId = useMemo(() => {
    if (propSubUserId) return String(propSubUserId);
    if (!selectedKey || !Array.isArray(users)) return null;
    const found = users.find((u) => {
      const id = u.sub_user_id || u.document_id || u.id;
      if (String(id) === String(selectedKey)) return true;
      if (u.sub_username && String(u.sub_username) === String(selectedKey)) return true;
      return false;
    });
    return found ? String(found.sub_user_id || found.document_id || found.id) : null;
  }, [propSubUserId, selectedKey, users]);

  const finalSubUserId = useMemo(() => String(resolvedSubUserId || propSubUserId || selectedKey || '') || null,
    [resolvedSubUserId, propSubUserId, selectedKey]);

  // read project_budget map from selected user
  const projectBudget = useMemo(() => {
    if (!finalSubUserId || !Array.isArray(users)) return {};
    const u = users.find((x) => String(x.sub_user_id || x.document_id || x.id) === String(finalSubUserId)
      || (x.sub_username && String(x.sub_username) === String(finalSubUserId)));
    return (u && u.project_budget) || {};
  }, [finalSubUserId, users]);

  // derive initial numeric values (defaults to 0)
  const initialValues = useMemo(() => {
    const mf = projectBudget.min_fixed_budget;
    const mh = projectBudget.min_hourly_budget;
    const minFixed = (mf === undefined || mf === null || mf === '') ? 0 : Number(mf) || 0;
    const minHourly = (mh === undefined || mh === null || mh === '') ? 0 : Number(mh) || 0;
    return { minFixed, minHourly };
  }, [projectBudget.min_fixed_budget, projectBudget.min_hourly_budget]);

  const snapshotJson = useMemo(() => JSON.stringify(initialValues), [initialValues]);

  // local state
  const [minFixed, setMinFixed] = useState(initialValues.minFixed);
  const [minHourly, setMinHourly] = useState(initialValues.minHourly);
  const prevSnapshotRef = useRef(snapshotJson);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // sync server -> local only when snapshot changes or user changes
  useEffect(() => {
    if (prevSnapshotRef.current !== snapshotJson) {
      setMinFixed(initialValues.minFixed);
      setMinHourly(initialValues.minHourly);
      prevSnapshotRef.current = snapshotJson;
    }
    setMessage(null);
    setError(null);
    // intentionally depend on snapshot and finalSubUserId only
  }, [snapshotJson, finalSubUserId, initialValues.minFixed, initialValues.minHourly]);

  const handleChangeMinFixed = useCallback((e) => {
    const v = e.target.value;
    // allow empty -> treat as 0 on submit; keep numeric if possible
    setMinFixed(v === '' ? '' : Number(v));
  }, []);

  const handleChangeMinHourly = useCallback((e) => {
    const v = e.target.value;
    setMinHourly(v === '' ? '' : Number(v));
  }, []);

  const handleSubmit = useCallback(async () => {
    setError(null);
    setMessage(null);
    if (!finalSubUserId) {
      setError('No sub-user selected.');
      return;
    }

    const payload = {
      project_budget: {
        min_fixed_budget: Number(minFixed) || 0,
        min_hourly_budget: Number(minHourly) || 0,
      },
    };

    setSaving(true);
    try {
      await updateSubUser(finalSubUserId, payload);
      setMessage('Saved successfully.');
    } catch (e) {
      console.error('Failed to save project_budget', e);
      setError(e?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }, [finalSubUserId, minFixed, minHourly, updateSubUser]);

  return (
    <div className="w-full p-4">
      <div className="mb-4">
        <h2 className="text-2xl font-semibold">Manage Project Budget</h2>
        <div className="mt-3 bg-yellow-50 border-l-4 border-yellow-300 p-3 rounded">
          <p className="text-sm text-yellow-800">
            You will only see those projects whose minimum budget is equal or greater than your entered values.
          </p>
          <p className="text-sm text-yellow-800 mt-1">
            Base currency is USD. For other currencies, budget will be converted as per latest conversion rate.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6 items-end">
        <div>
          <label className="block text-sm font-medium mb-1">Min fixed budget (in USD)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={minFixed === '' ? '' : minFixed}
            onChange={handleChangeMinFixed}
            className="w-full p-2 border rounded"
            placeholder="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Min hourly budget (in USD)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={minHourly === '' ? '' : minHourly}
            onChange={handleChangeMinHourly}
            className="w-full p-2 border rounded"
            placeholder="0"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <div className="text-sm text-gray-600 mr-auto">
          {message ? <span className="text-green-600">{message}</span> : (error || '')}
        </div>

        <button
          type="button"
          onClick={() => {
            // reset to server snapshot
            setMinFixed(initialValues.minFixed);
            setMinHourly(initialValues.minHourly);
            setMessage(null);
            setError(null);
          }}
          className="px-3 py-2 border rounded"
        >
          Reset
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving || !finalSubUserId}
          className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Submit'}
        </button>
      </div>
    </div>
  );
};

ProjectBudget.propTypes = {
  subUserId: PropTypes.string,
};

export default memo(ProjectBudget);
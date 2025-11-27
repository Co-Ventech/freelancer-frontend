import React, { memo, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { shallow } from 'zustand/shallow';
import { useUsersStore } from '../../store/useUsersStore';

const DEFAULT_COUNTRIES = [
  'Pakistan','United Kingdom','Germany','Netherlands','Spain','Malaysia','Philippines','South Africa','Mexico',
  'United States','Australia','Saudi Arabia','France','Indonesia','Nigeria','Turkey','Sweden',
  'India','Canada','United Arab Emirates','Egypt','Italy','Singapore','Brazil','Russian Federation'
];


const CountriesFilter = ({ subUserId: propSubUserId }) => {
  // stable store subscription
 const users = useUsersStore((s) => s.users);
  const selectedKey = useUsersStore((s) => s.selectedKey);
  const updateSubUser = useUsersStore((s) => s.updateSubUser);
  const errorStore = useUsersStore((s) => s.error);

  // resolve the active subUserId
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


    // final id fallback chain
  const finalSubUserId = useMemo(() => {
    return String(resolvedSubUserId || propSubUserId || selectedKey || '') || null;
  }, [resolvedSubUserId, propSubUserId, selectedKey]);

  // get project_filters for selected user
  const projectFilters = useMemo(() => {
    if (!finalSubUserId || !Array.isArray(users)) return {};
    const u = users.find((x) => String(x.sub_user_id || x.document_id || x.id) === String(finalSubUserId));
    return (u && u.project_filters) || {};
  }, [finalSubUserId, users]);

  // initial excluded array (stable)
  const initialExcluded = useMemo(() => {
    const val = projectFilters.excluded_countries;
    if (Array.isArray(val)) return val.slice();
    if (typeof val === 'string' && val.trim()) return val.split(',').map(s => s.trim());
    return [];
  }, [projectFilters.excluded_countries]);

  const initialExcludedJson = useMemo(() => JSON.stringify(initialExcluded || []), [initialExcluded]);

  // local editable state
  const [excluded, setExcluded] = useState(initialExcluded);
  const prevInitialRef = useRef(initialExcludedJson);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  // Sync from store -> local only when snapshot changes or user changes
  useEffect(() => {
    if (prevInitialRef.current !== initialExcludedJson) {
      setExcluded(initialExcluded);
      prevInitialRef.current = initialExcludedJson;
    }
    // reset messages on user switch
    setMsg(null);
    setErr(null);
  }, [initialExcludedJson, resolvedSubUserId, initialExcluded]);

  // toggle
  const toggleCountry = useCallback((country) => {
    setExcluded(prev => {
      const next = Array.isArray(prev) ? [...prev] : [];
      const idx = next.indexOf(country);
      if (idx === -1) next.push(country);
      else next.splice(idx, 1);
      return next;
    });
  }, []);

  const activateAll = useCallback(() => setExcluded([]), []);
  const deactivateAll = useCallback(() => setExcluded(DEFAULT_COUNTRIES.slice()), []);

  const handleSubmit = useCallback(async () => {
    setErr(null);
    setMsg(null);
    if (!resolvedSubUserId) {
      setErr('No sub-user selected');
      return;
    }

    const payload = {
      project_filters: {
        ...(projectFilters || {}),
        excluded_countries: Array.isArray(excluded) ? excluded.slice() : [],
      },
    };

    setSaving(true);
    try {
      await updateSubUser(resolvedSubUserId, payload);
      setMsg('Saved successfully');
    } catch (e) {
      setErr(e?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }, [resolvedSubUserId, excluded, projectFilters, updateSubUser]);

  return (
    <div className="w-full p-4">
      <div className="mb-4">
        <h2 className="text-2xl font-semibold">Manage Excluded Countries</h2>
        <p className="text-sm text-gray-600">
          Toggle countries to exclude. Excluded countries will be ignored for auto-bidding.
        </p>
      </div>

      <div className="flex gap-2 items-center mb-3">
        <button type="button" onClick={activateAll} className="px-3 py-1 bg-blue-600 text-white rounded">Activate all</button>
        <button type="button" onClick={deactivateAll} className="px-3 py-1 bg-gray-200 text-gray-800 rounded">Deactivate all</button>
        <div className="ml-auto text-sm text-gray-600">
          {saving ? 'Saving...' : (msg ? <span className="text-green-600">{msg}</span> : (err || errorStore || ''))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {DEFAULT_COUNTRIES.map((c) => {
          const isExcluded = excluded.includes(c);
          return (
            <div key={c} className="flex items-center gap-3 p-2 border rounded">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!isExcluded}
                  onChange={() => toggleCountry(c)}
                />
                <span>{c}</span>
              </label>
              <div className={`ml-auto px-2 py-0.5 text-xs rounded ${isExcluded ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {isExcluded ? 'Off' : 'On'}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => { setExcluded(initialExcluded); setMsg(null); setErr(null); }} className="px-3 py-2 border rounded">Reset</button>
        <button type="button" onClick={handleSubmit} disabled={saving || !resolvedSubUserId} className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-60">
          {saving ? 'Saving...' : 'Submit'}
        </button>
      </div>
    </div>
  );
};

CountriesFilter.propTypes = { subUserId: PropTypes.string };
export default memo(CountriesFilter);
import React, { memo, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useUsersStore } from '../../store/useUsersStore';

const CURRENCY_LIST = [
  { code: 'USD', label: 'US Dollar' },
  { code: 'GBP', label: 'British Pound' },
  { code: 'EUR', label: 'Euro' },
  { code: 'CAD', label: 'Canadian Dollar' },
  { code: 'AUD', label: 'Australian Dollar' },
  { code: 'PKR', label: 'Pakistan Rupee' },
  { code: 'INR', label: 'Indian Rupee' },
  { code: 'AED', label: 'UAE Dirham' },
  { code: 'SAR', label: 'Saudi Riyal' },
  { code: 'JPY', label: 'Japanese Yen' },
  { code: 'CNY', label: 'Chinese Yuan' },
];

const CurrenciesFilter = ({ subUserId: propSubUserId }) => {
  // stable, minimal subscriptions (avoid returning new objects from selector)
  const users = useUsersStore((s) => s.users);
  const selectedKey = useUsersStore((s) => s.selectedKey);
  const updateSubUser = useUsersStore((s) => s.updateSubUser);
  const storeError = useUsersStore((s) => s.error);

  // resolve active subUserId (prop > selectedKey lookup)
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

  // finalSubUserId fallback
  const finalSubUserId = useMemo(() => {
    return String(resolvedSubUserId || propSubUserId || selectedKey || '') || null;
  }, [resolvedSubUserId, propSubUserId, selectedKey]);

  // pull project_filters.allowed_currencies (or fallback)
  const projectFilters = useMemo(() => {
    if (!finalSubUserId || !Array.isArray(users)) return {};
    const u = users.find((x) => String(x.sub_user_id || x.document_id || x.id) === String(finalSubUserId)
      || (x.sub_username && String(x.sub_username) === String(finalSubUserId)));
    return (u && u.project_filters) || {};
  }, [finalSubUserId, users]);

  // derive initial allowed currencies array and JSON snapshot
  const initialAllowed = useMemo(() => {
    const v = projectFilters.allowed_currencies ?? projectFilters.currencies_allowed ?? projectFilters.currencies;
    if (Array.isArray(v)) return v.slice();
    if (typeof v === 'string' && v.trim()) return v.split(',').map(s => s.trim());
    return [];
  }, [projectFilters.allowed_currencies, projectFilters.currencies_allowed, projectFilters.currencies]);

  const initialAllowedJson = useMemo(() => JSON.stringify(initialAllowed || []), [initialAllowed]);

  // local state
  const [allowed, setAllowed] = useState(initialAllowed);
  const prevInitialRef = useRef(initialAllowedJson);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  // sync store -> local only when snapshot changes or user changes
  useEffect(() => {
    if (prevInitialRef.current !== initialAllowedJson) {
      setAllowed(initialAllowed);
      prevInitialRef.current = initialAllowedJson;
    }
    setMsg(null);
    setErr(null);
  }, [initialAllowedJson, finalSubUserId, initialAllowed]);

  // toggle single currency
  const toggleCurrency = useCallback((code) => {
    setAllowed(prev => {
      const next = Array.isArray(prev) ? [...prev] : [];
      const idx = next.indexOf(code);
      if (idx === -1) next.push(code);
      else next.splice(idx, 1);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => setAllowed(CURRENCY_LIST.map(c => c.code)), []);
  const clearAll = useCallback(() => setAllowed([]), []);

  // submit: merge into project_filters.allowed_currencies and call updateSubUser
  const handleSubmit = useCallback(async () => {
    setErr(null);
    setMsg(null);
    if (!finalSubUserId) {
      setErr('No sub-user selected.');
      return;
    }

    const payload = {
      project_filters: {
        ...(projectFilters || {}),
        allowed_currencies: Array.isArray(allowed) ? allowed.slice() : [],
      },
    };

    setSaving(true);
    try {
      await updateSubUser(finalSubUserId, payload);
      setMsg('Saved successfully.');
    } catch (e) {
      console.error('Currencies save failed', e);
      setErr(e?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }, [finalSubUserId, allowed, projectFilters, updateSubUser]);

  return (
    <div className="w-full p-4">
      <div className="mb-4">
        <h2 className="text-2xl font-semibold">Allowed Currencies</h2>
        <p className="text-sm text-gray-600">Toggle which currencies this sub-user accepts/targets for projects/bids.</p>
      </div>

      <div className="flex gap-2 items-center mb-3">
        <button type="button" onClick={selectAll} className="px-3 py-1 bg-blue-600 text-white rounded">Select all</button>
        <button type="button" onClick={clearAll} className="px-3 py-1 bg-gray-200 text-gray-800 rounded">Clear</button>
        <div className="ml-auto text-sm text-gray-600">
          {saving ? 'Saving...' : (msg ? <span className="text-green-600">{msg}</span> : (err || storeError || ''))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {CURRENCY_LIST.map(({ code, label }) => {
          const active = allowed.includes(code);
          return (
            <div key={code} className="flex items-center gap-3 p-2 border rounded">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => toggleCurrency(code)}
                  aria-label={`Toggle ${label}`}
                />
                <span>{label} ({code})</span>
              </label>

              <div className={`ml-auto px-2 py-0.5 text-xs rounded ${active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {active ? 'On' : 'Off'}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => { setAllowed(initialAllowed); setMsg(null); setErr(null); }} className="px-3 py-2 border rounded">Reset</button>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving || !finalSubUserId}
          className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
};

CurrenciesFilter.propTypes = {
  subUserId: PropTypes.string,
};

export default memo(CurrenciesFilter);
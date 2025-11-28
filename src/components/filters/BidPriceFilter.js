import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { shallow } from 'zustand/shallow';
import { useUsersStore } from '../../store/useUsersStore';

// Predefined ranges and currencies
const RANGES = [
  { key: 'micro', label: 'Micro project', base: 20 },
  { key: 'simple', label: 'Simple project', base: 50 },
  { key: 'very_small', label: 'Very small project', base: 100 },
  { key: 'large', label: 'Large project', base: 300 },
  { key: 'larger', label: 'Larger project', base: 600 },
  { key: 'very_large', label: 'Very large project', base: 1200 },
  { key: 'huge', label: 'Huge project', base: 3000 },
];

const CURRENCIES = ['USD', 'AUD', 'CAD', 'GBP', 'EUR', 'INR'];

const defaultRangeValues = (base) => {
  const obj = {};
  for (const c of CURRENCIES) obj[c] = c === 'USD' ? base : null;
  return obj;
};

const makeDefaultSettings = () => {
  const fixed = {};
  for (const r of RANGES) fixed[r.key] = defaultRangeValues(r.base);
  return {
    custom_lower_percent: 100,
    custom_higher_percent: 100,
    fixed,
  };
};

const BidPriceFilter = ({ subUserId: propSubUserId = null }) => {
  const users = useUsersStore((s) => s.users);
  const selectedKey = useUsersStore((s) => s.selectedKey);
  const updateSubUser = useUsersStore((s) => s.updateSubUser);

  // resolve subUserId: prop overrides selectedKey/store lookup
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

  const currentUser = useMemo(() => {
    if (!resolvedSubUserId || !Array.isArray(users)) return null;
    return users.find((u) => {
      const id = String(u.sub_user_id || u.document_id || u.id);
      if (id === String(resolvedSubUserId)) return true;
      if (u.sub_username && String(u.sub_username) === String(resolvedSubUserId)) return true;
      return false;
    }) || null;
  }, [resolvedSubUserId, users]);

  const initialSettings = useMemo(() => {
    const existing = currentUser?.bid_price_settings || {};
    const defaults = makeDefaultSettings();
    const fixed = { ...defaults.fixed, ...(existing.fixed || {}) };
    for (const r of RANGES) {
      fixed[r.key] = { ...(defaults.fixed[r.key] || {}), ...(fixed[r.key] || {}) };
    }
    return {
      custom_lower_percent: existing.custom_lower_percent ?? defaults.custom_lower_percent,
      custom_higher_percent: existing.custom_higher_percent ?? defaults.custom_higher_percent,
      fixed,
    };
  }, [currentUser]);

  const snapshotJson = useMemo(() => JSON.stringify(initialSettings), [initialSettings]);

  const [settings, setSettings] = useState(initialSettings);
  const prevSnapshotRef = useRef(snapshotJson);

  const [activeTab, setActiveTab] = useState('fixed'); // fixed / hourly
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (prevSnapshotRef.current !== snapshotJson) {
      setSettings(initialSettings);
      prevSnapshotRef.current = snapshotJson;
    }
    setMsg(null);
    setErr(null);
  }, [snapshotJson, initialSettings, resolvedSubUserId]);

  const setCustomPercent = useCallback((key, value) => {
    setSettings((s) => ({ ...s, [key]: Number(value) || 0 }));
  }, []);

  const setFixedCurrencyValue = useCallback((rangeKey, currency, value) => {
    setSettings((s) => {
      const next = { ...s, fixed: { ...(s.fixed || {}) } };
      next.fixed[rangeKey] = { ...(next.fixed[rangeKey] || {}) };
      next.fixed[rangeKey][currency] = value === '' ? null : Number(value);
      return next;
    });
  }, []);

  const applyPresetToRange = useCallback((rangeKey, preset) => {
    const rangeDef = RANGES.find(r => r.key === rangeKey);
    const base = rangeDef ? rangeDef.base : 100;
    const factor = preset === 'lowest' ? 0.8 : preset === 'highest' ? 1.5 : 1.0;
    setSettings((s) => {
      const next = { ...s, fixed: { ...(s.fixed || {}) } };
      next.fixed[rangeKey] = { ...(next.fixed[rangeKey] || {}) };
      for (const c of CURRENCIES) {
        next.fixed[rangeKey][c] = c === 'USD' ? Number((base * factor).toFixed(2)) : null;
      }
      return next;
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    setErr(null);
    setMsg(null);
    if (!resolvedSubUserId) {
      setErr('No sub-user selected.');
      return;
    }

    const payload = {
      bid_price_settings: {
        ...(currentUser?.bid_price_settings || {}),
        custom_lower_percent: Number(settings.custom_lower_percent) || 0,
        custom_higher_percent: Number(settings.custom_higher_percent) || 0,
        fixed: settings.fixed || {},
      },
    };

    setSaving(true);
    try {
      await updateSubUser(resolvedSubUserId, payload);
      setMsg('Saved successfully.');
    } catch (e) {
      console.error('Failed to save bid price settings', e);
      setErr(e?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }, [resolvedSubUserId, settings, updateSubUser, currentUser]);

  const renderRangeCard = (range) => {
    const rKey = range.key;
    const values = (settings.fixed && settings.fixed[rKey]) || {};
    return (
      <div key={rKey} className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 md:p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded">Fixed</span>
            <h3 className="text-md font-semibold">{range.label}</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => applyPresetToRange(rKey, 'lowest')}
              className="px-3 py-1 text-xs font-medium rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              Lowest
            </button>
            <button
              type="button"
              onClick={() => applyPresetToRange(rKey, 'average')}
              className="px-3 py-1 text-xs font-medium rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              Average
            </button>
            <button
              type="button"
              onClick={() => applyPresetToRange(rKey, 'highest')}
              className="px-3 py-1 text-xs font-medium rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              Highest
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {CURRENCIES.map((c) => (
            <div key={c} className="space-y-2">
              <div className="text-sm text-gray-600">{c === 'USD' ? `${range.base} USD / USD` : `${c} (converted)`}</div>
              <input
                type="number"
                step="0.01"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                placeholder="Bid Price"
                value={values[c] == null ? '' : values[c]}
                onChange={(e) => setFixedCurrencyValue(rKey, c, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full p-4">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Manage Bid Price</h1>
      </header>

      {/* Custom budgets notice + inputs */}
      <section className="mb-6 bg-yellow-50 border border-yellow-100 rounded-lg p-4 md:p-6">
        <div className="md:flex md:items-start md:gap-6">
          <div className="flex-1">
            <div className="text-lg font-semibold mb-2">For custom budgets and ranges without fixed price</div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3 items-end">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Lower than average (in %)</label>
                <input
                  type="number"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  value={settings.custom_lower_percent}
                  onChange={(e) => setCustomPercent('custom_lower_percent', e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm text-gray-600 mb-1 block">Higher than average (in %)</label>
                <input
                  type="number"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  value={settings.custom_higher_percent}
                  onChange={(e) => setCustomPercent('custom_higher_percent', e.target.value)}
                />
              </div>

              <div className="md:flex md:justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(true)}
                  className="px-3 py-1 rounded bg-gray-800 text-white text-sm shadow"
                >
                  See how it works
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Predefined budgets */}
      <section className="mb-6">
        <div className="mb-3">
          <h2 className="text-lg font-semibold mb-2">For predefined budgets</h2>
          <p className="text-sm text-gray-600">You don't have to fill in all the prices. Just enter amounts for the ranges where you want to bid a specific price.</p>
        </div>

        <div className="mb-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveTab('fixed')}
            className={`px-4 py-2 rounded ${activeTab === 'fixed' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            Fixed
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('hourly')}
            className={`px-4 py-2 rounded ${activeTab === 'hourly' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            Hourly
          </button>
        </div>

        {activeTab === 'fixed' ? (
          <div className="space-y-6">
            {RANGES.map(renderRangeCard)}
          </div>
        ) : (
          <div className="p-6 border border-gray-100 rounded-lg bg-white text-gray-600">Hourly tab is a placeholder for now.</div>
        )}
      </section>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <div className="text-sm text-gray-600 mr-auto">{msg ? <span className="text-green-600">{msg}</span> : (err || '')}</div>
        <button
          type="button"
          onClick={() => { setSettings(initialSettings); setMsg(null); setErr(null); }}
          className="px-3 py-2 border rounded"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving || !resolvedSubUserId}
          className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Submit'}
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black opacity-40" onClick={() => setShowModal(false)} />
          <div className="bg-white p-6 rounded shadow-lg z-10 max-w-lg w-full">
            <h3 className="text-lg font-semibold mb-2">How Bid Price Presets Work</h3>
            <p className="text-sm text-gray-700">
              The presets set suggested bid prices for the selected range. "Lowest" sets a conservative lower value,
              "Average" uses the baseline, and "Highest" sets an aggressive value. These are applied per-currency
              (USD shown explicitly; other currencies can be converted if left empty).
            </p>
            <div className="mt-4 flex justify-end">
              <button type="button" onClick={() => setShowModal(false)} className="px-3 py-1 border rounded">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

BidPriceFilter.propTypes = {};
export default memo(BidPriceFilter);
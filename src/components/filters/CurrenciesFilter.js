// import React, { memo, useEffect, useMemo, useRef, useState, useCallback } from 'react';
// import PropTypes from 'prop-types';
// import { useUsersStore } from '../../store/useUsersStore';

// const CURRENCY_LIST = [
//   { code: 'USD', label: 'US Dollar' },
//   { code: 'GBP', label: 'British Pound' },
//   { code: 'EUR', label: 'Euro' },
//   { code: 'CAD', label: 'Canadian Dollar' },
//   { code: 'AUD', label: 'Australian Dollar' },
//   { code: 'PKR', label: 'Pakistan Rupee' },
//   { code: 'INR', label: 'Indian Rupee' },
//   { code: 'AED', label: 'UAE Dirham' },
//   { code: 'SAR', label: 'Saudi Riyal' },
//   { code: 'JPY', label: 'Japanese Yen' },
//   { code: 'CNY', label: 'Chinese Yuan' },
// ];

// const CurrenciesFilter = ({ subUserId: propSubUserId }) => {
//   // stable, minimal subscriptions (avoid returning new objects from selector)
//   const users = useUsersStore((s) => s.users);
//   const selectedKey = useUsersStore((s) => s.selectedKey);
//   const updateSubUser = useUsersStore((s) => s.updateSubUser);
//   const storeError = useUsersStore((s) => s.error);

//   // resolve active subUserId (prop > selectedKey lookup)
//   const resolvedSubUserId = useMemo(() => {
//     if (propSubUserId) return String(propSubUserId);
//     if (!selectedKey || !Array.isArray(users)) return null;
//     const found = users.find((u) => {
//       const id = u.sub_user_id || u.document_id || u.id;
//       if (String(id) === String(selectedKey)) return true;
//       if (u.sub_username && String(u.sub_username) === String(selectedKey)) return true;
//       return false;
//     });
//     return found ? String(found.sub_user_id || found.document_id || found.id) : null;
//   }, [propSubUserId, selectedKey, users]);

//   // finalSubUserId fallback
//   const finalSubUserId = useMemo(() => {
//     return String(resolvedSubUserId || propSubUserId || selectedKey || '') || null;
//   }, [resolvedSubUserId, propSubUserId, selectedKey]);

//   // pull project_filters.allowed_currencies (or fallback)
//   const projectFilters = useMemo(() => {
//     if (!finalSubUserId || !Array.isArray(users)) return {};
//     const u = users.find((x) => String(x.sub_user_id || x.document_id || x.id) === String(finalSubUserId)
//       || (x.sub_username && String(x.sub_username) === String(finalSubUserId)));
//     return (u && u.project_filters) || {};
//   }, [finalSubUserId, users]);

//   // derive initial allowed currencies array and JSON snapshot
//   const initialAllowed = useMemo(() => {
//     const v = projectFilters.allowed_currencies ?? projectFilters.currencies_allowed ?? projectFilters.currencies;
//     if (Array.isArray(v)) return v.slice();
//     if (typeof v === 'string' && v.trim()) return v.split(',').map(s => s.trim());
//     return [];
//   }, [projectFilters.allowed_currencies, projectFilters.currencies_allowed, projectFilters.currencies]);

//   const initialAllowedJson = useMemo(() => JSON.stringify(initialAllowed || []), [initialAllowed]);

//   // local state
//   const [allowed, setAllowed] = useState(initialAllowed);
//   const prevInitialRef = useRef(initialAllowedJson);
//   const [saving, setSaving] = useState(false);
//   const [msg, setMsg] = useState(null);
//   const [err, setErr] = useState(null);

//   // sync store -> local only when snapshot changes or user changes
//   useEffect(() => {
//     if (prevInitialRef.current !== initialAllowedJson) {
//       setAllowed(initialAllowed);
//       prevInitialRef.current = initialAllowedJson;
//     }
//     setMsg(null);
//     setErr(null);
//   }, [initialAllowedJson, finalSubUserId, initialAllowed]);

//   // toggle single currency
//   const toggleCurrency = useCallback((code) => {
//     setAllowed(prev => {
//       const next = Array.isArray(prev) ? [...prev] : [];
//       const idx = next.indexOf(code);
//       if (idx === -1) next.push(code);
//       else next.splice(idx, 1);
//       return next;
//     });
//   }, []);

//   const selectAll = useCallback(() => setAllowed(CURRENCY_LIST.map(c => c.code)), []);
//   const clearAll = useCallback(() => setAllowed([]), []);

//   // submit: merge into project_filters.allowed_currencies and call updateSubUser
//   const handleSubmit = useCallback(async () => {
//     setErr(null);
//     setMsg(null);
//     if (!finalSubUserId) {
//       setErr('No sub-user selected.');
//       return;
//     }

//     const payload = {
//       project_filters: {
//         ...(projectFilters || {}),
//         allowed_currencies: Array.isArray(allowed) ? allowed.slice() : [],
//       },
//     };

//     setSaving(true);
//     try {
//       await updateSubUser(finalSubUserId, payload);
//       setMsg('Saved successfully.');
//     } catch (e) {
//       console.error('Currencies save failed', e);
//       setErr(e?.message || 'Save failed');
//     } finally {
//       setSaving(false);
//     }
//   }, [finalSubUserId, allowed, projectFilters, updateSubUser]);

//   return (
//     <div className="w-full p-4">
//       <div className="mb-4">
//         <h2 className="text-2xl font-semibold">Allowed Currencies</h2>
//         <p className="text-sm text-gray-600">Toggle which currencies this sub-user accepts/targets for projects/bids.</p>
//       </div>

//       <div className="flex gap-2 items-center mb-3">
//         <button type="button" onClick={selectAll} className="px-3 py-1 bg-blue-600 text-white rounded">Select all</button>
//         <button type="button" onClick={clearAll} className="px-3 py-1 bg-gray-200 text-gray-800 rounded">Clear</button>
//         <div className="ml-auto text-sm text-gray-600">
//           {saving ? 'Saving...' : (msg ? <span className="text-green-600">{msg}</span> : (err || storeError || ''))}
//         </div>
//       </div>

//       <div className="grid grid-cols-3 gap-3 mb-4">
//         {CURRENCY_LIST.map(({ code, label }) => {
//           const active = allowed.includes(code);
//           return (
//             <div key={code} className="flex items-center gap-3 p-2 border rounded">
//               <label className="flex items-center gap-2">
//                 <input
//                   type="checkbox"
//                   checked={active}
//                   onChange={() => toggleCurrency(code)}
//                   aria-label={`Toggle ${label}`}
//                 />
//                 <span>{label} ({code})</span>
//               </label>

//               <div className={`ml-auto px-2 py-0.5 text-xs rounded ${active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
//                 {active ? 'On' : 'Off'}
//               </div>
//             </div>
//           );
//         })}
//       </div>

//       <div className="flex justify-end gap-2">
//         <button type="button" onClick={() => { setAllowed(initialAllowed); setMsg(null); setErr(null); }} className="px-3 py-2 border rounded">Reset</button>

//         <button
//           type="button"
//           onClick={handleSubmit}
//           disabled={saving || !finalSubUserId}
//           className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-60"
//         >
//           {saving ? 'Saving...' : 'Save'}
//         </button>
//       </div>
//     </div>
//   );
// };

// CurrenciesFilter.propTypes = {
//   subUserId: PropTypes.string,
// };

// export default memo(CurrenciesFilter);



import React, { memo, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useUsersStore } from '../../store/useUsersStore';
import { getAllCurrencies, searchCurrencies, formatCurrency } from '../../utils/currenciesHelper';

const CurrenciesFilter = ({ subUserId: propSubUserId }) => {
  // ============ STORE SUBSCRIPTIONS ============
  const users = useUsersStore((s) => s.users);
  const selectedKey = useUsersStore((s) => s.selectedKey);
  const updateSubUser = useUsersStore((s) => s.updateSubUser);
  const storeError = useUsersStore((s) => s.error);

  // ============ RESOLVE SUB-USER ID ============
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

  const finalSubUserId = useMemo(
    () => String(resolvedSubUserId || propSubUserId || selectedKey || '') || null,
    [resolvedSubUserId, propSubUserId, selectedKey]
  );

  // ============ GET PROJECT FILTERS ============
  const projectFilters = useMemo(() => {
    if (!finalSubUserId || !Array.isArray(users)) return {};
    const u = users.find((x) => {
      const id = String(x.sub_user_id || x.document_id || x.id);
      return id === String(finalSubUserId);
    });
    return (u && u.project_filters) || {};
  }, [finalSubUserId, users]);

  // ============ GET ALL AVAILABLE CURRENCIES ============
  const allCurrencies = useMemo(() => getAllCurrencies(), []);

  // ============ INITIAL ALLOWED STATE ============
  const initialAllowed = useMemo(() => {
    const val = projectFilters.allowed_currencies || 
                projectFilters.currencies_allowed || 
                projectFilters.currencies;
    
    if (Array.isArray(val)) return val.slice();
    if (typeof val === 'string' && val.trim()) return val.split(',').map(s => s.trim());
    return [];
  }, [projectFilters.allowed_currencies, projectFilters.currencies_allowed, projectFilters.currencies]);

  const initialAllowedJson = useMemo(() => JSON.stringify(initialAllowed || []), [initialAllowed]);

  // ============ LOCAL STATE ============
  const [allowed, setAllowed] = useState(initialAllowed);
  const [searchInput, setSearchInput] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);
  const prevInitialRef = useRef(initialAllowedJson);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // ============ SYNC FROM STORE ============
  useEffect(() => {
    if (prevInitialRef.current !== initialAllowedJson) {
      setAllowed(initialAllowed);
      prevInitialRef.current = initialAllowedJson;
    }
    setMsg(null);
    setErr(null);
  }, [initialAllowedJson, resolvedSubUserId, initialAllowed]);

  // ============ FILTER CURRENCIES BASED ON SEARCH ============
  const filteredCurrencies = useMemo(() => {
    if (!searchInput.trim()) return [];
    return searchCurrencies(searchInput).filter(c => !allowed.includes(c.code));
  }, [searchInput, allowed]);

  // ============ HANDLERS ============
  const addCurrency = useCallback((currencyCode) => {
    setAllowed(prev => {
      const next = Array.isArray(prev) ? [...prev] : [];
      if (!next.includes(currencyCode)) {
        next.push(currencyCode);
      }
      return next;
    });
    setSearchInput('');
    setIsDropdownOpen(false);
    inputRef.current?.focus();
  }, []);

  const removeCurrency = useCallback((currencyCode) => {
    setAllowed(prev => prev.filter(c => c !== currencyCode));
  }, []);

  const selectAll = useCallback(() => {
    setAllowed(allCurrencies.map(c => c.code));
  }, [allCurrencies]);

  const clearAll = useCallback(() => {
    setAllowed([]);
    setSearchInput('');
    setIsDropdownOpen(false);
  }, []);

  const handleSubmit = useCallback(async () => {
    setErr(null);
    setMsg(null);
    if (!finalSubUserId) {
      setErr('No sub-user selected');
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
      setMsg('✅ Saved successfully');
    } catch (e) {
      console.error('Currencies save failed', e);
      setErr(`❌ ${e?.message || 'Save failed'}`);
    } finally {
      setSaving(false);
    }
  }, [finalSubUserId, allowed, projectFilters, updateSubUser]);

  const handleReset = useCallback(() => {
    setAllowed(initialAllowed);
    setSearchInput('');
    setIsDropdownOpen(false);
    setMsg(null);
    setErr(null);
  }, [initialAllowed]);

  // ============ CLOSE DROPDOWN ON OUTSIDE CLICK ============
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) && 
          inputRef.current && !inputRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ============ RENDER ============
  return (
    <div className="w-full p-6 bg-white rounded-lg shadow">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Allowed Currencies</h2>
        <p className="text-sm text-gray-600 mt-2">
          Select which currencies this sub-user accepts/targets for projects and bids.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 items-center mb-6">
        <button
          type="button"
          onClick={selectAll}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium"
        >
          Select All
        </button>
        <button
          type="button"
          onClick={clearAll}
          disabled={saving}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium"
        >
          Clear All
        </button>

        {/* Status Messages */}
        <div className="ml-auto flex items-center gap-2">
          {saving && <span className="text-blue-600 text-sm font-medium">⏳ Saving...</span>}
          {msg && <span className="text-green-600 text-sm font-medium">{msg}</span>}
          {err && <span className="text-red-600 text-sm font-medium">{err}</span>}
          {storeError && !err && <span className="text-red-600 text-sm font-medium">{storeError}</span>}
        </div>
      </div>

      {/* Search & Selected Currencies */}
      <div className="mb-6 relative">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Allowed Currencies
        </label>

        {/* Input Field with Selected Tags */}
        <div className="border border-gray-300 rounded-lg p-3 bg-white">
          {/* Selected Currency Tags */}
          <div className="flex flex-wrap gap-2 mb-2">
            {allowed.map(currencyCode => (
              <div
                key={currencyCode}
                className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium"
              >
                <span>{currencyCode}</span>
                <button
                  onClick={() => removeCurrency(currencyCode)}
                  className="text-green-600 hover:text-green-800 font-bold cursor-pointer"
                  type="button"
                  aria-label={`Remove ${currencyCode}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {/* Search Input */}
          <input
            ref={inputRef}
            type="text"
            placeholder={allowed.length === 0 ? 'Search currencies (e.g., "USD", "GBP")...' : 'Add more currencies...'}
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setIsDropdownOpen(true);
            }}
            onFocus={() => searchInput && setIsDropdownOpen(true)}
            className="w-full border-none outline-none text-sm px-1"
          />

          {/* Dropdown Results */}
          {isDropdownOpen && searchInput && (
            <div
              ref={dropdownRef}
              className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto"
            >
              {filteredCurrencies.length > 0 ? (
                filteredCurrencies.map(currency => (
                  <button
                    key={currency.code}
                    onClick={() => addCurrency(currency.code)}
                    className="w-full text-left px-4 py-3 hover:bg-green-50 border-b border-gray-100 last:border-b-0 text-sm font-medium text-gray-700 transition"
                  >
                    <div className="font-semibold">{currency.code}</div>
                    <div className="text-xs text-gray-500">{currency.label}</div>
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-center text-gray-500 text-sm">
                  No currencies match "{searchInput}"
                </div>
              )}
            </div>
          )}
        </div>

        {/* Help Text */}
        <p className="text-xs text-gray-500 mt-2">
          {allowed.length > 0
            ? `${allowed.length} currencies allowed`
            : 'Start typing to search and select currencies'}
        </p>
      </div>

      {/* Selected Summary */}
      {allowed.length > 0 && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 font-medium">
            Allowed Currencies ({allowed.length}):
          </p>
          <div className="text-sm text-gray-700 mt-2 flex flex-wrap gap-2">
            {allowed.map(code => (
              <span key={code} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                {code}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Footer Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={handleReset}
          disabled={saving}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-60 transition font-medium"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving || !finalSubUserId}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium"
        >
          {saving ? '⏳ Saving...' : '💾 Save Changes'}
        </button>
      </div>
    </div>
  );
};

CurrenciesFilter.propTypes = {
  subUserId: PropTypes.string,
};

export default memo(CurrenciesFilter);

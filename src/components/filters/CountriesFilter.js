// import React, { memo, useEffect, useMemo, useRef, useState, useCallback } from 'react';
// import PropTypes from 'prop-types';
// import { shallow } from 'zustand/shallow';
// import { useUsersStore } from '../../store/useUsersStore';

// const DEFAULT_COUNTRIES = [
//   'Pakistan','United Kingdom','Germany','Netherlands','Spain','Malaysia','Philippines','South Africa','Mexico',
//   'United States','Australia','Saudi Arabia','France','Indonesia','Nigeria','Turkey','Sweden',
//   'India','Canada','United Arab Emirates','Egypt','Italy','Singapore','Brazil','Russian Federation'
// ];


// const CountriesFilter = ({ subUserId: propSubUserId }) => {
//   // stable store subscription
//  const users = useUsersStore((s) => s.users);
//   const selectedKey = useUsersStore((s) => s.selectedKey);
//   const updateSubUser = useUsersStore((s) => s.updateSubUser);
//   const errorStore = useUsersStore((s) => s.error);

//   // resolve the active subUserId
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


//     // final id fallback chain
//   const finalSubUserId = useMemo(() => {
//     return String(resolvedSubUserId || propSubUserId || selectedKey || '') || null;
//   }, [resolvedSubUserId, propSubUserId, selectedKey]);

//   // get project_filters for selected user
//   const projectFilters = useMemo(() => {
//     if (!finalSubUserId || !Array.isArray(users)) return {};
//     const u = users.find((x) => String(x.sub_user_id || x.document_id || x.id) === String(finalSubUserId));
//     return (u && u.project_filters) || {};
//   }, [finalSubUserId, users]);

//   // initial excluded array (stable)
//   const initialExcluded = useMemo(() => {
//     const val = projectFilters.excluded_countries;
//     if (Array.isArray(val)) return val.slice();
//     if (typeof val === 'string' && val.trim()) return val.split(',').map(s => s.trim());
//     return [];
//   }, [projectFilters.excluded_countries]);

//   const initialExcludedJson = useMemo(() => JSON.stringify(initialExcluded || []), [initialExcluded]);

//   // local editable state
//   const [excluded, setExcluded] = useState(initialExcluded);
//   const prevInitialRef = useRef(initialExcludedJson);
//   const [saving, setSaving] = useState(false);
//   const [msg, setMsg] = useState(null);
//   const [err, setErr] = useState(null);

//   // Sync from store -> local only when snapshot changes or user changes
//   useEffect(() => {
//     if (prevInitialRef.current !== initialExcludedJson) {
//       setExcluded(initialExcluded);
//       prevInitialRef.current = initialExcludedJson;
//     }
//     // reset messages on user switch
//     setMsg(null);
//     setErr(null);
//   }, [initialExcludedJson, resolvedSubUserId, initialExcluded]);

//   // toggle
//   const toggleCountry = useCallback((country) => {
//     setExcluded(prev => {
//       const next = Array.isArray(prev) ? [...prev] : [];
//       const idx = next.indexOf(country);
//       if (idx === -1) next.push(country);
//       else next.splice(idx, 1);
//       return next;
//     });
//   }, []);

//   const activateAll = useCallback(() => setExcluded([]), []);
//   const deactivateAll = useCallback(() => setExcluded(DEFAULT_COUNTRIES.slice()), []);

//   const handleSubmit = useCallback(async () => {
//     setErr(null);
//     setMsg(null);
//     if (!resolvedSubUserId) {
//       setErr('No sub-user selected');
//       return;
//     }

//     const payload = {
//       project_filters: {
//         ...(projectFilters || {}),
//         excluded_countries: Array.isArray(excluded) ? excluded.slice() : [],
//       },
//     };

//     setSaving(true);
//     try {
//       await updateSubUser(resolvedSubUserId, payload);
//       setMsg('Saved successfully');
//     } catch (e) {
//       setErr(e?.message || 'Save failed');
//     } finally {
//       setSaving(false);
//     }
//   }, [resolvedSubUserId, excluded, projectFilters, updateSubUser]);

//   return (
//     <div className="w-full p-4">
//       <div className="mb-4">
//         <h2 className="text-2xl font-semibold">Manage Excluded Countries</h2>
//         <p className="text-sm text-gray-600">
//           Toggle countries to exclude. Excluded countries will be ignored for auto-bidding.
//         </p>
//       </div>

//       <div className="flex gap-2 items-center mb-3">
//         <button type="button" onClick={activateAll} className="px-3 py-1 bg-blue-600 text-white rounded">Activate all</button>
//         <button type="button" onClick={deactivateAll} className="px-3 py-1 bg-gray-200 text-gray-800 rounded">Deactivate all</button>
//         <div className="ml-auto text-sm text-gray-600">
//           {saving ? 'Saving...' : (msg ? <span className="text-green-600">{msg}</span> : (err || errorStore || ''))}
//         </div>
//       </div>

//       <div className="grid grid-cols-3 gap-3 mb-4">
//         {DEFAULT_COUNTRIES.map((c) => {
//           const isExcluded = excluded.includes(c);
//           return (
//             <div key={c} className="flex items-center gap-3 p-2 border rounded">
//               <label className="flex items-center gap-2">
//                 <input
//                   type="checkbox"
//                   checked={!isExcluded}
//                   onChange={() => toggleCountry(c)}
//                 />
//                 <span>{c}</span>
//               </label>
//               <div className={`ml-auto px-2 py-0.5 text-xs rounded ${isExcluded ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
//                 {isExcluded ? 'Off' : 'On'}
//               </div>
//             </div>
//           );
//         })}
//       </div>

//       <div className="flex justify-end gap-2">
//         <button type="button" onClick={() => { setExcluded(initialExcluded); setMsg(null); setErr(null); }} className="px-3 py-2 border rounded">Reset</button>
//         <button type="button" onClick={handleSubmit} disabled={saving || !resolvedSubUserId} className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-60">
//           {saving ? 'Saving...' : 'Submit'}
//         </button>
//       </div>
//     </div>
//   );
// };

// CountriesFilter.propTypes = { subUserId: PropTypes.string };
// export default memo(CountriesFilter);


import React, { memo, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useUsersStore } from '../../store/useUsersStore';
import { getAllCountries, searchCountries } from '../../utils/countriesHelper';

const CountriesFilter = ({ subUserId: propSubUserId }) => {
  // ============ STORE SUBSCRIPTIONS ============
  const users = useUsersStore((s) => s.users);
  const selectedKey = useUsersStore((s) => s.selectedKey);
  const updateSubUser = useUsersStore((s) => s.updateSubUser);
  const errorStore = useUsersStore((s) => s.error);

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
    const u = users.find((x) => String(x.sub_user_id || x.document_id || x.id) === String(finalSubUserId));
    return (u && u.project_filters) || {};
  }, [finalSubUserId, users]);

  // ============ GET ALL AVAILABLE COUNTRIES ============
  const allCountries = useMemo(() => getAllCountries(), []);

  // ============ INITIAL EXCLUDED STATE ============
  const initialExcluded = useMemo(() => {
    const val = projectFilters.excluded_countries;
    if (Array.isArray(val)) return val.slice();
    if (typeof val === 'string' && val.trim()) return val.split(',').map(s => s.trim());
    return [];
  }, [projectFilters.excluded_countries]);

  const initialExcludedJson = useMemo(() => JSON.stringify(initialExcluded || []), [initialExcluded]);

  // ============ LOCAL STATE ============
  const [excluded, setExcluded] = useState(initialExcluded);
  const [searchInput, setSearchInput] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);
  const prevInitialRef = useRef(initialExcludedJson);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // ============ SYNC FROM STORE ============
  useEffect(() => {
    if (prevInitialRef.current !== initialExcludedJson) {
      setExcluded(initialExcluded);
      prevInitialRef.current = initialExcludedJson;
    }
    setMsg(null);
    setErr(null);
  }, [initialExcludedJson, resolvedSubUserId, initialExcluded]);

  // ============ FILTER COUNTRIES BASED ON SEARCH ============
  const filteredCountries = useMemo(() => {
    if (!searchInput.trim()) return [];
    return searchCountries(searchInput).filter(c => !excluded.includes(c));
  }, [searchInput, excluded]);

  // ============ HANDLERS ============
  const addCountry = useCallback((country) => {
    setExcluded(prev => {
      const next = Array.isArray(prev) ? [...prev] : [];
      if (!next.includes(country)) {
        next.push(country);
      }
      return next;
    });
    setSearchInput('');
    setIsDropdownOpen(false);
    inputRef.current?.focus();
  }, []);

  const removeCountry = useCallback((country) => {
    setExcluded(prev => prev.filter(c => c !== country));
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
        excluded_countries: Array.isArray(excluded) ? excluded.slice() : [],
      },
    };

    setSaving(true);
    try {
      await updateSubUser(finalSubUserId, payload);
      setMsg('✅ Saved successfully');
    } catch (e) {
      setErr(`❌ ${e?.message || 'Save failed'}`);
    } finally {
      setSaving(false);
    }
  }, [finalSubUserId, excluded, projectFilters, updateSubUser]);

  const handleReset = useCallback(() => {
    setExcluded(initialExcluded);
    setSearchInput('');
    setIsDropdownOpen(false);
    setMsg(null);
    setErr(null);
  }, [initialExcluded]);

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
        <h2 className="text-xl font-bold text-gray-900">Exclude Countries</h2>
        <p className="text-sm text-gray-600 mt-2">
          BidMasterPro will skip projects from these client countries.
        </p>
      </div>

      {/* Search & Selected Countries */}
      <div className="mb-6 relative">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Countries to Exclude
        </label>

        {/* Input Field with Selected Tags */}
        <div className="border border-gray-300 rounded-lg p-3 bg-white">
          {/* Selected Country Tags */}
          <div className="flex flex-wrap gap-2 mb-2">
            {excluded.map(country => (
              <div
                key={country}
                className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
              >
                <span>{country}</span>
                <button
                  onClick={() => removeCountry(country)}
                  className="text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
                  type="button"
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
            placeholder={excluded.length === 0 ? 'Search and select countries (e.g., "pak")' : 'Add more countries...'}
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
              {filteredCountries.length > 0 ? (
                filteredCountries.map(country => (
                  <button
                    key={country}
                    onClick={() => addCountry(country)}
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 text-sm font-medium text-gray-700 transition"
                  >
                    {country}
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-center text-gray-500 text-sm">
                  No countries match "{searchInput}"
                </div>
              )}
            </div>
          )}
        </div>

        {/* Help Text */}
        <p className="text-xs text-gray-500 mt-2">
          {excluded.length > 0
            ? `${excluded.length} countries excluded`
            : 'Start typing to search and select countries'}
        </p>
      </div>

      {/* Status Messages */}
      {(msg || err || errorStore) && (
        <div className="mb-6 p-3 rounded-lg" style={{
          backgroundColor: msg ? '#d1fae5' : '#fee2e2',
          color: msg ? '#065f46' : '#7f1d1d'
        }}>
          <p className="text-sm font-medium">
            {msg || err || errorStore}
          </p>
        </div>
      )}

      {/* Selected Summary */}
      {excluded.length > 0 && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 font-medium">
            Excluded Countries ({excluded.length}):
          </p>
          <p className="text-sm text-gray-700 mt-2">
            {excluded.join(', ')}
          </p>
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
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium"
        >
          {saving ? '⏳ Saving...' : ' Save Changes'}
        </button>
      </div>
    </div>
  );
};

CountriesFilter.propTypes = {
  subUserId: PropTypes.string,
};

export default memo(CountriesFilter);


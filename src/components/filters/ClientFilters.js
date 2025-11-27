import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { shallow } from 'zustand/shallow';
import { useUsersStore } from '../../store/useUsersStore';

// rating options
const RATING_OPTIONS = [
  { value: '', label: 'Does not matter' },
  { value: '1', label: 'Atleast 1 star' },
  { value: '2', label: 'Atleast 2 star' },
  { value: '3', label: 'Atleast 3 star' },
  { value: '4', label: 'Atleast 4 star' },
  { value: '5', label: 'Atleast 5 star' },
];

// simple select options
const YES_OPTIONS = [
  { value: '', label: 'Does not matter' },
  { value: 'yes', label: 'Yes, verified only' },
];

const DEPOSIT_OPTIONS = [
  { value: '', label: 'Does not matter' },
  { value: 'yes', label: 'Yes, deposit made' },
];

const ClientFilters = ({ subUserId: propSubUserId }) => {
 const users = useUsersStore((s) => s.users);
  const selectedKey = useUsersStore((s) => s.selectedKey);
  const updateSubUser = useUsersStore((s) => s.updateSubUser);
    useUsersStore( shallow);

  // resolve subUserId: prop overrides store selection
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

  // read existing client_filters from resolved sub-user
  const clientFilters = useMemo(() => {
    if (!finalSubUserId || !Array.isArray(users)) return {};
    const u = users.find((x) => String(x.sub_user_id || x.document_id || x.id) === String(finalSubUserId)
      || (x.sub_username && String(x.sub_username) === String(finalSubUserId)));
    return (u && u.client_filters) || {};
  }, [finalSubUserId, users]);

  // derive initial values
  const initialValues = useMemo(() => ({
    payment_verified: clientFilters.payment_verified ?? '',
    email_verified: clientFilters.email_verified ?? '',
    deposit_made: clientFilters.deposit_made ?? '',
    min_rating: clientFilters.min_rating ?? '',
    min_projects: (typeof clientFilters.min_projects === 'number') ? clientFilters.min_projects : (clientFilters.min_projects ? Number(clientFilters.min_projects) : ''),
    blacklisted_clients: Array.isArray(clientFilters.blacklisted_clients) ? clientFilters.blacklisted_clients.slice() : (typeof clientFilters.blacklisted_clients === 'string' ? clientFilters.blacklisted_clients.split(',').map(s => s.trim()).filter(Boolean) : []),
  }), [clientFilters]);

  const initialJson = useMemo(() => JSON.stringify(initialValues), [initialValues]);

  // local form state
  const [paymentVerified, setPaymentVerified] = useState(initialValues.payment_verified);
  const [emailVerified, setEmailVerified] = useState(initialValues.email_verified);
  const [depositMade, setDepositMade] = useState(initialValues.deposit_made);
  const [minRating, setMinRating] = useState(initialValues.min_rating);
  const [minProjects, setMinProjects] = useState(initialValues.min_projects);
  const [blacklistedText, setBlacklistedText] = useState((initialValues.blacklisted_clients || []).join(', '));
  const [blacklisted, setBlacklisted] = useState(initialValues.blacklisted_clients || []);

  const prevInitialRef = useRef(initialJson);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // sync store -> local only when snapshot changes or user changes
  useEffect(() => {
    if (prevInitialRef.current !== initialJson) {
      setPaymentVerified(initialValues.payment_verified);
      setEmailVerified(initialValues.email_verified);
      setDepositMade(initialValues.deposit_made);
      setMinRating(initialValues.min_rating);
      setMinProjects(initialValues.min_projects);
      setBlacklisted(initialValues.blacklisted_clients || []);
      setBlacklistedText((initialValues.blacklisted_clients || []).join(', '));
      prevInitialRef.current = initialJson;
    }
    setMessage(null);
    setError(null);
    // intentionally depend only on serialized snapshot and sub-user id
  }, [initialJson, finalSubUserId, initialValues]);

  // helper to parse blacklisted text into array
  const parseBlacklisted = useCallback((text) => {
    if (!text) return [];
    return text.split(/[,|\n]/).map(s => s.trim()).filter(Boolean);
  }, []);

  // handlers
  const handleBlacklistedChange = useCallback((e) => {
    setBlacklistedText(e.target.value);
    setBlacklisted(parseBlacklisted(e.target.value));
  }, [parseBlacklisted]);

  const handleSubmit = useCallback(async () => {
    setError(null);
    setMessage(null);
    if (!finalSubUserId) {
      setError('No sub-user selected');
      return;
    }

    // normalize values
    const normalizedMinProjects = (minProjects === '' || minProjects === null || Number.isNaN(Number(minProjects))) ? null : Number(minProjects);

    const payload = {
      client_filters: {
        ...(clientFilters || {}),
        payment_verified: paymentVerified || '',
        email_verified: emailVerified || '',
        deposit_made: depositMade || '',
        min_rating: minRating || '',
        min_projects: normalizedMinProjects,
        blacklisted_clients: Array.isArray(blacklisted) ? blacklisted.slice() : parseBlacklisted(blacklistedText),
      },
    };

    setSaving(true);
    try {
      await updateSubUser(finalSubUserId, payload);
      setMessage('Saved successfully.');
    } catch (e) {
      console.error('Failed to save client_filters', e);
      setError(e?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }, [finalSubUserId, paymentVerified, emailVerified, depositMade, minRating, minProjects, blacklisted, blacklistedText, clientFilters, parseBlacklisted, updateSubUser]);

  return (
    <div className="w-full p-4">
      <div className="mb-4">
        <div className="bg-yellow-50 border-l-4 border-yellow-300 p-3 rounded">
          <p className="text-sm text-yellow-800">
            Notice: You will see projects on the search page regardless of these filters. Projects that match these filters will be ignored when auto-bidding is enabled.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">Payment verified</label>
          <select value={paymentVerified} onChange={(e) => setPaymentVerified(e.target.value)} className="w-full p-2 border rounded">
            {YES_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email verified</label>
          <select value={emailVerified} onChange={(e) => setEmailVerified(e.target.value)} className="w-full p-2 border rounded">
            {YES_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Deposit made</label>
          <select value={depositMade} onChange={(e) => setDepositMade(e.target.value)} className="w-full p-2 border rounded">
            {DEPOSIT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Minimum rating</label>
          <select value={minRating} onChange={(e) => setMinRating(e.target.value)} className="w-full p-2 border rounded">
            {RATING_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1">Minimum projects</label>
          <input
            type="number"
            min="0"
            value={minProjects === null ? '' : minProjects}
            onChange={(e) => setMinProjects(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-40 p-2 border rounded"
            placeholder="e.g. 5"
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Blacklisted clients (comma or newline separated)</label>
        <textarea
          value={blacklistedText}
          onChange={handleBlacklistedChange}
          placeholder="username1, username2"
          className="w-full p-2 border rounded min-h-[80px] resize-y"
        />
        <p className="text-xs text-gray-500 mt-1">Enter usernames separated by comma or newline. They will be stored as an array.</p>
      </div>

      <div className="flex justify-end gap-2">
        <div className="text-sm text-gray-600 mr-auto">{message ? <span className="text-green-600">{message}</span> : (error || '')}</div>
        <button type="button" onClick={() => {
          // reset to server snapshot
          setPaymentVerified(initialValues.payment_verified);
          setEmailVerified(initialValues.email_verified);
          setDepositMade(initialValues.deposit_made);
          setMinRating(initialValues.min_rating);
          setMinProjects(initialValues.min_projects);
          setBlacklisted(initialValues.blacklisted_clients || []);
          setBlacklistedText((initialValues.blacklisted_clients || []).join(', '));
          setMessage(null);
          setError(null);
        }} className="px-3 py-2 border rounded">Reset</button>

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

ClientFilters.propTypes = {
  subUserId: PropTypes.string,
};

export default memo(ClientFilters);
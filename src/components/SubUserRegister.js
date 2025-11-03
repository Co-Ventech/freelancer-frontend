import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SubUserRegister = ({ parentUid, onSuccess }) => {
  const API_BASE = process.env.REACT_APP_API_BASE_URL ;

  const [subUserAccessToken, setSubUserAccessToken] = useState('');
  const [username, setUsername] = useState('');
  const [autobidEnabled, setAutobidEnabled] = useState(false);
  const [autobidForJobType, setAutobidForJobType] = useState('all');
  const [proposalType, setProposalType] = useState('general');
  const [generalProposal, setGeneralProposal] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);


  const validate = () => {
    if (!subUserAccessToken || !subUserAccessToken.trim()) {
      setError('Sub-user access token is required.');
      return false;
    }
    if (!username || !username.trim()) {
      setError('Sub-username is required.');
      return false;
    }
    if (!parentUid) {
      setError('Parent UID missing. Please ensure you are logged in.');
      return false;
    }
    if (!generalProposal || !generalProposal.trim()) {
      setError('General proposal text is required.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    setError(null);
    setMessage(null);
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        sub_user_access_token: subUserAccessToken.trim(),
        sub_username: username.trim(),
        autobid_enabled: !!autobidEnabled,
        parent_uid: parentUid,
        autobid_enabled_for_job_type: autobidForJobType || 'all',
        autobid_proposal_type: proposalType || 'general',
        general_proposal: generalProposal.trim(),
      };

      const url = `${API_BASE}/sub-users`;
      const resp = await axios.post(url, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
        validateStatus: () => true,
      });

      if (resp.status === 200 || resp.status === 201) {
        setMessage('Sub-user created successfully.');
        setUsername('');
        setAutobidEnabled(false);
        setAutobidForJobType('all');
        setProposalType('general');
        setGeneralProposal('');
        if (onSuccess) onSuccess(resp.data);
      } else {
        const errMsg = resp.data?.message || `Server responded ${resp.status}`;
        setError(errMsg);
      }
    } catch (err) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded shadow mb-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold">Register Sub-User</h4>
        <span className="text-xs text-gray-500">Add sub accounts for auto-bidding</span>
      </div>

      {error && <div className="mb-2 text-sm text-red-600">{error}</div>}
      {message && <div className="mb-2 text-sm text-green-600">{message}</div>}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-600">Sub-user Access Token</label>
            <input
              value={subUserAccessToken}
              onChange={(e) => setSubUserAccessToken(e.target.value)}
              className="w-full border px-2 py-1 rounded text-sm"
              placeholder="Access token"
            />
          </div>

          <div>
            <label className="text-xs text-gray-600">Sub Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border px-2 py-1 rounded text-sm"
              placeholder="username"
            />
          </div>

          <div>
            <label className="text-xs text-gray-600">Auto-bid Enabled</label>
            <div className="mt-1">
              <label className="inline-flex items-center">
                <input type="checkbox" checked={autobidEnabled} onChange={(e) => setAutobidEnabled(e.target.checked)} />
                <span className="ml-2 text-sm">Enable</span>
              </label>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-600">Auto-bid Job Type</label>
            <select value={autobidForJobType} onChange={(e) => setAutobidForJobType(e.target.value)} className="w-full border px-2 py-1 rounded text-sm">
              <option value="all">All</option>
              <option value="fixed">Fixed</option>
              <option value="hourly">Hourly</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-600">Proposal Type</label>
            <select value={proposalType} onChange={(e) => setProposalType(e.target.value)} className="w-full border px-2 py-1 rounded text-sm">
              <option value="general">General</option>
              <option value="ai-generated">AI-generated</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="text-xs text-gray-600">General Proposal (required)</label>
            <textarea
              value={generalProposal}
              onChange={(e) => setGeneralProposal(e.target.value)}
              rows={4}
              className="w-full border px-2 py-1 rounded text-sm"
              placeholder="Default proposal text used when proposalType is general"
              required
            />
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <button type="submit" disabled={loading} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">
            {loading ? 'Saving...' : 'Create Sub-user'}
          </button>
          <button type="button" onClick={() => { setUsername(''); setGeneralProposal(''); setError(null); setMessage(null); }} className="px-3 py-1 bg-gray-200 rounded text-sm">
            Reset
          </button>
        </div>
      </form>
    </div>
  );
};

export default SubUserRegister;
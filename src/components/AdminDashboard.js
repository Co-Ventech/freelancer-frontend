import React, { useState, useEffect } from 'react';
import { useFirebaseAuth } from '../contexts/FirebaseAuthContext';
import { useNavigate } from 'react-router-dom';
import firebaseAuthService from '../services/firebaseAuth';
import axios from 'axios';
import { useNotifications } from '../contexts/NotificationContext';

const API_BASE = process.env.REACT_APP_API_BASE_URL || '';

const AdminDashboard = () => {
  const { user, logout,isAdmin } = useFirebaseAuth();
  const navigate = useNavigate();
  const { items: myNotifications, unreadCount, markRead, markAllRead, remove, getAllPersistedNotifications } = useNotifications();

  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false);
  const [showAllUsersNotifications, setShowAllUsersNotifications] = useState(false);
  const [allNotifications, setAllNotifications] = useState([]);

  const [users, setUsers] = useState([]);
  const [savedBids, setSavedBids] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingBids, setLoadingBids] = useState(true);
  const [error, setError] = useState(null);

  // view mode: 'grid' or 'list'
  const [viewMode, setViewMode] = useState('grid');

  // filters
  const [bidderFilter, setBidderFilter] = useState('ALL');
  const [bidderTypeFilter, setBidderTypeFilter] = useState('ALL');
  const [projectTypeFilter, setProjectTypeFilter] = useState('ALL');

  // fixed user filter list (always shown)
  const userFilterList = [
    { id: '8622920', name: 'Zubair' },
    { id: '85786318', name: 'Co_ventech' },
    { id: '88454359', name: 'Zameer Ahmed' },
    { id: '78406347', name: 'Ahsan' },
  ];

  const userMapping = {
    8622920: 'Zubair',
    85786318: 'Co_ventech',
    88454359: 'Zameer Ahmed',
    78406347: 'Ahsan',
  };

  // load all persisted notifications when admin toggles it
  useEffect(() => {
    if (!isAdmin || !showAllUsersNotifications) {
      setAllNotifications([]);
      return;
    }
    try {
      const all = getAllPersistedNotifications();
      setAllNotifications(all);
    } catch (err) {
      console.error('Failed to load all notifications', err);
      setAllNotifications([]);
    }
  }, [isAdmin, showAllUsersNotifications, getAllPersistedNotifications]);


  useEffect(() => {
    loadUsers();
  }, []);

  // reload bids when any filter changes
  useEffect(() => {
    loadBids();
  }, [bidderFilter, bidderTypeFilter, projectTypeFilter]);

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const data = await firebaseAuthService.getAllUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const buildBidsUrl = () => {
    const params = [];
    if (bidderFilter && bidderFilter !== 'ALL') params.push(`bidder_id=${encodeURIComponent(bidderFilter)}`);
    if (bidderTypeFilter && bidderTypeFilter !== 'ALL') params.push(`bidder_type=${encodeURIComponent(bidderTypeFilter)}`);
    if (projectTypeFilter && projectTypeFilter !== 'ALL') params.push(`type=${encodeURIComponent(projectTypeFilter)}`);
    const qs = params.length ? `?${params.join('&')}` : '';
    return `${API_BASE}/bids${qs}`;
  };

  const loadBids = async () => {
    try {
      setLoadingBids(true);
      setError(null);
      const url = buildBidsUrl();
      const res = await axios.get(url);
      const bids = res?.data?.data || [];
      setSavedBids(Array.isArray(bids) ? bids : []);
    } catch (err) {
      console.error('Failed to load bids:', err);
      setSavedBids([]);
      setError('Failed to load saved bids');
    } finally {
      setLoadingBids(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getBidderName = (id) => {
    if (userMapping[id]) return userMapping[id];
    const found = users.find((u) => String(u.uid || u.id) === String(id));
    if (found) return found.name || found.displayName || found.email || 'No data found';
    return 'No data found';
  };

  if (loadingUsers || loadingBids) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome, {user?.displayName || user?.email}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">

            {/* Notifications quick access */}
            <div className="relative">
              <button
                onClick={() => setShowNotificationsPanel((s) => !s)}
                className="px-3 py-1 bg-white border rounded flex items-center gap-2"
              >
                🔔
                <span className="text-sm">{unreadCount > 0 ? `(${unreadCount})` : '0'}</span>
              </button>

              {showNotificationsPanel && (
                <div className="absolute right-0 mt-2 w-96 bg-white border rounded shadow-lg z-50 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <strong>Notifications</strong>
                    <div className="flex items-center gap-2">
                      {isAdmin && (
                        <label className="text-xs flex items-center gap-1">
                          <input
                            type="checkbox"
                            checked={showAllUsersNotifications}
                            onChange={(e) => setShowAllUsersNotifications(e.target.checked)}
                          />
                          All users
                        </label>
                      )}
                      <button onClick={() => markAllRead()} className="text-xs text-blue-600">Mark all read</button>
                    </div>
                  </div>

                  <div style={{ maxHeight: 320 }} className="overflow-auto space-y-2">
                    {(showAllUsersNotifications ? allNotifications : myNotifications).length === 0 ? (
                      <div className="text-sm text-gray-500">No notifications</div>
                    ) : (showAllUsersNotifications ? allNotifications : myNotifications).map((n) => (
                      <div key={n.id} className={`p-2 rounded border ${n.read ? 'bg-gray-50' : 'bg-white'}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="text-sm font-medium">{n.title}</div>
                            <div className="text-xs text-gray-600">{n.message}</div>
                            {n.projectData && (
                              <div className="text-xs text-gray-400 mt-1">Project: {n.projectData.projectTitle || n.projectData.project_id}</div>
                            )}
                          </div>
                          <div className="ml-2 text-xs text-gray-500">{new Date(n.createdAt).toLocaleString()}</div>
                        </div>
                        <div className="mt-2 flex gap-2">
                          <button onClick={() => markRead(n.id)} className="text-xs text-green-600">Mark read</button>
                          <button onClick={() => remove(n.id)} className="text-xs text-red-600">Remove</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {/* Filters */}
            <select value={bidderFilter} onChange={(e) => setBidderFilter(e.target.value)}
              className="border px-2 py-1 rounded">
              <option value="ALL">All Bidders</option>
              {userFilterList.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>

            <select value={bidderTypeFilter} onChange={(e) => setBidderTypeFilter(e.target.value)}
              className="border px-2 py-1 rounded">
              <option value="ALL">All Bid Types</option>
              <option value="manual">Manual</option>
              <option value="auto">Auto</option>
            </select>

            <select value={projectTypeFilter} onChange={(e) => setProjectTypeFilter(e.target.value)}
              className="border px-2 py-1 rounded">
              <option value="ALL">All Project Types</option>
              <option value="fixed">Fixed</option>
              <option value="hourly">Hourly</option>
            </select>

            {/* View toggle */}
            <div className="flex items-center gap-1">
              <button onClick={() => setViewMode('grid')}
                className={`px-3 py-1 rounded ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white border'}`}>
                Grid
              </button>
              <button onClick={() => setViewMode('list')}
                className={`px-3 py-1 rounded ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white border'}`}>
                List
              </button>
            </div>

            <button onClick={loadBids} className="px-3 py-1 bg-gray-800 text-white rounded">Refresh</button>
            <button onClick={handleLogout} className="px-3 py-1 bg-red-600 text-white rounded">Logout</button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* <div className="bg-white p-4 rounded shadow">
            <div className="text-sm text-gray-500">Total Users</div>
            <div className="text-xl font-semibold">{users.length}</div>
          </div> */}
          <div className="bg-white p-4 rounded shadow">
            <div className="text-sm text-gray-500">Saved Bids</div>
            <div className="text-xl font-semibold">{savedBids.length}</div>
          </div>
          {/* <div className="bg-white p-4 rounded shadow">
            <div className="text-sm text-gray-500">Admin Users</div>
            <div className="text-xl font-semibold">{users.filter(u => u.role === 'admin').length}</div>
          </div> */}
        </div>

        {/* Content */}
        {error && <div className="bg-red-50 text-red-700 p-3 rounded mb-4">{error}</div>}

        {savedBids.length === 0 ? (
          <div className="bg-white p-6 rounded shadow">No saved bids found.</div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedBids.map(bid => {
              const key = bid.document_id || `${bid.project_id}_${bid.bidder_id}`;
              return (
                <div key={key} className="bg-white p-4 rounded shadow flex flex-col">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">{bid.projectTitle}</h3>
                      <div className="text-xs text-gray-500 mt-1">{(bid.type || '').toUpperCase()}</div>
                    </div>
                    <div className="font-medium text-gray-800">${bid.amount ?? 'N/A'}</div>
                  </div>

                  <p className="text-sm text-gray-600 mt-2 line-clamp-3">{bid.projectDescription}</p>

                  {/* new: proposal/description */}
                  <div className="mt-2 text-sm text-gray-700">
                    <div className="text-xs text-gray-500">Proposal</div>
                    <div className="mt-1 text-sm text-gray-600 line-clamp-3">
                      {bid.description && bid.description.trim() !== '' ? bid.description : <span className="text-gray-400">No proposal provided</span>}
                    </div>
                  </div>

                  {/* new: budget display */}
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="px-2 py-1 bg-gray-50 rounded">Bidder: {getBidderName(bid.bidder_id)}</span>
                    <span className="px-2 py-1 bg-gray-50 rounded">Period: {bid.period ?? 'N/A'}d</span>
                    <span className="px-2 py-1 bg-gray-50 rounded">Bid Type: {bid.bidder_type || 'N/A'}</span>
                    <span className="px-2 py-1 bg-gray-50 rounded">Project Type: {(bid.type || 'N/A').toUpperCase()}</span>
                    <span className="px-2 py-1 bg-gray-50 rounded">
                      Budget: {bid.budget?.minimum != null ? `$${bid.budget.minimum}` : '-'} - {bid.budget?.maximum != null ? `$${bid.budget.maximum}` : '-'}
                    </span>
                  </div>

                  <div className="mt-3 flex-1">
                    <div className="text-sm text-gray-500 mb-2">Scores</div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {bid.scores ? Object.entries(bid.scores).slice(0, 8).map(([k, v]) => (
                        <div key={k} className="flex justify-between bg-gray-50 px-2 py-1 rounded">
                          <span className="text-xs">{k.replace(/_/g, ' ')}</span>
                          <span className="font-medium text-xs">{typeof v === 'number' ? v : String(v)}</span>
                        </div>
                      )) : <div className="text-xs text-gray-400">No scores</div>}
                    </div>
                  </div>

                  {/* <div className="mt-3 flex gap-2">
                    <button onClick={() => navigator.clipboard?.writeText(JSON.stringify(bid))} className="flex-1 px-2 py-1 bg-gray-100 rounded">Copy</button>
                    <button onClick={() => window.open(`${API_BASE}/projects/${bid.project_id}`, '_blank')} className="flex-1 px-2 py-1 bg-blue-600 text-white rounded">View</button>
                  </div> */}
                </div>
              );
            })}
          </div>
        ) : (
          // list view (table)
          <div className="bg-white rounded shadow overflow-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Project</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Bidder</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Type</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Bid Type</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Amount</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Period</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {savedBids.map(bid => (
                  <tr key={bid.document_id || `${bid.project_id}_${bid.bidder_id}`}>
                    <td className="px-4 py-3 text-sm">{bid.projectTitle}</td>
                    <td className="px-4 py-3 text-sm">{getBidderName(bid.bidder_id)}</td>
                    <td className="px-4 py-3 text-sm">{bid.type}</td>
                    <td className="px-4 py-3 text-sm">{bid.bidder_type}</td>
                    <td className="px-4 py-3 text-sm">${bid.amount ?? 'N/A'}</td>
                    <td className="px-4 py-3 text-sm">{bid.period ?? 'N/A'}d</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
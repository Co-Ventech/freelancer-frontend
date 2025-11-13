import React, { useEffect, useState, useMemo , useCallback} from 'react';
import axios from 'axios';
import { API_BASE, getAuthHeaders } from '../utils/api';
import { useUsersStore } from '../store/useUsersStore';
import { formatPakistanDate } from '../utils/dateUtils';

const SuccessBidsPage = () => {
  const [savedBids, setSavedBids] = useState([]);
  const [loadingBids, setLoadingBids] = useState(true);
  const [error, setError] = useState(null);

   // pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
   const [totalCount, setTotalCount] = useState(null);
  const [paginationIsNext, setPaginationIsNext] = useState(false);

  // UI state (same pattern as AdminDashboard)
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [bidderFilter, setBidderFilter] = useState('ALL');
  const [bidderTypeFilter, setBidderTypeFilter] = useState('ALL');
  const [projectTypeFilter, setProjectTypeFilter] = useState('ALL');

  // dynamic sub-users from store (used for filters / names)
  const subUsers = useUsersStore((s) => s.users || []);

  const userFilterList = useMemo(() => {
    return Array.isArray(subUsers)
      ? subUsers
          .map((u) => {
            const id = String(u.user_bid_id || u.bidder_id || u.user_bid || '');
            const name = u.sub_username || u.name || `sub_${(u.document_id || '').slice(0, 6)}`;
            return id ? { id, name } : null;
          })
          .filter(Boolean)
      : [];
  }, [subUsers]);

  const userMapping = useMemo(() => {
    return (Array.isArray(subUsers) ? subUsers : []).reduce((acc, u) => {
      const id = String(u.user_bid_id || u.bidder_id || u.user_bid || '');
      if (id) acc[id] = u.sub_username || u.name || acc[id] || `sub_${(u.document_id || '').slice(0, 6) || id}`;
      return acc;
    }, {});
  }, [subUsers]);

  const badgeClass = {
    bidder: 'bg-blue-100 text-blue-800 border-blue-300',
    period: 'bg-orange-100 text-orange-800 border-orange-300',
    bidType: 'bg-purple-100 text-purple-800 border-purple-300',
    projectType: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    budget: {
      low: 'bg-green-100 text-green-800 border-green-300',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      high: 'bg-red-100 text-red-800 border-red-300',
    },
  };

  const getBudgetBadgeClass = (min, max) => {
    const amount = max || min || 0;
    if (amount <= 50) return badgeClass.budget.low;
    if (amount <= 500) return badgeClass.budget.medium;
    return badgeClass.budget.high;
  };

  const getBidAmountBadgeClass = (amount) => {
    if (amount == null) return 'bg-gray-100 text-gray-800 border-gray-300';
    if (amount <= 50) return 'bg-green-100 text-green-800 border-green-300';
    if (amount > 100) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-red-100 text-red-800 border-yellow-300';
  };

 const buildBidsUrl = useCallback(() => {
    const params = [];
    if (bidderFilter && bidderFilter !== 'ALL') params.push(`bidder_id=${encodeURIComponent(bidderFilter)}`);
    if (bidderTypeFilter && bidderTypeFilter !== 'ALL') params.push(`bidder_type=${encodeURIComponent(bidderTypeFilter)}`);
    if (projectTypeFilter && projectTypeFilter !== 'ALL') params.push(`type=${encodeURIComponent(projectTypeFilter)}`);
    params.push(`page=${encodeURIComponent(page)}`);
    params.push(`offset=${encodeURIComponent(limit)}`); // use 'offset' per backend
    const qs = params.length ? `?${params.join('&')}` : '';
    return `${(API_BASE || '').replace(/\/$/, '')}/bids${qs}`;
  }, [bidderFilter, bidderTypeFilter, projectTypeFilter, page, limit]);


  const loadBids = useCallback( async () => {
    try {
      setLoadingBids(true);
      setError(null);
      const url = buildBidsUrl();
      const headers = getAuthHeaders();
      const res = await axios.get(url, { headers, validateStatus: () => true });
      if (!(res.status >= 200 && res.status < 300)) {
        throw new Error(res?.data?.message || `Failed to load bids: ${res.status}`);
      }
      const bids = Array.isArray(res.data?.data) ? res.data.data : [];
      // read pagination from response if available
      const pagination = res.data?.pagination || res.data?.meta || res.data?.paging || null;
      if (pagination) {
          const respPage = Number(pagination.page) || page;
        const respLimit = Number(pagination.limit || pagination.offset) || limit;
        const respIsNext = !!pagination.is_next;
        setPage(respPage);
        setLimit(respLimit);
        setPaginationIsNext(respIsNext);
        const possibleTotal = pagination.total ?? pagination.total_count ?? pagination.totalCount ?? pagination.count;
        const numericTotal = typeof possibleTotal !== 'undefined' && possibleTotal !== null ? Number(possibleTotal) : null;
        setTotalCount(Number.isFinite(numericTotal) ? numericTotal : null);

        
        // use respCountForPage to determine end range
      } else {
        // if no pagination provided, clear paginationIsNext and totalCount to conservative defaults
        setPaginationIsNext(false);
        setTotalCount(Array.isArray(bids) ? bids.length : null);
      }

      setSavedBids(bids);
    } catch (err) {
      console.error('Failed to load bids:', err);
     setSavedBids([]);
      setError(err?.message || 'Failed to load bids');
    } finally {
      setLoadingBids(false);
    }
  }, [buildBidsUrl, page, limit]);
  const canPrev = page > 1;
  // determine ability to go next:
 // prefer backend-provided paginationIsNext; fallback to heuristic (full page received).
  const canNext = paginationIsNext || (savedBids.length === limit && !(totalCount !== null && page * limit >= totalCount));
  const goPrev = () => { if (canPrev) setPage((p) => p - 1); };
  const goNext = () => { if (canNext) setPage((p) => p + 1); };
  const changeLimit = (newLimit) => { setLimit(Number(newLimit)); setPage(1); };



  useEffect(() => {
    loadBids();
  }, [loadBids]);

  const getBidDate = (bid) => {
    try {
      return formatPakistanDate(bid.date || bid.createdAt || bid.created_at) || '';
    } catch {
      return new Date(bid.date || bid.createdAt || Date.now()).toLocaleString();
    }
  };

  const getBidderName = (id) => {
    if (userMapping[String(id)]) return userMapping[String(id)];
    const found = subUsers.find((u) => String(u.user_bid_id || u.bidder_id || '') === String(id));
    if (found) return found.sub_username || found.name || String(id);
    return 'No data found';
  };

  if (loadingBids) return <div className="flex items-center justify-center p-8">Loading bids...</div>;
  if (error) return <div className="p-6 text-red-700">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bid Records</h1>
            <p className="text-gray-600 mt-1">Saved bids and history</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select value={bidderFilter} onChange={(e) => setBidderFilter(e.target.value)} className="border px-2 py-1 rounded">
              <option value="ALL">All Bidders</option>
              {userFilterList.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>

            <select value={bidderTypeFilter} onChange={(e) => setBidderTypeFilter(e.target.value)} className="border px-2 py-1 rounded">
              <option value="ALL">All Bid Types</option>
              <option value="manual">Manual</option>
              <option value="auto">Auto</option>
            </select>

            <select value={projectTypeFilter} onChange={(e) => setProjectTypeFilter(e.target.value)} className="border px-2 py-1 rounded">
              <option value="ALL">All Project Types</option>
              <option value="fixed">Fixed</option>
              <option value="hourly">Hourly</option>
            </select>

            <div className="flex items-center gap-1">
              <button onClick={() => setViewMode('grid')} className={`px-3 py-1 rounded ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white border'}`}>Grid</button>
              <button onClick={() => setViewMode('list')} className={`px-3 py-1 rounded ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white border'}`}>List</button>
            </div>

            <button onClick={loadBids} className="px-3 py-1 bg-gray-800 text-white rounded">Refresh</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded shadow">
            <div className="text-sm text-gray-500">Saved Bids</div>
          <div className="text-xl font-semibold">{totalCount ?? savedBids.length}</div>   
          </div>
          {/* <div className="bg-white p-4 rounded shadow">
            <div className="text-sm text-gray-500">Unique Bidders</div>
            <div className="text-xl font-semibold">{[...new Set(savedBids.map(b => String(b.bidder_id)))].length}</div>
          </div> */}
          <div className="bg-white p-4 rounded shadow">
            <div className="text-sm text-gray-500">View Mode</div>
            <div className="text-xl font-semibold">{viewMode}</div>
          </div>
        </div>

        {savedBids.length === 0 ? (
          <div className="bg-white p-6 rounded shadow">No saved bids found.</div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedBids.map((bid) => {
              const key = bid.document_id || `${bid.project_id}_${bid.bidder_id}`;
              return (
                <div key={key} className="bg-white p-4 rounded shadow flex flex-col">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">{bid.projectTitle}</h3>
                      <div className="text-xs text-gray-500 mt-1">{(bid.type || '').toUpperCase()}</div>
                    </div>
                    <div className={`px-3 py-1.5 rounded-lg font-semibold border inline-block ${getBidAmountBadgeClass(bid.amount)}`}>
                      ${bid.amount ?? 'N/A'}
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mt-2 line-clamp-3">{bid.projectDescription}</p>

                  <div className="mt-2 text-sm text-gray-700">
                    <div className="text-xs text-gray-500">Proposal</div>
                    <div className="mt-1 text-sm text-gray-600 line-clamp-3">
                      {bid.description && bid.description.trim() !== '' ? bid.description : <span className="text-gray-400">No proposal provided</span>}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className={`px-2 py-1 rounded font-semibold border ${badgeClass.bidder}`}>Bidder: {getBidderName(bid.bidder_id)}</span>
                    <span className={`px-2 py-1 rounded font-semibold border ${badgeClass.period}`}>Period: {bid.period ?? 'N/A'}d</span>
                    <span className={`px-2 py-1 rounded font-semibold border ${badgeClass.bidType}`}>Bid Type: {bid.bidder_type || 'N/A'}</span>
                    <span className={`px-2 py-1 rounded font-semibold border ${badgeClass.projectType}`}>Project Type: {(bid.type || 'N/A').toUpperCase()}</span>
                    <span className={`px-2 py-1 rounded font-semibold border ${getBudgetBadgeClass(bid.budget?.minimum, bid.budget?.maximum)}`}>Budget: {bid.budget?.minimum != null ? `$${bid.budget.minimum}` : '-'} - {bid.budget?.maximum != null ? `$${bid.budget.maximum}` : '-'}</span>
                  </div>

                  <div className="mt-3 flex-1">
                    <div className="text-sm text-gray-500 mb-2">Scores</div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {bid.scores ? Object.entries(bid.scores).slice(0, 8).map(([k, v]) => {
                        const formatScore = (val) => {
                          if (val == null) return '-';
                          if (typeof val !== 'number') return String(val);
                          return Number.isInteger(val) ? String(val) : val.toFixed(2);
                        };
                        return (
                          <div key={k} className="flex justify-between bg-gray-50 px-2 py-1 rounded">
                            <span className="text-xs">{k.replace(/_/g, ' ')}</span>
                            <span className="font-medium text-xs">{formatScore(v)}</span>
                          </div>
                        );
                      }) : <div className="text-xs text-gray-400">No scores</div>}
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button onClick={() => window.open(`https://www.freelancer.com/projects/${bid.url}`, '_blank')} className="flex-1 px-2 py-1 bg-blue-600 text-white rounded">View Project</button>
                  </div>

                  <div className="mt-3 px-2 py-1 bg-gray-50 rounded text-green-600">
                    Date: {getBidDate(bid)}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
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
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Link</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {savedBids.map((bid) => (
                  <tr key={bid.document_id || `${bid.project_id}_${bid.bidder_id}`}>
                    <td className="px-4 py-3 text-sm">{bid.projectTitle}</td>
                    <td className="px-4 py-3 text-sm">{getBidderName(bid.bidder_id)}</td>
                    <td className="px-4 py-3 text-sm">{bid.type}</td>
                    <td className="px-4 py-3 text-sm">{bid.bidder_type}</td>
                    <td className="px-4 py-3 text-sm">${bid.amount ?? 'N/A'}</td>
                    <td className="px-4 py-3 text-sm">{bid.period ?? 'N/A'}d</td>
                    <td className="px-4 py-3 text-sm">{getBidDate(bid)}</td>
                    <td className="px-4 py-3 text-sm">
                      <button onClick={() => window.open(`https://www.freelancer.com/projects/${bid.url}`, '_blank', 'noopener,noreferrer')} className="px-2 py-1 bg-blue-600 text-white rounded text-xs">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

           {/* Pagination controls */}
           <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {(() => {
              const start = savedBids.length === 0 ? 0 : ((page - 1) * limit) + 1;
              const end = savedBids.length === 0 ? 0 : ((page - 1) * limit) + savedBids.length;
              if (totalCount !== null) {
                return `Showing ${start} - ${end} of ${totalCount}`;
              }
              // when totalCount unknown show range and indicate if there's more
              return `Showing ${start} - ${end}${paginationIsNext ? ' (more available)' : ''}`;
            })()}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={goPrev} disabled={!canPrev} className={`px-3 py-1 rounded ${canPrev ? 'bg-white border' : 'bg-gray-100 text-gray-400'}`}>Prev</button>
            <span className="text-sm">Page {page}</span>
            <button onClick={goNext} disabled={!canNext} className={`px-3 py-1 rounded ${canNext ? 'bg-white border' : 'bg-gray-100 text-gray-400'}`}>Next</button>
            <select value={limit} onChange={(e) => changeLimit(e.target.value)} className="border px-2 py-1 rounded">
              {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n} / page</option>)}
            </select>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SuccessBidsPage;
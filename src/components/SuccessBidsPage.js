
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE, getAuthHeaders } from '../utils/api';

const SuccessBidsPage = () => {
  const [bids, setBids] = useState([]);
  const [filteredBids, setFilteredBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bidderIdFilter, setBidderIdFilter] = useState('ALL');
  const [bidderTypeFilter, setBidderTypeFilter] = useState('ALL');
  const [uniqueBidderIds, setUniqueBidderIds] = useState([]);

  // Hardcoded user mapping
  const userMapping = {
    8622920: 'Zubair',
    85786318: 'Co_ventech',
    88454359: 'Zameer Ahmed',
    78406347: 'Ahsan',
  };

  const userFilterList = [
  { id: '8622920', name: 'Zubair' },
  { id: '85786318', name: 'Co_ventech' },
  { id: '88454359', name: 'Zameer Ahmed' },
  { id: '78406347', name: 'Ahsan' },
];

  useEffect(() => {
    const fetchBids = async () => {
      try {
         const url = `${process.env.REACT_APP_API_BASE_URL || API_BASE}/bids`;
        const headers = getAuthHeaders();
        const response = await axios.get(url, { headers, validateStatus: () => true });

              if (response.data?.status === 200) {
          setBids(response.data.data);
          setFilteredBids(response.data.data);
          const uniqueIds = [...new Set(response.data.data.map((bid) => String(bid.bidder_id)))];
          setUniqueBidderIds(uniqueIds);
        } else {
          setError(response.data?.message || 'Failed to fetch bids');
        }
      } catch (err) {
        setError(err.message || 'An error occurred while fetching bids');
      } finally {
        setLoading(false);
      }
    };

    fetchBids();
  }, []);

  // Filter bids based on selected bidder ID and bidder type
  useEffect(() => {
    let url = `${process.env.REACT_APP_API_BASE_URL || API_BASE}/bids`;
    let params = [];
    if (bidderIdFilter !== 'ALL') {
      params.push(`bidder_id=${bidderIdFilter}`);
    }
    if (bidderTypeFilter !== 'ALL') {
      params.push(`bidder_type=${bidderTypeFilter}`);
    }
    if (params.length > 0) {
      url += '?' + params.join('&');
    }

    const fetchFilteredBids = async () => {
      setLoading(true);
      setError(null);
      try {
       const headers = getAuthHeaders();
      const response = await axios.get(url, { headers, validateStatus: () => true });

        if (response.data?.status === 200) {
          setFilteredBids(response.data.data);
        } else {
          setError(response.data?.message || 'Failed to fetch bids');
          setFilteredBids([]);
        }
      } catch (err) {
        setError(err.message || 'An error occurred while fetching bids');
        setFilteredBids([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFilteredBids();
  }, [bidderIdFilter, bidderTypeFilter]);

  if (loading) {
    return <div>Loading bids...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>Error: {error}</div>;
  }

 return (
  <div style={{ padding: '20px' }}>
    <h2>Bid Records</h2>

    {/* Filter Dropdowns */}
    <div style={{ marginBottom: '20px', display: 'flex', gap: '20px' }}>
      <div>
        <label htmlFor="bidderFilter" style={{ marginRight: '10px', fontWeight: 'bold' }}>
          Filter by Bidder:
        </label>
        <select
          id="bidderFilter"
          value={bidderIdFilter}
          onChange={(e) => setBidderIdFilter(e.target.value)}
          style={{
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            fontSize: '14px',
          }}
        >
          <option value="ALL">All Users</option>
          {userFilterList.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="bidderTypeFilter" style={{ marginRight: '10px', fontWeight: 'bold' }}>
          Filter by Bid Type:
        </label>
        <select
          id="bidderTypeFilter"
          value={bidderTypeFilter}
          onChange={(e) => setBidderTypeFilter(e.target.value)}
          style={{
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            fontSize: '14px',
          }}
        >
          <option value="ALL">All Types</option>
          <option value="manual">Manual</option>
          <option value="auto">Auto</option>
        </select>
      </div>
    </div>

    {/* Display Bids */}
    {filteredBids.length === 0 ? (
      <p>No bids found for the selected user/type.</p>
    ) : (
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Project Title</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Bidder Name</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Bidder Type</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Amount</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Period</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Budget</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Project Description</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Proposal</th>
          </tr>
        </thead>
        <tbody>
          {filteredBids.map((bid) => (
            <tr key={bid.project_id}>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{bid.projectTitle}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                {userMapping[bid.bidder_id] || 'No data found'}
              </td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{bid.bidder_type}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{bid.amount}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{bid.period}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                {bid.budget?.minimum} - {bid.budget?.maximum}
              </td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{bid.projectDescription}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{bid.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
);
};

export default SuccessBidsPage;
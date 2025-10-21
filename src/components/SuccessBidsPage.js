import React, { useEffect, useState } from 'react';
import axios from 'axios';

const SuccessBidsPage = () => {
  const [bids, setBids] = useState([]);
  const [filteredBids, setFilteredBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bidderIdFilter, setBidderIdFilter] = useState('ALL'); // Default filter for all users
  const [uniqueBidderIds, setUniqueBidderIds] = useState([]); // Store unique bidder IDs

  // Mock user mapping (replace with actual API or data source if available)
  const userMapping = {
    88454359:'Zubair',
    85786318: 'Co_ventech',
    88454359: 'Zameer Ahmed',
    78406347: 'Ahsan',
  };
useEffect(() => {
  const fetchBids = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/bids`);
      if (response.data?.status === 200) {
        setBids(response.data.data);
        setFilteredBids(response.data.data); // Initialize filtered bids
        const uniqueIds = [...new Set(response.data.data.map((bid) => String(bid.bidder_id)))];
        setUniqueBidderIds(uniqueIds); // Extract unique bidder IDs
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

  // Filter bids based on the selected bidder ID
 useEffect(() => {
  const fetchFilteredBids = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `${process.env.REACT_APP_API_BASE_URL}/bids`;
      if (bidderIdFilter !== 'ALL') {
        url += `?bidder_id=${bidderIdFilter}`;
      }
      const response = await axios.get(url);
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
}, [bidderIdFilter]);
  if (loading) {
    return <div>Loading bids...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>Error: {error}</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Bid Records</h2>

      {/* Filter Dropdown */}
      <div style={{ marginBottom: '20px' }}>
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
          {uniqueBidderIds.map((id) => (
            <option key={id} value={id}>
              {userMapping[id]}
            </option>
          ))}
        </select>
      </div>

      {/* Display Bids */}
      {filteredBids.length === 0 ? (
        <p>No bids found for the selected user.</p>
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
                  {userMapping[bid.bidder_id]}
                </td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{bid.bidder_type}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{bid.amount }</td>
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
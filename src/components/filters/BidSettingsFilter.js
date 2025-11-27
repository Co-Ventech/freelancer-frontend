import React, { memo } from 'react';
import PropTypes from 'prop-types';

const BidSettingsFilter = memo(({ maxBidsPerDay, setMaxBidsPerDay }) => {
  const handleChange = (e) => {
    setMaxBidsPerDay(e.target.value);
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Bid Settings Filter</h2>
      <input
        type="number"
        value={maxBidsPerDay}
        onChange={handleChange}
        placeholder="Enter max bids per day"
        className="w-full p-2 border rounded"
      />
    </div>
  );
});

BidSettingsFilter.propTypes = {
  maxBidsPerDay: PropTypes.string.isRequired,
  setMaxBidsPerDay: PropTypes.func.isRequired,
};

export default BidSettingsFilter;
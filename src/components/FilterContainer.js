import React from 'react';
import CountriesFilter from './filters/CountriesFilter';
import CurrenciesFilter from './filters/CurrenciesFilter';
import BidSettingsFilter from './filters/BidSettingsFilter';
import ClientFilters from './filters/ClientFilters';
import ProjectBudget from './filters/ProjectBudget';
import UpdateProfile from './filters/UpdateProfile';
import BidPriceFilter from './filters/BidPriceFilter';

const FilterContainer = ({ activeTab="update-profile", filters = {} }) => {
  const renderFilter = () => {
    switch (activeTab) {

      case 'countries':
        return (
          <CountriesFilter
            excludedCountries={filters.excludedCountries || []}
            setExcludedCountries={filters.setExcludedCountries || (() => {})}
          />
        );
      case 'currencies':
        return (
          <CurrenciesFilter
            selectedCurrency={filters.selectedCurrency || ''}
            setSelectedCurrency={filters.setSelectedCurrency || (() => {})}
          />
        );
      case 'client-filters':
        return (
          <ClientFilters
            clientFilters={filters.clientFilters || {}}
            setClientFilters={filters.setClientFilters || (() => {})}
          />
        );
      case 'project-budget':
        return (
          <ProjectBudget
            projectBudget={filters.projectBudget || {}}
            setProjectBudget={filters.setProjectBudget || (() => {})}
          />
        );
      case 'update-profile':
        return <UpdateProfile />;
      case 'bid-price':
        return (
          <BidPriceFilter 
            maxBidsPerDay={filters.maxBidsPerDay || ''}
            setMaxBidsPerDay={filters.setMaxBidsPerDay || (() => {})}
          />
        );
      default:
        return <div className="text-gray-500">Select a valid filter from the sidebar.</div>;
    }
  };

  return <div>{renderFilter()}</div>;
};

export default FilterContainer;
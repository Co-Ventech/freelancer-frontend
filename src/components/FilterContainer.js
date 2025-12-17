import React from 'react';
import CurrenciesFilter from './filters/CurrenciesFilter';
import BidSettingsFilter from './filters/BidSettingsFilter';
import ClientFilters from './filters/ClientFilters';
import ProjectBudget from './filters/ProjectBudget';
import UpdateProfile from './filters/UpdateProfile';
import BidPriceFilter from './filters/BidPriceFilter';
import CategoriesTable from './templates/CategoriesTable';
import TemplatesTable from './templates/TemplatesTable';
import ExcludeCountriesFilter from './filters/CountriesFilter';
// import SimpleAddTemplateFrom from './aiTemplates/SimpleAddTemplateForm';
import AITemplatesPage from './aiTemplates/AITemplatesPage';

const FilterContainer = ({ activeTab="update-profile", filters = {} }) => {
  const renderFilter = () => {
    switch (activeTab) {

      case 'countries':
        return (
          <ExcludeCountriesFilter
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
        case 'templates-categories':
        return (
          <div>
             <CategoriesTable 
            CategoriesTable={filters.CategoriesTable}
            subUserId={filters.setClientFilters || null}
            />
          </div>

        );
      case 'templates':
        return (
          <div>
            <TemplatesTable 
              TemplatesTable={filters.TemplatesTable}
              subUserId={filters.setClientFilters || null}  
            />
          </div>
        );
        case 'ai-templates':
        return(
          <div>
            <AITemplatesPage
              AITemplatesPage={filters.AITemplatesPage}
              subUserId={filters.setClientFilters || null}  
            />  
          </div>
        );

      // case 'template-categories':
      //   return (
      //     <div>
            
      //       <TemplateModal 
      //         TemplateModal={filters.TemplateModal}
      //         subUserId={filters.setClientFilters || null}
      //       />
      //     </div>
      //   );
      // case 'template-settings':

      default:
        return <div className="text-gray-500">Select a valid filter from the sidebar.</div>;
    }
  };

  return <div>{renderFilter()}</div>;
};

export default FilterContainer;
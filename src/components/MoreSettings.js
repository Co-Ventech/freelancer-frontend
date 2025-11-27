import React, { useState } from "react"

import Sidebar from './Sidebar';
import FilterContainer from './FilterContainer';


const MoreSettings = ({ parentUid, onSuccess }) => {
  const [activeTab, setActiveTab] = useState('profile')
  return (
    <div className="flex">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}

      
      />
      

      {/* Main Content */}
      <div className="flex-1 p-6">
        {activeTab ? (
          <FilterContainer activeTab={activeTab} />
        ) : (
          <div className="text-gray-500">Select a filter from the sidebar.</div>
        )}
      </div>
    </div>
  )
}

export default MoreSettings

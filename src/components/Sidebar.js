import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const [openMenus, setOpenMenus] = useState({});
  const navigate = useNavigate();

  const toggleMenu = (key) => {
    setOpenMenus((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const menuConfig = [
    {
      key: 'profile',
      title: 'Profile',
      items: [
        { key: 'update-profile', label: 'Update Profile' },
      ],
    },
    {
      key: 'project-filters',
      title: 'Project Filters',
      items: [
        { key: 'countries', label: 'Countries' },
        { key: 'currencies', label: 'Currencies' },
        { key: 'client-filters', label: 'Client Filters' },
        { key: 'project-budget', label: 'Project Budget' },
      ],
    },
    {
      key: 'bid-settings',
      title: 'Bid Settings',
      items: [
        { key: 'bid-price', label: 'Bid Price' },
        { key: 'max-bid', label: 'Max Bid Amount' },
        { key: 'auto-bid', label: 'Auto Bid' },
      ],
    },
     {
      key: 'manage-templates',
      title: 'Manage Templates',
      items: [

        { key: 'templates-categories', label: 'Template Categories' },
        { key: 'templates', label: 'Templates' },
  // { key: 'template-categories', label: 'Template Categories' },       
        // {key: 'template-settings', label: 'Template Settings' },
      ],
    },
    
  ];

  const handleNavigation = (key) => {
    // Always set activeTab for the clicked item.
    // If you want routing as well, you can call navigate(...) here.
    setActiveTab(key);
  };

  return (
    <aside className="w-64 bg-white shadow-lg border-r border-gray-200 left-0 top-0 overflow-y-auto">
      <div className="p-4 space-y-4">
        {menuConfig.map((menu) => (
          <div key={menu.key}>
            <div
              className="font-semibold text-gray-700 cursor-pointer flex justify-between items-center"
              onClick={() => toggleMenu(menu.key)}
            >
              {menu.title}
              <span>{openMenus[menu.key] ? '-' : '+'}</span>
            </div>
            {openMenus[menu.key] && (
              <div className="pl-4 space-y-2">
                {menu.items.map((item) => (
                  <div
                    key={item.key}
                    className={`cursor-pointer p-2 rounded hover:bg-gray-100 ${activeTab === item.key ? 'bg-blue-50' : ''}`}
                    onClick={() => handleNavigation(item.key)}
                  >
                    {item.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;
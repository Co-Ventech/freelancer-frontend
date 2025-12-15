// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';

// const Sidebar = ({ activeTab, setActiveTab }) => {
//   const [openMenus, setOpenMenus] = useState({});
//   const navigate = useNavigate();

//   const toggleMenu = (key) => {
//     setOpenMenus((prev) => ({ ...prev, [key]: !prev[key] }));
//   };

//   const menuConfig = [
//     {
//       key: 'profile',
//       title: 'Profile',
//       items: [
//         { key: 'update-profile', label: 'Update Profile' },
//       ],
//     },
//     {
//       key: 'project-filters',
//       title: 'Project Filters',
//       items: [
//         { key: 'countries', label: 'Countries' },
//         { key: 'currencies', label: 'Currencies' },
//         { key: 'client-filters', label: 'Client Filters' },
//         { key: 'project-budget', label: 'Project Budget' },
//       ],
//     },
//     {
//       key: 'bid-settings',
//       title: 'Bid Settings',
//       items: [
//         { key: 'bid-price', label: 'Bid Price' },
//         // { key: 'max-bid', label: 'Max Bid Amount' },
//         // { key: 'auto-bid', label: 'Auto Bid' },
//       ],
//     },
//      {
//       key: 'manage-templates',
//       title: 'Manage Templates',
//       items: [

//         { key: 'templates-categories', label: 'Template Categories' },
//         { key: 'templates', label: 'Templates' },
//   // { key: 'template-categories', label: 'Template Categories' },       
//         // {key: 'template-settings', label: 'Template Settings' },
//       ],

//     },
//     {
//       key:'ai-templates',
//       title:'AI Templates',
//       items:[
//         {key:'ai-templates', label:'AI Templates'},
//       ]
//     },
    
//   ];

//   const handleNavigation = (key) => {
//    if (typeof setActiveTab === 'function') {
//       setActiveTab(key);
//       return;
//     }

//     // Fallback: navigate into /more-settings so MainLayout's Sidebar controls content
//     navigate(`/more-settings/${key}`);
//   };

//   return (
//     <aside className="w-64 bg-white shadow-lg border-r border-gray-200 left-0 top-0 overflow-y-auto">
//       <div className="p-4 space-y-4">
//         {menuConfig.map((menu) => (
//           <div key={menu.key}>
//             <div
//               className="font-semibold text-gray-700 cursor-pointer flex justify-between items-center"
//               onClick={() => toggleMenu(menu.key)}
//             >
//               {menu.title}
//               <span>{openMenus[menu.key] ? '-' : '+'}</span>
//             </div>
//             {openMenus[menu.key] && (
//               <div className="pl-4 space-y-2">
//                 {menu.items.map((item) => (
//                   <div
//                     key={item.key}
//                     className={`cursor-pointer p-2 rounded hover:bg-gray-100 ${activeTab === item.key ? 'bg-blue-50' : ''}`}
//                     onClick={() => handleNavigation(item.key)}
//                   >
//                     {item.label}
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>
//         ))}
//       </div>
//     </aside>
//   );
// };

// export default Sidebar;

// ...existing code...
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar = ({ activeTab: propActiveTab = null, setActiveTab = null }) => {
  const [openMenus, setOpenMenus] = useState({});
  const navigate = useNavigate();
  const location = useLocation();

  const menuConfig = [
    {
      key: 'profile',
      title: 'Profile',
      items: [{ key: 'update-profile', label: 'Update Profile' }],
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
      items: [{ key: 'bid-price', label: 'Bid Price' }],
    },
    {
      key: 'manage-templates',
      title: 'Manage Templates',
      items: [
        { key: 'templates-categories', label: 'Template Categories' },
        { key: 'templates', label: 'Templates' },
      ],
    },
    {
      key: 'ai-templates',
      title: 'AI Templates',
      items: [{ key: 'ai-templates', label: 'AI Templates' }],
    },
  ];

  const toggleMenu = (key) => {
    setOpenMenus((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // derive active tab from prop OR from current path (/more-settings/:tab)
  const deriveActiveTabFromLocation = () => {
    const parts = (location.pathname || '').split('/').filter(Boolean);
    // look for route part after 'more-settings'
    const msIndex = parts.indexOf('more-settings');
    if (msIndex >= 0 && parts.length > msIndex + 1) return parts[msIndex + 1];
    // if path is /ai-templates treat as ai-templates
    if (parts[0] === 'ai-templates') return 'ai-templates';
    return null;
  };

  const activeTab = propActiveTab || deriveActiveTabFromLocation();

  // ensure parent menu of activeTab is opened on mount / when activeTab changes
  useEffect(() => {
    if (!activeTab) return;
    const menuKey = menuConfig.find((m) => m.items.some((it) => it.key === activeTab))?.key;
    if (menuKey) setOpenMenus((prev) => ({ ...prev, [menuKey]: true }));
  }, [activeTab]);

  const handleNavigation = (key) => {
    if (typeof setActiveTab === 'function') {
      setActiveTab(key);
      return;
    }
    // navigate into /more-settings/<key> for filter entries, ai-templates handled separately
    if (key === 'ai-templates') {
      navigate('/ai-templates');
      return;
    }
    navigate(`/more-settings/${key}`);
  };

  return (
    <aside className="h-full">
      <div className="p-4 space-y-4">
        {menuConfig.map((menu) => (
          <div key={menu.key}>
            <div
              className="font-semibold text-gray-700 cursor-pointer flex justify-between items-center py-2"
              onClick={() => toggleMenu(menu.key)}
            >
              <span>{menu.title}</span>
              <span className="text-gray-400">{openMenus[menu.key] ? '−' : '+'}</span>
            </div>

            {openMenus[menu.key] && (
              <div className="pl-3 space-y-1">
                {menu.items.map((item) => {
                  const isActive = activeTab === item.key;
                  return (
                    <div
                      key={item.key}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleNavigation(item.key); }}
                      onClick={() => handleNavigation(item.key)}
                      className={`cursor-pointer p-2 rounded text-sm ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                      {item.label}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;
// ...existing code...
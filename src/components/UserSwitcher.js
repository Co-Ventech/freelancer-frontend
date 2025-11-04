// import React, { useState } from 'react';
// import { useUsersStore } from '../store/useUsersStore';


// const UserSwitcher = () => {
//   // use Zustand store for sub-users instead of AuthContext
//   const users = useUsersStore((s) => s.users);
//   const selectedKey = useUsersStore((s) => s.selectedKey);
//   const selectUser = useUsersStore((s) => s.selectUser);
//   const isLoading = useUsersStore((s) => s.loading);
//   const [isOpen, setIsOpen] = useState(false);
//   const [isConfirming, setIsConfirming] = useState(false);

//   // Build availableUsers lookup to stay compatible with previous components
//   const availableUsers = React.useMemo(() => {
//     const map = {};
//     (users || []).forEach(u => {
//       const key = u.sub_username || String(u.id);
//       map[key] = { name: u.sub_username || u.name || key, color: u.color || 'gray', raw: u };
//     });
//     return map;
//   }, [users]);

//   const currentUser = selectedKey || (Object.keys(availableUsers)[0] || 'DEFAULT');

//   const handleUserSelect = (userKey) => {
//     // build availableUsers map on the fly (keeps compatibility with previous shape)
//     const availableUsers = (users || []).reduce((acc, u) => {
//       const key = u.sub_username || String(u.id);
//       acc[key] = { name: u.sub_username || u.name || key, color: u.color || 'gray', raw: u };
//       return acc;
//     }, {});

//     const currentUser = selectedKey || (Object.keys(availableUsers)[0] || 'DEFAULT');

//     if (userKey === currentUser) {
//       setIsOpen(false);
//       return;
//     }

//     // Show confirmation for page refresh
//     setIsConfirming(true);
//     const userInfo = availableUsers[userKey];
//     const confirmed = window.confirm(
//       `🔄 Switch to ${userInfo?.name || userKey}?\n\n` +
//       `This will refresh the page to load the new user's configuration.\n\n` +
//       `Current user: ${availableUsers[currentUser]?.name || currentUser}\n` +
//       `New user: ${userInfo?.name || userKey}\n\n` +
//       `Continue?`
//     );

//     if (confirmed) {
//       try {
//         console.log(`👤 User confirmed switch to ${userKey}`);
//         selectUser(userKey);
//         // preserve previous behavior: reload so other contexts reinitialize
//         window.location.reload();
//       } catch (err) {
//         console.error('Failed to switch user:', err);
//         alert('Failed to switch user. See console for details.');
//       }
//     } else {
//       console.log(`❌ User cancelled switch to ${userKey}`);
//     }

//     setIsConfirming(false);
//     setIsOpen(false);
//   };

//   if (isLoading) {
//     return (
//       <div style={{
//         padding: '8px 16px',
//         backgroundColor: '#f8f9fa',
//         border: '1px solid #dee2e6',
//         borderRadius: '6px',
//         fontSize: '14px',
//         color: '#6c757d'
//       }}>
//         ⏳ Loading user config...
//       </div>
//     );
//   }

//   const currentUserInfo = availableUsers[currentUser] || { name: currentUser, color: 'gray' };

//   return (
//     <div style={{ position: 'relative', display: 'inline-block' }}>
//       {/* Current User Button */}
//       <button
//         onClick={() => setIsOpen(!isOpen)}
//         disabled={isConfirming}
//         style={{
//           display: 'flex',
//           alignItems: 'center',
//           gap: '8px',
//           padding: '10px 16px',
//           backgroundColor: '#007bff',
//           color: 'white',
//           border: 'none',
//           borderRadius: '6px',
//           fontSize: '14px',
//           fontWeight: '500',
//           cursor: isConfirming ? 'wait' : 'pointer',
//           opacity: isConfirming ? 0.7 : 1,
//           transition: 'all 0.2s ease'
//         }}
//       >
//         <span 
//           style={{
//             width: '10px',
//             height: '10px',
//             borderRadius: '50%',
//             backgroundColor: 'white',
//             opacity: 0.8
//           }}
//         />
//         <span>👤 {currentUserInfo.name}</span>
//         <span style={{ 
//           transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
//           transition: 'transform 0.2s ease'
//         }}>
//           ▼
//         </span>
//       </button>

//       {/* Dropdown Menu */}
//       {isOpen && (
//         <div style={{
//           position: 'absolute',
//           top: '100%',
//           left: '0',
//           right: '0',
//           marginTop: '4px',
//           backgroundColor: 'white',
//           border: '1px solid #dee2e6',
//           borderRadius: '6px',
//           boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
//           zIndex: 1000,
//           overflow: 'hidden'
//         }}>
//           {/* Header */}
//           <div style={{
//             padding: '8px 12px',
//             backgroundColor: '#f8f9fa',
//             borderBottom: '1px solid #dee2e6',
//             fontSize: '12px',
//             fontWeight: '600',
//             color: '#495057'
//           }}>
//             🔄 Switch User (Page Refresh)
//           </div>

//           {/* User Options */}
//           {Object.entries(availableUsers).map(([key, info]) => (
//             <button
//               key={key}
//               onClick={() => handleUserSelect(key)}
//               style={{
//                 display: 'flex',
//                 alignItems: 'center',
//                 justifyContent: 'space-between',
//                 width: '100%',
//                 padding: '10px 12px',
//                 backgroundColor: key === currentUser ? '#e7f3ff' : 'transparent',
//                 color: key === currentUser ? '#0056b3' : '#495057',
//                 border: 'none',
//                 borderBottom: '1px solid #f1f3f5',
//                 fontSize: '14px',
//                 cursor: 'pointer',
//                 transition: 'all 0.2s ease'
//               }}
//               onMouseEnter={(e) => {
//                 if (key !== currentUser) {
//                   e.target.style.backgroundColor = '#f8f9fa';
//                 }
//               }}
//               onMouseLeave={(e) => {
//                 if (key !== currentUser) {
//                   e.target.style.backgroundColor = 'transparent';
//                 }
//               }}
//             >
//               <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
//                 <span
//                   style={{
//                     width: '8px',
//                     height: '8px',
//                     borderRadius: '50%',
//                     backgroundColor: key === currentUser ? '#007bff' : '#6c757d'
//                   }}
//                 />
//                 <span style={{ fontWeight: key === currentUser ? '600' : '400' }}>
//                   {info.name}
//                 </span>
//               </div>
              
//               {key === currentUser && (
//                 <span style={{ fontSize: '12px', opacity: 0.8 }}>✓ Active</span>
//               )}
//             </button>
//           ))}

//           {/* Footer */}
//           <div style={{
//             padding: '8px 12px',
//             backgroundColor: '#f8f9fa',
//             borderTop: '1px solid #dee2e6',
//             fontSize: '11px',
//             color: '#6c757d',
//             textAlign: 'center'
//           }}>
//             💡 Switching users refreshes the page
//           </div>
//         </div>
//       )}

//       {/* Backdrop */}
//       {isOpen && (
//         <div
//           style={{
//             position: 'fixed',
//             top: 0,
//             left: 0,
//             right: 0,
//             bottom: 0,
//             zIndex: 999
//           }}
//           onClick={() => setIsOpen(false)}
//         />
//       )}
//     </div>
//   );
// };

// export default UserSwitcher;


import React, { useEffect } from 'react';
import { useUsersStore } from '../store/useUsersStore';

const UserSwitcher = ({ parentUid }) => {
  const users = useUsersStore((s) => s.users);
  const selectedKey = useUsersStore((s) => s.selectedKey);
  const selectUser = useUsersStore((s) => s.selectUser);
  const fetchUsers = useUsersStore((s) => s.fetchUsers);
  const loading = useUsersStore((s) => s.loading);

  // Load users when parentUid becomes available and store is empty
  useEffect(() => {
    if (parentUid && users.length === 0) {
      fetchUsers(parentUid).catch(() => { /* handled in store */ });
    }
  }, [parentUid, users.length, fetchUsers]);

  // persist selection to localStorage
  useEffect(() => {
    try {
      if (selectedKey) localStorage.setItem('SELECTED_SUB_USER', selectedKey);
    } catch {}
  }, [selectedKey]);

  const handleChange = (e) => {
    const key = e.target.value || null;
    try {
      console.log(`[UserSwitcher] switching from "${selectedKey || 'NONE'}" => "${key || 'NONE'}"`);
    } catch{}
    selectUser(key);
    // do not force page reload; let app react to selection
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <label htmlFor="subUserSelect" style={{ fontSize: 12, color: '#6c757d' }}>Account:</label>
      <select
        id="subUserSelect"
        value={selectedKey || ''}
        onChange={handleChange}
        disabled={loading}
        style={{
          padding: '6px 8px',
          borderRadius: '4px',
          border: '1px solid #ced4da',
          background: 'white',
          color: '#495057',
          fontSize: '13px'
        }}
      >
        <option value="">Select account</option>
        {users.map((u) => {
          const key = u.sub_username || String(u.id);
          const label = u.sub_username || u.name || `User ${u.id}`;
          return <option key={key} value={key}>{label}</option>;
        })}
      </select>
    </div>
  );
};

export default UserSwitcher;
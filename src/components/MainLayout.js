// // ...existing code...
// import React, { useEffect, useState } from 'react';
// import { Outlet, useNavigate, useLocation } from 'react-router-dom';
// import { useFirebaseAuth } from '../contexts/FirebaseAuthContext';
// import { useUsersStore } from '../store/useUsersStore';
// import NotificationBell from './NotificationBell';
// import UserSwitcher from './UserSwitcher';
// import Sidebar from './Sidebar';
// import ProposalModal from './ProposalModal';
// import { useModal } from '../contexts/ModalContext';

// const MainLayout = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { user: fbUser, logout } = useFirebaseAuth();
//   const fetchUsers = useUsersStore((s) => s.fetchUsers);
//   const updateSubUser = useUsersStore((s) => s.updateSubUser);
//   const getSelectedUser = useUsersStore((s) => s.getSelectedUser);
//   const selectedUser = getSelectedUser ? getSelectedUser() : null;
//   const { modalState, closeModal } = useModal();

//   // local UI state for sub-user updates
//   const [updatingSubUser, setUpdatingSubUser] = useState(false);
//   const [useAiProposal, setUseAiProposal] = useState(() => {
//     try { return localStorage.getItem('AUTO_BID_USE_AI') === 'true'; } catch { return true; }
//   });

//   // Load sub-users when auth changes (keeps UserSwitcher populated)
//   useEffect(() => {
//     if (!fbUser?.uid) return;
//     (async () => {
//       try {
//         const idToken = typeof fbUser.getIdToken === 'function' ? await fbUser.getIdToken() : null;
//         await fetchUsers(fbUser.uid, idToken);
//       } catch (err) {
//         console.warn('MainLayout: fetchUsers failed', err?.message || err);
//       }
//     })();
//   }, [fbUser, fetchUsers]);

//   // sync useAiProposal with selectedUser when it changes
//   useEffect(() => {
//     try {
//       const isAi = selectedUser?.autobid_proposal_type === 'ai';
//       setUseAiProposal(isAi);
//     } catch (e) { /* ignore */ }
//   }, [selectedUser]);

//   useEffect(() => {
//     try { localStorage.setItem('AUTO_BID_USE_AI', useAiProposal ? 'true' : 'false'); } catch {}
//   }, [useAiProposal]);

//   const patchSelectedUser = async (payload) => {
//     if (!selectedUser) {
//       alert('Please select an account before updating settings.');
//       throw new Error('No selected sub-user');
//     }
//     setUpdatingSubUser(true);
//     try {
//       const subUserId = selectedUser.document_id || selectedUser.sub_user_id || selectedUser.id;
//       await updateSubUser(subUserId, payload);
//     } catch (err) {
//       console.error('Failed to update sub-user:', err?.message || err);
//       alert('Failed to update account settings: ' + (err?.message || err));
//       throw err;
//     } finally {
//       setUpdatingSubUser(false);
//     }
//   };

//   const handleToggleAutoBid = async () => {
//     if (!selectedUser) {
//       alert('Please select an account before toggling AutoBid');
//       return;
//     }
//     try {
//       const newValue = !selectedUser.autobid_enabled;
//       await patchSelectedUser({ autobid_enabled: newValue });
//     } catch (err) { /* handled in patchSelectedUser */ }
//   };

//   const handleToggleUseAiProposal = async (checked) => {
//     setUseAiProposal(checked);
//     try {
//       await patchSelectedUser({ autobid_proposal_type: checked ? 'ai' : 'general' });
//     } catch (err) {
//       // revert on failure
//       setUseAiProposal(prev => !prev);
//     }
//   };

//   const handleAutoBidTypeChange = async (val) => {
//     try {
//       await patchSelectedUser({ autobid_enabled_for_job_type: val });
//     } catch (err) { /* handled */ }
//   };

//   // Show sidebar only for app routes (adjust prefixes if needed)
//   const SIDEBAR_PATH_PREFIXES = ['/more-settings', '/ai-templates', '/subusers'];
//   const showSidebar = SIDEBAR_PATH_PREFIXES.some((p) => location.pathname.startsWith(p));

//   return (
//     <div className="min-h-screen bg-gray-50 flex">
//       {showSidebar && <Sidebar activeTab={null} setActiveTab={() => {}} />}

//       <div className="flex-1 flex flex-col">
//         <header className="flex items-center justify-between px-6 py-3 bg-white border-b">
//           <div className="flex items-center gap-4">
//             <button onClick={() => navigate('/')} className="text-lg font-semibold">🤖 AutoBidder</button>

//             {/* <nav className="hidden sm:flex gap-3 text-sm text-gray-600">
//               <button onClick={() => navigate('/')} className="hover:underline">Dashboard</button>
//               <button onClick={() => navigate('/more-settings')} className="hover:underline">More Settings</button>
//               <button onClick={() => navigate('/ai-templates')} className="hover:underline">AI Templates</button>
//             </nav> */}
//           </div>

//           <div className="flex items-center gap-4">
//             {/* AutoBid enable checkbox */}
//             <label className="flex items-center gap-2 text-sm">
//               <input
//                 type="checkbox"
//                 checked={selectedUser?.autobid_enabled === true}
//                 onChange={handleToggleAutoBid}
//                 disabled={updatingSubUser}
//               />
//               <span>Enable AutoBid</span>
//             </label>

//             {/* Use AI proposals toggle */}
//             <label className="flex items-center gap-2 text-sm">
//               <input
//                 type="checkbox"
//                 checked={useAiProposal}
//                 onChange={(e) => handleToggleUseAiProposal(e.target.checked)}
//                 disabled={updatingSubUser}
//               />
//               <span>Use AI proposals for AutoBid</span>
//             </label>

//             {/* AutoBid Type */}
//             <div className="flex items-center gap-2">
//               <label htmlFor="autoBidType" className="text-sm">AutoBid Type:</label>
//               <select
//                 id="autoBidType"
//                 value={selectedUser?.autobid_enabled_for_job_type || 'all'}
//                 onChange={(e) => handleAutoBidTypeChange(e.target.value)}
//                 className="border rounded px-2 py-1 text-sm"
//                 disabled={updatingSubUser}
//               >
//                 <option value="all">All</option>
//                 <option value="fixed">Fixed</option>
//                 <option value="hourly">Hourly</option>
//               </select>
//             </div>

//             {updatingSubUser && <div className="text-sm text-gray-500">Saving...</div>}

//             <NotificationBell />
//             <button onClick={() => navigate('/bids')} className="px-3 py-1 bg-blue-600 text-white rounded">Bids</button>
//             <button onClick={() => navigate('/subusers')} className="px-3 py-1 bg-teal-600 text-white rounded">Sub-users</button>

//             <UserSwitcher parentUid={fbUser?.uid} />
//             <span className="text-sm text-gray-600 hidden sm:block">Hi, <strong>{fbUser?.displayName || fbUser?.email}</strong></span>
//             <button onClick={logout} className="px-3 py-1 bg-red-500 text-white rounded">Logout</button>
//           </div>
//         </header>

//         <main className="flex-1 p-6 overflow-auto">
//           <Outlet />
//         </main>
//       </div>

//       {modalState.isOpen && modalState.type === 'proposal' && (
//         <ProposalModal isOpen={modalState.isOpen} onClose={closeModal} onSubmit={() => {}} projectData={modalState.data} />
//       )}
//     </div>
//   );
// };

// export default MainLayout;
// // ...existing code...


// ...existing code...
import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useFirebaseAuth } from '../contexts/FirebaseAuthContext';
import { useUsersStore } from '../store/useUsersStore';
import NotificationBell from './NotificationBell';
import UserSwitcher from './UserSwitcher';
import Sidebar from './Sidebar';
import ProposalModal from './ProposalModal';
import { useModal } from '../contexts/ModalContext';

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: fbUser, logout } = useFirebaseAuth();
  const fetchUsers = useUsersStore((s) => s.fetchUsers);
  const updateSubUser = useUsersStore((s) => s.updateSubUser);
  // const getSelectedUser = useUsersStore((s) => s.getSelectedUser);
  // const selectedUser = getSelectedUser ? getSelectedUser() : null;
 const users = useUsersStore((s) => s.users);
  const selectedKey = useUsersStore((s) => s.selectedKey);
  const selectedUser = React.useMemo(() => {
    if (!selectedKey || !Array.isArray(users)) return null;
    return users.find((u) => {
      const ids = [u.document_id, u.sub_user_id, u.id, u._id, u.uid, u.sub_username, u.username];
      return ids.some((id) => id && String(id) === String(selectedKey));
    }) || null;
  }, [users, selectedKey]);


  const { modalState, closeModal } = useModal();

  const [updatingSubUser, setUpdatingSubUser] = useState(false);
  const [useAiProposal, setUseAiProposal] = useState(() => {
    try { return localStorage.getItem('AUTO_BID_USE_AI') === 'true'; } catch { return true; }
  });

  useEffect(() => {
    if (!fbUser?.uid) return;
    (async () => {
      try {
        const idToken = typeof fbUser.getIdToken === 'function' ? await fbUser.getIdToken() : null;
        await fetchUsers(fbUser.uid, idToken);
      } catch (err) {
        console.warn('MainLayout: fetchUsers failed', err?.message || err);
      }
    })();
  }, [fbUser, fetchUsers]);

  useEffect(() => {
    try {
      const isAi = selectedUser?.autobid_proposal_type === 'ai';
      setUseAiProposal(isAi);
    } catch (e) { /* ignore */ }
  }, [selectedUser]);

  useEffect(() => {
    try { localStorage.setItem('AUTO_BID_USE_AI', useAiProposal ? 'true' : 'false'); } catch {}
  }, [useAiProposal]);

  const patchSelectedUser = async (payload) => {
    const target = selectedUser;
    if (!target) {
      alert('Please select an account before updating settings.');
      throw new Error('No selected sub-user');
    }
    setUpdatingSubUser(true);
    try {
      // const subUserId = selectedUser.document_id || selectedUser.sub_user_id || selectedUser.id;
      // await updateSubUser(subUserId, payload);
       const subUserId = target.document_id || target.sub_user_id || target.id || target._id || target.uid;
      await updateSubUser(subUserId, payload);

    } catch (err) {
      console.error('Failed to update sub-user:', err?.message || err);
      alert('Failed to update account settings: ' + (err?.message || err));
      throw err;
    } finally {
      setUpdatingSubUser(false);
    }
  };

  const handleToggleAutoBid = async () => {
    // if (!selectedUser) {
    //   alert('Please select an account before toggling AutoBid');
    //   return;
    // }
    // try {
    //   const newValue = !selectedUser.autobid_enabled;
    //   await patchSelectedUser({ autobid_enabled: newValue });
    // } catch (err) { /* handled in patchSelectedUser */ }

     const target = selectedUser;
   if (!target) {
      alert('Please select an account before toggling AutoBid');
      return;
    }
    try {
      const newValue = !target.autobid_enabled;
      await patchSelectedUser({ autobid_enabled: newValue });
    } catch (err) { /* handled in patchSelectedUser */ }

  };

  const handleToggleUseAiProposal = async (checked) => {
    setUseAiProposal(checked);
    try {
      await patchSelectedUser({ autobid_proposal_type: checked ? 'ai' : 'general' });
    } catch (err) {
      setUseAiProposal(prev => !prev);
    }
  };

  const handleAutoBidTypeChange = async (val) => {
    try {
      await patchSelectedUser({ autobid_enabled_for_job_type: val });
    } catch (err) { /* handled */ }
  };

  // sidebar visibility: show for specific app routes
  const SIDEBAR_PATH_PREFIXES = ['/more-settings', '/ai-templates', '/subusers'];
  const showSidebar = SIDEBAR_PATH_PREFIXES.some((p) => location.pathname.startsWith(p));

  return (
    // header on top, then content area with sidebar & main — keeps single sidebar below header
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="flex items-center justify-between px-6 py-3 bg-white border-b">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="text-lg font-semibold">🤖 AutoBidder</button>

          <nav className="hidden sm:flex gap-12 text-sm text-gray-800">
            <button onClick={() => navigate('/')} className="hover:underline">Dashboard</button>
            <button onClick={() => navigate('/more-settings')} className="hover:underline">More Settings</button>
            {/* <button onClick={() => navigate('/ai-templates')} className="hover:underline">AI Templates</button> */}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={selectedUser?.autobid_enabled === true}
              onChange={handleToggleAutoBid}
              disabled={updatingSubUser}
            />
            <span>Enable AutoBid</span>
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={useAiProposal}
              onChange={(e) => handleToggleUseAiProposal(e.target.checked)}
              disabled={updatingSubUser}
            />
            <span>Use AI proposals for AutoBid</span>
          </label>

          <div className="flex items-center gap-2">
            <label htmlFor="autoBidType" className="text-sm">AutoBid Type:</label>
            <select
              id="autoBidType"
              value={selectedUser?.autobid_enabled_for_job_type || 'all'}
              onChange={(e) => handleAutoBidTypeChange(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
              disabled={updatingSubUser}
            >
              <option value="all">All</option>
              <option value="fixed">Fixed</option>
              <option value="hourly">Hourly</option>
            </select>
          </div>

          {updatingSubUser && <div className="text-sm text-gray-500">Saving...</div>}

          <NotificationBell />
          <button onClick={() => navigate('/bids')} className="px-3 py-1 bg-blue-600 text-white rounded">Bids</button>
          <button onClick={() => navigate('/subusers')} className="px-3 py-1 bg-teal-600 text-white rounded">Sub-users</button>

            <span className="text-sm text-gray-600 hidden sm:block">Hi, <strong>{fbUser?.displayName || fbUser?.email}</strong></span>

          <UserSwitcher parentUid={fbUser?.uid} />
        
          {/* <button onClick={logout} className="px-3 py-1 bg-red-500 text-white rounded">Logout</button> */}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {showSidebar && (
          <div className="w-64 border-r bg-white overflow-auto">
            <Sidebar />
          </div>
        )}

        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>

      {modalState.isOpen && modalState.type === 'proposal' && (
        <ProposalModal isOpen={modalState.isOpen} onClose={closeModal} onSubmit={() => {}} projectData={modalState.data} />
      )}
    </div>
  );
};

export default MainLayout;
// ...existing code...
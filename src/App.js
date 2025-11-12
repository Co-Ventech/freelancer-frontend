import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import FetchButton from './components/FetchButton';
import ProjectList from './components/ProjectList';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import { useFreelancerAPI } from './hooks/useFreelancerAPI';
import { ModalProvider, useModal } from './contexts/ModalContext';
import { useBidding } from './hooks/useBidding';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { FirebaseAuthProvider, useFirebaseAuth } from './contexts/FirebaseAuthContext';
import ProposalModal from './components/ProposalModal';
import { NotificationProvider } from './contexts/NotificationContext';
import NotificationBell from './components/NotificationBell';
import AdminDashboard from './components/AdminDashboard';
import SuccessBidsPage from './components/SuccessBidsPage';
import { useNavigate } from 'react-router-dom';
import SubUserRegister from './components/SubUserRegister';
import { useUsersStore } from './store/useUsersStore';
import UserSwitcher from './components/UserSwitcher';



const MainApp = () => {
  const navigate = useNavigate();
  const { user: fbUser, logout } = useFirebaseAuth();
  // Multi-account token switching (Freelancer API credentials)
  const { currentUser, bidderId } = useAuth();
  const [autoBidEnabledMap] = useState({});
  const autoBidEnabled = !!autoBidEnabledMap[currentUser];
  const [autoBidType, setAutoBidType] = useState('all');
  const fetchUsers = useUsersStore(state => state.fetchUsers);
  const updateSubUser = useUsersStore((s) => s.updateSubUser);
  const selectedUser = useUsersStore((s) => s.getSelectedUser && s.getSelectedUser());
  const [updatingSubUser, setUpdatingSubUser] = useState(false);

  const [useAiProposal, setUseAiProposal] = useState(() => {
    try { return localStorage.getItem('AUTO_BID_USE_AI') === 'true'; } catch { return true; }
  });


  useEffect(() => {
    // only run when there is a logged-in Firebase user
    if (!fbUser?.uid) return;
    const _load = async () => {
      try {
        const idToken = typeof fbUser.getIdToken === 'function' ? await fbUser.getIdToken() : null;
        console.log('[App] loading sub-users for parentUid:', fbUser.uid);
        await fetchUsers(fbUser.uid, idToken);
        console.log('[App] sub-users loaded');
      } catch (err) {
        console.warn('Failed loading sub-users:', err?.message || err);
      }
    };
    _load();
  }, [fbUser, fetchUsers]);

  useEffect(() => {
    try { localStorage.setItem('AUTO_BID_USE_AI', useAiProposal ? 'true' : 'false'); } catch { }
  }, [useAiProposal]);
  const {
    projects,
    loading,
    error,
    fetchRecentProjects,
    retryFetch,
    newCount,
    oldCount,
    usersMap,

  } = useFreelancerAPI({ bidderType: autoBidEnabled ? 'auto' : 'manual', autoBidType });

  const { modalState, closeModal } = useModal();

  const { placeBid } = useBidding();

  // Automatically fetch projects every minute
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        fetchRecentProjects();
      }
    }, 20000); // 20,000 ms = 20 seconds

    return () => clearInterval(interval);
  }, [fetchRecentProjects, loading]);

  const handleRetry = async () => {
    try {
      await retryFetch();
    } catch (err) {
      console.error('Retry failed:', err.message);
    }
  };

  const handleSubmitBid = async ({ amount, period, description }) => {
    const { projectId } = modalState.data;
    const result = await placeBid(projectId, amount, period, description, bidderId);

    if (result?.success) {
      console.log('Bid response:', result.data);
      closeModal();
    } else if (result?.message) {
      throw new Error(result.message);
    } else {
      throw new Error('Failed to place bid');
    }
  };

  // Handler for AutoBid toggle (call backend PATCH)
  const handleToggleAutoBid = async () => {
    if (!selectedUser) {
      alert('Please select an account before toggling AutoBid');
      return;
    }
    try {
      const newValue = !selectedUser.autobid_enabled;
      console.log(`Toggling autobid for ${selectedUser.sub_username} => ${newValue}`);
      // pass document_id (or sub_user_id) and payload
      await updateSubUser(selectedUser.document_id || selectedUser.sub_user_id || selectedUser.id, { autobid_enabled: newValue });
      // success toast/log
      console.log('AutoBid updated on server');
    } catch (err) {
      console.error('Failed to update AutoBid:', err.message || err);
      alert('Failed to update AutoBid: ' + (err.message || 'unknown'));
    }
  };

  const patchSelectedUser = async (payload) => {
    if (!selectedUser) {
      alert('Please select an account before updating settings.');
      throw new Error('No selected sub-user');
    }
    setUpdatingSubUser(true);
    try {
      const idToken = typeof fbUser?.getIdToken === 'function' ? await fbUser.getIdToken() : null;
      const subUserId = selectedUser.document_id || selectedUser.sub_user_id || selectedUser.id;
      await updateSubUser(subUserId, payload, idToken);
      console.log('Sub-user updated:', payload);
    } catch (err) {
      console.error('Failed to update sub-user:', err?.message || err);
      alert('Failed to update account settings: ' + (err?.message || err));
      throw err;
    } finally {
      setUpdatingSubUser(false);
    }
  };

  return (
    <div className="App">
      {/* Simple header with user info and logout */}
      <header className="app-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 20px',
        background: '#f8f9fa',
        borderBottom: '1px solid #dee2e6',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ margin: 0, color: '#495057' }}>🤖 Freelancer AutoBidder</h1>

        {/* Toggle Button for AutoBid */}
        <div className="toggle-container">
          <label>
            <input
              type="checkbox"
              checked={selectedUser?.autobid_enabled === true}
              onChange={handleToggleAutoBid}
            />
            Enable AutoBid
          </label>

        </div>

        {/* Auto-bid proposal source toggle */}
        <label className="ml-3 flex items-center text-sm">
          <input
            type="checkbox"
            checked={selectedUser?.autobid_proposal_type === "ai"}
            onChange={async (e) => {
              const enabled = e.target.checked;
              try {
                // local UI persist
                setUseAiProposal(enabled);
                localStorage.setItem('AUTO_BID_USE_AI', enabled ? 'true' : 'false');
                // update backend field: autobid_proposal_type -> 'ai'|'general'
                await patchSelectedUser({ autobid_proposal_type: enabled ? 'ai' : 'general' });
              } catch (err) {
                // if backend failed, revert UI state
                setUseAiProposal(prev => !prev);
              }
            }}
            className="mr-2"
            disabled={updatingSubUser}
          />
          <span>Use AI proposals for AutoBid</span>
        </label>

        {/* Select Box for AutoBid Type */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <label htmlFor="autoBidType" style={{ fontSize: '14px', color: '#495057' }}>AutoBid Type:</label>
          <select
            id="autoBidType"
            value={selectedUser?.autobid_enabled_for_job_type}
            onChange={async (e) => {
              const val = e.target.value;
              setAutoBidType(val);
              try {
                await patchSelectedUser({ autobid_enabled_for_job_type: val });
              }
              catch (err) {

              }
            }}
            style={{
              padding: '6px 8px',
              borderRadius: '4px',
              border: '1px solid #ced4da',
              background: 'white',
              color: '#495057',
              fontSize: '13px'
            }}
          >
            <option value="all">All</option>
            <option value="fixed">Fixed</option>
            <option value="hourly">Hourly</option>
          </select>
        </div>
        {/* optional small indicator when updating sub-user */}
        {updatingSubUser && <div style={{ marginLeft: 12, color: '#6c757d', fontSize: 12 }}>Saving...</div>}

        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <NotificationBell />
          <button
            onClick={() => navigate('/bids')} // Navigate to the SuccessBidsPage
            style={{
              background: '#007bff',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            View Bids
          </button>

          <button
            onClick={() => navigate('/subusers')}
            style={{
              background: '#17a2b8',
              color: 'white',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            Sub-users
          </button>

          <span style={{ color: '#6c757d' }}>
            Welcome, <strong>{fbUser?.displayName || fbUser?.email}</strong>!
          </span>
          {/* Account switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <UserSwitcher parentUid={fbUser?.uid} />
          </div>
          <button
            onClick={logout}
            style={{
              background: '#dc3545',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Logout
          </button>
        </div>

      </header>


      {/* Your existing content */}
      <div className="main-content" style={{ padding: '20px' }}>
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ color: '#495057', marginBottom: '10px' }}>Recent Projects Dashboard</h2>
          {projects.length > 0 && (
            <div style={{ color: '#6c757d', fontSize: '14px' }}>
              📊 {projects.length} projects loaded
              {newCount > 0 && (
                <span style={{
                  marginLeft: '10px',
                  color: '#28a745',
                  fontWeight: 'bold'
                }}>
                  ✨ {newCount} new
                </span>
              )}
            </div>
          )}
        </div>

        {error && (
          <div style={{ color: 'red', marginBottom: '10px' }}>
            <strong>Error:</strong> {error}
          </div>
        )}




        <FetchButton
          onFetch={fetchRecentProjects}
          loading={loading}
          error={error}
          onRetry={handleRetry}
          onUserProjectsFetched={(userKey, projects, metadata) => {
            console.log(`Received ${projects.length} projects from ${userKey}`);
          }}
        />

        <ProjectList
          projects={projects}
          newCount={newCount}
          oldCount={oldCount}
          usersMap={usersMap}
        />
      </div>



      {modalState.isOpen && modalState.type === 'proposal' && (
        <ProposalModal
          isOpen={modalState.isOpen}
          onClose={closeModal}
          onSubmit={handleSubmitBid}
          projectData={modalState.data}
        />
      )}
    </div>
  );
};

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user: fbUser, loading } = useFirebaseAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!fbUser) {
    return <Navigate to="/login" replace />;
  }

  // Check admin role
  if (requireAdmin && fbUser.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  // Gate on Firebase auth; keep token switching in AuthContext separate
  const { user: fbUser, loading: fbLoading} = useFirebaseAuth();

  if (fbLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#f8f9fa'
      }}>
        <div style={{
          fontSize: '24px',
          marginBottom: '10px'
        }}>🤖</div>
        <div style={{ color: '#6c757d' }}>Loading...</div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Router>
        <FirebaseAuthProvider>
          <AuthProvider>
            <NotificationProvider>
              <ModalProvider>
                <Routes>
                  <Route path="/login" element={<LoginForm />} />
                  <Route path="/register" element={<RegisterForm />} />
                  <Route path="/bids" element={<SuccessBidsPage />} />

                  <Route
                    path="/subusers"
                    element={
                      <ProtectedRoute>
                        <SubUserRegister parentUid={fbUser?.uid} />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <MainApp />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute requireAdmin={true}>
                        <AdminDashboard />
                      </ProtectedRoute>
                    }
                  />

                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </ModalProvider>
            </NotificationProvider>
          </AuthProvider>
        </FirebaseAuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;

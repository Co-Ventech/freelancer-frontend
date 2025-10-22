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
import NotificationBell from './components/NotificationBell';
import AdminDashboard from './components/AdminDashboard';
import SuccessBidsPage from './components/SuccessBidsPage';
import { useNavigate } from 'react-router-dom';



const MainApp = () => {
  const navigate = useNavigate();
  // Firebase authenticated user
  const { user: fbUser, logout } = useFirebaseAuth();
  // Multi-account token switching (Freelancer API credentials)
  const { currentUser, availableUsers, switchUser, bidderId } = useAuth();
  const [autoBidEnabledMap, setAutoBidEnabledMap] = useState({});
  const autoBidEnabled = !!autoBidEnabledMap[currentUser];
  const [autoBidType, setAutoBidType] = useState('all');

  const {
    projects,
    loading,
    error,
    fetchRecentProjects,
    clearError,
    retryFetch,
    newCount,
    autoPlaceBids,
    oldCount,

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

  // Automatically place bids when AutoBid is enabled and cooldown is false
  useEffect(() => {
    if (autoBidEnabled && projects.length > 0) {
      console.log("Checking Project for Autobid: ",projects.length)
      autoPlaceBids();
    }
  }, [autoBidEnabled, projects, autoPlaceBids]);


  // // Automatically place bids after fetching projects
  // useEffect(() => {
  //   if (projects.length > 0) {
  //     autoPlaceBids();
  //   }
  // }, [projects, autoPlaceBids]);

  // useEffect(() => {
  //   loadProjectsFromStorage();
  // }, [loadProjectsFromStorage]);

  const handleFetchProjects = async () => {
    try {
      clearError();
      await fetchRecentProjects();
    } catch (err) {
      console.error('Failed to fetch projects:', err.message);
    }
  };

  const handleRetry = async () => {
    try {
      await retryFetch();
    } catch (err) {
      console.error('Retry failed:', err.message);
    }
  };

  const handleProjectsFetched = (projects) => {
    console.log('Received projects from hardcoded fetch:', projects.length);

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
              checked={autoBidEnabled}
              onChange={() =>
                setAutoBidEnabledMap((prev) => ({
                  ...prev,
                  [currentUser]: !prev[currentUser]
                }))
              }
            />
            Enable AutoBid
          </label>

        </div>

        {/* Select Box for AutoBid Type */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <label htmlFor="autoBidType" style={{ fontSize: '14px', color: '#495057' }}>AutoBid Type:</label>
          <select
            id="autoBidType"
            value={autoBidType}
            onChange={(e) => setAutoBidType(e.target.value)}
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
          <span style={{ color: '#6c757d' }}>
            Welcome, <strong>{fbUser?.displayName || fbUser?.email}</strong>!
          </span>
          {/* Account switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label htmlFor="accountSwitcher" style={{ fontSize: '12px', color: '#6c757d' }}>Account:</label>
            <select
              id="accountSwitcher"
              value={currentUser || 'DEFAULT'}
              onChange={(e) => switchUser(e.target.value)}
              style={{
                padding: '6px 8px',
                borderRadius: '4px',
                border: '1px solid #ced4da',
                background: 'white',
                color: '#495057',
                fontSize: '13px'
              }}
            >
              {/* Default option */}
              <option value="DEFAULT">Zubair</option>
              {availableUsers && Object.entries(availableUsers)
                .filter(([key]) => key !== 'DEFAULT')
                .map(([key, info]) => (
                  <option key={key} value={key}>{info?.name || key}</option>
                ))}
            </select>
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
            // Update your main project list or handle as needed
            // setProjects(projects); // or however you want to handle it
          }}
        />

        <ProjectList
          projects={projects}
          newCount={newCount}
          oldCount={oldCount}
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



/**
 * Auth Gate Component
 */
const AuthGate = () => {
  const [authMode, setAuthMode] = useState('login');

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      {authMode === 'login' ? (
        <LoginForm onSwitchToRegister={() => setAuthMode('register')} />
      ) : (
        <RegisterForm onSwitchToLogin={() => setAuthMode('login')} />
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

/**
 * Main App with Firebase Auth Gate
 */
function App() {
  // Gate on Firebase auth; keep token switching in AuthContext separate
  const { user: fbUser, loading: fbLoading, isAdmin } = useFirebaseAuth();

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
            <ModalProvider>
              <Routes>
                <Route path="/login" element={<LoginForm />} />
                <Route path="/register" element={<RegisterForm />} />
                
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <MainApp />
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/success-bids"
                  element={
                    <ProtectedRoute>
                      <SuccessBidsPage />
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
          </AuthProvider>
        </FirebaseAuthProvider>
      </Router>
    </ErrorBoundary>
  );
  // return (

  //   <Router>
  //     <ErrorBoundary>
  //    {fbUser ? (
  //         <Routes>
          
          
  //           <Route path="/" element={isAdmin ? <AdminDashboard /> : <MainApp />} />
          
  //           <Route path="/admin" element={isAdmin ? <AdminDashboard /> : <Navigate to="/" replace />} />
  //           <Route path="/bids" element={<SuccessBidsPage />} />
  //           <Route path="*" element={<Navigate to={isAdmin ? "/admin" : "/"} replace />} />
  //         </Routes>
  //       ) : (
  //         <AuthGate />
  //       )}
  //     </ErrorBoundary>
  //   </Router>
  //   // <ErrorBoundary>
  //   //   {fbUser ? <MainApp /> : <AuthGate />}
  //   // </ErrorBoundary>
  // );
}

export default App;

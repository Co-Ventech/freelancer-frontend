import React, { useState, useEffect } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import FetchButton from './components/FetchButton';
import ProjectList from './components/ProjectList';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import { useFreelancerAPI } from './hooks/useFreelancerAPI';
import { useModal } from './contexts/ModalContext';
import { useBidding } from './hooks/useBidding'; 
import { useAuth } from './contexts/AuthContext';
import { useFirebaseAuth } from './contexts/FirebaseAuthContext';
import ProposalModal from './components/ProposalModal';



/**
 * Protected App Component - Your existing functionality
 */
const MainApp = () => {
  // Firebase authenticated user
  const { user: fbUser, logout } = useFirebaseAuth();
  // const { , setCooldown } = useState(false);
  // Multi-account token switching (Freelancer API credentials)
  const { currentUser, availableUsers, switchUser } = useAuth();
  const [autoBidEnabled, setAutoBidEnabled] = useState(false); // AutoBid is off by default
  
  const {
    projects,
    loading,
    error,
    fetchRecentProjects,
    loadProjectsFromStorage,
    clearError,
    retryFetch,
    lastFetchTime,
    newCount,
    autoPlaceBids,
    oldCount
  } = useFreelancerAPI();

  const { modalState, closeModal } = useModal();
  const { placeBid } = useBidding();

  // Automatically fetch projects every minute
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        fetchRecentProjects();
      }
    }, 6000); // 60,000 ms = 1 minute

    return () => clearInterval(interval);
  }, [fetchRecentProjects, loading]);

  // Automatically place bids when AutoBid is enabled and cooldown is false
  useEffect(() => {
    if (autoBidEnabled && projects.length > 0) {
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
    const result = await placeBid(projectId, amount, period, description);
    
    if (result?.success) {
      console.log('Bid response:', result.data);
      alert('Bid placed successfully!');
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
            onChange={() => setAutoBidEnabled((prev) => !prev)}
          />
          Enable AutoBid
        </label>
      </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
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
              <option value="DEFAULT">Default</option>
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

/**
 * Main App with Firebase Auth Gate
 */
function App() {
  // Gate on Firebase auth; keep token switching in AuthContext separate
  const { user: fbUser, loading: fbLoading } = useFirebaseAuth();

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
      {fbUser ? <MainApp /> : <AuthGate />}
    </ErrorBoundary>
  );
}

export default App;

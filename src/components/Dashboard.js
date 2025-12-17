import React, { useEffect } from 'react';
import FetchButton from './FetchButton';
import ProjectList from './ProjectList';
import { useFreelancerAPI } from '../hooks/useFreelancerAPI';
import { useModal } from '../contexts/ModalContext';
import { useBidding } from '../hooks/useBidding';

const Dashboard = () => {
  const {
    projects,
    loading,
    error,
    fetchRecentProjects,
    retryFetch,
    newCount,
    oldCount,
    usersMap,
  } = useFreelancerAPI();

  const { modalState, closeModal } = useModal();
  const { placeBid } = useBidding();

  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) fetchRecentProjects();
    }, 20000);
    return () => clearInterval(interval);
  }, [fetchRecentProjects, loading]);

  const handleRetry = async () => {
    try { await retryFetch(); } catch (err) { console.error('Retry failed:', err.message); }
  };

  const handleSubmitBid = async ({ amount, period, description }) => {
    const { projectId } = modalState.data;
    const result = await placeBid(projectId, amount, period, description);
    if (result?.success) closeModal();
    else throw new Error(result?.message || 'Failed to place bid');
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ color: '#495057', marginBottom: 10 }}>Recent Projects Dashboard</h2>
        {projects.length > 0 && (
          <div style={{ color: '#6c757d', fontSize: 14 }}>
            📊 {projects.length} projects loaded
            {newCount > 0 && <span style={{ marginLeft: 10, color: '#28a745', fontWeight: 'bold' }}>✨ {newCount} new</span>}
          </div>
        )}
      </div>

      {error && <div style={{ color: 'red', marginBottom: 10 }}><strong>Error:</strong> {String(error)}</div>}

      <FetchButton onFetch={fetchRecentProjects} loading={loading} error={error} onRetry={handleRetry} />
      <ProjectList projects={projects} newCount={newCount} oldCount={oldCount} usersMap={usersMap} />
    </div>
  );
};

export default Dashboard;
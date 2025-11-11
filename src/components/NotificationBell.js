import React, { useMemo, useState } from 'react';
import { useUsersStore } from '../store/useUsersStore';
import { markNotificationRead } from '../utils/api';
import { useNotifications } from '../contexts/NotificationContext';
import { useModal } from '../contexts/ModalContext';
import ProjectDetailsModal from './ProjectDetailsModal';

const formatTime = (ts) => {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

const NotificationBell = () => {
  const { items, unreadCount, markRead, markAllRead, remove } = useNotifications();
  const { modalState, openModal, closeModal } = useModal();
  const [open, setOpen] = useState(false);
   const [pendingIds, setPendingIds] = useState(new Set());
 const selectedSubUser = useUsersStore((s) => s.getSelectedUser && s.getSelectedUser());

  const grouped = useMemo(() => items, [items]);
 const handleMarkRead = async (notification) => {
    const id = notification.id;
    if (!id) return;
    const subUserId = selectedSubUser?.document_id || selectedSubUser?.sub_user_id || selectedSubUser?.id;
    // Optimistically add pending flag
    setPendingIds((prev) => new Set(prev).add(id));
    try {
      if (!subUserId) {
        // fallback: no sub-user available, mark locally
        markRead(id);
        return;
      }
      const res = await markNotificationRead(subUserId, id, true);
      if (res && res.status >= 200 && res.status < 300) {
        markRead(id);
      } else {
        // fallback to local mark and log
        console.warn('mark-read failed', res?.status, res?.data);
        markRead(id);
      }
    } catch (err) {
      console.warn('mark-read error', err);
      // fallback to local mark
      markRead(id);
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };


  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          position: 'relative',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: 6,
        }}
        aria-label="Notifications"
      >
        {/* bell icon */}
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#495057" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 01-3.46 0"/>
        </svg>
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: 0,
            right: 0,
            background: '#dc3545',
            color: 'white',
            borderRadius: 999,
            fontSize: 10,
            padding: '0 6px',
            transform: 'translate(40%, -40%)'
          }}>{unreadCount}</span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          right: 0,
          marginTop: 8,
          width: 560,
          maxHeight: 420,
          overflowY: 'auto',
          background: 'white',
          border: '1px solid #dee2e6',
          borderRadius: 8,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          zIndex: 1000,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderBottom: '1px solid #f1f3f5' }}>
            <strong style={{ color: '#343a40' }}>Notifications</strong>
            <button onClick={markAllRead} style={{ border: 'none', background: 'transparent', color: '#0d6efd', cursor: 'pointer' }}>Mark all as read</button>
          </div>
          {grouped.length === 0 ? (
            <div style={{ padding: 16, color: '#6c757d' }}>No notifications</div>
          ) : (
            grouped.map((n) => (
              <div key={n.id} style={{ display: 'flex', gap: 12, padding: 14, borderBottom: '1px solid #f1f3f5', background: n.read ? 'white' : '#f8f9fa' }}>
                <div style={{
                  width: 8,
                  height: 8,
                  marginTop: 6,
                  borderRadius: 999,
                  background: n.type === 'success' ? '#28a745' : n.type === 'error' ? '#dc3545' : '#6c757d',
                  flex: '0 0 auto'
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, color: '#343a40' }}>{n.title || (n.type === 'success' ? 'Success' : n.type === 'error' ? 'Error' : 'Info')}</span>
                    <span style={{ fontSize: 12, color: '#868e96' }}>{formatTime(n.createdAt)}</span>
                  </div>
                  <div style={{ color: '#495057', fontSize: 14 }}>{n.message}</div>
                  <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                    {n.projectData && (
                      <button 
                        onClick={() => openModal('projectDetails', n.projectData)} 
                        style={{ border: '1px solid #dee2e6', background: 'white', color: '#28a745', cursor: 'pointer', padding: '6px 10px', borderRadius: 6 }}
                      >
                        View
                      </button>
                    )}
                     {!n.read && (
                      <button
                        onClick={() => handleMarkRead(n)}
                        disabled={pendingIds.has(n.id)}
                        style={{
                          border: '1px solid #dee2e6',
                          background: pendingIds.has(n.id) ? '#f1f3f5' : 'white',
                          color: pendingIds.has(n.id) ? '#6c757d' : '#0d6efd',
                          cursor: pendingIds.has(n.id) ? 'default' : 'pointer',
                          padding: '6px 10px',
                          borderRadius: 6
                        }}
                      >
                        {pendingIds.has(n.id) ? 'Saving…' : 'Mark as read'}
                      </button>
                    )}
                 
                    <button onClick={() => remove(n.id)} style={{ border: '1px solid #dee2e6', background: 'white', color: '#dc3545', cursor: 'pointer', padding: '6px 10px', borderRadius: 6 }}>Delete</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
      
      {/* Project Details Modal */}
      {modalState.isOpen && modalState.type === 'projectDetails' && (
        <ProjectDetailsModal 
          projectData={modalState.data} 
          onClose={closeModal} 
        />
      )}
    </div>
  );
};

export default NotificationBell;



import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const UserSwitcher = () => {
  const { currentUser, switchUser, availableUsers, isLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const colorClasses = {
    blue: 'bg-blue-500 text-white',
    green: 'bg-green-500 text-white',
    purple: 'bg-purple-500 text-white',
    gray: 'bg-gray-500 text-white'
  };

  const handleUserSelect = (userKey) => {
    if (userKey === currentUser) {
      setIsOpen(false);
      return;
    }

    // Show confirmation for page refresh
    setIsConfirming(true);
    const userInfo = availableUsers[userKey];
    const confirmed = window.confirm(
      `🔄 Switch to ${userInfo?.name || userKey}?\n\n` +
      `This will refresh the page to load the new user's configuration.\n\n` +
      `Current user: ${availableUsers[currentUser]?.name || currentUser}\n` +
      `New user: ${userInfo?.name || userKey}\n\n` +
      `Continue?`
    );

    if (confirmed) {
      console.log(`👤 User confirmed switch to ${userKey}`);
      switchUser(userKey);
    } else {
      console.log(`❌ User cancelled switch to ${userKey}`);
    }
    
    setIsConfirming(false);
    setIsOpen(false);
  };

  if (isLoading) {
    return (
      <div style={{
        padding: '8px 16px',
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '6px',
        fontSize: '14px',
        color: '#6c757d'
      }}>
        ⏳ Loading user config...
      </div>
    );
  }

  const currentUserInfo = availableUsers[currentUser] || { name: currentUser, color: 'gray' };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {/* Current User Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isConfirming}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 16px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: '500',
          cursor: isConfirming ? 'wait' : 'pointer',
          opacity: isConfirming ? 0.7 : 1,
          transition: 'all 0.2s ease'
        }}
      >
        <span 
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: 'white',
            opacity: 0.8
          }}
        />
        <span>👤 {currentUserInfo.name}</span>
        <span style={{ 
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease'
        }}>
          ▼
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: '0',
          right: '0',
          marginTop: '4px',
          backgroundColor: 'white',
          border: '1px solid #dee2e6',
          borderRadius: '6px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          zIndex: 1000,
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            padding: '8px 12px',
            backgroundColor: '#f8f9fa',
            borderBottom: '1px solid #dee2e6',
            fontSize: '12px',
            fontWeight: '600',
            color: '#495057'
          }}>
            🔄 Switch User (Page Refresh)
          </div>

          {/* User Options */}
          {Object.entries(availableUsers).map(([key, info]) => (
            <button
              key={key}
              onClick={() => handleUserSelect(key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '10px 12px',
                backgroundColor: key === currentUser ? '#e7f3ff' : 'transparent',
                color: key === currentUser ? '#0056b3' : '#495057',
                border: 'none',
                borderBottom: '1px solid #f1f3f5',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (key !== currentUser) {
                  e.target.style.backgroundColor = '#f8f9fa';
                }
              }}
              onMouseLeave={(e) => {
                if (key !== currentUser) {
                  e.target.style.backgroundColor = 'transparent';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: key === currentUser ? '#007bff' : '#6c757d'
                  }}
                />
                <span style={{ fontWeight: key === currentUser ? '600' : '400' }}>
                  {info.name}
                </span>
              </div>
              
              {key === currentUser && (
                <span style={{ fontSize: '12px', opacity: 0.8 }}>✓ Active</span>
              )}
            </button>
          ))}

          {/* Footer */}
          <div style={{
            padding: '8px 12px',
            backgroundColor: '#f8f9fa',
            borderTop: '1px solid #dee2e6',
            fontSize: '11px',
            color: '#6c757d',
            textAlign: 'center'
          }}>
            💡 Switching users refreshes the page
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999
          }}
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default UserSwitcher;

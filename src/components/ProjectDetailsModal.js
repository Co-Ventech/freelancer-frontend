import React from 'react';

const ProjectDetailsModal = ({ projectData, onClose }) => {
  if (!projectData) return null;

  const { id, title, description, amount, currency, currencySign } = projectData;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 24,
        maxWidth: 600,
        width: '90%',
        maxHeight: '80vh',
        overflowY: 'auto',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
          paddingBottom: 16,
          borderBottom: '1px solid #e9ecef',
        }}>
          <h2 style={{
            margin: 0,
            fontSize: 20,
            fontWeight: 600,
            color: '#343a40',
          }}>
            Project Details
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 24,
              cursor: 'pointer',
              color: '#6c757d',
              padding: 0,
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 4,
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#f8f9fa'}
            onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            ×
          </button>
        </div>

        {/* Project ID */}
        <div style={{ marginBottom: 16 }}>
          <label style={{
            display: 'block',
            fontSize: 12,
            fontWeight: 600,
            color: '#6c757d',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: 4,
          }}>
            Project ID
          </label>
          <div style={{
            fontSize: 16,
            color: '#495057',
            fontFamily: 'monospace',
            backgroundColor: '#f8f9fa',
            padding: '8px 12px',
            borderRadius: 6,
            border: '1px solid #e9ecef',
          }}>
            #{id}
          </div>
        </div>

        {/* Project Title */}
        <div style={{ marginBottom: 16 }}>
          <label style={{
            display: 'block',
            fontSize: 12,
            fontWeight: 600,
            color: '#6c757d',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: 4,
          }}>
            Project Title
          </label>
          <div style={{
            fontSize: 16,
            color: '#343a40',
            fontWeight: 500,
            lineHeight: 1.4,
          }}>
            {title || 'No title available'}
          </div>
        </div>

        {/* Bid Amount */}
        <div style={{ marginBottom: 16 }}>
          <label style={{
            display: 'block',
            fontSize: 12,
            fontWeight: 600,
            color: '#6c757d',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: 4,
          }}>
            Bid Amount
          </label>
          <div style={{
            fontSize: 18,
            color: '#28a745',
            fontWeight: 600,
            backgroundColor: '#f8fff9',
            padding: '8px 12px',
            borderRadius: 6,
            border: '1px solid #d4edda',
          }}>
            {currencySign || '$'}{amount} {currency || 'USD'}
          </div>
        </div>

        {/* Project Description */}
        <div style={{ marginBottom: 20 }}>
          <label style={{
            display: 'block',
            fontSize: 12,
            fontWeight: 600,
            color: '#6c757d',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: 4,
          }}>
            Project Description
          </label>
          <div style={{
            fontSize: 14,
            color: '#495057',
            lineHeight: 1.6,
            backgroundColor: '#f8f9fa',
            padding: 12,
            borderRadius: 6,
            border: '1px solid #e9ecef',
            maxHeight: 200,
            overflowY: 'auto',
            whiteSpace: 'pre-wrap',
          }}>
            {description || 'No description available'}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          paddingTop: 16,
          borderTop: '1px solid #e9ecef',
        }}>
          <button
            onClick={onClose}
            style={{
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#5a6268'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#6c757d'}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailsModal;

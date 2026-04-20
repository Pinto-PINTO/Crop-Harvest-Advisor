import React from 'react';

const LoadingSpinner = ({ size = 'medium', message = 'Loading...' }) => {
  const sizes = {
    small: '20px',
    medium: '40px',
    large: '60px'
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div 
        className="spinner" 
        style={{ 
          width: sizes[size], 
          height: sizes[size],
          borderWidth: size === 'small' ? '3px' : '4px'
        }}
      />
      {message && <p style={{ marginTop: '1rem', color: '#6b7280' }}>{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
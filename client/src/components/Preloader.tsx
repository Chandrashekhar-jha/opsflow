import React from 'react';

export const Preloader: React.FC = () => {
  return (
    <div className="preloader-container">
      <img
        src="/favicon.jpg"
        alt="OpsFlow Logo"
        style={{ width: '48px', height: '48px', borderRadius: '10px', animation: 'pulse 1.5s ease-in-out infinite' }}
      />
      <div className="preloader-spinner"></div>
      <div className="preloader-text">Loading OpsFlow Portal...</div>
    </div>
  );
};

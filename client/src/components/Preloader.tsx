import React from 'react';

export const Preloader: React.FC = () => {
  return (
    <div className="preloader-container">
      <div className="preloader-spinner"></div>
      <div className="preloader-text">Loading Operations Portal...</div>
    </div>
  );
};

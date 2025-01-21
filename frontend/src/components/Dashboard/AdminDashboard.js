import React from 'react';
import VideoGallery from '../VideoGallery/VideoGallery';
import './Dashboard.css';

const AdminDashboard = () => {
  return (
    <div className="dashboard admin-dashboard">
      <section className="gallery-section">
        <h2>All User Videos</h2>
        <VideoGallery userOnly={false} />
      </section>
    </div>
  );
};

export default AdminDashboard; 
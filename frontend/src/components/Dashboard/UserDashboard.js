import React from 'react';
import VideoUploader from '../VideoUpload/VideoUploader';
import VideoGallery from '../VideoGallery/VideoGallery';
import './Dashboard.css';

const UserDashboard = () => {
  return (
    <div className="dashboard user-dashboard">
      <section className="upload-section">
        <h2>Upload Your Video</h2>
        <VideoUploader />
      </section>
      
      <section className="gallery-section">
        <h2>Your Videos</h2>
        <VideoGallery userOnly={true} />
      </section>
    </div>
  );
};

export default UserDashboard; 
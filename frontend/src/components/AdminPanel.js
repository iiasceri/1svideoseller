import React from 'react';
import './AdminPanel.css';

const AdminPanel = () => {
  return (
    <div className="admin-panel">
      <div className="admin-controls">
        <h3>Video Management</h3>
        <div className="control-group">
          <button className="admin-button">View All Videos</button>
          <button className="admin-button">Manage Users</button>
          <button className="admin-button">Settings</button>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel; 
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Header = () => {
  const { user, logout } = useAuth();

  const handleLogout = (event) => {
    // Prevent default behavior for Safari
    event.preventDefault();
    logout();
    // Force navigation to login page
    window.location.href = '/';
  };

  return (
    <header className="header">
      <div className="header-content">
        <h1>1s Video</h1>
        <nav>
          {user ? (
            <>
              <div className="nav-group">
                <Link to="/">Home</Link>
                <button className="logout-button" onClick={handleLogout}>Logout</button>
              </div>
              {user.isAdmin && <Link to="/admin">Admin</Link>}
            </>
          ) : (
            <Link to="/login">Login</Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header; 
import React, { useState } from 'react';
import UserDashboard from './components/Dashboard/UserDashboard';
import AdminDashboard from './components/Dashboard/AdminDashboard';
import AdminPanel from './components/AdminPanel';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ErrorBoundary from './components/ErrorBoundary';
import { useAuth } from './contexts/AuthContext';
import './App.css';

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const { user, logout, loading } = useAuth();

  if (loading) {
    return (
      <div className="App">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="App">
        <header className="App-header">
          <h1>1-Second Video Platform</h1>
        </header>
        <main className="App-main">
          {isLogin ? (
            <Login onToggleForm={() => setIsLogin(false)} />
          ) : (
            <Register onToggleForm={() => setIsLogin(true)} />
          )}
        </main>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="App">
        <header className="App-header">
          <div className="header-content">
            <h1>1-Second Video Platform</h1>
            <nav className="nav-links">
              <div className="nav-left">
                <a href="/" className="nav-link">Home</a>
                {user.isAdmin && (
                  <span className="admin-badge">Admin</span>
                )}
              </div>
              <div className="nav-right">
                <span className="user-email">{user.email}</span>
                <button onClick={logout} className="nav-link logout">Logout</button>
              </div>
            </nav>
          </div>
        </header>
        
        <main className="App-main">
          {user.isAdmin ? (
            <AdminDashboard />
          ) : (
            <UserDashboard />
          )}
          
          {user.isAdmin && (
            <section className="admin-section">
              <h2>Admin Panel</h2>
              <AdminPanel />
            </section>
          )}
        </main>
      </div>
    </ErrorBoundary>
  );
}

export default App; 
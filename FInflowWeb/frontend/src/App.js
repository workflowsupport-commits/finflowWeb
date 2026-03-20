// src/App.js
import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import RequestsPage from './pages/RequestsPage';
import ApprovalsPage from './pages/ApprovalsPage';
import NewRequestPage from './pages/NewRequestPage';
import ReportsPage from './pages/ReportsPage';
import WorkflowsPage from './pages/WorkflowsPage';
import AdminPage from './pages/AdminPage';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import './App.css';

function AppInner() {
  const { user, loading } = useAuth();
  const [page, setPage] = useState('dashboard');
  const [requestId, setRequestId] = useState(null);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0f2244' }}>
      <div style={{ textAlign: 'center', color: '#fff' }}>
        <div style={{ fontSize: 32, fontWeight: 700, marginBottom: 12 }}>Fin<span style={{ color: '#4da6ff' }}>Flow</span></div>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Loading...</div>
      </div>
    </div>
  );

  if (!user) return <LoginPage />;

  const nav = (p, id = null) => { setPage(p); setRequestId(id); };

  const renderPage = () => {
    switch (page) {
      case 'dashboard':   return <Dashboard onNav={nav} />;
      case 'requests':    return <RequestsPage onNav={nav} requestId={requestId} />;
      case 'approvals':   return <ApprovalsPage onNav={nav} />;
      case 'new-request': return <NewRequestPage onNav={nav} />;
      case 'reports':     return <ReportsPage />;
      case 'workflows':   return <WorkflowsPage onNav={nav} />;
      case 'admin':       return user.role === 'admin' ? <AdminPage /> : <Dashboard onNav={nav} />;
      default:            return <Dashboard onNav={nav} />;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar currentPage={page} onNav={nav} />
      <div className="app-main">
        <Topbar currentPage={page} onNav={nav} />
        <div className="app-content">{renderPage()}</div>
      </div>
    </div>
  );
}

export default function App() {
  return <AuthProvider><AppInner /></AuthProvider>;
}

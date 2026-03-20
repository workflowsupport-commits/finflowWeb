// src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import RequestCard from '../components/RequestCard';

export default function Dashboard({ onNav }) {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [requests, setRequests] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getSummary(),
      api.getRequests({ limit: 8 }),
      user.role !== 'initiator' ? api.getMyApprovals() : Promise.resolve([]),
      api.getWorkflows(),
    ]).then(([sum, reqs, appr, wfs]) => {
      setSummary(sum);
      setRequests(reqs.data || []);
      setApprovals(appr);
      setWorkflows(wfs);
    }).catch(console.error).finally(() => setLoading(false));
  }, [user]);

  const fmt = (n) => n >= 1000000 ? `${(n/1000000).toFixed(1)}M` : n >= 1000 ? `${(n/1000).toFixed(0)}K` : n;

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>Loading dashboard...</div>;

  const catColors = { Finance: '#1a56db', HR: '#f472b6', Loans: '#34d399', Operations: '#fbbf24', Compliance: '#a78bfa' };
  const wfByCategory = {};
  workflows.forEach(w => { if (!wfByCategory[w.category]) wfByCategory[w.category] = []; wfByCategory[w.category].push(w); });

  return (
    <div className="fade-in">
      {/* Welcome */}
      <div style={{ marginBottom: 22 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>Good {getGreeting()}, {user.name.split(' ')[0]} 👋</h2>
        <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
      </div>

      {/* Stats */}
      <div className="stat-grid stat-grid-5" style={{ marginBottom: 22 }}>
        {[
          { label: 'Total Requests', value: summary?.total || 0, color: '#1a56db', sub: 'All time' },
          { label: 'In Progress',    value: summary?.inProgress || 0, color: '#d97706', sub: 'Active' },
          { label: 'Approved',       value: summary?.approved || 0, color: '#0d9488', sub: 'Completed' },
          { label: 'Rejected',       value: summary?.rejected || 0, color: '#dc2626', sub: 'Declined' },
          { label: 'Total Approved', value: `Rs ${fmt(summary?.totalAmount || 0)}`, color: '#7c3aed', sub: 'Amount' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color: s.color, fontSize: 22 }}>{s.value}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 18 }}>
        {/* Left: Recent Requests */}
        <div>
          <div className="card" style={{ marginBottom: 18 }}>
            <div className="card-header">
              <span className="card-title">Recent Requests</span>
              <button className="btn btn-sm" onClick={() => onNav('requests')}>View all →</button>
            </div>
            {requests.length === 0 ? (
              <div className="empty-state"><div className="icon">📋</div><h3>No requests yet</h3></div>
            ) : (
              requests.map(r => <RequestCard key={r.id} request={r} onClick={() => onNav('requests', r.id)} />)
            )}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Pending Approvals */}
          {user.role !== 'initiator' && (
            <div className="card">
              <div className="card-header">
                <span className="card-title">My Pending Approvals</span>
                {approvals.length > 0 && <span className="badge badge-red">{approvals.length}</span>}
              </div>
              {approvals.length === 0 ? (
                <div style={{ padding: '20px 18px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>✓ All caught up!</div>
              ) : approvals.slice(0, 4).map(r => (
                <ApprovalItem key={r.id} request={r} onView={() => onNav('approvals')} />
              ))}
              {approvals.length > 4 && (
                <div style={{ padding: '10px 18px', borderTop: '1px solid #e5e7eb' }}>
                  <button className="btn btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={() => onNav('approvals')}>
                    View all {approvals.length} pending →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Workflow Library Quick Access */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Workflow Library</span>
              <button className="btn btn-sm" onClick={() => onNav('workflows')}>All →</button>
            </div>
            <div style={{ padding: '10px 12px' }}>
              {Object.entries(wfByCategory).map(([cat, wfs]) => (
                <div key={cat} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: catColors[cat] || '#6b7280', textTransform: 'uppercase', letterSpacing: '0.8px', padding: '4px 6px' }}>{cat}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {wfs.map(w => (
                      <button key={w.id} onClick={() => onNav('new-request')}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px',
                          background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 7,
                          fontSize: 12, cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#e8f0fd'; e.currentTarget.style.borderColor = '#93b8f7'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = '#e5e7eb'; }}
                      >
                        <span style={{ fontSize: 14 }}>{w.icon}</span>
                        <span style={{ color: '#374151' }}>{w.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ApprovalItem({ request, onView }) {
  const stageLabel = request.stages?.[request.currentStageIndex]?.stageLabel || 'Pending';
  return (
    <div style={{ padding: '12px 18px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={onView}
      onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <div style={{ fontSize: 22, flexShrink: 0 }}>{request.workflowIcon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{request.refNo} · {request.workflowName}</div>
        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>{request.requesterName} · {stageLabel}</div>
      </div>
      <span className="badge badge-amber" style={{ fontSize: 10, flexShrink: 0 }}>Action</span>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

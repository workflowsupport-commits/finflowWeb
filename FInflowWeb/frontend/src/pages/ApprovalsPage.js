// src/pages/ApprovalsPage.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import RequestDetailModal from '../components/RequestDetailModal';

export default function ApprovalsPage({ onNav }) {
  const { user } = useAuth();
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [processing, setProcessing] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.getMyApprovals();
      setApprovals(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const quickAction = async (requestId, action) => {
    setProcessing(p => ({ ...p, [requestId]: action }));
    try {
      await api.actionRequest(requestId, action, '');
      await load();
    } catch (e) { alert(e.message); }
    setProcessing(p => { const n = { ...p }; delete n[requestId]; return n; });
  };

  const priorityColor = { high: '#dc2626', medium: '#d97706', low: '#6b7280' };

  if (user.role === 'initiator') {
    return (
      <div className="empty-state" style={{ marginTop: 60 }}>
        <div className="icon">🔒</div>
        <h3>No approval access</h3>
        <p style={{ fontSize: 13, marginTop: 6 }}>Initiators cannot access the approvals queue.</p>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="card">
        <div className="card-header">
          <span className="card-title">Pending My Approval</span>
          {approvals.length > 0 && <span className="badge badge-red">{approvals.length} pending</span>}
          <button className="btn btn-sm" onClick={load} style={{ marginLeft: 'auto' }}>↺ Refresh</button>
        </div>

        {loading ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#9ca3af' }}>Loading...</div>
        ) : approvals.length === 0 ? (
          <div className="empty-state"><div className="icon">✅</div><h3>All caught up!</h3><p style={{ fontSize: 13, marginTop: 6 }}>No pending approvals.</p></div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Ref</th>
                <th>Workflow</th>
                <th>Requested by</th>
                <th>Amount</th>
                <th>Stage</th>
                <th>Priority</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {approvals.map(r => {
                const currentStage = r.stages?.[r.currentStageIndex];
                const proc = processing[r.id];
                return (
                  <tr key={r.id} onClick={() => setSelected(r)}>
                    <td><span style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, fontWeight: 600, color: '#1a56db' }}>{r.refNo}</span></td>
                    <td>
                      <span style={{ marginRight: 6 }}>{r.workflowIcon}</span>
                      <span style={{ fontWeight: 500 }}>{r.workflowName}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{r.requesterName}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>{r.department}</div>
                    </td>
                    <td style={{ fontWeight: r.amount > 0 ? 600 : 400, color: r.amount > 0 ? '#111827' : '#9ca3af' }}>
                      {r.amount > 0 ? `Rs ${r.amount.toLocaleString()}` : '—'}
                    </td>
                    <td><span className="badge badge-amber" style={{ fontSize: 11 }}>{currentStage?.stageLabel || '—'}</span></td>
                    <td><span style={{ fontSize: 11, fontWeight: 600, color: priorityColor[r.priority] || '#6b7280', textTransform: 'capitalize' }}>● {r.priority}</span></td>
                    <td style={{ fontSize: 12, color: '#6b7280' }}>{new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                    <td onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-sm btn-danger" disabled={!!proc}
                          onClick={() => quickAction(r.id, 'reject')}
                          style={{ padding: '4px 10px', fontSize: 11 }}>
                          {proc === 'reject' ? '...' : '✕'}
                        </button>
                        <button className="btn btn-sm btn-success" disabled={!!proc}
                          onClick={() => quickAction(r.id, 'approve')}
                          style={{ padding: '4px 10px', fontSize: 11 }}>
                          {proc === 'approve' ? '...' : '✓'}
                        </button>
                        <button className="btn btn-sm" onClick={() => setSelected(r)} style={{ padding: '4px 10px', fontSize: 11 }}>View</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {selected && (
        <RequestDetailModal request={selected} onClose={() => setSelected(null)} onRefresh={load} />
      )}
    </div>
  );
}

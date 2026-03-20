// src/components/RequestDetailModal.js
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

const stageStatusConfig = {
  completed: { label: 'Completed', color: '#15803d', bg: '#dcfce7', icon: '✓' },
  active:    { label: 'In Progress', color: '#d97706', bg: '#fef3c7', icon: '●' },
  pending:   { label: 'Pending',    color: '#9ca3af', bg: '#f3f4f6', icon: '○' },
  rejected:  { label: 'Rejected',  color: '#dc2626', bg: '#fee2e2', icon: '✕' },
};

export default function RequestDetailModal({ request: r, onClose, onRefresh }) {
  const { user } = useAuth();
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  if (!r) return null;

  const currentStage = r.stages?.[r.currentStageIndex];
  const canAct = r.status === 'in_progress' && currentStage?.status === 'pending';

  const stageRoleMap = {
    dept_rec: ['supervisor'], ceo_rec: ['ceo'],
    approval: ['supervisor', 'ceo'], hr_pending: ['hr'],
    head_hr: ['hr'], finance: ['finance'], gl_post: ['finance'],
  };
  const allowedRoles = currentStage ? (stageRoleMap[currentStage.stageId] || []) : [];
  const userCanAct = canAct && allowedRoles.includes(user.role);

  const doAction = async (action) => {
    setLoading(true);
    try {
      await api.actionRequest(r.id, action, comment);
      setToast({ type: 'success', msg: action === 'approve' ? '✓ Approved successfully' : 'Request rejected' });
      setTimeout(() => { onRefresh(); onClose(); }, 1200);
    } catch (err) {
      setToast({ type: 'error', msg: err.message });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const statusConfig = {
    in_progress: { label: 'In Progress', cls: 'badge-amber' },
    approved:    { label: 'Approved',    cls: 'badge-green' },
    rejected:    { label: 'Rejected',    cls: 'badge-red' },
  };
  const status = statusConfig[r.status] || statusConfig.in_progress;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 660 }}>
        <div className="modal-header">
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 20 }}>{r.workflowIcon}</span>
              <span className="modal-title">{r.workflowName}</span>
              <span className={`badge ${status.cls}`}>{status.label}</span>
            </div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>
              {r.refNo} · by <strong>{r.requesterName}</strong> · {r.department} · {r.branch}
              {r.amount > 0 && <> · <strong>Rs {r.amount.toLocaleString()}</strong></>}
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Description */}
          {r.description && (
            <div style={{ background: '#f9fafb', borderRadius: 8, padding: '12px 14px', marginBottom: 20, fontSize: 13, color: '#374151', borderLeft: '3px solid #1a56db' }}>
              {r.description}
            </div>
          )}

          {/* Progress bar */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#6b7280', marginBottom: 6 }}>
              <span>Progress</span>
              <span>{r.completedStages}/{r.totalStages} stages</span>
            </div>
            <div style={{ height: 6, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: r.status === 'rejected' ? '#dc2626' : '#1a56db', borderRadius: 3, width: `${(r.completedStages / r.totalStages) * 100}%`, transition: 'width 0.5s' }} />
            </div>
          </div>

          {/* Stage Timeline */}
          <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 14 }}>Approval Timeline</div>
          <div>
            {r.stages?.map((s, i) => {
              const isActive = i === r.currentStageIndex && s.status === 'pending';
              const cfg = isActive ? stageStatusConfig.active : stageStatusConfig[s.status] || stageStatusConfig.pending;
              const isLast = i === r.stages.length - 1;
              return (
                <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 4 }}>
                  {/* Timeline dot + line */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 28, flexShrink: 0 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700, background: cfg.bg, color: cfg.color, flexShrink: 0,
                      border: isActive ? `2px solid ${cfg.color}` : 'none',
                    }}>{cfg.icon}</div>
                    {!isLast && <div style={{ width: 2, flex: 1, minHeight: 16, background: s.status === 'completed' ? '#1a56db' : '#e5e7eb', margin: '3px 0' }} />}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, paddingBottom: isLast ? 0 : 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{s.stageLabel}</span>
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: cfg.bg, color: cfg.color, fontWeight: 600 }}>{isActive ? 'Awaiting Action' : cfg.label}</span>
                    </div>
                    {s.actorName && (
                      <div style={{ fontSize: 11, color: '#6b7280' }}>
                        {cfg.icon === '✓' ? 'Actioned by' : 'By'} <strong>{s.actorName}</strong>
                        {s.actedAt && <> · {new Date(s.actedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</>}
                      </div>
                    )}
                    {s.comment && (
                      <div style={{ marginTop: 6, padding: '8px 12px', background: '#f9fafb', borderRadius: 6, fontSize: 12, color: '#374151', borderLeft: `3px solid ${s.status === 'rejected' ? '#dc2626' : '#1a56db'}`, fontStyle: 'italic' }}>
                        "{s.comment}"
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action section */}
          {userCanAct && (
            <div style={{ marginTop: 20, padding: '18px', background: '#f9fafb', borderRadius: 10, border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: '#111827' }}>
                Your action required at: <span style={{ color: '#d97706' }}>{currentStage?.stageLabel}</span>
              </div>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label">Comment (optional)</label>
                <textarea className="form-control" style={{ minHeight: 72, resize: 'vertical' }} value={comment} onChange={e => setComment(e.target.value)} placeholder="Add a note for this approval..." />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button className="btn btn-danger" onClick={() => doAction('reject')} disabled={loading}>
                  {loading ? '...' : '✕ Reject'}
                </button>
                <button className="btn btn-success" onClick={() => doAction('approve')} disabled={loading}>
                  {loading ? '...' : '✓ Approve →'}
                </button>
              </div>
            </div>
          )}

          {!userCanAct && r.status === 'in_progress' && user.role !== 'initiator' && (
            <div style={{ marginTop: 16, padding: '12px 14px', background: '#f0f5ff', borderRadius: 8, fontSize: 12, color: '#1a56db' }}>
              ℹ️ This request is awaiting action at the <strong>{currentStage?.stageLabel}</strong> stage.
            </div>
          )}
        </div>

        {toast && (
          <div style={{
            position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
            background: toast.type === 'success' ? '#0d9488' : '#dc2626',
            color: '#fff', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 500,
          }}>{toast.msg}</div>
        )}
      </div>
    </div>
  );
}

// src/components/RequestCard.js
import React from 'react';

const statusConfig = {
  in_progress: { label: 'In Progress', cls: 'badge-amber' },
  approved:    { label: 'Approved',    cls: 'badge-green' },
  rejected:    { label: 'Rejected',    cls: 'badge-red' },
};

const priorityColors = { high: '#dc2626', medium: '#d97706', low: '#6b7280' };

export default function RequestCard({ request: r, onClick }) {
  const status = statusConfig[r.status] || statusConfig.in_progress;

  return (
    <div style={{ padding: '14px 18px', borderBottom: '1px solid #f3f4f6', cursor: 'pointer', transition: 'background 0.1s' }}
      onClick={onClick}
      onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 5, background: '#e8f0fd', color: '#1a56db' }}>{r.refNo}</span>
        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {r.workflowIcon} {r.workflowName}
        </span>
        <span className={`badge ${status.cls}`}>{status.label}</span>
        <span style={{ fontSize: 11, color: '#9ca3af', flexShrink: 0 }}>{timeAgo(r.createdAt)}</span>
      </div>
      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
        <span style={{ color: '#374151', fontWeight: 500 }}>{r.requesterName}</span>
        {' · '}{r.department}{' · '}
        {r.amount > 0 && <span style={{ color: '#374151', fontWeight: 500 }}>Rs {r.amount.toLocaleString()}</span>}
      </div>

      {/* Pipeline */}
      <div className="pipeline" style={{ gap: 0 }}>
        {r.stages?.map((s, i) => {
          const dotCls = s.status === 'completed' ? 'done' : s.status === 'rejected' ? 'rejected' : s.status === 'pending' && i === r.currentStageIndex ? 'active' : '';
          const isLast = i === r.stages.length - 1;
          return (
            <React.Fragment key={i}>
              <div className={`pip-dot ${dotCls}`} title={s.stageLabel} />
              {!isLast && <div className={`pip-line ${s.status === 'completed' ? 'done' : ''}`} style={{ minWidth: 16, maxWidth: 28 }} />}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return m < 1 ? 'just now' : `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

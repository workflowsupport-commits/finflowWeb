// src/pages/WorkflowsPage.js
import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';

const STAGE_LABELS = {
  initiator: 'Initiator', dept_rec: 'Dept Rec.', ceo_rec: 'CEO Rec.',
  approval: 'Approval', hr_pending: 'HR Pending', head_hr: 'Head HR',
  finance: 'Finance', gl_post: 'GL Post',
};
const STAGE_COLORS = {
  initiator: '#1a56db', dept_rec: '#0d9488', ceo_rec: '#a78bfa',
  approval: '#34d399', hr_pending: '#f472b6', head_hr: '#ec4899',
  finance: '#fbbf24', gl_post: '#d97706',
};

export default function WorkflowsPage({ onNav }) {
  const [workflows, setWorkflows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCat, setSelectedCat] = useState('');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    Promise.all([api.getWorkflows(), api.getCategories()]).then(([wfs, cats]) => {
      setWorkflows(wfs); setCategories(cats);
    });
  }, []);

  const catColors = { Finance: '#1a56db', HR: '#f472b6', Loans: '#34d399', Operations: '#fbbf24', Compliance: '#a78bfa' };

  const filtered = workflows.filter(w => {
    if (selectedCat && w.category !== selectedCat) return false;
    if (search && !w.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="fade-in">
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <input className="form-control" style={{ maxWidth: 240 }} placeholder="Search workflows..." value={search} onChange={e => setSearch(e.target.value)} />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button className="btn btn-sm" style={{ background: !selectedCat ? '#1a56db' : '#f9fafb', color: !selectedCat ? '#fff' : '#374151', borderColor: !selectedCat ? '#1a56db' : '#e5e7eb' }} onClick={() => setSelectedCat('')}>All ({workflows.length})</button>
          {categories.map(c => (
            <button key={c} className="btn btn-sm"
              style={{ background: selectedCat === c ? catColors[c] : '#f9fafb', color: selectedCat === c ? '#fff' : '#374151', borderColor: selectedCat === c ? catColors[c] : '#e5e7eb' }}
              onClick={() => setSelectedCat(c)}>{c} ({workflows.filter(w => w.category === c).length})</button>
          ))}
        </div>
        <button className="btn btn-primary btn-sm" style={{ marginLeft: 'auto' }} onClick={() => onNav('new-request')}>+ New Request</button>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
        {filtered.map(wf => (
          <div key={wf.id} className="card" style={{ cursor: 'pointer', transition: 'all 0.15s', overflow: 'hidden' }}
            onClick={() => setExpanded(expanded === wf.id ? null : wf.id)}
            onMouseEnter={e => { e.currentTarget.style.borderColor = catColors[wf.category] || '#1a56db'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.07)'; }}
          >
            <div style={{ padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: `${catColors[wf.category]}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{wf.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#111827', marginBottom: 3 }}>{wf.name}</div>
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: `${catColors[wf.category]}18`, color: catColors[wf.category] || '#1a56db', fontWeight: 600 }}>{wf.category}</span>
                </div>
                <span style={{ fontSize: 12, color: '#9ca3af' }}>{expanded === wf.id ? '▲' : '▼'}</span>
              </div>

              {/* Stage pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {wf.stages?.map((s, i) => (
                  <span key={i} style={{
                    fontSize: 10, padding: '3px 8px', borderRadius: 10, fontWeight: 500,
                    background: `${STAGE_COLORS[s] || '#6b7280'}18`,
                    color: STAGE_COLORS[s] || '#6b7280',
                    border: `1px solid ${STAGE_COLORS[s] || '#6b7280'}30`,
                  }}>{STAGE_LABELS[s] || s}</span>
                ))}
              </div>
            </div>

            {/* Expanded detail */}
            {expanded === wf.id && (
              <div style={{ borderTop: '1px solid #f3f4f6', padding: '14px 18px', background: '#f9fafb' }}>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 10 }}>
                  <strong>{wf.stages?.length} approval stages</strong>
                  {wf.requiresCEO && <> · <span style={{ color: '#a78bfa' }}>CEO sign-off required</span></>}
                  {wf.requiresHR && <> · <span style={{ color: '#f472b6' }}>HR approval required</span></>}
                </div>
                {/* Visual pipeline */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14, overflowX: 'auto', paddingBottom: 4 }}>
                  {wf.stages?.map((s, i) => (
                    <React.Fragment key={i}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 56 }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: STAGE_COLORS[s] || '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{i + 1}</div>
                        <div style={{ fontSize: 9, color: '#6b7280', textAlign: 'center', lineHeight: 1.3, maxWidth: 54 }}>{STAGE_LABELS[s] || s}</div>
                      </div>
                      {i < wf.stages.length - 1 && <div style={{ flex: 1, height: 2, background: '#e5e7eb', minWidth: 12, marginBottom: 14 }} />}
                    </React.Fragment>
                  ))}
                </div>
                <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center' }}
                  onClick={e => { e.stopPropagation(); onNav('new-request'); }}>
                  Start {wf.name} Request →
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state"><div className="icon">🔍</div><h3>No workflows found</h3></div>
      )}
    </div>
  );
}

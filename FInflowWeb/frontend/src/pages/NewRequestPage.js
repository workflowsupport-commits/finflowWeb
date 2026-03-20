// src/pages/NewRequestPage.js
import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function NewRequestPage({ onNav }) {
  const { user } = useAuth();
  const [workflows, setWorkflows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCat, setSelectedCat] = useState('');
  const [selectedWf, setSelectedWf] = useState(null);
  const [wfDetail, setWfDetail] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', amount: '', currency: 'LKR', priority: 'medium' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.getWorkflows(), api.getCategories()]).then(([wfs, cats]) => {
      setWorkflows(wfs);
      setCategories(cats);
    }).catch(console.error);
  }, []);

  const handleWfSelect = async (wf) => {
    setSelectedWf(wf);
    setWfDetail(null);
    setForm(f => ({ ...f, title: wf.name }));
    try {
      const detail = await api.getWorkflow(wf.id);
      setWfDetail(detail);
    } catch (e) {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedWf) { setError('Please select a workflow type'); return; }
    setLoading(true); setError('');
    try {
      const res = await api.createRequest({
        workflowId: selectedWf.id,
        title: form.title,
        description: form.description,
        amount: parseFloat(form.amount) || 0,
        currency: form.currency,
        priority: form.priority,
      });
      setSuccess(res);
    } catch (err) {
      setError(err.message || 'Failed to submit');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fade-in" style={{ maxWidth: 520, margin: '0 auto' }}>
        <div className="card" style={{ textAlign: 'center', padding: '48px 32px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Request Submitted!</h2>
          <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 6 }}>{success.workflowName}</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#1a56db', marginBottom: 20 }}>{success.refNo}</div>
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 24, lineHeight: 1.7 }}>
            Your request is now in the approval pipeline. You'll receive email notifications at each stage.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={() => onNav('requests')}>View My Requests →</button>
            <button className="btn" onClick={() => { setSuccess(null); setSelectedWf(null); setWfDetail(null); setForm({ title: '', description: '', amount: '', currency: 'LKR', priority: 'medium' }); }}>
              Submit Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  const filteredWfs = selectedCat ? workflows.filter(w => w.category === selectedCat) : workflows;
  const catColors = { Finance: '#1a56db', HR: '#f472b6', Loans: '#34d399', Operations: '#fbbf24', Compliance: '#a78bfa' };

  return (
    <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20, maxWidth: 960 }}>
      {/* Workflow picker */}
      <div>
        <div className="card">
          <div className="card-header"><span className="card-title">Select Workflow</span></div>
          {/* Category filter */}
          <div style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <button className="btn btn-sm" style={{ background: !selectedCat ? '#1a56db' : '#f9fafb', color: !selectedCat ? '#fff' : '#374151', borderColor: !selectedCat ? '#1a56db' : '#e5e7eb' }} onClick={() => setSelectedCat('')}>All</button>
            {categories.map(c => (
              <button key={c} className="btn btn-sm"
                style={{ background: selectedCat === c ? catColors[c] || '#1a56db' : '#f9fafb', color: selectedCat === c ? '#fff' : '#374151', borderColor: selectedCat === c ? catColors[c] || '#1a56db' : '#e5e7eb' }}
                onClick={() => setSelectedCat(c)}>{c}</button>
            ))}
          </div>
          <div style={{ maxHeight: 480, overflowY: 'auto' }}>
            {filteredWfs.map(wf => (
              <div key={wf.id} onClick={() => handleWfSelect(wf)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
                  cursor: 'pointer', borderBottom: '1px solid #f3f4f6', transition: 'all 0.1s',
                  background: selectedWf?.id === wf.id ? '#e8f0fd' : 'transparent',
                  borderLeft: selectedWf?.id === wf.id ? '3px solid #1a56db' : '3px solid transparent',
                }}
                onMouseEnter={e => { if (selectedWf?.id !== wf.id) e.currentTarget.style.background = '#f9fafb'; }}
                onMouseLeave={e => { if (selectedWf?.id !== wf.id) e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ fontSize: 20 }}>{wf.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{wf.name}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>{wf.stages?.length} stages · {wf.category}</div>
                </div>
                {selectedWf?.id === wf.id && <span style={{ color: '#1a56db', fontSize: 16 }}>✓</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form + Pipeline preview */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Pipeline preview */}
        {wfDetail && (
          <div className="card">
            <div className="card-header"><span className="card-title">{wfDetail.icon} {wfDetail.name} – Approval Pipeline</span></div>
            <div style={{ padding: '14px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 0, overflowX: 'auto', paddingBottom: 4 }}>
                {wfDetail.stagesDetail?.map((s, i) => (
                  <React.Fragment key={i}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 80, textAlign: 'center' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: i === 0 ? '#1a56db' : '#e5e7eb', color: i === 0 ? '#fff' : '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, marginBottom: 4 }}>{i + 1}</div>
                      <div style={{ fontSize: 10, color: '#374151', fontWeight: 500, lineHeight: 1.3 }}>{s.label}</div>
                    </div>
                    {i < wfDetail.stagesDetail.length - 1 && <div style={{ flex: 1, height: 2, background: '#e5e7eb', minWidth: 16, marginTop: -16 }} />}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">{selectedWf ? `${selectedWf.icon} ${selectedWf.name} – Request Details` : 'Request Details'}</span>
          </div>
          <div className="card-body">
            {!selectedWf ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#9ca3af' }}>← Select a workflow type to begin</div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Request Title</label>
                  <input className="form-control" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
                </div>

                <div className="form-row form-group">
                  <div>
                    <label className="form-label">Requester</label>
                    <input className="form-control" value={user.name} disabled style={{ background: '#f9fafb' }} />
                  </div>
                  <div>
                    <label className="form-label">Department</label>
                    <input className="form-control" value={user.department} disabled style={{ background: '#f9fafb' }} />
                  </div>
                </div>

                <div className="form-row form-group">
                  <div>
                    <label className="form-label">Branch</label>
                    <input className="form-control" value={user.branch} disabled style={{ background: '#f9fafb' }} />
                  </div>
                  <div>
                    <label className="form-label">Priority</label>
                    <select className="form-control" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                <div className="form-row form-group">
                  <div>
                    <label className="form-label">Amount (LKR)</label>
                    <input className="form-control" type="number" min="0" step="0.01" placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                  </div>
                  <div>
                    <label className="form-label">Currency</label>
                    <select className="form-control" value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
                      <option value="LKR">LKR – Sri Lankan Rupee</option>
                      <option value="USD">USD – US Dollar</option>
                      <option value="EUR">EUR – Euro</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Purpose / Description</label>
                  <textarea className="form-control" style={{ minHeight: 88, resize: 'vertical' }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the purpose of this request..." required />
                </div>

                <div className="form-group">
                  <label className="form-label">Supporting Documents</label>
                  <div style={{ border: '2px dashed #e5e7eb', borderRadius: 8, padding: '20px', textAlign: 'center', color: '#9ca3af', fontSize: 13, cursor: 'pointer', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#1a56db'; e.currentTarget.style.background = '#f0f5ff'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.background = 'transparent'; }}
                  >
                    📎 Click to attach documents (PDF, JPEG, PNG)
                  </div>
                </div>

                {error && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>{error}</div>}

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button type="button" className="btn" onClick={() => onNav('dashboard')}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Submitting...' : `Submit ${selectedWf.name} Request →`}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

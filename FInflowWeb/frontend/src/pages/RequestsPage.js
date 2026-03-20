// src/pages/RequestsPage.js
import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import RequestCard from '../components/RequestCard';
import RequestDetailModal from '../components/RequestDetailModal';

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

export default function RequestsPage({ onNav, requestId }) {
  const [requests, setRequests] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(1);

  const load = async (params = {}) => {
    setLoading(true);
    try {
      const res = await api.getRequests({ status, search, page, limit: 15, ...params });
      setRequests(res.data || []);
      setMeta(res.meta || {});
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [status, page]);

  useEffect(() => {
    const timer = setTimeout(() => load(), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Open specific request if passed via nav
  useEffect(() => {
    if (requestId) {
      api.getRequest(requestId).then(setSelected).catch(() => {});
    }
  }, [requestId]);

  const refresh = () => load();

  return (
    <div className="fade-in">
      <div className="card">
        {/* Toolbar */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #e5e7eb', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            className="form-control" style={{ maxWidth: 260 }}
            placeholder="Search by ID, name, type..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
          <div style={{ display: 'flex', gap: 6 }}>
            {STATUS_FILTERS.map(f => (
              <button key={f.value} className="btn btn-sm"
                style={{
                  background: status === f.value ? '#1a56db' : '#f9fafb',
                  color: status === f.value ? '#fff' : '#374151',
                  borderColor: status === f.value ? '#1a56db' : '#e5e7eb',
                }}
                onClick={() => { setStatus(f.value); setPage(1); }}
              >{f.label}</button>
            ))}
          </div>
          <div style={{ marginLeft: 'auto', fontSize: 13, color: '#6b7280' }}>
            {meta.total || 0} requests
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#9ca3af' }}>Loading...</div>
        ) : requests.length === 0 ? (
          <div className="empty-state"><div className="icon">📋</div><h3>No requests found</h3></div>
        ) : (
          requests.map(r => (
            <RequestCard key={r.id} request={r} onClick={() => setSelected(r)} />
          ))
        )}

        {/* Pagination */}
        {meta.pages > 1 && (
          <div style={{ padding: '14px 18px', borderTop: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className="btn btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
            <span style={{ fontSize: 13, color: '#6b7280' }}>Page {page} of {meta.pages}</span>
            <button className="btn btn-sm" disabled={page >= meta.pages} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        )}
      </div>

      {selected && (
        <RequestDetailModal
          request={selected}
          onClose={() => setSelected(null)}
          onRefresh={refresh}
        />
      )}
    </div>
  );
}

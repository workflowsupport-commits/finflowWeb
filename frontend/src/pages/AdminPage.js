// src/pages/AdminPage.js
import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';

const ROLES = [
  { value: 'initiator',  label: 'Initiator',         desc: 'Can submit workflow requests' },
  { value: 'supervisor', label: 'Supervisor',         desc: 'Dept/Branch Recommendation & Approval stages' },
  { value: 'hr',         label: 'HR Officer',         desc: 'HR Pending & Head of HR stages' },
  { value: 'finance',    label: 'Finance Manager',    desc: 'Finance Pending & GL Posting stages' },
  { value: 'ceo',        label: 'CEO',                desc: 'CEO Recommendation stage' },
  { value: 'admin',      label: 'Administrator',      desc: 'Full system access, user management' },
];

const ROLE_COLORS = {
  initiator: '#4da6ff', supervisor: '#34d399',
  hr: '#f472b6', finance: '#fbbf24', ceo: '#a78bfa', admin: '#f87171',
};

const EMPTY_FORM = {
  name: '', email: '', password: '', role: 'initiator',
  jobFunction: '', department: '', branch: '', allowedWorkflows: [], isActive: true,
};

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null); // null = create mode
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [activeTab, setActiveTab] = useState('users'); // users | workflows

  const load = async () => {
    setLoading(true);
    try {
      const [u, w] = await Promise.all([api.adminGetUsers(), api.adminGetWorkflows()]);
      setUsers(u);
      setWorkflows(w);
    } catch (e) { showToast(e.message, 'error'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const openCreate = () => {
    setEditUser(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowModal(true);
  };

  const openEdit = (user) => {
    setEditUser(user);
    setForm({
      name: user.name, email: user.email, password: '',
      role: user.role, jobFunction: user.jobFunction || '',
      department: user.department || '', branch: user.branch || '',
      allowedWorkflows: user.allowedWorkflows || [], isActive: user.isActive !== false,
    });
    setError('');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password; // don't send empty password on edit
      if (editUser) {
        await api.adminUpdateUser(editUser.id, payload);
        showToast(`${form.name} updated successfully`);
      } else {
        await api.adminCreateUser(payload);
        showToast(`${form.name} created successfully`);
      }
      setShowModal(false);
      await load();
    } catch (err) {
      setError(err.message || 'Failed to save');
    }
    setSaving(false);
  };

  const handleDeactivate = async (user) => {
    if (!window.confirm(`${user.isActive ? 'Deactivate' : 'Reactivate'} ${user.name}?`)) return;
    try {
      if (user.isActive) {
        await api.adminDeleteUser(user.id);
        showToast(`${user.name} deactivated`);
      } else {
        await api.adminUpdateUser(user.id, { isActive: true });
        showToast(`${user.name} reactivated`);
      }
      await load();
    } catch (err) { showToast(err.message, 'error'); }
  };

  const toggleWorkflow = (wfId) => {
    setForm(f => ({
      ...f,
      allowedWorkflows: f.allowedWorkflows.includes(wfId)
        ? f.allowedWorkflows.filter(id => id !== wfId)
        : [...f.allowedWorkflows, wfId],
    }));
  };

  const selectAllInCategory = (cat) => {
    const catIds = workflows.filter(w => w.category === cat).map(w => w.id);
    const allSelected = catIds.every(id => form.allowedWorkflows.includes(id));
    setForm(f => ({
      ...f,
      allowedWorkflows: allSelected
        ? f.allowedWorkflows.filter(id => !catIds.includes(id))
        : [...new Set([...f.allowedWorkflows, ...catIds])],
    }));
  };

  const filteredUsers = users.filter(u => {
    if (filterRole && u.role !== filterRole) return false;
    if (search) {
      const q = search.toLowerCase();
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.department || '').toLowerCase().includes(q);
    }
    return true;
  });

  const wfByCategory = {};
  workflows.forEach(w => {
    if (!wfByCategory[w.category]) wfByCategory[w.category] = [];
    wfByCategory[w.category].push(w);
  });

  const roleCounts = {};
  users.forEach(u => { roleCounts[u.role] = (roleCounts[u.role] || 0) + 1; });

  return (
    <div className="fade-in">
      {/* Header stats */}
      <div className="stat-grid stat-grid-4" style={{ marginBottom: 22 }}>
        <div className="stat-card">
          <div className="stat-label">Total Users</div>
          <div className="stat-value" style={{ color: '#1a56db' }}>{users.length}</div>
          <div className="stat-sub">{users.filter(u => u.isActive !== false).length} active</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Initiators</div>
          <div className="stat-value" style={{ color: '#4da6ff' }}>{roleCounts.initiator || 0}</div>
          <div className="stat-sub">Can submit requests</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Approvers</div>
          <div className="stat-value" style={{ color: '#34d399' }}>{(roleCounts.supervisor || 0) + (roleCounts.hr || 0) + (roleCounts.finance || 0) + (roleCounts.ceo || 0)}</div>
          <div className="stat-sub">Supervisor · HR · Finance · CEO</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Workflows</div>
          <div className="stat-value" style={{ color: '#a78bfa' }}>{workflows.length}</div>
          <div className="stat-sub">Available to assign</div>
        </div>
      </div>

      <div className="card">
        {/* Tabs */}
        <div style={{ padding: '0 18px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 0 }}>
          {[{ id: 'users', label: '👥 Users' }, { id: 'workflows', label: '⇌ Workflow Access' }].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '14px 18px', border: 'none', background: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: activeTab === tab.id ? 600 : 400, fontFamily: 'inherit',
                color: activeTab === tab.id ? '#1a56db' : '#6b7280',
                borderBottom: activeTab === tab.id ? '2px solid #1a56db' : '2px solid transparent',
                marginBottom: -1, transition: 'all 0.15s',
              }}>
              {tab.label}
            </button>
          ))}
          <div style={{ marginLeft: 'auto', padding: '10px 0' }}>
            <button className="btn btn-primary btn-sm" onClick={openCreate}>+ Add User</button>
          </div>
        </div>

        {activeTab === 'users' && (
          <>
            {/* Toolbar */}
            <div style={{ padding: '12px 18px', borderBottom: '1px solid #e5e7eb', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <input className="form-control" style={{ maxWidth: 240 }} placeholder="Search name, email, department..."
                value={search} onChange={e => setSearch(e.target.value)} />
              <select className="form-control" style={{ maxWidth: 180 }} value={filterRole} onChange={e => setFilterRole(e.target.value)}>
                <option value="">All Roles</option>
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
              <span style={{ fontSize: 13, color: '#6b7280', marginLeft: 'auto' }}>{filteredUsers.length} users</span>
            </div>

            {loading ? (
              <div style={{ padding: 32, textAlign: 'center', color: '#9ca3af' }}>Loading users...</div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Department</th>
                    <th>Branch</th>
                    <th>Workflows</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                            background: ROLE_COLORS[u.role] || '#6b7280',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, fontWeight: 700, color: '#fff',
                          }}>{u.avatar}</div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{u.name}</div>
                            <div style={{ fontSize: 11, color: '#9ca3af' }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{
                          fontSize: 11, padding: '3px 10px', borderRadius: 10, fontWeight: 600,
                          background: `${ROLE_COLORS[u.role]}20`, color: ROLE_COLORS[u.role] || '#6b7280',
                        }}>{u.role}</span>
                      </td>
                      <td style={{ fontSize: 13 }}>{u.department || '—'}</td>
                      <td style={{ fontSize: 13 }}>{u.branch || '—'}</td>
                      <td>
                        {u.role === 'initiator' ? (
                          <span style={{ fontSize: 12, color: '#374151' }}>
                            {u.allowedWorkflows?.length > 0
                              ? <><strong>{u.allowedWorkflows.length}</strong> assigned</>
                              : <span style={{ color: '#9ca3af' }}>None assigned</span>}
                          </span>
                        ) : (
                          <span style={{ fontSize: 11, color: '#9ca3af', fontStyle: 'italic' }}>All (by role)</span>
                        )}
                      </td>
                      <td>
                        <span style={{
                          fontSize: 11, padding: '3px 10px', borderRadius: 10, fontWeight: 600,
                          background: u.isActive !== false ? '#dcfce7' : '#fee2e2',
                          color: u.isActive !== false ? '#15803d' : '#dc2626',
                        }}>
                          {u.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-sm" onClick={() => openEdit(u)}>Edit</button>
                          {u.role !== 'admin' && (
                            <button className="btn btn-sm"
                              style={{ color: u.isActive !== false ? '#dc2626' : '#15803d', borderColor: u.isActive !== false ? '#fca5a5' : '#99d6cf' }}
                              onClick={() => handleDeactivate(u)}>
                              {u.isActive !== false ? 'Deactivate' : 'Reactivate'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}

        {activeTab === 'workflows' && (
          <div style={{ padding: 18 }}>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 18, lineHeight: 1.6 }}>
              Workflow access is assigned per user in the <strong>Edit User</strong> modal. Below is a summary of all 32 workflow types and which roles access them by default.
            </p>
            {Object.entries(wfByCategory).map(([cat, wfs]) => (
              <div key={cat} style={{ marginBottom: 22 }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#6b7280', marginBottom: 10 }}>{cat}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
                  {wfs.map(wf => (
                    <div key={wf.id} style={{ padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 18 }}>{wf.icon}</span>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 500 }}>{wf.name}</div>
                        <div style={{ fontSize: 10, color: '#9ca3af', fontFamily: 'DM Mono, monospace' }}>{wf.id}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 700 }}>
            <div className="modal-header">
              <span className="modal-title">{editUser ? `Edit User – ${editUser.name}` : 'Create New User'}</span>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSave}>

                {/* Basic Info */}
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#9ca3af', marginBottom: 12 }}>Basic Information</div>
                <div className="form-row form-group">
                  <div>
                    <label className="form-label">Full Name *</label>
                    <input className="form-control" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="e.g. Kasun Perera" />
                  </div>
                  <div>
                    <label className="form-label">Email Address *</label>
                    <input className="form-control" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required placeholder="kasun@finflow.lk" />
                  </div>
                </div>
                <div className="form-row form-group">
                  <div>
                    <label className="form-label">{editUser ? 'New Password (leave blank to keep)' : 'Password *'}</label>
                    <input className="form-control" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required={!editUser} placeholder="••••••••" />
                  </div>
                  <div>
                    <label className="form-label">Job Function</label>
                    <input className="form-control" value={form.jobFunction} onChange={e => setForm(f => ({ ...f, jobFunction: e.target.value }))} placeholder="e.g. Branch Manager" />
                  </div>
                </div>
                <div className="form-row form-group">
                  <div>
                    <label className="form-label">Department</label>
                    <input className="form-control" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} placeholder="e.g. Operations" />
                  </div>
                  <div>
                    <label className="form-label">Branch</label>
                    <input className="form-control" value={form.branch} onChange={e => setForm(f => ({ ...f, branch: e.target.value }))} placeholder="e.g. Colombo Main" />
                  </div>
                </div>

                {/* Role */}
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#9ca3af', margin: '18px 0 12px' }}>Role & Permissions</div>
                <div className="form-group">
                  <label className="form-label">System Role *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {ROLES.map(r => (
                      <div key={r.value} onClick={() => setForm(f => ({ ...f, role: r.value }))}
                        style={{
                          padding: '10px 14px', border: `2px solid ${form.role === r.value ? ROLE_COLORS[r.value] : '#e5e7eb'}`,
                          borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s',
                          background: form.role === r.value ? `${ROLE_COLORS[r.value]}10` : 'transparent',
                        }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 10, height: 10, borderRadius: '50%', background: ROLE_COLORS[r.value] }} />
                          <span style={{ fontWeight: 600, fontSize: 13 }}>{r.label}</span>
                        </div>
                        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>{r.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status toggle */}
                {editUser && (
                  <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <label className="form-label" style={{ margin: 0 }}>Account Status</label>
                    <button type="button" onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                      style={{
                        padding: '6px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                        fontSize: 12, fontWeight: 600,
                        background: form.isActive ? '#dcfce7' : '#fee2e2',
                        color: form.isActive ? '#15803d' : '#dc2626',
                      }}>
                      {form.isActive ? '● Active' : '○ Inactive'}
                    </button>
                  </div>
                )}

                {/* Workflow Access (only for initiators) */}
                {form.role === 'initiator' && (
                  <>
                    <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#9ca3af', margin: '18px 0 8px' }}>
                      Workflow Access
                      <span style={{ fontWeight: 400, color: '#b0b8c1', marginLeft: 8 }}>({form.allowedWorkflows.length} selected)</span>
                    </div>
                    <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>
                      Select which workflows this user can submit requests for. Approver roles always see all relevant workflows.
                    </p>
                    <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', maxHeight: 320, overflowY: 'auto' }}>
                      {Object.entries(wfByCategory).map(([cat, wfs]) => {
                        const catIds = wfs.map(w => w.id);
                        const allSelected = catIds.every(id => form.allowedWorkflows.includes(id));
                        const someSelected = catIds.some(id => form.allowedWorkflows.includes(id));
                        return (
                          <div key={cat}>
                            <div style={{
                              padding: '8px 14px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb',
                              display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                            }} onClick={() => selectAllInCategory(cat)}>
                              <div style={{
                                width: 16, height: 16, border: `2px solid ${allSelected ? '#1a56db' : someSelected ? '#93b8f7' : '#d1d5db'}`,
                                borderRadius: 4, background: allSelected ? '#1a56db' : someSelected ? '#e8f0fd' : 'transparent',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                              }}>
                                {allSelected && <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>✓</span>}
                                {someSelected && !allSelected && <span style={{ color: '#1a56db', fontSize: 10, fontWeight: 700 }}>–</span>}
                              </div>
                              <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>{cat}</span>
                              <span style={{ fontSize: 11, color: '#9ca3af' }}>{catIds.filter(id => form.allowedWorkflows.includes(id)).length}/{wfs.length}</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
                              {wfs.map(wf => {
                                const checked = form.allowedWorkflows.includes(wf.id);
                                return (
                                  <div key={wf.id} onClick={() => toggleWorkflow(wf.id)}
                                    style={{
                                      padding: '9px 14px', display: 'flex', alignItems: 'center', gap: 10,
                                      cursor: 'pointer', borderBottom: '1px solid #f3f4f6',
                                      background: checked ? '#f0f5ff' : 'transparent', transition: 'background 0.1s',
                                    }}
                                    onMouseEnter={e => { if (!checked) e.currentTarget.style.background = '#f9fafb'; }}
                                    onMouseLeave={e => { if (!checked) e.currentTarget.style.background = 'transparent'; }}
                                  >
                                    <div style={{
                                      width: 16, height: 16, border: `2px solid ${checked ? '#1a56db' : '#d1d5db'}`,
                                      borderRadius: 4, background: checked ? '#1a56db' : 'transparent', flexShrink: 0,
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                      {checked && <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>✓</span>}
                                    </div>
                                    <span style={{ fontSize: 13 }}>{wf.icon}</span>
                                    <span style={{ fontSize: 12, color: '#374151' }}>{wf.name}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                {form.role !== 'initiator' && (
                  <div style={{ padding: '12px 14px', background: '#f0f5ff', borderRadius: 8, fontSize: 12, color: '#1a56db', marginTop: 12 }}>
                    ℹ️ <strong>{ROLES.find(r => r.value === form.role)?.label}</strong> role has access to all relevant workflows based on their approval responsibilities — no manual workflow assignment needed.
                  </div>
                )}

                {error && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginTop: 14 }}>{error}</div>}

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20, paddingTop: 16, borderTop: '1px solid #e5e7eb' }}>
                  <button type="button" className="btn" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Saving...' : editUser ? 'Save Changes' : 'Create User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          background: toast.type === 'error' ? '#dc2626' : '#0d9488',
          color: '#fff', padding: '12px 20px', borderRadius: 10,
          fontSize: 13, fontWeight: 500, boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          animation: 'fadeIn 0.2s ease',
        }}>{toast.msg}</div>
      )}
    </div>
  );
}

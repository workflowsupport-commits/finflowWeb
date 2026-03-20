// src/utils/api.js
const BASE = process.env.REACT_APP_API_URL || '/api';

function getToken() { return localStorage.getItem('finflow_token'); }

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (res.status === 401) {
    localStorage.removeItem('finflow_token');
    window.location.reload();
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  // Auth
  login:    (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
  me:       () => request('/auth/me'),

  // Admin - User Management
  adminGetUsers:    () => request('/admin/users'),
  adminGetUser:     (id) => request(`/admin/users/${id}`),
  adminCreateUser:  (body) => request('/admin/users', { method: 'POST', body }),
  adminUpdateUser:  (id, body) => request(`/admin/users/${id}`, { method: 'PATCH', body }),
  adminDeleteUser:  (id) => request(`/admin/users/${id}`, { method: 'DELETE' }),
  adminGetWorkflows: () => request('/admin/workflows'),

  // Workflows
  getWorkflows:   (params = {}) => request('/workflows?' + new URLSearchParams(params)),
  getWorkflow:    (id) => request(`/workflows/${id}`),
  getCategories:  () => request('/workflows/categories'),

  // Requests
  getRequests:    (params = {}) => request('/requests?' + new URLSearchParams(params)),
  getRequest:     (id) => request(`/requests/${id}`),
  createRequest:  (body) => request('/requests', { method: 'POST', body }),
  actionRequest:  (id, action, comment) => request(`/requests/${id}/action`, { method: 'POST', body: { action, comment } }),
  getMyApprovals: () => request('/requests/my-approvals'),

  // Analytics
  getSummary:     () => request('/analytics/summary'),
  getByWorkflow:  () => request('/analytics/by-workflow'),
  getByDept:      () => request('/analytics/by-department'),
  getByMonth:     () => request('/analytics/by-month'),
  getByCategory:  () => request('/analytics/by-category'),

  // Notifications
  getNotifications:     () => request('/notifications'),
  getUnreadCount:       () => request('/notifications/unread-count'),
  markRead:             (id) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllRead:          () => request('/notifications/read-all', { method: 'PATCH' }),
};

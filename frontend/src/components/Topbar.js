// src/components/Topbar.js
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

const pageTitles = {
  dashboard: 'Dashboard', requests: 'My Requests', approvals: 'Pending Approvals',
  'new-request': 'New Request', workflows: 'Workflow Library', reports: 'Reports & Analytics',
};

export default function Topbar({ currentPage, onNav }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [showNotif, setShowNotif] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const [notifs, count] = await Promise.all([api.getNotifications(), api.getUnreadCount()]);
      setNotifications(notifs);
      setUnread(count.count);
    } catch (e) {}
  };

  useEffect(() => {
    const handler = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = async () => {
    await api.markAllRead();
    setUnread(0);
    setNotifications(n => n.map(x => ({ ...x, read: true })));
  };

  const timeAgo = (iso) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <header style={{
      height: 58, background: '#fff', borderBottom: '1px solid #e5e7eb',
      padding: '0 24px', display: 'flex', alignItems: 'center', gap: 16,
      flexShrink: 0, position: 'sticky', top: 0, zIndex: 100,
    }}>
      <div style={{ flex: 1 }}>
        <h1 style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>{pageTitles[currentPage] || 'Dashboard'}</h1>
        <div style={{ fontSize: 11, color: '#9ca3af' }}>
          {user?.department} · {user?.branch}
        </div>
      </div>

      {currentPage !== 'new-request' && (
        <button className="btn btn-primary btn-sm" onClick={() => onNav('new-request')}>
          + New Request
        </button>
      )}

      {/* Notifications Bell */}
      <div ref={notifRef} style={{ position: 'relative' }}>
        <button className="btn btn-icon" onClick={() => setShowNotif(v => !v)} style={{ position: 'relative' }}>
          🔔
          {unread > 0 && (
            <span style={{
              position: 'absolute', top: -4, right: -4, background: '#dc2626',
              color: '#fff', fontSize: 9, fontWeight: 700, padding: '1px 5px',
              borderRadius: 10, lineHeight: 1.4,
            }}>{unread > 9 ? '9+' : unread}</span>
          )}
        </button>

        {showNotif && (
          <div style={{
            position: 'absolute', top: '100%', right: 0, marginTop: 8,
            width: 340, background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb',
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)', zIndex: 200, overflow: 'hidden',
          }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontSize: 14, flex: 1 }}>Notifications</span>
              {unread > 0 && <button onClick={markAllRead} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: '#1a56db', fontFamily: 'inherit' }}>Mark all read</button>}
            </div>
            <div style={{ maxHeight: 380, overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>No notifications</div>
              ) : notifications.map(n => (
                <div key={n.id} style={{
                  padding: '12px 16px', display: 'flex', gap: 10, cursor: 'pointer',
                  background: n.read ? 'transparent' : '#f0f5ff',
                  borderBottom: '1px solid #f3f4f6', transition: 'background 0.1s',
                }}
                  onClick={() => { api.markRead(n.id); onNav('requests', n.requestId); setShowNotif(false); }}
                >
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: n.read ? 'transparent' : '#1a56db', marginTop: 4, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.5 }}>{n.message}</div>
                    <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>{timeAgo(n.createdAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

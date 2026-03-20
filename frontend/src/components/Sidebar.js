// src/components/Sidebar.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

const navItems = [
  { id: 'dashboard',    label: 'Dashboard',        icon: '⊞', roles: ['all'] },
  { id: 'requests',     label: 'My Requests',       icon: '📋', roles: ['initiator', 'supervisor', 'hr', 'finance', 'ceo'] },
  { id: 'approvals',    label: 'Pending Approvals', icon: '✓',  roles: ['supervisor', 'hr', 'finance', 'ceo'], badge: true },
  { id: 'new-request',  label: 'New Request',       icon: '＋', roles: ['initiator'] },
  { id: 'workflows',    label: 'Workflow Library',  icon: '⇌',  roles: ['all'] },
  { id: 'reports',      label: 'Reports',           icon: '▦',  roles: ['supervisor', 'hr', 'finance', 'ceo', 'admin'] },
  { id: 'admin',        label: 'Admin Panel',       icon: '⚙',  roles: ['admin'] },
];

const roleColors = {
  initiator: '#4da6ff', supervisor: '#34d399',
  hr: '#f472b6', finance: '#fbbf24', ceo: '#a78bfa', admin: '#f87171',
};

const roleLabel = {
  initiator: 'Initiator', supervisor: 'Supervisor',
  hr: 'HR Officer', finance: 'Finance', ceo: 'CEO', admin: 'Administrator',
};

export default function Sidebar({ currentPage, onNav }) {
  const { user, logout } = useAuth();
  const [approvalCount, setApprovalCount] = useState(0);

  useEffect(() => {
    if (user?.role && !['initiator', 'admin'].includes(user.role)) {
      api.getMyApprovals().then(d => setApprovalCount(d.length)).catch(() => {});
    }
  }, [user]);

  const visible = navItems.filter(item =>
    item.roles.includes('all') || item.roles.includes(user?.role)
  );

  const roleColor = roleColors[user?.role] || '#4da6ff';

  return (
    <aside style={{
      width: 230, background: '#0f2244', color: '#c5d3e8',
      display: 'flex', flexDirection: 'column', flexShrink: 0,
      fontFamily: 'DM Sans, system-ui, sans-serif',
    }}>
      <div style={{ padding: '20px 22px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' }}>
          Fin<span style={{ color: '#4da6ff' }}>Flow</span>
        </div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2, letterSpacing: '1px', textTransform: 'uppercase' }}>
          Finance Workflow System
        </div>
      </div>

      <nav style={{ padding: '12px 10px', flex: 1, overflowY: 'auto' }}>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', padding: '8px 12px 6px' }}>
          Workspace
        </div>
        {visible.map(item => {
          const isActive = currentPage === item.id;
          const activeColor = item.id === 'admin' ? '#f87171' : '#4da6ff';
          return (
            <div key={item.id} onClick={() => onNav(item.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
                margin: '1px 0', borderRadius: 8, cursor: 'pointer', fontSize: 13,
                fontWeight: isActive ? 500 : 400,
                color: isActive ? activeColor : 'rgba(255,255,255,0.6)',
                background: isActive ? `${activeColor}20` : 'transparent',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
            >
              <span style={{ width: 18, textAlign: 'center', fontSize: 15 }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge && approvalCount > 0 && (
                <span style={{ background: '#dc2626', color: '#fff', fontSize: 10, padding: '1px 7px', borderRadius: 10, fontWeight: 700 }}>
                  {approvalCount}
                </span>
              )}
            </div>
          );
        })}
      </nav>

      <div style={{ padding: '10px 18px', borderTop: '1px solid rgba(255,255,255,0.07)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px',
          borderRadius: 20, background: `${roleColor}20`, border: `1px solid ${roleColor}40`,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: roleColor }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: roleColor }}>
            {roleLabel[user?.role] || user?.role}
          </span>
        </div>
      </div>

      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 34, height: 34, borderRadius: '50%', background: roleColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0,
        }}>
          {user?.avatar}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.name}
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{user?.jobFunction}</div>
        </div>
        <button onClick={logout} title="Logout"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', fontSize: 16, padding: 4 }}>
          ⎋
        </button>
      </div>
    </aside>
  );
}

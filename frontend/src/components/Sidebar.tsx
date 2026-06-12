import React, { useState, type ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
  { id: 'announcements', label: 'Announcements', icon: '📢' },
  { id: 'chat', label: 'Member Chat', icon: '💬' },
  { id: 'activity', label: 'Member Activity', icon: '👥' },
  { id: 'meetings', label: 'Meetings', icon: '📋' },
  { id: 'calendar', label: 'Calendar', icon: '🗓️' },
  { id: 'financials', label: 'Financials', icon: '💰' },
  { id: 'subscription', label: 'Subscription', icon: '⭐' },
];

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate, mobileOpen, onMobileClose }) => {
  const { user, logout } = useAuth();

  return (
    <>
      <div className={`sidebar-overlay ${mobileOpen ? 'open' : ''}`} onClick={onMobileClose} />
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <img
            src="/udodiri-app-logo.png"
            alt="Logo"
            className="sidebar-logo rounded-xl"
            onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png'; }}
          />
          <h2>Udodiri</h2>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
              onClick={() => { onNavigate(item.id); onMobileClose(); }}
            >
              <span className="icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{user?.name?.charAt(0).toUpperCase() || '?'}</div>
            <div className="user-details">
              <div className="user-name">{user?.name || 'Member'}</div>
              <div className="user-role">{user?.role} • {user?.subscriptionTier}</div>
            </div>
          </div>
          <button className="logout-btn" onClick={logout}>🚪 Sign Out</button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

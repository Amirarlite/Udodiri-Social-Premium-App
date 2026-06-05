import React from 'react';
import { useAuth } from '../context/AuthContext';

interface DashboardProps {
  onNavigate: (page: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();

  const cards = [
    { icon: '📢', title: 'Announcements', desc: 'Latest club announcements & broadcasts', page: 'announcements' },
    { icon: '💬', title: 'Member Chat', desc: 'Brotherhood chat & executive broadcasts', page: 'chat' },
    { icon: '👥', title: 'Member Activity', desc: 'See what members are up to', page: 'activity' },
    { icon: '📋', title: 'Meetings', desc: 'View and manage meeting minutes', page: 'meetings' },
    { icon: '🗓️', title: 'Calendar', desc: 'Upcoming events and meetings', page: 'calendar' },
    { icon: '💰', title: 'Financials', desc: 'Dues, levies, funds & fines', page: 'financials' },
    { icon: '⭐', title: 'Subscription', desc: 'Manage your premium membership', page: 'subscription' },
  ];

  return (
    <div>
      <h1 className="page-title">Welcome, {user?.name} 👋</h1>
      <div className="dashboard-grid">
        {cards.map(c => (
          <div key={c.page} className="dash-card" onClick={() => onNavigate(c.page)}>
            <div className="dash-card-icon">{c.icon}</div>
            <h3>{c.title}</h3>
            <p>{c.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;

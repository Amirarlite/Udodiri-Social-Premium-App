import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../hooks/api';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: number;
  related_id: string | null;
  created_at: string;
}

const Notifications: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'urgent' | 'payments' | 'mentions'>('all');

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.notifications || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    try {
      await api.post(`/notifications/${id}/read`, {});
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    } catch (err) { console.error(err); }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/read-all', {});
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    } catch (err) { console.error(err); }
  };

  const filtered = notifications.filter(n => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'urgent' && n.type === 'meeting') return true;
    if (activeFilter === 'payments' && n.type === 'payment') return true;
    return true;
  });

  const getIconForType = (type: string) => {
    switch (type) {
      case 'announcement': return 'campaign';
      case 'meeting': return 'event_busy';
      case 'payment': return 'check_circle';
      case 'chat_mention': return 'chat_bubble';
      default: return 'notifications';
    }
  };

  const getColorForType = (type: string) => {
    switch (type) {
      case 'announcement': return 'text-tertiary';
      case 'meeting': return 'text-error';
      case 'payment': return 'text-secondary';
      case 'chat_mention': return 'text-primary';
      default: return 'text-on-surface-variant';
    }
  };

  if (loading) return <div className="empty-state"><p>Loading notifications...</p></div>;

  return (
    <div className="min-h-screen flex flex-col">
      {/* TopAppBar */}
      <header className="w-full top-0 sticky z-50 glass-header border-b border-outline-variant flex justify-between items-center px-4 h-16">
        <div className="flex items-center gap-1 cursor-pointer active:opacity-80">
          <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center overflow-hidden">
            <span className="material-symbols-outlined text-on-primary-container" style={{fontSize: '20px'}}>account_balance</span>
          </div>
          <span className="font-title-md text-title-md font-bold text-primary">Udodiri Young Social Club</span>
        </div>
        <div className="cursor-pointer active:opacity-80 hover:bg-surface-container-high transition-colors p-2 rounded-full">
          <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
        </div>
      </header>

      <main className="w-full max-w-[1200px] flex-grow px-4 md:px-8 py-4 pb-32">
        {/* Hero / Title Section */}
        <div className="mb-6">
          <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-background mb-2">Alerts</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">Stay updated with the latest club activities and announcements.</p>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {['all', 'urgent', 'payments', 'mentions'].map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter as any)}
              className={`px-3 py-1 rounded-full font-label-caps text-label-caps whitespace-nowrap transition-all ${
                activeFilter === filter 
                  ? 'bg-primary-container text-on-primary-container' 
                  : 'bg-surface-container-high text-on-surface-variant border border-outline-variant'
              }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>

        {/* Notifications Feed */}
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="empty-state text-center py-8">
              <div className="icon text-4xl mb-2">🔔</div>
              <p className="text-on-surface-variant">No notifications yet</p>
            </div>
          ) : (
            filtered.map(n => (
              <div 
                key={n.id} 
                className={`notification-card p-3 rounded-lg flex items-start gap-3 relative overflow-hidden group cursor-pointer ${
                  n.is_read === 0 ? 'border-l-2 border-primary' : 'border border-outline-variant'
                }`}
                onClick={() => markAsRead(n.id)}
              >
                <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${
                  n.type === 'announcement' ? 'bg-tertiary-container' :
                  n.type === 'meeting' ? 'bg-error-container' :
                  n.type === 'payment' ? 'bg-secondary-container' : 'bg-surface-container-highest'
                }`}>
                  <span className={`material-symbols-outlined ${getColorForType(n.type)}`} style={{fontVariationSettings: "'FILL' 1"}}>
                    {getIconForType(n.type)}
                  </span>
                </div>
                <div className="flex-grow">
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-title-md text-title-md text-on-surface">{n.title}</p>
                    <span className="text-on-surface-variant font-body-sm text-body-sm">
                      {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mb-2">{n.message}</p>
                  {n.type === 'chat_mention' && (
                    <button className="px-2 py-1 rounded bg-surface-container-high border border-outline-variant text-on-surface-variant font-label-caps text-label-caps hover:bg-surface-bright">
                      REPLY
                    </button>
                  )}
                </div>
                {n.is_read === 0 && (
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary"></div>
                )}
              </div>
            ))
          )}
        </div>
      </main>

      {/* Bottom NavBar */}
      <nav className="fixed bottom-0 w-full z-50 bg-surface-container dark:bg-surface-container-low border-t border-surface-variant dark:border-outline-variant transition-colors">
        <div className="flex justify-around items-center h-20 w-full px-1 pb-safe">
          <div className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary transition-transform scale-95 active:scale-90 cursor-pointer">
            <span className="material-symbols-outlined">dashboard</span>
            <span className="font-label-caps text-label-caps mt-0.5">Dashboard</span>
          </div>
          <div className="flex flex-col items-center justify-center bg-secondary-container text-on-secondary-container rounded-full px-4 py-1 scale-95 active:scale-90 transition-transform cursor-pointer">
            <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>campaign</span>
            <span className="font-label-caps text-label-caps">Alerts</span>
          </div>
          <div className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary scale-95 active:scale-90 transition-transform cursor-pointer">
            <span className="material-symbols-outlined">chat</span>
            <span className="font-label-caps text-label-caps">Chat</span>
          </div>
          <div className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary scale-95 active:scale-90 transition-transform cursor-pointer">
            <span className="material-symbols-outlined">event</span>
            <span className="font-label-caps text-label-caps">Meetings</span>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Notifications;
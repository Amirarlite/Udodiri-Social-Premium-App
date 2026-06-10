import React, { useState, useEffect, useCallback } from 'react';
import api from '../hooks/api';

interface ActivityItem {
  id: string;
  user_id: string;
  user_name: string;
  action_type: string;
  action_text: string;
  created_at: string;
}

const iconMap: Record<string, string> = {
  login: 'login',
  announcement: 'campaign',
  meeting: 'event',
  calendar: 'calendar_today',
  subscription: 'star',
  financial: 'account_balance',
  chat: 'chat_bubble',
};

const Activity: React.FC = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivity = useCallback(async () => {
    try {
      const { data } = await api.get('/activity');
      setActivities(data.activities || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchActivity(); }, [fetchActivity]);

  if (loading) return <div className="empty-state"><p>Loading activity...</p></div>;

  return (
    <div className="min-h-screen flex flex-col">
      {/* TopAppBar */}
      <header className="flex justify-between items-center px-margin-mobile h-16 w-full bg-surface dark:bg-surface-dim border-b border-surface-variant dark:border-outline-variant sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-tertiary-container flex items-center justify-center overflow-hidden">
            <span className="material-symbols-outlined text-on-tertiary-container" style={{fontSize: '20px'}}>trending_up</span>
          </div>
          <span className="font-title-md text-title-md font-bold text-primary">Udodiri Young Social Club</span>
        </div>
        <div className="cursor-pointer active:opacity-80 hover:bg-surface-container-high transition-colors p-2 rounded-full">
          <span className="material-symbols-outlined text-primary">notifications</span>
        </div>
      </header>

      <main className="w-full max-w-[1200px] mx-auto mb-24 px-margin-mobile md:px-margin-desktop py-md flex-1">
        {/* Title Section */}
        <div className="mb-lg">
          <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-background mb-base">Member Activity</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">Track recent actions and engagement across the community.</p>
        </div>

        {/* Activity Feed */}
        <div className="space-y-xs">
          {activities.length === 0 && (
            <div className="flex flex-col items-center justify-center py-lg">
              <span className="material-symbols-outlined text-6xl text-on-surface-variant opacity-50">trending_up</span>
              <p className="font-body-lg text-body-lg text-on-surface-variant mt-md">No recent activity</p>
            </div>
          )}

          {activities.map((a, i) => (
            <div key={a.id} className="relative flex gap-md group">
              {/* Timeline Connector */}
              {i < activities.length - 1 && (
                <div className="absolute left-5 top-16 bottom-0 w-[1px] bg-gradient-to-b from-outline-variant to-transparent"></div>
              )}

              {/* Activity Item */}
              <div className="flex gap-md flex-1 pb-md">
                {/* Timeline Dot & Icon */}
                <div className="flex flex-col items-center flex-shrink-0 pt-xs">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary-container to-primary/60 border-2 border-surface-container flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-on-primary-container text-[20px]">
                      {iconMap[a.action_type] || 'info'}
                    </span>
                  </div>
                </div>

                {/* Activity Card */}
                <div className="flex-1 pt-xs">
                  <div className="bg-surface-container-low border border-outline-variant rounded-lg p-md group-hover:border-primary group-hover:shadow-[0_0_20px_rgba(190,30,45,0.15)] transition-all">
                    <div className="flex items-start justify-between mb-xs">
                      <h3 className="font-title-md text-title-md text-on-surface">
                        <span className="font-semibold text-primary">{a.user_name}</span>
                        <span className="text-on-surface-variant"> — {a.action_text}</span>
                      </h3>
                      <span className="font-label-caps text-label-caps text-on-surface-variant text-right">
                        {new Date(a.created_at).toLocaleDateString()} • {new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      {a.action_type.charAt(0).toUpperCase() + a.action_type.slice(1)} • {new Date(a.created_at).toRelativeTime?.() || 'just now'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* BottomNavBar */}
      <nav className="fixed bottom-0 w-full z-50 bg-surface-container dark:bg-surface-container-low border-t border-surface-variant dark:border-outline-variant flex justify-around items-center h-20 px-xs pb-safe">
        <div className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary scale-95 active:scale-90 transition-transform cursor-pointer">
          <span className="material-symbols-outlined">dashboard</span>
          <span className="font-label-caps text-label-caps">Dashboard</span>
        </div>
        <div className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary scale-95 active:scale-90 transition-transform cursor-pointer">
          <span className="material-symbols-outlined">campaign</span>
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
      </nav>
    </div>
  );
};

export default Activity;

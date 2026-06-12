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
  login: 'vpn_key',
  announcement: 'campaign',
  meeting: 'groups',
  calendar: 'event_available',
  subscription: 'verified',
  financial: 'account_balance_wallet',
  profile: 'manage_accounts'
};

const colorMap: Record<string, string> = {
  login: 'text-tertiary bg-tertiary-container/10 border-tertiary/20',
  announcement: 'text-primary bg-primary-container/10 border-primary/20',
  meeting: 'text-secondary bg-secondary-container/10 border-secondary/20',
  calendar: 'text-tertiary bg-tertiary-container/10 border-tertiary/20',
  subscription: 'text-secondary bg-secondary-container/10 border-secondary/20',
  financial: 'text-tertiary bg-tertiary-container/10 border-tertiary/20',
  profile: 'text-on-surface bg-surface-container-highest/20 border-slate-700'
};

const Activity: React.FC = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivity = useCallback(async () => {
    try {
      const { data } = await api.get('/activity');
      setActivities(data.activities || []);
    } catch (err) {
      console.error('Failed to fetch activity feed', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-[800px] mx-auto space-y-6">
      {/* Title */}
      <section className="border-b border-outline-variant pb-4">
        <h1 className="text-2xl md:text-3xl font-bold text-on-surface">Member Activity</h1>
        <p className="text-sm text-on-surface-variant mt-1.5">Real-time timeline of administrative actions, meetings, and dues audits.</p>
      </section>

      {/* Activity Timeline Feed */}
      <div className="space-y-4">
        {activities.length === 0 ? (
          <div className="glass-card rounded-xl p-12 text-center text-on-surface-variant">
            <span className="material-symbols-outlined text-5xl mb-2 text-primary">feed</span>
            <p className="text-sm font-semibold">No recent activity logs recorded.</p>
          </div>
        ) : (
          activities.map((act) => {
            const iconName = iconMap[act.action_type] || 'bookmark';
            const colorClass = colorMap[act.action_type] || 'text-on-surface bg-surface-container/10 border-outline-variant/30';
            
            return (
              <div
                key={act.id}
                className="bg-surface-container border border-slate-800 p-4 rounded-xl flex items-start gap-4 hover:bg-surface-container-high hover:border-primary/40 transition-all cursor-pointer group"
              >
                {/* Category Icon Emblem */}
                <div className={`w-11 h-11 rounded-lg border flex items-center justify-center shrink-0 ${colorClass}`}>
                  <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {iconName}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-grow min-w-0">
                  <div className="flex justify-between items-baseline flex-wrap gap-2">
                    <p className="text-sm text-on-surface font-semibold">
                      {act.user_name}{' '}
                      <span className="font-normal text-on-surface-variant">{act.action_text}</span>
                    </p>
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                      {new Date(act.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })} •{' '}
                      {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest mt-1">
                    Event Type: {act.action_type}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Activity;

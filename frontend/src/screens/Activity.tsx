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
  login: '🔑',
  announcement: '📢',
  meeting: '📋',
  calendar: '🗓️',
  subscription: '⭐',
  financial: '💰',
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
    <div>
      <h1 className="page-title">👥 Member Activity</h1>
      <div className="card">
        {activities.length === 0 && (
          <div className="empty-state">
            <div className="icon">👥</div>
            <p>No recent activity</p>
          </div>
        )}
        {activities.map(a => (
          <div key={a.id} className="activity-item">
            <div className="activity-icon">{iconMap[a.action_type] || '📌'}</div>
            <div className="activity-content">
              <div className="activity-text">
                <strong>{a.user_name}</strong> — {a.action_text}
              </div>
              <div className="activity-time">{new Date(a.created_at).toLocaleString()}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Activity;

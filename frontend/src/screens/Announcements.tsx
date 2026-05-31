import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../hooks/api';

interface Announcement {
  id: string;
  title: string;
  content: string;
  author: string;
  author_id: string;
  is_broadcast: number;
  created_at: string;
}

const Announcements: React.FC = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isBroadcast, setIsBroadcast] = useState(false);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const { data } = await api.get('/announcements');
      setAnnouncements(data.announcements || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return;
    try {
      await api.post('/announcements', { title: title.trim(), content: content.trim(), is_broadcast: isBroadcast });
      setTitle('');
      setContent('');
      setIsBroadcast(false);
      setShowForm(false);
      fetchAnnouncements();
    } catch (err: any) { alert(err.response?.data?.error || 'Failed'); }
  };

  if (loading) return <div className="empty-state"><p>Loading announcements...</p></div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>📢 Announcements</h1>
        <button className="btn-primary" style={{ width: 'auto', padding: '10px 20px' }} onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Post'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="form-group">
            <label>Title</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Announcement title" />
          </div>
          <div className="form-group">
            <label>Content</label>
            <input type="text" value={content} onChange={e => setContent(e.target.value)} placeholder="Write your announcement..." />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <input type="checkbox" checked={isBroadcast} onChange={e => setIsBroadcast(e.target.checked)} id="broadcast" />
            <label htmlFor="broadcast" style={{ marginBottom: 0 }}>Broadcast (Executive/ pinned)</label>
          </div>
          <button className="btn-primary" style={{ width: 'auto' }} onClick={handleSubmit}>Post Announcement</button>
        </div>
      )}

      <div className="channel-feed">
        {announcements.length === 0 && (
          <div className="empty-state">
            <div className="icon">📢</div>
            <p>No announcements yet. Be the first to post!</p>
          </div>
        )}
        {announcements.map(a => (
          <div key={a.id} className={`channel-announcement ${a.is_broadcast ? 'broadcast' : ''}`}>
            <div className="announcement-header">
              <div className="announcement-avatar">{a.author.charAt(0).toUpperCase()}</div>
              <div className="announcement-meta">
                <div className="announcement-author">{a.author}</div>
                <div className="announcement-time">{new Date(a.created_at).toLocaleString()}</div>
              </div>
              {a.is_broadcast && <span className="badge badge-danger">Broadcast</span>}
            </div>
            <div className="announcement-title">{a.title}</div>
            <div className="announcement-content">{a.content}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Announcements;

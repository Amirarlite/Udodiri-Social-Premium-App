import React, { useState, useEffect, useCallback } from 'react';
import api from '../hooks/api';

interface Meeting {
  id: string;
  title: string;
  attendees: string;
  google_doc_url: string | null;
  created_by: string;
  created_at: string;
  actionItems?: any[];
}

const Meetings: React.FC = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [attendees, setAttendees] = useState('');

  const fetchMeetings = useCallback(async () => {
    try {
      const { data } = await api.get('/meetings');
      setMeetings(data.meetings || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchMeetings(); }, [fetchMeetings]);

  const handleSubmit = async () => {
    if (!title.trim() || !attendees.trim()) return;
    try {
      const attendeeList = attendees.split(',').map(a => a.trim()).filter(Boolean);
      await api.post('/meetings', { title: title.trim(), attendees: attendeeList });
      setTitle(''); setAttendees(''); setShowForm(false);
      fetchMeetings();
    } catch (err: any) { alert(err.response?.data?.error || 'Failed'); }
  };

  if (loading) return <div className="empty-state"><p>Loading meetings...</p></div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>📋 Meetings</h1>
        <button className="btn-primary" style={{ width: 'auto', padding: '10px 20px' }} onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Meeting'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="form-group">
            <label>Meeting Title</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Weekly General Meeting" />
          </div>
          <div className="form-group">
            <label>Attendees (comma separated)</label>
            <input type="text" value={attendees} onChange={e => setAttendees(e.target.value)} placeholder="John, Jane, Bob" />
          </div>
          <button className="btn-primary" style={{ width: 'auto' }} onClick={handleSubmit}>Create Meeting</button>
        </div>
      )}

      {meetings.length === 0 && (
        <div className="empty-state">
          <div className="icon">📋</div>
          <p>No meetings recorded yet</p>
        </div>
      )}

      {meetings.map(m => (
        <div key={m.id} className="card">
          <div className="card-header">
            <span className="card-title">{m.title}</span>
            <span className="badge badge-primary">{new Date(m.created_at).toLocaleDateString()}</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 8 }}>
            Attendees: {m.attendees ? JSON.parse(m.attendees).join(', ') : '—'}
          </p>
          {m.google_doc_url && (
            <a href={m.google_doc_url} target="_blank" rel="noopener" style={{ color: 'var(--primary)', fontSize: '0.85rem' }}>
              📄 View Google Doc
            </a>
          )}
        </div>
      ))}
    </div>
  );
};

export default Meetings;

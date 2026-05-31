import React, { useState, useEffect, useCallback } from 'react';
import api from '../hooks/api';

interface CalendarEvent {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  location: string | null;
  description: string | null;
  attendees: string | null;
  created_at: string;
}

const Calendar: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  const fetchEvents = useCallback(async () => {
    try {
      const { data } = await api.get('/calendar');
      setEvents(data.events || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const handleSubmit = async () => {
    if (!title.trim() || !startDate || !endDate) return;
    try {
      await api.post('/calendar', {
        title: title.trim(),
        startDate,
        endDate,
        location: location.trim() || null,
        description: description.trim() || null,
      });
      setTitle(''); setStartDate(''); setEndDate(''); setLocation(''); setDescription('');
      setShowForm(false);
      fetchEvents();
    } catch (err: any) { alert(err.response?.data?.error || 'Failed'); }
  };

  if (loading) return <div className="empty-state"><p>Loading events...</p></div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>🗓️ Calendar</h1>
        <button className="btn-primary" style={{ width: 'auto', padding: '10px 20px' }} onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Event'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="form-group">
            <label>Event Title</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Event name" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label>Start Date & Time</label>
              <input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="form-group">
              <label>End Date & Time</label>
              <input type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label>Location</label>
            <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="Where?" />
          </div>
          <div className="form-group">
            <label>Description</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Details..." />
          </div>
          <button className="btn-primary" style={{ width: 'auto' }} onClick={handleSubmit}>Create Event</button>
        </div>
      )}

      {events.length === 0 && (
        <div className="empty-state">
          <div className="icon">🗓️</div>
          <p>No events scheduled</p>
        </div>
      )}

      {events.map(e => {
        const isPast = new Date(e.end_date) < new Date();
        return (
          <div key={e.id} className="card" style={{ opacity: isPast ? 0.6 : 1 }}>
            <div className="card-header">
              <span className="card-title">{e.title}</span>
              <span className={`badge ${isPast ? 'badge-warning' : 'badge-success'}`}>
                {isPast ? 'Past' : 'Upcoming'}
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 4 }}>
              📅 {new Date(e.start_date).toLocaleString()} — {new Date(e.end_date).toLocaleString()}
            </p>
            {e.location && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 4 }}>📍 {e.location}</p>}
            {e.description && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>📝 {e.description}</p>}
          </div>
        );
      })}
    </div>
  );
};

export default Calendar;

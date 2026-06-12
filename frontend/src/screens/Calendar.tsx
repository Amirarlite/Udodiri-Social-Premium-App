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
}

const Calendar: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  const fetchEvents = useCallback(async () => {
    try {
      const { data } = await api.get('/calendar');
      setEvents(data.events || []);
    } catch (err) {
      console.error('Failed to fetch calendar events', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startDate || !endDate) return;
    try {
      await api.post('/calendar', {
        title: title.trim(),
        startDate,
        endDate,
        location: location.trim() || null,
        description: description.trim() || null
      });
      setTitle('');
      setStartDate('');
      setEndDate('');
      setLocation('');
      setDescription('');
      setShowForm(false);
      fetchEvents();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create event');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await api.delete(`/calendar/${id}`);
      fetchEvents();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete event');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Pre-calculated dates for December 2024 to match mockup style
  const daysOfDec24 = [
    { num: 26, isPrev: true }, { num: 27, isPrev: true }, { num: 28, isPrev: true }, { num: 29, isPrev: true }, { num: 30, isPrev: true },
    { num: 1 }, { num: 2 }, { num: 3 }, { num: 4 }, { num: 5, active: true }, { num: 6 }, { num: 7 },
    { num: 8, dot: 'primary' }, { num: 9 }, { num: 10 }, { num: 11 }, { num: 12 }, { num: 13 }, { num: 14, dot: 'tertiary' },
    { num: 15 }, { num: 16 }, { num: 17 }, { num: 18 }, { num: 19 }, { num: 20, dot: 'secondary' }, { num: 21 },
    { num: 22 }, { num: 23 }, { num: 24 }, { num: 25 }, { num: 26 }, { num: 27 }, { num: 28 }, { num: 29 }, { num: 30 }
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Title & Trigger Button */}
      <section className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-outline-variant pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-on-surface">Club Calendar</h1>
          <p className="text-sm text-on-surface-variant mt-1.5">Schedule and discover upcoming gatherings and community workshops.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary-custom flex items-center gap-1.5 py-2.5 px-5 text-xs tracking-wider uppercase"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          New Event
        </button>
      </section>

      {/* New Event Form Overlay */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card max-w-[500px] w-full rounded-xl p-6 border border-outline-variant shadow-2xl">
            <h3 className="text-lg font-bold text-on-surface mb-4">Create New Calendar Event</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Event Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Annual Charity Dinner"
                  required
                  className="w-full bg-surface-container-highest border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary focus:ring-0 outline-none text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    required
                    className="w-full bg-surface-container-highest border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface focus:border-primary focus:ring-0 outline-none text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">End Date & Time</label>
                  <input
                    type="datetime-local"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    required
                    className="w-full bg-surface-container-highest border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface focus:border-primary focus:ring-0 outline-none text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="e.g. Royal Pavilion or Zoom Link"
                  className="w-full bg-surface-container-highest border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary focus:ring-0 outline-none text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Event details and instructions..."
                  className="w-full bg-surface-container-highest border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary focus:ring-0 outline-none text-sm"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider text-on-surface-variant hover:bg-surface-container-high transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-primary-container text-on-primary-container px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:brightness-110 transition-all"
                >
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grid: Calendar Grid & Dynamic Event Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Calendar Grid Display (col-span-5) */}
        <div className="lg:col-span-5">
          <div className="bg-surface-container-low rounded-2xl border border-outline-variant p-5 overflow-hidden shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-bold text-on-surface">December 2024</h2>
              <div className="flex gap-2">
                <button className="material-symbols-outlined p-1.5 hover:bg-surface-container-high rounded transition-colors text-sm">chevron_left</button>
                <button className="material-symbols-outlined p-1.5 hover:bg-surface-container-high rounded transition-colors text-sm">chevron_right</button>
              </div>
            </div>
            
            {/* Week Headers */}
            <div className="grid grid-cols-7 text-center mb-2 font-bold text-xs text-on-surface-variant">
              <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
            </div>
            
            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-y-2 text-center text-xs">
              {daysOfDec24.map((day, idx) => (
                <div
                  key={idx}
                  className={`p-2 relative flex items-center justify-center font-bold h-8 w-8 mx-auto rounded-lg ${
                    day.isPrev ? 'text-on-surface-variant opacity-25' : 'text-on-surface'
                  } ${day.active ? 'text-primary border border-primary-container bg-primary-container/10' : ''}`}
                >
                  {day.num}
                  {day.dot && (
                    <span className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${
                      day.dot === 'primary' ? 'bg-primary' : day.dot === 'tertiary' ? 'bg-tertiary' : 'bg-secondary'
                    }`}></span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dynamic Events Cards List (col-span-7) */}
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest px-1">Upcoming Events List</h2>
          
          {events.length === 0 ? (
            <div className="glass-card rounded-xl p-12 text-center text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl mb-2 text-primary">calendar_today</span>
              <p className="text-sm font-semibold">No custom calendar events scheduled.</p>
            </div>
          ) : (
            events.map((evt, index) => {
              const date = new Date(evt.start_date);
              const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
              const isGala = evt.title.toLowerCase().includes('gala');
              
              // Featured Gala Layout
              if (isGala) {
                return (
                  <div key={evt.id} className="group relative bg-surface-container border border-outline-variant overflow-hidden rounded-xl transition-colors hover:border-primary">
                    <div className="h-32 w-full overflow-hidden relative">
                      <img
                        alt="Gala Cover"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        src="https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=600&q=80"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-surface-container via-transparent to-transparent"></div>
                    </div>
                    
                    <div className="p-5 pt-0 relative z-10 -mt-8">
                      <div className="bg-primary-container text-on-primary-container inline-flex flex-col items-center px-4 py-2 rounded-lg mb-3 shadow-xl border border-primary/20">
                        <span className="text-[10px] font-bold tracking-wider">{months[date.getMonth()]}</span>
                        <span className="text-lg font-bold">{date.getDate().toString().padStart(2, '0')}</span>
                      </div>
                      
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="material-symbols-outlined text-xs text-tertiary">celebration</span>
                        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">End of Year Celebration</span>
                      </div>
                      
                      <div className="flex justify-between items-start">
                        <h3 className="text-base font-bold text-on-surface mb-2">{evt.title}</h3>
                        <button
                          onClick={() => handleDelete(evt.id)}
                          className="material-symbols-outlined text-sm text-on-surface-variant hover:text-primary transition-colors"
                        >
                          delete
                        </button>
                      </div>
                      
                      <p className="text-xs text-on-surface-variant mb-4 leading-relaxed">{evt.description}</p>
                      
                      <div className="flex justify-between items-center flex-wrap gap-2 pt-2 border-t border-outline-variant">
                        <div className="flex items-center gap-4 text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">
                          <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">schedule</span>{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">location_on</span>{evt.location}</span>
                        </div>
                        <button
                          onClick={() => alert('RSVP successful! Ticket reference saved.')}
                          className="bg-primary-container hover:brightness-110 text-on-primary-container text-[10px] font-bold px-3.5 py-1.5 rounded uppercase transition-all"
                        >
                          RSVP NOW
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              // Standard Event Card Layout
              return (
                <div
                  key={evt.id}
                  className="bg-surface-container rounded-xl border border-outline-variant p-4 flex gap-4 hover:bg-surface-container-high transition-colors relative"
                >
                  <div className={`flex flex-col items-center justify-center min-w-[64px] rounded-lg py-2 border ${
                    index % 2 === 0
                      ? 'bg-primary-container text-on-primary-container border-primary/20'
                      : 'bg-secondary-container text-on-secondary-container border-secondary/20'
                  }`}>
                    <span className="text-[10px] font-bold uppercase tracking-wider">{months[date.getMonth()]}</span>
                    <span className="text-base font-bold">{date.getDate().toString().padStart(2, '0')}</span>
                  </div>
                  
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="material-symbols-outlined text-xs text-primary">groups</span>
                      <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest">General Meeting</span>
                    </div>
                    <h3 className="text-sm font-bold text-on-surface mb-2 truncate">{evt.title}</h3>
                    
                    <div className="flex items-center gap-4 text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">schedule</span>{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {evt.location && (
                        <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">location_on</span>{evt.location}</span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(evt.id)}
                    className="material-symbols-outlined text-sm text-on-surface-variant hover:text-primary transition-colors absolute top-4 right-4"
                  >
                    delete
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Calendar;

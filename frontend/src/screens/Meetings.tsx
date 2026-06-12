import React, { useState, useEffect, useCallback } from 'react';
import api from '../hooks/api';

interface Meeting {
  id: string;
  title: string;
  attendees: string;
  google_doc_url: string | null;
  created_by: string;
  created_at: string;
  actionItems?: ActionItem[];
}

interface ActionItem {
  id: string;
  meeting_id: string;
  description: string;
  responsible_person: string;
  due_date: string;
  status: string;
}

interface MeetingsProps {
  onNavigate: (page: string) => void;
}

const Meetings: React.FC<MeetingsProps> = ({ onNavigate }) => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Forms states
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingAttendees, setMeetingAttendees] = useState('');
  const [meetingDocUrl, setMeetingDocUrl] = useState('');

  const [showActionForm, setShowActionForm] = useState(false);
  const [selectedMeetingId, setSelectedMeetingId] = useState('');
  const [actionDesc, setActionDesc] = useState('');
  const [responsible, setResponsible] = useState('');
  const [dueDate, setDueDate] = useState('');

  const fetchMeetings = useCallback(async () => {
    try {
      const { data } = await api.get('/meetings');
      const allMeetings = data.meetings || [];
      setMeetings(allMeetings);

      // Aggregate all action items
      const items: ActionItem[] = [];
      allMeetings.forEach((m: Meeting) => {
        if (m.actionItems && m.actionItems.length > 0) {
          items.push(...m.actionItems);
        }
      });
      setActionItems(items);
    } catch (err) {
      console.error('Failed to fetch meetings', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingTitle.trim() || !meetingAttendees.trim()) return;
    try {
      const attendeeList = meetingAttendees.split(',').map(a => a.trim()).filter(Boolean);
      await api.post('/meetings', {
        title: meetingTitle.trim(),
        attendees: attendeeList,
        googleDocUrl: meetingDocUrl.trim() || null
      });
      setMeetingTitle('');
      setMeetingAttendees('');
      setMeetingDocUrl('');
      setShowMeetingForm(false);
      fetchMeetings();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create meeting');
    }
  };

  const handleCreateActionItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionDesc.trim() || !responsible.trim() || !dueDate || !selectedMeetingId) {
      alert('Please fill out all action item fields');
      return;
    }
    try {
      await api.post(`/meetings/${selectedMeetingId}/action-items`, {
        description: actionDesc.trim(),
        responsiblePerson: responsible.trim(),
        dueDate
      });
      setActionDesc('');
      setResponsible('');
      setDueDate('');
      setShowActionForm(false);
      fetchMeetings();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to add action item');
    }
  };

  const handleToggleActionStatus = async (id: string, currentStatus: string) => {
    // Simulated checkbox toggling for local state
    setActionItems(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, status: currentStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED' }
          : item
      )
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const pendingActionsCount = actionItems.filter(item => item.status !== 'COMPLETED').length;

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <section className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-outline-variant pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-on-surface">Club Meetings & Minutes</h1>
          <p className="text-sm text-on-surface-variant mt-1.5">Stay updated with the club's legacy notes and future action items.</p>
        </div>
        <button
          onClick={() => setShowMeetingForm(true)}
          className="btn-primary-custom flex items-center gap-1.5 py-2.5 px-5 text-xs tracking-wider uppercase"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          New Meeting
        </button>
      </section>

      {/* Expandable New Meeting Form */}
      {showMeetingForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card max-w-[500px] w-full rounded-xl p-6 border border-outline-variant shadow-2xl">
            <h3 className="text-lg font-bold text-on-surface mb-4 font-sans">Record New Meeting Minutes</h3>
            <form onSubmit={handleCreateMeeting} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Meeting Title</label>
                <input
                  type="text"
                  value={meetingTitle}
                  onChange={e => setMeetingTitle(e.target.value)}
                  placeholder="e.g. Executive Board Summit"
                  required
                  className="w-full bg-surface-container-highest border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary focus:ring-0 outline-none text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Attendees (comma separated)</label>
                <input
                  type="text"
                  value={meetingAttendees}
                  onChange={e => setMeetingAttendees(e.target.value)}
                  placeholder="John Doe, Chief Bello, Obi Nwosu"
                  required
                  className="w-full bg-surface-container-highest border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary focus:ring-0 outline-none text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Google Doc URL (Optional)</label>
                <input
                  type="url"
                  value={meetingDocUrl}
                  onChange={e => setMeetingDocUrl(e.target.value)}
                  placeholder="https://docs.google.com/..."
                  className="w-full bg-surface-container-highest border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary focus:ring-0 outline-none text-sm"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowMeetingForm(false)}
                  className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider text-on-surface-variant hover:bg-surface-container-high transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-primary-container text-on-primary-container px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:brightness-110 transition-all"
                >
                  Save Meeting
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expandable Action Item Form */}
      {showActionForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card max-w-[500px] w-full rounded-xl p-6 border border-outline-variant shadow-2xl">
            <h3 className="text-lg font-bold text-on-surface mb-4">Assign New Action Item</h3>
            <form onSubmit={handleCreateActionItem} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Associated Meeting</label>
                <select
                  value={selectedMeetingId}
                  onChange={e => setSelectedMeetingId(e.target.value)}
                  required
                  className="w-full bg-surface-container-highest border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface focus:border-primary focus:ring-0 outline-none text-sm"
                >
                  <option value="">Select meeting reference</option>
                  {meetings.map(m => (
                    <option key={m.id} value={m.id}>{m.title}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Task Description</label>
                <input
                  type="text"
                  value={actionDesc}
                  onChange={e => setActionDesc(e.target.value)}
                  placeholder="e.g. Update the treasury spreadsheet"
                  required
                  className="w-full bg-surface-container-highest border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary focus:ring-0 outline-none text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Responsible Person</label>
                <input
                  type="text"
                  value={responsible}
                  onChange={e => setResponsible(e.target.value)}
                  placeholder="e.g. Secretary Bello"
                  required
                  className="w-full bg-surface-container-highest border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary focus:ring-0 outline-none text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  required
                  className="w-full bg-surface-container-highest border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface focus:border-primary focus:ring-0 outline-none text-sm"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowActionForm(false)}
                  className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider text-on-surface-variant hover:bg-surface-container-high transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-primary-container text-on-primary-container px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:brightness-110 transition-all"
                >
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upcoming Summon / Highlights Bento Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Upcoming Strategy Summon</h3>
          <span className="text-primary text-xs font-bold hover:underline cursor-pointer" onClick={() => onNavigate('calendar')}>
            View Calendar
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Summon Card 1 */}
          <div className="glass-card rounded-xl p-6 transition-all hover:border-primary/50 flex flex-col justify-between min-h-[190px]">
            <div>
              <span className="text-[10px] font-bold text-tertiary uppercase tracking-wider">SAT, OCT 12 • 4:00 PM</span>
              <h4 className="text-base font-bold text-on-surface mt-1">Quarterly Strategy Summit</h4>
              <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
                Reviewing Q3 fiscal audits, selecting committee chairs, and setting HORIZONS 2025 outreach agendas.
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-slate-800/80 pt-3">
              <span className="text-[10px] font-bold text-on-surface-variant bg-surface-container px-2.5 py-1 rounded-full border border-outline-variant">
                📍 MAIN HALL
              </span>
              <button
                onClick={() => alert('RSVP Saved! Thank you for confirming.')}
                className="bg-primary-container hover:brightness-110 text-on-primary-container text-[10px] font-bold px-3 py-1.5 rounded uppercase transition-all"
              >
                RSVP FOR MEETING
              </button>
            </div>
          </div>

          {/* Summon Card 2 */}
          <div className="glass-card rounded-xl p-6 transition-all hover:border-primary/50 flex flex-col justify-between min-h-[190px]">
            <div>
              <span className="text-[10px] font-bold text-tertiary uppercase tracking-wider">WED, OCT 25 • 7:00 PM</span>
              <h4 className="text-base font-bold text-on-surface mt-1">Tech-Innovation Workshop</h4>
              <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
                Modernizing portal utilities, configuring custom notification workflows, and training members on digital Dues tracking.
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-slate-800/80 pt-3">
              <span className="text-[10px] font-bold text-on-surface-variant bg-surface-container px-2.5 py-1 rounded-full border border-outline-variant">
                💻 ZOOM CONFERENCE
              </span>
              <button
                onClick={() => alert('Event added to device calendar')}
                className="border border-outline-variant hover:border-primary text-on-surface text-[10px] font-bold px-3 py-1.5 rounded uppercase transition-all"
              >
                ADD TO CALENDAR
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Asymmetric Past Meetings & Open Action Items Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Past Minutes (1/3 width) */}
        <section className="lg:col-span-1 space-y-4">
          <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Past Minutes Archive</h3>
          
          <div className="space-y-2">
            {meetings.length === 0 ? (
              <div className="bg-surface-container-low border border-slate-800 p-8 rounded-xl text-center text-on-surface-variant text-xs">
                No past meeting minutes archived.
              </div>
            ) : (
              meetings.map(m => {
                const date = new Date(m.created_at);
                const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
                return (
                  <div
                    key={m.id}
                    className="glass-card rounded-xl p-4 flex items-center gap-4 hover:bg-surface-container-high cursor-pointer transition-colors border-slate-800"
                  >
                    <div className="h-11 w-11 bg-surface-container-highest rounded-lg flex flex-col items-center justify-center shrink-0 border border-outline-variant">
                      <span className="text-[9px] font-bold text-primary">{months[date.getMonth()]}</span>
                      <span className="text-sm font-bold text-on-surface">{date.getDate().toString().padStart(2, '0')}</span>
                    </div>
                    
                    <div className="flex-grow min-w-0">
                      <h5 className="text-xs font-bold text-on-surface truncate leading-tight">{m.title}</h5>
                      <div className="flex gap-2.5 mt-1.5 flex-wrap">
                        {m.google_doc_url && (
                          <a
                            href={m.google_doc_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[9px] font-bold text-primary flex items-center gap-0.5 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="material-symbols-outlined text-[10px]">description</span> Doc
                          </a>
                        )}
                        <span className="text-[9px] font-bold text-tertiary flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-[10px]">groups</span> {m.actionItems?.length || 0} tasks
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Action Items Checklist (2/3 width) */}
        <section className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">My Assigned Actions</h3>
            <button
              onClick={() => {
                if (meetings.length === 0) {
                  alert('You must record at least one meeting before assigning action items!');
                  return;
                }
                setShowActionForm(true);
              }}
              className="text-primary font-bold text-xs hover:underline tracking-wider"
            >
              + ASSIGN TASK
            </button>
          </div>

          <div className="glass-card rounded-xl overflow-hidden border border-outline-variant">
            <div className="bg-surface-container-high px-4 py-3 border-b border-outline-variant flex justify-between items-center">
              <span className="text-xs font-bold text-on-surface">Action Tracker</span>
              <span className="bg-tertiary text-on-tertiary text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                {pendingActionsCount} Pending
              </span>
            </div>

            <div className="divide-y divide-outline-variant">
              {actionItems.length === 0 ? (
                <div className="p-8 text-center text-on-surface-variant text-xs">
                  No action items assigned. Use "+ ASSIGN TASK" above.
                </div>
              ) : (
                actionItems.map(item => {
                  const isCompleted = item.status === 'COMPLETED';
                  return (
                    <label
                      key={item.id}
                      className="flex items-start gap-4 px-4 py-3.5 cursor-pointer hover:bg-surface-container transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={isCompleted}
                        onChange={() => handleToggleActionStatus(item.id, item.status)}
                        className="w-5 h-5 rounded border-outline-variant bg-transparent text-primary focus:ring-0 mt-0.5"
                      />
                      <div className="flex-grow">
                        <p className={`text-sm ${isCompleted ? 'line-through text-on-surface-variant' : 'text-on-surface font-medium'}`}>
                          {item.description}
                        </p>
                        <div className="flex gap-4 mt-1.5 text-on-surface-variant text-[10px] font-semibold">
                          <span className="flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[12px]">person</span> {item.responsible_person}
                          </span>
                          <span className="flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[12px]">calendar_today</span> Due: {item.due_date}
                          </span>
                        </div>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Meetings;

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
  const [activeFilter, setActiveFilter] = useState('all');

  const fetchAnnouncements = useCallback(async () => {
    try {
      const { data } = await api.get('/announcements');
      setAnnouncements(data.announcements || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    try {
      await api.post('/announcements', {
        title: title.trim(),
        content: content.trim(),
        is_broadcast: isBroadcast ? 1 : 0
      });
      setTitle('');
      setContent('');
      setIsBroadcast(false);
      setShowForm(false);
      fetchAnnouncements();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to post announcement');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await api.delete(`/announcements/${id}`);
      fetchAnnouncements();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete');
    }
  };

  // Filter announcements
  const filtered = announcements.filter(a => {
    if (activeFilter === 'urgent') return a.is_broadcast === 1;
    if (activeFilter === 'payments') return a.title.toLowerCase().includes('due') || a.content.toLowerCase().includes('pay') || a.content.toLowerCase().includes('fee');
    return true; // 'all'
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Title & Add Button */}
      <div className="flex justify-between items-center border-b border-outline-variant pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-on-surface">Club Announcements</h1>
          <p className="text-sm text-on-surface-variant mt-1">Stay updated with the latest news and broadcasts from the board.</p>
        </div>
        
        {/* Toggle Form Button (Only members can post, executives/admins can broadcast) */}
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary-custom flex items-center gap-1.5 py-2.5 px-4 text-xs tracking-wider uppercase"
        >
          <span className="material-symbols-outlined text-sm">{showForm ? 'close' : 'add'}</span>
          {showForm ? 'Cancel' : 'New Post'}
        </button>
      </div>

      {/* Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 shrink-0">
        {['all', 'urgent', 'payments'].map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all border ${
              activeFilter === filter
                ? 'bg-primary-container text-on-primary-container border-primary'
                : 'bg-surface-container-high text-on-surface-variant border-outline-variant hover:bg-surface-bright'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Creation Modal Overlay */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card max-w-[500px] w-full rounded-xl p-6 border border-outline-variant shadow-2xl">
            <h3 className="text-lg font-bold text-on-surface mb-4">Post New Announcement</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Enter announcement title"
                  required
                  className="w-full bg-surface-container-highest border border-outline-variant rounded-lg px-4 py-2 text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary focus:ring-0 outline-none text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Content</label>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Write announcement body..."
                  required
                  rows={4}
                  className="w-full bg-surface-container-highest border border-outline-variant rounded-lg px-4 py-2 text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary focus:ring-0 outline-none text-sm resize-none"
                />
              </div>

              {/* Broadcast toggle - only Execs / Admins can set broadcast */}
              {(user?.role === 'Admin' || user?.role === 'Executive') && (
                <label className="flex items-center gap-2.5 cursor-pointer py-1">
                  <input
                    type="checkbox"
                    checked={isBroadcast}
                    onChange={e => setIsBroadcast(e.target.checked)}
                    className="w-4 h-4 rounded border-outline-variant bg-transparent text-primary focus:ring-0"
                  />
                  <span className="text-xs font-semibold text-on-surface-variant">
                    Broadcast Announcement (Pin to top, mark as Urgent)
                  </span>
                </label>
              )}

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
                  Publish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grid of Announcements */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {filtered.length === 0 ? (
          <div className="col-span-12 glass-card rounded-xl p-12 text-center text-on-surface-variant">
            <span className="material-symbols-outlined text-5xl mb-2 text-primary">campaign</span>
            <p className="text-sm">No announcements matching the filters found.</p>
          </div>
        ) : (
          filtered.map((ann, idx) => {
            const isFeatured = idx === 0 && activeFilter === 'all';
            const isUrgent = ann.is_broadcast === 1;
            
            return (
              <article
                key={ann.id}
                className={`transition-all duration-300 border rounded-xl p-6 flex flex-col justify-between hover:border-primary/50 relative overflow-hidden group ${
                  isFeatured ? 'md:col-span-8 bg-surface-container-low' : 'md:col-span-4 bg-surface-container-low'
                } ${
                  isUrgent
                    ? 'border-l-4 border-l-primary border-slate-800 bg-gradient-to-tr from-surface-container-low to-primary/5 shadow-md shadow-primary/5'
                    : 'border-slate-800'
                }`}
              >
                {/* Background Icon Detail for Pinned */}
                {isUrgent && (
                  <div className="absolute top-2 right-2 opacity-5 group-hover:opacity-15 transition-opacity pointer-events-none">
                    <span className="material-symbols-outlined text-8xl text-primary">campaign</span>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2">
                      {isUrgent && (
                        <span className="bg-primary-container text-on-primary-container text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded">
                          Urgent
                        </span>
                      )}
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                        {new Date(ann.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>

                    {/* Delete Option (Admin Only or author) */}
                    {(user?.role === 'Admin' || user?.id === ann.author_id) && (
                      <button
                        onClick={() => handleDelete(ann.id)}
                        className="material-symbols-outlined text-sm text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                      >
                        delete
                      </button>
                    )}
                  </div>

                  <div>
                    <h3 className={`font-bold tracking-wide mb-2 ${isUrgent ? 'text-primary' : 'text-on-surface'} ${isFeatured ? 'text-xl' : 'text-base'}`}>
                      {ann.title}
                    </h3>
                    <p className={`text-on-surface-variant leading-relaxed text-sm ${isFeatured ? 'line-clamp-none' : 'line-clamp-4'}`}>
                      {ann.content}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-secondary-container flex items-center justify-center text-[10px] font-bold text-on-secondary-container border border-outline-variant">
                      {ann.author.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-semibold text-on-surface-variant">By {ann.author}</span>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Announcements;

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
  // Likes info per announcement: { [id]: { count: number, liked: boolean } }
  const [likesInfo, setLikesInfo] = useState<Record<string, { count: number; liked: boolean }>>({});

  const fetchAnnouncements = useCallback(async () => {
    try {
      const { data } = await api.get('/announcements');
      setAnnouncements(data.announcements || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  // Fetch likes for each announcement when the list updates
  useEffect(() => {
    if (!announcements.length) return;
    const fetchLikes = async () => {
      const info: Record<string, { count: number; liked: boolean }> = {};
      await Promise.all(
        announcements.map(async (a) => {
          try {
            const { data } = await api.get(`/announcements/${a.id}/likes`);
            info[a.id] = { count: data.count ?? 0, liked: !!data.liked };
          } catch (e) {
            console.error('Failed to fetch likes for', a.id, e);
          }
        })
      );
      setLikesInfo(info);
    };
    fetchLikes();
  }, [announcements]);

  // Micro-interactions and animations
  useEffect(() => {
    const addCardHoverEffects = () => {
      document.querySelectorAll('article').forEach(card => {
        card.addEventListener('mouseenter', () => {
          if (!card.classList.contains('hover:shadow-lg')) return; // Only interactive cards
          card.style.transition = 'all 0.3s ease';
        });
        card.addEventListener('mouseleave', () => {
          card.style.transition = '';
        });
      });
    };

    // FAB pulse effect
    const addFabPulse = () => {
      const fab = document.querySelector('button.fixed.right-6');
      if (fab) {
        const pulseInterval = setInterval(() => {
          fab.classList.add('shadow-[0_0_20px_rgba(190,30,45,0.6)]');
          setTimeout(() => {
            fab.classList.remove('shadow-[0_0_20px_rgba(190,30,45,0.6)]');
          }, 1000);
        }, 3000);
        return () => clearInterval(pulseInterval);
      }
    };

    addCardHoverEffects();
    return addFabPulse();
  }, [showForm]);

  const toggleLike = async (announcementId: string) => {
    const current = likesInfo[announcementId];
    if (!current) return;
    try {
      if (current.liked) {
        await api.delete(`/announcements/${announcementId}/like`);
      } else {
        await api.post(`/announcements/${announcementId}/like`);
      }
      // Refresh like info for this announcement
      const { data } = await api.get(`/announcements/${announcementId}/likes`);
      setLikesInfo(prev => ({ ...prev, [announcementId]: { count: data.count ?? 0, liked: !!data.liked } }));
    } catch (e) {
      console.error('Error toggling like for', announcementId, e);
    }
  };

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
    <div className="min-h-screen flex flex-col">
      {/* TopAppBar */}
      <header className="bg-surface dark:bg-surface-dim border-b border-surface-variant dark:border-outline-variant w-full top-0 sticky z-50 flex justify-between items-center px-4 h-16 transition-colors">
        <div className="flex items-center gap-2 cursor-pointer active:opacity-80">
          <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center overflow-hidden">
            <span className="material-symbols-outlined text-on-primary-container" style={{fontSize: '20px'}}>account_balance</span>
          </div>
          <span className="font-title-md text-title-md font-bold text-primary">Udodiri Young Social Club</span>
        </div>
        <div className="cursor-pointer active:opacity-80 hover:bg-surface-container-high transition-colors p-2 rounded-full">
          <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
        </div>
      </header>

      <main className="flex-grow max-w-[1200px] mx-auto w-full px-margin-mobile md:px-margin-desktop py-md pb-32">
        {/* Screen Title Section */}
        <div className="mb-lg">
          <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">Club Announcements</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-base">Stay updated with the latest news and activities from the board.</p>
        </div>

        {/* Bento Grid Feed */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-md">
          {/* Featured Announcement */}
          {announcements.slice(0, 1).map(a => (
            <article 
              key={a.id} 
              className="md:col-span-8 bg-surface-container-low border border-slate-800 rounded-xl p-md flex flex-col justify-between relative overflow-hidden group transition-all duration-300 hover:shadow-lg hover:border-primary"
            >
              <div className="absolute top-0 right-0 p-md opacity-20 group-hover:opacity-100 transition-opacity">
                <span className="material-symbols-outlined text-primary text-6xl" data-icon="campaign">campaign</span>
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-xs mb-sm">
                  <span className="bg-primary-container text-on-primary-container font-label-caps text-label-caps px-2 py-0.5 rounded uppercase">Urgent</span>
                  <span className="font-label-caps text-label-caps text-on-surface-variant">{new Date(a.created_at).toLocaleDateString()}</span>
                </div>
                <h3 className="font-title-md text-title-md text-primary mb-sm">{a.title}</h3>
                <p className="font-body-lg text-body-lg text-on-surface mb-md line-clamp-3 md:line-clamp-none">{a.content}</p>
              </div>
              <div className="flex items-center justify-between mt-auto pt-md border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-[10px] font-bold text-on-secondary-container">
                    {a.author.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="font-label-caps text-label-caps text-on-surface-variant">By {a.author}</span>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); toggleLike(a.id); }}
                  className="text-primary font-label-caps text-label-caps hover:underline cursor-pointer flex items-center gap-1"
                  title={likesInfo[a.id]?.liked ? 'Unlike' : 'Like'}
                >
                  <span className="material-symbols-outlined text-sm" style={{fontVariationSettings: "'FILL' " + (likesInfo[a.id]?.liked ? 1 : 0)}}>thumb_up</span>
                  <span>{likesInfo[a.id]?.count ?? 0}</span>
                </button>
              </div>
            </article>
          ))}

          {/* Side Cards - First 2 */}
          {announcements.slice(1, 3).map(a => (
            <article 
              key={a.id} 
              className="md:col-span-4 bg-surface-container-low border border-slate-800 rounded-xl p-md flex flex-col transition-all duration-300 hover:shadow-lg hover:border-primary"
            >
              <div className="font-label-caps text-label-caps text-on-surface-variant mb-xs">
                {new Date(a.created_at).toLocaleDateString()}
              </div>
              <h3 className="font-title-md text-title-md text-on-surface mb-xs">{a.title}</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant mb-md flex-grow">{a.content}</p>
              <div className="flex items-center justify-between mt-auto">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-tertiary text-sm">person</span>
                  <span className="font-label-caps text-label-caps text-on-surface-variant">{a.author}</span>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); toggleLike(a.id); }}
                  className="flex items-center gap-1 text-sm text-primary hover:opacity-70 transition-opacity"
                  title={likesInfo[a.id]?.liked ? 'Unlike' : 'Like'}
                >
                  <span className="material-symbols-outlined text-sm" style={{fontVariationSettings: "'FILL' " + (likesInfo[a.id]?.liked ? 1 : 0)}}>thumb_up</span>
                  <span>{likesInfo[a.id]?.count ?? 0}</span>
                </button>
              </div>
            </article>
          ))}

          {/* Side Card 3 - Featured Utility */}
          {announcements.slice(3, 4).map(a => (
            <article 
              key={a.id} 
              className="md:col-span-4 bg-primary-container rounded-xl p-md flex flex-col justify-center items-center text-center border border-primary transition-all duration-300 hover:shadow-lg"
            >
              <span className="material-symbols-outlined text-white text-3xl mb-xs">event_available</span>
              <h3 className="font-title-md text-title-md text-white">{a.title}</h3>
              <p className="font-body-sm text-body-sm text-white/80">{a.content.substring(0, 50)}...</p>
              <button 
                onClick={e => { e.stopPropagation(); toggleLike(a.id); }}
                className="mt-md bg-white text-primary-container font-label-caps text-label-caps px-md py-xs rounded-full hover:bg-slate-100 transition-colors"
              >
                {likesInfo[a.id]?.liked ? 'LIKED' : 'LIKE THIS'}
              </button>
            </article>
          ))}

          {/* Bottom Long Card */}
          {announcements.slice(4, 5).map(a => (
            <article 
              key={a.id} 
              className="md:col-span-12 bg-surface-container-low border border-slate-800 rounded-xl p-md flex flex-col md:flex-row md:items-center gap-md transition-all duration-300 hover:shadow-lg hover:border-primary"
            >
              <div className="w-full md:w-32 h-24 rounded-lg bg-surface-container-high overflow-hidden shrink-0">
                <div className="w-full h-full bg-gradient-to-br from-primary-container/30 to-secondary-container/30 flex items-center justify-center">
                  <span className="material-symbols-outlined text-4xl text-primary/20">description</span>
                </div>
              </div>
              <div className="flex-grow">
                <div className="font-label-caps text-label-caps text-on-surface-variant mb-xs">
                  {new Date(a.created_at).toLocaleDateString()}
                </div>
                <h3 className="font-title-md text-title-md text-on-surface mb-xs">{a.title}</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">{a.content}</p>
              </div>
              <div className="shrink-0 flex md:flex-col items-center md:items-end justify-between md:justify-center gap-xs">
                <span className="font-label-caps text-label-caps text-on-surface-variant">{a.author}</span>
                <button
                  onClick={e => { e.stopPropagation(); toggleLike(a.id); }}
                  className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors text-lg"
                  style={{fontVariationSettings: "'FILL' " + (likesInfo[a.id]?.liked ? 1 : 0)}}
                >
                  thumb_up
                </button>
              </div>
            </article>
          ))}

          {/* Show remaining announcements in a simple grid */}
          {announcements.slice(5).map(a => (
            <article 
              key={a.id} 
              className="md:col-span-4 bg-surface-container-low border border-slate-800 rounded-xl p-md flex flex-col transition-all duration-300 hover:shadow-lg hover:border-primary"
            >
              <div className="font-label-caps text-label-caps text-on-surface-variant mb-xs">
                {new Date(a.created_at).toLocaleDateString()}
              </div>
              <h3 className="font-title-md text-title-md text-on-surface mb-xs">{a.title}</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant mb-md flex-grow line-clamp-2">{a.content}</p>
              <div className="flex items-center justify-between mt-auto">
                <span className="font-label-caps text-label-caps text-on-surface-variant">{a.author}</span>
                <button
                  onClick={e => { e.stopPropagation(); toggleLike(a.id); }}
                  className="flex items-center gap-1 text-sm text-primary hover:opacity-70 transition-opacity"
                  title={likesInfo[a.id]?.liked ? 'Unlike' : 'Like'}
                >
                  <span className="material-symbols-outlined text-sm" style={{fontVariationSettings: "'FILL' " + (likesInfo[a.id]?.liked ? 1 : 0)}}>thumb_up</span>
                  <span>{likesInfo[a.id]?.count ?? 0}</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      </main>

      {/* Admin FAB */}
      {user?.role === 'Admin' || user?.role === 'Executive' ? (
        <button 
          className="fixed right-6 bottom-24 w-14 h-14 bg-primary-container text-white rounded-full flex items-center justify-center shadow-[0_4px_12px_rgba(190,30,45,0.4)] hover:scale-105 active:scale-95 transition-all z-40"
          onClick={() => setShowForm(true)}
          title="Create announcement"
        >
          <span className="material-symbols-outlined text-2xl" style={{fontVariationSettings: "'FILL' 1"}}>add</span>
        </button>
      ) : null}

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

      {/* Post Announcement Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container-low border border-outline-variant rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-title-md text-title-md">New Announcement</h3>
              <button onClick={() => setShowForm(false)} className="text-on-surface-variant hover:text-primary">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block font-label-caps text-label-caps text-on-surface-variant mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Announcement title"
                  className="w-full bg-surface border border-outline-variant rounded-lg p-3 text-on-surface"
                />
              </div>
              <div>
                <label className="block font-label-caps text-label-caps text-on-surface-variant mb-1">Content</label>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Write your announcement..."
                  rows={4}
                  className="w-full bg-surface border border-outline-variant rounded-lg p-3 text-on-surface resize-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isBroadcast}
                  onChange={e => setIsBroadcast(e.target.checked)}
                  id="broadcast"
                  className="w-4 h-4 rounded border-outline-variant"
                />
                <label htmlFor="broadcast" className="font-label-caps text-label-caps cursor-pointer">
                  Broadcast to all members
                </label>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 rounded-lg border border-outline-variant text-on-surface-variant"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 px-4 py-2 rounded-lg bg-primary-container text-on-primary-container font-label-caps"
                >
                  Post Announcement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Announcements;

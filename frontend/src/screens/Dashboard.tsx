import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../hooks/api';

interface DashboardProps {
  onNavigate: (page: string) => void;
}

interface ActivityItem {
  id: string;
  user_name: string;
  action_type: string;
  action_text: string;
  created_at: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  start_date: string;
  location: string | null;
  description: string | null;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [meetingCount, setMeetingCount] = useState(0);
  const [nextEvent, setNextEvent] = useState<CalendarEvent | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [meetingsRes, calendarRes, activityRes] = await Promise.all([
          api.get('/meetings'),
          api.get('/calendar'),
          api.get('/activity')
        ]);
        
        // Setup stats
        const activeMeetings = meetingsRes.data.meetings || [];
        setMeetingCount(activeMeetings.length);

        // Setup next event
        const events = calendarRes.data.events || [];
        const upcoming = events.filter((e: any) => new Date(e.start_date) >= new Date());
        if (upcoming.length > 0) {
          setNextEvent(upcoming[0]);
        } else if (events.length > 0) {
          setNextEvent(events[0]);
        }

        // Setup activities
        setActivities((activityRes.data.activities || []).slice(0, 3));
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Parse next event date details
  const getEventDateParts = () => {
    if (!nextEvent) return { month: 'DEC', day: '15' };
    const d = new Date(nextEvent.start_date);
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return {
      month: months[d.getMonth()],
      day: d.getDate().toString().padStart(2, '0')
    };
  };

  const { month, day } = getEventDateParts();

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-outline-variant pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-on-surface">Welcome back, {user?.name} 👋</h1>
          <p className="text-sm text-on-surface-variant mt-1.5">Your legacy in the club continues to grow.</p>
        </div>
        <button
          onClick={() => onNavigate('subscription')}
          className="bg-primary-container hover:brightness-110 text-on-primary-container text-xs font-bold py-2.5 px-5 rounded-lg uppercase tracking-wider transition-all"
        >
          {user?.subscriptionTier === 'premium' ? 'VIEW PREMIUM PERKS' : 'UPGRADE TO PREMIUM'}
        </button>
      </section>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Quick Stats Block */}
        <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Stat 1: Total Members */}
          <div className="bg-surface-container border border-slate-800 p-6 rounded-xl flex flex-col justify-between hover:border-primary/50 transition-colors">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Total Members</span>
            <div className="mt-6">
              <span className="text-4xl md:text-5xl font-bold text-primary">128</span>
              <div className="flex items-center text-secondary text-xs mt-2 font-semibold">
                <span className="material-symbols-outlined text-sm mr-1">trending_up</span>
                +12 this month
              </div>
            </div>
          </div>

          {/* Stat 2: Upcoming Meetings */}
          <div
            onClick={() => onNavigate('meetings')}
            className="bg-surface-container border border-slate-800 p-6 rounded-xl flex flex-col justify-between hover:border-primary/50 cursor-pointer transition-colors"
          >
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Upcoming Meetings</span>
            <div className="mt-6">
              <span className="text-4xl md:text-5xl font-bold text-tertiary">
                {meetingCount.toString().padStart(2, '0')}
              </span>
              <p className="text-xs text-on-surface-variant mt-2">Click to view minutes</p>
            </div>
          </div>

          {/* Stat 3: Dues / Balance */}
          <div
            onClick={() => onNavigate('subscription')}
            className="bg-surface-container border border-slate-800 p-6 rounded-xl flex flex-col justify-between hover:border-primary/50 cursor-pointer transition-colors"
          >
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Personal Dues</span>
            <div className="mt-6">
              <span className="text-4xl md:text-5xl font-bold text-on-primary-container">
                {user?.subscriptionTier === 'premium' ? 'PAID' : '₦5,000'}
              </span>
              <p className={`text-xs mt-2 font-semibold ${user?.subscriptionTier === 'premium' ? 'text-secondary' : 'text-primary'}`}>
                {user?.subscriptionTier === 'premium' ? 'Premium active' : 'Upgrade pending'}
              </p>
            </div>
          </div>
        </div>

        {/* Highlight Event Card */}
        <div
          onClick={() => onNavigate('meetings')}
          className="md:col-span-4 bg-surface-container border border-slate-800 rounded-xl overflow-hidden flex flex-col hover:border-primary/50 cursor-pointer transition-all"
        >
          <div className="relative h-40">
            <div className="absolute inset-0 bg-gradient-to-t from-surface-container to-transparent z-10"></div>
            <img
              alt="Upcoming Event"
              className="w-full h-full object-cover opacity-65"
              src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=500&q=80"
            />
            <div className="absolute top-4 left-4 z-20 bg-primary-container text-on-primary-container p-2 rounded flex flex-col items-center min-w-[44px] shadow-md border border-primary/20">
              <span className="text-[10px] font-bold tracking-wider">{month}</span>
              <span className="text-lg font-bold">{day}</span>
            </div>
          </div>
          
          <div className="p-5 flex-grow flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-on-surface mb-1">
                {nextEvent ? nextEvent.title : 'Heritage & Legacy Gala'}
              </h3>
              <div className="flex items-center text-on-surface-variant gap-1 mb-4">
                <span className="material-symbols-outlined text-sm text-primary">location_on</span>
                <span className="text-xs">{nextEvent?.location || 'Royal Plaza Grand Ballroom'}</span>
              </div>
            </div>
            <button className="w-full bg-primary-container hover:brightness-110 text-on-primary-container py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5">
              <span className="material-symbols-outlined text-sm">confirmation_number</span>
              RSVP PORTAL
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity Feed Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-on-surface">Recent Activity Feed</h2>
          <button
            onClick={() => onNavigate('activity')}
            className="text-primary font-bold text-xs hover:underline tracking-wider"
          >
            SEE ALL UPDATES
          </button>
        </div>

        <div className="space-y-3">
          {activities.length === 0 ? (
            <div className="bg-surface-container border border-slate-800 p-8 rounded-xl text-center text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl mb-2 text-primary">feed</span>
              <p className="text-sm">No recent activities available.</p>
            </div>
          ) : (
            activities.map(a => (
              <div
                key={a.id}
                className="bg-surface-container border border-slate-800 p-4 rounded-xl flex items-start gap-4 hover:bg-surface-container-high transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center shrink-0 border border-outline-variant">
                  <span className="text-sm font-bold text-on-primary-container">{a.user_name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-grow">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <p className="text-sm text-on-surface font-semibold">
                      {a.user_name} <span className="font-normal text-on-surface-variant">{a.action_text}</span>
                    </p>
                    <span className="text-on-surface-variant text-[10px] font-medium">
                      {new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1 capitalize">Activity Type: {a.action_type}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;

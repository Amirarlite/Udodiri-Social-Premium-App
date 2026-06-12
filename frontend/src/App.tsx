import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Dashboard from './screens/Dashboard';
import Announcements from './screens/Announcements';
import MemberChat from './screens/MemberChat';
import Activity from './screens/Activity';
import Meetings from './screens/Meetings';
import Calendar from './screens/Calendar';
import Financials from './screens/Financials';
import Subscription from './screens/Subscription';
import api from './hooks/api';

const AppContent: React.FC = () => {
  const { user, loading, logout, refreshUser } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [showWelcome, setShowWelcome] = useState(false);
  const [changingRole, setChangingRole] = useState(false);

  // Check welcome popup state on mount or when user changes
  useEffect(() => {
    if (user) {
      const shown = sessionStorage.getItem('udodiri_welcome_popup_v2');
      if (!shown) {
        setShowWelcome(true);
      }
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-on-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="font-semibold text-primary">Loading Udodiri Portal...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Login />;

  const handleCloseWelcome = () => {
    sessionStorage.setItem('udodiri_welcome_popup_v2', 'shown');
    setShowWelcome(false);
  };

  const handleRoleChange = async (role: string) => {
    setChangingRole(true);
    try {
      await api.post('/auth/role', { role });
      await refreshUser();
    } catch (err) {
      console.error(err);
      alert('Failed to update role');
    } finally {
      setChangingRole(false);
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} />;
      case 'announcements':
        return <Announcements />;
      case 'chat':
        return <MemberChat />;
      case 'activity':
        return <Activity />;
      case 'meetings':
        return <Meetings onNavigate={setCurrentPage} />;
      case 'calendar':
        return <Calendar />;
      case 'financials':
        return <Financials />;
      case 'subscription':
        return <Subscription />;
      default:
        return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-background pb-32">
      {/* TopAppBar */}
      <header className="bg-surface border-b border-outline-variant w-full top-0 sticky z-40">
        <div className="flex justify-between items-center px-4 md:px-8 h-16 max-w-[1200px] mx-auto">
          <div className="flex items-center gap-3 cursor-pointer active:opacity-80" onClick={() => setCurrentPage('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center overflow-hidden border border-outline-variant">
              <img
                alt="Club Logo"
                className="w-full h-full object-cover"
                src="/udodiri-app-logo.png"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo.png';
                }}
              />
            </div>
            <span className="font-semibold text-lg md:text-xl text-primary tracking-wide">Udodiri Young Social Club</span>
          </div>
          
          <div className="flex items-center gap-3 md:gap-6">
            {/* Developer Role Switcher */}
            <div className="flex items-center gap-1.5 bg-surface-container-high border border-outline-variant rounded-lg px-2 py-1">
              <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider hidden md:inline">Test Role:</span>
              <select
                value={user.role}
                disabled={changingRole}
                onChange={(e) => handleRoleChange(e.target.value)}
                className="bg-transparent border-none text-xs text-primary font-bold focus:ring-0 p-0 cursor-pointer outline-none"
              >
                <option value="Member">Member</option>
                <option value="Executive">Executive</option>
                <option value="Admin">Admin</option>
              </select>
            </div>

            <button
              onClick={() => setCurrentPage('announcements')}
              className={`material-symbols-outlined p-2 rounded-full cursor-pointer hover:bg-surface-container-high transition-colors ${
                currentPage === 'announcements' ? 'text-primary' : 'text-on-surface-variant'
              }`}
            >
              notifications
            </button>
            
            <div
              onClick={() => setCurrentPage('subscription')}
              className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container cursor-pointer border border-outline-variant hover:border-primary transition-all"
            >
              <span className="text-sm font-bold">{user.name.charAt(0).toUpperCase()}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow max-w-[1200px] w-full mx-auto px-4 md:px-8 py-6">
        {renderPage()}
      </main>

      {/* BottomNavBar */}
      <nav className="fixed bottom-0 w-full z-45 bg-surface-container border-t border-surface-variant">
        <div className="flex justify-around items-center h-20 max-w-[1200px] mx-auto px-2">
          {/* Dashboard */}
          <button
            onClick={() => setCurrentPage('dashboard')}
            className={`flex flex-col items-center justify-center py-1.5 px-4 rounded-full transition-all scale-95 active:scale-90 ${
              currentPage === 'dashboard'
                ? 'bg-secondary-container text-on-secondary-container font-semibold'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: currentPage === 'dashboard' ? "'FILL' 1" : undefined }}>
              dashboard
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider mt-0.5">Dashboard</span>
          </button>

          {/* Alerts / Announcements */}
          <button
            onClick={() => setCurrentPage('announcements')}
            className={`flex flex-col items-center justify-center py-1.5 px-4 rounded-full transition-all scale-95 active:scale-90 ${
              currentPage === 'announcements'
                ? 'bg-secondary-container text-on-secondary-container font-semibold'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: currentPage === 'announcements' ? "'FILL' 1" : undefined }}>
              campaign
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider mt-0.5">Alerts</span>
          </button>

          {/* Chat */}
          <button
            onClick={() => setCurrentPage('chat')}
            className={`flex flex-col items-center justify-center py-1.5 px-4 rounded-full transition-all scale-95 active:scale-90 ${
              currentPage === 'chat'
                ? 'bg-secondary-container text-on-secondary-container font-semibold'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: currentPage === 'chat' ? "'FILL' 1" : undefined }}>
              chat
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider mt-0.5">Chat</span>
          </button>

          {/* Meetings */}
          <button
            onClick={() => setCurrentPage('meetings')}
            className={`flex flex-col items-center justify-center py-1.5 px-4 rounded-full transition-all scale-95 active:scale-90 ${
              currentPage === 'meetings' || currentPage === 'calendar'
                ? 'bg-secondary-container text-on-secondary-container font-semibold'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: currentPage === 'meetings' || currentPage === 'calendar' ? "'FILL' 1" : undefined }}>
              event
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider mt-0.5">Meetings</span>
          </button>
        </div>
      </nav>

      {/* Premium Sponsor & Welcome Popup */}
      {showWelcome && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="glass-card max-w-[500px] w-full rounded-2xl p-8 border border-outline-variant shadow-[0_0_50px_rgba(190,30,45,0.35)] relative overflow-hidden text-center animate-fade-in">
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl -z-10"></div>
            
            {/* Logo Emblem */}
            <div className="w-28 h-28 rounded-2xl overflow-hidden mx-auto mb-6 border-2 border-primary shadow-lg bg-surface">
              <img
                src="/udodiri-app-logo.png"
                alt="Udodiri App Logo"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo.png';
                }}
              />
            </div>

            <h2 className="text-2xl font-bold text-on-surface mb-2">Welcome to Udodiri Social Club</h2>
            <p className="text-on-surface-variant text-sm mb-6">Your legacy in the brotherhood continues to grow.</p>
            
            {/* Sponsor & Developer Credit Note Box */}
            <div className="bg-surface-container-high border border-outline-variant rounded-xl p-6 mb-8 text-center relative">
              <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-on-primary text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
                Credits & Sponsorship
              </span>
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3 mt-1">
                Sponsored By
              </p>
              <h3 className="text-lg font-bold text-primary tracking-wide mb-4">
                CHIEF NICODEMUS <br className="md:hidden" /><span className="text-tertiary">AKA NICOJET</span>
              </h3>
              <div className="w-12 h-px bg-outline-variant mx-auto mb-4"></div>
              <p className="text-xs text-on-surface-variant">
                Built with premium craftsmanship by <a href="https://srdgintel.com" target="_blank" rel="noopener noreferrer" className="text-secondary font-bold hover:underline">SRDGINTEL.COM</a>
              </p>
            </div>

            {/* Portal Action Button */}
            <button
              onClick={handleCloseWelcome}
              className="w-full bg-primary-container hover:bg-on-primary-fixed-variant text-on-primary-container font-bold py-4 rounded-xl transition-all active:scale-[0.98] shadow-md shadow-primary-container/20 tracking-wider text-sm uppercase"
            >
              ENTER PORTAL
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;

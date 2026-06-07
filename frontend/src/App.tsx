import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Dashboard from './screens/Dashboard';
import Announcements from './screens/Announcements';
import MemberChat from './screens/MemberChat';
import Activity from './screens/Activity';
import Meetings from './screens/Meetings';
import Calendar from './screens/Calendar';
import Financials from './screens/Financials';
import Subscription from './screens/Subscription';
import Notifications from './screens/Notifications';
import WelcomeModal from './components/WelcomeModal';
import Footer from './components/Footer';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  // Show welcome modal only once after a successful login
  useEffect(() => {
    if (user) {
      const seen = localStorage.getItem('udodiri_welcome_shown');
      if (!seen) {
        setShowWelcome(true);
      }
    }
  }, [user]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) return <Login />;

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard onNavigate={setCurrentPage} />;
      case 'announcements': return <Announcements />;
      case 'chat': return <MemberChat />;
      case 'activity': return <Activity />;
      case 'meetings': return <Meetings />;
      case 'calendar': return <Calendar />;
      case 'financials': return <Financials />;
      case 'subscription': return <Subscription />;
      case 'notifications': return <Notifications />;
      default: return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  const handleCloseWelcome = () => {
    localStorage.setItem('udodiri_welcome_shown', 'true');
    setShowWelcome(false);
  };

  const premiumClass = user?.subscriptionTier?.toLowerCase() === 'premium' ? 'premium-theme' : '';

  return (
    <div className={`app-layout ${premiumClass}`}>
      {showWelcome && <WelcomeModal onClose={handleCloseWelcome} />}
      <button className="mobile-toggle" onClick={() => setMobileOpen(true)}>☰</button>
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <main className="main-content">
        {renderPage()}
        <Footer />
      </main>
    </div>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;

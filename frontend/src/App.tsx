import React, { useState } from 'react';
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

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);

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
      default: return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="app-layout">
      <button className="mobile-toggle" onClick={() => setMobileOpen(true)}>☰</button>
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <main className="main-content">{renderPage()}</main>
    </div>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;

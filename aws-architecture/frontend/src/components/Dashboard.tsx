import React from 'react';
import { useAuth } from '../hooks/useAuth';

interface DashboardProps {
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const { user } = useAuth();

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>Udodiri Social Club</h1>
        <div style={styles.userInfo}>
          <span>Welcome, {user?.email || 'Member'}</span>
          <button onClick={onLogout} style={styles.logoutButton}>
            Logout
          </button>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.grid}>
          <div style={styles.card}>
            <h3>Meeting Minutes</h3>
            <p>View and manage meeting minutes</p>
            <button style={styles.cardButton}>View Meetings</button>
          </div>

          <div style={styles.card}>
            <h3>Announcements</h3>
            <p>Latest club announcements</p>
            <button style={styles.cardButton}>View Announcements</button>
          </div>

          <div style={styles.card}>
            <h3>Calendar</h3>
            <p>Upcoming events and meetings</p>
            <button style={styles.cardButton}>View Calendar</button>
          </div>

          <div style={styles.card}>
            <h3>Financials</h3>
            <p>Payment history and dues</p>
            <button style={styles.cardButton}>View Financials</button>
          </div>

          <div style={styles.card}>
            <h3>Subscription</h3>
            <p>Manage your membership</p>
            <button style={styles.cardButton}>Manage Subscription</button>
          </div>
        </div>
      </main>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007bff',
    color: '#fff',
    padding: '20px 40px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  logoutButton: {
    padding: '8px 16px',
    backgroundColor: '#fff',
    color: '#007bff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  main: {
    padding: '40px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
  },
  card: {
    backgroundColor: '#fff',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  },
  cardButton: {
    marginTop: '15px',
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
};

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import api from '../hooks/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  subscriptionTier: string;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: number;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  notifications: Notification[];
  unreadCount: number;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  refreshNotifications: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>(null!);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem('udodiri_user');
    const token = localStorage.getItem('udodiri_token');
    if (stored && token) {
      setUser(JSON.parse(stored));
      api.get('/auth/me').then(r => {
        setUser(r.data.user);
        localStorage.setItem('udodiri_user', JSON.stringify(r.data.user));
      }).catch(() => {
        localStorage.removeItem('udodiri_token');
        localStorage.removeItem('udodiri_user');
        setUser(null);
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.notifications || []);
      setUnreadCount((data.notifications || []).filter((n: Notification) => n.is_read === 0).length);
    } catch (err) {
      console.error(err);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      refreshNotifications();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(refreshNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user, refreshNotifications]);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('udodiri_token', data.token);
    localStorage.setItem('udodiri_user', JSON.stringify(data.user));
    setUser(data.user);
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    await api.post('/auth/register', { email, password, name });
    await login(email, password);
  }, [login]);

  const logout = useCallback(() => {
    localStorage.removeItem('udodiri_token');
    localStorage.removeItem('udodiri_user');
    setUser(null);
    setNotifications([]);
    setUnreadCount(0);
    window.location.href = '/login';
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, notifications, unreadCount, login, register, logout, refreshNotifications }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
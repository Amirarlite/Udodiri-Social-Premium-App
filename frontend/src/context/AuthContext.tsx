import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import api from '../hooks/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  subscriptionTier: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>(null!);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
      localStorage.setItem('udodiri_user', JSON.stringify(data.user));
    } catch (err) {
      console.error('Failed to refresh user', err);
    }
  }, []);

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
    window.location.href = '/login';
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

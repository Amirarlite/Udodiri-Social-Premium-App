import { useEffect, useState } from 'react';
import { getCurrentUser, signOut } from '../config/aws';

export interface User {
  userId: string;
  email?: string;
  name?: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setUser({
            userId: currentUser.userId,
            email: (currentUser as any).email,
            name: (currentUser as any).name,
          });
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const logout = async () => {
    await signOut();
    setUser(null);
  };

  return { user, loading, logout, isAuthenticated: !!user };
};

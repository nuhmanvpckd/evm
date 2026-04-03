import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchApi } from '../lib/utils';

interface AuthContextType {
  user: any;
  loading: boolean;
  login: (token: string, user: any) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('evm_token');
      if (token) {
        try {
          const data = await fetchApi('/api/auth/me');
          setUser(data);
        } catch (err) {
          localStorage.removeItem('evm_token');
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = (token: string, user: any) => {
    localStorage.setItem('evm_token', token);
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem('evm_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

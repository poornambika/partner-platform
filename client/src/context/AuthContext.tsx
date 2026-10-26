import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, DemoAccountsList } from '../types';

interface AuthContextType {
  currentUser: User | null;
  token: string | null;
  loading: boolean;
  demoAccounts: DemoAccountsList | null;
  login: (email: string, password?: string) => Promise<boolean>;
  switchAccount: (userId: string) => Promise<boolean>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('apex_token'));
  const [loading, setLoading] = useState<boolean>(true);
  const [demoAccounts, setDemoAccounts] = useState<DemoAccountsList | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  };

  // Fetch demo accounts list for the quick switcher
  const fetchDemoAccounts = async () => {
    try {
      const res = await fetch('/api/auth/demo-accounts');
      if (res.ok) {
        const data = await res.json();
        setDemoAccounts(data);
      }
    } catch (e) {
      console.error('Failed to load demo accounts list', e);
    }
  };

  // Refresh current user profile
  const refreshProfile = async () => {
    if (!token) {
      setCurrentUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data);
      } else {
        // If token invalid, auto logout or switch to owner
        localStorage.removeItem('apex_token');
        setToken(null);
        setCurrentUser(null);
      }
    } catch (e) {
      console.error('Failed to refresh profile', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDemoAccounts();
    if (token) {
      refreshProfile();
    } else {
      // Auto-login as Owner OWN001 for seamless reviewer first impression
      switchAccount('OWN001').finally(() => setLoading(false));
    }
  }, []);

  const login = async (email: string, password: string = 'Demo@12345'): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Authentication failed', 'error');
        return false;
      }
      localStorage.setItem('apex_token', data.token);
      setToken(data.token);
      setCurrentUser(data.user);
      showToast(`Welcome back, ${data.user.name} (${data.user.role})`);
      return true;
    } catch (e) {
      showToast('Connection error during authentication', 'error');
      return false;
    }
  };

  const switchAccount = async (userId: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/switch-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to switch demo account', 'error');
        return false;
      }
      localStorage.setItem('apex_token', data.token);
      setToken(data.token);
      setCurrentUser(data.user);
      showToast(`Active Session: ${data.user.name} [${data.user.role} - ${data.user.id}]`);
      return true;
    } catch (e) {
      showToast('Error switching account', 'error');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('apex_token');
    setToken(null);
    setCurrentUser(null);
    showToast('Signed out of demo session', 'info');
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        token,
        loading,
        demoAccounts,
        login,
        switchAccount,
        logout,
        refreshProfile,
        toast,
        showToast,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

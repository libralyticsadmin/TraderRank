import React, { createContext, useContext, useState, useEffect } from 'react';
import { Broker } from '../../../shared/src/types.ts';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatarSymbol: string;
  traderTitle: string;
  bio: string;
  tradingStyle: 'SCALPER' | 'DAY_TRADER' | 'SWING_TRADER' | 'ALGORITHMIC';
  primaryBroker: Broker;
  country: string;
  joinedAt: string;
  level: number;
  xp: number;
  rank?: number;
  telegramHandle?: string;
  discordHandle?: string;
  twitterHandle?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: (emailOrUser: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: {
    username: string;
    email: string;
    password?: string;
    primaryBroker?: Broker;
    tradingStyle?: UserProfile['tradingStyle'];
  }) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  openAuthModal: (initialTab?: 'signin' | 'register') => void;
  closeAuthModal: () => void;
  isAuthModalOpen: boolean;
  authModalTab: 'signin' | 'register';
  openProfileModal: () => void;
  closeProfileModal: () => void;
  isProfileModalOpen: boolean;
}

const STORAGE_KEY = 'traderank_auth_user_v1';

// Default initial demo profile if newly registered or guest testing
const DEFAULT_DEMO_USER: UserProfile = {
  id: 'u_traderrank_master',
  username: 'Alex_Vanguard',
  email: 'alex.vanguard@traderank.live',
  avatarSymbol: 'zap',
  traderTitle: 'Institutional Gold & FX Scalper',
  bio: 'Disciplined price-action scalper specializing in London/NY overlaps. Zero-write verified execution across XM and Exness.',
  tradingStyle: 'SCALPER',
  primaryBroker: 'Exness',
  country: 'United States',
  joinedAt: 'October 2026',
  level: 5,
  xp: 3420,
  rank: 12,
  telegramHandle: '@alex_trades',
  discordHandle: 'vanguard_fx#1284',
  twitterHandle: '@vanguard_fx',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return null;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'signin' | 'register'>('signin');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Sync with localStorage
  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  }, [user]);

  const openAuthModal = (initialTab: 'signin' | 'register' = 'signin') => {
    setAuthModalTab(initialTab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const openProfileModal = () => {
    setIsProfileModalOpen(true);
  };

  const closeProfileModal = () => {
    setIsProfileModalOpen(false);
  };

  const login = async (emailOrUser: string, _password?: string) => {
    // Quick validation
    const trimmed = emailOrUser.trim();
    if (!trimmed) {
      return { success: false, error: 'Please enter your username or email' };
    }

    // Try server endpoint if available
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrUser: trimmed }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          setIsAuthModalOpen(false);
          return { success: true };
        }
      }
    } catch {
      // Client offline fallback
    }

    // Client-side authentication fallback for seamless UX
    const newUser: UserProfile = {
      ...DEFAULT_DEMO_USER,
      id: `u_${trimmed.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      username: trimmed.includes('@') ? trimmed.split('@')[0] : trimmed,
      email: trimmed.includes('@') ? trimmed : `${trimmed.toLowerCase()}@traderank.live`,
    };

    setUser(newUser);
    setIsAuthModalOpen(false);
    return { success: true };
  };

  const register = async (data: {
    username: string;
    email: string;
    password?: string;
    primaryBroker?: Broker;
    tradingStyle?: UserProfile['tradingStyle'];
  }) => {
    const cleanUser = data.username.trim();
    const cleanEmail = data.email.trim();

    if (!cleanUser || cleanUser.length < 3) {
      return { success: false, error: 'Username must be at least 3 characters' };
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'Please enter a valid email address' };
    }

    // Try server endpoint
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: cleanUser,
          email: cleanEmail,
          primaryBroker: data.primaryBroker || 'Exness',
          tradingStyle: data.tradingStyle || 'SCALPER',
        }),
      });
      if (res.ok) {
        const body = await res.json();
        if (body.user) {
          setUser(body.user);
          setIsAuthModalOpen(false);
          return { success: true };
        }
      }
    } catch {
      // Client offline fallback
    }

    const newUser: UserProfile = {
      ...DEFAULT_DEMO_USER,
      id: `u_${cleanUser.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      username: cleanUser,
      email: cleanEmail,
      primaryBroker: data.primaryBroker || 'Exness',
      tradingStyle: data.tradingStyle || 'SCALPER',
      joinedAt: 'Today',
      level: 1,
      xp: 100,
      rank: 99,
    };

    setUser(newUser);
    setIsAuthModalOpen(false);
    return { success: true };
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { success: false, error: 'Not logged in' };

    const updated = { ...user, ...updates };
    setUser(updated);

    // Sync with server if online
    try {
      await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch {
      // Local copy already saved
    }

    return { success: true };
  };

  const logout = () => {
    setUser(null);
    setIsProfileModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        register,
        updateProfile,
        logout,
        openAuthModal,
        closeAuthModal,
        isAuthModalOpen,
        authModalTab,
        openProfileModal,
        closeProfileModal,
        isProfileModalOpen,
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

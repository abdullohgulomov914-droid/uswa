import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface User {
  id: number;
  displayName: string;
  age?: number;
  problem?: string;
  streakDays: number;
  longestStreak: number;
  xp: number;
  level: number;
  telegramId?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  verifyPin: (pin: string) => boolean;
  setPin: (pin: string) => void;
  hasPin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for saved auth
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (userData: User, token: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('pin');
    setUser(null);
  };

  const setPin = (pin: string) => {
    localStorage.setItem('pin', pin);
  };

  const hasPin = () => {
    return !!localStorage.getItem('pin');
  };

  const verifyPin = (pin: string) => {
    const savedPin = localStorage.getItem('pin');
    return savedPin === pin;
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      setPin,
      hasPin,
      verifyPin,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

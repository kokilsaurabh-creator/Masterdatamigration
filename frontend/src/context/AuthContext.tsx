// frontend/src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppUser } from '../types';

interface AuthContextType {
  user: AppUser | null;
  step: number; // 0 = Login, 1 = Project Setup, 2 = Workspace, 4 = Admin
  setUser: (user: AppUser | null) => void;
  setStep: (step: number) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<AppUser | null>(() => {
    const saved = localStorage.getItem('expound_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [step, setStepState] = useState<number>(() => {
    const savedStep = localStorage.getItem('expound_step');
    if (savedStep) return parseInt(savedStep, 10);
    const savedUser = localStorage.getItem('expound_user');
    return savedUser ? 1 : 0;
  });

  const setUser = (u: AppUser | null) => {
    setUserState(u);
    if (u) {
      localStorage.setItem('expound_user', JSON.stringify(u));
    } else {
      localStorage.removeItem('expound_user');
    }
  };

  const setStep = (s: number) => {
    setStepState(s);
    localStorage.setItem('expound_step', String(s));
  };

  const logout = () => {
    setUserState(null);
    setStepState(0);
    localStorage.removeItem('expound_user');
    localStorage.removeItem('expound_step');
    localStorage.removeItem('expound_project');
    localStorage.removeItem('expound_master');
  };

  useEffect(() => {
    if (!user && step !== 0) {
      setStepState(0);
    }
  }, [user, step]);

  return (
    <AuthContext.Provider value={{ user, step, setUser, setStep, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

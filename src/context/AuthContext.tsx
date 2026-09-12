import React, { createContext, useContext, useState, useEffect } from 'react';
import { FamilyMember, Family } from '../types/index.js';
import { apiRequest } from '../utils/api.js';

interface AuthContextType {
  currentUser: FamilyMember | null;
  family: Family | null;
  familyMembers: FamilyMember[];
  isLoading: boolean;
  activeLanguage: 'en' | 'te' | 'hi';
  setLanguage: (lang: 'en' | 'te' | 'hi') => void;
  switchActiveMember: (userId: string) => Promise<void>;
  hasPermission: (permissionCode: string) => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FamilyMember | null>(null);
  const [family, setFamily] = useState<Family | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeLanguage, setActiveLanguage] = useState<'en' | 'te' | 'hi'>('en');

  const fetchCurrentUser = async () => {
    try {
      setIsLoading(true);
      const data = await apiRequest('/auth/me');
      setCurrentUser(data.user);
      setFamily(data.family);
      setFamilyMembers(data.familyMembers || []);
      if (data.family?.language) {
        setActiveLanguage(data.family.language);
      }
    } catch (err) {
      console.error('Failed to load auth me:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const switchActiveMember = async (userId: string) => {
    try {
      setIsLoading(true);
      localStorage.setItem('onefamily_active_user_id', userId);
      const res = await apiRequest('/auth/switch-member', {
        method: 'POST',
        body: JSON.stringify({ userId }),
      }, userId);

      if (res.token) {
        localStorage.setItem('onefamily_token', res.token);
      }
      setCurrentUser(res.user);
      setFamily(res.family);
      await fetchCurrentUser();
    } catch (err) {
      console.error('Failed to switch member:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const hasPermission = (permissionCode: string): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'FAMILY_HEAD') return true;
    return currentUser.permissions?.includes(permissionCode) || false;
  };

  const setLanguage = (lang: 'en' | 'te' | 'hi') => {
    setActiveLanguage(lang);
    localStorage.setItem('onefamily_lang', lang);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        family,
        familyMembers,
        isLoading,
        activeLanguage,
        setLanguage,
        switchActiveMember,
        hasPermission,
        refreshUser: fetchCurrentUser,
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

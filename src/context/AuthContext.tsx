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
  logout: () => void;
  login: (emailOrPin: string, pin?: string) => Promise<{ success: boolean; error?: string }>;
  registerHead: (data: {
    familyName: string;
    headName: string;
    headEmail?: string;
    pinCode: string;
    location?: string;
    currency?: string;
    language?: string;
    relationship?: string;
    phone?: string;
  }) => Promise<{ success: boolean; familyKey?: string; error?: string }>;
  joinFamily: (data: {
    familyKey: string;
    name: string;
    email?: string;
    pinCode: string;
    relationship?: string;
    role?: string;
    phone?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  regenerateFamilyKey: () => Promise<string | null>;
  approveMember: (
    userId: string,
    permissions: string[],
    role?: string,
    relationship?: string
  ) => Promise<{ success: boolean; error?: string }>;
  rejectMember: (userId: string) => Promise<{ success: boolean; error?: string }>;
  updateMemberPermissions: (
    userId: string,
    permissions: string[]
  ) => Promise<{ success: boolean; error?: string }>;
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

  const logout = () => {
    localStorage.removeItem('onefamily_token');
    localStorage.removeItem('onefamily_active_user_id');
    localStorage.removeItem('onefamily_onboarded');
    setCurrentUser(null);
    setFamily(null);
    setFamilyMembers([]);
  };

  const login = async (emailOrPin: string, pin?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      const res = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: emailOrPin, pin: pin || emailOrPin }),
      });
      if (res.token) {
        localStorage.setItem('onefamily_token', res.token);
      }
      if (res.user?.id) {
        localStorage.setItem('onefamily_active_user_id', res.user.id);
      }
      localStorage.setItem('onefamily_onboarded', 'true');
      setCurrentUser(res.user);
      setFamily(res.family);
      setFamilyMembers(res.familyMembers || []);
      return { success: true };
    } catch (err: any) {
      console.error('Login failed:', err);
      return { success: false, error: err.message || 'Invalid login credentials' };
    } finally {
      setIsLoading(false);
    }
  };

  const registerHead = async (data: {
    familyName: string;
    headName: string;
    headEmail?: string;
    pinCode: string;
    location?: string;
    currency?: string;
    language?: string;
    relationship?: string;
    phone?: string;
  }): Promise<{ success: boolean; familyKey?: string; error?: string }> => {
    try {
      setIsLoading(true);
      const res = await apiRequest('/auth/register-head', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (res.token) {
        localStorage.setItem('onefamily_token', res.token);
      }
      if (res.user?.id) {
        localStorage.setItem('onefamily_active_user_id', res.user.id);
      }
      localStorage.setItem('onefamily_onboarded', 'true');
      setCurrentUser(res.user);
      setFamily(res.family);
      setFamilyMembers(res.familyMembers || [res.user]);
      return { success: true, familyKey: res.family?.family_key };
    } catch (err: any) {
      console.error('Registration failed:', err);
      return { success: false, error: err.message || 'Failed to create family' };
    } finally {
      setIsLoading(false);
    }
  };

  const joinFamily = async (data: {
    familyKey: string;
    name: string;
    email?: string;
    pinCode: string;
    relationship?: string;
    role?: string;
    phone?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      const res = await apiRequest('/auth/join-family', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (res.token) {
        localStorage.setItem('onefamily_token', res.token);
      }
      if (res.user?.id) {
        localStorage.setItem('onefamily_active_user_id', res.user.id);
      }
      localStorage.setItem('onefamily_onboarded', 'true');
      setCurrentUser(res.user);
      setFamily(res.family);
      setFamilyMembers(res.familyMembers || []);
      return { success: true };
    } catch (err: any) {
      console.error('Join family failed:', err);
      return { success: false, error: err.message || 'Failed to join family' };
    } finally {
      setIsLoading(false);
    }
  };

  const regenerateFamilyKey = async (): Promise<string | null> => {
    try {
      const res = await apiRequest('/auth/regenerate-family-key', { method: 'POST' });
      if (res.family_key) {
        if (family) {
          setFamily({ ...family, family_key: res.family_key });
        }
        return res.family_key;
      }
      return null;
    } catch (err) {
      console.error('Failed to regenerate family key:', err);
      return null;
    }
  };

  const approveMember = async (
    userId: string,
    permissions: string[],
    role?: string,
    relationship?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!family?.id) return { success: false, error: 'Family context not found' };
    try {
      setIsLoading(true);
      await apiRequest(`/families/${family.id}/members/${userId}/approve`, {
        method: 'POST',
        body: JSON.stringify({ permissions, role, relationship }),
      });
      await fetchCurrentUser();
      return { success: true };
    } catch (err: any) {
      console.error('Failed to approve member:', err);
      return { success: false, error: err.message || 'Approval failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const rejectMember = async (userId: string): Promise<{ success: boolean; error?: string }> => {
    if (!family?.id) return { success: false, error: 'Family context not found' };
    try {
      setIsLoading(true);
      await apiRequest(`/families/${family.id}/members/${userId}/reject`, {
        method: 'DELETE',
      });
      await fetchCurrentUser();
      return { success: true };
    } catch (err: any) {
      console.error('Failed to reject member:', err);
      return { success: false, error: err.message || 'Rejection failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const updateMemberPermissions = async (
    userId: string,
    permissions: string[]
  ): Promise<{ success: boolean; error?: string }> => {
    if (!family?.id) return { success: false, error: 'Family context not found' };
    try {
      setIsLoading(true);
      await apiRequest(`/families/${family.id}/members/${userId}/permissions`, {
        method: 'PUT',
        body: JSON.stringify({ permissions }),
      });
      await fetchCurrentUser();
      return { success: true };
    } catch (err: any) {
      console.error('Failed to update member permissions:', err);
      return { success: false, error: err.message || 'Permission update failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const hasPermission = (permissionCode: string): boolean => {
    if (!currentUser) return false;
    // Only Family Head has unconditional full access
    if (currentUser.role === 'FAMILY_HEAD') return true;
    // Unapproved members have zero access to all modules
    if (currentUser.is_approved === false || currentUser.status === 'PENDING_APPROVAL') return false;
    if (currentUser.permissions && Array.isArray(currentUser.permissions)) {
      return currentUser.permissions.includes(permissionCode);
    }
    return false;
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
        logout,
        login,
        registerHead,
        joinFamily,
        regenerateFamilyKey,
        approveMember,
        rejectMember,
        updateMemberPermissions,
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

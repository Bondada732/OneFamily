import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { HomeDashboardData } from '../types/index.js';
import { apiRequest, getCachedApiResponse, warmupBackendServer } from '../utils/api.js';
import { useAuth } from './AuthContext.js';

interface FamilyContextType {
  dashboard: HomeDashboardData | null;
  isLoading: boolean;
  unreadNotifsCount: number;
  refreshDashboard: () => Promise<void>;
}

const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

export const FamilyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, family } = useAuth();
  const [dashboard, setDashboard] = useState<HomeDashboardData | null>(() => {
    if (family?.id) {
      return getCachedApiResponse<HomeDashboardData>(`/dashboard/${family.id}/dashboard`);
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(!dashboard);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(2);

  const fetchDashboard = useCallback(async () => {
    if (!family?.id) return;
    try {
      if (!dashboard) setIsLoading(true);
      const data = await apiRequest(`/dashboard/${family.id}/dashboard`);
      if (data) {
        setDashboard(data);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  }, [family?.id, currentUser?.id]);

  useEffect(() => {
    warmupBackendServer();
  }, []);

  useEffect(() => {
    if (family?.id) {
      fetchDashboard();
    }
  }, [family?.id, currentUser?.id, fetchDashboard]);

  return (
    <FamilyContext.Provider
      value={{
        dashboard,
        isLoading,
        unreadNotifsCount,
        refreshDashboard: fetchDashboard,
      }}
    >
      {children}
    </FamilyContext.Provider>
  );
};

export const useFamily = () => {
  const context = useContext(FamilyContext);
  if (!context) {
    throw new Error('useFamily must be used within a FamilyProvider');
  }
  return context;
};

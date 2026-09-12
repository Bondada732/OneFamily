import React, { createContext, useContext, useState, useEffect } from 'react';

interface SecurityContextType {
  isLocked: boolean;
  isPrivacyMode: boolean; // blurs financial numbers for glance protection
  lockApp: () => void;
  unlockApp: (pin: string) => boolean;
  togglePrivacyMode: () => void;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLocked, setIsLocked] = useState(false);
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);

  const lockApp = () => {
    setIsLocked(true);
  };

  const unlockApp = (pin: string): boolean => {
    // Default PIN: 1234
    if (pin === '1234' || pin === '0000') {
      setIsLocked(false);
      return true;
    }
    return false;
  };

  const togglePrivacyMode = () => {
    setIsPrivacyMode((prev) => !prev);
  };

  return (
    <SecurityContext.Provider
      value={{
        isLocked,
        isPrivacyMode,
        lockApp,
        unlockApp,
        togglePrivacyMode,
      }}
    >
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { SecurityProvider } from './context/SecurityContext.js';
import { FamilyProvider } from './context/FamilyContext.js';
import { MobileFrame } from './components/layout/MobileFrame.js';
import { Header } from './components/common/Header.js';
import { BottomNav, TabType } from './components/common/BottomNav.js';
import { QuickActionModal } from './components/common/QuickActionModal.js';
import { UniversalSearchModal } from './components/common/UniversalSearchModal.js';
import { NotificationModal } from './components/common/NotificationModal.js';
import { PinLockModal } from './components/common/PinLockModal.js';

import { OnboardingView } from './views/Onboarding/OnboardingView.js';
import { HomeView } from './views/Home/HomeView.js';
import { MoneyView } from './views/Money/MoneyView.js';
import { FamilyView } from './views/Family/FamilyView.js';
import { VaultView } from './views/Vault/VaultView.js';
import { AIView } from './views/AI/AIView.js';
import { CalendarView } from './views/Calendar/CalendarView.js';
import { MemoriesView } from './views/Memories/MemoriesView.js';
import { SettingsView } from './views/Settings/SettingsView.js';

const MainAppContent: React.FC = () => {
  const { currentUser, isLoading } = useAuth();
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(
    () => localStorage.getItem('onefamily_onboarded') === 'true'
  );

  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [showQuickAction, setShowQuickAction] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-400 to-indigo-600 p-1 flex items-center justify-center animate-bounce shadow-2xl">
          <span className="text-white font-extrabold text-2xl">1F</span>
        </div>
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">ONE FAMILY</h2>
          <p className="text-xs text-slate-400 mt-1">One Home. One Family. One Future.</p>
        </div>
      </div>
    );
  }

  if (!hasCompletedOnboarding) {
    return (
      <MobileFrame>
        <OnboardingView
          onComplete={() => {
            localStorage.setItem('onefamily_onboarded', 'true');
            setHasCompletedOnboarding(true);
          }}
        />
      </MobileFrame>
    );
  }

  const handleQuickAction = (actionType: string) => {
    switch (actionType) {
      case 'ADD_EXPENSE':
      case 'CREATE_GOAL':
        setActiveTab('money');
        break;
      case 'UPLOAD_DOC':
        setActiveTab('vault');
        break;
      case 'ADD_TASK':
        setActiveTab('family');
        break;
      case 'ADD_MEMORY':
        setActiveTab('memories');
        break;
      case 'ASK_AI':
        setActiveTab('ai');
        break;
      default:
        break;
    }
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'home':
        return <HomeView onNavigateTab={(tab) => setActiveTab(tab)} />;
      case 'money':
        return <MoneyView />;
      case 'family':
        return <FamilyView />;
      case 'vault':
        return <VaultView />;
      case 'ai':
        return <AIView />;
      case 'calendar':
        return <CalendarView />;
      case 'memories':
        return <MemoriesView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <HomeView onNavigateTab={(tab) => setActiveTab(tab)} />;
    }
  };

  return (
    <MobileFrame>
      <PinLockModal />
      <Header
        onOpenSearch={() => setShowSearch(true)}
        onOpenNotifications={() => setShowNotifications(true)}
        onOpenEmergency={() => setActiveTab('family')}
      />

      {renderActiveView()}

      <BottomNav
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        onOpenQuickAction={() => setShowQuickAction(true)}
      />

      <QuickActionModal
        isOpen={showQuickAction}
        onClose={() => setShowQuickAction(false)}
        onActionSelect={handleQuickAction}
      />

      <UniversalSearchModal
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
        onNavigate={(tab) => setActiveTab(tab)}
      />

      <NotificationModal
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        onNavigateTab={(tab) => setActiveTab(tab)}
      />
    </MobileFrame>
  );
};

export function App() {
  return (
    <AuthProvider>
      <SecurityProvider>
        <FamilyProvider>
          <MainAppContent />
        </FamilyProvider>
      </SecurityProvider>
    </AuthProvider>
  );
}

export default App;

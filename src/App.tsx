import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { ThemeProvider } from './context/ThemeContext.js';
import { SecurityProvider } from './context/SecurityContext.js';
import { FamilyProvider } from './context/FamilyContext.js';
import { MobileFrame } from './components/layout/MobileFrame.js';
import { Header } from './components/common/Header.js';
import { BottomNav, TabType } from './components/common/BottomNav.js';
import { QuickActionModal } from './components/common/QuickActionModal.js';
import { UniversalSearchModal } from './components/common/UniversalSearchModal.js';
import { NotificationModal } from './components/common/NotificationModal.js';
import { PinLockModal } from './components/common/PinLockModal.js';
import { ErrorBoundary } from './components/common/ErrorBoundary.js';

import { OnboardingView } from './views/Onboarding/OnboardingView.js';
import { HomeView } from './views/Home/HomeView.js';
import { MoneyView } from './views/Money/MoneyView.js';
import { FamilyView } from './views/Family/FamilyView.js';
import { VaultView } from './views/Vault/VaultView.js';
import { AIView } from './views/AI/AIView.js';
import { CalendarView } from './views/Calendar/CalendarView.js';
import { MemoriesView } from './views/Memories/MemoriesView.js';
import { SettingsView } from './views/Settings/SettingsView.js';
import { FamilyFriendsView } from './views/FamilyFriends/FamilyFriendsView.js';

const MainAppContent: React.FC = () => {
  const { currentUser, family, familyMembers, isLoading, refreshUser, logout } = useAuth();
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(
    () => localStorage.getItem('onefamily_onboarded') === 'true'
  );
  const [isCheckingApproval, setIsCheckingApproval] = useState(false);

  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [showQuickAction, setShowQuickAction] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#020919] flex flex-col items-center justify-center p-6 pt-safe-mobile text-center space-y-4 animate-fade-in">
        <div className="relative">
          <img
            src="/kinoraone-logo.png"
            alt="KinoraOne Logo"
            className="w-20 h-20 rounded-3xl object-cover ring-2 ring-[#16C7F2]/40 shadow-2xl shadow-cyan-500/30 animate-pulse"
          />
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-1">
            <span className="text-2xl font-black tracking-tight text-white">Kinora</span>
            <span className="text-2xl font-black tracking-tight text-[#16C7F2]">One</span>
          </div>
          <p className="text-xs text-slate-400 font-medium">One Home. One Family. One Future.</p>
        </div>
      </div>
    );
  }

  if (!hasCompletedOnboarding || !currentUser) {
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

  // If member has joined via secret key but is awaiting Family Head approval
  const isPendingApproval =
    currentUser.role !== 'FAMILY_HEAD' &&
    (currentUser.is_approved === false || currentUser.status === 'PENDING_APPROVAL');

  if (isPendingApproval) {
    const headMember = familyMembers.find((m) => m.role === 'FAMILY_HEAD');

    return (
      <MobileFrame>
        <div className="p-6 min-h-screen flex flex-col justify-between text-white animate-fade-in bg-slate-900 pt-safe-mobile">
          <div className="space-y-6 pt-6 text-center">
            {/* Header / Avatar */}
            <div className="relative mx-auto w-20 h-20">
              <img
                src={currentUser.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
                alt={currentUser.name}
                className="w-20 h-20 rounded-3xl object-cover ring-4 ring-amber-500/40 shadow-xl"
              />
              <div className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 p-1 rounded-full shadow-lg">
                <span className="text-xs">⏳</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/30">
                Awaiting Head Approval
              </span>
              <h2 className="text-xl font-extrabold text-white tracking-tight">Welcome, {currentUser.name}!</h2>
              <p className="text-xs text-slate-400">
                Connected to <strong className="text-slate-200">{family?.name || 'Your Family'}</strong>
              </p>
            </div>

            {/* Status Card */}
            <div className="p-4 rounded-3xl bg-slate-800/90 border border-slate-700/80 shadow-xl text-left space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
                  <span className="text-sm">🛡️</span>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">Access Pending Review</h3>
                  <p className="text-[10px] text-slate-400">Zero default permissions until approved</p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Your Family Head{headMember ? ` (${headMember.name})` : ''} has been notified. Once they approve your account in their **Family Hub** and select your permitted modules (Finances, Vault, Chores, etc.), your access will unlock immediately.
              </p>

              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Family Key used:</span>
                <span className="font-mono font-bold text-amber-400">{family?.family_key || 'FAM-KEY'}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pb-6">
            <button
              onClick={async () => {
                setIsCheckingApproval(true);
                await refreshUser();
                setTimeout(() => setIsCheckingApproval(false), 800);
              }}
              disabled={isCheckingApproval}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-xl shadow-indigo-500/30 text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <span className={isCheckingApproval ? 'animate-spin' : ''}>🔄</span>
              <span>{isCheckingApproval ? 'Checking Approval Status...' : 'Check Approval Status'}</span>
            </button>

            <button
              onClick={logout}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-2xl border border-slate-700 text-xs font-semibold transition-colors"
            >
              Sign Out / Switch Account
            </button>
          </div>
        </div>
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
      case 'ADD_FRIEND':
        setActiveTab('friends');
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
        return (
          <ErrorBoundary fallbackTitle="Home Dashboard Error">
            <HomeView onNavigateTab={(tab) => setActiveTab(tab)} />
          </ErrorBoundary>
        );
      case 'money':
        return (
          <ErrorBoundary fallbackTitle="Family Wealth & Budget Error">
            <MoneyView />
          </ErrorBoundary>
        );
      case 'family':
        return (
          <ErrorBoundary fallbackTitle="Family Hub Error">
            <FamilyView />
          </ErrorBoundary>
        );
      case 'friends':
        return (
          <ErrorBoundary fallbackTitle="Family & Friends Reminders Error">
            <FamilyFriendsView />
          </ErrorBoundary>
        );
      case 'vault':
        return (
          <ErrorBoundary fallbackTitle="Document Vault Error">
            <VaultView />
          </ErrorBoundary>
        );
      case 'ai':
        return (
          <ErrorBoundary fallbackTitle="FamilyAI Assistant Error">
            <AIView />
          </ErrorBoundary>
        );
      case 'calendar':
        return (
          <ErrorBoundary fallbackTitle="Calendar Error">
            <CalendarView />
          </ErrorBoundary>
        );
      case 'memories':
        return (
          <ErrorBoundary fallbackTitle="Memories Error">
            <MemoriesView />
          </ErrorBoundary>
        );
      case 'settings':
        return (
          <ErrorBoundary fallbackTitle="Settings Error">
            <SettingsView />
          </ErrorBoundary>
        );
      default:
        return (
          <ErrorBoundary fallbackTitle="Home Dashboard Error">
            <HomeView onNavigateTab={(tab) => setActiveTab(tab)} />
          </ErrorBoundary>
        );
    }
  };

  return (
    <MobileFrame>
      <PinLockModal />
      <Header
        onOpenSearch={() => setShowSearch(true)}
        onOpenNotifications={() => setShowNotifications(true)}
        onOpenEmergency={() => setActiveTab('family')}
        onOpenSettings={() => setActiveTab('settings')}
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
    <ErrorBoundary fallbackTitle="KinoraOne Application Error">
      <AuthProvider>
        <ThemeProvider>
          <SecurityProvider>
            <FamilyProvider>
              <MainAppContent />
            </FamilyProvider>
          </SecurityProvider>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;

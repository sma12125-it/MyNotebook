import React, { useState, useEffect, useCallback } from 'react';
import { AppState, TabType, UserProfile } from './types';
import { StorageService } from './services/storage';
import { CloudSyncService, SecurityConfig } from './services/cloudSync';
import { User } from './services/firebase';
import { AlarmManager, TriggeredAlarm } from './services/alarmManager';
import { FullScreenAlarmModal } from './components/alarms/FullScreenAlarmModal';

// Common Navigation & Shell Components
import { Header } from './components/common/Header';
import { MobileBottomNav } from './components/common/MobileBottomNav';
import { DesktopSidebar } from './components/common/DesktopSidebar';
import { MoreMenuModal } from './components/common/MoreMenuModal';

// Modals
import { QuickCaptureModal } from './components/modals/QuickCaptureModal';
import { AIAssistantDrawer } from './components/modals/AIAssistantDrawer';
import { GlobalSearchModal } from './components/modals/GlobalSearchModal';
import { OnboardingModal } from './components/modals/OnboardingModal';
import { AppLockScreen } from './components/security/AppLockScreen';
import { SecurityModal } from './components/security/SecurityModal';

// Views
import { HomeView } from './components/views/HomeView';
import { HealthView } from './components/views/HealthView';
import { MedicationsView } from './components/views/MedicationsView';
import { DoctorsView } from './components/views/DoctorsView';
import { LabTestsView } from './components/views/LabTestsView';
import { DocumentsView } from './components/views/DocumentsView';
import { RemindersView } from './components/views/RemindersView';
import { LifeEventsView } from './components/views/LifeEventsView';
import { JournalView } from './components/views/JournalView';
import { TimelineView } from './components/views/TimelineView';
import { SettingsView } from './components/views/SettingsView';
import { ProfileView } from './components/views/ProfileView';
import { PeriodTrackingView } from './components/views/PeriodTrackingView';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [appState, setAppState] = useState<AppState>(() => StorageService.getAllState());

  // Security & Cloud Sync State
  const [securityConfig, setSecurityConfig] = useState<SecurityConfig>(() =>
    CloudSyncService.getSecurityConfig()
  );
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    const config = CloudSyncService.getSecurityConfig();
    return config.isLockEnabled;
  });
  const [currentUser, setCurrentUser] = useState<User | null>(() =>
    CloudSyncService.getCurrentUser()
  );
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error'>('synced');
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);

  // Theme reactive state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const toggleTheme = useCallback(() => {
    setIsDarkMode((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
      return next;
    });
  }, []);

  // Modals state
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [activeAlarm, setActiveAlarm] = useState<TriggeredAlarm | null>(null);

  // Refresh all state from Storage
  const refreshData = useCallback(() => {
    const updated = StorageService.getAllState();
    setAppState(updated);
  }, []);

  // Initialize Background Alarm & Alert Monitoring
  useEffect(() => {
    AlarmManager.startMonitoring();
    AlarmManager.registerListener((alarm) => {
      setActiveAlarm(alarm);
    });

    const handleCustomAlarm = (e: any) => {
      if (e.detail) {
        setActiveAlarm(e.detail);
      }
    };

    window.addEventListener('mylifeos_trigger_alarm', handleCustomAlarm);
    return () => {
      window.removeEventListener('mylifeos_trigger_alarm', handleCustomAlarm);
      AlarmManager.stopMonitoring();
    };
  }, []);

  // Initialize Cloud Sync & Auth Listener
  useEffect(() => {
    CloudSyncService.init((cloudState) => {
      setAppState(cloudState);
    });

    const unsubscribe = CloudSyncService.onSyncStatusChange((status, user) => {
      setSyncStatus(status);
      setCurrentUser(user);
    });

    return () => unsubscribe();
  }, []);

  // Initial check for onboarding & theme sync
  useEffect(() => {
    if (!StorageService.isOnboardingCompleted()) {
      setIsOnboardingOpen(true);
    }

    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.log('SW registration note:', err);
      });
    }
  }, [isDarkMode]);

  // Global Keyboard Shortcuts (Cmd+K / Ctrl+K for search, Cmd+J for quick capture)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault();
        setIsQuickCaptureOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCompleteOnboarding = (profile: UserProfile) => {
    StorageService.saveProfile(profile);
    StorageService.setOnboardingCompleted();
    setIsOnboardingOpen(false);
    refreshData();
  };

  const handleNavigate = (tab: TabType) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLockNow = () => {
    setIsLocked(true);
  };

  const handleUnlock = () => {
    setIsLocked(false);
  };

  return (
    <div className="min-h-screen bg-[#FDFCF9] dark:bg-[#161D15] text-[#3C3C3B] dark:text-[#E2E8DF] font-sans flex flex-col antialiased selection:bg-[#7C9070] selection:text-white" dir="rtl">
      {/* Top Header */}
      <Header
        profile={appState.profile}
        activeTab={activeTab}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenAI={() => setIsAIAssistantOpen(true)}
        onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
        onNavigateToTab={handleNavigate}
        onToggleDarkMode={toggleTheme}
        isDarkMode={isDarkMode}
        currentUser={currentUser}
        syncStatus={syncStatus}
        onOpenSecurity={() => setIsSecurityModalOpen(true)}
        onLockApp={securityConfig.isLockEnabled ? handleLockNow : undefined}
        isLockEnabled={securityConfig.isLockEnabled}
      />

      {/* Main Layout Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        {/* Desktop Sidebar (hidden on mobile) */}
        <DesktopSidebar
          activeTab={activeTab}
          onNavigate={handleNavigate}
          appState={appState}
        />

        {/* Main Content Area */}
        <main className="flex-1 w-full p-4 sm:p-6 lg:p-8 max-w-5xl">
          {activeTab === 'home' && (
            <HomeView
              appState={appState}
              onNavigateToTab={handleNavigate}
              onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
              onOpenAI={() => setIsAIAssistantOpen(true)}
              onRefreshData={refreshData}
            />
          )}

          {activeTab === 'health' && (
            <HealthView
              profile={appState.profile}
              userProfile={appState.profile}
              measurements={appState.vitals}
              vitals={appState.vitals}
              onRefreshData={refreshData}
              onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
            />
          )}

          {activeTab === 'medications' && (
            <MedicationsView
              medications={appState.medications}
              onRefreshData={refreshData}
              onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
            />
          )}

          {activeTab === 'doctors' && (
            <DoctorsView
              doctors={appState.doctors}
              visits={appState.visits}
              onRefreshData={refreshData}
              onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
            />
          )}

          {activeTab === 'labs' && (
            <LabTestsView
              labs={appState.labs}
              onRefreshData={refreshData}
              onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
            />
          )}

          {activeTab === 'documents' && (
            <DocumentsView
              documents={appState.documents}
              onRefreshData={refreshData}
              onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
            />
          )}

          {activeTab === 'reminders' && (
            <RemindersView
              reminders={appState.reminders}
              onRefreshData={refreshData}
              onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
            />
          )}

          {activeTab === 'events' && (
            <LifeEventsView
              events={appState.events}
              onRefreshData={refreshData}
              onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
            />
          )}

          {activeTab === 'journal' && (
            <JournalView
              entries={appState.journal}
              onRefreshData={refreshData}
              onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
            />
          )}

          {activeTab === 'timeline' && (
            <TimelineView
              appState={appState}
              onNavigateToTab={handleNavigate}
              onRefreshData={refreshData}
              onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileView
              userProfile={appState.profile}
              appState={appState}
              onRefreshData={refreshData}
              onNavigateToTab={handleNavigate}
            />
          )}

          {activeTab === 'period' && (
            <PeriodTrackingView
              appState={appState}
              periodData={appState.periodData}
              userProfile={appState.profile}
              onRefreshData={refreshData}
              onNavigateToTab={handleNavigate}
              onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              userProfile={appState.profile}
              appState={appState}
              onRefreshData={refreshData}
              isDarkMode={isDarkMode}
              onToggleTheme={toggleTheme}
              currentUser={currentUser}
              securityConfig={securityConfig}
              onOpenSecurity={() => setIsSecurityModalOpen(true)}
              onLockNow={handleLockNow}
              onNavigateToTab={handleNavigate}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Fixed at bottom on small screens) */}
      <MobileBottomNav
        activeTab={activeTab}
        onNavigate={handleNavigate}
        onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
        onOpenMoreMenu={() => setIsMoreMenuOpen(true)}
      />

      {/* MODALS */}
      {/* 1. Quick Capture Modal */}
      <QuickCaptureModal
        isOpen={isQuickCaptureOpen}
        onClose={() => setIsQuickCaptureOpen(false)}
        onDataSaved={refreshData}
      />

      {/* 2. AI Assistant Drawer */}
      <AIAssistantDrawer
        isOpen={isAIAssistantOpen}
        onClose={() => setIsAIAssistantOpen(false)}
        appState={appState}
        onOpenQuickCapture={() => {
          setIsAIAssistantOpen(false);
          setIsQuickCaptureOpen(true);
        }}
      />

      {/* 3. Global Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        appState={appState}
        onSelectResult={(tab) => {
          setIsSearchOpen(false);
          handleNavigate(tab);
        }}
      />

      {/* 4. More Menu Modal (Mobile) */}
      <MoreMenuModal
        isOpen={isMoreMenuOpen}
        onClose={() => setIsMoreMenuOpen(false)}
        onNavigate={handleNavigate}
        activeTab={activeTab}
        appState={appState}
      />

      {/* 5. First-time Onboarding Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onComplete={handleCompleteOnboarding}
      />

      {/* 6. Security & Cloud Account Modal */}
      <SecurityModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
        currentUser={currentUser}
        securityConfig={securityConfig}
        onUpdateSecurity={(newConfig) => setSecurityConfig(newConfig)}
        onLockNow={() => {
          setIsSecurityModalOpen(false);
          handleLockNow();
        }}
      />

      {/* 7. App Security Lock Screen */}
      <AppLockScreen
        isLocked={isLocked && securityConfig.isLockEnabled}
        onUnlock={handleUnlock}
        securityConfig={securityConfig}
      />

      {/* 8. Incoming Call-Style Full-Screen Alarm Modal */}
      <FullScreenAlarmModal
        alarm={activeAlarm}
        onClose={() => setActiveAlarm(null)}
        onRefreshData={refreshData}
      />
    </div>
  );
}


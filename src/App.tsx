import React, { useState, useEffect, useCallback } from 'react';
import { AppState, TabType, UserProfile } from './types';
import { StorageService } from './services/storage';

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

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [appState, setAppState] = useState<AppState>(() => StorageService.getAllState());

  // Modals state
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  // Refresh all state from Storage
  const refreshData = useCallback(() => {
    const updated = StorageService.getAllState();
    setAppState(updated);
  }, []);

  // Initial check for onboarding & theme
  useEffect(() => {
    // Check onboarding
    if (!StorageService.isOnboardingCompleted()) {
      setIsOnboardingOpen(true);
    }

    // Set saved theme if exists
    const savedTheme = localStorage.getItem('theme');
    if (
      savedTheme === 'dark' ||
      (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)
    ) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Register service worker for offline support if available
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.log('SW registration note:', err);
      });
    }
  }, []);

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
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              userProfile={appState.profile}
              appState={appState}
              onRefreshData={refreshData}
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
        activeTab={activeTab}
        onNavigate={(tab) => {
          setIsMoreMenuOpen(false);
          handleNavigate(tab);
        }}
      />

      {/* 5. First-time Onboarding Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onComplete={handleCompleteOnboarding}
      />
    </div>
  );
}

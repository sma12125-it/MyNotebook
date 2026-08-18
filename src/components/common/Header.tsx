import React from 'react';
import { Sparkles, Search, Moon, Sun, ShieldCheck } from 'lucide-react';
import { UserProfile, ActiveTab, TabType } from '../../types';
import { getTodayFullPersian } from '../../utils/jalali';

interface HeaderProps {
  profile?: UserProfile;
  activeTab?: ActiveTab | TabType;
  onSelectTab?: (tab: ActiveTab) => void;
  onNavigateToTab?: (tab: TabType) => void;
  onOpenAI: () => void;
  onOpenSearch: () => void;
  onOpenQuickCapture?: () => void;
  onToggleDarkMode?: () => void;
  isOnline?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  activeTab = 'home',
  onSelectTab,
  onNavigateToTab,
  onOpenAI,
  onOpenSearch,
  onToggleDarkMode,
  isOnline = true,
}) => {
  const dateDisplay = getTodayFullPersian();

  const handleNav = (tab: ActiveTab) => {
    if (onNavigateToTab) onNavigateToTab(tab);
    else if (onSelectTab) onSelectTab(tab);
  };

  const handleToggleTheme = () => {
    if (onToggleDarkMode) {
      onToggleDarkMode();
    } else {
      const isDark = document.documentElement.classList.contains('dark');
      if (isDark) {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      } else {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      }
    }
  };

  const isDarkModeActive = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  return (
    <header className="sticky top-0 z-30 bg-[#FDFCF9]/90 dark:bg-[#161D15]/90 backdrop-blur-md border-b border-[#E5E0D5] dark:border-[#2C3A2A] safe-top transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* App Logo & Date Display */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => handleNav('home')}
            className="flex items-center gap-3 text-right group focus:outline-none cursor-pointer"
            title="رفتن به خانه"
          >
            <div className="w-10 h-10 rounded-xl bg-[#7C9070] flex items-center justify-center text-white shadow-xs group-hover:bg-[#6B7D60] transition-colors flex-shrink-0">
              <span className="font-bold text-lg leading-none">د</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base sm:text-lg text-[#2D3A29] dark:text-[#E5EFE2] tracking-tight">
                  دفتر من
                </span>
                {!isOnline && (
                  <span className="text-[11px] font-medium bg-[#E5B58E]/20 text-[#8A5229] dark:text-[#E5B58E] px-2 py-0.5 rounded-full">
                    آفلاین
                  </span>
                )}
              </div>
              <p className="text-xs text-[#8A8A87] dark:text-[#9BA598] truncate font-normal">
                {dateDisplay}
              </p>
            </div>
          </button>
        </div>

        {/* Action Buttons: Search, AI Assistant, Dark Mode, Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Global Search Button */}
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#F5F2EB] dark:bg-[#1F271E] hover:bg-[#EAE5DA] dark:hover:bg-[#283427] border border-[#E5E0D5] dark:border-[#2C3A2A] text-[#5A5A58] dark:text-[#C2C9BE] transition-colors text-xs sm:text-sm font-medium cursor-pointer"
            title="جستجوی سریع (Ctrl+K)"
          >
            <Search className="w-4 h-4 text-[#7C9070] dark:text-[#8DA480]" />
            <span className="hidden sm:inline">جستجو...</span>
          </button>

          {/* AI Assistant Button */}
          <button
            onClick={onOpenAI}
            className="relative flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#7C9070]/10 hover:bg-[#7C9070]/20 border border-[#7C9070]/30 text-[#4A5D45] dark:text-[#8DA480] transition-all text-xs sm:text-sm font-medium shadow-xs cursor-pointer"
            title="دستیار هوشمند دفتر من"
          >
            <Sparkles className="w-4 h-4 text-[#7C9070] dark:text-[#8DA480] animate-pulse" />
            <span className="hidden xs:inline font-semibold">دستیار هوشمند</span>
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={handleToggleTheme}
            className="p-2 rounded-xl text-[#5A5A58] dark:text-[#C2C9BE] bg-[#F5F2EB] dark:bg-[#1F271E] hover:bg-[#EAE5DA] dark:hover:bg-[#283427] border border-[#E5E0D5] dark:border-[#2C3A2A] transition-colors cursor-pointer"
            title="تغییر تم"
            aria-label="تغییر تم"
          >
            {isDarkModeActive ? (
              <Sun className="w-4 h-4 text-[#E5B58E]" />
            ) : (
              <Moon className="w-4 h-4 text-[#4A5D45]" />
            )}
          </button>

          {/* Profile Shortcut */}
          <button
            onClick={() => handleNav('settings')}
            className="w-9 h-9 rounded-xl bg-[#F5F2EB] dark:bg-[#1F271E] border border-[#E5E0D5] dark:border-[#2C3A2A] flex items-center justify-center text-xs font-bold text-[#2D3A29] dark:text-[#E5EFE2] hover:border-[#7C9070] transition-all flex-shrink-0 cursor-pointer"
            title="پروفایل و تنظیمات"
          >
            {profile?.name ? profile.name.slice(0, 1) : <ShieldCheck className="w-4 h-4 text-[#7C9070]" />}
          </button>
        </div>
      </div>
    </header>
  );
};


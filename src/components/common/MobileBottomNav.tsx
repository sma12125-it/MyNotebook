import React from 'react';
import { Home, Plus, Clock, Bell, Menu } from 'lucide-react';
import { ActiveTab, TabType } from '../../types';

interface MobileBottomNavProps {
  activeTab: ActiveTab | TabType;
  onSelectTab?: (tab: ActiveTab) => void;
  onNavigate?: (tab: TabType) => void;
  onOpenQuickCapture: () => void;
  onOpenMoreMenu: () => void;
  unreadRemindersCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  onNavigate,
  onOpenQuickCapture,
  onOpenMoreMenu,
  unreadRemindersCount = 0,
}) => {
  const handleNav = (tab: TabType) => {
    if (onNavigate) onNavigate(tab);
    else if (onSelectTab) onSelectTab(tab);
  };

  return (
    <div className="md:hidden fixed bottom-3 left-4 right-4 z-40 safe-bottom">
      <div className="max-w-md mx-auto bg-[#2D3A29] dark:bg-[#1C241B] rounded-full shadow-2xl border border-[#4A5D45]/40 dark:border-[#2C3A2A] px-4 py-2 flex items-center justify-around text-white/60 backdrop-blur-md">
        {/* Home */}
        <button
          onClick={() => handleNav('home')}
          className={`flex flex-col items-center justify-center py-1 transition-colors cursor-pointer ${
            activeTab === 'home'
              ? 'text-white font-bold'
              : 'hover:text-white/90'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight">خانه</span>
        </button>

        {/* Timeline */}
        <button
          onClick={() => handleNav('timeline')}
          className={`flex flex-col items-center justify-center py-1 transition-colors cursor-pointer ${
            activeTab === 'timeline'
              ? 'text-white font-bold'
              : 'hover:text-white/90'
          }`}
        >
          <Clock className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight">خط زمانی</span>
        </button>

        {/* Center Prominent Quick Capture (+) Button */}
        <div className="flex justify-center -mt-7">
          <button
            onClick={onOpenQuickCapture}
            className="w-13 h-13 rounded-full bg-[#7C9070] hover:bg-[#6B7D60] text-white shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center border-4 border-[#FDFCF9] dark:border-[#161D15] cursor-pointer"
            title="ثبت سریع"
            aria-label="ثبت جدید"
          >
            <Plus className="w-7 h-7 stroke-[2.5]" />
          </button>
        </div>

        {/* Reminders */}
        <button
          onClick={() => handleNav('reminders')}
          className={`relative flex flex-col items-center justify-center py-1 transition-colors cursor-pointer ${
            activeTab === 'reminders'
              ? 'text-white font-bold'
              : 'hover:text-white/90'
          }`}
        >
          <div className="relative">
            <Bell className="w-5 h-5 mb-0.5" />
            {unreadRemindersCount > 0 && (
              <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 bg-[#D97B7B] text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                {unreadRemindersCount}
              </span>
            )}
          </div>
          <span className="text-[10px] leading-tight">یادآوری</span>
        </button>

        {/* More Menu */}
        <button
          onClick={onOpenMoreMenu}
          className={`flex flex-col items-center justify-center py-1 transition-colors cursor-pointer ${
            ['health', 'medications', 'doctors', 'labs', 'documents', 'events', 'journal', 'settings'].includes(activeTab)
              ? 'text-white font-bold'
              : 'hover:text-white/90'
          }`}
        >
          <Menu className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight">بیشتر</span>
        </button>
      </div>
    </div>
  );
};


import React from 'react';
import {
  Home,
  Heart,
  Pill,
  UserCheck,
  FlaskConical,
  FileText,
  Bell,
  Calendar,
  BookOpen,
  FolderTree,
  Clock,
  CalendarDays,
  Settings,
  PlusCircle,
} from 'lucide-react';
import { ActiveTab, TabType, AppState } from '../../types';

interface DesktopSidebarProps {
  activeTab: ActiveTab | TabType;
  onSelectTab?: (tab: ActiveTab) => void;
  onNavigate?: (tab: TabType) => void;
  onOpenQuickCapture?: () => void;
  unreadRemindersCount?: number;
  appState?: AppState;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  activeTab,
  onSelectTab,
  onNavigate,
  onOpenQuickCapture,
  unreadRemindersCount,
  appState,
}) => {
  const handleNav = (tab: TabType) => {
    if (onNavigate) onNavigate(tab);
    else if (onSelectTab) onSelectTab(tab);
  };

  const pendingReminders =
    unreadRemindersCount !== undefined
      ? unreadRemindersCount
      : appState
      ? appState.reminders.filter((r) => !r.isCompleted).length
      : 0;

  const menuItems: Array<{ id: TabType; label: string; icon: React.ComponentType<{ className?: string }>; color: string; badge?: number }> = [
    { id: 'home', label: 'خانه', icon: Home, color: 'text-[#7C9070]' },
    { id: 'health', label: 'سلامت و سنجش‌ها', icon: Heart, color: 'text-[#D97B7B]' },
    { id: 'medications', label: 'داروها', icon: Pill, color: 'text-[#7C9070]' },
    { id: 'doctors', label: 'پزشکان و ویزیت‌ها', icon: UserCheck, color: 'text-[#4A5D45]' },
    { id: 'labs', label: 'آزمایش‌ها', icon: FlaskConical, color: 'text-[#5B7082]' },
    { id: 'documents', label: 'مدارک و اسناد', icon: FileText, color: 'text-[#E5B58E]' },
    { id: 'reminders', label: 'یادآوری‌ها', icon: Bell, color: 'text-[#D97B7B]', badge: pendingReminders },
    { id: 'events', label: 'رویدادها و هزینه‌ها', icon: Calendar, color: 'text-[#7C9070]' },
    { id: 'journal', label: 'یادداشت روزانه', icon: BookOpen, color: 'text-[#8A8A87]' },
    { id: 'timeline', label: 'خط زمانی (Timeline)', icon: Clock, color: 'text-[#4A5D45]' },
    { id: 'settings', label: 'تنظیمات و پشتیبان', icon: Settings, color: 'text-[#8A8A87]' },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 xl:w-72 bg-[#F5F2EB] dark:bg-[#1C241B] border-l border-[#E5E0D5] dark:border-[#2C3A2A] h-[calc(100vh-4rem)] sticky top-16 transition-colors select-none p-4 overflow-y-auto">
      {/* Brand Header inside Sidebar */}
      <div className="flex items-center gap-3 mb-5 px-2">
        <div className="w-10 h-10 bg-[#7C9070] rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-xs flex-shrink-0">
          د
        </div>
        <div>
          <span className="text-lg font-bold text-[#4A5D45] dark:text-[#A8BCA2] block leading-tight">دفتر من</span>
          <span className="text-[11px] text-[#8A8A87] dark:text-[#9BA598]">سامانه مدیریت زندگی و سلامت</span>
        </div>
      </div>

      {/* Quick Capture Large Button */}
      {onOpenQuickCapture && (
        <button
          onClick={onOpenQuickCapture}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 mb-4 rounded-2xl bg-[#7C9070] hover:bg-[#6B7D60] text-white font-bold shadow-sm hover:shadow-md transition-all text-sm group active:scale-[0.98] cursor-pointer"
        >
          <PlusCircle className="w-5 h-5 transition-transform group-hover:rotate-90" />
          <span>ثبت سریع</span>
        </button>
      )}

      {/* Navigation Links */}
      <nav className="space-y-1 flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#7C9070] text-white font-bold shadow-xs'
                  : 'text-[#5A5A58] dark:text-[#C2C9BE] hover:bg-[#EAE5DA] dark:hover:bg-[#263124] hover:text-[#2D3A29] dark:hover:text-[#E5EFE2]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-white' : item.color}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && item.badge > 0 ? (
                <span
                  className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                    isActive ? 'bg-white text-[#7C9070]' : 'bg-[#D97B7B] text-white'
                  }`}
                >
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* Footer Tagline */}
      <div className="pt-4 mt-2 border-t border-[#E5E0D5] dark:border-[#2C3A2A] px-2 text-center text-xs text-[#8A8A87] dark:text-[#9BA598]">
        <p className="font-semibold text-[#4A5D45] dark:text-[#A8BCA2]">دفتر من • سبک زندگی طبیعی</p>
        <p className="mt-0.5 text-[11px]">همه رویدادها و اطلاعات شما امن است.</p>
      </div>
    </aside>
  );
};


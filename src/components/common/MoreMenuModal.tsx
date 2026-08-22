import React from 'react';
import {
  Heart,
  Pill,
  UserCheck,
  FlaskConical,
  FileText,
  Calendar,
  BookOpen,
  Settings,
  X,
  Sparkles,
  User,
} from 'lucide-react';
import { ActiveTab, TabType, AppState } from '../../types';
import { StorageService } from '../../services/storage';

interface MoreMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab?: (tab: ActiveTab) => void;
  onNavigate?: (tab: TabType) => void;
  activeTab?: ActiveTab | TabType;
  appState?: AppState;
}

export const MoreMenuModal: React.FC<MoreMenuModalProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  onNavigate,
  appState,
}) => {
  if (!isOpen) return null;

  const currentProfile = appState?.profile || StorageService.getProfile();
  const isFemale = currentProfile?.gender === 'female';

  const items: Array<{ id: TabType; label: string; desc: string; icon: React.ComponentType<{ className?: string }>; color: string }> = [
    { id: 'health', label: 'سلامت و سنجش‌ها', desc: 'فشار، وزن، قند، ضربان و نمودارها', icon: Heart, color: 'bg-[#D97B7B]/15 text-[#D97B7B]' },
    ...(isFemale
      ? ([{ id: 'period', label: 'چرخه پریود و قاعدگی', desc: 'رهگیری چرخه، علائم و پیش‌بینی موعد', icon: Sparkles, color: 'bg-rose-500/15 text-rose-600 dark:text-rose-400' }] as const)
      : []),
    { id: 'profile', label: 'شناسنامه و سلامت فردی', desc: 'اطلاعات هویتی، بیومتریک و مخاطب اضطراری', icon: User, color: 'bg-[#7C9070]/15 text-[#7C9070]' },
    { id: 'medications', label: 'داروها', desc: 'زمان‌بندی مصرف و هشدار پایان دارو', icon: Pill, color: 'bg-[#7C9070]/15 text-[#7C9070]' },
    { id: 'doctors', label: 'پزشکان و ویزیت‌ها', desc: 'دفترچه پزشکان، نسخه‌ها و ویزیت‌ها', icon: UserCheck, color: 'bg-[#4A5D45]/15 text-[#4A5D45] dark:text-[#A8BCA2]' },
    { id: 'labs', label: 'آزمایش‌ها', desc: 'نتایج آزمایشگاهی و مقایسه دوره‌ای', icon: FlaskConical, color: 'bg-[#5B7082]/15 text-[#5B7082] dark:text-[#8FA7BC]' },
    { id: 'documents', label: 'مدارک و اسناد', desc: 'گاوصندوق اسناد پزشکی و شخصی', icon: FileText, color: 'bg-[#E5B58E]/20 text-[#C4804E]' },
    { id: 'events', label: 'رویدادها و هزینه‌ها', desc: 'خودرو، خانه، تعمیرات و سفرها', icon: Calendar, color: 'bg-[#7C9070]/15 text-[#7C9070]' },
    { id: 'journal', label: 'یادداشت روزانه', desc: 'ثبت حال عمومی، انرژی و افکار روز', icon: BookOpen, color: 'bg-[#8A8A87]/15 text-[#5A5A58] dark:text-[#C2C9BE]' },
    { id: 'settings', label: 'تنظیمات و پشتیبان', desc: 'هوش مصنوعی، قفل امنیتی و خروجی داده‌ها', icon: Settings, color: 'bg-[#4A5D45]/15 text-[#4A5D45] dark:text-[#A8BCA2]' },
  ];

  const handleSelect = (tab: TabType) => {
    if (onNavigate) onNavigate(tab);
    else if (onSelectTab) onSelectTab(tab as ActiveTab);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div className="w-full max-w-lg bg-[#FDFCF9] dark:bg-[#161D15] rounded-t-3xl shadow-2xl p-5 safe-bottom max-h-[85vh] flex flex-col border-t border-[#E5E0D5] dark:border-[#2C3A2A] animate-in slide-in-from-bottom-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#E5E0D5] dark:border-[#2C3A2A]">
          <h3 className="font-bold text-lg text-[#2D3A29] dark:text-[#E5EFE2]">بخش‌های دفتر من</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-[#8A8A87] hover:text-[#2D3A29] dark:hover:text-white hover:bg-[#F5F2EB] dark:hover:bg-[#1F271E] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto py-3 space-y-1.5 flex-1 pr-1">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className="w-full flex items-center gap-3.5 p-3 rounded-2xl hover:bg-[#F5F2EB] dark:hover:bg-[#1F271E] transition-colors text-right group cursor-pointer"
              >
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${item.color} group-hover:scale-105 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[#2D3A29] dark:text-[#E5EFE2] text-sm">
                    {item.label}
                  </div>
                  <div className="text-xs text-[#8A8A87] dark:text-[#9BA598] truncate mt-0.5">
                    {item.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};


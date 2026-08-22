import React, { useState, useEffect } from 'react';
import {
  User,
  Download,
  Upload,
  Moon,
  Sun,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Printer,
  RotateCcw,
  Shield,
  Heart,
  Phone,
  Cloud,
  Lock,
  KeyRound,
  Grid3X3,
  Fingerprint,
  ScanFace,
  LogIn,
  LogOut,
  RefreshCw,
  Sparkles,
  Cpu,
  Volume2,
  Bell,
  Key,
  Check,
  Eye,
  EyeOff,
} from 'lucide-react';
import { UserProfile, AppState, TabType } from '../../types';
import { StorageService } from '../../services/storage';
import { CloudSyncService, SecurityConfig } from '../../services/cloudSync';
import { User as FirebaseUser } from '../../services/firebase';
import { AIService } from '../../services/aiService';
import { AlarmManager } from '../../services/alarmManager';
import { AlarmSoundService } from '../../services/alarmSoundService';
import { ProfileView } from './ProfileView';

interface SettingsViewProps {
  userProfile?: UserProfile;
  profile?: UserProfile;
  appState: AppState;
  onRefreshData: () => void;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
  currentUser?: FirebaseUser | null;
  securityConfig?: SecurityConfig;
  onOpenSecurity?: () => void;
  onLockNow?: () => void;
  onNavigateToTab?: (tab: TabType) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  userProfile,
  profile: propProfile,
  appState,
  onRefreshData,
  isDarkMode,
  onToggleTheme,
  currentUser,
  securityConfig,
  onOpenSecurity,
  onLockNow,
  onNavigateToTab,
}) => {
  const currentProfile = userProfile || propProfile || appState.profile || StorageService.getProfile();
  
  const [profile, setProfile] = useState<UserProfile>(() => ({
    ...currentProfile,
    fullName: currentProfile.fullName || currentProfile.name || '',
    name: currentProfile.name || currentProfile.fullName || '',
    bloodType: currentProfile.bloodType || currentProfile.bloodGroup || 'O+',
    allergies: currentProfile.allergies || [],
    medicalConditions: currentProfile.medicalConditions || [],
  }));

  // Internal subview toggle if opened from settings
  const [subView, setSubView] = useState<'settings' | 'profile'>('settings');

  const [allergiesInput, setAllergiesInput] = useState<string>(
    (currentProfile.allergies || []).join('، ')
  );
  const [conditionsInput, setConditionsInput] = useState<string>(
    (currentProfile.medicalConditions || []).join('، ')
  );

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isResetSampleModalOpen, setIsResetSampleModalOpen] = useState(false);

  // Gemini API Key & AI Engine State
  const [customApiKey, setCustomApiKey] = useState<string>(() => StorageService.getCustomApiKey());
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTestingApiKey, setIsTestingApiKey] = useState(false);
  const [testKeyFeedback, setTestKeyFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Sync profile when external state updates
  useEffect(() => {
    if (userProfile || propProfile) {
      const active = userProfile || propProfile!;
      setProfile((prev) => ({
        ...prev,
        ...active,
        fullName: active.fullName || active.name || '',
        name: active.name || active.fullName || '',
        bloodType: active.bloodType || active.bloodGroup || 'O+',
      }));
      setAllergiesInput((active.allergies || []).join('، '));
      setConditionsInput((active.medicalConditions || []).join('، '));
    }
  }, [userProfile, propProfile]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Profile Form update
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = profile.fullName.trim() || profile.name.trim() || 'کاربر گرامی';
    const parsedAllergies = allergiesInput
      .split(/[,،]/)
      .map((s) => s.trim())
      .filter(Boolean);
    const parsedConditions = conditionsInput
      .split(/[,،]/)
      .map((s) => s.trim())
      .filter(Boolean);

    const updatedProfile: UserProfile = {
      ...profile,
      name: finalName,
      fullName: finalName,
      bloodType: profile.bloodType || 'O+',
      bloodGroup: (profile.bloodType || 'O+') as any,
      allergies: parsedAllergies,
      medicalConditions: parsedConditions,
      hasSeenOnboarding: true,
    };

    StorageService.saveProfile(updatedProfile);
    setProfile(updatedProfile);
    showToast('اطلاعات و تنظیمات پروفایل با موفقیت ذخیره شد.');
    onRefreshData();
  };

  // Toggle Theme
  const handleThemeToggle = () => {
    if (onToggleTheme) {
      onToggleTheme();
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

  // Save Custom Gemini API Key
  const handleSaveApiKey = () => {
    StorageService.setCustomApiKey(customApiKey);
    showToast(customApiKey.trim() ? 'کلید هوش مصنوعی اختصاصی ذخیره شد.' : 'کلید هوش مصنوعی حذف و موتور داخلی فعال شد.');
    setTestKeyFeedback(null);
  };

  // Test Custom Gemini API Key
  const handleTestApiKey = async () => {
    if (!customApiKey.trim()) {
      showToast('لطفاً ابتدا کلید API را وارد کنید.');
      return;
    }
    setIsTestingApiKey(true);
    setTestKeyFeedback(null);
    try {
      const res = await AIService.testApiKey(customApiKey.trim());
      setTestKeyFeedback(res);
      if (res.success) {
        showToast('اتصال با موفقیت تأیید شد.');
      }
    } catch {
      setTestKeyFeedback({ success: false, message: 'خطا در برقراری اتصال به سرور.' });
    } finally {
      setIsTestingApiKey(false);
    }
  };

  // Test Phone Call Alarm
  const handleTestAlarm = () => {
    AlarmManager.testAlarm();
  };

  // Preview Chime Sound
  const handlePreviewSound = () => {
    AlarmSoundService.previewSound();
    showToast('پیش‌نمایش صدای زنگ پخش شد.');
  };

  // Export JSON Backup
  const handleExportBackup = () => {
    const jsonString = StorageService.exportBackupJson();
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `daftar-man-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('فایل پشتیبان کامل با موفقیت دانلود شد.');
  };

  // Import JSON Backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const success = StorageService.importBackupJson(content);
        if (success) {
          showToast('اطلاعات فایل پشتیبان با موفقیت بازیابی شد.');
          onRefreshData();
        } else {
          showToast('فرمت فایل پشتیبان نامعتبر است.');
        }
      } catch (err) {
        showToast('خطا در بارگذاری و پردازش فایل پشتیبان.');
      }
    };
    reader.readAsText(file);
  };

  // Print Summary
  const handlePrintSummary = () => {
    window.print();
  };

  // Confirm Clear All Data
  const executeClearAll = () => {
    StorageService.clearAllData();
    setIsClearModalOpen(false);
    showToast('تمامی اطلاعات و سوابق پاکسازی شدند.');
    onRefreshData();
  };

  // Confirm Reset to Sample Data
  const executeResetSample = () => {
    StorageService.resetToSampleData();
    setIsResetSampleModalOpen(false);
    showToast('داده‌های نمونه اولیه با موفقیت بارگذاری شدند.');
    onRefreshData();
  };

  const isDarkActive = typeof isDarkMode === 'boolean' 
    ? isDarkMode 
    : (typeof document !== 'undefined' && document.documentElement.classList.contains('dark'));

  if (subView === 'profile') {
    return (
      <ProfileView
        userProfile={profile}
        appState={appState}
        onRefreshData={onRefreshData}
        onNavigateToTab={(tab) => {
          if (tab === 'settings') {
            setSubView('settings');
          } else if (onNavigateToTab) {
            onNavigateToTab(tab);
          }
        }}
      />
    );
  }

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-foreground">
            تنظیمات و مدیریت اطلاعات
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            پیکربندی سیستم، هوش مصنوعی، حریم خصوصی و پشتیبان‌گیری
          </p>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3.5 bg-primary text-white rounded-2xl flex items-center gap-2.5 text-xs sm:text-sm font-bold shadow-lg animate-in fade-in sticky top-20 z-40">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Cloud Database & Security Lock Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-card border border-border shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3.5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-foreground">
                پایگاه داده آنلاین، حساب کاربری و امنیت
              </h3>
              <p className="text-xs text-muted-foreground">
                ذخیره اطلاعات در فضای ابری و قفل محرمانه با رمز، پترن و بیومتریک
              </p>
            </div>
          </div>
          {onOpenSecurity && (
            <button
              type="button"
              onClick={onOpenSecurity}
              className="px-3.5 py-1.5 rounded-xl bg-primary text-white text-xs font-bold shadow-xs hover:bg-[#687a5e] transition-all cursor-pointer"
            >
              تنظیمات امنیتی
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
          {/* Cloud Sync Status */}
          <div className="p-4 rounded-2xl bg-muted/40 border border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-xs sm:text-sm text-foreground">
                  {currentUser ? 'پایگاه داده ابری فعال' : 'حالت محلی (آفلاین)'}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {currentUser
                    ? `کاربر: ${currentUser.email || currentUser.displayName}`
                    : 'برای همگام‌سازی بین گوشی و رایانه وارد شوید'}
                </p>
              </div>
            </div>
            {currentUser ? (
              <button
                type="button"
                onClick={() => {
                  CloudSyncService.pushLocalToCloud();
                  showToast('داده‌ها با پایگاه داده ابری همگام‌سازی شدند.');
                }}
                className="p-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-all cursor-pointer"
                title="همگام‌سازی فوری با ابر"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenSecurity}
                className="px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-[#687a5e] transition-all cursor-pointer"
              >
                ورود به حساب
              </button>
            )}
          </div>

          {/* App Lock Status */}
          <div className="p-4 rounded-2xl bg-muted/40 border border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-xs sm:text-sm text-foreground">
                  قفل امنیتی برنامه
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {securityConfig?.isLockEnabled
                    ? 'قفل با رمز، الگو و اثر انگشت فعال است'
                    : 'قفل برنامه غیرفعال است'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {onLockNow && securityConfig?.isLockEnabled && (
                <button
                  type="button"
                  onClick={onLockNow}
                  className="px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-all cursor-pointer"
                >
                  قفل فوری
                </button>
              )}
              {onOpenSecurity && (
                <button
                  type="button"
                  onClick={onOpenSecurity}
                  className="px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-bold transition-all cursor-pointer"
                >
                  مدیریت قفل
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dedicated Card for Personal & Health Profile */}
      <div className="p-5 sm:p-6 rounded-3xl bg-card border border-border shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold flex-shrink-0">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
                <span>اطلاعات شناسنامه‌ای و پرونده سلامت</span>
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                  صفحه اختصاصی
                </span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                مشخصات فردی، سال تولد، جنسیت، قد، وزن پایه، گروه خونی، آلرژی‌ها و بیماری‌های زمینه‌ای
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (onNavigateToTab) onNavigateToTab('profile');
              else setSubView('profile');
            }}
            className="px-5 py-3 rounded-2xl bg-primary hover:bg-[#687a5e] text-white font-extrabold text-xs sm:text-sm shadow-md shadow-primary/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 whitespace-nowrap self-stretch sm:self-auto"
          >
            <User className="w-4 h-4" />
            <span>مشاهده و ویرایش شناسنامه سلامت</span>
          </button>
        </div>

        {/* Quick Summary Badges */}
        <div className="pt-3 border-t border-border grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="p-3 rounded-2xl bg-background border border-border">
            <span className="text-[10px] text-muted-foreground block font-medium">نام و مشخصات:</span>
            <span className="font-bold text-foreground truncate block mt-0.5">{profile.fullName || profile.name || 'کاربر گرامی'}</span>
          </div>
          <div className="p-3 rounded-2xl bg-background border border-border">
            <span className="text-[10px] text-muted-foreground block font-medium">جنسیت:</span>
            <span className="font-bold text-foreground block mt-0.5">
              {profile.gender === 'female' ? 'زن (بانوان)' : profile.gender === 'male' ? 'مرد (آقایان)' : 'سایر / نامشخص'}
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-background border border-border">
            <span className="text-[10px] text-muted-foreground block font-medium">گروه خونی:</span>
            <span className="font-bold text-foreground font-mono block mt-0.5">{profile.bloodType || profile.bloodGroup || 'O+'}</span>
          </div>
          <div className="p-3 rounded-2xl bg-background border border-border">
            <span className="text-[10px] text-muted-foreground block font-medium">قد و وزن پایه:</span>
            <span className="font-bold text-foreground font-mono block mt-0.5">
              {profile.heightCm ? `${profile.heightCm}cm` : '-'} / {profile.weightKg ? `${profile.weightKg}kg` : '-'}
            </span>
          </div>
        </div>

        {/* Conditional Period Tracking Shortcut for Female */}
        {profile.gender === 'female' && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-extrabold text-rose-700 dark:text-rose-300 block">
                  رهگیری و ثبت وضعیت چرخه قاعدگی و پریود
                </span>
                <span className="text-[11px] text-muted-foreground">
                  پیش‌بینی موعد بعدی، روزهای تخمک‌گذاری، ثبت شدت درد و حالات روحی
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (onNavigateToTab) onNavigateToTab('period');
              }}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-all whitespace-nowrap cursor-pointer self-start sm:self-auto active:scale-95"
            >
              ورود به بخش چرخه پریود
            </button>
          </div>
        )}
      </div>

      {/* Appearance & Preferences */}
      <div className="p-5 sm:p-6 rounded-3xl bg-card border border-border shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-border">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <Moon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-foreground">
              ظاهر و تم برنامه
            </h3>
            <p className="text-xs text-muted-foreground">
              تغییر حالت شب و روز با پالت طبیعی (Natural Olive & Forest)
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/40 border border-border">
          <div>
            <span className="font-bold text-xs sm:text-sm text-foreground">
              حالت شب (Dark Mode)
            </span>
            <p className="text-xs text-muted-foreground">
              کاهش خستگی چشم و مصرف باتری در محیط‌های کم‌نور
            </p>
          </div>

          <button
            type="button"
            onClick={handleThemeToggle}
            className="px-4 py-2.5 rounded-2xl bg-primary hover:bg-[#687a5e] text-white transition-all flex items-center gap-2 text-xs font-bold shadow-sm cursor-pointer"
          >
            {isDarkActive ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-white" />}
            <span>{isDarkActive ? 'حالت روشن' : 'حالت شب'}</span>
          </button>
        </div>
      </div>

      {/* AI Assistant & Gemini Engine Configuration */}
      <div className="p-5 sm:p-6 rounded-3xl bg-card border border-border shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-foreground">
                  موتور هوش مصنوعی و کلید اختصاصی
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                  customApiKey.trim()
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                    : 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800'
                }`}>
                  {customApiKey.trim() ? '✨ متصل به کلید ابری Gemini' : '⚡ موتور داخلی بدون نیاز به کلید فعال'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                پاسخگویی فوق سریع محلی بدون نیاز به کلید + امکان ارتقا به هوش پیشرفته با Gemini API Key
              </p>
            </div>
          </div>
        </div>

        {/* Dual Mode Explanation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900/40 flex items-start gap-2.5">
            <Cpu className="w-4 h-4 text-teal-600 dark:text-teal-400 mt-0.5 shrink-0" />
            <div>
              <span className="font-bold text-teal-900 dark:text-teal-200 block">
                ۱. موتور هوشمند داخلی (همیشه فعال و رایگان):
              </span>
              <p className="text-teal-700 dark:text-teal-300 mt-0.5 leading-relaxed">
                بدون نیاز به اینترنت و بدون نیاز به هیچ کلیدی، تمامی سوالات درباره آب، فشار خون، داروها، یادآوری‌ها و هزینه‌ها به صورت آنی و لحظه‌ای پاسخ داده می‌شوند.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <span className="font-bold text-emerald-900 dark:text-emerald-200 block">
                ۲. اتصال به Gemini API اختصاصی:
              </span>
              <p className="text-emerald-700 dark:text-emerald-300 mt-0.5 leading-relaxed">
                در صورت تمایل می‌توانید API Key رایگان خود را از Google AI Studio وارد کنید تا پاسخ‌های عمیق‌تر، تحلیلی‌تر و خلاصه‌سازی پزشکی پیشرفته فعال شود.
              </p>
            </div>
          </div>
        </div>

        {/* API Key Input Section */}
        <div className="space-y-3 pt-2">
          <label className="block text-xs font-bold text-foreground">
            کلید اختصاصی Google Gemini API (اختیاری):
          </label>
          <div className="relative flex items-center">
            <div className="absolute right-3 text-muted-foreground pointer-events-none">
              <Key className="w-4 h-4" />
            </div>
            <input
              type={showApiKey ? 'text' : 'password'}
              value={customApiKey}
              onChange={(e) => {
                setCustomApiKey(e.target.value);
                setTestKeyFeedback(null);
              }}
              placeholder="AIzaSy..."
              className="w-full pr-9 pl-10 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs sm:text-sm font-mono focus:border-primary focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute left-3 text-muted-foreground hover:text-foreground p-1 cursor-pointer"
              title={showApiKey ? 'مخفی کردن کلید' : 'نمایش کلید'}
            >
              {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Action Buttons: Save, Test, Clear */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleSaveApiKey}
              className="px-4 py-2 rounded-xl bg-primary hover:bg-[#687a5e] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>ذخیره کلید هوش مصنوعی</span>
            </button>

            <button
              type="button"
              onClick={handleTestApiKey}
              disabled={isTestingApiKey || !customApiKey.trim()}
              className="px-4 py-2 rounded-xl bg-muted/70 hover:bg-muted border border-border text-foreground text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {isTestingApiKey ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-primary" />
              )}
              <span>{isTestingApiKey ? 'در حال تست اتصال...' : 'تست و اعتبارسنجی اتصال'}</span>
            </button>

            {customApiKey.trim() && (
              <button
                type="button"
                onClick={() => {
                  setCustomApiKey('');
                  StorageService.setCustomApiKey('');
                  setTestKeyFeedback(null);
                  showToast('کلید اختصاصی حذف شد؛ موتور داخلی مجدداً فعال است.');
                }}
                className="px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-medium transition-all cursor-pointer mr-auto"
              >
                حذف کلید و بازگشت به موتور داخلی
              </button>
            )}
          </div>

          {/* Test Feedback Notice */}
          {testKeyFeedback && (
            <div className={`p-3 rounded-xl border text-xs font-medium flex items-center gap-2 ${
              testKeyFeedback.success
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
            }`}>
              {testKeyFeedback.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{testKeyFeedback.message}</span>
            </div>
          )}
        </div>
      </div>

      {/* Full-Screen Alarm & Call Ringtone Settings */}
      <div className="p-5 sm:p-6 rounded-3xl bg-card border border-border shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-border">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white flex items-center justify-center font-bold shadow-sm">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-foreground">
              سیستم آلارم و هشدار تمام‌صفحه تلفنی
            </h3>
            <p className="text-xs text-muted-foreground">
              هشدارهای داروها و یادآوری‌ها مانند تماس ورودی تلفن به صورت بزرگ، با لرزش و صدای زنگ پخش می‌شوند.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
          {/* Test Alarm Full Screen */}
          <button
            type="button"
            onClick={handleTestAlarm}
            className="p-4 rounded-2xl bg-muted/40 border border-border hover:border-amber-500/50 transition-all flex flex-col items-center justify-center text-center gap-2 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Phone className="w-5 h-5 animate-pulse" />
            </div>
            <span className="font-bold text-foreground">
              تست آلارم و زنگ تلفنی تمام‌صفحه 🔔
            </span>
            <span className="text-[11px] text-muted-foreground">
              مشاهده صفحه تماس ورودی و آزمایش قطع/تعویق
            </span>
          </button>

          {/* Test Chime Ringtone */}
          <button
            type="button"
            onClick={handlePreviewSound}
            className="p-4 rounded-2xl bg-muted/40 border border-border hover:border-primary transition-all flex flex-col items-center justify-center text-center gap-2 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
              <Volume2 className="w-5 h-5" />
            </div>
            <span className="font-bold text-foreground">
              پیش‌نمایش صدای ملودی زنگ
            </span>
            <span className="text-[11px] text-muted-foreground">
              تست صدای تولیدی Web Audio API با فرکانس‌های ملودیک
            </span>
          </button>
        </div>
      </div>

      {/* Backup, Export & Print */}
      <div className="p-5 sm:p-6 rounded-3xl bg-card border border-border shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-border">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-foreground">
              پشتیبان‌گیری آفلاین و خروجی
            </h3>
            <p className="text-xs text-muted-foreground">
              تمام اطلاعات در مرورگر شما ذخیره شده و می‌توانید فایل JSON پشتیبان دریافت کنید.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
          {/* Export JSON */}
          <button
            type="button"
            onClick={handleExportBackup}
            className="p-4 rounded-2xl bg-muted/40 border border-border hover:border-primary transition-all flex flex-col items-center justify-center text-center gap-2 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
              <Download className="w-5 h-5" />
            </div>
            <span className="font-bold text-foreground">
              دانلود پشتیبان کامل (JSON)
            </span>
            <span className="text-[11px] text-muted-foreground">
              تمام داروها، آزمایش‌ها، ویزیت‌ها و اسناد
            </span>
          </button>

          {/* Import JSON */}
          <label className="p-4 rounded-2xl bg-muted/40 border border-border hover:border-primary transition-all flex flex-col items-center justify-center text-center gap-2 cursor-pointer group">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
              <Upload className="w-5 h-5" />
            </div>
            <span className="font-bold text-foreground">
              بازیابی فایل پشتیبان
            </span>
            <span className="text-[11px] text-muted-foreground">
              انتخاب فایل JSON قبلی جهت بازگردانی
            </span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              className="hidden"
            />
          </label>

          {/* Print Summary */}
          <button
            type="button"
            onClick={handlePrintSummary}
            className="p-4 rounded-2xl bg-muted/40 border border-border hover:border-primary transition-all flex flex-col items-center justify-center text-center gap-2 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
              <Printer className="w-5 h-5" />
            </div>
            <span className="font-bold text-foreground">
              چاپ یا ذخیره PDF پرونده سلامت
            </span>
            <span className="text-[11px] text-muted-foreground">
              خلاصه وضعیت جهت ارائه به پزشک
            </span>
          </button>
        </div>
      </div>

      {/* Data Management & Sample Reset */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Reset to Sample Demo */}
        <div className="p-5 rounded-3xl bg-card border border-border shadow-xs flex flex-col justify-between gap-3">
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-foreground flex items-center gap-1.5">
              <RotateCcw className="w-4 h-4 text-primary" />
              بارگذاری داده‌های نمونه اولیه
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              مجموعه‌ای از داروهای نمونه، آزمایش‌ها و ویزیت‌ها جهت بررسی امکانات برنامه
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsResetSampleModalOpen(true)}
            className="px-4 py-2.5 rounded-xl border border-primary text-primary hover:bg-primary/10 text-xs font-bold flex items-center justify-center gap-1.5 transition-all self-start"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>بارگذاری اطلاعات نمونه</span>
          </button>
        </div>

        {/* Danger Zone: Clear Data */}
        <div className="p-5 rounded-3xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 shadow-xs flex flex-col justify-between gap-3">
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              پاک کردن همه اطلاعات (خالی کردن دفترچه)
            </h4>
            <p className="text-xs text-rose-700/90 dark:text-rose-300/80 mt-1">
              تمام داروها، آزمایش‌ها، ویزیت‌ها و سوابق پاکسازی شده و برنامه کاملاً خام می‌شود.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsClearModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-rose-500/20 self-start"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>پاکسازی کامل همه اطلاعات</span>
          </button>
        </div>
      </div>

      {/* Clear Confirmation Modal */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card text-foreground p-6 rounded-3xl border border-border shadow-2xl max-w-md w-full space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/30 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="font-extrabold text-base sm:text-lg text-foreground">
                آیا از پاک کردن تمامی اطلاعات مطمئن هستید؟
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                با این کار تمامی داروها، آزمایش‌ها، یادآوری‌ها، رویدادها، ویزیت‌های پزشک و اسناد ثبت شده در این مرورگر حذف خواهند شد و یک دفترچه خالی در اختیارتان قرار می‌گیرد.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsClearModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-border bg-muted/40 hover:bg-muted text-foreground text-xs sm:text-sm font-bold"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={executeClearAll}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-rose-600/25"
              >
                بله، همه را پاک کن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Sample Confirmation Modal */}
      {isResetSampleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card text-foreground p-6 rounded-3xl border border-border shadow-2xl max-w-md w-full space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="font-extrabold text-base sm:text-lg text-foreground">
                بارگذاری مجدد داده‌های نمونه اولیه
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                آیا مایلید داده‌های نمونه پیش‌فرض (داروها، آزمایش‌ها، رویدادهای خودرو و منزل) مجدداً بارگذاری شوند؟
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsResetSampleModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-border bg-muted/40 hover:bg-muted text-foreground text-xs sm:text-sm font-bold"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={executeResetSample}
                className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-[#687a5e] text-white text-xs sm:text-sm font-bold shadow-md shadow-primary/25"
              >
                بارگذاری نمونه‌ها
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

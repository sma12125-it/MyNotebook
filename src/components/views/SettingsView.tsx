import React, { useState } from 'react';
import {
  Settings,
  User,
  Download,
  Upload,
  Moon,
  Sun,
  Shield,
  Smartphone,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Printer,
} from 'lucide-react';
import { UserProfile, AppState } from '../../types';
import { StorageService } from '../../services/storage';
import { toFaDigits } from '../../utils/jalali';

interface SettingsViewProps {
  userProfile?: UserProfile;
  profile?: UserProfile;
  appState: AppState;
  onRefreshData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  userProfile,
  profile: propProfile,
  appState,
  onRefreshData,
}) => {
  const initialProfile = userProfile || propProfile || StorageService.getProfile() || { id: 'user-default', name: 'علی رضایی' };
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [isSavedToast, setIsSavedToast] = useState(false);
  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains('dark')
  );

  // Profile Form update
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.saveProfile(profile);
    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 3000);
    onRefreshData();
  };

  // Toggle Theme
  const toggleTheme = () => {
    if (document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
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
          alert('اطلاعات با موفقیت بازیابی شد.');
          onRefreshData();
        } else {
          alert('فرمت فایل پشتیبان نامعتبر است.');
        }
      } catch (err) {
        alert('خطا در خواندن فایل پشتیبان.');
      }
    };
    reader.readAsText(file);
  };

  // Print Summary
  const handlePrintSummary = () => {
    window.print();
  };

  // Clear All Data
  const handleClearAll = () => {
    if (
      window.confirm(
        'آیا از حذف کامل تمام اطلاعات دفترچه و سوابق خود مطمئن هستید؟ این عمل غیرقابل بازگشت است.'
      )
    ) {
      StorageService.clearAllData();
      onRefreshData();
      alert('تمام اطلاعات پاکسازی شد.');
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-foreground">
            تنظیمات و مدیریت اطلاعات
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            پروفایل فردی، پشتیبان‌گیری آفلاین، تم و حریم خصوصی
          </p>
        </div>
      </div>

      {isSavedToast && (
        <div className="p-3 bg-primary text-white rounded-2xl flex items-center gap-2 text-xs font-bold shadow-lg animate-in fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>تغییرات پروفایل با موفقیت ذخیره شد.</span>
        </div>
      )}

      {/* Profile Form */}
      <div className="p-5 rounded-3xl bg-card border border-border shadow-xs">
        <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-border">
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <User className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-sm text-foreground">
            اطلاعات شناسنامه‌ای و سلامت فردی
          </h3>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-muted-foreground mb-1">نام و نام خانوادگی</label>
              <input
                type="text"
                value={profile.fullName}
                onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground font-bold"
              />
            </div>
            <div>
              <label className="block text-muted-foreground mb-1">شماره همراه</label>
              <input
                type="tel"
                value={profile.phoneNumber || ''}
                onChange={(e) => setProfile({ ...profile, phoneNumber: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div>
              <label className="block text-muted-foreground mb-1">سال تولد (شمسی)</label>
              <input
                type="text"
                value={profile.birthYearJalali || ''}
                onChange={(e) => setProfile({ ...profile, birthYearJalali: e.target.value })}
                placeholder="1368"
                className="w-full p-2 rounded-xl border border-border bg-background text-foreground font-mono text-center"
              />
            </div>
            <div>
              <label className="block text-muted-foreground mb-1">گروه خونی</label>
              <select
                value={profile.bloodType}
                onChange={(e) => setProfile({ ...profile, bloodType: e.target.value })}
                className="w-full p-2 rounded-xl border border-border bg-background text-foreground font-mono text-center"
              >
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>
            <div>
              <label className="block text-muted-foreground mb-1">قد (سانتی‌متر)</label>
              <input
                type="number"
                value={profile.heightCm || ''}
                onChange={(e) => setProfile({ ...profile, heightCm: parseInt(e.target.value, 10) })}
                className="w-full p-2 rounded-xl border border-border bg-background text-foreground font-mono text-center"
              />
            </div>
            <div>
              <label className="block text-muted-foreground mb-1">تماس اضطراری (ICE)</label>
              <input
                type="tel"
                value={profile.emergencyContact || ''}
                onChange={(e) => setProfile({ ...profile, emergencyContact: e.target.value })}
                placeholder="0912..."
                className="w-full p-2 rounded-xl border border-border bg-background text-foreground font-mono text-center"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-primary hover:bg-[#687a5e] text-white font-bold text-xs shadow-md shadow-primary/25 transition-all"
            >
              ذخیره تغییرات پروفایل
            </button>
          </div>
        </form>
      </div>

      {/* Appearance & Preferences */}
      <div className="p-5 rounded-3xl bg-card border border-border shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-border">
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <Moon className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-sm text-foreground">
            ظاهر و تم برنامه
          </h3>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="font-bold text-xs sm:text-sm text-foreground">
              حالت شب (Dark Mode)
            </span>
            <p className="text-xs text-muted-foreground">
              کاهش خستگی چشم در محیط‌های کم‌نور
            </p>
          </div>

          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-2xl bg-muted hover:bg-muted/80 text-foreground transition-all flex items-center gap-2 text-xs font-bold"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-primary" />}
            <span>{isDark ? 'روشن' : 'تاریک'}</span>
          </button>
        </div>
      </div>

      {/* Backup, Export & Print */}
      <div className="p-5 rounded-3xl bg-card border border-border shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-border">
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <Download className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-sm text-foreground">
            پشتیبان‌گیری، خروجی و گزارش
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {/* Export JSON */}
          <button
            onClick={handleExportBackup}
            className="p-4 rounded-2xl bg-muted/40 border border-border hover:border-primary transition-all flex flex-col items-center justify-center text-center gap-2"
          >
            <Download className="w-5 h-5 text-primary" />
            <span className="font-bold text-foreground">
              دانلود پشتیبان کامل (JSON)
            </span>
            <span className="text-[10px] text-muted-foreground">
              تمام داروها، آزمایش‌ها، ویزیت‌ها و اسناد
            </span>
          </button>

          {/* Import JSON */}
          <label className="p-4 rounded-2xl bg-muted/40 border border-border hover:border-primary transition-all flex flex-col items-center justify-center text-center gap-2 cursor-pointer">
            <Upload className="w-5 h-5 text-primary" />
            <span className="font-bold text-foreground">
              بازیابی فایل پشتیبان
            </span>
            <span className="text-[10px] text-muted-foreground">
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
            onClick={handlePrintSummary}
            className="p-4 rounded-2xl bg-muted/40 border border-border hover:border-primary transition-all flex flex-col items-center justify-center text-center gap-2"
          >
            <Printer className="w-5 h-5 text-primary" />
            <span className="font-bold text-foreground">
              چاپ یا خروجی پرونده سلامت
            </span>
            <span className="text-[10px] text-muted-foreground">
              ارائه به پزشک یا بیمارستان
            </span>
          </button>
        </div>
      </div>

      {/* Danger Zone: Clear Data */}
      <div className="p-5 rounded-3xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="font-bold text-xs sm:text-sm text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            پاکسازی تمام داده‌ها و تنظیم مجدد
          </h4>
          <p className="text-xs text-rose-700/80 dark:text-rose-300/80 mt-0.5">
            تمام داده‌های محلی پاک شده و برنامه به حالت پیش‌فرض اولیه برمی‌گردد.
          </p>
        </div>

        <button
          onClick={handleClearAll}
          className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto transition-all shadow-md shadow-rose-500/20"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>حذف کل اطلاعات</span>
        </button>
      </div>
    </div>
  );
};

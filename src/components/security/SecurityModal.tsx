import React, { useState } from 'react';
import {
  X,
  Shield,
  KeyRound,
  Grid3X3,
  Fingerprint,
  ScanFace,
  CheckCircle2,
  Cloud,
  LogOut,
  LogIn,
  Lock,
  Smartphone,
  RefreshCw,
} from 'lucide-react';
import { PatternLock } from './PatternLock';
import { CloudSyncService, SecurityConfig } from '../../services/cloudSync';
import { StorageService } from '../../services/storage';
import { User } from '../../services/firebase';

interface SecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  securityConfig: SecurityConfig;
  onUpdateSecurity: (newConfig: SecurityConfig) => void;
  onLockNow: () => void;
}

export const SecurityModal: React.FC<SecurityModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  securityConfig,
  onUpdateSecurity,
  onLockNow,
}) => {
  const [config, setConfig] = useState<SecurityConfig>(securityConfig);
  const [activeSubView, setActiveSubView] = useState<'main' | 'set_pin' | 'set_pattern'>('main');
  const [pinTemp, setPinTemp] = useState('');
  const [patternTemp, setPatternTemp] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleToggleLock = (enabled: boolean) => {
    const next = { ...config, isLockEnabled: enabled };
    setConfig(next);
    onUpdateSecurity(next);
    CloudSyncService.saveSecurityConfig(next);
    showSuccess(enabled ? 'قفل امنیتی فعال شد' : 'قفل امنیتی غیرفعال شد');
  };

  const handleSavePin = () => {
    if (pinTemp.length < 4) return;
    const next = { ...config, pinCode: pinTemp, isLockEnabled: true, lockType: 'pin' as const };
    setConfig(next);
    onUpdateSecurity(next);
    CloudSyncService.saveSecurityConfig(next);
    setActiveSubView('main');
    showSuccess('رمز عبور جدید با موفقیت ذخیره شد');
  };

  const handleSavePattern = (pattern: string) => {
    setPatternTemp(pattern);
    const next = { ...config, patternCode: pattern, isLockEnabled: true, lockType: 'pattern' as const };
    setConfig(next);
    onUpdateSecurity(next);
    CloudSyncService.saveSecurityConfig(next);
    setActiveSubView('main');
    showSuccess('الگوی امنیتی جدید ذخیره شد');
  };

  const showSuccess = (msg: string) => {
    setSaveSuccessMsg(msg);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await CloudSyncService.loginWithGoogle();
      showSuccess('با موفقیت به حساب ابری وارد شدید');
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await CloudSyncService.logout();
    StorageService.clearCurrentSession();
    showSuccess('از حساب کاربری خارج شدید و حافظه مجزا تفکیک شد');
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-card text-foreground rounded-3xl border border-border shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-foreground">
                امنیت، قفل و حساب آنلاین
              </h3>
              <p className="text-[11px] text-muted-foreground">
                پایگاه داده ابری و روش‌های قفل محرمانه
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-xs sm:text-sm">
          
          {saveSuccessMsg && (
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {activeSubView === 'main' && (
            <>
              {/* Cloud Account Section */}
              <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-primary" />
                    <span className="font-bold text-xs sm:text-sm text-foreground">
                      همگام‌سازی ابری آنلاین
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      currentUser
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {currentUser ? 'متصل به فایربیس' : 'حالت آفلاین / محلی'}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  با اتصال به حساب ابری، اطلاعات شما در دیتابیس امن آنلاین ذخیره شده و در هر کامپیوتر یا موبایل دیگری که وارد شوید، بلافاصله همگام‌سازی می‌شود.
                </p>

                {currentUser ? (
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div className="truncate max-w-[200px]">
                      <p className="text-xs font-bold text-foreground truncate">
                        {currentUser.displayName || 'کاربر گرامی'}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {currentUser.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={async () => {
                          const res = await CloudSyncService.syncBidirectional();
                          if (res) {
                            showSuccess('اطلاعات بین تمام دستگاه‌ها با موفقیت همگام‌سازی و دریافت شد');
                          }
                        }}
                        className="p-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-all cursor-pointer"
                        title="همگام‌سازی و دریافت داده‌های ابری"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="px-3 py-1.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>خروج</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={isLoggingIn}
                    className="w-full py-2.5 rounded-xl bg-primary hover:bg-[#687a5e] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>ورود با حساب گوگل / اتصال به دیتابیس آنلاین</span>
                  </button>
                )}
              </div>

              {/* App Lock Settings Section */}
              <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-primary" />
                    <span className="font-bold text-xs sm:text-sm text-foreground">
                      قفل امنیتی برنامه
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.isLockEnabled}
                      onChange={(e) => handleToggleLock(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <p className="text-xs text-muted-foreground">
                  جلوگیری از دسترسی افراد متفرقه با فعال‌سازی رمز، الگو یا بیومتریک
                </p>

                {config.isLockEnabled && (
                  <div className="space-y-2.5 pt-2 border-t border-border">
                    {/* Method Choices */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-foreground block">
                        روش‌های بازگشایی قفل:
                      </label>

                      {/* 1. PIN */}
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-card border border-border">
                        <div className="flex items-center gap-2">
                          <KeyRound className="w-4 h-4 text-primary" />
                          <div>
                            <span className="font-bold text-xs text-foreground block">
                              رمز عبور (PIN)
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {config.pinCode ? 'رمز تنظیم شده است' : 'رمز پیش‌فرض (۴ رقم)'}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setPinTemp('');
                            setActiveSubView('set_pin');
                          }}
                          className="px-3 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold transition-all cursor-pointer"
                        >
                          {config.pinCode ? 'تغییر رمز' : 'تنظیم رمز'}
                        </button>
                      </div>

                      {/* 2. Pattern */}
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-card border border-border">
                        <div className="flex items-center gap-2">
                          <Grid3X3 className="w-4 h-4 text-primary" />
                          <div>
                            <span className="font-bold text-xs text-foreground block">
                              الگو (پترن گرافیکی)
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {config.patternCode ? 'الگو تنظیم شده است' : 'الگوی پیش‌فرض'}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveSubView('set_pattern')}
                          className="px-3 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold transition-all cursor-pointer"
                        >
                          {config.patternCode ? 'تغییر الگو' : 'رسم الگو'}
                        </button>
                      </div>

                      {/* 3. Biometric (Fingerprint / Face) */}
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-card border border-border">
                        <div className="flex items-center gap-2">
                          <Fingerprint className="w-4 h-4 text-primary" />
                          <div>
                            <span className="font-bold text-xs text-foreground block">
                              احراز هویت بیومتریک
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              اثر انگشت و اسکن چهره
                            </span>
                          </div>
                        </div>
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          فعال
                        </span>
                      </div>
                    </div>

                    {/* Immediate Lock Button */}
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onLockNow();
                      }}
                      className="w-full py-2.5 rounded-xl bg-card hover:bg-muted border border-border text-foreground font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer mt-2"
                    >
                      <Lock className="w-4 h-4 text-primary" />
                      <span>قفل کردن فوری برنامه</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* SubView: Set PIN */}
          {activeSubView === 'set_pin' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="font-bold text-xs text-foreground">تعیین رمز عبور عددی جدید</span>
                <button
                  type="button"
                  onClick={() => setActiveSubView('main')}
                  className="text-xs text-primary font-bold hover:underline cursor-pointer"
                >
                  بازگشت
                </button>
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  رمز ۴ الی ۸ رقمی مورد نظر خود را وارد کنید:
                </label>
                <input
                  type="password"
                  value={pinTemp}
                  onChange={(e) => setPinTemp(e.target.value.replace(/[^0-9]/g, ''))}
                  maxLength={8}
                  placeholder="مثال: 1234"
                  className="w-full p-3 rounded-xl border border-border bg-background text-foreground text-center font-mono text-lg tracking-widest font-bold"
                  autoFocus
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveSubView('main')}
                  className="flex-1 py-2.5 rounded-xl border border-border bg-background hover:bg-muted text-foreground text-xs font-bold"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={handleSavePin}
                  disabled={pinTemp.length < 4}
                  className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-[#687a5e] text-white text-xs font-bold shadow-md shadow-primary/25 disabled:opacity-50"
                >
                  ذخیره رمز
                </button>
              </div>
            </div>
          )}

          {/* SubView: Set Pattern */}
          {activeSubView === 'set_pattern' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="font-bold text-xs text-foreground">رسم الگوی امنیتی جدید</span>
                <button
                  type="button"
                  onClick={() => setActiveSubView('main')}
                  className="text-xs text-primary font-bold hover:underline cursor-pointer"
                >
                  بازگشت
                </button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                حداقل ۳ نقطه را به یکدیگر وصل کنید
              </p>

              <PatternLock onComplete={handleSavePattern} />

              <button
                type="button"
                onClick={() => setActiveSubView('main')}
                className="w-full py-2.5 rounded-xl border border-border bg-background hover:bg-muted text-foreground text-xs font-bold"
              >
                انصراف
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

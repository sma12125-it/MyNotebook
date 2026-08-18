import React, { useState } from 'react';
import { Heart, Sparkles, Check, ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';
import { StorageService } from '../../services/storage';

interface OnboardingModalProps {
  isOpen: boolean;
  onFinish: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onFinish,
}) => {
  const [step, setStep] = useState(1);

  if (!isOpen) return null;

  const handleComplete = (withSeedData: boolean) => {
    if (withSeedData) {
      StorageService.seedSampleData();
    } else {
      const p = StorageService.getProfile();
      StorageService.saveProfile({ ...p, hasSeenOnboarding: true });
    }
    onFinish();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-6 sm:p-8 text-center border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 flex flex-col justify-between min-h-[440px]">
        
        {/* Step Indicators */}
        <div className="flex justify-center items-center gap-2 mb-6">
          <div className={`h-1.5 rounded-full transition-all ${step === 1 ? 'w-8 bg-blue-600' : 'w-2 bg-slate-200 dark:bg-slate-700'}`}></div>
          <div className={`h-1.5 rounded-full transition-all ${step === 2 ? 'w-8 bg-blue-600' : 'w-2 bg-slate-200 dark:bg-slate-700'}`}></div>
          <div className={`h-1.5 rounded-full transition-all ${step === 3 ? 'w-8 bg-blue-600' : 'w-2 bg-slate-200 dark:bg-slate-700'}`}></div>
        </div>

        {/* Screens Content */}
        <div className="flex-1 flex flex-col items-center justify-center py-2">
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-blue-500/30 text-3xl font-extrabold">
                د
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                دفتر من
              </h2>
              <p className="text-base font-semibold text-blue-600 dark:text-blue-400">
                همه چیز مهم زندگی‌ات، یکجا.
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                سامانه شخصی و یکپارچه برای مدیریت سلامت، اطلاعات مهم، خط زمانی و اسناد شخصی.
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="w-20 h-20 rounded-3xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto border border-rose-100 dark:border-rose-900/60 shadow-sm">
                <Heart className="w-10 h-10 animate-pulse" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                مدیریت جامع سلامت و زندگی
              </h2>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                سلامت، دارو، آزمایش، یادآوری و اتفاقات مهم.
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                دیگر نیازی به پراکندگی اطلاعات بین یادداشت‌ها، تقویم و فایل‌های پراکنده نیست.
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="w-20 h-20 rounded-3xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto border border-indigo-100 dark:border-indigo-900/60 shadow-sm">
                <Sparkles className="w-10 h-10" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                سریع، آسان و هوشمند
              </h2>
              <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                سریع ثبت کن. راحت پیدا کن. هیچ چیز مهمی را فراموش نکن.
              </p>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-2 text-right">
                <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>اطلاعات شما کاملاً امن، آفلاین و محلی در گوشی یا دستگاه شما ذخیره می‌شود.</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="mt-6 space-y-2">
          {step < 3 ? (
            <div className="flex items-center justify-between gap-3">
              {step > 1 ? (
                <button
                  onClick={() => setStep(step - 1)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold"
                >
                  قبلی
                </button>
              ) : (
                <button
                  onClick={() => handleComplete(true)}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline"
                >
                  رد شدن و ورود با داده‌های نمونه
                </button>
              )}

              <button
                onClick={() => setStep(step + 1)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/25 transition-all"
              >
                <span>ادامه</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                onClick={() => handleComplete(true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-blue-500/30 transition-all"
              >
                <Check className="w-5 h-5" />
                <span>شروع کنیم (همراه با داده‌های نمونه)</span>
              </button>
              <button
                onClick={() => handleComplete(false)}
                className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
              >
                شروع با دفتر کاملاً خالی
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  User,
  Heart,
  Shield,
  Phone,
  Calendar,
  AlertCircle,
  Save,
  ArrowRight,
  CheckCircle2,
  Activity,
  Droplet,
  Sparkles,
  Weight,
  Ruler,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { UserProfile, AppState, TabType, BloodGroup } from '../../types';
import { StorageService } from '../../services/storage';

interface ProfileViewProps {
  userProfile?: UserProfile;
  appState?: AppState;
  onRefreshData?: () => void;
  onNavigateToTab?: (tab: TabType) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  userProfile,
  appState,
  onRefreshData,
  onNavigateToTab,
}) => {
  const currentProfile = userProfile || appState?.profile || StorageService.getProfile();

  const [profile, setProfile] = useState<UserProfile>(() => ({
    ...currentProfile,
    fullName: currentProfile.fullName || currentProfile.name || '',
    name: currentProfile.name || currentProfile.fullName || '',
    bloodType: currentProfile.bloodType || currentProfile.bloodGroup || 'O+',
    gender: currentProfile.gender || 'male',
    allergies: currentProfile.allergies || [],
    medicalConditions: currentProfile.medicalConditions || [],
  }));

  const [allergiesInput, setAllergiesInput] = useState<string>(
    (currentProfile.allergies || []).join('، ')
  );
  const [conditionsInput, setConditionsInput] = useState<string>(
    (currentProfile.medicalConditions || []).join('، ')
  );

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (userProfile) {
      setProfile((prev) => ({
        ...prev,
        ...userProfile,
        fullName: userProfile.fullName || userProfile.name || '',
        name: userProfile.name || userProfile.fullName || '',
        bloodType: userProfile.bloodType || userProfile.bloodGroup || 'O+',
        gender: userProfile.gender || 'male',
      }));
      setAllergiesInput((userProfile.allergies || []).join('، '));
      setConditionsInput((userProfile.medicalConditions || []).join('، '));
    }
  }, [userProfile]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // BMI Calculation
  const calculateBMI = () => {
    const heightM = (profile.heightCm || 0) / 100;
    const weight = profile.weightKg || 0;
    if (heightM > 0 && weight > 0) {
      const bmi = weight / (heightM * heightM);
      let status = 'طبیعی';
      let color = 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      if (bmi < 18.5) {
        status = 'کمبود وزن';
        color = 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20';
      } else if (bmi >= 25 && bmi < 30) {
        status = 'اضافه وزن';
        color = 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20';
      } else if (bmi >= 30) {
        status = 'چاقی';
        color = 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20';
      }
      return { val: bmi.toFixed(1), status, color };
    }
    return null;
  };

  const bmiData = calculateBMI();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = profile.fullName?.trim() || profile.name?.trim() || 'کاربر گرامی';
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
      bloodGroup: (profile.bloodType || 'O+') as BloodGroup,
      gender: profile.gender || 'male',
      allergies: parsedAllergies,
      medicalConditions: parsedConditions,
      hasSeenOnboarding: true,
    };

    StorageService.saveProfile(updatedProfile);
    setProfile(updatedProfile);
    showToast('اطلاعات شناسنامه و پرونده سلامت با موفقیت ذخیره شد.');
    onRefreshData();
  };

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {onNavigateToTab && (
            <button
              type="button"
              onClick={() => onNavigateToTab('settings')}
              className="p-2 rounded-xl bg-card border border-border text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="بازگشت به تنظیمات"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-foreground flex items-center gap-2">
              <span>شناسنامه فردی و پرونده سلامت</span>
              <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                اختصاصی
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              مشخصات فردی، شاخص‌های بیومتریک، مخاطب اضطراری و سوابق پزشکی
            </p>
          </div>
        </div>

        {onNavigateToTab && (
          <button
            type="button"
            onClick={() => onNavigateToTab('settings')}
            className="px-3.5 py-2 rounded-xl border border-border bg-card text-foreground hover:bg-muted text-xs font-bold transition-all self-start sm:self-auto cursor-pointer"
          >
            بازگشت به تنظیمات
          </button>
        )}
      </div>

      {toastMessage && (
        <div className="p-3.5 bg-primary text-white rounded-2xl flex items-center gap-2.5 text-xs sm:text-sm font-bold shadow-lg animate-in fade-in sticky top-20 z-40">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Profile Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. Identity & Basic Info Card */}
        <div className="p-5 sm:p-6 rounded-3xl bg-card border border-border shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-border">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-foreground">
                اطلاعات شناسنامه‌ای و فردی
              </h3>
              <p className="text-xs text-muted-foreground">
                نام و نام خانوادگی، شماره تماس و جنسیت
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs sm:text-sm text-muted-foreground mb-1.5 font-medium">
                نام و نام خانوادگی <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={profile.fullName}
                onChange={(e) =>
                  setProfile({ ...profile, fullName: e.target.value, name: e.target.value })
                }
                placeholder="مثال: سارا محمدی / علی رضایی"
                required
                className="w-full p-3 rounded-2xl border border-border bg-background text-foreground font-bold focus:border-primary focus:outline-none transition-colors text-sm"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm text-muted-foreground mb-1.5 font-medium">
                شماره تلفن همراه
              </label>
              <input
                type="tel"
                value={profile.phoneNumber || ''}
                onChange={(e) => setProfile({ ...profile, phoneNumber: e.target.value })}
                placeholder="0912..."
                className="w-full p-3 rounded-2xl border border-border bg-background text-foreground font-mono focus:border-primary focus:outline-none transition-colors text-sm"
              />
            </div>
          </div>

          {/* Gender Selector with visual feedback */}
          <div className="pt-2">
            <label className="block text-xs sm:text-sm text-muted-foreground mb-2 font-medium">
              جنسیت <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setProfile({ ...profile, gender: 'female' })}
                className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row items-center justify-center gap-2 font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                  profile.gender === 'female'
                    ? 'bg-rose-500/10 border-rose-500/40 text-rose-600 dark:text-rose-400 shadow-xs ring-2 ring-rose-500/20'
                    : 'bg-background border-border text-muted-foreground hover:border-border/80'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  profile.gender === 'female' ? 'bg-rose-500 text-white' : 'bg-muted text-muted-foreground'
                }`}>
                  ♀
                </div>
                <span>زن (بانوان)</span>
              </button>

              <button
                type="button"
                onClick={() => setProfile({ ...profile, gender: 'male' })}
                className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row items-center justify-center gap-2 font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                  profile.gender === 'male'
                    ? 'bg-blue-500/10 border-blue-500/40 text-blue-600 dark:text-blue-400 shadow-xs ring-2 ring-blue-500/20'
                    : 'bg-background border-border text-muted-foreground hover:border-border/80'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  profile.gender === 'male' ? 'bg-blue-500 text-white' : 'bg-muted text-muted-foreground'
                }`}>
                  ♂
                </div>
                <span>مرد (آقایان)</span>
              </button>

              <button
                type="button"
                onClick={() => setProfile({ ...profile, gender: 'other' })}
                className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row items-center justify-center gap-2 font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                  profile.gender === 'other' || profile.gender === 'unspecified'
                    ? 'bg-primary/10 border-primary/40 text-primary shadow-xs ring-2 ring-primary/20'
                    : 'bg-background border-border text-muted-foreground hover:border-border/80'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  profile.gender === 'other' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                }`}>
                  ⚧
                </div>
                <span>سایر / نامشخص</span>
              </button>
            </div>

            {profile.gender === 'female' && (
              <div className="mt-3 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2.5 text-xs text-rose-700 dark:text-rose-300 animate-in fade-in">
                <Sparkles className="w-4 h-4 text-rose-500 flex-shrink-0" />
                <span>
                  با انتخاب جنسیت زن، بخش <strong>«رهگیری و ثبت چرخه پریود / قاعدگی»</strong> در منوی برنامه، سوابق سلامت و داشبورد فعال شد.
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs sm:text-sm text-muted-foreground mb-1.5 font-medium">
                سال تولد (شمسی)
              </label>
              <input
                type="text"
                value={profile.birthYearJalali || ''}
                onChange={(e) => setProfile({ ...profile, birthYearJalali: e.target.value })}
                placeholder="مثال: ۱۳۷۲"
                className="w-full p-3 rounded-2xl border border-border bg-background text-foreground font-mono text-center focus:border-primary focus:outline-none transition-colors text-sm"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm text-muted-foreground mb-1.5 font-medium">
                تاریخ کامل تولد (شمسی)
              </label>
              <input
                type="text"
                value={profile.birthDateJalali || ''}
                onChange={(e) => setProfile({ ...profile, birthDateJalali: e.target.value })}
                placeholder="مثال: ۱۳۷۲/۰۴/۱۵"
                className="w-full p-3 rounded-2xl border border-border bg-background text-foreground font-mono text-center focus:border-primary focus:outline-none transition-colors text-sm"
              />
            </div>
          </div>
        </div>

        {/* 2. Biometrics & Health Vitals Card */}
        <div className="p-5 sm:p-6 rounded-3xl bg-card border border-border shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold">
                <Heart className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-foreground">
                  شاخص‌های سلامت و بیومتریک پایه
                </h3>
                <p className="text-xs text-muted-foreground">
                  گروه خونی، قد، وزن پایه و محاسبه زنده BMI
                </p>
              </div>
            </div>

            {bmiData && (
              <div className={`px-3 py-1 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${bmiData.color}`}>
                <span>BMI: {bmiData.val}</span>
                <span className="text-[10px]">({bmiData.status})</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs sm:text-sm text-muted-foreground mb-1.5 font-medium flex items-center gap-1.5">
                <Droplet className="w-4 h-4 text-rose-500" />
                <span>گروه خونی</span>
              </label>
              <select
                value={profile.bloodType || 'O+'}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    bloodType: e.target.value as any,
                    bloodGroup: e.target.value as any,
                  })
                }
                className="w-full p-3 rounded-2xl border border-border bg-background text-foreground font-bold text-center focus:border-primary focus:outline-none transition-colors text-sm cursor-pointer"
              >
                <option value="O+">O+ (مثبت)</option>
                <option value="O-">O- (منفی)</option>
                <option value="A+">A+ (مثبت)</option>
                <option value="A-">A- (منفی)</option>
                <option value="B+">B+ (مثبت)</option>
                <option value="B-">B- (منفی)</option>
                <option value="AB+">AB+ (مثبت)</option>
                <option value="AB-">AB- (منفی)</option>
                <option value="نامشخص">نامشخص</option>
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm text-muted-foreground mb-1.5 font-medium flex items-center gap-1.5">
                <Ruler className="w-4 h-4 text-primary" />
                <span>قد (سانتی‌متر)</span>
              </label>
              <input
                type="number"
                value={profile.heightCm || ''}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    heightCm: e.target.value ? parseInt(e.target.value, 10) : undefined,
                  })
                }
                placeholder="مثلاً ۱۷۰"
                className="w-full p-3 rounded-2xl border border-border bg-background text-foreground font-mono text-center focus:border-primary focus:outline-none transition-colors text-sm"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm text-muted-foreground mb-1.5 font-medium flex items-center gap-1.5">
                <Weight className="w-4 h-4 text-primary" />
                <span>وزن پایه (کیلوگرم)</span>
              </label>
              <input
                type="number"
                step="0.1"
                value={profile.weightKg || ''}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    weightKg: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                placeholder="مثلاً ۶۵.۵"
                className="w-full p-3 rounded-2xl border border-border bg-background text-foreground font-mono text-center focus:border-primary focus:outline-none transition-colors text-sm"
              />
            </div>
          </div>
        </div>

        {/* 3. Emergency Contact (ICE) Card */}
        <div className="p-5 sm:p-6 rounded-3xl bg-card border border-border shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-border">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-foreground">
                اطلاعات تماس اضطراری (ICE)
              </h3>
              <p className="text-xs text-muted-foreground">
                برای دسترسی سریع در شرایط اضطراری پزشکی و کارت سلامت
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs sm:text-sm text-muted-foreground mb-1.5 font-medium">
                نام و نسبت فرد معتمد اضطراری
              </label>
              <input
                type="text"
                value={profile.emergencyContactName || ''}
                onChange={(e) => setProfile({ ...profile, emergencyContactName: e.target.value })}
                placeholder="مثال: مریم حسینی (همسر / مادر)"
                className="w-full p-3 rounded-2xl border border-border bg-background text-foreground focus:border-primary focus:outline-none transition-colors text-sm"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm text-muted-foreground mb-1.5 font-medium">
                شماره تماس اضطراری
              </label>
              <input
                type="tel"
                value={profile.emergencyContactPhone || profile.emergencyContact || ''}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    emergencyContactPhone: e.target.value,
                    emergencyContact: e.target.value,
                  })
                }
                placeholder="0912..."
                className="w-full p-3 rounded-2xl border border-border bg-background text-foreground font-mono focus:border-primary focus:outline-none transition-colors text-sm"
              />
            </div>
          </div>
        </div>

        {/* 4. Allergies, Medical Conditions & Health Notes */}
        <div className="p-5 sm:p-6 rounded-3xl bg-card border border-border shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-border">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-foreground">
                حساسیت‌ها، بیماری‌ها و سوابق پزشکی
              </h3>
              <p className="text-xs text-muted-foreground">
                اطلاعات کلیدی جهت آگاهی پزشک و پیشگیری از تداخلات دارویی
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs sm:text-sm text-muted-foreground mb-1.5 font-medium flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>حساسیت‌ها و آلرژی‌ها (دارویی / غذایی)</span>
              </label>
              <input
                type="text"
                value={allergiesInput}
                onChange={(e) => setAllergiesInput(e.target.value)}
                placeholder="مثال: پنی‌سیلین، گرد و غبار، بادام زمینی، لاکتوز"
                className="w-full p-3 rounded-2xl border border-border bg-background text-foreground focus:border-primary focus:outline-none transition-colors text-sm"
              />
              <p className="text-[11px] text-muted-foreground mt-1">موارد را با ویرگول (،) از هم جدا کنید</p>
            </div>

            <div>
              <label className="block text-xs sm:text-sm text-muted-foreground mb-1.5 font-medium flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-rose-500" />
                <span>بیماری‌های زمینه‌ای و شرایط بالینی</span>
              </label>
              <input
                type="text"
                value={conditionsInput}
                onChange={(e) => setConditionsInput(e.target.value)}
                placeholder="مثال: فشار خون بالا، کم‌کاری تیروئید، میگرن، دیابت"
                className="w-full p-3 rounded-2xl border border-border bg-background text-foreground focus:border-primary focus:outline-none transition-colors text-sm"
              />
              <p className="text-[11px] text-muted-foreground mt-1">موارد را با ویرگول (،) از هم جدا کنید</p>
            </div>
          </div>

          <div className="pt-2">
            <label className="block text-xs sm:text-sm text-muted-foreground mb-1.5 font-medium">
              یادداشت‌های ویژه پزشکی، سوابق جراحی و توضیحات تکمیلی
            </label>
            <textarea
              rows={3}
              value={profile.notes || ''}
              onChange={(e) => setProfile({ ...profile, notes: e.target.value })}
              placeholder="هرگونه اطلاعات پزشکی ضروری، سوابق جراحی قبلی، ایمپلنت، عینک/لنز، تذکرات مربوط به بیهوشی و..."
              className="w-full p-3 rounded-2xl border border-border bg-background text-foreground focus:border-primary focus:outline-none transition-colors text-sm resize-y"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            type="submit"
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-primary hover:bg-[#687a5e] text-white font-extrabold text-sm shadow-md shadow-primary/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            <Save className="w-4 h-4" />
            <span>ذخیره تغییرات شناسنامه سلامت</span>
          </button>

          {onNavigateToTab && (
            <button
              type="button"
              onClick={() => onNavigateToTab('settings')}
              className="w-full sm:w-auto px-5 py-3.5 rounded-2xl border border-border bg-card hover:bg-muted text-foreground font-bold text-sm transition-all cursor-pointer"
            >
              انصراف و بازگشت
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

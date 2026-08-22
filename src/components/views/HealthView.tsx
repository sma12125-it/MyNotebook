import React, { useState } from 'react';
import {
  Heart,
  Activity,
  Plus,
  Trash2,
  TrendingUp,
  User,
  ShieldAlert,
  Edit2,
  X,
  Droplet,
  Clock,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { UserProfile, Measurement, MeasurementType } from '../../types';
import { StorageService } from '../../services/storage';
import { getTodayJalali, getCurrentTime, toFaDigits, formatJalaliReadable, formatDateTimeFa } from '../../utils/jalali';
import { EmptyState } from '../common/EmptyState';

interface HealthViewProps {
  profile?: UserProfile;
  userProfile?: UserProfile;
  measurements?: Measurement[];
  vitals?: Measurement[];
  onRefreshData: () => void;
  onOpenQuickCapture?: () => void;
}

export const HealthView: React.FC<HealthViewProps> = ({
  profile: propProfile,
  userProfile,
  measurements: propMeasurements,
  vitals,
  onRefreshData,
  onOpenQuickCapture,
}) => {
  const profile = propProfile || userProfile || StorageService.getProfile() || { name: 'کاربر گرامی', bloodGroup: 'O+' };
  const measurements = propMeasurements || vitals || StorageService.getMeasurements() || [];

  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'water' | 'history' | 'profile'>('overview');
  const [selectedChartType, setSelectedChartType] = useState<MeasurementType>('weight');
  
  // Add Measurement Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [measureType, setMeasureType] = useState<MeasurementType>('weight');
  const [val1, setVal1] = useState('');
  const [val2, setVal2] = useState('');
  const [notes, setNotes] = useState('');
  const [dateJalali, setDateJalali] = useState(getTodayJalali());
  const [timeStr, setTimeStr] = useState(getCurrentTime());

  // Edit Profile Modal State
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState(profile?.name || profile?.fullName || '');
  const [editBirthDate, setEditBirthDate] = useState(profile?.birthDateJalali || profile?.birthYearJalali || '');
  const [editBloodGroup, setEditBloodGroup] = useState(profile?.bloodGroup || profile?.bloodType || 'O+');
  const [editHeight, setEditHeight] = useState(profile?.height ? String(profile.height) : profile?.heightCm ? String(profile.heightCm) : '');
  const [editAllergies, setEditAllergies] = useState(profile?.allergies ? profile.allergies.join('، ') : '');
  const [editConditions, setEditConditions] = useState(profile?.medicalConditions ? profile.medicalConditions.join('، ') : '');
  const [editEmergency, setEditEmergency] = useState(profile?.emergencyContact || profile?.emergencyContactPhone || '');
  const [editInsurance, setEditInsurance] = useState(profile?.insuranceNumber || '');

  // Water calculations
  const today = getTodayJalali();
  const todayWaterEntries = measurements.filter(
    (m) => m.type === 'water_intake' && (m.recordedAtJalali === today || !m.recordedAtJalali)
  );
  const totalWaterToday = todayWaterEntries.reduce((acc, curr) => acc + (curr.value || 0), 0);
  const waterGoal = 2000; // 2000 ml
  const waterProgress = Math.min(100, Math.round((totalWaterToday / waterGoal) * 100));
  const waterGlasses = (totalWaterToday / 250).toFixed(1);

  // Quick water add
  const handleQuickAddWater = (amount: number) => {
    const now = Date.now();
    const currTime = getCurrentTime();
    StorageService.addMeasurement({
      id: 'water-' + Math.random().toString(36).substring(2, 9),
      type: 'water_intake',
      value: amount,
      unit: 'میلی‌لیتر',
      recordedAtJalali: today,
      recordedTime: currTime,
      time: currTime,
      timeJalali: currTime,
      timestamp: now,
      notes: `${toFaDigits(amount)} میلی‌لیتر آب`,
    });
    onRefreshData();
  };

  // Filter measurements for chart
  const chartData = measurements
    .filter((m) => {
      if (selectedChartType === 'blood_pressure_sys') {
        return m.type === 'blood_pressure_sys' || m.type === 'blood_pressure_dia';
      }
      return m.type === selectedChartType;
    })
    .slice(0, 10)
    .reverse();

  // BMI Calculation
  const latestWeight = measurements.find((m) => m?.type === 'weight')?.value;
  const rawHeight = profile?.height || profile?.heightCm;
  const heightMeters = rawHeight ? rawHeight / 100 : undefined;
  const bmi = latestWeight && heightMeters ? (latestWeight / (heightMeters * heightMeters)).toFixed(1) : null;

  const handleSaveMeasurement = (e: React.FormEvent) => {
    e.preventDefault();
    const recDate = dateJalali || getTodayJalali();
    const now = Date.now();
    const recTime = timeStr || getCurrentTime();

    if (measureType === 'blood_pressure_sys') {
      let sys = parseFloat(val1);
      let dia = parseFloat(val2);
      if (isNaN(sys) || isNaN(dia)) return;
      if (sys <= 25) sys *= 10;
      if (dia <= 25) dia *= 10;

      StorageService.addMeasurement({
        id: 'm-' + Math.random().toString(36).substring(2, 9),
        type: 'blood_pressure_sys',
        value: sys,
        unit: 'mmHg',
        recordedAtJalali: recDate,
        recordedTime: recTime,
        time: recTime,
        timeJalali: recTime,
        timestamp: now,
        notes: notes || 'سیستولیک',
      });
      StorageService.addMeasurement({
        id: 'm-' + Math.random().toString(36).substring(2, 9),
        type: 'blood_pressure_dia',
        value: dia,
        unit: 'mmHg',
        recordedAtJalali: recDate,
        recordedTime: recTime,
        time: recTime,
        timeJalali: recTime,
        timestamp: now,
        notes: notes || 'دیاستولیک',
      });
    } else {
      const v = parseFloat(val1);
      if (isNaN(v)) return;
      let unit = 'kg';
      if (measureType === 'water_intake') unit = 'میلی‌لیتر';
      if (measureType === 'blood_glucose') unit = 'mg/dL';
      if (measureType === 'heart_rate') unit = 'bpm';
      if (measureType === 'sleep_hours') unit = 'ساعت';
      if (measureType === 'blood_oxygen') unit = '%';
      if (measureType === 'body_temperature') unit = '°C';

      StorageService.addMeasurement({
        id: 'm-' + Math.random().toString(36).substring(2, 9),
        type: measureType,
        value: v,
        unit,
        recordedAtJalali: recDate,
        recordedTime: recTime,
        time: recTime,
        timeJalali: recTime,
        timestamp: now,
        notes,
      });
    }

    setIsAddModalOpen(false);
    setVal1('');
    setVal2('');
    setNotes('');
    onRefreshData();
  };

  const handleDeleteMeasurement = (id: string) => {
    const all = StorageService.getMeasurements().filter((m) => m.id !== id);
    StorageService.saveMeasurements(all);
    onRefreshData();
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserProfile = {
      ...profile,
      name: editName.trim() || 'کاربر گرامی',
      fullName: editName.trim() || 'کاربر گرامی',
      birthDateJalali: editBirthDate.trim(),
      birthYearJalali: editBirthDate.trim(),
      bloodGroup: editBloodGroup as any,
      bloodType: editBloodGroup,
      height: editHeight ? parseFloat(editHeight) : undefined,
      heightCm: editHeight ? parseFloat(editHeight) : undefined,
      allergies: editAllergies.split(/[,،]/).map((s) => s.trim()).filter(Boolean),
      medicalConditions: editConditions.split(/[,،]/).map((s) => s.trim()).filter(Boolean),
      emergencyContact: editEmergency.trim(),
      insuranceNumber: editInsurance.trim(),
    };
    StorageService.saveProfile(updated);
    setIsEditProfileOpen(false);
    onRefreshData();
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header & Sub-tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">
            سلامت و سنجش‌های فردی
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            پروفایل پزشکی، نمودارها، رهگیری مصرف آب و روند سنجش‌های زیستی با ثبت دقیق ساعت و دقیقه
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setTimeStr(getCurrentTime());
              setDateJalali(getTodayJalali());
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-primary hover:bg-[#687a5e] text-white font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>ثبت سنجش جدید</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex p-1 bg-muted/60 rounded-2xl text-xs font-semibold border border-border">
        <button
          onClick={() => setActiveSubTab('overview')}
          className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
            activeSubTab === 'overview'
              ? 'bg-card text-foreground font-bold shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          مرور و نمودارها
        </button>
        <button
          onClick={() => setActiveSubTab('water')}
          className={`flex-1 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 ${
            activeSubTab === 'water'
              ? 'bg-cyan-600 text-white font-bold shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Droplet className="w-3.5 h-3.5" />
          <span>مصرف آب ({toFaDigits(totalWaterToday)} ml)</span>
        </button>
        <button
          onClick={() => setActiveSubTab('history')}
          className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
            activeSubTab === 'history'
              ? 'bg-card text-foreground font-bold shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          تاریخچه سنجش‌ها ({toFaDigits(measurements.length)})
        </button>
        <button
          onClick={() => setActiveSubTab('profile')}
          className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
            activeSubTab === 'profile'
              ? 'bg-card text-foreground font-bold shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          شناسنامه پزشکی
        </button>
      </div>

      {/* ========================================================================= */}
      {/* WATER TRACKER SUB-TAB */}
      {/* ========================================================================= */}
      {activeSubTab === 'water' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Main Water Card */}
          <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-cyan-500/10 via-sky-500/5 to-transparent border border-cyan-500/30 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 font-bold text-sm">
                <Droplet className="w-5 h-5 fill-cyan-500" />
                <span>رهگیری هوشمند مصرف آب امروز</span>
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold text-foreground">
                {toFaDigits(totalWaterToday)}{' '}
                <span className="text-sm font-normal text-muted-foreground">میلی‌لیتر</span>
                <span className="text-sm font-semibold text-cyan-600 dark:text-cyan-400 mr-2">
                  (معادل {toFaDigits(waterGlasses)} لیوان)
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                هدف روزانه: {toFaDigits(waterGoal)} میلی‌لیتر (۸ لیوان) — {toFaDigits(waterProgress)}٪ محقق شده
              </p>

              {/* Progress bar */}
              <div className="w-full max-w-md h-3 rounded-full bg-cyan-950/20 dark:bg-cyan-950/40 overflow-hidden mt-2">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-sky-400 transition-all duration-500 rounded-full"
                  style={{ width: `${waterProgress}%` }}
                />
              </div>
            </div>

            {/* Quick Add Buttons with live timestamp */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleQuickAddWater(250)}
                className="px-4 py-2.5 rounded-2xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-md shadow-cyan-600/20 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>+۱ لیوان (۲۵۰ml)</span>
              </button>
              <button
                onClick={() => handleQuickAddWater(500)}
                className="px-4 py-2.5 rounded-2xl bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs shadow-md shadow-cyan-700/20 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>+۲ لیوان (۵۰۰ml)</span>
              </button>
              <button
                onClick={() => handleQuickAddWater(750)}
                className="px-4 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md shadow-sky-600/20 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>+۱ بطری (۷۵۰ml)</span>
              </button>
            </div>
          </div>

          {/* Today's Water Logs */}
          <div className="p-5 rounded-3xl bg-card border border-border shadow-xs">
            <h4 className="font-bold text-sm text-foreground mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-600" />
              <span>لیست دفعات مصرف آب امروز (با ساعت و دقیقه)</span>
            </h4>

            {todayWaterEntries.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-2xl">
                امروز هنوز آبی ثبت نشده است. روی دکمه‌های بالا بزنید تا مصرف آب شما با ساعت دقیق ثبت شود.
              </div>
            ) : (
              <div className="space-y-2">
                {todayWaterEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-3 rounded-2xl bg-muted/40 hover:bg-muted/70 transition-colors flex items-center justify-between gap-3 border border-border/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-600 flex items-center justify-center font-bold">
                        <Droplet className="w-4 h-4 fill-cyan-500" />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-foreground">
                          {toFaDigits(entry.value)} میلی‌لیتر آب
                        </div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-cyan-600" />
                            ساعت {toFaDigits(entry.time || entry.recordedTime || 'نامشخص')}
                          </span>
                          {entry.notes && <span>— {entry.notes}</span>}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteMeasurement(entry.id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="حذف این نوبت آب"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* OVERVIEW SUB-TAB */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics Bento Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Weight */}
            <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
              <div className="text-xs text-muted-foreground font-medium mb-1">آخرین وزن</div>
              <div className="text-2xl font-bold text-foreground">
                {latestWeight ? toFaDigits(latestWeight) : '—'}
                <span className="text-xs text-muted-foreground font-normal mr-1">کیلوگرم</span>
              </div>
              {bmi && (
                <div className="mt-2 text-[11px] font-semibold text-primary">
                  شاخص BMI: {toFaDigits(bmi)}
                </div>
              )}
            </div>

            {/* Blood Pressure */}
            <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
              <div className="text-xs text-muted-foreground font-medium mb-1">آخرین فشار خون</div>
              <div className="text-2xl font-bold text-foreground">
                {measurements.find((m) => m.type === 'blood_pressure_sys')
                  ? `${toFaDigits(measurements.find((m) => m.type === 'blood_pressure_sys')?.value! <= 25 ? measurements.find((m) => m.type === 'blood_pressure_sys')?.value! : Math.round(measurements.find((m) => m.type === 'blood_pressure_sys')?.value! / 10))} / ${toFaDigits(measurements.find((m) => m.type === 'blood_pressure_dia')?.value! <= 25 ? measurements.find((m) => m.type === 'blood_pressure_dia')?.value! : Math.round(measurements.find((m) => m.type === 'blood_pressure_dia')?.value! / 10))}`
                  : '—'}
                <span className="text-xs text-muted-foreground font-normal mr-1">mmHg</span>
              </div>
              <div className="mt-2 text-[11px] text-muted-foreground">
                {measurements.find((m) => m.type === 'blood_pressure_sys')?.recordedAtJalali || 'بدون ثبت'}
              </div>
            </div>

            {/* Water Intake Today */}
            <div
              onClick={() => setActiveSubTab('water')}
              className="p-4 rounded-2xl bg-card border border-cyan-500/30 hover:border-cyan-500 shadow-xs cursor-pointer group transition-all"
            >
              <div className="text-xs text-cyan-600 dark:text-cyan-400 font-medium mb-1 flex items-center justify-between">
                <span>مصرف آب امروز</span>
                <Droplet className="w-3.5 h-3.5 fill-cyan-500 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                {toFaDigits(totalWaterToday)}
                <span className="text-xs text-muted-foreground font-normal mr-1">ml</span>
              </div>
              <div className="mt-2 text-[11px] text-muted-foreground">
                {toFaDigits(waterGlasses)} لیوان ({toFaDigits(waterProgress)}٪)
              </div>
            </div>

            {/* Blood Group & Allergies */}
            <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
              <div className="text-xs text-muted-foreground font-medium mb-1">گروه خونی و آلرژی</div>
              <div className="text-2xl font-bold text-rose-500">
                {profile.bloodGroup || 'نامشخص'}
              </div>
              <div className="mt-2 text-[11px] text-muted-foreground truncate">
                {profile.allergies && profile.allergies.length > 0 ? profile.allergies.join('، ') : 'بدون آلرژی ثبت‌شده'}
              </div>
            </div>
          </div>

          {/* Interactive SVG Trend Visualizer */}
          <div className="p-5 rounded-3xl bg-card border border-border shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                  <TrendingUp className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">روند تغییرات در طول زمان</h3>
                  <p className="text-[11px] text-muted-foreground">مشاهده نمودار پیوسته سنجش‌ها</p>
                </div>
              </div>

              {/* Selector */}
              <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-xl text-xs font-medium border border-border">
                <button
                  onClick={() => setSelectedChartType('weight')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    selectedChartType === 'weight'
                      ? 'bg-card text-foreground font-bold shadow-xs'
                      : 'text-muted-foreground'
                  }`}
                >
                  وزن
                </button>
                <button
                  onClick={() => setSelectedChartType('blood_pressure_sys')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    selectedChartType === 'blood_pressure_sys'
                      ? 'bg-card text-foreground font-bold shadow-xs'
                      : 'text-muted-foreground'
                  }`}
                >
                  فشار خون
                </button>
                <button
                  onClick={() => setSelectedChartType('blood_glucose')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    selectedChartType === 'blood_glucose'
                      ? 'bg-card text-foreground font-bold shadow-xs'
                      : 'text-muted-foreground'
                  }`}
                >
                  قند خون
                </button>
                <button
                  onClick={() => setSelectedChartType('heart_rate')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    selectedChartType === 'heart_rate'
                      ? 'bg-card text-foreground font-bold shadow-xs'
                      : 'text-muted-foreground'
                  }`}
                >
                  ضربان
                </button>
              </div>
            </div>

            {/* SVG Chart */}
            {chartData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-xs text-muted-foreground border border-dashed border-border rounded-2xl">
                داده‌ای برای رسم نمودار در این دسته‌بندی وجود ندارد.
              </div>
            ) : (
              <div className="h-56 w-full pt-4">
                <div className="relative h-44 w-full flex items-end justify-between gap-2 px-2 border-b border-border">
                  {chartData.map((d, index) => {
                    const values = chartData.map((x) => x.value || 0);
                    const min = Math.min(...values);
                    const max = Math.max(...values);
                    const heightPercent = max === min ? 50 : Math.max(15, Math.min(95, ((d.value - min) / (max - min || 1)) * 80 + 15));

                    return (
                      <div key={d.id || index} className="flex-1 flex flex-col items-center gap-1 group relative">
                        <div className="text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                          {toFaDigits(d.value)}
                        </div>
                        <div
                          className="w-full max-w-[28px] rounded-t-lg bg-primary/80 group-hover:bg-primary transition-all shadow-xs"
                          style={{ height: `${heightPercent}%` }}
                        />
                        <div className="text-[10px] text-muted-foreground truncate w-full text-center mt-1">
                          {d.recordedAtJalali?.split('/')?.slice(1)?.join('/') || index + 1}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* HISTORY SUB-TAB */}
      {activeSubTab === 'history' && (
        <div className="bg-card p-5 rounded-3xl border border-border shadow-xs">
          <h3 className="font-bold text-sm text-foreground mb-4">
            تمام سنجش‌های ثبت‌شده به همراه ساعت و دقیقه
          </h3>

          {measurements.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="هنوز سنجشی ثبت نشده است"
              description="فشار خون، قند، وزن یا میزان مصرف آب روزانه خود را ثبت کنید."
              actionText="ثبت اولین سنجش"
              onAction={() => {
                setTimeStr(getCurrentTime());
                setDateJalali(getTodayJalali());
                setIsAddModalOpen(true);
              }}
            />
          ) : (
            <div className="space-y-2.5">
              {measurements.map((m) => (
                <div
                  key={m.id}
                  className="p-3.5 rounded-2xl bg-muted/40 hover:bg-muted/70 transition-colors flex items-center justify-between gap-3 border border-border/50"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                      m.type === 'water_intake' ? 'bg-cyan-500/15 text-cyan-600' : 'bg-primary/15 text-primary'
                    }`}>
                      {m.type === 'water_intake' ? <Droplet className="w-4 h-4 fill-cyan-500" /> : <Activity className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-foreground">
                        {m.type === 'weight'
                          ? 'وزن بدن'
                          : m.type === 'water_intake'
                          ? 'مصرف آب'
                          : m.type === 'blood_pressure_sys'
                          ? 'فشار سیستولیک'
                          : m.type === 'blood_pressure_dia'
                          ? 'فشار دیاستولیک'
                          : m.type === 'blood_glucose'
                          ? 'قند خون'
                          : m.type === 'heart_rate'
                          ? 'ضربان قلب'
                          : m.type === 'sleep_hours'
                          ? 'ساعات خواب'
                          : m.type}
                        : <span className="text-primary mr-1">{toFaDigits(m.value)} {m.unit}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-2">
                        <span>{formatJalaliReadable(m.recordedAtJalali)}</span>
                        {(m.time || m.recordedTime) && (
                          <span className="flex items-center gap-0.5">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            ساعت {toFaDigits(m.time || m.recordedTime)}
                          </span>
                        )}
                        {m.notes && <span>— {m.notes}</span>}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteMeasurement(m.id)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PROFILE SUB-TAB */}
      {activeSubTab === 'profile' && (
        <div className="bg-card p-5 sm:p-6 rounded-3xl border border-border shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 text-primary flex items-center justify-center font-bold text-xl shadow-xs border border-primary/30">
                {profile?.name ? profile.name.slice(0, 1) : profile?.fullName ? profile.fullName.slice(0, 1) : <User className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="font-bold text-base text-foreground">
                  {profile?.name || profile?.fullName || 'کاربر گرامی'}
                </h3>
                <p className="text-xs text-muted-foreground">شناسنامه اطلاعات سلامت و پرونده شخصی</p>
              </div>
            </div>

            <button
              onClick={() => setIsEditProfileOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-foreground hover:bg-muted text-xs font-semibold cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>ویرایش مشخصات</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-muted/40 border border-border">
              <span className="text-muted-foreground block mb-1">تاریخ تولد</span>
              <span className="font-bold text-foreground text-sm">
                {profile.birthDateJalali || 'ثبت نشده'}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-muted/40 border border-border">
              <span className="text-muted-foreground block mb-1">گروه خونی</span>
              <span className="font-bold text-rose-500 text-sm">
                {profile.bloodGroup || 'ثبت نشده'}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-muted/40 border border-border">
              <span className="text-muted-foreground block mb-1">قد (سانتی‌متر)</span>
              <span className="font-bold text-foreground text-sm">
                {profile.height ? `${toFaDigits(profile.height)} سانتی‌متر` : 'ثبت نشده'}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-muted/40 border border-border">
              <span className="text-muted-foreground block mb-1">شماره بیمه / پرونده پزشکی</span>
              <span className="font-bold text-foreground text-sm">
                {profile.insuranceNumber || 'ثبت نشده'}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-muted/40 border border-border sm:col-span-2">
              <span className="text-muted-foreground block mb-1 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                <span>حساسیت‌ها و آلرژی‌های دارویی / غذایی</span>
              </span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {profile.allergies && profile.allergies.length > 0 ? (
                  profile.allergies.map((a, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-600 font-semibold"
                    >
                      {a}
                    </span>
                  ))
                ) : (
                  <span className="text-muted-foreground">موردی ثبت نشده است.</span>
                )}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-muted/40 border border-border sm:col-span-2">
              <span className="text-muted-foreground block mb-1">سوابق بیماری و شرایط پزشکی</span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {profile.medicalConditions && profile.medicalConditions.length > 0 ? (
                  profile.medicalConditions.map((c, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-primary/15 text-primary font-semibold"
                    >
                      {c}
                    </span>
                  ))
                ) : (
                  <span className="text-muted-foreground">موردی ثبت نشده است.</span>
                )}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-muted/40 border border-border sm:col-span-2">
              <span className="text-muted-foreground block mb-1">شماره تماس اضطراری</span>
              <span className="font-bold text-foreground text-sm font-mono">
                {profile.emergencyContact || 'ثبت نشده'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Add Measurement Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-card rounded-3xl p-5 shadow-xl border border-border">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-foreground text-base">ثبت سنجش جدید</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMeasurement} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block text-muted-foreground mb-1">نوع سنجش</label>
                <select
                  value={measureType}
                  onChange={(e) => setMeasureType(e.target.value as MeasurementType)}
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-semibold"
                >
                  <option value="weight">وزن بدن (کیلوگرم)</option>
                  <option value="water_intake">مصرف آب (میلی‌لیتر)</option>
                  <option value="blood_pressure_sys">فشار خون (سیستولیک / دیاستولیک)</option>
                  <option value="blood_glucose">قند خون (mg/dL)</option>
                  <option value="heart_rate">ضربان قلب (bpm)</option>
                  <option value="sleep_hours">ساعات خواب</option>
                  <option value="blood_oxygen">اکسیژن خون (%)</option>
                  <option value="body_temperature">دمای بدن (°C)</option>
                </select>
              </div>

              {measureType === 'blood_pressure_sys' ? (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-muted-foreground mb-1">سیستولیک (بالا)</label>
                    <input
                      type="number"
                      value={val1}
                      onChange={(e) => setVal1(e.target.value)}
                      placeholder="120 یا 12"
                      required
                      className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-muted-foreground mb-1">دیاستولیک (پایین)</label>
                    <input
                      type="number"
                      value={val2}
                      onChange={(e) => setVal2(e.target.value)}
                      placeholder="80 یا 8"
                      required
                      className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground text-center font-bold"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-muted-foreground mb-1">مقدار</label>
                  <input
                    type="number"
                    step="0.1"
                    value={val1}
                    onChange={(e) => setVal1(e.target.value)}
                    placeholder="مقدار را وارد کنید..."
                    required
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground text-center font-bold text-lg"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-muted-foreground mb-1">تاریخ (شمسی)</label>
                  <input
                    type="text"
                    value={dateJalali}
                    onChange={(e) => setDateJalali(e.target.value)}
                    className="w-full p-2 rounded-xl border border-border bg-background text-foreground text-xs text-center font-bold"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1">ساعت و دقیقه</label>
                  <input
                    type="text"
                    value={timeStr}
                    onChange={(e) => setTimeStr(e.target.value)}
                    className="w-full p-2 rounded-xl border border-border bg-background text-foreground text-xs text-center font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">توضیح اختیاری</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="مثال: ناشتا، بعد از ورزش..."
                  className="w-full p-2 rounded-xl border border-border bg-background text-foreground text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-border text-foreground text-xs font-semibold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-[#687a5e] text-white font-bold text-xs shadow-sm cursor-pointer"
                >
                  ذخیره سنجش
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-card rounded-3xl p-5 sm:p-6 shadow-xl border border-border max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-foreground text-base">ویرایش شناسنامه پزشکی</h3>
              <button
                onClick={() => setIsEditProfileOpen(false)}
                className="p-1 rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block text-muted-foreground mb-1">نام و نام خانوادگی</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-muted-foreground mb-1">تاریخ تولد (شمسی)</label>
                  <input
                    type="text"
                    value={editBirthDate}
                    onChange={(e) => setEditBirthDate(e.target.value)}
                    placeholder="1368/04/12"
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground text-center"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1">گروه خونی</label>
                  <select
                    value={editBloodGroup}
                    onChange={(e) => setEditBloodGroup(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground font-bold"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-muted-foreground mb-1">قد (سانتی‌متر)</label>
                  <input
                    type="number"
                    value={editHeight}
                    onChange={(e) => setEditHeight(e.target.value)}
                    placeholder="182"
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground text-center font-bold"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1">شماره بیمه / پرونده</label>
                  <input
                    type="text"
                    value={editInsurance}
                    onChange={(e) => setEditInsurance(e.target.value)}
                    placeholder="۱۲۳۴۵۶۷۸"
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">آلرژی‌ها (با ویرگول «،» جدا کنید)</label>
                <input
                  type="text"
                  value={editAllergies}
                  onChange={(e) => setEditAllergies(e.target.value)}
                  placeholder="پنی‌سیلین، گرده گل، گردو..."
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground"
                />
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">سوابق بیماری و شرایط خاص (با «،» جدا کنید)</label>
                <input
                  type="text"
                  value={editConditions}
                  onChange={(e) => setEditConditions(e.target.value)}
                  placeholder="فشار خون بالا، کبد چرب گرید ۱..."
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground"
                />
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">شماره تماس اضطراری</label>
                <input
                  type="tel"
                  value={editEmergency}
                  onChange={(e) => setEditEmergency(e.target.value)}
                  placeholder="09123456789 (همسر / پدر / برادر)"
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground font-mono text-left"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-border text-foreground text-xs font-semibold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-[#687a5e] text-white font-bold text-xs shadow-sm cursor-pointer"
                >
                  ذخیره شناسنامه
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

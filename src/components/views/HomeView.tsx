import React from 'react';
import {
  Heart,
  Pill,
  Bell,
  Clock,
  CheckCircle2,
  Calendar,
  Activity,
  Plus,
  ChevronLeft,
  CalendarClock,
  Sparkles,
  FileText,
  Droplet,
} from 'lucide-react';
import {
  UserProfile,
  Measurement,
  Medication,
  Reminder,
  MedicalVisit,
  LaboratoryTest,
  LifeEvent,
  ActiveTab,
  TabType,
  AppState,
} from '../../types';
import {
  getTodayFullPersian,
  getTodayJalali,
  formatRelativeDays,
  toFaDigits,
  formatJalaliReadable,
} from '../../utils/jalali';
import { StorageService } from '../../services/storage';

interface HomeViewProps {
  appState?: AppState;
  profile?: UserProfile;
  measurements?: Measurement[];
  medications?: Medication[];
  reminders?: Reminder[];
  visits?: MedicalVisit[];
  labs?: LaboratoryTest[];
  events?: LifeEvent[];
  onOpenQuickCapture: () => void;
  onNavigateToTab: (tab: TabType | ActiveTab) => void;
  onRefreshData: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  appState,
  profile: propProfile,
  measurements: propMeasurements,
  medications: propMedications,
  reminders: propReminders,
  visits: propVisits,
  labs: propLabs,
  events: propEvents,
  onOpenQuickCapture,
  onNavigateToTab,
  onRefreshData,
}) => {
  const profile = propProfile || appState?.profile || { name: 'کاربر گرامی', fullName: 'کاربر گرامی', darkMode: false, bloodType: 'A+' };
  const measurements = propMeasurements || appState?.vitals || [];
  const medications = propMedications || appState?.medications || [];
  const reminders = propReminders || appState?.reminders || [];
  const visits = propVisits || appState?.visits || [];
  const labs = propLabs || appState?.labs || [];
  const events = propEvents || appState?.events || [];

  const today = getTodayJalali();
  const dateDisplay = getTodayFullPersian();

  // Find latest recorded measurements
  const latestWeight = measurements.find((m) => m.type === 'weight');
  const latestSys = measurements.find((m) => m.type === 'blood_pressure_sys');
  const latestDia = measurements.find((m) => m.type === 'blood_pressure_dia');
  const latestSleep = measurements.find((m) => m.type === 'sleep_hours');
  const latestHeartRate = measurements.find((m) => m.type === 'heart_rate');

  // Water Intake Today
  const todayWaterEntries = measurements.filter(
    (m) => m.type === 'water_intake' && (m.recordedAtJalali === today || !m.recordedAtJalali)
  );
  const totalWaterToday = todayWaterEntries.reduce((acc, curr) => acc + (curr.value || 0), 0);
  const waterGoal = 2000;
  const waterProgress = Math.min(100, Math.round((totalWaterToday / waterGoal) * 100));

  const handleQuickAddWaterHome = (amount: number) => {
    const now = Date.now();
    const currTime = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
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

  // Today's active medications
  const activeMeds = medications.filter((m) => m.isActive);

  // Today's & Upcoming Reminders (Sorted by due date)
  const upcomingReminders = reminders
    .filter((r) => !r.isCompleted)
    .slice(0, 4);

  // Medication log toggle handler
  const handleToggleMedicationStatus = (med: Medication, slot: 'صبح' | 'ظهر' | 'عصر' | 'شب') => {
    const logs = StorageService.getMedicationLogs();
    const existingIndex = logs.findIndex(
      (l) => l.medicationId === med.id && l.dateJalali === today && l.timeSlot === slot
    );

    if (existingIndex >= 0) {
      logs.splice(existingIndex, 1);
    } else {
      logs.push({
        id: 'log-' + Date.now(),
        medicationId: med.id,
        dateJalali: today,
        scheduledTime: '08:00',
        timeSlot: slot,
        status: 'taken',
        takenAtTimestamp: Date.now(),
      });

      if (med.remainingQuantity && med.remainingQuantity > 0) {
        med.remainingQuantity -= 1;
        const allMeds = StorageService.getMedications();
        const idx = allMeds.findIndex((m) => m.id === med.id);
        if (idx >= 0) {
          allMeds[idx] = med;
          StorageService.saveMedications(allMeds);
        }
      }
    }

    StorageService.saveMedicationLogs(logs);
    onRefreshData();
  };

  const logs = StorageService.getMedicationLogs();
  const isMedTakenToday = (medId: string, slot: 'صبح' | 'ظهر' | 'عصر' | 'شب') => {
    return logs.some((l) => l.medicationId === medId && l.dateJalali === today && l.timeSlot === slot && l.status === 'taken');
  };

  // Toggle Reminder completion
  const handleToggleReminder = (rem: Reminder) => {
    const allReminders = StorageService.getReminders();
    const idx = allReminders.findIndex((r) => r.id === rem.id);
    if (idx >= 0) {
      allReminders[idx].isCompleted = !allReminders[idx].isCompleted;
      allReminders[idx].completedAt = allReminders[idx].isCompleted ? Date.now() : undefined;
      StorageService.saveReminders(allReminders);
      onRefreshData();
    }
  };

  // Recent timeline events (aggregated)
  const recentActivities: Array<{ id: string; title: string; category: string; date: string; icon: React.ComponentType<{ className?: string }>; color: string }> = [];

  measurements.slice(0, 2).forEach((m) => {
    recentActivities.push({
      id: m.id,
      title: `ثبت ${m.type === 'weight' ? 'وزن' : m.type.includes('blood_pressure') ? 'فشار خون' : m.type}: ${toFaDigits(m.value)} ${m.unit}`,
      category: 'سنجش سلامت',
      date: m.recordedAtJalali,
      icon: Activity,
      color: 'text-[#D97B7B] bg-[#D97B7B]/10',
    });
  });

  visits.slice(0, 1).forEach((v) => {
    recentActivities.push({
      id: v.id,
      title: `مراجعه به ${v.doctorName} (${v.reason})`,
      category: 'پزشک و ویزیت',
      date: v.dateJalali,
      icon: Heart,
      color: 'text-[#7C9070] bg-[#7C9070]/10',
    });
  });

  labs.slice(0, 1).forEach((l) => {
    recentActivities.push({
      id: l.id,
      title: `ثبت آزمایش ${l.testName}`,
      category: 'آزمایشگاه',
      date: l.dateJalali,
      icon: Activity,
      color: 'text-[#5B7082] bg-[#5B7082]/10',
    });
  });

  events.slice(0, 1).forEach((e) => {
    recentActivities.push({
      id: e.id,
      title: e.title,
      category: e.category === 'car' ? 'خودرو' : e.category === 'home' ? 'خانه' : 'رویداد',
      date: e.dateJalali,
      icon: Calendar,
      color: 'text-[#4A5D45] bg-[#4A5D45]/10',
    });
  });

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Top Greeting Card (Natural Forest Deep Tone) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#2D3A29] dark:bg-[#1C241B] text-white p-5 sm:p-6 rounded-3xl border border-[#4A5D45]/40 shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl font-bold tracking-tight">
              سلام {profile?.name ? profile.name.split(' ')[0] : profile?.fullName ? profile.fullName.split(' ')[0] : 'عزیز'} 👋
            </span>
          </div>
          <p className="text-[#C2C9BE] text-xs sm:text-sm font-medium mt-1">
            امروز، {dateDisplay}
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2">
          <button
            onClick={onOpenQuickCapture}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#7C9070] hover:bg-[#6B7D60] text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>ثبت سریع</span>
          </button>
        </div>

        {/* Subtle decorative nature circle */}
        <div className="absolute -left-10 -bottom-10 w-44 h-44 bg-[#7C9070]/20 rounded-full blur-2xl pointer-events-none"></div>
      </div>

      {/* Quick Action Pills (ثبت اطلاعات با تم طبیعی) */}
      <div>
        <div className="text-xs font-bold text-[#8A8A87] dark:text-[#9BA598] mb-2.5 flex items-center justify-between px-1">
          <span>دسترسی و ثبت سریع</span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
          <button
            onClick={() => onNavigateToTab('medications')}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#FFFFFF] dark:bg-[#212B1F] border border-[#E5E0D5] dark:border-[#2D3B2C] hover:border-[#7C9070] dark:hover:border-[#7C9070] transition-all shadow-xs group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-[#7C9070]/15 text-[#7C9070] flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
              <Pill className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-[#3C3C3B] dark:text-[#E2E8DF]">دارو</span>
          </button>

          <button
            onClick={() => onNavigateToTab('health')}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#FFFFFF] dark:bg-[#212B1F] border border-[#E5E0D5] dark:border-[#2D3B2C] hover:border-[#D97B7B] dark:hover:border-[#D97B7B] transition-all shadow-xs group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-[#D97B7B]/15 text-[#D97B7B] flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
              <Activity className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-[#3C3C3B] dark:text-[#E2E8DF]">اندازه‌گیری</span>
          </button>

          <button
            onClick={() => onNavigateToTab('doctors')}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#FFFFFF] dark:bg-[#212B1F] border border-[#E5E0D5] dark:border-[#2D3B2C] hover:border-[#4A5D45] dark:hover:border-[#7C9070] transition-all shadow-xs group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-[#4A5D45]/15 text-[#4A5D45] dark:text-[#A8BCA2] flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
              <Heart className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-[#3C3C3B] dark:text-[#E2E8DF]">ویزیت پزشک</span>
          </button>

          <button
            onClick={() => onNavigateToTab('reminders')}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#FFFFFF] dark:bg-[#212B1F] border border-[#E5E0D5] dark:border-[#2D3B2C] hover:border-[#E5B58E] dark:hover:border-[#E5B58E] transition-all shadow-xs group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-[#E5B58E]/25 text-[#B86E3D] flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
              <Bell className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-[#3C3C3B] dark:text-[#E2E8DF]">یادآوری</span>
          </button>

          <button
            onClick={() => onNavigateToTab('journal')}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#FFFFFF] dark:bg-[#212B1F] border border-[#E5E0D5] dark:border-[#2D3B2C] hover:border-[#7C9070] dark:hover:border-[#7C9070] transition-all shadow-xs group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-[#8A8A87]/15 text-[#5A5A58] dark:text-[#C2C9BE] flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-[#3C3C3B] dark:text-[#E2E8DF]">یادداشت</span>
          </button>

          <button
            onClick={() => onNavigateToTab('documents')}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#FFFFFF] dark:bg-[#212B1F] border border-[#E5E0D5] dark:border-[#2D3B2C] hover:border-[#5B7082] dark:hover:border-[#5B7082] transition-all shadow-xs group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-[#5B7082]/15 text-[#5B7082] dark:text-[#8FA7BC] flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-[#3C3C3B] dark:text-[#E2E8DF]">مدرک و سند</span>
          </button>
        </div>
      </div>

      {/* وضعیت سلامت امروز (Today's Status Grid) */}
      <div>
        <div className="flex items-center justify-between mb-2.5 px-1">
          <h3 className="font-bold text-sm text-[#2D3A29] dark:text-[#E5EFE2]">وضعیت سلامت امروز</h3>
          <button
            onClick={() => onNavigateToTab('health')}
            className="text-xs font-semibold text-[#7C9070] hover:text-[#6B7D60] dark:text-[#8DA480] flex items-center gap-1 cursor-pointer"
          >
            <span>مشاهده همه</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Weight Card */}
          <div className="p-4 rounded-2xl bg-[#FFFFFF] dark:bg-[#212B1F] border border-[#E5E0D5] dark:border-[#2D3B2C] shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#8A8A87] dark:text-[#9BA598] text-xs font-medium">
              <span>وزن</span>
              <Activity className="w-4 h-4 text-[#7C9070]" />
            </div>
            <div className="my-2">
              {latestWeight ? (
                <div>
                  <span className="text-2xl font-bold text-[#2D3A29] dark:text-[#E5EFE2]">
                    {toFaDigits(latestWeight.value)}
                  </span>
                  <span className="text-xs text-[#8A8A87] mr-1.5 font-medium">کیلوگرم</span>
                </div>
              ) : (
                <span className="text-xs text-[#8A8A87]">ثبت نشده</span>
              )}
            </div>
            <div className="text-[11px] text-[#8A8A87]">
              {latestWeight ? formatRelativeDays(latestWeight.recordedAtJalali) : 'بدون سابقه'}
            </div>
          </div>

          {/* Blood Pressure Card */}
          <div className="p-4 rounded-2xl bg-[#FFFFFF] dark:bg-[#212B1F] border border-[#E5E0D5] dark:border-[#2D3B2C] shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#8A8A87] dark:text-[#9BA598] text-xs font-medium">
              <span>فشار خون</span>
              <Heart className="w-4 h-4 text-[#D97B7B]" />
            </div>
            <div className="my-2">
              {latestSys && latestDia ? (
                <div>
                  <span className="text-2xl font-bold text-[#2D3A29] dark:text-[#E5EFE2]">
                    {toFaDigits(latestSys.value <= 25 ? latestSys.value : Math.round(latestSys.value / 10))} / {toFaDigits(latestDia.value <= 25 ? latestDia.value : Math.round(latestDia.value / 10))}
                  </span>
                  <span className="text-xs text-[#8A8A87] mr-1.5 font-medium">mmHg</span>
                </div>
              ) : (
                <span className="text-xs text-[#8A8A87]">ثبت نشده</span>
              )}
            </div>
            <div className="text-[11px] text-[#8A8A87]">
              {latestSys ? formatRelativeDays(latestSys.recordedAtJalali) : 'بدون سابقه'}
            </div>
          </div>

          {/* Sleep Card */}
          <div className="p-4 rounded-2xl bg-[#FFFFFF] dark:bg-[#212B1F] border border-[#E5E0D5] dark:border-[#2D3B2C] shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#8A8A87] dark:text-[#9BA598] text-xs font-medium">
              <span>خواب</span>
              <Clock className="w-4 h-4 text-[#5B7082]" />
            </div>
            <div className="my-2">
              {latestSleep ? (
                <div>
                  <span className="text-2xl font-bold text-[#2D3A29] dark:text-[#E5EFE2]">
                    {toFaDigits(latestSleep.value)}
                  </span>
                  <span className="text-xs text-[#8A8A87] mr-1.5 font-medium">ساعت</span>
                </div>
              ) : (
                <span className="text-xs text-[#8A8A87]">ثبت نشده</span>
              )}
            </div>
            <div className="text-[11px] text-[#8A8A87]">
              {latestSleep ? formatRelativeDays(latestSleep.recordedAtJalali) : 'بدون سابقه'}
            </div>
          </div>

          {/* Heart Rate Card */}
          <div className="p-4 rounded-2xl bg-[#FFFFFF] dark:bg-[#212B1F] border border-[#E5E0D5] dark:border-[#2D3B2C] shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#8A8A87] dark:text-[#9BA598] text-xs font-medium">
              <span>ضربان قلب</span>
              <Activity className="w-4 h-4 text-[#7C9070]" />
            </div>
            <div className="my-2">
              {latestHeartRate ? (
                <div>
                  <span className="text-2xl font-bold text-[#2D3A29] dark:text-[#E5EFE2]">
                    {toFaDigits(latestHeartRate.value)}
                  </span>
                  <span className="text-xs text-[#8A8A87] mr-1.5 font-medium">bpm</span>
                </div>
              ) : (
                <span className="text-xs text-[#8A8A87]">ثبت نشده</span>
              )}
            </div>
            <div className="text-[11px] text-[#8A8A87]">
              {latestHeartRate ? formatRelativeDays(latestHeartRate.recordedAtJalali) : 'بدون سابقه'}
            </div>
          </div>
        </div>
      </div>

      {/* ویجت مصرف آب روزانه (Daily Water Intake Tracker) */}
      <div className="bg-[#FFFFFF] dark:bg-[#212B1F] p-5 rounded-3xl border border-[#E5E0D5] dark:border-[#2D3B2C] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center flex-shrink-0">
              <Droplet className="w-5 h-5 fill-cyan-500/30" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-[#2D3A29] dark:text-[#E5EFE2]">مصرف آب امروز</h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                  {toFaDigits(waterProgress)}٪ از هدف روزانه
                </span>
              </div>
              <p className="text-xs text-[#8A8A87] dark:text-[#9BA598] mt-0.5">
                مجموع: <span className="font-bold text-[#2D3A29] dark:text-[#E5EFE2]">{toFaDigits(totalWaterToday)}</span> از {toFaDigits(waterGoal)} میلی‌لیتر (حدود {toFaDigits(Math.round(totalWaterToday / 250))} لیوان)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleQuickAddWaterHome(250)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 text-xs font-bold transition-all active:scale-95 cursor-pointer"
              title="ثبت ۱ لیوان آب (۲۵۰ میلی‌لیتر) با ساعت دقیق الان"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+۱ لیوان (۲۵۰ml)</span>
            </button>
            <button
              onClick={() => handleQuickAddWaterHome(500)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-600 text-white hover:bg-cyan-700 text-xs font-bold transition-all active:scale-95 shadow-xs cursor-pointer"
              title="ثبت ۱ بطری آب (۵۰۰ میلی‌لیتر) با ساعت دقیق الان"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+۵۰۰ml</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-[#E5E0D5]/60 dark:bg-[#2D3B2C] h-3 rounded-full overflow-hidden mb-2">
          <div
            className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${waterProgress}%` }}
          ></div>
        </div>

        {/* Recent Water Intake entries today */}
        {todayWaterEntries.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-2">
            <span className="text-[11px] text-[#8A8A87] whitespace-nowrap">ثبت‌های امروز:</span>
            {todayWaterEntries.map((w, idx) => (
              <span
                key={w.id || idx}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-[#FAF9F5] dark:bg-[#1C241B] border border-[#E5E0D5] dark:border-[#2C3A2A] text-[#5A5A58] dark:text-[#C2C9BE] whitespace-nowrap font-medium"
              >
                {toFaDigits(w.value)} ml {w.time || w.recordedTime ? `(ساعت ${toFaDigits(w.time || w.recordedTime || '')})` : ''}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* داروهای امروز (Today's Medications) */}
      <div className="bg-[#FFFFFF] dark:bg-[#212B1F] p-5 rounded-3xl border border-[#E5E0D5] dark:border-[#2D3B2C] shadow-xs">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#7C9070]/15 text-[#7C9070] flex items-center justify-center">
              <Pill className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#2D3A29] dark:text-[#E5EFE2]">داروهای امروز</h3>
              <p className="text-[11px] text-[#8A8A87]">برای ثبت مصرف، روی نوبت دارو کلیک کنید</p>
            </div>
          </div>
          <button
            onClick={() => onNavigateToTab('medications')}
            className="text-xs font-semibold text-[#7C9070] hover:text-[#6B7D60] dark:text-[#8DA480] flex items-center gap-1 cursor-pointer"
          >
            <span>برنامه کامل</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        {activeMeds.length === 0 ? (
          <div className="text-center py-6 text-[#8A8A87] text-xs">
            هنوز دارویی ثبت نکرده‌اید.
          </div>
        ) : (
          <div className="space-y-2.5">
            {activeMeds.map((med) => {
              const slots: ('صبح' | 'ظهر' | 'عصر' | 'شب')[] = med.timeSlotLabels || ['صبح'];
              return (
                <div
                  key={med.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-2xl bg-[#FAF9F5] dark:bg-[#1C241B] border border-[#E5E0D5] dark:border-[#2C3A2A] gap-2.5"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#7C9070]"></div>
                    <div>
                      <div className="font-bold text-xs sm:text-sm text-[#2D3A29] dark:text-[#E5EFE2]">
                        {med.name}
                      </div>
                      <div className="text-[11px] text-[#8A8A87] dark:text-[#9BA598]">
                        {med.dosage} {med.reason ? `— ${med.reason}` : ''}
                      </div>
                    </div>
                  </div>

                  {/* Time Slots checkboxes */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {slots.map((slot) => {
                      const isTaken = isMedTakenToday(med.id, slot);
                      return (
                        <button
                          key={slot}
                          onClick={() => handleToggleMedicationStatus(med, slot)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                            isTaken
                              ? 'bg-[#7C9070] text-white shadow-xs'
                              : 'bg-[#FFFFFF] dark:bg-[#253023] text-[#3C3C3B] dark:text-[#C2C9BE] border border-[#E5E0D5] dark:border-[#2C3A2A] hover:border-[#7C9070]'
                          }`}
                        >
                          <CheckCircle2 className={`w-3.5 h-3.5 ${isTaken ? 'text-white' : 'text-[#8A8A87]'}`} />
                          <span>{slot}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* پیگیری‌های مهم (Important Follow-ups & Reminders) */}
      <div className="bg-[#FFFFFF] dark:bg-[#212B1F] p-5 rounded-3xl border border-[#E5E0D5] dark:border-[#2D3B2C] shadow-xs">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#E5B58E]/25 text-[#B86E3D] flex items-center justify-center">
              <CalendarClock className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#2D3A29] dark:text-[#E5EFE2]">پیگیری‌های مهم</h3>
              <p className="text-[11px] text-[#8A8A87]">آزمایش‌ها، تمدید بیمه، سرویس خودرو و ویزیت‌ها</p>
            </div>
          </div>
          <button
            onClick={() => onNavigateToTab('reminders')}
            className="text-xs font-semibold text-[#7C9070] hover:text-[#6B7D60] dark:text-[#8DA480] flex items-center gap-1 cursor-pointer"
          >
            <span>همه</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        {upcomingReminders.length === 0 ? (
          <div className="text-center py-6 text-[#8A8A87] text-xs">
            هیچ پیگیری یا یادآوری فعالی وجود ندارد.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {upcomingReminders.map((rem) => {
              const relDays = formatRelativeDays(rem.dueDateJalali);
              return (
                <div
                  key={rem.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-[#FAF9F5] dark:bg-[#1C241B] border border-[#E5E0D5] dark:border-[#2C3A2A] text-right group hover:border-[#E5B58E] transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      onClick={() => handleToggleReminder(rem)}
                      className="p-1 rounded-lg text-[#8A8A87] hover:text-[#7C9070] transition-colors cursor-pointer"
                      title="تغییر وضعیت انجام"
                    >
                      <CheckCircle2 className="w-4.5 h-4.5" />
                    </button>
                    <div className="min-w-0">
                      <div className="font-bold text-xs sm:text-sm text-[#2D3A29] dark:text-[#E5EFE2] truncate">
                        {rem.title}
                      </div>
                      <div className="text-[11px] text-[#8A8A87] mt-0.5">
                        {formatJalaliReadable(rem.dueDateJalali)}
                      </div>
                    </div>
                  </div>

                  <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-[#E5B58E]/25 text-[#8A5229] dark:text-[#E5B58E] flex-shrink-0 mr-2">
                    {relDays}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* آخرین فعالیت‌ها (Recent Timeline Stream) */}
      <div className="bg-[#FFFFFF] dark:bg-[#212B1F] p-5 rounded-3xl border border-[#E5E0D5] dark:border-[#2D3B2C] shadow-xs">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#7C9070]/15 text-[#7C9070] flex items-center justify-center">
              <Clock className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#2D3A29] dark:text-[#E5EFE2]">آخرین فعالیت‌ها</h3>
              <p className="text-[11px] text-[#8A8A87]">مرور سریع آخرین رویدادهای ثبت‌شده در خط زمانی</p>
            </div>
          </div>
          <button
            onClick={() => onNavigateToTab('timeline')}
            className="text-xs font-semibold text-[#7C9070] hover:text-[#6B7D60] dark:text-[#8DA480] flex items-center gap-1 cursor-pointer"
          >
            <span>خط زمانی کامل</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentActivities.length === 0 ? (
          <div className="text-center py-6 text-[#8A8A87] text-xs">
            هنوز فعالیتی ثبت نشده است. با دکمه «+ ثبت» اولین مورد را اضافه کنید.
          </div>
        ) : (
          <div className="space-y-2">
            {recentActivities.map((act) => {
              const Icon = act.icon;
              return (
                <div
                  key={act.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-[#FAF9F5] dark:bg-[#1C241B] border border-[#E5E0D5] dark:border-[#2C3A2A] text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${act.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-[#2D3A29] dark:text-[#E5EFE2]">{act.title}</div>
                      <div className="text-[10px] text-[#8A8A87] mt-0.5">{act.category}</div>
                    </div>
                  </div>
                  <span className="text-[11px] text-[#8A8A87] font-medium">
                    {formatRelativeDays(act.date)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};


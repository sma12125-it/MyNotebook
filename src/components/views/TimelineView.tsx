import React, { useState } from 'react';
import {
  GitCommit,
  Calendar,
  Pill,
  UserCheck,
  FlaskConical,
  FileText,
  Car,
  Home,
  BookOpen,
  Filter,
  Clock,
  Droplet,
  Activity,
  Search,
  CheckCircle2,
  Bell,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { AppState, TabType } from '../../types';
import { StorageService } from '../../services/storage';
import { toFaDigits, formatJalaliReadable, formatDateTimeFa, getTodayJalali } from '../../utils/jalali';
import { EmptyState } from '../common/EmptyState';

interface TimelineViewProps {
  appState: AppState;
  onNavigateToTab: (tab: TabType) => void;
  onRefreshData?: () => void;
  onOpenQuickCapture?: () => void;
}

interface TimelineItem {
  id: string;
  type: 'water' | 'measurement' | 'visit' | 'lab' | 'medication' | 'doc' | 'event' | 'journal' | 'reminder';
  title: string;
  subtitle?: string;
  dateJalali: string;
  time?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  tag?: string;
  details?: string;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  appState,
  onNavigateToTab,
  onRefreshData,
  onOpenQuickCapture,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Collect all items across modules safely from appState or live storage
  const items: TimelineItem[] = [];

  // 1. Water Intake & Health Measurements
  const vitalsList = appState.vitals || appState.measurements || StorageService.getMeasurements() || [];
  vitalsList.forEach((m) => {
    if (!m) return;
    const isWater = m.type === 'water_intake';
    const timeDisplay = m.time || m.recordedTime || m.timeJalali || '';

    if (isWater) {
      const glasses = Math.round((m.value || 250) / 250);
      items.push({
        id: m.id || `water-${Math.random()}`,
        type: 'water',
        title: `مصرف ${toFaDigits(m.value)} میلی‌لیتر آب`,
        subtitle: m.notes ? `${m.notes} (معادل ${toFaDigits(glasses)} لیوان آب)` : `نوشیدن آب سالم (حدود ${toFaDigits(glasses)} لیوان)`,
        dateJalali: m.recordedAtJalali || getTodayJalali(),
        time: timeDisplay,
        icon: Droplet,
        color: 'bg-cyan-500 text-white',
        tag: 'مصرف آب',
      });
    } else {
      let typeLabel = 'سنجش سلامت';
      let unit = m.unit || '';
      if (m.type === 'blood_pressure_sys') typeLabel = 'فشار خون سیستولیک';
      else if (m.type === 'blood_pressure_dia') typeLabel = 'فشار خون دیاستولیک';
      else if (m.type === 'weight') typeLabel = 'وزن بدن';
      else if (m.type === 'blood_glucose') typeLabel = 'قند خون ناشتا';
      else if (m.type === 'heart_rate') typeLabel = 'ضربان قلب';
      else if (m.type === 'sleep_hours') typeLabel = 'میزان خواب';
      else if (m.type === 'blood_oxygen') typeLabel = 'اکسیژن خون';
      else if (m.type === 'temperature') typeLabel = 'دمای بدن';

      items.push({
        id: m.id || `measure-${Math.random()}`,
        type: 'measurement',
        title: `${typeLabel}: ${toFaDigits(m.value)} ${unit}`,
        subtitle: m.notes || undefined,
        dateJalali: m.recordedAtJalali || getTodayJalali(),
        time: timeDisplay,
        icon: Activity,
        color: 'bg-rose-500 text-white',
        tag: typeLabel,
      });
    }
  });

  // 2. Doctor Visits
  (appState.visits || []).forEach((v) => {
    if (!v) return;
    items.push({
      id: v.id || `visit-${Math.random()}`,
      type: 'visit',
      title: `ویزیت با ${v.doctorName}`,
      subtitle: `علت: ${v.reason}${v.diagnosis ? ` | تشخیص: ${v.diagnosis}` : ''}${v.instructions ? ` | دستور: ${v.instructions}` : ''}`,
      dateJalali: v.dateJalali || getTodayJalali(),
      time: v.time || v.timeJalali,
      icon: UserCheck,
      color: 'bg-emerald-600 text-white',
      tag: v.specialty || 'پزشک',
    });
  });

  // 3. Laboratory Tests
  (appState.labs || []).forEach((l) => {
    if (!l) return;
    items.push({
      id: l.id || `lab-${Math.random()}`,
      type: 'lab',
      title: l.testName,
      subtitle: l.summary || (l.results ? `${toFaDigits(l.results.length)} فاکتور آزمایشگاهی ثبت شده` : (l.laboratoryName ? `آزمایشگاه ${l.laboratoryName}` : '')),
      dateJalali: l.dateJalali || getTodayJalali(),
      time: l.time || l.timeJalali,
      icon: FlaskConical,
      color: 'bg-teal-600 text-white',
      tag: 'آزمایشگاه',
    });
  });

  // 4. Medication Logs & Active Medications
  const medLogs = StorageService.getMedicationLogs();
  medLogs.forEach((ml) => {
    const med = (appState.medications || []).find((m) => m.id === ml.medicationId);
    items.push({
      id: ml.id || `medlog-${Math.random()}`,
      type: 'medication',
      title: `مصرف داروی ${med?.name || 'تجویز شده'} (${ml.timeSlot})`,
      subtitle: med ? `دوز: ${med.dosage} - ${med.instructions || 'طبق دستور پزشک'}` : 'ثبت مصرف داروی روزانه',
      dateJalali: ml.dateJalali || getTodayJalali(),
      time: ml.time || ml.timeJalali || ml.scheduledTime,
      icon: Pill,
      color: 'bg-green-600 text-white',
      tag: 'مصرف دارو',
    });
  });

  (appState.medications || []).forEach((med) => {
    items.push({
      id: `med-${med.id}`,
      type: 'medication',
      title: `شروع/برنامه دارویی: ${med.name}`,
      subtitle: `دوز: ${med.dosage} | زمان: ${med.frequency} ${med.instructions ? `| دستور: ${med.instructions}` : ''}`,
      dateJalali: med.startDateJalali || getTodayJalali(),
      time: med.time || med.timeJalali,
      icon: Pill,
      color: 'bg-lime-600 text-white',
      tag: 'دارو',
    });
  });

  // 5. Documents & Scans
  (appState.documents || []).forEach((d) => {
    if (!d) return;
    items.push({
      id: d.id || `doc-${Math.random()}`,
      type: 'doc',
      title: `ثبت سند: ${d.title}`,
      subtitle: d.notes || (d.tags && d.tags.length > 0 ? d.tags.join('، ') : 'مدرک یا تصویر ضمیمه شده'),
      dateJalali: d.dateJalali || getTodayJalali(),
      time: d.time || d.timeJalali,
      icon: FileText,
      color: 'bg-amber-600 text-white',
      tag: d.category === 'medical' ? 'پزشکی' : d.category === 'car' ? 'خودرو' : d.category === 'insurance' ? 'بیمه' : 'سند',
    });
  });

  // 6. Life Events & Car Services
  (appState.events || []).forEach((e) => {
    if (!e) return;
    items.push({
      id: e.id || `event-${Math.random()}`,
      type: 'event',
      title: e.title,
      subtitle: e.description || (e.cost ? `هزینه: ${toFaDigits(e.cost.toLocaleString('fa-IR'))} تومان` : ''),
      dateJalali: e.dateJalali || getTodayJalali(),
      time: e.time || e.timeJalali,
      icon: e.category === 'car' ? Car : Home,
      color: 'bg-orange-600 text-white',
      tag: e.category === 'car' ? 'خودرو و سرویس' : e.category === 'home' ? 'خانه' : 'رویداد زندگی',
    });
  });

  // 7. Journal Entries
  (appState.journal || []).forEach((j) => {
    if (!j) return;
    const text = j.content || j.text || '';
    items.push({
      id: j.id || `journal-${Math.random()}`,
      type: 'journal',
      title: j.title || 'یادداشت روزانه',
      subtitle: text ? (text.length > 90 ? text.slice(0, 90) + '...' : text) : 'بدون متن',
      dateJalali: j.dateJalali || getTodayJalali(),
      time: j.time || j.timeJalali,
      icon: BookOpen,
      color: 'bg-indigo-600 text-white',
      tag: 'یادداشت و احوال',
    });
  });

  // 8. Completed Reminders
  (appState.reminders || []).forEach((r) => {
    if (!r) return;
    items.push({
      id: `rem-${r.id}`,
      type: 'reminder',
      title: `یادآوری: ${r.title}`,
      subtitle: r.notes || (r.isCompleted ? 'انجام شده' : 'در انتظار اقدام'),
      dateJalali: r.dueDateJalali || getTodayJalali(),
      time: r.time || r.dueTime || r.timeJalali,
      icon: Bell,
      color: r.isCompleted ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white',
      tag: r.isCompleted ? 'انجام شده' : 'یادآوری',
    });
  });

  // Sort descending by Jalali date + time
  items.sort((a, b) => {
    const dateComp = (b.dateJalali || '').localeCompare(a.dateJalali || '');
    if (dateComp !== 0) return dateComp;
    return (b.time || '').localeCompare(a.time || '');
  });

  // Apply filters
  const filtered = items.filter((item) => {
    const matchesFilter = filterType === 'all' || item.type === filterType;
    const matchesSearch =
      !searchQuery.trim() ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.subtitle && item.subtitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.tag && item.tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.dateJalali.includes(searchQuery);

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#2D3A29] dark:text-[#E5EFE2]">
              خط زمان یکپارچه زندگی
            </h2>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#7C9070]/15 text-[#7C9070] dark:text-[#A8BCA2]">
              {toFaDigits(items.length)} رویداد ثبت شده
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#8A8A87] dark:text-[#9BA598] mt-1">
            مرور لحظه‌به‌لحظه تمام رخدادها، مصرف آب، ویزیت‌ها، داروها، آزمایش‌ها و یادداشت‌ها با ساعت دقیق
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onRefreshData && (
            <button
              onClick={onRefreshData}
              className="p-2.5 rounded-2xl bg-white dark:bg-[#212B1F] border border-[#E5E0D5] dark:border-[#2D3B2C] text-[#5A5A58] dark:text-[#C2C9BE] hover:text-[#7C9070] transition-colors shadow-xs cursor-pointer"
              title="به‌روزرسانی خط زمان"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}

          {onOpenQuickCapture && (
            <button
              onClick={onOpenQuickCapture}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#7C9070] hover:bg-[#6B7D60] text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>ثبت رویداد جدید</span>
            </button>
          )}
        </div>
      </div>

      {/* Search and Category Filter Chips */}
      <div className="space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8A8A87]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در وقایع، آب، پزشکان، داروها، آزمایش‌ها یا تاریخ..."
            className="w-full pl-4 pr-10 py-2.5 rounded-2xl bg-white dark:bg-[#212B1F] border border-[#E5E0D5] dark:border-[#2D3B2C] text-sm text-[#2D3A29] dark:text-[#E5EFE2] placeholder:text-[#8A8A87] focus:outline-none focus:ring-2 focus:ring-[#7C9070]/30 transition-all shadow-xs"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: 'all', label: 'همه وقایع' },
            { id: 'water', label: 'مصرف آب' },
            { id: 'measurement', label: 'سنجش‌های سلامت' },
            { id: 'medication', label: 'داروها' },
            { id: 'visit', label: 'ویزیت پزشک' },
            { id: 'lab', label: 'آزمایش‌ها' },
            { id: 'doc', label: 'اسناد و مدارک' },
            { id: 'event', label: 'رویداد و خودرو' },
            { id: 'journal', label: 'یادداشت‌ها' },
            { id: 'reminder', label: 'یادآوری‌ها' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 cursor-pointer ${
                filterType === f.id
                  ? 'bg-[#7C9070] text-white shadow-xs'
                  : 'bg-white dark:bg-[#212B1F] text-[#5A5A58] dark:text-[#C2C9BE] border border-[#E5E0D5] dark:border-[#2D3B2C] hover:border-[#7C9070]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline list */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={GitCommit}
          title="هیچ رویدادی با این مشخصات یافت نشد"
          description="با ثبت مصرف آب، ویزیت‌ها، داروها، آزمایش‌ها یا یادداشت‌ها، سوابق در خط زمانی به زیبایی نمایش می‌یابند."
          actionText={onOpenQuickCapture ? "ثبت اطلاعات جدید" : undefined}
          onAction={onOpenQuickCapture}
        />
      ) : (
        <div className="relative pr-6 border-r-2 border-[#E5E0D5] dark:border-[#2D3B2C] space-y-5 mr-3">
          {filtered.map((item) => {
            const Icon = item.icon;
            const targetTab: TabType =
              item.type === 'visit'
                ? 'doctors'
                : item.type === 'lab'
                ? 'labs'
                : item.type === 'medication'
                ? 'medications'
                : item.type === 'doc'
                ? 'documents'
                : item.type === 'event'
                ? 'events'
                : item.type === 'journal'
                ? 'journal'
                : item.type === 'water' || item.type === 'measurement'
                ? 'health'
                : item.type === 'reminder'
                ? 'reminders'
                : 'home';

            return (
              <div key={item.id} className="relative group">
                {/* Timeline node */}
                <div
                  className={`absolute -right-[33px] top-2 w-7 h-7 rounded-full flex items-center justify-center shadow-md ${item.color} ring-4 ring-[#FDFCF9] dark:ring-[#161D15] transition-transform group-hover:scale-110`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>

                {/* Card */}
                <div
                  onClick={() => onNavigateToTab(targetTab)}
                  className="p-4 rounded-3xl bg-white dark:bg-[#212B1F] border border-[#E5E0D5] dark:border-[#2D3B2C] shadow-xs hover:border-[#7C9070] dark:hover:border-[#7C9070] transition-all cursor-pointer hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 text-[11px] font-bold text-[#8A8A87] dark:text-[#9BA598] mb-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-[#7C9070]" />
                          {formatJalaliReadable(item.dateJalali)}
                        </span>
                        {item.time && (
                          <span className="flex items-center gap-1 text-[#7C9070] dark:text-[#A8BCA2] font-mono">
                            <Clock className="w-3 h-3" />
                            ساعت {toFaDigits(item.time)}
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-sm sm:text-base text-[#2D3A29] dark:text-[#E5EFE2] group-hover:text-[#7C9070] transition-colors">
                        {item.title}
                      </h4>
                    </div>

                    {item.tag && (
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#E5E0D5]/50 dark:bg-[#2D3B2C] text-[#5A5A58] dark:text-[#C2C9BE] font-semibold flex-shrink-0">
                        {item.tag}
                      </span>
                    )}
                  </div>

                  {item.subtitle && (
                    <p className="text-xs text-[#5A5A58] dark:text-[#C2C9BE] mt-2 leading-relaxed">
                      {item.subtitle}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

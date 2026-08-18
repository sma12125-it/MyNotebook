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
} from 'lucide-react';
import { AppState } from '../../types';
import { toFaDigits, formatJalaliReadable } from '../../utils/jalali';
import { EmptyState } from '../common/EmptyState';

interface TimelineViewProps {
  appState: AppState;
  onNavigateToTab: (tab: any) => void;
}

interface TimelineItem {
  id: string;
  type: 'visit' | 'lab' | 'doc' | 'event' | 'journal' | 'medication';
  title: string;
  subtitle?: string;
  dateJalali: string;
  icon: any;
  color: string;
  tag?: string;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  appState,
  onNavigateToTab,
}) => {
  const [filterType, setFilterType] = useState<string>('all');

  // Collect all items across modules
  const items: TimelineItem[] = [];

  // 1. Visits
  appState.visits.forEach((v) => {
    items.push({
      id: v.id,
      type: 'visit',
      title: `ویزیت با ${v.doctorName}`,
      subtitle: `علت: ${v.reason}${v.diagnosis ? ` | تشخیص: ${v.diagnosis}` : ''}`,
      dateJalali: v.dateJalali,
      icon: UserCheck,
      color: 'bg-[#7C9070] text-white',
      tag: v.specialty || 'پزشک',
    });
  });

  // 2. Labs
  appState.labs.forEach((l) => {
    items.push({
      id: l.id,
      type: 'lab',
      title: l.testName,
      subtitle: l.summary || (l.results ? `${toFaDigits(l.results.length)} فاکتور ثبت شده` : ''),
      dateJalali: l.dateJalali,
      icon: FlaskConical,
      color: 'bg-[#8D9B6A] text-white',
      tag: 'آزمایشگاه',
    });
  });

  // 3. Documents
  appState.documents.forEach((d) => {
    items.push({
      id: d.id,
      type: 'doc',
      title: `ثبت سند: ${d.title}`,
      subtitle: d.notes || d.tags?.join('، '),
      dateJalali: d.dateJalali,
      icon: FileText,
      color: 'bg-[#BCA37F] text-white',
      tag: 'سند',
    });
  });

  // 4. Life Events
  appState.events.forEach((e) => {
    items.push({
      id: e.id,
      type: 'event',
      title: e.title,
      subtitle: e.description || (e.cost ? `هزینه: ${toFaDigits(e.cost.toLocaleString('fa-IR'))} تومان` : ''),
      dateJalali: e.dateJalali,
      icon: e.category === 'car' ? Car : Home,
      color: 'bg-[#967E76] text-white',
      tag: e.category === 'car' ? 'خودرو' : e.category === 'home' ? 'خانه' : 'رویداد',
    });
  });

  // 5. Journal
  appState.journal.forEach((j) => {
    items.push({
      id: j.id,
      type: 'journal',
      title: j.title || 'یادداشت روزانه',
      subtitle: j.content.slice(0, 80) + '...',
      dateJalali: j.dateJalali,
      icon: BookOpen,
      color: 'bg-[#606C38] text-white',
      tag: 'احوال روزانه',
    });
  });

  // Sort descending by Jalali date string
  items.sort((a, b) => b.dateJalali.localeCompare(a.dateJalali));

  // Filter
  const filtered = items.filter((item) => filterType === 'all' || item.type === filterType);

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-foreground">
            خط زمان یکپارچه زندگی
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            مرور تمام وقایع، ویزیت‌ها، آزمایش‌ها، اسناد و یادداشت‌ها به ترتیب زمان
          </p>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {[
          { id: 'all', label: 'همه وقایع' },
          { id: 'visit', label: 'ویزیت‌ها' },
          { id: 'lab', label: 'آزمایش‌ها' },
          { id: 'doc', label: 'اسناد' },
          { id: 'event', label: 'رویداد و خودرو' },
          { id: 'journal', label: 'یادداشت‌ها' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilterType(f.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
              filterType === f.id
                ? 'bg-primary text-white shadow-xs'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Timeline list */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={GitCommit}
          title="هنوز رویدادی در خط زمان ثبت نشده است"
          description="با ثبت ویزیت‌ها، داروها، آزمایش‌ها و یادداشت‌های روزانه، خط زمان زندگی شما به صورت خودکار شکل می‌گیرد."
        />
      ) : (
        <div className="relative pr-6 border-r-2 border-border space-y-6 mr-3">
          {filtered.map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.id} className="relative group">
                {/* Timeline node */}
                <div
                  className={`absolute -right-[33px] top-1.5 w-7 h-7 rounded-full flex items-center justify-center shadow-md ${item.color} ring-4 ring-background`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>

                {/* Card */}
                <div className="p-4 rounded-3xl bg-card border border-border shadow-xs hover:border-primary/50 transition-all">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-bold text-muted-foreground block mb-1">
                        {formatJalaliReadable(item.dateJalali)}
                      </span>
                      <h4 className="font-bold text-sm sm:text-base text-foreground">
                        {item.title}
                      </h4>
                    </div>

                    {item.tag && (
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold flex-shrink-0">
                        {item.tag}
                      </span>
                    )}
                  </div>

                  {item.subtitle && (
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
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

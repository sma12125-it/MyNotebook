import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Pill,
  UserCheck,
  FlaskConical,
  Activity,
  Calendar,
  FileText,
  Bell,
  ArrowLeft,
} from 'lucide-react';
import { StorageService } from '../../services/storage';
import { ActiveTab } from '../../types';
import { toFaDigits } from '../../utils/jalali';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab?: (tab: ActiveTab, entityId?: string) => void;
  onSelectResult?: (tab: ActiveTab, entityId?: string) => void;
  appState?: any;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigateToTab,
  onSelectResult,
}) => {
  const [query, setQuery] = useState('');

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;

    const meds = (StorageService.getMedications() || []).filter(
      (m) => (m?.name && m.name.toLowerCase().includes(q)) || (m?.reason && m.reason.toLowerCase().includes(q))
    );

    const docs = (StorageService.getDoctors() || []).filter(
      (d) =>
        (d?.name && d.name.toLowerCase().includes(q)) ||
        (d?.specialty && d.specialty.toLowerCase().includes(q)) ||
        (d?.clinicName && d.clinicName.toLowerCase().includes(q))
    );

    const labs = (StorageService.getLabs() || []).filter(
      (l) =>
        (l?.testName && l.testName.toLowerCase().includes(q)) ||
        (l?.results && l.results.some((r) => r?.parameter && r.parameter.toLowerCase().includes(q)))
    );

    const reminders = (StorageService.getReminders() || []).filter(
      (r) => (r?.title && r.title.toLowerCase().includes(q)) || (r?.notes && r.notes.toLowerCase().includes(q))
    );

    const events = (StorageService.getEvents() || []).filter(
      (e) => (e?.title && e.title.toLowerCase().includes(q)) || (e?.description && e.description.toLowerCase().includes(q))
    );

    const documents = (StorageService.getDocuments() || []).filter(
      (d) => (d?.title && d.title.toLowerCase().includes(q)) || (d?.tags && d.tags.some((t) => t.toLowerCase().includes(q)))
    );

    const journal = (StorageService.getJournal() || []).filter(
      (j) => (j?.text && j.text.toLowerCase().includes(q)) || (j?.content && j.content.toLowerCase().includes(q))
    );

    const measurements = (StorageService.getMeasurements() || []).filter(
      (m) => (m?.type && m.type.includes(q)) || (m?.notes && m.notes.toLowerCase().includes(q))
    );

    const totalCount =
      meds.length +
      docs.length +
      labs.length +
      reminders.length +
      events.length +
      documents.length +
      journal.length +
      measurements.length;

    return {
      totalCount,
      meds,
      docs,
      labs,
      reminders,
      events,
      documents,
      journal,
      measurements,
    };
  }, [query]);

  if (!isOpen) return null;

  const handleSelectResult = (tab: ActiveTab) => {
    if (onSelectResult) {
      onSelectResult(tab);
    } else if (onNavigateToTab) {
      onNavigateToTab(tab);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 mt-6 sm:mt-12 flex flex-col max-h-[80vh]">
        
        {/* Search Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جستجو در تمام داروها، آزمایش‌ها، پزشکان، یادآوری‌ها و رویدادها..."
            className="flex-1 bg-transparent text-sm sm:text-base text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2.5 py-1 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            بستن
          </button>
        </div>

        {/* Results Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {!query.trim() && (
            <div className="text-center py-10 text-slate-400 text-xs sm:text-sm">
              عبارتی مانند «ویتامین D»، «بیمه ماشین»، «لوزارتان» یا «دکتر قلب» را جستجو کنید...
            </div>
          )}

          {searchResults && searchResults.totalCount === 0 && (
            <div className="text-center py-10 text-slate-400 text-xs sm:text-sm">
              موردی با عنوان «{query}» یافت نشد.
            </div>
          )}

          {searchResults && searchResults.totalCount > 0 && (
            <div className="space-y-4">
              {/* Medications */}
              {searchResults.meds.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                    <Pill className="w-3.5 h-3.5 text-emerald-500" />
                    <span>داروها ({toFaDigits(searchResults.meds.length)})</span>
                  </div>
                  <div className="space-y-1.5">
                    {searchResults.meds.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => handleSelectResult('medications')}
                        className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-right flex items-center justify-between text-xs transition-colors"
                      >
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{m.name}</div>
                          <div className="text-slate-500 mt-0.5">{m.dosage} - {m.reason}</div>
                        </div>
                        <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Doctors */}
              {searchResults.docs.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-cyan-500" />
                    <span>پزشکان ({toFaDigits(searchResults.docs.length)})</span>
                  </div>
                  <div className="space-y-1.5">
                    {searchResults.docs.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => handleSelectResult('doctors')}
                        className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 text-right flex items-center justify-between text-xs transition-colors"
                      >
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{d.name}</div>
                          <div className="text-slate-500 mt-0.5">{d.specialty} - {d.clinicName}</div>
                        </div>
                        <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Laboratory Tests */}
              {searchResults.labs.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                    <FlaskConical className="w-3.5 h-3.5 text-purple-500" />
                    <span>آزمایش‌ها ({toFaDigits(searchResults.labs.length)})</span>
                  </div>
                  <div className="space-y-1.5">
                    {searchResults.labs.map((l) => (
                      <button
                        key={l.id}
                        onClick={() => handleSelectResult('labs')}
                        className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-right flex items-center justify-between text-xs transition-colors"
                      >
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{l.testName}</div>
                          <div className="text-slate-500 mt-0.5">{l.laboratoryName} - {l.dateJalali}</div>
                        </div>
                        <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Reminders */}
              {searchResults.reminders.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-amber-500" />
                    <span>یادآوری‌ها ({toFaDigits(searchResults.reminders.length)})</span>
                  </div>
                  <div className="space-y-1.5">
                    {searchResults.reminders.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => handleSelectResult('reminders')}
                        className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-right flex items-center justify-between text-xs transition-colors"
                      >
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{r.title}</div>
                          <div className="text-slate-500 mt-0.5">موعد: {r.dueDateJalali}</div>
                        </div>
                        <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Life Events */}
              {searchResults.events.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-teal-500" />
                    <span>رویدادها و هزینه‌ها ({toFaDigits(searchResults.events.length)})</span>
                  </div>
                  <div className="space-y-1.5">
                    {searchResults.events.map((e) => (
                      <button
                        key={e.id}
                        onClick={() => handleSelectResult('events')}
                        className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 hover:bg-teal-50 dark:hover:bg-teal-950/40 text-right flex items-center justify-between text-xs transition-colors"
                      >
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{e.title}</div>
                          <div className="text-slate-500 mt-0.5">{e.description || e.dateJalali}</div>
                        </div>
                        <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Documents */}
              {searchResults.documents.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-orange-500" />
                    <span>مدارک و اسناد ({toFaDigits(searchResults.documents.length)})</span>
                  </div>
                  <div className="space-y-1.5">
                    {searchResults.documents.map((doc) => (
                      <button
                        key={doc.id}
                        onClick={() => handleSelectResult('documents')}
                        className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 hover:bg-orange-50 dark:hover:bg-orange-950/40 text-right flex items-center justify-between text-xs transition-colors"
                      >
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{doc.title}</div>
                          <div className="text-slate-500 mt-0.5">{doc.tags.join('، ')}</div>
                        </div>
                        <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

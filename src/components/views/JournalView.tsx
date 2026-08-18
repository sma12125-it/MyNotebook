import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Smile,
  Meh,
  Frown,
  Zap,
  Trash2,
  Edit2,
  X,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { JournalEntry, MoodType } from '../../types';
import { StorageService } from '../../services/storage';
import { getTodayJalali, toFaDigits, formatJalaliReadable } from '../../utils/jalali';
import { EmptyState } from '../common/EmptyState';

interface JournalViewProps {
  entries: JournalEntry[];
  onRefreshData: () => void;
  onOpenQuickCapture: () => void;
}

export const JournalView: React.FC<JournalViewProps> = ({
  entries,
  onRefreshData,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [dateJalali, setDateJalali] = useState(getTodayJalali());
  const [mood, setMood] = useState<MoodType>('good');
  const [energyLevel, setEnergyLevel] = useState<number>(4);
  const [tagsInput, setTagsInput] = useState('');

  const moods: { id: MoodType; label: string; icon: any; color: string }[] = [
    { id: 'great', label: 'عالی', icon: Sparkles, color: 'text-[#606C38] bg-[#7C9070]/20 dark:text-[#A3B899]' },
    { id: 'good', label: 'خوب و آرام', icon: Smile, color: 'text-primary bg-primary/10' },
    { id: 'neutral', label: 'معمولی', icon: Meh, color: 'text-[#A0937D] bg-[#A0937D]/15' },
    { id: 'tired', label: 'خسته / کم‌انرژی', icon: Zap, color: 'text-amber-700 bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300' },
    { id: 'bad', label: 'بی‌حوصله / نگران', icon: Frown, color: 'text-rose-700 bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300' },
  ];

  const handleOpenModal = (entry?: JournalEntry) => {
    if (entry) {
      setEditingEntry(entry);
      setTitle(entry.title || '');
      setContent(entry.content);
      setDateJalali(entry.dateJalali);
      setMood(entry.mood || 'good');
      setEnergyLevel(entry.energyLevel || 4);
      setTagsInput(entry.tags ? entry.tags.join('، ') : '');
    } else {
      setEditingEntry(null);
      setTitle('');
      setContent('');
      setDateJalali(getTodayJalali());
      setMood('good');
      setEnergyLevel(4);
      setTagsInput('');
    }
    setIsAddModalOpen(true);
  };

  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    const all = StorageService.getJournalEntries();
    const tags = tagsInput.split('،').map((s) => s.trim()).filter(Boolean);

    if (editingEntry) {
      const idx = all.findIndex((item) => item.id === editingEntry.id);
      if (idx >= 0) {
        all[idx] = {
          ...editingEntry,
          title: title.trim() || undefined,
          content: content.trim(),
          dateJalali: dateJalali.trim(),
          mood,
          energyLevel,
          tags,
        };
      }
    } else {
      const newEntry: JournalEntry = {
        id: 'jr-' + Math.random().toString(36).substring(2, 9),
        title: title.trim() || undefined,
        content: content.trim(),
        dateJalali: dateJalali.trim(),
        mood,
        energyLevel,
        tags,
      };
      all.unshift(newEntry);
    }

    StorageService.saveJournalEntries(all);
    setIsAddModalOpen(false);
    onRefreshData();
  };

  const handleDelete = (id: string) => {
    const all = StorageService.getJournalEntries().filter((e) => e.id !== id);
    StorageService.saveJournalEntries(all);
    onRefreshData();
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-foreground">
            یادداشت‌های روزانه و احوال
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            ثبت احساسات روز، میزان انرژی، تفکرات و وقایع روزمره
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary hover:bg-[#687a5e] text-white font-bold text-xs sm:text-sm shadow-md shadow-primary/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>ثبت یادداشت امروز</span>
        </button>
      </div>

      {/* Entries Timeline */}
      {entries.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="هنوز یادداشتی ثبت نکرده‌اید"
          description="روز خود را چطور گذراندید؟ احوال و اتفاقات امروز را بنویسید تا بعداً مرور کنید."
          actionText="نوشتن یادداشت روزانه"
          onAction={() => handleOpenModal()}
        />
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => {
            const moodObj = moods.find((m) => m.id === entry.mood) || moods[1];
            const MoodIcon = moodObj.icon;

            return (
              <div
                key={entry.id}
                className="p-5 rounded-3xl bg-card border border-border shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${moodObj.color}`}>
                      <MoodIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm sm:text-base text-foreground">
                        {entry.title || `یادداشت ${formatJalaliReadable(entry.dateJalali)}`}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <span>{formatJalaliReadable(entry.dateJalali)}</span>
                        <span>• حال: {moodObj.label}</span>
                        {entry.energyLevel && <span>• انرژی: {toFaDigits(entry.energyLevel)} از ۵</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenModal(entry)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-foreground whitespace-pre-line leading-relaxed">
                  {entry.content}
                </p>

                {/* Tags */}
                {entry.tags && entry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border">
                    {entry.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-0.5 rounded-lg bg-primary/10 text-primary text-[10px] font-semibold"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Journal Entry Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-card rounded-3xl p-5 shadow-2xl border border-border animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-foreground text-base">
                {editingEntry ? 'ویرایش یادداشت' : 'یادداشت جدید'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-full text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEntry} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block text-muted-foreground mb-1">حال و احساس امروز</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {moods.map((m) => {
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setMood(m.id)}
                        className={`p-2 rounded-xl flex flex-col items-center gap-1 transition-all ${
                          mood === m.id
                            ? 'bg-primary text-white shadow-xs'
                            : 'bg-muted text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-[10px] font-semibold whitespace-nowrap">{m.label.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-muted-foreground mb-1">تاریخ (شمسی)</label>
                  <input
                    type="text"
                    value={dateJalali}
                    onChange={(e) => setDateJalali(e.target.value)}
                    required
                    className="w-full p-2 rounded-xl border border-border bg-background text-foreground font-mono text-center"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1">سطح انرژی ({toFaDigits(energyLevel)} از ۵)</label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={energyLevel}
                    onChange={(e) => setEnergyLevel(parseInt(e.target.value, 10))}
                    className="w-full mt-2 accent-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">عنوان یادداشت (اختیاری)</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: پیاده‌روی عصرگاهی، جلسه کاری خوب"
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground font-bold"
                />
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">متن یادداشت *</label>
                <textarea
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="امروز چه گذشت؟ چه افکار و اتفاقاتی رخ داد؟"
                  required
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">برچسب‌ها (با «،» جدا کنید)</label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="ورزش، خاطره، کاری"
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-border text-foreground text-xs font-semibold hover:bg-muted"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-[#687a5e] text-white font-bold text-xs shadow-md shadow-primary/25"
                >
                  ذخیره یادداشت
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

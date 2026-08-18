import React, { useState } from 'react';
import {
  Bell,
  Plus,
  CheckCircle2,
  Calendar,
  Clock,
  Trash2,
  Edit2,
  X,
  AlertCircle,
  RotateCcw,
  CheckCheck,
} from 'lucide-react';
import { Reminder, ReminderCategory, RecurrenceType, PriorityLevel } from '../../types';
import { StorageService } from '../../services/storage';
import { getTodayJalali, toFaDigits, formatJalaliReadable, formatRelativeDays } from '../../utils/jalali';
import { EmptyState } from '../common/EmptyState';

interface RemindersViewProps {
  reminders: Reminder[];
  onRefreshData: () => void;
  onOpenQuickCapture: () => void;
}

export const RemindersView: React.FC<RemindersViewProps> = ({
  reminders,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ReminderCategory>('general');
  const [dueDateJalali, setDueDateJalali] = useState(getTodayJalali());
  const [dueTime, setDueTime] = useState('09:00');
  const [recurrence, setRecurrence] = useState<RecurrenceType>('once');
  const [priority, setPriority] = useState<PriorityLevel>('medium');
  const [notes, setNotes] = useState('');

  const activeReminders = reminders.filter((r) => !r.isCompleted);
  const completedReminders = reminders.filter((r) => r.isCompleted);

  const displayList = (activeTab === 'active' ? activeReminders : completedReminders).filter(
    (r) => selectedCategory === 'all' || r.category === selectedCategory
  );

  const handleOpenModal = (r?: Reminder) => {
    if (r) {
      setEditingReminder(r);
      setTitle(r.title);
      setCategory(r.category);
      setDueDateJalali(r.dueDateJalali);
      setDueTime(r.dueTime || '09:00');
      setRecurrence(r.recurrence || 'once');
      setPriority(r.priority || 'medium');
      setNotes(r.notes || '');
    } else {
      setEditingReminder(null);
      setTitle('');
      setCategory('general');
      setDueDateJalali(getTodayJalali());
      setDueTime('09:00');
      setRecurrence('once');
      setPriority('medium');
      setNotes('');
    }
    setIsAddModalOpen(true);
  };

  // Toggle Completed
  const handleToggleComplete = (r: Reminder) => {
    const all = StorageService.getReminders();
    const idx = all.findIndex((item) => item.id === r.id);
    if (idx >= 0) {
      all[idx].isCompleted = !all[idx].isCompleted;
      all[idx].completedAt = all[idx].isCompleted ? Date.now() : undefined;
      StorageService.saveReminders(all);
      onRefreshData();
    }
  };

  // Save Reminder
  const handleSaveReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const all = StorageService.getReminders();

    if (editingReminder) {
      const idx = all.findIndex((item) => item.id === editingReminder.id);
      if (idx >= 0) {
        all[idx] = {
          ...editingReminder,
          title: title.trim(),
          category,
          dueDateJalali: dueDateJalali.trim(),
          dueTime: dueTime.trim(),
          recurrence,
          priority,
          notes: notes.trim(),
        };
      }
    } else {
      const newR: Reminder = {
        id: 'rem-' + Math.random().toString(36).substring(2, 9),
        title: title.trim(),
        category,
        dueDateJalali: dueDateJalali.trim(),
        dueTime: dueTime.trim(),
        recurrence,
        priority,
        isCompleted: false,
        notes: notes.trim(),
      };
      all.unshift(newR);
    }

    StorageService.saveReminders(all);
    setIsAddModalOpen(false);
    onRefreshData();
  };

  // Delete
  const handleDelete = (id: string) => {
    const all = StorageService.getReminders().filter((r) => r.id !== id);
    StorageService.saveReminders(all);
    onRefreshData();
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-foreground">
            یادآوری‌ها و پیگیری‌ها
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            پیگیری هوشمند موعد داروها، چکاپ، بیمه، خودرو و تاریخ‌های مهم
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary hover:bg-[#687a5e] text-white font-bold text-xs sm:text-sm shadow-md shadow-primary/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>افزودن یادآوری</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex p-1.5 bg-muted rounded-2xl text-xs font-semibold">
        <button
          onClick={() => setActiveTab('active')}
          className={`flex-1 py-2 rounded-xl transition-all ${
            activeTab === 'active'
              ? 'bg-card text-primary shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          یادآوری‌های فعال ({toFaDigits(activeReminders.length)})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`flex-1 py-2 rounded-xl transition-all ${
            activeTab === 'completed'
              ? 'bg-card text-primary shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          انجام‌شده‌ها ({toFaDigits(completedReminders.length)})
        </button>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {[
          { id: 'all', label: 'همه' },
          { id: 'medication', label: 'دارو' },
          { id: 'doctor', label: 'پزشک و ویزیت' },
          { id: 'lab', label: 'آزمایشگاه' },
          { id: 'car', label: 'خودرو و سرویس' },
          { id: 'insurance', label: 'بیمه و مدارک' },
          { id: 'finance', label: 'اقساط و مالی' },
          { id: 'home', label: 'خانه' },
          { id: 'general', label: 'عمومی' },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
              selectedCategory === cat.id
                ? 'bg-primary text-white shadow-xs'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* List */}
      {displayList.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={activeTab === 'active' ? 'هیچ یادآوری فعالی وجود ندارد' : 'هیچ مورد انجام‌شده‌ای ثبت نشده'}
          description="موعد تمدید بیمه، مصرف دارو یا چکاپ را اضافه کنید تا در زمان مناسب مطلع شوید."
          actionText={activeTab === 'active' ? 'افزودن اولین یادآوری' : undefined}
          onAction={activeTab === 'active' ? () => handleOpenModal() : undefined}
        />
      ) : (
        <div className="space-y-2.5">
          {displayList.map((r) => {
            const relDays = formatRelativeDays(r.dueDateJalali);
            const isHighPriority = r.priority === 'urgent' || r.priority === 'high';

            return (
              <div
                key={r.id}
                className={`p-4 rounded-3xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  r.isCompleted
                    ? 'bg-muted/40 border-border opacity-60'
                    : isHighPriority
                    ? 'bg-card border-amber-300 dark:border-amber-700/60 shadow-xs'
                    : 'bg-card border-border shadow-xs'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleToggleComplete(r)}
                    className={`mt-0.5 p-1 rounded-xl transition-all ${
                      r.isCompleted
                        ? 'text-primary'
                        : 'text-border hover:text-primary'
                    }`}
                    title={r.isCompleted ? 'بازگردانی به فعال' : 'علامت به عنوان انجام شده'}
                  >
                    <CheckCircle2 className="w-6 h-6" />
                  </button>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4
                        className={`font-bold text-sm sm:text-base ${
                          r.isCompleted
                            ? 'text-muted-foreground line-through'
                            : 'text-foreground'
                        }`}
                      >
                        {r.title}
                      </h4>
                      {isHighPriority && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 font-bold">
                          مهم
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 flex-wrap">
                      <span>{formatJalaliReadable(r.dueDateJalali)}</span>
                      {r.dueTime && <span>• ساعت {toFaDigits(r.dueTime)}</span>}
                      {r.recurrence && r.recurrence !== 'once' && (
                        <span>• تکرار: {r.recurrence === 'daily' ? 'روزانه' : r.recurrence === 'monthly' ? 'ماهانه' : 'سالانه'}</span>
                      )}
                    </div>

                    {r.notes && (
                      <p className="text-xs text-muted-foreground mt-1">{r.notes}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 self-stretch sm:self-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-border">
                  <span
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl ${
                      r.isCompleted
                        ? 'bg-muted text-muted-foreground'
                        : 'bg-primary/10 text-primary dark:bg-primary/20'
                    }`}
                  >
                    {relDays}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenModal(r)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-card rounded-3xl p-5 shadow-2xl border border-border animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-foreground text-base">
                {editingReminder ? 'ویرایش یادآوری' : 'ثبت یادآوری جدید'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-full text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReminder} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block text-muted-foreground mb-1">عنوان یادآوری *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: تمدید بیمه خودرو، نوبت دندان‌پزشکی"
                  required
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-muted-foreground mb-1">دسته‌بندی</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ReminderCategory)}
                    className="w-full p-2 rounded-xl border border-border bg-background text-foreground font-semibold"
                  >
                    <option value="medication">دارو</option>
                    <option value="doctor">پزشک و ویزیت</option>
                    <option value="lab">آزمایشگاه</option>
                    <option value="car">خودرو و سرویس</option>
                    <option value="insurance">بیمه و مدارک</option>
                    <option value="finance">اقساط و مالی</option>
                    <option value="home">خانه</option>
                    <option value="general">عمومی</option>
                  </select>
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1">اولویت</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                    className="w-full p-2 rounded-xl border border-border bg-background text-foreground font-semibold"
                  >
                    <option value="low">کم</option>
                    <option value="medium">معمولی</option>
                    <option value="high">مهم</option>
                    <option value="urgent">فوری و اضطراری</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-muted-foreground mb-1">تاریخ موعد (شمسی) *</label>
                  <input
                    type="text"
                    value={dueDateJalali}
                    onChange={(e) => setDueDateJalali(e.target.value)}
                    required
                    className="w-full p-2 rounded-xl border border-border bg-background text-foreground font-mono text-center"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1">ساعت یادآوری</label>
                  <input
                    type="time"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    className="w-full p-2 rounded-xl border border-border bg-background text-foreground font-mono text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">تکرار</label>
                <select
                  value={recurrence}
                  onChange={(e) => setRecurrence(e.target.value as RecurrenceType)}
                  className="w-full p-2 rounded-xl border border-border bg-background text-foreground"
                >
                  <option value="once">یک‌بار (بدون تکرار)</option>
                  <option value="daily">روزانه</option>
                  <option value="weekly">هفتگی</option>
                  <option value="monthly">ماهانه</option>
                  <option value="yearly">سالانه</option>
                </select>
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">توضیحات تکمیلی</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="نکات بیشتر..."
                  className="w-full p-2 rounded-xl border border-border bg-background text-foreground"
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
                  ذخیره یادآوری
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

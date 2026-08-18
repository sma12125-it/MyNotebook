import React, { useState } from 'react';
import {
  Calendar,
  Plus,
  Car,
  Home,
  Coins,
  Plane,
  Briefcase,
  Trash2,
  Edit2,
  X,
  Tag,
  Search,
} from 'lucide-react';
import { LifeEvent, LifeEventCategory } from '../../types';
import { StorageService } from '../../services/storage';
import { getTodayJalali, toFaDigits, formatJalaliReadable } from '../../utils/jalali';
import { EmptyState } from '../common/EmptyState';

interface LifeEventsViewProps {
  events: LifeEvent[];
  onRefreshData: () => void;
  onOpenQuickCapture: () => void;
}

export const LifeEventsView: React.FC<LifeEventsViewProps> = ({
  events,
  onRefreshData,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<LifeEvent | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<LifeEventCategory>('car');
  const [dateJalali, setDateJalali] = useState(getTodayJalali());
  const [cost, setCost] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  const categories = [
    { id: 'all', label: 'همه رویدادها', icon: Calendar },
    { id: 'car', label: 'خودرو', icon: Car },
    { id: 'home', label: 'خانه و تعمیرات', icon: Home },
    { id: 'finance', label: 'امور مالی و هزینه', icon: Coins },
    { id: 'travel', label: 'سفر و گردش', icon: Plane },
    { id: 'work', label: 'کار و آموزش', icon: Briefcase },
    { id: 'personal', label: 'شخصی', icon: Calendar },
  ];

  // Filtered
  const filteredEvents = events.filter((e) => {
    const matchCat = selectedCategory === 'all' || e.category === selectedCategory;
    const matchSearch =
      !searchQuery.trim() ||
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.description && e.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && matchSearch;
  });

  // Calculate total costs for the filtered set
  const totalCost = filteredEvents.reduce((sum, item) => sum + (item.cost || 0), 0);

  const handleOpenModal = (ev?: LifeEvent) => {
    if (ev) {
      setEditingEvent(ev);
      setTitle(ev.title);
      setCategory(ev.category);
      setDateJalali(ev.dateJalali);
      setCost(ev.cost ? String(ev.cost) : '');
      setDescription(ev.description || '');
      setTagsInput(ev.tags ? ev.tags.join('، ') : '');
    } else {
      setEditingEvent(null);
      setTitle('');
      setCategory('car');
      setDateJalali(getTodayJalali());
      setCost('');
      setDescription('');
      setTagsInput('');
    }
    setIsAddModalOpen(true);
  };

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const all = StorageService.getEvents();
    const tags = tagsInput.split('،').map((s) => s.trim()).filter(Boolean);

    if (editingEvent) {
      const idx = all.findIndex((item) => item.id === editingEvent.id);
      if (idx >= 0) {
        all[idx] = {
          ...editingEvent,
          title: title.trim(),
          category,
          dateJalali: dateJalali.trim(),
          cost: cost ? parseFloat(cost) : undefined,
          description: description.trim(),
          tags,
        };
      }
    } else {
      const newEv: LifeEvent = {
        id: 'ev-' + Math.random().toString(36).substring(2, 9),
        title: title.trim(),
        category,
        dateJalali: dateJalali.trim(),
        cost: cost ? parseFloat(cost) : undefined,
        description: description.trim(),
        tags,
      };
      all.unshift(newEv);
    }

    StorageService.saveEvents(all);
    setIsAddModalOpen(false);
    onRefreshData();
  };

  const handleDelete = (id: string) => {
    const all = StorageService.getEvents().filter((e) => e.id !== id);
    StorageService.saveEvents(all);
    onRefreshData();
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-foreground">
            رویدادها و هزینه‌های زندگی
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            دفترچه ثبت رویدادهای خودرو، تعمیرات خانه، سفرها، هزینه‌ها و وقایع
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary hover:bg-[#687a5e] text-white font-bold text-xs sm:text-sm shadow-md shadow-primary/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>ثبت رویداد جدید</span>
        </button>
      </div>

      {/* Stats / Cost Summary Banner */}
      {totalCost > 0 && (
        <div className="p-4 rounded-3xl bg-card border border-border shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs text-muted-foreground font-medium">
                مجموع هزینه‌های ثبت‌شده در این بخش:
              </span>
              <div className="font-extrabold text-foreground text-base sm:text-lg">
                {toFaDigits(totalCost.toLocaleString('fa-IR'))} تومان
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Pills & Search */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute right-3.5 top-3 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در رویدادها..."
            className="w-full pl-4 pr-10 py-2.5 rounded-2xl border border-border bg-card text-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 flex items-center gap-1.5 ${
                  selectedCategory === cat.id
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Events List */}
      {filteredEvents.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="رویدادی یافت نشد"
          description="سرویس خودرو، تعمیرات منزل یا خریدهای مهم را ثبت کنید تا تاریخچه دقیق داشته باشید."
          actionText="ثبت رویداد"
          onAction={() => handleOpenModal()}
        />
      ) : (
        <div className="space-y-3">
          {filteredEvents.map((ev) => (
            <div
              key={ev.id}
              className="p-4 sm:p-5 rounded-3xl bg-card border border-border shadow-xs flex flex-col justify-between space-y-2 hover:border-primary/50 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold flex-shrink-0">
                    {ev.category === 'car' ? (
                      <Car className="w-5 h-5" />
                    ) : ev.category === 'home' ? (
                      <Home className="w-5 h-5" />
                    ) : ev.category === 'travel' ? (
                      <Plane className="w-5 h-5" />
                    ) : ev.category === 'work' ? (
                      <Briefcase className="w-5 h-5" />
                    ) : (
                      <Coins className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm sm:text-base text-foreground">
                      {ev.title}
                    </h4>
                    <span className="text-xs text-muted-foreground">
                      {formatJalaliReadable(ev.dateJalali)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {ev.cost && (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-primary/10 text-primary">
                      {toFaDigits(ev.cost.toLocaleString('fa-IR'))} تومان
                    </span>
                  )}
                  <button
                    onClick={() => handleOpenModal(ev)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(ev.id)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {ev.description && (
                <p className="text-xs text-foreground leading-relaxed pr-13">
                  {ev.description}
                </p>
              )}

              {/* Tags */}
              {ev.tags && ev.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 pr-13 pt-1">
                  {ev.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-lg bg-muted text-muted-foreground text-[10px] font-semibold"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-card rounded-3xl p-5 shadow-2xl border border-border animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-foreground text-base">
                {editingEvent ? 'ویرایش رویداد' : 'ثبت رویداد / هزینه جدید'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-full text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block text-muted-foreground mb-1">عنوان رویداد *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: تعویض روغن موتور، خرید پکیج دیواری"
                  required
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-muted-foreground mb-1">دسته‌بندی</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as LifeEventCategory)}
                    className="w-full p-2 rounded-xl border border-border bg-background text-foreground font-semibold"
                  >
                    <option value="car">خودرو</option>
                    <option value="home">خانه و تعمیرات</option>
                    <option value="finance">امور مالی و خرید</option>
                    <option value="travel">سفر</option>
                    <option value="work">کار و تحصیل</option>
                    <option value="personal">شخصی</option>
                  </select>
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1">تاریخ (شمسی) *</label>
                  <input
                    type="text"
                    value={dateJalali}
                    onChange={(e) => setDateJalali(e.target.value)}
                    required
                    className="w-full p-2 rounded-xl border border-border bg-background text-foreground font-mono text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">هزینه / مبلغ (تومان - اختیاری)</label>
                <input
                  type="number"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="مثلاً: 450000"
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground font-mono"
                />
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">برچسب‌ها (با «،» جدا کنید)</label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="خودرو، بیمه، تعمیرگاه"
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground"
                />
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">توضیحات و جزئیات</label>
                <textarea
                  rows={2.5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="کیلومتر خودرو، شماره فاکتور، جزئیات تعمیر..."
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
                  ذخیره رویداد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import {
  Pill,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Trash2,
  Edit2,
  X,
  Calendar,
  Archive,
  RefreshCw,
} from 'lucide-react';
import { Medication, MedicationForm } from '../../types';
import { StorageService } from '../../services/storage';
import { getTodayJalali, toFaDigits, formatJalaliReadable } from '../../utils/jalali';
import { EmptyState } from '../common/EmptyState';

interface MedicationsViewProps {
  medications: Medication[];
  onRefreshData: () => void;
  onOpenQuickCapture: () => void;
}

export const MedicationsView: React.FC<MedicationsViewProps> = ({
  medications,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<'today' | 'all' | 'archived'>('today');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMed, setEditingMed] = useState<Medication | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('۱ عدد');
  const [form, setForm] = useState<MedicationForm>('قرص');
  const [frequency, setFrequency] = useState('once_daily');
  const [selectedSlots, setSelectedSlots] = useState<('صبح' | 'ظهر' | 'عصر' | 'شب')[]>(['صبح']);
  const [instructions, setInstructions] = useState('بعد از غذا');
  const [reason, setReason] = useState('');
  const [prescribedBy, setPrescribedBy] = useState('');
  const [remainingQty, setRemainingQty] = useState('');
  const [notes, setNotes] = useState('');

  const today = getTodayJalali();
  const logs = StorageService.getMedicationLogs();

  const activeMeds = medications.filter((m) => m.isActive);
  const archivedMeds = medications.filter((m) => !m.isActive);

  // Open modal for editing or new
  const handleOpenModal = (med?: Medication) => {
    if (med) {
      setEditingMed(med);
      setName(med.name);
      setDosage(med.dosage);
      setForm(med.form);
      setFrequency(med.frequency);
      setSelectedSlots(med.timeSlotLabels || ['صبح']);
      setInstructions(med.instructions || 'بعد از غذا');
      setReason(med.reason || '');
      setPrescribedBy(med.prescribedBy || '');
      setRemainingQty(med.remainingQuantity ? String(med.remainingQuantity) : '');
      setNotes(med.notes || '');
    } else {
      setEditingMed(null);
      setName('');
      setDosage('۱ عدد');
      setForm('قرص');
      setFrequency('once_daily');
      setSelectedSlots(['صبح']);
      setInstructions('بعد از غذا');
      setReason('');
      setPrescribedBy('');
      setRemainingQty('');
      setNotes('');
    }
    setIsAddModalOpen(true);
  };

  // Toggle Slot in Add/Edit Form
  const toggleSlot = (slot: 'صبح' | 'ظهر' | 'عصر' | 'شب') => {
    if (selectedSlots.includes(slot)) {
      if (selectedSlots.length > 1) {
        setSelectedSlots(selectedSlots.filter((s) => s !== slot));
      }
    } else {
      setSelectedSlots([...selectedSlots, slot]);
    }
  };

  // Save Medication
  const handleSaveMedication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const allMeds = StorageService.getMedications();

    if (editingMed) {
      const idx = allMeds.findIndex((m) => m.id === editingMed.id);
      if (idx >= 0) {
        allMeds[idx] = {
          ...editingMed,
          name: name.trim(),
          dosage: dosage.trim(),
          form,
          frequency,
          timeSlotLabels: selectedSlots,
          instructions,
          reason: reason.trim(),
          prescribedBy: prescribedBy.trim(),
          remainingQuantity: remainingQty ? parseInt(remainingQty, 10) : undefined,
          notes: notes.trim(),
        };
      }
    } else {
      const newMed: Medication = {
        id: 'med-' + Math.random().toString(36).substring(2, 9),
        name: name.trim(),
        dosage: dosage.trim(),
        form,
        frequency,
        timesOfDay: ['08:00'],
        timeSlotLabels: selectedSlots,
        startDateJalali: today,
        instructions,
        reason: reason.trim(),
        prescribedBy: prescribedBy.trim(),
        remainingQuantity: remainingQty ? parseInt(remainingQty, 10) : undefined,
        refillReminder: true,
        notes: notes.trim(),
        isActive: true,
      };
      allMeds.unshift(newMed);
    }

    StorageService.saveMedications(allMeds);
    setIsAddModalOpen(false);
    onRefreshData();
  };

  // Toggle Taken Today
  const handleToggleLog = (med: Medication, slot: 'صبح' | 'ظهر' | 'عصر' | 'شب') => {
    const allLogs = StorageService.getMedicationLogs();
    const existingIndex = allLogs.findIndex(
      (l) => l.medicationId === med.id && l.dateJalali === today && l.timeSlot === slot
    );

    if (existingIndex >= 0) {
      allLogs.splice(existingIndex, 1);
    } else {
      allLogs.push({
        id: 'log-' + Date.now(),
        medicationId: med.id,
        dateJalali: today,
        scheduledTime: '08:00',
        timeSlot: slot,
        status: 'taken',
        takenAtTimestamp: Date.now(),
      });

      // Update remaining pills
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

    StorageService.saveMedicationLogs(allLogs);
    onRefreshData();
  };

  const isTaken = (medId: string, slot: 'صبح' | 'ظهر' | 'عصر' | 'شب') => {
    return logs.some((l) => l.medicationId === medId && l.dateJalali === today && l.timeSlot === slot && l.status === 'taken');
  };

  // Toggle Archive Status
  const handleToggleArchive = (med: Medication) => {
    const allMeds = StorageService.getMedications();
    const idx = allMeds.findIndex((m) => m.id === med.id);
    if (idx >= 0) {
      allMeds[idx].isActive = !allMeds[idx].isActive;
      StorageService.saveMedications(allMeds);
      onRefreshData();
    }
  };

  // Delete Medication
  const handleDelete = (id: string) => {
    const allMeds = StorageService.getMedications().filter((m) => m.id !== id);
    StorageService.saveMedications(allMeds);
    onRefreshData();
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-foreground">
            داروهای من
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            برنامه زمان‌بندی مصرف، دوز و هشدار اتمام موجودی دارو
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary hover:bg-[#687a5e] text-white font-bold text-xs sm:text-sm shadow-md shadow-primary/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>افزودن داروی جدید</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex p-1.5 bg-muted rounded-2xl text-xs font-semibold">
        <button
          onClick={() => setActiveTab('today')}
          className={`flex-1 py-2 rounded-xl transition-all ${
            activeTab === 'today'
              ? 'bg-card text-primary shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          برنامه مصرف امروز
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-2 rounded-xl transition-all ${
            activeTab === 'all'
              ? 'bg-card text-primary shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          تمام داروهای فعال ({toFaDigits(activeMeds.length)})
        </button>
        <button
          onClick={() => setActiveTab('archived')}
          className={`flex-1 py-2 rounded-xl transition-all ${
            activeTab === 'archived'
              ? 'bg-card text-primary shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          آرشیو / دوره‌های پایان‌یافته ({toFaDigits(archivedMeds.length)})
        </button>
      </div>

      {/* TODAY'S SCHEDULE TAB */}
      {activeTab === 'today' && (
        <div className="space-y-4">
          {activeMeds.length === 0 ? (
            <EmptyState
              icon={Pill}
              title="داروی فعالی ثبت نشده است"
              description="داروهای مصرفی خود را اضافه کنید تا نوبت‌های مصرف را به راحتی علامت بزنید."
              actionText="افزودن اولین دارو"
              onAction={() => handleOpenModal()}
            />
          ) : (
            <div className="space-y-3">
              {['صبح', 'ظهر', 'عصر', 'شب'].map((slot) => {
                const medsInSlot = activeMeds.filter((m) =>
                  (m.timeSlotLabels || ['صبح']).includes(slot as any)
                );

                if (medsInSlot.length === 0) return null;

                return (
                  <div
                    key={slot}
                    className="p-4 rounded-3xl bg-card border border-border shadow-xs"
                  >
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/60">
                      <div className="w-7 h-7 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                        <Clock className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-sm text-foreground">
                        نوبت {slot}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {medsInSlot.map((med) => {
                        const taken = isTaken(med.id, slot as any);
                        const isLowStock = med.remainingQuantity !== undefined && med.remainingQuantity <= 5;

                        return (
                          <div
                            key={med.id}
                            className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                              taken
                                ? 'bg-primary/10 border-primary/30'
                                : 'bg-muted/40 border-border/80'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-3 h-3 rounded-full mt-1.5 ${taken ? 'bg-primary' : 'bg-border'}`}></div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className={`font-bold text-sm ${taken ? 'text-primary line-through opacity-80' : 'text-foreground'}`}>
                                    {med.name}
                                  </span>
                                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                                    {med.form}
                                  </span>
                                </div>
                                <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-2">
                                  <span>دوز: {med.dosage}</span>
                                  {med.instructions && <span>• {med.instructions}</span>}
                                  {med.reason && <span>• علت: {med.reason}</span>}
                                </div>

                                {isLowStock && (
                                  <div className="mt-1.5 flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-400 font-bold">
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                    <span>موجودی کم: فقط {toFaDigits(med.remainingQuantity!)} عدد باقی‌مانده!</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Action Button */}
                            <button
                              onClick={() => handleToggleLog(med, slot as any)}
                              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all self-end sm:self-auto ${
                                taken
                                  ? 'bg-primary text-white shadow-xs'
                                  : 'bg-card text-foreground border border-border hover:border-primary'
                              }`}
                            >
                              <CheckCircle2 className={`w-4 h-4 ${taken ? 'text-white' : 'text-muted-foreground'}`} />
                              <span>{taken ? 'مصرف شد' : 'ثبت مصرف'}</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ALL MEDICATIONS TAB */}
      {activeTab === 'all' && (
        <div className="space-y-3">
          {activeMeds.length === 0 ? (
            <EmptyState
              icon={Pill}
              title="داروی فعالی وجود ندارد"
              actionText="افزودن دارو"
              onAction={() => handleOpenModal()}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeMeds.map((med) => {
                const isLowStock = med.remainingQuantity !== undefined && med.remainingQuantity <= 5;

                return (
                  <div
                    key={med.id}
                    className="p-4 rounded-3xl bg-card border border-border shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                            <Pill className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-foreground">
                              {med.name}
                            </h4>
                            <span className="text-xs text-muted-foreground">{med.form} • {med.dosage}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenModal(med)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                            title="ویرایش"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleArchive(med)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-amber-700 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                            title="پایان دوره و انتقال به آرشیو"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(med.id)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            title="حذف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 space-y-1.5 text-xs text-foreground/80">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">نوبت‌های مصرف:</span>
                          <span className="font-bold">{(med.timeSlotLabels || ['صبح']).join('، ')}</span>
                        </div>
                        {med.instructions && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">دستور مصرف:</span>
                            <span>{med.instructions}</span>
                          </div>
                        )}
                        {med.reason && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">علت مصرف:</span>
                            <span>{med.reason}</span>
                          </div>
                        )}
                        {med.prescribedBy && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">پزشک تجویزکننده:</span>
                            <span>{med.prescribedBy}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Stock status footer */}
                    <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">موجودی باقیمانده:</span>
                      {med.remainingQuantity !== undefined ? (
                        <span className={`font-bold ${isLowStock ? 'text-amber-700 dark:text-amber-400' : 'text-foreground'}`}>
                          {toFaDigits(med.remainingQuantity)} {med.form}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">نامشخص</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ARCHIVED MEDICATIONS TAB */}
      {activeTab === 'archived' && (
        <div className="space-y-3">
          {archivedMeds.length === 0 ? (
            <EmptyState
              icon={Archive}
              title="داروی آرشیو شده‌ای وجود ندارد"
              description="داروهایی که دوره‌شان به پایان رسیده است در اینجا قرار می‌گیرند."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {archivedMeds.map((med) => (
                <div
                  key={med.id}
                  className="p-4 rounded-3xl bg-card border border-border shadow-xs opacity-75"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-foreground">
                        {med.name}
                      </h4>
                      <span className="text-xs text-muted-foreground">{med.dosage} • {med.reason}</span>
                    </div>

                    <button
                      onClick={() => handleToggleArchive(med)}
                      className="px-2.5 py-1 rounded-xl bg-muted hover:bg-primary/10 text-xs font-semibold flex items-center gap-1 text-muted-foreground hover:text-primary"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>فعال‌سازی مجدد</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Medication Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-card rounded-3xl p-5 sm:p-6 shadow-2xl border border-border animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-foreground text-base">
                {editingMed ? 'ویرایش اطلاعات دارو' : 'افزودن داروی جدید'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-full text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMedication} className="space-y-3.5 mt-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted-foreground mb-1">نام دارو *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: لوزارتان، آتورواستاتین"
                    required
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground font-bold"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1">شکل دارو</label>
                  <select
                    value={form}
                    onChange={(e) => setForm(e.target.value as MedicationForm)}
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground font-semibold"
                  >
                    <option value="قرص">قرص</option>
                    <option value="کپسول">کپسول</option>
                    <option value="شربت">شربت</option>
                    <option value="قطره">قطره</option>
                    <option value="آمپول">آمپول</option>
                    <option value="پماد">پماد</option>
                    <option value="اسپری">اسپری</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted-foreground mb-1">دوز / مقدار در هر نوبت</label>
                  <input
                    type="text"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    placeholder="مثال: ۵۰ میلی‌گرم یا ۱ قرص"
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1">دستور مصرف</label>
                  <select
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground"
                  >
                    <option value="بعد از غذا">بعد از غذا</option>
                    <option value="قبل از غذا">قبل از غذا</option>
                    <option value="همراه با غذا">همراه با غذا</option>
                    <option value="ناشتا (صبح ناشتا)">ناشتا (صبح ناشتا)</option>
                    <option value="قبل از خواب">قبل از خواب</option>
                    <option value="در صورت نیاز / درد">در صورت نیاز / درد</option>
                  </select>
                </div>
              </div>

              {/* Time slots selection */}
              <div>
                <label className="block text-muted-foreground mb-1.5">نوبت‌های مصرف در شبانه‌روز</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['صبح', 'ظهر', 'عصر', 'شب'] as const).map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => toggleSlot(slot)}
                      className={`py-2 rounded-xl font-bold transition-all ${
                        selectedSlots.includes(slot)
                          ? 'bg-primary text-white shadow-xs'
                          : 'bg-muted text-muted-foreground border border-border hover:text-foreground'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted-foreground mb-1">علت مصرف</label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="مثال: کنترل فشار خون"
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1">تعداد باقیمانده (جهت هشدار اتمام)</label>
                  <input
                    type="number"
                    value={remainingQty}
                    onChange={(e) => setRemainingQty(e.target.value)}
                    placeholder="مثلاً: 30"
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground font-mono text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">پزشک تجویزکننده (اختیاری)</label>
                <input
                  type="text"
                  value={prescribedBy}
                  onChange={(e) => setPrescribedBy(e.target.value)}
                  placeholder="مثال: دکتر حسینی"
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground"
                />
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">یادداشت و نکات خاص</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="مثلاً: با آب فراوان مصرف شود..."
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
                  {editingMed ? 'ذخیره تغییرات' : 'افزودن دارو'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

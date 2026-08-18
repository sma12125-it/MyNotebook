import React, { useState } from 'react';
import {
  FlaskConical,
  Plus,
  Trash2,
  Edit2,
  X,
  FileText,
  Calendar,
  AlertCircle,
  TrendingUp,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { LaboratoryTest, LabResultItem } from '../../types';
import { StorageService } from '../../services/storage';
import { getTodayJalali, toFaDigits, formatJalaliReadable, formatRelativeDays } from '../../utils/jalali';
import { EmptyState } from '../common/EmptyState';

interface LabTestsViewProps {
  labs: LaboratoryTest[];
  onRefreshData: () => void;
  onOpenQuickCapture: () => void;
}

export const LabTestsView: React.FC<LabTestsViewProps> = ({
  labs,
  onRefreshData,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingLab, setEditingLab] = useState<LaboratoryTest | null>(null);

  // Form State
  const [testName, setTestName] = useState('');
  const [labName, setLabName] = useState('');
  const [dateJalali, setDateJalali] = useState(getTodayJalali());
  const [doctorName, setDoctorName] = useState('');
  const [summary, setSummary] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [resultsList, setResultsList] = useState<LabResultItem[]>([
    { parameter: 'Vitamin D', value: 34, unit: 'ng/mL', referenceRange: '30-100', status: 'normal' },
    { parameter: 'FBS (قند ناشتا)', value: 94, unit: 'mg/dL', referenceRange: '70-100', status: 'normal' },
  ]);

  // Handle Add Parameter Row
  const handleAddParamRow = () => {
    setResultsList([
      ...resultsList,
      { parameter: '', value: 0, unit: '', referenceRange: '', status: 'normal' },
    ]);
  };

  const handleUpdateParam = (index: number, field: keyof LabResultItem, val: any) => {
    const updated = [...resultsList];
    updated[index] = { ...updated[index], [field]: val };
    setResultsList(updated);
  };

  const handleRemoveParam = (index: number) => {
    setResultsList(resultsList.filter((_, i) => i !== index));
  };

  // Open Modal
  const handleOpenModal = (lab?: LaboratoryTest) => {
    if (lab) {
      setEditingLab(lab);
      setTestName(lab.testName);
      setLabName(lab.laboratoryName || '');
      setDateJalali(lab.dateJalali);
      setDoctorName(lab.prescribedBy || '');
      setSummary(lab.summary || '');
      setFollowUpDate(lab.followUpDateJalali || '');
      setResultsList(lab.results && lab.results.length > 0 ? lab.results : []);
    } else {
      setEditingLab(null);
      setTestName('آزمایش چکاپ خون');
      setLabName('آزمایشگاه نوین');
      setDateJalali(getTodayJalali());
      setDoctorName('دکتر حسینی');
      setSummary('');
      setFollowUpDate('');
      setResultsList([
        { parameter: 'Vitamin D', value: 34, unit: 'ng/mL', referenceRange: '30-100', status: 'normal' },
        { parameter: 'FBS (قند ناشتا)', value: 95, unit: 'mg/dL', referenceRange: '70-100', status: 'normal' },
        { parameter: 'Cholesterol', value: 185, unit: 'mg/dL', referenceRange: '< 200', status: 'normal' },
      ]);
    }
    setIsAddModalOpen(true);
  };

  // Save Lab
  const handleSaveLab = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testName.trim()) return;

    const allLabs = StorageService.getLabs();

    if (editingLab) {
      const idx = allLabs.findIndex((l) => l.id === editingLab.id);
      if (idx >= 0) {
        allLabs[idx] = {
          ...editingLab,
          testName: testName.trim(),
          laboratoryName: labName.trim(),
          dateJalali: dateJalali.trim(),
          prescribedBy: doctorName.trim(),
          results: resultsList.filter((r) => r.parameter.trim().length > 0),
          summary: summary.trim(),
          followUpDateJalali: followUpDate.trim() || undefined,
        };
      }
    } else {
      const newLab: LaboratoryTest = {
        id: 'lab-' + Math.random().toString(36).substring(2, 9),
        testName: testName.trim(),
        laboratoryName: labName.trim(),
        dateJalali: dateJalali.trim(),
        prescribedBy: doctorName.trim(),
        results: resultsList.filter((r) => r.parameter.trim().length > 0),
        summary: summary.trim(),
        followUpDateJalali: followUpDate.trim() || undefined,
      };
      allLabs.unshift(newLab);

      // Auto reminder if follow up date specified
      if (followUpDate.trim()) {
        const rems = StorageService.getReminders();
        rems.unshift({
          id: 'rem-' + Math.random().toString(36).substring(2, 9),
          title: `انجام مجدد آزمایش (${testName.trim()})`,
          category: 'lab',
          dueDateJalali: followUpDate.trim(),
          dueTime: '08:00',
          recurrence: 'once',
          isCompleted: false,
          priority: 'high',
        });
        StorageService.saveReminders(rems);
      }
    }

    StorageService.saveLabs(allLabs);
    setIsAddModalOpen(false);
    onRefreshData();
  };

  // Delete Lab
  const handleDeleteLab = (id: string) => {
    const list = StorageService.getLabs().filter((l) => l.id !== id);
    StorageService.saveLabs(list);
    onRefreshData();
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-foreground">
            آزمایش‌ها و پارامترها
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            نتایج آزمایشگاهی، مقایسه دوره‌ای و روند بهبود فاکتورها
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary hover:bg-[#687a5e] text-white font-bold text-xs sm:text-sm shadow-md shadow-primary/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>ثبت نتیجه آزمایش</span>
        </button>
      </div>

      {/* Labs List */}
      {labs.length === 0 ? (
        <EmptyState
          icon={FlaskConical}
          title="هنوز آزمایشی ثبت نشده است"
          description="نتایج آزمایش خون، ادرار، تیروئید و چکاپ را ثبت کنید تا در هر زمان به راحتی مقایسه کنید."
          actionText="ثبت اولین آزمایش"
          onAction={() => handleOpenModal()}
        />
      ) : (
        <div className="space-y-4">
          {labs.map((lab) => (
            <div
              key={lab.id}
              className="p-5 rounded-3xl bg-card border border-border shadow-xs space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold flex-shrink-0">
                    <FlaskConical className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm sm:text-base text-foreground">
                      {lab.testName}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {lab.laboratoryName ? `آزمایشگاه: ${lab.laboratoryName}` : ''} {lab.prescribedBy ? `• پزشک: ${lab.prescribedBy}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-xs font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-xl">
                    {formatJalaliReadable(lab.dateJalali)}
                  </span>
                  <button
                    onClick={() => handleOpenModal(lab)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                    title="ویرایش"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteLab(lab.id)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    title="حذف"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Parameters Table */}
              {lab.results && lab.results.length > 0 && (
                <div className="bg-muted/40 rounded-2xl border border-border overflow-hidden text-xs">
                  <div className="grid grid-cols-4 p-2.5 border-b border-border font-bold text-muted-foreground">
                    <span>فاکتور / پارامتر</span>
                    <span className="text-center">نتیجه آزمایش</span>
                    <span className="text-center">محدوده طبیعی</span>
                    <span className="text-left">وضعیت</span>
                  </div>
                  <div className="divide-y divide-border">
                    {lab.results.map((r, i) => (
                      <div key={i} className="grid grid-cols-4 p-2.5 items-center">
                        <span className="font-semibold text-foreground font-mono">
                          {r.parameter}
                        </span>
                        <span className="text-center font-bold text-foreground">
                          {toFaDigits(r.value)} {r.unit}
                        </span>
                        <span className="text-center text-muted-foreground">
                          {r.referenceRange || '—'}
                        </span>
                        <div className="flex items-center justify-end gap-1">
                          {r.status === 'normal' && (
                            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-[10px]">
                              نرمال
                            </span>
                          )}
                          {r.status === 'high' && (
                            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 font-bold text-[10px] flex items-center gap-0.5">
                              <ArrowUpRight className="w-3 h-3" /> بالا
                            </span>
                          )}
                          {r.status === 'low' && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-bold text-[10px] flex items-center gap-0.5">
                              <ArrowDownRight className="w-3 h-3" /> پایین
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary / Notes */}
              {lab.summary && (
                <div className="p-3 bg-muted/60 rounded-xl text-xs text-foreground leading-relaxed border border-border">
                  <span className="font-bold text-primary">یادداشت / نظر: </span>
                  {lab.summary}
                </div>
              )}

              {/* Follow-up date */}
              {lab.followUpDateJalali && (
                <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400 font-semibold pt-1">
                  <Calendar className="w-4 h-4" />
                  <span>موعد آزمایش بعدی: {formatJalaliReadable(lab.followUpDateJalali)} ({formatRelativeDays(lab.followUpDateJalali)})</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Lab Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-card rounded-3xl p-5 sm:p-6 shadow-2xl border border-border animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-foreground text-base">
                {editingLab ? 'ویرایش آزمایش' : 'ثبت نتیجه آزمایش جدید'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-full text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLab} className="space-y-3.5 mt-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted-foreground mb-1">نام آزمایش *</label>
                  <input
                    type="text"
                    value={testName}
                    onChange={(e) => setTestName(e.target.value)}
                    placeholder="چکاپ دوره‌ای، ویتامین D، تیروئید"
                    required
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground font-bold"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1">نام آزمایشگاه</label>
                  <input
                    type="text"
                    value={labName}
                    onChange={(e) => setLabName(e.target.value)}
                    placeholder="آزمایشگاه مرکزی"
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted-foreground mb-1">تاریخ آزمایش (شمسی) *</label>
                  <input
                    type="text"
                    value={dateJalali}
                    onChange={(e) => setDateJalali(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground font-mono text-center"
                    required
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1">پزشک درخواست‌کننده</label>
                  <input
                    type="text"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    placeholder="دکتر حسینی"
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground"
                  />
                </div>
              </div>

              {/* Dynamic Parameters List */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-foreground">
                    فاکتورهای آزمایشگاهی
                  </span>
                  <button
                    type="button"
                    onClick={handleAddParamRow}
                    className="text-xs text-primary font-bold flex items-center gap-1 hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    افزودن فاکتور
                  </button>
                </div>

                <div className="space-y-2">
                  {resultsList.map((res, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-muted/40 border border-border grid grid-cols-12 gap-1.5 items-center"
                    >
                      <div className="col-span-4">
                        <input
                          type="text"
                          value={res.parameter}
                          onChange={(e) => handleUpdateParam(idx, 'parameter', e.target.value)}
                          placeholder="نام فاکتور (FBS)"
                          className="w-full p-1.5 rounded-lg border border-border bg-background text-foreground text-[11px] font-mono"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          step="0.1"
                          value={res.value || ''}
                          onChange={(e) => handleUpdateParam(idx, 'value', parseFloat(e.target.value))}
                          placeholder="مقدار"
                          className="w-full p-1.5 rounded-lg border border-border bg-background text-foreground text-[11px] font-bold text-center"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="text"
                          value={res.unit}
                          onChange={(e) => handleUpdateParam(idx, 'unit', e.target.value)}
                          placeholder="واحد"
                          className="w-full p-1.5 rounded-lg border border-border bg-background text-foreground text-[10px] text-center"
                        />
                      </div>
                      <div className="col-span-2">
                        <select
                          value={res.status}
                          onChange={(e) => handleUpdateParam(idx, 'status', e.target.value)}
                          className="w-full p-1.5 rounded-lg border border-border bg-background text-foreground text-[10px]"
                        >
                          <option value="normal">نرمال</option>
                          <option value="high">بالا</option>
                          <option value="low">پایین</option>
                        </select>
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveParam(idx)}
                          className="text-muted-foreground hover:text-rose-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">تاریخ تکرار / آزمایش بعدی (اختیاری)</label>
                <input
                  type="text"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  placeholder="1405/11/15"
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground font-mono text-center"
                />
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">توضیحات و خلاصه</label>
                <textarea
                  rows={2}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="توضیحات تکمیلی درباره نتیجه آزمایش..."
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
                  ذخیره نتیجه آزمایش
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

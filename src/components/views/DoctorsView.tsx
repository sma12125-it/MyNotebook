import React, { useState } from 'react';
import {
  UserCheck,
  Plus,
  Phone,
  MapPin,
  Calendar,
  Trash2,
  Edit2,
  X,
  FileText,
  CalendarClock,
  Coins,
  ChevronLeft,
} from 'lucide-react';
import { Doctor, MedicalVisit, Reminder } from '../../types';
import { StorageService } from '../../services/storage';
import { getTodayJalali, toFaDigits, formatJalaliReadable, formatRelativeDays } from '../../utils/jalali';
import { EmptyState } from '../common/EmptyState';

interface DoctorsViewProps {
  doctors: Doctor[];
  visits: MedicalVisit[];
  onRefreshData: () => void;
  onOpenQuickCapture: () => void;
}

export const DoctorsView: React.FC<DoctorsViewProps> = ({
  doctors,
  visits,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<'visits' | 'directory'>('visits');
  
  // Doctor Modal State
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [docName, setDocName] = useState('');
  const [docSpecialty, setDocSpecialty] = useState('');
  const [docClinic, setDocClinic] = useState('');
  const [docPhone, setDocPhone] = useState('');
  const [docAddress, setDocAddress] = useState('');

  // Visit Modal State
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [editingVisit, setEditingVisit] = useState<MedicalVisit | null>(null);
  const [visitDoctorName, setVisitDoctorName] = useState('');
  const [visitSpecialty, setVisitSpecialty] = useState('');
  const [visitDateJalali, setVisitDateJalali] = useState(getTodayJalali());
  const [visitReason, setVisitReason] = useState('');
  const [visitDiagnosis, setVisitDiagnosis] = useState('');
  const [visitInstructions, setVisitInstructions] = useState('');
  const [visitPrescriptions, setVisitPrescriptions] = useState('');
  const [visitFollowUpDate, setVisitFollowUpDate] = useState('');
  const [visitCost, setVisitCost] = useState('');

  // Handle Save Doctor
  const handleSaveDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim()) return;

    const allDocs = StorageService.getDoctors();
    if (editingDoctor) {
      const idx = allDocs.findIndex((d) => d.id === editingDoctor.id);
      if (idx >= 0) {
        allDocs[idx] = {
          ...editingDoctor,
          name: docName.trim(),
          specialty: docSpecialty.trim(),
          clinicName: docClinic.trim(),
          phoneNumber: docPhone.trim(),
          address: docAddress.trim(),
        };
      }
    } else {
      const newDoc: Doctor = {
        id: 'doc-' + Math.random().toString(36).substring(2, 9),
        name: docName.trim(),
        specialty: docSpecialty.trim(),
        clinicName: docClinic.trim(),
        phoneNumber: docPhone.trim(),
        address: docAddress.trim(),
      };
      allDocs.unshift(newDoc);
    }

    StorageService.saveDoctors(allDocs);
    setIsDoctorModalOpen(false);
    onRefreshData();
  };

  // Handle Save Visit
  const handleSaveVisit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitDoctorName.trim() || !visitReason.trim()) return;

    const allVisits = StorageService.getVisits();
    const prescriptionsArray = visitPrescriptions
      .split('،')
      .map((s) => s.trim())
      .filter(Boolean);

    if (editingVisit) {
      const idx = allVisits.findIndex((v) => v.id === editingVisit.id);
      if (idx >= 0) {
        allVisits[idx] = {
          ...editingVisit,
          doctorName: visitDoctorName.trim(),
          specialty: visitSpecialty.trim(),
          dateJalali: visitDateJalali.trim(),
          reason: visitReason.trim(),
          diagnosis: visitDiagnosis.trim(),
          instructions: visitInstructions.trim(),
          prescriptions: prescriptionsArray,
          followUpDateJalali: visitFollowUpDate.trim() || undefined,
          cost: visitCost ? parseFloat(visitCost) : undefined,
        };
      }
    } else {
      const newVisit: MedicalVisit = {
        id: 'vis-' + Math.random().toString(36).substring(2, 9),
        doctorName: visitDoctorName.trim(),
        specialty: visitSpecialty.trim(),
        dateJalali: visitDateJalali.trim(),
        reason: visitReason.trim(),
        diagnosis: visitDiagnosis.trim(),
        instructions: visitInstructions.trim(),
        prescriptions: prescriptionsArray,
        followUpDateJalali: visitFollowUpDate.trim() || undefined,
        cost: visitCost ? parseFloat(visitCost) : undefined,
      };
      allVisits.unshift(newVisit);

      // If follow up date is set, automatically create a smart reminder!
      if (visitFollowUpDate.trim()) {
        const rems = StorageService.getReminders();
        rems.unshift({
          id: 'rem-' + Math.random().toString(36).substring(2, 9),
          title: `مراجعه مجدد به ${visitDoctorName.trim()} (${visitReason.trim()})`,
          category: 'doctor',
          dueDateJalali: visitFollowUpDate.trim(),
          dueTime: '10:00',
          recurrence: 'once',
          isCompleted: false,
          priority: 'high',
        });
        StorageService.saveReminders(rems);
      }
    }

    StorageService.saveVisits(allVisits);
    setIsVisitModalOpen(false);
    onRefreshData();
  };

  const handleDeleteDoctor = (id: string) => {
    const list = StorageService.getDoctors().filter((d) => d.id !== id);
    StorageService.saveDoctors(list);
    onRefreshData();
  };

  const handleDeleteVisit = (id: string) => {
    const list = StorageService.getVisits().filter((v) => v.id !== id);
    StorageService.saveVisits(list);
    onRefreshData();
  };

  const handleOpenDoctorModal = (doc?: Doctor) => {
    if (doc) {
      setEditingDoctor(doc);
      setDocName(doc.name);
      setDocSpecialty(doc.specialty);
      setDocClinic(doc.clinicName || '');
      setDocPhone(doc.phoneNumber || '');
      setDocAddress(doc.address || '');
    } else {
      setEditingDoctor(null);
      setDocName('');
      setDocSpecialty('');
      setDocClinic('');
      setDocPhone('');
      setDocAddress('');
    }
    setIsDoctorModalOpen(true);
  };

  const handleOpenVisitModal = (v?: MedicalVisit) => {
    if (v) {
      setEditingVisit(v);
      setVisitDoctorName(v.doctorName);
      setVisitSpecialty(v.specialty || '');
      setVisitDateJalali(v.dateJalali);
      setVisitReason(v.reason);
      setVisitDiagnosis(v.diagnosis || '');
      setVisitInstructions(v.instructions || '');
      setVisitPrescriptions(v.prescriptions ? v.prescriptions.join('، ') : '');
      setVisitFollowUpDate(v.followUpDateJalali || '');
      setVisitCost(v.cost ? String(v.cost) : '');
    } else {
      setEditingVisit(null);
      setVisitDoctorName(doctors.length > 0 ? doctors[0].name : '');
      setVisitSpecialty(doctors.length > 0 ? doctors[0].specialty : '');
      setVisitDateJalali(getTodayJalali());
      setVisitReason('');
      setVisitDiagnosis('');
      setVisitInstructions('');
      setVisitPrescriptions('');
      setVisitFollowUpDate('');
      setVisitCost('');
    }
    setIsVisitModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-foreground">
            پزشکان و ویزیت‌ها
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            دفترچه پزشکان، سوابق مراجعه، تشخیص‌ها و نوبت‌های بعدی
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenDoctorModal()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground font-semibold text-xs transition-all"
          >
            <UserCheck className="w-4 h-4 text-primary" />
            <span>پزشک جدید</span>
          </button>
          <button
            onClick={() => handleOpenVisitModal()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary hover:bg-[#687a5e] text-white font-bold text-xs sm:text-sm shadow-md shadow-primary/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>ثبت ویزیت</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1.5 bg-muted rounded-2xl text-xs font-semibold">
        <button
          onClick={() => setActiveTab('visits')}
          className={`flex-1 py-2 rounded-xl transition-all ${
            activeTab === 'visits'
              ? 'bg-card text-primary shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          سوابق مراجعات و ویزیت‌ها ({toFaDigits(visits.length)})
        </button>
        <button
          onClick={() => setActiveTab('directory')}
          className={`flex-1 py-2 rounded-xl transition-all ${
            activeTab === 'directory'
              ? 'bg-card text-primary shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          دفترچه پزشکان من ({toFaDigits(doctors.length)})
        </button>
      </div>

      {/* VISITS TAB */}
      {activeTab === 'visits' && (
        <div className="space-y-4">
          {visits.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="هیچ ویزیتی ثبت نشده است"
              description="علت مراجعه، تشخیص پزشک و دستورات دارویی را ذخیره کنید تا هرگز فراموش نکنید."
              actionText="ثبت اولین ویزیت"
              onAction={() => handleOpenVisitModal()}
            />
          ) : (
            <div className="space-y-3">
              {visits.map((v) => (
                <div
                  key={v.id}
                  className="p-5 rounded-3xl bg-card border border-border shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold flex-shrink-0">
                        <UserCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm sm:text-base text-foreground">
                            {v.doctorName}
                          </h4>
                          {v.specialty && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                              {v.specialty}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          علت مراجعه: <span className="font-semibold text-foreground/90">{v.reason}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-xs font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-xl">
                        {formatJalaliReadable(v.dateJalali)}
                      </span>
                      <button
                        onClick={() => handleOpenVisitModal(v)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                        title="ویرایش"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteVisit(v.id)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        title="حذف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Diagnosis & Instructions */}
                  {(v.diagnosis || v.instructions) && (
                    <div className="p-3.5 rounded-2xl bg-muted/40 border border-border text-xs space-y-2">
                      {v.diagnosis && (
                        <div>
                          <span className="font-bold text-foreground">تشخیص / نظر پزشک: </span>
                          <span className="text-muted-foreground">{v.diagnosis}</span>
                        </div>
                      )}
                      {v.instructions && (
                        <div>
                          <span className="font-bold text-foreground">دستورات و توصیه‌ها: </span>
                          <span className="text-muted-foreground">{v.instructions}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Prescribed Meds */}
                  {v.prescriptions && v.prescriptions.length > 0 && (
                    <div className="text-xs">
                      <span className="text-muted-foreground block mb-1">داروهای تجویز شده:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {v.prescriptions.map((p, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-semibold"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Footer: Next Visit & Cost */}
                  <div className="pt-2 border-t border-border flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                    {v.followUpDateJalali ? (
                      <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-semibold">
                        <CalendarClock className="w-4 h-4" />
                        <span>موعد ویزیت بعدی: {formatJalaliReadable(v.followUpDateJalali)} ({formatRelativeDays(v.followUpDateJalali)})</span>
                      </div>
                    ) : (
                      <span>بدون نیاز به پیگیری</span>
                    )}

                    {v.cost && (
                      <div className="flex items-center gap-1 font-bold text-foreground">
                        <Coins className="w-3.5 h-3.5 text-amber-600" />
                        <span>هزینه: {toFaDigits(v.cost.toLocaleString('fa-IR'))} تومان</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* DIRECTORY TAB */}
      {activeTab === 'directory' && (
        <div className="space-y-3">
          {doctors.length === 0 ? (
            <EmptyState
              icon={UserCheck}
              title="دفترچه پزشکان خالی است"
              description="نام، تخصص و شماره تماس پزشکان خود را ثبت کنید تا همیشه در دسترس باشند."
              actionText="افزودن پزشک"
              onAction={() => handleOpenDoctorModal()}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {doctors.map((d) => (
                <div
                  key={d.id}
                  className="p-4 rounded-3xl bg-card border border-border shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                          {d.name.slice(0, 1)}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-foreground">{d.name}</h4>
                          <span className="text-xs text-primary font-medium">{d.specialty}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenDoctorModal(d)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteDoctor(d.id)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                      {d.clinicName && <div>مرکز: {d.clinicName}</div>}
                      {d.phoneNumber && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                          <a href={`tel:${d.phoneNumber}`} className="font-mono text-primary hover:underline">
                            {d.phoneNumber}
                          </a>
                        </div>
                      )}
                      {d.address && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                          <span>{d.address}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      handleOpenVisitModal();
                      setVisitDoctorName(d.name);
                      setVisitSpecialty(d.specialty);
                    }}
                    className="mt-4 pt-3 border-t border-border w-full text-center text-xs font-semibold text-primary hover:underline"
                  >
                    + ثبت ویزیت جدید با این پزشک
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Doctor Modal */}
      {isDoctorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-card rounded-3xl p-5 shadow-2xl border border-border animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-foreground text-base">
                {editingDoctor ? 'ویرایش اطلاعات پزشک' : 'افزودن پزشک به دفترچه'}
              </h3>
              <button
                onClick={() => setIsDoctorModalOpen(false)}
                className="p-1 rounded-full text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDoctor} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block text-muted-foreground mb-1">نام پزشک *</label>
                <input
                  type="text"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  placeholder="مثال: دکتر علیرضا حسینی"
                  required
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground font-bold"
                />
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">تخصص *</label>
                <input
                  type="text"
                  value={docSpecialty}
                  onChange={(e) => setDocSpecialty(e.target.value)}
                  placeholder="مثال: متخصص قلب و عروق، دندان‌پزشک"
                  required
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground"
                />
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">بیمارستان یا کلینیک</label>
                <input
                  type="text"
                  value={docClinic}
                  onChange={(e) => setDocClinic(e.target.value)}
                  placeholder="مثال: بیمارستان دی، کلینیک نور"
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground"
                />
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">شماره تماس مطب</label>
                <input
                  type="tel"
                  value={docPhone}
                  onChange={(e) => setDocPhone(e.target.value)}
                  placeholder="02188776655"
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground font-mono text-left"
                />
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">آدرس مطب</label>
                <input
                  type="text"
                  value={docAddress}
                  onChange={(e) => setDocAddress(e.target.value)}
                  placeholder="خیابان ولیعصر، بالاتر از توانیر..."
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsDoctorModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-border text-foreground text-xs font-semibold hover:bg-muted"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-[#687a5e] text-white font-bold text-xs shadow-md shadow-primary/25"
                >
                  ذخیره پزشک
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Visit Modal */}
      {isVisitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-card rounded-3xl p-5 sm:p-6 shadow-2xl border border-border animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-foreground text-base">
                {editingVisit ? 'ویرایش سابقه ویزیت' : 'ثبت ویزیت و مراجعه به پزشک'}
              </h3>
              <button
                onClick={() => setIsVisitModalOpen(false)}
                className="p-1 rounded-full text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVisit} className="space-y-3 mt-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted-foreground mb-1">نام پزشک *</label>
                  <input
                    type="text"
                    value={visitDoctorName}
                    onChange={(e) => setVisitDoctorName(e.target.value)}
                    placeholder="دکتر حسینی"
                    required
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground font-bold"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1">تخصص</label>
                  <input
                    type="text"
                    value={visitSpecialty}
                    onChange={(e) => setVisitSpecialty(e.target.value)}
                    placeholder="قلب و عروق"
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted-foreground mb-1">تاریخ ویزیت (شمسی) *</label>
                  <input
                    type="text"
                    value={visitDateJalali}
                    onChange={(e) => setVisitDateJalali(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground font-mono text-center"
                    required
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1">علت مراجعه *</label>
                  <input
                    type="text"
                    value={visitReason}
                    onChange={(e) => setVisitReason(e.target.value)}
                    placeholder="چکاپ دوره‌ای، تپش قلب، ..."
                    required
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">تشخیص یا نظر پزشک</label>
                <textarea
                  rows={2}
                  value={visitDiagnosis}
                  onChange={(e) => setVisitDiagnosis(e.target.value)}
                  placeholder="تشخیص پزشک، وضعیت نوار قلب، ..."
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground"
                />
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">دستورات و توصیه‌ها</label>
                <textarea
                  rows={2}
                  value={visitInstructions}
                  onChange={(e) => setVisitInstructions(e.target.value)}
                  placeholder="کاهش مصرف نمک، ورزش روزانه، ..."
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground"
                />
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">داروهای تجویز شده (با «،» جدا کنید)</label>
                <input
                  type="text"
                  value={visitPrescriptions}
                  onChange={(e) => setVisitPrescriptions(e.target.value)}
                  placeholder="لوزارتان ۲۵، آسپرین ۸۰"
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted-foreground mb-1">تاریخ ویزیت بعدی / پیگیری (شمسی)</label>
                  <input
                    type="text"
                    value={visitFollowUpDate}
                    onChange={(e) => setVisitFollowUpDate(e.target.value)}
                    placeholder="1405/08/20"
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground font-mono text-center"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1">هزینه ویزیت (تومان)</label>
                  <input
                    type="number"
                    value={visitCost}
                    onChange={(e) => setVisitCost(e.target.value)}
                    placeholder="250000"
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsVisitModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-border text-foreground text-xs font-semibold hover:bg-muted"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-[#687a5e] text-white font-bold text-xs shadow-md shadow-primary/25"
                >
                  ذخیره ویزیت
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

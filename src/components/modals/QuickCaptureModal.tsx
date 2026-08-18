import React, { useState, useEffect } from 'react';
import {
  X,
  Mic,
  MicOff,
  Sparkles,
  Heart,
  Pill,
  FlaskConical,
  UserCheck,
  Activity,
  Bell,
  Calendar,
  FileText,
  Paperclip,
  Car,
  Home,
  Coins,
  Star,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { AIService, ExtractionResult, VoiceRecognitionService } from '../../services/aiService';
import { StorageService } from '../../services/storage';
import { getTodayJalali, toFaDigits } from '../../utils/jalali';
import { Measurement, Reminder, LifeEvent, Medication } from '../../types';

interface QuickCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onNavigateToTab?: (tabName: string) => void;
}

export const QuickCaptureModal: React.FC<QuickCaptureModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [naturalText, setNaturalText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceService, setVoiceService] = useState<{ stop: () => void } | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null);
  const [activeFormType, setActiveFormType] = useState<string | null>(null);

  // Manual Quick Forms State
  const [measureType, setMeasureType] = useState<'weight' | 'blood_pressure' | 'blood_glucose' | 'heart_rate'>('weight');
  const [measureValue1, setMeasureValue1] = useState('');
  const [measureValue2, setMeasureValue2] = useState('');
  const [measureNotes, setMeasureNotes] = useState('');

  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderCategory, setReminderCategory] = useState<'medication' | 'doctor' | 'lab' | 'car' | 'insurance' | 'general'>('general');
  const [reminderDueDate, setReminderDueDate] = useState(getTodayJalali());

  const [noteText, setNoteText] = useState('');
  const [eventTitle, setEventTitle] = useState('');
  const [eventCost, setEventCost] = useState('');
  const [eventCategory, setEventCategory] = useState<'car' | 'home' | 'finance' | 'purchase' | 'personal'>('car');

  useEffect(() => {
    if (!isOpen) {
      if (voiceService) voiceService.stop();
      setIsListening(false);
      setNaturalText('');
      setExtractionResult(null);
      setActiveFormType(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Voice Toggle
  const toggleVoice = () => {
    if (isListening) {
      if (voiceService) voiceService.stop();
      setIsListening(false);
    } else {
      setVoiceError(null);
      const service = VoiceRecognitionService.startListening(
        (transcript) => {
          setNaturalText(transcript);
        },
        (err) => {
          setVoiceError(err);
          setIsListening(false);
        },
        () => {
          setIsListening(false);
        }
      );
      setVoiceService(service);
      setIsListening(true);
    }
  };

  // Submit Natural Language to AI
  const handleProcessNaturalLanguage = async () => {
    if (!naturalText.trim()) return;
    setIsExtracting(true);
    try {
      const result = await AIService.extractRecord(naturalText);
      setExtractionResult(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExtracting(false);
    }
  };

  // Confirm and Save Extracted Record
  const handleSaveExtracted = () => {
    if (!extractionResult) return;
    const now = Date.now();
    const today = getTodayJalali();

    // 1. Measurements
    if (extractionResult.measurements && extractionResult.measurements.length > 0) {
      extractionResult.measurements.forEach((m) => {
        const item: Measurement = {
          id: 'm-' + Math.random().toString(36).substring(2, 9),
          type: m.type as any,
          value: m.value,
          unit: m.unit,
          recordedAtJalali: today,
          recordedTime: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
          timestamp: now,
          notes: m.notes || extractionResult.summary,
        };
        StorageService.addMeasurement(item);
      });
    }

    // 2. Reminder
    if (extractionResult.reminder && extractionResult.reminder.title) {
      const r: Reminder = {
        id: 'rem-' + Math.random().toString(36).substring(2, 9),
        title: extractionResult.reminder.title,
        category: (extractionResult.reminder.category as any) || 'general',
        dueDateJalali: extractionResult.reminder.dueDate || today,
        dueTime: extractionResult.reminder.dueTime || '09:00',
        recurrence: 'once',
        isCompleted: false,
        priority: 'medium',
        notes: extractionResult.summary,
      };
      const list = StorageService.getReminders();
      list.unshift(r);
      StorageService.saveReminders(list);
    }

    // 3. Medication
    if (extractionResult.medication && extractionResult.medication.name) {
      const med: Medication = {
        id: 'med-' + Math.random().toString(36).substring(2, 9),
        name: extractionResult.medication.name,
        dosage: extractionResult.medication.dosage || '۱ عدد',
        form: (extractionResult.medication.form as any) || 'قرص',
        frequency: 'once_daily',
        timesOfDay: extractionResult.medication.times || ['08:00'],
        startDateJalali: today,
        refillReminder: true,
        notes: extractionResult.medication.notes || '',
        isActive: true,
      };
      const meds = StorageService.getMedications();
      meds.unshift(med);
      StorageService.saveMedications(meds);
    }

    // 4. Life Event
    if (extractionResult.lifeEvent && extractionResult.lifeEvent.title) {
      const ev: LifeEvent = {
        id: 'ev-' + Math.random().toString(36).substring(2, 9),
        title: extractionResult.lifeEvent.title,
        category: (extractionResult.lifeEvent.category as any) || 'car',
        dateJalali: today,
        cost: extractionResult.lifeEvent.cost,
        description: extractionResult.lifeEvent.description || extractionResult.summary,
        tags: [extractionResult.topic || 'عمومی'],
      };
      const events = StorageService.getEvents();
      events.unshift(ev);
      StorageService.saveEvents(events);
    }

    // 5. Plain Note or fallback
    if (
      (!extractionResult.measurements || extractionResult.measurements.length === 0) &&
      !extractionResult.reminder &&
      !extractionResult.medication &&
      !extractionResult.lifeEvent
    ) {
      const journalList = StorageService.getJournal();
      journalList.unshift({
        id: 'j-' + Math.random().toString(36).substring(2, 9),
        dateJalali: today,
        text: extractionResult.note?.text || naturalText,
        mood: 4,
        energy: 4,
        stress: 2,
        tags: [extractionResult.topic || 'یادداشت'],
      });
      StorageService.saveJournal(journalList);
    }

    onSuccess('اطلاعات با موفقیت در دفتر شما ذخیره شد.');
    onClose();
  };

  // Quick category actions grid
  const quickCategories = [
    { id: 'health_measurement', title: 'اندازه‌گیری', icon: Activity, color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400' },
    { id: 'medication', title: 'دارو', icon: Pill, color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
    { id: 'lab', title: 'آزمایش', icon: FlaskConical, color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
    { id: 'doctor_visit', title: 'مراجعه به پزشک', icon: UserCheck, color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400' },
    { id: 'health_info', title: 'اطلاعات سلامت', icon: Heart, color: 'bg-red-500/10 text-red-600 dark:text-red-400' },
    { id: 'reminder', title: 'یادآوری', icon: Bell, color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
    { id: 'event', title: 'رویداد', icon: Calendar, color: 'bg-teal-500/10 text-teal-600 dark:text-teal-400' },
    { id: 'note', title: 'یادداشت', icon: FileText, color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' },
    { id: 'document', title: 'مدرک / عکس', icon: Paperclip, color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400' },
    { id: 'car', title: 'خودرو', icon: Car, color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
    { id: 'home', title: 'خانه', icon: Home, color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
    { id: 'cost', title: 'هزینه', icon: Coins, color: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' },
    { id: 'important', title: 'مورد مهم', icon: Star, color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400' },
  ];

  // Save manual measurement
  const handleSaveManualMeasurement = () => {
    const today = getTodayJalali();
    const now = Date.now();
    const timeStr = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });

    if (measureType === 'weight') {
      const val = parseFloat(measureValue1);
      if (isNaN(val) || val <= 0) return;
      StorageService.addMeasurement({
        id: 'm-' + Math.random().toString(36).substring(2, 9),
        type: 'weight',
        value: val,
        unit: 'kg',
        recordedAtJalali: today,
        recordedTime: timeStr,
        timestamp: now,
        notes: measureNotes || 'ثبت دستی وزن',
      });
    } else if (measureType === 'blood_pressure') {
      let sys = parseFloat(measureValue1);
      let dia = parseFloat(measureValue2);
      if (isNaN(sys) || isNaN(dia)) return;
      if (sys <= 25) sys *= 10;
      if (dia <= 25) dia *= 10;
      StorageService.addMeasurement({
        id: 'm-' + Math.random().toString(36).substring(2, 9),
        type: 'blood_pressure_sys',
        value: sys,
        unit: 'mmHg',
        recordedAtJalali: today,
        recordedTime: timeStr,
        timestamp: now,
        notes: 'سیستولیک',
      });
      StorageService.addMeasurement({
        id: 'm-' + Math.random().toString(36).substring(2, 9),
        type: 'blood_pressure_dia',
        value: dia,
        unit: 'mmHg',
        recordedAtJalali: today,
        recordedTime: timeStr,
        timestamp: now,
        notes: measureNotes || 'دیاستولیک',
      });
    } else if (measureType === 'blood_glucose') {
      const val = parseFloat(measureValue1);
      if (isNaN(val)) return;
      StorageService.addMeasurement({
        id: 'm-' + Math.random().toString(36).substring(2, 9),
        type: 'blood_glucose',
        value: val,
        unit: 'mg/dL',
        recordedAtJalali: today,
        recordedTime: timeStr,
        timestamp: now,
        notes: measureNotes || 'قند خون',
      });
    } else if (measureType === 'heart_rate') {
      const val = parseFloat(measureValue1);
      if (isNaN(val)) return;
      StorageService.addMeasurement({
        id: 'm-' + Math.random().toString(36).substring(2, 9),
        type: 'heart_rate',
        value: val,
        unit: 'bpm',
        recordedAtJalali: today,
        recordedTime: timeStr,
        timestamp: now,
        notes: measureNotes || 'ضربان قلب',
      });
    }

    onSuccess('سنجش سلامت با موفقیت ثبت شد.');
    onClose();
  };

  // Save manual reminder
  const handleSaveManualReminder = () => {
    if (!reminderTitle.trim()) return;
    const r: Reminder = {
      id: 'rem-' + Math.random().toString(36).substring(2, 9),
      title: reminderTitle.trim(),
      category: reminderCategory,
      dueDateJalali: reminderDueDate,
      dueTime: '09:00',
      recurrence: 'once',
      isCompleted: false,
      priority: 'medium',
    };
    const list = StorageService.getReminders();
    list.unshift(r);
    StorageService.saveReminders(list);
    onSuccess('یادآوری با موفقیت ثبت شد.');
    onClose();
  };

  // Save manual life event / car / cost
  const handleSaveManualEvent = () => {
    if (!eventTitle.trim()) return;
    const ev: LifeEvent = {
      id: 'ev-' + Math.random().toString(36).substring(2, 9),
      title: eventTitle.trim(),
      category: eventCategory,
      dateJalali: getTodayJalali(),
      cost: eventCost ? parseFloat(eventCost) : undefined,
      description: noteText,
      tags: [eventCategory === 'car' ? 'خودرو' : eventCategory === 'home' ? 'خانه' : 'رویداد'],
    };
    const list = StorageService.getEvents();
    list.unshift(ev);
    StorageService.saveEvents(list);
    onSuccess('رویداد با موفقیت ثبت شد.');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 sm:p-6 max-h-[92vh] flex flex-col border border-slate-200/80 dark:border-slate-800 animate-in slide-in-from-bottom-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              +
            </div>
            <div>
              <h3 className="font-bold text-foreground text-base">ثبت سریع اطلاعات</h3>
              <p className="text-xs text-muted-foreground">به زبان خودتان بنویسید یا بگویید</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto py-3 space-y-4 flex-1">
          {/* Natural Language + Voice Input Box */}
          {!extractionResult && !activeFormType && (
            <div className="bg-muted/40 p-4 rounded-2xl border border-border shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span>ثبت هوشمند با متن یا صدا</span>
                </span>
                {isListening && (
                  <span className="text-xs font-bold text-rose-500 animate-pulse flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    در حال شنیدن صدای شما...
                  </span>
                )}
              </div>

              <div className="relative">
                <textarea
                  value={naturalText}
                  onChange={(e) => setNaturalText(e.target.value)}
                  placeholder="مثال: امروز فشارم ۱۲ روی ۸ بود و وزنم ۸۲ کیلو شد. یا: تعویض روغن ماشین با هزینه ۴۵۰ هزار تومان..."
                  rows={3}
                  className="w-full p-3 rounded-xl border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none leading-relaxed"
                />

                {/* Voice button */}
                <button
                  onClick={toggleVoice}
                  type="button"
                  className={`absolute left-2.5 bottom-2.5 p-2 rounded-xl transition-all shadow-xs ${
                    isListening
                      ? 'bg-rose-500 text-white animate-bounce'
                      : 'bg-muted text-muted-foreground hover:bg-primary hover:text-white'
                  }`}
                  title={isListening ? 'توقف ضبط صدا' : 'صحبت کنید'}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              </div>

              {voiceError && (
                <div className="mt-2 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{voiceError}</span>
                </div>
              )}

              {/* Process Button */}
              {naturalText.trim().length > 0 && (
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={handleProcessNaturalLanguage}
                    disabled={isExtracting}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-[#687a5e] disabled:opacity-50 text-white font-semibold text-xs sm:text-sm shadow-md shadow-primary/20 transition-all"
                  >
                    {isExtracting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>در حال استخراج هوشمند...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>استخراج و تأیید ثبت</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* AI Confirmation Screen (Mandatory confirmation before saving!) */}
          {extractionResult && (
            <div className="space-y-3 animate-in fade-in zoom-in-95">
              <div className="p-4 rounded-2xl bg-card border border-border text-right shadow-xs">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span>تأیید اطلاعات استخراج‌شده</span>
                  </span>
                  <span className="text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded-md font-medium">
                    موضوع: {extractionResult.topic || 'سلامت'}
                  </span>
                </div>

                <p className="text-sm font-semibold text-foreground mt-2.5 leading-relaxed">
                  {extractionResult.summary}
                </p>

                {/* Structured Measurements Detected */}
                {extractionResult.measurements && extractionResult.measurements.length > 0 && (
                  <div className="mt-3 space-y-1.5 bg-muted/40 p-3 rounded-xl border border-border">
                    <div className="text-xs font-bold text-foreground mb-1">
                      سنجش‌های سلامت قابل ذخیره:
                    </div>
                    {extractionResult.measurements.map((m, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {m.type === 'weight'
                            ? 'وزن بدن'
                            : m.type === 'blood_pressure_sys'
                            ? 'فشار خون سیستولیک'
                            : m.type === 'blood_pressure_dia'
                            ? 'فشار خون دیاستولیک'
                            : m.type === 'blood_glucose'
                            ? 'قند خون'
                            : m.type === 'heart_rate'
                            ? 'ضربان قلب'
                            : m.type}
                          :
                        </span>
                        <span className="font-bold text-foreground">
                          {toFaDigits(m.value)} {m.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Structured Reminder Detected */}
                {extractionResult.reminder && (
                  <div className="mt-3 bg-muted/40 p-3 rounded-xl border border-border text-xs">
                    <div className="font-bold text-foreground mb-1">یادآوری شناسایی‌شده:</div>
                    <p className="text-foreground font-semibold">{extractionResult.reminder.title}</p>
                  </div>
                )}
              </div>

              {/* Confirmation Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => setExtractionResult(null)}
                  className="px-4 py-2.5 rounded-xl border border-border text-foreground hover:bg-muted text-xs font-semibold"
                >
                  ویرایش / انصراف
                </button>
                <button
                  onClick={handleSaveExtracted}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary hover:bg-[#687a5e] text-white font-bold text-sm shadow-md shadow-primary/25 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تأیید و ذخیره در دفتر من</span>
                </button>
              </div>
            </div>
          )}

          {/* Quick Categories Grid (When not in AI confirmation) */}
          {!extractionResult && !activeFormType && (
            <div>
              <div className="text-xs font-bold text-muted-foreground mb-2.5">
                یا انتخاب مستقیم دسته‌بندی:
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {quickCategories.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveFormType(cat.id)}
                      className="flex flex-col items-center justify-center p-3 rounded-2xl border border-border hover:border-primary hover:bg-muted/40 transition-all text-center group bg-card"
                    >
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-1.5 bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-semibold text-foreground leading-tight">
                        {cat.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Manual Form: Health Measurement */}
          {activeFormType === 'health_measurement' && (
            <div className="space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-foreground">ثبت سنجش سلامت</span>
                <button
                  onClick={() => setActiveFormType(null)}
                  className="text-xs text-primary flex items-center gap-1 font-semibold hover:underline"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  بازگشت
                </button>
              </div>

              {/* Type Switcher */}
              <div className="grid grid-cols-4 gap-1.5 p-1 bg-muted rounded-xl text-xs font-semibold text-center">
                <button
                  onClick={() => setMeasureType('weight')}
                  className={`py-1.5 rounded-lg transition-all ${measureType === 'weight' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground'}`}
                >
                  وزن
                </button>
                <button
                  onClick={() => setMeasureType('blood_pressure')}
                  className={`py-1.5 rounded-lg transition-all ${measureType === 'blood_pressure' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground'}`}
                >
                  فشار خون
                </button>
                <button
                  onClick={() => setMeasureType('blood_glucose')}
                  className={`py-1.5 rounded-lg transition-all ${measureType === 'blood_glucose' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground'}`}
                >
                  قند خون
                </button>
                <button
                  onClick={() => setMeasureType('heart_rate')}
                  className={`py-1.5 rounded-lg transition-all ${measureType === 'heart_rate' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground'}`}
                >
                  ضربان
                </button>
              </div>

              {/* Inputs */}
              {measureType === 'weight' && (
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">وزن (کیلوگرم)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={measureValue1}
                    onChange={(e) => setMeasureValue1(e.target.value)}
                    placeholder="مثلاً: 82.4"
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground text-lg font-bold text-center"
                    autoFocus
                  />
                </div>
              )}

              {measureType === 'blood_pressure' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">سیستولیک (بالا)</label>
                    <input
                      type="number"
                      value={measureValue1}
                      onChange={(e) => setMeasureValue1(e.target.value)}
                      placeholder="مثلاً: 120 یا 12"
                      className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground text-lg font-bold text-center"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">دیاستولیک (پایین)</label>
                    <input
                      type="number"
                      value={measureValue2}
                      onChange={(e) => setMeasureValue2(e.target.value)}
                      placeholder="مثلاً: 80 یا 8"
                      className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground text-lg font-bold text-center"
                    />
                  </div>
                </div>
              )}

              {(measureType === 'blood_glucose' || measureType === 'heart_rate') && (
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">
                    {measureType === 'blood_glucose' ? 'مقدار قند خون (mg/dL)' : 'تعداد ضربان در دقیقه (bpm)'}
                  </label>
                  <input
                    type="number"
                    value={measureValue1}
                    onChange={(e) => setMeasureValue1(e.target.value)}
                    placeholder={measureType === 'blood_glucose' ? 'مثلاً: 95' : 'مثلاً: 72'}
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground text-lg font-bold text-center"
                    autoFocus
                  />
                </div>
              )}

              <div>
                <label className="block text-xs text-muted-foreground mb-1">توضیح اختیاری</label>
                <input
                  type="text"
                  value={measureNotes}
                  onChange={(e) => setMeasureNotes(e.target.value)}
                  placeholder="مثال: ناشتا، بعد از پیاده‌روی..."
                  className="w-full p-2 rounded-xl border border-border bg-background text-foreground text-xs"
                />
              </div>

              <button
                onClick={handleSaveManualMeasurement}
                className="w-full py-2.5 rounded-xl bg-primary hover:bg-[#687a5e] text-white font-bold text-sm shadow-md shadow-primary/20 mt-2"
              >
                ثبت سنجش
              </button>
            </div>
          )}

          {/* Manual Form: Reminder */}
          {activeFormType === 'reminder' && (
            <div className="space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-foreground">ثبت یادآوری جدید</span>
                <button
                  onClick={() => setActiveFormType(null)}
                  className="text-xs text-primary flex items-center gap-1 font-semibold hover:underline"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  بازگشت
                </button>
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1">عنوان یادآوری</label>
                <input
                  type="text"
                  value={reminderTitle}
                  onChange={(e) => setReminderTitle(e.target.value)}
                  placeholder="مثال: تمدید بیمه خودرو، آزمایش خون مجدد..."
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground text-sm font-medium"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">دسته‌بندی</label>
                  <select
                    value={reminderCategory}
                    onChange={(e) => setReminderCategory(e.target.value as any)}
                    className="w-full p-2 rounded-xl border border-border bg-background text-foreground text-xs"
                  >
                    <option value="general">عمومی</option>
                    <option value="medication">دارو</option>
                    <option value="doctor">پزشک و ویزیت</option>
                    <option value="lab">آزمایشگاه</option>
                    <option value="car">خودرو</option>
                    <option value="insurance">بیمه</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">تاریخ موعد (شمسی)</label>
                  <input
                    type="text"
                    value={reminderDueDate}
                    onChange={(e) => setReminderDueDate(e.target.value)}
                    placeholder="1405/06/15"
                    className="w-full p-2 rounded-xl border border-border bg-background text-foreground text-xs text-center font-mono"
                  />
                </div>
              </div>

              <button
                onClick={handleSaveManualReminder}
                className="w-full py-2.5 rounded-xl bg-primary hover:bg-[#687a5e] text-white font-bold text-sm shadow-md shadow-primary/20 mt-2"
              >
                ثبت یادآوری
              </button>
            </div>
          )}

          {/* Manual Form: Event / Car / Home / Cost */}
          {['car', 'home', 'cost', 'event', 'note', 'important'].includes(activeFormType || '') && (
            <div className="space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-foreground">
                  ثبت {activeFormType === 'car' ? 'رویداد خودرو' : activeFormType === 'home' ? 'امور خانه' : activeFormType === 'cost' ? 'هزینه و خرید' : 'یادداشت مهم'}
                </span>
                <button
                  onClick={() => setActiveFormType(null)}
                  className="text-xs text-primary flex items-center gap-1 font-semibold hover:underline"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  بازگشت
                </button>
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1">عنوان</label>
                <input
                  type="text"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="مثال: تعویض فیلتر آب، خرید باتری، پرداخت..."
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground text-sm font-medium"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1">مبلغ / هزینه (تومان - اختیاری)</label>
                <input
                  type="number"
                  value={eventCost}
                  onChange={(e) => setEventCost(e.target.value)}
                  placeholder="مثلاً: 450000"
                  className="w-full p-2 rounded-xl border border-border bg-background text-foreground text-xs"
                />
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1">توضیحات بیشتر</label>
                <textarea
                  rows={2}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="جزئیات بیشتر..."
                  className="w-full p-2 rounded-xl border border-border bg-background text-foreground text-xs"
                />
              </div>

              <button
                onClick={handleSaveManualEvent}
                className="w-full py-2.5 rounded-xl bg-primary hover:bg-[#687a5e] text-white font-bold text-sm shadow-md shadow-primary/20 mt-2"
              >
                ثبت اطلاعات
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
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
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  Plus,
  Clock,
  Droplet,
  Camera,
  FolderOpen,
  Download,
} from 'lucide-react';
import { AIService, ExtractionResult, VoiceRecognitionService } from '../../services/aiService';
import { StorageService } from '../../services/storage';
import { getTodayJalali, getCurrentTime, toFaDigits, formatDateTimeFa } from '../../utils/jalali';
import {
  Measurement,
  Reminder,
  LifeEvent,
  Medication,
  Doctor,
  MedicalVisit,
  LaboratoryTest,
  JournalEntry,
  DocumentItem,
  UserProfile,
} from '../../types';

interface QuickCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
  onDataSaved?: () => void;
  onNavigateToTab?: (tabName: string) => void;
}

export const QuickCaptureModal: React.FC<QuickCaptureModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onDataSaved,
}) => {
  const [naturalText, setNaturalText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceService, setVoiceService] = useState<{ stop: () => void } | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null);
  const [activeFormType, setActiveFormType] = useState<string | null>(null);

  // Common Date & Time state for all entries
  const [entryDate, setEntryDate] = useState(getTodayJalali());
  const [entryTime, setEntryTime] = useState(getCurrentTime());

  // Success helper
  const notifySuccess = (message: string) => {
    if (onSuccess) onSuccess(message);
    if (onDataSaved) onDataSaved();
    onClose();
  };

  // 1. Water Intake Form State
  const [waterAmount, setWaterAmount] = useState('250');
  const [waterNotes, setWaterNotes] = useState('');

  // 2. Health Measurement Form State
  const [measureType, setMeasureType] = useState<'weight' | 'water_intake' | 'blood_pressure' | 'blood_glucose' | 'heart_rate' | 'spo2' | 'temp'>('weight');
  const [measureValue1, setMeasureValue1] = useState('');
  const [measureValue2, setMeasureValue2] = useState('');
  const [measureNotes, setMeasureNotes] = useState('');

  // 3. Medication Form State
  const [medName, setMedName] = useState('');
  const [medDosage, setMedDosage] = useState('');
  const [medForm, setMedForm] = useState('قرص');
  const [medReason, setMedReason] = useState('');
  const [medDoctor, setMedDoctor] = useState('');
  const [medFrequency, setMedFrequency] = useState('once_daily');
  const [medSlots, setMedSlots] = useState<string[]>(['صبح']);
  const [medInstructions, setMedInstructions] = useState('');
  const [medNotes, setMedNotes] = useState('');

  // 4. Lab Test Form State
  const [labTestName, setLabTestName] = useState('');
  const [labName, setLabName] = useState('');
  const [labDoctor, setLabDoctor] = useState('');
  const [labSummary, setLabSummary] = useState('');

  // 5. Doctor Visit Form State
  const [docName, setDocName] = useState('');
  const [docSpecialty, setDocSpecialty] = useState('');
  const [visitReason, setVisitReason] = useState('');
  const [visitDiagnosis, setVisitDiagnosis] = useState('');
  const [visitNextDate, setVisitNextDate] = useState('');

  // 6. Health Profile Form State
  const [healthBloodType, setHealthBloodType] = useState('O+');
  const [healthAllergies, setHealthAllergies] = useState('');
  const [healthConditions, setHealthConditions] = useState('');
  const [healthEmergencyPhone, setHealthEmergencyPhone] = useState('');

  // 7. Reminder Form State
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderCategory, setReminderCategory] = useState<'medication' | 'doctor' | 'lab' | 'car' | 'insurance' | 'general'>('general');
  const [reminderPriority, setReminderPriority] = useState<'low' | 'medium' | 'high'>('medium');

  // 8. General Event / Car / Home / Cost Form State
  const [eventTitle, setEventTitle] = useState('');
  const [eventCost, setEventCost] = useState('');
  const [eventNotes, setEventNotes] = useState('');
  const [carMileage, setCarMileage] = useState('');

  // 9. Note / Journal Form State
  const [journalTitle, setJournalTitle] = useState('');
  const [journalContent, setJournalContent] = useState('');
  const [journalMood, setJournalMood] = useState('خوب');

  // 10. Document Form State
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState('پزشکی');
  const [docNotes, setDocNotes] = useState('');
  const [docFileUrl, setDocFileUrl] = useState('');
  const [docFileName, setDocFileName] = useState('');
  const [docFileSize, setDocFileSize] = useState('');

  const docFilePickerRef = useRef<HTMLInputElement>(null);
  const docCameraPickerRef = useRef<HTMLInputElement>(null);

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setEntryDate(getTodayJalali());
      setEntryTime(getCurrentTime());
    } else {
      if (voiceService) voiceService.stop();
      setIsListening(false);
      setNaturalText('');
      setExtractionResult(null);
      setActiveFormType(null);
      setDocFileUrl('');
      setDocFileName('');
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
    const date = entryDate || getTodayJalali();
    const time = entryTime || getCurrentTime();

    // 1. Measurements
    if (extractionResult.measurements && extractionResult.measurements.length > 0) {
      extractionResult.measurements.forEach((m) => {
        const item: Measurement = {
          id: 'm-' + Math.random().toString(36).substring(2, 9),
          type: m.type as any,
          value: m.value,
          unit: m.unit,
          recordedAtJalali: m.dateJalali || date,
          recordedTime: time,
          time: time,
          timeJalali: time,
          timestamp: now,
          notes: m.notes || extractionResult.summary,
        };
        StorageService.addMeasurement(item);
      });
    }

    // 2. Medication
    if (extractionResult.medication) {
      const med: Medication = {
        id: 'med-' + Math.random().toString(36).substring(2, 9),
        name: extractionResult.medication.name,
        dosage: extractionResult.medication.dosage || '۱ عدد',
        form: 'قرص',
        frequency: (extractionResult.medication.frequency as any) || 'once_daily',
        timesOfDay: ['08:00'],
        startDateJalali: date,
        time: time,
        timeJalali: time,
        isActive: true,
        instructions: extractionResult.medication.instructions,
      };
      const meds = StorageService.getMedications();
      meds.unshift(med);
      StorageService.saveMedications(meds);
    }

    // 3. Reminder
    if (extractionResult.reminder) {
      const rem: Reminder = {
        id: 'rem-' + Math.random().toString(36).substring(2, 9),
        title: extractionResult.reminder.title,
        category: (extractionResult.reminder.category as any) || 'general',
        dueDateJalali: extractionResult.reminder.dueDateJalali || date,
        dueTime: extractionResult.reminder.dueTime || time,
        time: time,
        timeJalali: time,
        isCompleted: false,
      };
      const rems = StorageService.getReminders();
      rems.unshift(rem);
      StorageService.saveReminders(rems);
    }

    // 4. Life Event
    if (extractionResult.event) {
      const ev: LifeEvent = {
        id: 'ev-' + Math.random().toString(36).substring(2, 9),
        title: extractionResult.event.title,
        category: (extractionResult.event.category as any) || 'other',
        dateJalali: extractionResult.event.dateJalali || date,
        time: time,
        timeJalali: time,
        cost: extractionResult.event.cost,
        description: extractionResult.summary,
      };
      const events = StorageService.getEvents();
      events.unshift(ev);
      StorageService.saveEvents(events);
    }

    notifySuccess('اطلاعات استخراج شده با موفقیت ذخیره شدند.');
  };

  // 1. SAVE Water Intake
  const handleSaveWaterIntake = () => {
    const val = parseFloat(waterAmount);
    if (isNaN(val) || val <= 0) return;
    const now = Date.now();
    const date = entryDate || getTodayJalali();
    const time = entryTime || getCurrentTime();

    StorageService.addMeasurement({
      id: 'water-' + Math.random().toString(36).substring(2, 9),
      type: 'water_intake',
      value: val,
      unit: 'میلی‌لیتر',
      recordedAtJalali: date,
      recordedTime: time,
      time: time,
      timeJalali: time,
      timestamp: now,
      notes: waterNotes || `${toFaDigits(val)} میلی‌لیتر آب`,
    });

    notifySuccess(`مصرف ${toFaDigits(val)} میلی‌لیتر آب در ساعت ${toFaDigits(time)} ثبت شد.`);
  };

  // 2. SAVE Measurement
  const handleSaveManualMeasurement = () => {
    if (!measureValue1) return;
    const now = Date.now();
    const date = entryDate || getTodayJalali();
    const time = entryTime || getCurrentTime();

    if (measureType === 'blood_pressure') {
      if (measureValue1) {
        StorageService.addMeasurement({
          id: 'm-' + Math.random().toString(36).substring(2, 9),
          type: 'blood_pressure_sys',
          value: parseFloat(measureValue1),
          unit: 'mmHg',
          recordedAtJalali: date,
          recordedTime: time,
          time: time,
          timeJalali: time,
          timestamp: now,
          notes: measureNotes || 'سیستولیک',
        });
      }
      if (measureValue2) {
        StorageService.addMeasurement({
          id: 'm-' + Math.random().toString(36).substring(2, 9),
          type: 'blood_pressure_dia',
          value: parseFloat(measureValue2),
          unit: 'mmHg',
          recordedAtJalali: date,
          recordedTime: time,
          time: time,
          timeJalali: time,
          timestamp: now,
          notes: measureNotes || 'دیاستولیک',
        });
      }
    } else {
      const units: Record<string, string> = {
        weight: 'kg',
        water_intake: 'میلی‌لیتر',
        blood_glucose: 'mg/dL',
        heart_rate: 'bpm',
        spo2: '%',
        temp: '°C',
      };
      StorageService.addMeasurement({
        id: 'm-' + Math.random().toString(36).substring(2, 9),
        type: measureType as any,
        value: parseFloat(measureValue1),
        unit: units[measureType] || '',
        recordedAtJalali: date,
        recordedTime: time,
        time: time,
        timeJalali: time,
        timestamp: now,
        notes: measureNotes,
      });
    }

    notifySuccess(`سنجش سلامت در ساعت ${toFaDigits(time)} با موفقیت ثبت شد.`);
  };

  // 3. SAVE Medication
  const handleSaveMedication = () => {
    if (!medName.trim()) return;
    const date = entryDate || getTodayJalali();
    const time = entryTime || getCurrentTime();

    const newMed: Medication = {
      id: 'med-' + Math.random().toString(36).substring(2, 9),
      name: medName.trim(),
      dosage: medDosage.trim() || '۱ عدد',
      form: medForm as any,
      reason: medReason.trim(),
      doctorName: medDoctor.trim(),
      prescribedBy: medDoctor.trim(),
      frequency: medFrequency as any,
      timesOfDay: medSlots.map((s) => (s === 'صبح' ? '08:00' : s === 'ظهر' ? '13:00' : s === 'عصر' ? '18:00' : '22:00')),
      timeSlotLabels: medSlots as any,
      startDateJalali: date,
      time: time,
      timeJalali: time,
      isActive: true,
      instructions: medInstructions.trim(),
      notes: medNotes.trim(),
      refillReminder: true,
    };
    const allMeds = StorageService.getMedications();
    allMeds.unshift(newMed);
    StorageService.saveMedications(allMeds);
    notifySuccess(`داروی "${medName}" اضافه شد.`);
  };

  // 4. SAVE Lab Test
  const handleSaveLabTest = () => {
    if (!labTestName.trim()) return;
    const date = entryDate || getTodayJalali();
    const time = entryTime || getCurrentTime();

    const newLab: LaboratoryTest = {
      id: 'lab-' + Math.random().toString(36).substring(2, 9),
      testName: labTestName.trim(),
      dateJalali: date,
      time: time,
      timeJalali: time,
      laboratoryName: labName.trim(),
      doctorName: labDoctor.trim(),
      summary: labSummary.trim(),
      results: [],
    };
    const allLabs = StorageService.getLabs();
    allLabs.unshift(newLab);
    StorageService.saveLabs(allLabs);
    notifySuccess(`نتیجه آزمایش "${labTestName}" ثبت شد.`);
  };

  // 5. SAVE Doctor Visit
  const handleSaveDoctorVisit = () => {
    if (!docName.trim() && !visitReason.trim()) return;
    const finalDocName = docName.trim() || 'پزشک متخصص';
    const date = entryDate || getTodayJalali();
    const time = entryTime || getCurrentTime();

    const newVisit: MedicalVisit = {
      id: 'vis-' + Math.random().toString(36).substring(2, 9),
      doctorName: finalDocName,
      specialty: docSpecialty.trim(),
      reason: visitReason.trim() || 'ویزیت و معاینه',
      dateJalali: date,
      time: time,
      timeJalali: time,
      diagnosis: visitDiagnosis.trim(),
      followUpDateJalali: visitNextDate.trim() || undefined,
      notes: visitDiagnosis.trim(),
    };
    const allVisits = StorageService.getVisits();
    allVisits.unshift(newVisit);
    StorageService.saveVisits(allVisits);

    // Ensure doctor in list
    const allDocs = StorageService.getDoctors();
    if (!allDocs.some((d) => d.name.toLowerCase() === finalDocName.toLowerCase())) {
      allDocs.push({
        id: 'doc-' + Math.random().toString(36).substring(2, 9),
        name: finalDocName,
        specialty: docSpecialty.trim() || 'متخصص',
      });
      StorageService.saveDoctors(allDocs);
    }

    notifySuccess(`ویزیت "${finalDocName}" در ساعت ${toFaDigits(time)} ثبت شد.`);
  };

  // 6. SAVE Health Profile Info
  const handleSaveHealthInfo = () => {
    const prof = StorageService.getProfile();
    const parsedAllergies = healthAllergies.split(/[,،]/).map((s) => s.trim()).filter(Boolean);
    const parsedConditions = healthConditions.split(/[,،]/).map((s) => s.trim()).filter(Boolean);

    const updated: UserProfile = {
      ...prof,
      bloodType: healthBloodType as any,
      bloodGroup: healthBloodType as any,
      allergies: parsedAllergies.length > 0 ? parsedAllergies : prof.allergies,
      medicalConditions: parsedConditions.length > 0 ? parsedConditions : prof.medicalConditions,
      emergencyContact: healthEmergencyPhone.trim() || prof.emergencyContact,
      emergencyContactPhone: healthEmergencyPhone.trim() || prof.emergencyContactPhone,
    };
    StorageService.saveProfile(updated);
    notifySuccess('اطلاعات سلامت پروفایل به‌روزرسانی شد.');
  };

  // 7. SAVE Reminder
  const handleSaveReminder = () => {
    if (!reminderTitle.trim()) return;
    const date = entryDate || getTodayJalali();
    const time = entryTime || getCurrentTime();

    const newRem: Reminder = {
      id: 'rem-' + Math.random().toString(36).substring(2, 9),
      title: reminderTitle.trim(),
      category: reminderCategory,
      dueDateJalali: date,
      dueTime: time,
      time: time,
      timeJalali: time,
      priority: reminderPriority,
      isCompleted: false,
    };
    const rems = StorageService.getReminders();
    rems.unshift(newRem);
    StorageService.saveReminders(rems);
    notifySuccess(`یادآوری "${reminderTitle}" برای ساعت ${toFaDigits(time)} ذخیره شد.`);
  };

  // 8. SAVE Event / Car / Home / Cost
  const handleSaveEventCategory = (cat: 'car' | 'home' | 'finance' | 'other') => {
    if (!eventTitle.trim()) return;
    const date = entryDate || getTodayJalali();
    const time = entryTime || getCurrentTime();

    const newEv: LifeEvent = {
      id: 'ev-' + Math.random().toString(36).substring(2, 9),
      title: eventTitle.trim(),
      category: cat,
      dateJalali: date,
      time: time,
      timeJalali: time,
      cost: eventCost ? parseInt(eventCost, 10) : undefined,
      description: (eventNotes + (carMileage ? ` | کیلومتر: ${carMileage}` : '')).trim(),
    };
    const allEvs = StorageService.getEvents();
    allEvs.unshift(newEv);
    StorageService.saveEvents(allEvs);
    notifySuccess(`رویداد "${eventTitle}" ثبت شد.`);
  };

  // 9. SAVE Journal Note
  const handleSaveJournalNote = () => {
    if (!journalContent.trim() && !journalTitle.trim()) return;
    const date = entryDate || getTodayJalali();
    const time = entryTime || getCurrentTime();

    const moodMap: Record<string, 'great' | 'good' | 'neutral' | 'tired'> = {
      عالی: 'great',
      خوب: 'good',
      معمولی: 'neutral',
      خسته: 'tired',
    };
    const newEntry: JournalEntry = {
      id: 'j-' + Math.random().toString(36).substring(2, 9),
      title: journalTitle.trim() || 'یادداشت روزانه',
      content: journalContent.trim(),
      text: journalContent.trim(),
      dateJalali: date,
      time: time,
      timeJalali: time,
      mood: moodMap[journalMood] || 'good',
      tags: [],
    };
    const allJournals = StorageService.getJournal();
    allJournals.unshift(newEntry);
    StorageService.saveJournal(allJournals);
    notifySuccess(`یادداشت در ساعت ${toFaDigits(time)} ذخیره شد.`);
  };

  // 10. File Upload Handler for Document
  const handleDocFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDocFileName(file.name);
    setDocFileSize(`${toFaDigits((file.size / 1024).toFixed(0))} KB`);
    if (!docTitle) {
      setDocTitle(file.name.split('.')[0]);
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setDocFileUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // SAVE Document
  const handleSaveDocument = () => {
    if (!docTitle.trim()) return;
    const date = entryDate || getTodayJalali();
    const time = entryTime || getCurrentTime();

    const catMap: Record<string, any> = {
      پزشکی: 'medical',
      بیمه: 'insurance',
      هویتی: 'identity',
      خودرو: 'car',
      مالی: 'receipt',
    };
    const newDoc: DocumentItem = {
      id: 'doc-' + Math.random().toString(36).substring(2, 9),
      title: docTitle.trim(),
      category: catMap[docCategory] || 'general',
      dateJalali: date,
      time: time,
      timeJalali: time,
      fileName: docFileName || docTitle.trim(),
      fileSize: docFileSize,
      fileUrl: docFileUrl || 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=500&auto=format&fit=crop&q=60',
      fileType: docFileUrl.startsWith('data:image') ? 'image/jpeg' : 'application/pdf',
      notes: docNotes.trim(),
      tags: [docCategory],
    };
    const allDocs = StorageService.getDocuments();
    allDocs.unshift(newDoc);
    StorageService.saveDocuments(allDocs);
    notifySuccess(`سند "${docTitle}" در ساعت ${toFaDigits(time)} ذخیره شد.`);
  };

  // Quick categories metadata
  const quickCategories = [
    { id: 'water_intake', title: 'مصرف آب', icon: Droplet, desc: 'ثبت لحظه‌ای لیوان و بطری آب' },
    { id: 'health_measurement', title: 'اندازه‌گیری', icon: Activity, desc: 'فشار، قند، وزن و ضربان' },
    { id: 'medication', title: 'ثبت دارو', icon: Pill, desc: 'افزودن داروی روزانه یا جدید' },
    { id: 'lab', title: 'ثبت آزمایش', icon: FlaskConical, desc: 'نتیجه چکاپ و برگه آزمایش' },
    { id: 'doctor_visit', title: 'ویزیت پزشک', icon: Heart, desc: 'معاینه، دستورات و تاریخ بعدی' },
    { id: 'health_info', title: 'اطلاعات سلامت', icon: UserCheck, desc: 'گروه خونی، آلرژی و اورژانس' },
    { id: 'reminder', title: 'یادآوری', icon: Bell, desc: 'موعد دارو، چکاپ و بیمه' },
    { id: 'car', title: 'امور خودرو', icon: Car, desc: 'سرویس، روغن، بیمه و بنزین' },
    { id: 'home', title: 'امور خانه', icon: Home, desc: 'تاسیسات، تعمیرات و قبوض' },
    { id: 'cost', title: 'هزینه و خرید', icon: Coins, desc: 'ثبت مخارج و خریدهای مهم' },
    { id: 'event', title: 'رویداد مهم', icon: Calendar, desc: 'اتفاقات، مناسبت‌ها و قرارداد' },
    { id: 'note', title: 'یادداشت روزانه', icon: FileText, desc: 'افکار، احوال و خاطرات' },
    { id: 'document', title: 'مدرک و سند', icon: Paperclip, desc: 'عکس با دوربین و فایل' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-card text-foreground rounded-3xl border border-border shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 my-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-foreground">
                ثبت سریع در دفتر من
              </h3>
              <p className="text-[11px] text-muted-foreground">
                ورود صوتی، متنی هوشمند یا دسته‌بندی مستقیم با تاریخ و ساعت دقیق
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-xs sm:text-sm">
          
          {/* Smart Voice & Natural Text Input Box */}
          {!activeFormType && !extractionResult && (
            <div className="space-y-2.5 bg-muted/40 p-3.5 sm:p-4 rounded-2xl border border-border">
              <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                <span className="flex items-center gap-1.5 text-primary">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>متن یا پیام صوتی خود را بفرمایید:</span>
                </span>
                {isListening && (
                  <span className="text-rose-500 font-bold animate-pulse flex items-center gap-1 text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    در حال شنیدن...
                  </span>
                )}
              </div>

              <div className="relative">
                <textarea
                  rows={2}
                  value={naturalText}
                  onChange={(e) => setNaturalText(e.target.value)}
                  placeholder="مثال: ۱ لیوان آب خوردم، یا: امروز فشار خونم ۱۲ روی ۸ بود، یا: قرص لوزارتان ۲۵ اضافه کن..."
                  className="w-full p-3 rounded-xl border border-border bg-background text-foreground text-xs sm:text-sm focus:border-primary focus:outline-none resize-none"
                />
                <button
                  type="button"
                  onClick={toggleVoice}
                  className={`absolute left-2.5 bottom-3 p-2 rounded-xl transition-all cursor-pointer ${
                    isListening
                      ? 'bg-rose-500 text-white animate-bounce shadow-md'
                      : 'bg-primary/10 text-primary hover:bg-primary/20'
                  }`}
                  title={isListening ? 'توقف ضبط' : 'شروع ضبط صدا'}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              </div>

              {voiceError && (
                <div className="text-[11px] text-rose-500 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{voiceError}</span>
                </div>
              )}

              {naturalText.trim() && (
                <button
                  onClick={handleProcessNaturalLanguage}
                  disabled={isExtracting}
                  className="w-full py-2.5 rounded-xl bg-primary hover:bg-[#687a5e] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  {isExtracting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>درحال تحلیل هوشمند با هوش مصنوعی...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>پردازش و تفکیک خودکار اطلاعات</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* AI Extraction Confirmation Card */}
          {extractionResult && (
            <div className="space-y-3 p-4 rounded-2xl bg-primary/5 border border-primary/20 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-primary/20">
                <span className="font-bold text-xs text-primary flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  اطلاعات تشخیص داده شده:
                </span>
                <button
                  onClick={() => setExtractionResult(null)}
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                >
                  ویرایش دستی
                </button>
              </div>

              <p className="text-xs text-foreground font-medium leading-relaxed bg-background p-2.5 rounded-xl border border-border">
                {extractionResult.summary}
              </p>

              {/* Editable Timestamp for AI record */}
              <div className="grid grid-cols-2 gap-2 bg-card p-2.5 rounded-xl border border-border">
                <div>
                  <label className="block text-[11px] text-muted-foreground mb-1">تاریخ ثبت</label>
                  <input
                    type="text"
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="w-full p-1.5 rounded-lg border border-border bg-background text-foreground text-center font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-muted-foreground mb-1">ساعت و دقیقه</label>
                  <input
                    type="text"
                    value={entryTime}
                    onChange={(e) => setEntryTime(e.target.value)}
                    className="w-full p-1.5 rounded-lg border border-border bg-background text-foreground text-center font-bold text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => setExtractionResult(null)}
                  className="flex-1 py-2.5 rounded-xl border border-border bg-background hover:bg-muted text-foreground font-semibold text-xs cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  onClick={handleSaveExtracted}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary hover:bg-[#687a5e] text-white font-bold text-xs shadow-md shadow-primary/25 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تأیید و ذخیره در دفتر من</span>
                </button>
              </div>
            </div>
          )}

          {/* Direct Category Grid */}
          {!extractionResult && !activeFormType && (
            <div>
              <div className="text-xs font-bold text-muted-foreground mb-2.5 flex items-center justify-between">
                <span>انتخاب مستقیم فرم ثبت:</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                {quickCategories.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setEntryDate(getTodayJalali());
                        setEntryTime(getCurrentTime());
                        setActiveFormType(cat.id);
                      }}
                      className="flex flex-col items-center justify-center p-3 rounded-2xl border border-border hover:border-primary hover:bg-primary/5 transition-all text-center group bg-card cursor-pointer shadow-2xs"
                    >
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-1.5 bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-foreground leading-tight">
                        {cat.title}
                      </span>
                      <span className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                        {cat.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* COMMON TIMESTAMP BAR (Active on all forms) */}
          {/* ========================================================================= */}
          {activeFormType && (
            <div className="p-3 rounded-2xl bg-muted/40 border border-border flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <span className="font-bold text-xs text-foreground">زمان ثبت:</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  placeholder="تاریخ"
                  className="w-24 p-1.5 rounded-xl border border-border bg-background text-foreground text-center font-bold text-xs"
                />
                <input
                  type="text"
                  value={entryTime}
                  onChange={(e) => setEntryTime(e.target.value)}
                  placeholder="ساعت:دقیقه"
                  className="w-16 p-1.5 rounded-xl border border-border bg-background text-foreground text-center font-bold text-xs"
                />
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 1. WATER INTAKE FORM */}
          {/* ========================================================================= */}
          {activeFormType === 'water_intake' && (
            <div className="space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="font-bold text-sm text-foreground flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400">
                  <Droplet className="w-4 h-4" />
                  ثبت مصرف آب
                </span>
                <button
                  onClick={() => setActiveFormType(null)}
                  className="text-xs text-primary flex items-center gap-1 font-semibold hover:underline cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  بازگشت
                </button>
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">انتخاب سریع مقدار مصرف</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { amount: '250', label: '۱ لیوان (۲۵۰ml)' },
                    { amount: '500', label: '۲ لیوان (۵۰۰ml)' },
                    { amount: '750', label: '۱ بطری (۷۵۰ml)' },
                    { amount: '1000', label: '۱ لیتر (۱۰۰۰ml)' },
                  ].map((p) => (
                    <button
                      key={p.amount}
                      type="button"
                      onClick={() => setWaterAmount(p.amount)}
                      className={`p-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                        waterAmount === p.amount
                          ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm'
                          : 'bg-background text-foreground border-border hover:bg-muted'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1">مقدار دقیق (میلی‌لیتر)</label>
                <input
                  type="number"
                  value={waterAmount}
                  onChange={(e) => setWaterAmount(e.target.value)}
                  placeholder="مثال: 300"
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground text-center font-bold text-base"
                />
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1">یادداشت (اختیاری)</label>
                <input
                  type="text"
                  value={waterNotes}
                  onChange={(e) => setWaterNotes(e.target.value)}
                  placeholder="مثال: همراه لیمو، بعد از ورزش، صبح ناشتا..."
                  className="w-full p-2 rounded-xl border border-border bg-background text-foreground text-xs"
                />
              </div>

              <button
                type="button"
                onClick={handleSaveWaterIntake}
                className="w-full py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-cyan-600/20 mt-2 cursor-pointer"
              >
                ثبت مصرف آب در ساعت {toFaDigits(entryTime)}
              </button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 2. HEALTH MEASUREMENT FORM */}
          {/* ========================================================================= */}
          {activeFormType === 'health_measurement' && (
            <div className="space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-primary" />
                  ثبت اندازه‌گیری سلامت
                </span>
                <button
                  onClick={() => setActiveFormType(null)}
                  className="text-xs text-primary flex items-center gap-1 font-semibold hover:underline cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  بازگشت
                </button>
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">نوع شاخص</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'weight', title: 'وزن (kg)' },
                    { id: 'water_intake', title: 'مصرف آب (ml)' },
                    { id: 'blood_pressure', title: 'فشار خون' },
                    { id: 'blood_glucose', title: 'قند خون' },
                    { id: 'heart_rate', title: 'ضربان قلب' },
                    { id: 'spo2', title: 'اکسیژن (SpO2)' },
                    { id: 'temp', title: 'دمای بدن' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMeasureType(m.id as any)}
                      className={`p-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        measureType === m.id
                          ? 'bg-primary text-white border-primary shadow-xs'
                          : 'bg-background text-foreground border-border hover:bg-muted'
                      }`}
                    >
                      {m.title}
                    </button>
                  ))}
                </div>
              </div>

              {measureType === 'blood_pressure' ? (
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">سیستولیک (بالا)</label>
                    <input
                      type="number"
                      value={measureValue1}
                      onChange={(e) => setMeasureValue1(e.target.value)}
                      placeholder="مثلاً: 120"
                      className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground text-sm font-bold text-center"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">دیاستولیک (پایین)</label>
                    <input
                      type="number"
                      value={measureValue2}
                      onChange={(e) => setMeasureValue2(e.target.value)}
                      placeholder="مثلاً: 80"
                      className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground text-sm font-bold text-center"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">مقدار اندازه‌گیری شده</label>
                  <input
                    type="number"
                    step="0.1"
                    value={measureValue1}
                    onChange={(e) => setMeasureValue1(e.target.value)}
                    placeholder="مقدار عددی..."
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground text-sm font-bold text-center"
                    autoFocus
                  />
                </div>
              )}

              <div>
                <label className="block text-xs text-muted-foreground mb-1">یادداشت / وضعیت (اختیاری)</label>
                <input
                  type="text"
                  value={measureNotes}
                  onChange={(e) => setMeasureNotes(e.target.value)}
                  placeholder="مثال: ناشتا، بعد از ورزش، استراحت..."
                  className="w-full p-2 rounded-xl border border-border bg-background text-foreground text-xs"
                />
              </div>

              <button
                type="button"
                onClick={handleSaveManualMeasurement}
                className="w-full py-3 rounded-2xl bg-primary hover:bg-[#687a5e] text-white font-bold text-xs sm:text-sm shadow-md shadow-primary/20 mt-2 cursor-pointer"
              >
                ثبت سنجش سلامت در ساعت {toFaDigits(entryTime)}
              </button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 3. MEDICATION FORM */}
          {/* ========================================================================= */}
          {activeFormType === 'medication' && (
            <div className="space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <Pill className="w-4 h-4 text-primary" />
                  ثبت داروی جدید
                </span>
                <button
                  onClick={() => setActiveFormType(null)}
                  className="text-xs text-primary flex items-center gap-1 font-semibold hover:underline cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  بازگشت
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">نام دارو *</label>
                  <input
                    type="text"
                    value={medName}
                    onChange={(e) => setMedName(e.target.value)}
                    placeholder="مثال: لوزارتان، متفورمین، آتورواستاتین..."
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground text-sm font-bold"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">دوز / مقدار</label>
                  <input
                    type="text"
                    value={medDosage}
                    onChange={(e) => setMedDosage(e.target.value)}
                    placeholder="مثال: ۲۵ میلی‌گرم، ۵۰۰mg، ۱ عدد"
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">نوع دارو</label>
                  <select
                    value={medForm}
                    onChange={(e) => setMedForm(e.target.value)}
                    className="w-full p-2 rounded-xl border border-border bg-background text-foreground text-xs"
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
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">علت مصرف</label>
                  <input
                    type="text"
                    value={medReason}
                    onChange={(e) => setMedReason(e.target.value)}
                    placeholder="مثال: فشار خون، قند"
                    className="w-full p-2 rounded-xl border border-border bg-background text-foreground text-xs"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs text-muted-foreground mb-1">پزشک تجویزکننده</label>
                  <input
                    type="text"
                    value={medDoctor}
                    onChange={(e) => setMedDoctor(e.target.value)}
                    placeholder="نام پزشک..."
                    className="w-full p-2 rounded-xl border border-border bg-background text-foreground text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">وعده‌های مصرف در طول روز</label>
                <div className="grid grid-cols-4 gap-2">
                  {['صبح', 'ظهر', 'عصر', 'شب'].map((slot) => {
                    const isSelected = medSlots.includes(slot);
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            if (medSlots.length > 1) {
                              setMedSlots(medSlots.filter((s) => s !== slot));
                            }
                          } else {
                            setMedSlots([...medSlots, slot]);
                          }
                        }}
                        className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-primary text-white border-primary'
                            : 'bg-background text-muted-foreground border-border hover:bg-muted'
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1">دستور مصرف</label>
                <input
                  type="text"
                  value={medInstructions}
                  onChange={(e) => setMedInstructions(e.target.value)}
                  placeholder="مثال: بعد از غذا، با آب فراوان، قبل از خواب..."
                  className="w-full p-2 rounded-xl border border-border bg-background text-foreground text-xs"
                />
              </div>

              <button
                type="button"
                onClick={handleSaveMedication}
                className="w-full py-3 rounded-2xl bg-primary hover:bg-[#687a5e] text-white font-bold text-xs sm:text-sm shadow-md shadow-primary/20 mt-2 cursor-pointer"
              >
                ذخیره دارو در لیست
              </button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 4. LAB TEST FORM */}
          {/* ========================================================================= */}
          {activeFormType === 'lab' && (
            <div className="space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <FlaskConical className="w-4 h-4 text-primary" />
                  ثبت برگه / نتیجه آزمایش
                </span>
                <button
                  onClick={() => setActiveFormType(null)}
                  className="text-xs text-primary flex items-center gap-1 font-semibold hover:underline cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  بازگشت
                </button>
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1">عنوان / نوع آزمایش *</label>
                <input
                  type="text"
                  value={labTestName}
                  onChange={(e) => setLabTestName(e.target.value)}
                  placeholder="مثال: چکاپ سالانه خون، آزمایش تیروئید، ویتامین D..."
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground text-sm font-bold"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">نام آزمایشگاه</label>
                  <input
                    type="text"
                    value={labName}
                    onChange={(e) => setLabName(e.target.value)}
                    placeholder="مثال: آزمایشگاه مرکزی..."
                    className="w-full p-2 rounded-xl border border-border bg-background text-foreground text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">پزشک معالج</label>
                  <input
                    type="text"
                    value={labDoctor}
                    onChange={(e) => setLabDoctor(e.target.value)}
                    placeholder="نام پزشک..."
                    className="w-full p-2 rounded-xl border border-border bg-background text-foreground text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1">خلاصه نتیجه یا مقادیر فاکتورها</label>
                <textarea
                  rows={2}
                  value={labSummary}
                  onChange={(e) => setLabSummary(e.target.value)}
                  placeholder="مثال: ویتامین دی ۳۵ (نرمال)، قند ناشتا ۹۵، کلسترول ۱۸۰..."
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground text-xs"
                />
              </div>

              <button
                type="button"
                onClick={handleSaveLabTest}
                className="w-full py-3 rounded-2xl bg-primary hover:bg-[#687a5e] text-white font-bold text-xs sm:text-sm shadow-md shadow-primary/20 mt-2 cursor-pointer"
              >
                ثبت در پرونده آزمایش‌ها
              </button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 5. DOCTOR VISIT FORM */}
          {/* ========================================================================= */}
          {activeFormType === 'doctor_visit' && (
            <div className="space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-primary" />
                  ثبت ویزیت پزشک
                </span>
                <button
                  onClick={() => setActiveFormType(null)}
                  className="text-xs text-primary flex items-center gap-1 font-semibold hover:underline cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  بازگشت
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">نام پزشک *</label>
                  <input
                    type="text"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    placeholder="دکتر حسینی..."
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground text-sm font-bold"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">تخصص</label>
                  <input
                    type="text"
                    value={docSpecialty}
                    onChange={(e) => setDocSpecialty(e.target.value)}
                    placeholder="قلب و عروق، داخلی..."
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1">علت مراجعه</label>
                <input
                  type="text"
                  value={visitReason}
                  onChange={(e) => setVisitReason(e.target.value)}
                  placeholder="چکاپ دوره‌ای، سردرد، درد قفسه سینه..."
                  className="w-full p-2 rounded-xl border border-border bg-background text-foreground text-xs"
                />
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1">تشخیص و توصیه‌های پزشک</label>
                <textarea
                  rows={2}
                  value={visitDiagnosis}
                  onChange={(e) => setVisitDiagnosis(e.target.value)}
                  placeholder="دستورات، داروهای تجویز شده و رژیم غذایی..."
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground text-xs"
                />
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1">تاریخ ویزیت بعدی (شمسی)</label>
                <input
                  type="text"
                  value={visitNextDate}
                  onChange={(e) => setVisitNextDate(e.target.value)}
                  placeholder="مثلاً: 1405/06/15"
                  className="w-full p-2 rounded-xl border border-border bg-background text-foreground text-xs text-center"
                />
              </div>

              <button
                type="button"
                onClick={handleSaveDoctorVisit}
                className="w-full py-3 rounded-2xl bg-primary hover:bg-[#687a5e] text-white font-bold text-xs sm:text-sm shadow-md shadow-primary/20 mt-2 cursor-pointer"
              >
                ثبت خلاصه ویزیت
              </button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 6. HEALTH INFO (Profile) */}
          {/* ========================================================================= */}
          {activeFormType === 'health_info' && (
            <div className="space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-primary" />
                  اطلاعات سلامت پایه
                </span>
                <button
                  onClick={() => setActiveFormType(null)}
                  className="text-xs text-primary flex items-center gap-1 font-semibold hover:underline cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  بازگشت
                </button>
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">گروه خونی</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((bg) => (
                    <button
                      key={bg}
                      type="button"
                      onClick={() => setHealthBloodType(bg)}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        healthBloodType === bg
                          ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                          : 'bg-background text-foreground border-border hover:bg-muted'
                      }`}
                    >
                      {bg}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1">حساسیت‌ها و آلرژی‌ها</label>
                <input
                  type="text"
                  value={healthAllergies}
                  onChange={(e) => setHealthAllergies(e.target.value)}
                  placeholder="پنی‌سیلین، گرد و غبار، تخم مرغ (با کاما جدا کنید)"
                  className="w-full p-2 rounded-xl border border-border bg-background text-foreground text-xs"
                />
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1">بیماری‌ها و سوابق پزشکی</label>
                <input
                  type="text"
                  value={healthConditions}
                  onChange={(e) => setHealthConditions(e.target.value)}
                  placeholder="فشار خون، دیابت، سابقه جراحی..."
                  className="w-full p-2 rounded-xl border border-border bg-background text-foreground text-xs"
                />
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1">شماره تماس اضطراری</label>
                <input
                  type="text"
                  value={healthEmergencyPhone}
                  onChange={(e) => setHealthEmergencyPhone(e.target.value)}
                  placeholder="0912..."
                  className="w-full p-2 rounded-xl border border-border bg-background text-foreground text-xs font-mono"
                />
              </div>

              <button
                type="button"
                onClick={handleSaveHealthInfo}
                className="w-full py-3 rounded-2xl bg-primary hover:bg-[#687a5e] text-white font-bold text-xs sm:text-sm shadow-md shadow-primary/20 mt-2 cursor-pointer"
              >
                به‌روزرسانی پروفایل سلامت
              </button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 7. REMINDER FORM */}
          {/* ========================================================================= */}
          {activeFormType === 'reminder' && (
            <div className="space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-primary" />
                  ثبت یادآوری جدید
                </span>
                <button
                  onClick={() => setActiveFormType(null)}
                  className="text-xs text-primary flex items-center gap-1 font-semibold hover:underline cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  بازگشت
                </button>
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1">عنوان یادآوری *</label>
                <input
                  type="text"
                  value={reminderTitle}
                  onChange={(e) => setReminderTitle(e.target.value)}
                  placeholder="مثال: تمدید بیمه خودرو، مصرف داروی عصر، نوبت دندانپزشکی..."
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground text-sm font-bold"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">دسته‌بندی</label>
                  <select
                    value={reminderCategory}
                    onChange={(e) => setReminderCategory(e.target.value as any)}
                    className="w-full p-2 rounded-xl border border-border bg-background text-foreground text-xs"
                  >
                    <option value="general">عمومی</option>
                    <option value="medication">دارو</option>
                    <option value="doctor">پزشک و درمان</option>
                    <option value="car">خودرو</option>
                    <option value="insurance">بیمه</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">اولویت</label>
                  <select
                    value={reminderPriority}
                    onChange={(e) => setReminderPriority(e.target.value as any)}
                    className="w-full p-2 rounded-xl border border-border bg-background text-foreground text-xs"
                  >
                    <option value="low">عادی</option>
                    <option value="medium">متوسط</option>
                    <option value="high">مهم و فوری</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveReminder}
                className="w-full py-3 rounded-2xl bg-primary hover:bg-[#687a5e] text-white font-bold text-xs sm:text-sm shadow-md shadow-primary/20 mt-2 cursor-pointer"
              >
                ذخیره یادآوری
              </button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 8. CAR / HOME / COST / EVENT FORMS */}
          {/* ========================================================================= */}
          {(activeFormType === 'car' || activeFormType === 'home' || activeFormType === 'cost' || activeFormType === 'event') && (
            <div className="space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-primary" />
                  {activeFormType === 'car'
                    ? 'ثبت امور خودرو و سرویس'
                    : activeFormType === 'home'
                    ? 'ثبت امور خانه و تاسیسات'
                    : activeFormType === 'cost'
                    ? 'ثبت هزینه و خرید'
                    : 'ثبت رویداد مهم'}
                </span>
                <button
                  onClick={() => setActiveFormType(null)}
                  className="text-xs text-primary flex items-center gap-1 font-semibold hover:underline cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  بازگشت
                </button>
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1">عنوان کار / رویداد *</label>
                <input
                  type="text"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder={
                    activeFormType === 'car'
                      ? 'تعویض روغن، تمدید بیمه بدنه، لنت...'
                      : activeFormType === 'home'
                      ? 'سرویس پکیج، تعمیر شیرآلات، شارژ ساختمان...'
                      : activeFormType === 'cost'
                      ? 'خرید اقساطی، هزینه سفر، پرداخت...'
                      : 'عنوان رویداد...'
                  }
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground text-sm font-bold"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">مبلغ / هزینه (تومان)</label>
                  <input
                    type="number"
                    value={eventCost}
                    onChange={(e) => setEventCost(e.target.value)}
                    placeholder="مثال: 450000"
                    className="w-full p-2 rounded-xl border border-border bg-background text-foreground text-xs"
                  />
                </div>
                {activeFormType === 'car' && (
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">کیلومتر فعلی خودرو</label>
                    <input
                      type="number"
                      value={carMileage}
                      onChange={(e) => setCarMileage(e.target.value)}
                      placeholder="مثال: 85000"
                      className="w-full p-2 rounded-xl border border-border bg-background text-foreground text-xs"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1">توضیحات و نکات</label>
                <textarea
                  rows={2}
                  value={eventNotes}
                  onChange={(e) => setEventNotes(e.target.value)}
                  placeholder="نکات، آدرس تعمیرگاه، جزئیات فاکتور..."
                  className="w-full p-2 rounded-xl border border-border bg-background text-foreground text-xs"
                />
              </div>

              <button
                type="button"
                onClick={() =>
                  handleSaveEventCategory(
                    activeFormType === 'car'
                      ? 'car'
                      : activeFormType === 'home'
                      ? 'home'
                      : activeFormType === 'cost'
                      ? 'finance'
                      : 'other'
                  )
                }
                className="w-full py-3 rounded-2xl bg-primary hover:bg-[#687a5e] text-white font-bold text-xs sm:text-sm shadow-md shadow-primary/20 mt-2 cursor-pointer"
              >
                ذخیره رویداد در دفتر من
              </button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 9. NOTE / JOURNAL FORM */}
          {/* ========================================================================= */}
          {activeFormType === 'note' && (
            <div className="space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-primary" />
                  ثبت یادداشت و حال روزانه
                </span>
                <button
                  onClick={() => setActiveFormType(null)}
                  className="text-xs text-primary flex items-center gap-1 font-semibold hover:underline cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  بازگشت
                </button>
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1">عنوان یادداشت (اختیاری)</label>
                <input
                  type="text"
                  value={journalTitle}
                  onChange={(e) => setJournalTitle(e.target.value)}
                  placeholder="مثال: دستاورد امروز، افکار صبحگاهی..."
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground text-sm font-bold"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">حال و انرژی شما</label>
                <div className="grid grid-cols-4 gap-2">
                  {['عالی', 'خوب', 'معمولی', 'خسته'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setJournalMood(m)}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        journalMood === m
                          ? 'bg-primary text-white border-primary'
                          : 'bg-background text-muted-foreground border-border hover:bg-muted'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1">متن یادداشت *</label>
                <textarea
                  rows={3}
                  value={journalContent}
                  onChange={(e) => setJournalContent(e.target.value)}
                  placeholder="هر آنچه در ذهن دارید بنویسید..."
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground text-xs"
                />
              </div>

              <button
                type="button"
                onClick={handleSaveJournalNote}
                className="w-full py-3 rounded-2xl bg-primary hover:bg-[#687a5e] text-white font-bold text-xs sm:text-sm shadow-md shadow-primary/20 mt-2 cursor-pointer"
              >
                ذخیره در دفترچه خاطرات و احوال
              </button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 10. DOCUMENT & FILE UPLOAD FORM (With Camera & File Manager) */}
          {/* ========================================================================= */}
          {activeFormType === 'document' && (
            <div className="space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <Paperclip className="w-4 h-4 text-primary" />
                  ثبت مدرک و سند (عکس با دوربین یا فایل)
                </span>
                <button
                  onClick={() => setActiveFormType(null)}
                  className="text-xs text-primary flex items-center gap-1 font-semibold hover:underline cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  بازگشت
                </button>
              </div>

              {/* Camera and Gallery Pickers */}
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5 font-bold">
                  انتخاب فایل یا عکس‌برداری مستقیم با دوربین گوشی *
                </label>

                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => docCameraPickerRef.current?.click()}
                    className="p-3 rounded-2xl border-2 border-dashed border-primary/40 hover:border-primary bg-primary/5 hover:bg-primary/10 flex flex-col items-center justify-center text-center transition-all cursor-pointer group"
                  >
                    <Camera className="w-6 h-6 text-primary mb-1 group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-foreground text-xs">عکس با دوربین</span>
                    <span className="text-[10px] text-muted-foreground">عکس‌برداری از سند</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => docFilePickerRef.current?.click()}
                    className="p-3 rounded-2xl border-2 border-dashed border-border hover:border-primary bg-muted/40 hover:bg-muted/70 flex flex-col items-center justify-center text-center transition-all cursor-pointer group"
                  >
                    <FolderOpen className="w-6 h-6 text-primary mb-1 group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-foreground text-xs">گالری و فایل‌ها</span>
                    <span className="text-[10px] text-muted-foreground">انتخاب از حافظه</span>
                  </button>
                </div>

                <input
                  ref={docCameraPickerRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleDocFileSelect}
                  className="hidden"
                />
                <input
                  ref={docFilePickerRef}
                  type="file"
                  accept="image/*,application/pdf,.doc,.docx"
                  onChange={handleDocFileSelect}
                  className="hidden"
                />

                {docFileUrl && (
                  <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-background flex-shrink-0 border border-border">
                        <img src={docFileUrl} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-bold text-foreground text-xs truncate">{docFileName || 'فایل سند انتخاب شد'}</p>
                        {docFileSize && <p className="text-[10px] text-muted-foreground">{docFileSize}</p>}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 font-bold text-[10px]">
                      آماده ذخیره ✓
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1">عنوان مدرک *</label>
                <input
                  type="text"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="مثال: بیمه‌نامه، جواب ام‌آر‌آی، نسخه، فاکتور..."
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1">دسته‌بندی</label>
                <select
                  value={docCategory}
                  onChange={(e) => setDocCategory(e.target.value)}
                  className="w-full p-2 rounded-xl border border-border bg-background text-foreground text-xs"
                >
                  <option value="پزشکی">پزشکی و نسخه</option>
                  <option value="بیمه">بیمه‌نامه</option>
                  <option value="هویتی">مدارک هویتی</option>
                  <option value="خودرو">خودرو و گواهی‌نامه</option>
                  <option value="مالی">مالی و فاکتور</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1">توضیحات و نکات</label>
                <textarea
                  rows={2}
                  value={docNotes}
                  onChange={(e) => setDocNotes(e.target.value)}
                  placeholder="توضیحات اختیاری..."
                  className="w-full p-2 rounded-xl border border-border bg-background text-foreground text-xs"
                />
              </div>

              <button
                type="button"
                onClick={handleSaveDocument}
                className="w-full py-3 rounded-2xl bg-primary hover:bg-[#687a5e] text-white font-bold text-xs sm:text-sm shadow-md shadow-primary/20 mt-2 cursor-pointer"
              >
                ذخیره مدرک در گاوصندوق
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

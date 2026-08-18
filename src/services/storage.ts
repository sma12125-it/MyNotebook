// Local Persistence and Data Service for دفتر من (MyLifeOS)
import {
  UserProfile,
  Measurement,
  Doctor,
  MedicalVisit,
  LaboratoryTest,
  Medication,
  MedicationLog,
  DocumentItem,
  Reminder,
  LifeEvent,
  JournalEntry,
  Topic,
  ImportantDate,
  AppState,
} from '../types';
import { getTodayJalali } from '../utils/jalali';

const STORAGE_KEYS = {
  PROFILE: 'daftar_profile_v1',
  MEASUREMENTS: 'daftar_measurements_v1',
  DOCTORS: 'daftar_doctors_v1',
  VISITS: 'daftar_visits_v1',
  LABS: 'daftar_labs_v1',
  MEDICATIONS: 'daftar_medications_v1',
  MEDICATION_LOGS: 'daftar_medication_logs_v1',
  DOCUMENTS: 'daftar_documents_v1',
  REMINDERS: 'daftar_reminders_v1',
  EVENTS: 'daftar_events_v1',
  JOURNAL: 'daftar_journal_v1',
  TOPICS: 'daftar_topics_v1',
  IMPORTANT_DATES: 'daftar_important_dates_v1',
  IS_DEMO_SEEDED: 'daftar_is_demo_seeded_v1',
  ONBOARDING_DONE: 'daftar_onboarding_done_v1',
};

export const DEFAULT_TOPICS: Topic[] = [
  { id: 'topic-health', title: 'سلامت عمومی', icon: 'Heart', color: 'rose', description: 'سوابق سلامت، علائم و چکاپ‌ها', isDefault: true },
  { id: 'topic-heart', title: 'سلامت قلب و عروق', icon: 'Activity', color: 'red', description: 'فشار خون، داروهای قلبی و ویزیت‌ها', isDefault: true },
  { id: 'topic-car', title: 'خودرو و وسایل نقلیه', icon: 'Car', color: 'blue', description: 'سرویس‌ها، بیمه، روغن و تعمیرات', isDefault: true },
  { id: 'topic-home', title: 'خانه و ساختمان', icon: 'Home', color: 'emerald', description: 'تاسیسات، قبوض، تعمیرات و اسباب', isDefault: true },
  { id: 'topic-finance', title: 'امور مالی و بیمه', icon: 'Coins', color: 'amber', description: 'بیمه تکمیلی، قراردادها و پس‌انداز', isDefault: true },
  { id: 'topic-growth', title: 'یادگیری و کار', icon: 'BookOpen', color: 'indigo', description: 'کتاب‌ها، دوره‌ها و تصمیمات مهم', isDefault: true },
];

export const DEFAULT_PROFILE: UserProfile = {
  id: 'user-default',
  name: 'علی رضایی',
  fullName: 'علی رضایی',
  birthDateJalali: '1368/04/15',
  birthYearJalali: '1368',
  gender: 'male',
  bloodGroup: 'O+',
  bloodType: 'O+',
  heightCm: 180,
  weightKg: 82.4,
  phoneNumber: '09123456789',
  emergencyContact: '09123456789',
  allergies: ['پنی‌سیلین', 'گرد و غبار فصلی'],
  medicalConditions: ['فشار خون خفیف', 'کمبود ویتامین دی'],
  emergencyContactName: 'سارا رضایی (همسر)',
  emergencyContactPhone: '09123456789',
  emergencyContactRelation: 'همسر',
  notes: 'خون‌دهنده مستمر، حساسیت به هوای سرد',
  darkMode: false,
  hasSeenOnboarding: false,
};

// Safe LocalStorage helpers
function getItem<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error(`Error reading ${key} from storage:`, err);
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error saving ${key} to storage:`, err);
  }
}

export class StorageService {
  // Onboarding
  static isOnboardingCompleted(): boolean {
    return getItem<boolean>(STORAGE_KEYS.ONBOARDING_DONE, false) || this.isDemoSeeded();
  }

  static setOnboardingCompleted(): void {
    setItem(STORAGE_KEYS.ONBOARDING_DONE, true);
  }

  // Profile
  static getProfile(): UserProfile {
    return getItem<UserProfile>(STORAGE_KEYS.PROFILE, DEFAULT_PROFILE);
  }
  static saveProfile(profile: UserProfile): void {
    setItem(STORAGE_KEYS.PROFILE, profile);
  }

  // Measurements
  static getMeasurements(): Measurement[] {
    return getItem<Measurement[]>(STORAGE_KEYS.MEASUREMENTS, []);
  }
  static saveMeasurements(items: Measurement[]): void {
    setItem(STORAGE_KEYS.MEASUREMENTS, items);
  }
  static addMeasurement(item: Measurement): void {
    const items = this.getMeasurements();
    items.unshift(item);
    this.saveMeasurements(items);
  }

  // Doctors
  static getDoctors(): Doctor[] {
    return getItem<Doctor[]>(STORAGE_KEYS.DOCTORS, []);
  }
  static saveDoctors(items: Doctor[]): void {
    setItem(STORAGE_KEYS.DOCTORS, items);
  }

  // Medical Visits
  static getVisits(): MedicalVisit[] {
    return getItem<MedicalVisit[]>(STORAGE_KEYS.VISITS, []);
  }
  static saveVisits(items: MedicalVisit[]): void {
    setItem(STORAGE_KEYS.VISITS, items);
  }

  // Laboratory Tests
  static getLabs(): LaboratoryTest[] {
    return getItem<LaboratoryTest[]>(STORAGE_KEYS.LABS, []);
  }
  static saveLabs(items: LaboratoryTest[]): void {
    setItem(STORAGE_KEYS.LABS, items);
  }

  // Medications
  static getMedications(): Medication[] {
    return getItem<Medication[]>(STORAGE_KEYS.MEDICATIONS, []);
  }
  static saveMedications(items: Medication[]): void {
    setItem(STORAGE_KEYS.MEDICATIONS, items);
  }

  // Medication Logs
  static getMedicationLogs(): MedicationLog[] {
    return getItem<MedicationLog[]>(STORAGE_KEYS.MEDICATION_LOGS, []);
  }
  static saveMedicationLogs(items: MedicationLog[]): void {
    setItem(STORAGE_KEYS.MEDICATION_LOGS, items);
  }

  // Documents
  static getDocuments(): DocumentItem[] {
    return getItem<DocumentItem[]>(STORAGE_KEYS.DOCUMENTS, []);
  }
  static saveDocuments(items: DocumentItem[]): void {
    setItem(STORAGE_KEYS.DOCUMENTS, items);
  }

  // Reminders
  static getReminders(): Reminder[] {
    return getItem<Reminder[]>(STORAGE_KEYS.REMINDERS, []);
  }
  static saveReminders(items: Reminder[]): void {
    setItem(STORAGE_KEYS.REMINDERS, items);
  }

  // Life Events
  static getEvents(): LifeEvent[] {
    return getItem<LifeEvent[]>(STORAGE_KEYS.EVENTS, []);
  }
  static saveEvents(items: LifeEvent[]): void {
    setItem(STORAGE_KEYS.EVENTS, items);
  }

  // Journal
  static getJournal(): JournalEntry[] {
    return getItem<JournalEntry[]>(STORAGE_KEYS.JOURNAL, []);
  }
  static saveJournal(items: JournalEntry[]): void {
    setItem(STORAGE_KEYS.JOURNAL, items);
  }

  static getJournalEntries(): JournalEntry[] {
    return this.getJournal();
  }

  static saveJournalEntries(items: JournalEntry[]): void {
    this.saveJournal(items);
  }

  // Topics
  static getTopics(): Topic[] {
    return getItem<Topic[]>(STORAGE_KEYS.TOPICS, DEFAULT_TOPICS);
  }
  static saveTopics(items: Topic[]): void {
    setItem(STORAGE_KEYS.TOPICS, items);
  }

  // Important Dates
  static getImportantDates(): ImportantDate[] {
    return getItem<ImportantDate[]>(STORAGE_KEYS.IMPORTANT_DATES, []);
  }
  static saveImportantDates(items: ImportantDate[]): void {
    setItem(STORAGE_KEYS.IMPORTANT_DATES, items);
  }

  // Unified App State
  static getAllState(): AppState {
    if (!this.isDemoSeeded()) {
      this.seedSampleData();
    }

    return {
      profile: this.getProfile(),
      vitals: this.getMeasurements(),
      doctors: this.getDoctors(),
      visits: this.getVisits(),
      labs: this.getLabs(),
      medications: this.getMedications(),
      documents: this.getDocuments(),
      reminders: this.getReminders(),
      events: this.getEvents(),
      journal: this.getJournal(),
      topics: this.getTopics(),
      importantDates: this.getImportantDates(),
    };
  }

  // Check if first time setup / seed sample data
  static isDemoSeeded(): boolean {
    return getItem<boolean>(STORAGE_KEYS.IS_DEMO_SEEDED, false);
  }

  // Seed realistic sample data
  static seedSampleData(): void {
    const today = getTodayJalali();
    
    // Sample Doctors
    const sampleDoctors: Doctor[] = [
      {
        id: 'doc-1',
        name: 'دکتر علیرضا حسینی',
        specialty: 'فوق تخصص قلب و عروق',
        phoneNumber: '02188776655',
        phone: '02188776655',
        clinicName: 'کلینیک تخصصی قلب شفا',
        address: 'تهران، خیابان ولیعصر، نرسیده به توانیر، پلاک ۴۲',
        notes: 'بسیار باحوصله، ویزیت هر ۶ ماه یک‌بار برای کنترل فشار خون',
      },
      {
        id: 'doc-2',
        name: 'دکتر مریم صابری',
        specialty: 'متخصص غدد و متابولیسم',
        phoneNumber: '02122334455',
        phone: '02122334455',
        clinicName: 'ساختمان پزشکان آتیه',
        address: 'تهران، شهرک غرب، بلوار دادمان',
        notes: 'برای پایش سطح ویتامین دی و تیروئید',
      },
      {
        id: 'doc-3',
        name: 'دکتر کامران راد',
        specialty: 'جراح و دندانپزشک',
        phoneNumber: '02188990011',
        phone: '02188990011',
        clinicName: 'مطب دندانپزشکی دکتر راد',
        address: 'تهران، خیابان مطهری، خیابان میرعماد',
        notes: 'چکاپ سالانه دندان‌ها و جرم‌گیری',
      },
    ];

    // Sample Medications
    const sampleMedications: Medication[] = [
      {
        id: 'med-1',
        name: 'لوزارتان (Losartan)',
        dosage: '۲۵ میلی‌گرم',
        form: 'قرص',
        reason: 'کنترل فشار خون',
        doctorName: 'دکتر حسینی',
        prescribedBy: 'دکتر حسینی',
        startDateJalali: '1404/10/01',
        frequency: 'once_daily',
        timesOfDay: ['08:00'],
        timeSlotLabels: ['صبح'],
        instructions: 'بعد از صبحانه',
        totalQuantity: 60,
        remainingQuantity: 18,
        refillReminder: true,
        notes: 'همراه با یک لیوان آب بعد از صبحانه مصرف شود',
        topicId: 'topic-heart',
        isActive: true,
      },
      {
        id: 'med-2',
        name: 'ویتامین دی (Vitamin D3)',
        dosage: '۵۰,۰۰۰ واحد',
        form: 'کپسول',
        reason: 'جبران کمبود ویتامین D',
        doctorName: 'دکتر صابری',
        prescribedBy: 'دکتر صابری',
        startDateJalali: '1405/01/15',
        frequency: 'weekly',
        timesOfDay: ['13:00'],
        timeSlotLabels: ['ظهر'],
        instructions: 'همراه با غذا',
        totalQuantity: 12,
        remainingQuantity: 5,
        refillReminder: true,
        notes: 'ماهی ۲ عدد (هر دو هفته یک‌بار بعد از ناهار)',
        topicId: 'topic-health',
        isActive: true,
      },
      {
        id: 'med-3',
        name: 'امگا ۳ (Omega-3)',
        dosage: '۱۰۰۰ میلی‌گرم',
        form: 'کپسول',
        reason: 'سلامت قلب و عروق',
        startDateJalali: '1405/02/01',
        frequency: 'once_daily',
        timesOfDay: ['21:00'],
        timeSlotLabels: ['شب'],
        instructions: 'بعد از شام',
        totalQuantity: 90,
        remainingQuantity: 42,
        refillReminder: false,
        notes: 'همراه با شام میل شود',
        topicId: 'topic-heart',
        isActive: true,
      },
    ];

    // Sample Measurements History
    const sampleMeasurements: Measurement[] = [
      { id: 'm-1', type: 'weight', value: 82.4, unit: 'kg', recordedAtJalali: today, recordedTime: '07:30', timestamp: Date.now(), notes: 'وزن ناشتا بعد از ورزش' },
      { id: 'm-2', type: 'weight', value: 83.1, unit: 'kg', recordedAtJalali: '1405/05/18', recordedTime: '08:00', timestamp: Date.now() - 8 * 86400000 },
      { id: 'm-3', type: 'weight', value: 83.8, unit: 'kg', recordedAtJalali: '1405/05/02', recordedTime: '07:45', timestamp: Date.now() - 24 * 86400000 },
      { id: 'm-4', type: 'weight', value: 84.5, unit: 'kg', recordedAtJalali: '1405/04/15', recordedTime: '08:15', timestamp: Date.now() - 41 * 86400000 },
      
      { id: 'm-5', type: 'blood_pressure_sys', value: 120, unit: 'mmHg', recordedAtJalali: today, recordedTime: '08:00', timestamp: Date.now(), notes: 'سیستولیک نرمال' },
      { id: 'm-6', type: 'blood_pressure_dia', value: 80, unit: 'mmHg', recordedAtJalali: today, recordedTime: '08:00', timestamp: Date.now(), notes: 'دیاستولیک' },
      { id: 'm-7', type: 'blood_pressure_sys', value: 125, unit: 'mmHg', recordedAtJalali: '1405/05/12', recordedTime: '08:30', timestamp: Date.now() - 14 * 86400000 },
      { id: 'm-8', type: 'blood_pressure_dia', value: 82, unit: 'mmHg', recordedAtJalali: '1405/05/12', recordedTime: '08:30', timestamp: Date.now() - 14 * 86400000 },

      { id: 'm-9', type: 'heart_rate', value: 72, unit: 'bpm', recordedAtJalali: today, recordedTime: '08:00', timestamp: Date.now() },
      { id: 'm-10', type: 'sleep_hours', value: 7.5, unit: 'ساعت', recordedAtJalali: today, recordedTime: '07:00', timestamp: Date.now(), notes: 'خواب عمیق و آرام' },
      { id: 'm-11', type: 'blood_oxygen', value: 98, unit: '%', recordedAtJalali: today, recordedTime: '08:05', timestamp: Date.now() },
    ];

    // Sample Medical Visits
    const sampleVisits: MedicalVisit[] = [
      {
        id: 'visit-1',
        doctorId: 'doc-1',
        doctorName: 'دکتر علیرضا حسینی',
        specialty: 'فوق تخصص قلب و عروق',
        dateJalali: '1405/03/10',
        reason: 'چکاپ دوره‌ای فشار خون و نوار قلب',
        symptoms: 'گاهی احساس تپش خفیف در هنگام استرس',
        diagnosis: 'فشار خون با دوز پایین لوزارتان کاملاً تحت کنترل است. نوار قلب ریتم سینوسی نرمال نشان داد.',
        doctorDiagnosis: 'فشار خون با دوز پایین لوزارتان کاملاً تحت کنترل است. نوار قلب ریتم سینوسی نرمال نشان داد.',
        instructions: 'کاهش مصرف نمک و پیاده‌روی روزانه ۳۰ دقیقه',
        prescriptions: ['لوزارتان ۲۵'],
        prescribedMedications: ['لوزارتان ۲۵'],
        followUpDateJalali: '1405/09/10',
        nextFollowUpDateJalali: '1405/09/10',
        cost: 450000,
        topicId: 'topic-heart',
        notes: 'توصیه به کاهش مصرف نمک و مدیریت استرس کاری',
      },
    ];

    // Sample Lab Tests with historical Vitamin D
    const sampleLabs: LaboratoryTest[] = [
      {
        id: 'lab-1',
        testName: 'پایش ویتامین D و چربی خون',
        dateJalali: '1405/04/20',
        laboratoryName: 'آزمایشگاه پاتوبیولوژی مرکزی',
        prescribedBy: 'دکتر مریم صابری',
        doctorName: 'دکتر مریم صابری',
        results: [
          { id: 'r-1', parameter: 'Vitamin D (25-OH)', value: 28.5, unit: 'ng/mL', referenceRange: '30.0 - 100.0', status: 'low' },
          { id: 'r-2', parameter: 'Cholesterol Total', value: 185, unit: 'mg/dL', referenceRange: '< 200', status: 'normal' },
          { id: 'r-3', parameter: 'Triglycerides', value: 140, unit: 'mg/dL', referenceRange: '< 150', status: 'normal' },
          { id: 'r-4', parameter: 'Fasting Blood Sugar (FBS)', value: 92, unit: 'mg/dL', referenceRange: '70 - 100', status: 'normal' },
        ],
        summary: 'سطح ویتامین دی از سال گذشته (۱۴) به ۲۸.۵ رسیده و نزدیک به نرمال است.',
        followUpDateJalali: '1405/10/20',
        notes: 'سطح ویتامین دی از سال گذشته (۱۴) به ۲۸.۵ رسیده و نزدیک به نرمال است.',
        topicId: 'topic-health',
      },
      {
        id: 'lab-2',
        testName: 'آزمایش ویتامین D دوره قبل',
        dateJalali: '1404/04/15',
        laboratoryName: 'آزمایشگاه نور',
        results: [
          { id: 'r-21', parameter: 'Vitamin D (25-OH)', value: 14.0, unit: 'ng/mL', referenceRange: '30.0 - 100.0', status: 'low' },
          { id: 'r-22', parameter: 'FBS', value: 96, unit: 'mg/dL', referenceRange: '70 - 100', status: 'normal' },
        ],
        summary: 'کمبود شدید ویتامین دی در سال ۱۴۰۴',
        notes: 'کمبود شدید ویتامین دی در سال ۱۴۰۴',
        topicId: 'topic-health',
      },
    ];

    // Sample Reminders
    const sampleReminders: Reminder[] = [
      {
        id: 'rem-1',
        title: 'آزمایش خون مجدد ویتامین D و آنزیم‌های کبد',
        category: 'lab',
        dueDateJalali: '1405/06/18',
        dueTime: '08:00',
        recurrence: 'once',
        isCompleted: false,
        priority: 'high',
        notes: 'به صورت ناشتا در آزمایشگاه پاتوبیولوژی مرکزی',
      },
      {
        id: 'rem-2',
        title: 'تمدید بیمه شخص ثالث خودرو پژو ۲۰۶',
        category: 'insurance',
        dueDateJalali: '1405/06/07',
        dueTime: '10:00',
        recurrence: 'yearly',
        isCompleted: false,
        priority: 'high',
        notes: 'بیمه ایران — با تخفیف ۷۰ درصد عدم خسارت',
      },
      {
        id: 'rem-3',
        title: 'سرویس تعویض روغن موتور و فیلترها (کیلومتر ۷۵ هزار)',
        category: 'car',
        dueDateJalali: '1405/07/05',
        dueTime: '16:00',
        recurrence: 'once',
        isCompleted: false,
        priority: 'medium',
        notes: 'روغن توتال ۱۰-۴۰ و فیلتر هوا',
      },
      {
        id: 'rem-4',
        title: 'مراجعه ۶ ماهه به دکتر حسینی (متخصص قلب)',
        category: 'doctor',
        dueDateJalali: '1405/09/10',
        dueTime: '17:30',
        recurrence: 'once',
        isCompleted: false,
        priority: 'medium',
        notes: 'همراه داشتن آخرین آزمایش خون و نوار قلب قبلی',
      },
    ];

    // Sample Life Events
    const sampleEvents: LifeEvent[] = [
      {
        id: 'ev-1',
        title: 'تعویض ۴ حلقه لاستیک خودرو (کومهو)',
        category: 'car',
        dateJalali: '1405/04/28',
        cost: 16500000,
        description: 'خرید و تعویض لاستیک سایز ۱۸۵/۶۵/۱۴ همراه با بالانس درجا',
        tags: ['ماشین', 'تعمیرات', 'لاستیک'],
        topicId: 'topic-car',
      },
      {
        id: 'ev-2',
        title: 'سرویس دوره‌ای پکیج و رادیاتورهای خانه',
        category: 'home',
        dateJalali: '1405/03/25',
        cost: 1200000,
        description: 'اسیدشویی مبدل ثانویه و تست نشتی رادیاتورها توسط تکنسین بوتان',
        tags: ['خانه', 'تاسیسات'],
        topicId: 'topic-home',
      },
    ];

    // Sample Documents
    const sampleDocuments: DocumentItem[] = [
      {
        id: 'doc-file-1',
        title: 'کارت خودرو و بیمه‌نامه شخص ثالث',
        category: 'car',
        dateJalali: '1404/06/07',
        tags: ['ماشین', 'بیمه', 'سند'],
        fileUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=500&auto=format&fit=crop&q=60',
        fileType: 'image/png',
        fileSize: '1.2 MB',
        topicId: 'topic-car',
        notes: 'شماره بیمه‌نامه: ۱۲۳۴/۹۸۷۶۵۴۳۲',
      },
      {
        id: 'doc-file-2',
        title: 'گزارش آخرین آزمایش خون جامع',
        category: 'lab',
        dateJalali: '1405/04/20',
        tags: ['آزمایش', 'ویتامین D', 'چکاپ'],
        fileUrl: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=500&auto=format&fit=crop&q=60',
        fileType: 'application/pdf',
        fileSize: '850 KB',
        topicId: 'topic-health',
        notes: 'نسخه پی‌دی‌اف ارسالی آزمایشگاه مرکزی',
      },
      {
        id: 'doc-file-3',
        title: 'نسخه دارویی دکتر حسینی',
        category: 'prescription',
        dateJalali: '1405/03/10',
        tags: ['نسخه', 'قلب', 'لوزارتان'],
        fileUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=500&auto=format&fit=crop&q=60',
        fileType: 'image/jpeg',
        fileSize: '640 KB',
        topicId: 'topic-heart',
      },
    ];

    // Sample Journal
    const sampleJournal: JournalEntry[] = [
      {
        id: 'j-1',
        title: 'پیاده‌روی عصرگاهی و انرژی عالی',
        dateJalali: today,
        content: 'امروز ۴۵ دقیقه پیاده‌روی تند در پارک انجام دادم. بعد از اندازه‌گیری فشار خون ۱۲ روی ۸ بود و احساس سبکی و انرژی بسیار خوبی داشتم.',
        text: 'امروز ۴۵ دقیقه پیاده‌روی تند در پارک انجام دادم. بعد از اندازه‌گیری فشار خون ۱۲ روی ۸ بود و احساس سبکی و انرژی بسیار خوبی داشتم.',
        mood: 'good',
        energyLevel: 5,
        energy: 5,
        stress: 1,
        sleepHours: 7.5,
        tags: ['ورزش', 'انرژی', 'سلامت'],
        topicId: 'topic-health',
      },
    ];

    // Sample Important Dates
    const sampleImportantDates: ImportantDate[] = [
      {
        id: 'id-1',
        title: 'تولد سارا',
        type: 'birthday',
        dateJalali: '1370/08/12',
        isRecurringYearly: true,
        reminderDaysBefore: 3,
        notes: 'خرید هدیه و رزرو رستوران',
      },
      {
        id: 'id-2',
        title: 'تمدید بیمه شخص ثالث ۲۰۶',
        type: 'insurance_car',
        dateJalali: '1405/06/07',
        isRecurringYearly: true,
        reminderDaysBefore: 12,
        notes: 'بیمه ایران',
        topicId: 'topic-car',
      },
      {
        id: 'id-3',
        title: 'انقضای گواهینامه رانندگی',
        type: 'license',
        dateJalali: '1406/02/10',
        isRecurringYearly: false,
        reminderDaysBefore: 30,
        notes: 'مراجعه به پلیس +۱۰ برای تمدید ۱۰ ساله',
      },
    ];

    this.saveDoctors(sampleDoctors);
    this.saveMedications(sampleMedications);
    this.saveMeasurements(sampleMeasurements);
    this.saveVisits(sampleVisits);
    this.saveLabs(sampleLabs);
    this.saveReminders(sampleReminders);
    this.saveEvents(sampleEvents);
    this.saveDocuments(sampleDocuments);
    this.saveJournal(sampleJournal);
    this.saveImportantDates(sampleImportantDates);
    this.saveTopics(DEFAULT_TOPICS);
    this.saveProfile({ ...DEFAULT_PROFILE, hasSeenOnboarding: true });
    setItem(STORAGE_KEYS.IS_DEMO_SEEDED, true);
    setItem(STORAGE_KEYS.ONBOARDING_DONE, true);
  }

  // Clear all data completely
  static clearAllData(): void {
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
    this.saveTopics(DEFAULT_TOPICS);
    this.saveProfile({
      ...DEFAULT_PROFILE,
      name: '',
      fullName: '',
      allergies: [],
      medicalConditions: [],
      emergencyContactName: '',
      emergencyContactPhone: '',
      hasSeenOnboarding: true,
    });
  }

  // Full Export as JSON
  static exportFullBackup(): string {
    const backup = {
      version: 1,
      appName: 'دفتر من (MyLifeOS)',
      exportDate: new Date().toISOString(),
      exportDateJalali: getTodayJalali(),
      profile: this.getProfile(),
      measurements: this.getMeasurements(),
      doctors: this.getDoctors(),
      visits: this.getVisits(),
      labs: this.getLabs(),
      medications: this.getMedications(),
      medicationLogs: this.getMedicationLogs(),
      documents: this.getDocuments(),
      reminders: this.getReminders(),
      events: this.getEvents(),
      journal: this.getJournal(),
      topics: this.getTopics(),
      importantDates: this.getImportantDates(),
    };
    return JSON.stringify(backup, null, 2);
  }

  static exportBackupJson(): string {
    return this.exportFullBackup();
  }

  // Restore from JSON string
  static importBackup(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.profile) this.saveProfile(data.profile);
      if (Array.isArray(data.measurements)) this.saveMeasurements(data.measurements);
      if (Array.isArray(data.doctors)) this.saveDoctors(data.doctors);
      if (Array.isArray(data.visits)) this.saveVisits(data.visits);
      if (Array.isArray(data.labs)) this.saveLabs(data.labs);
      if (Array.isArray(data.medications)) this.saveMedications(data.medications);
      if (Array.isArray(data.medicationLogs)) this.saveMedicationLogs(data.medicationLogs);
      if (Array.isArray(data.documents)) this.saveDocuments(data.documents);
      if (Array.isArray(data.reminders)) this.saveReminders(data.reminders);
      if (Array.isArray(data.events)) this.saveEvents(data.events);
      if (Array.isArray(data.journal)) this.saveJournal(data.journal);
      if (Array.isArray(data.topics)) this.saveTopics(data.topics);
      if (Array.isArray(data.importantDates)) this.saveImportantDates(data.importantDates);
      return true;
    } catch (err) {
      console.error('Import backup failed:', err);
      return false;
    }
  }

  static importBackupJson(jsonString: string): boolean {
    return this.importBackup(jsonString);
  }
}

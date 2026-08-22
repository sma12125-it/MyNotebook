// Local Persistence and Data Service for دفتر من (MyLifeOS)
// With User Isolation (Per-Account Isolated Storage)
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
  PeriodData,
  PeriodConfig,
  PeriodCycle,
  PeriodDailyEntry,
  AppState,
} from '../types';
import { getTodayJalali, getCurrentTime, addDaysToJalali } from '../utils/jalali';
import { CloudSyncService } from './cloudSync';

const BASE_KEYS = {
  PROFILE: 'profile_v2',
  MEASUREMENTS: 'measurements_v2',
  DOCTORS: 'doctors_v2',
  VISITS: 'visits_v2',
  LABS: 'labs_v2',
  MEDICATIONS: 'medications_v2',
  MEDICATION_LOGS: 'medication_logs_v2',
  DOCUMENTS: 'documents_v2',
  REMINDERS: 'reminders_v2',
  EVENTS: 'events_v2',
  JOURNAL: 'journal_v2',
  TOPICS: 'topics_v2',
  IMPORTANT_DATES: 'important_dates_v2',
  PERIOD_DATA: 'period_data_v2',
  IS_DEMO_SEEDED: 'is_demo_seeded_v2',
  ONBOARDING_DONE: 'onboarding_done_v2',
};

const ACTIVE_USER_KEY = 'daftar_active_user_id_v2';
const REGISTERED_USERS_KEY = 'daftar_registered_users_v2';

export const DEFAULT_TOPICS: Topic[] = [
  { id: 'topic-health', title: 'سلامت عمومی', icon: 'Heart', color: 'rose', description: 'سوابق سلامت، علائم و چکاپ‌ها', isDefault: true },
  { id: 'topic-heart', title: 'سلامت قلب و عروق', icon: 'Activity', color: 'red', description: 'فشار خون، داروهای قلبی و ویزیت‌ها', isDefault: true },
  { id: 'topic-car', title: 'خودرو و وسایل نقلیه', icon: 'Car', color: 'blue', description: 'سرویس‌ها، بیمه، روغن و تعمیرات', isDefault: true },
  { id: 'topic-home', title: 'خانه و ساختمان', icon: 'Home', color: 'emerald', description: 'تاسیسات، قبوض، تعمیرات و اسباب', isDefault: true },
  { id: 'topic-finance', title: 'امور مالی و بیمه', icon: 'Coins', color: 'amber', description: 'بیمه تکمیلی، قراردادها و پس‌انداز', isDefault: true },
  { id: 'topic-growth', title: 'یادگیری و کار', icon: 'BookOpen', color: 'indigo', description: 'کتاب‌ها، دوره‌ها و تصمیمات مهم', isDefault: true },
];

export const DEFAULT_PERIOD_CONFIG: PeriodConfig = {
  averageCycleLength: 28,
  averagePeriodLength: 5,
  goal: 'track_cycle',
  remindersEnabled: true,
};

export const DEFAULT_PERIOD_DATA: PeriodData = {
  config: DEFAULT_PERIOD_CONFIG,
  cycles: [],
  dailyEntries: [],
};

export const DEFAULT_PROFILE: UserProfile = {
  id: 'user-default',
  name: 'کاربر گرامی',
  fullName: 'کاربر گرامی',
  birthDateJalali: '1370/01/01',
  birthYearJalali: '1370',
  gender: 'male',
  bloodGroup: 'O+',
  bloodType: 'O+',
  heightCm: 178,
  weightKg: 78,
  phoneNumber: '',
  emergencyContact: '',
  allergies: [],
  medicalConditions: [],
  notes: '',
  darkMode: false,
  hasSeenOnboarding: false,
};

export class StorageService {
  private static activeUserId: string | null = (typeof localStorage !== 'undefined' ? localStorage.getItem(ACTIVE_USER_KEY) : null);

  // Switch Active User & Namespace
  static getActiveUserId(): string | null {
    if (!this.activeUserId && typeof localStorage !== 'undefined') {
      this.activeUserId = localStorage.getItem(ACTIVE_USER_KEY);
    }
    return this.activeUserId;
  }

  static setActiveUserId(userId: string | null): void {
    this.activeUserId = userId;
    if (typeof localStorage !== 'undefined') {
      if (userId) {
        localStorage.setItem(ACTIVE_USER_KEY, userId);
      } else {
        localStorage.removeItem(ACTIVE_USER_KEY);
      }
    }
  }

  // Get Dynamic Scoped Storage Key
  private static getKey(baseKey: string): string {
    const uid = this.getActiveUserId();
    return uid ? `user_${uid}_${baseKey}` : `guest_${baseKey}`;
  }

  // Safe LocalStorage helpers with user isolation
  private static getItem<T>(baseKey: string, defaultValue: T): T {
    try {
      if (typeof localStorage === 'undefined') return defaultValue;
      const key = this.getKey(baseKey);
      const raw = localStorage.getItem(key);
      if (!raw) return defaultValue;
      return JSON.parse(raw) as T;
    } catch (err) {
      console.error(`Error reading ${baseKey} from storage:`, err);
      return defaultValue;
    }
  }

  private static isSyncSuppressed = false;

  private static setItem<T>(baseKey: string, value: T): void {
    try {
      if (typeof localStorage === 'undefined') return;
      const key = this.getKey(baseKey);
      localStorage.setItem(key, JSON.stringify(value));
      // Trigger online cloud sync immediately in background unless suppressed
      if (!this.isSyncSuppressed) {
        try {
          CloudSyncService.requestRealtimeSync(150);
        } catch {
          // ignore
        }
      }
    } catch (err) {
      console.error(`Error saving ${baseKey} to storage:`, err);
    }
  }

  // Registered Users management for multi-user accounts
  static getRegisteredUsers(): Array<{ id: string; name: string; email?: string; avatar?: string }> {
    try {
      if (typeof localStorage === 'undefined') return [];
      const raw = localStorage.getItem(REGISTERED_USERS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  static registerUser(user: { id: string; name: string; email?: string; avatar?: string }) {
    const users = this.getRegisteredUsers().filter((u) => u.id !== user.id);
    users.push(user);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));
    }
  }

  // Clear current user's local session
  static clearCurrentSession(): void {
    this.setActiveUserId(null);
  }

  // Onboarding
  static isOnboardingCompleted(): boolean {
    return this.getItem<boolean>(BASE_KEYS.ONBOARDING_DONE, false) || this.isDemoSeeded();
  }

  static setOnboardingCompleted(): void {
    this.setItem(BASE_KEYS.ONBOARDING_DONE, true);
  }

  // Profile
  static getProfile(): UserProfile {
    return this.getItem<UserProfile>(BASE_KEYS.PROFILE, DEFAULT_PROFILE);
  }
  static saveProfile(profile: UserProfile): void {
    this.setItem(BASE_KEYS.PROFILE, profile);
    if (profile.id || this.getActiveUserId()) {
      this.registerUser({
        id: this.getActiveUserId() || profile.id || 'default',
        name: profile.name || profile.fullName || 'کاربر',
      });
    }
  }

  // Measurements
  static getMeasurements(): Measurement[] {
    return this.getItem<Measurement[]>(BASE_KEYS.MEASUREMENTS, []);
  }
  static saveMeasurements(items: Measurement[]): void {
    this.setItem(BASE_KEYS.MEASUREMENTS, items);
  }
  static addMeasurement(item: Measurement): void {
    const items = this.getMeasurements();
    items.unshift(item);
    this.saveMeasurements(items);
  }

  // Doctors
  static getDoctors(): Doctor[] {
    return this.getItem<Doctor[]>(BASE_KEYS.DOCTORS, []);
  }
  static saveDoctors(items: Doctor[]): void {
    this.setItem(BASE_KEYS.DOCTORS, items);
  }

  // Medical Visits
  static getVisits(): MedicalVisit[] {
    return this.getItem<MedicalVisit[]>(BASE_KEYS.VISITS, []);
  }
  static saveVisits(items: MedicalVisit[]): void {
    this.setItem(BASE_KEYS.VISITS, items);
  }

  // Laboratory Tests
  static getLabs(): LaboratoryTest[] {
    return this.getItem<LaboratoryTest[]>(BASE_KEYS.LABS, []);
  }
  static saveLabs(items: LaboratoryTest[]): void {
    this.setItem(BASE_KEYS.LABS, items);
  }

  // Medications
  static getMedications(): Medication[] {
    return this.getItem<Medication[]>(BASE_KEYS.MEDICATIONS, []);
  }
  static saveMedications(items: Medication[]): void {
    this.setItem(BASE_KEYS.MEDICATIONS, items);
  }

  // Medication Logs
  static getMedicationLogs(): MedicationLog[] {
    return this.getItem<MedicationLog[]>(BASE_KEYS.MEDICATION_LOGS, []);
  }
  static saveMedicationLogs(items: MedicationLog[]): void {
    this.setItem(BASE_KEYS.MEDICATION_LOGS, items);
  }

  // Documents
  static getDocuments(): DocumentItem[] {
    return this.getItem<DocumentItem[]>(BASE_KEYS.DOCUMENTS, []);
  }
  static saveDocuments(items: DocumentItem[]): void {
    this.setItem(BASE_KEYS.DOCUMENTS, items);
  }

  // Reminders
  static getReminders(): Reminder[] {
    return this.getItem<Reminder[]>(BASE_KEYS.REMINDERS, []);
  }
  static saveReminders(items: Reminder[]): void {
    this.setItem(BASE_KEYS.REMINDERS, items);
  }

  // Life Events
  static getEvents(): LifeEvent[] {
    return this.getItem<LifeEvent[]>(BASE_KEYS.EVENTS, []);
  }
  static saveEvents(items: LifeEvent[]): void {
    this.setItem(BASE_KEYS.EVENTS, items);
  }

  // Journal
  static getJournal(): JournalEntry[] {
    return this.getItem<JournalEntry[]>(BASE_KEYS.JOURNAL, []);
  }
  static saveJournal(items: JournalEntry[]): void {
    this.setItem(BASE_KEYS.JOURNAL, items);
  }

  static getJournalEntries(): JournalEntry[] {
    return this.getJournal();
  }

  static saveJournalEntries(items: JournalEntry[]): void {
    this.saveJournal(items);
  }

  // Topics
  static getTopics(): Topic[] {
    return this.getItem<Topic[]>(BASE_KEYS.TOPICS, DEFAULT_TOPICS);
  }
  static saveTopics(items: Topic[]): void {
    this.setItem(BASE_KEYS.TOPICS, items);
  }

  // Important Dates
  static getImportantDates(): ImportantDate[] {
    return this.getItem<ImportantDate[]>(BASE_KEYS.IMPORTANT_DATES, []);
  }
  static saveImportantDates(items: ImportantDate[]): void {
    this.setItem(BASE_KEYS.IMPORTANT_DATES, items);
  }

  // Period & Menstrual Health Data
  static getPeriodData(): PeriodData {
    return this.getItem<PeriodData>(BASE_KEYS.PERIOD_DATA, DEFAULT_PERIOD_DATA);
  }

  static savePeriodData(data: PeriodData): void {
    this.setItem(BASE_KEYS.PERIOD_DATA, data);
  }

  static getPeriodConfig(): PeriodConfig {
    const data = this.getPeriodData();
    return data.config || DEFAULT_PERIOD_CONFIG;
  }

  static savePeriodConfig(config: PeriodConfig): void {
    const data = this.getPeriodData();
    data.config = config;
    this.savePeriodData(data);
  }

  static getPeriodCycles(): PeriodCycle[] {
    const data = this.getPeriodData();
    return data.cycles || [];
  }

  static savePeriodCycles(cycles: PeriodCycle[]): void {
    const data = this.getPeriodData();
    data.cycles = cycles;
    this.savePeriodData(data);
  }

  static getPeriodDailyEntries(): PeriodDailyEntry[] {
    const data = this.getPeriodData();
    return data.dailyEntries || [];
  }

  static savePeriodDailyEntries(entries: PeriodDailyEntry[]): void {
    const data = this.getPeriodData();
    data.dailyEntries = entries;
    this.savePeriodData(data);
  }

  static addOrUpdatePeriodDailyEntry(entry: PeriodDailyEntry): void {
    const data = this.getPeriodData();
    const existingIndex = data.dailyEntries.findIndex(
      (e) => e.id === entry.id || e.dateJalali === entry.dateJalali
    );
    if (existingIndex >= 0) {
      data.dailyEntries[existingIndex] = { ...data.dailyEntries[existingIndex], ...entry };
    } else {
      data.dailyEntries.unshift(entry);
    }
    this.savePeriodData(data);
  }

  static deletePeriodCycle(cycleId: string): void {
    const data = this.getPeriodData();
    data.cycles = data.cycles.filter((c) => c.id !== cycleId);
    this.savePeriodData(data);
  }

  static addOrUpdatePeriodCycle(cycle: PeriodCycle): void {
    const data = this.getPeriodData();
    const existingIndex = data.cycles.findIndex((c) => c.id === cycle.id);
    if (existingIndex >= 0) {
      data.cycles[existingIndex] = cycle;
    } else {
      data.cycles.unshift(cycle);
    }
    // Update config last period start date if newer
    if (cycle.startDateJalali) {
      if (!data.config.lastPeriodStartDateJalali || cycle.startDateJalali > data.config.lastPeriodStartDateJalali) {
        data.config.lastPeriodStartDateJalali = cycle.startDateJalali;
      }
    }
    this.savePeriodData(data);
  }

  // Unified App State
  static getAllState(): AppState {
    if (!this.isDemoSeeded() && !this.getActiveUserId()) {
      this.seedSampleData();
    }

    return {
      profile: this.getProfile(),
      vitals: this.getMeasurements(),
      measurements: this.getMeasurements(),
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
      periodData: this.getPeriodData(),
    };
  }

  static getState(): AppState {
    return this.getAllState();
  }

  static saveAllState(state: AppState, triggerSync = true): void {
    const prevSuppression = this.isSyncSuppressed;
    if (!triggerSync) {
      this.isSyncSuppressed = true;
    }
    try {
      if (state.profile) this.saveProfile(state.profile);
      if (state.vitals) this.saveMeasurements(state.vitals);
      else if ((state as any).measurements) this.saveMeasurements((state as any).measurements);
      if (state.doctors) this.saveDoctors(state.doctors);
      if (state.visits) this.saveVisits(state.visits);
      if (state.labs) this.saveLabs(state.labs);
      if (state.medications) this.saveMedications(state.medications);
      if (state.documents) this.saveDocuments(state.documents);
      if (state.reminders) this.saveReminders(state.reminders);
      if (state.events) this.saveEvents(state.events);
      if (state.journal) this.saveJournal(state.journal);
      if (state.topics) this.saveTopics(state.topics);
      if (state.importantDates) this.saveImportantDates(state.importantDates);
      if (state.periodData) this.savePeriodData(state.periodData);
    } finally {
      this.isSyncSuppressed = prevSuppression;
    }
  }

  // Backup Export & Import
  static exportBackupJson(): string {
    const fullState = this.getAllState();
    return JSON.stringify(fullState, null, 2);
  }

  static importBackupJson(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString) as AppState;
      if (parsed && typeof parsed === 'object') {
        this.saveAllState(parsed);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Import backup failed:', e);
      return false;
    }
  }

  static resetToSampleData(): void {
    this.clearAllData();
    this.seedSampleData();
  }

  // Demo seeding
  static isDemoSeeded(): boolean {
    return this.getItem<boolean>(BASE_KEYS.IS_DEMO_SEEDED, false);
  }

  static setDemoSeeded(): void {
    this.setItem(BASE_KEYS.IS_DEMO_SEEDED, true);
  }

  static seedSampleData(): void {
    const today = getTodayJalali();
    const time = getCurrentTime();

    // Default Profile
    this.saveProfile(DEFAULT_PROFILE);

    // Sample Measurements
    this.saveMeasurements([
      {
        id: 'm-w-1',
        type: 'water_intake',
        value: 500,
        unit: 'میلی‌لیتر',
        recordedAtJalali: today,
        recordedTime: '09:15',
        time: '09:15',
        timeJalali: '09:15',
        timestamp: Date.now() - 3600000 * 4,
        notes: '۲ لیوان آب صبحگاهی',
      },
      {
        id: 'm-w-2',
        type: 'water_intake',
        value: 250,
        unit: 'میلی‌لیتر',
        recordedAtJalali: today,
        recordedTime: '12:30',
        time: '12:30',
        timeJalali: '12:30',
        timestamp: Date.now() - 3600000 * 1,
        notes: '۱ لیوان آب همراه لیمو',
      },
      {
        id: 'm-bp-sys-1',
        type: 'blood_pressure_sys',
        value: 120,
        unit: 'mmHg',
        recordedAtJalali: today,
        recordedTime: '08:30',
        time: '08:30',
        timeJalali: '08:30',
        timestamp: Date.now() - 86400000 * 1,
        notes: 'فشار سیستولیک ناشتا',
      },
      {
        id: 'm-bp-dia-1',
        type: 'blood_pressure_dia',
        value: 80,
        unit: 'mmHg',
        recordedAtJalali: today,
        recordedTime: '08:30',
        time: '08:30',
        timeJalali: '08:30',
        timestamp: Date.now() - 86400000 * 1,
        notes: 'فشار دیاستولیک ناشتا',
      },
      {
        id: 'm-wt-1',
        type: 'weight',
        value: 78.5,
        unit: 'kg',
        recordedAtJalali: today,
        recordedTime: '08:00',
        time: '08:00',
        timeJalali: '08:00',
        timestamp: Date.now() - 86400000 * 2,
        notes: 'وزن ناشتا',
      },
    ]);

    // Sample Doctor
    this.saveDoctors([
      {
        id: 'doc-1',
        name: 'دکتر محمدرضا صادقی',
        specialty: 'متخصص قلب و عروق',
        phone: '02188776655',
        address: 'تهران، خیابان ولیعصر، نرسیده به توانیر، ساختمان پزشکان دی',
        notes: 'فوق تخصص آنژیوگرافی و فشار خون',
      },
    ]);

    // Sample Visit
    this.saveVisits([
      {
        id: 'v-1',
        doctorId: 'doc-1',
        doctorName: 'دکتر محمدرضا صادقی',
        specialty: 'متخصص قلب و عروق',
        dateJalali: today,
        time: '16:30',
        timeJalali: '16:30',
        reason: 'چکاپ دوره‌ای فشار خون',
        diagnosis: 'فشار خون کنترل شده با دوز مناسب',
        prescriptions: ['لوزارتان ۲۵ روزی یک عدد'],
        instructions: 'کاهش مصرف نمک و پیاده‌روی روزانه ۳۰ دقیقه',
        followUpDateJalali: '1403/09/20',
      },
    ]);

    // Sample Medication
    this.saveMedications([
      {
        id: 'med-1',
        name: 'لوزارتان (Losartan)',
        dosage: '25 میلی‌گرم',
        form: 'قرص',
        frequency: 'once_daily',
        timesOfDay: ['08:00'],
        instructions: 'همراه با صبحانه با یک لیوان پر آب مصرف شود',
        startDateJalali: today,
        isActive: true,
        remainingQuantity: 28,
        totalQuantity: 30,
        prescribedBy: 'دکتر محمدرضا صادقی',
      },
    ]);

    // Sample Reminder
    this.saveReminders([
      {
        id: 'rem-1',
        title: 'نوبت ویزیت چکاپ قلب با دکتر صادقی',
        category: 'doctor',
        dueDateJalali: today,
        dueTime: '17:00',
        time: '17:00',
        timeJalali: '17:00',
        isCompleted: false,
        priority: 'high',
      },
    ]);

    // Sample Event
    this.saveEvents([
      {
        id: 'ev-1',
        title: 'تعویض روغن موتور و فیلترهای خودرو',
        category: 'car',
        dateJalali: today,
        time: '11:00',
        timeJalali: '11:00',
        cost: 850000,
        description: 'روغن 10W40 کاسترول + فیلتر روغن و هوا در کیلومتر ۷۵۰۰۰',
      },
    ]);

    // Sample Journal
    this.saveJournal([
      {
        id: 'j-1',
        title: 'شروع برنامه سلامتی و تنظیم دقیق زندگی',
        content: 'امروز تصمیم گرفتم تمام اطلاعات پزشکی، مصرف آب روزانه، سرویس‌های ماشین و یادداشت‌های روزانه‌ام را در دفتر من متمرکز کنم.',
        mood: 5,
        dateJalali: today,
        time: time,
        timeJalali: time,
        tags: ['شروع', 'سلامتی', 'برنامه‌ریزی'],
      },
    ]);

    // Sample Period Data (For when profile is female)
    const prevPeriodStart = addDaysToJalali(today, -16);
    const prevPeriodEnd = addDaysToJalali(prevPeriodStart, 5);
    const olderPeriodStart = addDaysToJalali(prevPeriodStart, -28);
    const olderPeriodEnd = addDaysToJalali(olderPeriodStart, 5);

    this.savePeriodData({
      config: {
        averageCycleLength: 28,
        averagePeriodLength: 5,
        lastPeriodStartDateJalali: prevPeriodStart,
        goal: 'track_cycle',
        remindersEnabled: true,
      },
      cycles: [
        {
          id: 'cycle-prev-1',
          startDateJalali: prevPeriodStart,
          endDateJalali: prevPeriodEnd,
          periodLengthDays: 5,
          cycleLengthDays: 28,
          isOngoing: false,
          notes: 'دوره منظم با درد خفیف در روز اول',
        },
        {
          id: 'cycle-prev-2',
          startDateJalali: olderPeriodStart,
          endDateJalali: olderPeriodEnd,
          periodLengthDays: 5,
          cycleLengthDays: 28,
          isOngoing: false,
        },
      ],
      dailyEntries: [
        {
          id: 'p-entry-1',
          dateJalali: prevPeriodStart,
          timestamp: Date.now() - 16 * 86400000,
          flow: 'medium',
          painLevel: 'mild',
          painLocations: ['دل‌پیچه و زیر شکم', 'کمر و ستون فقرات'],
          moods: ['حساس و زودرنج', 'خستگی ذهنی'],
          physicalSymptoms: ['نفخ و ورم شکم', 'خستگی مفرط'],
          cervicalMucus: 'creamy',
          sexualActivity: 'none',
          medications: ['دمنوش زنجبیل و نبات', 'مفنامیک اسید'],
          energyLevel: 3,
          waterGlasses: 6,
          notes: 'روز اول پریود، استراحت و کمپرس گرم',
        },
        {
          id: 'p-entry-2',
          dateJalali: addDaysToJalali(prevPeriodStart, 1),
          timestamp: Date.now() - 15 * 86400000,
          flow: 'heavy',
          painLevel: 'moderate',
          painLocations: ['دل‌پیچه و زیر شکم'],
          moods: ['آرام و پایدار'],
          physicalSymptoms: ['نفخ و ورم شکم'],
          cervicalMucus: 'creamy',
          sexualActivity: 'none',
          medications: ['ژلوفن'],
          energyLevel: 3,
          waterGlasses: 8,
        },
        {
          id: 'p-entry-3',
          dateJalali: today,
          timestamp: Date.now(),
          flow: 'none',
          painLevel: 'none',
          painLocations: [],
          moods: ['شاد و پرانرژی', 'آرام و پایدار'],
          physicalSymptoms: [],
          cervicalMucus: 'egg_white',
          bbt: 36.6,
          sexualActivity: 'none',
          energyLevel: 5,
          waterGlasses: 7,
          notes: 'فاز لوتئال / تخمک‌گذاری، حس سبکی و انرژی بالا',
        },
      ],
    });

    this.setDemoSeeded();
  }

  // Custom Gemini API Key configuration
  static getCustomApiKey(): string {
    if (typeof localStorage === 'undefined') return '';
    return localStorage.getItem('mylifeos_custom_gemini_api_key') || '';
  }

  static setCustomApiKey(key: string): void {
    if (typeof localStorage === 'undefined') return;
    if (key.trim()) {
      localStorage.setItem('mylifeos_custom_gemini_api_key', key.trim());
    } else {
      localStorage.removeItem('mylifeos_custom_gemini_api_key');
    }
  }

  // Clear all data for active user
  static clearAllData(): void {
    if (typeof localStorage === 'undefined') return;
    const uid = this.getActiveUserId();
    const prefix = uid ? `user_${uid}_` : 'guest_';
    
    // Remove all keys starting with current user prefix
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  }
}

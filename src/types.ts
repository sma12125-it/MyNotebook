// TypeScript Interfaces for دفتر من (MyLifeOS)

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'نامشخص';

export interface UserProfile {
  id: string;
  name?: string;
  fullName?: string;
  birthDateJalali?: string; // e.g. "1368/04/15"
  birthYearJalali?: string;
  phoneNumber?: string;
  gender?: 'male' | 'female' | 'other' | 'unspecified';
  bloodGroup?: BloodGroup;
  bloodType?: string;
  heightCm?: number;
  height?: number;
  weightKg?: number;
  allergies?: string[];
  medicalConditions?: string[];
  emergencyContact?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  insuranceNumber?: string;
  notes?: string;
  darkMode?: boolean;
  hasSeenOnboarding?: boolean;
}

export type MeasurementType =
  | 'weight'
  | 'water_intake'
  | 'blood_pressure_sys'
  | 'blood_pressure_dia'
  | 'heart_rate'
  | 'blood_oxygen'
  | 'blood_glucose'
  | 'temperature'
  | 'sleep_hours'
  | 'mood'
  | 'stress_level'
  | 'energy_level';

export interface Measurement {
  id: string;
  type: MeasurementType;
  value: number;
  unit: string;
  recordedAtJalali: string; // "1405/05/26"
  recordedTime?: string; // "08:30"
  time?: string; // "08:30"
  timeJalali?: string; // "08:30"
  timestamp: number; // unix epoch
  notes?: string;
  topicId?: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  phone?: string;
  phoneNumber?: string;
  clinicName?: string;
  address?: string;
  notes?: string;
  rating?: number;
}

export interface MedicalVisit {
  id: string;
  doctorId?: string;
  doctorName: string;
  specialty?: string;
  dateJalali: string;
  time?: string; // "14:30"
  timeJalali?: string;
  reason: string;
  symptoms?: string;
  diagnosis?: string;
  doctorDiagnosis?: string;
  instructions?: string;
  prescriptions?: string[];
  prescribedMedications?: string[];
  followUpDateJalali?: string;
  nextFollowUpDateJalali?: string;
  documentIds?: string[];
  notes?: string;
  cost?: number;
  topicId?: string;
}

export interface LabResultItem {
  id?: string;
  parameter: string; // e.g. "Vitamin D", "Cholesterol", "FBS"
  value: number | string;
  unit: string; // e.g. "ng/mL", "mg/dL"
  referenceRange?: string; // e.g. "30 - 100"
  status: 'normal' | 'low' | 'high';
}

export interface LaboratoryTest {
  id: string;
  testName: string; // e.g. "چکاپ کامل خون"
  dateJalali: string;
  time?: string;
  timeJalali?: string;
  laboratoryName?: string;
  doctorId?: string;
  doctorName?: string;
  prescribedBy?: string;
  results?: LabResultItem[];
  summary?: string;
  followUpDateJalali?: string;
  documentIds?: string[];
  notes?: string;
  topicId?: string;
}

export type MedicationForm = 'قرص' | 'کپسول' | 'شربت' | 'آمپول' | 'قطره' | 'پماد' | 'اسپری' | 'مکمل';
export type MedicationFrequency = 'once_daily' | 'twice_daily' | 'thrice_daily' | 'four_times_daily' | 'every_other_day' | 'weekly' | 'as_needed' | string;

export interface Medication {
  id: string;
  name: string;
  dosage: string; // e.g. "50 میلی‌گرم"
  form: MedicationForm;
  reason?: string; // e.g. "تنظیم فشار خون"
  doctorId?: string;
  doctorName?: string;
  prescribedBy?: string;
  startDateJalali: string;
  endDateJalali?: string;
  time?: string;
  timeJalali?: string;
  frequency: MedicationFrequency;
  timesOfDay?: string[]; // ["08:00", "20:00"]
  timeSlotLabels?: ('صبح' | 'ظهر' | 'عصر' | 'شب')[];
  instructions?: string;
  totalQuantity?: number;
  remainingQuantity?: number;
  refillReminder?: boolean;
  notes?: string;
  topicId?: string;
  isActive: boolean;
}

export interface MedicationLog {
  id: string;
  medicationId: string;
  dateJalali: string;
  scheduledTime?: string;
  time?: string;
  timeJalali?: string;
  timeSlot: 'صبح' | 'ظهر' | 'عصر' | 'شب';
  status: 'taken' | 'skipped' | 'snoozed';
  takenAtTimestamp: number;
}

export type DocumentCategory =
  | 'medical'
  | 'prescription'
  | 'lab'
  | 'lab_result'
  | 'imaging'
  | 'scan'
  | 'car'
  | 'home'
  | 'insurance'
  | 'contract'
  | 'receipt'
  | 'identity'
  | 'general'
  | 'other';

export interface DocumentItem {
  id: string;
  title: string;
  category: DocumentCategory;
  dateJalali: string;
  time?: string;
  timeJalali?: string;
  tags?: string[];
  fileUrl?: string;
  fileData?: string; // base64 preview
  fileName?: string;
  fileType?: string;
  fileSize?: string;
  relatedDoctorId?: string;
  relatedVisitId?: string;
  relatedEventId?: string;
  topicId?: string;
  notes?: string;
}

export type ReminderCategory =
  | 'medication'
  | 'doctor'
  | 'lab'
  | 'insurance'
  | 'car'
  | 'home'
  | 'finance'
  | 'important_date'
  | 'general';

export type RecurrenceType = 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly';
export type ReminderRecurrence = RecurrenceType;
export type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent';

export interface Reminder {
  id: string;
  title: string;
  category: ReminderCategory;
  dueDateJalali: string;
  dueTime?: string;
  time?: string;
  timeJalali?: string;
  recurrence?: RecurrenceType;
  priority?: PriorityLevel;
  isCompleted: boolean;
  completedAt?: number;
  linkedEntityId?: string;
  linkedEntityType?: 'medication' | 'medical_visit' | 'lab_test' | 'car' | 'insurance';
  notes?: string;
}

export type LifeEventCategory =
  | 'car'
  | 'home'
  | 'finance'
  | 'travel'
  | 'work'
  | 'purchase'
  | 'repair'
  | 'contract'
  | 'personal'
  | 'health'
  | 'other';

export interface LifeEvent {
  id: string;
  title: string;
  category: LifeEventCategory;
  dateJalali: string;
  time?: string;
  timeJalali?: string;
  cost?: number;
  description?: string;
  documentIds?: string[];
  reminderId?: string;
  tags?: string[];
  topicId?: string;
}

export type MoodType = 'great' | 'good' | 'neutral' | 'tired' | 'bad';

export interface JournalEntry {
  id: string;
  title?: string;
  dateJalali: string;
  time?: string;
  timeJalali?: string;
  content?: string;
  text?: string;
  mood?: MoodType | number;
  energyLevel?: number;
  energy?: number;
  stress?: number;
  sleepHours?: number;
  tags?: string[];
  topicId?: string;
}

export interface Topic {
  id: string;
  title: string;
  icon: string;
  color: string;
  description?: string;
  isDefault?: boolean;
}

export type ImportantDateType =
  | 'birthday'
  | 'anniversary'
  | 'insurance_car'
  | 'insurance_health'
  | 'passport'
  | 'license'
  | 'inspection'
  | 'contract'
  | 'custom';

export interface ImportantDate {
  id: string;
  title: string;
  type: ImportantDateType;
  dateJalali: string;
  isRecurringYearly: boolean;
  reminderDaysBefore: number;
  notes?: string;
  topicId?: string;
}

// Menstrual & Period Health Tracking Interfaces
export type PeriodFlowLevel = 'none' | 'spotting' | 'light' | 'medium' | 'heavy' | 'very_heavy';
export type PeriodPainLevel = 'none' | 'mild' | 'moderate' | 'severe' | 'unbearable';
export type CervicalMucusType = 'dry' | 'sticky' | 'creamy' | 'egg_white' | 'watery' | 'unspecified';
export type SexualActivityType = 'none' | 'protected' | 'unprotected' | 'high_libido' | 'low_libido';

export interface PeriodDailyEntry {
  id: string;
  dateJalali: string; // e.g. "1405/05/20"
  timestamp: number;
  flow: PeriodFlowLevel;
  painLevel: PeriodPainLevel;
  painLocations: string[]; // e.g. ['دل‌پیچه و شکم', 'کمر', 'سردرد']
  moods: string[]; // e.g. ['آرام', 'حساس و زودرنج', 'اضطراب', 'بی‌حوصله']
  physicalSymptoms: string[]; // e.g. ['نفخ', 'حساسیت سینه‌ها', 'آکنه', 'خستگی']
  cervicalMucus?: CervicalMucusType;
  bbt?: number; // Basal Body Temp in Celsius, e.g. 36.6
  sexualActivity?: SexualActivityType;
  medications?: string[]; // e.g. ['مفنامیک اسید', 'ژلوفن']
  energyLevel?: number; // 1 to 5
  waterGlasses?: number;
  notes?: string;
}

export interface PeriodCycle {
  id: string;
  startDateJalali: string; // "1405/05/20"
  endDateJalali?: string; // "1405/05/26"
  periodLengthDays: number; // e.g. 5
  cycleLengthDays?: number; // e.g. 28
  isOngoing: boolean;
  notes?: string;
}

export interface PeriodConfig {
  averageCycleLength: number; // default 28 (days 21-45)
  averagePeriodLength: number; // default 5 (days 2-10)
  lastPeriodStartDateJalali?: string;
  goal?: 'track_cycle' | 'trying_to_conceive' | 'prevent_pregnancy' | 'general_health';
  remindersEnabled?: boolean;
  notes?: string;
}

export interface PeriodData {
  config: PeriodConfig;
  cycles: PeriodCycle[];
  dailyEntries: PeriodDailyEntry[];
}

export type TabType =
  | 'home'
  | 'health'
  | 'medications'
  | 'doctors'
  | 'labs'
  | 'documents'
  | 'reminders'
  | 'events'
  | 'journal'
  | 'timeline'
  | 'period'
  | 'profile'
  | 'settings';

export type ActiveTab = TabType;

export interface AppState {
  profile: UserProfile;
  vitals: Measurement[];
  measurements?: Measurement[];
  doctors: Doctor[];
  visits: MedicalVisit[];
  labs: LaboratoryTest[];
  medications: Medication[];
  documents: DocumentItem[];
  reminders: Reminder[];
  events: LifeEvent[];
  journal: JournalEntry[];
  topics: Topic[];
  importantDates: ImportantDate[];
  periodData?: PeriodData;
}

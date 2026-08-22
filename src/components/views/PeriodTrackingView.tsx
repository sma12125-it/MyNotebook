import React, { useState, useMemo } from 'react';
import {
  Heart,
  Calendar,
  Sparkles,
  Droplet,
  Activity,
  Plus,
  Clock,
  Settings,
  Flame,
  Moon,
  Smile,
  Shield,
  Info,
  TrendingUp,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Pill,
  Sun,
  Coffee,
  Check,
  Zap,
} from 'lucide-react';
import {
  PeriodData,
  PeriodCycle,
  PeriodDailyEntry,
  PeriodFlowLevel,
  PeriodPainLevel,
  CervicalMucusType,
  SexualActivityType,
  UserProfile,
  AppState,
} from '../../types';
import { StorageService } from '../../services/storage';
import {
  getTodayJalali,
  addDaysToJalali,
  getDaysBetweenJalali,
  formatJalaliReadable,
  toFaDigits,
} from '../../utils/jalali';

interface PeriodTrackingViewProps {
  appState?: AppState;
  periodData?: PeriodData;
  userProfile?: UserProfile;
  onRefreshData?: () => void;
  onNavigateToTab?: (tab: any) => void;
  onOpenQuickCapture?: () => void;
}

// Symptom Options Constants
const PAIN_LOCATIONS = [
  'دل‌پیچه و زیر شکم',
  'کمر و ستون فقرات',
  'سردرد و میگرن قاعدگی',
  'لگن و ران‌ها',
  'حساسیت و درد سینه‌ها',
  'مفاصل و عضلات',
];

const MOODS_LIST = [
  'آرام و پایدار',
  'شاد و باانرژی',
  'حساس و زودرنج',
  'اضطراب و دلشوره',
  'بی‌حوصله و غمگین',
  'عصبی و پرخاشگر',
  'نوسان شدید خلق (PMS)',
  'خستگی ذهنی',
];

const PHYSICAL_SYMPTOMS_LIST = [
  'نفخ و باد شکم',
  'حساسیت و تورم سینه‌ها',
  'آکنه و جوش صورت',
  'خستگی مفرط',
  'هوس شیرینی و خوراکی',
  'ورم پاها و احتباس آب',
  'سرگیجه و ضعف',
  'بی‌خوابی / خواب‌آلودگی',
  'تغییرات گوارشی (اسهال/یبوست)',
  'گرگرفتگی و تعریق',
];

const COMMON_MEDICATIONS = [
  'مفنامیک اسید',
  'ژلوفن / ایبوپروفن',
  'ناپروکسن',
  'هیوسین',
  'دمنوش زنجبیل و نبات',
  'قرص آهن / ففول',
  'دوفاستون / ضدبارداری',
  'منیزیم + ویتامین B6',
];

export const PeriodTrackingView: React.FC<PeriodTrackingViewProps> = ({
  appState,
  periodData: propPeriodData,
  userProfile: propUserProfile,
  onRefreshData,
  onNavigateToTab,
  onOpenQuickCapture,
}) => {
  const periodData = propPeriodData || appState?.periodData || StorageService.getPeriodData();
  const config = periodData?.config || {
    averageCycleLength: 28,
    averagePeriodLength: 5,
    goal: 'track_cycle',
    remindersEnabled: true,
  };
  const cycles = periodData?.cycles || [];
  const dailyEntries = periodData?.dailyEntries || [];

  const today = getTodayJalali();
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'log_today' | 'history' | 'insights' | 'settings'>('overview');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Cycle Modal / Form State
  const [isAddCycleModalOpen, setIsAddCycleModalOpen] = useState(false);
  const [newCycleStartDate, setNewCycleStartDate] = useState(today);
  const [newCyclePeriodDays, setNewCyclePeriodDays] = useState(config.averagePeriodLength || 5);
  const [newCycleNotes, setNewCycleNotes] = useState('');

  // Daily Log Form State
  const [selectedLogDate, setSelectedLogDate] = useState(today);
  const existingLogForDate = useMemo(() => {
    return dailyEntries.find((e) => e.dateJalali === selectedLogDate);
  }, [dailyEntries, selectedLogDate]);

  const [flow, setFlow] = useState<PeriodFlowLevel>('none');
  const [painLevel, setPainLevel] = useState<PeriodPainLevel>('none');
  const [selectedPainLocations, setSelectedPainLocations] = useState<string[]>([]);
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [cervicalMucus, setCervicalMucus] = useState<CervicalMucusType>('unspecified');
  const [bbt, setBbt] = useState<string>('');
  const [sexualActivity, setSexualActivity] = useState<SexualActivityType>('none');
  const [selectedMeds, setSelectedMeds] = useState<string[]>([]);
  const [energyLevel, setEnergyLevel] = useState<number>(3);
  const [waterGlasses, setWaterGlasses] = useState<number>(6);
  const [dailyNotes, setDailyNotes] = useState<string>('');

  // Sync form when selectedLogDate changes
  React.useEffect(() => {
    if (existingLogForDate) {
      setFlow(existingLogForDate.flow || 'none');
      setPainLevel(existingLogForDate.painLevel || 'none');
      setSelectedPainLocations(existingLogForDate.painLocations || []);
      setSelectedMoods(existingLogForDate.moods || []);
      setSelectedSymptoms(existingLogForDate.physicalSymptoms || []);
      setCervicalMucus(existingLogForDate.cervicalMucus || 'unspecified');
      setBbt(existingLogForDate.bbt ? existingLogForDate.bbt.toString() : '');
      setSexualActivity(existingLogForDate.sexualActivity || 'none');
      setSelectedMeds(existingLogForDate.medications || []);
      setEnergyLevel(existingLogForDate.energyLevel || 3);
      setWaterGlasses(existingLogForDate.waterGlasses || 6);
      setDailyNotes(existingLogForDate.notes || '');
    } else {
      setFlow('none');
      setPainLevel('none');
      setSelectedPainLocations([]);
      setSelectedMoods([]);
      setSelectedSymptoms([]);
      setCervicalMucus('unspecified');
      setBbt('');
      setSexualActivity('none');
      setSelectedMeds([]);
      setEnergyLevel(3);
      setWaterGlasses(6);
      setDailyNotes('');
    }
  }, [existingLogForDate, selectedLogDate]);

  // Config settings form
  const [cfgAvgCycle, setCfgAvgCycle] = useState(config.averageCycleLength || 28);
  const [cfgAvgPeriod, setCfgAvgPeriod] = useState(config.averagePeriodLength || 5);
  const [cfgGoal, setCfgGoal] = useState(config.goal || 'track_cycle');
  const [cfgReminders, setCfgReminders] = useState(config.remindersEnabled !== false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Cycle Calculations
  const latestCycle = useMemo(() => {
    if (!cycles || cycles.length === 0) return null;
    return [...cycles].sort((a, b) => b.startDateJalali.localeCompare(a.startDateJalali))[0];
  }, [cycles]);

  const lastPeriodStart = latestCycle?.startDateJalali || config.lastPeriodStartDateJalali;

  const cycleStats = useMemo(() => {
    if (!lastPeriodStart) {
      return {
        cycleDay: 1,
        daysToNextPeriod: config.averageCycleLength || 28,
        nextPeriodDate: addDaysToJalali(today, config.averageCycleLength || 28),
        ovulationDate: addDaysToJalali(today, 14),
        phase: 'follicular',
        phaseName: 'فاز فولیکولار',
        phaseDescription: 'افزایش سطح انرژی و استروژن',
        fertilityChance: 'متوسط',
        isBleedingNow: false,
      };
    }

    const daysSinceStart = getDaysBetweenJalali(lastPeriodStart, today);
    const cycleLen = config.averageCycleLength || 28;
    const periodLen = latestCycle?.periodLengthDays || config.averagePeriodLength || 5;

    const cycleDay = (daysSinceStart % cycleLen) + 1;
    const daysToNext = cycleLen - (daysSinceStart % cycleLen);
    const nextPeriodDate = addDaysToJalali(lastPeriodStart, Math.floor(daysSinceStart / cycleLen + 1) * cycleLen);
    
    // Ovulation is roughly 14 days before next period
    const ovulationDayInCycle = Math.max(10, cycleLen - 14);
    const ovulationDate = addDaysToJalali(lastPeriodStart, Math.floor(daysSinceStart / cycleLen) * cycleLen + ovulationDayInCycle - 1);

    let phase = 'follicular';
    let phaseName = 'فاز فولیکولار';
    let phaseDescription = 'افزایش تدریجی انرژی، بهبود خلق و بازسازی دیواره رحم';
    let fertilityChance = 'کم';
    let isBleedingNow = false;

    if (cycleDay <= periodLen) {
      phase = 'menstrual';
      phaseName = 'فاز قاعدگی (پریود)';
      phaseDescription = 'خونریزی و ریزش اندومتر، نیاز به استراحت و گرم نگه‌داشتن شکم';
      fertilityChance = 'خیلی کم';
      isBleedingNow = true;
    } else if (cycleDay >= ovulationDayInCycle - 3 && cycleDay <= ovulationDayInCycle + 2) {
      phase = 'ovulation';
      phaseName = 'فاز تخمک‌گذاری (پنجره باروری)';
      phaseDescription = 'رهاسازی تخمک، اوج احتمال باروری و ترشحات کشسان';
      fertilityChance = cycleDay === ovulationDayInCycle ? 'اوج باروری (بسیار بالا)' : 'بالا';
    } else if (cycleDay > ovulationDayInCycle + 2) {
      phase = 'luteal';
      phaseName = 'فاز لوتئال (پیش از قاعدگی / PMS)';
      phaseDescription = 'ترشح پروژسترون، احتمال تغییرات خلقی و نفخ، نیاز به منیزیم و آرامش';
      fertilityChance = 'کم';
    }

    return {
      cycleDay,
      daysToNextPeriod: daysToNext,
      nextPeriodDate,
      ovulationDate,
      phase,
      phaseName,
      phaseDescription,
      fertilityChance,
      isBleedingNow,
    };
  }, [lastPeriodStart, config, latestCycle, today]);

  // Handle Save Daily Log
  const handleSaveDailyLog = (e: React.FormEvent) => {
    e.preventDefault();
    const entry: PeriodDailyEntry = {
      id: existingLogForDate?.id || `p-entry-${Date.now()}`,
      dateJalali: selectedLogDate,
      timestamp: Date.now(),
      flow,
      painLevel,
      painLocations: selectedPainLocations,
      moods: selectedMoods,
      physicalSymptoms: selectedSymptoms,
      cervicalMucus,
      bbt: bbt ? parseFloat(bbt) : undefined,
      sexualActivity,
      medications: selectedMeds,
      energyLevel,
      waterGlasses,
      notes: dailyNotes.trim() || undefined,
    };

    StorageService.addOrUpdatePeriodDailyEntry(entry);
    showToast(`علائم و وضعیت روز ${selectedLogDate} با موفقیت ثبت شد.`);
    onRefreshData();
    setActiveSubTab('overview');
  };

  // Handle Save New Cycle
  const handleAddCycle = (e: React.FormEvent) => {
    e.preventDefault();
    const newCycle: PeriodCycle = {
      id: `cycle-${Date.now()}`,
      startDateJalali: newCycleStartDate,
      endDateJalali: addDaysToJalali(newCycleStartDate, newCyclePeriodDays - 1),
      periodLengthDays: newCyclePeriodDays,
      cycleLengthDays: config.averageCycleLength || 28,
      isOngoing: false,
      notes: newCycleNotes.trim() || undefined,
    };

    StorageService.addOrUpdatePeriodCycle(newCycle);
    setIsAddCycleModalOpen(false);
    showToast('دوره قاعدگی جدید با موفقیت ثبت شد.');
    onRefreshData();
  };

  // Handle Save Settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedCfg = {
      ...config,
      averageCycleLength: Number(cfgAvgCycle) || 28,
      averagePeriodLength: Number(cfgAvgPeriod) || 5,
      goal: cfgGoal as any,
      remindersEnabled: cfgReminders,
    };
    StorageService.savePeriodConfig(updatedCfg);
    showToast('تنظیمات چرخه با موفقیت به‌روزرسانی شد.');
    onRefreshData();
    setActiveSubTab('overview');
  };

  // Toggle helper for multi-select chips
  const toggleItem = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
    if (list.includes(item)) {
      setList(list.filter((x) => x !== item));
    } else {
      setList([...list, item]);
    }
  };

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-foreground flex items-center gap-2">
            <span>رهگیری چرخه قاعدگی و سلامت بانوان</span>
            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-500/20">
              ویژه
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            رصد هوشمند دوره، پیش‌بینی تخمک‌گذاری، ثبت علائم فیزیکی، حالات روحی و نظم ماهانه
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('log_today')}
            className="px-4 py-2 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-rose-500/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>ثبت وضعیت امروز</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddCycleModalOpen(true)}
            className="px-3.5 py-2 rounded-2xl border border-border bg-card text-foreground hover:bg-muted font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Droplet className="w-4 h-4 text-rose-500" />
            <span>ثبت دوره جدید</span>
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3.5 bg-rose-600 text-white rounded-2xl flex items-center gap-2.5 text-xs sm:text-sm font-bold shadow-lg animate-in fade-in sticky top-20 z-40">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-card border border-border overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveSubTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'overview'
              ? 'bg-rose-500 text-white shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
          }`}
        >
          چرخه و وضعیت جاری
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('log_today')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'log_today'
              ? 'bg-rose-500 text-white shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
          }`}
        >
          ثبت علائم و احوال روزانه
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('history')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'history'
              ? 'bg-rose-500 text-white shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
          }`}
        >
          تقویم و سوابق دوره‌ها ({toFaDigits(cycles.length)})
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('insights')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'insights'
              ? 'bg-rose-500 text-white shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
          }`}
        >
          تحلیل، نظم و راهنمای فازها
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('settings')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'settings'
              ? 'bg-rose-500 text-white shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
          }`}
        >
          تنظیمات طول چرخه
        </button>
      </div>

      {/* SUB-TAB 1: OVERVIEW */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Main Cycle Radar / Hero Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-rose-500/15 via-rose-500/5 to-purple-500/10 border border-rose-500/20 shadow-xs relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Left/Center Visual Circle */}
              <div className="flex flex-col items-center text-center">
                <div className="relative w-40 h-40 sm:w-44 sm:h-44 rounded-full border-8 border-rose-500/20 flex flex-col items-center justify-center bg-card shadow-inner">
                  <div className="absolute inset-0 rounded-full border-8 border-rose-500 border-t-transparent animate-spin-slow opacity-60"></div>
                  
                  <span className="text-[11px] font-bold text-muted-foreground">روز چرخه</span>
                  <span className="text-3xl sm:text-4xl font-black text-foreground font-mono my-0.5">
                    {toFaDigits(cycleStats.cycleDay)}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-medium">
                    از {toFaDigits(config.averageCycleLength || 28)} روز
                  </span>

                  <div className="mt-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-extrabold border border-rose-500/20">
                    {cycleStats.phaseName}
                  </div>
                </div>

                <p className="text-xs text-muted-foreground mt-3 max-w-xs leading-relaxed">
                  {cycleStats.phaseDescription}
                </p>
              </div>

              {/* Cycle Key Indicators */}
              <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-2xl bg-card/80 backdrop-blur-sm border border-border">
                  <div className="flex items-center gap-2 text-rose-500 mb-1.5">
                    <Droplet className="w-4 h-4" />
                    <span className="text-xs font-bold">موعد پریود بعدی</span>
                  </div>
                  <div className="text-lg font-black text-foreground">
                    {cycleStats.daysToNextPeriod === 0
                      ? 'امروز'
                      : `${toFaDigits(cycleStats.daysToNextPeriod)} روز دیگر`}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 font-mono">
                    تاریخ تخمینی: {formatJalaliReadable(cycleStats.nextPeriodDate)}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-card/80 backdrop-blur-sm border border-border">
                  <div className="flex items-center gap-2 text-purple-500 mb-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-xs font-bold">تخمک‌گذاری و شانس بارداری</span>
                  </div>
                  <div className="text-lg font-black text-foreground">
                    {cycleStats.fertilityChance}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 font-mono">
                    روز تخمک‌گذاری: {formatJalaliReadable(cycleStats.ovulationDate)}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-card/80 backdrop-blur-sm border border-border sm:col-span-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-foreground block">
                      وضعیت امروز شما ({formatJalaliReadable(today)})
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {existingLogForDate
                        ? `ثبت شده (خونریزی: ${existingLogForDate.flow === 'none' ? 'ندارد' : existingLogForDate.flow}، درد: ${existingLogForDate.painLevel})`
                        : 'هنوز علائم و احوال امروز ثبت نشده است'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveSubTab('log_today')}
                    className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-xs border border-rose-500/20 transition-all cursor-pointer"
                  >
                    {existingLogForDate ? 'ویرایش وضعیت امروز' : 'ثبت علائم امروز'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Today's Logged Summary or Quick Tips */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Phase Guidance & Care */}
            <div className="p-5 rounded-3xl bg-card border border-border shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-foreground font-bold text-sm">
                <Sun className="w-4 h-4 text-amber-500" />
                <span>توصیه مراقبتی و تغذیه‌ای مناسب این فاز</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {cycleStats.phase === 'menstrual' &&
                  'مصرف دمنوش‌های گرم (زنجبیل، بابونه)، مکمل آهن، سبزیجات تیره، پرهیز از کافئین بیش از حد و استفاده از کیسه آب گرم برای کاهش انقباضات رحمی توصیه می‌شود.'}
                {cycleStats.phase === 'follicular' &&
                  'سطح هورمون استروژن در حال افزایش است. زمان بسیار مناسبی برای ورزش، یادگیری کارهای جدید، پیاده‌روی پرسرعت و مصرف پروتئین‌های سبک و جوانه‌ها است.'}
                {cycleStats.phase === 'ovulation' &&
                  'اوج انرژی و نشاط زنانه. نوشیدن آب فراوان، مصرف آنتی‌اکسیدان‌ها، سبزیجات برگ‌سبز و اسید فولیک بسیار موثر است.'}
                {cycleStats.phase === 'luteal' &&
                  'برای کنترل علائم سندروم پیش از قاعدگی (PMS)، مصرف نمک و قندهای تصفیه‌شده را کاهش داده و منابع غنی از منیزیم (بادام، اسفناج، شکلات تلخ) مصرف کنید.'}
              </p>
            </div>

            {/* Today's Logged Symptoms */}
            <div className="p-5 rounded-3xl bg-card border border-border shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-foreground font-bold text-sm">
                  <Activity className="w-4 h-4 text-rose-500" />
                  <span>علائم و نشانه‌های ثبت‌شده امروز</span>
                </div>
                <span className="text-[11px] text-muted-foreground font-mono">{today}</span>
              </div>

              {existingLogForDate ? (
                <div className="space-y-2 text-xs">
                  <div className="flex flex-wrap gap-1.5">
                    {existingLogForDate.flow !== 'none' && (
                      <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold border border-rose-500/20">
                        خونریزی: {existingLogForDate.flow}
                      </span>
                    )}
                    {existingLogForDate.painLevel !== 'none' && (
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/20">
                        درد: {existingLogForDate.painLevel}
                      </span>
                    )}
                    {existingLogForDate.moods?.map((m) => (
                      <span key={m} className="px-2 py-0.5 rounded-lg bg-muted text-foreground">
                        {m}
                      </span>
                    ))}
                    {existingLogForDate.physicalSymptoms?.map((s) => (
                      <span key={s} className="px-2 py-0.5 rounded-lg bg-muted text-foreground">
                        {s}
                      </span>
                    ))}
                  </div>
                  {existingLogForDate.notes && (
                    <p className="text-muted-foreground italic text-[11px] pt-1">
                      «{existingLogForDate.notes}»
                    </p>
                  )}
                </div>
              ) : (
                <div className="py-4 text-center text-muted-foreground text-xs space-y-2">
                  <p>امروز هنوز هیچ علامتی ثبت نشده است.</p>
                  <button
                    type="button"
                    onClick={() => setActiveSubTab('log_today')}
                    className="text-rose-600 dark:text-rose-400 font-bold hover:underline cursor-pointer"
                  >
                    + افزودن حس و حال امروز
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: LOG TODAY / DAILY SYMPTOMS FORM */}
      {activeSubTab === 'log_today' && (
        <form onSubmit={handleSaveDailyLog} className="p-5 sm:p-7 rounded-3xl bg-card border border-border shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-foreground">
                ثبت وضعیت و علائم روزانه
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                ثبت شدت خونریزی، درد، حالات روحی، علائم جسمی، ترشحات و داروها
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-muted-foreground">تاریخ ثبت:</label>
              <input
                type="text"
                value={selectedLogDate}
                onChange={(e) => setSelectedLogDate(e.target.value)}
                placeholder="1405/05/20"
                className="p-2 rounded-xl border border-border bg-background text-foreground font-mono text-center text-xs font-bold focus:border-rose-500 focus:outline-none"
              />
            </div>
          </div>

          {/* 1. Flow Intensity (شدت خونریزی) */}
          <div className="space-y-2.5">
            <label className="block text-xs sm:text-sm font-bold text-foreground flex items-center gap-2">
              <Droplet className="w-4 h-4 text-rose-500" />
              <span>شدت خونریزی (Flow)</span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {[
                { id: 'none', label: 'بدون خونریزی' },
                { id: 'spotting', label: 'لکه‌بینی' },
                { id: 'light', label: 'خفیف' },
                { id: 'medium', label: 'متوسط' },
                { id: 'heavy', label: 'شدید' },
                { id: 'very_heavy', label: 'خیلی شدید / لخته' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFlow(item.id as any)}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    flow === item.id
                      ? 'bg-rose-500 text-white border-rose-500 shadow-xs ring-2 ring-rose-500/20'
                      : 'bg-background border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Pain Intensity & Locations (میزان و محل درد) */}
          <div className="space-y-2.5">
            <label className="block text-xs sm:text-sm font-bold text-foreground flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-500" />
              <span>میزان درد و گرفتگی (Cramps & Pain)</span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {[
                { id: 'none', label: 'بدون درد' },
                { id: 'mild', label: 'خفیف' },
                { id: 'moderate', label: 'متوسط' },
                { id: 'severe', label: 'شدید' },
                { id: 'unbearable', label: 'طاقت‌فرسا / ناتوان‌کننده' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPainLevel(item.id as any)}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    painLevel === item.id
                      ? 'bg-amber-500 text-white border-amber-500 shadow-xs ring-2 ring-amber-500/20'
                      : 'bg-background border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {painLevel !== 'none' && (
              <div className="pt-2">
                <span className="text-xs text-muted-foreground mb-1.5 block font-medium">محل‌های احساس درد:</span>
                <div className="flex flex-wrap gap-1.5">
                  {PAIN_LOCATIONS.map((loc) => {
                    const isSelected = selectedPainLocations.includes(loc);
                    return (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => toggleItem(selectedPainLocations, setSelectedPainLocations, loc)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40'
                            : 'bg-background border-border text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {isSelected && '✓ '}
                        {loc}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 3. Moods & Mental States (خلق‌وخو و احوال روانی) */}
          <div className="space-y-2.5">
            <label className="block text-xs sm:text-sm font-bold text-foreground flex items-center gap-2">
              <Smile className="w-4 h-4 text-emerald-500" />
              <span>خلق‌وخو و حالات روحی (Mood)</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {MOODS_LIST.map((m) => {
                const isSelected = selectedMoods.includes(m);
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => toggleItem(selectedMoods, setSelectedMoods, m)}
                    className={`px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                        : 'bg-background border-border text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {isSelected && '✓ '}
                    {m}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Physical Symptoms (علائم جسمی) */}
          <div className="space-y-2.5">
            <label className="block text-xs sm:text-sm font-bold text-foreground flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-500" />
              <span>علائم و نشانه‌های جسمی (Physical Symptoms)</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PHYSICAL_SYMPTOMS_LIST.map((sym) => {
                const isSelected = selectedSymptoms.includes(sym);
                return (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => toggleItem(selectedSymptoms, setSelectedSymptoms, sym)}
                    className={`px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                        : 'bg-background border-border text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {isSelected && '✓ '}
                    {sym}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Cervical Mucus & BBT (ترشحات و دمای پایه بدن) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs sm:text-sm font-bold text-foreground mb-1.5">
                نوع ترشحات دهانه رحم (Cervical Mucus)
              </label>
              <select
                value={cervicalMucus}
                onChange={(e) => setCervicalMucus(e.target.value as any)}
                className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-bold focus:border-rose-500 focus:outline-none cursor-pointer"
              >
                <option value="unspecified">نامشخص / ثبت نشده</option>
                <option value="dry">خشک (غیربارور)</option>
                <option value="sticky">چسبناک و کدر</option>
                <option value="creamy">شیری و کرمی</option>
                <option value="egg_white">کشسان مانند سفیده تخم‌مرغ (اوج باروری)</option>
                <option value="watery">آبکی و رقیق</option>
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-foreground mb-1.5">
                دمای پایه بدن (BBT به سانتی‌گراد)
              </label>
              <input
                type="number"
                step="0.05"
                value={bbt}
                onChange={(e) => setBbt(e.target.value)}
                placeholder="مثال: 36.65"
                className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground font-mono text-center text-xs font-bold focus:border-rose-500 focus:outline-none"
              />
            </div>
          </div>

          {/* 6. Sexual Activity & Protection */}
          <div className="space-y-2">
            <label className="block text-xs sm:text-sm font-bold text-foreground">
              فعالیت جنسی و پیشگیری
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'none', label: 'بدون رابطه' },
                { id: 'protected', label: 'رابطه با پیشگیری (کاندوم/قرص)' },
                { id: 'unprotected', label: 'رابطه محافظت‌نشده' },
                { id: 'high_libido', label: 'میل جنسی بالا' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSexualActivity(item.id as any)}
                  className={`p-2 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                    sexualActivity === item.id
                      ? 'bg-rose-500/15 border-rose-500 text-rose-600 dark:text-rose-400 font-bold'
                      : 'bg-background border-border text-muted-foreground'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* 7. Pain Relief Medications */}
          <div className="space-y-2">
            <label className="block text-xs sm:text-sm font-bold text-foreground flex items-center gap-2">
              <Pill className="w-4 h-4 text-emerald-500" />
              <span>داروها یا دمنوش‌های مصرفی</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_MEDICATIONS.map((med) => {
                const isSelected = selectedMeds.includes(med);
                return (
                  <button
                    key={med}
                    type="button"
                    onClick={() => toggleItem(selectedMeds, setSelectedMeds, med)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-background border-border text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {isSelected && '✓ '}
                    {med}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 8. Energy Level & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                سطح انرژی عمومی (۱ تا ۵): <span className="font-mono text-foreground font-bold">{toFaDigits(energyLevel)}</span>
              </label>
              <input
                type="range"
                min="1"
                max="5"
                value={energyLevel}
                onChange={(e) => setEnergyLevel(parseInt(e.target.value, 10))}
                className="w-full accent-rose-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1 font-bold">
                <span>خیلی بی‌حال (۱)</span>
                <span>متوسط (۳)</span>
                <span>پرانرژی (۵)</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                یادداشت شخصی و توضیحات امروز
              </label>
              <input
                type="text"
                value={dailyNotes}
                onChange={(e) => setDailyNotes(e.target.value)}
                placeholder="نکات خاص، رژیم غذایی یا رویدادها..."
                className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:border-rose-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex items-center gap-3 pt-3 border-t border-border">
            <button
              type="submit"
              className="px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-rose-500/25 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>ذخیره وضعیت این روز</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('overview')}
              className="px-4 py-3 rounded-2xl border border-border bg-card hover:bg-muted text-foreground text-xs font-bold transition-all cursor-pointer"
            >
              انصراف
            </button>
          </div>
        </form>
      )}

      {/* SUB-TAB 3: HISTORY & CYCLES */}
      {activeSubTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base text-foreground">
              سوابق و تاریخچه دوره‌های ثبت‌شده
            </h3>
            <button
              type="button"
              onClick={() => setIsAddCycleModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن دوره جدید</span>
            </button>
          </div>

          {cycles.length === 0 ? (
            <div className="p-8 rounded-3xl bg-card border border-border text-center space-y-3">
              <Droplet className="w-10 h-10 text-rose-500/40 mx-auto" />
              <p className="text-sm font-bold text-foreground">هنوز دوره‌ای ثبت نشده است.</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                با ثبت تاریخ شروع پریود قبلی، سامانه به صورت خودکار تقویم، موعدهای بعدی و روزهای تخمک‌گذاری را محاسبه می‌کند.
              </p>
              <button
                type="button"
                onClick={() => setIsAddCycleModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold cursor-pointer"
              >
                ثبت اولین دوره
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {cycles.map((cycle, idx) => (
                <div
                  key={cycle.id}
                  className="p-4 sm:p-5 rounded-2xl bg-card border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold font-mono text-sm">
                      #{toFaDigits(cycles.length - idx)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">
                          شروع: {formatJalaliReadable(cycle.startDateJalali)}
                        </span>
                        {cycle.endDateJalali && (
                          <span className="text-xs text-muted-foreground">
                            تا {formatJalaliReadable(cycle.endDateJalali)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <span>مدت خونریزی: <strong>{toFaDigits(cycle.periodLengthDays)} روز</strong></span>
                        {cycle.cycleLengthDays && (
                          <span>طول کل سیکل: <strong>{toFaDigits(cycle.cycleLengthDays)} روز</strong></span>
                        )}
                      </div>
                      {cycle.notes && (
                        <p className="text-[11px] text-muted-foreground mt-1 italic">
                          {cycle.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('آیا از حذف این دوره از سوابق اطمینان دارید؟')) {
                        StorageService.deletePeriodCycle(cycle.id);
                        showToast('دوره با موفقیت حذف شد.');
                        onRefreshData();
                      }
                    }}
                    className="p-2 text-muted-foreground hover:text-rose-600 transition-colors self-end sm:self-center cursor-pointer"
                    title="حذف دوره"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 4: INSIGHTS & PHASES */}
      {activeSubTab === 'insights' && (
        <div className="space-y-6">
          {/* Key Cycle Stats Bento */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="p-4 rounded-2xl bg-card border border-border">
              <span className="text-xs text-muted-foreground font-medium block">میانگین طول چرخه</span>
              <div className="text-2xl font-black text-foreground font-mono mt-1">
                {toFaDigits(config.averageCycleLength || 28)} روز
              </div>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 block">
                بازه طبیعی ۲۱ تا ۳۵ روز
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border">
              <span className="text-xs text-muted-foreground font-medium block">میانگین روزهای خونریزی</span>
              <div className="text-2xl font-black text-foreground font-mono mt-1">
                {toFaDigits(config.averagePeriodLength || 5)} روز
              </div>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 block">
                بازه طبیعی ۳ تا ۷ روز
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border">
              <span className="text-xs text-muted-foreground font-medium block">وضعیت نظم دوره‌ها</span>
              <div className="text-lg font-black text-foreground mt-1">
                منظم و قابل پیش‌بینی
              </div>
              <span className="text-[11px] text-muted-foreground mt-1 block">
                بر اساس دوره‌های ثبت‌شده اخیر
              </span>
            </div>
          </div>

          {/* 4 Phases of Menstrual Cycle Educational Card */}
          <div className="p-5 sm:p-6 rounded-3xl bg-card border border-border space-y-4">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" />
              <span>راهنمای ۴ فاز اصلی چرخه قاعدگی و هورمون‌ها</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-1.5">
                <span className="font-extrabold text-sm text-rose-700 dark:text-rose-300">
                  ۱. فاز قاعدگی (Menstrual) - روزهای ۱ تا ۵
                </span>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  سطح هورمون‌های استروژن و پروژسترون پایین است. بدن در حال پاکسازی و ریزش بافت رحم است. استراحت کافی، خواب عمیق و پرهیز از استرس کلیدی است.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 space-y-1.5">
                <span className="font-extrabold text-sm text-blue-700 dark:text-blue-300">
                  ۲. فاز فولیکولار (Follicular) - روزهای ۶ تا ۱۲
                </span>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  افزایش ترشح هورمون FSH و استروژن. انرژی، تمرکز ذهنی و اعتمادبه‌نفس در اوج قرار می‌گیرد. زمان عالی برای ورزش‌های قدرتی و پروژه‌های نو.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 space-y-1.5">
                <span className="font-extrabold text-sm text-purple-700 dark:text-purple-300">
                  ۳. فاز تخمک‌گذاری (Ovulation) - روزهای ۱۳ تا ۱۶
                </span>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  ترشح هورمون LH و رهاسازی تخمک. ترشحات شفاف و کشسان می‌شوند و شانس بارداری به بالاترین حد می‌رسد.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1.5">
                <span className="font-extrabold text-sm text-amber-700 dark:text-amber-300">
                  ۴. فاز لوتئال / پیش از قاعدگی (Luteal & PMS) - روزهای ۱۷ تا ۲۸
                </span>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  افزایش پروژسترون. احتمال نفخ، احتباس آب و نوسانات خلقی (PMS). مصرف منیزیم، سبزیجات، دمنوش‌های آرام‌بخش و پیاده‌روی سبک بسیار مفید است.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: SETTINGS */}
      {activeSubTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="p-5 sm:p-7 rounded-3xl bg-card border border-border shadow-xs space-y-5 max-w-xl">
          <div className="pb-3 border-b border-border">
            <h3 className="font-bold text-base text-foreground">
              تنظیمات پیش‌فرض چرخه قاعدگی
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              تطبیق طول دوره و اهداف رهگیری متناسب با شرایط فیزیولوژیک شما
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                طول متوسط چرخه (تعداد روزهای بین شروع دو پریود)
              </label>
              <input
                type="number"
                min="20"
                max="45"
                value={cfgAvgCycle}
                onChange={(e) => setCfgAvgCycle(parseInt(e.target.value, 10) || 28)}
                className="w-full p-3 rounded-2xl border border-border bg-background text-foreground font-mono text-center font-bold focus:border-rose-500 focus:outline-none"
              />
              <p className="text-[11px] text-muted-foreground mt-1">اغلب بانوان چرخه‌ای بین ۲۶ تا ۳۲ روز دارند (پیش‌فرض: ۲۸ روز)</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                طول متوسط دوره خونریزی (تعداد روزهای پریود)
              </label>
              <input
                type="number"
                min="2"
                max="10"
                value={cfgAvgPeriod}
                onChange={(e) => setCfgAvgPeriod(parseInt(e.target.value, 10) || 5)}
                className="w-full p-3 rounded-2xl border border-border bg-background text-foreground font-mono text-center font-bold focus:border-rose-500 focus:outline-none"
              />
              <p className="text-[11px] text-muted-foreground mt-1">معمولاً بین ۳ تا ۷ روز (پیش‌فرض: ۵ روز)</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                هدف اصلی از رهگیری
              </label>
              <select
                value={cfgGoal}
                onChange={(e) => setCfgGoal(e.target.value as any)}
                className="w-full p-3 rounded-2xl border border-border bg-background text-foreground text-xs font-bold focus:border-rose-500 focus:outline-none cursor-pointer"
              >
                <option value="track_cycle">ثبت و بررسی نظم چرخه ماهانه</option>
                <option value="trying_to_conceive">اقدام به بارداری و روزهای بارور</option>
                <option value="prevent_pregnancy">پیشگیری طبیعی و آگاهی از چرخه</option>
                <option value="general_health">مدیریت سلامت عمومی و سندروم PMS</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-muted/40 border border-border">
              <div>
                <span className="text-xs font-bold text-foreground block">
                  یادآوری اعلان موعد بعدی
                </span>
                <span className="text-[11px] text-muted-foreground">
                  ارسال پیام هشدار ۲ روز پیش از شروع پریود بعدی
                </span>
              </div>
              <input
                type="checkbox"
                checked={cfgReminders}
                onChange={(e) => setCfgReminders(e.target.checked)}
                className="w-5 h-5 accent-rose-500 rounded cursor-pointer"
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-rose-500/25 transition-all cursor-pointer"
          >
            ذخیره تنظیمات چرخه
          </button>
        </form>
      )}

      {/* ADD CYCLE MODAL */}
      {isAddCycleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-card rounded-3xl border border-border shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
                <Droplet className="w-5 h-5 text-rose-500" />
                <span>ثبت دوره جدید پریود</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddCycleModalOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCycle} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5 font-bold">
                  تاریخ شروع پریود (شمسی)
                </label>
                <input
                  type="text"
                  value={newCycleStartDate}
                  onChange={(e) => setNewCycleStartDate(e.target.value)}
                  placeholder="1405/05/20"
                  required
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground font-mono text-center font-bold focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1.5 font-bold">
                  طول دوره خونریزی (روز)
                </label>
                <input
                  type="number"
                  min="2"
                  max="12"
                  value={newCyclePeriodDays}
                  onChange={(e) => setNewCyclePeriodDays(parseInt(e.target.value, 10) || 5)}
                  required
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground font-mono text-center font-bold focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1.5 font-bold">
                  یادداشت یا توضیحات (اختیاری)
                </label>
                <input
                  type="text"
                  value={newCycleNotes}
                  onChange={(e) => setNewCycleNotes(e.target.value)}
                  placeholder="مثال: شروع منظم، همراه با درد در روز اول..."
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
                >
                  ثبت دوره در سوابق
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddCycleModalOpen(false)}
                  className="px-4 py-3 rounded-xl border border-border bg-card hover:bg-muted text-foreground font-bold text-xs cursor-pointer"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

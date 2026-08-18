import React, { useState } from 'react';
import {
  Heart,
  Activity,
  Plus,
  Trash2,
  TrendingUp,
  User,
  ShieldAlert,
  Edit2,
  X,
} from 'lucide-react';
import { UserProfile, Measurement, MeasurementType } from '../../types';
import { StorageService } from '../../services/storage';
import { getTodayJalali, toFaDigits, formatJalaliReadable } from '../../utils/jalali';
import { EmptyState } from '../common/EmptyState';

interface HealthViewProps {
  profile?: UserProfile;
  userProfile?: UserProfile;
  measurements?: Measurement[];
  vitals?: Measurement[];
  onRefreshData: () => void;
  onOpenQuickCapture?: () => void;
}

export const HealthView: React.FC<HealthViewProps> = ({
  profile: propProfile,
  userProfile,
  measurements: propMeasurements,
  vitals,
  onRefreshData,
  onOpenQuickCapture,
}) => {
  const profile = propProfile || userProfile || StorageService.getProfile() || { name: 'کاربر گرامی', bloodGroup: 'O+' };
  const measurements = propMeasurements || vitals || StorageService.getMeasurements() || [];

  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'history' | 'profile'>('overview');
  const [selectedChartType, setSelectedChartType] = useState<MeasurementType>('weight');
  
  // Add Measurement Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [measureType, setMeasureType] = useState<MeasurementType>('weight');
  const [val1, setVal1] = useState('');
  const [val2, setVal2] = useState('');
  const [notes, setNotes] = useState('');
  const [dateJalali, setDateJalali] = useState(getTodayJalali());

  // Edit Profile Modal State
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState(profile?.name || profile?.fullName || '');
  const [editBirthDate, setEditBirthDate] = useState(profile?.birthDateJalali || profile?.birthYearJalali || '');
  const [editBloodGroup, setEditBloodGroup] = useState(profile?.bloodGroup || profile?.bloodType || 'O+');
  const [editHeight, setEditHeight] = useState(profile?.height ? String(profile.height) : profile?.heightCm ? String(profile.heightCm) : '');
  const [editAllergies, setEditAllergies] = useState(profile?.allergies ? profile.allergies.join('، ') : '');
  const [editConditions, setEditConditions] = useState(profile?.medicalConditions ? profile.medicalConditions.join('، ') : '');
  const [editEmergency, setEditEmergency] = useState(profile?.emergencyContact || profile?.emergencyContactPhone || '');
  const [editInsurance, setEditInsurance] = useState(profile?.insuranceNumber || '');

  // Filter measurements for chart
  const chartData = measurements
    .filter((m) => {
      if (selectedChartType === 'blood_pressure_sys') {
        return m.type === 'blood_pressure_sys' || m.type === 'blood_pressure_dia';
      }
      return m.type === selectedChartType;
    })
    .slice(0, 10)
    .reverse();

  // BMI Calculation
  const latestWeight = measurements.find((m) => m?.type === 'weight')?.value;
  const rawHeight = profile?.height || profile?.heightCm;
  const heightMeters = rawHeight ? rawHeight / 100 : undefined;
  const bmi = latestWeight && heightMeters ? (latestWeight / (heightMeters * heightMeters)).toFixed(1) : null;

  const handleSaveMeasurement = (e: React.FormEvent) => {
    e.preventDefault();
    const today = dateJalali || getTodayJalali();
    const now = Date.now();
    const timeStr = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });

    if (measureType === 'blood_pressure_sys') {
      let sys = parseFloat(val1);
      let dia = parseFloat(val2);
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
        notes: notes || 'سیستولیک',
      });
      StorageService.addMeasurement({
        id: 'm-' + Math.random().toString(36).substring(2, 9),
        type: 'blood_pressure_dia',
        value: dia,
        unit: 'mmHg',
        recordedAtJalali: today,
        recordedTime: timeStr,
        timestamp: now,
        notes: notes || 'دیاستولیک',
      });
    } else {
      const v = parseFloat(val1);
      if (isNaN(v)) return;
      let unit = 'kg';
      if (measureType === 'blood_glucose') unit = 'mg/dL';
      if (measureType === 'heart_rate') unit = 'bpm';
      if (measureType === 'sleep_hours') unit = 'ساعت';
      if (measureType === 'blood_oxygen') unit = '%';
      if (measureType === 'body_temperature') unit = '°C';

      StorageService.addMeasurement({
        id: 'm-' + Math.random().toString(36).substring(2, 9),
        type: measureType,
        value: v,
        unit,
        recordedAtJalali: today,
        recordedTime: timeStr,
        timestamp: now,
        notes,
      });
    }

    setIsAddModalOpen(false);
    setVal1('');
    setVal2('');
    setNotes('');
    onRefreshData();
  };

  const handleDeleteMeasurement = (id: string) => {
    const all = StorageService.getMeasurements().filter((m) => m.id !== id);
    StorageService.saveMeasurements(all);
    onRefreshData();
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserProfile = {
      ...profile,
      name: editName.trim(),
      birthDateJalali: editBirthDate.trim(),
      bloodGroup: editBloodGroup,
      height: editHeight ? parseFloat(editHeight) : undefined,
      allergies: editAllergies.split('،').map((s) => s.trim()).filter(Boolean),
      medicalConditions: editConditions.split('،').map((s) => s.trim()).filter(Boolean),
      emergencyContact: editEmergency.trim(),
      insuranceNumber: editInsurance.trim(),
    };
    StorageService.saveProfile(updated);
    setIsEditProfileOpen(false);
    onRefreshData();
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header & Sub-tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#2D3A29] dark:text-[#E5EFE2]">
            سلامت و سنجش‌های فردی
          </h2>
          <p className="text-xs sm:text-sm text-[#8A8A87] dark:text-[#9BA598]">
            پروفایل پزشکی، نمودارها و روند سنجش‌های زیستی
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#7C9070] hover:bg-[#6B7D60] text-white font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>ثبت سنجش جدید</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex p-1 bg-[#F5F2EB] dark:bg-[#1C241B] rounded-2xl text-xs font-semibold border border-[#E5E0D5] dark:border-[#2D3B2C]">
        <button
          onClick={() => setActiveSubTab('overview')}
          className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
            activeSubTab === 'overview'
              ? 'bg-[#FFFFFF] dark:bg-[#253023] text-[#2D3A29] dark:text-[#E5EFE2] font-bold shadow-xs'
              : 'text-[#8A8A87] dark:text-[#9BA598]'
          }`}
        >
          مرور و نمودارها
        </button>
        <button
          onClick={() => setActiveSubTab('history')}
          className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
            activeSubTab === 'history'
              ? 'bg-[#FFFFFF] dark:bg-[#253023] text-[#2D3A29] dark:text-[#E5EFE2] font-bold shadow-xs'
              : 'text-[#8A8A87] dark:text-[#9BA598]'
          }`}
        >
          تاریخچه سنجش‌ها ({toFaDigits(measurements.length)})
        </button>
        <button
          onClick={() => setActiveSubTab('profile')}
          className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
            activeSubTab === 'profile'
              ? 'bg-[#FFFFFF] dark:bg-[#253023] text-[#2D3A29] dark:text-[#E5EFE2] font-bold shadow-xs'
              : 'text-[#8A8A87] dark:text-[#9BA598]'
          }`}
        >
          شناسنامه پزشکی
        </button>
      </div>

      {/* OVERVIEW SUB-TAB */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics Bento Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Weight */}
            <div className="p-4 rounded-2xl bg-[#FFFFFF] dark:bg-[#212B1F] border border-[#E5E0D5] dark:border-[#2D3B2C] shadow-xs">
              <div className="text-xs text-[#8A8A87] dark:text-[#9BA598] font-medium mb-1">آخرین وزن</div>
              <div className="text-2xl font-bold text-[#2D3A29] dark:text-[#E5EFE2]">
                {latestWeight ? toFaDigits(latestWeight) : '—'}
                <span className="text-xs text-[#8A8A87] font-normal mr-1">کیلوگرم</span>
              </div>
              {bmi && (
                <div className="mt-2 text-[11px] font-semibold text-[#7C9070] dark:text-[#8DA480]">
                  شاخص BMI: {toFaDigits(bmi)}
                </div>
              )}
            </div>

            {/* Blood Pressure */}
            <div className="p-4 rounded-2xl bg-[#FFFFFF] dark:bg-[#212B1F] border border-[#E5E0D5] dark:border-[#2D3B2C] shadow-xs">
              <div className="text-xs text-[#8A8A87] dark:text-[#9BA598] font-medium mb-1">آخرین فشار خون</div>
              <div className="text-2xl font-bold text-[#2D3A29] dark:text-[#E5EFE2]">
                {measurements.find((m) => m.type === 'blood_pressure_sys')
                  ? `${toFaDigits(measurements.find((m) => m.type === 'blood_pressure_sys')?.value! <= 25 ? measurements.find((m) => m.type === 'blood_pressure_sys')?.value! : Math.round(measurements.find((m) => m.type === 'blood_pressure_sys')?.value! / 10))} / ${toFaDigits(measurements.find((m) => m.type === 'blood_pressure_dia')?.value! <= 25 ? measurements.find((m) => m.type === 'blood_pressure_dia')?.value! : Math.round(measurements.find((m) => m.type === 'blood_pressure_dia')?.value! / 10))}`
                  : '—'}
                <span className="text-xs text-[#8A8A87] font-normal mr-1">mmHg</span>
              </div>
              <div className="mt-2 text-[11px] text-[#8A8A87]">
                {measurements.find((m) => m.type === 'blood_pressure_sys')?.recordedAtJalali || 'بدون ثبت'}
              </div>
            </div>

            {/* Blood Glucose */}
            <div className="p-4 rounded-2xl bg-[#FFFFFF] dark:bg-[#212B1F] border border-[#E5E0D5] dark:border-[#2D3B2C] shadow-xs">
              <div className="text-xs text-[#8A8A87] dark:text-[#9BA598] font-medium mb-1">آخرین قند خون</div>
              <div className="text-2xl font-bold text-[#2D3A29] dark:text-[#E5EFE2]">
                {measurements.find((m) => m.type === 'blood_glucose')?.value
                  ? toFaDigits(measurements.find((m) => m.type === 'blood_glucose')?.value!)
                  : '—'}
                <span className="text-xs text-[#8A8A87] font-normal mr-1">mg/dL</span>
              </div>
              <div className="mt-2 text-[11px] text-[#8A8A87]">
                {measurements.find((m) => m.type === 'blood_glucose')?.notes || 'طبیعی'}
              </div>
            </div>

            {/* Blood Group & Allergies */}
            <div className="p-4 rounded-2xl bg-[#FFFFFF] dark:bg-[#212B1F] border border-[#E5E0D5] dark:border-[#2D3B2C] shadow-xs">
              <div className="text-xs text-[#8A8A87] dark:text-[#9BA598] font-medium mb-1">گروه خونی و آلرژی</div>
              <div className="text-2xl font-bold text-[#D97B7B]">
                {profile.bloodGroup || 'نامشخص'}
              </div>
              <div className="mt-2 text-[11px] text-[#8A8A87] truncate">
                {profile.allergies && profile.allergies.length > 0 ? profile.allergies.join('، ') : 'بدون آلرژی ثبت‌شده'}
              </div>
            </div>
          </div>

          {/* Interactive SVG Trend Visualizer */}
          <div className="p-5 rounded-3xl bg-[#FFFFFF] dark:bg-[#212B1F] border border-[#E5E0D5] dark:border-[#2D3B2C] shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#7C9070]/15 text-[#7C9070] flex items-center justify-center">
                  <TrendingUp className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#2D3A29] dark:text-[#E5EFE2]">روند تغییرات در طول زمان</h3>
                  <p className="text-[11px] text-[#8A8A87]">مشاهده نمودار پیوسته سنجش‌ها</p>
                </div>
              </div>

              {/* Selector */}
              <div className="flex items-center gap-1 bg-[#FAF9F5] dark:bg-[#1C241B] p-1 rounded-xl text-xs font-medium border border-[#E5E0D5] dark:border-[#2C3A2A]">
                <button
                  onClick={() => setSelectedChartType('weight')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    selectedChartType === 'weight'
                      ? 'bg-[#FFFFFF] dark:bg-[#253023] text-[#2D3A29] dark:text-[#E5EFE2] font-bold shadow-xs'
                      : 'text-[#8A8A87] dark:text-[#9BA598]'
                  }`}
                >
                  وزن
                </button>
                <button
                  onClick={() => setSelectedChartType('blood_pressure_sys')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    selectedChartType === 'blood_pressure_sys'
                      ? 'bg-[#FFFFFF] dark:bg-[#253023] text-[#2D3A29] dark:text-[#E5EFE2] font-bold shadow-xs'
                      : 'text-[#8A8A87] dark:text-[#9BA598]'
                  }`}
                >
                  فشار خون
                </button>
                <button
                  onClick={() => setSelectedChartType('blood_glucose')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    selectedChartType === 'blood_glucose'
                      ? 'bg-[#FFFFFF] dark:bg-[#253023] text-[#2D3A29] dark:text-[#E5EFE2] font-bold shadow-xs'
                      : 'text-[#8A8A87] dark:text-[#9BA598]'
                  }`}
                >
                  قند خون
                </button>
                <button
                  onClick={() => setSelectedChartType('heart_rate')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    selectedChartType === 'heart_rate'
                      ? 'bg-[#FFFFFF] dark:bg-[#253023] text-[#2D3A29] dark:text-[#E5EFE2] font-bold shadow-xs'
                      : 'text-[#8A8A87] dark:text-[#9BA598]'
                  }`}
                >
                  ضربان
                </button>
              </div>
            </div>

            {/* SVG Chart */}
            {chartData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-xs text-[#8A8A87] border border-dashed border-[#E5E0D5] dark:border-[#2D3B2C] rounded-2xl">
                داده‌ای برای رسم نمودار در این دسته‌بندی وجود ندارد.
              </div>
            ) : (
              <div className="h-56 w-full pt-4">
                <div className="relative h-44 w-full flex items-end justify-between gap-2 px-2 border-b border-[#E5E0D5] dark:border-[#2D3B2C]">
                  {chartData.map((d, index) => {
                    const minVal = Math.min(...chartData.map((c) => c.value)) * 0.9;
                    const maxVal = Math.max(...chartData.map((c) => c.value)) * 1.1;
                    const heightPercent = Math.max(15, Math.min(95, ((d.value - minVal) / (maxVal - minVal || 1)) * 100));

                    return (
                      <div key={d.id || index} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                        {/* Tooltip on Hover */}
                        <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-[#2D3A29] text-white text-[10px] py-1 px-2 rounded-md transition-opacity whitespace-nowrap z-20 pointer-events-none shadow-sm">
                          {toFaDigits(d.value)} {d.unit} ({d.recordedAtJalali})
                        </div>

                        {/* Bar / Node */}
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className="w-full max-w-[28px] bg-gradient-to-t from-[#4A5D45] to-[#7C9070] rounded-t-lg group-hover:brightness-110 transition-all relative flex justify-center"
                        >
                          <span className="text-[10px] font-bold text-white -top-5 absolute">
                            {toFaDigits(d.value)}
                          </span>
                        </div>

                        {/* X-axis Label */}
                        <span className="text-[9px] text-[#8A8A87] truncate w-full text-center mt-2">
                          {d.recordedAtJalali.split('/').slice(1).join('/')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* HISTORY SUB-TAB */}
      {activeSubTab === 'history' && (
        <div className="space-y-3">
          {measurements.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="هنوز هیچ سنجش سلامتی ثبت نشده است"
              description="می‌توانید وزن، فشار خون، قند خون یا ضربان قلب خود را ثبت کنید."
              actionText="ثبت اولین سنجش"
              onAction={() => setIsAddModalOpen(true)}
            />
          ) : (
            <div className="bg-[#FFFFFF] dark:bg-[#212B1F] rounded-3xl border border-[#E5E0D5] dark:border-[#2D3B2C] shadow-xs overflow-hidden">
              <div className="p-4 border-b border-[#E5E0D5] dark:border-[#2D3B2C] text-xs font-bold text-[#2D3A29] dark:text-[#E5EFE2]">
                فهرست کامل سنجش‌های ثبت‌شده
              </div>
              <div className="divide-y divide-[#E5E0D5] dark:divide-[#2D3B2C]">
                {measurements.map((m) => (
                  <div
                    key={m.id}
                    className="p-3.5 flex items-center justify-between hover:bg-[#FAF9F5] dark:hover:bg-[#1C241B] transition-colors text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[#7C9070]/15 text-[#7C9070] flex items-center justify-center font-bold">
                        <Activity className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-[#2D3A29] dark:text-[#E5EFE2] text-sm">
                          {m.type === 'weight'
                            ? 'وزن بدن'
                            : m.type === 'blood_pressure_sys'
                            ? 'فشار سیستولیک'
                            : m.type === 'blood_pressure_dia'
                            ? 'فشار دیاستولیک'
                            : m.type === 'blood_glucose'
                            ? 'قند خون'
                            : m.type === 'heart_rate'
                            ? 'ضربان قلب'
                            : m.type === 'sleep_hours'
                            ? 'ساعات خواب'
                            : m.type}
                          : <span className="text-[#7C9070] dark:text-[#8DA480] mr-1">{toFaDigits(m.value)} {m.unit}</span>
                        </div>
                        <div className="text-[11px] text-[#8A8A87] mt-0.5">
                          {formatJalaliReadable(m.recordedAtJalali)} {m.recordedTime ? `(ساعت ${toFaDigits(m.recordedTime)})` : ''} {m.notes ? `— ${m.notes}` : ''}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteMeasurement(m.id)}
                      className="p-1.5 rounded-lg text-[#8A8A87] hover:text-[#D97B7B] hover:bg-[#D97B7B]/10 transition-colors cursor-pointer"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* PROFILE SUB-TAB */}
      {activeSubTab === 'profile' && (
        <div className="bg-[#FFFFFF] dark:bg-[#212B1F] p-5 sm:p-6 rounded-3xl border border-[#E5E0D5] dark:border-[#2D3B2C] shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-[#E5E0D5] dark:border-[#2D3B2C]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#2D3A29] dark:bg-[#1C241B] text-white flex items-center justify-center font-bold text-xl shadow-xs border border-[#4A5D45]/30">
                {profile?.name ? profile.name.slice(0, 1) : profile?.fullName ? profile.fullName.slice(0, 1) : <User className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="font-bold text-base text-[#2D3A29] dark:text-[#E5EFE2]">
                  {profile?.name || profile?.fullName || 'کاربر گرامی'}
                </h3>
                <p className="text-xs text-[#8A8A87]">شناسنامه اطلاعات سلامت و پرونده شخصی</p>
              </div>
            </div>

            <button
              onClick={() => setIsEditProfileOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E5E0D5] dark:border-[#2D3B2C] text-[#3C3C3B] dark:text-[#E5EFE2] hover:bg-[#FAF9F5] dark:hover:bg-[#1C241B] text-xs font-semibold cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>ویرایش مشخصات</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-[#FAF9F5] dark:bg-[#1C241B] border border-[#E5E0D5] dark:border-[#2C3A2A]">
              <span className="text-[#8A8A87] block mb-1">تاریخ تولد</span>
              <span className="font-bold text-[#2D3A29] dark:text-[#E5EFE2] text-sm">
                {profile.birthDateJalali || 'ثبت نشده'}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FAF9F5] dark:bg-[#1C241B] border border-[#E5E0D5] dark:border-[#2C3A2A]">
              <span className="text-[#8A8A87] block mb-1">گروه خونی</span>
              <span className="font-bold text-[#D97B7B] text-sm">
                {profile.bloodGroup || 'ثبت نشده'}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FAF9F5] dark:bg-[#1C241B] border border-[#E5E0D5] dark:border-[#2C3A2A]">
              <span className="text-[#8A8A87] block mb-1">قد (سانتی‌متر)</span>
              <span className="font-bold text-[#2D3A29] dark:text-[#E5EFE2] text-sm">
                {profile.height ? `${toFaDigits(profile.height)} سانتی‌متر` : 'ثبت نشده'}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FAF9F5] dark:bg-[#1C241B] border border-[#E5E0D5] dark:border-[#2C3A2A]">
              <span className="text-[#8A8A87] block mb-1">شماره بیمه / پرونده پزشکی</span>
              <span className="font-bold text-[#2D3A29] dark:text-[#E5EFE2] text-sm">
                {profile.insuranceNumber || 'ثبت نشده'}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FAF9F5] dark:bg-[#1C241B] border border-[#E5E0D5] dark:border-[#2C3A2A] sm:col-span-2">
              <span className="text-[#8A8A87] block mb-1 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-[#B86E3D]" />
                <span>حساسیت‌ها و آلرژی‌های دارویی / غذایی</span>
              </span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {profile.allergies && profile.allergies.length > 0 ? (
                  profile.allergies.map((a, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-[#D97B7B]/15 text-[#D97B7B] font-semibold"
                    >
                      {a}
                    </span>
                  ))
                ) : (
                  <span className="text-[#8A8A87]">موردی ثبت نشده است.</span>
                )}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FAF9F5] dark:bg-[#1C241B] border border-[#E5E0D5] dark:border-[#2C3A2A] sm:col-span-2">
              <span className="text-[#8A8A87] block mb-1">سوابق بیماری و شرایط پزشکی</span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {profile.medicalConditions && profile.medicalConditions.length > 0 ? (
                  profile.medicalConditions.map((c, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-[#7C9070]/15 text-[#4A5D45] dark:text-[#A8BCA2] font-semibold"
                    >
                      {c}
                    </span>
                  ))
                ) : (
                  <span className="text-[#8A8A87]">موردی ثبت نشده است.</span>
                )}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FAF9F5] dark:bg-[#1C241B] border border-[#E5E0D5] dark:border-[#2C3A2A] sm:col-span-2">
              <span className="text-[#8A8A87] block mb-1">شماره تماس اضطراری</span>
              <span className="font-bold text-[#2D3A29] dark:text-[#E5EFE2] text-sm font-mono">
                {profile.emergencyContact || 'ثبت نشده'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Add Measurement Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#FFFFFF] dark:bg-[#212B1F] rounded-3xl p-5 shadow-xl border border-[#E5E0D5] dark:border-[#2D3B2C]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E0D5] dark:border-[#2D3B2C]">
              <h3 className="font-bold text-[#2D3A29] dark:text-[#E5EFE2] text-base">ثبت سنجش جدید</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-full text-[#8A8A87] hover:text-[#3C3C3B] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMeasurement} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs text-[#8A8A87] mb-1">نوع سنجش</label>
                <select
                  value={measureType}
                  onChange={(e) => setMeasureType(e.target.value as MeasurementType)}
                  className="w-full p-2.5 rounded-xl border border-[#E5E0D5] dark:border-[#2D3B2C] bg-[#FAF9F5] dark:bg-[#1C241B] text-[#3C3C3B] dark:text-[#E5EFE2] text-xs font-semibold"
                >
                  <option value="weight">وزن بدن (کیلوگرم)</option>
                  <option value="blood_pressure_sys">فشار خون (سیستولیک / دیاستولیک)</option>
                  <option value="blood_glucose">قند خون (mg/dL)</option>
                  <option value="heart_rate">ضربان قلب (bpm)</option>
                  <option value="sleep_hours">ساعات خواب</option>
                  <option value="blood_oxygen">اکسیژن خون (%)</option>
                  <option value="body_temperature">دمای بدن (°C)</option>
                </select>
              </div>

              {measureType === 'blood_pressure_sys' ? (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-[#8A8A87] mb-1">سیستولیک (بالا)</label>
                    <input
                      type="number"
                      value={val1}
                      onChange={(e) => setVal1(e.target.value)}
                      placeholder="120 یا 12"
                      required
                      className="w-full p-2.5 rounded-xl border border-[#E5E0D5] dark:border-[#2D3B2C] bg-[#FAF9F5] dark:bg-[#1C241B] text-[#3C3C3B] dark:text-[#E5EFE2] text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#8A8A87] mb-1">دیاستولیک (پایین)</label>
                    <input
                      type="number"
                      value={val2}
                      onChange={(e) => setVal2(e.target.value)}
                      placeholder="80 یا 8"
                      required
                      className="w-full p-2.5 rounded-xl border border-[#E5E0D5] dark:border-[#2D3B2C] bg-[#FAF9F5] dark:bg-[#1C241B] text-[#3C3C3B] dark:text-[#E5EFE2] text-center font-bold"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs text-[#8A8A87] mb-1">مقدار</label>
                  <input
                    type="number"
                    step="0.1"
                    value={val1}
                    onChange={(e) => setVal1(e.target.value)}
                    placeholder="مقدار را وارد کنید..."
                    required
                    className="w-full p-2.5 rounded-xl border border-[#E5E0D5] dark:border-[#2D3B2C] bg-[#FAF9F5] dark:bg-[#1C241B] text-[#3C3C3B] dark:text-[#E5EFE2] text-center font-bold text-lg"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-[#8A8A87] mb-1">تاریخ شمسی</label>
                  <input
                    type="text"
                    value={dateJalali}
                    onChange={(e) => setDateJalali(e.target.value)}
                    className="w-full p-2 rounded-xl border border-[#E5E0D5] dark:border-[#2D3B2C] bg-[#FAF9F5] dark:bg-[#1C241B] text-[#3C3C3B] dark:text-[#E5EFE2] text-xs font-mono text-center"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#8A8A87] mb-1">توضیح اختیاری</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="مثال: ناشتا"
                    className="w-full p-2 rounded-xl border border-[#E5E0D5] dark:border-[#2D3B2C] bg-[#FAF9F5] dark:bg-[#1C241B] text-[#3C3C3B] dark:text-[#E5EFE2] text-xs"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#E5E0D5] dark:border-[#2D3B2C] text-[#3C3C3B] dark:text-[#E5EFE2] text-xs font-semibold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#7C9070] hover:bg-[#6B7D60] text-white font-bold text-xs shadow-sm cursor-pointer"
                >
                  ذخیره سنجش
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-[#FFFFFF] dark:bg-[#212B1F] rounded-3xl p-5 sm:p-6 shadow-xl border border-[#E5E0D5] dark:border-[#2D3B2C] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E0D5] dark:border-[#2D3B2C]">
              <h3 className="font-bold text-[#2D3A29] dark:text-[#E5EFE2] text-base">ویرایش شناسنامه پزشکی</h3>
              <button
                onClick={() => setIsEditProfileOpen(false)}
                className="p-1 rounded-full text-[#8A8A87] hover:text-[#3C3C3B] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block text-[#8A8A87] mb-1">نام و نام خانوادگی</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#E5E0D5] dark:border-[#2D3B2C] bg-[#FAF9F5] dark:bg-[#1C241B] text-[#3C3C3B] dark:text-[#E5EFE2]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#8A8A87] mb-1">تاریخ تولد (شمسی)</label>
                  <input
                    type="text"
                    value={editBirthDate}
                    onChange={(e) => setEditBirthDate(e.target.value)}
                    placeholder="1368/04/12"
                    className="w-full p-2.5 rounded-xl border border-[#E5E0D5] dark:border-[#2D3B2C] bg-[#FAF9F5] dark:bg-[#1C241B] text-[#3C3C3B] dark:text-[#E5EFE2] text-center font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[#8A8A87] mb-1">گروه خونی</label>
                  <select
                    value={editBloodGroup}
                    onChange={(e) => setEditBloodGroup(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-[#E5E0D5] dark:border-[#2D3B2C] bg-[#FAF9F5] dark:bg-[#1C241B] text-[#3C3C3B] dark:text-[#E5EFE2] font-bold"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#8A8A87] mb-1">قد (سانتی‌متر)</label>
                  <input
                    type="number"
                    value={editHeight}
                    onChange={(e) => setEditHeight(e.target.value)}
                    placeholder="182"
                    className="w-full p-2.5 rounded-xl border border-[#E5E0D5] dark:border-[#2D3B2C] bg-[#FAF9F5] dark:bg-[#1C241B] text-[#3C3C3B] dark:text-[#E5EFE2] text-center font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[#8A8A87] mb-1">شماره بیمه / پرونده</label>
                  <input
                    type="text"
                    value={editInsurance}
                    onChange={(e) => setEditInsurance(e.target.value)}
                    placeholder="۱۲۳۴۵۶۷۸"
                    className="w-full p-2.5 rounded-xl border border-[#E5E0D5] dark:border-[#2D3B2C] bg-[#FAF9F5] dark:bg-[#1C241B] text-[#3C3C3B] dark:text-[#E5EFE2]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#8A8A87] mb-1">آلرژی‌ها (با ویرگول «،» جدا کنید)</label>
                <input
                  type="text"
                  value={editAllergies}
                  onChange={(e) => setEditAllergies(e.target.value)}
                  placeholder="پنی‌سیلین، گرده گل، گردو..."
                  className="w-full p-2.5 rounded-xl border border-[#E5E0D5] dark:border-[#2D3B2C] bg-[#FAF9F5] dark:bg-[#1C241B] text-[#3C3C3B] dark:text-[#E5EFE2]"
                />
              </div>

              <div>
                <label className="block text-[#8A8A87] mb-1">سوابق بیماری و شرایط خاص (با «،» جدا کنید)</label>
                <input
                  type="text"
                  value={editConditions}
                  onChange={(e) => setEditConditions(e.target.value)}
                  placeholder="فشار خون بالا، کبد چرب گرید ۱..."
                  className="w-full p-2.5 rounded-xl border border-[#E5E0D5] dark:border-[#2D3B2C] bg-[#FAF9F5] dark:bg-[#1C241B] text-[#3C3C3B] dark:text-[#E5EFE2]"
                />
              </div>

              <div>
                <label className="block text-[#8A8A87] mb-1">شماره تماس اضطراری</label>
                <input
                  type="tel"
                  value={editEmergency}
                  onChange={(e) => setEditEmergency(e.target.value)}
                  placeholder="09123456789 (همسر / پدر / برادر)"
                  className="w-full p-2.5 rounded-xl border border-[#E5E0D5] dark:border-[#2D3B2C] bg-[#FAF9F5] dark:bg-[#1C241B] text-[#3C3C3B] dark:text-[#E5EFE2] font-mono text-left"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#E5E0D5] dark:border-[#2D3B2C] text-[#3C3C3B] dark:text-[#E5EFE2] text-xs font-semibold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#7C9070] hover:bg-[#6B7D60] text-white font-bold text-xs shadow-sm cursor-pointer"
                >
                  ذخیره شناسنامه
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import {
  PERSIAN_MONTHS,
  toFaDigits,
  toEnDigits,
  getTodayJalali,
} from '../../utils/jalali';

interface PersianDatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  value: string; // e.g. "1405/05/26"
  onChange: (newDateJalali: string) => void;
  title?: string;
}

export const PersianDatePickerModal: React.FC<PersianDatePickerModalProps> = ({
  isOpen,
  onClose,
  value,
  onChange,
  title = 'انتخاب تاریخ شمسی',
}) => {
  const currentDate = value || getTodayJalali();
  const parts = toEnDigits(currentDate).split('/');
  const initYear = parseInt(parts[0], 10) || 1405;
  const initMonth = parseInt(parts[1], 10) || 5;
  const initDay = parseInt(parts[2], 10) || 1;

  const [selectedYear, setSelectedYear] = useState<number>(initYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(initMonth);
  const [selectedDay, setSelectedDay] = useState<number>(initDay);

  if (!isOpen) return null;

  // Generate Year options: 1330 to 1420
  const years = Array.from({ length: 91 }, (_, i) => 1330 + i).reverse();

  // Days in selected Jalali month
  const maxDays = selectedMonth <= 6 ? 31 : selectedMonth <= 11 ? 30 : 29;
  const days = Array.from({ length: maxDays }, (_, i) => i + 1);

  const handleConfirm = () => {
    const mm = selectedMonth.toString().padStart(2, '0');
    const dd = Math.min(selectedDay, maxDays).toString().padStart(2, '0');
    onChange(`${selectedYear}/${mm}/${dd}`);
    onClose();
  };

  const handleSetToday = () => {
    const today = getTodayJalali();
    const [y, m, d] = toEnDigits(today).split('/').map(Number);
    setSelectedYear(y);
    setSelectedMonth(m);
    setSelectedDay(d);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-sm bg-card rounded-3xl shadow-2xl p-5 animate-in zoom-in-95 border border-border">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <h3 className="font-bold text-foreground text-base">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Date Preview */}
        <div className="my-4 p-3 bg-[#F5F2EB] dark:bg-[#1F271E] rounded-2xl text-center border border-[#E5E0D5] dark:border-[#2C3A2A]">
          <div className="text-xs text-[#7C9070] dark:text-[#8DA480] font-medium">تاریخ انتخاب‌شده</div>
          <div className="text-xl font-extrabold text-[#2D3A29] dark:text-[#E5EFE2] mt-1">
            {toFaDigits(selectedDay)} {PERSIAN_MONTHS[selectedMonth - 1]} {toFaDigits(selectedYear)}
          </div>
        </div>

        {/* Selectors Grid */}
        <div className="grid grid-cols-3 gap-2 text-center text-sm font-medium">
          {/* Day */}
          <div>
            <label className="block text-xs text-[#8A8A87] dark:text-[#9BA598] mb-1">روز</label>
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(Number(e.target.value))}
              className="w-full p-2.5 rounded-xl border border-[#E5E0D5] dark:border-[#2C3A2A] bg-[#FDFCF9] dark:bg-[#161D15] text-[#2D3A29] dark:text-[#E5EFE2] text-center font-bold"
            >
              {days.map((d) => (
                <option key={d} value={d}>
                  {toFaDigits(d)}
                </option>
              ))}
            </select>
          </div>

          {/* Month */}
          <div>
            <label className="block text-xs text-[#8A8A87] dark:text-[#9BA598] mb-1">ماه</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="w-full p-2.5 rounded-xl border border-[#E5E0D5] dark:border-[#2C3A2A] bg-[#FDFCF9] dark:bg-[#161D15] text-[#2D3A29] dark:text-[#E5EFE2] text-center font-bold"
            >
              {PERSIAN_MONTHS.map((m, idx) => (
                <option key={idx + 1} value={idx + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Year */}
          <div>
            <label className="block text-xs text-[#8A8A87] dark:text-[#9BA598] mb-1">سال</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full p-2.5 rounded-xl border border-[#E5E0D5] dark:border-[#2C3A2A] bg-[#FDFCF9] dark:bg-[#161D15] text-[#2D3A29] dark:text-[#E5EFE2] text-center font-bold"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {toFaDigits(y)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-5 flex items-center gap-2">
          <button
            onClick={handleSetToday}
            className="px-3 py-2.5 rounded-xl text-xs font-semibold text-[#5A5A58] dark:text-[#C2C9BE] bg-[#F5F2EB] dark:bg-[#1F271E] hover:bg-[#EAE5DA] dark:hover:bg-[#283427] cursor-pointer"
          >
            امروز
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#7C9070] hover:bg-[#6B7D60] text-white font-semibold text-sm shadow-md shadow-[#7C9070]/20 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>تأیید تاریخ</span>
          </button>
        </div>
      </div>
    </div>
  );
};

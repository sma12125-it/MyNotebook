// Persian (Jalali) Calendar and Formatting Utilities for دفتر من

// Persian and Arabic Digits Conversion
export function toFaDigits(input: string | number | null | undefined): string {
  if (input === null || input === undefined) return '';
  const str = input.toString();
  const faDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.replace(/[0-9]/g, (w) => faDigits[parseInt(w, 10)]);
}

export function toEnDigits(input: string | number | null | undefined): string {
  if (!input) return '';
  const str = input.toString();
  const faDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  let res = str;
  for (let i = 0; i < 10; i++) {
    res = res.replace(new RegExp(faDigits[i], 'g'), i.toString());
    res = res.replace(new RegExp(arDigits[i], 'g'), i.toString());
  }
  return res;
}

export const PERSIAN_MONTHS = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

export const PERSIAN_WEEKDAYS = [
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنج‌شنبه',
  'جمعه',
  'شنبه',
];

// Gregorian to Jalali Algorithm
export function gregorianToJalali(gy: number, gm: number, gd: number): [number, number, number] {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    355666 +
    365 * gy +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) +
    gd +
    g_d_m[gm - 1];
  let jy = -1595 + 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  let jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  let jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
  return [jy, jm, jd];
}

// Jalali to Gregorian Algorithm
export function jalaliToGregorian(jy: number, jm: number, jd: number): [number, number, number] {
  let jy2 = jy + 1595;
  let days =
    -355668 +
    365 * jy2 +
    Math.floor(jy2 / 33) * 8 +
    Math.floor(((jy2 % 33) + 3) / 4) +
    jd +
    (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);
  let gy = 400 * Math.floor(days / 146097);
  days %= 146097;
  if (days > 36524) {
    gy += 100 * Math.floor(--days / 36524);
    days %= 36524;
    if (days >= 365) days++;
  }
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    gy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  let gd = days + 1;
  const sal_a = [0, 31, (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 0;
  for (gm = 0; gm < 13; gm++) {
    const v = sal_a[gm];
    if (gd <= v) break;
    gd -= v;
  }
  return [gy, gm, gd];
}

// Get Today's Jalali Date as "YYYY/MM/DD"
export function getTodayJalali(): string {
  const now = new Date();
  const [jy, jm, jd] = gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const mm = jm.toString().padStart(2, '0');
  const dd = jd.toString().padStart(2, '0');
  return `${jy}/${mm}/${dd}`;
}

// Get Full Persian Date Display: "دوشنبه، ۲۶ مرداد ۱۴۰۵"
export function getTodayFullPersian(): string {
  const now = new Date();
  const weekday = PERSIAN_WEEKDAYS[now.getDay()];
  const [jy, jm, jd] = gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const monthName = PERSIAN_MONTHS[jm - 1];
  return `${weekday}، ${toFaDigits(jd)} ${monthName} ${toFaDigits(jy)}`;
}

// Format "1405/05/26" to "۲۶ مرداد ۱۴۰۵"
export function formatJalaliReadable(jalaliStr: string): string {
  if (!jalaliStr) return '';
  const clean = toEnDigits(jalaliStr);
  const parts = clean.split('/');
  if (parts.length < 3) return jalaliStr;
  const jy = parseInt(parts[0], 10);
  const jm = parseInt(parts[1], 10);
  const jd = parseInt(parts[2], 10);
  if (isNaN(jm) || jm < 1 || jm > 12) return jalaliStr;
  const monthName = PERSIAN_MONTHS[jm - 1];
  return `${toFaDigits(jd)} ${monthName} ${toFaDigits(jy)}`;
}

// Relative days calculator: e.g. "۲۳ روز دیگر", "امروز", "فردا", "۳ روز پیش"
export function formatRelativeDays(jalaliStr: string): string {
  if (!jalaliStr) return '';
  try {
    const clean = toEnDigits(jalaliStr);
    const parts = clean.split('/');
    if (parts.length < 3) return jalaliStr;
    const jy = parseInt(parts[0], 10);
    const jm = parseInt(parts[1], 10);
    const jd = parseInt(parts[2], 10);

    const [gy, gm, gd] = jalaliToGregorian(jy, jm, jd);
    const targetDate = new Date(gy, gm - 1, gd);
    targetDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'امروز';
    if (diffDays === 1) return 'فردا';
    if (diffDays === 2) return 'پس‌فردا';
    if (diffDays === -1) return 'دیروز';
    if (diffDays > 0) {
      if (diffDays > 30) {
        const months = Math.floor(diffDays / 30);
        const remDays = diffDays % 30;
        return remDays > 0 ? `${toFaDigits(months)} ماه و ${toFaDigits(remDays)} روز دیگر` : `${toFaDigits(months)} ماه دیگر`;
      }
      return `${toFaDigits(diffDays)} روز دیگر`;
    } else {
      return `${toFaDigits(Math.abs(diffDays))} روز پیش`;
    }
  } catch {
    return jalaliStr;
  }
}

// Convert Jalali Date to JavaScript Date for sorting
export function jalaliToDate(jalaliStr: string, timeStr = '00:00'): Date {
  try {
    const clean = toEnDigits(jalaliStr);
    const [jy, jm, jd] = clean.split('/').map((x) => parseInt(x, 10));
    const [gy, gm, gd] = jalaliToGregorian(jy || 1400, jm || 1, jd || 1);
    const [h, m] = toEnDigits(timeStr).split(':').map((x) => parseInt(x, 10) || 0);
    return new Date(gy, gm - 1, gd, h, m, 0);
  } catch {
    return new Date();
  }
}

// Format Time in Persian: "۰۸:۳۰"
export function formatTimeFa(timeStr: string): string {
  if (!timeStr) return '';
  return toFaDigits(timeStr);
}

// Format Currency in Tomans: "۴۵۰,۰۰۰ تومان"
export function formatToman(amount: number | null | undefined): string {
  if (amount === undefined || amount === null) return '';
  const formatted = amount.toLocaleString('en-US');
  return `${toFaDigits(formatted)} تومان`;
}

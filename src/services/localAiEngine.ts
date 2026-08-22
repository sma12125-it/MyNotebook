// Local Ultra-Fast Smart Intelligence Engine for دفتر من (MyLifeOS)
// Runs 100% locally on the device with <20ms response time and comprehensive health understanding

import { AppState, UserProfile, Measurement, Medication, Reminder, MedicalVisit, LaboratoryTest, LifeEvent } from '../types';
import { getTodayJalali, toFaDigits } from '../utils/jalali';

export interface LocalExtractionResult {
  summary?: string;
  category?: string;
  topic?: string;
  measurements?: Array<{
    type: string;
    value: number;
    unit: string;
    notes?: string;
  }>;
  medication?: {
    name?: string;
    dosage?: string;
    form?: string;
    frequency?: string;
    times?: string[];
    notes?: string;
  };
  medicalVisit?: {
    doctorName?: string;
    specialty?: string;
    reason?: string;
    diagnosis?: string;
    followUpDate?: string;
    prescriptions?: string[];
  };
  reminder?: {
    title?: string;
    dueDate?: string;
    dueTime?: string;
    category?: string;
  };
  lifeEvent?: {
    title?: string;
    category?: string;
    cost?: number;
    description?: string;
  };
  note?: {
    text?: string;
  };
}

export class LocalAIEngine {
  /**
   * Generates a warm, direct, conversational, and hyper-accurate Persian answer
   * based on the user's complete data state.
   */
  static answerQuestion(question: string, state: AppState): string {
    const q = question.toLowerCase().trim();
    const profile: Partial<UserProfile> = state.profile || { name: 'کاربر گرامی' };
    const fullName = profile.fullName || profile.name || 'کاربر گرامی';
    const shortName = fullName.split(' ')[0] || 'عزیز';
    const today = getTodayJalali();

    const vitals: Measurement[] = state.vitals || [];
    const meds: Medication[] = state.medications || [];
    const reminders: Reminder[] = state.reminders || [];
    const visits: MedicalVisit[] = state.visits || [];
    const labs: LaboratoryTest[] = state.labs || [];
    const events: LifeEvent[] = state.events || [];

    // 1. Water Intake Queries
    if (/آب|لیوان|بطری|نوشیدن|هیدراتاسیون|تشنگی/i.test(q)) {
      const todayWater = vitals.filter(
        (m) => m.type === 'water_intake' && (m.recordedAtJalali === today || !m.recordedAtJalali)
      );
      const totalMl = todayWater.reduce((sum, item) => sum + (item.value || 0), 0);
      const glassCount = Math.round(totalMl / 250);
      const remainingMl = Math.max(0, 2000 - totalMl);
      const remainingGlasses = Math.ceil(remainingMl / 250);

      if (todayWater.length === 0) {
        return `سلام ${shortName} جانم! 💧\nامروز هنوز مصرف آبی برام ثبت نکردی.\n\nبرای حفظ شادابی پوست، سلامت کلیه‌ها و انرژی بدنت، هدف روزانه‌ات حداقل ۸ لیوان (۲۰۰۰ میلی‌لیتر) است.\nهمین حالا یه لیوان آب بنوش و با دکمه ثبت سریع این پایین بهم خبر بده! ✨`;
      }

      let logDetails = todayWater
        .map(
          (w) =>
            `• ${toFaDigits(w.value.toString())} میلی‌لیتر ${
              w.time || w.recordedTime ? `(ساعت ${toFaDigits((w.time || w.recordedTime || '').toString())})` : ''
            }`
        )
        .join('\n');

      let encouragement = '';
      if (totalMl >= 2000) {
        encouragement = `🎉 آفرین به پشتکار و نظمت! به هدف ۲۰۰۰ میلی‌لیتری امروزت رسیدی و کلیه‌هات در بهترین وضعیت هستن!`;
      } else {
        encouragement = `💪 تا رسیدن به هدف روزانه، فقط ${toFaDigits(
          remainingGlasses.toString()
        )} لیوان دیگه (حدود ${toFaDigits(remainingMl.toString())} ml) فاصله داری.`;
      }

      return `سلام ${shortName} جان! گزارش مصرف آب امروزت (${today}) اینجاست 🌿:\n\n` +
        `💧 **مجموع مصرف امروز:** ${toFaDigits(totalMl.toString())} میلی‌لیتر (حدود ${toFaDigits(
          glassCount.toString()
        )} لیوان)\n\n` +
        `سوابق ثبت‌شده امروز:\n${logDetails}\n\n${encouragement}`;
    }

    // 2. Blood Pressure & Vitals Queries
    if (/فشار|فشار خون|فشارم|سیستولیک|دیاستولیک/i.test(q)) {
      const sysRecords = vitals.filter((m) => m.type === 'blood_pressure_sys');
      const diaRecords = vitals.filter((m) => m.type === 'blood_pressure_dia');

      if (sysRecords.length === 0 || diaRecords.length === 0) {
        return `${shortName} عزیز، هنوز سابقه فشار خونی در پرونده‌ات ثبت نشده.\nمی‌تونی با دکمه «ثبت سریع» فشار خونت رو وارد کنی (مثلاً بنویس "فشار ۱۲ روی ۸") تا برات تحلیل و ثبتش کنم. 🩺`;
      }

      const lastSys = sysRecords[0];
      const lastDia = diaRecords[0];
      const sysVal = lastSys.value <= 25 ? lastSys.value * 10 : lastSys.value;
      const diaVal = lastDia.value <= 25 ? lastDia.value * 10 : lastDia.value;

      let statusMsg = '';
      if (sysVal <= 120 && diaVal <= 80) {
        statusMsg = '✅ وضعیت: در محدوده ایده‌آل و کاملاً نرمال';
      } else if (sysVal <= 130 && diaVal <= 85) {
        statusMsg = 'ℹ️ وضعیت: در محدوده طبیعی و مناسب';
      } else if (sysVal > 140 || diaVal > 90) {
        statusMsg = '⚠️ وضعیت: بالاتر از حد نرمال؛ توصیه می‌شود استراحت نموده و مصرف نمک را کاهش دهید و با پزشک مشورت کنید.';
      } else {
        statusMsg = 'ℹ️ وضعیت: در محدوده پیش‌فشارخون';
      }

      return `سلام ${shortName} جان! آخرین وضعیت فشار خون ثبت‌شده شما 🩺:\n\n` +
        `• **مقدار:** ${toFaDigits((sysVal / 10).toString())} روی ${toFaDigits((diaVal / 10).toString())} (${toFaDigits(
          sysVal.toString()
        )}/${toFaDigits(diaVal.toString())} mmHg)\n` +
        `• **تاریخ ثبت:** ${lastSys.recordedAtJalali || 'اخیراً'} ${
          lastSys.time ? `(ساعت ${toFaDigits(lastSys.time.toString())})` : ''
        }\n` +
        `• ${statusMsg}\n\n` +
        `اگر احساس سرگیجه، سردرد یا تپش قلب داری، حتماً استراحت کن و دوباره فشارت رو اندازه بگیر.`;
    }

    // 3. Weight & BMI Queries
    if (/وزن|وزنم|قد|bmi|شاخص توده|لاغری|چاقی|اضافه وزن/i.test(q)) {
      const weightRecs = vitals.filter((m) => m.type === 'weight');
      const height = profile.heightCm;
      const weight = weightRecs.length > 0 ? weightRecs[0].value : profile.weightKg;

      if (!weight) {
        return `${shortName} جان، هنوز وزنی در سامانه ثبت نکردی. می‌تونی از بخش «سنجش‌ها» یا با گفتن «وزن ۷۵ کیلو» وزنت رو وارد کنی.`;
      }

      let bmiInfo = '';
      if (height && weight) {
        const heightM = height / 100;
        const bmi = (weight / (heightM * heightM)).toFixed(1);
        let bmiCategory = '';
        if (parseFloat(bmi) < 18.5) bmiCategory = 'کم‌وزن';
        else if (parseFloat(bmi) < 25) bmiCategory = 'وزن متناسب و ایده‌آل 🌟';
        else if (parseFloat(bmi) < 30) bmiCategory = 'دارای اضافه وزن جزئی';
        else bmiCategory = 'چاقی';

        bmiInfo = `\n• **شاخص توده بدنی (BMI):** ${toFaDigits(bmi)} (${bmiCategory})\n• **قد:** ${toFaDigits(
          height.toString()
        )} سانتی‌متر`;
      }

      return `گزارش وزن شما (${shortName} عزیز) ⚖️:\n\n` +
        `• **آخرین وزن:** ${toFaDigits(weight.toString())} کیلوگرم` +
        `${weightRecs[0]?.recordedAtJalali ? ` (ثبت‌شده در ${weightRecs[0].recordedAtJalali})` : ''}\n` +
        bmiInfo +
        `\n\nبرای حفظ تناسب اندام، پیاده‌روی منظم و مصرف کافی آب بسیار مؤثره!`;
    }

    // 4. Medications Queries
    if (/دارو|قرص|کپسول|شربت|پماد|دوز|مصرف دارو|نسخه/i.test(q)) {
      const activeMeds = meds.filter((m) => m.isActive);
      if (activeMeds.length === 0) {
        return `سلام ${shortName} جان! در حال حاضر داروی فعالی در پرونده‌ات نداری. اگر دارویی مصرف می‌کنی، از بخش «داروها» اضافه‌اش کن تا سر وقت بهت یادآوری کنم. 💊`;
      }

      const medList = activeMeds
        .map((m, idx) => {
          const slots = (m.timeSlotLabels || []).join('، ');
          const stock = m.remainingQuantity !== undefined ? ` (موجودی: ${toFaDigits(m.remainingQuantity.toString())} عدد)` : '';
          return `${toFaDigits((idx + 1).toString())}. **${m.name}** - دوز: ${m.dosage || 'طبق دستور'}${
            slots ? ` | نوبت: ${slots}` : ''
          }${stock}${m.instructions ? ` | نحوه مصرف: ${m.instructions}` : ''}`;
        })
        .join('\n');

      return `سلام ${shortName} جانم! لیست داروهای فعال شما 💊:\n\n${medList}\n\n` +
        `💡 یادت نره داروهات رو سر ساعت میل کنی. با کلیک روی هر نوبت در صفحه خانه یا داروها، می‌تونی تیک مصرف رو بزنی.`;
    }

    // 5. Reminders & Tasks Queries
    if (/یادآور|کارها|موعد|برنامه|فراموش|وظایف|تمدید/i.test(q)) {
      const activeReminders = reminders.filter((r) => !r.isCompleted);
      if (activeReminders.length === 0) {
        return `${shortName} جان، در حال حاضر هیچ یادآوری انجام‌نشده‌ای نداری و همه کارهات به‌موقع انجام شدن! ✨`;
      }

      const remList = activeReminders
        .map(
          (r, i) =>
            `${toFaDigits((i + 1).toString())}. **${r.title}** - موعد: ${r.dueDateJalali || 'نامشخص'}${
              r.time || r.dueTime ? ` ساعت ${toFaDigits((r.time || r.dueTime || '').toString())}` : ''
            } (${r.category || 'عمومی'})`
        )
        .join('\n');

      return `لیست پیگیری‌ها و یادآوری‌های فعال شما، ${shortName} عزیز 📋:\n\n${remList}\n\n` +
        `هرکدوم رو که انجام دادی می‌تونی از بخش «یادآوری‌ها» تیک بزنی.`;
    }

    // 6. Doctor Visits Queries
    if (/دکتر|پزشک|ویزیت|مطب|نوبت دکتر|تخصص/i.test(q)) {
      if (visits.length === 0) {
        return `${shortName} عزیز، سابقه ویزیتی در پرونده پزشکی شما ثبت نشده است.`;
      }

      const visitList = visits
        .slice(0, 6)
        .map(
          (v, i) =>
            `${toFaDigits((i + 1).toString())}. **${v.doctorName || 'پزشک'}** (${v.specialty || 'عمومی'}) در تاریخ ${
              v.dateJalali || ''
            }\n   • علت مراجعه: ${v.reason || 'چکاپ'}\n   • تشخیص: ${v.diagnosis || 'ثبت نشده'}${
              v.instructions ? `\n   • دستورات: ${v.instructions}` : ''
            }`
        )
        .join('\n\n');

      return `سوابق مراجعات پزشکی شما، ${shortName} جان 🩺:\n\n${visitList}`;
    }

    // 7. Lab Tests Queries
    if (/آزمایش|تست|چکاپ|خون|قند خون|کلسترول|تیروئید/i.test(q)) {
      if (labs.length === 0) {
        return `${shortName} جان، سابقه آزمایشی در پرونده شما ثبت نشده است. هروقت آزمایش دادی می‌تونی برگه آزمایش یا متنش رو برام ثبت کنی. 🧪`;
      }

      const labList = labs
        .slice(0, 6)
        .map(
          (l, i) =>
            `${toFaDigits((i + 1).toString())}. **${l.testName}** (تاریخ: ${l.dateJalali})\n   • آزمایشگاه: ${
              l.laboratoryName || 'نامشخص'
            }\n   • نتیجه و خلاصه: ${l.summary || l.notes || 'طبیعی'}`
        )
        .join('\n\n');

      return `سوابق آزمایش‌های پزشکی شما، ${shortName} عزیز 🧪:\n\n${labList}`;
    }

    // 8. Vehicle & Life Events & Expenses
    if (/ماشین|خودرو|تعمیر|بنزین|بیمه|هزینه|خرج|رویداد/i.test(q)) {
      if (events.length === 0) {
        return `${shortName} جان، هنوز هزینه یا رویدادی برای خودرو یا زندگی ثبت نکردی.`;
      }

      let totalCost = 0;
      const eventList = events
        .slice(0, 8)
        .map((e, i) => {
          if (e.cost) totalCost += e.cost;
          return `${toFaDigits((i + 1).toString())}. **${e.title}** (${e.category || 'رویداد'}) - تاریخ: ${
            e.dateJalali || ''
          }${e.cost ? ` | هزینه: ${toFaDigits(e.cost.toLocaleString('fa-IR'))} تومان` : ''}${
            e.description ? `\n   ${e.description}` : ''
          }`;
        })
        .join('\n');

      return `سوابق هزینه‌ها و رویدادهای ثبت‌شده شما، ${shortName} عزیز 🚗:\n\n${eventList}\n\n` +
        `💰 **مجموع کل هزینه‌های اخیر:** ${toFaDigits(totalCost.toLocaleString('fa-IR'))} تومان`;
    }

    // 9. Medical Identity & Profile
    if (/شناسنامه|پروفایل|گروه خونی|آلرژی|حساسیت|بیماری|سابقه بیماری/i.test(q)) {
      return `شناسنامه سلامت و پرونده پزشکی شما (${fullName}) 🫀:\n\n` +
        `• **نام و نام خانوادگی:** ${fullName}\n` +
        `• **گروه خونی:** ${profile.bloodGroup || profile.bloodType || 'ثبت نشده'}\n` +
        `• **قد:** ${profile.heightCm ? `${toFaDigits(profile.heightCm.toString())} سانتی‌متر` : 'ثبت نشده'}\n` +
        `• **وزن:** ${profile.weightKg ? `${toFaDigits(profile.weightKg.toString())} کیلوگرم` : 'ثبت نشده'}\n` +
        `• **حساسیت‌ها:** ${(profile.allergies || []).length > 0 ? profile.allergies?.join('، ') : 'موردی ثبت نشده'}\n` +
        `• **بیماری‌های زمینه‌ای:** ${
          (profile.medicalConditions || []).length > 0 ? profile.medicalConditions?.join('، ') : 'موردی ثبت نشده'
        }\n` +
        `• **شماره اضطراری:** ${profile.emergencyContactPhone || 'ثبت نشده'}`;
    }

    // 10. Greetings & General Companion Interaction
    if (/سلام|درود|صبح بخیر|عصر بخیر|شب بخیر|چطوری|خوبی|هستی/i.test(q)) {
      const activeMeds = meds.filter((m) => m.isActive).length;
      const todayWater = vitals.filter(
        (m) => m.type === 'water_intake' && (m.recordedAtJalali === today || !m.recordedAtJalali)
      );
      const waterMl = todayWater.reduce((sum, item) => sum + (item.value || 0), 0);
      const pendingReminders = reminders.filter((r) => !r.isCompleted).length;

      return `سلام ${shortName} جانم! روز و شبت بخیر و سرشار از سلامتی و آرامش 🌿✨\n\n` +
        `من همنشین و دستیار هوشمند اختصاصی تو هستم و همیشه حواسم به سلامتی و برنامه‌هات هست:\n` +
        `• 💊 ${activeMeds > 0 ? `${toFaDigits(activeMeds.toString())} داروی فعال در برنامه داری` : 'داروی فعالی ثبت نشده'}\n` +
        `• 💧 ${waterMl > 0 ? `تا الان ${toFaDigits(waterMl.toString())} ml آب نوشیدی` : 'امروز هنوز آب ثبت نکردی'}\n` +
        `• ⏰ ${pendingReminders > 0 ? `${toFaDigits(pendingReminders.toString())} یادآوری پیش‌رو داری` : 'همه کارها انجام شدن'}\n\n` +
        `هر سوالی درباره سوابقت، مصرف آب، داروها، آزمایش‌ها یا رویدادها داری فقط بپرس تا فورا پاسخ بدم!`;
    }

    // Default intelligent overview
    return `سلام ${shortName} جان! به تمام اطلاعات پرونده و سلامت شما دسترسی کامل دارم 🌿\n\n` +
      `می‌توانید هریک از موارد زیر را بپرسید:\n` +
      `• «امروز چقدر آب خوردم؟» 💧\n` +
      `• «آخرین فشار خون یا وزنم چقدر بود؟» 🩺\n` +
      `• «لیست داروهای فعالم چیا هستند؟» 💊\n` +
      `• «یادآوری‌ها و کارهای امروز من چیه؟» ⏰\n` +
      `• «سوابق آزمایش‌ها و ویزیت‌های دکتر» 🧪\n` +
      `• «هزینه‌های ماشین و رویدادهای زندگی» 🚗\n\n` +
      `چه موردی را می‌خواهید با هم بررسی کنیم؟`;
  }

  /**
   * Fast Local NLP Parser for Persian natural language quick capture
   */
  static extractRecordLocally(text: string): LocalExtractionResult {
    const clean = text.trim();
    const measurements: Array<{ type: string; value: number; unit: string; notes?: string }> = [];
    let category = 'note';
    let topic = 'عمومی';

    // Water parsing
    const waterMatch =
      clean.match(/(?:آب|لیوان آب|بطری آب)\s*([۰-۹0-9]+)?/i) ||
      clean.match(/([۰-۹0-9]+)\s*(?:لیوان|سی‌سی|میلی‌لیتر|ml)\s*آب/i);
    if (waterMatch || clean.includes('آب خوردم') || clean.includes('لیوان آب')) {
      let amount = 250;
      if (clean.includes('بطری')) amount = 750;
      if (clean.includes('۲ لیوان') || clean.includes('دو لیوان')) amount = 500;
      if (clean.includes('۳ لیوان') || clean.includes('سه لیوان')) amount = 750;
      if (clean.includes('۱ لیتر') || clean.includes('یک لیتر')) amount = 1000;
      measurements.push({
        type: 'water_intake',
        value: amount,
        unit: 'میلی‌لیتر',
        notes: 'ثبت خودکار مصرف آب',
      });
      category = 'health_measurement';
      topic = 'سلامت';
    }

    // Weight parsing
    const weightMatch =
      clean.match(/(?:وزن|وزنم)?\s*([۰-۹0-9]+(?:\.[۰-۹0-9]+)?)\s*(?:کیلو|kg|کیلوگرم)/i) ||
      clean.match(/(?:وزنم|وزن)\s*([۰-۹0-9]+(?:\.[۰-۹0-9]+)?)/i);
    if (weightMatch) {
      const val = parseFloat(LocalAIEngine.toEnDigits(weightMatch[1]));
      if (val > 20 && val < 300) {
        measurements.push({
          type: 'weight',
          value: val,
          unit: 'kg',
          notes: 'ثبت خودکار وزن',
        });
        category = 'health_measurement';
        topic = 'سلامت';
      }
    }

    // Blood pressure parsing
    const bpMatch =
      clean.match(/(?:فشارم|فشار خون|فشار)\s*([۰-۹0-9]+)\s*(?:روی|\/)\s*([۰-۹0-9]+)/i) ||
      clean.match(/([۰-۹0-9]+)\s*\/\s*([۰-۹0-9]+)\s*(?:فشار)/i);
    if (bpMatch) {
      let sys = parseFloat(LocalAIEngine.toEnDigits(bpMatch[1]));
      let dia = parseFloat(LocalAIEngine.toEnDigits(bpMatch[2]));
      if (sys <= 25) sys = sys * 10;
      if (dia <= 25) dia = dia * 10;
      measurements.push(
        { type: 'blood_pressure_sys', value: sys, unit: 'mmHg', notes: 'سیستولیک' },
        { type: 'blood_pressure_dia', value: dia, unit: 'mmHg', notes: 'دیاستولیک' }
      );
      category = 'health_measurement';
      topic = 'سلامت';
    }

    return {
      summary: clean,
      category,
      topic,
      measurements,
      note: { text: clean },
    };
  }

  private static toEnDigits(str: string): string {
    const faDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    const arDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    let res = str;
    for (let i = 0; i < 10; i++) {
      res = res.replace(new RegExp(faDigits[i], 'g'), i.toString());
      res = res.replace(new RegExp(arDigits[i], 'g'), i.toString());
    }
    return res;
  }
}

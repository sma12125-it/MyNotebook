import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

// Dynamic Gemini AI client resolution
let defaultAiClient: GoogleGenAI | null = null;

function getGeminiAI(customKey?: string): GoogleGenAI | null {
  const apiKey = (customKey && customKey.trim()) || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  
  if (customKey && customKey.trim()) {
    return new GoogleGenAI({
      apiKey: customKey.trim(),
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  if (!defaultAiClient) {
    defaultAiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return defaultAiClient;
}

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Test Gemini API Key endpoint
app.post('/api/ai/test-key', async (req, res) => {
  try {
    const { apiKey } = req.body;
    if (!apiKey || typeof apiKey !== 'string') {
      return res.status(400).json({ success: false, message: 'کلید API الزامی است' });
    }

    const testClient = new GoogleGenAI({ apiKey: apiKey.trim() });
    const response = await testClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'سلام، فقط پاسخ بده: تست موفقیت‌آمیز بود',
    });

    if (response.text) {
      return res.json({ success: true, message: 'اتصال به Gemini با موفقیت برقرار شد ✨' });
    }
    return res.json({ success: false, message: 'پاسخی از مدل دریافت نشد' });
  } catch (err: any) {
    return res.json({ success: false, message: 'خطا در اعتبارسنجی کلید: ' + (err?.message || 'کلید نامعتبر است') });
  }
});

// AI Quick Capture & Voice Extraction endpoint
app.post('/api/ai/extract', async (req, res) => {
  try {
    const customKey = (req.headers['x-gemini-api-key'] as string) || req.body?.customApiKey;
    const { text, currentDate } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'متن ورودی الزامی است' });
    }

    const ai = getGeminiAI(customKey);
    if (!ai) {
      const extracted = fallbackExtract(text, currentDate);
      return res.json({ success: true, data: extracted, source: 'fallback' });
    }

    const prompt = `شما دستیار هوشمند و بسیار دقیق برای برنامه فارسی «دفتر من» (مدیریت زندگی و سلامت فردی) هستید.
کاربر یک جمله یا یادداشت صوتی/متنی به زبان فارسی گفته است.
تاریخ جاری شمسی: ${currentDate || 'امروز'}.

وظیفه شما استخراج دقیق اطلاعات ساختاریافته از متن زیر است:
- مصرف آب (water_intake): مقدار به میلی‌لیتر (مثلا ۱ لیوان=250، ۲ لیوان=500، ۱ بطری=750 یا 1000)
- سنجش‌های سلامت: وزن (weight)، فشار خون سیستولیک و دیاستولیک (blood_pressure_sys, blood_pressure_dia)، قند خون (blood_glucose)، ضربان قلب (heart_rate)، اکسیژن خون (blood_oxygen)، دمای بدن (body_temperature)، ساعات خواب (sleep_hours).
- داروها: نام دارو، دوز، فرم (قرص/کپسول/شربت)، تعداد دفعات و زمان مصرف.
- ویزیت پزشک: نام پزشک، تخصص، علت مراجعه، تشخیص و نسخه.
- آزمایش: نام آزمایش، فاکتورها، مقادیر.
- یادآوری: عنوان، تاریخ موعد، ساعت، دسته‌بندی.
- رویداد زندگی/خودرو/هزینه: عنوان، دسته‌بندی (car, home, finance, general)، مبلغ به تومان، توضیحات.
- یادداشت ساده روزانه.

متن کاربر: "${text}"

پاسخ را دقیقا به صورت JSON با ساختار زیر ارسال کنید:
{
  "summary": "خلاصه کوتاه و روان به فارسی",
  "category": "health_measurement" | "medication" | "medical_visit" | "lab_test" | "reminder" | "life_event" | "note",
  "topic": "سلامت" | "خودرو" | "خانه" | "مالی" | "شخصی",
  "measurements": [
    {
      "type": "weight" | "water_intake" | "blood_pressure_sys" | "blood_pressure_dia" | "heart_rate" | "blood_oxygen" | "blood_glucose" | "body_temperature" | "sleep_hours",
      "value": number,
      "unit": string,
      "notes": string
    }
  ],
  "medication": {
    "name": string,
    "dosage": string,
    "form": string,
    "frequency": string,
    "times": string[],
    "notes": string
  },
  "medicalVisit": {
    "doctorName": string,
    "specialty": string,
    "reason": string,
    "diagnosis": string,
    "followUpDate": string,
    "prescriptions": string[]
  },
  "reminder": {
    "title": string,
    "dueDate": string,
    "dueTime": string,
    "category": string
  },
  "lifeEvent": {
    "title": string,
    "category": string,
    "cost": number,
    "description": string
  },
  "note": {
    "text": string
  }
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

    const outputText = response.text || '{}';
    let parsedData;
    try {
      parsedData = JSON.parse(outputText);
    } catch {
      parsedData = fallbackExtract(text, currentDate);
    }

    res.json({ success: true, data: parsedData, source: 'gemini' });
  } catch (error: any) {
    console.error('AI Extract error:', error);
    const extracted = fallbackExtract(req.body.text || '', req.body.currentDate);
    res.json({ success: true, data: extracted, source: 'fallback_on_error' });
  }
});

// AI Audio Transcribe and Extract (Direct Voice input support)
app.post('/api/ai/audio-transcribe', async (req, res) => {
  try {
    const customKey = (req.headers['x-gemini-api-key'] as string) || req.body?.customApiKey;
    const { audioBase64, mimeType = 'audio/webm', currentDate } = req.body;
    if (!audioBase64) {
      return res.status(400).json({ error: 'فایل صوتی الزامی است' });
    }

    const ai = getGeminiAI(customKey);
    if (!ai) {
      return res.status(503).json({ error: 'سرویس هوش مصنوعی صوتی موقتاً فعال نیست' });
    }

    const prompt = `این یک یادداشت صوتی به زبان فارسی از کاربر سامانه «دفتر من» است.
۱. ابتدا صدا را با دقت بالا به متن فارسی تبدیل کن.
۲. سپس اطلاعات مربوط به سلامت، مصرف آب، دارو، ویزیت، هزینه خودرو، یادآوری یا یادداشت را استخراج کن.
پاسخ را به صورت JSON با فیلدهای transcript (متن دقیق فارسی پیاده‌شده) و data (ساختار استخراج‌شده) ارسال کن.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: audioBase64.replace(/^data:audio\/\w+;base64,/, ''),
                mimeType: mimeType || 'audio/webm',
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, ...parsed });
  } catch (error: any) {
    console.error('Audio Transcribe error:', error);
    res.status(500).json({ error: 'خطا در پردازش صدا با هوش مصنوعی', details: error.message });
  }
});

// Upgraded Full-Context Conversational AI Assistant endpoint
app.post('/api/ai/chat', async (req, res) => {
  try {
    const customKey = (req.headers['x-gemini-api-key'] as string) || req.body?.customApiKey;
    const { question, userContext } = req.body;
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'پرسش الزامی است' });
    }

    const ai = getGeminiAI(customKey);
    if (!ai) {
      const fallbackAns = generateFallbackChatAnswer(question, userContext);
      return res.json({
        answer: fallbackAns,
        source: 'local_engine',
      });
    }

    const systemPrompt = `شما «دستیار هوشمند و همنشین صمیمی دفتر من» هستید؛ یک دستیار شخصی فوق‌العاده باهوش، دقیق، دلسوز، سریع و محرم که دسترسی کامل به کلیه اطلاعات و سوابق پرونده کاربر دارد.

دستورالعمل‌های کلیدی ارتباط با کاربر:
۱. شما با کاربر به صورت کاملاً صمیمی، همدلانه، مستقیم و گرم صحبت می‌کنی (مانند یک دوست و مشاور سلامتی بسیار نزدیک که نام کاربر را صدا می‌زند: مثلاً «[نام کاربر] جان» یا «[نام کاربر] عزیز»).
۲. به کلیه اطلاعات پرونده، سوابق سلامت، داروها، سنجش‌ها (فشار خون، قند، وزن، آب و...)، ویزیت‌ها، آزمایش‌ها، اسناد، یادآوری‌ها، وقایع زندگی، هزینه‌ها و خودرو کاربر دسترسی داری.
۳. در صورتی که کاربر درباره سوابق گذشته یا وضعیت فعلی‌اش سوالی پرسید (مثلاً "امروز چقدر آب خوردم؟"، "آخرین فشارم کی بود؟"، "داروهام چیا هستن؟"، "هزینه‌های ماشینم چقدر شده؟") دقیقاً ارقام و تاریخ‌های سوابق را بگو و راهنمایی محبت‌آمیز مرتبط بده.
۴. کاربر باید احساس کند اپلیکیشن با او حرف می‌زند و حواسش به تمام جزئیات روزمره و سلامتی‌اش هست.
۵. از قالب‌بندی خوانا (بولِت‌پوینت، تیترهای تمیز، ایموجی‌های مناسب، اعداد فارسی) استفاده کن.
۶. هرگز تشخیص قطعی پزشکی صادر نکن، اما توصیه‌ها و هشدارهای مراقبتی و دارویی دلسوزانه بده.
۷. اگر موردی در داده‌ها وجود نداشت با صداقت و مهربانی بگو که هنوز ثبت نشده و پیشنهاد بده همین حالا با هم ثبتش کنید.

اطلاعات و سوابق ثبت‌شده کاربر (Context):
${JSON.stringify(userContext || {}, null, 2)}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: systemPrompt },
            { text: `پرسش کاربر: ${question}` },
          ],
        },
      ],
      config: {
        temperature: 0.3,
      },
    });

    const text = response.text?.trim();
    if (text) {
      return res.json({ answer: text, source: 'gemini' });
    }

    const fallbackAns = generateFallbackChatAnswer(question, userContext);
    res.json({ answer: fallbackAns, source: 'local_fallback' });
  } catch (error: any) {
    console.warn('AI Chat error, falling back to local engine:', error?.message);
    const fallbackAns = generateFallbackChatAnswer(req.body?.question || '', req.body?.userContext);
    res.json({ answer: fallbackAns, source: 'local_error_fallback' });
  }
});

// AI Medical / Health Summarizer endpoint
app.post('/api/ai/summarize', async (req, res) => {
  try {
    const customKey = (req.headers['x-gemini-api-key'] as string) || req.body?.customApiKey;
    const { type, records } = req.body;
    const ai = getGeminiAI(customKey);
    if (!ai) {
      return res.json({
        summary: generateFallbackSummary(type, records),
        source: 'local_engine',
      });
    }

    const prompt = `شما دستیار خلاصه‌ساز پرونده شخصی و سلامت در «دفتر من» هستید. خلاصه‌ای بسیار حرفه‌ای، منظم و ساختاریافته به زبان فارسی برای دسته‌بندی «${type || 'سوابق سلامت'}» تولید کنید.
بخش‌بندی مشخص، بولت‌پوینت‌های خوانا و قالب‌بندی با اعداد فارسی ایجاد کنید.

سوابق:
${JSON.stringify(records || [], null, 2)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: { temperature: 0.2 },
    });

    if (response.text?.trim()) {
      return res.json({ summary: response.text, source: 'gemini' });
    }

    res.json({
      summary: generateFallbackSummary(type, records),
      source: 'local_fallback',
    });
  } catch (error: any) {
    console.error('Summarize error:', error);
    res.json({
      summary: generateFallbackSummary(req.body?.type, req.body?.records),
      source: 'local_error_fallback',
    });
  }
});

// Fallback chat answer generator with warm, conversational tone
function generateFallbackChatAnswer(question: string, context?: any): string {
  const q = question.toLowerCase().trim();
  const userName = context?.name || 'کاربر گرامی';
  const shortName = userName.split(' ')[0];
  const meds: string[] = context?.currentMedications || [];
  const vitals: string[] = context?.recentMeasurements || [];
  const water: string[] = context?.waterToday || [];
  const reminders: string[] = context?.activeReminders || [];
  const visits: string[] = context?.recentVisits || [];
  const labs: string[] = context?.recentLabs || [];
  const events: string[] = context?.recentEvents || [];
  const allergies: string[] = context?.allergies || [];
  const conditions: string[] = context?.medicalConditions || [];
  const bloodGroup = context?.bloodGroup;

  // Water question
  if (/آب|لیوان|نوشیدن|هیدراتاسیون/i.test(q)) {
    if (water.length === 0) {
      return `سلام ${shortName} جانم! 💧\nامروز هنوز مصرف آبی برام ثبت نکردی. برای اینکه بدنت شاداب بمونه و کلیه‌هات در سلامت کامل باشن، همین الان یه لیوان آب خنک بنوش و با دکمه ثبت سریع این پایین بهم خبر بده!`;
    }
    return `سلام ${shortName} جان! گزارش مصرف آب امروزت اینجاست 🌿:\n\n` +
      water.map((w) => `• ${w}`).join('\n') +
      `\n\nحواسم به هیدراتاسیون بدنت هست! هر زمان آب نوشیدی خوشحال میشم ثبتش کنی.`;
  }

  // Medications
  if (/دارو|قرص|کپسول|شربت|پماد|مصرف|دوز|نسخه/i.test(q)) {
    if (meds.length === 0) {
      return `سلام ${shortName} عزیز! در حال حاضر داروی فعالی در پرونده‌ات ثبت نشده. اگر دارویی مصرف می‌کنی، از بخش «داروها» اضافه‌اش کن تا سر وقت یادآوری کنم.`;
    }
    return `سلام ${shortName} جانم! لیست داروهای فعال و دوز مصرفی‌ات 💊:\n\n` +
      meds.map((m) => `• ${m}`).join('\n') +
      `\n\nحواست باشه سر وقت مصرفشون کنی تا همیشه در اوج سلامتی باشی!`;
  }

  // Vitals & measurements
  if (/فشار|وزن|قند|نبض|ضربان|اکسیژن|قد|bmi|سنجش|علائم/i.test(q)) {
    if (vitals.length === 0) {
      return `${shortName} عزیز، هنوز سنجش علائم حیاتی جدیدی ثبت نکردی. می‌تونی با دکمه «ثبت سریع» فشار، قند، وزن یا خوابت رو برام بفرستی تا تحلیلش کنم.`;
    }
    return `${shortName} جان، آخرین وضعیت سنجش‌های ثبت‌شده‌ات 🩺:\n\n` +
      vitals.slice(0, 8).map((v) => `• ${v}`).join('\n') +
      `\n\nمراقب فشار خون و تغذیه‌ات باش تا همیشه شاداب باشی.`;
  }

  // Reminders
  if (/یادآور|موعد|کارها|برنامه|تمدید|فراموش/i.test(q)) {
    if (reminders.length === 0) {
      return `${shortName} جان، در حال حاضر هیچ یادآوری انجام‌نشده‌ای نداری و همه کارها سر جاشونه! ✨`;
    }
    return `${shortName} عزیز، این کارها و یادآوری‌ها رو برات آماده کردم تا یادت نره 📋:\n\n` +
      reminders.map((r) => `• ${r}`).join('\n');
  }

  // Labs
  if (/آزمایش|تست|چکاپ|خون/i.test(q)) {
    if (labs.length === 0) {
      return `${shortName} جان، هنوز سابقه آزمایشی ثبت نکردی. هروقت آزمایش دادی می‌تونی عکس یا متنش رو برام آپلود کنی.`;
    }
    return `سوابق آزمایش‌های پزشکی شما، ${shortName} عزیز 🧪:\n\n` +
      labs.map((l) => `• ${l}`).join('\n');
  }

  // Visits
  if (/دکتر|پزشک|ویزیت|مطب|نوبت/i.test(q)) {
    if (visits.length === 0) {
      return `${shortName} جان، ویزیت یا مراجعه پزشکی ثبت‌شده‌ای نداری.`;
    }
    return `سوابق ویزیت‌های پزشکی‌ات، ${shortName} عزیز 🩺:\n\n` +
      visits.map((v) => `• ${v}`).join('\n');
  }

  // Events / Car / Expenses
  if (/ماشین|خودرو|رویداد|هزینه|خرج|تعمیر|بیمه|خانه/i.test(q)) {
    if (events.length === 0) {
      return `${shortName} جان، هنوز رویداد یا هزینه خودرو و خانه‌ای ثبت نکردی.`;
    }
    return `سوابق رویدادها و هزینه‌های ثبت‌شده‌ات، ${shortName} عزیز 🚗:\n\n` +
      events.map((e) => `• ${e}`).join('\n');
  }

  // Medical profile
  if (/حساسیت|آلرژی|بیماری|گروه خونی|پرونده|پروفایل/i.test(q)) {
    let details = `شناسنامه سلامت و پزشکی شما، ${shortName} جان 🫀:\n\n`;
    if (bloodGroup) details += `• گروه خونی: ${bloodGroup}\n`;
    details += `• حساسیت‌ها: ${allergies.length > 0 ? allergies.join('، ') : 'موردی ثبت نشده'}\n`;
    details += `• سوابق بیماری: ${conditions.length > 0 ? conditions.join('، ') : 'موردی ثبت نشده'}`;
    return details;
  }

  return `سلام ${shortName} جانم! من همنشین و دستیار اختصاصی تو در «دفتر من» هستم 🌿
من همیشه بیدارم و حواسم به سلامتی، داروها، مصرف آب و کارهای روزمره‌ات هست.

خلاصه وضعیت فعلی‌ات:
${meds.length > 0 ? `• 💊 داروها: ${meds.length} داروی فعال` : ''}
${vitals.length > 0 ? `• 🩺 آخرین سنجش: ${vitals[0]}` : ''}
${water.length > 0 ? `• 💧 مصرف آب امروز: ثبت‌شده` : '• 💧 مصرف آب: هنوز ثبت نکردی'}
${reminders.length > 0 ? `• ⏰ یادآوری‌ها: ${reminders.length} کار پیش‌رو` : ''}

هر سوالی داری یا اگر می‌خوای چیزی رو برات ثبت و یادداشت کنم، فقط کافیه بهم بگی! ✨`;
}

function generateFallbackSummary(type: string = 'سوابق سلامت', records: any[] = []): string {
  if (!records || records.length === 0) {
    return `خلاصه پرونده ${type}:\nموردی برای نمایش در این بخش ثبت نشده است.`;
  }
  return `### خلاصه ساختاریافته ${type}\n` +
    `تعداد کل سوابق ثبت‌شده: ${records.length} مورد\n\n` +
    records.slice(0, 10).map((r, i) => {
      const title = r.title || r.name || r.testName || r.doctorName || `مورد شماره ${i + 1}`;
      const date = r.dateJalali || r.recordedAtJalali || r.dueDateJalali || '';
      const notes = r.notes || r.reason || r.dosage || r.description || '';
      return `• **${title}** ${date ? `(${date})` : ''}${notes ? ` - ${notes}` : ''}`;
    }).join('\n') +
    `\n\n*تهیه‌شده توسط سامانه پرونده شخصی دفتر من*`;
}

function fallbackExtract(text: string, currentDate?: string) {
  const clean = text.trim();
  const measurements: any[] = [];
  let category = 'note';
  let topic = 'عمومی';
  let summary = clean;

  // Water
  const waterMatch = clean.match(/(?:آب|لیوان آب|بطری آب)\s*([۰-۹0-9]+)?/i) || clean.match(/([۰-۹0-9]+)\s*(?:لیوان|سی‌سی|میلی‌لیتر|ml)\s*آب/i);
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

  // Weight
  const weightMatch = clean.match(/(?:وزن|وزنم)?\s*([۰-۹0-9]+(?:\.[۰-۹0-9]+)?)\s*(?:کیلو|kg|کیلوگرم)/i) ||
                      clean.match(/(?:وزنم|وزن)\s*([۰-۹0-9]+(?:\.[۰-۹0-9]+)?)/i);
  if (weightMatch) {
    const val = parseFloat(toEnDigits(weightMatch[1]));
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

  // Blood pressure
  const bpMatch = clean.match(/(?:فشارم|فشار خون|فشار)\s*([۰-۹0-9]+)\s*(?:روی|\/)\s*([۰-۹0-9]+)/i) ||
                  clean.match(/([۰-۹0-9]+)\s*\/\s*([۰-۹0-9]+)\s*(?:فشار)/i);
  if (bpMatch) {
    let sys = parseFloat(toEnDigits(bpMatch[1]));
    let dia = parseFloat(toEnDigits(bpMatch[2]));
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
    summary,
    category,
    topic,
    measurements,
    note: { text: clean },
  };
}

function toEnDigits(str: string): string {
  const faDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  let res = str;
  for (let i = 0; i < 10; i++) {
    res = res.replace(new RegExp(faDigits[i], 'g'), i.toString());
    res = res.replace(new RegExp(arDigits[i], 'g'), i.toString());
  }
  return res;
}

// Start Server & mount Vite
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`دفتر من (MyLifeOS) running on http://localhost:${PORT}`);
  });
}

startServer();

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

// Lazy initialize Gemini AI client
let aiClient: GoogleGenAI | null = null;
function getGeminiAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// AI Quick Capture Extraction endpoint
app.post('/api/ai/extract', async (req, res) => {
  try {
    const { text, currentDate } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'متن ورودی الزامی است' });
    }

    const ai = getGeminiAI();
    if (!ai) {
      // Rule-based fallback if API key is not yet set
      const extracted = fallbackExtract(text, currentDate);
      return res.json({ success: true, data: extracted, source: 'fallback' });
    }

    const prompt = `You are a Persian smart assistant for the app "دفتر من" (My Life & Health OS).
The user provided a natural language sentence in Persian to record health, medical, medication, reminder, or personal life event information.
Current date (Jalali context): ${currentDate || 'امروز'}.

Analyze the sentence and extract structured items.
Extract any of the following if present:
1. Health measurements (weight, systolic blood pressure, diastolic blood pressure, heart rate, blood oxygen, temperature, blood sugar, sleep hours, mood 1-5).
2. Medications (name, dosage, frequency, times of day, duration, notes).
3. Medical visit (doctor name, specialty, diagnosis, reason, follow up date).
4. Laboratory test (test name, laboratory, result values).
5. Reminders (title, due date/time, category).
6. Personal life events (car maintenance, home repair, insurance, bill, travel, purchase, general note).
7. Topic suggestion (e.g. سلامت, خودرو, خانه, مالی, عمومی).

User sentence: "${text}"

Return JSON matching this exact structure:
{
  "summary": "خلاصه کوتاه و روان به فارسی",
  "category": "health_measurement" | "medication" | "medical_visit" | "lab_test" | "reminder" | "life_event" | "note",
  "topic": "سلامت" | "خودرو" | "خانه" | "مالی" | "شخصی",
  "measurements": [
    {
      "type": "weight" | "blood_pressure_sys" | "blood_pressure_dia" | "heart_rate" | "blood_oxygen" | "blood_glucose" | "temperature" | "sleep_hours" | "mood",
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
    // Fallback gracefully so user experience is uninterrupted
    const extracted = fallbackExtract(req.body.text || '', req.body.currentDate);
    res.json({ success: true, data: extracted, source: 'fallback_on_error' });
  }
});

// AI Assistant Chat & Q&A endpoint
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { question, userContext } = req.body;
    if (!question) {
      return res.status(400).json({ error: 'پرسش الزامی است' });
    }

    const ai = getGeminiAI();
    if (!ai) {
      return res.json({
        answer: 'سرویس هوش مصنوعی در حال حاضر در حالت آفلاین/محلی است. لطفاً کلید API را در تنظیمات بررسی کنید. اطلاعات شما به صورت کاملاً امن در دستگاه شما نگهداری می‌شود.',
      });
    }

    const prompt = `شما دستیار هوشمند، بسیار دقیق، محترمانه و امین در سامانه «دفتر من» (My Life & Health OS) هستید.
وظیفه شما پاسخ به سوالات کاربر بر اساس سوابق و اطلاعات ثبت‌شده واقعی او است.

قوانین بسیار مهم:
۱. فقط و فقط بر اساس داده‌های ذخیره‌شده زیر پاسخ دهید.
۲. هرگز داده یا سابقه جعلی اختراع نکنید. اگر چیزی ثبت نشده بود، صریح و محترمانه بگویید که در سوابق ثبت نشده است.
۳. هرگز تشخیص پزشکی قطعی صادر نکنید. همیشه از لحن خنثی و گزارشی استفاده کنید.
۴. زبان پاسخ منحصراً فارسی روان و صمیمی باشد. از اعداد فارسی استفاده کنید.

اطلاعات و سوابق ثبت‌شده کاربر:
${JSON.stringify(userContext || {}, null, 2)}

پرسش کاربر:
${question}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        temperature: 0.3,
      },
    });

    res.json({ answer: response.text || 'پاسخی دریافت نشد.' });
  } catch (error: any) {
    console.error('AI Chat error:', error);
    res.status(500).json({ error: 'خطا در ارتباط با دستیار هوشمند' });
  }
});

// AI Medical / Health Summarizer endpoint
app.post('/api/ai/summarize', async (req, res) => {
  try {
    const { type, records } = req.body;
    const ai = getGeminiAI();
    if (!ai) {
      return res.json({
        summary: 'خلاصه سوابق به صورت محلی: ' + (records ? `${records.length} مورد ثبت شده است.` : 'موردی یافت نشد.'),
      });
    }

    const prompt = `شما یک دستیار خلاصه ساز پرونده شخصی هستید. خلاصه ای حرفه ای، ساختاریافته و کوتاه به زبان فارسی برای نوع «${type || 'سوابق سلامت'}» آماده کنید تا کاربر بتواند در مراجعه به پزشک یا مرور شخصی از آن استفاده کند.
قوانین: عدم تشخیص پزشکی، فقط بازتاب و دسته‌بندی سوابق، استفاده از بولت‌پوینت‌های خوانا.

سوابق:
${JSON.stringify(records, null, 2)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: { temperature: 0.2 },
    });

    res.json({ summary: response.text });
  } catch (error: any) {
    console.error('Summarize error:', error);
    res.status(500).json({ error: 'خطا در خلاصه‌سازی' });
  }
});

// Intelligent Persian rule-based fallback extractor
function fallbackExtract(text: string, currentDate?: string) {
  const clean = text.trim();
  const measurements: any[] = [];
  let category = 'note';
  let topic = 'عمومی';
  let summary = clean;

  // Weight extraction (e.g. وزنم ۸۲ کیلو / وزن 82.5 / 82 kg)
  const weightMatch = clean.match(/(?:وزن|وزنم|وزن من)?\s*([۰-۹0-9]+(?:\.[۰-۹0-9]+)?)\s*(?:کیلو|kg|کیلوگرم)/i) ||
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

  // Blood Pressure extraction (e.g. فشارم ۱۲ روی ۸ / فشار ۱۲۰ روی ۸۰ / 12/8)
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

  // Heart Rate (e.g. ضربان قلبم ۷۵ / نبض 80)
  const hrMatch = clean.match(/(?:ضربان|نبض|ضربان قلب)\s*([۰-۹0-9]+)/i);
  if (hrMatch) {
    const hr = parseFloat(toEnDigits(hrMatch[1]));
    if (hr >= 30 && hr <= 220) {
      measurements.push({
        type: 'heart_rate',
        value: hr,
        unit: 'bpm',
        notes: 'ضربان قلب',
      });
      category = 'health_measurement';
      topic = 'سلامت';
    }
  }

  // Blood glucose (e.g. قند خونم ۹۵ / قند ناشتا 110)
  const bgMatch = clean.match(/(?:قند|قند خون|قند ناشتا)\s*([۰-۹0-9]+)/i);
  if (bgMatch) {
    const bg = parseFloat(toEnDigits(bgMatch[1]));
    measurements.push({
      type: 'blood_glucose',
      value: bg,
      unit: 'mg/dL',
      notes: 'قند خون',
    });
    category = 'health_measurement';
    topic = 'سلامت';
  }

  // Car event (روغن، بنزین، بیمه ماشین، سرویس خودرو)
  let lifeEvent: any = undefined;
  if (/ماشین|خودرو|تعویض روغن|لاستیک|بنزین|معاینه فنی|سرویس/.test(clean)) {
    category = 'life_event';
    topic = 'خودرو';
    lifeEvent = {
      title: clean.slice(0, 40),
      category: 'car',
      description: clean,
    };
  }

  // Reminder (یادآوری، فراموش نکنم، دو ماه دیگه، فردا)
  let reminder: any = undefined;
  if (/یادآوری|فراموش نکنم|باید|قراره|جلسه|تمدید/.test(clean)) {
    category = 'reminder';
    reminder = {
      title: clean.slice(0, 40),
      dueDate: currentDate || '',
      category: topic === 'خودرو' ? 'car' : topic === 'سلامت' ? 'medication' : 'general',
    };
  }

  return {
    summary,
    category,
    topic,
    measurements,
    lifeEvent,
    reminder,
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

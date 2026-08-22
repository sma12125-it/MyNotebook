// AI & Voice Services for دفتر من (MyLifeOS)
import { getTodayJalali, getCurrentTime, toFaDigits } from '../utils/jalali';
import { StorageService } from './storage';
import { UserProfile, AppState } from '../types';
import { LocalAIEngine, LocalExtractionResult } from './localAiEngine';

export interface ExtractionResult extends LocalExtractionResult {}

export class AIService {
  // Extract structured record from Persian sentence
  static async extractRecord(text: string): Promise<ExtractionResult> {
    // 1. Try local extraction first for immediate zero-latency output
    const localResult = LocalAIEngine.extractRecordLocally(text);

    try {
      const customKey = StorageService.getCustomApiKey();
      const response = await fetch('/api/ai/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(customKey ? { 'x-gemini-api-key': customKey } : {}),
        },
        body: JSON.stringify({
          text,
          customApiKey: customKey || undefined,
          currentDate: getTodayJalali(),
        }),
      });

      if (!response.ok) {
        return localResult;
      }

      const resJson = await response.json();
      return resJson.data || localResult;
    } catch (error) {
      console.warn('AI extraction fallback to local engine:', error);
      return localResult;
    }
  }

  // Audio Transcribe & Extract
  static async transcribeAudio(audioBlob: Blob): Promise<{ transcript?: string; data?: ExtractionResult }> {
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
      });
      reader.readAsDataURL(audioBlob);
      const audioBase64 = await base64Promise;

      const customKey = StorageService.getCustomApiKey();
      const response = await fetch('/api/ai/audio-transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(customKey ? { 'x-gemini-api-key': customKey } : {}),
        },
        body: JSON.stringify({
          audioBase64,
          customApiKey: customKey || undefined,
          mimeType: audioBlob.type || 'audio/webm',
          currentDate: getTodayJalali(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      console.error('Audio transcribe error:', err);
      throw err;
    }
  }

  // Ask AI with full user context and instant Local Engine fallback
  static async askQuestion(question: string): Promise<string> {
    const state: AppState = StorageService.getAllState();

    try {
      const profile: Partial<UserProfile> = state.profile || { id: 'user-default', name: 'کاربر' };
      const today = getTodayJalali();

      const waterLogs = (state.vitals || []).filter(
        (m) => m?.type === 'water_intake'
      );
      const todayWaterLogs = waterLogs.filter((m) => m?.recordedAtJalali === today);
      const totalWaterTodayMl = todayWaterLogs.reduce((acc, cur) => acc + (cur.value || 0), 0);

      const userContext = {
        name: profile?.name || profile?.fullName || 'کاربر',
        birthDate: profile?.birthDateJalali || profile?.birthYearJalali,
        bloodGroup: profile?.bloodGroup || profile?.bloodType,
        heightCm: profile?.heightCm,
        weightKg: profile?.weightKg,
        allergies: profile?.allergies || [],
        medicalConditions: profile?.medicalConditions || [],
        notes: profile?.notes,
        waterToday: [
          `مجموع آب امروز: ${toFaDigits(totalWaterTodayMl.toString())} میلی‌لیتر (حدود ${toFaDigits(Math.round(totalWaterTodayMl / 250).toString())} لیوان)`,
          ...todayWaterLogs.map(
            (w) => `${toFaDigits(w.value.toString())} میلی‌لیتر در ساعت ${w.time || w.recordedTime || ''} (${w.notes || 'مصرف آب'})`
          ),
        ],
        currentMedications: (state.medications || []).map(
          (m) => `${m.name} (${m.dosage || ''}) - زمان: ${m.frequency || ''} ${m.instructions ? `- نحوه: ${m.instructions}` : ''} - باقیمانده: ${m.remainingQuantity || 0}`
        ),
        recentMeasurements: (state.vitals || []).slice(0, 15).map(
          (m) => `${m.type}: ${toFaDigits(m.value.toString())} ${m.unit} در تاریخ ${m.recordedAtJalali || ''} ${m.time ? `ساعت ${m.time}` : ''} (${m.notes || ''})`
        ),
        recentVisits: (state.visits || []).slice(0, 8).map(
          (v) => `${v.doctorName || ''} (${v.specialty || ''}) در تاریخ ${v.dateJalali || ''} - علت: ${v.reason || ''} - تشخیص: ${v.diagnosis || ''} - توصیه: ${v.instructions || ''}`
        ),
        recentLabs: (state.labs || []).slice(0, 8).map(
          (l) => `${l.testName} در تاریخ ${l.dateJalali} - آزمایشگاه: ${l.laboratoryName || ''} - نتیجه: ${l.summary || ''}`
        ),
        activeReminders: (state.reminders || []).filter((r) => !r.isCompleted).map(
          (r) => `${r.title} برای موعد ${r.dueDateJalali || ''} ساعت ${r.time || r.dueTime || ''} (${r.category || ''})`
        ),
        recentEvents: (state.events || []).slice(0, 10).map(
          (e) => `${e.title} (${e.category || ''}) در تاریخ ${e.dateJalali || ''} ${e.cost ? `- مبلغ: ${toFaDigits(e.cost.toLocaleString('fa-IR'))} تومان` : ''} - توضیحات: ${e.description || ''}`
        ),
        journalEntries: (state.journal || []).slice(0, 5).map(
          (j) => `${j.title} در ${j.dateJalali} - ${j.content}`
        ),
      };

      const customKey = StorageService.getCustomApiKey();
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(customKey ? { 'x-gemini-api-key': customKey } : {}),
        },
        body: JSON.stringify({
          question,
          customApiKey: customKey || undefined,
          userContext,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (data && data.answer) {
        return data.answer;
      }

      // If server returned non-ok, use local engine
      return LocalAIEngine.answerQuestion(question, state);
    } catch (err) {
      console.warn('AI chat falling back to local engine:', err);
      return LocalAIEngine.answerQuestion(question, state);
    }
  }

  // Summarize records
  static async summarizeRecords(type: string, records: any[]): Promise<string> {
    try {
      const customKey = StorageService.getCustomApiKey();
      const response = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(customKey ? { 'x-gemini-api-key': customKey } : {}),
        },
        body: JSON.stringify({
          type,
          records,
          customApiKey: customKey || undefined,
        }),
      });
      const data = await response.json().catch(() => ({}));
      return data.summary || 'خلاصه سوابق آماده نشد.';
    } catch (err) {
      console.warn('Summarize error:', err);
      return 'خطا در خلاصه‌سازی سوابق.';
    }
  }

  // Test Gemini API Key
  static async testApiKey(apiKey: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch('/api/ai/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      });
      const data = await response.json();
      return {
        success: !!data.success,
        message: data.message || (data.success ? 'اتصال با موفقیت برقرار شد' : 'کلید نامعتبر است'),
      };
    } catch (err: any) {
      return {
        success: false,
        message: 'خطا در اتصال به سرور: ' + (err?.message || ''),
      };
    }
  }
}

// Persian Voice Recognition (Web Speech API + MediaRecorder Fallback)
export class VoiceRecognitionService {
  private static recognition: any = null;

  static isSupported(): boolean {
    return typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
  }

  static startListening(
    onResult: (transcript: string, isFinal: boolean) => void,
    onError: (error: string) => void,
    onEnd: () => void
  ): { stop: () => void } {
    if (!this.isSupported()) {
      onError('مرورگر شما از ورودی صوتی مستقیم پشتیبانی نمی‌کند.');
      onEnd();
      return { stop: () => {} };
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      rec.lang = 'fa-IR';
      rec.continuous = true;
      rec.interimResults = true;

      rec.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const text = finalTranscript || interimTranscript;
        if (text) {
          onResult(text.trim(), !!finalTranscript);
        }
      };

      rec.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          onError('دسترسی به میکروفون داده نشد. لطفاً در تنظیمات مرورگر اجازه دهید.');
        } else if (event.error === 'no-speech') {
          // silence
        } else {
          onError(`پیام سیستم صوتی: ${event.error}`);
        }
      };

      rec.onend = () => {
        onEnd();
      };

      rec.start();
      this.recognition = rec;

      return {
        stop: () => {
          try {
            rec.stop();
          } catch {}
        },
      };
    } catch (err: any) {
      onError(err?.message || 'خطا در راه‌اندازی میکروفون');
      onEnd();
      return { stop: () => {} };
    }
  }
}

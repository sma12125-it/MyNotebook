// AI & Voice Services for دفتر من (MyLifeOS)
import { getTodayJalali } from '../utils/jalali';
import { StorageService } from './storage';
import { UserProfile } from '../types';

export interface ExtractionResult {
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

export class AIService {
  // Extract structured record from Persian sentence
  static async extractRecord(text: string): Promise<ExtractionResult> {
    try {
      const response = await fetch('/api/ai/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          currentDate: getTodayJalali(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const resJson = await response.json();
      return resJson.data || {};
    } catch (error) {
      console.warn('AI extraction fallback:', error);
      return {
        summary: text,
        note: { text },
        category: 'note',
      };
    }
  }

  // Ask AI a question about stored user records
  static async askQuestion(question: string): Promise<string> {
    try {
      // Gather relevant user context
      const profile: Partial<UserProfile> = StorageService.getProfile() || { id: 'user-default', name: 'کاربر' };
      const medications = (StorageService.getMedications() || []).filter((m) => m?.isActive);
      const measurements = (StorageService.getMeasurements() || []).slice(0, 10);
      const reminders = (StorageService.getReminders() || []).filter((r) => !r?.isCompleted);
      const visits = (StorageService.getVisits() || []).slice(0, 5);
      const labs = (StorageService.getLabs() || []).slice(0, 5);
      const events = (StorageService.getEvents() || []).slice(0, 5);

      const userContext = {
        name: profile?.name || profile?.fullName || 'کاربر',
        birthDate: profile?.birthDateJalali,
        bloodGroup: profile?.bloodGroup || profile?.bloodType,
        allergies: profile?.allergies || [],
        medicalConditions: profile?.medicalConditions || [],
        currentMedications: medications.map((m) => `${m?.name || ''} (${m?.dosage || ''}) - مصرف: ${m?.frequency || ''}`),
        recentMeasurements: measurements.map((m) => `${m?.type || ''}: ${m?.value || ''} ${m?.unit || ''} در تاریخ ${m?.recordedAtJalali || ''}`),
        activeReminders: reminders.map((r) => `${r?.title || ''} برای تاریخ ${r?.dueDateJalali || ''}`),
        recentVisits: visits.map((v) => `${v?.doctorName || ''} (${v?.specialty || ''}) در ${v?.dateJalali || ''} - علت: ${v?.reason || ''}`),
        recentLabs: labs.map((l) => `${l?.testName || ''} در تاریخ ${l?.dateJalali || ''}`),
        recentEvents: events.map((e) => `${e?.title || ''} (${e?.category || ''}) در ${e?.dateJalali || ''}`),
      };

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          userContext,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      return data.answer || 'پاسخی از دستیار دریافت نشد.';
    } catch (err) {
      console.error('AI chat error:', err);
      return 'خطا در برقراری ارتباط با دستیار هوشمند. لطفاً اتصال اینترنت خود را بررسی نمایید.';
    }
  }

  // Summarize records
  static async summarizeRecords(type: string, records: any[]): Promise<string> {
    try {
      const response = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, records }),
      });
      const data = await response.json();
      return data.summary || 'خلاصه آماده نشد.';
    } catch (err) {
      console.error('Summarize error:', err);
      return 'خطا در خلاصه‌سازی سوابق.';
    }
  }
}

// Persian Voice Recognition (Web Speech API)
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
      onError('مرورگر شما از ورودی صوتی پشتیبانی نمی‌کند.');
      onEnd();
      return { stop: () => {} };
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      rec.lang = 'fa-IR'; // Persian language recognition
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
          // No speech detected, ignore
        } else {
          onError(`خطا در دریافت صدا: ${event.error}`);
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

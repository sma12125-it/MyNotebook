// Alarm Manager for دفتر من (MyLifeOS)
// Checks active reminders, medication schedules, and fires incoming call style full-screen alerts

import { Reminder, Medication } from '../types';
import { StorageService } from './storage';
import { getTodayJalali } from '../utils/jalali';

export interface TriggeredAlarm {
  id: string;
  type: 'reminder' | 'medication' | 'health_check' | 'test';
  title: string;
  subtitle: string;
  details?: string;
  category?: string;
  sourceId?: string;
  timeSlot?: 'صبح' | 'ظهر' | 'عصر' | 'شب';
  scheduledTime?: string;
  timestamp: number;
}

export class AlarmManager {
  private static checkInterval: any = null;
  private static triggeredAlarmIds = new Set<string>();
  private static snoozedAlarms: Map<string, number> = new Map(); // id -> fireTimestamp
  private static onAlarmTriggerCallback: ((alarm: TriggeredAlarm) => void) | null = null;

  /**
   * Register a listener for triggered alarms
   */
  static registerListener(callback: (alarm: TriggeredAlarm) => void) {
    this.onAlarmTriggerCallback = callback;
  }

  /**
   * Start the background alarm clock monitor
   */
  static startMonitoring() {
    if (this.checkInterval) return;

    // Check immediately on startup
    this.checkAlarms();

    // Check every 10 seconds
    this.checkInterval = setInterval(() => {
      this.checkAlarms();
    }, 10000);
  }

  static stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Check if any reminder or medication alarm matches now
   */
  static checkAlarms() {
    const todayJalali = getTodayJalali();
    const now = new Date();
    const nowHours = now.getHours().toString().padStart(2, '0');
    const nowMins = now.getMinutes().toString().padStart(2, '0');
    const currentTimeStr = `${nowHours}:${nowMins}`;
    const nowMs = Date.now();

    // Check snoozed alarms
    for (const [alarmKey, fireTime] of this.snoozedAlarms.entries()) {
      if (nowMs >= fireTime) {
        this.snoozedAlarms.delete(alarmKey);
        const [type, sourceId, title] = alarmKey.split(':::');
        this.triggerAlarm({
          id: 'alarm-snoozed-' + Date.now(),
          type: type as any,
          title: decodeURIComponent(title || 'یادآوری مهم'),
          subtitle: 'موعد فرا رسیده (پس از تعویق)',
          sourceId,
          timestamp: nowMs,
        });
      }
    }

    // 1. Check Reminders
    const reminders: Reminder[] = StorageService.getReminders();
    for (const rem of reminders) {
      if (rem.isCompleted) continue;
      
      // If reminder is for today
      const isDueToday = rem.dueDateJalali === todayJalali || !rem.dueDateJalali;
      const targetTime = rem.time || rem.dueTime;

      if (isDueToday && targetTime) {
        // Compare target time with current time (ignoring Persian/English digits)
        const normTarget = this.toStandardTime(targetTime);
        const normCurrent = this.toStandardTime(currentTimeStr);

        const alarmKey = `reminder_${rem.id}_${todayJalali}_${normTarget}`;
        if (normTarget === normCurrent && !this.triggeredAlarmIds.has(alarmKey)) {
          this.triggeredAlarmIds.add(alarmKey);
          this.triggerAlarm({
            id: 'alarm-rem-' + rem.id + '-' + Date.now(),
            type: 'reminder',
            title: rem.title,
            subtitle: `موعد انجام کار (${rem.category || 'یادآوری شخصی'})`,
            details: rem.notes,
            category: rem.category,
            sourceId: rem.id,
            scheduledTime: targetTime,
            timestamp: nowMs,
          });
        }
      }
    }

    // 2. Check Medications
    const medications: Medication[] = StorageService.getMedications();
    const activeMeds = medications.filter((m) => m.isActive);
    
    // Default time slots: Morning (08:00), Noon (13:30), Evening (18:00), Night (22:00)
    const slotTimes: Record<string, string> = {
      صبح: '08:00',
      ظهر: '13:30',
      عصر: '18:00',
      شب: '22:00',
    };

    for (const med of activeMeds) {
      const slots = med.timeSlotLabels || ['صبح'];
      for (const slot of slots) {
        const slotTime = slotTimes[slot];
        if (slotTime) {
          const normSlotTime = this.toStandardTime(slotTime);
          const normCurrent = this.toStandardTime(currentTimeStr);
          const medKey = `med_${med.id}_${slot}_${todayJalali}_${normSlotTime}`;

          if (normSlotTime === normCurrent && !this.triggeredAlarmIds.has(medKey)) {
            // Check if already taken today
            const isTaken = StorageService.getMedicationLogs().some(
              (l) => l.medicationId === med.id && l.dateJalali === todayJalali && l.timeSlot === slot
            );

            if (!isTaken) {
              this.triggeredAlarmIds.add(medKey);
              this.triggerAlarm({
                id: 'alarm-med-' + med.id + '-' + slot + '-' + Date.now(),
                type: 'medication',
                title: `زمان مصرف داروی ${med.name}`,
                subtitle: `نوبت ${slot} — دوز: ${med.dosage || 'طبق نسخه'}`,
                details: med.instructions || 'لطفاً با آب کافی میل کنید',
                sourceId: med.id,
                timeSlot: slot,
                scheduledTime: slotTime,
                timestamp: nowMs,
              });
            }
          }
        }
      }
    }
  }

  /**
   * Fires the alarm event
   */
  static triggerAlarm(alarm: TriggeredAlarm) {
    if (this.onAlarmTriggerCallback) {
      this.onAlarmTriggerCallback(alarm);
    }
    // Also dispatch custom DOM event for global access
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mylifeos_trigger_alarm', { detail: alarm }));
    }
  }

  /**
   * Snooze an alarm by N minutes
   */
  static snoozeAlarm(alarm: TriggeredAlarm, minutes = 5) {
    const fireTime = Date.now() + minutes * 60 * 1000;
    const key = `${alarm.type}:::${alarm.sourceId || alarm.id}:::${encodeURIComponent(alarm.title)}`;
    this.snoozedAlarms.set(key, fireTime);
  }

  /**
   * Trigger a simulated test alarm immediately
   */
  static testAlarm() {
    this.triggerAlarm({
      id: 'test-alarm-' + Date.now(),
      type: 'test',
      title: 'تست زنگ و آلارم تماس تمام‌صفحه 🔔',
      subtitle: 'دفتر من — سیستم هشدار هوشمند و تماس',
      details: 'آلارم و زنگ با موفقیت فعال شد. صدای زنگ و لرزش تا زمان زدن دکمه قطع یا انجام فعال خواهد بود.',
      timestamp: Date.now(),
    });
  }

  private static toStandardTime(t: string): string {
    const fa = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    let res = t.trim();
    for (let i = 0; i < 10; i++) {
      res = res.replace(new RegExp(fa[i], 'g'), i.toString());
    }
    const parts = res.split(':');
    if (parts.length >= 2) {
      const h = parts[0].padStart(2, '0');
      const m = parts[1].padStart(2, '0');
      return `${h}:${m}`;
    }
    return res;
  }
}

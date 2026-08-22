import React, { useEffect, useState } from 'react';
import {
  Phone,
  PhoneOff,
  Bell,
  Pill,
  Clock,
  CheckCircle2,
  Volume2,
  VolumeX,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { TriggeredAlarm, AlarmManager } from '../../services/alarmManager';
import { AlarmSoundService } from '../../services/alarmSoundService';
import { StorageService } from '../../services/storage';
import { getTodayJalali, toFaDigits } from '../../utils/jalali';

interface FullScreenAlarmModalProps {
  alarm: TriggeredAlarm | null;
  onClose: () => void;
  onRefreshData?: () => void;
}

export const FullScreenAlarmModal: React.FC<FullScreenAlarmModalProps> = ({
  alarm,
  onClose,
  onRefreshData,
}) => {
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (alarm) {
      // Start ringing sound automatically
      AlarmSoundService.startAlarmRingtone();
      setIsMuted(false);
    }
    return () => {
      AlarmSoundService.stopAlarmRingtone();
    };
  }, [alarm]);

  if (!alarm) return null;

  const toggleMute = () => {
    if (isMuted) {
      AlarmSoundService.startAlarmRingtone();
      setIsMuted(false);
    } else {
      AlarmSoundService.stopAlarmRingtone();
      setIsMuted(true);
    }
  };

  const handleAcceptAndDone = () => {
    AlarmSoundService.stopAlarmRingtone();

    // If medication alarm, log it as taken
    if (alarm.type === 'medication' && alarm.sourceId) {
      const today = getTodayJalali();
      const logs = StorageService.getMedicationLogs();
      logs.push({
        id: 'log-alarm-' + Date.now(),
        medicationId: alarm.sourceId,
        dateJalali: today,
        timeSlot: (alarm.timeSlot as any) || 'صبح',
        takenAtTimestamp: Date.now(),
        status: 'taken',
      });
      StorageService.saveMedicationLogs(logs);
    }

    // If reminder alarm, mark reminder as completed
    if (alarm.type === 'reminder' && alarm.sourceId) {
      const reminders = StorageService.getReminders();
      const rem = reminders.find((r) => r.id === alarm.sourceId);
      if (rem) {
        rem.isCompleted = true;
        StorageService.saveReminders(reminders);
      }
    }

    if (onRefreshData) onRefreshData();
    onClose();
  };

  const handleSnooze = () => {
    AlarmSoundService.stopAlarmRingtone();
    AlarmManager.snoozeAlarm(alarm, 5);
    onClose();
  };

  const handleDismiss = () => {
    AlarmSoundService.stopAlarmRingtone();
    onClose();
  };

  const getIcon = () => {
    switch (alarm.type) {
      case 'medication':
        return <Pill className="w-16 h-16 text-emerald-400 animate-pulse" />;
      case 'reminder':
        return <Bell className="w-16 h-16 text-amber-400 animate-bounce" />;
      case 'health_check':
        return <ShieldAlert className="w-16 h-16 text-rose-400 animate-pulse" />;
      default:
        return <Sparkles className="w-16 h-16 text-cyan-400 animate-pulse" />;
    }
  };

  const getHeaderBadge = () => {
    switch (alarm.type) {
      case 'medication':
        return '💊 نوبت مصرف دارو';
      case 'reminder':
        return '⏰ موعد انجام یادآوری';
      case 'health_check':
        return '🩺 هشدار بررسی سلامت';
      default:
        return '🔔 آلارم و زنگ هوشمند';
    }
  };

  const currentTimeFa = toFaDigits(
    new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
  );

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-between bg-gradient-to-b from-[#0F172A] via-[#1E293B] to-[#090D16] text-white p-6 select-none overflow-hidden animate-fade-in">
      {/* Background Animated Concentric Radar Waves */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
        <div className="w-[500px] h-[500px] rounded-full border border-emerald-500/40 animate-ping duration-1000"></div>
        <div className="w-[380px] h-[380px] rounded-full border border-cyan-500/30 animate-pulse"></div>
        <div className="w-[260px] h-[260px] rounded-full border border-amber-500/30"></div>
      </div>

      {/* Top Bar: Caller Type Badge & Mute button */}
      <div className="relative z-10 w-full max-w-md flex items-center justify-between pt-4">
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 shadow-sm">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></div>
          <span className="text-xs sm:text-sm font-bold text-emerald-300">
            {getHeaderBadge()}
          </span>
        </div>

        <button
          onClick={toggleMute}
          className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white border border-white/15 cursor-pointer"
          title={isMuted ? 'فعال‌سازی صدا' : 'قطع موقت صدا'}
        >
          {isMuted ? (
            <VolumeX className="w-5 h-5 text-rose-400" />
          ) : (
            <Volume2 className="w-5 h-5 text-emerald-400 animate-pulse" />
          )}
        </button>
      </div>

      {/* Center: Large Incoming Call Style Avatar & Details */}
      <div className="relative z-10 flex flex-col items-center text-center my-auto px-4 max-w-md w-full">
        {/* Pulsing Avatar Container */}
        <div className="relative mb-6 flex items-center justify-center">
          <div className="absolute w-36 h-36 rounded-full bg-emerald-500/20 blur-xl animate-pulse"></div>
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-tr from-slate-800 to-slate-700 border-2 border-emerald-400/40 shadow-2xl flex items-center justify-center relative">
            {getIcon()}
          </div>
        </div>

        {/* Alarm Title & Subtitle */}
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-2 leading-tight drop-shadow-md">
          {alarm.title}
        </h1>

        <p className="text-sm sm:text-base text-slate-300 font-medium mb-3">
          {alarm.subtitle}
        </p>

        {alarm.details && (
          <div className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-xs sm:text-sm text-slate-200 mb-4 max-w-xs">
            {alarm.details}
          </div>
        )}

        {/* Current Time Display */}
        <div className="flex items-center gap-1.5 text-xs text-emerald-300/90 font-mono font-bold bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-500/30">
          <Clock className="w-3.5 h-3.5" />
          <span>ساعت {currentTimeFa}</span>
        </div>
      </div>

      {/* Bottom Actions: Accept (Green), Snooze (Orange), Dismiss (Red) */}
      <div className="relative z-10 w-full max-w-md flex flex-col gap-3 pb-6">
        {/* Big Accept & Mark Done Button */}
        <button
          onClick={handleAcceptAndDone}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-[0.98] transition-all text-white font-black text-base sm:text-lg shadow-xl flex items-center justify-center gap-3 border border-emerald-400/30 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <CheckCircle2 className="w-5 h-5 text-white" />
          </div>
          <span>پذیرفتن و ثبت شد</span>
        </button>

        {/* Secondary Buttons Row */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleSnooze}
            className="py-3 px-4 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 active:scale-95 transition-all text-amber-300 font-bold text-xs sm:text-sm border border-amber-500/30 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Clock className="w-4 h-4" />
            <span>تعویق ۵ دقیقه</span>
          </button>

          <button
            onClick={handleDismiss}
            className="py-3 px-4 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 active:scale-95 transition-all text-rose-300 font-bold text-xs sm:text-sm border border-rose-500/30 flex items-center justify-center gap-2 cursor-pointer"
          >
            <PhoneOff className="w-4 h-4" />
            <span>قطع زنگ</span>
          </button>
        </div>
      </div>
    </div>
  );
};

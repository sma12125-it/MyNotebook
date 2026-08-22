// Web Audio API Ringtone & Alarm Sound Service for دفتر من (MyLifeOS)
// Generates rich, realistic incoming call ringtones, melodic chimes, and vibration patterns

export class AlarmSoundService {
  private static audioCtx: AudioContext | null = null;
  private static isRinging = false;
  private static ringIntervalId: any = null;
  private static vibrateIntervalId: any = null;

  private static getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Plays a pleasant, loud phone ringtone / chime burst
   */
  private static playPhoneRingBurst() {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;

      // Note sequence for a melodic incoming phone call chord
      const notes = [
        { freq: 587.33, start: 0, dur: 0.15 },    // D5
        { freq: 880.00, start: 0.15, dur: 0.15 }, // A5
        { freq: 1046.50, start: 0.30, dur: 0.25 }, // C6
        { freq: 880.00, start: 0.60, dur: 0.15 },  // A5
        { freq: 1174.66, start: 0.75, dur: 0.35 }, // D6
      ];

      notes.forEach((n) => {
        // Primary oscillator (sine)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(n.freq, now + n.start);

        // Secondary harmonic oscillator (triangle for richness)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(n.freq * 0.5, now + n.start);

        // Envelopes
        gain.gain.setValueAtTime(0.001, now + n.start);
        gain.gain.exponentialRampToValueAtTime(0.4, now + n.start + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + n.start + n.dur);

        gain2.gain.setValueAtTime(0.001, now + n.start);
        gain2.gain.exponentialRampToValueAtTime(0.2, now + n.start + 0.03);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + n.start + n.dur);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + n.start);
        osc.stop(now + n.start + n.dur + 0.05);

        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + n.start);
        osc2.stop(now + n.start + n.dur + 0.05);
      });
    } catch (e) {
      console.warn('Alarm sound error:', e);
    }
  }

  /**
   * Starts repeating incoming call ringtone and device vibration loop
   */
  static startAlarmRingtone() {
    if (this.isRinging) return;
    this.isRinging = true;

    // Trigger immediately
    this.playPhoneRingBurst();

    // Vibrate if available
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([600, 300, 600, 1000]);
        this.vibrateIntervalId = setInterval(() => {
          if (this.isRinging) {
            navigator.vibrate([600, 300, 600, 1000]);
          }
        }, 3000);
      } catch {}
    }

    // Repeat ringtone every 2.4 seconds
    this.ringIntervalId = setInterval(() => {
      if (this.isRinging) {
        this.playPhoneRingBurst();
      }
    }, 2400);
  }

  /**
   * Stops the ringtone and vibration
   */
  static stopAlarmRingtone() {
    this.isRinging = false;
    if (this.ringIntervalId) {
      clearInterval(this.ringIntervalId);
      this.ringIntervalId = null;
    }
    if (this.vibrateIntervalId) {
      clearInterval(this.vibrateIntervalId);
      this.vibrateIntervalId = null;
    }
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(0);
      } catch {}
    }
  }

  /**
   * Quick preview sound
   */
  static previewSound() {
    this.playPhoneRingBurst();
  }
}

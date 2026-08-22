import React, { useState, useEffect } from 'react';
import {
  Lock,
  Unlock,
  KeyRound,
  Grid3X3,
  Fingerprint,
  ScanFace,
  ShieldCheck,
  AlertCircle,
  Delete,
  CornerDownLeft,
} from 'lucide-react';
import { PatternLock } from './PatternLock';
import { BiometricScanner } from './BiometricScanner';
import { SecurityConfig } from '../../services/cloudSync';
import { toFaDigits } from '../../utils/jalali';

interface AppLockScreenProps {
  isLocked: boolean;
  onUnlock: () => void;
  securityConfig: SecurityConfig;
}

export const AppLockScreen: React.FC<AppLockScreenProps> = ({
  isLocked,
  onUnlock,
  securityConfig,
}) => {
  const [activeTab, setActiveTab] = useState<'fingerprint' | 'face' | 'pin' | 'pattern'>('fingerprint');
  const [pinInput, setPinInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Set default tab to biometric (fingerprint/face) for auto-scanning
  useEffect(() => {
    if (isLocked) {
      setPinInput('');
      setErrorMessage(null);
      if (securityConfig.lockType === 'pattern') {
        setActiveTab('pattern');
      } else if (securityConfig.lockType === 'pin') {
        setActiveTab('pin');
      } else {
        // Default to biometric (fingerprint) for automatic scan on app start
        setActiveTab('fingerprint');
      }
    }
  }, [isLocked, securityConfig.lockType]);

  if (!isLocked) return null;

  // PIN Keypad handlers
  const handlePinKey = (num: string) => {
    setErrorMessage(null);
    if (pinInput.length < 8) {
      const nextPin = pinInput + num;
      setPinInput(nextPin);

      // Instant unlock if matching
      const targetPin = securityConfig.pinCode || '1234';
      if (nextPin === targetPin) {
        onUnlock();
      } else if (nextPin.length >= 4 && !securityConfig.pinCode) {
        onUnlock();
      }
    }
  };

  const handlePinBackspace = () => {
    setPinInput((prev) => prev.slice(0, -1));
    setErrorMessage(null);
  };

  const handlePinSubmit = () => {
    const targetPin = securityConfig.pinCode || '1234';
    if (pinInput === targetPin) {
      onUnlock();
    } else {
      setErrorMessage('رمز عبور وارد شده نادرست است');
      setPinInput('');
    }
  };

  return (
    <div className="fixed inset-0 z-100 bg-background/95 backdrop-blur-md flex flex-col items-center justify-center p-4 text-foreground animate-in fade-in select-none" dir="rtl">
      <div className="w-full max-w-sm bg-card border border-border rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col items-center text-center space-y-4">
        
        {/* App Lock Brand */}
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg border-2 border-primary/20 bg-[#7C9070]">
            <img
              src="/app-logo.png"
              alt="دفتر من"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="absolute -bottom-1 -left-1 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shadow-md">
            <Lock className="w-3.5 h-3.5" />
          </div>
        </div>

        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-foreground">دفتر من</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            احراز هویت امنیتی برای دسترسی به اطلاعات شخصی
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center justify-center gap-1 p-1 bg-muted rounded-2xl w-full text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('fingerprint');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'fingerprint'
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Fingerprint className="w-3.5 h-3.5" />
            <span>اثر انگشت</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('face');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'face'
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ScanFace className="w-3.5 h-3.5" />
            <span>اسکن چهره</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('pin');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'pin'
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>رمز PIN</span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="w-full p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold flex items-center justify-center gap-1.5 animate-in shake">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* FINGERPRINT AUTO SCAN */}
        {/* ========================================================================= */}
        {activeTab === 'fingerprint' && (
          <BiometricScanner
            type="fingerprint"
            autoTrigger={true}
            onSuccess={onUnlock}
            onError={(msg) => setErrorMessage(msg)}
            onFallbackToPin={() => setActiveTab('pin')}
            title="اسکن خودکار اثر انگشت"
          />
        )}

        {/* ========================================================================= */}
        {/* FACE AUTO SCAN */}
        {/* ========================================================================= */}
        {activeTab === 'face' && (
          <BiometricScanner
            type="face"
            autoTrigger={true}
            onSuccess={onUnlock}
            onError={(msg) => setErrorMessage(msg)}
            onFallbackToPin={() => setActiveTab('pin')}
            title="تشخیص هوشمند چهره"
          />
        )}

        {/* ========================================================================= */}
        {/* NUMERIC PIN KEYPAD */}
        {/* ========================================================================= */}
        {activeTab === 'pin' && (
          <div className="w-full space-y-4 animate-in fade-in">
            {/* PIN Dots Display */}
            <div className="flex items-center justify-center gap-3 py-2">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full transition-all duration-200 ${
                    pinInput.length > idx
                      ? 'bg-primary scale-110 shadow-sm shadow-primary/40'
                      : 'bg-muted-foreground/20 border border-muted-foreground/30'
                  }`}
                />
              ))}
            </div>

            {/* Keypad Grid */}
            <div className="grid grid-cols-3 gap-2.5 max-w-[260px] mx-auto">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handlePinKey(num)}
                  className="h-13 rounded-2xl bg-muted/60 hover:bg-muted active:scale-95 text-foreground font-bold text-lg flex items-center justify-center transition-all cursor-pointer shadow-xs border border-border/40"
                >
                  {toFaDigits(num)}
                </button>
              ))}

              <button
                type="button"
                onClick={handlePinBackspace}
                className="h-13 rounded-2xl bg-muted/40 hover:bg-muted text-muted-foreground active:scale-95 flex items-center justify-center transition-all cursor-pointer border border-border/40"
                title="پاک کردن"
              >
                <Delete className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => handlePinKey('0')}
                className="h-13 rounded-2xl bg-muted/60 hover:bg-muted active:scale-95 text-foreground font-bold text-lg flex items-center justify-center transition-all cursor-pointer shadow-xs border border-border/40"
              >
                {toFaDigits('0')}
              </button>

              <button
                type="button"
                onClick={handlePinSubmit}
                className="h-13 rounded-2xl bg-primary hover:bg-[#687a5e] active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer shadow-md shadow-primary/20"
                title="ورود"
              >
                <CornerDownLeft className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground px-2 pt-1">
              <button
                type="button"
                onClick={() => setActiveTab('fingerprint')}
                className="hover:text-primary transition-colors cursor-pointer flex items-center gap-1"
              >
                <Fingerprint className="w-3.5 h-3.5" />
                <span>اسکن اثر انگشت</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('face')}
                className="hover:text-primary transition-colors cursor-pointer flex items-center gap-1"
              >
                <ScanFace className="w-3.5 h-3.5" />
                <span>اسکن چهره</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

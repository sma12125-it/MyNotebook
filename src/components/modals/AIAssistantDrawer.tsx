import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  Send,
  Loader2,
  Bot,
  User,
  ShieldCheck,
  FileText,
  Mic,
  MicOff,
  CornerDownLeft,
  Volume2,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { AIService, VoiceRecognitionService } from '../../services/aiService';
import { StorageService } from '../../services/storage';
import { AppState, UserProfile } from '../../types';

interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  appState?: AppState;
  onOpenQuickCapture?: () => void;
}

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: number;
}

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({
  isOpen,
  onClose,
  appState,
}) => {
  const profile = appState?.profile || StorageService.getProfile();
  const userName = profile?.fullName?.trim() || profile?.name?.trim() || 'کاربر گرامی';
  const customApiKey = StorageService.getCustomApiKey();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `سلام ${userName}! من دستیار هوشمند و همنشین صمیمی شما در «دفتر من» هستم. به تمامی اطلاعات ثبت‌شده (داروها، آزمایش‌ها، مصرف آب، فشار و قند خون، ویزیت‌ها، هزینه‌های خودرو و یادآوری‌ها) دسترسی دارم و با سرعت بالا به هر سوال شما دقیق پاسخ می‌دهم. چه کمکی می‌تونم بهتون بکنم؟`,
      timestamp: Date.now(),
    },
  ]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'summary'>('chat');
  const [summaryText, setSummaryText] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const voiceListenerRef = useRef<{ stop: () => void } | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const quickPrompts = [
    'امروز چقدر آب خوردم؟',
    'آخرین فشار خون ثبت‌شده من چقدر بود؟',
    'لیست داروهای فعال و دوز آن‌ها چیست؟',
    'آخرین بار کی آزمایش خون دادم؟',
    'هزینه‌های ثبت‌شده ماشین چقدر بوده؟',
    'یادآوری‌های فعال امروز من چیست؟',
  ];

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || inputQuestion).trim();
    if (!query || isLoading) return;

    if (isRecording && voiceListenerRef.current) {
      voiceListenerRef.current.stop();
      setIsRecording(false);
    }

    const userMsg: Message = {
      id: 'u-' + Date.now(),
      sender: 'user',
      text: query,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion('');
    setIsLoading(true);

    try {
      const answer = await AIService.askQuestion(query);
      const aiMsg: Message = {
        id: 'ai-' + Date.now(),
        sender: 'ai',
        text: answer,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: 'err-' + Date.now(),
          sender: 'ai',
          text: 'متأسفانه در برقراری ارتباط خطایی رخ داد. لطفاً دوباره سوال خود را مطرح نمایید.',
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleVoiceRecording = () => {
    if (isRecording) {
      if (voiceListenerRef.current) {
        voiceListenerRef.current.stop();
      }
      setIsRecording(false);
    } else {
      setIsRecording(true);
      const listener = VoiceRecognitionService.startListening(
        (transcript, isFinal) => {
          setInputQuestion(transcript);
          if (isFinal) {
            handleSend(transcript);
          }
        },
        (errorMsg) => {
          console.warn('Voice error:', errorMsg);
          setIsRecording(false);
        },
        () => {
          setIsRecording(false);
        }
      );
      voiceListenerRef.current = listener;
    }
  };

  const handleGenerateSummary = async (type: string) => {
    setIsSummarizing(true);
    try {
      let records: any[] = [];
      if (type === 'سوابق سلامت و ویزیت‌ها') {
        records = [
          ...StorageService.getVisits(),
          ...StorageService.getMeasurements().slice(0, 10),
          ...StorageService.getMedications(),
        ];
      } else if (type === 'سوابق آزمایشگاهی') {
        records = StorageService.getLabs();
      } else {
        records = StorageService.getEvents();
      }

      const summary = await AIService.summarizeRecords(type, records);
      setSummaryText(summary);
    } catch (err) {
      console.error(err);
      setSummaryText('خطا در تولید خلاصه سوابق.');
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in select-none" dir="rtl">
      <div className="w-full max-w-lg bg-card text-card-foreground h-full shadow-2xl flex flex-col border-l border-border animate-in slide-in-from-left duration-300">
        
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary to-emerald-600 flex items-center justify-center text-white shadow-md shadow-primary/25">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-foreground text-base">دستیار هوشمند دفتر من</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  customApiKey.trim()
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    : 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20'
                }`}>
                  {customApiKey.trim() ? '✨ کلید ابری Gemini' : '⚡ موتور محلی فوق‌سریع'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">پاسخ‌گویی آنی و هوشمند به همه اطلاعات شما</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch: Chat vs Summarizer */}
        <div className="flex p-1.5 bg-muted mx-4 mt-3 rounded-2xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'chat'
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>گفتگو و پرسش</span>
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`flex-1 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'summary'
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>خلاصه‌ساز پرونده</span>
          </button>
        </div>

        {/* Content Area */}
        {activeTab === 'chat' ? (
          <div className="flex-1 flex flex-col justify-between overflow-hidden p-4">
            {/* Messages List */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 pl-1">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 ${
                    msg.sender === 'user' ? 'flex-row-reverse' : ''
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs shadow-xs ${
                      msg.sender === 'user'
                        ? 'bg-primary text-white'
                        : 'bg-primary/10 text-primary'
                    }`}
                  >
                    {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  <div
                    className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed max-w-[85%] shadow-xs ${
                      msg.sender === 'user'
                        ? 'bg-primary text-white rounded-tr-xs'
                        : 'bg-muted/70 text-foreground border border-border/50 rounded-tl-xs whitespace-pre-line'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex items-center gap-2.5 text-primary text-xs p-3 rounded-2xl bg-primary/5 w-fit border border-primary/15 animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="font-semibold">دستیار در حال تحلیل سوابق و نگارش پاسخ...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompts Chips */}
            <div className="pt-2 pb-1.5 overflow-x-auto no-scrollbar flex items-center gap-1.5">
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(prompt)}
                  disabled={isLoading}
                  className="px-3 py-1.5 rounded-xl bg-muted hover:bg-primary/10 hover:text-primary text-muted-foreground text-xs whitespace-nowrap border border-border/70 transition-all shrink-0 font-medium cursor-pointer"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Input Box */}
            <div className="pt-2">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={inputQuestion}
                    onChange={(e) => setInputQuestion(e.target.value)}
                    placeholder="پرسش خود را بنویسید یا بگویید..."
                    disabled={isLoading}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-border bg-muted/40 text-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-background transition-all"
                  />
                  <button
                    type="button"
                    onClick={toggleVoiceRecording}
                    className={`absolute left-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-xl transition-all cursor-pointer ${
                      isRecording
                        ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/30'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                    title={isRecording ? 'توقف ضبط صدا' : 'صحبت با میکروفون'}
                  >
                    {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={!inputQuestion.trim() || isLoading}
                  className="p-3 rounded-2xl bg-primary hover:bg-[#687a5e] disabled:opacity-40 text-white shadow-md shadow-primary/20 transition-all flex items-center justify-center shrink-0 cursor-pointer"
                >
                  <Send className="w-4 h-4 rotate-180" />
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* Summarizer View */
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <p className="text-xs text-muted-foreground">
              دسته‌بندی مورد نظر را انتخاب کنید تا خلاصه‌ای هوشمند از پرونده شما آماده شود:
            </p>

            <div className="grid grid-cols-1 gap-2.5">
              {[
                { title: 'سوابق سلامت و ویزیت‌ها', desc: 'ویزیت پزشکان، سنجش‌ها و داروها' },
                { title: 'سوابق آزمایشگاهی', desc: 'فاکتورهای آزمایش خون و چکاپ‌ها' },
                { title: 'سوابق خودرو و هزینه‌ها', desc: 'سرویس‌های انجام شده، بیمه و هزینه‌ها' },
              ].map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleGenerateSummary(item.title)}
                  disabled={isSummarizing}
                  className="p-3.5 rounded-2xl bg-muted/50 hover:bg-muted border border-border flex items-center justify-between text-right transition-all cursor-pointer"
                >
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-foreground">{item.title}</h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                  <Sparkles className="w-4 h-4 text-primary shrink-0" />
                </button>
              ))}
            </div>

            {isSummarizing && (
              <div className="flex items-center justify-center gap-2 p-6 text-primary text-xs font-semibold">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>در حال تولید خلاصه هوشمند پرونده...</span>
              </div>
            )}

            {summaryText && !isSummarizing && (
              <div className="p-4 rounded-2xl bg-muted/60 border border-border text-xs sm:text-sm leading-relaxed text-foreground whitespace-pre-line animate-in fade-in">
                {summaryText}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

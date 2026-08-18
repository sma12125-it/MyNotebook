import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Send,
  Loader2,
  Bot,
  User,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import { AIService } from '../../services/aiService';
import { StorageService } from '../../services/storage';

interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
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
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'سلام! من دستیار هوشمند شما در «دفتر من» هستم. می‌توانید هر سوالی درباره داروها، آزمایش‌ها، یادآوری‌ها و سوابق ثبت‌شده‌تان دارید بپرسید یا درخواست خلاصه پرونده کنید.',
      timestamp: Date.now(),
    },
  ]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'summary'>('chat');
  const [summaryText, setSummaryText] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  if (!isOpen) return null;

  const quickPrompts = [
    'آخرین بار کی آزمایش خون دادم؟',
    'داروهای فعلی من چی هستند؟',
    'آخرین وزن ثبت شده من چقدر است؟',
    'چه یادآوری‌هایی این ماه دارم؟',
    'فشار خون من در آخرین اندازه‌گیری چند بود؟',
  ];

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || inputQuestion).trim();
    if (!query || isLoading) return;

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
          text: 'متأسفانه در دریافت پاسخ خطایی رخ داد. لطفاً مجدداً امتحان کنید.',
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
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
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-r border-slate-200 dark:border-slate-800 animate-in slide-in-from-left duration-300">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between safe-top">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-sm shadow-indigo-500/25">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">دستیار هوشمند دفتر من</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">پاسخ بر اساس اطلاعات ثبت‌شده شما</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch: Chat vs Summarizer */}
        <div className="flex p-2 bg-slate-100 dark:bg-slate-800/80 mx-4 mt-3 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              activeTab === 'chat'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            گفتگو و پرسش
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              activeTab === 'summary'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            خلاصه‌ساز پرونده
          </button>
        </div>

        {/* Content Area */}
        {activeTab === 'chat' ? (
          <div className="flex-1 flex flex-col justify-between overflow-hidden p-4">
            {/* Messages List */}
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 ${
                    msg.sender === 'user' ? 'flex-row-reverse' : ''
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs ${
                      msg.sender === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                    }`}
                  >
                    {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  <div
                    className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed max-w-[85%] ${
                      msg.sender === 'user'
                        ? 'bg-blue-600 text-white rounded-tr-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-xs whitespace-pre-line'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs p-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>دستیار در حال بررسی سوابق شما...</span>
                </div>
              )}
            </div>

            {/* Quick Prompts Chips */}
            <div className="pt-2 pb-1 overflow-x-auto no-scrollbar flex items-center gap-1.5">
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(prompt)}
                  disabled={isLoading}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-300 text-[11px] whitespace-nowrap border border-slate-200/60 dark:border-slate-700 transition-colors flex-shrink-0 font-medium"
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
                <input
                  type="text"
                  value={inputQuestion}
                  onChange={(e) => setInputQuestion(e.target.value)}
                  placeholder="پرسش خود را بنویسید..."
                  disabled={isLoading}
                  className="flex-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
                <button
                  type="submit"
                  disabled={!inputQuestion.trim() || isLoading}
                  className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white shadow-sm transition-all flex items-center justify-center"
                >
                  <Send className="w-4 h-4 rotate-180" />
                </button>
              </form>

              <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-500 dark:text-slate-400 justify-center">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                <span>اطلاعات شما در دستگاه شما محفوظ است و برای آموزش مدل استفاده نمی‌شود.</span>
              </div>
            </div>
          </div>
        ) : (
          /* Summarizer View */
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 text-xs text-indigo-900 dark:text-indigo-200 leading-relaxed">
              تولید خلاصه منسجم برای ارائه به پزشک در هنگام ویزیت، یا مرور سریع آزمایش‌ها و رویدادها.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={() => handleGenerateSummary('سوابق سلامت و ویزیت‌ها')}
                disabled={isSummarizing}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-right transition-colors"
              >
                <FileText className="w-4 h-4 text-indigo-600 mb-1" />
                <div className="font-bold text-xs text-slate-900 dark:text-white">خلاصه سلامت و ویزیت‌ها</div>
                <div className="text-[10px] text-slate-500 mt-0.5">برای ارائه به پزشک</div>
              </button>

              <button
                onClick={() => handleGenerateSummary('سوابق آزمایشگاهی')}
                disabled={isSummarizing}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-right transition-colors"
              >
                <FileText className="w-4 h-4 text-purple-600 mb-1" />
                <div className="font-bold text-xs text-slate-900 dark:text-white">خلاصه آزمایش‌ها</div>
                <div className="text-[10px] text-slate-500 mt-0.5">روند ویتامین D، قند و چربی</div>
              </button>
            </div>

            {isSummarizing && (
              <div className="flex items-center justify-center gap-2 p-8 text-xs text-indigo-600 font-semibold">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>در حال آماده‌سازی خلاصه هوشمند...</span>
              </div>
            )}

            {summaryText && !isSummarizing && (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-100 whitespace-pre-line leading-relaxed">
                <div className="font-bold text-indigo-600 dark:text-indigo-400 mb-2 border-b border-slate-200 dark:border-slate-700 pb-1.5">
                  خلاصه آماده‌شده:
                </div>
                {summaryText}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import type {
  AppItem,
  CalmTrigger,
  HabitWallType,
  LanguageCode,
  SlowLearningTrack,
} from '../types/app';
import {
  FOCUS_READER_PASSAGES,
  getTriggerSource,
  getTriggerText,
} from '../data/calmTriggers';
import {
  getLessonsForTrack,
  type SlowLearningLesson,
} from '../data/slowLearningCurriculum';
import { TRANSLATIONS } from '../i18n/translations';
import { NativeBridge } from '../services/nativeBridge';

interface InhaleInterceptModalProps {
  app: AppItem;
  trigger: CalmTrigger;
  lang: LanguageCode;
  showArabicScript: boolean;
  activeHabitWall: HabitWallType;
  requireHabitWallAlways: boolean;
  slowLearningTrack?: SlowLearningTrack;
  readingDurationSeconds?: number;
  lessonIndex?: number;
  onQuizPassed?: () => void;
  onCancelReturnToPeace: () => void;
  onUnlockApproved: (minutesBid: number, intentReason: string, journalEntry?: string) => void;
  onRotateTrigger: () => void;
}

export const InhaleInterceptModal: React.FC<InhaleInterceptModalProps> = ({
  app,
  trigger,
  lang,
  showArabicScript,
  activeHabitWall,
  requireHabitWallAlways,
  slowLearningTrack = 'islam',
  readingDurationSeconds = 30,
  lessonIndex = 0,
  onQuizPassed,
  onCancelReturnToPeace,
  onUnlockApproved,
  onRotateTrigger,
}) => {
  const t = TRANSLATIONS[lang];

  // Escalating friction based on daily opens (5s -> 8s -> 12s -> 15s)
  const initialDelaySeconds =
    app.dailyOpens === 0 ? 5 : app.dailyOpens === 1 ? 8 : app.dailyOpens === 2 ? 12 : 15;

  const [secondsLeft, setSecondsLeft] = useState<number>(initialDelaySeconds);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [step, setStep] = useState<'breathing' | 'intent-bid' | 'habit-wall'>('breathing');

  // Micro-Intent state
  const [selectedIntent, setSelectedIntent] = useState<string>(t.intentReplyDm);
  const [selectedMinutes, setSelectedMinutes] = useState<number>(5);

  // Habit Wall states
  const [activeWallTab, setActiveWallTab] = useState<HabitWallType>(activeHabitWall);
  const [transcribeInput, setTranscribeInput] = useState<string>('');
  const [journalInput, setJournalInput] = useState<string>('');
  const [readerPage, setReaderPage] = useState<number>(1);
  const [uploadedDocName, setUploadedDocName] = useState<string | null>(null);
  const [uploadedPages, setUploadedPages] = useState<string[] | null>(null);
  const [stepsCounted, setStepsCounted] = useState<number>(0);

  // 30-Second Slow Learning Read + Quiz Gate State
  const trackLessons = getLessonsForTrack(slowLearningTrack);
  const [localLessonIdx, setLocalLessonIdx] = useState<number>(lessonIndex);
  const currentLesson: SlowLearningLesson =
    trackLessons[localLessonIdx % trackLessons.length];

  const [readSecondsLeft, setReadSecondsLeft] = useState<number>(readingDurationSeconds);
  const [selectedQuizOption, setSelectedQuizOption] = useState<number | null>(null);
  const [quizPassed, setQuizPassed] = useState<boolean>(false);
  const [quizErrorFeedback, setQuizErrorFeedback] = useState<string | null>(null);

  // Countdown timer for the Inhale screen
  useEffect(() => {
    if (step !== 'breathing') return;
    if (secondsLeft <= 0) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft, step]);

  // Countdown timer for the 30-second Slow Learning Reading Gate
  useEffect(() => {
    if (step !== 'habit-wall' || activeWallTab !== 'read-30s-quiz') return;
    if (readSecondsLeft <= 0) return;

    const timer = setInterval(() => {
      setReadSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [step, activeWallTab, readSecondsLeft]);

  // Breathing phase cadence
  useEffect(() => {
    const cycle = setInterval(() => {
      setBreathPhase((prev) =>
        prev === 'inhale' ? 'hold' : prev === 'hold' ? 'exhale' : 'inhale'
      );
    }, 2200);
    return () => clearInterval(cycle);
  }, []);

  // Hardware step sensor subscription when on steps-20 habit wall
  useEffect(() => {
    if (step !== 'habit-wall' || activeWallTab !== 'steps-20') return;
    const unsub = NativeBridge.subscribeToHardwareSteps(() => {
      setStepsCounted((prev) => Math.min(20, prev + 1));
    });
    return unsub;
  }, [step, activeWallTab]);

  const targetTriggerText = getTriggerText(trigger, lang);
  const targetTriggerSource = getTriggerSource(trigger, lang);

  // Habit wall completion checks
  const journalWordCount = journalInput
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const requiredWords = 25;

  const normalizedTarget = targetTriggerText
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .trim();
  const normalizedTyped = transcribeInput
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .trim();
  const isTranscriptionComplete =
    normalizedTyped.length >= Math.min(18, Math.floor(normalizedTarget.length * 0.65));

  const isHabitComplete =
    (activeWallTab === 'read-30s-quiz' && readSecondsLeft === 0 && quizPassed) ||
    (activeWallTab === 'calm-transcribe' && isTranscriptionComplete) ||
    (activeWallTab === 'journal-50' && journalWordCount >= requiredWords) ||
    (activeWallTab === 'read-pages' && readerPage >= 3) ||
    (activeWallTab === 'steps-20' && stepsCounted >= 20);

  const handleSelectQuizOption = (idx: number) => {
    if (readSecondsLeft > 0) return;
    setSelectedQuizOption(idx);
    if (idx === currentLesson.correctOptionIndex) {
      if (!quizPassed) {
        setQuizPassed(true);
        setQuizErrorFeedback(null);
        onQuizPassed?.();
      }
    } else {
      setQuizPassed(false);
      setQuizErrorFeedback(
        lang === 'bn'
          ? 'উত্তরটি সঠিক নয়। অনুচ্ছেদটি আরও ১০ সেকেন্ড মনোযোগ দিয়ে পড়ে সঠিক উত্তর দিন।'
          : lang === 'ar'
          ? 'الإجابة غير صحيحة. أعد قراءة النص لمدة ١٠ ثوانٍ ثم اختر الإجابة الصحيحة.'
          : lang === 'ur'
          ? 'جواب درست نہیں ہے۔ عبارت کو مزید 10 سیکنڈ غور سے پڑھ کر درست جواب دیں۔'
          : lang === 'id'
          ? 'Jawaban belum tepat. Baca kembali teks selama 10 detik lalu pilih jawaban yang benar.'
          : 'Not quite right. Re-read the passage for 10 seconds and choose the correct answer.'
      );
      setReadSecondsLeft(10);
    }
  };

  const handleSwitchLesson = () => {
    setLocalLessonIdx((i) => i + 1);
    setReadSecondsLeft(readingDurationSeconds);
    setSelectedQuizOption(null);
    setQuizPassed(false);
    setQuizErrorFeedback(null);
  };

  const handleProceedFromBreathing = () => {
    setStep('intent-bid');
  };

  const handleProceedFromIntent = () => {
    const needsHabitWall =
      requireHabitWallAlways || activeHabitWall === 'read-30s-quiz' || app.dailyOpens >= 1;
    if (needsHabitWall) {
      setStep('habit-wall');
    } else {
      onUnlockApproved(selectedMinutes, selectedIntent);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedDocName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const raw = typeof reader.result === 'string' ? reader.result : '';
      const cleanText =
        raw.replace(/[^\x20-\x7E\u0980-\u09FF\u0600-\u06FF\n]/g, ' ').trim() ||
        'Document loaded successfully for 3-page mindful reading gatekeeper.';
      const chunkLen = Math.max(220, Math.floor(cleanText.length / 3));
      setUploadedPages([
        cleanText.slice(0, chunkLen),
        cleanText.slice(chunkLen, chunkLen * 2) || cleanText.slice(0, chunkLen),
        cleanText.slice(chunkLen * 2, chunkLen * 3) || cleanText.slice(0, chunkLen),
      ]);
      setReaderPage(1);
    };
    reader.readAsText(file);
  };

  const readProgressPct = Math.min(
    100,
    Math.round(((readingDurationSeconds - readSecondsLeft) / Math.max(1, readingDurationSeconds)) * 100)
  );

  return (
    <div className="fixed inset-0 z-50 bg-black text-zinc-100 flex flex-col justify-between p-5 sm:p-6 select-none overflow-y-auto">
      {/* Top Status Header */}
      <div className="flex items-center justify-between border-b border-zinc-900 pb-3 text-xs font-mono-tech text-zinc-500">
        <span>
          INTERCEPT // {lang === 'bn' && app.nameBn ? app.nameBn : app.name.toUpperCase()}
        </span>
        <span>
          OPEN #{app.dailyOpens + 1} TODAY · {initialDelaySeconds}S + 30S QUIZ
        </span>
      </div>

      {/* STEP 1: BREATHING + CALM MIND TRIGGER (QURAN / HADITH / PROVERB) */}
      {step === 'breathing' && (
        <div className="my-auto flex flex-col items-center text-center py-6 max-w-md mx-auto w-full">
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-500 mb-6 font-mono-tech">
            {breathPhase === 'inhale'
              ? t.breatheIn
              : breathPhase === 'hold'
              ? t.holdBreath
              : t.breatheOut}
          </p>

          {/* Minimalist Monochrome Breathing Circle */}
          <div className="relative flex items-center justify-center w-60 h-60 mb-7">
            <div className="absolute inset-0 rounded-full border border-zinc-800 animate-breathe" />
            <div
              className="absolute inset-5 rounded-full border border-zinc-700/60 animate-breathe"
              style={{ animationDelay: '0.6s' }}
            />
            <div className="relative z-10 px-6 flex flex-col items-center">
              <span className="text-3xl font-mono-tech font-light text-zinc-200 mb-2">
                {secondsLeft > 0 ? `${secondsLeft}s` : '✓'}
              </span>
              <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono-tech">
                {trigger.category.toUpperCase()} ANCHOR
              </span>
            </div>
          </div>

          {/* Small, Strong Line Only — Calm Mind Trigger */}
          <div className="border border-zinc-800/90 bg-zinc-950/70 px-5 py-5 w-full mb-5">
            {showArabicScript && trigger.arabic && lang !== 'ar' && (
              <p
                dir="rtl"
                className="font-arabic text-lg text-zinc-300 mb-3 leading-relaxed tracking-wide"
              >
                {trigger.arabic}
              </p>
            )}
            <p className="text-base sm:text-lg font-normal text-zinc-100 leading-relaxed mb-2">
              “{targetTriggerText}”
            </p>
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-zinc-900 text-xs text-zinc-500 font-mono-tech">
              <span>— {targetTriggerSource}</span>
              <button
                type="button"
                onClick={onRotateTrigger}
                className="underline hover:text-zinc-300 cursor-pointer"
              >
                {t.nextWhisperBtn}
              </button>
            </div>
          </div>

          <p className="text-sm text-zinc-400 italic mb-6">{t.willThisServeYou}</p>

          {/* Action Buttons */}
          <div className="w-full space-y-3">
            <button
              type="button"
              onClick={onCancelReturnToPeace}
              className="w-full py-4 border border-zinc-200 bg-zinc-100 text-black font-mono-tech text-sm font-medium tracking-wider uppercase hover:bg-white transition cursor-pointer"
            >
              {t.returnToPeaceBtn}
            </button>

            <button
              type="button"
              disabled={secondsLeft > 0}
              onClick={handleProceedFromBreathing}
              className={`w-full py-3 border text-xs font-mono-tech uppercase tracking-widest transition ${
                secondsLeft > 0
                  ? 'border-zinc-900 text-zinc-700 cursor-not-allowed'
                  : 'border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 cursor-pointer'
              }`}
            >
              {secondsLeft > 0
                ? `${t.continueAnywayBtn} (${secondsLeft}s)`
                : `${t.continueAnywayBtn} →`}
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: MICRO-INTENT CONTRACT & TIME BIDDING */}
      {step === 'intent-bid' && (
        <div className="my-auto max-w-md mx-auto w-full space-y-6 py-4">
          <div className="border-l-2 border-zinc-400 pl-4">
            <p className="text-xs font-mono-tech uppercase text-zinc-500">
              MICRO-INTENT CONTRACT
            </p>
            <h3 className="text-lg font-medium text-zinc-100 mt-1">
              {lang === 'bn' && app.nameBn ? app.nameBn : app.name}
            </h3>
          </div>

          <div>
            <p className="text-xs font-mono-tech text-zinc-400 mb-2">{t.microIntentTitle}</p>
            <div className="space-y-2">
              {[t.intentReplyDm, t.intentSpecificLookup, t.intentConsciousBreak].map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setSelectedIntent(reason)}
                  className={`w-full text-left px-4 py-3 border text-xs font-mono-tech transition cursor-pointer ${
                    selectedIntent === reason
                      ? 'border-zinc-200 bg-zinc-900 text-white'
                      : 'border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  {selectedIntent === reason ? '● ' : '○ '}
                  {reason}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-mono-tech text-zinc-400 mb-2">{t.selectTimeBid}</p>
            <div className="grid grid-cols-4 gap-2">
              {[2, 5, 10, 15].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setSelectedMinutes(mins)}
                  className={`py-3 border text-xs font-mono-tech transition cursor-pointer ${
                    selectedMinutes === mins
                      ? 'border-zinc-100 bg-zinc-100 text-black font-semibold'
                      : 'border-zinc-800 text-zinc-400 hover:border-zinc-600'
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 space-y-2">
            <button
              type="button"
              onClick={onCancelReturnToPeace}
              className="w-full py-3.5 bg-zinc-100 text-black font-mono-tech text-xs font-semibold uppercase tracking-widest cursor-pointer"
            >
              {t.returnToPeaceBtn}
            </button>
            <button
              type="button"
              onClick={handleProceedFromIntent}
              className="w-full py-3 border border-zinc-800 text-zinc-400 hover:text-zinc-200 font-mono-tech text-xs uppercase tracking-widest cursor-pointer"
            >
              {requireHabitWallAlways || activeHabitWall === 'read-30s-quiz' || app.dailyOpens >= 1
                ? `${t.habitWallRequired} →`
                : `Unlock for ${selectedMinutes}m →`}
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: HABIT-WALL GATEKEEPER (INCLUDING 30-SEC SLOW READ + PLAY QUIZ) */}
      {step === 'habit-wall' && (
        <div className="my-auto max-w-md mx-auto w-full space-y-4 py-3">
          <div className="border-b border-zinc-800 pb-2.5">
            <span className="text-[10px] font-mono-tech uppercase tracking-widest text-zinc-500">
              STRICT GATEKEEPER // SLOW LEARNING & HABIT UNLOCK
            </span>
            <h3 className="text-sm sm:text-base font-medium text-zinc-100 mt-1">
              {t.read30sQuizGateTitle} — {app.name} ({selectedMinutes}m)
            </h3>
          </div>

          {/* 5 Habit Wall Selector Tabs (#1 is 30s Read + Quiz) */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 text-[10px] font-mono-tech">
            {[
              { id: 'read-30s-quiz', label: '1. 30s Read+Quiz' },
              { id: 'calm-transcribe', label: '2. Transcribe' },
              { id: 'journal-50', label: '3. Journal' },
              { id: 'read-pages', label: '4. Read 3p' },
              { id: 'steps-20', label: '5. 20 Steps' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveWallTab(tab.id as HabitWallType)}
                className={`py-2 px-1.5 border text-center cursor-pointer ${
                  activeWallTab === tab.id
                    ? 'border-zinc-100 bg-zinc-100 text-black font-semibold'
                    : 'border-zinc-800 text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Gatekeeper 0 (NEW DEFAULT): 30-Second Slow Learning Read + Play Quiz */}
          {activeWallTab === 'read-30s-quiz' && (
            <div className="border border-zinc-800 p-4 space-y-3.5 bg-zinc-950">
              {/* Top Lesson Header & Track Badge */}
              <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                <span className="text-[10px] font-mono-tech uppercase tracking-wider text-zinc-400">
                  {slowLearningTrack === 'islam'
                    ? t.trackIslamicLabel
                    : slowLearningTrack === 'language'
                    ? t.trackLanguageLabel
                    : t.trackMindfulnessLabel}
                </span>
                <button
                  type="button"
                  onClick={handleSwitchLesson}
                  className="text-[10px] font-mono-tech underline text-zinc-400 hover:text-zinc-200 cursor-pointer"
                >
                  Next Lesson ↻
                </button>
              </div>

              {/* Lesson Title & Arabic/Root Header */}
              <div>
                <h4 className="text-sm font-mono-tech font-semibold text-zinc-100">
                  {currentLesson.title[lang]}
                </h4>
                {currentLesson.arabicHeader && (
                  <p
                    dir="rtl"
                    className="font-arabic text-base text-zinc-200 mt-2 bg-black border border-zinc-900 px-3 py-2 leading-relaxed"
                  >
                    {currentLesson.arabicHeader}
                  </p>
                )}
                {currentLesson.transliteration && (
                  <p className="text-[11px] font-mono-tech text-zinc-500 mt-1">
                    {currentLesson.transliteration}
                  </p>
                )}
              </div>

              {/* 30-Second Reading Passage */}
              <div className="bg-black border border-zinc-800 p-3.5 text-xs sm:text-sm text-zinc-200 leading-relaxed space-y-2">
                <p>{currentLesson.readingText[lang]}</p>
                <div className="pt-2 border-t border-zinc-900 text-xs font-mono-tech text-zinc-300">
                  ★ {currentLesson.keyTakeaway[lang]}
                </div>
              </div>

              {/* 30-Second Reading Timer Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono-tech">
                  <span className={readSecondsLeft > 0 ? 'text-zinc-400' : 'text-zinc-100 font-semibold'}>
                    {readSecondsLeft > 0
                      ? `${t.read30sCountdownText} ${readSecondsLeft}s...`
                      : t.quizReadyText}
                  </span>
                  <span className="text-zinc-400">{readProgressPct}%</span>
                </div>
                <div className="w-full h-1.5 bg-zinc-900 overflow-hidden">
                  <div
                    className="h-full bg-zinc-100 transition-all duration-300"
                    style={{ width: `${readProgressPct}%` }}
                  />
                </div>
              </div>

              {/* Comprehension Quiz Section (Locked until 30s reading finishes) */}
              <div
                className={`border p-3.5 space-y-2.5 transition ${
                  readSecondsLeft > 0
                    ? 'border-zinc-900 bg-black/50 opacity-60'
                    : 'border-zinc-700 bg-black'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono-tech uppercase tracking-widest text-zinc-400">
                    COMPREHENSION QUIZ TO UNLOCK APP
                  </span>
                  {readSecondsLeft > 0 && (
                    <span className="text-[10px] font-mono-tech text-zinc-500">
                      🔒 Wait {readSecondsLeft}s
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-sm font-medium text-zinc-100">
                  Q: {currentLesson.quizQuestion[lang]}
                </p>

                <div className="space-y-1.5 pt-1">
                  {currentLesson.quizOptions[lang].map((optText, idx) => {
                    const isSelected = selectedQuizOption === idx;
                    const isCorrect = idx === currentLesson.correctOptionIndex;
                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={readSecondsLeft > 0}
                        onClick={() => handleSelectQuizOption(idx)}
                        className={`w-full text-left p-2.5 border text-xs font-mono-tech transition ${
                          readSecondsLeft > 0
                            ? 'border-zinc-900 text-zinc-600 cursor-not-allowed'
                            : isSelected && isCorrect
                            ? 'border-zinc-100 bg-zinc-100 text-black font-semibold cursor-pointer'
                            : isSelected && !isCorrect
                            ? 'border-zinc-500 bg-zinc-900 text-zinc-300 cursor-pointer'
                            : 'border-zinc-800 text-zinc-300 hover:border-zinc-600 cursor-pointer'
                        }`}
                      >
                        {String.fromCharCode(65 + idx)}. {optText}
                      </button>
                    );
                  })}
                </div>

                {quizErrorFeedback && (
                  <div className="p-2.5 border border-zinc-700 bg-zinc-950 text-[11px] font-mono-tech text-zinc-300">
                    ⚠️ {quizErrorFeedback}
                  </div>
                )}

                {quizPassed && (
                  <div className="p-2.5 border border-zinc-300 bg-zinc-900 text-[11px] font-mono-tech text-zinc-100">
                    ✓ +15 XP! {currentLesson.explanation[lang]}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Gatekeeper 1: Calm Mind Transcription */}
          {activeWallTab === 'calm-transcribe' && (
            <div className="border border-zinc-800 p-4 space-y-3 bg-zinc-950">
              <p className="text-xs text-zinc-400 font-mono-tech">
                Type this calm mind line to center your heart before unlocking:
              </p>
              <blockquote className="text-sm text-zinc-100 border-l-2 border-zinc-500 pl-3 py-1">
                “{targetTriggerText}”
                <span className="block text-xs text-zinc-500 mt-1">— {targetTriggerSource}</span>
              </blockquote>
              <textarea
                value={transcribeInput}
                onChange={(e) => setTranscribeInput(e.target.value)}
                rows={3}
                placeholder="Type the line above..."
                className="w-full bg-black border border-zinc-800 p-3 text-sm text-zinc-100 focus:outline-none focus:border-zinc-400"
              />
              <p className="text-[11px] font-mono-tech text-zinc-500">
                Status:{' '}
                {isTranscriptionComplete
                  ? '✓ Mindful transcription complete'
                  : `${transcribeInput.length} chars typed (keep typing...)`}
              </p>
            </div>
          )}

          {/* Gatekeeper 2: Mindful Journal Entry */}
          {activeWallTab === 'journal-50' && (
            <div className="border border-zinc-800 p-4 space-y-3 bg-zinc-950">
              <p className="text-xs text-zinc-400 font-mono-tech">
                Write a brief reflection or journal entry ({requiredWords}+ words): What are you
                grateful for or focusing on today?
              </p>
              <textarea
                value={journalInput}
                onChange={(e) => setJournalInput(e.target.value)}
                rows={4}
                placeholder="Write your reflection here..."
                className="w-full bg-black border border-zinc-800 p-3 text-sm text-zinc-100 focus:outline-none focus:border-zinc-400"
              />
              <div className="flex justify-between text-[11px] font-mono-tech text-zinc-500">
                <span>
                  Word count: {journalWordCount} / {requiredWords} words
                </span>
                <span>{journalWordCount >= requiredWords ? '✓ Complete' : 'Keep writing...'}</span>
              </div>
            </div>
          )}

          {/* Gatekeeper 3: Read 3 Pages of Focus Reader or Uploaded PDF/Text */}
          {activeWallTab === 'read-pages' && (
            <div className="border border-zinc-800 p-4 space-y-3 bg-zinc-950">
              <div className="flex items-center justify-between text-xs font-mono-tech text-zinc-400">
                <span>
                  {uploadedDocName ? `Book: ${uploadedDocName}` : 'Built-In Calm Mind Reader'}
                </span>
                <label className="underline cursor-pointer hover:text-zinc-200">
                  Upload PDF/TXT
                  <input
                    type="file"
                    accept=".txt,.md,.pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="bg-black border border-zinc-900 p-3.5 text-sm leading-relaxed text-zinc-200">
                <p className="text-xs font-mono-tech text-zinc-400 mb-1.5">
                  {uploadedPages
                    ? `Page ${readerPage} of 3`
                    : lang === 'bn'
                    ? FOCUS_READER_PASSAGES[readerPage - 1].title.bn
                    : FOCUS_READER_PASSAGES[readerPage - 1].title.en}
                </p>
                <p>
                  {uploadedPages
                    ? uploadedPages[readerPage - 1]
                    : lang === 'bn'
                    ? FOCUS_READER_PASSAGES[readerPage - 1].content.bn
                    : FOCUS_READER_PASSAGES[readerPage - 1].content.en}
                </p>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-mono-tech text-zinc-500">
                  Page {readerPage} / 3 {readerPage === 3 ? '✓' : ''}
                </span>
                {readerPage < 3 && (
                  <button
                    type="button"
                    onClick={() => setReaderPage((p) => Math.min(3, p + 1))}
                    className="px-3 py-1.5 border border-zinc-600 text-xs font-mono-tech text-zinc-200 hover:bg-zinc-800 cursor-pointer"
                  >
                    Next Page ({readerPage + 1}/3) →
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Gatekeeper 4: 20 Steps via Hardware Sensor */}
          {activeWallTab === 'steps-20' && (
            <div className="border border-zinc-800 p-4 space-y-3 bg-zinc-950 text-center">
              <p className="text-xs font-mono-tech text-zinc-400">
                Walk 20 steps to break physical posture & reset dopamine loop
              </p>
              <div className="text-3xl font-mono-tech text-zinc-100 py-2">
                {stepsCounted} / 20 STEPS
              </div>
              <div className="w-full h-2 bg-zinc-900 overflow-hidden">
                <div
                  className="h-full bg-zinc-200 transition-all"
                  style={{ width: `${(stepsCounted / 20) * 100}%` }}
                />
              </div>
              <p className="text-[11px] text-zinc-500 font-mono-tech">
                Listening to hardware accelerometer (`DeviceMotionEvent`)...
              </p>
              <button
                type="button"
                onClick={() => setStepsCounted((s) => Math.min(20, s + 5))}
                className="px-4 py-2 border border-zinc-700 text-xs font-mono-tech text-zinc-300 hover:bg-zinc-900 cursor-pointer"
              >
                + Simulate 5 Steps (Desktop / Sensor Test)
              </button>
            </div>
          )}

          {/* Gatekeeper Bottom Actions */}
          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={onCancelReturnToPeace}
              className="w-full py-3.5 bg-zinc-100 text-black font-mono-tech text-xs font-semibold uppercase tracking-widest cursor-pointer"
            >
              {t.returnToPeaceBtn}
            </button>

            <button
              type="button"
              disabled={!isHabitComplete}
              onClick={() =>
                onUnlockApproved(
                  selectedMinutes,
                  selectedIntent,
                  journalInput.trim() || undefined
                )
              }
              className={`w-full py-3 border font-mono-tech text-xs uppercase tracking-widest transition ${
                isHabitComplete
                  ? 'border-zinc-200 bg-zinc-900 text-zinc-100 hover:bg-zinc-800 cursor-pointer'
                  : 'border-zinc-900 text-zinc-700 cursor-not-allowed'
              }`}
            >
              {isHabitComplete
                ? `✓ Quiz & Habit Complete — Open ${app.name} (${selectedMinutes}m)`
                : activeWallTab === 'read-30s-quiz'
                ? readSecondsLeft > 0
                  ? `Read for ${readSecondsLeft}s more to unlock Quiz`
                  : 'Answer the Quiz above correctly to unlock'
                : 'Complete habit above to unlock'}
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-zinc-900 pt-3 flex items-center justify-between text-[11px] font-mono-tech text-zinc-600">
        <span>MINIMUM PHONE // KASB LLC</span>
        <span>100% FREE · ZERO ADS</span>
      </div>
    </div>
  );
};

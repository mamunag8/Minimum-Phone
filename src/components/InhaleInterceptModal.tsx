import React, { useEffect, useState } from 'react';
import type {
  AffectEmotionTag,
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
  getShortLessonPassage,
  getSmartSpacedLesson,
} from '../data/slowLearningCurriculum';
import { getAppDisplayName, TRANSLATIONS, tx } from '../i18n/translations';
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
  openCountToday?: number;
  masteredLessonIds?: string[];
  reviewDueLessonIds?: string[];
  ifThenReplacementHabit?: string;
  onQuizPassed?: (
    lessonId: string,
    firstTrySuccess: boolean,
    emotionTag: AffectEmotionTag
  ) => void;
  onLogEmotionOnly?: (emotionTag: AffectEmotionTag) => void;
  onLogEmotionTag?: (emotionTag: AffectEmotionTag) => void;
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
  readingDurationSeconds = 12,
  lessonIndex = 0,
  openCountToday,
  masteredLessonIds = [],
  reviewDueLessonIds = [],
  onQuizPassed,
  onLogEmotionOnly,
  onLogEmotionTag,
  onCancelReturnToPeace,
  onUnlockApproved,
  onRotateTrigger,
}) => {
  const t = TRANSLATIONS[lang];
  const displayAppName = getAppDisplayName(app, lang);

  // Scientific Method #2: Progressive Friction Scaling (Anti-Habituation)
  // Scales gently by how many times this app was already opened today:
  // 1st-2nd open: 10s, 3rd-4th open: 14s, 5th+ open: 18s (always fast enough to answer within 20s)
  const openNumberToday = (openCountToday ?? app.dailyOpens ?? 0) + 1;
  const progressiveBonusSec = openNumberToday >= 5 ? 6 : openNumberToday >= 3 ? 2 : 0;
  const baseReadSec = Math.min(14, Math.max(8, readingDurationSeconds || 10));
  const effectiveReadDuration = Math.min(18, baseReadSec + progressiveBonusSec);

  // Start directly on the compact 20s Micro-Learning Quiz when read-30s-quiz is active
  const [step, setStep] = useState<'breathing' | 'habit-wall'>(
    activeHabitWall === 'read-30s-quiz' || requireHabitWallAlways ? 'habit-wall' : 'breathing'
  );

  // Scientific Method #4: Stanford Cyclic Physiological Sigh (2s Inhale 1 + 1s Inhale 2 + 6s Exhale)
  const [sighTick, setSighTick] = useState<number>(0);
  const [secondsLeft, setSecondsLeft] = useState<number>(9);

  // Scientific Method #1: Affect Labeling ("Name It to Tame It" — 1-Tap Emotion Tag)
  const [selectedEmotion, setSelectedEmotion] = useState<AffectEmotionTag>('task');

  // Micro-Intent & Time Bid state
  const [selectedIntent] = useState<string>(t.intentReplyDm);
  const [selectedMinutes, setSelectedMinutes] = useState<number>(10);

  // Habit Wall states
  const [activeWallTab, setActiveWallTab] = useState<HabitWallType>(activeHabitWall);
  const [transcribeInput, setTranscribeInput] = useState<string>('');
  const [journalInput] = useState<string>('');
  const [readerPage, setReaderPage] = useState<number>(1);
  const [stepsCounted, setStepsCounted] = useState<number>(0);

  // Scientific Method #3: Spaced Repetition (Leitner / SM-2 Smart Lesson Picker)
  const [localLessonIdx, setLocalLessonIdx] = useState<number>(lessonIndex);
  const {
    lesson: currentLesson,
    isReviewDue,
    isMastered,
  } = getSmartSpacedLesson(
    slowLearningTrack,
    localLessonIdx,
    masteredLessonIds,
    reviewDueLessonIds
  );

  const [readSecondsLeft, setReadSecondsLeft] = useState<number>(effectiveReadDuration);
  const [selectedQuizOption, setSelectedQuizOption] = useState<number | null>(null);
  const [quizPassed, setQuizPassed] = useState<boolean>(false);
  const [hadWrongAttempt, setHadWrongAttempt] = useState<boolean>(false);
  const [quizErrorFeedback, setQuizErrorFeedback] = useState<string | null>(null);

  // Countdown timer for Stanford Cyclic Sigh breathing view
  useEffect(() => {
    if (step !== 'breathing') return;
    const timer = setInterval(() => {
      setSighTick((prev) => (prev + 1) % 9);
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [step]);

  // Countdown timer for the Compact Micro-Learning Quiz Gate
  useEffect(() => {
    if (step !== 'habit-wall' || activeWallTab !== 'read-30s-quiz') return;
    if (readSecondsLeft <= 0) return;
    const timer = setInterval(() => {
      setReadSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [step, activeWallTab, readSecondsLeft]);

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
  const requiredWords = 15;

  const normalizedTarget = targetTriggerText
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .trim();
  const normalizedTyped = transcribeInput
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .trim();
  const isTranscriptionComplete =
    normalizedTyped.length >= Math.min(15, Math.floor(normalizedTarget.length * 0.55));

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
        onQuizPassed?.(currentLesson.id, !hadWrongAttempt, selectedEmotion);
      }
    } else {
      setQuizPassed(false);
      setHadWrongAttempt(true);
      setQuizErrorFeedback(
        tx(
          lang,
          'Not quite right. Re-read for 5 seconds and tap the correct answer.',
          'সঠিক উত্তর হয়নি। ৫ সেকেন্ড মনোযোগ দিয়ে পড়ে সঠিক উত্তরটিতে ট্যাপ করুন।',
          'إجابة غير صحيحة. أعد القراءة لمدة ٥ ثوانٍ ثم اختر الإجابة الصحيحة.',
          'درست نہیں۔ 5 سیکنڈ دوبارہ پڑھ کر صحیح جواب منتخب کریں۔',
          'Belum tepat. Baca ulang 5 detik lalu ketuk jawaban yang benar.'
        )
      );
      setReadSecondsLeft(5);
    }
  };

  const handleSwitchLesson = () => {
    setLocalLessonIdx((i) => i + 1);
    setReadSecondsLeft(effectiveReadDuration);
    setSelectedQuizOption(null);
    setQuizPassed(false);
    setHadWrongAttempt(false);
    setQuizErrorFeedback(null);
  };

  const handleReturnWithPeaceAndIfThen = () => {
    onLogEmotionOnly?.(selectedEmotion);
    onLogEmotionTag?.(selectedEmotion);
    onCancelReturnToPeace();
  };

  const readProgressPct = Math.min(
    100,
    Math.round(
      ((effectiveReadDuration - readSecondsLeft) / Math.max(1, effectiveReadDuration)) * 100
    )
  );

  const shortPassage = getShortLessonPassage(currentLesson, lang);
  const takeawayLine =
    currentLesson.keyTakeaway[lang] || currentLesson.keyTakeaway.en;

  // Stanford Cyclic Sigh phase description (2s Inhale 1 -> 1s Inhale 2 -> 6s Exhale)
  const sighPhaseLabel =
    sighTick < 2
      ? tx(
          lang,
          '1/3 · Deep Inhale through Nose (2s)...',
          '১/৩ · নাক দিয়ে গভীর শ্বাস নিন (২ সে.)...',
          '١/٣ · شهيق عميق من الأنف (٢ث)...',
          '1/3 · ناک سے گہرا سانس لیں (2 سیکنڈ)...',
          '1/3 · Tarik Napas Dalam lewat Hidung (2d)...'
        )
      : sighTick < 3
      ? tx(
          lang,
          '2/3 · Second Quick Top-Up Inhale (1s)!',
          '২/৩ · নাকে আরেকটি ছোট্ট শ্বাস নিন (১ সে.)!',
          '٢/٣ · شهيق ثانٍ سريع ومختصر (١ث)!',
          '2/3 · ایک اور چھوٹا سا سانس اندر کھینچیں (1 سیکنڈ)!',
          '2/3 · Tarik Napas Tambahan Cepat (1d)!'
        )
      : tx(
          lang,
          '3/3 · Long, Slow Exhale through Mouth (6s)...',
          '৩/৩ · মুখ দিয়ে ধীরে ধীরে লম্বা শ্বাস ছাড়ুন (৬ সে.)...',
          '٣/٣ · زفير طويل وبطيء من الفم (٦ث)...',
          '3/3 · منہ سے لمبا اور آہستہ سانس چھوڑیں (6 سیکنڈ)...',
          '3/3 · Hembuskan Perlahan lewat Mulut (6d)...'
        );

  return (
    <div className="fixed inset-0 z-50 bg-black text-zinc-100 flex flex-col justify-between p-3 sm:p-5 select-none overflow-y-auto overflow-x-hidden safe-shell">
      {/* Compact Top Status Header */}
      <div className="flex items-center justify-between gap-2 border-b border-zinc-900 pb-2 text-[11px] font-mono-tech text-zinc-400">
        <span className="truncate font-semibold text-zinc-200">
          ⚡ {tx(lang, '20S QUICK QUIZ', '২০-সেকেন্ড কুইজ গেট', 'اختبار ٢٠ ثانية', '20 سیکنڈ کوئز', 'KUIS 20 DETIK')} // {displayAppName}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="px-1.5 py-0.5 border border-zinc-800 text-[10px] text-zinc-300">
            {tx(
              lang,
              `Open #${openNumberToday}`,
              `আজ #${openNumberToday} বার`,
              `فتح #${openNumberToday}`,
              `آج #${openNumberToday}`,
              `Buka #${openNumberToday}`
            )}
          </span>
          <button
            type="button"
            onClick={() => setStep(step === 'breathing' ? 'habit-wall' : 'breathing')}
            className="px-2 py-0.5 border border-zinc-800 text-[10px] text-zinc-400 cursor-pointer"
          >
            {step === 'breathing'
              ? tx(lang, 'Quiz', 'কুইজ', 'الاختبار', 'کوئز', 'Kuis')
              : tx(lang, 'Sigh Breath', 'শ্বাস প্রশান্তি', 'تنفس السكينة', 'سانس کی مشق', 'Napas')}
          </button>
          <button
            type="button"
            onClick={handleReturnWithPeaceAndIfThen}
            className="px-2 py-0.5 border border-zinc-700 text-[10px] text-zinc-200 cursor-pointer"
          >
            ✕
          </button>
        </div>
      </div>

      {/* STANFORD CYCLIC PHYSIOLOGICAL SIGH BREATHING VIEW */}
      {step === 'breathing' && (
        <div className="my-auto flex flex-col items-center text-center py-3 max-w-sm mx-auto w-full space-y-3.5">
          <div className="text-[10px] font-mono-tech uppercase tracking-widest text-zinc-400">
            {tx(
              lang,
              'STANFORD CYCLIC PHYSIOLOGICAL SIGH (2-INHALE + 1-EXHALE)',
              'বৈজ্ঞানিক সাইক্লিক সাই শ্বাস-প্রশ্বাস (২ বার শ্বাস গ্রহণ + ১ বার দীর্ঘ ত্যাগ)',
              'التنفس الفسيولوجي المزدوج لتهدئة الجهاز العصبي',
              'اسٹینفورڈ سائیکلک سائی سانس کی مشق (2 سانس اندر + 1 لمبا سانس باہر)',
              'Pernapasan Cyclic Sigh Stanford (2 Tarik + 1 Hembus Panjang)'
            )}
          </div>
          <p className="text-xs font-mono-tech text-zinc-100 font-semibold">
            {sighPhaseLabel}
          </p>

          <div className="relative flex items-center justify-center w-32 h-32">
            <div className="absolute inset-0 rounded-full border border-zinc-700 animate-breathe" />
            <div className="relative z-10 flex flex-col items-center">
              <span className="text-2xl font-mono-tech font-light text-zinc-100">
                {secondsLeft > 0 ? `${secondsLeft}s` : '✓'}
              </span>
              <span className="text-[10px] font-mono-tech text-zinc-400 mt-0.5">
                {sighTick < 3
                  ? tx(lang, 'INHALE', 'শ্বাস নিন', 'شهيق', 'سانس لیں', 'TARIK')
                  : tx(lang, 'EXHALE', 'শ্বাস ছাড়ুন', 'زفير', 'سانس چھوڑیں', 'HEMBUS')}
              </span>
            </div>
          </div>

          <div className="border border-zinc-800 bg-zinc-950 p-3 w-full text-left space-y-1.5">
            {showArabicScript && trigger.arabic && lang !== 'ar' && (
              <p dir="rtl" className="font-arabic text-base text-zinc-200 text-right">
                {trigger.arabic}
              </p>
            )}
            <p className="text-xs sm:text-sm text-zinc-100 leading-snug">
              “{targetTriggerText}”
            </p>
            <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono-tech">
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

          <div className="w-full space-y-2">
            <button
              type="button"
              onClick={handleReturnWithPeaceAndIfThen}
              className="w-full py-3 bg-zinc-100 text-black font-mono-tech text-xs font-semibold uppercase tracking-wider cursor-pointer"
            >
              {tx(
                lang,
                '✓ Return to Peace (+20 XP · Drink Water / Dhikr)',
                '✓ প্রশান্তিতে ফিরে যান (+২০ XP · ১ ঢোক পানি পান বা যিকির করুন)',
                '✓ العودة إلى السكينة (+٢٠ XP · اشرب ماءً أو اذكر الله)',
                '✓ سکون کی طرف لوٹیں (+20 XP · پانی پئیں یا ذکر کریں)',
                '✓ Kembali ke Ketenangan (+20 XP · Minum Air / Dzikir)'
              )}
            </button>
            <button
              type="button"
              onClick={() => setStep('habit-wall')}
              className="w-full py-2.5 border border-zinc-800 text-xs font-mono-tech text-zinc-300 cursor-pointer"
            >
              {tx(
                lang,
                'Continue to 20s Quick Quiz →',
                '২০-সেকেন্ড কুইজে যান →',
                'المتابعة إلى اختبار ٢٠ ثانية ←',
                '20 سیکنڈ کوئز کی طرف بڑھیں ←',
                'Lanjut ke Kuis 20 Detik →'
              )}
            </button>
          </div>
        </div>
      )}

      {/* COMPACT 20-SECOND MICRO-LEARNING & QUIZ SCREEN (DEFAULT) */}
      {step === 'habit-wall' && (
        <div className="my-auto max-w-md mx-auto w-full space-y-2 py-0.5">
          {/* Scientific Method #1: Affect Labeling ("Name It to Tame It") + Session Time Limit */}
          <div className="border border-zinc-800 bg-zinc-950 p-2 space-y-1.5">
            <div className="flex items-center justify-between gap-1 text-[10px] font-mono-tech">
              <span className="text-zinc-400 truncate">
                {tx(
                  lang,
                  'Why open now? (Name feeling):',
                  'কেন খুলছেন? (মনের অবস্থা চিহ্নিত করুন):',
                  'لماذا تفتح الآن؟ (سمِّ شعورك):',
                  'ابھی کیوں کھول رہے ہیں؟ (احساس پہچانیں):',
                  'Mengapa buka sekarang? (Kenali perasaan):'
                )}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                {[5, 10, 15, 20].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setSelectedMinutes(mins)}
                    className={`px-1.5 py-0.5 border text-[10px] font-mono-tech cursor-pointer ${
                      selectedMinutes === mins
                        ? 'border-zinc-100 bg-zinc-100 text-black font-bold'
                        : 'border-zinc-800 text-zinc-400'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-1 text-[10px] font-mono-tech">
              {(
                [
                  {
                    id: 'task',
                    label: tx(lang, '🎯 Task', '🎯 কাজ', '🎯 عمل', '🎯 کام', '🎯 Tugas'),
                  },
                  {
                    id: 'bored',
                    label: tx(lang, '😐 Bored', '😐 একঘেয়েমি', '😐 ملل', '😐 بوریت', '😐 Bosan'),
                  },
                  {
                    id: 'stressed',
                    label: tx(lang, '😰 Stress', '😰 চাপ/উদ্বেগ', '😰 توتر', '😰 تناؤ', '😰 Stres'),
                  },
                  {
                    id: 'tired',
                    label: tx(lang, '😴 Tired', '😴 ক্লান্তি', '😴 إرهاق', '😴 تھکن', '😴 Lelah'),
                  },
                ] as const
              ).map((em) => (
                <button
                  key={em.id}
                  type="button"
                  onClick={() => setSelectedEmotion(em.id)}
                  className={`py-1 px-1 border text-center truncate cursor-pointer ${
                    selectedEmotion === em.id
                      ? 'border-zinc-100 bg-zinc-100 text-black font-semibold'
                      : 'border-zinc-800 bg-black text-zinc-400'
                  }`}
                >
                  {em.label}
                </button>
              ))}
            </div>
          </div>

          {/* Compact Habit Mode Pills */}
          <div className="grid grid-cols-4 gap-1 text-[10px] font-mono-tech">
            {[
              {
                id: 'read-30s-quiz',
                label: tx(lang, '⚡ 20s Quiz', '⚡ ২০সে. কুইজ', '⚡ اختبار ٢٠ث', '⚡ 20s کوئز', '⚡ Kuis 20d'),
              },
              {
                id: 'calm-transcribe',
                label: tx(lang, '✍️ Type', '✍️ লিখুন', '✍️ كتابة', '✍️ لکھیں', '✍️ Ketik'),
              },
              {
                id: 'read-pages',
                label: tx(lang, '📖 Read', '📖 পাঠ', '📖 قراءة', '📖 مطالعہ', '📖 Baca'),
              },
              {
                id: 'steps-20',
                label: tx(lang, '👟 Steps', '👟 হাঁটুন', '👟 خطوات', '👟 قدم', '👟 Langkah'),
              },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveWallTab(tab.id as HabitWallType)}
                className={`py-1.5 px-1 border text-center cursor-pointer truncate ${
                  activeWallTab === tab.id
                    ? 'border-zinc-100 bg-zinc-100 text-black font-semibold'
                    : 'border-zinc-900 text-zinc-500'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Gatekeeper 0 (DEFAULT): Compact, Bite-Sized 20-Sec Read + 1-Tap Quiz */}
          {activeWallTab === 'read-30s-quiz' && (
            <div className="border border-zinc-700 p-2.5 space-y-2 bg-zinc-950">
              {/* Lesson Title + Spaced Repetition & Countdown Badge */}
              <div className="flex items-center justify-between gap-2 border-b border-zinc-900 pb-1.5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-mono-tech px-1.5 py-0.5 border border-zinc-700 text-zinc-300 shrink-0">
                      {isReviewDue
                        ? tx(lang, '🔄 Review Due', '🔄 পুনঃঅনুশীলন', '🔄 مراجعة', '🔄 دہرائی', '🔄 Ulasan')
                        : isMastered
                        ? tx(lang, '✓ Mastered', '✓ আয়ত্তকৃত', '✓ متقن', '✓ یاد شدہ', '✓ Dikuasai')
                        : tx(lang, '🧠 New Lesson', '🧠 নতুন পাঠ', '🧠 درس جديد', '🧠 نیا سبق', '🧠 Baru')}
                    </span>
                    <h4 className="text-xs font-mono-tech font-semibold text-zinc-100 truncate">
                      {currentLesson.title[lang] || currentLesson.title.en}
                    </h4>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`px-2 py-0.5 border text-[10px] font-mono-tech ${
                      readSecondsLeft > 0
                        ? 'border-zinc-700 text-zinc-300'
                        : 'border-zinc-200 bg-zinc-100 text-black font-bold'
                    }`}
                  >
                    {readSecondsLeft > 0
                      ? `⏳ ${readSecondsLeft}s`
                      : tx(lang, '✓ Answer', '✓ উত্তর দিন', '✓ أجب الآن', '✓ جواب دیں', '✓ Jawab')}
                  </span>
                  <button
                    type="button"
                    onClick={handleSwitchLesson}
                    className="text-[10px] font-mono-tech underline text-zinc-400 cursor-pointer"
                  >
                    ↻
                  </button>
                </div>
              </div>

              {/* Short, Easy-to-Read Micro-Passage */}
              <div className="bg-black border border-zinc-800 p-2.5 space-y-1.5">
                {showArabicScript && currentLesson.arabicHeader && (
                  <p
                    dir="rtl"
                    className="font-arabic text-sm text-zinc-200 text-right leading-snug"
                  >
                    {currentLesson.arabicHeader}
                  </p>
                )}
                <p className="text-xs text-zinc-200 leading-snug">{shortPassage}</p>
                <div className="pt-1 border-t border-zinc-900 text-[11px] font-mono-tech text-zinc-100 font-medium leading-snug">
                  ★ {takeawayLine}
                </div>
              </div>

              {/* Slim Reading Progress Bar */}
              <div className="w-full h-1 bg-zinc-900 overflow-hidden">
                <div
                  className="h-full bg-zinc-100 transition-all duration-300"
                  style={{ width: `${readProgressPct}%` }}
                />
              </div>

              {/* Compact 1-Tap Quiz Question & Options */}
              <div className="space-y-1.5 pt-0.5">
                <p className="text-xs font-semibold text-zinc-100 leading-snug">
                  {tx(lang, 'Q:', 'প্রশ্ন:', 'س:', 'سوال:', 'P:')}{' '}
                  {currentLesson.quizQuestion[lang] || currentLesson.quizQuestion.en}
                </p>

                <div className="space-y-1">
                  {(
                    currentLesson.quizOptions[lang] || currentLesson.quizOptions.en
                  ).map((optText, idx) => {
                    const isSelected = selectedQuizOption === idx;
                    const isCorrect = idx === currentLesson.correctOptionIndex;
                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={readSecondsLeft > 0}
                        onClick={() => handleSelectQuizOption(idx)}
                        className={`w-full text-left px-2.5 py-1.5 border text-xs font-mono-tech leading-snug transition ${
                          readSecondsLeft > 0
                            ? 'border-zinc-900 text-zinc-500 opacity-60 cursor-not-allowed'
                            : isSelected && isCorrect
                            ? 'border-zinc-100 bg-zinc-100 text-black font-bold cursor-pointer'
                            : isSelected && !isCorrect
                            ? 'border-zinc-500 bg-zinc-900 text-zinc-300 cursor-pointer'
                            : 'border-zinc-800 bg-black text-zinc-200 hover:border-zinc-500 cursor-pointer'
                        }`}
                      >
                        {String.fromCharCode(65 + idx)}. {optText}
                      </button>
                    );
                  })}
                </div>

                {quizErrorFeedback && (
                  <div className="p-2 border border-zinc-700 bg-black text-[11px] font-mono-tech text-zinc-300">
                    ⚠️ {quizErrorFeedback}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Gatekeeper 1: Calm Mind Transcription */}
          {activeWallTab === 'calm-transcribe' && (
            <div className="border border-zinc-800 p-3 space-y-2.5 bg-zinc-950">
              <blockquote className="text-xs text-zinc-100 border-l-2 border-zinc-500 pl-2.5 py-0.5">
                “{targetTriggerText}”
              </blockquote>
              <textarea
                value={transcribeInput}
                onChange={(e) => setTranscribeInput(e.target.value)}
                rows={2}
                placeholder={tx(
                  lang,
                  'Type the line above...',
                  'উপরের বাণীটি এখানে টাইপ করুন...',
                  'اكتب العبارة أعلاه...',
                  'اوپر والی عبارت یہاں لکھیں...',
                  'Ketik kalimat di atas...'
                )}
                className="w-full bg-black border border-zinc-800 p-2.5 text-xs text-zinc-100 focus:outline-none focus:border-zinc-400"
              />
            </div>
          )}

          {/* Gatekeeper 2: Read 3 Short Cards */}
          {activeWallTab === 'read-pages' && (
            <div className="border border-zinc-800 p-3 space-y-2.5 bg-zinc-950">
              <div className="bg-black border border-zinc-900 p-3 text-xs leading-relaxed text-zinc-200">
                <p className="font-mono-tech text-zinc-400 mb-1">
                  {tx(lang, 'Card', 'কার্ড', 'بطاقة', 'کارڈ', 'Kartu')} {readerPage} / 3 —{' '}
                  {FOCUS_READER_PASSAGES[readerPage - 1].title[lang] ||
                    FOCUS_READER_PASSAGES[readerPage - 1].title.en}
                </p>
                <p>
                  {FOCUS_READER_PASSAGES[readerPage - 1].content[lang] ||
                    FOCUS_READER_PASSAGES[readerPage - 1].content.en}
                </p>
              </div>
              {readerPage < 3 && (
                <button
                  type="button"
                  onClick={() => setReaderPage((p) => Math.min(3, p + 1))}
                  className="w-full py-2 border border-zinc-600 text-xs font-mono-tech text-zinc-200 cursor-pointer"
                >
                  {tx(
                    lang,
                    `Next Card (${readerPage + 1}/3) →`,
                    `পরবর্তী কার্ড (${readerPage + 1}/৩) →`,
                    `البطاقة التالية (${readerPage + 1}/٣) ←`,
                    `اگلا کارڈ (${readerPage + 1}/3) ←`,
                    `Kartu Berikutnya (${readerPage + 1}/3) →`
                  )}
                </button>
              )}
            </div>
          )}

          {/* Gatekeeper 3: 20 Steps */}
          {activeWallTab === 'steps-20' && (
            <div className="border border-zinc-800 p-3 space-y-2 bg-zinc-950 text-center">
              <div className="text-2xl font-mono-tech text-zinc-100">
                {stepsCounted} / 20 {tx(lang, 'STEPS', 'কদম', 'خطوة', 'قدم', 'LANGKAH')}
              </div>
              <button
                type="button"
                onClick={() => setStepsCounted((s) => Math.min(20, s + 5))}
                className="px-4 py-2 border border-zinc-700 text-xs font-mono-tech text-zinc-300 cursor-pointer"
              >
                {tx(lang, '+5 Steps', '+৫ কদম হাঁটুন', '+٥ خطوات', '+5 قدم', '+5 Langkah')}
              </button>
            </div>
          )}

          {/* Compact Bottom Action Buttons with Method #5 (If–Then) & Method #7 (+20 XP Reward) */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={handleReturnWithPeaceAndIfThen}
              className="py-2.5 px-2 border border-zinc-500 bg-zinc-900 text-zinc-100 font-mono-tech text-[11px] font-semibold leading-tight cursor-pointer"
            >
              {tx(
                lang,
                '← Peace (+20 XP · Deep Sigh)',
                '← ফিরে যান (+২০ XP · শ্বাস নিন)',
                '← السكينة (+٢٠ XP)',
                '← سکون (+20 XP)',
                '← Tenang (+20 XP)'
              )}
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
              className={`py-2.5 px-2 border font-mono-tech text-[11px] font-bold uppercase tracking-wider transition ${
                isHabitComplete
                  ? 'border-zinc-100 bg-zinc-100 text-black cursor-pointer'
                  : 'border-zinc-900 bg-zinc-950 text-zinc-600 cursor-not-allowed'
              }`}
            >
              {isHabitComplete
                ? tx(
                    lang,
                    `✓ Open (${selectedMinutes}m) →`,
                    `✓ খুলুন (${selectedMinutes} মিনিট) →`,
                    `✓ افتح (${selectedMinutes} د) ←`,
                    `✓ کھولیں (${selectedMinutes}m) ←`,
                    `✓ Buka (${selectedMinutes}m) →`
                  )
                : readSecondsLeft > 0
                ? tx(
                    lang,
                    `Read ${readSecondsLeft}s...`,
                    `${readSecondsLeft} সে. পড়ুন...`,
                    `اقرأ ${readSecondsLeft}ث...`,
                    `${readSecondsLeft}s پڑھیں...`,
                    `Baca ${readSecondsLeft}d...`
                  )
                : tx(
                    lang,
                    'Tap Answer ↑',
                    'উপরে উত্তর ট্যাপ করুন ↑',
                    'اختر الإجابة ↑',
                    'اوپر جواب منتخب کریں ↑',
                    'Ketuk Jawaban ↑'
                  )}
            </button>
          </div>
        </div>
      )}

      {/* Slim Footer */}
      <div className="border-t border-zinc-900 pt-1.5 flex items-center justify-between text-[10px] font-mono-tech text-zinc-600">
        <span>{t.appName}</span>
        <span>
          {tx(
            lang,
            'SPACED REPETITION · 20S QUIZ GATE',
            'স্পেসড রিপিটিশন · ২০-সেকেন্ড কুইজ গেট',
            'التكرار المتباعد · بوابة ٢٠ ثانية',
            'اسپیسڈ ریپیٹیشن · 20 سیکنڈ کوئز',
            'SPACED REPETITION · KUIS 20D'
          )}
        </span>
      </div>
    </div>
  );
};

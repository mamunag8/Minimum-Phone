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
  getShortLessonPassage,
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
  readingDurationSeconds = 12,
  lessonIndex = 0,
  onQuizPassed,
  onCancelReturnToPeace,
  onUnlockApproved,
  onRotateTrigger,
}) => {
  const t = TRANSLATIONS[lang];

  // Fast, compact 12s reading countdown so the user can read + answer within 20 seconds total
  const effectiveReadDuration = Math.min(15, Math.max(8, readingDurationSeconds || 12));

  // Start directly on the compact 20s Micro-Learning Quiz when read-30s-quiz is active
  const [step, setStep] = useState<'breathing' | 'habit-wall'>(
    activeHabitWall === 'read-30s-quiz' || requireHabitWallAlways ? 'habit-wall' : 'breathing'
  );

  const [secondsLeft, setSecondsLeft] = useState<number>(5);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');

  // Micro-Intent & Time Bid state
  const [selectedIntent] = useState<string>(t.intentReplyDm);
  const [selectedMinutes, setSelectedMinutes] = useState<number>(10);

  // Habit Wall states
  const [activeWallTab, setActiveWallTab] = useState<HabitWallType>(activeHabitWall);
  const [transcribeInput, setTranscribeInput] = useState<string>('');
  const [journalInput, setJournalInput] = useState<string>('');
  const [readerPage, setReaderPage] = useState<number>(1);
  const [stepsCounted, setStepsCounted] = useState<number>(0);

  // Compact 20-Sec Micro-Learning Read + Quiz Gate State
  const trackLessons = getLessonsForTrack(slowLearningTrack);
  const [localLessonIdx, setLocalLessonIdx] = useState<number>(lessonIndex);
  const currentLesson: SlowLearningLesson =
    trackLessons[localLessonIdx % trackLessons.length];

  const [readSecondsLeft, setReadSecondsLeft] = useState<number>(effectiveReadDuration);
  const [selectedQuizOption, setSelectedQuizOption] = useState<number | null>(null);
  const [quizPassed, setQuizPassed] = useState<boolean>(false);
  const [quizErrorFeedback, setQuizErrorFeedback] = useState<string | null>(null);

  // Countdown timer for optional breathing view
  useEffect(() => {
    if (step !== 'breathing') return;
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft, step]);

  // Countdown timer for the Compact Micro-Learning Quiz Gate (12s read -> answer within 20s)
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
    }, 2000);
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
        onQuizPassed?.();
      }
    } else {
      setQuizPassed(false);
      setQuizErrorFeedback(
        lang === 'bn'
          ? 'সঠিক নয়। ৫ সেকেন্ড পড়ে আবার সঠিক উত্তরটি ট্যাপ করুন।'
          : 'Not quite right. Re-read for 5 seconds and tap the correct answer.'
      );
      setReadSecondsLeft(5);
    }
  };

  const handleSwitchLesson = () => {
    setLocalLessonIdx((i) => i + 1);
    setReadSecondsLeft(effectiveReadDuration);
    setSelectedQuizOption(null);
    setQuizPassed(false);
    setQuizErrorFeedback(null);
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

  return (
    <div className="fixed inset-0 z-50 bg-black text-zinc-100 flex flex-col justify-between p-3 sm:p-5 select-none overflow-y-auto overflow-x-hidden safe-shell">
      {/* Compact Top Status Header */}
      <div className="flex items-center justify-between border-b border-zinc-900 pb-2 text-[11px] font-mono-tech text-zinc-400">
        <span className="truncate font-semibold text-zinc-200">
          ⚡ 20S QUICK QUIZ // {lang === 'bn' && app.nameBn ? app.nameBn : app.name}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setStep(step === 'breathing' ? 'habit-wall' : 'breathing')}
            className="px-2 py-0.5 border border-zinc-800 text-[10px] text-zinc-400 cursor-pointer"
          >
            {step === 'breathing' ? 'Quiz Mode' : 'Breath Mode'}
          </button>
          <button
            type="button"
            onClick={onCancelReturnToPeace}
            className="px-2 py-0.5 border border-zinc-700 text-[10px] text-zinc-200 cursor-pointer"
          >
            ✕ Close
          </button>
        </div>
      </div>

      {/* OPTIONAL BREATHING VIEW */}
      {step === 'breathing' && (
        <div className="my-auto flex flex-col items-center text-center py-3 max-w-sm mx-auto w-full space-y-4">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-400 font-mono-tech">
            {breathPhase === 'inhale'
              ? t.breatheIn
              : breathPhase === 'hold'
              ? t.holdBreath
              : t.breatheOut}
          </p>

          <div className="relative flex items-center justify-center w-36 h-36">
            <div className="absolute inset-0 rounded-full border border-zinc-800 animate-breathe" />
            <div className="relative z-10 flex flex-col items-center">
              <span className="text-2xl font-mono-tech font-light text-zinc-100">
                {secondsLeft > 0 ? `${secondsLeft}s` : '✓'}
              </span>
            </div>
          </div>

          <div className="border border-zinc-800 bg-zinc-950 p-3.5 w-full text-left space-y-1.5">
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
              onClick={onCancelReturnToPeace}
              className="w-full py-3 bg-zinc-100 text-black font-mono-tech text-xs font-semibold uppercase tracking-wider cursor-pointer"
            >
              {t.returnToPeaceBtn}
            </button>
            <button
              type="button"
              disabled={secondsLeft > 0}
              onClick={() => setStep('habit-wall')}
              className="w-full py-2.5 border border-zinc-800 text-xs font-mono-tech text-zinc-300 disabled:opacity-40 cursor-pointer"
            >
              {secondsLeft > 0 ? `Wait ${secondsLeft}s...` : 'Continue to 20s Quick Quiz →'}
            </button>
          </div>
        </div>
      )}

      {/* COMPACT 20-SECOND MICRO-LEARNING & QUIZ SCREEN (DEFAULT) */}
      {step === 'habit-wall' && (
        <div className="my-auto max-w-md mx-auto w-full space-y-2.5 py-1">
          {/* Compact Session Time Bid Bar + Mode Selector */}
          <div className="flex items-center justify-between gap-2 border border-zinc-800 bg-zinc-950 px-3 py-2">
            <span className="text-[11px] font-mono-tech text-zinc-400">
              Time Limit:
            </span>
            <div className="flex items-center gap-1">
              {[5, 10, 15, 20].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setSelectedMinutes(mins)}
                  className={`px-2.5 py-1 border text-[11px] font-mono-tech cursor-pointer ${
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

          {/* Compact Habit Mode Pills */}
          <div className="grid grid-cols-4 gap-1 text-[10px] font-mono-tech">
            {[
              { id: 'read-30s-quiz', label: '⚡ 20s Quiz' },
              { id: 'calm-transcribe', label: '✍️ Type' },
              { id: 'read-pages', label: '📖 Read' },
              { id: 'steps-20', label: '👟 Steps' },
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
            <div className="border border-zinc-700 p-3 space-y-2.5 bg-zinc-950">
              {/* Lesson Title + Countdown Badge */}
              <div className="flex items-center justify-between gap-2 border-b border-zinc-900 pb-1.5">
                <h4 className="text-xs sm:text-sm font-mono-tech font-semibold text-zinc-100 truncate">
                  {currentLesson.title[lang] || currentLesson.title.en}
                </h4>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`px-2 py-0.5 border text-[10px] font-mono-tech ${
                      readSecondsLeft > 0
                        ? 'border-zinc-700 text-zinc-300'
                        : 'border-zinc-200 bg-zinc-100 text-black font-bold'
                    }`}
                  >
                    {readSecondsLeft > 0 ? `⏳ ${readSecondsLeft}s` : '✓ Answer Now'}
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
                  Q: {currentLesson.quizQuestion[lang] || currentLesson.quizQuestion.en}
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
                        className={`w-full text-left px-2.5 py-2 border text-xs font-mono-tech leading-snug transition ${
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
                placeholder="Type the line above..."
                className="w-full bg-black border border-zinc-800 p-2.5 text-xs text-zinc-100 focus:outline-none focus:border-zinc-400"
              />
            </div>
          )}

          {/* Gatekeeper 2: Read 3 Short Cards */}
          {activeWallTab === 'read-pages' && (
            <div className="border border-zinc-800 p-3 space-y-2.5 bg-zinc-950">
              <div className="bg-black border border-zinc-900 p-3 text-xs leading-relaxed text-zinc-200">
                <p className="font-mono-tech text-zinc-400 mb-1">
                  Card {readerPage} / 3 —{' '}
                  {lang === 'bn'
                    ? FOCUS_READER_PASSAGES[readerPage - 1].title.bn
                    : FOCUS_READER_PASSAGES[readerPage - 1].title.en}
                </p>
                <p>
                  {lang === 'bn'
                    ? FOCUS_READER_PASSAGES[readerPage - 1].content.bn
                    : FOCUS_READER_PASSAGES[readerPage - 1].content.en}
                </p>
              </div>
              {readerPage < 3 && (
                <button
                  type="button"
                  onClick={() => setReaderPage((p) => Math.min(3, p + 1))}
                  className="w-full py-2 border border-zinc-600 text-xs font-mono-tech text-zinc-200 cursor-pointer"
                >
                  Next Card ({readerPage + 1}/3) →
                </button>
              )}
            </div>
          )}

          {/* Gatekeeper 3: 20 Steps */}
          {activeWallTab === 'steps-20' && (
            <div className="border border-zinc-800 p-3 space-y-2 bg-zinc-950 text-center">
              <div className="text-2xl font-mono-tech text-zinc-100">
                {stepsCounted} / 20 STEPS
              </div>
              <button
                type="button"
                onClick={() => setStepsCounted((s) => Math.min(20, s + 5))}
                className="px-4 py-2 border border-zinc-700 text-xs font-mono-tech text-zinc-300 cursor-pointer"
              >
                +5 Steps
              </button>
            </div>
          )}

          {/* Compact Bottom Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={onCancelReturnToPeace}
              className="py-3 border border-zinc-700 bg-zinc-950 text-zinc-200 font-mono-tech text-xs uppercase tracking-wider cursor-pointer"
            >
              ← Peace
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
              className={`py-3 border font-mono-tech text-xs font-bold uppercase tracking-wider transition ${
                isHabitComplete
                  ? 'border-zinc-100 bg-zinc-100 text-black cursor-pointer'
                  : 'border-zinc-900 bg-zinc-950 text-zinc-600 cursor-not-allowed'
              }`}
            >
              {isHabitComplete
                ? `✓ Open (${selectedMinutes}m) →`
                : readSecondsLeft > 0
                ? `Read ${readSecondsLeft}s...`
                : 'Tap Answer ↑'}
            </button>
          </div>
        </div>
      )}

      {/* Slim Footer */}
      <div className="border-t border-zinc-900 pt-2 flex items-center justify-between text-[10px] font-mono-tech text-zinc-600">
        <span>MINIMUM PHONE</span>
        <span>20S MICRO-LEARNING GATE</span>
      </div>
    </div>
  );
};

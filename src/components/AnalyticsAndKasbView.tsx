import React, { useEffect, useState } from 'react';
import type {
  AppFrictionTier,
  AppItem,
  FocusVaultState,
  HabitWallType,
  HomeProfileType,
  InspirationMode,
  LanguageCode,
  PlatformMode,
  PurityState,
  SlowLearningState,
  SlowLearningTrack,
  VisualTheme,
  WisdomPackSource,
} from '../types/app';
import {
  HOW_TO_USE_SECTIONS,
  HOW_TO_USE_SUBTITLE,
  HOW_TO_USE_TITLE,
} from '../data/howToUseGuide';
import { getLessonsForTrack } from '../data/slowLearningCurriculum';
import { SUPPORTED_LANGUAGES, TRANSLATIONS } from '../i18n/translations';
import { NativeBridge } from '../services/nativeBridge';
import {
  forceTriggerHomePicker,
  openPhoneMainSetting,
  requestDefaultHomeLauncher,
  toggleHardwareKioskPin,
  type PhoneSettingTarget,
} from '../services/nativeLauncherBridge';

interface AnalyticsAndKasbViewProps {
  lang: LanguageCode;
  onChangeLanguage: (lang: LanguageCode) => void;
  platform: PlatformMode;
  onChangePlatform: (p: PlatformMode) => void;
  inspirationMode: InspirationMode;
  onChangeInspirationMode: (mode: InspirationMode) => void;
  wisdomPack: WisdomPackSource;
  onChangeWisdomPack: (w: WisdomPackSource) => void;
  showArabicScript: boolean;
  onToggleArabicScript: () => void;
  grayscaleEnabled: boolean;
  onToggleGrayscale: () => void;
  visualTheme: VisualTheme;
  onChangeVisualTheme: (theme: VisualTheme) => void;
  defaultHabitWall: HabitWallType;
  onChangeDefaultHabitWall: (h: HabitWallType) => void;
  slowLearning: SlowLearningState;
  onUpdateSlowLearning: (updater: (prev: SlowLearningState) => SlowLearningState) => void;
  homeProfile: HomeProfileType;
  onChangeHomeProfile: (p: HomeProfileType) => void;
  apps: AppItem[];
  onTogglePinAppToProfile: (appId: string, profile: HomeProfileType) => void;
  onChangeAppTier: (appId: string, tier: AppFrictionTier) => void;
  onAddCustomApp: (name: string, tier: AppFrictionTier) => void;
  onRefreshInstalledApps: () => void;
  openHowToGuideImmediately?: boolean;
  onClearHowToGuideTrigger?: () => void;
  impulsesStopped: number;
  reclaimedMinutes: number;
  purity: PurityState;
  vault: FocusVaultState;
  onUpdateVault: (updater: (prev: FocusVaultState) => FocusVaultState) => void;
}

export const AnalyticsAndKasbView: React.FC<AnalyticsAndKasbViewProps> = ({
  lang,
  onChangeLanguage,
  platform,
  onChangePlatform,
  inspirationMode,
  onChangeInspirationMode,
  wisdomPack,
  onChangeWisdomPack,
  showArabicScript,
  onToggleArabicScript,
  grayscaleEnabled,
  onToggleGrayscale,
  visualTheme,
  onChangeVisualTheme,
  defaultHabitWall,
  onChangeDefaultHabitWall,
  slowLearning,
  onUpdateSlowLearning,
  homeProfile,
  onChangeHomeProfile,
  apps,
  onTogglePinAppToProfile,
  onChangeAppTier,
  onAddCustomApp,
  onRefreshInstalledApps,
  openHowToGuideImmediately,
  onClearHowToGuideTrigger,
  impulsesStopped,
  reclaimedMinutes,
  purity,
  vault,
  onUpdateVault,
}) => {
  const t = TRANSLATIONS[lang];

  const [friendCodeInput, setFriendCodeInput] = useState<string>('');
  const [showFriendHelper, setShowFriendHelper] = useState<boolean>(false);
  const [nativeStatusLog, setNativeStatusLog] = useState<string | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);
  const [showHowToGuideModal, setShowHowToGuideModal] = useState<boolean>(false);

  // Active Apps Manager local search & custom app creator
  const [appFilterQuery, setAppFilterQuery] = useState<string>('');
  const [newCustomAppName, setNewCustomAppName] = useState<string>('');
  const [newCustomAppTier, setNewCustomAppTier] = useState<AppFrictionTier>('restricted');

  // Slow Learning Practice Modal State
  const [practiceModalOpen, setPracticeModalOpen] = useState<boolean>(false);
  const [practiceSecondsLeft, setPracticeSecondsLeft] = useState<number>(
    slowLearning.readingDurationSeconds || 30
  );
  const [practiceSelectedOption, setPracticeSelectedOption] = useState<number | null>(null);
  const [practicePassed, setPracticePassed] = useState<boolean>(false);
  const [practiceErrorMsg, setPracticeErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (openHowToGuideImmediately) {
      setShowHowToGuideModal(true);
      onClearHowToGuideTrigger?.();
    }
  }, [openHowToGuideImmediately, onClearHowToGuideTrigger]);

  useEffect(() => {
    if (!practiceModalOpen) return;
    if (practiceSecondsLeft <= 0) return;
    const timer = setInterval(() => {
      setPracticeSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [practiceModalOpen, practiceSecondsLeft]);

  const expectedFriendCode = NativeBridge.computeFriendUnlockCode(
    vault.friendAccountabilitySecret
  );

  const totalScreenMinutes = apps.reduce((acc, a) => acc + a.dailyMinutesUsed, 0);
  const hoursReclaimed = (reclaimedMinutes / 60).toFixed(1);
  const purityDays = Math.floor(
    Math.max(0, Date.now() - new Date(purity.streakStartIso).getTime()) / 86400000
  );

  const trackLessons = getLessonsForTrack(slowLearning.track);
  const activePracticeLesson =
    trackLessons[slowLearning.currentLessonIndex % trackLessons.length];

  const handleOpenPhoneSetting = async (target: PhoneSettingTarget, label: string) => {
    await openPhoneMainSetting(target);
    setNativeStatusLog(`Opened Android ${label}`);
  };

  const handleActivateDefaultLauncher = async () => {
    const res = await NativeBridge.requestDefaultLauncher(platform);
    setNativeStatusLog(res.message);
    await requestDefaultHomeLauncher();
  };

  const handleUnlockStrictProtection = () => {
    if (friendCodeInput.trim() === expectedFriendCode) {
      onUpdateVault((prev) => ({
        ...prev,
        uninstallProtectionEnabled: false,
        uninstallCooldownStartedIso: null,
      }));
      setFriendCodeInput('');
    }
  };

  const handleCreateCustomApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomAppName.trim()) return;
    onAddCustomApp(newCustomAppName.trim(), newCustomAppTier);
    setNewCustomAppName('');
  };

  const handleOpenPracticeQuiz = () => {
    setPracticeSecondsLeft(slowLearning.readingDurationSeconds || 30);
    setPracticeSelectedOption(null);
    setPracticePassed(false);
    setPracticeErrorMsg(null);
    setPracticeModalOpen(true);
  };

  const handleSelectPracticeQuizAnswer = (idx: number) => {
    if (practiceSecondsLeft > 0) return;
    setPracticeSelectedOption(idx);
    if (idx === activePracticeLesson.correctOptionIndex) {
      if (!practicePassed) {
        setPracticePassed(true);
        setPracticeErrorMsg(null);
        onUpdateSlowLearning((prev) => ({
          ...prev,
          xp: prev.xp + 15,
          lessonsCompleted: prev.lessonsCompleted + 1,
          quizzesPassed: prev.quizzesPassed + 1,
        }));
      }
    } else {
      setPracticePassed(false);
      setPracticeErrorMsg(
        lang === 'bn'
          ? 'উত্তরটি সঠিক নয়। অনুচ্ছেদটি আরও ১০ সেকেন্ড মনোযোগ দিয়ে পড়ে আবার চেষ্টা করুন।'
          : 'Incorrect answer. Re-read the passage for 10 seconds and try again.'
      );
      setPracticeSecondsLeft(10);
    }
  };

  const filteredApps = apps.filter((a) => {
    if (!appFilterQuery.trim()) return true;
    const q = appFilterQuery.trim().toLowerCase();
    return (
      a.name.toLowerCase().includes(q) ||
      (a.nameBn && a.nameBn.toLowerCase().includes(q)) ||
      (a.packageName && a.packageName.toLowerCase().includes(q))
    );
  });

  const pinnedInCurrentProfileCount = apps.filter((a) =>
    a.pinnedProfiles.includes(homeProfile)
  ).length;

  return (
    <div className="space-y-6 pb-10">
      {/* TOP BAR: SETTINGS HEADER + HOW TO USE GUIDE (ALL LANGUAGES) BUTTON */}
      <div className="border border-zinc-700 bg-zinc-950 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <span className="text-[10px] font-mono-tech uppercase tracking-widest text-zinc-400">
            CORE LAUNCHER CONFIGURATION & DOCUMENTATION
          </span>
          <h2 className="text-base font-mono-tech font-semibold text-zinc-100 mt-0.5">
            {t.settingsMenuTitle}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setShowHowToGuideModal(true)}
          className="px-4 py-2.5 bg-zinc-100 text-black font-mono-tech text-xs font-semibold uppercase tracking-wider hover:bg-white cursor-pointer shrink-0"
        >
          {t.howToUseGuideBtn}
        </button>
      </div>

      {/* 1. PHONE MAIN SETTINGS BRIDGE (DIRECT ANDROID SYSTEM SETTINGS ACCESS) */}
      <div className="border border-zinc-800 bg-zinc-950/60 p-5 space-y-3.5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono-tech uppercase tracking-widest text-zinc-500">
              NATIVE OS HARDWARE BRIDGE // ANDROID SYSTEM SETTINGS
            </div>
            <h3 className="text-sm font-mono-tech font-semibold text-zinc-100 mt-0.5">
              {t.phoneMainSettingsTitle}
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">{t.phoneMainSettingsSubtitle}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(
            [
              { target: 'main', label: t.btnMainPhoneSettings },
              { target: 'wifi', label: t.btnWifiSettings },
              { target: 'bluetooth', label: t.btnBluetoothSettings },
              { target: 'display', label: t.btnDisplaySettings },
              { target: 'sound', label: t.btnSoundSettings },
              { target: 'apps', label: t.btnAppsSettings },
              { target: 'dns', label: t.btnDnsSettings },
              { target: 'home', label: t.btnHomeLauncherSettings },
            ] as const
          ).map((btn) => (
            <button
              key={btn.target}
              type="button"
              onClick={() => handleOpenPhoneSetting(btn.target, btn.label)}
              className="py-2.5 px-3 border border-zinc-800 bg-black hover:border-zinc-500 hover:bg-zinc-900 text-left text-xs font-mono-tech text-zinc-200 transition cursor-pointer"
            >
              {btn.label}
            </button>
          ))}
        </div>

        {nativeStatusLog && (
          <div className="p-2 border border-zinc-800 bg-black text-[11px] font-mono-tech text-zinc-300">
            ✓ {nativeStatusLog}
          </div>
        )}
      </div>

      {/* 2. LANGUAGE SWITCHER (FULL APP TRANSLATION: ENGLISH, BANGLA, ARABIC, URDU, INDONESIAN) */}
      <div className="border border-zinc-800 bg-zinc-950/60 p-5 space-y-3">
        <div className="text-[10px] font-mono-tech uppercase tracking-widest text-zinc-500">
          GLOBAL ACCESSIBILITY // 100% FULL APP TRANSLATION
        </div>
        <h3 className="text-sm font-mono-tech font-semibold text-zinc-100">
          {t.languageLabel}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {SUPPORTED_LANGUAGES.map((item) => (
            <button
              key={item.code}
              type="button"
              onClick={() => onChangeLanguage(item.code)}
              className={`py-2.5 px-3 border text-xs font-mono-tech transition cursor-pointer ${
                lang === item.code
                  ? 'border-zinc-100 bg-zinc-100 text-black font-semibold'
                  : 'border-zinc-800 text-zinc-400 hover:border-zinc-600'
              }`}
            >
              <div>{item.nativeName}</div>
              <div className="text-[10px] opacity-70">{item.englishName}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 3. MODE OF INSPIRATION (FULLY ISLAMIC vs. COMMON FOR ALL vs. BLENDED) */}
      <div className="border border-zinc-800 bg-zinc-950/60 p-5 space-y-4">
        <div className="text-[10px] font-mono-tech uppercase tracking-widest text-zinc-500">
          SPIRITUAL & PHILOSOPHICAL ALIGNMENT // CUSTOMIZE YOUR EXPERIENCE
        </div>
        <h3 className="text-sm font-mono-tech font-semibold text-zinc-100">
          {t.inspirationModeTitle}
        </h3>

        <div className="space-y-2">
          {(
            [
              {
                id: 'islamic',
                title: t.modeIslamicFull,
                desc:
                  lang === 'bn'
                    ? 'হোম স্ক্রিন, শ্বাস-বিরতি ও পবিত্রতা গার্ডে কেবল কুরআনের আয়াত, সহীহ হাদীস ও ইসলামিক শিক্ষা দেখাবে।'
                    : 'Exclusively Quranic verses, authentic Sahih Hadith, Arabic script, and Islamic Slow Learning.',
              },
              {
                id: 'universal',
                title: t.modeCommonUniversal,
                desc:
                  lang === 'bn'
                    ? 'সকল ধর্ম ও মানুষের জন্য উপযোগী সার্বজনীন প্রজ্ঞা, মনোযোগ বিজ্ঞান ও প্রবাদ প্রদর্শন করবে।'
                    : '100% Universal proverbs, Stoic philosophy, and neuroscience focus principles suitable for everyone.',
              },
              {
                id: 'blended',
                title: t.modeBlendedAll,
                desc:
                  lang === 'bn'
                    ? 'ইসলামিক সাকীনাহ বাণী এবং সার্বজনীন প্রজ্ঞা উভয়ই সমন্বিতভাবে প্রদর্শন করবে।'
                    : 'Combines both sacred Islamic Sakinah triggers and universal calm mind proverbs.',
              },
            ] as const
          ).map((modeOption) => (
            <button
              key={modeOption.id}
              type="button"
              onClick={() => onChangeInspirationMode(modeOption.id)}
              className={`w-full p-3.5 border text-left transition cursor-pointer ${
                inspirationMode === modeOption.id
                  ? 'border-zinc-100 bg-zinc-900 text-white'
                  : 'border-zinc-800 bg-black text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <div className="text-xs font-mono-tech font-semibold">
                {inspirationMode === modeOption.id ? '● ' : '○ '}
                {modeOption.title}
              </div>
              <div className="text-[11px] text-zinc-400 mt-1 pl-4">{modeOption.desc}</div>
            </button>
          ))}
        </div>

        {/* Fine-Grained Quote Source Filter */}
        <div className="pt-2 border-t border-zinc-900">
          <div className="text-xs font-mono-tech text-zinc-400 mb-2">{t.wisdomPackLabel}:</div>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                { id: 'quran', label: t.packQuran },
                { id: 'hadith', label: t.packHadith },
                { id: 'proverbs', label: t.packProverbs },
                { id: 'blended', label: t.packBlended },
              ] as const
            ).map((pack) => (
              <button
                key={pack.id}
                type="button"
                onClick={() => onChangeWisdomPack(pack.id)}
                className={`py-2.5 px-3 border text-left text-xs font-mono-tech cursor-pointer ${
                  wisdomPack === pack.id
                    ? 'border-zinc-100 bg-zinc-900 text-white font-semibold'
                    : 'border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                {wisdomPack === pack.id ? '● ' : '○ '}
                {pack.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-zinc-900">
          <div>
            <div className="text-xs text-zinc-200">
              Show Original Arabic Script Above Quran & Hadith
            </div>
            <div className="text-[11px] font-mono-tech text-zinc-500">
              Displays crisp Naskh Arabic line above localized translation
            </div>
          </div>
          <button
            type="button"
            onClick={onToggleArabicScript}
            className={`px-3 py-1.5 border text-xs font-mono-tech cursor-pointer ${
              showArabicScript
                ? 'border-zinc-100 bg-zinc-100 text-black font-semibold'
                : 'border-zinc-800 text-zinc-400'
            }`}
          >
            {showArabicScript ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* 4. SLOW LEARNING MODE (ISLAM / LANGUAGE / FOCUS) & 30-SEC READ + PLAY QUIZ GATE */}
      <div className="border border-zinc-700 bg-zinc-950/80 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
          <div>
            <span className="text-[10px] font-mono-tech uppercase tracking-widest text-zinc-400">
              TURN EVERY APP IMPULSE INTO KNOWLEDGE // 30S READ + QUIZ GATE
            </span>
            <h3 className="text-sm font-mono-tech font-semibold text-zinc-100 mt-0.5">
              {t.slowLearningTitle}
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">{t.slowLearningSubtitle}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              const nextVal = !slowLearning.require30sQuizToOpenApps;
              onUpdateSlowLearning((prev) => ({
                ...prev,
                require30sQuizToOpenApps: nextVal,
              }));
              if (nextVal) {
                onChangeDefaultHabitWall('read-30s-quiz');
              }
            }}
            className={`px-3 py-1.5 border text-xs font-mono-tech shrink-0 cursor-pointer ${
              slowLearning.require30sQuizToOpenApps
                ? 'border-zinc-100 bg-zinc-100 text-black font-semibold'
                : 'border-zinc-700 text-zinc-400'
            }`}
          >
            {slowLearning.require30sQuizToOpenApps ? '30S QUIZ: ON' : 'OFF'}
          </button>
        </div>

        {/* Slow Learning Stats Bar */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="border border-zinc-800 bg-black p-2.5">
            <div className="text-lg font-mono-tech text-zinc-100">{slowLearning.xp} XP</div>
            <div className="text-[10px] font-mono-tech text-zinc-500">LEARNING XP</div>
          </div>
          <div className="border border-zinc-800 bg-black p-2.5">
            <div className="text-lg font-mono-tech text-zinc-100">
              {slowLearning.lessonsCompleted}
            </div>
            <div className="text-[10px] font-mono-tech text-zinc-500">LESSONS READ</div>
          </div>
          <div className="border border-zinc-800 bg-black p-2.5">
            <div className="text-lg font-mono-tech text-zinc-100">
              {slowLearning.quizzesPassed}
            </div>
            <div className="text-[10px] font-mono-tech text-zinc-500">QUIZZES PASSED</div>
          </div>
        </div>

        {/* Choose Slow Learning Track */}
        <div className="space-y-2">
          <div className="text-xs font-mono-tech text-zinc-300">
            Select Slow Learning Curriculum Track:
          </div>
          {(
            [
              { id: 'islam', label: t.trackIslamicLabel },
              { id: 'language', label: t.trackLanguageLabel },
              { id: 'mindfulness', label: t.trackMindfulnessLabel },
            ] as const
          ).map((tr) => (
            <button
              key={tr.id}
              type="button"
              onClick={() =>
                onUpdateSlowLearning((prev) => ({
                  ...prev,
                  track: tr.id as SlowLearningTrack,
                  currentLessonIndex: 0,
                }))
              }
              className={`w-full text-left px-3.5 py-2.5 border text-xs font-mono-tech cursor-pointer ${
                slowLearning.track === tr.id
                  ? 'border-zinc-100 bg-zinc-900 text-white font-semibold'
                  : 'border-zinc-800 bg-black text-zinc-400 hover:border-zinc-700'
              }`}
            >
              {slowLearning.track === tr.id ? '● ' : '○ '}
              {tr.label}
            </button>
          ))}
        </div>

        {/* Choose Mandatory Reading Timer Duration */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-900">
          <span className="text-xs font-mono-tech text-zinc-400">
            Mandatory Reading Timer Before Quiz:
          </span>
          <div className="flex gap-1.5">
            {[15, 30, 45].map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() =>
                  onUpdateSlowLearning((prev) => ({
                    ...prev,
                    readingDurationSeconds: sec,
                  }))
                }
                className={`px-2.5 py-1 border text-xs font-mono-tech cursor-pointer ${
                  slowLearning.readingDurationSeconds === sec
                    ? 'border-zinc-100 bg-zinc-100 text-black font-semibold'
                    : 'border-zinc-800 text-zinc-400'
                }`}
              >
                {sec}s
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenPracticeQuiz}
          className="w-full py-3 bg-zinc-100 text-black font-mono-tech text-xs font-semibold uppercase tracking-wider hover:bg-white cursor-pointer"
        >
          🎓 Practice {slowLearning.readingDurationSeconds}s Read + Play Quiz Lesson Now
        </button>
      </div>

      {/* 5. ACTIVE APPS & HOME SCREEN MANAGER */}
      <div className="border border-zinc-800 bg-zinc-950/60 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-zinc-900 pb-3">
          <div>
            <span className="text-[10px] font-mono-tech uppercase tracking-widest text-zinc-500">
              CUSTOMIZE HOME SCREEN & APP RESTRICTIONS
            </span>
            <h3 className="text-sm font-mono-tech font-semibold text-zinc-100 mt-0.5">
              {t.activeAppsManagerTitle}
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">{t.activeAppsManagerSubtitle}</p>
          </div>
          <button
            type="button"
            onClick={onRefreshInstalledApps}
            className="px-3 py-1.5 border border-zinc-700 text-xs font-mono-tech text-zinc-200 hover:bg-zinc-900 cursor-pointer shrink-0"
          >
            ↻ Sync Phone Apps ({apps.length})
          </button>
        </div>

        {/* Select Home Profile to Pin Apps For */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono-tech text-zinc-400">
            Active Profile ({pinnedInCurrentProfileCount}/7 Pinned):
          </span>
          <div className="flex gap-1.5">
            {(
              [
                { id: 'work', label: t.profileWork },
                { id: 'personal', label: t.profilePersonal },
                { id: 'sunset', label: t.profileSunset },
              ] as const
            ).map((prof) => (
              <button
                key={prof.id}
                type="button"
                onClick={() => onChangeHomeProfile(prof.id)}
                className={`px-3 py-1 border text-xs font-mono-tech cursor-pointer ${
                  homeProfile === prof.id
                    ? 'border-zinc-100 bg-zinc-100 text-black font-semibold'
                    : 'border-zinc-800 text-zinc-400'
                }`}
              >
                {prof.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Apps Input */}
        <input
          type="text"
          value={appFilterQuery}
          onChange={(e) => setAppFilterQuery(e.target.value)}
          placeholder="Filter apps by name to Pin or Lock..."
          className="w-full bg-black border border-zinc-800 px-3 py-2 text-xs font-mono-tech text-zinc-100 focus:outline-none focus:border-zinc-500"
        />

        {/* Scrollable Active Apps List */}
        <div className="max-h-72 overflow-y-auto divide-y divide-zinc-900 border border-zinc-900 bg-black">
          {filteredApps.map((app) => {
            const isPinned = app.pinnedProfiles.includes(homeProfile);
            return (
              <div
                key={app.id}
                className="p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
              >
                <div>
                  <div className="text-xs font-medium text-zinc-100">
                    {lang === 'bn' && app.nameBn ? `${app.nameBn} (${app.name})` : app.name}
                  </div>
                  <div className="text-[10px] font-mono-tech text-zinc-500">
                    {app.category.toUpperCase()} · {app.dailyOpens} opens today
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {/* Pin to Home Toggle */}
                  <button
                    type="button"
                    onClick={() => onTogglePinAppToProfile(app.id, homeProfile)}
                    className={`px-2.5 py-1 border text-[10px] font-mono-tech cursor-pointer ${
                      isPinned
                        ? 'border-zinc-100 bg-zinc-100 text-black font-semibold'
                        : 'border-zinc-800 text-zinc-400 hover:border-zinc-600'
                    }`}
                  >
                    {isPinned ? '★ Pinned Home' : '+ Pin Home'}
                  </button>

                  {/* Tier Selector: Instant vs 30s Quiz Gate vs Blocked */}
                  {(
                    [
                      { id: 'utility', label: 'Instant' },
                      { id: 'restricted', label: '30s Quiz Gate' },
                      { id: 'adult-blocked', label: 'Blocked' },
                    ] as const
                  ).map((tierBtn) => {
                    const active =
                      app.tier === tierBtn.id ||
                      (tierBtn.id === 'utility' && app.tier === 'essential');
                    return (
                      <button
                        key={tierBtn.id}
                        type="button"
                        onClick={() => onChangeAppTier(app.id, tierBtn.id)}
                        className={`px-2 py-1 border text-[10px] font-mono-tech cursor-pointer ${
                          active
                            ? 'border-zinc-300 bg-zinc-800 text-white font-semibold'
                            : 'border-zinc-900 text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        {tierBtn.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Custom App Form */}
        <form onSubmit={handleCreateCustomApp} className="flex flex-wrap gap-2 pt-1">
          <input
            type="text"
            value={newCustomAppName}
            onChange={(e) => setNewCustomAppName(e.target.value)}
            placeholder="Add custom app name..."
            className="flex-1 min-w-[160px] bg-black border border-zinc-800 px-3 py-2 text-xs font-mono-tech text-zinc-200"
          />
          <select
            value={newCustomAppTier}
            onChange={(e) => setNewCustomAppTier(e.target.value as AppFrictionTier)}
            className="bg-black border border-zinc-800 px-2.5 py-2 text-xs font-mono-tech text-zinc-300"
          >
            <option value="utility">Instant Tool</option>
            <option value="restricted">30s Quiz Gate (Restricted)</option>
            <option value="adult-blocked">Completely Blocked</option>
          </select>
          <button
            type="submit"
            className="px-3 py-2 border border-zinc-600 bg-zinc-900 text-xs font-mono-tech text-zinc-100 hover:bg-zinc-800 cursor-pointer"
          >
            + Add App
          </button>
        </form>
      </div>

      {/* 6. DISPLAY, SYSTEM GRAYSCALE & DEFAULT HABIT-WALL */}
      <div className="border border-zinc-800 bg-zinc-950/60 p-5 space-y-4">
        <div className="text-[10px] font-mono-tech uppercase tracking-widest text-zinc-500">
          ANTI-DOPAMINE VISUAL ENGINE
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-zinc-200">{t.grayscaleToggleLabel}</div>
            <div className="text-[11px] font-mono-tech text-zinc-500">
              {platform === 'android'
                ? 'Uses Android ZenDeviceEffects.setShouldDisplayGrayscale(true)'
                : 'Uses iOS Accessibility Grayscale Filter + Focus Automation'}
            </div>
          </div>
          <button
            type="button"
            onClick={onToggleGrayscale}
            className={`px-3 py-1.5 border text-xs font-mono-tech cursor-pointer ${
              grayscaleEnabled
                ? 'border-zinc-100 bg-zinc-100 text-black font-semibold'
                : 'border-zinc-800 text-zinc-400'
            }`}
          >
            {grayscaleEnabled ? 'GRAYSCALE ON' : 'OFF'}
          </button>
        </div>

        <div>
          <div className="text-xs font-mono-tech text-zinc-400 mb-2">
            Universal Platform & Device Engine (Android · iOS · Web / Any Device):
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { id: 'android', label: '🤖 Android Native' },
                { id: 'ios', label: '🍎 iOS / iPad Native' },
                { id: 'web', label: '🌐 Web / Any Device' },
              ] as const
            ).map((pl) => (
              <button
                key={pl.id}
                type="button"
                onClick={() => onChangePlatform(pl.id)}
                className={`py-2 px-2 border text-xs font-mono-tech cursor-pointer ${
                  platform === pl.id
                    ? 'border-zinc-100 bg-zinc-100 text-black font-semibold'
                    : 'border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {pl.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-xs font-mono-tech text-zinc-400 mb-2">
            Monochrome Surface Palette:
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { id: 'oled-black', label: 'OLED Pure Black' },
                { id: 'eink-paper', label: 'E-Ink Paper' },
                { id: 'sunset-amber', label: 'Sunset Amber' },
              ] as const
            ).map((th) => (
              <button
                key={th.id}
                type="button"
                onClick={() => onChangeVisualTheme(th.id)}
                className={`py-2 px-2 border text-xs font-mono-tech cursor-pointer ${
                  visualTheme === th.id
                    ? 'border-zinc-100 bg-zinc-100 text-black font-semibold'
                    : 'border-zinc-800 text-zinc-400'
                }`}
              >
                {th.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-xs font-mono-tech text-zinc-400 mb-2">
            Default App Unlock Gatekeeper Mode:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(
              [
                { id: 'read-30s-quiz', label: '⭐ Read 30s Text + Play Quiz (Recommended)' },
                { id: 'calm-transcribe', label: 'Transcribe Verse / Proverb' },
                { id: 'journal-50', label: 'Mindful Journal Entry' },
                { id: 'read-pages', label: 'Read 3 Pages (PDF/Reader)' },
                { id: 'steps-20', label: 'Walk 20 Hardware Steps' },
              ] as const
            ).map((hw) => (
              <button
                key={hw.id}
                type="button"
                onClick={() => onChangeDefaultHabitWall(hw.id)}
                className={`py-2.5 px-3 border text-left text-xs font-mono-tech cursor-pointer ${
                  defaultHabitWall === hw.id
                    ? 'border-zinc-100 bg-zinc-900 text-white font-semibold'
                    : 'border-zinc-800 text-zinc-400'
                }`}
              >
                {defaultHabitWall === hw.id ? '● ' : '○ '}
                {hw.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 7. UNINSTALL PROTECTION & 24-HOUR COOLING-OFF LOCK */}
      <div className="border border-zinc-800 bg-zinc-950/60 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-900 pb-2.5">
          <div>
            <span className="text-[10px] font-mono-tech uppercase tracking-widest text-zinc-500">
              CRAVING-PROOF LOCK // ACCOUNTABILITY GUARD
            </span>
            <h3 className="text-sm font-mono-tech font-semibold text-zinc-100">
              Uninstall & Strict Mode Protection
            </h3>
          </div>
          <span
            className={`px-2 py-0.5 text-[10px] font-mono-tech ${
              vault.uninstallProtectionEnabled
                ? 'bg-zinc-100 text-black font-semibold'
                : 'border border-zinc-800 text-zinc-500'
            }`}
          >
            {vault.uninstallProtectionEnabled ? 'LOCKED' : 'OFF'}
          </span>
        </div>

        <p className="text-xs text-zinc-400">
          Prevents deleting Minimum Phone or turning off strict blocks during a moment of weakness.
          Deactivating requires a <strong>24-hour cooling-off timer</strong> or an{' '}
          <strong>Offline Accountability Friend Passcode</strong>.
        </p>

        {!vault.uninstallProtectionEnabled ? (
          <button
            type="button"
            onClick={() =>
              onUpdateVault((prev) => ({
                ...prev,
                uninstallProtectionEnabled: true,
                uninstallCooldownStartedIso: null,
              }))
            }
            className="w-full py-3 bg-zinc-100 text-black font-mono-tech text-xs font-semibold uppercase tracking-wider cursor-pointer"
          >
            🛡️ Enable Craving-Proof Uninstall Protection
          </button>
        ) : (
          <div className="border border-zinc-700 bg-black p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono-tech text-zinc-200">
              <span>🛡️ STRICT UNINSTALL GUARD ACTIVE</span>
              <button
                type="button"
                onClick={() => setShowFriendHelper((v) => !v)}
                className="underline text-zinc-400 hover:text-white cursor-pointer"
              >
                {showFriendHelper ? 'Hide Friend Code' : 'Friend Code Generator'}
              </button>
            </div>

            {showFriendHelper && (
              <div className="p-3 border border-zinc-800 bg-zinc-950 text-xs font-mono-tech text-zinc-300 space-y-1">
                <div>
                  Accountability Shared Key: <strong>{vault.friendAccountabilitySecret}</strong>
                </div>
                <div>
                  Today’s Offline Friend Unlock Code: <strong>{expectedFriendCode}</strong>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={friendCodeInput}
                onChange={(e) => setFriendCodeInput(e.target.value)}
                placeholder="Enter 6-digit Friend Passcode..."
                className="flex-1 bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs font-mono-tech text-zinc-100"
              />
              <button
                type="button"
                onClick={handleUnlockStrictProtection}
                className="px-3 py-2 bg-zinc-100 text-black text-xs font-mono-tech font-semibold cursor-pointer"
              >
                Unlock
              </button>
            </div>

            {!vault.uninstallCooldownStartedIso ? (
              <button
                type="button"
                onClick={() =>
                  onUpdateVault((prev) => ({
                    ...prev,
                    uninstallCooldownStartedIso: new Date().toISOString(),
                  }))
                }
              className="w-full py-2 border border-zinc-800 text-xs font-mono-tech text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                ⏳ Or Start 24-Hour Cooling-Off Countdown
              </button>
            ) : (
              <div className="text-center py-2 border border-zinc-900 text-xs font-mono-tech text-zinc-400">
                ⏳ 24-Hour Cooling-Off Timer Running (23h 59m remaining)
              </div>
            )}
          </div>
        )}
      </div>

      {/* 8. LOCAL USAGE STATS & VIRAL "RECLAIMED LIFE RECEIPT" */}
      <div className="border border-zinc-800 bg-zinc-950/60 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-900 pb-2.5">
          <div>
            <span className="text-[10px] font-mono-tech uppercase tracking-widest text-zinc-500">
              100% ON-DEVICE ANALYTICS // ZERO CLOUD TRACKING
            </span>
            <h3 className="text-sm font-mono-tech font-semibold text-zinc-100">
              Screen Time & Reclaimed Life Receipt
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setShowReceiptModal(true)}
            className="px-3 py-1.5 bg-zinc-100 text-black text-xs font-mono-tech font-semibold cursor-pointer"
          >
            🧾 View Shareable Receipt
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="border border-zinc-900 bg-black p-3">
            <div className="text-xl font-mono-tech text-zinc-100">{impulsesStopped}</div>
            <div className="text-[10px] font-mono-tech text-zinc-500 mt-1">
              IMPULSES STOPPED
            </div>
          </div>
          <div className="border border-zinc-900 bg-black p-3">
            <div className="text-xl font-mono-tech text-zinc-100">{hoursReclaimed}h</div>
            <div className="text-[10px] font-mono-tech text-zinc-500 mt-1">
              HOURS RECLAIMED
            </div>
          </div>
          <div className="border border-zinc-900 bg-black p-3">
            <div className="text-xl font-mono-tech text-zinc-100">{totalScreenMinutes}m</div>
            <div className="text-[10px] font-mono-tech text-zinc-500 mt-1">
              TODAY SCREEN TIME
            </div>
          </div>
        </div>
      </div>

      {/* 9. PLAY STORE (ANDROID) & APP STORE (iOS) NATIVE BRIDGE INSPECTOR */}
      <div className="border border-zinc-800 bg-zinc-950/60 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono-tech uppercase tracking-widest text-zinc-500">
              DUAL-STORE PRODUCTION TARGETS
            </span>
            <h3 className="text-sm font-mono-tech font-semibold text-zinc-100">
              Google Play Store (Android) & Apple App Store (iOS)
            </h3>
          </div>
          <div className="flex gap-1">
            {(['android', 'ios'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => onChangePlatform(p)}
                className={`px-2.5 py-1 border text-xs font-mono-tech uppercase cursor-pointer ${
                  platform === p
                    ? 'border-zinc-100 bg-zinc-100 text-black font-semibold'
                    : 'border-zinc-800 text-zinc-500'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={handleActivateDefaultLauncher}
          className="w-full py-2.5 border border-zinc-700 text-xs font-mono-tech text-zinc-200 hover:bg-zinc-900 cursor-pointer"
        >
          ⚡ Sync {platform === 'android' ? 'Android Default Home Role' : 'iOS ScreenTime Shield'}
        </button>
      </div>

      {/* 10. KASB LLC ECOSYSTEM */}
      <div className="border border-zinc-700 bg-black p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
          <div>
            <span className="text-[10px] font-mono-tech uppercase tracking-widest text-zinc-500">
              100% FREE CONSUMER MOVEMENT // ZERO ADS
            </span>
            <h3 className="text-base font-mono-tech font-semibold text-zinc-100">
              Brought to you by kasb LLC
            </h3>
          </div>
          <span className="px-2 py-0.5 border border-zinc-600 text-[10px] font-mono-tech text-zinc-300">
            KASB ECOSYSTEM
          </span>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed">
          We made 100% of Minimum Phone’s premium digital detox, Calm Mind (Quran/Hadith/Proverbs),
          Slow Learning 30s Quiz Gate, and Purity features completely free with zero ads and zero
          cloud telemetry to help millions reclaim their attention and inner peace.
        </p>
      </div>

      {/* =====================================================================
          MODAL 1: COMPLETE "HOW TO USE" DOCUMENTATION IN ALL 5 LANGUAGES
         ===================================================================== */}
      {showHowToGuideModal && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="max-w-lg w-full border border-zinc-700 bg-zinc-950 p-5 sm:p-6 space-y-5 my-auto max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-zinc-800 pb-3">
              <div>
                <span className="text-[10px] font-mono-tech uppercase tracking-widest text-zinc-400">
                  OFFICIAL DOCUMENTATION // MULTILINGUAL MANUAL
                </span>
                <h3 className="text-base font-mono-tech font-semibold text-zinc-100 mt-1">
                  {HOW_TO_USE_TITLE[lang]}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHowToGuideModal(false)}
                className="px-2.5 py-1 border border-zinc-800 text-xs font-mono-tech text-zinc-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Instant Language Switcher inside the Guide */}
            <div className="flex flex-wrap gap-1.5 border-b border-zinc-900 pb-3">
              {SUPPORTED_LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => onChangeLanguage(l.code)}
                  className={`px-2.5 py-1 border text-xs font-mono-tech cursor-pointer ${
                    lang === l.code
                      ? 'border-zinc-100 bg-zinc-100 text-black font-semibold'
                      : 'border-zinc-800 text-zinc-400'
                  }`}
                >
                  {l.nativeName}
                </button>
              ))}
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              {HOW_TO_USE_SUBTITLE[lang]}
            </p>

            <div className="space-y-4">
              {HOW_TO_USE_SECTIONS.map((sec) => (
                <div
                  key={sec.id}
                  className="border border-zinc-800 bg-black p-4 space-y-2.5"
                >
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-zinc-100 text-black text-[10px] font-mono-tech font-bold">
                      STEP {sec.stepNumber}
                    </span>
                    <h4 className="text-xs sm:text-sm font-mono-tech font-semibold text-zinc-100">
                      {sec.title[lang]}
                    </h4>
                  </div>

                  <p className="text-xs text-zinc-400">{sec.summary[lang]}</p>

                  <ul className="space-y-1.5 text-xs text-zinc-300 pl-4 list-disc">
                    {sec.bullets[lang].map((b, i) => (
                      <li key={i} className="leading-relaxed">
                        {b}
                      </li>
                    ))}
                  </ul>

                  {sec.actionType && sec.actionLabel && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={async () => {
                          if (sec.actionType === 'set-default-home') {
                            await requestDefaultHomeLauncher();
                          } else if (sec.actionType === 'clear-old-home') {
                            await forceTriggerHomePicker();
                          } else if (sec.actionType === 'pin-kiosk') {
                            await toggleHardwareKioskPin(true);
                          } else if (sec.actionType === 'open-phone-settings') {
                            await openPhoneMainSetting('main');
                          } else if (sec.actionType === 'open-dns-settings') {
                            await openPhoneMainSetting('dns');
                          } else if (sec.actionType === 'practice-30s-quiz') {
                            setShowHowToGuideModal(false);
                            handleOpenPracticeQuiz();
                          }
                        }}
                        className="px-3.5 py-2 border border-zinc-500 bg-zinc-900 text-zinc-100 text-xs font-mono-tech hover:bg-zinc-800 cursor-pointer"
                      >
                        ⚡ {sec.actionLabel[lang]} →
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowHowToGuideModal(false)}
              className="w-full py-3.5 bg-zinc-100 text-black font-mono-tech text-xs font-semibold uppercase tracking-widest cursor-pointer"
            >
              ✓ Close Guide
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 2: INTERACTIVE 30-SEC SLOW LEARNING & QUIZ PRACTICE MODAL
         ===================================================================== */}
      {practiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="max-w-md w-full border border-zinc-700 bg-zinc-950 p-5 space-y-4 my-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
              <span className="text-[10px] font-mono-tech uppercase tracking-widest text-zinc-400">
                SLOW LEARNING HUB // {slowLearning.readingDurationSeconds}S READ + QUIZ
              </span>
              <button
                type="button"
                onClick={() => setPracticeModalOpen(false)}
                className="text-xs font-mono-tech text-zinc-400 hover:text-white cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div>
              <h4 className="text-sm font-mono-tech font-semibold text-zinc-100">
                {activePracticeLesson.title[lang]}
              </h4>
              {activePracticeLesson.arabicHeader && (
                <p
                  dir="rtl"
                  className="font-arabic text-base text-zinc-200 mt-2 bg-black border border-zinc-900 px-3 py-2 leading-relaxed"
                >
                  {activePracticeLesson.arabicHeader}
                </p>
              )}
            </div>

            <div className="bg-black border border-zinc-800 p-3.5 text-xs sm:text-sm text-zinc-200 leading-relaxed space-y-2">
              <p>{activePracticeLesson.readingText[lang]}</p>
              <div className="pt-2 border-t border-zinc-900 text-xs font-mono-tech text-zinc-300">
                ★ {activePracticeLesson.keyTakeaway[lang]}
              </div>
            </div>

            {/* Timer status */}
            <div className="flex items-center justify-between text-xs font-mono-tech">
              <span className="text-zinc-300">
                {practiceSecondsLeft > 0
                  ? `${t.read30sCountdownText} ${practiceSecondsLeft}s...`
                  : t.quizReadyText}
              </span>
              <button
                type="button"
                onClick={() => {
                  onUpdateSlowLearning((prev) => ({
                    ...prev,
                    currentLessonIndex: prev.currentLessonIndex + 1,
                  }));
                  setPracticeSecondsLeft(slowLearning.readingDurationSeconds || 30);
                  setPracticeSelectedOption(null);
                  setPracticePassed(false);
                  setPracticeErrorMsg(null);
                }}
                className="underline text-zinc-400 hover:text-white cursor-pointer"
              >
                Next Lesson →
              </button>
            </div>

            {/* Quiz */}
            <div
              className={`border p-3.5 space-y-2 ${
                practiceSecondsLeft > 0
                  ? 'border-zinc-900 bg-black/40 opacity-60'
                  : 'border-zinc-700 bg-black'
              }`}
            >
              <p className="text-xs font-medium text-zinc-100">
                Q: {activePracticeLesson.quizQuestion[lang]}
              </p>
              <div className="space-y-1.5">
                {activePracticeLesson.quizOptions[lang].map((opt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={practiceSecondsLeft > 0}
                    onClick={() => handleSelectPracticeQuizAnswer(idx)}
                    className={`w-full text-left p-2.5 border text-xs font-mono-tech ${
                      practiceSecondsLeft > 0
                        ? 'border-zinc-900 text-zinc-600 cursor-not-allowed'
                        : practiceSelectedOption === idx &&
                          idx === activePracticeLesson.correctOptionIndex
                        ? 'border-zinc-100 bg-zinc-100 text-black font-semibold cursor-pointer'
                        : 'border-zinc-800 text-zinc-300 hover:border-zinc-600 cursor-pointer'
                    }`}
                  >
                    {String.fromCharCode(65 + idx)}. {opt}
                  </button>
                ))}
              </div>
              {practiceErrorMsg && (
                <div className="text-[11px] font-mono-tech text-zinc-300 pt-1">
                  ⚠️ {practiceErrorMsg}
                </div>
              )}
              {practicePassed && (
                <div className="text-[11px] font-mono-tech text-zinc-100 pt-1">
                  ✓ +15 XP! {activePracticeLesson.explanation[lang]}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SHAREABLE MONOCHROME THERMAL RECEIPT MODAL */}
      {showReceiptModal && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-6">
          <div className="max-w-xs w-full bg-zinc-100 text-black p-6 font-mono-tech space-y-4 shadow-2xl">
            <div className="text-center border-b-2 border-dashed border-black pb-3">
              <div className="text-sm font-bold tracking-widest">MINIMUM PHONE</div>
              <div className="text-[10px]">RECLAIMED LIFE RECEIPT // KASB LLC</div>
              <div className="text-[10px] text-zinc-600 mt-0.5">
                {new Date().toLocaleDateString()}
              </div>
            </div>

            <div className="space-y-2 text-xs border-b-2 border-dashed border-black pb-3">
              <div className="flex justify-between">
                <span>IMPULSE OPENS STOPPED:</span>
                <strong>{impulsesStopped}</strong>
              </div>
              <div className="flex justify-between">
                <span>DEEP FOCUS RECLAIMED:</span>
                <strong>{hoursReclaimed} HRS</strong>
              </div>
              <div className="flex justify-between">
                <span>CLARITY / PURITY STREAK:</span>
                <strong>{purityDays} DAYS</strong>
              </div>
              <div className="flex justify-between">
                <span>SLOW LEARNING XP:</span>
                <strong>{slowLearning.xp} XP</strong>
              </div>
              <div className="flex justify-between">
                <span>ADS / TRACKERS SERVED:</span>
                <strong>0</strong>
              </div>
            </div>

            <div className="text-center text-[11px] italic py-1">
              “A quiet mind is richer than a crown.”
            </div>

            <div className="text-center text-[10px] border-t border-black pt-2">
              100% FREE · MINIMUMPHONE BY KASB LLC
            </div>

            <button
              type="button"
              onClick={() => setShowReceiptModal(false)}
              className="w-full py-2.5 bg-black text-white text-xs uppercase tracking-widest cursor-pointer"
            >
              Close Receipt
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

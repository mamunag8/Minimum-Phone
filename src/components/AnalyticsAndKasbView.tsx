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
  QrComplexityLevel,
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
import {
  getLessonsForTrack,
  getShortLessonPassage,
} from '../data/slowLearningCurriculum';
import {
  getAppDisplayName,
  SUPPORTED_LANGUAGES,
  TRANSLATIONS,
  tx,
} from '../i18n/translations';
import { NativeBridge } from '../services/nativeBridge';
import {
  enforceBackgroundSafeApps,
  forceTriggerHomePicker,
  openPhoneMainSetting,
  requestDefaultHomeLauncher,
  toggleHardwareKioskPin,
  type PhoneSettingTarget,
} from '../services/nativeLauncherBridge';
import { ImpactReportAndReferralHub } from './ImpactReportAndReferralHub';

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
  onSaveAppsBatch?: (updatedApps: AppItem[]) => void;
  onAddCustomApp: (name: string, tier: AppFrictionTier) => void;
  onRefreshInstalledApps: () => void;
  openHowToGuideImmediately?: boolean;
  onClearHowToGuideTrigger?: () => void;
  onOpenFirstTimeSetup?: () => void;
  onLockSettingsNow?: () => void;
  onTriggerEscalationDemo?: (stage: '5m' | '10m' | '20m', appName: string) => void;
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
  onSaveAppsBatch,
  onAddCustomApp,
  onRefreshInstalledApps,
  openHowToGuideImmediately,
  onClearHowToGuideTrigger,
  onOpenFirstTimeSetup,
  onLockSettingsNow,
  onTriggerEscalationDemo,
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
  const [settingsSubTab, setSettingsSubTab] = useState<'both' | 'report' | 'settings'>('both');

  // Active Apps Manager local search, staged draft & explicit Save button state
  const [appFilterQuery, setAppFilterQuery] = useState<string>('');
  const [appQuickFilter, setAppQuickFilter] = useState<
    'all' | 'home' | 'normal' | 'quiz' | 'night-qr'
  >('all');
  const [newCustomAppName, setNewCustomAppName] = useState<string>('');
  const [newCustomAppTier, setNewCustomAppTier] = useState<AppFrictionTier>('restricted');
  const [draftApps, setDraftApps] = useState<AppItem[]>(apps);
  const [hasUnsavedAppChanges, setHasUnsavedAppChanges] = useState<boolean>(false);
  const [savedAppsFeedback, setSavedAppsFeedback] = useState<string | null>(null);

  // Background Safe App List & Auto-Clean Engine State
  const defaultSafeIds = ['phone', 'messages', 'whatsapp', 'calendar', 'notes', 'maps', 'authenticator'];
  const [draftSafeAppIds, setDraftSafeAppIds] = useState<string[]>(
    vault.backgroundSafeAppIds || defaultSafeIds
  );
  const [safeListSavedFeedback, setSafeListSavedFeedback] = useState<string | null>(null);
  const [backgroundCleanFeedback, setBackgroundCleanFeedback] = useState<string | null>(null);

  useEffect(() => {
    setDraftApps(apps);
  }, [apps]);

  // Slow Learning Practice Modal State (Compact 12s Read -> Answer within 20s)
  const [practiceModalOpen, setPracticeModalOpen] = useState<boolean>(false);
  const [practiceSecondsLeft, setPracticeSecondsLeft] = useState<number>(
    Math.min(15, slowLearning.readingDurationSeconds || 12)
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
    setNativeStatusLog(
      tx(
        lang,
        `Opened ${label}`,
        `${label} খোলা হয়েছে`,
        `تم فتح ${label}`,
        `${label} کھول دیا گیا`,
        `Membuka ${label}`
      )
    );
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
    setPracticeSecondsLeft(Math.min(15, slowLearning.readingDurationSeconds || 12));
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
          masteredLessonIds: Array.from(
            new Set([...(prev.masteredLessonIds || []), activePracticeLesson.id])
          ),
        }));
      }
    } else {
      setPracticePassed(false);
      setPracticeErrorMsg(
        tx(
          lang,
          'Not quite right. Re-read for 4 seconds and tap the correct answer.',
          'সঠিক নয়। ৪ সেকেন্ড পড়ে আবার সঠিক উত্তরটি ট্যাপ করুন।',
          'إجابة غير صحيحة. اقرأ لمدة ٤ ثوانٍ ثم اختر الإجابة الصحيحة.',
          'درست نہیں۔ ٤ سیکنڈ دوبارہ پڑھیں اور صحیح جواب منتخب کریں۔',
          'Belum tepat. Baca ulang 4 detik lalu pilih jawaban yang benar.'
        )
      );
      setPracticeSecondsLeft(4);
    }
  };

  const isNightLockedByDefault = (a: AppItem) =>
    a.nightQrLocked ??
    (a.category === 'browser' ||
      a.category === 'social' ||
      a.category === 'entertainment' ||
      a.id === 'browser' ||
      a.id === 'instagram' ||
      a.id === 'facebook' ||
      a.id === 'youtube' ||
      a.id === 'tiktok' ||
      a.id === 'x-twitter' ||
      a.id === 'reddit');

  const filteredApps = draftApps.filter((a) => {
    if (appQuickFilter === 'home' && !a.pinnedProfiles.includes(homeProfile)) return false;
    if (
      appQuickFilter === 'normal' &&
      a.tier !== 'essential' &&
      a.tier !== 'utility'
    ) {
      return false;
    }
    if (appQuickFilter === 'quiz' && a.tier !== 'restricted') return false;
    if (appQuickFilter === 'night-qr' && !isNightLockedByDefault(a)) return false;

    if (!appFilterQuery.trim()) return true;
    const q = appFilterQuery.trim().toLowerCase();
    return (
      a.name.toLowerCase().includes(q) ||
      getAppDisplayName(a, lang).toLowerCase().includes(q) ||
      (a.nameBn && a.nameBn.toLowerCase().includes(q)) ||
      (a.packageName && a.packageName.toLowerCase().includes(q))
    );
  });

  const pinnedInCurrentProfileCount = draftApps.filter((a) =>
    a.pinnedProfiles.includes(homeProfile)
  ).length;

  const handleStageTogglePinApp = (appId: string, profile: HomeProfileType) => {
    setDraftApps((prev) =>
      prev.map((a) => {
        if (a.id !== appId) return a;
        const has = a.pinnedProfiles.includes(profile);
        const nextProfiles = has
          ? a.pinnedProfiles.filter((p) => p !== profile)
          : [...a.pinnedProfiles, profile];
        return { ...a, pinnedProfiles: nextProfiles };
      })
    );
    setHasUnsavedAppChanges(true);
    setSavedAppsFeedback(null);
  };

  const handleStageChangeAppTier = (appId: string, tier: AppFrictionTier) => {
    setDraftApps((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, tier } : a))
    );
    setHasUnsavedAppChanges(true);
    setSavedAppsFeedback(null);
  };

  const handleStageToggleNightQr = (appId: string) => {
    setDraftApps((prev) =>
      prev.map((a) => {
        if (a.id !== appId) return a;
        const currentNightLock = isNightLockedByDefault(a);
        return { ...a, nightQrLocked: !currentNightLock };
      })
    );
    setHasUnsavedAppChanges(true);
    setSavedAppsFeedback(null);
  };

  const handleMakeCallsSmsWhatsAppNormal = () => {
    const updated = draftApps.map((a) => {
      const lower = a.name.toLowerCase();
      if (
        a.id === 'phone' ||
        a.id === 'messages' ||
        a.id === 'whatsapp' ||
        lower.includes('whatsapp') ||
        lower.includes('phone') ||
        lower.includes('message')
      ) {
        return {
          ...a,
          tier: 'essential' as AppFrictionTier,
          nightQrLocked: false,
          pinnedProfiles: ['work', 'personal', 'sunset'] as HomeProfileType[],
        };
      }
      return a;
    });
    setDraftApps(updated);
    onSaveAppsBatch?.(updated);
    setHasUnsavedAppChanges(false);
    setSavedAppsFeedback(
      tx(
        lang,
        '✓ Phone Calls, Messages (SMS), and WhatsApp are now set as Normal Calling/Messaging Apps & Pinned on Home!',
        '✓ ফোন কল, মেসেজ (SMS) এবং WhatsApp এখন সাধারণ (Normal) কলিং অ্যাপ হিসেবে সেট হয়েছে এবং হোম স্ক্রিনে পিন করা হয়েছে!',
        '✓ تم ضبط الهاتف والرسائل وواتساب كتطبيقات اتصال عادية وتثبيتها على الشاشة الرئيسية!',
        '✓ فون کالز، میسجز اور واٹس ایپ کو نارمل کالنگ ایپس کے طور پر سیٹ کر کے ہوم پر پن کر دیا گیا ہے!',
        '✓ Telepon, SMS & WhatsApp kini diatur sebagai Aplikasi Normal & Disematkan di Layar Utama!'
      )
    );
  };

  const handleLockAllSocialAndBrowsersAtNight = () => {
    const updated = draftApps.map((a) => {
      if (
        a.category === 'browser' ||
        a.category === 'social' ||
        a.category === 'entertainment'
      ) {
        return {
          ...a,
          tier: 'restricted' as AppFrictionTier,
          nightQrLocked: true,
        };
      }
      return a;
    });
    setDraftApps(updated);
    onSaveAppsBatch?.(updated);
    setHasUnsavedAppChanges(false);
    setSavedAppsFeedback(
      tx(
        lang,
        '🌙 All Browsers & Social Media apps now require Mandatory Emergency QR Scan at night (10 PM – 6 AM)!',
        '🌙 সকল ব্রাউজার ও সোশ্যাল মিডিয়া অ্যাপে এখন রাতে (রাত ১০টা – ভোর ৬টা) জরুরি QR কোড স্ক্যান বাধ্যতামূলক করা হয়েছে!',
        '🌙 جميع المتصفحات وتطبيقات التواصل تتطلب الآن مسح رمز QR للطوارئ ليلاً!',
        '🌙 تمام براؤزرز اور سوشل میڈیا ایپس کے لیے اب رات کے وقت ایمرجنسی QR اسکین لازمی ہے!',
        '🌙 Semua Browser & Media Sosial kini wajib pindai QR Darurat di malam hari (22:00 – 06:00)!'
      )
    );
  };

  const handleSaveAppsSelection = () => {
    if (onSaveAppsBatch) {
      onSaveAppsBatch(draftApps);
    } else {
      draftApps.forEach((da) => {
        const orig = apps.find((oa) => oa.id === da.id);
        if (orig && orig.tier !== da.tier) {
          onChangeAppTier(da.id, da.tier);
        }
        (['work', 'personal', 'sunset'] as const).forEach((prof) => {
          if (orig && orig.pinnedProfiles.includes(prof) !== da.pinnedProfiles.includes(prof)) {
            onTogglePinAppToProfile(da.id, prof);
          }
        });
      });
    }
    setHasUnsavedAppChanges(false);
    setSavedAppsFeedback(
      tx(
        lang,
        `✓ Saved Active Apps & Home Screen configuration (${pinnedInCurrentProfileCount} apps pinned on ${homeProfile.toUpperCase()} profile).`,
        `✓ অ্যাপ তালিকা ও হোম স্ক্রিন সেটিংস সংরক্ষিত হয়েছে (${pinnedInCurrentProfileCount}টি অ্যাপ হোম স্ক্রিনে পিন করা আছে)।`,
        `✓ تم حفظ إعدادات التطبيقات والشاشة الرئيسية (${pinnedInCurrentProfileCount} تطبيق مثبت).`,
        `✓ ایپ لسٹ اور ہوم اسکرین کی ترتیبات محفوظ ہو گئیں (${pinnedInCurrentProfileCount} ایپس ہوم پر پن ہیں)۔`,
        `✓ Pengaturan Aplikasi & Layar Utama disimpan (${pinnedInCurrentProfileCount} aplikasi disematkan).`
      )
    );
  };

  const handleDiscardAppsChanges = () => {
    setDraftApps(apps);
    setHasUnsavedAppChanges(false);
    setSavedAppsFeedback(
      tx(
        lang,
        '↺ Discarded unsaved app selection changes.',
        '↺ অসংরক্ষিত পরিবর্তন বাতিল করা হয়েছে।',
        '↺ تم التراجع عن التغييرات غير المحفوظة.',
        '↺ غیر محفوظ شدہ تبدیلیاں منسوخ کر دی گئیں۔',
        '↺ Perubahan yang belum disimpan dibatalkan.'
      )
    );
  };

  const handleToggleSafeAppId = (appId: string) => {
    setDraftSafeAppIds((prev) =>
      prev.includes(appId) ? prev.filter((id) => id !== appId) : [...prev, appId]
    );
    setSafeListSavedFeedback(null);
  };

  const handleSaveBackgroundSafeList = () => {
    onUpdateVault((prev) => ({
      ...prev,
      backgroundSafeAppIds: draftSafeAppIds,
    }));
    setSafeListSavedFeedback(
      tx(
        lang,
        `✓ Saved Background Safe App List (${draftSafeAppIds.length} safe apps protected; all apps outside this list will auto-clean/close).`,
        `✓ ব্যাকগ্রাউন্ড নিরাপদ অ্যাপ তালিকা সেভ হয়েছে (${draftSafeAppIds.length}টি নিরাপদ অ্যাপ; এর বাইরের সকল অ্যাপ স্বয়ংক্রিয়ভাবে বন্ধ হবে)।`,
        `✓ تم حفظ قائمة التطبيقات الآمنة في الخلفية (${draftSafeAppIds.length} تطبيق آمن).`,
        `✓ بیک گراؤنڈ سیف ایپ لسٹ محفوظ ہو گئی (${draftSafeAppIds.length} محفوظ ایپس)۔`,
        `✓ Daftar Aplikasi Aman Latar Belakang disimpan (${draftSafeAppIds.length} aplikasi aman).`
      )
    );
  };

  const handleRunBackgroundAutoCleanNow = async () => {
    const safePackages: string[] = [];
    for (const app of draftApps) {
      if (draftSafeAppIds.includes(app.id)) {
        safePackages.push(app.packageName || app.id);
      }
    }
    const res = await enforceBackgroundSafeApps(safePackages, draftApps.length);
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    onUpdateVault((prev) => ({
      ...prev,
      backgroundSafeAppIds: draftSafeAppIds,
      lastBackgroundCleanIso: nowTime,
      lastBackgroundClosedCount: res.closedCount,
    }));
    setBackgroundCleanFeedback(
      tx(
        lang,
        `🧹 Auto-Cleaned & Closed ${res.closedCount} background apps outside your Safe List at ${nowTime}!`,
        `🧹 নিরাপদ তালিকার বাইরের ${res.closedCount}টি ব্যাকগ্রাউন্ড অ্যাপ স্বয়ংক্রিয়ভাবে পরিষ্কার ও বন্ধ করা হয়েছে (${nowTime})!`,
        `🧹 تم تنظيف وإغلاق ${res.closedCount} تطبيق في الخلفية خارج القائمة الآمنة (${nowTime})!`,
        `🧹 سیف لسٹ سے باہر کی ${res.closedCount} بیک گراؤنڈ ایپس صاف اور بند کر دی گئیں (${nowTime})!`,
        `🧹 Berhasil membersihkan & menutup ${res.closedCount} aplikasi latar belakang (${nowTime})!`
      )
    );
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-5 pb-10">
      {/* TOP BAR: SETTINGS & IMPACT REPORT HEADER + QUICK OS HARDWARE TOGGLES (WIFI, BT, DNS, ETC.) */}
      <div className="border border-zinc-700 bg-zinc-950 p-3.5 sm:p-4 space-y-3">
        <div className="flex flex-col gap-2.5">
          <div>
            <span className="text-[10px] font-mono-tech uppercase tracking-widest text-zinc-400">
              {tx(
                lang,
                'NATIVE OS CONTROL CENTER // REPORT & SETTINGS',
                'নেটিভ ওএস কন্ট্রোল সেন্টার // রিপোর্ট ও সম্পূর্ণ সেটিংস',
                'مركز تحكم النظام // التقرير والإعدادات',
                'سسٹم کنٹرول سینٹر // رپورٹ اور مکمل سیٹنگز',
                'PUSAT KONTROL OS // LAPORAN & PENGATURAN'
              )}
            </span>
            <h2 className="text-base font-mono-tech font-semibold text-zinc-100 mt-0.5">
              {t.settingsMenuTitle}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {onOpenFirstTimeSetup && (
              <button
                type="button"
                onClick={onOpenFirstTimeSetup}
                className="w-full py-2.5 px-3 bg-zinc-100 text-black font-mono-tech text-xs font-bold uppercase tracking-wider hover:bg-white cursor-pointer text-center"
              >
                🪄{' '}
                {tx(
                  lang,
                  'Easy 1st-Time Setup Steps',
                  'সহজ ১ম বার সেটআপ গাইড',
                  'خطوات الإعداد السهل',
                  'آسان فرسٹ ٹائم سیٹ اپ',
                  'Panduan Setup Mudah'
                )}
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowHowToGuideModal(true)}
              className="w-full py-2.5 px-3 border border-zinc-300 bg-zinc-900 text-zinc-100 font-mono-tech text-xs font-semibold uppercase tracking-wider hover:bg-zinc-800 cursor-pointer text-center"
            >
              {t.howToUseGuideBtn}
            </button>
            {onLockSettingsNow && (
              <button
                type="button"
                onClick={onLockSettingsNow}
                className="w-full py-2.5 px-3 border border-zinc-600 text-zinc-200 font-mono-tech text-xs uppercase tracking-wider hover:bg-zinc-900 cursor-pointer text-center"
              >
                🔒{' '}
                {tx(
                  lang,
                  'Lock Settings (20s Quiz)',
                  'সেটিংস লক করুন (২০ সে. কুইজ)',
                  'قفل الإعدادات (اختبار ٢٠ث)',
                  'سیٹنگز لاک کریں (٢٠ سیکنڈ کوئز)',
                  'Kunci Pengaturan (Kuis 20d)'
                )}
              </button>
            )}
          </div>
        </div>

        {/* EASY 1-TAP ACCESS TO WI-FI, BLUETOOTH, PRIVATE DNS, DISPLAY, SOUND & ALL SETTINGS */}
        <div className="pt-2.5 border-t border-zinc-800 space-y-2">
          <div className="flex items-center justify-between text-[10px] font-mono-tech uppercase tracking-wider text-zinc-400">
            <span>
              ⚡{' '}
              {tx(
                lang,
                'EASY 1-TAP PHONE SETTINGS (WI-FI · BT · DNS · DISPLAY · SOUND):',
                '১-ট্যাপে ফোনের মূল সেটিংস খুলুন (Wi-Fi · Bluetooth · DNS · ডিসপ্লে · সাউন্ড):',
                'الوصول السريع لإعدادات الهاتف بضغطة واحدة (Wi-Fi · بلوتوث · DNS):',
                '١-ٹیپ میں فون کی اہم سیٹنگز کھولیں (Wi-Fi · بلوٹوتھ · DNS · ڈسپلے):',
                'AKSES 1-SENTUH PENGATURAN PONSEL (WI-FI · BT · DNS · LAYAR):'
              )}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {(
              [
                {
                  target: 'wifi',
                  label: tx(lang, '📶 Wi-Fi', '📶 ওয়াই-ফাই (Wi-Fi)', '📶 Wi-Fi', '📶 وائی فائی (Wi-Fi)', '📶 Wi-Fi'),
                },
                {
                  target: 'bluetooth',
                  label: tx(lang, '🦷 Bluetooth', '🦷 ব্লুটুথ (BT)', '🦷 بلوتوث', '🦷 بلوٹوتھ (BT)', '🦷 Bluetooth'),
                },
                {
                  target: 'dns',
                  label: tx(lang, '🌐 Private DNS', '🌐 প্রাইভেট DNS', '🌐 DNS الخاص', '🌐 پرائیویٹ DNS', '🌐 DNS Pribadi'),
                },
                {
                  target: 'data',
                  label: tx(lang, '📱 Mobile Data', '📱 মোবাইল ডেটা', '📱 بيانات الهاتف', '📱 موبائل ڈیٹا', '📱 Data Seluler'),
                },
                {
                  target: 'display',
                  label: tx(lang, '🔆 Display', '🔆 ডিসপ্লে ও আলো', '🔆 الشاشة', '🔆 ڈسپلے', '🔆 Layar'),
                },
                {
                  target: 'sound',
                  label: tx(lang, '🔊 Sound', '🔊 সাউন্ড ও রিংটোন', '🔊 الصوت', '🔊 آواز / ساؤنڈ', '🔊 Suara'),
                },
                {
                  target: 'battery',
                  label: tx(lang, '🔋 Battery', '🔋 ব্যাটারি', '🔋 البطارية', '🔋 بیٹری', '🔋 Baterai'),
                },
                {
                  target: 'main',
                  label: tx(lang, '⚙️ All Settings', '⚙️ ফোনের সব সেটিংস', '⚙️ كل الإعدادات', '⚙️ فون کی تمام سیٹنگز', '⚙️ Semua Pengaturan'),
                },
              ] as const
            ).map((btn) => (
              <button
                key={btn.target}
                type="button"
                onClick={() => handleOpenPhoneSetting(btn.target, btn.label)}
                className="py-2.5 px-2 border border-zinc-700 bg-black hover:border-zinc-300 text-center text-xs font-mono-tech text-zinc-100 font-medium transition cursor-pointer"
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* 1-Tap Easy Private Safe DNS Copy + Open Button */}
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard?.writeText('family.cloudflare-dns.com');
              } catch {
                // ignore
              }
              setNativeStatusLog(
                tx(
                  lang,
                  'Copied family.cloudflare-dns.com & opened Network/DNS Settings! Paste into Private DNS Hostname.',
                  'family.cloudflare-dns.com কপি হয়েছে এবং DNS সেটিংস খোলা হয়েছে! এবার Private DNS Hostname-এ পেস্ট করে Save করুন।',
                  'تم نسخ family.cloudflare-dns.com وفتح إعدادات DNS! الصقه في Private DNS Hostname.',
                  'family.cloudflare-dns.com کاپی ہو گیا اور DNS سیٹنگز کھل گئیں! Private DNS میں پیسٹ کر کے سیو کریں۔',
                  'Disalin family.cloudflare-dns.com & membuka Pengaturan DNS! Tempel di Private DNS Hostname.'
                )
              );
              await openPhoneMainSetting('dns');
            }}
            className="w-full py-2.5 px-3 border border-zinc-400 bg-zinc-900 text-zinc-100 font-mono-tech text-xs font-semibold hover:bg-zinc-800 cursor-pointer text-center"
          >
            🛡️{' '}
            {tx(
              lang,
              '1-Tap Set Private Safe DNS (Copy family.cloudflare-dns.com & Open DNS)',
              '১-ট্যাপে প্রাইভেট সেফ DNS সেট করুন (family.cloudflare-dns.com কপি ও DNS খুলুন)',
              'ضبط DNS الآمن بضغطة واحدة (نسخ family.cloudflare-dns.com وفتح الإعدادات)',
              '١-ٹیپ میں پرائیویٹ سیف DNS سیٹ کریں (کاپی اور DNS سیٹنگز کھولیں)',
              '1-Sentuh Atur DNS Aman (Salin family.cloudflare-dns.com & Buka DNS)'
            )}
          </button>

          {nativeStatusLog && (
            <div className="p-2 border border-zinc-700 bg-black text-[11px] font-mono-tech text-zinc-200">
              ✓ {nativeStatusLog}
            </div>
          )}
        </div>

        {/* SUB-VIEW SWITCHER: IMPACT REPORT & REFERRAL VS ALL SETTINGS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 pt-2 border-t border-zinc-800">
          {(
            [
              {
                id: 'both',
                label: tx(
                  lang,
                  '📑 Full View (Report + Settings)',
                  '📑 সম্পূর্ণ ভিউ (রিপোর্ট + সেটিংস)',
                  '📑 العرض الكامل (التقرير + الإعدادات)',
                  '📑 مکمل ویو (رپورٹ + سیٹنگز)',
                  '📑 Tampilan Penuh (Laporan + Pengaturan)'
                ),
              },
              {
                id: 'report',
                label: tx(
                  lang,
                  '📊 Impact Graphics & Refer Friends',
                  '📊 সাফল্য গ্রাফিক্স ও বন্ধুদের আমন্ত্রণ',
                  '📊 رسوم الأثر ودعوة الأصدقاء',
                  '📊 کامیابی کے گرافکس اور دوستوں کو دعوت',
                  '📊 Grafik Dampak & Bagikan ke Teman'
                ),
              },
              {
                id: 'settings',
                label: tx(
                  lang,
                  '⚙️ App List & Protection Settings',
                  '⚙️ অ্যাপ তালিকা ও সুরক্ষা সেটিংস',
                  '⚙️ قائمة التطبيقات وإعدادات الحماية',
                  '⚙️ ایپ لسٹ اور حفاظتی سیٹنگز',
                  '⚙️ Daftar Aplikasi & Pengaturan'
                ),
              },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSettingsSubTab(tab.id)}
              className={`py-2 px-2.5 border text-xs font-mono-tech text-center cursor-pointer transition ${
                settingsSubTab === tab.id
                  ? 'border-zinc-100 bg-zinc-100 text-black font-bold'
                  : 'border-zinc-800 bg-black text-zinc-300 hover:border-zinc-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 0: IMPACT STATISTICS, VISUAL GRAPHICS & REFER FRIENDS/FAMILY HUB */}
      {(settingsSubTab === 'both' || settingsSubTab === 'report') && (
        <ImpactReportAndReferralHub
          lang={lang}
          impulsesStopped={impulsesStopped}
          reclaimedMinutes={reclaimedMinutes}
          purity={purity}
          slowLearning={slowLearning}
          vault={vault}
          apps={apps}
          onOpenShareableReceipt={() => setShowReceiptModal(true)}
        />
      )}

      {(settingsSubTab === 'both' || settingsSubTab === 'settings') && (
        <div className="space-y-5">
          {/* 2. LANGUAGE SWITCHER (FULL APP TRANSLATION: ENGLISH, BANGLA, ARABIC, URDU, INDONESIAN) */}
          <div className="border border-zinc-800 bg-zinc-950/60 p-5 space-y-3">
            <div className="text-[10px] font-mono-tech uppercase tracking-widest text-zinc-500">
              {tx(
                lang,
                'GLOBAL ACCESSIBILITY // 100% FULL APP TRANSLATION',
                'সম্পূর্ণ ভাষা অনুবাদ // সকল পেজ, সাবটেক্সট ও ব্যাখ্যা আপনার ভাষায়',
                'الترجمة الكاملة للتطبيق // جميع الصفحات والشروحات بلغتك',
                'مکمل ایپ ترجمہ // تمام صفحات اور وضاحتیں آپ کی زبان میں',
                'TERJEMAHAN PENUH // SEMUA HALAMAN & PENJELASAN DALAM BAHASA ANDA'
              )}
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
              {tx(
                lang,
                'SPIRITUAL & PHILOSOPHICAL ALIGNMENT // CUSTOMIZE YOUR EXPERIENCE',
                'আধ্যাত্মিক ও নৈতিক অনুপ্রেরণা মোড // আপনার পছন্দ অনুযায়ী সাজান',
                'التوجه الروحي والفكري // خصص تجربتك',
                'روحانی اور فکری رہنمائی // اپنی پسند کا موڈ منتخب کریں',
                'PENYELARASAN SPIRITUAL & HIKMAH // SESUAIKAN PENGALAMAN ANDA'
              )}
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
                    desc: tx(
                      lang,
                      'Exclusively Quranic verses, authentic Sahih Hadith, Arabic script, and Islamic Slow Learning.',
                      'হোম স্ক্রিন, শ্বাস-বিরতি ও পবিত্রতা গার্ডে কেবল কুরআনের আয়াত, সহীহ হাদীস ও ইসলামিক শিক্ষা দেখাবে।',
                      'آيات قرآنية وأحاديث صحيحة ونصوص عربية ودروس إسلامية خالصة.',
                      'ہوم اسکرین اور کوئز میں صرف قرآنی آیات، صحیح احادیث اور اسلامی تعلیمات دکھائے گا۔',
                      'Khusus ayat Al-Qur’an, Hadis Sahih, teks Arab, dan pembelajaran Islam.'
                    ),
                  },
                  {
                    id: 'universal',
                    title: t.modeCommonUniversal,
                    desc: tx(
                      lang,
                      '100% Universal proverbs, Stoic philosophy, and neuroscience focus principles suitable for everyone.',
                      'সকল ধর্ম ও মানুষের জন্য উপযোগী সার্বজনীন প্রজ্ঞা, মনোযোগ বিজ্ঞান ও প্রবাদ প্রদর্শন করবে।',
                      'حكم عالمية وفلسفة التركيز وعلم الأعصاب المناسبة للجميع.',
                      'ہر انسان کے لیے موزوں عالمگیر حکمت، توجہ کی سائنس اور اقوالِ زریں۔',
                      '100% pepatah universal, filosofi fokus, dan sains perhatian untuk semua orang.'
                    ),
                  },
                  {
                    id: 'blended',
                    title: t.modeBlendedAll,
                    desc: tx(
                      lang,
                      'Combines both sacred Islamic Sakinah triggers and universal calm mind proverbs.',
                      'ইসলামিক সাকীনাহ বাণী এবং সার্বজনীন প্রজ্ঞা উভয়ই সমন্বিতভাবে প্রদর্শন করবে।',
                      'يجمع بين آيات السكينة الإسلامية والحكم العالمية الهادئة.',
                      'اسلامی سکینہ آیات اور عالمگیر دانائی دونوں کو یکجا کرتا ہے۔',
                      'Menggabungkan hikmah Sakinah Islam dan pepatah ketenangan universal.'
                    ),
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
                  {tx(
                    lang,
                    'Show Original Arabic Script Above Quran & Hadith',
                    'কুরআন ও হাদীসের ওপরে মূল আরবি ইবারত প্রদর্শন করুন',
                    'إظهار النص العربي الأصلي فوق الآيات والأحاديث',
                    'قرآن و حدیث کے اوپر اصل عربی متن دکھائیں',
                    'Tampilkan Teks Arab Asli di Atas Al-Qur’an & Hadis'
                  )}
                </div>
                <div className="text-[11px] font-mono-tech text-zinc-500">
                  {tx(
                    lang,
                    'Displays crisp Naskh Arabic line above localized translation',
                    'অনুবাদের ওপরে স্পষ্ট আরবি হরফে মূল আয়াত বা হাদীস দেখাবে',
                    'يعرض النص العربي بخط واضح فوق الترجمة',
                    'ترجمے کے اوپر واضح عربی خط میں اصل آیت یا حدیث دکھاتا ہے',
                    'Menampilkan baris teks Arab yang jelas di atas terjemahan'
                  )}
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
                {showArabicScript
                  ? tx(lang, 'ON', 'চালু', 'مفعل', 'آن', 'ON')
                  : tx(lang, 'OFF', 'বন্ধ', 'متوقف', 'آف', 'OFF')}
              </button>
            </div>
          </div>

          {/* 4. SLOW LEARNING MODE (ISLAM / LANGUAGE / FOCUS) & 20-SEC READ + PLAY QUIZ GATE */}
          <div className="border border-zinc-700 bg-zinc-950/80 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <div>
                <span className="text-[10px] font-mono-tech uppercase tracking-widest text-zinc-400">
                  {tx(
                    lang,
                    'TURN EVERY APP IMPULSE INTO KNOWLEDGE // 20S READ + QUIZ GATE',
                    'প্রতিবার অ্যাপ খোলার অভ্যাসকে জ্ঞানে রূপান্তর // ২০ সেকেন্ডের পাঠ ও কুইজ গেট',
                    'حوّل كل فتح تطبيق إلى معرفة // بوابة القراءة والاختبار (٢٠ث)',
                    'ہر ایپ کھولنے کی عادت کو علم میں بدلیں // ٢٠ سیکنڈ مطالعہ اور کوئز گیٹ',
                    'UBAH SETIAP BUKA APLIKASI JADI ILMU // GERBANG BACA & KUIS 20D'
                  )}
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
                {slowLearning.require30sQuizToOpenApps
                  ? tx(lang, '20S QUIZ: ON', '২০ সে. কুইজ: চালু', 'اختبار ٢٠ث: مفعل', '٢٠ سیکنڈ کوئز: آن', 'KUIS 20D: ON')
                  : tx(lang, 'OFF', 'বন্ধ', 'متوقف', 'آف', 'OFF')}
              </button>
            </div>

            {/* Slow Learning Stats Bar */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="border border-zinc-800 bg-black p-2.5">
                <div className="text-lg font-mono-tech text-zinc-100">{slowLearning.xp} XP</div>
                <div className="text-[10px] font-mono-tech text-zinc-500">
                  {tx(lang, 'LEARNING XP', 'শিক্ষা পয়েন্ট (XP)', 'نقاط التعلم', 'تعلیمی پوائنٹس', 'POIN XP')}
                </div>
              </div>
              <div className="border border-zinc-800 bg-black p-2.5">
                <div className="text-lg font-mono-tech text-zinc-100">
                  {slowLearning.lessonsCompleted}
                </div>
                <div className="text-[10px] font-mono-tech text-zinc-500">
                  {tx(lang, 'LESSONS READ', 'পঠিত পাঠ', 'الدروس المقروءة', 'پڑھے گئے اسباق', 'PELAJARAN')}
                </div>
              </div>
              <div className="border border-zinc-800 bg-black p-2.5">
                <div className="text-lg font-mono-tech text-zinc-100">
                  {slowLearning.quizzesPassed}
                </div>
                <div className="text-[10px] font-mono-tech text-zinc-500">
                  {tx(lang, 'QUIZZES PASSED', 'উত্তীর্ণ কুইজ', 'الاختبارات المجتازة', 'پاس کردہ کوئز', 'KUIS LULUS')}
                </div>
              </div>
            </div>

            {/* Choose Slow Learning Track */}
            <div className="space-y-2">
              <div className="text-xs font-mono-tech text-zinc-300">
                {tx(
                  lang,
                  'Select Slow Learning Curriculum Track:',
                  '২০ সেকেন্ডের কুইজের বিষয়বস্তু নির্বাচন করুন:',
                  'اختر مسار التعلم:',
                  '٢٠ سیکنڈ کوئز کا نصاب منتخب کریں:',
                  'Pilih Kurikulum Pembelajaran:'
                )}
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

            {/* Method 5: "If-Then" Implementation Intention Replacement Micro-Action */}
            <div className="space-y-1.5 pt-2 border-t border-zinc-900">
              <div className="text-xs font-mono-tech text-zinc-300">
                {tx(
                  lang,
                  'Scientific "If–Then" Replacement Habit (Shown on Return to Peace button):',
                  'বৈজ্ঞানিক "If–Then" বিকল্প অভ্যাস (প্রশান্তিতে ফিরে যাওয়ার বাটনে দেখাবে):',
                  'عادة الاستبدال الإيجابية عند التراجع عن فتح التطبيق:',
                  'سائنسی متبادل عادت (واپسی کے بٹن پر نظر آئے گی):',
                  'Kebiasaan Pengganti Positif (Tampil di tombol Kembali Tenang):'
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                {[
                  {
                    id: 'Drink Water / Dhikr / Deep Sigh',
                    label: tx(
                      lang,
                      '💧 Drink Water / Dhikr / Sigh',
                      '💧 ১ গ্লাস পানি পান / যিকির / দীর্ঘ শ্বাস',
                      '💧 شرب ماء / ذكر الله / تنفس عميق',
                      '💧 پانی پئیں / ذکر کریں / گہرا سانس',
                      '💧 Minum Air / Dzikir / Napas Dalam'
                    ),
                  },
                  {
                    id: 'Stand Up & Stretch 30s',
                    label: tx(
                      lang,
                      '🚶 Stand Up & Stretch 30s',
                      '🚶 উঠে দাঁড়িয়ে ৩০ সেকেন্ড হাঁটুন',
                      '🚶 قف وتحرك لمدة ٣٠ ثانية',
                      '🚶 اٹھ کر ٣٠ سیکنڈ چہل قدمی کریں',
                      '🚶 Berdiri & Peregangan 30d'
                    ),
                  },
                  {
                    id: 'Read 2 Lines of Book / Quran',
                    label: tx(
                      lang,
                      '📖 Read 2 Lines of Book / Quran',
                      '📖 কুরআন বা বইয়ের ২ লাইন পড়ুন',
                      '📖 اقرأ سطرين من القرآن أو كتاب',
                      '📖 قرآن یا کتاب کی ٢ سطریں پڑھیں',
                      '📖 Baca 2 Baris Al-Qur’an / Buku'
                    ),
                  },
                ].map((habit) => (
                  <button
                    key={habit.id}
                    type="button"
                    onClick={() =>
                      onUpdateSlowLearning((prev) => ({
                        ...prev,
                        ifThenReplacementHabit: habit.id,
                      }))
                    }
                    className={`py-2 px-2.5 border text-left text-[11px] font-mono-tech cursor-pointer ${
                      (slowLearning.ifThenReplacementHabit ||
                        'Drink Water / Dhikr / Deep Sigh') === habit.id
                        ? 'border-zinc-100 bg-zinc-100 text-black font-semibold'
                        : 'border-zinc-800 text-zinc-400'
                    }`}
                  >
                    {habit.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Choose Mandatory Reading Timer Duration */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-900">
              <span className="text-xs font-mono-tech text-zinc-300">
                {tx(
                  lang,
                  'Quick Read Timer (Answer within 20s):',
                  'দ্রুত পাঠের সময়সীমা (২০ সেকেন্ডের মধ্যে কুইজ উত্তর):',
                  'مؤقت القراءة السريعة (الإجابة خلال ٢٠ ثانية):',
                  'تیز مطالعہ کا وقت (٢٠ سیکنڈ میں کوئز مکمل):',
                  'Timer Baca Cepat (Jawab dalam 20 detik):'
                )}
              </span>
              <div className="flex gap-1.5">
                {[10, 12, 15, 20].map((sec) => (
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
              🎓{' '}
              {tx(
                lang,
                'Practice Quick 20s Micro-Learning & Quiz Now',
                'এখনই ২০ সেকেন্ডের পাঠ ও কুইজ অনুশীলন করুন',
                'تدرّب الآن على درس واختبار ٢٠ ثانية',
                'ابھی ٢٠ سیکنڈ کے سبق اور کوئز کی مشق کریں',
                'Latihan Baca & Kuis Cepat 20 Detik Sekarang'
              )}
            </button>
          </div>

          {/* 5. EASY APP LIST, CALLING/WHATSAPP & SLEEPING-TIME NIGHT QR MANAGER */}
          <div className="border-2 border-zinc-300 bg-zinc-950 p-4 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-zinc-800 pb-3">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-mono-tech uppercase tracking-widest text-zinc-400">
                  {tx(
                    lang,
                    'EASY APP LIST & SLEEPING-TIME NIGHT QR LOCK',
                    'সহজ অ্যাপ তালিকা এবং রাতের জরুরি QR লক নিয়ন্ত্রণ',
                    'قائمة التطبيقات السهلة وقفل QR الليلي',
                    'آسان ایپ لسٹ اور رات کا ایمرجنسی QR لاک',
                    'DAFTAR APLIKASI MUDAH & KUNCI QR MALAM'
                  )}
                </span>
                <h3 className="text-sm font-mono-tech font-semibold text-zinc-100 mt-0.5">
                  {t.activeAppsManagerTitle}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {tx(
                    lang,
                    '1-Tap control: Set apps as ⚡ Normal (Calls, SMS, WhatsApp), 📚 20s Quiz, or 🌙 Night QR Lock (mandatory emergency QR scan during sleeping hours 10 PM – 6 AM).',
                    '১-ট্যাপে নিয়ন্ত্রণ: অ্যাপগুলোকে ⚡ সাধারণ (কল, SMS, WhatsApp), 📚 ২০ সে. কুইজ, অথবা 🌙 রাতের QR লক (রাত ১০টা – ভোর ৬টায় জরুরি QR স্ক্যান বাধ্যতামূলক) হিসেবে সেট করুন।',
                    'تحكم بضغطة واحدة: اضبط التطبيقات كـ ⚡ عادي (الهاتف، الرسائل، واتساب)، أو 📚 اختبار ٢٠ث، أو 🌙 قفل QR ليلي.',
                    '١-ٹیپ کنٹرول: ایپس کو ⚡ نارمل (کالز، SMS، واٹس ایپ)، 📚 ٢٠ سیکنڈ کوئز، یا 🌙 رات کے QR لاک پر سیٹ کریں۔',
                    'Kontrol 1-Sentuh: Atur aplikasi sebagai ⚡ Normal (Telepon, SMS, WhatsApp), 📚 Kuis 20d, atau 🌙 Kunci QR Malam.'
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={onRefreshInstalledApps}
                className="px-3 py-2 border border-zinc-600 text-xs font-mono-tech text-zinc-100 hover:bg-zinc-900 cursor-pointer"
              >
                ↻{' '}
                {tx(
                  lang,
                  `Sync Phone Apps (${apps.length})`,
                  `ফোনের অ্যাপ সিঙ্ক করুন (${apps.length})`,
                  `مزامنة تطبيقات الهاتف (${apps.length})`,
                  `فون ایپس سنک کریں (${apps.length})`,
                  `Sinkronkan Aplikasi (${apps.length})`
                )}
              </button>
            </div>

            {/* 1-TAP SMART PRESETS FOR CALLS/WHATSAPP & NIGHT SLEEP LOCK */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleMakeCallsSmsWhatsAppNormal}
                className="py-2.5 px-3 border border-zinc-400 bg-zinc-900 text-zinc-100 font-mono-tech text-xs font-semibold text-left hover:bg-zinc-800 cursor-pointer"
              >
                📞{' '}
                {tx(
                  lang,
                  'Set Phone, SMS & WhatsApp as Normal + Pinned on Home',
                  'ফোন কল, মেসেজ (SMS) ও WhatsApp-কে সাধারণ (Normal) ও হোমে পিন করুন',
                  'ضبط الهاتف والرسائل وواتساب كتطبيقات عادية ومثبتة بالرئيسية',
                  'فون، SMS اور واٹس ایپ کو نارمل اور ہوم پر پن کریں',
                  'Atur Telepon, SMS & WhatsApp Normal + Sematkan di Utama'
                )}
              </button>
              <button
                type="button"
                onClick={handleLockAllSocialAndBrowsersAtNight}
                className="py-2.5 px-3 border border-zinc-400 bg-zinc-900 text-zinc-100 font-mono-tech text-xs font-semibold text-left hover:bg-zinc-800 cursor-pointer"
              >
                🌙{' '}
                {tx(
                  lang,
                  'Lock Browsers & Social Media at Night (Emergency QR Required)',
                  'রাতে সকল ব্রাউজার ও সোশ্যাল মিডিয়া লক করুন (জরুরি QR স্ক্যান বাধ্যতামূলক)',
                  'قفل المتصفحات والتواصل ليلاً (يتطلب رمز QR للطوارئ)',
                  'رات کو براؤزرز اور سوشل میڈیا لاک کریں (ایمرجنسی QR لازمی)',
                  'Kunci Browser & Sosial di Malam Hari (Wajib QR Darurat)'
                )}
              </button>
            </div>

            {/* Select Home Profile + Quick Category Filter Pills */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <span className="text-xs font-mono-tech text-zinc-300">
                {tx(
                  lang,
                  `Home Profile (${pinnedInCurrentProfileCount} on Home):`,
                  `হোম প্রোফাইল (হোম স্ক্রিনে ${pinnedInCurrentProfileCount}টি পিন করা):`,
                  `ملف الشاشة الرئيسية (${pinnedInCurrentProfileCount} مثبت):`,
                  `ہوم پروفائل (${pinnedInCurrentProfileCount} ہوم پر پن ہیں):`,
                  `Profil Utama (${pinnedInCurrentProfileCount} di Layar Utama):`
                )}
              </span>
              <div className="flex gap-1">
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
                    className={`px-2.5 py-1 border text-xs font-mono-tech cursor-pointer ${
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

            {/* Easy 1-Tap Category Filter Tabs */}
            <div className="grid grid-cols-5 gap-1 text-[10px] font-mono-tech">
              {(
                [
                  {
                    id: 'all',
                    label: `${tx(lang, 'All', 'সব', 'الكل', 'سب', 'Semua')} (${draftApps.length})`,
                  },
                  {
                    id: 'home',
                    label: tx(lang, '★ Home', '★ হোম', '★ الرئيسية', '★ ہوم', '★ Utama'),
                  },
                  {
                    id: 'normal',
                    label: tx(lang, '⚡ Normal', '⚡ সাধারণ', '⚡ عادي', '⚡ نارمل', '⚡ Normal'),
                  },
                  {
                    id: 'quiz',
                    label: tx(lang, '📚 20s Quiz', '📚 ২০সে কুইজ', '📚 اختبار ٢٠ث', '📚 ٢٠س کوئز', '📚 Kuis 20d'),
                  },
                  {
                    id: 'night-qr',
                    label: tx(lang, '🌙 Night QR', '🌙 রাতের QR', '🌙 QR ليلي', '🌙 رات کا QR', '🌙 QR Malam'),
                  },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setAppQuickFilter(f.id)}
                  className={`py-2 px-1 border text-center cursor-pointer truncate ${
                    appQuickFilter === f.id
                      ? 'border-zinc-100 bg-zinc-100 text-black font-bold'
                      : 'border-zinc-800 bg-black text-zinc-400'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Filter Apps Input */}
            <input
              type="text"
              value={appFilterQuery}
              onChange={(e) => setAppFilterQuery(e.target.value)}
              placeholder={tx(
                lang,
                'Search app name (e.g. WhatsApp, YouTube, Chrome)...',
                'অ্যাপের নাম লিখে খুঁজুন (যেমন: WhatsApp, YouTube, Chrome)...',
                'ابحث عن اسم التطبيق (مثل WhatsApp, YouTube)...',
                'ایپ کا نام تلاش کریں (مثلاً WhatsApp, YouTube)...',
                'Cari nama aplikasi (mis. WhatsApp, YouTube)...'
              )}
              className="w-full bg-black border border-zinc-700 px-3 py-2 text-xs font-mono-tech text-zinc-100 focus:outline-none focus:border-zinc-300"
            />

            {/* Scrollable Easy App Cards */}
            <div className="max-h-80 overflow-y-auto divide-y divide-zinc-800 border border-zinc-800 bg-black">
              {filteredApps.map((app) => {
                const isPinned = app.pinnedProfiles.includes(homeProfile);
                const isNightLocked = isNightLockedByDefault(app);
                const isNormal = app.tier === 'essential' || app.tier === 'utility';
                const displayName = getAppDisplayName(app, lang);
                return (
                  <div key={app.id} className="p-3 space-y-2">
                    {/* Row 1: App Name + Home Toggle + Night QR Toggle */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-zinc-100 truncate">
                          {lang !== 'en' && displayName !== app.name
                            ? `${displayName} (${app.name})`
                            : displayName}
                        </div>
                        <div className="text-[10px] font-mono-tech text-zinc-400">
                          {isNormal
                            ? tx(lang, '⚡ Normal App', '⚡ সাধারণ অ্যাপ (সরাসরি খোলে)', '⚡ تطبيق عادي', '⚡ نارمل ایپ', '⚡ Aplikasi Normal')
                            : tx(lang, '📚 20s Quiz App', '📚 ২০ সেকেন্ড কুইজ অ্যাপ', '📚 تطبيق باختبار ٢٠ث', '📚 ٢٠ سیکنڈ کوئز ایپ', '📚 Aplikasi Kuis 20d')}
                          {isNightLocked
                            ? tx(lang, ' · 🌙 Night QR Lock', ' · 🌙 রাতে জরুরি QR লক', ' · 🌙 قفل QR ليلي', ' · 🌙 رات کا QR لاک', ' · 🌙 Kunci QR Malam')
                            : ''}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStageTogglePinApp(app.id, homeProfile)}
                          className={`px-2 py-1 border text-[10px] font-mono-tech cursor-pointer ${
                            isPinned
                              ? 'border-zinc-100 bg-zinc-100 text-black font-bold'
                              : 'border-zinc-700 text-zinc-300'
                          }`}
                        >
                          {isPinned
                            ? tx(lang, '★ On Home', '★ হোমে আছে', '★ بالرئيسية', '★ ہوم پر', '★ Di Utama')
                            : tx(lang, '+ Home', '+ হোমে রাখুন', '+ للرئيسية', '+ ہوم', '+ Utama')}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStageToggleNightQr(app.id)}
                          className={`px-2 py-1 border text-[10px] font-mono-tech cursor-pointer ${
                            isNightLocked
                              ? 'border-zinc-200 bg-zinc-800 text-white font-bold'
                              : 'border-zinc-800 text-zinc-500'
                          }`}
                        >
                          {isNightLocked
                            ? tx(lang, '🌙 Night QR: ON', '🌙 রাতের QR: চালু', '🌙 QR ليلي: مفعل', '🌙 رات کا QR: آن', '🌙 QR Malam: ON')
                            : tx(lang, '🌙 Night: OFF', '🌙 রাত: বন্ধ', '🌙 ليلي: متوقف', '🌙 رات: آف', '🌙 Malam: OFF')}
                        </button>
                      </div>
                    </div>

                    {/* Row 2: 3 Simple Mode Buttons */}
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          handleStageChangeAppTier(
                            app.id,
                            app.id === 'phone' || app.id === 'messages' || app.id === 'whatsapp'
                              ? 'essential'
                              : 'utility'
                          )
                        }
                        className={`py-1.5 px-2 border text-[10px] font-mono-tech text-center cursor-pointer ${
                          isNormal
                            ? 'border-zinc-100 bg-zinc-100 text-black font-bold'
                            : 'border-zinc-800 text-zinc-400'
                        }`}
                      >
                        ⚡{' '}
                        {tx(
                          lang,
                          'Normal (Instant)',
                          'সাধারণ (সরাসরি)',
                          'عادي (فوري)',
                          'نارمل (فوری)',
                          'Normal (Langsung)'
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStageChangeAppTier(app.id, 'restricted')}
                        className={`py-1.5 px-2 border text-[10px] font-mono-tech text-center cursor-pointer ${
                          app.tier === 'restricted'
                            ? 'border-zinc-100 bg-zinc-100 text-black font-bold'
                            : 'border-zinc-800 text-zinc-400'
                        }`}
                      >
                        📚{' '}
                        {tx(
                          lang,
                          '20s Quiz Gate',
                          '২০ সে. কুইজ গেট',
                          'بوابة اختبار ٢٠ث',
                          '٢٠ سیکنڈ کوئز',
                          'Gerbang Kuis 20d'
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStageChangeAppTier(app.id, 'adult-blocked')}
                        className={`py-1.5 px-2 border text-[10px] font-mono-tech text-center cursor-pointer ${
                          app.tier === 'adult-blocked'
                            ? 'border-zinc-100 bg-zinc-100 text-black font-bold'
                            : 'border-zinc-800 text-zinc-400'
                        }`}
                      >
                        🚫 {tx(lang, 'Block App', 'সম্পূর্ণ ব্লক', 'حجب التطبيق', 'بلاک کریں', 'Blokir')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* EXPLICIT SAVE & DISCARD BUTTONS FOR ACTIVE APPS SELECTION */}
            <div className="border-t border-zinc-800 pt-3 space-y-2">
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={handleSaveAppsSelection}
                  className="flex-1 py-3 px-4 bg-zinc-100 text-black font-mono-tech text-xs font-bold uppercase tracking-wider hover:bg-white cursor-pointer"
                >
                  💾{' '}
                  {tx(
                    lang,
                    'Save App List & Night Lock Settings',
                    'অ্যাপ তালিকা ও রাতের লক সেটিংস সেভ করুন',
                    'حفظ قائمة التطبيقات وإعدادات القفل الليلي',
                    'ایپ لسٹ اور رات کے لاک کی ترتیبات محفوظ کریں',
                    'Simpan Daftar Aplikasi & Kunci Malam'
                  )}
                  {hasUnsavedAppChanges ? ' *' : ''}
                </button>
                {hasUnsavedAppChanges && (
                  <button
                    type="button"
                    onClick={handleDiscardAppsChanges}
                    className="py-3 px-4 border border-zinc-700 text-xs font-mono-tech text-zinc-300 hover:bg-zinc-900 cursor-pointer"
                  >
                    ↺ {tx(lang, 'Discard', 'বাতিল', 'تراجع', 'منسوخ', 'Batal')}
                  </button>
                )}
              </div>
              {savedAppsFeedback && (
                <div className="p-2.5 border border-zinc-400 bg-black text-xs font-mono-tech text-zinc-100">
                  {savedAppsFeedback}
                </div>
              )}
            </div>

            {/* Add Custom App Form */}
            <form onSubmit={handleCreateCustomApp} className="flex flex-wrap gap-2 pt-1">
              <input
                type="text"
                value={newCustomAppName}
                onChange={(e) => setNewCustomAppName(e.target.value)}
                placeholder={tx(
                  lang,
                  'Add custom app name...',
                  'নতুন অ্যাপের নাম যোগ করুন...',
                  'أضف اسم تطبيق مخصص...',
                  'نئی ایپ کا نام شامل کریں...',
                  'Tambahkan nama aplikasi kustom...'
                )}
                className="flex-1 min-w-[160px] bg-black border border-zinc-800 px-3 py-2 text-xs font-mono-tech text-zinc-200"
              />
              <select
                value={newCustomAppTier}
                onChange={(e) => setNewCustomAppTier(e.target.value as AppFrictionTier)}
                className="bg-black border border-zinc-800 px-2.5 py-2 text-xs font-mono-tech text-zinc-300"
              >
                <option value="utility">
                  {tx(lang, 'Normal (Instant)', 'সাধারণ (সরাসরি)', 'عادي (فوري)', 'نارمل (فوری)', 'Normal (Langsung)')}
                </option>
                <option value="restricted">
                  {tx(lang, '20s Quiz Gate', '২০ সে. কুইজ গেট', 'اختبار ٢٠ث', '٢٠ سیکنڈ کوئز', 'Kuis 20d')}
                </option>
                <option value="adult-blocked">
                  {tx(lang, 'Completely Blocked', 'সম্পূর্ণ ব্লক', 'محجوب تماماً', 'مکمل بلاک', 'Diblokir Penuh')}
                </option>
              </select>
              <button
                type="submit"
                className="px-3 py-2 border border-zinc-600 bg-zinc-900 text-xs font-mono-tech text-zinc-100 hover:bg-zinc-800 cursor-pointer"
              >
                + {tx(lang, 'Add App', 'যোগ করুন', 'إضافة', 'شامل کریں', 'Tambah')}
              </button>
            </form>
          </div>

          {/* 5B. BACKGROUND SAFE APP LIST & AUTO-CLEAN / AUTO-CLOSE ENGINE */}
          <div className="border border-zinc-800 bg-zinc-950/60 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-2.5">
              <div>
                <span className="text-[10px] font-mono-tech uppercase tracking-widest text-zinc-500">
                  {tx(
                    lang,
                    'BACKGROUND PROCESS GUARD & RAM / DOPAMINE CLEANER',
                    'ব্যাকগ্রাউন্ড প্রসেস গার্ড ও অটো-ক্লিনার',
                    'حارس تطبيقات الخلفية والمنظف التلقائي',
                    'بیک گراؤنڈ پروسیس گارڈ اور آٹو کلینر',
                    'PENJAGA PROSES LATAR BELAKANG & PEMBERSIH OTOMATIS'
                  )}
                </span>
                <h3 className="text-sm font-mono-tech font-semibold text-zinc-100 mt-0.5">
                  🧹{' '}
                  {tx(
                    lang,
                    'Background Safe App Whitelist & Auto-Close Engine',
                    'ব্যাকগ্রাউন্ড নিরাপদ অ্যাপ তালিকা ও স্বয়ংক্রিয় বন্ধকরণ ইঞ্জিন',
                    'القائمة الآمنة لتطبيقات الخلفية والإغلاق التلقائي',
                    'بیک گراؤنڈ محفوظ ایپ لسٹ اور خودکار بندش انجن',
                    'Daftar Putih Aplikasi Aman & Penutup Otomatis Latar Belakang'
                  )}
                </h3>
              </div>
              <button
                type="button"
                onClick={() =>
                  onUpdateVault((prev) => ({
                    ...prev,
                    autoCleanBackgroundApps: !(prev.autoCleanBackgroundApps ?? true),
                  }))
                }
                className={`px-3 py-1.5 border text-xs font-mono-tech cursor-pointer ${
                  vault.autoCleanBackgroundApps ?? true
                    ? 'border-zinc-100 bg-zinc-100 text-black font-semibold'
                    : 'border-zinc-700 text-zinc-400'
                }`}
              >
                {vault.autoCleanBackgroundApps ?? true
                  ? tx(lang, 'AUTO-CLEAN ON', 'অটো-ক্লিন চালু', 'تنظيف تلقائي', 'آٹو کلین آن', 'BERSIH OTOMATIS')
                  : tx(lang, 'OFF', 'বন্ধ', 'متوقف', 'آف', 'OFF')}
              </button>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              {tx(
                lang,
                'Select the essential apps allowed to stay alive in the background. Any app outside this Background Safe List (such as Facebook, Instagram, YouTube, TikTok, or browsers) is automatically cleaned and closed when you return Home or when you tap Clean below.',
                'ব্যাকগ্রাউন্ডে সচল থাকার জন্য জরুরি অ্যাপগুলো নির্বাচন করুন। এই নিরাপদ তালিকার বাইরের যেকোনো অ্যাপ (যেমন: Facebook, Instagram, YouTube, TikTok বা ব্রাউজার) হোম স্ক্রিনে ফিরলে বা নিচের বাটনে ট্যাপ করলে স্বয়ংক্রিয়ভাবে পরিষ্কার ও বন্ধ হয়ে যাবে।',
                'حدد التطبيقات الضرورية المسموح لها بالعمل في الخلفية. أي تطبيق خارج هذه القائمة سيتم تنظيفه وإغلاقه تلقائياً عند العودة للشاشة الرئيسية.',
                'وہ ضروری ایپس منتخب کریں جنہیں بیک گراؤنڈ میں چلنے کی اجازت ہے۔ اس فہرست سے باہر کی تمام ایپس ہوم پر آنے پر خودکار طور پر بند ہو جائیں گی۔',
                'Pilih aplikasi penting yang diizinkan berjalan di latar belakang. Aplikasi di luar daftar ini akan dibersihkan & ditutup otomatis.'
              )}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-52 overflow-y-auto p-2 border border-zinc-900 bg-black">
              {draftApps.map((app) => {
                const isSafe = draftSafeAppIds.includes(app.id);
                return (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => handleToggleSafeAppId(app.id)}
                    className={`p-2 border text-left text-xs font-mono-tech cursor-pointer flex items-center justify-between ${
                      isSafe
                        ? 'border-zinc-200 bg-zinc-900 text-zinc-100 font-semibold'
                        : 'border-zinc-900 text-zinc-500 hover:border-zinc-700'
                    }`}
                  >
                    <span className="truncate">{getAppDisplayName(app, lang)}</span>
                    <span className="ml-1 text-[10px]">
                      {isSafe
                        ? tx(lang, '✓ SAFE', '✓ নিরাপদ', '✓ آمن', '✓ محفوظ', '✓ AMAN')
                        : tx(lang, '✕ KILL', '✕ বন্ধ হবে', '✕ إغلاق', '✕ بند', '✕ TUTUP')}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={handleSaveBackgroundSafeList}
                className="flex-1 py-2.5 px-3 border border-zinc-300 bg-zinc-900 text-zinc-100 font-mono-tech text-xs font-semibold uppercase tracking-wider hover:bg-zinc-800 cursor-pointer"
              >
                💾{' '}
                {tx(
                  lang,
                  `Save Background Safe List (${draftSafeAppIds.length} Safe)`,
                  `নিরাপদ তালিকা সেভ করুন (${draftSafeAppIds.length}টি নিরাপদ)`,
                  `حفظ القائمة الآمنة (${draftSafeAppIds.length})`,
                  `محفوظ فہرست سیو کریں (${draftSafeAppIds.length})`,
                  `Simpan Daftar Aman (${draftSafeAppIds.length})`
                )}
              </button>
              <button
                type="button"
                onClick={handleRunBackgroundAutoCleanNow}
                className="flex-1 py-2.5 px-3 bg-zinc-100 text-black font-mono-tech text-xs font-semibold uppercase tracking-wider hover:bg-white cursor-pointer"
              >
                🧹{' '}
                {tx(
                  lang,
                  'Auto-Clean & Close Non-Safe Apps Now',
                  'এখনই তালিকার বাইরের অ্যাপ পরিষ্কার ও বন্ধ করুন',
                  'تنظيف وإغلاق التطبيقات غير الآمنة الآن',
                  'ابھی غیر محفوظ بیک گراؤنڈ ایپس بند کریں',
                  'Bersihkan & Tutup Aplikasi Non-Aman Sekarang'
                )}
              </button>
            </div>

            {safeListSavedFeedback && (
              <div className="p-2.5 border border-zinc-600 bg-black text-xs font-mono-tech text-zinc-200">
                {safeListSavedFeedback}
              </div>
            )}
            {backgroundCleanFeedback && (
              <div className="p-2.5 border border-zinc-300 bg-black text-xs font-mono-tech text-zinc-100">
                {backgroundCleanFeedback}
              </div>
            )}
          </div>

          {/* 5C. RUNNING-APP ESCALATION (5M MINOR -> 10M MEDIUM -> 20M FULL-SCREEN CLOSE + 15S QUIZ) */}
          <div className="border border-zinc-800 bg-zinc-950/60 p-5 space-y-4">
            <div className="border-b border-zinc-900 pb-2.5">
              <span className="text-[10px] font-mono-tech uppercase tracking-widest text-zinc-500">
                {tx(
                  lang,
                  'IN-APP TIME ESCALATION FOR FACEBOOK, YOUTUBE, INSTAGRAM & SOCIAL APPS',
                  'চলমান সোশ্যাল অ্যাপে (Facebook, YouTube, Instagram) সময়ের ক্রমবর্ধমান সতর্কতা',
                  'التنبيه المتدرج أثناء تشغيل فيسبوك ويوتيوب وإنستغرام',
                  'چلتی ہوئی سوشل ایپس (فیس بک، یوٹیوب، انسٹاگرام) پر وقت کی پابندی',
                  'BATAS WAKTU BERTAHAP SAAT MENJALANKAN FACEBOOK, YOUTUBE & INSTAGRAM'
                )}
              </span>
              <h3 className="text-sm font-mono-tech font-semibold text-zinc-100 mt-0.5">
                ⏱{' '}
                {tx(
                  lang,
                  '5m Minor → 10m Medium → 20m Full-Screen Auto-Close & 15s Quiz Lock',
                  '৫ মিনিটে মৃদু সতর্কতা → ১০ মিনিটে মাঝারি সতর্কতা → ২০ মিনিটে পূর্ণ-স্ক্রিন অটো-ক্লোজ ও কুইজ লক',
                  'تنبيه ٥ دقائق ← ١٠ دقائق ← إغلاق كامل بعد ٢٠ دقيقة مع اختبار',
                  '٥ منٹ ہلکی تنبیہ ← ١٠ منٹ درمیانی الرٹ ← ٢٠ منٹ پر مکمل بندش اور کوئز لاک',
                  '5m Peringatan Ringan → 10m Sedang → 20m Tutup Otomatis & Kunci Kuis'
                )}
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                {tx(
                  lang,
                  'While running distracting apps (Facebook, YouTube, Instagram, TikTok, X, Reddit), Minimum Phone enforces progressive on-screen restrictions:',
                  'আসক্তিকর অ্যাপ (Facebook, YouTube, Instagram, TikTok ইত্যাদি) চালানোর সময় Minimum Phone স্ক্রিনে ৩ ধাপে সতর্কতা ও স্বয়ংক্রিয় নিয়ন্ত্রণ প্রয়োগ করে:',
                  'أثناء استخدام التطبيقات المشتتة، يطبق الهاتف ٣ مراحل من التنبيه والإغلاق التلقائي:',
                  'سوشل ایپس چلاتے وقت یہ ایپ ٣ مراحل میں اسکرین پر تنبیہ اور خودکار بندش نافذ کرتی ہے:',
                  'Saat menjalankan aplikasi sosial/video, Minimum Phone menerapkan 3 tahap pembatasan:'
                )}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs font-mono-tech">
              <div className="border border-zinc-800 bg-black p-3 space-y-1">
                <div className="text-zinc-200 font-semibold">
                  {tx(
                    lang,
                    '1. At 5 Minutes (Minor)',
                    '১. ৫ মিনিটে (মৃদু সতর্কতা)',
                    '١. عند ٥ دقائق (تنبيه خفيف)',
                    '١. ٥ منٹ پر (ہلکی یاد دہانی)',
                    '1. Pada 5 Menit (Ringan)'
                  )}
                </div>
                <p className="text-[11px] text-zinc-400">
                  {tx(
                    lang,
                    'Subtle on-screen & system notification reminding you to stay aligned with your intention.',
                    'স্ক্রিনের ওপরে মৃদু রিমাইন্ডার দেখায় যাতে আপনি অকারণ স্ক্রলিংয়ে হারিয়ে না যান।',
                    'إشعار هادئ على الشاشة يذكرك بهدفك من فتح التطبيق.',
                    'اسکرین پر ہلکی یاد دہانی تاکہ آپ بے مقصد اسکرولنگ میں نہ کھو جائیں۔',
                    'Pengingat lembut di layar agar Anda tetap fokus pada tujuan awal.'
                  )}
                </p>
              </div>
              <div className="border border-zinc-700 bg-black p-3 space-y-1">
                <div className="text-zinc-100 font-semibold">
                  {tx(
                    lang,
                    '2. At 10 Minutes (Medium)',
                    '২. ১০ মিনিটে (মাঝারি সতর্কতা)',
                    '٢. عند ١٠ دقائق (تنبيه متوسط)',
                    '٢. ١٠ منٹ پر (درمیانی تنبیہ)',
                    '2. Pada 10 Menit (Sedang)'
                  )}
                </div>
                <p className="text-[11px] text-zinc-400">
                  {tx(
                    lang,
                    'Prominent medium alert banner & heads-up pulse warning that 20m auto-close is approaching.',
                    'স্পষ্ট মাঝারি সতর্কবার্তা দেয় যে ২০ মিনিটে অ্যাপটি স্বয়ংক্রিয়ভাবে বন্ধ হতে চলেছে।',
                    'تنبيه واضح يحذرك بأن الإغلاق التلقائي بعد ٢٠ دقيقة يقترب.',
                    'واضح الرٹ کہ ٢٠ منٹ پر ایپ خودکار طور پر بند ہونے والی ہے۔',
                    'Peringatan jelas bahwa penutupan otomatis 20 menit semakin dekat.'
                  )}
                </p>
              </div>
              <div className="border border-zinc-300 bg-black p-3 space-y-1">
                <div className="text-white font-semibold">
                  {tx(
                    lang,
                    '3. At 20 Minutes (Full-Screen)',
                    '৩. ২০ মিনিটে (পূর্ণ-স্ক্রিন অটো-ক্লোজ)',
                    '٣. عند ٢٠ دقيقة (إغلاق كامل)',
                    '٣. ٢٠ منٹ پر (فل اسکرین آٹو کلوز)',
                    '3. Pada 20 Menit (Layar Penuh)'
                  )}
                </div>
                <p className="text-[11px] text-zinc-300">
                  {tx(
                    lang,
                    'Full-screen takeover automatically closes the app and requires a 15-second reading + quiz to reopen.',
                    'পূর্ণ-স্ক্রিন টেকওভার অ্যাপটি বন্ধ করে দেয় এবং পুনরায় খুলতে ১৫ সেকেন্ডের পাঠ ও কুইজ বাধ্যতামূলক করে।',
                    'شاشة كاملة تغلق التطبيق تلقائياً وتتطلب قراءة ١٥ ثانية واختباراً لإعادة الفتح.',
                    'فل اسکرین ٹیک اوور ایپ کو بند کر دیتا ہے اور دوبارہ کھولنے کے لیے ١٥ سیکنڈ مطالعہ و کوئز لازمی ہے۔',
                    'Layar penuh menutup aplikasi secara otomatis & mewajibkan baca 15d + kuis untuk membuka lagi.'
                  )}
                </p>
              </div>
            </div>

            {onTriggerEscalationDemo && (
              <div className="space-y-2 pt-1">
                <div className="text-[10px] font-mono-tech uppercase text-zinc-400">
                  {tx(
                    lang,
                    'TEST LIVE ESCALATION SCREENS NOW (SIMULATE RUNNING YOUTUBE / FACEBOOK / INSTAGRAM):',
                    'এখনই ৫মি / ১০মি / ২০ মিনিটের সতর্কতা স্ক্রিনগুলো সরাসরি পরীক্ষা করুন:',
                    'اختبر شاشات التنبيه المتدرج الآن (محاكاة يوتيوب / فيسبوك / إنستغرام):',
                    'ابھی ٥ / ١٠ / ٢٠ منٹ کی تنبیہی اسکرینز کا لائیو ٹیسٹ کریں:',
                    'UJI LAYAR PERINGATAN BERTAHAP SEKARANG (SIMULASI YOUTUBE / FACEBOOK):'
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => onTriggerEscalationDemo('5m', 'Instagram')}
                    className="py-2.5 px-3 border border-zinc-700 text-xs font-mono-tech text-zinc-200 hover:bg-zinc-900 cursor-pointer"
                  >
                    ⏱{' '}
                    {tx(
                      lang,
                      'Test 5m Minor Notice',
                      '৫ মিনিটের মৃদু সতর্কতা দেখুন',
                      'اختبار تنبيه ٥ دقائق',
                      '٥ منٹ کی ہلکی تنبیہ دیکھیں',
                      'Uji Peringatan 5 Menit'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => onTriggerEscalationDemo('10m', 'YouTube')}
                    className="py-2.5 px-3 border border-zinc-500 text-xs font-mono-tech text-zinc-100 hover:bg-zinc-900 cursor-pointer"
                  >
                    ⚠{' '}
                    {tx(
                      lang,
                      'Test 10m Medium Alert',
                      '১০ মিনিটের মাঝারি সতর্কতা দেখুন',
                      'اختبار تنبيه ١٠ دقائق',
                      '١٠ منٹ کا درمیانی الرٹ دیکھیں',
                      'Uji Peringatan 10 Menit'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => onTriggerEscalationDemo('20m', 'Facebook')}
                    className="py-2.5 px-3 bg-zinc-100 text-black text-xs font-mono-tech font-semibold cursor-pointer"
                  >
                    🛑{' '}
                    {tx(
                      lang,
                      'Test 20m Full-Screen Close + Quiz',
                      '২০ মিনিটের অটো-ক্লোজ + কুইজ দেখুন',
                      'اختبار إغلاق ٢٠ دقيقة + اختبار',
                      '٢٠ منٹ آٹو کلوز + کوئز دیکھیں',
                      'Uji Tutup Otomatis 20m + Kuis'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 5D. SETTINGS PAGE 15S QUIZ GATE, QR COMPLEXITY & NIGHT BROWSER QR LOCK */}
          <div className="border border-zinc-800 bg-zinc-950/60 p-5 space-y-4">
            <div className="border-b border-zinc-900 pb-2.5">
              <span className="text-[10px] font-mono-tech uppercase tracking-widest text-zinc-500">
                {tx(
                  lang,
                  'ANTI-BYPASS GATES // SETTINGS, QR COMPLEXITY & NOTIFICATIONS',
                  'বাইপাস প্রতিরোধক গেট // সেটিংস লক, QR কাঠিন্য ও নোটিফিকেশন গার্ড',
                  'بوابات منع التجاوز // قفل الإعدادات وصعوبة QR والإشعارات',
                  'بائی پاس روک تھام // سیٹنگز لاک، QR سختی اور نوٹیفکیشن گارڈ',
                  'GERBANG ANTI-BYPASS // KUNCI PENGATURAN, QR & NOTIFIKASI'
                )}
              </span>
              <h3 className="text-sm font-mono-tech font-semibold text-zinc-100 mt-0.5">
                🔐{' '}
                {tx(
                  lang,
                  'Settings Quiz Gate, QR Complexity & Night Browser Lock',
                  'সেটিংস কুইজ লক, QR স্ক্যানার কাঠিন্য ও রাতের ব্রাউজার লক',
                  'بوابة اختبار الإعدادات وصعوبة QR وقفل المتصفح الليلي',
                  'سیٹنگز کوئز گیٹ، QR کی سختی اور رات کا براؤزر لاک',
                  'Kuis Pengaturan, Tingkat QR & Kunci Browser Malam'
                )}
              </h3>
            </div>

            {/* Settings Page 15s Read & Quiz Restriction */}
            <div className="flex items-center justify-between py-2 border-b border-zinc-900">
              <div className="pr-3">
                <div className="text-xs font-semibold text-zinc-100">
                  {tx(
                    lang,
                    'Require Quick Read & Quiz to Open Settings Page',
                    'সেটিংস পেজ খুলতে সংক্ষিপ্ত পাঠ ও কুইজ বাধ্যতামূলক করুন',
                    'طلب قراءة سريعة واختبار لفتح صفحة الإعدادات',
                    'سیٹنگز پیج کھولنے کے لیے مختصر مطالعہ اور کوئز لازمی کریں',
                    'Wajibkan Baca & Kuis Cepat untuk Membuka Halaman Pengaturan'
                  )}
                </div>
                <div className="text-[11px] text-zinc-400 font-mono-tech mt-0.5">
                  {tx(
                    lang,
                    'Prevents impulsively opening Settings to weaken your restrictions',
                    'হঠাৎ তাড়নার বশে সেটিংসে ঢুকে নিয়ম শিথিল করা থেকে আপনাকে রক্ষা করে',
                    'يمنع فتح الإعدادات باندفاع لإضعاف قيود الحماية الخاصة بك',
                    'وقتی خواہش میں آ کر سیٹنگز کھولنے اور پابندیاں کمزور کرنے سے روکتا ہے',
                    'Mencegah membuka Pengaturan secara impulsif untuk melemahkan batasan'
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  onUpdateVault((prev) => ({
                    ...prev,
                    settingsGateEnabled: !(prev.settingsGateEnabled ?? true),
                  }))
                }
                className={`px-3 py-1.5 border text-xs font-mono-tech cursor-pointer ${
                  vault.settingsGateEnabled ?? true
                    ? 'border-zinc-100 bg-zinc-100 text-black font-semibold'
                    : 'border-zinc-700 text-zinc-400'
                }`}
              >
                {vault.settingsGateEnabled ?? true
                  ? tx(lang, 'QUIZ ON', 'কুইজ চালু', 'مفعل', 'کوئز آن', 'KUIS ON')
                  : tx(lang, 'OFF', 'বন্ধ', 'متوقف', 'آف', 'OFF')}
              </button>
            </div>

            {/* Notification App-Open Control */}
            <div className="flex items-center justify-between py-2 border-b border-zinc-900">
              <div className="pr-3">
                <div className="text-xs font-semibold text-zinc-100">
                  {tx(
                    lang,
                    'Control Opening Apps from Notifications',
                    'নোটিফিকেশন থেকে সরাসরি অ্যাপ খোলা নিয়ন্ত্রণ করুন',
                    'التحكم في فتح التطبيقات من الإشعارات',
                    'نوٹیفکیشنز سے ایپس کھلنے کو کنٹرول کریں',
                    'Kontrol Membuka Aplikasi dari Notifikasi'
                  )}
                </div>
                <div className="text-[11px] text-zinc-400 font-mono-tech mt-0.5">
                  {tx(
                    lang,
                    'Blocks notifications from directly launching social/restricted apps without passing the quiz gate',
                    'কুইজ গেট পাস করা ছাড়া নোটিফিকেশন ট্যাপ করে সরাসরি সোশ্যাল অ্যাপ খোলা আটকে দেয়',
                    'يمنع الإشعارات من فتح التطبيقات المشتتة مباشرة دون اجتياز بوابة الاختبار',
                    'کوئز پاس کیے بغیر نوٹیفکیشن سے براہِ راست سوشل ایپ کھلنے کو روکتا ہے',
                    'Mencegah notifikasi membuka aplikasi terbatas tanpa melewati kuis'
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  onUpdateVault((prev) => ({
                    ...prev,
                    blockNotificationAppLaunch: !(prev.blockNotificationAppLaunch ?? true),
                  }))
                }
                className={`px-3 py-1.5 border text-xs font-mono-tech cursor-pointer ${
                  vault.blockNotificationAppLaunch ?? true
                    ? 'border-zinc-100 bg-zinc-100 text-black font-semibold'
                    : 'border-zinc-700 text-zinc-400'
                }`}
              >
                {vault.blockNotificationAppLaunch ?? true
                  ? tx(lang, 'CONTROLLED', 'নিয়ন্ত্রিত', 'محكوم', 'کنٹرولڈ', 'DIKONTROL')
                  : tx(lang, 'OFF', 'বন্ধ', 'متوقف', 'آف', 'OFF')}
              </button>
            </div>

            {/* Night Browser & Social Media Emergency QR Lock */}
            <div className="flex items-center justify-between gap-2 py-2 border-b border-zinc-900">
              <div className="min-w-0 flex-1 pr-2">
                <div className="text-xs font-semibold text-zinc-100">
                  🌙{' '}
                  {tx(
                    lang,
                    'Mandatory Emergency QR Scan at Night (Browser & Social Apps)',
                    'রাতে ব্রাউজার ও সোশ্যাল মিডিয়ার জন্য জরুরি ফিজিক্যাল QR কোড স্ক্যান বাধ্যতামূলক',
                    'مسح رمز QR للطوارئ إلزامي ليلاً (للمتصفح والتواصل)',
                    'رات کو براؤزر اور سوشل ایپس کے لیے ایمرجنسی QR اسکین لازمی',
                    'Wajib Pindai QR Darurat di Malam Hari (Browser & Sosial)'
                  )}
                </div>
                <div className="text-[11px] text-zinc-400 font-mono-tech mt-0.5">
                  {tx(
                    lang,
                    'During sleeping hours (10 PM – 6 AM), Browsers & Social Media require scanning your physical Emergency QR code',
                    'ঘুমানোর সময়ে (রাত ১০টা – ভোর ৬টা) ব্রাউজার বা সোশ্যাল মিডিয়া খুলতে অন্য ঘরে রাখা ফিজিক্যাল QR কোড স্ক্যান করা বাধ্যতামূলক',
                    'خلال ساعات النوم (١٠ مساءً – ٦ صباحاً)، يتطلب فتح المتصفح والتواصل مسح رمز QR الفعلي',
                    'سونے کے اوقات (رات ١٠ سے صبح ٦) میں براؤزر اور سوشل ایپس کھولنے کے لیے فزیکل QR اسکین لازمی ہے',
                    'Selama jam tidur (22:00 – 06:00), Browser & Media Sosial wajib memindai kode QR fisik'
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  onUpdateVault((prev) => ({
                    ...prev,
                    nightBrowserQrRequired: !(prev.nightBrowserQrRequired ?? true),
                  }))
                }
                className={`px-3 py-1.5 border text-xs font-mono-tech cursor-pointer shrink-0 ${
                  vault.nightBrowserQrRequired ?? true
                    ? 'border-zinc-100 bg-zinc-100 text-black font-semibold'
                    : 'border-zinc-700 text-zinc-400'
                }`}
              >
                {vault.nightBrowserQrRequired ?? true
                  ? tx(lang, 'QR REQUIRED', 'QR বাধ্যতামূলক', 'QR إلزامي', 'QR لازمی', 'WAJIB QR')
                  : tx(lang, 'OFF', 'বন্ধ', 'متوقف', 'آف', 'OFF')}
              </button>
            </div>

            {/* QR Code Complexity Selector */}
            <div className="space-y-2 pt-1">
              <div className="text-xs font-mono-tech text-zinc-300">
                {tx(
                  lang,
                  'QR Code Scanner Complexity Level (Easy / Medium / Hard):',
                  'QR কোড স্ক্যানারের কাঠিন্যের স্তর (সহজ / মাঝারি / কঠিন):',
                  'مستوى صعوبة ماسح رمز QR (سهل / متوسط / صعب):',
                  'QR کوڈ اسکینر کی سختی کا درجہ (آسان / درمیانہ / سخت):',
                  'Tingkat Kesulitan Pemindai QR (Mudah / Sedang / Sulit):'
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    {
                      id: 'easy',
                      label: tx(lang, 'EASY (Quick)', 'সহজ (Easy)', 'سهل', 'آسان (Easy)', 'MUDAH'),
                    },
                    {
                      id: 'medium',
                      label: tx(lang, 'MEDIUM (+6s)', 'মাঝারি (Medium)', 'متوسط', 'درمیانہ', 'SEDANG'),
                    },
                    {
                      id: 'hard',
                      label: tx(lang, 'HARD (Strict)', 'কঠিন (Hard)', 'صعب (صارم)', 'سخت (Hard)', 'SULIT'),
                    },
                  ] as const
                ).map((lvl) => (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() =>
                      onUpdateVault((prev) => ({
                        ...prev,
                        qrComplexity: lvl.id as QrComplexityLevel,
                      }))
                    }
                    className={`py-2 px-1.5 border text-[11px] font-mono-tech cursor-pointer ${
                      (vault.qrComplexity || 'hard') === lvl.id
                        ? 'border-zinc-100 bg-zinc-100 text-black font-semibold'
                        : 'border-zinc-800 text-zinc-400'
                    }`}
                  >
                    {lvl.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 6. DISPLAY, SYSTEM GRAYSCALE & DEFAULT HABIT-WALL */}
          <div className="border border-zinc-800 bg-zinc-950/60 p-4 sm:p-5 space-y-4">
            <div className="text-[10px] font-mono-tech uppercase tracking-widest text-zinc-500">
              {tx(
                lang,
                'ANTI-DOPAMINE VISUAL ENGINE',
                'ডোপামিন-মুক্ত ভিজ্যুয়াল ও মনোক্রোম ডিসপ্লে ইঞ্জিন',
                'محرك العرض الخالي من الدوبامين',
                'ڈوپامائن فری ویژول اور گرے اسکیل انجن',
                'MESIN VISUAL ANTI-DOPAMIN'
              )}
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1 pr-2">
                <div className="text-xs font-medium text-zinc-200">{t.grayscaleToggleLabel}</div>
                <div className="text-[11px] font-mono-tech text-zinc-500">
                  {tx(
                    lang,
                    'Removes flashy red notification badges & hyper-stimulating colors across the screen',
                    'স্ক্রিনের উজ্জ্বল রঙের আকর্ষণ কমিয়ে চোখ ও মস্তিষ্ককে শান্ত মনোক্রোম মোডে রাখে',
                    'يزيل الألوان الصاخبة لتهدئة العين والدماغ',
                    'اسکرین کے شوخ رنگ ختم کر کے آنکھوں اور دماغ کو پرسکون رکھتا ہے',
                    'Menghilangkan warna mencolok untuk menenangkan mata & pikiran'
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={onToggleGrayscale}
                className={`px-3 py-1.5 border text-xs font-mono-tech cursor-pointer shrink-0 ${
                  grayscaleEnabled
                    ? 'border-zinc-100 bg-zinc-100 text-black font-semibold'
                    : 'border-zinc-800 text-zinc-400'
                }`}
              >
                {grayscaleEnabled
                  ? tx(lang, 'GRAYSCALE ON', 'সাদাকালো চালু', 'مفعل', 'گرے اسکیل آن', 'AKTIF')
                  : tx(lang, 'OFF', 'বন্ধ', 'متوقف', 'آف', 'OFF')}
              </button>
            </div>

            <div>
              <div className="text-xs font-mono-tech text-zinc-400 mb-2">
                {tx(
                  lang,
                  'Universal Platform & Device Engine (Android · iOS · Web / Any Device):',
                  'ডিভাইস ও প্ল্যাটফর্ম মোড (Android · iOS · Web):',
                  'منصة التشغيل والجهاز (Android · iOS · Web):',
                  'ڈیوائس اور پلیٹ فارم موڈ (Android · iOS · Web):',
                  'Platform & Perangkat (Android · iOS · Web):'
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: 'android', label: '🤖 Android' },
                    { id: 'ios', label: '🍎 iOS / iPad' },
                    { id: 'web', label: '🌐 Web / Desktop' },
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
                {tx(
                  lang,
                  'Monochrome Surface Palette:',
                  'মনোক্রোম স্ক্রিন থিম নির্বাচন করুন:',
                  'سمة الشاشة الأحادية:',
                  'مونوکروم اسکرین تھیم منتخب کریں:',
                  'Tema Layar Monokrom:'
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    {
                      id: 'oled-black',
                      label: tx(lang, 'OLED Pure Black', 'OLED পিউর ব্ল্যাক', 'أسود OLED نقي', 'OLED پیور بلیک', 'Hitam OLED'),
                    },
                    {
                      id: 'eink-paper',
                      label: tx(lang, 'E-Ink Paper', 'ই-ইংক পেপার', 'ورق إلكتروني', 'ای-انک پیپر', 'Kertas E-Ink'),
                    },
                    {
                      id: 'sunset-amber',
                      label: tx(lang, 'Sunset Amber', 'সানসেট অ্যাম্বার (ঘুম-বান্ধব)', 'كهرماني الغروب', 'سن سیٹ امبر', 'Amber Senja'),
                    },
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
                {tx(
                  lang,
                  'Default App Unlock Gatekeeper Mode:',
                  'নিয়ন্ত্রিত অ্যাপ খোলার ডিফল্ট গেটকিপার মোড:',
                  'وضع بوابة فتح التطبيقات الافتراضي:',
                  'مقید ایپس کھولنے کا ڈیفالٹ گیٹ کیپر موڈ:',
                  'Mode Gerbang Pembuka Aplikasi Default:'
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(
                  [
                    {
                      id: 'read-30s-quiz',
                      label: tx(
                        lang,
                        '⭐ Read Short Text + Play 20s Quiz (Recommended)',
                        '⭐ সংক্ষিপ্ত পাঠ ও ২০ সেকেন্ড কুইজ (প্রস্তাবিত)',
                        '⭐ قراءة سريعة + اختبار ٢٠ ثانية (موصى به)',
                        '⭐ مختصر مطالعہ + ٢٠ سیکنڈ کوئز (تجویز کردہ)',
                        '⭐ Baca Singkat + Kuis 20d (Direkomendasikan)'
                      ),
                    },
                    {
                      id: 'calm-transcribe',
                      label: tx(
                        lang,
                        'Transcribe Verse / Proverb',
                        'কুরআনের আয়াত বা প্রজ্ঞাময় বাণী টাইপ করুন',
                        'كتابة آية أو حكمة',
                        'آیت یا حکمت کا جملہ ٹائپ کریں',
                        'Ketik Ulang Ayat / Kata Hikmah'
                      ),
                    },
                    {
                      id: 'journal-50',
                      label: tx(
                        lang,
                        'Mindful Journal Entry',
                        'সচেতন ডায়েরি বা উদ্দেশ্য লিখন',
                        'تدوين هدف واعٍ',
                        'شعوری مقصد تحریر کریں',
                        'Catatan Jurnal Sadar'
                      ),
                    },
                    {
                      id: 'read-pages',
                      label: tx(
                        lang,
                        'Read 3 Pages (PDF/Reader)',
                        'বইয়ের ৩ পৃষ্ঠা পাঠ করুন',
                        'قراءة ٣ صفحات من كتاب',
                        'کتاب کے ٣ صفحات پڑھیں',
                        'Baca 3 Halaman Buku'
                      ),
                    },
                    {
                      id: 'steps-20',
                      label: tx(
                        lang,
                        'Walk 20 Hardware Steps',
                        '২০ কদম হাঁটুন (স্টেপ সেন্সর)',
                        'المشي ٢٠ خطوة فعلية',
                        '٢٠ قدم چلیں (اسٹیپ سینسر)',
                        'Jalan 20 Langkah Fisik'
                      ),
                    },
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
                  {tx(
                    lang,
                    'CRAVING-PROOF LOCK // ACCOUNTABILITY GUARD',
                    'তাড়না-প্রতিরোধী লক // আনইনস্টল সুরক্ষা গার্ড',
                    'قفل ضد الاندفاع // حماية عدم الحذف',
                    'خواہش کے خلاف لاک // ان انسٹالیشن سے تحفظ',
                    'KUNCI ANTI-IMPULS // PELINDUNG UNINSTALL'
                  )}
                </span>
                <h3 className="text-sm font-mono-tech font-semibold text-zinc-100">
                  {tx(
                    lang,
                    'Uninstall & Strict Mode Protection',
                    'আনইনস্টল ও কঠোর মোড সুরক্ষা',
                    'حماية عدم الحذف والوضع الصارم',
                    'ان انسٹال اور سخت موڈ کی حفاظت',
                    'Perlindungan Uninstall & Mode Ketat'
                  )}
                </h3>
              </div>
              <span
                className={`px-2 py-0.5 text-[10px] font-mono-tech ${
                  vault.uninstallProtectionEnabled
                    ? 'bg-zinc-100 text-black font-semibold'
                    : 'border border-zinc-800 text-zinc-500'
                }`}
              >
                {vault.uninstallProtectionEnabled
                  ? tx(lang, 'LOCKED', 'লকড', 'مقفل', 'لاکڈ', 'TERKUNCI')
                  : tx(lang, 'OFF', 'বন্ধ', 'متوقف', 'آف', 'OFF')}
              </span>
            </div>

            <p className="text-xs text-zinc-400">
              {tx(
                lang,
                'Prevents deleting Minimum Phone or turning off strict blocks during a moment of weakness. Deactivating requires a 24-hour cooling-off timer or an Offline Accountability Friend Passcode.',
                'দুর্বল মুহূর্তে Minimum Phone ডিলিট করা বা কঠোর ব্লক বন্ধ করা প্রতিরোধ করে। এটি বন্ধ করতে ২৪ ঘণ্টার কুলিং-অফ টাইমার অথবা বিশ্বস্ত বন্ধুর ৬-সংখ্যার পাসকোড প্রয়োজন।',
                'يمنع حذف التطبيق أو إيقاف الحماية في لحظة ضعف. يتطلب الإلغاء الانتظار ٢٤ ساعة أو رمز صديق المراقبة.',
                'کمزوری کے لمحے میں ایپ ڈیلیٹ کرنے یا سخت لاک بند کرنے سے روکتا ہے۔ اسے بند کرنے کے لیے ٢٤ گھنٹے کا انتظار یا دوست کا پاس کوڈ درکار ہے۔',
                'Mencegah menghapus aplikasi saat dorongan muncul. Menonaktifkan butuh timer 24 jam atau kode teman.'
              )}
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
                🛡️{' '}
                {tx(
                  lang,
                  'Enable Craving-Proof Uninstall Protection',
                  'আনইনস্টল সুরক্ষা চালু করুন',
                  'تفعيل حماية عدم الحذف',
                  'ان انسٹال پروٹیکشن فعال کریں',
                  'Aktifkan Perlindungan Uninstall'
                )}
              </button>
            ) : (
              <div className="border border-zinc-700 bg-black p-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono-tech text-zinc-200">
                  <span>
                    🛡️{' '}
                    {tx(
                      lang,
                      'STRICT UNINSTALL GUARD ACTIVE',
                      'কঠোর আনইনস্টল গার্ড সক্রিয় আছে',
                      'حارس عدم الحذف الصارم نشط',
                      'سخت ان انسٹال گارڈ فعال ہے',
                      'PENJAGA UNINSTALL KETAT AKTIF'
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowFriendHelper((v) => !v)}
                    className="underline text-zinc-400 hover:text-white cursor-pointer"
                  >
                    {showFriendHelper
                      ? tx(lang, 'Hide Friend Code', 'বন্ধুর কোড লুকান', 'إخفاء رمز الصديق', 'فرینڈ کوڈ چھپائیں', 'Sembunyikan Kode')
                      : tx(lang, 'Friend Code Generator', 'বন্ধুর আনলক কোড দেখুন', 'مولد رمز الصديق', 'فرینڈ کوڈ جنریٹر', 'Kode Teman')}
                  </button>
                </div>

                {showFriendHelper && (
                  <div className="p-3 border border-zinc-800 bg-zinc-950 text-xs font-mono-tech text-zinc-300 space-y-1">
                    <div>
                      {tx(lang, 'Accountability Shared Key', 'শেয়ারড কী', 'المفتاح المشترك', 'شیئرڈ کی', 'Kunci Bersama')}:{' '}
                      <strong>{vault.friendAccountabilitySecret}</strong>
                    </div>
                    <div>
                      {tx(lang, 'Today’s Offline Friend Unlock Code', 'আজকের আনলক কোড', 'رمز الفتح اليوم', 'آج کا ان لاک کوڈ', 'Kode Buka Hari Ini')}:{' '}
                      <strong>{expectedFriendCode}</strong>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={friendCodeInput}
                    onChange={(e) => setFriendCodeInput(e.target.value)}
                    placeholder={tx(
                      lang,
                      'Enter 6-digit Friend Passcode...',
                      '৬-সংখ্যার বন্ধুর পাসকোড লিখুন...',
                      'أدخل رمز الصديق المكون من ٦ أرقام...',
                      '٦ ہندسوں کا فرینڈ پاس کوڈ درج کریں...',
                      'Masukkan 6 digit kode teman...'
                    )}
                    className="flex-1 bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs font-mono-tech text-zinc-100"
                  />
                  <button
                    type="button"
                    onClick={handleUnlockStrictProtection}
                    className="px-3 py-2 bg-zinc-100 text-black text-xs font-mono-tech font-semibold cursor-pointer"
                  >
                    {tx(lang, 'Unlock', 'আনলক', 'فتح', 'ان لاک', 'Buka')}
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
                    ⏳{' '}
                    {tx(
                      lang,
                      'Or Start 24-Hour Cooling-Off Countdown',
                      'অথবা ২৪ ঘণ্টার কুলিং-অফ কাউন্টডাউন শুরু করুন',
                      'أو ابدأ العد التنازلي لمدة ٢٤ ساعة',
                      'یا ٢٤ گھنٹے کا کولنگ آف ٹائمر شروع کریں',
                      'Atau Mulai Hitung Mundur 24 Jam'
                    )}
                  </button>
                ) : (
                  <div className="text-center py-2 border border-zinc-900 text-xs font-mono-tech text-zinc-400">
                    ⏳{' '}
                    {tx(
                      lang,
                      '24-Hour Cooling-Off Timer Running (23h 59m remaining)',
                      '২৪ ঘণ্টার কুলিং-অফ টাইমার চলছে (২৩ ঘণ্টা ৫৯ মিনিট বাকি)',
                      'مؤقت الانتظار لمدة ٢٤ ساعة قيد التشغيل',
                      '٢٤ گھنٹے کا کولنگ آف ٹائمر چل رہا ہے',
                      'Timer Tunggu 24 Jam Sedang Berjalan'
                    )}
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
                  {tx(
                    lang,
                    '100% ON-DEVICE ANALYTICS // ZERO CLOUD TRACKING',
                    '১০০% অফলাইন পরিসংখ্যান // কোনো ক্লাউড ট্র্যাকিং নেই',
                    'إحصائيات محلية ١٠٠٪ // بدون تتبع سحابي',
                    '١٠٠٪ آف لائن اعداد و شمار // کوئی کلاؤڈ ٹریکنگ نہیں',
                    'ANALITIK 100% DI PERANGKAT // TANPA PELACAKAN'
                  )}
                </span>
                <h3 className="text-sm font-mono-tech font-semibold text-zinc-100">
                  {tx(
                    lang,
                    'Screen Time & Reclaimed Life Receipt',
                    'স্ক্রিন টাইম ও ফিরে পাওয়া সময়ের রিসিট কার্ড',
                    'وقت الشاشة وإيصال الوقت المستعاد',
                    'اسکرین ٹائم اور بچائے گئے وقت کی رسید',
                    'Waktu Layar & Struk Waktu yang Diselamatkan'
                  )}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowReceiptModal(true)}
                className="px-3 py-1.5 bg-zinc-100 text-black text-xs font-mono-tech font-semibold cursor-pointer"
              >
                🧾{' '}
                {tx(
                  lang,
                  'View Shareable Receipt',
                  'শেয়ারযোগ্য রিসিট দেখুন',
                  'عرض الإيصال',
                  'رسید دیکھیں',
                  'Lihat Struk'
                )}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="border border-zinc-900 bg-black p-3">
                <div className="text-xl font-mono-tech text-zinc-100">{impulsesStopped}</div>
                <div className="text-[10px] font-mono-tech text-zinc-500 mt-1">
                  {tx(lang, 'IMPULSES STOPPED', 'প্রতিহত তাড়না', 'نزوات موقوفة', 'روکی گئی خواہشات', 'DORONGAN DIHENTIKAN')}
                </div>
              </div>
              <div className="border border-zinc-900 bg-black p-3">
                <div className="text-xl font-mono-tech text-zinc-100">{hoursReclaimed}h</div>
                <div className="text-[10px] font-mono-tech text-zinc-500 mt-1">
                  {tx(lang, 'HOURS RECLAIMED', 'বাঁচানো ঘণ্টা', 'ساعات مستعادة', 'بچائے گئے گھنٹے', 'JAM DIHEMAT')}
                </div>
              </div>
              <div className="border border-zinc-900 bg-black p-3">
                <div className="text-xl font-mono-tech text-zinc-100">{totalScreenMinutes}m</div>
                <div className="text-[10px] font-mono-tech text-zinc-500 mt-1">
                  {tx(lang, 'TODAY SCREEN TIME', 'আজকের স্ক্রিন টাইম', 'شاشة اليوم', 'آج کا اسکرین ٹائم', 'LAYAR HARI INI')}
                </div>
              </div>
            </div>
          </div>

          {/* 9. PLAY STORE (ANDROID) & APP STORE (iOS) NATIVE BRIDGE INSPECTOR */}
          <div className="border border-zinc-800 bg-zinc-950/60 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono-tech uppercase tracking-widest text-zinc-500">
                  {tx(
                    lang,
                    'DEFAULT HOME LAUNCHER & OS INTEGRATION',
                    'ডিফল্ট হোম লঞ্চার ও ওএস ইন্টিগ্রেশন',
                    'تعيين كمشغل الشاشة الرئيسية الافتراضي',
                    'ڈیفالٹ ہوم لانچر اور سسٹم انٹیگریشن',
                    'PELUNCUR LAYAR UTAMA DEFAULT'
                  )}
                </span>
                <h3 className="text-sm font-mono-tech font-semibold text-zinc-100">
                  {tx(
                    lang,
                    'Set Minimum Phone as Default Home Screen',
                    'Minimum Phone-কে ফোনের ডিফল্ট হোম স্ক্রিন হিসেবে সেট করুন',
                    'اجعل Minimum Phone الشاشة الرئيسية الافتراضية',
                    'Minimum Phone کو ڈیفالٹ ہوم اسکرین بنائیں',
                    'Jadikan Minimum Phone Layar Utama Default'
                  )}
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={handleActivateDefaultLauncher}
              className="w-full py-2.5 border border-zinc-700 text-xs font-mono-tech text-zinc-200 hover:bg-zinc-900 cursor-pointer"
            >
              ⚡{' '}
              {tx(
                lang,
                'Open Default Home App Picker',
                'ডিফল্ট হোম অ্যাপ নির্বাচন মেনু খুলুন',
                'فتح قائمة اختيار تطبيق الشاشة الرئيسية',
                'ڈیفالٹ ہوم ایپ مینو کھولیں',
                'Buka Pilihan Aplikasi Layar Utama Default'
              )}
            </button>
          </div>

          {/* 10. KASB LLC ECOSYSTEM */}
          <div className="border border-zinc-700 bg-black p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <div>
                <span className="text-[10px] font-mono-tech uppercase tracking-widest text-zinc-500">
                  {tx(
                    lang,
                    '100% FREE CONSUMER MOVEMENT // ZERO ADS',
                    '১০০% ফ্রি জনকল্যাণমূলক উদ্যোগ // ০% বিজ্ঞাপন',
                    'مبادرة مجانية ١٠٠٪ // بدون إعلانات',
                    '١٠٠٪ مفت عوامی تحریک // صفر اشتہارات',
                    'GERAKAN 100% GRATIS // NOL IKLAN'
                  )}
                </span>
                <h3 className="text-base font-mono-tech font-semibold text-zinc-100">
                  {tx(
                    lang,
                    'Brought to you by kasb LLC',
                    'kasb LLC-এর একটি জনকল্যাণমূলক নিবেদন',
                    'مقدم لكم من kasb LLC',
                    'کی طرف سے پیشکش kasb LLC',
                    'Dipersembahkan oleh kasb LLC'
                  )}
                </h3>
              </div>
              <span className="px-2 py-0.5 border border-zinc-600 text-[10px] font-mono-tech text-zinc-300">
                KASB LLC
              </span>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              {tx(
                lang,
                'We made 100% of Minimum Phone’s premium digital detox, Calm Mind (Quran/Hadith/Proverbs), Slow Learning 20s Quiz Gate, and Purity features completely free with zero ads and zero cloud telemetry to help millions reclaim their attention and inner peace.',
                'লাখো মানুষের মনোযোগ, সময় ও আত্মিক প্রশান্তি ফিরিয়ে দিতে আমরা Minimum Phone-এর সকল প্রিমিয়াম ডিজিটাল ডিটক্স, কুরআন/হাদীস/প্রজ্ঞা রিমাইন্ডার, ২০ সেকেন্ডের শিক্ষা কুইজ এবং পবিত্রতা শিল্ড আজীবনের জন্য ১০০% ফ্রি এবং সম্পূর্ণ বিজ্ঞাপনমুক্ত করেছি।',
                'جعلنا جميع ميزات Minimum Phone مجانية ١٠٠٪ وبدون أي إعلانات أو تتبع لمساعدة الملايين على استعادة تركيزهم وسكينتهم.',
                'لاکھوں لوگوں کی توجہ، وقت اور قلبی سکون کی بحالی کے لیے ہم نے Minimum Phone کے تمام فیچرز کو ہمیشہ کے لیے ١٠٠٪ مفت اور اشتہارات سے پاک بنایا ہے۔',
                'Kami membuat 100% fitur Minimum Phone gratis tanpa iklan untuk membantu jutaan orang mendapatkan kembali fokus dan ketenangan batin.'
              )}
            </p>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 1: COMPLETE "HOW TO USE" DOCUMENTATION IN ALL 5 LANGUAGES
         ===================================================================== */}
      {showHowToGuideModal && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="max-w-lg w-full border border-zinc-700 bg-zinc-950 p-5 sm:p-6 space-y-5 my-auto max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-zinc-800 pb-3">
              <div>
                <span className="text-[10px] font-mono-tech uppercase tracking-widest text-zinc-400">
                  {tx(
                    lang,
                    'OFFICIAL DOCUMENTATION // MULTILINGUAL MANUAL',
                    'অফিশিয়াল ব্যবহার নির্দেশিকা // বহুভাষিক ম্যানুয়াল',
                    'الدليل الرسمي // شرح كامل بلغتك',
                    'آفیشل گائیڈ // مکمل رہنمائی آپ کی زبان میں',
                    'PANDUAN RESMI // MANUAL MULTIBAHASA'
                  )}
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
                      {tx(lang, 'STEP', 'ধাপ', 'خطوة', 'مرحلہ', 'LANGKAH')} {sec.stepNumber}
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
              ✓ {tx(lang, 'Close Guide', 'নির্দেশিকা বন্ধ করুন', 'إغلاق الدليل', 'گائیڈ بند کریں', 'Tutup Panduan')}
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 2: COMPACT 20-SEC SLOW LEARNING & QUIZ PRACTICE MODAL
         ===================================================================== */}
      {practiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-3 overflow-y-auto">
          <div className="max-w-md w-full border border-zinc-700 bg-zinc-950 p-4 space-y-3 my-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <span className="text-[10px] font-mono-tech uppercase tracking-widest text-zinc-400">
                {tx(
                  lang,
                  `20-SEC QUICK QUIZ // ${Math.min(15, slowLearning.readingDurationSeconds || 12)}S READ`,
                  `২০ সেকেন্ডের কুইজ অনুশীলন // ${Math.min(15, slowLearning.readingDurationSeconds || 12)} সেকেন্ড পাঠ`,
                  `اختبار ٢٠ ثانية السريع // قراءة ${Math.min(15, slowLearning.readingDurationSeconds || 12)}ث`,
                  `٢٠ سیکنڈ کوئز مشق // ${Math.min(15, slowLearning.readingDurationSeconds || 12)} سیکنڈ مطالعہ`,
                  `KUIS CEPAT 20 DETIK // BACA ${Math.min(15, slowLearning.readingDurationSeconds || 12)}D`
                )}
              </span>
              <button
                type="button"
                onClick={() => setPracticeModalOpen(false)}
                className="text-xs font-mono-tech text-zinc-400 hover:text-white cursor-pointer"
              >
                ✕ {tx(lang, 'Close', 'বন্ধ করুন', 'إغلاق', 'بند کریں', 'Tutup')}
              </button>
            </div>

            <div>
              <h4 className="text-xs font-mono-tech font-semibold text-zinc-100">
                {activePracticeLesson.title[lang]}
              </h4>
              {activePracticeLesson.arabicHeader && (
                <p
                  dir="rtl"
                  className="font-arabic text-sm text-zinc-200 mt-1.5 bg-black border border-zinc-900 px-2.5 py-1.5 leading-snug"
                >
                  {activePracticeLesson.arabicHeader}
                </p>
              )}
            </div>

            <div className="bg-black border border-zinc-800 p-2.5 text-xs text-zinc-200 leading-snug space-y-1.5">
              <p>{getShortLessonPassage(activePracticeLesson, lang)}</p>
              <div className="pt-1.5 border-t border-zinc-900 text-[11px] font-mono-tech text-zinc-300">
                ★ {activePracticeLesson.keyTakeaway[lang]}
              </div>
            </div>

            {/* Timer status */}
            <div className="flex items-center justify-between text-xs font-mono-tech">
              <span className="text-zinc-300">
                {practiceSecondsLeft > 0
                  ? tx(
                      lang,
                      `⏳ Read (${practiceSecondsLeft}s)...`,
                      `⏳ মনোযোগ দিয়ে পড়ুন (${practiceSecondsLeft} সেকেন্ড)...`,
                      `⏳ اقرأ (${practiceSecondsLeft}ث)...`,
                      `⏳ پڑھیں (${practiceSecondsLeft} سیکنڈ)...`,
                      `⏳ Baca (${practiceSecondsLeft}d)...`
                    )
                  : tx(
                      lang,
                      '✓ Quiz Ready — Tap Answer:',
                      '✓ কুইজ প্রস্তুত — সঠিক উত্তরে ট্যাপ করুন:',
                      '✓ الاختبار جاهز — اختر الإجابة:',
                      '✓ کوئز تیار ہے — جواب منتخب کریں:',
                      '✓ Kuis Siap — Pilih Jawaban:'
                    )}
              </span>
              <button
                type="button"
                onClick={() => {
                  onUpdateSlowLearning((prev) => ({
                    ...prev,
                    currentLessonIndex: prev.currentLessonIndex + 1,
                  }));
                  setPracticeSecondsLeft(Math.min(15, slowLearning.readingDurationSeconds || 12));
                  setPracticeSelectedOption(null);
                  setPracticePassed(false);
                  setPracticeErrorMsg(null);
                }}
                className="underline text-zinc-400 hover:text-white cursor-pointer"
              >
                {tx(lang, 'Next Lesson →', 'পরবর্তী পাঠ →', 'الدرس التالي ←', 'اگلا سبق →', 'Pelajaran Berikutnya →')}
              </button>
            </div>

            {/* Quiz */}
            <div
              className={`border p-2.5 space-y-1.5 ${
                practiceSecondsLeft > 0
                  ? 'border-zinc-900 bg-black/40 opacity-60'
                  : 'border-zinc-700 bg-black'
              }`}
            >
              <p className="text-xs font-medium text-zinc-100 leading-snug">
                Q: {activePracticeLesson.quizQuestion[lang]}
              </p>
              <div className="space-y-1.5">
                {activePracticeLesson.quizOptions[lang].map((opt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={practiceSecondsLeft > 0}
                    onClick={() => handleSelectPracticeQuizAnswer(idx)}
                    className={`w-full text-left px-2.5 py-2 border text-xs font-mono-tech leading-snug ${
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
              <div className="text-[10px]">
                {tx(
                  lang,
                  'RECLAIMED LIFE RECEIPT // KASB LLC',
                  'ফিরে পাওয়া সময়ের রিসিট // KASB LLC',
                  'إيصال الوقت المستعاد // KASB LLC',
                  'بچائے گئے وقت کی رسید // KASB LLC',
                  'STRUK WAKTU HEMAT // KASB LLC'
                )}
              </div>
              <div className="text-[10px] text-zinc-600 mt-0.5">
                {new Date().toLocaleDateString()}
              </div>
            </div>

            <div className="space-y-2 text-xs border-b-2 border-dashed border-black pb-3">
              <div className="flex justify-between">
                <span>
                  {tx(lang, 'IMPULSE OPENS STOPPED:', 'প্রতিহত তাড়না:', 'النزوات الموقوفة:', 'روکی گئی خواہشات:', 'DORONGAN DIHENTIKAN:')}
                </span>
                <strong>{impulsesStopped}</strong>
              </div>
              <div className="flex justify-between">
                <span>
                  {tx(lang, 'DEEP FOCUS RECLAIMED:', 'ফিরে পাওয়া সময়:', 'الوقت المستعاد:', 'بچایا گیا وقت:', 'WAKTU DIHEMAT:')}
                </span>
                <strong>{hoursReclaimed} HRS</strong>
              </div>
              <div className="flex justify-between">
                <span>
                  {tx(lang, 'CLARITY / PURITY STREAK:', 'পবিত্রতা স্ট্রিক:', 'أيام النقاء:', 'پاکیزگی اسٹریک:', 'HARI BERSIH:')}
                </span>
                <strong>{purityDays} DAYS</strong>
              </div>
              <div className="flex justify-between">
                <span>
                  {tx(lang, 'SLOW LEARNING XP:', 'শিক্ষা পয়েন্ট (XP):', 'نقاط التعلم:', 'تعلیمی پوائنٹس:', 'POIN BELAJAR:')}
                </span>
                <strong>{slowLearning.xp} XP</strong>
              </div>
              <div className="flex justify-between">
                <span>
                  {tx(lang, 'ADS / TRACKERS SERVED:', 'বিজ্ঞাপন / ট্র্যাকার:', 'الإعلانات:', 'اشتہارات / ٹریکرز:', 'IKLAN / PELACAK:')}
                </span>
                <strong>0</strong>
              </div>
            </div>

            <div className="text-center text-[11px] italic py-1">
              “
              {tx(
                lang,
                'A quiet mind is richer than a crown.',
                'প্রশান্ত মন রাজমুকুটের চেয়েও মূল্যবান।',
                'القلب الهادئ أغنى من التاج.',
                'پرسکون ذہن شاہی تاج سے زیادہ قیمتی ہے۔',
                'Pikiran yang tenang lebih berharga daripada mahkota.'
              )}
              ”
            </div>

            <div className="text-center text-[10px] border-t border-black pt-2">
              100% FREE · MINIMUMPHONE BY KASB LLC
            </div>

            <button
              type="button"
              onClick={() => setShowReceiptModal(false)}
              className="w-full py-2.5 bg-black text-white text-xs uppercase tracking-widest cursor-pointer"
            >
              {tx(lang, 'Close Receipt', 'রিসিট বন্ধ করুন', 'إغلاق الإيصال', 'رسید بند کریں', 'Tutup Struk')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

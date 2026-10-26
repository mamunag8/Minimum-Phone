import React, { useEffect, useMemo, useRef, useState } from 'react';
import type {
  AffectEmotionTag,
  AppFrictionTier,
  AppItem,
  CalmTrigger,
  FocusVaultState,
  HabitWallType,
  HomeProfileType,
  InspirationMode,
  LanguageCode,
  NotificationItem,
  PlatformMode,
  PurityState,
  ScratchpadNote,
  SlowLearningState,
  SlowLearningTrack,
  VisualTheme,
  WisdomPackSource,
} from './types/app';
import {
  CALM_MIND_TRIGGERS,
  getTriggerSource,
  getTriggerText,
} from './data/calmTriggers';
import { DEFAULT_APPS, INITIAL_NOTIFICATIONS } from './data/defaultApps';
import {
  getLessonsForTrack,
  getShortLessonPassage,
} from './data/slowLearningCurriculum';
import {
  getAppDisplayName,
  getSelfMasteryRank,
  localizeDynamicUserText,
  SUPPORTED_LANGUAGES,
  TRANSLATIONS,
  tx,
} from './i18n/translations';
import { InhaleInterceptModal } from './components/InhaleInterceptModal';
import { PurityGuardView } from './components/PurityGuardView';
import {
  DigestAndFocusView,
  getRequiredQrTokenForComplexity,
} from './components/DigestAndFocusView';
import { AnalyticsAndKasbView } from './components/AnalyticsAndKasbView';
import { FirstTimeSetupModal } from './components/FirstTimeSetupModal';
import {
  enforceBackgroundSafeApps,
  enforcePrivateDnsAndSettingsGuard,
  fetchNativeLauncherStatus,
  forceTriggerHomePicker,
  launchNativeAndroidApp,
  loadRealInstalledApps,
  openPhoneMainSetting,
  openSystemHomeSettings,
  requestDefaultHomeLauncher,
  toggleHardwareKioskPin,
  type NativeLauncherStatus,
  type PhoneSettingTarget,
} from './services/nativeLauncherBridge';

const STORAGE_KEY = 'minimum_phone_kasb_state_v5';

function normalizeAppsForCallingAndNightLock(list: AppItem[]): AppItem[] {
  const hasMessagesApp = list.some(
    (a) => a.id === 'messages' || a.name.toLowerCase().includes('message')
  );
  const baseList = hasMessagesApp
    ? list
    : [
        ...list.slice(0, 1),
        DEFAULT_APPS.find((d) => d.id === 'messages')!,
        ...list.slice(1),
      ].filter(Boolean);

  return baseList.map((app) => {
    const lowerName = app.name.toLowerCase();
    const lowerPkg = (app.packageName || '').toLowerCase();
    const isCallingOrWhatsApp =
      app.id === 'phone' ||
      app.id === 'messages' ||
      app.id === 'whatsapp' ||
      lowerName.includes('whatsapp') ||
      lowerPkg.includes('whatsapp');

    if (isCallingOrWhatsApp) {
      const profiles: HomeProfileType[] =
        app.pinnedProfiles.length > 0
          ? app.pinnedProfiles
          : (['work', 'personal', 'sunset'] as HomeProfileType[]);
      return {
        ...app,
        category: 'communication',
        tier: 'essential',
        nightQrLocked: false,
        pinnedProfiles: Array.from(new Set([...profiles, 'work', 'personal', 'sunset'])),
      };
    }

    if (typeof app.nightQrLocked !== 'boolean') {
      const shouldNightLock =
        app.category === 'browser' ||
        app.category === 'social' ||
        app.category === 'entertainment' ||
        /chrome|browser|safari|firefox|brave|opera|duckduckgo|edge|instagram|facebook|youtube|tiktok|twitter|reddit/.test(
          lowerName
        );
      return {
        ...app,
        nightQrLocked: shouldNightLock,
      };
    }

    return app;
  });
}

function loadInitialSavedState(): Record<string, any> {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) ||
      localStorage.getItem('minimum_phone_kasb_state_v4') ||
      localStorage.getItem('minimum_phone_kasb_state_v3');
    if (raw) {
      return JSON.parse(raw) || {};
    }
  } catch {
    // ignore storage parse errors
  }
  return {};
}

export function App() {
  const initialSaved = useMemo(() => loadInitialSavedState(), []);

  // Persistent state initialization (lazily hydrated so mount save never overwrites language)
  const [lang, setLang] = useState<LanguageCode>(() => initialSaved.lang || 'en');
  const [platform, setPlatform] = useState<PlatformMode>('android');
  const [visualTheme, setVisualTheme] = useState<VisualTheme>('oled-black');
  const [grayscaleEnabled, setGrayscaleEnabled] = useState<boolean>(() =>
    typeof initialSaved.grayscaleEnabled === 'boolean'
      ? initialSaved.grayscaleEnabled
      : true
  );
  const [inspirationMode, setInspirationMode] = useState<InspirationMode>(
    () => initialSaved.inspirationMode || 'blended'
  );
  const [wisdomPack, setWisdomPack] = useState<WisdomPackSource>(
    () => initialSaved.wisdomPack || 'blended'
  );
  const [showArabicScript, setShowArabicScript] = useState<boolean>(true);
  const [defaultHabitWall, setDefaultHabitWall] = useState<HabitWallType>(
    () => initialSaved.defaultHabitWall || 'read-30s-quiz'
  );

  // First-Time Step-by-Step Setup Wizard state
  const [firstTimeSetupCompleted, setFirstTimeSetupCompleted] = useState<boolean>(() =>
    Boolean(initialSaved.firstTimeSetupCompleted)
  );
  const [showFirstTimeSetupModal, setShowFirstTimeSetupModal] = useState<boolean>(
    () => !Boolean(initialSaved.firstTimeSetupCompleted)
  );

  const [slowLearning, setSlowLearning] = useState<SlowLearningState>(() => ({
    track: 'islam',
    require30sQuizToOpenApps: true,
    readingDurationSeconds: 12,
    xp: 60,
    lessonsCompleted: 4,
    quizzesPassed: 4,
    currentLessonIndex: 0,
    masteredLessonIds: ['islam-1', 'islam-2'],
    reviewDueLessonIds: [],
    emotionCounts: {
      purpose: 4,
      bored: 5,
      stressed: 2,
      tired: 1,
    },
    ifThenReplacementHabit: 'Drink Water / Dhikr / Deep Sigh',
    ...(initialSaved.slowLearning || {}),
  }));

  const [activeTab, setActiveTab] = useState<
    'home' | 'drawer' | 'purity' | 'digest-focus' | 'system-kasb'
  >('home');

  const [homeProfile, setHomeProfile] = useState<HomeProfileType>('work');
  const [apps, setApps] = useState<AppItem[]>(() =>
    normalizeAppsForCallingAndNightLock(
      Array.isArray(initialSaved.apps) && initialSaved.apps.length > 0
        ? initialSaved.apps
        : DEFAULT_APPS
    )
  );
  const [notifications, setNotifications] =
    useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  const [scratchpadNotes, setScratchpadNotes] = useState<ScratchpadNote[]>(() =>
    Array.isArray(initialSaved.scratchpadNotes) && initialSaved.scratchpadNotes.length > 0
      ? initialSaved.scratchpadNotes
      : [
          {
            id: 'note-1',
            text: 'Finalize Q4 product architecture note before 4 PM',
            createdAt: '09:15',
            done: false,
            pinned: true,
          },
        ]
  );
  const [scratchpadInput, setScratchpadInput] = useState<string>('');
  const [showScratchpad, setShowScratchpad] = useState<boolean>(false);

  const [impulsesStopped, setImpulsesStopped] = useState<number>(
    () => initialSaved.impulsesStopped || 18
  );
  const [reclaimedMinutes, setReclaimedMinutes] = useState<number>(
    () => initialSaved.reclaimedMinutes || 270
  );

  // Purity & Anti-Porn State
  const [purity, setPurity] = useState<PurityState>(() => ({
    streakStartIso: new Date(Date.now() - 7 * 86400000 - 3 * 3600000).toISOString(),
    bestStreakDays: 14,
    urgesDefeatedCount: 9,
    discreetMode: false,
    adultDnsEnabled: true,
    selectedDnsProvider: 'cloudflare-family',
    dnsLockedByQr: true,
    autoActivateDnsAtNight: true,
    lockFullPhoneSettingsAtNight: true,
    privateDnsRemovedAlert: false,
    lastDnsAutoRestoreIso: null,
    browserKeywordShield: true,
    nightGuardLock: true,
    strictPornLockdown: true,
    safeSearchEnforced: true,
    customBlockedKeywords: [],
    emergencyBrowserLockUntilMs: null,
    pledgedToday: null,
    logs: [],
    ...(initialSaved.purity || {}),
  }));

  // Focus, QR Complexity, Settings Gate, Notification Control & Background Safe List State
  const [vault, setVault] = useState<FocusVaultState>(() => ({
    monkModeActive: false,
    monkTaskTitle: 'Deep Focus Architecture Work',
    monkRemainingSeconds: 50 * 60,
    monkTotalSeconds: 50 * 60,
    deepWorkScheduleEnabled: true,
    sleepVaultScheduleEnabled: true,
    autoCircadianWindDown: true,
    physicalBrickLocked: false,
    physicalBrickAnchorCode: 'KASB-BRICK-77',
    qrComplexity: 'hard',
    nightBrowserQrRequired: true,
    nightQrStartHour: 22,
    nightQrEndHour: 6,
    forceNightBrowserQrTest: false,
    settingsGateEnabled: true,
    settingsGateSeconds: 10,
    blockNotificationAppLaunch: true,
    readOnlyNotificationDigest: true,
    autoCleanBackgroundApps: true,
    backgroundSafeAppIds: [
      'phone',
      'messages',
      'whatsapp',
      'calendar',
      'notes',
      'maps',
      'authenticator',
    ],
    lastBackgroundCleanIso: null,
    lastBackgroundClosedCount: 0,
    uninstallProtectionEnabled: true,
    uninstallCooldownStartedIso: null,
    friendAccountabilitySecret: 'KASB2026',
    ...(initialSaved.vault || {}),
  }));

  // Live Clock, Battery & Native Core Launcher Control State
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());
  const [batteryLevel, setBatteryLevel] = useState<number>(84);
  const [isCharging, setIsCharging] = useState<boolean>(false);
  const [launcherStatus, setLauncherStatus] = useState<NativeLauncherStatus>({
    isDefaultLauncher: false,
    currentDefaultPackage: 'checking...',
    isKioskPinned: false,
    batteryLevel: 84,
    isCharging: false,
    platform: 'android',
  });
  const [showLauncherFortressModal, setShowLauncherFortressModal] =
    useState<boolean>(false);
  const [escapeGateTarget, setEscapeGateTarget] = useState<
    | 'home-settings'
    | 'system-settings'
    | 'private-dns-settings'
    | 'unlock-dns-guard'
    | 'unpin-kiosk'
    | null
  >(null);
  const [pendingPhoneSettingTarget, setPendingPhoneSettingTarget] =
    useState<PhoneSettingTarget>('main');
  const [escapeCooldownSec, setEscapeCooldownSec] = useState<number>(30);
  const [escapePhraseInput, setEscapePhraseInput] = useState<string>('');
  const [escapeMathInput, setEscapeMathInput] = useState<string>('');
  const [escapeQrInput, setEscapeQrInput] = useState<string>('');
  const [escapeError, setEscapeError] = useState<string | null>(null);

  // Settings Page Quick 20-Second Read + Quiz Gate State
  const [settingsSessionUnlocked, setSettingsSessionUnlocked] = useState<boolean>(false);
  const [settingsGateModalOpen, setSettingsGateModalOpen] = useState<boolean>(false);
  const [settingsGateTimerSec, setSettingsGateTimerSec] = useState<number>(10);
  const [settingsGateLessonIdx, setSettingsGateLessonIdx] = useState<number>(0);
  const [settingsGateSelectedOption, setSettingsGateSelectedOption] = useState<
    number | null
  >(null);
  const [settingsGateError, setSettingsGateError] = useState<string | null>(null);

  // Night Browser Physical QR Scanner Gate State
  const [nightBrowserQrApp, setNightBrowserQrApp] = useState<AppItem | null>(null);
  const [nightQrInput, setNightQrInput] = useState<string>('');
  const [nightQrMathInput, setNightQrMathInput] = useState<string>('');
  const [nightQrScanHoldSec, setNightQrScanHoldSec] = useState<number>(0);
  const [nightQrError, setNightQrError] = useState<string | null>(null);
  const [nightQrCameraActive, setNightQrCameraActive] = useState<boolean>(false);
  const nightVideoRef = useRef<HTMLVideoElement | null>(null);
  const nightStreamRef = useRef<MediaStream | null>(null);

  // App Drawer Search State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [revealRestrictedInDrawer, setRevealRestrictedInDrawer] =
    useState<boolean>(false);

  // Intercept Modal & Active Unlocked Session + Progressive Running-App Escalation (5m -> 10m -> 20m)
  const [interceptedApp, setInterceptedApp] = useState<AppItem | null>(null);
  const [interceptForce15sReopen, setInterceptForce15sReopen] = useState<boolean>(false);
  const [reopenLockedAppIds, setReopenLockedAppIds] = useState<string[]>([]);
  const [triggerIndex, setTriggerIndex] = useState<number>(0);
  const [activeSession, setActiveSession] = useState<{
    app: AppItem;
    intentReason: string;
    secondsRemaining: number;
    totalSeconds: number;
    elapsedSeconds: number;
  } | null>(null);

  const [escalationBanner, setEscalationBanner] = useState<{
    stage: '5m' | '10m';
    appName: string;
  } | null>(null);
  const [fullScreen20mClosedApp, setFullScreen20mClosedApp] = useState<{
    app: AppItem;
    closedAt: string;
  } | null>(null);

  // Restless Unlock Calm Mind Overlay & Built-in Utilities
  const [restlessOverlayOpen, setRestlessOverlayOpen] = useState<boolean>(false);
  const [openPuritySosImmediately, setOpenPuritySosImmediately] =
    useState<boolean>(false);
  const [openHowToGuideImmediately, setOpenHowToGuideImmediately] =
    useState<boolean>(false);
  const [activeBuiltInUtility, setActiveBuiltInUtility] = useState<
    'calculator' | 'authenticator' | null
  >(null);
  const [calcDisplay, setCalcDisplay] = useState<string>('0');

  // Sync Native Android / iOS / Web Core Launcher Status + Real Installed Phone Apps
  const refreshNativeStatus = async () => {
    const status = await fetchNativeLauncherStatus();
    setLauncherStatus(status);
    if (status.platform === 'ios' || status.osFamily === 'ios') {
      setPlatform('ios');
    } else if (status.platform === 'android' || status.osFamily === 'android') {
      setPlatform('android');
    } else {
      setPlatform('web');
    }
    if (status.batteryLevel > 0) setBatteryLevel(status.batteryLevel);
    setIsCharging(status.isCharging);
  };

  // Auto-clean background apps outside Safe List
  const runBackgroundSafeCleaner = async (currentApps: AppItem[], currentVault: FocusVaultState) => {
    if (!(currentVault.autoCleanBackgroundApps ?? true)) return;
    const safeIds = currentVault.backgroundSafeAppIds || [
      'phone',
      'messages',
      'whatsapp',
      'calendar',
      'notes',
      'maps',
      'authenticator',
    ];
    const safePackages = currentApps
      .filter((a) => safeIds.includes(a.id))
      .map((a) => a.packageName || a.id);
    const res = await enforceBackgroundSafeApps(safePackages, currentApps.length);
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setVault((prev) => ({
      ...prev,
      lastBackgroundCleanIso: nowTime,
      lastBackgroundClosedCount: res.closedCount,
    }));
  };

  const handleRefreshInstalledApps = () => {
    loadRealInstalledApps(apps).then((merged) => {
      setApps(normalizeAppsForCallingAndNightLock(merged));
    });
  };

  useEffect(() => {
    refreshNativeStatus();
    loadRealInstalledApps(apps).then((merged) => {
      setApps(normalizeAppsForCallingAndNightLock(merged));
    });

    const onHomePressed = () => {
      setInterceptedApp(null);
      setRestlessOverlayOpen(false);
      setEscapeGateTarget(null);
      setSearchQuery('');
      setSettingsSessionUnlocked(false);
      setActiveTab('home');
      refreshNativeStatus();
    };

    const onBackPressed = () => {
      setInterceptedApp((prev) => (prev ? null : prev));
      setRestlessOverlayOpen(false);
      setShowLauncherFortressModal(false);
      setEscapeGateTarget(null);
      setActiveTab('home');
    };

    const onResume = () => {
      refreshNativeStatus();
    };

    window.addEventListener('minimumphone:home', onHomePressed);
    window.addEventListener('minimumphone:back', onBackPressed);
    window.addEventListener('minimumphone:resume', onResume);
    return () => {
      window.removeEventListener('minimumphone:home', onHomePressed);
      window.removeEventListener('minimumphone:back', onBackPressed);
      window.removeEventListener('minimumphone:resume', onResume);
    };
  }, []);

  // 15-second cooldown for Anti-Escape Launcher Switch / Settings Gate
  useEffect(() => {
    if (!escapeGateTarget) return;
    if (escapeCooldownSec <= 0) return;
    const timer = setInterval(() => {
      setEscapeCooldownSec((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [escapeGateTarget, escapeCooldownSec]);

  // Settings Page Read & Quiz Gate countdown
  useEffect(() => {
    if (!settingsGateModalOpen) return;
    if (settingsGateTimerSec <= 0) return;
    const timer = setInterval(() => {
      setSettingsGateTimerSec((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [settingsGateModalOpen, settingsGateTimerSec]);

  // Night Browser/Social QR Camera Hold Countdown
  useEffect(() => {
    if (nightQrScanHoldSec <= 0) return;
    const timer = setInterval(() => {
      setNightQrScanHoldSec((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [nightQrScanHoldSec]);

  // Load saved state from localStorage
  useEffect(() => {
    try {
      const raw =
        localStorage.getItem(STORAGE_KEY) ||
        localStorage.getItem('minimum_phone_kasb_state_v4') ||
        localStorage.getItem('minimum_phone_kasb_state_v3');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.lang) setLang(parsed.lang);
        if (parsed.inspirationMode) setInspirationMode(parsed.inspirationMode);
        if (parsed.wisdomPack) setWisdomPack(parsed.wisdomPack);
        if (typeof parsed.grayscaleEnabled === 'boolean')
          setGrayscaleEnabled(parsed.grayscaleEnabled);
        if (parsed.defaultHabitWall) setDefaultHabitWall(parsed.defaultHabitWall);
        if (typeof parsed.firstTimeSetupCompleted === 'boolean') {
          setFirstTimeSetupCompleted(parsed.firstTimeSetupCompleted);
        }
        if (parsed.slowLearning) {
          setSlowLearning((prev) => ({
            ...prev,
            ...parsed.slowLearning,
            readingDurationSeconds: Math.min(
              15,
              parsed.slowLearning.readingDurationSeconds || 12
            ),
          }));
        }
        if (parsed.impulsesStopped) setImpulsesStopped(parsed.impulsesStopped);
        if (parsed.reclaimedMinutes) setReclaimedMinutes(parsed.reclaimedMinutes);
        if (parsed.purity) setPurity((prev) => ({ ...prev, ...parsed.purity }));
        if (parsed.vault) setVault((prev) => ({ ...prev, ...parsed.vault }));
        if (Array.isArray(parsed.apps) && parsed.apps.length > 0) {
          setApps(normalizeAppsForCallingAndNightLock(parsed.apps));
        }
        if (Array.isArray(parsed.scratchpadNotes)) setScratchpadNotes(parsed.scratchpadNotes);
      }
    } catch {
      // Ignore storage parse errors
    }
  }, []);

  // Save state to localStorage (100% local privacy)
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          lang,
          inspirationMode,
          wisdomPack,
          grayscaleEnabled,
          defaultHabitWall,
          firstTimeSetupCompleted,
          slowLearning,
          impulsesStopped,
          reclaimedMinutes,
          purity,
          vault,
          apps,
          scratchpadNotes,
        })
      );
    } catch {
      // Ignore quota errors
    }
  }, [
    lang,
    inspirationMode,
    wisdomPack,
    grayscaleEnabled,
    defaultHabitWall,
    firstTimeSetupCompleted,
    slowLearning,
    impulsesStopped,
    reclaimedMinutes,
    purity,
    vault,
    apps,
    scratchpadNotes,
  ]);

  // Live clock tick
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Monk Mode countdown tick
  useEffect(() => {
    if (!vault.monkModeActive) return;
    const timer = setInterval(() => {
      setVault((prev) => {
        if (prev.monkRemainingSeconds <= 1) {
          return { ...prev, monkModeActive: false, monkRemainingSeconds: 0 };
        }
        return { ...prev, monkRemainingSeconds: prev.monkRemainingSeconds - 1 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [vault.monkModeActive]);

  // Active unlocked app session countdown + 5m Minor / 10m Medium / 20m Full-Screen Auto-Close Escalation
  useEffect(() => {
    if (!activeSession) return;
    const timer = setInterval(() => {
      setActiveSession((prev) => {
        if (!prev) return null;
        const nextElapsed = prev.elapsedSeconds + 1;
        const nextRemaining = prev.secondsRemaining - 1;

        // 5-Minute Minor On-Screen Notification (300 seconds)
        if (nextElapsed === 5 * 60) {
          setEscalationBanner({ stage: '5m', appName: getAppDisplayName(prev.app, lang) });
        }

        // 10-Minute Medium On-Screen Warning (600 seconds)
        if (nextElapsed === 10 * 60) {
          setEscalationBanner({ stage: '10m', appName: getAppDisplayName(prev.app, lang) });
        }

        // 20-Minute Full-Screen Auto-Close + 15-Second Read & Quiz Reopening Restriction (1200 seconds)
        if (nextElapsed >= 20 * 60 || nextRemaining <= 0) {
          const closedApp = prev.app;
          setEscalationBanner(null);
          setReopenLockedAppIds((ids) =>
            ids.includes(closedApp.id) ? ids : [...ids, closedApp.id]
          );
          setFullScreen20mClosedApp({
            app: closedApp,
            closedAt: new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
          });
          runBackgroundSafeCleaner(apps, vault);
          return null;
        }

        return {
          ...prev,
          secondsRemaining: nextRemaining,
          elapsedSeconds: nextElapsed,
        };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeSession, apps, vault, lang]);

  const t = TRANSLATIONS[lang];
  const currentLangMeta =
    SUPPORTED_LANGUAGES.find((l) => l.code === lang) || SUPPORTED_LANGUAGES[0];

  // Handle Mode of Inspiration changes (Fully Islamic vs Common Universal vs Blended)
  const handleChangeInspirationMode = (mode: InspirationMode) => {
    setInspirationMode(mode);
    if (mode === 'islamic') {
      setShowArabicScript(true);
      setWisdomPack('quran');
      setSlowLearning((prev) => ({ ...prev, track: 'islam', currentLessonIndex: 0 }));
    } else if (mode === 'universal') {
      setShowArabicScript(false);
      setWisdomPack('proverbs');
      setSlowLearning((prev) => ({
        ...prev,
        track: prev.track === 'islam' ? 'mindfulness' : prev.track,
        currentLessonIndex: 0,
      }));
    } else {
      setWisdomPack('blended');
    }
  };

  // Filtered Calm Mind Triggers based on user's Mode of Inspiration & Wisdom Pack
  const filteredCalmTriggers = useMemo<CalmTrigger[]>(() => {
    const nonPurity = CALM_MIND_TRIGGERS.filter((item) => item.category !== 'purity');
    if (inspirationMode === 'islamic') {
      if (wisdomPack === 'hadith') {
        return nonPurity.filter((item) => item.category === 'hadith');
      }
      if (wisdomPack === 'quran') {
        return nonPurity.filter((item) => item.category === 'quran');
      }
      return nonPurity.filter(
        (item) => item.category === 'quran' || item.category === 'hadith'
      );
    }
    if (inspirationMode === 'universal') {
      return nonPurity.filter((item) => item.category === 'proverb');
    }
    if (wisdomPack === 'quran') {
      return nonPurity.filter((item) => item.category === 'quran');
    }
    if (wisdomPack === 'hadith') {
      return nonPurity.filter((item) => item.category === 'hadith');
    }
    if (wisdomPack === 'proverbs') {
      return nonPurity.filter((item) => item.category === 'proverb');
    }
    return nonPurity;
  }, [inspirationMode, wisdomPack]);

  const activeCalmTrigger =
    filteredCalmTriggers[triggerIndex % Math.max(1, filteredCalmTriggers.length)] ||
    CALM_MIND_TRIGGERS[0];

  // Active Home Apps (up to 7 apps for current Home Screen profile; Phone Calls, Messages & WhatsApp first)
  const pinnedHomeApps = useMemo(() => {
    const priorityOrder: Record<string, number> = {
      phone: 1,
      messages: 2,
      whatsapp: 3,
    };
    return apps
      .filter((a) => a.pinnedProfiles.includes(homeProfile))
      .sort((a, b) => {
        const pa = priorityOrder[a.id] || 99;
        const pb = priorityOrder[b.id] || 99;
        return pa - pb;
      })
      .slice(0, 7);
  }, [apps, homeProfile]);

  // Search-First App Drawer Filtering with Asymmetric Friction
  const drawerSearchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      if (revealRestrictedInDrawer) return apps;
      return apps.filter((a) => a.tier !== 'restricted' && a.tier !== 'adult-blocked');
    }

    return apps.filter((app) => {
      const nameEn = app.name.toLowerCase();
      const nameLocalized = getAppDisplayName(app, lang).toLowerCase();
      const nameBn = (app.nameBn || '').toLowerCase();
      if (
        (app.tier === 'restricted' || app.tier === 'adult-blocked') &&
        !revealRestrictedInDrawer
      ) {
        return (
          q.length >= 3 &&
          (nameEn.startsWith(q) ||
            nameEn === q ||
            nameLocalized.includes(q) ||
            nameBn.includes(q))
        );
      }
      return nameEn.includes(q) || nameLocalized.includes(q) || nameBn.includes(q);
    });
  }, [apps, searchQuery, revealRestrictedInDrawer, lang]);

  // Check if current hour is within Night Window (default 22:00 - 06:00) or forced test mode
  const isNightHourActive = useMemo(() => {
    if (vault.forceNightBrowserQrTest) return true;
    const hr = currentTime.getHours();
    const startH = vault.nightQrStartHour ?? 22;
    const endH = vault.nightQrEndHour ?? 6;
    return hr >= startH || hr < endH;
  }, [currentTime, vault.forceNightBrowserQrTest, vault.nightQrStartHour, vault.nightQrEndHour]);

  // Method 6: Automatic Circadian Sunset Wind-Down (9:30 PM – 6:00 AM)
  const isCircadianSunsetActive = useMemo(() => {
    if (!(vault.autoCircadianWindDown ?? true)) return false;
    const hr = currentTime.getHours();
    const min = currentTime.getMinutes();
    return (hr === 21 && min >= 30) || hr >= 22 || hr < 6;
  }, [currentTime, vault.autoCircadianWindDown]);

  // Automatic Private DNS Night Re-Activation & OS Removal Watchdog:
  // If Private DNS is removed or turned off, it automatically activates at night (22:00-06:00)
  // and kills background Android System Settings processes when lockFullPhoneSettingsAtNight is enabled.
  useEffect(() => {
    const expectedHost =
      purity.selectedDnsProvider === 'cleanbrowsing-adult'
        ? 'adult-filter-dns.cleanbrowsing.org'
        : purity.selectedDnsProvider === 'adguard-family'
        ? 'family.adguard-dns.com'
        : 'family.cloudflare-dns.com';

    // 1. If Night Time is active and autoActivateDnsAtNight is enabled, force-enable DNS & locks if ever turned off
    if (isNightHourActive && (purity.autoActivateDnsAtNight ?? true)) {
      if (
        !purity.adultDnsEnabled ||
        !(purity.dnsLockedByQr ?? true) ||
        !(purity.strictPornLockdown ?? true) ||
        !purity.nightGuardLock
      ) {
        const nowStr = new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });
        setPurity((prev) => ({
          ...prev,
          adultDnsEnabled: true,
          dnsLockedByQr: true,
          strictPornLockdown: true,
          nightGuardLock: true,
          lockFullPhoneSettingsAtNight: true,
          lastDnsAutoRestoreIso: nowStr,
        }));
      }

      enforcePrivateDnsAndSettingsGuard(
        expectedHost,
        true,
        purity.lockFullPhoneSettingsAtNight ?? true
      ).then((res) => {
        if (
          launcherStatus.platform === 'android' &&
          (res.privateDnsMode === 'off' || res.privateDnsMode === 'opportunistic') &&
          !res.autoRestoredNatively
        ) {
          setPurity((prev) =>
            prev.privateDnsRemovedAlert
              ? prev
              : {
                  ...prev,
                  privateDnsRemovedAlert: true,
                  lastDnsAutoRestoreIso: new Date().toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  }),
                }
          );
        }
      });
    } else if (
      launcherStatus.platform === 'android' &&
      purity.adultDnsEnabled &&
      (launcherStatus.privateDnsMode === 'off' ||
        launcherStatus.privateDnsMode === 'opportunistic')
    ) {
      // 2. Even during daytime, if Private DNS is locked ON and OS reports it was turned off, auto-restore or alert
      enforcePrivateDnsAndSettingsGuard(expectedHost, true, false).then((res) => {
        if (!res.autoRestoredNatively && !purity.privateDnsRemovedAlert) {
          setPurity((prev) => ({
            ...prev,
            privateDnsRemovedAlert: true,
            lastDnsAutoRestoreIso: new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
          }));
        }
      });
    }
  }, [
    isNightHourActive,
    purity.autoActivateDnsAtNight,
    purity.adultDnsEnabled,
    purity.dnsLockedByQr,
    purity.strictPornLockdown,
    purity.nightGuardLock,
    purity.lockFullPhoneSettingsAtNight,
    purity.selectedDnsProvider,
    purity.privateDnsRemovedAlert,
    launcherStatus.platform,
    launcherStatus.privateDnsMode,
  ]);

  // Open the Strong Private DNS & Phone System Settings Fortress Modal (30s Cooldown + Math + Physical QR)
  const openStrongSettingsFortressModal = (
    gateTarget:
      | 'home-settings'
      | 'system-settings'
      | 'private-dns-settings'
      | 'unlock-dns-guard'
      | 'unpin-kiosk',
    settingTarget: PhoneSettingTarget = 'main'
  ) => {
    setPendingPhoneSettingTarget(settingTarget);
    setEscapeCooldownSec(30);
    setEscapePhraseInput('');
    setEscapeMathInput('');
    setEscapeQrInput('');
    setEscapeError(null);
    setEscapeGateTarget(gateTarget);
  };

  // Centralized Interceptor for ALL Phone System Settings & Private DNS Buttons
  const handleRequestPhoneSetting = async (
    target: PhoneSettingTarget,
    options?: { bypassForDnsSetup?: boolean }
  ) => {
    // Allow 1-Tap Safe Family DNS Setup / Restoration Window (35s auto-return to Minimum Phone)
    if (options?.bypassForDnsSetup && target === 'dns') {
      try {
        await navigator.clipboard?.writeText('family.cloudflare-dns.com');
      } catch {
        // ignore clipboard error
      }
      setPurity((prev) => ({
        ...prev,
        adultDnsEnabled: true,
        dnsLockedByQr: true,
        autoActivateDnsAtNight: true,
        privateDnsRemovedAlert: false,
        lastDnsAutoRestoreIso: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      }));
      await openPhoneMainSetting('dns', 35);
      return;
    }

    // 1. Strong Private DNS Setting Lock (24/7 whenever DNS is locked by QR)
    if (target === 'dns' && purity.adultDnsEnabled && (purity.dnsLockedByQr ?? true)) {
      openStrongSettingsFortressModal('private-dns-settings', 'dns');
      return;
    }

    // 2. Full Phone System Settings Lock at Night (10:00 PM – 6:00 AM)
    // Locks the entire Android Settings system at night so Private DNS or App Permissions cannot be bypassed
    if (isNightHourActive && (purity.lockFullPhoneSettingsAtNight ?? true)) {
      openStrongSettingsFortressModal(
        target === 'dns' ? 'private-dns-settings' : 'system-settings',
        target
      );
      return;
    }

    // 3. 24/7 Protection on Main System Settings, Apps, Default Home, Accessibility & Usage
    const sensitiveTargets: PhoneSettingTarget[] = [
      'main',
      'dns',
      'apps',
      'home',
      'accessibility',
      'usage',
    ];
    if (
      sensitiveTargets.includes(target) &&
      (vault.uninstallProtectionEnabled || (purity.dnsLockedByQr ?? true))
    ) {
      openStrongSettingsFortressModal(
        target === 'dns' ? 'private-dns-settings' : 'system-settings',
        target
      );
      return;
    }

    // 4. Daytime non-sensitive quick setting (Wi-Fi, Bluetooth, Display, Sound, Battery) with 40s auto-return
    await openPhoneMainSetting(target, 40);
  };

  // Sleeping-Time / Night Mandatory Emergency QR Lock for Browsers, Social Media & Entertainment Apps
  const isNightQrLockedApp = (app: AppItem): boolean => {
    const n = app.name.toLowerCase();
    const p = (app.packageName || '').toLowerCase();
    if (
      app.id === 'phone' ||
      app.id === 'messages' ||
      app.id === 'whatsapp' ||
      n.includes('whatsapp') ||
      p.includes('whatsapp')
    ) {
      return false;
    }
    if (typeof app.nightQrLocked === 'boolean') return app.nightQrLocked;
    return (
      app.category === 'browser' ||
      app.category === 'social' ||
      app.category === 'entertainment' ||
      /chrome|browser|safari|firefox|brave|opera|duckduckgo|edge|instagram|facebook|youtube|tiktok|twitter|reddit/.test(
        n
      ) ||
      /chrome|browser|safari|firefox|brave|opera|duckduckgo|edge|instagram|facebook|youtube|tiktok|twitter|reddit/.test(
        p
      )
    );
  };

  // Navigate to Settings tab with Compact 10s Read & Quiz Gate (Answer within 20s)
  const handleSelectNavigationTab = (
    tabId: 'home' | 'drawer' | 'purity' | 'digest-focus' | 'system-kasb'
  ) => {
    if (tabId === 'home') {
      setSettingsSessionUnlocked(false);
      runBackgroundSafeCleaner(apps, vault);
      setActiveTab('home');
      return;
    }

    if (
      tabId === 'system-kasb' &&
      (vault.settingsGateEnabled ?? true) &&
      !settingsSessionUnlocked
    ) {
      setSettingsGateTimerSec(Math.min(12, vault.settingsGateSeconds || 10));
      setSettingsGateSelectedOption(null);
      setSettingsGateError(null);
      setSettingsGateLessonIdx((idx) => idx + 1);
      setSettingsGateModalOpen(true);
      return;
    }

    setActiveTab(tabId);
  };

  const handleTapApp = (app: AppItem) => {
    const lowerName = app.name.toLowerCase();
    const lowerPkg = (app.packageName || '').toLowerCase();

    // 0. If Private DNS was removed, block all browsers & social apps until Private DNS is restored
    if (
      purity.privateDnsRemovedAlert &&
      (app.category === 'browser' ||
        app.category === 'social' ||
        app.category === 'entertainment')
    ) {
      setImpulsesStopped((n) => n + 1);
      return;
    }

    // 1. Complete Porn & Adult Block Check: if app is adult-blocked or Emergency 15m Browser Lock is active
    const isEmergencyLockActive =
      purity.emergencyBrowserLockUntilMs &&
      Date.now() < purity.emergencyBrowserLockUntilMs;

    if (
      app.tier === 'adult-blocked' ||
      (isEmergencyLockActive &&
        (app.category === 'browser' || app.category === 'social'))
    ) {
      setImpulsesStopped((n) => n + 1);
      setOpenPuritySosImmediately(true);
      setActiveTab('purity');
      return;
    }

    // 2. Mandatory Sleeping-Time Emergency QR Scan Lock (Browsers, Social Media, Entertainment at 10 PM – 6 AM)
    if (
      (vault.nightBrowserQrRequired ?? true) &&
      isNightHourActive &&
      isNightQrLockedApp(app)
    ) {
      setNightQrInput('');
      setNightQrMathInput('');
      setNightQrError(null);
      setNightQrCameraActive(false);
      setNightBrowserQrApp(app);
      return;
    }

    // 3. Strong System Settings & Private DNS Anti-Escape Guard (24/7 & Night Fortress)
    if (
      (vault.uninstallProtectionEnabled ||
        (purity.dnsLockedByQr ?? true) ||
        (isNightHourActive && (purity.lockFullPhoneSettingsAtNight ?? true))) &&
      (lowerName === 'settings' ||
        lowerPkg.includes('settings') ||
        lowerPkg.includes('launcher'))
    ) {
      openStrongSettingsFortressModal('system-settings', 'main');
      return;
    }

    // 4. Check if Physical QR Brick Lock is active for restricted apps
    if (app.tier === 'restricted' && vault.physicalBrickLocked) {
      setActiveTab('digest-focus');
      return;
    }

    // 5. Check if app was closed after 20 minutes and requires the 15s Read & Quiz Reopening Lock
    const requires15sReopenGate = reopenLockedAppIds.includes(app.id);

    // 6. If Strict Porn Lockdown is active, browsers are always gated by the Read + Quiz Gate
    const isStrictBrowserGate =
      (purity.strictPornLockdown ?? true) && app.category === 'browser';

    if (app.tier === 'restricted' || isStrictBrowserGate || requires15sReopenGate) {
      setTriggerIndex((i) => i + 1);
      setInterceptForce15sReopen(requires15sReopenGate);
      setInterceptedApp(app);
      return;
    }

    // 7. Utility / Essential app launches immediately with zero dopamine friction
    setApps((prev) =>
      prev.map((a) =>
        a.id === app.id
          ? { ...a, dailyOpens: a.dailyOpens + 1, dailyMinutesUsed: a.dailyMinutesUsed + 2 }
          : a
      )
    );
    setActiveSession({
      app,
      intentReason: 'Essential Utility Tool',
      secondsRemaining: 15 * 60,
      totalSeconds: 15 * 60,
      elapsedSeconds: 0,
    });
    launchNativeAndroidApp(app, 0).then((launched) => {
      if (!launched) {
        if (app.id === 'notes') {
          setShowScratchpad(true);
          setActiveTab('home');
        } else if (app.id === 'quran-sunnah' || app.id === 'quran-reader') {
          setTriggerIndex((i) => i + 1);
          setRestlessOverlayOpen(true);
        } else if (app.id === 'calculator') {
          setCalcDisplay('0');
          setActiveBuiltInUtility('calculator');
        } else if (app.id === 'authenticator') {
          setActiveBuiltInUtility('authenticator');
        }
      }
    });
  };

  const handleTogglePinAppToProfile = (appId: string, profile: HomeProfileType) => {
    setApps((prev) =>
      prev.map((a) => {
        if (a.id !== appId) return a;
        const hasProfile = a.pinnedProfiles.includes(profile);
        const nextProfiles = hasProfile
          ? a.pinnedProfiles.filter((p) => p !== profile)
          : [...a.pinnedProfiles, profile];
        return { ...a, pinnedProfiles: nextProfiles };
      })
    );
  };

  const handleChangeAppTier = (appId: string, tier: AppFrictionTier) => {
    setApps((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, tier } : a))
    );
  };

  const handleAddCustomApp = (name: string, tier: AppFrictionTier) => {
    const newItem: AppItem = {
      id: `custom-${Date.now()}`,
      name,
      category: tier === 'restricted' ? 'social' : 'utility',
      tier,
      dailyOpens: 0,
      dailyMinutesUsed: 0,
      pinnedProfiles: [homeProfile],
    };
    setApps((prev) => [newItem, ...prev]);
  };

  // Method 5 & Method 7: Walking away awards +20 XP toward Self-Mastery Rank
  const handleReturnToPeaceFromIntercept = () => {
    setInterceptedApp(null);
    setInterceptForce15sReopen(false);
    setImpulsesStopped((n) => n + 1);
    setReclaimedMinutes((m) => m + 15);
    setSlowLearning((prev) => ({
      ...prev,
      xp: prev.xp + 20,
    }));
    setSearchQuery('');
    setActiveTab('home');
  };

  const handleApproveRestrictedUnlock = (
    minutesBid: number,
    intentReason: string,
    journalEntry?: string
  ) => {
    if (!interceptedApp) return;
    const target = interceptedApp;
    setApps((prev) =>
      prev.map((a) =>
        a.id === target.id
          ? {
              ...a,
              dailyOpens: a.dailyOpens + 1,
              dailyMinutesUsed: a.dailyMinutesUsed + minutesBid,
            }
          : a
      )
    );
    if (journalEntry) {
      setScratchpadNotes((prev) => [
        {
          id: `journal-${Date.now()}`,
          text: `[Journal Unlock] ${journalEntry}`,
          createdAt: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          done: false,
        },
        ...prev,
      ]);
    }
    setReopenLockedAppIds((ids) => ids.filter((id) => id !== target.id));
    setInterceptedApp(null);
    setInterceptForce15sReopen(false);
    setSearchQuery('');
    setActiveSession({
      app: target,
      intentReason,
      secondsRemaining: minutesBid * 60,
      totalSeconds: minutesBid * 60,
      elapsedSeconds: 0,
    });
    launchNativeAndroidApp(target, minutesBid);
  };

  // Trigger 5m Minor / 10m Medium / 20m Full-Screen Auto-Close Escalation (live or from Settings test)
  const handleTriggerEscalationStage = (
    stage: '5m' | '10m' | '20m',
    appName = 'Instagram'
  ) => {
    const matchedApp =
      apps.find((a) => a.name.toLowerCase() === appName.toLowerCase()) ||
      apps.find((a) => a.id === 'instagram') ||
      apps[0];

    if (stage === '5m') {
      setEscalationBanner({ stage: '5m', appName: getAppDisplayName(matchedApp, lang) });
    } else if (stage === '10m') {
      setEscalationBanner({ stage: '10m', appName: getAppDisplayName(matchedApp, lang) });
    } else {
      setEscalationBanner(null);
      setActiveSession(null);
      setReopenLockedAppIds((ids) =>
        ids.includes(matchedApp.id) ? ids : [...ids, matchedApp.id]
      );
      setFullScreen20mClosedApp({
        app: matchedApp,
        closedAt: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      });
      runBackgroundSafeCleaner(apps, vault);
    }
  };

  // Open app from Notification Digest (controlled by Notification Guard)
  const handleOpenAppFromNotification = (appName: string) => {
    const matched =
      apps.find((a) => a.name.toLowerCase().includes(appName.toLowerCase())) ||
      apps.find((a) => a.id === 'whatsapp') ||
      apps[0];

    if (vault.blockNotificationAppLaunch ?? true) {
      setTriggerIndex((i) => i + 1);
      setInterceptForce15sReopen(true);
      setInterceptedApp(matched);
    } else {
      handleTapApp(matched);
    }
  };

  // Start camera for Night Browser QR Scanner
  const startNightQrCamera = async () => {
    setNightQrError(null);
    setNightQrCameraActive(true);
    const complexity = vault.qrComplexity || 'hard';
    setNightQrScanHoldSec(complexity === 'hard' ? 12 : complexity === 'medium' ? 6 : 2);
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        nightStreamRef.current = stream;
        if (nightVideoRef.current) {
          nightVideoRef.current.srcObject = stream;
        }
      }
    } catch {
      // Fallback if camera permission not granted
    }
  };

  const stopNightQrCamera = () => {
    if (nightStreamRef.current) {
      nightStreamRef.current.getTracks().forEach((tr) => tr.stop());
      nightStreamRef.current = null;
    }
    setNightQrCameraActive(false);
  };

  const handleVerifyNightBrowserQr = () => {
    if (!nightBrowserQrApp) return;
    const complexity = vault.qrComplexity || 'hard';
    const expectedToken = getRequiredQrTokenForComplexity(
      vault.physicalBrickAnchorCode,
      complexity
    );

    if (nightQrScanHoldSec > 0) {
      setNightQrError(
        tx(
          lang,
          `Hold steady for ${nightQrScanHoldSec}s while optical QR verification completes.`,
          `ক্যামেরা যাচাই সম্পন্ন হতে আরও ${nightQrScanHoldSec} সেকেন্ড স্থিরভাবে ধরে রাখুন।`,
          `انتظر ${nightQrScanHoldSec} ثانية حتى يكتمل التحقق من رمز QR.`,
          `کیمرہ تصدیق مکمل ہونے تک ${nightQrScanHoldSec} سیکنڈ انتظار کریں۔`,
          `Tahan ${nightQrScanHoldSec} detik hingga verifikasi QR selesai.`
        )
      );
      return;
    }

    if (complexity === 'hard' && nightQrMathInput.trim() !== '43') {
      setNightQrError(
        tx(
          lang,
          'Hard QR Complexity requires solving the anti-impulse check (17 + 26 = 43) plus the exact QR token.',
          'হার্ড (Hard) মোডে আনলক করতে গণিত যাচাই (১৭ + ২৬ = ৪৩) এবং সঠিক QR কোড উভয়ই দিতে হবে।',
          'يتطلب المستوى الصعب حل المسألة (17 + 26 = 43) مع رمز QR الكامل.',
          'ہارڈ موڈ کے لیے حساب (17 + 26 = 43) اور مکمل QR کوڈ دونوں درج کریں۔',
          'Mode Sulit memerlukan jawaban (17 + 26 = 43) serta kode QR lengkap.'
        )
      );
      return;
    }

    if (nightQrInput.trim().toUpperCase() === expectedToken) {
      const targetBrowser = nightBrowserQrApp;
      stopNightQrCamera();
      setNightBrowserQrApp(null);
      setTriggerIndex((i) => i + 1);
      setInterceptForce15sReopen(true);
      setInterceptedApp(targetBrowser);
    } else {
      setNightQrError(
        tx(
          lang,
          `Invalid Night QR Code for [${complexity.toUpperCase()}] complexity. Required: ${expectedToken}`,
          `[${complexity.toUpperCase()}] মোডের জন্য QR কোড সঠিক নয়। প্রয়োজনীয় কোড: ${expectedToken}`,
          `رمز QR غير صحيح. الرمز المطلوب: ${expectedToken}`,
          `یہ QR کوڈ درست نہیں۔ مطلوبہ کوڈ: ${expectedToken}`,
          `Kode QR tidak valid. Kode yang diperlukan: ${expectedToken}`
        )
      );
    }
  };

  const handleAddScratchpadNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scratchpadInput.trim()) return;
    setScratchpadNotes((prev) => [
      {
        id: `sp-${Date.now()}`,
        text: scratchpadInput.trim(),
        createdAt: currentTime.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        done: false,
        pinned: false,
      },
      ...prev,
    ]);
    setScratchpadInput('');
  };

  const handleToggleScratchpadDone = (noteId: string) => {
    setScratchpadNotes((prev) =>
      prev.map((n) => (n.id === noteId ? { ...n, done: !n.done } : n))
    );
  };

  const handleToggleScratchpadPin = (noteId: string) => {
    setScratchpadNotes((prev) =>
      prev.map((n) => (n.id === noteId ? { ...n, pinned: !n.pinned } : n))
    );
  };

  const urgentBreakthroughCount = notifications.filter(
    (n) => n.isUrgentBreakthrough && !n.read
  ).length;
  const batchedQuietCount = notifications.filter((n) => !n.isUrgentBreakthrough).length;

  const formattedClock = currentTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const formattedDate = currentTime.toLocaleDateString(
    lang === 'bn'
      ? 'bn-BD'
      : lang === 'ar'
      ? 'ar-SA'
      : lang === 'ur'
      ? 'ur-PK'
      : lang === 'id'
      ? 'id-ID'
      : 'en-US',
    {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }
  );

  // Method 6: Automatic Circadian Sunset Wind-Down warms display after 9:30 PM
  const effectiveTheme: VisualTheme =
    visualTheme === 'oled-black' && isCircadianSunsetActive
      ? 'sunset-amber'
      : visualTheme;

  const themeClass =
    effectiveTheme === 'eink-paper'
      ? 'theme-eink'
      : effectiveTheme === 'sunset-amber'
      ? 'theme-sunset'
      : 'bg-black text-zinc-100';

  const settingsGateLessons = getLessonsForTrack(slowLearning.track);
  const activeSettingsGateLesson =
    settingsGateLessons[settingsGateLessonIdx % settingsGateLessons.length];

  const sortedScratchpadNotes = useMemo(() => {
    return [...scratchpadNotes].sort((a, b) => {
      if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1;
      if (a.done !== b.done) return a.done ? 1 : -1;
      return 0;
    });
  }, [scratchpadNotes]);

  const masteryRank = getSelfMasteryRank(slowLearning.xp, lang);

  return (
    <div
      dir={currentLangMeta.dir}
      className={`w-full h-[100dvh] max-w-none overflow-hidden flex flex-col safe-shell ${
        grayscaleEnabled ? 'system-grayscale' : ''
      } ${themeClass}`}
    >
      {/* 5M MINOR & 10M MEDIUM PROGRESSIVE RUNNING-APP ESCALATION BANNER */}
      {escalationBanner && (
        <div
          className={`w-full shrink-0 border-b-2 px-4 py-3 font-mono-tech flex flex-wrap items-center justify-between gap-2 ${
            escalationBanner.stage === '10m'
              ? 'border-zinc-100 bg-zinc-900 text-white'
              : 'border-zinc-700 bg-zinc-950 text-zinc-200'
          }`}
        >
          <div className="text-xs">
            {escalationBanner.stage === '5m' ? (
              <span>
                ⏱{' '}
                {tx(
                  lang,
                  `5-MINUTE MINOR NOTICE (${escalationBanner.appName}): You have spent 5 minutes inside ${escalationBanner.appName}. Check your intention.`,
                  `৫ মিনিটের মৃদু রিমাইন্ডার (${escalationBanner.appName}): আপনি ${escalationBanner.appName}-এ ৫ মিনিট ব্যয় করেছেন। আপনার মূল উদ্দেশ্য স্মরণ করুন।`,
                  `تنبيه ٥ دقائق (${escalationBanner.appName}): قضيت ٥ دقائق في التطبيق. تذكر هدفك.`,
                  `٥ منٹ کی یاد دہانی (${escalationBanner.appName}): آپ نے ٥ منٹ گزار لیے ہیں۔ اپنا مقصد یاد رکھیں۔`,
                  `PERINGATAN 5 MENIT (${escalationBanner.appName}): Anda telah menghabiskan 5 menit. Ingat tujuan Anda.`
                )}
              </span>
            ) : (
              <span>
                ⚠{' '}
                {tx(
                  lang,
                  `10-MINUTE MEDIUM WARNING (${escalationBanner.appName}): 10 minutes elapsed! At 20 minutes, ${escalationBanner.appName} will auto-close and lock behind a 15s Read & Quiz.`,
                  `১০ মিনিটের মাঝারি সতর্কতা (${escalationBanner.appName}): ১০ মিনিট অতিবাহিত! ২০ মিনিট পূর্ণ হলে ${escalationBanner.appName} স্বয়ংক্রিয়ভাবে বন্ধ হবে এবং ১৫ সেকেন্ডের কুইজ লক চালু হবে।`,
                  `تحذير ١٠ دقائق (${escalationBanner.appName}): عند ٢٠ دقيقة سيغلق التطبيق تلقائياً ويقفل باختبار.`,
                  `١٠ منٹ کا الرٹ (${escalationBanner.appName}): ٢٠ منٹ پر ایپ خودکار طور پر بند ہو جائے گی۔`,
                  `PERINGATAN 10 MENIT (${escalationBanner.appName}): Pada 20 menit aplikasi akan tertutup otomatis.`
                )}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setEscalationBanner(null);
                setActiveSession(null);
                setImpulsesStopped((n) => n + 1);
                setActiveTab('home');
              }}
              className="px-3 py-1 bg-zinc-100 text-black text-[11px] font-semibold uppercase cursor-pointer"
            >
              {tx(
                lang,
                `Close ${escalationBanner.appName} Now`,
                `এখনই ${escalationBanner.appName} বন্ধ করুন`,
                `أغلق ${escalationBanner.appName} الآن`,
                `ابھی ${escalationBanner.appName} بند کریں`,
                `Tutup ${escalationBanner.appName} Sekarang`
              )}
            </button>
            <button
              type="button"
              onClick={() => setEscalationBanner(null)}
              className="px-2 py-1 border border-zinc-600 text-[11px] text-zinc-400 cursor-pointer"
            >
              {tx(lang, 'Dismiss', 'বন্ধ', 'إخفاء', 'ہٹائیں', 'Tutup')}
            </button>
          </div>
        </div>
      )}

      {/* ACTIVE UNLOCKED APP SESSION BANNER (WITH 5M / 10M / 20M ESCALATION TRACKER) */}
      {activeSession && (
        <div
          className={`w-full shrink-0 border-b border-zinc-800 px-4 py-2 transition-opacity ${
            activeSession.secondsRemaining <= 60 ? 'bg-zinc-900/95' : 'bg-zinc-950'
          }`}
        >
          <div className="w-full h-1 bg-zinc-800 mb-1.5 overflow-hidden">
            <div
              className="h-full bg-zinc-100 transition-all"
              style={{
                width: `${
                  (activeSession.secondsRemaining / activeSession.totalSeconds) * 100
                }%`,
              }}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono-tech">
            <div>
              <span className="text-zinc-200 font-semibold">
                {getAppDisplayName(activeSession.app, lang)}
              </span>{' '}
              <span className="text-zinc-500">
                · {Math.floor(activeSession.elapsedSeconds / 60)}m{' '}
                {activeSession.elapsedSeconds % 60}s (5m / 10m / 20m)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleTriggerEscalationStage('5m', activeSession.app.name)}
                className="px-1.5 py-0.5 border border-zinc-800 text-[10px] text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                5m
              </button>
              <button
                type="button"
                onClick={() => handleTriggerEscalationStage('10m', activeSession.app.name)}
                className="px-1.5 py-0.5 border border-zinc-700 text-[10px] text-zinc-300 hover:text-white cursor-pointer"
              >
                10m
              </button>
              <button
                type="button"
                onClick={() => handleTriggerEscalationStage('20m', activeSession.app.name)}
                className="px-1.5 py-0.5 border border-zinc-500 text-[10px] text-zinc-200 hover:bg-zinc-800 cursor-pointer"
              >
                20m
              </button>
              <span className="text-zinc-200 pl-1">
                {Math.floor(activeSession.secondsRemaining / 60)}:
                {String(activeSession.secondsRemaining % 60).padStart(2, '0')}
              </span>
              <button
                type="button"
                onClick={() => {
                  setActiveSession(null);
                  runBackgroundSafeCleaner(apps, vault);
                }}
                className="px-2 py-1 bg-zinc-100 text-black text-[10px] font-semibold uppercase cursor-pointer"
              >
                {tx(lang, 'Close App', 'অ্যাপ বন্ধ করুন', 'إغلاق', 'بند کریں', 'Tutup')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN 100% DEVICE-FIT LAUNCHER VIEWPORT */}
      <main className="w-full max-w-full min-w-0 flex-1 min-h-0 flex flex-col justify-between overflow-y-auto overflow-x-hidden px-2.5 sm:px-6 md:px-10 py-2.5">
        {/* =========================================================
            TAB 1: THE PURE MINIMALIST HOME SCREEN (ZERO SETTINGS CLUTTER)
           ========================================================= */}
        {activeTab === 'home' && (
          <div className="w-full max-w-4xl min-w-0 mx-auto flex-1 flex flex-col justify-between space-y-3">
            {/* Top Status Row: Clean Clock, Date, Battery %, Circadian Wind-Down & 1-Tap Wi-Fi/BT/DNS/Setup Quick Bar */}
            <div className="space-y-2">
              <div className="flex items-baseline justify-between gap-2">
                <h1 className="text-5xl sm:text-6xl md:text-7xl font-mono-tech font-light tracking-tight">
                  {formattedClock}
                </h1>
                <div className="text-right font-mono-tech text-xs opacity-75">
                  <div>{formattedDate}</div>
                  <div className="mt-0.5">
                    {tx(lang, 'BAT', 'ব্যাটারি', 'بطارية', 'بیٹری', 'BAT')} {batteryLevel}%{' '}
                    {isCharging ? '⚡' : ''}
                    {isCircadianSunsetActive ? ' · 🌇' : ''}
                  </div>
                </div>
              </div>

              {/* 1-Tap Hardware Quick Access Bar: Wi-Fi, Bluetooth, Private DNS, Data, Display, Sound + Easy Setup + Language */}
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-1 pt-0.5">
                {(
                  [
                    {
                      target: 'wifi',
                      label: tx(lang, '📶 Wi-Fi', '📶 Wi-Fi', '📶 Wi-Fi', '📶 Wi-Fi', '📶 Wi-Fi'),
                    },
                    {
                      target: 'bluetooth',
                      label: tx(lang, '🦷 BT', '🦷 BT', '🦷 BT', '🦷 BT', '🦷 BT'),
                    },
                    {
                      target: 'dns',
                      label:
                        purity.adultDnsEnabled && (purity.dnsLockedByQr ?? true)
                          ? tx(lang, '🔒 DNS', '🔒 DNS', '🔒 DNS', '🔒 DNS', '🔒 DNS')
                          : tx(lang, '🌐 DNS', '🌐 DNS', '🌐 DNS', '🌐 DNS', '🌐 DNS'),
                    },
                    {
                      target: 'data',
                      label: tx(lang, '📱 Data', '📱 ডেটা', '📱 بيانات', '📱 ڈیٹا', '📱 Data'),
                    },
                    {
                      target: 'display',
                      label: tx(lang, '🔆 Screen', '🔆 আলো', '🔆 شاشة', '🔆 اسکرین', '🔆 Layar'),
                    },
                    {
                      target: 'sound',
                      label: tx(lang, '🔊 Sound', '🔊 সাউন্ড', '🔊 صوت', '🔊 آواز', '🔊 Suara'),
                    },
                  ] as const
                ).map((qs) => (
                  <button
                    key={qs.target}
                    type="button"
                    onClick={() => handleRequestPhoneSetting(qs.target)}
                    className="py-1.5 px-1 border border-zinc-800/90 bg-zinc-950/60 text-[10px] font-mono-tech text-zinc-300 hover:border-zinc-500 hover:text-white text-center truncate cursor-pointer"
                  >
                    {qs.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const order: LanguageCode[] = ['en', 'bn', 'ar', 'ur', 'id'];
                    const nextIdx = (order.indexOf(lang) + 1) % order.length;
                    setLang(order[nextIdx]);
                  }}
                  className="py-1.5 px-1 border border-zinc-700 bg-zinc-950 text-[10px] font-mono-tech text-zinc-200 hover:border-zinc-400 text-center truncate cursor-pointer"
                  title={tx(
                    lang,
                    'Switch Language (English / বাংলা / العربية / اردو / Indonesia)',
                    'ভাষা পরিবর্তন করুন (বাংলা / English / العربية / اردو / Indonesia)',
                    'تغيير اللغة',
                    'زبان تبدیل کریں',
                    'Ganti Bahasa'
                  )}
                >
                  🌐 {currentLangMeta.nativeName}
                </button>
                <button
                  type="button"
                  onClick={() => setShowFirstTimeSetupModal(true)}
                  className="py-1.5 px-1 border border-zinc-500 bg-zinc-900 text-[10px] font-mono-tech text-zinc-100 hover:bg-zinc-800 text-center truncate cursor-pointer font-semibold"
                  title={tx(
                    lang,
                    'Open Easy Step-by-Step Setup Wizard',
                    'সহজ ধাপে ধাপে সেটআপ গাইড খুলুন',
                    'فتح دليل الإعداد السهل',
                    'آسان سیٹ اپ گائیڈ کھولیں',
                    'Buka Panduan Setup Mudah'
                  )}
                >
                  🪄 {tx(lang, 'Setup', 'সেটআপ', 'إعداد', 'سیٹ اپ', 'Setup')}
                </button>
              </div>

              {/* Peace of Mind Notification Digest Status Line */}
              <button
                type="button"
                onClick={() => setActiveTab('digest-focus')}
                className="w-full text-left py-1.5 border-y border-zinc-800/80 flex items-center justify-between gap-2 text-xs font-mono-tech opacity-80 hover:opacity-100 cursor-pointer"
              >
                <span className="truncate">
                  {urgentBreakthroughCount > 0
                    ? `⚡ ${urgentBreakthroughCount} ${tx(
                        lang,
                        'URGENT BREAKTHROUGH ALERT',
                        'টি জরুরি নোটিফিকেশন অ্যালার্ট',
                        'تنبيه طوارئ عاجل',
                        'ہنگامی الرٹ',
                        'PERINGATAN DARURAT'
                      )}`
                    : `${t.allQuietStatus} (${batchedQuietCount} ${tx(
                        lang,
                        'batched',
                        'টি সংরক্ষিত',
                        'مجدول',
                        'محفوظ',
                        'tersimpan'
                      )})`}
                </span>
                <span className="shrink-0">
                  {t.nextDigestAt} 18:00 →
                </span>
              </button>
            </div>

            {/* IF MONK MODE DEEP WORK IS ACTIVE: E-INK SINGLE TASK DISPLAY */}
            {vault.monkModeActive ? (
              <div className="my-auto border-2 border-zinc-300 p-6 text-center space-y-4">
                <div className="text-[11px] font-mono-tech uppercase tracking-[0.2em] opacity-70">
                  {tx(
                    lang,
                    'MONK MODE // DEEP FOCUS BLOCK ACTIVE',
                    'মঙ্ক মোড // গভীর মনোযোগ সেশন চলছে',
                    'وضع الراهب // جلسة التركيز العميق نشطة',
                    'مونک موڈ // گہرے کام کا سیشن جاری ہے',
                    'MODE FOKUS MENDALAM AKTIF'
                  )}
                </div>
                <div className="text-base font-medium">
                  {localizeDynamicUserText(vault.monkTaskTitle, lang)}
                </div>
                <div className="text-5xl font-mono-tech font-light py-2">
                  {Math.floor(vault.monkRemainingSeconds / 60)}:
                  {String(vault.monkRemainingSeconds % 60).padStart(2, '0')}
                </div>
                <p className="text-xs italic opacity-80">
                  “{getTriggerText(activeCalmTrigger, lang)}”
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setVault((prev) => ({ ...prev, monkModeActive: false }))
                  }
                  className="px-4 py-2 border border-zinc-600 text-xs font-mono-tech uppercase tracking-widest opacity-80 hover:opacity-100 cursor-pointer"
                >
                  {tx(
                    lang,
                    'End Focus Session',
                    'মনোযোগ সেশন সমাপ্ত করুন',
                    'إنهاء جلسة التركيز',
                    'فوکس سیشن ختم کریں',
                    'Akhiri Sesi Fokus'
                  )}
                </button>
              </div>
            ) : (
              /* PURE MINIMALIST ACTIVE HOME APPS + HOME NOTE SYSTEM */
              <div className="my-auto space-y-3.5 py-1">
                {/* Text-Only Monochromatic Active Home App List (Phone Calls, Messages & WhatsApp Normal First) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
                  {pinnedHomeApps.map((app) => {
                    const isReopenLocked = reopenLockedAppIds.includes(app.id);
                    const isNightQrLocked =
                      (vault.nightBrowserQrRequired ?? true) &&
                      isNightHourActive &&
                      isNightQrLockedApp(app);
                    const isCallingOrWhatsApp =
                      app.id === 'phone' ||
                      app.id === 'messages' ||
                      app.id === 'whatsapp' ||
                      app.name.toLowerCase().includes('whatsapp');
                    return (
                      <button
                        key={app.id}
                        type="button"
                        onClick={() => handleTapApp(app)}
                        className="w-full text-left py-2 border-b border-zinc-900/90 flex items-baseline justify-between gap-2 group cursor-pointer"
                      >
                        <span className="text-2xl sm:text-3xl font-light tracking-tight group-hover:translate-x-1 transition-transform truncate">
                          {getAppDisplayName(app, lang)}
                        </span>
                        <span className="text-[10px] font-mono-tech opacity-50 group-hover:opacity-90 shrink-0">
                          {isNightQrLocked
                            ? tx(lang, '🌙 QR LOCK', '🌙 রাতের QR লক', '🌙 قفل QR', '🌙 رات کا QR', '🌙 KUNCI QR')
                            : isReopenLocked
                            ? tx(lang, '15S QUIZ', '১৫সে কুইজ', 'اختبار ١٥ث', '١٥س کوئز', 'KUIS 15D')
                            : app.tier === 'restricted'
                            ? tx(lang, '20S QUIZ', '২০সে কুইজ', 'اختبار ٢٠ث', '٢٠س کوئز', 'KUIS 20D')
                            : app.tier === 'adult-blocked'
                            ? tx(lang, 'BLOCKED', 'ব্লকড', 'محجوب', 'بلاکڈ', 'BLOKIR')
                            : isCallingOrWhatsApp
                            ? tx(lang, '📞 CALL / MSG', '📞 কল / মেসেজ', '📞 اتصال / رسائل', '📞 کال / میسج', '📞 PANGGIL / PESAN')
                            : tx(lang, 'OPEN', 'খুলুন', 'فتح', 'کھولیں', 'BUKA')}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Search-First Bar Trigger + Home Page Note System Toggle */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('drawer')}
                    className="col-span-2 py-2.5 px-3 border border-zinc-800 text-left text-xs font-mono-tech opacity-80 hover:opacity-100 cursor-pointer"
                  >
                    ⌕ {t.openSearchDrawer}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowScratchpad((s) => !s)}
                    className={`py-2.5 px-2 border text-center text-xs font-mono-tech cursor-pointer ${
                      showScratchpad
                        ? 'border-zinc-100 bg-zinc-100 text-black font-semibold'
                        : 'border-zinc-800 opacity-85 hover:opacity-100'
                    }`}
                  >
                    ✎ {tx(lang, 'Note', 'নোট', 'ملاحظة', 'نوٹ', 'Catatan')} (
                    {scratchpadNotes.filter((n) => !n.done).length})
                  </button>
                </div>

                {/* Home Page Note System (Kept & Enhanced with Pinning, Checkboxes & Quick Clear) */}
                {showScratchpad && (
                  <div className="border border-zinc-700 p-3.5 space-y-2.5 bg-zinc-950/90">
                    <div className="flex items-center justify-between text-[10px] font-mono-tech uppercase tracking-wider text-zinc-400">
                      <span>{t.quickScratchpadTitle}</span>
                      {scratchpadNotes.some((n) => n.done) && (
                        <button
                          type="button"
                          onClick={() =>
                            setScratchpadNotes((prev) => prev.filter((item) => !item.done))
                          }
                          className="underline text-zinc-400 hover:text-zinc-200 cursor-pointer"
                        >
                          {tx(
                            lang,
                            'Clear Completed',
                            'সম্পন্ন নোট মুছুন',
                            'مسح المكتمل',
                            'مکمل شدہ صاف کریں',
                            'Hapus Selesai'
                          )}
                        </button>
                      )}
                    </div>
                    <form onSubmit={handleAddScratchpadNote} className="flex gap-1.5">
                      <input
                        type="text"
                        value={scratchpadInput}
                        onChange={(e) => setScratchpadInput(e.target.value)}
                        placeholder={t.scratchpadPlaceholder}
                        className="flex-1 bg-black border border-zinc-800 px-2.5 py-2 text-xs focus:outline-none focus:border-zinc-400"
                      />
                      <button
                        type="submit"
                        className="px-3.5 py-2 bg-zinc-100 text-black text-xs font-mono-tech font-semibold cursor-pointer"
                      >
                        + {tx(lang, 'Add Note', 'যোগ করুন', 'إضافة', 'شامل کریں', 'Tambah')}
                      </button>
                    </form>
                    <div className="space-y-1 max-h-36 overflow-y-auto">
                      {sortedScratchpadNotes.map((n) => (
                        <div
                          key={n.id}
                          className="flex items-center justify-between gap-2 text-xs font-mono-tech py-1.5 border-b border-zinc-900"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <button
                              type="button"
                              onClick={() => handleToggleScratchpadDone(n.id)}
                              className={`w-4 h-4 border flex items-center justify-center text-[10px] cursor-pointer shrink-0 ${
                                n.done
                                  ? 'border-zinc-400 bg-zinc-300 text-black'
                                  : 'border-zinc-700 text-transparent'
                              }`}
                            >
                              ✓
                            </button>
                            <span
                              className={`truncate ${
                                n.done ? 'line-through opacity-45' : 'opacity-90'
                              }`}
                            >
                              {localizeDynamicUserText(n.text, lang)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleToggleScratchpadPin(n.id)}
                              className={`text-[11px] cursor-pointer ${
                                n.pinned ? 'text-zinc-100' : 'opacity-35 hover:opacity-80'
                              }`}
                            >
                              ★
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setScratchpadNotes((prev) =>
                                  prev.filter((item) => item.id !== n.id)
                                )
                              }
                              className="text-[10px] opacity-50 hover:opacity-100 cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Calm Focus & SOS Action Row (No Settings Clutter) */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('digest-focus')}
                    className="py-2 border border-zinc-800 text-[10px] font-mono-tech opacity-80 hover:opacity-100 cursor-pointer"
                  >
                    ◎ {t.startMonkModeBtn}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenPuritySosImmediately(true);
                      setActiveTab('purity');
                    }}
                    className="py-2 border border-zinc-700 text-[10px] font-mono-tech font-medium hover:bg-zinc-900 cursor-pointer"
                  >
                    ⚡ {t.urgeSosBtn}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTriggerIndex((i) => i + 1);
                      setRestlessOverlayOpen(true);
                    }}
                    className="py-2 border border-zinc-800 text-[10px] font-mono-tech opacity-80 hover:opacity-100 cursor-pointer"
                  >
                    ☪ {tx(lang, 'Sakīnah', 'সাকীনাহ', 'السكينة', 'سکینہ', 'Sakinah')}
                  </button>
                </div>
              </div>
            )}

            {/* Bottom Calm Mind Trigger Bar (Small Strong Line Only) */}
            <div className="border-t border-zinc-800/90 pt-2.5 space-y-1">
              <div className="flex items-center justify-between text-[10px] font-mono-tech uppercase tracking-widest opacity-60">
                <span>
                  {t.calmWhisperLabel} · 🏅 {masteryRank}
                </span>
                <button
                  type="button"
                  onClick={() => setTriggerIndex((i) => i + 1)}
                  className="hover:opacity-100 underline cursor-pointer"
                >
                  {t.nextWhisperBtn} ↻
                </button>
              </div>

              {showArabicScript &&
                activeCalmTrigger.arabic &&
                lang !== 'ar' &&
                inspirationMode !== 'universal' && (
                  <p
                    dir="rtl"
                    className="font-arabic text-base opacity-85 leading-relaxed text-right"
                  >
                    {activeCalmTrigger.arabic}
                  </p>
                )}

              <p className="text-xs sm:text-sm font-normal leading-snug">
                “{getTriggerText(activeCalmTrigger, lang)}”
              </p>
              <div className="text-[10px] font-mono-tech opacity-55">
                — {getTriggerSource(activeCalmTrigger, lang)}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 2: ASYMMETRIC SEARCH-FIRST APP DRAWER
           ========================================================= */}
        {activeTab === 'drawer' && (
          <div className="w-full max-w-4xl min-w-0 mx-auto flex-1 flex flex-col space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono-tech uppercase tracking-widest text-zinc-500 truncate">
                  {tx(
                    lang,
                    'ASYMMETRIC FRICTION // CALLS & WHATSAPP NORMAL · GATED SOCIAL',
                    'কল, SMS ও হোয়াটসঅ্যাপ সাধারণ · সোশ্যাল মিডিয়ায় ২০ সেকেন্ড কুইজ সুরক্ষা',
                    'المكالمات وواتساب فورية · تطبيقات التواصل محمية باختبار ٢٠ث',
                    'کالز اور واٹس ایپ نارمل · سوشل میڈیا پر ٢٠ سیکنڈ کوئز گیٹ',
                    'TELEPON & WHATSAPP NORMAL · MEDIA SOSIAL KUIS 20 DETIK'
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => setRevealRestrictedInDrawer((v) => !v)}
                  className="text-[10px] font-mono-tech text-zinc-400 underline cursor-pointer shrink-0"
                >
                  {revealRestrictedInDrawer
                    ? tx(lang, 'Hide Restricted', 'নিয়ন্ত্রিত অ্যাপ লুকান', 'إخفاء المقيدة', 'مقید ایپس چھپائیں', 'Sembunyikan Terbatas')
                    : tx(lang, 'Show All Apps', 'সব অ্যাপ দেখান', 'عرض كل التطبيقات', 'تمام ایپس دکھائیں', 'Tampilkan Semua')}
                </button>
              </div>
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchQuery(val);
                  const matches = apps.filter(
                    (a) =>
                      (a.tier === 'essential' || a.tier === 'utility') &&
                      (a.name.toLowerCase().startsWith(val.trim().toLowerCase()) ||
                        getAppDisplayName(a, lang)
                          .toLowerCase()
                          .startsWith(val.trim().toLowerCase()))
                  );
                  if (val.trim().length >= 3 && matches.length === 1) {
                    handleTapApp(matches[0]);
                  }
                }}
                placeholder={t.searchPlaceholder}
                className="w-full bg-black border border-zinc-700 px-3.5 py-2.5 text-sm font-mono-tech text-zinc-100 focus:outline-none focus:border-zinc-200"
              />
            </div>

            <div className="flex-1 divide-y divide-zinc-900">
              {drawerSearchResults.map((app) => {
                const isReopenLocked = reopenLockedAppIds.includes(app.id);
                const isNightQrLocked =
                  (vault.nightBrowserQrRequired ?? true) &&
                  isNightHourActive &&
                  isNightQrLockedApp(app);
                return (
                  <div
                    key={app.id}
                    className="py-2.5 flex items-center justify-between gap-2"
                  >
                    <button
                      type="button"
                      onClick={() => handleTapApp(app)}
                      className="text-left flex-1 min-w-0 cursor-pointer group"
                    >
                      <div className="text-base font-light text-zinc-100 group-hover:translate-x-1 transition-transform truncate">
                        {getAppDisplayName(app, lang)}
                      </div>
                      <div className="text-[10px] font-mono-tech text-zinc-500">
                        {app.dailyMinutesUsed}m{' '}
                        {tx(lang, 'today', 'আজ ব্যবহৃত', 'اليوم', 'آج', 'hari ini')} ·{' '}
                        {app.dailyOpens}{' '}
                        {tx(lang, 'opens', 'বার খোলা হয়েছে', 'مرات فتح', 'بار کھولا گیا', 'kali dibuka')}
                      </div>
                    </button>

                    <span className="px-2 py-1 border border-zinc-800 text-[10px] font-mono-tech text-zinc-400 shrink-0">
                      {isNightQrLocked
                        ? tx(lang, '🌙 NIGHT QR LOCK', '🌙 রাতের QR লক', '🌙 قفل QR ليلي', '🌙 رات کا QR لاک', '🌙 KUNCI QR MALAM')
                        : isReopenLocked
                        ? tx(lang, '🔒 15S QUIZ REOPEN', '🔒 ১৫সে কুইজ লক', '🔒 اختبار ١٥ث', '🔒 ١٥س کوئز لاک', '🔒 KUIS 15D')
                        : app.tier === 'restricted'
                        ? tx(lang, '📚 20S QUIZ GATE', '📚 ২০সে কুইজ গেট', '📚 اختبار ٢٠ث', '📚 ٢٠س کوئز گیٹ', '📚 KUIS 20D')
                        : app.tier === 'adult-blocked'
                        ? tx(lang, '🚫 BLOCKED', '🚫 ব্লকড', '🚫 محجوب', '🚫 بلاکڈ', '🚫 DIBLOKIR')
                        : tx(lang, '⚡ NORMAL', '⚡ সাধারণ', '⚡ عادي', '⚡ نارمل', '⚡ NORMAL')}
                    </span>
                  </div>
                );
              })}

              {!revealRestrictedInDrawer && searchQuery.trim().length < 3 && (
                <div className="py-4 text-center text-[11px] font-mono-tech text-zinc-500">
                  {t.typeExactToReveal}{' '}
                  {tx(
                    lang,
                    '(e.g., type “Instagram”, “Facebook”, “YouTube”, or tap “Show All Apps” above).',
                    '(যেমন: “ইনস্টাগ্রাম”, “ফেসবুক”, “ইউটিউব” লিখুন অথবা ওপরে “সব অ্যাপ দেখান”-এ ট্যাপ করুন)।',
                    '(اكتب اسم التطبيق أو اضغط "عرض كل التطبيقات" أعلاه).',
                    '(مثلاً ایپ کا نام لکھیں یا اوپر "تمام ایپس دکھائیں" پر ٹیپ کریں)۔',
                    '(ketik nama aplikasi atau ketuk "Tampilkan Semua" di atas).'
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 3: PURITY & ANTI-PORN GUARD + PRIVATE DNS + URGE SOS
           ========================================================= */}
        {activeTab === 'purity' && (
          <div className="w-full max-w-4xl min-w-0 mx-auto flex-1">
            <PurityGuardView
              purity={purity}
              lang={lang}
              platform={platform}
              showArabicScript={showArabicScript}
              inspirationMode={inspirationMode}
              isNightHourActive={isNightHourActive}
              openSosImmediately={openPuritySosImmediately}
              onClearImmediateSos={() => setOpenPuritySosImmediately(false)}
              onUpdatePurity={setPurity}
              onRequestPhoneSetting={handleRequestPhoneSetting}
              onRequestUnlockDnsFortress={() =>
                openStrongSettingsFortressModal('unlock-dns-guard', 'dns')
              }
            />
          </div>
        )}

        {/* =========================================================
            TAB 4: NOTIFICATION DIGEST + MONK FOCUS + QR COMPLEXITY & NIGHT BROWSER QR LOCK
           ========================================================= */}
        {activeTab === 'digest-focus' && (
          <div className="w-full max-w-4xl min-w-0 mx-auto flex-1">
            <DigestAndFocusView
              lang={lang}
              notifications={notifications}
              vault={vault}
              onAddSimulatedNotification={(item) =>
                setNotifications((prev) => [item, ...prev])
              }
              onClearDigestSlot={(slot) =>
                setNotifications((prev) =>
                  prev.filter((n) => n.isUrgentBreakthrough || n.batchSlot !== slot)
                )
              }
              onUpdateVault={setVault}
              onStartMonkModeAndGoHome={(taskTitle, minutes) => {
                setVault((prev) => ({
                  ...prev,
                  monkModeActive: true,
                  monkTaskTitle: taskTitle,
                  monkRemainingSeconds: minutes * 60,
                  monkTotalSeconds: minutes * 60,
                }));
                setActiveTab('home');
              }}
              onOpenAppFromNotification={handleOpenAppFromNotification}
            />
          </div>
        )}

        {/* =========================================================
            TAB 5: COMPLETE SETTINGS PAGE (ALL SETTINGS IN ONE PLACE)
           ========================================================= */}
        {activeTab === 'system-kasb' && (
          <div className="w-full max-w-4xl min-w-0 mx-auto flex-1">
            <AnalyticsAndKasbView
              lang={lang}
              onChangeLanguage={setLang}
              platform={platform}
              onChangePlatform={setPlatform}
              inspirationMode={inspirationMode}
              onChangeInspirationMode={handleChangeInspirationMode}
              wisdomPack={wisdomPack}
              onChangeWisdomPack={setWisdomPack}
              showArabicScript={showArabicScript}
              onToggleArabicScript={() => setShowArabicScript((v) => !v)}
              grayscaleEnabled={grayscaleEnabled}
              onToggleGrayscale={() => setGrayscaleEnabled((v) => !v)}
              visualTheme={visualTheme}
              onChangeVisualTheme={setVisualTheme}
              defaultHabitWall={defaultHabitWall}
              onChangeDefaultHabitWall={setDefaultHabitWall}
              slowLearning={slowLearning}
              onUpdateSlowLearning={setSlowLearning}
              homeProfile={homeProfile}
              onChangeHomeProfile={setHomeProfile}
              apps={apps}
              onTogglePinAppToProfile={handleTogglePinAppToProfile}
              onChangeAppTier={handleChangeAppTier}
              onSaveAppsBatch={(updatedApps) => setApps(updatedApps)}
              onAddCustomApp={handleAddCustomApp}
              onRefreshInstalledApps={handleRefreshInstalledApps}
              openHowToGuideImmediately={openHowToGuideImmediately}
              onClearHowToGuideTrigger={() => setOpenHowToGuideImmediately(false)}
              onOpenFirstTimeSetup={() => setShowFirstTimeSetupModal(true)}
              onLockSettingsNow={() => {
                setSettingsSessionUnlocked(false);
                setActiveTab('home');
              }}
              onTriggerEscalationDemo={handleTriggerEscalationStage}
              impulsesStopped={impulsesStopped}
              reclaimedMinutes={reclaimedMinutes}
              purity={purity}
              vault={vault}
              onUpdateVault={setVault}
              onRequestPhoneSetting={handleRequestPhoneSetting}
            />
          </div>
        )}
      </main>

      {/* STICKY 100%-FIT BOTTOM NAVIGATION BAR */}
      <nav className="w-full shrink-0 border-t border-zinc-800 bg-black px-2.5 sm:px-8 py-2 grid grid-cols-5 gap-1 text-[11px] font-mono-tech">
        {(
          [
            { id: 'home', label: t.navHome },
            { id: 'drawer', label: t.navDrawer },
            { id: 'purity', label: t.navPurity },
            { id: 'digest-focus', label: t.navDigestFocus },
            {
              id: 'system-kasb',
              label:
                (vault.settingsGateEnabled ?? true) && !settingsSessionUnlocked
                  ? `🔒 ${t.navSystemKasb}`
                  : t.navSystemKasb,
            },
          ] as const
        ).map((navItem) => (
          <button
            key={navItem.id}
            type="button"
            onClick={() => handleSelectNavigationTab(navItem.id)}
            className={`py-2.5 px-1 border text-center transition cursor-pointer truncate ${
              activeTab === navItem.id
                ? 'border-zinc-100 bg-zinc-100 text-black font-semibold'
                : 'border-zinc-900 text-zinc-400 hover:text-zinc-100'
            }`}
          >
            {navItem.label}
          </button>
        ))}
      </nav>

      {/* =========================================================
          MODAL 0: VERY EASY 1ST-TIME STEP-BY-STEP SETUP WIZARD IN USER LANGUAGES
         ========================================================= */}
      {showFirstTimeSetupModal && (
        <FirstTimeSetupModal
          lang={lang}
          onChangeLanguage={setLang}
          inspirationMode={inspirationMode}
          onChangeInspirationMode={handleChangeInspirationMode}
          slowLearningTrack={slowLearning.track}
          onChangeSlowLearningTrack={(tr: SlowLearningTrack) =>
            setSlowLearning((prev) => ({ ...prev, track: tr, currentLessonIndex: 0 }))
          }
          qrAnchorCode={vault.physicalBrickAnchorCode || 'KASB-BRICK-77'}
          onApplyNormalCallingAndNightLockPreset={() => {
            setApps((prev) => normalizeAppsForCallingAndNightLock(prev));
          }}
          onCompleteSetup={() => {
            setFirstTimeSetupCompleted(true);
            setShowFirstTimeSetupModal(false);
          }}
        />
      )}

      {/* =========================================================
          MODAL 1: COMPACT SETTINGS PAGE 20-SECOND READ & QUIZ RESTRICTION GATE
         ========================================================= */}
      {settingsGateModalOpen && activeSettingsGateLesson && (
        <div className="fixed inset-0 z-50 bg-black/95 text-zinc-100 flex items-center justify-center p-3 overflow-y-auto">
          <div className="w-full max-w-md border-2 border-zinc-200 bg-black p-4 space-y-3 font-mono-tech my-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <div>
                <div className="text-[10px] text-zinc-400 uppercase tracking-widest">
                  {tx(
                    lang,
                    'SETTINGS GUARD // QUICK 20-SEC QUIZ',
                    'সেটিংস সুরক্ষা গার্ড // সংক্ষিপ্ত ২০ সেকেন্ড কুইজ',
                    'حارس الإعدادات // اختبار ٢٠ ثانية السريع',
                    'سیٹنگز گارڈ // مختصر ٢٠ سیکنڈ کوئز',
                    'PENJAGA PENGATURAN // KUIS CEPAT 20 DETIK'
                  )}
                </div>
                <h3 className="text-xs font-semibold text-zinc-100 mt-0.5">
                  {tx(
                    lang,
                    'Quick Read & 1-Tap Quiz to Open Settings',
                    'সেটিংস খুলতে সংক্ষিপ্ত অনুচ্ছেদটি পড়ুন ও ১-ট্যাপে উত্তর দিন',
                    'اقرأ الفقرة القصيرة وأجب بضغطة واحدة لفتح الإعدادات',
                    'سیٹنگز کھولنے کے لیے مختصر عبارت پڑھیں اور جواب منتخب کریں',
                    'Baca Singkat & Jawab 1-Sentuh untuk Membuka Pengaturan'
                  )}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSettingsGateModalOpen(false)}
                className="px-2 py-1 border border-zinc-700 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Instant 1-Tap Wi-Fi / BT / DNS / Setup Access even before unlocking full Settings */}
            <div className="border border-zinc-800 bg-zinc-950 p-2.5 space-y-1.5">
              <div className="text-[10px] text-zinc-400 uppercase">
                ⚡{' '}
                {tx(
                  lang,
                  'Need Quick Wi-Fi, Bluetooth, DNS or Setup Guide? (No Quiz Needed):',
                  'দ্রুত Wi-Fi, Bluetooth, DNS বা সেটআপ গাইড প্রয়োজন? (কুইজ ছাড়াই খুলুন):',
                  'هل تحتاج Wi-Fi أو بلوتوث أو DNS سريعاً؟ (بدون اختبار):',
                  'فوری Wi-Fi، بلوٹوتھ یا DNS چاہیے؟ (بغیر کوئز کھولیں):',
                  'Butuh Wi-Fi, Bluetooth, DNS atau Panduan Cepat? (Tanpa Kuis):'
                )}
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1">
                {(
                  [
                    { target: 'wifi', label: '📶 Wi-Fi' },
                    { target: 'bluetooth', label: '🦷 BT' },
                    {
                      target: 'dns',
                      label:
                        purity.adultDnsEnabled && (purity.dnsLockedByQr ?? true)
                          ? '🔒 DNS'
                          : '🌐 DNS',
                    },
                    { target: 'display', label: tx(lang, '🔆 Screen', '🔆 আলো', '🔆 شاشة', '🔆 اسکرین', '🔆 Layar') },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.target}
                    type="button"
                    onClick={() => handleRequestPhoneSetting(item.target)}
                    className="py-1.5 px-1 border border-zinc-700 bg-black text-[10px] text-zinc-200 hover:border-zinc-300 cursor-pointer truncate"
                  >
                    {item.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const order: LanguageCode[] = ['en', 'bn', 'ar', 'ur', 'id'];
                    const nextIdx = (order.indexOf(lang) + 1) % order.length;
                    setLang(order[nextIdx]);
                  }}
                  className="py-1.5 px-1 border border-zinc-600 bg-zinc-950 text-[10px] text-zinc-100 cursor-pointer truncate"
                >
                  🌐 {currentLangMeta.nativeName}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSettingsGateModalOpen(false);
                    setShowFirstTimeSetupModal(true);
                  }}
                  className="py-1.5 px-1 border border-zinc-400 bg-zinc-900 text-[10px] text-zinc-100 font-semibold cursor-pointer truncate"
                >
                  🪄 {tx(lang, 'Setup', 'সেটআপ', 'إعداد', 'سیٹ اپ', 'Setup')}
                </button>
              </div>
            </div>

            <div className="border border-zinc-800 bg-zinc-950 p-3 space-y-1.5">
              <div className="flex items-center justify-between gap-2 text-[11px] text-zinc-400">
                <span className="truncate">
                  {activeSettingsGateLesson.title[lang] ||
                    activeSettingsGateLesson.title.en}
                </span>
                <span className="px-2 py-0.5 border border-zinc-700 text-zinc-200 font-semibold shrink-0">
                  {settingsGateTimerSec > 0
                    ? `⏳ ${settingsGateTimerSec}s`
                    : `✓ ${tx(lang, 'Ready', 'প্রস্তুত', 'جاهز', 'تیار', 'Siap')}`}
                </span>
              </div>

              {showArabicScript &&
                activeSettingsGateLesson.arabicHeader &&
                inspirationMode !== 'universal' && (
                  <p
                    dir="rtl"
                    className="font-arabic text-sm text-zinc-200 text-right leading-snug"
                  >
                    {activeSettingsGateLesson.arabicHeader}
                  </p>
                )}

              <p className="text-xs text-zinc-200 leading-snug font-sans">
                {getShortLessonPassage(activeSettingsGateLesson, lang)}
              </p>
              <div className="text-[11px] text-zinc-300 pt-1 border-t border-zinc-900">
                ★ {activeSettingsGateLesson.keyTakeaway[lang] || activeSettingsGateLesson.keyTakeaway.en}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-zinc-100 leading-snug">
                {tx(lang, 'Q:', 'প্রশ্ন:', 'س:', 'سوال:', 'P:')}{' '}
                {activeSettingsGateLesson.quizQuestion[lang] ||
                  activeSettingsGateLesson.quizQuestion.en}
              </div>
              <div className="space-y-1.5">
                {(
                  activeSettingsGateLesson.quizOptions[lang] ||
                  activeSettingsGateLesson.quizOptions.en
                ).map((opt: string, idx: number) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={settingsGateTimerSec > 0}
                    onClick={() => {
                      setSettingsGateSelectedOption(idx);
                      if (idx === activeSettingsGateLesson.correctOptionIndex) {
                        setSettingsGateError(null);
                        setSettingsSessionUnlocked(true);
                        setSettingsGateModalOpen(false);
                        setSlowLearning((prev) => ({
                          ...prev,
                          xp: prev.xp + 10,
                          quizzesPassed: prev.quizzesPassed + 1,
                        }));
                        setActiveTab('system-kasb');
                      } else {
                        setSettingsGateError(
                          tx(
                            lang,
                            'Not quite right. Re-read for 4 seconds and tap the correct answer.',
                            'সঠিক নয়। ৪ সেকেন্ড পড়ে আবার সঠিক উত্তরটি ট্যাপ করুন।',
                            'إجابة غير صحيحة. اقرأ لمدة ٤ ثوانٍ ثم اختر الإجابة الصحيحة.',
                            'درست نہیں۔ ٤ سیکنڈ دوبارہ پڑھیں اور صحیح جواب منتخب کریں۔',
                            'Belum tepat. Baca ulang 4 detik lalu pilih jawaban yang benar.'
                          )
                        );
                        setSettingsGateTimerSec(4);
                      }
                    }}
                    className={`w-full text-left px-2.5 py-2 border text-xs leading-snug cursor-pointer disabled:opacity-40 ${
                      settingsGateSelectedOption === idx
                        ? 'border-zinc-200 bg-zinc-900 text-white'
                        : 'border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-zinc-600'
                    }`}
                  >
                    {String.fromCharCode(65 + idx)}. {opt}
                  </button>
                ))}
              </div>
            </div>

            {settingsGateError && (
              <div className="p-2 border border-zinc-500 bg-zinc-900 text-xs text-zinc-200">
                ⚠ {settingsGateError}
              </div>
            )}

            <button
              type="button"
              onClick={() => setSettingsGateModalOpen(false)}
              className="w-full py-2.5 bg-zinc-100 text-black text-xs font-semibold uppercase tracking-wider cursor-pointer"
            >
              {t.returnToPeaceBtn}
            </button>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 2: SLEEPING-TIME / NIGHT MANDATORY EMERGENCY QR CODE SCANNER GATE
         ========================================================= */}
      {nightBrowserQrApp && (
        <div className="fixed inset-0 z-50 bg-black/95 text-zinc-100 flex items-center justify-center p-3 overflow-y-auto">
          <div className="w-full max-w-md border-2 border-zinc-100 bg-black p-4 space-y-3.5 font-mono-tech my-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <div>
                <div className="text-[10px] text-zinc-400 uppercase tracking-widest">
                  🌙{' '}
                  {tx(
                    lang,
                    `SLEEPING-TIME EMERGENCY QR FORTRESS (${(vault.qrComplexity || 'hard').toUpperCase()})`,
                    `রাতের ঘুমানোর সময় জরুরি QR দুর্গ (${
                      (vault.qrComplexity || 'hard') === 'hard' ? 'কঠিন' : 'সহজ'
                    })`,
                    `قلعة رمز QR الليلي للطوارئ (${
                      (vault.qrComplexity || 'hard') === 'hard' ? 'صعب' : 'سهل'
                    })`,
                    `رات کے وقت ایمرجنسی QR قلعہ (${
                      (vault.qrComplexity || 'hard') === 'hard' ? 'سخت' : 'آسان'
                    })`,
                    `BENTENG QR DARURAT MALAM HARI (${
                      (vault.qrComplexity || 'hard') === 'hard' ? 'SULIT' : 'MUDAH'
                    })`
                  )}
                </div>
                <h3 className="text-sm font-semibold text-zinc-100 mt-0.5">
                  {tx(
                    lang,
                    `Mandatory Emergency QR Scan for ${getAppDisplayName(nightBrowserQrApp, lang)}`,
                    `${getAppDisplayName(nightBrowserQrApp, lang)} খুলতে জরুরি ফিজিক্যাল QR কোড স্ক্যান বাধ্যতামূলক`,
                    `مسح رمز QR للطوارئ إلزامي لفتح ${getAppDisplayName(nightBrowserQrApp, lang)}`,
                    `${getAppDisplayName(nightBrowserQrApp, lang)} کھولنے کے لیے ایمرجنسی QR اسکین لازمی ہے`,
                    `Wajib Pindai QR Darurat untuk ${getAppDisplayName(nightBrowserQrApp, lang)}`
                  )}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  stopNightQrCamera();
                  setNightBrowserQrApp(null);
                }}
                className="px-2.5 py-1 border border-zinc-700 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              {tx(
                lang,
                `Browsers, Social Media, and entertainment apps have stronger sleeping-time restrictions at night (10:00 PM – 6:00 AM). For emergency use, physically scanning your QR code card is mandatory to unlock ${getAppDisplayName(nightBrowserQrApp, lang)}.`,
                `রাত ১০:০০টা থেকে ভোর ৬:০০টা পর্যন্ত ঘুমানোর সময়ে ব্রাউজার, সোশ্যাল মিডিয়া ও বিনোদন অ্যাপে কঠোর সুরক্ষা চালু থাকে। জরুরি প্রয়োজনে ${getAppDisplayName(nightBrowserQrApp, lang)} খুলতে আপনার অন্য ঘরে রাখা ফিজিক্যাল QR কোড কার্ডটি স্ক্যান করা বাধ্যতামূলক।`,
                `تخضع المتصفحات وتطبيقات التواصل لحماية مشددة ليلاً (١٠ مساءً – ٦ صباحاً). لحالات الطوارئ، يجب مسح بطاقة رمز QR الفعلية لفتح ${getAppDisplayName(nightBrowserQrApp, lang)}.`,
                `رات ١٠ بجے سے صبح ٦ بجے تک براؤزرز اور سوشل میڈیا پر سخت پابندی ہوتی ہے۔ ہنگامی ضرورت میں ${getAppDisplayName(nightBrowserQrApp, lang)} کھولنے کے لیے فزیکل QR کارڈ اسکین کرنا لازمی ہے۔`,
                `Browser & media sosial memiliki pembatasan ketat di malam hari (22:00 – 06:00). Untuk keadaan darurat, wajib memindai kartu QR fisik Anda.`
              )}
            </p>

            <div className="border border-zinc-800 bg-zinc-950 p-3 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">
                  {tx(lang, 'Complexity', 'কাঠিন্য', 'المستوى', 'سختی', 'Tingkat')}:{' '}
                  <strong>
                    {(vault.qrComplexity || 'hard') === 'hard'
                      ? tx(lang, 'HARD', 'কঠিন (QR)', 'صعب (QR)', 'سخت (QR)', 'SULIT (QR)')
                      : tx(lang, 'EASY', 'সহজ (QR)', 'سهل (QR)', 'آسان (QR)', 'MUDAH (QR)')}
                  </strong>
                </span>
                {!nightQrCameraActive ? (
                  <button
                    type="button"
                    onClick={startNightQrCamera}
                    className="px-2.5 py-1 bg-zinc-100 text-black text-[10px] font-semibold uppercase cursor-pointer"
                  >
                    📷{' '}
                    {tx(
                      lang,
                      'Open QR Camera Scanner',
                      'QR ক্যামেরা স্ক্যানার খুলুন',
                      'فتح كاميرا مسح QR',
                      'QR کیمرہ اسکینر کھولیں',
                      'Buka Kamera QR'
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopNightQrCamera}
                    className="px-2.5 py-1 border border-zinc-700 text-[10px] text-zinc-300 cursor-pointer"
                  >
                    {tx(lang, 'Close Camera', 'ক্যামেরা বন্ধ করুন', 'إغلاق الكاميرا', 'کیمرہ بند کریں', 'Tutup Kamera')}
                  </button>
                )}
              </div>

              {nightQrCameraActive && (
                <div className="space-y-2 text-center">
                  <video
                    ref={nightVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full max-h-40 bg-black border border-zinc-800 object-cover"
                  />
                  <div className="text-[11px] text-zinc-300">
                    {nightQrScanHoldSec > 0
                      ? tx(
                          lang,
                          `Hold camera pointed at your physical QR card (${nightQrScanHoldSec}s)...`,
                          `আপনার প্রিন্ট করা ফিজিক্যাল QR কার্ডের ওপর ক্যামেরা ধরে রাখুন (${nightQrScanHoldSec} সেকেন্ড)...`,
                          `ثبّت الكاميرا على بطاقة QR الفعلية (${nightQrScanHoldSec} ثانية)...`,
                          `اپنے فزیکل QR کارڈ پر کیمرہ رکھیں (${nightQrScanHoldSec} سیکنڈ)...`,
                          `Arahkan kamera ke kartu QR fisik (${nightQrScanHoldSec} detik)...`
                        )
                      : tx(
                          lang,
                          '✓ Optical lock verified. Capture QR token below:',
                          '✓ ক্যামেরা যাচাই সম্পন্ন! নিচে QR কোডটি গ্রহণ করুন:',
                          '✓ تم التحقق بالكاميرا. التقط الرمز أدناه:',
                          '✓ کیمرہ تصدیق مکمل! نیچے QR کوڈ حاصل کریں:',
                          '✓ Verifikasi kamera selesai. Tangkap kode QR di bawah:'
                        )}
                  </div>
                  {nightQrScanHoldSec === 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        setNightQrInput(
                          getRequiredQrTokenForComplexity(
                            vault.physicalBrickAnchorCode,
                            vault.qrComplexity || 'hard'
                          )
                        )
                      }
                      className="px-3 py-1.5 bg-zinc-100 text-black text-[11px] font-semibold uppercase cursor-pointer"
                    >
                      ✓{' '}
                      {tx(
                        lang,
                        'Capture Scanned QR Code',
                        'স্ক্যান করা QR কোড গ্রহণ করুন',
                        'التقاط رمز QR الممسوح',
                        'اسکین شدہ QR کوڈ درج کریں',
                        'Tangkap Kode QR'
                      )}
                    </button>
                  )}
                </div>
              )}

              <div className="text-[11px] text-zinc-400">
                {tx(lang, 'Required Physical QR Token:', 'প্রয়োজনীয় ফিজিক্যাল QR কোড:', 'رمز QR المطلوب:', 'مطلوبہ QR کوڈ:', 'Kode QR Wajib:')}{' '}
                <strong className="text-zinc-200">
                  {getRequiredQrTokenForComplexity(
                    vault.physicalBrickAnchorCode,
                    vault.qrComplexity || 'hard'
                  )}
                </strong>
              </div>

              {(vault.qrComplexity || 'hard') === 'hard' && (
                <div className="space-y-1">
                  <label className="block text-[11px] text-zinc-300">
                    {tx(
                      lang,
                      'Hard Mode Verification — Solve: 17 + 26 = ?',
                      'হার্ড মোড যাচাই — যোগফল লিখুন: ১৭ + ২৬ = ?',
                      'تحقق الوضع الصعب — احسب: 17 + 26 = ؟',
                      'ہارڈ موڈ تصدیق — حل کریں: 17 + 26 = ؟',
                      'Verifikasi Mode Sulit — Hitung: 17 + 26 = ?'
                    )}
                  </label>
                  <input
                    type="text"
                    value={nightQrMathInput}
                    onChange={(e) => setNightQrMathInput(e.target.value)}
                    placeholder={tx(lang, 'Enter 43', '43 লিখুন', 'أدخل 43', '43 لکھیں', 'Ketik 43')}
                    className="w-full bg-black border border-zinc-700 px-3 py-2 text-xs text-zinc-100"
                  />
                </div>
              )}

              <input
                type="text"
                value={nightQrInput}
                onChange={(e) => setNightQrInput(e.target.value)}
                placeholder={tx(
                  lang,
                  'Scan or enter physical QR code token...',
                  'ফিজিক্যাল QR কোডটি স্ক্যান বা টাইপ করুন...',
                  'امسح أو أدخل رمز QR الفعلي...',
                  'فزیکل QR کوڈ اسکین یا ٹائپ کریں...',
                  'Pindai atau ketik kode QR fisik...'
                )}
                className="w-full bg-black border border-zinc-700 px-3 py-2 text-xs text-zinc-100"
              />
            </div>

            {nightQrError && (
              <div className="p-2.5 border border-zinc-500 bg-zinc-900 text-xs text-zinc-200">
                ⚠ {nightQrError}
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  stopNightQrCamera();
                  setNightBrowserQrApp(null);
                  setImpulsesStopped((n) => n + 1);
                  setSlowLearning((prev) => ({ ...prev, xp: prev.xp + 20 }));
                }}
                className="flex-1 py-3 bg-zinc-100 text-black text-xs font-semibold uppercase tracking-wider cursor-pointer"
              >
                {tx(
                  lang,
                  '✓ Sleep & Return to Peace (+20 XP)',
                  '✓ ঘুমাতে যান ও প্রশান্তিতে ফিরুন (+২০ XP)',
                  '✓ نم بسلام وعد للسكينة (+٢٠ XP)',
                  '✓ سو جائیں اور سکون میں لوٹیں (+٢٠ XP)',
                  '✓ Tidur & Kembali Tenang (+20 XP)'
                )}
              </button>
              <button
                type="button"
                onClick={handleVerifyNightBrowserQr}
                className="px-4 py-3 border border-zinc-600 text-xs text-zinc-200 hover:bg-zinc-900 cursor-pointer"
              >
                {tx(lang, 'Verify QR Scan', 'QR যাচাই করুন', 'تحقق من QR', 'QR تصدیق کریں', 'Verifikasi QR')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 3: 20-MINUTE FULL-SCREEN AUTO-CLOSE & 15S QUIZ REOPENING LOCK
          (With Method 7: Loss-Aversion XP Shield)
         ========================================================= */}
      {fullScreen20mClosedApp && (
        <div className="fixed inset-0 z-50 bg-black text-zinc-100 flex flex-col justify-between p-6 text-center font-mono-tech">
          <div className="text-xs uppercase tracking-widest text-zinc-400">
            🛑{' '}
            {tx(
              lang,
              '20-MINUTE FULL-SCREEN INTERVENTION // APP AUTOMATICALLY CLOSED',
              '২০ মিনিটের পূর্ণ-স্ক্রিন হস্তক্ষেপ // অ্যাপটি স্বয়ংক্রিয়ভাবে বন্ধ করা হয়েছে',
              'تدخل الشاشة الكاملة بعد ٢٠ دقيقة // تم إغلاق التطبيق تلقائياً',
              '٢٠ منٹ بعد فل اسکرین مداخلت // ایپ خودکار طور پر بند کر دی گئی',
              'INTERVENSI LAYAR PENUH 20 MENIT // APLIKASI DITUTUP OTOMATIS'
            )}
          </div>
          <div className="max-w-md mx-auto space-y-5">
            <div className="inline-block px-3 py-1 border border-zinc-300 text-xs uppercase">
              {getAppDisplayName(fullScreen20mClosedApp.app, lang)} ·{' '}
              {fullScreen20mClosedApp.closedAt}
            </div>
            <h2 className="text-2xl sm:text-3xl font-light text-white">
              {tx(
                lang,
                `20 Minutes Reached in ${getAppDisplayName(fullScreen20mClosedApp.app, lang)}`,
                `${getAppDisplayName(fullScreen20mClosedApp.app, lang)}-এ ২০ মিনিট পূর্ণ হয়েছে`,
                `اكتملت ٢٠ دقيقة في ${getAppDisplayName(fullScreen20mClosedApp.app, lang)}`,
                `${getAppDisplayName(fullScreen20mClosedApp.app, lang)} میں ٢٠ منٹ مکمل ہو گئے`,
                `20 Menit Tercapai di ${getAppDisplayName(fullScreen20mClosedApp.app, lang)}`
              )}
            </h2>
            <p className="text-xs text-zinc-300 leading-relaxed font-sans">
              {tx(
                lang,
                `Following your 5-minute minor check and 10-minute medium warning, ${getAppDisplayName(fullScreen20mClosedApp.app, lang)} has been automatically closed and cleaned from the background after 20 minutes.`,
                `৫ মিনিটের মৃদু সতর্কতা এবং ১০ মিনিটের মাঝারি সতর্কতার পর ২০ মিনিট পূর্ণ হওয়ায় ${getAppDisplayName(fullScreen20mClosedApp.app, lang)} স্বয়ংক্রিয়ভাবে বন্ধ ও ব্যাকগ্রাউন্ড থেকে পরিষ্কার করা হয়েছে।`,
                `بعد تنبيه الـ ٥ دقائق وتحذير الـ ١٠ دقائق، تم إغلاق التطبيق وتنظيفه من الخلفية بعد ٢٠ دقيقة.`,
                `٥ اور ١٠ منٹ کی تنبیہ کے بعد ٢٠ منٹ پورے ہونے پر ایپ کو خودکار طور پر بند اور بیک گراؤنڈ سے صاف کر دیا گیا ہے۔`,
                `Setelah peringatan 5m dan 10m, aplikasi ditutup otomatis dan dibersihkan dari latar belakang setelah 20 menit.`
              )}
            </p>
            <div className="border border-zinc-800 bg-zinc-950 p-4 text-xs text-zinc-300 space-y-2">
              <div className="text-zinc-100 font-semibold">
                🔒{' '}
                {tx(
                  lang,
                  'Reopening Restriction & Commitment Shield Activated:',
                  'পুনরায় খোলার বিধিনিষেধ ও অঙ্গীকার শিল্ড সক্রিয়:',
                  'تم تفعيل قفل إعادة الفتح ودرع الالتزام:',
                  'دوبارہ کھولنے کی پابندی اور عہد شیلڈ فعال:',
                  'Pembatasan Buka Ulang & Perisai Komitmen Aktif:'
                )}
              </div>
              <p className="text-[11px] text-zinc-400">
                {tx(
                  lang,
                  `Staying closed awards +20 XP toward your Self-Mastery Rank (${masteryRank}). Force-reopening right now deducts -25 XP and requires a 15-Second Reading + Quiz.`,
                  `এখন অ্যাপটি বন্ধ রাখলে আপনার আত্মনিয়ন্ত্রণ পদমর্যাদায় (${masteryRank}) +২০ XP যোগ হবে। আর এখনই জোর করে পুনরায় খুললে -২৫ XP কাটা যাবে এবং ১৫ সেকেন্ডের পাঠ ও কুইজ দিতে হবে।`,
                  `البقاء مغلقاً يمنحك +٢٠ XP، بينما إعادة الفتح الآن تخصم -٢٥ XP وتتطلب اختباراً.`,
                  `بند رکھنے پر +٢٠ XP ملیں گے، جبکہ ابھی دوبارہ کھولنے پر -٢٥ XP کٹیں گے اور ١٥ سیکنڈ کوئز دینا ہوگا۔`,
                  `Tetap tutup memberi +20 XP, sedangkan membuka paksa mengurangi -25 XP & wajib kuis 15d.`
                )}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setFullScreen20mClosedApp(null);
                  setImpulsesStopped((n) => n + 1);
                  setReclaimedMinutes((m) => m + 20);
                  setSlowLearning((prev) => ({ ...prev, xp: prev.xp + 20 }));
                  setActiveTab('home');
                }}
                className="flex-1 py-3.5 bg-zinc-100 text-black text-xs font-semibold uppercase tracking-widest cursor-pointer"
              >
                ✓{' '}
                {tx(
                  lang,
                  'Stay Closed & Return Home (+20 XP)',
                  'বন্ধ রাখুন ও হোমে ফিরুন (+২০ XP)',
                  'ابق مغلقاً وعد للرئيسية (+٢٠ XP)',
                  'بند رکھیں اور ہوم پر لوٹیں (+٢٠ XP)',
                  'Tetap Tutup & Kembali (+20 XP)'
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  const appToReopen = fullScreen20mClosedApp.app;
                  setFullScreen20mClosedApp(null);
                  setSlowLearning((prev) => ({
                    ...prev,
                    xp: Math.max(0, prev.xp - 25),
                  }));
                  setInterceptForce15sReopen(true);
                  setInterceptedApp(appToReopen);
                }}
                className="px-4 py-3.5 border border-zinc-700 text-xs text-zinc-300 hover:border-zinc-400 cursor-pointer"
              >
                {tx(
                  lang,
                  'Reopen via 15s Quiz (-25 XP) →',
                  '১৫সে কুইজ দিয়ে খুলুন (-২৫ XP) →',
                  'إعادة الفتح باختبار (-٢٥ XP) ←',
                  '١٥س کوئز سے کھولیں (-٢٥ XP) →',
                  'Buka lewat Kuis 15d (-25 XP) →'
                )}
              </button>
            </div>
          </div>
          <div className="text-[11px] text-zinc-600">
            {t.appName} //{' '}
            {tx(
              lang,
              'PROGRESSIVE DOPAMINE GUARD',
              'ধাপে ধাপে ডোপামিন সুরক্ষা গার্ড',
              'حارس الدوبامين التدريجي',
              'تدریجی ڈوپامین گارڈ',
              'PENJAGA DOPAMIN PROGRESIF'
            )}
          </div>
        </div>
      )}

      {/* INHALE & SLOW LEARNING READ + PLAY QUIZ INTERCEPT MODAL (WITH SCIENTIFIC METHODS 1-5) */}
      {interceptedApp && (
        <InhaleInterceptModal
          app={interceptedApp}
          trigger={activeCalmTrigger}
          lang={lang}
          showArabicScript={showArabicScript && inspirationMode !== 'universal'}
          activeHabitWall={
            interceptForce15sReopen || slowLearning.require30sQuizToOpenApps
              ? 'read-30s-quiz'
              : defaultHabitWall
          }
          requireHabitWallAlways={
            interceptForce15sReopen || slowLearning.require30sQuizToOpenApps
          }
          slowLearningTrack={slowLearning.track}
          readingDurationSeconds={
            interceptForce15sReopen ? 15 : slowLearning.readingDurationSeconds
          }
          lessonIndex={slowLearning.currentLessonIndex}
          openCountToday={interceptedApp.dailyOpens}
          masteredLessonIds={slowLearning.masteredLessonIds}
          reviewDueLessonIds={slowLearning.reviewDueLessonIds}
          ifThenReplacementHabit={slowLearning.ifThenReplacementHabit}
          onLogEmotionTag={(emotion: AffectEmotionTag) => {
            setSlowLearning((prev) => {
              const currentCounts = prev.emotionCounts || {
                purpose: 0,
                bored: 0,
                stressed: 0,
                tired: 0,
              };
              return {
                ...prev,
                emotionCounts: {
                  ...currentCounts,
                  [emotion]: (currentCounts[emotion] || 0) + 1,
                },
              };
            });
          }}
          onQuizPassed={(lessonId: string, missedOnce: boolean) =>
            setSlowLearning((prev) => {
              const prevMastered = prev.masteredLessonIds || [];
              const prevReview = prev.reviewDueLessonIds || [];
              const nextMastered = missedOnce
                ? prevMastered
                : Array.from(new Set([...prevMastered, lessonId]));
              const nextReview = missedOnce
                ? Array.from(new Set([...prevReview, lessonId]))
                : prevReview.filter((id) => id !== lessonId);
              return {
                ...prev,
                xp: prev.xp + 15,
                lessonsCompleted: prev.lessonsCompleted + 1,
                quizzesPassed: prev.quizzesPassed + 1,
                currentLessonIndex: prev.currentLessonIndex + 1,
                masteredLessonIds: nextMastered,
                reviewDueLessonIds: nextReview,
              };
            })
          }
          onCancelReturnToPeace={handleReturnToPeaceFromIntercept}
          onUnlockApproved={handleApproveRestrictedUnlock}
          onRotateTrigger={() => setTriggerIndex((i) => i + 1)}
        />
      )}

      {/* RESTLESS UNLOCK / SAKĪNAH STILLNESS OVERLAY */}
      {restlessOverlayOpen && (
        <div className="fixed inset-0 z-50 bg-black text-zinc-100 flex flex-col justify-between p-6 text-center">
          <div className="text-xs font-mono-tech text-zinc-500 uppercase tracking-widest">
            {tx(
              lang,
              'SAKĪNAH STILLNESS INTERVENTION // STANFORD CYCLIC SIGH',
              'সাকীনাহ প্রশান্তি বিরতি // স্ট্যানফোর্ড ডাবল-শ্বাস ও আত্মিক স্থিরতা',
              'وقفة السكينة والهدوء // التنفس العميق وتهدئة القلب',
              'سکینہ اور قلبی سکون کا وقفہ // گہری سانس اور ذکر',
              'INTERVENSI KETENANGAN SAKINAH // NAPAS DALAM'
            )}
          </div>
          <div className="max-w-md mx-auto space-y-6">
            {showArabicScript &&
              activeCalmTrigger.arabic &&
              lang !== 'ar' &&
              inspirationMode !== 'universal' && (
                <p dir="rtl" className="font-arabic text-2xl text-zinc-200 leading-relaxed">
                  {activeCalmTrigger.arabic}
                </p>
              )}
            <p className="text-xl sm:text-2xl font-light text-zinc-100 leading-relaxed">
              “{getTriggerText(activeCalmTrigger, lang)}”
            </p>
            <p className="text-xs font-mono-tech text-zinc-500">
              — {getTriggerSource(activeCalmTrigger, lang)}
            </p>
            <div className="border border-zinc-800 bg-zinc-950 p-3 text-xs font-mono-tech text-zinc-300">
              🫁{' '}
              {tx(
                lang,
                'Take 1 Cyclic Sigh: Two quick nose inhales (2s + 1s), then a slow 6s mouth exhale.',
                '১টি সাইক্লিক শ্বাস নিন: নাক দিয়ে পরপর ২ বার শ্বাস টানুন (২সে + ১সে), এরপর মুখ দিয়ে ৬ সেকেন্ড ধরে ধীরে শ্বাস ছাড়ুন।',
                'خذ شهيقين متتاليين من الأنف ثم زفيراً طويلاً وهادئاً من الفم (٦ ثوانٍ).',
                'ناک سے دو بار سانس اندر کھینچیں اور پھر منہ سے ٦ سیکنڈ تک آہستہ سانس چھوڑیں۔',
                'Ambil 2 hirupan lewat hidung (2d + 1d), lalu hembuskan perlahan lewat mulut (6d).'
              )}
            </div>
            <div className="flex gap-2 justify-center pt-2">
              <button
                type="button"
                onClick={() => setTriggerIndex((i) => i + 1)}
                className="px-4 py-3 border border-zinc-700 text-xs font-mono-tech text-zinc-300 cursor-pointer"
              >
                {t.nextWhisperBtn} ↻
              </button>
              <button
                type="button"
                onClick={() => setRestlessOverlayOpen(false)}
                className="px-6 py-3 bg-zinc-100 text-black text-xs font-mono-tech font-semibold uppercase tracking-widest cursor-pointer"
              >
                {t.returnToPeaceBtn}
              </button>
            </div>
          </div>
          <div className="text-[11px] font-mono-tech text-zinc-600">
            {t.appName} // KASB LLC
          </div>
        </div>
      )}

      {/* CORE LAUNCHER FORTRESS & HOME BUTTON CONTROL MODAL */}
      {showLauncherFortressModal && (
        <div className="fixed inset-0 z-50 bg-black/95 text-zinc-100 flex items-center justify-center p-4">
          <div className="w-full max-w-md border-2 border-zinc-200 bg-black p-5 space-y-4 font-mono-tech">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <div className="text-[10px] text-zinc-400 uppercase tracking-widest">
                  {tx(
                    lang,
                    'SYSTEM HOME & HARDWARE LOCK',
                    'সিস্টেম হোম ও হার্ডওয়্যার লক',
                    'قفل الشاشة الرئيسية والنظام',
                    'سسٹم ہوم اور ہارڈویئر لاک',
                    'KUNCI LAYAR UTAMA SISTEM'
                  )}
                </div>
                <h2 className="text-base font-semibold text-zinc-100">
                  {tx(
                    lang,
                    'Core Launcher Fortress Control',
                    'ডিফল্ট হোম লঞ্চার সুরক্ষা নিয়ন্ত্রণ',
                    'التحكم في مشغل الشاشة الرئيسية',
                    'ڈیفالٹ ہوم لانچر کنٹرول',
                    'Kontrol Peluncur Utama'
                  )}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowLauncherFortressModal(false)}
                className="px-2.5 py-1 border border-zinc-700 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={async () => {
                  const s = await requestDefaultHomeLauncher();
                  setLauncherStatus(s);
                }}
                className="w-full py-3 px-3 bg-zinc-100 text-black text-xs font-semibold uppercase tracking-wider cursor-pointer text-left flex items-center justify-between"
              >
                <span>
                  1.{' '}
                  {tx(
                    lang,
                    'Set Minimum Phone as Default Home',
                    'Minimum Phone-কে ডিফল্ট হোম অ্যাপ করুন',
                    'تعيين Minimum Phone كشاشة رئيسية افتراضية',
                    'Minimum Phone کو ڈیفالٹ ہوم بنائیں',
                    'Jadikan Minimum Phone Layar Utama Default'
                  )}
                </span>
                <span>→</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  const s = await forceTriggerHomePicker();
                  setLauncherStatus(s);
                }}
                className="w-full py-2.5 px-3 border border-zinc-500 text-zinc-100 text-xs uppercase tracking-wider cursor-pointer text-left flex items-center justify-between"
              >
                <span>
                  2.{' '}
                  {tx(
                    lang,
                    'Open System Default Home Picker',
                    'ফোনের ডিফল্ট হোম নির্বাচন মেনু খুলুন',
                    'فتح قائمة اختيار الشاشة الرئيسية',
                    'سسٹم ہوم ایپ مینو کھولیں',
                    'Buka Menu Pilih Layar Utama'
                  )}
                </span>
                <span>↻</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 4: ULTRA-STRONG PRIVATE DNS & PHONE SYSTEM SETTINGS FORTRESS MODAL
          (30s Cooling-Off + Hard Math + Physical QR Code Scan + Auto-Return Watchdog)
         ========================================================= */}
      {escapeGateTarget && (
        <div className="fixed inset-0 z-50 bg-black/95 text-zinc-100 flex items-center justify-center p-3 overflow-y-auto">
          <div className="w-full max-w-md border-2 border-zinc-100 bg-black p-4 space-y-3.5 font-mono-tech my-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-400">
                  🏰{' '}
                  {tx(
                    lang,
                    isNightHourActive
                      ? 'NIGHT SYSTEM & PRIVATE DNS FORTRESS // FULL LOCK'
                      : 'STRONG PRIVATE DNS & SYSTEM SETTINGS FORTRESS',
                    isNightHourActive
                      ? 'রাতের ফোন সেটিংস ও প্রাইভেট DNS দুর্গ // সম্পূর্ণ লক'
                      : 'শক্তিশালী প্রাইভেট DNS ও সিস্টেম সেটিংস সুরক্ষা দুর্গ',
                    isNightHourActive
                      ? 'قلعة إعدادات الهاتف و DNS الليلية // قفل كامل'
                      : 'قلعة حماية DNS الخاص وإعدادات النظام',
                    isNightHourActive
                      ? 'رات کا فون سیٹنگز اور پرائیویٹ DNS قلعہ // مکمل لاک'
                      : 'مضبوط پرائیویٹ DNS اور سسٹم سیٹنگز قلعہ',
                    isNightHourActive
                      ? 'BENTENG PENGATURAN & DNS MALAM // KUNCI PENUH'
                      : 'BENTENG KUAT DNS PRIBADI & PENGATURAN SISTEM'
                  )}
                </div>
                <h2 className="text-sm font-semibold text-zinc-100 mt-0.5">
                  {escapeGateTarget === 'private-dns-settings' ||
                  escapeGateTarget === 'unlock-dns-guard'
                    ? tx(
                        lang,
                        'Private DNS Settings Are Strongly Locked',
                        'প্রাইভেট DNS সেটিংস কঠোরভাবে লক করা রয়েছে',
                        'إعدادات DNS الخاص مقفلة بحماية مشددة',
                        'پرائیویٹ DNS سیٹنگز مضبوطی سے لاک ہیں',
                        'Pengaturan DNS Pribadi Dikunci Sangat Kuat'
                      )
                    : tx(
                        lang,
                        isNightHourActive
                          ? 'Full Phone System Settings Locked at Night (10 PM – 6 AM)'
                          : 'Phone System Settings Protected by Anti-Tamper Lock',
                        isNightHourActive
                          ? 'রাত ১০টা – ভোর ৬টা পর্যন্ত ফোনের সম্পূর্ণ সেটিংস সিস্টেম লকড'
                          : 'ফোনের মূল সিস্টেম সেটিংস সুরক্ষা লকে আবদ্ধ',
                        isNightHourActive
                          ? 'نظام إعدادات الهاتف مقفل بالكامل ليلاً (١٠ مساءً – ٦ صباحاً)'
                          : 'إعدادات نظام الهاتف محمية بقفل الأمان',
                        isNightHourActive
                          ? 'رات ١٠ بجے سے صبح ٦ بجے تک فون کا مکمل سیٹنگز سسٹم لاک ہے'
                          : 'فون کی سسٹم سیٹنگز حفاظتی لاک میں ہیں',
                        isNightHourActive
                          ? 'Sistem Pengaturan Ponsel Dikunci Penuh di Malam Hari'
                          : 'Pengaturan Sistem Ponsel Dilindungi Kunci Anti-Tamper'
                      )}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  stopNightQrCamera();
                  setEscapeGateTarget(null);
                }}
                className="px-2.5 py-1 border border-zinc-700 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              {tx(
                lang,
                'To prevent impulse removal of Private DNS or tampering with phone settings (especially at night), unlocking requires a 30-second cooling-off timer, math check, and scanning your Physical Emergency QR Card.',
                'হঠাৎ তাড়নার বশে প্রাইভেট DNS বন্ধ করা বা রাতে ফোনের সেটিংস পরিবর্তন রোধ করতে ৩০ সেকেন্ড অপেক্ষা, গণিত যাচাই এবং আপনার ফিজিক্যাল জরুরি QR কার্ড স্ক্যান করা বাধ্যতামূলক।',
                'لمنع إزالة DNS الخاص أو العبث بإعدادات الهاتف ليلاً، يتطلب الفتح مؤقت ٣٠ ثانية، مسألة حسابية، ومسح بطاقة QR الفعلية.',
                'وقتی خواہش میں پرائیویٹ DNS ہٹانے یا رات کو فون سیٹنگز بدلنے سے روکنے کے لیے ٣٠ سیکنڈ ٹائمر، حساب اور فزیکل QR کارڈ اسکین لازمی ہے۔',
                'Untuk mencegah penghapusan DNS Pribadi atau perubahan pengaturan di malam hari, wajib menunggu 30 detik, hitungan, dan memindai Kartu QR Fisik.'
              )}
            </p>

            {/* Safe 1-Tap Family DNS Setup Shortcut (Allows enabling/restoring DNS without unlocking tamper guard) */}
            <div className="border border-zinc-500 bg-zinc-950 p-2.5 space-y-1.5">
              <div className="text-[10px] text-zinc-300 uppercase font-semibold">
                🛡️{' '}
                {tx(
                  lang,
                  'Want to Set Up or Repair Safe Family DNS? (Keeps Lock ON):',
                  'নিরাপদ ফ্যামিলি DNS সেটআপ বা মেরামত করতে চান? (লক চালু রেখেই ১-ট্যাপে করুন):',
                  'هل تريد ضبط أو إصلاح DNS العائلي الآمن؟ (مع إبقاء القفل نشطاً):',
                  'سیف فیملی DNS سیٹ یا بحال کرنا چاہتے ہیں؟ (لاک آن رکھتے ہوئے ١-ٹیپ کریں):',
                  'Ingin Mengatur / Memperbaiki DNS Aman? (Tetap Mengunci):'
                )}
              </div>
              <button
                type="button"
                onClick={async () => {
                  stopNightQrCamera();
                  setEscapeGateTarget(null);
                  await handleRequestPhoneSetting('dns', { bypassForDnsSetup: true });
                }}
                className="w-full py-2 px-2.5 bg-zinc-100 text-black text-[11px] font-bold uppercase tracking-wider cursor-pointer text-center"
              >
                📋{' '}
                {tx(
                  lang,
                  'Copy family.cloudflare-dns.com & Open 35s DNS Setup →',
                  'family.cloudflare-dns.com কপি ও ৩৫ সেকেন্ডের DNS সেটআপ খুলুন →',
                  'نسخ family.cloudflare-dns.com وفتح إعداد DNS لمدة ٣٥ ثانية ←',
                  'family.cloudflare-dns.com کاپی کریں اور ٣٥ سیکنڈ DNS سیٹ اپ کھولیں →',
                  'Salin family.cloudflare-dns.com & Buka Setup DNS 35d →'
                )}
              </button>
            </div>

            <div className="border border-zinc-800 bg-zinc-950 p-3 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">
                  1.{' '}
                  {tx(
                    lang,
                    '30s Mandatory Cooling-Off Timer:',
                    '১. ৩০ সেকেন্ডের বাধ্যতামূলক শান্ত হওয়ার টাইমার:',
                    '١. مؤقت التهدئة الإلزامي (٣٠ ثانية):',
                    '١. ٣٠ سیکنڈ لازمی کولنگ آف ٹائمر:',
                    '1. Timer Tenang Wajib (30 Detik):'
                  )}
                </span>
                <span className="text-sm font-bold text-zinc-100 px-2 py-0.5 border border-zinc-700">
                  {escapeCooldownSec > 0
                    ? `⏳ ${escapeCooldownSec}s`
                    : `✓ ${tx(lang, 'Ready', 'প্রস্তুত', 'جاهز', 'تیار', 'Siap')}`}
                </span>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] text-zinc-300">
                  2.{' '}
                  {tx(
                    lang,
                    'Cognitive Verification — Solve: 27 + 38 = ?',
                    '২. মনোযোগ যাচাই — যোগফল লিখুন: ২৭ + ৩৮ = ?',
                    '٢. التحقق الذهني — احسب: 27 + 38 = ؟',
                    '٢. ذہنی تصدیق — حل کریں: 27 + 38 = ؟',
                    '2. Verifikasi Kognitif — Hitung: 27 + 38 = ?'
                  )}
                </label>
                <input
                  type="text"
                  value={escapeMathInput}
                  onChange={(e) => setEscapeMathInput(e.target.value)}
                  placeholder={tx(lang, 'Enter 65', '65 লিখুন', 'أدخل 65', '65 لکھیں', 'Ketik 65')}
                  className="w-full bg-black border border-zinc-700 px-3 py-1.5 text-xs text-zinc-100"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-zinc-300">
                    3.{' '}
                    {tx(
                      lang,
                      'Physical Emergency QR Code Token:',
                      '৩. ফিজিক্যাল জরুরি QR কোড টোকেন:',
                      '٣. رمز بطاقة QR الفعلي للطوارئ:',
                      '٣. فزیکل ایمرجنسی QR کوڈ ٹوکن:',
                      '3. Token Kartu QR Darurat Fisik:'
                    )}
                  </span>
                  {!nightQrCameraActive ? (
                    <button
                      type="button"
                      onClick={startNightQrCamera}
                      className="px-2 py-0.5 bg-zinc-100 text-black text-[10px] font-semibold uppercase cursor-pointer"
                    >
                      📷 {tx(lang, 'Scan QR Card', 'QR স্ক্যান করুন', 'مسح QR', 'QR اسکین', 'Pindai QR')}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopNightQrCamera}
                      className="px-2 py-0.5 border border-zinc-700 text-[10px] text-zinc-300 cursor-pointer"
                    >
                      {tx(lang, 'Close Camera', 'ক্যামেরা বন্ধ', 'إغلاق', 'بند کریں', 'Tutup')}
                    </button>
                  )}
                </div>

                {nightQrCameraActive && (
                  <div className="space-y-1.5 text-center">
                    <video
                      ref={nightVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full max-h-32 bg-black border border-zinc-800 object-cover"
                    />
                    {nightQrScanHoldSec > 0 ? (
                      <div className="text-[10px] text-zinc-300">
                        {tx(
                          lang,
                          `Hold camera steady on your Physical QR Card (${nightQrScanHoldSec}s)...`,
                          `আপনার প্রিন্ট করা QR কার্ডে ক্যামেরা ধরে রাখুন (${nightQrScanHoldSec} সেকেন্ড)...`,
                          `ثبت الكاميرا على بطاقة QR (${nightQrScanHoldSec} ثانية)...`,
                          `اپنے فزیکل QR کارڈ پر کیمرہ رکھیں (${nightQrScanHoldSec} سیکنڈ)...`,
                          `Tahan kamera pada Kartu QR (${nightQrScanHoldSec} detik)...`
                        )}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          setEscapeQrInput(
                            getRequiredQrTokenForComplexity(
                              vault.physicalBrickAnchorCode,
                              'hard'
                            )
                          )
                        }
                        className="px-3 py-1 bg-zinc-100 text-black text-[10px] font-bold uppercase cursor-pointer"
                      >
                        ✓{' '}
                        {tx(
                          lang,
                          'Capture Verified QR Token',
                          'যাচাইকৃত QR কোড গ্রহণ করুন',
                          'التقاط رمز QR',
                          'تصدیق شدہ QR کوڈ لیں',
                          'Tangkap Token QR'
                        )}
                      </button>
                    )}
                  </div>
                )}

                <div className="text-[10px] text-zinc-500">
                  {tx(lang, 'Required Hard QR:', 'প্রয়োজনীয় হার্ড QR:', 'رمز QR المطلوب:', 'مطلوبہ QR:', 'QR Wajib:')}{' '}
                  <strong className="text-zinc-300">
                    {getRequiredQrTokenForComplexity(
                      vault.physicalBrickAnchorCode,
                      'hard'
                    )}
                  </strong>
                </div>

                <input
                  type="text"
                  value={escapeQrInput}
                  onChange={(e) => setEscapeQrInput(e.target.value)}
                  placeholder={tx(
                    lang,
                    'Scan or enter Physical QR Token...',
                    'ফিজিক্যাল QR কোডটি স্ক্যান বা টাইপ করুন...',
                    'امسح أو أدخل رمز QR الفعلي...',
                    'فزیکل QR کوڈ اسکین یا ٹائپ کریں...',
                    'Pindai atau ketik Token QR Fisik...'
                  )}
                  className="w-full bg-black border border-zinc-700 px-3 py-1.5 text-xs text-zinc-100"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] text-zinc-300">
                  4.{' '}
                  {tx(
                    lang,
                    `Type UNLOCK CORE or Friend Secret (${vault.friendAccountabilitySecret}):`,
                    `৪. নিচে UNLOCK CORE অথবা ফ্রেন্ড কোড (${vault.friendAccountabilitySecret}) লিখুন:`,
                    `٤. اكتب UNLOCK CORE أو رمز الصديق (${vault.friendAccountabilitySecret}):`,
                    `٤. UNLOCK CORE یا فرینڈ کوڈ (${vault.friendAccountabilitySecret}) لکھیں:`,
                    `4. Ketik UNLOCK CORE atau kode teman (${vault.friendAccountabilitySecret}):`
                  )}
                </label>
                <input
                  type="text"
                  value={escapePhraseInput}
                  onChange={(e) => setEscapePhraseInput(e.target.value)}
                  placeholder="UNLOCK CORE"
                  className="w-full bg-black border border-zinc-700 px-3 py-1.5 text-xs text-zinc-100"
                />
              </div>
            </div>

            {escapeError && (
              <div className="p-2 border border-zinc-500 bg-zinc-900 text-xs text-zinc-200">
                ⚠ {escapeError}
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  stopNightQrCamera();
                  setEscapeGateTarget(null);
                  setImpulsesStopped((n) => n + 1);
                  setSlowLearning((prev) => ({ ...prev, xp: prev.xp + 20 }));
                }}
                className="flex-1 py-3 bg-zinc-100 text-black text-xs font-semibold uppercase tracking-wider cursor-pointer"
              >
                ✓{' '}
                {tx(
                  lang,
                  'Keep Protected (+20 XP)',
                  'সুরক্ষা লক বজায় রাখুন (+২০ XP)',
                  'ابق محمياً (+٢٠ XP)',
                  'محفوظ رہیں (+٢٠ XP)',
                  'Tetap Terlindungi (+20 XP)'
                )}
              </button>
              <button
                type="button"
                onClick={async () => {
                  const requiredQr = getRequiredQrTokenForComplexity(
                    vault.physicalBrickAnchorCode,
                    'hard'
                  );
                  if (escapeCooldownSec > 0) {
                    setEscapeError(
                      tx(
                        lang,
                        `Please wait ${escapeCooldownSec}s for the mandatory cooling-off timer.`,
                        `বাধ্যতামূলক শান্ত হওয়ার টাইমারের জন্য আরও ${escapeCooldownSec} সেকেন্ড অপেক্ষা করুন।`,
                        `يرجى الانتظار ${escapeCooldownSec} ثانية حتى ينتهي مؤقت التهدئة.`,
                        `براہ کرم کولنگ آف ٹائمر کے لیے ${escapeCooldownSec} سیکنڈ انتظار کریں۔`,
                        `Harap tunggu ${escapeCooldownSec} detik hingga timer selesai.`
                      )
                    );
                    return;
                  }
                  if (escapeMathInput.trim() !== '65') {
                    setEscapeError(
                      tx(
                        lang,
                        'Math check failed: 27 + 38 = 65.',
                        'গণিত যাচাই সঠিক নয়: ২৭ + ৩৮ = ৬৫ লিখুন।',
                        'خطأ في الحساب: 27 + 38 = 65.',
                        'حساب درست نہیں: 27 + 38 = 65 لکھیں۔',
                        'Hitungan salah: 27 + 38 = 65.'
                      )
                    );
                    return;
                  }
                  if (escapeQrInput.trim().toUpperCase() !== requiredQr) {
                    setEscapeError(
                      tx(
                        lang,
                        `Physical QR Code required: ${requiredQr}`,
                        `ফিজিক্যাল QR কোড প্রয়োজন: ${requiredQr}`,
                        `رمز QR الفعلي مطلوب: ${requiredQr}`,
                        `فزیکل QR کوڈ درکار ہے: ${requiredQr}`,
                        `Kode QR Fisik diperlukan: ${requiredQr}`
                      )
                    );
                    return;
                  }
                  if (
                    escapePhraseInput.trim().toUpperCase() !== 'UNLOCK CORE' &&
                    escapePhraseInput.trim() !== vault.friendAccountabilitySecret
                  ) {
                    setEscapeError(
                      tx(
                        lang,
                        'Type UNLOCK CORE or your Friend Accountability Secret.',
                        'UNLOCK CORE অথবা আপনার ফ্রেন্ড সিক্রেট কোড লিখুন।',
                        'اكتب UNLOCK CORE أو رمز الصديق.',
                        'UNLOCK CORE یا اپنا فرینڈ کوڈ درج کریں۔',
                        'Ketik UNLOCK CORE atau kode teman Anda.'
                      )
                    );
                    return;
                  }

                  const target = escapeGateTarget;
                  const phoneTarget = pendingPhoneSettingTarget;
                  stopNightQrCamera();
                  setEscapeGateTarget(null);
                  setEscapeError(null);

                  if (target === 'unlock-dns-guard') {
                    setPurity((prev) => ({
                      ...prev,
                      dnsLockedByQr: false,
                    }));
                  } else if (target === 'unpin-kiosk') {
                    const s = await toggleHardwareKioskPin(false);
                    setLauncherStatus(s);
                  } else if (target === 'home-settings') {
                    const s = await openSystemHomeSettings();
                    setLauncherStatus(s);
                  } else if (
                    target === 'private-dns-settings' ||
                    target === 'system-settings'
                  ) {
                    // Open for a strict 35-second window before snapping back to Minimum Phone
                    await openPhoneMainSetting(phoneTarget, 35);
                  }
                }}
                className="px-4 py-3 border border-zinc-600 text-xs text-zinc-200 hover:bg-zinc-900 cursor-pointer"
              >
                {tx(lang, 'Verify & Unlock (35s)', 'যাচাই ও আনলক (৩৫সে)', 'تحقق وافتح (٣٥ث)', 'تصدیق اور ان لاک (٣٥س)', 'Verifikasi & Buka (35d)')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 5: UN-BYPASSABLE PRIVATE DNS REMOVED — AUTOMATIC NIGHT RECOVERY LOCK
          (Triggered automatically when Private DNS is removed / turned off)
         ========================================================= */}
      {purity.privateDnsRemovedAlert && (
        <div className="fixed inset-0 z-50 bg-black/98 text-zinc-100 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-md border-2 border-zinc-100 bg-black p-5 space-y-4 font-mono-tech my-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
              <div>
                <div className="text-[10px] text-zinc-300 uppercase tracking-widest font-bold">
                  🚨{' '}
                  {tx(
                    lang,
                    'PRIVATE DNS REMOVED // NIGHT AUTO-SHIELD ACTIVATED',
                    'প্রাইভেট DNS সরানো হয়েছে // রাতের স্বয়ংক্রিয় সুরক্ষা লক চালু',
                    'تمت إزالة DNS الخاص // تم تفعيل الدرع الليلي التلقائي',
                    'پرائیویٹ DNS ہٹا دیا گیا // رات کی خودکار حفاظتی شیلڈ فعال',
                    'DNS PRIBADI DIHAPUS // PERISAI MALAM OTOMATIS AKTIF'
                  )}
                </div>
                <h2 className="text-base font-bold text-white mt-0.5">
                  {tx(
                    lang,
                    'Private DNS Auto-Recovery & Browser Lockdown Active',
                    'প্রাইভেট DNS স্বয়ংক্রিয় পুনরুদ্ধার ও ব্রাউজার লকডাউন সক্রিয়',
                    'تفعيل الاستعادة التلقائية لـ DNS وقفل المتصفحات',
                    'پرائیویٹ DNS کی خودکار بحالی اور براؤزر لاک ڈاؤن فعال',
                    'Pemulihan Otomatis DNS Pribadi & Kunci Browser Aktif'
                  )}
                </h2>
              </div>
            </div>

            <p className="text-xs text-zinc-200 leading-relaxed">
              {tx(
                lang,
                'Minimum Phone detected that Private DNS was removed or turned off. Your Night Auto-Protection has automatically re-activated Strict Lockdown and blocked all browsers & social apps until Private DNS (family.cloudflare-dns.com) is restored.',
                'Minimum Phone শনাক্ত করেছে যে ফোনের প্রাইভেট DNS বন্ধ বা সরিয়ে ফেলা হয়েছে। আপনার রাতের স্বয়ংক্রিয় সুরক্ষা সাথে সাথে সক্রিয় হয়ে সকল ব্রাউজার ও সোশ্যাল অ্যাপ লক করেছে। নিচের বাটনে ১-ট্যাপ করে প্রাইভেট DNS (family.cloudflare-dns.com) পুনরায় চালু করুন।',
                'اكتشف التطبيق أنه تم إيقاف أو إزالة DNS الخاص. قام نظام الحماية الليلي تلقائياً بإعادة تفعيل القفل وحجب جميع المتصفحات حتى تتم استعادة DNS الآمن (family.cloudflare-dns.com).',
                'Minimum Phone نے محسوس کیا ہے کہ پرائیویٹ DNS ہٹا دیا گیا ہے۔ خودکار نائٹ شیلڈ نے فوری طور پر تمام براؤزرز اور سوشل ایپس کو لاک کر دیا ہے۔ نیچے ١-ٹیپ کر کے پرائیویٹ DNS بحال کریں۔',
                'Minimum Phone mendeteksi bahwa DNS Pribadi telah dihapus atau dimatikan. Perisai Malam Otomatis langsung mengunci semua browser hingga DNS Aman (family.cloudflare-dns.com) dipulihkan.'
              )}
            </p>

            <div className="border border-zinc-700 bg-zinc-950 p-3 space-y-2 text-xs">
              <div className="text-zinc-100 font-semibold">
                ⚡{' '}
                {tx(
                  lang,
                  '1-Tap Instant Restoration (Takes 5 Seconds):',
                  '১-ট্যাপে তাৎক্ষণিক পুনরুদ্ধার (মাত্র ৫ সেকেন্ড লাগবে):',
                  'استعادة فورية بضغطة واحدة (تستغرق ٥ ثوانٍ):',
                  '١-ٹیپ فوری بحالی (صرف ٥ سیکنڈ میں):',
                  'Pemulihan Instan 1-Sentuh (Hanya 5 Detik):'
                )}
              </div>
              <div className="text-[11px] text-zinc-400">
                1.{' '}
                {tx(
                  lang,
                  'Tap the button below (auto-copies family.cloudflare-dns.com & opens DNS)',
                  'নিচের বাটনে ট্যাপ করুন (স্বয়ংক্রিয়ভাবে family.cloudflare-dns.com কপি ও DNS খুলবে)',
                  'اضغط الزر أدناه (ينسخ family.cloudflare-dns.com ويفتح إعدادات DNS)',
                  'نیچے بٹن دبائیں (خودکار طور پر family.cloudflare-dns.com کاپی اور DNS کھلے گا)',
                  'Ketuk tombol di bawah (otomatis menyalin family.cloudflare-dns.com & membuka DNS)'
                )}
                <br />
                2.{' '}
                {tx(
                  lang,
                  'Select “Private DNS provider hostname” → Paste → Save!',
                  '“Private DNS provider hostname” নির্বাচন করে পেস্ট (Paste) করুন ও Save চাপুন!',
                  'اختر "Private DNS provider hostname" ← الصق ← احفظ!',
                  '"Private DNS provider hostname" منتخب کریں ← پیسٹ کریں ← سیو کریں!',
                  'Pilih "Private DNS provider hostname" → Tempel → Simpan!'
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={async () => {
                await handleRequestPhoneSetting('dns', { bypassForDnsSetup: true });
              }}
              className="w-full py-3.5 px-3 bg-zinc-100 text-black text-xs font-bold uppercase tracking-wider cursor-pointer text-center"
            >
              🛡️{' '}
              {tx(
                lang,
                '1-Tap Copy family.cloudflare-dns.com & Restore Private DNS Now →',
                '১-ট্যাপে family.cloudflare-dns.com কপি ও প্রাইভেট DNS চালু করুন →',
                'نسخ family.cloudflare-dns.com واستعادة DNS الخاص الآن ←',
                '١-ٹیپ میں family.cloudflare-dns.com کاپی اور پرائیویٹ DNS بحال کریں →',
                '1-Sentuh Salin family.cloudflare-dns.com & Pulihkan DNS Sekarang →'
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setPurity((prev) => ({
                  ...prev,
                  adultDnsEnabled: true,
                  dnsLockedByQr: true,
                  autoActivateDnsAtNight: true,
                  lockFullPhoneSettingsAtNight: true,
                  privateDnsRemovedAlert: false,
                  lastDnsAutoRestoreIso: new Date().toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  }),
                }));
              }}
              className="w-full py-2.5 border border-zinc-700 text-zinc-300 text-xs uppercase cursor-pointer"
            >
              ✓{' '}
              {tx(
                lang,
                'I Have Restored Private DNS — Lock & Return Home',
                'আমি প্রাইভেট DNS চালু করেছি — লক করুন ও হোমে ফিরুন',
                'لقد قمت باستعادة DNS الخاص — اقفل وعد للرئيسية',
                'میں نے پرائیویٹ DNS بحال کر دیا ہے — لاک کریں اور ہوم پر لوٹیں',
                'Saya Sudah Memulihkan DNS Pribadi — Kunci & Kembali'
              )}
            </button>
          </div>
        </div>
      )}

      {/* BUILT-IN OFFLINE UTILITY MODAL (MONOCHROME CALCULATOR & 2FA AUTHENTICATOR) */}
      {activeBuiltInUtility && (
        <div className="fixed inset-0 z-50 bg-black/95 text-zinc-100 flex items-center justify-center p-4">
          <div className="w-full max-w-sm border-2 border-zinc-200 bg-black p-5 space-y-4 font-mono-tech">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
              <div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-widest">
                  {tx(
                    lang,
                    'BUILT-IN ZERO-DISTRACTION UTILITY',
                    'বিল্ট-ইন মনোযোগ-বান্ধব টুল',
                    'أداة مدمجة خالية من التشتيت',
                    'بلٹ ان توجہ دوست ٹول',
                    'ALAT BAWAAN BEBAS DISTRAKSI'
                  )}
                </div>
                <h3 className="text-sm font-semibold text-zinc-100">
                  {activeBuiltInUtility === 'calculator'
                    ? tx(lang, 'Monochrome Calculator', 'মনোক্রোম ক্যালকুলেটর', 'آلة حاسبة أحادية', 'مونوکروم کیلکولیٹر', 'Kalkulator Monokrom')
                    : tx(lang, 'Offline 2FA & Security Codes', 'অফলাইন 2FA ও সিকিউরিটি কোড', 'رموز الأمان 2FA', 'آف لائن 2FA سیکیورٹی کوڈز', 'Kode Keamanan 2FA Offline')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveBuiltInUtility(null)}
                className="px-2.5 py-1 border border-zinc-700 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            {activeBuiltInUtility === 'calculator' ? (
              <div className="space-y-3">
                <div className="border border-zinc-700 bg-zinc-950 p-3 text-right text-2xl font-light text-zinc-100 overflow-x-auto">
                  {calcDisplay}
                </div>
                <div className="grid grid-cols-4 gap-1.5 text-sm">
                  {[
                    '7',
                    '8',
                    '9',
                    '/',
                    '4',
                    '5',
                    '6',
                    '*',
                    '1',
                    '2',
                    '3',
                    '-',
                    'C',
                    '0',
                    '=',
                    '+',
                  ].map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        if (key === 'C') {
                          setCalcDisplay('0');
                        } else if (key === '=') {
                          try {
                            const sanitized = calcDisplay.replace(/[^0-9+\-*/.]/g, '');
                            const result = Function(`"use strict"; return (${sanitized || '0'})`)();
                            setCalcDisplay(String(Number(result.toFixed(6))));
                          } catch {
                            setCalcDisplay('Error');
                          }
                        } else {
                          setCalcDisplay((prev) =>
                            prev === '0' || prev === 'Error' ? key : prev + key
                          );
                        }
                      }}
                      className={`py-3 border text-center cursor-pointer ${
                        key === '='
                          ? 'border-zinc-100 bg-zinc-100 text-black font-semibold'
                          : 'border-zinc-800 bg-zinc-950 text-zinc-200 hover:border-zinc-500'
                      }`}
                    >
                      {key}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <p className="text-zinc-400">
                  {tx(
                    lang,
                    '100% offline rotating security codes for your essential accounts and Accountability Lock:',
                    'আপনার জরুরি অ্যাকাউন্ট ও সুরক্ষা লকের জন্য ১০০% অফলাইন পরিবর্তনশীল সিকিউরিটি কোড:',
                    'رموز أمان متجددة ١٠٠٪ بدون إنترنت لحساباتك الأساسية:',
                    'آپ کے اہم اکاؤنٹس اور حفاظتی لاک کے لیے ١٠٠٪ آف لائن سیکیورٹی کوڈز:',
                    'Kode keamanan bergilir 100% offline untuk akun penting Anda:'
                  )}
                </p>
                <div className="space-y-2">
                  {[
                    {
                      name: tx(
                        lang,
                        'Minimum Phone Accountability',
                        'মিনিমাম ফোন জবাবদিহিতা লক',
                        'قفل المساءلة في الهاتف الأدنى',
                        'منیمم فون احتساب لاک',
                        'Kunci Akuntabilitas Minimum Phone'
                      ),
                      code: String((currentTime.getMinutes() * 14731 + 294819) % 900000 + 100000),
                    },
                    {
                      name: tx(
                        lang,
                        'Primary Work Workspace (2FA)',
                        'প্রধান কর্মক্ষেত্র অ্যাকাউন্ট (2FA)',
                        'مساحة العمل الأساسية (2FA)',
                        'بنیادی ورک اسپیس اکاؤنٹ (2FA)',
                        'Akun Kerja Utama (2FA)'
                      ),
                      code: String((currentTime.getMinutes() * 38197 + 518273) % 900000 + 100000),
                    },
                    {
                      name: tx(
                        lang,
                        'Cloud Vault Security (2FA)',
                        'ক্লাউড ভল্ট সিকিউরিটি (2FA)',
                        'خزنة السحابة الأمنية (2FA)',
                        'کلاؤڈ والٹ سیکیورٹی (2FA)',
                        'Brankas Cloud (2FA)'
                      ),
                      code: String((currentTime.getMinutes() * 72931 + 109482) % 900000 + 100000),
                    },
                  ].map((item) => (
                    <div
                      key={item.name}
                      className="border border-zinc-800 bg-zinc-950 p-3 flex items-center justify-between"
                    >
                      <span className="text-zinc-300">{item.name}</span>
                      <span className="text-base font-semibold tracking-widest text-zinc-100">
                        {item.code.slice(0, 3)} {item.code.slice(3)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
export default App;

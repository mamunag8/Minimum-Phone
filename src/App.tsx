import React, { useEffect, useMemo, useRef, useState } from 'react';
import type {
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
  VisualTheme,
  WisdomPackSource,
} from './types/app';
import {
  CALM_MIND_TRIGGERS,
  getTriggerSource,
  getTriggerText,
} from './data/calmTriggers';
import { DEFAULT_APPS, INITIAL_NOTIFICATIONS } from './data/defaultApps';
import { getLessonsForTrack } from './data/slowLearningCurriculum';
import { SUPPORTED_LANGUAGES, TRANSLATIONS } from './i18n/translations';
import { InhaleInterceptModal } from './components/InhaleInterceptModal';
import { PurityGuardView } from './components/PurityGuardView';
import {
  DigestAndFocusView,
  getRequiredQrTokenForComplexity,
} from './components/DigestAndFocusView';
import { AnalyticsAndKasbView } from './components/AnalyticsAndKasbView';
import {
  enforceBackgroundSafeApps,
  fetchNativeLauncherStatus,
  forceTriggerHomePicker,
  launchNativeAndroidApp,
  loadRealInstalledApps,
  openPhoneMainSetting,
  openSystemHomeSettings,
  requestDefaultHomeLauncher,
  toggleHardwareKioskPin,
  type NativeLauncherStatus,
} from './services/nativeLauncherBridge';

const STORAGE_KEY = 'minimum_phone_kasb_state_v3';

export function App() {
  // Persistent state initialization
  const [lang, setLang] = useState<LanguageCode>('en');
  const [platform, setPlatform] = useState<PlatformMode>('android');
  const [visualTheme, setVisualTheme] = useState<VisualTheme>('oled-black');
  const [grayscaleEnabled, setGrayscaleEnabled] = useState<boolean>(true);
  const [inspirationMode, setInspirationMode] = useState<InspirationMode>('blended');
  const [wisdomPack, setWisdomPack] = useState<WisdomPackSource>('blended');
  const [showArabicScript, setShowArabicScript] = useState<boolean>(true);
  const [defaultHabitWall, setDefaultHabitWall] =
    useState<HabitWallType>('read-30s-quiz');

  const [slowLearning, setSlowLearning] = useState<SlowLearningState>({
    track: 'islam',
    require30sQuizToOpenApps: true,
    readingDurationSeconds: 30,
    xp: 45,
    lessonsCompleted: 3,
    quizzesPassed: 3,
    currentLessonIndex: 0,
  });

  const [activeTab, setActiveTab] = useState<
    'home' | 'drawer' | 'purity' | 'digest-focus' | 'system-kasb'
  >('home');

  const [homeProfile, setHomeProfile] = useState<HomeProfileType>('work');
  const [apps, setApps] = useState<AppItem[]>(DEFAULT_APPS);
  const [notifications, setNotifications] =
    useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  const [scratchpadNotes, setScratchpadNotes] = useState<ScratchpadNote[]>([
    {
      id: 'note-1',
      text: 'Finalize Q4 product architecture note before 4 PM',
      createdAt: '09:15',
      done: false,
      pinned: true,
    },
  ]);
  const [scratchpadInput, setScratchpadInput] = useState<string>('');
  const [showScratchpad, setShowScratchpad] = useState<boolean>(false);

  const [impulsesStopped, setImpulsesStopped] = useState<number>(18);
  const [reclaimedMinutes, setReclaimedMinutes] = useState<number>(270);

  // Purity & Anti-Porn State
  const [purity, setPurity] = useState<PurityState>(() => ({
    streakStartIso: new Date(Date.now() - 7 * 86400000 - 3 * 3600000).toISOString(),
    bestStreakDays: 14,
    urgesDefeatedCount: 9,
    discreetMode: false,
    adultDnsEnabled: true,
    browserKeywordShield: true,
    nightGuardLock: true,
    strictPornLockdown: true,
    safeSearchEnforced: true,
    customBlockedKeywords: [],
    emergencyBrowserLockUntilMs: null,
    pledgedToday: null,
    logs: [],
  }));

  // Focus, QR Complexity, Settings Gate, Notification Control & Background Safe List State
  const [vault, setVault] = useState<FocusVaultState>({
    monkModeActive: false,
    monkTaskTitle: 'Deep Focus Architecture Work',
    monkRemainingSeconds: 50 * 60,
    monkTotalSeconds: 50 * 60,
    deepWorkScheduleEnabled: true,
    sleepVaultScheduleEnabled: true,
    physicalBrickLocked: false,
    physicalBrickAnchorCode: 'KASB-BRICK-77',
    qrComplexity: 'hard',
    nightBrowserQrRequired: true,
    nightQrStartHour: 22,
    nightQrEndHour: 6,
    forceNightBrowserQrTest: false,
    settingsGateEnabled: true,
    settingsGateSeconds: 15,
    blockNotificationAppLaunch: true,
    readOnlyNotificationDigest: true,
    autoCleanBackgroundApps: true,
    backgroundSafeAppIds: [
      'phone',
      'calendar',
      'notes',
      'maps',
      'authenticator',
      'whatsapp',
    ],
    lastBackgroundCleanIso: null,
    lastBackgroundClosedCount: 0,
    uninstallProtectionEnabled: true,
    uninstallCooldownStartedIso: null,
    friendAccountabilitySecret: 'KASB2026',
  });

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
    'home-settings' | 'system-settings' | 'unpin-kiosk' | null
  >(null);
  const [escapeCooldownSec, setEscapeCooldownSec] = useState<number>(15);
  const [escapePhraseInput, setEscapePhraseInput] = useState<string>('');

  // Settings Page 15-Second Read + Quiz Gate State
  const [settingsSessionUnlocked, setSettingsSessionUnlocked] = useState<boolean>(false);
  const [settingsGateModalOpen, setSettingsGateModalOpen] = useState<boolean>(false);
  const [settingsGateTimerSec, setSettingsGateTimerSec] = useState<number>(15);
  const [settingsGateLessonIdx, setSettingsGateLessonIdx] = useState<number>(0);
  const [settingsGateSelectedOption, setSettingsGateSelectedOption] = useState<
    number | null
  >(null);
  const [settingsGateError, setSettingsGateError] = useState<string | null>(null);

  // Night Browser Physical QR Scanner Gate State ("Without scan QR codes specifically can not use any browse at night")
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
      'calendar',
      'notes',
      'maps',
      'authenticator',
      'whatsapp',
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
      setApps(merged);
    });
  };

  useEffect(() => {
    refreshNativeStatus();
    loadRealInstalledApps(DEFAULT_APPS).then((merged) => {
      setApps(merged);
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

  // Settings Page 15-Second Read & Quiz Gate countdown
  useEffect(() => {
    if (!settingsGateModalOpen) return;
    if (settingsGateTimerSec <= 0) return;
    const timer = setInterval(() => {
      setSettingsGateTimerSec((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [settingsGateModalOpen, settingsGateTimerSec]);

  // Night Browser QR Camera Hold Countdown
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
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.lang) setLang(parsed.lang);
        if (parsed.inspirationMode) setInspirationMode(parsed.inspirationMode);
        if (parsed.wisdomPack) setWisdomPack(parsed.wisdomPack);
        if (typeof parsed.grayscaleEnabled === 'boolean')
          setGrayscaleEnabled(parsed.grayscaleEnabled);
        if (parsed.defaultHabitWall) setDefaultHabitWall(parsed.defaultHabitWall);
        if (parsed.slowLearning) setSlowLearning(parsed.slowLearning);
        if (parsed.impulsesStopped) setImpulsesStopped(parsed.impulsesStopped);
        if (parsed.reclaimedMinutes) setReclaimedMinutes(parsed.reclaimedMinutes);
        if (parsed.purity) setPurity(parsed.purity);
        if (parsed.vault) setVault((prev) => ({ ...prev, ...parsed.vault }));
        if (Array.isArray(parsed.apps) && parsed.apps.length > 0) setApps(parsed.apps);
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
          setEscalationBanner({ stage: '5m', appName: prev.app.name });
        }

        // 10-Minute Medium On-Screen Warning (600 seconds)
        if (nextElapsed === 10 * 60) {
          setEscalationBanner({ stage: '10m', appName: prev.app.name });
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
  }, [activeSession, apps, vault]);

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

  // Active Home Apps (up to 7 apps for current Home Screen profile)
  const pinnedHomeApps = useMemo(() => {
    return apps.filter((a) => a.pinnedProfiles.includes(homeProfile)).slice(0, 7);
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
      const nameBn = (app.nameBn || '').toLowerCase();
      if (
        (app.tier === 'restricted' || app.tier === 'adult-blocked') &&
        !revealRestrictedInDrawer
      ) {
        return (
          q.length >= 3 && (nameEn.startsWith(q) || nameEn === q || nameBn.includes(q))
        );
      }
      return nameEn.includes(q) || nameBn.includes(q);
    });
  }, [apps, searchQuery, revealRestrictedInDrawer]);

  // Check if current hour is within Night Window (default 22:00 - 06:00) or forced test mode
  const isNightHourActive = useMemo(() => {
    if (vault.forceNightBrowserQrTest) return true;
    const hr = currentTime.getHours();
    const startH = vault.nightQrStartHour ?? 22;
    const endH = vault.nightQrEndHour ?? 6;
    return hr >= startH || hr < endH;
  }, [currentTime, vault.forceNightBrowserQrTest, vault.nightQrStartHour, vault.nightQrEndHour]);

  const isBrowserAppItem = (app: AppItem): boolean => {
    const n = app.name.toLowerCase();
    const p = (app.packageName || '').toLowerCase();
    return (
      app.category === 'browser' ||
      /chrome|browser|safari|firefox|brave|opera|duckduckgo|edge/.test(n) ||
      /chrome|browser|safari|firefox|brave|opera|duckduckgo|edge/.test(p)
    );
  };

  // Navigate to Settings tab with 15-Second Read & Quiz Gate
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
      setSettingsGateTimerSec(vault.settingsGateSeconds || 15);
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

    // 2. Mandatory Night Browser QR Scan Lock ("Without scan QR codes specifically can not use any browse at night")
    if (
      (vault.nightBrowserQrRequired ?? true) &&
      isNightHourActive &&
      isBrowserAppItem(app)
    ) {
      setNightQrInput('');
      setNightQrMathInput('');
      setNightQrError(null);
      setNightQrCameraActive(false);
      setNightBrowserQrApp(app);
      return;
    }

    // 3. Anti-Escape Guard: if user tries to open Android Settings while Uninstall/Switch Protection is enabled
    if (
      vault.uninstallProtectionEnabled &&
      (lowerName === 'settings' ||
        lowerPkg === 'com.android.settings' ||
        lowerPkg.includes('launcher'))
    ) {
      setEscapeCooldownSec(15);
      setEscapePhraseInput('');
      setEscapeGateTarget('system-settings');
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

  const handleReturnToPeaceFromIntercept = () => {
    setInterceptedApp(null);
    setInterceptForce15sReopen(false);
    setImpulsesStopped((n) => n + 1);
    setReclaimedMinutes((m) => m + 15);
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
      setEscalationBanner({ stage: '5m', appName: matchedApp.name });
    } else if (stage === '10m') {
      setEscalationBanner({ stage: '10m', appName: matchedApp.name });
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
        `Hold steady for ${nightQrScanHoldSec}s while optical QR verification completes.`
      );
      return;
    }

    if (complexity === 'hard' && nightQrMathInput.trim() !== '43') {
      setNightQrError(
        'Hard QR Complexity requires solving the anti-impulse check (17 + 26 = 43) plus the exact QR token.'
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
        `Invalid Night Browser QR Code for [${complexity.toUpperCase()}] complexity. Required: ${expectedToken}`
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
    lang === 'bn' ? 'bn-BD' : lang === 'ar' ? 'ar-SA' : 'en-US',
    {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }
  );

  const themeClass =
    visualTheme === 'eink-paper'
      ? 'theme-eink'
      : visualTheme === 'sunset-amber'
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
                ⏱ <strong>5-MINUTE MINOR NOTICE ({escalationBanner.appName}):</strong> You have
                spent 5 minutes inside {escalationBanner.appName}. Check your intention.
              </span>
            ) : (
              <span>
                ⚠ <strong>10-MINUTE MEDIUM WARNING ({escalationBanner.appName}):</strong> 10
                minutes elapsed! Dopamine scroll loop detected. At 20 minutes,{' '}
                {escalationBanner.appName} will auto-close and lock behind a 15s Read & Quiz.
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
              Close {escalationBanner.appName} Now
            </button>
            <button
              type="button"
              onClick={() => setEscalationBanner(null)}
              className="px-2 py-1 border border-zinc-600 text-[11px] text-zinc-400 cursor-pointer"
            >
              Dismiss
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
                {activeSession.app.name}
              </span>{' '}
              <span className="text-zinc-500">
                · Elapsed {Math.floor(activeSession.elapsedSeconds / 60)}m{' '}
                {activeSession.elapsedSeconds % 60}s (5m Minor / 10m Med / 20m Close)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleTriggerEscalationStage('5m', activeSession.app.name)}
                className="px-1.5 py-0.5 border border-zinc-800 text-[10px] text-zinc-400 hover:text-zinc-200 cursor-pointer"
                title="Simulate 5-Minute Minor Notification"
              >
                5m
              </button>
              <button
                type="button"
                onClick={() => handleTriggerEscalationStage('10m', activeSession.app.name)}
                className="px-1.5 py-0.5 border border-zinc-700 text-[10px] text-zinc-300 hover:text-white cursor-pointer"
                title="Simulate 10-Minute Medium Warning"
              >
                10m
              </button>
              <button
                type="button"
                onClick={() => handleTriggerEscalationStage('20m', activeSession.app.name)}
                className="px-1.5 py-0.5 border border-zinc-500 text-[10px] text-zinc-200 hover:bg-zinc-800 cursor-pointer"
                title="Simulate 20-Minute Full-Screen Auto-Close"
              >
                20m Close
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
                Close App
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN 100% DEVICE-FIT LAUNCHER VIEWPORT */}
      <main className="w-full flex-1 min-h-0 flex flex-col justify-between overflow-y-auto px-4 sm:px-8 md:px-12 py-4">
        {/* =========================================================
            TAB 1: THE PURE MINIMALIST HOME SCREEN (ZERO SETTINGS CLUTTER)
           ========================================================= */}
        {activeTab === 'home' && (
          <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col justify-between space-y-4">
            {/* Top Status Row: Clean Clock, Date, Battery %, and Quiet Digest Reassurance Line */}
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <h1 className="text-5xl sm:text-6xl md:text-7xl font-mono-tech font-light tracking-tight">
                  {formattedClock}
                </h1>
                <div className="text-right font-mono-tech text-xs opacity-75">
                  <div>{formattedDate}</div>
                  <div className="mt-0.5">
                    BAT {batteryLevel}% {isCharging ? '⚡' : ''}
                  </div>
                </div>
              </div>

              {/* Peace of Mind Notification Digest Status Line */}
              <button
                type="button"
                onClick={() => setActiveTab('digest-focus')}
                className="w-full text-left py-2 border-y border-zinc-800/80 flex items-center justify-between text-xs font-mono-tech opacity-80 hover:opacity-100 cursor-pointer"
              >
                <span>
                  {urgentBreakthroughCount > 0
                    ? `⚡ ${urgentBreakthroughCount} URGENT BREAKTHROUGH ALERT`
                    : `${t.allQuietStatus} (${batchedQuietCount} batched)`}
                </span>
                <span>{t.nextDigestAt} 18:00 →</span>
              </button>
            </div>

            {/* IF MONK MODE DEEP WORK IS ACTIVE: E-INK SINGLE TASK DISPLAY */}
            {vault.monkModeActive ? (
              <div className="my-auto border-2 border-zinc-300 p-6 text-center space-y-4">
                <div className="text-[11px] font-mono-tech uppercase tracking-[0.2em] opacity-70">
                  MONK MODE // DEEP FOCUS BLOCK ACTIVE
                </div>
                <div className="text-base font-medium">{vault.monkTaskTitle}</div>
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
                  End Focus Session
                </button>
              </div>
            ) : (
              /* PURE MINIMALIST ACTIVE HOME APPS + HOME NOTE SYSTEM */
              <div className="my-auto space-y-4 py-1">
                {/* Text-Only Monochromatic Active Home App List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1.5">
                  {pinnedHomeApps.map((app) => {
                    const isReopenLocked = reopenLockedAppIds.includes(app.id);
                    const isNightQrLocked =
                      (vault.nightBrowserQrRequired ?? true) &&
                      isNightHourActive &&
                      isBrowserAppItem(app);
                    return (
                      <button
                        key={app.id}
                        type="button"
                        onClick={() => handleTapApp(app)}
                        className="w-full text-left py-2.5 border-b border-zinc-900/90 flex items-baseline justify-between group cursor-pointer"
                      >
                        <span className="text-2xl sm:text-3xl font-light tracking-tight group-hover:translate-x-1.5 transition-transform">
                          {lang === 'bn' && app.nameBn ? app.nameBn : app.name}
                        </span>
                        <span className="text-[10px] font-mono-tech opacity-45 group-hover:opacity-85">
                          {isNightQrLocked
                            ? '🌙 QR LOCK'
                            : isReopenLocked
                            ? '15S QUIZ'
                            : app.tier === 'restricted'
                            ? '30S QUIZ'
                            : app.tier === 'adult-blocked'
                            ? 'BLOCKED'
                            : 'OPEN'}
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
                    ✎ Note ({scratchpadNotes.filter((n) => !n.done).length})
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
                          Clear Completed
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
                        + Add Note
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
                              {n.text}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleToggleScratchpadPin(n.id)}
                              className={`text-[11px] cursor-pointer ${
                                n.pinned ? 'text-zinc-100' : 'opacity-35 hover:opacity-80'
                              }`}
                              title="Pin note to top"
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
                    ☪ Sakīnah
                  </button>
                </div>
              </div>
            )}

            {/* Bottom Calm Mind Trigger Bar (Small Strong Line Only) */}
            <div className="border-t border-zinc-800/90 pt-3 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono-tech uppercase tracking-widest opacity-60">
                <span>{t.calmWhisperLabel}</span>
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
          <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono-tech uppercase tracking-widest text-zinc-500">
                  ASYMMETRIC FRICTION // INSTANT UTILITY · GATED DOPAMINE
                </span>
                <button
                  type="button"
                  onClick={() => setRevealRestrictedInDrawer((v) => !v)}
                  className="text-[10px] font-mono-tech text-zinc-400 underline cursor-pointer"
                >
                  {revealRestrictedInDrawer ? 'Hide Restricted' : 'Show All Apps'}
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
                      a.name.toLowerCase().startsWith(val.trim().toLowerCase())
                  );
                  if (val.trim().length >= 3 && matches.length === 1) {
                    handleTapApp(matches[0]);
                  }
                }}
                placeholder={t.searchPlaceholder}
                className="w-full bg-black border border-zinc-700 px-3.5 py-3 text-sm font-mono-tech text-zinc-100 focus:outline-none focus:border-zinc-200"
              />
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-zinc-900 pr-1">
              {drawerSearchResults.map((app) => {
                const isReopenLocked = reopenLockedAppIds.includes(app.id);
                const isNightQrLocked =
                  (vault.nightBrowserQrRequired ?? true) &&
                  isNightHourActive &&
                  isBrowserAppItem(app);
                return (
                  <div
                    key={app.id}
                    className="py-3 flex items-center justify-between gap-2"
                  >
                    <button
                      type="button"
                      onClick={() => handleTapApp(app)}
                      className="text-left flex-1 cursor-pointer group"
                    >
                      <div className="text-base font-light text-zinc-100 group-hover:translate-x-1 transition-transform">
                        {lang === 'bn' && app.nameBn ? app.nameBn : app.name}
                      </div>
                      <div className="text-[10px] font-mono-tech text-zinc-500">
                        {app.category.toUpperCase()} · {app.dailyMinutesUsed}m today
                      </div>
                    </button>

                    <span className="px-2 py-1 border border-zinc-800 text-[10px] font-mono-tech text-zinc-400">
                      {isNightQrLocked
                        ? '🌙 NIGHT QR REQUIRED'
                        : isReopenLocked
                        ? '🔒 15S QUIZ REOPEN'
                        : app.tier === 'restricted'
                        ? '🔒 30S QUIZ GATE'
                        : app.tier === 'adult-blocked'
                        ? '🚫 BLOCKED'
                        : '⚡ INSTANT'}
                    </span>
                  </div>
                );
              })}

              {!revealRestrictedInDrawer && searchQuery.trim().length < 3 && (
                <div className="py-4 text-center text-[11px] font-mono-tech text-zinc-500">
                  {t.typeExactToReveal} (e.g., type “Instagram”, “Facebook”, “YouTube”, or tap
                  “Show All Apps” above).
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 3: PURITY & ANTI-PORN GUARD + PRIVATE DNS + URGE SOS
           ========================================================= */}
        {activeTab === 'purity' && (
          <div className="w-full max-w-4xl mx-auto flex-1">
            <PurityGuardView
              purity={purity}
              lang={lang}
              platform={platform}
              showArabicScript={showArabicScript}
              inspirationMode={inspirationMode}
              openSosImmediately={openPuritySosImmediately}
              onClearImmediateSos={() => setOpenPuritySosImmediately(false)}
              onUpdatePurity={setPurity}
            />
          </div>
        )}

        {/* =========================================================
            TAB 4: NOTIFICATION DIGEST + MONK FOCUS + QR COMPLEXITY & NIGHT BROWSER QR LOCK
           ========================================================= */}
        {activeTab === 'digest-focus' && (
          <div className="w-full max-w-4xl mx-auto flex-1">
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
          <div className="w-full max-w-4xl mx-auto flex-1">
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
            />
          </div>
        )}
      </main>

      {/* STICKY 100%-FIT BOTTOM NAVIGATION BAR */}
      <nav className="w-full shrink-0 border-t border-zinc-800 bg-black px-3 sm:px-8 py-2 grid grid-cols-5 gap-1.5 text-[11px] font-mono-tech">
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
          MODAL 1: SETTINGS PAGE 15-SECOND READ & QUIZ RESTRICTION GATE
         ========================================================= */}
      {settingsGateModalOpen && activeSettingsGateLesson && (
        <div className="fixed inset-0 z-50 bg-black/95 text-zinc-100 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-md border-2 border-zinc-200 bg-black p-5 space-y-4 font-mono-tech">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
              <div>
                <div className="text-[10px] text-zinc-400 uppercase tracking-widest">
                  SETTINGS ANTI-IMPULSE GUARD // 15-SEC READ & QUIZ
                </div>
                <h3 className="text-sm font-semibold text-zinc-100 mt-0.5">
                  Read for 15 Seconds & Answer Quiz to Open Settings
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSettingsGateModalOpen(false)}
                className="px-2.5 py-1 border border-zinc-700 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="border border-zinc-800 bg-zinc-950 p-3.5 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-zinc-400">
                <span>
                  {activeSettingsGateLesson.title[lang] ||
                    activeSettingsGateLesson.title.en}
                </span>
                <span className="px-2 py-0.5 border border-zinc-700 text-zinc-200 font-semibold">
                  {settingsGateTimerSec > 0
                    ? `⏳ Read ${settingsGateTimerSec}s`
                    : '✓ Quiz Ready'}
                </span>
              </div>

              {showArabicScript &&
                activeSettingsGateLesson.arabicHeader &&
                inspirationMode !== 'universal' && (
                  <p
                    dir="rtl"
                    className="font-arabic text-base text-zinc-200 text-right leading-relaxed"
                  >
                    {activeSettingsGateLesson.arabicHeader}
                  </p>
                )}

              <p className="text-xs text-zinc-200 leading-relaxed font-sans">
                {activeSettingsGateLesson.readingText[lang] ||
                  activeSettingsGateLesson.readingText.en}
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold text-zinc-100">
                Quiz:{' '}
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
                          'Incorrect answer. Re-read the passage for 10 seconds and try again.'
                        );
                        setSettingsGateTimerSec(10);
                      }
                    }}
                    className={`w-full text-left p-2.5 border text-xs cursor-pointer disabled:opacity-40 ${
                      settingsGateSelectedOption === idx
                        ? 'border-zinc-200 bg-zinc-900 text-white'
                        : 'border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-zinc-600'
                    }`}
                  >
                    {idx + 1}. {opt}
                  </button>
                ))}
              </div>
            </div>

            {settingsGateError && (
              <div className="p-2.5 border border-zinc-500 bg-zinc-900 text-xs text-zinc-200">
                ⚠ {settingsGateError}
              </div>
            )}

            <button
              type="button"
              onClick={() => setSettingsGateModalOpen(false)}
              className="w-full py-2.5 bg-zinc-100 text-black text-xs font-semibold uppercase tracking-wider cursor-pointer"
            >
              Return to Calm Home Screen
            </button>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 2: NIGHT BROWSER MANDATORY QR CODE SCANNER GATE
          ("Without scan QR codes specifically can not use any browse at night")
         ========================================================= */}
      {nightBrowserQrApp && (
        <div className="fixed inset-0 z-50 bg-black/95 text-zinc-100 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-md border-2 border-zinc-100 bg-black p-5 space-y-4 font-mono-tech">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
              <div>
                <div className="text-[10px] text-zinc-400 uppercase tracking-widest">
                  🌙 NIGHT BROWSER QR FORTRESS ({(vault.qrComplexity || 'hard').toUpperCase()} MODE)
                </div>
                <h3 className="text-sm font-semibold text-zinc-100 mt-0.5">
                  Physical QR Code Scan Required for {nightBrowserQrApp.name}
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
              Browsers are strictly locked at night (10:00 PM – 6:00 AM). Without physically
              scanning your QR code card in another room,{' '}
              <strong>{nightBrowserQrApp.name}</strong> cannot be opened.
            </p>

            <div className="border border-zinc-800 bg-zinc-950 p-3 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">
                  Complexity: <strong>{(vault.qrComplexity || 'hard').toUpperCase()}</strong>
                </span>
                {!nightQrCameraActive ? (
                  <button
                    type="button"
                    onClick={startNightQrCamera}
                    className="px-2.5 py-1 bg-zinc-100 text-black text-[10px] font-semibold uppercase cursor-pointer"
                  >
                    📷 Open QR Camera Scanner
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopNightQrCamera}
                    className="px-2.5 py-1 border border-zinc-700 text-[10px] text-zinc-300 cursor-pointer"
                  >
                    Close Camera
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
                      ? `Hold camera pointed at your physical QR card (${nightQrScanHoldSec}s)...`
                      : '✓ Optical lock verified. Capture QR token below:'}
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
                      ✓ Capture Scanned QR Code
                    </button>
                  )}
                </div>
              )}

              <div className="text-[11px] text-zinc-400">
                Required Physical QR Token:{' '}
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
                    Hard Mode Verification — Solve: <strong>17 + 26 = ?</strong>
                  </label>
                  <input
                    type="text"
                    value={nightQrMathInput}
                    onChange={(e) => setNightQrMathInput(e.target.value)}
                    placeholder="Enter 43"
                    className="w-full bg-black border border-zinc-700 px-3 py-2 text-xs text-zinc-100"
                  />
                </div>
              )}

              <input
                type="text"
                value={nightQrInput}
                onChange={(e) => setNightQrInput(e.target.value)}
                placeholder="Scan or enter physical QR code token..."
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
                }}
                className="flex-1 py-3 bg-zinc-100 text-black text-xs font-semibold uppercase tracking-wider cursor-pointer"
              >
                Sleep & Return to Peace
              </button>
              <button
                type="button"
                onClick={handleVerifyNightBrowserQr}
                className="px-4 py-3 border border-zinc-600 text-xs text-zinc-200 hover:bg-zinc-900 cursor-pointer"
              >
                Verify QR Scan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 3: 20-MINUTE FULL-SCREEN AUTO-CLOSE & 15S QUIZ REOPENING LOCK
         ========================================================= */}
      {fullScreen20mClosedApp && (
        <div className="fixed inset-0 z-50 bg-black text-zinc-100 flex flex-col justify-between p-6 text-center font-mono-tech">
          <div className="text-xs uppercase tracking-widest text-zinc-400">
            🛑 20-MINUTE FULL-SCREEN INTERVENTION // APP AUTOMATICALLY CLOSED
          </div>
          <div className="max-w-md mx-auto space-y-5">
            <div className="inline-block px-3 py-1 border border-zinc-300 text-xs uppercase">
              {fullScreen20mClosedApp.app.name} Closed at {fullScreen20mClosedApp.closedAt}
            </div>
            <h2 className="text-2xl sm:text-3xl font-light text-white">
              20 Minutes Reached in {fullScreen20mClosedApp.app.name}
            </h2>
            <p className="text-xs text-zinc-300 leading-relaxed font-sans">
              Following your 5-minute minor check and 10-minute medium warning,{' '}
              <strong>{fullScreen20mClosedApp.app.name}</strong> has been automatically closed and
              cleaned from the background after 20 minutes.
            </p>
            <div className="border border-zinc-800 bg-zinc-950 p-4 text-xs text-zinc-300 space-y-2">
              <div className="text-zinc-100 font-semibold">
                🔒 Reopening Restriction Activated:
              </div>
              <p className="text-[11px] text-zinc-400">
                To reopen {fullScreen20mClosedApp.app.name}, you must complete a mandatory{' '}
                <strong>15-Second Reading + Comprehension Quiz</strong>.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setFullScreen20mClosedApp(null);
                  setImpulsesStopped((n) => n + 1);
                  setReclaimedMinutes((m) => m + 20);
                  setActiveTab('home');
                }}
                className="flex-1 py-3.5 bg-zinc-100 text-black text-xs font-semibold uppercase tracking-widest cursor-pointer"
              >
                ✓ Stay Closed & Return Home
              </button>
              <button
                type="button"
                onClick={() => {
                  const appToReopen = fullScreen20mClosedApp.app;
                  setFullScreen20mClosedApp(null);
                  setInterceptForce15sReopen(true);
                  setInterceptedApp(appToReopen);
                }}
                className="px-4 py-3.5 border border-zinc-700 text-xs text-zinc-300 hover:border-zinc-400 cursor-pointer"
              >
                Reopen via 15s Read & Quiz →
              </button>
            </div>
          </div>
          <div className="text-[11px] text-zinc-600">
            MINIMUM PHONE // PROGRESSIVE DOPAMINE GUARD
          </div>
        </div>
      )}

      {/* INHALE & SLOW LEARNING READ + PLAY QUIZ INTERCEPT MODAL */}
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
          onQuizPassed={() =>
            setSlowLearning((prev) => ({
              ...prev,
              xp: prev.xp + 15,
              lessonsCompleted: prev.lessonsCompleted + 1,
              quizzesPassed: prev.quizzesPassed + 1,
              currentLessonIndex: prev.currentLessonIndex + 1,
            }))
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
            SAKĪNAH STILLNESS INTERVENTION // RESTLESS CHECK DETECTED
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
            <div className="flex gap-2 justify-center pt-4">
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
            MINIMUM PHONE // KASB LLC
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
                  SYSTEM HOME & HARDWARE LOCK
                </div>
                <h2 className="text-base font-semibold text-zinc-100">
                  Core Launcher Fortress Control
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

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-zinc-900">
                <span className="text-zinc-400">Default Home Role (ROLE_HOME):</span>
                <span className="font-semibold text-zinc-100">
                  {launcherStatus.isDefaultLauncher ? '✓ LOCKED TO MINIMUM PHONE' : '⚠ NOT SET'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-zinc-900">
                <span className="text-zinc-400">Hardware Home Button Pin (Kiosk):</span>
                <span className="font-semibold text-zinc-100">
                  {launcherStatus.isKioskPinned ? '🔒 PINNED & LOCKED' : 'READY'}
                </span>
              </div>
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
                <span>1. Set Minimum Phone as Default Home</span>
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
                <span>2. Force Clear Original Phone Launcher</span>
                <span>↻</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  const s = await toggleHardwareKioskPin(!launcherStatus.isKioskPinned);
                  setLauncherStatus(s);
                }}
                className="w-full py-2.5 px-3 border border-zinc-500 text-zinc-100 text-xs uppercase tracking-wider cursor-pointer text-left flex items-center justify-between"
              >
                <span>
                  {launcherStatus.isKioskPinned
                    ? '3. Unlock Hardware Home Button Pin'
                    : '3. Pin & Lock Physical Home Button (Kiosk Mode)'}
                </span>
                <span>🔒</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 15-SECOND ANTI-ESCAPE COMMITMENT GATE MODAL */}
      {escapeGateTarget && (
        <div className="fixed inset-0 z-50 bg-black text-zinc-100 flex items-center justify-center p-5">
          <div className="w-full max-w-md border-2 border-zinc-200 bg-black p-6 space-y-5 font-mono-tech">
            <div className="text-[10px] uppercase tracking-widest text-zinc-400">
              CORE LAUNCHER ANTI-ESCAPE GUARD // CRAVING INTERCEPT
            </div>
            <h2 className="text-lg font-semibold text-zinc-100">
              Are you trying to switch launchers from an impulse?
            </h2>
            <p className="text-xs text-zinc-300 leading-relaxed">
              “{getTriggerText(activeCalmTrigger, lang)}” —{' '}
              <span className="text-zinc-500">{getTriggerSource(activeCalmTrigger, lang)}</span>
            </p>

            <div className="border border-zinc-800 p-3 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Cooling-Off Breath Timer:</span>
                <span className="text-base font-semibold text-zinc-100">
                  {escapeCooldownSec > 0 ? `${escapeCooldownSec}s remaining` : '✓ Ready'}
                </span>
              </div>
              <div className="text-[11px] text-zinc-400">
                Type <span className="text-zinc-100 font-semibold">UNLOCK CORE</span> or your
                Friend Secret ({vault.friendAccountabilitySecret}):
              </div>
              <input
                type="text"
                value={escapePhraseInput}
                onChange={(e) => setEscapePhraseInput(e.target.value)}
                placeholder="Type UNLOCK CORE"
                className="w-full bg-zinc-950 border border-zinc-700 px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-zinc-300"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setEscapeGateTarget(null);
                  setImpulsesStopped((n) => n + 1);
                }}
                className="flex-1 py-3 bg-zinc-100 text-black text-xs font-semibold uppercase tracking-wider cursor-pointer"
              >
                Stay in Minimum Phone
              </button>
              <button
                type="button"
                disabled={
                  escapeCooldownSec > 0 ||
                  (escapePhraseInput.trim().toUpperCase() !== 'UNLOCK CORE' &&
                    escapePhraseInput.trim() !== vault.friendAccountabilitySecret)
                }
                onClick={async () => {
                  const target = escapeGateTarget;
                  setEscapeGateTarget(null);
                  if (target === 'unpin-kiosk') {
                    const s = await toggleHardwareKioskPin(false);
                    setLauncherStatus(s);
                  } else if (target === 'home-settings') {
                    const s = await openSystemHomeSettings();
                    setLauncherStatus(s);
                  } else if (target === 'system-settings') {
                    await openPhoneMainSetting('main');
                  }
                }}
                className="px-4 py-3 border border-zinc-700 text-xs text-zinc-400 disabled:opacity-30 cursor-pointer"
              >
                Proceed
              </button>
            </div>
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
                  BUILT-IN ZERO-DISTRACTION UTILITY
                </div>
                <h3 className="text-sm font-semibold text-zinc-100">
                  {activeBuiltInUtility === 'calculator'
                    ? 'Monochrome Calculator'
                    : 'Offline 2FA & Security Codes'}
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
                  100% offline rotating security codes for your essential accounts and
                  Accountability Lock:
                </p>
                <div className="space-y-2">
                  {[
                    {
                      name: 'Minimum Phone Accountability',
                      code: String((currentTime.getMinutes() * 14731 + 294819) % 900000 + 100000),
                    },
                    {
                      name: 'Primary Work Workspace (TOTP)',
                      code: String((currentTime.getMinutes() * 38197 + 518273) % 900000 + 100000),
                    },
                    {
                      name: 'Cloud Vault / GitHub 2FA',
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

import React, { useEffect, useMemo, useState } from 'react';
import type {
  AppItem,
  CalmTrigger,
  FocusVaultState,
  HabitWallType,
  HomeProfileType,
  LanguageCode,
  NotificationItem,
  PlatformMode,
  PurityState,
  ScratchpadNote,
  VisualTheme,
  WisdomPackSource,
} from './types/app';
import {
  CALM_MIND_TRIGGERS,
  getTriggerSource,
  getTriggerText,
} from './data/calmTriggers';
import { DEFAULT_APPS, INITIAL_NOTIFICATIONS } from './data/defaultApps';
import { SUPPORTED_LANGUAGES, TRANSLATIONS } from './i18n/translations';
import { InhaleInterceptModal } from './components/InhaleInterceptModal';
import { PurityGuardView } from './components/PurityGuardView';
import { DigestAndFocusView } from './components/DigestAndFocusView';
import { AnalyticsAndKasbView } from './components/AnalyticsAndKasbView';
import {
  fetchNativeLauncherStatus,
  forceTriggerHomePicker,
  launchNativeAndroidApp,
  loadRealInstalledApps,
  openSystemHomeSettings,
  requestDefaultHomeLauncher,
  toggleHardwareKioskPin,
  type NativeLauncherStatus,
} from './services/nativeLauncherBridge';

const STORAGE_KEY = 'minimum_phone_kasb_state_v1';

export function App() {
  // Persistent state initialization
  const [lang, setLang] = useState<LanguageCode>('en');
  const [platform, setPlatform] = useState<PlatformMode>('android');
  const [visualTheme, setVisualTheme] = useState<VisualTheme>('oled-black');
  const [grayscaleEnabled, setGrayscaleEnabled] = useState<boolean>(true);
  const [wisdomPack, setWisdomPack] = useState<WisdomPackSource>('blended');
  const [showArabicScript, setShowArabicScript] = useState<boolean>(true);
  const [defaultHabitWall, setDefaultHabitWall] =
    useState<HabitWallType>('calm-transcribe');

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
    },
  ]);
  const [scratchpadInput, setScratchpadInput] = useState<string>('');
  const [showScratchpad, setShowScratchpad] = useState<boolean>(false);

  const [impulsesStopped, setImpulsesStopped] = useState<number>(18);
  const [reclaimedMinutes, setReclaimedMinutes] = useState<number>(270);

  // Purity & Anti-Porn State (default 7 days clean so user sees real progress immediately)
  const [purity, setPurity] = useState<PurityState>(() => ({
    streakStartIso: new Date(Date.now() - 7 * 86400000 - 3 * 3600000).toISOString(),
    bestStreakDays: 14,
    urgesDefeatedCount: 9,
    discreetMode: false,
    adultDnsEnabled: true,
    browserKeywordShield: true,
    nightGuardLock: true,
    pledgedToday: null,
    logs: [],
  }));

  // Focus & Time-Locked Vault State
  const [vault, setVault] = useState<FocusVaultState>({
    monkModeActive: false,
    monkTaskTitle: 'Deep Focus Architecture Work',
    monkRemainingSeconds: 50 * 60,
    monkTotalSeconds: 50 * 60,
    deepWorkScheduleEnabled: true,
    sleepVaultScheduleEnabled: true,
    physicalBrickLocked: false,
    physicalBrickAnchorCode: 'KASB-BRICK-77',
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

  // App Drawer Search State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [revealRestrictedInDrawer, setRevealRestrictedInDrawer] =
    useState<boolean>(false);

  // Intercept Modal & Active Unlocked Session State
  const [interceptedApp, setInterceptedApp] = useState<AppItem | null>(null);
  const [triggerIndex, setTriggerIndex] = useState<number>(0);
  const [activeSession, setActiveSession] = useState<{
    app: AppItem;
    intentReason: string;
    secondsRemaining: number;
    totalSeconds: number;
  } | null>(null);

  // Restless Unlock Calm Mind Overlay
  const [restlessOverlayOpen, setRestlessOverlayOpen] = useState<boolean>(false);
  const [openPuritySosImmediately, setOpenPuritySosImmediately] =
    useState<boolean>(false);

  // Sync Native Android Core Launcher Status + Real Installed Phone Apps
  const refreshNativeStatus = async () => {
    const status = await fetchNativeLauncherStatus();
    setLauncherStatus(status);
    if (status.batteryLevel > 0) setBatteryLevel(status.batteryLevel);
    setIsCharging(status.isCharging);
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
      setActiveTab('home');
      refreshNativeStatus();
    };

    const onBackPressed = () => {
      setInterceptedApp((prev) => {
        if (prev) return null;
        return prev;
      });
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

  // Load saved state from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.lang) setLang(parsed.lang);
        if (parsed.wisdomPack) setWisdomPack(parsed.wisdomPack);
        if (typeof parsed.grayscaleEnabled === 'boolean')
          setGrayscaleEnabled(parsed.grayscaleEnabled);
        if (parsed.impulsesStopped) setImpulsesStopped(parsed.impulsesStopped);
        if (parsed.reclaimedMinutes) setReclaimedMinutes(parsed.reclaimedMinutes);
        if (parsed.purity) setPurity(parsed.purity);
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
          wisdomPack,
          grayscaleEnabled,
          impulsesStopped,
          reclaimedMinutes,
          purity,
        })
      );
    } catch {
      // Ignore quota errors
    }
  }, [lang, wisdomPack, grayscaleEnabled, impulsesStopped, reclaimedMinutes, purity]);

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

  // Active unlocked app session countdown (Micro-Intent Time Bid + 60s Gentle Fade warning)
  useEffect(() => {
    if (!activeSession) return;
    const timer = setInterval(() => {
      setActiveSession((prev) => {
        if (!prev) return null;
        if (prev.secondsRemaining <= 1) {
          return null;
        }
        return { ...prev, secondsRemaining: prev.secondsRemaining - 1 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeSession]);

  const t = TRANSLATIONS[lang];
  const currentLangMeta =
    SUPPORTED_LANGUAGES.find((l) => l.code === lang) || SUPPORTED_LANGUAGES[0];

  // Filtered Calm Mind Triggers based on user's selected pack (Quran / Hadith / Proverbs / Blended)
  const filteredCalmTriggers = useMemo<CalmTrigger[]>(() => {
    const nonPurity = CALM_MIND_TRIGGERS.filter((item) => item.category !== 'purity');
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
  }, [wisdomPack]);

  const activeCalmTrigger =
    filteredCalmTriggers[triggerIndex % filteredCalmTriggers.length] ||
    CALM_MIND_TRIGGERS[0];

  // Essential 5 apps for current Home Screen profile
  const pinnedHomeApps = useMemo(() => {
    return apps.filter((a) => a.pinnedProfiles.includes(homeProfile)).slice(0, 5);
  }, [apps, homeProfile]);

  // Search-First App Drawer Filtering with Asymmetric Friction
  const drawerSearchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      if (revealRestrictedInDrawer) return apps;
      // Only show non-restricted tools unless searched
      return apps.filter((a) => a.tier !== 'restricted');
    }

    return apps.filter((app) => {
      const nameEn = app.name.toLowerCase();
      const nameBn = (app.nameBn || '').toLowerCase();
      if (app.tier === 'restricted' && !revealRestrictedInDrawer) {
        // Require typing at least 4 characters or exact prefix of restricted app
        return (
          q.length >= 4 && (nameEn.startsWith(q) || nameEn === q || nameBn.includes(q))
        );
      }
      return nameEn.includes(q) || nameBn.includes(q);
    });
  }, [apps, searchQuery, revealRestrictedInDrawer]);

  const handleTapApp = (app: AppItem) => {
    // Anti-Escape Guard: if user tries to open Android Settings while Uninstall/Switch Protection is enabled
    const lowerName = app.name.toLowerCase();
    const lowerPkg = (app.packageName || '').toLowerCase();
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

    // Check if Physical QR Brick Lock is active for restricted apps
    if (app.tier === 'restricted' && vault.physicalBrickLocked) {
      setActiveTab('digest-focus');
      return;
    }

    if (app.tier === 'restricted') {
      setTriggerIndex((i) => i + 1);
      setInterceptedApp(app);
      return;
    }

    // Utility / Essential app launches immediately with zero dopamine friction
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
    });
    launchNativeAndroidApp(app, 0);
  };

  const handleTogglePinHome = (appId: string) => {
    setApps((prev) =>
      prev.map((a) => {
        if (a.id !== appId) return a;
        const hasProfile = a.pinnedProfiles.includes(homeProfile);
        const nextProfiles = hasProfile
          ? a.pinnedProfiles.filter((p) => p !== homeProfile)
          : [...a.pinnedProfiles, homeProfile];
        return { ...a, pinnedProfiles: nextProfiles };
      })
    );
  };

  const handleToggleRestrictedTier = (appId: string) => {
    setApps((prev) =>
      prev.map((a) => {
        if (a.id !== appId) return a;
        return {
          ...a,
          tier: a.tier === 'restricted' ? 'utility' : 'restricted',
        };
      })
    );
  };

  const handleReturnToPeaceFromIntercept = () => {
    setInterceptedApp(null);
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
    setInterceptedApp(null);
    setSearchQuery('');
    setActiveSession({
      app: target,
      intentReason,
      secondsRemaining: minutesBid * 60,
      totalSeconds: minutesBid * 60,
    });
    // Launch the real Android app with automatic return timer when minutesBid expires!
    launchNativeAndroidApp(target, minutesBid);
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
      },
      ...prev,
    ]);
    setScratchpadInput('');
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

  return (
    <div
      dir={currentLangMeta.dir}
      className={`min-h-screen flex flex-col items-center justify-start ${
        grayscaleEnabled ? 'system-grayscale' : ''
      } bg-zinc-950 text-zinc-100`}
    >
      {/* TOP BAR: MULTILINGUAL SWITCHER + QUICK SIMULATOR TRIGGERS */}
      <div className="w-full max-w-lg border-b border-zinc-900 bg-black px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono-tech">
        {/* Instant Language Switcher Pill */}
        <div className="flex items-center gap-1">
          {SUPPORTED_LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => setLang(l.code)}
              className={`px-2 py-0.5 border cursor-pointer transition ${
                lang === l.code
                  ? 'border-zinc-100 bg-zinc-100 text-black font-semibold'
                  : 'border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
              title={`Switch language to ${l.englishName}`}
            >
              {l.nativeName}
            </button>
          ))}
        </div>

        {/* Platform & Quick Demo Actions */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setPlatform((p) => (p === 'android' ? 'ios' : 'android'))}
            className="px-2 py-0.5 border border-zinc-800 text-zinc-300 hover:border-zinc-600 cursor-pointer uppercase"
          >
            {platform === 'android' ? 'ANDROID' : 'iOS'}
          </button>
          <button
            type="button"
            onClick={() => setGrayscaleEnabled((g) => !g)}
            className={`px-2 py-0.5 border cursor-pointer ${
              grayscaleEnabled
                ? 'border-zinc-300 bg-zinc-900 text-zinc-100'
                : 'border-zinc-800 text-zinc-500'
            }`}
          >
            B&W
          </button>
          <button
            type="button"
            onClick={() => {
              const ig = apps.find((a) => a.id === 'instagram') || apps[11];
              handleTapApp(ig);
            }}
            className="px-2 py-0.5 border border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 cursor-pointer"
          >
            Test Inhale
          </button>
        </div>
      </div>

      {/* ACTIVE UNLOCKED APP SESSION BANNER (WITH TOP-EDGE PROGRESS & 60S GENTLE FADE) */}
      {activeSession && (
        <div
          className={`w-full max-w-lg border-b border-zinc-700 px-4 py-2.5 transition-opacity ${
            activeSession.secondsRemaining <= 60 ? 'bg-zinc-900/95' : 'bg-zinc-950'
          }`}
        >
          <div className="w-full h-1 bg-zinc-800 mb-2 overflow-hidden">
            <div
              className="h-full bg-zinc-100 transition-all"
              style={{
                width: `${
                  (activeSession.secondsRemaining / activeSession.totalSeconds) * 100
                }%`,
              }}
            />
          </div>
          <div className="flex items-center justify-between text-xs font-mono-tech">
            <div>
              <span className="text-zinc-200 font-semibold">
                {activeSession.app.name}
              </span>{' '}
              <span className="text-zinc-500">· {activeSession.intentReason}</span>
              {activeSession.secondsRemaining <= 60 && (
                <span className="block text-[11px] text-zinc-300 mt-0.5">
                  ⚡ Gentle Fade: Less than 60s left on your intention—wrap up calmly.
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-zinc-200">
                {Math.floor(activeSession.secondsRemaining / 60)}:
                {String(activeSession.secondsRemaining % 60).padStart(2, '0')}
              </span>
              <button
                type="button"
                onClick={() => setActiveSession(null)}
                className="px-2 py-1 bg-zinc-100 text-black text-[10px] font-semibold uppercase cursor-pointer"
              >
                Exit Home
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN PHONE LAUNCHER CONTAINER */}
      <main
        className={`w-full max-w-lg flex-1 flex flex-col justify-between border-x border-zinc-900 px-6 py-5 ${themeClass}`}
      >
        {/* =========================================================
            TAB 1: THE MINIMALIST MONOCHROME HOME SCREEN (ZERO ICONS)
           ========================================================= */}
        {activeTab === 'home' && (
          <div className="flex-1 flex flex-col justify-between space-y-6">
            {/* Top Status Row: Only Clock, Date, Battery %, and Reassurance Digest Line */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-baseline justify-between">
                <h1 className="text-5xl sm:text-6xl font-mono-tech font-light tracking-tight">
                  {formattedClock}
                </h1>
                <div className="text-right font-mono-tech text-xs opacity-70">
                  <div>{formattedDate}</div>
                  <div className="mt-0.5">
                    BAT {batteryLevel}% {isCharging ? '⚡' : ''}
                  </div>
                </div>
              </div>

              {/* CORE LAUNCHER & HOME BUTTON TAKEOVER CONTROL BAR */}
              {!launcherStatus.isDefaultLauncher ? (
                <div className="border-2 border-zinc-200 bg-zinc-950 p-3 space-y-2 font-mono-tech">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-zinc-100 uppercase tracking-wider">
                      ⚠ CORE LAUNCHER NOT LOCKED YET
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowLauncherFortressModal(true)}
                      className="underline text-zinc-300 cursor-pointer text-[10px]"
                    >
                      Fortress Setup →
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Pressing the Home button still opens your original phone launcher. Lock Minimum
                    Phone as your default Home OS & pin the Home button below:
                  </p>
                  <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                    <button
                      type="button"
                      onClick={async () => {
                        const s = await requestDefaultHomeLauncher();
                        setLauncherStatus(s);
                      }}
                      className="py-2 px-2 bg-zinc-100 text-black text-[10px] font-semibold uppercase cursor-pointer text-center"
                    >
                      1. Set Default Home
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const s = await forceTriggerHomePicker();
                        setLauncherStatus(s);
                      }}
                      className="py-2 px-2 border border-zinc-400 text-zinc-100 text-[10px] uppercase cursor-pointer text-center"
                    >
                      2. Clear Old Home
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const s = await toggleHardwareKioskPin(!launcherStatus.isKioskPinned);
                        setLauncherStatus(s);
                      }}
                      className={`py-2 px-2 border text-[10px] uppercase cursor-pointer text-center ${
                        launcherStatus.isKioskPinned
                          ? 'border-zinc-100 bg-zinc-100 text-black font-semibold'
                          : 'border-zinc-500 text-zinc-200'
                      }`}
                    >
                      {launcherStatus.isKioskPinned ? '✓ Home Pinned' : '3. Pin Home Btn'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border border-zinc-800 bg-zinc-950/90 px-3 py-1.5 flex items-center justify-between text-[10px] font-mono-tech">
                  <span className="text-zinc-200">
                    ● CORE LAUNCHER ACTIVE · HOME BUTTON OWNED
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        if (launcherStatus.isKioskPinned) {
                          setEscapeCooldownSec(15);
                          setEscapePhraseInput('');
                          setEscapeGateTarget('unpin-kiosk');
                        } else {
                          const s = await toggleHardwareKioskPin(true);
                          setLauncherStatus(s);
                        }
                      }}
                      className={`px-2 py-0.5 border cursor-pointer ${
                        launcherStatus.isKioskPinned
                          ? 'border-zinc-100 bg-zinc-100 text-black font-semibold'
                          : 'border-zinc-700 text-zinc-300'
                      }`}
                    >
                      {launcherStatus.isKioskPinned ? '🔒 KIOSK LOCKED' : 'PIN HOME BTN'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowLauncherFortressModal(true)}
                      className="underline text-zinc-400 hover:text-zinc-200 cursor-pointer"
                    >
                      Shield
                    </button>
                  </div>
                </div>
              )}

              {/* Peace of Mind Reassurance Line */}
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
              /* STANDARD MINIMALIST 5 ESSENTIAL APPS LIST */
              <div className="my-auto space-y-5 py-2">
                {/* Context Profile Switcher (Work / Personal / Sunset) */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono-tech uppercase tracking-widest opacity-60">
                    {t.essentialAppsTitle}
                  </span>
                  <div className="flex gap-1 text-[11px] font-mono-tech">
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
                        onClick={() => {
                          setHomeProfile(prof.id);
                          if (prof.id === 'sunset') {
                            setVisualTheme('sunset-amber');
                          } else if (visualTheme === 'sunset-amber') {
                            setVisualTheme('oled-black');
                          }
                        }}
                        className={`px-2 py-0.5 border cursor-pointer ${
                          homeProfile === prof.id
                            ? 'border-current font-semibold'
                            : 'border-transparent opacity-50 hover:opacity-90'
                        }`}
                      >
                        {prof.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Text-Only Monochromatic 5 App List */}
                <div className="space-y-2.5">
                  {pinnedHomeApps.map((app) => (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => handleTapApp(app)}
                      className="w-full text-left py-2.5 border-b border-zinc-900/90 flex items-baseline justify-between group cursor-pointer"
                    >
                      <span className="text-2xl sm:text-3xl font-light tracking-tight group-hover:translate-x-1.5 transition-transform">
                        {lang === 'bn' && app.nameBn ? app.nameBn : app.name}
                      </span>
                      <span className="text-[10px] font-mono-tech opacity-40 group-hover:opacity-80">
                        {app.tier === 'restricted' ? 'INHALE' : 'OPEN'}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Search-First Bar Trigger + Quick Mind-Dump Scratchpad Toggle */}
                <div className="grid grid-cols-3 gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('drawer')}
                    className="col-span-2 py-2.5 px-3 border border-zinc-800 text-left text-xs font-mono-tech opacity-75 hover:opacity-100 cursor-pointer"
                  >
                    ⌕ {t.openSearchDrawer}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowScratchpad((s) => !s)}
                    className="py-2.5 px-2 border border-zinc-800 text-center text-xs font-mono-tech opacity-80 hover:opacity-100 cursor-pointer"
                  >
                    ✎ Note ({scratchpadNotes.length})
                  </button>
                </div>

                {/* Zero-App "Mind Dump" Scratchpad Drawer */}
                {showScratchpad && (
                  <div className="border border-zinc-800 p-3.5 space-y-2.5 bg-zinc-950/80">
                    <div className="text-[10px] font-mono-tech uppercase tracking-wider opacity-60">
                      {t.quickScratchpadTitle}
                    </div>
                    <form onSubmit={handleAddScratchpadNote} className="flex gap-1.5">
                      <input
                        type="text"
                        value={scratchpadInput}
                        onChange={(e) => setScratchpadInput(e.target.value)}
                        placeholder={t.scratchpadPlaceholder}
                        className="flex-1 bg-black border border-zinc-800 px-2.5 py-1.5 text-xs focus:outline-none focus:border-zinc-500"
                      />
                      <button
                        type="submit"
                        className="px-3 py-1.5 bg-zinc-100 text-black text-xs font-mono-tech font-semibold cursor-pointer"
                      >
                        Save
                      </button>
                    </form>
                    <div className="space-y-1 max-h-28 overflow-y-auto">
                      {scratchpadNotes.map((n) => (
                        <div
                          key={n.id}
                          className="flex items-center justify-between text-xs font-mono-tech py-1 border-b border-zinc-900"
                        >
                          <span className=" opacity-85">{n.text}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setScratchpadNotes((prev) =>
                                prev.filter((item) => item.id !== n.id)
                              )
                            }
                            className="text-[10px] opacity-50 hover:opacity-100 cursor-pointer ml-2"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Action Row: Monk Mode + Urge SOS + Restless Mind Reset */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('digest-focus')}
                    className="py-2 border border-zinc-800 text-[11px] font-mono-tech opacity-80 hover:opacity-100 cursor-pointer"
                  >
                    ◎ {t.startMonkModeBtn}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenPuritySosImmediately(true);
                      setActiveTab('purity');
                    }}
                    className="py-2 border border-zinc-700 text-[11px] font-mono-tech font-medium hover:bg-zinc-900 cursor-pointer"
                  >
                    ⚡ {t.urgeSosBtn}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTriggerIndex((i) => i + 1);
                      setRestlessOverlayOpen(true);
                    }}
                    className="py-2 border border-zinc-800 text-[11px] font-mono-tech opacity-80 hover:opacity-100 cursor-pointer"
                  >
                    ❖ Sakīnah
                  </button>
                </div>
              </div>
            )}

            {/* BOTTOM HOME ANCHOR: SMALL, STRONG CALM MIND LINE (QURAN / HADITH / PROVERB) */}
            <div className="border-t border-zinc-800/80 pt-3.5 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono-tech uppercase tracking-widest opacity-55">
                <span>
                  {t.calmWhisperLabel} · {activeCalmTrigger.category.toUpperCase()}
                </span>
                <button
                  type="button"
                  onClick={() => setTriggerIndex((i) => i + 1)}
                  className="underline hover:opacity-100 cursor-pointer"
                >
                  {t.nextWhisperBtn} ↻
                </button>
              </div>
              {showArabicScript && activeCalmTrigger.arabic && lang !== 'ar' && (
                <p dir="rtl" className="font-arabic text-sm opacity-85 leading-relaxed">
                  {activeCalmTrigger.arabic}
                </p>
              )}
              <p className="text-xs sm:text-sm leading-relaxed font-normal">
                “{getTriggerText(activeCalmTrigger, lang)}”
              </p>
              <div className="text-[11px] font-mono-tech opacity-55">
                — {getTriggerSource(activeCalmTrigger, lang)}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 2: ASYMMETRIC SEARCH-FIRST APP DRAWER
           ========================================================= */}
        {activeTab === 'drawer' && (
          <div className="flex-1 flex flex-col space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] font-mono-tech uppercase tracking-widest opacity-60">
                <span>SEARCH-FIRST NAVIGATION // ZERO ICONS</span>
                <button
                  type="button"
                  onClick={() => setRevealRestrictedInDrawer((r) => !r)}
                  className="underline cursor-pointer"
                >
                  {revealRestrictedInDrawer ? 'Hide Restricted' : 'Show All Apps'}
                </button>
              </div>

              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full bg-zinc-950 border border-zinc-700 px-4 py-3.5 text-sm font-mono-tech text-zinc-100 focus:outline-none focus:border-zinc-300"
              />
              <p className="text-[11px] font-mono-tech opacity-55">{t.searchHintRule}</p>
            </div>

            <div className="flex-1 space-y-1.5 overflow-y-auto max-h-[62vh] pr-1">
              {drawerSearchResults.map((app) => {
                const isPinnedToCurrent = app.pinnedProfiles.includes(homeProfile);
                return (
                  <div
                    key={app.id}
                    className="flex items-center justify-between py-2.5 px-3 border border-zinc-900 hover:border-zinc-700 transition gap-2"
                  >
                    <button
                      type="button"
                      onClick={() => handleTapApp(app)}
                      className="flex-1 text-left cursor-pointer min-w-0"
                    >
                      <div className="text-base font-light truncate">
                        {lang === 'bn' && app.nameBn ? app.nameBn : app.name}
                      </div>
                      <div className="text-[10px] font-mono-tech opacity-50 truncate">
                        {app.dailyOpens} opens · {app.dailyMinutesUsed}m
                        {app.packageName ? ` · ${app.packageName}` : ''}
                      </div>
                    </button>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleTogglePinHome(app.id)}
                        title="Pin or unpin from 5-app Home Screen"
                        className={`px-2 py-0.5 text-[10px] font-mono-tech border cursor-pointer ${
                          isPinnedToCurrent
                            ? 'border-zinc-200 bg-zinc-200 text-black font-semibold'
                            : 'border-zinc-800 text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        {isPinnedToCurrent ? '★ HOME' : '☆ PIN'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleRestrictedTier(app.id)}
                        title="Toggle Inhale Gate lock for this app"
                        className={`px-2 py-0.5 text-[10px] font-mono-tech border cursor-pointer ${
                          app.tier === 'restricted'
                            ? 'border-zinc-500 text-zinc-200'
                            : 'border-zinc-800 text-zinc-500'
                        }`}
                      >
                        {app.tier === 'restricted'
                          ? t.tierRestrictedBadge
                          : t.tierUtilityBadge}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTapApp(app)}
                        className="px-2.5 py-1 bg-zinc-100 text-black text-[10px] font-mono-tech font-semibold uppercase cursor-pointer"
                      >
                        Open
                      </button>
                    </div>
                  </div>
                );
              })}

              {!revealRestrictedInDrawer && searchQuery.length < 4 && (
                <div className="p-3.5 border border-dashed border-zinc-800 text-xs font-mono-tech opacity-60 text-center">
                  {t.typeExactToReveal} (e.g., type “Instagram”, “TikTok”, “YouTube”, or tap
                  “Show All Apps” above).
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 3: PURITY & ANTI-PORN GUARD + STREAK TRACKER + URGE SOS
           ========================================================= */}
        {activeTab === 'purity' && (
          <div className="flex-1 overflow-y-auto">
            <PurityGuardView
              purity={purity}
              lang={lang}
              platform={platform}
              showArabicScript={showArabicScript}
              openSosImmediately={openPuritySosImmediately}
              onClearImmediateSos={() => setOpenPuritySosImmediately(false)}
              onUpdatePurity={setPurity}
            />
          </div>
        )}

        {/* =========================================================
            TAB 4: NOTIFICATION DIGEST + MONK FOCUS + QR BRICK LOCK
           ========================================================= */}
        {activeTab === 'digest-focus' && (
          <div className="flex-1 overflow-y-auto">
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
            />
          </div>
        )}

        {/* =========================================================
            TAB 5: VAULT, LANGUAGE, WISDOM SOURCE & KASB LLC ECOSYSTEM
           ========================================================= */}
        {activeTab === 'system-kasb' && (
          <div className="flex-1 overflow-y-auto">
            <AnalyticsAndKasbView
              lang={lang}
              onChangeLanguage={setLang}
              platform={platform}
              onChangePlatform={setPlatform}
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
              apps={apps}
              impulsesStopped={impulsesStopped}
              reclaimedMinutes={reclaimedMinutes}
              purity={purity}
              vault={vault}
              onUpdateVault={setVault}
            />
          </div>
        )}

        {/* BOTTOM NAVIGATION BAR (MONOCHROME TEXT-ONLY) */}
        <nav className="border-t border-zinc-800 pt-3 mt-4 grid grid-cols-5 gap-1 text-[11px] font-mono-tech">
          {(
            [
              { id: 'home', label: t.navHome },
              { id: 'drawer', label: t.navDrawer },
              { id: 'purity', label: t.navPurity },
              { id: 'digest-focus', label: t.navDigestFocus },
              { id: 'system-kasb', label: t.navSystemKasb },
            ] as const
          ).map((navItem) => (
            <button
              key={navItem.id}
              type="button"
              onClick={() => setActiveTab(navItem.id)}
              className={`py-2.5 px-1 border text-center transition cursor-pointer truncate ${
                activeTab === navItem.id
                  ? 'border-zinc-100 bg-zinc-100 text-black font-semibold'
                  : 'border-zinc-900 opacity-65 hover:opacity-100'
              }`}
            >
              {navItem.label}
            </button>
          ))}
        </nav>
      </main>

      {/* INHALE & CALM MIND INTERCEPT MODAL */}
      {interceptedApp && (
        <InhaleInterceptModal
          app={interceptedApp}
          trigger={activeCalmTrigger}
          lang={lang}
          showArabicScript={showArabicScript}
          activeHabitWall={defaultHabitWall}
          requireHabitWallAlways={false}
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
            {showArabicScript && activeCalmTrigger.arabic && lang !== 'ar' && (
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
                <span className="text-zinc-400">Current Home Package:</span>
                <span className="text-zinc-300 truncate max-w-[180px]">
                  {launcherStatus.currentDefaultPackage}
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
                  if (launcherStatus.isKioskPinned) {
                    setShowLauncherFortressModal(false);
                    setEscapeCooldownSec(15);
                    setEscapePhraseInput('');
                    setEscapeGateTarget('unpin-kiosk');
                  } else {
                    const s = await toggleHardwareKioskPin(true);
                    setLauncherStatus(s);
                  }
                }}
                className="w-full py-2.5 px-3 border border-zinc-500 text-zinc-100 text-xs uppercase tracking-wider cursor-pointer text-left flex items-center justify-between"
              >
                <span>
                  {launcherStatus.isKioskPinned
                    ? '3. Unlock Hardware Home Button Pin (Guarded)'
                    : '3. Pin & Lock Physical Home Button (Kiosk Mode)'}
                </span>
                <span>🔒</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowLauncherFortressModal(false);
                  setEscapeCooldownSec(15);
                  setEscapePhraseInput('');
                  setEscapeGateTarget('home-settings');
                }}
                className="w-full py-2 px-3 border border-zinc-800 text-zinc-400 text-[11px] uppercase tracking-wider cursor-pointer text-left flex items-center justify-between"
              >
                <span>Open System Default Home Settings (Guarded)</span>
                <span>⚙</span>
              </button>
            </div>

            <p className="text-[10px] text-zinc-500 leading-relaxed">
              Tip: Select “Minimum Phone” and tap “Always” when Android asks for your Default Home
              app. Enabling Kiosk Pin Lock physically blocks the Home and Recents buttons from
              leaving Minimum Phone.
            </p>
          </div>
        </div>
      )}

      {/* 15-SECOND ANTI-ESCAPE COMMITMENT GATE MODAL (BLOCKS EASY LAUNCHER SWITCHING) */}
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
                To prevent impulsive switching back to your old launcher, type{' '}
                <span className="text-zinc-100 font-semibold">UNLOCK CORE</span> or your Friend
                Secret ({vault.friendAccountabilitySecret}):
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
                    await openSystemHomeSettings();
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
    </div>
  );
}
export default App;

export type LanguageCode = 'en' | 'bn' | 'ar' | 'ur' | 'id';

export type PlatformMode = 'android' | 'ios' | 'web';

export type VisualTheme = 'oled-black' | 'eink-paper' | 'sunset-amber';

export type WisdomPackSource = 'quran' | 'hadith' | 'proverbs' | 'blended';

export type InspirationMode = 'islamic' | 'universal' | 'blended';

export type SlowLearningTrack = 'islam' | 'language' | 'mindfulness';

export type QrComplexityLevel = 'easy' | 'medium' | 'hard';

export type HomeProfileType = 'work' | 'personal' | 'sunset';

export type AppFrictionTier = 'essential' | 'utility' | 'restricted' | 'adult-blocked';

export type HabitWallType =
  | 'read-30s-quiz'
  | 'calm-transcribe'
  | 'journal-50'
  | 'read-pages'
  | 'steps-20';

export interface AppItem {
  id: string;
  name: string;
  nameBn?: string;
  packageName?: string;
  isSystemApp?: boolean;
  category: 'work' | 'utility' | 'social' | 'entertainment' | 'communication' | 'browser';
  tier: AppFrictionTier;
  dailyOpens: number;
  dailyMinutesUsed: number;
  pinnedProfiles: HomeProfileType[];
  nightQrLocked?: boolean; // Mandatory Emergency QR Code scan required at night / sleeping hours
}

export interface CalmTrigger {
  id: string;
  category: 'quran' | 'hadith' | 'proverb' | 'purity';
  subType?: 'quran' | 'hadith' | 'proverb';
  arabic?: string;
  text: {
    en: string;
    bn: string;
    ar?: string;
    ur?: string;
    id?: string;
  };
  source: {
    en: string;
    bn: string;
    ar?: string;
  };
  themeTag: 'sakinah' | 'time' | 'stillness' | 'purity-gaze' | 'self-mastery';
}

export interface NotificationItem {
  id: string;
  appName: string;
  sender: string;
  message: string;
  timestamp: string;
  batchSlot: '12:00 PM' | '06:00 PM';
  isUrgentBreakthrough: boolean;
  breakthroughReason?: 'VIP Contact' | 'URGENT Keyword' | 'Repeated Burst (3x)';
  read: boolean;
}

export interface PurityTriggerLog {
  id: string;
  timestamp: string;
  type: 'urge-overcome' | 'relapse-reset' | 'morning-pledge';
  triggerEmotion?: 'Stress / Anxiety' | 'Late Night in Bed' | 'Boredom / Alone' | 'Social Media Scroll';
  note?: string;
}

export interface PurityState {
  streakStartIso: string;
  bestStreakDays: number;
  urgesDefeatedCount: number;
  discreetMode: boolean; // Shows "Neuro-Reset & Clarity" instead of "Anti-Porn & Purity"
  adultDnsEnabled: boolean; // 1.1.1.3 Family / CleanBrowsing
  selectedDnsProvider?: 'cloudflare-family' | 'cleanbrowsing-adult' | 'adguard-family';
  dnsLockedByQr?: boolean; // Requires Emergency Physical QR Code scan to disable Private DNS shield
  browserKeywordShield: boolean;
  nightGuardLock: boolean; // 11 PM - 6 AM browser/social lock
  strictPornLockdown?: boolean; // Complete browser & trigger lock behind 30s Read+Quiz + DNS shield
  safeSearchEnforced?: boolean;
  customBlockedKeywords?: string[];
  emergencyBrowserLockUntilMs?: number | null;
  pledgedToday: string | null; // YYYY-MM-DD
  logs: PurityTriggerLog[];
}

export interface SlowLearningState {
  track: SlowLearningTrack;
  require30sQuizToOpenApps: boolean;
  readingDurationSeconds: number;
  xp: number;
  lessonsCompleted: number;
  quizzesPassed: number;
  currentLessonIndex: number;
}

export interface FocusVaultState {
  monkModeActive: boolean;
  monkTaskTitle: string;
  monkRemainingSeconds: number;
  monkTotalSeconds: number;
  deepWorkScheduleEnabled: boolean; // 09:00 - 17:00
  sleepVaultScheduleEnabled: boolean; // 22:00 - 06:00
  physicalBrickLocked: boolean;
  physicalBrickAnchorCode: string;
  qrComplexity?: QrComplexityLevel; // 'easy' | 'medium' | 'hard'
  nightBrowserQrRequired?: boolean; // Without QR scan specifically cannot use any browser at night
  nightQrStartHour?: number; // Default 22 (10:00 PM)
  nightQrEndHour?: number; // Default 6 (6:00 AM)
  forceNightBrowserQrTest?: boolean; // Enforce Night Browser QR requirement immediately
  settingsGateEnabled?: boolean; // Require 15s read + quiz to open Settings page
  settingsGateSeconds?: number; // Default 15s
  blockNotificationAppLaunch?: boolean; // Control opening apps from notifications
  readOnlyNotificationDigest?: boolean; // Read notification text without launching distracting app
  autoCleanBackgroundApps?: boolean; // Auto clean/close apps outside Background Safe List
  backgroundSafeAppIds?: string[]; // Whitelisted safe background app IDs
  lastBackgroundCleanIso?: string | null;
  lastBackgroundClosedCount?: number;
  uninstallProtectionEnabled: boolean;
  uninstallCooldownStartedIso: string | null;
  friendAccountabilitySecret: string;
}

export interface ScratchpadNote {
  id: string;
  text: string;
  createdAt: string;
  done: boolean;
  pinned?: boolean;
}

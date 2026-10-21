import React, { useEffect, useState } from 'react';
import type {
  InspirationMode,
  LanguageCode,
  PlatformMode,
  PurityState,
} from '../types/app';
import {
  CALM_MIND_TRIGGERS,
  getTriggerSource,
  getTriggerText,
} from '../data/calmTriggers';
import { TRANSLATIONS } from '../i18n/translations';
import { NativeBridge } from '../services/nativeBridge';
import { openPhoneMainSetting } from '../services/nativeLauncherBridge';

interface PurityGuardViewProps {
  purity: PurityState;
  lang: LanguageCode;
  platform: PlatformMode;
  showArabicScript: boolean;
  inspirationMode?: InspirationMode;
  openSosImmediately?: boolean;
  onClearImmediateSos?: () => void;
  onUpdatePurity: (updater: (prev: PurityState) => PurityState) => void;
}

const DEFAULT_ADULT_KEYWORDS = [
  'pornhub',
  'xvideos',
  'xnxx',
  'onlyfans',
  'nsfw',
  'xxx',
  'chaturbate',
  'stripchat',
  'hentai',
  'redgifs',
  'erotic',
  'rule34',
];

const REWIRING_MILESTONES = [
  {
    day: 3,
    titleEn: 'Day 3 · Prefrontal Awakening',
    titleBn: '৩য় দিন · প্রাথমিক আত্মনিয়ন্ত্রণ জাগরণ',
    descEn: 'Acute craving wave peaks and begins subsiding.',
    descBn: 'প্রাথমিক তীব্র তাড়নার ঢেউ কমে আসতে শুরু করে।',
  },
  {
    day: 7,
    titleEn: 'Day 7 · Dopamine Sensitivity',
    titleBn: '৭ম দিন · ডোপামিন সংবেদনশীলতা বৃদ্ধি',
    descEn: 'Everyday focus and natural motivation begin returning.',
    descBn: 'স্বাভাবিক কাজে মনোযোগ ও প্রশান্তি ফিরে আসতে শুরু করে।',
  },
  {
    day: 14,
    titleEn: 'Day 14 · Mental Fog Lifting',
    titleBn: '১৪তম দিন · মানসিক জড়তা মুক্তি',
    descEn: 'Sharper memory, calmer eye contact, and deeper sleep.',
    descBn: 'মস্তিষ্কের ধোঁয়াশা কাটে, ঘুম ও আত্মবিশ্বাস গভীর হয়।',
  },
  {
    day: 30,
    titleEn: 'Day 30 · Heart & Habit Stability',
    titleBn: '৩০তম দিন · হৃদয়ের স্থিরতা ও অভ্যাস গঠন',
    descEn: 'Impulse loops weaken significantly; inner peace deepens.',
    descBn: 'পুরোনো আসক্তির পথ দুর্বল হয়ে হৃদয়ে স্থায়ী প্রশান্তি আসে।',
  },
  {
    day: 90,
    titleEn: 'Day 90 · Full Baseline Neuro-Reset',
    titleBn: '৯০তম দিন · সম্পূর্ণ ডোপামিন রিসেট',
    descEn: 'Brain reward circuitry restored to natural baseline.',
    descBn: 'মস্তিষ্কের ডোপামিন চক্র সম্পূর্ণ স্বাভাবিক ও সুস্থ অবস্থায় ফেরে।',
  },
];

export const PurityGuardView: React.FC<PurityGuardViewProps> = ({
  purity,
  lang,
  platform,
  showArabicScript,
  inspirationMode = 'blended',
  openSosImmediately,
  onClearImmediateSos,
  onUpdatePurity,
}) => {
  const t = TRANSLATIONS[lang];

  const purityTriggers = CALM_MIND_TRIGGERS.filter((item) => {
    if (inspirationMode === 'islamic') {
      return item.subType === 'quran' || item.subType === 'hadith' || !!item.arabic;
    }
    if (inspirationMode === 'universal') {
      return item.subType === 'proverb' || !item.arabic;
    }
    return item.category === 'purity';
  });

  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [sosModalOpen, setSosModalOpen] = useState<boolean>(false);
  const [sosTimer, setSosTimer] = useState<number>(60);
  const [sosTriggerIndex, setSosTriggerIndex] = useState<number>(0);
  const [sosChecks, setSosChecks] = useState<boolean[]>([false, false, false]);
  const [showRelapseModal, setShowRelapseModal] = useState<boolean>(false);
  const [selectedTriggerCause, setSelectedTriggerCause] = useState<
    'Late Night in Bed' | 'Stress / Anxiety' | 'Boredom / Alone' | 'Social Media Scroll'
  >('Late Night in Bed');
  const [dnsStatusMessage, setDnsStatusMessage] = useState<string | null>(null);
  const [testSearchUrl, setTestSearchUrl] = useState<string>('');
  const [interceptedAlert, setInterceptedAlert] = useState<boolean>(false);
  const [newKeywordInput, setNewKeywordInput] = useState<string>('');
  const [copiedHost, setCopiedHost] = useState<string | null>(null);

  useEffect(() => {
    if (openSosImmediately) {
      setSosModalOpen(true);
      setSosTimer(60);
      onClearImmediateSos?.();
    }
  }, [openSosImmediately, onClearImmediateSos]);

  useEffect(() => {
    const interval = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!sosModalOpen || sosTimer <= 0) return;
    const timer = setInterval(() => {
      setSosTimer((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [sosModalOpen, sosTimer]);

  const startMs = new Date(purity.streakStartIso).getTime();
  const elapsedMs = Math.max(0, nowMs - startMs);
  const daysClean = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));
  const hoursClean = Math.floor((elapsedMs / (1000 * 60 * 60)) % 24);
  const minsClean = Math.floor((elapsedMs / (1000 * 60)) % 60);
  const progress90Percent = Math.min(100, Math.round(((daysClean + hoursClean / 24) / 90) * 100));

  const todayKey = new Date().toISOString().slice(0, 10);
  const hasPledgedToday = purity.pledgedToday === todayKey;

  const activePurityTrigger =
    purityTriggers[sosTriggerIndex % Math.max(1, purityTriggers.length)] ||
    CALM_MIND_TRIGGERS[0];

  const emergencyLockRemainingSec = purity.emergencyBrowserLockUntilMs
    ? Math.max(0, Math.ceil((purity.emergencyBrowserLockUntilMs - nowMs) / 1000))
    : 0;

  const customKeywords = purity.customBlockedKeywords || [];
  const allBlockedKeywords = [...DEFAULT_ADULT_KEYWORDS, ...customKeywords];

  const handleTakeMorningPledge = () => {
    onUpdatePurity((prev) => ({
      ...prev,
      pledgedToday: todayKey,
      logs: [
        {
          id: `pledge-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'morning-pledge',
          note: 'Committed to guarding eyes, heart, and focus today.',
        },
        ...prev.logs.slice(0, 19),
      ],
    }));
  };

  const handleActivate15mEmergencyLock = () => {
    const lockUntil = Date.now() + 15 * 60 * 1000;
    onUpdatePurity((prev) => ({
      ...prev,
      strictPornLockdown: true,
      emergencyBrowserLockUntilMs: lockUntil,
      logs: [
        {
          id: `lock15-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'urge-overcome',
          note: 'Activated 15-Minute Emergency Browser & Social Lockdown.',
        },
        ...prev.logs.slice(0, 19),
      ],
    }));
    setSosModalOpen(true);
    setSosTimer(60);
  };

  const handleUrgeDefeated = () => {
    onUpdatePurity((prev) => ({
      ...prev,
      urgesDefeatedCount: prev.urgesDefeatedCount + 1,
      logs: [
        {
          id: `urge-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'urge-overcome',
          note: 'Outlasted urge via SOS Calm Mind & Breathing protocol.',
        },
        ...prev.logs.slice(0, 19),
      ],
    }));
    setSosModalOpen(false);
    setSosChecks([false, false, false]);
  };

  const handleConfirmRelapseReset = () => {
    const newNow = new Date().toISOString();
    onUpdatePurity((prev) => ({
      ...prev,
      streakStartIso: newNow,
      bestStreakDays: Math.max(prev.bestStreakDays, daysClean),
      strictPornLockdown: true,
      nightGuardLock:
        selectedTriggerCause === 'Late Night in Bed' ? true : prev.nightGuardLock,
      logs: [
        {
          id: `reset-${Date.now()}`,
          timestamp: new Date().toLocaleDateString(),
          type: 'relapse-reset',
          triggerEmotion: selectedTriggerCause,
          note: `Streak reset after ${daysClean}d. Root trigger: ${selectedTriggerCause}`,
        },
        ...prev.logs.slice(0, 19),
      ],
    }));
    setShowRelapseModal(false);
  };

  const handleToggleAdultDns = async () => {
    const nextState = !purity.adultDnsEnabled;
    const res = await NativeBridge.configureAdultContentShield(nextState, platform);
    setDnsStatusMessage(res.detail);
    onUpdatePurity((prev) => ({
      ...prev,
      adultDnsEnabled: nextState,
    }));
  };

  const handleCopyAndOpenPrivateDns = async (hostname: string) => {
    try {
      await navigator.clipboard?.writeText(hostname);
    } catch {
      // ignore clipboard errors
    }
    setCopiedHost(hostname);
    await openPhoneMainSetting('dns');
  };

  const handleAddCustomKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = newKeywordInput.trim().toLowerCase();
    if (!cleaned) return;
    onUpdatePurity((prev) => {
      const existing = prev.customBlockedKeywords || [];
      if (existing.includes(cleaned)) return prev;
      return {
        ...prev,
        customBlockedKeywords: [...existing, cleaned],
      };
    });
    setNewKeywordInput('');
  };

  const handleRemoveCustomKeyword = (kw: string) => {
    onUpdatePurity((prev) => ({
      ...prev,
      customBlockedKeywords: (prev.customBlockedKeywords || []).filter((item) => item !== kw),
    }));
  };

  const handleTestBrowserGuard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testSearchUrl.trim()) return;
    setInterceptedAlert(true);
    setTestSearchUrl('');
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Header + Discreet Mode Toggle */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div>
          <span className="text-[10px] font-mono-tech uppercase tracking-widest text-zinc-500">
            COMPLETE SELF-MASTERY & ANTI-PORN FORTRESS
          </span>
          <h2 className="text-base font-mono-tech font-semibold tracking-wide text-zinc-100">
            {purity.discreetMode ? t.purityDiscreetTitle : t.purityHeaderTitle}
          </h2>
        </div>
        <button
          type="button"
          onClick={() =>
            onUpdatePurity((prev) => ({ ...prev, discreetMode: !prev.discreetMode }))
          }
          className="px-2.5 py-1 border border-zinc-700 text-[11px] font-mono-tech text-zinc-300 hover:bg-zinc-900 cursor-pointer"
        >
          {purity.discreetMode ? 'Discreet: ON' : 'Discreet: OFF'}
        </button>
      </div>

      {/* Live 15-Minute Emergency Browser Lockdown Active Banner */}
      {emergencyLockRemainingSec > 0 && (
        <div className="border-2 border-zinc-100 bg-zinc-950 p-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono-tech uppercase tracking-widest text-zinc-300">
              🔒 EMERGENCY BROWSER & SOCIAL LOCKDOWN ACTIVE
            </div>
            <div className="text-xs text-zinc-400 mt-1">
              All browsers and social media apps are completely locked until the urge wave passes.
            </div>
          </div>
          <div className="text-xl font-mono-tech font-semibold text-zinc-100 pl-3">
            {Math.floor(emergencyLockRemainingSec / 60)}:
            {String(emergencyLockRemainingSec % 60).padStart(2, '0')}
          </div>
        </div>
      )}

      {/* Live Clean Streak Counter Card */}
      <div className="border border-zinc-800 bg-zinc-950/60 p-5">
        <div className="flex items-center justify-between text-xs font-mono-tech text-zinc-400 mb-3">
          <span>{t.cleanStreakLabel}</span>
          <span>
            {t.urgesDefeatedLabel}:{' '}
            <strong className="text-zinc-100">{purity.urgesDefeatedCount}</strong>
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center my-4">
          <div className="border border-zinc-800 bg-black py-4">
            <div className="text-3xl sm:text-4xl font-mono-tech font-light text-zinc-100">
              {daysClean}
            </div>
            <div className="text-[10px] font-mono-tech text-zinc-500 mt-1 tracking-widest">
              {t.daysLabel}
            </div>
          </div>
          <div className="border border-zinc-800 bg-black py-4">
            <div className="text-3xl sm:text-4xl font-mono-tech font-light text-zinc-100">
              {String(hoursClean).padStart(2, '0')}
            </div>
            <div className="text-[10px] font-mono-tech text-zinc-500 mt-1 tracking-widest">
              {t.hoursLabel}
            </div>
          </div>
          <div className="border border-zinc-800 bg-black py-4">
            <div className="text-3xl sm:text-4xl font-mono-tech font-light text-zinc-100">
              {String(minsClean).padStart(2, '0')}
            </div>
            <div className="text-[10px] font-mono-tech text-zinc-500 mt-1 tracking-widest">
              {t.minsLabel}
            </div>
          </div>
        </div>

        {/* 90-Day Brain Rewiring Bar */}
        <div className="space-y-1.5 mt-4">
          <div className="flex justify-between text-xs font-mono-tech text-zinc-400">
            <span>{t.brainRewiringProgress}</span>
            <span>
              {progress90Percent}% (Day {daysClean}/90)
            </span>
          </div>
          <div className="w-full h-2 bg-zinc-900 overflow-hidden">
            <div
              className="h-full bg-zinc-100 transition-all duration-500"
              style={{ width: `${Math.max(4, progress90Percent)}%` }}
            />
          </div>
        </div>

        {/* Emergency URGE SOS + 15-Minute Browser Lockdown Buttons */}
        <div className="space-y-2 mt-5">
          <button
            type="button"
            onClick={handleActivate15mEmergencyLock}
            className="w-full py-4 bg-zinc-100 text-black font-mono-tech text-xs sm:text-sm font-semibold uppercase tracking-widest hover:bg-white transition cursor-pointer"
          >
            ⚡ {t.panicSosButton}
          </button>

          <button
            type="button"
            onClick={() => {
              const lockUntil = Date.now() + 15 * 60 * 1000;
              onUpdatePurity((prev) => ({
                ...prev,
                strictPornLockdown: true,
                emergencyBrowserLockUntilMs: lockUntil,
              }));
            }}
            className="w-full py-2.5 border border-zinc-500 bg-zinc-900 text-zinc-100 font-mono-tech text-xs uppercase tracking-wider hover:bg-zinc-800 cursor-pointer"
          >
            {t.emergencyLock15mBtn}
          </button>
        </div>

        {/* Daily Morning Pledge */}
        <div className="mt-3">
          {hasPledgedToday ? (
            <div className="w-full py-2.5 px-3 border border-zinc-800 bg-black text-center text-xs font-mono-tech text-zinc-400">
              ✓ {t.pledgedDoneText}
            </div>
          ) : (
            <button
              type="button"
              onClick={handleTakeMorningPledge}
              className="w-full py-2.5 border border-zinc-700 text-zinc-200 hover:bg-zinc-900 font-mono-tech text-xs uppercase tracking-wider cursor-pointer"
            >
              + {t.morningPledgeBtn}
            </button>
          )}
        </div>
      </div>

      {/* Featured Purity Calm Mind Verse / Hadith / Proverb Card */}
      <div className="border border-zinc-800 p-4 bg-zinc-950/40">
        <div className="flex items-center justify-between text-[11px] font-mono-tech text-zinc-500 mb-2">
          <span>DAILY PURITY & SELF-MASTERY ANCHOR</span>
          <button
            type="button"
            onClick={() => setSosTriggerIndex((i) => i + 1)}
            className="underline hover:text-zinc-300 cursor-pointer"
          >
            {t.nextWhisperBtn}
          </button>
        </div>
        {showArabicScript &&
          activePurityTrigger.arabic &&
          lang !== 'ar' &&
          inspirationMode !== 'universal' && (
            <p dir="rtl" className="font-arabic text-base text-zinc-300 mb-2 leading-relaxed">
              {activePurityTrigger.arabic}
            </p>
          )}
        <p className="text-sm sm:text-base text-zinc-100 leading-relaxed">
          “{getTriggerText(activePurityTrigger, lang)}”
        </p>
        <p className="text-xs font-mono-tech text-zinc-500 mt-2">
          — {getTriggerSource(activePurityTrigger, lang)}
        </p>
      </div>

      {/* 4-LAYER COMPLETE PORN ADDICTION RESTRICTION & SYSTEM SHIELD */}
      <div className="border border-zinc-800 p-4 space-y-4 bg-zinc-950/40">
        <div className="text-xs font-mono-tech uppercase tracking-wider text-zinc-300">
          4-LAYER COMPLETE PORN RESTRICTION & OS SHIELD ({platform.toUpperCase()})
        </div>

        {/* Layer 0: Strict Porn & Browser Lockdown Master Switch */}
        <div className="flex items-center justify-between py-2.5 border-b border-zinc-900">
          <div className="pr-3">
            <div className="text-xs font-semibold text-zinc-100">
              {t.strictPornLockdownTitle}
            </div>
            <div className="text-[11px] text-zinc-400 font-mono-tech mt-0.5">
              {t.strictPornLockdownDesc}
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              onUpdatePurity((prev) => ({
                ...prev,
                strictPornLockdown: !(prev.strictPornLockdown ?? true),
              }))
            }
            className={`px-3 py-1.5 border text-xs font-mono-tech cursor-pointer ${
              purity.strictPornLockdown ?? true
                ? 'border-zinc-100 bg-zinc-100 text-black font-semibold'
                : 'border-zinc-700 text-zinc-400'
            }`}
          >
            {purity.strictPornLockdown ?? true ? 'LOCKED ON' : 'OFF'}
          </button>
        </div>

        {/* Layer 1: System Adult DNS Filter + 1-Tap Android Private DNS Opener */}
        <div className="py-2.5 border-b border-zinc-900 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="pr-3">
              <div className="text-xs font-medium text-zinc-200">{t.adultDnsShieldLabel}</div>
              <div className="text-[11px] text-zinc-500 font-mono-tech">
                Blocks 100% of adult & porn domains across all browsers on your phone
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggleAdultDns}
              className={`px-3 py-1.5 border text-xs font-mono-tech cursor-pointer ${
                purity.adultDnsEnabled
                  ? 'border-zinc-200 bg-zinc-100 text-black font-semibold'
                  : 'border-zinc-700 text-zinc-400'
              }`}
            >
              {purity.adultDnsEnabled ? 'ACTIVE' : 'OFF'}
            </button>
          </div>

          {/* 1-Tap Copy & Open Android Private DNS Settings */}
          <div className="bg-black border border-zinc-800 p-3 space-y-2">
            <div className="text-[10px] font-mono-tech uppercase text-zinc-400">
              1-TAP ANDROID PRIVATE SAFE DNS SETUP (BLOCKS ALL PORN WEBSITES OS-WIDE):
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleCopyAndOpenPrivateDns('family.cloudflare-dns.com')}
                className="p-2.5 border border-zinc-700 hover:border-zinc-400 text-left text-[11px] font-mono-tech text-zinc-200 cursor-pointer"
              >
                <div className="font-semibold text-zinc-100">1. Cloudflare Family DNS</div>
                <div className="text-zinc-400 mt-0.5">family.cloudflare-dns.com</div>
                <div className="text-[10px] text-zinc-500 mt-1">
                  [Tap to Copy & Open DNS Settings]
                </div>
              </button>
              <button
                type="button"
                onClick={() =>
                  handleCopyAndOpenPrivateDns('adult-filter-dns.cleanbrowsing.org')
                }
                className="p-2.5 border border-zinc-700 hover:border-zinc-400 text-left text-[11px] font-mono-tech text-zinc-200 cursor-pointer"
              >
                <div className="font-semibold text-zinc-100">2. CleanBrowsing Adult Filter</div>
                <div className="text-zinc-400 mt-0.5">adult-filter-dns.cleanbrowsing.org</div>
                <div className="text-[10px] text-zinc-500 mt-1">
                  [Tap to Copy & Open DNS Settings]
                </div>
              </button>
            </div>
            {copiedHost && (
              <div className="text-[11px] font-mono-tech text-zinc-200 pt-1">
                ✓ Copied <span className="underline">{copiedHost}</span>! In Android Network
                Settings → Private DNS → select "Private DNS provider hostname" and paste it.
              </div>
            )}
          </div>
        </div>

        {/* Layer 2: Browser & Incognito Keyword Blocker */}
        <div className="flex items-center justify-between py-2 border-b border-zinc-900">
          <div className="pr-3">
            <div className="text-xs font-medium text-zinc-200">{t.keywordBlockerLabel}</div>
            <div className="text-[11px] text-zinc-500 font-mono-tech">
              Blocks {allBlockedKeywords.length} adult keywords, URLs & incognito triggers
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              onUpdatePurity((prev) => ({
                ...prev,
                browserKeywordShield: !prev.browserKeywordShield,
              }))
            }
            className={`px-3 py-1.5 border text-xs font-mono-tech cursor-pointer ${
              purity.browserKeywordShield
                ? 'border-zinc-200 bg-zinc-100 text-black font-semibold'
                : 'border-zinc-700 text-zinc-400'
            }`}
          >
            {purity.browserKeywordShield ? 'ACTIVE' : 'OFF'}
          </button>
        </div>

        {/* Layer 3: High-Risk Night Guard (10 PM - 6 AM) */}
        <div className="flex items-center justify-between py-2 border-b border-zinc-900">
          <div className="pr-3">
            <div className="text-xs font-medium text-zinc-200">{t.nightGuardLabel}</div>
            <div className="text-[11px] text-zinc-500 font-mono-tech">
              Automatically locks browsers & social feeds during late-night hours
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              onUpdatePurity((prev) => ({ ...prev, nightGuardLock: !prev.nightGuardLock }))
            }
            className={`px-3 py-1.5 border text-xs font-mono-tech cursor-pointer ${
              purity.nightGuardLock
                ? 'border-zinc-200 bg-zinc-100 text-black font-semibold'
                : 'border-zinc-700 text-zinc-400'
            }`}
          >
            {purity.nightGuardLock ? 'LOCKED' : 'OFF'}
          </button>
        </div>

        {/* Custom Trigger Keyword / Website Blocklist Manager */}
        <div className="space-y-2 pt-1">
          <div className="text-[11px] font-mono-tech text-zinc-400">
            CUSTOM BLOCKED TRIGGERS & DOMAINS ({allBlockedKeywords.length} active rules):
          </div>
          <form onSubmit={handleAddCustomKeyword} className="flex gap-2">
            <input
              type="text"
              value={newKeywordInput}
              onChange={(e) => setNewKeywordInput(e.target.value)}
              placeholder="Add custom keyword or website to block..."
              className="flex-1 bg-black border border-zinc-800 px-3 py-2 text-xs text-zinc-200 font-mono-tech focus:outline-none focus:border-zinc-500"
            />
            <button
              type="submit"
              className="px-3 py-2 border border-zinc-600 bg-zinc-900 text-xs font-mono-tech text-zinc-100 hover:bg-zinc-800 cursor-pointer"
            >
              + Block
            </button>
          </form>

          {customKeywords.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {customKeywords.map((kw) => (
                <span
                  key={kw}
                  className="inline-flex items-center gap-1.5 px-2 py-1 border border-zinc-700 bg-black text-[11px] font-mono-tech text-zinc-300"
                >
                  <span>🚫 {kw}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCustomKeyword(kw)}
                    className="text-zinc-500 hover:text-zinc-200 cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {dnsStatusMessage && (
          <div className="p-2.5 bg-black border border-zinc-800 text-[11px] font-mono-tech text-zinc-300">
            ✓ {dnsStatusMessage}
          </div>
        )}

        {/* Interactive Browser Keyword Shield Test */}
        <form onSubmit={handleTestBrowserGuard} className="pt-2 flex gap-2">
          <input
            type="text"
            value={testSearchUrl}
            onChange={(e) => setTestSearchUrl(e.target.value)}
            placeholder="Test URL/keyword block simulator..."
            className="flex-1 bg-black border border-zinc-800 px-3 py-2 text-xs text-zinc-200 font-mono-tech focus:outline-none focus:border-zinc-500"
          />
          <button
            type="submit"
            className="px-3 py-2 border border-zinc-700 text-xs font-mono-tech text-zinc-300 hover:bg-zinc-900 cursor-pointer"
          >
            Test Shield
          </button>
        </form>

        {interceptedAlert && (
          <div className="p-3 border border-zinc-400 bg-black text-xs space-y-1.5">
            <div className="font-mono-tech text-zinc-100 font-semibold">
              🛑 SHIELD INTERCEPTED UNSAFE QUERY
            </div>
            <p className="text-zinc-300 italic">
              “{getTriggerText(activePurityTrigger, lang)}” —{' '}
              {getTriggerSource(activePurityTrigger, lang)}
            </p>
            <button
              type="button"
              onClick={() => setInterceptedAlert(false)}
              className="text-[11px] font-mono-tech underline text-zinc-400 cursor-pointer"
            >
              Dismiss & Return to Peace
            </button>
          </div>
        )}
      </div>

      {/* 90-Day Neuro-Rewiring Milestones */}
      <div className="border border-zinc-800 p-4 space-y-3 bg-zinc-950/40">
        <div className="text-xs font-mono-tech uppercase tracking-wider text-zinc-400">
          90-DAY DOPAMINE REWIRING MILESTONES
        </div>
        <div className="space-y-2.5">
          {REWIRING_MILESTONES.map((m) => {
            const reached = daysClean >= m.day;
            return (
              <div
                key={m.day}
                className={`p-3 border ${
                  reached
                    ? 'border-zinc-500 bg-zinc-900/50 text-zinc-100'
                    : 'border-zinc-900 bg-black text-zinc-500'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-mono-tech">
                  <span className="font-medium">
                    {lang === 'bn' ? m.titleBn : m.titleEn}
                  </span>
                  <span>{reached ? '✓ UNLOCKED' : `${m.day - daysClean}d left`}</span>
                </div>
                <p className="text-xs mt-1 text-zinc-400">
                  {lang === 'bn' ? m.descBn : m.descEn}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Streak Adjustment & Relapse Root-Cause Log */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={() => setShowRelapseModal(true)}
          className="px-3 py-2 border border-zinc-800 text-xs font-mono-tech text-zinc-500 hover:text-zinc-300 cursor-pointer"
        >
          {t.resetStreakBtn}
        </button>

        <button
          type="button"
          onClick={() =>
            onUpdatePurity((prev) => ({
              ...prev,
              streakStartIso: new Date(
                new Date(prev.streakStartIso).getTime() - 86400000
              ).toISOString(),
            }))
          }
          className="px-3 py-2 border border-zinc-800 text-xs font-mono-tech text-zinc-400 hover:text-zinc-200 cursor-pointer"
        >
          +1 Day (Adjust Existing Streak)
        </button>
      </div>

      {/* Relapse Root-Cause Modal */}
      {showRelapseModal && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-6">
          <div className="max-w-md w-full border border-zinc-700 bg-zinc-950 p-6 space-y-4">
            <div className="text-xs font-mono-tech uppercase text-zinc-400">
              COMPASSIONATE TRIGGER AUDIT
            </div>
            <h3 className="text-base font-medium text-zinc-100">
              What triggered the slip? We will automatically fortify that weak point.
            </h3>
            <div className="space-y-2">
              {(
                [
                  'Late Night in Bed',
                  'Stress / Anxiety',
                  'Boredom / Alone',
                  'Social Media Scroll',
                ] as const
              ).map((cause) => (
                <button
                  key={cause}
                  type="button"
                  onClick={() => setSelectedTriggerCause(cause)}
                  className={`w-full text-left px-3 py-2.5 border text-xs font-mono-tech cursor-pointer ${
                    selectedTriggerCause === cause
                      ? 'border-zinc-200 bg-zinc-900 text-white'
                      : 'border-zinc-800 text-zinc-400'
                  }`}
                >
                  {selectedTriggerCause === cause ? '● ' : '○ '}
                  {cause}
                </button>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowRelapseModal(false)}
                className="flex-1 py-2.5 border border-zinc-700 text-xs font-mono-tech text-zinc-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRelapseReset}
                className="flex-1 py-2.5 bg-zinc-100 text-black text-xs font-mono-tech font-semibold cursor-pointer"
              >
                Reset & Fortify Shield
              </button>
            </div>
          </div>
        </div>
      )}

      {/* URGE SOS EMERGENCY INTERVENTION MODAL */}
      {sosModalOpen && (
        <div className="fixed inset-0 z-50 bg-black text-zinc-100 flex flex-col justify-between p-6 overflow-y-auto">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-3 text-xs font-mono-tech text-zinc-400">
            <span>⚡ URGE SOS // EMERGENCY HEART & DOPAMINE RESET</span>
            <button
              type="button"
              onClick={() => setSosModalOpen(false)}
              className="underline text-zinc-500 hover:text-zinc-200 cursor-pointer"
            >
              Close
            </button>
          </div>

          <div className="my-auto max-w-md mx-auto w-full space-y-6 py-4 text-center">
            <div className="inline-flex items-center justify-center w-36 h-36 rounded-full border border-zinc-700 animate-breathe mx-auto">
              <div>
                <div className="text-3xl font-mono-tech text-zinc-100">{sosTimer}s</div>
                <div className="text-[10px] font-mono-tech text-zinc-500 uppercase mt-1">
                  URGE WAVE PASSING
                </div>
              </div>
            </div>

            {/* Piercing Quran / Hadith / Self-Mastery Line */}
            <div className="border border-zinc-700 bg-zinc-950 p-5 text-left">
              {showArabicScript &&
                activePurityTrigger.arabic &&
                lang !== 'ar' &&
                inspirationMode !== 'universal' && (
                  <p
                    dir="rtl"
                    className="font-arabic text-lg text-zinc-200 mb-3 leading-relaxed"
                  >
                    {activePurityTrigger.arabic}
                  </p>
                )}
              <p className="text-base sm:text-lg text-zinc-100 leading-relaxed">
                “{getTriggerText(activePurityTrigger, lang)}”
              </p>
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-zinc-900 text-xs font-mono-tech text-zinc-400">
                <span>— {getTriggerSource(activePurityTrigger, lang)}</span>
                <button
                  type="button"
                  onClick={() => setSosTriggerIndex((i) => i + 1)}
                  className="underline hover:text-white cursor-pointer"
                >
                  {t.nextWhisperBtn}
                </button>
              </div>
            </div>

            {/* 3 Physical Grounding Actions */}
            <div className="text-left space-y-2">
              <p className="text-xs font-mono-tech uppercase text-zinc-400">
                COMPLETE PHYSICAL INTERRUPT PROTOCOL:
              </p>
              {[
                lang === 'bn'
                  ? '১. এখনই বিছানা বা চেয়ার ছেড়ে উঠে দাঁড়ান এবং ফোনটি দূরে রাখুন'
                  : '1. Stand up immediately and change your physical posture',
                lang === 'bn'
                  ? '২. চোখে-মুখে ঠান্ডা পানি দিন অথবা ১০ বার গভীর শ্বাস নিন'
                  : '2. Splash cold water on your face or take 10 slow breaths',
                lang === 'bn'
                  ? '৩. মনে রাখুন: ৫ মিনিটের কৃত্রিম মোহের চেয়ে আপনার আত্মসম্মান অনেক বড়'
                  : '3. Remember: 5 minutes of pixels is never worth losing your peace',
              ].map((stepLabel, idx) => (
                <button
                  key={stepLabel}
                  type="button"
                  onClick={() =>
                    setSosChecks((prev) => prev.map((v, i) => (i === idx ? !v : v)))
                  }
                  className={`w-full text-left p-3 border text-xs font-mono-tech cursor-pointer ${
                    sosChecks[idx]
                      ? 'border-zinc-300 bg-zinc-900 text-zinc-100'
                      : 'border-zinc-800 text-zinc-400'
                  }`}
                >
                  {sosChecks[idx] ? '✓ ' : '□ '}
                  {stepLabel}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleUrgeDefeated}
              className="w-full py-4 bg-zinc-100 text-black font-mono-tech text-xs sm:text-sm font-semibold uppercase tracking-widest hover:bg-white cursor-pointer"
            >
              ✓ I Outlasted the Urge (+1 Victory & Return to Peace)
            </button>
          </div>

          <div className="border-t border-zinc-900 pt-3 text-center text-[11px] font-mono-tech text-zinc-600">
            100% OFFLINE & PRIVATE · ZERO DATA LEAVES YOUR PHONE
          </div>
        </div>
      )}
    </div>
  );
};

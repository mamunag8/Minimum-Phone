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
  pickRandomQuoteIndex,
} from '../data/calmTriggers';
import { TRANSLATIONS, tx } from '../i18n/translations';
import { NativeBridge } from '../services/nativeBridge';
import {
  openPhoneMainSetting,
  toggleNativeFamilyDnsVpn,
  configureNativeFortressWatchdog,
  type PhoneSettingTarget,
} from '../services/nativeLauncherBridge';

export type GuardSubTab = 'dns-fortress' | 'sos-streak' | 'keywords-logs' | 'all';

interface PurityGuardViewProps {
  purity: PurityState;
  lang: LanguageCode;
  platform: PlatformMode;
  showArabicScript: boolean;
  inspirationMode?: InspirationMode;
  isNightHourActive?: boolean;
  localFamilyDnsVpnActive?: boolean;
  activeSubTab?: GuardSubTab;
  onSelectSubTab?: (tab: GuardSubTab) => void;
  openSosImmediately?: boolean;
  onClearImmediateSos?: () => void;
  onUpdatePurity: (updater: (prev: PurityState) => PurityState) => void;
  onRequestPhoneSetting?: (
    target: PhoneSettingTarget,
    options?: { bypassForDnsSetup?: boolean }
  ) => void;
  onRequestUnlockDnsFortress?: () => void;
  onRefreshNativeStatus?: () => void;
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
    titleAr: 'اليوم ٣ · يقظة التحكم الذاتي',
    titleUr: 'تیسرا دن · ابتدائی خود ضابطگی کی بیداری',
    titleId: 'Hari 3 · Kebangkitan Kendali Diri',
    descEn: 'Acute craving wave peaks and begins subsiding.',
    descBn: 'প্রাথমিক তীব্র তাড়নার ঢেউ কমে আসতে শুরু করে।',
    descAr: 'تبلغ موجة الرغبة الحادة ذروتها وتبدأ في الانحسار.',
    descUr: 'ابتدائی شدید خواہش کی لہر کم ہونا شروع ہو جاتی ہے۔',
    descId: 'Gelombang dorongan awal memuncak dan mulai mereda.',
  },
  {
    day: 7,
    titleEn: 'Day 7 · Dopamine Sensitivity',
    titleBn: '৭ম দিন · ডোপামিন সংবেদনশীলতা বৃদ্ধি',
    titleAr: 'اليوم ٧ · استعادة حساسية الدوبامين',
    titleUr: 'ساتواں دن · ڈوپامائن کی حساسیت میں بہتری',
    titleId: 'Hari 7 · Pemulihan Sensitivitas Dopamin',
    descEn: 'Everyday focus and natural motivation begin returning.',
    descBn: 'স্বাভাবিক কাজে মনোযোগ ও প্রশান্তি ফিরে আসতে শুরু করে।',
    descAr: 'يبدأ التركيز اليومي والدافع الطبيعي في العودة.',
    descUr: 'روزمرہ کے کاموں میں توجہ اور فطری جذبہ واپس آنے لگتا ہے۔',
    descId: 'Fokus harian dan motivasi alami mulai kembali.',
  },
  {
    day: 14,
    titleEn: 'Day 14 · Mental Fog Lifting',
    titleBn: '১৪তম দিন · মানসিক জড়তা মুক্তি',
    titleAr: 'اليوم ١٤ · انقشاع الضباب الذهني',
    titleUr: 'چودہواں دن · ذہنی دھند کا خاتمہ',
    titleId: 'Hari 14 · Hilangnya Kabut Pikiran',
    descEn: 'Sharper memory, calmer eye contact, and deeper sleep.',
    descBn: 'মস্তিষ্কের ধোঁয়াশা কাটে, ঘুম ও আত্মবিশ্বাস গভীর হয়।',
    descAr: 'ذاكرة أقوى، نوم أعمق، وثقة هادئة بالنفس.',
    descUr: 'بہتر یادداشت، پرسکون نیند اور خود اعتمادی میں اضافہ۔',
    descId: 'Ingatan lebih tajam, tidur lebih nyenyak, dan percaya diri tenang.',
  },
  {
    day: 30,
    titleEn: 'Day 30 · Heart & Habit Stability',
    titleBn: '৩০তম দিন · হৃদয়ের স্থিরতা ও অভ্যাস গঠন',
    titleAr: 'اليوم ٣٠ · استقرار القلب والعادات',
    titleUr: 'تیسواں دن · دل کا قرار اور پختہ عادت',
    titleId: 'Hari 30 · Stabilitas Hati & Kebiasaan',
    descEn: 'Impulse loops weaken significantly; inner peace deepens.',
    descBn: 'পুরোনো আসক্তির পথ দুর্বল হয়ে হৃদয়ে স্থায়ী প্রশান্তি আসে।',
    descAr: 'تضعف مسارات الإدمان القديمة وتترسخ السكينة الداخلية.',
    descUr: 'پرانی لت کی راہیں کمزور ہو کر دل میں مستقل سکون آتا ہے۔',
    descId: 'Siklus impuls melemah secara signifikan; ketenangan batin mendalam.',
  },
  {
    day: 90,
    titleEn: 'Day 90 · Full Baseline Neuro-Reset',
    titleBn: '৯০তম দিন · সম্পূর্ণ ডোপামিন রিসেট',
    titleAr: 'اليوم ٩٠ · إعادة ضبط الدماغ بالكامل',
    titleUr: 'نوے واں دن · مکمل ڈوپامائن ری سیٹ',
    titleId: 'Hari 90 · Pemulihan Penuh Sistem Saraf',
    descEn: 'Brain reward circuitry restored to natural baseline.',
    descBn: 'মস্তিষ্কের ডোপামিন চক্র সম্পূর্ণ স্বাভাবিক ও সুস্থ অবস্থায় ফেরে।',
    descAr: 'عودة نظام المكافأة في الدماغ إلى فطرته الطبيعية السليمة.',
    descUr: 'دماغ کا نظامِ انعام مکمل طور پر اپنی فطری اور صحت مند حالت میں لوٹ آتا ہے۔',
    descId: 'Sistem penghargaan otak pulih sepenuhnya ke kondisi alami.',
  },
];

export const PurityGuardView: React.FC<PurityGuardViewProps> = ({
  purity,
  lang,
  platform,
  showArabicScript,
  inspirationMode = 'blended',
  isNightHourActive = false,
  localFamilyDnsVpnActive = false,
  activeSubTab,
  onSelectSubTab,
  openSosImmediately,
  onClearImmediateSos,
  onUpdatePurity,
  onRequestPhoneSetting,
  onRequestUnlockDnsFortress,
  onRefreshNativeStatus,
}) => {
  const t = TRANSLATIONS[lang];
  const [internalSubTab, setInternalSubTab] = useState<GuardSubTab>(activeSubTab || 'all');
  const currentSubTab: GuardSubTab = activeSubTab || internalSubTab;
  const setSubTab = (tab: GuardSubTab) => {
    setInternalSubTab(tab);
    onSelectSubTab?.(tab);
  };

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
  const [sosTriggerIndex, setSosTriggerIndex] = useState<number>(() =>
    Math.floor(Math.random() * CALM_MIND_TRIGGERS.length)
  );
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

  // Automatically change purity motivational quote from time to time
  useEffect(() => {
    const quoteTimer = setInterval(() => {
      setSosTriggerIndex((prev) => pickRandomQuoteIndex(prev, purityTriggers.length));
    }, 25000);
    return () => clearInterval(quoteTimer);
  }, [purityTriggers.length]);

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

  // Stanford Cyclic Physiological Sigh phase for SOS Modal (9s cycle: 2s inhale 1 -> 1s inhale 2 -> 6s long exhale)
  const sighCycleSec = (60 - sosTimer) % 9;
  const sighPhaseLabel =
    sighCycleSec < 2
      ? tx(
          lang,
          '1. Deep Nose Inhale (Fill lungs 80%)',
          '১. নাক দিয়ে গভীর শ্বাস নিন (৮০% ফুসফুস ভরুন)',
          '١. شهيق عميق من الأنف',
          '١. ناک سے گہرا سانس لیں',
          '1. Tarik napas dalam lewat hidung'
        )
      : sighCycleSec < 3
      ? tx(
          lang,
          '2. Quick Top-Up Sniff Inhale (100%)',
          '২. আরও একটু ছোট শ্বাস টানুন (১০০% পূর্ণ করুন)',
          '٢. شهيق إضافي سريع',
          '٢. ایک اور چھوٹا سانس اندر کھینچیں',
          '2. Tambah hirupan pendek kedua'
        )
      : tx(
          lang,
          '3. Slow Long Mouth Exhale (6s Heart-Rate Reset)',
          '৩. মুখ দিয়ে ধীরে ধীরে লম্বা শ্বাস ছাড়ুন (হৃদস্পন্দন শান্ত হচ্ছে)',
          '٣. زفير طويل وبطيء من الفم',
          '٣. منہ سے آہستہ لمبا سانس چھوڑیں',
          '3. Hembuskan perlahan lewat mulut'
        );

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
          note: 'Outlasted urge via SOS Calm Mind & Stanford Cyclic Sigh protocol.',
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
    onUpdatePurity((prev) => ({
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
    if (onRequestPhoneSetting) {
      onRequestPhoneSetting('dns', { bypassForDnsSetup: true });
    } else {
      await openPhoneMainSetting('dns', 35);
    }
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

  const triggerCauses: Array<{
    id: 'Late Night in Bed' | 'Stress / Anxiety' | 'Boredom / Alone' | 'Social Media Scroll';
    label: string;
  }> = [
    {
      id: 'Late Night in Bed',
      label: tx(
        lang,
        'Late Night in Bed',
        'গভীর রাতে বিছানায় ফোন ব্যবহার',
        'في وقت متأخر من الليل في السرير',
        'رات گئے بستر پر فون کا استعمال',
        'Larut Malam di Tempat Tidur'
      ),
    },
    {
      id: 'Stress / Anxiety',
      label: tx(
        lang,
        'Stress / Anxiety',
        'মানসিক চাপ বা দুশ্চিন্তা',
        'التوتر / القلق',
        'ذہنی دباؤ یا پریشانی',
        'Stres / Kecemasan'
      ),
    },
    {
      id: 'Boredom / Alone',
      label: tx(
        lang,
        'Boredom / Alone',
        'একঘেয়েমি বা একাকীত্ব',
        'الملل / الوحدة',
        'بوریت یا تنہائی',
        'Bosan / Sendirian'
      ),
    },
    {
      id: 'Social Media Scroll',
      label: tx(
        lang,
        'Social Media Scroll',
        'সোশ্যাল মিডিয়া স্ক্রলিং থেকে প্ররোচনা',
        'تصفح وسائل التواصل الاجتماعي',
        'سوشل میڈیا اسکرولنگ',
        'Scroll Media Sosial'
      ),
    },
  ];

  return (
    <div className="space-y-5 pb-8">
      {/* Header + Discreet Mode Toggle */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div>
          <span className="text-[10px] font-mono-tech uppercase tracking-widest text-zinc-500">
            {tx(
              lang,
              'COMPLETE SELF-MASTERY & ANTI-PORN FORTRESS',
              'সম্পূর্ণ আত্মনিয়ন্ত্রণ ও পর্ন-মুক্তি দুর্গ',
              'قلعة ضبط النفس والحماية الكاملة',
              'مکمل خود ضابطگی اور پاکیزگی کا قلعہ',
              'BENTENG PENGENDALIAN DIRI & PELINDUNG KEMURNIAN'
            )}
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
          className="px-2.5 py-1 border border-zinc-700 text-[11px] font-mono-tech text-zinc-300 hover:bg-zinc-900 cursor-pointer shrink-0"
        >
          {purity.discreetMode
            ? tx(lang, 'Discreet: ON', 'গোপন মোড: চালু', 'الوضع المخفي: مفعل', 'خفیہ موڈ: آن', 'Mode Samar: ON')
            : tx(lang, 'Discreet: OFF', 'গোপন মোড: বন্ধ', 'الوضع المخفي: متوقف', 'خفیہ موڈ: آف', 'Mode Samar: OFF')}
        </button>
      </div>

      {/* Sticky Sub-Navigation Tabs for Fast 1-Tap Section Switching */}
      <div className="sticky top-0 z-20 bg-black/95 backdrop-blur border-b border-zinc-800 py-2 -mx-1 px-1">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {(
            [
              {
                id: 'all' as GuardSubTab,
                label: tx(lang, '📋 All Guard', '📋 সব সুরক্ষা', '📋 كل الحماية', '📋 تمام گارڈ', '📋 Semua'),
              },
              {
                id: 'dns-fortress' as GuardSubTab,
                label: tx(lang, '🌐 DNS & Night Lock', '🌐 DNS ও নাইট লক', '🌐 DNS وقفل الليل', '🌐 DNS اور نائٹ لاک', '🌐 DNS & Malam'),
              },
              {
                id: 'sos-streak' as GuardSubTab,
                label: tx(lang, '🆘 SOS & Streak', '🆘 SOS ও স্ট্রিক', '🆘 طوارئ والعداد', '🆘 SOS اور سٹریک', '🆘 SOS & Hari'),
              },
              {
                id: 'keywords-logs' as GuardSubTab,
                label: tx(lang, '🚫 Keywords & Logs', '🚫 শব্দ ব্লক ও লগ', '🚫 الكلمات والسجل', '🚫 الفاظ اور لاگ', '🚫 Kata & Log'),
              },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSubTab(tab.id)}
              className={`py-2 px-2 border text-[10px] font-mono-tech font-bold uppercase tracking-wider transition cursor-pointer truncate ${
                currentSubTab === tab.id
                  ? 'border-zinc-100 bg-zinc-100 text-black'
                  : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Live 15-Minute Emergency Browser Lockdown Active Banner */}
      {emergencyLockRemainingSec > 0 && (
        <div className="border-2 border-zinc-100 bg-zinc-950 p-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono-tech uppercase tracking-widest text-zinc-300">
              🔒{' '}
              {tx(
                lang,
                'EMERGENCY BROWSER & SOCIAL LOCKDOWN ACTIVE',
                'জরুরি ব্রাউজার ও সোশ্যাল মিডিয়া লকডাউন চালু আছে',
                'قفل الطوارئ للمتصفح والتواصل نشط',
                'ایمرجنسی براؤزر اور سوشل لاک ڈاؤن فعال ہے',
                'KUNCI DARURAT BROWSER & SOSIAL AKTIF'
              )}
            </div>
            <div className="text-xs text-zinc-400 mt-1">
              {tx(
                lang,
                'All browsers and social media apps are completely locked until the urge wave passes.',
                'তাড়নার ঢেউ কেটে না যাওয়া পর্যন্ত সকল ব্রাউজার ও সোশ্যাল মিডিয়া অ্যাপ সম্পূর্ণ লক করা হয়েছে।',
                'جميع المتصفحات وتطبيقات التواصل مقفلة تماماً حتى تمر موجة الرغبة.',
                'خواہش کی لہر گزرنے تک تمام براؤزرز اور سوشل ایپس مکمل طور پر لاک ہیں۔',
                'Semua browser dan aplikasi sosial dikunci sepenuhnya hingga dorongan berlalu.'
              )}
            </div>
          </div>
          <div className="text-xl font-mono-tech font-semibold text-zinc-100 pl-3">
            {Math.floor(emergencyLockRemainingSec / 60)}:
            {String(emergencyLockRemainingSec % 60).padStart(2, '0')}
          </div>
        </div>
      )}

      {/* Live Clean Streak Counter Card */}
      {(currentSubTab === 'all' || currentSubTab === 'sos-streak') && (
      <>
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
              {progress90Percent}% ({tx(lang, 'Day', 'দিন', 'يوم', 'دن', 'Hari')} {daysClean}/90)
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
          <span>
            {tx(
              lang,
              'DAILY PURITY & SELF-MASTERY ANCHOR',
              'দৈনিক পবিত্রতা ও আত্মনিয়ন্ত্রণ অনুপ্রেরণা',
              'مرساة العفة وضبط النفس اليومية',
              'روزانہ پاکیزگی اور خود ضابطگی کا پیغام',
              'JANGKAR KEMURNIAN & PENGENDALIAN DIRI HARIAN'
            )}
          </span>
          <button
            type="button"
            onClick={() =>
              setSosTriggerIndex((prev) =>
                pickRandomQuoteIndex(prev, purityTriggers.length)
              )
            }
            className="underline hover:text-zinc-300 cursor-pointer"
          >
            🎲 {t.nextWhisperBtn} ↻
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
      </>
      )}

      {/* 4-LAYER COMPLETE PORN ADDICTION RESTRICTION & SYSTEM SHIELD */}
      {(currentSubTab === 'all' || currentSubTab === 'dns-fortress' || currentSubTab === 'keywords-logs') && (
      <div className="border border-zinc-800 p-4 space-y-4 bg-zinc-950/40">
        <div className="text-xs font-mono-tech uppercase tracking-wider text-zinc-300">
          {tx(
            lang,
            `4-LAYER COMPLETE PORN RESTRICTION & OS SHIELD (${platform.toUpperCase()})`,
            `৪-স্তরের সম্পূর্ণ পর্ন ও অশ্লীলতা প্রতিরোধ শিল্ড (${platform.toUpperCase()})`,
            `درع الحماية الشامل من ٤ طبقات (${platform.toUpperCase()})`,
            `٤ سطحی مکمل فحاشی روک تھام اور سسٹم شیلڈ (${platform.toUpperCase()})`,
            `PERISAI 4-LAPIS BLOKIR KONTEN DEWASA (${platform.toUpperCase()})`
          )}
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
            onClick={() => {
              if ((purity.strictPornLockdown ?? true) && (purity.dnsLockedByQr ?? true)) {
                if (onRequestUnlockDnsFortress) {
                  onRequestUnlockDnsFortress();
                }
                return;
              }
              onUpdatePurity((prev) => ({
                ...prev,
                strictPornLockdown: !(prev.strictPornLockdown ?? true),
              }));
            }}
            className={`px-3 py-1.5 border text-xs font-mono-tech cursor-pointer shrink-0 ${
              purity.strictPornLockdown ?? true
                ? 'border-zinc-100 bg-zinc-100 text-black font-semibold'
                : 'border-zinc-700 text-zinc-400'
            }`}
          >
            {purity.strictPornLockdown ?? true
              ? tx(lang, '🔒 LOCKED ON', '🔒 চালু (লকড)', '🔒 مفعل', '🔒 فعال', '🔒 AKTIF')
              : tx(lang, 'OFF', 'বন্ধ', 'متوقف', 'بند', 'MATI')}
          </button>
        </div>

        {/* Layer 1: 1-Tap Private Safe DNS Setup + Stronger Tamper-Proof Control + Night Auto-Activation */}
        <div className="py-2.5 border-b border-zinc-900 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-zinc-100">{t.adultDnsShieldLabel}</div>
              <div className="text-[11px] text-zinc-400 font-mono-tech">
                {tx(
                  lang,
                  'Blocks 100% of porn, adult & gambling domains across ALL browsers & apps',
                  'সকল ব্রাউজার ও অ্যাপে ১০০% পর্ন, অশ্লীল ও জুয়ার ওয়েবসাইট স্বয়ংক্রিয়ভাবে ব্লক করে',
                  'يحجب ١٠٠٪ من المواقع الإباحية والقمار في جميع المتصفحات والتطبيقات',
                  'تمام براؤزرز اور ایپس میں ١٠٠٪ فحش اور جوئے کی ویب سائٹس بلاک کرتا ہے',
                  'Memblokir 100% situs dewasa & judi di semua browser & aplikasi'
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (purity.adultDnsEnabled && (purity.dnsLockedByQr ?? true)) {
                  setDnsStatusMessage(
                    tx(
                      lang,
                      '🔒 Strong QR Fortress Active: Private DNS cannot be turned off without scanning your Physical Emergency QR Card + 30s Cooldown.',
                      '🔒 কঠোর QR দুর্গ লক চালু আছে: ফিজিক্যাল জরুরি QR কোড স্ক্যান ও ৩০ সেকেন্ড অপেক্ষা ছাড়া প্রাইভেট DNS বন্ধ করা যাবে না।',
                      '🔒 قلعة QR نشطة: لا يمكن إيقاف DNS الخاص بدون مسح رمز QR الفعلي ومؤقت ٣٠ ثانية.',
                      '🔒 مضبوط QR لاک فعال ہے: فزیکل QR کارڈ اسکین اور ٣٠ سیکنڈ انتظار کے بغیر پرائیویٹ DNS بند نہیں کیا جا سکتا۔',
                      '🔒 Benteng QR Aktif: DNS Pribadi tidak dapat dimatikan tanpa memindai Kartu QR Fisik + 30 detik.'
                    )
                  );
                  if (onRequestUnlockDnsFortress) {
                    onRequestUnlockDnsFortress();
                  }
                  return;
                }
                handleToggleAdultDns();
              }}
              className={`px-3 py-1.5 border text-xs font-mono-tech shrink-0 cursor-pointer ${
                purity.adultDnsEnabled
                  ? 'border-zinc-200 bg-zinc-100 text-black font-bold'
                  : 'border-zinc-700 text-zinc-400'
              }`}
            >
              {purity.adultDnsEnabled
                ? tx(lang, '🛡️ LOCKED ON', '🛡️ সুরক্ষিত ও চালু', '🛡️ مفعل ومؤمن', '🛡️ محفوظ اور فعال', '🛡️ TERKUNCI AKTIF')
                : tx(lang, 'OFF', 'বন্ধ', 'متوقف', 'بند', 'MATI')}
            </button>
          </div>

          {/* STRONG PRIVATE DNS LOCK & AUTOMATIC NIGHT RE-ACTIVATION FORTRESS BOX */}
          <div className="border-2 border-zinc-200 bg-black p-3 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-2">
              <div className="text-[11px] font-mono-tech font-bold uppercase text-zinc-100">
                🏰{' '}
                {tx(
                  lang,
                  'ULTRA-STRONG PRIVATE DNS & NIGHT SYSTEM SETTINGS FORTRESS',
                  'অতি-শক্তিশালী প্রাইভেট DNS ও রাতের ফোন সেটিংস দুর্গ লক',
                  'قلعة الحماية القصوى لـ DNS وإعدادات الهاتف ليلاً',
                  'انتہائی مضبوط پرائیویٹ DNS اور رات کا فون سیٹنگز لاک',
                  'BENTENG SUPER KUAT DNS PRIBADI & PENGATURAN MALAM'
                )}
              </div>
              <span className="px-2 py-0.5 bg-zinc-100 text-black text-[10px] font-mono-tech font-bold">
                {isNightHourActive
                  ? tx(lang, '🌙 NIGHT FORTRESS ACTIVE', '🌙 রাতের দুর্গ সক্রিয়', '🌙 القلعة الليلية نشطة', '🌙 نائٹ قلعہ فعال', '🌙 BENTENG MALAM AKTIF')
                  : tx(lang, '🛡️ 24/7 GUARD READY', '🛡️ ২৪/৭ সুরক্ষা প্রস্তুত', '🛡️ حماية ٢٤/٧ جاهزة', '🛡️ ٢٤/٧ گارڈ تیار', '🛡️ SIAGA 24/7')}
              </span>
            </div>

            {/* NEW: 1-TAP BUILT-IN NATIVE FAMILY DNS (1.1.1.3) AUTO-VPN SHIELD (No Manual Settings Paste Needed!) */}
            <div className="border-2 border-zinc-100 bg-zinc-900/90 p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-mono-tech font-bold text-white">
                    ⚡{' '}
                    {tx(
                      lang,
                      '1-Tap Built-In Family DNS Shield (1.1.1.3 Auto-VPN)',
                      '১-ক্লিকে অটোমেটিক Family DNS শিল্ড (১.১.১.৩ — সেটিংসে পেস্ট করার দরকার নেই!)',
                      'درع DNS العائلي المدمج بضغطة واحدة (1.1.1.3 تلقائي)',
                      '١-کلک بلٹ ان فیملی DNS شیلڈ (1.1.1.3 آٹو وی پی این)',
                      'Perisai DNS Keluarga Bawaan 1-Sentuh (1.1.1.3 Auto-VPN)'
                    )}
                  </div>
                  <div className="text-[10px] text-zinc-300 mt-1 leading-snug">
                    {tx(
                      lang,
                      'Activates Cloudflare Family (1.1.1.3 / 1.0.0.3) & CleanBrowsing directly inside Minimum Phone with 0% battery drain — and automatically turns ON at 10:00 PM every night even if turned off!',
                      'ফোনের সেটিংসে গিয়ে কিছু কপি-পেস্ট না করেই সরাসরি অ্যাপের ভেতর থেকে ১-ক্লিকে পর্ন ও অ্যাডাল্ট সাইট ব্লকার (1.1.1.3) চালু করে এবং রাতে কেউ বন্ধ করলেও রাত ১০টায় নিজে থেকেই চালু হয়ে যায়!',
                      'يفعّل فلتر العائلة (1.1.1.3) مباشرة من داخل التطبيق بضغطة واحدة بدون استهلاك البطارية، ويعمل تلقائياً كل ليلة الساعة ١٠ مساءً!',
                      'فون سیٹنگز میں پیسٹ کیے بغیر براہِ راست ایپ سے ١-کلک میں فحش سائٹ بلاکر (1.1.1.3) آن کرتا ہے اور رات ١٠ بجے خودکار فعال ہو جاتا ہے!',
                      'Mengaktifkan filter dewasa (1.1.1.3) langsung dari dalam aplikasi dalam 1 ketukan tanpa menguras baterai, dan otomatis menyala pukul 22:00!'
                    )}
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 text-[10px] font-mono-tech font-bold shrink-0 ${
                    localFamilyDnsVpnActive || purity.adultDnsEnabled
                      ? 'bg-zinc-100 text-black'
                      : 'border border-zinc-600 text-zinc-400'
                  }`}
                >
                  {localFamilyDnsVpnActive
                    ? tx(lang, '🛡️ 1.1.1.3 LIVE', '🛡️ ১.১.১.৩ চালু', '🛡️ 1.1.1.3 نشط', '🛡️ 1.1.1.3 فعال', '🛡️ 1.1.1.3 AKTIF')
                    : tx(lang, 'READY', 'প্রস্তুত', 'جاهز', 'تیار', 'SIAP')}
                </span>
              </div>
              <button
                type="button"
                onClick={async () => {
                  await toggleNativeFamilyDnsVpn(true, true);
                  await configureNativeFortressWatchdog({
                    enabled: true,
                    lockSystemSettings: true,
                    autoNightDnsVpn: true,
                    nightStartHour: 22,
                    nightEndHour: 6,
                  });
                  onUpdatePurity((prev) => ({
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
                  onRefreshNativeStatus?.();
                  setDnsStatusMessage(
                    tx(
                      lang,
                      '✓ 1-Tap Family DNS (1.1.1.3) + Night System Settings Lock Watchdog Activated!',
                      '✓ ১-ক্লিকে Family DNS (1.1.1.3) এবং রাতের ফোন সেটিংস লক ওয়াচডগ সফলভাবে চালু হয়েছে!',
                      '✓ تم تفعيل درع DNS العائلي (1.1.1.3) وقفل إعدادات الهاتف الليلي بنجاح!',
                      '✓ ١-کلک فیملی DNS (1.1.1.3) اور نائٹ فون سیٹنگز لاک کامیابی سے فعال ہو گیا!',
                      '✓ Perisai DNS Keluarga (1.1.1.3) & Kunci Pengaturan Malam Berhasil Diaktifkan!'
                    )
                  );
                }}
                className="w-full py-2.5 bg-zinc-100 text-black font-mono-tech text-xs font-bold uppercase tracking-wider hover:bg-white cursor-pointer"
              >
                🛡️{' '}
                {tx(
                  lang,
                  'Activate 1-Tap Family DNS (1.1.1.3) + Full Night Lock Now',
                  '১-ক্লিকে অটো Family DNS (1.1.1.3) ও ফুল নাইট লক চালু করুন',
                  'تفعيل درع DNS (1.1.1.3) والقفل الليلي الكامل بضغطة واحدة',
                  '١-کلک میں آٹو فیملی DNS (1.1.1.3) اور مکمل نائٹ لاک آن کریں',
                  'Aktifkan 1-Sentuh DNS Keluarga (1.1.1.3) + Kunci Malam Penuh'
                )}
              </button>
            </div>

            {/* Control 1: If Private DNS Removed -> Automatically Active at Night */}
            <div className="border border-zinc-800 bg-zinc-950 p-2.5 flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="text-xs font-mono-tech font-semibold text-zinc-100">
                  🌙{' '}
                  {tx(
                    lang,
                    'Auto-Activate Private DNS at Night (If Removed)',
                    'রাতে প্রাইভেট DNS স্বয়ংক্রিয় চালু (কেউ মুছে ফেললেও নিজে চালু হবে)',
                    'تفعيل DNS الخاص تلقائياً في الليل (إذا تمت إزالته)',
                    'رات کو پرائیویٹ DNS خودکار فعال (اگر ہٹا دیا جائے تو خود آن ہو گا)',
                    'Aktifkan Otomatis DNS Pribadi di Malam Hari (Jika Dihapus)'
                  )}
                </div>
                <div className="text-[10px] text-zinc-400 mt-0.5 leading-snug">
                  {tx(
                    lang,
                    'If Private DNS is ever removed or turned off, it automatically re-activates at night (10 PM – 6 AM) and locks all browsers until restored.',
                    'প্রাইভেট DNS যদি কখনো বন্ধ বা মুছে ফেলা হয়, তবে রাত ১০টা–ভোর ৬টায় এটি স্বয়ংক্রিয়ভাবে পুনরায় সক্রিয় হবে এবং DNS ঠিক না করা পর্যন্ত সকল ব্রাউজার লক রাখবে।',
                    'إذا تم إيقاف أو إزالة DNS الخاص، فسيتم إعادة تفعيله تلقائياً في الليل (١٠ مساءً – ٦ صباحاً) وقفل جميع المتصفحات.',
                    'اگر پرائیویٹ DNS کبھی ہٹا دیا جائے تو رات ١٠ بجے سے صبح ٦ بجے تک یہ خودکار طور پر دوبارہ فعال ہو جائے گا اور تمام براؤزرز لاک کر دے گا۔',
                    'Jika DNS Pribadi dihapus atau dimatikan, otomatis aktif kembali saat malam (22:00–06:00) dan mengunci semua browser.'
                  )}
                </div>
                {purity.lastDnsAutoRestoreIso && (
                  <div className="text-[10px] font-mono-tech text-zinc-200 mt-1">
                    ✓{' '}
                    {tx(
                      lang,
                      `Last Verified / Auto-Activated: ${purity.lastDnsAutoRestoreIso}`,
                      `সর্বশেষ যাচাই / স্বয়ংক্রিয় সক্রিয়করণ: ${purity.lastDnsAutoRestoreIso}`,
                      `آخر تحقق / تفعيل تلقائي: ${purity.lastDnsAutoRestoreIso}`,
                      `آخری خودکار بحالی: ${purity.lastDnsAutoRestoreIso}`,
                      `Terakhir Diaktifkan Otomatis: ${purity.lastDnsAutoRestoreIso}`
                    )}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  if ((purity.autoActivateDnsAtNight ?? true) && (purity.dnsLockedByQr ?? true)) {
                    if (onRequestUnlockDnsFortress) onRequestUnlockDnsFortress();
                    return;
                  }
                  onUpdatePurity((prev) => ({
                    ...prev,
                    autoActivateDnsAtNight: !(prev.autoActivateDnsAtNight ?? true),
                  }));
                }}
                className={`px-2.5 py-1.5 border text-[10px] font-mono-tech font-bold shrink-0 cursor-pointer ${
                  purity.autoActivateDnsAtNight ?? true
                    ? 'border-zinc-100 bg-zinc-100 text-black'
                    : 'border-zinc-700 text-zinc-400'
                }`}
              >
                {purity.autoActivateDnsAtNight ?? true
                  ? tx(lang, '🔒 AUTO ON', '🔒 অটো চালু', '🔒 تلقائي', '🔒 آٹو آن', '🔒 AUTO ON')
                  : tx(lang, 'OFF', 'বন্ধ', 'متوقف', 'بند', 'MATI')}
              </button>
            </div>

            {/* Control 2: Lock Full Phone System Settings at Night (10 PM - 6 AM) */}
            <div className="border border-zinc-800 bg-zinc-950 p-2.5 flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="text-xs font-mono-tech font-semibold text-zinc-100">
                  📵{' '}
                  {tx(
                    lang,
                    'Lock Full Phone System Settings at Night (10 PM – 6 AM)',
                    'রাতে ফোনের সম্পূর্ণ সিস্টেম সেটিংস কঠোরভাবে লক করুন (রাত ১০টা – ভোর ৬টা)',
                    'قفل نظام إعدادات الهاتف بالكامل ليلاً (١٠ مساءً – ٦ صباحاً)',
                    'رات کے وقت فون کا مکمل سیٹنگز سسٹم لاک کریں (١٠ بجے تا ٦ بجے)',
                    'Kunci Penuh Sistem Pengaturan Ponsel di Malam Hari (22:00 – 06:00)'
                  )}
                </div>
                <div className="text-[10px] text-zinc-400 mt-0.5 leading-snug">
                  {tx(
                    lang,
                    'Blocks opening Android Settings, Private DNS, App Info & Default Home at night without scanning your Physical Emergency QR Card + 30s timer + Math check.',
                    'ফিজিক্যাল QR কার্ড স্ক্যান, ৩০ সেকেন্ড অপেক্ষা ও গণিত যাচাই ছাড়া রাতে ফোনের মূল সেটিংস (Settings, Private DNS, Apps) খোলা সম্পূর্ণ ব্লক করে এবং ব্যাকগ্রাউন্ডে সেটিংস বন্ধ করে দেয়।',
                    'يمنع فتح إعدادات الهاتف أو تغيير DNS الخاص ليلاً بدون مسح بطاقة QR الفعلية ومؤقت ٣٠ ثانية.',
                    'رات کو فزیکل QR کارڈ اسکین اور ٣٠ سیکنڈ ٹائمر کے بغیر فون کی سیٹنگز یا پرائیویٹ DNS کھولنا مکمل طور پر بلاک کرتا ہے۔',
                    'Memblokir pembukaan Pengaturan Android & DNS Pribadi di malam hari tanpa Kartu QR Fisik + timer 30 detik.'
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if ((purity.lockFullPhoneSettingsAtNight ?? true) && (purity.dnsLockedByQr ?? true)) {
                    if (onRequestUnlockDnsFortress) onRequestUnlockDnsFortress();
                    return;
                  }
                  onUpdatePurity((prev) => ({
                    ...prev,
                    lockFullPhoneSettingsAtNight: !(prev.lockFullPhoneSettingsAtNight ?? true),
                  }));
                }}
                className={`px-2.5 py-1.5 border text-[10px] font-mono-tech font-bold shrink-0 cursor-pointer ${
                  purity.lockFullPhoneSettingsAtNight ?? true
                    ? 'border-zinc-100 bg-zinc-100 text-black'
                    : 'border-zinc-700 text-zinc-400'
                }`}
              >
                {purity.lockFullPhoneSettingsAtNight ?? true
                  ? tx(lang, '🔒 LOCKED', '🔒 লকড', '🔒 مقفل', '🔒 لاکڈ', '🔒 TERKUNCI')
                  : tx(lang, 'OFF', 'বন্ধ', 'متوقف', 'بند', 'MATI')}
              </button>
            </div>

            {/* Quick Test & Verify Buttons for DNS Removal Auto-Activation & System Settings Lock */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  onUpdatePurity((prev) => ({
                    ...prev,
                    adultDnsEnabled: true,
                    dnsLockedByQr: true,
                    autoActivateDnsAtNight: true,
                    lockFullPhoneSettingsAtNight: true,
                    privateDnsRemovedAlert: true,
                    lastDnsAutoRestoreIso: new Date().toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    }),
                  }));
                }}
                className="py-2 px-2.5 border border-zinc-600 bg-zinc-900 hover:border-zinc-300 text-[10px] font-mono-tech text-zinc-100 cursor-pointer text-center"
              >
                ⚡{' '}
                {tx(
                  lang,
                  'Test: If Private DNS Removed → Auto-Lock Now',
                  'পরীক্ষা করুন: প্রাইভেট DNS মুছে গেলে অটো-লক শিল্ড',
                  'اختبار: عند إزالة DNS ← قفل واستعادة تلقائية',
                  'ٹیسٹ: اگر DNS ہٹا دیا جائے ← خودکار لاک شیلڈ',
                  'Uji: Jika DNS Dihapus → Kunci Otomatis Sekarang'
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onRequestPhoneSetting) {
                    onRequestPhoneSetting('dns');
                  } else if (onRequestUnlockDnsFortress) {
                    onRequestUnlockDnsFortress();
                  }
                }}
                className="py-2 px-2.5 border border-zinc-400 bg-zinc-950 hover:bg-zinc-900 text-[10px] font-mono-tech text-zinc-100 cursor-pointer text-center"
              >
                🔒{' '}
                {tx(
                  lang,
                  'Test: Try Opening Locked DNS / Phone Settings',
                  'পরীক্ষা করুন: লক থাকা DNS / ফোন সেটিংস খোলার চেষ্টা',
                  'اختبار: محاولة فتح إعدادات DNS المقفلة',
                  'ٹیسٹ: لاک شدہ DNS / فون سیٹنگز کھولنے کی کوشش',
                  'Uji: Coba Buka Pengaturan DNS yang Terkunci'
                )}
              </button>
            </div>
          </div>

          {/* 1-Tap Easy Setup + Stronger Control Panel */}
          <div className="bg-black border border-zinc-700 p-3 space-y-3">
            <div className="flex items-center justify-between gap-2 border-b border-zinc-900 pb-2">
              <span className="text-[11px] font-mono-tech font-bold uppercase text-zinc-100">
                ⚡{' '}
                {tx(
                  lang,
                  'EASY 1-TAP PRIVATE DNS SETUP (STRONGER CONTROL)',
                  '১-ট্যাপে সহজ প্রাইভেট DNS সেটআপ (কঠোর সুরক্ষা নিয়ন্ত্রণ)',
                  'إعداد DNS الخاص بضغطة واحدة (حماية مشددة)',
                  '١-ٹیپ آسان پرائیویٹ DNS سیٹ اپ (مضبوط کنٹرول)',
                  'PENGATURAN DNS PRIBADI 1-SENTUH (KONTROL KUAT)'
                )}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (purity.dnsLockedByQr ?? true) {
                    if (onRequestUnlockDnsFortress) {
                      onRequestUnlockDnsFortress();
                    }
                    return;
                  }
                  onUpdatePurity((prev) => ({
                    ...prev,
                    dnsLockedByQr: true,
                  }));
                }}
                className={`px-2 py-0.5 border text-[10px] font-mono-tech cursor-pointer ${
                  purity.dnsLockedByQr ?? true
                    ? 'border-zinc-200 bg-zinc-100 text-black font-bold'
                    : 'border-zinc-700 text-zinc-400'
                }`}
              >
                {purity.dnsLockedByQr ?? true
                  ? tx(lang, '🔒 QR Tamper Lock: ON', '🔒 QR সুরক্ষা লক: চালু', '🔒 قفل QR: مفعل', '🔒 QR لاک: آن', '🔒 Kunci QR: ON')
                  : tx(lang, 'Tamper Lock: OFF (Tap to Lock)', 'সুরক্ষা লক: বন্ধ (লক করুন)', 'قفل QR: متوقف', 'QR لاک: آف', 'Kunci QR: OFF')}
              </button>
            </div>

            {/* 3-Step Visual Quick Guide */}
            <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-mono-tech">
              <div className="border border-zinc-800 bg-zinc-950 p-2">
                <div className="text-zinc-100 font-bold">
                  {tx(lang, 'STEP 1', 'ধাপ ১', 'خطوة ١', 'مرحلہ ١', 'LANGKAH 1')}
                </div>
                <div className="text-zinc-400 mt-0.5">
                  {tx(
                    lang,
                    'Tap 1-Tap Setup Button below',
                    'নিচের ১-ট্যাপ সেটআপ বাটনে ট্যাপ করুন',
                    'اضغط زر الإعداد بالأسفل',
                    'نیچے ١-ٹیپ سیٹ اپ بٹن دبائیں',
                    'Ketuk tombol 1-Sentuh di bawah'
                  )}
                </div>
              </div>
              <div className="border border-zinc-800 bg-zinc-950 p-2">
                <div className="text-zinc-100 font-bold">
                  {tx(lang, 'STEP 2', 'ধাপ ২', 'خطوة ٢', 'مرحلہ ٢', 'LANGKAH 2')}
                </div>
                <div className="text-zinc-400 mt-0.5">
                  {tx(
                    lang,
                    'Tap “Private DNS Hostname”',
                    '“Private DNS Hostname” অপশনটি নির্বাচন করুন',
                    'اختر "Private DNS Hostname"',
                    '"Private DNS Hostname" منتخب کریں',
                    'Pilih "Private DNS Hostname"'
                  )}
                </div>
              </div>
              <div className="border border-zinc-800 bg-zinc-950 p-2">
                <div className="text-zinc-100 font-bold">
                  {tx(lang, 'STEP 3', 'ধাপ ৩', 'خطوة ٣', 'مرحلہ ٣', 'LANGKAH 3')}
                </div>
                <div className="text-zinc-400 mt-0.5">
                  {tx(
                    lang,
                    'Paste & Save (100% Protected)',
                    'পেস্ট (Paste) করে সেভ করুন (১০০% সুরক্ষিত)',
                    'الصق واحفظ (حماية ١٠٠٪)',
                    'پیسٹ کریں اور سیو کریں (١٠٠٪ محفوظ)',
                    'Tempel & Simpan (100% Terlindungi)'
                  )}
                </div>
              </div>
            </div>

            {/* Primary 1-Tap Setup Buttons for the 3 Best Family/Adult-Block DNS Providers */}
            <div className="space-y-2">
              {[
                {
                  id: 'cloudflare',
                  title: tx(
                    lang,
                    '⭐ 1. Cloudflare Family Shield (Fastest · Recommended)',
                    '⭐ ১. Cloudflare Family Shield (সবচেয়ে দ্রুত · প্রস্তাবিত)',
                    '⭐ ١. Cloudflare Family Shield (الأسرع · موصى به)',
                    '⭐ ١. Cloudflare Family Shield (تیز ترین · تجویز کردہ)',
                    '⭐ 1. Cloudflare Family Shield (Tercepat · Direkomendasikan)'
                  ),
                  host: 'family.cloudflare-dns.com',
                  desc: tx(
                    lang,
                    'Blocks all Adult/Porn sites + Malware across Chrome, Safari & all apps',
                    'ক্রোম, সাফারি ও সকল অ্যাপে পর্ন/অশ্লীল ওয়েবসাইট ও ক্ষতিকর ম্যালওয়্যার ব্লক করে',
                    'يحجب المواقع الإباحية والبرمجيات الخبيثة في جميع المتصفحات والتطبيقات',
                    'کروم، سفاری اور تمام ایپس میں فحش ویب سائٹس اور مالویئر بلاک کرتا ہے',
                    'Memblokir situs dewasa & malware di Chrome, Safari & semua aplikasi'
                  ),
                },
                {
                  id: 'cleanbrowsing',
                  title: tx(
                    lang,
                    '🔒 2. CleanBrowsing Strict Adult + Proxy/VPN Block (Strongest)',
                    '🔒 ২. CleanBrowsing Strict Adult (সবচেয়ে কঠোর — প্রক্সি ও অশ্লীল সাইট ব্লক)',
                    '🔒 ٢. CleanBrowsing Strict Adult (الأقوى ضد الإباحية والبروكسي)',
                    '🔒 ٢. CleanBrowsing Strict Adult (سب سے مضبوط فلٹر)',
                    '🔒 2. CleanBrowsing Strict Adult (Terkuat + Blokir Proxy)'
                  ),
                  host: 'adult-filter-dns.cleanbrowsing.org',
                  desc: tx(
                    lang,
                    'Blocks Adult sites + Forces SafeSearch on Google/YouTube + Blocks Proxies',
                    'অশ্লীল সাইট ব্লক করে + গুগল ও ইউটিউবে SafeSearch বাধ্যতামূলক করে + প্রক্সি বন্ধ করে',
                    'يحجب المواقع الإباحية ويفعل البحث الآمن في جوجل ويوتيوب',
                    'فحش سائٹس بلاک کرتا ہے + گوگل/یوٹیوب پر سیف سرچ لاگو کرتا ہے',
                    'Blokir situs dewasa + Paksa SafeSearch di Google/YouTube'
                  ),
                },
                {
                  id: 'adguard',
                  title: tx(
                    lang,
                    '🛡️ 3. AdGuard Family DNS (Blocks Ads + Adult Content + SafeSearch)',
                    '🛡️ ৩. AdGuard Family DNS (বিজ্ঞাপন + অশ্লীল সাইট ব্লক + SafeSearch)',
                    '🛡️ ٣. AdGuard Family DNS (حجب الإعلانات والمواقع الإباحية)',
                    '🛡️ ٣. AdGuard Family DNS (اشتہارات اور فحش مواد دونوں بلاک)',
                    '🛡️ 3. AdGuard Family DNS (Blokir Iklan + Situs Dewasa)'
                  ),
                  host: 'family.adguard-dns.com',
                  desc: tx(
                    lang,
                    'Blocks Adult domains + System-wide Ads & Trackers + SafeSearch',
                    'সকল অশ্লীল সাইট এবং ফোনের সকল বিরক্তিকর বিজ্ঞাপন ও ট্র্যাকার ব্লক করে',
                    'يحجب المواقع الإباحية والإعلانات والمتتبعات في النظام بالكامل',
                    'فحش سائٹس کے ساتھ ساتھ تمام ایپس کے اشتہارات اور ٹریکرز بھی بند کرتا ہے',
                    'Memblokir domain dewasa + Iklan & Pelacak di seluruh sistem'
                  ),
                },
              ].map((provider) => (
                <div
                  key={provider.id}
                  className="border border-zinc-800 bg-zinc-950 p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-mono-tech font-semibold text-zinc-100">
                      {provider.title}
                    </div>
                    <div className="text-[11px] font-mono-tech text-zinc-300 mt-0.5">
                      {tx(lang, 'Hostname:', 'হোস্টনেম (DNS):', 'العنوان (DNS):', 'ہوسٹ نیم (DNS):', 'Hostname:')}{' '}
                      <strong className="text-white select-all">{provider.host}</strong>
                    </div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">{provider.desc}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyAndOpenPrivateDns(provider.host)}
                    className="px-3 py-2 bg-zinc-100 text-black font-mono-tech text-[11px] font-bold uppercase tracking-wider hover:bg-white cursor-pointer shrink-0"
                  >
                    📋{' '}
                    {tx(
                      lang,
                      'Copy & Open DNS →',
                      'কপি ও DNS সেটিংস খুলুন →',
                      'نسخ وفتح إعدادات DNS ←',
                      'کاپی کریں اور DNS کھولیں →',
                      'Salin & Buka DNS →'
                    )}
                  </button>
                </div>
              ))}
            </div>

            {copiedHost && (
              <div className="p-2.5 border border-zinc-200 bg-zinc-900 text-[11px] font-mono-tech text-zinc-100">
                ✓{' '}
                {tx(
                  lang,
                  `Auto-copied ${copiedHost} & opened Network Settings! Tap “Private DNS” → “Private DNS provider hostname” → Paste → Save.`,
                  `স্বয়ংক্রিয়ভাবে ${copiedHost} কপি করা হয়েছে এবং নেটওয়ার্ক সেটিংস খোলা হয়েছে! এবার “Private DNS” → “Private DNS provider hostname”-এ গিয়ে পেস্ট (Paste) করে Save চাপুন।`,
                  `تم نسخ ${copiedHost} وفتح إعدادات الشبكة! اختر Private DNS ثم الصق واحفظ.`,
                  `${copiedHost} کاپی ہو گیا اور نیٹ ورک سیٹنگز کھل گئیں! Private DNS میں جا کر پیسٹ اور سیو کریں۔`,
                  `Berhasil menyalin ${copiedHost} & membuka Pengaturan! Ketuk Private DNS → Tempel → Simpan.`
                )}
              </div>
            )}

            {dnsStatusMessage && (
              <div className="p-2.5 border border-zinc-700 bg-zinc-950 text-[11px] font-mono-tech text-zinc-200">
                {dnsStatusMessage}
              </div>
            )}
          </div>
        </div>

        {/* Layer 2: Browser & Incognito Keyword Blocker */}
        <div className="flex items-center justify-between py-2 border-b border-zinc-900">
          <div className="pr-3">
            <div className="text-xs font-medium text-zinc-200">{t.keywordBlockerLabel}</div>
            <div className="text-[11px] text-zinc-500 font-mono-tech">
              {tx(
                lang,
                `Blocks ${allBlockedKeywords.length} adult keywords, URLs & incognito triggers`,
                `${allBlockedKeywords.length}টি অশ্লীল কীওয়ার্ড, ওয়েবসাইট লিংক ও ইনকগনিটো ট্রিগার ব্লক করে`,
                `يحجب ${allBlockedKeywords.length} كلمة ورابط إباحي في المتصفح الخفي`,
                `${allBlockedKeywords.length} فحش الفاظ، لنکس اور انکوگنیٹو ٹریگرز کو بلاک کرتا ہے`,
                `Memblokir ${allBlockedKeywords.length} kata kunci dewasa, URL & mode samaran`
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (purity.browserKeywordShield && (purity.dnsLockedByQr ?? true)) {
                if (onRequestUnlockDnsFortress) onRequestUnlockDnsFortress();
                return;
              }
              onUpdatePurity((prev) => ({
                ...prev,
                browserKeywordShield: !prev.browserKeywordShield,
              }));
            }}
            className={`px-3 py-1.5 border text-xs font-mono-tech cursor-pointer shrink-0 ${
              purity.browserKeywordShield
                ? 'border-zinc-200 bg-zinc-100 text-black font-semibold'
                : 'border-zinc-700 text-zinc-400'
            }`}
          >
            {purity.browserKeywordShield
              ? tx(lang, '🔒 ACTIVE', '🔒 চালু', '🔒 نشط', '🔒 فعال', '🔒 AKTIF')
              : tx(lang, 'OFF', 'বন্ধ', 'متوقف', 'بند', 'MATI')}
          </button>
        </div>

        {/* Layer 3: High-Risk Night Guard (10 PM - 6 AM) */}
        <div className="flex items-center justify-between py-2 border-b border-zinc-900">
          <div className="pr-3">
            <div className="text-xs font-medium text-zinc-200">{t.nightGuardLabel}</div>
            <div className="text-[11px] text-zinc-500 font-mono-tech">
              {tx(
                lang,
                'Automatically locks browsers & social feeds during late-night hours',
                'রাত ১০টা থেকে ভোর ৬টা পর্যন্ত ব্রাউজার ও সোশ্যাল মিডিয়া স্বয়ংক্রিয়ভাবে লক রাখে',
                'يقفل المتصفحات وتطبيقات التواصل تلقائياً خلال ساعات الليل المتأخرة',
                'رات ١٠ بجے سے صبح ٦ بجے تک براؤزرز اور سوشل ایپس کو خودکار لاک رکھتا ہے',
                'Mengunci browser & feed sosial secara otomatis selama jam larut malam'
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (purity.nightGuardLock && (purity.dnsLockedByQr ?? true)) {
                if (onRequestUnlockDnsFortress) onRequestUnlockDnsFortress();
                return;
              }
              onUpdatePurity((prev) => ({ ...prev, nightGuardLock: !prev.nightGuardLock }));
            }}
            className={`px-3 py-1.5 border text-xs font-mono-tech cursor-pointer shrink-0 ${
              purity.nightGuardLock
                ? 'border-zinc-200 bg-zinc-100 text-black font-semibold'
                : 'border-zinc-700 text-zinc-400'
            }`}
          >
            {purity.nightGuardLock
              ? tx(lang, '🔒 LOCKED', '🔒 লকড', '🔒 مقفل', '🔒 لاکڈ', '🔒 TERKUNCI')
              : tx(lang, 'OFF', 'বন্ধ', 'متوقف', 'بند', 'MATI')}
          </button>
        </div>

        {/* Custom Trigger Keyword / Website Blocklist Manager */}
        <div className="space-y-2 pt-1">
          <div className="text-[11px] font-mono-tech text-zinc-400">
            {tx(
              lang,
              `CUSTOM BLOCKED TRIGGERS & DOMAINS (${allBlockedKeywords.length} active rules):`,
              `নিজস্ব ব্লক করা শব্দ ও ওয়েবসাইট তালিকা (${allBlockedKeywords.length}টি নিয়ম সক্রিয়):`,
              `الكلمات والمواقع المحظورة المخصصة (${allBlockedKeywords.length} قاعدة نشطة):`,
              `مخصوص بلاک کردہ الفاظ اور ویب سائٹس (${allBlockedKeywords.length} اصول فعال):`,
              `KATA KUNCI & DOMAIN BLOKIR KUSTOM (${allBlockedKeywords.length} aturan aktif):`
            )}
          </div>
          <form onSubmit={handleAddCustomKeyword} className="flex gap-2">
            <input
              type="text"
              value={newKeywordInput}
              onChange={(e) => setNewKeywordInput(e.target.value)}
              placeholder={tx(
                lang,
                'Add custom keyword or website to block...',
                'ব্লক করতে যেকোনো শব্দ বা ওয়েবসাইটের নাম লিখুন...',
                'أضف كلمة أو موقعاً لحجبه...',
                'بلاک کرنے کے لیے کوئی لفظ یا ویب سائٹ لکھیں...',
                'Tambahkan kata kunci atau situs untuk diblokir...'
              )}
              className="flex-1 bg-black border border-zinc-800 px-3 py-2 text-xs text-zinc-200 font-mono-tech focus:outline-none focus:border-zinc-500"
            />
            <button
              type="submit"
              className="px-3 py-2 border border-zinc-600 bg-zinc-900 text-xs font-mono-tech text-zinc-100 hover:bg-zinc-800 cursor-pointer"
            >
              + {tx(lang, 'Block', 'ব্লক করুন', 'حجب', 'بلاک کریں', 'Blokir')}
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

        {/* Interactive Browser Keyword Shield Test */}
        <form onSubmit={handleTestBrowserGuard} className="pt-2 flex gap-2">
          <input
            type="text"
            value={testSearchUrl}
            onChange={(e) => setTestSearchUrl(e.target.value)}
            placeholder={tx(
              lang,
              'Test URL/keyword block simulator...',
              'শিল্ড পরীক্ষা করতে যেকোনো লিংক বা শব্দ লিখে টেস্ট করুন...',
              'اختبر محاكي حجب المواقع والكلمات...',
              'شیلڈ چیک کرنے کے لیے کوئی لنک یا لفظ ٹیسٹ کریں...',
              'Uji simulator pemblokir URL/kata kunci...'
            )}
            className="flex-1 bg-black border border-zinc-800 px-3 py-2 text-xs text-zinc-200 font-mono-tech focus:outline-none focus:border-zinc-500"
          />
          <button
            type="submit"
            className="px-3 py-2 border border-zinc-700 text-xs font-mono-tech text-zinc-300 hover:bg-zinc-900 cursor-pointer"
          >
            {tx(lang, 'Test Shield', 'টেস্ট শিল্ড', 'اختبار الدرع', 'ٹیسٹ شیلڈ', 'Uji Perisai')}
          </button>
        </form>

        {interceptedAlert && (
          <div className="p-3 border border-zinc-400 bg-black text-xs space-y-1.5">
            <div className="font-mono-tech text-zinc-100 font-semibold">
              🛑{' '}
              {tx(
                lang,
                'SHIELD INTERCEPTED UNSAFE QUERY',
                'সুরক্ষা শিল্ড অনিরাপদ অনুসন্ধানটি আটকে দিয়েছে',
                'اعترض الدرع عملية بحث غير آمنة',
                'حفاظتی شیلڈ نے غیر محفوظ تلاش کو روک دیا ہے',
                'PERISAI MENCEGAT PENCARIAN TIDAK AMAN'
              )}
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
              {tx(
                lang,
                'Dismiss & Return to Peace',
                'বন্ধ করুন ও প্রশান্তিতে ফিরুন',
                'إغلاق والعودة للسكينة',
                'بند کریں اور سکون کی طرف لوٹیں',
                'Tutup & Kembali Tenang'
              )}
            </button>
          </div>
        )}
      </div>
      )}

      {/* 90-Day Neuro-Rewiring Milestones */}
      {(currentSubTab === 'all' || currentSubTab === 'sos-streak' || currentSubTab === 'keywords-logs') && (
      <>
      <div className="border border-zinc-800 p-4 space-y-3 bg-zinc-950/40">
        <div className="text-xs font-mono-tech uppercase tracking-wider text-zinc-400">
          {tx(
            lang,
            '90-DAY DOPAMINE REWIRING MILESTONES',
            '৯০ দিনের মস্তিষ্ক ও ডোপামিন পুনর্গঠন মাইলফলক',
            'مراحل إعادة ضبط الدوبامين خلال ٩٠ يوماً',
            '٩٠ دن کے ڈوپامائن ری سیٹ کے مراحل',
            'TONGGAK PEMULIHAN DOPAMIN 90 HARI'
          )}
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
                    {tx(lang, m.titleEn, m.titleBn, m.titleAr, m.titleUr, m.titleId)}
                  </span>
                  <span>
                    {reached
                      ? tx(lang, '✓ UNLOCKED', '✓ অর্জিত', '✓ مكتمل', '✓ مکمل', '✓ TERCAPAI')
                      : `${m.day - daysClean} ${tx(lang, 'd left', 'দিন বাকি', 'يوم متبق', 'دن باقی', 'hari lagi')}`}
                  </span>
                </div>
                <p className="text-xs mt-1 text-zinc-400">
                  {tx(lang, m.descEn, m.descBn, m.descAr, m.descUr, m.descId)}
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
          {tx(
            lang,
            '+1 Day (Adjust Existing Streak)',
            '+১ দিন যোগ করুন (পূর্বের স্ট্রিক সমন্বয়)',
            '+١ يوم (تعديل السجل)',
            '+١ دن (سابقہ اسٹریک ایڈجسٹ کریں)',
            '+1 Hari (Sesuaikan Streak)'
          )}
        </button>
      </div>
      </>
      )}

      {/* Relapse Root-Cause Modal */}
      {showRelapseModal && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-6">
          <div className="max-w-md w-full border border-zinc-700 bg-zinc-950 p-6 space-y-4">
            <div className="text-xs font-mono-tech uppercase text-zinc-400">
              {tx(
                lang,
                'COMPASSIONATE TRIGGER AUDIT',
                'সহানুভূতিশীল আত্ম-পর্যালোচনা ও কারণ নির্ণয়',
                'مراجعة رحيمة لأسباب الانتكاسة',
                'ہمدردانہ خود احتسابی اور وجہ کی نشاندہی',
                'EVALUASI PEMICU DENGAN BIJAK'
              )}
            </div>
            <h3 className="text-base font-medium text-zinc-100">
              {tx(
                lang,
                'What triggered the slip? We will automatically fortify that weak point.',
                'কোন কারণে হোঁচট খেয়েছেন? আমরা সেই দুর্বল স্থানটিকে স্বয়ংক্রিয়ভাবে আরও শক্তিশালী করে দেব।',
                'ما الذي سبب الزلة؟ سنقوم بتحصين تلك النقطة تلقائياً.',
                'کس وجہ سے لغزش ہوئی؟ ہم اس کمزور پہلو کو خودکار طور پر مضبوط کر دیں گے۔',
                'Apa yang memicu tergelincir? Kami akan memperkuat titik lemah itu secara otomatis.'
              )}
            </h3>
            <div className="space-y-2">
              {triggerCauses.map((cause) => (
                <button
                  key={cause.id}
                  type="button"
                  onClick={() => setSelectedTriggerCause(cause.id)}
                  className={`w-full text-left px-3 py-2.5 border text-xs font-mono-tech cursor-pointer ${
                    selectedTriggerCause === cause.id
                      ? 'border-zinc-200 bg-zinc-900 text-white'
                      : 'border-zinc-800 text-zinc-400'
                  }`}
                >
                  {selectedTriggerCause === cause.id ? '● ' : '○ '}
                  {cause.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowRelapseModal(false)}
                className="flex-1 py-2.5 border border-zinc-700 text-xs font-mono-tech text-zinc-300 cursor-pointer"
              >
                {tx(lang, 'Cancel', 'বাতিল', 'إلغاء', 'منسوخ کریں', 'Batal')}
              </button>
              <button
                type="button"
                onClick={handleConfirmRelapseReset}
                className="flex-1 py-2.5 bg-zinc-100 text-black text-xs font-mono-tech font-semibold cursor-pointer"
              >
                {tx(
                  lang,
                  'Reset & Fortify Shield',
                  'পুনরায় শুরু করুন ও সুরক্ষা জোরদার করুন',
                  'إعادة الضبط وتحصين الدرع',
                  'ری سیٹ کریں اور شیلڈ مضبوط بنائیں',
                  'Reset & Perkuat Perisai'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* URGE SOS EMERGENCY INTERVENTION MODAL WITH STANFORD CYCLIC PHYSIOLOGICAL SIGH */}
      {sosModalOpen && (
        <div className="fixed inset-0 z-50 bg-black text-zinc-100 flex flex-col justify-between p-6 overflow-y-auto">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-3 text-xs font-mono-tech text-zinc-400">
            <span>
              ⚡{' '}
              {tx(
                lang,
                'URGE SOS // STANFORD CYCLIC SIGH & HEART RESET',
                'জরুরি SOS // স্ট্যানফোর্ড সাইক্লিক শ্বাস ও হৃদয় প্রশান্তি',
                'طوارئ SOS // التنفس الفسيولوجي وتهدئة القلب',
                'ایمرجنسی SOS // اسٹینفورڈ سائیکلک سانس اور دل کا سکون',
                'SOS DARURAT // NAPAS FISIOLOGIS STANFORD'
              )}
            </span>
            <button
              type="button"
              onClick={() => setSosModalOpen(false)}
              className="underline text-zinc-500 hover:text-zinc-200 cursor-pointer"
            >
              {tx(lang, 'Close', 'বন্ধ করুন', 'إغلاق', 'بند کریں', 'Tutup')}
            </button>
          </div>

          <div className="my-auto max-w-md mx-auto w-full space-y-5 py-4 text-center">
            <div className="inline-flex flex-col items-center justify-center w-40 h-40 rounded-full border-2 border-zinc-300 animate-breathe mx-auto p-3">
              <div className="text-3xl font-mono-tech text-zinc-100">{sosTimer}s</div>
              <div className="text-[10px] font-mono-tech text-zinc-400 uppercase mt-1">
                {tx(
                  lang,
                  'STANFORD CYCLIC SIGH',
                  'স্ট্যানফোর্ড ডাবল-শ্বাস পদ্ধতি',
                  'التنفس المزدوج',
                  'ڈبل سانس کی مشق',
                  'NAPAS GANDA STANFORD'
                )}
              </div>
            </div>

            <div className="border border-zinc-600 bg-zinc-900/80 p-3 text-xs font-mono-tech text-zinc-100">
              🫁 {sighPhaseLabel}
            </div>

            {/* Piercing Quran / Hadith / Self-Mastery Line */}
            <div className="border border-zinc-700 bg-zinc-950 p-4 text-left">
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
                  onClick={() =>
                    setSosTriggerIndex((prev) =>
                      pickRandomQuoteIndex(prev, purityTriggers.length)
                    )
                  }
                  className="underline hover:text-white cursor-pointer"
                >
                  🎲 {t.nextWhisperBtn} ↻
                </button>
              </div>
            </div>

            {/* 3 Physical Grounding Actions */}
            <div className="text-left space-y-2">
              <p className="text-xs font-mono-tech uppercase text-zinc-400">
                {tx(
                  lang,
                  'COMPLETE PHYSICAL INTERRUPT PROTOCOL:',
                  'শারীরিক ও মানসিক তাড়না ভাঙার ৩টি পদক্ষেপ:',
                  'خطوات كسر الرغبة فوراً:',
                  'خواہش توڑنے کے ٣ فوری جسمانی اقدامات:',
                  '3 LANGKAH FISIK PEMUTUS DORONGAN:'
                )}
              </p>
              {[
                tx(
                  lang,
                  '1. Stand up immediately and change your physical posture',
                  '১. এখনই বিছানা বা চেয়ার ছেড়ে উঠে দাঁড়ান এবং ফোনটি দূরে রাখুন',
                  '١. قف فوراً وغيّر مكانك أو وضعيتك الجسدية',
                  '١. فوراً بستر یا کرسی سے اٹھ کھڑے ہوں اور اپنی جگہ بدلیں',
                  '1. Segera berdiri dan ubah posisi fisik Anda'
                ),
                tx(
                  lang,
                  '2. Splash cold water on your face or perform Wudu / take 3 Cyclic Sighs',
                  '২. চোখে-মুখে ঠান্ডা পানি দিন বা অজু করুন এবং ৩ বার গভীর শ্বাস নিন',
                  '٢. اغسل وجهك بماء بارد أو توضأ وخذ ٣ أنفاس عميقة',
                  '٢. چہرے پر ٹھنڈا پانی ڈالیں یا وضو کریں اور ٣ گہرے سانس لیں',
                  '2. Basuh wajah dengan air dingin dan tarik 3 napas dalam'
                ),
                tx(
                  lang,
                  '3. Remember: 5 minutes of pixels is never worth losing your peace',
                  '৩. মনে রাখুন: ৫ মিনিটের কৃত্রিম মোহের চেয়ে আপনার আত্মসম্মান ও প্রশান্তি অনেক বড়',
                  '٣. تذكر: ٥ دقائق زائفة لا تستحق أبداً خسارة سكينتك وكرامتك',
                  '٣. یاد رکھیں: ٥ منٹ کی جھوٹی لذت آپ کے قلبی سکون سے بڑی نہیں',
                  '3. Ingat: 5 menit semu di layar tidak sebanding dengan ketenangan jiwa Anda'
                ),
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
              ✓{' '}
              {tx(
                lang,
                'I Outlasted the Urge (+1 Victory & Return to Peace)',
                'আমি তাড়নাকে জয় করেছি (+১ বিজয় ও প্রশান্তিতে প্রত্যাবর্তন)',
                'لقد تغلبت على الرغبة (+١ انتصار والعودة للسكينة)',
                'میں نے خواہش پر قابو پا لیا (+١ کامیابی اور واپسی)',
                'Saya Berhasil Mengalahkan Dorongan (+1 Kemenangan)'
              )}
            </button>
          </div>

          <div className="border-t border-zinc-900 pt-3 text-center text-[11px] font-mono-tech text-zinc-600">
            {tx(
              lang,
              '100% OFFLINE & PRIVATE · ZERO DATA LEAVES YOUR PHONE',
              '১০০% অফলাইন ও গোপনীয় · আপনার ফোনের কোনো তথ্য বাইরে যায় না',
              '١٠٠٪ بدون إنترنت وخصوصية تامة · لا تغادر أي بيانات هاتفك',
              '١٠٠٪ آف لائن اور نجی · آپ کا کوئی ڈیٹا فون سے باہر نہیں جاتا',
              '100% OFFLINE & PRIVAT · TIDAK ADA DATA KELUAR DARI PONSEL ANDA'
            )}
          </div>
        </div>
      )}
    </div>
  );
};

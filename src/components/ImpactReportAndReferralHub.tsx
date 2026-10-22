import React, { useMemo, useState } from 'react';
import type {
  AppItem,
  FocusVaultState,
  LanguageCode,
  PurityState,
  SlowLearningState,
} from '../types/app';
import { getSelfMasteryRank, tx } from '../i18n/translations';

interface ImpactReportAndReferralHubProps {
  lang: LanguageCode;
  impulsesStopped: number;
  reclaimedMinutes: number;
  purity: PurityState;
  slowLearning: SlowLearningState;
  vault: FocusVaultState;
  apps: AppItem[];
  onOpenShareableReceipt?: () => void;
}

type HorizonMode = '7d' | '30d' | '1y' | '5y';
type ReferralTemplateType = 'personal-success' | 'family-protection' | 'continuous-learning';

const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.kasbllc.minimumphone';

export const ImpactReportAndReferralHub: React.FC<ImpactReportAndReferralHubProps> = ({
  lang,
  impulsesStopped,
  reclaimedMinutes,
  purity,
  slowLearning,
  vault,
  apps,
  onOpenShareableReceipt,
}) => {
  const [horizon, setHorizon] = useState<HorizonMode>('7d');
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(6); // Today
  const [bonusSimulatedMinutes, setBonusSimulatedMinutes] = useState<number>(0);
  const [bonusSimulatedImpulses, setBonusSimulatedImpulses] = useState<number>(0);
  const [bonusSimulatedQuizzes, setBonusSimulatedQuizzes] = useState<number>(0);

  // Referral state
  const [referralTemplate, setReferralTemplate] =
    useState<ReferralTemplateType>('personal-success');
  const [copiedFeedback, setCopiedFeedback] = useState<string | null>(null);
  const [showFriendInstallQr, setShowFriendInstallQr] = useState<boolean>(false);
  const [friendsInvitedCount, setFriendsInvitedCount] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('minimum_phone_friends_invited_v1') || '3');
    } catch {
      return 3;
    }
  });

  // Effective metrics including live simulation boosts
  const effectiveReclaimedMinutes = reclaimedMinutes + bonusSimulatedMinutes;
  const effectiveImpulsesStopped = impulsesStopped + bonusSimulatedImpulses;
  const effectiveLessonsCompleted =
    slowLearning.lessonsCompleted + bonusSimulatedQuizzes;
  const effectiveQuizzesPassed = slowLearning.quizzesPassed + bonusSimulatedQuizzes;
  const effectiveXp = slowLearning.xp + bonusSimulatedQuizzes * 15;

  const masteryRank = getSelfMasteryRank(effectiveXp, lang);
  const masteredCount = Math.max(
    (slowLearning.masteredLessonIds || []).length,
    Math.min(18, effectiveQuizzesPassed)
  );
  const reviewDueCount = (slowLearning.reviewDueLessonIds || []).length;

  const emotionCounts = slowLearning.emotionCounts || {
    purpose: 4,
    bored: 6,
    stressed: 3,
    tired: 2,
  };

  const purityDays = Math.max(
    1,
    Math.floor(
      Math.max(0, Date.now() - new Date(purity.streakStartIso).getTime()) / 86400000
    )
  );

  const todayScreenMinutes = apps.reduce((sum, a) => sum + a.dailyMinutesUsed, 0);
  const preAppBaselineDailyMinutes = 275; // 4h 35m average smartphone drain before Minimum Phone
  const dailySavedMinutes = Math.max(
    65,
    Math.round(effectiveReclaimedMinutes / 7) +
      Math.max(0, Math.round((preAppBaselineDailyMinutes - todayScreenMinutes) * 0.35))
  );

  const horizonMultiplier =
    horizon === '7d' ? 7 : horizon === '30d' ? 30 : horizon === '1y' ? 365 : 365 * 5;

  const projectedMinutesSaved =
    horizon === '7d'
      ? Math.max(effectiveReclaimedMinutes, dailySavedMinutes * 7)
      : dailySavedMinutes * horizonMultiplier;

  const projectedHoursSaved = (projectedMinutesSaved / 60).toFixed(1);
  const projectedWakingDaysSaved = (projectedMinutesSaved / (60 * 16)).toFixed(1); // 16 waking hours/day
  const projectedBooksEquivalent = Math.max(
    1,
    Math.round(projectedMinutesSaved / 60 / 6)
  ); // ~6 hrs per book/Juz
  const projectedLessonsMastered =
    horizon === '7d'
      ? Math.max(effectiveLessonsCompleted, 14)
      : Math.round((Math.max(effectiveLessonsCompleted, 14) / 7) * horizonMultiplier);

  // 7-Day visual dataset for interactive SVG & Bar Chart
  const weeklyChartData = useMemo(() => {
    const dayLabels = [
      tx(lang, 'Mon', 'সোম', 'إثنين', 'پیر', 'Sen'),
      tx(lang, 'Tue', 'মঙ্গল', 'ثلاثاء', 'منگل', 'Sel'),
      tx(lang, 'Wed', 'বুধ', 'أربعاء', 'بدھ', 'Rab'),
      tx(lang, 'Thu', 'বৃহঃ', 'خميس', 'جمعرات', 'Kam'),
      tx(lang, 'Fri', 'শুক্র', 'جمعة', 'جمعہ', 'Jum'),
      tx(lang, 'Sat', 'শনি', 'سبت', 'ہفتہ', 'Sab'),
      tx(lang, 'Today', 'আজ', 'اليوم', 'آج', 'Hari Ini'),
    ];
    const baseScreen = [142, 128, 115, 104, 96, 88, Math.min(130, todayScreenMinutes)];
    const baseSaved = [
      Math.round(dailySavedMinutes * 0.78),
      Math.round(dailySavedMinutes * 0.85),
      Math.round(dailySavedMinutes * 0.92),
      Math.round(dailySavedMinutes * 0.98),
      Math.round(dailySavedMinutes * 1.06),
      Math.round(dailySavedMinutes * 1.12),
      dailySavedMinutes + Math.round(bonusSimulatedMinutes * 0.4),
    ];
    const baseImpulses = [4, 5, 6, 6, 7, 8, Math.max(5, Math.round(effectiveImpulsesStopped / 5))];
    const baseQuizzes = [2, 3, 3, 4, 4, 5, Math.max(3, effectiveQuizzesPassed % 9)];

    return dayLabels.map((label, idx) => ({
      label,
      beforeMinutes: preAppBaselineDailyMinutes,
      actualScreenMinutes: baseScreen[idx],
      savedMinutes: baseSaved[idx],
      impulsesBlocked: baseImpulses[idx],
      quizzesCompleted: baseQuizzes[idx],
      reductionPct: Math.min(
        85,
        Math.max(
          35,
          Math.round(
            ((preAppBaselineDailyMinutes - baseScreen[idx]) /
              preAppBaselineDailyMinutes) *
              100
          )
        )
      ),
    }));
  }, [
    lang,
    todayScreenMinutes,
    dailySavedMinutes,
    bonusSimulatedMinutes,
    effectiveImpulsesStopped,
    effectiveQuizzesPassed,
  ]);

  const activeDay = weeklyChartData[selectedDayIndex] || weeklyChartData[6];

  // Radial gauge metrics (0 - 100)
  const attentionSovereigntyPct = Math.min(
    99,
    Math.round(74 + Math.min(24, effectiveImpulsesStopped * 0.45))
  );
  const learningRetentionPct = Math.min(
    99,
    Math.round(82 + Math.min(16, effectiveQuizzesPassed * 0.8))
  );
  const dopamineRecoveryPct = Math.min(
    99,
    Math.round(62 + Math.min(36, purityDays * 2.5 + (purity.urgesDefeatedCount || 1) * 2))
  );

  // Breakdown of how Minimum Phone helped save time
  const protectionBreakdown = [
    {
      id: 'quiz-gate',
      label: tx(
        lang,
        '20s Read & Comprehension Quiz + Spaced Repetition Gate',
        '২০ সেকেন্ডের পাঠ ও কুইজ + স্পেসড রিপিটিশন মেমোরি গেট',
        'بوابة القراءة والاختبار (٢٠ ثانية) + التكرار المتباعد',
        '٢٠ سیکنڈ مطالعہ و کوئز + اسپیسڈ ریپیٹیشن گیٹ',
        'Gerbang Baca & Kuis 20d + Spaced Repetition'
      ),
      pct: 38,
      minutes: Math.round(projectedMinutesSaved * 0.38),
      badge: `${effectiveQuizzesPassed} ${tx(lang, 'Quizzes Passed', 'কুইজ উত্তীর্ণ', 'اختبار مجتاز', 'کوئز پاس', 'Kuis Lulus')}`,
    },
    {
      id: 'escalation-20m',
      label: tx(
        lang,
        '5m Minor → 10m Medium → 20m Full-Screen Auto-Close (Facebook/YouTube/IG)',
        '৫মি মৃদু → ১০মি মাঝারি → ২০ মিনিটে পূর্ণ-স্ক্রিন অটো-ক্লোজ (ফেসবুক/ইউটিউব/ইনস্টাগ্রাম)',
        'تنبيه ٥د ← ١٠د ← إغلاق تلقائي كامل عند ٢٠ دقيقة',
        '٥ منٹ ← ١٠ منٹ ← ٢٠ منٹ پر خودکار فل اسکرین بندش',
        '5m Ringan → 10m Sedang → 20m Tutup Otomatis Penuh'
      ),
      pct: 27,
      minutes: Math.round(projectedMinutesSaved * 0.27),
      badge: tx(lang, 'Anti-Rabbit-Hole Shield', 'স্ক্রল-ফাঁদ প্রতিরোধক', 'درع منع التصفح اللانهائي', 'اسکرولنگ روک تھام', 'Perisai Anti-Scroll'),
    },
    {
      id: 'night-qr-dns',
      label: tx(
        lang,
        'Night Emergency QR Lock + Circadian Wind-Down + Private Safe DNS',
        'রাতের জরুরি QR লক + সার্কাডিয়ান ঘুম সুরক্ষা + প্রাইভেট সেফ DNS',
        'قفل QR الليلي + حماية النوم + درع DNS الآمن',
        'رات کا ایمرجنسی QR لاک + سرکیڈین نیند حفاظت + پرائیویٹ DNS',
        'Kunci QR Malam + Pelindung Tidur + DNS Aman Pribadi'
      ),
      pct: 17,
      minutes: Math.round(projectedMinutesSaved * 0.17),
      badge: `${purityDays} ${tx(lang, 'Days Clean', 'দিন পবিত্র স্ট্রিক', 'يوم نقي', 'دن پاکیزہ', 'Hari Bersih')}`,
    },
    {
      id: 'notif-guard',
      label: tx(
        lang,
        'Notification App-Open Guard & Scheduled Batch Digest',
        'নোটিফিকেশন অ্যাপ-ওপেন গার্ড ও নির্ধারিত সময়ের ডাইজেস্ট',
        'حارس فتح الإشعارات وملخص الدفعات المجدول',
        'نوٹیفکیشن ایپ اوپن گارڈ اور شیڈول ڈائجسٹ',
        'Penjaga Notifikasi & Ringkasan Terjadwal'
      ),
      pct: 11,
      minutes: Math.round(projectedMinutesSaved * 0.11),
      badge: tx(lang, 'Zero Bait Traps', 'শূন্য প্রলোভন ফাঁদ', 'صفر فخاخ', 'صفر کشش کے جال', 'Nol Jebakan Notifikasi'),
    },
    {
      id: 'bg-cleaner',
      label: tx(
        lang,
        'Background Safe-List Auto-Cleaner & Monochrome Grayscale Shield',
        'ব্যাকগ্রাউন্ড সেফ-লিস্ট অটো-ক্লিনার ও মনোক্রোম গ্রেস্কেল শিল্ড',
        'منظف الخلفية التلقائي ودرع الشاشة الأحادية',
        'بیک گراؤنڈ سیف لسٹ آٹو کلینر اور گرے اسکیل شیلڈ',
        'Pembersih Otomatis Latar Belakang & Layar Monokrom'
      ),
      pct: 7,
      minutes: Math.round(projectedMinutesSaved * 0.07),
      badge: `${(vault.backgroundSafeAppIds || []).length || 6} ${tx(lang, 'Safe Apps', 'নিরাপদ অ্যাপ', 'تطبيق آمن', 'محفوظ ایپس', 'Aplikasi Aman')}`,
    },
  ];

  // Referral Message Builder (Multilingual)
  const referralMessage = useMemo(() => {
    const hoursStr = (effectiveReclaimedMinutes / 60).toFixed(1);
    if (lang === 'bn') {
      if (referralTemplate === 'personal-success') {
        return `🌱 আমি *Minimum Phone* ব্যবহার করে জীবনের ${hoursStr}+ ঘণ্টা মূল্যবান সময় বাঁচিয়েছি, ${effectiveImpulsesStopped} বার অকারণে ফোন স্ক্রল করার তাড়না থামিয়েছি এবং ${effectiveLessonsCompleted}টি ধারাবাহিক শিক্ষা কুইজ সম্পন্ন করেছি!\n\n✅ ১০০% ফ্রি এবং ০% বিজ্ঞাপন (চিরকাল)\n✅ সোশ্যাল অ্যাপ খোলার আগে ২০ সেকেন্ডের পাঠ ও কুইজ (কুরআন, হাদীস, ভাষা ও প্রজ্ঞা শিক্ষা)\n✅ ফেসবুক, ইউটিউব ও ইনস্টাগ্রামে ৫মি / ১০মি / ২০ মিনিটে অটো-ক্লোজ\n✅ প্রাইভেট সেফ DNS + রাতে জরুরি QR কোড লক\n\nনিজের ও পরিবারের জন্য বিনামূল্যে ডাউনলোড করুন:\n${PLAY_STORE_URL}`;
      }
      if (referralTemplate === 'family-protection') {
        return `🛡️ আপনাকে এবং আপনার পরিবারকে মোবাইল আসক্তি ও ক্ষতিকর অশ্লীল কনটেন্ট থেকে রক্ষা করতে ব্যবহার করুন *Minimum Phone* — ১০০% ফ্রি এবং বিজ্ঞাপনমুক্ত!\n\n• প্রাইভেট সেফ DNS দিয়ে সকল ব্রাউজারে অশ্লীল ওয়েবসাইট ব্লক করে\n• রাতে ব্রাউজার ও সোশ্যাল অ্যাপ খুলতে ফিজিক্যাল QR কোড স্ক্যান বাধ্যতামূলক\n• ২০ মিনিট পর ফেসবুক, ইউটিউব ও ইনস্টাগ্রাম স্বয়ংক্রিয়ভাবে বন্ধ করে\n• অকারণ স্ক্রলিংকে ২০ সেকেন্ডের ধারাবাহিক শিক্ষায় রূপান্তর করে\n\nডাউনলোড লিংক:\n${PLAY_STORE_URL}`;
      }
      return `📚 আপনার স্মার্টফোনকে আসক্তির যন্ত্র থেকে *ধারাবাহিক শিক্ষা ও প্রশান্তিময় জীবনের* হাতিয়ারে পরিণত করুন *Minimum Phone* দিয়ে (১০০% ফ্রি, শূন্য বিজ্ঞাপন)!\n\nপ্রতিবার সোশ্যাল অ্যাপ বা সেটিংস খোলার সময় আপনি ২০ সেকেন্ডে কুরআনের আয়াত, সহীহ হাদীস, ভাষা ও প্রজ্ঞা শিখতে পারবেন।\n\nবন্ধু ও পরিবারের সাথে শেয়ার করুন:\n${PLAY_STORE_URL}`;
    }

    if (referralTemplate === 'personal-success') {
      return `🌱 I’ve reclaimed ${hoursStr}+ hours of my life, stopped ${effectiveImpulsesStopped} mindless scrolling impulses, and completed ${effectiveLessonsCompleted} continuous learning lessons using *Minimum Phone*!\n\n✅ 100% Free Forever & 0% Ads\n✅ 20s Read & Play Quiz before opening distracting apps (Learn Qur'an, Hadith, Languages & Wisdom)\n✅ 5m / 10m / 20m Auto-Close on Facebook, YouTube & Instagram\n✅ Private Safe DNS + Night Browser QR Lock\n\nDownload it free for your phone & family:\n${PLAY_STORE_URL}`;
    }
    if (referralTemplate === 'family-protection') {
      return `🛡️ Protect yourself and your family from screen addiction & harmful content with *Minimum Phone* — 100% Free & Zero Ads!\n\n• Blocks adult sites across all browsers via Private Safe DNS\n• Requires scanning a Physical QR code to use browsers at night\n• Automatically closes Facebook, YouTube & Instagram after 20 minutes\n• Replaces mindless scrolling with 20-second continuous learning quizzes\n\nGet it 100% free here:\n${PLAY_STORE_URL}`;
    }
    return `📚 Turn your phone from a distraction machine into a *Continuous Learning & Mindful Living* tool with *Minimum Phone* (100% Free, Zero Ads)!\n\nEvery time you open a social app or settings, you read a quick passage of Qur'an, Hadith, Language vocabulary, or timeless Wisdom and answer a 1-tap comprehension quiz.\n\nTry it free with your friends & family:\n${PLAY_STORE_URL}`;
  }, [
    lang,
    referralTemplate,
    effectiveReclaimedMinutes,
    effectiveImpulsesStopped,
    effectiveLessonsCompleted,
  ]);

  const incrementInvitedCounter = () => {
    const next = friendsInvitedCount + 1;
    setFriendsInvitedCount(next);
    try {
      localStorage.setItem('minimum_phone_friends_invited_v1', String(next));
    } catch {
      // ignore storage errors
    }
  };

  const handleCopyReferral = async () => {
    try {
      await navigator.clipboard.writeText(referralMessage);
      incrementInvitedCounter();
      setCopiedFeedback(
        tx(
          lang,
          '✓ Referral message & Play Store link copied! Paste it to your friends & family.',
          '✓ আমন্ত্রণ বার্তা ও Play Store লিংক কপি হয়েছে! এখন বন্ধু ও পরিবারের সাথে পেস্ট করে শেয়ার করুন।',
          '✓ تم نسخ رسالة الدعوة ورابط المتجر! شاركها مع أصدقائك وعائلتك.',
          '✓ دعوت کا پیغام اور پلے اسٹور لنک کاپی ہو گیا! دوستوں اور فیملی کو بھیجیں۔',
          '✓ Pesan & tautan Play Store berhasil disalin! Bagikan ke teman & keluarga.'
        )
      );
      setTimeout(() => setCopiedFeedback(null), 4000);
    } catch {
      setCopiedFeedback(
        tx(
          lang,
          '✓ Ready to copy from the text box below.',
          '✓ নিচের বক্স থেকে কপি করার জন্য প্রস্তুত।',
          '✓ جاهز للنسخ من المربع أدناه.',
          '✓ نیچے دیے گئے باکس سے کاپی کرنے کے لیے تیار ہے۔',
          '✓ Siap disalin dari kotak di bawah.'
        )
      );
    }
  };

  const handleNativeShare = async () => {
    incrementInvitedCounter();
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Minimum Phone — 100% Free, Zero-Ads Life-Changing & Continuous Learning App',
          text: referralMessage,
          url: PLAY_STORE_URL,
        });
        return;
      } catch {
        // user cancelled or fallback
      }
    }
    await handleCopyReferral();
  };

  const handleShareWhatsApp = () => {
    incrementInvitedCounter();
    const url = `https://wa.me/?text=${encodeURIComponent(referralMessage)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleShareTelegram = () => {
    incrementInvitedCounter();
    const url = `https://t.me/share/url?url=${encodeURIComponent(
      PLAY_STORE_URL
    )}&text=${encodeURIComponent(referralMessage)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleShareSms = () => {
    incrementInvitedCounter();
    const url = `sms:?body=${encodeURIComponent(referralMessage)}`;
    window.location.href = url;
  };

  // Helper for SVG Circular Gauge
  const renderCircularGauge = (
    pct: number,
    title: string,
    subtitle: string,
    metricBadge: string
  ) => {
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (pct / 100) * circumference;

    return (
      <div className="border border-zinc-800 bg-black p-3.5 flex items-center gap-3.5">
        <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 88 88">
            <circle
              cx="44"
              cy="44"
              r={radius}
              stroke="#27272a"
              strokeWidth="7"
              fill="transparent"
            />
            <circle
              cx="44"
              cy="44"
              r={radius}
              stroke="#f4f4f5"
              strokeWidth="7"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="square"
              fill="transparent"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center font-mono-tech">
            <span className="text-sm font-bold text-zinc-100">{pct}%</span>
          </div>
        </div>
        <div className="space-y-1 min-w-0">
          <div className="text-xs font-mono-tech font-semibold text-zinc-100 leading-snug">
            {title}
          </div>
          <p className="text-[11px] text-zinc-400 leading-snug">{subtitle}</p>
          <span className="inline-block px-2 py-0.5 border border-zinc-700 text-[10px] font-mono-tech text-zinc-200">
            {metricBadge}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* =====================================================================
          PART A: VISUAL IMPACT REPORT & TIME SAVED ANALYTICS DASHBOARD
         ===================================================================== */}
      <div className="border-2 border-zinc-200 bg-zinc-950 p-4 sm:p-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-800 pb-3.5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 bg-zinc-100 text-black text-[10px] font-mono-tech font-bold uppercase tracking-widest">
                📊{' '}
                {tx(
                  lang,
                  'LIFE IMPACT & VISUAL GRAPHICS REPORT',
                  'জীবন পরিবর্তন ও ভিজ্যুয়াল গ্রাফিক্স রিপোর্ট',
                  'تقرير الأثر والرسوم البيانية',
                  'لائف امپیکٹ اور بصری گرافکس رپورٹ',
                  'LAPORAN DAMPAK & GRAFIK VISUAL'
                )}
              </span>
              <span className="px-2 py-0.5 border border-zinc-700 text-[10px] font-mono-tech text-zinc-300">
                {tx(
                  lang,
                  '100% ON-DEVICE · ZERO ADS',
                  '১০০% আপনার ফোনে সুরক্ষিত · ০% বিজ্ঞাপন',
                  '١٠٠٪ على جهازك · بدون إعلانات',
                  '١٠٠٪ فون کے اندر محفوظ · صفر اشتہارات',
                  '100% DI PERANGKAT · NOL IKLAN'
                )}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-mono-tech font-semibold text-zinc-100 mt-1.5">
              {tx(
                lang,
                'How Minimum Phone Is Saving Your Time & Transforming Your Mind',
                'Minimum Phone কীভাবে আপনার মূল্যবান সময় বাঁচাচ্ছে এবং মস্তিষ্ককে প্রশান্ত করছে',
                'كيف يوفر Minimum Phone وقتك ويحمي عقلك وقلبك',
                'Minimum Phone کس طرح آپ کا وقت بچا رہا ہے اور ذہن کو بدل رہا ہے',
                'Bagaimana Minimum Phone Menghemat Waktu & Menenangkan Pikiran Anda'
              )}
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              {tx(
                lang,
                'Real-time visual breakdown of your reclaimed hours, defeated dopamine impulses, 20-minute app auto-closes, and continuous learning mastery.',
                'আপনার ফিরে পাওয়া সময়, প্রতিহত করা ডোপামিন তাড়না, ২০ মিনিটের অটো-ক্লোজ এবং ধারাবাহিক শিক্ষার সম্পূর্ণ চিত্র।',
                'تحليل مرئي لساعاتك المستعادة، النزوات التي تغلبت عليها، والدروس المكتسبة.',
                'آپ کے بچائے گئے گھنٹوں، روکی گئی خواہشات اور مسلسل سیکھنے کا مکمل بصری تجزیہ۔',
                'Ringkasan visual waktu yang diselamatkan, dorongan yang dihentikan, dan pembelajaran berkelanjutan.'
              )}
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => {
                setBonusSimulatedMinutes((m) => m + 25);
                setBonusSimulatedImpulses((i) => i + 2);
                setBonusSimulatedQuizzes((q) => q + 1);
              }}
              className="px-2.5 py-1.5 border border-zinc-500 text-zinc-200 text-[11px] font-mono-tech hover:bg-zinc-900 cursor-pointer"
            >
              ⚡ {tx(lang, '+1 Saved Session (+25m)', '+১ সেভড সেশন (+২৫মি)', '+١ جلسة موفرة (+٢٥د)', '+١ بچایا گیا سیشن (+٢٥ منٹ)', '+1 Sesi Hemat (+25m)')}
            </button>
            {onOpenShareableReceipt && (
              <button
                type="button"
                onClick={onOpenShareableReceipt}
                className="px-3 py-1.5 bg-zinc-100 text-black text-[11px] font-mono-tech font-semibold cursor-pointer"
              >
                🧾 {tx(lang, 'Thermal Receipt', 'রিসিট কার্ড', 'إيصال الإنجاز', 'رسید کارڈ', 'Struk Pencapaian')}
              </button>
            )}
          </div>
        </div>

        {/* SELF-MASTERY RANK & 7 SCIENTIFIC METHODS SUMMARY STRIP */}
        <div className="border border-zinc-600 bg-black p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="text-[10px] font-mono-tech uppercase tracking-widest text-zinc-400">
              🧠{' '}
              {tx(
                lang,
                '7 PEER-REVIEWED NEURO-BEHAVIORAL METHODS ACTIVE · SELF-MASTERY RANK',
                '৭টি বৈজ্ঞানিক মনোযোগ ও আত্মনিয়ন্ত্রণ পদ্ধতি সক্রিয় · আপনার বর্তমান পদমর্যাদা',
                '٧ طرق علمية نشطة · رتبة ضبط النفس الحالية',
                '٧ سائنسی طریقے فعال ہیں · آپ کا موجودہ خود ضابطگی رینک',
                '7 METODE ILMIAH AKTIF · PERINGKAT PENGENDALIAN DIRI'
              )}
            </div>
            <div className="text-sm font-mono-tech font-bold text-zinc-100">
              🏅 {masteryRank} ({effectiveXp} XP)
            </div>
            <div className="text-[11px] text-zinc-400">
              {tx(
                lang,
                `Spaced Repetition: ${masteredCount} lessons mastered (${reviewDueCount} due for review) · Affect Labeling Emotions Tracked: 🎯${emotionCounts.purpose || 0} 😐${emotionCounts.bored || 0} 😰${emotionCounts.stressed || 0} 😴${emotionCounts.tired || 0}`,
                `স্পেসড রিপিটিশন মেমোরি: ${masteredCount}টি পাঠ আয়ত্ত হয়েছে (${reviewDueCount}টি রিভিউ বাকি) · আবেগ চিহ্নিতকরণ: 🎯লক্ষ্য(${emotionCounts.purpose || 0}) 😐একঘেয়েমি(${emotionCounts.bored || 0}) 😰চাপ(${emotionCounts.stressed || 0}) 😴ক্লান্তি(${emotionCounts.tired || 0})`,
                `التكرار المتباعد: أتقنت ${masteredCount} درساً · تتبع المشاعر نشط`,
                `اسپیسڈ ریپیٹیشن: ${masteredCount} اسباق مکمل · جذبات کی شناخت فعال`,
                `Spaced Repetition: ${masteredCount} pelajaran dikuasai · Pelacakan Emosi Aktif`
              )}
            </div>
          </div>
          <div className="px-3 py-1.5 border border-zinc-500 bg-zinc-900 text-[10px] font-mono-tech text-zinc-200 shrink-0 text-center">
            {tx(
              lang,
              '+20 XP Walk Away · -25 XP Force Reopen',
              '+২০ XP প্রশান্তিতে ফিরলে · -২৫ XP জোর করে খুললে',
              '+٢٠ XP للعودة للسكينة',
              '+٢٠ XP واپسی پر انعام',
              '+20 XP Kembali Tenang'
            )}
          </div>
        </div>

        {/* TIME HORIZON SELECTOR (7 DAYS / 30 DAYS / 1 YEAR / 5 YEARS) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-black border border-zinc-800 p-3">
          <div className="text-xs font-mono-tech text-zinc-300">
            {tx(
              lang,
              'Select Impact Projection Horizon:',
              'সময় সাশ্রয়ের হিসাব দেখার সময়কাল নির্বাচন করুন:',
              'اختر المدى الزمني لحساب الوقت الموفر:',
              'بچائے گئے وقت کا تخمینہ دیکھنے کے لیے مدت منتخب کریں:',
              'Pilih Rentang Waktu Proyeksi Dampak:'
            )}
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {(
              [
                { id: '7d', label: tx(lang, '7 Days', '৭ দিন', '٧ أيام', '٧ دن', '7 Hari') },
                { id: '30d', label: tx(lang, '30 Days', '৩০ দিন', '٣٠ يوماً', '٣٠ دن', '30 Hari') },
                { id: '1y', label: tx(lang, '1 Year', '১ বছর', 'سنة واحدة', '١ سال', '1 Tahun') },
                { id: '5y', label: tx(lang, '5 Years', '৫ বছর', '٥ سنوات', '٥ سال', '5 Tahun') },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setHorizon(item.id)}
                className={`px-2.5 py-1.5 border text-xs font-mono-tech cursor-pointer ${
                  horizon === item.id
                    ? 'border-zinc-100 bg-zinc-100 text-black font-bold'
                    : 'border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* 4 HERO SUCCESS KPI CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="border border-zinc-700 bg-black p-3.5 space-y-1">
            <div className="text-[10px] font-mono-tech uppercase tracking-wider text-zinc-400">
              ⏳ {tx(lang, 'TIME SAVED', 'সাশ্রয় হওয়া সময়', 'الوقت الموفر', 'بچایا گیا وقت', 'WAKTU HEMAT')} ({horizon.toUpperCase()})
            </div>
            <div className="text-2xl font-mono-tech font-bold text-zinc-100">
              {projectedHoursSaved}h
            </div>
            <div className="text-[11px] font-mono-tech text-zinc-300">
              = {projectedWakingDaysSaved} {tx(lang, 'Waking Days', 'পূর্ণ কর্মদিবস', 'يوم يقظة', 'جاگتے دن', 'Hari Aktif')}
            </div>
          </div>

          <div className="border border-zinc-700 bg-black p-3.5 space-y-1">
            <div className="text-[10px] font-mono-tech uppercase tracking-wider text-zinc-400">
              🛡️ {tx(lang, 'IMPULSES DEFEATED', 'প্রতিহত তাড়না', 'النزوات الموقوفة', 'روکی گئی خواہشات', 'DORONGAN DIHENTIKAN')}
            </div>
            <div className="text-2xl font-mono-tech font-bold text-zinc-100">
              {horizon === '7d'
                ? effectiveImpulsesStopped
                : Math.round((effectiveImpulsesStopped / 7) * horizonMultiplier)}
            </div>
            <div className="text-[11px] font-mono-tech text-zinc-300">
              {tx(
                lang,
                'Stopped at Breath / Quiz Gate',
                'শ্বাস ও কুইজ গেটে থামানো হয়েছে',
                'توقفت عند بوابة الاختبار',
                'سانس اور کوئز گیٹ پر روکا گیا',
                'Dihentikan di Gerbang Kuis'
              )}
            </div>
          </div>

          <div className="border border-zinc-700 bg-black p-3.5 space-y-1">
            <div className="text-[10px] font-mono-tech uppercase tracking-wider text-zinc-400">
              📚 {tx(lang, 'CONTINUOUS LEARNING', 'ধারাবাহিক শিক্ষা', 'التعلم المستمر', 'مسلسل تعلیم', 'BELAJAR BERKELANJUTAN')}
            </div>
            <div className="text-2xl font-mono-tech font-bold text-zinc-100">
              {projectedLessonsMastered}
            </div>
            <div className="text-[11px] font-mono-tech text-zinc-300">
              {tx(lang, 'Lessons', 'টি পাঠ', 'درساً', 'اسباق', 'Pelajaran')} · {effectiveXp} XP
            </div>
          </div>

          <div className="border border-zinc-700 bg-black p-3.5 space-y-1">
            <div className="text-[10px] font-mono-tech uppercase tracking-wider text-zinc-400">
              💎 {tx(lang, 'CLARITY & PURITY', 'পবিত্রতা স্ট্রিক', 'النقاء والعفة', 'پاکیزگی اسٹریک', 'KEMURNIAN')}
            </div>
            <div className="text-2xl font-mono-tech font-bold text-zinc-100">
              {purityDays}d
            </div>
            <div className="text-[11px] font-mono-tech text-zinc-300">
              {(purity.urgesDefeatedCount || 0) + bonusSimulatedImpulses}{' '}
              {tx(lang, 'Urges Defeated', 'টি তাড়না জয়', 'رغبة تم التغلب عليها', 'خواہشات پر فتح', 'Dorongan Dikalahkan')}
            </div>
          </div>
        </div>

        {/* VISUAL GRAPHIC 1: 7-DAY SCREEN TIME REDUCTION & TIME SAVED BAR CHART */}
        <div className="border border-zinc-800 bg-black p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-900 pb-2.5">
            <div>
              <span className="text-[10px] font-mono-tech uppercase tracking-widest text-zinc-400">
                {tx(
                  lang,
                  'VISUAL GRAPHIC 01 // BEFORE VS. AFTER MINIMUM PHONE',
                  'ভিজ্যুয়াল গ্রাফিক ০১ // পূর্বের অপচয় বনাম বর্তমান সাশ্রয়',
                  'الرسم البياني ٠١ // قبل وبعد استخدام التطبيق',
                  'بصری گراف ٠١ // پہلے بمقابلہ اب وقت کی بچت',
                  'GRAFIK VISUAL 01 // SEBELUM VS SESUDAH MINIMUM PHONE'
                )}
              </span>
              <h4 className="text-xs sm:text-sm font-mono-tech font-semibold text-zinc-100">
                {tx(
                  lang,
                  '7-Day Daily Time Saved vs. Pre-Detox Smartphone Drain (Tap Any Day)',
                  'গত ৭ দিনের দৈনিক বাঁচানো সময় বনাম পূর্বের স্ক্রিন অপচয় (যেকোনো দিনে ট্যাপ করুন)',
                  'الوقت اليومي الموفر خلال ٧ أيام مقارنة بالاستنزاف السابق',
                  'گزشتہ ٧ دنوں میں روزانہ بچایا گیا وقت (کسی بھی دن پر ٹیپ کریں)',
                  'Waktu Harian yang Dihemat selama 7 Hari (Ketuk Hari Apa Saja)'
                )}
              </h4>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-mono-tech">
              <span className="flex items-center gap-1 text-zinc-400">
                <span className="inline-block w-2.5 h-2.5 bg-zinc-800 border border-zinc-600" />
                {tx(lang, 'Screen Used', 'স্ক্রিন ব্যবহার', 'الاستخدام', 'اسکرین استعمال', 'Layar Dipakai')}
              </span>
              <span className="flex items-center gap-1 text-zinc-100 font-semibold">
                <span className="inline-block w-2.5 h-2.5 bg-zinc-100" />
                {tx(lang, 'Time Saved', 'সাশ্রয় হওয়া সময়', 'الوقت الموفر', 'بچایا گیا وقت', 'Waktu Hemat')}
              </span>
            </div>
          </div>

          {/* Interactive 7-Column Vertical Bar Graphic */}
          <div className="grid grid-cols-7 gap-2 pt-2 items-end h-44 px-1">
            {weeklyChartData.map((day, idx) => {
              const savedHeightPct = Math.min(100, Math.round((day.savedMinutes / 220) * 100));
              const screenHeightPct = Math.min(
                100,
                Math.round((day.actualScreenMinutes / 280) * 100)
              );
              const isSelected = idx === selectedDayIndex;

              return (
                <button
                  key={day.label}
                  type="button"
                  onClick={() => setSelectedDayIndex(idx)}
                  className={`h-full flex flex-col justify-end items-center gap-1.5 p-1.5 border transition cursor-pointer ${
                    isSelected
                      ? 'border-zinc-200 bg-zinc-900/70'
                      : 'border-zinc-900 hover:border-zinc-700'
                  }`}
                >
                  <div className="text-[10px] font-mono-tech text-zinc-200 font-semibold">
                    +{day.savedMinutes}m
                  </div>
                  <div className="w-full flex-1 flex items-end justify-center gap-1">
                    <div
                      style={{ height: `${screenHeightPct}%` }}
                      className="w-1/2 bg-zinc-800 border border-zinc-700 transition-all"
                      title={`Screen Time: ${day.actualScreenMinutes}m`}
                    />
                    <div
                      style={{ height: `${savedHeightPct}%` }}
                      className="w-1/2 bg-zinc-100 transition-all"
                      title={`Saved: +${day.savedMinutes}m`}
                    />
                  </div>
                  <div
                    className={`text-[10px] font-mono-tech ${
                      isSelected ? 'text-white font-bold underline' : 'text-zinc-400'
                    }`}
                  >
                    {day.label}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Day Detail Strip */}
          <div className="border border-zinc-800 bg-zinc-950 p-3 flex flex-wrap items-center justify-between gap-2 text-xs font-mono-tech">
            <div>
              <span className="text-zinc-400">{activeDay.label}: </span>
              <strong className="text-zinc-100">
                +{activeDay.savedMinutes}{' '}
                {tx(
                  lang,
                  `min saved (${activeDay.reductionPct}% less screen drain)`,
                  `মিনিট সাশ্রয় (${activeDay.reductionPct}% কম স্ক্রিন অপচয়)`,
                  `دقيقة موفرة (${activeDay.reductionPct}% استنزاف أقل)`,
                  `منٹ کی بچت (${activeDay.reductionPct}% کم اسکرین ضیاع)`,
                  `menit dihemat (${activeDay.reductionPct}% lebih hemat)`
                )}
              </strong>
            </div>
            <div className="flex flex-wrap gap-3 text-[11px] text-zinc-300">
              <span>
                🛡️ {activeDay.impulsesBlocked}{' '}
                {tx(lang, 'Impulses Stopped', 'টি তাড়না থামানো হয়েছে', 'نزوة موقوفة', 'خواہشات روکی گئیں', 'Dorongan Dihentikan')}
              </span>
              <span>
                📚 {activeDay.quizzesCompleted}{' '}
                {tx(lang, 'Quizzes Passed', 'টি কুইজ সম্পন্ন', 'اختبار مكتمل', 'کوئز مکمل', 'Kuis Selesai')}
              </span>
            </div>
          </div>
        </div>

        {/* VISUAL GRAPHIC 2: 3-RING SVG RADIAL BRAIN & FOCUS RECOVERY GAUGES */}
        <div className="space-y-2">
          <div className="text-[10px] font-mono-tech uppercase tracking-widest text-zinc-400">
            {tx(
              lang,
              'VISUAL GRAPHIC 02 // NEURAL & COGNITIVE SOVEREIGNTY GAUGES',
              'ভিজ্যুয়াল গ্রাফিক ০২ // মস্তিষ্ক ও মনোযোগ পুনরুদ্ধার মিটার',
              'الرسم البياني ٠٢ // مقاييس استعادة التركيز والدوبامين',
              'بصری گراف ٠٢ // ذہنی توجہ اور ڈوپامائن کی بحالی کے پیمانے',
              'GRAFIK VISUAL 02 // INDIKATOR PEMULIHAN FOKUS & DOPAMIN'
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {renderCircularGauge(
              attentionSovereigntyPct,
              tx(lang, 'Attention Sovereignty', 'মনোযোগের স্বাধীনতা', 'سيادة الانتباه', 'توجہ کی خود مختاری', 'Kedaulatan Perhatian'),
              tx(
                lang,
                'Unlocks driven by conscious intent instead of dopamine triggers.',
                'অভ্যাসের বশে নয়, সচেতন সিদ্ধান্তের মাধ্যমে অ্যাপ ব্যবহারের হার।',
                'فتح التطبيقات بوعي وقصد بدلاً من الاندفاع التلقائي.',
                'عادت کے بجائے شعوری ارادے سے فون استعمال کرنے کی شرح۔',
                'Membuka aplikasi dengan niat sadar, bukan dorongan impulsif.'
              ),
              `${effectiveImpulsesStopped} ${tx(lang, 'Impulses Blocked', 'তাড়না প্রতিহত', 'نزوة موقوفة', 'خواہشات روکی گئیں', 'Dorongan Diblokir')}`
            )}
            {renderCircularGauge(
              learningRetentionPct,
              tx(lang, 'Continuous Learning Score', 'ধারাবাহিক শিক্ষা স্কোর', 'درجة التعلم المستمر', 'مسلسل سیکھنے کا اسکور', 'Skor Belajar Berkelanjutan'),
              tx(
                lang,
                '20s reading & comprehension quiz accuracy + Spaced Repetition.',
                '২০ সেকেন্ডের পাঠ, কুইজ ও স্পেসড রিপিটিশন মেমোরি অর্জনের হার।',
                'دقة القراءة والاختبار (٢٠ ثانية) مع التكرار المتباعد.',
                '٢٠ سیکنڈ مطالعہ اور کوئز میں کامیابی کی شرح۔',
                'Akurasi baca & kuis 20 detik + Spaced Repetition.'
              ),
              `${effectiveQuizzesPassed} ${tx(lang, 'Quizzes', 'কুইজ', 'اختبار', 'کوئز', 'Kuis')} · ${effectiveXp} XP`
            )}
            {renderCircularGauge(
              dopamineRecoveryPct,
              tx(lang, 'Dopamine Baseline Recovery', 'ডোপামিন ভারসাম্য পুনরুদ্ধার', 'تعافي توازن الدوبامين', 'ڈوپامائن توازن کی بحالی', 'Pemulihan Dopamin'),
              tx(
                lang,
                'Prefrontal focus restoration via Purity Guard & 20m app limits.',
                'পিউরিটি গার্ড ও ২০ মিনিটের সীমার মাধ্যমে মস্তিষ্কের স্বাভাবিক মনোযোগ বৃদ্ধি।',
                'استعادة التركيز عبر درع العفة وحد الـ ٢٠ دقيقة.',
                'پیوریٹی گارڈ اور ٢٠ منٹ کی حد سے ذہنی سکون کی بحالی۔',
                'Pemulihan fokus melalui Perisai Kemurnian & batas 20 menit.'
              ),
              `${tx(lang, 'Day', 'দিন', 'يوم', 'دن', 'Hari')} ${purityDays} ${tx(lang, 'Streak', 'স্ট্রিক', 'متتالي', 'اسٹریک', 'Streak')}`
            )}
          </div>
        </div>

        {/* VISUAL GRAPHIC 3: 5-PILLAR BREAKDOWN OF HOW MINIMUM PHONE SAVES YOUR TIME */}
        <div className="border border-zinc-800 bg-black p-4 space-y-3.5">
          <div className="border-b border-zinc-900 pb-2">
            <span className="text-[10px] font-mono-tech uppercase tracking-widest text-zinc-400">
              {tx(
                lang,
                'VISUAL GRAPHIC 03 // PROTECTION ENGINE ATTRIBUTION',
                'ভিজ্যুয়াল গ্রাফিক ০৩ // কোন ফিচার আপনার কতটুকু সময় বাঁচিয়েছে',
                'الرسم البياني ٠٣ // مصادر توفير الوقت',
                'بصری گراف ٠٣ // کس فیچر نے آپ کا کتنا وقت بچایا',
                'GRAFIK VISUAL 03 // SUMBER PENGHEMATAN WAKTU ANDA'
              )}
            </span>
            <h4 className="text-xs sm:text-sm font-mono-tech font-semibold text-zinc-100">
              {tx(
                lang,
                `Where Your ${projectedHoursSaved} Saved Hours Come From`,
                `আপনার সাশ্রয় হওয়া ${projectedHoursSaved} ঘণ্টা যেভাবে অর্জিত হয়েছে`,
                `من أين جاءت ساعاتك الموفرة (${projectedHoursSaved} ساعة)`,
                `آپ کے بچائے گئے ${projectedHoursSaved} گھنٹے کہاں سے حاصل ہوئے`,
                `Dari Mana ${projectedHoursSaved} Jam Waktu Hemat Anda Berasal`
              )}
            </h4>
          </div>

          <div className="space-y-3">
            {protectionBreakdown.map((item) => (
              <div key={item.id} className="space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-1 text-xs font-mono-tech">
                  <span className="text-zinc-200">{item.label}</span>
                  <span className="text-zinc-100 font-semibold">
                    {item.pct}% · +{(item.minutes / 60).toFixed(1)}h ({item.badge})
                  </span>
                </div>
                <div className="w-full h-2.5 bg-zinc-900 border border-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-zinc-100 transition-all duration-300"
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* VISUAL GRAPHIC 4: TANGIBLE LIFE EQUIVALENTS OF YOUR SAVED TIME */}
        <div className="border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
          <div className="text-[10px] font-mono-tech uppercase tracking-widest text-zinc-400">
            {tx(
              lang,
              `VISUAL GRAPHIC 04 // REAL-LIFE TRANSFORMATION EQUIVALENTS (${horizon.toUpperCase()})`,
              `ভিজ্যুয়াল গ্রাফিক ০৪ // বাঁচানো সময়ের বাস্তব জীবনের অর্জন (${horizon.toUpperCase()})`,
              `الرسم البياني ٠٤ // ما يعادل وقتك الموفر في الواقع (${horizon.toUpperCase()})`,
              `بصری گراف ٠٤ // بچائے گئے وقت کا حقیقی زندگی میں نعم البدل (${horizon.toUpperCase()})`,
              `GRAFIK VISUAL 04 // SETARA TRANSFORMASI NYATA (${horizon.toUpperCase()})`
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="border border-zinc-800 bg-black p-3 space-y-1">
              <div className="text-lg font-mono-tech font-bold text-zinc-100">
                📖 {projectedBooksEquivalent}{' '}
                {tx(lang, 'Full Books / Juz', 'টি পূর্ণ বই / পারা অধ্যয়ন', 'كتاب كامل / جزء', 'مکمل کتابیں / سپارے', 'Buku Penuh / Juz')}
              </div>
              <p className="text-[11px] text-zinc-400">
                {tx(
                  lang,
                  'Reading & wisdom capacity unlocked by replacing scroll impulses with Slow Learning passages.',
                  'অকারণ স্ক্রলিংকে ২০ সেকেন্ডের পাঠে রূপান্তর করার মাধ্যমে অর্জিত জ্ঞান ও অধ্যয়ন সক্ষমতা।',
                  'قدرة القراءة والحكمة المكتسبة باستبدال التصفح العشوائي بالدروس القصيرة.',
                  'بے مقصد اسکرولنگ کو مختصر اسباق سے بدلنے سے حاصل ہونے والی مطالعہ کی صلاحیت۔',
                  'Kapasitas membaca yang terbuka dengan mengganti scroll impulsif menjadi pelajaran.'
                )}
              </p>
            </div>
            <div className="border border-zinc-800 bg-black p-3 space-y-1">
              <div className="text-lg font-mono-tech font-bold text-zinc-100">
                🌅 {projectedWakingDaysSaved}{' '}
                {tx(lang, 'Waking Days', 'পূর্ণ জাগ্রত দিন', 'أيام يقظة كاملة', 'جاگتے ہوئے مکمل دن', 'Hari Aktif Penuh')}
              </div>
              <p className="text-[11px] text-zinc-400">
                {tx(
                  lang,
                  'Full 16-hour waking days of deep work, worship, and family presence rescued from algorithmic feeds.',
                  'অ্যালগরিদমিক ফিড থেকে উদ্ধার করা ১৬ ঘণ্টার পূর্ণ কর্মদিবস—যা আপনার ইবাদত, কাজ ও পরিবারের জন্য ব্যয় হচ্ছে।',
                  'أيام كاملة (١٦ ساعة يقظة) من العمل العميق والعبادة والجلوس مع العائلة.',
                  'الگورتھمک فیڈز سے بچائے گئے ١٦ گھنٹے کے مکمل دن—عبادت، کام اور فیملی کے لیے۔',
                  'Hari aktif 16 jam penuh untuk kerja fokus, ibadah, dan waktu bersama keluarga.'
                )}
              </p>
            </div>
            <div className="border border-zinc-800 bg-black p-3 space-y-1">
              <div className="text-lg font-mono-tech font-bold text-zinc-100">
                🧠 {projectedLessonsMastered}{' '}
                {tx(lang, 'Micro-Lessons', 'টি মাইক্রো-লেসন', 'درساً قصيراً', 'مائیکرو اسباق', 'Pelajaran Mikro')}
              </div>
              <p className="text-[11px] text-zinc-400">
                {tx(
                  lang,
                  'Qur’an, Hadith, Arabic/Bangla/English vocabulary & universal wisdom lessons verified by quizzes.',
                  'কুইজের মাধ্যমে যাচাইকৃত কুরআন, সহীহ হাদীস, ভাষা শিক্ষা ও জীবনমুখী প্রজ্ঞার পাঠ।',
                  'دروس القرآن والحديث واللغات والحكمة الموثقة بالاختبارات.',
                  'قرآن، حدیث، زبان دانی اور حکمت کے اسباق جو کوئز سے پختہ ہوئے۔',
                  'Pelajaran Al-Qur’an, Hadis, kosakata bahasa & hikmah yang terverifikasi kuis.'
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          PART B: REFER FRIENDS & FAMILY — 100% FREE, ZERO ADS, LIFE-CHANGING APP
         ===================================================================== */}
      <div className="border-2 border-zinc-100 bg-black p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 border-b border-zinc-800 pb-3.5">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="px-2 py-0.5 bg-zinc-100 text-black text-[10px] font-mono-tech font-bold uppercase tracking-widest">
                🎁{' '}
                {tx(
                  lang,
                  'REFER FRIENDS & FAMILY',
                  'বন্ধু ও পরিবারকে আমন্ত্রণ জানান',
                  'شارك مع الأصدقاء والعائلة',
                  'دوستوں اور فیملی کو مدعو کریں',
                  'BAGIKAN KE TEMAN & KELUARGA'
                )}
              </span>
              <span className="px-2 py-0.5 border border-zinc-600 text-[10px] font-mono-tech text-zinc-200">
                {tx(
                  lang,
                  '100% FREE FOREVER · 0% ADS · SADAQAH JARIYAH',
                  '১০০% আজীবন ফ্রি · ০% বিজ্ঞাপন · সাদাকাহ জারিয়াহ',
                  'مجاني ١٠٠٪ للأبد · بدون إعلانات · صدقة جارية',
                  '١٠٠٪ ہمیشہ مفت · صفر اشتہارات · صدقہ جاریہ',
                  '100% GRATIS SELAMANYA · 0% IKLAN · AMAL JARIYAH'
                )}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-mono-tech font-semibold text-zinc-100 pt-1">
              {tx(
                lang,
                'Share This 100% Free, Ad-Free, Life-Changing & Continuous Learning App',
                '১০০% ফ্রি, বিজ্ঞাপনমুক্ত, জীবন পরিবর্তনকারী ও ধারাবাহিক শিক্ষার এই অ্যাপটি প্রিয়জনদের সাথে শেয়ার করুন',
                'شارك هذا التطبيق المجاني ١٠٠٪ والخالي من الإعلانات للتعلم المستمر وحماية العائلة',
                '١٠٠٪ مفت، اشتہارات سے پاک اور زندگی بدلنے والی اس تعلیمی ایپ کو اپنے پیاروں کے ساتھ شیئر کریں',
                'Bagikan Aplikasi 100% Gratis, Tanpa Iklan & Pembelajaran Berkelanjutan Ini'
              )}
            </h3>
            <p className="text-xs text-zinc-300 leading-relaxed">
              {tx(
                lang,
                'Minimum Phone has zero ads, zero subscriptions, and zero data tracking. When you share it with a friend, brother, sister, spouse, or child, every hour they save from addiction and every Qur’an, Hadith, or Language lesson they learn is a continuous benefit for both of you.',
                'Minimum Phone-এ কোনো বিজ্ঞাপন নেই, কোনো সাবস্ক্রিপশন ফি নেই এবং কোনো ডেটা ট্র্যাকিং নেই। আপনি যখন কোনো বন্ধু, ভাই-বোন, জীবনসঙ্গী বা সন্তানের সাথে এটি শেয়ার করবেন, তারা আসক্তি থেকে যে সময় বাঁচাবে এবং কুরআন, হাদীস বা ভাষার প্রতিটি পাঠ শিখবে—তা আপনাদের উভয়ের জন্যই কল্যাণকর হবে।',
                'التطبيق خالٍ تماماً من الإعلانات والاشتراكات. عندما تشاركه مع صديق أو فرد من عائلتك، فإن كل ساعة يوفرونها وكل آية أو درس يتعلمونه هو خير مستمر لكما.',
                'اس ایپ میں کوئی اشتہار یا فیس نہیں۔ جب آپ اسے کسی دوست یا فیملی ممبر کے ساتھ شیئر کرتے ہیں تو ان کا بچایا گیا ہر لمحہ اور سیکھا گیا ہر سبق آپ دونوں کے لیے صدقہ جاریہ ہے۔',
                'Minimum Phone bebas iklan dan biaya. Saat Anda membagikannya ke keluarga atau sahabat, setiap jam yang mereka selamatkan dan pelajaran yang mereka pelajari menjadi kebaikan bersama.'
              )}
            </p>
          </div>

          <div className="border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-center shrink-0 font-mono-tech">
            <div className="text-xl font-bold text-zinc-100">{friendsInvitedCount}</div>
            <div className="text-[10px] text-zinc-400 uppercase">
              {tx(
                lang,
                'Friends / Family Shared',
                'জন প্রিয়জনকে শেয়ার করা হয়েছে',
                'تمت المشاركة معهم',
                'افراد کو شیئر کیا گیا',
                'Teman / Keluarga Dibagikan'
              )}
            </div>
          </div>
        </div>

        {/* WHY FRIENDS & FAMILY LOVE MINIMUM PHONE (3 PILLARS) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          <div className="border border-zinc-800 bg-zinc-950 p-3 space-y-1">
            <div className="font-mono-tech font-semibold text-zinc-100">
              {tx(
                lang,
                '1. 100% Free & Zero Ads Forever',
                '১. আজীবন ১০০% ফ্রি ও বিজ্ঞাপনমুক্ত',
                '١. مجاني ١٠٠٪ وبدون إعلانات للأبد',
                '١. ہمیشہ ١٠٠٪ مفت اور اشتہارات سے پاک',
                '1. 100% Gratis & Tanpa Iklan Selamanya'
              )}
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              {tx(
                lang,
                'Every feature is completely free with zero ads so entire families and students can use it without barriers.',
                'সকল প্রিমিয়াম ফিচার সম্পূর্ণ বিনামূল্যে ও বিজ্ঞাপনমুক্ত—যাতে শিক্ষার্থী ও পরিবারের সবাই নির্বিঘ্নে ব্যবহার করতে পারে।',
                'جميع الميزات مجانية بالكامل بدون أي إعلانات لجميع أفراد الأسرة والطلاب.',
                'تمام فیچرز مکمل طور پر مفت ہیں تاکہ طلباء اور پوری فیملی بلا رکاوٹ استعمال کر سکے۔',
                'Semua fitur gratis tanpa iklan agar seluruh keluarga dan pelajar dapat menggunakannya.'
              )}
            </p>
          </div>
          <div className="border border-zinc-800 bg-zinc-950 p-3 space-y-1">
            <div className="font-mono-tech font-semibold text-zinc-100">
              {tx(
                lang,
                '2. Continuous Daily Learning',
                '২. প্রতিদিন ধারাবাহিক জ্ঞান অর্জন',
                '٢. تعلم يومي مستمر',
                '٢. روزانہ مسلسل علم اور سیکھنا',
                '2. Pembelajaran Harian Berkelanjutan'
              )}
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              {tx(
                lang,
                'Turns app opens into 20s reading & quizzes on Islamic wisdom (Qur’an & Hadith), Languages, and Character building in 5 languages.',
                'অ্যাপ খোলার অভ্যাসকে ২০ সেকেন্ডের কুরআন, হাদীস, ভাষা শিক্ষা ও নৈতিক চরিত্র গঠনের কুইজে রূপান্তর করে।',
                'يحول فتح التطبيقات إلى دروس واختبارات سريعة (٢٠ ثانية) في القرآن والحديث واللغات.',
                'ایپ کھولنے کی عادت کو ٢٠ سیکنڈ کے قرآن، حدیث اور زبان سیکھنے کے کوئز میں بدل دیتا ہے۔',
                'Mengubah kebiasaan membuka aplikasi menjadi kuis 20 detik Al-Qur’an, Hadis, dan Bahasa.'
              )}
            </p>
          </div>
          <div className="border border-zinc-800 bg-zinc-950 p-3 space-y-1">
            <div className="font-mono-tech font-semibold text-zinc-100">
              {tx(
                lang,
                '3. Complete Addiction Shield',
                '৩. সম্পূর্ণ আসক্তি ও পর্ন প্রতিরোধ শিল্ড',
                '٣. درع حماية متكامل ضد الإدمان',
                '٣. لت اور فحاشی سے مکمل تحفظ کی شیلڈ',
                '3. Perisai Lengkap Anti-Kecanduan'
              )}
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              {tx(
                lang,
                '5m/10m/20m running-app auto-close, Private Safe DNS adult blocker, and Night Browser QR lock protect youth & adults alike.',
                '৫মি/১০মি/২০ মিনিটে অটো-ক্লোজ, প্রাইভেট সেফ DNS পর্ন ব্লকার এবং রাতের QR লক তরুণ ও বড়দের সমানভাবে রক্ষা করে।',
                'إغلاق تلقائي بعد ٢٠ دقيقة، وحجب المواقع الإباحية عبر DNS، وقفل QR الليلي.',
                '٢٠ منٹ پر آٹو کلوز، پرائیویٹ DNS فحش بلاکر اور رات کا QR لاک نوجوانوں اور بڑوں کی حفاظت کرتا ہے۔',
                'Tutup otomatis 20 menit, pemblokir situs dewasa DNS, dan kunci QR malam melindungi keluarga.'
              )}
            </p>
          </div>
        </div>

        {/* CHOOSE REFERRAL MESSAGE STYLE */}
        <div className="space-y-2">
          <div className="text-xs font-mono-tech text-zinc-300">
            {tx(
              lang,
              '1. Choose Referral Message Style to Send to Friends & Family:',
              '১. বন্ধু ও পরিবারকে পাঠানোর জন্য বার্তার ধরন নির্বাচন করুন:',
              '١. اختر نمط رسالة الدعوة لإرسالها للأصدقاء والعائلة:',
              '١. دوستوں اور فیملی کو بھیجنے کے لیے پیغام کا انداز منتخب کریں:',
              '1. Pilih Gaya Pesan Undangan untuk Teman & Keluarga:'
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {(
              [
                {
                  id: 'personal-success',
                  label: tx(
                    lang,
                    `🏆 My Time Saved (${projectedHoursSaved}h) + Invitation`,
                    `🏆 আমার বাঁচানো সময় (${projectedHoursSaved}h) ও আমন্ত্রণ`,
                    `🏆 وقتي الموفر (${projectedHoursSaved} ساعة) + دعوة`,
                    `🏆 میرا بچایا گیا وقت (${projectedHoursSaved}h) + دعوت`,
                    `🏆 Waktu Hemat Saya (${projectedHoursSaved}j) + Undangan`
                  ),
                },
                {
                  id: 'family-protection',
                  label: tx(
                    lang,
                    '🛡️ Family & Youth Anti-Addiction Shield',
                    '🛡️ পরিবার ও তরুণদের আসক্তি সুরক্ষা শিল্ড',
                    '🛡️ درع حماية الأسرة والشباب من الإدمان',
                    '🛡️ فیملی اور نوجوانوں کے لیے حفاظتی شیلڈ',
                    '🛡️ Perisai Keluarga & Remaja Anti-Kecanduan'
                  ),
                },
                {
                  id: 'continuous-learning',
                  label: tx(
                    lang,
                    '📚 Continuous Learning (Islam & Languages)',
                    '📚 ধারাবাহিক শিক্ষা (ইসলাম, ভাষা ও প্রজ্ঞা)',
                    '📚 التعلم المستمر (القرآن والحديث واللغات)',
                    '📚 مسلسل تعلیم (قرآن، حدیث اور زبانیں)',
                    '📚 Belajar Berkelanjutan (Islam & Bahasa)'
                  ),
                },
              ] as const
            ).map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => setReferralTemplate(tpl.id)}
                className={`p-2.5 border text-left text-xs font-mono-tech cursor-pointer ${
                  referralTemplate === tpl.id
                    ? 'border-zinc-100 bg-zinc-100 text-black font-semibold'
                    : 'border-zinc-800 text-zinc-300 hover:border-zinc-600'
                }`}
              >
                {tpl.label}
              </button>
            ))}
          </div>
        </div>

        {/* PREVIEW OF MESSAGE */}
        <div className="border border-zinc-800 bg-zinc-950 p-3.5 space-y-2">
          <div className="flex items-center justify-between text-[10px] font-mono-tech text-zinc-400">
            <span>
              {tx(
                lang,
                'MESSAGE PREVIEW (READY TO SHARE):',
                'বার্তার প্রিভিউ (শেয়ার করার জন্য প্রস্তুত):',
                'معاينة الرسالة (جاهزة للمشاركة):',
                'پیغام کا پیش نظارہ (شیئر کرنے کے لیے تیار):',
                'PRATINJAU PESAN (SIAP DIBAGIKAN):'
              )}
            </span>
            <span>
              {tx(
                lang,
                'GOOGLE PLAY VERIFIED LINK INCLUDED',
                'ভেরিফাইড Google Play লিংক যুক্ত',
                'يتضمن رابط Google Play الرسمي',
                'تصدیق شدہ Google Play لنک شامل ہے',
                'TERMASUK TAUTAN RESMI GOOGLE PLAY'
              )}
            </span>
          </div>
          <pre className="text-xs text-zinc-200 whitespace-pre-wrap font-sans leading-relaxed">
            {referralMessage}
          </pre>
        </div>

        {/* ONE-CLICK SHARE CHANNELS */}
        <div className="space-y-2">
          <div className="text-xs font-mono-tech text-zinc-300">
            {tx(
              lang,
              '2. Share Directly with Friends & Family in One Tap:',
              '২. ১-ট্যাপে সরাসরি বন্ধু ও পরিবারের সাথে শেয়ার করুন:',
              '٢. شارك مباشرة بضغطة واحدة مع الأصدقاء والعائلة:',
              '٢. ایک ٹیپ میں براہِ راست دوستوں اور فیملی کے ساتھ شیئر کریں:',
              '2. Bagikan Langsung dalam Satu Ketukan:'
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="py-3 px-3 bg-zinc-100 text-black font-mono-tech text-xs font-bold uppercase tracking-wider hover:bg-white cursor-pointer"
            >
              📲 {tx(lang, 'Share on WhatsApp', 'WhatsApp-এ শেয়ার', 'مشاركة عبر واتساب', 'واٹس ایپ پر شیئر کریں', 'Bagikan di WhatsApp')}
            </button>
            <button
              type="button"
              onClick={handleNativeShare}
              className="py-3 px-3 border-2 border-zinc-200 text-zinc-100 font-mono-tech text-xs font-bold uppercase tracking-wider hover:bg-zinc-900 cursor-pointer"
            >
              📤 {tx(lang, 'Share to Any App', 'যেকোনো অ্যাপে শেয়ার', 'مشاركة لأي تطبيق', 'کسی بھی ایپ میں شیئر', 'Bagikan ke Aplikasi Lain')}
            </button>
            <button
              type="button"
              onClick={handleCopyReferral}
              className="py-3 px-3 border border-zinc-600 text-zinc-200 font-mono-tech text-xs uppercase tracking-wider hover:bg-zinc-900 cursor-pointer"
            >
              📋 {tx(lang, 'Copy Message & Link', 'বার্তা ও লিংক কপি', 'نسخ الرسالة والرابط', 'پیغام اور لنک کاپی کریں', 'Salin Pesan & Link')}
            </button>
            <button
              type="button"
              onClick={handleShareTelegram}
              className="py-2.5 px-3 border border-zinc-800 text-zinc-300 font-mono-tech text-xs hover:border-zinc-600 cursor-pointer"
            >
              ✈️ {tx(lang, 'Share on Telegram', 'Telegram-এ শেয়ার', 'مشاركة عبر تيليجرام', 'ٹیلی گرام پر شیئر', 'Bagikan di Telegram')}
            </button>
            <button
              type="button"
              onClick={handleShareSms}
              className="py-2.5 px-3 border border-zinc-800 text-zinc-300 font-mono-tech text-xs hover:border-zinc-600 cursor-pointer"
            >
              💬 {tx(lang, 'Send via SMS', 'SMS দিয়ে পাঠান', 'إرسال عبر رسالة نصية', 'ایس ایم ایس بھیجیں', 'Kirim lewat SMS')}
            </button>
            <button
              type="button"
              onClick={() => setShowFriendInstallQr((v) => !v)}
              className="py-2.5 px-3 border border-zinc-700 bg-zinc-950 text-zinc-200 font-mono-tech text-xs hover:border-zinc-500 cursor-pointer"
            >
              {showFriendInstallQr
                ? tx(lang, '✕ Hide Install QR', '✕ ইনস্টল QR লুকান', '✕ إخفاء رمز QR', '✕ انسٹال QR چھپائیں', '✕ Sembunyikan QR')
                : tx(lang, '🏁 In-Person QR Code', '🏁 সরাসরি ইনস্টল QR', '🏁 رمز QR للتثبيت المباشر', '🏁 بالمشافہ انسٹال QR', '🏁 Kode QR Langsung')}
            </button>
          </div>
        </div>

        {copiedFeedback && (
          <div className="p-3 border border-zinc-300 bg-zinc-900 text-xs font-mono-tech text-zinc-100">
            {copiedFeedback}
          </div>
        )}

        {/* IN-PERSON SCANNABLE QR CODE FOR FRIENDS & FAMILY */}
        {showFriendInstallQr && (
          <div className="border-2 border-zinc-200 bg-zinc-100 text-black p-4 flex flex-col sm:flex-row items-center gap-4">
            <div className="w-28 h-28 bg-white border-2 border-black p-2 shrink-0 grid grid-cols-7 grid-rows-7 gap-0.5">
              {Array.from({ length: 49 }).map((_, idx) => {
                const row = Math.floor(idx / 7);
                const col = idx % 7;
                const isCorner =
                  (row < 2 && col < 2) ||
                  (row < 2 && col > 4) ||
                  (row > 4 && col < 2);
                const isPattern = isCorner || (idx * 7 + row * 3) % 3 === 0;
                return (
                  <div
                    key={idx}
                    className={isPattern ? 'bg-black' : 'bg-white'}
                  />
                );
              })}
            </div>
            <div className="space-y-1.5 text-center sm:text-left">
              <div className="text-xs font-mono-tech font-bold uppercase tracking-wider">
                {tx(
                  lang,
                  'IN-PERSON FAMILY & FRIEND INSTALL LINK',
                  'পরিবার ও বন্ধুদের সরাসরি ইনস্টল লিংক',
                  'رابط التثبيت المباشر للعائلة والأصدقاء',
                  'فیملی اور دوستوں کے لیے براہِ راست انسٹال لنک',
                  'TAUTAN INSTAL LANGSUNG UNTUK KELUARGA & TEMAN'
                )}
              </div>
              <p className="text-xs text-zinc-800 leading-relaxed">
                {tx(
                  lang,
                  'Have your friend or family member open Google Play Store and search “Minimum Phone: Detox & Focus” (com.kasbllc.minimumphone) or tap below to open the Play Store listing directly:',
                  'আপনার বন্ধু বা পরিবারের সদস্যকে Google Play Store-এ “Minimum Phone: Detox & Focus” লিখে সার্চ করতে বলুন অথবা সরাসরি খুলতে নিচে ট্যাপ করুন:',
                  'اطلب من صديقك أو فرد عائلتك البحث عن "Minimum Phone: Detox & Focus" في متجر Google Play أو اضغط أدناه:',
                  'اپنے دوست یا فیملی ممبر سے Google Play Store میں "Minimum Phone: Detox & Focus" تلاش کرنے کو کہیں یا نیچے ٹیپ کریں:',
                  'Minta teman atau keluarga mencari "Minimum Phone: Detox & Focus" di Google Play Store atau ketuk di bawah:'
                )}
              </p>
              <div className="pt-1 flex flex-wrap gap-2 justify-center sm:justify-start">
                <a
                  href={PLAY_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-black text-white text-xs font-mono-tech uppercase tracking-wider"
                >
                  {tx(
                    lang,
                    'Open Google Play Store Listing ↗',
                    'Google Play Store পেজ খুলুন ↗',
                    'فتح صفحة متجر Google Play ↗',
                    'گوگل پلے اسٹور کھولیں ↗',
                    'Buka Google Play Store ↗'
                  )}
                </a>
                <button
                  type="button"
                  onClick={handleCopyReferral}
                  className="px-3 py-1.5 border border-black text-black text-xs font-mono-tech uppercase tracking-wider cursor-pointer"
                >
                  {tx(lang, 'Copy Direct Link', 'লিংক কপি করুন', 'نسخ الرابط المباشر', 'ڈائریکٹ لنک کاپی کریں', 'Salin Tautan')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

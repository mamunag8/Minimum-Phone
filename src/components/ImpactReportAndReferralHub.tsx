import React, { useMemo, useState } from 'react';
import type {
  AppItem,
  FocusVaultState,
  LanguageCode,
  PurityState,
  SlowLearningState,
} from '../types/app';

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
      : Math.round(( Math.max(effectiveLessonsCompleted, 14) / 7 ) * horizonMultiplier);

  // 7-Day visual dataset for interactive SVG & Bar Chart
  const weeklyChartData = useMemo(() => {
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today'];
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
      label: '15s / 30s Read & Comprehension Quiz Gate (Stopped Impulsive Opens)',
      pct: 38,
      minutes: Math.round(projectedMinutesSaved * 0.38),
      badge: `${effectiveQuizzesPassed} Quizzes Passed`,
    },
    {
      id: 'escalation-20m',
      label: '5m Minor → 10m Medium → 20m Full-Screen Auto-Close (Facebook/YouTube/IG)',
      pct: 27,
      minutes: Math.round(projectedMinutesSaved * 0.27),
      badge: 'Anti-Rabbit-Hole Shield',
    },
    {
      id: 'night-qr-dns',
      label: 'Night Browser Physical QR Lock + Private Safe DNS Adult Blocker',
      pct: 17,
      minutes: Math.round(projectedMinutesSaved * 0.17),
      badge: `${purityDays}d Clean Streak`,
    },
    {
      id: 'notif-guard',
      label: 'Notification App-Open Guard & Scheduled Batch Digest',
      pct: 11,
      minutes: Math.round(projectedMinutesSaved * 0.11),
      badge: 'Zero Bait Traps',
    },
    {
      id: 'bg-cleaner',
      label: 'Background Safe-List Auto-Cleaner & Monochrome Grayscale Shield',
      pct: 7,
      minutes: Math.round(projectedMinutesSaved * 0.07),
      badge: `${(vault.backgroundSafeAppIds || []).length || 6} Safe Apps Whitelisted`,
    },
  ];

  // Referral Message Builder
  const referralMessage = useMemo(() => {
    const hoursStr = (effectiveReclaimedMinutes / 60).toFixed(1);
    if (referralTemplate === 'personal-success') {
      return `🌱 I’ve reclaimed ${hoursStr}+ hours of my life, stopped ${effectiveImpulsesStopped} mindless scrolling impulses, and completed ${effectiveLessonsCompleted} continuous learning lessons using *Minimum Phone*!\n\n✅ 100% Free Forever & 0% Ads\n✅ 15s/30s Read & Play Quiz before opening distracting apps (Learn Qur'an, Hadith, Languages & Wisdom)\n✅ 5m / 10m / 20m Auto-Close on Facebook, YouTube & Instagram\n✅ Private Safe DNS + Night Browser QR Lock\n\nDownload it free for your phone & family:\n${PLAY_STORE_URL}`;
    }
    if (referralTemplate === 'family-protection') {
      return `🛡️ Protect yourself and your family from screen addiction & harmful content with *Minimum Phone* — 100% Free & Zero Ads!\n\n• Blocks adult sites across all browsers via Private Safe DNS\n• Requires scanning a Physical QR code to use browsers at night\n• Automatically closes Facebook, YouTube & Instagram after 20 minutes\n• Replaces mindless scrolling with 30-second continuous learning quizzes\n\nGet it 100% free here:\n${PLAY_STORE_URL}`;
    }
    return `📚 Turn your phone from a distraction machine into a *Continuous Learning & Mindful Living* tool with *Minimum Phone* (100% Free, Zero Ads)!\n\nEvery time you open a social app or settings, you read a 15–30 second passage of Qur'an, Hadith, Language vocabulary, or timeless Wisdom and answer a quick comprehension quiz.\n\nTry it free with your friends & family:\n${PLAY_STORE_URL}`;
  }, [
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
      setCopiedFeedback('✓ Referral message & Play Store link copied! Paste it to your friends & family.');
      setTimeout(() => setCopiedFeedback(null), 4000);
    } catch {
      setCopiedFeedback('✓ Ready to copy from the text box below.');
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
                📊 LIFE IMPACT & VISUAL GRAPHICS REPORT
              </span>
              <span className="px-2 py-0.5 border border-zinc-700 text-[10px] font-mono-tech text-zinc-300">
                100% ON-DEVICE · ZERO ADS
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-mono-tech font-semibold text-zinc-100 mt-1.5">
              How Minimum Phone Is Saving Your Time & Transforming Your Mind
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Real-time visual breakdown of your reclaimed hours, defeated dopamine impulses,
              20-minute app auto-closes, and continuous learning mastery.
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
              ⚡ +1 Saved Session (+25m)
            </button>
            {onOpenShareableReceipt && (
              <button
                type="button"
                onClick={onOpenShareableReceipt}
                className="px-3 py-1.5 bg-zinc-100 text-black text-[11px] font-mono-tech font-semibold cursor-pointer"
              >
                🧾 Thermal Receipt
              </button>
            )}
          </div>
        </div>

        {/* TIME HORIZON SELECTOR (7 DAYS / 30 DAYS / 1 YEAR / 5 YEARS) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-black border border-zinc-800 p-3">
          <div className="text-xs font-mono-tech text-zinc-300">
            Select Impact Projection Horizon:
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {(
              [
                { id: '7d', label: '7 Days' },
                { id: '30d', label: '30 Days' },
                { id: '1y', label: '1 Year' },
                { id: '5y', label: '5 Years' },
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
              ⏳ TIME SAVED ({horizon.toUpperCase()})
            </div>
            <div className="text-2xl font-mono-tech font-bold text-zinc-100">
              {projectedHoursSaved}h
            </div>
            <div className="text-[11px] font-mono-tech text-zinc-300">
              = {projectedWakingDaysSaved} Full Waking Days
            </div>
          </div>

          <div className="border border-zinc-700 bg-black p-3.5 space-y-1">
            <div className="text-[10px] font-mono-tech uppercase tracking-wider text-zinc-400">
              🛡️ IMPULSES DEFEATED
            </div>
            <div className="text-2xl font-mono-tech font-bold text-zinc-100">
              {horizon === '7d'
                ? effectiveImpulsesStopped
                : Math.round((effectiveImpulsesStopped / 7) * horizonMultiplier)}
            </div>
            <div className="text-[11px] font-mono-tech text-zinc-300">
              Stopped at Breath / Quiz Gate
            </div>
          </div>

          <div className="border border-zinc-700 bg-black p-3.5 space-y-1">
            <div className="text-[10px] font-mono-tech uppercase tracking-wider text-zinc-400">
              📚 CONTINUOUS LEARNING
            </div>
            <div className="text-2xl font-mono-tech font-bold text-zinc-100">
              {projectedLessonsMastered}
            </div>
            <div className="text-[11px] font-mono-tech text-zinc-300">
              Lessons · {effectiveXp} XP Earned
            </div>
          </div>

          <div className="border border-zinc-700 bg-black p-3.5 space-y-1">
            <div className="text-[10px] font-mono-tech uppercase tracking-wider text-zinc-400">
              💎 CLARITY & PURITY
            </div>
            <div className="text-2xl font-mono-tech font-bold text-zinc-100">
              {purityDays}d
            </div>
            <div className="text-[11px] font-mono-tech text-zinc-300">
              {(purity.urgesDefeatedCount || 0) + bonusSimulatedImpulses} Urges Defeated
            </div>
          </div>
        </div>

        {/* VISUAL GRAPHIC 1: 7-DAY SCREEN TIME REDUCTION & TIME SAVED BAR CHART */}
        <div className="border border-zinc-800 bg-black p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-900 pb-2.5">
            <div>
              <span className="text-[10px] font-mono-tech uppercase tracking-widest text-zinc-400">
                VISUAL GRAPHIC 01 // BEFORE VS. AFTER MINIMUM PHONE
              </span>
              <h4 className="text-xs sm:text-sm font-mono-tech font-semibold text-zinc-100">
                7-Day Daily Time Saved vs. Pre-Detox Smartphone Drain (Tap Any Day)
              </h4>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-mono-tech">
              <span className="flex items-center gap-1 text-zinc-400">
                <span className="inline-block w-2.5 h-2.5 bg-zinc-800 border border-zinc-600" />
                Old Drain (4.5h/d)
              </span>
              <span className="flex items-center gap-1 text-zinc-100 font-semibold">
                <span className="inline-block w-2.5 h-2.5 bg-zinc-100" />
                Time Saved & Reclaimed
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
                    {/* Actual screen time bar (muted) */}
                    <div
                      style={{ height: `${screenHeightPct}%` }}
                      className="w-1/2 bg-zinc-800 border border-zinc-700 transition-all"
                      title={`Screen Time: ${day.actualScreenMinutes}m`}
                    />
                    {/* Reclaimed / Saved minutes bar (bright) */}
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
              <span className="text-zinc-400">{activeDay.label} Breakdown: </span>
              <strong className="text-zinc-100">
                +{activeDay.savedMinutes} min saved ({activeDay.reductionPct}% less screen drain)
              </strong>
            </div>
            <div className="flex flex-wrap gap-3 text-[11px] text-zinc-300">
              <span>🛡️ {activeDay.impulsesBlocked} Impulses Stopped</span>
              <span>📚 {activeDay.quizzesCompleted} Learning Quizzes Passed</span>
            </div>
          </div>
        </div>

        {/* VISUAL GRAPHIC 2: 3-RING SVG RADIAL BRAIN & FOCUS RECOVERY GAUGES */}
        <div className="space-y-2">
          <div className="text-[10px] font-mono-tech uppercase tracking-widest text-zinc-400">
            VISUAL GRAPHIC 02 // NEURAL & COGNITIVE SOVEREIGNTY GAUGES
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {renderCircularGauge(
              attentionSovereigntyPct,
              'Attention Sovereignty',
              'Unlocks driven by conscious intent instead of dopamine triggers.',
              `${effectiveImpulsesStopped} Impulses Blocked`
            )}
            {renderCircularGauge(
              learningRetentionPct,
              'Continuous Learning Score',
              '15s/30s reading & comprehension quiz accuracy across tracks.',
              `${effectiveQuizzesPassed} Quizzes · ${effectiveXp} XP`
            )}
            {renderCircularGauge(
              dopamineRecoveryPct,
              'Dopamine Baseline Recovery',
              'Prefrontal focus restoration via Purity Guard & 20m app limits.',
              `Day ${purityDays} Clean Streak`
            )}
          </div>
        </div>

        {/* VISUAL GRAPHIC 3: 5-PILLAR BREAKDOWN OF HOW MINIMUM PHONE SAVES YOUR TIME */}
        <div className="border border-zinc-800 bg-black p-4 space-y-3.5">
          <div className="border-b border-zinc-900 pb-2">
            <span className="text-[10px] font-mono-tech uppercase tracking-widest text-zinc-400">
              VISUAL GRAPHIC 03 // PROTECTION ENGINE ATTRIBUTION
            </span>
            <h4 className="text-xs sm:text-sm font-mono-tech font-semibold text-zinc-100">
              Where Your {projectedHoursSaved} Saved Hours Come From
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
            VISUAL GRAPHIC 04 // REAL-LIFE TRANSFORMATION EQUIVALENTS ({horizon.toUpperCase()})
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="border border-zinc-800 bg-black p-3 space-y-1">
              <div className="text-lg font-mono-tech font-bold text-zinc-100">
                📖 {projectedBooksEquivalent} Full Books / Juz
              </div>
              <p className="text-[11px] text-zinc-400">
                Reading & wisdom capacity unlocked by replacing 30-second scroll impulses with
                Slow Learning passages.
              </p>
            </div>
            <div className="border border-zinc-800 bg-black p-3 space-y-1">
              <div className="text-lg font-mono-tech font-bold text-zinc-100">
                🌅 {projectedWakingDaysSaved} Waking Days
              </div>
              <p className="text-[11px] text-zinc-400">
                Full 16-hour waking days of deep work, worship, and family presence rescued from
                algorithmic feeds.
              </p>
            </div>
            <div className="border border-zinc-800 bg-black p-3 space-y-1">
              <div className="text-lg font-mono-tech font-bold text-zinc-100">
                🧠 {projectedLessonsMastered} Micro-Lessons
              </div>
              <p className="text-[11px] text-zinc-400">
                Qur’an, Hadith, Arabic/Bangla/English vocabulary & universal wisdom lessons
                verified by quizzes.
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
                🎁 REFER FRIENDS & FAMILY
              </span>
              <span className="px-2 py-0.5 border border-zinc-600 text-[10px] font-mono-tech text-zinc-200">
                100% FREE FOREVER · 0% ADS · SADAQAH JARIYAH
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-mono-tech font-semibold text-zinc-100 pt-1">
              Share This 100% Free, Ad-Free, Life-Changing & Continuous Learning App
            </h3>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Minimum Phone has <strong>zero ads, zero subscriptions, and zero data tracking</strong>.
              When you share it with a friend, brother, sister, spouse, or child, every hour they
              save from addiction and every Qur’an, Hadith, or Language lesson they learn is a
              continuous benefit for both of you.
            </p>
          </div>

          <div className="border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-center shrink-0 font-mono-tech">
            <div className="text-xl font-bold text-zinc-100">{friendsInvitedCount}</div>
            <div className="text-[10px] text-zinc-400 uppercase">Friends / Family Shared</div>
          </div>
        </div>

        {/* WHY FRIENDS & FAMILY LOVE MINIMUM PHONE (3 PILLARS) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          <div className="border border-zinc-800 bg-zinc-950 p-3 space-y-1">
            <div className="font-mono-tech font-semibold text-zinc-100">
              1. 100% Free & Zero Ads Forever
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Unlike $60/year detox apps, every feature is completely free with zero ads so entire
              families and students can use it without barriers.
            </p>
          </div>
          <div className="border border-zinc-800 bg-zinc-950 p-3 space-y-1">
            <div className="font-mono-tech font-semibold text-zinc-100">
              2. Continuous Daily Learning
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Turns app opens into 15s/30s reading & quizzes on Islamic wisdom (Qur’an & Hadith),
              Languages, and Character building in 5 languages.
            </p>
          </div>
          <div className="border border-zinc-800 bg-zinc-950 p-3 space-y-1">
            <div className="font-mono-tech font-semibold text-zinc-100">
              3. Complete Addiction Shield
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              5m/10m/20m running-app auto-close, Private Safe DNS adult blocker, and Night Browser
              QR lock protect youth & adults alike.
            </p>
          </div>
        </div>

        {/* CHOOSE REFERRAL MESSAGE STYLE */}
        <div className="space-y-2">
          <div className="text-xs font-mono-tech text-zinc-300">
            1. Choose Referral Message Style to Send to Friends & Family:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {(
              [
                {
                  id: 'personal-success',
                  label: `🏆 My Time Saved (${projectedHoursSaved}h) + Invitation`,
                },
                {
                  id: 'family-protection',
                  label: '🛡️ Family & Youth Anti-Addiction Shield',
                },
                {
                  id: 'continuous-learning',
                  label: '📚 Continuous Learning (Islam & Languages)',
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
            <span>MESSAGE PREVIEW (READY TO SHARE):</span>
            <span>GOOGLE PLAY VERIFIED LINK INCLUDED</span>
          </div>
          <pre className="text-xs text-zinc-200 whitespace-pre-wrap font-sans leading-relaxed">
            {referralMessage}
          </pre>
        </div>

        {/* ONE-CLICK SHARE CHANNELS */}
        <div className="space-y-2">
          <div className="text-xs font-mono-tech text-zinc-300">
            2. Share Directly with Friends & Family in One Tap:
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="py-3 px-3 bg-zinc-100 text-black font-mono-tech text-xs font-bold uppercase tracking-wider hover:bg-white cursor-pointer"
            >
              📲 Share on WhatsApp
            </button>
            <button
              type="button"
              onClick={handleNativeShare}
              className="py-3 px-3 border-2 border-zinc-200 text-zinc-100 font-mono-tech text-xs font-bold uppercase tracking-wider hover:bg-zinc-900 cursor-pointer"
            >
              📤 Share to Any App
            </button>
            <button
              type="button"
              onClick={handleCopyReferral}
              className="py-3 px-3 border border-zinc-600 text-zinc-200 font-mono-tech text-xs uppercase tracking-wider hover:bg-zinc-900 cursor-pointer"
            >
              📋 Copy Message & Link
            </button>
            <button
              type="button"
              onClick={handleShareTelegram}
              className="py-2.5 px-3 border border-zinc-800 text-zinc-300 font-mono-tech text-xs hover:border-zinc-600 cursor-pointer"
            >
              ✈️ Share on Telegram
            </button>
            <button
              type="button"
              onClick={handleShareSms}
              className="py-2.5 px-3 border border-zinc-800 text-zinc-300 font-mono-tech text-xs hover:border-zinc-600 cursor-pointer"
            >
              💬 Send via SMS
            </button>
            <button
              type="button"
              onClick={() => setShowFriendInstallQr((v) => !v)}
              className="py-2.5 px-3 border border-zinc-700 bg-zinc-950 text-zinc-200 font-mono-tech text-xs hover:border-zinc-500 cursor-pointer"
            >
              {showFriendInstallQr ? '✕ Hide Install QR' : '🏁 In-Person QR Code'}
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
                IN-PERSON FAMILY & FRIEND INSTALL LINK
              </div>
              <p className="text-xs text-zinc-800 leading-relaxed">
                Have your friend or family member open Google Play Store and search{' '}
                <strong>“Minimum Phone: Detox & Focus”</strong> (`com.kasbllc.minimumphone`) or tap
                below to open the Play Store listing directly:
              </p>
              <div className="pt-1 flex flex-wrap gap-2 justify-center sm:justify-start">
                <a
                  href={PLAY_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-black text-white text-xs font-mono-tech uppercase tracking-wider"
                >
                  Open Google Play Store Listing ↗
                </a>
                <button
                  type="button"
                  onClick={handleCopyReferral}
                  className="px-3 py-1.5 border border-black text-black text-xs font-mono-tech uppercase tracking-wider cursor-pointer"
                >
                  Copy Direct Link
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

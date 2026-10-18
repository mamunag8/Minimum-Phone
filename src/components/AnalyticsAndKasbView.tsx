import React, { useState } from 'react';
import type {
  AppItem,
  FocusVaultState,
  HabitWallType,
  LanguageCode,
  PlatformMode,
  PurityState,
  VisualTheme,
  WisdomPackSource,
} from '../types/app';
import { SUPPORTED_LANGUAGES, TRANSLATIONS } from '../i18n/translations';
import { NativeBridge } from '../services/nativeBridge';

interface AnalyticsAndKasbViewProps {
  lang: LanguageCode;
  onChangeLanguage: (lang: LanguageCode) => void;
  platform: PlatformMode;
  onChangePlatform: (p: PlatformMode) => void;
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
  apps: AppItem[];
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
  apps,
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

  const expectedFriendCode = NativeBridge.computeFriendUnlockCode(
    vault.friendAccountabilitySecret
  );

  const totalScreenMinutes = apps.reduce((acc, a) => acc + a.dailyMinutesUsed, 0);
  const hoursReclaimed = (reclaimedMinutes / 60).toFixed(1);
  const purityDays = Math.floor(
    Math.max(0, Date.now() - new Date(purity.streakStartIso).getTime()) / 86400000
  );

  const handleActivateDefaultLauncher = async () => {
    const res = await NativeBridge.requestDefaultLauncher(platform);
    setNativeStatusLog(res.message);
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

  return (
    <div className="space-y-6 pb-10">
      {/* 1. LANGUAGE SWITCHER (ENGLISH, BANGLA, ARABIC, URDU, INDONESIAN + MORE) */}
      <div className="border border-zinc-800 bg-zinc-950/60 p-5 space-y-3">
        <div className="text-[10px] font-mono-tech uppercase tracking-widest text-zinc-500">
          GLOBAL ACCESSIBILITY // MULTILINGUAL ENGINE
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

      {/* 2. CALM MIND TRIGGER SOURCE (QURAN / HADITH / PROVERBS / BLENDED) */}
      <div className="border border-zinc-800 bg-zinc-950/60 p-5 space-y-4">
        <div className="text-[10px] font-mono-tech uppercase tracking-widest text-zinc-500">
          PEACE OF MIND (SAKĪNAH) // SMALL, STRONG LINE ONLY
        </div>
        <h3 className="text-sm font-mono-tech font-semibold text-zinc-100">
          {t.wisdomPackLabel}
        </h3>

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
              className={`py-3 px-3 border text-left text-xs font-mono-tech cursor-pointer ${
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

      {/* 3. DISPLAY, SYSTEM GRAYSCALE & DEFAULT HABIT-WALL */}
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
            Default Habit-Wall Gatekeeper Mode:
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
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
                className={`py-2 px-2.5 border text-left text-xs font-mono-tech cursor-pointer ${
                  defaultHabitWall === hw.id
                    ? 'border-zinc-200 bg-zinc-900 text-white'
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

      {/* 4. UNINSTALL PROTECTION & 24-HOUR COOLING-OFF LOCK */}
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

      {/* 5. LOCAL USAGE STATS & VIRAL "RECLAIMED LIFE RECEIPT" */}
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

      {/* 6. PLAY STORE (ANDROID) & APP STORE (iOS) NATIVE BRIDGE INSPECTOR */}
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

        <div className="border border-zinc-900 bg-black p-3.5 text-xs font-mono-tech text-zinc-400 space-y-1.5">
          {platform === 'android' ? (
            <>
              <div>• Home Replacement: `android.intent.category.HOME` (RoleManager)</div>
              <div>• Foreground Interceptor: `AccessibilityService` + `UsageStatsManager`</div>
              <div>• Digest Engine: `NotificationListenerService` (12 PM / 6 PM + VIP Pierce)</div>
              <div>• System Grayscale: `ZenDeviceEffects.setShouldDisplayGrayscale(true)`</div>
            </>
          ) : (
            <>
              <div>• Home Experience: `WidgetKit` Minimalist Launcher Widget + Blank Wallpaper</div>
              <div>• App Shielding: Apple `FamilyControls` + `ManagedSettingsStore`</div>
              <div>• Inhale Trigger: `ShieldConfigurationDataSource` + iOS Shortcuts Hook</div>
              <div>• Uninstall Guard: `ManagedSettingsStore().application.denyAppRemoval`</div>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={handleActivateDefaultLauncher}
          className="w-full py-2.5 border border-zinc-700 text-xs font-mono-tech text-zinc-200 hover:bg-zinc-900 cursor-pointer"
        >
          ⚡ Sync {platform === 'android' ? 'Android Default Home Role' : 'iOS ScreenTime Shield'}
        </button>

        {nativeStatusLog && (
          <div className="p-2.5 border border-zinc-700 bg-black text-[11px] font-mono-tech text-zinc-300">
            ✓ {nativeStatusLog}
          </div>
        )}
      </div>

      {/* 7. KASB LLC ECOSYSTEM & B2B ENTERPRISE FOCUS PODS */}
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
          and Purity features completely free with zero ads and zero cloud telemetry to help
          millions reclaim their attention and inner peace.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="border border-zinc-800 p-3.5 bg-zinc-950/50 space-y-1.5">
            <div className="font-mono-tech text-zinc-200 font-semibold">
              🏢 Kasb B2B Enterprise Focus Pods
            </div>
            <p className="text-zinc-400 text-[11px]">
              Custom corporate editions for remote teams: synchronized deep-work mornings, custom
              QR office focus locks, and WooCommerce seat licensing.
            </p>
          </div>
          <div className="border border-zinc-800 p-3.5 bg-zinc-950/50 space-y-1.5">
            <div className="font-mono-tech text-zinc-200 font-semibold">
              🔒 Zero-Telemetry Privacy Guarantee
            </div>
            <p className="text-zinc-400 text-[11px]">
              All screen-time stats, journal reflections, notifications, and purity streaks live
              strictly on your device.
            </p>
          </div>
        </div>
      </div>

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
                <span>URGES DEFEATED:</span>
                <strong>{purity.urgesDefeatedCount}</strong>
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

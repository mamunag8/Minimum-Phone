import React, { useState } from 'react';
import type {
  FocusVaultState,
  LanguageCode,
  NotificationItem,
} from '../types/app';
import { TRANSLATIONS } from '../i18n/translations';

interface DigestAndFocusViewProps {
  lang: LanguageCode;
  notifications: NotificationItem[];
  vault: FocusVaultState;
  onAddSimulatedNotification: (notif: NotificationItem) => void;
  onClearDigestSlot: (slot: '12:00 PM' | '06:00 PM') => void;
  onUpdateVault: (updater: (prev: FocusVaultState) => FocusVaultState) => void;
  onStartMonkModeAndGoHome: (taskTitle: string, minutes: number) => void;
}

export const DigestAndFocusView: React.FC<DigestAndFocusViewProps> = ({
  lang,
  notifications,
  vault,
  onAddSimulatedNotification,
  onClearDigestSlot,
  onUpdateVault,
  onStartMonkModeAndGoHome,
}) => {
  const t = TRANSLATIONS[lang];

  const [activeSlot, setActiveSlot] = useState<'12:00 PM' | '06:00 PM'>('06:00 PM');
  const [monkInputTitle, setMonkInputTitle] = useState<string>(
    vault.monkTaskTitle || 'Deep Focus Work Block'
  );
  const [monkMinutes, setMonkMinutes] = useState<number>(50);
  const [simSender, setSimSender] = useState<string>('Coworker Alex');
  const [simMessage, setSimMessage] = useState<string>(
    'Check out this meme when you get a chance'
  );
  const [qrScanVerifyInput, setQrScanVerifyInput] = useState<string>('');
  const [showPrintableCard, setShowPrintableCard] = useState<boolean>(false);

  const urgentItems = notifications.filter((n) => n.isUrgentBreakthrough);
  const slotItems = notifications.filter(
    (n) => !n.isUrgentBreakthrough && n.batchSlot === activeSlot
  );

  const handleSimulateIncomingPush = (forceVip?: boolean, forceUrgentKeyword?: boolean) => {
    const msgText = forceUrgentKeyword
      ? 'URGENT: Server deployment needs your sign-off now'
      : simMessage;
    const senderText = forceVip ? 'Mom (VIP Whitelist)' : simSender;
    const isUrgent =
      Boolean(forceVip) ||
      Boolean(forceUrgentKeyword) ||
      /urgent|emergency|জরুরি/i.test(msgText);

    const newItem: NotificationItem = {
      id: `notif-${Date.now()}`,
      appName: isUrgent ? 'Direct SMS / Call' : 'WhatsApp / Social',
      sender: senderText,
      message: msgText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      batchSlot: '06:00 PM',
      isUrgentBreakthrough: isUrgent,
      breakthroughReason: forceVip
        ? 'VIP Contact'
        : isUrgent
        ? 'URGENT Keyword'
        : undefined,
      read: false,
    };
    onAddSimulatedNotification(newItem);
  };

  const handleUnlockPhysicalBrick = () => {
    if (
      qrScanVerifyInput.trim().toUpperCase() ===
        vault.physicalBrickAnchorCode.toUpperCase() ||
      qrScanVerifyInput.trim().toUpperCase() === 'SCAN'
    ) {
      onUpdateVault((prev) => ({ ...prev, physicalBrickLocked: false }));
      setQrScanVerifyInput('');
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* SECTION 1: MONK MODE DEEP WORK BLOCK */}
      <div className="border border-zinc-800 bg-zinc-950/60 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-900 pb-2.5">
          <div>
            <span className="text-[10px] font-mono-tech uppercase tracking-widest text-zinc-500">
              SINGLE-TASK EXECUTION
            </span>
            <h3 className="text-sm font-mono-tech font-semibold text-zinc-100">
              {t.monkModeTitle}
            </h3>
          </div>
          {vault.monkModeActive && (
            <span className="px-2 py-0.5 bg-zinc-100 text-black text-[10px] font-mono-tech font-semibold">
              ACTIVE NOW
            </span>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-mono-tech text-zinc-400 mb-1">
              Single Deep Work Objective:
            </label>
            <input
              type="text"
              value={monkInputTitle}
              onChange={(e) => setMonkInputTitle(e.target.value)}
              placeholder="e.g., Ship Q4 Client Architecture Spec..."
              className="w-full bg-black border border-zinc-800 px-3 py-2.5 text-xs text-zinc-100 font-mono-tech focus:outline-none focus:border-zinc-400"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[25, 50, 90].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMonkMinutes(m)}
                className={`py-2.5 border text-xs font-mono-tech cursor-pointer ${
                  monkMinutes === m
                    ? 'border-zinc-100 bg-zinc-100 text-black font-semibold'
                    : 'border-zinc-800 text-zinc-400 hover:border-zinc-600'
                }`}
              >
                {m} MINS
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => onStartMonkModeAndGoHome(monkInputTitle, monkMinutes)}
            className="w-full py-3.5 bg-zinc-100 text-black font-mono-tech text-xs font-semibold uppercase tracking-widest hover:bg-white cursor-pointer"
          >
            ▶ Start {monkMinutes}m Monk Mode on Home Screen
          </button>
        </div>
      </div>

      {/* SECTION 2: TWICE-DAILY NOTIFICATION DIGEST + URGENT BREAKTHROUGH */}
      <div className="border border-zinc-800 bg-zinc-950/60 p-5 space-y-4">
        <div className="border-b border-zinc-900 pb-2.5">
          <span className="text-[10px] font-mono-tech uppercase tracking-widest text-zinc-500">
            NOTIFICATION LISTENER SERVICE // PEACE OF MIND
          </span>
          <h3 className="text-sm font-mono-tech font-semibold text-zinc-100">
            {t.notificationDigestTitle}
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            Non-urgent notifications are muted and held quietly until 12:00 PM & 6:00 PM. VIP
            contacts and messages containing “URGENT” pierce through immediately.
          </p>
        </div>

        {/* Urgent Breakthrough Alerts (if any) */}
        {urgentItems.length > 0 && (
          <div className="border border-zinc-300 bg-black p-3.5 space-y-2">
            <div className="text-xs font-mono-tech font-semibold text-zinc-100">
              ⚡ EMERGENCY BREAKTHROUGH ({urgentItems.length})
            </div>
            {urgentItems.map((u) => (
              <div
                key={u.id}
                className="border-t border-zinc-900 pt-2 text-xs flex justify-between items-start"
              >
                <div>
                  <span className="font-mono-tech text-zinc-200 font-medium">
                    {u.sender}
                  </span>{' '}
                  <span className="text-[10px] font-mono-tech px-1.5 py-0.5 bg-zinc-800 text-zinc-300 ml-1">
                    {u.breakthroughReason}
                  </span>
                  <p className="text-zinc-300 mt-0.5">{u.message}</p>
                </div>
                <span className="text-[10px] font-mono-tech text-zinc-500">{u.timestamp}</span>
              </div>
            ))}
          </div>
        )}

        {/* Batch Slot Selector */}
        <div className="grid grid-cols-2 gap-2">
          {(['12:00 PM', '06:00 PM'] as const).map((slot) => {
            const count = notifications.filter(
              (n) => !n.isUrgentBreakthrough && n.batchSlot === slot
            ).length;
            return (
              <button
                key={slot}
                type="button"
                onClick={() => setActiveSlot(slot)}
                className={`py-2.5 px-3 border text-xs font-mono-tech cursor-pointer ${
                  activeSlot === slot
                    ? 'border-zinc-200 bg-zinc-900 text-zinc-100'
                    : 'border-zinc-800 text-zinc-500'
                }`}
              >
                {slot} Batch ({count})
              </button>
            );
          })}
        </div>

        {/* Batched Notifications List */}
        <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
          {slotItems.length === 0 ? (
            <div className="text-center py-6 border border-zinc-900 text-xs font-mono-tech text-zinc-500">
              0 notifications waiting in {activeSlot} digest. Peace of mind intact.
            </div>
          ) : (
            slotItems.map((item) => (
              <div
                key={item.id}
                className="p-3 border border-zinc-900 bg-black flex justify-between items-start gap-2"
              >
                <div>
                  <div className="text-xs font-mono-tech text-zinc-300">
                    [{item.appName}] <span className="text-zinc-400">{item.sender}</span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">{item.message}</p>
                </div>
                <span className="text-[10px] font-mono-tech text-zinc-600 shrink-0">
                  {item.timestamp}
                </span>
              </div>
            ))
          )}
        </div>

        {slotItems.length > 0 && (
          <button
            type="button"
            onClick={() => onClearDigestSlot(activeSlot)}
            className="w-full py-2 border border-zinc-800 text-xs font-mono-tech text-zinc-400 hover:text-zinc-200 cursor-pointer"
          >
            ✓ Mark {activeSlot} Digest as Reviewed & Clear
          </button>
        )}

        {/* Interactive Notification Interceptor Tester */}
        <div className="border-t border-zinc-900 pt-3 space-y-2">
          <div className="text-[11px] font-mono-tech uppercase text-zinc-500">
            TEST LIVE NOTIFICATION INTERCEPTOR:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleSimulateIncomingPush(false, false)}
              className="py-2 px-2.5 border border-zinc-800 text-[11px] font-mono-tech text-zinc-300 hover:bg-zinc-900 cursor-pointer"
            >
              + Quiet Social Push (Batched)
            </button>
            <button
              type="button"
              onClick={() => handleSimulateIncomingPush(true, false)}
              className="py-2 px-2.5 border border-zinc-700 text-[11px] font-mono-tech text-zinc-200 hover:bg-zinc-900 cursor-pointer"
            >
              ⚡ Test VIP Family Call
            </button>
            <button
              type="button"
              onClick={() => handleSimulateIncomingPush(false, true)}
              className="py-2 px-2.5 border border-zinc-700 text-[11px] font-mono-tech text-zinc-200 hover:bg-zinc-900 cursor-pointer"
            >
              ⚡ Test “URGENT” Keyword
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 3: FREE QR / NFC PHYSICAL BRICK LOCK & TIME-LOCKED VAULT */}
      <div className="border border-zinc-800 bg-zinc-950/60 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-900 pb-2.5">
          <div>
            <span className="text-[10px] font-mono-tech uppercase tracking-widest text-zinc-500">
              ZERO-COST HARDWARE ALTERNATIVE ($50 BRICK REPLACEMENT)
            </span>
            <h3 className="text-sm font-mono-tech font-semibold text-zinc-100">
              {t.physicalBrickTitle}
            </h3>
          </div>
          <span
            className={`px-2 py-0.5 text-[10px] font-mono-tech ${
              vault.physicalBrickLocked
                ? 'bg-zinc-100 text-black font-semibold'
                : 'border border-zinc-800 text-zinc-500'
            }`}
          >
            {vault.physicalBrickLocked ? 'BRICKED' : 'UNLOCKED'}
          </span>
        </div>

        <p className="text-xs text-zinc-400">
          Print your personal QR Anchor or bind any NFC tag and place it in another room (e.g., on
          your refrigerator). When Physical Brick Lock is active, distracting apps are 100% locked
          until you walk over and scan that physical anchor.
        </p>

        {!vault.physicalBrickLocked ? (
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() =>
                onUpdateVault((prev) => ({ ...prev, physicalBrickLocked: true }))
              }
              className="flex-1 py-3 bg-zinc-100 text-black font-mono-tech text-xs font-semibold uppercase tracking-wider cursor-pointer"
            >
              🔒 Activate Physical QR/NFC Brick Lock
            </button>
            <button
              type="button"
              onClick={() => setShowPrintableCard((v) => !v)}
              className="py-3 px-4 border border-zinc-700 text-xs font-mono-tech text-zinc-200 hover:bg-zinc-900 cursor-pointer"
            >
              {showPrintableCard ? 'Hide Printable QR' : 'Print QR Anchor Card'}
            </button>
          </div>
        ) : (
          <div className="border border-zinc-500 bg-black p-4 space-y-3">
            <div className="text-xs font-mono-tech text-zinc-200">
              🔒 PHONE IS PHYSICALLY ANCHOR-LOCKED
            </div>
            <p className="text-xs text-zinc-400">
              Scan your printed QR code (`{vault.physicalBrickAnchorCode}`) or tap your NFC tag to
              unlock restricted apps:
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={qrScanVerifyInput}
                onChange={(e) => setQrScanVerifyInput(e.target.value)}
                placeholder={`Type ${vault.physicalBrickAnchorCode} or click Simulate Scan`}
                className="flex-1 bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs font-mono-tech text-zinc-100"
              />
              <button
                type="button"
                onClick={handleUnlockPhysicalBrick}
                className="px-3 py-2 bg-zinc-100 text-black text-xs font-mono-tech font-semibold cursor-pointer"
              >
                Verify
              </button>
            </div>
            <button
              type="button"
              onClick={() =>
                onUpdateVault((prev) => ({ ...prev, physicalBrickLocked: false }))
              }
              className="w-full py-2 border border-zinc-800 text-[11px] font-mono-tech text-zinc-400 hover:text-zinc-200 cursor-pointer"
            >
              📷 Simulate Camera QR / NFC Tag Scan (`{vault.physicalBrickAnchorCode}`)
            </button>
          </div>
        )}

        {/* Printable Monochrome QR Card */}
        {showPrintableCard && (
          <div className="border border-zinc-500 bg-white text-black p-5 text-center space-y-3">
            <div className="text-[10px] font-mono-tech uppercase tracking-widest">
              MINIMUM PHONE // PHYSICAL FOCUS ANCHOR
            </div>
            {/* Deterministic SVG QR Matrix Representation */}
            <div className="w-36 h-36 mx-auto border-4 border-black p-2 grid grid-cols-7 grid-rows-7 gap-1 bg-white">
              {Array.from({ length: 49 }).map((_, i) => {
                const filled =
                  i % 2 === 0 || i < 7 || i > 41 || i % 7 === 0 || i % 7 === 6;
                return (
                  <div
                    key={i}
                    className={filled ? 'bg-black' : 'bg-white'}
                  />
                );
              })}
            </div>
            <div className="font-mono-tech text-xs font-bold tracking-widest">
              {vault.physicalBrickAnchorCode}
            </div>
            <p className="text-[11px] text-zinc-700 max-w-xs mx-auto">
              Tape this card inside a kitchen cabinet or away from your desk & bed. Scan to unlock
              Deep Work or Sleep Vault.
            </p>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 bg-black text-white text-xs font-mono-tech uppercase tracking-wider cursor-pointer"
            >
              Print Physical QR Card
            </button>
          </div>
        )}

        {/* Scheduled Vault Toggles */}
        <div className="pt-2 border-t border-zinc-900 space-y-2">
          <div className="flex items-center justify-between py-1.5">
            <div>
              <div className="text-xs text-zinc-200 font-medium">
                Deep Work Auto-Vault (09:00 AM – 05:00 PM)
              </div>
              <div className="text-[11px] text-zinc-500 font-mono-tech">
                Locks entertainment & social feeds during work hours
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                onUpdateVault((prev) => ({
                  ...prev,
                  deepWorkScheduleEnabled: !prev.deepWorkScheduleEnabled,
                }))
              }
              className={`px-3 py-1 border text-xs font-mono-tech cursor-pointer ${
                vault.deepWorkScheduleEnabled
                  ? 'border-zinc-200 bg-zinc-100 text-black font-semibold'
                  : 'border-zinc-800 text-zinc-500'
              }`}
            >
              {vault.deepWorkScheduleEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className="flex items-center justify-between py-1.5">
            <div>
              <div className="text-xs text-zinc-200 font-medium">
                Sleep & Fajr Dawn Vault (10:00 PM – 06:00 AM)
              </div>
              <div className="text-[11px] text-zinc-500 font-mono-tech">
                Protects sleep and morning tranquility from bed-scrolling
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                onUpdateVault((prev) => ({
                  ...prev,
                  sleepVaultScheduleEnabled: !prev.sleepVaultScheduleEnabled,
                }))
              }
              className={`px-3 py-1 border text-xs font-mono-tech cursor-pointer ${
                vault.sleepVaultScheduleEnabled
                  ? 'border-zinc-200 bg-zinc-100 text-black font-semibold'
                  : 'border-zinc-800 text-zinc-500'
              }`}
            >
              {vault.sleepVaultScheduleEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

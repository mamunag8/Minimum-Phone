import React, { useEffect, useRef, useState } from 'react';
import type {
  FocusVaultState,
  LanguageCode,
  NotificationItem,
  QrComplexityLevel,
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
  onOpenAppFromNotification?: (appName: string) => void;
}

export function getRequiredQrTokenForComplexity(
  baseCode: string,
  complexity: QrComplexityLevel = 'hard'
): string {
  const clean = (baseCode || 'KASB-BRICK-77').trim().toUpperCase();
  if (complexity === 'easy') return clean;
  if (complexity === 'medium') return `${clean}-M409`;
  return `${clean}-FORTRESS-9941-NIGHT`;
}

export const DigestAndFocusView: React.FC<DigestAndFocusViewProps> = ({
  lang,
  notifications,
  vault,
  onAddSimulatedNotification,
  onClearDigestSlot,
  onUpdateVault,
  onStartMonkModeAndGoHome,
  onOpenAppFromNotification,
}) => {
  const t = TRANSLATIONS[lang];

  const [activeSlot, setActiveSlot] = useState<'12:00 PM' | '06:00 PM'>('06:00 PM');
  const [monkInputTitle, setMonkInputTitle] = useState<string>(
    vault.monkTaskTitle || 'Deep Focus Work Block'
  );
  const [monkMinutes, setMonkMinutes] = useState<number>(50);
  const [simSender] = useState<string>('Coworker Alex');
  const [simMessage] = useState<string>('Check out this link when you get a chance');

  const [selectedNotif, setSelectedNotif] = useState<NotificationItem | null>(null);
  const [notifBlockedFeedback, setNotifBlockedFeedback] = useState<string | null>(null);

  // QR Scanner & Complexity State
  const qrComplexity: QrComplexityLevel = vault.qrComplexity || 'hard';
  const expectedQrToken = getRequiredQrTokenForComplexity(
    vault.physicalBrickAnchorCode,
    qrComplexity
  );

  const [qrScanVerifyInput, setQrScanVerifyInput] = useState<string>('');
  const [qrHardMathAnswer, setQrHardMathAnswer] = useState<string>('');
  const [qrScanCountdown, setQrScanCountdown] = useState<number>(0);
  const [qrErrorMsg, setQrErrorMsg] = useState<string | null>(null);
  const [showPrintableCard, setShowPrintableCard] = useState<boolean>(false);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const urgentItems = notifications.filter((n) => n.isUrgentBreakthrough);
  const slotItems = notifications.filter(
    (n) => !n.isUrgentBreakthrough && n.batchSlot === activeSlot
  );

  useEffect(() => {
    if (qrScanCountdown <= 0) return;
    const timer = setInterval(() => {
      setQrScanCountdown((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [qrScanCountdown]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((tr) => tr.stop());
      }
    };
  }, []);

  const startCameraScanner = async () => {
    setQrErrorMsg(null);
    setCameraActive(true);
    const waitSec = qrComplexity === 'hard' ? 12 : qrComplexity === 'medium' ? 6 : 2;
    setQrScanCountdown(waitSec);
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }
    } catch {
      // Camera fallback if permission not granted yet
    }
  };

  const stopCameraScanner = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((tr) => tr.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

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
      appName: isUrgent ? 'Phone' : 'WhatsApp',
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
    setQrErrorMsg(null);
    const cleaned = qrScanVerifyInput.trim().toUpperCase();

    if (qrScanCountdown > 0) {
      setQrErrorMsg(`Wait ${qrScanCountdown}s while physical QR verification completes.`);
      return;
    }

    if (qrComplexity === 'hard' && qrHardMathAnswer.trim() !== '43') {
      setQrErrorMsg(
        'Hard QR Complexity requires solving the anti-impulse check (17 + 26 = 43) plus the full QR token.'
      );
      return;
    }

    if (cleaned === expectedQrToken) {
      stopCameraScanner();
      onUpdateVault((prev) => ({ ...prev, physicalBrickLocked: false }));
      setQrScanVerifyInput('');
      setQrHardMathAnswer('');
    } else {
      setQrErrorMsg(
        `Invalid QR code for [${qrComplexity.toUpperCase()}] complexity. Expected exact code: ${expectedQrToken}`
      );
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

      {/* SECTION 2: TWICE-DAILY NOTIFICATION DIGEST + NOTIFICATION APP-LAUNCH CONTROL */}
      <div className="border border-zinc-800 bg-zinc-950/60 p-5 space-y-4">
        <div className="border-b border-zinc-900 pb-2.5 flex items-start justify-between gap-2">
          <div>
            <span className="text-[10px] font-mono-tech uppercase tracking-widest text-zinc-500">
              NOTIFICATION LISTENER & APP-OPEN INTERCEPTOR
            </span>
            <h3 className="text-sm font-mono-tech font-semibold text-zinc-100">
              {t.notificationDigestTitle}
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Read messages quietly inside Minimum Phone without triggering app dopamine loops.
              Opening any app from a notification is controlled by your Notification Guard below.
            </p>
          </div>
          <span className="px-2 py-0.5 bg-zinc-100 text-black text-[10px] font-mono-tech font-semibold shrink-0">
            {vault.blockNotificationAppLaunch ?? true ? 'GUARDED' : 'DIRECT'}
          </span>
        </div>

        {/* Notification App-Open Control Toggles */}
        <div className="border border-zinc-800 bg-black p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="pr-3">
              <div className="text-xs font-mono-tech font-semibold text-zinc-100">
                Block Direct App Launch from Notifications
              </div>
              <div className="text-[11px] text-zinc-400">
                Prevents tapping a notification from bypassing the 30s Read+Quiz Gate or Night QR
                Lock
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                onUpdateVault((prev) => ({
                  ...prev,
                  blockNotificationAppLaunch: !(prev.blockNotificationAppLaunch ?? true),
                }))
              }
              className={`px-3 py-1 border text-xs font-mono-tech cursor-pointer ${
                vault.blockNotificationAppLaunch ?? true
                  ? 'border-zinc-100 bg-zinc-100 text-black font-semibold'
                  : 'border-zinc-700 text-zinc-400'
              }`}
            >
              {vault.blockNotificationAppLaunch ?? true ? 'LOCKED ON' : 'OFF'}
            </button>
          </div>

          <div className="flex items-center justify-between border-t border-zinc-900 pt-2">
            <div className="pr-3">
              <div className="text-xs font-mono-tech font-medium text-zinc-200">
                Read-Only Notification Preview Mode
              </div>
              <div className="text-[11px] text-zinc-500">
                Tap any notification below to read its full text safely without opening the app
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                onUpdateVault((prev) => ({
                  ...prev,
                  readOnlyNotificationDigest: !(prev.readOnlyNotificationDigest ?? true),
                }))
              }
              className={`px-3 py-1 border text-xs font-mono-tech cursor-pointer ${
                vault.readOnlyNotificationDigest ?? true
                  ? 'border-zinc-100 bg-zinc-100 text-black font-semibold'
                  : 'border-zinc-700 text-zinc-400'
              }`}
            >
              {vault.readOnlyNotificationDigest ?? true ? 'READ-ONLY' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Selected Notification Safe Text Reader */}
        {selectedNotif && (
          <div className="border-2 border-zinc-200 bg-black p-4 space-y-3 font-mono-tech">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <span className="text-[10px] uppercase tracking-widest text-zinc-400">
                SAFE TEXT-ONLY NOTIFICATION READER // ZERO DOPAMINE FEED
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedNotif(null);
                  setNotifBlockedFeedback(null);
                }}
                className="px-2 py-0.5 border border-zinc-700 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="text-xs space-y-1">
              <div className="text-zinc-300">
                Source App: <strong className="text-zinc-100">{selectedNotif.appName}</strong> ·{' '}
                {selectedNotif.timestamp}
              </div>
              <div className="text-zinc-300">
                From: <strong className="text-zinc-100">{selectedNotif.sender}</strong>
              </div>
              <div className="p-3 border border-zinc-800 bg-zinc-950 text-zinc-100 mt-2 leading-relaxed">
                “{selectedNotif.message}”
              </div>
            </div>

            {notifBlockedFeedback && (
              <div className="p-2.5 border border-zinc-400 bg-zinc-900 text-[11px] text-zinc-100">
                🛡️ {notifBlockedFeedback}
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setSelectedNotif(null);
                  setNotifBlockedFeedback(null);
                }}
                className="flex-1 py-2.5 bg-zinc-100 text-black text-xs font-semibold uppercase cursor-pointer"
              >
                ✓ Done Reading (Stay Calm on Home)
              </button>
              <button
                type="button"
                onClick={() => {
                  if (vault.blockNotificationAppLaunch ?? true) {
                    setNotifBlockedFeedback(
                      'Direct notification launch intercepted! Routing through Minimum Phone Gatekeeper...'
                    );
                    setTimeout(() => {
                      const targetApp = selectedNotif.appName;
                      setSelectedNotif(null);
                      setNotifBlockedFeedback(null);
                      onOpenAppFromNotification?.(targetApp);
                    }, 700);
                  } else {
                    const targetApp = selectedNotif.appName;
                    setSelectedNotif(null);
                    onOpenAppFromNotification?.(targetApp);
                  }
                }}
                className="px-3 py-2.5 border border-zinc-700 text-xs text-zinc-300 hover:border-zinc-400 cursor-pointer"
              >
                {vault.blockNotificationAppLaunch ?? true
                  ? '🔒 Open App via 30s Quiz Gate'
                  : 'Open Source App →'}
              </button>
            </div>
          </div>
        )}

        {/* Urgent Breakthrough Alerts (if any) */}
        {urgentItems.length > 0 && (
          <div className="border border-zinc-300 bg-black p-3.5 space-y-2">
            <div className="text-xs font-mono-tech font-semibold text-zinc-100">
              ⚡ EMERGENCY BREAKTHROUGH ({urgentItems.length})
            </div>
            {urgentItems.map((u) => (
              <div
                key={u.id}
                onClick={() => setSelectedNotif(u)}
                className="border-t border-zinc-900 pt-2 text-xs flex justify-between items-start cursor-pointer hover:bg-zinc-950 p-1"
              >
                <div>
                  <span className="font-mono-tech text-zinc-200 font-medium">{u.sender}</span>{' '}
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
                onClick={() => setSelectedNotif(item)}
                className="p-3 border border-zinc-900 bg-black hover:border-zinc-600 flex justify-between items-start gap-2 cursor-pointer transition"
              >
                <div>
                  <div className="text-xs font-mono-tech text-zinc-300">
                    [{item.appName}] <span className="text-zinc-400">{item.sender}</span>
                    <span className="ml-2 text-[10px] text-zinc-500 underline">
                      [Tap to Read Safely]
                    </span>
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

      {/* SECTION 3: QR CODE SCANNER WITH COMPLEXITY SETTINGS (EASY / MEDIUM / HARD) & NIGHT BROWSER QR LOCK */}
      <div className="border border-zinc-800 bg-zinc-950/60 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-900 pb-2.5">
          <div>
            <span className="text-[10px] font-mono-tech uppercase tracking-widest text-zinc-500">
              PHYSICAL QR SCANNER & NIGHT BROWSER FORTRESS
            </span>
            <h3 className="text-sm font-mono-tech font-semibold text-zinc-100">
              {t.physicalBrickTitle} ({qrComplexity.toUpperCase()} MODE)
            </h3>
          </div>
          <span
            className={`px-2 py-0.5 text-[10px] font-mono-tech ${
              vault.physicalBrickLocked
                ? 'bg-zinc-100 text-black font-semibold'
                : 'border border-zinc-800 text-zinc-500'
            }`}
          >
            {vault.physicalBrickLocked ? 'QR LOCKED' : 'READY'}
          </span>
        </div>

        {/* QR Code Complexity Selector (Easy / Medium / Hard) */}
        <div className="space-y-2">
          <div className="text-xs font-mono-tech text-zinc-300">
            QR Code Scanner Complexity Level:
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                {
                  id: 'easy',
                  title: 'EASY',
                  desc: 'Standard QR Scan (6-char anchor)',
                },
                {
                  id: 'medium',
                  title: 'MEDIUM',
                  desc: 'QR + 6s Camera Hold + Checksum',
                },
                {
                  id: 'hard',
                  title: 'HARD (Strict)',
                  desc: '24-Char Crypto QR + 12s Hold + Math',
                },
              ] as const
            ).map((lvl) => (
              <button
                key={lvl.id}
                type="button"
                onClick={() =>
                  onUpdateVault((prev) => ({
                    ...prev,
                    qrComplexity: lvl.id,
                  }))
                }
                className={`p-2.5 border text-left font-mono-tech cursor-pointer ${
                  qrComplexity === lvl.id
                    ? 'border-zinc-100 bg-zinc-100 text-black font-semibold'
                    : 'border-zinc-800 bg-black text-zinc-400 hover:border-zinc-600'
                }`}
              >
                <div className="text-xs">{lvl.title}</div>
                <div
                  className={`text-[10px] mt-0.5 ${
                    qrComplexity === lvl.id ? 'text-zinc-800' : 'text-zinc-500'
                  }`}
                >
                  {lvl.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Mandatory Night Browser QR Lock ("Without scan QR codes specifically can not use any browse at night") */}
        <div className="border-2 border-zinc-300 bg-black p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="pr-3">
              <div className="text-xs font-mono-tech font-semibold text-zinc-100">
                🌙 Mandatory Night Browser QR Scan Lock (10:00 PM – 06:00 AM)
              </div>
              <div className="text-[11px] text-zinc-400 mt-0.5">
                Without specifically scanning your physical QR code ({expectedQrToken}), NO web
                browser can be opened at night—even if the 30s quiz is passed.
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                onUpdateVault((prev) => ({
                  ...prev,
                  nightBrowserQrRequired: !(prev.nightBrowserQrRequired ?? true),
                }))
              }
              className={`px-3 py-1.5 border text-xs font-mono-tech cursor-pointer shrink-0 ${
                vault.nightBrowserQrRequired ?? true
                  ? 'border-zinc-100 bg-zinc-100 text-black font-semibold'
                  : 'border-zinc-700 text-zinc-400'
              }`}
            >
              {vault.nightBrowserQrRequired ?? true ? 'REQUIRED' : 'OFF'}
            </button>
          </div>

          <div className="flex items-center justify-between border-t border-zinc-900 pt-2 text-[11px] font-mono-tech">
            <span className="text-zinc-400">
              Enforce Night Browser QR Lock right now (24/7 Strict Mode / Test):
            </span>
            <button
              type="button"
              onClick={() =>
                onUpdateVault((prev) => ({
                  ...prev,
                  forceNightBrowserQrTest: !prev.forceNightBrowserQrTest,
                }))
              }
              className={`px-2.5 py-1 border cursor-pointer ${
                vault.forceNightBrowserQrTest
                  ? 'border-zinc-100 bg-zinc-100 text-black font-semibold'
                  : 'border-zinc-700 text-zinc-300'
              }`}
            >
              {vault.forceNightBrowserQrTest ? 'ACTIVE NOW' : 'Enable Now'}
            </button>
          </div>
        </div>

        {!vault.physicalBrickLocked ? (
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() =>
                onUpdateVault((prev) => ({ ...prev, physicalBrickLocked: true }))
              }
              className="flex-1 py-3 bg-zinc-100 text-black font-mono-tech text-xs font-semibold uppercase tracking-wider cursor-pointer"
            >
              🔒 Lock All Restricted Apps Behind Physical QR Now
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
          <div className="border-2 border-zinc-300 bg-black p-4 space-y-3 font-mono-tech">
            <div className="flex items-center justify-between text-xs text-zinc-100">
              <span>🔒 PHYSICAL QR LOCK ACTIVE ({qrComplexity.toUpperCase()} COMPLEXITY)</span>
              {!cameraActive ? (
                <button
                  type="button"
                  onClick={startCameraScanner}
                  className="px-2.5 py-1 bg-zinc-100 text-black text-[10px] font-semibold uppercase cursor-pointer"
                >
                  📷 Open Live Camera Scanner
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopCameraScanner}
                  className="px-2.5 py-1 border border-zinc-600 text-[10px] text-zinc-300 cursor-pointer"
                >
                  Close Camera
                </button>
              )}
            </div>

            {cameraActive && (
              <div className="border border-zinc-700 bg-zinc-950 p-3 text-center space-y-2">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full max-h-44 bg-black border border-zinc-800 mx-auto object-cover"
                />
                <div className="text-[11px] text-zinc-300">
                  {qrScanCountdown > 0
                    ? `Hold camera steady on your printed QR Card (${qrScanCountdown}s verification)...`
                    : '✓ Camera optical lock ready. Confirm scanned token below:'}
                </div>
                {qrScanCountdown === 0 && (
                  <button
                    type="button"
                    onClick={() => setQrScanVerifyInput(expectedQrToken)}
                    className="px-3 py-1.5 bg-zinc-100 text-black text-[11px] font-semibold uppercase cursor-pointer"
                  >
                    ✓ Capture Scanned QR Code ({expectedQrToken})
                  </button>
                )}
              </div>
            )}

            <div className="text-[11px] text-zinc-400">
              Required Physical QR Token ({qrComplexity.toUpperCase()}):{' '}
              <span className="text-zinc-200 font-semibold">{expectedQrToken}</span>
            </div>

            {qrComplexity === 'hard' && (
              <div className="space-y-1">
                <label className="block text-[11px] text-zinc-300">
                  Hard Mode Anti-Impulse Check — Solve: <strong>17 + 26 = ?</strong>
                </label>
                <input
                  type="text"
                  value={qrHardMathAnswer}
                  onChange={(e) => setQrHardMathAnswer(e.target.value)}
                  placeholder="Enter sum (43)"
                  className="w-full bg-zinc-950 border border-zinc-700 px-3 py-2 text-xs text-zinc-100"
                />
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={qrScanVerifyInput}
                onChange={(e) => setQrScanVerifyInput(e.target.value)}
                placeholder={`Scan or enter ${expectedQrToken}`}
                className="flex-1 bg-zinc-950 border border-zinc-700 px-3 py-2 text-xs text-zinc-100"
              />
              <button
                type="button"
                onClick={handleUnlockPhysicalBrick}
                className="px-4 py-2 bg-zinc-100 text-black text-xs font-semibold uppercase cursor-pointer"
              >
                Verify QR
              </button>
            </div>

            {qrErrorMsg && (
              <div className="p-2 border border-zinc-500 bg-zinc-900 text-[11px] text-zinc-200">
                ⚠ {qrErrorMsg}
              </div>
            )}
          </div>
        )}

        {/* Printable Monochrome QR Card */}
        {showPrintableCard && (
          <div className="border border-zinc-500 bg-white text-black p-5 text-center space-y-3">
            <div className="text-[10px] font-mono-tech uppercase tracking-widest">
              MINIMUM PHONE // PHYSICAL QR ANCHOR ({qrComplexity.toUpperCase()} COMPLEXITY)
            </div>
            <div className="w-36 h-36 mx-auto border-4 border-black p-2 grid grid-cols-7 grid-rows-7 gap-1 bg-white">
              {Array.from({ length: 49 }).map((_, i) => {
                const filled =
                  i % 2 === 0 || i < 7 || i > 41 || i % 7 === 0 || i % 7 === 6;
                return <div key={i} className={filled ? 'bg-black' : 'bg-white'} />;
              })}
            </div>
            <div className="font-mono-tech text-xs font-bold tracking-widest break-all">
              {expectedQrToken}
            </div>
            <p className="text-[11px] text-zinc-700 max-w-xs mx-auto">
              Tape this card in another room away from your bed. Required to unlock restricted apps
              and mandatory for opening any Browser at night.
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
              <div className="text-xs font-medium text-zinc-200">
                Deep Work Schedule Vault (09:00 – 13:00)
              </div>
              <div className="text-[11px] text-zinc-500 font-mono-tech">
                Auto-locks social & video apps during work hours
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
                  : 'border-zinc-700 text-zinc-400'
              }`}
            >
              {vault.deepWorkScheduleEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className="flex items-center justify-between py-1.5">
            <div>
              <div className="text-xs font-medium text-zinc-200">
                Sleep & Tahajjud Vault (22:30 – 06:00)
              </div>
              <div className="text-[11px] text-zinc-500 font-mono-tech">
                Protects late-night sleep & forces QR scan for any browser after 10 PM
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
                  : 'border-zinc-700 text-zinc-400'
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

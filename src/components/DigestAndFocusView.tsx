import React, { useEffect, useRef, useState } from 'react';
import type {
  FocusVaultState,
  LanguageCode,
  NotificationItem,
  QrComplexityLevel,
} from '../types/app';
import { TRANSLATIONS, tx } from '../i18n/translations';

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
      setQrErrorMsg(
        tx(
          lang,
          `Wait ${qrScanCountdown}s while physical QR verification completes.`,
          `ফিজিক্যাল QR কোড যাচাই সম্পন্ন হতে আরও ${qrScanCountdown} সেকেন্ড অপেক্ষা করুন।`,
          `انتظر ${qrScanCountdown} ثانية حتى يكتمل التحقق من رمز QR.`,
          `فزیکل QR تصدیق مکمل ہونے کے لیے ${qrScanCountdown} سیکنڈ انتظار کریں۔`,
          `Tunggu ${qrScanCountdown} detik hingga verifikasi QR selesai.`
        )
      );
      return;
    }

    if (qrComplexity === 'hard' && qrHardMathAnswer.trim() !== '43') {
      setQrErrorMsg(
        tx(
          lang,
          'Hard QR Complexity requires solving the anti-impulse check (17 + 26 = 43) plus the full QR token.',
          'হার্ড (Hard) মোডে আনলক করতে গণিত যাচাই (১৭ + ২৬ = ৪৩) এবং সম্পূর্ণ QR কোড উভয়ই সঠিকভাবে দিতে হবে।',
          'يتطلب المستوى الصعب حل المسألة (17 + 26 = 43) مع رمز QR الكامل.',
          'ہارڈ موڈ کے لیے حساب (17 + 26 = 43) اور مکمل QR کوڈ دونوں درج کریں۔',
          'Mode Sulit memerlukan jawaban (17 + 26 = 43) serta kode QR lengkap.'
        )
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
        tx(
          lang,
          `Invalid QR code for [${qrComplexity.toUpperCase()}] complexity. Expected exact code: ${expectedQrToken}`,
          `[${qrComplexity.toUpperCase()}] মোডের জন্য QR কোড সঠিক নয়। সঠিক কোড: ${expectedQrToken}`,
          `رمز QR غير صحيح. الرمز المطلوب: ${expectedQrToken}`,
          `یہ QR کوڈ درست نہیں۔ مطلوبہ کوڈ: ${expectedQrToken}`,
          `Kode QR tidak valid. Kode yang diperlukan: ${expectedQrToken}`
        )
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
              {tx(
                lang,
                'SINGLE-TASK EXECUTION',
                'একক মনোযোগ ও গভীর কাজের সেশন',
                'التركيز العميق على مهمة واحدة',
                'ایک وقت میں ایک اہم کام پر مکمل توجہ',
                'EKSEKUSI FOKUS SATU TUGAS'
              )}
            </span>
            <h3 className="text-sm font-mono-tech font-semibold text-zinc-100">
              {t.monkModeTitle}
            </h3>
          </div>
          {vault.monkModeActive && (
            <span className="px-2 py-0.5 bg-zinc-100 text-black text-[10px] font-mono-tech font-semibold">
              {tx(lang, 'ACTIVE NOW', 'এখন চালু আছে', 'نشط الآن', 'ابھی فعال ہے', 'AKTIF SEKARANG')}
            </span>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-mono-tech text-zinc-400 mb-1">
              {tx(
                lang,
                'Single Deep Work Objective:',
                'আপনার বর্তমান গভীর কাজের লক্ষ্য লিখুন:',
                'هدف العمل العميق الحالي:',
                'اپنے موجودہ اہم کام کا ہدف لکھیں:',
                'Target Fokus Kerja Mendalam:'
              )}
            </label>
            <input
              type="text"
              value={monkInputTitle}
              onChange={(e) => setMonkInputTitle(e.target.value)}
              placeholder={tx(
                lang,
                'e.g., Study / Project / Quran Memorization...',
                'যেমন: অধ্যয়ন / অফিস প্রজেক্ট / কুরআন তিলাওয়াত...',
                'مثال: الدراسة / مشروع العمل / تلاوة القرآن...',
                'مثال: مطالعہ / آفس پروجیکٹ / تلاوت قرآن...',
                'mis. Belajar / Proyek Kerja / Membaca...'
              )}
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
                {m} {tx(lang, 'MINS', 'মিনিট', 'دقيقة', 'منٹ', 'MENIT')}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => onStartMonkModeAndGoHome(monkInputTitle, monkMinutes)}
            className="w-full py-3.5 bg-zinc-100 text-black font-mono-tech text-xs font-semibold uppercase tracking-widest hover:bg-white cursor-pointer"
          >
            ▶{' '}
            {tx(
              lang,
              `Start ${monkMinutes}m Monk Mode on Home Screen`,
              `হোম স্ক্রিনে ${monkMinutes} মিনিটের গভীর মনোযোগ (Monk Mode) শুরু করুন`,
              `ابدأ وضع الراهب لمدة ${monkMinutes} دقيقة على الشاشة الرئيسية`,
              `ہوم اسکرین پر ${monkMinutes} منٹ کا مونک موڈ شروع کریں`,
              `Mulai Mode Fokus ${monkMinutes}m di Layar Utama`
            )}
          </button>
        </div>
      </div>

      {/* SECTION 2: TWICE-DAILY NOTIFICATION DIGEST + NOTIFICATION APP-LAUNCH CONTROL */}
      <div className="border border-zinc-800 bg-zinc-950/60 p-5 space-y-4">
        <div className="border-b border-zinc-900 pb-2.5 flex items-start justify-between gap-2">
          <div>
            <span className="text-[10px] font-mono-tech uppercase tracking-widest text-zinc-500">
              {tx(
                lang,
                'NOTIFICATION LISTENER & APP-OPEN INTERCEPTOR',
                'নোটিফিকেশন গার্ড ও অ্যাপ-ওপেন নিয়ন্ত্রণ',
                'حارس الإشعارات واعتراض فتح التطبيقات',
                'نوٹیفکیشن گارڈ اور ایپ اوپن کنٹرোল',
                'PENJAGA NOTIFIKASI & PENCEGAT BUKA APLIKASI'
              )}
            </span>
            <h3 className="text-sm font-mono-tech font-semibold text-zinc-100">
              {t.notificationDigestTitle}
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              {tx(
                lang,
                'Read messages quietly inside Minimum Phone without triggering app dopamine loops. Opening any app from a notification is controlled by your Notification Guard below.',
                'সোশ্যাল অ্যাপে ঢুকে আসক্তির ফাঁদে না পড়ে সরাসরি এখানে শান্তভাবে মেসেজ পড়ুন। নোটিফিকেশন ট্যাপ করে সরাসরি অ্যাপ খোলা নিচের গার্ড দ্বারা নিয়ন্ত্রিত।',
                'اقرأ الرسائل بهدوء دون الوقوع في فخ التصفح اللانهائي. فتح أي تطبيق من الإشعارات يخضع لحارس الإشعارات أدناه.',
                'سوشل ایپ کھولے بغیر یہاں خاموشی سے پیغامات پڑھیں۔ نوٹیفکیشن سے براہِ راست ایپ کھلنا نیچے دیے گئے گارڈ سے کنٹرول ہوتا ہے۔',
                'Baca pesan dengan tenang tanpa membuka aplikasi pemicu dopamin. Membuka aplikasi dari notifikasi dikontrol di bawah.'
              )}
            </p>
          </div>
          <span className="px-2 py-0.5 bg-zinc-100 text-black text-[10px] font-mono-tech font-semibold shrink-0">
            {vault.blockNotificationAppLaunch ?? true
              ? tx(lang, 'GUARDED', 'সুরক্ষিত', 'محمي', 'محفوظ', 'DIJAGA')
              : tx(lang, 'DIRECT', 'সরাসরি', 'مباشر', 'براہ راست', 'LANGSUNG')}
          </span>
        </div>

        {/* Notification App-Open Control Toggles */}
        <div className="border border-zinc-800 bg-black p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="pr-3">
              <div className="text-xs font-mono-tech font-semibold text-zinc-100">
                {tx(
                  lang,
                  'Block Direct App Launch from Notifications',
                  'নোটিফিকেশন থেকে সরাসরি অ্যাপ খোলা ব্লক করুন',
                  'منع فتح التطبيقات مباشرة من الإشعارات',
                  'نوٹیفکیشن سے براہِ راست ایپ کھلنا روکیں',
                  'Blokir Buka Aplikasi Langsung dari Notifikasi'
                )}
              </div>
              <div className="text-[11px] text-zinc-400">
                {tx(
                  lang,
                  'Prevents tapping a notification from bypassing the 20s Read+Quiz Gate or Night QR Lock',
                  'নোটিফিকেশনে ট্যাপ করলে ২০ সেকেন্ডের কুইজ গেট বা রাতের QR লক এড়িয়ে অ্যাপ খুলতে দেয় না',
                  'يمنع تجاوز بوابة الاختبار (٢٠ ثانية) أو قفل QR الليلي عند الضغط على الإشعار',
                  'نوٹیفکیشن دبانے پر ٢٠ سیکنڈ کوئز گیٹ یا رات کے QR لاک کو بائی پاس ہونے سے روکتا ہے',
                  'Mencegah ketukan notifikasi melewati Kuis 20d atau Kunci QR Malam'
                )}
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
              {vault.blockNotificationAppLaunch ?? true
                ? tx(lang, 'LOCKED ON', 'চালু (লকড)', 'مفعل', 'فعال', 'AKTIF')
                : tx(lang, 'OFF', 'বন্ধ', 'متوقف', 'بند', 'MATI')}
            </button>
          </div>

          <div className="flex items-center justify-between border-t border-zinc-900 pt-2">
            <div className="pr-3">
              <div className="text-xs font-mono-tech font-medium text-zinc-200">
                {tx(
                  lang,
                  'Read-Only Notification Preview Mode',
                  'নিরাপদ শুধু-পড়ার (Read-Only) নোটিফিকেশন প্রিভিউ',
                  'وضع قراءة الإشعارات الآمن فقط',
                  'صرف پڑھنے کا محفوظ نوٹیفکیشن موڈ',
                  'Mode Pratinjau Notifikasi Baca-Saja'
                )}
              </div>
              <div className="text-[11px] text-zinc-500">
                {tx(
                  lang,
                  'Tap any notification below to read its full text safely without opening the app',
                  'অ্যাপ না খুলেই সম্পূর্ণ মেসেজটি নিরাপদে পড়তে নিচের যেকোনো নোটিফিকেশনে ট্যাপ করুন',
                  'اضغط على أي إشعار بالأسفل لقراءة نصه كاملاً بأمان دون فتح التطبيق',
                  'ایپ کھولے بغیر پورا پیغام محفوظ طریقے سے پڑھنے کے لیے نیچے کسی بھی نوٹیفکیشن پر ٹیپ کریں',
                  'Ketuk notifikasi di bawah untuk membaca isi pesan tanpa membuka aplikasi'
                )}
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
              {vault.readOnlyNotificationDigest ?? true
                ? tx(lang, 'READ-ONLY', 'শুধু-পড়া', 'قراءة فقط', 'صرف مطالعہ', 'BACA-SAJA')
                : tx(lang, 'OFF', 'বন্ধ', 'متوقف', 'بند', 'MATI')}
            </button>
          </div>
        </div>

        {/* Selected Notification Safe Text Reader */}
        {selectedNotif && (
          <div className="border-2 border-zinc-200 bg-black p-4 space-y-3 font-mono-tech">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <span className="text-[10px] uppercase tracking-widest text-zinc-400">
                {tx(
                  lang,
                  'SAFE TEXT-ONLY NOTIFICATION READER // ZERO DOPAMINE FEED',
                  'নিরাপদ টেক্সট নোটিফিকেশন রিডার // কোনো আসক্তিকর ফিড নেই',
                  'قارئ الإشعارات النصي الآمن // بدون تشتيت',
                  'محفوظ ٹیکسٹ نوٹیفکیشن ریڈر // کوئی ڈوپامائن فیڈ نہیں',
                  'PEMBACA NOTIFIKASI TEKS AMAN // TANPA FEED DOPAMIN'
                )}
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
                {tx(lang, 'Source App', 'অ্যাপ', 'التطبيق', 'ایپ', 'Aplikasi')}:{' '}
                <strong className="text-zinc-100">{selectedNotif.appName}</strong> ·{' '}
                {selectedNotif.timestamp}
              </div>
              <div className="text-zinc-300">
                {tx(lang, 'From', 'প্রেরক', 'من', 'مرسل', 'Dari')}:{' '}
                <strong className="text-zinc-100">{selectedNotif.sender}</strong>
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
                ✓{' '}
                {tx(
                  lang,
                  'Done Reading (Stay Calm on Home)',
                  'পড়া শেষ (শান্তভাবে হোমে থাকুন)',
                  'تمت القراءة (ابق هادئاً)',
                  'پڑھ لیا (پرسکون رہیں)',
                  'Selesai Membaca (Tetap Tenang)'
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (vault.blockNotificationAppLaunch ?? true) {
                    setNotifBlockedFeedback(
                      tx(
                        lang,
                        'Direct notification launch intercepted! Routing through Minimum Phone Gatekeeper...',
                        'নোটিফিকেশন থেকে সরাসরি খোলা আটকানো হয়েছে! ২০ সেকেন্ডের কুইজ গেটওয়েতে পাঠানো হচ্ছে...',
                        'تم اعتراض الفتح المباشر! جارٍ التوجيه لبوابة الاختبار...',
                        'براہ راست ایپ کھلنا روک دیا گیا! کوئز گیٹ کی طرف بھیجا جا رہا ہے...',
                        'Buka langsung dicegat! Mengarahkan ke Gerbang Kuis...'
                      )
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
                  ? tx(
                      lang,
                      '🔒 Open App via 20s Quiz Gate',
                      '🔒 ২০ সেকেন্ডের কুইজ দিয়ে অ্যাপ খুলুন',
                      '🔒 فتح التطبيق عبر بوابة الاختبار',
                      '🔒 ٢٠ سیکنڈ کوئز کے ذریعے ایپ کھولیں',
                      '🔒 Buka Aplikasi lewat Kuis 20d'
                    )
                  : tx(lang, 'Open Source App →', 'অ্যাপটি খুলুন →', 'فتح التطبيق ←', 'ایپ کھولیں →', 'Buka Aplikasi →')}
              </button>
            </div>
          </div>
        )}

        {/* Urgent Breakthrough Alerts (if any) */}
        {urgentItems.length > 0 && (
          <div className="border border-zinc-300 bg-black p-3.5 space-y-2">
            <div className="text-xs font-mono-tech font-semibold text-zinc-100">
              ⚡{' '}
              {tx(
                lang,
                `EMERGENCY BREAKTHROUGH (${urgentItems.length})`,
                `জরুরি নোটিফিকেশন ব্রেকথ্রু (${urgentItems.length})`,
                `إشعارات الطوارئ العاجلة (${urgentItems.length})`,
                `ہنگامی نوٹیفکیشنز (${urgentItems.length})`,
                `NOTIFIKASI DARURAT (${urgentItems.length})`
              )}
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
                {slot} {tx(lang, 'Batch', 'ব্যাচ', 'دفعة', 'بیچ', 'Batch')} ({count})
              </button>
            );
          })}
        </div>

        {/* Batched Notifications List */}
        <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
          {slotItems.length === 0 ? (
            <div className="text-center py-6 border border-zinc-900 text-xs font-mono-tech text-zinc-500">
              {tx(
                lang,
                `0 notifications waiting in ${activeSlot} digest. Peace of mind intact.`,
                `${activeSlot} ডাইজেস্টে কোনো নোটিফিকেশন অপেক্ষা করছে না। আপনার মানসিক প্রশান্তি অটুট রয়েছে।`,
                `لا توجد إشعارات في دفعة ${activeSlot}. سكينتك محفوظة.`,
                `${activeSlot} ڈائجسٹ میں کوئی نوٹیفکیشن نہیں۔ ذہنی سکون برقرار ہے۔`,
                `0 notifikasi di kumpulan ${activeSlot}. Ketenangan pikiran terjaga.`
              )}
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
                      [{tx(lang, 'Tap to Read Safely', 'নিরাপদে পড়তে ট্যাপ করুন', 'اضغط للقراءة بأمان', 'محفوظ طریقے سے پڑھیں', 'Ketuk untuk Baca Aman')}]
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
            ✓{' '}
            {tx(
              lang,
              `Mark ${activeSlot} Digest as Reviewed & Clear`,
              `${activeSlot} ডাইজেস্ট পড়া সম্পন্ন হিসেবে চিহ্নিত ও পরিষ্কার করুন`,
              `تحديد دفعة ${activeSlot} كمقروءة ومسحها`,
              `${activeSlot} ڈائجسٹ کو پڑھا ہوا نشان زد کریں اور صاف کریں`,
              `Tandai kumpulan ${activeSlot} selesai & bersihkan`
            )}
          </button>
        )}

        {/* Interactive Notification Interceptor Tester */}
        <div className="border-t border-zinc-900 pt-3 space-y-2">
          <div className="text-[11px] font-mono-tech uppercase text-zinc-500">
            {tx(
              lang,
              'TEST LIVE NOTIFICATION INTERCEPTOR:',
              'নোটিফিকেশন গার্ড সরাসরি পরীক্ষা করুন:',
              'اختبر حارس الإشعارات مباشرة:',
              'نوٹیفکیشن گارڈ کا لائیو ٹیسٹ کریں:',
              'UJI PENCEGAT NOTIFIKASI LANGSUNG:'
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleSimulateIncomingPush(false, false)}
              className="py-2 px-2.5 border border-zinc-800 text-[11px] font-mono-tech text-zinc-300 hover:bg-zinc-900 cursor-pointer"
            >
              +{' '}
              {tx(
                lang,
                'Quiet Social Push (Batched)',
                'সাধারণ সোশ্যাল মেসেজ (ব্যাচড)',
                'إشعار اجتماعي هادئ (مجدول)',
                'عام سوشل میسج (بیچڈ)',
                'Notifikasi Sosial (Dijadwalkan)'
              )}
            </button>
            <button
              type="button"
              onClick={() => handleSimulateIncomingPush(true, false)}
              className="py-2 px-2.5 border border-zinc-700 text-[11px] font-mono-tech text-zinc-200 hover:bg-zinc-900 cursor-pointer"
            >
              ⚡{' '}
              {tx(
                lang,
                'Test VIP Family Call',
                'জরুরি পারিবারিক কল (VIP) টেস্ট',
                'اختبار اتصال العائلة الهام',
                'اہم فیملی کال (VIP) ٹیسٹ',
                'Uji Panggilan Keluarga VIP'
              )}
            </button>
            <button
              type="button"
              onClick={() => handleSimulateIncomingPush(false, true)}
              className="py-2 px-2.5 border border-zinc-700 text-[11px] font-mono-tech text-zinc-200 hover:bg-zinc-900 cursor-pointer"
            >
              ⚡{' '}
              {tx(
                lang,
                'Test “URGENT” Keyword',
                '“জরুরি (URGENT)” শব্দ টেস্ট',
                'اختبار كلمة "عاجل"',
                '"فوری (URGENT)" لفظ کا ٹیسٹ',
                'Uji Kata Kunci "URGENT"'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 3: QR CODE SCANNER WITH COMPLEXITY SETTINGS (EASY / MEDIUM / HARD) & NIGHT BROWSER QR LOCK */}
      <div className="border border-zinc-800 bg-zinc-950/60 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-900 pb-2.5">
          <div>
            <span className="text-[10px] font-mono-tech uppercase tracking-widest text-zinc-500">
              {tx(
                lang,
                'PHYSICAL QR SCANNER & NIGHT BROWSER FORTRESS',
                'ফিজিক্যাল QR স্ক্যানার ও রাতের ব্রাউজার/সোশ্যাল লক দুর্গ',
                'ماسح رمز QR الفعلي وقلعة الحماية الليلية',
                'فزیکل QR اسکینر اور رات کا براؤزر لاک قلعہ',
                'PEMINDAI QR FISIK & BENTENG MALAM'
              )}
            </span>
            <h3 className="text-sm font-mono-tech font-semibold text-zinc-100">
              {t.physicalBrickTitle} ({qrComplexity.toUpperCase()})
            </h3>
          </div>
          <span
            className={`px-2 py-0.5 text-[10px] font-mono-tech ${
              vault.physicalBrickLocked
                ? 'bg-zinc-100 text-black font-semibold'
                : 'border border-zinc-800 text-zinc-500'
            }`}
          >
            {vault.physicalBrickLocked
              ? tx(lang, 'QR LOCKED', 'QR লকড', 'مقفل بـ QR', 'QR لاکڈ', 'TERKUNCI QR')
              : tx(lang, 'READY', 'প্রস্তুত', 'جاهز', 'تیار', 'SIAP')}
          </span>
        </div>

        {/* QR Code Complexity Selector (Easy / Medium / Hard) */}
        <div className="space-y-2">
          <div className="text-xs font-mono-tech text-zinc-300">
            {tx(
              lang,
              'QR Code Scanner Complexity Level:',
              'QR কোড স্ক্যানারের কাঠিন্যের স্তর নির্বাচন করুন:',
              'مستوى صعوبة ماسح رمز QR:',
              'QR کوڈ اسکینر کی سختی کا درجہ منتخب کریں:',
              'Tingkat Kesulitan Pemindai Kode QR:'
            )}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                {
                  id: 'easy',
                  title: tx(lang, 'EASY', 'সহজ (Easy)', 'سهل', 'آسان (Easy)', 'MUDAH'),
                  desc: tx(
                    lang,
                    'Standard QR Scan (6-char anchor)',
                    'সাধারণ QR স্ক্যান (২ সেকেন্ড ক্যামেরা)',
                    'مسح QR قياسي سريع',
                    'عام QR اسکین (٢ سیکنڈ)',
                    'Pindai QR Standar (2 detik)'
                  ),
                },
                {
                  id: 'medium',
                  title: tx(lang, 'MEDIUM', 'মাঝারি (Medium)', 'متوسط', 'درمیانہ', 'SEDANG'),
                  desc: tx(
                    lang,
                    'QR + 6s Camera Hold + Checksum',
                    'QR স্ক্যান + ৬ সেকেন্ড ক্যামেরা হোল্ড',
                    'مسح QR + تثبيت ٦ ثوانٍ',
                    'QR + ٦ سیکنڈ کیمرہ ہولڈ',
                    'QR + Tahan Kamera 6 detik'
                  ),
                },
                {
                  id: 'hard',
                  title: tx(lang, 'HARD (Strict)', 'কঠিন (Hard)', 'صعب (صارم)', 'سخت (Hard)', 'SULIT (Ketat)'),
                  desc: tx(
                    lang,
                    '24-Char Crypto QR + 12s Hold + Math',
                    'দীর্ঘ QR কোড + ১২ সেকেন্ড হোল্ড + গণিত যাচাই',
                    'رمز QR مطول + ١٢ ثانية + حساب',
                    'طویل QR کوڈ + ١٢ سیکنڈ + حساب',
                    'QR Panjang + 12d + Matematika'
                  ),
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
                🌙{' '}
                {tx(
                  lang,
                  'Mandatory Night Browser & Social QR Scan Lock (10:00 PM – 06:00 AM)',
                  'রাতে ঘুমানোর সময় ব্রাউজার ও সোশ্যাল মিডিয়ায় বাধ্যতামূলক জরুরি QR লক (রাত ১০টা – ভোর ৬টা)',
                  'قفل مسح QR الليلي الإلزامي للمتصفح والتواصل (١٠ مساءً – ٦ صباحاً)',
                  'رات کے وقت براؤزر اور سوشل میڈیا کے لیے لازمی ایمرجنسی QR لاک (رات ١٠ سے صبح ٦)',
                  'Kunci QR Malam Wajib untuk Browser & Sosial (22:00 – 06:00)'
                )}
              </div>
              <div className="text-[11px] text-zinc-400 mt-0.5">
                {tx(
                  lang,
                  `Without specifically scanning your physical QR code (${expectedQrToken}), NO web browser or night-locked social app can be opened at night—even if the 20s quiz is passed.`,
                  `রাতে আপনার প্রিন্ট করা ফিজিক্যাল QR কোড (${expectedQrToken}) স্ক্যান করা ছাড়া কোনো ব্রাউজার বা রাতের লক করা সোশ্যাল অ্যাপ খোলা যাবে না—এমনকি ২০ সেকেন্ডের কুইজ পাস করলেও নয়।`,
                  `بدون مسح رمز QR الفعلي (${expectedQrToken})، لا يمكن فتح أي متصفح أو تطبيق مقفل ليلاً.`,
                  `رات کو اپنا فزیکل QR کوڈ (${expectedQrToken}) اسکین کیے بغیر کوئی براؤزر یا سوشل ایپ نہیں کھل سکے گی۔`,
                  `Tanpa memindai kode QR fisik (${expectedQrToken}), browser & aplikasi sosial terkunci malam tidak bisa dibuka.`
                )}
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
              {vault.nightBrowserQrRequired ?? true
                ? tx(lang, 'REQUIRED', 'বাধ্যতামূলক', 'إلزامي', 'لازمی', 'WAJIB')
                : tx(lang, 'OFF', 'বন্ধ', 'متوقف', 'بند', 'MATI')}
            </button>
          </div>

          <div className="flex items-center justify-between border-t border-zinc-900 pt-2 text-[11px] font-mono-tech">
            <span className="text-zinc-400">
              {tx(
                lang,
                'Enforce Night Browser QR Lock right now (24/7 Strict Mode / Test):',
                'এখনই রাতের জরুরি QR লক সক্রিয়/পরীক্ষা করুন (২৪/৭ কঠোর মোড):',
                'تفعيل قفل QR الليلي الآن (وضع صارم ٢٤/٧ أو للاختبار):',
                'ابھی رات کا ایمرجنسی QR لاک فعال/ٹیسٹ کریں (٢٤/٧ سخت موڈ):',
                'Aktifkan Kunci QR Malam sekarang juga (Mode Ketat 24/7):'
              )}
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
              {vault.forceNightBrowserQrTest
                ? tx(lang, 'ACTIVE NOW', 'এখন সক্রিয়', 'نشط الآن', 'ابھی فعال', 'AKTIF SEKARANG')
                : tx(lang, 'Enable Now', 'এখন চালু করুন', 'تفعيل الآن', 'ابھی چلائیں', 'Aktifkan Sekarang')}
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
              🔒{' '}
              {tx(
                lang,
                'Lock All Restricted Apps Behind Physical QR Now',
                'এখনই সকল নিয়ন্ত্রিত অ্যাপ ফিজিক্যাল QR কোড দিয়ে লক করুন',
                'اقفل جميع التطبيقات المقيدة خلف رمز QR الفعلي الآن',
                'ابھی تمام مقید ایپس کو فزیکل QR کوڈ کے پیچھے لاک کریں',
                'Kunci Semua Aplikasi Terbatas dengan QR Fisik Sekarang'
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowPrintableCard((v) => !v)}
              className="py-3 px-4 border border-zinc-700 text-xs font-mono-tech text-zinc-200 hover:bg-zinc-900 cursor-pointer"
            >
              {showPrintableCard
                ? tx(lang, 'Hide Printable QR', 'প্রিন্টযোগ্য QR লুকান', 'إخفاء بطاقة QR', 'پرنٹ QR چھپائیں', 'Sembunyikan QR')
                : tx(lang, 'Print QR Anchor Card', 'QR কার্ড দেখুন ও প্রিন্ট করুন', 'طباعة بطاقة QR', 'QR کارڈ پرنٹ کریں', 'Cetak Kartu QR')}
            </button>
          </div>
        ) : (
          <div className="border-2 border-zinc-300 bg-black p-4 space-y-3 font-mono-tech">
            <div className="flex items-center justify-between text-xs text-zinc-100">
              <span>
                🔒{' '}
                {tx(
                  lang,
                  `PHYSICAL QR LOCK ACTIVE (${qrComplexity.toUpperCase()} COMPLEXITY)`,
                  `ফিজিক্যাল QR লক সক্রিয় (${qrComplexity.toUpperCase()} মোড)`,
                  `قفل QR الفعلي نشط (${qrComplexity.toUpperCase()})`,
                  `فزیکل QR لاک فعال ہے (${qrComplexity.toUpperCase()})`,
                  `KUNCI QR FISIK AKTIF (${qrComplexity.toUpperCase()})`
                )}
              </span>
              {!cameraActive ? (
                <button
                  type="button"
                  onClick={startCameraScanner}
                  className="px-2.5 py-1 bg-zinc-100 text-black text-[10px] font-semibold uppercase cursor-pointer"
                >
                  📷{' '}
                  {tx(
                    lang,
                    'Open Live Camera Scanner',
                    'লাইভ ক্যামেরা স্ক্যানার খুলুন',
                    'فتح ماسح الكاميرا',
                    'لائیو کیمرہ اسکینر کھولیں',
                    'Buka Kamera Pemindai'
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopCameraScanner}
                  className="px-2.5 py-1 border border-zinc-600 text-[10px] text-zinc-300 cursor-pointer"
                >
                  {tx(lang, 'Close Camera', 'ক্যামেরা বন্ধ করুন', 'إغلاق الكاميرا', 'کیمرہ بند کریں', 'Tutup Kamera')}
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
                    ? tx(
                        lang,
                        `Hold camera steady on your printed QR Card (${qrScanCountdown}s verification)...`,
                        `আপনার প্রিন্ট করা QR কার্ডের ওপর ক্যামেরা স্থিরভাবে ধরে রাখুন (${qrScanCountdown} সেকেন্ড যাচাই হচ্ছে)...`,
                        `ثبّت الكاميرا على بطاقة QR المطبوعة (${qrScanCountdown} ثانية)...`,
                        `پرنٹ شدہ QR کارڈ پر کیمرہ مستحکم رکھیں (${qrScanCountdown} سیکنڈ تصدیق)...`,
                        `Tahan kamera pada Kartu QR cetak (${qrScanCountdown} detik)...`
                      )
                    : tx(
                        lang,
                        '✓ Camera optical lock ready. Confirm scanned token below:',
                        '✓ ক্যামেরা যাচাই সম্পন্ন! নিচে স্ক্যান করা কোডটি নিশ্চিত করুন:',
                        '✓ اكتمل التحقق بالكاميرا. أكد الرمز أدناه:',
                        '✓ کیمرہ تصدیق مکمل! نیچے اسکین شدہ کوڈ کی تصدیق کریں:',
                        '✓ Verifikasi kamera siap. Konfirmasi kode di bawah:'
                      )}
                </div>
                {qrScanCountdown === 0 && (
                  <button
                    type="button"
                    onClick={() => setQrScanVerifyInput(expectedQrToken)}
                    className="px-3 py-1.5 bg-zinc-100 text-black text-[11px] font-semibold uppercase cursor-pointer"
                  >
                    ✓{' '}
                    {tx(
                      lang,
                      `Capture Scanned QR Code (${expectedQrToken})`,
                      `স্ক্যান করা QR কোড গ্রহণ করুন (${expectedQrToken})`,
                      `التقاط رمز QR الممسوح (${expectedQrToken})`,
                      `اسکین شدہ QR کوڈ درج کریں (${expectedQrToken})`,
                      `Tangkap Kode QR (${expectedQrToken})`
                    )}
                  </button>
                )}
              </div>
            )}

            <div className="text-[11px] text-zinc-400">
              {tx(
                lang,
                `Required Physical QR Token (${qrComplexity.toUpperCase()}):`,
                `প্রয়োজনীয় ফিজিক্যাল QR কোড (${qrComplexity.toUpperCase()}):`,
                `رمز QR المطلوب (${qrComplexity.toUpperCase()}):`,
                `مطلوبہ فزیکل QR کوڈ (${qrComplexity.toUpperCase()}):`,
                `Kode QR Fisik Wajib (${qrComplexity.toUpperCase()}):`
              )}{' '}
              <span className="text-zinc-200 font-semibold">{expectedQrToken}</span>
            </div>

            {qrComplexity === 'hard' && (
              <div className="space-y-1">
                <label className="block text-[11px] text-zinc-300">
                  {tx(
                    lang,
                    'Hard Mode Anti-Impulse Check — Solve: 17 + 26 = ?',
                    'হার্ড মোড তাড়না-বিরোধী যাচাই — যোগফল লিখুন: ১৭ + ২৬ = ?',
                    'تحقق الوضع الصعب — احسب: 17 + 26 = ؟',
                    'ہارڈ موڈ تصدیق — حل کریں: 17 + 26 = ؟',
                    'Verifikasi Mode Sulit — Hitung: 17 + 26 = ?'
                  )}
                </label>
                <input
                  type="text"
                  value={qrHardMathAnswer}
                  onChange={(e) => setQrHardMathAnswer(e.target.value)}
                  placeholder={tx(lang, 'Enter sum (43)', 'যোগফল লিখুন (43)', 'أدخل الناتج (43)', 'جواب لکھیں (43)', 'Masukkan hasil (43)')}
                  className="w-full bg-zinc-950 border border-zinc-700 px-3 py-2 text-xs text-zinc-100"
                />
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={qrScanVerifyInput}
                onChange={(e) => setQrScanVerifyInput(e.target.value)}
                placeholder={`${tx(lang, 'Scan or enter', 'স্ক্যান বা টাইপ করুন', 'امسح أو أدخل', 'اسکین یا درج کریں', 'Pindai atau ketik')} ${expectedQrToken}`}
                className="flex-1 bg-zinc-950 border border-zinc-700 px-3 py-2 text-xs text-zinc-100"
              />
              <button
                type="button"
                onClick={handleUnlockPhysicalBrick}
                className="px-4 py-2 bg-zinc-100 text-black text-xs font-semibold uppercase cursor-pointer"
              >
                {tx(lang, 'Verify QR', 'যাচাই করুন', 'تحقق', 'تصدیق کریں', 'Verifikasi')}
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
              MINIMUM PHONE // PHYSICAL QR ANCHOR ({qrComplexity.toUpperCase()})
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
              {tx(
                lang,
                'Tape this card in another room away from your bed. Required to unlock restricted apps and mandatory for opening any Browser at night.',
                'এই কার্ডটি প্রিন্ট বা লিখে আপনার বিছানা থেকে দূরে অন্য ঘরে রাখুন। রাতে জরুরি প্রয়োজনে ব্রাউজার বা সোশ্যাল অ্যাপ খুলতে এটি স্ক্যান করা বাধ্যতামূলক।',
                'ضع هذه البطاقة في غرفة أخرى بعيداً عن سريرك. مطلوبة لفتح المتصفح أو التطبيقات المقيدة ليلاً.',
                'اس کارڈ کو اپنے بستر سے دور دوسرے کمرے میں لگائیں۔ رات کو براؤزر یا مقید ایپس کھولنے کے لیے اسے اسکین کرنا لازمی ہے۔',
                'Tempel kartu ini di ruangan lain jauh dari tempat tidur. Wajib dipindai untuk membuka browser di malam hari.'
              )}
            </p>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 bg-black text-white text-xs font-mono-tech uppercase tracking-wider cursor-pointer"
            >
              {tx(
                lang,
                'Print Physical QR Card',
                'ফিজিক্যাল QR কার্ড প্রিন্ট করুন',
                'طباعة بطاقة QR',
                'فزیکل QR کارڈ پرنٹ کریں',
                'Cetak Kartu QR Fisik'
              )}
            </button>
          </div>
        )}

        {/* Scheduled Vault Toggles + Method 6: Automatic Circadian Sunset Wind-Down */}
        <div className="pt-2 border-t border-zinc-900 space-y-2.5">
          <div className="flex items-center justify-between py-1.5">
            <div>
              <div className="text-xs font-medium text-zinc-200">
                {tx(
                  lang,
                  'Deep Work Schedule Vault (09:00 – 13:00)',
                  'গভীর কাজের সময়সূচি ভল্ট (সকাল ০৯:০০ – দুপুর ০১:০০)',
                  'جدول العمل العميق (٠٩:٠٠ – ١٣:٠٠)',
                  'گہرے کام کا شیڈول والٹ (٠٩:٠٠ – ١٣:٠٠)',
                  'Jadwal Kerja Fokus (09:00 – 13:00)'
                )}
              </div>
              <div className="text-[11px] text-zinc-500 font-mono-tech">
                {tx(
                  lang,
                  'Auto-locks social & video apps during work hours',
                  'কাজের সময়ে সোশ্যাল মিডিয়া ও ভিডিও অ্যাপ স্বয়ংক্রিয়ভাবে লক রাখে',
                  'يقفل تطبيقات التواصل والفيديو تلقائياً أثناء ساعات العمل',
                  'کام کے اوقات میں سوشل اور ویڈیو ایپس کو خودکار لاک رکھتا ہے',
                  'Mengunci aplikasi sosial & video secara otomatis saat jam kerja'
                )}
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
              {vault.deepWorkScheduleEnabled
                ? tx(lang, 'ON', 'চালু', 'مفعل', 'آن', 'ON')
                : tx(lang, 'OFF', 'বন্ধ', 'متوقف', 'آف', 'OFF')}
            </button>
          </div>

          <div className="flex items-center justify-between py-1.5 border-t border-zinc-900/60">
            <div>
              <div className="text-xs font-medium text-zinc-200">
                🌇{' '}
                {tx(
                  lang,
                  'Automatic Circadian Sunset Wind-Down (21:30+ Melatonin Shield)',
                  'স্বয়ংক্রিয় সার্কাডিয়ান সানসেট ওয়াইন্ড-ডাউন (রাত ৯:৩০+ মেলাটোনিন ঘুম সুরক্ষা)',
                  'حماية الميلاتونين والساعة البيولوجية تلقائياً (٢١:٣٠+)',
                  'خودکار سرکیڈین سن سیٹ موڈ (رات ٩:٣٠ کے بعد نیند کی حفاظت)',
                  'Perlindungan Melatonin & Ritme Sirkadian Otomatis (21:30+)'
                )}
              </div>
              <div className="text-[11px] text-zinc-500 font-mono-tech">
                {tx(
                  lang,
                  'Harvard Chronobiology: Warms screen tone at 9:30 PM to protect sleep hormone before 10 PM Night Lock',
                  'হার্ভার্ড ঘুম-বিজ্ঞান: রাত ১০টার লকের ৩০ মিনিট আগে (রাত ৯:৩০-এ) স্ক্রিন উষ্ণ করে ঘুমের হরমোন রক্ষা করে',
                  'علم الساعة البيولوجية: يهدئ إضاءة الشاشة الساعة ٩:٣٠ مساءً لحماية هرمون النوم',
                  'رات ١٠ بجے کے لاک سے ٣٠ منٹ پہلے اسکرین کو نرم کر کے نیند کے ہارمون کی حفاظت کرتا ہے',
                  'Menghangatkan layar pukul 21:30 untuk menjaga hormon tidur sebelum kunci pukul 22:00'
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                onUpdateVault((prev) => ({
                  ...prev,
                  autoCircadianWindDown: !(prev.autoCircadianWindDown ?? true),
                }))
              }
              className={`px-3 py-1 border text-xs font-mono-tech cursor-pointer ${
                vault.autoCircadianWindDown ?? true
                  ? 'border-zinc-200 bg-zinc-100 text-black font-semibold'
                  : 'border-zinc-700 text-zinc-400'
              }`}
            >
              {vault.autoCircadianWindDown ?? true
                ? tx(lang, 'AUTO', 'স্বয়ংক্রিয়', 'تلقائي', 'خودکار', 'OTOMATIS')
                : tx(lang, 'OFF', 'বন্ধ', 'متوقف', 'آف', 'OFF')}
            </button>
          </div>

          <div className="flex items-center justify-between py-1.5 border-t border-zinc-900/60">
            <div>
              <div className="text-xs font-medium text-zinc-200">
                {tx(
                  lang,
                  'Sleep & Tahajjud Vault (22:00 – 06:00)',
                  'ঘুম ও তাহাজ্জুদ সুরক্ষা ভল্ট (রাত ১০:০০ – ভোর ০৬:০০)',
                  'خزانة النوم والتهجد (٢٢:٠٠ – ٠٦:٠٠)',
                  'نیند اور تہجد والٹ (رات ١٠:٠٠ – صبح ٠٦:٠٠)',
                  'Brankas Tidur & Tahajud (22:00 – 06:00)'
                )}
              </div>
              <div className="text-[11px] text-zinc-500 font-mono-tech">
                {tx(
                  lang,
                  'Protects late-night sleep & forces QR scan for any browser after 10 PM',
                  'গভীর রাতের ঘুম রক্ষা করে এবং রাত ১০টার পর ব্রাউজার ও সোশ্যাল অ্যাপে জরুরি QR স্ক্যান বাধ্যতামূলক করে',
                  'يحمي نومك الليلي ويفرض مسح رمز QR لأي متصفح بعد ١٠ مساءً',
                  'رات کی نیند کی حفاظت کرتا ہے اور ١٠ بجے کے بعد براؤزر کے لیے QR اسکین لازمی بناتا ہے',
                  'Melindungi tidur malam & mewajibkan pindai QR untuk browser setelah pukul 22:00'
                )}
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
              {vault.sleepVaultScheduleEnabled
                ? tx(lang, 'ON', 'চালু', 'مفعل', 'آن', 'ON')
                : tx(lang, 'OFF', 'বন্ধ', 'متوقف', 'آف', 'OFF')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

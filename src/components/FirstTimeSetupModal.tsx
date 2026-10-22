import React, { useState } from 'react';
import type {
  InspirationMode,
  LanguageCode,
  SlowLearningTrack,
} from '../types/app';
import { SUPPORTED_LANGUAGES, tx } from '../i18n/translations';
import {
  openPhoneMainSetting,
  requestDefaultHomeLauncher,
} from '../services/nativeLauncherBridge';

interface FirstTimeSetupModalProps {
  lang: LanguageCode;
  onChangeLanguage: (lang: LanguageCode) => void;
  inspirationMode: InspirationMode;
  onChangeInspirationMode: (mode: InspirationMode) => void;
  slowLearningTrack: SlowLearningTrack;
  onChangeSlowLearningTrack: (track: SlowLearningTrack) => void;
  qrCodeToken?: string;
  qrAnchorCode?: string;
  onApplyNormalCallingAndNightLockPreset?: () => void;
  onCompleteSetup: () => void;
}

export const FirstTimeSetupModal: React.FC<FirstTimeSetupModalProps> = ({
  lang,
  onChangeLanguage,
  inspirationMode,
  onChangeInspirationMode,
  slowLearningTrack,
  onChangeSlowLearningTrack,
  qrCodeToken: qrCodeTokenProp,
  qrAnchorCode,
  onCompleteSetup,
}) => {
  const qrCodeToken = qrCodeTokenProp || qrAnchorCode || 'KASB-BRICK-77';
  const [step, setStep] = useState<number>(1);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const totalSteps = 5;

  const handleCopyDnsAndOpen = async (hostname: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(hostname);
      }
    } catch {
      // Ignore clipboard error
    }
    await openPhoneMainSetting('dns');
    setActionFeedback(
      tx(
        lang,
        `✓ Copied "${hostname}" & opened Android Private DNS settings! Paste it into Private DNS provider hostname and tap Save.`,
        `✓ "${hostname}" কপি করা হয়েছে এবং ফোনের Private DNS সেটিংস খোলা হয়েছে! সেখানে পেস্ট করে Save চাপুন।`,
        `✓ تم نسخ "${hostname}" وفتح إعدادات Private DNS! الصقه هناك واضغط حفظ.`,
        `✓ "${hostname}" کاپی ہو گیا اور Private DNS سیٹنگز کھل گئیں! وہاں پیسٹ کر کے Save دبائیں۔`,
        `✓ "${hostname}" disalin & setelan Private DNS dibuka! Tempel lalu ketuk Simpan.`
      )
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 text-zinc-100 flex items-center justify-center p-3 sm:p-5 overflow-y-auto overflow-x-hidden safe-shell">
      <div className="w-full max-w-md border-2 border-zinc-200 bg-zinc-950 p-4 sm:p-5 space-y-4 my-auto">
        {/* Top Progress Header */}
        <div className="flex items-center justify-between gap-2 border-b border-zinc-800 pb-2.5">
          <div className="min-w-0">
            <div className="text-[10px] font-mono-tech uppercase tracking-widest text-zinc-400">
              {tx(
                lang,
                `EASY FIRST-TIME SETUP · STEP ${step} OF ${totalSteps}`,
                `সহজ প্রথমবার সেটআপ · ধাপ ${step} / ${totalSteps}`,
                `الإعداد السهل لأول مرة · الخطوة ${step} من ${totalSteps}`,
                `آسان ابتدائی سیٹ اپ · مرحلہ ${step} از ${totalSteps}`,
                `PANDUAN AWAL MUDAH · LANGKAH ${step} DARI ${totalSteps}`
              )}
            </div>
            <h2 className="text-sm sm:text-base font-mono-tech font-bold text-zinc-100 mt-0.5 truncate">
              {tx(
                lang,
                'Welcome to Minimum Phone',
                'মিনিমাম ফোনে আপনাকে স্বাগতম',
                'مرحباً بك في الهاتف الأدنى (Minimum Phone)',
                'منیمم فون (Minimum Phone) میں خوش آمدید',
                'Selamat Datang di Minimum Phone'
              )}
            </h2>
          </div>
          <button
            type="button"
            onClick={onCompleteSetup}
            className="px-2.5 py-1 border border-zinc-700 text-[11px] font-mono-tech text-zinc-300 hover:text-white cursor-pointer shrink-0"
          >
            {tx(lang, 'Skip ✕', 'স্কিপ ✕', 'تخطي ✕', 'چھوڑیں ✕', 'Lewati ✕')}
          </button>
        </div>

        {/* Always-Visible Instant Language Bar */}
        <div className="space-y-1">
          <div className="text-[10px] font-mono-tech text-zinc-400">
            {tx(
              lang,
              '🌐 Tap your language (100% full app translation):',
              '🌐 আপনার ভাষা নির্বাচন করুন (সম্পূর্ণ অ্যাপ বাংলায় দেখুন):',
              '🌐 اختر لغتك (ترجمة كاملة لجميع الصفحات):',
              '🌐 اپنی زبان منتخب کریں (مکمل ایپ ترجمہ):',
              '🌐 Pilih bahasa Anda (terjemahan penuh):'
            )}
          </div>
          <div className="grid grid-cols-5 gap-1">
            {SUPPORTED_LANGUAGES.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => {
                  onChangeLanguage(l.code);
                  setActionFeedback(null);
                }}
                className={`py-1.5 px-1 border text-[11px] font-mono-tech text-center truncate cursor-pointer ${
                  lang === l.code
                    ? 'border-zinc-100 bg-zinc-100 text-black font-bold'
                    : 'border-zinc-800 bg-black text-zinc-300'
                }`}
              >
                {l.nativeName}
              </button>
            ))}
          </div>
        </div>

        {/* Step Progress Dots */}
        <div className="grid grid-cols-5 gap-1.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setStep(s);
                setActionFeedback(null);
              }}
              className={`h-1.5 transition cursor-pointer ${
                s === step
                  ? 'bg-zinc-100'
                  : s < step
                  ? 'bg-zinc-500'
                  : 'bg-zinc-800'
              }`}
            />
          ))}
        </div>

        {/* ============================================================
            STEP 1: LANGUAGE, INSPIRATION MODE & LEARNING TRACK
           ============================================================ */}
        {step === 1 && (
          <div className="border border-zinc-800 bg-black p-3.5 space-y-3">
            <div className="text-xs font-mono-tech font-bold text-zinc-100">
              {tx(
                lang,
                'Step 1: Choose Your Inspiration & 20-Sec Learning Mode',
                'ধাপ ১: আপনার অনুপ্রেরণা এবং ২০-সেকেন্ড শিক্ষার বিষয় বেছে নিন',
                'الخطوة ١: اختر نمط الإلهام ومسار التعلم السريع (٢٠ ثانية)',
                'مرحلہ 1: اپنی ترغیب اور 20 سیکنڈ سیکھنے کا موضوع منتخب کریں',
                'Langkah 1: Pilih Mode Inspirasi & Topik Belajar 20 Detik'
              )}
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              {tx(
                lang,
                'Whenever you open a distracting social media app, Minimum Phone shows a short 12-second reading passage and 1 easy quiz question (completed within 20 seconds) so every impulse turns into knowledge.',
                'আপনি যখনই ফেসবুক, ইউটিউব বা ইনস্টাগ্রামের মতো আসক্তিকর অ্যাপ খুলতে যাবেন, মিনিমাম ফোন আপনাকে ছোট্ট ১২ সেকেন্ডের একটি শিক্ষণীয় পাঠ ও ১টি সহজ কুইজ দেখাবে (যা ২০ সেকেন্ডেই শেষ করা যায়)। ফলে ফোনের প্রতিটি আসক্তি জ্ঞানে পরিণত হবে।',
                'عند محاولة فتح تطبيق مشتت، يعرض لك التطبيق فقرة قصيرة (١٢ ثانية) وسؤالاً واحداً سهلاً (خلال ٢٠ ثانية) لتحويل العادة التلقائية إلى علم نافع.',
                'جب بھی آپ کوئی سوشل میڈیا ایپ کھولیں گے، منیمم فون 12 سیکنڈ کا مختصر سبق اور 1 آسان سوال دکھائے گا جو 20 سیکنڈ میں مکمل ہو جاتا ہے۔',
                'Saat membuka aplikasi sosial, Minimum Phone menampilkan bacaan singkat 12 detik & 1 kuis mudah (selesai dalam 20 detik).'
              )}
            </p>

            <div className="space-y-1.5">
              <div className="text-[11px] font-mono-tech text-zinc-400">
                {tx(
                  lang,
                  'Choose Inspiration Mode:',
                  'অনুপ্রেরণার ধরন নির্বাচন করুন:',
                  'اختر نمط الإلهام:',
                  'ترغیب کا انداز منتخب کریں:',
                  'Pilih Mode Inspirasi:'
                )}
              </div>
              {(
                [
                  {
                    id: 'islamic',
                    label: tx(
                      lang,
                      '🕌 Fully Islamic (Quran, Sahih Hadith & Sunnah)',
                      '🕌 সম্পূর্ণ ইসলামিক (কুরআন, সহীহ হাদীস ও সুন্নাহ)',
                      '🕌 إسلامي كامل (القرآن الكريم والسنة النبوية)',
                      '🕌 مکمل اسلامی (قرآن، صحیح حدیث اور سنت)',
                      '🕌 Islami Penuh (Al-Quran & Hadits Sahih)'
                    ),
                  },
                  {
                    id: 'universal',
                    label: tx(
                      lang,
                      '🌍 Common for All (Universal Focus & Neuroscience)',
                      '🌍 সকলের জন্য সার্বজনীন (মনোযোগ বিজ্ঞান ও প্রজ্ঞা)',
                      '🌍 عالمي للجميع (حكم وعلوم التركيز)',
                      '🌍 سب کے لیے عمومی (عالمگیر حکمت اور فوکس سائنس)',
                      '🌍 Universal untuk Semua (Sains Fokus & Kebijaksanaan)'
                    ),
                  },
                  {
                    id: 'blended',
                    label: tx(
                      lang,
                      '✨ Blended Mode (Islamic Sakīnah + Focus Science)',
                      '✨ সমন্বিত মুড (ইসলামিক সাকীনাহ + মনোযোগ বিজ্ঞান)',
                      '✨ الوضع المدمج (السكينة الإسلامية + علوم التركيز)',
                      '✨ ملا جلا موڈ (اسلامی سکینہ + فوکس سائنس)',
                      '✨ Mode Campuran (Sakinah Islam + Sains Fokus)'
                    ),
                  },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onChangeInspirationMode(m.id)}
                  className={`w-full text-left px-3 py-2 border text-xs font-mono-tech cursor-pointer ${
                    inspirationMode === m.id
                      ? 'border-zinc-100 bg-zinc-100 text-black font-bold'
                      : 'border-zinc-800 bg-zinc-950 text-zinc-300'
                  }`}
                >
                  {inspirationMode === m.id ? '● ' : '○ '}
                  {m.label}
                </button>
              ))}
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="text-[11px] font-mono-tech text-zinc-400">
                {tx(
                  lang,
                  'Choose 20-Second Quiz Topic:',
                  '২০-সেকেন্ড কুইজের বিষয় বেছে নিন:',
                  'اختر موضوع اختبار ٢٠ ثانية:',
                  '20 سیکنڈ کوئز کا موضوع منتخب کریں:',
                  'Pilih Topik Kuis 20 Detik:'
                )}
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    {
                      id: 'islam',
                      label: tx(lang, '📖 Islam', '📖 ইসলাম', '📖 الإسلام', '📖 اسلام', '📖 Islam'),
                    },
                    {
                      id: 'language',
                      label: tx(lang, '🗣️ Language', '🗣️ ভাষা শিক্ষা', '🗣️ اللغات', '🗣️ زبان', '🗣️ Bahasa'),
                    },
                    {
                      id: 'mindfulness',
                      label: tx(lang, '🧠 Focus', '🧠 মনোযোগ বিজ্ঞান', '🧠 التركيز', '🧠 فوکس', '🧠 Fokus'),
                    },
                  ] as const
                ).map((tr) => (
                  <button
                    key={tr.id}
                    type="button"
                    onClick={() => onChangeSlowLearningTrack(tr.id)}
                    className={`py-2 px-1.5 border text-[11px] font-mono-tech text-center cursor-pointer ${
                      slowLearningTrack === tr.id
                        ? 'border-zinc-100 bg-zinc-100 text-black font-bold'
                        : 'border-zinc-800 bg-zinc-950 text-zinc-300'
                    }`}
                  >
                    {tr.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            STEP 2: SET DEFAULT HOME LAUNCHER & WI-FI / BT SHORTCUTS
           ============================================================ */}
        {step === 2 && (
          <div className="border border-zinc-800 bg-black p-3.5 space-y-3">
            <div className="text-xs font-mono-tech font-bold text-zinc-100">
              {tx(
                lang,
                'Step 2: Make Minimum Phone Your Default Home Screen',
                'ধাপ ২: মিনিমাম ফোনকে আপনার ডিফল্ট হোম স্ক্রিন (Default Home) করুন',
                'الخطوة ٢: اجعل Minimum Phone الشاشة الرئيسية الافتراضية',
                'مرحلہ 2: منیمم فون کو اپنا ڈیفالٹ ہوم اسکرین بنائیں',
                'Langkah 2: Jadikan Minimum Phone Layar Beranda Utama'
              )}
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              {tx(
                lang,
                'Why this matters: When you press your phone’s Home button, Minimum Phone keeps you on a calm, monochrome screen instead of returning to colorful app icons that trigger dopamine cravings.',
                'কেন এটি জরুরি: এটি চালু করলে ফোনের হোম (Home) বাটন চাপলে আগের রঙিন আইকনযুক্ত স্ক্রিনে না গিয়ে সরাসরি এই প্রশান্ত সাদাকালো স্ক্রিনে থাকবে—ফলে অকারণে ফোন স্ক্রল করার নেশা বন্ধ হবে।',
                'لماذا هذا مهم: عند الضغط على زر الرئيسية في هاتفك، يبقيك التطبيق في شاشة هادئة خالية من الألوان المغرية والمشتتات.',
                'یہ کیوں ضروری ہے: ہوم بٹن دبانے پر آپ کا فون رنگین آئیکنز کے بجائے اس پرسکون اسکرین پر رہے گا۔',
                'Mengapa penting: Menekan tombol Home akan selalu membuka layar tenang ini, bukan ikon warna-warni pemicu dopamin.'
              )}
            </p>

            <button
              type="button"
              onClick={async () => {
                await requestDefaultHomeLauncher();
                setActionFeedback(
                  tx(
                    lang,
                    '✓ Opened Home App selector! Select "Minimum Phone" and tap "Always".',
                    '✓ ডিফল্ট হোম অ্যাপ অপশন খোলা হয়েছে! সেখানে "Minimum Phone" সিলেক্ট করে "Always" চাপুন।',
                    '✓ تم فتح نافذة اختيار الشاشة الرئيسية! اختر Minimum Phone واضغط دائماً.',
                    '✓ ہوم ایپ سلیکٹر کھل گیا! وہاں Minimum Phone منتخب کریں۔',
                    '✓ Pemilih Beranda dibuka! Pilih "Minimum Phone" lalu ketuk Selalu.'
                  )
                );
              }}
              className="w-full py-3 bg-zinc-100 text-black font-mono-tech text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              {tx(
                lang,
                '🏠 Tap Here to Set as Default Home App →',
                '🏠 ডিফল্ট হোম লঞ্চার সেট করতে এখানে ট্যাপ করুন →',
                '🏠 اضغط هنا لتعيينه كشاشة رئيسية افتراضية ←',
                '🏠 ڈیفالٹ ہوم ایپ بنانے کے لیے یہاں ٹیپ کریں ←',
                '🏠 Ketuk untuk Setel sebagai Beranda Utama →'
              )}
            </button>

            <div className="p-2.5 border border-zinc-800 bg-zinc-950 text-[11px] text-zinc-300 leading-relaxed">
              {tx(
                lang,
                '💡 Tip: Wi-Fi, Bluetooth, Private DNS, Mobile Data, Display, and Sound buttons are right at the top of your Home Screen for 1-tap access anytime!',
                '💡 টিপস: ওয়াই-ফাই (Wi-Fi), ব্লুটুথ (BT), প্রাইভেট DNS, ডাটা, ডিসপ্লে ও সাউন্ড বাটনগুলো হোম স্ক্রিনের একদম উপরেই রয়েছে—এক ট্যাপেই খোলা যাবে!',
                '💡 نصيحة: أزرار الواي فاي والبلوتوث و DNS والبيانات والصوت موجودة أعلى الشاشة الرئيسية بضغطة واحدة!',
                '💡 ٹپ: وائی فائی، بلوٹوتھ، DNS، ڈیٹا اور ساؤنڈ کے بٹن ہوم اسکرین کے بالکل اوپر موجود ہیں!',
                '💡 Tips: Tombol Wi-Fi, Bluetooth, DNS, Data, Layar & Suara tersedia di bagian atas Beranda!'
              )}
            </div>
          </div>
        )}

        {/* ============================================================
            STEP 3: WHATSAPP & CALLS NORMAL + SOCIAL MEDIA RESTRICTED
           ============================================================ */}
        {step === 3 && (
          <div className="border border-zinc-800 bg-black p-3.5 space-y-3">
            <div className="text-xs font-mono-tech font-bold text-zinc-100">
              {tx(
                lang,
                'Step 3: Calling, SMS & WhatsApp Are Normal — Social Media Is Gated',
                'ধাপ ৩: কল, মেসেজ ও WhatsApp স্বাভাবিক থাকবে — সোশ্যাল মিডিয়া নিয়ন্ত্রিত',
                'الخطوة ٣: المكالمات والرسائل وواتساب تفتح فوراً — وتطبيقات التشتيت مقيدة',
                'مرحلہ 3: کالز، میسجز اور واٹس ایپ نارمل ہیں — سوشل میڈیا پر کنٹرول ہے',
                'Langkah 3: Telepon, SMS & WhatsApp Normal — Media Sosial Dijaga'
              )}
            </div>
            <ul className="space-y-2 text-xs text-zinc-300 leading-relaxed list-disc pl-4">
              <li>
                {tx(
                  lang,
                  '📞 Phone Calls, Messages (SMS), and WhatsApp are pinned at the top of your Home Screen as normal apps—they open immediately with zero quiz delay, day or night.',
                  '📞 ফোন কল (Phone Calls), মেসেজ (SMS) এবং হোয়াটসঅ্যাপ (WhatsApp) আপনার হোম স্ক্রিনের শুরুতেই স্বাভাবিক কলিং/মেসেজিং অ্যাপ হিসেবে পিন করা আছে—দিন বা রাত যেকোনো সময় কোনো কুইজ ছাড়াই সাথে সাথে খুলবে।',
                  '📞 المكالمات والرسائل وواتساب مثبتة في أعلى الشاشة الرئيسية وتفتح فوراً بدون أي تأخير ليلاً أو نهاراً.',
                  '📞 فون کالز، میسجز (SMS) اور واٹس ایپ ہوم اسکرین پر نارمل ایپس کے طور پر موجود ہیں اور بغیر کسی کوئز کے فوراً کھلتے ہیں۔',
                  '📞 Panggilan Telepon, Pesan (SMS), dan WhatsApp disematkan di Beranda dan langsung terbuka tanpa kuis.'
                )}
              </li>
              <li>
                {tx(
                  lang,
                  '📚 Social Media & Video apps (Facebook, Instagram, YouTube, TikTok) require the 20-Second Quick Quiz before opening, and automatically show a 5-min reminder, 10-min warning, and 20-min auto-close.',
                  '📚 সোশ্যাল মিডিয়া ও ভিডিও অ্যাপ (Facebook, Instagram, YouTube, TikTok) খোলার আগে ২০-সেকেন্ড কুইজ দিতে হবে এবং চালানোর ৫ মিনিটে মৃদু বার্তা, ১০ মিনিটে সতর্কবার্তা এবং ২০ মিনিটে অটো-ক্লোজ হবে।',
                  '📚 تطبيقات التواصل والفيديو تتطلب اختبار ٢٠ ثانية قبل الفتح، مع تنبيه بعد ٥ دقائق، وتحذير بعد ١٠ دقائق، وإغلاق تلقائي بعد ٢٠ دقيقة.',
                  '📚 سوشل میڈیا اور ویڈیو ایپس کھولنے کے لیے 20 سیکنڈ کوئز لازمی ہے، اور 5، 10 اور 20 منٹ پر خودکار کنٹرول کام کرتا ہے۔',
                  '📚 Media sosial & video wajib melewati Kuis 20 Detik serta pengingat otomatis 5m, 10m, dan tutup otomatis 20m.'
                )}
              </li>
            </ul>
          </div>
        )}

        {/* ============================================================
            STEP 4: 1-TAP PRIVATE SAFE DNS (ANTI-PORN & FAMILY PROTECTION)
           ============================================================ */}
        {step === 4 && (
          <div className="border border-zinc-800 bg-black p-3.5 space-y-3">
            <div className="text-xs font-mono-tech font-bold text-zinc-100">
              {tx(
                lang,
                'Step 4: 1-Tap Private Safe DNS (Complete Porn & Malware Shield)',
                'ধাপ ৪: ১-ট্যাপ প্রাইভেট সেফ DNS (পর্ন ও ক্ষতিকর ওয়েবসাইট সম্পূর্ণ ব্লক)',
                'الخطوة ٤: تفعيل DNS الآمن بضغطة واحدة (حماية شاملة من الإباحية)',
                'مرحلہ 4: ایک ٹیپ پر پرائیویٹ سیف DNS (فحش ویب سائٹس کا مکمل خاتمہ)',
                'Langkah 4: 1-Ketuk Private DNS Aman (Blokir Situs Dewasa & Bahaya)'
              )}
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              {tx(
                lang,
                'What is Private DNS? It is a built-in Android security setting that blocks 100% of adult/pornographic websites and phishing links inside EVERY browser (even Incognito mode) before the page can load.',
                'প্রাইভেট DNS কী? এটি আপনার ফোনের নিজস্ব একটি শক্তিশালী নিরাপত্তা ব্যবস্থা, যা চালু করলে যেকোনো ব্রাউজারে (এমনকি Incognito মোডেও) সকল পর্ন, অশ্লীল ও ক্ষতিকর ওয়েবসাইট লোড হওয়ার আগেই স্বয়ংক্রিয়ভাবে ব্লক হয়ে যায়।',
                'ما هو Private DNS؟ هو إعداد أمان مدمج في أندرويد يحظر المواقع الإباحية والضارة في جميع المتصفحات (حتى المتصفح الخفي) قبل تحميلها.',
                'پرائیویٹ DNS کیا ہے؟ یہ فون کی بلٹ ان سیکیورٹی ہے جو ہر براؤزر (حتیٰ کہ Incognito موڈ) میں بھی تمام فحش ویب سائٹس کو لوڈ ہونے سے پہلے ہی بلاک کر دیتی ہے۔',
                'Apa itu Private DNS? Fitur keamanan bawaan Android yang memblokir 100% situs dewasa & berbahaya di semua browser (termasuk mode Samaran).'
              )}
            </p>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleCopyDnsAndOpen('family.cloudflare-dns.com')}
                className="w-full py-2.5 px-3 bg-zinc-100 text-black font-mono-tech text-xs font-bold text-left flex items-center justify-between cursor-pointer"
              >
                <span>📋 1. Cloudflare Family (family.cloudflare-dns.com)</span>
                <span>{tx(lang, 'Copy & Open →', 'কপি ও সেট →', 'نسخ وفتح ←', 'کاپی اور سیٹ ←', 'Salin & Buka →')}</span>
              </button>
              <button
                type="button"
                onClick={() => handleCopyDnsAndOpen('adult-filter-dns.cleanbrowsing.org')}
                className="w-full py-2.5 px-3 border border-zinc-600 text-zinc-100 font-mono-tech text-xs text-left flex items-center justify-between cursor-pointer"
              >
                <span>📋 2. CleanBrowsing (adult-filter-dns.cleanbrowsing.org)</span>
                <span>{tx(lang, 'Copy & Open →', 'কপি ও সেট →', 'نسخ وفتح ←', 'کاپی اور سیٹ ←', 'Salin & Buka →')}</span>
              </button>
            </div>

            <div className="p-2 border border-zinc-800 bg-zinc-950 text-[11px] text-zinc-400">
              {tx(
                lang,
                'How to paste: Tap the button above → Select "Private DNS provider hostname" → Long-press & Paste → Tap Save.',
                'কীভাবে বসাবেন: উপরের বাটনে ট্যাপ করুন → "Private DNS provider hostname" সিলেক্ট করুন → চেপে ধরে Paste করুন → Save চাপুন।',
                'كيفية اللصق: اضغط الزر أعلاه ← اختر اسم مضيف مزود DNS الخاص ← الصق العنوان ← اضغط حفظ.',
                'طریقہ: اوپر بٹن دبائیں ← Private DNS provider hostname منتخب کریں ← پیسٹ کر کے Save دبائیں۔',
                'Cara tempel: Ketuk tombol di atas → Pilih "Hostname penyedia DNS pribadi" → Tempel → Simpan.'
              )}
            </div>
          </div>
        )}

        {/* ============================================================
            STEP 5: SLEEPING-TIME / NIGHT EMERGENCY QR CODE (10 PM - 6 AM)
           ============================================================ */}
        {step === 5 && (
          <div className="border border-zinc-800 bg-black p-3.5 space-y-3">
            <div className="text-xs font-mono-tech font-bold text-zinc-100">
              {tx(
                lang,
                'Step 5: Sleeping-Time Protection & Emergency QR Code (10 PM – 6 AM)',
                'ধাপ ৫: রাতের ঘুমের সুরক্ষা ও জরুরি QR কোড (রাত ১০টা – সকাল ৬টা)',
                'الخطوة ٥: حماية وقت النوم ورمز QR للطوارئ (١٠ مساءً – ٦ صباحاً)',
                'مرحلہ 5: رات کی نیند کی حفاظت اور ایمرجنسی QR کوڈ (رات 10 تا صبح 6)',
                'Langkah 5: Perlindungan Jam Tidur & Kode QR Darurat (22:00 – 06:00)'
              )}
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              {tx(
                lang,
                'During sleeping hours (10:00 PM – 6:00 AM), all Browsers and Social Media apps are locked so you can sleep peacefully. In a real emergency at night, you must scan or enter your Emergency QR Code below:',
                'রাত ১০:০০টা থেকে সকাল ৬:০০টা পর্যন্ত সকল ব্রাউজার ও সোশ্যাল মিডিয়া অ্যাপ কড়াকড়িভাবে লক থাকে যাতে আপনার ঘুম ও মানসিক প্রশান্তি নষ্ট না হয়। রাতে কোনো জরুরি প্রয়োজনে নিচের QR কোডটি স্ক্যান করতে হবে:',
                'خلال ساعات النوم (١٠ مساءً – ٦ صباحاً)، تُقفل جميع المتصفحات وتطبيقات التواصل. وفي حال الضرورة القصوى ليلاً، يجب مسح رمز QR الخاص بك:',
                'رات 10 بجے سے صبح 6 بجے تک تمام براؤزرز اور سوشل میڈیا ایپس لاک رہتی ہیں۔ رات کو کسی ہنگامی ضرورت کے وقت نیچے دیا گیا ایمرجنسی QR کوڈ اسکین کرنا لازمی ہے:',
                'Selama jam tidur (22:00 – 06:00), semua Browser & Media Sosial dikunci. Untuk keadaan darurat malam hari, Anda wajib memindai Kode QR Darurat ini:'
              )}
            </p>

            <div className="border border-zinc-700 bg-zinc-950 p-3 text-center space-y-1">
              <div className="text-[10px] font-mono-tech text-zinc-400">
                {tx(
                  lang,
                  'YOUR EMERGENCY NIGHT QR TOKEN (SAVE OR PRINT):',
                  'আপনার জরুরি নাইট QR কোড (লিখে রাখুন বা প্রিন্ট করুন):',
                  'رمز QR الليلي الخاص بك للطوارئ:',
                  'آپ کا ایمرجنسی نائٹ QR کوڈ (محفوظ کر لیں):',
                  'KODE QR DARURAT MALAM ANDA:'
                )}
              </div>
              <div className="text-base font-mono-tech font-bold text-zinc-100 tracking-wider">
                {qrCodeToken}
              </div>
            </div>
          </div>
        )}

        {actionFeedback && (
          <div className="p-2.5 border border-zinc-400 bg-zinc-900 text-xs font-mono-tech text-zinc-100">
            {actionFeedback}
          </div>
        )}

        {/* Bottom Navigation Buttons */}
        <div className="flex items-center justify-between gap-2 pt-1">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => {
                setStep((s) => Math.max(1, s - 1));
                setActionFeedback(null);
              }}
              className="px-4 py-2.5 border border-zinc-700 text-xs font-mono-tech text-zinc-300 cursor-pointer"
            >
              {tx(lang, '← Back', '← পিছনে', '→ السابق', '→ پیچھے', '← Kembali')}
            </button>
          ) : (
            <div />
          )}

          {step < totalSteps ? (
            <button
              type="button"
              onClick={() => {
                setStep((s) => Math.min(totalSteps, s + 1));
                setActionFeedback(null);
              }}
              className="flex-1 py-2.5 bg-zinc-100 text-black font-mono-tech text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              {tx(
                lang,
                `Next Step (${step + 1}/${totalSteps}) →`,
                `পরবর্তী ধাপ (${step + 1}/${totalSteps}) →`,
                `الخطوة التالية (${step + 1}/${totalSteps}) ←`,
                `اگلا مرحلہ (${step + 1}/${totalSteps}) ←`,
                `Langkah Berikutnya (${step + 1}/${totalSteps}) →`
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={onCompleteSetup}
              className="flex-1 py-3 bg-zinc-100 text-black font-mono-tech text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              {tx(
                lang,
                '✓ Finish Setup & Start Minimum Phone',
                '✓ সেটআপ সম্পন্ন করুন এবং মিনিমাম ফোন শুরু করুন',
                '✓ إنهاء الإعداد وبدء استخدام التطبيق',
                '✓ سیٹ اپ مکمل کریں اور منیمم فون شروع کریں',
                '✓ Selesai & Mulai Minimum Phone'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

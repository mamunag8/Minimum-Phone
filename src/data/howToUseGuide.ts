import type { LanguageCode } from '../types/app';

export interface HowToSection {
  id: string;
  stepNumber: string;
  title: Record<LanguageCode, string>;
  summary: Record<LanguageCode, string>;
  bullets: Record<LanguageCode, string[]>;
  actionType?:
    | 'set-default-home'
    | 'clear-old-home'
    | 'pin-kiosk'
    | 'open-phone-settings'
    | 'open-dns-settings'
    | 'practice-30s-quiz';
  actionLabel?: Record<LanguageCode, string>;
}

export const HOW_TO_USE_TITLE: Record<LanguageCode, string> = {
  en: 'COMPLETE USER GUIDE & HOW-TO DOCUMENTATION',
  bn: 'সম্পূর্ণ ব্যবহার নির্দেশিকা ও ডকুমেন্টেশন (HOW TO USE)',
  ar: 'دليل الاستخدام الشامل والتوثيق الكامل',
  ur: 'مکمل طریقہ استعمال اور گائیڈ (HOW TO USE)',
  id: 'PANDUAN PENGGUNA LENGKAP & DOKUMENTASI',
};

export const HOW_TO_USE_SUBTITLE: Record<LanguageCode, string> = {
  en: 'Step-by-step instructions to lock Minimum Phone as your Core OS Launcher, configure Active Apps, master the 30-Second Read + Quiz Gate, and activate the Anti-Porn Fortress.',
  bn: 'মিনিমাম ফোনকে আপনার ফোনের মূল লঞ্চার হিসেবে সেট করা, অ্যাক্টিভ অ্যাপস সাজানো, ৩০ সেকেন্ড পাঠ ও কুইজ গেট এবং পর্ন-মুক্তি দুর্গ চালু করার ধাপে ধাপে নির্দেশিকা।',
  ar: 'خطوات عملية لتثبيت Minimum Phone كمشغل أساسي للهاتف، وإدارة التطبيقات النشطة، وتفعيل بوابة القراءة ٣٠ ثانية مع الاختبار، وحصن التعافي الكامل.',
  ur: 'منیمم فون کو اپنا مستقل ہوم لانچر بنانے، فعال ایپس منتخب کرنے، 30 سیکنڈ مطالعہ و کوئز گیٹ اور پورن سے مکمل تحفظ فعال کرنے کی تفصیلی گائیڈ۔',
  id: 'Panduan langkah demi langkah menjadikan Minimum Phone sebagai Launcher Utama, mengatur Aplikasi Aktif, Gerbang Baca 30 Detik + Kuis, dan Benteng Anti-Pornografi.',
};

export const HOW_TO_USE_SECTIONS: HowToSection[] = [
  {
    id: 'core-launcher',
    stepNumber: '01',
    title: {
      en: 'Make Minimum Phone Your Permanent Core Home Launcher',
      bn: 'মিনিমাম ফোনকে আপনার ফোনের স্থায়ী মূল হোম লঞ্চার করুন',
      ar: 'تعيين Minimum Phone كمشغل الشاشة الرئيسية الدائم',
      ur: 'منیمم فون کو اپنا مستقل ڈیفالٹ ہوم لانچر بنائیں',
      id: 'Jadikan Minimum Phone sebagai Launcher Utama Permanen',
    },
    summary: {
      en: 'Stop the Home button from returning to your old colorful launcher by binding Android ROLE_HOME and Hardware Screen Pinning.',
      bn: 'হোম বাটন চাপলে যেন আগের রঙিন লঞ্চার চলে না আসে, সেজন্য ডিফল্ট হোম অ্যাপ এবং হার্ডওয়্যার পিন লক চালু করুন।',
      ar: 'امنع زر الشاشة الرئيسية من العودة إلى واجهة الهاتف القديمة عبر ربط ROLE_HOME وتثبيت الشاشة.',
      ur: 'ہوم بٹن دبانے پر پرانے لانچر کی واپسی روکنے کے لیے ڈیفالٹ ہوم رول اور ہارڈویئر پن لاک فعال کریں۔',
      id: 'Cegah tombol Home kembali ke launcher lama dengan mengaktifkan ROLE_HOME dan Kunci Pin Layar.',
    },
    bullets: {
      en: [
        'Step 1: Tap [1. Set Default Home] and choose "Minimum Phone" -> "Always" in the Android dialog.',
        'Step 2 (Samsung / Xiaomi / Oppo / Vivo): If pressing Home still opens your old launcher, tap [2. Clear Old Home] to force-reset Android’s launcher cache and pick Minimum Phone.',
        'Step 3 (Maximum Lock): Tap [3. Pin Home Btn] to activate Android Hardware Screen Pinning (Kiosk Lock) so neither Home nor Recents can leave Minimum Phone.',
      ],
      bn: [
        'ধাপ ১: [1. Set Default Home] বাটনে ট্যাপ করে অ্যান্ড্রয়েড পপ-আপে "Minimum Phone" সিলেক্ট করে "Always" দিন।',
        'ধাপ ২ (Samsung / Xiaomi / Oppo / Vivo): হোম বাটন চাপলে যদি আগের লঞ্চার চলে আসে, তবে [2. Clear Old Home] চাপুন—এটি পুরোনো লঞ্চারের ক্যাশ রিসেট করে নতুনভাবে সিলেক্ট করার অপশন দেবে।',
        'ধাপ ৩ (সর্বোচ্চ লক): [3. Pin Home Btn] চালু করলে ফোনের হোম ও রিসেন্ট বাটন হার্ডওয়্যার লেভেলে লক হয়ে যাবে।',
      ],
      ar: [
        'الخطوة ١: اضغط على [1. Set Default Home] واختر Minimum Phone كمشغل افتراضي دائماً (Always).',
        'الخطوة ٢ (أجهزة سامسونج وشاومي وأوبو): إذا استمر زر Home بفتح المشغل القديم، اضغط [2. Clear Old Home] لإعادة تعيين ذاكرة المشغل واختيار Minimum Phone.',
        'الخطوة ٣ (القفل الأقصى): اضغط [3. Pin Home Btn] لتثبيت الشاشة برمجياً ومنع الخروج عبر زر Home.',
      ],
      ur: [
        'مرحلہ 1: [1. Set Default Home] پر ٹیپ کریں اور اینڈرائیڈ ڈائیلاگ میں Minimum Phone کو Always منتخب کریں۔',
        'مرحلہ 2 (سام سنگ / شاؤمی / اوپو): اگر ہوم بٹن دبانے سے پرانا لانچر کھلے تو [2. Clear Old Home] دبائیں تاکہ پرانا ڈیفالٹ صاف ہو جائے۔',
        'مرحلہ 3 (مکمل لاک): [3. Pin Home Btn] دبا کر ہارڈویئر اسکرین پننگ فعال کریں۔',
      ],
      id: [
        'Langkah 1: Ketuk [1. Set Default Home] lalu pilih "Minimum Phone" -> "Always".',
        'Langkah 2 (Samsung / Xiaomi / Oppo): Jika tombol Home masih membuka launcher lama, ketuk [2. Clear Old Home] untuk mereset cache launcher.',
        'Langkah 3 (Kunci Maksimal): Ketuk [3. Pin Home Btn] untuk mengunci tombol Home & Recents di tingkat sistem.',
      ],
    },
    actionType: 'set-default-home',
    actionLabel: {
      en: 'Bind Default Home Launcher Now',
      bn: 'এখনই ডিফল্ট হোম লঞ্চার সেট করুন',
      ar: 'تعيين المشغل الافتراضي الآن',
      ur: 'ابھی ڈیفالٹ ہوم لانچر سیٹ کریں',
      id: 'Atur Launcher Utama Sekarang',
    },
  },
  {
    id: 'active-apps-settings',
    stepNumber: '02',
    title: {
      en: 'Configure Your Active Home Apps & Phone Main Settings',
      bn: 'আপনার অ্যাক্টিভ হোম অ্যাপস এবং ফোনের মূল সেটিংস নিয়ন্ত্রণ করুন',
      ar: 'إدارة التطبيقات النشطة وإعدادات الهاتف الأساسية',
      ur: 'اپنی فعال ایپس اور فون کی اصل سیٹنگز کنٹرول کریں',
      id: 'Atur Aplikasi Aktif & Pengaturan Utama Ponsel',
    },
    summary: {
      en: 'Choose up to 7 Essential Apps for your Home Screen, classify distracting apps as Restricted or Blocked, and access Wi-Fi, Bluetooth, Display, Sound & Main Android Settings directly.',
      bn: 'হোম স্ক্রিনের জন্য সর্বোচ্চ ৭টি প্রয়োজনীয় অ্যাপ পিন করুন, আসক্তিকর অ্যাপকে Restricted বা Blocked হিসেবে চিহ্নিত করুন এবং সরাসরি ফোনের Wi-Fi, Bluetooth, Sound ও মূল Settings খুলুন।',
      ar: 'اختر حتى ٧ تطبيقات أساسية للشاشة الرئيسية، وصنّف التطبيقات المشتتة كمقيدة أو محظورة، وافتح إعدادات الهاتف (Wi-Fi والبلوتوث والشاشة والصوت) مباشرة.',
      ur: 'ہوم اسکرین کے لیے 7 ضروری ایپس منتخب کریں، خلفشار والی ایپس کو Restricted یا Blocked کریں، اور فون کی اصل سیٹنگز (وائی فائی، بلوٹوتھ، آواز) براہ راست کھولیں۔',
      id: 'Pilih hingga 7 Aplikasi Utama di layar depan, tandai aplikasi pengganggu sebagai Restricted/Blocked, dan buka Pengaturan Ponsel (Wi-Fi, Bluetooth, Suara) secara langsung.',
    },
    bullets: {
      en: [
        'In the Settings tab -> Active Apps Manager, toggle [Pin Home] to show or hide any app on your clean Home list.',
        'Set any app’s friction tier to [Instant Tool], [30s Gate / Restricted], or [Blocked] with one tap.',
        'Use the [Phone Main Settings Bridge] in Settings to open Android Wi-Fi, Bluetooth, Sound, Display, Apps, or Private DNS without leaving your launcher workflow.',
      ],
      bn: [
        'Settings ট্যাবের Active Apps Manager থেকে যেকোনো অ্যাপের পাশে [Pin Home] চেপে হোম স্ক্রিনে যুক্ত বা বাদ দিন।',
        'যেকোনো অ্যাপকে এক ট্যাপে [Instant Tool], [30s Gate / Restricted] অথবা [Blocked] মুডে পরিবর্তন করুন।',
        'Settings-এর ভেতরে থাকা [Phone Main Settings] বাটনগুলো দিয়ে সরাসরি ফোনের Wi-Fi, Bluetooth, Display, Sound ও Main Settings ওপেন করুন।',
      ],
      ar: [
        'من تبويب الإعدادات -> إدارة التطبيقات النشطة، اضغط [Pin Home] لإظهار أو إخفاء التطبيق في الشاشة الرئيسية.',
        'غيّر مستوى أي تطبيق بين [أداة فورية] أو [بوابة ٣٠ ثانية] أو [محظور تماماً].',
        'استخدم أزرار إعدادات الهاتف لفتح الواي فاي والبلوتوث والصوت والشاشة مباشرة.',
      ],
      ur: [
        'Settings ٹیب میں Active Apps Manager سے کسی بھی ایپ کو ہوم اسکرین پر پن یا ان پن کریں۔',
        'ہر ایپ کو [Instant Tool]، [30s Gate / Restricted] یا [Blocked] پر سیٹ کریں۔',
        'فون کی اصل سیٹنگز (Wi-Fi, Bluetooth, Display, Sound) براہ راست سیٹنگز مینو سے کھولیں۔',
      ],
      id: [
        'Di tab Pengaturan -> Manajer Aplikasi Aktif, ketuk [Pin Home] untuk menampilkan aplikasi di layar utama.',
        'Ubah status aplikasi menjadi [Instant Tool], [30s Gate / Restricted], atau [Blocked].',
        'Gunakan jembatan Pengaturan Ponsel untuk membuka Wi-Fi, Bluetooth, Layar, dan Suara.',
      ],
    },
    actionType: 'open-phone-settings',
    actionLabel: {
      en: 'Open Phone Main Settings',
      bn: 'ফোনের মূল সেটিংস খুলুন',
      ar: 'فتح إعدادات الهاتف الرئيسية',
      ur: 'فون کی اصل سیٹنگز کھولیں',
      id: 'Buka Pengaturan Utama Ponsel',
    },
  },
  {
    id: 'slow-learning-quiz',
    stepNumber: '03',
    title: {
      en: 'Slow Learning Mode: Read 30-Second Text & Play Quiz to Unlock Apps',
      bn: 'স্লো লার্নিং মুড: অ্যাপ খুলতে ৩০ সেকেন্ড পাঠ করুন ও কুইজ খেলুন',
      ar: 'وضع التعلم الهادئ: اقرأ نصاً لمدة ٣٠ ثانية وأجب عن الاختبار لفتح التطبيق',
      ur: 'سلو لرننگ موڈ: ایپ کھولنے کے لیے 30 سیکنڈ عبارت پڑھیں اور کوئز حل کریں',
      id: 'Mode Belajar Lambat: Baca Teks 30 Detik & Jawab Kuis untuk Membuka Aplikasi',
    },
    summary: {
      en: 'Turn every app craving into bite-sized Islamic knowledge, multilingual vocabulary mastery, or neuroscience insight.',
      bn: 'প্রতিবার আসক্তিকর অ্যাপ খোলার তাড়নাকে ইসলামিক জ্ঞান, ভাষা-শব্দভাণ্ডার অথবা মনোযোগ বিজ্ঞানের শিক্ষায় রূপান্তর করুন।',
      ar: 'حوّل كل رغبة في فتح تطبيق مشتت إلى جرعة علم شرعي أو إتقان لغوي أو معرفة علمية.',
      ur: 'ایپ کھولنے کی ہر خواہش کو اسلامی علم، الفاظ کے ذخیرے یا ذہنی ارتکاز کے سبق میں بدل دیں۔',
      id: 'Ubah setiap dorongan membuka aplikasi menjadi pelajaran Islam, penguasaan kosakata bahasa, atau sains fokus.',
    },
    bullets: {
      en: [
        'Choose your Slow Learning Track in Settings: (1) Islamic Knowledge (Quran, Hadith & Akhlaq), (2) Language & Vocabulary Mastery (Arabic/English/Bangla roots), or (3) Universal Focus Science.',
        'When you try to open a Restricted app, Minimum Phone shows a 30-second reading passage with a live countdown.',
        'After 30 seconds of reading, a multiple-choice Quiz appears. Answer correctly to earn Learning XP and unlock the app—or tap [Return to Peace] to save your focus!',
      ],
      bn: [
        'Settings থেকে আপনার Slow Learning Track বেছে নিন: (১) ইসলামিক জ্ঞান (কুরআন, হাদীস ও আখলাক), (২) ভাষা ও শব্দভাণ্ডার শিক্ষা, অথবা (৩) সার্বজনীন মনোযোগ বিজ্ঞান।',
        'যখনই আপনি কোনো Restricted অ্যাপ খুলতে যাবেন, আপনাকে ৩০ সেকেন্ডের একটি শিক্ষণীয় অনুচ্ছেদ মনোযোগ দিয়ে পড়তে হবে।',
        '৩০ সেকেন্ড পড়া শেষ হলে সেই অনুচ্ছেদ থেকে একটি কুইজ (Quiz) আসবে। সঠিক উত্তর দিলে XP পাবেন এবং অ্যাপটি নির্দিষ্ট সময়ের জন্য আনলক হবে!',
      ],
      ar: [
        'اختر مسار التعلم من الإعدادات: (١) المعرفة الإسلامية، أو (٢) إتقان اللغات والمفردات، أو (٣) علوم التركيز.',
        'عند محاولة فتح تطبيق مقيد، يظهر نص تعليمي مع عداد قراءة إلزامي لمدة ٣٠ ثانية.',
        'بعد انتهاء الـ ٣٠ ثانية يظهر سؤال اختيار من متعدد؛ أجب بشكل صحيح لكسب نقاط التعلم وفتح التطبيق.',
      ],
      ur: [
        'سیٹنگز سے اپنا سلو لرننگ ٹریک منتخب کریں: (1) اسلامی علم، (2) زبان اور الفاظ کی مہارت، یا (3) فوکس سائنس۔',
        'جب آپ کوئی مقید ایپ کھولیں گے تو 30 سیکنڈ کا نصابی پیراگراف کاؤنٹ ڈاؤن کے ساتھ سامنے آئے گا۔',
        '30 سیکنڈ پڑھنے کے بعد کوئز کا درست جواب دیں تاکہ ایپ ان لاک ہو سکے۔',
      ],
      id: [
        'Pilih jalur Slow Learning di Pengaturan: (1) Ilmu Islam, (2) Penguasaan Bahasa & Kosakata, atau (3) Sains Fokus.',
        'Saat membuka aplikasi terbatas, Anda wajib membaca teks pelajaran selama 30 detik.',
        'Setelah 30 detik, jawab kuis pilihan ganda dengan benar untuk membuka aplikasi.',
      ],
    },
    actionType: 'practice-30s-quiz',
    actionLabel: {
      en: 'Practice 30s Read + Quiz Now',
      bn: 'এখনই ৩০ সেকেন্ড পাঠ ও কুইজ অনুশীলন করুন',
      ar: 'جرب القراءة ٣٠ ثانية والاختبار الآن',
      ur: 'ابھی 30 سیکنڈ مطالعہ اور کوئز آزمائیں',
      id: 'Coba Baca 30 Detik + Kuis Sekarang',
    },
  },
  {
    id: 'inspiration-modes',
    stepNumber: '04',
    title: {
      en: 'Inspiration Mode: Fully Islamic vs. Common/Universal for All',
      bn: 'অনুপ্রেরণা মুড: সম্পূর্ণ ইসলামিক নাকি সকলের জন্য সার্বজনীন (Universal)',
      ar: 'نمط الإلهام: إسلامي كامل أو عالمي مشترك للجميع',
      ur: 'ترغیب کا انداز: مکمل اسلامی موڈ یا سب کے لیے عمومی عالمگیر موڈ',
      id: 'Mode Inspirasi: Sepenuhnya Islami atau Universal untuk Semua',
    },
    summary: {
      en: 'Switch effortlessly between 100% Islamic Quran/Hadith mode, 100% Common Universal Wisdom mode for all backgrounds, or Hybrid mode.',
      bn: 'আপনার পছন্দ অনুযায়ী ১০০% ইসলামিক (কুরআন ও সহীহ হাদীস) মুড, সকল ধর্ম ও মানুষের উপযোগী সার্বজনীন (Universal) প্রজ্ঞা মুড, অথবা উভয়ের সমন্বিত মুড বেছে নিন।',
      ar: 'بدّل بسهولة بين الوضع الإسلامي الخالص (القرآن والسنة)، أو وضع الحكمة العالمية المشتركة لجميع الخلفيات، أو الوضع المدمج.',
      ur: 'اپنی پسند کے مطابق 100% اسلامی موڈ (قرآن و حدیث)، تمام انسانوں کے لیے مشترک عالمگیر موڈ، یا ملا جلا موڈ منتخب کریں۔',
      id: 'Pilih antara Mode Islami Penuh (Al-Quran & Hadis), Mode Kebijaksanaan Universal untuk semua kalangan, atau Mode Campuran.',
    },
    bullets: {
      en: [
        'Fully Islamic Mode: Displays only Quranic verses, authentic Hadith, Arabic script, and Islamic learning passages.',
        'Common / Universal Mode for All: Displays only universal proverbs, Stoic/mindfulness reflections, and neuroscience focus lessons.',
        'Blended Mode: Combines both sacred Sakinah lines and timeless universal wisdom.',
      ],
      bn: [
        'সম্পূর্ণ ইসলামিক মুড (Fully Islamic): কেবল কুরআনের আয়াত, সহীহ হাদীস, আরবি মূল পাঠ এবং ইসলামিক শিক্ষা প্রদর্শন করে।',
        'সকলের জন্য সার্বজনীন মুড (Common for All): কেবল সার্বজনীন প্রবাদ, মনোযোগ বিজ্ঞান ও আত্মনিয়ন্ত্রণের শিক্ষা প্রদর্শন করে।',
        'সমন্বিত মুড (Blended): ইসলামিক ও সার্বজনীন উভয় অনুপ্রেরণা একসাথে প্রদর্শন করে।',
      ],
      ar: [
        'الوضع الإسلامي الكامل: يعرض آيات القرآن الكريم والأحاديث الصحيحة والنصوص العربية فقط.',
        'الوضع العالمي المشترك للجميع: يعرض الحكم العالمية وعلوم التركيز المناسبة لكل إنسان.',
        'الوضع المدمج: يجمع بين السكينة الإيمانية والحكمة الإنسانية.',
      ],
      ur: [
        'مکمل اسلامی موڈ: صرف قرآنی آیات، صحیح احادیث اور اسلامی اسباق دکھاتا ہے۔',
        'سب کے لیے عمومی موڈ: صرف عالمگیر اقوال اور ذہنی یکسوئی کے سائنسی اصول دکھاتا ہے۔',
        'ملا جلا موڈ: اسلامی اور عالمگیر دونوں حکمتوں کو یکجا کرتا ہے۔',
      ],
      id: [
        'Mode Islami Penuh: Hanya menampilkan ayat Al-Quran, Hadis sahih, dan pelajaran Islam.',
        'Mode Universal untuk Semua: Menampilkan pepatah universal dan sains fokus untuk semua latar belakang.',
        'Mode Campuran: Menggabungkan keduanya secara harmonis.',
      ],
    },
  },
  {
    id: 'anti-porn-fortress',
    stepNumber: '05',
    title: {
      en: 'Complete Restriction & Control on Porn Addiction (Purity Fortress)',
      bn: 'পর্ন আসক্তির ওপর সম্পূর্ণ নিয়ন্ত্রণ ও কঠোর সুরক্ষা দুর্গ (Purity Fortress)',
      ar: 'التحكم الكامل والحظر الشامل لإدمان الإباحية (حصن العفة)',
      ur: 'پورن کی لت پر مکمل کنٹرول اور سخت پابندی (پاکیزگی کا قلعہ)',
      id: 'Kontrol & Pembatasan Penuh Kecanduan Pornografi (Benteng Kesucian)',
    },
    summary: {
      en: 'Multi-layered protection combining OS-level Private DNS adult filtering, strict browser lockdown, custom trigger blocking, and an instant 15-minute Emergency Urge Lockdown.',
      bn: 'অ্যান্ড্রয়েড প্রাইভেট ডিএনএস অ্যাডাল্ট ফিল্টার, ব্রাউজার লকডাউন, কাস্টম কীওয়ার্ড ব্লকার এবং জরুরি ১৫ মিনিটের প্যানিক লকডাউনের মাধ্যমে পর্ন আসক্তি থেকে সম্পূর্ণ মুক্তি।',
      ar: 'حماية متعددة الطبقات تجمع بين حظر المواقع الإباحية عبر DNS الخاص، وقفل المتصفحات، وحظر الكلمات المحفزة، وزر الطوارئ الفوري.',
      ur: 'پرائیویٹ ڈی این ایس فلٹر، براؤزر لاک ڈاؤن، مخصوص الفاظ کی بندش اور ہنگامی 15 منٹ لاک کے ذریعے مکمل تحفظ۔',
      id: 'Perlindungan berlapis yang menggabungkan filter DNS Pribadi tingkat OS, kunci browser, pemblokir kata kunci, dan Kunci Darurat 15 menit.',
    },
    bullets: {
      en: [
        '1. OS-Level Safe DNS: In the Purity tab, copy "family.cloudflare-dns.com" and tap [Open Android Private DNS Settings] so every browser & app on your phone blocks adult domains automatically.',
        '2. Strict Porn Lockdown Toggle: Automatically forces all Browsers (Chrome, Opera, Brave, etc.) into Restricted mode or blocks them completely during Night Guard hours (10 PM – 6 AM).',
        '3. Custom Trigger & Domain Blocker: Add any triggering words, websites, or tags to your permanent blocklist.',
        '4. Instant 15-Minute Emergency Browser Lock + SOS Breathing: Whenever an urge hits, tap [Emergency Urge SOS] to lock all browsers & social apps for 15 minutes while completing the 60s physical & spiritual reset.',
      ],
      bn: [
        '১. ওএস-লেভেল সেফ ডিএনএস: Purity ট্যাবে গিয়ে "family.cloudflare-dns.com" কপি করুন এবং [Open Android Private DNS Settings] চেপে ফোনের Private DNS-এ বসিয়ে দিন—এতে ফোনের সব ব্রাউজারে অ্যাডাল্ট সাইট চিরতরে ব্লক হয়ে যাবে।',
        '২. Strict Porn Lockdown: এটি চালু করলে সব ব্রাউজার (Chrome, Opera ইত্যাদি) ৩০-সেকেন্ড কুইজ গেটের আওতায় চলে আসবে এবং রাত ১০টা থেকে সকাল ৬টা পর্যন্ত সম্পূর্ণ লক থাকবে।',
        '৩. কাস্টম কীওয়ার্ড ও ডোমেইন ব্লকার: যেকোনো ক্ষতিকর শব্দ বা ওয়েবসাইট আপনার ব্লকলিস্টে যুক্ত করুন।',
        '৪. ১৫ মিনিটের জরুরি লকডাউন ও SOS: হঠাৎ প্রলোভন জাগলে [Emergency Urge SOS] চাপুন—সাথে সাথে ১৫ মিনিটের জন্য ব্রাউজার ও সোশ্যাল অ্যাপ লক হয়ে যাবে।',
      ],
      ar: [
        '١. تفعيل DNS العائلي على مستوى النظام: انسخ family.cloudflare-dns.com واضغط فتح إعدادات DNS الخاص ليتم حظر جميع المواقع الإباحية في كل المتصفحات.',
        '٢. قفل الإباحية الصارم: يفرض بوابة القراءة والاختبار على جميع المتصفحات ويغلقها ليلاً (١٠ مساءً – ٦ صباحاً).',
        '٣. قائمة حظر الكلمات والنطاقات المخصصة: أضف أي كلمة أو موقع محفز لحظره فوراً.',
        '٤. قفل الطوارئ الفوري لمدة ١٥ دقيقة مع تمرين التنفس.',
      ],
      ur: [
        '1. سسٹم لیول سیف ڈی این ایس: "family.cloudflare-dns.com" کاپی کر کے فون کی Private DNS سیٹنگز میں درج کریں تاکہ ہر براؤزر میں فحش ویب سائٹس بلاک ہو جائیں۔',
        '2. سخت پورن لاک ڈاؤن: تمام براؤزرز پر 30 سیکنڈ کوئز گیٹ اور رات 10 سے صبح 6 بجے تک مکمل لاک نافذ کرتا ہے۔',
        '3. کسٹم الفاظ اور ویب سائٹ بلاکر: کسی بھی محرک لفظ کو بلاک لسٹ میں شامل کریں۔',
        '4. ہنگامی 15 منٹ براؤزر لاک اور ایس او ایس تنفس۔',
      ],
      id: [
        '1. DNS Aman Tingkat OS: Salin "family.cloudflare-dns.com" dan buka Pengaturan DNS Pribadi Android agar seluruh situs dewasa diblokir di semua browser.',
        '2. Mode Kunci Ketat Anti-Porno: Mewajibkan Gerbang Kuis 30 Detik pada semua browser dan menguncinya pada jam malam (22.00 – 06.00).',
        '3. Pemblokir Kata Kunci & Domain Kustom: Tambahkan kata atau situs pemicu ke daftar blokir.',
        '4. Kunci Darurat 15 Menit + SOS Pernapasan.',
      ],
    },
    actionType: 'open-dns-settings',
    actionLabel: {
      en: 'Open Android Private DNS Settings',
      bn: 'অ্যান্ড্রয়েড প্রাইভেট ডিএনএস সেটিংস খুলুন',
      ar: 'فتح إعدادات DNS الخاص في أندرويد',
      ur: 'اینڈرائیڈ پرائیویٹ DNS سیٹنگز کھولیں',
      id: 'Buka Pengaturan DNS Pribadi Android',
    },
  },
];

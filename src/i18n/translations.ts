import type { LanguageCode } from '../types/app';

export interface LanguageMeta {
  code: LanguageCode;
  nativeName: string;
  englishName: string;
  dir: 'ltr' | 'rtl';
}

export const SUPPORTED_LANGUAGES: LanguageMeta[] = [
  { code: 'en', nativeName: 'English', englishName: 'English', dir: 'ltr' },
  { code: 'bn', nativeName: 'বাংলা', englishName: 'Bangla', dir: 'ltr' },
  { code: 'ar', nativeName: 'العربية', englishName: 'Arabic', dir: 'rtl' },
  { code: 'ur', nativeName: 'اردو', englishName: 'Urdu', dir: 'rtl' },
  { code: 'id', nativeName: 'Bahasa', englishName: 'Indonesian', dir: 'ltr' },
];

export interface UIStrings {
  appName: string;
  byKasb: string;
  navHome: string;
  navDrawer: string;
  navPurity: string;
  navDigestFocus: string;
  navSystemKasb: string;
  // Home Screen
  allQuietStatus: string;
  nextDigestAt: string;
  essentialAppsTitle: string;
  profileWork: string;
  profilePersonal: string;
  profileSunset: string;
  openSearchDrawer: string;
  quickScratchpadTitle: string;
  scratchpadPlaceholder: string;
  calmWhisperLabel: string;
  nextWhisperBtn: string;
  startMonkModeBtn: string;
  urgeSosBtn: string;
  // App Drawer
  searchPlaceholder: string;
  searchHintRule: string;
  tierUtilityBadge: string;
  tierRestrictedBadge: string;
  typeExactToReveal: string;
  // Inhale Intercept Screen
  willThisServeYou: string;
  breatheIn: string;
  holdBreath: string;
  breatheOut: string;
  returnToPeaceBtn: string;
  continueAnywayBtn: string;
  microIntentTitle: string;
  intentReplyDm: string;
  intentSpecificLookup: string;
  intentConsciousBreak: string;
  selectTimeBid: string;
  habitWallRequired: string;
  // Purity & Anti-Porn Guard
  purityHeaderTitle: string;
  purityDiscreetTitle: string;
  cleanStreakLabel: string;
  daysLabel: string;
  hoursLabel: string;
  minsLabel: string;
  urgesDefeatedLabel: string;
  brainRewiringProgress: string;
  panicSosButton: string;
  morningPledgeBtn: string;
  pledgedDoneText: string;
  adultDnsShieldLabel: string;
  keywordBlockerLabel: string;
  nightGuardLabel: string;
  resetStreakBtn: string;
  // Digest & Focus
  notificationDigestTitle: string;
  monkModeTitle: string;
  physicalBrickTitle: string;
  // System & Kasb
  wisdomPackLabel: string;
  packQuran: string;
  packHadith: string;
  packProverbs: string;
  packBlended: string;
  grayscaleToggleLabel: string;
  languageLabel: string;
}

export const TRANSLATIONS: Record<LanguageCode, UIStrings> = {
  en: {
    appName: 'MINIMUM PHONE',
    byKasb: 'by kasb LLC · 100% Free · Zero Ads',
    navHome: 'Home',
    navDrawer: 'Search',
    navPurity: 'Purity',
    navDigestFocus: 'Focus & Digest',
    navSystemKasb: 'Vault & Kasb',
    allQuietStatus: 'All quiet · 0 urgent alerts',
    nextDigestAt: 'Next digest at',
    essentialAppsTitle: 'ESSENTIAL APPS (MAX 5)',
    profileWork: 'Work',
    profilePersonal: 'Personal',
    profileSunset: 'Sunset',
    openSearchDrawer: 'Tap to search all apps (type full name)...',
    quickScratchpadTitle: 'MIND DUMP SCRATCHPAD (ZERO-APP CAPTURE)',
    scratchpadPlaceholder: 'Capture thought & lock phone...',
    calmWhisperLabel: 'CALM MIND TRIGGER',
    nextWhisperBtn: 'New Line',
    startMonkModeBtn: 'Monk Focus',
    urgeSosBtn: 'Urge SOS',
    searchPlaceholder: 'Type full app name consciously...',
    searchHintRule: 'Utilities launch immediately. Distracting apps require typing the exact name.',
    tierUtilityBadge: 'INSTANT TOOL',
    tierRestrictedBadge: 'INHALE GATE',
    typeExactToReveal: 'Restricted apps are hidden until you type their exact name.',
    willThisServeYou: 'Will this bring peace to your heart right now?',
    breatheIn: 'Inhale slowly...',
    holdBreath: 'Hold in stillness...',
    breatheOut: 'Release the impulse...',
    returnToPeaceBtn: '[ Return to Peace ]',
    continueAnywayBtn: 'Proceed with intention',
    microIntentTitle: '1. Declare your micro-intention:',
    intentReplyDm: 'Reply to specific message',
    intentSpecificLookup: 'Check one needed item',
    intentConsciousBreak: 'Intentional brief rest',
    selectTimeBid: '2. Bid your time limit:',
    habitWallRequired: 'Habit-Wall Gatekeeper Required',
    purityHeaderTitle: 'PURITY & ANTI-PORN GUARD',
    purityDiscreetTitle: 'NEURO-RESET & CLARITY SHIELD',
    cleanStreakLabel: 'CLEAN & GUARDED STREAK',
    daysLabel: 'DAYS',
    hoursLabel: 'HRS',
    minsLabel: 'MINS',
    urgesDefeatedLabel: 'Urges Defeated',
    brainRewiringProgress: '90-Day Dopamine Baseline Rewiring',
    panicSosButton: 'URGE SOS — GROUND MY MIND NOW',
    morningPledgeBtn: 'Take Today’s Purity & Clarity Pledge',
    pledgedDoneText: 'Pledged for today: Guarding eyes, heart, and focus.',
    adultDnsShieldLabel: 'System Adult DNS Filter (1.1.1.3 Family Shield)',
    keywordBlockerLabel: 'Browser & Incognito Adult Keyword Interceptor',
    nightGuardLabel: 'Night Guard (Auto-lock browsers 11 PM – 6 AM)',
    resetStreakBtn: 'Log Relapse & Analyze Trigger',
    notificationDigestTitle: 'TWICE-DAILY NOTIFICATION DIGEST',
    monkModeTitle: 'MONK MODE DEEP WORK BLOCK',
    physicalBrickTitle: 'FREE QR / NFC PHYSICAL ANCHOR LOCK',
    wisdomPackLabel: 'CALM MIND TRIGGER SOURCE',
    packQuran: 'Quran Only (Sakīnah)',
    packHadith: 'Hadith Only (Sunnah)',
    packProverbs: 'Calm Mind Proverbs',
    packBlended: 'Blended (All Sources)',
    grayscaleToggleLabel: 'System Hardware Grayscale Mode',
    languageLabel: 'INTERFACE & WISDOM LANGUAGE',
  },
  bn: {
    appName: 'মিনিমাম ফোন',
    byKasb: 'kasb LLC দ্বারা নির্মিত · ১০০% ফ্রি · বিজ্ঞাপনমুক্ত',
    navHome: 'হোম',
    navDrawer: 'সার্চ',
    navPurity: 'পবিত্রতা',
    navDigestFocus: 'ফোকাস ও ডাইজেস্ট',
    navSystemKasb: 'ভল্ট ও সেটিংস',
    allQuietStatus: 'সব শান্ত · ০টি জরুরি বার্তা',
    nextDigestAt: 'পরবর্তী ডাইজেস্ট',
    essentialAppsTitle: 'প্রয়োজনীয় অ্যাপ (সর্বোচ্চ ৫টি)',
    profileWork: 'কাজ',
    profilePersonal: 'ব্যক্তিগত',
    profileSunset: 'সন্ধ্যা',
    openSearchDrawer: 'অ্যাপ খুঁজতে সম্পূর্ণ নাম টাইপ করুন...',
    quickScratchpadTitle: 'তাৎক্ষণিক নোট (মনোযোগ না হারিয়ে লিখে রাখুন)',
    scratchpadPlaceholder: 'প্রয়োজনীয় চিন্তা লিখে ফোন রেখে দিন...',
    calmWhisperLabel: 'প্রশান্ত মনের বাণী',
    nextWhisperBtn: 'পরবর্তী বাণী',
    startMonkModeBtn: 'গভীর মনোযোগ',
    urgeSosBtn: 'তাড়না রোধ (SOS)',
    searchPlaceholder: 'সচেতনভাবে অ্যাপের সম্পূর্ণ নাম লিখুন...',
    searchHintRule: 'প্রয়োজনীয় টুল সাথে সাথে খুলবে। আসক্তিকর অ্যাপের সম্পূর্ণ নাম লিখতে হবে।',
    tierUtilityBadge: 'টুল অ্যাপ',
    tierRestrictedBadge: 'শ্বাস বিরতি',
    typeExactToReveal: 'আসক্তিকর অ্যাপগুলো সম্পূর্ণ নাম না লেখা পর্যন্ত লুকানো থাকে।',
    willThisServeYou: 'এটি কি এখন আপনার মনে প্রশান্তি আনবে?',
    breatheIn: 'ধীরে শ্বাস নিন...',
    holdBreath: 'স্থির হয়ে ধরে রাখুন...',
    breatheOut: 'অস্থিরতা ছেড়ে দিন...',
    returnToPeaceBtn: '[ প্রশান্তিতে ফিরে যান ]',
    continueAnywayBtn: 'সচেতনভাবে প্রবেশ করুন',
    microIntentTitle: '১. আপনার সুনির্দিষ্ট উদ্দেশ্য নির্বাচন করুন:',
    intentReplyDm: 'নির্দিষ্ট বার্তার উত্তর দেওয়া',
    intentSpecificLookup: 'জরুরি তথ্য দেখা',
    intentConsciousBreak: 'সংক্ষিপ্ত বিরতি',
    selectTimeBid: '২. সময়সীমা নির্ধারণ করুন:',
    habitWallRequired: 'হ্যাবিট-ওয়াল সম্পন্ন করা আবশ্যক',
    purityHeaderTitle: 'পবিত্রতা ও পর্ন-মুক্তি গার্ড',
    purityDiscreetTitle: 'নিউরো-রিসেট ও চিত্তশুদ্ধি শিল্ড',
    cleanStreakLabel: 'পবিত্র ও নিয়ন্ত্রিত থাকার সময়কাল',
    daysLabel: 'দিন',
    hoursLabel: 'ঘণ্টা',
    minsLabel: 'মিনিট',
    urgesDefeatedLabel: 'তাড়না জয় করেছেন',
    brainRewiringProgress: '৯০-দিনের ডোপামিন রিসেট অগ্রগতি',
    panicSosButton: 'জরুরি সহায়তা (SOS) — এখনই মন শান্ত করুন',
    morningPledgeBtn: 'আজকের আত্মনিয়ন্ত্রণ ও পবিত্রতার শপথ নিন',
    pledgedDoneText: 'আজকের শপথ সম্পন্ন: দৃষ্টি, হৃদয় ও সময়ের হেফাজত করব।',
    adultDnsShieldLabel: 'সিস্টেম অ্যাডাল্ট DNS ফিল্টার (1.1.1.3 ফ্যামিলি শিল্ড)',
    keywordBlockerLabel: 'ব্রাউজার ও ইনকগনিটো অ্যাডাল্ট কীওয়ার্ড ব্লকার',
    nightGuardLabel: 'নাইট গার্ড (রাত ১১টা – সকাল ৬টা ব্রাউজার লক)',
    resetStreakBtn: 'পুনরায় শুরু ও কারণ বিশ্লেষণ',
    notificationDigestTitle: 'দৈনিক ২-বার নোটিফিকেশন ডাইজেস্ট',
    monkModeTitle: 'মঙ্ক মোড (গভীর কাজের সময়)',
    physicalBrickTitle: 'ফ্রি QR / NFC ফিজিক্যাল লক',
    wisdomPackLabel: 'প্রশান্ত মনের বাণীর উৎস',
    packQuran: 'শুধুমাত্র কুরআন (সাকীনাহ)',
    packHadith: 'শুধুমাত্র হাদিস (সুন্নাহ)',
    packProverbs: 'প্রশান্ত মনের প্রবাদ',
    packBlended: 'সমন্বিত (সব উৎস)',
    grayscaleToggleLabel: 'সিস্টেম সাদাকালো (Grayscale) মোড',
    languageLabel: 'ভাষা পরিবর্তন (Language Switcher)',
  },
  ar: {
    appName: 'الهاتف الأدنى',
    byKasb: 'من شركة kasb LLC · مجاني ١٠٠٪ · بدون إعلانات',
    navHome: 'الرئيسية',
    navDrawer: 'بحث',
    navPurity: 'العفة',
    navDigestFocus: 'التركيز',
    navSystemKasb: 'الإعدادات',
    allQuietStatus: 'كل شيء هادئ · ٠ تنبيهات عاجلة',
    nextDigestAt: 'الملخص القادم في',
    essentialAppsTitle: 'التطبيقات الأساسية (٥ كحد أقصى)',
    profileWork: 'العمل',
    profilePersonal: 'شخصي',
    profileSunset: 'المساء',
    openSearchDrawer: 'ابحث بكتابة اسم التطبيق كاملاً...',
    quickScratchpadTitle: 'مفكرة سريعة (بدون تشتيت)',
    scratchpadPlaceholder: 'دوّن فكرتك وأغلق الهاتف...',
    calmWhisperLabel: 'طمأنينة القلب',
    nextWhisperBtn: 'آية / حكمة أخرى',
    startMonkModeBtn: 'تركيز عميق',
    urgeSosBtn: 'طوارئ النفس',
    searchPlaceholder: 'اكتب اسم التطبيق بوعي...',
    searchHintRule: 'تطبيقات الأدوات تفتح فوراً. تطبيقات التشتيت تتطلب كتابة الاسم كاملاً.',
    tierUtilityBadge: 'أداة فورية',
    tierRestrictedBadge: 'بوابة تنفس',
    typeExactToReveal: 'التطبيقات المشتتة مخفية حتى تكتب اسمها بالكامل.',
    willThisServeYou: 'هل هذا يجلب السكينة لقلبك الآن؟',
    breatheIn: 'تنفس ببطء...',
    holdBreath: 'تأمل في سكون...',
    breatheOut: 'اترك الرغبة العابرة...',
    returnToPeaceBtn: '[ العودة إلى السكينة ]',
    continueAnywayBtn: 'المتابعة بنية محددة',
    microIntentTitle: '١. حدد غرضك بدقة:',
    intentReplyDm: 'الرد على رسالة محددة',
    intentSpecificLookup: 'البحث عن أمر ضروري',
    intentConsciousBreak: 'استراحة قصيرة واعية',
    selectTimeBid: '٢. حدد الوقت:',
    habitWallRequired: 'مطلوب إتمام مهمة الوعي أولاً',
    purityHeaderTitle: 'درع العفة والتعافي',
    purityDiscreetTitle: 'درع صفاء الذهن وضبط النفس',
    cleanStreakLabel: 'أيام الصفاء والعفة',
    daysLabel: 'يوم',
    hoursLabel: 'ساعة',
    minsLabel: 'دقيقة',
    urgesDefeatedLabel: 'انتصارات على الهوى',
    brainRewiringProgress: 'إعادة توازن الدوبامين (٩٠ يوماً)',
    panicSosButton: 'طوارئ: ثبّت قلبي الآن',
    morningPledgeBtn: 'عهد اليوم لغض البصر وحفظ الوقت',
    pledgedDoneText: 'تم العهد اليوم: حفظ البصر والقلب والوقت.',
    adultDnsShieldLabel: 'حظر المواقع الإباحية عبر DNS (1.1.1.3)',
    keywordBlockerLabel: 'حاجز الكلمات الإباحية في المتصفح الخفي',
    nightGuardLabel: 'حارس الليل (قفل المتصفحات ١١ م – ٦ ص)',
    resetStreakBtn: 'تسجيل كبوة وتحليل السبب',
    notificationDigestTitle: 'ملخص الإشعارات المجدول',
    monkModeTitle: 'وضع العمل العميق',
    physicalBrickTitle: 'قفل QR / NFC المادي المجاني',
    wisdomPackLabel: 'مصدر عبارات السكينة',
    packQuran: 'القرآن الكريم فقط',
    packHadith: 'الحديث النبوي فقط',
    packProverbs: 'حكم هدوء العقل',
    packBlended: 'مختلط (الكل)',
    grayscaleToggleLabel: 'الوضع الرمادي (أبيض وأسود)',
    languageLabel: 'اللغة (Language)',
  },
  ur: {
    appName: 'منیمم فون',
    byKasb: 'kasb LLC کی جانب سے · 100% مفت · بغیر اشتہارات',
    navHome: 'ہوم',
    navDrawer: 'تلاش',
    navPurity: 'پاکیزگی',
    navDigestFocus: 'فوکس',
    navSystemKasb: 'سیٹنگز',
    allQuietStatus: 'سب پرسکون ہے · 0 ہنگامی پیغامات',
    nextDigestAt: 'اگلا خلاصہ:',
    essentialAppsTitle: 'ضروری ایپس (زیادہ سے زیادہ 5)',
    profileWork: 'کام',
    profilePersonal: 'ذاتی',
    profileSunset: 'شام',
    openSearchDrawer: 'ایپ تلاش کرنے کے لیے پورا نام لکھیں...',
    quickScratchpadTitle: 'فوری نوٹ (بغیر کسی ایپ کے)',
    scratchpadPlaceholder: 'اپنا خیال لکھیں اور فون بند کریں...',
    calmWhisperLabel: 'قلب کا سکون',
    nextWhisperBtn: 'اگلا پیغام',
    startMonkModeBtn: 'گہرا ارتکاز',
    urgeSosBtn: 'خواہش روکیں (SOS)',
    searchPlaceholder: 'ہوش مندی سے ایپ کا پورا نام لکھیں...',
    searchHintRule: 'ضروری ٹولز فوراً کھلیں گے۔ وقت ضائع کرنے والی ایپس کا پورا نام لکھنا ہوگا۔',
    tierUtilityBadge: 'ٹول ایپ',
    tierRestrictedBadge: 'سانس کا وقفہ',
    typeExactToReveal: 'غیر ضروری ایپس پورا نام لکھنے تک مخفی رہتی ہیں۔',
    willThisServeYou: 'کیا یہ چیز اس وقت آپ کے دل کو سکون دے گی؟',
    breatheIn: 'آہستہ سانس لیں...',
    holdBreath: 'خاموشی سے رکیں...',
    breatheOut: 'بے چینی چھوڑ دیں...',
    returnToPeaceBtn: '[ سکون کی طرف لوٹیں ]',
    continueAnywayBtn: 'مقصد کے ساتھ آگے بڑھیں',
    microIntentTitle: '1. اپنا مقصد منتخب کریں:',
    intentReplyDm: 'ضروری پیغام کا جواب',
    intentSpecificLookup: 'مخصوص معلومات دیکھنا',
    intentConsciousBreak: 'مختصر وقفہ',
    selectTimeBid: '2. وقت مقرر کریں:',
    habitWallRequired: 'پہلے عادت کی دیوار مکمل کریں',
    purityHeaderTitle: 'پاکیزگی اور فحاشی سے حفاظت',
    purityDiscreetTitle: 'ذہنی صفائی اور خود ضابطگی شیلڈ',
    cleanStreakLabel: 'پاکیزہ اور محفوظ دن',
    daysLabel: 'دن',
    hoursLabel: 'گھنٹے',
    minsLabel: 'منٹ',
    urgesDefeatedLabel: 'ناکام بنائی گئی خواہشات',
    brainRewiringProgress: '90 دن کا ڈوپامائن ری سیٹ',
    panicSosButton: 'ایمرجنسی SOS — ابھی دل کو سنبھالیں',
    morningPledgeBtn: 'آج کی پاکیزگی اور نظر کی حفاظت کا عہد',
    pledgedDoneText: 'آج کا عہد مکمل: نظر، دل اور وقت کی حفاظت۔',
    adultDnsShieldLabel: 'سسٹم ایڈلٹ DNS فلٹر (1.1.1.3)',
    keywordBlockerLabel: 'براؤزر ایڈلٹ کی ورڈ بلاکر',
    nightGuardLabel: 'نائٹ گارڈ (رات 11 سے صبح 6 براؤزر لاک)',
    resetStreakBtn: 'ری سیٹ اور وجہ کا جائزہ',
    notificationDigestTitle: 'دن میں دو بار نوٹیفکیشن خلاصہ',
    monkModeTitle: 'مونک موڈ (گہرا کام)',
    physicalBrickTitle: 'مفت QR / NFC فزیکل لاک',
    wisdomPackLabel: 'سکونِ قلب کے پیغامات کا ماخذ',
    packQuran: 'صرف قرآن (سکینہ)',
    packHadith: 'صرف حدیث (سنت)',
    packProverbs: 'پرسکون ذہن کی ضرب الامثال',
    packBlended: 'مجموعی (تمام ذرائع)',
    grayscaleToggleLabel: 'بلیک اینڈ وائٹ (Grayscale) موڈ',
    languageLabel: 'زبان منتخب کریں (Language)',
  },
  id: {
    appName: 'MINIMUM PHONE',
    byKasb: 'oleh kasb LLC · 100% Gratis · Tanpa Iklan',
    navHome: 'Beranda',
    navDrawer: 'Cari',
    navPurity: 'Kesucian',
    navDigestFocus: 'Fokus & Digest',
    navSystemKasb: 'Vault & Setelan',
    allQuietStatus: 'Semua tenang · 0 pesan darurat',
    nextDigestAt: 'Ringkasan berikutnya pukul',
    essentialAppsTitle: 'APLIKASI ESENSIAL (MAKS 5)',
    profileWork: 'Kerja',
    profilePersonal: 'Pribadi',
    profileSunset: 'Malam',
    openSearchDrawer: 'Ketik nama lengkap aplikasi untuk mencari...',
    quickScratchpadTitle: 'CATATAN KILAT (TANPA BUKA APLIKASI)',
    scratchpadPlaceholder: 'Tulis pikiran Anda & kunci layar...',
    calmWhisperLabel: 'PENENANG PIKIRAN',
    nextWhisperBtn: 'Kutipan Lain',
    startMonkModeBtn: 'Mode Fokus',
    urgeSosBtn: 'SOS Dorongan',
    searchPlaceholder: 'Ketik nama aplikasi secara sadar...',
    searchHintRule: 'Alat utilitas langsung terbuka. Aplikasi pemicu dopamin butuh nama lengkap.',
    tierUtilityBadge: 'ALAT INSTAN',
    tierRestrictedBadge: 'JEDA NAPAS',
    typeExactToReveal: 'Aplikasi pengalih perhatian disembunyikan hingga diketik lengkap.',
    willThisServeYou: 'Apakah ini membawa ketenangan bagi hatimu sekarang?',
    breatheIn: 'Tarik napas perlahan...',
    holdBreath: 'Tahan dalam hening...',
    breatheOut: 'Lepaskan dorongan impulsif...',
    returnToPeaceBtn: '[ Kembali ke Ketenangan ]',
    continueAnywayBtn: 'Lanjutkan dengan niat',
    microIntentTitle: '1. Pilih niat spesifik Anda:',
    intentReplyDm: 'Membalas pesan penting',
    intentSpecificLookup: 'Mencari satu informasi',
    intentConsciousBreak: 'Istirahat singkat sadar',
    selectTimeBid: '2. Batasi waktu Anda:',
    habitWallRequired: 'Selesaikan Habit-Wall Terlebih Dahulu',
    purityHeaderTitle: 'PELINDUNG KESUCIAN & ANTI-PORNOGRAFI',
    purityDiscreetTitle: 'PERISAI KEJERNIHAN & NEURO-RESET',
    cleanStreakLabel: 'RENTETAN HARI BERSIH & TERJAGA',
    daysLabel: 'HARI',
    hoursLabel: 'JAM',
    minsLabel: 'MNT',
    urgesDefeatedLabel: 'Dorongan Dikalahkan',
    brainRewiringProgress: 'Pemulihan Dopamin 90 Hari',
    panicSosButton: 'SOS DARURAT — TENANGKAN PIKIRAN SEKARANG',
    morningPledgeBtn: 'Ambil Janji Kesucian & Fokus Hari Ini',
    pledgedDoneText: 'Janji hari ini aktif: Menjaga pandangan, hati, dan waktu.',
    adultDnsShieldLabel: 'Filter DNS Dewasa Sistem (1.1.1.3 Family)',
    keywordBlockerLabel: 'Pemblokir Kata Kunci Dewasa & Incognito',
    nightGuardLabel: 'Penjaga Malam (Kunci browser 23:00 – 06:00)',
    resetStreakBtn: 'Catat Kambuh & Analisis Pemicu',
    notificationDigestTitle: 'RINGKASAN NOTIFIKASI DUA KALI SEHARI',
    monkModeTitle: 'MODE MONK KERJA MENDALAM',
    physicalBrickTitle: 'KUNCI FISIK QR / NFC GRATIS',
    wisdomPackLabel: 'SUMBER KUTIPAN KETENANGAN',
    packQuran: 'Al-Quran Saja (Sakīnah)',
    packHadith: 'Hadits Saja (Sunnah)',
    packProverbs: 'Pepatah Pikiran Tenang',
    packBlended: 'Campuran (Semua)',
    grayscaleToggleLabel: 'Mode Layar Hitam-Putih (Grayscale)',
    languageLabel: 'BAHASA ANTARMUKA & KUTIPAN',
  },
};

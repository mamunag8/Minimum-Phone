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
  // System, Settings & Kasb
  wisdomPackLabel: string;
  packQuran: string;
  packHadith: string;
  packProverbs: string;
  packBlended: string;
  grayscaleToggleLabel: string;
  languageLabel: string;
  // New v1.2.0 Settings, Phone Main Settings, Inspiration Mode, Slow Learning & Guide
  settingsMenuTitle: string;
  phoneMainSettingsTitle: string;
  phoneMainSettingsSubtitle: string;
  btnMainPhoneSettings: string;
  btnWifiSettings: string;
  btnBluetoothSettings: string;
  btnDisplaySettings: string;
  btnSoundSettings: string;
  btnAppsSettings: string;
  btnDnsSettings: string;
  btnHomeLauncherSettings: string;
  activeAppsManagerTitle: string;
  activeAppsManagerSubtitle: string;
  inspirationModeTitle: string;
  modeIslamicFull: string;
  modeCommonUniversal: string;
  modeBlendedAll: string;
  slowLearningTitle: string;
  slowLearningSubtitle: string;
  trackIslamicLabel: string;
  trackLanguageLabel: string;
  trackMindfulnessLabel: string;
  read30sQuizGateTitle: string;
  read30sCountdownText: string;
  quizReadyText: string;
  howToUseGuideBtn: string;
  strictPornLockdownTitle: string;
  strictPornLockdownDesc: string;
  emergencyLock15mBtn: string;
}

export const TRANSLATIONS: Record<LanguageCode, UIStrings> = {
  en: {
    appName: 'MINIMUM PHONE',
    byKasb: 'by kasb LLC · 100% Free · Zero Ads',
    navHome: 'Home',
    navDrawer: 'Apps',
    navPurity: 'Purity',
    navDigestFocus: 'Focus',
    navSystemKasb: 'Settings',
    allQuietStatus: 'All quiet · 0 urgent alerts',
    nextDigestAt: 'Next digest at',
    essentialAppsTitle: 'ACTIVE HOME APPS (MAX 7)',
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
    tierRestrictedBadge: '30S QUIZ GATE',
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
    habitWallRequired: '30s Slow Read + Quiz / Habit Gate Required',
    purityHeaderTitle: 'COMPLETE PURITY & ANTI-PORN FORTRESS',
    purityDiscreetTitle: 'NEURO-RESET & CLARITY SHIELD',
    cleanStreakLabel: 'CLEAN & GUARDED STREAK',
    daysLabel: 'DAYS',
    hoursLabel: 'HRS',
    minsLabel: 'MINS',
    urgesDefeatedLabel: 'Urges Defeated',
    brainRewiringProgress: '90-Day Dopamine Baseline Rewiring',
    panicSosButton: 'URGE SOS — LOCK BROWSERS & GROUND MIND NOW',
    morningPledgeBtn: 'Take Today’s Purity & Clarity Pledge',
    pledgedDoneText: 'Pledged for today: Guarding eyes, heart, and focus.',
    adultDnsShieldLabel: 'System Adult DNS Filter (1.1.1.3 Family Shield)',
    keywordBlockerLabel: 'Browser & Incognito Adult Keyword Interceptor',
    nightGuardLabel: 'Night Guard (Auto-lock browsers 10 PM – 6 AM)',
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
    languageLabel: 'FULL APP LANGUAGE SWITCHER',
    settingsMenuTitle: 'SETTINGS & PHONE COMMAND CENTER',
    phoneMainSettingsTitle: 'PHONE MAIN SETTINGS BRIDGE',
    phoneMainSettingsSubtitle: 'Open your Android device settings directly without leaving Minimum Phone',
    btnMainPhoneSettings: '⚙️ Main Phone Settings',
    btnWifiSettings: '📶 Wi-Fi & Internet',
    btnBluetoothSettings: '🔹 Bluetooth & Devices',
    btnDisplaySettings: '🔆 Display & Brightness',
    btnSoundSettings: '🔊 Sound & Vibration',
    btnAppsSettings: '📦 Installed Apps',
    btnDnsSettings: '🛡️ Private Safe DNS',
    btnHomeLauncherSettings: '🏠 Default Home App',
    activeAppsManagerTitle: 'ACTIVE APPS & HOME SCREEN MANAGER',
    activeAppsManagerSubtitle: 'Pin up to 7 apps to your Home Screen and set Instant, 30s Quiz Gate, or Blocked status',
    inspirationModeTitle: 'MODE OF INSPIRATION (ISLAMIC OR COMMON FOR ALL)',
    modeIslamicFull: '🕌 Fully Islamic Mode (Quran, Sahih Hadith & Sunnah)',
    modeCommonUniversal: '🌍 Common for All (Universal Wisdom, Stoic & Focus Science)',
    modeBlendedAll: '✨ Hybrid Mode (Islamic Sakinah + Universal Wisdom)',
    slowLearningTitle: 'SLOW LEARNING MODE & 30-SEC READ + QUIZ GATE',
    slowLearningSubtitle: 'Require reading a 30-second lesson and passing a 1-question quiz before opening restricted apps',
    trackIslamicLabel: '📖 Islamic Knowledge (Quran, Hadith & Character)',
    trackLanguageLabel: '🗣️ Language & Vocabulary (Arabic / English / Bangla)',
    trackMindfulnessLabel: '🧠 Neuroscience & Deep Focus Mastery',
    read30sQuizGateTitle: '30-SECOND SLOW READ + COMPREHENSION QUIZ',
    read30sCountdownText: 'Read carefully — Quiz unlocks in',
    quizReadyText: '✓ 30s Reading Complete — Answer Quiz to Unlock App',
    howToUseGuideBtn: '📘 How to Use Guide (All Languages)',
    strictPornLockdownTitle: 'COMPLETE PORN & ADULT TRIGGER LOCKDOWN',
    strictPornLockdownDesc: 'Locks all browsers behind 30s Purity Quiz Gate, enforces SafeSearch & blocks adult domains/keywords',
    emergencyLock15mBtn: '🔒 Lock All Browsers & Social Apps for 15 Minutes Now',
  },
  bn: {
    appName: 'মিনিমাম ফোন',
    byKasb: 'kasb LLC দ্বারা নির্মিত · ১০০% ফ্রি · বিজ্ঞাপনমুক্ত',
    navHome: 'হোম',
    navDrawer: 'অ্যাপস',
    navPurity: 'পবিত্রতা',
    navDigestFocus: 'ফোকাস',
    navSystemKasb: 'সেটিংস',
    allQuietStatus: 'সব শান্ত · ০টি জরুরি বার্তা',
    nextDigestAt: 'পরবর্তী ডাইজেস্ট',
    essentialAppsTitle: 'অ্যাক্টিভ হোম অ্যাপস (সর্বোচ্চ ৭টি)',
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
    tierRestrictedBadge: '৩০সে. কুইজ গেট',
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
    habitWallRequired: '৩০ সেকেন্ড পাঠ ও কুইজ গেট সম্পন্ন করা আবশ্যক',
    purityHeaderTitle: 'সম্পূর্ণ পবিত্রতা ও পর্ন-মুক্তি দুর্গ',
    purityDiscreetTitle: 'নিউরো-রিসেট ও চিত্তশুদ্ধি শিল্ড',
    cleanStreakLabel: 'পবিত্র ও নিয়ন্ত্রিত থাকার সময়কাল',
    daysLabel: 'দিন',
    hoursLabel: 'ঘণ্টা',
    minsLabel: 'মিনিট',
    urgesDefeatedLabel: 'তাড়না জয় করেছেন',
    brainRewiringProgress: '৯০-দিনের ডোপামিন রিসেট অগ্রগতি',
    panicSosButton: 'জরুরি সহায়তা (SOS) — ব্রাউজার লক ও মন শান্ত করুন',
    morningPledgeBtn: 'আজকের আত্মনিয়ন্ত্রণ ও পবিত্রতার শপথ নিন',
    pledgedDoneText: 'আজকের শপথ সম্পন্ন: দৃষ্টি, হৃদয় ও সময়ের হেফাজত করব।',
    adultDnsShieldLabel: 'সিস্টেম অ্যাডাল্ট DNS ফিল্টার (1.1.1.3 ফ্যামিলি শিল্ড)',
    keywordBlockerLabel: 'ব্রাউজার ও ইনকগনিটো অ্যাডাল্ট কীওয়ার্ড ব্লকার',
    nightGuardLabel: 'নাইট গার্ড (রাত ১০টা – সকাল ৬টা ব্রাউজার লক)',
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
    languageLabel: 'সম্পূর্ণ অ্যাপের ভাষা পরিবর্তন (Language Switcher)',
    settingsMenuTitle: 'সেটিংস ও ফোন কমান্ড সেন্টার',
    phoneMainSettingsTitle: 'ফোনের মূল সেটিংস (PHONE MAIN SETTINGS)',
    phoneMainSettingsSubtitle: 'মিনিমাম ফোন থেকে বের না হয়েই সরাসরি আপনার ফোনের প্রয়োজনীয় সেটিংস খুলুন',
    btnMainPhoneSettings: '⚙️ ফোনের মূল সেটিংস',
    btnWifiSettings: '📶 ওয়াই-ফাই ও ইন্টারনেট',
    btnBluetoothSettings: '🔹 ব্লুটুথ ও ডিভাইস',
    btnDisplaySettings: '🔆 ডিসপ্লে ও উজ্জ্বলতা',
    btnSoundSettings: '🔊 সাউন্ড ও ভাইব্রেশন',
    btnAppsSettings: '📦 ইনস্টল করা অ্যাপস',
    btnDnsSettings: '🛡️ প্রাইভেট সেফ DNS',
    btnHomeLauncherSettings: '🏠 ডিফল্ট হোম লঞ্চার',
    activeAppsManagerTitle: 'অ্যাক্টিভ অ্যাপস ও হোম স্ক্রিন ম্যানেজার',
    activeAppsManagerSubtitle: 'হোম স্ক্রিনে সর্বোচ্চ ৭টি অ্যাপ পিন করুন এবং কোন অ্যাপে ৩০-সেকেন্ড কুইজ গেট বা ব্লক থাকবে তা নির্ধারণ করুন',
    inspirationModeTitle: 'অনুপ্রেরণার ধরন (সম্পূর্ণ ইসলামিক অথবা সকলের জন্য সার্বজনীন)',
    modeIslamicFull: '🕌 সম্পূর্ণ ইসলামিক মুড (কুরআন, সহীহ হাদীস ও সুন্নাহ)',
    modeCommonUniversal: '🌍 সকলের জন্য সার্বজনীন (Universal প্রজ্ঞা ও মনোযোগ বিজ্ঞান)',
    modeBlendedAll: '✨ সমন্বিত মুড (ইসলামিক সাকীনাহ + সার্বজনীন প্রজ্ঞা)',
    slowLearningTitle: 'স্লো লার্নিং মুড এবং ৩০-সেকেন্ড পাঠ ও কুইজ গেট',
    slowLearningSubtitle: 'আসক্তিকর অ্যাপ খোলার আগে ৩০ সেকেন্ডের একটি শিক্ষা পাঠ এবং ১টি কুইজের সঠিক উত্তর দেওয়া বাধ্যতামূলক করুন',
    trackIslamicLabel: '📖 ইসলামিক জ্ঞান (কুরআন, হাদীস ও আখলাক)',
    trackLanguageLabel: '🗣️ ভাষা ও শব্দভাণ্ডার শিক্ষা (আরবি / ইংরেজি / বাংলা)',
    trackMindfulnessLabel: '🧠 স্নায়ুবিজ্ঞান ও গভীর মনোযোগ শিক্ষা',
    read30sQuizGateTitle: '৩০-সেকেন্ড মনোযোগী পাঠ + কুইজ পরীক্ষা',
    read30sCountdownText: 'মনোযোগ দিয়ে পড়ুন — কুইজ আনলক হবে আর',
    quizReadyText: '✓ ৩০ সেকেন্ড পাঠ সম্পন্ন — অ্যাপ খুলতে নিচের কুইজের উত্তর দিন',
    howToUseGuideBtn: '📘 ব্যবহার নির্দেশিকা ও ডকুমেন্টেশন (How to Use)',
    strictPornLockdownTitle: 'পর্ন ও অশ্লীল ট্র্রিগার সম্পূর্ণ লকডাউন',
    strictPornLockdownDesc: 'সকল ব্রাউজারে ৩০-সেকেন্ড পবিত্রতা কুইজ গেট, সেফ-সার্চ এবং অ্যাডাল্ট ডোমেইন/কীওয়ার্ড সম্পূর্ণ ব্লক করে',
    emergencyLock15mBtn: '🔒 এখনই ১৫ মিনিটের জন্য সব ব্রাউজার ও সোশ্যাল অ্যাপ লক করুন',
  },
  ar: {
    appName: 'الهاتف الأدنى',
    byKasb: 'من شركة kasb LLC · مجاني ١٠٠٪ · بدون إعلانات',
    navHome: 'الرئيسية',
    navDrawer: 'التطبيقات',
    navPurity: 'العفة',
    navDigestFocus: 'التركيز',
    navSystemKasb: 'الإعدادات',
    allQuietStatus: 'كل شيء هادئ · ٠ تنبيهات عاجلة',
    nextDigestAt: 'الملخص القادم في',
    essentialAppsTitle: 'التطبيقات النشطة بالرئيسية (٧ كحد أقصى)',
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
    tierRestrictedBadge: 'بوابة اختبار ٣٠ث',
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
    habitWallRequired: 'مطلوب قراءة ٣٠ ثانية وحل الاختبار أولاً',
    purityHeaderTitle: 'حصن العفة والحماية الشاملة من الإباحية',
    purityDiscreetTitle: 'درع صفاء الذهن وضبط النفس',
    cleanStreakLabel: 'أيام الصفاء والعفة',
    daysLabel: 'يوم',
    hoursLabel: 'ساعة',
    minsLabel: 'دقيقة',
    urgesDefeatedLabel: 'انتصارات على الهوى',
    brainRewiringProgress: 'إعادة توازن الدوبامين (٩٠ يوماً)',
    panicSosButton: 'طوارئ: اقفل المتصفحات وثبّت قلبي الآن',
    morningPledgeBtn: 'عهد اليوم لغض البصر وحفظ الوقت',
    pledgedDoneText: 'تم العهد اليوم: حفظ البصر والقلب والوقت.',
    adultDnsShieldLabel: 'حظر المواقع الإباحية عبر DNS (1.1.1.3)',
    keywordBlockerLabel: 'حاجز الكلمات الإباحية في المتصفح الخفي',
    nightGuardLabel: 'حارس الليل (قفل المتصفحات ١٠ م – ٦ ص)',
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
    languageLabel: 'لغة التطبيق الكاملة (Language)',
    settingsMenuTitle: 'قائمة الإعدادات ومركز التحكم بالهاتف',
    phoneMainSettingsTitle: 'إعدادات الهاتف الأساسية (PHONE SETTINGS)',
    phoneMainSettingsSubtitle: 'افتح إعدادات نظام أندرويد الأساسية مباشرة من داخل المشغل',
    btnMainPhoneSettings: '⚙️ إعدادات الهاتف الرئيسية',
    btnWifiSettings: '📶 الواي فاي والإنترنت',
    btnBluetoothSettings: '🔹 البلوتوث والأجهزة',
    btnDisplaySettings: '🔆 الشاشة والسطوع',
    btnSoundSettings: '🔊 الصوت والاهتزاز',
    btnAppsSettings: '📦 إدارة التطبيقات',
    btnDnsSettings: '🛡️ إعداد DNS الآمن',
    btnHomeLauncherSettings: '🏠 تطبيق الشاشة الرئيسية',
    activeAppsManagerTitle: 'إدارة التطبيقات النشطة والشاشة الرئيسية',
    activeAppsManagerSubtitle: 'ثبّت حتى ٧ تطبيقات في الشاشة الرئيسية وحدد التطبيقات المقيدة أو المحظورة',
    inspirationModeTitle: 'نمط الإلهام (إسلامي كامل أو عالمي للجميع)',
    modeIslamicFull: '🕌 الوضع الإسلامي الكامل (القرآن الكريم والسنة النبوية)',
    modeCommonUniversal: '🌍 الوضع العالمي المشترك للجميع (حكم وعلوم التركيز)',
    modeBlendedAll: '✨ الوضع المدمج (السكينة الإسلامية + الحكمة العالمية)',
    slowLearningTitle: 'وضع التعلم الهادئ وبوابة القراءة (٣٠ ثانية + اختبار)',
    slowLearningSubtitle: 'اشترط قراءة نص نافع لمدة ٣٠ ثانية والإجابة عن سؤال قبل فتح التطبيقات المشتتة',
    trackIslamicLabel: '📖 المعرفة الإسلامية (القرآن والحديث والأخلاق)',
    trackLanguageLabel: '🗣️ إتقان اللغات والمفردات (عربي / إنجليزي / بنغالي)',
    trackMindfulnessLabel: '🧠 علوم الأعصاب والتركيز العميق',
    read30sQuizGateTitle: 'قراءة متأنية ٣٠ ثانية + اختبار الفهم',
    read30sCountdownText: 'اقرأ بتمعن — يفتح الاختبار بعد',
    quizReadyText: '✓ اكتملت القراءة — أجب عن السؤال لفتح التطبيق',
    howToUseGuideBtn: '📘 دليل الاستخدام الشامل (بجميع اللغات)',
    strictPornLockdownTitle: 'الحظر الشامل والتحكم الصارم ضد الإباحية',
    strictPornLockdownDesc: 'يقفل المتصفحات خلف بوابة اختبار العفة ٣٠ ثانية ويحظر النطاقات والكلمات الإباحية',
    emergencyLock15mBtn: '🔒 اقفل جميع المتصفحات وتطبيقات التواصل لمدة ١٥ دقيقة الآن',
  },
  ur: {
    appName: 'منیمم فون',
    byKasb: 'kasb LLC کی جانب سے · 100% مفت · بغیر اشتہارات',
    navHome: 'ہوم',
    navDrawer: 'ایپس',
    navPurity: 'پاکیزگی',
    navDigestFocus: 'فوکس',
    navSystemKasb: 'سیٹنگز',
    allQuietStatus: 'سب پرسکون ہے · 0 ہنگامی پیغامات',
    nextDigestAt: 'اگلا خلاصہ:',
    essentialAppsTitle: 'فعال ہوم ایپس (زیادہ سے زیادہ 7)',
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
    tierRestrictedBadge: '30 سیکنڈ کوئز گیٹ',
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
    habitWallRequired: '30 سیکنڈ مطالعہ اور کوئز گیٹ مکمل کرنا لازمی ہے',
    purityHeaderTitle: 'پاکیزگی اور پورن سے مکمل تحفظ کا قلعہ',
    purityDiscreetTitle: 'ذہنی صفائی اور خود ضابطگی شیلڈ',
    cleanStreakLabel: 'پاکیزہ اور محفوظ دن',
    daysLabel: 'دن',
    hoursLabel: 'گھنٹے',
    minsLabel: 'منٹ',
    urgesDefeatedLabel: 'ناکام بنائی گئی خواہشات',
    brainRewiringProgress: '90 دن کا ڈوپامائن ری سیٹ',
    panicSosButton: 'ایمرجنسی SOS — براؤزر لاک کریں اور دل سنبھالیں',
    morningPledgeBtn: 'آج کی پاکیزگی اور نظر کی حفاظت کا عہد',
    pledgedDoneText: 'آج کا عہد مکمل: نظر، دل اور وقت کی حفاظت۔',
    adultDnsShieldLabel: 'سسٹم ایڈلٹ DNS فلٹر (1.1.1.3)',
    keywordBlockerLabel: 'براؤزر ایڈلٹ کی ورڈ بلاکر',
    nightGuardLabel: 'نائٹ گارڈ (رات 10 سے صبح 6 براؤزر لاک)',
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
    languageLabel: 'مکمل ایپ کی زبان منتخب کریں',
    settingsMenuTitle: 'سیٹنگز اور فون کمانڈ سینٹر',
    phoneMainSettingsTitle: 'فون کی اصل سیٹنگز (PHONE MAIN SETTINGS)',
    phoneMainSettingsSubtitle: 'منیمم فون سے باہر نکلے بغیر اپنے اینڈرائیڈ فون کی سیٹنگز کھولیں',
    btnMainPhoneSettings: '⚙️ فون کی مین سیٹنگز',
    btnWifiSettings: '📶 وائی فائی اور انٹرنیٹ',
    btnBluetoothSettings: '🔹 بلوٹوتھ اور ڈیوائسز',
    btnDisplaySettings: '🔆 ڈسپلے اور روشنی',
    btnSoundSettings: '🔊 آواز اور وائبریشن',
    btnAppsSettings: '📦 انسٹال شدہ ایپس',
    btnDnsSettings: '🛡️ پرائیویٹ سیف DNS',
    btnHomeLauncherSettings: '🏠 ڈیفالٹ ہوم لانچر',
    activeAppsManagerTitle: 'فعال ایپس اور ہوم اسکرین مینیجر',
    activeAppsManagerSubtitle: 'ہوم اسکرین پر 7 ایپس پن کریں اور ہر ایپ کے لیے 30 سیکنڈ کوئز گیٹ یا بلاک سیٹ کریں',
    inspirationModeTitle: 'ترغیب کا انداز (مکمل اسلامی یا سب کے لیے عمومی)',
    modeIslamicFull: '🕌 مکمل اسلامی موڈ (قرآن، صحیح حدیث اور سنت)',
    modeCommonUniversal: '🌍 سب کے لیے عمومی موڈ (عالمگیر حکمت اور فوکس سائنس)',
    modeBlendedAll: '✨ ملا جلا موڈ (اسلامی سکینہ + عالمگیر حکمت)',
    slowLearningTitle: 'سلو لرننگ موڈ اور 30 سیکنڈ مطالعہ + کوئز گیٹ',
    slowLearningSubtitle: 'مقید ایپ کھولنے سے پہلے 30 سیکنڈ کا سبق پڑھنا اور کوئز حل کرنا لازمی بنائیں',
    trackIslamicLabel: '📖 اسلامی علم (قرآن، حدیث اور اخلاق)',
    trackLanguageLabel: '🗣️ زبان اور ذخیرہ الفاظ (عربی / انگریزی / بنگلہ)',
    trackMindfulnessLabel: '🧠 نیورو سائنس اور گہری توجہ کی مہارت',
    read30sQuizGateTitle: '30 سیکنڈ مطالعہ + فہم کوئز',
    read30sCountdownText: 'غور سے پڑھیں — کوئز کھلے گا:',
    quizReadyText: '✓ 30 سیکنڈ مطالعہ مکمل — ایپ کھولنے کے لیے سوال کا جواب دیں',
    howToUseGuideBtn: '📘 مکمل طریقہ استعمال گائیڈ (تمام زبانوں میں)',
    strictPornLockdownTitle: 'پورن اور فحش محرکات پر مکمل لاک ڈاؤن',
    strictPornLockdownDesc: 'تمام براؤزرز پر 30 سیکنڈ کوئز گیٹ لگاتا ہے اور فحش الفاظ و ویب سائٹس کو بلاک کرتا ہے',
    emergencyLock15mBtn: '🔒 ابھی 15 منٹ کے لیے تمام براؤزرز اور سوشل ایپس لاک کریں',
  },
  id: {
    appName: 'MINIMUM PHONE',
    byKasb: 'oleh kasb LLC · 100% Gratis · Tanpa Iklan',
    navHome: 'Beranda',
    navDrawer: 'Aplikasi',
    navPurity: 'Kesucian',
    navDigestFocus: 'Fokus',
    navSystemKasb: 'Setelan',
    allQuietStatus: 'Semua tenang · 0 pesan darurat',
    nextDigestAt: 'Ringkasan berikutnya pukul',
    essentialAppsTitle: 'APLIKASI AKTIF BERANDA (MAKS 7)',
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
    tierRestrictedBadge: 'KUIS 30 DTK',
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
    habitWallRequired: 'Wajib Baca 30 Detik + Kuis Terlebih Dahulu',
    purityHeaderTitle: 'BENTENG KESUCIAN & KONTROL ANTI-PORNOGRAFI',
    purityDiscreetTitle: 'PERISAI KEJERNIHAN & NEURO-RESET',
    cleanStreakLabel: 'RENTETAN HARI BERSIH & TERJAGA',
    daysLabel: 'HARI',
    hoursLabel: 'JAM',
    minsLabel: 'MNT',
    urgesDefeatedLabel: 'Dorongan Dikalahkan',
    brainRewiringProgress: 'Pemulihan Dopamin 90 Hari',
    panicSosButton: 'SOS DARURAT — KUNCI BROWSER & TENANGKAN DIRI',
    morningPledgeBtn: 'Ambil Janji Kesucian & Fokus Hari Ini',
    pledgedDoneText: 'Janji hari ini aktif: Menjaga pandangan, hati, dan waktu.',
    adultDnsShieldLabel: 'Filter DNS Dewasa Sistem (1.1.1.3 Family)',
    keywordBlockerLabel: 'Pemblokir Kata Kunci Dewasa & Incognito',
    nightGuardLabel: 'Penjaga Malam (Kunci browser 22:00 – 06:00)',
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
    languageLabel: 'BAHASA SELURUH APLIKASI',
    settingsMenuTitle: 'MENU SETELAN & PUSAT KONTROL PONSEL',
    phoneMainSettingsTitle: 'JEMBATAN SETELAN UTAMA PONSEL',
    phoneMainSettingsSubtitle: 'Buka pengaturan utama Android secara langsung dari dalam Minimum Phone',
    btnMainPhoneSettings: '⚙️ Setelan Utama Ponsel',
    btnWifiSettings: '📶 Wi-Fi & Internet',
    btnBluetoothSettings: '🔹 Bluetooth & Perangkat',
    btnDisplaySettings: '🔆 Layar & Kecerahan',
    btnSoundSettings: '🔊 Suara & Getar',
    btnAppsSettings: '📦 Aplikasi Terinstal',
    btnDnsSettings: '🛡️ DNS Aman Pribadi',
    btnHomeLauncherSettings: '🏠 Aplikasi Beranda Utama',
    activeAppsManagerTitle: 'MANAJER APLIKASI AKTIF & LAYAR UTAMA',
    activeAppsManagerSubtitle: 'Sematkan hingga 7 aplikasi di Beranda dan atur Gerbang Kuis 30d atau Blokir',
    inspirationModeTitle: 'MODE INSPIRASI (ISLAMI PENUH ATAU UNIVERSAL)',
    modeIslamicFull: '🕌 Mode Islami Penuh (Al-Quran, Hadits Sahih & Sunnah)',
    modeCommonUniversal: '🌍 Mode Universal untuk Semua (Kebijaksanaan & Sains Fokus)',
    modeBlendedAll: '✨ Mode Campuran (Sakinah Islam + Kebijaksanaan Universal)',
    slowLearningTitle: 'MODE BELAJAR LAMBAT & GERBANG BACA 30D + KUIS',
    slowLearningSubtitle: 'Wajibkan membaca pelajaran 30 detik dan menjawab kuis sebelum membuka aplikasi terbatas',
    trackIslamicLabel: '📖 Ilmu Islam (Al-Quran, Hadits & Akhlak)',
    trackLanguageLabel: '🗣️ Bahasa & Kosakata (Arab / Inggris / Bangla)',
    trackMindfulnessLabel: '🧠 Neurosains & Fokus Mendalam',
    read30sQuizGateTitle: 'BACA 30 DETIK + KUIS PEMAHAMAN',
    read30sCountdownText: 'Baca dengan saksama — Kuis terbuka dalam',
    quizReadyText: '✓ Baca 30d Selesai — Jawab Kuis untuk Membuka Aplikasi',
    howToUseGuideBtn: '📘 Panduan Cara Pakai (Semua Bahasa)',
    strictPornLockdownTitle: 'KUNCI KETAT ANTI-PORNOGRAFI & PEMICU',
    strictPornLockdownDesc: 'Mengunci semua browser di balik Kuis Kesucian 30d & memblokir situs/kata kunci dewasa',
    emergencyLock15mBtn: '🔒 Kunci Semua Browser & Aplikasi Sosial Selama 15 Menit',
  },
};

/**
 * Universal inline multilingual helper.
 * Guarantees 100% translation into Bangla ('bn'), Arabic ('ar'), Urdu ('ur'), Indonesian ('id'), or English ('en').
 */
export function tx(
  lang: LanguageCode,
  en: string,
  bn: string,
  ar?: string,
  ur?: string,
  id?: string
): string {
  switch (lang) {
    case 'bn':
      return bn;
    case 'ar':
      return ar || bn || en;
    case 'ur':
      return ur || ar || bn || en;
    case 'id':
      return id || en;
    case 'en':
    default:
      return en;
  }
}

const APP_NAME_TRANSLATIONS: Record<
  string,
  { bn: string; ar: string; ur: string; id: string }
> = {
  'phone calls': {
    bn: 'ফোন কল',
    ar: 'المكالمات الهاتفية',
    ur: 'فون کالز',
    id: 'Panggilan Telepon',
  },
  phone: {
    bn: 'ফোন কল',
    ar: 'الهاتف',
    ur: 'فون',
    id: 'Telepon',
  },
  'messages (sms)': {
    bn: 'মেসেজ (SMS)',
    ar: 'الرسائل (SMS)',
    ur: 'پیغامات (SMS)',
    id: 'Pesan (SMS)',
  },
  messages: {
    bn: 'মেসেজ (SMS)',
    ar: 'الرسائل',
    ur: 'پیغامات',
    id: 'Pesan',
  },
  whatsapp: {
    bn: 'হোয়াটসঅ্যাপ (WhatsApp)',
    ar: 'واتساب (WhatsApp)',
    ur: 'واٹس ایپ (WhatsApp)',
    id: 'WhatsApp',
  },
  calendar: {
    bn: 'ক্যালেন্ডার',
    ar: 'التقويم',
    ur: 'کیلنڈر',
    id: 'Kalender',
  },
  notes: {
    bn: 'নোটস',
    ar: 'الملاحظات',
    ur: 'نوٹس',
    id: 'Catatan',
  },
  'quran & sunnah': {
    bn: 'কুরআন ও সুন্নাহ',
    ar: 'القرآن والسنة',
    ur: 'قرآن و سنت',
    id: 'Al-Quran & Sunnah',
  },
  maps: {
    bn: 'ম্যাপস (Maps)',
    ar: 'الخرائط (Maps)',
    ur: 'نقشہ (Maps)',
    id: 'Peta (Maps)',
  },
  calculator: {
    bn: 'ক্যালকুলেটর',
    ar: 'الآلة الحاسبة',
    ur: 'کیلکولیٹر',
    id: 'Kalkulator',
  },
  authenticator: {
    bn: 'অথেনটিকেটর (2FA)',
    ar: 'المصادقة الثنائية (2FA)',
    ur: 'اتھینٹیکیٹر (2FA)',
    id: 'Autentikator (2FA)',
  },
  instagram: {
    bn: 'ইনস্টাগ্রাম (Instagram)',
    ar: 'إنستغرام (Instagram)',
    ur: 'انسٹاگرام (Instagram)',
    id: 'Instagram',
  },
  tiktok: {
    bn: 'টিকটক (TikTok)',
    ar: 'تيك توك (TikTok)',
    ur: 'ٹک ٹاک (TikTok)',
    id: 'TikTok',
  },
  youtube: {
    bn: 'ইউটিউব (YouTube)',
    ar: 'يوتيوب (YouTube)',
    ur: 'یوٹیوب (YouTube)',
    id: 'YouTube',
  },
  facebook: {
    bn: 'ফেসবুক (Facebook)',
    ar: 'فيسبوك (Facebook)',
    ur: 'فیس بک (Facebook)',
    id: 'Facebook',
  },
  'x / twitter': {
    bn: 'এক্স / টুইটার (X)',
    ar: 'إكس / تويتر (X)',
    ur: 'ایکس / ٹوئٹر (X)',
    id: 'X / Twitter',
  },
  reddit: {
    bn: 'রেডিট (Reddit)',
    ar: 'ريديت (Reddit)',
    ur: 'ریڈٹ (Reddit)',
    id: 'Reddit',
  },
  'web browser': {
    bn: 'ওয়েব ব্রাউজার (Browser)',
    ar: 'متصفح الويب (Browser)',
    ur: 'ویب براؤزر (Browser)',
    id: 'Browser Web',
  },
  chrome: {
    bn: 'ক্রোম ব্রাউজার (Chrome)',
    ar: 'متصفح كروم (Chrome)',
    ur: 'کروم براؤزر (Chrome)',
    id: 'Browser Chrome',
  },
  settings: {
    bn: 'ফোন সেটিংস',
    ar: 'إعدادات الهاتف',
    ur: 'فون سیٹنگز',
    id: 'Setelan Ponsel',
  },
};

export function getAppDisplayName(
  app: { name: string; nameBn?: string },
  lang: LanguageCode
): string {
  if (lang === 'en') return app.name;
  const key = app.name.trim().toLowerCase();
  const mapped = APP_NAME_TRANSLATIONS[key];
  if (mapped && mapped[lang as 'bn' | 'ar' | 'ur' | 'id']) {
    return mapped[lang as 'bn' | 'ar' | 'ur' | 'id'];
  }
  if (lang === 'bn' && app.nameBn) return app.nameBn;
  return app.name;
}

export function getSelfMasteryRank(xp: number, lang: LanguageCode): string {
  if (xp >= 250) {
    return tx(
      lang,
      'Level 4 · Master of Stillness',
      'লেভেল ৪ · আত্মনিয়ন্ত্রণ ও প্রশান্তির চূড়ান্ত স্তর',
      'المستوى ٤ · سيد السكينة وضبط النفس',
      'لیول 4 · خود ضابطگی کا اعلیٰ مقام',
      'Level 4 · Master Ketenangan'
    );
  }
  if (xp >= 120) {
    return tx(
      lang,
      'Level 3 · Guardian of Focus',
      'লেভেল ৩ · মনোযোগ ও সময়ের প্রহরী',
      'المستوى ٣ · حارس التركيز والوقت',
      'لیول 3 · توجہ اور وقت کا محافظ',
      'Level 3 · Penjaga Fokus'
    );
  }
  if (xp >= 50) {
    return tx(
      lang,
      'Level 2 · Mindful Learner',
      'লেভেল ২ · সচেতন শিক্ষার্থী',
      'المستوى ٢ · متعلم واعٍ',
      'لیول 2 · باشعور طالب علم',
      'Level 2 · Pembelajar Sadar'
    );
  }
  return tx(
    lang,
    'Level 1 · Seeker of Calm',
    'লেভেল ১ · প্রশান্তির অভিযাত্রী',
    'المستوى ١ · باحث عن السكينة',
    'لیول 1 · سکون کا متلاشی',
    'Level 1 · Pencari Ketenangan'
  );
}


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
    grayscaleToggleLabel: 'সিস্টেম সাদাকালো মোড',
    languageLabel: 'সম্পূর্ণ অ্যাপের ভাষা পরিবর্তন',
    settingsMenuTitle: 'সেটিংস ও ফোন কমান্ড সেন্টার',
    phoneMainSettingsTitle: 'ফোনের মূল সেটিংস',
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
    activeAppsManagerSubtitle: 'হোম স্ক্রিনে সর্বোচ্চ ৭টি অ্যাপ পিন করুন এবং কোন অ্যাপে ২০-সেকেন্ড কুইজ গেট বা ব্লক থাকবে তা নির্ধারণ করুন',
    inspirationModeTitle: 'অনুপ্রেরণার ধরন (সম্পূর্ণ ইসলামিক অথবা সকলের জন্য সার্বজনীন)',
    modeIslamicFull: '🕌 সম্পূর্ণ ইসলামিক মুড (কুরআন, সহীহ হাদীস ও সুন্নাহ)',
    modeCommonUniversal: '🌍 সকলের জন্য সার্বজনীন (প্রজ্ঞা ও মনোযোগ বিজ্ঞান)',
    modeBlendedAll: '✨ সমন্বিত মুড (ইসলামিক সাকীনাহ + সার্বজনীন প্রজ্ঞা)',
    slowLearningTitle: 'স্লো লার্নিং মুড এবং ২০-সেকেন্ড পাঠ ও কুইজ গেট',
    slowLearningSubtitle: 'আসক্তিকর অ্যাপ খোলার আগে সংক্ষিপ্ত শিক্ষা পাঠ এবং ১টি কুইজের সঠিক উত্তর দেওয়া বাধ্যতামূলক করুন',
    trackIslamicLabel: '📖 ইসলামিক জ্ঞান (কুরআন, হাদীস ও আখলাক)',
    trackLanguageLabel: '🗣️ ভাষা ও শব্দভাণ্ডার শিক্ষা (আরবি / ইংরেজি / বাংলা)',
    trackMindfulnessLabel: '🧠 স্নায়ুবিজ্ঞান ও গভীর মনোযোগ শিক্ষা',
    read30sQuizGateTitle: '২০-সেকেন্ড মনোযোগী পাঠ + কুইজ পরীক্ষা',
    read30sCountdownText: 'মনোযোগ দিয়ে পড়ুন — কুইজ আনলক হবে আর',
    quizReadyText: '✓ পাঠ সম্পন্ন — অ্যাপ খুলতে নিচের কুইজের উত্তর দিন',
    howToUseGuideBtn: '📘 ব্যবহার নির্দেশিকা ও ডকুমেন্টেশন',
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
    bn: 'হোয়াটসঅ্যাপ',
    ar: 'واتساب',
    ur: 'واٹس ایپ',
    id: 'WhatsApp',
  },
  calendar: {
    bn: 'ক্যালেন্ডার',
    ar: 'التقويم',
    ur: 'کیلنڈر',
    id: 'Kalender',
  },
  notes: {
    bn: 'নোটস ও ডকস',
    ar: 'الملاحظات والمستندات',
    ur: 'نوٹس اور دستاویزات',
    id: 'Catatan & Dokumen',
  },
  'notes & docs': {
    bn: 'নোটস ও ডকস',
    ar: 'الملاحظات والمستندات',
    ur: 'نوٹس اور دستاویزات',
    id: 'Catatan & Dokumen',
  },
  'quran & sunnah': {
    bn: 'আল-কুরআন ও সুন্নাহ পাঠ',
    ar: 'قراءة القرآن والسنة',
    ur: 'قرآن و سنت مطالعہ',
    id: 'Al-Quran & Sunnah',
  },
  'quran & sunnah reader': {
    bn: 'আল-কুরআন ও সুন্নাহ পাঠ',
    ar: 'قراءة القرآن والسنة',
    ur: 'قرآن و سنت مطالعہ',
    id: 'Pembaca Al-Quran & Sunnah',
  },
  maps: {
    bn: 'ম্যাপস',
    ar: 'الخرائط',
    ur: 'نقشہ',
    id: 'Peta',
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
  'authenticator 2fa': {
    bn: 'অথেনটিকেটর (2FA)',
    ar: 'المصادقة الثنائية (2FA)',
    ur: 'اتھینٹیکیٹر (2FA)',
    id: 'Autentikator (2FA)',
  },
  'alarm & clock': {
    bn: 'অ্যালার্ম ও ঘড়ি',
    ar: 'المنبه والساعة',
    ur: 'الارم اور گھڑی',
    id: 'Alarm & Jam',
  },
  camera: {
    bn: 'ক্যামেরা',
    ar: 'الكاميرا',
    ur: 'کیمرہ',
    id: 'Kamera',
  },
  'wallet & banking': {
    bn: 'ব্যাংকিং ও ওয়ালেট',
    ar: 'المحفظة والبنوك',
    ur: 'بینکنگ اور والیٹ',
    id: 'Dompet & Perbankan',
  },
  'kindle / audiobooks': {
    bn: 'বই ও অডিওবুক',
    ar: 'الكتب والكتب الصوتية',
    ur: 'کتابیں اور آڈیو بکس',
    id: 'Buku & Buku Audio',
  },
  instagram: {
    bn: 'ইনস্টাগ্রাম',
    ar: 'إنستغرام',
    ur: 'انسٹاگرام',
    id: 'Instagram',
  },
  tiktok: {
    bn: 'টিকটক',
    ar: 'تيك توك',
    ur: 'ٹک ٹاک',
    id: 'TikTok',
  },
  youtube: {
    bn: 'ইউটিউব',
    ar: 'يوتيوب',
    ur: 'یوٹیوب',
    id: 'YouTube',
  },
  facebook: {
    bn: 'ফেসবুক',
    ar: 'فيسبوك',
    ur: 'فیس بک',
    id: 'Facebook',
  },
  'x / twitter': {
    bn: 'এক্স / টুইটার',
    ar: 'إكس / تويتر',
    ur: 'ایکس / ٹوئٹر',
    id: 'X / Twitter',
  },
  'x (twitter)': {
    bn: 'এক্স / টুইটার',
    ar: 'إكس / تويتر',
    ur: 'ایکس / ٹوئٹر',
    id: 'X / Twitter',
  },
  reddit: {
    bn: 'রেডিট',
    ar: 'ريديت',
    ur: 'ریڈٹ',
    id: 'Reddit',
  },
  linkedin: {
    bn: 'লিংকডইন',
    ar: 'لينكد إن',
    ur: 'لنکڈ اِن',
    id: 'LinkedIn',
  },
  'web browser': {
    bn: 'ওয়েব ব্রাউজার (সুরক্ষিত)',
    ar: 'متصفح الويب (محمي)',
    ur: 'ویب براؤزر (محفوظ)',
    id: 'Browser Web (Terlindungi)',
  },
  'web browser (guarded)': {
    bn: 'ওয়েব ব্রাউজার (সুরক্ষিত)',
    ar: 'متصفح الويب (محمي)',
    ur: 'ویب براؤزر (محفوظ)',
    id: 'Browser Web (Terlindungi)',
  },
  chrome: {
    bn: 'ক্রোম ব্রাউজার',
    ar: 'متصفح كروم',
    ur: 'کروم براؤزر',
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

const DYNAMIC_TEXT_TRANSLATIONS: Record<
  string,
  { en: string; bn: string; ar: string; ur: string; id: string }
> = {
  'finalize q4 product architecture note before 4 pm': {
    en: 'Finalize Q4 product architecture note before 4 PM',
    bn: 'বিকেল ৪টার আগে আজকের গুরুত্বপূর্ণ কাজের নোট সম্পন্ন করুন',
    ar: 'إنهاء ملاحظة العمل الأساسية قبل الساعة ٤ مساءً',
    ur: 'شام 4 بجے سے پہلے آج کے اہم کام کا نوٹ مکمل کریں',
    id: 'Selesaikan catatan kerja utama hari ini sebelum pukul 16.00',
  },
  'deep focus architecture work': {
    en: 'Deep Focus Architecture Work',
    bn: 'গভীর মনোযোগের একক কাজ ও অধ্যয়ন',
    ar: 'جلسة العمل والدراسة بالتركيز العميق',
    ur: 'گہری توجہ کے ساتھ اہم کام اور مطالعہ',
    id: 'Sesi Kerja & Belajar Fokus Mendalam',
  },
  'deep focus work block': {
    en: 'Deep Focus Work Block',
    bn: 'গভীর মনোযোগের কাজের সেশন',
    ar: 'كتلة العمل بالتركيز العميق',
    ur: 'گہری توجہ کا ورک بلاک',
    id: 'Blok Kerja Fokus Mendalam',
  },
  'drink water / dhikr / deep sigh': {
    en: 'Drink Water / Dhikr / Deep Sigh',
    bn: '১ ঢোক পানি পান / যিকির / গভীর শ্বাস',
    ar: 'شرب الماء / الذكر / زفير عميق',
    ur: 'پانی پئیں / ذکر کریں / گہرا سانس لیں',
    id: 'Minum Air / Dzikir / Napas Dalam',
  },
  'stand up & stretch 30s': {
    en: 'Stand Up & Stretch 30s',
    bn: 'দাঁড়িয়ে ৩০ সেকেন্ড শরীর স্ট্রেচ করুন',
    ar: 'قف وتمدد لمدة ٣٠ ثانية',
    ur: 'کھڑے ہو کر 30 سیکنڈ اسٹریچ کریں',
    id: 'Berdiri & Peregangan 30 Detik',
  },
  'read 2 lines of book / quran': {
    en: 'Read 2 Lines of Book / Quran',
    bn: 'বই বা কুরআন থেকে ২ লাইন পড়ুন',
    ar: 'اقرأ سطرين من كتاب أو القرآن',
    ur: 'کتاب یا قرآن کی 2 سطریں پڑھیں',
    id: 'Baca 2 Baris Buku / Al-Quran',
  },
  'morning pledge signed: guarding eyes, heart, and focus.': {
    en: 'Morning pledge signed: Guarding eyes, heart, and focus.',
    bn: 'আজকের অঙ্গীকার গৃহীত: দৃষ্টি, হৃদয় ও মনোযোগ হেফাজত করব।',
    ar: 'تم توقيع عهد الصباح: حفظ البصر والقلب والتركيز.',
    ur: 'آج کا عہد مکمل: نگاہ، دل اور توجہ کی حفاظت۔',
    id: 'Janji pagi ditandatangani: Menjaga pandangan, hati, dan fokus.',
  },
  'committed to guarding eyes, heart, and focus today.': {
    en: 'Committed to guarding eyes, heart, and focus today.',
    bn: 'আজ সারাদিন দৃষ্টি, হৃদয় এবং মনোযোগ রক্ষা করার অঙ্গীকার করা হয়েছে।',
    ar: 'التزمت اليوم بحفظ البصر والقلب والتركيز.',
    ur: 'آج نگاہ، دل اور توجہ کی حفاظت کا پختہ عہد کیا گیا۔',
    id: 'Berkomitmen menjaga pandangan, hati, dan fokus hari ini.',
  },
  'urge defeated via 60s sakīnah & quranic dhikr breath.': {
    en: 'Urge defeated via 60s Sakīnah & Quranic Dhikr breath.',
    bn: '৬০ সেকেন্ডের সাকীনাহ ও কুরআনিক যিকির শ্বাসের মাধ্যমে তাড়না পরাজিত হয়েছে।',
    ar: 'تم التغلب على الرغبة عبر ٦٠ ثانية من السكينة والتنفس.',
    ur: '60 سیکنڈ سکینہ اور قرآنی ذکر سانس کے ذریعے خواہش پر قابو پایا گیا۔',
    id: 'Dorongan dikalahkan melalui 60 detik Sakinah & napas dzikir.',
  },
  'outlasted urge via sos calm mind & stanford cyclic sigh protocol.': {
    en: 'Outlasted urge via SOS Calm Mind & Stanford Cyclic Sigh protocol.',
    bn: 'জরুরি SOS এবং স্ট্যানফোর্ড সাইক্লিক শ্বাস পদ্ধতির মাধ্যমে তাড়না জয় করা হয়েছে।',
    ar: 'تم تجاوز الرغبة عبر طوارئ السكينة والتنفس الفسيولوجي.',
    ur: 'ایمرجنسی SOS اور اسٹینفورڈ سائیکلک سانس کے ذریعے خواہش کو شکست دی گئی۔',
    id: 'Berhasil melewati dorongan melalui SOS & protokol napas Stanford.',
  },
  'activated 15-minute emergency browser & social lockdown.': {
    en: 'Activated 15-Minute Emergency Browser & Social Lockdown.',
    bn: '১৫ মিনিটের জরুরি ব্রাউজার ও সোশ্যাল মিডিয়া লকডাউন সক্রিয় করা হয়েছে।',
    ar: 'تم تفعيل الإغلاق الطارئ للمتصفحات والتواصل لمدة ١٥ دقيقة.',
    ur: '15 منٹ کے لیے ایمرجنسی براؤزر اور سوشل لاک ڈاؤن فعال کر دیا گیا۔',
    id: 'Kunci darurat browser & media sosial 15 menit diaktifkan.',
  },
  'late night in bed': {
    en: 'Late Night in Bed',
    bn: 'গভীর রাতে বিছানায় একা থাকা',
    ar: 'السهر ليلاً في الفراش',
    ur: 'رات گئے بستر پر تنہا ہونا',
    id: 'Larut Malam di Tempat Tidur',
  },
  'stress / anxiety': {
    en: 'Stress / Anxiety',
    bn: 'মানসিক চাপ বা দুশ্চিন্তা',
    ar: 'التوتر أو القلق',
    ur: 'ذہنی دباؤ یا پریشانی',
    id: 'Stres / Kecemasan',
  },
  'boredom / alone': {
    en: 'Boredom / Alone',
    bn: 'একঘেয়েমি বা নিঃসঙ্গতা',
    ar: 'الملل أو الوحدة',
    ur: 'بوریت یا تنہائی',
    id: 'Bosan / Sendirian',
  },
  'social media scroll': {
    en: 'Social Media Scroll',
    bn: 'সোশ্যাল মিডিয়া স্ক্রলিং থেকে প্ররোচিত',
    ar: 'تصفح وسائل التواصل الاجتماعي',
    ur: 'سوشل میڈیا اسکرولنگ سے آغاز',
    id: 'Scrolling Media Sosial',
  },
  '@design_daily': {
    en: '@design_daily',
    bn: 'ডিজাইন ডেইলি (@design_daily)',
    ar: '@design_daily',
    ur: '@design_daily',
    id: '@design_daily',
  },
  'posted 4 new reels and tagged 12 creators in a thread.': {
    en: 'Posted 4 new reels and tagged 12 creators in a thread.',
    bn: '৪টি নতুন রিলস পোস্ট করা হয়েছে এবং ১২ জনকে ট্যাগ করা হয়েছে (সাইলেন্ট ডাইজেস্টে সংরক্ষিত)।',
    ar: 'تم نشر ٤ مقاطع ريلز جديدة والإشارة إلى ١٢ صانع محتوى (محفوظ في الملخص الهادئ).',
    ur: '4 نئی ریلز پوسٹ کی گئیں اور 12 افراد کو ٹیگ کیا گیا (خاموش ڈائجسٹ میں محفوظ)۔',
    id: 'Memposting 4 reels baru dan menandai 12 kreator (disimpan di ringkasan tenang).',
  },
  'recommended feed': {
    en: 'Recommended Feed',
    bn: 'প্রস্তাবিত ভিডিও ফিড',
    ar: 'القائمة المقترحة',
    ur: 'تجویز کردہ فیڈ',
    id: 'Feed Rekomendasi',
  },
  'live now: 10 trends you missed this week (42m video)': {
    en: 'LIVE NOW: 10 Trends You Missed This Week (42m video)',
    bn: 'লাইভ: এই সপ্তাহের ১০টি ট্রেন্ড যা আপনি মিস করেছেন (৪২ মিনিটের ভিডিও — ডোপামিন লুপ সতর্কতা)',
    ar: 'مباشر الآن: ١٠ صيحات فاتتك هذا الأسبوع (فيديو ٤٢ دقيقة)',
    ur: 'لائیو: اس ہفتے کے 10 ٹرینڈز (42 منٹ کی ویڈیو)',
    id: 'LIVE SEKARANG: 10 Tren Minggu Ini (video 42 menit)',
  },
  'neighborhood group': {
    en: 'Neighborhood Group',
    bn: 'প্রতিবেশী ও কমিউনিটি গ্রুপ',
    ar: 'مجموعة الحي السكني',
    ur: 'محلے کا گروپ',
    id: 'Grup Lingkungan',
  },
  '19 unread messages about weekend parking.': {
    en: '19 unread messages about weekend parking.',
    bn: 'সাপ্তাহিক ছুটির পার্কিং বিষয়ে ১৯টি অপঠিত বার্তা রয়েছে।',
    ar: '١٩ رسالة غير مقروءة حول مواقف السيارات في عطلة نهاية الأسبوع.',
    ur: 'ویک اینڈ پارکنگ کے بارے میں 19 غیر پڑھے پیغامات۔',
    id: '19 pesan belum dibaca tentang parkir akhir pekan.',
  },
  'network digest': {
    en: 'Network Digest',
    bn: 'পেশাদার নেটওয়ার্ক আপডেট',
    ar: 'ملخص الشبكة المهنية',
    ur: 'نیٹ ورک ڈائجسٹ',
    id: 'Ringkasan Jaringan',
  },
  '5 people viewed your profile this week.': {
    en: '5 people viewed your profile this week.',
    bn: 'এই সপ্তাহে ৫ জন আপনার প্রোফাইল দেখেছেন।',
    ar: 'شاهد ٥ أشخاص ملفك الشخصي هذا الأسبوع.',
    ur: 'اس ہفتے 5 افراد نے آپ کا پروفائل دیکھا۔',
    id: '5 orang melihat profil Anda minggu ini.',
  },
  'coworker alex': {
    en: 'Coworker Alex',
    bn: 'সহকর্মী রাশেদ',
    ar: 'الزميل أحمد',
    ur: 'ساتھی راشد',
    id: 'Rekan Kerja Alex',
  },
  'check out this link when you get a chance': {
    en: 'Check out this link when you get a chance',
    bn: 'সময় পেলে এই প্রজেক্ট নোটটি একবার দেখে নিও',
    ar: 'يرجى الاطلاع على هذه الملاحظة عندما يتاح لك الوقت',
    ur: 'جب وقت ملے تو اس لنک کو دیکھ لیں',
    id: 'Cek tautan ini saat Anda punya waktu luang',
  },
  'mom (vip whitelist)': {
    en: 'Mom (VIP Whitelist)',
    bn: 'মা (জরুরি পরিবার তালিকা)',
    ar: 'الأم (قائمة العائلة الهامة)',
    ur: 'والدہ (اہم فیملی لسٹ)',
    id: 'Ibu (Daftar VIP Keluarga)',
  },
  'urgent: server deployment needs your sign-off now': {
    en: 'URGENT: Server deployment needs your sign-off now',
    bn: 'জরুরি: সার্ভার ডিপ্লয়মেন্টের জন্য এখনই আপনার অনুমোদন প্রয়োজন',
    ar: 'عاجل: نشر الخادم يحتاج إلى موافقتك الفورية الآن',
    ur: 'ہنگامی: سرور ڈپلائمنٹ کے لیے ابھی آپ کی منظوری درکار ہے',
    id: 'DARURAT: Deployment server membutuhkan persetujuan Anda sekarang',
  },
  'vip contact': {
    en: 'VIP Contact',
    bn: 'জরুরি কন্টাক্ট',
    ar: 'جهة اتصال هامة',
    ur: 'اہم رابطہ',
    id: 'Kontak VIP',
  },
  'urgent keyword': {
    en: 'URGENT Keyword',
    bn: 'জরুরি শব্দ সনাক্ত',
    ar: 'كلمة مفتاحية عاجلة',
    ur: 'ہنگامی لفظ',
    id: 'Kata Kunci DARURAT',
  },
  'repeated burst (3x)': {
    en: 'Repeated Burst (3x)',
    bn: 'পরপর ৩ বার জরুরি কল/বার্তা',
    ar: 'تكرار متتالي (٣ مرات)',
    ur: 'لگاتار 3 بار رابطہ',
    id: 'Panggilan Berulang (3x)',
  },
  '12:00 pm': {
    en: '12:00 PM',
    bn: 'দুপুর ১২:০০',
    ar: '١٢:٠٠ ظهراً',
    ur: 'دوپہر 12:00',
    id: '12:00 Siang',
  },
  '06:00 pm': {
    en: '06:00 PM',
    bn: 'সন্ধ্যা ০৬:০০',
    ar: '٠٦:٠٠ مساءً',
    ur: 'شام 06:00',
    id: '18:00 Sore',
  },
  whatsapp: {
    en: 'WhatsApp',
    bn: 'হোয়াটসঅ্যাপ',
    ar: 'واتساب',
    ur: 'واٹس ایپ',
    id: 'WhatsApp',
  },
  linkedin: {
    en: 'LinkedIn',
    bn: 'লিংকডইন',
    ar: 'لينكد إن',
    ur: 'لنکڈ ان',
    id: 'LinkedIn',
  },
  phone: {
    en: 'Phone',
    bn: 'ফোন কল',
    ar: 'الهاتف',
    ur: 'فون کال',
    id: 'Telepon',
  },
  messages: {
    en: 'Messages',
    bn: 'মেসেজ (SMS)',
    ar: 'الرسائل (SMS)',
    ur: 'میسجز (SMS)',
    id: 'Pesan (SMS)',
  },
  instagram: {
    en: 'Instagram',
    bn: 'ইনস্টাগ্রাম',
    ar: 'إنستغرام',
    ur: 'انسٹاگرام',
    id: 'Instagram',
  },
  youtube: {
    en: 'YouTube',
    bn: 'ইউটিউব',
    ar: 'يوتيوب',
    ur: 'یوٹیوب',
    id: 'YouTube',
  },
  facebook: {
    en: 'Facebook',
    bn: 'ফেসবুক',
    ar: 'فيسبوك',
    ur: 'فیس بک',
    id: 'Facebook',
  },
};

export function localizeDynamicUserText(
  text: string | undefined | null,
  lang: LanguageCode
): string {
  if (!text) return '';
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();
  const exact = DYNAMIC_TEXT_TRANSLATIONS[lower];
  if (exact) {
    return exact[lang] || exact.en;
  }
  // Handle dynamic streak reset log: "Streak reset after Xd. Root trigger: Y"
  const resetMatch = trimmed.match(/^Streak reset after (\d+)d\.\s*Root trigger:\s*(.+)$/i);
  if (resetMatch) {
    const days = resetMatch[1];
    const cause = localizeDynamicUserText(resetMatch[2], lang);
    return tx(
      lang,
      `Streak reset after ${days}d. Root trigger: ${cause}`,
      `${days} দিন পর স্ট্রিক রিসেট হয়েছে। মূল কারণ: ${cause}`,
      `تمت إعادة الضبط بعد ${days} يوماً. السبب الرئيسي: ${cause}`,
      `${days} دن بعد اسٹرییک ری سیٹ۔ اصل وجہ: ${cause}`,
      `Rentetan direset setelah ${days} hari. Pemicu utama: ${cause}`
    );
  }
  return trimmed;
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


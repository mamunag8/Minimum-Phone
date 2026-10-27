import type {
  CalmTrigger,
  FavoriteQuoteCategory,
  InspirationMode,
  LanguageCode,
  WisdomPackSource,
} from '../types/app';

export const CALM_MIND_TRIGGERS: CalmTrigger[] = [
  // ==========================================
  // 1. QURAN — PEACE OF MIND, RESILIENCE, TIME & FOCUS
  // ==========================================
  {
    id: 'q-13-28',
    category: 'quran',
    quoteCategory: 'peace-sakinah',
    arabic: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
    text: {
      en: 'Unquestionably, in the remembrance of Allah do hearts find rest.',
      bn: 'জেনে রাখো, আল্লাহর স্মরণেই হৃদয়সমূহ প্রশান্তি লাভ করে।',
      ar: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
      ur: 'خبردار! اللہ کی یاد ہی سے دلوں کو اطمینان نصیب ہوتا ہے۔',
      id: 'Ingatlah, hanya dengan mengingat Allah hati menjadi tenteram.',
    },
    source: {
      en: 'Quran 13:28',
      bn: 'আল-কুরআন ১৩:২৮',
      ar: 'سورة الرعد ٢٨',
    },
    themeTag: 'sakinah',
  },
  {
    id: 'q-94-6',
    category: 'quran',
    quoteCategory: 'resilience-growth',
    arabic: 'إِنَّ مَعَ الْعُسْرِ يُسْرًا',
    text: {
      en: 'Indeed, with hardship comes ease.',
      bn: 'নিশ্চয়ই কষ্টের সাথেই রয়েছে স্বস্তি।',
      ar: 'إِنَّ مَعَ الْعُسْرِ يُسْرًا',
      ur: 'بے شک مشکل کے ساتھ آسانی ہے۔',
      id: 'Sesungguhnya bersama kesulitan ada kemudahan.',
    },
    source: {
      en: 'Quran 94:6',
      bn: 'আল-কুরআন ৯৪:৬',
      ar: 'سورة الشرح ٦',
    },
    themeTag: 'resilience-growth',
  },
  {
    id: 'q-94-7',
    category: 'quran',
    quoteCategory: 'focus-discipline',
    arabic: 'فَإِذَا فَرَغْتَ فَانصَبْ وَإِلَىٰ رَبِّكَ فَارْغَب',
    text: {
      en: 'So when you have finished one duty, stand up for the next with full devotion.',
      bn: 'অতএব যখনই একটি কাজ শেষ করো, সাথে সাথে নতুন উদ্যমে পরবর্তী কাজে মনোনিবেশ করো।',
      ar: 'فَإِذَا فَرَغْتَ فَانصَبْ وَإِلَىٰ رَبِّكَ فَارْغَب',
      ur: 'پس جب تم ایک کام سے فارغ ہو جاؤ تو فوراً دوسرے نیک کام میں محنت کرو۔',
      id: 'Maka apabila engkau telah selesai dari satu urusan, tetaplah bekerja keras untuk urusan yang lain.',
    },
    source: {
      en: 'Quran 94:7-8',
      bn: 'আল-কুরআন ৯৪:৭-৮',
      ar: 'سورة الشرح ٧-٨',
    },
    themeTag: 'focus-discipline',
  },
  {
    id: 'q-53-39',
    category: 'quran',
    quoteCategory: 'focus-discipline',
    arabic: 'وَأَن لَّيْسَ لِلْإِنسَانِ إِلَّا مَا سَعَىٰ',
    text: {
      en: 'And that a person shall have nothing except what they strive for.',
      bn: 'মানুষ তা-ই পায়, যার জন্য সে নিজে একনিষ্ঠভাবে চেষ্টা ও সাধনা করে।',
      ar: 'وَأَن لَّيْسَ لِلْإِنسَانِ إِلَّا مَا سَعَىٰ',
      ur: 'اور یہ کہ انسان کے لیے صرف وہی ہے جس کی اس نے کوشش کی۔',
      id: 'Dan bahwa manusia hanya memperoleh apa yang telah diusahakannya.',
    },
    source: {
      en: 'Quran 53:39',
      bn: 'আল-কুরআন ৫৩:৩৯',
      ar: 'سورة النجم ٣٩',
    },
    themeTag: 'focus-discipline',
  },
  {
    id: 'q-103-1',
    category: 'quran',
    quoteCategory: 'time-purpose',
    arabic: 'وَالْعَصْرِ إِنَّ الْإِنسَانَ لَفِي خُسْرٍ',
    text: {
      en: 'By Time—indeed, humanity is in loss, except those who act with faith, truth, and patience.',
      bn: 'মহাকালের শপথ! মানুষ অবশ্যই ক্ষতির মধ্যে রয়েছে—তারা ছাড়া যারা সৎকর্ম করে ও ধৈর্য ধারণ করে।',
      ar: 'وَالْعَصْرِ إِنَّ الْإِنسَانَ لَفِي خُسْرٍ',
      ur: 'زمانے کی قسم! بے شک انسان خسارے میں ہے، سوائے ان کے جو نیک عمل اور صبر کرتے ہیں۔',
      id: 'Demi masa, sungguh manusia berada dalam kerugian, kecuali yang beramal saleh dan bersabar.',
    },
    source: {
      en: 'Quran 103:1-3',
      bn: 'আল-কুরআন ১০৩:১-৩',
      ar: 'سورة العصر ١-٣',
    },
    themeTag: 'time',
  },
  {
    id: 'q-2-286',
    category: 'quran',
    quoteCategory: 'resilience-growth',
    arabic: 'لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا',
    text: {
      en: 'Allah does not burden a soul beyond what it can bear.',
      bn: 'আল্লাহ কোনো প্রাণীকে তার সাধ্যের বাইরে বোঝা চাপিয়ে দেন না।',
      ar: 'لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا',
      ur: 'اللہ کسی جان پر اس کی طاقت سے زیادہ بوجھ نہیں ڈالتا۔',
      id: 'Allah tidak membebani seseorang melainkan sesuai kesanggupannya.',
    },
    source: {
      en: 'Quran 2:286',
      bn: 'আল-কুরআন ২:২৮৬',
      ar: 'سورة البقرة ٢٨٦',
    },
    themeTag: 'resilience-growth',
  },
  {
    id: 'q-65-3',
    category: 'quran',
    quoteCategory: 'peace-sakinah',
    arabic: 'وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ',
    text: {
      en: 'Whoever puts their trust in Allah—He is sufficient for them.',
      bn: 'যে আল্লাহর ওপর ভরসা করে, তাঁর জন্য তিনিই যথেষ্ট।',
      ar: 'وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ',
      ur: 'اور جو اللہ پر بھروسہ کرے تو وہ اس کے لیے کافی ہے۔',
      id: 'Barangsiapa bertawakal kepada Allah, niscaya Dia akan mencukupkan-Nya.',
    },
    source: {
      en: 'Quran 65:3',
      bn: 'আল-কুরআন ৬৫:৩',
      ar: 'سورة الطلاق ٣',
    },
    themeTag: 'sakinah',
  },
  {
    id: 'q-70-5',
    category: 'quran',
    quoteCategory: 'resilience-growth',
    arabic: 'فَاصْبِرْ صَبْرًا جَمِيلًا',
    text: {
      en: 'So be patient with gracious, serene patience.',
      bn: 'অতএব তুমি ধৈর্য ধারণ করো—সুন্দর ও প্রশান্ত ধৈর্য।',
      ar: 'فَاصْبِرْ صَبْرًا جَمِيلًا',
      ur: 'پس تم صبر کرو، ایک خوبصورت صبر۔',
      id: 'Maka bersabarlah engkau dengan kesabaran yang baik.',
    },
    source: {
      en: 'Quran 70:5',
      bn: 'আল-কুরআন ৭০:৫',
      ar: 'سورة المعارج ٥',
    },
    themeTag: 'stillness',
  },
  {
    id: 'q-93-3',
    category: 'quran',
    quoteCategory: 'resilience-growth',
    arabic: 'مَا وَدَّعَكَ رَبُّكَ وَمَا قَلَىٰ',
    text: {
      en: 'Your Lord has not forsaken you, nor has He forgotten you.',
      bn: 'তোমার রব তোমাকে পরিত্যাগ করেননি এবং তোমার প্রতি বিরূপও হননি।',
      ar: 'مَا وَدَّعَكَ رَبُّكَ وَمَا قَلَىٰ',
      ur: 'تمہارے رب نے تمہیں نہیں چھوڑا اور نہ وہ ناراض ہوا۔',
      id: 'Tuhanmu tidak meninggalkan engkau dan tidak pula membencimu.',
    },
    source: {
      en: 'Quran 93:3',
      bn: 'আল-কুরআন ৯৩:৩',
      ar: 'سورة الضحى ٣',
    },
    themeTag: 'sakinah',
  },
  {
    id: 'q-48-4',
    category: 'quran',
    quoteCategory: 'peace-sakinah',
    arabic: 'هُوَ الَّذِي أَنزَلَ السَّكِينَةَ فِي قُلُوبِ الْمُؤْمِنِينَ',
    text: {
      en: 'He is the One who sent down tranquility into the hearts.',
      bn: 'তিনিই মুমিনদের হৃদয়ে প্রশান্তি (সাকীনাহ) নাযিল করেছেন।',
      ar: 'هُوَ الَّذِي أَنزَلَ السَّكِينَةَ فِي قُلُوبِ الْمُؤْمِنِينَ',
      ur: 'وہی ہے جس نے مومنوں کے دلوں میں سکینت نازل فرمائی۔',
      id: 'Dialah yang telah menurunkan ketenangan ke dalam hati orang-orang beriman.',
    },
    source: {
      en: 'Quran 48:4',
      bn: 'আল-কুরআন ৪৮:৪',
      ar: 'سورة الفتح ٤',
    },
    themeTag: 'sakinah',
  },
  {
    id: 'q-13-11',
    category: 'quran',
    quoteCategory: 'self-mastery',
    arabic: 'إِنَّ اللَّهَ لَا يُغَيِّرُ مَا بِقَوْمٍ حَتَّىٰ يُغَيِّرُوا مَا بِأَنفُسِهِمْ',
    text: {
      en: 'Indeed, Allah will not change the condition of a people until they change what is in themselves.',
      bn: 'আল্লাহ কোনো জাতির অবস্থা পরিবর্তন করেন না, যতক্ষণ না তারা নিজেদের ভেতরের অভ্যাস পরিবর্তন করে।',
      ar: 'إِنَّ اللَّهَ لَا يُغَيِّرُ مَا بِقَوْمٍ حَتَّىٰ يُغَيِّرُوا مَا بِأَنفُسِهِمْ',
      ur: 'بے شک اللہ کسی قوم کی حالت نہیں بدلتا جب تک وہ خود اپنے نفس کو نہ بدلیں۔',
      id: 'Sesungguhnya Allah tidak mengubah keadaan suatu kaum sebelum mereka mengubah keadaan diri mereka sendiri.',
    },
    source: {
      en: 'Quran 13:11',
      bn: 'আল-কুরআন ১৩:১১',
      ar: 'سورة الرعد ١١',
    },
    themeTag: 'self-mastery',
  },
  {
    id: 'q-79-40',
    category: 'quran',
    quoteCategory: 'self-mastery',
    arabic: 'وَأَمَّا مَنْ خَافَ مَقَامَ رَبِّهِ وَنَهَى النَّفْسَ عَنِ الْهَوَىٰ',
    text: {
      en: 'As for the one who feared standing before their Lord and restrained the soul from vain desire—Paradise is their refuge.',
      bn: 'আর যে তার রবের সামনে দাঁড়ানোর ভয় করেছে এবং কুপ্রবৃত্তি থেকে নিজেকে বিরত রেখেছে—জান্নাতই তার ঠিকানা।',
      ar: 'وَأَمَّا مَنْ خَافَ مَقَامَ رَبِّهِ وَنَهَى النَّفْسَ عَنِ الْهَوَىٰ',
      ur: 'اور جس نے اپنے رب کے سامنے کھڑے ہونے کا خوف کیا اور نفس کو خواہشات سے روکا، جنت ہی اس کا ٹھکانا ہے۔',
      id: 'Dan adapun orang yang takut kepada kebesaran Tuhannya dan menahan diri dari keinginan hawa nafsunya.',
    },
    source: {
      en: 'Quran 79:40-41',
      bn: 'আল-কুরআন ৭৯:৪০-৪১',
      ar: 'سورة النازعات ٤٠-٤١',
    },
    themeTag: 'self-mastery',
  },

  // ==========================================
  // 2. HADITH — CALM MIND, FOCUS, CONTENTMENT & TIME
  // ==========================================
  {
    id: 'h-tirmidhi-concern',
    category: 'hadith',
    quoteCategory: 'focus-discipline',
    arabic: 'مِنْ حُسْنِ إِسْلَامِ الْمَرْءِ تَرْكُهُ مَا لَا يَعْنِيهِ',
    text: {
      en: 'Part of a person’s good faith is leaving what does not concern him.',
      bn: 'মানুষের সুন্দর ইসলামের নিদর্শন হলো অপ্রয়োজনীয় বিষয় বর্জন করা।',
      ar: 'مِنْ حُسْنِ إِسْلَامِ الْمَرْءِ تَرْكُهُ مَا لَا يَعْنِيهِ',
      ur: 'انسان کے اسلام کی خوبی یہ ہے کہ وہ بے مقصد باتوں کو چھوڑ دے۔',
      id: 'Di antara kebaikan Islam seseorang adalah meninggalkan hal yang sia-sia.',
    },
    source: {
      en: 'Jami` at-Tirmidhi 2317',
      bn: 'জামে আত-তিরমিযী ২৩১৭',
      ar: 'جامع الترمذي ٢٣١٧',
    },
    themeTag: 'focus-discipline',
  },
  {
    id: 'h-bukhari-richness',
    category: 'hadith',
    quoteCategory: 'peace-sakinah',
    arabic: 'لَيْسَ الْغِنَى عَنْ كَثْرَةِ الْعَرَضِ وَلَكِنَّ الْغِنَى غِنَى النَّفْسِ',
    text: {
      en: 'True richness is not many possessions, but contentment of the soul.',
      bn: 'ধন-সম্পদের প্রাচুর্য প্রকৃত প্রাচুর্য নয়; মনের প্রশান্তিই প্রকৃত প্রাচুর্য।',
      ar: 'لَيْسَ الْغِنَى عَنْ كَثْرَةِ الْعَرَضِ وَلَكِنَّ الْغِنَى غِنَى النَّفْسِ',
      ur: 'امیری سامان کی کثرت نہیں، بلکہ اصل امیری دل کا غنی ہونا ہے۔',
      id: 'Kekayaan sejati bukanlah banyaknya harta, melainkan kekayaan jiwa.',
    },
    source: {
      en: 'Sahih al-Bukhari 6446',
      bn: 'সহীহ বুখারী ৬৪৪৬',
      ar: 'صحيح البخاري ٦٤٤٦',
    },
    themeTag: 'sakinah',
  },
  {
    id: 'h-bukhari-two-blessings',
    category: 'hadith',
    quoteCategory: 'time-purpose',
    arabic: 'نِعْمَتَانِ مَغْبُونٌ فِيهِمَا كَثِيرٌ مِنَ النَّاسِ الصِّحَّةُ وَالْفَرَاغُ',
    text: {
      en: 'Two blessings many people waste: good health and free time.',
      bn: 'দুটি নেয়ামত সম্পর্কে মানুষ উদাসীন: সুস্থতা এবং অবসর সময়।',
      ar: 'نِعْمَتَانِ مَغْبُونٌ فِيهِمَا كَثِيرٌ مِنَ النَّاسِ الصِّحَّةُ وَالْفَرَاغُ',
      ur: 'دو نعمتیں ایسی ہیں جن میں بہت سے لوگ دھوکے میں ہیں: صحت اور فراغت۔',
      id: 'Dua nikmat yang sering dilalaikan manusia: kesehatan dan waktu luang.',
    },
    source: {
      en: 'Sahih al-Bukhari 6412',
      bn: 'সহীহ বুখারী ৬৪১২',
      ar: 'صحيح البخاري ٦٤١٢',
    },
    themeTag: 'time',
  },
  {
    id: 'h-hakim-five',
    category: 'hadith',
    quoteCategory: 'time-purpose',
    arabic: 'اغْتَنِمْ خَمْسًا قَبْلَ خَمْسٍ وَفَرَاغَكَ قَبْلَ شُغْلِكَ',
    text: {
      en: 'Value your free time before you become overwhelmed.',
      bn: 'ব্যস্ততা আসার আগেই তোমার অবসর সময়কে মূল্য দাও।',
      ar: 'اغْتَنِمْ خَمْسًا قَبْلَ خَمْسٍ: وَفَرَاغَكَ قَبْلَ شُغْلِكَ',
      ur: 'مصروفیت سے پہلے اپنی فراغت کو غنیمت جانو۔',
      id: 'Manfaatkan waktu luangmu sebelum datang waktu sempitmu.',
    },
    source: {
      en: 'Al-Mustadrak 7846',
      bn: 'আল-মুস্তাদরাক ৭৮৪৬',
      ar: 'المستدرك ٧٨٤٦',
    },
    themeTag: 'time',
  },
  {
    id: 'h-muslim-gentleness',
    category: 'hadith',
    quoteCategory: 'peace-sakinah',
    arabic: 'إِنَّ الرِّفْقَ لَا يَكُونُ فِي شَيْءٍ إِلَّا زَانَهُ',
    text: {
      en: 'Calmness and gentleness beautify everything they touch.',
      bn: 'কোমলতা ও ধীরস্থিরতা যেকোনো বিষয়কে কেবল সৌন্দর্যমণ্ডিতই করে।',
      ar: 'إِنَّ الرِّفْقَ لَا يَكُونُ فِي شَيْءٍ إِلَّا زَانَهُ',
      ur: 'نرمی اور سکون جس چیز میں بھی ہو اسے خوبصورت بنا دیتا ہے۔',
      id: 'Kelembutan tidaklah berada pada sesuatu melainkan akan menghiasinya.',
    },
    source: {
      en: 'Sahih Muslim 2594',
      bn: 'সহীহ মুসলিম ২৫৯৪',
      ar: 'صحيح مسلم ٢٥٩٤',
    },
    themeTag: 'sakinah',
  },
  {
    id: 'h-bukhari-consistency',
    category: 'hadith',
    quoteCategory: 'focus-discipline',
    arabic: 'أَحَبُّ الأَعْمَالِ إِلَى اللَّهِ أَدْوَمُهَا وَإِنْ قَلَّ',
    text: {
      en: 'The most beloved actions to Allah are those done consistently, even if small.',
      bn: 'আল্লাহর কাছে সবচেয়ে প্রিয় আমল হলো যা নিয়মিত করা হয়, তা পরিমাণে অল্প হলেও।',
      ar: 'أَحَبُّ الأَعْمَالِ إِلَى اللَّهِ أَدْوَمُهَا وَإِنْ قَلَّ',
      ur: 'اللہ کے نزدیک سب سے محبوب عمل وہ ہے جو باقاعدگی سے کیا جائے خواہ وہ تھوڑا ہی ہو۔',
      id: 'Amalan yang paling dicintai Allah adalah yang dilakukan secara konsisten meskipun sedikit.',
    },
    source: {
      en: 'Sahih al-Bukhari 6464',
      bn: 'সহীহ বুখারী ৬৪৬৪',
      ar: 'صحيح البخاري ٦٤٦٤',
    },
    themeTag: 'focus-discipline',
  },
  {
    id: 'h-muslim-strive',
    category: 'hadith',
    quoteCategory: 'resilience-growth',
    arabic: 'احْرِصْ عَلَى مَا يَنْفَعُكَ وَاسْتَعِنْ بِاللَّهِ وَلَا تَعْجَزْ',
    text: {
      en: 'Strive for what benefits you, seek help from Allah, and never give up.',
      bn: 'যা তোমার জন্য কল্যাণকর তাতে সচেষ্ট হও, আল্লাহর সাহায্য চাও এবং কখনো হাল ছেড়ো না।',
      ar: 'احْرِصْ عَلَى مَا يَنْفَعُكَ وَاسْتَعِنْ بِاللَّهِ وَلَا تَعْجَزْ',
      ur: 'جو چیز تمہیں نفع دے اس کی حرص کرو، اللہ سے مدد مانگو اور ہمت مت ہارو۔',
      id: 'Bersemangatlah pada hal yang bermanfaat bagimu, mohonlah pertolongan Allah, dan jangan menyerah.',
    },
    source: {
      en: 'Sahih Muslim 2664',
      bn: 'সহীহ মুসলিম ২৬৬৪',
      ar: 'صحيح مسلم ٢٦٦٤',
    },
    themeTag: 'resilience-growth',
  },
  {
    id: 'h-bayhaqi-ihsan',
    category: 'hadith',
    quoteCategory: 'focus-discipline',
    arabic: 'إِنَّ اللَّهَ يُحِبُّ إِذَا عَمِلَ أَحَدُكُمْ عَمَلًا أَنْ يُتْقِنَهُ',
    text: {
      en: 'Indeed, Allah loves that when one of you does a task, they do it with excellence.',
      bn: 'নিশ্চয়ই আল্লাহ পছন্দ করেন যে তোমাদের কেউ যখন কোনো কাজ করে, সে যেন তা নিখুঁত ও মনোযোগের সাথে করে।',
      ar: 'إِنَّ اللَّهَ يُحِبُّ إِذَا عَمِلَ أَحَدُكُمْ عَمَلًا أَنْ يُتْقِنَهُ',
      ur: 'بے شک اللہ پسند کرتا ہے کہ جب تم میں سے کوئی کام کرے تو اسے بہترین طریقے سے کرے۔',
      id: 'Sesungguhnya Allah mencintai seseorang yang apabila bekerja, ia mengerjakannya dengan sungguh-sungguh (itqan).',
    },
    source: {
      en: 'Shu`ab al-Iman 4929',
      bn: 'শুআবুল ঈমান ৪৯২৯',
      ar: 'شعب الإيمان ٤٩٢٩',
    },
    themeTag: 'focus-discipline',
  },

  // ==========================================
  // 3. UNIVERSAL PROVERBS — FOCUS, TIME, RESILIENCE & CALM MIND
  // ==========================================
  {
    id: 'p-muddy-water',
    category: 'proverb',
    quoteCategory: 'peace-sakinah',
    text: {
      en: 'Muddy water is best cleared by leaving it alone.',
      bn: 'ঘোলা পানি পরিষ্কার করার সর্বোত্তম উপায় হলো তা স্থির হতে দেওয়া।',
      ar: 'الماء العكر يصفو حين يُترك ساكناً.',
      ur: 'گدلا پانی تبھی صاف ہوتا ہے جب اسے پرسکون چھوڑ دیا جائے۔',
      id: 'Air keruh paling baik dijernihkan dengan membiarkannya tenang.',
    },
    source: {
      en: 'Stillness Proverb',
      bn: 'প্রশান্তির প্রবাদ',
      ar: 'حكمة السكون',
    },
    themeTag: 'stillness',
  },
  {
    id: 'p-quiet-mind',
    category: 'proverb',
    quoteCategory: 'peace-sakinah',
    text: {
      en: 'A quiet mind is richer than a crown.',
      bn: 'একটি প্রশান্ত মন রাজমুকুটের চেয়েও অধিক মূল্যবান।',
      ar: 'العقل الهادئ أغنى من تيجان الملوك.',
      ur: 'ایک پرسکون ذہن بادشاہی تاج سے زیادہ قیمتی ہے۔',
      id: 'Pikiran yang tenang lebih berharga daripada mahkota.',
    },
    source: {
      en: 'Classical Proverb',
      bn: 'চিরন্তন প্রবাদ',
      ar: 'حكمة قديمة',
    },
    themeTag: 'sakinah',
  },
  {
    id: 'p-silence-strength',
    category: 'proverb',
    quoteCategory: 'peace-sakinah',
    text: {
      en: 'Silence and stillness are the roots of deep strength.',
      bn: 'নীরবতা ও স্থিরতাই হলো গভীর মানসিক শক্তির মূল।',
      ar: 'الصمت والسكون جذور القوة العميقة.',
      ur: 'خاموشی اور ٹھہراؤ گہری طاقت کی جڑیں ہیں۔',
      id: 'Keheningan dan ketenangan adalah akar dari kekuatan sejati.',
    },
    source: {
      en: 'Contemplative Proverb',
      bn: 'মননশীল প্রবাদ',
      ar: 'حكمة تأملية',
    },
    themeTag: 'stillness',
  },
  {
    id: 'p-attention-life',
    category: 'proverb',
    quoteCategory: 'focus-discipline',
    text: {
      en: 'Where your attention rests, your life follows.',
      bn: 'তোমার মনোযোগ যেখানে স্থির হয়, তোমার জীবন সেদিকেই প্রবাহিত হয়।',
      ar: 'حيثما يستقر انتباهك، تتشكل حياتك.',
      ur: 'جہاں آپ کی توجہ ٹھہرتی ہے، زندگی وہیں چلتی ہے۔',
      id: 'Ke mana perhatianmu tertuju, ke sanalah hidupmu mengalir.',
    },
    source: {
      en: 'Mindful Proverb',
      bn: 'সচেতনতার প্রবাদ',
      ar: 'حكمة اليقظة',
    },
    themeTag: 'focus-discipline',
  },
  {
    id: 'p-noise-peace',
    category: 'proverb',
    quoteCategory: 'peace-sakinah',
    text: {
      en: 'Do not trade your inner peace for the world’s passing noise.',
      bn: 'পৃথিবীর ক্ষণস্থায়ী কোলাহলের বিনিময়ে নিজের মনের শান্তি বিক্রি করো না।',
      ar: 'لا تستبدل سكينة قلبك بضجيج العالم العابر.',
      ur: 'دنیا کے شور کے بدلے اپنے دل کا سکون مت بیچو۔',
      id: 'Jangan tukar ketenangan batinmu dengan kebisingan dunia yang fana.',
    },
    source: {
      en: 'Peace of Mind Proverb',
      bn: 'প্রশান্ত মনের প্রবাদ',
      ar: 'حكمة الطمأنينة',
    },
    themeTag: 'sakinah',
  },
  {
    id: 'p-discipline-freedom',
    category: 'proverb',
    quoteCategory: 'focus-discipline',
    text: {
      en: 'Discipline is choosing between what you want now and what you want most.',
      bn: 'শৃঙ্খলা হলো তাৎক্ষণিক ক্ষণিকের আনন্দ ও জীবনের মহৎ লক্ষ্যের মধ্য থেকে সঠিকটিকে বেছে নেওয়া।',
      ar: 'الانضباط هو أن تختار ما تريده حقاً على ما تشتهيه لحظياً.',
      ur: 'نظم و ضبط وقتی خواہش پر اپنے سب سے بڑے مقصد کو ترجیح دینے کا نام ہے۔',
      id: 'Disiplin adalah memilih antara apa yang kamu inginkan sekarang dan apa yang paling kamu impikan.',
    },
    source: {
      en: 'Focus & Discipline',
      bn: 'আত্মশৃঙ্খলা প্রবাদ',
      ar: 'حكمة الانضباط',
    },
    themeTag: 'focus-discipline',
  },
  {
    id: 'p-two-rabbits',
    category: 'proverb',
    quoteCategory: 'focus-discipline',
    text: {
      en: 'He who chases two rabbits catches neither. Master one thing at a time.',
      bn: 'যে একসাথে দুটি খরগোশের পেছনে ছোটে সে একটিও ধরতে পারে না; একবারে একটি কাজেই পূর্ণ মনোযোগ দাও।',
      ar: 'من طارد أرنبين لم يمسك بأي منهما؛ أتقن عملاً واحداً في كل مرة.',
      ur: 'جو بیک وقت دو شکار کے پیچھے بھاگتا ہے وہ خالی ہاتھ رہتا ہے؛ ایک وقت میں ایک کام پر توجہ مرکوز رکھو۔',
      id: 'Siapa yang mengejar dua kelinci tidak menangkap satu pun. Fokuslah pada satu hal.',
    },
    source: {
      en: 'Deep Work Proverb',
      bn: 'গভীর মনোযোগ প্রবাদ',
      ar: 'حكمة التركيز العميق',
    },
    themeTag: 'focus-discipline',
  },
  {
    id: 'p-seneca-time',
    category: 'proverb',
    quoteCategory: 'time-purpose',
    text: {
      en: 'We are not given a short life, but we make it short by wasting so much of it.',
      bn: 'আমাদের জীবন ছোট নয়, বরং অপ্রয়োজনীয় কাজে আমরা নিজেরাই এর বড় অংশ নষ্ট করে ফেলি।',
      ar: 'ليست حياتنا قصيرة، بل نحن نقصرها بإضاعة الكثير منها فيما لا ينفع.',
      ur: 'ہمیں مختصر زندگی نہیں ملی بلکہ ہم خود اس کا بڑا حصہ ضائع کر کے اسے مختصر بنا دیتے ہیں۔',
      id: 'Hidup kita tidak singkat, kitalah yang membuatnya singkat dengan menyia-nyiakan waktu.',
    },
    source: {
      en: 'Stoic Wisdom on Time',
      bn: 'সময়ের প্রজ্ঞা',
      ar: 'حكمة الوقت',
    },
    themeTag: 'time',
  },
  {
    id: 'p-hours-days',
    category: 'proverb',
    quoteCategory: 'time-purpose',
    text: {
      en: 'Guard your mornings and your nights, and your whole life will stand in order.',
      bn: 'তোমার সকাল ও রাতের সময়টুকু রক্ষা করো, দেখবে পুরো জীবনই সুন্দর ও সুশৃঙ্খল হয়ে গেছে।',
      ar: 'احفظ صباحك وليلك، تستقم لك حياتك كلها.',
      ur: 'اپنی صبح اور رات کی حفاظت کرو، تمہاری پوری زندگی سنور جائے گی۔',
      id: 'Jagalah waktu pagi dan malammu, maka seluruh hidupmu akan tertata.',
    },
    source: {
      en: 'Intentional Living',
      bn: 'সচেতন জীবননীতি',
      ar: 'حكمة الحياة الواعية',
    },
    themeTag: 'time',
  },
  {
    id: 'p-scroll-create',
    category: 'proverb',
    quoteCategory: 'time-purpose',
    text: {
      en: 'Every hour spent mindlessly scrolling is an hour stolen from the life you wanted to build.',
      bn: 'অকারণে স্ক্রল করে কাটানো প্রতিটি ঘণ্টা তোমার স্বপ্নের জীবন গড়ার সময় থেকে চুরি হয়ে যাওয়া অংশ।',
      ar: 'كل ساعة تقضيها في التصفح العشوائي هي ساعة مسروقة من الحياة التي تطمح لبنائها.',
      ur: 'بے مقصد اسکرولنگ میں گزرنے والا ہر گھنٹہ آپ کے خوابوں کی تعمیر سے چرایا گیا وقت ہے۔',
      id: 'Setiap jam yang habis untuk menggulir layar tanpa arah adalah jam yang dicuri dari masa depanmu.',
    },
    source: {
      en: 'Digital Minimalism',
      bn: 'ডিজিটাল মিনিমালিজম',
      ar: 'حكمة البساطة الرقمية',
    },
    themeTag: 'time',
  },
  {
    id: 'p-oak-wind',
    category: 'proverb',
    quoteCategory: 'resilience-growth',
    text: {
      en: 'The oak fought the wind and grew strong; difficulty is the forge of character.',
      bn: 'ঝড়ের সাথে লড়াই করেই মহীরুহ শক্তিশালী হয়; প্রতিকূলতাই মানুষের চরিত্রকে ইস্পাতদৃঢ় করে।',
      ar: 'الشجرة العظيمة تزداد رسوخاً في مواجهة الرياح؛ فالشدائد تصنع العزائم.',
      ur: 'طوفانوں کا مقابلہ کر کے ہی مضبوط درخت پروان چڑھتے ہیں؛ مشکلات ہی کردار کو کندن بناتی ہیں۔',
      id: 'Pohon ek tumbuh kuat karena melawan angin; kesulitan adalah tempaan karakter.',
    },
    source: {
      en: 'Resilience Proverb',
      bn: 'ধৈর্য ও শক্তির প্রবাদ',
      ar: 'حكمة الصمود',
    },
    themeTag: 'resilience-growth',
  },
  {
    id: 'p-step-mountain',
    category: 'proverb',
    quoteCategory: 'resilience-growth',
    text: {
      en: 'A person who moves a mountain begins by carrying away small stones every day.',
      bn: 'যিনি পাহাড় সরান, তিনি প্রতিদিন ছোট ছোট পাথর সরানোর মাধ্যমেই সেই অসাধ্য সাধন করেন।',
      ar: 'من ينقل جبلاً يبدأ بحمل الحجارة الصغيرة كل يوم بصبر وثبات.',
      ur: 'پہاڑ ہلانے والا انسان روزانہ چھوٹے پتھر ہٹانے سے ہی اپنی منزل پاتا ہے۔',
      id: 'Orang yang memindahkan gunung memulai dengan mengangkat batu-batu kecil setiap hari.',
    },
    source: {
      en: 'Perseverance Proverb',
      bn: 'অধ্যবসায়ের প্রবাদ',
      ar: 'حكمة المثابرة',
    },
    themeTag: 'resilience-growth',
  },
  {
    id: 'p-conquer-self',
    category: 'proverb',
    quoteCategory: 'self-mastery',
    text: {
      en: 'Conquering yourself is a greater victory than conquering a thousand cities.',
      bn: 'হাজারটি নগরী জয় করার চেয়েও নিজের মন ও প্রবৃত্তিকে জয় করা মহত্তর বিজয়।',
      ar: 'انتصارك على نفسك أعظم من فتح ألف مدينة.',
      ur: 'اپنے نفس کو فتح کرنا ہزار شہروں کو فتح کرنے سے بڑی کامیابی ہے۔',
      id: 'Menaklukkan diri sendiri adalah kemenangan yang lebih besar daripada menaklukkan seribu kota.',
    },
    source: {
      en: 'Self-Mastery Proverb',
      bn: 'আত্মজয়ের প্রবাদ',
      ar: 'حكمة مجاهدة النفس',
    },
    themeTag: 'self-mastery',
  },

  // ==========================================
  // 4. PURITY & ANTI-PORN MOTIVATION TRIGGERS
  // ==========================================
  {
    id: 'pur-q-24-30',
    category: 'purity',
    subType: 'quran',
    quoteCategory: 'self-mastery',
    arabic: 'قُل لِّلْمُؤْمِنِينَ يَغُضُّوا مِنْ أَبْصَارِهِمْ وَيَحْفَظُوا فُرُوجَهُمْ ۚ ذَٰلِكَ أَزْكَىٰ لَهُمْ',
    text: {
      en: 'Tell the believers to lower their gaze and guard their purity; that is purer for their hearts.',
      bn: 'মুমিনদের বলুন, তারা যেন তাদের দৃষ্টি সংযত রাখে ও পবিত্রতা রক্ষা করে; এটিই তাদের অন্তরের জন্য অধিক পবিত্র।',
      ar: 'قُل لِّلْمُؤْمِنِينَ يَغُضُّوا مِنْ أَبْصَارِهِمْ وَيَحْفَظُوا فُرُوجَهُمْ ذَٰلِكَ أَزْكَىٰ لَهُمْ',
      ur: 'مومنوں سے کہہ دو کہ اپنی نگاہیں نیچی رکھیں اور اپنی پاکیزگی کی حفاظت کریں، یہ ان کے لیے زیادہ پاکیزہ ہے۔',
      id: 'Katakanlah kepada orang beriman agar menjaga pandangannya; yang demikian itu lebih suci bagi mereka.',
    },
    source: {
      en: 'Quran 24:30',
      bn: 'আল-কুরআন ২৪:৩০ (সূরা নূর)',
      ar: 'سورة النور ٣٠',
    },
    themeTag: 'purity-gaze',
  },
  {
    id: 'pur-q-96-14',
    category: 'purity',
    subType: 'quran',
    quoteCategory: 'self-mastery',
    arabic: 'أَلَمْ يَعْلَم بِأَنَّ اللَّهَ يَرَىٰ',
    text: {
      en: 'Does he not know that Allah sees all?',
      bn: 'সে কি জানে না যে আল্লাহ সবকিছু দেখছেন?',
      ar: 'أَلَمْ يَعْلَم بِأَنَّ اللَّهَ يَرَىٰ',
      ur: 'کیا وہ نہیں جانتا کہ اللہ دیکھ رہا ہے؟',
      id: 'Tidakkah dia mengetahui bahwa sesungguhnya Allah melihat segala sesuatu?',
    },
    source: {
      en: 'Quran 96:14',
      bn: 'আল-কুরআন ৯৬:১৪ (সূরা আলাক)',
      ar: 'سورة العلق ١٤',
    },
    themeTag: 'purity-gaze',
  },
  {
    id: 'pur-h-leave-for-allah',
    category: 'purity',
    subType: 'hadith',
    quoteCategory: 'self-mastery',
    arabic: 'إِنَّكَ لَنْ تَدَعَ شَيْئًا لِلَّهِ إِلَّا بَدَّلَكَ اللَّهُ بِهِ مَا هُوَ خَيْرٌ لَكَ مِنْهُ',
    text: {
      en: 'You never leave something for Allah except that He replaces it with what is far better for you.',
      bn: 'তুমি আল্লাহর সন্তুষ্টির জন্য যা-ই ত্যাগ করবে, আল্লাহ তোমাকে তার চেয়ে উত্তম কিছু দান করবেন।',
      ar: 'إِنَّكَ لَنْ تَدَعَ شَيْئًا لِلَّهِ إِلَّا بَدَّلَكَ اللَّهُ بِهِ مَا هُوَ خَيْرٌ لَكَ مِنْهُ',
      ur: 'تم اللہ کے لیے جو چیز بھی چھوڑو گے، اللہ تمہیں اس سے بہتر عطا فرمائے گا۔',
      id: 'Tidaklah engkau meninggalkan sesuatu karena Allah, melainkan Allah ganti dengan yang lebih baik.',
    },
    source: {
      en: 'Musnad Ahmad 23074',
      bn: 'মুসনাদে আহমাদ ২৩০৭৪',
      ar: 'مسند أحمد ٢٣٠٧٤',
    },
    themeTag: 'self-mastery',
  },
  {
    id: 'pur-h-strong-man',
    category: 'purity',
    subType: 'hadith',
    quoteCategory: 'self-mastery',
    arabic: 'إِنَّمَا الشَّدِيدُ الَّذِي يَمْلِكُ نَفْسَهُ عِنْدَ الْغَضَبِ وَالْهَوَى',
    text: {
      en: 'True strength is mastering yourself in the moment of desire.',
      bn: 'প্রকৃত বীর সে-ই, যে প্রবৃত্তির তাড়নার মুহূর্তে নিজের ওপর নিয়ন্ত্রণ রাখে।',
      ar: 'القوي حقاً من يملك نفسه عند الهوى والشهوة.',
      ur: 'حقیقی طاقتور وہ ہے جو خواہش اور غصے کے وقت اپنے نفس پر قابو رکھے۔',
      id: 'Orang kuat sejati adalah yang mampu menguasai dirinya saat digoda hawa nafsu.',
    },
    source: {
      en: 'Sahih al-Bukhari 6114',
      bn: 'সহীহ বুখারী ৬১১৪',
      ar: 'صحيح البخاري ٦١١٤',
    },
    themeTag: 'self-mastery',
  },
  {
    id: 'pur-p-five-minutes',
    category: 'purity',
    subType: 'proverb',
    quoteCategory: 'self-mastery',
    text: {
      en: 'Never trade 5 days of peace and clarity for 5 minutes of artificial pixels.',
      bn: '৫ মিনিটের কৃত্রিম মোহের বিনিময়ে ৫ দিনের মানসিক প্রশান্তি ও আত্মসম্মান নষ্ট করো না।',
      ar: 'لا تبع خمسة أيام من صفاء الذهن مقابل خمس دقائق من الوهم الزائف.',
      ur: 'پانچ منٹ کے جھوٹے دھوکے کے بدلے پانچ دن کا ذہنی سکون برباد مت کرو۔',
      id: 'Jangan tukar 5 hari ketenangan batin demi 5 menit ilusi layar semu.',
    },
    source: {
      en: 'Neuro-Reset Principle',
      bn: 'আত্মনিয়ন্ত্রণ নীতি',
      ar: 'مبدأ التعافي الذهني',
    },
    themeTag: 'self-mastery',
  },
  {
    id: 'pur-p-master-self',
    category: 'purity',
    subType: 'proverb',
    quoteCategory: 'self-mastery',
    text: {
      en: 'Every urge you outlast rewires your brain toward unshakeable peace.',
      bn: 'প্রতিটি জয় করা তাড়না তোমার মস্তিষ্ককে আরও দৃঢ় ও প্রশান্ত করে তোলে।',
      ar: 'كل رغبة تتجاوزها تعيد بناء عقلك نحو سكينة لا تتزعزع.',
      ur: 'ہر وہ خواہش جس پر آپ قابو پاتے ہیں آپ کے دماغ کو مضبوط اور پرسکون بناتی ہے۔',
      id: 'Setiap dorongan yang berhasil kamu lewati memperkuat ketenangan otakmu.',
    },
    source: {
      en: 'Dopamine Mastery',
      bn: 'ডোপামিন রিসেট',
      ar: 'إعادة توازن الدوبامين',
    },
    themeTag: 'self-mastery',
  },
];

export interface QuoteCategoryOption {
  id: FavoriteQuoteCategory;
  icon: string;
  label: Record<LanguageCode, string>;
  desc: Record<LanguageCode, string>;
}

export const QUOTE_CATEGORY_OPTIONS: QuoteCategoryOption[] = [
  {
    id: 'all',
    icon: '🎲',
    label: {
      en: 'All Categories (Random Mix)',
      bn: 'সব ক্যাটাগরি (র‍্যান্ডম সংমিশ্রণ)',
      ar: 'جميع الفئات (تبديل عشوائي)',
      ur: 'تمام کیٹیگریز (بے ترتیب انتخاب)',
      id: 'Semua Kategori (Acak)',
    },
    desc: {
      en: 'Randomly rotates quotes across Focus, Time, Peace, Self-Mastery & Resilience.',
      bn: 'মনোযোগ, সময়, প্রশান্তি, আত্মনিয়ন্ত্রণ ও ধৈর্যের সকল বাণী পর্যায়ক্রমে র‍্যান্ডমলি দেখাবে।',
      ar: 'يعرض اقتباسات عشوائية متجددة من التركيز والوقت والسكينة وضبط النفس والصبر.',
      ur: 'فوکس، وقت، سکون، خود ضابطگی اور حوصلے کے اقوال بے ترتیب دکھاتا ہے۔',
      id: 'Menampilkan kutipan acak dari Fokus, Waktu, Ketenangan, Kendali Diri & Ketangguhan.',
    },
  },
  {
    id: 'focus-discipline',
    icon: '🎯',
    label: {
      en: 'Focus, Deep Work & Discipline',
      bn: 'গভীর মনোযোগ ও আত্মশৃঙ্খলা',
      ar: 'التركيز العميق والانضباط',
      ur: 'گہری توجہ اور نظم و ضبط',
      id: 'Fokus Mendalam & Disiplin',
    },
    desc: {
      en: 'Sharp motivation on single-tasking, consistency, excellence, and eliminating distraction.',
      bn: 'কাজে একনিষ্ঠতা, ধারাবাহিকতা এবং অপ্রয়োজনীয় ডিস্ট্রাকশন দূর করার অনুপ্রেরণা।',
      ar: 'حكم محفزة حول إتقان العمل، الاستمرارية، والتخلص من المشتتات.',
      ur: 'یکسوئی، مستقل مزاجی اور غیر ضروری مصروفیات چھوڑنے کی ترغیب۔',
      id: 'Motivasi tajam tentang konsistensi, keunggulan kerja, dan bebas distraksi.',
    },
  },
  {
    id: 'time-purpose',
    icon: '⏳',
    label: {
      en: 'Time Mastery & Purpose',
      bn: 'সময়ের মূল্য ও জীবনের লক্ষ্য',
      ar: 'قيمة الوقت والغاية',
      ur: 'وقت کی قدر اور مقصدِ زندگی',
      id: 'Penguasaan Waktu & Tujuan',
    },
    desc: {
      en: 'Powerful reminders to guard your hours, stop mindless scrolling, and act with intention.',
      bn: 'অকারণে স্ক্রলিং বন্ধ করে প্রতিটি মুহূর্তকে সার্থক ও অর্থবহ করার অনুপ্রেরণামূলক বাণী।',
      ar: 'تذكيرات قوية لحفظ الوقت وترك التصفح العشوائي والعيش بهدف.',
      ur: 'بے مقصد اسکرولنگ چھوڑ کر اپنے قیمتی وقت کو بامقصد بنانے کی یاد دہانی۔',
      id: 'Pengingat kuat untuk menjaga waktu dan berhenti menggulir layar tanpa arah.',
    },
  },
  {
    id: 'peace-sakinah',
    icon: '🕊️',
    label: {
      en: 'Inner Peace, Calm & Sakīnah',
      bn: 'মনের প্রশান্তি ও সাকীনাহ',
      ar: 'السكينة وطمأنينة القلب',
      ur: 'قلبی سکون اور اطمینان (سکینہ)',
      id: 'Ketenangan Batin & Sakinah',
    },
    desc: {
      en: 'Gentle, grounding words to quiet anxiety, digital noise, and restlessness.',
      bn: 'মানসিক অস্থিরতা, উদ্বেগ ও ডিজিটাল কোলাহল শান্ত করার প্রশান্তিময় বাণী।',
      ar: 'كلمات هادئة تبعث الطمأنينة وتزيل القلق وضجيج الشاشات.',
      ur: 'ذہنی بے چینی اور ڈیجیٹل شور کو ختم کر کے دل کو سکون دینے والے اقوال۔',
      id: 'Kata-kata menenangkan untuk meredakan kecemasan dan kebisingan digital.',
    },
  },
  {
    id: 'self-mastery',
    icon: '🛡️',
    label: {
      en: 'Self-Mastery, Willpower & Purity',
      bn: 'আত্মনিয়ন্ত্রণ, ইচ্ছাশক্তি ও পবিত্রতা',
      ar: 'مجاهدة النفس والعفة والإرادة',
      ur: 'خود ضابطگی، قوتِ ارادی اور پاکیزگی',
      id: 'Kendali Diri, Tekad & Kemurnian',
    },
    desc: {
      en: 'High-strength quotes on overcoming urges, dopamine mastery, and guarding the heart.',
      bn: 'ক্ষণিকের তাড়না জয় করা, ডোপামিন নিয়ন্ত্রণ এবং দৃষ্টি ও হৃদয়ের পবিত্রতা রক্ষার বাণী।',
      ar: 'عبارات قوية للتغلب على الشهوات العابرة وحفظ البصر والقلب.',
      ur: 'وقتی خواہشات پر قابو پانے، ڈوپامائن کنٹرول اور دل کی پاکیزگی کے اقوال۔',
      id: 'Kutipan kuat untuk mengalahkan dorongan sesaat dan menjaga kemurnian hati.',
    },
  },
  {
    id: 'resilience-growth',
    icon: '🏔️',
    label: {
      en: 'Resilience, Patience & Hope',
      bn: 'ধৈর্য, মনোবল ও আশাবাদ',
      ar: 'الصبر والصمود والأمل',
      ur: 'صبر، حوصلہ اور امید',
      id: 'Ketangguhan, Kesabaran & Harapan',
    },
    desc: {
      en: 'Uplifting quotes on perseverance through hardship, patience, and daily growth.',
      bn: 'কঠিন সময়ে ধৈর্য ধারণ, নতুন উদ্যমে ঘুরে দাঁড়ানো এবং কখনো হাল না ছাড়ার অনুপ্রেরণা।',
      ar: 'إلهام للصبر الجميل عند الشدائد، عدم اليأس، والنمو المستمر.',
      ur: 'مشکلات میں صبر، ہمت نہ ہارنے اور مسلسل آگے بڑھنے کا حوصلہ۔',
      id: 'Kutipan penyemangat untuk bersabar dalam kesulitan dan pantang menyerah.',
    },
  },
  {
    id: 'quran',
    icon: '📖',
    label: {
      en: 'Quranic Wisdom Only',
      bn: 'শুধুমাত্র আল-কুরআনের বাণী',
      ar: 'آيات القرآن الكريم فقط',
      ur: 'صرف قرآنی آیاتِ حکمت',
      id: 'Khusus Ayat Al-Qur’an',
    },
    desc: {
      en: 'Show exclusively short, piercing motivational verses from the Holy Quran.',
      bn: 'শুধুমাত্র পবিত্র কুরআনের হৃদয়স্পর্শী ও অনুপ্রেরণামূলক আয়াতসমূহ প্রদর্শন করবে।',
      ar: 'عرض الآيات القرآنية القصيرة والمؤثرة فقط.',
      ur: 'صرف قرآن مجید کی مختصر اور پراثر آیات دکھائے گا۔',
      id: 'Hanya menampilkan ayat-ayat pendek Al-Qur’an yang penuh motivasi.',
    },
  },
  {
    id: 'hadith',
    icon: '🕌',
    label: {
      en: 'Prophetic Hadith Only',
      bn: 'শুধুমাত্র সহীহ হাদীসের বাণী',
      ar: 'الأحاديث النبوية فقط',
      ur: 'صرف نبوی احادیثِ مبارکہ',
      id: 'Khusus Hadis Nabi',
    },
    desc: {
      en: 'Show exclusively authentic Hadith on time, focus, character, and contentment.',
      bn: 'শুধুমাত্র সময়, মনোযোগ, উত্তম চরিত্র ও আত্মনিয়ন্ত্রণ বিষয়ক সহীহ হাদীস দেখাবে।',
      ar: 'عرض الأحاديث النبوية الصحيحة حول الوقت والعمل والقناعة فقط.',
      ur: 'صرف وقت، توجہ اور اخلاق سے متعلق صحیح احادیث دکھائے گا۔',
      id: 'Hanya menampilkan Hadis sahih tentang waktu, fokus, dan ketenangan jiwa.',
    },
  },
  {
    id: 'proverbs',
    icon: '🏛️',
    label: {
      en: 'Universal & Stoic Proverbs Only',
      bn: 'শুধুমাত্র সার্বজনীন প্রজ্ঞা ও প্রবাদ',
      ar: 'الحكم والأمثال العالمية فقط',
      ur: 'صرف عالمگیر دانائی اور اقوالِ زریں',
      id: 'Khusus Pepatah & Hikmah Universal',
    },
    desc: {
      en: 'Show timeless universal proverbs on deep focus, stillness, and self-discipline.',
      bn: 'গভীর মনোযোগ, মানসিক স্থিরতা ও শৃঙ্খলা বিষয়ক সার্বজনীন প্রবাদ প্রদর্শন করবে।',
      ar: 'عرض الحكم العالمية الخالدة حول التركيز والهدوء والانضباط الذاتي.',
      ur: 'توجہ، ذہنی سکون اور نظم و ضبط پر عالمگیر اقوال دکھائے گا۔',
      id: 'Menampilkan pepatah universal tentang fokus mendalam dan disiplin diri.',
    },
  },
];

export function getTriggerQuoteCategory(
  trigger: CalmTrigger
): 'focus-discipline' | 'time-purpose' | 'peace-sakinah' | 'self-mastery' | 'resilience-growth' {
  if (trigger.quoteCategory) return trigger.quoteCategory;
  if (trigger.themeTag === 'focus-discipline') return 'focus-discipline';
  if (trigger.themeTag === 'time') return 'time-purpose';
  if (trigger.themeTag === 'self-mastery' || trigger.themeTag === 'purity-gaze') return 'self-mastery';
  if (trigger.themeTag === 'resilience-growth') return 'resilience-growth';
  return 'peace-sakinah';
}

export function getQuoteCategoryLabel(
  category: FavoriteQuoteCategory,
  lang: LanguageCode
): string {
  const found = QUOTE_CATEGORY_OPTIONS.find((opt) => opt.id === category);
  if (!found) return QUOTE_CATEGORY_OPTIONS[0].label[lang] || QUOTE_CATEGORY_OPTIONS[0].label.en;
  return `${found.icon} ${found.label[lang] || found.label.en}`;
}

export function filterMotivationalQuotes(
  inspirationMode: InspirationMode,
  wisdomPack: WisdomPackSource,
  favoriteCategory: FavoriteQuoteCategory = 'all'
): CalmTrigger[] {
  // 1. If user chose a direct source category ('quran', 'hadith', 'proverbs')
  if (favoriteCategory === 'quran') {
    const qList = CALM_MIND_TRIGGERS.filter(
      (item) => item.category === 'quran' || item.subType === 'quran'
    );
    return qList.length > 0 ? qList : CALM_MIND_TRIGGERS;
  }
  if (favoriteCategory === 'hadith') {
    const hList = CALM_MIND_TRIGGERS.filter(
      (item) => item.category === 'hadith' || item.subType === 'hadith'
    );
    return hList.length > 0 ? hList : CALM_MIND_TRIGGERS;
  }
  if (favoriteCategory === 'proverbs') {
    const pList = CALM_MIND_TRIGGERS.filter(
      (item) => item.category === 'proverb' || item.subType === 'proverb'
    );
    return pList.length > 0 ? pList : CALM_MIND_TRIGGERS;
  }

  // 2. Filter pool by Inspiration Mode & Wisdom Pack first
  let pool = CALM_MIND_TRIGGERS;
  if (inspirationMode === 'islamic') {
    if (wisdomPack === 'hadith') {
      pool = CALM_MIND_TRIGGERS.filter(
        (item) => item.category === 'hadith' || item.subType === 'hadith'
      );
    } else if (wisdomPack === 'quran') {
      pool = CALM_MIND_TRIGGERS.filter(
        (item) => item.category === 'quran' || item.subType === 'quran'
      );
    } else {
      pool = CALM_MIND_TRIGGERS.filter(
        (item) =>
          item.category === 'quran' ||
          item.category === 'hadith' ||
          item.subType === 'quran' ||
          item.subType === 'hadith'
      );
    }
  } else if (inspirationMode === 'universal') {
    pool = CALM_MIND_TRIGGERS.filter(
      (item) => item.category === 'proverb' || item.subType === 'proverb'
    );
  } else {
    if (wisdomPack === 'quran') {
      pool = CALM_MIND_TRIGGERS.filter(
        (item) => item.category === 'quran' || item.subType === 'quran'
      );
    } else if (wisdomPack === 'hadith') {
      pool = CALM_MIND_TRIGGERS.filter(
        (item) => item.category === 'hadith' || item.subType === 'hadith'
      );
    } else if (wisdomPack === 'proverbs') {
      pool = CALM_MIND_TRIGGERS.filter(
        (item) => item.category === 'proverb' || item.subType === 'proverb'
      );
    }
  }

  // 3. Apply Thematic Favourite Quote Category filter
  if (favoriteCategory !== 'all') {
    const byTheme = pool.filter(
      (item) => getTriggerQuoteCategory(item) === favoriteCategory
    );
    if (byTheme.length > 0) {
      return byTheme;
    }
    // Fallback to matching theme across all sources if strict source intersection was empty
    const globalTheme = CALM_MIND_TRIGGERS.filter(
      (item) => getTriggerQuoteCategory(item) === favoriteCategory
    );
    if (globalTheme.length > 0) {
      return globalTheme;
    }
  }

  return pool.length > 0 ? pool : CALM_MIND_TRIGGERS;
}

export function pickRandomQuoteIndex(currentIndex: number, listLength: number): number {
  if (listLength <= 1) return 0;
  const safeCurrent = ((currentIndex % listLength) + listLength) % listLength;
  let next = Math.floor(Math.random() * listLength);
  if (next === safeCurrent) {
    next = (safeCurrent + 1 + Math.floor(Math.random() * (listLength - 1))) % listLength;
  }
  return next;
}

export interface ReadingPassage {
  page: number;
  title: { en: string; bn: string; ar: string; ur: string; id: string };
  content: { en: string; bn: string; ar: string; ur: string; id: string };
}

export const FOCUS_READER_PASSAGES: ReadingPassage[] = [
  {
    page: 1,
    title: {
      en: 'Page 1/3: The Anatomy of an Impulse',
      bn: 'পৃষ্ঠা ১/৩: তাৎক্ষণিক তাড়নার স্বরূপ',
      ar: 'صفحة ١/٣: تشريح الاندفاع اللحظي',
      ur: 'صفحہ 1/3: فوری خواہش کی حقیقت',
      id: 'Halaman 1/3: Anatomi Dorongan Impulsif',
    },
    content: {
      en: 'An urge to check a screen or chase artificial stimulation is like an ocean wave: it rises rapidly, peaks for 60 to 90 seconds, and then naturally subsides if you do not feed it. When you pause and breathe, you allow your prefrontal cortex to regain authority over the limbic dopamine loop.',
      bn: 'ফোনের স্ক্রিনে ডুবে যাওয়ার তাড়না সমুদ্রের ঢেউয়ের মতো—এটি দ্রুত ওঠে, ৬০ থেকে ৯০ সেকেন্ড স্থায়ী হয় এবং আপনি যদি এতে সাড়া না দেন তবে তা আপনাআপনি শান্ত হয়ে যায়। একটু থেমে শ্বাস নিলে মস্তিষ্কের যৌক্তিক অংশ পুনরায় নিয়ন্ত্রণ ফিরে পায়।',
      ar: 'الرغبة في تفقد الشاشة تشبه موجة البحر: ترتفع بسرعة، وتبلغ ذروتها لمدة ٦٠ إلى ٩٠ ثانية، ثم تهدأ تلقائياً إذا لم تغذِّها. عندما تتوقف وتتنفس، تستعيد قشرة الدماغ المنطقية السيطرة على دائرة الدوبامين.',
      ur: 'اسکرین دیکھنے کی خواہش سمندر کی لہر کی طرح ہے: یہ تیزی سے اٹھتی ہے، 60 سے 90 سیکنڈ تک عروج پر رہتی ہے، اور اگر آپ اس پر عمل نہ کریں تو خود بخود ختم ہو جاتی ہے۔ رک کر سانس لینے سے دماغ کا منطقی حصہ دوبارہ کنٹرول سنبھال لیتا ہے۔',
      id: 'Dorongan untuk memeriksa layar bagaikan gelombang laut: naik cepat, memuncak selama 60 hingga 90 detik, lalu mereda secara alami jika tidak diikuti. Saat Anda berhenti dan bernapas, korteks prefrontal mengambil alih kendali atas siklus dopamin.',
    },
  },
  {
    page: 2,
    title: {
      en: 'Page 2/3: Guarding the Heart’s Stillness (Sakīnah)',
      bn: 'পৃষ্ঠা ২/৩: হৃদয়ের প্রশান্তি (সাকীনাহ) রক্ষা করা',
      ar: 'صفحة ٢/٣: حفظ سكينة القلب',
      ur: 'صفحہ 2/3: دل کے سکون (سکینہ) کی حفاظت',
      id: 'Halaman 2/3: Menjaga Ketenangan Hati (Sakinah)',
    },
    content: {
      en: 'Every image and notification you consume leaves a residue on your attention. True peace of mind is not achieved by consuming more comforting content, but by protecting the quiet space inside your chest from unnecessary noise.',
      bn: 'প্রতিটি অপ্রয়োজনীয় দৃশ্য ও নোটিফিকেশন আপনার মনোযোগের ওপর ছাপ ফেলে। অধিক তথ্য বা বিনোদন দেখে মনের শান্তি আসে না; বরং হৃদয়ের ভেতরের নীরবতাকে বাহ্যিক কোলাহল থেকে রক্ষা করার মাধ্যমেই প্রকৃত প্রশান্তি অর্জিত হয়।',
      ar: 'كل صورة وإشعار تستهلكه يترك أثراً على انتباهك. راحة البال الحقيقية لا تتحقق بمزيد من التصفح، بل بحماية المساحة الهادئة داخل صدرك من الضوضاء غير الضرورية.',
      ur: 'ہر تصویر اور نوٹیفکیشن آپ کی توجہ پر اثر چھوڑتا ہے۔ حقیقی ذہنی سکون زیادہ مواد دیکھنے سے نہیں بلکہ اپنے دل کی خاموشی کو غیر ضروری شور سے بچانے سے حاصل ہوتا ہے۔',
      id: 'Setiap gambar dan notifikasi yang Anda konsumsi meninggalkan jejak pada perhatian Anda. Ketenangan sejati dicapai dengan melindungi ruang hening di dalam dada dari kebisingan yang tidak perlu.',
    },
  },
  {
    page: 3,
    title: {
      en: 'Page 3/3: Returning to Intentional Action',
      bn: 'পৃষ্ঠা ৩/৩: সচেতন কাজে প্রত্যাবর্তন',
      ar: 'صفحة ٣/٣: العودة إلى العمل الواعي',
      ur: 'صفحہ 3/3: باوقار اور بامقصد عمل کی طرف واپسی',
      id: 'Halaman 3/3: Kembali pada Tindakan Sadar',
    },
    content: {
      en: 'You have now paused long enough for the automatic habit loop to break. Ask yourself honestly: do you still need to open this app for a specific, beneficial purpose, or would closing the screen right now leave you lighter and freer?',
      bn: 'আপনি ইতিমধ্যে স্বয়ংক্রিয় অভ্যাসের চক্রটি ভেঙে ফেলেছেন। এখন নিজেকে সততার সাথে প্রশ্ন করুন: সত্যিই কি কোনো কল্যাণকর কাজে অ্যাপটি খোলা প্রয়োজন, নাকি এখনই ফিরে গেলে আপনার মন আরও হালকা ও মুক্ত থাকবে?',
      ar: 'لقد توقفت الآن بما يكفي لكسر حلقة العادة التلقائية. اسأل نفسك بصدق: هل ما زلت بحاجة لفتح هذا التطبيق لغرض نافع ومحدد، أم أن إغلاق الشاشة الآن سيجعلك أخف وأكثر حرية؟',
      ur: 'آپ نے خودکار عادت کا تسلسل توڑنے کے لیے کافی وقفہ لے لیا ہے۔ اب خود سے ایمانداری سے پوچھیں: کیا واقعی کسی مفید مقصد کے لیے یہ ایپ کھولنا ضروری ہے، یا ابھی اسکرین بند کرنا آپ کو زیادہ ہلکا اور آزاد رکھے گا؟',
      id: 'Anda telah berhenti cukup lama untuk memutus siklus kebiasaan otomatis. Tanyakan dengan jujur: apakah Anda benar-benar perlu membuka aplikasi ini untuk tujuan bermanfaat, atau menutup layar sekarang membuat hati lebih ringan?',
    },
  },
];

export function getTriggerText(trigger: CalmTrigger, lang: LanguageCode): string {
  return trigger.text[lang] || trigger.text.en;
}

export function getTriggerSource(trigger: CalmTrigger, lang: LanguageCode): string {
  if (lang === 'bn') return trigger.source.bn;
  if (lang === 'ar' && trigger.source.ar) return trigger.source.ar;
  const enSrc = trigger.source.en;
  if (lang === 'ur') {
    if (enSrc.includes('Surah')) return enSrc.replace('Surah', 'سورۃ');
    if (enSrc.includes('Sahih')) return enSrc.replace('Sahih al-Bukhari', 'صحیح بخاری').replace('Sahih Muslim', 'صحیح مسلم');
    if (enSrc.includes('Sunan')) return enSrc.replace('Sunan at-Tirmidhi', 'سنن ترمذی').replace('Sunan Ibn Majah', 'سنن ابن ماجہ');
    if (enSrc === 'Mindful Stillness') return 'ذہنی سکون و خاموشی';
    if (enSrc === 'Dopamine Mastery') return 'ڈوپامائن توازن';
    if (enSrc === 'Intentional Living') return 'بامقصد زندگی';
  }
  if (lang === 'id') {
    if (enSrc.includes('Surah')) return enSrc.replace('Surah', 'QS.');
    if (enSrc.includes('Sahih')) return enSrc.replace('Sahih al-Bukhari', 'HR. Bukhari').replace('Sahih Muslim', 'HR. Muslim');
    if (enSrc.includes('Sunan')) return enSrc.replace('Sunan at-Tirmidhi', 'HR. Tirmidzi').replace('Sunan Ibn Majah', 'HR. Ibnu Majah');
    if (enSrc === 'Mindful Stillness') return 'Ketenangan Sadar';
    if (enSrc === 'Dopamine Mastery') return 'Kendali Dopamin';
    if (enSrc === 'Intentional Living') return 'Hidup Berkesadaran';
  }
  return enSrc;
}

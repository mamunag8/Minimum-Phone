import type { CalmTrigger, LanguageCode } from '../types/app';

export const CALM_MIND_TRIGGERS: CalmTrigger[] = [
  // ==========================================
  // 1. QURAN — PEACE OF MIND (SAKĪNAH) ONLY
  // ==========================================
  {
    id: 'q-13-28',
    category: 'quran',
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
    themeTag: 'sakinah',
  },
  {
    id: 'q-2-286',
    category: 'quran',
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
    themeTag: 'sakinah',
  },
  {
    id: 'q-65-3',
    category: 'quran',
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

  // ==========================================
  // 2. HADITH — CALM MIND, CONTENTMENT & TIME
  // ==========================================
  {
    id: 'h-tirmidhi-concern',
    category: 'hadith',
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
    themeTag: 'stillness',
  },
  {
    id: 'h-bukhari-richness',
    category: 'hadith',
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

  // ==========================================
  // 3. UNIVERSAL PROVERBS — CALM MIND ONLY
  // ==========================================
  {
    id: 'p-muddy-water',
    category: 'proverb',
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
    themeTag: 'time',
  },
  {
    id: 'p-noise-peace',
    category: 'proverb',
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

  // ==========================================
  // 4. PURITY & ANTI-PORN MOTIVATION TRIGGERS
  // ==========================================
  {
    id: 'pur-q-24-30',
    category: 'purity',
    subType: 'quran',
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

export interface ReadingPassage {
  page: number;
  title: { en: string; bn: string };
  content: { en: string; bn: string };
}

export const FOCUS_READER_PASSAGES: ReadingPassage[] = [
  {
    page: 1,
    title: {
      en: 'Page 1/3: The Anatomy of an Impulse',
      bn: 'পৃষ্ঠা ১/৩: তাৎক্ষণিক তাড়নার স্বরূপ',
    },
    content: {
      en: 'An urge to check a screen or chase artificial stimulation is like an ocean wave: it rises rapidly, peaks for 60 to 90 seconds, and then naturally subsides if you do not feed it. When you pause and breathe, you allow your prefrontal cortex to regain authority over the limbic dopamine loop.',
      bn: 'ফোনের স্ক্রিনে ডুবে যাওয়ার তাড়না সমুদ্রের ঢেউয়ের মতো—এটি দ্রুত ওঠে, ৬০ থেকে ৯০ সেকেন্ড স্থায়ী হয় এবং আপনি যদি এতে সাড়া না দেন তবে তা আপনাআপনি শান্ত হয়ে যায়। একটু থেমে শ্বাস নিলে মস্তিষ্কের যৌক্তিক অংশ পুনরায় নিয়ন্ত্রণ ফিরে পায়।',
    },
  },
  {
    page: 2,
    title: {
      en: 'Page 2/3: Guarding the Heart’s Stillness (Sakīnah)',
      bn: 'পৃষ্ঠা ২/৩: হৃদয়ের প্রশান্তি (সাকীনাহ) রক্ষা করা',
    },
    content: {
      en: 'Every image and notification you consume leaves a residue on your attention. True peace of mind is not achieved by consuming more comforting content, but by protecting the quiet space inside your chest from unnecessary noise.',
      bn: 'প্রতিটি অপ্রয়োজনীয় দৃশ্য ও নোটিফিকেশন আপনার মনোযোগের ওপর ছাপ ফেলে। অধিক তথ্য বা বিনোদন দেখে মনের শান্তি আসে না; বরং হৃদয়ের ভেতরের নীরবতাকে বাহ্যিক কোলাহল থেকে রক্ষা করার মাধ্যমেই প্রকৃত প্রশান্তি অর্জিত হয়।',
    },
  },
  {
    page: 3,
    title: {
      en: 'Page 3/3: Returning to Intentional Action',
      bn: 'পৃষ্ঠা ৩/৩: সচেতন কাজে প্রত্যাবর্তন',
    },
    content: {
      en: 'You have now paused long enough for the automatic habit loop to break. Ask yourself honestly: do you still need to open this app for a specific, beneficial purpose, or would closing the screen right now leave you lighter and freer?',
      bn: 'আপনি ইতিমধ্যে স্বয়ংক্রিয় অভ্যাসের চক্রটি ভেঙে ফেলেছেন। এখন নিজেকে সততার সাথে প্রশ্ন করুন: সত্যিই কি কোনো কল্যাণকর কাজে অ্যাপটি খোলা প্রয়োজন, নাকি এখনই ফিরে গেলে আপনার মন আরও হালকা ও মুক্ত থাকবে?',
    },
  },
];

export function getTriggerText(trigger: CalmTrigger, lang: LanguageCode): string {
  return trigger.text[lang] || trigger.text.en;
}

export function getTriggerSource(trigger: CalmTrigger, lang: LanguageCode): string {
  if (lang === 'bn') return trigger.source.bn;
  if (lang === 'ar' && trigger.source.ar) return trigger.source.ar;
  return trigger.source.en;
}

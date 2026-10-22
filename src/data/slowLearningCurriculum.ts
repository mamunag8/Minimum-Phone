import type { LanguageCode, SlowLearningTrack } from '../types/app';

export interface SlowLearningLesson {
  id: string;
  track: SlowLearningTrack;
  arabicHeader?: string;
  transliteration?: string;
  title: Record<LanguageCode, string>;
  readingText: Record<LanguageCode, string>;
  keyTakeaway: Record<LanguageCode, string>;
  quizQuestion: Record<LanguageCode, string>;
  quizOptions: Record<LanguageCode, [string, string, string]>;
  correctOptionIndex: 0 | 1 | 2;
  explanation: Record<LanguageCode, string>;
}

export const SLOW_LEARNING_CURRICULUM: SlowLearningLesson[] = [
  // ============================================================================
  // TRACK 1: SLOW ISLAMIC LEARNING (QURAN, HADITH, AKHLAQ & PURITY)
  // ============================================================================
  {
    id: 'islam-1',
    track: 'islam',
    arabicHeader: 'وَالْعَصْرِ ۝ إِنَّ الْإِنسَانَ لَفِي خُسْرٍ',
    transliteration: 'Wal-‘Asr. Innal-insāna lafī khusr.',
    title: {
      en: 'Surah Al-Asr · Capital of Your Life',
      bn: 'সূরা আল-আসর · আপনার জীবনের মূলধন সময়',
      ar: 'سورة العصر · رأس مال عمرك',
      ur: 'سورۃ العصر · آپ کی زندگی کا اصل سرمایہ',
      id: 'Surah Al-Asr · Modal Utama Hidupmu',
    },
    readingText: {
      en: 'In Surah Al-Asr (103:1-3), Allah swears by Time itself that every human being is in a state of continuous loss—except those who believe, do righteous deeds, encourage one another to truth, and encourage one another to patience (Sabr). Imam Ash-Shafi‘i said that if people reflected deeply on this single Surah alone, it would suffice them as a wake-up call. Every minute spent mindlessly scrolling is capital melting away; every minute spent in purposeful action or patience is eternal profit.',
      bn: 'সূরা আল-আসরে (১০৩:১-৩) আল্লাহ সময়ের শপথ করে বলেছেন যে প্রত্যেক মানুষই ক্ষতির মধ্যে রয়েছে—তবে তারা ছাড়া যারা ঈমান এনেছে, সৎকর্ম করেছে, একে অপরকে সত্যের উপদেশ দিয়েছে এবং ধৈর্যের (সবর) উপদেশ দিয়েছে। ইমাম শাফিয়ী (রহ.) বলেছেন, মানুষ যদি কেবল এই একটি সূরা নিয়ে গভীরভাবে চিন্তা করত, তবে এটিই তাদের সতর্ক করার জন্য যথেষ্ট হতো। অযথা স্ক্রলিংয়ে ব্যয় করা প্রতিটি মিনিট গলে যাওয়া বরফের মতো আপনার মূলধন ক্ষয় করছে; আর উদ্দেশ্যপূর্ণ কাজ ও সবরের প্রতিটি মুহূর্ত স্থায়ী কল্যাণ।',
      ar: 'في سورة العصر (١٠٣: ١-٣) يقسم الله بالزمن أن كل إنسان في خسارة مستمرة، إلا الذين آمنوا وعملوا الصالحات وتواصوا بالحق وتواصوا بالصبر. قال الإمام الشافعي: لو تدبر الناس هذه السورة لكفتهم. كل دقيقة تضيع في التصفح العشوائي هي ذوبان لرأس مال عمرك، وكل لحظة في عمل نافع أو صبر عن الشهوة هي ربح باقٍ.',
      ur: 'سورۃ العصر (103:1-3) میں اللہ تعالیٰ زمانے کی قسم کھا کر فرماتا ہے کہ ہر انسان خسارے میں ہے، سوائے ان لوگوں کے جو ایمان لائے، نیک اعمال کیے، ایک دوسرے کو حق کی نصیحت کی اور صبر کی تلقین کی۔ امام شافعیؒ نے فرمایا کہ اگر لوگ صرف اسی ایک سورت پر غور کر لیں تو یہ ان کی ہدایت کے لیے کافی ہے۔ بے مقصد اسکرولنگ میں گزرنے والا ہر منٹ عمر کا سرمایہ پگھلا رہا ہے۔',
      id: 'Dalam Surah Al-Asr (103:1-3), Allah bersumpah demi Waktu bahwa setiap manusia berada dalam kerugian—kecuali orang-orang yang beriman, beramal saleh, saling menasihati dalam kebenaran, dan saling menasihati dalam kesabaran (Sabr). Imam Asy-Syafi’i berkata: seandainya manusia merenungkan surah ini saja, niscaya sudah cukup bagi mereka. Setiap menit tanpa arah di layar mengikis modal hidupmu.',
    },
    keyTakeaway: {
      en: 'Time is not neutral: you are either investing it in truth & patience, or losing it.',
      bn: 'সময় নিরপেক্ষ নয়: হয় আপনি তা সত্য ও ধৈর্যে বিনিয়োগ করছেন, নয়তো হারাচ্ছেন।',
      ar: 'الوقت ليس محايداً: إما أن تستثمره في الحق والصبر أو تخسره.',
      ur: 'وقت غیر جانبدار نہیں: یا آپ اسے حق اور صبر میں لگا رہے ہیں یا ضائع کر رہے ہیں۔',
      id: 'Waktu tidak netral: engkau menginvestasikannya dalam kebenaran dan kesabaran, atau merugi.',
    },
    quizQuestion: {
      en: 'According to Surah Al-Asr, which 4 qualities save a person from losing their life capital?',
      bn: 'সূরা আল-আসর অনুযায়ী কোন ৪টি গুণ মানুষকে জীবনের ক্ষতি থেকে রক্ষা করে?',
      ar: 'حسب سورة العصر، ما الصفات الأربع التي تنجي الإنسان من الخسران؟',
      ur: 'سورۃ العصر کے مطابق کون سی چار صفات انسان کو خسارے سے بچاتی ہیں؟',
      id: 'Menurut Surah Al-Asr, 4 sifat apa yang menyelamatkan manusia dari kerugian?',
    },
    quizOptions: {
      en: [
        'Wealth, fame, rapid multitasking, and constant entertainment',
        'Faith, righteous deeds, mutual counsel to truth, and mutual counsel to patience (Sabr)',
        'Avoiding all work and isolating from society completely',
      ],
      bn: [
        'সম্পদ, খ্যাতি, দ্রুত মাল্টিটাস্কিং এবং অবিরাম বিনোদন',
        'ঈমান, সৎকর্ম, সত্যের উপদেশ এবং ধৈর্যের (সবর) উপদেশ',
        'সব কাজ ছেড়ে সমাজ থেকে সম্পূর্ণ বিচ্ছিন্ন হয়ে থাকা',
      ],
      ar: [
        'المال والشهرة وكثرة الترفيه وتعدد المهام',
        'الإيمان، والعمل الصالح، والتواصي بالحق، والتواصي بالصبر',
        'ترك العمل والانعزال التام عن الناس',
      ],
      ur: [
        'دولت، شہرت، تیز ملٹی ٹاسکنگ اور مسلسل تفریح',
        'ایمان، نیک عمل، حق کی نصیحت اور صبر کی تلقین',
        'تمام کام چھوڑ کر معاشرے سے بالکل الگ ہو جانا',
      ],
      id: [
        'Harta, ketenaran, multitasking cepat, dan hiburan tanpa henti',
        'Iman, amal saleh, saling menasihati dalam kebenaran, dan kesabaran (Sabr)',
        'Meninggalkan semua pekerjaan dan mengasingkan diri sepenuhnya',
      ],
    },
    correctOptionIndex: 1,
    explanation: {
      en: 'Surah Al-Asr teaches that Faith, Righteous Action, Truth, and Patience (Sabr) protect your time from loss.',
      bn: 'সূরা আল-আসর শিক্ষা দেয় যে ঈমান, সৎকর্ম, সত্য এবং সবর আপনার সময়কে ক্ষতি থেকে রক্ষা করে।',
      ar: 'تعلمنا سورة العصر أن الإيمان والعمل الصالح والتواصي بالحق والصبر تحفظ العمر من الضياع.',
      ur: 'سورۃ العصر سکھاتی ہے کہ ایمان، عمل صالح، حق اور صبر آپ کے وقت کو ضیاع سے بچاتے ہیں۔',
      id: 'Surah Al-Asr mengajarkan bahwa Iman, Amal Saleh, Kebenaran, dan Kesabaran menjaga waktumu.',
    },
  },
  {
    id: 'islam-2',
    track: 'islam',
    arabicHeader: 'قُل لِّلْمُؤْمِنِينَ يَغُضُّوا مِنْ أَبْصَارِهِمْ وَيَحْفَظُوا فُرُوجَهُمْ ۚ ذَٰلِكَ أَزْكَىٰ لَهُمْ',
    transliteration: 'Qul lil-mu’minīna yaghuddū min absārihim wa yahfazū furūjahum dhālika azkā lahum.',
    title: {
      en: 'Surah An-Nur (24:30) · Guarding the Eyes Brings Purity (Zakah)',
      bn: 'সূরা আন-নূর (২৪:৩০) · দৃষ্টি সংযত রাখাই হৃদয়ের পবিত্রতা',
      ar: 'سورة النور (٢٤: ٣٠) · غض البصر أزكى للقلب',
      ur: 'سورۃ النور (24:30) · نگاہ کی حفاظت دل کی پاکیزگی ہے',
      id: 'Surah An-Nur (24:30) · Menjaga Pandangan Menyucikan Hati',
    },
    readingText: {
      en: 'In Surah An-Nur (24:30), Allah commands believers to lower their gaze and guard their chastity, declaring: "That is purer (azkā) for them." Classical scholars explain that the eye is the mirror of the heart: when you guard your eyes from forbidden or overstimulating images on a screen, Allah places light (Noor), mental clarity, and sweetness of worship into your heart. Turning away from a single tempting glance immediately breaks the addiction cycle before it takes root.',
      bn: 'সূরা আন-নূরে (২৪:৩০) আল্লাহ মুমিনদের দৃষ্টি সংযত রাখতে ও পবিত্রতা রক্ষা করতে নির্দেশ দিয়ে বলেছেন: “এটিই তাদের জন্য অধিক পবিত্র (আযকা)।” আলেমগণ ব্যাখ্যা করেছেন যে চোখ হলো হৃদয়ের আয়না—যখন আপনি ফোনের পর্দায় নিষিদ্ধ বা উত্তেজক দৃশ্য থেকে নিজের চোখ ফিরিয়ে নেন, তখন আল্লাহ আপনার হৃদয়ে নূর (আলো), মানসিক স্বচ্ছতা এবং প্রশান্তি দান করেন। প্রথম প্রলোভনের মুহূর্তেই দৃষ্টি সরিয়ে নেওয়া আসক্তির শিকড় ভেঙে দেয়।',
      ar: 'في سورة النور (٢٤: ٣٠) يأمر الله المؤمنين بغض البصر وحفظ الفرج ويقول: «ذلك أزكى لهم». قرر العلماء أن العين مرآة القلب؛ فإذا غض العبد بصره عن المحرمات على الشاشات أورث الله قلبه نوراً وبصيرة وحلاوة وسكينة، وقطع شجرة الشهوة قبل أن تتمكن من الفؤاد.',
      ur: 'سورۃ النور (24:30) میں اللہ تعالیٰ مومنوں کو نگاہیں نیچی رکھنے اور پاکدامنی کی حفاظت کا حکم دیتے ہوئے فرماتا ہے: "یہ ان کے لیے زیادہ پاکیزہ (ازکیٰ) ہے۔" علماء فرماتے ہیں کہ آنکھ دل کا آئینہ ہے؛ جب آپ اسکرین پر حرام مناظر سے نظر ہٹاتے ہیں تو اللہ دل میں نور، سکون اور بصیرت عطا فرماتا ہے۔',
      id: 'Dalam Surah An-Nur (24:30), Allah memerintahkan orang beriman menundukkan pandangan dan menjaga kehormatan: "Yang demikian itu lebih suci (azkā) bagi mereka." Para ulama menjelaskan bahwa mata adalah cermin hati: saat engkau menjaga mata dari tontonan haram di layar, Allah menanamkan cahaya (Noor) dan ketenangan di dalam hatimu.',
    },
    keyTakeaway: {
      en: 'Every guarded glance plants light (Noor) and mental strength inside the heart.',
      bn: 'প্রতিটি সংযত দৃষ্টি হৃদয়ে নূর ও মানসিক শক্তি সৃষ্টি করে।',
      ar: 'كل نظرة محرمة تتركها لله تورث قلبك نوراً وقوة.',
      ur: 'ہر محفوظ نگاہ دل میں نور اور ذہنی طاقت پیدا کرتی ہے۔',
      id: 'Setiap pandangan yang dijaga menumbuhkan cahaya dan kekuatan batin.',
    },
    quizQuestion: {
      en: 'What reward does Surah An-Nur (24:30) promise directly for lowering the gaze and guarding modesty?',
      bn: 'দৃষ্টি সংযত রাখা ও পবিত্রতা রক্ষার প্রত্যক্ষ ফল হিসেবে সূরা আন-নূরে (২৪:৩০) কী প্রতিশ্রুতি দেওয়া হয়েছে?',
      ar: 'ما الثمرة المباشرة التي وعدت بها سورة النور (٢٤: ٣٠) لمن يغض بصره؟',
      ur: 'سورۃ النور (24:30) میں نگاہ کی حفاظت کا فوری ثمرہ کیا بتایا گیا ہے؟',
      id: 'Apa buah langsung yang dijanjikan Surah An-Nur (24:30) bagi yang menjaga pandangan?',
    },
    quizOptions: {
      en: [
        'Greater purity, spiritual growth, and inner clarity ("Dhālika azkā lahum")',
        'More social media followers and digital entertainment',
        'Never feeling any human emotion again',
      ],
      bn: [
        'অধিক পবিত্রতা, আত্মিক উন্নতি ও হৃদয়ের স্বচ্ছতা (“যালিকা আযকা লাহুম”)',
        'সোশ্যাল মিডিয়ায় আরও বেশি অনুসারী ও বিনোদন',
        'মানুষের সকল স্বাভাবিক অনুভূতি লোপ পাওয়া',
      ],
      ar: [
        'الزكاة والطهارة والنور للقلب («ذلك أزكى لهم»)',
        'زيادة المتابعين والترفيه الرقمي',
        'انعدام المشاعر الإنسانية تماماً',
      ],
      ur: [
        'زیادہ پاکیزگی، روحانی ترقی اور دل کا نور ("ذٰلک ازکیٰ لہم")',
        'سوشل میڈیا پر زیادہ شہرت اور تفریح',
        'انسانی جذبات کا بالکل ختم ہو جانا',
      ],
      id: [
        'Kesucian hati, pertumbuhan jiwa, dan kejernihan batin ("Dhālika azkā lahum")',
        'Lebih banyak pengikut media sosial dan hiburan',
        'Hilangnya seluruh perasaan manusia',
      ],
    },
    correctOptionIndex: 0,
    explanation: {
      en: '"Dhālika azkā lahum" — Guarding the eyes purifies the heart and clears mental fog.',
      bn: '“যালিকা আযকা লাহুম” — চোখের হেফাজত হৃদয়কে পবিত্র করে এবং মানসিক ধোঁয়াশা দূর করে।',
      ar: '«ذلك أزكى لهم» — حفظ البصر يطهر القلب ويجلي ضباب الذهن.',
      ur: '"ذٰلک ازکیٰ لہم" — نگاہ کی حفاظت دل کو پاک اور ذہن کو روشن کرتی ہے۔',
      id: '"Dhālika azkā lahum" — Menjaga mata menyucikan hati dan menjernihkan pikiran.',
    },
  },
  {
    id: 'islam-3',
    track: 'islam',
    arabicHeader: 'إِنَّمَا الصَّبْرُ عِندَ الصَّدْمَةِ الأُولَى',
    transliteration: 'Innamas-sabru ‘indas-sadmatil-ūlā.',
    title: {
      en: 'Sahih Bukhari · Patience at the First Impulse',
      bn: 'সহীহ বুখারী · প্রথম আঘাতেই প্রকৃত ধৈর্য (সবর)',
      ar: 'صحيح البخاري · الصبر عند الصدمة الأولى',
      ur: 'صحیح بخاری · اصل صبر پہلے لمحے میں ہے',
      id: 'Sahih Bukhari · Kesabaran Sejati pada Impuls Pertama',
    },
    readingText: {
      en: 'The Prophet ﷺ said: "True patience (Sabr) is at the first strike." (Sahih al-Bukhari 1283). Just as patience in hardship matters most in the first moment of shock, patience against digital temptation is easiest in the first 5 seconds of an urge. Before an impulse turns into a fantasy, and before a fantasy turns into a tap, pausing for 30 seconds at the very first spark extinguishes the fire effortlessly.',
      bn: 'রাসূলুল্লাহ ﷺ বলেছেন: “প্রকৃত সবর (ধৈর্য) হলো বিপদের প্রথম আঘাতেই।” (সহীহ বুখারী ১২৮৩)। ঠিক যেমন বিপদের প্রথম মুহূর্তে ধৈর্য ধরা সবচেয়ে গুরুত্বপূর্ণ, তেমনি ডিজিটাল প্রলোভন বা আসক্তির বিরুদ্ধে প্রথম ৫ সেকেন্ডে নিজেকে থামানো সবচেয়ে সহজ। সামান্য ইচ্ছা কল্পনায় রূপ নেওয়ার আগে এবং কল্পনা কোনো ভুল ক্লিকে রূপ নেওয়ার আগে শুরুতেই ৩০ সেকেন্ড থেমে গেলে পুরো আগুনের স্ফুলিঙ্গ নিভে যায়।',
      ar: 'قال النبي ﷺ: «إنما الصبر عند الصدمة الأولى» (رواه البخاري ١٢٨٣). كما أن الصبر الحقيقي يكون في أول لحظة للبلاء، فإن صبر النفس عن الشهوات والاندفاع الرقمي يكون أيسر ما يكون في الثواني الخمس الأولى من الخاطرة قبل أن تتحول إلى رغبة ثم إلى فعل.',
      ur: 'نبی کریم ﷺ نے فرمایا: "حقیقی صبر صدمے کے پہلے لمحے میں ہوتا ہے۔" (صحیح بخاری 1283)۔ جس طرح مصیبت کے آغاز میں صبر اصل ہے، اسی طرح نفسانی یا ڈیجیٹل خواہش کے پہلے 5 سیکنڈ میں رک جانا سب سے آسان اور مؤثر ہے۔',
      id: 'Nabi ﷺ bersabda: "Sesungguhnya kesabaran sejati itu pada benturan pertama." (HR. Bukhari 1283). Sama seperti saat musibah, menahan dorongan digital paling mudah dilakukan pada 5 detik pertama sebelum berubah menjadi tindakan.',
    },
    keyTakeaway: {
      en: 'Stop the impulse in the first 5 seconds—before a passing thought becomes a habit loop.',
      bn: 'প্রথম ৫ সেকেন্ডেই তাড়নাকে থামান—ক্ষণিকের চিন্তা অভ্যাসে পরিণত হওয়ার আগেই।',
      ar: 'أوقف الاندفاع في الثواني الخمس الأولى قبل أن تتحول الخاطرة إلى عادة.',
      ur: 'پہلے 5 سیکنڈ میں خواہش کو روک لیں، اس سے پہلے کہ خیال عادت بن جائے۔',
      id: 'Hentikan dorongan pada 5 detik pertama sebelum pikiran sesaat menjadi kebiasaan.',
    },
    quizQuestion: {
      en: 'When is resisting a digital craving or emotional impulse easiest and most effective?',
      bn: 'ডিজিটাল আসক্তি বা আবেগীয় তাড়না প্রতিরোধ করা কখন সবচেয়ে সহজ ও কার্যকর?',
      ar: 'متى تكون مقاومة الاندفاع الرقمي أو الشهوة أسهل وأشد أثراً؟',
      ur: 'ڈیجیٹل لت یا نفسانی خواہش کو روکنا کب سب سے آسان اور مؤثر ہوتا ہے؟',
      id: 'Kapan menahan dorongan digital paling mudah dan paling efektif?',
    },
    quizOptions: {
      en: [
        'After scrolling for 45 minutes',
        'At the very first spark / first 5 seconds of the impulse ("first strike")',
        'Only after midnight',
      ],
      bn: [
        '৪৫ মিনিট স্ক্রল করার পর',
        'তাড়নার একদম প্রথম স্ফুলিঙ্গে / প্রথম ৫ সেকেন্ডে (“প্রথম আঘাতে”)',
        'শুধুমাত্র মধ্যরাতের পর',
      ],
      ar: [
        'بعد ٤٥ دقيقة من التصفح',
        'عند الصدمة الأولى وفي الثواني الأولى من الخاطرة',
        'بعد منتصف الليل فقط',
      ],
      ur: [
        '45 منٹ اسکرولنگ کرنے کے بعد',
        'خواہش کے بالکل پہلے لمحے / پہلے 5 سیکنڈ میں ("پہلے صدمے پر")',
        'صرف آدھی رات کے بعد',
      ],
      id: [
        'Setelah scrolling selama 45 menit',
        'Pada percikan pertama / 5 detik awal munculnya dorongan',
        'Hanya setelah tengah malam',
      ],
    },
    correctOptionIndex: 1,
    explanation: {
      en: 'Stopping an urge at its very first spark ("al-sadmah al-ūlā") requires 10x less willpower than stopping mid-scroll.',
      bn: 'স্ক্রলিংয়ের মাঝখানে থামার চেয়ে একদম প্রথম স্ফুলিঙ্গে থামা ১০ গুণ সহজ।',
      ar: 'إيقاف الخاطرة في أولها أسهل بعشر مرات من محاولة التوقف بعد الاسترسال.',
      ur: 'شروعات ہی میں خواہش کو روکنا، درمیان میں رکنے سے دس گنا آسان ہے۔',
      id: 'Menghentikan dorongan di awal 10 kali lebih mudah daripada berhenti di tengah scrolling.',
    },
  },
  {
    id: 'islam-4',
    track: 'islam',
    arabicHeader: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
    transliteration: 'Alā bi-dhikrillāhi tatma’innul-qulūb.',
    title: {
      en: 'Surah Ar-Ra‘d (13:28) · Why Dopamine Never Satisfies the Heart',
      bn: 'সূরা আর-রাদ (১৩:২৮) · কেন ডোপামিন কখনো হৃদয়কে তৃপ্ত করতে পারে না',
      ar: 'سورة الرعد (١٣: ٢٨) · لماذا لا يشبع الدوبامين القلب أبداً',
      ur: 'سورۃ الرعد (13:28) · ڈوپامائن دل کو مطمئن کیوں نہیں کر سکتی',
      id: 'Surah Ar-Ra‘d (13:28) · Mengapa Dopamin Tak Pernah Menenangkan Hati',
    },
    readingText: {
      en: 'Surah Ar-Ra‘d (13:28) states an absolute law of human psychology: "Unquestionably, by the remembrance of Allah do hearts find rest (tuma’nīnah)." Cheap digital dopamine (endless reels, notifications, and artificial novelty) excites the brain’s craving circuit without ever giving rest to the heart. That is why an hour of scrolling leaves you more exhausted than before, while 60 seconds of quiet Dhikr and gratitude restores deep peace.',
      bn: 'সূরা আর-রাদ (১৩:২৮) মানব মনোবিজ্ঞানের একটি চিরন্তন সত্য ঘোষণা করে: “জেনে রাখো, আল্লাহর স্মরণেই (যিকির) হৃদয়সমূহ প্রশান্তি পায়।” সস্তা ডিজিটাল ডোপামিন (অবিরাম রিলস, নোটিফিকেশন ও কৃত্রিম উত্তেজনা) মস্তিষ্কের তৃষ্ণা বাড়ায় কিন্তু হৃদয়কে কখনো বিশ্রাম দেয় না। তাই এক ঘণ্টা স্ক্রল করার পর নিজেকে আরও ক্লান্ত মনে হয়, অথচ ৬০ সেকেন্ডের নীরব যিকির ও কৃতজ্ঞতা গভীর প্রশান্তি ফিরিয়ে আনে।',
      ar: 'يقرر القرآن في سورة الرعد (١٣: ٢٨) قانوناً فطرياً: «ألا بذكر الله تطمئن القلوب». الدوبامين الرقمي الرخيص يثير دوائر الطلب في الدماغ دون أن يمنح القلب طمأنينة؛ ولذلك تخرج من ساعة التصفح أشد تعباً، بينما دقيقة من الذكر الصادق تعيد للروح سكينتها.',
      ur: 'سورۃ الرعد (13:28) انسانی نفسیات کا اٹل قانون بیان کرتی ہے: "خبردار! اللہ کے ذکر ہی سے دلوں کو اطمینان نصیب ہوتا ہے۔" سستی ڈیجیٹل ڈوپامائن دماغ میں بے چینی بڑھاتی ہے مگر دل کو سکون نہیں دیتی، جبکہ ایک منٹ کا خاموش ذکر اور شکر گہرا اطمینان لوٹا دیتا ہے۔',
      id: 'Surah Ar-Ra‘d (13:28) menegaskan hukum jiwa manusia: "Ingatlah, hanya dengan mengingat Allah hati menjadi tenteram." Dopamin digital murah hanya memicu rasa haus di otak tanpa memberi ketenangan, sedangkan 60 detik dzikir yang tenang memulihkan kedamaian batin.',
    },
    keyTakeaway: {
      en: 'Notifications stimulate restlessness; remembrance and stillness bring Tuma’nīnah (tranquility).',
      bn: 'নোটিফিকেশন অস্থিরতা বাড়ায়; আর আল্লাহর স্মরণ ও নীরবতা আনে প্রশান্তি (তুমأنينة)।',
      ar: 'الإشعارات تثير القلق، وذكر الله والسكينة يورثان الطمأنينة.',
      ur: 'نوٹیفکیشن بے چینی بڑھاتے ہیں، جبکہ ذکر الٰہی اور خاموشی سکون بخشتے ہیں۔',
      id: 'Notifikasi memicu gelisah; dzikir dan keheningan menghadirkan ketenteraman.',
    },
    quizQuestion: {
      en: 'Why does an hour of mindless scrolling leave the mind feeling drained rather than rested?',
      bn: 'এক ঘণ্টা অযথা স্ক্রল করার পর মন বিশ্রামের বদলে আরও ক্লান্ত হয়ে পড়ে কেন?',
      ar: 'لماذا يخرج الإنسان من التصفح الطويل مجهداً بدل الراحة؟',
      ur: 'ایک گھنٹہ بے مقصد اسکرولنگ کے بعد ذہن پرسکون ہونے کے بجائے تھک کیوں جاتا ہے؟',
      id: 'Mengapa satu jam scrolling tanpa arah membuat pikiran lelah, bukan tenang?',
    },
    quizOptions: {
      en: [
        'Because artificial dopamine triggers craving loops without giving the heart tranquility (Tuma’nīnah)',
        'Because the screen brightness was too low',
        'Because you did not open enough apps at the same time',
      ],
      bn: [
        'কারণ কৃত্রিম ডোপামিন কেবল তৃষ্ণার চক্র বাড়ায় কিন্তু হৃদয়ে প্রশান্তি (তুমأنينة) দেয় না',
        'কারণ ফোনের আলো কম ছিল',
        'কারণ আপনি একসাথে অনেকগুলো অ্যাপ খোলেননি',
      ],
      ar: [
        'لأن الدوبامين المصطنع يثير حلقة التعلق دون أن يمنح القلب الطمأنينة',
        'لأن إضاءة الشاشة كانت منخفضة',
        'لأنك لم تفتح تطبيقات كافية في نفس الوقت',
      ],
      ur: [
        'کیونکہ مصنوعی ڈوپامائن صرف طلب بڑھاتی ہے اور دل کو اطمینان (طمأنینہ) نہیں دیتی',
        'کیونکہ اسکرین کی روشنی کم تھی',
        'کیونکہ آپ نے ایک ساتھ زیادہ ایپس نہیں کھولیں',
      ],
      id: [
        'Karena dopamin buatan memicu siklus candu tanpa memberi ketenteraman hati (Tuma’nīnah)',
        'Karena kecerahan layar terlalu rendah',
        'Karena kurang banyak membuka aplikasi sekaligus',
      ],
    },
    correctOptionIndex: 0,
    explanation: {
      en: 'Craving loops overstimulate the brain; true rest comes from stillness and remembrance.',
      bn: 'ডোপামিন চক্র মস্তিষ্ককে ক্লান্ত করে; প্রকৃত বিশ্রাম আসে স্থিরতা ও আল্লাহর স্মরণে।',
      ar: 'حلقات الدوبامين ترهق الدماغ، والراحة الحقيقية في السكينة والذكر.',
      ur: 'ڈوپامائن کا چکر دماغ کو تھکا دیتا ہے، حقیقی سکون ذکر اور خاموشی میں ہے۔',
      id: 'Siklus dopamin menguras otak; istirahat sejati datang dari keheningan dan dzikir.',
    },
  },

  // ============================================================================
  // TRACK 2: SLOW LANGUAGE & VOCABULARY MASTERY (ARABIC / ENGLISH / BANGLA)
  // ============================================================================
  {
    id: 'lang-1',
    track: 'language',
    arabicHeader: 'سَكِينَة (Sakīnah) · Serenity · প্রশান্তি',
    transliteration: 'Root: S-K-N (س ك ن) — To settle, become still, dwell in peace',
    title: {
      en: 'Word Mastery #1 · Sakīnah / Serenity / প্রশান্তি',
      bn: 'শব্দ শিক্ষা #১ · Sakīnah (সাকীনাহ) / Serenity / প্রশান্তি',
      ar: 'إتقان المفردات #١ · سَكِينَة / Serenity / الهدوء العميق',
      ur: 'زبان دانی #1 · سَكِينَة (سکینہ) / Serenity / قلبی سکون',
      id: 'Penguasaan Kata #1 · Sakīnah / Serenity / Ketenangan Batin',
    },
    readingText: {
      en: 'Vocabulary Deep-Dive: The Arabic word "Sakīnah" (سَكِينَة) comes from the root S-K-N (س-ك-ن), meaning for something moving and agitated to settle down cleanly into stillness. From the same root comes "Sakan" (home/sanctuary) and "Miskīn" (one whose motion is stilled by poverty). In English, its closest counterpart is "Serenity" or "Equanimity"—not the absence of noise around you, but an unshakeable calm inside you. In Bangla, it is "প্রশান্তি" (Proshanti). Example: "By silencing constant notifications, he restored Sakīnah (serenity) to his workspace."',
      bn: 'শব্দ ও ভাষা পাঠ: আরবি শব্দ “সাকীনাহ” (سَكِينَة) এসেছে “সীন-কাফ-নূন” (س-ك-ن) মূল ধাতু থেকে, যার অর্থ অস্থির বা কম্পমান কোনো কিছুর স্থির ও শান্ত হয়ে যাওয়া। একই ধাতু থেকে এসেছে “সাকান” (আবাস বা নিরাপদ আশ্রয়)। ইংরেজিতে এর সমার্থক শব্দ হলো “Serenity” (সেরেনিটি) বা “Equanimity” (ইকুয়ানিমিটি)—যার অর্থ কেবল চারপাশের শব্দহীনতা নয়, বরং ঝড়ের মাঝেও মনের অবিচল প্রশান্তি। উদাহরণ: “অবিরাম নোটিফিকেশন বন্ধ করে সে তার কাজের জায়গায় প্রশান্তি (Serenity) ফিরিয়ে এনেছে।”',
      ar: 'دراسة لغوية: كلمة «سَكِينَة» مشتقة من الجذر الثلاثي (س ك ن)، ويدل على استقرار الشيء بعد تحركه واضطرابه، ومنه «السَّكَن» أي المنزل الذي يأوي إليه الإنسان فيسكن فيه. وفي الإنجليزية تقابلها كلمة (Serenity) أي الصفاء والهدوء الراسخ وسط الضجيج، وفي البنغالية (প্রশান্তি - Proshanti). مثال: "By guarding his attention, he found deep serenity (Sakīnah)."',
      ur: 'لفظی مطالعہ: عربی لفظ "سَكِينَة" مادہ (س-ك-ن) سے نکلا ہے جس کے معنی ہیں کسی مضطرب اور ہلتی ہوئی چیز کا ٹھہر جانا اور پرسکون ہو جانا۔ اسی سے لفظ "سکن" (مسکن/گھر) ہے۔ انگریزی میں اس کا مترادف لفظ "Serenity" (سیرینیٹی) اور بنگلہ میں "প্রশান্তি" (پروشانتی) ہے۔ جملہ: "اس نے نوٹیفکیشن بند کر کے اپنے ذہن میں Serenity (سکینہ) بحال کر لی۔"',
      id: 'Kajian Kosakata: Kata Arab "Sakīnah" (سَكِينَة) berasal dari akar kata S-K-N (س-ك-ن) yang berarti sesuatu yang tadinya berguncang menjadi tenang dan menetap. Dari akar yang sama lahir kata "Sakan" (tempat tinggal yang menenteramkan). Dalam bahasa Inggris padanannya adalah "Serenity" (ketenangan batin yang kokoh). Contoh: "By turning off alerts, he reclaimed his serenity."',
    },
    keyTakeaway: {
      en: 'Sakīnah (سَكِينَة) = Serenity = প্রশান্তি (Root S-K-N: to settle into stillness).',
      bn: 'Sakīnah (سَكِينَة) = Serenity = প্রশান্তি (মূল ধাতু S-K-N: অস্থিরতা থেমে স্থির হওয়া)।',
      ar: 'سَكِينَة = Serenity = প্রশান্তি (الجذر س-ك-ن: الاستقرار بعد الاضطراب).',
      ur: 'سَكِينَة = Serenity = প্রশান্তি (مادہ س-ك-ن: اضطراب کے بعد قرار پانا)۔',
      id: 'Sakīnah = Serenity = প্রশান্তি (Akar S-K-N: menetap dalam ketenangan).',
    },
    quizQuestion: {
      en: 'What does the root S-K-N (س-ك-ن) of "Sakīnah" (Serenity / প্রশান্তি) literally signify?',
      bn: '“সাকীনাহ” (Serenity / প্রশান্তি) শব্দের মূল ধাতু S-K-N (س-ك-ن)-এর আভিধানিক অর্থ কী?',
      ar: 'ما المعنى اللغوي الأصلي للجذر (س-ك-ن) الذي اشتقت منه كلمة «سكينة» (Serenity)؟',
      ur: '"سَكِينَة" (Serenity) کے مادہ (س-ك-ن) کے لغوی معنی کیا ہیں؟',
      id: 'Apa makna harfiah akar kata S-K-N (س-ك-ن) pada kata "Sakīnah" (Serenity)?',
    },
    quizOptions: {
      en: [
        'To run rapidly in multiple directions at once',
        'For something agitated to settle down into calm stillness (also the root of Sakan / Sanctuary)',
        'To speak loudly in a crowd',
      ],
      bn: [
        'একসাথে বহু দিকে দ্রুত ছোটাছুটি করা',
        'অস্থির বা চঞ্চল কোনো কিছুর শান্ত ও স্থির হওয়া (যা থেকে সাকান/নিবাস শব্দটিও এসেছে)',
        'ভিড়ের মধ্যে উচ্চস্বরে কথা বলা',
      ],
      ar: [
        'الركض السريع في اتجاهات متعددة',
        'استقرار الشيء وهدوؤه بعد اضطرابه وتحركه (ومنه السَّكَن)',
        'رفع الصوت في الزحام',
      ],
      ur: [
        'ایک ساتھ کئی سمتوں میں تیزی سے دوڑنا',
        'کسی مضطرب چیز کا ٹھہر جانا اور پرسکون ہونا (جس سے لفظ سکن بھی ہے)',
        'ہجوم میں بلند آواز سے بولنا',
      ],
      id: [
        'Berlari cepat ke banyak arah sekaligus',
        'Menetap dan tenangnya sesuatu setelah terguncang (juga akar kata Sakan / hunian)',
        'Berbicara keras di tengah keramaian',
      ],
    },
    correctOptionIndex: 1,
    explanation: {
      en: 'Correct! S-K-N means to settle into stillness—giving us Sakīnah (Serenity) and Sakan (Home).',
      bn: 'সঠিক! S-K-N অর্থ স্থির ও প্রশান্ত হওয়া—যা থেকে সাকীনাহ (Serenity/প্রশান্তি) ও সাকান (নিবাস) এসেছে।',
      ar: 'صحيح! الجذر (س-ك-ن) يفيد الاستقرار والهدوء، ومنه السكينة والسكن.',
      ur: 'درست! (س-ك-ن) کا مطلب ٹھہرنا اور پرسکون ہونا ہے جس سے سکینہ اور سکن بنے ہیں۔',
      id: 'Benar! S-K-N berarti menetap dalam ketenangan—melahirkan kata Sakīnah dan Sakan.',
    },
  },
  {
    id: 'lang-2',
    track: 'language',
    arabicHeader: 'اسْتِقَامَة (Istiqāmah) · Steadfastness · অবিচলতা',
    transliteration: 'Root: Q-W-M (ق و م) — To stand upright, hold a straight path consistently',
    title: {
      en: 'Word Mastery #2 · Istiqāmah / Steadfastness / অবিচলতা',
      bn: 'শব্দ শিক্ষা #২ · Istiqāmah (ইস্তিকামাহ) / Steadfastness / অবিচলতা',
      ar: 'إتقان المفردات #٢ · اسْتِقَامَة / Steadfastness / الثبات',
      ur: 'زبان دانی #2 · اسْتِقَامَة (استقامت) / Steadfastness / ثابت قدمی',
      id: 'Penguasaan Kata #2 · Istiqāmah / Steadfastness / Keteguhan',
    },
    readingText: {
      en: 'Vocabulary Deep-Dive: "Istiqāmah" (اسْتِقَامَة) stems from the root Q-W-M (ق-و-م), meaning to stand upright and remain straight without wavering left or right. In English, it translates to "Steadfastness", "Consistency", or "Unwavering Perseverance." In Bangla, it is "অবিচলতা" (Obicholota) or "ধারাবাহিকতা". Great achievements in learning, faith, and career never come from a single burst of motivation; they come from Istiqāmah—showing up with calm discipline every single day.',
      bn: 'শব্দ ও ভাষা পাঠ: “ইস্তিকামাহ” (اسْتِقَامَة) শব্দটি এসেছে “ক্বাফ-ওয়াও-মীম” (ق-و-م) মূল ধাতু থেকে, যার অর্থ সোজা হয়ে দাঁড়ানো এবং ডানে-বামে না ঝুঁকে সঠিক পথে অটল থাকা। ইংরেজিতে একে বলা হয় “Steadfastness” (স্টেডফাস্টনেস) বা “Consistency” (কনসিসটেন্সি), এবং বাংলায় “অবিচলতা” বা “নিরবচ্ছিন্ন ধারাবাহিকতা”। শিক্ষা, ঈমান বা কর্মজীবনে বড় কোনো সাফল্য এক দিনের আবেগে আসে না; তা আসে প্রতিদিন শান্ত শৃঙ্খলার সাথে অবিচল (Steadfast) থাকার মাধ্যমে।',
      ar: 'دراسة لغوية: كلمة «اسْتِقَامَة» من الجذر (ق و م) وتعني القيام المعتدل ولزوم الطريق المستقيم دون انحراف. وتقابلها في الإنجليزية كلمة (Steadfastness) أو (Consistency)، وفي البنغالية (অবিচলতা). النجاح العظيم في العلم والعمل والعبادة لا يصنعه الحماس المؤقت، بل تصنعه الاستقامة اليومية الهادئة.',
      ur: 'لفظی مطالعہ: "استقامت" (اسْتِقَامَة) مادہ (ق-و-م) سے ہے جس کا مطلب سیدھا کھڑا ہونا اور بغیر ڈگمگائے سیدھے راستے پر قائم رہنا ہے۔ انگریزی میں اسے "Steadfastness" یا "Consistency" اور بنگلہ میں "অবিচলতা" کہتے ہیں۔ بڑی کامیابی وقتی جوش سے نہیں بلکہ روزانہ کی استقامت سے ملتی ہے۔',
      id: 'Kajian Kosakata: "Istiqāmah" (اسْتِقَامَة) berasal dari akar Q-W-M (ق-و-م) yang berarti berdiri tegak dan menempuh jalan lurus tanpa menyimpang. Dalam bahasa Inggris disebut "Steadfastness" atau "Consistency". Keberhasilan besar lahir dari keteguhan harian, bukan semangat sesaat.',
    },
    keyTakeaway: {
      en: 'Istiqāmah = Steadfastness & Consistency = অবিচলতা (Daily discipline beats temporary hype).',
      bn: 'Istiqāmah = Steadfastness = অবিচলতা (ক্ষণিকের আবেগের চেয়ে প্রতিদিনের ধারাবাহিকতা শ্রেষ্ঠ)।',
      ar: 'الاستقامة = Steadfastness = অবিচলতা (الدوام الهادئ يغلب الحماس المؤقت).',
      ur: 'استقامت = Steadfastness = অবিচলতা (روزانہ کا نظم و ضبط وقتی جوش سے بہتر ہے)۔',
      id: 'Istiqāmah = Steadfastness = Keteguhan konsisten setiap hari.',
    },
    quizQuestion: {
      en: 'Which English and Bangla terms best capture the meaning of "Istiqāmah" (اسْتِقَامَة)?',
      bn: '“ইস্তিকামাহ” (اسْتِقَامَة) শব্দের সবচেয়ে সঠিক ইংরেজি ও বাংলা প্রতিশব্দ কোনটি?',
      ar: 'ما المقابل الإنجليزي والبنغالي الدقيق لكلمة «استقامة»؟',
      ur: '"استقامت" (Istiqāmah) کا درست انگریزی اور بنگلہ مترادف کیا ہے؟',
      id: 'Manakah padanan bahasa Inggris yang tepat untuk "Istiqāmah"?',
    },
    quizOptions: {
      en: [
        'Steadfastness & Unwavering Consistency (অবিচলতা / ধারাবাহিকতা)',
        'Temporary Excitement & Impulse (ক্ষণিকের উত্তেজনা)',
        'Carelessness & Haste (অসতর্কতা ও তাড়াহুড়ো)',
      ],
      bn: [
        'Steadfastness & Consistency (অবিচলতা ও ধারাবাহিকতা)',
        'Temporary Excitement (ক্ষণিকের উত্তেজনা)',
        'Carelessness & Haste (অসতর্কতা ও তাড়াহুড়ো)',
      ],
      ar: [
        'Steadfastness & Consistency (الثبات والمداومة / অবিচলতা)',
        'Temporary Excitement (الحماس المؤقت)',
        'Haste & Carelessness (العجلة والغفلة)',
      ],
      ur: [
        'Steadfastness & Consistency (ثابت قدمی اور تسلسل / অবিচলতা)',
        'Temporary Excitement (وقتی جوش)',
        'Carelessness (لاپرواہی)',
      ],
      id: [
        'Steadfastness & Unwavering Consistency (Keteguhan & Konsistensi)',
        'Temporary Excitement (Semangat Sesaat)',
        'Carelessness (Kecerobohan)',
      ],
    },
    correctOptionIndex: 0,
    explanation: {
      en: 'Correct! Istiqāmah means Steadfastness & Consistency (অবিচলতা)—staying upright on your path daily.',
      bn: 'সঠিক! ইস্তিকামাহ অর্থ Steadfastness ও অবিচলতা—প্রতিদিন নিজের লক্ষ্যে অটল থাকা।',
      ar: 'صحيح! الاستقامة تعني Steadfastness أي الثبات والمداومة اليومية.',
      ur: 'درست! استقامت کا معنی Steadfastness (ثابت قدمی اور تسلسل) ہے۔',
      id: 'Benar! Istiqāmah berarti Steadfastness & Consistency dalam kebaikan setiap hari.',
    },
  },
  {
    id: 'lang-3',
    track: 'language',
    arabicHeader: 'بَصِيرَة (Basīrah) · Inner Insight · অন্তর্দৃষ্টি',
    transliteration: 'Root: B-S-R (ب ص ر) — Deep perception of the heart vs. surface sight',
    title: {
      en: 'Word Mastery #3 · Basīrah / Inner Insight / অন্তর্দৃষ্টি',
      bn: 'শব্দ শিক্ষা #৩ · Basīrah (বাসীরাহ) / Inner Insight / অন্তর্দৃষ্টি',
      ar: 'إتقان المفردات #٣ · بَصِيرَة / Inner Insight / نور الإدراك',
      ur: 'زبان دانی #3 · بَصِيرَة (بصیرت) / Inner Insight / دل کی بینائی',
      id: 'Penguasaan Kata #3 · Basīrah / Inner Insight / Mata Hati',
    },
    readingText: {
      en: 'Vocabulary Deep-Dive: Arabic distinguishes between "Basar" (بَصَر — physical eyesight that sees colors and screens) and "Basīrah" (بَصِيرَة — inner insight and discernment that sees consequences and truth). In English, we call this "Discernment" or "Foresight." In Bangla, it is "অন্তর্দৃষ্টি" (Ontordrishti) or "প্রজ্ঞাময় দূরদর্শিতা". Physical eyes see a flashy app notification; Basīrah (inner insight) sees that tapping it will steal 40 minutes of your peace.',
      bn: 'শব্দ ও ভাষা পাঠ: আরবি ভাষায় “বাসার” (بَصَر — বাইরের চোখ যা কেবল রঙ ও পর্দা দেখে) এবং “বাসীরাহ” (بَصِيرَة — অন্তর্দৃষ্টি যা কাজের পরিণাম ও সত্য দেখতে পায়)-এর মধ্যে সূক্ষ্ম পার্থক্য রয়েছে। ইংরেজিতে একে বলা হয় “Inner Insight” বা “Discernment”, এবং বাংলায় “অন্তর্দৃষ্টি” বা “দূরদর্শিতা”। বাইরের চোখ ফোনের রঙিন নোটিফিকেশন দেখে প্রলুব্ধ হয়; কিন্তু অন্তর্দৃষ্টি (Basīrah) শুরুতেই দেখতে পায় যে এতে ট্যাপ করলে আপনার ৪০ মিনিটের মানসিক শান্তি নষ্ট হবে।',
      ar: 'دراسة لغوية: يفرق اللسان العربي بين «البَصَر» (رؤية العين للظواهر والألوان) و«البَصِيرَة» (نور القلب الذي يدرك الحقائق والعواقب). وتقابلها في الإنجليزية كلمة (Insight) أو (Discernment)، وفي البنغالية (অন্তর্দৃষ্টি). البصر يرى إغراء التطبيق، أما البصيرة فترى عاقبة ضياع الوقت والقلب.',
      ur: 'لفظی مطالعہ: عربی میں "بَصَر" (ظاہری آنکھ جو رنگ اور اسکرین دیکھتی ہے) اور "بَصِيرَة" (دل کی بصیرت جو انجام اور حقیقت دیکھتی ہے) میں گہرا فرق ہے۔ انگریزی میں اسے "Inner Insight" یا "Discernment" اور بنگلہ میں "অন্তর্দৃষ্টি" کہتے ہیں۔ بصیرت والا انسان کلک کرنے سے پہلے اس کا انجام دیکھ لیتا ہے۔',
      id: 'Kajian Kosakata: Bahasa Arab membedakan antara "Basar" (penglihatan fisik mata) dan "Basīrah" (mata hati / Inner Insight yang melihat hakikat dan dampak jangka panjang). Mata fisik melihat godaan aplikasi; Basīrah melihat bahwa satu ketukan itu akan mencuri ketenanganmu.',
    },
    keyTakeaway: {
      en: 'Basar sees the screen surface; Basīrah (Insight / অন্তর্দৃষ্টি) sees the outcome before you tap.',
      bn: 'বাইরের চোখ কেবল পর্দা দেখে; আর বাসীরাহ (Insight / অন্তর্দৃষ্টি) ট্যাপ করার আগেই পরিণাম দেখে।',
      ar: 'البصر يرى ظاهر الشاشة، والبصيرة (Insight) ترى العاقبة قبل اللمس.',
      ur: 'بصر صرف اسکرین دیکھتی ہے، جبکہ بصیرت (Insight) کلک کرنے سے پہلے انجام دیکھ لیتی ہے۔',
      id: 'Basar melihat layar; Basīrah (Insight) melihat dampak sebelum engkau menyentuhnya.',
    },
    quizQuestion: {
      en: 'What is the difference between "Basar" (بَصَر) and "Basīrah" (بَصِيرَة / Insight / অন্তর্দৃষ্টি)?',
      bn: '“বাসার” (بَصَر) এবং “বাসীরাহ” (بَصِيرَة / Insight / অন্তর্দৃষ্টি)-এর মধ্যে পার্থক্য কী?',
      ar: 'ما الفرق بين «البصر» و«البصيرة» (Insight)؟',
      ur: '"بَصَر" اور "بَصِيرَة" (Insight / অন্তর্দৃষ্টি) میں کیا فرق ہے؟',
      id: 'Apa perbedaan antara "Basar" dan "Basīrah" (Inner Insight)?',
    },
    quizOptions: {
      en: [
        'Basar is physical eyesight; Basīrah is inner insight & discernment that sees deeper truth and consequences',
        'Both words mean watching videos on a smartphone',
        'Basīrah means closing your mind to learning',
      ],
      bn: [
        'বাসার হলো বাইরের দৃষ্টি; আর বাসীরাহ হলো অন্তর্দৃষ্টি ও প্রজ্ঞা যা কাজের গভীর সত্য ও পরিণাম দেখে',
        'দুটি শব্দেরই অর্থ ফোনে ভিডিও দেখা',
        'বাসীরাহ অর্থ নতুন কিছু শেখা বন্ধ করে দেওয়া',
      ],
      ar: [
        'البصر رؤية العين للظواهر، والبصيرة إدراك القلب للحقائق والعواقب (Inner Insight)',
        'الكلمتان تعنيان مشاهدة المقاطع على الهاتف',
        'البصيرة تعني التوقف عن التعلم',
      ],
      ur: [
        'بصر ظاہری نظر ہے، جبکہ بصیرت دل کی وہ بینائی (Insight) ہے جو حقیقت اور انجام کو دیکھتی ہے',
        'دونوں کا مطلب فون پر ویڈیوز دیکھنا ہے',
        'بصیرت کا مطلب سیکھنا چھوڑ دینا ہے',
      ],
      id: [
        'Basar adalah penglihatan fisik; Basīrah adalah mata hati (Insight) yang memahami hakikat dan konsekuensi',
        'Keduanya berarti menonton video di ponsel',
        'Basīrah berarti menutup diri dari ilmu',
      ],
    },
    correctOptionIndex: 0,
    explanation: {
      en: 'Correct! Basīrah (Inner Insight / অন্তর্দৃষ্টি) lets you see the true cost of a distraction before acting.',
      bn: 'সঠিক! বাসীরাহ বা অন্তর্দৃষ্টি আপনাকে যেকোনো প্রলোভনের প্রকৃত পরিণাম আগেভাগেই দেখতে সাহায্য করে।',
      ar: 'صحيح! البصيرة تمنحك القدرة على رؤية حقيقة المشتتات وعاقبتها قبل الوقوع فيها.',
      ur: 'درست! بصیرت آپ کو کسی بھی غفلت کا اصل نقصان پہلے ہی دکھا دیتی ہے۔',
      id: 'Benar! Basīrah membuatmu melihat konsekuensi gangguan sebelum terjebak.',
    },
  },

  // ============================================================================
  // TRACK 3: UNIVERSAL MINDFULNESS, NEUROSCIENCE & DEEP FOCUS
  // ============================================================================
  {
    id: 'mind-1',
    track: 'mindfulness',
    arabicHeader: 'NEUROSCIENCE · Attention Residue & Deep Work',
    transliteration: 'Cognitive Science Principle · Prof. Sophie Leroy & Cal Newport',
    title: {
      en: 'Focus Science #1 · Why "Just a 1-Minute Check" Destroys 25 Minutes',
      bn: 'মনোযোগ বিজ্ঞান #১ · কেন “মাত্র ১ মিনিট ফোন দেখা” আপনার ২৫ মিনিট নষ্ট করে',
      ar: 'علم التركيز #١ · لماذا تدمر «نظرة دقيقة واحدة» ٢٥ دقيقة من عملك',
      ur: 'توجہ کی سائنس #1 · "صرف ایک منٹ فون دیکھنا" 25 منٹ کیسے ضائع کرتا ہے',
      id: 'Sains Fokus #1 · Mengapa "Cek 1 Menit Saja" Merusak 25 Menit Fokus',
    },
    readingText: {
      en: 'Cognitive research on "Attention Residue" shows that when you switch from focused work to check a social feed or message "just for 60 seconds," a large portion of your working memory stays stuck on what you just saw. Even after you put the phone down, your brain takes 15 to 23 minutes to reconstruct its previous depth of concentration. Protecting unbroken blocks of attention is the single highest-leverage skill in the modern economy.',
      bn: 'মনোবিজ্ঞানের “Attention Residue” (মনোযোগের রেশ) গবেষণা দেখায় যে আপনি যখন গভীর কাজের ফাঁকে “মাত্র ৬০ সেকেন্ডের জন্য” সোশ্যাল মিডিয়া বা মেসেজ চেক করেন, তখন ফোন রেখে দেওয়ার পরও আপনার মস্তিষ্কের একটি বড় অংশ সেই ফিডের চিন্তায় আটকে থাকে। পূর্বের গভীর মনোযোগে পুরোপুরি ফিরে যেতে মস্তিষ্কের ১৫ থেকে ২৩ মিনিট সময় লাগে। নিরবচ্ছিন্ন মনোযোগ রক্ষা করাই আধুনিক যুগের সবচেয়ে মূল্যবান দক্ষতা।',
      ar: 'تثبت أبحاث الإدراك حول «بقايا الانتباه» (Attention Residue) أنك حين تقطع عملك العميق لتتفقد تطبيقاً لمدة ستين ثانية فقط، يظل جزء كبير من ذاكرتك العاملة عالقاً بما رأيت، ويحتاج دماغك من ١٥ إلى ٢٣ دقيقة ليستعيد عمق تركيزه السابق.',
      ur: 'ذہنی تحقیق (Attention Residue) بتاتی ہے کہ جب آپ گہرے کام کے دوران "صرف 60 سیکنڈ" کے لیے سوشل میڈیا یا پیغام دیکھتے ہیں تو فون رکھنے کے بعد بھی آپ کے دماغ کا بڑا حصہ اسی میں الجھا رہتا ہے، اور دوبارہ مکمل توجہ بحال کرنے میں 15 سے 23 منٹ لگ جاتے ہیں۔',
      id: 'Riset kognitif tentang "Attention Residue" membuktikan bahwa saat Anda mengalihkan fokus hanya 60 detik untuk mengecek feed sosial, sebagian memori kerja Anda tertinggal di sana. Otak membutuhkan 15 hingga 23 menit untuk kembali ke kedalaman fokus semula.',
    },
    keyTakeaway: {
      en: 'A 60-second distraction costs ~20 minutes of cognitive recovery (Attention Residue).',
      bn: '৬০ সেকেন্ডের একটি বিক্ষিপ্ততা মস্তিষ্কের প্রায় ২০ মিনিটের গভীর মনোযোগ কেড়ে নেয়।',
      ar: 'تشتت لمدة ٦٠ ثانية يكلف الدماغ قرابة ٢٠ دقيقة لاستعادة التركيز العميق.',
      ur: '60 سیکنڈ کی بے جا توجہ دماغ کے تقریباً 20 منٹ کی گہری یکسوئی چھین لیتی ہے۔',
      id: 'Gangguan 60 detik membutuhkan ~20 menit pemulihan fokus kognitif.',
    },
    quizQuestion: {
      en: 'What is "Attention Residue" when you briefly check a distracting app during work or study?',
      bn: 'কাজ বা পড়াশোনার মাঝে অল্প সময়ের জন্য বিনা কারণে অ্যাপ চেক করলে “Attention Residue” কী ঘটায়?',
      ar: 'ما المقصود بـ «بقايا الانتباه» (Attention Residue) عند تفقد تطبيق مشتت أثناء العمل؟',
      ur: 'کام یا پڑھائی کے دوران مختصر وقت کے لیے ایپ دیکھنے سے "Attention Residue" کیا اثر ڈالتا ہے؟',
      id: 'Apa dampak "Attention Residue" saat mengecek aplikasi pengganggu di tengah kerja?',
    },
    quizOptions: {
      en: [
        'Your brain stays partially stuck on the app and takes 15–23 minutes to regain full deep focus',
        'Your phone battery charges faster',
        'You immediately become twice as productive',
      ],
      bn: [
        'ফোন রাখার পরও মস্তিষ্ক সেই অ্যাপের চিন্তায় আটকে থাকে এবং পূর্ণ মনোযোগে ফিরতে ১৫–২৩ মিনিট সময় লাগে',
        'ফোনের ব্যাটারি দ্রুত চার্জ হয়',
        'আপনার কাজের গতি সাথে সাথে দ্বিগুণ হয়ে যায়',
      ],
      ar: [
        'يظل جزء من ذهنك عالقاً بالتطبيق ويحتاج ١٥–٢٣ دقيقة لاستعادة التركيز العميق',
        'يشحن الهاتف بسرعة أكبر',
        'تتضاعف إنتاجيتك فوراً',
      ],
      ur: [
        'دماغ کا ایک حصہ اسی ایپ میں الجھا رہتا ہے اور مکمل توجہ کی واپسی میں 15 تا 23 منٹ لگتے ہیں',
        'فون کی بیٹری تیز چارج ہوتی ہے',
        'کام کی رفتار فوراً دگنی ہو جاتی ہے',
      ],
      id: [
        'Pikiran tetap tertinggal sebagian di aplikasi itu dan butuh 15–23 menit untuk fokus penuh kembali',
        'Baterai ponsel mengisi lebih cepat',
        'Produktivitas langsung naik dua kali lipat',
      ],
    },
    correctOptionIndex: 0,
    explanation: {
      en: 'Correct! Guarding unbroken focus blocks prevents Attention Residue from fragmenting your mind.',
      bn: 'সঠিক! নিরবচ্ছিন্ন মনোযোগ রক্ষা করলে মস্তিষ্ক বিক্ষিপ্ত হওয়া থেকে বেঁচে যায়।',
      ar: 'صحيح! حماية فترات العمل المتواصل تمنع تشتت الذاكرة العاملة.',
      ur: 'درست! مسلسل یکسوئی کی حفاظت ذہن کو منتشر ہونے سے بچاتی ہے۔',
      id: 'Benar! Menjaga blok fokus tanpa jeda mencegah pikiran terpecah.',
    },
  },
  {
    id: 'mind-2',
    track: 'mindfulness',
    arabicHeader: 'NEUROPLASTICITY · The 90-Second Craving Wave',
    transliteration: 'Harvard Neuroanatomy Insight · Dr. Jill Bolte Taylor',
    title: {
      en: 'Focus Science #2 · The 90-Second Chemical Lifespan of an Urge',
      bn: 'মনোযোগ বিজ্ঞান #২ · যেকোনো তীব্র তাড়নার ৯০ সেকেন্ডের রাসায়নিক আয়ু',
      ar: 'علم التركيز #٢ · عمر الموجة الكيميائية للرغبة (٩٠ ثانية)',
      ur: 'توجہ کی سائنس #2 · کسی بھی شدید خواہش کی 90 سیکنڈ کی کیمیائی عمر',
      id: 'Sains Fokus #2 · Siklus Kimiawi 90 Detik dari Sebuah Dorongan',
    },
    readingText: {
      en: 'Neuroscientists have discovered that when a sudden craving or emotional trigger fires in the brain, the chemical surge (adrenaline and dopamine anticipation) takes less than 90 seconds to peak and completely flush out of the bloodstream—provided you do not feed it with new visual stimulation. Every time you pause, breathe, and read for 30–60 seconds without acting on the impulse, you physically weaken that neural pathway and strengthen your prefrontal cortex.',
      bn: 'স্নায়ুবিজ্ঞানীরা আবিষ্কার করেছেন যে মস্তিষ্কে যখন হঠাৎ কোনো তীব্র আসক্তির তাড়না বা উত্তেজনা সৃষ্টি হয়, তখন রক্তে সেই রাসায়নিক ঢেউ (ডোপামিন ও অ্যাড্রেনালিন) সর্বোচ্চ পর্যায়ে পৌঁছে পুরোপুরি মিলিয়ে যেতে ৯০ সেকেন্ডেরও কম সময় নেয়—যদি আপনি নতুন কোনো দৃশ্য দেখে সেটিকে আবার উসকে না দেন। প্রতিবার আপনি যখন তাড়নায় সাড়া না দিয়ে ৩০–৬০ সেকেন্ড শ্বাস নেন ও পাঠ করেন, তখন আপনার মস্তিষ্কের আত্মনিয়ন্ত্রণ কেন্দ্র (Prefrontal Cortex) আরও শক্তিশালী হয়।',
      ar: 'أثبت علماء الأعصاب أن الموجة الكيميائية لأي رغبة ملحة أو انفعال مفاجئ في الدماغ تستغرق أقل من ٩٠ ثانية لتبلغ ذروتها ثم تتلاشى من الدم تماماً—بشرط ألا تغذيها بمثيرات بصرية جديدة. كلما توقفت وتنفست وقرأت لمدة ٣٠–٦٠ ثانية، أضعفت مسار الإدمان وقويت الفص الجبهي المسؤول عن الإرادة.',
      ur: 'نیورو سائنٹسٹس نے دریافت کیا ہے کہ جب دماغ میں اچانک کوئی شدید خواہش یا اشتعال ابھرتا ہے تو اس کی کیمیائی لہر کو عروج پر پہنچ کر خون سے ختم ہونے میں 90 سیکنڈ سے بھی کم وقت لگتا ہے—بشرطیکہ آپ اسے نئی تصاویر دکھا کر دوبارہ نہ بھڑکائیں۔ 30 سے 60 سیکنڈ کا توقف آپ کے قوتِ ارادی کے مرکز کو مضبوط بناتا ہے۔',
      id: 'Para ahli saraf menemukan bahwa lonjakan kimiawi dari dorongan atau godaan mendadak hanya bertahan kurang dari 90 detik di aliran darah sebelum mereda—asalkan Anda tidak memberinya umpan visual baru. Berhenti sejenak selama 30–60 detik memperkuat korteks prefrontal Anda.',
    },
    keyTakeaway: {
      en: 'An unfed urge chemically dissolves within 90 seconds; pausing rewires your brain.',
      bn: 'নতুন খোরাক না দিলে যেকোনো তাড়না ৯০ সেকেন্ডে মিলিয়ে যায়; একটু থামলেই মস্তিষ্ক নতুন শক্তি পায়।',
      ar: 'الرغبة التي لا تغذيها بالنظر تتلاشى كيميائياً خلال ٩٠ ثانية.',
      ur: 'جس خواہش کو نئی خوراک نہ دی جائے وہ 90 سیکنڈ میں تحلیل ہو جاتی ہے۔',
      id: 'Dorongan yang tidak diberi umpan visual akan larut secara kimiawi dalam 90 detik.',
    },
    quizQuestion: {
      en: 'How long does the acute chemical surge of a craving last in the bloodstream if you do not feed it?',
      bn: 'নতুন উত্তেজনা দিয়ে উসকে না দিলে রক্তে একটি তীব্র তাড়নার রাসায়নিক ঢেউ কতক্ষণ স্থায়ী হয়?',
      ar: 'كم تستغرق الموجة الكيميائية للرغبة الملحة في الدم إذا لم تغذها بمثيرات جديدة؟',
      ur: 'اگر آپ خواہش کو نئی تصاویر سے نہ بھڑکائیں تو اس کی کیمیائی لہر کتنی دیر میں ختم ہو جاتی ہے؟',
      id: 'Berapa lama lonjakan kimiawi dorongan bertahan jika tidak diberi umpan baru?',
    },
    quizOptions: {
      en: [
        'Less than 90 seconds before it naturally peaks and subsides',
        '72 continuous hours without stopping',
        'It never goes away unless you open the app',
      ],
      bn: [
        '৯০ সেকেন্ডেরও কম সময়—এরপর তা স্বাভাবিকভাবেই স্তিমিত হয়ে যায়',
        'টানা ৭২ ঘণ্টা',
        'অ্যাপ না খোলা পর্যন্ত কখনোই কমে না',
      ],
      ar: [
        'أقل من ٩٠ ثانية ثم تهدأ وتتلاشى طبيعياً',
        '٧٢ ساعة متواصلة دون توقف',
        'لا تزول أبداً إلا بفتح التطبيق',
      ],
      ur: [
        '90 سیکنڈ سے بھی کم وقت، جس کے بعد وہ قدرتی طور پر مدہم ہو جاتی ہے',
        'مسلسل 72 گھنٹے',
        'ایپ کھولے بغیر کبھی ختم نہیں ہوتی',
      ],
      id: [
        'Kurang dari 90 detik sebelum memuncak dan mereda secara alami',
        '72 jam penuh tanpa henti',
        'Tidak akan hilang kecuali aplikasi dibuka',
      ],
    },
    correctOptionIndex: 0,
    explanation: {
      en: 'Correct! Outlasting the first 30–90 seconds lets the chemical wave pass and rewires your willpower.',
      bn: 'সঠিক! প্রথম ৩০–৯০ সেকেন্ড ধৈর্য ধরলেই রাসায়নিক ঢেউ কেটে যায় এবং ইচ্ছাশক্তি বৃদ্ধি পায়।',
      ar: 'صحيح! الصبر خلال أول ٣٠–٩٠ ثانية يكفي لعبور الموجة الكيميائية بسلام.',
      ur: 'درست! پہلے 30 تا 90 سیکنڈ صبر کر لینے سے کیمیائی لہر گزر جاتی ہے۔',
      id: 'Benar! Bertahan selama 30–90 detik pertama membuat gelombang kimiawi itu berlalu.',
    },
  },
];

export function getLessonsForTrack(track: SlowLearningTrack): SlowLearningLesson[] {
  const filtered = SLOW_LEARNING_CURRICULUM.filter((item) => item.track === track);
  return filtered.length > 0 ? filtered : SLOW_LEARNING_CURRICULUM;
}

/**
 * Returns a compact, easy-to-read 1-2 sentence micro-passage so the user can read
 * and answer the comprehension quiz comfortably within 15–20 seconds.
 */
export function getShortLessonPassage(
  lesson: SlowLearningLesson,
  lang: LanguageCode
): string {
  const full = lesson.readingText[lang] || lesson.readingText.en || '';
  const firstSentenceMatch = full.match(/^[^.!?।؟]+[.!?।؟]?/);
  const firstSentence = firstSentenceMatch ? firstSentenceMatch[0].trim() : full.slice(0, 140);
  if (firstSentence.length <= 165) {
    return firstSentence;
  }
  return firstSentence.slice(0, 160).trim() + '…';
}


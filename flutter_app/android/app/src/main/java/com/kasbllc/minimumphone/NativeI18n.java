package com.kasbllc.minimumphone;

import android.content.Context;
import android.content.SharedPreferences;

import java.util.Locale;

/**
 * 12-Language Native Localization Dictionary for Android OS Fortress Overlay,
 * NativeFortressLockActivity, Camera QR Scanner, PDF QR Sheet, and Watchdog Toasts.
 * Supported languages: en, bn, ar, ur, id, tr, hi, ms, es, fr, de, ru.
 */
public class NativeI18n {

    public static String getLang(Context ctx) {
        try {
            SharedPreferences prefs = ctx.getSharedPreferences(FortressWatchdogService.PREFS_NAME, Context.MODE_PRIVATE);
            String lang = prefs.getString("app_lang", "en");
            if (lang != null && !lang.trim().isEmpty()) {
                return lang.trim().toLowerCase(Locale.ROOT);
            }
        } catch (Exception ignored) {}
        return "en";
    }

    public static boolean isRtl(Context ctx) {
        String lang = getLang(ctx);
        return "ar".equals(lang) || "ur".equals(lang);
    }

    public static String tr(Context ctx, String key) {
        return trLang(getLang(ctx), key);
    }

    public static String trLang(String lang, String key) {
        switch (lang) {
            case "bn":
                return bn(key);
            case "ar":
                return ar(key);
            case "ur":
                return ur(key);
            case "id":
                return id(key);
            case "tr":
                return trk(key);
            case "hi":
                return hi(key);
            case "ms":
                return ms(key);
            case "es":
                return es(key);
            case "fr":
                return fr(key);
            case "de":
                return de(key);
            case "ru":
                return ru(key);
            default:
                return en(key);
        }
    }

    private static String en(String key) {
        switch (key) {
            case "overlayBadge": return "🛡️ MINIMUM PHONE • HARDWARE OVERLAY LOCK";
            case "overlayNightTitle": return "🌙🔒 NIGHT DNS FORTRESS ACTIVE (22:00 – 06:00)";
            case "overlayDayTitle": return "🛡️ SYSTEM SETTINGS & SAFE DNS LOCKED";
            case "overlayNightSub": return "Safe Private DNS & Phone Settings are strictly locked at night. You cannot change DNS or weaken security without scanning your Physical QR Card kept in another room.";
            case "overlayDaySub": return "Phone Settings & Safe Private DNS are protected by Minimum Phone Fortress.";
            case "overlayQrBtn": return "📷 Open QR Verification Gate";
            case "overlayHomeBtn": return "🏠 Return to Minimum Phone Home";
            case "lockTopBadge": return "🛡️ MINIMUM PHONE • NATIVE OS FORTRESS";
            case "lockTitleDnsRemoved": return "SAFE PRIVATE DNS REQUIRED!";
            case "lockTitleNight": return "🌙🔒 NIGHT DNS FORTRESS ACTIVE (22:00–06:00)!";
            case "lockTitleDay": return "🛡️ SYSTEM SETTINGS & SAFE DNS LOCKED!";
            case "lockSubDnsRemoved": return "Safe Private DNS was turned off or modified. Activate Safe Private DNS below to continue.";
            case "lockSubNight": return "At night (22:00–06:00), Phone Settings & Safe Private DNS cannot be accessed or changed without scanning your Physical QR Card with the Camera.";
            case "lockSubDay": return "Phone Settings & Private DNS are strictly protected by Minimum Phone Fortress.";
            case "dnsActiveBanner": return "🔒 OS SAFE PRIVATE DNS ACTIVE & LOCKED: ";
            case "dnsActiveBannerSub": return "\nAdult & Malware Domains Blocked System-Wide";
            case "dnsOffBanner": return "⚠️ OS SAFE PRIVATE DNS IS OFF / REMOVED!\nTap below to copy & activate Safe Private DNS";
            case "restoreDnsBtn": return "🛡️ 1-Tap Activate Safe Private DNS";
            case "step1Wait": return "⏳ STEP 1: WAIT COOLDOWN (";
            case "step1Remaining": return "s REMAINING)";
            case "step1Done": return "✅ STEP 1 COMPLETE: COOLDOWN FINISHED";
            case "step2Math": return "🧠 STEP 2: SOLVE ANTI-IMPULSE MATH:  ";
            case "mathHint": return "Enter math answer...";
            case "step3Night": return "🧱 STEP 3 (CAMERA QR SCAN REQUIRED): SCAN PHYSICAL QR CARD";
            case "step3Day": return "☀️ STEP 3 (DAYTIME 06:00–22:00): QR SCAN OR DAYTIME WORK BYPASS";
            case "scanQrBtn": return "📷 Scan Physical QR Code with Camera";
            case "qrHintNight": return "Camera QR Scan Only (Manual typing disabled at night)";
            case "qrHintDay": return "Scan QR above or enter your backup key...";
            case "unlockBtnNight": return "🔓 Verify Camera QR & Unlock (Steps 1, 2 & 3)";
            case "unlockBtnDay": return "☀️ Daytime Work Bypass: Unlock for 25s (Steps 1 & 2)";
            case "homeBtn": return "🏠 Return to Minimum Phone Home";
            case "errWaitCooldown": return "⚠️ Please wait for Step 1 cooldown to finish: ";
            case "errMathWrong": return "⚠️ Step 2 math answer is incorrect. Solve: ";
            case "errQrRequired": return "⚠️ Physical QR Camera Scan is strictly required at night! Tap 'Scan Physical QR Code with Camera'.";
            case "errQrMismatch": return "⚠️ Scanned QR code does not match your Minimum Phone QR Card!";
            case "msgQrVerified": return "✅ Physical QR Code Scanned & Verified!";
            case "toastUsageActive": return "✅ Usage Access Activated! Returning to Minimum Phone.";
            case "toastOverlayActive": return "✅ Appear on Top Activated! Returning to Minimum Phone.";
            case "toastDnsActiveLocked": return "🛡️ Safe Private DNS Active! Settings Auto-Locked.";
            case "toastNightQrRequired": return "🌙 Night DNS Fortress (22:00–06:00): Scan your Physical QR Card with Camera first!";
            case "toastCopiedDns": return "📋 Copied DNS Host! Tap 'Private DNS' → Paste hostname → Save.";
            case "toastSettingsUnlocked": return "🔓 Settings unlocked briefly (25s).";
            case "toastAppUnlocked": return "🔓 App unlocked via Physical QR! (Phone Settings & DNS remain locked)";
            case "toastGateRequired": return "🔒 Please unlock via the Protection Gate first.";
            case "toastCameraPerm": return "📷 Camera permission is required to scan your Physical QR Card.";
            case "scannerPrompt": return "Scan your Physical Minimum Phone QR Card";
                        case "remBadge": return "⏳ MINDFUL TIME REMINDER";
            case "remTitle": return "10+ Minutes Spent Here";
            case "remSub": return "You opened this browser or social app intentionally, and 10+ minutes have passed. If it is no longer necessary, close it now and protect your focus.";
            case "remStopBtn": return "🏠 Stop Usage & Go Home";
            case "remMore10Btn": return "👍 +10m";
            case "remWork30Btn": return "💼 Working (+30m)";
default: return key;
        }
    }

    private static String bn(String key) {
        switch (key) {
            case "overlayBadge": return "🛡️ মিনিমাম ফোন • হার্ডওয়্যার ওভারলে লক";
            case "overlayNightTitle": return "🌙🔒 নাইট DNS ফোর্ট্রেস চালু (রাত ১০টা – সকাল ৬টা)";
            case "overlayDayTitle": return "🛡️ ফোন সেটিংস ও সেফ প্রাইভেট DNS লক করা আছে";
            case "overlayNightSub": return "রাতের বেলা সেফ প্রাইভেট DNS এবং ফোন সেটিংস কঠোরভাবে লক থাকে। অন্য ঘরে রাখা ফিজিক্যাল QR কার্ড ক্যামেরা দিয়ে স্ক্যান করা ছাড়া DNS বা সেটিংস পরিবর্তন করা সম্পূর্ণ নিষিদ্ধ।";
            case "overlayDaySub": return "ফোন সেটিংস এবং সেফ প্রাইভেট DNS মিনিমাম ফোন ফোর্ট্রেস দ্বারা সুরক্ষিত।";
            case "overlayQrBtn": return "📷 QR ভেরিফিকেশন গেট খুলুন";
            case "overlayHomeBtn": return "🏠 মিনিমাম ফোন হোমে ফিরে যান";
            case "lockTopBadge": return "🛡️ মিনিমাম ফোন • নেটিভ ওএস ফোর্ট্রেস";
            case "lockTitleDnsRemoved": return "সেফ প্রাইভেট DNS চালু করা আবশ্যক!";
            case "lockTitleNight": return "🌙🔒 নাইট DNS ফোর্ট্রেস চালু (রাত ১০টা–সকাল ৬টা)!";
            case "lockTitleDay": return "🛡️ ফোন সেটিংস ও সেফ DNS সুরক্ষিত!";
            case "lockSubDnsRemoved": return "সেফ প্রাইভেট DNS বন্ধ বা পরিবর্তন করা হয়েছে। এগিয়ে যেতে নিচের বাটনে ট্যাপ করে পুনরায় চালু করুন।";
            case "lockSubNight": return "রাতে (১০টা–৬টা) ক্যামেরা দিয়ে ফিজিক্যাল QR কার্ড স্ক্যান করা ছাড়া ফোন সেটিংস বা DNS পরিবর্তন করা যাবে না।";
            case "lockSubDay": return "ফোন সেটিংস ও প্রাইভেট DNS ফোর্ট্রেস লক দ্বারা সুরক্ষিত।";
            case "dnsActiveBanner": return "🔒 সেফ প্রাইভেট DNS চালু ও লক করা আছে: ";
            case "dnsActiveBannerSub": return "\nসকল ব্রাউজার ও অ্যাপে অ্যাডাল্ট সাইট ব্লক করা হয়েছে";
            case "dnsOffBanner": return "⚠️ সেফ প্রাইভেট DNS বন্ধ আছে!\nকপি ও চালু করতে নিচের সবুজ বাটনে ট্যাপ করুন";
            case "restoreDnsBtn": return "🛡️ ১-ট্যাপে সেফ প্রাইভেট DNS চালু করুন";
            case "step1Wait": return "⏳ ধাপ ১: অপেক্ষা করুন (";
            case "step1Remaining": return " সেকেন্ড বাকি)";
            case "step1Done": return "✅ ধাপ ১ সম্পন্ন: অপেক্ষার সময় শেষ হয়েছে";
            case "step2Math": return "🧠 ধাপ ২: অংকটির সঠিক উত্তর দিন:  ";
            case "mathHint": return "উত্তর লিখুন...";
            case "step3Night": return "🧱 ধাপ ৩ (রাতে বাধ্যতামূলক): ফিজিক্যাল QR কার্ড স্ক্যান করুন";
            case "step3Day": return "☀️ ধাপ ৩ (দিনের বেলা সকাল ৬টা–রাত ১০টা): QR স্ক্যান অথবা ডে-টাইম বাইপাস";
            case "scanQrBtn": return "📷 ক্যামেরা দিয়ে ফিজিক্যাল QR কোড স্ক্যান করুন";
            case "qrHintNight": return "শুধুমাত্র ক্যামেরা QR স্ক্যান (রাতে টাইপ করা বন্ধ)";
            case "qrHintDay": return "উপরে QR স্ক্যান করুন অথবা ব্যাকআপ কোড লিখুন...";
            case "unlockBtnNight": return "🔓 ক্যামেরা QR যাচাই ও আনলক করুন (ধাপ ১, ২ ও ৩)";
            case "unlockBtnDay": return "☀️ দিনের বেলা কাজের বাইপাস: ২৫ সেকেন্ডের জন্য আনলক (ধাপ ১ ও ২)";
            case "homeBtn": return "🏠 মিনিমাম ফোন হোমে ফিরে যান (সুরক্ষিত থাকুন)";
            case "errWaitCooldown": return "⚠️ অনুগ্রহ করে ধাপ ১-এর সময় শেষ হওয়া পর্যন্ত অপেক্ষা করুন: ";
            case "errMathWrong": return "⚠️ ধাপ ২-এর অংকের উত্তর সঠিক নয়। সমাধান করুন: ";
            case "errQrRequired": return "⚠️ রাতে ক্যামেরা দিয়ে ফিজিক্যাল QR কার্ড স্ক্যান করা বাধ্যতামূলক!";
            case "errQrMismatch": return "⚠️ স্ক্যান করা QR কোডটি সঠিক নয়! আপনার প্রিন্ট করা মিনিমাম ফোন QR কার্ড স্ক্যান করুন।";
            case "msgQrVerified": return "✅ ফিজিক্যাল QR কোড স্ক্যান ও যাচাই সম্পন্ন হয়েছে!";
            case "toastUsageActive": return "✅ Usage Access চালু হয়েছে! মিনিমাম ফোনে ফিরে যাওয়া হচ্ছে।";
            case "toastOverlayActive": return "✅ ওভারলে পারমিশন চালু হয়েছে! মিনিমাম ফোনে ফিরে যাওয়া হচ্ছে।";
            case "toastDnsActiveLocked": return "🛡️ সেফ প্রাইভেট DNS চালু হয়েছে এবং সেটিংস অটো-লক করা হয়েছে!";
            case "toastNightQrRequired": return "🌙 নাইট লক (১০টা–৬টা): প্রথমে ক্যামেরা দিয়ে আপনার ফিজিক্যাল QR কার্ড স্ক্যান করুন!";
            case "toastCopiedDns": return "📋 DNS অ্যাড্রেস কপি হয়েছে! 'Private DNS'-এ গিয়ে পেস্ট করে Save করুন।";
            case "toastSettingsUnlocked": return "🔓 সেটিংস ২৫ সেকেন্ডের জন্য আনলক করা হয়েছে।";
            case "toastAppUnlocked": return "🔓 QR স্ক্যানের মাধ্যমে অ্যাপ আনলক হয়েছে! (ফোন সেটিংস ও DNS লক থাকবে)";
            case "toastGateRequired": return "🔒 অনুগ্রহ করে প্রথমে প্রোটেকশন গেট আনলক করুন।";
            case "toastCameraPerm": return "📷 QR কোড স্ক্যান করার জন্য ক্যামেরা পারমিশন প্রয়োজন।";
            case "scannerPrompt": return "আপনার প্রিন্ট করা ফিজিক্যাল QR কার্ড স্ক্যান করুন";
                        case "remBadge": return "⏳ সচেতন সময় রিমাইন্ডার";
            case "remTitle": return "১০+ মিনিট অতিবাহিত হয়েছে";
            case "remSub": return "আপনি প্রয়োজনে এই ব্রাউজার বা সোশ্যাল অ্যাপটি খুলেছিলেন এবং ১০ মিনিটের বেশি সময় পার হয়েছে। যদি কাজ শেষ হয়ে থাকে, তবে এখনই বন্ধ করে আপনার মনোযোগ রক্ষা করুন।";
            case "remStopBtn": return "🏠 ব্যবহার থামান ও হোমে ফিরুন";
            case "remMore10Btn": return "👍 +১০ মিনিট";
            case "remWork30Btn": return "💼 কাজ চলছে (+৩০ মি.)";
default: return en(key);
        }
    }

    private static String ar(String key) {
        switch (key) {
            case "overlayBadge": return "🛡️ MINIMUM PHONE • قفل الحماية الفوري";
            case "overlayNightTitle": return "🌙🔒 حصن DNS الليلي نشط (22:00 – 06:00)";
            case "overlayDayTitle": return "🛡️ إعدادات النظام و DNS الآمن مقفلة";
            case "overlayNightSub": return "تم قفل إعدادات الهاتف و DNS الآمن ليلاً بشكل صارم. لا يمكن تغيير DNS أو إضعاف الحماية دون مسح بطاقة QR الورقية بالكاميرا.";
            case "overlayDaySub": return "إعدادات الهاتف و DNS الآمن محمية بواسطة حصن Minimum Phone.";
            case "overlayQrBtn": return "📷 فتح بوابة التحقق عبر رمز QR";
            case "overlayHomeBtn": return "🏠 العودة إلى الشاشة الرئيسية";
            case "lockTopBadge": return "🛡️ MINIMUM PHONE • حصن نظام أندرويد";
            case "lockTitleDnsRemoved": return "مطلوب تفعيل DNS العائلي الآمن!";
            case "lockTitleNight": return "🌙🔒 حصن DNS الليلي نشط (22:00–06:00)!";
            case "lockTitleDay": return "🛡️ إعدادات النظام و DNS الآمن مقفلة!";
            case "lockSubDnsRemoved": return "تم إيقاف أو تغيير DNS الآمن. يرجى تفعيل DNS الآمن أدناه للمتابعة.";
            case "lockSubNight": return "ليلاً (22:00–06:00)، لا يمكن فتح الإعدادات أو تغيير DNS دون مسح بطاقة QR الورقية بالكاميرا.";
            case "lockSubDay": return "إعدادات الهاتف و DNS الخاص محمية بصرامة.";
            case "dnsActiveBanner": return "🔒 DNS العائلي الآمن نشط ومقفل: ";
            case "dnsActiveBannerSub": return "\nتم حظر المواقع الإباحية والضارة في جميع المتصفحات";
            case "dnsOffBanner": return "⚠️ DNS العائلي الآمن متوقف!\nاضغط أدناه لنسخ وتفعيل DNS الآمن فوراً";
            case "restoreDnsBtn": return "🛡️ تفعيل DNS الآمن بضغطة واحدة";
            case "step1Wait": return "⏳ الخطوة 1: انتظر انتهاء المهلة (";
            case "step1Remaining": return " ثانية متبقية)";
            case "step1Done": return "✅ اكتملت الخطوة 1: انتهت مهلة الانتظار";
            case "step2Math": return "🧠 الخطوة 2: حل المسألة الحسابية:  ";
            case "mathHint": return "أدخل النتيجة الحسابية...";
            case "step3Night": return "🧱 الخطوة 3 (إلزامي ليلاً): امسح بطاقة QR الورقية بالكاميرا";
            case "step3Day": return "☀️ الخطوة 3 (نهاراً 06:00–22:00): مسح QR أو التجاوز النهاري للعمل";
            case "scanQrBtn": return "📷 مسح رمز QR الورقي بالكاميرا";
            case "qrHintNight": return "مسح الكاميرا فقط (الكتابة اليدوية معطلة ليلاً)";
            case "qrHintDay": return "امسح رمز QR أعلاه أو أدخل المفتاح الاحتياطي...";
            case "unlockBtnNight": return "🔓 التحقق من رمز QR وفتح القفل (الخطوات 1 و2 و3)";
            case "unlockBtnDay": return "☀️ التجاوز النهاري للعمل: فتح القفل لمدة 25 ثانية";
            case "homeBtn": return "🏠 العودة إلى الشاشة الرئيسية (ابقَ محمياً)";
            case "errWaitCooldown": return "⚠️ يرجى انتظار انتهاء مهلة الخطوة 1: ";
            case "errMathWrong": return "⚠️ إجابة المسألة الحسابية غير صحيحة. حل: ";
            case "errQrRequired": return "⚠️ مسح بطاقة QR الورقية بالكاميرا إلزامي ليلاً!";
            case "errQrMismatch": return "⚠️ رمز QR الممسوح غير مطابق لبطاقة Minimum Phone الخاصة بك!";
            case "msgQrVerified": return "✅ تم مسح رمز QR الورقي والتحقق منه بنجاح!";
            case "toastUsageActive": return "✅ تم تفعيل إذن الاستخدام! جاري العودة.";
            case "toastOverlayActive": return "✅ تم تفعيل إذن الظهور فوق التطبيقات! جاري العودة.";
            case "toastDnsActiveLocked": return "🛡️ تم تفعيل DNS الآمن وقفل الإعدادات تلقائياً!";
            case "toastNightQrRequired": return "🌙 الحصن الليلي (22:00–06:00): امسح بطاقة QR الورقية بالكاميرا أولاً!";
            case "toastCopiedDns": return "📋 تم نسخ عنوان DNS! افتح Private DNS ثم الصق العنوان واحفظه.";
            case "toastSettingsUnlocked": return "🔓 تم فتح الإعدادات مؤقتاً (25 ثانية).";
            case "toastAppUnlocked": return "🔓 تم فتح التطبيق عبر رمز QR! (إعدادات الهاتف و DNS تظل مقفلة)";
            case "toastGateRequired": return "🔒 يرجى فتح بوابة الحماية أولاً.";
            case "toastCameraPerm": return "📷 إذن الكاميرا مطلوب لمسح بطاقة QR الورقية.";
            case "scannerPrompt": return "امسح بطاقة رمز QR الورقية الخاصة بك";
                        case "remBadge": return "⏳ تذكير الوعي بالوقت";
            case "remTitle": return "مرت أكثر من 10 دقائق هنا";
            case "remSub": return "لقد فتحت هذا المتصفح أو التطبيق الاجتماعي لغرض معين ومرت أكثر من 10 دقائق. إذا لم يعد الأمر ضرورياً الآن، أغلقه واحفظ وقتك وتركيزك.";
            case "remStopBtn": return "🏠 إيقاف الاستخدام والعودة للرئيسية";
            case "remMore10Btn": return "👍 +10 دقائق";
            case "remWork30Btn": return "💼 عمل ضروري (+30 د)";
default: return en(key);
        }
    }

    private static String ur(String key) {
        switch (key) {
            case "overlayBadge": return "🛡️ MINIMUM PHONE • ہارڈویئر اوورلے لاک";
            case "overlayNightTitle": return "🌙🔒 نائٹ DNS فورٹریس فعال ہے (22:00 – 06:00)";
            case "overlayDayTitle": return "🛡️ فون سیٹنگز اور محفوظ DNS لاک ہیں";
            case "overlayNightSub": return "رات کے وقت محفوظ DNS اور فون سیٹنگز سختی سے لاک ہیں۔ دوسرے کمرے میں موجود پرنٹ شدہ QR کارڈ کو کیمرے سے اسکین کیے بغیر DNS تبدیل کرنا ناممکن ہے۔";
            case "overlayDaySub": return "فون سیٹنگز اور محفوظ DNS منیمم فون فورٹریس کے ذریعے محفوظ ہیں۔";
            case "overlayQrBtn": return "📷 QR تصدیقی گیٹ کھولیں";
            case "overlayHomeBtn": return "🏠 منیمم فون ہوم پر واپس جائیں";
            case "lockTopBadge": return "🛡️ MINIMUM PHONE • نیٹو او ایس فورٹریس";
            case "lockTitleDnsRemoved": return "محفوظ پرائیویٹ DNS فعال کرنا لازمی ہے!";
            case "lockTitleNight": return "🌙🔒 نائٹ DNS فورٹریس فعال ہے (22:00–06:00)!";
            case "lockTitleDay": return "🛡️ سسٹم سیٹنگز اور محفوظ DNS لاک ہیں!";
            case "lockSubDnsRemoved": return "محفوظ پرائیویٹ DNS بند یا تبدیل کر دیا گیا ہے۔ آگے بڑھنے کے لیے نیچے محفوظ DNS فعال کریں۔";
            case "lockSubNight": return "رات (22:00–06:00) کے وقت کیمرے سے فزیکل QR کارڈ اسکین کیے بغیر فون سیٹنگز یا DNS تبدیل نہیں کیا جا سکتا۔";
            case "lockSubDay": return "فون سیٹنگز اور پرائیویٹ DNS مکمل طور پر محفوظ ہیں۔";
            case "dnsActiveBanner": return "🔒 محفوظ پرائیویٹ DNS فعال اور لاک ہے: ";
            case "dnsActiveBannerSub": return "\nتمام براؤزرز اور ایپس میں فحش اور نقصان دہ سائٹس بلاک ہیں";
            case "dnsOffBanner": return "⚠️ محفوظ پرائیویٹ DNS بند ہے!\nکاپی اور فعال کرنے کے لیے نیچے بٹن دبائیں";
            case "restoreDnsBtn": return "🛡️ 1-ٹیپ میں محفوظ پرائیویٹ DNS فعال کریں";
            case "step1Wait": return "⏳ مرحلہ 1: وقفہ مکمل ہونے کا انتظار کریں (";
            case "step1Remaining": return " سیکنڈ باقی)";
            case "step1Done": return "✅ مرحلہ 1 مکمل: انتظار کا وقت ختم ہو گیا";
            case "step2Math": return "🧠 مرحلہ 2: حساب کا سوال حل کریں:  ";
            case "mathHint": return "جواب درج کریں...";
            case "step3Night": return "🧱 مرحلہ 3 (رات میں لازمی): فزیکل QR کارڈ اسکین کریں";
            case "step3Day": return "☀️ مرحلہ 3 (دن 06:00–22:00): QR اسکین یا دن کا ورک بائی پاس";
            case "scanQrBtn": return "📷 کیمرے سے فزیکل QR کوڈ اسکین کریں";
            case "qrHintNight": return "صرف کیمرہ QR اسکین (رات میں ٹائپنگ بند ہے)";
            case "qrHintDay": return "اوپر QR اسکین کریں یا بیک اپ کوڈ درج کریں...";
            case "unlockBtnNight": return "🔓 کیمرہ QR کی تصدیق کریں اور ان لاک کریں";
            case "unlockBtnDay": return "☀️ دن کا ورک بائی پاس: 25 سیکنڈ کے لیے ان لاک کریں";
            case "homeBtn": return "🏠 منیمم فون ہوم پر واپس جائیں (محفوظ رہیں)";
            case "errWaitCooldown": return "⚠️ براہ کرم مرحلہ 1 کا وقت پورا ہونے کا انتظار کریں: ";
            case "errMathWrong": return "⚠️ مرحلہ 2 کا جواب غلط ہے۔ حل کریں: ";
            case "errQrRequired": return "⚠️ رات کے وقت کیمرے سے فزیکل QR کارڈ اسکین کرنا لازمی ہے!";
            case "errQrMismatch": return "⚠️ اسکین کیا گیا QR کوڈ درست نہیں ہے!";
            case "msgQrVerified": return "✅ فزیکل QR کوڈ اسکین اور تصدیق ہو گیا!";
            case "toastUsageActive": return "✅ Usage Access فعال ہو گیا! واپس جا رہے ہیں۔";
            case "toastOverlayActive": return "✅ اوورلے اجازت فعال ہو گئی! واپس جا رہے ہیں۔";
            case "toastDnsActiveLocked": return "🛡️ محفوظ پرائیویٹ DNS فعال ہو گیا اور سیٹنگز لاک کر دی گئیں!";
            case "toastNightQrRequired": return "🌙 نائٹ لاک (22:00–06:00): پہلے کیمرے سے اپنا فزیکل QR کارڈ اسکین کریں!";
            case "toastCopiedDns": return "📋 DNS ایڈریس کاپی ہو گیا! 'Private DNS' میں پیسٹ کر کے Save کریں۔";
            case "toastSettingsUnlocked": return "🔓 سیٹنگز 25 سیکنڈ کے لیے ان لاک کر دی گئیں۔";
            case "toastAppUnlocked": return "🔓 فزیکل QR کے ذریعے ایپ ان لاک ہو گئی! (سیٹنگز اور DNS لاک رہیں گے)";
            case "toastGateRequired": return "🔒 براہ کرم پہلے پروٹیکشن گیٹ سے ان لاک کریں۔";
            case "toastCameraPerm": return "📷 QR کوڈ اسکین کرنے کے لیے کیمرے کی اجازت ضروری ہے۔";
            case "scannerPrompt": return "اپنا پرنٹ شدہ فزیکل QR کارڈ اسکین کریں";
                        case "remBadge": return "⏳ وقت کی یاد دہانی";
            case "remTitle": return "یہاں 10+ منٹ گزر چکے ہیں";
            case "remSub": return "آپ نے یہ براؤزر یا سوشل ایپ کسی ضرورت سے کھولی تھی اور 10 منٹ سے زیادہ گزر چکے ہیں۔ اگر اب ضرورت نہیں تو اسے بند کریں اور اپنا وقت بچائیں۔";
            case "remStopBtn": return "🏠 استعمال روکیں اور ہوم پر جائیں";
            case "remMore10Btn": return "👍 +10 منٹ";
            case "remWork30Btn": return "💼 ضروری کام (+30 منٹ)";
default: return en(key);
        }
    }

    private static String id(String key) {
        switch (key) {
            case "overlayBadge": return "🛡️ MINIMUM PHONE • KUNCI OVERLAY PERANGKAT KERAS";
            case "overlayNightTitle": return "🌙🔒 BENTENG DNS MALAM AKTIF (22:00 – 06:00)";
            case "overlayDayTitle": return "🛡️ PENGATURAN SISTEM & DNS AMAN TERKUNCI";
            case "overlayNightSub": return "DNS Pribadi Aman & Pengaturan Ponsel dikunci ketat di malam hari. Anda tidak dapat mengubah DNS tanpa memindai Kartu QR Fisik di ruangan lain.";
            case "overlayDaySub": return "Pengaturan Ponsel & DNS Pribadi Aman dilindungi oleh Benteng Minimum Phone.";
            case "overlayQrBtn": return "📷 Buka Gerbang Verifikasi QR";
            case "overlayHomeBtn": return "🏠 Kembali ke Beranda Minimum Phone";
            case "lockTopBadge": return "🛡️ MINIMUM PHONE • BENTENG OS ANDROID";
            case "lockTitleDnsRemoved": return "DNS PRIBADI AMAN DIPERLUKAN!";
            case "lockTitleNight": return "🌙🔒 BENTENG DNS MALAM AKTIF (22:00–06:00)!";
            case "lockTitleDay": return "🛡️ PENGATURAN SISTEM & DNS AMAN TERKUNCI!";
            case "lockSubDnsRemoved": return "DNS Pribadi Aman dimatikan atau diubah. Aktifkan DNS Pribadi Aman di bawah untuk melanjutkan.";
            case "lockSubNight": return "Pada malam hari (22:00–06:00), Pengaturan Ponsel & DNS tidak dapat diubah tanpa memindai Kartu QR Fisik dengan Kamera.";
            case "lockSubDay": return "Pengaturan Ponsel & DNS Pribadi dilindungi secara ketat.";
            case "dnsActiveBanner": return "🔒 DNS PRIBADI AMAN AKTIF & TERKUNCI: ";
            case "dnsActiveBannerSub": return "\nSitus Dewasa & Berbahaya Diblokir di Seluruh Sistem";
            case "dnsOffBanner": return "⚠️ DNS PRIBADI AMAN NONAKTIF!\nKetuk di bawah untuk menyalin & mengaktifkan DNS Aman";
            case "restoreDnsBtn": return "🛡️ 1-Ketuk Aktifkan DNS Pribadi Aman";
            case "step1Wait": return "⏳ LANGKAH 1: TUNGGU JEDA (";
            case "step1Remaining": return " dtk TERSISA)";
            case "step1Done": return "✅ LANGKAH 1 SELESAI: WAKTU JEDA BERAKHIR";
            case "step2Math": return "🧠 LANGKAH 2: SELESAIKAN HITUNGAN:  ";
            case "mathHint": return "Masukkan jawaban...";
            case "step3Night": return "🧱 LANGKAH 3 (WAJIB SCAN QR KAMERA): PINDAI KARTU QR FISIK";
            case "step3Day": return "☀️ LANGKAH 3 (SIANG 06:00–22:00): PINDAI QR ATAU BYPASS KERJA SIANG";
            case "scanQrBtn": return "📷 Pindai Kode QR Fisik dengan Kamera";
            case "qrHintNight": return "Khusus Pindai Kamera QR (Ketik manual dinonaktifkan malam hari)";
            case "qrHintDay": return "Pindai QR di atas atau masukkan kunci cadangan...";
            case "unlockBtnNight": return "🔓 Verifikasi QR Kamera & Buka Kunci (Langkah 1, 2 & 3)";
            case "unlockBtnDay": return "☀️ Bypass Kerja Siang: Buka 25 dtk (Langkah 1 & 2)";
            case "homeBtn": return "🏠 Kembali ke Beranda Minimum Phone";
            case "errWaitCooldown": return "⚠️ Harap tunggu jeda Langkah 1 selesai: ";
            case "errMathWrong": return "⚠️ Jawaban hitungan Langkah 2 salah. Hitung: ";
            case "errQrRequired": return "⚠️ Pemindaian Kamera QR Fisik wajib di malam hari!";
            case "errQrMismatch": return "⚠️ Kode QR yang dipindai tidak cocok dengan Kartu QR Minimum Phone Anda!";
            case "msgQrVerified": return "✅ Kode QR Fisik Berhasil Dipindai & Diverifikasi!";
            case "toastUsageActive": return "✅ Akses Penggunaan Aktif! Kembali ke Minimum Phone.";
            case "toastOverlayActive": return "✅ Izin Tampil di Atas Aktif! Kembali ke Minimum Phone.";
            case "toastDnsActiveLocked": return "🛡️ DNS Pribadi Aman Aktif! Pengaturan Dikunci Otomatis.";
            case "toastNightQrRequired": return "🌙 Benteng Malam (22:00–06:00): Pindai Kartu QR Fisik dengan Kamera terlebih dahulu!";
            case "toastCopiedDns": return "📋 Host DNS Disalin! Ketuk 'DNS Pribadi' → Tempel → Simpan.";
            case "toastSettingsUnlocked": return "🔓 Pengaturan dibuka sementara (25 detik).";
            case "toastAppUnlocked": return "🔓 Aplikasi dibuka via QR Fisik! (Pengaturan & DNS tetap terkunci)";
            case "toastGateRequired": return "🔒 Harap buka kunci melalui Gerbang Proteksi terlebih dahulu.";
            case "toastCameraPerm": return "📷 Izin kamera diperlukan untuk memindai Kartu QR Fisik.";
            case "scannerPrompt": return "Pindai Kartu QR Fisik Minimum Phone Anda";
                        case "remBadge": return "⏳ PENGINGAT WAKTU SADAR";
            case "remTitle": return "10+ Menit Berlalu di Aplikasi Ini";
            case "remSub": return "Anda membuka peramban atau aplikasi sosial ini dengan sengaja, dan 10+ menit telah berlalu. Jika sudah tidak diperlukan, tutup sekarang dan jaga fokus Anda.";
            case "remStopBtn": return "🏠 Berhenti & Kembali ke Beranda";
            case "remMore10Btn": return "👍 +10 mnt";
            case "remWork30Btn": return "💼 Sedang Kerja (+30 mnt)";
default: return en(key);
        }
    }

    private static String trk(String key) {
        switch (key) {
            case "overlayBadge": return "🛡️ MINIMUM PHONE • DONANIM EKRAN KİLİDİ";
            case "overlayNightTitle": return "🌙🔒 GECE DNS KALESİ AKTİF (22:00 – 06:00)";
            case "overlayDayTitle": return "🛡️ SİSTEM AYARLARI VE GÜVENLİ DNS KİLİTLİ";
            case "overlayNightSub": return "Güvenli Özel DNS ve Telefon Ayarları gece boyunca sıkı bir şekilde kilitlidir. Başka odadaki Fiziksel QR Kartınızı kamerayla okutmadan DNS değiştirilemez.";
            case "overlayDaySub": return "Telefon Ayarları ve Güvenli Özel DNS, Minimum Phone Kalesi tarafından korunmaktadır.";
            case "overlayQrBtn": return "📷 QR Doğrulama Kapısını Aç";
            case "overlayHomeBtn": return "🏠 Minimum Phone Ana Ekranına Dön";
            case "lockTopBadge": return "🛡️ MINIMUM PHONE • YEREL İŞLETİM SİSTEMİ KALESİ";
            case "lockTitleDnsRemoved": return "GÜVENLİ ÖZEL DNS GEREKLİ!";
            case "lockTitleNight": return "🌙🔒 GECE DNS KALESİ AKTİF (22:00–06:00)!";
            case "lockTitleDay": return "🛡️ SİSTEM AYARLARI VE GÜVENLİ DNS KİLİTLİ!";
            case "lockSubDnsRemoved": return "Güvenli Özel DNS kapatıldı veya değiştirildi. Devam etmek için aşağıdan etkinleştirin.";
            case "lockSubNight": return "Gece (22:00–06:00) saatlerinde Fiziksel QR Kartınızı kamerayla okutmadan Telefon Ayarlarına veya DNS'e erişilemez.";
            case "lockSubDay": return "Telefon Ayarları ve Özel DNS sıkı bir şekilde korunmaktadır.";
            case "dnsActiveBanner": return "🔒 GÜVENLİ ÖZEL DNS AKTİF VE KİLİTLİ: ";
            case "dnsActiveBannerSub": return "\nYetişkin ve Zararlı Siteler Sistem Genelinde Engellendi";
            case "dnsOffBanner": return "⚠️ GÜVENLİ ÖZEL DNS KAPALI!\nKopyalayıp etkinleştirmek için aşağıya dokunun";
            case "restoreDnsBtn": return "🛡️ Tek Dokunuşla Güvenli Özel DNS'i Etkinleştir";
            case "step1Wait": return "⏳ ADIM 1: BEKLEME SÜRESİ (";
            case "step1Remaining": return " sn KALDI)";
            case "step1Done": return "✅ ADIM 1 TAMAMLANDI: BEKLEME SÜRESİ BİTTİ";
            case "step2Math": return "🧠 ADIM 2: İŞLEMİ ÇÖZÜN:  ";
            case "mathHint": return "Sonucu girin...";
            case "step3Night": return "🧱 ADIM 3 (KAMERA QR ZORUNLU): FİZİKSEL QR KARTI OKUTUN";
            case "step3Day": return "☀️ ADIM 3 (GÜNDÜZ 06:00–22:00): QR OKUT VEYA GÜNDÜZ GEÇİŞİ";
            case "scanQrBtn": return "📷 Kamerayla Fiziksel QR Kodu Okut";
            case "qrHintNight": return "Yalnızca Kamera QR Okutma (Gece elle giriş kapalıdır)";
            case "qrHintDay": return "Yukarıdan QR okutun veya yedek anahtarı girin...";
            case "unlockBtnNight": return "🔓 Kamera QR Doğrula ve Kilidi Aç (Adım 1, 2 ve 3)";
            case "unlockBtnDay": return "☀️ Gündüz Çalışma Geçişi: 25 sn Kilidi Aç (Adım 1 ve 2)";
            case "homeBtn": return "🏠 Minimum Phone Ana Ekranına Dön";
            case "errWaitCooldown": return "⚠️ Lütfen Adım 1 bekleme süresinin bitmesini bekleyin: ";
            case "errMathWrong": return "⚠️ Adım 2 matematik cevabı yanlış. İşlem: ";
            case "errQrRequired": return "⚠️ Gece saatlerinde Fiziksel QR Kartı kamerayla okutmak zorunludur!";
            case "errQrMismatch": return "⚠️ Okutulan QR kodu Minimum Phone QR Kartınızla eşleşmiyor!";
            case "msgQrVerified": return "✅ Fiziksel QR Kodu Okutuldu ve Doğrulandı!";
            case "toastUsageActive": return "✅ Kullanım Erişimi Etkinleştirildi! Ana ekrana dönülüyor.";
            case "toastOverlayActive": return "✅ Üstte Gösterme İzni Etkinleştirildi! Ana ekrana dönülüyor.";
            case "toastDnsActiveLocked": return "🛡️ Güvenli Özel DNS Aktif! Ayarlar Otomatik Kilitlendi.";
            case "toastNightQrRequired": return "🌙 Gece Kalesi (22:00–06:00): Önce Fiziksel QR Kartınızı kamerayla okutun!";
            case "toastCopiedDns": return "📋 DNS Kopyalandı! 'Özel DNS' → Yapıştır → Kaydet.";
            case "toastSettingsUnlocked": return "🔓 Ayarların kilidi geçici olarak (25 sn) açıldı.";
            case "toastAppUnlocked": return "🔓 Uygulama Fiziksel QR ile açıldı! (Ayarlar ve DNS kilitli kalır)";
            case "toastGateRequired": return "🔒 Lütfen önce Koruma Kapısından kilidi açın.";
            case "toastCameraPerm": return "📷 Fiziksel QR Kartını okutmak için kamera izni gereklidir.";
            case "scannerPrompt": return "Fiziksel Minimum Phone QR Kartınızı Okutun";
                        case "remBadge": return "⏳ BİLİNÇLİ ZAMAN HATIRLATICISI";
            case "remTitle": return "Burada 10+ Dakika Geçti";
            case "remSub": return "Bu tarayıcıyı veya sosyal uygulamayı bilerek açtınız ve 10 dakikadan fazla zaman geçti. Artık gerekli değilse şimdi kapatıp odağınızı koruyun.";
            case "remStopBtn": return "🏠 Kullanımı Durdur ve Ana Ekrana Dön";
            case "remMore10Btn": return "👍 +10 dk";
            case "remWork30Btn": return "💼 Çalışıyorum (+30 dk)";
default: return en(key);
        }
    }

    private static String hi(String key) {
        switch (key) {
            case "overlayBadge": return "🛡️ MINIMUM PHONE • हार्डवेयर ओवरले लॉक";
            case "overlayNightTitle": return "🌙🔒 नाइट DNS फ़ोर्ट्रेस सक्रिय (22:00 – 06:00)";
            case "overlayDayTitle": return "🛡️ सिस्टम सेटिंग्स और सुरक्षित DNS लॉक हैं";
            case "overlayNightSub": return "रात के समय सुरक्षित प्राइवेट DNS और फ़ोन सेटिंग्स पूरी तरह लॉक रहती हैं। दूसरे कमरे में रखे फ़िज़िकल QR कार्ड को कैमरे से स्कैन किए बिना DNS नहीं बदला जा सकता।";
            case "overlayDaySub": return "फ़ोन सेटिंग्स और सुरक्षित प्राइवेट DNS मिनिमम फ़ोन फ़ोर्ट्रेस द्वारा सुरक्षित हैं।";
            case "overlayQrBtn": return "📷 QR सत्यापन गेट खोलें";
            case "overlayHomeBtn": return "🏠 मिनिमम फ़ोन होम पर लौटें";
            case "lockTopBadge": return "🛡️ MINIMUM PHONE • नेटिव ओएस फ़ोर्ट्रेस";
            case "lockTitleDnsRemoved": return "सुरक्षित प्राइवेट DNS आवश्यक है!";
            case "lockTitleNight": return "🌙🔒 नाइट DNS फ़ोर्ट्रेस सक्रिय (22:00–06:00)!";
            case "lockTitleDay": return "🛡️ सिस्टम सेटिंग्स और सुरक्षित DNS लॉक हैं!";
            case "lockSubDnsRemoved": return "सुरक्षित प्राइवेट DNS बंद या बदल दिया गया है। आगे बढ़ने के लिए नीचे सुरक्षित DNS सक्रिय करें।";
            case "lockSubNight": return "रात (22:00–06:00) में कैमरे से फ़िज़िकल QR कार्ड स्कैन किए बिना फ़ोन सेटिंग्स या DNS नहीं बदला जा सकता।";
            case "lockSubDay": return "फ़ोन सेटिंग्स और प्राइवेट DNS पूरी तरह सुरक्षित हैं।";
            case "dnsActiveBanner": return "🔒 सुरक्षित प्राइवेट DNS सक्रिय और लॉक है: ";
            case "dnsActiveBannerSub": return "\nसभी ब्राउज़र और ऐप्स में अश्लील व हानिकारक साइटें ब्लॉक हैं";
            case "dnsOffBanner": return "⚠️ सुरक्षित प्राइवेट DNS बंद है!\nकॉपी और सक्रिय करने के लिए नीचे टैप करें";
            case "restoreDnsBtn": return "🛡️ 1-टैप में सुरक्षित प्राइवेट DNS सक्रिय करें";
            case "step1Wait": return "⏳ चरण 1: प्रतीक्षा समय (";
            case "step1Remaining": return " सेकंड शेष)";
            case "step1Done": return "✅ चरण 1 पूर्ण: प्रतीक्षा समय समाप्त";
            case "step2Math": return "🧠 चरण 2: गणित का प्रश्न हल करें:  ";
            case "mathHint": return "उत्तर लिखें...";
            case "step3Night": return "🧱 चरण 3 (रात में कैमरा QR अनिवार्य): फ़िज़िकल QR कार्ड स्कैन करें";
            case "step3Day": return "☀️ चरण 3 (दिन 06:00–22:00): QR स्कैन या दिन का कार्य बाईपास";
            case "scanQrBtn": return "📷 कैमरे से फ़िज़िकल QR कोड स्कैन करें";
            case "qrHintNight": return "केवल कैमरा QR स्कैन (रात में टाइपिंग बंद है)";
            case "qrHintDay": return "ऊपर QR स्कैन करें या बैकअप कुंजी दर्ज करें...";
            case "unlockBtnNight": return "🔓 कैमरा QR सत्यापित करें और अनलॉक करें (चरण 1, 2 व 3)";
            case "unlockBtnDay": return "☀️ दिन का बाईपास: 25 सेकंड के लिए अनलॉक करें (चरण 1 व 2)";
            case "homeBtn": return "🏠 मिनिमम फ़ोन होम पर लौटें (सुरक्षित रहें)";
            case "errWaitCooldown": return "⚠️ कृपया चरण 1 का समय पूरा होने की प्रतीक्षा करें: ";
            case "errMathWrong": return "⚠️ चरण 2 का उत्तर ग़लत है। हल करें: ";
            case "errQrRequired": return "⚠️ रात में कैमरे से फ़िज़िकल QR कार्ड स्कैन करना अनिवार्य है!";
            case "errQrMismatch": return "⚠️ स्कैन किया गया QR कोड आपके मिनिमम फ़ोन QR कार्ड से मेल नहीं खाता!";
            case "msgQrVerified": return "✅ फ़िज़िकल QR कोड स्कैन और सत्यापित हो गया!";
            case "toastUsageActive": return "✅ उपयोग पहुँच सक्रिय! मिनिमम फ़ोन पर लौट रहे हैं।";
            case "toastOverlayActive": return "✅ ओवरले अनुमति सक्रिय! मिनिमम फ़ोन पर लौट रहे हैं।";
            case "toastDnsActiveLocked": return "🛡️ सुरक्षित प्राइवेट DNS सक्रिय और सेटिंग्स ऑटो-लॉक!";
            case "toastNightQrRequired": return "🌙 नाइट लॉक (22:00–06:00): पहले कैमरे से अपना फ़िज़िकल QR कार्ड स्कैन करें!";
            case "toastCopiedDns": return "📋 DNS कॉपी हो गया! 'Private DNS' में पेस्ट करें और Save दबाएँ।";
            case "toastSettingsUnlocked": return "🔓 सेटिंग्स 25 सेकंड के लिए अनलॉक की गईं।";
            case "toastAppUnlocked": return "🔓 फ़िज़िकल QR से ऐप अनलॉक हो गया! (सेटिंग्स और DNS लॉक रहेंगे)";
            case "toastGateRequired": return "🔒 कृपया पहले सुरक्षा गेट से अनलॉक करें।";
            case "toastCameraPerm": return "📷 QR कोड स्कैन करने के लिए कैमरा अनुमति आवश्यक है।";
            case "scannerPrompt": return "अपना प्रिंट किया हुआ फ़िज़िकल QR कार्ड स्कैन करें";
                        case "remBadge": return "⏳ सचेत समय अनुस्मारक";
            case "remTitle": return "यहाँ 10+ मिनट बीत चुके हैं";
            case "remSub": return "आपने यह ब्राउज़र या सोशल ऐप किसी काम से खोला था और 10 मिनट से अधिक बीत चुके हैं। यदि अब यह आवश्यक नहीं है, तो इसे बंद करें और अपना फ़ोकस बचाएँ।";
            case "remStopBtn": return "🏠 उपयोग रोकें और होम पर लौटें";
            case "remMore10Btn": return "👍 +10 मि.";
            case "remWork30Btn": return "💼 ज़रूरी काम (+30 मि.)";
default: return en(key);
        }
    }

    private static String ms(String key) {
        switch (key) {
            case "overlayBadge": return "🛡️ MINIMUM PHONE • KUNCI TINDIHAN PERKAKASAN";
            case "overlayNightTitle": return "🌙🔒 KUBU DNS MALAM AKTIF (22:00 – 06:00)";
            case "overlayDayTitle": return "🛡️ TETAPAN SISTEM & DNS SELAMAT DIKUNCI";
            case "overlayNightSub": return "DNS Peribadi Selamat & Tetapan Telefon dikunci rapat pada waktu malam. Anda tidak boleh menukar DNS tanpa mengimbas Kad QR Fizikal di bilik lain.";
            case "overlayDaySub": return "Tetapan Telefon & DNS Peribadi Selamat dilindungi oleh Kubu Minimum Phone.";
            case "overlayQrBtn": return "📷 Buka Pintu Pengesahan QR";
            case "overlayHomeBtn": return "🏠 Kembali ke Laman Utama Minimum Phone";
            case "lockTopBadge": return "🛡️ MINIMUM PHONE • KUBU OS ANDROID";
            case "lockTitleDnsRemoved": return "DNS PERIBADI SELAMAT DIPERLUKAN!";
            case "lockTitleNight": return "🌙🔒 KUBU DNS MALAM AKTIF (22:00–06:00)!";
            case "lockTitleDay": return "🛡️ TETAPAN SISTEM & DNS SELAMAT DIKUNCI!";
            case "lockSubDnsRemoved": return "DNS Peribadi Selamat telah dimatikan atau diubah. Aktifkan di bawah untuk meneruskan.";
            case "lockSubNight": return "Pada waktu malam (22:00–06:00), Tetapan Telefon & DNS tidak boleh diakses tanpa mengimbas Kad QR Fizikal dengan Kamera.";
            case "lockSubDay": return "Tetapan Telefon & DNS Peribadi dilindungi sepenuhnya.";
            case "dnsActiveBanner": return "🔒 DNS PERIBADI SELAMAT AKTIF & DIKUNCI: ";
            case "dnsActiveBannerSub": return "\nLaman Dewasa & Perisian Hasad Disekat Seluruh Sistem";
            case "dnsOffBanner": return "⚠️ DNS PERIBADI SELAMAT DIMATIKAN!\nKetik di bawah untuk menyalin & mengaktifkan DNS Selamat";
            case "restoreDnsBtn": return "🛡️ 1-Ketik Aktifkan DNS Peribadi Selamat";
            case "step1Wait": return "⏳ LANGKAH 1: TUNGGU MASA BERTENANG (";
            case "step1Remaining": return "s BAKI)";
            case "step1Done": return "✅ LANGKAH 1 SELESAI: MASA BERTENANG TAMAT";
            case "step2Math": return "🧠 LANGKAH 2: SELESAIKAN KIRAAN:  ";
            case "mathHint": return "Masukkan jawapan...";
            case "step3Night": return "🧱 LANGKAH 3 (IMBASAN QR KAMERA WAJIB): IMBAS KAD QR FIZIKAL";
            case "step3Day": return "☀️ LANGKAH 3 (SIANG 06:00–22:00): IMBAS QR ATAU PINTASAN KERJA SIANG";
            case "scanQrBtn": return "📷 Imbas Kod QR Fizikal dengan Kamera";
            case "qrHintNight": return "Imbasan Kamera QR Sahaja (Taip manual dimatikan pada waktu malam)";
            case "qrHintDay": return "Imbas QR di atas atau masukkan kunci sandaran...";
            case "unlockBtnNight": return "🔓 Sahkan QR Kamera & Buka Kunci (Langkah 1, 2 & 3)";
            case "unlockBtnDay": return "☀️ Pintasan Kerja Siang: Buka 25s (Langkah 1 & 2)";
            case "homeBtn": return "🏠 Kembali ke Laman Utama Minimum Phone";
            case "errWaitCooldown": return "⚠️ Sila tunggu masa bertenang Langkah 1 tamat: ";
            case "errMathWrong": return "⚠️ Jawapan kiraan Langkah 2 salah. Selesaikan: ";
            case "errQrRequired": return "⚠️ Imbasan Kamera QR Fizikal diwajibkan pada waktu malam!";
            case "errQrMismatch": return "⚠️ Kod QR yang diimbas tidak sepadan dengan Kad QR Minimum Phone anda!";
            case "msgQrVerified": return "✅ Kod QR Fizikal Berjaya Diimbas & Disahkan!";
            case "toastUsageActive": return "✅ Akses Penggunaan Diaktifkan! Kembali ke Minimum Phone.";
            case "toastOverlayActive": return "✅ Kebenaran Tindihan Diaktifkan! Kembali ke Minimum Phone.";
            case "toastDnsActiveLocked": return "🛡️ DNS Peribadi Selamat Aktif! Tetapan Dikunci Automatik.";
            case "toastNightQrRequired": return "🌙 Kubu Malam (22:00–06:00): Imbas Kad QR Fizikal anda dengan Kamera dahulu!";
            case "toastCopiedDns": return "📋 Hos DNS Disalin! Ketik 'Private DNS' → Tampal → Simpan.";
            case "toastSettingsUnlocked": return "🔓 Tetapan dibuka sementara (25 saat).";
            case "toastAppUnlocked": return "🔓 Aplikasi dibuka melalui QR Fizikal! (Tetapan & DNS kekal terkunci)";
            case "toastGateRequired": return "🔒 Sila buka kunci melalui Pintu Perlindungan dahulu.";
            case "toastCameraPerm": return "📷 Kebenaran kamera diperlukan untuk mengimbas Kad QR Fizikal.";
            case "scannerPrompt": return "Imbas Kad QR Fizikal Minimum Phone Anda";
                        case "remBadge": return "⏳ PERINGATAN MASA SEDAR";
            case "remTitle": return "10+ Minit Berlalu di Sini";
            case "remSub": return "Anda membuka pelayar atau aplikasi sosial ini dengan tujuan tertentu, dan 10+ minit telah berlalu. Jika tidak lagi perlu, tutup sekarang dan lindungi fokus anda.";
            case "remStopBtn": return "🏠 Berhenti & Kembali ke Utama";
            case "remMore10Btn": return "👍 +10 min";
            case "remWork30Btn": return "💼 Bekerja (+30 min)";
default: return en(key);
        }
    }

    private static String es(String key) {
        switch (key) {
            case "overlayBadge": return "🛡️ MINIMUM PHONE • BLOQUEO DE HARDWARE";
            case "overlayNightTitle": return "🌙🔒 FORTALEZA DNS NOCTURNA ACTIVA (22:00 – 06:00)";
            case "overlayDayTitle": return "🛡️ AJUSTES DEL SISTEMA Y DNS SEGURO BLOQUEADOS";
            case "overlayNightSub": return "El DNS Privado Seguro y los Ajustes están estrictamente bloqueados por la noche. No puedes cambiar el DNS sin escanear tu Tarjeta QR Física en otra habitación.";
            case "overlayDaySub": return "Los Ajustes del Teléfono y el DNS Privado Seguro están protegidos por Minimum Phone.";
            case "overlayQrBtn": return "📷 Abrir Puerta de Verificación QR";
            case "overlayHomeBtn": return "🏠 Volver al Inicio de Minimum Phone";
            case "lockTopBadge": return "🛡️ MINIMUM PHONE • FORTALEZA DEL SISTEMA";
            case "lockTitleDnsRemoved": return "¡SE REQUIERE DNS PRIVADO SEGURO!";
            case "lockTitleNight": return "🌙🔒 ¡FORTALEZA DNS NOCTURNA ACTIVA (22:00–06:00)!";
            case "lockTitleDay": return "🛡️ ¡AJUSTES DEL SISTEMA Y DNS BLOQUEADOS!";
            case "lockSubDnsRemoved": return "El DNS Privado Seguro fue desactivado o modificado. Actívalo abajo para continuar.";
            case "lockSubNight": return "Por la noche (22:00–06:00), no se puede acceder a los Ajustes ni cambiar el DNS sin escanear tu Tarjeta QR Física con la cámara.";
            case "lockSubDay": return "Los Ajustes del Teléfono y el DNS Privado están protegidos.";
            case "dnsActiveBanner": return "🔒 DNS PRIVADO SEGURO ACTIVO Y BLOQUEADO: ";
            case "dnsActiveBannerSub": return "\nSitios para Adultos y Malware Bloqueados en Todo el Sistema";
            case "dnsOffBanner": return "⚠️ ¡EL DNS PRIVADO SEGURO ESTÁ DESACTIVADO!\nToca abajo para copiar y activar el DNS Seguro";
            case "restoreDnsBtn": return "🛡️ Activar DNS Privado Seguro en 1 Toque";
            case "step1Wait": return "⏳ PASO 1: ESPERA DE ENFRIAMIENTO (";
            case "step1Remaining": return "s RESTANTES)";
            case "step1Done": return "✅ PASO 1 COMPLETADO: ESPERA TERMINADA";
            case "step2Math": return "🧠 PASO 2: RESUELVE EL CÁLCULO ANTI-IMPULSO:  ";
            case "mathHint": return "Escribe el resultado...";
            case "step3Night": return "🧱 PASO 3 (ESCANEO QR OBLIGATORIO): ESCANEA LA TARJETA QR FÍSICA";
            case "step3Day": return "☀️ PASO 3 (DÍA 06:00–22:00): ESCANEO QR O ACCESO DIURNO DE TRABAJO";
            case "scanQrBtn": return "📷 Escanear Código QR Físico con la Cámara";
            case "qrHintNight": return "Solo escaneo QR con cámara (escritura manual desactivada de noche)";
            case "qrHintDay": return "Escanea el QR arriba o ingresa tu clave de respaldo...";
            case "unlockBtnNight": return "🔓 Verificar QR y Desbloquear (Pasos 1, 2 y 3)";
            case "unlockBtnDay": return "☀️ Acceso Diurno: Desbloquear por 25s (Pasos 1 y 2)";
            case "homeBtn": return "🏠 Volver al Inicio de Minimum Phone";
            case "errWaitCooldown": return "⚠️ Espera a que termine el tiempo del Paso 1: ";
            case "errMathWrong": return "⚠️ La respuesta matemática del Paso 2 es incorrecta. Resuelve: ";
            case "errQrRequired": return "⚠️ ¡El escaneo de la Tarjeta QR Física con cámara es obligatorio por la noche!";
            case "errQrMismatch": return "⚠️ ¡El código QR escaneado no coincide con tu Tarjeta QR de Minimum Phone!";
            case "msgQrVerified": return "✅ ¡Código QR Físico Escaneado y Verificado!";
            case "toastUsageActive": return "✅ ¡Acceso de Uso Activado! Volviendo a Minimum Phone.";
            case "toastOverlayActive": return "✅ ¡Permiso de Superposición Activado! Volviendo a Minimum Phone.";
            case "toastDnsActiveLocked": return "🛡️ ¡DNS Privado Seguro Activo! Ajustes Bloqueados Automáticamente.";
            case "toastNightQrRequired": return "🌙 Fortaleza Nocturna (22:00–06:00): ¡Escanea primero tu Tarjeta QR Física con la cámara!";
            case "toastCopiedDns": return "📋 ¡DNS copiado! Toca 'DNS privado' → Pegar → Guardar.";
            case "toastSettingsUnlocked": return "🔓 Ajustes desbloqueados temporalmente (25s).";
            case "toastAppUnlocked": return "🔓 ¡Aplicación desbloqueada vía QR Físico! (Ajustes y DNS siguen bloqueados)";
            case "toastGateRequired": return "🔒 Primero desbloquea la Puerta de Protección.";
            case "toastCameraPerm": return "📷 Se requiere permiso de cámara para escanear la Tarjeta QR.";
            case "scannerPrompt": return "Escanea tu Tarjeta QR Física de Minimum Phone";
                        case "remBadge": return "⏳ RECORDATORIO DE TIEMPO CONSCIENTE";
            case "remTitle": return "Más de 10 Minutos en Esta App";
            case "remSub": return "Abriste este navegador o red social intencionalmente y ya pasaron más de 10 minutos. Si ya no es estrictamente necesario, ciérralo y protege tu enfoque.";
            case "remStopBtn": return "🏠 Detener Uso y Volver al Inicio";
            case "remMore10Btn": return "👍 +10 min";
            case "remWork30Btn": return "💼 Trabajando (+30 min)";
default: return en(key);
        }
    }

    private static String fr(String key) {
        switch (key) {
            case "overlayBadge": return "🛡️ MINIMUM PHONE • VERROUILLAGE MATÉRIEL";
            case "overlayNightTitle": return "🌙🔒 FORTERESSE DNS DE NUIT ACTIVE (22:00 – 06:00)";
            case "overlayDayTitle": return "🛡️ PARAMÈTRES SYSTÈME ET DNS SÉCURISÉ VERROUILLÉS";
            case "overlayNightSub": return "Le DNS Privé Sécurisé et les Paramètres sont strictement verrouillés la nuit. Impossible de modifier le DNS sans scanner votre Carte QR Physique située dans une autre pièce.";
            case "overlayDaySub": return "Les Paramètres et le DNS Privé Sécurisé sont protégés par la Forteresse Minimum Phone.";
            case "overlayQrBtn": return "📷 Ouvrir le Portail de Vérification QR";
            case "overlayHomeBtn": return "🏠 Retour à l'Accueil Minimum Phone";
            case "lockTopBadge": return "🛡️ MINIMUM PHONE • FORTERESSE SYSTÈME ANDROID";
            case "lockTitleDnsRemoved": return "DNS PRIVÉ SÉCURISÉ REQUIS !";
            case "lockTitleNight": return "🌙🔒 FORTERESSE DNS DE NUIT ACTIVE (22:00–06:00) !";
            case "lockTitleDay": return "🛡️ PARAMÈTRES SYSTÈME ET DNS VERROUILLÉS !";
            case "lockSubDnsRemoved": return "Le DNS Privé Sécurisé a été désactivé ou modifié. Activez-le ci-dessous pour continuer.";
            case "lockSubNight": return "La nuit (22:00–06:00), impossible d'accéder aux Paramètres ou de modifier le DNS sans scanner votre Carte QR Physique avec la caméra.";
            case "lockSubDay": return "Les Paramètres du Téléphone et le DNS Privé sont strictement protégés.";
            case "dnsActiveBanner": return "🔒 DNS PRIVÉ SÉCURISÉ ACTIF ET VERROUILLÉ : ";
            case "dnsActiveBannerSub": return "\nSites pour Adultes et Malveillants Bloqués sur Tout le Système";
            case "dnsOffBanner": return "⚠️ LE DNS PRIVÉ SÉCURISÉ EST DÉSACTIVÉ !\nAppuyez ci-dessous pour copier et activer le DNS Sécurisé";
            case "restoreDnsBtn": return "🛡️ Activer le DNS Privé Sécurisé en 1 Touche";
            case "step1Wait": return "⏳ ÉTAPE 1 : TEMPS DE RÉFLEXION (";
            case "step1Remaining": return "s RESTANTES)";
            case "step1Done": return "✅ ÉTAPE 1 TERMINÉE : ATTENTE COMPLÉTÉE";
            case "step2Math": return "🧠 ÉTAPE 2 : RÉSOLVEZ LE CALCUL ANTI-IMPULSION :  ";
            case "mathHint": return "Entrez la réponse...";
            case "step3Night": return "🧱 ÉTAPE 3 (SCAN QR CAMÉRA OBLIGATOIRE) : SCANNEZ LA CARTE QR PHYSIQUE";
            case "step3Day": return "☀️ ÉTAPE 3 (JOUR 06:00–22:00) : SCAN QR OU ACCÈS DE TRAVAIL DIURNE";
            case "scanQrBtn": return "📷 Scanner le Code QR Physique avec la Caméra";
            case "qrHintNight": return "Scan QR Caméra uniquement (saisie manuelle désactivée la nuit)";
            case "qrHintDay": return "Scannez le QR ci-dessus ou entrez votre clé de secours...";
            case "unlockBtnNight": return "🔓 Vérifier le QR et Déverrouiller (Étapes 1, 2 et 3)";
            case "unlockBtnDay": return "☀️ Accès Diurne : Déverrouiller pour 25s (Étapes 1 et 2)";
            case "homeBtn": return "🏠 Retour à l'Accueil Minimum Phone";
            case "errWaitCooldown": return "⚠️ Veuillez attendre la fin du délai de l'Étape 1 : ";
            case "errMathWrong": return "⚠️ La réponse mathématique de l'Étape 2 est incorrecte. Calculez : ";
            case "errQrRequired": return "⚠️ Le scan de la Carte QR Physique avec la caméra est obligatoire la nuit !";
            case "errQrMismatch": return "⚠️ Le code QR scanné ne correspond pas à votre Carte QR Minimum Phone !";
            case "msgQrVerified": return "✅ Code QR Physique Scanné et Vérifié !";
            case "toastUsageActive": return "✅ Accès aux Données d'Utilisation Activé ! Retour à Minimum Phone.";
            case "toastOverlayActive": return "✅ Superposition d'Écran Activée ! Retour à Minimum Phone.";
            case "toastDnsActiveLocked": return "🛡️ DNS Privé Sécurisé Actif ! Paramètres Verrouillés Automatiquement.";
            case "toastNightQrRequired": return "🌙 Forteresse de Nuit (22:00–06:00) : Scannez d'abord votre Carte QR Physique !";
            case "toastCopiedDns": return "📋 DNS copié ! Appuyez sur 'DNS privé' → Coller → Enregistrer.";
            case "toastSettingsUnlocked": return "🔓 Paramètres déverrouillés temporairement (25s).";
            case "toastAppUnlocked": return "🔓 Application déverrouillée via QR Physique ! (Paramètres et DNS restent verrouillés)";
            case "toastGateRequired": return "🔒 Veuillez d'abord déverrouiller le Portail de Protection.";
            case "toastCameraPerm": return "📷 L'autorisation de la caméra est requise pour scanner la Carte QR.";
            case "scannerPrompt": return "Scannez votre Carte QR Physique Minimum Phone";
                        case "remBadge": return "⏳ RAPPEL DE TEMPS CONSCIENT";
            case "remTitle": return "Plus de 10 Minutes Passées Ici";
            case "remSub": return "Vous avez ouvert ce navigateur ou réseau social intentionnellement et plus de 10 minutes se sont écoulées. Si ce n'est plus nécessaire, fermez-le et gardez votre concentration.";
            case "remStopBtn": return "🏠 Arrêter et Retourner à l'Accueil";
            case "remMore10Btn": return "👍 +10 min";
            case "remWork30Btn": return "💼 Travail (+30 min)";
default: return en(key);
        }
    }

    private static String de(String key) {
        switch (key) {
            case "overlayBadge": return "🛡️ MINIMUM PHONE • HARDWARE-OVERLAY-SPERRE";
            case "overlayNightTitle": return "🌙🔒 NACHT-DNS-FESTUNG AKTIV (22:00 – 06:00)";
            case "overlayDayTitle": return "🛡️ SYSTEMEINSTELLUNGEN & SICHERES DNS GESPERRT";
            case "overlayNightSub": return "Sicheres Privates DNS und Telefoneinstellungen sind nachts strikt gesperrt. Sie können das DNS nicht ohne Kamera-Scan Ihrer physischen QR-Karte in einem anderen Raum ändern.";
            case "overlayDaySub": return "Telefoneinstellungen und Sicheres Privates DNS werden durch Minimum Phone geschützt.";
            case "overlayQrBtn": return "📷 QR-Verifizierungstor Öffnen";
            case "overlayHomeBtn": return "🏠 Zurück zum Minimum Phone Startbildschirm";
            case "lockTopBadge": return "🛡️ MINIMUM PHONE • NATIVE ANDROID-FESTUNG";
            case "lockTitleDnsRemoved": return "SICHERES PRIVATES DNS ERFORDERLICH!";
            case "lockTitleNight": return "🌙🔒 NACHT-DNS-FESTUNG AKTIV (22:00–06:00)!";
            case "lockTitleDay": return "🛡️ SYSTEMEINSTELLUNGEN & DNS GESPERRT!";
            case "lockSubDnsRemoved": return "Sicheres Privates DNS wurde deaktiviert oder geändert. Aktivieren Sie es unten, um fortzufahren.";
            case "lockSubNight": return "Nachts (22:00–06:00) können Einstellungen und DNS nicht ohne Kamera-Scan Ihrer physischen QR-Karte geändert werden.";
            case "lockSubDay": return "Telefoneinstellungen und Privates DNS sind streng geschützt.";
            case "dnsActiveBanner": return "🔒 SICHERES PRIVATES DNS AKTIV & GESPERRT: ";
            case "dnsActiveBannerSub": return "\nJugendgefährdende & Schädliche Seiten Systemweit Blockiert";
            case "dnsOffBanner": return "⚠️ SICHERES PRIVATES DNS IST AUS!\nUnten tippen, um Sicheres DNS zu kopieren & zu aktivieren";
            case "restoreDnsBtn": return "🛡️ Sicheres Privates DNS mit 1 Tippen Aktivieren";
            case "step1Wait": return "⏳ SCHRITT 1: ABKÜHLZEIT ABWARTEN (";
            case "step1Remaining": return "s VERBLEIBEND)";
            case "step1Done": return "✅ SCHRITT 1 ABGESCHLOSSEN: WARTEZEIT BEENDET";
            case "step2Math": return "🧠 SCHRITT 2: RECHENAUFGABE LÖSEN:  ";
            case "mathHint": return "Ergebnis eingeben...";
            case "step3Night": return "🧱 SCHRITT 3 (KAMERA-QR-SCAN PFLICHT): PHYSISCHE QR-KARTE SCANNEN";
            case "step3Day": return "☀️ SCHRITT 3 (TAG 06:00–22:00): QR-SCAN ODER TAGES-FREIGABE";
            case "scanQrBtn": return "📷 Physischen QR-Code mit Kamera Scannen";
            case "qrHintNight": return "Nur Kamera-QR-Scan (Manuelle Eingabe nachts deaktiviert)";
            case "qrHintDay": return "QR oben scannen oder Ersatzschlüssel eingeben...";
            case "unlockBtnNight": return "🔓 Kamera-QR Bestätigen & Entsperren (Schritte 1, 2 & 3)";
            case "unlockBtnDay": return "☀️ Tages-Freigabe: Für 25s Entsperren (Schritte 1 & 2)";
            case "homeBtn": return "🏠 Zurück zum Minimum Phone Startbildschirm";
            case "errWaitCooldown": return "⚠️ Bitte warten Sie Schritt 1 ab: ";
            case "errMathWrong": return "⚠️ Rechenergebnis in Schritt 2 ist falsch. Lösen Sie: ";
            case "errQrRequired": return "⚠️ Kamera-Scan der physischen QR-Karte ist nachts zwingend erforderlich!";
            case "errQrMismatch": return "⚠️ Der gescannte QR-Code stimmt nicht mit Ihrer Minimum Phone QR-Karte überein!";
            case "msgQrVerified": return "✅ Physischer QR-Code Gescannt & Bestätigt!";
            case "toastUsageActive": return "✅ Nutzungszugriff Aktiviert! Rückkehr zu Minimum Phone.";
            case "toastOverlayActive": return "✅ Überlagerungsberechtigung Aktiviert! Rückkehr zu Minimum Phone.";
            case "toastDnsActiveLocked": return "🛡️ Sicheres Privates DNS Aktiv! Einstellungen Automatisch Gesperrt.";
            case "toastNightQrRequired": return "🌙 Nacht-Festung (22:00–06:00): Bitte zuerst physische QR-Karte mit der Kamera scannen!";
            case "toastCopiedDns": return "📋 DNS kopiert! 'Privates DNS' tippen → Einfügen → Speichern.";
            case "toastSettingsUnlocked": return "🔓 Einstellungen kurzzeitig (25s) entsperrt.";
            case "toastAppUnlocked": return "🔓 App per QR-Code entsperrt! (Einstellungen & DNS bleiben gesperrt)";
            case "toastGateRequired": return "🔒 Bitte zuerst über das Schutztor entsperren.";
            case "toastCameraPerm": return "📷 Kameraberechtigung ist zum Scannen der QR-Karte erforderlich.";
            case "scannerPrompt": return "Scannen Sie Ihre physische Minimum Phone QR-Karte";
                        case "remBadge": return "⏳ ACHTSAME ZEITERINNERUNG";
            case "remTitle": return "Über 10 Minuten Hier Verbracht";
            case "remSub": return "Sie haben diesen Browser oder diese soziale App bewusst geöffnet, und über 10 Minuten sind vergangen. Wenn es nicht mehr nötig ist, schließen Sie sie jetzt.";
            case "remStopBtn": return "🏠 Nutzung Beenden & zum Startbildschirm";
            case "remMore10Btn": return "👍 +10 Min.";
            case "remWork30Btn": return "💼 Arbeit (+30 Min.)";
default: return en(key);
        }
    }

    private static String ru(String key) {
        switch (key) {
            case "overlayBadge": return "🛡️ MINIMUM PHONE • АППАРАТНАЯ БЛОКИРОВКА ЭКРАНА";
            case "overlayNightTitle": return "🌙🔒 НОЧНАЯ КРЕПОСТЬ DNS АКТИВНА (22:00 – 06:00)";
            case "overlayDayTitle": return "🛡️ НАСТРОЙКИ СИСТЕМЫ И БЕЗОПАСНЫЙ DNS ЗАЩИЩЕНЫ";
            case "overlayNightSub": return "Безопасный Персональный DNS и Настройки телефона строго заблокированы ночью. Изменить DNS невозможно без сканирования физической QR-карты в другой комнате.";
            case "overlayDaySub": return "Настройки телефона и Безопасный Персональный DNS защищены крепостью Minimum Phone.";
            case "overlayQrBtn": return "📷 Открыть Ворота Проверки QR";
            case "overlayHomeBtn": return "🏠 Вернуться на Главный Экран Minimum Phone";
            case "lockTopBadge": return "🛡️ MINIMUM PHONE • ЗАЩИТА СИСТЕМЫ ANDROID";
            case "lockTitleDnsRemoved": return "ТРЕБУЕТСЯ БЕЗОПАСНЫЙ ПЕРСОНАЛЬНЫЙ DNS!";
            case "lockTitleNight": return "🌙🔒 НОЧНАЯ КРЕПОСТЬ DNS АКТИВНА (22:00–06:00)!";
            case "lockTitleDay": return "🛡️ НАСТРОЙКИ СИСТЕМЫ И DNS ЗАБЛОКИРОВАНЫ!";
            case "lockSubDnsRemoved": return "Безопасный Персональный DNS был отключён или изменён. Включите его ниже для продолжения.";
            case "lockSubNight": return "Ночью (22:00–06:00) доступ к Настройкам и изменение DNS невозможны без сканирования физической QR-карты камерой.";
            case "lockSubDay": return "Настройки телефона и Персональный DNS строго защищены.";
            case "dnsActiveBanner": return "🔒 БЕЗОПАСНЫЙ ПЕРСОНАЛЬНЫЙ DNS АКТИВЕН И ЗАЩИЩЁН: ";
            case "dnsActiveBannerSub": return "\nСайты 18+ и Вредоносные Домены Заблокированы во Всей Системе";
            case "dnsOffBanner": return "⚠️ БЕЗОПАСНЫЙ ПЕРСОНАЛЬНЫЙ DNS ОТКЛЮЧЁН!\nНажмите ниже, чтобы скопировать и включить Безопасный DNS";
            case "restoreDnsBtn": return "🛡️ Включить Безопасный Персональный DNS в 1 Касание";
            case "step1Wait": return "⏳ ШАГ 1: ОЖИДАНИЕ ПАУЗЫ (ОСТАЛОСЬ ";
            case "step1Remaining": return " с)";
            case "step1Done": return "✅ ШАГ 1 ЗАВЕРШЁН: ВРЕМЯ ОЖИДАНИЯ ИСТЕКЛО";
            case "step2Math": return "🧠 ШАГ 2: РЕШИТЕ ПРИМЕР ДЛЯ САМОКОНТРОЛЯ:  ";
            case "mathHint": return "Введите ответ...";
            case "step3Night": return "🧱 ШАГ 3 (ОБЯЗАТЕЛЬНОЕ СКАНИРОВАНИЕ QR): ОТСКАНИРУЙТЕ ФИЗИЧЕСКУЮ QR-КАРТУ";
            case "step3Day": return "☀️ ШАГ 3 (ДЕНЬ 06:00–22:00): СКАН QR ИЛИ ДНЕВНОЙ РАБОЧИЙ ДОСТУП";
            case "scanQrBtn": return "📷 Сканировать Физический QR-Код Камерой";
            case "qrHintNight": return "Только сканирование камерой (ручной ввод отключён ночью)";
            case "qrHintDay": return "Отсканируйте QR выше или введите резервный ключ...";
            case "unlockBtnNight": return "🔓 Проверить QR и Разблокировать (Шаги 1, 2 и 3)";
            case "unlockBtnDay": return "☀️ Дневной Доступ: Разблокировать на 25 с (Шаги 1 и 2)";
            case "homeBtn": return "🏠 Вернуться на Главный Экран Minimum Phone";
            case "errWaitCooldown": return "⚠️ Пожалуйста, дождитесь завершения Шага 1: ";
            case "errMathWrong": return "⚠️ Неверный ответ в Шаге 2. Решите: ";
            case "errQrRequired": return "⚠️ Ночью обязательно сканирование физической QR-карты камерой!";
            case "errQrMismatch": return "⚠️ Отсканированный QR-код не совпадает с вашей картой Minimum Phone!";
            case "msgQrVerified": return "✅ Физический QR-Код Отсканирован и Подтверждён!";
            case "toastUsageActive": return "✅ Доступ к Статистике Включён! Возврат в Minimum Phone.";
            case "toastOverlayActive": return "✅ Разрешение Поверх Окон Включено! Возврат в Minimum Phone.";
            case "toastDnsActiveLocked": return "🛡️ Безопасный Персональный DNS Активен! Настройки Заблокированы.";
            case "toastNightQrRequired": return "🌙 Ночная Крепость (22:00–06:00): Сначала отсканируйте физическую QR-карту камерой!";
            case "toastCopiedDns": return "📋 DNS скопирован! Откройте «Персональный DNS» → Вставьте → Сохраните.";
            case "toastSettingsUnlocked": return "🔓 Настройки временно разблокированы (25 с).";
            case "toastAppUnlocked": return "🔓 Приложение разблокировано по QR! (Настройки и DNS остаются под защитой)";
            case "toastGateRequired": return "🔒 Сначала пройдите Ворота Защиты.";
            case "toastCameraPerm": return "📷 Для сканирования QR-карты требуется разрешение камеры.";
            case "scannerPrompt": return "Отсканируйте вашу физическую QR-карту Minimum Phone";
                        case "remBadge": return "⏳ ОСОЗНАННОЕ НАПОМИНАНИЕ О ВРЕМЕНИ";
            case "remTitle": return "Прошло Более 10 Минут";
            case "remSub": return "Вы открыли этот браузер или соцсеть осознанно, и прошло уже более 10 минут. Если в этом больше нет необходимости, закройте приложение и сохраните фокус.";
            case "remStopBtn": return "🏠 Завершить и Вернуться Домой";
            case "remMore10Btn": return "👍 +10 мин";
            case "remWork30Btn": return "💼 По работе (+30 мин)";
default: return en(key);
        }
    }
}

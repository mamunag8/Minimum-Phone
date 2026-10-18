# Google Play Console Submission Kit — Minimum Phone (`com.kasbllc.minimumphone`)
**Target Console Account:** `https://play.google.com/console/u/0/developers/7754238292766407606/app-list`
**Developer:** kasb LLC

---

## Step 1: Create App in Google Play Console
1. Open [Google Play Console App List](https://play.google.com/console/u/0/developers/7754238292766407606/app-list) and click **Create app**.
2. Fill in the initial fields:
   - **App name:** `Minimum Phone: Detox & Focus` *(28/30 characters)*
   - **Default language:** `English (United States) – en-US` *(You can also add `Bengali (Bangladesh) – bn-BD` right after)*
   - **App or game:** `App`
   - **Free or paid:** `Free`
   - **Declarations:** Check both **Developer Program Policies** and **US export laws**, then click **Create app**.

---

## Step 2: Main Store Listing Copy (Copy & Paste)

### App Name (Max 30 chars)
```text
Minimum Phone: Detox & Focus
```

### Short Description (Max 80 chars — 78 chars)
```text
100% Free minimalist launcher, mindful app blocker, calm wisdom & focus timer.
```

### Full Description (Max 4000 chars)
```text
Reclaim your time, focus, and peace of mind with Minimum Phone — the 100% free, ad-free minimalist launcher and digital detox utility built by kasb LLC.

While other digital wellbeing apps lock essential features behind $30–$60/year subscriptions or $50 hardware dongles, Minimum Phone gives you the complete premium suite completely free, with zero ads and zero internet tracking.

✦ 1. THE ANTI-DOPAMINE HOME SCREEN
• Total Icon Elimination: A clean, monochromatic, text-only home screen displaying up to 5 essential apps.
• Context-Aware Profiles: Switch effortlessly between Work, Personal, and Evening Sunset app lists.
• Zero-App Mind Dump Scratchpad: Capture quick thoughts and to-dos right on the home screen without opening distracting apps.
• System Grayscale & E-Ink Themes: Choose pure OLED black, E-Ink paper, or Sunset amber modes.

✦ 2. INTENTIONAL FRICTION & CALM MIND TRIGGERS
• The Inhale Screen: Opening a restricted app triggers a 5-to-15-second breathing pause that breaks subconscious muscle memory.
• Peace of Mind Wisdom ("Small, Strong Line Only"): Center your heart during impulse moments with selectable short verses from the Quran (Sakīnah), authentic Hadith, or timeless Calm Mind Proverbs.
• Micro-Intent Bidding: Declare why you are opening an app and bid your time (1m, 3m, 5m, or 15m) with a gentle 60-second wrap-up reminder.
• 4 Habit-Wall Gatekeepers: Require completing a mindful transcription, a 25-word reflection journal, reading 3 pages of a document, or walking 20 steps before unlocking distracting apps.

✦ 3. PURITY GUARD & 90-DAY NEURO-RESET TRACKER
• Live Clean Streak Tracker: Track days, hours, and minutes toward your 90-day dopamine baseline reset.
• 1-Tap Urge SOS: Instant 60-second emergency breathing and grounding protocol when urges strike.
• Multi-Layer Content Shield: System Adult DNS (1.1.1.3 Family) guide, browser keyword guard, and 11 PM Night Guard.
• Discreet Mode: Toggle neutral "Neuro-Reset & Clarity Shield" labels for complete privacy in public.

✦ 4. NOTIFICATION DIGEST, MONK MODE & FREE QR BRICK LOCK
• Twice-Daily Notification Digest: Batch non-urgent notifications into peaceful 12:00 PM and 6:00 PM summaries while allowing VIP contacts and "URGENT" messages to break through immediately.
• Monk Mode Deep Work Timer: Transform your home screen into a single-task countdown timer (25m / 50m / 90m).
• Free Physical QR / NFC Anchor Lock: Print your personal QR anchor card and place it in another room—require scanning that physical QR code to exit Deep Work or Sleep Vault early.

✦ 5. MULTILINGUAL & 100% OFFLINE PRIVACY
• Instant Language Switcher: Full support for English, বাংলা (Bangla), العربية (Arabic), اردو (Urdu), and Bahasa Indonesia.
• Zero Internet Permission: Minimum Phone does not request Android INTERNET permission. 100% of your screen-time stats, notes, and streaks remain strictly on your device.

Built by kasb LLC — Empowering deep focus and inner peace.
```

---

## Step 3: Bangla (`bn-BD`) Localized Store Listing (Optional Boost)
- **App Name (`bn-BD`):** `Minimum Phone: ফোকাস ও প্রশান্তি`
- **Short Description (`bn-BD`):** `১০০% ফ্রি মিনিমালিস্ট লঞ্চার, স্ক্রিন-টাইম ব্লকার, কুরআন/হাদিস বাণী ও ফোকাস অ্যাপ`

---

## Step 4: App Content & Policy Declarations (Exact Answers)

1. **Privacy Policy:**
   - Host [`play-store-submission/PRIVACY_POLICY.html`](file:///d:/Kasb%20llc/dev/Apps/Minimum%20Phone/play-store-submission/PRIVACY_POLICY.html) on your kasb LLC domain (e.g., `https://kasb.com/minimum-phone-privacy`) and paste the URL.
2. **App Access:**
   - Select: **"All functionality in my app is available without any access restrictions."**
3. **Ads:**
   - Select: **"No, my app does not contain ads."**
4. **Content Rating (IARC Questionnaire):**
   - Category: **Utility, Productivity, Communication, or Other**
   - Violence / Sexuality / Profanity / Controlled Substances / User-Generated Content / Data Sharing / Location Sharing: Select **No** to all. (Result: **Everyone / PEGI 3**).
5. **Target Audience and Content:**
   - Target age groups: Select **13–15, 16–17, 18 and over** (Do NOT select under 13 so you don't need Google Play Families policy review).
6. **Data Safety Form:**
   - *Does your app collect or share any of the required user data types?* $\rightarrow$ **No** (Since the app has zero `android.permission.INTERNET` permission and stores all data locally on-device).
7. **Government Apps / Financial Features / Health Apps:**
   - Select **No / None** (under Health, if asked, select *"Digital wellbeing / screen time management (non-medical)"*).

---

## Step 5: Release Artifact & Signing Key Credentials
- **Upload Bundle (`.aab`):** `d:\Kasb llc\dev\Apps\Minimum Phone\play-store-submission\MinimumPhone-v1.0.0-release.aab`
- **Installable APK (`.apk`):** `d:\Kasb llc\dev\Apps\Minimum Phone\play-store-submission\MinimumPhone-v1.0.0-release.apk`
- **Keystore File:** `d:\Kasb llc\dev\Apps\Minimum Phone\android\app\minimum-phone-upload-key.jks`
  - **Keystore Password:** `KasbMinimum2026!`
  - **Key Alias:** `minimumphone`
  - **Key Password:** `KasbMinimum2026!`

# Minimum Phone — The Anti-Dopamine Launcher & Calm Mind OS

> **100% Free · Zero Ads · Zero Internet Telemetry · Android (Google Play Store) & iOS (Apple App Store)**  
> Built by **kasb LLC** (`com.kasbllc.minimumphone`)

**Minimum Phone** is a minimalist, ad-free Android launcher and iOS digital wellness utility designed to strip away visual dopamine triggers, inject intentional friction into addictive phone habits, and restore peace of mind (*Sakīnah* / stillness).

While competitor apps lock essential detox features behind $30–$60/year paywalls or $50+ physical hardware dongles, **Minimum Phone** provides the complete premium suite **100% free**.

---

## ✨ Core Features

### 🎨 1. Anti-Dopamine Minimalist Home Screen & App Drawer
- **Total Icon Elimination:** A completely monochromatic, text-only home screen listing up to 5 essential apps.
- **Context-Aware Profiles:** Switch automatically or manually between **Work**, **Personal**, and **Evening Digital Sunset** app slots.
- **Zero-Widget Rule & Reassurance Line:** Displays only a clean text clock, battery percentage, and a calm notification status line (`All quiet · 0 urgent alerts · Next digest 18:00`).
- **Zero-App "Mind Dump" Scratchpad:** Capture fleeting thoughts and tasks right on the home screen without opening distracting apps.
- **Asymmetric Search-First App Drawer:** Utility tools (Calculator, Maps, 2FA, Phone) launch immediately when uniquely matched; dopamine-trap apps (Instagram, TikTok, YouTube, X, Reddit, Browsers) remain hidden until typed and trigger the Inhale Gatekeeper.
- **System Grayscale & Surface Themes:** Toggle hardware grayscale (`ZenDeviceEffects` on Android / Color Filters on iOS) and switch between **Pure OLED Black**, **E-Ink Paper**, and **Sunset Amber** palettes.

---

### 🕊️ 2. The "Calm Mind Trigger" Engine (*Sakīnah* — Quran, Hadith & Proverbs)
- **"Small, Strong Line Only":** Every trigger is capped at under 14 words for immediate mental and spiritual stillness without reading fatigue.
- **User-Selectable Offline Wisdom Packs:**
  1. **Quran Only (*Sakīnah*):** Short verses on tranquility of heart, patience, and trust in Allah (with optional original Naskh Arabic script).
  2. **Hadith Only (Sunnah):** Authentic concise Hadith on contentment of soul, guarding free time, and leaving what does not concern you.
  3. **Calm Mind Proverbs:** Universal contemplative proverbs on quietness, presence, and mental clarity.
  4. **Blended Mode:** Gently rotates across all sources.
- **Inhale Breathing Intercept & Micro-Intent Bidding:** Opening a restricted app triggers a 5s $\rightarrow$ 15s escalating breathing delay, asks why you are opening the app, and requires bidding a time limit (`1m`, `3m`, `5m`, `15m`) with a live top-edge countdown and 60-second **Gentle Fade** reminder.
- **4 Interactive Habit-Wall Gatekeepers:**
  1. **Calm Mind Transcription:** Type out the displayed short Quran verse, Hadith, or Proverb.
  2. **Mindful Journal Entry:** Write a 25–50 word reflection saved locally on-device.
  3. **Read 3 Pages:** Read 3 pages from the built-in reader or any uploaded `.pdf` / `.txt` / `.md` document.
  4. **Walk 20 Hardware Steps:** Tracked live via the device accelerometer (`DeviceMotionEvent`).

---

### 🛡️ 3. Purity & Anti-Porn Guard + 90-Day Neuro-Reset Tracker
- **Live Clean Streak Counter:** Tracks **Days, Hours, and Minutes** clean alongside **90-Day Dopamine Baseline Rewiring** milestones (Day 3, Day 7, Day 14, Day 30, Day 90).
- **1-Tap "URGE SOS — Ground My Mind Now" Panic Modal:** Immediate 60-second emergency breathing and physical posture interrupt protocol paired with piercing Quranic verses (Surah An-Nur 24:30, Surah Al-Alaq 96:14), Hadith on self-mastery, and neuro-reset reminders.
- **Discreet Public Mode:** One-tap toggle to display neutral *"Neuro-Reset & Clarity Shield"* titles in public.
- **3-Layer Technical Content Shield:**
  1. **System Adult DNS Filter** (`1.1.1.3` / `family.cloudflare-dns.com`).
  2. **Browser & Incognito Adult Keyword Interceptor**.
  3. **Night Guard** (automatically locks browsers and social feeds from 11:00 PM – 6:00 AM).

---

### 🔕 4. Twice-Daily Notification Digest, Monk Mode & Free QR/NFC "Physical Brick"
- **Notification Digest (`12:00 PM` & `6:00 PM`):** Mutes and batches non-urgent notifications while allowing **VIP Contacts** and messages containing **`URGENT` / `জরুরি`** to break through immediately.
- **Monk Mode Deep Work Timer:** Transforms the Home Screen into an e-ink-style single-task countdown timer (`25m` / `50m` / `90m`).
- **Free Printable QR / NFC Physical Lock:** Generates a printable monochrome QR card (`KASB-BRICK-77`) you can tape in another room—requiring a physical QR/NFC scan to unlock restricted apps early.
- **Craving-Proof Uninstall Protection:** Requires a **24-hour cooling-off countdown** or an **Offline Accountability Friend Passcode** to disable strict mode.

---

### 🌐 5. Multilingual Interface & Wisdom Switcher
Instant 1-tap switching across:
- **English (`en`)**
- **বাংলা / Bangla (`bn`)**
- **العربية / Arabic (`ar` - RTL)**
- **اردو / Urdu (`ur` - RTL)**
- **Bahasa Indonesia (`id`)**

---

## 🛠️ Project Structure & Cross-Platform Architecture

```text
Minimum-Phone/
├── src/
│   ├── components/
│   │   ├── InhaleInterceptModal.tsx   # Breathing delay, Micro-Intent Bid & 4 Habit-Wall Gatekeepers
│   │   ├── PurityGuardView.tsx        # Anti-Porn 90-Day Streak Tracker, Urge SOS & 3-Layer Shield
│   │   ├── DigestAndFocusView.tsx     # Twice-Daily Notification Digest, Monk Mode & Printable QR Lock
│   │   └── AnalyticsAndKasbView.tsx   # Multilingual Switcher, Uninstall Guard, Thermal Receipt & Kasb Hub
│   ├── data/
│   │   ├── calmTriggers.ts            # Multilingual Quran, Hadith, Proverb & Purity database
│   │   └── defaultApps.ts             # Essential utilities vs. restricted dopamine apps
│   ├── i18n/
│   │   └── translations.ts            # English, Bangla, Arabic, Urdu & Indonesian dictionaries
│   ├── services/
│   │   └── nativeBridge.ts            # Capacitor Android/iOS bridge, step sensor & offline TOTP math
│   └── App.tsx                        # Minimalist Home Screen & Asymmetric Search App Drawer
├── native-android/
│   └── MinimumPhoneNativePlugin.kt    # Android RoleManager HOME, ZenDeviceEffects Grayscale, Accessibility & NotificationListener
├── native-ios/
│   └── MinimumPhoneScreenTimePlugin.swift # Apple FamilyControls, ManagedSettings & WidgetKit Home Widget
├── android/                           # Capacitor Android Gradle Project (Target SDK 35)
├── ios/                               # Capacitor iOS Xcode Project
├── play-store-submission/             # Signed .aab, .apk, 512x512 icon, 1024x500 feature graphic, screenshots & Privacy Policy
├── PRD.md                             # Complete Product & Behavioral Architecture Blueprint
└── STORE_DEPLOYMENT.md                # Google Play Store & Apple App Store Build Guide
```

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run interactive development server (http://localhost:5173)
npm run dev

# Build production web & Capacitor bundle
npm run build
npx cap sync
```

---

## 🔒 Verifiable Zero-Telemetry Privacy
Minimum Phone's Android manifest (`android/app/src/main/AndroidManifest.xml`) requests **zero `android.permission.INTERNET` permission**. Every screen-time metric, journal entry, notification digest, and purity streak stays 100% on your device.

---

## 🏢 Brought to you by kasb LLC
Built as a 100% free public utility by **kasb LLC**, alongside **Kasb B2B Enterprise Focus Pods** for remote engineering and knowledge-work teams.

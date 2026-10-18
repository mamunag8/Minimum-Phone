# Minimum Phone — The Anti-Dopamine Launcher & Calm Mind OS
**By kasb LLC** | *100% Free · Zero Ads · Zero Internet Telemetry · Android (Play Store) & iOS (App Store)*

---

## 1. Executive Summary & Strategic Positioning
**Minimum Phone** is a premium-grade, 100% free digital detox launcher and mindful intervention system built by **kasb LLC**. While competitors charge $30–$60/year for app delays (One Sec, Opal, Minimalist Phone) or $50+ for physical NFC blockers (Brick), Minimum Phone provides the entire suite for **$0 with zero ads and zero cloud tracking**.

### Core Pillars
1. **Reduce Screen Time:** Strip away colorful icons, notification badges, and infinite feeds; inject progressive breathing delays, micro-intent time bidding, and habit-wall unlocks.
2. **Cultivate Peace of Mind (*Sakīnah* / Stillness):** Replace anxiety-inducing productivity guilt with **short, piercing one-liners** from the **Quran**, **Authentic Hadith**, or **Universal Calm Mind Proverbs**, paired with an "All-Clear" notification digest that only lets true emergencies pierce through.
3. **Deep Focus Work:** Transform the home screen into an e-ink-style single-task timer ("Monk Mode"), swap home-screen apps automatically by time of day (Work / Personal / Digital Sunset), and offer **free printable QR / NFC physical locks**.

---

## 2. Cross-Platform Architecture (Google Play Store + Apple App Store)

Because Android and iOS have fundamentally different OS sandboxes, Minimum Phone uses a **Unified Cross-Platform Core (React + TypeScript + Capacitor)** paired with **Platform-Specific Native Bridges** in Kotlin (Android) and Swift (iOS):

| Capability | Android (Google Play Store) | iOS (Apple App Store) |
| :--- | :--- | :--- |
| **Minimalist Home Screen** | Native Default Home Replacement (`Intent.CATEGORY_HOME`) | Minimalist `WidgetKit` Large/Medium Home Widgets + Blank Wallpaper + Full-Screen Focus Companion |
| **App Launch Interception (Inhale & Calm Mind Trigger)** | `AccessibilityService` + `UsageStatsManager` + `SYSTEM_ALERT_WINDOW` hybrid interceptor | Apple **Screen Time API (`FamilyControls` + `ManagedSettings` + `ShieldConfigurationDataSource`)** + **iOS Shortcuts Automation** (`When App Opened -> Minimum Phone Inhale`) |
| **System Grayscale** | `NotificationManager.addAutomaticZenRule` (`ZenDeviceEffects.setShouldDisplayGrayscale(true)`) + ADB `WRITE_SECURE_SETTINGS` Daltonizer option | iOS Accessibility Color Filters (`UIAccessibility.isGrayscaleEnabled`) + Automated Focus Filter |
| **Notification Digest & Urgent Breakthrough** | `NotificationListenerService` intercepts, mutes, and batches notifications; pierces on VIP / `URGENT` keyword / 3x rapid burst | iOS **Scheduled Notification Summary** + **Focus Mode Breakthrough Rules** |
| **Uninstall & Strict Lock Protection** | Settings Guard + Accountability Friend TOTP Code + 24h Cooldown | `ManagedSettingsStore().application.denyAppRemoval = true` + Friend TOTP Code / Physical QR Scan |
| **Physical Anchor Lock ("Free Brick")** | Camera QR Scanner + `NfcAdapter` tag reader | `CoreNFC` (`NFCNDEFReaderSession`) + `AVFoundation` QR Scanner |

---

## 3. The "Calm Mind Trigger" Engine (*Sakīnah* & Stillness)
* **Strict Rule:** *"Small, strong line only."* Every quote is capped at **under 14 words** for instant emotional and spiritual resonance without reading fatigue.
* **User-Selectable Packs (100% Offline):**
  1. **Quran Only (*Sakīnah*):** Short verses on tranquility of heart, patience, trust in Allah, and stillness.
  2. **Hadith Only (Prophetic Wisdom):** Authentic short Hadith on contentment of soul, guarding free time, and leaving what does not concern you.
  3. **Universal Proverbs (Calm Mind Only):** Contemplative proverbs on quietness, clarity, and mental peace.
  4. **Blended Mode:** Rotates across selected packs.
* **Trigger Moments:**
  - **Inhale Intercept Screen:** Appears inside the breathing circle when opening a restricted app.
  - **Restless Unlock Intervention:** Triggers automatically when the user checks their phone repeatedly in a short window.
  - **Type-to-Center Habit Wall:** User types the short verse/hadith/proverb to center their mind before unlocking.
  - **Home Screen Whisper:** Quiet anchor line at the bottom of the Home Screen.

---

## 4. Kasb LLC Growth & Monetization Ecosystem
1. **Verifiable Privacy ("Zero-Telemetry Trust"):** 100% local storage (`localStorage` / SQLite) so users know their notifications, journals, and usage habits never leave their phone.
2. **Viral "Reclaimed Life Thermal Receipt":** Weekly monochrome receipt image showing impulse opens stopped, hours saved, and focus streaks—watermarked `MINIMUM PHONE // KASB LLC`.
3. **B2B Enterprise "Focus Pods":** Companies license custom team focus profiles, synchronized deep-work schedules, and printable office QR focus anchors via **kasb LLC** (managed through WooCommerce licensing).

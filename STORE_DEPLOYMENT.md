# Google Play Store & Apple App Store Build Guide
**Minimum Phone by kasb LLC** (`com.kasbllc.minimumphone`)

---

## 1. Local Development & Instant Preview
```bash
npm install
npm run dev
```

## 2. Building Production Web Assets & Syncing Native Targets
```bash
npm run build
npx cap add android
npx cap add ios
npx cap sync
```

---

## 3. Google Play Store (Android) Setup
1. Copy [`native-android/MinimumPhoneNativePlugin.kt`](file:///d:/Kasb%20llc/dev/Apps/Minimum%20Phone/native-android/MinimumPhoneNativePlugin.kt) into `android/app/src/main/java/com/kasbllc/minimumphone/`.
2. Add the Default Home Launcher category and services inside `android/app/src/main/AndroidManifest.xml`:
```xml
<!-- Default Home Screen Replacement -->
<activity android:name=".MainActivity" android:exported="true" android:launchMode="singleTask">
    <intent-filter>
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.intent.category.HOME" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.LAUNCHER" />
    </intent-filter>
</activity>

<!-- Permissions -->
<uses-permission android:name="android.permission.PACKAGE_USAGE_STATS" />
<uses-permission android:name="android.permission.ACCESS_NOTIFICATION_POLICY" />
<uses-permission android:name="android.permission.NFC" />
```
3. Build signed Android App Bundle (`.aab`) in Android Studio (`Build -> Generate Signed Bundle / APK`) and upload to **Google Play Console**.

---

## 4. Apple App Store (iOS) Setup
1. Copy [`native-ios/MinimumPhoneScreenTimePlugin.swift`](file:///d:/Kasb%20llc/dev/Apps/Minimum%20Phone/native-ios/MinimumPhoneScreenTimePlugin.swift) into `ios/App/App/`.
2. In Xcode (`npx cap open ios`), enable the following capabilities under **Signing & Capabilities**:
   - **Family Controls (Distribution & Development)** — Powers native OS-level app shielding, adult content web filter (`ManagedSettingsStore.webContent.blockedByFilter = .auto()`), and uninstall lock (`denyAppRemoval = true`).
   - **App Groups (`group.com.kasbllc.minimumphone`)** — Shares state with the **WidgetKit Minimalist Home Screen Widget**.
   - **Near Field Communication Tag Reading (`CoreNFC`)** — Powers the free Physical NFC Brick Anchor lock.
3. Archive and upload to **App Store Connect**.

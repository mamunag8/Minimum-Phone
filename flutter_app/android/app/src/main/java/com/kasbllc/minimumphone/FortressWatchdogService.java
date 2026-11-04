package com.kasbllc.minimumphone;

import android.app.ActivityManager;
import android.app.AppOpsManager;
import android.app.Service;
import android.app.usage.UsageEvents;
import android.app.usage.UsageStats;
import android.app.usage.UsageStatsManager;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.net.ConnectivityManager;
import android.net.LinkProperties;
import android.net.Network;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.Process;
import android.os.SystemClock;
import android.provider.Settings;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import java.util.Calendar;
import java.util.List;
import java.util.Locale;

/**
 * Real-Time 150ms OS Watchdog Service for Safe Private DNS & System Settings Fortress.
 * 1. Reads real OS Private DNS status via Android ConnectivityManager.getLinkProperties() + Settings.Global.
 * 2. Stateful foreground app tracking (ignores transient com.android.systemui & IME keyboards so Settings can never hide).
 * 3. Instant 0ms hardware WindowManager TYPE_APPLICATION_OVERLAY shield + NativeFortressLockActivity interceptor.
 * 4. Strictly enforces Camera QR Verification before any Settings or DNS access at night (22:00 - 06:00).
 */
public class FortressWatchdogService extends Service {

    public static final String PREFS_NAME = "minimum_phone_fortress";
    public static final String KEY_LOCK_SETTINGS = "lock_system_settings";
    public static final String KEY_AUTO_DNS_NIGHT = "auto_dns_night";
    public static final String KEY_DNS_SHIELD_ACTIVE = "dns_shield_active";
    public static final String KEY_EXPECTED_DNS_HOST = "expected_dns_host";
    public static final String KEY_QR_CODE = "qr_anchor_code";
    public static final String KEY_TEMP_UNLOCK_UNTIL_MS = "temp_unlock_until_ms";
    public static final String KEY_TEMP_UNLOCK_REASON = "temp_unlock_reason";
    public static final String KEY_NIGHT_QR_VERIFIED_UNTIL_MS = "night_qr_verified_until_ms";
    public static final String KEY_EMERGENCY_LOCKDOWN_UNTIL_MS = "emergency_lockdown_until_ms";
    public static final String KEY_USER_VERIFIED_DNS_HOST = "user_verified_dns_host";
    public static final String KEY_WATCHDOG_ENABLED = "watchdog_enabled";
    public static final String KEY_NIGHT_START_HOUR = "night_start_hour";
    public static final String KEY_NIGHT_END_HOUR = "night_end_hour";
    public static final String KEY_SLEEP_SCHEDULE_ENABLED = "sleep_schedule_enabled";
    public static final String KEY_STRICT_QR_247 = "strict_qr_247";
    public static final String KEY_MONK_MODE_UNTIL_MS = "monk_mode_until_ms";
    public static final String KEY_NIGHT_LOCKED_PACKAGES = "night_locked_packages";
    public static final String KEY_NIGHT_ALLOWED_PACKAGES = "night_allowed_packages";
    public static final String KEY_QR_VERIFIED_UNLOCK_UNTIL_MS = "qr_verified_unlock_until_ms";
    public static final String KEY_QR_VERIFIED_UNLOCK_PKG = "qr_verified_unlock_pkg";
    public static final String KEY_CLOCK_TAMPER_UNTIL_MS = "clock_tamper_until_ms";
    public static final String KEY_USAGE_REMINDER_ENABLED = "usage_reminder_enabled";
    public static final String KEY_USAGE_REMINDER_MINUTES = "usage_reminder_minutes";
    public static final String KEY_APP_STATE_JSON = "flutter_app_state_v2";

    private static volatile boolean watchdogActive = false;

    private final Handler watchdogHandler = new Handler(Looper.getMainLooper());
    private long lastInterceptMs = 0L;
    private long lastNightDnsCheckMs = 0L;
    private long lastWallTimeMs = 0L;
    private long lastElapsedRealtimeMs = 0L;
    private boolean lastKnownOsDnsValid = false;
    private boolean lastKnownUsageGranted = false;
    private boolean lastKnownOverlayGranted = false;
    private String lastKnownForegroundPackage = "";
    private String lastKnownForegroundClass = "";

    // Continuous Browser / Social Usage Session Tracker (Gentle 10-Minute Reminder)
    private long activeSessionAccumulatedMs = 0L;
    private long lastSessionTickElapsedMs = 0L;
    private long lastDistractingAppSeenElapsedMs = 0L;
    private long nextReminderThresholdMs = 10L * 60000L;
    private View activeReminderView = null;

    private WindowManager overlayWindowManager = null;
    private View activeOverlayView = null;
    private TextView overlayTitleView = null;
    private TextView overlaySubView = null;
    private String activeOverlayReason = "settings_locked";
    private String activeOverlayPkg = "com.android.settings";

    private final Runnable checkTask = new Runnable() {
        @Override
        public void run() {
            try {
                performWatchdogTick();
            } catch (Exception ignored) {}
            watchdogHandler.postDelayed(this, 150L);
        }
    };

    @Override
    public void onCreate() {
        super.onCreate();
        watchdogActive = true;
        Context ctx = getApplicationContext();
        lastKnownOsDnsValid = isOsPrivateDnsConfigured(ctx);
        lastKnownUsageGranted = isUsageStatsGrantedStatic(ctx);
        lastKnownOverlayGranted = isOverlayGrantedStatic(ctx);
        watchdogHandler.post(checkTask);
    }

    public static boolean isWatchdogActive() {
        return watchdogActive;
    }

    public static boolean isUsageStatsGrantedStatic(Context ctx) {
        try {
            AppOpsManager appOps = (AppOpsManager) ctx.getSystemService(Context.APP_OPS_SERVICE);
            if (appOps != null) {
                int mode;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    mode = appOps.unsafeCheckOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), ctx.getPackageName());
                } else {
                    mode = appOps.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), ctx.getPackageName());
                }
                if (mode == AppOpsManager.MODE_ALLOWED) {
                    return true;
                }
            }
            UsageStatsManager usm = (UsageStatsManager) ctx.getSystemService(Context.USAGE_STATS_SERVICE);
            if (usm != null) {
                long now = System.currentTimeMillis();
                List<UsageStats> stats = usm.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, now - 86400000L, now);
                return stats != null && !stats.isEmpty();
            }
        } catch (Exception ignored) {}
        return false;
    }

    public static boolean isOverlayGrantedStatic(Context ctx) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            return Settings.canDrawOverlays(ctx);
        }
        return true;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        watchdogActive = true;
        return START_STICKY;
    }

    private void performWatchdogTick() {
        Context ctx = getApplicationContext();
        SharedPreferences prefs = ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        boolean lockSettings = prefs.getBoolean(KEY_LOCK_SETTINGS, true);
        boolean autoDnsNight = prefs.getBoolean(KEY_AUTO_DNS_NIGHT, true);
        boolean dnsShieldActive = prefs.getBoolean(KEY_DNS_SHIELD_ACTIVE, true);
        boolean sleepScheduleEnabled = prefs.getBoolean(KEY_SLEEP_SCHEDULE_ENABLED, true);
        boolean strictQr247 = prefs.getBoolean(KEY_STRICT_QR_247, false);
        long monkUntilMs = prefs.getLong(KEY_MONK_MODE_UNTIL_MS, 0L);
        String nightLockedCsv = prefs.getString(KEY_NIGHT_LOCKED_PACKAGES, "");
        long qrVerifiedUnlockUntilMs = prefs.getLong(KEY_QR_VERIFIED_UNLOCK_UNTIL_MS, 0L);

        int startH = prefs.getInt(KEY_NIGHT_START_HOUR, 22);
        int endH = prefs.getInt(KEY_NIGHT_END_HOUR, 6);
        long tempUnlockUntilMs = prefs.getLong(KEY_TEMP_UNLOCK_UNTIL_MS, 0L);
        String tempReason = prefs.getString(KEY_TEMP_UNLOCK_REASON, "");
        long nightQrVerifiedUntilMs = prefs.getLong(KEY_NIGHT_QR_VERIFIED_UNTIL_MS, 0L);
        long emergencyUntilMs = prefs.getLong(KEY_EMERGENCY_LOCKDOWN_UNTIL_MS, 0L);
        long clockTamperUntilMs = prefs.getLong(KEY_CLOCK_TAMPER_UNTIL_MS, 0L);
        long now = System.currentTimeMillis();
        long elapsed = SystemClock.elapsedRealtime();

        // Monotonic Anti-Clock-Tamper Guard: If user shifts system time/timezone by >10 minutes without QR verification,
        // lock down as Night Mode for 8 hours and revoke any temporary leases!
        if (lastWallTimeMs > 0L && lastElapsedRealtimeMs > 0L) {
            long wallDelta = now - lastWallTimeMs;
            long elapsedDelta = elapsed - lastElapsedRealtimeMs;
            if (Math.abs(wallDelta - elapsedDelta) > 600000L && now >= nightQrVerifiedUntilMs) {
                clockTamperUntilMs = now + (8L * 3600000L);
                tempUnlockUntilMs = 0L;
                prefs.edit()
                    .putLong(KEY_CLOCK_TAMPER_UNTIL_MS, clockTamperUntilMs)
                    .putLong(KEY_TEMP_UNLOCK_UNTIL_MS, 0L)
                    .putString(KEY_TEMP_UNLOCK_REASON, "")
                    .putBoolean(KEY_LOCK_SETTINGS, true)
                    .apply();
            }
        }
        lastWallTimeMs = now;
        lastElapsedRealtimeMs = elapsed;

        int hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY);
        boolean isClockTampered = now < clockTamperUntilMs && now >= nightQrVerifiedUntilMs;
        boolean isNightWindow = isClockTampered || ((startH > endH)
            ? (hour >= startH || hour < endH)
            : (hour >= startH && hour < endH));
        boolean isEmergencyLockdown = now < emergencyUntilMs;
        boolean isMonkActive = now < monkUntilMs;

        boolean currentOsDnsValid = isOsPrivateDnsConfigured(ctx);
        boolean currentUsageGranted = isUsageStatsGrantedStatic(ctx);
        boolean currentOverlayGranted = isOverlayGrantedStatic(ctx);

        // A. If user just granted Usage Access or Overlay Permission during setup lease, immediately lock & pull home!
        if (!lastKnownUsageGranted && currentUsageGranted && now < tempUnlockUntilMs && "usage_access".equals(tempReason)) {
            lastKnownUsageGranted = true;
            prefs.edit()
                .putLong(KEY_TEMP_UNLOCK_UNTIL_MS, 0L)
                .putString(KEY_TEMP_UNLOCK_REASON, "")
                .apply();
            hideOverlayShield();
            Toast.makeText(ctx, NativeI18n.tr(ctx, "toastUsageActive"), Toast.LENGTH_SHORT).show();
            Intent homeIntent = new Intent(ctx, MainActivity.class);
            homeIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            ctx.startActivity(homeIntent);
            return;
        }
        lastKnownUsageGranted = currentUsageGranted;

        if (!lastKnownOverlayGranted && currentOverlayGranted && now < tempUnlockUntilMs && "overlay_permission".equals(tempReason)) {
            lastKnownOverlayGranted = true;
            prefs.edit()
                .putLong(KEY_TEMP_UNLOCK_UNTIL_MS, 0L)
                .putString(KEY_TEMP_UNLOCK_REASON, "")
                .apply();
            hideOverlayShield();
            Toast.makeText(ctx, NativeI18n.tr(ctx, "toastOverlayActive"), Toast.LENGTH_SHORT).show();
            Intent homeIntent = new Intent(ctx, MainActivity.class);
            homeIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            ctx.startActivity(homeIntent);
            return;
        }
        lastKnownOverlayGranted = currentOverlayGranted;

        // B. If user was in temporary DNS setup lease and just saved Private DNS in Android Settings, auto-close Settings & lock!
        if (!lastKnownOsDnsValid && currentOsDnsValid && now < tempUnlockUntilMs) {
            lastKnownOsDnsValid = true;
            prefs.edit()
                .putLong(KEY_TEMP_UNLOCK_UNTIL_MS, 0L)
                .putString(KEY_TEMP_UNLOCK_REASON, "")
                .putBoolean(KEY_LOCK_SETTINGS, true)
                .apply();
            hideOverlayShield();
            Toast.makeText(ctx, NativeI18n.tr(ctx, "toastDnsActiveLocked"), Toast.LENGTH_LONG).show();
            Intent homeIntent = new Intent(ctx, MainActivity.class);
            homeIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            ctx.startActivity(homeIntent);
            return;
        }

        // C. CRITICAL ANTI-TAMPER: If DNS WAS valid and just turned OFF:
        // At night WITHOUT QR verification, immediately revoke all leases and lock!
        if (lastKnownOsDnsValid && !currentOsDnsValid) {
            lastKnownOsDnsValid = false;
            if (!isNightWindow || now >= nightQrVerifiedUntilMs) {
                tempUnlockUntilMs = 0L;
                prefs.edit()
                    .putLong(KEY_TEMP_UNLOCK_UNTIL_MS, 0L)
                    .putString(KEY_TEMP_UNLOCK_REASON, "")
                    .putString(KEY_USER_VERIFIED_DNS_HOST, "")
                    .putBoolean(KEY_LOCK_SETTINGS, true)
                    .apply();
            }
        } else {
            lastKnownOsDnsValid = currentOsDnsValid;
        }

        // 1. Every 2.5 seconds at night (or if DNS shield is active), auto-restore Safe Private DNS if modified
        if ((isNightWindow || dnsShieldActive) && autoDnsNight && (now - lastNightDnsCheckMs > 2500L)) {
            lastNightDnsCheckMs = now;
            if (!currentOsDnsValid && (now >= nightQrVerifiedUntilMs || !isNightWindow)) {
                ensurePrivateDnsActiveAtNight(ctx);
                currentOsDnsValid = isOsPrivateDnsConfigured(ctx);
            }
        }

        // 2. Detect foreground package & activity class via stateful UsageStatsManager
        String fgPkg = getCurrentForegroundPackage(ctx);
        if (fgPkg == null || fgPkg.isEmpty()) return;

        String lowerPkg = fgPkg.toLowerCase(Locale.ROOT);
        String lowerClass = lastKnownForegroundClass != null ? lastKnownForegroundClass.toLowerCase(Locale.ROOT) : "";

        // When inside Minimum Phone (MainActivity, NativeFortressLockActivity, or QR CaptureActivity), remove overlay shield
        if (lowerPkg.contains("minimumphone")) {
            hideOverlayShield();
            hideGentleUsageReminderCard();
            if (lastDistractingAppSeenElapsedMs > 0L && (elapsed - lastDistractingAppSeenElapsedMs > 120000L)) {
                resetUsageSessionTracker(prefs);
            }
            return;
        }

        // Never intercept system permission controller / role manager / print spooler dialogs
        if (lowerPkg.contains("permissioncontroller") ||
            lowerPkg.contains("printspooler") ||
            lowerPkg.contains("printservice") ||
            (lowerPkg.contains("packageinstaller") && now < tempUnlockUntilMs)) {
            hideOverlayShield();
            return;
        }

        // 3. Check if user is inside a verified temporary setup/unlock lease
        if (now < tempUnlockUntilMs) {
            // CRITICAL NIGHT QR & ANTI-BYPASS ENFORCEMENT:
            // 1. Block ANY attempt to open App Info / Force Stop / Uninstall / Date & Time / Reset / Developer Options
            //    unless the user has a live Camera QR verification lease!
            boolean navigatedToTamperTarget = lowerClass.contains("installedappdetails")
                || lowerClass.contains("appinfo")
                || lowerClass.contains("spaactivity")
                || lowerClass.contains("manageapplications")
                || lowerClass.contains("applicationsettings")
                || lowerClass.contains("deviceadmin")
                || lowerClass.contains("development")
                || lowerClass.contains("reset")
                || lowerClass.contains("datetime")
                || lowerClass.contains("zonepicker");

            boolean isNonDnsSetupLease = "usage_access".equals(tempReason)
                || "overlay_permission".equals(tempReason)
                || "default_launcher".equals(tempReason)
                || "safe_sub_setting".equals(tempReason);
            boolean navigatedToNetworkOrDns = lowerClass.contains("wireless")
                || lowerClass.contains("network")
                || lowerClass.contains("dns")
                || lowerClass.contains("tether")
                || lowerClass.contains("connectivity");

            if (navigatedToTamperTarget && now >= nightQrVerifiedUntilMs) {
                // User tried to reach App Info (Force Stop), Date/Time, or Reset during a temporary lease!
                tempUnlockUntilMs = 0L;
                prefs.edit()
                    .putLong(KEY_TEMP_UNLOCK_UNTIL_MS, 0L)
                    .putString(KEY_TEMP_UNLOCK_REASON, "")
                    .apply();
            } else if (isNonDnsSetupLease && navigatedToNetworkOrDns) {
                // User tried to abuse a permission or sub-setting lease to reach Network/DNS settings!
                tempUnlockUntilMs = 0L;
                prefs.edit()
                    .putLong(KEY_TEMP_UNLOCK_UNTIL_MS, 0L)
                    .putString(KEY_TEMP_UNLOCK_REASON, "")
                    .apply();
            } else if (isNightWindow && currentOsDnsValid && now >= nightQrVerifiedUntilMs && !isNonDnsSetupLease) {
                // At night, when Safe DNS is active, Settings cannot remain unlocked without a live Camera QR scan!
                tempUnlockUntilMs = 0L;
                prefs.edit()
                    .putLong(KEY_TEMP_UNLOCK_UNTIL_MS, 0L)
                    .putString(KEY_TEMP_UNLOCK_REASON, "")
                    .apply();
            } else {
                hideOverlayShield();
                return;
            }
        }

        // If at Night (22:00-06:00) Safe Private DNS was turned off and user has NOT scanned QR:
        // intercept any external app or Settings to force immediate Safe DNS restoration!
        if (isNightWindow && autoDnsNight && !currentOsDnsValid && now >= nightQrVerifiedUntilMs) {
            showOverlayShield(ctx, "dns_removed", fgPkg);
            if (now - lastInterceptMs > 500L) {
                lastInterceptMs = now;
                Intent lockIntent = new Intent(ctx, NativeFortressLockActivity.class);
                lockIntent.addFlags(
                    Intent.FLAG_ACTIVITY_NEW_TASK |
                    Intent.FLAG_ACTIVITY_CLEAR_TOP |
                    Intent.FLAG_ACTIVITY_SINGLE_TOP
                );
                lockIntent.putExtra("intercept_reason", "dns_removed");
                lockIntent.putExtra("intercepted_pkg", fgPkg);
                ctx.startActivity(lockIntent);
            }
            return;
        }

        boolean isSystemSettings =
            lowerPkg.equals("com.android.settings") ||
            lowerPkg.equals("com.samsung.android.settings") ||
            lowerPkg.equals("com.miui.securitycenter") ||
            lowerPkg.equals("com.coloros.safecenter") ||
            lowerPkg.equals("com.vivo.abe") ||
            lowerPkg.equals("com.oneplus.security") ||
            lowerPkg.equals("com.oplus.wirelesssettings") ||
            lowerPkg.contains("wirelesssettings") ||
            lowerPkg.endsWith(".settings");

        boolean isBrowserApp = isBrowserPackageOrActivity(lowerPkg, lowerClass);
        boolean isSocialOrVideoApp = isSocialOrVideoPackage(lowerPkg);
        boolean isPlayStoreOrAppStore = isPlayStoreOrAppStorePackage(lowerPkg);
        boolean isAiOrSearchGateway = isAiOrSearchGatewayPackage(lowerPkg);
        boolean isInAppWebActivity = isInAppBrowserOrCustomTab(lowerClass);

        String qrUnlockedPkg = prefs.getString(KEY_QR_VERIFIED_UNLOCK_PKG, "");
        String qrUnlockedPkgLower = qrUnlockedPkg != null ? qrUnlockedPkg.trim().toLowerCase(Locale.ROOT) : "";
        boolean unlockedPkgIsBrowser = !qrUnlockedPkgLower.isEmpty() && isBrowserPackageOrActivity(qrUnlockedPkgLower, "");
        boolean hasValidAppQrLease = (now < qrVerifiedUnlockUntilMs)
            && !qrUnlockedPkgLower.isEmpty()
            && lowerPkg.equals(qrUnlockedPkgLower)
            && (!isInAppWebActivity || unlockedPkgIsBrowser);

        boolean isNightLockedApp = false;
        if ((isNightWindow && sleepScheduleEnabled) || isMonkActive) {
            if (!hasValidAppQrLease) {
                isNightLockedApp = isPackageNightLockedStatic(ctx, lowerPkg, lowerClass);
            }
        }

        boolean shouldInterceptSettings = isSystemSettings && (lockSettings || isNightWindow || isEmergencyLockdown || strictQr247 || isMonkActive);
        boolean shouldInterceptBrowser = isBrowserApp && (isEmergencyLockdown || isMonkActive || ((dnsShieldActive || isNightWindow) && !currentOsDnsValid));

        if (shouldInterceptSettings || shouldInterceptBrowser || isNightLockedApp) {
            hideGentleUsageReminderCard();
            final String reason;
            if (shouldInterceptBrowser) {
                reason = "dns_removed";
            } else if (isNightLockedApp) {
                reason = "night_app_locked";
            } else {
                reason = "settings_locked";
            }
            final String interceptedTargetPkg = fgPkg;

            // 1. Instant 0ms Hardware TYPE_APPLICATION_OVERLAY Shield over Settings/Browser/Social/AI/DeepLink
            showOverlayShield(ctx, reason, interceptedTargetPkg);

            // 2. Launch Full NativeFortressLockActivity (immediately + 75ms after overlay window commit for Android 14/15 BAL)
            if (now - lastInterceptMs > 500L) {
                lastInterceptMs = now;
                try {
                    ActivityManager am = (ActivityManager) ctx.getSystemService(Context.ACTIVITY_SERVICE);
                    if (am != null) {
                        am.killBackgroundProcesses(interceptedTargetPkg);
                    }
                } catch (Exception ignored) {}

                launchFortressLockActivityNow(ctx, reason, interceptedTargetPkg);
                watchdogHandler.postDelayed(new Runnable() {
                    @Override
                    public void run() {
                        if (activeOverlayView != null) {
                            launchFortressLockActivityNow(ctx, reason, interceptedTargetPkg);
                        }
                    }
                }, 75L);
            }
        } else {
            hideOverlayShield();

            // Gentle Continuous Usage Reminder (Default: 10 minutes on Browser / Private Tab / Social / Video / AI apps)
            boolean reminderEnabled = prefs.getBoolean(KEY_USAGE_REMINDER_ENABLED, true);
            int reminderMins = prefs.getInt(KEY_USAGE_REMINDER_MINUTES, 10);
            if (reminderMins < 1) reminderMins = 10;

            boolean isTrackedDistractingApp = isBrowserApp || isSocialOrVideoApp || isAiOrSearchGateway;
            if (reminderEnabled && isTrackedDistractingApp) {
                if (lastSessionTickElapsedMs > 0L) {
                    long delta = elapsed - lastSessionTickElapsedMs;
                    if (delta > 0L && delta < 5000L) {
                        activeSessionAccumulatedMs += delta;
                    }
                }
                lastSessionTickElapsedMs = elapsed;
                lastDistractingAppSeenElapsedMs = elapsed;

                if (nextReminderThresholdMs <= 0L) {
                    nextReminderThresholdMs = reminderMins * 60000L;
                }
                if (activeSessionAccumulatedMs >= nextReminderThresholdMs) {
                    showGentleUsageReminderCard(ctx, fgPkg);
                }
            } else {
                lastSessionTickElapsedMs = 0L;
                hideGentleUsageReminderCard();
                // If user has stayed out of Browser/Social apps for 2+ minutes, reset session timer cleanly
                if (lastDistractingAppSeenElapsedMs > 0L && (elapsed - lastDistractingAppSeenElapsedMs > 120000L)) {
                    resetUsageSessionTracker(prefs);
                }
            }
        }
    }

    private void resetUsageSessionTracker(SharedPreferences prefs) {
        int reminderMins = prefs != null ? prefs.getInt(KEY_USAGE_REMINDER_MINUTES, 10) : 10;
        if (reminderMins < 1) reminderMins = 10;
        activeSessionAccumulatedMs = 0L;
        lastSessionTickElapsedMs = 0L;
        lastDistractingAppSeenElapsedMs = 0L;
        nextReminderThresholdMs = reminderMins * 60000L;
    }

    /**
     * Gentle, non-frustrating 10-minute usage reminder card with 1-tap actions:
     * - Stop Usage & Go Home
     * - +10m (1 tap, 0-second wait)
     * - Working (+30m) (1 tap, 0-second wait)
     */
    private void showGentleUsageReminderCard(final Context ctx, final String pkg) {
        if (!isOverlayGrantedStatic(ctx)) return;
        if (activeReminderView != null) return;

        try {
            if (overlayWindowManager == null) {
                overlayWindowManager = (WindowManager) ctx.getSystemService(Context.WINDOW_SERVICE);
            }
            if (overlayWindowManager == null) return;

            LinearLayout backdrop = new LinearLayout(ctx);
            backdrop.setOrientation(LinearLayout.VERTICAL);
            backdrop.setGravity(Gravity.CENTER);
            backdrop.setBackgroundColor(Color.parseColor("#B3000000"));
            int outerPad = dp(ctx, 22);
            backdrop.setPadding(outerPad, outerPad, outerPad, outerPad);

            LinearLayout card = new LinearLayout(ctx);
            card.setOrientation(LinearLayout.VERTICAL);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN_MR1) {
                card.setLayoutDirection(NativeI18n.isRtl(ctx) ? View.LAYOUT_DIRECTION_RTL : View.LAYOUT_DIRECTION_LTR);
            }
            int cardPad = dp(ctx, 20);
            card.setPadding(cardPad, cardPad, cardPad, cardPad);
            GradientDrawable cardBg = new GradientDrawable();
            cardBg.setColor(Color.parseColor("#111318"));
            cardBg.setStroke(dp(ctx, 2), Color.parseColor("#10B981"));
            cardBg.setCornerRadius(dp(ctx, 18));
            card.setBackground(cardBg);

            TextView badge = new TextView(ctx);
            badge.setText(NativeI18n.tr(ctx, "remBadge"));
            badge.setTextColor(Color.parseColor("#10B981"));
            badge.setTextSize(11f);
            badge.setTypeface(Typeface.MONOSPACE, Typeface.BOLD);
            card.addView(badge);

            TextView title = new TextView(ctx);
            title.setText(NativeI18n.tr(ctx, "remTitle"));
            title.setTextColor(Color.WHITE);
            title.setTextSize(18f);
            title.setTypeface(Typeface.DEFAULT_BOLD);
            title.setPadding(0, dp(ctx, 8), 0, dp(ctx, 6));
            card.addView(title);

            TextView sub = new TextView(ctx);
            sub.setText(NativeI18n.tr(ctx, "remSub"));
            sub.setTextColor(Color.parseColor("#D4D4D8"));
            sub.setTextSize(13.5f);
            sub.setPadding(0, 0, 0, dp(ctx, 16));
            card.addView(sub);

            Button stopBtn = new Button(ctx);
            stopBtn.setAllCaps(false);
            stopBtn.setText(NativeI18n.tr(ctx, "remStopBtn"));
            stopBtn.setTextColor(Color.BLACK);
            GradientDrawable stopBg = new GradientDrawable();
            stopBg.setColor(Color.parseColor("#10B981"));
            stopBg.setCornerRadius(dp(ctx, 10));
            stopBtn.setBackground(stopBg);
            stopBtn.setTypeface(Typeface.DEFAULT_BOLD);
            LinearLayout.LayoutParams stopLp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            );
            stopLp.bottomMargin = dp(ctx, 10);
            stopBtn.setLayoutParams(stopLp);
            stopBtn.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    hideGentleUsageReminderCard();
                    SharedPreferences prefs = ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
                    resetUsageSessionTracker(prefs);
                    Intent home = new Intent(ctx, MainActivity.class);
                    home.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                    ctx.startActivity(home);
                }
            });
            card.addView(stopBtn);

            LinearLayout snoozeRow = new LinearLayout(ctx);
            snoozeRow.setOrientation(LinearLayout.HORIZONTAL);

            Button more10Btn = new Button(ctx);
            more10Btn.setAllCaps(false);
            more10Btn.setText(NativeI18n.tr(ctx, "remMore10Btn"));
            more10Btn.setTextColor(Color.WHITE);
            GradientDrawable m10Bg = new GradientDrawable();
            m10Bg.setColor(Color.parseColor("#27272A"));
            m10Bg.setStroke(dp(ctx, 1), Color.parseColor("#52525B"));
            m10Bg.setCornerRadius(dp(ctx, 10));
            more10Btn.setBackground(m10Bg);
            LinearLayout.LayoutParams m10Lp = new LinearLayout.LayoutParams(
                0,
                LinearLayout.LayoutParams.WRAP_CONTENT,
                1f
            );
            m10Lp.rightMargin = dp(ctx, 6);
            more10Btn.setLayoutParams(m10Lp);
            more10Btn.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    nextReminderThresholdMs = activeSessionAccumulatedMs + (10L * 60000L);
                    hideGentleUsageReminderCard();
                }
            });
            snoozeRow.addView(more10Btn);

            Button work30Btn = new Button(ctx);
            work30Btn.setAllCaps(false);
            work30Btn.setText(NativeI18n.tr(ctx, "remWork30Btn"));
            work30Btn.setTextColor(Color.WHITE);
            GradientDrawable w30Bg = new GradientDrawable();
            w30Bg.setColor(Color.parseColor("#27272A"));
            w30Bg.setStroke(dp(ctx, 1), Color.parseColor("#52525B"));
            w30Bg.setCornerRadius(dp(ctx, 10));
            work30Btn.setBackground(w30Bg);
            LinearLayout.LayoutParams w30Lp = new LinearLayout.LayoutParams(
                0,
                LinearLayout.LayoutParams.WRAP_CONTENT,
                1.3f
            );
            work30Btn.setLayoutParams(w30Lp);
            work30Btn.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    nextReminderThresholdMs = activeSessionAccumulatedMs + (30L * 60000L);
                    hideGentleUsageReminderCard();
                }
            });
            snoozeRow.addView(work30Btn);

            card.addView(snoozeRow);
            backdrop.addView(card);

            int overlayType = (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                : WindowManager.LayoutParams.TYPE_PHONE;

            WindowManager.LayoutParams params = new WindowManager.LayoutParams(
                WindowManager.LayoutParams.MATCH_PARENT,
                WindowManager.LayoutParams.MATCH_PARENT,
                overlayType,
                WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN |
                    WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON,
                PixelFormat.TRANSLUCENT
            );
            params.gravity = Gravity.CENTER;

            overlayWindowManager.addView(backdrop, params);
            activeReminderView = backdrop;
        } catch (Exception ignored) {}
    }

    private void hideGentleUsageReminderCard() {
        if (activeReminderView != null && overlayWindowManager != null) {
            try {
                overlayWindowManager.removeViewImmediate(activeReminderView);
            } catch (Exception e) {
                try {
                    overlayWindowManager.removeView(activeReminderView);
                } catch (Exception ignored) {}
            }
            activeReminderView = null;
        }
    }

    /**
     * Attaches an instant 0ms hardware WindowManager TYPE_APPLICATION_OVERLAY view directly on top of
     * com.android.settings so the user can never touch Private DNS or system settings even if Android 14+
     * delays background startActivity calls.
     */
    private void showOverlayShield(final Context ctx, final String reason, final String pkg) {
        if (!isOverlayGrantedStatic(ctx)) return;
        activeOverlayReason = reason != null ? reason : "settings_locked";
        activeOverlayPkg = pkg != null ? pkg : "com.android.settings";

        try {
            if (overlayWindowManager == null) {
                overlayWindowManager = (WindowManager) ctx.getSystemService(Context.WINDOW_SERVICE);
            }
            if (overlayWindowManager == null) return;

            int hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY);
            boolean isNight = (hour >= 22 || hour < 6);
            String titleText = isNight
                ? NativeI18n.tr(ctx, "overlayNightTitle")
                : NativeI18n.tr(ctx, "overlayDayTitle");
            String subText = isNight
                ? NativeI18n.tr(ctx, "overlayNightSub")
                : NativeI18n.tr(ctx, "overlayDaySub");

            if (activeOverlayView != null) {
                if (overlayTitleView != null) overlayTitleView.setText(titleText);
                if (overlaySubView != null) overlaySubView.setText(subText);
                return;
            }

            LinearLayout root = new LinearLayout(ctx);
            root.setOrientation(LinearLayout.VERTICAL);
            root.setGravity(Gravity.CENTER);
            root.setBackgroundColor(Color.parseColor("#050507"));
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN_MR1) {
                root.setLayoutDirection(NativeI18n.isRtl(ctx) ? View.LAYOUT_DIRECTION_RTL : View.LAYOUT_DIRECTION_LTR);
            }
            int pad = dp(ctx, 24);
            root.setPadding(pad, pad, pad, pad);
            root.setClickable(true);
            root.setFocusable(true);

            TextView badge = new TextView(ctx);
            badge.setText(NativeI18n.tr(ctx, "overlayBadge"));
            badge.setTextColor(Color.parseColor("#10B981"));
            badge.setTextSize(12f);
            badge.setTypeface(Typeface.MONOSPACE, Typeface.BOLD);
            badge.setGravity(Gravity.CENTER);
            root.addView(badge);

            overlayTitleView = new TextView(ctx);
            overlayTitleView.setText(titleText);
            overlayTitleView.setTextColor(Color.WHITE);
            overlayTitleView.setTextSize(19f);
            overlayTitleView.setTypeface(Typeface.DEFAULT_BOLD);
            overlayTitleView.setGravity(Gravity.CENTER);
            overlayTitleView.setPadding(0, dp(ctx, 14), 0, dp(ctx, 10));
            root.addView(overlayTitleView);

            overlaySubView = new TextView(ctx);
            overlaySubView.setText(subText);
            overlaySubView.setTextColor(Color.parseColor("#A1A1AA"));
            overlaySubView.setTextSize(13.5f);
            overlaySubView.setGravity(Gravity.CENTER);
            overlaySubView.setPadding(0, 0, 0, dp(ctx, 22));
            root.addView(overlaySubView);

            Button qrUnlockBtn = new Button(ctx);
            qrUnlockBtn.setAllCaps(false);
            qrUnlockBtn.setText(NativeI18n.tr(ctx, "overlayQrBtn"));
            qrUnlockBtn.setTextColor(Color.BLACK);
            GradientDrawable qrBg = new GradientDrawable();
            qrBg.setColor(Color.parseColor("#10B981"));
            qrBg.setCornerRadius(dp(ctx, 10));
            qrUnlockBtn.setBackground(qrBg);
            qrUnlockBtn.setTypeface(Typeface.DEFAULT_BOLD);
            LinearLayout.LayoutParams btnLp1 = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            );
            btnLp1.bottomMargin = dp(ctx, 12);
            qrUnlockBtn.setLayoutParams(btnLp1);
            qrUnlockBtn.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    launchFortressLockActivityNow(ctx, activeOverlayReason, activeOverlayPkg);
                    watchdogHandler.postDelayed(new Runnable() {
                        @Override
                        public void run() {
                            hideOverlayShield();
                        }
                    }, 220L);
                }
            });
            root.addView(qrUnlockBtn);

            Button homeBtn = new Button(ctx);
            homeBtn.setAllCaps(false);
            homeBtn.setText(NativeI18n.tr(ctx, "overlayHomeBtn"));
            homeBtn.setTextColor(Color.WHITE);
            GradientDrawable homeBg = new GradientDrawable();
            homeBg.setColor(Color.parseColor("#27272A"));
            homeBg.setStroke(dp(ctx, 1), Color.parseColor("#52525B"));
            homeBg.setCornerRadius(dp(ctx, 10));
            homeBtn.setBackground(homeBg);
            homeBtn.setTypeface(Typeface.DEFAULT_BOLD);
            LinearLayout.LayoutParams btnLp2 = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            );
            homeBtn.setLayoutParams(btnLp2);
            homeBtn.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    Intent home = new Intent(ctx, MainActivity.class);
                    home.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                    ctx.startActivity(home);
                    watchdogHandler.postDelayed(new Runnable() {
                        @Override
                        public void run() {
                            hideOverlayShield();
                        }
                    }, 220L);
                }
            });
            root.addView(homeBtn);

            int overlayType = (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                : WindowManager.LayoutParams.TYPE_PHONE;

            WindowManager.LayoutParams params = new WindowManager.LayoutParams(
                WindowManager.LayoutParams.MATCH_PARENT,
                WindowManager.LayoutParams.MATCH_PARENT,
                overlayType,
                WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN |
                    WindowManager.LayoutParams.FLAG_FULLSCREEN |
                    WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON,
                PixelFormat.OPAQUE
            );
            params.gravity = Gravity.CENTER;

            overlayWindowManager.addView(root, params);
            activeOverlayView = root;
        } catch (Exception ignored) {}
    }

    private void launchFortressLockActivityNow(Context ctx, String reason, String interceptedPkg) {
        try {
            Intent lockIntent = new Intent(ctx, NativeFortressLockActivity.class);
            lockIntent.addFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK |
                Intent.FLAG_ACTIVITY_CLEAR_TOP |
                Intent.FLAG_ACTIVITY_SINGLE_TOP
            );
            lockIntent.putExtra("intercept_reason", reason != null ? reason : "night_app_locked");
            lockIntent.putExtra("intercepted_pkg", interceptedPkg != null ? interceptedPkg : "");
            ctx.startActivity(lockIntent);
        } catch (Exception ignored) {}
    }

    public static boolean isInAppBrowserOrCustomTab(String lowerClass) {
        if (lowerClass == null || lowerClass.isEmpty()) return false;
        return lowerClass.contains("customtab") ||
               lowerClass.contains("incognito") ||
               lowerClass.contains("inappbrowser") ||
               lowerClass.contains("browseractivity") ||
               lowerClass.contains("browserlite") ||
               lowerClass.contains("webviewactivity") ||
               lowerClass.contains("webactivity") ||
               lowerClass.contains("webpageactivity") ||
               lowerClass.contains("internalbrowser") ||
               lowerClass.contains("authcustomtab");
    }

    public static boolean isBrowserPackageOrActivity(String lowerPkg, String lowerClass) {
        if (isInAppBrowserOrCustomTab(lowerClass)) return true;
        if (lowerPkg == null || lowerPkg.isEmpty()) return false;
        return lowerPkg.contains("chrome") ||
               lowerPkg.contains("firefox") ||
               lowerPkg.contains("brave") ||
               lowerPkg.contains("sbrowser") ||
               lowerPkg.contains("opera") ||
               lowerPkg.contains("emmx") ||
               lowerPkg.contains("duckduckgo") ||
               lowerPkg.contains("ucmobile") ||
               lowerPkg.contains("kiwi") ||
               lowerPkg.contains("vivaldi") ||
               lowerPkg.contains("browser") ||
               lowerPkg.contains("webview") ||
               lowerPkg.contains("htmlviewer") ||
               lowerPkg.contains("torproject") ||
               lowerPkg.contains("bromite") ||
               lowerPkg.contains("cromite") ||
               lowerPkg.contains("mulch") ||
               lowerPkg.contains("iceraven") ||
               lowerPkg.contains("fenix") ||
               lowerPkg.contains("focus") ||
               lowerPkg.contains("ecosia") ||
               lowerPkg.contains("yandex") ||
               lowerPkg.contains("whale") ||
               lowerPkg.contains("aloha") ||
               lowerPkg.contains("phoenix") ||
               lowerPkg.contains("puffin") ||
               lowerPkg.contains("dolphin");
    }

    public static boolean isAiOrSearchGatewayPackage(String lowerPkg) {
        if (lowerPkg == null || lowerPkg.isEmpty()) return false;
        return lowerPkg.equals("com.google.android.apps.bard") ||
               lowerPkg.equals("com.google.android.googlequicksearchbox") ||
               lowerPkg.equals("com.google.android.apps.googleassistant") ||
               lowerPkg.equals("com.google.ar.lens") ||
               lowerPkg.equals("com.openai.chatgpt") ||
               lowerPkg.equals("com.microsoft.copilot") ||
               lowerPkg.equals("com.microsoft.bing") ||
               lowerPkg.equals("com.anthropic.claude") ||
               lowerPkg.equals("ai.perplexity.app.android") ||
               lowerPkg.equals("com.deepseek.chat") ||
               lowerPkg.equals("ai.x.grok") ||
               lowerPkg.equals("com.quora.poe") ||
               lowerPkg.equals("ai.character.app") ||
               lowerPkg.equals("com.yahoo.mobile.client.android.search") ||
               lowerPkg.equals("com.yandex.searchplugin") ||
               lowerPkg.equals("com.baidu.searchbox") ||
               lowerPkg.contains("gemini") ||
               lowerPkg.contains("chatgpt") ||
               lowerPkg.contains("perplexity") ||
               lowerPkg.contains("copilot");
    }

    public static boolean isSocialOrVideoPackage(String lowerPkg) {
        if (lowerPkg == null || lowerPkg.isEmpty()) return false;
        return lowerPkg.contains("youtube") ||
               lowerPkg.contains("vanced") ||
               lowerPkg.contains("newpipe") ||
               lowerPkg.contains("piped") ||
               lowerPkg.contains("instagram") ||
               lowerPkg.contains("facebook") ||
               lowerPkg.contains("katana") ||
               lowerPkg.contains("orca") ||
               lowerPkg.contains("mlite") ||
               lowerPkg.contains("musically") ||
               lowerPkg.contains("trill") ||
               lowerPkg.contains("tiktok") ||
               lowerPkg.contains("aweme") ||
               lowerPkg.contains("twitter") ||
               lowerPkg.equals("com.x.android") ||
               lowerPkg.contains("reddit") ||
               lowerPkg.contains("snapchat") ||
               lowerPkg.contains("threads") ||
               lowerPkg.contains("barcelona") ||
               lowerPkg.contains("pinterest") ||
               lowerPkg.contains("linkedin") ||
               lowerPkg.contains("tumblr") ||
               lowerPkg.contains("discord") ||
               lowerPkg.contains("twitch") ||
               lowerPkg.equals("com.kick.mobile") ||
               lowerPkg.contains("netflix") ||
               lowerPkg.contains("primevideo") ||
               lowerPkg.contains("avod.thirdpartyclient") ||
               lowerPkg.contains("disney") ||
               lowerPkg.contains("hulu") ||
               lowerPkg.contains("hbo") ||
               lowerPkg.contains("crunchyroll") ||
               lowerPkg.contains("bilibili") ||
               lowerPkg.contains("vimeo") ||
               lowerPkg.contains("dailymotion") ||
               lowerPkg.contains("kwai") ||
               lowerPkg.contains("likee") ||
               lowerPkg.contains("bigo") ||
               lowerPkg.contains("quora") ||
               lowerPkg.contains("9gag") ||
               lowerPkg.contains("imgur") ||
               lowerPkg.contains("vkontakte") ||
               lowerPkg.contains("weibo") ||
               lowerPkg.contains("bluesky") ||
               lowerPkg.contains("mastodon");
    }

    public static boolean isPlayStoreOrAppStorePackage(String lowerPkg) {
        if (lowerPkg == null || lowerPkg.isEmpty()) return false;
        return lowerPkg.equals("com.android.vending") ||
               lowerPkg.equals("com.sec.android.app.samsungapps") ||
               lowerPkg.equals("com.xiaomi.mipicks") ||
               lowerPkg.equals("com.xiaomi.market") ||
               lowerPkg.equals("com.huawei.appmarket") ||
               lowerPkg.equals("com.heytap.market") ||
               lowerPkg.equals("com.oppo.market") ||
               lowerPkg.equals("com.bbk.appstore") ||
               lowerPkg.equals("com.vivo.appstore") ||
               lowerPkg.equals("org.fdroid.fdroid") ||
               lowerPkg.equals("com.aurora.store") ||
               lowerPkg.equals("com.apkpure.aegon");
    }

    public static boolean isAlwaysAllowedEmergencyOrCoreUtility(String lowerPkg) {
        if (lowerPkg == null || lowerPkg.isEmpty()) return false;
        return lowerPkg.contains("incallui") ||
               lowerPkg.contains("dialer") ||
               lowerPkg.equals("com.android.phone") ||
               lowerPkg.equals("com.android.server.telecom") ||
               lowerPkg.contains("contacts") ||
               lowerPkg.contains("deskclock") ||
               lowerPkg.contains("clockpackage") ||
               lowerPkg.contains("alarmclock") ||
               lowerPkg.contains("calculator") ||
               lowerPkg.equals("com.google.android.apps.messaging") ||
               lowerPkg.equals("com.samsung.android.messaging") ||
               lowerPkg.equals("com.android.mms") ||
               lowerPkg.equals("com.google.android.apps.maps") ||
               lowerPkg.equals("com.google.android.calendar") ||
               lowerPkg.equals("com.samsung.android.calendar");
    }

    /**
     * Unified Night & Monk Mode package/activity lock evaluator.
     * Blocks all Browsers, Custom Tabs, In-App WebViews, AI Assistants/Search Gateways (Gemini, Google App, ChatGPT),
     * Social/Video apps, App Stores, explicitly night-locked packages, and any non-whitelisted external package.
     */
    public static boolean isPackageNightLockedStatic(Context ctx, String lowerPkg, String lowerClass) {
        if (lowerPkg == null || lowerPkg.isEmpty()) return false;
        if (lowerPkg.contains("minimumphone")) return false;

        // 1. Always intercept any In-App Browser, Custom Tab, or WebView activity opened via links inside ANY app
        if (isInAppBrowserOrCustomTab(lowerClass)) {
            return true;
        }

        // 2. Always intercept Browsers, Social/Video apps, AI Assistants/Search link gateways (Gemini/Google/ChatGPT), and App Stores
        if (isPlayStoreOrAppStorePackage(lowerPkg) ||
            isSocialOrVideoPackage(lowerPkg) ||
            isBrowserPackageOrActivity(lowerPkg, lowerClass) ||
            isAiOrSearchGatewayPackage(lowerPkg)) {
            return true;
        }

        SharedPreferences prefs = ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);

        // 3. Check explicit night-locked package list configured in Minimum Phone
        String nightLockedCsv = prefs.getString(KEY_NIGHT_LOCKED_PACKAGES, "");
        if (nightLockedCsv != null && !nightLockedCsv.isEmpty()) {
            String[] lockedPkgs = nightLockedCsv.split(",");
            for (String p : lockedPkgs) {
                String trimmed = p.trim().toLowerCase(Locale.ROOT);
                if (!trimmed.isEmpty() && lowerPkg.equals(trimmed)) {
                    return true;
                }
            }
        }

        // 4. Never block emergency phone calls, SMS, alarm clock, maps, calendar, or calculator
        if (isAlwaysAllowedEmergencyOrCoreUtility(lowerPkg)) {
            return false;
        }

        // 5. If nightAllowedCsv whitelist is populated, block any other non-whitelisted app (e.g. unsynced apps/games opened via Gemini or deep links)
        String nightAllowedCsv = prefs.getString(KEY_NIGHT_ALLOWED_PACKAGES, "");
        if (nightAllowedCsv != null && !nightAllowedCsv.isEmpty()) {
            String[] allowedPkgs = nightAllowedCsv.split(",");
            for (String p : allowedPkgs) {
                String trimmed = p.trim().toLowerCase(Locale.ROOT);
                if (!trimmed.isEmpty() && lowerPkg.equals(trimmed)) {
                    return false;
                }
            }
            return true;
        }

        return false;
    }

    private void hideOverlayShield() {
        if (activeOverlayView != null && overlayWindowManager != null) {
            try {
                overlayWindowManager.removeViewImmediate(activeOverlayView);
            } catch (Exception e) {
                try {
                    overlayWindowManager.removeView(activeOverlayView);
                } catch (Exception ignored) {}
            }
            activeOverlayView = null;
            overlayTitleView = null;
            overlaySubView = null;
        }
    }

    private int dp(Context ctx, int v) {
        float density = ctx.getResources().getDisplayMetrics().density;
        return Math.round(v * density);
    }

    public static boolean isApprovedFamilySafeDnsHost(String host, String expectedHost) {
        if (host == null) return false;
        String h = host.trim().toLowerCase(Locale.ROOT);
        if (h.isEmpty()) return false;
        if (h.contains("family.cloudflare-dns.com") ||
            h.contains("security.cloudflare-dns.com") ||
            h.contains("cleanbrowsing.org") ||
            h.contains("family.adguard-dns.com")) {
            return true;
        }
        if (expectedHost != null && !expectedHost.trim().isEmpty() && h.equalsIgnoreCase(expectedHost.trim())) {
            return true;
        }
        return false;
    }

    /**
     * Checks if Safe Private DNS (DNS-over-TLS) is currently active on the Android OS.
     * Strictly requires an approved family-safe DNS hostname (NOT "Off" and NOT "Automatic/opportunistic").
     */
    public static boolean isOsPrivateDnsConfigured(Context ctx) {
        try {
            SharedPreferences prefs = ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String expectedHost = prefs.getString(KEY_EXPECTED_DNS_HOST, "family.cloudflare-dns.com");

            // Layer 1: Official ConnectivityManager LinkProperties API (API 28+)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                ConnectivityManager cm = (ConnectivityManager) ctx.getSystemService(Context.CONNECTIVITY_SERVICE);
                if (cm != null) {
                    Network activeNet = cm.getActiveNetwork();
                    if (activeNet != null) {
                        LinkProperties lp = cm.getLinkProperties(activeNet);
                        if (lp != null) {
                            String tlsHost = lp.getPrivateDnsServerName();
                            if (tlsHost != null && !tlsHost.trim().isEmpty()) {
                                if (isApprovedFamilySafeDnsHost(tlsHost, expectedHost)) {
                                    prefs.edit().putString(KEY_USER_VERIFIED_DNS_HOST, tlsHost.trim()).apply();
                                    return true;
                                } else {
                                    // User changed DNS to a non-family-safe host (e.g. dns.google)!
                                    prefs.edit().putString(KEY_USER_VERIFIED_DNS_HOST, "").apply();
                                    return false;
                                }
                            } else {
                                // On an active network, if getPrivateDnsServerName() is null, Private DNS is NOT in strict hostname mode
                                // unless Settings.Global explicitly confirms hostname mode with an approved family host.
                                String gMode = Settings.Global.getString(ctx.getContentResolver(), "private_dns_mode");
                                String gSpec = Settings.Global.getString(ctx.getContentResolver(), "private_dns_specifier");
                                if ("hostname".equalsIgnoreCase(gMode) && isApprovedFamilySafeDnsHost(gSpec, expectedHost)) {
                                    return true;
                                }
                                prefs.edit().putString(KEY_USER_VERIFIED_DNS_HOST, "").apply();
                                return false;
                            }
                        }
                    }
                }
            }

            // Layer 2: Settings.Global fallback (when offline / no active network)
            String mode = Settings.Global.getString(ctx.getContentResolver(), "private_dns_mode");
            String spec = Settings.Global.getString(ctx.getContentResolver(), "private_dns_specifier");
            if ("hostname".equalsIgnoreCase(mode) && isApprovedFamilySafeDnsHost(spec, expectedHost)) {
                return true;
            }

            // Layer 3: Offline fallback using last verified host when network is temporarily disconnected
            String manualVerifiedHost = prefs.getString(KEY_USER_VERIFIED_DNS_HOST, "");
            if (isApprovedFamilySafeDnsHost(manualVerifiedHost, expectedHost)) {
                return true;
            }
        } catch (Exception ignored) {}
        return false;
    }

    public static String getOsPrivateDnsHost(Context ctx) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                ConnectivityManager cm = (ConnectivityManager) ctx.getSystemService(Context.CONNECTIVITY_SERVICE);
                if (cm != null) {
                    Network activeNet = cm.getActiveNetwork();
                    if (activeNet != null) {
                        LinkProperties lp = cm.getLinkProperties(activeNet);
                        if (lp != null && lp.getPrivateDnsServerName() != null && !lp.getPrivateDnsServerName().trim().isEmpty()) {
                            return lp.getPrivateDnsServerName().trim();
                        }
                    }
                }
            }
            String spec = Settings.Global.getString(ctx.getContentResolver(), "private_dns_specifier");
            if (spec != null && !spec.trim().isEmpty()) {
                return spec.trim();
            }
            SharedPreferences prefs = ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String verified = prefs.getString(KEY_USER_VERIFIED_DNS_HOST, "");
            if (verified != null && !verified.isEmpty()) {
                return verified;
            }
        } catch (Exception ignored) {}
        return "";
    }

    public static String getOsPrivateDnsMode(Context ctx) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                ConnectivityManager cm = (ConnectivityManager) ctx.getSystemService(Context.CONNECTIVITY_SERVICE);
                if (cm != null) {
                    Network activeNet = cm.getActiveNetwork();
                    if (activeNet != null) {
                        LinkProperties lp = cm.getLinkProperties(activeNet);
                        if (lp != null) {
                            if (lp.getPrivateDnsServerName() != null && !lp.getPrivateDnsServerName().trim().isEmpty()) {
                                return "hostname";
                            }
                            if (lp.isPrivateDnsActive()) {
                                return "opportunistic";
                            }
                        }
                    }
                }
            }
            String mode = Settings.Global.getString(ctx.getContentResolver(), "private_dns_mode");
            if (mode != null && !mode.trim().isEmpty()) {
                return mode.trim().toLowerCase(Locale.ROOT);
            }
            if (isOsPrivateDnsConfigured(ctx)) {
                return "hostname";
            }
        } catch (Exception ignored) {}
        return "off";
    }

    public static boolean ensurePrivateDnsActiveAtNight(Context ctx) {
        try {
            SharedPreferences prefs = ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String expectedHost = prefs.getString(KEY_EXPECTED_DNS_HOST, "family.cloudflare-dns.com");
            if (expectedHost == null || expectedHost.trim().isEmpty()) {
                expectedHost = "family.cloudflare-dns.com";
            }
            String cleanHost = expectedHost.trim();

            if (!isOsPrivateDnsConfigured(ctx)) {
                try {
                    boolean m = Settings.Global.putString(ctx.getContentResolver(), "private_dns_mode", "hostname");
                    boolean s = Settings.Global.putString(ctx.getContentResolver(), "private_dns_specifier", cleanHost);
                    if (m && s) {
                        prefs.edit().putString(KEY_USER_VERIFIED_DNS_HOST, cleanHost).apply();
                        return true;
                    }
                } catch (Exception ignored) {}

                try {
                    Settings.Secure.putString(ctx.getContentResolver(), "private_dns_mode", "hostname");
                    Settings.Secure.putString(ctx.getContentResolver(), "private_dns_specifier", cleanHost);
                } catch (Exception ignored) {}

                try {
                    Runtime.getRuntime().exec(new String[]{
                        "sh", "-c",
                        "settings put global private_dns_mode hostname && settings put global private_dns_specifier " + cleanHost
                    });
                } catch (Exception ignored) {}

                try {
                    ClipboardManager clipboard = (ClipboardManager) ctx.getSystemService(Context.CLIPBOARD_SERVICE);
                    if (clipboard != null) {
                        ClipData clip = ClipData.newPlainText("Minimum Phone Safe Private DNS", cleanHost);
                        clipboard.setPrimaryClip(clip);
                    }
                } catch (Exception ignored) {}
            } else {
                return true;
            }
        } catch (Exception ignored) {}
        return isOsPrivateDnsConfigured(ctx);
    }

    private boolean isTransientSystemUiOrKeyboard(String pkg) {
        if (pkg == null) return true;
        String lower = pkg.trim().toLowerCase(Locale.ROOT);
        if (lower.isEmpty()) return true;
        try {
            String defIme = Settings.Secure.getString(getContentResolver(), Settings.Secure.DEFAULT_INPUT_METHOD);
            if (defIme != null && !defIme.isEmpty()) {
                String imePkg = defIme.split("/")[0].trim().toLowerCase(Locale.ROOT);
                if (!imePkg.isEmpty() && lower.equals(imePkg)) {
                    return true;
                }
            }
        } catch (Exception ignored) {}
        return lower.equals("android") ||
               lower.equals("com.android.systemui") ||
               lower.contains("permissioncontroller") ||
               lower.contains("inputmethod") ||
               lower.contains("keyboard") ||
               lower.contains("gboard") ||
               lower.contains("honeyboard") ||
               lower.contains("swiftkey") ||
               lower.contains("ridmik") ||
               lower.contains("desh") ||
               lower.contains("indic") ||
               lower.contains("openboard") ||
               lower.contains("florisboard") ||
               lower.contains("fleksy") ||
               lower.contains("kika") ||
               lower.contains("bobble") ||
               lower.contains("facemoji") ||
               lower.contains("touchpal") ||
               lower.contains("sogou") ||
               lower.contains("baidu.input") ||
               lower.contains("latinime");
    }

    private String getCurrentForegroundPackage(Context ctx) {
        try {
            UsageStatsManager usm = (UsageStatsManager) ctx.getSystemService(Context.USAGE_STATS_SERVICE);
            if (usm == null) return lastKnownForegroundPackage;
            long end = System.currentTimeMillis();
            long begin = end - 15000L;
            UsageEvents events = usm.queryEvents(begin, end);
            String latestMovedToFg = null;
            String latestFgClass = null;
            if (events != null) {
                UsageEvents.Event event = new UsageEvents.Event();
                while (events.hasNextEvent()) {
                    events.getNextEvent(event);
                    int type = event.getEventType();
                    if (type == UsageEvents.Event.MOVE_TO_FOREGROUND || type == 1 /* ACTIVITY_RESUMED */) {
                        String pkg = event.getPackageName();
                        if (pkg != null && !pkg.isEmpty() && !isTransientSystemUiOrKeyboard(pkg)) {
                            latestMovedToFg = pkg;
                            latestFgClass = event.getClassName() != null ? event.getClassName() : "";
                        }
                    }
                }
            }
            if (latestMovedToFg != null) {
                lastKnownForegroundPackage = latestMovedToFg;
                lastKnownForegroundClass = latestFgClass != null ? latestFgClass : "";
                return lastKnownForegroundPackage;
            }
            if (lastKnownForegroundPackage == null || lastKnownForegroundPackage.isEmpty()) {
                List<UsageStats> stats = usm.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, end - 60000L, end);
                if (stats != null && !stats.isEmpty()) {
                    UsageStats recent = null;
                    for (UsageStats s : stats) {
                        String p = s.getPackageName();
                        if (isTransientSystemUiOrKeyboard(p)) continue;
                        if (recent == null || s.getLastTimeUsed() > recent.getLastTimeUsed()) {
                            recent = s;
                        }
                    }
                    if (recent != null && recent.getPackageName() != null) {
                        lastKnownForegroundPackage = recent.getPackageName();
                    }
                }
            }
            return lastKnownForegroundPackage;
        } catch (Exception ignored) {
            return lastKnownForegroundPackage;
        }
    }

    @Override
    public void onDestroy() {
        watchdogActive = false;
        watchdogHandler.removeCallbacks(checkTask);
        hideOverlayShield();
        hideGentleUsageReminderCard();
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}

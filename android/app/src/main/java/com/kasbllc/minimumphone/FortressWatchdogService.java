package com.kasbllc.minimumphone;

import android.app.ActivityManager;
import android.app.Service;
import android.app.usage.UsageEvents;
import android.app.usage.UsageStatsManager;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.provider.Settings;

import java.util.Calendar;
import java.util.Locale;

/**
 * Real-Time System Settings & Night DNS Watchdog Service (Google Play Policy Compliant — No VpnService).
 * 1. Detects if com.android.settings or packageinstaller is opened (even from the top status bar)
 *    while Private DNS Lock or Night System Settings Lock is active, and immediately covers it
 *    with Minimum Phone's Physical QR Fortress Modal.
 * 2. Automatically restores Private DNS (Settings.Global) at night (22:00 - 06:00) if removed,
 *    and blocks all browsers at the OS level if Private DNS was tampered with until restored.
 */
public class FortressWatchdogService extends Service {

    public static final String PREFS_NAME = "minimum_phone_fortress";
    public static final String KEY_LOCK_SETTINGS = "lock_system_settings";
    public static final String KEY_AUTO_DNS_NIGHT = "auto_dns_night";
    public static final String KEY_DNS_SHIELD_ACTIVE = "dns_shield_active";
    public static final String KEY_TEMP_UNLOCK_UNTIL_MS = "temp_unlock_until_ms";
    public static final String KEY_WATCHDOG_ENABLED = "watchdog_enabled";
    public static final String KEY_LOCK_SYSTEM_SETTINGS = KEY_LOCK_SETTINGS;
    public static final String KEY_AUTO_NIGHT_DNS_VPN = KEY_AUTO_DNS_NIGHT;
    public static final String KEY_NIGHT_START_HOUR = "night_start_hour";
    public static final String KEY_NIGHT_END_HOUR = "night_end_hour";

    private static volatile boolean watchdogActive = false;

    private final Handler watchdogHandler = new Handler(Looper.getMainLooper());
    private long lastInterceptMs = 0L;
    private long lastNightDnsCheckMs = 0L;

    private final Runnable checkTask = new Runnable() {
        @Override
        public void run() {
            try {
                performWatchdogTick();
            } catch (Exception ignored) {}
            watchdogHandler.postDelayed(this, 450L);
        }
    };

    @Override
    public void onCreate() {
        super.onCreate();
        watchdogActive = true;
        watchdogHandler.post(checkTask);
    }

    public static boolean isWatchdogActive() {
        return watchdogActive;
    }

    public static boolean isDnsShieldPrefActive(Context ctx) {
        try {
            SharedPreferences prefs = ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            return prefs.getBoolean(KEY_DNS_SHIELD_ACTIVE, true);
        } catch (Exception ignored) {
            return true;
        }
    }

    public static void setDnsShieldPrefActive(Context ctx, boolean active) {
        try {
            SharedPreferences prefs = ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            prefs.edit().putBoolean(KEY_DNS_SHIELD_ACTIVE, active).apply();
        } catch (Exception ignored) {}
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        return START_STICKY;
    }

    private void performWatchdogTick() {
        Context ctx = getApplicationContext();
        SharedPreferences prefs = ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        boolean lockSettings = prefs.getBoolean(KEY_LOCK_SETTINGS, true);
        boolean autoDnsNight = prefs.getBoolean(KEY_AUTO_DNS_NIGHT, true);
        boolean dnsShieldActive = prefs.getBoolean(KEY_DNS_SHIELD_ACTIVE, true);
        int startH = prefs.getInt(KEY_NIGHT_START_HOUR, 22);
        int endH = prefs.getInt(KEY_NIGHT_END_HOUR, 6);
        long tempUnlockUntilMs = prefs.getLong(KEY_TEMP_UNLOCK_UNTIL_MS, 0L);
        long now = System.currentTimeMillis();

        int hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY);
        boolean isNightWindow = (startH > endH)
            ? (hour >= startH || hour < endH)
            : (hour >= startH && hour < endH);

        // 1. Every 6 seconds at night (or if DNS shield is active), verify & auto-restore Private DNS if removed
        if ((isNightWindow && autoDnsNight) && (now - lastNightDnsCheckMs > 6000L)) {
            lastNightDnsCheckMs = now;
            ensurePrivateDnsActiveAtNight(ctx);
        }

        // 2. Check if user is inside a temporary 35-second setup/unlock window
        if (now < tempUnlockUntilMs) {
            return;
        }

        // 3. Detect foreground package via UsageStatsManager (when Usage Access is granted)
        String fgPkg = getCurrentForegroundPackage(ctx);
        if (fgPkg == null || fgPkg.isEmpty()) return;

        String lowerPkg = fgPkg.toLowerCase(Locale.ROOT);
        if (lowerPkg.contains("minimumphone")) return;

        boolean isSystemSettingsOrInstaller =
            lowerPkg.equals("com.android.settings") ||
            lowerPkg.equals("com.samsung.android.settings") ||
            lowerPkg.equals("com.miui.securitycenter") ||
            lowerPkg.contains("packageinstaller");

        boolean isBrowserApp =
            lowerPkg.contains("chrome") ||
            lowerPkg.contains("firefox") ||
            lowerPkg.contains("brave") ||
            lowerPkg.contains("sbrowser") ||
            lowerPkg.contains("opera") ||
            lowerPkg.contains("emmx") ||
            lowerPkg.contains("duckduckgo") ||
            lowerPkg.contains("ucmobile") ||
            lowerPkg.contains("browser");

        // Block System Settings if locked or during Night Fortress window
        boolean shouldInterceptSettings = isSystemSettingsOrInstaller && (lockSettings || isNightWindow);

        // Also block any Browser at the OS level if Private DNS was removed while Night Auto-DNS or DNS Shield is active
        boolean shouldInterceptTamperedDnsBrowser = false;
        if (isBrowserApp && (isNightWindow || dnsShieldActive) && autoDnsNight) {
            if (!isOsPrivateDnsConfigured(ctx)) {
                ensurePrivateDnsActiveAtNight(ctx);
                shouldInterceptTamperedDnsBrowser = !isOsPrivateDnsConfigured(ctx);
            }
        }

        if ((shouldInterceptSettings || shouldInterceptTamperedDnsBrowser) && (now - lastInterceptMs > 1200L)) {
            lastInterceptMs = now;
            try {
                ActivityManager am = (ActivityManager) ctx.getSystemService(Context.ACTIVITY_SERVICE);
                if (am != null) {
                    am.killBackgroundProcesses(fgPkg);
                }
            } catch (Exception ignored) {}

            Intent homeIntent = new Intent(ctx, MainActivity.class);
            homeIntent.setAction(Intent.ACTION_MAIN);
            homeIntent.addCategory(Intent.CATEGORY_HOME);
            homeIntent.addFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK |
                Intent.FLAG_ACTIVITY_SINGLE_TOP |
                Intent.FLAG_ACTIVITY_CLEAR_TOP
            );
            homeIntent.putExtra("intercepted_system_settings", true);
            ctx.startActivity(homeIntent);
        }
    }

    public static boolean isOsPrivateDnsConfigured(Context ctx) {
        try {
            String mode = Settings.Global.getString(ctx.getContentResolver(), "private_dns_mode");
            String spec = Settings.Global.getString(ctx.getContentResolver(), "private_dns_specifier");
            return "hostname".equalsIgnoreCase(mode) && spec != null && !spec.trim().isEmpty();
        } catch (Exception ignored) {
            return false;
        }
    }

    public static void ensurePrivateDnsActiveAtNight(Context ctx) {
        try {
            setDnsShieldPrefActive(ctx, true);
            if (!isOsPrivateDnsConfigured(ctx)) {
                try {
                    Settings.Global.putString(ctx.getContentResolver(), "private_dns_mode", "hostname");
                    Settings.Global.putString(ctx.getContentResolver(), "private_dns_specifier", "family.cloudflare-dns.com");
                } catch (Exception ignored) {}

                try {
                    ClipboardManager clipboard = (ClipboardManager) ctx.getSystemService(Context.CLIPBOARD_SERVICE);
                    if (clipboard != null) {
                        ClipData clip = ClipData.newPlainText("Minimum Phone Family DNS", "family.cloudflare-dns.com");
                        clipboard.setPrimaryClip(clip);
                    }
                } catch (Exception ignored) {}
            }
        } catch (Exception ignored) {}
    }

    private String getCurrentForegroundPackage(Context ctx) {
        try {
            UsageStatsManager usm = (UsageStatsManager) ctx.getSystemService(Context.USAGE_STATS_SERVICE);
            if (usm == null) return null;
            long end = System.currentTimeMillis();
            long begin = end - 4000L;
            UsageEvents events = usm.queryEvents(begin, end);
            if (events == null) return null;
            UsageEvents.Event event = new UsageEvents.Event();
            String lastMovedToFg = null;
            while (events.hasNextEvent()) {
                events.getNextEvent(event);
                if (event.getEventType() == UsageEvents.Event.MOVE_TO_FOREGROUND) {
                    lastMovedToFg = event.getPackageName();
                }
            }
            return lastMovedToFg;
        } catch (Exception ignored) {
            return null;
        }
    }

    @Override
    public void onDestroy() {
        watchdogActive = false;
        watchdogHandler.removeCallbacks(checkTask);
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}

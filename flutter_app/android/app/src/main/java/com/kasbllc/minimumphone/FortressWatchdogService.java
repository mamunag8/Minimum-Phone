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
 * Real-Time 350ms OS Watchdog Service for Safe Private DNS & System Settings Fortress.
 * 1. Intercepts com.android.settings / packageinstaller in <350ms with NativeFortressLockActivity.
 * 2. Auto-restores Safe Private DNS (family.cloudflare-dns.com) at night (22:00 - 06:00) and
 *    blocks all browsers at the OS level if Safe Private DNS is ever turned off or removed.
 */
public class FortressWatchdogService extends Service {

    public static final String PREFS_NAME = "minimum_phone_fortress";
    public static final String KEY_LOCK_SETTINGS = "lock_system_settings";
    public static final String KEY_AUTO_DNS_NIGHT = "auto_dns_night";
    public static final String KEY_DNS_SHIELD_ACTIVE = "dns_shield_active";
    public static final String KEY_EXPECTED_DNS_HOST = "expected_dns_host";
    public static final String KEY_QR_CODE = "qr_anchor_code";
    public static final String KEY_TEMP_UNLOCK_UNTIL_MS = "temp_unlock_until_ms";
    public static final String KEY_WATCHDOG_ENABLED = "watchdog_enabled";
    public static final String KEY_NIGHT_START_HOUR = "night_start_hour";
    public static final String KEY_NIGHT_END_HOUR = "night_end_hour";
    public static final String KEY_APP_STATE_JSON = "flutter_app_state_v2";

    private static volatile boolean watchdogActive = false;

    private final Handler watchdogHandler = new Handler(Looper.getMainLooper());
    private long lastInterceptMs = 0L;
    private long lastNightDnsCheckMs = 0L;
    private boolean lastKnownOsDnsValid = false;

    private final Runnable checkTask = new Runnable() {
        @Override
        public void run() {
            try {
                performWatchdogTick();
            } catch (Exception ignored) {}
            watchdogHandler.postDelayed(this, 350L);
        }
    };

    @Override
    public void onCreate() {
        super.onCreate();
        watchdogActive = true;
        lastKnownOsDnsValid = isOsPrivateDnsConfigured(getApplicationContext());
        watchdogHandler.post(checkTask);
    }

    public static boolean isWatchdogActive() {
        return watchdogActive;
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

        boolean currentOsDnsValid = isOsPrivateDnsConfigured(ctx);

        // If user was in temporary setup lease to paste Private DNS and just saved it, auto-lock Settings immediately!
        if (!lastKnownOsDnsValid && currentOsDnsValid && now < tempUnlockUntilMs) {
            lastKnownOsDnsValid = true;
            prefs.edit().putLong(KEY_TEMP_UNLOCK_UNTIL_MS, 0L).apply();
            Intent homeIntent = new Intent(ctx, MainActivity.class);
            homeIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            ctx.startActivity(homeIntent);
            return;
        }
        lastKnownOsDnsValid = currentOsDnsValid;

        // 1. Every 5 seconds at night (or if DNS shield is active), verify & auto-restore Safe Private DNS if removed
        if ((isNightWindow || dnsShieldActive) && autoDnsNight && (now - lastNightDnsCheckMs > 5000L)) {
            lastNightDnsCheckMs = now;
            if (!currentOsDnsValid) {
                ensurePrivateDnsActiveAtNight(ctx);
                currentOsDnsValid = isOsPrivateDnsConfigured(ctx);
            }
        }

        // 2. Check if user is inside a temporary 35-second setup/unlock window
        if (now < tempUnlockUntilMs) {
            return;
        }

        // 3. Detect foreground package via UsageStatsManager
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

        boolean shouldInterceptSettings = isSystemSettingsOrInstaller && (lockSettings || isNightWindow || dnsShieldActive);
        boolean shouldInterceptUnprotectedBrowser = isBrowserApp && (dnsShieldActive || isNightWindow) && !currentOsDnsValid;

        if ((shouldInterceptSettings || shouldInterceptUnprotectedBrowser) && (now - lastInterceptMs > 900L)) {
            lastInterceptMs = now;
            try {
                ActivityManager am = (ActivityManager) ctx.getSystemService(Context.ACTIVITY_SERVICE);
                if (am != null) {
                    am.killBackgroundProcesses(fgPkg);
                }
            } catch (Exception ignored) {}

            Intent lockIntent = new Intent(ctx, NativeFortressLockActivity.class);
            lockIntent.addFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK |
                Intent.FLAG_ACTIVITY_CLEAR_TOP |
                Intent.FLAG_ACTIVITY_SINGLE_TOP
            );
            lockIntent.putExtra(
                "intercept_reason",
                shouldInterceptUnprotectedBrowser ? "dns_removed" : "settings_locked"
            );
            ctx.startActivity(lockIntent);
        }
    }

    public static boolean isOsPrivateDnsConfigured(Context ctx) {
        try {
            String mode = Settings.Global.getString(ctx.getContentResolver(), "private_dns_mode");
            String spec = Settings.Global.getString(ctx.getContentResolver(), "private_dns_specifier");
            if (!"hostname".equalsIgnoreCase(mode) || spec == null) return false;
            String clean = spec.trim().toLowerCase(Locale.ROOT);
            return clean.contains("cloudflare") ||
                   clean.contains("cleanbrowsing") ||
                   clean.contains("adguard") ||
                   clean.contains("1dot1dot1dot1") ||
                   clean.contains("family") ||
                   clean.contains("adult") ||
                   !clean.isEmpty();
        } catch (Exception ignored) {
            return false;
        }
    }

    public static String getOsPrivateDnsHost(Context ctx) {
        try {
            String spec = Settings.Global.getString(ctx.getContentResolver(), "private_dns_specifier");
            return spec != null ? spec.trim() : "";
        } catch (Exception ignored) {
            return "";
        }
    }

    public static String getOsPrivateDnsMode(Context ctx) {
        try {
            String mode = Settings.Global.getString(ctx.getContentResolver(), "private_dns_mode");
            return mode != null ? mode.trim().toLowerCase(Locale.ROOT) : "unknown";
        } catch (Exception ignored) {
            return "unknown";
        }
    }

    public static boolean ensurePrivateDnsActiveAtNight(Context ctx) {
        try {
            SharedPreferences prefs = ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String expectedHost = prefs.getString(KEY_EXPECTED_DNS_HOST, "family.cloudflare-dns.com");
            if (expectedHost == null || expectedHost.trim().isEmpty()) {
                expectedHost = "family.cloudflare-dns.com";
            }

            if (!isOsPrivateDnsConfigured(ctx)) {
                try {
                    boolean m = Settings.Global.putString(ctx.getContentResolver(), "private_dns_mode", "hostname");
                    boolean s = Settings.Global.putString(ctx.getContentResolver(), "private_dns_specifier", expectedHost.trim());
                    if (m && s) return true;
                } catch (Exception ignored) {}

                try {
                    ClipboardManager clipboard = (ClipboardManager) ctx.getSystemService(Context.CLIPBOARD_SERVICE);
                    if (clipboard != null) {
                        ClipData clip = ClipData.newPlainText("Minimum Phone Safe Private DNS", expectedHost.trim());
                        clipboard.setPrimaryClip(clip);
                    }
                } catch (Exception ignored) {}
            } else {
                return true;
            }
        } catch (Exception ignored) {}
        return isOsPrivateDnsConfigured(ctx);
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

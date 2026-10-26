package com.kasbllc.minimumphone;

import android.app.ActivityManager;
import android.app.Service;
import android.app.usage.UsageEvents;
import android.app.usage.UsageStats;
import android.app.usage.UsageStatsManager;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.ConnectivityManager;
import android.net.LinkProperties;
import android.net.Network;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.provider.Settings;
import android.widget.Toast;

import java.util.Calendar;
import java.util.List;
import java.util.Locale;

/**
 * Real-Time 250ms OS Watchdog Service for Safe Private DNS & System Settings Fortress.
 * 1. Reads real OS Private DNS status via Android ConnectivityManager.getLinkProperties() + Settings.Global.
 * 2. Stateful foreground app tracking (remembers foreground package across ticks so Settings can never stay open).
 * 3. Intercepts com.android.settings and unprotected browsers in <250ms with NativeFortressLockActivity.
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
    public static final String KEY_EMERGENCY_LOCKDOWN_UNTIL_MS = "emergency_lockdown_until_ms";
    public static final String KEY_USER_VERIFIED_DNS_HOST = "user_verified_dns_host";
    public static final String KEY_WATCHDOG_ENABLED = "watchdog_enabled";
    public static final String KEY_NIGHT_START_HOUR = "night_start_hour";
    public static final String KEY_NIGHT_END_HOUR = "night_end_hour";
    public static final String KEY_APP_STATE_JSON = "flutter_app_state_v2";

    private static volatile boolean watchdogActive = false;

    private final Handler watchdogHandler = new Handler(Looper.getMainLooper());
    private long lastInterceptMs = 0L;
    private long lastNightDnsCheckMs = 0L;
    private boolean lastKnownOsDnsValid = false;
    private String lastKnownForegroundPackage = "";

    private final Runnable checkTask = new Runnable() {
        @Override
        public void run() {
            try {
                performWatchdogTick();
            } catch (Exception ignored) {}
            watchdogHandler.postDelayed(this, 250L);
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
        watchdogActive = true;
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
        String tempReason = prefs.getString(KEY_TEMP_UNLOCK_REASON, "");
        long emergencyUntilMs = prefs.getLong(KEY_EMERGENCY_LOCKDOWN_UNTIL_MS, 0L);
        long now = System.currentTimeMillis();

        int hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY);
        boolean isNightWindow = (startH > endH)
            ? (hour >= startH || hour < endH)
            : (hour >= startH && hour < endH);
        boolean isEmergencyLockdown = now < emergencyUntilMs;

        boolean currentOsDnsValid = isOsPrivateDnsConfigured(ctx);

        // If user was in temporary DNS setup lease and just saved Private DNS in Android Settings, auto-close Settings & lock!
        if (!lastKnownOsDnsValid && currentOsDnsValid && now < tempUnlockUntilMs && "dns_setup".equals(tempReason)) {
            lastKnownOsDnsValid = true;
            prefs.edit()
                .putLong(KEY_TEMP_UNLOCK_UNTIL_MS, 0L)
                .putString(KEY_TEMP_UNLOCK_REASON, "")
                .putBoolean(KEY_LOCK_SETTINGS, true)
                .apply();
            Toast.makeText(ctx, "🛡️ Safe Private DNS Active! Settings Auto-Locked.", Toast.LENGTH_LONG).show();
            Intent homeIntent = new Intent(ctx, MainActivity.class);
            homeIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            ctx.startActivity(homeIntent);
            return;
        }
        lastKnownOsDnsValid = currentOsDnsValid;

        // 1. Every 5 seconds at night (or if DNS shield is active), attempt auto-restore if WRITE_SECURE_SETTINGS is available
        if ((isNightWindow || dnsShieldActive) && autoDnsNight && (now - lastNightDnsCheckMs > 5000L)) {
            lastNightDnsCheckMs = now;
            if (!currentOsDnsValid) {
                ensurePrivateDnsActiveAtNight(ctx);
                currentOsDnsValid = isOsPrivateDnsConfigured(ctx);
            }
        }

        // 2. Check if user is inside a temporary setup/unlock lease (e.g. granting Usage Access, Overlay, Wi-Fi, or pasting DNS)
        if (now < tempUnlockUntilMs) {
            return;
        }

        // 3. Detect foreground package via stateful UsageStatsManager
        String fgPkg = getCurrentForegroundPackage(ctx);
        if (fgPkg == null || fgPkg.isEmpty()) return;

        String lowerPkg = fgPkg.toLowerCase(Locale.ROOT);
        if (lowerPkg.contains("minimumphone")) return;

        // Never intercept system permission controller / role manager dialogs
        if (lowerPkg.contains("permissioncontroller") ||
            lowerPkg.contains("packageinstaller") && now < tempUnlockUntilMs) {
            return;
        }

        boolean isSystemSettings =
            lowerPkg.equals("com.android.settings") ||
            lowerPkg.equals("com.samsung.android.settings") ||
            lowerPkg.equals("com.miui.securitycenter") ||
            lowerPkg.equals("com.coloros.safecenter") ||
            lowerPkg.equals("com.vivo.abe");

        boolean isBrowserApp =
            lowerPkg.contains("chrome") ||
            lowerPkg.contains("firefox") ||
            lowerPkg.contains("brave") ||
            lowerPkg.contains("sbrowser") ||
            lowerPkg.contains("opera") ||
            lowerPkg.contains("emmx") ||
            lowerPkg.contains("duckduckgo") ||
            lowerPkg.contains("ucmobile") ||
            lowerPkg.contains("kiwi") ||
            lowerPkg.contains("vivaldi") ||
            lowerPkg.contains("browser");

        boolean shouldInterceptSettings = isSystemSettings && (lockSettings || isNightWindow || isEmergencyLockdown);
        boolean shouldInterceptBrowser = isBrowserApp && (isEmergencyLockdown || ((dnsShieldActive || isNightWindow) && !currentOsDnsValid));

        if ((shouldInterceptSettings || shouldInterceptBrowser) && (now - lastInterceptMs > 700L)) {
            lastInterceptMs = now;
            // Reset cached foreground package so if user stays in Settings, next tick re-checks cleanly
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
                shouldInterceptBrowser ? "dns_removed" : "settings_locked"
            );
            lockIntent.putExtra("intercepted_pkg", fgPkg);
            ctx.startActivity(lockIntent);
        }
    }

    /**
     * Checks if Safe Private DNS (DNS-over-TLS) is currently active on the Android OS.
     * Uses 3 layers:
     * Layer 1: Official Android 9+ ConnectivityManager.getLinkProperties() (works on ALL modern phones without root/ADB!).
     * Layer 2: Settings.Global "private_dns_mode" & "private_dns_specifier".
     * Layer 3: User-verified DNS state stored when OS hides hostname on disconnected networks.
     */
    public static boolean isOsPrivateDnsConfigured(Context ctx) {
        try {
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
                                // Persist discovered OS DNS host so UI always shows it even if offline later
                                SharedPreferences prefs = ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
                                prefs.edit().putString(KEY_USER_VERIFIED_DNS_HOST, tlsHost.trim()).apply();
                                return true;
                            }
                            if (lp.isPrivateDnsActive()) {
                                SharedPreferences prefs = ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
                                String verified = prefs.getString(KEY_USER_VERIFIED_DNS_HOST, "");
                                if (verified != null && !verified.isEmpty()) {
                                    return true;
                                }
                            }
                        }
                    }
                }
            }

            // Layer 2: Settings.Global fallback
            String mode = Settings.Global.getString(ctx.getContentResolver(), "private_dns_mode");
            String spec = Settings.Global.getString(ctx.getContentResolver(), "private_dns_specifier");
            if ("hostname".equalsIgnoreCase(mode) && spec != null && !spec.trim().isEmpty()) {
                return true;
            }

            // Layer 3: Check if user explicitly confirmed DNS setup inside Minimum Phone
            SharedPreferences prefs = ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String manualVerifiedHost = prefs.getString(KEY_USER_VERIFIED_DNS_HOST, "");
            if (manualVerifiedHost != null && !manualVerifiedHost.trim().isEmpty()) {
                // Only invalidate if LinkProperties explicitly shows an active network with Private DNS OFF and serverName == null
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                    ConnectivityManager cm = (ConnectivityManager) ctx.getSystemService(Context.CONNECTIVITY_SERVICE);
                    if (cm != null) {
                        Network activeNet = cm.getActiveNetwork();
                        if (activeNet != null) {
                            LinkProperties lp = cm.getLinkProperties(activeNet);
                            if (lp != null && !lp.isPrivateDnsActive() && lp.getPrivateDnsServerName() == null) {
                                // OS explicitly reports Private DNS is turned off on active network!
                                return false;
                            }
                        }
                    }
                }
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

            if (!isOsPrivateDnsConfigured(ctx)) {
                try {
                    boolean m = Settings.Global.putString(ctx.getContentResolver(), "private_dns_mode", "hostname");
                    boolean s = Settings.Global.putString(ctx.getContentResolver(), "private_dns_specifier", expectedHost.trim());
                    if (m && s) {
                        prefs.edit().putString(KEY_USER_VERIFIED_DNS_HOST, expectedHost.trim()).apply();
                        return true;
                    }
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
            if (usm == null) return lastKnownForegroundPackage;
            long end = System.currentTimeMillis();
            long begin = end - 15000L;
            UsageEvents events = usm.queryEvents(begin, end);
            String latestMovedToFg = null;
            if (events != null) {
                UsageEvents.Event event = new UsageEvents.Event();
                while (events.hasNextEvent()) {
                    events.getNextEvent(event);
                    int type = event.getEventType();
                    if (type == UsageEvents.Event.MOVE_TO_FOREGROUND || type == 1 /* ACTIVITY_RESUMED */) {
                        String pkg = event.getPackageName();
                        if (pkg != null && !pkg.isEmpty()) {
                            latestMovedToFg = pkg;
                        }
                    }
                }
            }
            if (latestMovedToFg != null) {
                lastKnownForegroundPackage = latestMovedToFg;
                return lastKnownForegroundPackage;
            }
            if (lastKnownForegroundPackage == null || lastKnownForegroundPackage.isEmpty()) {
                List<UsageStats> stats = usm.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, end - 60000L, end);
                if (stats != null && !stats.isEmpty()) {
                    UsageStats recent = null;
                    for (UsageStats s : stats) {
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
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}

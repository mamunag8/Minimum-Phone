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
import android.net.ConnectivityManager;
import android.net.LinkProperties;
import android.net.Network;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.Process;
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
    public static final String KEY_SLEEP_SCHEDULE_ENABLED = "sleep_schedule_enabled";
    public static final String KEY_STRICT_QR_247 = "strict_qr_247";
    public static final String KEY_MONK_MODE_UNTIL_MS = "monk_mode_until_ms";
    public static final String KEY_NIGHT_LOCKED_PACKAGES = "night_locked_packages";
    public static final String KEY_QR_VERIFIED_UNLOCK_UNTIL_MS = "qr_verified_unlock_until_ms";
    public static final String KEY_APP_STATE_JSON = "flutter_app_state_v2";

    private static volatile boolean watchdogActive = false;

    private final Handler watchdogHandler = new Handler(Looper.getMainLooper());
    private long lastInterceptMs = 0L;
    private long lastNightDnsCheckMs = 0L;
    private boolean lastKnownOsDnsValid = false;
    private boolean lastKnownUsageGranted = false;
    private boolean lastKnownOverlayGranted = false;
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
        long emergencyUntilMs = prefs.getLong(KEY_EMERGENCY_LOCKDOWN_UNTIL_MS, 0L);
        long now = System.currentTimeMillis();

        int hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY);
        boolean isNightWindow = (startH > endH)
            ? (hour >= startH || hour < endH)
            : (hour >= startH && hour < endH);
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
            Toast.makeText(ctx, "✅ Usage Access Activated! Returning to Minimum Phone.", Toast.LENGTH_SHORT).show();
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
            Toast.makeText(ctx, "✅ Appear on Top Activated! Returning to Minimum Phone.", Toast.LENGTH_SHORT).show();
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
            Toast.makeText(ctx, "🛡️ Safe Private DNS Active! Settings Auto-Locked.", Toast.LENGTH_LONG).show();
            Intent homeIntent = new Intent(ctx, MainActivity.class);
            homeIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            ctx.startActivity(homeIntent);
            return;
        }

        // C. CRITICAL ANTI-TAMPER: If DNS WAS valid and just turned OFF, immediately revoke any temporary unlock lease!
        if (lastKnownOsDnsValid && !currentOsDnsValid) {
            lastKnownOsDnsValid = false;
            tempUnlockUntilMs = 0L;
            prefs.edit()
                .putLong(KEY_TEMP_UNLOCK_UNTIL_MS, 0L)
                .putString(KEY_TEMP_UNLOCK_REASON, "")
                .putString(KEY_USER_VERIFIED_DNS_HOST, "")
                .putBoolean(KEY_LOCK_SETTINGS, true)
                .apply();
        } else {
            lastKnownOsDnsValid = currentOsDnsValid;
        }

        // 1. Every 3 seconds at night (or if DNS shield is active), auto-restore Safe Private DNS if modified during daytime
        if ((isNightWindow || dnsShieldActive) && autoDnsNight && (now - lastNightDnsCheckMs > 3000L)) {
            lastNightDnsCheckMs = now;
            if (!currentOsDnsValid) {
                ensurePrivateDnsActiveAtNight(ctx);
                currentOsDnsValid = isOsPrivateDnsConfigured(ctx);
            }
        }

        // 2. Check if user is inside a verified temporary setup/unlock lease
        if (now < tempUnlockUntilMs) {
            return;
        }

        // 3. Detect foreground package via stateful UsageStatsManager
        String fgPkg = getCurrentForegroundPackage(ctx);
        if (fgPkg == null || fgPkg.isEmpty()) return;

        String lowerPkg = fgPkg.toLowerCase(Locale.ROOT);

        // If at Night (22:00-06:00) Safe Private DNS was turned off during daytime and could not be silently written,
        // intercept any external app (or Settings if not in dns_setup lease) to force immediate Safe DNS restoration!
        if (isNightWindow && autoDnsNight && !currentOsDnsValid && !lowerPkg.contains("minimumphone")
                && !lowerPkg.contains("permissioncontroller") && (now - lastInterceptMs > 800L)) {
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
            return;
        }

        if (lowerPkg.contains("minimumphone")) return;

        // Never intercept system permission controller / role manager / print spooler dialogs
        if (lowerPkg.contains("permissioncontroller") ||
            lowerPkg.contains("printspooler") ||
            lowerPkg.contains("printservice") ||
            (lowerPkg.contains("packageinstaller") && now < tempUnlockUntilMs)) {
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
            lowerPkg.contains("wirelesssettings");

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

        boolean isNightLockedApp = false;
        if ((isNightWindow && sleepScheduleEnabled) || isMonkActive) {
            if (now >= qrVerifiedUnlockUntilMs && nightLockedCsv != null && !nightLockedCsv.isEmpty()) {
                String[] lockedPkgs = nightLockedCsv.split(",");
                for (String p : lockedPkgs) {
                    String trimmed = p.trim().toLowerCase(Locale.ROOT);
                    if (!trimmed.isEmpty() && lowerPkg.equals(trimmed)) {
                        isNightLockedApp = true;
                        break;
                    }
                }
            }
        }

        boolean shouldInterceptSettings = isSystemSettings && (lockSettings || isNightWindow || isEmergencyLockdown || strictQr247 || isMonkActive);
        boolean shouldInterceptBrowser = isBrowserApp && (isEmergencyLockdown || isMonkActive || ((dnsShieldActive || isNightWindow) && !currentOsDnsValid));

        if ((shouldInterceptSettings || shouldInterceptBrowser || isNightLockedApp) && (now - lastInterceptMs > 600L)) {
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
            String reason = "settings_locked";
            if (shouldInterceptBrowser) {
                reason = "dns_removed";
            } else if (isNightLockedApp) {
                reason = "night_app_locked";
            }
            lockIntent.putExtra("intercept_reason", reason);
            lockIntent.putExtra("intercepted_pkg", fgPkg);
            ctx.startActivity(lockIntent);
        }
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
                                // On an active network, if getPrivateDnsServerName() is null, Private DNS is either OFF or Automatic!
                                // Check Settings.Global first; if not explicitly hostname mode, invalidate!
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

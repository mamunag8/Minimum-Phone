package com.kasbllc.minimumphone;

import android.app.ActivityManager;
import android.app.AppOpsManager;
import android.app.role.RoleManager;
import android.app.usage.UsageStats;
import android.app.usage.UsageStatsManager;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.net.Uri;
import android.os.BatteryManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.Process;
import android.provider.AlarmClock;
import android.provider.CalendarContract;
import android.provider.MediaStore;
import android.provider.Settings;
import android.widget.Toast;

import androidx.annotation.NonNull;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import io.flutter.embedding.android.FlutterActivity;
import io.flutter.embedding.engine.FlutterEngine;
import io.flutter.plugin.common.MethodCall;
import io.flutter.plugin.common.MethodChannel;

public class MainActivity extends FlutterActivity {

    private static final String CHANNEL = "com.kasbllc.minimumphone/native";
    private final Handler sessionHandler = new Handler(Looper.getMainLooper());
    private Runnable activeReturnRunnable = null;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        NightFortressReceiver.startWatchdogSafely(this);
        NightFortressReceiver.scheduleNightAlarm(this, 22);
    }

    @Override
    protected void onResume() {
        super.onResume();
        NightFortressReceiver.startWatchdogSafely(this);
    }

    @Override
    public void configureFlutterEngine(@NonNull FlutterEngine flutterEngine) {
        super.configureFlutterEngine(flutterEngine);

        new MethodChannel(flutterEngine.getDartExecutor().getBinaryMessenger(), CHANNEL)
            .setMethodCallHandler(new MethodChannel.MethodCallHandler() {
                @Override
                public void onMethodCall(@NonNull MethodCall call, @NonNull MethodChannel.Result result) {
                    Context ctx = getApplicationContext();
                    switch (call.method) {
                        case "getLauncherStatus":
                            result.success(buildStatusMap(ctx));
                            break;

                        case "loadAppStateJson": {
                            SharedPreferences prefs = ctx.getSharedPreferences(FortressWatchdogService.PREFS_NAME, Context.MODE_PRIVATE);
                            String json = prefs.getString(FortressWatchdogService.KEY_APP_STATE_JSON, "");
                            result.success(json != null ? json : "");
                            break;
                        }

                        case "saveAppStateJson": {
                            String json = call.argument("json");
                            SharedPreferences prefs = ctx.getSharedPreferences(FortressWatchdogService.PREFS_NAME, Context.MODE_PRIVATE);
                            prefs.edit().putString(FortressWatchdogService.KEY_APP_STATE_JSON, json != null ? json : "").apply();
                            result.success(true);
                            break;
                        }

                        case "getInstalledApps":
                            result.success(loadInstalledAppsList(ctx));
                            break;

                        case "launchApp": {
                            String pkg = call.argument("packageName");
                            String appId = call.argument("appId");
                            Integer mins = call.argument("sessionMinutes");
                            boolean ok = launchAndroidApp(ctx, pkg, appId, mins != null ? mins : 15);
                            result.success(ok);
                            break;
                        }

                        case "activateSafePrivateDns": {
                            String host = call.argument("host");
                            if (host == null || host.trim().isEmpty()) {
                                host = call.argument("hostname");
                            }
                            if (host == null || host.trim().isEmpty()) {
                                host = "family.cloudflare-dns.com";
                            }
                            Boolean openOpt = call.argument("openSettingsIfNeeded");
                            boolean openSettingsIfNeeded = (openOpt == null) ? true : openOpt;
                            result.success(activateSafePrivateDns(ctx, host.trim(), openSettingsIfNeeded));
                            break;
                        }

                        case "confirmManualDnsSetup": {
                            String host = call.argument("host");
                            if (host == null || host.trim().isEmpty()) {
                                host = "family.cloudflare-dns.com";
                            }
                            SharedPreferences prefs = ctx.getSharedPreferences(FortressWatchdogService.PREFS_NAME, Context.MODE_PRIVATE);
                            prefs.edit()
                                .putString(FortressWatchdogService.KEY_USER_VERIFIED_DNS_HOST, host.trim())
                                .putString(FortressWatchdogService.KEY_EXPECTED_DNS_HOST, host.trim())
                                .putBoolean(FortressWatchdogService.KEY_LOCK_SETTINGS, true)
                                .putLong(FortressWatchdogService.KEY_TEMP_UNLOCK_UNTIL_MS, 0L)
                                .apply();
                            result.success(buildStatusMap(ctx));
                            break;
                        }

                        case "configureFortress": {
                            String host = call.argument("dnsHost");
                            if (host == null || host.isEmpty()) host = call.argument("expectedHost");

                            Boolean lockSettings = call.argument("phoneSettingsLocked");
                            if (lockSettings == null) lockSettings = call.argument("lockSystemSettings");

                            Boolean autoNightDns = call.argument("nightAutoDnsEnabled");
                            if (autoNightDns == null) autoNightDns = call.argument("autoNightDns");

                            Boolean dnsShieldActive = call.argument("dnsShieldActive");
                            String qrCode = call.argument("qrSecret");
                            if (qrCode == null || qrCode.isEmpty()) qrCode = call.argument("qrCode");

                            Number emergencyUntil = call.argument("emergencyLockdownUntil");
                            Integer startH = call.argument("nightStartHour");
                            Integer endH = call.argument("nightEndHour");

                            SharedPreferences prefs = ctx.getSharedPreferences(FortressWatchdogService.PREFS_NAME, Context.MODE_PRIVATE);
                            SharedPreferences.Editor ed = prefs.edit();
                            ed.putBoolean(FortressWatchdogService.KEY_WATCHDOG_ENABLED, true);
                            if (host != null && !host.isEmpty()) ed.putString(FortressWatchdogService.KEY_EXPECTED_DNS_HOST, host);
                            if (lockSettings != null) ed.putBoolean(FortressWatchdogService.KEY_LOCK_SETTINGS, lockSettings);
                            if (autoNightDns != null) ed.putBoolean(FortressWatchdogService.KEY_AUTO_DNS_NIGHT, autoNightDns);
                            if (dnsShieldActive != null) ed.putBoolean(FortressWatchdogService.KEY_DNS_SHIELD_ACTIVE, dnsShieldActive);
                            if (qrCode != null && !qrCode.isEmpty()) ed.putString(FortressWatchdogService.KEY_QR_CODE, qrCode);
                            if (emergencyUntil != null) ed.putLong(FortressWatchdogService.KEY_EMERGENCY_LOCKDOWN_UNTIL_MS, emergencyUntil.longValue());
                            if (startH != null) ed.putInt(FortressWatchdogService.KEY_NIGHT_START_HOUR, startH);
                            if (endH != null) ed.putInt(FortressWatchdogService.KEY_NIGHT_END_HOUR, endH);
                            ed.apply();

                            NightFortressReceiver.startWatchdogSafely(ctx);
                            NightFortressReceiver.scheduleNightAlarm(ctx, startH != null ? startH : 22);
                            result.success(buildStatusMap(ctx));
                            break;
                        }

                        case "openSafePhoneSetting": {
                            String target = call.argument("settingType");
                            if (target == null || target.isEmpty()) target = call.argument("target");
                            openSafePhoneSetting(ctx, target != null ? target : "wifi");
                            result.success(true);
                            break;
                        }

                        case "openNativeFortressLock": {
                            String reason = call.argument("reason");
                            Intent lockIntent = new Intent(ctx, NativeFortressLockActivity.class);
                            lockIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                            lockIntent.putExtra("intercept_reason", reason != null ? reason : "settings_locked");
                            startActivity(lockIntent);
                            result.success(true);
                            break;
                        }

                        case "requestDefaultLauncher":
                            requestDefaultHomeRole(ctx);
                            result.success(buildStatusMap(ctx));
                            break;

                        case "requestUsageStatsPermission": {
                            SharedPreferences prefs = ctx.getSharedPreferences(FortressWatchdogService.PREFS_NAME, Context.MODE_PRIVATE);
                            prefs.edit()
                                .putLong(FortressWatchdogService.KEY_TEMP_UNLOCK_UNTIL_MS, System.currentTimeMillis() + 60000L)
                                .putString(FortressWatchdogService.KEY_TEMP_UNLOCK_REASON, "usage_access")
                                .apply();
                            try {
                                Intent intent = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
                                intent.setData(Uri.parse("package:" + ctx.getPackageName()));
                                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                                startActivity(intent);
                            } catch (Exception e) {
                                try {
                                    Intent fallback = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
                                    fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                                    startActivity(fallback);
                                } catch (Exception ignored) {}
                            }
                            result.success(true);
                            break;
                        }

                        case "requestOverlayPermission": {
                            SharedPreferences prefs = ctx.getSharedPreferences(FortressWatchdogService.PREFS_NAME, Context.MODE_PRIVATE);
                            prefs.edit()
                                .putLong(FortressWatchdogService.KEY_TEMP_UNLOCK_UNTIL_MS, System.currentTimeMillis() + 60000L)
                                .putString(FortressWatchdogService.KEY_TEMP_UNLOCK_REASON, "overlay_permission")
                                .apply();
                            try {
                                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                                    Intent intent = new Intent(
                                        Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                                        Uri.parse("package:" + ctx.getPackageName())
                                    );
                                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                                    startActivity(intent);
                                }
                            } catch (Exception e) {
                                try {
                                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                                        Intent fallback = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION);
                                        fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                                        startActivity(fallback);
                                    }
                                } catch (Exception ignored) {}
                            }
                            result.success(true);
                            break;
                        }

                        case "toggleKioskPin": {
                            Boolean enableArg = call.argument("enable");
                            boolean currentlyPinned = isLockTaskModeRunning(ctx);
                            boolean enable = (enableArg != null) ? enableArg : !currentlyPinned;
                            try {
                                if (enable) {
                                    startLockTask();
                                } else {
                                    stopLockTask();
                                }
                            } catch (Exception ignored) {}
                            result.success(buildStatusMap(ctx));
                            break;
                        }

                        case "cleanBackgroundApps": {
                            int cleaned = cleanBackgroundAppsNow(ctx);
                            Map<String, Object> res = new HashMap<>();
                            res.put("cleanedCount", cleaned);
                            res.put("freedMb", cleaned * 18);
                            result.success(res);
                            break;
                        }

                        default:
                            result.notImplemented();
                            break;
                    }
                }
            });
    }

    private Map<String, Object> buildStatusMap(Context ctx) {
        Map<String, Object> map = new HashMap<>();
        boolean isDefault = isMyLauncherDefault(ctx);
        boolean usageGranted = isUsageStatsGranted(ctx);
        boolean overlayGranted = isOverlayPermissionGranted(ctx);
        boolean isPinned = isLockTaskModeRunning(ctx);

        int batteryPct = 85;
        boolean isCharging = false;
        try {
            BatteryManager bm = (BatteryManager) ctx.getSystemService(Context.BATTERY_SERVICE);
            if (bm != null) {
                int level = bm.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY);
                if (level > 0 && level <= 100) batteryPct = level;
            }
            Intent bStatus = ctx.registerReceiver(null, new IntentFilter(Intent.ACTION_BATTERY_CHANGED));
            if (bStatus != null) {
                int st = bStatus.getIntExtra(BatteryManager.EXTRA_STATUS, -1);
                isCharging = st == BatteryManager.BATTERY_STATUS_CHARGING || st == BatteryManager.BATTERY_STATUS_FULL;
            }
        } catch (Exception ignored) {}

        boolean osDnsValid = FortressWatchdogService.isOsPrivateDnsConfigured(ctx);
        String dnsHost = FortressWatchdogService.getOsPrivateDnsHost(ctx);
        String dnsMode = FortressWatchdogService.getOsPrivateDnsMode(ctx);
        boolean watchdogActive = FortressWatchdogService.isWatchdogActive();

        int hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY);
        boolean isNightNow = (hour >= 22 || hour < 6);

        // Unified keys for 100% compatibility
        map.put("isDefaultLauncher", isDefault);
        map.put("isUsageStatsGranted", usageGranted);
        map.put("hasUsageAccess", usageGranted);
        map.put("isOverlayGranted", overlayGranted);
        map.put("hasOverlayPermission", overlayGranted);
        map.put("isKioskPinned", isPinned);
        map.put("batteryLevel", batteryPct);
        map.put("isCharging", isCharging);
        map.put("privateDnsActive", osDnsValid);
        map.put("osDnsIsFamilySafe", osDnsValid);
        map.put("privateDnsHost", dnsHost);
        map.put("osDnsSpecifier", dnsHost);
        map.put("privateDnsMode", dnsMode);
        map.put("osDnsMode", dnsMode);
        map.put("watchdogActive", watchdogActive);
        map.put("isNightWindow", isNightNow);
        return map;
    }

    private Map<String, Object> activateSafePrivateDns(Context ctx, String targetHost, boolean openSettingsIfNeeded) {
        SharedPreferences prefs = ctx.getSharedPreferences(FortressWatchdogService.PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit()
            .putString(FortressWatchdogService.KEY_EXPECTED_DNS_HOST, targetHost)
            .putBoolean(FortressWatchdogService.KEY_DNS_SHIELD_ACTIVE, true)
            .putBoolean(FortressWatchdogService.KEY_AUTO_DNS_NIGHT, true)
            .putBoolean(FortressWatchdogService.KEY_LOCK_SETTINGS, true)
            .putBoolean(FortressWatchdogService.KEY_WATCHDOG_ENABLED, true)
            .apply();

        // 1. Copy targetHost to clipboard so user can paste in 1 tap
        try {
            ClipboardManager cb = (ClipboardManager) ctx.getSystemService(Context.CLIPBOARD_SERVICE);
            if (cb != null) {
                cb.setPrimaryClip(ClipData.newPlainText("Safe Private DNS", targetHost));
            }
        } catch (Exception ignored) {}

        // 2. Attempt direct Settings.Global write
        boolean autoApplied = FortressWatchdogService.ensurePrivateDnsActiveAtNight(ctx);
        NightFortressReceiver.startWatchdogSafely(ctx);
        NightFortressReceiver.scheduleNightAlarm(ctx, 22);

        if (!autoApplied && openSettingsIfNeeded) {
            // Grant 60-second setup lease so user can paste hostname into Private DNS settings
            prefs.edit()
                .putLong(FortressWatchdogService.KEY_TEMP_UNLOCK_UNTIL_MS, System.currentTimeMillis() + 60000L)
                .putString(FortressWatchdogService.KEY_TEMP_UNLOCK_REASON, "dns_setup")
                .apply();
            Toast.makeText(
                ctx,
                "📋 Copied '" + targetHost + "'! Tap 'Private DNS' -> Paste hostname -> Save.",
                Toast.LENGTH_LONG
            ).show();
            try {
                Intent intent = new Intent(Settings.ACTION_WIRELESS_SETTINGS);
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(intent);
            } catch (Exception e) {
                try {
                    Intent intent = new Intent(Settings.ACTION_SETTINGS);
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(intent);
                } catch (Exception ignored) {}
            }
        } else if (autoApplied) {
            Toast.makeText(ctx, "🛡️ Safe Private DNS (" + targetHost + ") Active & Locked!", Toast.LENGTH_SHORT).show();
        }

        Map<String, Object> res = buildStatusMap(ctx);
        res.put("autoApplied", autoApplied);
        res.put("directSuccess", autoApplied);
        res.put("copiedHost", targetHost);
        return res;
    }

    private void openSafePhoneSetting(Context ctx, String target) {
        SharedPreferences prefs = ctx.getSharedPreferences(FortressWatchdogService.PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit()
            .putLong(FortressWatchdogService.KEY_TEMP_UNLOCK_UNTIL_MS, System.currentTimeMillis() + 35000L)
            .putString(FortressWatchdogService.KEY_TEMP_UNLOCK_REASON, "safe_sub_setting")
            .apply();

        String action = Settings.ACTION_SETTINGS;
        if ("wifi".equalsIgnoreCase(target)) {
            action = Settings.ACTION_WIFI_SETTINGS;
        } else if ("bluetooth".equalsIgnoreCase(target)) {
            action = Settings.ACTION_BLUETOOTH_SETTINGS;
        } else if ("private_dns".equalsIgnoreCase(target)) {
            String host = prefs.getString(FortressWatchdogService.KEY_EXPECTED_DNS_HOST, "family.cloudflare-dns.com");
            try {
                ClipboardManager cb = (ClipboardManager) ctx.getSystemService(Context.CLIPBOARD_SERVICE);
                if (cb != null) {
                    cb.setPrimaryClip(ClipData.newPlainText("Safe Private DNS", host));
                }
            } catch (Exception ignored) {}
            prefs.edit()
                .putLong(FortressWatchdogService.KEY_TEMP_UNLOCK_UNTIL_MS, System.currentTimeMillis() + 60000L)
                .putString(FortressWatchdogService.KEY_TEMP_UNLOCK_REASON, "dns_setup")
                .apply();
            Toast.makeText(ctx, "📋 Copied '" + host + "'! Tap Private DNS -> Paste -> Save.", Toast.LENGTH_LONG).show();
            action = Settings.ACTION_WIRELESS_SETTINGS;
        } else if ("sound".equalsIgnoreCase(target)) {
            action = Settings.ACTION_SOUND_SETTINGS;
        } else if ("display".equalsIgnoreCase(target)) {
            action = Settings.ACTION_DISPLAY_SETTINGS;
        }

        try {
            Intent intent = new Intent(action);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(intent);
        } catch (Exception e) {
            try {
                Intent fallback = new Intent(Settings.ACTION_SETTINGS);
                fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(fallback);
            } catch (Exception ignored) {}
        }
    }

    private List<Map<String, Object>> loadInstalledAppsList(Context ctx) {
        List<Map<String, Object>> list = new ArrayList<>();
        try {
            PackageManager pm = ctx.getPackageManager();
            Intent mainIntent = new Intent(Intent.ACTION_MAIN, null);
            mainIntent.addCategory(Intent.CATEGORY_LAUNCHER);
            List<ResolveInfo> resolved = pm.queryIntentActivities(mainIntent, 0);
            String myPkg = ctx.getPackageName();

            for (ResolveInfo ri : resolved) {
                if (ri.activityInfo == null) continue;
                String pkg = ri.activityInfo.packageName;
                if (pkg == null || pkg.equals(myPkg)) continue;
                CharSequence labelCs = ri.loadLabel(pm);
                String label = labelCs != null ? labelCs.toString().trim() : pkg;
                boolean isSys = (ri.activityInfo.applicationInfo.flags & ApplicationInfo.FLAG_SYSTEM) != 0;

                Map<String, Object> item = new HashMap<>();
                item.put("name", label);
                item.put("label", label);
                item.put("packageName", pkg);
                item.put("isSystemApp", isSys);
                list.add(item);
            }

            Collections.sort(list, new Comparator<Map<String, Object>>() {
                @Override
                public int compare(Map<String, Object> a, Map<String, Object> b) {
                    String na = String.valueOf(a.get("name"));
                    String nb = String.valueOf(b.get("name"));
                    return na.compareToIgnoreCase(nb);
                }
            });
        } catch (Exception ignored) {}
        return list;
    }

    private boolean launchAndroidApp(Context ctx, String pkg, String appId, int sessionMinutes) {
        try {
            PackageManager pm = ctx.getPackageManager();
            Intent launchIntent = null;

            if (pkg != null && !pkg.isEmpty()) {
                launchIntent = pm.getLaunchIntentForPackage(pkg);
            }

            if (launchIntent == null && appId != null) {
                if ("phone".equalsIgnoreCase(appId) || "dialer".equalsIgnoreCase(appId)) {
                    launchIntent = new Intent(Intent.ACTION_DIAL);
                } else if ("messages".equalsIgnoreCase(appId)) {
                    launchIntent = new Intent(Intent.ACTION_MAIN);
                    launchIntent.addCategory(Intent.CATEGORY_APP_MESSAGING);
                } else if ("camera".equalsIgnoreCase(appId)) {
                    launchIntent = new Intent(MediaStore.INTENT_ACTION_STILL_IMAGE_CAMERA);
                } else if ("clock".equalsIgnoreCase(appId) || "alarm".equalsIgnoreCase(appId)) {
                    launchIntent = new Intent(AlarmClock.ACTION_SHOW_ALARMS);
                } else if ("calendar".equalsIgnoreCase(appId)) {
                    launchIntent = new Intent(Intent.ACTION_VIEW, CalendarContract.CONTENT_URI.buildUpon().appendPath("time").build());
                } else if ("maps".equalsIgnoreCase(appId)) {
                    launchIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("geo:0,0?q="));
                }
            }

            if (launchIntent != null) {
                launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(launchIntent);

                if (activeReturnRunnable != null) {
                    sessionHandler.removeCallbacks(activeReturnRunnable);
                }
                if (sessionMinutes > 0) {
                    activeReturnRunnable = new Runnable() {
                        @Override
                        public void run() {
                            Intent home = new Intent(ctx, MainActivity.class);
                            home.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                            ctx.startActivity(home);
                        }
                    };
                    sessionHandler.postDelayed(activeReturnRunnable, sessionMinutes * 60L * 1000L);
                }
                return true;
            }
        } catch (Exception ignored) {}
        return false;
    }

    private void requestDefaultHomeRole(Context ctx) {
        SharedPreferences prefs = ctx.getSharedPreferences(FortressWatchdogService.PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit()
            .putLong(FortressWatchdogService.KEY_TEMP_UNLOCK_UNTIL_MS, System.currentTimeMillis() + 45000L)
            .putString(FortressWatchdogService.KEY_TEMP_UNLOCK_REASON, "default_launcher")
            .apply();
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                RoleManager rm = (RoleManager) ctx.getSystemService(Context.ROLE_SERVICE);
                if (rm != null && rm.isRoleAvailable(RoleManager.ROLE_HOME) && !rm.isRoleHeld(RoleManager.ROLE_HOME)) {
                    Intent roleIntent = rm.createRequestRoleIntent(RoleManager.ROLE_HOME);
                    startActivityForResult(roleIntent, 9001);
                    return;
                }
            }
            Intent homeSettings = new Intent(Settings.ACTION_HOME_SETTINGS);
            homeSettings.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(homeSettings);
        } catch (Exception e) {
            try {
                PackageManager pm = ctx.getPackageManager();
                ComponentName fake = new ComponentName(ctx, FakeLauncherActivity.class);
                pm.setComponentEnabledSetting(fake, PackageManager.COMPONENT_ENABLED_STATE_ENABLED, PackageManager.DONT_KILL_APP);
                Intent selector = new Intent(Intent.ACTION_MAIN);
                selector.addCategory(Intent.CATEGORY_HOME);
                selector.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(selector);
                pm.setComponentEnabledSetting(fake, PackageManager.COMPONENT_ENABLED_STATE_DISABLED, PackageManager.DONT_KILL_APP);
            } catch (Exception ignored) {}
        }
    }

    private int cleanBackgroundAppsNow(Context ctx) {
        int count = 0;
        try {
            ActivityManager am = (ActivityManager) ctx.getSystemService(Context.ACTIVITY_SERVICE);
            if (am == null) return 0;
            String[] noisyPackages = new String[]{
                "com.instagram.android",
                "com.zhiliaoapp.musically",
                "com.ss.android.ugc.trill",
                "com.facebook.katana",
                "com.google.android.youtube",
                "com.twitter.android",
                "com.reddit.frontpage",
                "com.snapchat.android",
                "com.android.chrome"
            };
            for (String p : noisyPackages) {
                am.killBackgroundProcesses(p);
                count++;
            }
        } catch (Exception ignored) {}
        return count;
    }

    private boolean isMyLauncherDefault(Context ctx) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                RoleManager rm = (RoleManager) ctx.getSystemService(Context.ROLE_SERVICE);
                if (rm != null && rm.isRoleAvailable(RoleManager.ROLE_HOME)) {
                    return rm.isRoleHeld(RoleManager.ROLE_HOME);
                }
            }
            Intent intent = new Intent(Intent.ACTION_MAIN);
            intent.addCategory(Intent.CATEGORY_HOME);
            ResolveInfo res = ctx.getPackageManager().resolveActivity(intent, PackageManager.MATCH_DEFAULT_ONLY);
            return res != null && res.activityInfo != null && ctx.getPackageName().equals(res.activityInfo.packageName);
        } catch (Exception ignored) {
            return false;
        }
    }

    private boolean isUsageStatsGranted(Context ctx) {
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

    private boolean isOverlayPermissionGranted(Context ctx) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            return Settings.canDrawOverlays(ctx);
        }
        return true;
    }

    private boolean isLockTaskModeRunning(Context ctx) {
        try {
            ActivityManager am = (ActivityManager) ctx.getSystemService(Context.ACTIVITY_SERVICE);
            if (am == null) return false;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                return am.getLockTaskModeState() != ActivityManager.LOCK_TASK_MODE_NONE;
            }
            return am.isInLockTaskMode();
        } catch (Exception ignored) {
            return false;
        }
    }

    @Override
    public void onBackPressed() {
        // Stay inside Minimum Phone when Back is pressed on Home
    }
}

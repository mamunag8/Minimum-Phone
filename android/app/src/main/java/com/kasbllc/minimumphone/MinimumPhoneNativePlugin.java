package com.kasbllc.minimumphone;

import android.app.Activity;
import android.app.ActivityManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.role.RoleManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.net.Uri;
import android.os.BatteryManager;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.provider.AlarmClock;
import android.provider.CalendarContract;
import android.provider.MediaStore;
import android.provider.Settings;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@CapacitorPlugin(name = "MinimumPhoneNative")
public class MinimumPhoneNativePlugin extends Plugin {

    public static final int REQUEST_CODE_ROLE_HOME = 9001;
    private final Handler sessionTimerHandler = new Handler(Looper.getMainLooper());
    private Runnable activeReturnRunnable = null;
    private Runnable settingsReturnRunnable = null;
    private Runnable minor5MinRunnable = null;
    private Runnable medium10MinRunnable = null;
    private Runnable full20MinRunnable = null;

    /**
     * Checks whether Minimum Phone is currently the system Default Home Launcher,
     * whether Kiosk Screen Pinning (LockTask) is active, and live battery status.
     */
    @PluginMethod
    public void getLauncherStatus(PluginCall call) {
        Context ctx = getContext();
        JSObject ret = buildStatusObject(ctx);
        call.resolve(ret);
    }

    public JSObject buildStatusObject(Context ctx) {
        JSObject ret = new JSObject();
        boolean isDefault = isMyLauncherDefault(ctx);
        String currentHolder = getCurrentHomePackage(ctx);
        boolean isPinned = isLockTaskModeRunning(ctx);

        // Live Battery status
        int batteryPct = 85;
        boolean isCharging = false;
        try {
            BatteryManager bm = (BatteryManager) ctx.getSystemService(Context.BATTERY_SERVICE);
            if (bm != null) {
                int level = bm.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY);
                if (level > 0 && level <= 100) {
                    batteryPct = level;
                }
            }
            IntentFilter ifilter = new IntentFilter(Intent.ACTION_BATTERY_CHANGED);
            Intent batteryStatus = ctx.registerReceiver(null, ifilter);
            if (batteryStatus != null) {
                int status = batteryStatus.getIntExtra(BatteryManager.EXTRA_STATUS, -1);
                isCharging = status == BatteryManager.BATTERY_STATUS_CHARGING ||
                             status == BatteryManager.BATTERY_STATUS_FULL;
            }
        } catch (Exception ignored) {}

        // Live Private DNS status from Android Settings.Global (readable on Android 9+)
        String dnsMode = "unknown";
        String dnsSpecifier = "";
        boolean dnsHostnameActive = false;
        try {
            String rawMode = Settings.Global.getString(ctx.getContentResolver(), "private_dns_mode");
            String rawSpec = Settings.Global.getString(ctx.getContentResolver(), "private_dns_specifier");
            if (rawMode != null && !rawMode.trim().isEmpty()) {
                dnsMode = rawMode.trim().toLowerCase(Locale.ROOT);
            }
            if (rawSpec != null && !rawSpec.trim().isEmpty()) {
                dnsSpecifier = rawSpec.trim().toLowerCase(Locale.ROOT);
            }
            dnsHostnameActive = "hostname".equalsIgnoreCase(dnsMode) && !dnsSpecifier.isEmpty();
        } catch (Exception ignored) {}

        ret.put("isDefaultLauncher", isDefault);
        ret.put("currentDefaultPackage", currentHolder != null ? currentHolder : "unknown");
        ret.put("isKioskPinned", isPinned);
        ret.put("batteryLevel", batteryPct);
        ret.put("isCharging", isCharging);
        ret.put("privateDnsMode", dnsMode);
        ret.put("privateDnsSpecifier", dnsSpecifier);
        ret.put("privateDnsHostnameActive", dnsHostnameActive);
        ret.put("platform", "android");
        return ret;
    }

    public static boolean isMyLauncherDefault(Context ctx) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                RoleManager rm = ctx.getSystemService(RoleManager.class);
                if (rm != null && rm.isRoleAvailable(RoleManager.ROLE_HOME)) {
                    if (rm.isRoleHeld(RoleManager.ROLE_HOME)) {
                        return true;
                    }
                }
            }
            Intent intent = new Intent(Intent.ACTION_MAIN);
            intent.addCategory(Intent.CATEGORY_HOME);
            ResolveInfo res = ctx.getPackageManager().resolveActivity(intent, PackageManager.MATCH_DEFAULT_ONLY);
            if (res != null && res.activityInfo != null) {
                return ctx.getPackageName().equals(res.activityInfo.packageName);
            }
        } catch (Exception ignored) {}
        return false;
    }

    public static String getCurrentHomePackage(Context ctx) {
        try {
            Intent intent = new Intent(Intent.ACTION_MAIN);
            intent.addCategory(Intent.CATEGORY_HOME);
            ResolveInfo res = ctx.getPackageManager().resolveActivity(intent, PackageManager.MATCH_DEFAULT_ONLY);
            if (res != null && res.activityInfo != null) {
                return res.activityInfo.packageName;
            }
        } catch (Exception ignored) {}
        return "unknown";
    }

    public static boolean isLockTaskModeRunning(Context ctx) {
        try {
            ActivityManager am = (ActivityManager) ctx.getSystemService(Context.ACTIVITY_SERVICE);
            if (am != null) {
                return am.getLockTaskModeState() != ActivityManager.LOCK_TASK_MODE_NONE;
            }
        } catch (Exception ignored) {}
        return false;
    }

    /**
     * Prompts the Android OS to set Minimum Phone as the Default Home App (ROLE_HOME).
     * Uses startActivityForResult on the Activity (required by Android 10+ RoleManager),
     * with automatic fallback to the FakeLauncherActivity component reset + Home Settings.
     */
    @PluginMethod
    public void requestDefaultLauncherRole(PluginCall call) {
        Activity activity = getActivity();
        Context ctx = getContext();

        if (activity == null) {
            call.reject("Activity not available");
            return;
        }

        boolean alreadyDefault = isMyLauncherDefault(ctx);
        if (alreadyDefault) {
            JSObject ret = buildStatusObject(ctx);
            ret.put("actionTaken", "already_default");
            call.resolve(ret);
            return;
        }

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                RoleManager roleManager = ctx.getSystemService(RoleManager.class);
                if (roleManager != null && roleManager.isRoleAvailable(RoleManager.ROLE_HOME)) {
                    Intent roleIntent = roleManager.createRequestRoleIntent(RoleManager.ROLE_HOME);
                    activity.startActivityForResult(roleIntent, REQUEST_CODE_ROLE_HOME);
                    JSObject ret = buildStatusObject(ctx);
                    ret.put("actionTaken", "role_home_dialog_launched");
                    call.resolve(ret);
                    return;
                }
            }
        } catch (Exception ignored) {}

        // Fallback: force Home chooser via component toggle or Home Settings
        triggerHomeChooserOrSettings(activity, ctx);
        JSObject ret = buildStatusObject(ctx);
        ret.put("actionTaken", "home_settings_launched");
        call.resolve(ret);
    }

    /**
     * Forces Android to clear any "Always" stock launcher default by toggling FakeLauncherActivity
     * and opening the Default Home App selector.
     */
    @PluginMethod
    public void forceShowHomePicker(PluginCall call) {
        Activity activity = getActivity();
        Context ctx = getContext();
        if (activity != null) {
            triggerHomeChooserOrSettings(activity, ctx);
        }
        JSObject ret = buildStatusObject(ctx);
        ret.put("actionTaken", "forced_home_picker");
        call.resolve(ret);
    }

    /**
     * Directly opens Android's Default Home App settings screen.
     */
    @PluginMethod
    public void openHomeSettings(PluginCall call) {
        Context ctx = getContext();
        try {
            Intent intent = new Intent(Settings.ACTION_HOME_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            ctx.startActivity(intent);
        } catch (Exception e) {
            try {
                Intent fallback = new Intent(Settings.ACTION_MANAGE_DEFAULT_APPS_SETTINGS);
                fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                ctx.startActivity(fallback);
            } catch (Exception ignored) {}
        }
        call.resolve(buildStatusObject(ctx));
    }

    /**
     * Opens specific Android Phone Main Settings directly from Minimum Phone's Settings Menu
     * (main, wifi, bluetooth, display, sound, apps, dns, battery, accessibility, usage, home).
     */
    @PluginMethod
    public void openPhoneSystemSetting(PluginCall call) {
        Context ctx = getContext();
        String target = call.getString("target", "main");
        if (target == null) target = "main";
        int autoReturnSeconds = call.getInt("autoReturnSeconds", 40);
        String action;

        switch (target.toLowerCase(Locale.ROOT)) {
            case "wifi":
                action = Settings.ACTION_WIFI_SETTINGS;
                break;
            case "bluetooth":
                action = Settings.ACTION_BLUETOOTH_SETTINGS;
                break;
            case "display":
                action = Settings.ACTION_DISPLAY_SETTINGS;
                break;
            case "sound":
                action = Settings.ACTION_SOUND_SETTINGS;
                break;
            case "apps":
                action = Settings.ACTION_APPLICATION_SETTINGS;
                break;
            case "dns":
            case "network":
            case "hotspot":
                action = Settings.ACTION_WIRELESS_SETTINGS;
                break;
            case "data":
                action = Settings.ACTION_DATA_ROAMING_SETTINGS;
                break;
            case "location":
                action = Settings.ACTION_LOCATION_SOURCE_SETTINGS;
                break;
            case "battery":
                action = Intent.ACTION_POWER_USAGE_SUMMARY;
                break;
            case "accessibility":
                action = Settings.ACTION_ACCESSIBILITY_SETTINGS;
                break;
            case "usage":
                action = Settings.ACTION_USAGE_ACCESS_SETTINGS;
                break;
            case "home":
                action = Settings.ACTION_HOME_SETTINGS;
                break;
            case "main":
            default:
                action = Settings.ACTION_SETTINGS;
                break;
        }

        boolean opened = false;
        try {
            Intent intent = new Intent(action);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            ctx.startActivity(intent);
            opened = true;
        } catch (Exception e) {
            try {
                Intent fallback = new Intent(Settings.ACTION_SETTINGS);
                fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                ctx.startActivity(fallback);
                opened = true;
            } catch (Exception ignored) {}
        }

        // Schedule automatic return & kill of System Settings so the user cannot stay inside Android Settings
        if (opened && autoReturnSeconds > 0) {
            if (settingsReturnRunnable != null) {
                sessionTimerHandler.removeCallbacks(settingsReturnRunnable);
            }
            final Context appCtx = ctx.getApplicationContext();
            settingsReturnRunnable = () -> {
                try {
                    ActivityManager am = (ActivityManager) appCtx.getSystemService(Context.ACTIVITY_SERVICE);
                    if (am != null) {
                        am.killBackgroundProcesses("com.android.settings");
                        am.killBackgroundProcesses("com.samsung.android.settings");
                    }
                } catch (Exception ignored) {}
                bringLauncherToFrontInternal(appCtx);
            };
            sessionTimerHandler.postDelayed(settingsReturnRunnable, autoReturnSeconds * 1000L);
        }

        JSObject ret = buildStatusObject(ctx);
        ret.put("opened", opened);
        ret.put("target", target);
        ret.put("autoReturnSeconds", autoReturnSeconds);
        call.resolve(ret);
    }

    /**
     * Checks live Android OS Private DNS status, attempts automatic silent restoration
     * (via Settings.Global when WRITE_SECURE_SETTINGS is available), and optionally kills
     * background Android System Settings processes so Private DNS cannot be tampered with at night.
     */
    @PluginMethod
    public void enforcePrivateDnsAndSettingsGuard(PluginCall call) {
        Context ctx = getContext();
        String expectedHost = call.getString("expectedHost", "family.cloudflare-dns.com");
        if (expectedHost == null || expectedHost.trim().isEmpty()) {
            expectedHost = "family.cloudflare-dns.com";
        }
        boolean autoRestore = Boolean.TRUE.equals(call.getBoolean("autoRestore", true));
        boolean killSystemSettings = Boolean.TRUE.equals(call.getBoolean("killSystemSettings", false));

        boolean autoRestoredNatively = false;
        boolean systemSettingsKilled = false;

        try {
            String currentMode = Settings.Global.getString(ctx.getContentResolver(), "private_dns_mode");
            String currentSpec = Settings.Global.getString(ctx.getContentResolver(), "private_dns_specifier");
            boolean isCurrentlyValid = "hostname".equalsIgnoreCase(currentMode) &&
                                       currentSpec != null && !currentSpec.trim().isEmpty();

            if (!isCurrentlyValid && autoRestore) {
                try {
                    boolean wroteMode = Settings.Global.putString(ctx.getContentResolver(), "private_dns_mode", "hostname");
                    boolean wroteSpec = Settings.Global.putString(ctx.getContentResolver(), "private_dns_specifier", expectedHost.trim());
                    autoRestoredNatively = wroteMode && wroteSpec;
                } catch (Exception ignored) {
                    autoRestoredNatively = false;
                }
            }
        } catch (Exception ignored) {}

        if (killSystemSettings) {
            try {
                ActivityManager am = (ActivityManager) ctx.getSystemService(Context.ACTIVITY_SERVICE);
                if (am != null) {
                    am.killBackgroundProcesses("com.android.settings");
                    am.killBackgroundProcesses("com.samsung.android.settings");
                    am.killBackgroundProcesses("com.miui.securitycenter");
                    systemSettingsKilled = true;
                }
            } catch (Exception ignored) {}
        }

        JSObject ret = buildStatusObject(ctx);
        ret.put("autoRestoredNatively", autoRestoredNatively);
        ret.put("systemSettingsKilled", systemSettingsKilled);
        ret.put("expectedHost", expectedHost);
        call.resolve(ret);
    }

    public static void triggerHomeChooserOrSettings(Activity activity, Context ctx) {
        try {
            PackageManager pm = ctx.getPackageManager();
            ComponentName fakeLauncher = new ComponentName(ctx, FakeLauncherActivity.class);
            pm.setComponentEnabledSetting(
                fakeLauncher,
                PackageManager.COMPONENT_ENABLED_STATE_ENABLED,
                PackageManager.DONT_KILL_APP
            );

            Intent selector = new Intent(Intent.ACTION_MAIN);
            selector.addCategory(Intent.CATEGORY_HOME);
            selector.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            activity.startActivity(selector);

            pm.setComponentEnabledSetting(
                fakeLauncher,
                PackageManager.COMPONENT_ENABLED_STATE_DISABLED,
                PackageManager.DONT_KILL_APP
            );
        } catch (Exception e) {
            try {
                Intent settingsIntent = new Intent(Settings.ACTION_HOME_SETTINGS);
                settingsIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                ctx.startActivity(settingsIntent);
            } catch (Exception ignored) {}
        }
    }

    /**
     * Hardware Home-Button & Recents Lock (Android Screen Pinning / LockTask Kiosk Mode).
     * When enabled, pressing the Home button or Recents gesture is physically blocked by Android OS!
     */
    @PluginMethod
    public void setKioskPinLock(PluginCall call) {
        boolean enabled = Boolean.TRUE.equals(call.getBoolean("enabled", true));
        Activity activity = getActivity();
        Context ctx = getContext();

        if (activity != null) {
            activity.runOnUiThread(() -> {
                try {
                    if (enabled) {
                        activity.startLockTask();
                    } else {
                        activity.stopLockTask();
                    }
                } catch (Exception ignored) {}
            });
        }

        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            call.resolve(buildStatusObject(ctx));
        }, 400);
    }

    /**
     * Queries all launchable apps installed on the user's phone and auto-classifies
     * high-dopamine social/video/entertainment apps vs utility/essential tools.
     */
    @PluginMethod
    public void getInstalledApps(PluginCall call) {
        Context ctx = getContext();
        PackageManager pm = ctx.getPackageManager();

        Intent mainIntent = new Intent(Intent.ACTION_MAIN, null);
        mainIntent.addCategory(Intent.CATEGORY_LAUNCHER);

        List<ResolveInfo> resolvedList = pm.queryIntentActivities(mainIntent, 0);
        JSArray appsArray = new JSArray();
        Set<String> seenPackages = new HashSet<>();
        String myPkg = ctx.getPackageName();

        List<JSObject> tempList = new ArrayList<>();

        for (ResolveInfo ri : resolvedList) {
            if (ri.activityInfo == null) continue;
            String pkg = ri.activityInfo.packageName;
            if (pkg == null || pkg.equals(myPkg) || seenPackages.contains(pkg)) continue;
            seenPackages.add(pkg);

            CharSequence labelCs = ri.loadLabel(pm);
            String label = labelCs != null ? labelCs.toString().trim() : pkg;
            if (label.isEmpty()) label = pkg;

            boolean isSystem = (ri.activityInfo.applicationInfo.flags & ApplicationInfo.FLAG_SYSTEM) != 0;
            String tier = classifyPackageTier(pkg, label, isSystem);
            String category = classifyPackageCategory(pkg, label);

            JSObject appObj = new JSObject();
            appObj.put("id", "pkg:" + pkg);
            appObj.put("packageName", pkg);
            appObj.put("name", label);
            appObj.put("category", category);
            appObj.put("tier", tier);
            appObj.put("isSystemApp", isSystem);
            tempList.add(appObj);
        }

        Collections.sort(tempList, new Comparator<JSObject>() {
            @Override
            public int compare(JSObject a, JSObject b) {
                String na = a.getString("name", "");
                String nb = b.getString("name", "");
                return na.compareToIgnoreCase(nb);
            }
        });

        for (JSObject item : tempList) {
            appsArray.put(item);
        }

        JSObject ret = new JSObject();
        ret.put("apps", appsArray);
        ret.put("count", tempList.size());
        call.resolve(ret);
    }

    private String classifyPackageTier(String pkg, String label, boolean isSystem) {
        String p = pkg.toLowerCase(Locale.ROOT);
        String l = label.toLowerCase(Locale.ROOT);

        // Dopamine-trap social, short-video, streaming, gaming, unguarded browsers, and Android System Settings (Fortress guarded)
        String[] restrictedKeywords = new String[]{
            "instagram", "tiktok", "musically", "youtube", "facebook", "katana",
            "twitter", "com.twitter", "reddit", "snapchat", "netflix", "twitch",
            "discord", "pinterest", "threads", "bilibili", "likee", "kwai",
            "tinder", "bumble", "pubg", "freefire", "roblox", "genshin", "candycrush",
            "clash", "chrome", "browser", "opera", "firefox", "brave", "edge",
            "com.android.settings", "samsung.android.settings"
        };
        for (String kw : restrictedKeywords) {
            if (p.contains(kw) || l.contains(kw)) {
                return "restricted";
            }
        }

        // Core essential tools (Calls, Messages, WhatsApp, Calendar, Notes, Quran/Hadith)
        if (p.contains("dialer") || p.contains("telecom") || l.equals("phone") ||
            p.contains("mms") || p.contains("messaging") || l.equals("messages") ||
            p.contains("whatsapp") ||
            p.contains("contacts") || p.contains("calendar") || p.contains("notes") ||
            p.contains("keep") || p.contains("quran") || p.contains("hadith") ||
            p.contains("muslim")) {
            return "essential";
        }

        return "utility";
    }

    private String classifyPackageCategory(String pkg, String label) {
        String p = pkg.toLowerCase(Locale.ROOT);
        String l = label.toLowerCase(Locale.ROOT);

        if (p.contains("chrome") || p.contains("browser") || p.contains("firefox") || p.contains("opera") || p.contains("brave")) {
            return "browser";
        }
        if (p.contains("whatsapp") || p.contains("messenger") || p.contains("telegram") || p.contains("dialer") || p.contains("mms") || p.contains("messaging") || l.equals("phone") || l.equals("messages")) {
            return "communication";
        }
        if (p.contains("instagram") || p.contains("facebook") || p.contains("twitter") || p.contains("reddit") || p.contains("snapchat") || p.contains("threads")) {
            return "social";
        }
        if (p.contains("youtube") || p.contains("tiktok") || p.contains("netflix") || p.contains("spotify") || p.contains("game")) {
            return "entertainment";
        }
        if (p.contains("calendar") || p.contains("docs") || p.contains("sheets") || p.contains("slack") || p.contains("zoom") || p.contains("teams") || p.contains("authenticator")) {
            return "work";
        }
        return "utility";
    }

    /**
     * Launches either a real installed packageName OR a semantic system utility intent
     * (phone dialer, camera, clock/alarm, calendar, maps, calculator).
     * If durationMinutes > 0 is passed for a restricted app, schedules an automatic return
     * to Minimum Phone when the timer expires!
     */
    @PluginMethod
    public void launchApp(PluginCall call) {
        Context ctx = getContext();
        PackageManager pm = ctx.getPackageManager();
        String packageName = call.getString("packageName", "");
        String appId = call.getString("appId", "");
        int durationMinutes = call.getInt("durationMinutes", 0);

        boolean launched = false;

        try {
            // 1. Direct package launch if packageName is provided
            if (packageName != null && !packageName.isEmpty()) {
                Intent launchIntent = pm.getLaunchIntentForPackage(packageName);
                if (launchIntent != null) {
                    launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    ctx.startActivity(launchIntent);
                    launched = true;
                }
            }

            // 2. Semantic fallback for built-in home items (Phone, Camera, Calendar, Maps, Alarm, Calculator)
            if (!launched && appId != null) {
                Intent semanticIntent = resolveSemanticIntent(ctx, pm, appId);
                if (semanticIntent != null) {
                    semanticIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    ctx.startActivity(semanticIntent);
                    launched = true;
                }
            }
        } catch (Exception ignored) {}

        // 3. Progressive In-App Escalation (5m Minor -> 10m Medium -> 20m Full-Screen Auto-Close + 15s Quiz Re-Entry)
        if (launched && durationMinutes > 0) {
            if (activeReturnRunnable != null) sessionTimerHandler.removeCallbacks(activeReturnRunnable);
            if (minor5MinRunnable != null) sessionTimerHandler.removeCallbacks(minor5MinRunnable);
            if (medium10MinRunnable != null) sessionTimerHandler.removeCallbacks(medium10MinRunnable);
            if (full20MinRunnable != null) sessionTimerHandler.removeCallbacks(full20MinRunnable);

            final String displayApp = (appId != null && !appId.isEmpty()) ? appId.toUpperCase(Locale.ROOT) : "APP";
            final String targetPkg = packageName;

            // 5-Minute Minor Notification
            minor5MinRunnable = () -> postEscalationNotification(
                ctx,
                9105,
                "⏱ 5 Min Minor Notice · " + displayApp,
                "You have spent 5 minutes in " + displayApp + ". Stay mindful of your intention.",
                false
            );
            sessionTimerHandler.postDelayed(minor5MinRunnable, 5 * 60L * 1000L);

            // 10-Minute Medium Warning Notification
            medium10MinRunnable = () -> postEscalationNotification(
                ctx,
                9110,
                "⚠ 10 Min Medium Alert · " + displayApp,
                "10 minutes in " + displayApp + ". Wrap up soon—auto-close & 15s quiz lock triggers at 20m.",
                true
            );
            sessionTimerHandler.postDelayed(medium10MinRunnable, 10 * 60L * 1000L);

            // 20-Minute Full-Screen Auto-Close + Force Return to Minimum Phone (15s Read & Quiz Reopening Lock)
            full20MinRunnable = () -> {
                try {
                    if (targetPkg != null && !targetPkg.isEmpty()) {
                        ActivityManager am = (ActivityManager) ctx.getSystemService(Context.ACTIVITY_SERVICE);
                        if (am != null) am.killBackgroundProcesses(targetPkg);
                    }
                } catch (Exception ignored) {}
                postEscalationNotification(
                    ctx,
                    9120,
                    "🛑 20 Min Limit · " + displayApp + " Closed",
                    displayApp + " has been closed after 20 minutes. Complete the 15s Read & Quiz in Minimum Phone to reopen.",
                    true
                );
                bringLauncherToFrontInternal(ctx);
            };
            sessionTimerHandler.postDelayed(full20MinRunnable, 20 * 60L * 1000L);

            // Also respect shorter custom bid if < 20m
            if (durationMinutes < 20) {
                activeReturnRunnable = () -> bringLauncherToFrontInternal(ctx);
                sessionTimerHandler.postDelayed(activeReturnRunnable, durationMinutes * 60L * 1000L);
            }
        }

        JSObject ret = new JSObject();
        ret.put("launched", launched);
        ret.put("packageName", packageName);
        ret.put("appId", appId);
        call.resolve(ret);
    }

    private Intent resolveSemanticIntent(Context ctx, PackageManager pm, String appId) {
        String id = appId.toLowerCase(Locale.ROOT);
        if (id.startsWith("pkg:")) {
            String pkg = appId.substring(4);
            return pm.getLaunchIntentForPackage(pkg);
        }
        switch (id) {
            case "phone":
                return new Intent(Intent.ACTION_DIAL);
            case "messages":
            case "sms": {
                Intent msg = new Intent(Intent.ACTION_MAIN);
                msg.addCategory(Intent.CATEGORY_APP_MESSAGING);
                if (msg.resolveActivity(pm) != null) return msg;
                return new Intent(Intent.ACTION_VIEW, Uri.parse("sms:"));
            }
            case "camera":
                return new Intent(MediaStore.INTENT_ACTION_STILL_IMAGE_CAMERA);
            case "alarm":
                return new Intent(AlarmClock.ACTION_SHOW_ALARMS);
            case "calendar": {
                Intent cal = new Intent(Intent.ACTION_MAIN);
                cal.addCategory(Intent.CATEGORY_APP_CALENDAR);
                if (cal.resolveActivity(pm) != null) return cal;
                return new Intent(Intent.ACTION_VIEW, CalendarContract.CONTENT_URI.buildUpon().appendPath("time").build());
            }
            case "maps": {
                Intent mapIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("geo:0,0?q="));
                if (mapIntent.resolveActivity(pm) != null) return mapIntent;
                return pm.getLaunchIntentForPackage("com.google.android.apps.maps");
            }
            case "calculator": {
                Intent calc = new Intent(Intent.ACTION_MAIN);
                calc.addCategory(Intent.CATEGORY_APP_CALCULATOR);
                if (calc.resolveActivity(pm) != null) return calc;
                return pm.getLaunchIntentForPackage("com.google.android.calculator");
            }
            case "whatsapp": {
                Intent wa = pm.getLaunchIntentForPackage("com.whatsapp");
                if (wa != null) return wa;
                return pm.getLaunchIntentForPackage("com.whatsapp.w4b");
            }
            case "instagram":
                return pm.getLaunchIntentForPackage("com.instagram.android");
            case "youtube":
                return pm.getLaunchIntentForPackage("com.google.android.youtube");
            case "tiktok": {
                Intent tt = pm.getLaunchIntentForPackage("com.zhiliaoapp.musically");
                if (tt != null) return tt;
                return pm.getLaunchIntentForPackage("com.ss.android.ugc.trill");
            }
            case "facebook":
                return pm.getLaunchIntentForPackage("com.facebook.katana");
            case "x-twitter":
                return pm.getLaunchIntentForPackage("com.twitter.android");
            case "reddit":
                return pm.getLaunchIntentForPackage("com.reddit.frontpage");
            case "browser": {
                Intent web = new Intent(Intent.ACTION_VIEW, Uri.parse("https://duckduckgo.com"));
                return web;
            }
            default:
                return pm.getLaunchIntentForPackage(appId);
        }
    }

    public static void bringLauncherToFrontInternal(Context ctx) {
        try {
            Intent homeIntent = new Intent(ctx, MainActivity.class);
            homeIntent.setAction(Intent.ACTION_MAIN);
            homeIntent.addCategory(Intent.CATEGORY_HOME);
            homeIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            homeIntent.putExtra("session_expired", true);
            ctx.startActivity(homeIntent);
        } catch (Exception ignored) {}
    }

    public static void postEscalationNotification(
        Context ctx,
        int notifId,
        String title,
        String message,
        boolean highPriority
    ) {
        try {
            NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm == null) return;
            String channelId = highPriority ? "minphone_escalation_high" : "minphone_escalation_minor";
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                NotificationChannel channel = new NotificationChannel(
                    channelId,
                    highPriority ? "Minimum Phone Session Warnings" : "Minimum Phone Mindful Notices",
                    highPriority ? NotificationManager.IMPORTANCE_HIGH : NotificationManager.IMPORTANCE_DEFAULT
                );
                nm.createNotificationChannel(channel);
            }

            Intent tapIntent = new Intent(ctx, MainActivity.class);
            tapIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            int flags = Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
                ? PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
                : PendingIntent.FLAG_UPDATE_CURRENT;
            PendingIntent pi = PendingIntent.getActivity(ctx, notifId, tapIntent, flags);

            Notification.Builder builder = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                ? new Notification.Builder(ctx, channelId)
                : new Notification.Builder(ctx);

            builder.setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                   .setContentTitle(title)
                   .setContentText(message)
                   .setAutoCancel(true)
                   .setContentIntent(pi);

            nm.notify(notifId, builder.build());
        } catch (Exception ignored) {}
    }

    /**
     * Background Safe App Whitelist & Auto-Clean / Auto-Close Engine:
     * Iterates over launchable apps and calls ActivityManager.killBackgroundProcesses(pkg)
     * for all packages NOT in the user's safePackages / safeAppIds whitelist.
     */
    @PluginMethod
    public void enforceBackgroundSafeList(PluginCall call) {
        Context ctx = getContext();
        ActivityManager am = (ActivityManager) ctx.getSystemService(Context.ACTIVITY_SERVICE);
        PackageManager pm = ctx.getPackageManager();
        String myPkg = ctx.getPackageName();

        Set<String> safeTokens = new HashSet<>();
        safeTokens.add(myPkg.toLowerCase(Locale.ROOT));

        try {
            JSArray safePackagesArr = call.getArray("safePackages");
            if (safePackagesArr != null) {
                for (int i = 0; i < safePackagesArr.length(); i++) {
                    String s = safePackagesArr.getString(i);
                    if (s != null && !s.trim().isEmpty()) {
                        safeTokens.add(s.trim().toLowerCase(Locale.ROOT));
                    }
                }
            }
        } catch (Exception ignored) {}

        int closedCount = 0;
        JSArray closedPackages = new JSArray();

        if (am != null && pm != null) {
            Intent mainIntent = new Intent(Intent.ACTION_MAIN, null);
            mainIntent.addCategory(Intent.CATEGORY_LAUNCHER);
            List<ResolveInfo> resolvedList = pm.queryIntentActivities(mainIntent, 0);
            Set<String> checked = new HashSet<>();

            for (ResolveInfo ri : resolvedList) {
                if (ri.activityInfo == null) continue;
                String pkg = ri.activityInfo.packageName;
                if (pkg == null || pkg.equals(myPkg) || checked.contains(pkg)) continue;
                checked.add(pkg);

                String lowerPkg = pkg.toLowerCase(Locale.ROOT);
                boolean isSafe = safeTokens.contains(lowerPkg);
                if (!isSafe) {
                    for (String token : safeTokens) {
                        if (token.length() >= 3 && lowerPkg.contains(token)) {
                            isSafe = true;
                            break;
                        }
                    }
                }

                if (!isSafe) {
                    try {
                        am.killBackgroundProcesses(pkg);
                        closedCount++;
                        closedPackages.put(pkg);
                    } catch (Exception ignored) {}
                }
            }
        }

        JSObject ret = new JSObject();
        ret.put("cleaned", true);
        ret.put("closedCount", closedCount);
        ret.put("closedPackages", closedPackages);
        call.resolve(ret);
    }
}

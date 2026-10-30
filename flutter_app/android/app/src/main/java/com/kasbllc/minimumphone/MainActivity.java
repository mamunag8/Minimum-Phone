package com.kasbllc.minimumphone;

import android.Manifest;
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
import android.hardware.camera2.CameraCharacteristics;
import android.hardware.camera2.CameraManager;
import android.location.Address;
import android.location.Geocoder;
import android.location.Location;
import android.location.LocationManager;
import android.net.Uri;
import android.os.BatteryManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.Process;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.provider.AlarmClock;
import android.provider.CalendarContract;
import android.provider.MediaStore;
import android.provider.Settings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import androidx.annotation.NonNull;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.integration.android.IntentIntegrator;
import com.google.zxing.integration.android.IntentResult;
import com.google.zxing.qrcode.QRCodeWriter;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TimeZone;

import io.flutter.embedding.android.FlutterActivity;
import io.flutter.embedding.engine.FlutterEngine;
import io.flutter.plugin.common.MethodCall;
import io.flutter.plugin.common.MethodChannel;

public class MainActivity extends FlutterActivity {

    private static final String CHANNEL = "com.kasbllc.minimumphone/native";
    private final Handler sessionHandler = new Handler(Looper.getMainLooper());
    private Runnable activeReturnRunnable = null;
    private MethodChannel.Result pendingQrScanResult = null;
    private String pendingScanPrompt = null;
    private WebView printWebView = null;
    private boolean isTorchEnabled = false;

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
                            Boolean sleepSchedule = call.argument("sleepScheduleEnabled");
                            Boolean strictQr247 = call.argument("strictQr247");
                            Number monkUntil = call.argument("monkModeUntil");
                            String nightLockedCsv = call.argument("nightLockedPackages");

                            String qrCode = call.argument("qrSecret");
                            if (qrCode == null || qrCode.isEmpty()) qrCode = call.argument("qrCode");

                            Number emergencyUntil = call.argument("emergencyLockdownUntil");
                            Integer startH = call.argument("nightStartHour");
                            Integer endH = call.argument("nightEndHour");
                            String lang = call.argument("lang");

                            SharedPreferences prefs = ctx.getSharedPreferences(FortressWatchdogService.PREFS_NAME, Context.MODE_PRIVATE);
                            SharedPreferences.Editor ed = prefs.edit();
                            ed.putBoolean(FortressWatchdogService.KEY_WATCHDOG_ENABLED, true);
                            if (host != null && !host.isEmpty()) ed.putString(FortressWatchdogService.KEY_EXPECTED_DNS_HOST, host);
                            if (lockSettings != null) ed.putBoolean(FortressWatchdogService.KEY_LOCK_SETTINGS, lockSettings);
                            if (autoNightDns != null) ed.putBoolean(FortressWatchdogService.KEY_AUTO_DNS_NIGHT, autoNightDns);
                            if (dnsShieldActive != null) ed.putBoolean(FortressWatchdogService.KEY_DNS_SHIELD_ACTIVE, dnsShieldActive);
                            if (sleepSchedule != null) ed.putBoolean(FortressWatchdogService.KEY_SLEEP_SCHEDULE_ENABLED, sleepSchedule);
                            if (strictQr247 != null) ed.putBoolean(FortressWatchdogService.KEY_STRICT_QR_247, strictQr247);
                            if (monkUntil != null) ed.putLong(FortressWatchdogService.KEY_MONK_MODE_UNTIL_MS, monkUntil.longValue());
                            if (nightLockedCsv != null) ed.putString(FortressWatchdogService.KEY_NIGHT_LOCKED_PACKAGES, nightLockedCsv);
                            if (qrCode != null && !qrCode.isEmpty()) ed.putString(FortressWatchdogService.KEY_QR_CODE, qrCode);
                            if (emergencyUntil != null) ed.putLong(FortressWatchdogService.KEY_EMERGENCY_LOCKDOWN_UNTIL_MS, emergencyUntil.longValue());
                            if (startH != null) ed.putInt(FortressWatchdogService.KEY_NIGHT_START_HOUR, startH);
                            if (endH != null) ed.putInt(FortressWatchdogService.KEY_NIGHT_END_HOUR, endH);
                            if (lang != null && !lang.isEmpty()) ed.putString("app_lang", lang);
                            ed.apply();

                            int hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY);
                            if ((hour >= 22 || hour < 6) && (autoNightDns == null || autoNightDns)) {
                                FortressWatchdogService.ensurePrivateDnsActiveAtNight(ctx);
                            }

                            NightFortressReceiver.startWatchdogSafely(ctx);
                            NightFortressReceiver.scheduleNightAlarm(ctx, startH != null ? startH : 22);
                            result.success(buildStatusMap(ctx));
                            break;
                        }

                        case "openSafePhoneSetting": {
                            String target = call.argument("settingType");
                            if (target == null || target.isEmpty()) target = call.argument("target");
                            Boolean unlockedByGate = call.argument("unlockedByGate");
                            openSafePhoneSetting(ctx, target != null ? target : "wifi", unlockedByGate != null && unlockedByGate);
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
                            if (isUsageStatsGranted(ctx)) {
                                Toast.makeText(ctx, NativeI18n.tr(ctx, "toastUsageActive"), Toast.LENGTH_SHORT).show();
                                result.success(true);
                                break;
                            }
                            if (!isNightQrVerifiedNow(ctx)) {
                                Toast.makeText(ctx, NativeI18n.tr(ctx, "toastNightQrRequired"), Toast.LENGTH_LONG).show();
                                result.success(false);
                                break;
                            }
                            SharedPreferences prefs = ctx.getSharedPreferences(FortressWatchdogService.PREFS_NAME, Context.MODE_PRIVATE);
                            prefs.edit()
                                .putLong(FortressWatchdogService.KEY_TEMP_UNLOCK_UNTIL_MS, System.currentTimeMillis() + 20000L)
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
                            if (isOverlayPermissionGranted(ctx)) {
                                Toast.makeText(ctx, NativeI18n.tr(ctx, "toastOverlayActive"), Toast.LENGTH_SHORT).show();
                                result.success(true);
                                break;
                            }
                            if (!isNightQrVerifiedNow(ctx)) {
                                Toast.makeText(ctx, NativeI18n.tr(ctx, "toastNightQrRequired"), Toast.LENGTH_LONG).show();
                                result.success(false);
                                break;
                            }
                            SharedPreferences prefs = ctx.getSharedPreferences(FortressWatchdogService.PREFS_NAME, Context.MODE_PRIVATE);
                            prefs.edit()
                                .putLong(FortressWatchdogService.KEY_TEMP_UNLOCK_UNTIL_MS, System.currentTimeMillis() + 20000L)
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

                        case "scanQrCode": {
                            String prompt = call.argument("prompt");
                            startQrScanFromFlutter(prompt, result);
                            break;
                        }

                        case "generateQrMatrix": {
                            String data = call.argument("data");
                            if (data == null || data.trim().isEmpty()) {
                                data = call.argument("content");
                            }
                            if (data == null || data.trim().isEmpty()) {
                                data = "KASB-BRICK-77";
                            }
                            result.success(buildIsoQrMatrixMap(data.trim()));
                            break;
                        }

                        case "printQrCodeSheet": {
                            String data = call.argument("data");
                            if (data == null || data.trim().isEmpty()) {
                                data = call.argument("qrSecret");
                            }
                            String title = call.argument("title");
                            String subtitle = call.argument("subtitle");
                            if (data == null || data.trim().isEmpty()) {
                                data = "KASB-BRICK-77";
                            }
                            printPhysicalQrSheet(data.trim(), title, subtitle);
                            result.success(true);
                            break;
                        }

                        case "toggleFlashlight": {
                            boolean nowOn = toggleFlashlightTorch(ctx);
                            Map<String, Object> res = new HashMap<>();
                            res.put("torchOn", nowOn);
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

        SharedPreferences prefs = ctx.getSharedPreferences(FortressWatchdogService.PREFS_NAME, Context.MODE_PRIVATE);
        int startH = prefs.getInt(FortressWatchdogService.KEY_NIGHT_START_HOUR, 22);
        int endH = prefs.getInt(FortressWatchdogService.KEY_NIGHT_END_HOUR, 6);
        int hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY);
        long clockTamperUntil = prefs.getLong(FortressWatchdogService.KEY_CLOCK_TAMPER_UNTIL_MS, 0L);
        boolean isNightNow = (System.currentTimeMillis() < clockTamperUntil)
            || ((startH > endH) ? (hour >= startH || hour < endH) : (hour >= startH && hour < endH));

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
        map.put("backgroundLocation", resolveBackgroundLocation(ctx));
        return map;
    }

    private String resolveBackgroundLocation(Context ctx) {
        try {
            LocationManager lm = (LocationManager) ctx.getSystemService(Context.LOCATION_SERVICE);
            if (lm != null) {
                boolean hasCoarse = Build.VERSION.SDK_INT < Build.VERSION_CODES.M
                    || ctx.checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED
                    || ctx.checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
                if (hasCoarse) {
                    Location loc = lm.getLastKnownLocation(LocationManager.PASSIVE_PROVIDER);
                    if (loc == null) loc = lm.getLastKnownLocation(LocationManager.NETWORK_PROVIDER);
                    if (loc == null) loc = lm.getLastKnownLocation(LocationManager.GPS_PROVIDER);
                    if (loc != null && Geocoder.isPresent()) {
                        Geocoder geo = new Geocoder(ctx, Locale.getDefault());
                        List<Address> addrs = geo.getFromLocation(loc.getLatitude(), loc.getLongitude(), 1);
                        if (addrs != null && !addrs.isEmpty()) {
                            Address a = addrs.get(0);
                            if (a.getLocality() != null && !a.getLocality().isEmpty()) {
                                return a.getLocality();
                            }
                            if (a.getSubAdminArea() != null && !a.getSubAdminArea().isEmpty()) {
                                return a.getSubAdminArea();
                            }
                        }
                    }
                }
            }
        } catch (Exception ignored) {}
        try {
            String tz = TimeZone.getDefault().getID();
            if (tz != null && tz.contains("/")) {
                String city = tz.substring(tz.lastIndexOf('/') + 1).replace('_', ' ');
                if (!city.isEmpty()) return city;
            }
        } catch (Exception ignored) {}
        return "Auto GPS";
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
        boolean alreadySafe = FortressWatchdogService.isOsPrivateDnsConfigured(ctx);
        NightFortressReceiver.startWatchdogSafely(ctx);
        NightFortressReceiver.scheduleNightAlarm(ctx, 22);

        if (alreadySafe || autoApplied) {
            // CRITICAL: When Safe Private DNS is ALREADY active, NEVER open Android Wireless Settings!
            prefs.edit()
                .putLong(FortressWatchdogService.KEY_TEMP_UNLOCK_UNTIL_MS, 0L)
                .putString(FortressWatchdogService.KEY_TEMP_UNLOCK_REASON, "")
                .apply();
            Toast.makeText(ctx, NativeI18n.tr(ctx, "toastDnsActiveLocked"), Toast.LENGTH_SHORT).show();
        } else if (openSettingsIfNeeded) {
            if (!isNightQrVerifiedNow(ctx)) {
                Toast.makeText(
                    ctx,
                    NativeI18n.tr(ctx, "toastNightQrRequired"),
                    Toast.LENGTH_LONG
                ).show();
            } else {
                // Grant short 18-second setup lease ONLY when DNS is currently OFF so user can paste hostname
                prefs.edit()
                    .putLong(FortressWatchdogService.KEY_TEMP_UNLOCK_UNTIL_MS, System.currentTimeMillis() + 18000L)
                    .putString(FortressWatchdogService.KEY_TEMP_UNLOCK_REASON, "dns_setup")
                    .apply();
                Toast.makeText(
                    ctx,
                    NativeI18n.tr(ctx, "toastCopiedDns") + " (" + targetHost + ")",
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
            }
        }

        Map<String, Object> res = buildStatusMap(ctx);
        res.put("autoApplied", autoApplied || alreadySafe);
        res.put("directSuccess", autoApplied || alreadySafe);
        res.put("copiedHost", targetHost);
        return res;
    }

    private boolean toggleFlashlightTorch(Context ctx) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            try {
                CameraManager cm = (CameraManager) ctx.getSystemService(Context.CAMERA_SERVICE);
                if (cm != null) {
                    for (String id : cm.getCameraIdList()) {
                        CameraCharacteristics chars = cm.getCameraCharacteristics(id);
                        Boolean hasFlash = chars.get(CameraCharacteristics.FLASH_INFO_AVAILABLE);
                        if (hasFlash != null && hasFlash) {
                            isTorchEnabled = !isTorchEnabled;
                            cm.setTorchMode(id, isTorchEnabled);
                            return isTorchEnabled;
                        }
                    }
                }
            } catch (Exception e) {
                isTorchEnabled = false;
            }
        }
        return isTorchEnabled;
    }

    private void openSafePhoneSetting(Context ctx, String target, boolean unlockedByGate) {
        if ("torch".equalsIgnoreCase(target) || "flashlight".equalsIgnoreCase(target)) {
            toggleFlashlightTorch(ctx);
            return;
        }

        if ("calculator".equalsIgnoreCase(target)) {
            try {
                Intent calcIntent = Intent.makeMainSelectorActivity(Intent.ACTION_MAIN, Intent.CATEGORY_APP_CALCULATOR);
                calcIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(calcIntent);
                return;
            } catch (Exception ignored) {}
        }

        if ("alarm".equalsIgnoreCase(target) || "clock".equalsIgnoreCase(target)) {
            try {
                Intent alarmIntent = new Intent(AlarmClock.ACTION_SHOW_ALARMS);
                alarmIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(alarmIntent);
                return;
            } catch (Exception ignored) {}
        }

        // Volume panel does NOT have a "See More" network/DNS link, so it is safe 24/7
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q && "sound".equalsIgnoreCase(target)) {
            try {
                Intent panel = new Intent(Settings.Panel.ACTION_VOLUME);
                panel.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(panel);
                return;
            } catch (Exception ignored) {}
        }

        SharedPreferences prefs = ctx.getSharedPreferences(FortressWatchdogService.PREFS_NAME, Context.MODE_PRIVATE);
        int startH = prefs.getInt(FortressWatchdogService.KEY_NIGHT_START_HOUR, 22);
        int endH = prefs.getInt(FortressWatchdogService.KEY_NIGHT_END_HOUR, 6);
        int hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY);
        long clockTamperUntil = prefs.getLong(FortressWatchdogService.KEY_CLOCK_TAMPER_UNTIL_MS, 0L);
        boolean isNightNow = (System.currentTimeMillis() < clockTamperUntil)
            || ((startH > endH) ? (hour >= startH || hour < endH) : (hour >= startH && hour < endH));
        boolean osDnsSafe = FortressWatchdogService.isOsPrivateDnsConfigured(ctx);
        boolean lockSettings = prefs.getBoolean(FortressWatchdogService.KEY_LOCK_SETTINGS, true);

        // CRITICAL NIGHT QR ENFORCEMENT:
        // At night (22:00-06:00), Settings.Panel.ACTION_WIFI and ACTION_INTERNET_CONNECTIVITY have a "See More" button
        // that opens Android Network & DNS Settings! Therefore ALL system/network settings at night require Camera QR scan!
        if (isNightNow && !isNightQrVerifiedNow(ctx)) {
            Toast.makeText(
                ctx,
                NativeI18n.tr(ctx, "toastNightQrRequired"),
                Toast.LENGTH_LONG
            ).show();
            return;
        }

        if ("private_dns".equalsIgnoreCase(target)) {
            if (osDnsSafe && !isNightQrVerifiedNow(ctx)) {
                Toast.makeText(ctx, NativeI18n.tr(ctx, "toastDnsActiveLocked"), Toast.LENGTH_LONG).show();
                return;
            }
            String host = prefs.getString(FortressWatchdogService.KEY_EXPECTED_DNS_HOST, "family.cloudflare-dns.com");
            try {
                ClipboardManager cb = (ClipboardManager) ctx.getSystemService(Context.CLIPBOARD_SERVICE);
                if (cb != null) {
                    cb.setPrimaryClip(ClipData.newPlainText("Safe Private DNS", host));
                }
            } catch (Exception ignored) {}
            prefs.edit()
                .putLong(FortressWatchdogService.KEY_TEMP_UNLOCK_UNTIL_MS, System.currentTimeMillis() + 18000L)
                .putString(FortressWatchdogService.KEY_TEMP_UNLOCK_REASON, "dns_setup")
                .apply();
            Toast.makeText(ctx, NativeI18n.tr(ctx, "toastCopiedDns") + " (" + host + ")", Toast.LENGTH_LONG).show();
            try {
                Intent intent = new Intent(Settings.ACTION_WIRELESS_SETTINGS);
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(intent);
            } catch (Exception ignored) {}
            return;
        }

        if (lockSettings && !unlockedByGate && !isNightQrVerifiedNow(ctx)) {
            Toast.makeText(ctx, NativeI18n.tr(ctx, "toastGateRequired"), Toast.LENGTH_SHORT).show();
            return;
        }

        // Daytime (or QR-verified night) floating panel for Wi-Fi / Mobile Data
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q && !isNightNow) {
            try {
                if ("wifi".equalsIgnoreCase(target)) {
                    Intent panel = new Intent(Settings.Panel.ACTION_WIFI);
                    panel.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(panel);
                    return;
                } else if ("mobile_data".equalsIgnoreCase(target) || "data".equalsIgnoreCase(target)) {
                    Intent panel = new Intent(Settings.Panel.ACTION_INTERNET_CONNECTIVITY);
                    panel.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(panel);
                    return;
                }
            } catch (Exception ignored) {}
        }

        prefs.edit()
            .putLong(FortressWatchdogService.KEY_TEMP_UNLOCK_UNTIL_MS, System.currentTimeMillis() + 18000L)
            .putString(FortressWatchdogService.KEY_TEMP_UNLOCK_REASON, "safe_sub_setting")
            .apply();

        if ("hotspot".equalsIgnoreCase(target)) {
            try {
                Intent tetherIntent = new Intent();
                tetherIntent.setClassName("com.android.settings", "com.android.settings.TetherSettings");
                tetherIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(tetherIntent);
                return;
            } catch (Exception ignored) {}
        }

        String action = Settings.ACTION_SETTINGS;
        if ("wifi".equalsIgnoreCase(target)) {
            action = Settings.ACTION_WIFI_SETTINGS;
        } else if ("mobile_data".equalsIgnoreCase(target) || "data".equalsIgnoreCase(target)) {
            action = Settings.ACTION_DATA_ROAMING_SETTINGS;
        } else if ("hotspot".equalsIgnoreCase(target)) {
            action = Settings.ACTION_WIRELESS_SETTINGS;
        } else if ("bluetooth".equalsIgnoreCase(target)) {
            action = Settings.ACTION_BLUETOOTH_SETTINGS;
        } else if ("sound".equalsIgnoreCase(target)) {
            action = Settings.ACTION_SOUND_SETTINGS;
        } else if ("display".equalsIgnoreCase(target)) {
            action = Settings.ACTION_DISPLAY_SETTINGS;
        } else if ("battery".equalsIgnoreCase(target)) {
            action = Settings.ACTION_BATTERY_SAVER_SETTINGS;
        } else if ("location".equalsIgnoreCase(target)) {
            action = Settings.ACTION_LOCATION_SOURCE_SETTINGS;
        } else if ("airplane".equalsIgnoreCase(target)) {
            action = Settings.ACTION_AIRPLANE_MODE_SETTINGS;
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
            SharedPreferences prefs = ctx.getSharedPreferences(FortressWatchdogService.PREFS_NAME, Context.MODE_PRIVATE);
            int startH = prefs.getInt(FortressWatchdogService.KEY_NIGHT_START_HOUR, 22);
            int endH = prefs.getInt(FortressWatchdogService.KEY_NIGHT_END_HOUR, 6);
            int hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY);
            long clockTamperUntil = prefs.getLong(FortressWatchdogService.KEY_CLOCK_TAMPER_UNTIL_MS, 0L);
            boolean isNightNow = (System.currentTimeMillis() < clockTamperUntil)
                || ((startH > endH) ? (hour >= startH || hour < endH) : (hour >= startH && hour < endH));
            String lowerPkg = pkg != null ? pkg.toLowerCase(Locale.ROOT) : "";
            boolean isSystemSettings = lowerPkg.equals("com.android.settings")
                || lowerPkg.equals("com.samsung.android.settings")
                || "settings".equalsIgnoreCase(appId);

            boolean lockSettings = prefs.getBoolean(FortressWatchdogService.KEY_LOCK_SETTINGS, true);
            boolean osDnsSafe = FortressWatchdogService.isOsPrivateDnsConfigured(ctx);

            if (isSystemSettings && isNightNow && !isNightQrVerifiedNow(ctx)) {
                Toast.makeText(
                    ctx,
                    NativeI18n.tr(ctx, "toastNightQrRequired"),
                    Toast.LENGTH_LONG
                ).show();
                Intent lockIntent = new Intent(ctx, NativeFortressLockActivity.class);
                lockIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                lockIntent.putExtra("intercept_reason", "settings_locked");
                startActivity(lockIntent);
                return false;
            }

            if (isSystemSettings) {
                // Temporary settings unlock after passing Flutter gate (or Night Camera QR gate)
                prefs.edit()
                    .putLong(FortressWatchdogService.KEY_TEMP_UNLOCK_UNTIL_MS, System.currentTimeMillis() + 25000L)
                    .putString(FortressWatchdogService.KEY_TEMP_UNLOCK_REASON, isNightNow ? "qr_verified" : "daytime_verified")
                    .apply();
            } else {
                // Grant app-level unlock lease for night-locked apps that passed the QR gate in Flutter
                prefs.edit()
                    .putLong(FortressWatchdogService.KEY_QR_VERIFIED_UNLOCK_UNTIL_MS, System.currentTimeMillis() + (sessionMinutes * 60000L))
                    .apply();
            }

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
        int startH = prefs.getInt(FortressWatchdogService.KEY_NIGHT_START_HOUR, 22);
        int endH = prefs.getInt(FortressWatchdogService.KEY_NIGHT_END_HOUR, 6);
        int hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY);
        long clockTamperUntil = prefs.getLong(FortressWatchdogService.KEY_CLOCK_TAMPER_UNTIL_MS, 0L);
        boolean isNightNow = (System.currentTimeMillis() < clockTamperUntil)
            || ((startH > endH) ? (hour >= startH || hour < endH) : (hour >= startH && hour < endH));
        if (isNightNow && !isNightQrVerifiedNow(ctx)) {
            Toast.makeText(
                ctx,
                NativeI18n.tr(ctx, "toastNightQrRequired"),
                Toast.LENGTH_LONG
            ).show();
            return;
        }
        prefs.edit()
            .putLong(FortressWatchdogService.KEY_TEMP_UNLOCK_UNTIL_MS, System.currentTimeMillis() + 20000L)
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
        // Forward Back press to Flutter so modals (5-Step Setup Guide, dialogs, drawers) and sub-pages pop cleanly,
        // while PopScope on the root Home tab prevents closing the Home Launcher activity!
        if (getFlutterEngine() != null) {
            getFlutterEngine().getNavigationChannel().popRoute();
        }
    }

    private void startQrScanFromFlutter(String prompt, MethodChannel.Result result) {
        if (pendingQrScanResult != null) {
            try {
                pendingQrScanResult.success("");
            } catch (Exception ignored) {}
            pendingQrScanResult = null;
        }
        pendingQrScanResult = result;
        pendingScanPrompt = (prompt != null && !prompt.trim().isEmpty())
            ? prompt.trim()
            : NativeI18n.tr(this, "scannerPrompt");

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (checkSelfPermission(Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
                requestPermissions(new String[]{Manifest.permission.CAMERA}, 801);
                return;
            }
        }
        launchZxingScannerForFlutter();
    }

    private void launchZxingScannerForFlutter() {
        try {
            IntentIntegrator integrator = new IntentIntegrator(this);
            integrator.setDesiredBarcodeFormats(IntentIntegrator.QR_CODE);
            integrator.setPrompt(pendingScanPrompt != null ? pendingScanPrompt : NativeI18n.tr(this, "scannerPrompt"));
            integrator.setBeepEnabled(true);
            integrator.setOrientationLocked(true);
            integrator.initiateScan();
        } catch (Exception e) {
            if (pendingQrScanResult != null) {
                pendingQrScanResult.success("");
                pendingQrScanResult = null;
            }
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == 801) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                launchZxingScannerForFlutter();
            } else {
                Toast.makeText(this, NativeI18n.tr(this, "toastCameraPerm"), Toast.LENGTH_LONG).show();
                if (pendingQrScanResult != null) {
                    pendingQrScanResult.success("");
                    pendingQrScanResult = null;
                }
            }
        }
    }

    private boolean isNightQrVerifiedNow(Context ctx) {
        SharedPreferences prefs = ctx.getSharedPreferences(FortressWatchdogService.PREFS_NAME, Context.MODE_PRIVATE);
        int startH = prefs.getInt(FortressWatchdogService.KEY_NIGHT_START_HOUR, 22);
        int endH = prefs.getInt(FortressWatchdogService.KEY_NIGHT_END_HOUR, 6);
        int hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY);
        boolean isNight = (startH > endH) ? (hour >= startH || hour < endH) : (hour >= startH && hour < endH);
        long clockTamperUntil = prefs.getLong(FortressWatchdogService.KEY_CLOCK_TAMPER_UNTIL_MS, 0L);
        boolean strictQr247 = prefs.getBoolean(FortressWatchdogService.KEY_STRICT_QR_247, false);
        long now = System.currentTimeMillis();
        if (!isNight && !strictQr247 && now >= clockTamperUntil) return true;
        long verifiedUntil = prefs.getLong(FortressWatchdogService.KEY_NIGHT_QR_VERIFIED_UNTIL_MS, 0L);
        return now < verifiedUntil;
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        IntentResult scanRes = IntentIntegrator.parseActivityResult(requestCode, resultCode, data);
        if (scanRes != null) {
            String contents = scanRes.getContents();
            String trimmed = contents != null ? contents.trim() : "";
            if (!trimmed.isEmpty()) {
                SharedPreferences prefs = getSharedPreferences(FortressWatchdogService.PREFS_NAME, Context.MODE_PRIVATE);
                String expectedQr = prefs.getString(FortressWatchdogService.KEY_QR_CODE, "KASB-BRICK-77");
                if (expectedQr == null || expectedQr.trim().isEmpty()) {
                    expectedQr = "KASB-BRICK-77";
                }
                if (trimmed.equalsIgnoreCase(expectedQr.trim()) ||
                        trimmed.toUpperCase(Locale.ROOT).contains(expectedQr.trim().toUpperCase(Locale.ROOT))) {
                    prefs.edit()
                        .putLong(FortressWatchdogService.KEY_NIGHT_QR_VERIFIED_UNTIL_MS, System.currentTimeMillis() + 60000L)
                        .putLong(FortressWatchdogService.KEY_CLOCK_TAMPER_UNTIL_MS, 0L)
                        .apply();
                }
            }
            if (pendingQrScanResult != null) {
                MethodChannel.Result res = pendingQrScanResult;
                pendingQrScanResult = null;
                res.success(trimmed);
            }
            return;
        }
        super.onActivityResult(requestCode, resultCode, data);
    }

    private Map<String, Object> buildIsoQrMatrixMap(String text) {
        Map<String, Object> out = new HashMap<>();
        try {
            QRCodeWriter writer = new QRCodeWriter();
            BitMatrix matrix = writer.encode(text, BarcodeFormat.QR_CODE, 0, 0);
            int w = matrix.getWidth();
            int h = matrix.getHeight();
            StringBuilder bits = new StringBuilder(w * h);
            for (int y = 0; y < h; y++) {
                for (int x = 0; x < w; x++) {
                    bits.append(matrix.get(x, y) ? '1' : '0');
                }
            }
            out.put("size", w);
            out.put("bits", bits.toString());
        } catch (Exception e) {
            out.put("size", 0);
            out.put("bits", "");
        }
        return out;
    }

    private void printPhysicalQrSheet(String qrData, String titleText, String subtitleText) {
        try {
            SharedPreferences prefs = getSharedPreferences(FortressWatchdogService.PREFS_NAME, Context.MODE_PRIVATE);
            int startH = prefs.getInt(FortressWatchdogService.KEY_NIGHT_START_HOUR, 22);
            int endH = prefs.getInt(FortressWatchdogService.KEY_NIGHT_END_HOUR, 6);
            int hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY);
            long clockTamperUntil = prefs.getLong(FortressWatchdogService.KEY_CLOCK_TAMPER_UNTIL_MS, 0L);
            boolean isNightNow = (System.currentTimeMillis() < clockTamperUntil)
                || ((startH > endH) ? (hour >= startH || hour < endH) : (hour >= startH && hour < endH));
            if (isNightNow) {
                Toast.makeText(
                    this,
                    NativeI18n.tr(this, "toastNightQrRequired"),
                    Toast.LENGTH_LONG
                ).show();
                return;
            }
            prefs.edit()
                .putLong(FortressWatchdogService.KEY_TEMP_UNLOCK_UNTIL_MS, System.currentTimeMillis() + 30000L)
                .putString(FortressWatchdogService.KEY_TEMP_UNLOCK_REASON, "print_qr")
                .apply();

            QRCodeWriter writer = new QRCodeWriter();
            BitMatrix matrix = writer.encode(qrData, BarcodeFormat.QR_CODE, 0, 0);
            int w = matrix.getWidth();
            int h = matrix.getHeight();

            StringBuilder svg = new StringBuilder();
            svg.append("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ").append(w + 4).append(" ").append(h + 4)
               .append("' width='280' height='280' shape-rendering='crispEdges'>");
            svg.append("<rect width='100%' height='100%' fill='#ffffff'/>");
            for (int y = 0; y < h; y++) {
                for (int x = 0; x < w; x++) {
                    if (matrix.get(x, y)) {
                        svg.append("<rect x='").append(x + 2).append("' y='").append(y + 2)
                           .append("' width='1' height='1' fill='#000000'/>");
                    }
                }
            }
            svg.append("</svg>");

            String safeTitle = (titleText != null && !titleText.isEmpty())
                ? titleText
                : "Minimum Phone — Physical QR Fortress Key";
            String safeSub = (subtitleText != null && !subtitleText.isEmpty())
                ? subtitleText
                : "Keep this printed QR sheet in ANOTHER ROOM (away from your bed & desk). Scan it when you need emergency access at night.";

            String html = "<!DOCTYPE html><html><head><meta charset='utf-8'/>"
                + "<style>body{font-family:sans-serif;text-align:center;padding:36px;color:#111;}"
                + ".card{border:3px solid #10B981;border-radius:20px;padding:32px;max-width:460px;margin:0 auto;}"
                + "h1{font-size:22px;margin-bottom:8px;}p{font-size:14px;color:#444;line-height:1.5;}"
                + ".code{font-family:monospace;font-size:18px;font-weight:bold;background:#f3f4f6;padding:8px 16px;border-radius:8px;display:inline-block;margin-top:14px;}"
                + "</style></head><body><div class='card'>"
                + "<h1>🛡️ " + safeTitle + "</h1>"
                + "<p>" + safeSub + "</p>"
                + "<div style='margin:20px 0;'>" + svg.toString() + "</div>"
                + "<div class='code'>" + qrData + "</div>"
                + "<p style='margin-top:18px;font-size:12px;color:#666;'>Minimum Phone: Detox & Focus • OS Fortress</p>"
                + "</div></body></html>";

            WebView webView = new WebView(this);
            printWebView = webView;
            webView.setWebViewClient(new WebViewClient() {
                @Override
                public void onPageFinished(WebView view, String url) {
                    try {
                        PrintManager printManager = (PrintManager) getSystemService(Context.PRINT_SERVICE);
                        if (printManager != null) {
                            String jobName = "MinimumPhone_Physical_QR_Key";
                            PrintDocumentAdapter adapter = view.createPrintDocumentAdapter(jobName);
                            printManager.print(jobName, adapter, new PrintAttributes.Builder().build());
                        }
                    } catch (Exception e) {
                        Toast.makeText(MainActivity.this, "Print error: " + e.getMessage(), Toast.LENGTH_LONG).show();
                    }
                }
            });
            webView.loadDataWithBaseURL(null, html, "text/HTML", "UTF-8", null);
        } catch (Exception e) {
            Toast.makeText(this, "Could not prepare QR print sheet: " + e.getMessage(), Toast.LENGTH_LONG).show();
        }
    }
}

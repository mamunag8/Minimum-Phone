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
import android.location.LocationListener;
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
import android.view.View;
import android.view.WindowManager;
import android.view.inputmethod.InputMethodManager;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import androidx.annotation.NonNull;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.integration.android.IntentIntegrator;
import com.google.zxing.integration.android.IntentResult;
import com.google.zxing.qrcode.QRCodeWriter;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TimeZone;

import org.json.JSONObject;

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
    private volatile String cachedBackgroundLocation = "";
    private volatile double cachedLat = 0.0;
    private volatile double cachedLng = 0.0;
    private volatile boolean locationLookupInFlight = false;
    private long lastLocationLookupMs = 0L;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        loadSavedHyperlocalFromPrefs(this);
        triggerHyperlocalLookup(this, false);
        NightFortressReceiver.startWatchdogSafely(this);
        NightFortressReceiver.scheduleNightAlarm(this, 22);
    }

    @Override
    protected void onResume() {
        super.onResume();
        try {
            if (getWindow() != null) {
                getWindow().clearFlags(
                    WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE |
                    WindowManager.LayoutParams.FLAG_ALT_FOCUSABLE_IM
                );
            }
        } catch (Exception ignored) {}
        triggerHyperlocalLookup(this, false);
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
                            Boolean usageRemEnabled = call.argument("usageReminderEnabled");
                            Integer usageRemMins = call.argument("usageReminderMinutes");

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
                            if (usageRemEnabled != null) ed.putBoolean(FortressWatchdogService.KEY_USAGE_REMINDER_ENABLED, usageRemEnabled);
                            if (usageRemMins != null) ed.putInt(FortressWatchdogService.KEY_USAGE_REMINDER_MINUTES, usageRemMins);
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

                        case "showSoftKeyboard": {
                            showNativeSoftKeyboard();
                            result.success(true);
                            break;
                        }

                        case "hideSoftKeyboard": {
                            hideNativeSoftKeyboard();
                            result.success(true);
                            break;
                        }

                        case "requestHyperlocalLocation": {
                            Boolean askPermObj = call.argument("requestPermission");
                            boolean askPerm = askPermObj == null || askPermObj;
                            SharedPreferences prefs = ctx.getSharedPreferences(FortressWatchdogService.PREFS_NAME, Context.MODE_PRIVATE);
                            prefs.edit().putBoolean("hyperlocal_manual", false).apply();
                            if (askPerm && Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !hasLocationPermission(ctx)) {
                                prefs.edit()
                                    .putLong(FortressWatchdogService.KEY_TEMP_UNLOCK_UNTIL_MS, System.currentTimeMillis() + 20000L)
                                    .putString(FortressWatchdogService.KEY_TEMP_UNLOCK_REASON, "location_permission")
                                    .apply();
                                try {
                                    requestPermissions(
                                        new String[]{
                                            Manifest.permission.ACCESS_FINE_LOCATION,
                                            Manifest.permission.ACCESS_COARSE_LOCATION
                                        },
                                        802
                                    );
                                } catch (Exception ignored) {}
                            }
                            lastLocationLookupMs = 0L;
                            triggerHyperlocalLookup(ctx, true);
                            result.success(buildStatusMap(ctx));
                            break;
                        }

                        case "setHyperlocalLocation": {
                            String city = call.argument("city");
                            Number latNum = call.argument("lat");
                            Number lngNum = call.argument("lng");
                            Boolean manualObj = call.argument("manual");
                            boolean manual = manualObj == null || manualObj;
                            if (city != null && !city.trim().isEmpty() && latNum != null && lngNum != null) {
                                cachedBackgroundLocation = city.trim();
                                cachedLat = latNum.doubleValue();
                                cachedLng = lngNum.doubleValue();
                                saveHyperlocalToPrefs(ctx, cachedBackgroundLocation, cachedLat, cachedLng, manual);
                            }
                            result.success(buildStatusMap(ctx));
                            break;
                        }

                        case "geocodeCityQuery": {
                            final String query = call.argument("query");
                            final MethodChannel.Result geoResult = result;
                            new Thread(new Runnable() {
                                @Override
                                public void run() {
                                    final List<Map<String, Object>> matches = new ArrayList<>();
                                    try {
                                        if (query != null && !query.trim().isEmpty() && Geocoder.isPresent()) {
                                            Geocoder geo = new Geocoder(ctx, Locale.getDefault());
                                            List<Address> addrs = geo.getFromLocationName(query.trim(), 5);
                                            if (addrs != null) {
                                                for (Address a : addrs) {
                                                    if (a.hasLatitude() && a.hasLongitude()) {
                                                        Map<String, Object> item = new HashMap<>();
                                                        String label = formatHyperlocalAddress(a);
                                                        if (label == null || label.isEmpty()) {
                                                            label = query.trim();
                                                        }
                                                        if (a.getCountryName() != null && !a.getCountryName().isEmpty()
                                                                && !label.toLowerCase(Locale.ROOT).contains(a.getCountryName().toLowerCase(Locale.ROOT))) {
                                                            label = label + " (" + a.getCountryName() + ")";
                                                        }
                                                        item.put("city", label);
                                                        item.put("lat", a.getLatitude());
                                                        item.put("lng", a.getLongitude());
                                                        matches.add(item);
                                                    }
                                                }
                                            }
                                        }
                                    } catch (Exception ignored) {}
                                    sessionHandler.post(new Runnable() {
                                        @Override
                                        public void run() {
                                            geoResult.success(matches);
                                        }
                                    });
                                }
                            }).start();
                            break;
                        }

                        default:
                            result.notImplemented();
                            break;
                    }
                }
            });
    }

    private void showNativeSoftKeyboard() {
        try {
            if (getWindow() != null) {
                getWindow().clearFlags(
                    WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE |
                    WindowManager.LayoutParams.FLAG_ALT_FOCUSABLE_IM
                );
                View focusView = getCurrentFocus();
                if (focusView == null) {
                    focusView = getWindow().getDecorView().findFocus();
                }
                if (focusView == null) {
                    focusView = getWindow().getDecorView();
                }
                if (focusView != null) {
                    focusView.setFocusable(true);
                    focusView.setFocusableInTouchMode(true);
                    focusView.requestFocus();
                    InputMethodManager imm = (InputMethodManager) getSystemService(Context.INPUT_METHOD_SERVICE);
                    if (imm != null) {
                        imm.showSoftInput(focusView, InputMethodManager.SHOW_IMPLICIT);
                    }
                }
            }
        } catch (Exception ignored) {}
    }

    private void hideNativeSoftKeyboard() {
        try {
            if (getWindow() != null) {
                View focusView = getCurrentFocus();
                if (focusView == null) {
                    focusView = getWindow().getDecorView();
                }
                if (focusView != null) {
                    InputMethodManager imm = (InputMethodManager) getSystemService(Context.INPUT_METHOD_SERVICE);
                    if (imm != null) {
                        imm.hideSoftInputFromWindow(focusView.getWindowToken(), 0);
                    }
                }
            }
        } catch (Exception ignored) {}
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
        map.put("locationLat", cachedLat);
        map.put("locationLng", cachedLng);
        map.put("hasLocationPermission", hasLocationPermission(ctx));
        return map;
    }

    private boolean hasLocationPermission(Context ctx) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return true;
        return ctx.checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
            || ctx.checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;
    }

    private void loadSavedHyperlocalFromPrefs(Context ctx) {
        try {
            SharedPreferences prefs = ctx.getSharedPreferences(FortressWatchdogService.PREFS_NAME, Context.MODE_PRIVATE);
            boolean verified = prefs.getBoolean("hyperlocal_verified", false);
            String savedCity = prefs.getString("hyperlocal_city", "");
            long latBits = prefs.getLong("hyperlocal_lat_bits", 0L);
            long lngBits = prefs.getLong("hyperlocal_lng_bits", 0L);
            if (verified && savedCity != null && !savedCity.isEmpty() && (latBits != 0L || lngBits != 0L)) {
                cachedBackgroundLocation = savedCity;
                cachedLat = Double.longBitsToDouble(latBits);
                cachedLng = Double.longBitsToDouble(lngBits);
                return;
            }
            String tz = TimeZone.getDefault().getID();
            if (tz != null && (tz.equalsIgnoreCase("Europe/Istanbul") || tz.equalsIgnoreCase("Turkey"))) {
                // Default Turkey hyperlocal fallback to Erzurum until GPS/Geo-IP resolves exact district/city
                cachedBackgroundLocation = "Erzurum";
                cachedLat = 39.9043;
                cachedLng = 41.2679;
            } else if (tz != null && tz.contains("/")) {
                cachedBackgroundLocation = tz.substring(tz.lastIndexOf('/') + 1).replace('_', ' ');
            } else {
                cachedBackgroundLocation = "Auto GPS";
            }
        } catch (Exception ignored) {}
    }

    private void saveHyperlocalToPrefs(Context ctx, String city, double lat, double lng, boolean manual) {
        try {
            SharedPreferences prefs = ctx.getSharedPreferences(FortressWatchdogService.PREFS_NAME, Context.MODE_PRIVATE);
            SharedPreferences.Editor ed = prefs.edit();
            ed.putString("hyperlocal_city", city != null ? city : "");
            ed.putLong("hyperlocal_lat_bits", Double.doubleToRawLongBits(lat));
            ed.putLong("hyperlocal_lng_bits", Double.doubleToRawLongBits(lng));
            ed.putBoolean("hyperlocal_verified", true);
            ed.putBoolean("hyperlocal_manual", manual);
            ed.apply();
        } catch (Exception ignored) {}
    }

    private String formatHyperlocalAddress(Address a) {
        if (a == null) return "";
        String subAdmin = a.getSubAdminArea() != null ? a.getSubAdminArea().trim() : "";
        String locality = a.getLocality() != null ? a.getLocality().trim() : "";
        String admin = a.getAdminArea() != null ? a.getAdminArea().trim() : "";
        String subLocality = a.getSubLocality() != null ? a.getSubLocality().trim() : "";

        // In Turkey & many countries: adminArea = Province (e.g. Erzurum), subAdminArea = District (e.g. Yakutiye / Palandöken)
        if (!subAdmin.isEmpty() && !admin.isEmpty() && !subAdmin.equalsIgnoreCase(admin)) {
            return subAdmin + ", " + admin;
        }
        if (!locality.isEmpty() && !admin.isEmpty() && !locality.equalsIgnoreCase(admin)) {
            return locality + ", " + admin;
        }
        if (!subLocality.isEmpty() && !locality.isEmpty() && !subLocality.equalsIgnoreCase(locality)) {
            return subLocality + ", " + locality;
        }
        if (!locality.isEmpty()) return locality;
        if (!admin.isEmpty()) return admin;
        if (!subAdmin.isEmpty()) return subAdmin;
        return "";
    }

    private String resolveBackgroundLocation(final Context ctx) {
        if (cachedBackgroundLocation == null || cachedBackgroundLocation.isEmpty()) {
            loadSavedHyperlocalFromPrefs(ctx);
        }
        long now = System.currentTimeMillis();
        if (now - lastLocationLookupMs > 180000L) {
            triggerHyperlocalLookup(ctx, false);
        }
        return cachedBackgroundLocation;
    }

    private void triggerHyperlocalLookup(final Context ctx, final boolean force) {
        long now = System.currentTimeMillis();
        if (!force && (locationLookupInFlight || (now - lastLocationLookupMs < 60000L))) {
            return;
        }
        final SharedPreferences prefs = ctx.getSharedPreferences(FortressWatchdogService.PREFS_NAME, Context.MODE_PRIVATE);
        if (!force && prefs.getBoolean("hyperlocal_manual", false) && cachedLat != 0.0 && cachedLng != 0.0) {
            return;
        }
        lastLocationLookupMs = now;
        locationLookupInFlight = true;

        // If location permission is granted, also request a fresh single update on the main looper
        if (hasLocationPermission(ctx)) {
            sessionHandler.post(new Runnable() {
                @Override
                public void run() {
                    try {
                        final LocationManager lm = (LocationManager) ctx.getSystemService(Context.LOCATION_SERVICE);
                        if (lm == null) return;
                        LocationListener oneShot = new LocationListener() {
                            @Override
                            public void onLocationChanged(@NonNull final Location loc) {
                                try {
                                    lm.removeUpdates(this);
                                } catch (Exception ignored) {}
                                new Thread(new Runnable() {
                                    @Override
                                    public void run() {
                                        applyGpsLocationFix(ctx, loc);
                                    }
                                }).start();
                            }
                            @Override
                            public void onStatusChanged(String provider, int status, Bundle extras) {}
                            @Override
                            public void onProviderEnabled(@NonNull String provider) {}
                            @Override
                            public void onProviderDisabled(@NonNull String provider) {}
                        };
                        if (lm.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                            lm.requestLocationUpdates(LocationManager.NETWORK_PROVIDER, 0L, 0f, oneShot, Looper.getMainLooper());
                        }
                        if (lm.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                            lm.requestLocationUpdates(LocationManager.GPS_PROVIDER, 0L, 0f, oneShot, Looper.getMainLooper());
                        }
                    } catch (Exception ignored) {}
                }
            });
        }

        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    boolean resolvedByGps = false;
                    LocationManager lm = (LocationManager) ctx.getSystemService(Context.LOCATION_SERVICE);
                    if (lm != null && hasLocationPermission(ctx)) {
                        Location bestLoc = null;
                        String[] providers = new String[]{
                            LocationManager.GPS_PROVIDER,
                            LocationManager.NETWORK_PROVIDER,
                            LocationManager.PASSIVE_PROVIDER,
                            "fused"
                        };
                        for (String p : providers) {
                            try {
                                Location candidate = lm.getLastKnownLocation(p);
                                if (candidate != null) {
                                    if (bestLoc == null || candidate.getTime() > bestLoc.getTime()) {
                                        bestLoc = candidate;
                                    }
                                }
                            } catch (Exception ignored) {}
                        }
                        if (bestLoc != null) {
                            applyGpsLocationFix(ctx, bestLoc);
                            resolvedByGps = true;
                        }
                    }

                    // Zero-Permission Hyperlocal HTTPS Geo-IP Fallback when GPS is unavailable or permission not yet granted
                    if (!resolvedByGps) {
                        resolveViaGeoIpFallback(ctx);
                    }
                } catch (Exception ignored) {
                } finally {
                    locationLookupInFlight = false;
                }
            }
        }).start();
    }

    private void applyGpsLocationFix(Context ctx, Location loc) {
        if (loc == null) return;
        double lat = loc.getLatitude();
        double lng = loc.getLongitude();
        if (lat == 0.0 && lng == 0.0) return;
        cachedLat = lat;
        cachedLng = lng;
        String resolvedName = "";
        try {
            if (Geocoder.isPresent()) {
                Geocoder geo = new Geocoder(ctx, Locale.getDefault());
                List<Address> addrs = geo.getFromLocation(lat, lng, 1);
                if (addrs != null && !addrs.isEmpty()) {
                    resolvedName = formatHyperlocalAddress(addrs.get(0));
                }
            }
        } catch (Exception ignored) {}
        if (resolvedName == null || resolvedName.isEmpty()) {
            resolvedName = String.format(Locale.US, "%.2f°N, %.2f°E", lat, lng);
        }
        cachedBackgroundLocation = resolvedName;
        saveHyperlocalToPrefs(ctx, resolvedName, lat, lng, false);
    }

    private void resolveViaGeoIpFallback(Context ctx) {
        String[] endpoints = new String[]{
            "https://ipwho.is/",
            "https://get.geojs.io/v1/ip/geo.json",
            "https://ipapi.co/json/"
        };
        for (String urlStr : endpoints) {
            HttpURLConnection conn = null;
            try {
                URL url = new URL(urlStr);
                conn = (HttpURLConnection) url.openConnection();
                conn.setConnectTimeout(4000);
                conn.setReadTimeout(4000);
                conn.setRequestProperty("Accept", "application/json");
                conn.setRequestProperty("User-Agent", "MinimumPhone/2.9.2");
                if (conn.getResponseCode() == 200) {
                    BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream(), "UTF-8"));
                    StringBuilder sb = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) {
                        sb.append(line);
                    }
                    reader.close();
                    JSONObject json = new JSONObject(sb.toString());
                    String city = json.optString("city", "").trim();
                    String region = json.optString("region", "").trim();
                    double lat = json.optDouble("latitude", 0.0);
                    double lng = json.optDouble("longitude", 0.0);
                    if (lat != 0.0 || lng != 0.0) {
                        String label = city;
                        if (!city.isEmpty() && !region.isEmpty() && !city.equalsIgnoreCase(region)) {
                            label = city + ", " + region;
                        } else if (label.isEmpty() && !region.isEmpty()) {
                            label = region;
                        }
                        if (!label.isEmpty()) {
                            cachedBackgroundLocation = label;
                        }
                        cachedLat = lat;
                        cachedLng = lng;
                        saveHyperlocalToPrefs(ctx, cachedBackgroundLocation, lat, lng, false);
                        return;
                    }
                }
            } catch (Exception ignored) {
            } finally {
                if (conn != null) {
                    try {
                        conn.disconnect();
                    } catch (Exception ignored) {}
                }
            }
        }
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
        } else if (requestCode == 802) {
            lastLocationLookupMs = 0L;
            triggerHyperlocalLookup(this, true);
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

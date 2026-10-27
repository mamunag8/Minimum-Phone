package com.kasbllc.minimumphone;

import android.Manifest;
import android.app.Activity;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.text.InputType;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import com.google.zxing.integration.android.IntentIntegrator;
import com.google.zxing.integration.android.IntentResult;

import java.util.Calendar;
import java.util.Random;

/**
 * Instant 0ms Pure Native Android OS Fortress Lock Screen.
 * Directly intercepts com.android.settings and unprotected browsers when Safe Private DNS
 * (family.cloudflare-dns.com / adult-filter-dns.cleanbrowsing.org) or Night Fortress is active.
 */
public class NativeFortressLockActivity extends Activity {

    private final Handler handler = new Handler(Looper.getMainLooper());
    private int cooldownSeconds = 30;
    private int mathA = 16;
    private int mathB = 4;
    private int mathC = 9;
    private int expectedMathAnswer = 73;
    private String expectedQrCode = "KASB-BRICK-77";
    private boolean isNightWindow = false;
    private boolean strictQr247 = false;
    private boolean needsPhysicalQr = false;

    private TextView timerBadge;
    private TextView dnsStatusView;
    private Button restoreDnsBtn;
    private EditText mathInput;
    private EditText qrInput;
    private TextView errorView;
    private Button unlockButton;

    private final Runnable countdownTask = new Runnable() {
        @Override
        public void run() {
            refreshDnsStatusBanner();
            if (cooldownSeconds > 0) {
                cooldownSeconds--;
                if (timerBadge != null) {
                    timerBadge.setText("⏳ STEP 1: WAIT COOLDOWN (" + cooldownSeconds + "s REMAINING)");
                }
                handler.postDelayed(this, 1000L);
            } else {
                if (timerBadge != null) {
                    timerBadge.setText("✅ STEP 1 COMPLETE: COOLDOWN FINISHED");
                    timerBadge.setTextColor(Color.parseColor("#34D399"));
                }
            }
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(
            WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON |
            WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
            WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
        );

        SharedPreferences prefs = getSharedPreferences(FortressWatchdogService.PREFS_NAME, Context.MODE_PRIVATE);
        expectedQrCode = prefs.getString(FortressWatchdogService.KEY_QR_CODE, "KASB-BRICK-77");
        if (expectedQrCode == null || expectedQrCode.trim().isEmpty()) {
            expectedQrCode = "KASB-BRICK-77";
        }
        strictQr247 = prefs.getBoolean(FortressWatchdogService.KEY_STRICT_QR_247, false);

        int startH = prefs.getInt(FortressWatchdogService.KEY_NIGHT_START_HOUR, 22);
        int endH = prefs.getInt(FortressWatchdogService.KEY_NIGHT_END_HOUR, 6);
        int hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY);
        isNightWindow = (startH > endH) ? (hour >= startH || hour < endH) : (hour >= startH && hour < endH);
        needsPhysicalQr = isNightWindow || strictQr247;
        cooldownSeconds = isNightWindow ? 30 : 15;

        Random rng = new Random();
        mathA = 12 + rng.nextInt(12);
        mathB = 3 + rng.nextInt(6);
        mathC = 5 + rng.nextInt(15);
        expectedMathAnswer = (mathA * mathB) + mathC;

        String reason = getIntent() != null ? getIntent().getStringExtra("intercept_reason") : "settings_locked";
        boolean isDnsTampered = "dns_removed".equals(reason);
        boolean isNightAppLock = "night_app_locked".equals(reason);
        boolean isDnsCurrentlySafe = FortressWatchdogService.isOsPrivateDnsConfigured(this);
        boolean isStrictNightSettingsLock = isNightWindow && isDnsCurrentlySafe && !isNightAppLock && !isDnsTampered;

        ScrollView scroll = new ScrollView(this);
        scroll.setBackgroundColor(Color.parseColor("#050505"));
        scroll.setFillViewport(true);

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        int pad = dp(20);
        root.setPadding(pad, dp(36), pad, pad);

        // Top Badge
        TextView topTag = new TextView(this);
        topTag.setText("🛡️ MINIMUM PHONE • NATIVE OS FORTRESS");
        topTag.setTextColor(Color.parseColor("#10B981"));
        topTag.setTextSize(11f);
        topTag.setTypeface(Typeface.MONOSPACE, Typeface.BOLD);
        root.addView(topTag);

        // Main Title
        TextView title = new TextView(this);
        title.setText(isDnsTampered
            ? "SAFE PRIVATE DNS REQUIRED!\nপ্রাইভেট ডিএনএস ছাড়া ফোন ও ব্রাউজার লক করা হয়েছে"
            : (isStrictNightSettingsLock
                ? "NIGHT DNS FORTRESS ACTIVE!\nরাতে ফোন সেটিংস ও ডিএনএস পরিবর্তন সম্পূর্ণ নিষিদ্ধ"
                : "SYSTEM SETTINGS LOCKED!\nফোন সেটিংস ও প্রাইভেট ডিএনএস সুরক্ষিত"));
        title.setTextColor(Color.WHITE);
        title.setTextSize(20f);
        title.setTypeface(Typeface.DEFAULT_BOLD);
        title.setPadding(0, dp(8), 0, dp(8));
        root.addView(title);

        // Subtitle
        TextView sub = new TextView(this);
        sub.setText(isDnsTampered
            ? "Safe Private DNS (family.cloudflare-dns.com) was turned off or modified. Activate Safe Private DNS below to continue."
            : (isStrictNightSettingsLock
                ? "At night (22:00–06:00), Phone Settings & Safe Private DNS are permanently locked so DNS can never be weakened or turned off at night."
                : "Phone Settings & Private DNS are strictly locked behind the Physical QR Fortress."));
        sub.setTextColor(Color.parseColor("#A1A1AA"));
        sub.setTextSize(13f);
        sub.setPadding(0, 0, 0, dp(14));
        root.addView(sub);

        // Live Private DNS Status & 1-Tap Restore Card
        LinearLayout dnsCard = new LinearLayout(this);
        dnsCard.setOrientation(LinearLayout.VERTICAL);
        dnsCard.setPadding(dp(14), dp(14), dp(14), dp(14));
        GradientDrawable dnsBg = new GradientDrawable();
        dnsBg.setColor(Color.parseColor("#06281E"));
        dnsBg.setStroke(dp(1), Color.parseColor("#10B981"));
        dnsBg.setCornerRadius(dp(8));
        dnsCard.setBackground(dnsBg);

        dnsStatusView = new TextView(this);
        dnsStatusView.setTextColor(Color.parseColor("#A7F3D0"));
        dnsStatusView.setTextSize(12f);
        dnsStatusView.setTypeface(Typeface.MONOSPACE, Typeface.BOLD);
        dnsCard.addView(dnsStatusView);

        restoreDnsBtn = new Button(this);
        restoreDnsBtn.setAllCaps(false);
        restoreDnsBtn.setText("🛡️ 1-Tap Activate Safe Private DNS (family.cloudflare-dns.com)");
        restoreDnsBtn.setTextColor(Color.BLACK);
        restoreDnsBtn.setBackgroundColor(Color.parseColor("#10B981"));
        restoreDnsBtn.setTypeface(Typeface.MONOSPACE, Typeface.BOLD);
        LinearLayout.LayoutParams restoreLp = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        );
        restoreLp.topMargin = dp(10);
        restoreDnsBtn.setLayoutParams(restoreLp);
        restoreDnsBtn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                activateSafePrivateDnsNow();
            }
        });
        dnsCard.addView(restoreDnsBtn);

        LinearLayout.LayoutParams dnsCardLp = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        );
        dnsCardLp.bottomMargin = dp(16);
        dnsCard.setLayoutParams(dnsCardLp);
        root.addView(dnsCard);

        if (isStrictNightSettingsLock) {
            TextView nightLockBanner = new TextView(this);
            nightLockBanner.setText("🌙 STRICT NIGHT LOCK (22:00–06:00)\nরাতের বেলা মোবাইল সেটিংস ও ডিএনএস পরিবর্তন সম্পূর্ণ বন্ধ। সকাল ৬:০০ টার আগে সেটিংস খোলা বা ডিএনএস পরিবর্তন করা যাবে না।");
            nightLockBanner.setTextColor(Color.parseColor("#FBBF24"));
            nightLockBanner.setTextSize(13.5f);
            nightLockBanner.setTypeface(Typeface.DEFAULT_BOLD);
            nightLockBanner.setPadding(dp(14), dp(14), dp(14), dp(14));
            GradientDrawable nlBg = new GradientDrawable();
            nlBg.setColor(Color.parseColor("#271A05"));
            nlBg.setStroke(dp(1), Color.parseColor("#F59E0B"));
            nlBg.setCornerRadius(dp(8));
            nightLockBanner.setBackground(nlBg);
            root.addView(nightLockBanner);
        } else {
            // Step 1: Cooldown Banner
            timerBadge = new TextView(this);
            timerBadge.setText("⏳ STEP 1: WAIT COOLDOWN (" + cooldownSeconds + "s REMAINING)");
            timerBadge.setTextColor(Color.parseColor("#FBBF24"));
            timerBadge.setTextSize(13f);
            timerBadge.setTypeface(Typeface.MONOSPACE, Typeface.BOLD);
            timerBadge.setPadding(dp(12), dp(12), dp(12), dp(12));
            GradientDrawable timerBg = new GradientDrawable();
            timerBg.setColor(Color.parseColor("#18181B"));
            timerBg.setStroke(dp(1), Color.parseColor("#3F3F46"));
            timerBg.setCornerRadius(dp(6));
            timerBadge.setBackground(timerBg);
            root.addView(timerBadge);

            // Step 2: Math Challenge
            TextView mathLabel = new TextView(this);
            mathLabel.setText("🧠 STEP 2: SOLVE ANTI-IMPULSE MATH:  (" + mathA + " × " + mathB + ") + " + mathC + " = ?");
            mathLabel.setTextColor(Color.parseColor("#E4E4E7"));
            mathLabel.setTextSize(12f);
            mathLabel.setTypeface(Typeface.MONOSPACE, Typeface.BOLD);
            mathLabel.setPadding(0, dp(14), 0, dp(6));
            root.addView(mathLabel);

            mathInput = new EditText(this);
            mathInput.setHint("Enter math answer...");
            mathInput.setHintTextColor(Color.parseColor("#71717A"));
            mathInput.setTextColor(Color.WHITE);
            mathInput.setInputType(InputType.TYPE_CLASS_NUMBER);
            mathInput.setPadding(dp(12), dp(10), dp(12), dp(10));
            GradientDrawable inputBg1 = new GradientDrawable();
            inputBg1.setColor(Color.parseColor("#121215"));
            inputBg1.setStroke(dp(1), Color.parseColor("#52525B"));
            inputBg1.setCornerRadius(dp(6));
            mathInput.setBackground(inputBg1);
            root.addView(mathInput);

            // Step 3: Physical QR Code Camera Scanner
            TextView qrLabel = new TextView(this);
            qrLabel.setText(needsPhysicalQr
                ? "🧱 STEP 3 (CAMERA QR SCAN REQUIRED): SCAN PHYSICAL QR CARD\n(ফিজিক্যাল QR কোড ক্যামেরা দিয়ে স্ক্যান ছাড়া আনলক করা যাবে না)"
                : "☀️ STEP 3 (DAYTIME 06:00–22:00): QR SCAN OR DAYTIME WORK BYPASS\n(দিনের বেলা কাজের প্রয়োজনে QR ছাড়াই ধাপ ১ ও ২ পূর্ণ করে আনলক করতে পারবেন)");
            qrLabel.setTextColor(Color.parseColor("#E4E4E7"));
            qrLabel.setTextSize(12f);
            qrLabel.setTypeface(Typeface.MONOSPACE, Typeface.BOLD);
            qrLabel.setPadding(0, dp(14), 0, dp(6));
            root.addView(qrLabel);

            Button scanQrBtn = new Button(this);
            scanQrBtn.setAllCaps(false);
            scanQrBtn.setText("📷 Scan Physical QR Code with Camera (QR স্ক্যান করুন)");
            scanQrBtn.setTextColor(Color.BLACK);
            scanQrBtn.setBackgroundColor(Color.parseColor("#10B981"));
            scanQrBtn.setTypeface(Typeface.MONOSPACE, Typeface.BOLD);
            LinearLayout.LayoutParams scanLp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            );
            scanLp.bottomMargin = dp(8);
            scanQrBtn.setLayoutParams(scanLp);
            scanQrBtn.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    startCameraQrScan();
                }
            });
            root.addView(scanQrBtn);

            qrInput = new EditText(this);
            qrInput.setHint(needsPhysicalQr
                ? "Camera QR Scan Only (Manual typing disabled)"
                : "Scan QR above or enter your physical key...");
            qrInput.setHintTextColor(Color.parseColor("#71717A"));
            qrInput.setTextColor(Color.WHITE);
            qrInput.setPadding(dp(12), dp(10), dp(12), dp(10));
            if (needsPhysicalQr) {
                qrInput.setFocusable(false);
                qrInput.setClickable(false);
                qrInput.setCursorVisible(false);
                qrInput.setKeyListener(null);
            }
            GradientDrawable inputBg2 = new GradientDrawable();
            inputBg2.setColor(Color.parseColor("#121215"));
            inputBg2.setStroke(dp(1), Color.parseColor("#52525B"));
            inputBg2.setCornerRadius(dp(6));
            qrInput.setBackground(inputBg2);
            root.addView(qrInput);

            errorView = new TextView(this);
            errorView.setTextColor(Color.parseColor("#F87171"));
            errorView.setTextSize(12f);
            errorView.setPadding(0, dp(8), 0, dp(4));
            root.addView(errorView);

            // Unlock Button
            unlockButton = new Button(this);
            unlockButton.setAllCaps(false);
            unlockButton.setText(needsPhysicalQr
                ? "🔓 Verify Camera QR & Unlock"
                : "☀️ Daytime Work Bypass: Unlock for 30s (After Step 1 & 2)");
            unlockButton.setTextColor(Color.BLACK);
            unlockButton.setBackgroundColor(Color.parseColor("#F4F4F5"));
            unlockButton.setTypeface(Typeface.MONOSPACE, Typeface.BOLD);
            LinearLayout.LayoutParams unlockLp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            );
            unlockLp.topMargin = dp(12);
            unlockButton.setLayoutParams(unlockLp);
            unlockButton.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    attemptUnlockSettings();
                }
            });
            root.addView(unlockButton);
        }

        // Return Home Button
        Button homeBtn = new Button(this);
        homeBtn.setAllCaps(false);
        homeBtn.setText("🏠 Return to Minimum Phone Home (Stay Protected)");
        homeBtn.setTextColor(Color.WHITE);
        homeBtn.setBackgroundColor(Color.parseColor("#27272A"));
        homeBtn.setTypeface(Typeface.MONOSPACE, Typeface.BOLD);
        LinearLayout.LayoutParams homeLp = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        );
        homeLp.topMargin = dp(12);
        homeBtn.setLayoutParams(homeLp);
        homeBtn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                goHomeNow();
            }
        });
        root.addView(homeBtn);

        scroll.addView(root);
        setContentView(scroll);

        refreshDnsStatusBanner();
        handler.postDelayed(countdownTask, 1000L);
    }

    private void refreshDnsStatusBanner() {
        if (dnsStatusView == null) return;
        boolean active = FortressWatchdogService.isOsPrivateDnsConfigured(this);
        String host = FortressWatchdogService.getOsPrivateDnsHost(this);
        if (active) {
            dnsStatusView.setText("✅ OS SAFE PRIVATE DNS ACTIVE: " + host + "\nAdult & Gambling Domains Blocked System-Wide");
            dnsStatusView.setTextColor(Color.parseColor("#6EE7B7"));
            if (restoreDnsBtn != null) {
                restoreDnsBtn.setVisibility(View.GONE);
            }
        } else {
            dnsStatusView.setText("⚠️ OS SAFE PRIVATE DNS IS OFF / REMOVED!\nTap below to copy & activate family.cloudflare-dns.com");
            dnsStatusView.setTextColor(Color.parseColor("#FCD34D"));
            if (restoreDnsBtn != null) {
                restoreDnsBtn.setVisibility(View.VISIBLE);
            }
        }
    }

    private void activateSafePrivateDnsNow() {
        if (FortressWatchdogService.isOsPrivateDnsConfigured(this)) {
            Toast.makeText(this, "🛡️ Safe Private DNS is already active & locked!", Toast.LENGTH_SHORT).show();
            refreshDnsStatusBanner();
            goHomeNow();
            return;
        }

        SharedPreferences prefs = getSharedPreferences(FortressWatchdogService.PREFS_NAME, Context.MODE_PRIVATE);
        String targetHost = prefs.getString(FortressWatchdogService.KEY_EXPECTED_DNS_HOST, "family.cloudflare-dns.com");
        if (targetHost == null || targetHost.trim().isEmpty()) {
            targetHost = "family.cloudflare-dns.com";
        }

        // 1. Copy hostname to clipboard
        try {
            ClipboardManager cb = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
            if (cb != null) {
                cb.setPrimaryClip(ClipData.newPlainText("Safe Private DNS", targetHost));
            }
        } catch (Exception ignored) {}

        // 2. Attempt direct Settings.Global write
        FortressWatchdogService.ensurePrivateDnsActiveAtNight(this);
        if (FortressWatchdogService.isOsPrivateDnsConfigured(this)) {
            Toast.makeText(this, "✅ Safe Private DNS (" + targetHost + ") Activated & Locked!", Toast.LENGTH_LONG).show();
            refreshDnsStatusBanner();
            goHomeNow();
            return;
        }

        // 3. Grant a short 20-second lease ONLY when DNS is currently OFF so user can paste hostname into Private DNS settings
        prefs.edit()
            .putLong(FortressWatchdogService.KEY_TEMP_UNLOCK_UNTIL_MS, System.currentTimeMillis() + 20000L)
            .putString(FortressWatchdogService.KEY_TEMP_UNLOCK_REASON, "dns_setup")
            .apply();
        Toast.makeText(
            this,
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
        finish();
    }

    private void attemptUnlockSettings() {
        String reason = getIntent() != null ? getIntent().getStringExtra("intercept_reason") : "settings_locked";
        boolean isNightAppLock = "night_app_locked".equals(reason);
        boolean isDnsCurrentlySafe = FortressWatchdogService.isOsPrivateDnsConfigured(this);

        if (isNightWindow && isDnsCurrentlySafe && !isNightAppLock) {
            if (errorView != null) {
                errorView.setText("🔒 Night DNS Fortress Active (22:00–06:00): Phone Settings & DNS cannot be unlocked or modified at night.");
            }
            return;
        }

        if (cooldownSeconds > 0) {
            errorView.setText("⚠️ Please wait " + cooldownSeconds + " more seconds for Step 1 cooldown.");
            return;
        }
        String mathStr = mathInput.getText() != null ? mathInput.getText().toString().trim() : "";
        int userMath = -9999;
        try {
            userMath = Integer.parseInt(mathStr);
        } catch (Exception ignored) {}

        if (userMath != expectedMathAnswer) {
            errorView.setText("⚠️ Step 2 Math answer is incorrect. Solve (" + mathA + " × " + mathB + ") + " + mathC);
            return;
        }

        String qrStr = qrInput.getText() != null ? qrInput.getText().toString().trim() : "";
        if (needsPhysicalQr && !qrStr.equalsIgnoreCase(expectedQrCode)) {
            errorView.setText("⚠️ Physical QR Code Camera Scan is strictly required! Please scan your printed QR Card.");
            return;
        }

        SharedPreferences prefs = getSharedPreferences(FortressWatchdogService.PREFS_NAME, Context.MODE_PRIVATE);
        if (isNightAppLock) {
            // Only unlock night-locked app for 10 minutes; NEVER unlock com.android.settings at night!
            prefs.edit()
                .putLong(FortressWatchdogService.KEY_QR_VERIFIED_UNLOCK_UNTIL_MS, System.currentTimeMillis() + 600000L)
                .apply();
            Toast.makeText(this, "🔓 App unlocked via Physical QR! (Phone Settings & DNS remain locked)", Toast.LENGTH_LONG).show();
        } else {
            // Daytime temporary settings unlock (25 seconds max; revokes immediately if DNS is touched!)
            prefs.edit()
                .putLong(FortressWatchdogService.KEY_TEMP_UNLOCK_UNTIL_MS, System.currentTimeMillis() + 25000L)
                .putString(FortressWatchdogService.KEY_TEMP_UNLOCK_REASON, "daytime_verified")
                .apply();
            Toast.makeText(this, "🔓 Settings unlocked briefly (25s). DNS remains protected!", Toast.LENGTH_LONG).show();
        }
        finish();
    }

    private void startCameraQrScan() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (checkSelfPermission(Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
                requestPermissions(new String[]{Manifest.permission.CAMERA}, 701);
                return;
            }
        }
        launchZxingScanner();
    }

    private void launchZxingScanner() {
        try {
            IntentIntegrator integrator = new IntentIntegrator(this);
            integrator.setDesiredBarcodeFormats(IntentIntegrator.QR_CODE);
            integrator.setPrompt("Scan your Physical Minimum Phone QR Card / আপনার ফিজিক্যাল QR কোড স্ক্যান করুন");
            integrator.setBeepEnabled(true);
            integrator.setOrientationLocked(true);
            integrator.initiateScan();
        } catch (Exception e) {
            Toast.makeText(this, "Camera scanner error: " + e.getMessage(), Toast.LENGTH_SHORT).show();
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == 701 && grantResults != null && grantResults.length > 0
                && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
            launchZxingScanner();
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        IntentResult result = IntentIntegrator.parseActivityResult(requestCode, resultCode, data);
        if (result != null) {
            if (result.getContents() != null) {
                String scanned = result.getContents().trim();
                if (qrInput != null) {
                    qrInput.setText(scanned);
                }
                if (scanned.equalsIgnoreCase(expectedQrCode)) {
                    if (errorView != null) {
                        errorView.setText("✅ Physical QR Code Scanned & Verified!");
                        errorView.setTextColor(Color.parseColor("#34D399"));
                    }
                    Toast.makeText(this, "✅ Physical QR Code Verified!", Toast.LENGTH_SHORT).show();
                } else {
                    if (errorView != null) {
                        errorView.setText("⚠️ Scanned QR code does not match your Minimum Phone QR Card!");
                        errorView.setTextColor(Color.parseColor("#F87171"));
                    }
                }
            }
            return;
        }
        super.onActivityResult(requestCode, resultCode, data);
    }

    private void goHomeNow() {
        Intent home = new Intent(this, MainActivity.class);
        home.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        startActivity(home);
        finish();
    }

    @Override
    public void onBackPressed() {
        goHomeNow();
    }

    @Override
    protected void onDestroy() {
        handler.removeCallbacks(countdownTask);
        super.onDestroy();
    }

    private int dp(int v) {
        float density = getResources().getDisplayMetrics().density;
        return Math.round(v * density);
    }
}

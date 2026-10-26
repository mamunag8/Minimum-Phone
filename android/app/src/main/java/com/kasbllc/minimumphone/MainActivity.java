package com.kasbllc.minimumphone;

import android.content.Intent;
import android.graphics.Color;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.webkit.WebSettings;
import android.webkit.WebView;

import androidx.activity.OnBackPressedCallback;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(MinimumPhoneNativePlugin.class);
        super.onCreate(savedInstanceState);

        // Native OS Edge-to-Edge & System Bar Inset Fitting (Android 10 - Android 16 / SDK 36 compliant)
        try {
            Window window = getWindow();
            WindowCompat.setDecorFitsSystemWindows(window, false);
            window.getDecorView().setBackgroundColor(Color.BLACK);

            WindowInsetsControllerCompat insetsController =
                WindowCompat.getInsetsController(window, window.getDecorView());
            if (insetsController != null) {
                insetsController.setAppearanceLightStatusBars(false);
                insetsController.setAppearanceLightNavigationBars(false);
            }

            View contentView = findViewById(android.R.id.content);
            if (contentView != null) {
                contentView.setBackgroundColor(Color.BLACK);
                ViewCompat.setOnApplyWindowInsetsListener(contentView, (v, windowInsets) -> {
                    Insets insets = windowInsets.getInsets(
                        WindowInsetsCompat.Type.systemBars()
                            | WindowInsetsCompat.Type.displayCutout()
                            | WindowInsetsCompat.Type.ime()
                    );
                    v.setPadding(insets.left, insets.top, insets.right, insets.bottom);
                    return WindowInsetsCompat.CONSUMED;
                });
            }
        } catch (Exception ignored) {}

        // Configure WebView to behave 100% as a Native OS Launcher (no scrollbars, no horizontal drift, no zoom)
        try {
            if (getBridge() != null && getBridge().getWebView() != null) {
                WebView wv = getBridge().getWebView();
                wv.setBackgroundColor(Color.BLACK);
                wv.setVerticalScrollBarEnabled(false);
                wv.setHorizontalScrollBarEnabled(false);
                wv.setOverScrollMode(View.OVER_SCROLL_NEVER);

                WebSettings ws = wv.getSettings();
                ws.setSupportZoom(false);
                ws.setBuiltInZoomControls(false);
                ws.setDisplayZoomControls(false);
                ws.setUseWideViewPort(true);
                ws.setLoadWithOverviewMode(true);
                ws.setTextZoom(100);
            }
        } catch (Exception ignored) {}

        // Intercept hardware Back button / gesture so the launcher NEVER closes or exits to stock home
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                dispatchWebEvent("minimumphone:back");
            }
        });

        // Start Real-Time System Settings Lock & Night Fortress Watchdog Service
        try {
            NightFortressReceiver.startWatchdogSafely(this);
            NightFortressReceiver.scheduleNightAlarm(this, 22);
        } catch (Exception ignored) {}

        checkInterceptedIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        if (!checkInterceptedIntent(intent)) {
            // When Home button is pressed while Minimum Phone is default launcher, snap back to Home screen
            dispatchWebEvent("minimumphone:home");
        }
    }

    private boolean checkInterceptedIntent(Intent intent) {
        if (intent != null && intent.getBooleanExtra("intercepted_system_settings", false)) {
            intent.removeExtra("intercepted_system_settings");
            dispatchWebEvent("minimumphone:intercepted_settings");
            return true;
        }
        return false;
    }

    @Override
    public void onResume() {
        super.onResume();
        dispatchWebEvent("minimumphone:resume");
    }

    private void dispatchWebEvent(String eventName) {
        try {
            if (getBridge() != null && getBridge().getWebView() != null) {
                WebView wv = getBridge().getWebView();
                wv.post(() -> wv.evaluateJavascript(
                    "window.dispatchEvent(new CustomEvent('" + eventName + "'));",
                    null
                ));
            }
        } catch (Exception ignored) {}
    }
}

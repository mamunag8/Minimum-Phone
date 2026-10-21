package com.kasbllc.minimumphone;

import android.content.Intent;
import android.graphics.Color;
import android.os.Bundle;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebView;

import androidx.activity.OnBackPressedCallback;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(MinimumPhoneNativePlugin.class);
        super.onCreate(savedInstanceState);

        // Enforce pure monochrome OLED black system bars
        try {
            Window window = getWindow();
            window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
            window.setStatusBarColor(Color.BLACK);
            window.setNavigationBarColor(Color.BLACK);
        } catch (Exception ignored) {}

        // Intercept hardware Back button / gesture so the launcher NEVER closes or exits to stock home
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                dispatchWebEvent("minimumphone:back");
            }
        });
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        // When Home button is pressed while Minimum Phone is default launcher, snap back to Home screen
        dispatchWebEvent("minimumphone:home");
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

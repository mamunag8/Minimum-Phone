package com.kasbllc.minimumphone;

import android.app.Activity;
import android.os.Bundle;

/**
 * Dummy HOME activity used momentarily via PackageManager.setComponentEnabledSetting()
 * to force Android (including Samsung One UI, Xiaomi HyperOS, Oppo/Vivo) to invalidate
 * any existing "Always" default stock launcher binding and display the system Home app chooser.
 */
public class FakeLauncherActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        finish();
    }
}

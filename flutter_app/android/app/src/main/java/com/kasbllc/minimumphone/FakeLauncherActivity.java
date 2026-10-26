package com.kasbllc.minimumphone;

import android.app.Activity;
import android.os.Bundle;

public class FakeLauncherActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        finish();
    }
}

package com.kasbllc.minimumphone;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;

import java.util.Calendar;

/**
 * BroadcastReceiver that ensures the Safe Private DNS & Night Fortress Watchdog starts
 * automatically on device boot, app update, or 22:00 Night Fortress transition.
 */
public class NightFortressReceiver extends BroadcastReceiver {
    public static final String ACTION_NIGHT_FORTRESS_ALARM = "com.kasbllc.minimumphone.NIGHT_FORTRESS_ALARM";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null) return;
        String action = intent.getAction();
        if (action == null) return;

        SharedPreferences prefs = context.getSharedPreferences(
            FortressWatchdogService.PREFS_NAME, Context.MODE_PRIVATE
        );
        boolean watchdogEnabled = prefs.getBoolean(FortressWatchdogService.KEY_WATCHDOG_ENABLED, true);
        boolean autoNightDns = prefs.getBoolean(FortressWatchdogService.KEY_AUTO_DNS_NIGHT, true);
        int nightStartHour = prefs.getInt(FortressWatchdogService.KEY_NIGHT_START_HOUR, 22);
        int nightEndHour = prefs.getInt(FortressWatchdogService.KEY_NIGHT_END_HOUR, 6);

        if (watchdogEnabled) {
            startWatchdogSafely(context);
            scheduleNightAlarm(context, nightStartHour);
        }

        Calendar cal = Calendar.getInstance();
        int hour = cal.get(Calendar.HOUR_OF_DAY);
        boolean isNightNow = (nightStartHour > nightEndHour)
            ? (hour >= nightStartHour || hour < nightEndHour)
            : (hour >= nightStartHour && hour < nightEndHour);

        if (isNightNow && autoNightDns) {
            FortressWatchdogService.ensurePrivateDnsActiveAtNight(context);
        }
    }

    public static void startWatchdogSafely(Context context) {
        try {
            Intent serviceIntent = new Intent(context, FortressWatchdogService.class);
            context.startService(serviceIntent);
        } catch (Exception ignored) {}
    }

    public static void scheduleNightAlarm(Context context, int nightStartHour) {
        try {
            AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (am == null) return;

            Intent alarmIntent = new Intent(context, NightFortressReceiver.class);
            alarmIntent.setAction(ACTION_NIGHT_FORTRESS_ALARM);
            PendingIntent pi = PendingIntent.getBroadcast(
                context,
                2200,
                alarmIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            Calendar target = Calendar.getInstance();
            target.set(Calendar.HOUR_OF_DAY, nightStartHour);
            target.set(Calendar.MINUTE, 0);
            target.set(Calendar.SECOND, 5);
            if (target.getTimeInMillis() <= System.currentTimeMillis()) {
                target.add(Calendar.DAY_OF_YEAR, 1);
            }

            am.setInexactRepeating(
                AlarmManager.RTC_WAKEUP,
                target.getTimeInMillis(),
                AlarmManager.INTERVAL_DAY,
                pi
            );
        } catch (Exception ignored) {}
    }
}

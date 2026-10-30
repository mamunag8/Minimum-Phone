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
 * automatically on device boot, app update, 22:00 Night Fortress transition, or system clock/timezone tamper.
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

        // Anti-Clock-Tamper Defense:
        // If user manually changes system clock, date, or timezone without a valid Camera QR lease,
        // lock Night Fortress mode for 8 hours and revoke any temporary unlock lease!
        boolean isClockAction = Intent.ACTION_TIME_CHANGED.equals(action)
            || Intent.ACTION_DATE_CHANGED.equals(action)
            || Intent.ACTION_TIMEZONE_CHANGED.equals(action)
            || "android.intent.action.TIME_SET".equals(action);

        long now = System.currentTimeMillis();
        long nightQrVerifiedUntil = prefs.getLong(FortressWatchdogService.KEY_NIGHT_QR_VERIFIED_UNTIL_MS, 0L);

        if (isClockAction && now >= nightQrVerifiedUntil) {
            prefs.edit()
                .putLong(FortressWatchdogService.KEY_CLOCK_TAMPER_UNTIL_MS, now + (8L * 3600_000L))
                .putLong(FortressWatchdogService.KEY_TEMP_UNLOCK_UNTIL_MS, 0L)
                .putString(FortressWatchdogService.KEY_TEMP_UNLOCK_REASON, "")
                .apply();
        }

        if (watchdogEnabled) {
            startWatchdogSafely(context);
            scheduleNightAlarm(context, nightStartHour);
        }

        Calendar cal = Calendar.getInstance();
        int hour = cal.get(Calendar.HOUR_OF_DAY);
        long clockTamperUntil = prefs.getLong(FortressWatchdogService.KEY_CLOCK_TAMPER_UNTIL_MS, 0L);
        boolean isNightNow = (now < clockTamperUntil) || ((nightStartHour > nightEndHour)
            ? (hour >= nightStartHour || hour < nightEndHour)
            : (hour >= nightStartHour && hour < nightEndHour));

        if (isNightNow && autoNightDns) {
            boolean ok = FortressWatchdogService.ensurePrivateDnsActiveAtNight(context);
            if (!ok && !FortressWatchdogService.isOsPrivateDnsConfigured(context)) {
                try {
                    Intent lockIntent = new Intent(context, NativeFortressLockActivity.class);
                    lockIntent.addFlags(
                        Intent.FLAG_ACTIVITY_NEW_TASK |
                        Intent.FLAG_ACTIVITY_CLEAR_TOP |
                        Intent.FLAG_ACTIVITY_SINGLE_TOP
                    );
                    lockIntent.putExtra("intercept_reason", "dns_removed");
                    context.startActivity(lockIntent);
                } catch (Exception ignored) {}
            }
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

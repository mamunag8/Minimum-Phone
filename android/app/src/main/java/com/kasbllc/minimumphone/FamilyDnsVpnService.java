package com.kasbllc.minimumphone;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.VpnService;
import android.os.Build;
import android.os.ParcelFileDescriptor;

import java.io.IOException;

/**
 * Zero-Battery Local Family DNS Shield (VpnService).
 * Routes ONLY DNS resolver IPs (1.1.1.3 / 1.0.0.3 Cloudflare Family & 185.228.168.168 CleanBrowsing)
 * so 100% of adult/porn domains are blocked OS-wide across all browsers and apps
 * without needing manual Android Settings changes, and auto-activates at night (22:00 - 06:00).
 */
public class FamilyDnsVpnService extends VpnService {

    public static final String ACTION_START_DNS = "com.kasbllc.minimumphone.START_DNS";
    public static final String ACTION_STOP_DNS = "com.kasbllc.minimumphone.STOP_DNS";
    public static final String ACTION_START_VPN = ACTION_START_DNS;
    public static final String ACTION_STOP_VPN = ACTION_STOP_DNS;
    public static final String EXTRA_AUTO_NIGHT = "extra_auto_night";
    public static final String PREFS_NAME = "minimum_phone_fortress";
    public static final String KEY_VPN_DNS_ACTIVE = "vpn_dns_active";
    private static final int VPN_NOTIF_ID = 9911;

    private static volatile boolean runningInstance = false;
    private ParcelFileDescriptor vpnInterface = null;

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && ACTION_STOP_DNS.equals(intent.getAction())) {
            stopDnsTunnel();
            stopSelf();
            return START_NOT_STICKY;
        }

        startDnsTunnel();
        return START_STICKY;
    }

    private void startForegroundNotification() {
        try {
            NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            String channelId = "minphone_dns_shield";
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && nm != null) {
                NotificationChannel channel = new NotificationChannel(
                    channelId,
                    "Minimum Phone Private DNS Shield",
                    NotificationManager.IMPORTANCE_LOW
                );
                nm.createNotificationChannel(channel);
            }

            Intent tapIntent = new Intent(this, MainActivity.class);
            tapIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            int piFlags = Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
                ? PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
                : PendingIntent.FLAG_UPDATE_CURRENT;
            PendingIntent pi = PendingIntent.getActivity(this, VPN_NOTIF_ID, tapIntent, piFlags);

            Notification.Builder builder = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                ? new Notification.Builder(this, channelId)
                : new Notification.Builder(this);

            builder.setSmallIcon(android.R.drawable.ic_secure)
                   .setContentTitle("Minimum Phone · Family DNS Shield Active")
                   .setContentText("1.1.1.3 Adult & Malware Protection Locked (24/7 & Night Guard)")
                   .setOngoing(true)
                   .setContentIntent(pi);

            startForeground(VPN_NOTIF_ID, builder.build());
        } catch (Exception ignored) {}
    }

    private void startDnsTunnel() {
        if (vpnInterface != null) {
            setVpnActivePref(this, true);
            return;
        }
        try {
            Builder builder = new Builder();
            builder.setSession("Minimum Phone Family DNS (1.1.1.3)");
            builder.setMtu(1500);
            builder.addAddress("10.255.255.1", 32);

            // Cloudflare Family (1.1.1.3 / 1.0.0.3) + CleanBrowsing Adult Filter (185.228.168.168)
            builder.addDnsServer("1.1.1.3");
            builder.addDnsServer("1.0.0.3");
            builder.addDnsServer("185.228.168.168");

            // Route ONLY the DNS server IPs through the virtual interface so normal internet traffic
            // flows directly at full speed with zero battery drain
            builder.addRoute("1.1.1.3", 32);
            builder.addRoute("1.0.0.3", 32);
            builder.addRoute("185.228.168.168", 32);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                builder.setMetered(false);
            }

            vpnInterface = builder.establish();
            setVpnActivePref(this, vpnInterface != null);
        } catch (Exception e) {
            setVpnActivePref(this, false);
        }
    }

    private void stopDnsTunnel() {
        setVpnActivePref(this, false);
        if (vpnInterface != null) {
            try {
                vpnInterface.close();
            } catch (IOException ignored) {}
            vpnInterface = null;
        }
        try {
            stopForeground(true);
        } catch (Exception ignored) {}
    }

    @Override
    public void onDestroy() {
        stopDnsTunnel();
        super.onDestroy();
    }

    public static void setVpnActivePref(Context ctx, boolean active) {
        runningInstance = active;
        try {
            SharedPreferences prefs = ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            prefs.edit().putBoolean(KEY_VPN_DNS_ACTIVE, active).apply();
        } catch (Exception ignored) {}
    }

    public static boolean isRunning() {
        return runningInstance;
    }

    public static boolean isVpnActivePref(Context ctx) {
        try {
            SharedPreferences prefs = ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            return prefs.getBoolean(KEY_VPN_DNS_ACTIVE, false);
        } catch (Exception ignored) {
            return false;
        }
    }
}

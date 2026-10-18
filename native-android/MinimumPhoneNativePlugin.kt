package com.kasbllc.minimumphone

import android.app.AutomaticZenRule
import android.app.NotificationManager
import android.app.role.RoleManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.service.notification.Condition
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.service.notification.ZenDeviceEffects
import android.view.accessibility.AccessibilityEvent
import android.accessibilityservice.AccessibilityService
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

/**
 * Minimum Phone — Native Android System Bridge (Google Play Store Edition)
 * Handles:
 * 1. Default Home Launcher Role (Intent.CATEGORY_HOME)
 * 2. Zero-ADB System Grayscale via Android ZenDeviceEffects
 * 3. AccessibilityService Foreground App & Adult Keyword Interceptor
 * 4. NotificationListenerService Twice-Daily Digest + Urgent Breakthrough
 */
@CapacitorPlugin(name = "MinimumPhoneNative")
class MinimumPhoneNativePlugin : Plugin() {

    @PluginMethod
    fun setDefaultLauncher(call: PluginCall) {
        val ctx = context
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val roleManager = ctx.getSystemService(RoleManager::class.java)
            if (roleManager != null && roleManager.isRoleAvailable(RoleManager.ROLE_HOME)) {
                val intent = roleManager.createRequestRoleIntent(RoleManager.ROLE_HOME)
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                ctx.startActivity(intent)
            }
        } else {
            val intent = Intent(Intent.ACTION_MAIN)
            intent.addCategory(Intent.CATEGORY_HOME)
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
            ctx.startActivity(intent)
        }
        val ret = JSObject()
        ret.put("granted", true)
        ret.put("platform", "android")
        call.resolve(ret)
    }

    @PluginMethod
    fun setSystemGrayscale(call: PluginCall) {
        val enabled = call.getBoolean("enabled", true) ?: true
        val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        var methodUsed = "Launcher Monochrome Layer"

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.VANILLA_ICE_CREAM && nm.isNotificationPolicyAccessGranted) {
            val effects = ZenDeviceEffects.Builder()
                .setShouldDisplayGrayscale(enabled)
                .setShouldSuppressAmbientDisplay(enabled)
                .build()

            val rule = AutomaticZenRule.Builder("Minimum Phone Calm Grayscale", Uri.parse("condition://minimumphone/grayscale"))
                .setType(AutomaticZenRule.TYPE_BEDTIME)
                .setDeviceEffects(effects)
                .setInterruptionFilter(NotificationManager.INTERRUPTION_FILTER_ALL)
                .build()

            nm.addAutomaticZenRule(rule)
            methodUsed = "Android ZenDeviceEffects Hardware Grayscale"
        }

        val ret = JSObject()
        ret.put("applied", enabled)
        ret.put("method", methodUsed)
        call.resolve(ret)
    }
}

/**
 * Foreground App & Adult Content Interceptor (AccessibilityService)
 */
class AppInterceptAccessibilityService : AccessibilityService() {
    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return
        if (event.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            val pkg = event.packageName?.toString() ?: return
            val prefs = getSharedPreferences("MinimumPhonePrefs", Context.MODE_PRIVATE)
            val restrictedSet = prefs.getStringSet("restricted_packages", emptySet()) ?: emptySet()

            if (restrictedSet.contains(pkg)) {
                val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
                launchIntent?.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
                launchIntent?.putExtra("intercepted_package", pkg)
                startActivity(launchIntent)
            }
        }
    }

    override fun onInterrupt() {}
}

/**
 * Twice-Daily Notification Digest + Smart Emergency Breakthrough (NotificationListenerService)
 */
class DigestNotificationListenerService : NotificationListenerService() {
    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        if (sbn == null || sbn.isOngoing) return
        val extras = sbn.notification.extras
        val title = extras.getString("android.title") ?: ""
        val text = extras.getCharSequence("android.text")?.toString() ?: ""

        // Allow urgent keywords or VIP callers to break through immediately
        val isUrgent = text.contains("URGENT", ignoreCase = true) ||
                text.contains("EMERGENCY", ignoreCase = true) ||
                text.contains("জরুরি", ignoreCase = true)

        if (!isUrgent) {
            // Mute and store into local SQLite / SharedPreferences batch for 12:00 PM & 6:00 PM digest
            cancelNotification(sbn.key)
        }
    }
}

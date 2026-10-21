#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

CAP_PLUGIN(MinimumPhoneNativePlugin, "MinimumPhoneNative",
    CAP_PLUGIN_METHOD(getLauncherStatus, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(requestDefaultLauncherRole, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(forceShowHomePicker, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(openHomeSettings, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(openPhoneSystemSetting, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(setKioskPinLock, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(getInstalledApps, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(launchApp, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(setDefaultLauncher, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(setAdultDnsFilter, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(setUninstallProtection, CAPPluginReturnPromise);
)

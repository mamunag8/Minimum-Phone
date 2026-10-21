import { Capacitor, registerPlugin } from '@capacitor/core';
import type { AppItem } from '../types/app';

export interface NativeLauncherStatus {
  isDefaultLauncher: boolean;
  currentDefaultPackage: string;
  isKioskPinned: boolean;
  batteryLevel: number;
  isCharging: boolean;
  platform: string;
  actionTaken?: string;
}

export interface NativeInstalledApp {
  id: string;
  packageName: string;
  name: string;
  category: 'work' | 'utility' | 'social' | 'entertainment' | 'communication' | 'browser';
  tier: 'essential' | 'utility' | 'restricted';
  isSystemApp: boolean;
}

export interface MinimumPhoneNativePluginInterface {
  getLauncherStatus(): Promise<NativeLauncherStatus>;
  requestDefaultLauncherRole(): Promise<NativeLauncherStatus>;
  forceShowHomePicker(): Promise<NativeLauncherStatus>;
  openHomeSettings(): Promise<NativeLauncherStatus>;
  setKioskPinLock(options: { enabled: boolean }): Promise<NativeLauncherStatus>;
  getInstalledApps(): Promise<{ apps: NativeInstalledApp[]; count: number }>;
  launchApp(options: {
    packageName?: string;
    appId?: string;
    durationMinutes?: number;
  }): Promise<{ launched: boolean; packageName?: string; appId?: string }>;
}

const MinimumPhoneNative = registerPlugin<MinimumPhoneNativePluginInterface>(
  'MinimumPhoneNative'
);

export const isNativeAndroid = (): boolean =>
  Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

export async function fetchNativeLauncherStatus(): Promise<NativeLauncherStatus> {
  if (!isNativeAndroid()) {
    return {
      isDefaultLauncher: false,
      currentDefaultPackage: 'com.android.launcher3',
      isKioskPinned: false,
      batteryLevel: 88,
      isCharging: false,
      platform: 'web',
    };
  }
  try {
    return await MinimumPhoneNative.getLauncherStatus();
  } catch {
    return {
      isDefaultLauncher: false,
      currentDefaultPackage: 'unknown',
      isKioskPinned: false,
      batteryLevel: 85,
      isCharging: false,
      platform: 'android',
    };
  }
}

export async function requestDefaultHomeLauncher(): Promise<NativeLauncherStatus> {
  if (!isNativeAndroid()) {
    return {
      isDefaultLauncher: true,
      currentDefaultPackage: 'com.kasbllc.minimumphone',
      isKioskPinned: false,
      batteryLevel: 88,
      isCharging: false,
      platform: 'web',
      actionTaken: 'simulated_default',
    };
  }
  return await MinimumPhoneNative.requestDefaultLauncherRole();
}

export async function forceTriggerHomePicker(): Promise<NativeLauncherStatus> {
  if (!isNativeAndroid()) {
    return await requestDefaultHomeLauncher();
  }
  return await MinimumPhoneNative.forceShowHomePicker();
}

export async function openSystemHomeSettings(): Promise<NativeLauncherStatus> {
  if (!isNativeAndroid()) {
    return await requestDefaultHomeLauncher();
  }
  return await MinimumPhoneNative.openHomeSettings();
}

export async function toggleHardwareKioskPin(
  enabled: boolean
): Promise<NativeLauncherStatus> {
  if (!isNativeAndroid()) {
    return {
      isDefaultLauncher: true,
      currentDefaultPackage: 'com.kasbllc.minimumphone',
      isKioskPinned: enabled,
      batteryLevel: 88,
      isCharging: false,
      platform: 'web',
    };
  }
  return await MinimumPhoneNative.setKioskPinLock({ enabled });
}

export async function loadRealInstalledApps(
  existingApps: AppItem[]
): Promise<AppItem[]> {
  if (!isNativeAndroid()) return existingApps;
  try {
    const res = await MinimumPhoneNative.getInstalledApps();
    if (!res || !Array.isArray(res.apps) || res.apps.length === 0) {
      return existingApps;
    }

    const byNameMap = new Map<string, AppItem>();
    for (const item of existingApps) {
      byNameMap.set(item.name.toLowerCase(), item);
    }

    const merged: AppItem[] = [...existingApps];
    const existingIds = new Set(existingApps.map((a) => a.id));

    for (const nativeApp of res.apps) {
      const lowerLabel = nativeApp.name.toLowerCase();
      // Link packageName to matching default app if already present
      const matched = existingApps.find(
        (ea) =>
          ea.name.toLowerCase() === lowerLabel ||
          nativeApp.packageName.toLowerCase().includes(ea.id.toLowerCase())
      );
      if (matched && !matched.packageName) {
        matched.packageName = nativeApp.packageName;
        continue;
      }

      if (!existingIds.has(nativeApp.id) && !byNameMap.has(lowerLabel)) {
        merged.push({
          id: nativeApp.id,
          name: nativeApp.name,
          packageName: nativeApp.packageName,
          isSystemApp: nativeApp.isSystemApp,
          category: nativeApp.category,
          tier: nativeApp.tier,
          dailyOpens: 0,
          dailyMinutesUsed: 0,
          pinnedProfiles: [],
        });
      }
    }
    return merged;
  } catch {
    return existingApps;
  }
}

export async function launchNativeAndroidApp(
  app: AppItem,
  durationMinutes = 0
): Promise<boolean> {
  if (!isNativeAndroid()) return false;
  try {
    const res = await MinimumPhoneNative.launchApp({
      packageName: app.packageName || '',
      appId: app.id,
      durationMinutes,
    });
    return !!res.launched;
  } catch {
    return false;
  }
}

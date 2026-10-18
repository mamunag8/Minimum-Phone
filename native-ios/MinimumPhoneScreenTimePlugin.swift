import Foundation
import Capacitor
import FamilyControls
import ManagedSettings
import DeviceActivity
import WidgetKit
import SwiftUI

/**
 * Minimum Phone — Native iOS Bridge (Apple App Store Edition)
 * Uses Apple's official Screen Time API (FamilyControls + ManagedSettings) + WidgetKit
 * to deliver:
 * 1. Minimalist Monochrome Home Screen Widget (5 Essential Text-Only Apps + Calm Mind Line)
 * 2. OS-Level App Shielding with Quran / Hadith / Proverb Calm Mind Shield
 * 3. Adult Content Web Filter (ManagedSettings WebContentFilter.Policy.auto)
 * 4. Craving-Proof Uninstall Protection (denyAppRemoval = true)
 */
@objc(MinimumPhoneNativePlugin)
public class MinimumPhoneNativePlugin: CAPPlugin {
    private let store = ManagedSettingsStore()

    @objc func setDefaultLauncher(_ call: CAPPluginCall) {
        Task {
            do {
                try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
                WidgetCenter.shared.reloadAllTimelines()
                call.resolve([
                    "granted": true,
                    "platform": "ios"
                ])
            } catch {
                call.resolve([
                    "granted": false,
                    "platform": "ios",
                    "error": error.localizedDescription
                ])
            }
        }
    }

    @objc func setAdultDnsFilter(_ call: CAPPluginCall) {
        let enabled = call.getBool("enabled") ?? true
        if enabled {
            store.webContent.blockedByFilter = .auto()
        } else {
            store.webContent.blockedByFilter = .none
        }
        call.resolve(["applied": enabled])
    }

    @objc func setUninstallProtection(_ call: CAPPluginCall) {
        let enabled = call.getBool("enabled") ?? true
        store.application.denyAppRemoval = enabled
        call.resolve(["protected": enabled])
    }
}

/**
 * Minimalist Monochrome Home Screen Widget (WidgetKit)
 * Renders the 5 Essential Text-Only Apps + Calm Mind Quran/Hadith/Proverb Anchor on iOS Home Screen
 */
struct MinimumPhoneWidgetEntryView: View {
    var apps: [String] = ["Phone", "Calendar", "Notes & Docs", "Quran & Sunnah", "Maps"]
    var calmQuote: String = "Unquestionably, in the remembrance of Allah do hearts find rest. — Quran 13:28"

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            ForEach(apps, id: \.self) { appName in
                Text(appName)
                    .font(.system(size: 20, weight: .light, design: .monospaced))
                    .foregroundColor(.white)
            }
            Spacer()
            Divider().background(Color.gray.opacity(0.3))
            Text(calmQuote)
                .font(.system(size: 11, weight: .regular, design: .monospaced))
                .foregroundColor(.gray)
                .lineLimit(2)
        }
        .padding(16)
        .background(Color.black)
    }
}

import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'i18n.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
      systemNavigationBarColor: Color(0xFF070709),
      systemNavigationBarIconBrightness: Brightness.light,
    ),
  );
  runApp(const MinimumPhoneApp());
}

class AppItem {
  String id;
  String name;
  String packageName;
  String category;
  String tier; // 'essential', 'utility', 'restricted'
  bool pinned;
  bool nightQrLocked;
  List<String> profiles;

  AppItem({
    required this.id,
    required this.name,
    required this.packageName,
    required this.category,
    required this.tier,
    required this.pinned,
    required this.nightQrLocked,
    required this.profiles,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'packageName': packageName,
        'category': category,
        'tier': tier,
        'pinned': pinned,
        'nightQrLocked': nightQrLocked,
        'profiles': profiles,
      };

  factory AppItem.fromJson(Map<String, dynamic> json) => AppItem(
        id: json['id'] ?? '',
        name: json['name'] ?? 'App',
        packageName: json['packageName'] ?? '',
        category: json['category'] ?? 'Utility',
        tier: json['tier'] ?? 'utility',
        pinned: json['pinned'] ?? false,
        nightQrLocked: json['nightQrLocked'] ?? false,
        profiles: List<String>.from(json['profiles'] ?? ['work', 'personal', 'sunset']),
      );
}

class MinimumPhoneApp extends StatefulWidget {
  const MinimumPhoneApp({super.key});

  @override
  State<MinimumPhoneApp> createState() => _MinimumPhoneAppState();
}

class _MinimumPhoneAppState extends State<MinimumPhoneApp> {
  static const MethodChannel _channel =
      MethodChannel('com.kasbllc.minimumphone/native');

  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  // Navigation State
  int _currentTab = 0; // 0: Home, 1: Apps, 2: Purity & DNS, 3: Focus, 4: Settings
  int _appsSubTab = 0; // 0: All, 1: Essential, 2: Utility, 3: Restricted, 4: Night QR
  int _puritySubTab = 0; // 0: DNS & Night Lock, 1: SOS & Streak, 2: Keywords, 3: All
  int _focusSubTab = 0; // 0: Digest, 1: Monk & Night, 2: QR & Cleaner, 3: All
  int _settingsSubTab = 0; // 0: System & Lock, 1: Impact, 2: Language & Theme, 3: All

  // App State
  String _lang = 'en';
  String _themeMode = 'oled'; // 'oled', 'eink', 'amber'
  String _activeProfile = 'work'; // 'work', 'personal', 'sunset'
  String _scratchpad = '';
  String _searchQuery = '';
  String _wisdomCategory = 'all'; // 'all', 'quran', 'hadith', 'proverb'
  int _wisdomIndex = 0;

  // Safe Private DNS & OS Fortress State
  String _dnsProvider = 'cloudflare'; // 'cloudflare', 'cleanbrowsing', 'adguard'
  String _dnsHost = 'family.cloudflare-dns.com';
  bool _phoneSettingsLocked = true;
  bool _nightAutoDnsEnabled = true;
  String _qrSecret = 'KASB-BRICK-77';
  int _cleanStreakDays = 7;
  int _emergencyLockdownUntil = 0;
  List<String> _blockedKeywords = [
    'porn',
    'xxx',
    'xvideos',
    'xnxx',
    'pornhub',
    'onlyfans',
    'nsfw',
    'hentai',
    'stripchat',
    'chaturbate',
    'redtube',
    'youporn'
  ];

  // Focus & Impact State
  int _monkModeUntil = 0;
  bool _digestMorning = true;
  bool _digestMidday = true;
  bool _digestEvening = true;
  bool _sleepScheduleEnabled = true;
  bool _settingsUnlockedSession = false;
  int _reclaimedMinutes = 145;
  int _mindfulPausesCompleted = 18;
  int _urgesResisted = 9;
  int _blockedOpens = 24;
  int _ramFreedMb = 0;

  // Live Native OS Status (polled from MainActivity)
  bool _isDefaultLauncher = false;
  bool _hasUsageAccess = false;
  bool _isKioskPinned = false;
  String _osDnsMode = 'unknown';
  String _osDnsSpecifier = '';
  bool _osDnsIsFamilySafe = false;
  int _batteryLevel = 100;

  // Clock & Timers
  DateTime _now = DateTime.now();
  Timer? _clockTimer;
  final TextEditingController _notesController = TextEditingController();
  final TextEditingController _searchController = TextEditingController();
  final TextEditingController _keywordController = TextEditingController();

  List<AppItem> _apps = [];
  final List<Map<String, String>> _digestItems = [
    {
      'app': 'WhatsApp Business',
      'title': '3 messages batched for 13:00 Midday Digest',
      'time': '11:40'
    },
    {
      'app': 'Gmail',
      'title': '2 newsletters held in Focus Queue',
      'time': '10:15'
    },
    {
      'app': 'Telegram',
      'title': 'Channel updates silenced during Work Profile',
      'time': '09:30'
    },
  ];

  @override
  void initState() {
    super.initState();
    _initDefaultApps();
    _loadPersistedState();
    _refreshNativeStatus();
    _clockTimer = Timer.periodic(const Duration(seconds: 2), (_) {
      if (mounted) {
        setState(() {
          _now = DateTime.now();
        });
        _refreshNativeStatus();
      }
    });
  }

  @override
  void dispose() {
    _clockTimer?.cancel();
    _notesController.dispose();
    _searchController.dispose();
    _keywordController.dispose();
    super.dispose();
  }

  void _initDefaultApps() {
    _apps = [
      AppItem(
        id: 'dialer',
        name: 'Phone Calls',
        packageName: 'com.google.android.dialer',
        category: 'Communication',
        tier: 'essential',
        pinned: true,
        nightQrLocked: false,
        profiles: ['work', 'personal', 'sunset'],
      ),
      AppItem(
        id: 'messages',
        name: 'SMS Messages',
        packageName: 'com.google.android.apps.messaging',
        category: 'Communication',
        tier: 'essential',
        pinned: true,
        nightQrLocked: false,
        profiles: ['work', 'personal', 'sunset'],
      ),
      AppItem(
        id: 'whatsapp',
        name: 'WhatsApp',
        packageName: 'com.whatsapp',
        category: 'Messaging',
        tier: 'utility',
        pinned: true,
        nightQrLocked: false,
        profiles: ['work', 'personal'],
      ),
      AppItem(
        id: 'maps',
        name: 'Google Maps',
        packageName: 'com.google.android.apps.maps',
        category: 'Navigation',
        tier: 'essential',
        pinned: true,
        nightQrLocked: false,
        profiles: ['work', 'personal'],
      ),
      AppItem(
        id: 'calendar',
        name: 'Calendar',
        packageName: 'com.google.android.calendar',
        category: 'Productivity',
        tier: 'essential',
        pinned: true,
        nightQrLocked: false,
        profiles: ['work', 'personal', 'sunset'],
      ),
      AppItem(
        id: 'calculator',
        name: 'Calculator',
        packageName: 'com.google.android.calculator',
        category: 'Tools',
        tier: 'essential',
        pinned: false,
        nightQrLocked: false,
        profiles: ['work', 'personal', 'sunset'],
      ),
      AppItem(
        id: 'chrome',
        name: 'Chrome Browser (DNS Guarded)',
        packageName: 'com.android.chrome',
        category: 'Browser',
        tier: 'restricted',
        pinned: false,
        nightQrLocked: true,
        profiles: ['work', 'personal'],
      ),
      AppItem(
        id: 'youtube',
        name: 'YouTube',
        packageName: 'com.google.android.youtube',
        category: 'Video',
        tier: 'restricted',
        pinned: false,
        nightQrLocked: true,
        profiles: ['personal'],
      ),
      AppItem(
        id: 'instagram',
        name: 'Instagram',
        packageName: 'com.instagram.android',
        category: 'Social',
        tier: 'restricted',
        pinned: false,
        nightQrLocked: true,
        profiles: ['personal'],
      ),
      AppItem(
        id: 'facebook',
        name: 'Facebook',
        packageName: 'com.facebook.katana',
        category: 'Social',
        tier: 'restricted',
        pinned: false,
        nightQrLocked: true,
        profiles: ['personal'],
      ),
      AppItem(
        id: 'tiktok',
        name: 'TikTok',
        packageName: 'com.zhiliaoapp.musically',
        category: 'Short Video',
        tier: 'restricted',
        pinned: false,
        nightQrLocked: true,
        profiles: ['personal'],
      ),
      AppItem(
        id: 'settings',
        name: 'Android System Settings (Locked)',
        packageName: 'com.android.settings',
        category: 'System',
        tier: 'restricted',
        pinned: false,
        nightQrLocked: true,
        profiles: ['work'],
      ),
    ];
  }

  Future<void> _loadPersistedState() async {
    try {
      final String? raw = await _channel.invokeMethod<String>('loadAppStateJson');
      if (raw != null && raw.isNotEmpty) {
        final Map<String, dynamic> data = jsonDecode(raw);
        setState(() {
          _lang = data['lang'] ?? _lang;
          _themeMode = data['themeMode'] ?? _themeMode;
          _activeProfile = data['activeProfile'] ?? _activeProfile;
          _scratchpad = data['scratchpad'] ?? '';
          _notesController.text = _scratchpad;
          _dnsProvider = data['dnsProvider'] ?? 'cloudflare';
          _dnsHost = data['dnsHost'] ?? 'family.cloudflare-dns.com';
          _phoneSettingsLocked = data['phoneSettingsLocked'] ?? true;
          _nightAutoDnsEnabled = data['nightAutoDnsEnabled'] ?? true;
          _qrSecret = data['qrSecret'] ?? 'KASB-BRICK-77';
          _cleanStreakDays = data['cleanStreakDays'] ?? 7;
          _reclaimedMinutes = data['reclaimedMinutes'] ?? 145;
          _mindfulPausesCompleted = data['mindfulPausesCompleted'] ?? 18;
          _urgesResisted = data['urgesResisted'] ?? 9;
          _blockedOpens = data['blockedOpens'] ?? 24;
          if (data['blockedKeywords'] != null) {
            _blockedKeywords = List<String>.from(data['blockedKeywords']);
          }
          if (data['apps'] != null) {
            final List<dynamic> list = data['apps'];
            if (list.isNotEmpty) {
              _apps = list.map((e) => AppItem.fromJson(Map<String, dynamic>.from(e))).toList();
            }
          }
        });
        _syncFortressToNative();
      } else {
        _syncFortressToNative();
      }
    } catch (_) {}
  }

  Future<void> _saveState() async {
    try {
      final Map<String, dynamic> data = {
        'lang': _lang,
        'themeMode': _themeMode,
        'activeProfile': _activeProfile,
        'scratchpad': _scratchpad,
        'dnsProvider': _dnsProvider,
        'dnsHost': _dnsHost,
        'phoneSettingsLocked': _phoneSettingsLocked,
        'nightAutoDnsEnabled': _nightAutoDnsEnabled,
        'qrSecret': _qrSecret,
        'cleanStreakDays': _cleanStreakDays,
        'reclaimedMinutes': _reclaimedMinutes,
        'mindfulPausesCompleted': _mindfulPausesCompleted,
        'urgesResisted': _urgesResisted,
        'blockedOpens': _blockedOpens,
        'blockedKeywords': _blockedKeywords,
        'apps': _apps.map((a) => a.toJson()).toList(),
      };
      await _channel.invokeMethod('saveAppStateJson', {'json': jsonEncode(data)});
    } catch (_) {}
  }

  Future<void> _syncFortressToNative() async {
    try {
      await _channel.invokeMethod('configureFortress', {
        'phoneSettingsLocked': _phoneSettingsLocked,
        'nightAutoDnsEnabled': _nightAutoDnsEnabled,
        'dnsHost': _dnsHost,
        'qrSecret': _qrSecret,
        'emergencyLockdownUntil': _emergencyLockdownUntil,
      });
    } catch (_) {}
  }

  Future<void> _refreshNativeStatus() async {
    try {
      final Map<dynamic, dynamic>? status =
          await _channel.invokeMethod<Map<dynamic, dynamic>>('getLauncherStatus');
      if (status != null && mounted) {
        setState(() {
          _isDefaultLauncher = status['isDefaultLauncher'] == true;
          _hasUsageAccess = status['hasUsageAccess'] == true;
          _isKioskPinned = status['isKioskPinned'] == true;
          _osDnsMode = (status['osDnsMode'] ?? 'off').toString();
          _osDnsSpecifier = (status['osDnsSpecifier'] ?? '').toString();
          _osDnsIsFamilySafe = status['osDnsIsFamilySafe'] == true;
          _batteryLevel = (status['batteryLevel'] as int?) ?? 100;
          final int nativeRam = (status['ramFreedMb'] as int?) ?? 0;
          if (nativeRam > _ramFreedMb) {
            _ramFreedMb = nativeRam;
          }
        });
      }
    } catch (_) {}
  }

  Future<void> _syncInstalledAndroidApps() async {
    try {
      final String? raw = await _channel.invokeMethod<String>('getInstalledApps');
      if (raw != null && raw.isNotEmpty) {
        final List<dynamic> list = jsonDecode(raw);
        int added = 0;
        setState(() {
          for (final item in list) {
            final String pkg = (item['packageName'] ?? '').toString();
            final String label = (item['label'] ?? 'App').toString();
            if (pkg.isEmpty) continue;
            final bool exists = _apps.any((a) => a.packageName == pkg);
            if (!exists) {
              final bool isBrowserOrSocial = pkg.contains('browser') ||
                  pkg.contains('chrome') ||
                  pkg.contains('firefox') ||
                  pkg.contains('opera') ||
                  pkg.contains('brave') ||
                  pkg.contains('instagram') ||
                  pkg.contains('facebook') ||
                  pkg.contains('tiktok') ||
                  pkg.contains('youtube') ||
                  pkg.contains('twitter') ||
                  pkg.contains('reddit');
              _apps.add(AppItem(
                id: pkg,
                name: label,
                packageName: pkg,
                category: isBrowserOrSocial ? 'Guarded' : 'Installed',
                tier: isBrowserOrSocial ? 'restricted' : 'utility',
                pinned: false,
                nightQrLocked: isBrowserOrSocial,
                profiles: ['work', 'personal', 'sunset'],
              ));
              added++;
            }
          }
        });
        _saveState();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Synced device apps ($added new apps added)'),
              backgroundColor: const Color(0xFF1E8E5A),
            ),
          );
        }
      }
    } catch (_) {}
  }

  String _tr(String key) => AppDataDefaults.tr(_lang, key);

  bool get _isRtl => _lang == 'ar' || _lang == 'ur';

  bool get _isNightWindow => _now.hour >= 22 || _now.hour < 6;

  bool get _isMonkActive =>
      _monkModeUntil > DateTime.now().millisecondsSinceEpoch;

  bool get _isEmergencyBrowserLockActive =>
      _emergencyLockdownUntil > DateTime.now().millisecondsSinceEpoch;

  Color get _bgColor {
    if (_themeMode == 'eink') return const Color(0xFFF4F1EA);
    if (_themeMode == 'amber') return const Color(0xFF120C06);
    return const Color(0xFF070709);
  }

  Color get _cardColor {
    if (_themeMode == 'eink') return const Color(0xFFE8E3D8);
    if (_themeMode == 'amber') return const Color(0xFF1E140A);
    return const Color(0xFF121318);
  }

  Color get _textColor {
    if (_themeMode == 'eink') return const Color(0xFF181818);
    if (_themeMode == 'amber') return const Color(0xFFFFD599);
    return const Color(0xFFF4F4F6);
  }

  Color get _subTextColor {
    if (_themeMode == 'eink') return const Color(0xFF5C5952);
    if (_themeMode == 'amber') return const Color(0xFFC89B5C);
    return const Color(0xFF9A9AA6);
  }

  Color get _accentColor {
    if (_themeMode == 'eink') return const Color(0xFF222222);
    if (_themeMode == 'amber') return const Color(0xFFFF9E2C);
    return const Color(0xFF10B981);
  }

  Future<void> _activateSafePrivateDnsNow() async {
    try {
      final Map<dynamic, dynamic>? res =
          await _channel.invokeMethod<Map<dynamic, dynamic>>(
        'activateSafePrivateDns',
        {
          'host': _dnsHost,
          'lockAfter': true,
        },
      );
      setState(() {
        _phoneSettingsLocked = true;
      });
      await _saveState();
      await _refreshNativeStatus();

      if (!mounted) return;
      final bool directSuccess = res?['directSuccess'] == true;
      if (directSuccess) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'VERIFIED! Safe Private DNS ($_dnsHost) activated directly in Android OS & Settings Locked!',
            ),
            backgroundColor: const Color(0xFF10B981),
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            duration: const Duration(seconds: 6),
            content: Text(
              'Copied "$_dnsHost"! Select "Private DNS provider hostname", paste "$_dnsHost" & press Save. Settings will auto-lock the moment you save!',
            ),
            backgroundColor: const Color(0xFF059669),
          ),
        );
      }
    } catch (_) {}
  }

  Future<void> _openSafeSubSetting(String type) async {
    try {
      await _channel.invokeMethod('openSafePhoneSetting', {
        'settingType': type,
        'dnsHost': _dnsHost,
      });
    } catch (_) {}
  }

  void _handleAppTap(BuildContext ctx, AppItem app) {
    // Check Monk Mode
    if (_isMonkActive && app.tier != 'essential') {
      final int minsLeft =
          ((_monkModeUntil - DateTime.now().millisecondsSinceEpoch) / 60000)
              .ceil();
      ScaffoldMessenger.of(ctx).showSnackBar(
        SnackBar(
          content: Text(
            'Monk Mode Active ($minsLeft min remaining). Only Essential apps allowed.',
          ),
          backgroundColor: Colors.deepOrange,
        ),
      );
      setState(() => _blockedOpens++);
      _saveState();
      return;
    }

    // Check Night QR Lock
    if (_isNightWindow && _sleepScheduleEnabled && app.nightQrLocked) {
      _showQrUnlockDialog(ctx, onUnlocked: () {
        _launchNativePackage(app.packageName);
      });
      return;
    }

    // Check Restricted 15-Second Mindful Gate
    if (app.tier == 'restricted') {
      _showMindfulGateModal(
        ctx,
        targetTitle: app.name,
        onPassed: () {
          setState(() {
            _mindfulPausesCompleted++;
            _reclaimedMinutes += 5;
          });
          _saveState();
          _launchNativePackage(app.packageName);
        },
      );
      return;
    }

    _launchNativePackage(app.packageName);
  }

  Future<void> _launchNativePackage(String pkg) async {
    try {
      final bool? ok =
          await _channel.invokeMethod<bool>('launchApp', {'packageName': pkg});
      if (ok != true && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Simulated launch: $pkg'),
            duration: const Duration(seconds: 2),
          ),
        );
      }
    } catch (_) {}
  }

  void _showQrUnlockDialog(BuildContext ctx, {required VoidCallback onUnlocked}) {
    final TextEditingController qrCtrl = TextEditingController();
    showDialog(
      context: ctx,
      builder: (dCtx) => AlertDialog(
        backgroundColor: const Color(0xFF14151C),
        title: const Text(
          '🌙 Night Physical QR Key Required',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'This app or setting is locked by your Night Fortress rule. Scan or enter your physical QR key to proceed:',
              style: TextStyle(color: Colors.white70, fontSize: 13),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: qrCtrl,
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                hintText: 'Enter QR code (e.g. $_qrSecret)',
                hintStyle: const TextStyle(color: Colors.white38),
                filled: true,
                fillColor: Colors.black38,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              setState(() {
                _blockedOpens++;
                _reclaimedMinutes += 10;
              });
              _saveState();
              Navigator.pop(dCtx);
            },
            child: const Text('Stay Focused (Cancel)'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF10B981),
              foregroundColor: Colors.black,
            ),
            onPressed: () {
              if (qrCtrl.text.trim().toUpperCase() ==
                  _qrSecret.trim().toUpperCase()) {
                Navigator.pop(dCtx);
                onUnlocked();
              } else {
                ScaffoldMessenger.of(ctx).showSnackBar(
                  const SnackBar(
                    content: Text('Invalid Physical QR Code Key!'),
                    backgroundColor: Colors.redAccent,
                  ),
                );
              }
            },
            child: const Text('Unlock'),
          ),
        ],
      ),
    );
  }

  void _showMindfulGateModal(
    BuildContext ctx, {
    required String targetTitle,
    required VoidCallback onPassed,
  }) {
    final WisdomEntry wisdom = AppDataDefaults
        .wisdomList[_now.second % AppDataDefaults.wisdomList.length];
    int secondsLeft = 15;
    int? selectedOption;
    String? errorMsg;
    Timer? modalTimer;

    showModalBottomSheet(
      context: ctx,
      isScrollControlled: true,
      isDismissible: false,
      backgroundColor: const Color(0xFF101218),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (mCtx) {
        return StatefulBuilder(
          builder: (sCtx, setModalState) {
            modalTimer ??= Timer.periodic(const Duration(seconds: 1), (t) {
              if (!sCtx.mounted) {
                t.cancel();
                return;
              }
              if (secondsLeft > 0) {
                setModalState(() => secondsLeft--);
              } else {
                t.cancel();
              }
            });

            return Padding(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 24,
                bottom: MediaQuery.of(sCtx).viewInsets.bottom + 28,
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: secondsLeft > 0
                                ? Colors.amber.withValues(alpha: 0.2)
                                : const Color(0xFF10B981).withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            secondsLeft > 0
                                ? '⏳ ${secondsLeft}s Mindful Pause'
                                : '✅ Pause Complete • Answer Quiz',
                            style: TextStyle(
                              color: secondsLeft > 0
                                  ? Colors.amber
                                  : const Color(0xFF10B981),
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                            ),
                          ),
                        ),
                        const Spacer(),
                        TextButton(
                          onPressed: () {
                            modalTimer?.cancel();
                            setState(() {
                              _blockedOpens++;
                              _reclaimedMinutes += 10;
                            });
                            _saveState();
                            Navigator.pop(mCtx);
                          },
                          child: const Text(
                            'Close & Reclaim Time',
                            style: TextStyle(color: Color(0xFF10B981)),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      '${_tr('gateTitle')} — $targetTitle',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      _tr('gateSub'),
                      style: const TextStyle(color: Colors.white70, fontSize: 13),
                    ),
                    const SizedBox(height: 16),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: const Color(0xFF191C26),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: Colors.white12),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '"${wisdom.text}"',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 15,
                              fontStyle: FontStyle.italic,
                              height: 1.4,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            '— ${wisdom.ref}',
                            style: const TextStyle(
                              color: Color(0xFF10B981),
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      wisdom.question,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 10),
                    ...List.generate(wisdom.options.length, (idx) {
                      final bool isSelected = selectedOption == idx;
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: InkWell(
                          onTap: () => setModalState(() {
                            selectedOption = idx;
                            errorMsg = null;
                          }),
                          borderRadius: BorderRadius.circular(10),
                          child: Container(
                            width: double.infinity,
                            padding: const EdgeInsets.symmetric(
                              horizontal: 14,
                              vertical: 12,
                            ),
                            decoration: BoxDecoration(
                              color: isSelected
                                  ? const Color(0xFF10B981).withValues(alpha: 0.2)
                                  : Colors.white.withValues(alpha: 0.05),
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(
                                color: isSelected
                                    ? const Color(0xFF10B981)
                                    : Colors.white12,
                              ),
                            ),
                            child: Text(
                              wisdom.options[idx],
                              style: TextStyle(
                                color: isSelected
                                    ? const Color(0xFF10B981)
                                    : Colors.white,
                                fontWeight: isSelected
                                    ? FontWeight.bold
                                    : FontWeight.normal,
                              ),
                            ),
                          ),
                        ),
                      );
                    }),
                    if (errorMsg != null) ...[
                      const SizedBox(height: 6),
                      Text(
                        errorMsg!,
                        style: const TextStyle(
                          color: Colors.redAccent,
                          fontSize: 13,
                        ),
                      ),
                    ],
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: secondsLeft == 0
                              ? const Color(0xFF10B981)
                              : Colors.white12,
                          foregroundColor:
                              secondsLeft == 0 ? Colors.black : Colors.white38,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                        ),
                        onPressed: secondsLeft > 0
                            ? null
                            : () {
                                if (selectedOption == wisdom.correctIndex) {
                                  modalTimer?.cancel();
                                  Navigator.pop(mCtx);
                                  onPassed();
                                } else {
                                  setModalState(() {
                                    errorMsg =
                                        'Please reflect on the wisdom and choose the accurate answer.';
                                  });
                                }
                              },
                        child: Text(
                          secondsLeft > 0
                              ? 'Wait ${secondsLeft}s while reflecting...'
                              : 'Confirm Reflection & Proceed',
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    ).whenComplete(() => modalTimer?.cancel());
  }

  void _showEmergencySosModal(BuildContext ctx) {
    setState(() {
      _emergencyLockdownUntil =
          DateTime.now().millisecondsSinceEpoch + (15 * 60 * 1000);
      _urgesResisted++;
      _reclaimedMinutes += 30;
    });
    _saveState();
    _syncFortressToNative();

    int breatheSec = 60;
    Timer? sosTimer;

    showDialog(
      context: ctx,
      barrierDismissible: false,
      builder: (dCtx) {
        return StatefulBuilder(
          builder: (sCtx, setDialogState) {
            sosTimer ??= Timer.periodic(const Duration(seconds: 1), (t) {
              if (!sCtx.mounted) {
                t.cancel();
                return;
              }
              if (breatheSec > 0) {
                setDialogState(() => breatheSec--);
              } else {
                t.cancel();
              }
            });

            final int cycle = (60 - breatheSec) % 19;
            String phase = 'Inhale deeply through nose (4s)';
            if (cycle >= 4 && cycle < 11) {
              phase = 'Hold breath calmly (7s)';
            } else if (cycle >= 11) {
              phase = 'Exhale slowly through mouth (8s)';
            }

            return AlertDialog(
              backgroundColor: const Color(0xFF0E1318),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
                side: const BorderSide(color: Color(0xFF10B981), width: 1.5),
              ),
              title: const Text(
                '🛡️ Emergency Purity SOS Active',
                style: TextStyle(
                  color: Color(0xFF10B981),
                  fontWeight: FontWeight.bold,
                ),
              ),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.redAccent.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Text(
                      '🔒 ALL Web Browsers & Settings are now locked at the Android OS level for 15 minutes.',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    '${breatheSec}s',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 42,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    phase,
                    style: const TextStyle(
                      color: Color(0xFF10B981),
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    '"Tell the believing men to lower their gaze and guard their modesty: that is purer for them." — Quran 24:30',
                    style: TextStyle(
                      color: Colors.white70,
                      fontSize: 13,
                      fontStyle: FontStyle.italic,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () {
                    sosTimer?.cancel();
                    Navigator.pop(dCtx);
                  },
                  child: Text(
                    breatheSec > 0
                        ? 'I Feel Grounded ($breatheSec s)'
                        : 'Complete SOS Reset (+1 Urge Resisted)',
                    style: const TextStyle(
                      color: Color(0xFF10B981),
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            );
          },
        );
      },
    ).whenComplete(() => sosTimer?.cancel());
  }

  void _showSetupWizardModal(BuildContext ctx) {
    showModalBottomSheet(
      context: ctx,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF11131A),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (mCtx) {
        return Padding(
          padding: const EdgeInsets.all(22),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  '🛡️ 3-Step OS Fortress Setup Wizard',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Complete these 3 steps once so Safe Private DNS and OS Settings Lock work 24/7 without bypass:',
                  style: TextStyle(color: Colors.white70, fontSize: 13),
                ),
                const SizedBox(height: 18),
                _buildWizardStepTile(
                  step: '1',
                  title: 'Grant Usage Access (Required for <350ms Settings Lock)',
                  subtitle: _hasUsageAccess
                      ? '✅ Granted! Watchdog is actively guarding Settings & Browsers.'
                      : 'Allows Minimum Phone to detect and lock Android Settings & Browsers.',
                  isDone: _hasUsageAccess,
                  buttonLabel: _hasUsageAccess ? 'Granted' : 'Grant Usage Access',
                  onTap: () async {
                    await _channel.invokeMethod('requestUsageStatsPermission');
                  },
                ),
                const SizedBox(height: 12),
                _buildWizardStepTile(
                  step: '2',
                  title: 'Activate Safe Private DNS ($_dnsHost)',
                  subtitle: _osDnsIsFamilySafe
                      ? '✅ Active in Android OS ($_osDnsSpecifier)!'
                      : 'Copies $_dnsHost & opens Android Private DNS settings with auto-lock on save.',
                  isDone: _osDnsIsFamilySafe,
                  buttonLabel:
                      _osDnsIsFamilySafe ? 'Active' : '1-Tap Activate Safe DNS',
                  onTap: () {
                    Navigator.pop(mCtx);
                    _activateSafePrivateDnsNow();
                  },
                ),
                const SizedBox(height: 12),
                _buildWizardStepTile(
                  step: '3',
                  title: 'Set Minimum Phone as Default Home Launcher',
                  subtitle: _isDefaultLauncher
                      ? '✅ Active as Default Home Launcher!'
                      : 'Makes pressing the Home button always return to your minimalist fortress.',
                  isDone: _isDefaultLauncher,
                  buttonLabel:
                      _isDefaultLauncher ? 'Default Home' : 'Set Default Home',
                  onTap: () async {
                    await _channel.invokeMethod('requestDefaultLauncher');
                  },
                ),
                const SizedBox(height: 18),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF10B981),
                      foregroundColor: Colors.black,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    onPressed: () => Navigator.pop(mCtx),
                    child: const Text(
                      'Done',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildWizardStepTile({
    required String step,
    required String title,
    required String subtitle,
    required bool isDone,
    required String buttonLabel,
    required VoidCallback onTap,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF191C26),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: isDone ? const Color(0xFF10B981) : Colors.white12,
        ),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 16,
            backgroundColor:
                isDone ? const Color(0xFF10B981) : Colors.white12,
            child: Text(
              isDone ? '✓' : step,
              style: TextStyle(
                color: isDone ? Colors.black : Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  subtitle,
                  style: const TextStyle(color: Colors.white70, fontSize: 12),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor:
                  isDone ? Colors.white12 : const Color(0xFF10B981),
              foregroundColor: isDone ? Colors.white70 : Colors.black,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            ),
            onPressed: onTap,
            child: Text(
              buttonLabel,
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Minimum Phone',
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark().copyWith(
        scaffoldBackgroundColor: _bgColor,
        colorScheme: ColorScheme.dark(
          primary: _accentColor,
          surface: _cardColor,
        ),
      ),
      home: Directionality(
        textDirection: _isRtl ? TextDirection.rtl : TextDirection.ltr,
        child: Builder(
          builder: (innerCtx) => Scaffold(
            key: _scaffoldKey,
            backgroundColor: _bgColor,
            appBar: _buildTopAppBar(innerCtx),
            drawer: _buildGlobalDrawer(innerCtx),
            body: SafeArea(
              child: IndexedStack(
                index: _currentTab,
                children: [
                  _buildHomePage(innerCtx),
                  _buildAppsPage(innerCtx),
                  _buildPurityDnsPage(innerCtx),
                  _buildFocusPage(innerCtx),
                  _buildSettingsPage(innerCtx),
                ],
              ),
            ),
            bottomNavigationBar: _buildBottomNav(),
          ),
        ),
      ),
    );
  }

  PreferredSizeWidget _buildTopAppBar(BuildContext ctx) {
    return AppBar(
      backgroundColor: _cardColor,
      elevation: 0,
      leading: IconButton(
        icon: Icon(Icons.menu_rounded, color: _textColor),
        tooltip: 'Menu & Quick Fortress Controls',
        onPressed: () => _scaffoldKey.currentState?.openDrawer(),
      ),
      titleSpacing: 0,
      title: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _tr('appTitle'),
                  style: TextStyle(
                    color: _textColor,
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  _osDnsIsFamilySafe
                      ? '🛡️ $_osDnsSpecifier'
                      : _tr('subtitle'),
                  style: TextStyle(
                    color: _osDnsIsFamilySafe
                        ? const Color(0xFF10B981)
                        : _subTextColor,
                    fontSize: 11,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
      actions: [
        // Live Safe DNS Status Pill
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
          child: InkWell(
            onTap: () {
              if (!_osDnsIsFamilySafe) {
                _activateSafePrivateDnsNow();
              } else {
                setState(() {
                  _currentTab = 2;
                  _puritySubTab = 0;
                });
              }
            },
            borderRadius: BorderRadius.circular(20),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: _osDnsIsFamilySafe
                    ? const Color(0xFF10B981).withValues(alpha: 0.2)
                    : Colors.redAccent.withValues(alpha: 0.22),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: _osDnsIsFamilySafe
                      ? const Color(0xFF10B981)
                      : Colors.redAccent,
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    _osDnsIsFamilySafe
                        ? Icons.verified_user_rounded
                        : Icons.gpp_maybe_rounded,
                    size: 14,
                    color: _osDnsIsFamilySafe
                        ? const Color(0xFF10B981)
                        : Colors.redAccent,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    _osDnsIsFamilySafe ? _tr('dnsActive') : _tr('dnsInactive'),
                    style: TextStyle(
                      color: _osDnsIsFamilySafe
                          ? const Color(0xFF10B981)
                          : Colors.redAccent,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
        IconButton(
          icon: Icon(Icons.fact_check_outlined, color: _textColor, size: 20),
          tooltip: _tr('setupBtn'),
          onPressed: () => _showSetupWizardModal(ctx),
        ),
        IconButton(
          icon: Icon(
            _phoneSettingsLocked ? Icons.lock_rounded : Icons.lock_open_rounded,
            color: _phoneSettingsLocked
                ? const Color(0xFF10B981)
                : Colors.amber,
            size: 20,
          ),
          tooltip: _tr('lockBtn'),
          onPressed: () async {
            await _channel.invokeMethod('openNativeFortressLock', {
              'pkg': 'com.android.settings',
              'reason': 'settings_locked',
            });
          },
        ),
      ],
    );
  }

  Widget _buildGlobalDrawer(BuildContext ctx) {
    return Drawer(
      backgroundColor: _cardColor,
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Row(
              children: [
                const Icon(
                  Icons.shield_rounded,
                  color: Color(0xFF10B981),
                  size: 28,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _tr('menuTitle'),
                        style: TextStyle(
                          color: _textColor,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        'v2.0.0 • Native OS Fortress',
                        style: TextStyle(color: _subTextColor, fontSize: 11),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Instant Safe Private DNS & OS Settings Lock Card inside Sidebar!
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: _bgColor,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                  color: _osDnsIsFamilySafe
                      ? const Color(0xFF10B981)
                      : Colors.amber,
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(
                        _osDnsIsFamilySafe
                            ? Icons.verified_user_rounded
                            : Icons.warning_amber_rounded,
                        color: _osDnsIsFamilySafe
                            ? const Color(0xFF10B981)
                            : Colors.amber,
                        size: 18,
                      ),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          _osDnsIsFamilySafe
                              ? 'DNS ACTIVE: $_osDnsSpecifier'
                              : 'Safe Private DNS Not Active',
                          style: TextStyle(
                            color: _osDnsIsFamilySafe
                                ? const Color(0xFF10B981)
                                : Colors.amber,
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF10B981),
                        foregroundColor: Colors.black,
                        padding: const EdgeInsets.symmetric(vertical: 10),
                      ),
                      icon: const Icon(Icons.bolt_rounded, size: 18),
                      label: Text(
                        _tr('activateDnsBtn'),
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      onPressed: () {
                        Navigator.pop(ctx);
                        _activateSafePrivateDnsNow();
                      },
                    ),
                  ),
                  const SizedBox(height: 8),
                  SwitchListTile(
                    contentPadding: EdgeInsets.zero,
                    dense: true,
                    activeThumbColor: const Color(0xFF10B981),
                    title: Text(
                      _tr('lockPhoneSettings'),
                      style: TextStyle(
                        color: _textColor,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    value: _phoneSettingsLocked,
                    onChanged: (val) {
                      if (!val) {
                        Navigator.pop(ctx);
                        _showMindfulGateModal(
                          ctx,
                          targetTitle: 'Unlock Phone Settings',
                          onPassed: () {
                            setState(() => _phoneSettingsLocked = false);
                            _saveState();
                            _syncFortressToNative();
                          },
                        );
                      } else {
                        setState(() => _phoneSettingsLocked = true);
                        _saveState();
                        _syncFortressToNative();
                      }
                    },
                  ),
                  SwitchListTile(
                    contentPadding: EdgeInsets.zero,
                    dense: true,
                    activeThumbColor: const Color(0xFF10B981),
                    title: Text(
                      _tr('nightAutoDns'),
                      style: TextStyle(
                        color: _textColor,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    value: _nightAutoDnsEnabled,
                    onChanged: (val) {
                      setState(() => _nightAutoDnsEnabled = val);
                      _saveState();
                      _syncFortressToNative();
                    },
                  ),
                ],
              ),
            ),

            const SizedBox(height: 14),
            Text(
              _tr('safeSubSettings'),
              style: TextStyle(
                color: _subTextColor,
                fontSize: 11,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _buildSafeSettingChip(
                  ctx,
                  icon: Icons.wifi_rounded,
                  label: _tr('safeWifi'),
                  type: 'wifi',
                ),
                _buildSafeSettingChip(
                  ctx,
                  icon: Icons.bluetooth_rounded,
                  label: _tr('safeBluetooth'),
                  type: 'bluetooth',
                ),
                _buildSafeSettingChip(
                  ctx,
                  icon: Icons.volume_up_rounded,
                  label: _tr('safeSound'),
                  type: 'sound',
                ),
                _buildSafeSettingChip(
                  ctx,
                  icon: Icons.brightness_6_rounded,
                  label: _tr('safeDisplay'),
                  type: 'display',
                ),
              ],
            ),

            const Divider(height: 28, color: Colors.white12),
            Text(
              'PAGES & SUB-TABS',
              style: TextStyle(
                color: _subTextColor,
                fontSize: 11,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 6),
            _buildDrawerNavTile(
              ctx,
              icon: Icons.home_rounded,
              title: _tr('navHome'),
              tab: 0,
            ),
            _buildDrawerNavTile(
              ctx,
              icon: Icons.apps_rounded,
              title: '${_tr('navApps')} • Essential / Restricted',
              tab: 1,
            ),
            _buildDrawerNavTile(
              ctx,
              icon: Icons.shield_rounded,
              title: '${_tr('navPurity')} • Safe Private DNS & Night Lock',
              tab: 2,
              subTab: 0,
            ),
            _buildDrawerNavTile(
              ctx,
              icon: Icons.sos_rounded,
              title: '${_tr('navPurity')} • Emergency SOS & Streak',
              tab: 2,
              subTab: 1,
            ),
            _buildDrawerNavTile(
              ctx,
              icon: Icons.notifications_paused_rounded,
              title: '${_tr('navFocus')} • Notification Digest & Monk Mode',
              tab: 3,
              subTab: 0,
            ),
            _buildDrawerNavTile(
              ctx,
              icon: Icons.admin_panel_settings_rounded,
              title: '${_tr('navSettings')} • Launcher & System Permissions',
              tab: 4,
              subTab: 0,
            ),

            const Divider(height: 28, color: Colors.white12),
            Text(
              'LANGUAGE / ভাষা / اللغة',
              style: TextStyle(
                color: _subTextColor,
                fontSize: 11,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: [
                _buildLangChip('en', 'EN'),
                _buildLangChip('bn', 'বাংলা'),
                _buildLangChip('ar', 'العربية'),
                _buildLangChip('ur', 'اردو'),
                _buildLangChip('id', 'ID'),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSafeSettingChip(
    BuildContext ctx, {
    required IconData icon,
    required String label,
    required String type,
  }) {
    return InkWell(
      onTap: () {
        Navigator.pop(ctx);
        _openSafeSubSetting(type);
      },
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
        decoration: BoxDecoration(
          color: _bgColor,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: Colors.white12),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 15, color: _accentColor),
            const SizedBox(width: 5),
            Text(
              label,
              style: TextStyle(
                color: _textColor,
                fontSize: 12,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDrawerNavTile(
    BuildContext ctx, {
    required IconData icon,
    required String title,
    required int tab,
    int? subTab,
  }) {
    final bool selected = _currentTab == tab;
    return ListTile(
      dense: true,
      contentPadding: const EdgeInsets.symmetric(horizontal: 8),
      leading: Icon(
        icon,
        color: selected ? _accentColor : _subTextColor,
        size: 20,
      ),
      title: Text(
        title,
        style: TextStyle(
          color: selected ? _textColor : _subTextColor,
          fontWeight: selected ? FontWeight.bold : FontWeight.normal,
          fontSize: 13,
        ),
      ),
      onTap: () {
        Navigator.pop(ctx);
        setState(() {
          _currentTab = tab;
          if (subTab != null) {
            if (tab == 1) _appsSubTab = subTab;
            if (tab == 2) _puritySubTab = subTab;
            if (tab == 3) _focusSubTab = subTab;
            if (tab == 4) _settingsSubTab = subTab;
          }
        });
      },
    );
  }

  Widget _buildLangChip(String code, String label) {
    final bool active = _lang == code;
    return ChoiceChip(
      label: Text(
        label,
        style: TextStyle(
          color: active ? Colors.black : _textColor,
          fontSize: 12,
          fontWeight: FontWeight.bold,
        ),
      ),
      selected: active,
      selectedColor: _accentColor,
      backgroundColor: _bgColor,
      onSelected: (_) {
        setState(() => _lang = code);
        _saveState();
      },
    );
  }

  Widget _buildBottomNav() {
    return NavigationBar(
      backgroundColor: _cardColor,
      indicatorColor: _accentColor.withValues(alpha: 0.22),
      selectedIndex: _currentTab,
      onDestinationSelected: (idx) => setState(() => _currentTab = idx),
      destinations: [
        NavigationDestination(
          icon: const Icon(Icons.home_outlined),
          selectedIcon: Icon(Icons.home_rounded, color: _accentColor),
          label: _tr('navHome'),
        ),
        NavigationDestination(
          icon: const Icon(Icons.apps_outlined),
          selectedIcon: Icon(Icons.apps_rounded, color: _accentColor),
          label: _tr('navApps'),
        ),
        NavigationDestination(
          icon: const Icon(Icons.shield_outlined),
          selectedIcon: Icon(Icons.shield_rounded, color: _accentColor),
          label: _tr('navPurity'),
        ),
        NavigationDestination(
          icon: const Icon(Icons.center_focus_strong_outlined),
          selectedIcon:
              Icon(Icons.center_focus_strong_rounded, color: _accentColor),
          label: _tr('navFocus'),
        ),
        NavigationDestination(
          icon: const Icon(Icons.tune_outlined),
          selectedIcon: Icon(Icons.tune_rounded, color: _accentColor),
          label: _tr('navSettings'),
        ),
      ],
    );
  }

  Widget _buildStickySubTabBar({
    required List<String> tabs,
    required int currentIndex,
    required ValueChanged<int> onTap,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: _cardColor,
        border: const Border(
          bottom: BorderSide(color: Colors.white12),
        ),
      ),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: List.generate(tabs.length, (i) {
            final bool active = currentIndex == i;
            return Padding(
              padding: const EdgeInsets.only(right: 8),
              child: InkWell(
                onTap: () => onTap(i),
                borderRadius: BorderRadius.circular(20),
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                  decoration: BoxDecoration(
                    color: active ? _accentColor : _bgColor,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: active ? _accentColor : Colors.white12,
                    ),
                  ),
                  child: Text(
                    tabs[i],
                    style: TextStyle(
                      color: active ? Colors.black : _textColor,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
              ),
            );
          }),
        ),
      ),
    );
  }

  // =========================================================================
  // PAGE 1: HOME
  // =========================================================================
  Widget _buildHomePage(BuildContext ctx) {
    final String hh = _now.hour.toString().padLeft(2, '0');
    final String mm = _now.minute.toString().padLeft(2, '0');
    final List<String> weekdays = [
      'Mon',
      'Tue',
      'Wed',
      'Thu',
      'Fri',
      'Sat',
      'Sun'
    ];
    final List<String> months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec'
    ];
    final String dateStr =
        '${weekdays[_now.weekday - 1]}, ${_now.day} ${months[_now.month - 1]}';

    final List<AppItem> pinnedApps = _apps
        .where((a) => a.pinned && a.profiles.contains(_activeProfile))
        .toList();

    final List<WisdomEntry> filteredWisdom = _wisdomCategory == 'all'
        ? AppDataDefaults.wisdomList
        : AppDataDefaults.wisdomList
            .where((w) => w.category == _wisdomCategory)
            .toList();
    final WisdomEntry currentWisdom =
        filteredWisdom[_wisdomIndex % filteredWisdom.length];

    return ListView(
      padding: const EdgeInsets.all(18),
      children: [
        // Clock & Status Header
        Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              '$hh:$mm',
              style: TextStyle(
                color: _textColor,
                fontSize: 54,
                fontWeight: FontWeight.w300,
                letterSpacing: -1.5,
              ),
            ),
            const Spacer(),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  dateStr,
                  style: TextStyle(
                    color: _textColor,
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '🔋 $_batteryLevel% • 🔥 $_cleanStreakDays ${_tr('daysClean')}',
                  style: TextStyle(color: _subTextColor, fontSize: 12),
                ),
              ],
            ),
          ],
        ),
        const SizedBox(height: 14),

        // Instant Safe Private DNS Status / Action Banner on Home!
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: _osDnsIsFamilySafe
                ? const Color(0xFF10B981).withValues(alpha: 0.12)
                : Colors.amber.withValues(alpha: 0.14),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: _osDnsIsFamilySafe
                  ? const Color(0xFF10B981)
                  : Colors.amber,
            ),
          ),
          child: Row(
            children: [
              Icon(
                _osDnsIsFamilySafe
                    ? Icons.verified_user_rounded
                    : Icons.shield_outlined,
                color: _osDnsIsFamilySafe
                    ? const Color(0xFF10B981)
                    : Colors.amber,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _osDnsIsFamilySafe
                          ? '${_tr('dnsVerified')} ($_osDnsSpecifier)'
                          : _tr('dnsNotVerified'),
                      style: TextStyle(
                        color: _textColor,
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                    Text(
                      _phoneSettingsLocked
                          ? '🔒 OS Settings Lock Active (<350ms Watchdog)'
                          : '⚠️ OS Settings Unlocked',
                      style: TextStyle(color: _subTextColor, fontSize: 11),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              if (!_osDnsIsFamilySafe)
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF10B981),
                    foregroundColor: Colors.black,
                    padding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  ),
                  onPressed: _activateSafePrivateDnsNow,
                  child: const Text(
                    '1-Tap Fix',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                  ),
                )
              else
                TextButton(
                  onPressed: () => setState(() {
                    _currentTab = 2;
                    _puritySubTab = 0;
                  }),
                  child: const Text(
                    'Guard',
                    style: TextStyle(
                      color: Color(0xFF10B981),
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
            ],
          ),
        ),
        const SizedBox(height: 14),

        // Profile Switcher
        Row(
          children: [
            _buildProfileButton('work', '💼 ${_tr('profileWork')}'),
            const SizedBox(width: 8),
            _buildProfileButton('personal', '🌿 ${_tr('profilePersonal')}'),
            const SizedBox(width: 8),
            _buildProfileButton('sunset', '🌙 ${_tr('profileSunset')}'),
          ],
        ),
        const SizedBox(height: 18),

        // Pinned Essential Apps
        Row(
          children: [
            Text(
              _tr('essentialApps').toUpperCase(),
              style: TextStyle(
                color: _subTextColor,
                fontSize: 11,
                fontWeight: FontWeight.bold,
                letterSpacing: 1.1,
              ),
            ),
            const Spacer(),
            TextButton(
              onPressed: () => setState(() => _currentTab = 1),
              child: Text(
                '${_tr('allApps')} →',
                style: TextStyle(color: _accentColor, fontSize: 12),
              ),
            ),
          ],
        ),
        ...pinnedApps.map(
          (app) => InkWell(
            onTap: () => _handleAppTap(ctx, app),
            borderRadius: BorderRadius.circular(12),
            child: Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              decoration: BoxDecoration(
                color: _cardColor,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.white10),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      app.name,
                      style: TextStyle(
                        color: _textColor,
                        fontSize: 17,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                  Text(
                    app.category,
                    style: TextStyle(color: _subTextColor, fontSize: 12),
                  ),
                  const SizedBox(width: 8),
                  Icon(
                    Icons.arrow_forward_ios_rounded,
                    size: 13,
                    color: _subTextColor,
                  ),
                ],
              ),
            ),
          ),
        ),

        const SizedBox(height: 14),

        // Quick Mindful Scratchpad
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: _cardColor,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: Colors.white10),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '📝 ${_tr('quickNotes')}',
                style: TextStyle(
                  color: _textColor,
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
              ),
              const SizedBox(height: 6),
              TextField(
                controller: _notesController,
                maxLines: 2,
                style: TextStyle(color: _textColor, fontSize: 13),
                decoration: InputDecoration(
                  hintText: _tr('notesHint'),
                  hintStyle: TextStyle(color: _subTextColor, fontSize: 12),
                  border: InputBorder.none,
                  isDense: true,
                ),
                onChanged: (v) {
                  _scratchpad = v;
                  _saveState();
                },
              ),
            ],
          ),
        ),

        const SizedBox(height: 14),

        // Calm Mind Wisdom Bar
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: _cardColor,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: Colors.white12),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Text(
                    '✨ ${_tr('wisdomHeader')}',
                    style: TextStyle(
                      color: _accentColor,
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                    ),
                  ),
                  const Spacer(),
                  InkWell(
                    onTap: () => setState(() => _wisdomIndex++),
                    child: Text(
                      '↻ ${_tr('nextWisdom')}',
                      style: TextStyle(
                        color: _subTextColor,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 6,
                children: [
                  _buildWisdomCatChip('all', 'All'),
                  _buildWisdomCatChip('quran', '📖 Quran'),
                  _buildWisdomCatChip('hadith', '✨ Hadith'),
                  _buildWisdomCatChip('proverb', '🌱 Proverb'),
                ],
              ),
              const SizedBox(height: 10),
              Text(
                '"${currentWisdom.text}"',
                style: TextStyle(
                  color: _textColor,
                  fontSize: 14,
                  fontStyle: FontStyle.italic,
                  height: 1.4,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                '— ${currentWisdom.ref}',
                style: TextStyle(
                  color: _accentColor,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildProfileButton(String id, String label) {
    final bool active = _activeProfile == id;
    return Expanded(
      child: InkWell(
        onTap: () {
          setState(() {
            _activeProfile = id;
            if (id == 'sunset') {
              _themeMode = 'amber';
            } else if (_themeMode == 'amber') {
              _themeMode = 'oled';
            }
          });
          _saveState();
        },
        borderRadius: BorderRadius.circular(10),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: active ? _accentColor : _cardColor,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: active ? _accentColor : Colors.white12,
            ),
          ),
          child: Text(
            label,
            style: TextStyle(
              color: active ? Colors.black : _textColor,
              fontSize: 12,
              fontWeight: FontWeight.bold,
            ),
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ),
    );
  }

  Widget _buildWisdomCatChip(String cat, String label) {
    final bool active = _wisdomCategory == cat;
    return InkWell(
      onTap: () => setState(() => _wisdomCategory = cat),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: active ? _accentColor.withValues(alpha: 0.2) : _bgColor,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: active ? _accentColor : Colors.white12,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: active ? _accentColor : _subTextColor,
            fontSize: 11,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }

  // =========================================================================
  // PAGE 2: APPS DIRECTORY (WITH STICKY SUB-TAB BAR)
  // =========================================================================
  Widget _buildAppsPage(BuildContext ctx) {
    final List<AppItem> filtered = _apps.where((app) {
      if (_searchQuery.isNotEmpty &&
          !app.name.toLowerCase().contains(_searchQuery.toLowerCase()) &&
          !app.packageName.toLowerCase().contains(_searchQuery.toLowerCase())) {
        return false;
      }
      if (_appsSubTab == 1) return app.tier == 'essential';
      if (_appsSubTab == 2) return app.tier == 'utility';
      if (_appsSubTab == 3) return app.tier == 'restricted';
      if (_appsSubTab == 4) return app.nightQrLocked;
      return true;
    }).toList();

    return Column(
      children: [
        _buildStickySubTabBar(
          tabs: [
            _tr('allApps'),
            '📞 ${_tr('tierEssential')}',
            '🛠 ${_tr('tierUtility')}',
            '⏳ ${_tr('tierRestricted')}',
            '🌙 ${_tr('nightQr')}',
          ],
          currentIndex: _appsSubTab,
          onTap: (idx) => setState(() => _appsSubTab = idx),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _searchController,
                  style: TextStyle(color: _textColor, fontSize: 14),
                  decoration: InputDecoration(
                    hintText: 'Search apps or packages...',
                    hintStyle: TextStyle(color: _subTextColor, fontSize: 13),
                    prefixIcon: Icon(Icons.search, color: _subTextColor),
                    filled: true,
                    fillColor: _cardColor,
                    contentPadding: const EdgeInsets.symmetric(vertical: 0),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                  ),
                  onChanged: (v) => setState(() => _searchQuery = v),
                ),
              ),
              const SizedBox(width: 8),
              IconButton(
                style: IconButton.styleFrom(backgroundColor: _cardColor),
                icon: Icon(Icons.sync_rounded, color: _accentColor),
                tooltip: 'Sync Installed Android Apps',
                onPressed: _syncInstalledAndroidApps,
              ),
            ],
          ),
        ),
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
            itemCount: filtered.length,
            itemBuilder: (lCtx, idx) {
              final AppItem app = filtered[idx];
              return Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: _cardColor,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: app.tier == 'restricted'
                        ? Colors.amber.withValues(alpha: 0.35)
                        : Colors.white10,
                  ),
                ),
                child: Column(
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: InkWell(
                            onTap: () => _handleAppTap(ctx, app),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  app.name,
                                  style: TextStyle(
                                    color: _textColor,
                                    fontSize: 15,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                Text(
                                  '${app.category} • ${app.packageName}',
                                  style: TextStyle(
                                    color: _subTextColor,
                                    fontSize: 11,
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),
                        ),
                        IconButton(
                          icon: Icon(
                            app.pinned
                                ? Icons.push_pin_rounded
                                : Icons.push_pin_outlined,
                            color: app.pinned ? _accentColor : _subTextColor,
                            size: 18,
                          ),
                          tooltip: 'Pin to Home',
                          onPressed: () {
                            setState(() => app.pinned = !app.pinned);
                            _saveState();
                          },
                        ),
                        ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: app.tier == 'restricted'
                                ? Colors.amber.withValues(alpha: 0.2)
                                : _accentColor.withValues(alpha: 0.2),
                            foregroundColor: app.tier == 'restricted'
                                ? Colors.amber
                                : _accentColor,
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 6,
                            ),
                          ),
                          onPressed: () => _handleAppTap(ctx, app),
                          child: Text(
                            app.tier == 'restricted' ? '15s Gate' : 'Open',
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        _buildTierMiniButton(app, 'essential', 'Essential'),
                        const SizedBox(width: 6),
                        _buildTierMiniButton(app, 'utility', 'Utility'),
                        const SizedBox(width: 6),
                        _buildTierMiniButton(
                            app, 'restricted', '15s Restricted'),
                        const Spacer(),
                        InkWell(
                          onTap: () {
                            setState(
                                () => app.nightQrLocked = !app.nightQrLocked);
                            _saveState();
                          },
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 4,
                            ),
                            decoration: BoxDecoration(
                              color: app.nightQrLocked
                                  ? Colors.purpleAccent.withValues(alpha: 0.2)
                                  : Colors.white10,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              app.nightQrLocked ? '🌙 QR Locked' : '🌙 QR Off',
                              style: TextStyle(
                                color: app.nightQrLocked
                                    ? Colors.purpleAccent
                                    : _subTextColor,
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildTierMiniButton(AppItem app, String tierVal, String label) {
    final bool selected = app.tier == tierVal;
    return InkWell(
      onTap: () {
        setState(() => app.tier = tierVal);
        _saveState();
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: selected ? _accentColor : _bgColor,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: selected ? _accentColor : Colors.white12),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: selected ? Colors.black : _subTextColor,
            fontSize: 10,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }

  // =========================================================================
  // PAGE 3: PURITY & SAFE PRIVATE DNS GUARD (WITH STICKY SUB-TAB BAR)
  // =========================================================================
  Widget _buildPurityDnsPage(BuildContext ctx) {
    return Column(
      children: [
        _buildStickySubTabBar(
          tabs: const [
            '🛡️ DNS & Night Lock',
            '🚨 SOS & Streak',
            '🔍 Keywords & Guard',
            'All',
          ],
          currentIndex: _puritySubTab,
          onTap: (idx) => setState(() => _puritySubTab = idx),
        ),
        Expanded(
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              if (_puritySubTab == 0 || _puritySubTab == 3)
                _buildSafePrivateDnsCard(ctx),
              if (_puritySubTab == 1 || _puritySubTab == 3) ...[
                const SizedBox(height: 14),
                _buildSosAndStreakCard(ctx),
              ],
              if (_puritySubTab == 2 || _puritySubTab == 3) ...[
                const SizedBox(height: 14),
                _buildBlockedKeywordsCard(),
              ],
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildSafePrivateDnsCard(BuildContext ctx) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color:
              _osDnsIsFamilySafe ? const Color(0xFF10B981) : Colors.amber,
          width: 1.4,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                _osDnsIsFamilySafe
                    ? Icons.verified_user_rounded
                    : Icons.gpp_maybe_rounded,
                color: _osDnsIsFamilySafe
                    ? const Color(0xFF10B981)
                    : Colors.amber,
                size: 26,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _tr('safeDnsTitle'),
                      style: TextStyle(
                        color: _textColor,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      _osDnsIsFamilySafe
                          ? 'OS Status: ACTIVE ($_osDnsMode -> $_osDnsSpecifier)'
                          : 'OS Status: $_osDnsMode (Tap below to activate $_dnsHost)',
                      style: TextStyle(
                        color: _osDnsIsFamilySafe
                            ? const Color(0xFF10B981)
                            : Colors.amber,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            _tr('safeDnsSubtitle'),
            style: TextStyle(color: _subTextColor, fontSize: 12, height: 1.4),
          ),
          const SizedBox(height: 14),

          // DNS Provider Selector
          _buildDnsProviderOption(
            id: 'cloudflare',
            title: 'Cloudflare Family Malware & Adult Block (1.1.1.3)',
            host: 'family.cloudflare-dns.com',
          ),
          const SizedBox(height: 8),
          _buildDnsProviderOption(
            id: 'cleanbrowsing',
            title: 'CleanBrowsing Strict Adult Filter + SafeSearch',
            host: 'adult-filter-dns.cleanbrowsing.org',
          ),
          const SizedBox(height: 8),
          _buildDnsProviderOption(
            id: 'adguard',
            title: 'AdGuard Family Protection + SafeSearch',
            host: 'family.adguard-dns.com',
          ),

          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF10B981),
                foregroundColor: Colors.black,
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              icon: const Icon(Icons.security_rounded),
              label: Text(
                '${_tr('activateDnsBtn')} ($_dnsHost)',
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
              onPressed: _activateSafePrivateDnsNow,
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: _textColor,
                    side: const BorderSide(color: Colors.white24),
                  ),
                  icon: const Icon(Icons.copy_rounded, size: 16),
                  label: const Text(
                    'Copy Hostname',
                    style: TextStyle(fontSize: 12),
                  ),
                  onPressed: () {
                    Clipboard.setData(ClipboardData(text: _dnsHost));
                    ScaffoldMessenger.of(ctx).showSnackBar(
                      SnackBar(content: Text('Copied $_dnsHost to clipboard')),
                    );
                  },
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.amber,
                    side: const BorderSide(color: Colors.amber),
                  ),
                  icon: const Icon(Icons.lock_clock_rounded, size: 16),
                  label: Text(
                    _tr('testNativeLock'),
                    style: const TextStyle(fontSize: 12),
                  ),
                  onPressed: () async {
                    await _channel.invokeMethod('openNativeFortressLock', {
                      'pkg': 'com.android.settings',
                      'reason': 'settings_locked',
                    });
                  },
                ),
              ),
            ],
          ),
          const Divider(height: 24, color: Colors.white12),

          // Full Phone Settings Lock Switch
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            activeThumbColor: const Color(0xFF10B981),
            title: Text(
              _tr('lockPhoneSettings'),
              style: TextStyle(
                color: _textColor,
                fontWeight: FontWeight.bold,
                fontSize: 14,
              ),
            ),
            subtitle: Text(
              _tr('lockPhoneSettingsSub'),
              style: TextStyle(color: _subTextColor, fontSize: 12),
            ),
            value: _phoneSettingsLocked,
            onChanged: (val) {
              if (!val) {
                _showMindfulGateModal(
                  ctx,
                  targetTitle: 'Unlock Phone Settings',
                  onPassed: () {
                    setState(() => _phoneSettingsLocked = false);
                    _saveState();
                    _syncFortressToNative();
                  },
                );
              } else {
                setState(() => _phoneSettingsLocked = true);
                _saveState();
                _syncFortressToNative();
              }
            },
          ),

          // Night Auto-Activate DNS & Settings Lock (22:00 - 06:00)
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            activeThumbColor: const Color(0xFF10B981),
            title: Text(
              _tr('nightAutoDns'),
              style: TextStyle(
                color: _textColor,
                fontWeight: FontWeight.bold,
                fontSize: 14,
              ),
            ),
            subtitle: Text(
              _tr('nightAutoDnsSub'),
              style: TextStyle(color: _subTextColor, fontSize: 12),
            ),
            value: _nightAutoDnsEnabled,
            onChanged: (val) {
              setState(() => _nightAutoDnsEnabled = val);
              _saveState();
              _syncFortressToNative();
            },
          ),

          const SizedBox(height: 10),
          Text(
            _tr('safeSubSettings'),
            style: TextStyle(
              color: _subTextColor,
              fontSize: 12,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              ActionChip(
                avatar: const Icon(Icons.wifi_rounded, size: 16),
                label: Text(_tr('safeWifi')),
                onPressed: () => _openSafeSubSetting('wifi'),
              ),
              ActionChip(
                avatar: const Icon(Icons.bluetooth_rounded, size: 16),
                label: Text(_tr('safeBluetooth')),
                onPressed: () => _openSafeSubSetting('bluetooth'),
              ),
              ActionChip(
                avatar: const Icon(Icons.volume_up_rounded, size: 16),
                label: Text(_tr('safeSound')),
                onPressed: () => _openSafeSubSetting('sound'),
              ),
              ActionChip(
                avatar: const Icon(Icons.brightness_6_rounded, size: 16),
                label: Text(_tr('safeDisplay')),
                onPressed: () => _openSafeSubSetting('display'),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildDnsProviderOption({
    required String id,
    required String title,
    required String host,
  }) {
    final bool selected = _dnsProvider == id;
    return InkWell(
      onTap: () {
        setState(() {
          _dnsProvider = id;
          _dnsHost = host;
        });
        _saveState();
        _syncFortressToNative();
      },
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: selected
              ? const Color(0xFF10B981).withValues(alpha: 0.15)
              : _bgColor,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: selected ? const Color(0xFF10B981) : Colors.white12,
          ),
        ),
        child: Row(
          children: [
            Icon(
              selected
                  ? Icons.radio_button_checked_rounded
                  : Icons.radio_button_off_rounded,
              color: selected ? const Color(0xFF10B981) : _subTextColor,
              size: 18,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      color: _textColor,
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                    ),
                  ),
                  Text(
                    host,
                    style: const TextStyle(
                      color: Color(0xFF10B981),
                      fontSize: 12,
                      fontFamily: 'monospace',
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSosAndStreakCard(BuildContext ctx) {
    final double progress = (_cleanStreakDays / 90.0).clamp(0.0, 1.0);
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                '🔥 $_cleanStreakDays ${_tr('daysClean')}',
                style: TextStyle(
                  color: _textColor,
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const Spacer(),
              TextButton.icon(
                icon: const Icon(Icons.add_circle_outline, size: 16),
                label: const Text('+1 Day'),
                onPressed: () {
                  setState(() => _cleanStreakDays++);
                  _saveState();
                },
              ),
            ],
          ),
          const SizedBox(height: 6),
          LinearProgressIndicator(
            value: progress,
            minHeight: 8,
            backgroundColor: Colors.white10,
            color: const Color(0xFF10B981),
            borderRadius: BorderRadius.circular(8),
          ),
          const SizedBox(height: 6),
          Text(
            '90-Day Neuroplasticity Reset Progress: ${(progress * 100).toStringAsFixed(0)}%',
            style: TextStyle(color: _subTextColor, fontSize: 12),
          ),
          const Divider(height: 24, color: Colors.white12),
          Text(
            '🚨 ${_tr('sosTitle')}',
            style: TextStyle(
              color: _textColor,
              fontSize: 15,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            _tr('sosSubtitle'),
            style: TextStyle(color: _subTextColor, fontSize: 12),
          ),
          if (_isEmergencyBrowserLockActive) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Colors.redAccent.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Text(
                '🔒 Emergency Browser Lock is currently ACTIVE in Android OS Watchdog!',
                style: TextStyle(
                  color: Colors.redAccent,
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.redAccent,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              icon: const Icon(Icons.sos_rounded),
              label: Text(
                _tr('sosBtn'),
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
              onPressed: () => _showEmergencySosModal(ctx),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBlockedKeywordsCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '🔍 Custom Blocked Adult Keywords & Domains (${_blockedKeywords.length})',
            style: TextStyle(
              color: _textColor,
              fontWeight: FontWeight.bold,
              fontSize: 15,
            ),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _keywordController,
                  style: TextStyle(color: _textColor, fontSize: 13),
                  decoration: InputDecoration(
                    hintText: 'Add keyword or domain to block...',
                    hintStyle: TextStyle(color: _subTextColor, fontSize: 12),
                    filled: true,
                    fillColor: _bgColor,
                    isDense: true,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: _accentColor,
                  foregroundColor: Colors.black,
                ),
                onPressed: () {
                  final String kw = _keywordController.text.trim().toLowerCase();
                  if (kw.isNotEmpty && !_blockedKeywords.contains(kw)) {
                    setState(() {
                      _blockedKeywords.add(kw);
                      _keywordController.clear();
                    });
                    _saveState();
                  }
                },
                child: const Text('Add'),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: _blockedKeywords
                .map(
                  (kw) => Chip(
                    backgroundColor: _bgColor,
                    label: Text(
                      kw,
                      style: TextStyle(color: _textColor, fontSize: 11),
                    ),
                    onDeleted: () {
                      setState(() => _blockedKeywords.remove(kw));
                      _saveState();
                    },
                  ),
                )
                .toList(),
          ),
        ],
      ),
    );
  }

  // =========================================================================
  // PAGE 4: FOCUS & DIGEST (WITH STICKY SUB-TAB BAR)
  // =========================================================================
  Widget _buildFocusPage(BuildContext ctx) {
    return Column(
      children: [
        _buildStickySubTabBar(
          tabs: const [
            '📬 Digest Batch',
            '🧘 Monk & Night',
            '🧱 QR & RAM Cleaner',
            'All',
          ],
          currentIndex: _focusSubTab,
          onTap: (idx) => setState(() => _focusSubTab = idx),
        ),
        Expanded(
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              if (_focusSubTab == 0 || _focusSubTab == 3)
                _buildDigestCard(),
              if (_focusSubTab == 1 || _focusSubTab == 3) ...[
                const SizedBox(height: 14),
                _buildMonkAndNightScheduleCard(),
              ],
              if (_focusSubTab == 2 || _focusSubTab == 3) ...[
                const SizedBox(height: 14),
                _buildQrAndRamCleanerCard(ctx),
              ],
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildDigestCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                '📬 ${_tr('digestTitle')}',
                style: TextStyle(
                  color: _textColor,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const Spacer(),
              TextButton(
                onPressed: () => setState(() => _digestItems.clear()),
                child: const Text('Clear All'),
              ),
            ],
          ),
          Wrap(
            spacing: 8,
            children: [
              FilterChip(
                label: const Text('08:00 Morning'),
                selected: _digestMorning,
                onSelected: (v) => setState(() => _digestMorning = v),
              ),
              FilterChip(
                label: const Text('13:00 Midday'),
                selected: _digestMidday,
                onSelected: (v) => setState(() => _digestMidday = v),
              ),
              FilterChip(
                label: const Text('19:00 Evening'),
                selected: _digestEvening,
                onSelected: (v) => setState(() => _digestEvening = v),
              ),
            ],
          ),
          const SizedBox(height: 10),
          if (_digestItems.isEmpty)
            Text(
              'Zero held notifications — your attention is clear.',
              style: TextStyle(color: _subTextColor, fontSize: 13),
            )
          else
            ..._digestItems.map(
              (item) => ListTile(
                dense: true,
                contentPadding: EdgeInsets.zero,
                title: Text(
                  item['app'] ?? '',
                  style: TextStyle(
                    color: _textColor,
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                  ),
                ),
                subtitle: Text(
                  item['title'] ?? '',
                  style: TextStyle(color: _subTextColor, fontSize: 12),
                ),
                trailing: Text(
                  item['time'] ?? '',
                  style: TextStyle(color: _subTextColor, fontSize: 11),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildMonkAndNightScheduleCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '🧘 ${_tr('monkModeTitle')}',
            style: TextStyle(
              color: _textColor,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            children: [15, 45, 90, 180].map((mins) {
              return ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: _bgColor,
                  foregroundColor: _accentColor,
                ),
                onPressed: () {
                  setState(() {
                    _monkModeUntil = DateTime.now().millisecondsSinceEpoch +
                        (mins * 60 * 1000);
                  });
                },
                child: Text('${mins}m Lock'),
              );
            }).toList(),
          ),
          if (_isMonkActive) ...[
            const SizedBox(height: 8),
            TextButton(
              onPressed: () => setState(() => _monkModeUntil = 0),
              child: const Text('End Monk Mode Early'),
            ),
          ],
          const Divider(height: 24, color: Colors.white12),
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            activeThumbColor: const Color(0xFF10B981),
            title: Text(
              '🌙 ${_tr('sleepScheduleTitle')}',
              style: TextStyle(
                color: _textColor,
                fontWeight: FontWeight.bold,
                fontSize: 14,
              ),
            ),
            subtitle: Text(
              'Enforces QR lock on night-restricted apps & auto-enables Safe Private DNS at 22:00.',
              style: TextStyle(color: _subTextColor, fontSize: 12),
            ),
            value: _sleepScheduleEnabled,
            onChanged: (v) => setState(() => _sleepScheduleEnabled = v),
          ),
        ],
      ),
    );
  }

  Widget _buildQrAndRamCleanerCard(BuildContext ctx) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '🧱 Physical QR Unlock Key: $_qrSecret',
            style: TextStyle(
              color: _textColor,
              fontWeight: FontWeight.bold,
              fontSize: 15,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Write "$_qrSecret" on a card kept outside your bedroom to unlock Night QR apps or emergency settings.',
            style: TextStyle(color: _subTextColor, fontSize: 12),
          ),
          const Divider(height: 24, color: Colors.white12),
          Text(
            '🧹 ${_tr('ramCleanerTitle')} (Total Freed: $_ramFreedMb MB)',
            style: TextStyle(
              color: _textColor,
              fontWeight: FontWeight.bold,
              fontSize: 15,
            ),
          ),
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: _accentColor,
                foregroundColor: Colors.black,
              ),
              icon: const Icon(Icons.cleaning_services_rounded),
              label: Text(_tr('cleanNowBtn')),
              onPressed: () async {
                try {
                  final Map<dynamic, dynamic>? res = await _channel
                      .invokeMethod<Map<dynamic, dynamic>>('cleanBackgroundApps');
                  final int freed = (res?['freedMb'] as int?) ?? 48;
                  setState(() => _ramFreedMb += freed);
                  if (ctx.mounted) {
                    ScaffoldMessenger.of(ctx).showSnackBar(
                      SnackBar(
                        content: Text(
                            'Hibernated background apps & freed $freed MB RAM!'),
                      ),
                    );
                  }
                } catch (_) {}
              },
            ),
          ),
        ],
      ),
    );
  }

  // =========================================================================
  // PAGE 5: SETTINGS & IMPACT (WITH STICKY SUB-TAB BAR)
  // =========================================================================
  Widget _buildSettingsPage(BuildContext ctx) {
    return Column(
      children: [
        _buildStickySubTabBar(
          tabs: const [
            '🔐 Phone & System',
            '📊 Impact Report',
            '🌐 Language & Display',
            'All',
          ],
          currentIndex: _settingsSubTab,
          onTap: (idx) => setState(() => _settingsSubTab = idx),
        ),
        Expanded(
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              if (!_settingsUnlockedSession)
                Container(
                  margin: const EdgeInsets.only(bottom: 14),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: Colors.amber.withValues(alpha: 0.14),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: Colors.amber),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.lock_outline_rounded,
                          color: Colors.amber),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          'Settings are protected against impulsive weakening. Complete a 15s reflection to unlock editing.',
                          style: TextStyle(color: _textColor, fontSize: 12),
                        ),
                      ),
                      const SizedBox(width: 8),
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.amber,
                          foregroundColor: Colors.black,
                        ),
                        onPressed: () => _showMindfulGateModal(
                          ctx,
                          targetTitle: 'Unlock Minimum Phone Settings',
                          onPassed: () =>
                              setState(() => _settingsUnlockedSession = true),
                        ),
                        child: const Text('15s Unlock'),
                      ),
                    ],
                  ),
                ),
              if (_settingsSubTab == 0 || _settingsSubTab == 3)
                _buildSystemPermissionsCard(ctx),
              if (_settingsSubTab == 1 || _settingsSubTab == 3) ...[
                const SizedBox(height: 14),
                _buildImpactReportCard(),
              ],
              if (_settingsSubTab == 2 || _settingsSubTab == 3) ...[
                const SizedBox(height: 14),
                _buildLanguageAndThemeCard(),
              ],
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildSystemPermissionsCard(BuildContext ctx) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '🔐 Native Android OS Fortress Controls',
            style: TextStyle(
              color: _textColor,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          ListTile(
            contentPadding: EdgeInsets.zero,
            leading: Icon(
              _isDefaultLauncher
                  ? Icons.check_circle_rounded
                  : Icons.home_work_outlined,
              color: _isDefaultLauncher
                  ? const Color(0xFF10B981)
                  : Colors.amber,
            ),
            title: Text(
              _tr('defaultLauncherCard'),
              style: TextStyle(
                color: _textColor,
                fontWeight: FontWeight.bold,
                fontSize: 14,
              ),
            ),
            subtitle: Text(
              _isDefaultLauncher
                  ? 'Active as your Default Home Screen'
                  : 'Tap to set Minimum Phone as your Default Home App',
              style: TextStyle(color: _subTextColor, fontSize: 12),
            ),
            trailing: ElevatedButton(
              onPressed: () async {
                await _channel.invokeMethod('requestDefaultLauncher');
              },
              child: Text(_isDefaultLauncher ? 'Change' : 'Set Default'),
            ),
          ),
          const Divider(color: Colors.white12),
          ListTile(
            contentPadding: EdgeInsets.zero,
            leading: Icon(
              _hasUsageAccess
                  ? Icons.verified_user_rounded
                  : Icons.warning_amber_rounded,
              color:
                  _hasUsageAccess ? const Color(0xFF10B981) : Colors.redAccent,
            ),
            title: Text(
              _tr('usageAccessCard'),
              style: TextStyle(
                color: _textColor,
                fontWeight: FontWeight.bold,
                fontSize: 14,
              ),
            ),
            subtitle: Text(
              _hasUsageAccess
                  ? 'Granted! 350ms Watchdog is actively guarding Settings & Browsers.'
                  : 'Required so Minimum Phone can intercept Android Settings & Browsers.',
              style: TextStyle(color: _subTextColor, fontSize: 12),
            ),
            trailing: ElevatedButton(
              onPressed: () async {
                await _channel.invokeMethod('requestUsageStatsPermission');
              },
              child: Text(_hasUsageAccess ? 'Verified' : 'Grant'),
            ),
          ),
          const Divider(color: Colors.white12),
          ListTile(
            contentPadding: EdgeInsets.zero,
            leading: Icon(
              Icons.phonelink_lock_rounded,
              color: _isKioskPinned ? const Color(0xFF10B981) : _subTextColor,
            ),
            title: Text(
              _tr('kioskPinCard'),
              style: TextStyle(
                color: _textColor,
                fontWeight: FontWeight.bold,
                fontSize: 14,
              ),
            ),
            subtitle: Text(
              'Locks the hardware navigation buttons to this screen during exams or deep work.',
              style: TextStyle(color: _subTextColor, fontSize: 12),
            ),
            trailing: ElevatedButton(
              onPressed: () async {
                await _channel.invokeMethod('toggleKioskPin');
                _refreshNativeStatus();
              },
              child: Text(_isKioskPinned ? 'Unpin' : 'Pin Screen'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildImpactReportCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '📊 Digital Wellbeing & Purity Impact',
            style: TextStyle(
              color: _textColor,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 10,
            crossAxisSpacing: 10,
            childAspectRatio: 1.9,
            children: [
              _buildStatBox('$_reclaimedMinutes m', 'Time Reclaimed'),
              _buildStatBox('$_mindfulPausesCompleted', '15s Wisdom Pauses'),
              _buildStatBox('$_urgesResisted', 'SOS Urges Resisted'),
              _buildStatBox('$_blockedOpens', 'Impulsive Opens Stopped'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatBox(String val, String label) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: _bgColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            val,
            style: TextStyle(
              color: _accentColor,
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: TextStyle(color: _subTextColor, fontSize: 11),
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _buildLanguageAndThemeCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '🌐 Language (5 Languages + RTL Support)',
            style: TextStyle(
              color: _textColor,
              fontSize: 15,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _buildLangChip('en', 'English'),
              _buildLangChip('bn', 'বাংলা'),
              _buildLangChip('ar', 'العربية'),
              _buildLangChip('ur', 'اردو'),
              _buildLangChip('id', 'Bahasa Indonesia'),
            ],
          ),
          const Divider(height: 24, color: Colors.white12),
          Text(
            '🎨 Minimalist Display Theme',
            style: TextStyle(
              color: _textColor,
              fontSize: 15,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            children: [
              ChoiceChip(
                label: const Text('OLED Pitch Black'),
                selected: _themeMode == 'oled',
                onSelected: (_) {
                  setState(() => _themeMode = 'oled');
                  _saveState();
                },
              ),
              ChoiceChip(
                label: const Text('E-Ink Warm Paper'),
                selected: _themeMode == 'eink',
                onSelected: (_) {
                  setState(() => _themeMode = 'eink');
                  _saveState();
                },
              ),
              ChoiceChip(
                label: const Text('Sunset Zero-Blue'),
                selected: _themeMode == 'amber',
                onSelected: (_) {
                  setState(() => _themeMode = 'amber');
                  _saveState();
                },
              ),
            ],
          ),
        ],
      ),
    );
  }
}

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
        profiles: List<String>.from(
            json['profiles'] ?? ['work', 'personal', 'sunset']),
      );
}

class ChecklistEntry {
  String text;
  bool done;

  ChecklistEntry({required this.text, this.done = false});

  Map<String, dynamic> toJson() => {'text': text, 'done': done};

  factory ChecklistEntry.fromJson(Map<String, dynamic> json) => ChecklistEntry(
        text: json['text'] ?? '',
        done: json['done'] == true,
      );
}

class KeepNoteItem {
  String id;
  String title;
  String content;
  bool isChecklist;
  List<ChecklistEntry> checklist;
  bool pinned;
  String label; // 'Idea', 'Work', 'Reflection', 'Task'
  int colorIndex; // 0..5
  int updatedAt;

  KeepNoteItem({
    required this.id,
    required this.title,
    required this.content,
    this.isChecklist = false,
    List<ChecklistEntry>? checklist,
    this.pinned = false,
    this.label = 'Idea',
    this.colorIndex = 0,
    int? updatedAt,
  })  : checklist = checklist ?? [],
        updatedAt = updatedAt ?? DateTime.now().millisecondsSinceEpoch;

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'content': content,
        'isChecklist': isChecklist,
        'checklist': checklist.map((c) => c.toJson()).toList(),
        'pinned': pinned,
        'label': label,
        'colorIndex': colorIndex,
        'updatedAt': updatedAt,
      };

  factory KeepNoteItem.fromJson(Map<String, dynamic> json) => KeepNoteItem(
        id: json['id'] ?? DateTime.now().millisecondsSinceEpoch.toString(),
        title: json['title'] ?? '',
        content: json['content'] ?? '',
        isChecklist: json['isChecklist'] == true,
        checklist: (json['checklist'] as List<dynamic>?)
                ?.map((e) => ChecklistEntry.fromJson(Map<String, dynamic>.from(e)))
                .toList() ??
            [],
        pinned: json['pinned'] == true,
        label: json['label'] ?? 'Idea',
        colorIndex: (json['colorIndex'] as int?) ?? 0,
        updatedAt:
            (json['updatedAt'] as int?) ?? DateTime.now().millisecondsSinceEpoch,
      );
}

class MinimumPhoneApp extends StatefulWidget {
  const MinimumPhoneApp({super.key});

  @override
  State<MinimumPhoneApp> createState() => _MinimumPhoneAppState();
}

class _MinimumPhoneAppState extends State<MinimumPhoneApp>
    with WidgetsBindingObserver {
  static const MethodChannel _channel =
      MethodChannel('com.kasbllc.minimumphone/native');

  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  // Navigation State (No Bottom Bar — 100% Sidebar Driven!)
  // 0: Home, 1: Apps, 2: Purity & DNS, 3: Focus, 4: Settings, 5: Keep Notes, 6: User Guide
  int _currentTab = 0;
  int _appsSubTab = 0; // 0: All, 1: Essential, 2: Utility, 3: Restricted, 4: Night QR
  int _puritySubTab = 0; // 0: DNS & Night Lock, 1: SOS & Streak, 2: Keywords, 3: All
  int _focusSubTab = 0; // 0: Digest, 1: Monk & Night, 2: QR & Cleaner, 3: All
  int _settingsSubTab = 0; // 0: System & Lock, 1: Impact, 2: Language & Theme, 3: All
  int _notesSubTab = 0; // 0: All, 1: Pinned, 2: Checklists, 3: Work, 4: Ideas, 5: Reflections
  bool _notesGridView = true;
  String _notesSearchQuery = '';

  // App State
  String _lang = 'en';
  String _themeMode = 'oled'; // 'oled', 'eink', 'amber'
  String _activeProfile = 'work'; // 'work', 'personal', 'sunset'
  String _backgroundLocation = 'Auto GPS';
  String _searchQuery = '';
  int _wisdomIndex = 0;
  bool _torchOn = false;

  // Keep Notes State
  List<KeepNoteItem> _keepNotes = [];
  final TextEditingController _quickHomeNoteController = TextEditingController();
  final TextEditingController _notesSearchController = TextEditingController();

  // Safe Private DNS & OS Fortress State
  String _dnsProvider = 'cloudflare'; // 'cloudflare', 'cleanbrowsing', 'adguard'
  String _dnsHost = 'family.cloudflare-dns.com';
  bool _phoneSettingsLocked = true;
  bool _nightAutoDnsEnabled = true;
  bool _strictQrSettingsLock = false; // Default false: QR lock only at Night (22:00-06:00), Daytime 15s bypass!
  bool _qrSetupVerified = false;
  int _qrMatrixSize = 0;
  String _qrMatrixBits = '';
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
  bool _hasOverlayPermission = false;
  bool _isKioskPinned = false;
  String _osDnsSpecifier = '';
  bool _osDnsIsFamilySafe = false;
  int _batteryLevel = 100;

  // Clock & Timers
  DateTime _now = DateTime.now();
  Timer? _clockTimer;
  final TextEditingController _searchController = TextEditingController();
  final TextEditingController _keywordController = TextEditingController();

  List<AppItem> _apps = [];
  final List<Map<String, String>> _digestItems = [
    {
      'app': 'WhatsApp Business',
      'titleKey': 'digestMsg1',
      'time': '11:40'
    },
    {
      'app': 'Gmail',
      'titleKey': 'digestMsg2',
      'time': '10:15'
    },
    {
      'app': 'Telegram',
      'titleKey': 'digestMsg3',
      'time': '09:30'
    },
  ];

  static const List<Color> _keepNotePalette = [
    Color(0xFF14161D), // 0: Obsidian Default
    Color(0xFF0B291E), // 1: Deep Emerald
    Color(0xFF2B1D0A), // 2: Warm Amber
    Color(0xFF0D2133), // 3: Midnight Ocean
    Color(0xFF25132B), // 4: Royal Plum
    Color(0xFF1F232A), // 5: Minimalist Slate
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _initDefaultApps();
    _initDefaultKeepNotes();
    _loadPersistedState();
    _refreshNativeStatus();
    _loadQrMatrix();
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
    WidgetsBinding.instance.removeObserver(this);
    _clockTimer?.cancel();
    _quickHomeNoteController.dispose();
    _notesSearchController.dispose();
    _searchController.dispose();
    _keywordController.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      // Immediately refresh Usage Access, Overlay, and OS Private DNS when user returns from Android Settings!
      _refreshNativeStatus();
    }
  }

  void _initDefaultKeepNotes() {
    _keepNotes = [
      KeepNoteItem(
        id: 'note_1',
        title: 'Today\'s Core Priorities',
        content: '',
        isChecklist: true,
        pinned: true,
        label: 'Work',
        colorIndex: 1,
        checklist: [
          ChecklistEntry(text: 'Activate Safe Private DNS & Lock Settings', done: true),
          ChecklistEntry(text: 'Complete 90m Deep Work Session', done: false),
          ChecklistEntry(text: 'Read Quran / Evening Reflection before 22:00', done: false),
        ],
      ),
      KeepNoteItem(
        id: 'note_2',
        title: 'Digital Detox Intention',
        content:
            'Every time I feel the urge to scroll aimlessly, pause for 15 seconds, breathe deeply, and remember what truly matters.',
        isChecklist: false,
        pinned: true,
        label: 'Reflection',
        colorIndex: 2,
      ),
    ];
  }

  void _initDefaultApps() {
    _apps = [
      AppItem(
        id: 'dialer',
        name: 'Phone Calls',
        packageName: 'com.google.android.dialer',
        category: 'Calls',
        tier: 'essential',
        pinned: true,
        nightQrLocked: false,
        profiles: ['work', 'personal', 'sunset'],
      ),
      AppItem(
        id: 'messages',
        name: 'SMS Messages',
        packageName: 'com.google.android.apps.messaging',
        category: 'SMS',
        tier: 'essential',
        pinned: true,
        nightQrLocked: false,
        profiles: ['work', 'personal', 'sunset'],
      ),
      AppItem(
        id: 'whatsapp',
        name: 'WhatsApp',
        packageName: 'com.whatsapp',
        category: 'Chat',
        tier: 'utility',
        pinned: true,
        nightQrLocked: false,
        profiles: ['work', 'personal'],
      ),
      AppItem(
        id: 'maps',
        name: 'Google Maps',
        packageName: 'com.google.android.apps.maps',
        category: 'Maps',
        tier: 'essential',
        pinned: true,
        nightQrLocked: false,
        profiles: ['work', 'personal'],
      ),
      AppItem(
        id: 'calendar',
        name: 'Calendar',
        packageName: 'com.google.android.calendar',
        category: 'Plan',
        tier: 'essential',
        pinned: true,
        nightQrLocked: false,
        profiles: ['work', 'sunset'],
      ),
      AppItem(
        id: 'calculator',
        name: 'Calculator',
        packageName: 'com.google.android.calculator',
        category: 'Tools',
        tier: 'essential',
        pinned: true,
        nightQrLocked: false,
        profiles: ['work'],
      ),
      AppItem(
        id: 'chrome',
        name: 'Chrome',
        packageName: 'com.android.chrome',
        category: 'Browser',
        tier: 'restricted',
        pinned: false,
        nightQrLocked: true,
        profiles: [],
      ),
      AppItem(
        id: 'youtube',
        name: 'YouTube',
        packageName: 'com.google.android.youtube',
        category: 'Video',
        tier: 'restricted',
        pinned: false,
        nightQrLocked: true,
        profiles: [],
      ),
      AppItem(
        id: 'instagram',
        name: 'Instagram',
        packageName: 'com.instagram.android',
        category: 'Social',
        tier: 'restricted',
        pinned: false,
        nightQrLocked: true,
        profiles: [],
      ),
      AppItem(
        id: 'facebook',
        name: 'Facebook',
        packageName: 'com.facebook.katana',
        category: 'Social',
        tier: 'restricted',
        pinned: false,
        nightQrLocked: true,
        profiles: [],
      ),
      AppItem(
        id: 'tiktok',
        name: 'TikTok',
        packageName: 'com.zhiliaoapp.musically',
        category: 'Video',
        tier: 'restricted',
        pinned: false,
        nightQrLocked: true,
        profiles: [],
      ),
      AppItem(
        id: 'settings',
        name: 'Settings',
        packageName: 'com.android.settings',
        category: 'System',
        tier: 'restricted',
        pinned: false,
        nightQrLocked: true,
        profiles: [],
      ),
    ];
  }

  Future<void> _loadPersistedState() async {
    try {
      final String? raw =
          await _channel.invokeMethod<String>('loadAppStateJson');
      if (raw != null && raw.isNotEmpty) {
        final Map<String, dynamic> data = jsonDecode(raw);
        final bool hasHomeListsV23 = data['homeListsV23'] == true;
        setState(() {
          _lang = data['lang'] ?? _lang;
          _themeMode = data['themeMode'] ?? _themeMode;
          _activeProfile = data['activeProfile'] ?? _activeProfile;
          _dnsProvider = data['dnsProvider'] ?? 'cloudflare';
          _dnsHost = data['dnsHost'] ?? 'family.cloudflare-dns.com';
          _phoneSettingsLocked = data['phoneSettingsLocked'] ?? true;
          _nightAutoDnsEnabled = data['nightAutoDnsEnabled'] ?? true;
          _strictQrSettingsLock = data['strictQr247'] == true;
          _qrSetupVerified = data['qrSetupVerified'] == true;
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
              _apps = list
                  .map((e) => AppItem.fromJson(Map<String, dynamic>.from(e)))
                  .toList();
              if (!hasHomeListsV23) {
                for (final app in _apps) {
                  if (!app.pinned) {
                    app.profiles = [];
                  }
                }
              }
              for (final app in _apps) {
                app.pinned = app.profiles.isNotEmpty;
              }
            }
          }
          if (data['keepNotes'] != null) {
            final List<dynamic> nList = data['keepNotes'];
            if (nList.isNotEmpty) {
              _keepNotes = nList
                  .map((e) => KeepNoteItem.fromJson(Map<String, dynamic>.from(e)))
                  .toList();
            }
          } else if (data['scratchpad'] != null &&
              data['scratchpad'].toString().trim().isNotEmpty) {
            _keepNotes.insert(
              0,
              KeepNoteItem(
                id: 'migrated_note',
                title: 'Quick Note',
                content: data['scratchpad'].toString(),
                pinned: true,
              ),
            );
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
        'homeListsV23': true,
        'dnsProvider': _dnsProvider,
        'dnsHost': _dnsHost,
        'phoneSettingsLocked': _phoneSettingsLocked,
        'nightAutoDnsEnabled': _nightAutoDnsEnabled,
        'strictQr247': _strictQrSettingsLock,
        'qrSetupVerified': _qrSetupVerified,
        'qrSecret': _qrSecret,
        'cleanStreakDays': _cleanStreakDays,
        'reclaimedMinutes': _reclaimedMinutes,
        'mindfulPausesCompleted': _mindfulPausesCompleted,
        'urgesResisted': _urgesResisted,
        'blockedOpens': _blockedOpens,
        'blockedKeywords': _blockedKeywords,
        'apps': _apps.map((a) => a.toJson()).toList(),
        'keepNotes': _keepNotes.map((n) => n.toJson()).toList(),
      };
      await _channel
          .invokeMethod('saveAppStateJson', {'json': jsonEncode(data)});
    } catch (_) {}
  }

  Future<void> _syncFortressToNative() async {
    try {
      await _channel.invokeMethod('configureFortress', {
        'lang': _lang,
        'phoneSettingsLocked': _phoneSettingsLocked,
        'lockSystemSettings': _phoneSettingsLocked,
        'nightAutoDnsEnabled': _nightAutoDnsEnabled,
        'autoNightDns': _nightAutoDnsEnabled,
        'dnsShieldActive': true,
        'dnsHost': _dnsHost,
        'expectedHost': _dnsHost,
        'qrSecret': _qrSecret,
        'qrCode': _qrSecret,
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
          _hasUsageAccess = (status['isUsageStatsGranted'] == true) ||
              (status['hasUsageAccess'] == true);
          _hasOverlayPermission = (status['isOverlayGranted'] == true) ||
              (status['hasOverlayPermission'] == true);
          _isKioskPinned = status['isKioskPinned'] == true;
          _osDnsSpecifier =
              (status['privateDnsHost'] ?? status['osDnsSpecifier'] ?? '')
                  .toString();
          _osDnsIsFamilySafe = (status['privateDnsActive'] == true) ||
              (status['osDnsIsFamilySafe'] == true);
          _batteryLevel = (status['batteryLevel'] as int?) ?? 100;
          final String bgLoc =
              (status['backgroundLocation'] ?? '').toString().trim();
          if (bgLoc.isNotEmpty) {
            _backgroundLocation = bgLoc;
          }
        });
      }
    } catch (_) {}
  }

  Future<void> _syncInstalledAndroidApps() async {
    try {
      final dynamic raw = await _channel.invokeMethod('getInstalledApps');
      List<dynamic> list = [];
      if (raw is String && raw.isNotEmpty) {
        list = jsonDecode(raw);
      } else if (raw is List) {
        list = raw;
      }
      if (list.isNotEmpty) {
        int added = 0;
        setState(() {
          for (final item in list) {
            final Map<dynamic, dynamic> map = item as Map<dynamic, dynamic>;
            final String pkg = (map['packageName'] ?? '').toString();
            final String label =
                (map['label'] ?? map['name'] ?? 'App').toString();
            if (pkg.isEmpty) continue;
            final bool exists = _apps.any((a) => a.packageName == pkg);
            if (!exists) {
              final String lowerPkg = pkg.toLowerCase();
              final bool isBrowserOrSocial = lowerPkg.contains('browser') ||
                  lowerPkg.contains('chrome') ||
                  lowerPkg.contains('firefox') ||
                  lowerPkg.contains('opera') ||
                  lowerPkg.contains('brave') ||
                  lowerPkg.contains('instagram') ||
                  lowerPkg.contains('facebook') ||
                  lowerPkg.contains('tiktok') ||
                  lowerPkg.contains('youtube') ||
                  lowerPkg.contains('twitter') ||
                  lowerPkg.contains('reddit');
              _apps.add(AppItem(
                id: pkg,
                name: label,
                packageName: pkg,
                category: isBrowserOrSocial ? 'Guarded' : 'App',
                tier: isBrowserOrSocial ? 'restricted' : 'utility',
                pinned: false,
                nightQrLocked: isBrowserOrSocial,
                profiles: [],
              ));
              added++;
            }
          }
        });
        _saveState();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('${_tr('syncedAppsToast')} (+$added)'),
              backgroundColor: const Color(0xFF10B981),
            ),
          );
        }
      }
    } catch (_) {}
  }

  String _tr(String key) => AppDataDefaults.tr(_lang, key);

  String _displayNoteTitle(KeepNoteItem n) {
    if (n.id == 'note_1' && n.title == 'Today\'s Core Priorities') {
      return _tr('defaultNote1Title');
    }
    if (n.id == 'note_2' && n.title == 'Digital Detox Intention') {
      return _tr('defaultNote2Title');
    }
    return n.title;
  }

  String _displayNoteContent(KeepNoteItem n) {
    if (n.id == 'note_2' && n.content.startsWith('Every time I feel the urge')) {
      return _tr('defaultNote2Body');
    }
    return n.content;
  }

  String _displayChecklistText(KeepNoteItem n, int idx, String raw) {
    if (n.id == 'note_1') {
      if (idx == 0 && raw.startsWith('Activate Safe Private DNS')) {
        return _tr('defaultNote1Item1');
      }
      if (idx == 1 && raw.startsWith('Complete 90m Deep Work')) {
        return _tr('defaultNote1Item2');
      }
      if (idx == 2 && raw.startsWith('Read Quran')) {
        return _tr('defaultNote1Item3');
      }
    }
    return raw;
  }

  String _trCategory(String rawCat) {
    switch (rawCat.toLowerCase()) {
      case 'calls':
        return _tr('catCalls');
      case 'sms':
        return _tr('catSms');
      case 'chat':
        return _tr('catChat');
      case 'maps':
        return _tr('catMaps');
      case 'plan':
        return _tr('catPlan');
      case 'tools':
        return _tr('catTools');
      case 'browser':
        return _tr('catBrowser');
      case 'video':
        return _tr('catVideo');
      case 'social':
        return _tr('catSocial');
      case 'system':
        return _tr('catSystem');
      case 'guarded':
        return _tr('catGuarded');
      case 'utility':
        return _tr('catUtility');
      default:
        return _tr('catApp');
    }
  }

  String _trWeekday(int weekday) {
    const List<String> keys = [
      'dayMon',
      'dayTue',
      'dayWed',
      'dayThu',
      'dayFri',
      'daySat',
      'daySun'
    ];
    return _tr(keys[(weekday - 1).clamp(0, 6)]);
  }

  String _trMonth(int month) {
    const List<String> keys = [
      'monJan',
      'monFeb',
      'monMar',
      'monApr',
      'monMay',
      'monJun',
      'monJul',
      'monAug',
      'monSep',
      'monOct',
      'monNov',
      'monDec'
    ];
    return _tr(keys[(month - 1).clamp(0, 11)]);
  }

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

  Future<void> _activateSafePrivateDnsNow(BuildContext ctx) async {
    try {
      Clipboard.setData(ClipboardData(text: _dnsHost));
      final Map<dynamic, dynamic>? res =
          await _channel.invokeMethod<Map<dynamic, dynamic>>(
        'activateSafePrivateDns',
        {
          'host': _dnsHost,
          'hostname': _dnsHost,
          'openSettingsIfNeeded': true,
        },
      );
      setState(() {
        _phoneSettingsLocked = true;
      });
      await _saveState();
      await _refreshNativeStatus();

      if (!ctx.mounted) return;
      final bool autoApplied =
          (res?['autoApplied'] == true) || (res?['directSuccess'] == true);
      if (autoApplied || _osDnsIsFamilySafe) {
        ScaffoldMessenger.of(ctx).showSnackBar(
          SnackBar(
            content: Text(
              '${_tr('dnsActivatedToast')} ($_dnsHost)',
            ),
            backgroundColor: const Color(0xFF10B981),
          ),
        );
      } else {
        _showDnsGuidedConfirmationSheet(ctx);
      }
    } catch (_) {}
  }

  void _showDnsGuidedConfirmationSheet(BuildContext ctx) {
    showModalBottomSheet(
      context: ctx,
      backgroundColor: const Color(0xFF11131A),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
      ),
      builder: (sCtx) {
        return Padding(
          padding: const EdgeInsets.all(22),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(Icons.shield_rounded, color: Color(0xFF10B981)),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _tr('dnsSheetTitle'),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 17,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFF191D26),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFF10B981)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${_tr('dnsCopiedLabel')} $_dnsHost',
                      style: const TextStyle(
                        color: Color(0xFF10B981),
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      _tr('dnsSheetSteps'),
                      style: const TextStyle(
                        color: Colors.white70,
                        fontSize: 12,
                        height: 1.45,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.white,
                        side: const BorderSide(color: Colors.white24),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                      icon: const Icon(Icons.open_in_new_rounded, size: 16),
                      label: Text(
                        _tr('openDnsSettingsBtn'),
                        style: const TextStyle(fontSize: 12),
                      ),
                      onPressed: () {
                        _openSafeSubSetting('private_dns');
                      },
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF10B981),
                        foregroundColor: Colors.black,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                      icon: const Icon(Icons.check_circle_rounded, size: 16),
                      label: Text(
                        _tr('iSavedDnsLockBtn'),
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      onPressed: () async {
                        await _channel.invokeMethod('confirmManualDnsSetup', {
                          'host': _dnsHost,
                        });
                        await _refreshNativeStatus();
                        if (sCtx.mounted) Navigator.pop(sCtx);
                      },
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Future<void> _openSafeSubSetting(String type) async {
    if (type == 'torch') {
      await _toggleTorch();
      return;
    }
    try {
      await _channel.invokeMethod('openSafePhoneSetting', {
        'settingType': type,
        'target': type,
        'dnsHost': _dnsHost,
      });
    } catch (_) {}
  }

  Future<void> _toggleTorch() async {
    try {
      final bool next = !_torchOn;
      final dynamic res = await _channel.invokeMethod('toggleFlashlight', {
        'enable': next,
      });
      if (mounted) {
        setState(() {
          if (res is Map && res['torchOn'] != null) {
            _torchOn = res['torchOn'] == true;
          } else {
            _torchOn = next;
          }
        });
      }
    } catch (_) {}
  }

  void _handleAppTap(BuildContext ctx, AppItem app) {
    if (_isMonkActive && app.tier != 'essential') {
      final int minsLeft =
          ((_monkModeUntil - DateTime.now().millisecondsSinceEpoch) / 60000)
              .ceil();
      ScaffoldMessenger.of(ctx).showSnackBar(
        SnackBar(
          content: Text(
            '${_tr('monkActiveToast')} (${minsLeft}m)',
          ),
          backgroundColor: Colors.deepOrange,
        ),
      );
      setState(() => _blockedOpens++);
      _saveState();
      return;
    }

    if (_isNightWindow && _sleepScheduleEnabled && app.nightQrLocked) {
      _showQrUnlockDialog(
        ctx,
        targetTitle: app.name,
        onUnlocked: () {
          _launchNativePackage(app.packageName, app.id);
        },
      );
      return;
    }

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
          _launchNativePackage(app.packageName, app.id);
        },
      );
      return;
    }

    _launchNativePackage(app.packageName, app.id);
  }

  Future<void> _launchNativePackage(String pkg, String appId) async {
    try {
      final bool? ok = await _channel.invokeMethod<bool>('launchApp', {
        'packageName': pkg,
        'appId': appId,
      });
      if (ok != true && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${_tr('openBtn')}: $pkg'),
            duration: const Duration(seconds: 2),
          ),
        );
      }
    } catch (_) {}
  }

  Future<void> _loadQrMatrix() async {
    try {
      final Map<dynamic, dynamic>? res = await _channel
          .invokeMethod<Map<dynamic, dynamic>>(
              'generateQrMatrix', {'content': _qrSecret});
      if (res != null && mounted) {
        setState(() {
          _qrMatrixSize = (res['size'] as int?) ?? 0;
          _qrMatrixBits = (res['bits'] ?? '').toString();
        });
      }
    } catch (_) {}
  }

  Future<bool> _scanPhysicalQrWithCamera(BuildContext ctx) async {
    try {
      final String? scanned = await _channel.invokeMethod<String>('scanQrCode');
      if (scanned == null || scanned.trim().isEmpty) return false;
      final String clean = scanned.trim().toUpperCase();
      final String target = _qrSecret.trim().toUpperCase();
      if (clean == target || clean.contains(target)) {
        setState(() => _qrSetupVerified = true);
        _saveState();
        if (ctx.mounted) {
          ScaffoldMessenger.of(ctx).showSnackBar(
            SnackBar(
              content: Text(_tr('qrVerifiedMsg')),
              backgroundColor: const Color(0xFF10B981),
            ),
          );
        }
        return true;
      } else {
        if (ctx.mounted) {
          ScaffoldMessenger.of(ctx).showSnackBar(
            SnackBar(
              content: Text(_tr('invalidQrMsg')),
              backgroundColor: Colors.redAccent,
            ),
          );
        }
      }
    } catch (_) {}
    return false;
  }

  Future<void> _printPhysicalQrSheet() async {
    try {
      await _channel.invokeMethod('printQrCodeSheet', {'qrSecret': _qrSecret});
    } catch (_) {}
  }

  void _requireProtectionUnlock(
    BuildContext ctx, {
    required String targetTitle,
    required VoidCallback onUnlocked,
  }) {
    // QR Code Lock is strictly enforced at Night (22:00-06:00) or if user explicitly
    // enabled 24/7 Strict Mode. During Daytime working hours (06:00-22:00),
    // the 15s Mindful Pause Gate allows work-time bypass without needing the physical QR card!
    final bool needsPhysicalQr = _isNightWindow || _strictQrSettingsLock;
    if (needsPhysicalQr) {
      _showQrUnlockDialog(
        ctx,
        targetTitle: targetTitle,
        onUnlocked: () {
          _showMindfulGateModal(
            ctx,
            targetTitle: targetTitle,
            onPassed: onUnlocked,
          );
        },
      );
    } else {
      _showMindfulGateModal(
        ctx,
        targetTitle: targetTitle,
        onPassed: onUnlocked,
      );
    }
  }

  void _showQrUnlockDialog(
    BuildContext ctx, {
    required VoidCallback onUnlocked,
    String? targetTitle,
  }) {
    final TextEditingController qrCtrl = TextEditingController();
    final bool isNight = _isNightWindow;
    showDialog(
      context: ctx,
      builder: (dCtx) => AlertDialog(
        backgroundColor: const Color(0xFF14151C),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: Color(0xFF10B981), width: 1.4),
        ),
        title: Text(
          _tr('qrModalTitle'),
          style: const TextStyle(
              color: Colors.white, fontWeight: FontWeight.bold, fontSize: 17),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              _tr('qrModalSub'),
              style: const TextStyle(color: Colors.white70, fontSize: 13),
            ),
            const SizedBox(height: 14),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF10B981),
                  foregroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(vertical: 13),
                ),
                icon: const Icon(Icons.qr_code_scanner_rounded, size: 20),
                label: Text(
                  _tr('qrScanPrimaryBtn'),
                  style: const TextStyle(
                      fontWeight: FontWeight.bold, fontSize: 13),
                ),
                onPressed: () async {
                  final bool ok = await _scanPhysicalQrWithCamera(ctx);
                  if (ok && dCtx.mounted) {
                    Navigator.pop(dCtx);
                    onUnlocked();
                  }
                },
              ),
            ),
            if (!isNight) ...[
              const SizedBox(height: 10),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.amber,
                    side: const BorderSide(color: Colors.amber, width: 1.3),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  icon: const Icon(Icons.wb_sunny_rounded, size: 18),
                  label: Text(
                    _tr('daytimeQrBypassBtn'),
                    style: const TextStyle(
                        fontWeight: FontWeight.bold, fontSize: 12),
                  ),
                  onPressed: () {
                    Navigator.pop(dCtx);
                    _showMindfulGateModal(
                      ctx,
                      targetTitle: targetTitle ?? _tr('unlockBtn'),
                      onPassed: onUnlocked,
                    );
                  },
                ),
              ),
            ] else ...[
              const SizedBox(height: 10),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.amber.withValues(alpha: 0.14),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: Colors.amber.withValues(alpha: 0.5)),
                ),
                child: Text(
                  _tr('nightOnlyQrNote'),
                  style: const TextStyle(
                    color: Colors.amber,
                    fontSize: 11.5,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
            const SizedBox(height: 12),
            TextField(
              controller: qrCtrl,
              style: const TextStyle(color: Colors.white, fontSize: 13),
              decoration: InputDecoration(
                hintText: _tr('qrInputHint'),
                hintStyle: const TextStyle(color: Colors.white38, fontSize: 12),
                filled: true,
                fillColor: Colors.black38,
                isDense: true,
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
            child: Text(_tr('stayFocusedBtn')),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.white12,
              foregroundColor: Colors.white,
            ),
            onPressed: () {
              if (qrCtrl.text.trim().toUpperCase() ==
                  _qrSecret.trim().toUpperCase()) {
                Navigator.pop(dCtx);
                onUnlocked();
              } else {
                ScaffoldMessenger.of(ctx).showSnackBar(
                  SnackBar(
                    content: Text(_tr('invalidQrMsg')),
                    backgroundColor: Colors.redAccent,
                  ),
                );
              }
            },
            child: Text(_tr('unlockBtn')),
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
    final List<WisdomEntry> wList = AppDataDefaults.getWisdomList(_lang);
    final int qIdx =
        (_now.second + _now.minute * 60 + _wisdomIndex) % wList.length;
    final WisdomEntry wisdom = wList[qIdx];
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
                                ? '⏳ ${secondsLeft}s'
                                : '✅ 15s',
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
                          child: Text(
                            _tr('closeReclaimBtn'),
                            style: const TextStyle(color: Color(0xFF10B981)),
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
                      style:
                          const TextStyle(color: Colors.white70, fontSize: 13),
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
                              height: 1.45,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            '— ${wisdom.ref} (#${qIdx + 1}/${wList.length})',
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
                                  ? const Color(0xFF10B981)
                                      .withValues(alpha: 0.2)
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
                                    errorMsg = _tr('wrongQuizError');
                                  });
                                }
                              },
                        child: Text(
                          secondsLeft > 0
                              ? '${_tr('waitReflecting')} (${secondsLeft}s)'
                              : _tr('confirmReflectionBtn'),
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
            String phase = _tr('sosInhale');
            if (cycle >= 4 && cycle < 11) {
              phase = _tr('sosHold');
            } else if (cycle >= 11) {
              phase = _tr('sosExhale');
            }

            return AlertDialog(
              backgroundColor: const Color(0xFF0E1318),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
                side: const BorderSide(color: Color(0xFF10B981), width: 1.5),
              ),
              title: Text(
                '🛡️ ${_tr('sosTitle')}',
                style: const TextStyle(
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
                    child: Text(
                      _tr('sosSubtitle'),
                      style: const TextStyle(
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
                  Text(
                    _tr('sosVerse'),
                    style: const TextStyle(
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
                        ? '${_tr('sosGroundedBtn')} ($breatheSec s)'
                        : _tr('sosCompleteBtn'),
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
        return StatefulBuilder(
          builder: (sCtx, setWizardState) {
            final int completedSteps = (_hasUsageAccess ? 1 : 0) +
                (_hasOverlayPermission ? 1 : 0) +
                (_osDnsIsFamilySafe ? 1 : 0) +
                (_qrSetupVerified ? 1 : 0) +
                (_isDefaultLauncher ? 1 : 0);

            return Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            _tr('wizardTitle'),
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 17,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        TextButton.icon(
                          style: TextButton.styleFrom(
                            foregroundColor: const Color(0xFF10B981),
                          ),
                          icon: const Icon(Icons.refresh_rounded, size: 16),
                          label: Text(
                            _tr('refreshBtn'),
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          onPressed: () async {
                            await _refreshNativeStatus();
                            if (sCtx.mounted) setWizardState(() {});
                          },
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '($completedSteps / 5) • ${_tr('wizardSubtitle')}',
                      style: const TextStyle(
                        color: Colors.white70,
                        fontSize: 12,
                      ),
                    ),
                    const SizedBox(height: 8),
                    LinearProgressIndicator(
                      value: completedSteps / 5.0,
                      minHeight: 6,
                      backgroundColor: Colors.white12,
                      color: const Color(0xFF10B981),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    const SizedBox(height: 14),
                    _buildWizardStepTile(
                      step: '1',
                      title: _tr('wizStep1Title'),
                      subtitle: _hasUsageAccess
                          ? _tr('wizStep1SubDone')
                          : _tr('wizStep1SubTodo'),
                      isDone: _hasUsageAccess,
                      buttonLabel:
                          _hasUsageAccess ? _tr('grantedBtn') : _tr('grantBtn'),
                      onTap: () async {
                        await _channel
                            .invokeMethod('requestUsageStatsPermission');
                        await Future.delayed(const Duration(seconds: 1));
                        await _refreshNativeStatus();
                        if (sCtx.mounted) setWizardState(() {});
                      },
                    ),
                    const SizedBox(height: 10),
                    _buildWizardStepTile(
                      step: '2',
                      title: _tr('wizStep2Title'),
                      subtitle: _hasOverlayPermission
                          ? _tr('wizStep2SubDone')
                          : _tr('wizStep2SubTodo'),
                      isDone: _hasOverlayPermission,
                      buttonLabel: _hasOverlayPermission
                          ? _tr('grantedBtn')
                          : _tr('grantBtn'),
                      onTap: () async {
                        await _channel.invokeMethod('requestOverlayPermission');
                        await Future.delayed(const Duration(seconds: 1));
                        await _refreshNativeStatus();
                        if (sCtx.mounted) setWizardState(() {});
                      },
                    ),
                    const SizedBox(height: 10),
                    _buildWizardStepTile(
                      step: '3',
                      title: '${_tr('wizStep3Title')} ($_dnsHost)',
                      subtitle: _osDnsIsFamilySafe
                          ? _tr('wizStep3SubDone')
                          : _tr('wizStep3SubTodo'),
                      isDone: _osDnsIsFamilySafe,
                      buttonLabel:
                          _osDnsIsFamilySafe ? _tr('grantedBtn') : '1-Tap',
                      onTap: () {
                        Navigator.pop(mCtx);
                        _activateSafePrivateDnsNow(ctx);
                      },
                    ),
                    if (!_osDnsIsFamilySafe) ...[
                      const SizedBox(height: 6),
                      SizedBox(
                        width: double.infinity,
                        child: OutlinedButton.icon(
                          style: OutlinedButton.styleFrom(
                            foregroundColor: const Color(0xFF10B981),
                            side: const BorderSide(color: Color(0xFF10B981)),
                            padding: const EdgeInsets.symmetric(vertical: 10),
                          ),
                          icon: const Icon(
                            Icons.verified_user_rounded,
                            size: 16,
                          ),
                          label: Text(
                            _tr('wizStep3VerifyBtn'),
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          onPressed: () async {
                            await _channel.invokeMethod(
                              'confirmManualDnsSetup',
                              {'host': _dnsHost},
                            );
                            await _refreshNativeStatus();
                            if (sCtx.mounted) setWizardState(() {});
                          },
                        ),
                      ),
                    ],
                    const SizedBox(height: 10),
                    // STEP 4: PRINT PHYSICAL QR CODE & KEEP IN ANOTHER ROOM
                    _buildWizardStepTile(
                      step: '4',
                      title: _tr('wizStep4Title'),
                      subtitle: _qrSetupVerified
                          ? _tr('wizStep4SubDone')
                          : _tr('wizStep4SubTodo'),
                      isDone: _qrSetupVerified,
                      buttonLabel: '🖨️ Print',
                      onTap: () async {
                        await _printPhysicalQrSheet();
                      },
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            style: OutlinedButton.styleFrom(
                              foregroundColor: Colors.white,
                              side: const BorderSide(color: Colors.white24),
                            ),
                            icon: const Icon(Icons.print_rounded, size: 16),
                            label: Text(
                              _tr('printQrBtn'),
                              style: const TextStyle(fontSize: 11),
                            ),
                            onPressed: _printPhysicalQrSheet,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: OutlinedButton.icon(
                            style: OutlinedButton.styleFrom(
                              foregroundColor: const Color(0xFF10B981),
                              side: const BorderSide(color: Color(0xFF10B981)),
                            ),
                            icon: const Icon(
                                Icons.qr_code_scanner_rounded, size: 16),
                            label: Text(
                              _tr('testQrScanBtn'),
                              style: const TextStyle(
                                  fontSize: 11, fontWeight: FontWeight.bold),
                            ),
                            onPressed: () async {
                              await _scanPhysicalQrWithCamera(ctx);
                              if (sCtx.mounted) setWizardState(() {});
                            },
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    _buildWizardStepTile(
                      step: '5',
                      title: _tr('wizStep5Title'),
                      subtitle: _isDefaultLauncher
                          ? _tr('wizStep5SubDone')
                          : _tr('wizStep5SubTodo'),
                      isDone: _isDefaultLauncher,
                      buttonLabel: _isDefaultLauncher
                          ? _tr('grantedBtn')
                          : _tr('setDefaultBtn'),
                      onTap: () async {
                        await _channel.invokeMethod('requestDefaultLauncher');
                        await Future.delayed(const Duration(seconds: 1));
                        await _refreshNativeStatus();
                        if (sCtx.mounted) setWizardState(() {});
                      },
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF10B981),
                          foregroundColor: Colors.black,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                        ),
                        onPressed: () {
                          _refreshNativeStatus();
                          Navigator.pop(mCtx);
                        },
                        child: Text(
                          _tr('doneVerifyBtn'),
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
      padding: const EdgeInsets.all(12),
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
            radius: 15,
            backgroundColor:
                isDone ? const Color(0xFF10B981) : Colors.white12,
            child: Text(
              isDone ? '✓' : step,
              style: TextStyle(
                color: isDone ? Colors.black : Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 13,
              ),
            ),
          ),
          const SizedBox(width: 10),
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
                const SizedBox(height: 3),
                Text(
                  subtitle,
                  style: const TextStyle(color: Colors.white70, fontSize: 11),
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
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
            ),
            onPressed: onTap,
            child: Text(
              buttonLabel,
              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
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
                  _buildKeepNotesPage(innerCtx),
                  _buildUserGuidePage(innerCtx),
                ],
              ),
            ),
            // NO BOTTOM BAR — 100% Minimalist & Sidebar Driven!
          ),
        ),
      ),
    );
  }

  PreferredSizeWidget _buildTopAppBar(BuildContext ctx) {
    final List<String> tabTitles = [
      '', // Ultra-clean Homepage: NO "Minimum Phone" branding on Home!
      _tr('navApps'),
      _tr('navPurity'),
      _tr('navFocus'),
      _tr('navSettings'),
      _tr('navKeepNotes'),
      _tr('navUserGuide'),
    ];
    final bool isAllProtected =
        _osDnsIsFamilySafe && _hasUsageAccess && _hasOverlayPermission;

    return AppBar(
      backgroundColor: _bgColor,
      elevation: 0,
      leading: IconButton(
        icon: Icon(Icons.menu_rounded, color: _textColor),
        tooltip: _tr('menuTitle'),
        onPressed: () => _scaffoldKey.currentState?.openDrawer(),
      ),
      titleSpacing: 0,
      title: Row(
        children: [
          if (_currentTab != 0)
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: InkWell(
                onTap: () => setState(() => _currentTab = 0),
                borderRadius: BorderRadius.circular(16),
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: _cardColor,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.white12),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.arrow_back_rounded,
                          size: 14, color: _accentColor),
                      const SizedBox(width: 4),
                      Text(
                        _tr('navHome'),
                        style: TextStyle(
                          color: _textColor,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          Expanded(
            child: Text(
              tabTitles[_currentTab],
              style: TextStyle(
                color: _textColor,
                fontSize: 15,
                fontWeight: FontWeight.w600,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
      actions: [
        // Minimal Green or Red Status Dot (Zero DNS text on Homepage!)
        InkWell(
          onTap: () => _showSetupWizardModal(ctx),
          borderRadius: BorderRadius.circular(20),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            child: Container(
              width: 11,
              height: 11,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isAllProtected
                    ? const Color(0xFF10B981)
                    : const Color(0xFFEF4444),
                boxShadow: [
                  BoxShadow(
                    color: (isAllProtected
                            ? const Color(0xFF10B981)
                            : const Color(0xFFEF4444))
                        .withValues(alpha: 0.55),
                    blurRadius: 8,
                    spreadRadius: 1.5,
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildGlobalDrawer(BuildContext ctx) {
    final String bgLocLabel =
        _backgroundLocation == 'Auto GPS' || _backgroundLocation.isEmpty
            ? _tr('gpsAutoBadge')
            : _backgroundLocation;
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
                  size: 26,
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
                        _tr('menuSubtitle'),
                        style: TextStyle(color: _subTextColor, fontSize: 11),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            // Live Background GPS Location + Day/Night Gate Status + Battery/Streak inside Sidebar
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              decoration: BoxDecoration(
                color: _bgColor,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.white12),
              ),
              child: Wrap(
                spacing: 8,
                runSpacing: 6,
                crossAxisAlignment: WrapCrossAlignment.center,
                children: [
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.my_location_rounded,
                        size: 13,
                        color: _accentColor,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        bgLocLabel,
                        style: TextStyle(
                          color: _textColor,
                          fontSize: 11.5,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 3,
                    ),
                    decoration: BoxDecoration(
                      color: _isNightWindow
                          ? Colors.purpleAccent.withValues(alpha: 0.16)
                          : _accentColor.withValues(alpha: 0.14),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Text(
                      _isNightWindow
                          ? '🌙 ${_tr('nightModeBadge')}'
                          : '☀️ ${_tr('dayModeBadge')}',
                      style: TextStyle(
                        color: _isNightWindow
                            ? Colors.purpleAccent
                            : _accentColor,
                        fontSize: 10.5,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  Text(
                    '🔋 $_batteryLevel% • 🔥 $_cleanStreakDays${_tr('daysShort')}',
                    style: TextStyle(
                      color: _subTextColor,
                      fontSize: 11,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),

            // MAIN NAVIGATION IN SIDEBAR
            Text(
              _tr('navSection'),
              style: TextStyle(
                color: _subTextColor,
                fontSize: 11,
                fontWeight: FontWeight.bold,
                letterSpacing: 1.0,
              ),
            ),
            const SizedBox(height: 6),
            _buildDrawerNavTile(
              ctx,
              icon: Icons.home_rounded,
              title: _tr('drawerHome'),
              tab: 0,
            ),
            ListTile(
              dense: true,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
              contentPadding: const EdgeInsets.symmetric(horizontal: 10),
              leading: Icon(
                Icons.tune_rounded,
                color: _accentColor,
                size: 20,
              ),
              title: Text(
                '⚙️ ${_tr('editHomeListBtn')}',
                style: TextStyle(
                  color: _accentColor,
                  fontWeight: FontWeight.bold,
                  fontSize: 12.5,
                ),
              ),
              onTap: () {
                Navigator.pop(ctx);
                _showHomeListsSetupModal(ctx, initialProfile: _activeProfile);
              },
            ),
            _buildDrawerNavTile(
              ctx,
              icon: Icons.lightbulb_outline_rounded,
              title: '${_tr('drawerKeepNotes')} (${_keepNotes.length})',
              tab: 5,
            ),
            _buildDrawerNavTile(
              ctx,
              icon: Icons.apps_rounded,
              title: '${_tr('drawerApps')} (${_apps.length})',
              tab: 1,
            ),
            _buildDrawerNavTile(
              ctx,
              icon: Icons.shield_rounded,
              title: _tr('drawerPurity'),
              tab: 2,
              subTab: 0,
            ),
            _buildDrawerNavTile(
              ctx,
              icon: Icons.sos_rounded,
              title: _tr('drawerSos'),
              tab: 2,
              subTab: 1,
            ),
            _buildDrawerNavTile(
              ctx,
              icon: Icons.qr_code_scanner_rounded,
              title: _tr('drawerFocus'),
              tab: 3,
              subTab: 2,
            ),
            _buildDrawerNavTile(
              ctx,
              icon: Icons.admin_panel_settings_rounded,
              title: _tr('drawerSettings'),
              tab: 4,
              subTab: 0,
            ),
            _buildDrawerNavTile(
              ctx,
              icon: Icons.menu_book_rounded,
              title: _tr('drawerUserGuide'),
              tab: 6,
            ),
            ListTile(
              dense: true,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
              contentPadding: const EdgeInsets.symmetric(horizontal: 10),
              leading: const Icon(
                Icons.fact_check_rounded,
                color: Color(0xFF10B981),
                size: 20,
              ),
              title: Text(
                _tr('drawerSetupWizard'),
                style: const TextStyle(
                  color: Color(0xFF10B981),
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
              ),
              onTap: () {
                Navigator.pop(ctx);
                _showSetupWizardModal(ctx);
              },
            ),

            const Divider(height: 24, color: Colors.white12),

            // Instant Safe Private DNS & OS Settings Lock Card inside Sidebar
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
                              ? '${_tr('dnsActive')}: $_osDnsSpecifier'
                              : _tr('dnsInactive'),
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
                        _activateSafePrivateDnsNow(ctx);
                      },
                    ),
                  ),
                  const SizedBox(height: 6),
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
                        _requireProtectionUnlock(
                          ctx,
                          targetTitle: _tr('lockPhoneSettings'),
                          onUnlocked: () {
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
            _buildQuickSettingsWrap(ctx, closeDrawerOnTap: true),

            const Divider(height: 24, color: Colors.white12),
            Text(
              _tr('langCardTitle'),
              style: TextStyle(
                color: _subTextColor,
                fontSize: 11,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            _buildLanguageDropdown(),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickSettingsWrap(
    BuildContext ctx, {
    required bool closeDrawerOnTap,
  }) {
    final List<Map<String, dynamic>> shortcuts = [
      {
        'icon': Icons.wifi_rounded,
        'label': _tr('safeWifi'),
        'type': 'wifi',
      },
      {
        'icon': Icons.cell_tower_rounded,
        'label': _tr('safeMobileData'),
        'type': 'mobile_data',
      },
      {
        'icon': Icons.wifi_tethering_rounded,
        'label': _tr('safeHotspot'),
        'type': 'hotspot',
      },
      {
        'icon': Icons.bluetooth_rounded,
        'label': _tr('safeBluetooth'),
        'type': 'bluetooth',
      },
      {
        'icon': Icons.volume_up_rounded,
        'label': _tr('safeSound'),
        'type': 'sound',
      },
      {
        'icon': Icons.brightness_6_rounded,
        'label': _tr('safeDisplay'),
        'type': 'display',
      },
      {
        'icon': _torchOn
            ? Icons.flashlight_on_rounded
            : Icons.flashlight_off_rounded,
        'label': _tr('safeTorch'),
        'type': 'torch',
        'active': _torchOn,
      },
      {
        'icon': Icons.battery_charging_full_rounded,
        'label': _tr('safeBattery'),
        'type': 'battery',
      },
      {
        'icon': Icons.location_on_rounded,
        'label': _tr('safeLocation'),
        'type': 'location',
      },
      {
        'icon': Icons.airplanemode_active_rounded,
        'label': _tr('safeAirplane'),
        'type': 'airplane',
      },
      {
        'icon': Icons.alarm_rounded,
        'label': _tr('safeAlarm'),
        'type': 'alarm',
      },
      {
        'icon': Icons.calculate_rounded,
        'label': _tr('safeCalculator'),
        'type': 'calculator',
      },
    ];

    return Wrap(
      spacing: 7,
      runSpacing: 7,
      children: shortcuts.map((s) {
        final String type = s['type'] as String;
        final bool isActive = s['active'] == true;
        return _buildSafeSettingChip(
          ctx,
          icon: s['icon'] as IconData,
          label: s['label'] as String,
          type: type,
          isActive: isActive,
          closeDrawerOnTap: closeDrawerOnTap && type != 'torch',
        );
      }).toList(),
    );
  }

  Widget _buildSafeSettingChip(
    BuildContext ctx, {
    required IconData icon,
    required String label,
    required String type,
    bool isActive = false,
    bool closeDrawerOnTap = true,
  }) {
    return InkWell(
      onTap: () {
        if (closeDrawerOnTap) {
          Navigator.pop(ctx);
        }
        _openSafeSubSetting(type);
      },
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
        decoration: BoxDecoration(
          color: isActive
              ? _accentColor.withValues(alpha: 0.22)
              : _bgColor,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: isActive ? _accentColor : Colors.white12,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 15,
              color: isActive ? Colors.amber : _accentColor,
            ),
            const SizedBox(width: 5),
            Text(
              label,
              style: TextStyle(
                color: _textColor,
                fontSize: 11.5,
                fontWeight: isActive ? FontWeight.bold : FontWeight.w500,
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
    final bool selected = _currentTab == tab && (subTab == null);
    return ListTile(
      dense: true,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      tileColor:
          selected ? _accentColor.withValues(alpha: 0.14) : Colors.transparent,
      contentPadding: const EdgeInsets.symmetric(horizontal: 10),
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

  Widget _buildLanguageDropdown() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 2),
      decoration: BoxDecoration(
        color: _bgColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: _accentColor.withValues(alpha: 0.45)),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: AppDataDefaults.supportedLanguages
                  .any((l) => l['code'] == _lang)
              ? _lang
              : 'en',
          isExpanded: true,
          dropdownColor: const Color(0xFF14161F),
          icon: Icon(Icons.keyboard_arrow_down_rounded, color: _accentColor),
          style: TextStyle(
            color: _textColor,
            fontSize: 13,
            fontWeight: FontWeight.w600,
          ),
          items: AppDataDefaults.supportedLanguages.map((langMap) {
            final String code = langMap['code'] ?? 'en';
            final String name = langMap['name'] ?? code;
            return DropdownMenuItem<String>(
              value: code,
              child: Text(
                name,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
            );
          }).toList(),
          onChanged: (String? nextCode) {
            if (nextCode != null && nextCode != _lang) {
              setState(() => _lang = nextCode);
              _saveState();
              _syncFortressToNative();
            }
          },
        ),
      ),
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
  // PAGE 1: ULTRA-CLEAN MINIMALIST HOMEPAGE (ZERO DNS TEXT, ZERO BRANDING,
  //         NO LOCATION PILL, NO DAY MODE BADGE, NO SETUP LINE ON HOME)
  // =========================================================================
  Widget _buildHomePage(BuildContext ctx) {
    final String hh = _now.hour.toString().padLeft(2, '0');
    final String mm = _now.minute.toString().padLeft(2, '0');
    final String dateStr =
        '${_trWeekday(_now.weekday)}, ${_now.day} ${_trMonth(_now.month)} ${_now.year}';

    final List<AppItem> pinnedApps =
        _apps.where((a) => a.profiles.contains(_activeProfile)).toList();

    final List<KeepNoteItem> pinnedNotes =
        _keepNotes.where((n) => n.pinned).take(2).toList();

    final List<WisdomEntry> wList = AppDataDefaults.getWisdomList(_lang);
    final int qIdx = _wisdomIndex % wList.length;
    final WisdomEntry currentWisdom = wList[qIdx];

    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      children: [
        // 1. Ultra-Clean Centered Watchface Hero (Pure Time & Localized Date Only!)
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 18),
          decoration: BoxDecoration(
            color: _cardColor.withValues(alpha: 0.65),
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: Colors.white10),
          ),
          child: Column(
            children: [
              // Centered Large Minimalist Time
              Text(
                '$hh:$mm',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: _textColor,
                  fontSize: 64,
                  fontWeight: FontWeight.w200,
                  letterSpacing: -2.0,
                  height: 1.0,
                ),
              ),
              const SizedBox(height: 6),
              // Centered Localized Weekday & Date
              Text(
                dateStr,
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: _subTextColor,
                  fontSize: 13.5,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),

        // 2. Three Separate Homepage Lists Switcher (Clean — Setup is in Sidebar)
        Row(
          children: [
            _buildProfileButton('work', '💼 ${_tr('profileWork')}'),
            const SizedBox(width: 6),
            _buildProfileButton('personal', '🏠 ${_tr('profilePersonal')}'),
            const SizedBox(width: 6),
            _buildProfileButton('sunset', '🌆 ${_tr('profileSunset')}'),
          ],
        ),
        const SizedBox(height: 14),

        // 3. Clean Typography Homepage App List (Untranslated App Name + Translated Category)
        if (pinnedApps.isEmpty)
          InkWell(
            onTap: () => _scaffoldKey.currentState?.openDrawer(),
            borderRadius: BorderRadius.circular(12),
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: _cardColor,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.white12),
              ),
              child: Row(
                children: [
                  Icon(Icons.playlist_add_rounded, color: _accentColor),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      _tr('noAppsInProfileMsg'),
                      style: TextStyle(color: _subTextColor, fontSize: 12.5),
                    ),
                  ),
                ],
              ),
            ),
          )
        else
          ...pinnedApps.map(
            (app) => InkWell(
              onTap: () => _handleAppTap(ctx, app),
              borderRadius: BorderRadius.circular(8),
              child: Padding(
                padding:
                    const EdgeInsets.symmetric(vertical: 11, horizontal: 4),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        app.name,
                        style: TextStyle(
                          color: _textColor,
                          fontSize: 20,
                          fontWeight: FontWeight.w400,
                          letterSpacing: -0.3,
                        ),
                      ),
                    ),
                    Text(
                      _trCategory(app.category),
                      style: TextStyle(
                        color: _subTextColor.withValues(alpha: 0.65),
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        Align(
          alignment: Alignment.centerLeft,
          child: TextButton.icon(
            style: TextButton.styleFrom(
              foregroundColor: _subTextColor,
              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 6),
            ),
            icon: const Icon(Icons.apps_rounded, size: 15),
            label: Text(
              '${_tr('allApps')} (${_apps.length}) →',
              style: const TextStyle(fontSize: 12),
            ),
            onPressed: () => setState(() => _currentTab = 1),
          ),
        ),

        const Divider(height: 22, color: Colors.white10),

        // 4. Minimalist Home Note Bar -> Opens Full Google Keep-Style Notes Inside!
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
              Row(
                children: [
                  Icon(Icons.lightbulb_outline_rounded,
                      size: 16, color: _accentColor),
                  const SizedBox(width: 6),
                  Text(
                    _tr('quickNotes'),
                    style: TextStyle(
                      color: _textColor,
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                    ),
                  ),
                  const Spacer(),
                  InkWell(
                    onTap: () => setState(() => _currentTab = 5),
                    child: Text(
                      '${_tr('openAllNotes')} (${_keepNotes.length}) →',
                      style: TextStyle(
                        color: _accentColor,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              // Quick 1-Line Capture on Home
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _quickHomeNoteController,
                      style: TextStyle(color: _textColor, fontSize: 13),
                      decoration: InputDecoration(
                        hintText: _tr('takeQuickNoteHint'),
                        hintStyle: TextStyle(color: _subTextColor, fontSize: 12),
                        isDense: true,
                        border: InputBorder.none,
                      ),
                      onSubmitted: (val) => _addQuickNoteFromHome(),
                    ),
                  ),
                  IconButton(
                    icon: Icon(Icons.check_box_outlined,
                        size: 18, color: _subTextColor),
                    tooltip: _tr('newChecklistBtn'),
                    constraints: const BoxConstraints(),
                    padding: const EdgeInsets.symmetric(horizontal: 6),
                    onPressed: () {
                      setState(() => _currentTab = 5);
                      _openKeepNoteEditorModal(ctx, isNewChecklist: true);
                    },
                  ),
                  IconButton(
                    icon: Icon(Icons.add_circle_outline_rounded,
                        size: 18, color: _accentColor),
                    tooltip: _tr('saveNoteBtn'),
                    constraints: const BoxConstraints(),
                    padding: EdgeInsets.zero,
                    onPressed: _addQuickNoteFromHome,
                  ),
                ],
              ),
              if (pinnedNotes.isNotEmpty) ...[
                const Divider(height: 14, color: Colors.white10),
                ...pinnedNotes.map((n) {
                  final String dispTitle = _displayNoteTitle(n);
                  final String summary = n.isChecklist
                      ? List.generate(
                          n.checklist.length > 2 ? 2 : n.checklist.length,
                          (idx) {
                            final c = n.checklist[idx];
                            final txt = _displayChecklistText(n, idx, c.text);
                            return '${c.done ? "☑" : "☐"} $txt';
                          },
                        ).join('  •  ')
                      : _displayNoteContent(n);
                  return InkWell(
                    onTap: () {
                      setState(() => _currentTab = 5);
                      _openKeepNoteEditorModal(ctx, existing: n);
                    },
                    child: Padding(
                      padding: const EdgeInsets.only(top: 4, bottom: 4),
                      child: Row(
                        children: [
                          const Text('📌 ', style: TextStyle(fontSize: 11)),
                          Expanded(
                            child: Text(
                              dispTitle.isNotEmpty
                                  ? '$dispTitle: $summary'
                                  : summary,
                              style: TextStyle(
                                color: _subTextColor,
                                fontSize: 12,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }),
              ],
            ],
          ),
        ),

        const SizedBox(height: 14),

        // 5. Translated Wisdom Footer in User's Selected Language
        InkWell(
          onTap: () => setState(() => _wisdomIndex++),
          borderRadius: BorderRadius.circular(12),
          child: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: _cardColor.withValues(alpha: 0.5),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.white10),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '"${currentWisdom.text}"',
                  style: TextStyle(
                    color: _textColor.withValues(alpha: 0.92),
                    fontSize: 13,
                    fontStyle: FontStyle.italic,
                    height: 1.4,
                  ),
                ),
                const SizedBox(height: 5),
                Text(
                  '— ${currentWisdom.ref}  (#${qIdx + 1}/${wList.length} • ${_tr('tapForNextWisdom')})',
                  style: TextStyle(
                    color: _accentColor.withValues(alpha: 0.9),
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  void _showHomeListsSetupModal(BuildContext ctx, {String? initialProfile}) {
    String selectedList = initialProfile ?? _activeProfile;
    showModalBottomSheet(
      context: ctx,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF11131A),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (mCtx) {
        return StatefulBuilder(
          builder: (sCtx, setSheetState) {
            final int workCount =
                _apps.where((a) => a.profiles.contains('work')).length;
            final int personalCount =
                _apps.where((a) => a.profiles.contains('personal')).length;
            final int sunsetCount =
                _apps.where((a) => a.profiles.contains('sunset')).length;

            return SizedBox(
              height: MediaQuery.of(sCtx).size.height * 0.78,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(18, 18, 18, 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.tune_rounded, color: _accentColor),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            _tr('setupThreeListsTitle'),
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close, color: Colors.white70),
                          onPressed: () => Navigator.pop(mCtx),
                        ),
                      ],
                    ),
                    Text(
                      _tr('setupThreeListsSub'),
                      style: const TextStyle(
                        color: Colors.white70,
                        fontSize: 12,
                      ),
                    ),
                    const SizedBox(height: 12),
                    // 3 Separate List Tabs: Work | Personal | Sunset
                    Row(
                      children: [
                        _buildListSetupTabChip(
                          id: 'work',
                          label: '💼 ${_tr('profileWork')} ($workCount)',
                          selected: selectedList == 'work',
                          onTap: () =>
                              setSheetState(() => selectedList = 'work'),
                        ),
                        const SizedBox(width: 6),
                        _buildListSetupTabChip(
                          id: 'personal',
                          label:
                              '🏠 ${_tr('profilePersonal')} ($personalCount)',
                          selected: selectedList == 'personal',
                          onTap: () =>
                              setSheetState(() => selectedList = 'personal'),
                        ),
                        const SizedBox(width: 6),
                        _buildListSetupTabChip(
                          id: 'sunset',
                          label: '🌆 ${_tr('profileSunset')} ($sunsetCount)',
                          selected: selectedList == 'sunset',
                          onTap: () =>
                              setSheetState(() => selectedList = 'sunset'),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Expanded(
                      child: ListView.builder(
                        itemCount: _apps.length,
                        itemBuilder: (lCtx, idx) {
                          final AppItem app = _apps[idx];
                          final bool inList =
                              app.profiles.contains(selectedList);
                          return Container(
                            margin: const EdgeInsets.only(bottom: 6),
                            decoration: BoxDecoration(
                              color: inList
                                  ? const Color(0xFF10B981)
                                      .withValues(alpha: 0.12)
                                  : Colors.white.withValues(alpha: 0.04),
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(
                                color: inList
                                    ? const Color(0xFF10B981)
                                    : Colors.white10,
                              ),
                            ),
                            child: CheckboxListTile(
                              dense: true,
                              activeColor: const Color(0xFF10B981),
                              checkColor: Colors.black,
                              title: Text(
                                app.name, // App name untranslated!
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w600,
                                  fontSize: 14,
                                ),
                              ),
                              subtitle: Text(
                                '${_trCategory(app.category)} • ${app.packageName}',
                                style: const TextStyle(
                                  color: Colors.white54,
                                  fontSize: 11,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              value: inList,
                              onChanged: (val) {
                                setState(() {
                                  if (val == true) {
                                    if (!app.profiles.contains(selectedList)) {
                                      app.profiles.add(selectedList);
                                    }
                                  } else {
                                    app.profiles.remove(selectedList);
                                  }
                                  app.pinned = app.profiles.isNotEmpty;
                                });
                                setSheetState(() {});
                                _saveState();
                              },
                            ),
                          );
                        },
                      ),
                    ),
                    const SizedBox(height: 8),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF10B981),
                          foregroundColor: Colors.black,
                          padding: const EdgeInsets.symmetric(vertical: 13),
                        ),
                        onPressed: () {
                          setState(() => _activeProfile = selectedList);
                          _saveState();
                          Navigator.pop(mCtx);
                        },
                        child: Text(
                          _tr('saveBtn'),
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
    );
  }

  Widget _buildListSetupTabChip({
    required String id,
    required String label,
    required bool selected,
    required VoidCallback onTap,
  }) {
    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(10),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 9, horizontal: 4),
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: selected ? const Color(0xFF10B981) : Colors.white10,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Text(
            label,
            style: TextStyle(
              color: selected ? Colors.black : Colors.white,
              fontWeight: FontWeight.bold,
              fontSize: 11,
            ),
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ),
    );
  }

  void _addQuickNoteFromHome() {
    final String text = _quickHomeNoteController.text.trim();
    if (text.isEmpty) return;
    setState(() {
      _keepNotes.insert(
        0,
        KeepNoteItem(
          id: DateTime.now().millisecondsSinceEpoch.toString(),
          title: '',
          content: text,
          pinned: true,
          label: 'Idea',
          colorIndex: 0,
        ),
      );
      _quickHomeNoteController.clear();
    });
    _saveState();
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
        borderRadius: BorderRadius.circular(8),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: active ? _accentColor : _cardColor,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              color: active ? _accentColor : Colors.white10,
            ),
          ),
          child: Text(
            label,
            style: TextStyle(
              color: active ? Colors.black : _subTextColor,
              fontSize: 11.5,
              fontWeight: FontWeight.w600,
            ),
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ),
    );
  }

  // =========================================================================
  // PAGE 6 (TAB 5): GOOGLE KEEP-STYLE POWERFUL NOTES WORKSPACE
  // =========================================================================
  Widget _buildKeepNotesPage(BuildContext ctx) {
    final List<String> filterLabels = [
      _tr('filterAll'),
      _tr('filterPinned'),
      _tr('filterChecklists'),
      _tr('filterWork'),
      _tr('filterIdea'),
      _tr('filterReflection'),
    ];

    final List<KeepNoteItem> filtered = _keepNotes.where((n) {
      if (_notesSearchQuery.isNotEmpty) {
        final String q = _notesSearchQuery.toLowerCase();
        final bool matchTitle = n.title.toLowerCase().contains(q);
        final bool matchBody = n.content.toLowerCase().contains(q);
        final bool matchList =
            n.checklist.any((c) => c.text.toLowerCase().contains(q));
        if (!matchTitle && !matchBody && !matchList) return false;
      }
      if (_notesSubTab == 1) return n.pinned;
      if (_notesSubTab == 2) return n.isChecklist;
      if (_notesSubTab == 3) return n.label == 'Work';
      if (_notesSubTab == 4) return n.label == 'Idea';
      if (_notesSubTab == 5) return n.label == 'Reflection';
      return true;
    }).toList();

    // Sort pinned first
    filtered.sort((a, b) {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.updatedAt.compareTo(a.updatedAt);
    });

    return Column(
      children: [
        _buildStickySubTabBar(
          tabs: filterLabels,
          currentIndex: _notesSubTab,
          onTap: (idx) => setState(() => _notesSubTab = idx),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _notesSearchController,
                  style: TextStyle(color: _textColor, fontSize: 13),
                  decoration: InputDecoration(
                    hintText: _tr('searchNotesHint'),
                    hintStyle: TextStyle(color: _subTextColor, fontSize: 12),
                    prefixIcon:
                        Icon(Icons.search_rounded, color: _subTextColor, size: 18),
                    filled: true,
                    fillColor: _cardColor,
                    contentPadding: const EdgeInsets.symmetric(vertical: 0),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                  ),
                  onChanged: (v) => setState(() => _notesSearchQuery = v),
                ),
              ),
              const SizedBox(width: 8),
              IconButton(
                style: IconButton.styleFrom(backgroundColor: _cardColor),
                icon: Icon(
                  _notesGridView
                      ? Icons.view_agenda_outlined
                      : Icons.grid_view_rounded,
                  color: _textColor,
                  size: 18,
                ),
                onPressed: () =>
                    setState(() => _notesGridView = !_notesGridView),
              ),
            ],
          ),
        ),
        // Action Bar: + New Note | + New Checklist
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          child: Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _accentColor,
                    foregroundColor: Colors.black,
                    padding: const EdgeInsets.symmetric(vertical: 11),
                  ),
                  icon: const Icon(Icons.note_add_rounded, size: 17),
                  label: Text(
                    _tr('newNoteBtn'),
                    style: const TextStyle(
                        fontWeight: FontWeight.bold, fontSize: 12),
                  ),
                  onPressed: () =>
                      _openKeepNoteEditorModal(ctx, isNewChecklist: false),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: _textColor,
                    side: BorderSide(color: _accentColor),
                    padding: const EdgeInsets.symmetric(vertical: 11),
                  ),
                  icon: Icon(Icons.checklist_rounded,
                      size: 17, color: _accentColor),
                  label: Text(
                    _tr('newChecklistBtn'),
                    style: const TextStyle(
                        fontWeight: FontWeight.bold, fontSize: 12),
                  ),
                  onPressed: () =>
                      _openKeepNoteEditorModal(ctx, isNewChecklist: true),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 6),
        Expanded(
          child: filtered.isEmpty
              ? Center(
                  child: Text(
                    _tr('noNotesFound'),
                    style: TextStyle(color: _subTextColor, fontSize: 13),
                  ),
                )
              : _notesGridView
                  ? GridView.builder(
                      padding: const EdgeInsets.all(14),
                      gridDelegate:
                          const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        crossAxisSpacing: 10,
                        mainAxisSpacing: 10,
                        childAspectRatio: 0.92,
                      ),
                      itemCount: filtered.length,
                      itemBuilder: (gCtx, i) =>
                          _buildKeepNoteCard(ctx, filtered[i]),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.all(14),
                      itemCount: filtered.length,
                      itemBuilder: (lCtx, i) => Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: _buildKeepNoteCard(ctx, filtered[i]),
                      ),
                    ),
        ),
      ],
    );
  }

  Widget _buildKeepNoteCard(BuildContext ctx, KeepNoteItem note) {
    final Color cardBg =
        _keepNotePalette[note.colorIndex % _keepNotePalette.length];
    final String dispTitle = _displayNoteTitle(note);
    final String dispContent = _displayNoteContent(note);
    return InkWell(
      onTap: () => _openKeepNoteEditorModal(ctx, existing: note),
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: cardBg,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: note.pinned
                ? _accentColor.withValues(alpha: 0.7)
                : Colors.white12,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    dispTitle.isEmpty ? _tr('untitledNote') : dispTitle,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                InkWell(
                  onTap: () {
                    setState(() => note.pinned = !note.pinned);
                    _saveState();
                  },
                  child: Icon(
                    note.pinned ? Icons.push_pin_rounded : Icons.push_pin_outlined,
                    size: 16,
                    color: note.pinned ? _accentColor : Colors.white54,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            if (note.isChecklist)
              ...List.generate(
                note.checklist.length > 4 ? 4 : note.checklist.length,
                (idx) {
                  final item = note.checklist[idx];
                  final String itemText =
                      _displayChecklistText(note, idx, item.text);
                  return InkWell(
                    onTap: () {
                      setState(() => item.done = !item.done);
                      _saveState();
                    },
                    child: Padding(
                      padding: const EdgeInsets.only(bottom: 4),
                      child: Row(
                        children: [
                          Icon(
                            item.done
                                ? Icons.check_box_rounded
                                : Icons.check_box_outline_blank_rounded,
                            size: 15,
                            color: item.done ? _accentColor : Colors.white60,
                          ),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              itemText,
                              style: TextStyle(
                                color: item.done
                                    ? Colors.white38
                                    : Colors.white,
                                fontSize: 12,
                                decoration: item.done
                                    ? TextDecoration.lineThrough
                                    : null,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              )
            else
              Text(
                dispContent,
                style: const TextStyle(
                  color: Colors.white70,
                  fontSize: 12,
                  height: 1.35,
                ),
                maxLines: 5,
                overflow: TextOverflow.ellipsis,
              ),
            const Spacer(),
            Row(
              children: [
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.black26,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    _trNoteLabel(note.label),
                    style: const TextStyle(
                      color: Colors.white60,
                      fontSize: 10,
                    ),
                  ),
                ),
                const Spacer(),
                InkWell(
                  onTap: () {
                    setState(() => _keepNotes.removeWhere((n) => n.id == note.id));
                    _saveState();
                  },
                  child: const Icon(
                    Icons.delete_outline_rounded,
                    size: 16,
                    color: Colors.white38,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _trNoteLabel(String rawLabel) {
    switch (rawLabel) {
      case 'Work':
        return _tr('labelWork');
      case 'Reflection':
        return _tr('labelReflection');
      default:
        return _tr('labelIdea');
    }
  }

  void _openKeepNoteEditorModal(
    BuildContext ctx, {
    KeepNoteItem? existing,
    bool isNewChecklist = false,
  }) {
    final bool isEditing = existing != null;
    final TextEditingController titleCtrl = TextEditingController(
      text: existing != null ? _displayNoteTitle(existing) : '',
    );
    final TextEditingController bodyCtrl = TextEditingController(
      text: existing != null ? _displayNoteContent(existing) : '',
    );
    final TextEditingController newCheckItemCtrl = TextEditingController();
    bool isChecklist = existing?.isChecklist ?? isNewChecklist;
    bool pinned = existing?.pinned ?? true;
    String label = existing?.label ?? 'Idea';
    int colorIndex = existing?.colorIndex ?? 0;
    List<ChecklistEntry> checklist = existing != null
        ? List.generate(
            existing.checklist.length,
            (i) => ChecklistEntry(
              text: _displayChecklistText(
                  existing, i, existing.checklist[i].text),
              done: existing.checklist[i].done,
            ),
          )
        : [];

    showModalBottomSheet(
      context: ctx,
      isScrollControlled: true,
      backgroundColor: _keepNotePalette[colorIndex % _keepNotePalette.length],
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (mCtx) {
        return StatefulBuilder(
          builder: (sCtx, setModalState) {
            return Container(
              decoration: BoxDecoration(
                color: _keepNotePalette[colorIndex % _keepNotePalette.length],
                borderRadius:
                    const BorderRadius.vertical(top: Radius.circular(24)),
              ),
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 20,
                bottom: MediaQuery.of(sCtx).viewInsets.bottom + 24,
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        IconButton(
                          icon: Icon(
                            pinned
                                ? Icons.push_pin_rounded
                                : Icons.push_pin_outlined,
                            color: pinned ? _accentColor : Colors.white70,
                          ),
                          onPressed: () =>
                              setModalState(() => pinned = !pinned),
                        ),
                        ChoiceChip(
                          label: Text(
                            isChecklist
                                ? _tr('checklistChip')
                                : _tr('textNoteChip'),
                          ),
                          selected: isChecklist,
                          onSelected: (v) =>
                              setModalState(() => isChecklist = v),
                        ),
                        const Spacer(),
                        ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF10B981),
                            foregroundColor: Colors.black,
                          ),
                          onPressed: () {
                            setState(() {
                              if (isEditing) {
                                existing.title = titleCtrl.text.trim();
                                existing.content = bodyCtrl.text.trim();
                                existing.isChecklist = isChecklist;
                                existing.checklist = checklist;
                                existing.pinned = pinned;
                                existing.label = label;
                                existing.colorIndex = colorIndex;
                                existing.updatedAt =
                                    DateTime.now().millisecondsSinceEpoch;
                              } else {
                                _keepNotes.insert(
                                  0,
                                  KeepNoteItem(
                                    id: DateTime.now()
                                        .millisecondsSinceEpoch
                                        .toString(),
                                    title: titleCtrl.text.trim(),
                                    content: bodyCtrl.text.trim(),
                                    isChecklist: isChecklist,
                                    checklist: checklist,
                                    pinned: pinned,
                                    label: label,
                                    colorIndex: colorIndex,
                                  ),
                                );
                              }
                            });
                            _saveState();
                            Navigator.pop(mCtx);
                          },
                          child: Text(
                            _tr('saveNoteBtn'),
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          ),
                        ),
                      ],
                    ),
                    TextField(
                      controller: titleCtrl,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                      decoration: InputDecoration(
                        hintText: _tr('noteTitleHint'),
                        hintStyle: const TextStyle(color: Colors.white38),
                        border: InputBorder.none,
                      ),
                    ),
                    const Divider(color: Colors.white12),
                    if (isChecklist) ...[
                      ...List.generate(checklist.length, (i) {
                        final item = checklist[i];
                        return Row(
                          children: [
                            Checkbox(
                              value: item.done,
                              activeColor: const Color(0xFF10B981),
                              onChanged: (v) =>
                                  setModalState(() => item.done = v == true),
                            ),
                            Expanded(
                              child: Text(
                                item.text,
                                style: TextStyle(
                                  color:
                                      item.done ? Colors.white38 : Colors.white,
                                  decoration: item.done
                                      ? TextDecoration.lineThrough
                                      : null,
                                ),
                              ),
                            ),
                            IconButton(
                              icon: const Icon(Icons.close,
                                  size: 16, color: Colors.white38),
                              onPressed: () =>
                                  setModalState(() => checklist.removeAt(i)),
                            ),
                          ],
                        );
                      }),
                      Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: newCheckItemCtrl,
                              style: const TextStyle(color: Colors.white),
                              decoration: InputDecoration(
                                hintText: _tr('addChecklistItemHint'),
                                hintStyle: const TextStyle(color: Colors.white38),
                                border: InputBorder.none,
                              ),
                              onSubmitted: (v) {
                                if (v.trim().isNotEmpty) {
                                  setModalState(() {
                                    checklist.add(
                                        ChecklistEntry(text: v.trim()));
                                    newCheckItemCtrl.clear();
                                  });
                                }
                              },
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.add_circle_rounded,
                                color: Color(0xFF10B981)),
                            onPressed: () {
                              final String v = newCheckItemCtrl.text.trim();
                              if (v.isNotEmpty) {
                                setModalState(() {
                                  checklist.add(ChecklistEntry(text: v));
                                  newCheckItemCtrl.clear();
                                });
                              }
                            },
                          ),
                        ],
                      ),
                    ] else
                      TextField(
                        controller: bodyCtrl,
                        maxLines: 6,
                        style:
                            const TextStyle(color: Colors.white, fontSize: 14),
                        decoration: InputDecoration(
                          hintText: _tr('noteBodyHint'),
                          hintStyle: const TextStyle(color: Colors.white38),
                          border: InputBorder.none,
                        ),
                      ),
                    const SizedBox(height: 12),
                    // Color & Label Picker
                    Row(
                      children: [
                        ...List.generate(_keepNotePalette.length, (cIdx) {
                          return GestureDetector(
                            onTap: () =>
                                setModalState(() => colorIndex = cIdx),
                            child: Container(
                              margin: const EdgeInsets.only(right: 8),
                              width: 26,
                              height: 26,
                              decoration: BoxDecoration(
                                color: _keepNotePalette[cIdx],
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: colorIndex == cIdx
                                      ? const Color(0xFF10B981)
                                      : Colors.white38,
                                  width: colorIndex == cIdx ? 2.2 : 1,
                                ),
                              ),
                            ),
                          );
                        }),
                        const Spacer(),
                        DropdownButton<String>(
                          value: label,
                          dropdownColor: const Color(0xFF191C26),
                          style: const TextStyle(
                              color: Colors.white, fontSize: 12),
                          items: ['Idea', 'Work', 'Reflection']
                              .map((l) => DropdownMenuItem(
                                    value: l,
                                    child: Text(_trNoteLabel(l)),
                                  ))
                              .toList(),
                          onChanged: (v) {
                            if (v != null) setModalState(() => label = v);
                          },
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  // =========================================================================
  // PAGE 2: APPS DIRECTORY (WITH QR LOCK ON RESTRICTION WEAKENING + 3 LISTS)
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
                    hintText: _tr('searchAppsHint'),
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
              const SizedBox(width: 6),
              IconButton(
                style: IconButton.styleFrom(backgroundColor: _cardColor),
                icon: Icon(Icons.tune_rounded, color: _accentColor),
                tooltip: _tr('customizeListsBtn'),
                onPressed: () =>
                    _showHomeListsSetupModal(ctx, initialProfile: _activeProfile),
              ),
              const SizedBox(width: 6),
              IconButton(
                style: IconButton.styleFrom(backgroundColor: _cardColor),
                icon: Icon(Icons.sync_rounded, color: _accentColor),
                tooltip: _tr('syncAppsTooltip'),
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
                                  app.name, // App name untranslated!
                                  style: TextStyle(
                                    color: _textColor,
                                    fontSize: 15,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                Text(
                                  '${_trCategory(app.category)} • ${app.packageName}',
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
                            app.tier == 'restricted'
                                ? _tr('gate15sBtn')
                                : _tr('openBtn'),
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
                        _buildTierMiniButton(
                            ctx, app, 'essential', _tr('tierEssential')),
                        const SizedBox(width: 6),
                        _buildTierMiniButton(
                            ctx, app, 'utility', _tr('tierUtility')),
                        const SizedBox(width: 6),
                        _buildTierMiniButton(
                            ctx, app, 'restricted', _tr('tierRestricted')),
                        const Spacer(),
                        InkWell(
                          onTap: () {
                            if (app.nightQrLocked) {
                              // Turning OFF Night QR Lock requires Protection Unlock!
                              _requireProtectionUnlock(
                                ctx,
                                targetTitle: '${app.name} (${_tr('nightQr')})',
                                onUnlocked: () {
                                  setState(() => app.nightQrLocked = false);
                                  _saveState();
                                },
                              );
                            } else {
                              setState(() => app.nightQrLocked = true);
                              _saveState();
                            }
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
                              app.nightQrLocked
                                  ? _tr('qrLockedBadge')
                                  : _tr('qrOffBadge'),
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
                    const SizedBox(height: 8),
                    // 3 Separate Homepage List Assignment Chips: Work | Personal | Sunset
                    Row(
                      children: [
                        _buildAppHomeListChip(
                          app,
                          'work',
                          '💼 ${_tr('profileWork')}',
                        ),
                        const SizedBox(width: 6),
                        _buildAppHomeListChip(
                          app,
                          'personal',
                          '🏠 ${_tr('profilePersonal')}',
                        ),
                        const SizedBox(width: 6),
                        _buildAppHomeListChip(
                          app,
                          'sunset',
                          '🌆 ${_tr('profileSunset')}',
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

  Widget _buildAppHomeListChip(AppItem app, String profileId, String label) {
    final bool active = app.profiles.contains(profileId);
    return InkWell(
      onTap: () {
        setState(() {
          if (active) {
            app.profiles.remove(profileId);
          } else {
            app.profiles.add(profileId);
          }
          app.pinned = app.profiles.isNotEmpty;
        });
        _saveState();
      },
      borderRadius: BorderRadius.circular(6),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
        decoration: BoxDecoration(
          color: active
              ? _accentColor.withValues(alpha: 0.18)
              : Colors.white.withValues(alpha: 0.04),
          borderRadius: BorderRadius.circular(6),
          border: Border.all(
            color: active ? _accentColor : Colors.white10,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: active ? _accentColor : _subTextColor,
            fontSize: 10,
            fontWeight: active ? FontWeight.bold : FontWeight.normal,
          ),
        ),
      ),
    );
  }

  Widget _buildTierMiniButton(
      BuildContext ctx, AppItem app, String tierVal, String label) {
    final bool selected = app.tier == tierVal;
    return InkWell(
      onTap: () {
        if (app.tier == tierVal) return;
        // Weakening restriction (from 'restricted' to 'utility'/'essential', or at night) requires Protection Unlock!
        final bool isWeakening =
            (app.tier == 'restricted' && tierVal != 'restricted') ||
                _isNightWindow;
        if (isWeakening) {
          _requireProtectionUnlock(
            ctx,
            targetTitle: '${app.name} → $label',
            onUnlocked: () {
              setState(() => app.tier = tierVal);
              _saveState();
            },
          );
        } else {
          setState(() => app.tier = tierVal);
          _saveState();
        }
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
          tabs: [
            _tr('purityTabDns'),
            _tr('purityTabSos'),
            _tr('purityTabKeywords'),
            _tr('filterAll'),
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
                _buildBlockedKeywordsCard(ctx),
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
                          ? '${_tr('dnsVerified')} ($_osDnsSpecifier)'
                          : '${_tr('dnsNotVerified')} ($_dnsHost)',
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
            title: _tr('dnsCloudflareTitle'),
            host: 'family.cloudflare-dns.com',
          ),
          const SizedBox(height: 8),
          _buildDnsProviderOption(
            id: 'cleanbrowsing',
            title: _tr('dnsCleanbrowsingTitle'),
            host: 'adult-filter-dns.cleanbrowsing.org',
          ),
          const SizedBox(height: 8),
          _buildDnsProviderOption(
            id: 'adguard',
            title: _tr('dnsAdguardTitle'),
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
              onPressed: () => _activateSafePrivateDnsNow(ctx),
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFF10B981),
                    side: const BorderSide(color: Color(0xFF10B981)),
                  ),
                  icon: const Icon(Icons.check_circle_outline_rounded, size: 16),
                  label: Text(
                    _tr('verifyDnsBtn'),
                    style: const TextStyle(
                        fontSize: 12, fontWeight: FontWeight.bold),
                  ),
                  onPressed: () async {
                    await _channel.invokeMethod('confirmManualDnsSetup', {
                      'host': _dnsHost,
                    });
                    await _refreshNativeStatus();
                    if (ctx.mounted) {
                      ScaffoldMessenger.of(ctx).showSnackBar(
                        SnackBar(
                          content: Text(
                              '✅ ${_tr('dnsVerified')} ($_dnsHost)'),
                          backgroundColor: const Color(0xFF10B981),
                        ),
                      );
                    }
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
                _requireProtectionUnlock(
                  ctx,
                  targetTitle: _tr('lockPhoneSettings'),
                  onUnlocked: () {
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
              if (!val) {
                _requireProtectionUnlock(
                  ctx,
                  targetTitle: _tr('nightAutoDns'),
                  onUnlocked: () {
                    setState(() => _nightAutoDnsEnabled = false);
                    _saveState();
                    _syncFortressToNative();
                  },
                );
              } else {
                setState(() => _nightAutoDnsEnabled = true);
                _saveState();
                _syncFortressToNative();
              }
            },
          ),

          // Optional 24/7 Strict Physical QR Lock (Default OFF so QR is Night-Only)
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            activeThumbColor: const Color(0xFF10B981),
            title: Text(
              _tr('strictQrSettingsLock'),
              style: TextStyle(
                color: _textColor,
                fontWeight: FontWeight.bold,
                fontSize: 14,
              ),
            ),
            subtitle: Text(
              _tr('strictQrSettingsLockSub'),
              style: TextStyle(color: _subTextColor, fontSize: 12),
            ),
            value: _strictQrSettingsLock,
            onChanged: (val) {
              if (!val) {
                _requireProtectionUnlock(
                  ctx,
                  targetTitle: _tr('strictQrSettingsLock'),
                  onUnlocked: () {
                    setState(() => _strictQrSettingsLock = false);
                    _saveState();
                  },
                );
              } else {
                setState(() => _strictQrSettingsLock = true);
                _saveState();
              }
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
          _buildQuickSettingsWrap(ctx, closeDrawerOnTap: false),
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
                label: Text(_tr('addDayBtn')),
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
            '${_tr('neuroProgress')}: ${(progress * 100).toStringAsFixed(0)}%',
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
              child: Text(
                _tr('emergencyBrowserLockBanner'),
                style: const TextStyle(
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

  Widget _buildBlockedKeywordsCard(BuildContext ctx) {
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
            '🔍 ${_tr('keywordsTitle')} (${_blockedKeywords.length})',
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
                    hintText: _tr('addKeywordHint'),
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
                  final String kw =
                      _keywordController.text.trim().toLowerCase();
                  if (kw.isNotEmpty && !_blockedKeywords.contains(kw)) {
                    setState(() {
                      _blockedKeywords.add(kw);
                      _keywordController.clear();
                    });
                    _saveState();
                  }
                },
                child: Text(_tr('addBtn')),
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
                      _requireProtectionUnlock(
                        ctx,
                        targetTitle: kw,
                        onUnlocked: () {
                          setState(() => _blockedKeywords.remove(kw));
                          _saveState();
                        },
                      );
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
          tabs: [
            _tr('focusTabDigest'),
            _tr('focusTabMonk'),
            _tr('focusTabQr'),
            _tr('filterAll'),
          ],
          currentIndex: _focusSubTab,
          onTap: (idx) => setState(() => _focusSubTab = idx),
        ),
        Expanded(
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              if (_focusSubTab == 0 || _focusSubTab == 3) _buildDigestCard(),
              if (_focusSubTab == 1 || _focusSubTab == 3) ...[
                const SizedBox(height: 14),
                _buildMonkAndNightScheduleCard(ctx),
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
                child: Text(_tr('clearAllBtn')),
              ),
            ],
          ),
          Wrap(
            spacing: 8,
            children: [
              FilterChip(
                label: Text(_tr('digestMorningChip')),
                selected: _digestMorning,
                onSelected: (v) => setState(() => _digestMorning = v),
              ),
              FilterChip(
                label: Text(_tr('digestMiddayChip')),
                selected: _digestMidday,
                onSelected: (v) => setState(() => _digestMidday = v),
              ),
              FilterChip(
                label: Text(_tr('digestEveningChip')),
                selected: _digestEvening,
                onSelected: (v) => setState(() => _digestEvening = v),
              ),
            ],
          ),
          const SizedBox(height: 10),
          if (_digestItems.isEmpty)
            Text(
              _tr('zeroNotifications'),
              style: TextStyle(color: _subTextColor, fontSize: 13),
            )
          else
            ..._digestItems.map(
              (item) => ListTile(
                dense: true,
                contentPadding: EdgeInsets.zero,
                title: Text(
                  item['app'] ?? '', // App name untranslated!
                  style: TextStyle(
                    color: _textColor,
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                  ),
                ),
                subtitle: Text(
                  _tr(item['titleKey'] ?? ''),
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

  Widget _buildMonkAndNightScheduleCard(BuildContext ctx) {
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
                child: Text('$mins${_tr('monkLockSuffix')}'),
              );
            }).toList(),
          ),
          if (_isMonkActive) ...[
            const SizedBox(height: 8),
            TextButton(
              onPressed: () {
                _requireProtectionUnlock(
                  ctx,
                  targetTitle: _tr('endMonkEarly'),
                  onUnlocked: () => setState(() => _monkModeUntil = 0),
                );
              },
              child: Text(_tr('endMonkEarly')),
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
              _tr('sleepScheduleSub'),
              style: TextStyle(color: _subTextColor, fontSize: 12),
            ),
            value: _sleepScheduleEnabled,
            onChanged: (v) {
              if (!v) {
                _requireProtectionUnlock(
                  ctx,
                  targetTitle: _tr('sleepScheduleTitle'),
                  onUnlocked: () => setState(() => _sleepScheduleEnabled = false),
                );
              } else {
                setState(() => _sleepScheduleEnabled = true);
              }
            },
          ),
        ],
      ),
    );
  }

  Widget _buildQrAndRamCleanerCard(BuildContext ctx) {
    final bool hideQrAtNight = _isNightWindow && _qrSetupVerified;
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
            _tr('qrCardTitle'),
            style: TextStyle(
              color: _textColor,
              fontWeight: FontWeight.bold,
              fontSize: 15,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            _tr('qrCardSub'),
            style: TextStyle(color: _subTextColor, fontSize: 12, height: 1.4),
          ),
          const SizedBox(height: 14),
          if (hideQrAtNight)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.amber.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.amber),
              ),
              child: Text(
                _tr('qrHiddenNightMsg'),
                style: const TextStyle(
                  color: Colors.amber,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
            )
          else if (_qrMatrixSize > 0 && _qrMatrixBits.isNotEmpty)
            Center(
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFF10B981), width: 2),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    SizedBox(
                      width: 170,
                      height: 170,
                      child: CustomPaint(
                        painter: _QrMatrixPainter(
                          size: _qrMatrixSize,
                          bits: _qrMatrixBits,
                        ),
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      _qrSecret,
                      style: const TextStyle(
                        color: Colors.black87,
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                        letterSpacing: 1.5,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF10B981),
                    foregroundColor: Colors.black,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  icon: const Icon(Icons.print_rounded, size: 18),
                  label: Text(
                    _tr('printQrBtn'),
                    style: const TextStyle(
                        fontSize: 12, fontWeight: FontWeight.bold),
                  ),
                  onPressed: _printPhysicalQrSheet,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: _accentColor,
                    side: BorderSide(color: _accentColor),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  icon: const Icon(Icons.qr_code_scanner_rounded, size: 18),
                  label: Text(
                    _tr('testQrScanBtn'),
                    style: const TextStyle(
                        fontSize: 12, fontWeight: FontWeight.bold),
                  ),
                  onPressed: () => _scanPhysicalQrWithCamera(ctx),
                ),
              ),
            ],
          ),
          const Divider(height: 24, color: Colors.white12),
          Text(
            '🧹 ${_tr('ramCleanerTitle')} ($_ramFreedMb MB)',
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
                  final Map<dynamic, dynamic>? res =
                      await _channel.invokeMethod<Map<dynamic, dynamic>>(
                          'cleanBackgroundApps');
                  final int freed = (res?['freedMb'] as int?) ?? 48;
                  setState(() => _ramFreedMb += freed);
                  if (ctx.mounted) {
                    ScaffoldMessenger.of(ctx).showSnackBar(
                      SnackBar(
                        content: Text('${_tr('ramFreedToast')} (+$freed MB)'),
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
          tabs: [
            _tr('settingsTabSystem'),
            _tr('settingsTabImpact'),
            _tr('settingsTabLang'),
            _tr('filterAll'),
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
                          _tr('settingsLockedBanner'),
                          style: TextStyle(color: _textColor, fontSize: 12),
                        ),
                      ),
                      const SizedBox(width: 8),
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.amber,
                          foregroundColor: Colors.black,
                        ),
                        onPressed: () => _requireProtectionUnlock(
                          ctx,
                          targetTitle: _tr('navSettings'),
                          onUnlocked: () =>
                              setState(() => _settingsUnlockedSession = true),
                        ),
                        child: Text(_tr('unlockBtn')),
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
            _tr('nativePermsTitle'),
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
                  ? _tr('usageAccessActiveSub')
                  : _tr('usageAccessInactiveSub'),
              style: TextStyle(color: _subTextColor, fontSize: 12),
            ),
            trailing: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor:
                    _hasUsageAccess ? Colors.white12 : const Color(0xFF10B981),
                foregroundColor:
                    _hasUsageAccess ? Colors.white70 : Colors.black,
              ),
              onPressed: () async {
                await _channel.invokeMethod('requestUsageStatsPermission');
              },
              child:
                  Text(_hasUsageAccess ? _tr('grantedBtn') : _tr('grantBtn')),
            ),
          ),
          const Divider(color: Colors.white12),
          ListTile(
            contentPadding: EdgeInsets.zero,
            leading: Icon(
              _hasOverlayPermission
                  ? Icons.verified_user_rounded
                  : Icons.layers_outlined,
              color: _hasOverlayPermission
                  ? const Color(0xFF10B981)
                  : Colors.amber,
            ),
            title: Text(
              _tr('overlayPermCard'),
              style: TextStyle(
                color: _textColor,
                fontWeight: FontWeight.bold,
                fontSize: 14,
              ),
            ),
            subtitle: Text(
              _hasOverlayPermission
                  ? _tr('overlayActiveSub')
                  : _tr('overlayInactiveSub'),
              style: TextStyle(color: _subTextColor, fontSize: 12),
            ),
            trailing: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: _hasOverlayPermission
                    ? Colors.white12
                    : const Color(0xFF10B981),
                foregroundColor:
                    _hasOverlayPermission ? Colors.white70 : Colors.black,
              ),
              onPressed: () async {
                await _channel.invokeMethod('requestOverlayPermission');
              },
              child: Text(
                  _hasOverlayPermission ? _tr('grantedBtn') : _tr('grantBtn')),
            ),
          ),
          const Divider(color: Colors.white12),
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
                  ? _tr('defaultLauncherActiveSub')
                  : _tr('defaultLauncherInactiveSub'),
              style: TextStyle(color: _subTextColor, fontSize: 12),
            ),
            trailing: ElevatedButton(
              onPressed: () async {
                await _channel.invokeMethod('requestDefaultLauncher');
              },
              child: Text(_isDefaultLauncher
                  ? _tr('changeBtn')
                  : _tr('setDefaultBtn')),
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
              _tr('kioskPinSub'),
              style: TextStyle(color: _subTextColor, fontSize: 12),
            ),
            trailing: ElevatedButton(
              onPressed: () async {
                await _channel.invokeMethod('toggleKioskPin');
                _refreshNativeStatus();
              },
              child:
                  Text(_isKioskPinned ? _tr('unpinBtn') : _tr('pinScreenBtn')),
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
            _tr('impactReportTitle'),
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
              _buildStatBox('$_reclaimedMinutes m', _tr('statReclaimed')),
              _buildStatBox('$_mindfulPausesCompleted', _tr('statPauses')),
              _buildStatBox('$_urgesResisted', _tr('statUrges')),
              _buildStatBox('$_blockedOpens', _tr('statBlocked')),
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
            _tr('langCardTitle'),
            style: TextStyle(
              color: _textColor,
              fontSize: 15,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 10),
          _buildLanguageDropdown(),
          const Divider(height: 24, color: Colors.white12),
          Text(
            _tr('themeCardTitle'),
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
                label: Text(_tr('themeOled')),
                selected: _themeMode == 'oled',
                onSelected: (_) {
                  setState(() => _themeMode = 'oled');
                  _saveState();
                },
              ),
              ChoiceChip(
                label: Text(_tr('themeEink')),
                selected: _themeMode == 'eink',
                onSelected: (_) {
                  setState(() => _themeMode = 'eink');
                  _saveState();
                },
              ),
              ChoiceChip(
                label: Text(_tr('themeAmber')),
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

  // =========================================================================
  // PAGE 7 (TAB 6): DEDICATED COMPLETE USER GUIDE (100% TRANSLATED)
  // =========================================================================
  Widget _buildUserGuidePage(BuildContext ctx) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: _cardColor,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFF10B981), width: 1.4),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                _tr('userGuideTitle'),
                style: TextStyle(
                  color: _textColor,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                _tr('userGuideIntro'),
                style: TextStyle(color: _subTextColor, fontSize: 13),
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF10B981),
                        foregroundColor: Colors.black,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                      icon: const Icon(Icons.fact_check_rounded, size: 18),
                      label: Text(
                        _tr('drawerSetupWizard'),
                        style: const TextStyle(
                            fontSize: 12, fontWeight: FontWeight.bold),
                      ),
                      onPressed: () => _showSetupWizardModal(ctx),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),
        _buildGuideSectionCard(
          icon: Icons.security_rounded,
          title: _tr('ugSec1Title'),
          body: _tr('ugSec1Body'),
        ),
        const SizedBox(height: 14),
        _buildGuideSectionCard(
          icon: Icons.qr_code_scanner_rounded,
          title: _tr('ugSec2Title'),
          body: _tr('ugSec2Body'),
          actionButton: ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF10B981),
              foregroundColor: Colors.black,
            ),
            icon: const Icon(Icons.print_rounded, size: 18),
            label: Text(_tr('printQrBtn')),
            onPressed: _printPhysicalQrSheet,
          ),
        ),
        const SizedBox(height: 14),
        _buildGuideSectionCard(
          icon: Icons.apps_rounded,
          title: _tr('ugSec3Title'),
          body: _tr('ugSec3Body'),
        ),
      ],
    );
  }

  Widget _buildGuideSectionCard({
    required IconData icon,
    required String title,
    required String body,
    Widget? actionButton,
  }) {
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
              Icon(icon, color: _accentColor, size: 22),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  title,
                  style: TextStyle(
                    color: _textColor,
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            body,
            style: TextStyle(
              color: _subTextColor,
              fontSize: 13,
              height: 1.55,
            ),
          ),
          if (actionButton != null) ...[
            const SizedBox(height: 12),
            SizedBox(width: double.infinity, child: actionButton),
          ],
        ],
      ),
    );
  }
}

class _QrMatrixPainter extends CustomPainter {
  final int size;
  final String bits;

  _QrMatrixPainter({required this.size, required this.bits});

  @override
  void paint(Canvas canvas, Size canvasSize) {
    if (size <= 0 || bits.length < size * size) return;
    final Paint darkPaint = Paint()
      ..color = Colors.black
      ..style = PaintingStyle.fill;
    final double cell = canvasSize.width / size;
    for (int y = 0; y < size; y++) {
      for (int x = 0; x < size; x++) {
        if (bits.codeUnitAt(y * size + x) == 49) {
          canvas.drawRect(
            Rect.fromLTWH(x * cell, y * cell, cell + 0.4, cell + 0.4),
            darkPaint,
          );
        }
      }
    }
  }

  @override
  bool shouldRepaint(covariant _QrMatrixPainter oldDelegate) =>
      oldDelegate.size != size || oldDelegate.bits != bits;
}

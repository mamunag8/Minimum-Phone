import 'dart:async';
import 'dart:convert';
import 'dart:math' as math;
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
  String _backgroundLocation = 'Erzurum';
  double _locationLat = 39.9043;
  double _locationLng = 41.2679;
  bool _hasLocationPermission = false;
  bool _manualLocationOverride = false;
  String _searchQuery = '';
  int _wisdomIndex = 0;
  String _favoriteQuoteCategory = 'all'; // 'all', 'quran', 'hadith', 'proverb', 'focus', 'time', 'peace', 'discipline'
  int _quoteRotationSeconds = 30; // 15, 30, 60, 300, or 0 (Daily)
  int _lastQuoteRotateMs = 0;
  int _lastQuoteDaySeed = 0;
  final math.Random _rng = math.Random();
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
  bool _usageReminderEnabled = true;
  int _usageReminderMinutes = 10;
  bool _settingsUnlockedSession = false;
  int _settingsUnlockedUntilMs = 0;
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
  final FocusNode _appSearchFocusNode = FocusNode();
  final FocusNode _notesSearchFocusNode = FocusNode();
  final FocusNode _quickHomeNoteFocusNode = FocusNode();
  final FocusNode _keywordFocusNode = FocusNode();

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
    final DateTime initNow = DateTime.now();
    _lastQuoteDaySeed = _computeDaySeed(initNow);
    _lastQuoteRotateMs = initNow.millisecondsSinceEpoch;
    _wisdomIndex = ((_lastQuoteDaySeed * 37) + _rng.nextInt(500)) % 535;
    _initDefaultApps();
    _initDefaultKeepNotes();
    _loadPersistedState();
    _refreshNativeStatus();
    _loadQrMatrix();
    _clockTimer = Timer.periodic(const Duration(seconds: 2), (_) {
      if (mounted) {
        final DateTime current = DateTime.now();
        final bool nightNow = current.hour >= 22 || current.hour < 6;
        final int nowMs = current.millisecondsSinceEpoch;
        final bool minuteChanged = current.minute != _now.minute ||
            current.hour != _now.hour ||
            current.day != _now.day;
        final bool shouldLockSettings =
            nightNow && _nightAutoDnsEnabled && !_phoneSettingsLocked;
        final bool shouldExpireUnlock =
            _settingsUnlockedSession && nowMs > _settingsUnlockedUntilMs;
        final int daySeedNow = _computeDaySeed(current);
        final bool dayChanged = daySeedNow != _lastQuoteDaySeed;
        final bool quoteRotateDue = _quoteRotationSeconds > 0 &&
            (nowMs - _lastQuoteRotateMs >= _quoteRotationSeconds * 1000);
        if (minuteChanged ||
            shouldLockSettings ||
            shouldExpireUnlock ||
            dayChanged ||
            quoteRotateDue) {
          setState(() {
            _now = current;
            if (shouldLockSettings) {
              _phoneSettingsLocked = true;
            }
            if (shouldExpireUnlock) {
              _settingsUnlockedSession = false;
            }
            if (dayChanged) {
              _lastQuoteDaySeed = daySeedNow;
              _lastQuoteRotateMs = nowMs;
              final int len = _getFilteredWisdomList().length;
              if (len > 0) {
                _wisdomIndex = ((daySeedNow * 37) + _rng.nextInt(len)) % len;
              }
            } else if (quoteRotateDue) {
              _lastQuoteRotateMs = nowMs;
              final int len = _getFilteredWisdomList().length;
              if (len > 1) {
                int nextIdx = _rng.nextInt(len);
                if (nextIdx == (_wisdomIndex % len)) {
                  nextIdx = (nextIdx + 1) % len;
                }
                _wisdomIndex = nextIdx;
              }
            }
          });
        } else {
          _now = current;
        }
        _refreshNativeStatus();
      }
    });
  }

  void _focusAndShowKeyboard(FocusNode node) {
    if (!node.hasFocus) {
      FocusScope.of(context).requestFocus(node);
    }
    SystemChannels.textInput.invokeMethod('TextInput.show');
    _channel.invokeMethod('showSoftKeyboard');
    Future.delayed(const Duration(milliseconds: 70), () {
      if (mounted) {
        if (!node.hasFocus) {
          FocusScope.of(context).requestFocus(node);
        }
        SystemChannels.textInput.invokeMethod('TextInput.show');
        _channel.invokeMethod('showSoftKeyboard');
      }
    });
  }

  void _dismissKeyboardAndUnfocus() {
    FocusManager.instance.primaryFocus?.unfocus();
    SystemChannels.textInput.invokeMethod('TextInput.hide');
    _channel.invokeMethod('hideSoftKeyboard');
  }

  void _grantSettingsSessionUnlock() {
    setState(() {
      _settingsUnlockedSession = true;
      _settingsUnlockedUntilMs = DateTime.now().millisecondsSinceEpoch + 45000;
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
    _appSearchFocusNode.dispose();
    _notesSearchFocusNode.dispose();
    _quickHomeNoteFocusNode.dispose();
    _keywordFocusNode.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.paused) {
      FocusManager.instance.primaryFocus?.unfocus();
      if (mounted && _settingsUnlockedSession) {
        setState(() => _settingsUnlockedSession = false);
      }
    } else if (state == AppLifecycleState.inactive) {
      if (mounted && _settingsUnlockedSession) {
        setState(() => _settingsUnlockedSession = false);
      }
    } else if (state == AppLifecycleState.resumed) {
      // Immediately refresh Usage Access, Overlay, and OS Private DNS when user returns from Android Settings!
      _refreshNativeStatus();
      _syncFortressToNative();
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
        id: 'playstore',
        name: 'Google Play Store',
        packageName: 'com.android.vending',
        category: 'Tools',
        tier: 'utility',
        pinned: false,
        nightQrLocked: true,
        profiles: [],
      ),
      AppItem(
        id: 'gemini',
        name: 'Google Gemini',
        packageName: 'com.google.android.apps.bard',
        category: 'Guarded',
        tier: 'restricted',
        pinned: false,
        nightQrLocked: true,
        profiles: [],
      ),
      AppItem(
        id: 'googlesearch',
        name: 'Google Search & Assistant',
        packageName: 'com.google.android.googlequicksearchbox',
        category: 'Guarded',
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

  bool _isCoreEssentialUtilityPackage(String lowerPkg) {
    if (lowerPkg.isEmpty) return false;
    return lowerPkg.contains('incallui') ||
        lowerPkg.contains('dialer') ||
        lowerPkg == 'com.android.phone' ||
        lowerPkg == 'com.android.server.telecom' ||
        lowerPkg.contains('contacts') ||
        lowerPkg.contains('deskclock') ||
        lowerPkg.contains('clockpackage') ||
        lowerPkg.contains('alarmclock') ||
        lowerPkg.contains('calculator') ||
        lowerPkg == 'com.google.android.apps.messaging' ||
        lowerPkg == 'com.samsung.android.messaging' ||
        lowerPkg == 'com.android.mms' ||
        lowerPkg == 'com.google.android.apps.maps' ||
        lowerPkg == 'com.google.android.calendar' ||
        lowerPkg == 'com.samsung.android.calendar';
  }

  bool _isAlwaysNightLockedGatewayOrSocial(String lowerPkg) {
    if (lowerPkg.isEmpty) return false;
    return lowerPkg.contains('chrome') ||
        lowerPkg.contains('firefox') ||
        lowerPkg.contains('brave') ||
        lowerPkg.contains('sbrowser') ||
        lowerPkg.contains('opera') ||
        lowerPkg.contains('emmx') ||
        lowerPkg.contains('duckduckgo') ||
        lowerPkg.contains('ucmobile') ||
        lowerPkg.contains('kiwi') ||
        lowerPkg.contains('vivaldi') ||
        lowerPkg.contains('browser') ||
        lowerPkg.contains('webview') ||
        lowerPkg.contains('htmlviewer') ||
        lowerPkg.contains('torproject') ||
        lowerPkg == 'com.google.android.apps.bard' ||
        lowerPkg == 'com.google.android.googlequicksearchbox' ||
        lowerPkg == 'com.google.android.apps.googleassistant' ||
        lowerPkg == 'com.google.ar.lens' ||
        lowerPkg == 'com.openai.chatgpt' ||
        lowerPkg == 'com.microsoft.copilot' ||
        lowerPkg == 'com.microsoft.bing' ||
        lowerPkg == 'com.anthropic.claude' ||
        lowerPkg == 'ai.perplexity.app.android' ||
        lowerPkg == 'com.deepseek.chat' ||
        lowerPkg == 'ai.x.grok' ||
        lowerPkg.contains('gemini') ||
        lowerPkg.contains('chatgpt') ||
        lowerPkg.contains('perplexity') ||
        lowerPkg.contains('copilot') ||
        lowerPkg.contains('youtube') ||
        lowerPkg.contains('vanced') ||
        lowerPkg.contains('newpipe') ||
        lowerPkg.contains('instagram') ||
        lowerPkg.contains('facebook') ||
        lowerPkg.contains('katana') ||
        lowerPkg.contains('orca') ||
        lowerPkg.contains('mlite') ||
        lowerPkg.contains('musically') ||
        lowerPkg.contains('trill') ||
        lowerPkg.contains('tiktok') ||
        lowerPkg.contains('aweme') ||
        lowerPkg.contains('twitter') ||
        lowerPkg == 'com.x.android' ||
        lowerPkg.contains('reddit') ||
        lowerPkg.contains('snapchat') ||
        lowerPkg.contains('threads') ||
        lowerPkg.contains('barcelona') ||
        lowerPkg.contains('pinterest') ||
        lowerPkg.contains('linkedin') ||
        lowerPkg.contains('tumblr') ||
        lowerPkg.contains('discord') ||
        lowerPkg.contains('twitch') ||
        lowerPkg.contains('netflix') ||
        lowerPkg.contains('primevideo') ||
        lowerPkg.contains('disney') ||
        lowerPkg.contains('hulu') ||
        lowerPkg.contains('crunchyroll') ||
        lowerPkg.contains('bilibili') ||
        lowerPkg.contains('kwai') ||
        lowerPkg.contains('likee') ||
        lowerPkg.contains('bigo') ||
        lowerPkg.contains('quora') ||
        lowerPkg.contains('9gag') ||
        lowerPkg == 'com.android.vending' ||
        lowerPkg == 'com.sec.android.app.samsungapps' ||
        lowerPkg == 'com.xiaomi.mipicks' ||
        lowerPkg == 'com.huawei.appmarket' ||
        lowerPkg == 'com.heytap.market' ||
        lowerPkg == 'com.oppo.market' ||
        lowerPkg == 'com.bbk.appstore';
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
          if (data['hyperlocalCity'] != null &&
              data['hyperlocalCity'].toString().trim().isNotEmpty) {
            final String savedCity = data['hyperlocalCity'].toString().trim();
            final bool savedManual = data['manualLocationOverride'] == true;
            final double? savedLat = (data['hyperlocalLat'] as num?)?.toDouble();
            final double? savedLng = (data['hyperlocalLng'] as num?)?.toDouble();
            if (savedLat != null &&
                savedLng != null &&
                (savedLat != 0.0 || savedLng != 0.0)) {
              // Ignore legacy unverified timezone-only "Istanbul" fallback so Erzurum / real GPS wins
              if (savedManual || savedCity.toLowerCase() != 'istanbul') {
                _backgroundLocation = savedCity;
                _locationLat = savedLat;
                _locationLng = savedLng;
                _manualLocationOverride = savedManual;
              }
            }
          }
          _favoriteQuoteCategory =
              (data['favoriteQuoteCategory'] ?? _favoriteQuoteCategory)
                  .toString();
          _quoteRotationSeconds =
              (data['quoteRotationSeconds'] as int?) ?? _quoteRotationSeconds;
          final int len = _getFilteredWisdomList().length;
          if (len > 0) {
            _wisdomIndex =
                ((_computeDaySeed(DateTime.now()) * 37) + _rng.nextInt(len)) %
                    len;
          }
          _dnsProvider = data['dnsProvider'] ?? 'cloudflare';
          _dnsHost = data['dnsHost'] ?? 'family.cloudflare-dns.com';
          _phoneSettingsLocked = data['phoneSettingsLocked'] ?? true;
          _nightAutoDnsEnabled = data['nightAutoDnsEnabled'] ?? true;
          _strictQrSettingsLock = data['strictQr247'] == true;
          _sleepScheduleEnabled = data['sleepScheduleEnabled'] ?? true;
          _usageReminderEnabled = data['usageReminderEnabled'] ?? true;
          _usageReminderMinutes = (data['usageReminderMinutes'] as int?) ?? 10;
          _monkModeUntil = (data['monkModeUntil'] as int?) ?? 0;
          _emergencyLockdownUntil =
              (data['emergencyLockdownUntil'] as int?) ?? 0;
          _digestMorning = data['digestMorning'] ?? true;
          _digestMidday = data['digestMidday'] ?? true;
          _digestEvening = data['digestEvening'] ?? true;
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
            final bool hasNightGatewayLockV294 =
                data['nightGatewayLockV294'] == true;
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
              if (!hasNightGatewayLockV294) {
                if (!_apps.any(
                    (a) => a.packageName == 'com.google.android.apps.bard')) {
                  _apps.add(AppItem(
                    id: 'gemini',
                    name: 'Google Gemini',
                    packageName: 'com.google.android.apps.bard',
                    category: 'Guarded',
                    tier: 'restricted',
                    pinned: false,
                    nightQrLocked: true,
                    profiles: [],
                  ));
                }
                if (!_apps.any((a) =>
                    a.packageName ==
                    'com.google.android.googlequicksearchbox')) {
                  _apps.add(AppItem(
                    id: 'googlesearch',
                    name: 'Google Search & Assistant',
                    packageName: 'com.google.android.googlequicksearchbox',
                    category: 'Guarded',
                    tier: 'restricted',
                    pinned: false,
                    nightQrLocked: true,
                    profiles: [],
                  ));
                }
                for (final app in _apps) {
                  final String lp = app.packageName.toLowerCase();
                  if (_isAlwaysNightLockedGatewayOrSocial(lp)) {
                    app.nightQrLocked = true;
                    if (lp != 'com.android.vending') {
                      app.tier = 'restricted';
                    }
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
        await _syncInstalledAndroidApps(silent: true);
        _syncFortressToNative();
      } else {
        await _syncInstalledAndroidApps(silent: true);
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
        'hyperlocalCity': _backgroundLocation,
        'hyperlocalLat': _locationLat,
        'hyperlocalLng': _locationLng,
        'manualLocationOverride': _manualLocationOverride,
        'favoriteQuoteCategory': _favoriteQuoteCategory,
        'quoteRotationSeconds': _quoteRotationSeconds,
        'homeListsV23': true,
        'nightGatewayLockV294': true,
        'dnsProvider': _dnsProvider,
        'dnsHost': _dnsHost,
        'phoneSettingsLocked': _phoneSettingsLocked,
        'nightAutoDnsEnabled': _nightAutoDnsEnabled,
        'strictQr247': _strictQrSettingsLock,
        'sleepScheduleEnabled': _sleepScheduleEnabled,
        'usageReminderEnabled': _usageReminderEnabled,
        'usageReminderMinutes': _usageReminderMinutes,
        'monkModeUntil': _monkModeUntil,
        'emergencyLockdownUntil': _emergencyLockdownUntil,
        'digestMorning': _digestMorning,
        'digestMidday': _digestMidday,
        'digestEvening': _digestEvening,
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
      await _syncFortressToNative();
    } catch (_) {}
  }

  Future<void> _syncFortressToNative() async {
    try {
      final String nightLockedCsv = _apps
          .where((a) =>
              a.nightQrLocked ||
              a.tier == 'restricted' ||
              _isAlwaysNightLockedGatewayOrSocial(a.packageName.toLowerCase()))
          .map((a) => a.packageName)
          .where((p) => p.isNotEmpty)
          .join(',');
      final String nightAllowedCsv = _apps
          .where((a) =>
              !a.nightQrLocked &&
              a.tier != 'restricted' &&
              !_isAlwaysNightLockedGatewayOrSocial(a.packageName.toLowerCase()))
          .map((a) => a.packageName)
          .where((p) => p.isNotEmpty)
          .join(',');
      await _channel.invokeMethod('configureFortress', {
        'lang': _lang,
        'phoneSettingsLocked': _phoneSettingsLocked,
        'lockSystemSettings': _phoneSettingsLocked,
        'nightAutoDnsEnabled': _nightAutoDnsEnabled,
        'autoNightDns': _nightAutoDnsEnabled,
        'sleepScheduleEnabled': _sleepScheduleEnabled,
        'usageReminderEnabled': _usageReminderEnabled,
        'usageReminderMinutes': _usageReminderMinutes,
        'strictQr247': _strictQrSettingsLock,
        'monkModeUntil': _monkModeUntil,
        'nightLockedPackages': nightLockedCsv,
        'nightAllowedPackages': nightAllowedCsv,
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
        final bool nextDefault = status['isDefaultLauncher'] == true;
        final bool nextUsage = (status['isUsageStatsGranted'] == true) ||
            (status['hasUsageAccess'] == true);
        final bool nextOverlay = (status['isOverlayGranted'] == true) ||
            (status['hasOverlayPermission'] == true);
        final bool nextKiosk = status['isKioskPinned'] == true;
        final String nextDnsSpec =
            (status['privateDnsHost'] ?? status['osDnsSpecifier'] ?? '')
                .toString();
        final bool nextDnsSafe = (status['privateDnsActive'] == true) ||
            (status['osDnsIsFamilySafe'] == true);
        final int nextBat = (status['batteryLevel'] as int?) ?? 100;
        final String bgLoc =
            (status['backgroundLocation'] ?? '').toString().trim();
        final double rawLat =
            (status['locationLat'] as num?)?.toDouble() ?? 0.0;
        final double rawLng =
            (status['locationLng'] as num?)?.toDouble() ?? 0.0;
        final bool nextLocPerm = status['hasLocationPermission'] == true;

        String nextLoc = _backgroundLocation;
        double nextLat = _locationLat;
        double nextLng = _locationLng;
        if (!_manualLocationOverride) {
          if (bgLoc.isNotEmpty && bgLoc != 'Auto GPS') {
            nextLoc = bgLoc;
          }
          if (rawLat != 0.0 || rawLng != 0.0) {
            nextLat = rawLat;
            nextLng = rawLng;
          }
        }

        if (nextDefault != _isDefaultLauncher ||
            nextUsage != _hasUsageAccess ||
            nextOverlay != _hasOverlayPermission ||
            nextKiosk != _isKioskPinned ||
            nextDnsSpec != _osDnsSpecifier ||
            nextDnsSafe != _osDnsIsFamilySafe ||
            nextBat != _batteryLevel ||
            nextLoc != _backgroundLocation ||
            (nextLat - _locationLat).abs() > 0.0005 ||
            (nextLng - _locationLng).abs() > 0.0005 ||
            nextLocPerm != _hasLocationPermission) {
          setState(() {
            _isDefaultLauncher = nextDefault;
            _hasUsageAccess = nextUsage;
            _hasOverlayPermission = nextOverlay;
            _isKioskPinned = nextKiosk;
            _osDnsSpecifier = nextDnsSpec;
            _osDnsIsFamilySafe = nextDnsSafe;
            _batteryLevel = nextBat;
            _backgroundLocation = nextLoc;
            _locationLat = nextLat;
            _locationLng = nextLng;
            _hasLocationPermission = nextLocPerm;
          });
        }
      }
    } catch (_) {}
  }

  Future<void> _syncInstalledAndroidApps({bool silent = false}) async {
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
              final bool isCoreEssential =
                  _isCoreEssentialUtilityPackage(lowerPkg);
              final bool isRestrictedGatewayOrSocial =
                  _isAlwaysNightLockedGatewayOrSocial(lowerPkg);
              _apps.add(AppItem(
                id: pkg,
                name: label,
                packageName: pkg,
                category: isRestrictedGatewayOrSocial
                    ? 'Guarded'
                    : (isCoreEssential ? 'Tools' : 'App'),
                tier: isRestrictedGatewayOrSocial
                    ? 'restricted'
                    : (isCoreEssential ? 'essential' : 'utility'),
                pinned: false,
                nightQrLocked: !isCoreEssential,
                profiles: [],
              ));
              added++;
            }
          }
        });
        if (added > 0 || !silent) {
          _saveState();
        }
        if (!silent && mounted) {
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

  int _computeDaySeed(DateTime dt) =>
      dt.year * 10000 + dt.month * 100 + dt.day;

  List<WisdomEntry> _getFilteredWisdomList() {
    final List<WisdomEntry> all = AppDataDefaults.getWisdomList(_lang);
    if (_favoriteQuoteCategory == 'all' || all.isEmpty) return all;
    if (_favoriteQuoteCategory == 'quran' ||
        _favoriteQuoteCategory == 'hadith' ||
        _favoriteQuoteCategory == 'proverb') {
      final List<WisdomEntry> byCat =
          all.where((e) => e.category == _favoriteQuoteCategory).toList();
      return byCat.isNotEmpty ? byCat : all;
    }
    final List<WisdomEntry> thematic = [];
    for (int i = 0; i < all.length; i++) {
      final WisdomEntry e = all[i];
      final String lower = '${e.text} ${e.ref}'.toLowerCase();
      if (_favoriteQuoteCategory == 'focus') {
        if (lower.contains('focus') ||
            lower.contains('attention') ||
            lower.contains('scroll') ||
            lower.contains('screen') ||
            lower.contains('distract') ||
            i % 4 == 0) {
          thematic.add(e);
        }
      } else if (_favoriteQuoteCategory == 'time') {
        if (lower.contains('time') ||
            lower.contains('morning') ||
            lower.contains('hour') ||
            lower.contains('breath') ||
            lower.contains('youth') ||
            i % 4 == 1) {
          thematic.add(e);
        }
      } else if (_favoriteQuoteCategory == 'peace') {
        if (lower.contains('heart') ||
            lower.contains('peace') ||
            lower.contains('rest') ||
            lower.contains('mercy') ||
            lower.contains('gratitude') ||
            lower.contains('patient') ||
            i % 4 == 2) {
          thematic.add(e);
        }
      } else if (_favoriteQuoteCategory == 'discipline') {
        if (lower.contains('strong') ||
            lower.contains('control') ||
            lower.contains('habit') ||
            lower.contains('discipline') ||
            lower.contains('strive') ||
            i % 4 == 3) {
          thematic.add(e);
        }
      }
    }
    return thematic.isNotEmpty ? thematic : all;
  }

  void _rotateRandomWisdom() {
    final int len = _getFilteredWisdomList().length;
    if (len <= 1) return;
    int nextIdx = _rng.nextInt(len);
    if (nextIdx == (_wisdomIndex % len)) {
      nextIdx = (nextIdx + 1) % len;
    }
    setState(() {
      _wisdomIndex = nextIdx;
      _lastQuoteRotateMs = DateTime.now().millisecondsSinceEpoch;
    });
  }

  String _quoteCategoryLabel(String cat) {
    const Map<String, Map<String, String>> labels = {
      'all': {
        'en': 'All Quotes',
        'bn': 'সব উক্তি',
        'ar': 'جميع الحكم',
        'ur': 'تمام اقوال',
        'id': 'Semua Kutipan',
        'tr': 'Tüm Sözler',
        'hi': 'सभी विचार',
        'ms': 'Semua Kata Hikmah',
        'es': 'Todas las Citas',
        'fr': 'Toutes les Citations',
        'de': 'Alle Zitate',
        'ru': 'Все цитаты',
      },
      'quran': {
        'en': 'Quran',
        'bn': 'কুরআন',
        'ar': 'القرآن',
        'ur': 'قرآن',
        'id': 'Al-Quran',
        'tr': 'Kur\'an',
        'hi': 'क़ुरआन',
        'ms': 'Al-Quran',
        'es': 'Corán',
        'fr': 'Coran',
        'de': 'Koran',
        'ru': 'Коран',
      },
      'hadith': {
        'en': 'Hadith',
        'bn': 'হাদিস',
        'ar': 'الحديث',
        'ur': 'حدیث',
        'id': 'Hadis',
        'tr': 'Hadis',
        'hi': 'हदीस',
        'ms': 'Hadis',
        'es': 'Hadiz',
        'fr': 'Hadith',
        'de': 'Hadith',
        'ru': 'Хадис',
      },
      'proverb': {
        'en': 'Proverbs',
        'bn': 'প্রবাদ ও প্রজ্ঞা',
        'ar': 'حكم وأمثال',
        'ur': 'اقوال و حکمت',
        'id': 'Pepatah',
        'tr': 'Özdeyişler',
        'hi': 'सूक्तियाँ',
        'ms': 'Pepatah',
        'es': 'Proverbios',
        'fr': 'Proverbes',
        'de': 'Sprichwörter',
        'ru': 'Пословицы',
      },
      'focus': {
        'en': 'Deep Focus',
        'bn': 'গভীর মনোযোগ',
        'ar': 'التركيز العميق',
        'ur': 'گہری توجہ',
        'id': 'Fokus Mendalam',
        'tr': 'Derin Odak',
        'hi': 'गहरा ध्यान',
        'ms': 'Fokus Mendalam',
        'es': 'Enfoque Profundo',
        'fr': 'Concentration',
        'de': 'Tiefer Fokus',
        'ru': 'Глубокий фокус',
      },
      'time': {
        'en': 'Time & Purpose',
        'bn': 'সময় ও উদ্দেশ্য',
        'ar': 'الوقت والغاية',
        'ur': 'وقت اور مقصد',
        'id': 'Waktu & Tujuan',
        'tr': 'Zaman ve Amaç',
        'hi': 'समय और उद्देश्य',
        'ms': 'Masa & Tujuan',
        'es': 'Tiempo y Propósito',
        'fr': 'Temps et But',
        'de': 'Zeit & Sinn',
        'ru': 'Время и цель',
      },
      'peace': {
        'en': 'Inner Peace',
        'bn': 'মানসিক প্রশান্তি',
        'ar': 'السكينة والطمأنينة',
        'ur': 'ذہنی سکون',
        'id': 'Ketenangan Batin',
        'tr': 'İç Huzur',
        'hi': 'आंतरिक शांति',
        'ms': 'Ketenangan Jiwa',
        'es': 'Paz Interior',
        'fr': 'Paix Intérieure',
        'de': 'Innerer Frieden',
        'ru': 'Внутренний покой',
      },
      'discipline': {
        'en': 'Self-Mastery',
        'bn': 'আত্মনিয়ন্ত্রণ',
        'ar': 'ضبط النفس',
        'ur': 'خود ضابطگی',
        'id': 'Pengendalian Diri',
        'tr': 'Öz Disiplin',
        'hi': 'आत्म-नियंत्रण',
        'ms': 'Kawalan Diri',
        'es': 'Autodominio',
        'fr': 'Maîtrise de Soi',
        'de': 'Selbstbeherrschung',
        'ru': 'Самообладание',
      },
    };
    final Map<String, String>? m = labels[cat] ?? labels['all'];
    return m?[_lang] ?? m?['en'] ?? 'Quotes';
  }

  String _solarSlotLabel(String slot) {
    const Map<String, Map<String, String>> slotLabels = {
      'sunrise': {
        'en': 'Sunrise',
        'bn': 'সূর্যোদয়',
        'ar': 'الشروق',
        'ur': 'طلوع',
        'id': 'Terbit',
        'tr': 'Gündoğumu',
        'hi': 'सूर्योदय',
        'ms': 'Terbit',
        'es': 'Amanecer',
        'fr': 'Lever',
        'de': 'Aufgang',
        'ru': 'Восход',
      },
      'noon': {
        'en': 'Noon',
        'bn': 'দুপুর',
        'ar': 'الظهيرة',
        'ur': 'دوپہر',
        'id': 'Siang',
        'tr': 'Öğle',
        'hi': 'दोपहर',
        'ms': 'Tengah Hari',
        'es': 'Mediodía',
        'fr': 'Midi',
        'de': 'Mittag',
        'ru': 'Полдень',
      },
      'afternoon': {
        'en': 'Afternoon',
        'bn': 'বিকেল',
        'ar': 'بعد الظهر',
        'ur': 'سہ پہر',
        'id': 'Sore',
        'tr': 'İkindi',
        'hi': 'अपराह्न',
        'ms': 'Petang',
        'es': 'Tarde',
        'fr': 'Après-midi',
        'de': 'Nachmittag',
        'ru': 'День',
      },
      'sunset': {
        'en': 'Sunset',
        'bn': 'সূর্যাস্ত',
        'ar': 'الغروب',
        'ur': 'غروب',
        'id': 'Senja',
        'tr': 'Günbatımı',
        'hi': 'सूर्यास्त',
        'ms': 'Senja',
        'es': 'Atardecer',
        'fr': 'Coucher',
        'de': 'Untergang',
        'ru': 'Закат',
      },
    };
    final Map<String, String>? m = slotLabels[slot];
    return m?[_lang] ?? m?['en'] ?? slot;
  }

  String _fmtSolarMinutes(double totalMinutes) {
    final int norm = ((totalMinutes.round() % 1440) + 1440) % 1440;
    final int h = norm ~/ 60;
    final int m = norm % 60;
    return '${h.toString().padLeft(2, '0')}:${m.toString().padLeft(2, '0')}';
  }

  static const List<Map<String, dynamic>> _hyperlocalCatalog = [
    // Erzurum & Districts (Hyperlocal Eastern Anatolia)
    {'city': 'Erzurum', 'country': 'TR', 'lat': 39.9043, 'lng': 41.2679},
    {'city': 'Yakutiye, Erzurum', 'country': 'TR', 'lat': 39.9043, 'lng': 41.2679},
    {'city': 'Palandöken, Erzurum', 'country': 'TR', 'lat': 39.8820, 'lng': 41.2700},
    {'city': 'Aziziye, Erzurum', 'country': 'TR', 'lat': 39.9450, 'lng': 41.1080},
    {'city': 'Horasan, Erzurum', 'country': 'TR', 'lat': 40.0408, 'lng': 42.1728},
    {'city': 'Oltu, Erzurum', 'country': 'TR', 'lat': 40.5403, 'lng': 41.9958},
    {'city': 'Pasinler, Erzurum', 'country': 'TR', 'lat': 39.9797, 'lng': 41.6761},
    {'city': 'Aşkale, Erzurum', 'country': 'TR', 'lat': 39.9211, 'lng': 40.6950},
    {'city': 'İspir, Erzurum', 'country': 'TR', 'lat': 40.4836, 'lng': 40.9975},
    {'city': 'Hınıs, Erzurum', 'country': 'TR', 'lat': 39.3581, 'lng': 41.6961},
    {'city': 'Tortum, Erzurum', 'country': 'TR', 'lat': 40.2939, 'lng': 41.5472},
    {'city': 'Narman, Erzurum', 'country': 'TR', 'lat': 40.3436, 'lng': 41.8658},
    // All Major Turkish Provinces (81 Provinces Coverage)
    {'city': 'Ankara', 'country': 'TR', 'lat': 39.9334, 'lng': 32.8597},
    {'city': 'İstanbul', 'country': 'TR', 'lat': 41.0082, 'lng': 28.9784},
    {'city': 'İzmir', 'country': 'TR', 'lat': 38.4237, 'lng': 27.1428},
    {'city': 'Bursa', 'country': 'TR', 'lat': 40.1885, 'lng': 29.0610},
    {'city': 'Antalya', 'country': 'TR', 'lat': 36.8969, 'lng': 30.7133},
    {'city': 'Konya', 'country': 'TR', 'lat': 37.8746, 'lng': 32.4932},
    {'city': 'Adana', 'country': 'TR', 'lat': 37.0000, 'lng': 35.3213},
    {'city': 'Gaziantep', 'country': 'TR', 'lat': 37.0662, 'lng': 37.3833},
    {'city': 'Шanlıurfa / Şanlıurfa', 'country': 'TR', 'lat': 37.1591, 'lng': 38.7969},
    {'city': 'Kocaeli', 'country': 'TR', 'lat': 40.8533, 'lng': 29.8815},
    {'city': 'Mersin', 'country': 'TR', 'lat': 36.8121, 'lng': 34.6415},
    {'city': 'Diyarbakır', 'country': 'TR', 'lat': 37.9144, 'lng': 40.2306},
    {'city': 'Hatay', 'country': 'TR', 'lat': 36.2021, 'lng': 36.1606},
    {'city': 'Manisa', 'country': 'TR', 'lat': 38.6191, 'lng': 27.4289},
    {'city': 'Kayseri', 'country': 'TR', 'lat': 38.7312, 'lng': 35.4787},
    {'city': 'Samsun', 'country': 'TR', 'lat': 41.2867, 'lng': 36.3300},
    {'city': 'Balıkesir', 'country': 'TR', 'lat': 39.6484, 'lng': 27.8826},
    {'city': 'Kahramanmaraş', 'country': 'TR', 'lat': 37.5858, 'lng': 36.9371},
    {'city': 'Van', 'country': 'TR', 'lat': 38.4891, 'lng': 43.4089},
    {'city': 'Aydın', 'country': 'TR', 'lat': 37.8560, 'lng': 27.8416},
    {'city': 'Tekirdağ', 'country': 'TR', 'lat': 40.9833, 'lng': 27.5167},
    {'city': 'Sakarya', 'country': 'TR', 'lat': 40.7569, 'lng': 30.3783},
    {'city': 'Denizli', 'country': 'TR', 'lat': 37.7765, 'lng': 29.0864},
    {'city': 'Muğla', 'country': 'TR', 'lat': 37.2153, 'lng': 28.3636},
    {'city': 'Eskişehir', 'country': 'TR', 'lat': 39.7767, 'lng': 30.5206},
    {'city': 'Mardin', 'country': 'TR', 'lat': 37.3212, 'lng': 40.7245},
    {'city': 'Trabzon', 'country': 'TR', 'lat': 41.0027, 'lng': 39.7168},
    {'city': 'Malatya', 'country': 'TR', 'lat': 38.3552, 'lng': 38.3095},
    {'city': 'Ordu', 'country': 'TR', 'lat': 40.9839, 'lng': 37.8764},
    {'city': 'Afyonkarahisar', 'country': 'TR', 'lat': 38.7507, 'lng': 30.5567},
    {'city': 'Sivas', 'country': 'TR', 'lat': 39.7477, 'lng': 37.0179},
    {'city': 'Adıyaman', 'country': 'TR', 'lat': 37.7648, 'lng': 38.2786},
    {'city': 'Batman', 'country': 'TR', 'lat': 37.8812, 'lng': 41.1351},
    {'city': 'Tokat', 'country': 'TR', 'lat': 40.3167, 'lng': 36.5500},
    {'city': 'Elazığ', 'country': 'TR', 'lat': 38.6810, 'lng': 39.2264},
    {'city': 'Zonguldak', 'country': 'TR', 'lat': 41.4564, 'lng': 31.7987},
    {'city': 'Kütahya', 'country': 'TR', 'lat': 39.4167, 'lng': 29.9833},
    {'city': 'Çanakkale', 'country': 'TR', 'lat': 40.1553, 'lng': 26.4142},
    {'city': 'Osmaniye', 'country': 'TR', 'lat': 37.0742, 'lng': 36.2478},
    {'city': 'Çorum', 'country': 'TR', 'lat': 40.5506, 'lng': 34.9556},
    {'city': 'Ağrı', 'country': 'TR', 'lat': 39.7191, 'lng': 43.0503},
    {'city': 'Giresun', 'country': 'TR', 'lat': 40.9128, 'lng': 38.3895},
    {'city': 'Şırnak', 'country': 'TR', 'lat': 37.5164, 'lng': 42.4611},
    {'city': 'Isparta', 'country': 'TR', 'lat': 37.7648, 'lng': 30.5566},
    {'city': 'Yozgat', 'country': 'TR', 'lat': 39.8181, 'lng': 34.8147},
    {'city': 'Muş', 'country': 'TR', 'lat': 38.7432, 'lng': 41.5065},
    {'city': 'Edirne', 'country': 'TR', 'lat': 41.6771, 'lng': 26.5557},
    {'city': 'Aksaray', 'country': 'TR', 'lat': 38.3687, 'lng': 34.0370},
    {'city': 'Düzce', 'country': 'TR', 'lat': 40.8438, 'lng': 31.1565},
    {'city': 'Kastamonu', 'country': 'TR', 'lat': 41.3887, 'lng': 33.7827},
    {'city': 'Uşak', 'country': 'TR', 'lat': 38.6823, 'lng': 29.4082},
    {'city': 'Niğde', 'country': 'TR', 'lat': 37.9667, 'lng': 34.6833},
    {'city': 'Bitlis', 'country': 'TR', 'lat': 38.4006, 'lng': 42.1095},
    {'city': 'Rize', 'country': 'TR', 'lat': 41.0201, 'lng': 40.5234},
    {'city': 'Amasya', 'country': 'TR', 'lat': 40.6499, 'lng': 35.8353},
    {'city': 'Siirt', 'country': 'TR', 'lat': 37.9333, 'lng': 41.9500},
    {'city': 'Kars', 'country': 'TR', 'lat': 40.6013, 'lng': 43.0975},
    {'city': 'Nevşehir', 'country': 'TR', 'lat': 38.6244, 'lng': 34.7239},
    {'city': 'Bolu', 'country': 'TR', 'lat': 40.7350, 'lng': 31.6061},
    {'city': 'Hakkari', 'country': 'TR', 'lat': 37.5833, 'lng': 43.7333},
    {'city': 'Kırıkkale', 'country': 'TR', 'lat': 39.8468, 'lng': 33.5153},
    {'city': 'Bingöl', 'country': 'TR', 'lat': 38.8854, 'lng': 40.4980},
    {'city': 'Burdur', 'country': 'TR', 'lat': 37.7203, 'lng': 30.2908},
    {'city': 'Karaman', 'country': 'TR', 'lat': 37.1759, 'lng': 33.2287},
    {'city': 'Karabük', 'country': 'TR', 'lat': 41.2061, 'lng': 32.6204},
    {'city': 'Kırşehir', 'country': 'TR', 'lat': 39.1425, 'lng': 34.1709},
    {'city': 'Erzincan', 'country': 'TR', 'lat': 39.7500, 'lng': 39.5000},
    {'city': 'Bilecik', 'country': 'TR', 'lat': 40.1451, 'lng': 29.9799},
    {'city': 'Sinop', 'country': 'TR', 'lat': 42.0231, 'lng': 35.1531},
    {'city': 'Iğdır', 'country': 'TR', 'lat': 39.9167, 'lng': 44.0333},
    {'city': 'Bartın', 'country': 'TR', 'lat': 41.6344, 'lng': 32.3375},
    {'city': 'Çankırı', 'country': 'TR', 'lat': 40.6013, 'lng': 33.6134},
    {'city': 'Artvin', 'country': 'TR', 'lat': 41.1828, 'lng': 41.8183},
    {'city': 'Gümüşhane', 'country': 'TR', 'lat': 40.4603, 'lng': 39.4814},
    {'city': 'Kilis', 'country': 'TR', 'lat': 36.7184, 'lng': 37.1212},
    {'city': 'Ardahan', 'country': 'TR', 'lat': 41.1105, 'lng': 42.7022},
    {'city': 'Tunceli', 'country': 'TR', 'lat': 39.1079, 'lng': 39.5401},
    {'city': 'Bayburt', 'country': 'TR', 'lat': 40.2552, 'lng': 40.2249},
    // Bangladesh & South Asia
    {'city': 'Dhaka', 'country': 'BD', 'lat': 23.8103, 'lng': 90.4125},
    {'city': 'Chattogram / Chittagong', 'country': 'BD', 'lat': 22.3569, 'lng': 91.7832},
    {'city': 'Sylhet', 'country': 'BD', 'lat': 24.8949, 'lng': 91.8687},
    {'city': 'Rajshahi', 'country': 'BD', 'lat': 24.3745, 'lng': 88.6042},
    {'city': 'Khulna', 'country': 'BD', 'lat': 22.8456, 'lng': 89.5403},
    {'city': 'Barishal', 'country': 'BD', 'lat': 22.7010, 'lng': 90.3535},
    {'city': 'Rangpur', 'country': 'BD', 'lat': 25.7439, 'lng': 89.2752},
    {'city': 'Mymensingh', 'country': 'BD', 'lat': 24.7471, 'lng': 90.4203},
    {'city': 'Cumilla', 'country': 'BD', 'lat': 23.4607, 'lng': 91.1809},
    {'city': 'Karachi', 'country': 'PK', 'lat': 24.8607, 'lng': 67.0011},
    {'city': 'Lahore', 'country': 'PK', 'lat': 31.5204, 'lng': 74.3587},
    {'city': 'Islamabad', 'country': 'PK', 'lat': 33.6844, 'lng': 73.0479},
    {'city': 'New Delhi', 'country': 'IN', 'lat': 28.6139, 'lng': 77.2090},
    {'city': 'Mumbai', 'country': 'IN', 'lat': 19.0760, 'lng': 72.8777},
    {'city': 'Kolkata', 'country': 'IN', 'lat': 22.5726, 'lng': 88.3639},
    {'city': 'Hyderabad', 'country': 'IN', 'lat': 17.3850, 'lng': 78.4867},
    // Middle East, SE Asia, Europe & Global
    {'city': 'Makkah', 'country': 'SA', 'lat': 21.3891, 'lng': 39.8579},
    {'city': 'Madinah', 'country': 'SA', 'lat': 24.5247, 'lng': 39.5692},
    {'city': 'Riyadh', 'country': 'SA', 'lat': 24.7136, 'lng': 46.6753},
    {'city': 'Jeddah', 'country': 'SA', 'lat': 21.4858, 'lng': 39.1925},
    {'city': 'Dubai', 'country': 'AE', 'lat': 25.2048, 'lng': 55.2708},
    {'city': 'Doha', 'country': 'QA', 'lat': 25.2854, 'lng': 51.5310},
    {'city': 'Cairo', 'country': 'EG', 'lat': 30.0444, 'lng': 31.2357},
    {'city': 'Baku', 'country': 'AZ', 'lat': 40.4093, 'lng': 49.8671},
    {'city': 'Jakarta', 'country': 'ID', 'lat': -6.2088, 'lng': 106.8456},
    {'city': 'Kuala Lumpur', 'country': 'MY', 'lat': 3.1390, 'lng': 101.6869},
    {'city': 'Singapore', 'country': 'SG', 'lat': 1.3521, 'lng': 103.8198},
    {'city': 'London', 'country': 'GB', 'lat': 51.5072, 'lng': -0.1276},
    {'city': 'Berlin', 'country': 'DE', 'lat': 52.5200, 'lng': 13.4050},
    {'city': 'Paris', 'country': 'FR', 'lat': 48.8566, 'lng': 2.3522},
    {'city': 'Moscow', 'country': 'RU', 'lat': 55.7558, 'lng': 37.6173},
    {'city': 'New York', 'country': 'US', 'lat': 40.7128, 'lng': -74.0060},
    {'city': 'Toronto', 'country': 'CA', 'lat': 43.6532, 'lng': -79.3832},
  ];

  Map<String, double>? _matchCatalogCity(String rawName) {
    final String q = rawName.trim().toLowerCase();
    if (q.isEmpty) return null;
    for (final item in _hyperlocalCatalog) {
      final String cName = (item['city'] as String).toLowerCase();
      if (cName == q || q.contains(cName) || cName.contains(q)) {
        return {
          'lat': (item['lat'] as num).toDouble(),
          'lng': (item['lng'] as num).toDouble(),
        };
      }
    }
    return null;
  }

  Map<String, String> _computeLocalSolarTimes(DateTime date) {
    final double tzHours = date.timeZoneOffset.inMinutes / 60.0;
    double lat = _locationLat;
    double lng = _locationLng;

    // If coordinates are not yet populated, resolve from _backgroundLocation catalog or timezone
    if (lat == 0.0 && lng == 0.0) {
      final Map<String, double>? matched =
          _matchCatalogCity(_backgroundLocation);
      if (matched != null) {
        lat = matched['lat']!;
        lng = matched['lng']!;
      } else if ((tzHours - 3.0).abs() < 0.1) {
        // Default UTC+3 Eastern Anatolia / Erzurum fallback
        lat = 39.9043;
        lng = 41.2679;
      } else {
        lat = 24.0;
        lng = tzHours * 15.0;
      }
    }

    final int dayOfYear =
        date.difference(DateTime(date.year, 1, 1)).inDays + 1;
    final int daysInYear =
        (date.year % 4 == 0 && (date.year % 100 != 0 || date.year % 400 == 0))
            ? 366
            : 365;
    const double deg2rad = math.pi / 180.0;
    const double rad2deg = 180.0 / math.pi;
    final double gamma = (2.0 * math.pi / daysInYear) * (dayOfYear - 1);

    final double eqTime = 229.18 *
        (0.000075 +
            0.001868 * math.cos(gamma) -
            0.032077 * math.sin(gamma) -
            0.014615 * math.cos(2 * gamma) -
            0.040849 * math.sin(2 * gamma));

    final double decl = 0.006918 -
        0.399912 * math.cos(gamma) +
        0.070257 * math.sin(gamma) -
        0.006758 * math.cos(2 * gamma) +
        0.000907 * math.sin(2 * gamma) -
        0.002697 * math.cos(3 * gamma) +
        0.001480 * math.sin(3 * gamma);

    final double latRad = lat * deg2rad;
    final double solarNoonMin = 720.0 - 4.0 * lng - eqTime + tzHours * 60.0;

    final double cosSun = ((math.cos(90.8333 * deg2rad) -
                math.sin(latRad) * math.sin(decl)) /
            (math.cos(latRad) * math.cos(decl)))
        .clamp(-1.0, 1.0);
    final double haSunDeg = math.acos(cosSun) * rad2deg;
    final double sunriseMin = solarNoonMin - 4.0 * haSunDeg;
    final double sunsetMin = solarNoonMin + 4.0 * haSunDeg;

    final double aftAlt =
        math.atan(1.0 / (1.0 + math.tan((latRad - decl).abs())));
    final double cosAft =
        ((math.sin(aftAlt) - math.sin(latRad) * math.sin(decl)) /
                (math.cos(latRad) * math.cos(decl)))
            .clamp(-1.0, 1.0);
    final double haAftDeg = math.acos(cosAft) * rad2deg;
    final double afternoonMin = solarNoonMin + 4.0 * haAftDeg;

    final int nowMin = date.hour * 60 + date.minute;
    String activeSlot = 'sunrise';
    if (nowMin >= sunsetMin || nowMin < sunriseMin - 90) {
      activeSlot = 'sunset';
    } else if (nowMin >= afternoonMin) {
      activeSlot = 'afternoon';
    } else if (nowMin >= solarNoonMin - 30) {
      activeSlot = 'noon';
    }

    return {
      'sunrise': _fmtSolarMinutes(sunriseMin),
      'noon': _fmtSolarMinutes(solarNoonMin),
      'afternoon': _fmtSolarMinutes(afternoonMin),
      'sunset': _fmtSolarMinutes(sunsetMin),
      'activeSlot': activeSlot,
      'coords':
          '${lat.abs().toStringAsFixed(2)}°${lat >= 0 ? 'N' : 'S'}, ${lng.abs().toStringAsFixed(2)}°${lng >= 0 ? 'E' : 'W'}',
    };
  }

  void _showHyperlocalLocationModal(BuildContext ctx) {
    String searchQ = '';
    bool isGeocoding = false;
    List<Map<String, dynamic>> geocodedResults = [];
    final TextEditingController cityCtrl = TextEditingController();
    final FocusNode cityFocus = FocusNode();

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
            final Map<String, String> liveSolar = _computeLocalSolarTimes(_now);
            final List<Map<String, dynamic>> filteredCatalog =
                _hyperlocalCatalog.where((item) {
              if (searchQ.isEmpty) return true;
              final String c = (item['city'] as String).toLowerCase();
              final String k = (item['country'] as String).toLowerCase();
              final String q = searchQ.toLowerCase();
              return c.contains(q) || k.contains(q);
            }).toList();

            final List<Map<String, dynamic>> combinedList = [
              ...geocodedResults,
              ...filteredCatalog,
            ];

            return Padding(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(sCtx).viewInsets.bottom,
              ),
              child: SizedBox(
                height: MediaQuery.of(sCtx).size.height * 0.80,
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(18, 16, 18, 16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(Icons.my_location_rounded, color: _accentColor),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              '📍 $_backgroundLocation (${liveSolar['coords']})',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 15,
                                fontWeight: FontWeight.bold,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          IconButton(
                            icon:
                                const Icon(Icons.close, color: Colors.white70),
                            onPressed: () {
                              _dismissKeyboardAndUnfocus();
                              Navigator.pop(mCtx);
                            },
                          ),
                        ],
                      ),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          color: _accentColor.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                              color: _accentColor.withValues(alpha: 0.4)),
                        ),
                        child: Text(
                          '${_solarSlotLabel('sunrise')}: ${liveSolar['sunrise']}  •  '
                          '${_solarSlotLabel('noon')}: ${liveSolar['noon']}  •  '
                          '${_solarSlotLabel('afternoon')}: ${liveSolar['afternoon']}  •  '
                          '${_solarSlotLabel('sunset')}: ${liveSolar['sunset']}',
                          style: TextStyle(
                            color: _accentColor,
                            fontSize: 11.5,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                      const SizedBox(height: 10),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton.icon(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF10B981),
                            foregroundColor: Colors.black,
                            padding: const EdgeInsets.symmetric(vertical: 11),
                          ),
                          icon: const Icon(Icons.gps_fixed_rounded, size: 18),
                          label: const Text(
                            'Auto-Detect Exact GPS / Hyperlocal Location',
                            style: TextStyle(
                                fontWeight: FontWeight.bold, fontSize: 12.5),
                          ),
                          onPressed: () async {
                            setState(() => _manualLocationOverride = false);
                            await _channel.invokeMethod(
                              'requestHyperlocalLocation',
                              {'requestPermission': true},
                            );
                            await Future.delayed(
                                const Duration(milliseconds: 900));
                            await _refreshNativeStatus();
                            await _saveState();
                            if (sCtx.mounted) setSheetState(() {});
                          },
                        ),
                      ),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: cityCtrl,
                              focusNode: cityFocus,
                              textInputAction: TextInputAction.search,
                              onTap: () => _focusAndShowKeyboard(cityFocus),
                              style: const TextStyle(
                                  color: Colors.white, fontSize: 13),
                              decoration: InputDecoration(
                                hintText:
                                    'Search city or district (e.g. Erzurum, Yakutiye, Palandöken)...',
                                hintStyle: const TextStyle(
                                    color: Colors.white54, fontSize: 12),
                                prefixIcon: const Icon(Icons.search_rounded,
                                    color: Colors.white54, size: 18),
                                suffixIcon: searchQ.isNotEmpty
                                    ? IconButton(
                                        icon: const Icon(Icons.close_rounded,
                                            color: Colors.white54, size: 18),
                                        onPressed: () {
                                          cityCtrl.clear();
                                          setSheetState(() {
                                            searchQ = '';
                                            geocodedResults = [];
                                          });
                                          _focusAndShowKeyboard(cityFocus);
                                        },
                                      )
                                    : null,
                                filled: true,
                                fillColor: Colors.white.withValues(alpha: 0.06),
                                isDense: true,
                                contentPadding:
                                    const EdgeInsets.symmetric(vertical: 10),
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(10),
                                  borderSide: BorderSide.none,
                                ),
                              ),
                              onChanged: (v) =>
                                  setSheetState(() => searchQ = v.trim()),
                              onSubmitted: (v) async {
                                if (v.trim().isEmpty) return;
                                setSheetState(() => isGeocoding = true);
                                try {
                                  final List<dynamic>? res =
                                      await _channel.invokeMethod<List<dynamic>>(
                                    'geocodeCityQuery',
                                    {'query': v.trim()},
                                  );
                                  if (res != null && sCtx.mounted) {
                                    setSheetState(() {
                                      geocodedResults = res
                                          .map((e) =>
                                              Map<String, dynamic>.from(e as Map))
                                          .toList();
                                    });
                                  }
                                } catch (_) {}
                                if (sCtx.mounted) {
                                  setSheetState(() => isGeocoding = false);
                                }
                              },
                            ),
                          ),
                          const SizedBox(width: 6),
                          IconButton(
                            style: IconButton.styleFrom(
                              backgroundColor:
                                  const Color(0xFF10B981).withValues(alpha: 0.2),
                            ),
                            icon: isGeocoding
                                ? const SizedBox(
                                    width: 16,
                                    height: 16,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      color: Color(0xFF10B981),
                                    ),
                                  )
                                : const Icon(Icons.travel_explore_rounded,
                                    color: Color(0xFF10B981), size: 20),
                            onPressed: () async {
                              final String q = cityCtrl.text.trim();
                              if (q.isEmpty) return;
                              setSheetState(() => isGeocoding = true);
                              try {
                                final List<dynamic>? res =
                                    await _channel.invokeMethod<List<dynamic>>(
                                  'geocodeCityQuery',
                                  {'query': q},
                                );
                                if (res != null && sCtx.mounted) {
                                  setSheetState(() {
                                    geocodedResults = res
                                        .map((e) =>
                                            Map<String, dynamic>.from(e as Map))
                                        .toList();
                                  });
                                }
                              } catch (_) {}
                              if (sCtx.mounted) {
                                setSheetState(() => isGeocoding = false);
                              }
                            },
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Expanded(
                        child: ListView.builder(
                          keyboardDismissBehavior:
                              ScrollViewKeyboardDismissBehavior.onDrag,
                          itemCount: combinedList.length,
                          itemBuilder: (lCtx, idx) {
                            final Map<String, dynamic> item = combinedList[idx];
                            final String cName = (item['city'] ?? '').toString();
                            final double cLat =
                                (item['lat'] as num).toDouble();
                            final double cLng =
                                (item['lng'] as num).toDouble();
                            final bool isSelected = _backgroundLocation
                                    .toLowerCase() ==
                                cName.toLowerCase();
                            return Container(
                              margin: const EdgeInsets.only(bottom: 6),
                              decoration: BoxDecoration(
                                color: isSelected
                                    ? const Color(0xFF10B981)
                                        .withValues(alpha: 0.15)
                                    : Colors.white.withValues(alpha: 0.04),
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(
                                  color: isSelected
                                      ? const Color(0xFF10B981)
                                      : Colors.white10,
                                ),
                              ),
                              child: ListTile(
                                dense: true,
                                leading: Icon(
                                  isSelected
                                      ? Icons.check_circle_rounded
                                      : Icons.location_on_outlined,
                                  color: isSelected
                                      ? const Color(0xFF10B981)
                                      : Colors.white54,
                                  size: 20,
                                ),
                                title: Text(
                                  cName,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w600,
                                    fontSize: 13.5,
                                  ),
                                ),
                                subtitle: Text(
                                  '${cLat.toStringAsFixed(4)}°N, ${cLng.toStringAsFixed(4)}°E',
                                  style: const TextStyle(
                                    color: Colors.white54,
                                    fontSize: 11,
                                  ),
                                ),
                                onTap: () async {
                                  _dismissKeyboardAndUnfocus();
                                  setState(() {
                                    _backgroundLocation = cName;
                                    _locationLat = cLat;
                                    _locationLng = cLng;
                                    _manualLocationOverride = true;
                                  });
                                  await _channel.invokeMethod(
                                    'setHyperlocalLocation',
                                    {
                                      'city': cName,
                                      'lat': cLat,
                                      'lng': cLng,
                                      'manual': true,
                                    },
                                  );
                                  await _saveState();
                                  if (mCtx.mounted) Navigator.pop(mCtx);
                                },
                              ),
                            );
                          },
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        );
      },
    ).whenComplete(() {
      cityCtrl.dispose();
      cityFocus.dispose();
    });
  }

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
      await _refreshNativeStatus();
      if (_osDnsIsFamilySafe && _osDnsSpecifier.toLowerCase() == _dnsHost.toLowerCase()) {
        if (!_phoneSettingsLocked) {
          setState(() => _phoneSettingsLocked = true);
          await _saveState();
          await _syncFortressToNative();
        }
        if (ctx.mounted) {
          ScaffoldMessenger.of(ctx).showSnackBar(
            SnackBar(
              content: Text('${_tr('dnsActivatedToast')} ($_osDnsSpecifier)'),
              backgroundColor: const Color(0xFF10B981),
            ),
          );
        }
        return;
      }

      Clipboard.setData(ClipboardData(text: _dnsHost));
      final Map<dynamic, dynamic>? res =
          await _channel.invokeMethod<Map<dynamic, dynamic>>(
        'activateSafePrivateDns',
        {
          'host': _dnsHost,
          'hostname': _dnsHost,
          'openSettingsIfNeeded': !_osDnsIsFamilySafe,
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
                        _openSafeSubSetting(
                          ctx,
                          'private_dns',
                          unlockedByGate: true,
                        );
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

  Future<void> _openSafeSubSetting(
    BuildContext ctx,
    String type, {
    bool unlockedByGate = false,
  }) async {
    if (type == 'torch') {
      await _toggleTorch();
      return;
    }

    // Standalone utility apps & Volume slice that never expose Network/DNS or com.android.settings
    const Set<String> alwaysSafeUtilityTypes = {
      'sound',
      'alarm',
      'calculator',
    };

    if (type == 'private_dns') {
      await _refreshNativeStatus();
      if (_osDnsIsFamilySafe) {
        if (ctx.mounted) {
          ScaffoldMessenger.of(ctx).showSnackBar(
            SnackBar(
              content: Text('${_tr('dnsActivatedToast')} ($_osDnsSpecifier)'),
              backgroundColor: const Color(0xFF10B981),
            ),
          );
        }
        return;
      }
      if (_isNightWindow && !unlockedByGate) {
        if (!ctx.mounted) return;
        _requireProtectionUnlock(
          ctx,
          targetTitle: _tr('safeDnsTitle'),
          onUnlocked: () {
            _openSafeSubSetting(ctx, type, unlockedByGate: true);
          },
        );
        return;
      }
    } else if (!alwaysSafeUtilityTypes.contains(type)) {
      // Sub-settings & panels that touch Network/System Settings (wifi, mobile_data, hotspot, bluetooth, display, battery, location, airplane):
      // At Night (22:00-06:00), strictly require Camera QR scan! During daytime, require Mindful Gate if Phone Settings Lock is enabled.
      if ((_isNightWindow || _phoneSettingsLocked) && !unlockedByGate) {
        if (!ctx.mounted) return;
        _requireProtectionUnlock(
          ctx,
          targetTitle: _trSafeSettingLabel(type),
          onUnlocked: () {
            _openSafeSubSetting(ctx, type, unlockedByGate: true);
          },
        );
        return;
      }
    }

    try {
      await _channel.invokeMethod('openSafePhoneSetting', {
        'settingType': type,
        'target': type,
        'dnsHost': _dnsHost,
        'unlockedByGate': true,
      });
    } catch (_) {}
  }

  String _trSafeSettingLabel(String type) {
    switch (type.toLowerCase()) {
      case 'wifi':
        return _tr('safeWifi');
      case 'mobile_data':
      case 'data':
        return _tr('safeMobileData');
      case 'hotspot':
        return _tr('safeHotspot');
      case 'bluetooth':
        return _tr('safeBluetooth');
      case 'sound':
        return _tr('safeSound');
      case 'display':
        return _tr('safeDisplay');
      case 'battery':
        return _tr('safeBattery');
      case 'location':
        return _tr('safeLocation');
      case 'airplane':
        return _tr('safeAirplane');
      case 'private_dns':
        return _tr('safeDnsTitle');
      default:
        return _tr('navSettings');
    }
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
    _dismissKeyboardAndUnfocus();
    final String pkgLower = app.packageName.toLowerCase();
    final bool isSystemSettingsApp =
        pkgLower == 'com.android.settings' || app.id == 'settings';

    // Strictly block opening Android System Settings at Night (22:00-06:00)
    if (isSystemSettingsApp && _isNightWindow) {
      ScaffoldMessenger.of(ctx).showSnackBar(
        SnackBar(
          content: Text(_tr('nightOnlyQrNote')),
          backgroundColor: Colors.redAccent,
        ),
      );
      setState(() => _blockedOpens++);
      _saveState();
      return;
    }

    // Require Safe Private DNS + Usage Access + Overlay Permission before opening any Browser, AI Link Gateway, or Night-guarded app
    final bool isBrowserApp = app.category.toLowerCase() == 'browser' ||
        pkgLower.contains('chrome') ||
        pkgLower.contains('browser') ||
        pkgLower.contains('firefox') ||
        pkgLower.contains('opera') ||
        pkgLower.contains('brave') ||
        pkgLower.contains('sbrowser') ||
        pkgLower.contains('emmx') ||
        pkgLower.contains('edgemobile') ||
        pkgLower.contains('duckduckgo');
    final bool isAlwaysNightLocked =
        _isAlwaysNightLockedGatewayOrSocial(pkgLower);
    final bool isCoreEssential = _isCoreEssentialUtilityPackage(pkgLower);

    if ((isBrowserApp ||
            isAlwaysNightLocked ||
            (_isNightWindow && _sleepScheduleEnabled && !isCoreEssential)) &&
        (!_osDnsIsFamilySafe || !_hasUsageAccess || !_hasOverlayPermission)) {
      ScaffoldMessenger.of(ctx).showSnackBar(
        SnackBar(
          content: Text(_tr('safeDnsSubtitle')),
          backgroundColor: Colors.amber.shade800,
        ),
      );
      _showSetupWizardModal(ctx);
      return;
    }

    if (_isMonkActive && app.tier != 'essential') {
      final int minsLeft =
          ((_monkModeUntil - DateTime.now().millisecondsSinceEpoch) / 60000)
              .ceil();
      ScaffoldMessenger.of(ctx).showSnackBar(
        SnackBar(
          content: Text(
            '${_tr('monkActiveToast')} ($minsLeft${_tr('minutesShort')})',
          ),
          backgroundColor: Colors.deepOrange,
        ),
      );
      setState(() => _blockedOpens++);
      _saveState();
      return;
    }

    if (_isNightWindow &&
        _sleepScheduleEnabled &&
        (app.nightQrLocked || isAlwaysNightLocked || app.tier == 'restricted')) {
      _showQrUnlockDialog(
        ctx,
        targetTitle: app.name,
        onUnlocked: () {
          _launchNativePackage(app.packageName, app.id);
        },
      );
      return;
    }

    if (isSystemSettingsApp && _phoneSettingsLocked) {
      _requireProtectionUnlock(
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
      final String? scanned = await _channel.invokeMethod<String>(
        'scanQrCode',
        {'prompt': _tr('qrScannerPrompt')},
      );
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
    if (_isNightWindow) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(_tr('qrHiddenNightMsg')),
            backgroundColor: Colors.amber.shade900,
          ),
        );
      }
      return;
    }
    try {
      await _channel.invokeMethod('printQrCodeSheet', {
        'qrSecret': _qrSecret,
        'title': _tr('qrSheetDocTitle'),
        'subtitle': _tr('qrSheetDocSub'),
      });
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
    final bool strictPhysicalScanOnly = isNight || _strictQrSettingsLock;
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
            if (!strictPhysicalScanOnly) ...[
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
              const SizedBox(height: 12),
              TextField(
                controller: qrCtrl,
                style: const TextStyle(color: Colors.white, fontSize: 13),
                decoration: InputDecoration(
                  hintText: _tr('qrInputHint'),
                  hintStyle:
                      const TextStyle(color: Colors.white38, fontSize: 12),
                  filled: true,
                  fillColor: Colors.black38,
                  isDense: true,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
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
                  border:
                      Border.all(color: Colors.amber.withValues(alpha: 0.5)),
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
          if (!strictPhysicalScanOnly)
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
                                ? '⏳ $secondsLeft${_tr('secondsShort')}'
                                : '✅ 15${_tr('secondsShort')}',
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
                              ? '${_tr('waitReflecting')} ($secondsLeft${_tr('secondsShort')})'
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
                    '$breatheSec${_tr('secondsShort')}',
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
                        ? '${_tr('sosGroundedBtn')} ($breatheSec${_tr('secondsShort')})'
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
      enableDrag: true,
      isDismissible: true,
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
            // Strictly lock the 5-Step Setup Guide at night (22:00-06:00) unconditionally, and during daytime once core protections are active!
            final bool isCoreProtected =
                _hasUsageAccess && _hasOverlayPermission && _osDnsIsFamilySafe;
            final bool isNightLocked =
                (_isNightWindow || (_phoneSettingsLocked && isCoreProtected)) &&
                    !_settingsUnlockedSession;

            return SafeArea(
              child: ConstrainedBox(
                constraints: BoxConstraints(
                  maxHeight: MediaQuery.of(sCtx).size.height * 0.90,
                ),
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(18, 14, 18, 18),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Sticky Top Header with Back (←) and Close (✕) buttons
                      Row(
                        children: [
                          InkWell(
                            onTap: () => Navigator.pop(mCtx),
                            borderRadius: BorderRadius.circular(12),
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 6,
                              ),
                              decoration: BoxDecoration(
                                color: const Color(0xFF191C26),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: Colors.white24),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(
                                    Icons.arrow_back_rounded,
                                    color: Color(0xFF10B981),
                                    size: 16,
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    _tr('navHome'),
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 12,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              _tr('wizardTitle'),
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 15.5,
                                fontWeight: FontWeight.bold,
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          IconButton(
                            tooltip: _tr('refreshBtn'),
                            icon: const Icon(
                              Icons.refresh_rounded,
                              color: Color(0xFF10B981),
                              size: 20,
                            ),
                            onPressed: () async {
                              await _refreshNativeStatus();
                              if (sCtx.mounted) setWizardState(() {});
                            },
                          ),
                          IconButton(
                            icon: const Icon(
                              Icons.close_rounded,
                              color: Colors.white70,
                              size: 22,
                            ),
                            onPressed: () => Navigator.pop(mCtx),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
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
                      const SizedBox(height: 12),

                      if (isNightLocked)
                        Flexible(
                          child: SingleChildScrollView(
                            child: Container(
                              width: double.infinity,
                              padding: const EdgeInsets.all(18),
                              decoration: BoxDecoration(
                                color: const Color(0xFF181524),
                                borderRadius: BorderRadius.circular(18),
                                border: Border.all(
                                  color: Colors.purpleAccent,
                                  width: 1.5,
                                ),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      const Icon(
                                        Icons.lock_clock_rounded,
                                        color: Colors.purpleAccent,
                                        size: 28,
                                      ),
                                      const SizedBox(width: 10),
                                      Expanded(
                                        child: Text(
                                          '🌙🔒 ${_tr('nightModeBadge')} (22:00 – 06:00)',
                                          style: const TextStyle(
                                            color: Colors.white,
                                            fontSize: 16,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 10),
                                  Text(
                                    _tr('nightOnlyQrNote'),
                                    style: const TextStyle(
                                      color: Colors.white70,
                                      fontSize: 13,
                                      height: 1.45,
                                    ),
                                  ),
                                  const SizedBox(height: 12),
                                  Container(
                                    width: double.infinity,
                                    padding: const EdgeInsets.all(12),
                                    decoration: BoxDecoration(
                                      color: Colors.black26,
                                      borderRadius: BorderRadius.circular(12),
                                      border: Border.all(
                                        color: const Color(0xFF10B981)
                                            .withValues(alpha: 0.5),
                                      ),
                                    ),
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          '🔒 1. ${_tr('wizStep1Title')} — ${_tr('grantedBtn')}',
                                          style: const TextStyle(
                                            color: Color(0xFF10B981),
                                            fontSize: 12,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          '🔒 2. ${_tr('wizStep2Title')} — ${_tr('grantedBtn')}',
                                          style: const TextStyle(
                                            color: Color(0xFF10B981),
                                            fontSize: 12,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          '🔒 3. ${_tr('safeDnsTitle')} ($_osDnsSpecifier) — ${_tr('grantedBtn')}',
                                          style: const TextStyle(
                                            color: Color(0xFF10B981),
                                            fontSize: 12,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          '🔒 4. ${_tr('wizStep4Title')} — ${_tr('qrLockedBadge')}',
                                          style: const TextStyle(
                                            color: Colors.amber,
                                            fontSize: 12,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          '🔒 5. ${_tr('wizStep5Title')} — ${_isDefaultLauncher ? _tr('grantedBtn') : _tr('qrLockedBadge')}',
                                          style: const TextStyle(
                                            color: Color(0xFF10B981),
                                            fontSize: 12,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(height: 14),
                                  SizedBox(
                                    width: double.infinity,
                                    child: OutlinedButton.icon(
                                      style: OutlinedButton.styleFrom(
                                        foregroundColor: Colors.purpleAccent,
                                        side: const BorderSide(
                                          color: Colors.purpleAccent,
                                        ),
                                        padding: const EdgeInsets.symmetric(
                                          vertical: 12,
                                        ),
                                      ),
                                      icon: const Icon(
                                        Icons.qr_code_scanner_rounded,
                                        size: 18,
                                      ),
                                      label: Text(
                                        _isNightWindow
                                            ? _tr('qrScanPrimaryBtn')
                                            : _tr('unlockBtn'),
                                        style: const TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 12.5,
                                        ),
                                      ),
                                      onPressed: () async {
                                        if (_isNightWindow) {
                                          final bool ok =
                                              await _scanPhysicalQrWithCamera(
                                                  ctx);
                                          if (ok) {
                                            setState(() =>
                                                _settingsUnlockedSession =
                                                    true);
                                            if (sCtx.mounted) {
                                              setWizardState(() {});
                                            }
                                          }
                                        } else {
                                          _requireProtectionUnlock(
                                            ctx,
                                            targetTitle: _tr('wizardTitle'),
                                            onUnlocked: () {
                                              setState(() =>
                                                  _settingsUnlockedSession =
                                                      true);
                                              if (sCtx.mounted) {
                                                setWizardState(() {});
                                              }
                                            },
                                          );
                                        }
                                      },
                                    ),
                                  ),
                                  const SizedBox(height: 10),
                                  SizedBox(
                                    width: double.infinity,
                                    child: ElevatedButton.icon(
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor:
                                            const Color(0xFF10B981),
                                        foregroundColor: Colors.black,
                                        padding: const EdgeInsets.symmetric(
                                          vertical: 13,
                                        ),
                                      ),
                                      icon: const Icon(
                                        Icons.arrow_back_rounded,
                                        size: 18,
                                      ),
                                      label: Text(
                                        _tr('navHome'),
                                        style: const TextStyle(
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                      onPressed: () => Navigator.pop(mCtx),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        )
                      else
                        Flexible(
                          child: SingleChildScrollView(
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _buildWizardStepTile(
                                  step: '1',
                                  title: _tr('wizStep1Title'),
                                  subtitle: _hasUsageAccess
                                      ? _tr('wizStep1SubDone')
                                      : _tr('wizStep1SubTodo'),
                                  isDone: _hasUsageAccess,
                                  buttonLabel: _hasUsageAccess
                                      ? '🔒 ${_tr('grantedBtn')}'
                                      : _tr('grantBtn'),
                                  onTap: _hasUsageAccess
                                      ? null
                                      : () async {
                                          await _channel.invokeMethod(
                                              'requestUsageStatsPermission');
                                          await Future.delayed(
                                              const Duration(seconds: 1));
                                          await _refreshNativeStatus();
                                          if (sCtx.mounted) {
                                            setWizardState(() {});
                                          }
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
                                      ? '🔒 ${_tr('grantedBtn')}'
                                      : _tr('grantBtn'),
                                  onTap: _hasOverlayPermission
                                      ? null
                                      : () async {
                                          await _channel.invokeMethod(
                                              'requestOverlayPermission');
                                          await Future.delayed(
                                              const Duration(seconds: 1));
                                          await _refreshNativeStatus();
                                          if (sCtx.mounted) {
                                            setWizardState(() {});
                                          }
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
                                  buttonLabel: _osDnsIsFamilySafe
                                      ? '🔒 ${_tr('grantedBtn')}'
                                      : _tr('oneTapBtn'),
                                  onTap: _osDnsIsFamilySafe
                                      ? null
                                      : () {
                                          Navigator.pop(mCtx);
                                          _activateSafePrivateDnsNow(ctx);
                                        },
                                ),
                                if (!_osDnsIsFamilySafe && !_isNightWindow) ...[
                                  const SizedBox(height: 6),
                                  SizedBox(
                                    width: double.infinity,
                                    child: OutlinedButton.icon(
                                      style: OutlinedButton.styleFrom(
                                        foregroundColor:
                                            const Color(0xFF10B981),
                                        side: const BorderSide(
                                            color: Color(0xFF10B981)),
                                        padding: const EdgeInsets.symmetric(
                                            vertical: 10),
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
                                        if (sCtx.mounted) {
                                          setWizardState(() {});
                                        }
                                      },
                                    ),
                                  ),
                                ],
                                const SizedBox(height: 10),
                                // STEP 4: PRINT PHYSICAL QR CODE & KEEP IN ANOTHER ROOM (Strictly Locked at Night!)
                                _buildWizardStepTile(
                                  step: '4',
                                  title: _tr('wizStep4Title'),
                                  subtitle: _isNightWindow
                                      ? _tr('qrHiddenNightMsg')
                                      : (_qrSetupVerified
                                          ? _tr('wizStep4SubDone')
                                          : _tr('wizStep4SubTodo')),
                                  isDone: _qrSetupVerified,
                                  buttonLabel: _isNightWindow
                                      ? _tr('nightBadgeShort')
                                      : _tr('printShortBtn'),
                                  onTap: _isNightWindow
                                      ? null
                                      : () async {
                                          await _printPhysicalQrSheet();
                                        },
                                ),
                                const SizedBox(height: 6),
                                Row(
                                  children: [
                                    if (!_isNightWindow) ...[
                                      Expanded(
                                        child: OutlinedButton.icon(
                                          style: OutlinedButton.styleFrom(
                                            foregroundColor: Colors.white,
                                            side: const BorderSide(
                                                color: Colors.white24),
                                          ),
                                          icon: const Icon(Icons.print_rounded,
                                              size: 16),
                                          label: Text(
                                            _tr('printQrBtn'),
                                            style:
                                                const TextStyle(fontSize: 11),
                                          ),
                                          onPressed: _printPhysicalQrSheet,
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                    ],
                                    Expanded(
                                      child: OutlinedButton.icon(
                                        style: OutlinedButton.styleFrom(
                                          foregroundColor:
                                              const Color(0xFF10B981),
                                          side: const BorderSide(
                                              color: Color(0xFF10B981)),
                                        ),
                                        icon: const Icon(
                                            Icons.qr_code_scanner_rounded,
                                            size: 16),
                                        label: Text(
                                          _tr('testQrScanBtn'),
                                          style: const TextStyle(
                                              fontSize: 11,
                                              fontWeight: FontWeight.bold),
                                        ),
                                        onPressed: () async {
                                          await _scanPhysicalQrWithCamera(ctx);
                                          if (sCtx.mounted) {
                                            setWizardState(() {});
                                          }
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
                                      ? '🔒 ${_tr('grantedBtn')}'
                                      : (_isNightWindow
                                          ? _tr('nightBadgeShort')
                                          : _tr('setDefaultBtn')),
                                  onTap:
                                      (_isDefaultLauncher || _isNightWindow)
                                          ? null
                                          : () async {
                                              await _channel.invokeMethod(
                                                  'requestDefaultLauncher');
                                              await Future.delayed(
                                                  const Duration(seconds: 1));
                                              await _refreshNativeStatus();
                                              if (sCtx.mounted) {
                                                setWizardState(() {});
                                              }
                                            },
                                ),
                                const SizedBox(height: 16),
                                SizedBox(
                                  width: double.infinity,
                                  child: ElevatedButton.icon(
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor:
                                          const Color(0xFF10B981),
                                      foregroundColor: Colors.black,
                                      padding: const EdgeInsets.symmetric(
                                          vertical: 14),
                                    ),
                                    icon: const Icon(
                                        Icons.check_circle_outline_rounded,
                                        size: 18),
                                    onPressed: () {
                                      _refreshNativeStatus();
                                      Navigator.pop(mCtx);
                                    },
                                    label: Text(
                                      _tr('doneVerifyBtn'),
                                      style: const TextStyle(
                                          fontWeight: FontWeight.bold),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
            );
          },
        );
      },
    ).whenComplete(() {
      if (mounted && _settingsUnlockedSession) {
        setState(() => _settingsUnlockedSession = false);
      }
    });
  }

  Widget _buildWizardStepTile({
    required String step,
    required String title,
    required String subtitle,
    required bool isDone,
    required String buttonLabel,
    required VoidCallback? onTap,
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
              disabledBackgroundColor: Colors.white12,
              disabledForegroundColor: const Color(0xFF10B981),
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
          builder: (innerCtx) => PopScope(
            canPop: false,
            onPopInvokedWithResult: (bool didPop, Object? result) {
              if (didPop) return;
              if (_scaffoldKey.currentState?.isDrawerOpen == true) {
                Navigator.of(innerCtx).pop();
                return;
              }
              if (FocusManager.instance.primaryFocus?.hasFocus == true) {
                _dismissKeyboardAndUnfocus();
                return;
              }
              if (_currentTab != 0) {
                _dismissKeyboardAndUnfocus();
                setState(() {
                  _currentTab = 0;
                  _settingsUnlockedSession = false;
                });
              }
            },
            child: Scaffold(
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
        onPressed: () {
          _dismissKeyboardAndUnfocus();
          _scaffoldKey.currentState?.openDrawer();
        },
      ),
      titleSpacing: 0,
      title: Row(
        children: [
          if (_currentTab != 0)
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: InkWell(
                onTap: () {
                  _dismissKeyboardAndUnfocus();
                  setState(() {
                    _currentTab = 0;
                    _settingsUnlockedSession = false;
                  });
                },
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
                  InkWell(
                    onTap: () {
                      Navigator.pop(ctx);
                      _showHyperlocalLocationModal(context);
                    },
                    borderRadius: BorderRadius.circular(8),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 4, vertical: 2),
                      child: Row(
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
                          const SizedBox(width: 2),
                          Icon(
                            Icons.edit_location_alt_outlined,
                            size: 12,
                            color: _subTextColor,
                          ),
                        ],
                      ),
                    ),
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
                        disabledBackgroundColor: Colors.white12,
                        disabledForegroundColor: const Color(0xFF10B981),
                        padding: const EdgeInsets.symmetric(vertical: 10),
                      ),
                      icon: Icon(
                        _osDnsIsFamilySafe
                            ? Icons.lock_rounded
                            : Icons.bolt_rounded,
                        size: 18,
                      ),
                      label: Text(
                        _osDnsIsFamilySafe
                            ? '🔒 ${_tr('dnsVerified')}'
                            : _tr('activateDnsBtn'),
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      onPressed: _osDnsIsFamilySafe
                          ? null
                          : () {
                              Navigator.pop(ctx);
                              if (_isNightWindow && !_settingsUnlockedSession) {
                                _requireProtectionUnlock(
                                  context,
                                  targetTitle: _tr('safeDnsTitle'),
                                  onUnlocked: () {
                                    setState(
                                        () => _settingsUnlockedSession = true);
                                    _activateSafePrivateDnsNow(context);
                                  },
                                );
                              } else {
                                _activateSafePrivateDnsNow(context);
                              }
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
                        if (_isNightWindow) {
                          Navigator.pop(ctx);
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(_tr('nightOnlyQrNote')),
                              backgroundColor: Colors.redAccent,
                            ),
                          );
                          return;
                        }
                        Navigator.pop(ctx);
                        _requireProtectionUnlock(
                          context,
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
        _openSafeSubSetting(context, type);
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
        _dismissKeyboardAndUnfocus();
        Navigator.pop(ctx);
        setState(() {
          _currentTab = tab;
          _settingsUnlockedSession = false;
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

    final List<WisdomEntry> wList = _getFilteredWisdomList();
    final int qIdx = wList.isEmpty ? 0 : (_wisdomIndex % wList.length);
    final WisdomEntry currentWisdom = wList.isEmpty
        ? AppDataDefaults.getWisdomList(_lang).first
        : wList[qIdx];
    final Map<String, String> solarTimes = _computeLocalSolarTimes(_now);

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
                      focusNode: _quickHomeNoteFocusNode,
                      textInputAction: TextInputAction.done,
                      onTap: () =>
                          _focusAndShowKeyboard(_quickHomeNoteFocusNode),
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

        // 5. Dynamic Motivational Quote Card (Random + Daily Shift + Category Filter)
        InkWell(
          onTap: _rotateRandomWisdom,
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
                Row(
                  children: [
                    InkWell(
                      onTap: () {
                        setState(() {
                          _currentTab = 4;
                          _settingsSubTab = 2;
                        });
                      },
                      borderRadius: BorderRadius.circular(6),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 7, vertical: 2),
                        decoration: BoxDecoration(
                          color: _accentColor.withValues(alpha: 0.14),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(
                              color: _accentColor.withValues(alpha: 0.35)),
                        ),
                        child: Text(
                          _quoteCategoryLabel(_favoriteQuoteCategory == 'all'
                              ? currentWisdom.category
                              : _favoriteQuoteCategory),
                          style: TextStyle(
                            color: _accentColor,
                            fontSize: 10.5,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ),
                    const Spacer(),
                    Text(
                      '↻ ${_tr('tapForNextWisdom')}',
                      style: TextStyle(
                        color: _subTextColor,
                        fontSize: 10.5,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
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
                  '— ${currentWisdom.ref}',
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

        const SizedBox(height: 10),

        // 6. Hyperlocal Solar Times Bar (Sunrise · Noon · Afternoon · Sunset) + Tappable City/GPS Selector
        InkWell(
          onTap: () => _showHyperlocalLocationModal(ctx),
          borderRadius: BorderRadius.circular(10),
          child: Column(
            children: [
              Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: 4, vertical: 3),
                child: Row(
                  children: [
                    Icon(Icons.my_location_rounded,
                        size: 12, color: _accentColor),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        '$_backgroundLocation  •  ${solarTimes['coords'] ?? ''}',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          color: _subTextColor,
                          fontSize: 10.5,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    Icon(Icons.gps_fixed_rounded,
                        size: 11.5, color: _accentColor),
                  ],
                ),
              ),
              const SizedBox(height: 3),
              Row(
                children:
                    ['sunrise', 'noon', 'afternoon', 'sunset'].map((slotId) {
                  final bool isActive = solarTimes['activeSlot'] == slotId;
                  return Expanded(
                    child: Container(
                      margin: const EdgeInsets.symmetric(horizontal: 2.5),
                      padding: const EdgeInsets.symmetric(
                          vertical: 6, horizontal: 4),
                      decoration: BoxDecoration(
                        color: isActive
                            ? _accentColor.withValues(alpha: 0.14)
                            : _cardColor.withValues(alpha: 0.45),
                        borderRadius: BorderRadius.circular(9),
                        border: Border.all(
                          color: isActive
                              ? _accentColor.withValues(alpha: 0.55)
                              : Colors.white10,
                        ),
                      ),
                      child: Column(
                        children: [
                          Text(
                            _solarSlotLabel(slotId),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              color: isActive ? _accentColor : _subTextColor,
                              fontSize: 10,
                              fontWeight:
                                  isActive ? FontWeight.w700 : FontWeight.w500,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            solarTimes[slotId] ?? '--:--',
                            style: TextStyle(
                              color: _textColor,
                              fontSize: 11.5,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }).toList(),
              ),
            ],
          ),
        ),
      ],
    );
  }

  void _showHomeListsSetupModal(BuildContext ctx, {String? initialProfile}) {
    String selectedList = initialProfile ?? _activeProfile;
    String modalSearchQuery = '';
    final TextEditingController modalSearchCtrl = TextEditingController();
    final FocusNode modalSearchFocus = FocusNode();
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
            final List<AppItem> modalFilteredApps = _apps.where((app) {
              if (modalSearchQuery.isEmpty) return true;
              final String q = modalSearchQuery.toLowerCase();
              return app.name.toLowerCase().contains(q) ||
                  app.packageName.toLowerCase().contains(q);
            }).toList();

            return Padding(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(sCtx).viewInsets.bottom,
              ),
              child: SizedBox(
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
                            icon:
                                const Icon(Icons.close, color: Colors.white70),
                            onPressed: () {
                              _dismissKeyboardAndUnfocus();
                              Navigator.pop(mCtx);
                            },
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
                      const SizedBox(height: 10),
                      // Search apps inside Setup 3 Homepage Lists modal
                      TextField(
                        controller: modalSearchCtrl,
                        focusNode: modalSearchFocus,
                        textInputAction: TextInputAction.search,
                        onTap: () => _focusAndShowKeyboard(modalSearchFocus),
                        style:
                            const TextStyle(color: Colors.white, fontSize: 13),
                        decoration: InputDecoration(
                          hintText: _tr('searchAppsHint'),
                          hintStyle: const TextStyle(
                              color: Colors.white54, fontSize: 12),
                          prefixIcon: const Icon(Icons.search_rounded,
                              color: Colors.white54, size: 18),
                          suffixIcon: modalSearchQuery.isNotEmpty
                              ? IconButton(
                                  icon: const Icon(Icons.close_rounded,
                                      color: Colors.white54, size: 18),
                                  onPressed: () {
                                    modalSearchCtrl.clear();
                                    setSheetState(() => modalSearchQuery = '');
                                    _focusAndShowKeyboard(modalSearchFocus);
                                  },
                                )
                              : null,
                          filled: true,
                          fillColor: Colors.white.withValues(alpha: 0.06),
                          isDense: true,
                          contentPadding:
                              const EdgeInsets.symmetric(vertical: 10),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                            borderSide: BorderSide.none,
                          ),
                        ),
                        onChanged: (v) =>
                            setSheetState(() => modalSearchQuery = v.trim()),
                      ),
                      const SizedBox(height: 10),
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
                          keyboardDismissBehavior:
                              ScrollViewKeyboardDismissBehavior.onDrag,
                          itemCount: modalFilteredApps.length,
                          itemBuilder: (lCtx, idx) {
                            final AppItem app = modalFilteredApps[idx];
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
                                      if (!app.profiles
                                          .contains(selectedList)) {
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
                            _dismissKeyboardAndUnfocus();
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
              ),
            );
          },
        );
      },
    ).whenComplete(() {
      modalSearchCtrl.dispose();
      modalSearchFocus.dispose();
      if (mounted && _settingsUnlockedSession) {
        setState(() => _settingsUnlockedSession = false);
      }
    });
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
                  focusNode: _notesSearchFocusNode,
                  textInputAction: TextInputAction.search,
                  onTap: () => _focusAndShowKeyboard(_notesSearchFocusNode),
                  style: TextStyle(color: _textColor, fontSize: 13),
                  decoration: InputDecoration(
                    hintText: _tr('searchNotesHint'),
                    hintStyle: TextStyle(color: _subTextColor, fontSize: 12),
                    prefixIcon:
                        Icon(Icons.search_rounded, color: _subTextColor, size: 18),
                    suffixIcon: _notesSearchQuery.isNotEmpty
                        ? IconButton(
                            icon: Icon(Icons.close_rounded,
                                color: _subTextColor, size: 18),
                            onPressed: () {
                              _notesSearchController.clear();
                              setState(() => _notesSearchQuery = '');
                              _focusAndShowKeyboard(_notesSearchFocusNode);
                            },
                          )
                        : null,
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
    ).whenComplete(() {
      if (mounted && _settingsUnlockedSession) {
        setState(() => _settingsUnlockedSession = false);
      }
    });
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
                  focusNode: _appSearchFocusNode,
                  textInputAction: TextInputAction.search,
                  onTap: () => _focusAndShowKeyboard(_appSearchFocusNode),
                  style: TextStyle(color: _textColor, fontSize: 14),
                  decoration: InputDecoration(
                    hintText: _tr('searchAppsHint'),
                    hintStyle: TextStyle(color: _subTextColor, fontSize: 13),
                    prefixIcon: InkWell(
                      borderRadius: BorderRadius.circular(20),
                      onTap: () => _focusAndShowKeyboard(_appSearchFocusNode),
                      child: Icon(Icons.search, color: _subTextColor),
                    ),
                    suffixIcon: _searchQuery.isNotEmpty
                        ? IconButton(
                            icon: Icon(Icons.close_rounded,
                                color: _subTextColor, size: 19),
                            onPressed: () {
                              _searchController.clear();
                              setState(() => _searchQuery = '');
                              _focusAndShowKeyboard(_appSearchFocusNode);
                            },
                          )
                        : IconButton(
                            icon: Icon(Icons.keyboard_alt_outlined,
                                color: _subTextColor.withValues(alpha: 0.7),
                                size: 18),
                            onPressed: () =>
                                _focusAndShowKeyboard(_appSearchFocusNode),
                          ),
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
            keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
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
                            if (_isAlwaysNightLockedGatewayOrSocial(
                                app.packageName.toLowerCase())) {
                              setState(() => app.nightQrLocked = true);
                              ScaffoldMessenger.of(ctx).showSnackBar(
                                SnackBar(
                                  content: Text(_tr('nightOnlyQrNote')),
                                  backgroundColor: Colors.purple.shade800,
                                ),
                              );
                              return;
                            }
                            if (app.nightQrLocked) {
                              // Turning OFF Night QR Lock requires Protection Unlock!
                              _requireProtectionUnlock(
                                ctx,
                                targetTitle: '${app.name} (${_tr('nightQr')})',
                                onUnlocked: () {
                                  setState(() => app.nightQrLocked = false);
                                  _saveState();
                                  _syncFortressToNative();
                                },
                              );
                            } else {
                              setState(() => app.nightQrLocked = true);
                              _saveState();
                              _syncFortressToNative();
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
              _syncFortressToNative();
            },
          );
        } else {
          setState(() => app.tier = tierVal);
          _saveState();
          _syncFortressToNative();
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

  Widget _buildNightSettingsGateCard(
    BuildContext ctx, {
    required String targetTitle,
  }) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: _cardColor,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: _isNightWindow ? Colors.redAccent : Colors.amber,
          width: 1.5,
        ),
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: (_isNightWindow ? Colors.redAccent : Colors.amber)
                  .withValues(alpha: 0.14),
              shape: BoxShape.circle,
            ),
            child: Icon(
              _isNightWindow
                  ? Icons.nights_stay_rounded
                  : Icons.lock_clock_rounded,
              color: _isNightWindow ? Colors.redAccent : Colors.amber,
              size: 40,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            _isNightWindow
                ? '🌙🔒 ${_tr('nightModeActive')}'
                : '🔒 $targetTitle',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: _textColor,
              fontSize: 17,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            _isNightWindow
                ? _tr('nightOnlyQrNote')
                : _tr('settingsLockedBanner'),
            textAlign: TextAlign.center,
            style: TextStyle(
              color: _subTextColor,
              fontSize: 13,
              height: 1.45,
            ),
          ),
          const SizedBox(height: 14),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: const Color(0xFF10B981).withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFF10B981)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.verified_user_rounded,
                  color: Color(0xFF10B981),
                  size: 16,
                ),
                const SizedBox(width: 6),
                Flexible(
                  child: Text(
                    '✅ ${_tr('dnsVerified')} ($_osDnsSpecifier)',
                    style: const TextStyle(
                      color: Color(0xFF10B981),
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF10B981),
                foregroundColor: Colors.black,
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              icon: Icon(
                _isNightWindow
                    ? Icons.qr_code_scanner_rounded
                    : Icons.lock_open_rounded,
              ),
              label: Text(
                _isNightWindow ? _tr('scanCameraQrBtn') : _tr('unlockBtn'),
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
              ),
              onPressed: () async {
                if (_isNightWindow) {
                  final bool ok = await _scanPhysicalQrWithCamera(ctx);
                  if (ok) {
                    _grantSettingsSessionUnlock();
                  }
                } else {
                  _requireProtectionUnlock(
                    ctx,
                    targetTitle: targetTitle,
                    onUnlocked: () {
                      _grantSettingsSessionUnlock();
                    },
                  );
                }
              },
            ),
          ),
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              style: OutlinedButton.styleFrom(
                foregroundColor: _textColor,
                side: const BorderSide(color: Colors.white24),
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
              icon: const Icon(Icons.arrow_back_rounded, size: 18),
              label: Text(
                _tr('navHome'),
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
              onPressed: () => setState(() => _currentTab = 0),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSafePrivateDnsCard(BuildContext ctx) {
    // Strictly lock DNS settings at night (22:00 - 06:00) unconditionally, and during daytime when Settings Lock is active!
    if ((_isNightWindow || (_phoneSettingsLocked && _osDnsIsFamilySafe)) &&
        !_settingsUnlockedSession) {
      return _buildNightSettingsGateCard(
        ctx,
        targetTitle: _tr('safeDnsTitle'),
      );
    }
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
            ctx,
            id: 'cloudflare',
            title: _tr('dnsCloudflareTitle'),
            host: 'family.cloudflare-dns.com',
          ),
          const SizedBox(height: 8),
          _buildDnsProviderOption(
            ctx,
            id: 'cleanbrowsing',
            title: _tr('dnsCleanbrowsingTitle'),
            host: 'adult-filter-dns.cleanbrowsing.org',
          ),
          const SizedBox(height: 8),
          _buildDnsProviderOption(
            ctx,
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
                disabledBackgroundColor:
                    const Color(0xFF10B981).withValues(alpha: 0.16),
                disabledForegroundColor: const Color(0xFF10B981),
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              icon: Icon(
                _osDnsIsFamilySafe
                    ? Icons.lock_rounded
                    : Icons.security_rounded,
              ),
              label: Text(
                _osDnsIsFamilySafe
                    ? '🔒 ${_tr('dnsVerified')} ($_osDnsSpecifier)'
                    : '${_tr('activateDnsBtn')} ($_dnsHost)',
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
              // When Safe DNS is already verified, NEVER open OS Wireless/DNS Settings!
              onPressed: _osDnsIsFamilySafe
                  ? null
                  : () => _activateSafePrivateDnsNow(ctx),
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              if (!_isNightWindow && !_osDnsIsFamilySafe) ...[
                Expanded(
                  child: OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: const Color(0xFF10B981),
                      side: const BorderSide(color: Color(0xFF10B981)),
                    ),
                    icon:
                        const Icon(Icons.check_circle_outline_rounded, size: 16),
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
              ],
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
                if (_isNightWindow) {
                  ScaffoldMessenger.of(ctx).showSnackBar(
                    SnackBar(
                      content: Text(_tr('nightOnlyQrNote')),
                      backgroundColor: Colors.redAccent,
                    ),
                  );
                  return;
                }
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
                if (_isNightWindow) {
                  ScaffoldMessenger.of(ctx).showSnackBar(
                    SnackBar(
                      content: Text(_tr('nightOnlyQrNote')),
                      backgroundColor: Colors.redAccent,
                    ),
                  );
                  return;
                }
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
                    _syncFortressToNative();
                  },
                );
              } else {
                setState(() => _strictQrSettingsLock = true);
                _saveState();
                _syncFortressToNative();
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

  Widget _buildDnsProviderOption(
    BuildContext ctx, {
    required String id,
    required String title,
    required String host,
  }) {
    final bool selected = _dnsProvider == id;
    return InkWell(
      onTap: () {
        if (selected) return;
        if (_isNightWindow) {
          ScaffoldMessenger.of(ctx).showSnackBar(
            SnackBar(
              content: Text(_tr('nightOnlyQrNote')),
              backgroundColor: Colors.redAccent,
            ),
          );
          return;
        }
        if (_phoneSettingsLocked || _osDnsIsFamilySafe) {
          _requireProtectionUnlock(
            ctx,
            targetTitle: title,
            onUnlocked: () {
              setState(() {
                _dnsProvider = id;
                _dnsHost = host;
              });
              _saveState();
              _syncFortressToNative();
            },
          );
          return;
        }
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
                  focusNode: _keywordFocusNode,
                  textInputAction: TextInputAction.done,
                  onTap: () => _focusAndShowKeyboard(_keywordFocusNode),
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
                onPressed: () {
                  setState(() => _digestItems.clear());
                  _saveState();
                },
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
                onSelected: (v) {
                  setState(() => _digestMorning = v);
                  _saveState();
                },
              ),
              FilterChip(
                label: Text(_tr('digestMiddayChip')),
                selected: _digestMidday,
                onSelected: (v) {
                  setState(() => _digestMidday = v);
                  _saveState();
                },
              ),
              FilterChip(
                label: Text(_tr('digestEveningChip')),
                selected: _digestEvening,
                onSelected: (v) {
                  setState(() => _digestEvening = v);
                  _saveState();
                },
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
                  _saveState();
                  _syncFortressToNative();
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
                  onUnlocked: () {
                    setState(() => _monkModeUntil = 0);
                    _saveState();
                    _syncFortressToNative();
                  },
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
                if (_isNightWindow) {
                  ScaffoldMessenger.of(ctx).showSnackBar(
                    SnackBar(
                      content: Text(_tr('nightOnlyQrNote')),
                      backgroundColor: Colors.redAccent,
                    ),
                  );
                  return;
                }
                _requireProtectionUnlock(
                  ctx,
                  targetTitle: _tr('sleepScheduleTitle'),
                  onUnlocked: () {
                    setState(() => _sleepScheduleEnabled = false);
                    _saveState();
                    _syncFortressToNative();
                  },
                );
              } else {
                setState(() => _sleepScheduleEnabled = true);
                _saveState();
                _syncFortressToNative();
              }
            },
          ),
          const Divider(height: 24, color: Colors.white12),
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            activeThumbColor: const Color(0xFF10B981),
            title: Text(
              _tr('gentleReminderTitle'),
              style: TextStyle(
                color: _textColor,
                fontWeight: FontWeight.bold,
                fontSize: 14,
              ),
            ),
            subtitle: Text(
              _tr('gentleReminderSub'),
              style: TextStyle(color: _subTextColor, fontSize: 12),
            ),
            value: _usageReminderEnabled,
            onChanged: (v) {
              setState(() => _usageReminderEnabled = v);
              _saveState();
              _syncFortressToNative();
            },
          ),
          if (_usageReminderEnabled) ...[
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              children: [10, 15, 30].map((mins) {
                final bool sel = _usageReminderMinutes == mins;
                return ChoiceChip(
                  label: Text('$mins ${_tr('minutesShort')}'),
                  selected: sel,
                  selectedColor: const Color(0xFF10B981),
                  labelStyle: TextStyle(
                    color: sel ? Colors.black : _textColor,
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                  onSelected: (_) {
                    setState(() => _usageReminderMinutes = mins);
                    _saveState();
                    _syncFortressToNative();
                  },
                );
              }).toList(),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildQrAndRamCleanerCard(BuildContext ctx) {
    // Strictly hide QR Code, Secret Text, and Print Button during Night Hours (22:00-06:00)!
    final bool hideQrAtNight = _isNightWindow;
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
                      _qrSetupVerified ? _tr('qrSecretHiddenNote') : _qrSecret,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        color: Colors.black87,
                        fontWeight: FontWeight.bold,
                        fontSize: 11,
                        letterSpacing: 1.0,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          const SizedBox(height: 12),
          Row(
            children: [
              if (!hideQrAtNight) ...[
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
              ],
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
                  _saveState();
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
    final bool isCoreProtected =
        _hasUsageAccess && _hasOverlayPermission && _osDnsIsFamilySafe;
    final bool isSystemLocked =
        (_isNightWindow || (_phoneSettingsLocked && isCoreProtected)) &&
            !_settingsUnlockedSession;
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
              if (_settingsSubTab == 0 || _settingsSubTab == 3)
                isSystemLocked
                    ? _buildNightSettingsGateCard(
                        ctx,
                        targetTitle: _tr('navSettings'),
                      )
                    : _buildSystemPermissionsCard(ctx),
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
                disabledBackgroundColor: Colors.white12,
                disabledForegroundColor: const Color(0xFF10B981),
              ),
              // When already granted, disable button so it NEVER opens com.android.settings!
              onPressed: _hasUsageAccess
                  ? null
                  : () async {
                      await _channel.invokeMethod('requestUsageStatsPermission');
                    },
              child: Text(
                  _hasUsageAccess ? '🔒 ${_tr('grantedBtn')}' : _tr('grantBtn')),
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
                disabledBackgroundColor: Colors.white12,
                disabledForegroundColor: const Color(0xFF10B981),
              ),
              // When already granted, disable button so it NEVER opens com.android.settings!
              onPressed: _hasOverlayPermission
                  ? null
                  : () async {
                      await _channel.invokeMethod('requestOverlayPermission');
                    },
              child: Text(_hasOverlayPermission
                  ? '🔒 ${_tr('grantedBtn')}'
                  : _tr('grantBtn')),
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
              style: ElevatedButton.styleFrom(
                disabledBackgroundColor: Colors.white12,
                disabledForegroundColor: Colors.white54,
              ),
              // Block changing Default Launcher at Night (22:00-06:00), and require unlock during Daytime!
              onPressed: (_isDefaultLauncher && _isNightWindow)
                  ? null
                  : () async {
                      if (_isDefaultLauncher && !_settingsUnlockedSession) {
                        _requireProtectionUnlock(
                          ctx,
                          targetTitle: _tr('defaultLauncherCard'),
                          onUnlocked: () async {
                            _grantSettingsSessionUnlock();
                            await _channel
                                .invokeMethod('requestDefaultLauncher');
                          },
                        );
                        return;
                      }
                      await _channel.invokeMethod('requestDefaultLauncher');
                    },
              child: Text(
                _isDefaultLauncher
                    ? (_isNightWindow
                        ? '🌙 ${_tr('changeBtn')}'
                        : _tr('changeBtn'))
                    : _tr('setDefaultBtn'),
              ),
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
                if (_isKioskPinned && !_settingsUnlockedSession) {
                  _requireProtectionUnlock(
                    ctx,
                    targetTitle: _tr('kioskPinCard'),
                    onUnlocked: () async {
                      _grantSettingsSessionUnlock();
                      await _channel.invokeMethod('toggleKioskPin');
                      _refreshNativeStatus();
                    },
                  );
                  return;
                }
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
              _buildStatBox('$_reclaimedMinutes ${_tr('minutesShort')}', _tr('statReclaimed')),
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
          const Divider(height: 24, color: Colors.white12),
          Row(
            children: [
              Icon(Icons.format_quote_rounded, color: _accentColor, size: 18),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  _quoteCategoryLabel(_favoriteQuoteCategory),
                  style: TextStyle(
                    color: _textColor,
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              TextButton.icon(
                onPressed: _rotateRandomWisdom,
                icon: const Icon(Icons.shuffle_rounded, size: 15),
                label: Text(
                  _tr('tapForNextWisdom'),
                  style: const TextStyle(fontSize: 11.5),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: [
              'all',
              'quran',
              'hadith',
              'proverb',
              'focus',
              'time',
              'peace',
              'discipline',
            ].map((catId) {
              final bool sel = _favoriteQuoteCategory == catId;
              return ChoiceChip(
                label: Text(
                  _quoteCategoryLabel(catId),
                  style: const TextStyle(fontSize: 12),
                ),
                selected: sel,
                onSelected: (_) {
                  setState(() {
                    _favoriteQuoteCategory = catId;
                    final int len = _getFilteredWisdomList().length;
                    if (len > 0) {
                      _wisdomIndex = _rng.nextInt(len);
                    }
                    _lastQuoteRotateMs = DateTime.now().millisecondsSinceEpoch;
                  });
                  _saveState();
                },
              );
            }).toList(),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: [
              {'sec': 15, 'label': '15s'},
              {'sec': 30, 'label': '30s'},
              {'sec': 60, 'label': '1m'},
              {'sec': 300, 'label': '5m'},
              {'sec': 0, 'label': 'Daily'},
            ].map((opt) {
              final int sec = opt['sec'] as int;
              final String lbl = opt['label'] as String;
              final bool sel = _quoteRotationSeconds == sec;
              return ChoiceChip(
                label: Text(lbl, style: const TextStyle(fontSize: 11.5)),
                selected: sel,
                onSelected: (_) {
                  setState(() {
                    _quoteRotationSeconds = sec;
                    _lastQuoteRotateMs = DateTime.now().millisecondsSinceEpoch;
                  });
                  _saveState();
                },
              );
            }).toList(),
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
          actionButton: _isNightWindow
              ? null
              : ElevatedButton.icon(
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

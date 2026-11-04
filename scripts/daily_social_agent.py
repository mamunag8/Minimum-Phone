#!/usr/bin/env python3
"""
Minimum Phone: Detox & Focus — Daily Social Media Content & Monochrome Tip Card Generator
Generates non-repeating daily "How Minimum Phone Helps You" posts and 1200x630 OLED monochrome
visual cards for Morning Focus (9:00 AM) and Evening Wind-Down (6:00 PM) editions.
"""

import argparse
import datetime
import json
import os
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT_DIR = Path(r"d:\Kasb llc\dev\Apps\Minimum Phone")
HISTORY_PATH = ROOT_DIR / "docs" / "social-post-history.json"
DAILY_GRAPHICS_DIR = ROOT_DIR / "play-store-submission" / "graphics" / "social" / "daily"
LATEST_PAYLOAD_PATH = DAILY_GRAPHICS_DIR / "latest_post_payload.json"

# Curated non-repeating curriculum of practical daily ways Minimum Phone helps people
CURRICULUM = [
    {
        "id": "tip-001-morning-reflex-loop",
        "slot": "morning",
        "pillar": "Anti-Dopamine Launcher & Inhale Gatekeeper",
        "badge": "MORNING FOCUS PROTOCOL // PILLAR 01",
        "title": "Break the 7:00 AM Bedside Scroll Reflex",
        "problem": "Reaching for your phone within 60 seconds of waking hijacks your prefrontal cortex with artificial dopamine before your feet even touch the floor.",
        "solution": "Minimum Phone's Pure Monochrome Home Screen + 10-Second Inhale Gatekeeper replaces morning doomscrolling with intentional stillness.",
        "steps": [
            "1. Enable Pure OLED Black Home Screen with only 5 essential text tools.",
            "2. Put social & news apps behind the 10s Inhale Breathing Intercept.",
            "3. Bid a strict 3-minute micro-intent limit only when truly needed."
        ],
        "quote": "\"Guard your morning hours; how you begin the day shapes the stillness of your heart.\"",
        "discussion_question": "What is the very first app you used to open out of habit in the morning — and how has adding a 10-second breathing pause changed your mornings?",
        "hashtags": "#MinimumPhone #DigitalDetox #MorningRoutine #AntiDopamine #DeepWork #CalmMind #MindfulTech #AndroidLauncher"
    },
    {
        "id": "tip-002-evening-digital-sunset",
        "slot": "evening",
        "pillar": "Evening Digital Sunset & Night Guard",
        "badge": "EVENING WIND-DOWN // PILLAR 02",
        "title": "Reclaim Deep Sleep with the 9:00 PM Digital Sunset",
        "problem": "Late-night blue light and infinite-scroll feeds suppress melatonin by up to 50% and keep your nervous system trapped in low-grade anxiety.",
        "solution": "Switch Minimum Phone to the Evening Digital Sunset profile + Hardware Grayscale to signal to your brain that the workday is over.",
        "steps": [
            "1. Activate 'Sunset Profile' on your Home Screen after 8:30 PM.",
            "2. Toggle Hardware Grayscale & Sunset Amber surface theme in 1 tap.",
            "3. Let Night Guard auto-lock browsers & feeds from 11:00 PM to 6:00 AM."
        ],
        "quote": "\"A quiet mind at night is richer than a crown.\"",
        "discussion_question": "What time do you put your phone into Sunset / Grayscale mode each night to protect your sleep?",
        "hashtags": "#MinimumPhone #DigitalSunset #SleepHygiene #CalmMind #NightGuard #DigitalWellbeing #ScreenTimeDetox"
    },
    {
        "id": "tip-003-micro-intent-time-bidding",
        "slot": "morning",
        "pillar": "Inhale Intercept & Micro-Intent Bidding",
        "badge": "INTENTIONAL TECH // PILLAR 03",
        "title": "Stop 'Just Checking for 1 Minute' Turning into 45 Minutes",
        "problem": "You unlock your phone to reply to a single message, see a red notification dot, and lose 45 minutes in an algorithmic rabbit hole.",
        "solution": "Minimum Phone's Micro-Intent Bidding forces you to declare WHY you are opening a restricted app and bid a hard countdown (1m, 3m, 5m, or 15m).",
        "steps": [
            "1. Type the restricted app name in the Asymmetric Search Drawer.",
            "2. Inhale for 5–15 seconds while reading a short (<14 word) Calm Trigger.",
            "3. Select your exact intent & time bid (e.g., '3m — Reply to DM')."
        ],
        "quote": "\"Leave that which does not concern you to protect what truly matters.\"",
        "discussion_question": "When you have to pick a time bid (1m, 3m, 5m, or 15m) before opening an app, how often do you realize you didn't actually need to open it at all?",
        "hashtags": "#MinimumPhone #IntentionalLiving #TimeBidding #FocusTools #StopScrolling #DigitalMinimalism #Mindfulness"
    },
    {
        "id": "tip-004-twice-daily-notification-digest",
        "slot": "evening",
        "pillar": "Twice-Daily Notification Digest (12 PM & 6 PM)",
        "badge": "CALM ATTENTION // PILLAR 04",
        "title": "Cure Phantom Phone Vibrations with Twice-Daily Digests",
        "problem": "Research shows every notification ping costs 23 minutes of refocused attention—even if you don't unlock your phone.",
        "solution": "Minimum Phone batches all non-urgent notifications into two calm daily digests at 12:00 PM and 6:00 PM while letting VIP family & 'URGENT' texts through immediately.",
        "steps": [
            "1. Add your spouse, family, or key teammates to the VIP Breakthrough list.",
            "2. Let Minimum Phone hold promo pings, group chats, and social alerts.",
            "3. Review your clean batched summary at 12:00 PM and 6:00 PM in 3 minutes."
        ],
        "quote": "\"All quiet · 0 urgent alerts · Your attention belongs to you.\"",
        "discussion_question": "How many notifications per day were interrupting your focus before switching to the 12:00 PM & 6:00 PM Digest?",
        "hashtags": "#MinimumPhone #NotificationDetox #DeepWork #CalmMindOS #ProductivityHacks #FocusPod #ZeroDistractions"
    },
    {
        "id": "tip-005-physical-qr-brick-lock",
        "slot": "morning",
        "pillar": "Free Printable QR / NFC Physical Brick Lock",
        "badge": "DEEP WORK HARDWARE-FREE // PILLAR 05",
        "title": "Turn Any Piece of Paper into a $0 Physical Phone Brick",
        "problem": "Competitor hardware dongles charge $50–$60 just to lock your distracting apps via NFC or QR.",
        "solution": "Minimum Phone includes a 100% free Printable QR / NFC Physical Lock ('KASB-BRICK-77'). Tape the printed QR card in your kitchen or hallway to make unlocking effortless distractions require a physical walk.",
        "steps": [
            "1. Print or save your KASB-BRICK-77 QR code from the Focus Pod tab.",
            "2. Tape the QR card on your fridge or across the house.",
            "3. Lock distracting apps during Deep Work—unlocking early requires walking to scan the card."
        ],
        "quote": "\"Physical distance defeats digital impulse every single time.\"",
        "discussion_question": "Where did you place your KASB-BRICK-77 QR card to keep your workspace 100% distraction-free?",
        "hashtags": "#MinimumPhone #FocusPod #DeepWork #PhysicalBrick #DigitalDetox #FreeUtility #StudentFocus #DeveloperLife"
    },
    {
        "id": "tip-006-urge-sos-90day-purity",
        "slot": "evening",
        "pillar": "90-Day Neuro-Reset & 1-Tap Urge SOS Shield",
        "badge": "NEURO-RESET & PURITY // PILLAR 06",
        "title": "Defeat Late-Night Dopamine & Compulsive Urges in 60 Seconds",
        "problem": "Compulsive late-night browsing thrives in isolation, fatigue, and split-second impulse loops.",
        "solution": "Minimum Phone's 3-Layer Content Shield + 1-Tap 'URGE SOS — Ground My Mind Now' button interrupts the dopamine spike with guided breathing, posture reset, and system-level DNS filtering.",
        "steps": [
            "1. Enable the 3-Layer Shield: Safe DNS (1.1.1.3) + Keyword Guard + Night Guard.",
            "2. When an urge hits, tap 'URGE SOS' for an immediate 60s grounding protocol.",
            "3. Track your live clean streak across Day 3, 7, 14, 30, and 90 neuro-rewiring milestones."
        ],
        "quote": "\"Mastery over a single impulse is stronger than a thousand regrets.\"",
        "discussion_question": "Which layer of the Neuro-Reset & Purity Shield has helped you the most—Safe DNS, Night Guard, or the 60-second Urge SOS button?",
        "hashtags": "#MinimumPhone #NeuroReset #DopamineDetox #SelfMastery #PurityGuard #CalmMind #MentalClarity #90DayReset"
    },
    {
        "id": "tip-007-slow-learning-quiz-gate",
        "slot": "morning",
        "pillar": "Slow Learning Mode & 30-Second Read + Quiz Gate",
        "badge": "SLOW LEARNING GATE // PILLAR 07",
        "title": "Replace Mindless App Opens with 30 Seconds of Real Learning",
        "problem": "The average person unlocks their phone 96 times a day—wasting dozens of micro-moments that could build lasting knowledge.",
        "solution": "Enable Minimum Phone's '30-Second Read + Play Quiz' App Gate. Before a restricted app unlocks, you read a 30-second micro-lesson and pass a quick comprehension question (+15 XP).",
        "steps": [
            "1. Open Settings -> Active Apps Manager and set social apps to '30s Quiz Gate'.",
            "2. Choose your track: Mindfulness & Focus Science, Language Mastery, or Islamic Wisdom.",
            "3. Turn every impulsive unlock into a 30-second brain upgrade."
        ],
        "quote": "\"Transform the habit that drained your mind into the habit that sharpens it.\"",
        "discussion_question": "Which Slow Learning track are you using on your 30-second App Gate—Focus Science, Vocabulary Mastery, or Islamic Knowledge?",
        "hashtags": "#MinimumPhone #SlowLearning #MicroLearning #HabitBuilding #DigitalDetox #SmartPhoneHabits #BrainTraining"
    },
    {
        "id": "tip-008-zero-app-mind-dump",
        "slot": "evening",
        "pillar": "Zero-App Mind Dump Scratchpad",
        "badge": "COGNITIVE OFFLOAD // PILLAR 08",
        "title": "Capture Ideas Without Opening Your Phone's Distraction Trap",
        "problem": "How often do you unlock your phone to write down a quick task or idea, only to get distracted by notifications and forget what you wanted to write?",
        "solution": "Minimum Phone embeds a Zero-App 'Mind Dump' Scratchpad directly on the minimalist home screen—100% offline, instant, and distraction-free.",
        "steps": [
            "1. Tap the Mind Dump scratchpad directly on your Minimum Phone Home Screen.",
            "2. Offload your thought, task, or evening reflection in 5 seconds.",
            "3. Lock your screen immediately—zero apps opened, zero feeds triggered."
        ],
        "quote": "\"Empty the clutter from your working memory so your mind can rest.\"",
        "discussion_question": "How many times a week does the Home Screen Mind Dump save you from opening a distracting notes or messaging app?",
        "hashtags": "#MinimumPhone #BrainDump #MinimalistLauncher #ADHDProductivity #DeepWork #OfflineFirst #CalmMind"
    },
    {
        "id": "tip-009-asymmetric-search-drawer",
        "slot": "morning",
        "pillar": "Asymmetric Search-First App Drawer",
        "badge": "BEHAVIORAL DESIGN // PILLAR 09",
        "title": "Why Colorful App Icons Are Engineered Like Slot Machines",
        "problem": "Bright red badges and candy-colored app grids are intentionally designed by attention engineers to trigger visual cravings when you only needed the Calculator.",
        "solution": "Minimum Phone's Asymmetric Search Drawer launches utility tools (Calculator, Maps, Phone, 2FA) the instant their name is matched—while keeping dopamine-trap apps invisible until typed.",
        "steps": [
            "1. Swipe up to open the clean text-only search drawer.",
            "2. Type 'calc' or 'maps'—your utility launches automatically with zero friction.",
            "3. Dopamine apps stay out of sight and require intentional typing + breathing."
        ],
        "quote": "\"Make what helps you effortless; make what harms your focus deliberate.\"",
        "discussion_question": "Did you notice your screen time drop as soon as colorful app icons disappeared from your home screen?",
        "hashtags": "#MinimumPhone #UXForWellbeing #AntiDopamine #MinimalistPhone #DigitalMinimalism #FocusFirst"
    },
    {
        "id": "tip-010-four-habit-wall-gatekeepers",
        "slot": "evening",
        "pillar": "4 Interactive Habit-Wall Gatekeepers",
        "badge": "HABIT REWIRING // PILLAR 10",
        "title": "Walk 20 Steps or Read 3 Pages Before Unlocking Social Media",
        "problem": "Simple time-limit popups fail because hitting 'Ignore for 15 minutes' takes zero effort.",
        "solution": "Minimum Phone offers 4 real behavioral Habit-Wall Gatekeepers: Calm Mind Transcription, 25-Word Mindful Journal, Read 3 Pages of your PDF/Book, or Walk 20 Physical Steps.",
        "steps": [
            "1. Pick your active Gatekeeper in Minimum Phone Settings.",
            "2. Load a favorite book (.pdf / .txt / .md) or enable the Step Sensor.",
            "3. Earn your screen time through movement, reading, or mindful reflection."
        ],
        "quote": "\"When impulse meets purposeful effort, compulsion loses its grip.\"",
        "discussion_question": "Which of the 4 Habit-Wall Gatekeepers is your favorite: Transcription, Journaling, Reading 3 Pages, or Walking 20 Steps?",
        "hashtags": "#MinimumPhone #HabitWall #BehavioralDesign #DigitalDetox #ReadMore #MindfulTech #SelfDiscipline"
    },
    {
        "id": "tip-011-monk-mode-deep-work",
        "slot": "morning",
        "pillar": "Monk Mode Single-Task Deep Work Timer",
        "badge": "MONK MODE FOCUS // PILLAR 11",
        "title": "Complete 4 Hours of Work in 90 Minutes with Monk Mode",
        "problem": "Multitasking between coding/writing and smartphone checks drops your effective IQ by 10 points and doubles your error rate.",
        "solution": "Minimum Phone's Monk Mode transforms your entire phone into a high-contrast E-Ink-style single-task countdown timer (25m, 50m, or 90m) with zero notifications.",
        "steps": [
            "1. Open the Focus Pod tab and select 25m, 50m, or 90m Monk Mode.",
            "2. Write your single specific outcome for the session.",
            "3. Place your phone in sight as a calm monochrome countdown clock."
        ],
        "quote": "\"One hour of undivided presence outperforms a whole day of fractured effort.\"",
        "discussion_question": "What is your go-to Monk Mode block length for deep work: 25 minutes, 50 minutes, or the full 90-minute ultradian sprint?",
        "hashtags": "#MinimumPhone #MonkMode #DeepWork #Pomodoro #FlowState #KnowledgeWork #KasbLLC"
    },
    {
        "id": "tip-012-zero-telemetry-privacy",
        "slot": "evening",
        "pillar": "100% Offline-First & Zero Internet Permission Architecture",
        "badge": "PRIVACY BY ARCHITECTURE // PILLAR 12",
        "title": "Why Your Digital Detox App Should Never Track Your Data",
        "problem": "Many commercial 'screen time' and 'accountability' apps upload your browsing history, app usage, and personal journals to cloud analytics servers.",
        "solution": "Minimum Phone's Android Manifest requests ZERO internet permission (android.permission.INTERNET is completely absent). Your journals, streaks, and habits never leave your phone.",
        "steps": [
            "1. Write freely in your Mindful Journal and Brain Dump scratchpad.",
            "2. Track your 90-Day Neuro-Reset and screen time with 100% local encryption.",
            "3. Verify in Android App Info -> Permissions: Zero network access, forever."
        ],
        "quote": "\"True peace of mind requires knowing your private thoughts remain yours alone.\"",
        "discussion_question": "Did you know most launchers and screen-time apps have full internet access? How important is 100% offline privacy to you?",
        "hashtags": "#MinimumPhone #PrivacyFirst #ZeroTelemetry #OfflineFirst #CyberSecurity #EthicalTech #OpenPrivacy"
    }
]


def load_history() -> dict:
    if HISTORY_PATH.exists():
        try:
            return json.loads(HISTORY_PATH.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {"posts": []}


def save_history(history: dict) -> None:
    HISTORY_PATH.parent.mkdir(parents=True, exist_ok=True)
    HISTORY_PATH.write_text(json.dumps(history, indent=2, ensure_ascii=False), encoding="utf-8")


def get_font(size: int, bold: bool = False, mono: bool = False):
    candidates = []
    if mono:
        candidates = [
            r"C:\Windows\Fonts\consolab.ttf" if bold else r"C:\Windows\Fonts\consola.ttf",
            r"C:\Windows\Fonts\courbd.ttf" if bold else r"C:\Windows\Fonts\cour.ttf",
        ]
    else:
        candidates = [
            r"C:\Windows\Fonts\segoeuib.ttf" if bold else r"C:\Windows\Fonts\segoeui.ttf",
            r"C:\Windows\Fonts\arialbd.ttf" if bold else r"C:\Windows\Fonts\arial.ttf",
        ]
    for path in candidates:
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def wrap_text(draw: ImageDraw.ImageDraw, text: str, font, max_width: int) -> list[str]:
    words = text.split()
    lines = []
    current = ""
    for w in words:
        test = f"{current} {w}".strip()
        bbox = draw.textbbox((0, 0), test, font=font)
        if bbox[2] - bbox[0] <= max_width:
            current = test
        else:
            if current:
                lines.append(current)
            current = w
    if current:
        lines.append(current)
    return lines


def render_tip_card(item: dict, day_number: int, output_path: Path) -> Path:
    DAILY_GRAPHICS_DIR.mkdir(parents=True, exist_ok=True)
    W, H = 1200, 630
    img = Image.new("RGB", (W, H), (0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Outer minimalist frame
    draw.rectangle([28, 28, W - 28, H - 28], outline=(65, 65, 65), width=2)
    draw.rectangle([36, 36, W - 36, H - 36], outline=(30, 30, 30), width=1)

    f_badge = get_font(18, bold=True, mono=True)
    f_title = get_font(36, bold=True, mono=False)
    f_label = get_font(16, bold=True, mono=True)
    f_body = get_font(20, bold=False, mono=False)
    f_step = get_font(19, bold=False, mono=True)
    f_quote = get_font(19, bold=False, mono=False)
    f_footer = get_font(16, bold=True, mono=True)
    f_logo = get_font(46, bold=True, mono=True)

    # Top Header Badge
    badge_text = f"{item['badge']}  •  DAILY INSIGHT #{day_number:02d}"
    draw.text((64, 58), badge_text, fill=(190, 190, 190), font=f_badge)

    # Minimalist 'M' Emblem in top-right
    cx, cy, r = W - 115, 105, 48
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(255, 255, 255), width=3)
    mb = draw.textbbox((0, 0), "M", font=f_logo)
    draw.text((cx - (mb[2] - mb[0]) / 2, cy - (mb[3] - mb[1]) / 2 - 4), "M", fill=(255, 255, 255), font=f_logo)

    # Title
    title_lines = wrap_text(draw, item["title"], f_title, W - 240)
    y = 96
    for line in title_lines[:2]:
        draw.text((64, y), line, fill=(255, 255, 255), font=f_title)
        y += 44

    y += 10
    draw.line([(64, y), (W - 64, y)], fill=(55, 55, 55), width=1)
    y += 18

    # Problem & Solution boxes
    draw.text((64, y), "THE TRAP:", fill=(160, 160, 160), font=f_label)
    prob_lines = wrap_text(draw, item["problem"], f_body, W - 240)
    for line in prob_lines[:2]:
        draw.text((195, y - 3), line, fill=(215, 215, 215), font=f_body)
        y += 27

    y += 8
    draw.text((64, y), "THE FIX:", fill=(255, 255, 255), font=f_label)
    sol_lines = wrap_text(draw, item["solution"], f_body, W - 240)
    for line in sol_lines[:2]:
        draw.text((195, y - 3), line, fill=(255, 255, 255), font=f_body)
        y += 27

    y += 14
    # Actionable Steps Box
    box_top = y
    box_bottom = min(H - 108, box_top + 132)
    draw.rectangle([64, box_top, W - 64, box_bottom], fill=(14, 14, 14), outline=(75, 75, 75), width=1)
    sy = box_top + 14
    for step in item["steps"][:3]:
        step_lines = wrap_text(draw, step, f_step, W - 160)
        draw.text((84, sy), step_lines[0], fill=(240, 240, 240), font=f_step)
        sy += 36

    # Quote & Footer
    draw.text((64, H - 92), item["quote"], fill=(185, 185, 185), font=f_quote)
    footer_text = "MINIMUM PHONE: DETOX & FOCUS  •  100% FREE  •  ZERO ADS  •  ZERO TELEMETRY  •  KASBPRO.COM"
    draw.text((64, H - 58), footer_text, fill=(140, 140, 140), font=f_footer)

    img.save(output_path, "PNG")
    return output_path


def select_next_topic(history: dict, slot_override: str | None = None) -> tuple[dict, int]:
    posted_ids = {entry.get("id") for entry in history.get("posts", [])}
    day_number = len(history.get("posts", [])) + 1

    now_hour = datetime.datetime.now().hour
    preferred_slot = slot_override or ("morning" if now_hour < 14 else "evening")

    # First try unposted matching preferred slot
    for item in CURRICULUM:
        if item["id"] not in posted_ids and item["slot"] == preferred_slot:
            return item, day_number

    # Next try any unposted in curriculum
    for item in CURRICULUM:
        if item["id"] not in posted_ids:
            return item, day_number

    # If all curriculum items have been posted, cycle with a new edition number
    idx = (day_number - 1) % len(CURRICULUM)
    base = dict(CURRICULUM[idx])
    base["id"] = f"{base['id']}-cycle-{day_number}"
    return base, day_number


def build_post_texts(item: dict, day_number: int) -> dict:
    steps_block = "\n".join(f"   {s}" for s in item["steps"])
    page_post = (
        f"🌿 Daily Mindful Tech Tip #{day_number}: {item['title']}\n\n"
        f"⚠️ The Attention Trap:\n{item['problem']}\n\n"
        f"✨ How Minimum Phone Helps You Fix It ({item['pillar']}):\n{item['solution']}\n\n"
        f"🛠️ Try This Today in 3 Steps:\n{steps_block}\n\n"
        f"💬 {item['quote']}\n\n"
        f"🔒 100% Free Forever • Zero Ads • Zero Internet Telemetry\n"
        f"🌐 Get Minimum Phone & Focus Tools: https://kasbpro.com\n"
        f"🤝 Join our Community Groups:\n"
        f"• Facebook Group: https://www.facebook.com/groups/28497753259904620\n"
        f"• LinkedIn Group: https://www.linkedin.com/groups/40625419/\n\n"
        f"{item['hashtags']}"
    )

    group_post = (
        f"🌱 Daily Community Practice #{day_number}: {item['title']}\n\n"
        f"Why we struggle:\n{item['problem']}\n\n"
        f"How to use Minimum Phone's {item['pillar']} today:\n"
        f"{steps_block}\n\n"
        f"💬 {item['quote']}\n\n"
        f"👇 Community Check-In:\n{item['discussion_question']}\n\n"
        f"{item['hashtags']}"
    )

    return {
        "facebook_page": page_post,
        "facebook_group": group_post,
        "linkedin_page": page_post,
        "linkedin_group": group_post,
    }


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(description="Minimum Phone Daily Social Content & Graphic Generator")
    parser.add_argument("--prepare", action="store_true", help="Prepare next unposted daily topic, render PNG card, and output JSON payload")
    parser.add_argument("--slot", choices=["morning", "evening"], default=None, help="Optional slot override (morning or evening)")
    parser.add_argument("--mark-posted", metavar="TOPIC_ID", help="Mark a prepared topic ID as posted in social-post-history.json")
    parser.add_argument("--channels", default="facebook_page,facebook_group,linkedin_page,linkedin_group", help="Comma-separated channels posted to")
    args = parser.parse_args()

    history = load_history()

    if args.mark_posted:
        entry = {
            "id": args.mark_posted,
            "posted_at": datetime.datetime.now().isoformat(),
            "channels": [c.strip() for c in args.channels.split(",") if c.strip()],
        }
        history.setdefault("posts", []).append(entry)
        save_history(history)
        print(json.dumps({"status": "recorded", "entry": entry, "total_posts": len(history["posts"])}, indent=2))
        return

    item, day_number = select_next_topic(history, args.slot)
    image_path = DAILY_GRAPHICS_DIR / f"{item['id']}.png"
    render_tip_card(item, day_number, image_path)
    texts = build_post_texts(item, day_number)

    payload = {
        "id": item["id"],
        "day_number": day_number,
        "slot": item["slot"],
        "pillar": item["pillar"],
        "title": item["title"],
        "image_path": str(image_path),
        "targets": {
            "facebook_page_url": "https://www.facebook.com/profile.php?id=61595932508101",
            "facebook_group_url": "https://www.facebook.com/groups/28497753259904620",
            "linkedin_page_admin_post_url": "https://www.linkedin.com/company/145383564/admin/page-posts/published/?share=true",
            "linkedin_group_url": "https://www.linkedin.com/groups/40625419/",
        },
        "copy": texts,
    }

    LATEST_PAYLOAD_PATH.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps(payload, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()

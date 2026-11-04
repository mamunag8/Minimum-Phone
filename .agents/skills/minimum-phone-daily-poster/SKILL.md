---
name: minimum-phone-daily-poster
description: Autonomous daily social media publisher for Minimum Phone: Detox & Focus (Kasb LLC). Generates a non-repeating 1200x630 monochrome tip graphic and practical how-to post twice daily (9:00 AM Morning Focus & 6:00 PM Evening Wind-Down) and publishes to the Facebook Official Page, Facebook Public Group, LinkedIn Company Page, and LinkedIn Public Group via Chrome DevTools MCP.
---

# Minimum Phone Daily Social Advocate Skill

Use this skill whenever executing the scheduled twice-daily (`9:00 AM` & `6:00 PM`) social media advocacy run or when asked to post a new daily tip showing how **Minimum Phone: Detox & Focus** helps people reclaim their attention and calm mind.

## Step 1: Generate Next Non-Repeating Topic & 1200x630 Monochrome Graphic

Run the generator script to pick the next unposted topic from the curriculum (`d:\Kasb llc\dev\Apps\Minimum Phone\docs\social-post-history.json`) and render its custom `1200×630` OLED monochrome tip card:

```powershell
python "d:\Kasb llc\dev\Apps\Minimum Phone\scripts\daily_social_agent.py" --prepare
```

This writes `d:\Kasb llc\dev\Apps\Minimum Phone\play-store-submission\graphics\social\daily\latest_post_payload.json` containing:
- `id`: Unique topic identifier (e.g., `tip-001-morning-reflex-loop`)
- `image_path`: Absolute path to the generated `1200×630` PNG card
- `copy.facebook_page`, `copy.facebook_group`, `copy.linkedin_page`, `copy.linkedin_group`

## Step 2: Publish to All 4 Active Channels via `chrome-devtools-mcp`

1. **LinkedIn Official Company Page** (`https://www.linkedin.com/company/145383564/admin/page-posts/published/?share=true`):
   - Navigate to the URL above (which automatically opens the "Create post" modal as **Minimum Phone: Detox & Focus**).
   - Click `Add media` (or expose `<input type="file">` via `evaluate_script` and call `upload_file` with `filePaths: [image_path]`), click `Next` if prompted, fill the textbox with `copy.linkedin_page`, and click `Post`.
2. **LinkedIn Public Community Group** (`https://www.linkedin.com/groups/40625419/`):
   - Navigate to the group URL and click `Start a public post`.
   - Attach `image_path` (or paste `copy.linkedin_group` into the textbox) and click `Post`.
3. **Facebook Official Page** (`https://www.facebook.com/profile.php?id=61595932508101`):
   - Ensure the active Facebook profile is switched to **Minimum Phone: Detox & Focus**.
   - Click `What's on your mind?`, attach `image_path` via `<input type="file" accept*="image">` (`upload_file`), fill `copy.facebook_page`, and click `Post`.
4. **Facebook Public Community Group** (`https://www.facebook.com/groups/28497753259904620`):
   - Click `Write something...`, attach `image_path` via `upload_file`, fill `copy.facebook_group`, and click `Post`.

## Step 3: Record Topic in History Ledger

After publishing, mark the topic ID as posted so future runs never repeat it:

```powershell
python "d:\Kasb llc\dev\Apps\Minimum Phone\scripts\daily_social_agent.py" --mark-posted <id>
```

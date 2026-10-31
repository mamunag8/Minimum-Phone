import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LANGS_PART1 } from './seo_languages_part1.mjs';
import { LANGS_PART2 } from './seo_languages_part2.mjs';
import { ALL_BLOG_POSTS, INDEXNOW_KEY, generateAllBlogAssets } from './seo_blog_renderer.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'seo-dist');
const SITE_ORIGIN = 'https://minimumphone.kasbpro.com';
const APK_DOWNLOAD_URL = 'https://github.com/mamunag8/Minimum-Phone/raw/main/MinimumPhone-latest.apk';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.kasbllc.minimumphone';
const GITHUB_REPO_URL = 'https://github.com/mamunag8/Minimum-Phone';

const ALL_LANGS = { ...LANGS_PART1, ...LANGS_PART2 };
const LANG_CODES = ['en', 'bn', 'ar', 'ur', 'id', 'tr', 'hi', 'ms', 'es', 'fr', 'de', 'ru'];

// Parse flutter_app/lib/i18n.dart to extract exact app UI strings per language
function parseAppI18n() {
  const i18nPath = path.join(ROOT, 'flutter_app', 'lib', 'i18n.dart');
  const raw = fs.readFileSync(i18nPath, 'utf8');
  const result = {};
  for (const code of LANG_CODES) {
    result[code] = {};
    const langBlockRegex = new RegExp(`'${code}'\\s*:\\s*\\{([\\s\\S]*?)\\n\\s*\\},`, 'm');
    const match = raw.match(langBlockRegex);
    if (!match) continue;
    const block = match[1];
    const kvRegex = /'([^']+)'\s*:\s*'((?:\\'|[^'])*)'/g;
    let m;
    while ((m = kvRegex.exec(block)) !== null) {
      result[code][m[1]] = m[2].replace(/\\'/g, "'").replace(/\\n/g, '\n');
    }
  }
  return result;
}

// Parse flutter_app/lib/wisdom_bank.dart to extract real Wisdom quotes per language
function parseWisdomSamples() {
  const wbPath = path.join(ROOT, 'flutter_app', 'lib', 'wisdom_bank.dart');
  const raw = fs.readFileSync(wbPath, 'utf8');
  const mapNameByLang = {
    en: 'entriesEn',
    bn: 'entriesBn',
    ar: 'entriesAr',
    ur: 'entriesUr',
    id: 'entriesId',
    tr: 'entriesTr',
    hi: 'entriesHi',
    ms: 'entriesMs',
    es: 'entriesEs',
    fr: 'entriesFr',
    de: 'entriesDe',
    ru: 'entriesRu',
  };
  const samples = {};
  for (const code of LANG_CODES) {
    samples[code] = [];
    const listName = mapNameByLang[code];
    const startIdx = raw.indexOf(`List<WisdomEntry> ${listName} = [`);
    if (startIdx === -1) continue;
    const endIdx = raw.indexOf('];', startIdx);
    const slice = raw.slice(startIdx, endIdx === -1 ? startIdx + 25000 : endIdx);
    const entryRegex = /WisdomEntry\(\s*category:\s*'([^']+)',\s*text:\s*'((?:\\'|[^'])*)',\s*ref:\s*'((?:\\'|[^'])*)',\s*question:\s*'((?:\\'|[^'])*)',\s*options:\s*\[([^\]]+)\],\s*correctIndex:\s*(\d+)\s*\)/g;
    let m;
    const byCategory = { quran: [], hadith: [], proverb: [] };
    while ((m = entryRegex.exec(slice)) !== null) {
      const cat = m[1];
      const text = m[2].replace(/\\'/g, "'");
      const ref = m[3].replace(/\\'/g, "'");
      const question = m[4].replace(/\\'/g, "'");
      const opts = [];
      const optRegex = /'((?:\\'|[^'])*)'/g;
      let om;
      while ((om = optRegex.exec(m[5])) !== null) {
        opts.push(om[1].replace(/\\'/g, "'"));
      }
      const correctIdx = parseInt(m[6], 10) || 0;
      if (byCategory[cat] && byCategory[cat].length < 2) {
        byCategory[cat].push({
          category: cat,
          text,
          ref,
          question,
          correctAnswer: opts[correctIdx] || opts[0] || '',
        });
      }
    }
    samples[code] = [
      ...byCategory.quran,
      ...byCategory.hadith,
      ...byCategory.proverb,
    ].slice(0, 6);
  }
  return samples;
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Deterministic SVG QR Matrix for KASB-BRICK-77
function renderQrSvg() {
  const size = 21;
  const cells = Array.from({ length: size }, () => Array(size).fill(0));
  const drawFinder = (r0, c0) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
          cells[r0 + r][c0 + c] = 1;
        }
      }
    }
  };
  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);
  for (let i = 8; i < size - 8; i++) {
    cells[6][i] = i % 2 === 0 ? 1 : 0;
    cells[i][6] = i % 2 === 0 ? 1 : 0;
  }
  const seed = 'KASB-BRICK-77-MINIMUM-PHONE-FORT';
  let idx = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const inFinder =
        (r < 8 && c < 8) ||
        (r < 8 && c >= size - 8) ||
        (r >= size - 8 && c < 8) ||
        r === 6 ||
        c === 6;
      if (!inFinder) {
        const ch = seed.charCodeAt(idx % seed.length);
        cells[r][c] = ((ch + r * 17 + c * 31) & 1) === 0 ? 1 : 0;
        idx++;
      }
    }
  }
  let rects = '';
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (cells[r][c]) {
        rects += `<rect x="${c + 2}" y="${r + 2}" width="1" height="1" fill="#09090b"/>`;
      }
    }
  }
  return `<svg viewBox="0 0 ${size + 4} ${size + 4}" width="180" height="180" role="img" aria-label="Minimum Phone Physical QR Fortress Key KASB-BRICK-77" style="background:#ffffff;border-radius:12px;padding:6px;box-shadow:0 10px 30px rgba(0,0,0,0.4);shape-rendering:crispEdges;"><rect width="${size + 4}" height="${size + 4}" fill="#ffffff" rx="1.5"/>${rects}</svg>`;
}

function buildHreflangLinks() {
  const lines = [
    `<link rel="alternate" hreflang="x-default" href="${SITE_ORIGIN}/" />`,
    `<link rel="alternate" hreflang="en" href="${SITE_ORIGIN}/" />`,
  ];
  for (const code of LANG_CODES) {
    lines.push(`<link rel="alternate" hreflang="${code}" href="${SITE_ORIGIN}/${code}/" />`);
  }
  return lines.join('\n  ');
}

function buildJsonLd(langData, ui, canonicalUrl) {
  const softwareSchema = {
    '@context': 'https://schema.org',
    '@type': 'MobileApplication',
    name: 'Minimum Phone: Detox & Focus',
    alternateName: `${ui.appTitle || 'Minimum Phone'} — ${ui.subtitle || langData.heroTitle}`,
    operatingSystem: 'Android 8.0+, iOS',
    applicationCategory: 'LifestyleApplication, UtilitiesApplication, ProductivityApplication',
    applicationSubCategory: 'Digital Wellbeing, Minimalist Launcher, Safe Private DNS & Focus Timer',
    inLanguage: LANG_CODES,
    isAccessibleForFree: true,
    url: canonicalUrl,
    downloadUrl: APK_DOWNLOAD_URL,
    installUrl: PLAY_STORE_URL,
    softwareVersion: '2.9.1',
    fileSize: '53MB',
    image: `${SITE_ORIGIN}/assets/feature-graphic-1024x500.png`,
    screenshot: [
      `${SITE_ORIGIN}/assets/screenshot-1-home-1080x1920.png`,
      `${SITE_ORIGIN}/assets/screenshot-2-inhale-1080x1920.png`,
      `${SITE_ORIGIN}/assets/screenshot-3-purity-1080x1920.png`,
      `${SITE_ORIGIN}/assets/screenshot-4-focus-1080x1920.png`,
    ],
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
    author: {
      '@type': 'Organization',
      name: 'Kasb LLC',
      url: 'https://kasbpro.com',
      email: 'info@kasbpro.com',
    },
    featureList: langData.features.map((f) => `${f.title}: ${f.benefit}`),
    description: langData.seoDesc,
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: langData.faqs.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  };

  const howToSchema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: ui.wizardTitle || '5-Step Installation & Protection Setup Guide',
    description: ui.wizardSubtitle || langData.seoDesc,
    step: [1, 2, 3, 4, 5].map((n) => ({
      '@type': 'HowToStep',
      position: n,
      name: ui[`wizStep${n}Title`] || `Step ${n}`,
      text: (ui[`wizStep${n}SubTodo`] || '').replace(/\n/g, ' '),
    })),
  };

  return `
  <script type="application/ld+json">${JSON.stringify(softwareSchema)}</script>
  <script type="application/ld+json">${JSON.stringify(faqSchema)}</script>
  <script type="application/ld+json">${JSON.stringify(howToSchema)}</script>`;
}

function renderPage(langCode, isRootIndex, appI18nAll, wisdomAll) {
  const langData = ALL_LANGS[langCode];
  const ui = appI18nAll[langCode] || appI18nAll.en;
  const wisdomList = wisdomAll[langCode] || wisdomAll.en;
  const canonicalUrl = isRootIndex ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}/${langCode}/`;
  const isRtl = langData.dir === 'rtl';

  const quickTools = [
    { icon: '📶', label: ui.safeWifi || 'Wi-Fi' },
    { icon: '⇅', label: ui.safeMobileData || 'Mobile Data' },
    { icon: '📡', label: ui.safeHotspot || 'Hotspot' },
    { icon: 'ᛒ', label: ui.safeBluetooth || 'Bluetooth' },
    { icon: '🔊', label: ui.safeSound || 'Sound' },
    { icon: '☀️', label: ui.safeDisplay || 'Display' },
    { icon: '🔦', label: ui.safeTorch || 'Flashlight' },
    { icon: '🔋', label: ui.safeBattery || 'Battery' },
    { icon: '📍', label: ui.safeLocation || 'Location' },
    { icon: '✈️', label: ui.safeAirplane || 'Airplane' },
    { icon: '⏰', label: ui.safeAlarm || 'Alarm' },
    { icon: '🧮', label: ui.safeCalculator || 'Calculator' },
  ];

  const setupSteps = [1, 2, 3, 4, 5].map((n) => ({
    num: n,
    title: ui[`wizStep${n}Title`] || `Step ${n}`,
    todo: ui[`wizStep${n}SubTodo`] || '',
    done: ui[`wizStep${n}SubDone`] || '',
  }));

  const userGuideSections = [1, 2, 3].map((n) => ({
    title: ui[`ugSec${n}Title`] || '',
    body: ui[`ugSec${n}Body`] || '',
  }));

  return `<!DOCTYPE html>
<html lang="${langData.code}" dir="${langData.dir}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(langData.seoTitle)}</title>
  <meta name="description" content="${escapeHtml(langData.seoDesc)}" />
  <meta name="keywords" content="${escapeHtml(langData.seoKeywords)}" />
  <meta name="author" content="Kasb LLC (kasbpro.com)" />
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
  <link rel="canonical" href="${canonicalUrl}" />
  <link rel="icon" type="image/png" href="/assets/icon-512x512.png" />
  <link rel="apple-touch-icon" href="/assets/icon-512x512.png" />
  ${buildHreflangLinks()}

  <!-- Open Graph / Facebook / WhatsApp -->
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Minimum Phone by Kasb LLC" />
  <meta property="og:url" content="${canonicalUrl}" />
  <meta property="og:title" content="${escapeHtml(langData.seoTitle)}" />
  <meta property="og:description" content="${escapeHtml(langData.seoDesc)}" />
  <meta property="og:locale" content="${langData.locale}" />
  <meta property="og:image" content="${SITE_ORIGIN}/assets/fb-cover-1640x856.png" />
  <meta property="og:image:width" content="1640" />
  <meta property="og:image:height" content="856" />

  <!-- Twitter / X -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(langData.seoTitle)}" />
  <meta name="twitter:description" content="${escapeHtml(langData.seoDesc)}" />
  <meta name="twitter:image" content="${SITE_ORIGIN}/assets/fb-cover-1640x856.png" />

  ${buildJsonLd(langData, ui, canonicalUrl)}

  <style>
    :root {
      --bg: #070709;
      --surface: #0f1015;
      --surface-2: #151720;
      --border: #232634;
      --text: #f4f4f6;
      --muted: #a1a1b5;
      --emerald: #10b981;
      --emerald-dim: rgba(16, 185, 129, 0.14);
      --amber: #f59e0b;
      --amber-dim: rgba(245, 158, 11, 0.14);
      --sky: #38bdf8;
      --rose: #f43f5e;
      --radius: 16px;
      --max-w: 1220px;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; background: var(--bg); color: var(--text); }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans", "Noto Sans Bengali", "Noto Sans Arabic", "Noto Sans Devanagari", Helvetica, Arial, sans-serif;
      background: radial-gradient(circle at 50% 0%, rgba(16, 185, 129, 0.10), transparent 45%), var(--bg);
      color: var(--text);
      line-height: 1.68;
      overflow-x: hidden;
    }
    a { color: inherit; text-decoration: none; }
    .container { max-width: var(--max-w); margin: 0 auto; padding: 0 20px; }

    /* Top KasbPro Ecosystem Bar */
    .eco-bar {
      background: #040406;
      border-bottom: 1px solid var(--border);
      font-size: 12.5px;
      color: var(--muted);
      padding: 8px 0;
    }
    .eco-bar-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 10px;
    }
    .eco-links { display: flex; gap: 14px; flex-wrap: wrap; align-items: center; }
    .eco-links a { color: var(--muted); transition: color 0.15s; }
    .eco-links a:hover { color: var(--emerald); }

    /* Sticky Navbar */
    .navbar {
      position: sticky;
      top: 0;
      z-index: 100;
      background: rgba(7, 7, 9, 0.88);
      backdrop-filter: blur(14px);
      border-bottom: 1px solid var(--border);
      padding: 12px 0;
    }
    .nav-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      font-weight: 800;
      font-size: 19px;
      letter-spacing: -0.02em;
    }
    .brand img {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      border: 1px solid var(--border);
    }
    .brand-sub {
      display: block;
      font-size: 11.5px;
      font-weight: 500;
      color: var(--emerald);
    }
    .nav-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    /* Language Pills Bar */
    .lang-strip {
      background: rgba(15, 16, 21, 0.9);
      border-bottom: 1px solid var(--border);
      padding: 10px 0;
    }
    .lang-strip-inner {
      display: flex;
      align-items: center;
      gap: 8px;
      overflow-x: auto;
      padding-bottom: 2px;
      scrollbar-width: thin;
    }
    .lang-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 11px;
      border-radius: 999px;
      font-size: 12.5px;
      font-weight: 600;
      background: var(--surface);
      border: 1px solid var(--border);
      color: var(--muted);
      white-space: nowrap;
      transition: all 0.15s;
    }
    .lang-pill:hover {
      border-color: var(--emerald);
      color: var(--text);
    }
    .lang-pill.active {
      background: var(--emerald-dim);
      border-color: var(--emerald);
      color: #34d399;
    }

    /* Hero */
    .hero {
      padding: 56px 0 44px;
      border-bottom: 1px solid var(--border);
    }
    .hero-grid {
      display: grid;
      grid-template-columns: 1.25fr 0.75fr;
      gap: 36px;
      align-items: center;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      border-radius: 999px;
      background: var(--emerald-dim);
      border: 1px solid rgba(16, 185, 129, 0.38);
      color: #34d399;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.04em;
      margin-bottom: 18px;
    }
    .hero h1 {
      font-size: clamp(28px, 4.2vw, 48px);
      line-height: 1.15;
      font-weight: 850;
      letter-spacing: -0.025em;
      margin-bottom: 18px;
    }
    .hero-sub {
      font-size: 17px;
      color: var(--muted);
      margin-bottom: 26px;
      max-width: 680px;
    }
    .cta-row {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 28px;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 9px;
      padding: 13px 22px;
      border-radius: 12px;
      font-weight: 700;
      font-size: 14.5px;
      border: 1px solid transparent;
      cursor: pointer;
      transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;
    }
    .btn:hover { transform: translateY(-1px); }
    .btn-primary {
      background: linear-gradient(135deg, #10b981, #059669);
      color: #04130d;
      box-shadow: 0 8px 25px rgba(16, 185, 129, 0.28);
    }
    .btn-secondary {
      background: var(--surface-2);
      color: var(--text);
      border-color: var(--border);
    }
    .btn-secondary:hover { border-color: var(--emerald); }
    .btn-amber {
      background: var(--amber-dim);
      color: #fbbf24;
      border-color: rgba(245, 158, 11, 0.4);
    }

    /* Live Interactive Minimalist Phone Mockup */
    .phone-mock {
      background: #050507;
      border: 2px solid #27273a;
      border-radius: 34px;
      padding: 20px 18px;
      max-width: 360px;
      margin: 0 auto;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(16, 185, 129, 0.18);
    }
    .mock-status {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      color: var(--muted);
      padding-bottom: 10px;
      border-bottom: 1px solid #1a1b24;
      margin-bottom: 14px;
    }
    .mock-badge-dns {
      background: var(--emerald-dim);
      color: #34d399;
      padding: 2px 8px;
      border-radius: 99px;
      font-weight: 700;
      font-size: 10px;
    }
    .mock-clock {
      text-align: center;
      padding: 8px 0 14px;
    }
    .mock-time {
      font-size: 42px;
      font-weight: 200;
      letter-spacing: 2px;
      line-height: 1;
    }
    .mock-date {
      font-size: 12px;
      color: var(--muted);
      margin-top: 4px;
    }
    .mock-profiles {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px;
      margin-bottom: 12px;
    }
    .mock-prof {
      text-align: center;
      padding: 6px 4px;
      font-size: 11px;
      border-radius: 8px;
      background: #101118;
      border: 1px solid #1f2130;
      color: var(--muted);
    }
    .mock-prof.active {
      background: var(--emerald-dim);
      border-color: var(--emerald);
      color: #34d399;
      font-weight: 700;
    }
    .mock-wisdom {
      background: #0d0f14;
      border: 1px solid rgba(16, 185, 129, 0.3);
      border-radius: 12px;
      padding: 11px 12px;
      margin-bottom: 12px;
      font-size: 12px;
    }
    .mock-wisdom-ref {
      color: #34d399;
      font-size: 10.5px;
      font-weight: 700;
      margin-top: 4px;
    }
    .mock-app-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .mock-app-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 9px 12px;
      border-radius: 10px;
      background: #0c0d12;
      border: 1px solid #1a1c26;
      font-size: 13px;
    }
    .mock-tier {
      font-size: 10px;
      padding: 2px 7px;
      border-radius: 6px;
      background: #171923;
      color: var(--muted);
    }
    .mock-tier.restricted {
      background: var(--amber-dim);
      color: #fbbf24;
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-top: 28px;
    }
    .stat-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 18px;
    }
    .stat-val {
      font-size: 24px;
      font-weight: 850;
      color: #34d399;
      margin-bottom: 4px;
    }
    .stat-lbl {
      font-size: 13px;
      color: var(--muted);
    }

    /* Section Generic */
    section {
      padding: 64px 0;
      border-bottom: 1px solid var(--border);
    }
    .sec-head {
      text-align: center;
      max-width: 820px;
      margin: 0 auto 44px;
    }
    .sec-head h2 {
      font-size: clamp(24px, 3.2vw, 36px);
      font-weight: 800;
      letter-spacing: -0.02em;
      margin-bottom: 12px;
    }
    .sec-head p {
      color: var(--muted);
      font-size: 16px;
    }

    /* 12 Features Grid */
    .features-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 22px;
    }
    .feat-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 26px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: border-color 0.2s, transform 0.2s;
    }
    .feat-card:hover {
      border-color: rgba(16, 185, 129, 0.5);
      transform: translateY(-2px);
    }
    .feat-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 14px;
    }
    .feat-icon {
      font-size: 28px;
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: var(--surface-2);
      border: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .feat-tag {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.06em;
      color: #34d399;
      background: var(--emerald-dim);
      padding: 4px 10px;
      border-radius: 99px;
    }
    .feat-card h3 {
      font-size: 19px;
      font-weight: 800;
      margin-bottom: 12px;
      line-height: 1.35;
    }
    .feat-how {
      font-size: 14.5px;
      color: var(--muted);
      margin-bottom: 16px;
    }
    .feat-how strong {
      color: var(--text);
    }
    .feat-benefit {
      background: rgba(16, 185, 129, 0.08);
      border-left: 3px solid var(--emerald);
      padding: 12px 14px;
      border-radius: 8px;
      font-size: 14px;
      color: #d1fae5;
    }
    [dir="rtl"] .feat-benefit {
      border-left: none;
      border-right: 3px solid var(--emerald);
    }
    .feat-benefit strong {
      color: #34d399;
      display: block;
      margin-bottom: 3px;
      font-size: 12.5px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    /* Personas Grid */
    .personas-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
    }
    .persona-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 24px;
    }
    .persona-icon {
      font-size: 30px;
      margin-bottom: 12px;
    }
    .persona-card h3 {
      font-size: 17.5px;
      font-weight: 750;
      margin-bottom: 8px;
      color: #34d399;
    }
    .persona-card p {
      font-size: 14.5px;
      color: var(--muted);
    }

    /* Screenshots Showcase */
    .shots-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 18px;
    }
    .shot-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 12px;
      text-align: center;
    }
    .shot-card img {
      width: 100%;
      height: auto;
      border-radius: 10px;
      border: 1px solid #1e202d;
      margin-bottom: 10px;
    }
    .shot-card span {
      font-size: 13px;
      font-weight: 600;
      color: var(--muted);
    }

    /* Quick Settings 12 Tools Chip Grid */
    .tools-grid {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 12px;
      margin-top: 24px;
    }
    .tool-chip {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 14px 10px;
      text-align: center;
      font-size: 13.5px;
      font-weight: 600;
    }
    .tool-chip span {
      display: block;
      font-size: 22px;
      margin-bottom: 6px;
    }

    /* Comparison Table */
    .table-wrap {
      overflow-x: auto;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      background: var(--surface);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      min-width: 680px;
    }
    th, td {
      padding: 15px 18px;
      text-align: start;
      border-bottom: 1px solid var(--border);
      font-size: 14.5px;
    }
    th {
      background: var(--surface-2);
      font-weight: 800;
      color: var(--text);
    }
    th:nth-child(2), td:nth-child(2) {
      background: rgba(16, 185, 129, 0.08);
      color: #34d399;
      font-weight: 700;
    }

    /* 5-Step Setup Wizard & User Guide */
    .steps-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 14px;
      margin-bottom: 32px;
    }
    .step-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 18px;
    }
    .step-num {
      display: inline-block;
      background: var(--emerald-dim);
      color: #34d399;
      font-weight: 800;
      font-size: 12px;
      padding: 3px 9px;
      border-radius: 99px;
      margin-bottom: 10px;
    }
    .step-card h4 {
      font-size: 15px;
      margin-bottom: 8px;
    }
    .step-card p {
      font-size: 13px;
      color: var(--muted);
      white-space: pre-line;
    }

    .guide-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 18px;
    }
    .guide-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 22px;
    }
    .guide-card h4 {
      font-size: 16.5px;
      color: #fbbf24;
      margin-bottom: 10px;
    }
    .guide-card p {
      font-size: 13.8px;
      color: var(--muted);
      white-space: pre-line;
    }

    /* Wisdom Bank Preview */
    .wisdom-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 18px;
    }
    .wisdom-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 22px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .wisdom-cat {
      display: inline-block;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      color: #38bdf8;
      margin-bottom: 8px;
    }
    .wisdom-text {
      font-size: 15.5px;
      font-weight: 600;
      margin-bottom: 10px;
      color: var(--text);
    }
    .wisdom-ref {
      font-size: 12.5px;
      color: #34d399;
      margin-bottom: 12px;
    }
    .wisdom-quiz {
      background: var(--surface-2);
      border-radius: 10px;
      padding: 10px 12px;
      font-size: 12.5px;
      color: var(--muted);
    }
    .wisdom-quiz strong {
      color: #fbbf24;
      display: block;
      margin-bottom: 4px;
    }

    /* Printable QR Box */
    .qr-banner {
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.14), rgba(245, 158, 11, 0.10));
      border: 1px solid rgba(16, 185, 129, 0.4);
      border-radius: 22px;
      padding: 34px;
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 30px;
      align-items: center;
    }

    /* FAQ */
    .faq-list {
      max-width: 900px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    details.faq-item {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 18px 22px;
    }
    details.faq-item summary {
      font-weight: 750;
      font-size: 16.5px;
      cursor: pointer;
      list-style: none;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    }
    details.faq-item summary::after {
      content: "+";
      font-size: 20px;
      color: var(--emerald);
      font-weight: 800;
    }
    details.faq-item[open] summary::after {
      content: "−";
    }
    details.faq-item p {
      margin-top: 12px;
      color: var(--muted);
      font-size: 15px;
      padding-top: 12px;
      border-top: 1px solid var(--border);
    }

    /* All 12 Languages Matrix */
    .lang-matrix {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 14px;
    }
    .lang-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      transition: border-color 0.15s, transform 0.15s;
    }
    .lang-card:hover, .lang-card.active {
      border-color: var(--emerald);
      transform: translateY(-2px);
    }
    .lang-flag { font-size: 28px; }
    .lang-native { font-weight: 800; font-size: 15.5px; display: block; }
    .lang-en { font-size: 12px; color: var(--muted); }

    /* Footer */
    footer {
      padding: 48px 0;
      background: #040406;
      color: var(--muted);
      font-size: 13.5px;
    }
    .footer-grid {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 20px;
    }
    .footer-links {
      display: flex;
      gap: 18px;
      flex-wrap: wrap;
    }
    .footer-links a:hover { color: var(--emerald); }

    @media (max-width: 980px) {
      .hero-grid { grid-template-columns: 1fr; }
      .features-grid, .personas-grid, .wisdom-grid, .guide-grid { grid-template-columns: 1fr; }
      .stats-grid, .shots-grid, .lang-matrix { grid-template-columns: repeat(2, 1fr); }
      .steps-grid { grid-template-columns: 1fr; }
      .tools-grid { grid-template-columns: repeat(3, 1fr); }
      .qr-banner { grid-template-columns: 1fr; text-align: center; justify-items: center; }
    }
    @media (max-width: 560px) {
      .stats-grid, .shots-grid, .lang-matrix { grid-template-columns: 1fr; }
      .tools-grid { grid-template-columns: repeat(2, 1fr); }
    }
  </style>
</head>
<body>

  <!-- Top KasbPro Ecosystem Bar -->
  <div class="eco-bar">
    <div class="container eco-bar-inner">
      <div><strong>Kasb LLC</strong> • <a href="https://kasbpro.com">KasbPro.com Ecosystem</a></div>
      <div class="eco-links">
        <a href="https://kasbpro.com">🌐 KasbPro Home</a>
        <a href="/blog/" style="color:var(--emerald);font-weight:700;">📚 57 Benefit Guides</a>
        <a href="https://erp.kasbpro.com">📊 Free AI ERP &amp; POS</a>
        <a href="https://arabic.kasbpro.com">📚 Quran &amp; Arabic Books</a>
        <a href="/privacy-policy.html">🔒 Privacy Policy</a>
        <a href="${GITHUB_REPO_URL}" target="_blank" rel="noopener">💻 GitHub Source</a>
      </div>
    </div>
  </div>

  <!-- Sticky Navigation -->
  <header class="navbar">
    <div class="container nav-inner">
      <a href="${isRootIndex ? '/' : `/${langData.code}/`}" class="brand">
        <img src="/assets/icon-512x512.png" alt="Minimum Phone Icon" width="40" height="40" />
        <div>
          <span>${escapeHtml(ui.appTitle || 'Minimum Phone')}</span>
          <span class="brand-sub">${escapeHtml(ui.subtitle || 'Digital Fortress & Safe Private DNS')}</span>
        </div>
      </a>
      <div class="nav-actions">
        <a href="#features" class="btn btn-secondary" style="padding:9px 14px;font-size:13px;">✨ ${escapeHtml(langData.ctaExploreFeatures)}</a>
        <a href="/blog/" class="btn btn-secondary" style="padding:9px 14px;font-size:13px;border-color:rgba(16,185,129,0.5);color:#34d399;">📚 57 Benefit Guides</a>
        <a href="/qr-card.html" class="btn btn-amber" style="padding:9px 14px;font-size:13px;">🖨️ ${escapeHtml(langData.ctaPrintQr)}</a>
        <a href="${APK_DOWNLOAD_URL}" class="btn btn-primary" style="padding:9px 16px;font-size:13px;">⬇ ${escapeHtml(langData.ctaDownloadApk)}</a>
      </div>
    </div>
  </header>

  <!-- 12-Language Instant SEO Switcher Strip -->
  <nav class="lang-strip" aria-label="Language Switcher">
    <div class="container lang-strip-inner">
      ${LANG_CODES.map((code) => {
        const l = ALL_LANGS[code];
        const active = code === langData.code ? 'active' : '';
        const href = code === 'en' && isRootIndex ? '/en/' : `/${code}/`;
        return `<a href="${href}" class="lang-pill ${active}" hreflang="${code}" title="${escapeHtml(l.englishName)}">${l.flag} ${escapeHtml(l.nativeName)}</a>`;
      }).join('\n      ')}
    </div>
  </nav>

  <!-- Hero Section -->
  <main>
    <section class="hero">
      <div class="container">
        <div class="hero-grid">
          <div>
            <div class="badge">🛡️ ${escapeHtml(langData.heroBadge)}</div>
            <h1>${escapeHtml(langData.heroTitle)}</h1>
            <p class="hero-sub">${escapeHtml(langData.heroSubtitle)}</p>
            <div class="cta-row">
              <a href="${APK_DOWNLOAD_URL}" class="btn btn-primary">⬇ ${escapeHtml(langData.ctaDownloadApk)}</a>
              <a href="${PLAY_STORE_URL}" target="_blank" rel="noopener" class="btn btn-secondary">▶ ${escapeHtml(langData.ctaPlayStore)}</a>
              <a href="/qr-card.html" class="btn btn-amber">🧱 ${escapeHtml(langData.ctaPrintQr)}</a>
            </div>
            <p style="font-size:12.5px;color:var(--muted);">
              Package ID: <code>com.kasbllc.minimumphone</code> • Version <code>2.9.1 (build 23)</code> • Android 8.0–15+ • Zero <code>INTERNET</code> Permission
            </p>
          </div>

          <!-- Interactive Minimalist Launcher Mockup -->
          <div>
            <div class="phone-mock" aria-label="Minimum Phone Launcher Preview">
              <div class="mock-status">
                <span>📍 ${escapeHtml(ui.gpsAutoBadge || 'Auto GPS')} • 98% 🔋</span>
                <span class="mock-badge-dns">🛡️ ${escapeHtml(ui.dnsActive || 'SAFE DNS ON')}</span>
              </div>
              <div class="mock-clock">
                <div class="mock-time">09:41</div>
                <div class="mock-date">${escapeHtml(ui.dayFri || 'Friday')} • ${escapeHtml(ui.nightLockActive || 'NIGHT LOCK')} 22:00</div>
              </div>
              <div class="mock-profiles">
                <div class="mock-prof active">💼 ${escapeHtml(ui.profileWork || 'Work')}</div>
                <div class="mock-prof">🏠 ${escapeHtml(ui.profilePersonal || 'Personal')}</div>
                <div class="mock-prof">🌆 ${escapeHtml(ui.profileSunset || 'Sunset')}</div>
              </div>
              <div class="mock-wisdom">
                <div>“${escapeHtml((wisdomList[0] && wisdomList[0].text) || 'Verily, in the remembrance of Allah do hearts find rest.')}”</div>
                <div class="mock-wisdom-ref">— ${escapeHtml((wisdomList[0] && wisdomList[0].ref) || 'Quran 13:28')}</div>
              </div>
              <div class="mock-app-list">
                <div class="mock-app-item">
                  <span>📞 ${escapeHtml(ui.catCalls || 'Phone Calls')}</span>
                  <span class="mock-tier">${escapeHtml(ui.tierEssential || 'Essential')}</span>
                </div>
                <div class="mock-app-item">
                  <span>📝 ${escapeHtml(ui.navKeepNotes || 'Keep Notes')}</span>
                  <span class="mock-tier">${escapeHtml(ui.tierEssential || 'Essential')}</span>
                </div>
                <div class="mock-app-item">
                  <span>🗺️ ${escapeHtml(ui.catMaps || 'Maps')}</span>
                  <span class="mock-tier">${escapeHtml(ui.tierUtility || 'Utility')}</span>
                </div>
                <div class="mock-app-item">
                  <span>🌐 ${escapeHtml(ui.catBrowser || 'Browser')}</span>
                  <span class="mock-tier restricted">⏳ ${escapeHtml(ui.gate15sBtn || '15s Gate')} • 🌙 QR</span>
                </div>
                <div class="mock-app-item">
                  <span>📱 ${escapeHtml(ui.catSocial || 'Social Feed')}</span>
                  <span class="mock-tier restricted">⏳ ${escapeHtml(ui.gate15sBtn || '15s Gate')} • 🌙 QR</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 4 Key Metrics -->
        <div class="stats-grid">
          ${langData.stats.map((s) => `
          <div class="stat-card">
            <div class="stat-val">${escapeHtml(s.value)}</div>
            <div class="stat-lbl">${escapeHtml(s.label)}</div>
          </div>`).join('')}
        </div>
      </div>
    </section>

    <!-- Every Feature Explained + How You Benefit (12 Modules) -->
    <section id="features">
      <div class="container">
        <div class="sec-head">
          <h2>${escapeHtml(langData.featuresHeading)}</h2>
          <p>${escapeHtml(langData.featuresSubheading)}</p>
        </div>

        <div class="features-grid">
          ${langData.features.map((f) => `
          <article class="feat-card">
            <div>
              <div class="feat-top">
                <div class="feat-icon">${f.icon}</div>
                <span class="feat-tag">${escapeHtml(f.tag)}</span>
              </div>
              <h3>${escapeHtml(f.title)}</h3>
              <p class="feat-how"><strong>${escapeHtml(langData.howItWorksLabel)}</strong> ${escapeHtml(f.how)}</p>
            </div>
            <div class="feat-benefit">
              <strong>✅ ${escapeHtml(langData.benefitLabel)}</strong>
              ${escapeHtml(f.benefit)}
            </div>
          </article>`).join('')}
        </div>

        <!-- 12 Safe System Quick-Settings Bar Preview -->
        <div style="margin-top:36px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:26px;">
          <h3 style="text-align:center;font-size:18px;margin-bottom:6px;">⚡ ${escapeHtml(ui.safeSubSettings || 'Quick System Settings & Tools (12 Safe Shortcuts)')}</h3>
          <p style="text-align:center;color:var(--muted);font-size:14px;">${escapeHtml(ui.lockPhoneSettingsSub || 'Access all daily phone controls safely from the left Sidebar while full Android Settings remains protected.')}</p>
          <div class="tools-grid">
            ${quickTools.map((t) => `<div class="tool-chip"><span>${t.icon}</span>${escapeHtml(t.label)}</div>`).join('')}
          </div>
        </div>
      </div>
    </section>

    <!-- Who Benefits & How (6 Personas) -->
    <section id="benefits">
      <div class="container">
        <div class="sec-head">
          <h2>${escapeHtml(langData.personasHeading)}</h2>
          <p>${escapeHtml(langData.personasSubheading)}</p>
        </div>
        <div class="personas-grid">
          ${langData.personas.map((p) => `
          <div class="persona-card">
            <div class="persona-icon">${p.icon}</div>
            <h3>${escapeHtml(p.title)}</h3>
            <p>${escapeHtml(p.body)}</p>
          </div>`).join('')}
        </div>
      </div>
    </section>

    <!-- 57 In-Depth SEO Benefit Guides & Use Cases Hub -->
    <section id="blog-guides">
      <div class="container">
        <div class="sec-head">
          <h2>📚 57 Proven Ways a Person Benefits from Minimum Phone</h2>
          <p>Explore our complete library of ${ALL_BLOG_POSTS.length} science-backed guides on stopping doomscrolling, blocking adult sites via DNS 1.1.1.3, locking Android Settings with a free QR key, mastering 90-minute Monk Mode, and protecting families across 12 languages.</p>
        </div>

        <div class="personas-grid" style="margin-bottom:24px;">
          ${ALL_BLOG_POSTS.slice(0, 9).map((bp) => `
          <article class="persona-card" style="display:flex;flex-direction:column;justify-content:space-between;">
            <div>
              <span class="feat-tag" style="display:inline-block;margin-bottom:10px;">Guide #${bp.id} · ${escapeHtml(bp.category)}</span>
              <h3 style="font-size:17px;margin-bottom:8px;"><a href="/blog/${bp.slug}/" style="color:var(--text);">${escapeHtml(bp.title)}</a></h3>
              <p style="font-size:13.5px;color:var(--muted);margin-bottom:12px;">${escapeHtml(bp.metaDescription)}</p>
            </div>
            <div style="padding-top:10px;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;font-size:12.5px;">
              <span style="color:#34d399;font-weight:700;">✅ ${escapeHtml(bp.quantifiedBenefit.slice(0, 48))}...</span>
              <a href="/blog/${bp.slug}/" style="color:var(--emerald);font-weight:800;">Read →</a>
            </div>
          </article>`).join('')}
        </div>

        <details class="faq-item" open>
          <summary>📖 Browse Complete Directory of All ${ALL_BLOG_POSTS.length} Benefit Guides (100% Indexed for Search &amp; AI)</summary>
          <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border);display:grid;grid-template-columns:repeat(auto-fill,minmax(310px,1fr));gap:10px;">
            ${ALL_BLOG_POSTS.map((bp) => `
            <a href="/blog/${bp.slug}/" style="background:var(--surface-2);border:1px solid var(--border);border-radius:10px;padding:10px 12px;font-size:13px;color:var(--text);display:block;">
              <strong style="color:#34d399;">#${bp.id}:</strong> ${escapeHtml(bp.title)}
            </a>`).join('')}
          </div>
          <div style="text-align:center;margin-top:18px;">
            <a href="/blog/" class="btn btn-primary">Open Interactive ${ALL_BLOG_POSTS.length}-Article Knowledge Hub (/blog/) →</a>
          </div>
        </details>
      </div>
    </section>

    <!-- Curated Wisdom Bank & 15s Reflection Quiz Samples in This Language -->
    <section id="wisdom">
      <div class="container">
        <div class="sec-head">
          <h2>🕊️ ${escapeHtml(ui.gateTitle || '15-Second Mindful Pause & Wisdom Gate')} (${escapeHtml(langData.nativeName)})</h2>
          <p>${escapeHtml(ui.gateSub || 'Read the wisdom below while the 15-second timer completes, then answer the reflection question to proceed.')}</p>
        </div>
        <div class="wisdom-grid">
          ${wisdomList.map((w) => `
          <div class="wisdom-card">
            <div>
              <span class="wisdom-cat">✦ ${escapeHtml(w.category.toUpperCase())}</span>
              <p class="wisdom-text">“${escapeHtml(w.text)}”</p>
              <div class="wisdom-ref">— ${escapeHtml(w.ref)}</div>
            </div>
            <div class="wisdom-quiz">
              <strong>❓ ${escapeHtml(w.question)}</strong>
              ✓ ${escapeHtml(w.correctAnswer)}
            </div>
          </div>`).join('')}
        </div>
      </div>
    </section>

    <!-- Printable Physical QR Fortress Key Section -->
    <section id="qr-key">
      <div class="container">
        <div class="qr-banner">
          <div>
            ${renderQrSvg()}
          </div>
          <div>
            <div class="badge" style="margin-bottom:10px;">🌙 ${escapeHtml(ui.sleepScheduleTitle || 'Night Fortress Window (22:00 – 06:00)')}</div>
            <h2 style="font-size:26px;font-weight:800;margin-bottom:10px;">${escapeHtml(ui.qrCardTitle || 'Physical QR Fortress Key (Print & Keep in Another Room)')}</h2>
            <p style="color:var(--muted);margin-bottom:18px;font-size:15px;">${escapeHtml(ui.qrCardSub || '')}</p>
            <div class="cta-row" style="margin-bottom:0;">
              <a href="/qr-card.html" class="btn btn-primary">🖨️ ${escapeHtml(ui.printQrBtn || 'Print / Save QR Sheet (PDF)')}</a>
              <a href="${APK_DOWNLOAD_URL}" class="btn btn-secondary">⬇ ${escapeHtml(langData.ctaDownloadApk)}</a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 5-Step Protection Setup Wizard & Official User Guide (Synced from App i18n) -->
    <section id="setup-guide">
      <div class="container">
        <div class="sec-head">
          <h2>${escapeHtml(ui.wizardTitle || '5-Step Installation & Protection Setup Guide')}</h2>
          <p>${escapeHtml(ui.wizardSubtitle || '')}</p>
        </div>
        <div class="steps-grid">
          ${setupSteps.map((s) => `
          <div class="step-card">
            <span class="step-num">STEP ${s.num}</span>
            <h4>${escapeHtml(s.title)}</h4>
            <p>${escapeHtml(s.todo)}</p>
          </div>`).join('')}
        </div>

        <div class="sec-head" style="margin-top:48px;margin-bottom:28px;">
          <h2>${escapeHtml(ui.userGuideTitle || 'Complete Minimum Phone User Guide')}</h2>
          <p>${escapeHtml(ui.userGuideIntro || '')}</p>
        </div>
        <div class="guide-grid">
          ${userGuideSections.map((g) => `
          <div class="guide-card">
            <h4>${escapeHtml(g.title)}</h4>
            <p>${escapeHtml(g.body)}</p>
          </div>`).join('')}
        </div>
      </div>
    </section>

    <!-- App Screenshots Gallery -->
    <section id="screenshots">
      <div class="container">
        <div class="sec-head">
          <h2>📸 ${escapeHtml(ui.appTitle || 'Minimum Phone')} — Interface Preview</h2>
          <p>${escapeHtml(ui.themeOled || 'OLED Pitch Black')} • ${escapeHtml(ui.themeEink || 'E-Ink Warm Paper')} • ${escapeHtml(ui.themeAmber || 'Sunset Zero-Blue')}</p>
        </div>
        <div class="shots-grid">
          <div class="shot-card">
            <img src="/assets/screenshot-1-home-1080x1920.png" alt="Minimum Phone Minimalist Home Screen" loading="lazy" />
            <span>1. ${escapeHtml(ui.drawerHome || 'Minimalist Launcher')}</span>
          </div>
          <div class="shot-card">
            <img src="/assets/screenshot-2-inhale-1080x1920.png" alt="Minimum Phone 15-Second Mindful Pause & Wisdom Gate" loading="lazy" />
            <span>2. ${escapeHtml(ui.gateTitle || '15s Mindful Wisdom Gate')}</span>
          </div>
          <div class="shot-card">
            <img src="/assets/screenshot-3-purity-1080x1920.png" alt="Minimum Phone Safe Private DNS & Purity Shield" loading="lazy" />
            <span>3. ${escapeHtml(ui.drawerPurity || 'Purity & Safe Private DNS')}</span>
          </div>
          <div class="shot-card">
            <img src="/assets/screenshot-4-focus-1080x1920.png" alt="Minimum Phone Monk Mode, Notification Digest & Physical QR Key" loading="lazy" />
            <span>4. ${escapeHtml(ui.drawerFocus || 'Focus, Monk Mode & QR Key')}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Competitor Comparison Table -->
    <section id="comparison">
      <div class="container">
        <div class="sec-head">
          <h2>${escapeHtml(langData.compHeading)}</h2>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                ${langData.compHeaders.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${langData.compRows.map((row) => `
              <tr>
                ${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- SEO FAQ Accordion -->
    <section id="faq">
      <div class="container">
        <div class="sec-head">
          <h2>❓ ${escapeHtml(langData.faqHeading)}</h2>
        </div>
        <div class="faq-list">
          ${langData.faqs.map((f, i) => `
          <details class="faq-item" ${i === 0 ? 'open' : ''}>
            <summary>${escapeHtml(f.q)}</summary>
            <p>${escapeHtml(f.a)}</p>
          </details>`).join('')}
        </div>
      </div>
    </section>

    <!-- Complete 12-Language Global SEO Directory -->
    <section id="languages">
      <div class="container">
        <div class="sec-head">
          <h2>🌐 ${escapeHtml(ui.langCardTitle || 'Available in 12 Languages (100% Translated)')}</h2>
          <p>Read the complete Minimum Phone feature guide and benefits in your preferred native language:</p>
        </div>
        <div class="lang-matrix">
          ${LANG_CODES.map((code) => {
            const l = ALL_LANGS[code];
            const active = code === langData.code ? 'active' : '';
            return `
          <a href="/${code}/" class="lang-card ${active}" hreflang="${code}">
            <span class="lang-flag">${l.flag}</span>
            <div>
              <span class="lang-native">${escapeHtml(l.nativeName)}</span>
              <span class="lang-en">${escapeHtml(l.englishName)} • /${code}/</span>
            </div>
          </a>`;
          }).join('')}
        </div>

        <!-- Inline Multilingual Features & Benefits Digest in All 12 Languages -->
        <div style="margin-top:42px;display:flex;flex-direction:column;gap:18px;">
          ${LANG_CODES.map((code) => {
            const l = ALL_LANGS[code];
            return `
          <details class="faq-item" ${code === langData.code ? 'open' : ''} dir="${l.dir}">
            <summary>
              <span>${l.flag} <strong>${escapeHtml(l.nativeName)} (${escapeHtml(l.englishName)})</strong> — ${escapeHtml(l.heroTitle)}</span>
            </summary>
            <div style="margin-top:14px;padding-top:14px;border-top:1px solid var(--border);">
              <p style="color:var(--text);font-size:15px;margin-bottom:14px;">${escapeHtml(l.heroSubtitle)}</p>
              <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:12px;margin-bottom:16px;">
                ${l.features.map((f) => `
                <div style="background:var(--surface-2);border:1px solid var(--border);border-radius:10px;padding:12px;">
                  <div style="font-weight:750;font-size:14px;color:#34d399;margin-bottom:4px;">${f.icon} ${escapeHtml(f.title)}</div>
                  <div style="font-size:12.8px;color:var(--muted);margin-bottom:6px;">${escapeHtml(f.how)}</div>
                  <div style="font-size:12.5px;color:#d1fae5;"><strong>✅ ${escapeHtml(l.benefitLabel)}</strong> ${escapeHtml(f.benefit)}</div>
                </div>`).join('')}
              </div>
              <a href="/${code}/" class="btn btn-primary" style="padding:9px 16px;font-size:13px;">${l.flag} Open Full ${escapeHtml(l.nativeName)} SEO Page (/${code}/) →</a>
            </div>
          </details>`;
          }).join('')}
        </div>
      </div>
    </section>
  </main>

  <!-- Footer -->
  <footer>
    <div class="container footer-grid">
      <div>
        <strong style="color:var(--text);">Minimum Phone: Detox &amp; Focus (v2.9.1)</strong> — Built by <strong>Kasb LLC</strong> (<a href="https://kasbpro.com" style="color:var(--emerald);">kasbpro.com</a>)<br/>
        <span>1209 Mountain Road Pl NE Ste N, Albuquerque, NM 87110, USA • <a href="mailto:info@kasbpro.com">info@kasbpro.com</a></span>
      </div>
      <div class="footer-links">
        <a href="/">Home</a>
        <a href="/blog/">57 Benefit Guides</a>
        <a href="/qr-card.html">Printable QR Key</a>
        <a href="/privacy-policy.html">Privacy Policy</a>
        <a href="/sitemap.xml">Sitemap XML</a>
        <a href="/rss.xml">RSS Feed</a>
        <a href="/llms.txt">LLMs.txt</a>
        <a href="/llms-full.txt">LLMs-Full.txt</a>
        <a href="https://kasbpro.com">KasbPro Ecosystem</a>
      </div>
    </div>
  </footer>

</body>
</html>`;
}

function renderQrPrintPage(appI18nAll) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Minimum Phone — Printable Physical QR Fortress Key (KASB-BRICK-77)</title>
  <meta name="description" content="Print your personal Minimum Phone Physical QR Fortress Card (KASB-BRICK-77) and place it in another room away from your bed to unlock Night Fortress (22:00–06:00)." />
  <link rel="canonical" href="${SITE_ORIGIN}/qr-card.html" />
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #f4f4f5;
      color: #09090b;
      margin: 0;
      padding: 32px 16px;
    }
    .sheet {
      max-width: 760px;
      margin: 0 auto;
      background: #ffffff;
      border: 3px solid #09090b;
      border-radius: 20px;
      padding: 36px;
      text-align: center;
      box-shadow: 0 12px 35px rgba(0,0,0,0.08);
    }
    .badge {
      display: inline-block;
      background: #09090b;
      color: #ffffff;
      font-weight: 800;
      font-size: 12px;
      padding: 5px 14px;
      border-radius: 99px;
      letter-spacing: 0.06em;
      margin-bottom: 14px;
    }
    h1 { font-size: 28px; margin: 0 0 10px; }
    .sub { color: #3f3f46; font-size: 15px; max-width: 580px; margin: 0 auto 24px; line-height: 1.6; }
    .qr-box {
      display: inline-block;
      padding: 20px;
      border: 2px dashed #09090b;
      border-radius: 16px;
      margin-bottom: 24px;
    }
    .lang-notes {
      text-align: left;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-top: 20px;
      border-top: 1px solid #e4e4e7;
      padding-top: 20px;
    }
    .lang-note {
      background: #fafafa;
      border: 1px solid #e4e4e7;
      border-radius: 10px;
      padding: 10px 12px;
      font-size: 12.5px;
      line-height: 1.5;
    }
    .actions {
      margin-bottom: 24px;
      display: flex;
      justify-content: center;
      gap: 12px;
    }
    .btn {
      padding: 11px 20px;
      border-radius: 10px;
      font-weight: 700;
      font-size: 14px;
      cursor: pointer;
      border: 1px solid #09090b;
      background: #09090b;
      color: #ffffff;
      text-decoration: none;
    }
    .btn-outline { background: #ffffff; color: #09090b; }
    @media print {
      body { background: #ffffff; padding: 0; }
      .actions { display: none; }
      .sheet { box-shadow: none; border-width: 2px; }
    }
  </style>
</head>
<body>
  <div class="actions">
    <button class="btn" onclick="window.print()">🖨️ Print Physical QR Sheet (A4 / Letter)</button>
    <a class="btn btn-outline" href="/">← Back to Minimum Phone SEO Hub</a>
  </div>
  <div class="sheet">
    <div class="badge">MINIMUM PHONE BY KASB LLC • NIGHT FORTRESS KEY</div>
    <h1>🧱 Physical QR Fortress Card</h1>
    <p class="sub">
      Keep this printed sheet in <strong>ANOTHER ROOM</strong> (e.g., kitchen, living room, or bookshelf — <strong>never in your bedroom!</strong>). Between <strong>22:00 and 06:00</strong>, scan this QR code with your phone camera when you need emergency access.
    </p>
    <div class="qr-box">
      ${renderQrSvg().replace('width="180" height="180"', 'width="240" height="240"')}
      <div style="font-family:monospace;font-weight:800;font-size:14px;margin-top:10px;letter-spacing:0.08em;">MINIMUM PHONE // PHYSICAL ANCHOR</div>
    </div>
    <div class="lang-notes">
      ${LANG_CODES.map((code) => {
        const l = ALL_LANGS[code];
        const ui = appI18nAll[code] || appI18nAll.en;
        return `<div class="lang-note" dir="${l.dir}"><strong>${l.flag} ${escapeHtml(l.nativeName)}:</strong> ${escapeHtml(ui.qrSheetDocSub || '')}</div>`;
      }).join('')}
    </div>
  </div>
</body>
</html>`;
}

function buildSitemapXml() {
  const nowIso = new Date().toISOString().split('T')[0];
  const coreUrls = ['', ...LANG_CODES.map((c) => `${c}/`), 'privacy-policy.html', 'qr-card.html', 'blog/'];
  const alternates = [
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE_ORIGIN}/" />`,
    `    <xhtml:link rel="alternate" hreflang="en" href="${SITE_ORIGIN}/" />`,
    ...LANG_CODES.map((c) => `    <xhtml:link rel="alternate" hreflang="${c}" href="${SITE_ORIGIN}/${c}/" />`),
  ].join('\n');

  const coreEntries = coreUrls.map((u) => {
    const loc = `${SITE_ORIGIN}/${u}`;
    const priority = u === '' || u === 'blog/' ? '1.0' : u.endsWith('/') ? '0.9' : '0.8';
    const includeAlt = u === '' || LANG_CODES.includes(u.replace('/', ''));
    return `  <url>
    <loc>${loc}</loc>
    <lastmod>${nowIso}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${priority}</priority>${includeAlt ? `\n${alternates}` : ''}
  </url>`;
  });

  const blogEntries = ALL_BLOG_POSTS.map((p) => {
    const loc = `${SITE_ORIGIN}/blog/${p.slug}/`;
    return `  <url>
    <loc>${loc}</loc>
    <lastmod>${p.updatedAt}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${coreEntries.join('\n')}
${blogEntries.join('\n')}
</urlset>`;
}

function buildLlmsTxt() {
  return `# Minimum Phone: The Anti-Dopamine Minimalist Launcher & Digital Fortress (by Kasb LLC)

> Official SEO & Documentation Site: ${SITE_ORIGIN}
> 57 Benefit Guides & Knowledge Hub: ${SITE_ORIGIN}/blog/
> Full Machine-Readable AI Corpus: ${SITE_ORIGIN}/llms-full.txt
> RSS 2.0 Feed: ${SITE_ORIGIN}/rss.xml | JSON Feed: ${SITE_ORIGIN}/feed.json
> Developer: Kasb LLC (https://kasbpro.com)
> Package ID: com.kasbllc.minimumphone | Latest Release: v2.9.1 (build 23)
> Price: 100% Free Forever ($0) | Ads: Zero | Telemetry: Zero (No android.permission.INTERNET)

## Summary
Minimum Phone is a 100% free, ad-free, offline-first Android minimalist launcher and digital fortress engineered by Kasb LLC. It replaces $30-$60/year screen-time apps and $59 hardware NFC blockers by combining behavioral neuroscience, OS-level Private DNS adult content filtering, a 250ms native Android Settings lock, a free printable Physical QR Fortress Key (KASB-BRICK-77) for nighttime protection (22:00-06:00), a 15-second Mindful Pause with 535+ curated Quran, Sahih Hadith, and Proverb reflections, Emergency Urge SOS, Monk Mode Deep Work Timer, and a built-in Google Keep-style Notes & Checklists workspace.

## 12 Core Features & How Users Benefit
${ALL_LANGS.en.features.map((f, i) => `${i + 1}. **${f.title}**\n   - How it works: ${f.how}\n   - How you benefit: ${f.benefit}`).join('\n')}

## Supported Languages (12 Full Editions)
${LANG_CODES.map((c) => `- [${ALL_LANGS[c].nativeName} (${ALL_LANGS[c].englishName})](${SITE_ORIGIN}/${c}/): ${ALL_LANGS[c].seoDesc}`).join('\n')}

## 57 In-Depth Guides on How a Person Benefits from Minimum Phone
${ALL_BLOG_POSTS.map((p) => `${p.id}. [${p.title}](${SITE_ORIGIN}/blog/${p.slug}/) — *${p.quantifiedBenefit}* (${p.aiSummary.slice(0, 180)}...)`).join('\n')}

## Links
- Direct APK Download: ${APK_DOWNLOAD_URL}
- Google Play Store: ${PLAY_STORE_URL}
- All 57 Benefit Guides: ${SITE_ORIGIN}/blog/
- Full AI Knowledge Corpus: ${SITE_ORIGIN}/llms-full.txt
- Printable Physical QR Card: ${SITE_ORIGIN}/qr-card.html
- Privacy Policy: ${SITE_ORIGIN}/privacy-policy.html
`;
}

function main() {
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(path.join(OUT_DIR, 'assets'), { recursive: true });

  const appI18nAll = parseAppI18n();
  const wisdomAll = parseWisdomSamples();

  // Copy graphics assets
  const graphicsDir = path.join(ROOT, 'play-store-submission', 'graphics');
  const assetFiles = [
    'icon-512x512.png',
    'feature-graphic-1024x500.png',
    'screenshot-1-home-1080x1920.png',
    'screenshot-2-inhale-1080x1920.png',
    'screenshot-3-purity-1080x1920.png',
    'screenshot-4-focus-1080x1920.png',
  ];
  for (const file of assetFiles) {
    const src = path.join(graphicsDir, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(OUT_DIR, 'assets', file));
    }
  }
  const fbCover = path.join(graphicsDir, 'social', 'fb-cover-1640x856.png');
  if (fs.existsSync(fbCover)) {
    fs.copyFileSync(fbCover, path.join(OUT_DIR, 'assets', 'fb-cover-1640x856.png'));
  }

  // Generate root index.html (English default)
  fs.writeFileSync(path.join(OUT_DIR, 'index.html'), renderPage('en', true, appI18nAll, wisdomAll), 'utf8');

  // Generate all 12 language subdirectories
  for (const code of LANG_CODES) {
    const langDir = path.join(OUT_DIR, code);
    fs.mkdirSync(langDir, { recursive: true });
    fs.writeFileSync(path.join(langDir, 'index.html'), renderPage(code, false, appI18nAll, wisdomAll), 'utf8');
  }

  // Copy & enhance privacy policy
  const privSrc = path.join(ROOT, 'docs', 'privacy-policy.html');
  if (fs.existsSync(privSrc)) {
    const privHtml = fs.readFileSync(privSrc, 'utf8');
    fs.writeFileSync(path.join(OUT_DIR, 'privacy-policy.html'), privHtml, 'utf8');
    fs.mkdirSync(path.join(OUT_DIR, 'privacy-policy'), { recursive: true });
    fs.writeFileSync(path.join(OUT_DIR, 'privacy-policy', 'index.html'), privHtml, 'utf8');
  }

  // Printable QR Key Page
  fs.writeFileSync(path.join(OUT_DIR, 'qr-card.html'), renderQrPrintPage(appI18nAll), 'utf8');

  // Generate 57 SEO Benefit Blog Posts, /blog/ Hub, RSS, JSON Feed, llms-full.txt & IndexNow key
  generateAllBlogAssets(OUT_DIR, ALL_LANGS, SITE_ORIGIN, PLAY_STORE_URL, APK_DOWNLOAD_URL);

  // Sitemap, robots.txt (explicit Search + AI crawler permissions), llms.txt, health
  fs.writeFileSync(path.join(OUT_DIR, 'sitemap.xml'), buildSitemapXml(), 'utf8');
  const robotsTxt = [
    'User-agent: *',
    'Allow: /',
    '',
    'User-agent: Googlebot',
    'Allow: /',
    '',
    'User-agent: Bingbot',
    'Allow: /',
    '',
    'User-agent: GPTBot',
    'Allow: /',
    '',
    'User-agent: OAI-SearchBot',
    'Allow: /',
    '',
    'User-agent: ChatGPT-User',
    'Allow: /',
    '',
    'User-agent: ClaudeBot',
    'Allow: /',
    '',
    'User-agent: Claude-Web',
    'Allow: /',
    '',
    'User-agent: PerplexityBot',
    'Allow: /',
    '',
    'User-agent: Google-Extended',
    'Allow: /',
    '',
    'User-agent: Applebot-Extended',
    'Allow: /',
    '',
    'User-agent: Yandex',
    'Allow: /',
    '',
    'User-agent: DuckDuckBot',
    'Allow: /',
    '',
    `Sitemap: ${SITE_ORIGIN}/sitemap.xml`,
    `Host: minimumphone.kasbpro.com`,
    '',
  ].join('\n');
  fs.writeFileSync(path.join(OUT_DIR, 'robots.txt'), robotsTxt, 'utf8');
  fs.writeFileSync(path.join(OUT_DIR, 'llms.txt'), buildLlmsTxt(), 'utf8');
  fs.writeFileSync(path.join(OUT_DIR, 'health'), 'ok\n', 'utf8');

  console.log(`Built Minimum Phone SEO site in ${OUT_DIR} for ${LANG_CODES.length} languages and ${ALL_BLOG_POSTS.length} benefit guides.`);
}

main();

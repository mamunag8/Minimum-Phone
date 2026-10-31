import fs from 'node:fs';
import path from 'node:path';
import { BLOG_POSTS_PART1 } from './seo_blog_posts_part1.mjs';
import { BLOG_POSTS_PART2 } from './seo_blog_posts_part2.mjs';
import { BLOG_POSTS_PART3 } from './seo_blog_posts_part3.mjs';

export const ALL_BLOG_POSTS = [
  ...BLOG_POSTS_PART1,
  ...BLOG_POSTS_PART2,
  ...BLOG_POSTS_PART3,
];

export const INDEXNOW_KEY = '8f4e2a9c1b7d3e6f5a0c9b8e7d6c5b4a';

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderPostHtml(post, allLangs, siteOrigin, playStoreUrl, apkDownloadUrl) {
  const canonicalUrl = `${siteOrigin}/blog/${post.slug}/`;
  const prevPost = ALL_BLOG_POSTS.find((p) => p.id === post.id - 1) || ALL_BLOG_POSTS[ALL_BLOG_POSTS.length - 1];
  const nextPost = ALL_BLOG_POSTS.find((p) => p.id === post.id + 1) || ALL_BLOG_POSTS[0];
  const relatedPosts = ALL_BLOG_POSTS.filter((p) => p.id !== post.id && p.categorySlug === post.categorySlug).slice(0, 6);

  const isRtlPost = post.slug.startsWith('arabic-') || post.slug.startsWith('urdu-');
  const dirAttr = isRtlPost ? 'rtl' : 'ltr';
  const langAttr = post.slug.startsWith('bengali-')
    ? 'bn'
    : post.slug.startsWith('arabic-')
    ? 'ar'
    : post.slug.startsWith('urdu-')
    ? 'ur'
    : post.slug.startsWith('indonesian-')
    ? 'id'
    : post.slug.startsWith('turkish-')
    ? 'tr'
    : post.slug.startsWith('hindi-')
    ? 'hi'
    : post.slug.startsWith('malay-')
    ? 'ms'
    : post.slug.startsWith('spanish-')
    ? 'es'
    : post.slug.startsWith('french-')
    ? 'fr'
    : post.slug.startsWith('german-')
    ? 'de'
    : post.slug.startsWith('russian-')
    ? 'ru'
    : 'en';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': ['BlogPosting', 'TechArticle'],
        '@id': `${canonicalUrl}#article`,
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': canonicalUrl,
        },
        headline: post.title,
        description: post.metaDescription,
        keywords: post.keywords,
        articleSection: post.category,
        inLanguage: langAttr,
        datePublished: `${post.publishedAt}T08:00:00+00:00`,
        dateModified: `${post.updatedAt}T09:00:00+00:00`,
        author: {
          '@type': 'Organization',
          name: 'Kasb LLC Digital Wellbeing Research Team',
          url: 'https://kasbpro.com',
        },
        publisher: {
          '@type': 'Organization',
          name: 'Kasb LLC',
          url: 'https://kasbpro.com',
          logo: {
            '@type': 'ImageObject',
            url: `${siteOrigin}/assets/icon-512x512.png`,
          },
        },
        image: [
          `${siteOrigin}/assets/fb-cover-1640x856.png`,
          `${siteOrigin}/assets/feature-graphic-1024x500.png`,
        ],
        about: {
          '@type': 'MobileApplication',
          name: 'Minimum Phone — Digital Fortress & Minimalist Launcher',
          operatingSystem: 'Android 7.0+',
          applicationCategory: 'ProductivityApplication',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
          },
        },
        speakable: {
          '@type': 'SpeakableSpecification',
          cssSelector: ['.ai-summary-box', 'h1', '.quantified-box'],
        },
      },
      {
        '@type': 'HowTo',
        '@id': `${canonicalUrl}#howto`,
        name: post.title,
        description: post.aiSummary,
        totalTime: 'PT3M',
        step: post.howItWorksSteps.map((s, idx) => ({
          '@type': 'HowToStep',
          position: idx + 1,
          name: s.title,
          text: s.detail,
        })),
      },
      {
        '@type': 'FAQPage',
        '@id': `${canonicalUrl}#faq`,
        mainEntity: post.faqs.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: {
            '@type': 'Answer',
            text: f.a,
          },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonicalUrl}#breadcrumb`,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Minimum Phone Home',
            item: `${siteOrigin}/`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: '57 Benefit Guides & SEO Knowledge Hub',
            item: `${siteOrigin}/blog/`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: post.title,
            item: canonicalUrl,
          },
        ],
      },
    ],
  };

  const langCodes = Object.keys(allLangs);

  return `<!DOCTYPE html>
<html lang="${langAttr}" dir="${dirAttr}" data-theme="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(post.title)} | Minimum Phone Benefit Guide #${post.id}</title>
  <meta name="description" content="${escapeHtml(post.metaDescription)}" />
  <meta name="keywords" content="${escapeHtml(post.keywords)}" />
  <meta name="author" content="Kasb LLC (com.kasbllc.minimumphone)" />
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
  <meta name="googlebot" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
  <meta name="bingbot" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
  <link rel="canonical" href="${canonicalUrl}" />
  <link rel="icon" type="image/png" href="/assets/icon-512x512.png" />
  <link rel="apple-touch-icon" href="/assets/icon-512x512.png" />
  <link rel="alternate" type="application/rss+xml" title="Minimum Phone — 57 Benefit Guides RSS Feed" href="${siteOrigin}/rss.xml" />
  <link rel="alternate" type="application/feed+json" title="Minimum Phone — 57 Benefit Guides JSON Feed" href="${siteOrigin}/feed.json" />

  <!-- Open Graph / Article Metadata -->
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="Minimum Phone by Kasb LLC" />
  <meta property="og:title" content="${escapeHtml(post.title)}" />
  <meta property="og:description" content="${escapeHtml(post.metaDescription)}" />
  <meta property="og:url" content="${canonicalUrl}" />
  <meta property="og:image" content="${siteOrigin}/assets/fb-cover-1640x856.png" />
  <meta property="article:published_time" content="${post.publishedAt}T08:00:00+00:00" />
  <meta property="article:modified_time" content="${post.updatedAt}T09:00:00+00:00" />
  <meta property="article:section" content="${escapeHtml(post.category)}" />
  <meta property="article:author" content="Kasb LLC" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(post.title)}" />
  <meta name="twitter:description" content="${escapeHtml(post.metaDescription)}" />
  <meta name="twitter:image" content="${siteOrigin}/assets/fb-cover-1640x856.png" />

  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>

  <style>
    :root {
      --bg: #070a09;
      --bg-elev: #0e1412;
      --bg-card: #121a17;
      --border: #1f2e28;
      --text: #f1f5f3;
      --muted: #9cb0a7;
      --accent: #10b981;
      --accent-soft: rgba(16, 185, 129, 0.14);
      --amber: #f59e0b;
      --blue: #38bdf8;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, "Noto Sans", "Noto Sans Bengali", "Noto Sans Arabic", "Noto Sans Devanagari", sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.72;
      font-size: 16.5px;
    }
    a { color: var(--accent); text-decoration: none; }
    a:hover { text-decoration: underline; }
    .container { max-width: 980px; margin: 0 auto; padding: 0 20px; }
    .site-nav {
      position: sticky;
      top: 0;
      z-index: 50;
      background: rgba(7, 10, 9, 0.92);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border);
      padding: 12px 0;
    }
    .nav-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
      max-width: 1180px;
      margin: 0 auto;
      padding: 0 20px;
    }
    .brand {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      font-weight: 800;
      color: var(--text);
      font-size: 1rem;
      text-decoration: none;
    }
    .brand img { width: 32px; height: 32px; border-radius: 8px; }
    .nav-links { display: flex; flex-wrap: wrap; gap: 14px; align-items: center; font-size: 14px; }
    .nav-links a { color: var(--muted); font-weight: 600; }
    .nav-links a:hover { color: var(--accent); text-decoration: none; }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: var(--accent);
      color: #04130d !important;
      font-weight: 800;
      padding: 9px 16px;
      border-radius: 10px;
      font-size: 13.5px;
      text-decoration: none !important;
    }
    .btn-outline {
      background: var(--bg-card);
      color: var(--text) !important;
      border: 1px solid var(--border);
    }
    .breadcrumb {
      font-size: 13.5px;
      color: var(--muted);
      margin: 26px 0 14px;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
    }
    .meta-row {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 16px;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 700;
      padding: 4px 11px;
      border-radius: 999px;
      background: var(--accent-soft);
      color: var(--accent);
      border: 1px solid rgba(16, 185, 129, 0.3);
    }
    .badge-amber {
      background: rgba(245, 158, 11, 0.14);
      color: #fbbf24;
      border-color: rgba(245, 158, 11, 0.3);
    }
    .badge-blue {
      background: rgba(56, 189, 248, 0.14);
      color: #38bdf8;
      border-color: rgba(56, 189, 248, 0.3);
    }
    h1 {
      font-size: clamp(1.85rem, 3.6vw, 2.65rem);
      line-height: 1.22;
      margin: 0 0 18px;
      letter-spacing: -0.02em;
    }
    h2 {
      font-size: 1.48rem;
      margin: 40px 0 14px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--border);
      color: #ffffff;
    }
    h3 { font-size: 1.15rem; margin: 20px 0 8px; color: #e2f1ea; }
    .ai-summary-box {
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.13), rgba(14, 20, 18, 0.96));
      border: 1px solid rgba(16, 185, 129, 0.42);
      border-radius: 16px;
      padding: 22px 24px;
      margin: 22px 0;
    }
    .ai-summary-title {
      font-size: 12.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--accent);
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .quantified-box {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 20px;
      margin: 22px 0;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
      gap: 16px;
    }
    .q-metric {
      background: var(--bg-elev);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 14px;
    }
    .q-metric-label { font-size: 11.5px; text-transform: uppercase; color: var(--muted); font-weight: 700; letter-spacing: 0.05em; }
    .q-metric-val { font-size: 14.5px; font-weight: 700; color: var(--text); margin-top: 5px; }
    .toc-box {
      background: var(--bg-elev);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 18px 22px;
      margin: 24px 0;
    }
    .toc-box ul { margin: 8px 0 0; padding-left: 20px; }
    .toc-box li { margin-bottom: 6px; font-size: 14.5px; }
    .step-grid { display: grid; gap: 16px; margin: 20px 0; }
    .step-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-left: 4px solid var(--accent);
      border-radius: 14px;
      padding: 18px 20px;
    }
    .step-num {
      font-size: 12px;
      font-weight: 800;
      color: var(--accent);
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .ba-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 18px;
      margin: 20px 0;
    }
    @media (max-width: 720px) {
      .ba-grid { grid-template-columns: 1fr; }
    }
    .ba-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 20px;
    }
    .ba-before { border-top: 3px solid #ef4444; }
    .ba-after { border-top: 3px solid #10b981; }
    .lang-matrix {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 12px;
      margin: 20px 0;
    }
    .lang-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 14px;
      font-size: 13.5px;
    }
    .lang-card strong { color: var(--accent); display: block; margin-bottom: 4px; }
    details.faq-item {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 15px 18px;
      margin-bottom: 12px;
    }
    details.faq-item summary {
      font-weight: 700;
      cursor: pointer;
      color: var(--text);
    }
    details.faq-item p { margin: 10px 0 0; color: var(--muted); }
    .cta-banner {
      background: linear-gradient(135deg, #064e3b 0%, #0f172a 100%);
      border: 1px solid rgba(16, 185, 129, 0.4);
      border-radius: 20px;
      padding: 30px;
      margin: 40px 0;
      text-align: center;
    }
    .related-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
      margin: 20px 0 40px;
    }
    .related-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 18px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .related-card h4 { margin: 8px 0; font-size: 1rem; line-height: 1.4; }
    footer {
      border-top: 1px solid var(--border);
      padding: 36px 0 50px;
      color: var(--muted);
      font-size: 13.5px;
      margin-top: 50px;
    }
  </style>
</head>
<body>
  <nav class="site-nav" aria-label="Primary Navigation">
    <div class="nav-inner">
      <a href="/" class="brand">
        <img src="/assets/icon-512x512.png" alt="Minimum Phone Icon" width="32" height="32" />
        <span>Minimum Phone <span style="color:var(--accent);font-weight:600;font-size:12px;">v2.9.1</span></span>
      </a>
      <div class="nav-links">
        <a href="/">Home</a>
        <a href="/blog/" style="color:var(--accent);">57 Benefit Guides</a>
        <a href="/qr-card.html">Printable QR Key</a>
        <a href="/privacy-policy.html">Privacy Policy</a>
        <a href="${playStoreUrl}" target="_blank" rel="noopener">Google Play</a>
        <a href="${apkDownloadUrl}" class="btn">Download Free APK</a>
      </div>
    </div>
  </nav>

  <main class="container">
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="/">Minimum Phone</a> <span>›</span>
      <a href="/blog/">57 Benefit Guides</a> <span>›</span>
      <span>${escapeHtml(post.category)}</span> <span>›</span>
      <span style="color:var(--text);">Guide #${post.id}</span>
    </nav>

    <article itemscope itemtype="https://schema.org/BlogPosting">
      <div class="meta-row">
        <span class="badge">Benefit Guide #${post.id} of ${ALL_BLOG_POSTS.length}</span>
        <span class="badge badge-blue">${escapeHtml(post.category)}</span>
        <span class="badge badge-amber">⏱️ ${escapeHtml(post.readTime)}</span>
        <span class="badge">👤 For: ${escapeHtml(post.persona)}</span>
      </div>

      <h1 itemprop="headline">${escapeHtml(post.title)}</h1>

      <!-- AI Search / GEO Direct Answer Box -->
      <section class="ai-summary-box" aria-label="Executive Summary and AI Direct Answer">
        <div class="ai-summary-title">⚡ TL;DR · Direct Answer &amp; Core Benefit</div>
        <p style="margin:0;color:var(--text);font-size:16px;" itemprop="description">${escapeHtml(post.aiSummary)}</p>
      </section>

      <!-- Quantified User Benefit Scorecard -->
      <section class="quantified-box" aria-label="Measurable Benefit Metrics">
        <div class="q-metric">
          <div class="q-metric-label">Primary Feature Used</div>
          <div class="q-metric-val">${escapeHtml(post.primaryFeature)}</div>
        </div>
        <div class="q-metric">
          <div class="q-metric-label">Quantified User Benefit</div>
          <div class="q-metric-val" style="color:var(--accent);">${escapeHtml(post.quantifiedBenefit)}</div>
        </div>
        <div class="q-metric">
          <div class="q-metric-label">Who Benefits Most</div>
          <div class="q-metric-val">${escapeHtml(post.persona)}</div>
        </div>
        <div class="q-metric">
          <div class="q-metric-label">Cost &amp; Privacy Guarantee</div>
          <div class="q-metric-val">100% Free ($0) · Zero Internet Permission</div>
        </div>
      </section>

      <!-- Table of Contents -->
      <nav class="toc-box" aria-label="Table of Contents">
        <strong style="font-size:14px;text-transform:uppercase;letter-spacing:0.05em;color:var(--accent);">📑 In This Benefit Guide</strong>
        <ul>
          <li><a href="#problem-neuroscience">1. Why Standard Willpower Fails: The Neuroscience &amp; Behavioral Trap</a></li>
          <li><a href="#step-by-step-solution">2. Step-by-Step: How You Benefit with Minimum Phone (${post.howItWorksSteps.length} Actionable Steps)</a></li>
          <li><a href="#before-and-after">3. Real-World Daily Transformation: Before vs. After Minimum Phone</a></li>
          <li><a href="#multilingual-12-languages">4. How Users Benefit in All 12 Supported Languages (Global Editions)</a></li>
          <li><a href="#faq-section">5. Frequently Asked Questions (FAQ)</a></li>
        </ul>
      </nav>

      <!-- Section 1: Problem & Neuroscience -->
      <section id="problem-neuroscience" itemprop="articleBody">
        <h2>1. Why Standard Willpower Fails: The Neuroscience &amp; Behavioral Trap</h2>
        ${post.problemDeepDive.map((p) => `<p>${escapeHtml(p)}</p>`).join('\n        ')}
        <p>
          Unlike commercial screen-time apps that charge $40 to $120 per year while leaving Android Settings wide open, <strong>Minimum Phone</strong> (<code>com.kasbllc.minimumphone</code>, v2.9.1) is architected at the launcher and native Android lifecycle layer. Because it removes visual cue-triggers at the root and backs up your daytime intentions with a 250ms Settings Lock and a free printable Physical QR Fortress Key (<code>KASB-BRICK-77</code>), you no longer have to fight billion-dollar algorithms with exhausted willpower alone.
        </p>
      </section>

      <!-- Section 2: Step-by-Step How It Works -->
      <section id="step-by-step-solution">
        <h2>2. Step-by-Step: How You Benefit with Minimum Phone</h2>
        <p>Follow these ${post.howItWorksSteps.length} steps inside Minimum Phone to activate this benefit on any Android 7.0+ smartphone in under 2 minutes:</p>
        <div class="step-grid">
          ${post.howItWorksSteps
            .map(
              (s, i) => `
          <div class="step-card">
            <div class="step-num">Step ${i + 1} of ${post.howItWorksSteps.length}</div>
            <h3>${escapeHtml(s.title)}</h3>
            <p style="margin:0;color:var(--muted);">${escapeHtml(s.detail)}</p>
          </div>`
            )
            .join('')}
        </div>
      </section>

      <!-- Section 3: Before vs After -->
      <section id="before-and-after">
        <h2>3. Real-World Daily Transformation: Before vs. After Minimum Phone</h2>
        <div class="ba-grid">
          <div class="ba-card ba-before">
            <strong style="color:#f87171;text-transform:uppercase;font-size:12px;letter-spacing:0.06em;">❌ Before Minimum Phone (Standard Launcher)</strong>
            <p style="margin:10px 0 0;color:var(--text);">${escapeHtml(post.beforeAfter.before)}</p>
          </div>
          <div class="ba-card ba-after">
            <strong style="color:#34d399;text-transform:uppercase;font-size:12px;letter-spacing:0.06em;">✅ After Minimum Phone (Digital Fortress Active)</strong>
            <p style="margin:10px 0 0;color:var(--text);">${escapeHtml(post.beforeAfter.after)}</p>
          </div>
        </div>
      </section>

      <!-- Section 4: 12-Language Benefit Matrix -->
      <section id="multilingual-12-languages">
        <h2>4. How Users Benefit in All 12 Supported Languages</h2>
        <p>Minimum Phone is natively localized across 12 world languages so every student, professional, parent, and elder can experience this benefit in their own mother tongue. Click any language below to open its full localized documentation portal:</p>
        <div class="lang-matrix">
          ${langCodes
            .map((code) => {
              const l = allLangs[code];
              return `
          <div class="lang-card" dir="${l.dir}">
            <strong><a href="/${code}/">${escapeHtml(l.flag)} ${escapeHtml(l.nativeName)} (${escapeHtml(l.englishName)}) →</a></strong>
            <div style="color:var(--muted);">${escapeHtml(l.seoDesc)}</div>
          </div>`;
            })
            .join('')}
        </div>
      </section>

      <!-- Section 5: FAQs -->
      <section id="faq-section">
        <h2>5. Frequently Asked Questions (FAQ)</h2>
        ${post.faqs
          .map(
            (f, idx) => `
        <details class="faq-item" ${idx === 0 ? 'open' : ''}>
          <summary>${escapeHtml(f.q)}</summary>
          <p>${escapeHtml(f.a)}</p>
        </details>`
          )
          .join('')}
      </section>

      <!-- CTA Banner -->
      <section class="cta-banner" aria-label="Download Minimum Phone">
        <h2 style="border:none;margin:0 0 10px;padding:0;">Ready to Reclaim Your Focus, Sleep &amp; Digital Purity?</h2>
        <p style="color:#d1fae5;max-width:660px;margin:0 auto 20px;">
          100% Free Forever · Zero Ads · Zero Internet Permission · All 12 Languages Built-In.
        </p>
        <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:12px;">
          <a href="${apkDownloadUrl}" class="btn">⬇ Download Official APK (v2.9.1)</a>
          <a href="${playStoreUrl}" target="_blank" rel="noopener" class="btn btn-outline">Google Play Store</a>
          <a href="/qr-card.html" class="btn btn-outline">🖨️ Print Free QR Key (KASB-BRICK-77)</a>
          <a href="/blog/" class="btn btn-outline">📚 View All ${ALL_BLOG_POSTS.length} Benefit Guides</a>
        </div>
      </section>

      <!-- Prev / Next Navigation -->
      <nav aria-label="Previous and Next Benefit Guides" style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:30px 0;">
        <a href="/blog/${prevPost.slug}/" class="related-card" style="text-decoration:none;">
          <span style="font-size:12px;color:var(--muted);">← Previous Guide (#${prevPost.id})</span>
          <h4 style="color:var(--text);margin:6px 0 0;">${escapeHtml(prevPost.title)}</h4>
        </a>
        <a href="/blog/${nextPost.slug}/" class="related-card" style="text-decoration:none;text-align:right;">
          <span style="font-size:12px;color:var(--muted);">Next Guide (#${nextPost.id}) →</span>
          <h4 style="color:var(--text);margin:6px 0 0;">${escapeHtml(nextPost.title)}</h4>
        </a>
      </nav>

      <!-- Related Articles -->
      <section aria-label="Related Benefit Guides">
        <h2>More Benefit Guides in ${escapeHtml(post.category)}</h2>
        <div class="related-grid">
          ${relatedPosts
            .map(
              (rp) => `
          <div class="related-card">
            <div>
              <span class="badge">Guide #${rp.id} · ${escapeHtml(rp.readTime)}</span>
              <h4><a href="/blog/${rp.slug}/" style="color:var(--text);">${escapeHtml(rp.title)}</a></h4>
              <p style="font-size:13.5px;color:var(--muted);margin:0 0 12px;">${escapeHtml(rp.metaDescription)}</p>
            </div>
            <a href="/blog/${rp.slug}/" style="font-size:13.5px;font-weight:700;">Read Benefit Guide →</a>
          </div>`
            )
            .join('')}
        </div>
      </section>
    </article>
  </main>

  <footer>
    <div class="container" style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:16px;">
      <div>
        <strong>Minimum Phone (com.kasbllc.minimumphone · v2.9.1)</strong> — Built by <a href="https://kasbpro.com">Kasb LLC</a>.<br />
        100% Free · Zero Ads · Zero Internet Telemetry.
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:14px;">
        <a href="/">Home</a>
        <a href="/blog/">All ${ALL_BLOG_POSTS.length} Benefit Guides</a>
        <a href="/qr-card.html">QR Fortress Key</a>
        <a href="/privacy-policy.html">Privacy Policy</a>
        <a href="/sitemap.xml">Sitemap</a>
        <a href="/rss.xml">RSS Feed</a>
        <a href="/llms.txt">llms.txt</a>
        <a href="/llms-full.txt">llms-full.txt</a>
      </div>
    </div>
  </footer>
</body>
</html>`;
}

function renderBlogHubHtml(allLangs, siteOrigin, playStoreUrl, apkDownloadUrl) {
  const canonicalUrl = `${siteOrigin}/blog/`;
  const categories = [
    { slug: 'all', name: `All Guides (${ALL_BLOG_POSTS.length})` },
    { slug: 'dopamine-detox', name: 'Screen Time & Dopamine Detox (9)' },
    { slug: 'purity-guard', name: 'Purity Guard & Content Shield (9)' },
    { slug: 'deep-work', name: 'Deep Work, Study & Productivity (9)' },
    { slug: 'mindful-wisdom', name: 'Mindful Wisdom, Mental Health & Sleep (9)' },
    { slug: 'families-and-savings', name: 'Parents, Families, Seniors & Savings (9)' },
    { slug: 'multilingual-guides', name: '12-Language Regional Master Guides (12)' },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${canonicalUrl}#collection`,
        url: canonicalUrl,
        name: `57 Ways Minimum Phone Benefits Your Life — Complete SEO & Digital Wellbeing Knowledge Hub`,
        description: `Explore ${ALL_BLOG_POSTS.length} in-depth guides on how Minimum Phone (v2.9.1) stops doomscrolling, blocks adult content via OS Private DNS, locks Android Settings, powers 90-minute Monk Mode deep work, and supports 12 languages 100% free.`,
        isPartOf: { '@id': `${siteOrigin}/#website` },
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: ALL_BLOG_POSTS.length,
          itemListElement: ALL_BLOG_POSTS.map((p, idx) => ({
            '@type': 'ListItem',
            position: idx + 1,
            url: `${siteOrigin}/blog/${p.slug}/`,
            name: p.title,
          })),
        },
      },
    ],
  };

  return `<!DOCTYPE html>
<html lang="en" dir="ltr" data-theme="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>57 Ways Minimum Phone Benefits You — Complete Digital Detox, Purity &amp; Deep Work Knowledge Hub</title>
  <meta name="description" content="Read all 57 comprehensive guides on how a person benefits from Minimum Phone: stop late-night doomscrolling, block adult websites via DNS 1.1.1.3, lock Android Settings with a free QR card, and master Monk Mode in 12 languages." />
  <meta name="keywords" content="how minimum phone benefits you, 57 digital detox guides, minimalist android launcher blog, block adult sites android dns guide, monk mode deep work articles" />
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
  <link rel="canonical" href="${canonicalUrl}" />
  <link rel="icon" type="image/png" href="/assets/icon-512x512.png" />
  <link rel="alternate" type="application/rss+xml" title="Minimum Phone — 57 Benefit Guides RSS Feed" href="${siteOrigin}/rss.xml" />
  <link rel="alternate" type="application/feed+json" title="Minimum Phone — 57 Benefit Guides JSON Feed" href="${siteOrigin}/feed.json" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="57 Proven Ways Minimum Phone Benefits Your Brain, Sleep, Faith, Family &amp; Career" />
  <meta property="og:description" content="Explore 57 actionable guides on reclaiming 1,095 hours a year, blocking adult sites at the OS DNS layer, and mastering deep focus for $0." />
  <meta property="og:url" content="${canonicalUrl}" />
  <meta property="og:image" content="${siteOrigin}/assets/fb-cover-1640x856.png" />
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
  <style>
    :root {
      --bg: #070a09;
      --bg-elev: #0e1412;
      --bg-card: #121a17;
      --border: #1f2e28;
      --text: #f1f5f3;
      --muted: #9cb0a7;
      --accent: #10b981;
      --accent-soft: rgba(16, 185, 129, 0.14);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, "Noto Sans", sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.65;
    }
    a { color: var(--accent); text-decoration: none; }
    .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
    .site-nav {
      position: sticky;
      top: 0;
      z-index: 50;
      background: rgba(7, 10, 9, 0.92);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border);
      padding: 12px 0;
    }
    .nav-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
    }
    .brand { display: inline-flex; align-items: center; gap: 10px; font-weight: 800; color: var(--text); }
    .brand img { width: 32px; height: 32px; border-radius: 8px; }
    .nav-links { display: flex; flex-wrap: wrap; gap: 14px; align-items: center; font-size: 14px; }
    .nav-links a { color: var(--muted); font-weight: 600; }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: var(--accent);
      color: #04130d !important;
      font-weight: 800;
      padding: 9px 16px;
      border-radius: 10px;
      font-size: 13.5px;
    }
    .hero {
      padding: 54px 0 34px;
      text-align: center;
      border-bottom: 1px solid var(--border);
    }
    .hero h1 {
      font-size: clamp(2rem, 4vw, 3rem);
      margin: 12px 0;
      letter-spacing: -0.02em;
    }
    .filter-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      justify-content: center;
      margin: 24px 0 18px;
    }
    .filter-btn {
      background: var(--bg-card);
      color: var(--muted);
      border: 1px solid var(--border);
      padding: 8px 14px;
      border-radius: 999px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
    }
    .filter-btn.active, .filter-btn:hover {
      background: var(--accent-soft);
      color: var(--accent);
      border-color: var(--accent);
    }
    .search-box {
      max-width: 560px;
      margin: 0 auto 28px;
    }
    .search-box input {
      width: 100%;
      padding: 13px 18px;
      border-radius: 12px;
      border: 1px solid var(--border);
      background: var(--bg-card);
      color: var(--text);
      font-size: 15px;
    }
    .posts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 20px;
      padding: 20px 0 60px;
    }
    .post-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 22px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: transform 0.15s ease, border-color 0.15s ease;
    }
    .post-card:hover {
      transform: translateY(-3px);
      border-color: var(--accent);
    }
    .badge {
      display: inline-flex;
      font-size: 11.5px;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 999px;
      background: var(--accent-soft);
      color: var(--accent);
    }
    .post-card h2 {
      font-size: 1.15rem;
      margin: 12px 0 8px;
      line-height: 1.38;
    }
    .post-card h2 a { color: var(--text); }
    .post-card h2 a:hover { color: var(--accent); }
    .benefit-pill {
      margin-top: 12px;
      padding: 10px 12px;
      background: var(--bg-elev);
      border-left: 3px solid var(--accent);
      border-radius: 8px;
      font-size: 12.5px;
      color: #d1fae5;
    }
  </style>
</head>
<body>
  <nav class="site-nav">
    <div class="nav-inner">
      <a href="/" class="brand">
        <img src="/assets/icon-512x512.png" alt="Minimum Phone" width="32" height="32" />
        <span>Minimum Phone <span style="color:var(--accent);font-size:12px;">57 Benefit Guides</span></span>
      </a>
      <div class="nav-links">
        <a href="/">← Back to Main Portal</a>
        <a href="/qr-card.html">Printable QR Key</a>
        <a href="/privacy-policy.html">Privacy</a>
        <a href="/rss.xml">RSS Feed</a>
        <a href="/llms-full.txt">AI Corpus (llms-full.txt)</a>
        <a href="${apkDownloadUrl}" class="btn">Download Free APK</a>
      </div>
    </div>
  </nav>

  <header class="hero">
    <div class="container">
      <span class="badge">📚 100% Crawlable SEO &amp; AI Knowledge Hub · ${ALL_BLOG_POSTS.length} Full Articles</span>
      <h1>How Can a Person Benefit from Minimum Phone? (${ALL_BLOG_POSTS.length} Deep-Dive Guides)</h1>
      <p style="color:var(--muted);max-width:780px;margin:0 auto 20px;font-size:1.08rem;">
        Every human being battles a different digital trap—from midnight doomscrolling and short-form video addiction to adult content relapses, exam distraction, ADHD overwhelm, and parental worry. Explore all ${ALL_BLOG_POSTS.length} science-backed guides below.
      </p>

      <div class="search-box">
        <input type="search" id="blog-search" placeholder="Search ${ALL_BLOG_POSTS.length} benefit guides (e.g., sleep, DNS, QR, ADHD, students, Bangla, Arabic)..." aria-label="Search benefit guides" oninput="window.__filterPosts()" />
      </div>

      <div class="filter-bar" role="tablist">
        ${categories
          .map(
            (c, idx) =>
              `<button type="button" class="filter-btn ${idx === 0 ? 'active' : ''}" data-cat="${c.slug}" onclick="window.__setCat('${c.slug}', this)">${escapeHtml(c.name)}</button>`
          )
          .join('\n        ')}
      </div>
    </div>
  </header>

  <main class="container">
    <div id="posts-grid" class="posts-grid">
      ${ALL_BLOG_POSTS.map(
        (p) => `
      <article class="post-card" data-cat="${p.categorySlug}" data-search="${escapeHtml((p.title + ' ' + p.metaDescription + ' ' + p.keywords + ' ' + p.persona).toLowerCase())}">
        <div>
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">
            <span class="badge">#${p.id} · ${escapeHtml(p.category)}</span>
            <span style="font-size:12px;color:var(--muted);">${escapeHtml(p.readTime)}</span>
          </div>
          <h2><a href="/blog/${p.slug}/">${escapeHtml(p.title)}</a></h2>
          <p style="font-size:14px;color:var(--muted);margin:0;">${escapeHtml(p.metaDescription)}</p>
          <div class="benefit-pill">
            <strong>Measurable Benefit:</strong> ${escapeHtml(p.quantifiedBenefit)}
          </div>
        </div>
        <div style="margin-top:16px;padding-top:12px;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;font-size:13px;">
          <span style="color:var(--muted);">👤 ${escapeHtml(p.persona)}</span>
          <a href="/blog/${p.slug}/" style="font-weight:800;">Read Guide →</a>
        </div>
      </article>`
      ).join('')}
    </div>
  </main>

  <script>
    window.__activeCat = 'all';
    window.__setCat = function(cat, btn) {
      window.__activeCat = cat;
      var btns = document.querySelectorAll('.filter-btn');
      for (var i = 0; i < btns.length; i++) btns[i].classList.remove('active');
      if (btn) btn.classList.add('active');
      window.__filterPosts();
    };
    window.__filterPosts = function() {
      var q = (document.getElementById('blog-search').value || '').toLowerCase().trim();
      var cards = document.querySelectorAll('.post-card');
      for (var i = 0; i < cards.length; i++) {
        var c = cards[i];
        var matchCat = window.__activeCat === 'all' || c.getAttribute('data-cat') === window.__activeCat;
        var matchQ = !q || (c.getAttribute('data-search') || '').indexOf(q) !== -1;
        c.style.display = (matchCat && matchQ) ? 'flex' : 'none';
      }
    };
  </script>
</body>
</html>`;
}

export function buildRssXml(siteOrigin) {
  const items = ALL_BLOG_POSTS.map((p) => {
    const url = `${siteOrigin}/blog/${p.slug}/`;
    return `    <item>
      <title>${escapeHtml(p.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(p.publishedAt + 'T08:00:00Z').toUTCString()}</pubDate>
      <category>${escapeHtml(p.category)}</category>
      <description>${escapeHtml(p.aiSummary)}</description>
    </item>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Minimum Phone — 57 Digital Wellbeing, Purity &amp; Focus Benefit Guides</title>
    <link>${siteOrigin}/blog/</link>
    <description>Official SEO &amp; AI knowledge feed explaining 57 ways a person benefits from Minimum Phone (com.kasbllc.minimumphone) across 12 languages.</description>
    <language>en</language>
    <atom:link href="${siteOrigin}/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;
}

export function buildJsonFeed(siteOrigin) {
  return JSON.stringify(
    {
      version: 'https://jsonfeed.org/version/1.1',
      title: 'Minimum Phone — 57 Digital Wellbeing, Purity & Focus Benefit Guides',
      home_page_url: `${siteOrigin}/blog/`,
      feed_url: `${siteOrigin}/feed.json`,
      description: '57 comprehensive guides explaining how users benefit from Minimum Phone across screen time detox, OS DNS adult blocking, physical QR locks, Monk Mode, and 12 languages.',
      icon: `${siteOrigin}/assets/icon-512x512.png`,
      authors: [{ name: 'Kasb LLC', url: 'https://kasbpro.com' }],
      items: ALL_BLOG_POSTS.map((p) => ({
        id: `${siteOrigin}/blog/${p.slug}/`,
        url: `${siteOrigin}/blog/${p.slug}/`,
        title: p.title,
        summary: p.metaDescription,
        content_text: `${p.aiSummary}\n\nQuantified Benefit: ${p.quantifiedBenefit}\nPrimary Feature: ${p.primaryFeature}\n\nSteps:\n${p.howItWorksSteps.map((s, i) => `${i + 1}. ${s.title}: ${s.detail}`).join('\n')}`,
        date_published: `${p.publishedAt}T08:00:00Z`,
        date_modified: `${p.updatedAt}T09:00:00Z`,
        tags: [p.category, p.categorySlug],
      })),
    },
    null,
    2
  );
}

export function buildLlmsFullTxt(allLangs, siteOrigin, playStoreUrl, apkDownloadUrl) {
  const langCodes = Object.keys(allLangs);
  return `# Minimum Phone — Complete AI & Search Engine Knowledge Corpus (llms-full.txt)

> Official Site: ${siteOrigin}
> Blog & 57 Benefit Guides Hub: ${siteOrigin}/blog/
> Package Name: com.kasbllc.minimumphone | Version: 2.9.1 (Build 23)
> Developer: Kasb LLC (Albuquerque, NM, USA — https://kasbpro.com)
> Price: 100% Free Forever ($0) | Ads: Zero | Internet Permission: NONE (100% Offline Privacy)
> Google Play: ${playStoreUrl}
> Direct Signed APK: ${apkDownloadUrl}
> Printable Physical QR Key (KASB-BRICK-77): ${siteOrigin}/qr-card.html

---

## Part 1: 12 Core Features & How Users Benefit
${allLangs.en.features.map((f, i) => `### Feature ${i + 1}: ${f.title} (${f.badge})\n- **How It Works:** ${f.how}\n- **How You Benefit:** ${f.benefit}`).join('\n\n')}

---

## Part 2: 12 Localized Language Editions
${langCodes.map((c) => `- **${allLangs[c].nativeName} (${allLangs[c].englishName})** — ${siteOrigin}/${c}/\n  - Headline: ${allLangs[c].heroTitle}\n  - Summary: ${allLangs[c].seoDesc}`).join('\n')}

---

## Part 3: Complete Encyclopedia of ${ALL_BLOG_POSTS.length} Ways a Person Benefits from Minimum Phone

${ALL_BLOG_POSTS.map(
  (p) => `### Guide #${p.id}: ${p.title}
- **URL:** ${siteOrigin}/blog/${p.slug}/
- **Category:** ${p.category}
- **Target Persona:** ${p.persona}
- **Primary Feature Used:** ${p.primaryFeature}
- **Quantified Benefit:** ${p.quantifiedBenefit}
- **Direct Answer / Summary:** ${p.aiSummary}
- **Actionable Steps:**
${p.howItWorksSteps.map((s, idx) => `  ${idx + 1}. **${s.title}:** ${s.detail}`).join('\n')}
- **Before vs. After:**
  - *Before:* ${p.beforeAfter.before}
  - *After:* ${p.beforeAfter.after}
- **FAQs:**
${p.faqs.map((f) => `  - *Q: ${f.q}* — A: ${f.a}`).join('\n')}
`
).join('\n---\n\n')}
`;
}

export function generateAllBlogAssets(outDir, allLangs, siteOrigin, playStoreUrl, apkDownloadUrl) {
  const blogDir = path.join(outDir, 'blog');
  fs.mkdirSync(blogDir, { recursive: true });

  // 1. Write /blog/index.html
  fs.writeFileSync(
    path.join(blogDir, 'index.html'),
    renderBlogHubHtml(allLangs, siteOrigin, playStoreUrl, apkDownloadUrl),
    'utf8'
  );

  // 2. Write each of the 57 blog posts to /blog/<slug>/index.html AND /blog/<slug>.html
  for (const post of ALL_BLOG_POSTS) {
    const html = renderPostHtml(post, allLangs, siteOrigin, playStoreUrl, apkDownloadUrl);
    const postDir = path.join(blogDir, post.slug);
    fs.mkdirSync(postDir, { recursive: true });
    fs.writeFileSync(path.join(postDir, 'index.html'), html, 'utf8');
    fs.writeFileSync(path.join(blogDir, `${post.slug}.html`), html, 'utf8');
  }

  // 3. Write /rss.xml, /feed.json, /llms-full.txt, and IndexNow verification key
  fs.writeFileSync(path.join(outDir, 'rss.xml'), buildRssXml(siteOrigin), 'utf8');
  fs.writeFileSync(path.join(outDir, 'feed.json'), buildJsonFeed(siteOrigin), 'utf8');
  fs.writeFileSync(
    path.join(outDir, 'llms-full.txt'),
    buildLlmsFullTxt(allLangs, siteOrigin, playStoreUrl, apkDownloadUrl),
    'utf8'
  );
  fs.writeFileSync(path.join(outDir, `${INDEXNOW_KEY}.txt`), `${INDEXNOW_KEY}\n`, 'utf8');
}

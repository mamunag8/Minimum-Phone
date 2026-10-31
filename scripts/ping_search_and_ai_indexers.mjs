import { ALL_BLOG_POSTS, INDEXNOW_KEY } from './seo_blog_renderer.mjs';

const SITE_ORIGIN = 'https://minimumphone.kasbpro.com';
const LANG_CODES = ['en', 'bn', 'ar', 'ur', 'id', 'tr', 'hi', 'ms', 'es', 'fr', 'de', 'ru'];

const allUrls = [
  `${SITE_ORIGIN}/`,
  ...LANG_CODES.map((c) => `${SITE_ORIGIN}/${c}/`),
  `${SITE_ORIGIN}/blog/`,
  ...ALL_BLOG_POSTS.map((p) => `${SITE_ORIGIN}/blog/${p.slug}/`),
  `${SITE_ORIGIN}/qr-card.html`,
  `${SITE_ORIGIN}/privacy-policy.html`,
  `${SITE_ORIGIN}/sitemap.xml`,
  `${SITE_ORIGIN}/rss.xml`,
  `${SITE_ORIGIN}/feed.json`,
  `${SITE_ORIGIN}/llms.txt`,
  `${SITE_ORIGIN}/llms-full.txt`,
];

async function verifyAndSubmitIndexNow() {
  console.log(`Verifying live endpoints across ${allUrls.length} URLs...`);
  const sampleUrls = [
    `${SITE_ORIGIN}/`,
    `${SITE_ORIGIN}/blog/`,
    `${SITE_ORIGIN}/blog/${ALL_BLOG_POSTS[0].slug}/`,
    `${SITE_ORIGIN}/blog/${ALL_BLOG_POSTS[25].slug}/`,
    `${SITE_ORIGIN}/blog/${ALL_BLOG_POSTS[45].slug}/`,
    `${SITE_ORIGIN}/blog/${ALL_BLOG_POSTS[56].slug}/`,
    `${SITE_ORIGIN}/sitemap.xml`,
    `${SITE_ORIGIN}/rss.xml`,
    `${SITE_ORIGIN}/feed.json`,
    `${SITE_ORIGIN}/llms.txt`,
    `${SITE_ORIGIN}/llms-full.txt`,
    `${SITE_ORIGIN}/${INDEXNOW_KEY}.txt`,
  ];

  for (const u of sampleUrls) {
    const res = await fetch(u, { method: 'HEAD' });
    console.log(`  [${res.status}] ${u}`);
  }

  const payload = {
    host: 'minimumphone.kasbpro.com',
    key: INDEXNOW_KEY,
    keyLocation: `${SITE_ORIGIN}/${INDEXNOW_KEY}.txt`,
    urlList: allUrls,
  };

  const endpoints = [
    'https://api.indexnow.org/indexnow',
    'https://www.bing.com/indexnow',
    'https://yandex.com/indexnow',
  ];

  console.log(`\nSubmitting ${allUrls.length} URLs to IndexNow (Bing / ChatGPT Search / DuckDuckGo / Yandex)...`);
  for (const ep of endpoints) {
    try {
      const r = await fetch(ep, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(payload),
      });
      console.log(`  -> ${ep}: HTTP ${r.status} ${r.statusText}`);
    } catch (err) {
      console.log(`  -> ${ep}: ${err.message}`);
    }
  }
}

verifyAndSubmitIndexNow();

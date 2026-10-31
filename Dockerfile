# ── Stage 1: build the 12-language Minimum Phone SEO site ──────────────
FROM node:20-alpine AS build
WORKDIR /src
COPY scripts ./scripts
COPY docs ./docs
COPY play-store-submission/graphics ./play-store-submission/graphics
COPY flutter_app/lib/i18n.dart ./flutter_app/lib/i18n.dart
COPY flutter_app/lib/wisdom_bank.dart ./flutter_app/lib/wisdom_bank.dart
RUN node scripts/build_seo_site.mjs && test -f seo-dist/index.html && test -f seo-dist/bn/index.html && test -f seo-dist/blog/index.html && test -f seo-dist/llms-full.txt

# ── Stage 2: serve via Nginx ───────────────────────────────────────────
FROM nginx:1.27-alpine
COPY --from=build /src/seo-dist /usr/share/nginx/html
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO- http://127.0.0.1/health || exit 1

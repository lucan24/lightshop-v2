# Lightshop

Single-page live shopping demo: `lightshop.html` + `lightshop.js` + CSS. Optional Stripe sketch in `server/`.

## Publish checklist (in repo)

- **`publish-config.js`** — Set `siteUrl` (canonical + Open Graph), `indexPath`, `ogImagePath`, `supportEmail`, `showDemoBanner: false` when fully live, and optional `plausibleDomain`. (Config object: `LIGHTSHOP_PUBLISH`.)
- **`favicon.svg`**, **`og-image.svg`** — Brand assets; for best social previews, host a **1200×630 PNG** and point `ogImagePath` at it.
- **`robots.txt`** — Uncomment and set `Sitemap:` after you deploy `sitemap.xml` on a real domain.
- **`sitemap.xml`** — Replace placeholder URLs with your production origin before enabling the sitemap line in `robots.txt`.
- **`PRODUCTION_CHECKLIST.md`** — Launch readiness checklist covering security, payments, reliability, and operations.

## What you must do separately (hosting & accounts)

- **Hosting + HTTPS** — Put the static files behind TLS (Netlify, Cloudflare Pages, S3+CloudFront, nginx, etc.).
- **DNS** — Point your domain at that host.
- **Replace placeholders** — `siteUrl`, sitemap URLs, and any fictional `mailto:` addresses (`support@`, `privacy@`, `legal@`) with real contacts.
- **Stripe** — Live **secret** key, **webhook** signing secret, and a public URL for `POST /webhook`; implement order persistence where the server `TODO` is marked.
- **CORS / origins** — Tighten `Access-Control-Allow-Origin` in `server/server.js` from `*` to your real static origin when both are deployed.
- **Optional** — Plausible/GA property; CSP is strict with heavy inline handlers unless you refactor.

## Stripe sketch

```bash
cd server && cp .env.example .env
# Edit .env — STRIPE_* and optionally PUBLIC_URL
npm install && npm start
```

`PUBLIC_URL` is used as the default Checkout success/cancel base when the browser does not send `baseUrl`.

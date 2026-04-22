# Lightshop Production Checklist

Use this checklist to move from demo to real launch.

## 1) Security and Accounts

- [ ] Replace demo auth (`localStorage`) with real backend auth.
- [ ] Store hashed passwords only (never plain text).
- [ ] Add rate-limiting for auth and checkout endpoints.
- [ ] Add CSRF protection for authenticated actions.

## 2) Payments and Orders

- [ ] Replace demo checkout with Stripe Checkout/Elements in production mode.
- [ ] Verify Stripe webhook signature and persist orders server-side.
- [ ] Add idempotency keys for payment/order writes.
- [ ] Add customer order confirmation email.

## 3) Data and APIs

- [ ] Move product/stream data out of inline JS to API/database.
- [ ] Validate and sanitize all user/content input on server.
- [ ] Add API error logging and alerting.
- [ ] Lock CORS to your real frontend origin in `server/server.js`.

## 4) Frontend Reliability

- [ ] Add end-to-end smoke tests for: auth, follow, checkout, history.
- [ ] Add fallback UI for API/network failures.
- [ ] Run accessibility pass (keyboard nav, contrast, labels, focus order).
- [ ] Test all pages on iOS Safari and Android Chrome.

## 5) SEO and Sharing

- [x] Set canonical origin/path in `publish-config.js`.
- [x] Set sitemap URL in `robots.txt`.
- [x] Replace placeholder URLs in `sitemap.xml`.
- [ ] Replace `og-image.svg` with a 1200x630 PNG and update `ogImagePath`.
- [ ] Add Google Search Console / Bing Webmaster verification.

## 6) Operations

- [ ] Add uptime monitoring for API and webhook endpoint.
- [ ] Add error monitoring (Sentry or equivalent).
- [ ] Set backup/restore for order data.
- [ ] Document incident rollback steps.


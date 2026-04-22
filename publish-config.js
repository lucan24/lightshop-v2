/**
 * Lightshop publish settings — edit before production deploy.
 * Loaded synchronously from lightshop.html before lightshop.js
 */
window.LIGHTSHOP_PUBLISH = {
  /** Full site origin, no trailing slash, e.g. "https://www.yourdomain.com" */
  siteUrl: "https://lucan24.github.io",
  /** Path to this app on your domain (leading slash) */
  indexPath: "/lightshop/lightshop.html",
  /** Social / link preview image path (served from site root) */
  ogImagePath: "/lightshop/og-image.svg",
  /** Fixed demo strip at bottom; set false when the product is fully live */
  showDemoBanner: true,
  /** Shown in the top bar Support link (mailto) */
  supportEmail: "support@lightshop.com",
  /** Plausible analytics: your site id, e.g. "lightshop.com" — leave "" to disable */
  plausibleDomain: "",
  /** Optional override for Plausible script URL */
  plausibleSrc: "https://plausible.io/js/script.js"
};

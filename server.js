/**
 * Lightshop — Stripe Checkout sketch (Node + Express)
 *
 * Flow:
 * 1) Browser POSTs /create-checkout-session with amount + optional metadata (product id, host id).
 * 2) Server returns { url } → front-end does location.href = url.
 * 3) User pays on Stripe-hosted Checkout.
 * 4) Stripe POSTs checkout.session.completed to /webhook → you save order + shipping (never store raw cards).
 *
 * Run:
 *   cd server && cp .env.example .env   # fill in keys
 *   npm install && npm start
 *
 * Test webhook locally:
 *   stripe listen --forward-to localhost:4242/webhook
 *
 * Front-end (separate static server, e.g. python -m http.server 8765):
 *   fetch('http://localhost:4242/create-checkout-session', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ amountCents: 8299, productName: 'Air Trainer Pro', successPath: '/lightshop.html' }) })
 *     .then(r => r.json()).then(({ url }) => { if (url) window.location.href = url; });
 */
require("dotenv").config();
const express = require("express");
const Stripe = require("stripe");

if (!process.env.STRIPE_SECRET_KEY) {
  console.error("Missing STRIPE_SECRET_KEY in .env (copy from .env.example)");
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const app = express();

app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// Webhook must see raw body for signature verification (register BEFORE express.json()).
app.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  function (req, res) {
    var secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) {
      console.warn("STRIPE_WEBHOOK_SECRET not set — webhook verification skipped (dev only)");
      return res.status(500).send("Configure STRIPE_WEBHOOK_SECRET");
    }
    var sig = req.headers["stripe-signature"];
    var event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, secret);
    } catch (err) {
      console.error("Webhook signature:", err.message);
      return res.status(400).send("Bad signature");
    }

    if (event.type === "checkout.session.completed") {
      var session = event.data.object;
      console.log("Paid session:", session.id, "amount:", session.amount_total);
      // session.customer_details has email + shipping address when collect_shipping_address is enabled
      // TODO: insert into your DB: order rows, seller notification, etc.
    }

    res.json({ received: true });
  }
);

app.use(express.json());

app.post("/create-checkout-session", async function (req, res) {
  try {
    var body = req.body || {};
    var amountCents = Math.max(50, parseInt(body.amountCents, 10) || 5000);
    var productName = String(body.productName || "Live stream purchase").slice(0, 120);
    var host = String(body.host || "").slice(0, 80);

    var base =
      body.baseUrl ||
      (process.env.PUBLIC_URL && String(process.env.PUBLIC_URL).replace(/\/$/, "")) ||
      (req.headers.origin && String(req.headers.origin)) ||
      "http://localhost:8765";
    var successPath = String(body.successPath || "/lightshop.html");
    var cancelPath = String(body.cancelPath || "/lightshop.html");

    var session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: base.replace(/\/$/, "") + successPath + "?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: base.replace(/\/$/, "") + cancelPath,
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: amountCents,
            product_data: {
              name: productName,
              description: host ? "Host: " + host : undefined
            }
          },
          quantity: 1
        }
      ],
      // Collect shipping in Stripe’s UI (recommended vs rolling your own address form for card data)
      shipping_address_collection: { allowed_countries: ["US", "CA", "GB"] },
      phone_number_collection: { enabled: true },
      metadata: {
        host: host,
        source: String(body.source || "lightshop-demo")
      }
    });

    res.json({ url: session.url, id: session.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Stripe error" });
  }
});

app.get("/health", function (_req, res) {
  res.json({ ok: true });
});

var PORT = parseInt(process.env.PORT || "4242", 10);
app.listen(PORT, function () {
  console.log("Stripe sketch listening on http://localhost:" + PORT);
  console.log("POST /create-checkout-session  |  POST /webhook (raw JSON)");
});

(function () {
  function safeParse(raw, fallback) {
    try {
      return JSON.parse(raw);
    } catch (_) {
      return fallback;
    }
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function normalizeEmail(email) {
    return String(email || "").trim().toLowerCase();
  }

  function slugFollowKey(s) {
    return String(s || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function handleVariants(h) {
    var raw = String(h || "").trim();
    if (!raw) return { withAt: "", noAt: "", slug: "" };
    var noAt = raw.charAt(0) === "@" ? raw.slice(1) : raw;
    var withAt = raw.charAt(0) === "@" ? raw : "@" + noAt;
    return { withAt: withAt.toLowerCase(), noAt: noAt.toLowerCase(), slug: slugFollowKey(noAt) };
  }

  function followIdMatchesStored(storedId, candidate) {
    var a = String(storedId || "").trim();
    var b = String(candidate || "").trim();
    if (!a || !b) return false;
    if (a === b) return true;
    if (a.toLowerCase() === b.toLowerCase()) return true;
    var va = handleVariants(a);
    var vb = handleVariants(b);
    if (va.withAt && vb.withAt && va.withAt === vb.withAt) return true;
    if (va.noAt && vb.noAt && va.noAt === vb.noAt) return true;
    if (va.slug && vb.slug && va.slug === vb.slug) return true;
    if (va.slug && b.toLowerCase() === va.slug) return true;
    if (vb.slug && a.toLowerCase() === vb.slug) return true;
    return false;
  }

  var cur = null;
  var inited = {};
  var USERS = safeParse(localStorage.getItem("dl_users") || "{}", {});
  var SESSION = safeParse(localStorage.getItem("dl_session") || "null", null);

  var ALL_HOSTS = [
    { id: "cr", name: "Casey Rivera", handle: "@caseystyle", initials: "CR", color: "#C0000A", cat: "👟 Footwear · 👗 Fashion", bio: "Sneakerhead & streetwear curator. Exclusive drops every Tue & Fri.", followers: "84K", rating: "4.9", live: true, viewers: "1.2K", streamTitle: "Air Trainer Pro — Summer Drop" },
    { id: "mr", name: "Maya R.", handle: "@mayaglows", initials: "MR", color: "#a80000", cat: "💄 Beauty · 🧴 Skincare", bio: "Beauty editor turned creator. Honest reviews, zero fluff.", followers: "62K", rating: "4.8", live: true, viewers: "890", streamTitle: "Glow Up Kit — Limited Edition" },
    { id: "dl", name: "Dev L.", handle: "@devplays", initials: "DL", color: "#8B0000", cat: "🎸 Music · 🎵 Gear", bio: "Guitarist & gear collector. Vintage instruments, modern deals.", followers: "38K", rating: "4.7", live: true, viewers: "567", streamTitle: "Vintage Fender Collection" },
    { id: "sc", name: "Sofia C.", handle: "@sofiacozy", initials: "SC", color: "#7a0006", cat: "🏠 Home · 🛋️ Decor", bio: "Interior stylist sharing curated home finds.", followers: "51K", rating: "4.9", live: false, viewers: "--", streamTitle: "" },
    { id: "rm", name: "Ryan M.", handle: "@ryanlifts", initials: "RM", color: "#6a0000", cat: "💪 Fitness · 🥗 Nutrition", bio: "NASM-certified trainer. Real gear, real results.", followers: "29K", rating: "4.8", live: false, viewers: "--", streamTitle: "" },
    { id: "ll", name: "Lena L.", handle: "@lenapaints", initials: "LL", color: "#900007", cat: "🎨 Art · 🖼️ Prints", bio: "Artist & printmaker. Watch me create, then buy the original.", followers: "22K", rating: "5.0", live: false, viewers: "--", streamTitle: "" }
  ];

  function saveUsers() { localStorage.setItem("dl_users", JSON.stringify(USERS)); }
  function saveSession() { localStorage.setItem("dl_session", JSON.stringify(SESSION)); }
  (function migrateHostIds() {
    var changed = false;
    Object.keys(USERS).forEach(function (email) {
      var u = USERS[email];
      if (!u || !u.following) return;
      var ix = u.following.indexOf("jk");
      if (ix === -1) return;
      u.following.splice(ix, 1);
      if (u.following.indexOf("cr") === -1) u.following.push("cr");
      changed = true;
    });
    if (changed) saveUsers();
  })();
  Object.defineProperty(window, "USERS", {
    get: function () { return USERS; },
    set: function (v) { USERS = v || {}; }
  });
  Object.defineProperty(window, "SESSION", {
    get: function () { return SESSION; },
    set: function (v) { SESSION = v; }
  });
  window.saveUsers = saveUsers;
  window.saveSession = saveSession;
  window.ALL_HOSTS = ALL_HOSTS;

  function setMetaContent(nameOrProp, content, useProperty) {
    if (!content) return;
    var sel = useProperty
      ? 'meta[property="' + nameOrProp.replace(/"/g, "") + '"]'
      : 'meta[name="' + nameOrProp.replace(/"/g, "") + '"]';
    var el = document.head.querySelector(sel);
    if (!el) {
      el = document.createElement("meta");
      if (useProperty) el.setAttribute("property", nameOrProp);
      else el.setAttribute("name", nameOrProp);
      document.head.appendChild(el);
    }
    el.setAttribute("content", content);
  }

  function applyPublishSettings() {
    var P = window.LIGHTSHOP_PUBLISH || window.DROPLIVE_PUBLISH || {};
    var site = String(P.siteUrl || "").replace(/\/$/, "");
    var path = String(P.indexPath || "/lightshop.html");
    if (path.charAt(0) !== "/") path = "/" + path;
    var ogPath = String(P.ogImagePath || "/og-image.svg");
    if (ogPath.charAt(0) !== "/") ogPath = "/" + ogPath;
    var fullPageUrl = site ? site + path : "";
    var fullOgImage = site ? site + ogPath : "";

    if (site) {
      var canon = document.head.querySelector('link[rel="canonical"]');
      if (!canon) {
        canon = document.createElement("link");
        canon.rel = "canonical";
        document.head.appendChild(canon);
      }
      canon.href = fullPageUrl;
      setMetaContent("og:url", fullPageUrl, true);
      if (fullOgImage) {
        setMetaContent("og:image", fullOgImage, true);
        setMetaContent("twitter:image", fullOgImage, false);
      }
    }

    var domain = String(P.plausibleDomain || "").trim();
    if (domain && !document.querySelector('script[data-domain][src*="plausible"]')) {
      var s = document.createElement("script");
      s.defer = true;
      s.setAttribute("data-domain", domain);
      s.src = String(P.plausibleSrc || "https://plausible.io/js/script.js");
      document.head.appendChild(s);
    }

    var mail = String(P.supportEmail || "support@lightshop.com").trim().replace(/^mailto:/i, "");
    var bs = document.getElementById("bar-support");
    if (bs && mail) bs.setAttribute("href", "mailto:" + mail);

    var ban = document.getElementById("publish-demo-banner");
    if (ban) {
      if (P.showDemoBanner === false) {
        ban.style.display = "none";
        document.body.style.paddingBottom = "";
      } else {
        ban.style.display = "flex";
        document.body.style.paddingBottom = "52px";
      }
    }
  }

  var sellerMediaStream = null;

  function stopSellerLiveCamera(skipHudRefresh) {
    var skipHud = skipHudRefresh === true;
    var video = document.getElementById("wt-live-video");
    var bg = document.getElementById("wt-bg");
    var errEl = document.getElementById("wt-camera-err");
    var startBtn = document.getElementById("wt-start-camera-btn");
    var stopBtn = document.getElementById("wt-camera-stop");
    var player = document.querySelector("#p-watch .wt-player");
    if (sellerMediaStream) {
      sellerMediaStream.getTracks().forEach(function (t) { t.stop(); });
      sellerMediaStream = null;
    }
    if (video) {
      video.srcObject = null;
      video.style.display = "none";
    }
    if (bg) bg.style.display = "";
    window.__dropliveCameraOn = false;
    window.__dropliveSellerLive = false;
    if (player) player.classList.remove("wt-seller-live");
    if (errEl) {
      errEl.textContent = "";
      errEl.style.display = "none";
    }
    if (startBtn) {
      startBtn.style.display = "";
      startBtn.disabled = false;
    }
    if (stopBtn) stopBtn.style.display = "none";
    if (!skipHud && typeof window.wtLoadIdx === "function") {
      var idx = typeof window.wtIdx === "number" ? window.wtIdx : 0;
      window.wtLoadIdx(idx);
    }
  }

  function sellerNameToInitials(name) {
    var parts = String(name || "You").trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "ME";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function applySellerLiveHud() {
    var player = document.querySelector("#p-watch .wt-player");
    if (player) player.classList.add("wt-seller-live");
    var sess = window.SESSION;
    var users = window.USERS;
    var u = sess && users && users[sess.email];
    var nameEl = document.getElementById("wt-name");
    var av = document.getElementById("wt-av");
    var vw = document.getElementById("wt-viewers");
    var pill = document.getElementById("wt-pill");
    var prodEl = document.getElementById("wt-prod");
    var emEl = document.getElementById("wt-emoji");
    var priceEl = document.getElementById("wt-price");
    if (!u) {
      if (nameEl) nameEl.textContent = "You · Live";
      if (av) {
        av.textContent = "YOU";
        av.style.background = "#E8000D";
      }
      if (vw) vw.textContent = "👁 Camera preview (sign in to show your shop name)";
      if (pill) pill.textContent = "Your preview";
      if (prodEl) prodEl.textContent = "Your spotlight";
      if (emEl) emEl.textContent = "📦";
      if (priceEl) priceEl.textContent = "—";
      return;
    }
    ensureSellerForUser(u);
    var prods = (u.seller && u.seller.products) || [];
    var p0 = prods[0];
    if (nameEl) nameEl.textContent = u.name + " · Live";
    if (av) {
      av.textContent = sellerNameToInitials(u.name);
      av.style.background = "#E8000D";
    }
    if (vw) vw.textContent = "👁 You're on camera — this is your preview (demo viewers below are sample data)";
    if (pill) pill.textContent = "You're live";
    if (p0) {
      if (prodEl) prodEl.textContent = p0.name;
      if (emEl) emEl.textContent = p0.emoji || "📦";
      if (priceEl) priceEl.textContent = "$" + Number(p0.price).toFixed(2);
    } else {
      if (prodEl) prodEl.textContent = "No product listed yet";
      if (emEl) emEl.textContent = "📦";
      if (priceEl) priceEl.textContent = "Add one in Sell";
    }
  }

  function startSellerLiveCamera() {
    var video = document.getElementById("wt-live-video");
    var bg = document.getElementById("wt-bg");
    var errEl = document.getElementById("wt-camera-err");
    var startBtn = document.getElementById("wt-start-camera-btn");
    var stopBtn = document.getElementById("wt-camera-stop");
    if (!video) return;
    var fileProto = typeof location !== "undefined" && location.protocol === "file:";
    var insecure = typeof window !== "undefined" && window.isSecureContext === false;
    if (fileProto || insecure) {
      if (errEl) {
        errEl.innerHTML = "The camera does not work with <code style=\"background:rgba(0,0,0,0.25);padding:2px 6px;border-radius:4px;\">file://</code> URLs. Publish or run a local static server (e.g. <code style=\"background:rgba(0,0,0,0.25);padding:2px 6px;border-radius:4px;\">python3 -m http.server</code> in this folder), open the site over <strong>http://localhost</strong> or <strong>https</strong>, then allow camera access.";
        errEl.style.display = "block";
      }
      window.__dropliveSellerLive = false;
      return;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      if (errEl) {
        errEl.textContent = "Camera is not available (use https or http://localhost, and a current browser).";
        errEl.style.display = "block";
      }
      window.__dropliveSellerLive = false;
      return;
    }
    if (errEl) errEl.style.display = "none";
    if (startBtn) startBtn.disabled = true;
    var gUM = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    function onStream(stream) {
      if (sellerMediaStream) {
        sellerMediaStream.getTracks().forEach(function (t) { t.stop(); });
      }
      sellerMediaStream = stream;
      video.srcObject = stream;
      video.style.display = "block";
      video.muted = true;
      if (bg) bg.style.display = "none";
      window.__dropliveCameraOn = true;
      if (window.__dropliveSellerLive) applySellerLiveHud();
      if (startBtn) {
        startBtn.style.display = "none";
        startBtn.disabled = false;
      }
      if (stopBtn) stopBtn.style.display = "";
      var playP = video.play();
      if (playP && typeof playP.catch === "function") {
        playP.catch(function () {});
      }
      return playP;
    }
    function onFail(e) {
      if (startBtn) startBtn.disabled = false;
      window.__dropliveSellerLive = false;
      var name = e && e.name;
      var msg = "Could not start camera.";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        msg = "Camera or microphone access was blocked. Click the lock icon in the address bar, allow camera and mic, then try again.";
      } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        msg = "No camera or microphone was found.";
      } else if (name === "NotReadableError" || name === "TrackStartError") {
        msg = "Camera or mic is busy or unavailable. Close other apps using them and try again.";
      } else if (name === "OverconstrainedError") {
        msg = "Could not match camera settings — try an external webcam or update your browser.";
      }
      if (errEl) {
        errEl.textContent = msg;
        errEl.style.display = "block";
      }
    }
    gUM({ video: { facingMode: { ideal: "user" } }, audio: true })
      .catch(function () {
        return gUM({ video: true, audio: true });
      })
      .catch(function () {
        return gUM({ video: true, audio: false });
      })
      .then(function (stream) {
        return onStream(stream);
      })
      .catch(onFail);
  }

  function goLiveWithCamera() {
    window.__dropliveSellerLive = true;
    go("watch");
    setTimeout(function () {
      startSellerLiveCamera();
    }, 600);
  }

  function readWatchCategoryFromHash() {
    var raw = (window.location && window.location.hash ? window.location.hash : "").replace(/^#/, "");
    if (!raw) return "";
    var match = raw.match(/(?:^|&)cat=([^&]+)/);
    if (!match || !match[1]) return "";
    try {
      return decodeURIComponent(match[1].replace(/\+/g, " ")).trim();
    } catch (_) {
      return "";
    }
  }

  function go(page) {
    var el = document.getElementById("p-" + page);
    if (!el) {
      console.warn("No page: " + page);
      return;
    }
    if (cur === "lightning" && page !== "lightning" && typeof window.__lrStopPageTimers === "function") {
      window.__lrStopPageTimers();
    }
    if (cur === "golden" && page !== "golden" && typeof window.__grStopPageTimers === "function") {
      window.__grStopPageTimers();
    }
    if (cur === "watch" && page !== "watch") {
      if (typeof window.__wtStopPageTimers === "function") window.__wtStopPageTimers();
      stopSellerLiveCamera();
      if (typeof window.miniPipShow === "function") window.miniPipShow();
    }
    if (page === "watch" && typeof window.miniPipHide === "function") {
      window.miniPipHide();
    }
    if (cur) {
      var old = document.getElementById("p-" + cur);
      if (old) old.style.display = "none";
      var otb = document.getElementById("tb-" + cur);
      if (otb) otb.classList.remove("on");
    }
    el.style.display = "block";
    cur = page;
    var tb = document.getElementById("tb-" + page);
    if (tb) tb.classList.add("on");
    window.scrollTo(0, 0);
    if (!inited[page]) {
      inited[page] = true;
      el.querySelectorAll("script").forEach(function (s) {
        var ns = document.createElement("script");
        ns.textContent = s.textContent;
        s.parentNode.replaceChild(ns, s);
      });
    }
    if (page === "following") renderFollowing();
    if (page === "sell") renderSell();
    if (page === "history") renderHistory();
    if (page === "lightning" && typeof window.__lrResumePageTimers === "function") {
      window.__lrResumePageTimers();
    }
    if (page === "golden" && typeof window.__grResumePageTimers === "function") {
      window.__grResumePageTimers();
    }
    if (page === "watch" && typeof window.__wtResumePageTimers === "function") {
      window.__wtResumePageTimers();
    }
    if (page === "watch" && typeof window.wtSetCategory === "function") {
      var catFromHash = readWatchCategoryFromHash();
      if (catFromHash) window.wtSetCategory(catFromHash);
    }
    if (page === "lightning" && typeof window.lrRefreshPoolNote === "function") {
      window.lrRefreshPoolNote();
    }
    syncFollowButtons();
  }

  var authMode = "login";
  function openAuth(mode) {
    authMode = mode || "login";
    switchTab(authMode);
    var ov = document.getElementById("auth-overlay");
    if (!ov) return;
    ov.style.display = "flex";
    setTimeout(function () { var inp = document.getElementById("inp-email"); if (inp) inp.focus(); }, 100);
  }
  function closeAuth() {
    var ov = document.getElementById("auth-overlay");
    if (ov) ov.style.display = "none";
    var err = document.getElementById("auth-error");
    if (err) err.style.display = "none";
    ["inp-email", "inp-pass", "inp-name"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.value = "";
    });
  }
  function switchTab(mode) {
    authMode = mode;
    var isSignup = mode === "signup";
    var t = document.getElementById("auth-title");
    if (t) t.textContent = isSignup ? "Create your account" : "Welcome back";
    var s = document.getElementById("auth-sub");
    if (s) s.textContent = isSignup ? "Join millions of live shoppers" : "Sign in to see your followed creators";
    var sb = document.getElementById("auth-submit-btn");
    if (sb) sb.textContent = isSignup ? "Create account" : "Sign in";
    var snr = document.getElementById("signup-name-row");
    if (snr) snr.style.display = isSignup ? "block" : "none";
    var st = document.getElementById("signup-terms");
    if (st) st.style.display = isSignup ? "block" : "none";
    var tl = document.getElementById("tab-login");
    if (tl) {
      tl.style.color = isSignup ? "#999" : "#E8000D";
      tl.style.borderBottomColor = isSignup ? "transparent" : "#E8000D";
      tl.style.fontWeight = isSignup ? "500" : "600";
    }
    var ts = document.getElementById("tab-signup");
    if (ts) {
      ts.style.color = isSignup ? "#E8000D" : "#999";
      ts.style.borderBottomColor = isSignup ? "#E8000D" : "transparent";
      ts.style.fontWeight = isSignup ? "600" : "500";
    }
    var ae = document.getElementById("auth-error");
    if (ae) ae.style.display = "none";
  }
  function submitAuth() {
    var email = normalizeEmail(document.getElementById("inp-email").value);
    var pass = document.getElementById("inp-pass").value;
    var name = document.getElementById("inp-name").value.trim();
    if (!email || !pass) { showErr("Please fill in all fields."); return; }
    if (!email.includes("@")) { showErr("Enter a valid email address."); return; }
    if (pass.length < 4) { showErr("Password must be at least 4 characters."); return; }
    if (authMode === "signup") {
      if (!name) { showErr("Please enter your name."); return; }
      if (USERS[email]) { showErr("An account with that email already exists."); return; }
      USERS[email] = { name: name, pass: pass, following: [], createdAt: Date.now() };
      saveUsers();
      SESSION = { email: email };
      saveSession();
      closeAuth();
      onLogin();
    } else {
      var u = USERS[email];
      if (!u || u.pass !== pass) { showErr("Incorrect email or password."); return; }
      SESSION = { email: email };
      saveSession();
      closeAuth();
      onLogin();
    }
  }
  function showErr(msg) {
    var el = document.getElementById("auth-error");
    if (!el) return;
    el.textContent = msg;
    el.style.display = "block";
  }
  function onLogin(skipNav) {
    if (!SESSION || !USERS[SESSION.email]) return;
    var u = USERS[SESSION.email];
    var nameEl = document.getElementById("bar-user-name");
    var avEl = document.getElementById("bar-user-av");
    if (nameEl) nameEl.textContent = u.name;
    if (avEl) avEl.textContent = sellerNameToInitials(u.name);
    var barUser = document.getElementById("bar-user");
    if (barUser) barUser.style.display = "inline-flex";
    var ba = document.getElementById("bar-auth-btn");
    if (ba) ba.style.display = "none";
    var bl = document.getElementById("bar-logout-btn");
    if (bl) bl.style.display = "inline-block";
    // Following / History tabs are always visible; their pages handle the
    // logged-out state with a sign-in prompt.
    ["tb-dashboard"].forEach(function (id) {
      var el = document.getElementById(id); if (el) el.style.display = "none";
    });
    syncFollowButtons();
    if (!skipNav) go("following");
  }
  function openAccount() {
    if (!SESSION || !USERS[SESSION.email]) {
      if (typeof openAuth === "function") openAuth("login");
      return;
    }
    var u = USERS[SESSION.email];
    var ov = document.getElementById("account-overlay");
    if (!ov) return;
    var av = document.getElementById("acct-av");
    if (av) av.textContent = sellerNameToInitials(u.name);
    var nm = document.getElementById("acct-name");
    if (nm) nm.textContent = u.name || "Your account";
    var em = document.getElementById("acct-email");
    if (em) em.textContent = SESSION.email;
    var pn = document.getElementById("acct-p-name");
    if (pn) pn.textContent = u.name || "—";
    var pe = document.getElementById("acct-p-email");
    if (pe) pe.textContent = SESSION.email;
    var ps = document.getElementById("acct-p-since");
    if (ps) {
      if (u.createdAt) {
        ps.textContent = new Date(u.createdAt).toLocaleDateString();
      } else {
        ps.textContent = "—";
      }
    }
    var followingCount = (u.following || []).length;
    var orders = (u.history || []).filter(function (h) { return h.type === "purchase"; }).length;
    var products = (u.seller && u.seller.products && u.seller.products.length) || 0;
    var catsFollowed = (u.followedCategories || []).length;
    var sf = document.getElementById("acct-stat-following"); if (sf) sf.textContent = followingCount;
    var so = document.getElementById("acct-stat-orders"); if (so) so.textContent = orders;
    var sp = document.getElementById("acct-stat-products"); if (sp) sp.textContent = products;
    var scats = document.getElementById("acct-stat-cats"); if (scats) scats.textContent = catsFollowed;

    var lrWrap = document.getElementById("acct-p-lightning-wrap");
    var lrTxt = document.getElementById("acct-p-lightning");
    if (u.seller && u.seller.lightningApplication) {
      if (lrWrap) lrWrap.style.display = "";
      if (lrTxt) lrTxt.textContent = "Applied — in the draw";
    } else if (lrWrap) {
      lrWrap.style.display = "none";
    }

    var sb = document.getElementById("acct-seller-block");
    if (u.seller) {
      if (sb) sb.style.display = "";
      var ss = document.getElementById("acct-s-store");
      if (ss) ss.textContent = u.seller.store || (u.name + "'s live shop");
      var scw = document.getElementById("acct-s-cat-wrap");
      var sc = document.getElementById("acct-s-cat");
      if (u.seller.cat) {
        if (scw) scw.style.display = "";
        if (sc) sc.textContent = u.seller.cat;
      } else if (scw) {
        scw.style.display = "none";
      }
    } else if (sb) {
      sb.style.display = "none";
    }

    ov.style.display = "flex";
  }

  function closeAccount() {
    var ov = document.getElementById("account-overlay");
    if (ov) ov.style.display = "none";
  }

  function logout() {
    SESSION = null;
    localStorage.removeItem("dl_session");
    var bu = document.getElementById("bar-user");
    if (bu) bu.style.display = "none";
    var ba = document.getElementById("bar-auth-btn");
    if (ba) ba.style.display = "inline-block";
    var bl = document.getElementById("bar-logout-btn");
    if (bl) bl.style.display = "none";
    // Following / History tabs stay visible on logout too; their pages will
    // show the signed-out empty state with a sign-in CTA.
    syncFollowButtons();
    go("home");
  }

  var checkoutContext = null;
  var CHECKOUT_SHIP_FEE = 5.99;

  function coLuhnOk(numStr) {
    var d = String(numStr || "").replace(/\D/g, "");
    if (d.length < 13 || d.length > 19) return false;
    var sum = 0;
    var alt = false;
    for (var i = d.length - 1; i >= 0; i--) {
      var n = parseInt(d.charAt(i), 10);
      if (alt) {
        n *= 2;
        if (n > 9) n -= 9;
      }
      sum += n;
      alt = !alt;
    }
    return sum % 10 === 0;
  }

  function openCheckout(ctx) {
    checkoutContext = ctx;
    var ov = document.getElementById("checkout-overlay");
    if (!ov) return;
    var em = document.getElementById("co-emoji");
    var it = document.getElementById("co-item");
    var ho = document.getElementById("co-host");
    var pr = document.getElementById("co-price");
    var tot = document.getElementById("co-total");
    var gh = document.getElementById("co-guest-hint");
    if (em) em.textContent = ctx.emoji || "🛍️";
    if (it) it.textContent = ctx.item || "Item";
    if (ho) ho.textContent = "Sold by " + (ctx.host || "Host");
    if (pr) pr.textContent = ctx.priceLabel || ("$" + Number(ctx.priceNum).toFixed(2));
    var sub = Number(ctx.priceNum) || 0;
    var total = sub + CHECKOUT_SHIP_FEE;
    if (tot) tot.textContent = "$" + total.toFixed(2);
    var err = document.getElementById("co-err");
    if (err) {
      err.style.display = "none";
      err.textContent = "";
    }
    if (gh) gh.style.display = SESSION ? "none" : "block";
    if (SESSION && USERS[SESSION.email]) {
      var u0 = USERS[SESSION.email];
      var nm = document.getElementById("co-ship-name");
      if (nm && !nm.value.trim()) nm.value = u0.name || "";
    }
    var radios = document.querySelectorAll('input[name="co-pay"]');
    for (var ri = 0; ri < radios.length; ri++) {
      radios[ri].checked = radios[ri].value === "card";
    }
    coPayMethodChanged();
    ov.style.display = "flex";
    ov.style.zIndex = "5000000";
  }

  function closeCheckout() {
    checkoutContext = null;
    var ov = document.getElementById("checkout-overlay");
    if (ov) ov.style.display = "none";
    var err = document.getElementById("co-err");
    if (err) {
      err.style.display = "none";
      err.textContent = "";
    }
  }

  function coPayMethodChanged() {
    var sel = document.querySelector('input[name="co-pay"]:checked');
    var m = sel ? sel.value : "card";
    var cardPanel = document.getElementById("co-card-panel");
    var wh = document.getElementById("co-wallet-hint");
    if (m === "card") {
      if (cardPanel) cardPanel.style.display = "block";
      if (wh) wh.style.display = "none";
    } else {
      if (cardPanel) cardPanel.style.display = "none";
      if (wh) wh.style.display = "block";
    }
  }

  function submitCheckout() {
    var ctx = checkoutContext;
    var errEl = document.getElementById("co-err");
    function showCoErr(msg) {
      if (!errEl) return;
      errEl.textContent = msg;
      errEl.style.display = "block";
    }
    if (!ctx) {
      showCoErr("Nothing to checkout.");
      return;
    }
    if (errEl) errEl.style.display = "none";

    var payEl = document.querySelector('input[name="co-pay"]:checked');
    var payM = payEl ? payEl.value : "card";
    if (payM !== "card") {
      showCoErr("This demo completes orders with Card only. Select Credit or debit card, or add Stripe for PayPal / Apple Pay.");
      return;
    }

    var nameEl = document.getElementById("co-ship-name");
    var l1 = document.getElementById("co-ship-line1");
    var city = document.getElementById("co-ship-city");
    var state = document.getElementById("co-ship-state");
    var zip = document.getElementById("co-ship-zip");
    if (!nameEl || !l1 || !city || !state || !zip) {
      showCoErr("Form error.");
      return;
    }
    var sn = nameEl.value.trim();
    var s1 = l1.value.trim();
    var sc = city.value.trim();
    var ss = state.value.trim();
    var sz = zip.value.trim();
    if (!sn || !s1 || !sc || !ss || !sz) {
      showCoErr("Please fill in all required shipping fields.");
      return;
    }

    var cn = document.getElementById("co-card-name");
    var cnum = document.getElementById("co-card-num");
    var cexp = document.getElementById("co-card-exp");
    var ccvv = document.getElementById("co-card-cvv");
    if (!cn || !cnum || !cexp || !ccvv) {
      showCoErr("Card form missing.");
      return;
    }
    var cardName = cn.value.trim();
    var rawNum = cnum.value.replace(/\s/g, "");
    var exp = cexp.value.trim();
    var cvv = ccvv.value.replace(/\s/g, "");
    if (!cardName) {
      showCoErr("Enter the name on your card.");
      return;
    }
    if (!/^\d{13,19}$/.test(rawNum)) {
      showCoErr("Enter a valid card number (13–19 digits).");
      return;
    }
    if (!coLuhnOk(rawNum)) {
      showCoErr("Card number did not validate. Try 4242424242424242 for this demo.");
      return;
    }
    if (!/^(0[1-9]|1[0-2])\s*\/\s*\d{2}$/.test(exp)) {
      showCoErr("Expiry must be MM / YY (e.g. 12 / 28).");
      return;
    }
    if (!/^\d{3,4}$/.test(cvv)) {
      showCoErr("Enter a valid CVC (3 or 4 digits).");
      return;
    }

    try {
      if (typeof ctx.afterCommit === "function") ctx.afterCommit();
    } catch (e) {
      showCoErr("Could not complete this order. Try again.");
      return;
    }

    if (SESSION && USERS[SESSION.email]) {
      var u = USERS[SESSION.email];
      if (!u.history) u.history = [];
      var sub = Number(ctx.priceNum) || 0;
      var total = sub + CHECKOUT_SHIP_FEE;
      var shipTo = sc + ", " + ss + " " + sz;
      u.history.unshift({
        type: "purchase",
        item: ctx.item,
        price: "$" + total.toFixed(2),
        host: ctx.host,
        emoji: ctx.emoji,
        date: new Date().toLocaleDateString(),
        shipTo: shipTo,
        payMethod: "Card (demo)"
      });
      saveUsers();
      if (cur === "history") renderHistory();
    }

    if (typeof ctx.onSuccessUI === "function") ctx.onSuccessUI();

    closeCheckout();
  }

  function isFollowing(hostId) {
    if (!SESSION) return false;
    var u = USERS[SESSION.email];
    return u && u.following && u.following.indexOf(hostId) !== -1;
  }
  function toggleFollow(hostId, btn) {
    if (!SESSION) { openAuth("login"); return; }
    var u = USERS[SESSION.email];
    if (!u) { openAuth("login"); return; }
    if (!u.following) u.following = [];
    var idx = u.following.indexOf(hostId);
    if (idx === -1) {
      u.following.push(hostId);
      if (btn) { btn.textContent = "Following"; btn.classList.add("following"); }
    } else {
      u.following.splice(idx, 1);
      if (btn) { btn.textContent = "Follow"; btn.classList.remove("following"); }
    }
    saveUsers();
  }
  function syncFollowButtons() {
    document.querySelectorAll("[data-follow-id]").forEach(function (btn) {
      var id = btn.getAttribute("data-follow-id");
      if (isFollowing(id)) {
        btn.textContent = "Following";
        btn.classList.add("following");
      } else {
        btn.textContent = "Follow";
        btn.classList.remove("following");
      }
    });
  }

  function resolveFollowedHost(id) {
    if (!id) return null;
    var host = ALL_HOSTS.find(function (h) { return followIdMatchesStored(id, h.id); });
    if (host) return host;

    var pools = [];
    if (window.LR_APPLICANT_POOL && Array.isArray(window.LR_APPLICANT_POOL)) pools.push(window.LR_APPLICANT_POOL);
    if (window.grCurrentLineup && typeof window.grCurrentLineup === "function") pools.push(window.grCurrentLineup() || []);
    if (window.lrCurrentLineup && typeof window.lrCurrentLineup === "function") pools.push(window.lrCurrentLineup() || []);
    if (window.wtStreams && Array.isArray(window.wtStreams)) pools.push(window.wtStreams);

    for (var p = 0; p < pools.length; p++) {
      var arr = pools[p];
      for (var i = 0; i < arr.length; i++) {
        var s = arr[i];
        if (!s) continue;
        var sid = s.id || "";
        var sh = s.handle || "";
        var nameKey = slugFollowKey(s.name || "");
        if (
          followIdMatchesStored(id, sid) ||
          followIdMatchesStored(id, sh) ||
          (nameKey && followIdMatchesStored(id, nameKey))
        ) {
          return {
            id: sid || id,
            name: s.name || "Creator",
            handle: sh || "@creator",
            initials: s.av || ((s.name || "CR").slice(0, 2).toUpperCase()),
            color: s.color || "#C0000A",
            cat: s.cat || "Live creator",
            bio: s.claim || s.desc || "Live creator",
            followers: "Live",
            rating: "4.8",
            live: true,
            viewers: (typeof s.viewers === "number" ? s.viewers.toLocaleString() : "—"),
            streamTitle: s.prod || "Live stream"
          };
        }
      }
    }
    return null;
  }

  function renderFollowing() {
    var el = document.getElementById("fol-content");
    if (!el) return;
    if (!SESSION || !USERS[SESSION.email]) {
      el.innerHTML = "<div class=\"fol-gate\"><h2 class=\"u-mb-10\">Sign in to view Following</h2><p class=\"u-muted-body u-mb-16\">Track your favorite creators and never miss a drop.</p><button onclick=\"openAuth('login')\" class=\"btn-red-md btn-red-shadow\">Sign in</button></div>";
      return;
    }
    var u = USERS[SESSION.email];
    var followed = (u.following || []).map(resolveFollowedHost).filter(Boolean);
    if (followed.length === 0) {
      el.innerHTML = "<div class=\"fol-gate\"><h2 class=\"u-mb-10\">You are not following anyone yet</h2><p class=\"u-muted-body u-mb-16\">Follow creators from the Watch page to see them here.</p><button onclick=\"go('watch')\" class=\"btn-red-md\">Browse creators →</button></div>";
      return;
    }
    var html = "<div class=\"fol-grid\">" + followed.map(function (h) {
      return "<div class=\"host-card host-card-lite\">" +
        "<div class=\"host-name host-name-strong\">" + escapeHtml(h.name) + "</div>" +
        "<div class=\"host-handle-lite\">" + escapeHtml(h.handle) + "</div>" +
        "<button class=\"fol-unfollow\" onclick=\"toggleFollow('" + h.id + "',null);window.renderFollowing();\">Unfollow</button>" +
      "</div>";
    }).join("") + "</div>";
    el.innerHTML = html;
  }

  function ensureSellerForUser(u) {
    if (!u.seller) {
      u.seller = { store: u.name + "'s live shop", cat: "", bio: "", products: [] };
      saveUsers();
    }
  }

  function renderSell() {
    var el = document.getElementById("sell-content");
    if (!el) return;
    if (!SESSION || !USERS[SESSION.email]) {
      el.innerHTML =
        "<div class=\"sell-gate\">" +
        "<div style=\"font-size:52px;margin-bottom:16px;\">💰</div>" +
        "<h2 class=\"u-mb-10\" style=\"font-family:Syne,sans-serif;font-size:28px;font-weight:800;color:#1a0000;\">Start selling live</h2>" +
        "<p class=\"u-muted-body u-mb-16\" style=\"max-width:440px;margin-left:auto;margin-right:auto;\">Use the <strong>same account</strong> you use to shop. Sign in to list products and learn where to go live.</p>" +
        "<button onclick=\"openAuth('login')\" class=\"btn-red-pill btn-red-shadow btn-red-bold\">Sign in to sell →</button>" +
        "</div>";
      return;
    }
    ensureSellerForUser(USERS[SESSION.email]);
    renderSellerDash();
  }

  function histParsePrice(pr) {
    if (pr == null || pr === "") return 0;
    var n = parseFloat(String(pr).replace(/[^0-9.]/g, ""));
    return isNaN(n) ? 0 : n;
  }

  function renderHistory() {
    var el = document.getElementById("hist-content");
    if (!el) return;
    if (!SESSION || !USERS[SESSION.email]) {
      el.innerHTML =
        "<div class=\"hist-empty\">" +
        "<h2 class=\"u-mb-10\">Sign in to see your history</h2>" +
        "<p class=\"u-muted-body u-mb-16\">Track purchases from live streams.</p>" +
        "<button onclick=\"openAuth('login')\" class=\"btn-red-md btn-red-tight\">Sign in</button>" +
        "</div>";
      return;
    }
    var u = USERS[SESSION.email];
    var hist = u.history || [];
    if (hist.length === 0) {
      el.innerHTML =
        "<div class=\"hist-empty\">" +
        "<h2 class=\"u-mb-10\">No purchases yet</h2>" +
        "<p class=\"u-muted-body u-mb-16\">Watch a live stream and use Buy now to see orders here.</p>" +
        "<button onclick=\"go('watch')\" class=\"btn-red-md\">Watch streams →</button>" +
        "</div>";
      return;
    }
    var total = hist.reduce(function (sum, h) {
      return sum + histParsePrice(h.price);
    }, 0);
    var rows = hist
      .map(function (h) {
        return (
          "<div class=\"hist-row\">" +
          "<div class=\"hist-emoji\">" +
          escapeHtml(h.emoji || "🛍️") +
          "</div>" +
          "<div style=\"flex:1;min-width:0;\">" +
          "<div class=\"hist-item\">" +
          escapeHtml(h.item || "") +
          "</div>" +
          "<div class=\"hist-meta\">by " +
          escapeHtml(h.host || "") +
          " · " +
          escapeHtml(h.date || "") +
          (h.shipTo ? " · Ship: " + escapeHtml(h.shipTo) : "") +
          "</div>" +
          "</div>" +
          "<div class=\"hist-price\">" +
          escapeHtml(h.price || "") +
          "</div>" +
          "</div>"
        );
      })
      .join("");
    el.innerHTML =
      "<div style=\"display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;\">" +
      "<div style=\"font-family:Syne,sans-serif;font-size:18px;font-weight:700;color:#1a0000;\">" +
      hist.length +
      " purchase" +
      (hist.length !== 1 ? "s" : "") +
      "</div>" +
      "<div style=\"font-size:16px;font-weight:700;color:#E8000D;\">Total spent: $" +
      total.toFixed(2) +
      "</div>" +
      "</div>" +
      "<div style=\"border:1.5px solid #FFD6D6;border-radius:12px;overflow:hidden;\">" +
      rows +
      "</div>";
  }

  var selectedEmoji = "📦";

  function openAddProduct() {
    var ov = document.getElementById("addprod-overlay");
    if (!ov) return;
    var n = document.getElementById("p-name");
    var pr = document.getElementById("p-price");
    var st = document.getElementById("p-stock");
    var em = document.getElementById("p-emoji");
    if (n) n.value = "";
    if (pr) pr.value = "";
    if (st) st.value = "";
    if (em) em.value = "📦";
    selectedEmoji = "📦";
    document.querySelectorAll(".ep").forEach(function (b) { b.style.background = "none"; b.style.borderColor = "#FFD6D6"; });
    var ae = document.getElementById("addprod-err");
    if (ae) ae.style.display = "none";
    ov.style.display = "flex";
  }
  function closeAddProduct() {
    var ov = document.getElementById("addprod-overlay");
    if (ov) ov.style.display = "none";
  }
  function pickEmoji(btn, key) {
    if (!btn) return;
    var emojiMap = { shoe: "👟", bag: "👗", beauty: "💄", home: "🏠", tech: "📱", music: "🎸", food: "🍕", fitness: "💪", art: "🎨", scarf: "🧣" };
    var emoji = emojiMap[key] || key;
    selectedEmoji = emoji;
    var pe = document.getElementById("p-emoji");
    if (pe) pe.value = emoji;
    document.querySelectorAll(".ep").forEach(function (b) { b.style.background = "none"; b.style.borderColor = "#FFD6D6"; });
    btn.style.background = "#FFF0F0";
    btn.style.borderColor = "#E8000D";
    btn.textContent = emoji;
  }
  function saveProduct() {
    var nameEl = document.getElementById("p-name");
    var priceEl = document.getElementById("p-price");
    var stockEl = document.getElementById("p-stock");
    var err = document.getElementById("addprod-err");
    if (!nameEl || !priceEl || !stockEl || !err) return;
    var name = nameEl.value.trim();
    var price = parseFloat(priceEl.value);
    var stock = parseInt(stockEl.value, 10);
    err.style.display = "none";
    if (!name) { err.textContent = "Enter a product name."; err.style.display = "block"; return; }
    if (!price || price <= 0) { err.textContent = "Enter a valid price."; err.style.display = "block"; return; }
    if (!stock || stock < 1) { err.textContent = "Enter a valid stock quantity."; err.style.display = "block"; return; }
    if (SESSION && USERS[SESSION.email]) {
      var u = USERS[SESSION.email];
      ensureSellerForUser(u);
      if (!u.seller.products) u.seller.products = [];
      u.seller.products.push({ name: name, price: price, stock: stock, emoji: selectedEmoji, id: Date.now() });
      saveUsers();
      closeAddProduct();
      renderSellerDash();
    }
  }
  function renderSellerDash() {
    if (!SESSION || !USERS[SESSION.email]) return;
    var el = document.getElementById("sell-content");
    if (!el) return;
    var u = USERS[SESSION.email];
    ensureSellerForUser(u);
    var s = u.seller;
    var products = s.products || [];
    var storeTitle = escapeHtml(s.store || u.name);
    var header =
      "<div style=\"background:linear-gradient(135deg,#C0000A,#7a0006);padding:36px 40px;\">" +
      "<div style=\"max-width:900px;margin:0 auto;\">" +
      "<div style=\"font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,220,220,.8);margin-bottom:6px;\">Seller dashboard</div>" +
      "<div style=\"font-family:Syne,sans-serif;font-size:28px;font-weight:800;color:#fff;letter-spacing:-1px;margin-bottom:20px;\">" +
      storeTitle +
      "</div>" +
      "<div style=\"display:grid;grid-template-columns:repeat(3,1fr);gap:14px;\">" +
      "<div class=\"sell-stat\"><div class=\"sell-stat-label\">Sales today</div><div class=\"sell-stat-val\">$0</div></div>" +
      "<div class=\"sell-stat\"><div class=\"sell-stat-label\">Products</div><div class=\"sell-stat-val\">" +
      products.length +
      "</div></div>" +
      "<div class=\"sell-stat\"><div class=\"sell-stat-label\">Streams</div><div class=\"sell-stat-val\">0</div></div>" +
      "</div></div></div>";
    var la = u.seller.lightningApplication;
    var lightningBlock =
      "<div style=\"max-width:900px;margin:0 auto;padding:0 40px 24px;\">" +
      "<div style=\"background:linear-gradient(135deg,#1a0a0a,#2d1010);border:1px solid rgba(232,0,13,0.35);border-radius:14px;padding:22px 24px;color:#fff;\">" +
      "<div style=\"display:flex;align-items:flex-start;gap:14px;flex-wrap:wrap;\">" +
      "<span style=\"font-size:36px;line-height:1;\">⚡</span>" +
      "<div style=\"flex:1;min-width:220px;\">" +
      "<div style=\"font-family:Syne,sans-serif;font-size:18px;font-weight:800;margin-bottom:6px;letter-spacing:-0.3px;\">Lightning Round — apply to go on air</div>" +
      "<p style=\"margin:0 0 14px;font-size:13px;line-height:1.55;color:rgba(255,200,200,0.85);\">" +
      "Each show, Lightshop draws creators <strong style=\"color:#fff;\">at random</strong> from everyone who applied. " +
      "You need at least one live product listed. This demo only saves your application in the browser.</p>" +
      (la
        ? "<div style=\"font-size:13px;font-weight:700;color:#90ff90;margin-bottom:10px;\">✓ You're in the applicant pool since " +
          escapeHtml(String(la.appliedAt || "").slice(0, 10)) +
          ". Selection is by chance — check back on ⚡ Lightning.</div>" +
          "<button type=\"button\" disabled style=\"padding:10px 20px;background:rgba(255,255,255,0.12);color:rgba(255,255,255,0.5);border:1px solid rgba(255,255,255,0.2);border-radius:8px;font-size:13px;font-weight:700;cursor:default;font-family:DM Sans,sans-serif;\">Applied</button>"
        : "<button type=\"button\" onclick=\"applyForLightningRound()\" " +
          (products.length === 0 ? "disabled " : "") +
          "style=\"padding:12px 22px;background:#E8000D;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:800;cursor:" +
          (products.length === 0 ? "not-allowed;opacity:0.5" : "pointer") +
          ";font-family:DM Sans,sans-serif;box-shadow:0 4px 18px rgba(232,0,13,0.4);\">Apply for Lightning Round</button>" +
          (products.length === 0
            ? "<div style=\"margin-top:10px;font-size:12px;color:rgba(255,180,180,0.7);\">Add a product first to unlock application.</div>"
            : "")) +
      "</div></div></div></div>";
    var howTo =
      "<div style=\"max-width:900px;margin:0 auto;padding:0 40px 20px;\">" +
      "<div style=\"background:#FFF8F8;border:1px solid #FFD6D6;border-radius:12px;padding:20px 22px;\">" +
      "<div style=\"font-size:12px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;color:#E8000D;margin-bottom:12px;\">How selling works</div>" +
      "<ol style=\"margin:0 0 12px;padding-left:20px;color:#1a0000;font-size:14px;line-height:1.65;\">" +
      "<li style=\"margin-bottom:8px;\"><strong>List products</strong> — click <strong>+ Add product</strong> below, enter name, price, and stock, pick an emoji if you like, then <strong>Save product</strong>.</li>" +
      "<li style=\"margin-bottom:8px;\"><strong>Lightning Round</strong> — apply below. Slots are <strong>filled at random</strong> from applicants (demo: no real emails).</li>" +
      "<li><strong>Start your live video (demo)</strong> — click <strong>🔴 Go Live Now</strong> below or <strong>▶ Sell live</strong> on a product. That opens <strong>Watch</strong>: the full-screen live player where shoppers see your stream and <strong>Buy now</strong>.</li>" +
      "</ol>" +
      "<p style=\"margin:0;font-size:13px;color:#6b5050;line-height:1.5;\">One account for everything: the same sign-in is used for shopping and for this seller dashboard.</p>" +
      "</div></div>";
    var body =
      "<div style=\"max-width:900px;margin:0 auto;padding:36px 40px;\">" +
      "<button type=\"button\" class=\"sell-go-live\" onclick=\"goLiveWithCamera()\">🔴 Go Live Now</button>" +
      "<div style=\"display:flex;align-items:center;justify-content:space-between;margin:32px 0 16px;flex-wrap:wrap;gap:12px;\">" +
      "<div style=\"font-family:Syne,sans-serif;font-size:18px;font-weight:700;color:#1a0000;\">My products</div>" +
      "<button type=\"button\" onclick=\"openAddProduct()\" style=\"padding:8px 18px;background:#E8000D;color:#fff;border:none;border-radius:7px;font-size:13px;font-weight:700;cursor:pointer;font-family:DM Sans,sans-serif;\">+ Add product</button>" +
      "</div>";
    var productsBlock;
    if (products.length === 0) {
      productsBlock =
        "<div style=\"text-align:center;padding:36px;border:2px dashed #FFD6D6;border-radius:12px;\">" +
        "<div style=\"font-size:32px;margin-bottom:10px;\">📦</div>" +
        "<div style=\"font-size:14px;color:#6b5050;margin-bottom:14px;\">No products yet. Add one to start selling.</div>" +
        "<button type=\"button\" onclick=\"openAddProduct()\" style=\"padding:9px 24px;background:#E8000D;color:#fff;border:none;border-radius:7px;font-size:13px;font-weight:700;cursor:pointer;font-family:DM Sans,sans-serif;\">Add first product →</button>" +
        "</div>";
    } else {
      productsBlock = products
        .map(function (p) {
          return (
            "<div class=\"sell-prod-row\">" +
            "<div class=\"sell-prod-emoji\">" +
            escapeHtml(p.emoji) +
            "</div>" +
            "<div style=\"flex:1;\"><div class=\"sell-prod-name\">" +
            escapeHtml(p.name) +
            "</div><div class=\"sell-prod-price\">$" +
            Number(p.price || 0).toFixed(2) +
            " · " +
            p.stock +
            " in stock</div></div>" +
            "<button type=\"button\" onclick=\"goLiveWithCamera()\" style=\"padding:7px 14px;background:#E8000D;color:#fff;border:none;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;font-family:DM Sans,sans-serif;\">▶ Sell live</button>" +
            "<button type=\"button\" onclick=\"removeProduct(" +
            p.id +
            ")\" style=\"padding:7px 10px;border:1px solid #FFD6D6;background:none;border-radius:6px;font-size:12px;cursor:pointer;color:#6b5050;margin-left:6px;\">✕</button>" +
            "</div>"
          );
        })
        .join("");
    }
    el.innerHTML = header + lightningBlock + howTo + body + productsBlock + "</div>";
  }

  function applyForLightningRound() {
    if (!SESSION || !USERS[SESSION.email]) {
      openAuth("login");
      return;
    }
    var u = USERS[SESSION.email];
    ensureSellerForUser(u);
    var prods = u.seller.products || [];
    if (prods.length === 0) return;
    u.seller.lightningApplication = {
      appliedAt: new Date().toISOString(),
      status: "in_pool",
      spotlightProductId: prods[0].id
    };
    saveUsers();
    renderSellerDash();
    alert("You're in the Lightning applicant pool. Slots are chosen at random — open the ⚡ Lightning tab to see tonight's draw.");
  }

  function removeProduct(id) {
    if (!SESSION || !USERS[SESSION.email]) return;
    var u = USERS[SESSION.email];
    ensureSellerForUser(u);
    u.seller.products = (u.seller.products || []).filter(function (p) { return p.id !== id; });
    saveUsers();
    renderSellerDash();
  }

  var authOv = document.getElementById("auth-overlay");
  if (authOv) authOv.addEventListener("click", function (e) { if (e.target === this) closeAuth(); });
  var addOv = document.getElementById("addprod-overlay");
  if (addOv) addOv.addEventListener("click", function (e) { if (e.target === this) closeAddProduct(); });

  var spToasts = [
    { emoji: "👟", msg: "Alex M. just bought Air Trainer Pro", sub: "2 seconds ago · Casey Rivera's stream" },
    { emoji: "💄", msg: "Sarah bought Glow Up Kit — 35% off!", sub: "just now · Maya R.'s stream" },
    { emoji: "📱", msg: "Mike grabbed the MagSafe Stand deal", sub: "12 seconds ago · Flash Drop" },
    { emoji: "🎸", msg: "Jamie just bought Vintage Fender Bundle", sub: "28 seconds ago · Dev L.'s stream" },
    { emoji: "🏠", msg: "Emma bought the Linen Throw Bundle", sub: "1 minute ago · Sofia C.'s stream" },
    { emoji: "💪", msg: "Tyler just grabbed the Gym Starter Kit", sub: "just now · Ryan M.'s stream" },
    { emoji: "👗", msg: "Nina bought Summer Capsule Wardrobe", sub: "45 seconds ago · Nina J.'s stream" }
  ];
  var spIdx = 0;
  function showToast() {
    var t = spToasts[spIdx % spToasts.length]; spIdx++;
    var el = document.getElementById("sp-toast");
    if (!el) return;
    var em = document.getElementById("sp-emoji");
    var msg = document.getElementById("sp-msg");
    var sub = document.getElementById("sp-sub");
    if (!em || !msg || !sub) return;
    em.textContent = t.emoji;
    msg.textContent = t.msg;
    sub.textContent = t.sub;
    el.style.transform = "translateX(0)";
    setTimeout(function () { el.style.transform = "translateX(-120%)"; }, 4000);
  }

  document.addEventListener("click", function (e) {
    var btn = e.target.closest(".follow-btn");
    if (!btn) return;
    var fid = btn.getAttribute("data-follow-id");
    if (fid) {
      e.preventDefault();
      e.stopPropagation();
      toggleFollow(fid, btn);
      return;
    }
    var card = btn.closest(".host-card");
    if (!card) return;
    var nameEl = card.querySelector(".host-name");
    if (!nameEl) return;
    var host = ALL_HOSTS.find(function (h) { return h.name === nameEl.textContent.trim(); });
    if (!host) return;
    e.preventDefault();
    e.stopPropagation();
    toggleFollow(host.id, btn);
  });

  if (SESSION && USERS[SESSION.email]) onLogin(true);
  setTimeout(showToast, 3000);
  setInterval(showToast, 12000);
  setTimeout(function () {
    var b = document.getElementById("notify-banner");
    if (b) b.style.display = "flex";
  }, 20000);

  window.openAuth = openAuth;
  window.toggleFollow = toggleFollow;
  window.isFollowing = isFollowing;
  window.openSellerSignup = function () { go("sell"); };
  window.closeSellerSignup = function () {};
  window.openAddProduct = openAddProduct;
  window.closeAddProduct = closeAddProduct;
  window.pickEmoji = pickEmoji;
  window.saveProduct = saveProduct;
  window.removeProduct = removeProduct;
  window.submitAuth = submitAuth;
  window.switchTab = switchTab;
  window.closeAuth = closeAuth;
  window.logout = logout;
  window.go = go;
  window.startSellerLiveCamera = startSellerLiveCamera;
  window.stopSellerLiveCamera = stopSellerLiveCamera;
  window.goLiveWithCamera = goLiveWithCamera;
  window.renderFollowing = renderFollowing;
  window.syncFollowButtons = syncFollowButtons;
  window.openCheckout = openCheckout;
  window.closeCheckout = closeCheckout;
  window.submitCheckout = submitCheckout;
  window.coPayMethodChanged = coPayMethodChanged;
  window.applyForLightningRound = applyForLightningRound;
  window.openAccount = openAccount;
  window.closeAccount = closeAccount;

  applyPublishSettings();
  var bootCat = readWatchCategoryFromHash();
  if (bootCat) go("watch");
  else go("home");
})();

/* Mobile bottom bar (Home · Products · Cart · Profile), cart/profile icons in the
   mobile header, and the full-screen profile menu.
   Loaded on every page after cart-store.js. Phones / small tablets only (<= 860px). */
(function () {
  var page = (location.pathname.split("/").pop() || "index").replace(/\.html$/, "");
  if (page === "login" || page === "signup") return;   // logged-out pages: no bar

  var BASE = document.currentScript ? document.currentScript.src.replace(/[^\/]*$/, "") : "assets/";

  // ---- your details (edit here if they change) ----
  var CFG = {
    phoneShow: "8341383888",
    phoneTel:  "+918341383888",
    whatsapp:  "918341383888",
    waText:    "Hi, I'd like to order from Vasista Food and Traders"
  };

  var css =
    ".bn,.bp,.hdr-icons{display:none}" +
    "@media (max-width:860px){" +
    ".bn{position:fixed;left:0;right:0;bottom:0;z-index:90;display:flex;background:rgba(255,253,248,.98);" +
    "-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);border-top:1px solid #e3d8b8;" +
    "box-shadow:0 -10px 28px rgba(14,61,43,.14);padding:6px 6px calc(6px + env(safe-area-inset-bottom,0px))}" +
    ".bn a{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;padding:4px 2px 2px;" +
    "text-decoration:none;color:#5c5546;font:600 .72rem 'Work Sans',sans-serif;position:relative;-webkit-tap-highlight-color:transparent}" +
    ".bn .bn-ic{position:relative;display:flex;align-items:center;justify-content:center;width:52px;height:32px;border-radius:16px;transition:background .2s ease,color .2s ease}" +
    ".bn svg{width:25px;height:25px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}" +
    ".bn a.on{color:#0e3d2b;font-weight:700}" +
    ".bn a.on .bn-ic{background:#0e3d2b;color:#fff8e6}" +
    ".bn a:active .bn-ic{background:rgba(14,61,43,.12)}" +
    ".bn a.on:active .bn-ic{background:#0e3d2b}" +
    ".bn a:focus-visible{outline:2px solid #c9a34b;outline-offset:-2px;border-radius:12px}" +
    ".bn .bn-badge{position:absolute;top:-4px;left:calc(50% + 4px);right:auto;min-width:18px;height:18px;padding:0 5px;border-radius:9px;" +
    "background:#c0392b;color:#fff;font:700 .66rem/18px 'Work Sans',sans-serif;text-align:center;font-style:normal;box-shadow:0 0 0 2px #fffdf8}" +
    "body{padding-bottom:calc(76px + env(safe-area-inset-bottom,0px))}" +
    ".order-pill{bottom:calc(84px + env(safe-area-inset-bottom,0px))!important}" +

    /* header icons (cart + profile) — always visible at the top on phones */
    ".navbar .hdr-icons{display:flex;align-items:center;gap:6px;margin-left:8px}" +
    ".hdr-ic{position:relative;width:42px;height:42px;border-radius:50%;display:flex;align-items:center;justify-content:center;" +
    "color:#0e3d2b;background:rgba(14,61,43,.07);text-decoration:none;-webkit-tap-highlight-color:transparent}" +
    ".hdr-ic:active{background:rgba(14,61,43,.16)}" +
    ".hdr-ic svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}" +
    ".hdr-ic .nav-cart-badge{top:-3px;right:-3px;background:#c0392b;font-style:normal;box-shadow:0 0 0 2px #fffdf8}" +
    "body.has-bn .mobile-panel{display:none!important}" +

    ".bp{position:fixed;z-index:1100;top:calc(68px + env(safe-area-inset-top,0px));left:12px;width:min(240px,calc(100vw - 24px));" +
    "background:#fffdf8;border:1px solid #c9a34b;border-radius:14px;box-shadow:0 12px 32px rgba(14,61,43,.28);padding:6px 0;" +
    "opacity:0;visibility:hidden;transform:translateY(-8px);transition:opacity .18s ease,transform .18s ease,visibility 0s .18s}" +
    ".bp.open{opacity:1;visibility:visible;transform:none;transition:opacity .18s ease,transform .18s ease}" +
    ".bp-list{margin:0;padding:0;list-style:none}" +
    ".bp-list a{display:block;padding:13px 20px;font:500 1rem 'Work Sans',sans-serif;color:#201d17;text-decoration:none;-webkit-tap-highlight-color:transparent}" +
    ".bp-list a:active,.bp-list a:hover{background:#0e3d2b;color:#fff8e6}" +
    "body.has-bn .nav-toggle{display:block!important}" +
    "body.bp-lock{overflow:hidden}" +
    "}" +
    "@media (prefers-reduced-motion:reduce){.bp,.bp.open{transition:none}}";

  var icons = {
    home:    '<svg viewBox="0 0 24 24"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9.5h13V10"/><path d="M10 19.5v-5h4v5"/></svg>',
    products:'<svg viewBox="0 0 24 24"><path d="M5.5 8h13l-1 11.5h-11z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/></svg>',
    cart:    '<svg viewBox="0 0 24 24"><path d="M2.5 3.5h2.6l2.3 11.2h10.2l2-8H6"/><circle cx="9.3" cy="19" r="1.4"/><circle cx="16.8" cy="19" r="1.4"/></svg>',
    profile: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4.5 20c.9-3.6 3.8-5.5 7.5-5.5s6.6 1.9 7.5 5.5"/></svg>',
    close:   '<svg viewBox="0 0 24 24"><path d="M5 5l14 14M19 5L5 19"/></svg>',
    phone:   '<svg viewBox="0 0 24 24"><path d="M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.6a1 1 0 0 1-.25 1z"/></svg>'
  };

  function init() {
    if (document.querySelector(".bn")) return;
    var style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);

    /* ---------- bottom bar ---------- */
    var nav = document.createElement("nav");
    nav.className = "bn";
    nav.setAttribute("aria-label", "Main");
    function item(k, href, icon, label, extra) {
      return '<a href="' + href + '" data-k="' + k + '"' + (extra || "") + '><span class="bn-ic">' + icon +
        (k === "cart" ? '<i class="nav-cart-badge bn-badge">0</i>' : "") + "</span><span>" + label + "</span></a>";
    }
    nav.innerHTML =
      item("home", "/", icons.home, "Home") +
      item("products", "/order", icons.products, "Products") +
      item("cart", "/cart", icons.cart, "Cart") +
      item("profile", "/profile", icons.profile, "Profile", ' role="button" aria-haspopup="dialog"');
    document.body.appendChild(nav);

    var cur = { "index": "home", "order": "products", "cart": "cart", "profile": "profile" }[page];
    if (cur) nav.querySelector('[data-k="' + cur + '"]').setAttribute("aria-current", "page");
    document.body.classList.add("has-bn");

    /* ---------- cart + profile icons in the phone header ---------- */
    var navbar = document.querySelector(".navbar");
    if (navbar && !navbar.querySelector(".hdr-icons")) {
      var hdr = document.createElement("div");
      hdr.className = "hdr-icons";
      hdr.innerHTML =
        '<button type="button" class="hdr-lang" id="hdr-lang" aria-label="Language"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18"/></svg><span id="hdr-lang-t">\u0C24\u0C46\u0C32\u0C41\u0C17\u0C41</span><svg class="chev" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg></button>' +
        '<button type="button" class="hdr-ic" id="hdr-search" aria-label="Search"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg></button>' +
        '<a class="hdr-ic" href="/cart" aria-label="Cart">' + icons.cart + '<i class="nav-cart-badge">0</i></a>' +
        '<a class="hdr-ic" href="/profile" data-k="profile" role="button" aria-label="Profile">' + icons.profile + "</a>";
      var toggleBtn = navbar.querySelector(".nav-toggle");
      navbar.insertBefore(hdr, toggleBtn || null);
      hdr.querySelector('[data-k="profile"]').addEventListener("click", function (e) {
        e.preventDefault(); nav.querySelector('[data-k="profile"]').click();
      });
    }
    var sb = document.getElementById("hdr-search");
    if (sb && navbar) sb.addEventListener("click", function () {
      navbar.classList.toggle("search-open");
      var inp = navbar.querySelector(".nh-search input");
      if (inp && navbar.classList.contains("search-open")) inp.focus();
    });
    var lb = document.getElementById("hdr-lang"), lt = document.getElementById("hdr-lang-t");
    if (lb) {
      var isTe = (document.documentElement.lang || "").indexOf("te") === 0;
      var paint = function () { lt.textContent = isTe ? "English" : "\u0C24\u0C46\u0C32\u0C41\u0C17\u0C41"; };
      paint();
      lb.addEventListener("click", function () {
        isTe = !isTe;
        var I = window.VasistaI18n, code = isTe ? "te" : "en";
        if (I) ["setLang", "setLanguage", "set", "apply"].some(function (f) { if (typeof I[f] === "function") { I[f](code); return true; } });
        paint();
      });
    }
    if (cur) nav.querySelector('[data-k="' + cur + '"]').classList.add("on");
    if (window.VasistaCart) window.VasistaCart.updateBadge();   // cart-store keeps the count in sync

    /* ---------- profile menu ---------- */
    var panel = document.createElement("div");
    panel.className = "bp";
    panel.setAttribute("role", "menu");
    panel.setAttribute("aria-label", "Menu");
    panel.innerHTML =
      '<ul class="bp-list">' +
        '<li><a href="/">Home</a></li>' +
        '<li><a href="/order">Products</a></li>' +
        '<li><a href="/about">Why Vasista</a></li>' +
        '<li><a href="/cart">Cart</a></li>' +
        '<li><a href="/profile" id="bp-profile">Profile</a></li>' +
      "</ul>";
    document.body.appendChild(panel);

    var profileLink = panel.querySelector("#bp-profile");
    var toggle = document.querySelector(".nav-toggle");
    function open()  { panel.classList.add("open"); if (toggle) toggle.setAttribute("aria-expanded", "true"); }
    function close() { panel.classList.remove("open"); if (toggle) toggle.setAttribute("aria-expanded", "false"); }

    // hamburger toggles the dropdown (stop common.js / other handlers from opening the old panel)
    if (toggle) toggle.addEventListener("click", function (e) {
      e.preventDefault(); e.stopPropagation();
      panel.classList.contains("open") ? close() : open();
    }, true);
    // bottom-bar Profile button goes straight to the profile page now
    // close on outside tap, link tap, Escape, or resize to desktop
    document.addEventListener("click", function (e) {
      if (!panel.classList.contains("open")) return;
      if (panel.contains(e.target) && e.target.tagName !== "A") return;
      if (toggle && toggle.contains(e.target)) return;
      close();
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
    window.addEventListener("resize", function () { if (window.innerWidth > 860) close(); });

    /* ---------- Profile link -> Login if logged out (existing Firebase setup) ---------- */
    import(BASE + "firebase-config.js").then(function (m) {
      m.onAuthStateChanged(m.auth, function (user) {
        profileLink.href = user ? "/profile" : "/login";
        profileLink.textContent = user ? "Profile" : "Log in / Sign up";
      });
    }).catch(function () {});
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

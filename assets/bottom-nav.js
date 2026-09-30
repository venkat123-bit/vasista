/* Mobile bottom bar (Home · Cart · Profile) + full-screen profile menu.
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
    ".bn,.bp{display:none}" +
    "@media (max-width:860px){" +
    ".bn{position:fixed;left:0;right:0;bottom:0;z-index:90;display:flex;background:rgba(255,253,248,.96);" +
    "-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);border-top:1px solid #eae0c4;" +
    "box-shadow:0 -8px 24px rgba(14,61,43,.10);padding:6px 8px calc(6px + env(safe-area-inset-bottom,0px))}" +
    ".bn a{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;padding:6px 4px;border-radius:12px;" +
    "text-decoration:none;color:#7b7462;font:500 .72rem 'Work Sans',sans-serif;position:relative;-webkit-tap-highlight-color:transparent}" +
    ".bn svg{width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}" +
    ".bn a.on{color:#0e3d2b;font-weight:600}" +
    ".bn a.on::before{content:'';position:absolute;top:-7px;left:50%;width:28px;height:3px;margin-left:-14px;border-radius:0 0 3px 3px;background:#c9a34b}" +
    ".bn a:active{background:rgba(14,61,43,.07)}" +
    ".bn a:focus-visible{outline:2px solid #c9a34b;outline-offset:-2px}" +
    ".bn .bn-badge{position:absolute;top:1px;left:calc(50% + 6px);right:auto;min-width:17px;height:17px;padding:0 4px;border-radius:9px;" +
    "background:#7c1f2b;color:#fff;font:700 .62rem/17px 'Work Sans',sans-serif;text-align:center}" +
    "body{padding-bottom:calc(72px + env(safe-area-inset-bottom,0px))}" +
    ".order-pill{bottom:calc(84px + env(safe-area-inset-bottom,0px))!important}" +

    ".bp{position:fixed;inset:0;z-index:1100;background:#fffdf8;flex-direction:column;overflow-y:auto;" +
    "padding:calc(20px + env(safe-area-inset-top,0px)) 28px calc(28px + env(safe-area-inset-bottom,0px));" +
    "opacity:0;visibility:hidden;transform:translateX(24px);transition:opacity .22s ease,transform .22s ease,visibility 0s .22s}" +
    ".bp.open{display:flex;opacity:1;visibility:visible;transform:none;transition:opacity .22s ease,transform .22s ease}" +
    ".bp-x{align-self:flex-end;width:44px;height:44px;border:none;background:none;border-radius:50%;color:#0e3d2b;cursor:pointer;display:flex;align-items:center;justify-content:center}" +
    ".bp-x:active{background:rgba(14,61,43,.08)}" +
    ".bp-x svg{width:26px;height:26px;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;fill:none}" +
    ".bp-who{margin:0 0 4px;font:600 1rem 'Work Sans',sans-serif;color:#0e3d2b;word-break:break-word}" +
    ".bp-list{margin:8px 0 0;padding:0;list-style:none}" +
    ".bp-list a,.bp-list button{display:block;width:100%;text-align:left;padding:15px 0;border:none;background:none;cursor:pointer;" +
    "font:500 1.3rem 'Work Sans',sans-serif;color:#201d17;text-decoration:none;-webkit-tap-highlight-color:transparent}" +
    ".bp-list a:active,.bp-list button:active{color:#0e3d2b}" +
    ".bp-list .bp-out{color:#7c1f2b}" +
    ".bp-call{display:flex;align-items:center;gap:16px;margin-top:30px;padding-top:26px;border-top:1px solid #eae0c4;text-decoration:none;color:#201d17}" +
    ".bp-call i{flex:none;width:52px;height:52px;border-radius:50%;border:1.5px solid #0e3d2b;display:flex;align-items:center;justify-content:center;color:#0e3d2b}" +
    ".bp-call i svg{width:24px;height:24px;fill:currentColor}" +
    ".bp-call small{display:block;font:400 .9rem 'Work Sans',sans-serif;color:#6d6653}" +
    ".bp-call b{display:block;font:700 1.3rem 'Work Sans',sans-serif;color:#0e3d2b}" +
    ".bp-brand{margin-top:auto;padding-top:36px;display:flex;align-items:center;gap:12px}" +
    ".bp-brand img{width:54px;height:54px;border-radius:50%;object-fit:cover;box-shadow:0 0 0 1px #eae0c4}" +
    ".bp-brand span{font:700 1.35rem/1.05 'Cormorant Garamond',serif;color:#0e3d2b;letter-spacing:.03em}" +
    ".bp-brand small{display:block;font:500 .6rem 'Work Sans',sans-serif;letter-spacing:.16em;color:#7c1f2b;margin-top:2px}" +
    "body.bp-lock{overflow:hidden}" +
    "}" +
    "@media (prefers-reduced-motion:reduce){.bp,.bp.open{transition:none}}";

  var icons = {
    home:    '<svg viewBox="0 0 24 24"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9.5h13V10"/><path d="M10 19.5v-5h4v5"/></svg>',
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
    nav.innerHTML =
      '<a href="/" data-k="home">' + icons.home + "<span>Home</span></a>" +
      '<a href="/order" data-k="cart">' + icons.cart + '<span>Cart</span><i class="nav-cart-badge bn-badge">0</i></a>' +
      '<a href="/profile" data-k="profile" role="button" aria-haspopup="dialog">' + icons.profile + "<span>Profile</span></a>";
    document.body.appendChild(nav);

    var cur = { "index": "home", "order": "cart", "profile": "profile" }[page];
    if (cur) nav.querySelector('[data-k="' + cur + '"]').classList.add("on");
    if (window.VasistaCart) window.VasistaCart.updateBadge();   // cart-store keeps the count in sync

    /* ---------- profile menu ---------- */
    var panel = document.createElement("div");
    panel.className = "bp";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("aria-label", "Menu");
    panel.innerHTML =
      '<button type="button" class="bp-x" aria-label="Close menu">' + icons.close + "</button>" +
      '<p class="bp-who" id="bp-who" hidden></p>' +
      '<ul class="bp-list">' +
        '<li><a href="/profile">Profile &amp; Settings</a></li>' +
        '<li><a href="/order">Products</a></li>' +
        '<li><a href="/about">Why Vasista Food and Traders</a></li>' +
        '<li><a href="/contact">Contact</a></li>' +
        '<li><a href="https://wa.me/' + CFG.whatsapp + "?text=" + encodeURIComponent(CFG.waText) + '" target="_blank" rel="noopener">Order on WhatsApp</a></li>' +
        '<li><button type="button" class="bp-out" id="bp-logout">Log Out</button></li>' +
      "</ul>" +
      '<a class="bp-call" href="tel:' + CFG.phoneTel + '"><i>' + icons.phone + "</i><div><small>We are here to help you.</small><b>Call us at " + CFG.phoneShow + "</b></div></a>" +
      '<div class="bp-brand"><img src="logo.jpeg" alt=""><span>Vasista<small>FOOD &amp; TRADERS</small></span></div>';
    document.body.appendChild(panel);

    var profileBtn = nav.querySelector('[data-k="profile"]'), closeBtn = panel.querySelector(".bp-x");
    function open()  { panel.classList.add("open"); document.body.classList.add("bp-lock"); closeBtn.focus(); }
    function close() { panel.classList.remove("open"); document.body.classList.remove("bp-lock"); }
    profileBtn.addEventListener("click", function (e) { e.preventDefault(); open(); });
    closeBtn.addEventListener("click", close);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && panel.classList.contains("open")) { close(); profileBtn.focus(); } });
    window.addEventListener("resize", function () { if (window.innerWidth > 860) close(); });

    /* ---------- name + Log Out (your existing Firebase setup) ---------- */
    import(BASE + "firebase-config.js").then(function (m) {
      m.onAuthStateChanged(m.auth, function (user) {
        var who = panel.querySelector("#bp-who");
        who.textContent = user ? (user.displayName || user.email || user.phoneNumber || "") : "";
        who.hidden = !who.textContent;
      });
      panel.querySelector("#bp-logout").addEventListener("click", function () {
        m.signOut(m.auth).then(function () { location.href = "/login"; });
      });
    }).catch(function () {
      panel.querySelector("#bp-logout").addEventListener("click", function () { location.href = "/profile"; });
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

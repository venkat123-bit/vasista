// Floating FAQ chatbot. Answers common questions from the live product catalogue and
// the shop's policies; anything else is handed over to WhatsApp. No server needed.
(function () {
  var page = (location.pathname.split("/").pop() || "index").replace(/\.html$/, "");
  if (page === "login" || page === "signup") return;

  var BASE = document.currentScript ? document.currentScript.src.replace(/[^\/]*$/, "") : "assets/";
  var WA = "918341383888", PHONE = "8341383888", EMAIL = "vasistanaturals@gmail.com";

  var css =
    ".vc-fab{position:fixed;right:16px;bottom:18px;z-index:95;width:58px;height:58px;border-radius:50%;border:0;cursor:pointer;" +
    "background:#0e3d2b;color:#fff8e6;box-shadow:0 8px 22px rgba(14,61,43,.35);display:flex;align-items:center;justify-content:center}" +
    ".vc-fab svg{width:28px;height:28px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}" +
    ".vc-box{position:fixed;right:16px;bottom:88px;z-index:96;width:360px;max-width:calc(100vw - 24px);height:480px;max-height:calc(100vh - 120px);" +
    "background:#fffdf8;border:1px solid #e3d8b8;border-radius:18px;box-shadow:0 20px 50px rgba(14,61,43,.28);display:none;flex-direction:column;overflow:hidden;font-family:'Work Sans',sans-serif}" +
    ".vc-box.open{display:flex}" +
    ".vc-head{background:#0e3d2b;color:#fff8e6;padding:12px 14px;display:flex;align-items:center;justify-content:space-between;font-weight:600}" +
    ".vc-head small{display:block;font-weight:400;opacity:.8;font-size:.75rem}" +
    ".vc-x{background:none;border:0;color:inherit;font-size:1.5rem;cursor:pointer;line-height:1}" +
    ".vc-msgs{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px}" +
    ".vc-m{max-width:86%;padding:9px 12px;border-radius:14px;font-size:.92rem;line-height:1.45;white-space:pre-line;overflow-wrap:anywhere}" +
    ".vc-m.bot{background:#f7f1e3;color:#201d17;border-bottom-left-radius:4px;align-self:flex-start}" +
    ".vc-m.me{background:#0e3d2b;color:#fff8e6;border-bottom-right-radius:4px;align-self:flex-end}" +
    ".vc-m a{color:#0e3d2b;font-weight:600}" +
    ".vc-chips{display:flex;flex-wrap:wrap;gap:6px;padding:0 12px 8px}" +
    ".vc-chips button{background:#fff;border:1px solid #c9a34b;color:#0e3d2b;border-radius:999px;padding:6px 11px;font:600 .8rem 'Work Sans',sans-serif;cursor:pointer}" +
    ".vc-in{display:flex;gap:6px;padding:10px;border-top:1px solid #eae0c4}" +
    ".vc-in input{flex:1;min-width:0;font:inherit;font-size:16px;padding:9px 12px;border:1px solid #eae0c4;border-radius:999px;background:#fff}" +
    ".vc-in button{background:#0e3d2b;color:#fff8e6;border:0;border-radius:999px;padding:0 16px;font:600 .9rem 'Work Sans',sans-serif;cursor:pointer}" +
    "@media (max-width:860px){.vc-fab{bottom:86px;width:52px;height:52px}.vc-box{bottom:148px;height:calc(100vh - 230px)}}";
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  // product data comes from the shared catalogue (loaded on demand if the page doesn't have it)
  function withCatalog(cb) {
    if (window.VasistaCatalog) return cb();
    var s = document.createElement("script"); s.src = BASE + "catalog.js"; s.onload = cb; s.onerror = cb;
    document.head.appendChild(s);
  }
  function grouped() {
    var out = [], idx = {};
    ((window.VasistaCatalog && window.VasistaCatalog.products) || []).forEach(function (p) {
      if (!(p.name in idx)) { idx[p.name] = out.length; out.push({ name: p.name, cat: p.cat, sizes: [] }); }
      out[idx[p.name]].sizes.push(p.grams + " ₹" + p.price);
    });
    return out;
  }
  function line(g) { return "• " + g.name + ": " + g.sizes.join(", "); }

  var intents = [
    { k: ["hi", "hello", "hey", "namaste", "good morning", "good evening"], r: function () {
        return "Hi! 👋 I'm the Vasista assistant. Ask me about our snacks, prices, delivery or refunds."; } },
    { k: ["product", "menu", "price", "cost", "rate", "list", "available", "what do you sell", "snacks"], r: function () {
        var g = grouped(); if (!g.length) return "Please open the Products page to see everything with prices.";
        return "Our snacks (size ₹price):\n" + g.map(line).join("\n"); } },
    { k: ["discount", "offer", "coupon", "bulk", "cheaper"], r: function () {
        return "Quantity discount: 1 item is full price, and every extra item takes 3% off, up to 30% off. It's applied automatically in your cart."; } },
    { k: ["deliver", "shipping", "dispatch", "courier", "how long", "when will", "charges", "pincode"], r: function () {
        return "Orders are packed and dispatched within 1–3 working days, and delivery usually takes 1–5 working days depending on your location. Any delivery charge is confirmed before you pay. Full details: /shipping-policy"; } },
    { k: ["refund", "cancel", "return", "damaged", "wrong item", "missing", "replace"], r: function () {
        return "You can cancel for a full refund any time before dispatch. Food can't be returned, but if an item is wrong, missing, damaged or has a quality problem, tell us within 24 hours with photos on WhatsApp " + PHONE + " and we'll replace or refund it. Details: /refund-policy"; } },
    { k: ["order", "buy", "purchase", "how to", "checkout", "place"], r: function () {
        return "1) Open Products and tap Add on the size you want.\n2) Go to Cart, enter your delivery details.\n3) Send the order to us on WhatsApp and we'll confirm it."; } },
    { k: ["pay", "upi", "cod", "cash", "card", "gpay", "phonepe"], r: function () {
        return "We confirm payment details with you on WhatsApp/phone when your order is confirmed. Message us on " + PHONE + " and we'll guide you."; } },
    { k: ["contact", "phone", "call", "whatsapp", "email", "address", "location", "where are you", "number"], r: function () {
        return "📞 " + PHONE + " (call / WhatsApp)\n✉️ " + EMAIL + "\n📍 AS Rao Nagar, Sainikpuri, Secunderabad, Telangana – 500094"; } },
    { k: ["allerg", "nut", "soy", "sesame", "gluten"], r: function () {
        return "Our products may contain or be made in facilities that handle nuts, millets, soy, sesame and other allergens. Please read the label on your pack, or message us before ordering if you have an allergy."; } },
    { k: ["preservative", "fresh", "shelf", "expiry", "best before", "healthy", "oil", "fried", "baked"], r: function () {
        return "We make small batches with no preservatives, so packs reach you fresh. The best-before date is printed on every pack. For specifics about a product, message us on WhatsApp " + PHONE + "."; } },
    { k: ["review", "rating", "feedback"], r: function () {
        return "You can read and write reviews in the “What our customers say” section on the Home page (log in to post one)."; } },
    { k: ["thank", "thanks", "ok thanks"], r: function () { return "You're welcome! 😊 Anything else I can help with?"; } }
  ];

  function norm(s) { return " " + s.toLowerCase().replace(/[^a-z0-9₹ ]+/g, " ").replace(/\s+/g, " ") + " "; }
  function answer(text) {
    var t = norm(text), g = grouped(), i;
    // a specific product name?
    for (i = 0; i < g.length; i++) {
      var n = norm(g[i].name.replace(/\(.*?\)/g, "")).trim();
      if (n && t.indexOf(n) >= 0) return g[i].name + " — " + g[i].sizes.join(", ") + ".\nTap Products to add it to your cart.";
    }
    var best = null, bestScore = 0;
    intents.forEach(function (it) {
      var sc = 0;
      it.k.forEach(function (w) {
        var hit = w.length <= 3 ? t.indexOf(" " + w + " ") >= 0 : t.indexOf(w) >= 0;
        if (hit) sc += w.length;
      });
      if (sc > bestScore) { bestScore = sc; best = it; }
    });
    return best ? best.r() : null;
  }

  var fab = document.createElement("button");
  fab.className = "vc-fab"; fab.setAttribute("aria-label", "Chat with us");
  fab.innerHTML = '<svg viewBox="0 0 24 24"><path d="M21 12a8 8 0 0 1-11.7 7L4 20l1.1-4.4A8 8 0 1 1 21 12Z"/></svg>';
  var box = document.createElement("div");
  box.className = "vc-box"; box.setAttribute("role", "dialog"); box.setAttribute("aria-label", "Vasista chat");
  box.innerHTML =
    '<div class="vc-head"><div>Vasista Assistant<small>Ask about snacks, prices, delivery</small></div><button class="vc-x" aria-label="Close">×</button></div>' +
    '<div class="vc-msgs" id="vc-msgs"></div>' +
    '<div class="vc-chips" id="vc-chips"></div>' +
    '<form class="vc-in" id="vc-form"><input id="vc-input" type="text" placeholder="Type your question…" autocomplete="off" maxlength="200"><button type="submit">Send</button></form>';
  document.body.appendChild(fab); document.body.appendChild(box);

  var msgs = box.querySelector("#vc-msgs"), input = box.querySelector("#vc-input");
  function linkify(el, text) {
    // plain text + clickable /policy links, without ever inserting user text as HTML
    text.split(/(\/(?:shipping-policy|refund-policy))/).forEach(function (part) {
      if (/^\/(shipping|refund)-policy$/.test(part)) {
        var a = document.createElement("a"); a.href = part; a.textContent = part.slice(1).replace("-", " ");
        el.appendChild(a);
      } else el.appendChild(document.createTextNode(part));
    });
  }
  function add(text, who) {
    var d = document.createElement("div"); d.className = "vc-m " + who;
    if (who === "bot") linkify(d, text); else d.textContent = text;
    msgs.appendChild(d); msgs.scrollTop = msgs.scrollHeight; return d;
  }
  function waHandoff(q) {
    var d = add("I'm not sure about that one. Our team can help directly — tap below to chat on WhatsApp.", "bot");
    var a = document.createElement("a");
    a.href = "https://wa.me/" + WA + "?text=" + encodeURIComponent("Hi, I have a question: " + q);
    a.target = "_blank"; a.rel = "noopener"; a.textContent = "\nChat on WhatsApp →";
    d.appendChild(a);
  }
  function ask(q) {
    q = q.trim(); if (!q) return;
    add(q, "me");
    withCatalog(function () {
      var a = answer(q);
      setTimeout(function () { if (a) add(a, "bot"); else waHandoff(q); }, 250);
    });
  }

  var chips = box.querySelector("#vc-chips");
  ["Products & prices", "Delivery", "Refund / cancel", "How to order", "Contact"].forEach(function (c) {
    var b = document.createElement("button"); b.type = "button"; b.textContent = c;
    b.onclick = function () { ask(c === "Refund / cancel" ? "refund cancel" : c === "Products & prices" ? "products price" : c); };
    chips.appendChild(b);
  });

  var greeted = false;
  function toggle(open) {
    box.classList.toggle("open", open);
    if (open && !greeted) { greeted = true; add("Hi! 👋 I'm the Vasista assistant. What would you like to know?", "bot"); }
    if (open) setTimeout(function () { input.focus(); }, 50);
  }
  fab.onclick = function () { toggle(!box.classList.contains("open")); };
  box.querySelector(".vc-x").onclick = function () { toggle(false); };
  box.querySelector("#vc-form").onsubmit = function (e) { e.preventDefault(); var v = input.value; input.value = ""; ask(v); };
})();

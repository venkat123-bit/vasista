// Products page: browse, filter, sort, wishlist, add to cart. The cart itself (review,
// delivery details, sending the order) lives on /cart — see cart.js.
(function () {
  var C = window.VasistaCatalog;
  var products = C.products, rupee = C.rupee, unitPriceFor = C.unitPriceFor;

  /* =====================================================================
     EDIT HERE
     ===================================================================== */
  // Cart total (in rupees) above which delivery is free. Set to 0 to hide the
  // "Add ₹X more for FREE Delivery" message and the free-delivery hero slide.
  var FREE_DELIVERY_MIN = 400;

  // Per-product extras, keyed by the EXACT product name used in catalog.js.
  //   badge:  small label on the photo, e.g. "Bestseller", "New Arrival", "Healthy Choice"
  //   tags:   which quick-filter pills the product appears under:
  //           "best" (Best Sellers) · "healthy" (Healthy Picks) · "offer" (Offers) · "new" (New Arrivals)
  //   points: up to two short highlights shown at the bottom of the card
  var PRODUCT_META = {
    "12X Crunch":         { badge: "Bestseller",  tags: ["best"],        points: ["High Protein", "Multi-Grain Goodness"] },
    "Multi Millet Chips": { badge: "New Arrival", tags: ["new", "healthy"], points: ["Gluten Free", "Rich in Millets"] }
  };
  /* ===================================================================== */

  var grid = document.getElementById("item-grid");
  var qty = new Array(products.length).fill(0);
  var syncing = false;

  var ICON = {
    cart:  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 3.5h2.6l2.3 11.2h10.2l2-8H6"/><circle cx="9.3" cy="19" r="1.4"/><circle cx="16.8" cy="19" r="1.4"/></svg>',
    heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-9.2-9.3C1.7 8 3.4 5 6.6 5c2 0 3.5 1.1 5.4 3.2C13.9 6.1 15.4 5 17.4 5c3.2 0 4.9 3 3.8 6.2-1.7 4.7-9.2 9.3-9.2 9.3z"/></svg>',
    leaf:  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19c0-8 5-14 14-14 0 9-6 14-14 14z"/><path d="M5 19l8-8"/></svg>',
    crown: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8l4 4 4-6 4 6 4-4-1.5 10h-13z"/></svg>',
    grid:  '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6"/></svg>'
  };

  var placeholderIcon = '<div class="card-img-wrap placeholder"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 20V10l8-6 8 6v10"/><path d="M9 20v-6h6v6"/></svg></div>';
  var zoomHint = '<span class="card-zoom-hint"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12Z"/><circle cx="12" cy="12" r="3"/></svg></span>';

  /* ---------- wishlist (this device only) ---------- */
  function readWish() {
    try { var w = JSON.parse(localStorage.getItem("vasista-wishlist") || "[]"); return Array.isArray(w) ? w : []; }
    catch (e) { return []; }
  }
  function writeWish() {
    try { localStorage.setItem("vasista-wishlist", JSON.stringify(wishlist)); } catch (e) {}
  }
  var wishlist = readWish();

  /* ---------- cart <-> storage ---------- */
  function loadFromStorage() {
    qty.fill(0);
    if (!window.VasistaCart) return;
    var saved = window.VasistaCart.read();
    products.forEach(function (p, i) {
      var m = saved.find(function (it) { return it.name === p.name && it.grams === p.grams; });
      if (m && m.qty > 0) qty[i] = m.qty;
    });
  }

  function saveToStorage() {
    if (!window.VasistaCart) return;
    var items = [];
    products.forEach(function (p, i) {
      if (qty[i] > 0) {
        items.push({ name: p.name, grams: p.grams, price: p.price, unit: unitPriceFor(p.price, qty[i]).unit, qty: qty[i] });
      }
    });
    syncing = true;
    window.VasistaCart.write(items);
    syncing = false;
  }

  function totals() {
    var total = 0, count = 0;
    products.forEach(function (p, i) {
      if (qty[i] > 0) { count += qty[i]; total += qty[i] * unitPriceFor(p.price, qty[i]).unit; }
    });
    return { total: total, count: count };
  }

  /* ---------- group same-name products into one card with size pills ---------- */
  var groups = [], groupMap = {};
  products.forEach(function (p, i) {
    if (!(p.name in groupMap)) {
      groupMap[p.name] = groups.length;
      groups.push({
        name: p.name, cat: p.cat, img: p.img,
        imgs: p.imgs || (p.img ? [p.img] : []),
        meta: PRODUCT_META[p.name] || {},
        variants: [i]
      });
    } else {
      groups[groupMap[p.name]].variants.push(i);
    }
  });

  function priceHTML(i) {
    var p = products[i], u = unitPriceFor(p.price, qty[i]);
    if (u.pct > 0) {
      return '<span class="price-old">' + rupee(p.price) + '</span>' +
             '<span class="price-now">' + rupee(u.unit) + '</span>' +
             '<span class="price-off">' + u.pct + '% off</span>';
    }
    return '<span class="price-now">' + rupee(p.price) + '</span>';
  }

  function footerHTML(i) {
    var control = qty[i] > 0
      ? '<div class="qty-stepper">' +
          '<button type="button" aria-label="Decrease quantity" data-action="dec" data-i="' + i + '">\u2212</button>' +
          '<span>' + qty[i] + '</span>' +
          '<button type="button" aria-label="Increase quantity" data-action="inc" data-i="' + i + '">+</button>' +
        '</div>'
      : '<button type="button" class="add-btn" data-action="inc" data-i="' + i + '">' + ICON.cart + '<span>Add to Cart</span></button>';
    return '<div class="price-cell">' + priceHTML(i) + '</div>' + control;
  }

  function refreshCard(card) {
    var i = Number(card.dataset.active);
    var g = groups[Number(card.dataset.gi)];
    card.querySelector(".card-footer").innerHTML = footerHTML(i);
    card.querySelectorAll(".size-pill").forEach(function (pill) {
      var idx = Number(pill.dataset.sizeI), base = products[idx].grams;
      pill.textContent = qty[idx] > 0 ? base + " (" + qty[idx] + ")" : base;
      pill.classList.toggle("has-qty", qty[idx] > 0);
    });
    card.classList.toggle("in-cart", g.variants.some(function (v) { return qty[v] > 0; }));

    // photo badge: a live "x% OFF" wins over the product's own label
    var badge = card.querySelector(".card-badge");
    if (!badge) return;
    var u = unitPriceFor(products[i].price, qty[i]);
    if (u.pct > 0) {
      badge.hidden = false; badge.className = "card-badge off"; badge.textContent = u.pct + "% OFF";
    } else if (g.meta.badge) {
      badge.hidden = false; badge.className = "card-badge";
      badge.innerHTML = (g.meta.badge === "Bestseller" ? ICON.crown : ICON.leaf) + "<span>" + g.meta.badge + "</span>";
    } else {
      badge.hidden = true;
    }
  }

  function refreshAllCards() {
    grid.querySelectorAll(".product-card").forEach(refreshCard);
  }

  loadFromStorage();

  groups.forEach(function (g, gi) {
    var card = document.createElement("div");
    card.className = "product-card";
    card.dataset.cat = g.cat;
    card.dataset.name = g.name.toLowerCase();
    card.dataset.tags = (g.meta.tags || []).join(" ");
    card.dataset.gi = gi;
    card.dataset.active = g.variants[0];

    var imgBlock = g.img
      ? '<button type="button" class="card-img-wrap" data-img="' + g.img + '" data-imgs="' + g.imgs.join("|") + '" data-name="' + g.name + '" aria-label="View image of ' + g.name + '"><img src="' + g.img + '" alt="' + g.name + '" loading="lazy">' + (g.imgs.length > 1 ? '<span class="card-multi">' + g.imgs.length + ' photos</span>' : '') + zoomHint + '</button>'
      : placeholderIcon;

    var wished = wishlist.indexOf(g.name) > -1;
    var media = '<div class="card-media">' + imgBlock +
      '<span class="card-badge" hidden></span>' +
      '<button type="button" class="wish-btn" data-name="' + g.name + '" aria-pressed="' + wished + '" aria-label="' + (wished ? "Remove from wishlist" : "Add to wishlist") + '">' + ICON.heart + '</button>' +
      '</div>';

    var sizeMarkup = g.variants.length > 1
      ? '<div class="size-pills">' + g.variants.map(function (idx, vi) {
          return '<button type="button" class="size-pill' + (vi === 0 ? " active" : "") + '" data-size-i="' + idx + '">' + products[idx].grams + '</button>';
        }).join("") + '</div>'
      : '<p class="card-grams">' + products[g.variants[0]].grams + '</p>';

    var points = (g.meta.points && g.meta.points.length)
      ? '<ul class="card-points">' + g.meta.points.slice(0, 2).map(function (t) { return '<li>' + ICON.leaf + '<span>' + t + '</span></li>'; }).join("") + '</ul>'
      : '';

    card.innerHTML = media +
      '<div class="card-body"><p class="card-name">' + g.name + '</p>' + sizeMarkup +
      '<div class="card-footer"></div>' + points + '</div>';
    grid.appendChild(card);
    refreshCard(card);
  });

  grid.addEventListener("click", function (e) {
    var wish = e.target.closest(".wish-btn");
    if (wish) {
      var n = wish.dataset.name, at = wishlist.indexOf(n), on = at === -1;
      if (on) wishlist.push(n); else wishlist.splice(at, 1);
      wish.setAttribute("aria-pressed", String(on));
      wish.setAttribute("aria-label", on ? "Remove from wishlist" : "Add to wishlist");
      writeWish();
      return;
    }

    var viewBtn = e.target.closest(".card-img-wrap[data-img]");
    if (viewBtn && e.target.closest(".card-zoom-hint")) { openLightbox((viewBtn.dataset.imgs || viewBtn.dataset.img).split("|"), viewBtn.dataset.name); return; }
    if (viewBtn) { location.href = "product.html?name=" + encodeURIComponent(viewBtn.dataset.name); return; }
    var nameEl = e.target.closest(".card-name");
    if (nameEl) { location.href = "product.html?name=" + encodeURIComponent(nameEl.textContent.trim()); return; }

    var sizeBtn = e.target.closest(".size-pill");
    if (sizeBtn) {
      var card = sizeBtn.closest(".product-card");
      card.dataset.active = sizeBtn.dataset.sizeI;
      card.querySelectorAll(".size-pill").forEach(function (b) { b.classList.toggle("active", b === sizeBtn); });
      refreshCard(card);
      return;
    }

    var btn = e.target.closest("button[data-action]");
    if (!btn) return;
    var i = Number(btn.dataset.i);
    if (btn.dataset.action === "inc") qty[i]++;
    if (btn.dataset.action === "dec") qty[i] = Math.max(0, qty[i] - 1);
    refreshCard(btn.closest(".product-card"));
    saveToStorage();
    updateBar(true);
  });

  /* ---------- sticky "View cart" bar ---------- */
  var bar = document.getElementById("cart-bar");
  var barCount = document.getElementById("cart-bar-count");
  var barTotal = document.getElementById("cart-bar-total");
  var barShip = document.getElementById("cart-bar-ship");
  var ship1 = document.getElementById("cb-ship-1");
  var ship2 = document.getElementById("cb-ship-2");

  function updateBar(bump) {
    var t = totals();
    barCount.textContent = t.count + (t.count === 1 ? " Item" : " Items");
    barTotal.textContent = rupee(t.total);
    if (FREE_DELIVERY_MIN > 0) {
      barShip.hidden = false;
      var left = FREE_DELIVERY_MIN - t.total;
      ship1.textContent = left > 0 ? "Add " + rupee(left) + " more for" : "You've unlocked";
      ship2.textContent = "FREE Delivery";
    } else {
      barShip.hidden = true;
    }
    bar.classList.toggle("show", t.count > 0);
    document.body.classList.toggle("has-cart-bar", t.count > 0);
    if (bump && t.count > 0) {
      bar.classList.remove("bump"); void bar.offsetWidth; bar.classList.add("bump");
    }
  }

  // Cart changed elsewhere (e.g. removed from the desktop dropdown): re-sync this page.
  document.addEventListener("vasista-cart-change", function () {
    if (syncing) return;
    loadFromStorage(); refreshAllCards(); updateBar(false);
  });
  window.addEventListener("pageshow", function (e) {
    if (e.persisted) { loadFromStorage(); refreshAllCards(); updateBar(false); }
  });

  /* ---------- image lightbox ---------- */
  var lightbox = document.getElementById("lightbox");
  var lightboxCaption = document.getElementById("lightbox-caption");
  var lbTrack = document.getElementById("lb-track"), lbDots = document.getElementById("lb-dots");

  function openLightbox(srcs, name) {
    srcs = [].concat(srcs);
    lbTrack.innerHTML = srcs.map(function (s, i) {
      return '<div class="lb-slide"><img src="' + s + '" alt="' + (name || "") + ' photo ' + (i + 1) + '"></div>';
    }).join("");
    lbDots.innerHTML = srcs.length > 1 ? srcs.map(function (_, i) { return "<i" + (i ? "" : ' class="on"') + "></i>"; }).join("") : "";
    lightbox.classList.toggle("multi", srcs.length > 1);
    lbTrack.scrollLeft = 0;
    lightboxCaption.textContent = name || "";
    lightbox.classList.add("open"); document.body.style.overflow = "hidden";
  }
  function lbMove(dir) { lbTrack.scrollBy({ left: dir * lbTrack.clientWidth, behavior: "smooth" }); }
  lbTrack.addEventListener("scroll", function () {
    var n = Math.round(lbTrack.scrollLeft / (lbTrack.clientWidth || 1));
    [].forEach.call(lbDots.children, function (d, i) { d.classList.toggle("on", i === n); });
  });
  document.getElementById("lb-prev").addEventListener("click", function () { lbMove(-1); });
  document.getElementById("lb-next").addEventListener("click", function () { lbMove(1); });
  function closeLightbox() { lightbox.classList.remove("open"); document.body.style.overflow = ""; }
  document.getElementById("lightbox-close").addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", function (e) { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeLightbox();
    if (lightbox.classList.contains("open")) { if (e.key === "ArrowRight") lbMove(1); if (e.key === "ArrowLeft") lbMove(-1); }
  });

  /* ---------- category chips (with a photo from each category) ---------- */
  var tabs = document.getElementById("tabs");
  tabs.querySelectorAll(".tab-btn").forEach(function (b) {
    var cat = b.dataset.cat, label = b.textContent.trim().replace(/&/g, "&amp;"), ic;
    if (cat === "all") {
      ic = ICON.grid;
    } else {
      var g = groups.filter(function (x) { return x.cat === cat && x.img; })[0];
      ic = g ? '<img src="' + g.img + '" alt="" loading="lazy">' : ICON.leaf;
    }
    b.innerHTML = '<span class="tab-ic">' + ic + '</span><span class="tab-label">' + label + '</span>';
  });

  /* ---------- filters: category + search + quick pills ---------- */
  var quickRow = document.getElementById("quick-row");
  var searchInput = document.getElementById("product-search");
  var emptyMsg = document.getElementById("no-results");
  var currentCat = "all", currentSearch = "", currentQuick = "";

  function applyFilters() {
    var shown = 0;
    grid.querySelectorAll(".product-card").forEach(function (card) {
      var okCat = currentCat === "all" || card.dataset.cat === currentCat;
      var okSearch = !currentSearch || (card.dataset.name || "").includes(currentSearch);
      var okQuick = !currentQuick || (" " + card.dataset.tags + " ").indexOf(" " + currentQuick + " ") > -1;
      var show = okCat && okSearch && okQuick;
      card.classList.toggle("hidden-card", !show);
      if (show) shown++;
    });
    if (emptyMsg) emptyMsg.hidden = shown > 0;
  }

  tabs.addEventListener("click", function (e) {
    var btn = e.target.closest(".tab-btn");
    if (!btn) return;
    tabs.querySelectorAll(".tab-btn").forEach(function (b) {
      b.classList.remove("active"); b.setAttribute("aria-selected", "false");
    });
    btn.classList.add("active"); btn.setAttribute("aria-selected", "true");
    currentCat = btn.dataset.cat;
    applyFilters();
    btn.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  });

  function setQuick(key) {
    currentQuick = key || "";
    quickRow.querySelectorAll(".quick-btn").forEach(function (b) {
      var on = b.dataset.quick === currentQuick;
      b.classList.toggle("active", on); b.setAttribute("aria-pressed", String(on));
    });
    applyFilters();
  }
  quickRow.querySelectorAll(".quick-btn").forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
  quickRow.addEventListener("click", function (e) {
    var btn = e.target.closest(".quick-btn");
    if (!btn) return;
    setQuick(currentQuick === btn.dataset.quick ? "" : btn.dataset.quick);   // tap again to clear
  });

  if (searchInput) {
    searchInput.addEventListener("input", function () {
      currentSearch = searchInput.value.trim().toLowerCase();
      applyFilters();
    });
  }

  var qParam = new URLSearchParams(location.search).get("q");
  if (searchInput && qParam) {
    searchInput.value = qParam;
    currentSearch = qParam.trim().toLowerCase();
    applyFilters();
  }

  /* ---------- sort menu ---------- */
  var sortBtn = document.getElementById("sort-btn"), sortMenu = document.getElementById("sort-menu");
  var sortKey = "default";

  function groupMin(g) {
    return Math.min.apply(null, g.variants.map(function (v) { return products[v].price; }));
  }
  function applySort() {
    var cards = [].slice.call(grid.querySelectorAll(".product-card"));
    cards.sort(function (a, b) {
      var ga = groups[a.dataset.gi], gb = groups[b.dataset.gi], d = 0;
      if (sortKey === "low") d = groupMin(ga) - groupMin(gb);
      else if (sortKey === "high") d = groupMin(gb) - groupMin(ga);
      else if (sortKey === "az") d = ga.name.localeCompare(gb.name);
      return d || (Number(a.dataset.gi) - Number(b.dataset.gi));
    });
    cards.forEach(function (c) { grid.appendChild(c); });
  }
  function toggleSort(open) {
    sortMenu.hidden = !open;
    sortBtn.setAttribute("aria-expanded", String(open));
  }
  sortBtn.addEventListener("click", function (e) { e.stopPropagation(); toggleSort(sortMenu.hidden); });
  sortMenu.addEventListener("click", function (e) {
    var b = e.target.closest("button[data-sort]");
    if (!b) return;
    sortKey = b.dataset.sort;
    sortMenu.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-checked", String(x === b)); });
    applySort();
    toggleSort(false);
  });
  document.addEventListener("click", function (e) { if (!sortMenu.hidden && !e.target.closest(".sort-wrap")) toggleSort(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !sortMenu.hidden) { toggleSort(false); sortBtn.focus(); } });

  /* ---------- hero carousel ---------- */
  (function () {
    var track = document.getElementById("hero-track"), dotsEl = document.getElementById("hero-dots");
    if (!track || !dotsEl) return;

    var freeSlide = document.getElementById("hero-free");
    if (freeSlide && !FREE_DELIVERY_MIN) freeSlide.remove();
    [].forEach.call(document.querySelectorAll("[data-free-min]"), function (el) { el.textContent = rupee(FREE_DELIVERY_MIN); });

    var n = track.children.length, cur = 0, timer = null, paused = false;
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    dotsEl.innerHTML = Array.prototype.map.call(track.children, function (_, i) {
      return '<button type="button" aria-label="Slide ' + (i + 1) + '"' + (i === 0 ? ' class="on"' : "") + "></button>";
    }).join("");
    if (n < 2) dotsEl.hidden = true;

    function go(i) {
      cur = (i + n) % n;
      track.scrollTo({ left: cur * track.clientWidth, behavior: reduce ? "auto" : "smooth" });
    }
    track.addEventListener("scroll", function () {
      var k = Math.round(track.scrollLeft / (track.clientWidth || 1));
      if (k !== cur || !dotsEl.children[k].classList.contains("on")) {
        cur = k;
        [].forEach.call(dotsEl.children, function (d, j) { d.classList.toggle("on", j === k); });
      }
    }, { passive: true });
    dotsEl.addEventListener("click", function (e) {
      var i = [].indexOf.call(dotsEl.children, e.target.closest("button"));
      if (i > -1) go(i);
    });

    function pause(ms) { paused = true; clearTimeout(pause.t); pause.t = setTimeout(function () { paused = false; }, ms); }
    track.addEventListener("pointerdown", function () { pause(9000); });
    track.addEventListener("mouseenter", function () { paused = true; });
    track.addEventListener("mouseleave", function () { paused = false; });
    if (!reduce && n > 1) {
      timer = setInterval(function () { if (!paused && !document.hidden) go(cur + 1); }, 5000);
    }

    var bestBtn = document.getElementById("hero-best");
    if (bestBtn) bestBtn.addEventListener("click", function () {
      setQuick("best");
      var q = document.getElementById("quick-row");
      if (q) q.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  })();

  // "Show all products" button in the no-results message
  var clearBtn = document.getElementById("clear-filters");
  if (clearBtn) clearBtn.addEventListener("click", function () {
    if (searchInput) searchInput.value = "";
    currentSearch = "";
    setQuick("");                       // also re-applies the filters
    var all = tabs.querySelector('.tab-btn[data-cat="all"]');
    if (all) all.click();
  });

  updateBar(false);
})();

// Products page: browse, filter, add to cart. The cart itself (review, delivery
// details, sending the order) lives on /cart — see cart.js.
(function () {
  var C = window.VasistaCatalog;
  var products = C.products, rupee = C.rupee, unitPriceFor = C.unitPriceFor;

  var grid = document.getElementById("item-grid");
  var qty = new Array(products.length).fill(0);
  var syncing = false;

  var placeholderIcon = '<div class="card-img-wrap placeholder"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 20V10l8-6 8 6v10"/><path d="M9 20v-6h6v6"/></svg></div>';
  var zoomHint = '<span class="card-zoom-hint"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12Z"/><circle cx="12" cy="12" r="3"/></svg></span>';

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
      groups.push({ name: p.name, cat: p.cat, img: p.img, variants: [i] });
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
      : '<button type="button" class="add-btn" data-action="inc" data-i="' + i + '">Add</button>';
    return '<div class="price-cell">' + priceHTML(i) + '</div>' + control;
  }

  function refreshCard(card) {
    var i = Number(card.dataset.active);
    card.querySelector(".card-footer").innerHTML = footerHTML(i);
    card.querySelectorAll(".size-pill").forEach(function (pill) {
      var idx = Number(pill.dataset.sizeI), base = products[idx].grams;
      pill.textContent = qty[idx] > 0 ? base + " (" + qty[idx] + ")" : base;
      pill.classList.toggle("has-qty", qty[idx] > 0);
    });
    card.classList.toggle("in-cart", card.dataset.gi && groups[card.dataset.gi].variants.some(function (v) { return qty[v] > 0; }));
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
    card.dataset.gi = gi;
    card.dataset.active = g.variants[0];

    var imgBlock = g.img
      ? '<button type="button" class="card-img-wrap" data-img="' + g.img + '" data-name="' + g.name + '" aria-label="View image of ' + g.name + '"><img src="' + g.img + '" alt="' + g.name + '" loading="lazy">' + zoomHint + '</button>'
      : placeholderIcon;

    var sizeMarkup = g.variants.length > 1
      ? '<div class="size-pills">' + g.variants.map(function (idx, vi) {
          return '<button type="button" class="size-pill' + (vi === 0 ? " active" : "") + '" data-size-i="' + idx + '">' + products[idx].grams + '</button>';
        }).join("") + '</div>'
      : '<p class="card-grams">' + products[g.variants[0]].grams + '</p>';

    card.innerHTML = imgBlock +
      '<div class="card-body"><p class="card-name">' + g.name + '</p>' + sizeMarkup +
      '<div class="card-footer"></div></div>';
    grid.appendChild(card);
    refreshCard(card);
  });

  grid.addEventListener("click", function (e) {
    var viewBtn = e.target.closest(".card-img-wrap[data-img]");
    if (viewBtn) { openLightbox(viewBtn.dataset.img, viewBtn.dataset.name); return; }

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

  function updateBar(bump) {
    var t = totals();
    barCount.textContent = t.count + (t.count === 1 ? " item" : " items");
    barTotal.textContent = rupee(t.total);
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
  var lightboxImg = document.getElementById("lightbox-img");
  var lightboxCaption = document.getElementById("lightbox-caption");

  function openLightbox(src, name) {
    lightboxImg.src = src; lightboxImg.alt = name || "";
    lightboxCaption.textContent = name || "";
    lightbox.classList.add("open"); document.body.style.overflow = "hidden";
  }
  function closeLightbox() { lightbox.classList.remove("open"); document.body.style.overflow = ""; }
  document.getElementById("lightbox-close").addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", function (e) { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeLightbox(); });

  /* ---------- category tabs + search ---------- */
  var tabs = document.getElementById("tabs");
  var searchInput = document.getElementById("product-search");
  var emptyMsg = document.getElementById("no-results");
  var currentCat = "all", currentSearch = "";

  function applyFilters() {
    var shown = 0;
    grid.querySelectorAll(".product-card").forEach(function (card) {
      var okCat = currentCat === "all" || card.dataset.cat === currentCat;
      var okSearch = !currentSearch || (card.dataset.name || "").includes(currentSearch);
      var show = okCat && okSearch;
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

  updateBar(false);
})();

// "Show all products" button in the no-results message
(function () {
  var btn = document.getElementById("clear-filters");
  if (!btn) return;
  btn.addEventListener("click", function () {
    var input = document.getElementById("product-search");
    if (input) { input.value = ""; input.dispatchEvent(new Event("input")); }
    var all = document.querySelector('.tab-btn[data-cat="all"]');
    if (all) all.click();
  });
})();

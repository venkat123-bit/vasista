// Product details page: /product.html?name=<product name>
// Shows the photo gallery, sizes + price, add to cart, details, reviews and related items.
(function () {
  var C = window.VasistaCatalog, INFO = window.VasistaProductInfo || {};
  var root = document.getElementById("pd-root");
  var WA = "918341383888";
  var name = new URLSearchParams(location.search).get("name") || "";
  var variants = C.products.filter(function (p) { return p.name === name; });

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function link(n) { return "product.html?name=" + encodeURIComponent(n); }

  if (!variants.length) {
    root.innerHTML = '<div class="pd-missing"><h1>Product not found</h1><p>We couldn\'t find that item.</p>' +
      '<a class="pd-btn" href="/order">Back to Shop</a></div>';
    return;
  }

  var first = variants[0];
  var imgs = first.imgs || (first.img ? [first.img] : []);
  var info = INFO[name] || {};
  var cur = 0, qty = 1;
  var catLabel = { crunch: "Crunch", chips: "Chips", mixes: "Mixes", nuts: "Nuts & Beans", sweets: "Sweets" }[first.cat] || "Snacks";
  var maxOff = C.discountPercent(100), stepOff = C.discountPercent(2);

  document.title = name + " — Vasista Food and Traders";

  /* ---------- gallery ---------- */
  var gallery = imgs.length
    ? '<div class="pd-stage"><div class="pd-track" id="pd-track">' +
        imgs.map(function (s, i) { return '<div class="pd-slide"><img src="' + s + '" alt="' + esc(name) + ' photo ' + (i + 1) + '"' + (i ? ' loading="lazy"' : '') + '></div>'; }).join("") +
      '</div>' +
      (imgs.length > 1 ? '<button type="button" class="pd-arrow pd-prev" id="pd-prev" aria-label="Previous photo">&#8249;</button><button type="button" class="pd-arrow pd-next" id="pd-next" aria-label="Next photo">&#8250;</button>' : '') +
      '</div>' +
      (imgs.length > 1 ? '<div class="pd-thumbs" id="pd-thumbs">' + imgs.map(function (s, i) {
        return '<button type="button" class="pd-thumb' + (i ? '' : ' on') + '" data-i="' + i + '" aria-label="Photo ' + (i + 1) + '"><img src="' + s + '" alt=""></button>';
      }).join("") + '</div>' : '')
    : '<div class="pd-stage pd-noimg">No photo yet</div>';

  /* ---------- details ---------- */
  var badges = (info.badges || []).map(function (b) { return '<span class="pd-chip">' + esc(b) + '</span>'; }).join("");
  var sizeHTML = variants.length > 1
    ? '<div class="pd-sizes" id="pd-sizes">' + variants.map(function (v, i) {
        return '<button type="button" class="size-pill' + (i ? '' : ' active') + '" data-i="' + i + '">' + esc(v.grams) + '</button>';
      }).join("") + '</div>'
    : '<p class="pd-onesize">' + esc(first.grams) + '</p>';

  var about = info.desc
    ? '<section class="pd-sec"><h2>About this snack</h2><p>' + esc(info.desc) + '</p>' + (badges ? '<div class="pd-chips">' + badges + '</div>' : '') + '</section>' : '';
  var ingredients = info.ingredients
    ? '<section class="pd-sec"><h2>Ingredients</h2><ul class="pd-ing">' + info.ingredients.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join("") + '</ul></section>' : '';
  var nutrition = info.nutrition
    ? '<section class="pd-sec"><h2>Nutrition facts <small>per 100 g (approximate)</small></h2><table class="pd-nut"><tbody>' +
      info.nutrition.map(function (r) { return '<tr><th>' + esc(r[0]) + '</th><td>' + esc(r[1]) + '</td></tr>'; }).join("") +
      '</tbody></table></section>' : '';
  var bb = info.bestBefore
    ? '<p class="pd-bb">Best before <b>' + esc(info.bestBefore) + '</b> from packing.</p>' : '';

  // other products to browse (next few distinct names)
  var names = [];
  C.products.forEach(function (p) { if (names.indexOf(p.name) < 0) names.push(p.name); });
  var at = names.indexOf(name), more = [];
  for (var k = 1; k < names.length && more.length < 4; k++) more.push(names[(at + k) % names.length]);
  var related = more.map(function (n) {
    var vs = C.products.filter(function (p) { return p.name === n; });
    var min = Math.min.apply(null, vs.map(function (p) { return p.price; }));
    return '<a class="pd-rel" href="' + link(n) + '">' +
      (vs[0].img ? '<img src="' + vs[0].img + '" alt="' + esc(n) + '" loading="lazy">' : '') +
      '<b>' + esc(n) + '</b><small>From ' + C.rupee(min) + '</small></a>';
  }).join("");

  root.innerHTML =
    '<nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/order">Shop</a><span>/</span><span aria-current="page">' + esc(name) + '</span></nav>' +
    '<div class="pd-grid">' +
      '<div class="pd-gal">' + gallery + '</div>' +
      '<div class="pd-info">' +
        '<p class="pd-cat">' + esc(catLabel) + '</p>' +
        '<h1>' + esc(name) + '</h1>' +
        (info.tagline ? '<p class="pd-tagline">' + esc(info.tagline) + '</p>' : '') +
        '<p class="pd-label">Pack size</p>' + sizeHTML +
        '<div class="pd-price"><span id="pd-price"></span></div>' +
        '<p class="pd-save">Buy more, save more: each extra pack takes ' + stepOff + '% off, up to ' + maxOff + '% off.</p>' +
        '<div class="pd-buy">' +
          '<div class="qty-stepper"><button type="button" id="pd-dec" aria-label="Decrease quantity">&minus;</button><span id="pd-qty">1</span><button type="button" id="pd-inc" aria-label="Increase quantity">+</button></div>' +
          '<button type="button" class="pd-btn pd-add" id="pd-add">Add to cart</button>' +
        '</div>' +
        '<p class="pd-incart" id="pd-incart"></p>' +
        '<div class="pd-actions">' +
          '<a class="pd-btn pd-ghost" id="pd-ask" target="_blank" rel="noopener" href="#">Ask about this on WhatsApp</a>' +
          '<button type="button" class="pd-btn pd-ghost" id="pd-share">Share</button>' +
        '</div>' +
        bb + about + ingredients + nutrition +
      '</div>' +
    '</div>' +
    '<section class="pd-reviews"><h2>Customer reviews</h2><div id="reviews-root" data-product="' + esc(name) + '"></div></section>' +
    '<section class="pd-more"><h2>You may also like</h2><div class="pd-rels">' + related + '</div></section>' +
    '<div class="pd-toast" id="pd-toast" role="status"></div>';

  /* ---------- behaviour ---------- */
  var $ = function (id) { return document.getElementById(id); };
  function inCartQty(v) {
    var items = window.VasistaCart ? window.VasistaCart.read() : [];
    var m = items.filter(function (it) { return it.name === v.name && it.grams === v.grams; })[0];
    return m ? m.qty : 0;
  }
  function refresh() {
    var v = variants[cur];
    $("pd-price").textContent = C.rupee(v.price);
    $("pd-qty").textContent = qty;
    var n = inCartQty(v);
    $("pd-incart").innerHTML = n ? 'In your cart: <b>' + n + ' &times; ' + esc(v.grams) + '</b> · <a href="/cart">View cart</a>' : "";
    $("pd-ask").href = "https://wa.me/" + WA + "?text=" + encodeURIComponent("Hi, I have a question about " + name + " (" + v.grams + ").");
  }
  function toast(msg) {
    var t = $("pd-toast"); t.textContent = msg; t.classList.add("show");
    clearTimeout(toast.t); toast.t = setTimeout(function () { t.classList.remove("show"); }, 2200);
  }

  if ($("pd-sizes")) $("pd-sizes").addEventListener("click", function (e) {
    var b = e.target.closest(".size-pill"); if (!b) return;
    cur = Number(b.dataset.i);
    [].forEach.call($("pd-sizes").children, function (x) { x.classList.toggle("active", x === b); });
    refresh();
  });
  $("pd-dec").addEventListener("click", function () { if (qty > 1) { qty--; refresh(); } });
  $("pd-inc").addEventListener("click", function () { if (qty < 20) { qty++; refresh(); } });
  $("pd-add").addEventListener("click", function () {
    if (!window.VasistaCart) return;
    var v = variants[cur], items = window.VasistaCart.read().filter(function (it) { return it.qty > 0; });
    var m = items.filter(function (it) { return it.name === v.name && it.grams === v.grams; })[0];
    if (m) m.qty += qty; else items.push({ name: v.name, grams: v.grams, price: v.price, unit: v.price, qty: qty });
    items.forEach(function (it) { var p = C.find(it.name, it.grams); if (p) it.unit = C.unitPriceFor(p.price, it.qty).unit; });
    window.VasistaCart.write(items);
    toast("Added " + qty + " × " + name + " (" + v.grams + ") to your cart");
    qty = 1; refresh();
  });
  $("pd-share").addEventListener("click", function () {
    var url = location.href;
    if (navigator.share) { navigator.share({ title: name, url: url }).catch(function () {}); return; }
    try { navigator.clipboard.writeText(url).then(function () { toast("Link copied"); }); } catch (e) { toast(url); }
  });
  document.addEventListener("vasista-cart-change", refresh);

  var track = $("pd-track");
  if (track && imgs.length > 1) {
    var thumbs = $("pd-thumbs").children;
    var go = function (i) { track.scrollTo({ left: i * track.clientWidth, behavior: "smooth" }); };
    $("pd-prev").addEventListener("click", function () { go(Math.max(0, Math.round(track.scrollLeft / track.clientWidth) - 1)); });
    $("pd-next").addEventListener("click", function () { go(Math.min(imgs.length - 1, Math.round(track.scrollLeft / track.clientWidth) + 1)); });
    $("pd-thumbs").addEventListener("click", function (e) { var b = e.target.closest(".pd-thumb"); if (b) go(Number(b.dataset.i)); });
    track.addEventListener("scroll", function () {
      var n = Math.round(track.scrollLeft / (track.clientWidth || 1));
      [].forEach.call(thumbs, function (t, i) { t.classList.toggle("on", i === n); });
    });
  }
  refresh();
})();

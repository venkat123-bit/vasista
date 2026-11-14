// Cart page: shows what was added on the Products page (or an empty state that
// points back to Products), then collects delivery details and sends the order.
(function () {
  var C = window.VasistaCatalog, Cart = window.VasistaCart;
  var rupee = C.rupee, unitPriceFor = C.unitPriceFor;
  var PHONE = "918341383888";
  var baseText = "Hi, I'd like to order from Vasista Food and Traders";

  // ---- Delivery / Pickup ----
  // Put your shop address here if you want customers to see it when they choose Pickup.
  // Leave it as "" to show "We will confirm the pickup location on WhatsApp".
  var PICKUP_ADDRESS = "";
  var fulfilMode = "delivery"; // "delivery" or "pickup"

  // ---- Payment (UPI) config ----
  var UPI_ID = "8712573832@ybl";
  var UPI_PAYEE_NAME = "Vaddi Venkat Nishant Reddy";

  // ---- Order logging to Google Sheets (best-effort; never blocks the WhatsApp order) ----
  var ORDER_LOG_URL = "https://script.google.com/macros/s/AKfycbziWEBVPUSk1RUIt2gwM_y3c0MWcHUYQ8CRifGpvQKz-ozawUD5NmpIJuL8B5qH5hAw/exec";

  var $ = function (id) { return document.getElementById(id); };
  var emptyBox = $("cart-empty"), filledBox = $("cart-filled");
  var listEl = $("cart-list"), summaryEl = $("cart-summary"), countPill = $("cart-count-pill");
  var shipEl = $("cart-ship"), moreEl = $("cart-more"), moreList = $("cart-more-list");
  var stickyEl = $("cart-sticky"), stickyTotal = $("cart-sticky-total"), stickyBtn = $("cart-sticky-btn");
  var couponToggle = $("coupon-toggle"), couponPanel = $("coupon-panel"), couponInput = $("coupon-input");
  var couponApplyBtn = $("coupon-apply"), couponMsg = $("coupon-msg");
  var couponTitle = $("coupon-title"), couponSub = $("coupon-sub");
  var syncing = false;

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  /* ---------- cart data ---------- */
  // Each stored line becomes a full row: catalogue product (for base price + image) and qty.
  function lines() {
    return Cart.read().filter(function (it) { return it.qty > 0; }).map(function (it) {
      var p = C.find(it.name, it.grams);
      var base = p ? p.price : (it.price || it.unit);
      var u = unitPriceFor(base, it.qty);
      return { name: it.name, grams: it.grams, qty: it.qty, base: base, unit: u.unit, pct: u.pct, img: p ? p.img : "" };
    });
  }

  function save(rows) {
    syncing = true;
    Cart.write(rows.filter(function (r) { return r.qty > 0; }).map(function (r) {
      return { name: r.name, grams: r.grams, price: r.base, unit: unitPriceFor(r.base, r.qty).unit, qty: r.qty };
    }));
    syncing = false;
  }

  /* delivery: free from FREE_DELIVERY_MIN (after discounts), otherwise a flat charge */
  var FREE_DELIVERY_MIN = 299, DELIVERY_FEE = 40;

  /* coupons (no minimum order). The same codes and rules must also be set in functions/index.js
     percent: value% off the items total (rounded to the nearest rupee)
     flat:    value rupees off the items total (never more than the items total) */
  var COUPONS = {
    "SAVE20":  { type: "percent", value: 20,  msg: "20% off your items" },
    "FLAT100": { type: "flat",    value: 100, msg: "\u20b9100 off your order" }
  };
  var appliedCoupon = null;

  function couponDiscount(code, total) {
    var c = COUPONS[code];
    if (!c || total <= 0) return 0;
    var d = c.type === "percent" ? Math.round(total * c.value / 100) : c.value;
    return Math.min(d, total);
  }

  function summary(rows) {
    var total = 0, count = 0, mrp = 0, out = [];
    rows.forEach(function (r) {
      count += r.qty; total += r.qty * r.unit; mrp += r.qty * r.base;
      out.push(r.name + " (" + r.grams + ") x" + r.qty + " @ " + rupee(r.unit) +
        (r.pct > 0 ? " (" + r.pct + "% off)" : ""));
    });
    var discount = appliedCoupon ? couponDiscount(appliedCoupon, total) : 0;
    var after = total - discount;
    var delivery = (fulfilMode === "delivery" && count > 0 && after < FREE_DELIVERY_MIN) ? DELIVERY_FEE : 0;
    return { total: total, discount: discount, after: after, delivery: delivery, grand: after + delivery,
             count: count, mrp: mrp, save: mrp - total, lines: out };
  }

  /* ---------- render ---------- */
  var currentTotal = 0;

  var TRUCK_SVG = '<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 6.5h11v9H2z"/><path d="M13 9.5h4l3 3v3h-7"/><circle cx="6.5" cy="17.2" r="1.8"/><circle cx="16.5" cy="17.2" r="1.8"/></svg>';

  // Free-delivery progress card
  function renderShip(s) {
    if (!shipEl) return;
    if (fulfilMode === "pickup" || s.count === 0) { shipEl.hidden = true; return; }
    shipEl.hidden = false;
    var unlocked = s.after >= FREE_DELIVERY_MIN;
    var pct = Math.max(4, Math.min(100, Math.round(s.after / FREE_DELIVERY_MIN * 100)));
    shipEl.innerHTML =
      '<div class="ship-ico">' + TRUCK_SVG + '</div>' +
      '<div class="ship-body">' +
        '<p class="ship-msg">' + (unlocked
          ? 'You\u2019ve unlocked <b>FREE delivery</b>!'
          : 'Add <b>' + rupee(FREE_DELIVERY_MIN - s.after) + '</b> more to get FREE delivery!') + '</p>' +
        '<div class="ship-row"><div class="ship-track"><i class="ship-fill" style="width:' + pct + '%"></i></div>' +
        '<span class="ship-count">' + (unlocked ? '\u2713' : rupee(s.after) + ' / ' + rupee(FREE_DELIVERY_MIN)) + '</span></div>' +
      '</div>';
  }

  // "You May Also Like": products that are not in the cart yet (cheapest size of each)
  function renderMore(rows) {
    if (!moreEl || !moreList) return;
    var inCart = {};
    rows.forEach(function (r) { inCart[r.name] = true; });
    var best = {}, order = [];
    C.products.forEach(function (p) {
      if (inCart[p.name]) return;
      if (!best[p.name]) { best[p.name] = p; order.push(p.name); }
      else if (p.price < best[p.name].price) { best[p.name] = p; }
    });
    var picks = order.slice(0, 3).map(function (n) { return best[n]; });
    if (!picks.length) { moreEl.hidden = true; return; }
    moreEl.hidden = false;
    moreList.innerHTML = picks.map(function (p) {
      return '<article class="more-card">' +
        '<div class="more-img"><img src="' + esc(p.img) + '" alt="' + esc(p.name) + '" loading="lazy"></div>' +
        '<h4 class="more-name">' + esc(p.name) + '</h4>' +
        '<p class="more-size">' + esc(p.grams) + '</p>' +
        '<div class="more-bottom"><strong>' + rupee(p.price) + '</strong>' +
        '<button type="button" class="more-add" data-name="' + esc(p.name) + '" data-grams="' + esc(p.grams) + '">+ Add</button></div>' +
      '</article>';
    }).join("");
  }

  function renderCoupon() {
    if (!couponToggle) return;
    if (appliedCoupon) {
      couponTitle.textContent = "Coupon " + appliedCoupon + " applied";
      couponSub.textContent = COUPONS[appliedCoupon].msg;
      couponApplyBtn.textContent = "Remove";
      couponInput.value = appliedCoupon;
      couponInput.disabled = true;
      couponToggle.classList.add("on");
    } else {
      couponTitle.textContent = "Apply Coupon";
      couponSub.textContent = "Get extra discounts on this order";
      couponApplyBtn.textContent = "Apply";
      couponInput.disabled = false;
      couponToggle.classList.remove("on");
    }
  }

  function render() {
    var rows = lines(), s = summary(rows);
    currentTotal = s.grand;
    emptyBox.hidden = rows.length > 0;
    filledBox.hidden = rows.length === 0;
    if (!rows.length) { if (countPill) countPill.textContent = ""; return; }

    countPill.textContent = s.count + (s.count === 1 ? " Item" : " Items");
    renderShip(s);

    listEl.innerHTML = rows.map(function (r, i) {
      var img = r.img
        ? '<img src="' + esc(r.img) + '" alt="' + esc(r.name) + '" loading="lazy">'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 20V10l8-6 8 6v10"/><path d="M9 20v-6h6v6"/></svg>';
      var unit = r.unit;
      var price = r.pct > 0
        ? '<span class="ci-now">' + rupee(unit) + '</span><span class="ci-old">' + rupee(r.base) + '</span><span class="ci-off">' + r.pct + '% off</span>'
        : '<span class="ci-now">' + rupee(unit) + '</span>';
      return '<article class="cart-item" data-i="' + i + '">' +
        '<div class="ci-img">' + img + '</div>' +
        '<div class="ci-main">' +
          '<div class="ci-top"><div><h3 class="ci-name">' + esc(r.name) + '</h3><p class="ci-size">' + esc(r.grams) + '</p></div>' +
            '<button type="button" class="ci-remove" data-act="remove" data-i="' + i + '" aria-label="Remove ' + esc(r.name) + '">' +
              '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg>' +
            '</button></div>' +
          '<div class="ci-price">' + price + '</div>' +
          '<div class="ci-bottom">' +
            '<div class="qty-stepper">' +
              '<button type="button" aria-label="Decrease quantity" data-act="dec" data-i="' + i + '">\u2212</button>' +
              '<span>' + r.qty + '</span>' +
              '<button type="button" aria-label="Increase quantity" data-act="inc" data-i="' + i + '">+</button>' +
            '</div>' +
            '<strong class="ci-line">' + rupee(r.qty * unit) + '</strong>' +
          '</div>' +
        '</div></article>';
    }).join("");

    var deliveryRow = fulfilMode === "pickup"
      ? '<div class="cs-row"><span>Pickup</span><span class="cs-free">Free</span></div>'
      : '<div class="cs-row"><span>Delivery Charges</span><span>' + (s.delivery
          ? rupee(s.delivery)
          : '<s class="cs-strike">' + rupee(DELIVERY_FEE) + '</s><b class="cs-free">FREE</b>') + '</span></div>';
    var saved = s.save + s.discount;

    summaryEl.innerHTML =
      '<h3 class="cs-title">Order Summary</h3>' +
      '<div class="cs-row"><span>Subtotal (' + s.count + (s.count === 1 ? ' item' : ' items') + ')</span><span>' + rupee(s.mrp) + '</span></div>' +
      (s.save > 0 ? '<div class="cs-row cs-save"><span>Discount</span><span>\u2212 ' + rupee(s.save) + '</span></div>' : '') +
      (s.discount > 0 ? '<div class="cs-row cs-save"><span>Coupon (' + esc(appliedCoupon) + ')</span><span>\u2212 ' + rupee(s.discount) + '</span></div>' : '') +
      deliveryRow +
      '<div class="cs-row cs-total"><span>Total Amount</span><span>' + rupee(s.grand) + '</span></div>' +
      (saved > 0 ? '<p class="cs-saving">You are saving <b>' + rupee(saved) + '</b> on this order!</p>' : '');

    renderMore(rows);
    renderCoupon();
    if (stickyTotal) stickyTotal.textContent = rupee(s.grand);

    updateOrderButton(s);
    if (currentPayMethod() === "upi") updateUpiQr(currentTotal);
  }

  listEl.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-act]");
    if (!btn) return;
    var rows = lines(), i = Number(btn.dataset.i), r = rows[i];
    if (!r) return;
    if (btn.dataset.act === "inc") r.qty++;
    if (btn.dataset.act === "dec") r.qty--;
    if (btn.dataset.act === "remove") r.qty = 0;
    save(rows);
    render();
  });

  // Quick-add from "You May Also Like"
  if (moreList) moreList.addEventListener("click", function (e) {
    var b = e.target.closest(".more-add");
    if (!b) return;
    var p = C.find(b.getAttribute("data-name"), b.getAttribute("data-grams"));
    if (!p) return;
    var items = Cart.read().filter(function (it) { return it.qty > 0; });
    var hit = items.filter(function (it) { return it.name === p.name && it.grams === p.grams; })[0];
    if (hit) hit.qty++;
    else items.push({ name: p.name, grams: p.grams, price: p.price, unit: p.price, qty: 1 });
    Cart.write(items); // fires "vasista-cart-change", which re-renders the page
  });

  // Coupon row + panel
  function setCouponMsg(text, ok) {
    couponMsg.textContent = text || "";
    couponMsg.className = "coupon-msg" + (text ? (ok ? " ok" : " err") : "");
  }
  if (couponToggle) {
    couponToggle.addEventListener("click", function () {
      var open = couponPanel.hidden;
      couponPanel.hidden = !open;
      couponToggle.setAttribute("aria-expanded", String(open));
      if (open && !appliedCoupon) couponInput.focus();
    });
    couponApplyBtn.addEventListener("click", function () {
      if (appliedCoupon) {
        appliedCoupon = null; couponInput.value = ""; setCouponMsg("");
        render();
        return;
      }
      var code = couponInput.value.trim().toUpperCase();
      if (!code) { setCouponMsg("Please enter a coupon code.", false); return; }
      if (!COUPONS[code]) { setCouponMsg("This coupon code is not valid.", false); return; }
      appliedCoupon = code;
      setCouponMsg("\u2713 " + COUPONS[code].msg, true);
      render();
    });
    couponInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); couponApplyBtn.click(); }
    });
  }

  // Cart changed in another tab or from the nav dropdown
  document.addEventListener("vasista-cart-change", function () { if (!syncing) render(); });
  window.addEventListener("storage", function (e) { if (e.key === "vasista_cart") render(); });
  window.addEventListener("pageshow", function (e) { if (e.persisted) render(); });

  /* ---------- delivery + payment ---------- */
  var orderBtn = $("order-btn"), orderLabel = $("order-label"), ctaNote = $("cta-note");
  var custFields = {
    name: $("cust-name"), phone: $("cust-phone"), address: $("cust-address"),
    city: $("cust-city"), pincode: $("cust-pincode"), landmark: $("cust-landmark")
  };
  var custLat = $("cust-lat"), custLng = $("cust-lng");
  var upiRefInput = $("upi-ref"), upiPanel = $("upi-panel"), upiQrImg = $("upi-qr");
  var upiIdText = $("upi-id-text"), copyUpiBtn = $("copy-upi-btn");
  var deliverySection = $("delivery-section"), deliveryErrorBanner = $("delivery-error-banner");
  var payRadios = document.querySelectorAll('input[name="pay-method"]');
  upiIdText.textContent = UPI_ID;

  // Sticky "Proceed to Checkout" bar: jumps to the delivery form, hides while the form is on screen
  if (stickyBtn) stickyBtn.addEventListener("click", function () {
    deliverySection.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  if (stickyEl && "IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      stickyEl.classList.toggle("is-hidden", entries[0].isIntersecting);
    }, { threshold: 0.1 }).observe(deliverySection);
  }

  function updateOrderButton(s) {
    orderLabel.textContent = currentPayMethod() === "razorpay"
      ? "Pay " + rupee(s.grand) + " securely"
      : "Order " + s.count + " item" + (s.count > 1 ? "s" : "") + " \u00b7 " + rupee(s.grand);
    ctaNote.textContent = fulfilMode === "pickup"
      ? "Enter your name and phone number above, then send your order."
      : "Fill in your delivery details above, then send your order.";
  }

  function currentPayMethod() {
    var checked = document.querySelector('input[name="pay-method"]:checked');
    return checked ? checked.value : "cod";
  }

  function updateUpiQr(total) {
    var upiUrl = "upi://pay?pa=" + encodeURIComponent(UPI_ID) +
                 "&pn=" + encodeURIComponent(UPI_PAYEE_NAME) +
                 (total > 0 ? "&am=" + total : "") +
                 "&cu=INR&tn=" + encodeURIComponent("Vasista order");
    upiQrImg.src = "https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=" + encodeURIComponent(upiUrl);
    upiQrImg.alt = total > 0 ? "Scan to pay " + rupee(total) + " via UPI" : "Scan to pay via UPI";
  }

  payRadios.forEach(function (r) {
    r.addEventListener("change", function () {
      var isUpi = currentPayMethod() === "upi";
      upiPanel.classList.toggle("hidden", !isUpi);
      if (isUpi) updateUpiQr(currentTotal);
      render(); // refresh the order button label for the chosen payment method
    });
  });

  copyUpiBtn.addEventListener("click", function () {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(UPI_ID).then(function () {
        copyUpiBtn.textContent = window.VasistaI18n ? window.VasistaI18n.t("Copied!") : "Copied!";
        setTimeout(function () { copyUpiBtn.textContent = window.VasistaI18n ? window.VasistaI18n.t("Copy") : "Copy"; }, 1500);
      });
    }
  });

  function setFieldInvalid(fieldId, invalid) {
    var el = $(fieldId);
    if (el) el.classList.toggle("invalid", invalid);
  }

  function readVals() {
    return {
      name: custFields.name.value.trim(), phone: custFields.phone.value.trim(),
      address: custFields.address.value.trim(), city: custFields.city.value.trim(),
      pincode: custFields.pincode.value.trim(), landmark: custFields.landmark.value.trim()
    };
  }

  function validateDelivery() {
    var vals = readVals();
    var phoneOk = /^\d{10}$/.test(vals.phone), pinOk = /^\d{6}$/.test(vals.pincode);
    setFieldInvalid("field-name", !vals.name);
    setFieldInvalid("field-phone", !phoneOk);
    if (fulfilMode === "pickup") {
      // Pickup only needs name + phone; clear any red marks on the hidden address fields
      ["field-address", "field-city", "field-pincode"].forEach(function (id) { setFieldInvalid(id, false); });
      return { valid: !!(vals.name && phoneOk), vals: vals };
    }
    setFieldInvalid("field-address", !vals.address);
    setFieldInvalid("field-city", !vals.city);
    setFieldInvalid("field-pincode", !pinOk);
    return { valid: !!(vals.name && phoneOk && vals.address && vals.city && pinOk), vals: vals };
  }

  function buildOrderText(s, paidRef) {
    var text = baseText;
    if (!s.lines.length) return encodeURIComponent(text);
    text += ":%0A" + s.lines.map(function (l) { return "- " + encodeURIComponent(l); }).join("%0A") +
            (s.discount > 0 ? "%0ACoupon " + encodeURIComponent(appliedCoupon + ": -" + rupee(s.discount)) : "") +
            "%0ADelivery: " + encodeURIComponent(fulfilMode === "pickup" ? "Pickup (no delivery charge)" : (s.delivery ? rupee(s.delivery) : "Free")) +
            "%0ATotal: " + encodeURIComponent(rupee(s.grand));
    var vals = readVals(), payMethod = currentPayMethod(), upiRef = upiRefInput.value.trim();
    if (fulfilMode === "pickup") {
      text += "%0A%0APICKUP (customer will collect):%0A" + encodeURIComponent(vals.name + ", " + vals.phone);
    } else {
      text += "%0A%0ADeliver to:%0A" + encodeURIComponent(vals.name + ", " + vals.phone) +
              "%0A" + encodeURIComponent(vals.address + ", " + vals.city + " - " + vals.pincode);
      if (vals.landmark) text += "%0ALandmark: " + encodeURIComponent(vals.landmark);
      if (custLat.value && custLng.value) {
        text += "%0AMap pin: " + encodeURIComponent("https://maps.google.com/?q=" + custLat.value + "," + custLng.value);
      }
    }
    text += "%0APayment: " + encodeURIComponent(
      paidRef ? "PAID online via Razorpay (Payment ID: " + paidRef + ")" :
      payMethod === "upi" ? "UPI" + (upiRef ? " (Ref: " + upiRef + ")" : " - screenshot/reference to follow") :
      (fulfilMode === "pickup" ? "Pay at pickup" : "Cash on Delivery")
    );
    return text;
  }

  function logOrderToSheet(s, paid) {
    if (!ORDER_LOG_URL || ORDER_LOG_URL.indexOf("PASTE_YOUR") === 0) return;
    var vals = readVals(), payMethod = currentPayMethod(), pickup = fulfilMode === "pickup";
    var payload = {
      timestamp: new Date().toISOString(),
      name: vals.name, phone: vals.phone,
      address: pickup ? "PICKUP (customer collects)" : vals.address,
      city: pickup ? "" : vals.city,
      pincode: pickup ? "" : vals.pincode,
      landmark: pickup ? "" : vals.landmark,
      items: s.lines.join(" | ") + (s.discount > 0 ? " | Coupon " + appliedCoupon + " (-" + rupee(s.discount) + ")" : ""),
      delivery: s.delivery, total: s.grand,
      paymentMethod: paid 
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

  function render() {
    var rows = lines(), s = summary(rows);
    currentTotal = s.grand;
    emptyBox.hidden = rows.length > 0;
    filledBox.hidden = rows.length === 0;
    if (!rows.length) return;

    countPill.textContent = s.count + (s.count === 1 ? " item" : " items");

    listEl.innerHTML = rows.map(function (r, i) {
      var img = r.img
        ? '<img src="' + esc(r.img) + '" alt="' + esc(r.name) + '" loading="lazy">'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 20V10l8-6 8 6v10"/><path d="M9 20v-6h6v6"/></svg>';
      var unit = r.unit;
      var price = r.pct > 0
        ? '<span class="ci-old">' + rupee(r.base) + '</span><span class="ci-now">' + rupee(unit) + '</span><span class="ci-off">' + r.pct + '% off</span>'
        : '<span class="ci-now">' + rupee(unit) + '</span>';
      return '<article class="cart-item" data-i="' + i + '">' +
        '<div class="ci-img">' + img + '</div>' +
        '<div class="ci-main">' +
          '<div class="ci-top"><div><h3 class="ci-name">' + esc(r.name) + '</h3><p class="ci-size">' + esc(r.grams) + '</p></div>' +
            '<button type="button" class="ci-remove" data-act="remove" data-i="' + i + '" aria-label="Remove ' + esc(r.name) + '">' +
              '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg>' +
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

    summaryEl.innerHTML =
      '<div class="cs-row"><span>Subtotal</span><span>' + rupee(s.mrp) + '</span></div>' +
      (s.save > 0 ? '<div class="cs-row cs-save"><span>You save</span><span>\u2212 ' + rupee(s.save) + '</span></div>' : '') +
      (s.discount > 0 ? '<div class="cs-row cs-save"><span>Coupon (' + esc(appliedCoupon) + ')</span><span>\u2212 ' + rupee(s.discount) + '</span></div>' : '') +
      '<div class="cs-row"><span>' + (fulfilMode === "pickup" ? "Pickup" : "Delivery") + '</span><span>' + (s.delivery ? rupee(s.delivery) : '<b style="color:#1d6b3f">Free</b>') + '</span></div>' +
      (s.delivery ? '<div class="cs-row" style="font-size:.82rem;color:#7c1f2b"><span>Add ' + rupee(FREE_DELIVERY_MIN - s.after) + ' more for free delivery</span><span></span></div>' : '') +
      '<div class="cs-row cs-total"><span>Total</span><span>' + rupee(s.grand) + '</span></div>';

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
      paymentMethod: paid ? "Razorpay (PAID)" : (payMethod === "upi" ? "UPI" : (pickup ? "Pay at pickup" : "Cash on Delivery")),
      upiRef: paid ? paid.paymentId : upiRefInput.value.trim(),
      mapLink: (!pickup && custLat.value && custLng.value) ? ("https://maps.google.com/?q=" + custLat.value + "," + custLng.value) : ""
    };
    try {
      fetch(ORDER_LOG_URL, {
        method: "POST", mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
      }).catch(function () { /* best-effort */ });
    } catch (err) { /* ignore */ }
  }

  /* ---------- Pay online (Razorpay via Firebase Cloud Functions) ---------- */
  var paying = false;
  function payOnline(s) {
    if (paying) return;
    if (!window.VasistaPay || typeof window.Razorpay === "undefined") {
      alert("Online payment is still loading. Please wait a moment and try again.");
      return;
    }
    var vals = readVals();
    var items = lines().map(function (r) { return { name: r.name, grams: r.grams, qty: r.qty }; });
    var pickup = fulfilMode === "pickup";
    var customer = pickup
      ? { name: vals.name, phone: vals.phone, address: "", city: "", pincode: "", landmark: "", lat: "", lng: "", pickup: true }
      : { name: vals.name, phone: vals.phone, address: vals.address, city: vals.city,
          pincode: vals.pincode, landmark: vals.landmark, lat: custLat.value, lng: custLng.value, pickup: false };
    paying = true;
    orderBtn.style.opacity = ".6";
    orderLabel.textContent = "Opening secure payment\u2026";
    window.VasistaPay.pay({ items: items, customer: customer, coupon: appliedCoupon || "" }).then(function (res) {
      logOrderToSheet(s, { paymentId: res.paymentId });
      showPaidScreen(s, res.paymentId);
    }).catch(function (err) {
      if (err && err.message !== "cancelled") {
        alert((err && err.message) || "Payment could not be completed. If money was deducted, please contact us on WhatsApp.");
      }
    }).then(function () {
      paying = false;
      orderBtn.style.opacity = "";
      render();
    });
  }

  function showPaidScreen(s, paymentId) {
    var waLink = "https://wa.me/" + PHONE + "?text=" + buildOrderText(s, paymentId);
    syncing = true; Cart.write([]); syncing = false;
    emptyBox.hidden = true; filledBox.hidden = true;
    var box = document.createElement("div");
    box.style.cssText = "max-width:560px;margin:32px auto;padding:28px 22px;text-align:center;border-radius:16px;background:rgba(29,107,63,.08);border:1px solid rgba(29,107,63,.3)";
    box.innerHTML =
      '<h2 style="margin:0 0 8px">Payment successful \u2705</h2>' +
      '<p style="margin:0 0 6px">Thank you! Your order is confirmed.</p>' +
      '<p style="margin:0 0 18px;font-size:.9rem;opacity:.8">Payment ID: ' + esc(paymentId) + '</p>' +
      '<a class="cta-btn" target="_blank" rel="noopener" href="' + waLink + '">Send order details on WhatsApp</a>';
    emptyBox.parentNode.insertBefore(box, emptyBox);
    window.scrollTo(0, 0);
  }

  orderBtn.addEventListener("click", function (e) {
    var s = summary(lines());
    if (s.count === 0) { e.preventDefault(); render(); return; }
    if (!validateDelivery().valid) {
      e.preventDefault();
      deliveryErrorBanner.classList.add("show");
      deliverySection.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    deliveryErrorBanner.classList.remove("show");
    if (currentPayMethod() === "razorpay") {
      e.preventDefault();
      if (s.grand < 1) { alert("This order total is \u20b90, so online payment isn't needed. Please choose Cash on Delivery / Pay at pickup."); return; }
      payOnline(s); return;
    }
    logOrderToSheet(s);
    e.currentTarget.href = "https://wa.me/" + PHONE + "?text=" + buildOrderText(s);
  });

  [custFields.name, custFields.phone, custFields.address, custFields.city, custFields.pincode].forEach(function (el) {
    el.addEventListener("input", function () {
      var field = el.closest(".d-field");
      if (field) field.classList.remove("invalid");
      if (!document.querySelector(".d-field.invalid")) deliveryErrorBanner.classList.remove("show");
    });
  });

  /* ---------- Map location picker (OpenStreetMap + Leaflet + Nominatim; no API key) ---------- */
  var mapPickBtn = $("map-pick-btn"), mapModal = $("map-modal"), mapBackBtn = $("map-back-btn");
  var mapSearchInput = $("map-search-input"), mapSearchBtn = $("map-search-btn");
  var mapCurrentLocBtn = $("map-current-loc-btn"), mapConfirmBtn = $("map-confirm-btn");
  var mapAddressTitle = $("map-address-title"), mapAddressSub = $("map-address-sub");
  var mapApproxNote = $("map-approx-note");

  var DEFAULT_MAP_CENTER = [17.4646, 78.5344]; // approx. Sainikpuri, Secunderabad
  var leafletMap = null, geocodeTimer = null, selectedLocation = null;

  function markLocationApprox(isApprox) { mapApproxNote.classList.toggle("show", !!isApprox); }

  function ensureMap() {
    if (leafletMap || typeof L === "undefined") return;
    leafletMap = L.map("map-canvas", { zoomControl: false }).setView(DEFAULT_MAP_CENTER, 15);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19, attribution: "&copy; OpenStreetMap contributors"
    }).addTo(leafletMap);
    L.control.zoom({ position: "bottomright" }).addTo(leafletMap);
    leafletMap.on("moveend", scheduleReverseGeocode);
  }

  function scheduleReverseGeocode() {
    clearTimeout(geocodeTimer);
    mapConfirmBtn.disabled = true;
    mapAddressTitle.textContent = "Locating\u2026";
    mapAddressSub.textContent = "";
    markLocationApprox(false);
    geocodeTimer = setTimeout(reverseGeocodeCenter, 700);
  }

  function fetchWithTimeout(url, ms) {
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, ms || 7000);
    return fetch(url, { signal: controller.signal }).finally(function () { clearTimeout(timer); });
  }

  var GEOCODE_CONTACT = "vasistanaturals@gmail.com";

  function reverseGeocodeCenter() {
    if (!leafletMap) return;
    var center = leafletMap.getCenter();

    function applyResult(title, sub, city, pincode, full, approx) {
      selectedLocation = { full: full, city: city, pincode: pincode, lat: cent
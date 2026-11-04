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

  /* coupon: every item costs COUPON_UNIT_PRICE and delivery is free.
     The same code must also be set in functions/index.js */
  var COUPON_CODE = "TEST10", COUPON_UNIT_PRICE = 10;
  var appliedCoupon = null;

  function summary(rows) {
    var total = 0, count = 0, mrp = 0, out = [];
    rows.forEach(function (r) {
      var unit = appliedCoupon ? COUPON_UNIT_PRICE : r.unit;
      count += r.qty; total += r.qty * unit; mrp += r.qty * r.base;
      out.push(r.name + " (" + r.grams + ") x" + r.qty + " @ " + rupee(unit) +
        (appliedCoupon ? " (coupon " + appliedCoupon + ")" : (r.pct > 0 ? " (" + r.pct + "% off)" : "")));
    });
    var delivery = (!appliedCoupon && fulfilMode === "delivery" && count > 0 && total < FREE_DELIVERY_MIN) ? DELIVERY_FEE : 0;
    return { total: total, delivery: delivery, grand: total + delivery, count: count, mrp: mrp, save: mrp - total, lines: out };
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
      var unit = appliedCoupon ? COUPON_UNIT_PRICE : r.unit;
      var price = (appliedCoupon || r.pct > 0)
        ? '<span class="ci-old">' + rupee(r.base) + '</span><span class="ci-now">' + rupee(unit) + '</span><span class="ci-off">' + (appliedCoupon ? 'Coupon' : r.pct + '% off') + '</span>'
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
      '<div class="cs-row"><span>' + (fulfilMode === "pickup" ? "Pickup" : "Delivery") + '</span><span>' + (s.delivery ? rupee(s.delivery) : '<b style="color:#1d6b3f">Free</b>') + '</span></div>' +
      (s.delivery ? '<div class="cs-row" style="font-size:.82rem;color:#7c1f2b"><span>Add ' + rupee(FREE_DELIVERY_MIN - s.total) + ' more for free delivery</span><span></span></div>' : '') +
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
      items: s.lines.join(" | "), delivery: s.delivery, total: s.grand,
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
    if (currentPayMethod() === "razorpay") { e.preventDefault(); payOnline(s); return; }
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
      selectedLocation = { full: full, city: city, pincode: pincode, lat: center.lat, lng: center.lng };
      mapAddressTitle.textContent = title;
      mapAddressSub.textContent = sub;
      mapConfirmBtn.disabled = false;
      markLocationApprox(!!approx);
    }

    var nomUrl = "https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=" + center.lat +
                 "&lon=" + center.lng + "&zoom=18&addressdetails=1&email=" + encodeURIComponent(GEOCODE_CONTACT);
    fetchWithTimeout(nomUrl, 6000)
      .then(function (r) { if (!r.ok) throw new Error("bad status " + r.status); return r.json(); })
      .then(function (data) {
        var addr = data.address || {};
        var title = addr.amenity || addr.building || addr.road || addr.suburb || addr.neighbourhood || "Selected location";
        var parts = [addr.road, addr.suburb || addr.neighbourhood, addr.village || addr.town || addr.city, addr.state, addr.postcode].filter(Boolean);
        var sub = parts.join(", ") || data.display_name || "";
        applyResult(title, sub,
          addr.city || addr.town || addr.village || addr.suburb || addr.neighbourhood || "",
          addr.postcode || "",
          data.display_name || (title + (sub ? ", " + sub : "")), true);
      })
      .catch(function () {
        var bdcUrl = "https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=" + center.lat +
                     "&longitude=" + center.lng + "&localityLanguage=en";
        return fetchWithTimeout(bdcUrl, 6000)
          .then(function (r) { if (!r.ok) throw new Error("bad status " + r.status); return r.json(); })
          .then(function (data) {
            var title = data.locality || data.city || data.principalSubdivision || "Selected location";
            var parts = [
              data.locality && data.locality !== title ? data.locality : null,
              data.city && data.city !== title ? data.city : null,
              data.principalSubdivision, data.postcode, data.countryName
            ].filter(Boolean);
            var sub = parts.join(", ");
            applyResult(title, sub, data.city || data.locality || "", data.postcode || "", [title, sub].filter(Boolean).join(", "), true);
          });
      })
      .catch(function () {
        selectedLocation = { full: "", city: "", pincode: "", lat: center.lat, lng: center.lng };
        mapAddressTitle.textContent = "Couldn't auto-detect address";
        mapAddressSub.textContent = "That's OK \u2014 confirm this pin and type your address below.";
        mapConfirmBtn.disabled = false;
        markLocationApprox(false);
      });
  }

  function openMapModal() {
    mapModal.classList.add("open");
    document.body.style.overflow = "hidden";
    var firstOpen = !leafletMap;
    ensureMap();
    setTimeout(function () {
      if (!leafletMap) return;
      leafletMap.invalidateSize();
      if (firstOpen && navigator.geolocation) {
        mapAddressTitle.textContent = "Finding your location\u2026";
        navigator.geolocation.getCurrentPosition(function (pos) {
          leafletMap.setView([pos.coords.latitude, pos.coords.longitude], 17);
        }, function () { scheduleReverseGeocode(); }, { enableHighAccuracy: true, timeout: 6000 });
      } else {
        scheduleReverseGeocode();
      }
    }, 60);
  }

  function closeMapModal() {
    mapModal.classList.remove("open");
    document.body.style.overflow = "";
  }

  function doMapSearch() {
    var q = mapSearchInput.value.trim();
    if (!q || !leafletMap) return;
    fetch("https://nominatim.openstreetmap.org/search?format=jsonv2&q=" + encodeURIComponent(q) + "&limit=1&countrycodes=in")
      .then(function (r) { return r.json(); })
      .then(function (results) {
        if (results && results[0]) leafletMap.setView([parseFloat(results[0].lat), parseFloat(results[0].lon)], 16);
      });
  }

  mapPickBtn.addEventListener("click", openMapModal);
  mapBackBtn.addEventListener("click", closeMapModal);
  mapSearchBtn.addEventListener("click", doMapSearch);
  mapSearchInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") { e.preventDefault(); doMapSearch(); }
  });

  mapCurrentLocBtn.addEventListener("click", function () {
    if (!navigator.geolocation || !leafletMap) return;
    mapCurrentLocBtn.disabled = true;
    navigator.geolocation.getCurrentPosition(function (pos) {
      leafletMap.setView([pos.coords.latitude, pos.coords.longitude], 17);
      mapCurrentLocBtn.disabled = false;
    }, function () {
      mapCurrentLocBtn.disabled = false;
      var msg = "Couldn't get your current location. Please allow location access or search above.";
      alert(window.VasistaI18n ? window.VasistaI18n.t(msg) : msg);
    }, { enableHighAccuracy: true, timeout: 8000 });
  });

  mapConfirmBtn.addEventListener("click", function () {
    if (!selectedLocation) return;
    if (selectedLocation.full) custFields.address.value = selectedLocation.full;
    if (selectedLocation.city) custFields.city.value = selectedLocation.city;
    if (selectedLocation.pincode) custFields.pincode.value = selectedLocation.pincode;
    custLat.value = selectedLocation.lat;
    custLng.value = selectedLocation.lng;
    ["field-address", "field-city", "field-pincode"].forEach(function (id) { setFieldInvalid(id, false); });
    if (!document.querySelector(".d-field.invalid")) deliveryErrorBanner.classList.remove("show");
    closeMapModal();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && mapModal.classList.contains("open")) closeMapModal();
  });

  /* ---------- Delivery / Pickup choice + hide "Pay via UPI" ---------- */
  (function setupFulfilment() {
    // Hide the "Pay via UPI" option and its QR panel
    var upiRadio = document.querySelector('input[name="pay-method"][value="upi"]');
    if (upiRadio) {
      var upiLabel = upiRadio.closest("label") || upiRadio.parentElement;
      if (upiLabel) upiLabel.style.display = "none";
      if (upiRadio.checked) {
        var fallback = document.querySelector('input[name="pay-method"][value="razorpay"]') ||
                       document.querySelector('input[name="pay-method"][value="cod"]');
        if (fallback) fallback.checked = true;
      }
    }
    if (upiPanel) { upiPanel.classList.add("hidden"); upiPanel.style.display = "none"; }

    // Delivery / Pickup buttons
    var anchorField = $("field-name");
    if (!anchorField || !anchorField.parentNode) return;
    var wrap = document.createElement("div");
    wrap.id = "fulfil-toggle";
    wrap.style.cssText = "display:flex;gap:10px;flex-wrap:wrap;margin:0 0 16px";
    wrap.innerHTML =
      '<button type="button" data-mode="delivery">Delivery</button>' +
      '<button type="button" data-mode="pickup">Pickup (I\u2019ll collect)</button>';
    var note = document.createElement("p");
    note.id = "fulfil-note";
    note.style.cssText = "display:none;margin:0 0 16px;font-size:.9rem;opacity:.85";

    var ref = anchorField, host = anchorField.parentNode;
    if (host !== deliverySection && host.parentNode) { ref = host; host = host.parentNode; }
    host.insertBefore(wrap, ref);
    host.insertBefore(note, ref);

    var codRadio = document.querySelector('input[name="pay-method"][value="cod"]');
    var codLabel = codRadio && (codRadio.closest("label") || codRadio.parentElement);
    function relabelCod(pickup) {
      if (!codLabel) return;
      codLabel.setAttribute("data-pickup", pickup ? "1" : "0");
      var nodes = codLabel.querySelectorAll("*");
      for (var i = 0; i < nodes.length; i++) {
        if (nodes[i].children.length === 0) {
          var t = nodes[i].textContent.trim();
          if (t === "Cash on Delivery" || t === "Pay at pickup") {
            nodes[i].textContent = pickup ? "Pay at pickup" : "Cash on Delivery";
          }
        }
      }
    }

    function paint() {
      Array.prototype.forEach.call(wrap.querySelectorAll("button"), function (b) {
        var on = b.getAttribute("data-mode") === fulfilMode;
        b.style.cssText = "cursor:pointer;padding:10px 18px;border-radius:999px;font:inherit;font-weight:600;border:1px solid #2e8b63;" +
          (on ? "background:#1d6b3f;color:#fff" : "background:transparent;color:#2e8b63");
      });
    }

    function setMode(mode) {
      fulfilMode = mode;
      var pickup = mode === "pickup";
      ["field-address", "field-city", "field-pincode", "field-landmark"].forEach(function (id) {
        var el = $(id);
        if (el) el.style.display = pickup ? "none" : "";
      });
      if (mapPickBtn) mapPickBtn.style.display = pickup ? "none" : "";
      ["field-address", "field-city", "field-pincode"].forEach(function (id) { setFieldInvalid(id, false); });
      if (!document.querySelector(".d-field.invalid")) deliveryErrorBanner.classList.remove("show");
      note.style.display = pickup ? "block" : "none";
      note.textContent = pickup
        ? (PICKUP_ADDRESS ? "Pickup from: " + PICKUP_ADDRESS : "We will confirm the pickup location with you on WhatsApp.")
        : "";
      relabelCod(pickup);
      paint();
      render();
    }

    wrap.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-mode]");
      if (b) setMode(b.getAttribute("data-mode"));
    });
    paint();
  })();

  /* ---------- Coupon box (sits under the price summary) ---------- */
  (function setupCoupon() {
    var box = document.createElement("div");
    box.id = "coupon-box";
    box.style.cssText = "margin:14px 0 0;padding:14px 16px;border-radius:14px;border:1px solid rgba(46,139,99,.35)";
    box.innerHTML =
      '<div style="display:flex;gap:10px;flex-wrap:wrap">' +
        '<input type="text" id="coupon-input" placeholder="Have a coupon code?" autocomplete="off" autocapitalize="characters" ' +
          'style="flex:1;min-width:160px;padding:10px 14px;border-radius:10px;border:1px solid rgba(46,139,99,.5);background:transparent;color:inherit;font:inherit;text-transform:uppercase">' +
        '<button type="button" id="coupon-btn" style="cursor:pointer;padding:10px 20px;border-radius:999px;border:0;font:inherit;font-weight:600;background:#1d6b3f;color:#fff">Apply</button>' +
      '</div>' +
      '<p id="coupon-msg" style="display:none;margin:8px 0 0;font-size:.85rem"></p>';
    summaryEl.parentNode.insertBefore(box, summaryEl.nextSibling);

    var input = $("coupon-input"), btn = $("coupon-btn"), msgEl = $("coupon-msg");

    function msg(text, ok) {
      msgEl.style.display = text ? "block" : "none";
      msgEl.textContent = text;
      msgEl.style.color = ok ? "#2e8b63" : "#e0584a";
    }
    function paintBtn() {
      btn.textContent = appliedCoupon ? "Remove" : "Apply";
      input.disabled = !!appliedCoupon;
    }
    function toggleCoupon() {
      if (appliedCoupon) {
        appliedCoupon = null; input.value = ""; msg("", true); paintBtn(); render(); return;
      }
      var code = input.value.trim().toUpperCase();
      if (!code) { msg("Enter a coupon code.", false); return; }
      if (code !== COUPON_CODE) { msg("Invalid coupon code.", false); return; }
      appliedCoupon = code;
      msg("Coupon applied: every item is \u20b9" + COUPON_UNIT_PRICE + " and delivery is free.", true);
      paintBtn(); render();
    }
    btn.addEventListener("click", toggleCoupon);
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); toggleCoupon(); }
    });
    paintBtn();
  })();

  /* ---------- Payment method cards (styling only) ---------- */
  (function stylePaymentCards() {
    var css = `
.payment-block { margin-top: 36px; text-align: center; }
.payment-block h3::after {
  content: "Choose how you'd like to pay";
  display: block; margin-top: 4px;
  font-family: 'Work Sans', sans-serif; font-size: .85rem; font-weight: 500;
  letter-spacing: .02em; opacity: .65;
}
.payment-block .pay-options {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 14px; max-width: 660px; margin: 20px auto 0; text-align: left;
}
.payment-block .pay-options .pay-option {
  position: relative; display: grid; grid-template-columns: 48px 1fr;
  grid-template-rows: auto auto; column-gap: 14px; row-gap: 2px; align-items: center;
  padding: 16px 58px 16px 16px; border-radius: 18px; cursor: pointer;
  font-size: 1rem; font-weight: 600; line-height: 1.25;
  color: inherit !important;
  background: linear-gradient(145deg, rgba(255,255,255,.05), rgba(255,255,255,.015)) !important;
  border: 1.5px solid rgba(46,139,99,.3) !important;
  box-shadow: 0 4px 14px rgba(0,0,0,.12);
  transition: transform .18s ease, border-color .18s ease, box-shadow .18s ease, background .18s ease;
}
.payment-block .pay-options .pay-option:hover {
  transform: translateY(-2px); border-color: rgba(46,139,99,.65) !important;
}
.payment-block .pay-options .pay-option:has(input:checked) {
  border-color: #2e8b63 !important;
  background: linear-gradient(145deg, rgba(46,139,99,.26), rgba(46,139,99,.08)) !important;
  box-shadow: 0 8px 24px rgba(46,139,99,.25), 0 0 0 3px rgba(46,139,99,.14);
}
.payment-block .pay-options .pay-option:has(input:focus-visible) {
  outline: 2px solid #2e8b63; outline-offset: 3px;
}
/* icon tile */
.payment-block .pay-options .pay-option::before {
  content: ""; grid-column: 1; grid-row: 1 / span 2;
  width: 48px; height: 48px; border-radius: 14px;
  background-color: rgba(46,139,99,.16); background-repeat: no-repeat;
  background-position: center; background-size: 26px;
}
.payment-block .pay-options .pay-option:has(input:checked)::before { background-color: rgba(46,139,99,.32); }
.payment-block .pay-options .pay-option:has(input[value="cod"])::before {
  background-image: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%232e8b63' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'><rect x='2' y='6' width='20' height='12' rx='2'/><circle cx='12' cy='12' r='2.5'/><path d='M6 10v.01M18 14v.01'/></svg>");
}
.payment-block .pay-options .pay-option:has(input[value="razorpay"])::before {
  background-image: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%232e8b63' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'><rect x='2' y='5' width='20' height='14' rx='2'/><path d='M2 10h20M6 15h4'/></svg>");
}
/* small caption under the title */
.payment-block .pay-options .pay-option::after {
  grid-column: 2; grid-row: 2; font-size: .78rem; font-weight: 500; opacity: .7; content: "";
}
.payment-block .pay-options .pay-option:has(input[value="cod"])::after { content: "Pay in cash when you receive"; }
.payment-block .pay-options .pay-option[data-pickup="1"]::after { content: "Pay in cash when you collect"; }
.payment-block .pay-options .pay-option:has(input[value="razorpay"])::after { content: "Instant confirmation \\00b7  Secured by Razorpay"; }
/* custom radio circle with tick */
.payment-block .pay-options .pay-option > input[type="radio"] {
  -webkit-appearance: none; appearance: none; position: absolute; top: 50%; right: 18px;
  transform: translateY(-50%); width: 24px; height: 24px; margin: 0; border-radius: 50%;
  border: 2px solid rgba(46,139,99,.55); background: transparent; cursor: pointer;
  transition: background .18s ease, border-color .18s ease, box-shadow .18s ease;
}
.payment-block .pay-options .pay-option > input[type="radio"]:checked {
  border-color: #1d6b3f; box-shadow: 0 0 0 4px rgba(46,139,99,.22);
  background: #1d6b3f url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3.2' stroke-linecap='round' stroke-linejoin='round'><path d='M5 12.5l4.5 4.5L19 7'/></svg>") center / 14px no-repeat;
}
`;
    var tag = document.createElement("style");
    tag.id = "pay-card-styles";
    tag.textContent = css;
    document.head.appendChild(tag);
  })();

  render();
})();

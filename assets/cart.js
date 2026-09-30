// Cart page: shows what was added on the Products page (or an empty state that
// points back to Products), then collects delivery details and sends the order.
(function () {
  var C = window.VasistaCatalog, Cart = window.VasistaCart;
  var rupee = C.rupee, unitPriceFor = C.unitPriceFor;
  var PHONE = "918341383888";
  var baseText = "Hi, I'd like to order from Vasista Food and Traders";

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

  function summary(rows) {
    var total = 0, count = 0, mrp = 0, out = [];
    rows.forEach(function (r) {
      count += r.qty; total += r.qty * r.unit; mrp += r.qty * r.base;
      out.push(r.name + " (" + r.grams + ") x" + r.qty + " @ " + rupee(r.unit) + (r.pct > 0 ? " (" + r.pct + "% off)" : ""));
    });
    return { total: total, count: count, mrp: mrp, save: mrp - total, lines: out };
  }

  /* ---------- render ---------- */
  var currentTotal = 0;

  function render() {
    var rows = lines(), s = summary(rows);
    currentTotal = s.total;
    emptyBox.hidden = rows.length > 0;
    filledBox.hidden = rows.length === 0;
    if (!rows.length) return;

    countPill.textContent = s.count + (s.count === 1 ? " item" : " items");

    listEl.innerHTML = rows.map(function (r, i) {
      var img = r.img
        ? '<img src="' + esc(r.img) + '" alt="' + esc(r.name) + '" loading="lazy">'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 20V10l8-6 8 6v10"/><path d="M9 20v-6h6v6"/></svg>';
      var price = r.pct > 0
        ? '<span class="ci-old">' + rupee(r.base) + '</span><span class="ci-now">' + rupee(r.unit) + '</span><span class="ci-off">' + r.pct + '% off</span>'
        : '<span class="ci-now">' + rupee(r.unit) + '</span>';
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
            '<strong class="ci-line">' + rupee(r.qty * r.unit) + '</strong>' +
          '</div>' +
        '</div></article>';
    }).join("");

    summaryEl.innerHTML =
      '<div class="cs-row"><span>Subtotal</span><span>' + rupee(s.mrp) + '</span></div>' +
      (s.save > 0 ? '<div class="cs-row cs-save"><span>You save</span><span>\u2212 ' + rupee(s.save) + '</span></div>' : '') +
      '<div class="cs-row"><span>Delivery</span><span>Confirmed on WhatsApp</span></div>' +
      '<div class="cs-row cs-total"><span>Total</span><span>' + rupee(s.total) + '</span></div>';

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
    orderLabel.textContent = "Order " + s.count + " item" + (s.count > 1 ? "s" : "") + " \u00b7 " + rupee(s.total);
    ctaNote.textContent = "Fill in your delivery details above, then send your order.";
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
    setFieldInvalid("field-address", !vals.address);
    setFieldInvalid("field-city", !vals.city);
    setFieldInvalid("field-pincode", !pinOk);
    return { valid: !!(vals.name && phoneOk && vals.address && vals.city && pinOk), vals: vals };
  }

  function buildOrderText(s) {
    var text = baseText;
    if (!s.lines.length) return encodeURIComponent(text);
    text += ":%0A" + s.lines.map(function (l) { return "- " + encodeURIComponent(l); }).join("%0A") +
            "%0ATotal: " + encodeURIComponent(rupee(s.total));
    var vals = readVals(), payMethod = currentPayMethod(), upiRef = upiRefInput.value.trim();
    text += "%0A%0ADeliver to:%0A" + encodeURIComponent(vals.name + ", " + vals.phone) +
            "%0A" + encodeURIComponent(vals.address + ", " + vals.city + " - " + vals.pincode);
    if (vals.landmark) text += "%0ALandmark: " + encodeURIComponent(vals.landmark);
    if (custLat.value && custLng.value) {
      text += "%0AMap pin: " + encodeURIComponent("https://maps.google.com/?q=" + custLat.value + "," + custLng.value);
    }
    text += "%0APayment: " + encodeURIComponent(
      payMethod === "upi" ? "UPI" + (upiRef ? " (Ref: " + upiRef + ")" : " - screenshot/reference to follow") : "Cash on Delivery"
    );
    return text;
  }

  function logOrderToSheet(s) {
    if (!ORDER_LOG_URL || ORDER_LOG_URL.indexOf("PASTE_YOUR") === 0) return;
    var vals = readVals(), payMethod = currentPayMethod();
    var payload = {
      timestamp: new Date().toISOString(),
      name: vals.name, phone: vals.phone, address: vals.address, city: vals.city,
      pincode: vals.pincode, landmark: vals.landmark,
      items: s.lines.join(" | "), total: s.total,
      paymentMethod: payMethod === "upi" ? "UPI" : "Cash on Delivery",
      upiRef: upiRefInput.value.trim(),
      mapLink: (custLat.value && custLng.value) ? ("https://maps.google.com/?q=" + custLat.value + "," + custLng.value) : ""
    };
    try {
      fetch(ORDER_LOG_URL, {
        method: "POST", mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
      }).catch(function () { /* best-effort */ });
    } catch (err) { /* ignore */ }
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

  render();
})();

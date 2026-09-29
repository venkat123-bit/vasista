// Shared cart state (localStorage-backed) and the dropdown preview shown
// when the nav Cart icon is clicked. Loaded on every page. order.js writes
// to this via window.VasistaCart whenever quantities change.
(function () {
  const KEY = "vasista_cart";

  function read() {
    try {
      const raw = localStorage.getItem(KEY);
      const items = raw ? JSON.parse(raw) : [];
      return Array.isArray(items) ? items : [];
    } catch (e) {
      return [];
    }
  }

  function write(items) {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch (e) {
      // Storage unavailable (private browsing etc.) — cart just won't persist.
    }
    updateBadge();
    const panel = document.getElementById("cart-panel");
    if (panel && panel.classList.contains("open")) renderPanel(panel);
  }

  function rupee(n) {
    return "\u20b9" + Number(n).toLocaleString("en-IN");
  }

  function updateBadge() {
    const count = read().reduce(function (sum, it) { return sum + (it.qty || 0); }, 0);
    document.querySelectorAll(".nav-cart-badge").forEach(function (badge) {
      badge.textContent = count > 99 ? "99+" : String(count);
      badge.classList.toggle("show", count > 0);
    });
  }

  function renderPanel(panel) {
    const items = read().filter(function (it) { return it.qty > 0; });
    if (!items.length) {
      panel.innerHTML =
        '<p class="cart-empty-msg">You haven\u2019t added any items yet.</p>' +
        '<a class="cart-browse-btn" href="order.html">Select items in Products</a>';
      return;
    }
    let total = 0;
    const rows = items.map(function (it, idx) {
      const lineTotal = it.unit * it.qty;
      total += lineTotal;
      return '<div class="cart-row" data-idx="' + idx + '">' +
        '<span class="cart-row-name">' + it.name + ' <small>(' + it.grams + ')</small></span>' +
        '<span class="cart-row-qty">\u00d7' + it.qty + '</span>' +
        '<span class="cart-row-total">' + rupee(lineTotal) + '</span>' +
        '<button type="button" class="cart-row-remove" data-idx="' + idx + '" aria-label="Remove ' + it.name + '">' +
          '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 5l14 14M19 5L5 19"/></svg>' +
        '</button>' +
      '</div>';
    }).join("");
    panel.innerHTML =
      '<div class="cart-rows">' + rows + '</div>' +
      '<div class="cart-total-row"><span>Total</span><span>' + rupee(total) + '</span></div>' +
      '<a class="cart-browse-btn" href="order.html">Go to checkout</a>';
  }

  function removeAt(idx) {
    const items = read().filter(function (it) { return it.qty > 0; });
    items.splice(idx, 1);
    write(items);
  }

  function ensurePanel() {
    let panel = document.getElementById("cart-panel");
    if (!panel) {
      panel = document.createElement("div");
      panel.id = "cart-panel";
      panel.className = "cart-panel";
      panel.setAttribute("role", "dialog");
      panel.setAttribute("aria-label", "Your cart");
      document.body.appendChild(panel);
    }
    return panel;
  }

  function toggle() {
    const panel = ensurePanel();
    const willOpen = !panel.classList.contains("open");
    if (willOpen) renderPanel(panel);
    panel.classList.toggle("open", willOpen);
  }

  document.addEventListener("click", function (e) {
    const cartBtn = e.target.closest(".nav-cart-btn, #nav-cart-link-mobile");
    const panel = document.getElementById("cart-panel");
    const removeBtn = e.target.closest(".cart-row-remove");
    if (removeBtn) {
      e.preventDefault();
      e.stopPropagation();
      removeAt(Number(removeBtn.dataset.idx));
      if (panel) renderPanel(panel);
      return;
    }
    if (cartBtn) {
      e.preventDefault();
      toggle();
      return;
    }
    if (panel && panel.classList.contains("open") && !panel.contains(e.target)) {
      panel.classList.remove("open");
    }
  });

  window.addEventListener("storage", function (e) {
    if (e.key === KEY) updateBadge();
  });

  document.addEventListener("DOMContentLoaded", updateBadge);

  window.VasistaCart = { read: read, write: write, updateBadge: updateBadge };
})();

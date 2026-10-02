// Light / dark theme switch. Remembers the choice; light is the default.
(function () {
  var KEY = "vasista-theme", root = document.documentElement;
  try { if (localStorage.getItem(KEY) === "dark") root.setAttribute("data-theme", "dark"); } catch (e) {}
  var SUN = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  var MOON = '<svg viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z"/></svg>';
  function dark() { return root.getAttribute("data-theme") === "dark"; }
  function paint(b) {
    b.innerHTML = dark() ? SUN : MOON;
    b.setAttribute("aria-label", dark() ? "Switch to light mode" : "Switch to dark mode");
    b.title = dark() ? "Light mode" : "Dark mode";
  }
  document.addEventListener("DOMContentLoaded", function () {
    var nav = document.querySelector(".navbar"); if (!nav) return;
    var b = document.createElement("button");
    b.type = "button"; b.className = "theme-btn"; paint(b);
    b.addEventListener("click", function () {
      if (dark()) root.removeAttribute("data-theme"); else root.setAttribute("data-theme", "dark");
      try { localStorage.setItem(KEY, dark() ? "dark" : "light"); } catch (e) {}
      paint(b);
    });
    nav.insertBefore(b, nav.querySelector(".nav-toggle"));
  });
})();

// Adds Profile + Cart icon buttons to the navbar (and matching links to the
// mobile panel) on every gated page, kept in sync with sign-in state.
import { auth, onAuthStateChanged } from "./firebase-config.js";

const CART_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>';
const PROFILE_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';

function makeDesktopIcons() {
  const wrap = document.createElement("div");
  wrap.className = "nav-icons";
  wrap.id = "nav-icons";

  const cart = document.createElement("a");
  cart.href = "/order";
  cart.className = "nav-icon-btn nav-cart-btn";
  cart.setAttribute("aria-label", "Cart");
  cart.innerHTML = CART_SVG + '<span class="nav-cart-badge">0</span>';

  const profile = document.createElement("a");
  profile.id = "nav-profile-link";
  profile.href = "/profile";
  profile.className = "nav-icon-btn";
  profile.setAttribute("aria-label", "Profile");
  profile.innerHTML = PROFILE_SVG;

  wrap.appendChild(cart);
  wrap.appendChild(profile);
  return wrap;
}

function makeMobileLinks() {
  const frag = document.createDocumentFragment();

  const cart = document.createElement("a");
  cart.id = "nav-cart-link-mobile";
  cart.href = "/order";
  cart.textContent = "Cart";
  frag.appendChild(cart);

  const profile = document.createElement("a");
  profile.id = "mobile-profile-link";
  profile.href = "/profile";
  profile.textContent = "Profile";
  frag.appendChild(profile);

  return frag;
}

function render(user) {
  const profileLink = document.getElementById("nav-profile-link");
  const mobileProfileLink = document.getElementById("mobile-profile-link");
  [profileLink, mobileProfileLink].forEach(function (el) {
    if (!el) return;
    el.href = user ? "/profile" : "/login";
    el.setAttribute("aria-label", user ? "Profile" : "Login");
  });
}

document.addEventListener("DOMContentLoaded", function () {
  const navLinks = document.querySelector(".nav-links");
  const navCta = document.querySelector(".nav-cta");
  const mobilePanel = document.getElementById("mobile-panel");

  if (navLinks && !document.getElementById("nav-icons")) {
    const icons = makeDesktopIcons();
    if (navCta && navCta.parentNode) {
      navCta.parentNode.insertBefore(icons, navCta);
    } else {
      navLinks.insertAdjacentElement("afterend", icons);
    }
  }
  if (mobilePanel && !document.getElementById("mobile-profile-link")) {
    mobilePanel.appendChild(makeMobileLinks());
  }
  onAuthStateChanged(auth, render);
});

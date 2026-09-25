// Adds a Login / My Account link to the navbar + mobile panel on every page,
// and keeps it in sync with the current sign-in state.
import { auth, onAuthStateChanged, signOut } from "./firebase-config.js";

function makeDesktopLink() {
  const li = document.createElement("li");
  li.id = "auth-nav-item";
  const a = document.createElement("a");
  a.id = "auth-nav-link";
  a.href = "login.html";
  a.textContent = "Login";
  li.appendChild(a);
  return li;
}

function makeMobileLink() {
  const a = document.createElement("a");
  a.id = "auth-nav-link-mobile";
  a.href = "login.html";
  a.textContent = "Login";
  return a;
}

function render(user) {
  const desktopLink = document.getElementById("auth-nav-link");
  const mobileLink = document.getElementById("auth-nav-link-mobile");
  if (!desktopLink || !mobileLink) return;

  if (user) {
    const label = "Hi, " + (user.displayName ? user.displayName.split(" ")[0] : "there");
    [desktopLink, mobileLink].forEach(function (el) {
      el.textContent = label + " (Logout)";
      el.href = "#";
      el.onclick = function (e) {
        e.preventDefault();
        signOut(auth);
      };
    });
  } else {
    [desktopLink, mobileLink].forEach(function (el) {
      el.textContent = "Login";
      el.href = "login.html";
      el.onclick = null;
    });
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const navLinks = document.querySelector(".nav-links");
  const mobilePanel = document.getElementById("mobile-panel");
  if (navLinks && !document.getElementById("auth-nav-item")) {
    navLinks.appendChild(makeDesktopLink());
  }
  if (mobilePanel && !document.getElementById("auth-nav-link-mobile")) {
    mobilePanel.appendChild(makeMobileLink());
  }
  onAuthStateChanged(auth, render);
});

// Site-wide login gate. Include this on every page EXCEPT login.html/signup.html.
// The <html> tag must start with class="auth-checking" (hidden via CSS) so the
// page doesn't flash its content before we know whether the visitor is signed in.
import { auth, onAuthStateChanged } from "./firebase-config.js";

// Safety net: if auth takes too long to respond (slow network, blocked script),
// don't leave the visitor staring at a blank page forever.
const fallback = setTimeout(function () {
  document.documentElement.classList.remove("auth-checking");
}, 4000);

onAuthStateChanged(auth, function (user) {
  clearTimeout(fallback);
  if (!user) {
    window.location.replace("login.html");
  } else {
    document.documentElement.classList.remove("auth-checking");
  }
});

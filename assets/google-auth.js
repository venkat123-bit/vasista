// "Continue with Google" for the login and signup pages.
import {
  auth, db, GoogleAuthProvider, signInWithPopup, getAdditionalUserInfo, doc, setDoc
} from "./firebase-config.js";

const btn = document.getElementById("google-btn");
if (btn) {
  const banner = document.getElementById(btn.dataset.banner);
  const t = (m) => (window.VasistaI18n ? window.VasistaI18n.t(m) : m);
  const show = (m) => { if (banner) { banner.textContent = t(m); banner.style.display = m ? "block" : "none"; } };

  btn.addEventListener("click", async function () {
    show("");
    btn.disabled = true;
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const result = await signInWithPopup(auth, provider);

      // First time with Google: save a basic profile (never overwrites an existing one).
      const info = getAdditionalUserInfo(result);
      if (info && info.isNewUser) {
        try {
          await setDoc(doc(db, "users", result.user.uid), {
            name: result.user.displayName || "", email: result.user.email || "",
            createdAt: new Date().toISOString()
          }, { merge: true });
        } catch (dbErr) { console.warn("Could not save profile:", dbErr); }
      }
      window.location.href = "/";
    } catch (err) {
      console.error("Google sign-in error:", err.code, err);
      let msg = "Google sign-in failed. Please try again.";
      if (err.code === "auth/popup-closed-by-user" || err.code === "auth/cancelled-popup-request") msg = "";
      else if (err.code === "auth/popup-blocked") msg = "Your browser blocked the Google window. Please allow pop-ups for this site and try again.";
      else if (err.code === "auth/unauthorized-domain") msg = "Google sign-in isn't enabled for this website address yet.";
      else if (err.code === "auth/operation-not-allowed") msg = "Google sign-in isn't turned on yet.";
      else if (err.code === "auth/account-exists-with-different-credential") msg = "An account with this email already exists. Log in with your email and password.";
      else if (err.code === "auth/network-request-failed") msg = "Network problem. Please check your connection and try again.";
      show(msg);
      btn.disabled = false;
    }
  });
}

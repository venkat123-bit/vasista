// Login with mobile OTP (SMS) and passwordless email link. Used on login.html.
import {
  auth, db, doc, setDoc, getAdditionalUserInfo,
  RecaptchaVerifier, signInWithPhoneNumber,
  sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink
} from "./firebase-config.js";

const $ = (id) => document.getElementById(id);
const t = (m) => (window.VasistaI18n ? window.VasistaI18n.t(m) : m);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const KEY = "vasistaEmailForSignIn";

const loginForm = $("login-form");
const panels = { phone: $("panel-phone"), emaillink: $("panel-emaillink") };

function showMode(mode) {
  loginForm.hidden = mode !== "password";
  panels.phone.hidden = mode !== "phone";
  panels.emaillink.hidden = mode !== "emaillink";
}
function banner(id, msg) {
  const el = $(id);
  el.textContent = msg ? t(msg) : "";
  el.style.display = msg ? "block" : "none";
}
function fieldError(id, on) { $(id).classList.toggle("invalid", on); }
function setBusy(btnId, labelId, busy, text) {
  $(btnId).disabled = busy;
  if (text) $(labelId).textContent = t(text);
}
async function saveNewUser(result, extra) {
  try {
    const info = getAdditionalUserInfo(result);
    if (info && info.isNewUser) {
      await setDoc(doc(db, "users", result.user.uid),
        Object.assign({ name: result.user.displayName || "", createdAt: new Date().toISOString() }, extra),
        { merge: true });
    }
  } catch (e) { console.warn("Could not save profile:", e); }
}

document.querySelectorAll(".lg-back").forEach((a) =>
  a.addEventListener("click", (e) => { e.preventDefault(); showMode("password"); }));
$("open-phone").addEventListener("click", () => showMode("phone"));
$("open-emaillink").addEventListener("click", () => showMode("emaillink"));

/* ---------------- Mobile OTP ---------------- */
let verifier = null, confirmation = null, timer = null;

function resetVerifier() {
  try { if (verifier) verifier.clear(); } catch (e) {}
  verifier = null;
  $("recaptcha-container").innerHTML = "";
}
function startCooldown() {
  const link = $("resend-otp");
  let left = 30;
  link.style.pointerEvents = "none"; link.style.opacity = ".5";
  clearInterval(timer);
  timer = setInterval(() => {
    left--;
    link.textContent = left > 0 ? t("Resend OTP") + " (" + left + "s)" : t("Resend OTP");
    if (left <= 0) { clearInterval(timer); link.style.pointerEvents = ""; link.style.opacity = ""; }
  }, 1000);
  link.textContent = t("Resend OTP") + " (30s)";
}
function phoneError(err) {
  console.error("Phone sign-in error:", err.code, err);
  switch (err.code) {
    case "auth/invalid-phone-number": return "Enter a valid 10-digit mobile number.";
    case "auth/too-many-requests": return "Too many attempts. Please wait a while and try again.";
    case "auth/quota-exceeded": return "SMS limit reached for today. Please try another login method.";
    case "auth/invalid-verification-code": return "Incorrect OTP. Please check and try again.";
    case "auth/code-expired": return "This OTP has expired. Please request a new one.";
    case "auth/captcha-check-failed": return "Security check failed. Please refresh the page and try again.";
    case "auth/unauthorized-domain": return "OTP login isn't enabled for this website address yet.";
    case "auth/operation-not-allowed": return "OTP login isn't turned on yet.";
    case "auth/billing-not-enabled": return "OTP login isn't available yet. Please use another login method.";
    case "auth/network-request-failed": return "Network problem. Please check your connection and try again.";
    default: return "Couldn't complete OTP login. Please try again.";
  }
}
async function sendOtp() {
  banner("phone-banner", "");
  const num = $("ph-number").value.replace(/\D/g, "");
  const ok = /^\d{10}$/.test(num);
  fieldError("field-phone", !ok);
  if (!ok) return false;
  setBusy("send-otp-btn", "send-otp-label", true, "Sending…");
  try {
    if (!verifier) verifier = new RecaptchaVerifier(auth, "recaptcha-container", { size: "invisible" });
    confirmation = await signInWithPhoneNumber(auth, "+91" + num, verifier);
    $("phone-step1").hidden = true;
    $("phone-step2").hidden = false;
    $("ph-otp").value = ""; $("ph-otp").focus();
    banner("phone-banner", "");
    startCooldown();
    return true;
  } catch (err) {
    resetVerifier();
    banner("phone-banner", phoneError(err));
    return false;
  } finally {
    setBusy("send-otp-btn", "send-otp-label", false, "Send OTP");
  }
}
$("send-otp-btn").addEventListener("click", sendOtp);
$("ph-number").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); sendOtp(); } });

$("resend-otp").addEventListener("click", async (e) => { e.preventDefault(); resetVerifier(); await sendOtp(); });
$("change-number").addEventListener("click", (e) => {
  e.preventDefault(); clearInterval(timer); resetVerifier(); confirmation = null;
  $("phone-step2").hidden = true; $("phone-step1").hidden = false; banner("phone-banner", "");
});

async function verifyOtp() {
  banner("phone-banner", "");
  const code = $("ph-otp").value.replace(/\D/g, "");
  const ok = /^\d{6}$/.test(code);
  fieldError("field-otp", !ok);
  if (!ok || !confirmation) return;
  setBusy("verify-otp-btn", "verify-otp-label", true, "Verifying…");
  try {
    const result = await confirmation.confirm(code);
    await saveNewUser(result, { email: "", phone: result.user.phoneNumber ? result.user.phoneNumber.replace("+91", "") : "" });
    window.location.href = "/";
  } catch (err) {
    banner("phone-banner", phoneError(err));
    setBusy("verify-otp-btn", "verify-otp-label", false, "Verify & Log in");
  }
}
$("verify-otp-btn").addEventListener("click", verifyOtp);
$("ph-otp").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); verifyOtp(); } });

/* ---------------- Email link ---------------- */
function emailLinkError(err) {
  console.error("Email link error:", err.code, err);
  switch (err.code) {
    case "auth/invalid-email": return "Please enter a valid email address.";
    case "auth/too-many-requests": return "Too many attempts. Please wait a while and try again.";
    case "auth/unauthorized-continue-uri":
    case "auth/unauthorized-domain": return "Email link login isn't enabled for this website address yet.";
    case "auth/operation-not-allowed": return "Email link login isn't turned on yet.";
    case "auth/invalid-action-code":
    case "auth/expired-action-code": return "This login link is invalid or has expired. Please request a new one.";
    case "auth/network-request-failed": return "Network problem. Please check your connection and try again.";
    default: return "Couldn't complete email login. Please try again.";
  }
}
async function sendLink() {
  banner("emaillink-banner", "");
  const email = $("el-email").value.trim();
  const ok = EMAIL_RE.test(email);
  fieldError("field-el-email", !ok);
  if (!ok) return;
  setBusy("send-link-btn", "send-link-label", true, "Sending…");
  try {
    await sendSignInLinkToEmail(auth, email, { url: window.location.origin + "/login", handleCodeInApp: true });
    try { localStorage.setItem(KEY, email); } catch (e) {}
    $("emaillink-form").hidden = true;
    $("emaillink-sent").hidden = false;
  } catch (err) {
    banner("emaillink-banner", emailLinkError(err));
  } finally {
    setBusy("send-link-btn", "send-link-label", false, "Send login link");
  }
}
$("send-link-btn").addEventListener("click", sendLink);
$("el-email").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); sendLink(); } });

// Arrived from the link in the email?
(async function completeEmailLink() {
  if (!isSignInWithEmailLink(auth, window.location.href)) return;
  showMode("emaillink");
  $("emaillink-form").hidden = true;
  $("emaillink-working").hidden = false;
  let email = "";
  try { email = localStorage.getItem(KEY) || ""; } catch (e) {}
  if (!email) email = (window.prompt(t("Please enter the email address you used to request the link:")) || "").trim();
  try {
    if (!email) throw { code: "auth/invalid-email" };
    const result = await signInWithEmailLink(auth, email, window.location.href);
    try { localStorage.removeItem(KEY); } catch (e) {}
    await saveNewUser(result, { email: result.user.email || email, phone: "" });
    window.location.replace("/");
  } catch (err) {
    $("emaillink-working").hidden = true;
    $("emaillink-form").hidden = false;
    banner("emaillink-banner", emailLinkError(err));
    window.history.replaceState(null, "", "/login");
  }
})();

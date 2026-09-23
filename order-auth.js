// If the customer is logged in, prefill their name/phone on the order page.
import { auth, db, onAuthStateChanged, doc, getDoc } from "./firebase-config.js";

onAuthStateChanged(auth, async function (user) {
  if (!user) return;

  const nameInput = document.getElementById("cust-name");
  const phoneInput = document.getElementById("cust-phone");

  if (nameInput && !nameInput.value && user.displayName) {
    nameInput.value = user.displayName;
  }

  try {
    const snap = await getDoc(doc(db, "users", user.uid));
    if (snap.exists()) {
      const profile = snap.data();
      if (nameInput && !nameInput.value && profile.name) nameInput.value = profile.name;
      if (phoneInput && !phoneInput.value && profile.phone) phoneInput.value = profile.phone;
    }
  } catch (err) {
    // Firestore may not be enabled yet — safe to ignore.
    console.warn("Could not load saved profile:", err);
  }
});

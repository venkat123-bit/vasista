// Visitor counter: one count per browser session, stored in Firestore doc stats/visits.
import { db } from "./firebase-config.js";
import { doc, getDoc, setDoc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

(async function () {
  var box = document.getElementById("visit-count");
  if (!box) return;
  var ref = doc(db, "stats", "visits");
  var counted = false;
  try { counted = sessionStorage.getItem("vasista_counted") === "1"; } catch (e) {}
  try {
    var count = null;
    if (!counted) {
      try { await updateDoc(ref, { count: increment(1) }); }
      catch (e) { await setDoc(ref, { count: 1 }); }   // first ever visit creates the doc
      try { sessionStorage.setItem("vasista_counted", "1"); } catch (e) {}
    }
    var snap = await getDoc(ref);
    if (snap.exists()) count = snap.data().count;
    if (typeof count === "number") {
      box.querySelector("b").textContent = count.toLocaleString("en-IN");
      box.hidden = false;
    }
  } catch (err) { /* counter is best-effort; stays hidden */ }
})();

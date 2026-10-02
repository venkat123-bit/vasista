// Customer reviews — shown on pages that contain <div id="reviews-root"></div>.
// Reads are public; writing needs a logged-in customer (Firebase Auth).
// Reviews live in the Firestore collection "reviews" (see firestore.rules.txt).
import { auth, db, onAuthStateChanged } from "./firebase-config.js";
import {
  collection, query, orderBy, limit, getDocs, doc, setDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

var root = document.getElementById("reviews-root");
if (root) {
  var css =
    ".rv{max-width:900px;margin:0 auto}" +
    ".rv-sum{display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;margin:0 0 22px;color:var(--green-deep)}" +
    ".rv-big{font:700 2.4rem 'Cormorant Garamond',serif}" +
    ".rv-stars{color:var(--gold);letter-spacing:2px;font-size:1.15rem}" +
    ".rv-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:14px}" +
    ".rv-card{background:#fff;border:1px solid var(--cream-line);border-radius:16px;padding:16px 18px;box-shadow:0 1px 2px rgba(14,61,43,.06),0 4px 14px rgba(14,61,43,.07)}" +
    ".rv-card p{margin:8px 0;line-height:1.5;font-size:.95rem;overflow-wrap:anywhere}" +
    ".rv-meta{font-size:.8rem;color:#6b6453}" +
    ".rv-empty{text-align:center;color:#6b6453;margin:0 0 20px}" +
    ".rv-form{background:var(--paper);border:1px solid var(--cream-line);border-radius:18px;padding:18px;margin:26px auto 0;max-width:560px}" +
    ".rv-form h3{margin:0 0 10px;font-family:'Cormorant Garamond',serif;color:var(--green-deep)}" +
    ".rv-form select,.rv-form textarea{width:100%;font:inherit;padding:10px 12px;border:1px solid var(--cream-line);border-radius:12px;background:#fff;margin-top:8px}" +
    ".rv-pick{display:flex;gap:4px;margin-top:4px}" +
    ".rv-pick button{background:none;border:0;font-size:2rem;line-height:1;color:#d8cfb4;cursor:pointer;padding:2px}" +
    ".rv-pick button.on{color:var(--gold)}" +
    ".rv-btn{margin-top:12px;background:var(--green-deep);color:#fff8e6;border:0;border-radius:999px;padding:11px 24px;font:600 .95rem 'Work Sans',sans-serif;cursor:pointer;text-decoration:none;display:inline-block}" +
    ".rv-btn[disabled]{opacity:.6}" +
    ".rv-note{font-size:.85rem;margin:8px 0 0;color:#6b6453}" +
    ".rv-center{text-align:center}";
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  var esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  var stars = function (n) { return "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n); };
  var slug = function (s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "all"; };

  var productNames = [];
  if (window.VasistaCatalog) {
    window.VasistaCatalog.products.forEach(function (p) {
      if (productNames.indexOf(p.name) < 0) productNames.push(p.name);
    });
  }

  root.innerHTML =
    '<div class="rv"><div id="rv-summary"></div><div id="rv-list" class="rv-list"></div><div id="rv-form"></div></div>';
  var summaryEl = document.getElementById("rv-summary");
  var listEl = document.getElementById("rv-list");
  var formEl = document.getElementById("rv-form");

  var loadReviews = function () {
    return getDocs(query(collection(db, "reviews"), orderBy("createdAt", "desc"), limit(30)))
      .then(function (snap) {
        var items = snap.docs.map(function (d) { return d.data(); });
        if (!items.length) {
          summaryEl.innerHTML = '<p class="rv-empty">No reviews yet — be the first to share your experience.</p>';
          listEl.innerHTML = "";
          return;
        }
        var avg = items.reduce(function (a, r) { return a + (r.rating || 0); }, 0) / items.length;
        summaryEl.innerHTML =
          '<div class="rv-sum"><span class="rv-big">' + avg.toFixed(1) + '</span>' +
          '<span class="rv-stars">' + stars(Math.round(avg)) + '</span>' +
          '<span>' + items.length + ' review' + (items.length > 1 ? "s" : "") + '</span></div>';
        listEl.innerHTML = items.map(function (r) {
          var when = r.createdAt && r.createdAt.toDate
            ? r.createdAt.toDate().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "";
          return '<div class="rv-card"><span class="rv-stars">' + stars(r.rating | 0) + '</span>' +
            '<p>' + esc(r.text || "") + '</p>' +
            '<div class="rv-meta"><strong>' + esc(r.name || "Customer") + '</strong>' +
            (r.product && r.product !== "All products" ? " · " + esc(r.product) : "") +
            (when ? " · " + when : "") + '</div></div>';
        }).join("");
      })
      .catch(function () {
        summaryEl.innerHTML = '<p class="rv-empty">Reviews are unavailable right now. Please try again later.</p>';
      });
  };

  var renderForm = function (user) {
    if (!user) {
      formEl.innerHTML = '<div class="rv-center"><a class="rv-btn" href="/login">Log in to write a review</a></div>';
      return;
    }
    var rating = 0;
    var opts = ['<option>All products</option>'].concat(productNames.map(function (n) {
      return "<option>" + esc(n) + "</option>";
    })).join("");
    formEl.innerHTML =
      '<div class="rv-form"><h3>Write a review</h3>' +
      '<div class="rv-pick" id="rv-pick">' +
      [1, 2, 3, 4, 5].map(function (i) { return '<button type="button" data-v="' + i + '" aria-label="' + i + ' star">★</button>'; }).join("") +
      '</div>' +
      '<select id="rv-product" aria-label="Product">' + opts + '</select>' +
      '<textarea id="rv-text" rows="4" maxlength="500" placeholder="How was the taste, freshness and delivery?"></textarea>' +
      '<button class="rv-btn" id="rv-send" type="button">Submit review</button>' +
      '<p class="rv-note" id="rv-msg">Posting again for the same product updates your earlier review.</p></div>';

    var pick = document.getElementById("rv-pick");
    pick.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      rating = +b.dataset.v;
      pick.querySelectorAll("button").forEach(function (x) { x.classList.toggle("on", +x.dataset.v <= rating); });
    });
    document.getElementById("rv-send").addEventListener("click", function () {
      var msg = document.getElementById("rv-msg");
      var text = document.getElementById("rv-text").value.trim();
      var product = document.getElementById("rv-product").value;
      if (!rating) { msg.textContent = "Please tap the stars to rate."; return; }
      if (text.length < 3) { msg.textContent = "Please write a few words."; return; }
      var btn = this; btn.disabled = true; msg.textContent = "Posting…";
      var pk = slug(product);
      var name = (user.displayName || "Customer").trim().slice(0, 60) || "Customer";
      setDoc(doc(db, "reviews", user.uid + "_" + pk), {
        uid: user.uid, pk: pk, name: name, product: product,
        rating: rating, text: text.slice(0, 500), createdAt: serverTimestamp()
      }).then(function () {
        msg.textContent = "Thank you for your review!";
        document.getElementById("rv-text").value = "";
        return loadReviews();
      }).catch(function () {
        msg.textContent = "Couldn't post your review. Please try again.";
      }).then(function () { btn.disabled = false; });
    });
  };

  loadReviews();
  onAuthStateChanged(auth, renderForm);
}

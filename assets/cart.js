const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { computeTotal, PRICES } = require("./pricing");

admin.initializeApp();

// Key ID is public (safe in code). Swap to your rzp_live_ ID when you go live.
const KEY_ID = "rzp_live_Tw3DPYUGp5x8BR";
// Key Secret lives in Firebase Secret Manager: firebase functions:secrets:set RAZORPAY_KEY_SECRET
const KEY_SECRET = defineSecret("RAZORPAY_KEY_SECRET");

const OPTS = { region: "asia-south1", secrets: [KEY_SECRET], maxInstances: 10 };

// Coupons (no minimum order). Must match assets/cart.js
//   percent: value% off the items total (rounded to the nearest rupee)
//   flat:    value rupees off the items total (never more than the items total)
const COUPONS = {
  SAVE20: { type: "percent", value: 20 },
  FLAT100: { type: "flat", value: 100 },
};
// Delivery rule used after a coupon is applied. Must match pricing.js and assets/cart.js
const FREE_DELIVERY_MIN = 299;
const DELIVERY_FEE = 40;

const str = (v, max) => String(v == null ? "" : v).trim().slice(0, max);

// 1) Create a Razorpay order. The amount is calculated HERE from our own price list.
exports.createOrder = onCall(OPTS, async (req) => {
  const { items, customer, coupon } = req.data || {};
  const pickup = !!(customer && customer.pickup);
  // DEBUG: shows exactly what the website sent (remove later if you like)
  console.log("createOrder items:", JSON.stringify(items));

  let total = computeTotal(items, pickup);
  if (!total) {
    // DEBUG: shows which items do not match the price list
    if (Array.isArray(items)) {
      items.forEach((i) => {
        const key = String(i && i.name) + "|" + String(i && i.grams);
        if (!PRICES[key]) console.warn("No price found for key:", key);
        const q = Number(i && i.qty);
        if (!Number.isInteger(q) || q < 1 || q > 100) console.warn("Bad qty for", key, ":", i && i.qty);
      });
    } else {
      console.warn("items is not an array:", typeof items);
    }
    throw new HttpsError("invalid-argument", "Your cart is invalid. Please refresh and try again.");
  }

  // Coupon (the cart was already validated by computeTotal above)
  let couponUsed = "";
  const code = str(coupon, 20).toUpperCase();
  if (code) {
    const rule = COUPONS[code];
    if (!rule) {
      throw new HttpsError("invalid-argument", "Invalid coupon code.");
    }
    // Items total without delivery (pickup = no delivery charge), then discount, then delivery rule
    const itemsTotal = computeTotal(items, true);
    const discount = Math.min(
      rule.type === "percent" ? Math.round((itemsTotal * rule.value) / 100) : rule.value,
      itemsTotal
    );
    const after = itemsTotal - discount;
    const delivery = !pickup && after < FREE_DELIVERY_MIN ? DELIVERY_FEE : 0;
    total = after + delivery;
    couponUsed = code;
    if (total < 1) {
      throw new HttpsError("invalid-argument", "This order total is ₹0, so online payment isn't needed. Please choose Cash on Delivery / Pay at pickup.");
    }
  }

  const c = customer || {};
  const cust = {
    name: str(c.name, 80), phone: str(c.phone, 15), address: str(c.address, 300),
    city: str(c.city, 80), pincode: str(c.pincode, 6), landmark: str(c.landmark, 120),
    lat: str(c.lat, 20), lng: str(c.lng, 20),
  };
  if (!cust.name || !/^\d{10}$/.test(cust.phone) ||
      (!pickup && (!cust.address || !cust.city || !/^\d{6}$/.test(cust.pincode)))) {
    throw new HttpsError("invalid-argument", "Please fill in your details correctly.");
  }

  const rzp = new Razorpay({ key_id: KEY_ID, key_secret: KEY_SECRET.value().trim() });

  let order;
  try {
    order = await rzp.orders.create({
      amount: total * 100, // paise
      currency: "INR",
      notes: { name: cust.name, phone: cust.phone, coupon: couponUsed },
    });
  } catch (err) {
    console.error("Razorpay order error:", err && err.statusCode, JSON.stringify(err && err.error));
    throw new HttpsError("internal", "Could not start the payment. Please try again.");
  }

  await admin.firestore().collection("orders").doc(order.id).set({
    items: items.map((i) => ({ name: str(i.name, 80), grams: str(i.grams, 20), qty: Number(i.qty) })),
    customer: cust,
    total,
    coupon: couponUsed,
    status: "created",
    uid: req.auth ? req.auth.uid : null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { orderId: order.id, amount: order.amount, currency: order.currency, keyId: KEY_ID, total };
});

// 2) Verify the payment signature Razorpay returns after a successful payment.
exports.verifyPayment = onCall(OPTS, async (req) => {
  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.data || {};
  if (!orderId || !paymentId || !signature) throw new HttpsError("invalid-argument", "Missing payment details.");

  const expected = crypto.createHmac("sha256", KEY_SECRET.value().trim()).update(orderId + "|" + paymentId).digest("hex");
  const a = Buffer.from(expected), b = Buffer.from(String(signature));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw new HttpsError("permission-denied", "Payment could not be verified.");
  }

  const ref = admin.firestore().collection("orders").doc(orderId);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError("not-found", "Order not found.");
  await ref.update({
    status: "paid", paymentId, paidAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return { ok: true, total: snap.data().total };
});

// Razorpay online payment. Talks to Firebase Cloud Functions (functions/index.js):
//   createOrder  -> server works out the price and creates the Razorpay order
//   verifyPayment -> server checks Razorpay's signature before the order counts as paid
// Exposes window.VasistaPay.pay({ items, customer }) -> Promise<{ paymentId, orderId }>
import { functions, httpsCallable } from "./firebase-config.js";

const createOrder = httpsCallable(functions, "createOrder");
const verifyPayment = httpsCallable(functions, "verifyPayment");

function friendly(err) {
  const m = (err && err.message) || "";
  return new Error(m && !/internal|unavailable|deadline/i.test(m) ? m : "Could not start the payment. Please try again.");
}

window.VasistaPay = {
  pay: async function (payload) {
    let order;
    try {
      order = (await createOrder(payload)).data;
    } catch (err) {
      throw friendly(err);
    }
    const c = payload.customer;
    return new Promise(function (resolve, reject) {
      const rzp = new window.Razorpay({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amount,
        currency: order.currency,
        name: "Vasista Food and Traders",
        description: "Order payment",
        prefill: { name: c.name, contact: c.phone },
        theme: { color: "#7c1f2b" },
        modal: { ondismiss: function () { reject(new Error("cancelled")); } },
        handler: async function (resp) {
          try {
            await verifyPayment(resp);
            resolve({ paymentId: resp.razorpay_payment_id, orderId: resp.razorpay_order_id });
          } catch (err) {
            reject(new Error("We received your payment but could not verify it automatically. Please WhatsApp us with Payment ID " + resp.razorpay_payment_id + "."));
          }
        },
      });
      rzp.on("payment.failed", function () { /* Razorpay shows the error and lets the customer retry */ });
      rzp.open();
    });
  },
};

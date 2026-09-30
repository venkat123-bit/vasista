// Shared product catalogue + pricing rules. Used by the Products page (order.js)
// and the Cart page (cart.js), so prices and images are defined in one place.
(function () {
  var P = "assets/products/";
  var CRUNCH = P + "12x-crunch.png";
  var MILLET = P + "multi-millet-chips.png";
  var OATS   = P + "oats-chips.png";
  var RAGI   = P + "ragi-chips.png";
  var QUINOA = P + "quinoa-chips.png";

  var products = [
    { name: "12X Crunch", grams: "100g", price: 120,  cat: "crunch", img: CRUNCH },
    { name: "12X Crunch", grams: "200g", price: 210,  cat: "crunch", img: CRUNCH },
    { name: "12X Crunch", grams: "300g", price: 299,  cat: "crunch", img: CRUNCH },
    { name: "12X Crunch", grams: "500g", price: 550,  cat: "crunch", img: CRUNCH },
    { name: "12X Crunch", grams: "1kg",  price: 1000, cat: "crunch", img: CRUNCH },
    { name: "Multi Millet Chips", grams: "80g", price: 120, cat: "chips", img: MILLET },
    { name: "Oats Chips",   grams: "80g", price: 120, cat: "chips", img: OATS },
    { name: "Quinoa Chips", grams: "80g", price: 120, cat: "chips", img: QUINOA },
    { name: "Ragi Chips",   grams: "80g", price: 120, cat: "chips", img: RAGI },
    { name: "Quinoa Flakes Mix", grams: "100g", price: 120, cat: "mixes", img: P + "crunch-mix-bowl.jpg" },
    { name: "Nutri Nuts",    grams: "100g", price: 120, cat: "nuts",  img: P + "nutri-nuts-jar.jpg" },
    { name: "Mexican Bites", grams: "100g", price: 120, cat: "mixes", img: P + "mexican-bites-bowl.jpg" },
    { name: "Pro Beans",     grams: "100g", price: 120, cat: "nuts",  img: P + "roasted-soy-beans.jpg" },
    { name: "Millet Mixture (Puff)", grams: "200g", price: 150, cat: "mixes", img: P + "pea-millet-mixture.jpg" },
    { name: "Quinoa Flakes Mix", grams: "200g", price: 250, cat: "mixes", img: P + "crunch-mix-bowl.jpg" },
    { name: "Nutri Nuts",    grams: "250g", price: 250, cat: "nuts",  img: P + "nutri-nuts-jar.jpg" },
    { name: "Mexican Bites", grams: "250g", price: 250, cat: "mixes", img: P + "mexican-bites-bowl.jpg" },
    { name: "Pro Beans",     grams: "250g", price: 250, cat: "nuts",  img: P + "roasted-soy-beans.jpg" }
  ];

  // Quantity discount: 1 item = full price, each extra item adds 3% off, capped at 30%.
  var DISCOUNT_STEP = 3, DISCOUNT_CAP = 30;
  function discountPercent(q) {
    return q <= 1 ? 0 : Math.min((q - 1) * DISCOUNT_STEP, DISCOUNT_CAP);
  }
  function unitPriceFor(basePrice, q) {
    var pct = discountPercent(q);
    return { unit: Math.round(basePrice * (1 - pct / 100)), pct: pct };
  }
  function rupee(n) { return "\u20b9" + Number(n).toLocaleString("en-IN"); }
  function find(name, grams) {
    for (var i = 0; i < products.length; i++) {
      if (products[i].name === name && products[i].grams === grams) return products[i];
    }
    return null;
  }

  window.VasistaCatalog = {
    products: products, find: find, rupee: rupee,
    discountPercent: discountPercent, unitPriceFor: unitPriceFor
  };
})();

// Details shown on each product's page (/product.html?name=...).
// Keyed by the product name used in catalog.js. Everything here is copied from the
// printed labels. Per-100g nutrition rows are [label, value]. Products with no entry
// still get a page (photos, sizes, price, reviews) — just without these sections.
// To add details for another product, copy one block and change the name + values.
(function () {
  var CHIP_BADGES = ["Vegan · Low GI", "Gluten free", "High fibre", "Plant protein"];

  window.VasistaProductInfo = {
    "Multi Millet Chips": {
      tagline: "Crispy & crunchy · Indian Masala",
      desc: "Crispy, crunchy chips made from a blend of millets and finished with a spicy Indian masala seasoning.",
      badges: CHIP_BADGES,
      ingredients: ["Millets (Jowar, Bajra, Ragi, Foxtail, Little Millet etc.)", "Rice Flour", "Tapioca Starch", "Spices (Indian Masala)", "Salt", "Rice Bran Oil", "Vitamins, Natural and Nature Identical Flavourings"],
      nutrition: [["Energy", "507.6 kcal"], ["Total Carbohydrates", "66.66 g"], ["Dietary Fibre", "6.18 g"], ["Total Fat", "15.28 g"], ["Saturated Fat", "3.52 g"], ["Total Sugars", "0 g"], ["Added Sugars", "0 g"], ["Cholesterol", "0 mg"], ["Sodium", "0.73 g"]]
    },
    "Oats Chips": {
      tagline: "Crispy & crunchy · Cream & Onion",
      desc: "Crispy oat-based chips with a creamy onion flavour.",
      badges: CHIP_BADGES,
      ingredients: ["Rolled Oats Flour", "Urad Dal Flour", "Rice Flour", "Tapioca Starch", "Salt", "Spices", "Rice Bran Oil", "Vitamins, Natural and Nature Identical Flavourings"],
      nutrition: [["Energy", "507.6 kcal"], ["Total Carbohydrates", "66.66 g"], ["Dietary Fibre", "6.18 g"], ["Total Fat", "15.28 g"], ["Saturated Fat", "3.52 g"], ["Total Sugars", "0 g"], ["Added Sugars", "0 g"], ["Cholesterol", "0 mg"], ["Sodium", "0.73 g"]]
    },
    "Ragi Chips": {
      tagline: "Crispy & crunchy · Indian Masala",
      desc: "Crunchy finger millet (ragi) chips with a bold Indian masala flavour.",
      badges: ["Vegan · Low GI", "Gluten free", "High fibre", "Plant protein", "Rich in calcium"],
      ingredients: ["Finger Millet Flour", "Urad Dal Flour", "Rice Flour", "Tapioca Starch", "Salt", "Spices (Indian Masala)", "Rice Bran Oil", "Natural and Nature Identical Flavourings"],
      nutrition: [["Energy", "508.6 kcal"], ["Total Carbohydrates", "71.4 g"], ["Dietary Fibre", "11.9 g"], ["Total Fat", "3.6 g"], ["Saturated Fat", "1.1 g"], ["Total Sugars", "0 g"], ["Added Sugars", "0 g"], ["Cholesterol", "0 mg"], ["Sodium", "0.54 g"]]
    },
    "Quinoa Chips": {
      tagline: "Crispy & crunchy · Jalapeño",
      desc: "Crunchy quinoa chips with a spicy jalapeño kick.",
      badges: CHIP_BADGES,
      ingredients: ["Quinoa Flour", "Whole Pea Flour", "Rice Flour", "Tapioca Starch", "Rice Bran Oil", "Spices", "Jalapeño (Natural)", "Vitamins, Natural and Nature Identical Flavourings"],
      nutrition: [["Energy", "541.5 kcal"], ["Total Carbohydrates", "49.61 g"], ["Dietary Fibre", "7.89 g"], ["Total Fat", "31.69 g"], ["Saturated Fat", "3.65 g"], ["Total Sugars", "1.40 g"], ["Added Sugars", "0 g"], ["Cholesterol", "0 mg"], ["Sodium", "0.85 g"]]
    },
    "Pro Beans": {
      tagline: "Crunchy roasted · High protein super snack",
      desc: "Crunchy roasted beans packed with protein. A filling, high-protein snack for every day.",
      badges: ["High protein", "Roasted"],
      ingredients: ["Edamame", "Black Soyabean", "Soybean", "Salt"],
      nutrition: [["Energy", "423 kcal"], ["Protein", "41.1 g"], ["Carbohydrates", "23 g"], ["Sugar", "3 g"], ["Fat", "15.3 g"], ["Saturated Fat", "2.5 g"], ["Trans Fat", "0 g"], ["Cholesterol", "0 mg"], ["Sodium", "590 mg"], ["Fibre", "14 g"]],
      bestBefore: "12 months"
    },
    "Mexican Bites": {
      tagline: "Crispy & crunchy snack mix",
      desc: "A crispy, crunchy snack mix of oats rings, corn chips, Spanish corn, pumpkin seeds and jowar puff, seasoned with garlic and black pepper.",
      badges: ["High dietary fibres"],
      ingredients: ["Oats Rings", "Corn Chips", "Spanish Corns", "Pumpkin Seeds", "Jowar Puff", "Garlic", "Black Pepper", "Salt"],
      nutrition: [["Energy", "747.70 kcal"], ["Protein", "9.89 g"], ["Carbohydrates", "65.63 g"], ["Sugar", "14.07 g"], ["Total Fat", "19.18 g"]],
      bestBefore: "12 months"
    },
    "Millet Mixture (Puff)": {
      tagline: "Roasted and ready to eat",
      desc: "A roasted, ready-to-eat mixture of pearl millet, sorghum, bengal gram and peanuts with ginger, garlic and chilli.",
      badges: ["Roasted and ready to eat", "Rich source of dietary fibre"],
      ingredients: ["Pearl Millet", "Sorghum", "Bengal Gram", "Peanuts", "Wheat", "Dry Ginger Powder", "Black Salt", "Garlic Powder", "Red Chilli Powder"],
      nutrition: [["Energy", "457 kcal"], ["Protein", "11.1 g"], ["Total Fat", "14.7 g"], ["Saturated Fat", "1.6 g"], ["Trans Fat", "0 g"], ["Cholesterol", "0 mg"], ["Carbohydrate", "68.5 g"], ["Total Sugars", "2.8 g"], ["Dietary Fibre", "9.7 g"], ["Sodium", "0.9 g"]],
      bestBefore: "6 months"
    }
  };
})();

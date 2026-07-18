import fs from "fs";
import path from "path";

const outDir = "app/public/cards";
fs.mkdirSync(outDir, { recursive: true });

const downloads = {
  "american-express-green-card.png":
    "https://icm.aexp-static.com/acquisition/card-art/NUS000000313_480x304_straight_withname.png",
  "bank-of-america-premium-rewards.png":
    "https://www.bankofamerica.com/content/images/ContextualSiteGraphics/CreditCardArt/en_US/Approved_PCM/bofa_prmsigcm_255x158.png",
  "bank-of-america-unlimited-cash-rewards.png":
    "https://www.bankofamerica.com/content/images/ContextualSiteGraphics/CreditCardArt/en_US/Approved_PCM/bofa_ucr_fifa_8284155_e_300.png",
  "blue-cash-everyday-card-from-american-express.png":
    "https://icm.aexp-static.com/acquisition/card-art/NUS000000329_480x304_straight_withname.png",
  "blue-cash-preferred-card-from-american-express.png":
    "https://icm.aexp-static.com/acquisition/card-art/NUS000000305_480x304_straight_withname.png",
  "capital-one-quicksilver-cash-rewards.png":
    "https://ecm.capitalone.com/WCM/card/products/quicksilver_cardart.png",
  "capital-one-venture-rewards.png":
    "https://ecm.capitalone.com/WCM/card/products/venture_cardart_prim_323x203-1/mobile.png",
  "capital-one-ventureone-rewards.png":
    "https://ecm.capitalone.com/WCM/card/products/ventureone_cardart_prim_323x203.png",
  "chase-freedom-flex.png":
    "https://creditcards.chase.com/content/dam/jpmc-marketplace/card-art/freedom_flex_card_alt.png",
  "citi-custom-cash.webp":
    "https://aemapi.citi.com/content/dam/cfs/uspb/usmkt/cards/en/static/images/citi-custom-cash-credit-card/hero-PDP--M-XS--custom-cash.webp",
  "delta-skymiles-gold-american-express-card.png":
    "https://icm.aexp-static.com/Internet/Acquisition/US_en/AppContent/OneSite/category/cardarts/gold-delta-skymiles.png",
  "delta-skymiles-platinum-american-express-card.png":
    "https://icm.aexp-static.com/acquisition/card-art/NUS000000383_480x304_straight_withname.png",
  "delta-skymiles-reserve-american-express-card.png":
    "https://icm.aexp-static.com/acquisition/card-art/NUS000000385_480x304_straight_withname.png",
  // Manual / better targets
  "american-express-platinum-card.png":
    "https://icm.aexp-static.com/Internet/Acquisition/US_en/AppContent/OneSite/category/cardarts/platinum-card.png",
  "chase-sapphire-reserve.png":
    "https://creditcards.chase.com/content/dam/jpmc-marketplace/card-art/sapphire_reserve_card.png",
  "chase-freedom-unlimited.png":
    "https://creditcards.chase.com/content/dam/jpmc-marketplace/card-art/freedom_unlimited_card.png",
  "capital-one-venture-x-rewards.png":
    "https://ecm.capitalone.com/WCM/card/products/venturex-card-art.png",
};

const map = {};

for (const [file, url] of Object.entries(downloads)) {
  const id = file.replace(/\.(png|jpe?g|webp)$/i, "");
  const dest = path.join(outDir, file);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      redirect: "follow",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 1000) throw new Error(`too small ${buf.length}`);
    fs.writeFileSync(dest, buf);
    map[id] = `/cards/${file}`;
    console.log("ok", file, buf.length);
  } catch (e) {
    console.log("fail", file, e.message);
  }
}

// Existing / previously downloaded files
for (const file of fs.readdirSync(outDir)) {
  if (!/\.(png|jpe?g|webp)$/i.test(file)) continue;
  const id = file.replace(/\.(png|jpe?g|webp)$/i, "");
  // normalize amex-gold alias
  if (id === "amex-gold") map["american-express-gold-card"] = `/cards/${file}`;
  if (id === "capital-one-venture-x")
    map["capital-one-venture-x-rewards"] = `/cards/${file}`;
  map[id] = map[id] || `/cards/${file}`;
}

fs.writeFileSync(
  "app/src/data/card-art-map.json",
  JSON.stringify(map, null, 2),
);
console.log("map size", Object.keys(map).length);

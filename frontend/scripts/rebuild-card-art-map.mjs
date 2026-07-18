import fs from "fs";
import path from "path";

const outDir = "app/public/cards";
const map = {};

const aliases = {
  "amex-gold": "american-express-gold-card",
  "american-express-gold-card": "american-express-gold-card",
  "capital-one-venture-x": "capital-one-venture-x-rewards",
};

for (const file of fs.readdirSync(outDir)) {
  if (!/\.(png|jpe?g|webp)$/i.test(file)) continue;
  const id = file.replace(/\.(png|jpe?g|webp)$/i, "");
  const src = `/cards/${file}`;
  map[id] = src;
  if (aliases[id]) map[aliases[id]] = src;
  // Prefer canonical amex-gold file for american-express-gold-card if both exist
}

// Prefer higher-quality american-express-gold-card.png when present
if (fs.existsSync(path.join(outDir, "american-express-gold-card.png"))) {
  map["american-express-gold-card"] = "/cards/american-express-gold-card.png";
  map["amex-gold"] = "/cards/american-express-gold-card.png";
}
if (fs.existsSync(path.join(outDir, "capital-one-venture-x.png"))) {
  map["capital-one-venture-x-rewards"] = "/cards/capital-one-venture-x.png";
  map["capital-one-venture-x"] = "/cards/capital-one-venture-x.png";
}

fs.writeFileSync(
  "app/src/data/card-art-map.json",
  JSON.stringify(map, null, 2) + "\n",
);

const catalog = JSON.parse(
  fs.readFileSync("data/credit_cards.json", "utf8"),
).cards;
const covered = catalog.filter((c) => map[c.id]);
const missing = catalog.filter((c) => !map[c.id]).map((c) => c.id);
console.log(`mapped files: ${Object.keys(map).length}`);
console.log(`catalog coverage: ${covered.length}/${catalog.length}`);
console.log("missing:", missing.join(", "));

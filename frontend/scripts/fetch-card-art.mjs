/**
 * Scrape official card pages for product art and download into app/public/cards.
 * Usage: node scripts/fetch-card-art.mjs
 */
import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const APP_CARDS = path.join(ROOT, "app/public/cards");
const CATALOG = path.join(ROOT, "data/credit_cards.json");
const OUT_MAP = path.join(ROOT, "app/src/data/card-art-map.json");
const FIRECRAWL_DIR = path.join(ROOT, ".firecrawl/card-art");

fs.mkdirSync(APP_CARDS, { recursive: true });
fs.mkdirSync(FIRECRAWL_DIR, { recursive: true });

const catalog = JSON.parse(fs.readFileSync(CATALOG, "utf8"));

const SCORE = (url) => {
  const u = url.toLowerCase();
  let s = 0;
  if (/card-art|cardart|card_art|productimage|product-image|cardarts/.test(u)) s += 50;
  if (/\/cards\/|credit-card|card\.png|card\.jpg|card\.webp|card\.jpeg/.test(u)) s += 20;
  if (/\.(png|jpe?g|webp)(\?|$)/.test(u)) s += 15;
  if (/logo|icon|svg|sprite|arrow|ham-menu|shimmer|gleam|badge/.test(u)) s -= 40;
  if (/hero|photography|getty|holiday/.test(u)) s -= 10;
  return s;
};

function pickBestImage(images, cardName) {
  const urls = (images || [])
    .map((x) => (typeof x === "string" ? x : x?.url || x?.src))
    .filter(Boolean);
  const named = cardName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "[^/]*");
  const scored = urls
    .map((url) => {
      let s = SCORE(url);
      if (new RegExp(named.slice(0, 24), "i").test(url)) s += 25;
      return { url, s };
    })
    .sort((a, b) => b.s - a.s);
  return scored[0]?.s > 10 ? scored[0].url : null;
}

function scrapeImages(url, outFile) {
  try {
    execFileSync(
      "firecrawl",
      ["scrape", url, "-f", "images", "-o", outFile, "--pretty"],
      { stdio: ["ignore", "pipe", "pipe"], timeout: 90000 },
    );
    return true;
  } catch {
    return false;
  }
}

async function download(url, dest) {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 CardinalCardArtBot/1.0" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 800) throw new Error("file too small");
  fs.writeFileSync(dest, buf);
}

const map = {};
const existing = new Set(
  fs.readdirSync(APP_CARDS).map((f) => f.replace(/\.(png|jpe?g|webp)$/i, "")),
);

// Keep already-mapped aliases for existing files
const knownFiles = {
  "chase-sapphire-preferred": "chase-sapphire-preferred.png",
  "chase-sapphire-reserve": "chase-sapphire-reserve.png",
  "chase-freedom-unlimited": "chase-freedom-unlimited.png",
  "american-express-gold-card": "amex-gold.png",
  "capital-one-venture-x-rewards": "capital-one-venture-x.png",
  "citi-strata-premier": "citi-strata-premier.webp",
  "wells-fargo-autograph": "wells-fargo-autograph.png",
  "bilt-mastercard": "bilt-mastercard.png",
};
for (const [id, file] of Object.entries(knownFiles)) {
  if (fs.existsSync(path.join(APP_CARDS, file))) map[id] = `/cards/${file}`;
}

const cards = catalog.cards;
let done = 0;
for (const card of cards) {
  if (map[card.id]) {
    done++;
    continue;
  }
  // Skip if we already downloaded by id
  const existingMatch = [...existing].find(
    (e) => e === card.id || e.includes(card.id.slice(0, 18)),
  );
  if (existingMatch) {
    const file = fs
      .readdirSync(APP_CARDS)
      .find((f) => f.startsWith(existingMatch));
    if (file) {
      map[card.id] = `/cards/${file}`;
      done++;
      continue;
    }
  }

  const outJson = path.join(FIRECRAWL_DIR, `${card.id}.json`);
  process.stdout.write(`scrape ${card.id}... `);
  const ok = scrapeImages(card.official_url, outJson);
  if (!ok || !fs.existsSync(outJson)) {
    console.log("scrape failed");
    continue;
  }
  const raw = JSON.parse(fs.readFileSync(outJson, "utf8"));
  const images = raw.images || raw.data?.images || [];
  const best = pickBestImage(images, card.name);
  if (!best) {
    console.log("no art");
    continue;
  }
  const ext = (best.match(/\.(png|jpe?g|webp)/i) || [, "png"])[1].toLowerCase();
  const file = `${card.id}.${ext === "jpeg" ? "jpg" : ext}`;
  const dest = path.join(APP_CARDS, file);
  try {
    await download(best, dest);
    map[card.id] = `/cards/${file}`;
    existing.add(card.id);
    console.log(`ok ${file}`);
    done++;
  } catch (e) {
    console.log(`dl fail ${e.message}`);
  }
}

fs.writeFileSync(OUT_MAP, JSON.stringify(map, null, 2));
console.log(`\nMapped ${Object.keys(map).length}/${cards.length} cards → ${OUT_MAP}`);

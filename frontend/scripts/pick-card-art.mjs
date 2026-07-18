import fs from "fs";
import path from "path";

const dir = ".firecrawl/card-art";
const map = {};

function score(url) {
  const u = url.toLowerCase();
  let s = 0;
  if (/card-art|cardart|card_art|productimage|cardarts|\/card\/products\//.test(u)) s += 50;
  if (/creditcardart|approved_pcm|card-art\/credit-cards/.test(u)) s += 45;
  if (/\.(png|jpe?g|webp)(\?|$)/.test(u)) s += 15;
  if (/logo|icon|svg|sprite|arrow|shimmer|gleam|badge|ham-menu|photography|getty/.test(u)) s -= 40;
  return s;
}

for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".json"))) {
  const id = f.replace(/\.json$/, "");
  const raw = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
  const images = raw.images || raw.data?.images || [];
  const urls = images
    .map((x) => (typeof x === "string" ? x : x?.url || x?.src))
    .filter(Boolean);
  const scored = urls
    .map((url) => ({ url, s: score(url) }))
    .sort((a, b) => b.s - a.s);
  const best = scored[0];
  console.log(id, best ? `${best.s} ${best.url}` : "NONE");
  if (best && best.s > 10) map[id] = best.url;
}

fs.writeFileSync(
  ".firecrawl/card-art-candidates.json",
  JSON.stringify(map, null, 2),
);
console.log("candidates", Object.keys(map).length);

// Generates a 4in x 1.5in wraparound hot sauce label ("Love Hurts") at 600 DPI.
// Usage: node scripts/make-label.mjs
import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const asset = (n) => path.join(root, "app/assets", n);
const out = path.join(root, "app/assets/love-hurts-label.png");

const DPI = 600;
const W = 4 * DPI; // 2400
const H = 1.5 * DPI; // 900
const HALF = W / 2;

const ink = "#f1ece4";

// Background: starry sky covering the whole label
const bg = await sharp(asset("stars.png"))
  .resize(W, H, { fit: "cover", position: "centre" })
  .png()
  .toBuffer();

// Front: moon + couple crop with a soft feathered edge
const moonW = 560;
const moonH = 700;
const moon = await sharp(asset("kn+background.png"))
  .extract({ left: 1560, top: 300, width: 1350, height: 1680 })
  .resize(moonW, moonH)
  .toBuffer();
const feather = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${moonW}" height="${moonH}">
    <defs><radialGradient id="g" cx="50%" cy="50%" r="50%">
      <stop offset="78%" stop-color="#fff" stop-opacity="1"/>
      <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
    </radialGradient></defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
  </svg>`
);
const moonFeathered = await sharp(moon)
  .composite([{ input: feather, blend: "dest-in" }])
  .png()
  .toBuffer();

// Back: ornamental corner frames, trimmed of transparent padding
const frameH = 600;
const trimFrame = async (n) =>
  sharp(asset(n)).trim().resize({ height: frameH }).png().toBuffer({ resolveWithObject: true });
const left = await trimFrame("left corner.png");
const right = await trimFrame("right corner.png");
const frameMargin = 120;
const frameY = (H - frameH) / 2;

const titleSvg = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <g font-family="Luminari" fill="${ink}" text-anchor="middle">
      <text x="900" y="400" font-size="160">Love</text>
      <text x="900" y="560" font-size="160">Hurts</text>
    </g>
    <g font-family="Copperplate" fill="${ink}" text-anchor="middle" letter-spacing="10">
      <text x="900" y="660" font-size="54">HOT SAUCE</text>
    </g>
  </svg>`
);

const cx = HALF + HALF / 2;
const ingredients = [
  "Tears of Our Enemies",
  "Actual Ghost Peppers",
  "Nightmares",
  "Blood",
];
const lineH = 62;
const ingStartY = 400;
const backSvg = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <g fill="${ink}" text-anchor="middle">
      <text x="${cx}" y="320" font-family="Copperplate" font-size="46" letter-spacing="12">INGREDIENTS</text>
      <g font-family="Baskerville" font-style="italic" font-size="44">
        ${ingredients
          .map((l, i) => `<text x="${cx}" y="${ingStartY + i * lineH}">${l}</text>`)
          .join("")}
      </g>
    </g>
  </svg>`
);

await sharp(bg)
  .composite([
    { input: moonFeathered, left: 70, top: (H - moonH) / 2 },
    { input: titleSvg, left: 0, top: 0 },
    { input: left.data, left: HALF + frameMargin, top: frameY },
    { input: right.data, left: W - frameMargin - right.info.width, top: frameY },
    { input: backSvg, left: 0, top: 0 },
  ])
  .withMetadata({ density: DPI })
  .png()
  .toFile(out);

console.log(`wrote ${out} (${W}x${H} @ ${DPI}dpi = 4in x 1.5in)`);

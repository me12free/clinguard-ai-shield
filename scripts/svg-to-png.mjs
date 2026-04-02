/**
 * Rasterize SVG files to PNG using Playwright (Chromium).
 * Usage: node scripts/svg-to-png.mjs
 * Outputs: docs/Diagrams/png/*.png (and public/png/*.png for public/*.svg)
 */
import { chromium } from "playwright";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function parseViewBox(svg) {
  const m = svg.match(/viewBox=["']([^"']+)["']/i);
  if (m) {
    const parts = m[1].trim().split(/[\s,]+/).map(Number);
    if (parts.length >= 4 && !parts.slice(0, 4).some((n) => Number.isNaN(n))) {
      return {
        w: Math.max(1, Math.ceil(parts[2])),
        h: Math.max(1, Math.ceil(parts[3])),
      };
    }
  }
  const wm = svg.match(/\swidth="(\d+(?:\.\d+)?)"/i);
  const hm = svg.match(/\sheight="(\d+(?:\.\d+)?)"/i);
  if (wm && hm) {
    const w = Math.ceil(Number(wm[1]));
    const h = Math.ceil(Number(hm[1]));
    if (w > 0 && h > 0) return { w, h };
  }
  return null;
}

function prepareSvgForRaster(svg) {
  return svg
    .replace(/^\uFEFF/, "")
    .replace(/\swidth="100%"/gi, "")
    .replace(/\swidth='100%'/gi, "");
}

async function convertFile(browser, svgAbs, pngAbs, scale = 2) {
  const svg = await fs.readFile(svgAbs, "utf8");
  const vb = parseViewBox(svg);
  if (!vb) {
    console.warn(`Skip (no viewBox): ${svgAbs}`);
    return;
  }
  const prepared = prepareSvgForRaster(svg);
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<style>html,body{margin:0;padding:0;overflow:hidden;background:#fff}
svg{display:block;width:${vb.w}px!important;height:${vb.h}px!important;max-width:none}</style></head><body>${prepared}</body></html>`;

  const context = await browser.newContext({
    viewport: { width: vb.w, height: vb.h },
    deviceScaleFactor: scale,
  });
  const page = await context.newPage();
  await page.setContent(html, { waitUntil: "load" });
  await page.screenshot({
    path: pngAbs,
    type: "png",
    clip: { x: 0, y: 0, width: vb.w, height: vb.h },
  });
  await context.close();
  console.log(`Wrote ${path.relative(root, pngAbs)} (${vb.w * scale}x${vb.h * scale} px)`);
}

async function collectSvgs(dir) {
  const names = await fs.readdir(dir);
  return names.filter((n) => n.endsWith(".svg")).map((n) => path.join(dir, n));
}

async function main() {
  const diagramsDir = path.join(root, "docs", "Diagrams");
  const diagramsOut = path.join(diagramsDir, "png");
  const publicDir = path.join(root, "public");
  const publicOut = path.join(publicDir, "png");

  await fs.mkdir(diagramsOut, { recursive: true });
  const diagramSvgs = await collectSvgs(diagramsDir);
  const publicSvgs = await fs
    .readdir(publicDir)
    .then((names) => names.filter((n) => n.endsWith(".svg")).map((n) => path.join(publicDir, n)))
    .catch(() => []);

  if (diagramSvgs.length === 0 && publicSvgs.length === 0) {
    console.error("No SVG files found.");
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: true });

  try {
    for (const svgPath of diagramSvgs) {
      const base = path.basename(svgPath, ".svg");
      await convertFile(browser, svgPath, path.join(diagramsOut, `${base}.png`));
    }
    if (publicSvgs.length > 0) {
      await fs.mkdir(publicOut, { recursive: true });
      for (const svgPath of publicSvgs) {
        const base = path.basename(svgPath, ".svg");
        await convertFile(browser, svgPath, path.join(publicOut, `${base}.png`));
      }
    }
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

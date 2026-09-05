// Gera PNG (fundo transparente) a partir dos vetores do kit, no tamanho que você precisar.
//
//   node marca/kit/gera-png.mjs 4000                      -> todos os SVGs, lado maior em 4000 px, em marca/kit/png/
//   node marca/kit/gera-png.mjs 2000 logo-redondo panda-joinha
//   node marca/kit/gera-png.mjs 1200 --pasta ~/Desktop/kit
//
// Roda de dentro de panda-mimo/ (usa o Chromium do Playwright já instalado para o guardião:
// `npm install && npx playwright install chromium`).
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const aqui = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const lado = Number(args[0]);
if (!lado || lado < 64) {
  console.error("uso: node marca/kit/gera-png.mjs <lado maior em px> [nomes...] [--pasta destino]");
  process.exit(1);
}
let destino = path.join(aqui, "png");
const i = args.indexOf("--pasta");
if (i > 0) { destino = path.resolve(args[i + 1]); args.splice(i, 2); }
const pedidos = args.slice(1);
const svgs = fs.readdirSync(path.join(aqui, "svg")).filter((f) => f.endsWith(".svg"))
  .filter((f) => !pedidos.length || pedidos.includes(f.replace(/\.svg$/, "")));
if (!svgs.length) { console.error("nenhum SVG encontrado para", pedidos.join(", ")); process.exit(1); }
fs.mkdirSync(destino, { recursive: true });

const exe = process.env.CHROMIUM_PATH;
const browser = await chromium.launch({ ...(exe ? { executablePath: exe } : {}), args: ["--allow-file-access-from-files"] });
const page = await browser.newPage({ viewport: { width: lado, height: lado }, deviceScaleFactor: 1 });
for (const f of svgs) {
  const svg = fs.readFileSync(path.join(aqui, "svg", f), "utf8");
  const vb = svg.match(/viewBox="([\d.\s-]+)"/);
  const [, , vw, vh] = vb[1].split(/\s+/).map(Number);
  const esc = vw >= vh ? lado / vw : lado / vh;
  const W = Math.round(vw * esc), H = Math.round(vh * esc);
  await page.setViewportSize({ width: W, height: H });
  await page.setContent(`<!doctype html><style>html,body{margin:0;background:transparent}svg{display:block;width:${W}px;height:${H}px}</style>${svg.replace(/<\?xml[^>]*>/, "")}`);
  const saida = path.join(destino, f.replace(/\.svg$/, `-${lado}.png`));
  await page.screenshot({ path: saida, omitBackground: true });
  console.log(`${f} -> ${path.relative(process.cwd(), saida)} (${W}x${H})`);
}
await browser.close();

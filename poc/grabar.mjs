// Grabador de consultas: abre un navegador VISIBLE en el portal de un ente.
// Vos hacés la consulta a mano (incluido cualquier "No soy un robot"); el
// script guarda las páginas y respuestas de datos que devolvió el portal, para
// poder escribir después el conector de esa fuente.
//
// No guarda encabezados (cookies, tokens de sesión) y enmascara contraseñas,
// códigos y tokens en lo que se envía y se recibe.
//
// Uso: npm run grabar -- <api|tgi|epe|litoralgas|assa>
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const FUENTES = {
  api: "https://www.santafe.gob.ar/e-in-liq-deuda/",
  tgi: "https://siat.rosario.gob.ar/siat/seg/Login.do?method=anonimo&url=/gde/AdministrarLiqDeuda.do%3Fmethod%3DinicializarContr&id=14",
  epe: "https://www.epe.santafe.gov.ar/",
  litoralgas: "https://www.litoralgas.com.ar/ov/login",
  assa: "https://ov.aguassantafesinas.com.ar/oficina-virtual/login",
};

const fuente = process.argv[2];
if (!FUENTES[fuente]) {
  console.error(`Uso: npm run grabar -- <${Object.keys(FUENTES).join("|")}>`);
  process.exit(1);
}

const SENSIBLE = /pass|clave|codges|token|captcha|altcha|secret|auth/i;
const MAX_CUERPO = 300_000;

function enmascararUrl(u) {
  const url = new URL(u);
  for (const k of [...url.searchParams.keys()]) if (SENSIBLE.test(k)) url.searchParams.set(k, "***");
  return url.toString();
}

function enmascararJson(v) {
  if (Array.isArray(v)) return v.map(enmascararJson);
  if (v && typeof v === "object") {
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, SENSIBLE.test(k) ? "***" : enmascararJson(x)]));
  }
  return v;
}

function enmascararCuerpo(texto, tipo = "") {
  if (!texto) return texto;
  if (tipo.includes("json") || /^\s*[[{]/.test(texto)) {
    try { return enmascararJson(JSON.parse(texto)); } catch { /* no era JSON */ }
  }
  if (tipo.includes("x-www-form-urlencoded") || /^[\w.%-]+=/.test(texto)) {
    const p = new URLSearchParams(texto);
    for (const k of [...p.keys()]) if (SENSIBLE.test(k)) p.set(k, "***");
    return Object.fromEntries(p);
  }
  // HTML: se enmascaran los value de inputs ocultos o sensibles.
  return texto.replace(/(<input[^>]*(?:type=["']?(?:hidden|password)|name=["'][^"']*(?:pass|clave|codges|token|captcha|altcha))[^>]*value=["'])[^"']*/gi, "$1***");
}

const registros = [];
const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

page.on("response", async (res) => {
  const req = res.request();
  if (!["document", "xhr", "fetch"].includes(req.resourceType())) return;
  const tipo = res.headers()["content-type"] ?? "";
  let cuerpo = null;
  if (/json|html|text|xml/.test(tipo)) {
    try { cuerpo = enmascararCuerpo((await res.text()).slice(0, MAX_CUERPO), tipo); } catch { /* redirección sin cuerpo */ }
  }
  registros.push({
    cuando: new Date().toISOString(),
    metodo: req.method(),
    url: enmascararUrl(res.url()),
    status: res.status(),
    tipo,
    enviado: enmascararCuerpo(req.postData() ?? null, req.headers()["content-type"] ?? ""),
    cuerpo,
  });
  console.log(`  ${req.method()} ${res.status()} ${new URL(res.url()).pathname}`);
});

console.log(`\nAbriendo ${fuente}. Hacé la consulta de deuda a mano, como siempre.`);
console.log(`Cuando veas el resultado (deuda o "sin deuda"), cerrá la ventana.\n`);
await page.goto(FUENTES[fuente], { waitUntil: "domcontentloaded", timeout: 60_000 }).catch((e) => console.error(e.message));
await new Promise((resolve) => browser.on("disconnected", resolve));

mkdirSync("poc/resultados", { recursive: true });
const archivo = `poc/resultados/${fuente}-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
writeFileSync(archivo, JSON.stringify({ fuente, registros }, null, 2));
console.log(`\nListo: ${registros.length} respuestas en ${archivo}`);
console.log("Revisalo antes de compartirlo: contiene los datos de tu cuenta (deuda, dirección).");

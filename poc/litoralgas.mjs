// Prueba Litoral Gas: abre un Chrome VISIBLE, inicia sesión con tus datos del
// .env y graba las respuestas JSON que la propia Oficina Virtual pide a su API
// (deuda, facturas impagas, vencimientos). No llama a nada por su cuenta.
// Si aparece un captcha, lo resolvés vos en la ventana.
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const { LITORALGAS_USUARIO: usuario, LITORALGAS_PASSWORD: password } = process.env;
if (!usuario || !password) {
  console.error("Faltan LITORALGAS_USUARIO y/o LITORALGAS_PASSWORD en el archivo .env");
  process.exit(1);
}

const MINUTOS = Number(process.env.MINUTOS ?? 3);
const capturas = [];
const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

page.on("response", async (res) => {
  const url = res.url();
  if (!/\/(Contratos|Clientes)\//.test(url)) return;
  let cuerpo = null;
  try { cuerpo = await res.json(); } catch { /* PDF u otro formato */ }
  const endpoint = new URL(url).pathname;
  capturas.push({ endpoint, status: res.status(), tipo: res.headers()["content-type"], cuerpo });
  console.log(`  ← ${res.status()} ${endpoint}`);
});

await page.goto("https://www.litoralgas.com.ar/ov/login", { waitUntil: "networkidle" });
await page.locator("input[type=password]").waitFor();
// Puede haber un aviso con botón "Aceptar" tapando el formulario.
const aceptar = page.getByRole("button", { name: "Aceptar" });
if (await aceptar.isVisible().catch(() => false)) await aceptar.click();
// Angular Material: el usuario es un input de texto sin name (mat-input-0).
await page.locator('input[type="text"], input[type="email"]').first().fill(usuario);
await page.locator('input[type="password"]').first().fill(password);
await page.getByRole("button", { name: "Ingresar" }).click();

console.log(`\nSesión iniciada (si no, completala en la ventana).`);
console.log(`Navegá a "Pagos y Deudas" y a tus facturas. Grabo ${MINUTOS} minutos; cerrá la ventana para terminar antes.\n`);
await Promise.race([page.waitForTimeout(MINUTOS * 60_000), page.waitForEvent("close", { timeout: 0 })]).catch(() => {});

mkdirSync("poc/resultados", { recursive: true });
writeFileSync("poc/resultados/litoralgas.json", JSON.stringify(capturas, null, 2));
console.log(`\nListo: ${capturas.length} respuestas en poc/resultados/litoralgas.json`);
const resumen = Object.entries(Object.groupBy(capturas, (c) => c.endpoint)).map(([e, cs]) => `${e} (${cs.map((c) => c.status).join(",")})`);
console.log(resumen.join("\n"));
await browser.close().catch(() => {});

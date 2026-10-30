// Prueba de accesos: ¿cada portal responde desde esta conexión y qué
// controles tiene? Solo lee la página de entrada; no envía ningún formulario.
const PORTALES = [
  ["API Santa Fe (deuda Inmobiliario)", "https://www.santafe.gob.ar/e-in-liq-deuda/"],
  ["TGI (SIAT, código de gestión)", "https://siat.rosario.gob.ar/siat/seg/Login.do?method=anonimo&url=/gde/AdministrarLiqDeuda.do%3Fmethod%3DinicializarContr&id=14"],
  ["EPE (sitio)", "https://www.epe.santafe.gov.ar/"],
  ["Litoral Gas (Oficina Virtual)", "https://www.litoralgas.com.ar/ov/login"],
  ["ASSA (Oficina Virtual)", "https://ov.aguassantafesinas.com.ar/oficina-virtual/login"],
];

const CONTROLES = { altcha: /altcha/i, recaptcha: /recaptcha/i, hcaptcha: /hcaptcha/i, turnstile: /turnstile/i, captcha: /captcha/i };

for (const [nombre, url] of PORTALES) {
  try {
    const r = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(20000) });
    const html = await r.text();
    const controles = Object.entries(CONTROLES).filter(([, re]) => re.test(html)).map(([k]) => k);
    const campos = [...html.matchAll(/<input[^>]*name=["']?([\w.-]+)/gi)].map((m) => m[1]).filter((n) => !/^(sesion|action|hash)/i.test(n));
    console.log(`\n## ${nombre}\n  HTTP ${r.status} · ${html.length} bytes · ${r.url}`);
    console.log(`  Controles: ${controles.join(", ") || "ninguno detectado"}`);
    if (campos.length) console.log(`  Campos: ${[...new Set(campos)].slice(0, 15).join(", ")}`);
  } catch (e) {
    console.log(`\n## ${nombre}\n  ERROR: ${e.cause?.code ?? e.name} ${e.message}`);
  }
}

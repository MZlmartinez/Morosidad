# Validación de fuentes — Rosario

Estado al 30/10/2026. **Basado en fuentes secundarias** (búsqueda web: notas de
prensa, guías, FAQ oficiales). Ningún portal se pudo abrir todavía desde el entorno
de desarrollo (dominios bloqueados por la política de red). Cada punto marcado
"sin verificar" se confirma con una prueba real con identificadores de ejemplo.

| Ente | Identificador | ¿Login? | Canal sin login | Viabilidad |
|---|---|---|---|---|
| API Santa Fe (Inmobiliario) | Partida, 17 dígitos | No (según FAQ) | Consulta/liquidación de deuda en santafe.gov.ar/tramites; boletas en santafe.gob.ar/apiboletas | **Alta** |
| Municipalidad de Rosario (TGI) | Nº de cuenta **+ código de gestión personal** | No, pero pide los dos datos | "Pagar TGI" en rosario.gob.ar; MuniBot con solo la cuenta muestra vencimientos (sin verificar) | **Media-alta** |
| EPE (luz) | Nº de suministro | **Sí** (Oficina Virtual: cuenta + suministros registrados) | No confirmado | **Media** |
| ASSA (agua) | Punto de suministro / unidad de facturación (las fuentes no coinciden) | **Sí** para Oficina Virtual | WhatsApp 341 695-0008 con punto de suministro devuelve deuda (no automatizable de forma legítima) | **Media** |
| Litoral Gas | Nº de cliente | **Sí** (email + contraseña en /ov/login) | No encontrado; la OV tiene API JSON con endpoints de deuda | **Media-alta** |

## Detalle

### API Santa Fe — Impuesto Inmobiliario
- Sin partida no se puede consultar, liquidar ni imprimir boletas (FAQ de la API).
- Partida: 17 dígitos sin signos ni espacios (manual de liquidación de deuda).
- Consulta: santafe.gov.ar/tramites → Impuestos → Impuesto Inmobiliario →
  "visualización, liquidación de deuda y año corriente".
- Boletas: santafe.gob.ar/apiboletas con la partida.
- Existe suscripción para recibir la boleta por mail (canal alternativo, ver abajo).
- Sin verificar: captcha, formato de la respuesta, si devuelve importe por período.

### TGI — Municipalidad de Rosario
- Acceso con nº de cuenta **y código de gestión personal** (o CUIT + clave fiscal
  del titular vía ARCA, que no aplica a una inmobiliaria).
- Impacto en el modelo: la carga inicial necesita un dato más por propiedad.
  Dónde figura el código en la boleta: sin verificar.
- Existe adhesión a Boleta Digital por mail.

### EPE
- Oficina Virtual (web y app): consulta de estado de deuda, PDF de pago,
  reimpresión de factura, libre deuda, vencimientos.
- Requiere crear una cuenta y **registrar suministros** en ella. Sin verificar:
  si una misma cuenta admite muchos suministros de distintos titulares.

### ASSA
- Oficina Virtual: registro con email, contraseña, datos personales y la unidad
  de facturación / punto de suministro de la factura. Permite consultar deuda y
  generar comprobante de liquidación.
- WhatsApp oficial con punto de suministro devuelve la deuda. Automatizar
  WhatsApp con clientes no oficiales viola los términos de Meta: descartado como
  canal productivo, útil para validar a mano.

### Litoral Gas
- Oficina Virtual con email y contraseña; "Pagos y Deudas" y "Reimpresión de
  comprobantes" detrás del login. No se encontró consulta pública por nº de cliente.

## Verificado contra los portales (30/10/2026)

Inspección de los formularios públicos, sin datos reales todavía.

### API Santa Fe — consulta de deuda: `https://www.santafe.gob.ar/e-in-liq-deuda/`
- Formulario POST `frm_liqinmob`, `action=Ingreso::buscaPartida`, campos `nupartida`
  (sin guiones ni espacios) y `fecha_calc` (fecha de cálculo, dd/mm/aaaa).
- Sin login. Protección **ALTCHA** (prueba de trabajo SHA-256 que resuelve el
  navegador, sin interacción humana; `maxNumber` 50000).
- Horario del servicio: 03 a 24 h lun–sáb, 08 a 24 h domingos → el worker no
  debe consultar fuera de esa franja.
- `e-in-boletas/` (misma partida, también con ALTCHA) emite cuotas del año, pero
  **no informa si están pagas**: el estado sale de `e-in-liq-deuda`.

### TGI — `rosario.gob.ar/inicio/pagar-tgi`
- Tres accesos: perfil digital, código de gestión (SIAT, acceso "anónimo") o ARCA.
- **Clave para inmobiliarias:** con perfil digital verificado se pueden *asociar
  cuentas de terceros* (nº de cuenta + código de gestión) y ver deuda, credencial
  de pago y recibos de todas desde un solo perfil.
- La consulta con código de gestión vive en `siat.rosario.gob.ar`. **Bloqueo
  geográfico confirmado:** desde el exterior se corta el handshake TLS; desde una
  conexión argentina responde 200. El worker tiene que correr desde Argentina.
- Formulario (probado desde Argentina): campos `cuenta.numeroCuenta`,
  `cuenta.codGesPer`, `cuenta.idRecurso`; **sin captcha detectado** en la página
  de entrada (falta ver si aparece al enviar).

### Litoral Gas — Oficina Virtual `https://www.litoralgas.com.ar/ov/`
- SPA Angular contra una API JSON del mismo dominio, con JWT (`/auth/login`).
- Endpoints relevantes: `Clientes/LinkContract` (vincular varios contratos a una
  cuenta), `Contratos/DebtSummary`, `Contratos/OverdueBills`,
  `Contratos/OverdueBillsAll`, `Contratos/ProximosVencimientos`,
  `Contratos/ReprintBill`, `Contratos/LastBill`, `Contratos/FreeDebt`.
- Menú de la OV (verificado con cuenta real): "Mis facturas", "Facturas
  adeudadas", "Estado de deuda", **"Vincular Cliente"** (varios clientes por
  cuenta). El cliente se identifica como `srvcode/cntnumber` (ej. `10108/02`).
- **"Estado de deuda" (informe PDF/mail) tiene reCAPTCHA** → no se automatiza.
  Falta ver si "Facturas adeudadas" (`Contratos/OverdueBills`) lo tiene.
- Captcha también en el reset de contraseña. **Viabilidad sube a alta** si una
  cuenta admite muchos contratos vinculados (falta confirmar con una cuenta real).

### ASSA — Oficina Virtual `https://ov.aguassantafesinas.com.ar/oficina-virtual/login`
- Dominio distinto del sitio institucional. Login con email y contraseña
  protegido con **Cloudflare Turnstile** (verificación antibot). Automatizarlo
  implicaría eludir ese control: **no se automatiza**. Alternativas: canal
  oficial/convenio con ASSA, boleta por mail, o consulta manual asistida.

### EPE
- `www.epe.santafe.gov.ar` responde 500 desde el exterior y 200 desde Argentina
  (redirige a `epe.santafe.gov.ar/institucional/`): mismo bloqueo geográfico.
  Falta revisar la Oficina Virtual.

## Consecuencias para el diseño

1. **Dos tipos de adaptador:** público por identificador (API, TGI) y con sesión
   (EPE, ASSA, Litoral Gas). Los segundos necesitan una cuenta de portal por
   inmobiliaria, con sus suministros registrados, y guardar credenciales cifradas.
2. **Identificadores compuestos:** TGI necesita cuenta + código de gestión
   personal. `cuentas_servicio.identificador` pasa a ser un objeto por proveedor.
3. **Canal por email como complemento:** API, TGI y las distribuidoras ofrecen
   factura/boleta digital por mail. Redirigir esos mails a una casilla de la app
   da boletas y códigos de pago **sin scraping**, pero **no dice si se pagaron**:
   el estado de pago sigue necesitando el portal.
4. **Agregador (Red Link / Banelco):** no hay API pública para terceros. Solo vía
   acuerdo comercial; queda como línea a explorar si los scrapers no escalan.

## Para cerrar la validación

- Habilitar en el entorno: `www.santafe.gob.ar`, `www.santafe.gov.ar`,
  `www.rosario.gob.ar`, `www.epe.santafe.gov.ar`, `www.litoralgas.com.ar`,
  `www.aguassantafesinas.com.ar`.
- Un identificador real por ente (partida; cuenta TGI + código de gestión;
  suministro EPE; punto de suministro ASSA; cliente Litoral Gas).
- Para EPE, ASSA y Litoral Gas: una cuenta de Oficina Virtual de prueba.

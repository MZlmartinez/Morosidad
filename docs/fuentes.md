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
| Litoral Gas | Nº de cliente | **Sí** (email + contraseña en /ov/login) | No encontrado | **Baja-media** |

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

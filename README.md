# Morosidad

Consulta de deudas de impuestos y servicios por propiedad, para inmobiliarias.
Arranca en Rosario con cinco entes: Impuesto Inmobiliario (API Santa Fe), TGI
(Municipalidad de Rosario), Litoral Gas, Aguas Santafesinas y EPE.

> **Estado: prototipo con datos simulados.** Ningún ente está conectado todavía
> (`lib/adaptadores/simulado.ts`).

## Correr

```bash
npm install
npm run dev
```

- `/` — tablero: estado de cada propiedad por ente y monto vencido.
- `/propiedad/[id]` — detalle por ente, períodos adeudados y boletas.
- `/importar` — formato del CSV de carga inicial.

## Diseño

- **La propiedad se identifica por partida inmobiliaria** (API Santa Fe): es del
  inmueble y no cambia con cada inquilino. Cada cuenta de servicio cuelga de ella.
- **Estados:** al día / por vencer / vencida / **sin dato**. Una consulta fallida
  (captcha, portal caído, cambio de formato) nunca se muestra como "al día".
- **Un adaptador por ente** (`lib/adaptadores/tipos.ts`). Sumar una ciudad = sumar
  entradas en `lib/proveedores.ts` y sus adaptadores.
- **Frecuencia:** semanal más unos días después de cada vencimiento, no diaria (los
  pagos tardan días en acreditarse y consultar de más provoca bloqueos).
- **Base de datos:** `supabase/schema.sql` (Postgres/Supabase, con RLS por
  inmobiliaria). Todavía no está conectada.

## Pendiente

1. Validar a mano cada portal: ¿alcanza el identificador o pide login? ¿captcha?
   ¿muestra importe adeudado? ¿boleta descargable?
2. Escribir los adaptadores reales, empezando por la API.
3. Worker que consulta periódicamente y guarda cada resultado como snapshot.
4. Autenticación por inmobiliaria e importación real del CSV.
5. Alertas: deuda vencida con contrato próximo a terminar.

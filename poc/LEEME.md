# Pruebas de concepto (Windows, Mac o Linux)

Se corren **desde una conexión en Argentina**: TGI y EPE no responden desde el exterior.

## Una sola vez

1. Instalar [Node.js LTS](https://nodejs.org) y [Git](https://git-scm.com/download/win).
2. En PowerShell:
   ```powershell
   cd $HOME
   git clone https://github.com/MZlmartinez/Morosidad.git morosidad
   cd morosidad
   npm install
   npx playwright install chromium
   copy .env.example .env
   notepad .env
   ```
   En el Bloc de notas completá tu usuario y contraseña de Litoral Gas y guardá.

## Pruebas

```powershell
npm run poc:accesos
```
Lista qué portales responden y qué controles (captcha, etc.) tienen.

```powershell
npm run poc:litoralgas
```
Abre un Chrome visible e inicia sesión. Navegá a "Pagos y Deudas" y a tus
facturas: el script graba las respuestas de la Oficina Virtual durante 3 minutos
(o hasta que cierres la ventana) en `poc/resultados/litoralgas.json`.

`poc/resultados/` no se sube a GitHub: contiene tus datos.

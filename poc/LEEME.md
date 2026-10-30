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
   (Ya no hace falta completar .env: el grabador no usa credenciales guardadas.)

## Pruebas

```powershell
npm run poc:accesos
```
Lista qué portales responden y qué controles (captcha, etc.) tienen.

```powershell
npm run grabar -- tgi
```
Abre un navegador visible en el portal (`api`, `tgi`, `epe`, `litoralgas` o `assa`).
Hacé la consulta de deuda **a mano**, como siempre (incluido cualquier "No soy un
robot"), y cerrá la ventana cuando veas el resultado. Queda guardado en
`poc/resultados/<fuente>-<fecha>.json`: lo que devolvió el portal, sin cookies y
con contraseñas, códigos y tokens enmascarados.

`poc/resultados/` no se sube a GitHub: contiene tus datos.

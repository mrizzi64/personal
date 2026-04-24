# Deploy – Ticker Landing

## Objetivo
Publicar la landing de cotizaciones (HTML/CSS/JS + proxy Node) en un entorno accesible públicamente.

## Opciones de despliegue
1. **Render.com / Railway / Fly.io** (Node server ligero):
   - Permiten desplegar la app Node (`server.mjs`) que sirve los estáticos y actúa como proxy.
   - Ideal si queremos mantener el proxy en producción para evitar CORS y centralizar la fuente de datos.
2. **Netlify (static hosting + serverless)** ← *opción implementada*
   - Frontend estático (`app/`) deployado como assets.
   - Función serverless (`netlify/functions/quotes.js`) que replica la lógica del proxy consultando Stooq.
   - GitHub Actions (`.github/workflows/deploy-netlify.yml`) automatiza el deploy en cada push a `main`.
3. **GitHub Pages + Cloudflare Worker**:
   - GitHub Pages para los archivos estáticos.
   - Cloudflare Worker para `api/quotes` que envía la consulta a Stooq y agrega CORS.

Para un MVP rápido utilizamos **Netlify + GitHub Actions**. Se mantienen otros escenarios como referencia.

---

## Deploy en Render (Node completo)

### Requisitos previos
- Cuenta en Render.
- Repositorio Git con el proyecto (incluyendo `server.mjs`, `app/`, etc.).

### Pasos
1. **Configurar repo**
   - Confirmar que el proxy se ejecute con `node server.mjs`.
   - Verificar que el puerto se lea desde `process.env.PORT` (ya soportado en `server.mjs`).
2. **Crear servicio web en Render**
   - Ingresar a Render → New → Web Service.
   - Conectar el repositorio (GitHub, GitLab o Bitbucket).
   - Seleccionar la rama (`main`) y establecer:
     - **Environment:** Node.
     - **Build command:** `npm install` (si se agregan dependencias) o dejar vacío si no hay package.json.
     - **Start command:** `node server.mjs`.
   - Free tier suele ser suficiente (ver límites de uso según plan).
3. **Deploy**
   - Render instalará dependencias (si existen) y ejecutará `node server.mjs`.
   - Confirmar en logs que aparece `Servidor escuchando en http://...` (Render asigna un dominio propio).
4. **Probar**
   - Acceder a `https://<tu-servicio>.onrender.com/`.
   - Verificar que la landing carga y `/api/quotes` responde JSON.
5. **Config adicional**
   - Si Stooq impone rate limits, considerar cache interno en `server.mjs`.
   - Opcional: configurar horario de dormancia del servicio o health check.

### Notas Render
- Si el repo no tiene `package.json`, Render crea una instalación Node simple. Para mayor control se puede agregar un `package.json` con script start.
- Render requiere que el servidor escuche en `0.0.0.0` y use el `PORT` definido.

---

## Deploy en Netlify (estático + serverless)

### Pipeline automatizado
- Workflow: `.github/workflows/deploy-netlify.yml`
- Disparador: `push` a `main`.
- Pasos: checkout → instalar Netlify CLI → `netlify deploy --prod` (publica `app/` + funciones).
- Requiere secretos: `NETLIFY_AUTH_TOKEN` y `NETLIFY_SITE_ID` configurados en el repositorio.


### Requisitos previos
- Cuenta en Netlify y repositorio Git.
- Netlify CLI (opcional para pruebas locales de serverless).

### Estructura recomendada
```
projects/ticker-landing/
├── app/               # front-end (index.html, styles.css, app.js)
├── netlify/functions/
│   └── quotes.js      # función serverless (proxy Stooq)
├── netlify.toml
└── ...
```

### Configuración
1. **Crear `netlify/functions/quotes.js`**
   ```js
   export const handler = async (event) => {
     const symbols = event.queryStringParameters.symbols || "NVDA,PLTR,QQQ,SPY";
     const stooqSymbols = symbols
       .split(",")
       .map((s) => s.trim().toUpperCase())
       .filter(Boolean)
       .map((s) => (s.endsWith(".US") ? s : `${s}.US`))
       .join("+");

     const apiUrl = `https://stooq.com/q/l/?s=${stooqSymbols}&f=snt1d1pc&h&e=csv`;

     try {
       const response = await fetch(apiUrl, {
         headers: { "User-Agent": "Mozilla/5.0 (TickerLanding/1.0)" },
       });
       if (!response.ok) {
         throw new Error(`Stooq respondió ${response.status}`);
       }

       const body = await response.text();
       // reutilizar parseCsvQuotes del server actual o replicar lógica aquí
       // ...
       return {
         statusCode: 200,
         headers: { "Access-Control-Allow-Origin": "*" },
         body: JSON.stringify({ quotes }),
       };
     } catch (error) {
       return {
         statusCode: 502,
         headers: { "Access-Control-Allow-Origin": "*" },
         body: JSON.stringify({ error: "No se pudo obtener datos", details: error.message }),
       };
     }
   };
   ```
2. **`netlify.toml`**
   ```toml
   [build]
   command = ""
   publish = "projects/ticker-landing/app"

   [functions]
   directory = "projects/ticker-landing/netlify/functions"

   [[redirects]]
   from = "/api/quotes"
   to = "/.netlify/functions/quotes"
   status = 200
  ```
3. **Deploy**
   - Conectar el repositorio en Netlify.
   - Asegurarse de que `app/app.js` apunte a `/api/quotes` (ya está).
   - Deploy manual vía CLI: `netlify deploy --prod` (opcional).
4. **Probar**
   - Navegar al dominio generado por Netlify.
   - Confirmar que la landing y `/api/quotes` (función) funcionan.

### Notas Netlify
- La función se ejecuta en Node 18/20 según configuración de Netlify.
- Respetar límites de 125k invocaciones/mes en plan free.
- Posible optimización: cachear respuesta en Netlify Edge Cache con cabeceras `Cache-Control`.

---

## Checklist de Deploy (genérica)
- [ ] Repositorio limpio (`git status --short` sin cambios pendientes en área de deploy).
- [ ] README actualizado con instrucciones de ejecución.
- [ ] Definir variables de entorno necesarias (si en el futuro usamos APIs con API key).
- [ ] Pruebas QA pasadas y reporte guardado.
- [ ] Pipeline de build/documentado (Render/Netlify/otro) configurado.
- [ ] URL de staging/producción anotada en `DEPLOY.md` una vez creado.
- [ ] Verificación post-deploy: respuesta 200 en landing y endpoint `/api/quotes`.

## Mantenimiento futuro
- Establecer un cron para refrescar dependencias (si se añaden).
- Implementar logs y alertas básicas (Render logs, Netlify analytics, etc.).
- Definir estrategia de rollback (p.ej. revertir a commit anterior y redeploy).
- Considerar tests automatizados antes de cada deploy (CI).

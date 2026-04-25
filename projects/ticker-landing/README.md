# Ticker Landing – Bolsa de Valores

Landing informativa que muestra la cotización en tiempo real de un conjunto configurable de tickers bursátiles (por defecto: NVDA, PLTR, QQQ y SPY).

## Objetivo
- Mostrar el precio actual.
- Mostrar la diferencia con respecto al cierre anterior.
- Colorear la diferencia según el signo (verde: sube, rojo: baja, azul: igual).
- Indicar la fecha y hora de la última actualización.
- Permitir que la lista de tickers sea configurable por el usuario y persistente en el backend local.
- Refrescar los datos periódicamente para mantener la información actualizada.

## API elegida
- **Fuente:** Stooq Quick Quote API (`/q/l/`) sin autenticación.
- **URL base:** `https://stooq.com/q/l/`
- **Ejemplo de consulta:**
  ```
  https://stooq.com/q/l/?s=NVDA.US+PLTR.US+QQQ.US+SPY.US&f=snt1d1pc&h&e=csv
  ```
- **Campos utilizados:**
  - `s` (símbolo)
  - `n` (nombre)
  - `t1` (hora, formato hhmmss)
  - `d1` (fecha, formato yyyymmdd)
  - `p` (precio de cierre previo)
  - `c` (precio de cierre actual)

## Criterios de aceptación
1. La lista de tickers persistida en el backend se renderiza con precio y variación (por defecto NVDA, PLTR, QQQ y SPY; se permiten listas vacías o personalizadas).
2. La variación se muestra numérica, con el color correspondiente (verde si >0, rojo si <0, azul si =0).
3. Se indica "Última actualización" con fecha y hora legibles basadas en el `regularMarketTime` o la hora del fetch.
4. El frontend refresca datos automáticamente cada 5 minutos y permite forzar un refresh manual opcional.
5. La configuración de tickers es editable desde la UI (agregar/quitar) y queda disponible para cualquier cliente que abra la landing.
6. En caso de error de red o API, la interfaz muestra un mensaje de error y ofrece reintentar.

## Roles y entregables
- **Coordinador:** backlog, documentación, seguimiento y QA final.
- **UX/UI:** layout y guías visuales (ver `design-notes.md`).
- **Desarrollo:** implementación de la página (HTML/CSS/JS o stack acordado).
- **QA:** plan de pruebas, verificación de colores/valores y manejo de errores.

## Ejecución local
1. `node server.mjs`
2. Abrir `http://localhost:8000/` en el navegador.

> El servidor expone `/api/quotes` como proxy hacia Stooq para evitar restricciones de CORS y simular el mismo endpoint que en producción. Además, publica `/api/tickers` (GET/POST) para leer y guardar la configuración persistente en `data/tickers.json`.

## Deploy

### Vercel (recomendado)
- `vercel.json` publica `app/` como sitio estático y enruta `/api/quotes` & `/api/tickers` a las funciones Node en `api/`.
- El endpoint `/api/tickers` usa Vercel KV (Upstash) si están presentes las variables `KV_REST_API_URL`, `KV_REST_API_TOKEN` y `KV_REST_API_READ_ONLY_TOKEN`; en caso contrario el frontend persiste la lista en `localStorage` por usuario.
- Config pasos detallados en `DEPLOY.md` (seleccionar root `projects/ticker-landing`, definir env vars y usar `vercel --prod`).

### Netlify (legado)
- Se mantiene la configuración previa (`netlify.toml`, `netlify/functions/quotes.js`, workflow `deploy-netlify.yml`).
- Útil como plan B, pero la ruta `/api/tickers` no tiene persistencia compartida en Netlify.

## Estado actual
- Documentación inicial creada.
- API aprobada por Marcelo.
- UI y lógica base implementadas (HTML/CSS/JS) con gestión dinámica de tickers.
- Persistencia compartida habilitada vía `/api/tickers` (Vercel + KV opcional); el frontend cae a `localStorage` cuando no hay backend configurado.
- Pipeline Vercel documentado y listo para conectar al repo; la configuración de Netlify queda como alternativa.
- Pendiente: validación visual, QA y demo final.

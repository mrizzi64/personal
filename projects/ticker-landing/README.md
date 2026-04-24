# Ticker Landing – Bolsa de Valores

Landing informativa que muestra la cotización en tiempo real de cuatro tickers bursátiles: NVDA, PLTR, QQQ y SPY.

## Objetivo
- Mostrar el precio actual.
- Mostrar la diferencia con respecto al cierre anterior.
- Colorear la diferencia según el signo (verde: sube, rojo: baja, azul: igual).
- Indicar la fecha y hora de la última actualización.
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
1. Los cuatro tickers aparecen en pantalla con su precio y variación.
2. La variación se muestra numérica, con el color correspondiente (verde si >0, rojo si <0, azul si =0).
3. Se indica "Última actualización" con fecha y hora legibles basadas en el `regularMarketTime` o la hora del fetch.
4. El frontend refresca datos automáticamente (ej. cada 60 segundos) y puede forzar un refresh manual opcional.
5. En caso de error de red o API, la interfaz muestra un mensaje de error y ofrece reintentar.

## Roles y entregables
- **Coordinador:** backlog, documentación, seguimiento y QA final.
- **UX/UI:** layout y guías visuales (ver `design-notes.md`).
- **Desarrollo:** implementación de la página (HTML/CSS/JS o stack acordado).
- **QA:** plan de pruebas, verificación de colores/valores y manejo de errores.

## Ejecución local
1. `node server.mjs`
2. Abrir `http://localhost:8000/` en el navegador.

> El servidor expone `/api/quotes` como proxy hacia Stooq para evitar restricciones de CORS y simular el mismo endpoint que en producción.

## Pipeline de deploy (Servidor propio + Docker)
- **Hosting principal:** contenedor Docker ejecutando `server.mjs` en el datacenter corporativo.
- **Automatización sugerida:** GitHub Actions (`deploy-onprem.yml`) comprime el proyecto, lo transfiere por SSH y ejecuta `docker compose up -d --build` en el servidor.

### Requisitos previos
1. Servidor con Docker y docker-compose v2 instalados.
2. Usuario SSH con permisos para manejar contenedores.
3. Directorio remoto donde se actualizará el proyecto (ej. `/srv/ticker-landing`).
4. Definir secretos en GitHub:
   - `SSH_HOST`
   - `SSH_USER`
   - `SSH_KEY` (clave privada en formato PEM)
   - Opcional: `SSH_PORT`, `DEPLOY_PATH`.

### Flujo CI/CD
1. Push/Merge a `main` dispara `deploy-onprem.yml` (también puede invocarse manualmente via *workflow_dispatch*).
2. Pasos del workflow:
   - Checkout del repo.
   - Empaquetar `projects/ticker-landing` como `tar.gz`.
   - Subir archivo al servidor vía `scp`.
   - Ejecutar remoto: descomprimir y `docker compose up -d --build`.
3. El servicio queda expuesto en el puerto configurado (por defecto 8080) listo para ser enrutado por el reverse proxy corporativo.

### Ejecución manual alternativa
```bash
ssh usuario@servidor
cd /ruta/al/repositorio
docker compose up -d --build
```

### Archivos clave
- `Dockerfile` y `docker-compose.yml`: definen el contenedor de producción.
- `.github/workflows/deploy-onprem.yml`: pipeline automatizado on-premises.
- `server.mjs`: sirve estáticos y actúa como proxy `/api/quotes`.

## Opcional: Netlify como ambiente externo
Se mantiene soportado el deploy a Netlify (`netlify.toml`, `netlify/functions/quotes.js`, workflow `deploy-netlify.yml`) por si se necesita un entorno de demo público. Requiere configurar los secretos `NETLIFY_AUTH_TOKEN` y `NETLIFY_SITE_ID`.

## Estado actual
- Documentación inicial creada.
- API aprobada por Marcelo.
- UI y lógica base implementadas (HTML/CSS/JS).
- Pipeline on-premises definido (Docker + GitHub Actions opcional).
- Pipeline Netlify documentado como alternativa.
- Pendiente: validación visual, QA y demo final.

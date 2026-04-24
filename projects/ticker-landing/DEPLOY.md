# Deploy – Ticker Landing

## Objetivo
Publicar la landing de cotizaciones (HTML/CSS/JS + proxy Node) en infraestructura corporativa, garantizando control sobre datos y cumplimiento de políticas internas. Se documentan alternativas secundarias (Render/Netlify) por si se requiere un ambiente de contingencia.

---

## Panorama de opciones
1. **Servidor propio (on-premises) con Docker** ← *Implementado*
   - Artefactos: `Dockerfile` + `docker-compose.yml`.
   - Ejecuta el servidor Node (`server.mjs`) que sirve la UI y el endpoint `/api/quotes` (proxy Stooq).
   - Compatible con reverse proxies existentes (Nginx/HAProxy/Traefik) para TLS y control de acceso.
2. **Render.com / Railway / Fly.io** (Node service) – alternativa de nube pública manteniendo el mismo servidor Node.
3. **Netlify (static + serverless)** – despliegue rápido de referencia (frontend estático + función serverless). Manteniendo documentación por si se necesita un ambiente externo temporal.
4. **GitHub Pages + Cloudflare Worker** – solo referencia.

El camino oficial será **Docker on-premises**. Las opciones 2 y 3 quedan como respaldo.

---

## Despliegue on-premises con Docker

### Requisitos
- Servidor Linux (bare metal o VM) con Docker Engine ≥ 20 y docker-compose v2.
- Acceso SSH desde el entorno CI/CD (opcional) o despliegue manual.
- Puerto corporativo disponible (por defecto 8080) y posibilidad de publicar detrás de un reverse proxy interno.

### Estructura relevante
```
projects/ticker-landing/
├── Dockerfile
├── docker-compose.yml
├── server.mjs
├── app/
└── ...
```

### Pasos manuales
1. Clonar el repositorio en el servidor (o sincronizar artefactos con rsync/scp).
2. Ingresar a `projects/ticker-landing/`.
3. Ejecutar `docker compose up -d --build`.
4. Verificar logs: `docker compose logs -f`.
5. Validar acceso: `curl http://<host>:8080/api/quotes` → debe responder JSON con 4 tickers.
6. Configurar reverse proxy corporativo para exponer el servicio vía HTTPS (ej. `/stocks`).
7. Registrar el endpoint y URL interna en la documentación operativa.

### CI/CD sugerido (GitHub Actions + SSH)
Archivo recomendado: `.github/workflows/deploy-onprem.yml`.

Flujo:
1. `push` a `main` dispara el workflow.
2. Acciones:
   - Checkout del repositorio.
   - (Opcional) Construir la imagen y guardarla como artefacto.
   - Copiar archivos actualizados al servidor via `scp` o `rsync`.
   - Ejecutar remoto `docker compose up -d --build`.
3. Notificar resultados.

Secretos requeridos:
- `SSH_HOST` (hostname/IP del servidor en el datacenter).
- `SSH_USER` (usuario con permisos Docker).
- `SSH_KEY` (clave privada en formato PEM).
- Opcional: `SSH_PORT`, `TARGET_DIR`, `DOCKER_CONTEXT`.

Se incluye un workflow de ejemplo en `.github/workflows/deploy-onprem.yml` que usa `appleboy/ssh-action` para copiar y desplegar.

### Checklist operativa
- [ ] Docker compose en ejecución (`docker ps` muestra `ticker-landing`).
- [ ] Reverse proxy con certificado TLS emitido por la CA corporativa.
- [ ] Monitorización configurada (logs Docker → syslog/ELK, health check interno).
- [ ] Plan de backup/snapshot de la VM o infraestructura donde corra el contenedor.
- [ ] Documentar credenciales y rutas en el runbook del datacenter.

---

## Deploy en Netlify (opcional)

Se mantiene como alternativa cloud para entornos temporales o demos públicas.

- Workflow: `.github/workflows/deploy-netlify.yml`.
- Requiere secretos `NETLIFY_AUTH_TOKEN` y `NETLIFY_SITE_ID`.
- Publica `projects/ticker-landing/app` y la función `netlify/functions/quotes.js` (proxy Stooq).

Pasos generales:
1. Configurar sitio en Netlify (vacío o vinculado al repo) y obtener `site_id`.
2. Añadir los secretos en GitHub.
3. Hacer push a `main` → Netlify CLI despliega automáticamente.
4. Validar `https://<sitio>.netlify.app/` y `.../api/quotes`.

Notas:
- Revisar límites del plan free de Netlify (invocaciones de funciones, ancho de banda).
- Se recomienda habilitar protección mediante password o IP allowlist si se usa como entorno externo.

---

## Deploy en Render (referencia)

Se conserva la guía previa (servicio Node simple) para ocasiones donde se necesite un hosting gestionado con soporte de procesos largos. Pasos descritos en la sección original.

---

## Checklist general antes de desplegar
- [ ] `git status` limpio y QA report actualizado.
- [ ] Variables de entorno y secretos definidas según ambiente.
- [ ] Scripts/archivos de despliegue probados en staging.
- [ ] Registro de la versión desplegada (commit hash + fecha) en el runbook.
- [ ] Alarmas/monitoreo habilitados.

## Mantenimiento futuro
- Programar actualización de dependencias base (imagen Node) y parches de seguridad.
- Considerar agregar tests automatizados en CI antes de desplegar.
- Documentar procedimiento de rollback (ej. `docker compose down && docker compose up` con versión anterior / revertir commit).

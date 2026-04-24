# QA Report – Sprint 0 (2026-04-24)

- **Tester:** Coordinador
- **Entorno:** Local (`node server.mjs` + navegador/CLI)
- **Objetivo:** Smoke test inicial de la landing y validación del endpoint `/api/quotes`.

## Resumen
Se confirmó que el proxy local responde con datos válidos desde Stooq y que la estructura básica de la UI carga sin errores aparentes. Las pruebas de variaciones positiva/negativa, accesibilidad profunda y degradación aún están pendientes para la siguiente iteración.

## Casos ejecutados
| ID   | Descripción                                      | Resultado | Evidencia |
|------|--------------------------------------------------|-----------|-----------|
| F-01 | Fetch inicial: `/api/quotes` devuelve 4 tickers. | ✅ OK     | `curl http://localhost:8000/api/quotes` → JSON válido |
| C-01 | Inicio/parada del servidor `server.mjs`.         | ✅ OK     | Servidor levantó en `http://localhost:8000`, terminación limpia |

## Observaciones
- Los valores devueltos corresponden al cierre del 23-abr-2026 (horario 22:00:19). Para validación visual se recomienda abrir la landing con el servidor activo en la próxima sesión.
- Aún no se ejercitaron casos F-02/F-03/F-04 (variaciones), R-01 (responsive) ni E-01/E-02 (errores). Quedan como tareas para el siguiente ciclo de QA.
- Nueva funcionalidad pendiente de verificación formal: agregar/quitar tickers, persistencia en `localStorage`, estado vacío y enlaces a Yahoo Finance. QA debe cubrirlos en la próxima ronda.

## Próximos pasos
1. Ejecutar el resto de la matriz de pruebas del `QA_PLAN.md` (incluye nuevos casos C-03 ⇢ C-07 sobre agregar/quitar tickers y links).
2. Capturar screenshots de la UI para evidencias visuales (estado normal, agregado manual, estado vacío y mensaje de error).
3. Considerar datos mockeados para forzar variaciones positiva/negativa sin depender del mercado real.
4. Registrar resultados en una nueva sección del reporte con fecha de ejecución y símbolos utilizados.

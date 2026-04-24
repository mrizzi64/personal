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

> El servidor expone `/api/quotes` que actúa como proxy hacia Yahoo Finance para evitar restricciones de CORS.

## Estado actual
- Documentación inicial creada.
- API aprobada por Marcelo.
- UI y lógica base implementadas (HTML/CSS/JS).
- Pendiente: validación visual, QA y demo final.

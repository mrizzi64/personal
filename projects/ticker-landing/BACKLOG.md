# Backlog – Ticker Landing

## 0. Preparación (Coordinador)
- [x] Definir alcance y criterios de aceptación.
- [x] Seleccionar API de datos (Yahoo Finance).
- [x] Crear wireframe / layout inicial.
- [x] Acordar stack tecnológico (HTML+CSS+JS vanilla).

## 1. Diseño (UX/UI)
- [x] Wireframe de la landing (desktop primero, opcional mobile).
- [x] Definir estilos: tipografía, colores, espaciados, estados de variación (verde/rojo/azul).
- [x] Adjuntar ejemplos de componentes (tarjeta de ticker, encabezado, footer).

## 2. Desarrollo (Frontend)
- [x] Montar estructura del proyecto (`index.html`, `styles.css`, `app.js`).
- [x] Implementar fetch hacia Yahoo Finance para los cuatro tickers.
- [x] Mostrar datos actualizados y colorear variaciones.
- [x] Implementar refresco automático (cada 60s) + botón de refresco manual.
- [x] Manejo de errores (mensaje visible, opción de reintento).
- [x] Crear servidor local (`server.mjs`) que actúe como proxy y sirva archivos estáticos.
- [x] Gestionar tickers dinámicamente (agregar/quitar, estado vacío, persistencia local, link a detalle).

## 3. QA
- [x] Plan de pruebas (valores positivos, negativos, cero, errores de API) — actualizado 2026-04-24 con casos de gestión dinámica.
- [ ] Ejecutar pruebas manuales y registrar resultados (incluye casos C-03 ⇢ C-07 y captura de evidencias).
- [ ] Validar accesibilidad básica (contraste de colores, etiquetas, responsividad mínima).
- [ ] Aprobar release o documentar pendientes.

## 4. Cierre
- [ ] Demo para Marcelo.
- [ ] Documentación final (instrucciones de build/run).
- [ ] Retrospectiva breve y lecciones aprendidas.

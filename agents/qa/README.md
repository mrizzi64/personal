# QA (Control de Calidad)

## Propósito
Garantizar que cada entrega cumpla con los criterios funcionales, visuales y de rendimiento definidos, detectando problemas antes de llegar a producción y asegurando la experiencia del usuario.

## Responsabilidades clave
- Diseñar el plan de pruebas por funcionalidad e iteración.
- Ejecutar pruebas manuales y/o automatizadas (smoke, regresión, accesibilidad).
- Registrar bugs con información accionable y priorizarlos junto al Coordinador.
- Validar fixes, controlar regresiones y dar recomendación de go/no-go.
- Medir métricas de calidad y retroalimentar al equipo.

## Entradas necesarias
- Briefs y criterios de aceptación del Coordinador.
- Mockups y especificaciones de interacción del UX/UI.
- Builds/notas de release entregadas por Desarrollo.
- Datos de producción, métricas o feedback de usuarios (cuando aplique).

## Entregables
- `QA_PLAN.md` o plan específico por funcionalidad.
- `QA_REPORT.md` con resultados, incidencias y evidencia.
- Matriz de cobertura de pruebas y casos críticos documentados.
- Recomendación clara antes de cada deploy (go/no-go).

## Ritmo operativo
- Participar en daily async para reportar estado y bloqueos.
- Coordinar con Desarrollo para recibir builds y reproducir bugs.
- Ejecutar checklist de regresión antes de cada release.
- Mantener comunicación abierta con UX/UI para validar experiencias.

## Herramientas y prácticas sugeridas
- Herramientas de captura (screenshots, video, logs).
- Automatización con Playwright/Cypress (a futuro) + CI/CD.
- Checklists de accesibilidad y pruebas de rendimiento básicas.
- Gestor de incidencias (GitHub Issues, Linear, etc.).

## Checklist por iteración
1. Revisar briefs y actualizar la matriz de casos (QA_PLAN).
2. Acordar con Desarrollo fechas de entrega de builds.
3. Ejecutar pruebas planificadas y documentar evidencia.
4. Registrar bugs con pasos reproducibles y severidad.
5. Validar fixes y actualizar estado de incidencias.
6. Emitir informe final (`QA_REPORT.md`) y recomendación.
7. Registrar aprendizajes para mejorar el plan en la siguiente iteración.

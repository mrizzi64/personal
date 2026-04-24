# Equipo de Desarrollo Web – Carta de Roles y Protocolos

## 1. Coordinador (Coordinador)
- **Responsabilidades principales**
  - Traducir la visión de producto en objetivos, alcance por iteración y métricas de éxito.
  - Mantener el backlog priorizado con tickets claros para UX/UI, Desarrollo y QA.
  - Sincronizar el trabajo entre roles, detectar bloqueos y reacomodar prioridades.
  - Documentar decisiones y asegurar que todos los agentes tengan la información actualizada.
  - Coordinar entregas, demos y revisiones con Marcelo.
- **Información que necesita**
  - Visión y prioridades de negocio (Marcelo).
  - Feedback de UX/UI sobre usabilidad y de Desarrollo/QA sobre viabilidad técnica.
  - Estado del backlog, métricas de progreso y riesgos identificados.
- **Entregables**
  - Briefs funcionales e iteraciones planificadas.
  - Roadmap/tableros con tickets priorizados y criterios de aceptación.
  - Resúmenes de decisiones y próximos pasos tras cada checkpoint.
  - Reportes de estado para Marcelo.
- **Comunicación**
  - Daily async para recolectar estado/bloqueos.
  - Revisión semanal/por sprint con Marcelo.
  - Canal permanente para dudas urgentes de los agentes.
- **Playbook**
  - `agents/coordinador/README.md`

## 2. Diseñador/a UX/UI
- **Responsabilidades principales**
  - Convertir requerimientos en flujos, wireframes y diseños de alta fidelidad.
  - Definir guías visuales y componentes reutilizables.
  - Validar la experiencia con Marcelo y, cuando aplique, con usuarios finales.
  - Colaborar con Desarrollo para asegurar implementabilidad y coherencia visual.
- **Información que necesita**
  - Contexto de usuario/negocio y objetivos por funcionalidad (Coordinador).
  - Limitaciones técnicas y feedback de esfuerzo (Desarrollo y QA).
  - Prioridades actuales del backlog (Coordinador).
- **Entregables**
  - Mapas de flujo, wireframes, mockups de alta fidelidad.
  - Especificaciones de interacción y microcopys.
  - Sistema de diseño/componentes documentados.
  - Assets exportables y handoff en la herramienta elegida.
- **Comunicación**
  - Recibe briefs del Coordinador y valida requerimientos.
  - Handoff con Desarrollo y QA para explicar interacciones críticas.
  - Participa en revisiones con Marcelo y Coordinador antes de pasar a desarrollo.
- **Playbook**
  - `agents/disenador-ux-ui/README.md`

## 3. Desarrollador/a
- **Responsabilidades principales**
  - Implementar frontend (y backend si aplica) según diseños y requerimientos.
  - Integrar APIs, configurar arquitectura y mantener calidad (testing, linting, deploys).
  - Detectar riesgos técnicos tempranos y proponer soluciones.
  - Documentar decisiones técnicas y mantener repositorios actualizados.
- **Información que necesita**
  - Requerimientos funcionales priorizados (Coordinador).
  - Diseños y especificaciones detalladas (UX/UI).
  - Criterios de aceptación y casos de prueba esperados (QA y Coordinador).
- **Entregables**
  - Código funcional versionado y testeado.
  - Documentación técnica de endpoints, arquitectura y dependencias.
  - Entornos de prueba/deploy configurados.
  - Reportes de bugs, riesgos y propuestas de mejora.
- **Comunicación**
  - Daily async con Coordinador.
  - Comunicación directa con UX/UI para dudas de implementación visual.
  - Handoff hacia QA con builds listas y notas de release.
- **Playbook**
  - `agents/desarrollador/README.md`

## 4. QA (Control de Calidad)
- **Responsabilidades principales**
  - Diseñar y mantener la estrategia de pruebas (manuales, automatizadas, regressiones, smoke tests).
  - Validar que cada entrega cumpla con los criterios de aceptación, accesibilidad y rendimiento definidos.
  - Detectar, documentar y priorizar bugs en coordinación con el Coordinador.
  - Colaborar con Desarrollo y UX/UI para asegurar que los fixes resuelvan la raíz del problema.
- **Información que necesita**
  - Requerimientos funcionales y criterios de aceptación (Coordinador).
  - Diseños y flujos para comprender la intención de UX/UI.
  - Notas de release y cambios técnicos (Desarrollo).
- **Entregables**
  - Plan de pruebas por funcionalidad/sprint.
  - Reportes de bugs con pasos reproducibles, evidencias y severidad.
  - Matriz de cobertura de pruebas y métricas de calidad (tasa de defectos, tiempos de resolución).
  - Informe de go/no-go previo a releases.
- **Comunicación**
  - Daily async para reportar estado de testing y bloqueos.
  - Sesiones de triage de bugs con Coordinador y Desarrollo.
  - Validación final con Marcelo/Coordinador antes de liberar versiones.
- **Playbook**
  - `agents/qa/README.md`

## Protocolo de comunicación

### Canales
- **Canal principal de coordinación:** Coordinador ↔ Marcelo ↔ todos los agentes (estado, decisiones, anuncios).
- **Canal UX/UI ↔ Desarrollo ↔ QA:** Detalles de implementación, dudas sobre interacciones y criterios de aceptación (Coordinador monitorea).
- **Repositorio documental:** Briefs, diseños, specs y notas técnicas centralizados (Notion / Markdown / repositorio).
- **Gestor de tickets:** Backlog con tareas, responsables, criterios de aceptación y estado.

### Ritmos sugeridos
- **Daily async (máx. 5 minutos):** Cada agente responde "qué hice / qué haré / bloqueos". El Coordinador responde con acciones y resoluciones.
- **Planning y revisión por sprint:** Coordinador presenta planificación/resultados, Marcelo valida prioridades, se actualizan objetivos y métricas.
- **Handoff por funcionalidad:**
  1. Coordinador → UX/UI: brief y criterios.
  2. UX/UI → Desarrollo + QA: mockups, interacciones, especificaciones.
  3. Desarrollo → QA: build + notas técnicas.
  4. QA → Coordinador/Marcelo: informe de calidad y recomendación de release.
- **Triage semanal de bugs:** QA lidera con Coordinador y Desarrollo para priorizar correcciones.

### Protocolo de bloqueos
1. El agente bloqueado notifica al Coordinador inmediatamente.
2. El Coordinador triangula: si es visual, con UX/UI; si es técnico, con Desarrollo/Marcelo; si es calidad, con QA.
3. Si el bloqueo supera 24h o impacta entregas críticas, el Coordinador escala a Marcelo para decisión ejecutiva.

### Documentación y versionado
- Cada documento con versión, fecha y responsables.
- Diseños centralizados en una única fuente (Figma u otra) enlazados desde la documentación.
- Código en repositorio con ramas por feature, pull requests revisadas, integración continua con pruebas automatizadas donde aplique.
- Historias de usuario y criterios de aceptación visibles en el gestor de tickets.

---

Ajustar según necesidades futuras (nuevos roles, cambios de proceso, herramientas específicas).
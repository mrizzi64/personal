# Plan de QA – Landing de Cotizaciones

## 1. Objetivo
Validar que la landing de cotizaciones muestra información correcta para NVDA, PLTR, QQQ y SPY, aplica los estilos de variación según signo, maneja errores de red y mantiene la usabilidad básica en desktop y mobile.

## 2. Alcance de las pruebas
- **Datos y cálculos:** precio actual, variación absoluta y porcentual, fecha/hora de actualización.
- **Estilos visuales:** color y badge según alza/caída/neutral.
- **Comportamiento:** actualización automática cada 60 segundos y botón de refresco manual.
- **Resiliencia:** manejo de errores de API/proxy sin romper la UI.
- **Accesibilidad mínima:** contraste, labels y comportamiento responsive principal.

## 3. Matriz de Casos de Prueba
| ID | Categoría             | Escenario                                                                     | Resultado esperado |
|----|-----------------------|-------------------------------------------------------------------------------|--------------------|
| F-01 | Fetch inicial        | Al cargar la página se muestran 4 tarjetas con datos.                         | Todas las tarjetas visibles, precios numéricos, sin mensajes de error. |
| F-02 | Variación positiva   | Forzar caso con `close > previousClose`.                                      | Texto y borde en verde, cambio positivo con "+" y porcentaje positivo. |
| F-03 | Variación negativa   | Forzar caso con `close < previousClose`.                                      | Texto y borde en rojo, cambio negativo con "-" y porcentaje negativo. |
| F-04 | Variación neutra     | Simular `close == previousClose`.                                             | Texto y borde en azul, cambio mostrado como `0.00` o `+0.00`. |
| F-05 | Fecha/Hora           | Verificar campo "Actualizado".                                               | Muestra fecha legible + "(UTC)" y se refresca tras nuevos datos. |
| C-01 | Botón Actualizar     | Pulsar "Actualizar ahora".                                                   | Botón muestra estado "Actualizando...", vuelve a su estado original al terminar y refresca datos. |
| C-02 | Auto-refresh         | Esperar >60s o manipular temporizador.                                        | Datos vuelven a solicitarse, se actualiza sello de hora. |
| E-01 | API down             | Desconectar internet o apagar proxy `server.mjs`.                             | Aparece mensaje de error amigable y última actualización indica error. |
| E-02 | Respuesta vacía      | Editar temporalmente proxy para devolver `{ quotes: [] }`.                     | Se muestra estado de error y no se rompen estilos. |
| R-01 | Responsive mobile    | Redimensionar a <600px o usar DevTools.                                       | Tarjetas se apilan vertical, botón ocupa ancho completo. |
| A-01 | Accesibilidad        | Revisar contraste y etiquetas ARIA.                                           | No hay contrastes inferiores a AA; aria-live presente para actualizaciones. |
| A-02 | Navegación teclado   | Tabular por elementos interactivos.                                           | Botón y tarjetas accesibles, sin atrapamientos. |

## 4. Checklist resumida
- [ ] Proxy `server.mjs` iniciado y respondiendo `200` en `/api/quotes`.
- [ ] Página carga cuatro tarjetas sin errores.
- [ ] Colores y símbolos cambian según variación (verde/rojo/azul).
- [ ] Botón "Actualizar ahora" funciona y bloquea múltiples clics mientras fetch ⇢ true.
- [ ] Auto-refresh ejecutado al menos una vez durante la sesión de prueba.
- [ ] Manejo de error visual confirmado (API caída o respuesta vacía).
- [ ] Vista responsive verificada (<600px).
- [ ] Revisión de contraste y navegación por teclado OK.
- [ ] Resultados documentados en `QA_REPORT.md` (crearlo o actualizarlo).

## 5. Guion para el agente de QA
1. **Preparación**
   - Asegurarse de tener Node 20+ disponible.
   - Ejecutar `node server.mjs` desde `projects/ticker-landing/`.
   - Esperar el mensaje: `Servidor escuchando en http://localhost:8000`.
2. **Pruebas funcionales**
   - Abrir `http://localhost:8000` en el navegador.
   - Capturar evidencia (screenshot) del estado inicial con 4 tarjetas.
   - Validar variaciones positiva/negativa: simular cambiando temporalmente valores en `server.mjs` (nota: comentar la sección de fetch y mockear response) o usando las herramientas de DevTools para alterar DOM y fotografiar ejemplo.
   - Confirmar sello de tiempo y que cambia tras refresco manual.
3. **Pruebas de resiliencia**
   - Interrumpir internet o detener el proxy para provocar error; verificar mensaje.
   - Restaurar proxy y confirmar recuperación.
4. **Pruebas de UI/Accesibilidad**
   - Activar modo responsive (360px y 1400px) y revisar layout.
   - Ejecutar una comprobación rápida de contraste (herramientas del navegador o extensiones).
   - Recorrer la página con teclado (Tab, Shift+Tab) y anotar cualquier foco perdido.
5. **Registro**
   - Documentar resultados en `QA_REPORT.md` con secciones: Fecha, Tester, Casos, Resultado, Observaciones, Evidencias.
   - Informar al Coordinador (Marcelo/Coordinador) si se detectaron fallos bloqueantes.

## 6. Notas
- Para automatizar en el futuro, se recomienda escribir pruebas de integración con Playwright o Cypress simulando respuestas del proxy.
- Si Stooq impone límites, considerar cachear respuestas en el proxy y mockear datos durante QA para evitar consultas repetidas.

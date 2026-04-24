# Notas de Diseño – Ticker Landing

## Concepto general
Una vista única (landing) que presenta los cuatro tickers como tarjetas informativas dentro de un layout limpio, con énfasis en la variación y la última actualización.

## Layout propuesto (desktop)
```
+-------------------------------------------------------+
|  Header: "Cotizaciones destacadas" + breve descripción|
+---------------------------+---------------------------+
| Tarjeta NVDA              | Tarjeta PLTR              |
| - Precio actual grande    | - Precio actual grande    |
| - Variación + color       | - Variación + color       |
| - Últ. actualización      | - Últ. actualización      |
+---------------------------+---------------------------+
| Tarjeta QQQ               | Tarjeta SPY               |
| - Precio actual grande    | - Precio actual grande    |
| - Variación + color       | - Variación + color       |
| - Últ. actualización      | - Últ. actualización      |
+---------------------------+---------------------------+
| Footer: nota sobre origen de datos + timestamp global |
+-------------------------------------------------------+
```

## Responsive
- En mobile, las tarjetas se apilan verticalmente (una por fila).
- Mantener padding cómodo (16px) y tipografía legible (mínimo 16px).

## Estilos
- **Tipografía:** Sans-serif moderna (p.ej. "Inter", "Roboto" o `system-ui`).
- **Colores base:**
  - Fondo claro (`#f5f7fa` o similar).
  - Tarjetas blancas con borde sutil (`#e0e6ef`).
  - Texto principal `#1f2933`.
- **Colores de variación:**
  - Positivo: verde `#16a34a`.
  - Negativo: rojo `#dc2626`.
  - Neutro: azul `#2563eb`.
- **Botón/acción:** botón “Actualizar ahora” con color primario (`#2563eb`) y hover oscuro.

## Componentes clave
1. **Header**
   - Título: "Cotizaciones destacadas"
   - Subtítulo breve: "Datos actualizados en tiempo real de NVDA, PLTR, QQQ y SPY"
2. **Tarjeta de ticker**
   - Símbolo (ej. NVDA)
   - Precio actual (typografía grande)
   - Variación absoluta (y opcional porcentual) con color de estado
   - Texto pequeño: "Actualizado: 24 abr 2026 13:45"
3. **Footer**
   - Fuente de datos: "Datos provistos por Yahoo Finance"
   - Timestamp global de última actualización

## Accesibilidad y usabilidad
- Contraste mínimo AA para texto y fondos.
- Colores acompañados de símbolos o etiquetas (p.ej. “▲” para subida, “▼” para baja, “—” para neutral) para usuarios con daltonismo.
- Indicar en tooltip o texto la hora exacta de la última actualización.

## Entregables UX/UI
- Mockup estático (puede ser en Figma o un PNG simple) referenciado aquí cuando esté listo.
- Documentación de estilos finales (ajustes en paleta, tipografía o microcopys).

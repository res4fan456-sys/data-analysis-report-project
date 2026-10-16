# Plan del proyecto — Reporte de gasto mensual

## Visión

**Qué es.** Una herramienta que toma el CSV de transacciones de **un mes** y genera una **página web local** con el
análisis de gasto y su resumen. La página es muy profesional y estética, y termina con el mensaje literal
**«Aquí queda la línea del respeto»**.

**Para quién.** Para una sola persona (el autor), que la usa en su PC cada vez que tiene un CSV nuevo y abre el
resultado en el navegador.

**Qué problema resuelve.** Hoy nada analiza el CSV. El generador del repo produce un mes de gasto sintético con
patrones ocultos, y falta el reporte que los descubra y los presente bien. El éxito a tres meses es que el reporte
**funcione igual con datos reales** convertidos al mismo formato de 9 columnas.

**Datos.** Un CSV por reporte, de un mes y hasta ~20,000 filas, con las columnas `id_transaccion, fecha, monto,
concepto, categoria, cuenta, zona, latitud, longitud`. Solo se conserva la página generada: no hay historial ni base
de datos.

**No negociable.**
1. Corre local.
2. 100 % sin red.
3. Costo $0.
4. Todo en español de México (MXN).
5. La página es un único archivo autocontenido.
6. El mensaje final es literal.

## Alcance del MVP

1. **Resumen ejecutivo:**
   - gasto total, número de transacciones, ticket promedio y día de mayor gasto;
   - las conclusiones principales en lenguaje claro.
2. **Los 5 patrones**, cada uno con su gráfica y su conclusión:
   - categoría dominante;
   - zona favorita;
   - quincena;
   - fin de semana;
   - viaje.
3. **Desglose y atípicos:**
   - gasto por cuenta y por categoría;
   - comercios más frecuentes y de mayor gasto;
   - cargos fijos;
   - compras atípicas.
4. **Mapa de gasto** que funciona sin red, con una vista de la ciudad y una vista nacional que muestra el viaje.

Se usa con un comando sobre el CSV: `python -m reporte output/transacciones_AAAA-MM.csv` → `output/reporte_AAAA-MM.html`.

## Fuera de alcance

- Varios meses en un reporte, comparación entre meses o historial de reportes.
- Adaptadores para exportaciones de banco. Solo se acepta el CSV de 9 columnas.
- Subir o cambiar el CSV desde la página. La página se genera desde el CSV.
- Exportación propia a PDF. Se puede imprimir desde el navegador.
- Cualquier servidor, cuenta, servicio en la nube o recurso descargado de internet.

## Fases

| Fase | Objetivo | Entregable demostrable | Fuera de alcance | Decisiones cerradas |
|---|---|---|---|---|
| 0 | Andamiaje y mecánica | Esqueleto `src/reporte`, `pyproject.toml`, generador movido a `generador/` (README actualizado), gate verde, `/da-init` corrido | Cualquier análisis | Stack, capas, comandos del gate (ver `STACK.md`) |
| 1 | Leer, validar y resumir | `python -m reporte output/transacciones_2026-09.csv` produce `output/reporte_2026-09.html`. La página abre en modo avión con encabezado, KPIs del resumen, estilo base (fuente embebida, paleta negro y dorado, modo claro/oscuro automático con botón) y el mensaje final | Patrones, gráficas, mapa, hallazgos en lenguaje natural | Reglas R1–R3, R4 (sin sus hallazgos), R5 y R15–R17 de `DOMINIO.md` |
| 2 | Los 5 patrones | Una sección por patrón con gráfica embebida y su hallazgo, y los 3 a 5 hallazgos principales del resumen. La suite de sistema confirma, con semillas fijas, que lo detectado coincide con lo inyectado | Desglose, mapa | Reglas R6–R10, R14 y los hallazgos de R4 |
| 3 | Desglose y atípicos | Cuentas, categorías, top de comercios, cargos fijos y tabla de atípicos | Mapa | Reglas R11–R12 |
| 4 | Mapa y pulido | Mapa de ciudad (16 alcaldías) y nacional sin red, revisión visual completa y prueba con un CSV real | Varios meses, adaptadores de banco | Regla R13 |

La demostración de cada fase es visual: se abre la página y se ve bien y con sentido. Los tests automáticos
cubren las reglas.

## Pendientes

Ninguno. Decisiones cerradas el 2026-10-15:

- **Días de pago:** el 15 y el último día del mes, igual que el generador. La regla R9 se queda fija; no hace falta
  que sea configurable.
- **Mapa de ciudad:** polígonos de las 16 alcaldías de CDMX (Marco Geoestadístico INEGI, libre uso), simplificados,
  con los puntos de gasto encima (R13).
- **Identidad visual:** estilo moderno de colores brillantes con base **negro y dorado**. El modo es **automático**:
  sigue la preferencia del sistema (claro u oscuro) y trae un botón para cambiarlo. La paleta se valida en la demo de
  la Fase 1.

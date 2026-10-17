# Proposal

## Why

La Fase 2 de `docs/PLAN.md` entrega una sección por patrón con su gráfica embebida y su hallazgo, y los 3 a 5
hallazgos principales en el resumen. La página de la Fase 1 solo muestra el encabezado, los KPIs y el cierre, no
incrusta ninguna librería de gráficas, y su detector de red tiene puntos ciegos en JavaScript minificado que
muerden justo al incrustar ECharts (issue #18).

## What Changes

- La página incrusta Apache ECharts (versión exacta en el design), sin red, con su licencia declarada.
- La página muestra los hallazgos principales en el resumen, en el orden que trae el análisis, cada uno con su
  cifra en formato es-MX.
- La página tiene una sección por patrón (categoría dominante, zona favorita, quincena, fin de semana, viaje),
  con su gráfica, su hallazgo y lo que R14 pide decir cuando el patrón no aparece o no tiene datos.
- Las gráficas usan la paleta negro y dorado en los dos temas y muestran sus cifras ya formateadas en es-MX.
- El texto de los datos (categorías, zonas, conceptos) nunca rompe la página aunque traiga marcado.
- El detector de red ve las cargas en JavaScript minificado que hoy no ve y revisa en tiempo lineal (absorbe la
  parte de #18 que cae dentro de la definición de R16).
- No entra: la tabla de desglose y atípicos (Fase 3), el mapa (Fase 4), ampliar la definición de R16 a
  posiciones que hoy no nombra (`imagesrcset`, `background`, `meta refresh`, `image-set`, `img.src =`).

## Capabilities

### New Capabilities

- (ninguna)

### Modified Capabilities

- `pagina-del-reporte`: se añaden los hallazgos del resumen, las cinco secciones con su gráfica, la librería de
  gráficas incrustada y su tema; el requisito de cero red se extiende a la página con la librería y al
  JavaScript minificado.

## Impact

- `src/reporte/presentacion/` (área `presentacion`): `activos/` gana el archivo de ECharts y sus textos de
  licencia, y `activos/LICENCIAS.md` sus filas; `pagina.py` y `plantillas/reporte.html.j2` ganan las secciones;
  módulos nuevos para las opciones de cada gráfica (dicts) y los textos de los hallazgos; `tema.py` gana los
  colores de serie; `red.py` se endurece.
- `tests/presentacion/` (área `presentacion`): pruebas por sección, de opciones de gráfica, de tema, de la librería
  incrustada y del detector contra el JavaScript minificado y la página real.
- Consume del change `detect-spending-patterns`: `Analisis.patrones` y `Analisis.hallazgos`, con los nombres de su
  design. Para las pruebas se construye un `Analisis` a mano, como en la Fase 1 (`tests/presentacion/_pagina_de_prueba.py`).
- Entorno: el archivo de ECharts lo baja el usuario fuera del repositorio; el equipo lo copia y verifica su SHA-256.
- Peso: la página pasa de unos 0.4 MB a unos 1.5 MB; el límite de 10 MB de la suite de sistema no cambia.

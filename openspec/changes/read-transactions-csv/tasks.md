# Tasks

Ola `1-monthly-summary` (Fase 1 de `docs/PLAN.md`). Este change es el **PR 1 de 5** de la ola; los PRs 2 a 5
son del change `monthly-summary-page`. El grafo completo de la ola:

- PR 1 (este change, grupo 1) y PR 2 (`monthly-summary-page`, grupo 1) arrancan **en paralelo**: áreas y
  archivos disjuntos.
- PR 3 (`monthly-summary-page`, grupo 2) arranca cuando el PR 1 está mergeado en la rama de ola: consume
  `Transacciones`.
- PR 4 y PR 5, ver `monthly-summary-page`.

Regla de la fase para este grupo: los mensajes de rechazo son en español; el único texto que es contrato es
«El archivo no tiene transacciones» (`docs/DOMINIO.md`, casos borde); del resto, los tests afirman lo que el
mensaje debe nombrar (la columna, la fila y el campo, los meses, la ruta), no su redacción.

## 1. Lectura y validación del CSV (PR 1, área `datos` más `src/reporte/nucleo/tipos.py` y `tests/test_arquitectura.py`, ~600 líneas)

- [ ] 1.1 Crear `tests/test_arquitectura.py` con la matriz de imports de `docs/ARQUITECTURA.md` (design,
  «Test de arquitectura»), antes de crear las capas. **Flujo que protege:** que ninguna capa de
  `src/reporte` importe de una capa o librería que la matriz no le permite (reglas innegociables 1 y 2,
  issue #6). Se verifica con el test en verde al cerrar el grupo y con una mutación por regla: un
  `import reporte.datos` sembrado en `nucleo`, un `import pathlib` en `nucleo`, un
  `import reporte.presentacion` en `datos` (cada una lo pone en rojo nombrando archivo e import).
- [ ] 1.2 Crear `src/reporte/nucleo/__init__.py` y `src/reporte/nucleo/tipos.py` con la dataclass congelada
  `Transacciones(tabla: pd.DataFrame, mes: date, avisos: tuple[str, ...])` de `docs/ARQUITECTURA.md`
  (Contratos). Solo el tipo: `analizar` y el resto del núcleo son del change `monthly-summary-page`. Se
  verifica con `mypy` y con el test de 1.1 en verde.
- [ ] 1.3 Crear `src/reporte/datos/` con `ErrorDeEntrada` y `leer_transacciones(ruta: Path) -> Transacciones`,
  exportados desde `reporte.datos`, que cumplen los requisitos de columnas, codificación, archivo sin
  transacciones, ruta inexistente y resultado tipado de la spec `lectura-de-transacciones`. **Flujo que
  protege:** que el autor que pasa un CSV con el contrato de 9 columnas obtenga sus transacciones tipadas, y
  que el que pasa otro archivo sepa por qué se rechaza (R1, casos borde «Archivo vacío o con solo el
  encabezado», «Acentos y BOM» y «Montos con más de 2 decimales»). Se verifica con un test por escenario de
  esos requisitos en `tests/datos/`, por `leer_transacciones`, y la mutación de cada uno (p. ej. quitar
  `-sig` del encoding pone en rojo el escenario del BOM).
- [ ] 1.4 En la misma capa, la validación de filas, identificadores y mes: requisitos «Cada fila cumple el
  formato de sus campos», «El rechazo de una fila dice su número y su motivo», «El identificador de cada
  transacción es único» y «Todas las transacciones caen en un solo mes». **Flujo que protege:** que nunca se
  descarte una fila en silencio y que el mensaje lleve al autor a la fila exacta (R2, R3). Se verifica con un
  test por escenario y la mutación de cada uno (p. ej. numerar las filas desde 1 en la primera transacción
  pone en rojo el escenario de la primera fila inválida).
- [ ] 1.5 Los avisos de coordenadas fuera de México: requisito «Las coordenadas fuera de México se aceptan
  con aviso», con los límites incluidos como válidos. **Flujo que protege:** que un CSV real con una compra
  en el extranjero genere el reporte y lo advierta (caso borde «Coordenadas fuera de México»). Se verifica
  con los dos escenarios y la mutación de un límite (`<` por `<=`).

El escenario «Mes de 20,000 transacciones del generador» lo protege la suite `sistema` del grupo 4 de
`monthly-summary-page` (lee un CSV del generador real); en `tests/datos/` basta una muestra de pocas filas
con la forma exacta que escribe el generador (comillas en `zona`, seis decimales en las coordenadas).

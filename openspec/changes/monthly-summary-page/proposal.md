# Proposal

## Why

La Fase 1 de `docs/PLAN.md` se demuestra con un comando: `python -m reporte output/transacciones_2026-09.csv`
produce `output/reporte_2026-09.html`, una página que abre en modo avión con encabezado, los KPIs del resumen,
el estilo base (fuente embebida, paleta negro y dorado, modo claro/oscuro automático con botón) y el mensaje
final. El change `read-transactions-csv` (misma ola) entrega las transacciones validadas; falta resumirlas
(R4 y R5), darles formato es-MX (R15), producir el archivo único y sin red (R16) que termina con el mensaje
literal (R17), y la CLI que lo encadena.

## What Changes

- `nucleo` gana `analizar`: de las transacciones validadas sale un `Analisis` con el mes, su último día
  (R3), el resumen (gasto total, número de transacciones, ticket promedio, día de mayor gasto con su monto,
  gasto variable y su proporción del total: R4 y R5) y los avisos.
- `presentacion` gana los formateadores es-MX (montos, porcentajes, enteros, fechas, días de la semana y
  meses: R15), un detector de referencias de red (R16, con la definición precisada en la issue #5) y
  `renderizar`, que produce un único HTML con la fuente Inter incrustada, la paleta negro y dorado con tema
  claro y oscuro (automático y con botón que recuerda la elección), los avisos y el mensaje final como último
  texto visible (R17).
- Nace la CLI `python -m reporte CSV [-o SALIDA]`: escribe `reporte_AAAA-MM.html` junto al CSV (o en
  `SALIDA`), y traduce un CSV rechazado a un mensaje en español y un código de salida distinto de cero.
- La suite `sistema` gana el flujo de la fase: genera un mes con el generador real, corre la CLI y comprueba
  la página (KPIs contra el CSV, cero red, mensaje final, < 10 MB).
- El README deja de decir que el reporte «todavía no existe» y documenta su uso.
- No entra: los hallazgos en lenguaje natural de R4 ni la parte de R14 que los gobierna (pasan a la Fase 2,
  la primera que tiene patrones de los que salen; decisión D1 del pre-vuelo, `docs/olas/1-monthly-summary-revision.md`),
  patrones, gráficas, ECharts, mapa, desglose y la opción `--abrir` de la CLI.

## Capabilities

### New Capabilities

- `resumen-del-mes`: las cifras del resumen ejecutivo de un mes y cómo se calculan (R3 último día, R4 sin
  hallazgos, R5, caso borde «Una sola transacción»).
- `pagina-del-reporte`: la página HTML única: su contenido de la Fase 1, el formato es-MX, la ausencia de
  red, el tema claro/oscuro, la fuente incrustada y el mensaje final (R15–R17).
- `linea-de-comandos`: cómo se invoca el reporte, dónde escribe, y qué responde ante un CSV rechazado.

### Modified Capabilities

Ninguna.

## Impact

- Se crean en `src/reporte/nucleo/`: el `Analisis`, el `Resumen` y `analizar` (exportado desde
  `reporte.nucleo`). `src/reporte/nucleo/tipos.py` lo crea `read-transactions-csv` y aquí no se toca salvo
  para añadir tipos.
- Se crean en `src/reporte/presentacion/`: los formateadores, el detector de red, el tema, `renderizar`
  (exportado desde `reporte.presentacion`), `plantillas/` (la plantilla Jinja2) y `activos/` con
  `InterVariable.woff2`, su licencia y `LICENCIAS.md` (regla innegociable 6).
- Se crean: `src/reporte/app.py`, `src/reporte/__main__.py`, `tests/nucleo/`, `tests/presentacion/`,
  `tests/app/` y `tests/sistema/test_reporte.py`.
- Se modifica: `README.md` (descripción y uso del reporte).
- No se tocan: `generador/`, `tests/sistema/test_generador.py`, `tests/test_pureza.py`, `pyproject.toml`,
  `docs/`.
- Dependencias: ninguna de Python nueva (Jinja2 3.1 ya está en `pyproject.toml:6`). **Activo vendorizado
  nuevo:** Inter 4.1 (`InterVariable.woff2`, OFL-1.1), que entrega el usuario antes del grupo 3 (decisión D3
  del pre-vuelo).
- Áreas del perfil: `nucleo`, `presentacion`, `app`; `tests/sistema/**` es del área `generador` y
  `README.md` no tiene área: los dos se asignan explícitamente al grupo 4.
- Depende de `read-transactions-csv` (misma ola): consume `Transacciones` de `reporte.nucleo.tipos`, y
  `leer_transacciones` y `ErrorDeEntrada` de `reporte.datos`.

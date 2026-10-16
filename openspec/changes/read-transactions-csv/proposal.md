# Proposal

## Why

La Fase 1 de `docs/PLAN.md` («Leer, validar y resumir») empieza por la entrada: hoy nada lee el CSV del
generador ni de ninguna otra fuente. Las reglas R1–R3 de `docs/DOMINIO.md` (columnas, filas válidas, un solo
mes) y sus casos borde de entrada todavía no tienen código ni test, y el resto de la fase (el resumen, la
página y la CLI del change `monthly-summary-page`) consume lo que esta capa produce. Es también el momento de
volver automáticas las reglas innegociables 1 y 2 (dirección de imports entre capas, issue #6): esta ola crea
las capas.

## What Changes

- Nace la capa `datos`: lee un CSV de transacciones de un mes y lo devuelve validado y tipado, o lo rechaza
  con un error en español que dice qué falla (la columna, la fila y su motivo, o los meses encontrados).
- Nace en `nucleo` el tipo que `datos` produce y `nucleo` consume (la tabla tipada, el mes y los avisos),
  sin que `nucleo` dependa de `datos` (`docs/ARQUITECTURA.md`, Contratos).
- Se aceptan, con aviso, las coordenadas fuera de México; se aceptan el BOM, los acentos y los montos con
  más de dos decimales; se rechazan el archivo vacío, el que no es UTF-8 y el que no existe.
- Un test de arquitectura vigila la matriz «Puede importar de» de `docs/ARQUITECTURA.md` para todas las
  capas de `src/reporte`, incluido que `nucleo` no importe I/O (absorbe la issue #6).
- No entra: el análisis (`analizar`), la página, la CLI ni la suite de sistema del reporte (change
  `monthly-summary-page`, misma ola); ninguna regla R4–R17.

## Capabilities

### New Capabilities

- `lectura-de-transacciones`: qué CSV acepta el reporte, qué rechaza y con qué mensaje, y qué avisos
  produce al aceptarlo (R1–R3 y los casos borde de entrada de `docs/DOMINIO.md`).

### Modified Capabilities

Ninguna.

## Impact

- Se crean: `src/reporte/nucleo/__init__.py`, `src/reporte/nucleo/tipos.py` (solo `Transacciones`),
  `src/reporte/datos/__init__.py` y los módulos de lectura y validación de `datos`, `tests/datos/` con sus
  fixtures en `tests/datos/fixtures/`, y `tests/test_arquitectura.py`.
- No se tocan: `generador/`, `tests/sistema/`, `tests/test_pureza.py`, `pyproject.toml`, `docs/`.
- Dependencias: ninguna nueva (pandas 2.3 ya está en `pyproject.toml:6` y en la caché de ruedas).
- Áreas del perfil: `datos` (`src/reporte/datos/**`, `tests/datos/**`); `src/reporte/nucleo/tipos.py` es del
  área `nucleo` y `tests/test_arquitectura.py` no tiene área: los dos se asignan explícitamente a este grupo.
- Consumidores dentro de la ola: el change `monthly-summary-page` importa `Transacciones` de
  `reporte.nucleo.tipos`, y `leer_transacciones` y `ErrorDeEntrada` de `reporte.datos`, con esos nombres.

# Proposal

## Why

La Fase 0 de `docs/PLAN.md` (andamiaje y mecánica) no está entregada: el esqueleto `src/reporte`, el
`pyproject.toml`, el gate y `/da-init` ya existen, pero el generador sintético sigue en la raíz del repositorio
(`generar_transacciones.py`, `configuracion.py`) en lugar de `generador/`, y el README describe todavía un
proyecto aparte. Las fases 1 a 4 necesitan el generador en su capa (`docs/ARQUITECTURA.md`, capa `generador`)
para que la suite de sistema genere CSV con semillas fijas, y la regla innegociable 5 («`src/` nunca importa
`generador/` ni Faker») solo se puede volver automática cuando ese paquete existe.

## What Changes

- El generador se mueve, **sin cambiar su comportamiento**, a un paquete `generador/` en la raíz
  (`generador/generar_transacciones.py`, `generador/configuracion.py`, más `__init__.py` y `__main__.py`).
- **BREAKING** (solo para quien lo invoca a mano): el generador se corre con `python -m generador [opciones]`
  desde la raíz; `python generar_transacciones.py` deja de existir. Las opciones, sus valores por defecto y la
  salida no cambian.
- Antes del movimiento entra una guarda de reproducibilidad en la suite de sistema: con dos juegos de
  parámetros fijos, el CSV y el resumen de `-v` deben coincidir byte a byte con los que produce hoy el
  generador en `master` 9fd8ab8. Es también la prueba de sistema del flujo principal de la Fase 0.
- La regla innegociable 5 se vuelve automática: un test de arquitectura falla si algún módulo de
  `src/reporte` importa `generador` o `faker`.
- El README pasa a describir este proyecto e indica la instalación de `docs/STACK.md`
  (`pip install -e ".[dev]"`) y la nueva invocación del generador.
- No entra: ninguna regla R1–R17 de `docs/DOMINIO.md` (la Fase 0 no cierra reglas de dominio), las capas
  `nucleo`/`datos`/`presentacion`/`app`, una API programática del perfil inyectado (llega con la Fase 2, que
  es la primera que lo consume), ni la verificación de ECharts.

## Capabilities

### New Capabilities

- `generador-sintetico`: cómo se invoca el generador de transacciones sintéticas, su reproducibilidad por
  semilla y su aislamiento respecto del código del reporte.

### Modified Capabilities

Ninguna.

## Impact

- Se mueven: `generar_transacciones.py` → `generador/generar_transacciones.py`; `configuracion.py` →
  `generador/configuracion.py` (cambia una línea: el import de `configuracion`).
- Se crean: `generador/__init__.py`, `generador/__main__.py`, `tests/sistema/test_generador.py`.
- Se modifican: `tests/test_pureza.py` (test de la regla 5), `README.md`.
- No se tocan: `src/`, `pyproject.toml`, `requirements.txt`, `requirements-dev.txt`, `docs/`.
- Nadie más importa ni cita los dos archivos movidos: la única referencia fuera de ellos es `README.md`.
- Áreas del perfil: `generador` (`generador/**`, `tests/sistema/**`); `tests/test_pureza.py` y `README.md` no
  pertenecen a ningún área y se asignan explícitamente al grupo 2.

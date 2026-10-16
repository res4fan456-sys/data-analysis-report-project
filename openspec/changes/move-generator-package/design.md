# Design

## Context

Estado en `master` 9fd8ab8 (ver proposal.md, *Why*):

- `generar_transacciones.py` (506 líneas) y `configuracion.py` (216 líneas) viven en la raíz. El primero
  importa el segundo como módulo de primer nivel (`import configuracion as cfg`, `generar_transacciones.py:22`)
  y se ejecuta como script (`generar_transacciones.py:505-506`).
- Toda la configuración de la CLI está en `parse_args()` y `main()` (`generar_transacciones.py:438-502`); no
  hay función pública que devuelva el perfil inyectado: solo se ve con `-v` (`imprimir_resumen`, línea 396).
- La generación es determinista para una semilla dada: dos corridas con los mismos parámetros dan el mismo
  SHA-256, y el CSV es el mismo con y sin `-v` (el resumen se imprime después de escribir, líneas 500-502).
- Cada corrida del generador cuesta ~23 s en esta máquina, casi todo de arranque (igual con 2,000 que con
  20,000 filas).
- `.venv/bin/pytest` no pone la raíz del repositorio en `sys.path`, así que un test no puede importar
  `generador` sin tocar la configuración de pytest; un subproceso con `cwd` en la raíz sí puede correr
  `python -m generador`.
- `tests/test_pureza.py` ya recorre todo `src/reporte` con `ast` buscando imports prohibidos.
- La única referencia a los dos archivos fuera de ellos es `README.md` (líneas 14, 29 y 63).

## Goals / Non-Goals

**Goals:**

- Mover el generador a `generador/` con cero cambio en lo que produce, demostrado por una guarda escrita
  antes del movimiento y con oráculos calculados fuera del grupo que mueve.
- Dejar la regla innegociable 5 vigilada por un test.

**Non-Goals:**

- Tipar el generador o meterlo en `mypy` (`pyproject.toml` declara `files = ["src"]`).
- Una API Python del generador (`generar(...) -> (filas, perfil)`): la necesita la suite de sistema de la
  Fase 2 para comparar lo detectado con lo inyectado; se diseña allí, con su consumidor.
- Retirar `requirements.txt`.

## Decisions

1. **Paquete con los mismos nombres de módulo.** `generador/generar_transacciones.py` y
   `generador/configuracion.py` conservan su nombre para que el diff sea un renombrado más una línea; la
   única edición de lógica permitida es el import, que pasa a `from generador import configuracion as cfg`.
   Alternativa descartada: renombrar módulos (p. ej. `cli.py`), que mezcla movimiento y rediseño.
2. **`python -m generador`.** `generador/__main__.py` llama a `main()` de `generar_transacciones`. Correr el
   módulo por ruta (`python generador/generar_transacciones.py`) deja de funcionar, porque el import es
   absoluto; el README documenta solo la forma `-m`. Alternativa descartada: import relativo con respaldo a
   absoluto, que conserva dos formas de invocar sin necesidad.
3. **Guarda por subproceso, en la suite de sistema.** `tests/sistema/test_generador.py` (marcador
   `sistema`) ejecuta el generador como lo ejecutaría el usuario, con `sys.executable` y `cwd` en la raíz del
   repositorio, y compara SHA-256 contra los oráculos de la spec, calculados en el pre-vuelo sobre `master`
   9fd8ab8. Dos corridas: septiembre de 2026 con `-v` (CSV y salida estándar) y febrero de 2028 sin `-v`
   (CSV, salida vacía y día 29). Así la guarda no importa internos, sobrevive al movimiento cambiando solo el
   comando, y es la prueba de sistema del flujo principal de la fase. Alternativa descartada: test unitario
   en proceso, que exige `pythonpath` en `pyproject.toml` y añade ~25 s al gate en cada `verify`.
4. **Regla 5 en `tests/test_pureza.py`.** Un test nuevo en ese archivo reutiliza su recorrido de imports y
   falla si algún módulo de `src/reporte` importa `generador` o `faker`. No se mete en `PROHIBIDOS`, cuyo test
   tiene otro propósito y otro nombre.

## Risks / Trade-offs

- [Los oráculos dependen de Faker 40.43.0 y del `random` de Python 3.14] → Es lo que se quiere vigilar: el
  generador está fijado a esa versión (`requirements.txt`, `pyproject.toml`). Si una actualización futura los
  rompe, se recalculan en un change propio, nunca dentro de un grupo que mueva código.
- [La guarda se edita en el mismo grupo que mueve el generador] → Solo cambia el comando que invoca; los
  parámetros y los cuatro valores esperados no cambian, y la tarea lo exige de forma explícita.
- [El nombre del programa en `--help` y en los errores de `argparse` cambia de `generar_transacciones.py`
  a la forma de `-m`] → Cambio aceptado y declarado; no forma parte del contrato.
- [La guarda tarda ~50 s] → Vive en `sistema`, fuera del gate.

## Migration Plan

Quien corra el generador a mano pasa de `python generar_transacciones.py …` a `python -m generador …`
(README). No hay datos que migrar: `output/` no se toca.

# Design

## Context

- Hoy `src/reporte/` solo tiene `__init__.py`; no existen `nucleo/` ni `datos/`. La única guarda de
  arquitectura es `tests/test_pureza.py`, que busca librerías de red, subprocesos y bases de datos y que
  `src/` no importe el generador; no mira qué capa importa de cuál (issue #6).
- `docs/ARQUITECTURA.md` (Contratos) fija los nombres que este change entrega y que consume el change
  `monthly-summary-page`: `ErrorDeEntrada`, `Transacciones(tabla, mes, avisos)` en `nucleo/tipos.py` y
  `leer_transacciones(ruta: Path) -> Transacciones`.
- El generador escribe UTF-8 sin BOM, comillas solo donde hace falta (`zona` lleva coma: `Roma Norte, CDMX`),
  montos con dos decimales y coordenadas con seis. Un mes de 20,000 filas pasa R1–R3 sin avisos (comprobado
  en el pre-vuelo con `python -m generador --mes 2026-09 --semilla 42`).
- pandas 2.3 ya es dependencia (`pyproject.toml:6`).

## Goals / Non-Goals

**Goals:**
- Validación completa de R1–R3 con mensajes en español, una cáscara de I/O mínima y la lógica testeable con
  tablas hechas a mano.
- El tipo `Transacciones` en `nucleo` para que `nucleo` no dependa de `datos`.
- La matriz de imports de `docs/ARQUITECTURA.md` como test automático.

**Non-Goals:**
- Reportar todas las filas inválidas a la vez: se nombra la primera, y el usuario corrige y vuelve a correr.
- Adaptar exportaciones de banco u otros formatos (fuera de alcance del MVP en `docs/PLAN.md`).

## Decisions

- **Todo se lee como texto y se valida después.** `pandas.read_csv` con `dtype=str`, `keep_default_na=False`
  y `encoding="utf-8-sig"` (acepta con y sin BOM), y la conversión de tipos la hace la validación, columna por
  columna. Así ningún valor se interpreta en silencio (`NA`, `null` o una fecha ambigua) y el motivo del
  rechazo lo decide nuestro código, no el parser. Alternativa descartada: dejar que pandas infiera los tipos;
  convierte `"NA"` en nulo y oculta la fila culpable.
- **La validación es una función pura sobre filas de texto.** La lectura (abrir, decodificar, separar campos)
  es una cáscara delgada; la validación recibe el encabezado y las filas como texto y devuelve la tabla
  tipada o un `ErrorDeEntrada`. Los tests de reglas usan CSV escritos en `tmp_path` o en
  `tests/datos/fixtures/` por la interfaz pública `leer_transacciones`; la función pura existe para que la
  cáscara no tenga lógica.
- **Orden de comprobación**: existencia de la ruta → decodificación UTF-8 → archivo sin transacciones →
  columnas (R1) → filas en orden de archivo, cada una con sus campos en el orden del contrato (R2: número de
  campos, vacíos, `fecha`, `monto`, `latitud`, `longitud`) → identificadores repetidos → un solo mes (R3) →
  avisos. El primer fallo gana; así el mensaje es determinista.
- **Número de fila de hoja de cálculo**: encabezado = 1, primera transacción = 2. Es el número que el autor ve
  al abrir el CSV en una hoja de cálculo.
- **Filas con campos de más o de menos.** Con `dtype=str`, pandas rechaza una fila con campos de más
  (`ParserError` con la línea) y rellena con nulos una fila con campos de menos. La cáscara traduce el
  primero a `ErrorDeEntrada` con el número de fila, y la validación trata los nulos como campo vacío.
  Alternativa: leer con el módulo `csv` de stdlib, que da el control fila a fila sin traducir excepciones;
  queda a juicio del implementador si la traducción de `ParserError` resulta frágil, siempre que la interfaz
  y los mensajes no cambien.
- **Meses del rechazo R3 como `AAAA-MM`**, en orden. `datos` no puede importar los formateadores de
  `presentacion` (matriz de `docs/ARQUITECTURA.md`), y `AAAA-MM` es el mismo formato del nombre del archivo
  que produce el generador.
- **Las columnas se aceptan en cualquier orden** y la tabla sale en el orden del contrato. R1 exige el
  conjunto exacto; el orden no cambia ningún análisis.
- **Un solo aviso agregado de coordenadas fuera de México**, con el número de transacciones afectadas: con
  20,000 filas, un aviso por fila haría ilegible la página.
- **Test de arquitectura en `tests/test_arquitectura.py`**, con la matriz de `docs/ARQUITECTURA.md`
  (columna «Puede importar de») como dato: `nucleo` → stdlib y pandas, sin módulos de I/O de stdlib
  (`pathlib`, `os`, `io`, `shutil`, `tempfile`, `glob`, `socket`, `urllib`, `http`) y sin llamar a `open`;
  `datos` → stdlib, pandas y `reporte.nucleo.tipos`; `presentacion` → stdlib, Jinja2 y `reporte.nucleo`
  (sin pandas: no calcula estadísticas, regla innegociable 2); `app` y el paquete raíz → todas. Recorre con
  `ast` todos los módulos de `src/reporte` (incluidos los imports relativos) y nombra archivo e import
  prohibido. La pertenencia a stdlib sale de `sys.stdlib_module_names`. Las capas que aún no existen no se
  revisan: el test cubre cada capa en cuanto aparece. No reemplaza a `tests/test_pureza.py`, que sigue
  vigilando las reglas 1 (librerías de red) y 5.

## Risks / Trade-offs

- [El test de arquitectura no puede fallar mientras una capa no exista] → el implementador reporta la
  mutación de cada regla de la matriz (un import prohibido sembrado en cada capa que exista al cerrar el
  grupo) y el test comprueba que encuentra al menos los módulos de `nucleo` y `datos`.
- [La matriz de `docs/ARQUITECTURA.md` no lista numpy y pandas lo arrastra] → si `nucleo` o `datos`
  necesitan importar numpy directamente, se escala al PM: es un cambio de `docs/ARQUITECTURA.md`, no del
  test.
- [Un CSV real de 20,000 filas validado fila a fila en Python puro es lento] → la validación de formato se
  hace por columna con operaciones vectorizadas de pandas y solo se busca la primera fila culpable cuando
  hay alguna; el escenario de 20,000 filas del generador es la medida.
- [`ParserError` de pandas cambia su texto entre versiones] → la fila se toma del número de línea que
  pandas reporta, y el test de «fila con campos de más» lo protege; si no es estable, se usa `csv` de stdlib
  para la separación (ver Decisions).

# Ola 1-monthly-summary — Leer, validar y resumir

**Rama:** `ola/1-monthly-summary` · **Changes:** `read-transactions-csv`, `monthly-summary-page` · **Abierta:** 2026-10-16

## Arranque

- Base: `chore/1-monthly-summary-planning` f67d529 (avance continuo pedido por el usuario; pila #14 → `ola/0-scaffolding` → #11 → `chore/0-scaffolding-planning` → #3 → `master`). La PR de ola apunta a `chore/1-monthly-summary-planning`, por indicación del Team Manager; el brief decía `ola/0-scaffolding`, que es la base de esa rama.
- `preflight`: 4/4 OK (`gh auth` con scope `workflow`, remoto y ramas `ola/*`, `openspec`, `graft`). Única rama `ola/*` remota: `ola/0-scaffolding`, en espera de merge (PR #11 abierta), no activa.
- `verify` sobre la base (f67d529, worktree del PM): formato, lint, tipos, test y citas OK; 2 passed, 3 deselected.
- `sistema` sobre la base (f67d529): 3 passed, 2 deselected en 64 s; sin rojos heredados.
- `openspec instructions apply`: `read-transactions-csv` ready 0/5, `monthly-summary-page` ready 0/9; sin `context` ni `operationGuidance`.
- Inventario de lo que solo el usuario puede dar: nada. La fuente (D3) está fuera del repo y sus dos SHA-256 coinciden con el brief (comprobado de nuevo en el arranque). Sin `[PENDIENTE]` en los artefactos.
- Comprobado contra el código antes de encargar: `pandas.read_csv(dtype=str, keep_default_na=False, encoding="utf-8-sig")` lanza `EmptyDataError` con 0 bytes, da 0 filas con solo el encabezado, lanza `ParserError` «Expected 9 fields in line 3, saw 10» con un campo de más (la línea coincide con la fila de hoja de cálculo), rellena con `''` (no con nulos, por `keep_default_na=False`) una fila con campos de menos, y quita el BOM del nombre de la primera columna.
- `mypy` solo revisa `src/` (`pyproject.toml`); `tests/` no tiene `__init__.py`, así que dos tests con el mismo nombre de archivo en carpetas distintas chocan al recolectar.
- Specs heredados inestables de `sistema`: ninguno.

## PRs

| # | Grupo (change · tareas) | Rama | Estado |
|---|---|---|---|
| #17 | `read-transactions-csv` · 1.1–1.5 | `feat/1-read-transactions-csv` | mergeada (3cff17b) — 1 mecánica (líneas en blanco, por lectura del diff del PM) · 1 ronda · 0 por corrección; BLOQUEA de juicio del crítico (segundos 60/61); pasada final por la salida (a), LISTA en la pasada corta |
| #16 | `monthly-summary-page` · 1.1–1.2 | `feat/1-es-mx-formatters-network-detector` | mergeada (1216a79) — 0 mecánicas · 1 ronda · 0 por corrección; BLOQUEA de juicio del crítico (`np.float64` en los formateadores); pasada final por la salida (b): docstring de `red.py` a #18 |
| #20 | `monthly-summary-page` · 2.1 | `feat/1-monthly-summary-core` | mergeada (ec732eb) — 0 mecánicas · 1 ronda · 0 por corrección; BLOQUEA de juicio del crítico (empate decidido por el error de la suma `float`); pasada final por la salida (a), LISTA en la pasada corta sobre 4738bd6; rebasada como 43c7f80 (`verify` OK; `sistema` de 4738bd6, producto idéntico) |
| #21 | `monthly-summary-page` · 3.1–3.3 | `feat/1-report-page` | mergeada (871c98b) — 0 mecánicas · 1 ronda · 0 por corrección; BLOQUEA de juicio del crítico (CSS `capitalize` reescribía el mes; su test buscaba subcadena); pasada final trivial (solo tests) en 7551ccc |
| #22 | `monthly-summary-page` · 4.1–4.3 | `feat/1-report-cli` | mergeada (56cf538) — 0 mecánicas · 1 ronda · 0 por corrección; BLOQUEA de juicio del crítico (nombre de la página sin probar con otro mes; uso en stderr sin proteger); pasada final trivial (solo tests) en 535aeaa |

## Decisiones del PM

- PR #17: un registro completamente vacío (línea en blanco) se ignora en cualquier posición, sin correr la numeración de hoja de cálculo; una línea de solo espacios sigue siendo una fila y se rechaza. Es lo que hacía el `read_csv` por defecto que el design proponía (`skip_blank_lines`). Descartado: rechazar el CSV válido que termina con una línea en blanco (lo que hacía la primera entrega, con un mensaje que nombraba un `id_transaccion` vacío). Devolución del PM antes del crítico, por lectura del diff.
- PR #17: la lectura usa `csv` de stdlib en modo estricto en vez de `read_csv`, como el design deja a juicio del implementador; interfaz y mensajes no cambian. Descartado: traducir `ParserError` de pandas.
- PR #17: `OSError` al leer (permisos) no se traduce a `ErrorDeEntrada`; `is_file()` cubre ruta inexistente y carpeta. Descartado: un test que simule el error con un doble del sistema de archivos.
- PR #17: el reporte de mutación de la corrección de líneas en blanco no llegó al PM (las respuestas del implementador tras reanudarlo no se entregaron); sus seis tests van como `sin garantía` en `Mutación` y la mutación la siembra el crítico. Descartado: relanzar otra instancia solo para medirla. El crítico de #17 los sembró: los seis muerden.
- PR #17: las líneas en blanco antes del encabezado también se ignoran (el encabezado es el primer registro no vacío), a raíz del NO BLOQUEA 3 del crítico. Descartado: rechazarlas con un «faltan las nueve columnas» que no dice qué arreglar.

- PR #20: un empate de días en dinero que solo difiere por el error de la suma binaria cuenta como empate (gana el más temprano); una diferencia real, aunque sea de menos de un centavo, no. Descartado: redondear las sumas diarias a centavos en `nucleo` (`CLAUDE.md`, Convenciones: se redondea solo al formatear).

- PR #21: el JavaScript del tema (almacenamiento en `try/catch`, script antes del cuerpo, `aria-label` al alternar) queda sin test automático y va a la revisión visual; el crítico lo probó con Chrome headless (preferencia del sistema, alternar, almacenamiento bloqueado, elección guardada). Descartado: un test que cuente `localStorage` dentro de `try` en el texto del script (afirma marcado, `CLAUDE.md` TDD regla 6).
- PR #21: la paleta la eligió el implementador (oscuro: fondo `#0b0b0d`, texto `#f4f1e8`, acento `#f5c542`; claro: fondo `#faf8f2`, texto `#17140d`, acento `#8a6200`), con contraste medido por par; el usuario la valida en la revisión visual. El crítico avisa que el dorado del claro tira a ocre.
- PR #21: el lector de «último texto visible» no ve texto en atributos (`value` de un `input`) ni en `content` de CSS. Aceptado sin acción: la página no tiene ese marcado.

- PR #22: la capa `app` (con `__main__.py`) solo importa stdlib y `reporte.*` en `tests/test_arquitectura.py`; «todas las anteriores» de `docs/ARQUITECTURA.md` se lee como capas, no como sus librerías. Descartado: dejar permitido `import pandas` en `app.py`, como tenía la guarda desde #17. El crítico la juzgó defendible.
- PR #22: un CSV que no se puede leer (`OSError`, p. ej. sin permiso) da en `app` un mensaje en español con la ruta y código 1, sin traza. Descartado: dejarlo a issue (la spec no enumera el caso) o traducirlo en `datos/`.
- PR #22: la escritura atómica de la página (#23) y el rechazo de `-o` igual al CSV (#24) van a issue. Descartado: corregirlos en la PR, fuera de la spec `linea-de-comandos`.

- Cierre: lo lleva el mismo PM que mergeó #20–#22, retomado por el Team Manager tras el handover, por economía de tokens (decisión del Team Manager). Descartado: lanzar un PM nuevo que releyera la ola por §1b.

## Deuda

- PR #16: puntos ciegos del detector de red en JavaScript minificado (literal regex con comilla, `import{a}from"…"`, `importScripts(f(), …)`), caso cuadrático con `url(` sin cerrar, y posiciones fuera de la definición de R16 (`imagesrcset`, `background`, `meta refresh`, `image-set`, `img.src =`). No afecta a la página de la Fase 1; muerde al incrustar ECharts. Issue #18.
- PR #17: la guarda de arquitectura no detecta en `nucleo` las llamadas de I/O de pandas (`pd.read_csv`, `to_csv`…). Hoy el núcleo no lee nada. Issue #19.

- PR #22: una página que se escribe a medias (disco lleno, Ctrl-C) pierde la anterior del mismo mes. Issue #23.
- PR #22: `-o` igual al CSV de entrada lo sobrescribe con HTML sin avisar. Issue #24.

- Mecánica: `da worktree quitar` no borra del registro un worktree cuya carpeta ya no existe (`git worktree prune` no aplica: git ya no lo tiene). Issue #25.

## Se coló

- —

## Lo que queda fuera

- Fase 2 entera (patrones, gráficas, ECharts, hallazgos de R4 y R14), `--abrir` (#12) y #7, por el brief.

## Entorno vivo

- Worktree del PM `.claude/worktrees/pm-ola1` (`ola/1-monthly-summary`): quitado el 2026-10-17, tras el merge de #26 por el usuario.
- Integración a `master` (2026-10-17): el usuario mergeó #3 (a `master`, 32f6128), #11, #14 y #26 (a `chore/1-monthly-summary-planning`, 70a2c6b); solo #3 llegó a `master`.
  - Rama `chore/integrate-waves-0-1`, desde `origin/chore/1-monthly-summary-planning`, con `origin/master` mergeado encima (1a6a810).
  - Único conflicto: add/add en `tasks.md` de `move-generator-package`; gana la versión de la rama, que solo difiere en las cinco casillas marcadas.
  - Lo que solo estaba en `master` (#13, #8, #27) queda idéntico a `master`, con los bits de ejecución de `.claude/da/`; #4 es la base común de las dos ramas.
  - Su PR a `master` lleva `Closes #5` y `Closes #6`; la mergea el usuario.
- `da worktree listar` aún muestra `g1-datos`, `g2-presentacion` y `g3-nucleo`, sin carpeta (issue #25).
- Ningún comando pesado, implementador ni crítico en vuelo.

## Coste

### Mecánica

| Métrica | Valor |
| --- | --- |
| ctx0 — critico | 26.3k |
| caché escrita — critico | 2.3M |
| caché leída — critico | 16.9M |
| ctx0 — implementador | 39.3k |
| caché escrita — implementador | 382.9k |
| caché leída — implementador | 1.5M |
| ctx0 — implementador-app | 38.1k |
| caché escrita — implementador-app | 465.8k |
| caché leída — implementador-app | 3.7M |
| ctx0 — implementador-datos | 40.6k |
| caché escrita — implementador-datos | 718.2k |
| caché leída — implementador-datos | 2.1M |
| ctx0 — implementador-presentacion | 38.9k |
| caché escrita — implementador-presentacion | 1.2M |
| caché leída — implementador-presentacion | 3.8M |
| ctx0 — pm | 33.0k |
| caché escrita — pm | 5.6M |
| caché leída — pm | 31.1M |
| PRs a GitHub | 5 |
| Merges a master — cierre o arreglo | 0 |
| Merges a master — planeación y archivado | 0 |
| Horas de espera (promedio) — cierre o arreglo | 0.0 |
| Horas de espera (promedio) — planeación y archivado | 0.0 |
| Corridas de evidencia | 15 |
| Pasadas de crítico | 12 |
| BLOQUEA en veredictos | 7 |
| NO BLOQUEA en veredictos | 43 |

### Trabajo

| PR | Caché leída/línea (producto) | Horas/línea (producto) | Caché leída/línea (test) | Horas/línea (test) |
| --- | --- | --- | --- | --- |
| #22 | 0 | 0.0 | 0 | 0.0 |
| #21 | 0 | 0.0 | 0 | 0.0 |
| #20 | 0 | 0.1 | 0 | 0.0 |
| #17 | 0 | 0.0 | 0 | 0.0 |
| #16 | 0 | 0.0 | 0 | 0.0 |

### Guardas

| Guarda | Valor |
| --- | --- |
| Se coló | 0 |
| BLOQUEA de código | 7 (#16: 1, #17: 1, #20: 1, #21: 2, #22: 2) |
| sistema al cierre | 7/7 sobre 9eb9044 |

## Handover

- —: la ola se cerró sin relevo pendiente; el handover anterior queda en el historial de git (9eb9044).

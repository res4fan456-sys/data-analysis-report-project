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
| — | `monthly-summary-page` · 4.1–4.3 | `feat/1-report-cli` | pendiente (tras PR 4) |

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

## Deuda

- PR #16: puntos ciegos del detector de red en JavaScript minificado (literal regex con comilla, `import{a}from"…"`, `importScripts(f(), …)`), caso cuadrático con `url(` sin cerrar, y posiciones fuera de la definición de R16 (`imagesrcset`, `background`, `meta refresh`, `image-set`, `img.src =`). No afecta a la página de la Fase 1; muerde al incrustar ECharts. Issue #18.
- PR #17: la guarda de arquitectura no detecta en `nucleo` las llamadas de I/O de pandas (`pd.read_csv`, `to_csv`…). Hoy el núcleo no lee nada. Issue #19.

## Se coló

- —

## Lo que queda fuera

- Fase 2 entera (patrones, gráficas, ECharts, hallazgos de R4 y R14), `--abrir` (#12) y #7, por el brief.

## Entorno vivo

- Worktree del PM: `.claude/worktrees/pm-ola1` (`ola/1-monthly-summary`).
- `g3-nucleo` quitado tras el merge de #20.
- `g4-pagina` quitado tras el merge de #21 (la fuente se copió desde `/home/JP/activos-reporte/inter-4.1/` con SHA-256 iguales al brief).
- 2026-10-16: el implementador de #16 y el crítico de #17 se cortaron por el límite de uso de la API; reanudados por `SendMessage` a la misma instancia.
- El implementador de #17 no entregó sus reportes tras reanudarlo; a cada implementador se le pide copia del reporte en archivo del scratchpad.

## Coste

- —

## Handover

- 2026-10-17: retomada por un PM de relevo (§1b); el handover anterior queda en el historial de git (7cdf08a).

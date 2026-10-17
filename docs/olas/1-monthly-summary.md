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
| #20 | `monthly-summary-page` · 2.1 | `feat/1-monthly-summary-core` | abierta, lista para mergear (aparcada por la pausa del usuario) — 0 mecánicas · 1 ronda · 0 por corrección; BLOQUEA de juicio del crítico (empate decidido por el error de la suma `float`); pasada final por la salida (a), LISTA en la pasada corta sobre 4738bd6 |
| — | `monthly-summary-page` · 3.1–3.3 | `feat/1-report-page` | pendiente (tras PR 2 y PR 3) |
| — | `monthly-summary-page` · 4.1–4.3 | `feat/1-report-cli` | pendiente (tras PR 4) |

## Decisiones del PM

- PR #17: un registro completamente vacío (línea en blanco) se ignora en cualquier posición, sin correr la numeración de hoja de cálculo; una línea de solo espacios sigue siendo una fila y se rechaza. Es lo que hacía el `read_csv` por defecto que el design proponía (`skip_blank_lines`). Descartado: rechazar el CSV válido que termina con una línea en blanco (lo que hacía la primera entrega, con un mensaje que nombraba un `id_transaccion` vacío). Devolución del PM antes del crítico, por lectura del diff.
- PR #17: la lectura usa `csv` de stdlib en modo estricto en vez de `read_csv`, como el design deja a juicio del implementador; interfaz y mensajes no cambian. Descartado: traducir `ParserError` de pandas.
- PR #17: `OSError` al leer (permisos) no se traduce a `ErrorDeEntrada`; `is_file()` cubre ruta inexistente y carpeta. Descartado: un test que simule el error con un doble del sistema de archivos.
- PR #17: el reporte de mutación de la corrección de líneas en blanco no llegó al PM (las respuestas del implementador tras reanudarlo no se entregaron); sus seis tests van como `sin garantía` en `Mutación` y la mutación la siembra el crítico. Descartado: relanzar otra instancia solo para medirla. El crítico de #17 los sembró: los seis muerden.
- PR #17: las líneas en blanco antes del encabezado también se ignoran (el encabezado es el primer registro no vacío), a raíz del NO BLOQUEA 3 del crítico. Descartado: rechazarlas con un «faltan las nueve columnas» que no dice qué arreglar.

- PR #20: un empate de días en dinero que solo difiere por el error de la suma binaria cuenta como empate (gana el más temprano); una diferencia real, aunque sea de menos de un centavo, no. Descartado: redondear las sumas diarias a centavos en `nucleo` (`CLAUDE.md`, Convenciones: se redondea solo al formatear).

## Deuda

- PR #16: puntos ciegos del detector de red en JavaScript minificado (literal regex con comilla, `import{a}from"…"`, `importScripts(f(), …)`), caso cuadrático con `url(` sin cerrar, y posiciones fuera de la definición de R16 (`imagesrcset`, `background`, `meta refresh`, `image-set`, `img.src =`). No afecta a la página de la Fase 1; muerde al incrustar ECharts. Issue #18.
- PR #17: la guarda de arquitectura no detecta en `nucleo` las llamadas de I/O de pandas (`pd.read_csv`, `to_csv`…). Hoy el núcleo no lee nada. Issue #19.

## Se coló

- —

## Lo que queda fuera

- Fase 2 entera (patrones, gráficas, ECharts, hallazgos de R4 y R14), `--abrir` (#12) y #7, por el brief.

## Entorno vivo

- Worktree del PM: `.claude/worktrees/pm-ola1` (`ola/1-monthly-summary`), limpio tras este commit.
- `.claude/worktrees/g3-nucleo` (`feat/1-monthly-summary-core` en 4738bd6, pusheada), sin cambios sin commitear; se quita tras el merge de #20.
- Ningún comando pesado en vuelo. Ningún implementador ni crítico trabajando.
- 2026-10-16: el implementador de #16 y el crítico de #17 se cortaron por el límite de uso de la API (no los paró el usuario); reanudados por `SendMessage` a la misma instancia.
- El implementador de #17 (`implementador-datos`) actúa sobre los mensajes del PM, pero sus reportes tras reanudarlo nunca llegaron (ni como mensaje ni como archivo); el PM revisó cada corrección leyendo el diff y el crítico sembró las mutaciones.

## Coste

- —

## Handover

- **Estado estable:** ola pausada por el usuario (pedido del Team Manager, 2026-10-17). #16 y #17 mergeadas; #20 abierta con el último veredicto LISTA (pasada corta sobre 4738bd6), sin nada en vuelo.
- **Hecho:** `read-transactions-csv` grupo 1 (#17, 3cff17b) y `monthly-summary-page` grupo 1 (#16, 1216a79) mergeados en `ola/1-monthly-summary`; `monthly-summary-page` grupo 2 implementado y revisado en #20.
- **Lo que queda en orden:**
  1. Mergear #20: `verify` y `sistema` verdes sobre 4738bd6 (el último `## Evidencia` del hilo, que es la punta de la rama). Antes, editar el cuerpo con *Rondas de crítico* (pasada 1 en 605febf NO LISTA 1 BLOQUEA + 3 NO BLOQUEA; pasada 2 en 042ed17 LISTA 1 NO BLOQUEA + 1 de comentarios; pasada corta en 4738bd6 LISTA) y `cuerpo-pr lint --plantilla A --cierre`. Si `ola/1-monthly-summary` se movió (este commit del registro la movió), rebasar y `verify` de nuevo antes de mergear. Después: línea en el registro, `graft build`, `worktree quitar g3-nucleo`.
  2. Con #20 son 3 PRs internas mergeadas: umbral de handover de este PM. El PM siguiente arranca el PR 4 (`monthly-summary-page` grupo 3, la página, `implementador-presentacion`) desde `ola/1-monthly-summary`; antes copia `InterVariable.woff2` y `LICENSE.txt` (como `Inter-LICENSE.txt`) de `/home/JP/activos-reporte/inter-4.1/` a `src/reporte/presentacion/activos/` del worktree y repite `sha256sum` contra el brief (§4, grupo 4). Luego el PR 5 (CLI, `sistema`, README) y la revisión visual para la PR de ola.
- **Avisos para los encargos:**
  - Worktrees con la ruta real `/mnt/c/…/.claude/worktrees/<nombre>`. `gh pr merge --delete-branch` se llevó en esta ola el worktree del grupo además de la rama (`worktree quitar` dijo «no existe»).
  - Pedir a cada implementador una copia de su reporte en un archivo de su subdirectorio del scratchpad: al implementador de #17 no le llegaron al PM sus respuestas tras reanudarlo; con el de #20 la copia funcionó.
  - Scripts temporales de cada agente en un subdirectorio propio del scratchpad (`impl-<área>/`, `critico-prN/`): dos implementadores se pisaron un `mut.py`.
  - `nucleo` entrega `float`/`int` nativos y `presentacion` acepta `np.float64` igual; `Analisis` de la Fase 1 = `mes`, `ultimo_dia`, `resumen`, `avisos`. Formateadores: `formatear_monto`, `formatear_porcentaje`, `formatear_entero`, `formatear_fecha`, `formatear_mes`, `dia_de_la_semana`; detector `referencias_de_red` (todos desde `reporte.presentacion`).
  - `tests/test_arquitectura.py` vigila ya `nucleo`, `datos` y `presentacion` (esta última: stdlib, `jinja2` y `reporte.nucleo`; `markupsafe` no está en la matriz).
- **Pendiente con el Team Manager o el usuario:** la pausa; ningún escalado abierto. Issues abiertas en la ola: #18 (detector de red en JS minificado, Fase 2) y #19 (guarda del núcleo sin I/O de pandas).
- **Por qué paro:** pausa pedida por el usuario; además, con el merge de #20 este PM llega a su umbral de 3 PRs internas.

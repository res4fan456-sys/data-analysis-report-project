# Ola 1-monthly-summary — Leer, validar y resumir

**Rama:** `ola/1-monthly-summary` · **Changes:** `read-transactions-csv`, `monthly-summary-page` · **Abierta:** 2026-10-16

## Arranque

- Base: `chore/1-monthly-summary-planning` f67d529 (avance continuo pedido por el usuario; pila #14 → `ola/0-scaffolding` → #11 → `chore/0-scaffolding-planning` → #3 → `master`). La PR de ola apunta a `chore/1-monthly-summary-planning`, por indicación del Team Manager; el brief decía `ola/0-scaffolding`, que es la base de esa rama.
- `preflight`: 4/4 OK (`gh auth` con scope `workflow`, remoto y ramas `ola/*`, `openspec`, `graft`). Única rama `ola/*` remota: `ola/0-scaffolding`, en espera de merge (PR #11 abierta), no activa.
- `verify` sobre la base (f67d529, worktree del PM): formato, lint, tipos, test y citas OK; 2 passed, 3 deselected.
- `sistema` sobre la base: ver la línea siguiente.
- `openspec instructions apply`: `read-transactions-csv` ready 0/5, `monthly-summary-page` ready 0/9; sin `context` ni `operationGuidance`.
- Inventario de lo que solo el usuario puede dar: nada. La fuente (D3) está fuera del repo y sus dos SHA-256 coinciden con el brief (comprobado de nuevo en el arranque). Sin `[PENDIENTE]` en los artefactos.
- Comprobado contra el código antes de encargar: `pandas.read_csv(dtype=str, keep_default_na=False, encoding="utf-8-sig")` lanza `EmptyDataError` con 0 bytes, da 0 filas con solo el encabezado, lanza `ParserError` «Expected 9 fields in line 3, saw 10» con un campo de más (la línea coincide con la fila de hoja de cálculo), rellena con `''` (no con nulos, por `keep_default_na=False`) una fila con campos de menos, y quita el BOM del nombre de la primera columna.
- `mypy` solo revisa `src/` (`pyproject.toml`); `tests/` no tiene `__init__.py`, así que dos tests con el mismo nombre de archivo en carpetas distintas chocan al recolectar.
- Specs heredados inestables de `sistema`: ninguno.

## PRs

| # | Grupo (change · tareas) | Rama | Estado |
|---|---|---|---|
| — | `read-transactions-csv` · 1.1–1.5 | `feat/1-read-transactions-csv` | en curso |
| — | `monthly-summary-page` · 1.1–1.2 | `feat/1-es-mx-formatters-network-detector` | en curso |
| — | `monthly-summary-page` · 2.1 | `feat/1-monthly-summary-core` | pendiente (tras PR 1) |
| — | `monthly-summary-page` · 3.1–3.3 | `feat/1-report-page` | pendiente (tras PR 2 y PR 3) |
| — | `monthly-summary-page` · 4.1–4.3 | `feat/1-report-cli` | pendiente (tras PR 4) |

## Decisiones del PM

- —

## Deuda

- —

## Se coló

- —

## Lo que queda fuera

- Fase 2 entera (patrones, gráficas, ECharts, hallazgos de R4 y R14), `--abrir` (#12) y #7, por el brief.

## Entorno vivo

- Worktree del PM: `.claude/worktrees/pm-ola1` (`ola/1-monthly-summary`).

## Coste

- —

## Handover

- —

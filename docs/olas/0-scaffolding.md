# Ola 0-scaffolding — Mover el generador a su paquete

**Rama:** `ola/0-scaffolding` (desde `chore/0-scaffolding-planning` 5714f8d) · **Changes:** `move-generator-package` · **Abierta:** 2026-10-15

## Arranque

- Base de la ola: `chore/0-scaffolding-planning` 5714f8d, por avance continuo pedido por el usuario (2026-10-15); la PR de ola apunta a esa rama y nada llega a `master` por el PM.
- `git ls-remote --heads origin 'ola/*'`: vacío antes de crear `ola/0-scaffolding`.
- `.claude/da/da preflight`: 4/4 OK (gh auth, remoto y ramas `ola/*`, openspec, graft). Scopes de `gh`: `repo`, `workflow`.
- `openspec validate move-generator-package`: válido. `openspec instructions apply`: `state: ready`, 0/5, sin `context` ni `operationGuidance`.
- Diseño contrastado con el código de la base: import en `generar_transacciones.py:22`; el CSV se escribe antes del resumen de `-v` (`generar_transacciones.py:500-502`); filas ordenadas por fecha (`generar_transacciones.py:495`); `tests/test_pureza.py` con `_imports` y `RAIZ`; marcador `sistema` declarado con `--strict-markers` (`pyproject.toml:20-21`).
- `verify` sobre la base (5714f8d): formato OK · lint OK · tipos OK · test OK (1 passed) · citas OK · enlaces del worktree OK.
- `sistema` sobre la base (5714f8d): FALLA con exit 5 de pytest («1 deselected»): no hay ningún test `sistema` todavía (hallazgo E6 del pre-vuelo, confirmado). No es regresión; el grupo 1 lo resuelve.
- Specs heredados inestables con issue abierta: ninguno.
- Nada que pedir al usuario: sin dependencias, instalaciones, credenciales ni `[PENDIENTE]`.

## PRs

| # | Grupo (change · tareas) | Rama | Estado |
|---|---|---|---|
| — | `move-generator-package` · 1.1 | `test/0-generator-reproducibility-guard` | pendiente |
| — | `move-generator-package` · 2.1–2.4 | `refactor/0-move-generator-package` | pendiente |

## Decisiones del PM

- Los worktrees se montan con la ruta real `/mnt/c/…/.claude/worktrees/<nombre>`, no con el `$PWD` de la sesión (`/home/JP/Código/…`, un enlace simbólico): con el enlace, el gancho `comprobar` resuelve la ruta real y da FUERA. Descartado: tocar el gancho, que es configuración de la mecánica.

## Deuda

- —

## Se coló

- —

## Lo que queda fuera

- Fase 1 entera, la API del perfil inyectado (D4) y la verificación de ECharts (D2), por el brief.

## Entorno vivo

- Worktree del PM: `/mnt/c/Users/juanp/OneDrive/Documents/Código/data-analysis-report-project/.claude/worktrees/pm-0-scaffolding` (`ola/0-scaffolding`).

## Coste

- —

## Handover

- —

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
| #9 | `move-generator-package` · 1.1 | `test/0-generator-reproducibility-guard` | mergeada (f64ed17) — 0 mecánicas · 0 rondas · 0 por corrección; crítico LISTA en la pasada 1 con 4 NO BLOQUEA, cerrados en la pasada final (7909743) sin crítico |
| #10 | `move-generator-package` · 2.1–2.4 | `refactor/0-move-generator-package` | mergeada (6bac375) — 0 mecánicas · 0 rondas · 0 por corrección; crítico LISTA en la pasada 1 con 4 NO BLOQUEA, cerrados en la pasada final (d05a2fc) sin crítico |

## Decisiones del PM

- PR #9: los 4 NO BLOQUEA del crítico (stderr visible y código antes del CSV, 29 de febrero antes del SHA, `timeout` de 300 s, `PYTHONIOENCODING=utf-8` en el subproceso) se corrigen en la pasada final y no van a issue: son del archivo de la guarda, que el grupo 2 necesita legible si el movimiento rompe el import. Juzgada por el PM sin crítico (solo test), con `verify` y `sistema` verdes sobre 7909743.
- PR #9: `PYTHONIOENCODING=utf-8` queda sin mutante (en esta máquina Python ya coerciona a UTF-8): se acepta como defensa ante un locale ajeno. Descartado: dejar la salida a la codificación heredada.

- Los worktrees se montan con la ruta real `/mnt/c/…/.claude/worktrees/<nombre>`, no con el `$PWD` de la sesión (`/home/JP/Código/…`, un enlace simbólico): con el enlace, el gancho `comprobar` resuelve la ruta real y da FUERA. Descartado: tocar el gancho, que es configuración de la mecánica.
- PR #10: se acepta que ruff (I001) reordene el import movido tras `from faker import Faker` (3 líneas de diff en `generar_transacciones.py` en vez de 1). El crítico comprobó que `configuracion` no tiene efectos de importación y que la salida es idéntica; la guarda sigue verde. Descartado: excluir el archivo del lint o tocar `pyproject.toml`, fuera de alcance.
- PR #10: en la pasada final se autorizó al implementador a tocar también `test_el_nucleo_no_importa_io` (el encargo lo dejaba fuera), para que los dos tests de pureza fallen si `src/reporte` no tiene módulos. Descartado: arreglar solo el test nuevo y dejar el mismo hueco en el viejo.
- PR #10: el README describe el reporte en futuro («todavía no existe») y pide Python 3.14, a propuesta del crítico. Descartado: la introducción en presente, que prometía un reporte que hoy no se puede generar.
- PR #10: el PM cortó un `bash` del implementador que quedó colgado esperando un heredoc mal cerrado (una edición abandonada del README); no había escrito nada y el README ya estaba corregido por otra vía.

## Deuda

- Ninguna de la ola: los 8 NO BLOQUEA de las dos PRs se cerraron en sus pasadas finales.

## Se coló

- Ninguno.

## Lo que queda fuera

- Fase 1 entera, la API del perfil inyectado (D4) y la verificación de ECharts (D2), por el brief.
- Issues de pre-vuelo #5 (R16 y ECharts), #6 (test de las reglas 1 y 2) y #7 (`requirements.txt` sin uso tras el README nuevo): de fases posteriores, sin absorber.

## Entorno vivo

- Vacío al cerrar: los worktrees de los grupos se quitaron tras cada merge y el del PM tras abrir la PR de ola.

## Coste

### Mecánica

| Métrica | Valor |
| --- | --- |
| ctx0 — critico | 26.6k |
| caché escrita — critico | 131.4k |
| caché leída — critico | 1.6M |
| ctx0 — implementador-generador | 39.6k |
| caché escrita — implementador-generador | 264.9k |
| caché leída — implementador-generador | 1.6M |
| ctx0 — pm | 32.7k |
| caché escrita — pm | 803.5k |
| caché leída — pm | 5.5M |
| caché leída — pm — PR #10 | 2.1M |
| caché leída — pm — PR #9 | 1.2M |
| caché leída — critico — PR #10 | 842.7k |
| caché leída — critico — PR #9 | 713.4k |
| PRs a GitHub | 2 |
| Merges a master — cierre o arreglo | 0 |
| Merges a master — planeación y archivado | 0 |
| Horas de espera (promedio) — cierre o arreglo | 0.0 |
| Horas de espera (promedio) — planeación y archivado | 0.0 |
| Corridas de evidencia | 4 |
| Pasadas de crítico | 2 |
| BLOQUEA en veredictos | 0 |
| NO BLOQUEA en veredictos | 4 |

### Trabajo

| PR | Caché leída/línea (producto) | Horas/línea (producto) | Caché leída/línea (test) | Horas/línea (test) |
| --- | --- | --- | --- | --- |
| #10 | 42.8k | 0.0 | 79.1k | 0.0 |
| #9 | 597.5k | 0.2 | 10.8k | 0.0 |

### Guardas

| Guarda | Valor |
| --- | --- |
| Se coló | 0 |
| BLOQUEA de código | 0 |
| sistema al cierre | 3/3 sobre 1e31dd3 (OK) |

- Aviso de `da medir`: no reconoce el formato del veredicto de la PR #9, así que cuenta 4 NO BLOQUEA en vez de 8 (4 en #9 y 4 en #10, todos cerrados en las pasadas finales).

## Handover

- —

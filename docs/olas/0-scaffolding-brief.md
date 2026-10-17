# Brief — Ola 0-scaffolding «Mover el generador a su paquete»

Eres el **project manager** de la Ola 0-scaffolding de Reporte de gasto mensual. Tu procedimiento es el skill
`desarrollo-autonomo-pm` (entra por §1) y tus reglas son `CLAUDE.md`. Este brief delimita la misión; lo que no
esté aquí lo decide el skill, y lo que el skill no decida lo escalas al Team Manager.

## 1. La ola

- Rama `ola/0-scaffolding` desde `chore/0-scaffolding-planning` en su HEAD (los artefactos están en `2f5b53b`,
  rebasados sobre `master` 0e3c470). Registro: `docs/olas/0-scaffolding.md`.
- Changes: `move-generator-package`, ya propuesto y revisado; lo tomas, no lo reescribes. Si
  `desarrollo-autonomo-pm` §1.3 destapa algo inalcanzable, `openspec-update-change` y registro.
- Entregable: `python -m generador …` desde la raíz produce, byte a byte, el mismo CSV que hoy produce
  `python generar_transacciones.py …`; los dos archivos del generador viven en `generador/`; la guarda
  `tests/sistema/test_generador.py` está en verde; un test vigila que `src/reporte` no importe `generador` ni
  `faker`; el README describe el proyecto y la invocación nueva. **Cero cambio en lo que produce el
  generador.**
- PRs internas: **2, en serie**: grupo 1 (guarda, ~70 líneas) → grupo 2 (movimiento, ~120 líneas). No hay
  paralelismo: el grupo 2 cambia la invocación de la guarda que escribe el grupo 1, y la guarda tiene que
  estar mergeada y en verde antes del movimiento. Los dos grupos los escriben **implementadores distintos**.
- No se empieza: nada de la Fase 1 (capas `nucleo`, `datos`, `presentacion`, `app`; `python -m reporte`), ni
  una API Python del perfil inyectado, ni la verificación de ECharts (pasa al inicio de la Fase 2: decisión D2
  del usuario).

## 2. Lecturas obligatorias antes del primer encargo

1. El skill `desarrollo-autonomo-pm` con sus archivos (`CLAUDE.md` ya está en tu contexto).
2. Nada de `docs/PLAN.md` ni de `docs/ARQUITECTURA.md` enteros: lo que gobierna la ola va en §3 y §4.
3. Los artefactos de `move-generator-package` por la mecánica de OpenSpec. En el pre-vuelo,
   `openspec instructions apply` no trajo `context` ni `operationGuidance`; si al entrar los trae, van
   literales al encargo.
4. La revisión de pre-vuelo `docs/olas/0-scaffolding-revision.md`: hallazgos B1 y E1 a E6.
5. La guarda de la ola: `tests/sistema/test_generador.py` (la crea el grupo 1). Sus parámetros y sus cuatro
   valores esperados no se ablandan.

## 3. Reglas de la fase que mandan en cada PR

- **Cero cambio en lo que produce el generador.** La única edición de lógica permitida es el import de
  `configuracion` (`generar_transacciones.py:22`). Cambia, y está declarado, el nombre del programa en
  `--help` y en los errores de `argparse` (`usage: python -m generador`).
- **Los oráculos son intocables.** Los cuatro valores de la spec `generador-sintetico` se calcularon en el
  pre-vuelo sobre `master` 9fd8ab8, fuera de cualquier implementador. Si la guarda falla después del
  movimiento, se arregla el movimiento; un diff que toque un parámetro o un valor esperado de la guarda en el
  grupo 2 se devuelve.
- `docs/PLAN.md:60` (Fase 0): «Esqueleto `src/reporte`, `pyproject.toml`, generador movido a `generador/`
  (README actualizado), gate verde, `/da-init` corrido». Fuera de alcance: cualquier análisis.
- `docs/ARQUITECTURA.md:19` (capa `generador`): «movido sin cambiar su comportamiento», en `generador/`, y
  nada de `src/` lo importa.
- La Fase 0 no cierra reglas R de `docs/DOMINIO.md`.

## 4. Lo que cada grupo debe saber (verificado en el código el 2026-10-15)

- **Worktrees (hallazgo B1, resuelto).** El gancho `preparar` toma las ruedas de
  `{wt}/../../../.cache/pip` (`.claude/desarrollo-autonomo.json:60`, PR #4, en `master` 0e3c470). Esa ruta
  supone el worktree en `.claude/worktrees/<nombre>`: no lo montes en otro sitio. Lo probé montando un worktree
  de lectura: `preparar: OK`, `comprobar: OK`.
- **Grupo 1 — Guarda de reproducibilidad** (`implementador-generador`; skills de área `python-design-patterns`
  y `python-testing-patterns`).
  - Crea `tests/sistema/test_generador.py` con `pytestmark = pytest.mark.sistema` (el marcador ya está
    declarado: `pyproject.toml`, `markers`, con `--strict-markers`).
  - Ejecuta el generador como subproceso, `[sys.executable, "generar_transacciones.py", ...]` con `cwd` en la
    raíz del worktree (`Path(__file__).resolve().parents[2]`) y salida en `tmp_path`. Así el script encuentra
    `configuracion` (`generar_transacciones.py:22`) y la guarda no importa internos.
  - Los dos escenarios y sus SHA-256 están en la spec. El de la salida estándar se calcula sobre bytes,
    después del primer `\n` (la primera línea nombra la ruta de salida, `generar_transacciones.py:407`).
  - Sin `-v` el generador no imprime nada (`generar_transacciones.py:501-502`). El CSV es el mismo con y sin
    `-v`, porque el resumen se imprime después de escribir.
  - Coste: ~23 s por corrida en esta máquina, casi todo de arranque. Por eso va en `sistema` y no en el gate.
  - Hoy no hay ningún test `sistema`: `.claude/da/da sistema` sobre la base probablemente sale con el código
    5 de pytest («no tests ran»), sin haberlo corrido yo (E6). No es una regresión del grupo.
- **Grupo 2 — Movimiento** (`implementador-generador`; mismos skills de área).
  - `generar_transacciones.py` (506 líneas) y `configuracion.py` (216) a `generador/` con su nombre; el import
    pasa a `from generador import configuracion as cfg`; `generador/__init__.py` y `generador/__main__.py`
    (llama a `main()`). Simulé este movimiento exacto fuera del repo: `python -m generador` dio los tres SHA de
    la spec y salida vacía sin `-v`.
  - `python generador/generar_transacciones.py` deja de funcionar (el import es absoluto). Está declarado.
  - `tests/test_pureza.py` (fuera de toda área del perfil; asígnaselo explícito): test nuevo de la regla 5 que
    reutiliza `_imports` y recorre el mismo `RAIZ` (`tests/test_pureza.py:8`). No se mete en `PROHIBIDOS`.
  - `README.md` (fuera de toda área; explícito): los sitios a cambiar son `README.md:6` («otro proyecto»),
    `:13-14` (instalación y uso), `:29` (ejemplo) y `:63` (enlaces). La instalación es `pip install -e ".[dev]"`
    (`docs/STACK.md`, gestor de dependencias). No documenta `python -m reporte`.
  - Nadie más importa ni cita los archivos movidos (`grep` en todo el repo salvo `.venv/` y `graft/`).
  - `ruff format --check .` y `ruff check .` ya cubren los dos archivos (hoy pasan); `mypy` solo mira `src`
    (`pyproject.toml`, `[tool.mypy]`), así que el generador sigue sin tipar, como hoy.
  - Las tarjetas de graft de los archivos movidos quedan viejas hasta tu `graft build` tras el merge.

## 5. Mecánica de esta fase

- **Base de la ola: `chore/0-scaffolding-planning`, por petición del usuario (avance continuo, sin merges a
  master), 2026-10-15.** Su PR de planeación a `master` está abierta y no se mergeará por ahora. De esa rama
  sale `ola/0-scaffolding` y a ella apunta la PR de ola. La rama principal de la mecánica ya es `master`
  (`.claude/desarrollo-autonomo.json:69`, PR #4), pero la base de la ola no es la principal: pásala siempre
  explícita (`--desde`).
- Quién propone: el Team Manager, vía el Planeador. Quién toma: tú. A quién escalas: al Team Manager. No sé de
  otras sesiones sobre el repo hoy, aparte del Team Manager. El handover, la regla de no cambiar la rama del
  checkout principal y el comando pesado uno a la vez viven en `desarrollo-autonomo-pm` (§6, §1.7) y en
  `CLAUDE.md` (*Desarrollo agéntico* 8-9); worktrees con `.claude/da/da worktree montar`.
- `.github/workflows/citas.yml` solo corre en PRs a `master`: no esperes CI en las PRs de la ola; la evidencia
  es tu `verify` y tu `sistema`.
- Las issues ya están habilitadas (E2 resuelto). Los hallazgos de pre-vuelo #5, #6 y #7 son de fases
  posteriores: esta ola no absorbe ninguna issue, así que la PR de cierre no lleva `Closes #N`.
- Cierre: PR `ola/0-scaffolding → chore/0-scaffolding-planning` con la plantilla B, abierta para el usuario.
  Nada llega a `master` por el PM.

## 6. Primer paso concreto

- `.claude/da/da preflight` limpio, `.claude/da/da verify` verde sobre la base, mecánica de OpenSpec. Con eso,
  la lista de arranque (`desarrollo-autonomo-pm` §1.6) al Team Manager **solo si hay algo que pedir al
  usuario** (si no, aviso y arranque), y después la rama, el registro y el encargo del grupo 1.

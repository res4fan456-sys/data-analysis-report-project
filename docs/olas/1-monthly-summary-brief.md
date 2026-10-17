# Brief — Ola 1-monthly-summary «Leer, validar y resumir»

Eres el **project manager** de la Ola 1-monthly-summary de Reporte de gasto mensual. Tu procedimiento es el
skill `desarrollo-autonomo-pm` (entra por §1) y tus reglas son `CLAUDE.md`. Este brief delimita la misión; lo
que no esté aquí lo decide el skill, y lo que el skill no decida lo escalas al Team Manager.

> **Decisiones del pre-vuelo, cerradas el 2026-10-16** (`docs/olas/1-monthly-summary-revision.md`, §8):
> D1 = A, D2 = A y D3 = A, del usuario; D4 = A y D5 tal cual, del Team Manager. No queda ninguna abierta.

## 1. La ola

- **Base: `ola/0-scaffolding`, por petición del usuario (avance continuo, sin merges a master), 2026-10-16.**
  Rama `ola/1-monthly-summary` desde `ola/0-scaffolding` en 54fd713 o posterior; registro
  `docs/olas/1-monthly-summary.md`.
- Changes: `read-transactions-csv` y `monthly-summary-page`, ya propuestos y refinados; los tomas, no los
  reescribes. Si `desarrollo-autonomo-pm` §1.3 destapa algo inalcanzable, `openspec-update-change` y registro.
- Entregable: `python -m reporte output/transacciones_2026-09.csv` escribe `output/reporte_2026-09.html`, un
  único archivo sin red con encabezado, KPIs del resumen, avisos, tema negro y dorado claro/oscuro con botón,
  Inter incrustada y el cierre «Aquí queda la línea del respeto»; un CSV inválido da código 1 y un mensaje en
  español que dice qué falla. Cierra R1–R3, R4 sin sus hallazgos, R5 y R15–R17.
- PRs internas: 5, cada una de ~600 líneas de diff o menos.
  - **PR 1** — `read-transactions-csv` grupo 1 (lectura y validación, `Transacciones`, test de
    arquitectura), ~600.
  - **PR 2** — `monthly-summary-page` grupo 1 (formateadores es-MX y detector de red), ~400. **En paralelo
    con el PR 1**: áreas y archivos disjuntos (`datos` + `nucleo/tipos.py` + `tests/test_arquitectura.py`
    frente a `presentacion`).
  - **PR 3** — `monthly-summary-page` grupo 2 (`analizar`, `Analisis`, `Resumen`), ~250. Tras el merge del
    PR 1 (consume `Transacciones`).
  - **PR 4** — `monthly-summary-page` grupo 3 (la página), ~500 sin el binario. Tras el merge de PR 2 y PR 3;
    la fuente ya está entregada (§4, grupo 4).
  - **PR 5** — `monthly-summary-page` grupo 4 (CLI, suite `sistema`, README), ~300. Tras el merge del PR 4.
- No se empieza: nada de la Fase 2 (patrones, gráficas, ECharts, hallazgos), `--abrir` (issue #12), la
  issue #7.

## 2. Lecturas obligatorias antes del primer encargo

1. El skill `desarrollo-autonomo-pm` con sus archivos (`CLAUDE.md` ya está en tu contexto).
2. Nada de `docs/PLAN.md` ni de `docs/ARQUITECTURA.md` enteros: lo que gobierna la ola va en §3 y §4.
   `docs/DOMINIO.md` R1–R5 y R15–R17 (`docs/DOMINIO.md:24-42` y `:88-95`) y su tabla de casos borde
   (`:97-112`) sí, porque son el contrato que los tests protegen.
3. Los artefactos de cada change por la mecánica de OpenSpec. `openspec instructions apply` de los dos:
   `state: ready`, sin `context` ni `operationGuidance` (comprobado el 2026-10-16).
4. `docs/olas/1-monthly-summary-revision.md` (este pre-vuelo) y `docs/olas/0-scaffolding.md` (sin deuda que
   absorber; su decisión sobre la ruta real de los worktrees aplica aquí, §5).
5. Las guardas que no se ablandan: `tests/test_pureza.py`, `tests/sistema/test_generador.py`, y desde el PR 1
   `tests/test_arquitectura.py`.

## 3. Reglas de la fase que mandan en cada PR

- **R16 es la definición precisada** (issue #5): la de los requisitos «La página es un solo archivo sin
  referencias de red» y «Lo local y lo que no se carga no cuenta como red» de la spec `pagina-del-reporte`,
  que es la misma que la PR #13 escribe en `docs/DOMINIO.md`. Un test de R16 que busque `//` en todo el HTML
  es incorrecto: el base64 de la fuente lo contiene.
- **Los hallazgos de R4 y R14 no entran** (D1). Si un grupo parece necesitarlos, se escala.
- **Textos que son contrato**: los formatos de R15, el cierre de R17, «El archivo no tiene transacciones» y
  la ausencia de red de R16. Del resto (mensajes de rechazo, etiquetas, avisos) los tests afirman lo que el
  texto nombra (columna, fila, campo, meses, ruta, cifra), no su redacción.
- **Matriz de imports** (`docs/ARQUITECTURA.md:13-19`): `nucleo` → stdlib y pandas, sin I/O; `datos` →
  stdlib, pandas y `reporte.nucleo.tipos`; `presentacion` → stdlib, Jinja2 y `reporte.nucleo` (sin pandas);
  `app` → todas. Desde el PR 1 la vigila `tests/test_arquitectura.py`. Si alguien necesita numpy directo, es
  un cambio de `docs/ARQUITECTURA.md`: se escala.
- **Contratos de `docs/ARQUITECTURA.md:25-55`**: los nombres `ErrorDeEntrada`, `Transacciones`,
  `leer_transacciones`, `analizar`, `Analisis`, `renderizar` y `main` no cambian. El `Analisis` de esta fase
  es un subconjunto (`mes`, `ultimo_dia`, `resumen`, `avisos`); `ultimo_dia` es aditivo y se declara en la PR
  de ola.
- **Los valores de la guarda del generador no se tocan** (los SHA-256 de `tests/sistema/test_generador.py`).

## 4. Lo que cada grupo debe saber (verificado en el código el 2026-10-16)

- **Grupo 1 — PR 1, `read-transactions-csv` (implementador `implementador-datos`).**
  - `src/reporte/` solo tiene `__init__.py` (`src/reporte/__init__.py:1-3`); `nucleo/` y `datos/` no existen.
  - `tests/test_arquitectura.py` (tarea 1.1) va primero y sin área: asígnalo explícitamente, igual que
    `src/reporte/nucleo/tipos.py` (área `nucleo`). Reutiliza la idea de `_imports` de
    `tests/test_pureza.py:14-22`, pero ese helper solo toma el primer segmento e ignora el nivel de los
    imports relativos (descarta `from . import x`, cuyo `nodo.module` es `None`, y lee `from .tipos import X`
    como `tipos`): la matriz necesita el módulo completo y los relativos resueltos.
  - El generador escribe sin BOM, con comillas en `zona` (`Roma Norte, CDMX`), montos con 2 decimales y
    coordenadas con 6 (`generador/generar_transacciones.py:380-394`). Un mes de 20,000 filas pasa R1–R3 sin
    avisos [V].
  - El escenario de 20,000 filas lo protege la suite `sistema` del PR 5; en `tests/datos/` basta una muestra.
  - Trampa: `pandas.read_csv` sobre un archivo de 0 bytes lanza `EmptyDataError`, y una fila con campos de
    más lanza `ParserError`; los dos se traducen a `ErrorDeEntrada` (design, Decisions).
- **Grupo 2 — PR 2, `monthly-summary-page` grupo 1 (`implementador-presentacion`).**
  - Crea `src/reporte/presentacion/`; no depende del PR 1. Si el PR 1 entra antes, el rebase debe dejar
    `tests/test_arquitectura.py` en verde sobre la capa nueva.
  - Escenarios con aritmética comprobada: 16/09/2026 es miércoles y 19/09/2026 sábado; `repr(2.675)` es
    `'2.675'` (de ahí `$2.68`).
  - El detector se prueba con los casos sembrados de la spec; los permitidos incluyen `url(data:…//…)`, el
    espacio de nombres de SVG y un comentario con la URL de la licencia Apache.
- **Grupo 3 — PR 3, `monthly-summary-page` grupo 2 (`implementador`, núcleo).**
  - Consume `Transacciones` del PR 1 tal como quedó mergeado: lee `src/reporte/nucleo/tipos.py` antes del
    encargo.
  - Los tests son tablas hechas a mano con el resultado calculado a mano (`docs/ARQUITECTURA.md:65`).
- **Grupo 4 — PR 4, `monthly-summary-page` grupo 3 (`implementador-presentacion`).**
  - **La fuente ya está entregada (D3); el PR 4 no espera nada del usuario.** El usuario la extrajo de
    `Inter-4.1.zip` (`https://github.com/rsms/inter/releases/download/v4.1/Inter-4.1.zip`, 33,707,794 bytes;
    entradas `web/InterVariable.woff2` y `LICENSE.txt`), fuera del repositorio:

    | Archivo | Bytes | SHA-256 |
    |---|---|---|
    | `/home/JP/activos-reporte/inter-4.1/InterVariable.woff2` | 352,240 | `693b77d4f32ee9b8bfc995589b5fad5e99adf2832738661f5402f9978429a8e3` |
    | `/home/JP/activos-reporte/inter-4.1/LICENSE.txt` | 4,380 | `262481e844521b326f5ecd053e59b98c8b2da78c8ee1bdbb6e8174305e54935a` |

    Verificado el 2026-10-16: los dos SHA-256 coinciden, el WOFF2 empieza con la firma `wOF2` y la licencia es
    SIL Open Font License 1.1. Antes del encargo del PR 4 copias los dos archivos al worktree, en
    `src/reporte/presentacion/activos/` (`LICENSE.txt` con un nombre que diga de qué activo es, p. ej.
    `Inter-LICENSE.txt`), y vuelves a pasar `sha256sum`; si no coincide, no encargas y escalas. La versión
    (Inter 4.1), la licencia (OFL-1.1), el origen y el SHA-256 van en `LICENCIAS.md` (tarea 3.1). El
    implementador no descarga nada.
  - `src/reporte/presentacion/activos/` no existe; `LICENCIAS.md` lo exige la regla innegociable 6.
  - La paleta concreta la elige el implementador dentro de «negro y dorado con acentos brillantes»
    (`docs/STACK.md:34`); el test de contraste es la guarda y el usuario la valida en la revisión visual.
  - El JavaScript del tema no tiene test automático (D4): pide un script mínimo y que el implementador
    describa en su reporte cómo cumple los tres escenarios del requisito del tema.
- **Grupo 5 — PR 5, `monthly-summary-page` grupo 4 (`implementador-app`).**
  - `tests/sistema/**` es del área `generador` en el perfil y `README.md` no tiene área: asígnalos
    explícitamente.
  - El patrón de subproceso de la suite ya existe (`tests/sistema/test_generador.py:46-57`: `sys.executable`,
    `cwd` en la raíz, `PYTHONIOENCODING=utf-8`, `timeout`). Un mes de 20,000 filas tarda ~23 s en generarse.
  - `README.md:3-8` dice que el reporte «todavía no existe»; la tarea 4.3 lo corrige.
  - Tras el merge, la revisión visual de la fase la preparas tú (sección «Revisión visual de la fase» de
    `monthly-summary-page/tasks.md`) para la PR de ola.

## 5. Mecánica de esta fase

- **Base de la ola:** `ola/0-scaffolding` (avance continuo pedido por el usuario el 2026-10-16; su PR de ola
  es la #11, apilada sobre la #3). De ahí sale la rama de ola y a ahí apunta su PR. La PR de planeación de
  esta ola apunta también a `ola/0-scaffolding`, y ninguna se mergea por la mecánica.
- **La PR #13 (documentos) ya está en `master`** (merge 5c5da1d, del usuario): escribe en `docs/DOMINIO.md`,
  `docs/PLAN.md` y `docs/ARQUITECTURA.md` lo que D1 y D2 decidieron. No bloquea la ola, pero **la base
  `ola/0-scaffolding` no la trae**: allí R16 y la tabla de fases conservan la redacción anterior. Implementas
  desde las specs de los changes, que ya traen esas definiciones; un comentario de código que cite R16 se
  escribe con la definición de la spec, que es la misma que dice `docs/DOMINIO.md` en `master`.
- Quién propone (el Team Manager, vía el Planeador) y quién toma (el PM); a quién se escala (al Team
  Manager). El handover, no cambiar la rama del checkout principal y el comando pesado uno a la vez viven en
  `desarrollo-autonomo-pm` (§6, §1.7) y en `CLAUDE.md` (*Desarrollo agéntico* 8-9); worktrees con
  `.claude/da/da worktree montar`.
- **Monta los worktrees con la ruta real** `/mnt/c/Users/juanp/OneDrive/Documents/Código/data-analysis-report-project/.claude/worktrees/<nombre>`,
  no con el `$PWD` de la sesión (`/home/JP/Código/…`, un enlace simbólico): con el enlace, el gancho
  `comprobar` da FUERA (`docs/olas/0-scaffolding.md:29`).
- Issues que la ola absorbe, para las líneas `Closes #N` de la PR de cierre cuando el arreglo esté en
  `master`: **#5** (`monthly-summary-page`, grupos 1 y 3) y **#6** (`read-transactions-csv`, grupo 1).
- Cierre: PR `ola/1-monthly-summary → ola/0-scaffolding` con la plantilla B, abierta para el usuario. Nada
  llega a `master` por el PM.

## 6. Primer paso concreto

- `.claude/da/da preflight` limpio, `.claude/da/da verify` verde sobre `ola/0-scaffolding`, mecánica de
  OpenSpec de los dos changes; con eso, la lista de arranque (`desarrollo-autonomo-pm` §1.6) al Team Manager
  **solo si hay algo que pedir al usuario** (hoy nada: la fuente ya está entregada), y después la rama, el registro y los encargos de los PRs 1 y 2 en paralelo.

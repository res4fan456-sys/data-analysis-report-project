# CLAUDE.md

<!-- desarrollo-autonomo:inicio v0.1.0-dev -->
> Reglas **absolutas** de la mecánica (kit `desarrollo-autonomo` 0.1.0-dev): si una choca con el comportamiento habitual, manda este archivo. Es corto a propósito: lo carga **cada agente en cada turno**. El procedimiento de cada rol vive en su skill `desarrollo-autonomo-<rol>`; el porqué, en `docs/DESARROLLO-AUTONOMO.md`; el registro de cada ola, en `docs/olas/<ola>.md`. Este bloque lo genera `.claude/da/da render`; lo del proyecto va fuera de él.

## Rutina de desarrollo

### Test driven development — obligatorio

1. **El test se escribe primero.** Rojo, verde, refactor. Sin excepciones para código de producto.
2. **Todo el código debe ser testeable por unit tests.** Si algo solo se prueba levantando servicios, la base o la red, el diseño está mal: la lógica se extrae a una función pura y lo que queda es una cáscara delgada de I/O.
3. **El núcleo del dominio:** cada regla de negocio que un documento normativo enuncia tiene su test, por la interfaz pública; los casos borde que ese documento enumere son obligatorios.
4. **Suite de sistema:** cada fase entrega al menos una prueba automatizada de su flujo principal en `sistema`, contra el sistema real.
5. **Ninguna tarea se marca completa con la suite en rojo.** No se comenta un test para «avanzar y arreglarlo después».
6. **Una prueba vale si protege un comportamiento que le importa al autor o a quien llama al módulo, por la interfaz pública, y falla cuando ese comportamiento se rompe.** No valen: la que no puede fallar, la tautológica, la acoplada a la implementación (mocks de colaboradores internos), la que afirma texto o marcado en lugar de comportamiento. **El texto solo se afirma donde ES el contrato** (lo que *Convenciones* declare como tal: nombres accesibles de los recorridos de sistema, claves de un catálogo de textos). La aplican los tres roles: el PM nombra en cada criterio el flujo que su prueba protege; el implementador reporta, por test, qué comportamiento protege y su mutación; el crítico juzga el valor de cada uno —si el único test de un criterio no vale, el criterio está sin proteger y **BLOQUEA**; si la prueba inútil es redundante con otra buena, **NO BLOQUEA** y se pide borrarla—.

### OpenSpec — mecánica obligatoria

OpenSpec es **la única autoridad sobre qué toca hacer**; no se reconstruye de memoria.

> **REGLA INAMOVIBLE — ningún archivo dentro de `openspec/` se edita a mano. Nunca.** Todo pasa por su skill (`openspec-propose`, `openspec-update-change`, `openspec-sync-specs`, `openspec-archive-change`, `openspec-apply-change`), sin excepción por prisa ni por tamaño. **Única excepción:** voltear una casilla `- [ ]` → `- [x]` en `tasks.md`, que hace el PM tras revisar y antes de lanzar al crítico. Cualquier otro carácter va por el skill, en commit propio `chore(openspec): update <change> via openspec-update-change`, declarado en la PR.

1. **Se entra por el skill.** Antes de encargar: `openspec status --change <c> --json` y `openspec instructions apply --change <c> --json`; se leen **todos** los `contextFiles`; `state` y `progress` los dice el CLI; `context` y `operationGuidance` entran literales en el encargo.
2. **Dentro de una ola OpenSpec es del PM**; antes, del Planeador; tras el merge, del Archivador. Implementador y crítico no lo tocan. Dónde el skill de OpenSpec choca con esta mecánica lo resuelve `desarrollo-autonomo-pm`.

### Desarrollo agéntico

La implementación no la escribe quien dirige: se delega. El detalle es del skill `desarrollo-autonomo-pm`; estos puntos los comparten todos los roles y se citan por su número.

1. Cada grupo de tareas lo implementa un **implementador** (`sonnet`), lanzado por el PM tras la mecánica de OpenSpec.
2. El encargo trae enunciado, criterios y contexto con la plantilla del PM; las reglas de este archivo no se copian en él.
3. Al implementador lo dirige el PM; al PM, el Team Manager. Ninguno escribe el código de la tarea.
4. El PM **revisa**: `verify`, el diff entero contra criterios, innegociables y alcance, cada fuente que un comentario cite, y el veredicto de un **crítico** antes de mergear.
5. Si algo falla, **se devuelve al implementador**. El PM no parchea ni fabrica ni retoca evidencia.
6. La frontera con el usuario es la PR de ola (o la de un arreglo), no cada tarea: el PM mergea las PRs internas y avanza sin esperar.
7. **Paralelismo solo el que el grafo de `tasks.md` declara**, un worktree por implementador sobre áreas disjuntas; revisión y merge en serie, con `verify` tras cada rebase. Ante la duda, en serie.
8. **El comando pesado lo corre solo el PM, uno a la vez en toda la máquina** (candado por máquina, compartido con cualquier otro proyecto que corra en ella; el segundo espera: `.claude/da/da pesado -- <comando>`): `.claude/da/da verify`, `.claude/da/da sistema`, `.venv/bin/pytest -q -m sistema`, `pytest -q`, `pytest tests`, `docker compose up`, `docker compose build`, `docker build`, `docker run` y `graft build`, y `pytest` sin ruta. Dos a la vez congelan la máquina. Implementadores y críticos iteran con checks ligeros dentro de su worktree (`.claude/da/da en <wt> -- …`): tests por ruta, el typecheck de su área, `lint` sobre lo que tocan.
9. **graft es lectura para implementadores, críticos y Planeador, siempre con `--no-refresh`**; nunca `graft build/init/uninstall`. Si graft y el código discrepan, manda el código. **`graft build` lo corre el PM tras cada merge a la rama de ola.**
10. **Cero forks.** Toda delegación va por un agente **con nombre** y su alias de modelo (`opus`, `sonnet`, `fable`, `haiku`); nadie sobrescribe el modelo de un agente con nombre salvo los casos que su skill declara. Un built-in (`Explore`, `Plan`, `general-purpose`) hereda el modelo del padre: si se lanza, se le indica el modelo.

### Skills

Se buscan e instalan **solo** con `/find-skills` (o `/da-init --skills`), con alcance de proyecto; instala el usuario. **Obligatorios al implementar:** `tdd`, `codebase-design` y `gh`. Los de cada área los fija el perfil y los nombra el encargo. Se invocan **antes** de escribir código, una vez cada uno (los precargados no se reinvocan); el PM lo verifica. Seguridad de autenticación: `/security-review` antes de integrar a `master`.

---

## Git

`master` es la rama principal. **Nunca se commitea directamente a `master`.**

1. **Ramas y PRs pequeñas.** La unidad de integración es un grupo de tareas coherente de `tasks.md`: rama propia (`<tipo>/<fase>-<descripcion-corta>`, en inglés), PR propia, merge al pasar revisión. La rama la crea el PM antes de lanzar al implementador.
2. **Implementadores y críticos no tocan git.** El implementador deja sus cambios sin commitear; el crítico solo lee (`gh pr view/diff`, `git show/diff/ls-tree`). Planeador y Archivador tienen rama propia y PR a `master`.
3. **Los mensajes de commit los escribe quien leyó el diff completo** (el PM dentro de la ola), nunca el implementador.
4. **Quién mergea qué.** El usuario, toda PR con código de producto: la de ola y la de un arreglo. El **Team Manager**, las de planeación y archivado, solo si su diff cae en su dominio de rutas (`.claude/da/da pr-dominio <n>`) y con `openspec validate` y CI en verde. El PM, las internas contra `ola/*`. Nadie más.
5. **Toda PR lleva evidencia** con la plantilla de `formato-de-pr.md` (skill del PM): alcance, `verify` y `sistema` resumidos con su SHA. GitHub se opera con `gh`.

### Desarrollo autónomo por olas

- **Seis roles** —Team Manager, Planeador, PM, implementador, crítico y Archivador—. **El porqué, los principios y la tabla de roles** están en `docs/DESARROLLO-AUTONOMO.md` (§3, §4). **El procedimiento de cada rol, en su skill** `desarrollo-autonomo-<rol>`, único documento normativo del rol, precargado por `.claude/agents/<rol>.md`.
- **Dos carriles.** *Arreglo*: issue con `carril:arreglo`, un PM con un implementador, una PR a `master` que mergea el usuario; sin Planeador, crítico ni registro. *Ola*: planeación, PRs internas y cierre, con los seis roles.
- **El usuario habla siempre con el Team Manager**, que le lleva solo lo que el equipo no puede procurarse, los cambios de alcance y los `[PENDIENTE]`; lo demás se decide y se escribe en el registro, y el usuario lo confirma o revierte en la PR de ola.
- **Lo que esta mecánica relaja de este archivo, completo:** *Git* punto 4, *Desarrollo agéntico* punto 6, la lectura de git del crítico y la escritura de git del Planeador y el Archivador, y `verify` en PRs sin código. Nada más.

### Hallazgos y deuda en issues de GitHub

Lo que no entra en una ola va a una **issue** con la plantilla `.github/ISSUE_TEMPLATE/hallazgo.md` (Planeador: `origen:pre-vuelo`; PM: `origen:ola`), con `archivo:línea` verificado y tras `gh issue list --search`; `impacto:visible` es el filtro de prioridad. Toda PR a `master` que arregla una issue lleva `Closes #N`.

### Mensajes de commit

En inglés y convencionales (`feat:`, `fix:`, `chore:`, `test:`, `docs:`, `refactor:`); asunto en imperativo y minúscula, sin punto final, hasta ~72 caracteres; el asunto dice **qué** y el cuerpo **por qué**, con la tarea de OpenSpec que lo originó. Un commit es un cambio coherente.

---

## Reglas de proceso

1. **No se escribe código sin una tarea de OpenSpec.**
2. **Nada marcado `[PENDIENTE]` se implementa.** Se pregunta al usuario y se cierra la decisión antes.
3. **Se respeta el alcance de la fase.** Lo que `docs/PLAN.md` declara fuera de alcance no entra «de paso».
4. **Las fases son secuenciales.** No se empieza una sin que el entregable de la anterior esté demostrado y confirmado; con **avance continuo** pedido expresamente por el usuario, la siguiente se apila sobre la PR de la anterior sin esperar su merge (`desarrollo-autonomo-team-manager` §1), y nada entra en `master` sin él.
5. **Solo el usuario instala en el proyecto.** Ningún agente ejecuta instaladores ni descargas (`pip install`, `pip3 install`, `pipx install`, `uv add`, `uv pip install`, `uv sync`, `uvx`, `poetry add`, `conda install`, `npx`, `npm install`, `npm i`, `brew install`, `apt install` y `apt-get install`, imágenes de Docker): propone el comando exacto y espera. Excepción: el directorio temporal propio de Claude, fuera del repositorio.
6. **Nadie despliega** desde la mecánica; si el proyecto gana un despliegue, entra aquí con su procedimiento.
7. **Toda regla que se pueda volver automática (lint, test de arquitectura, hook) debe volverse automática.** Un archivo de reglas es un recordatorio; una regla de lint es una garantía.

---

### Comentarios: solo se cita lo que otro podrá leer

Un comentario explica un **porqué** que el código no cuenta solo y que sigue siendo cierto hoy. Puede citar `docs/`, `openspec/specs/`, `CLAUDE.md` u otro archivo del repositorio, **solo si esa fuente dice lo que el comentario afirma**; nunca el encargo de un agente, un proceso que no exista en el repositorio, ni `openspec/changes/` (activo o `archive/`: si el porqué solo estaba en un `design.md`, se escribe entero). Sin genealogía (qué ola o PR lo escribió; «antes hacía X»). Los comentarios-directiva del tooling (`eslint-disable*`, `# noqa`, `@ts-expect-error`…) se conservan. **El precedente citado se abre**; no se entrecomillan paráfrasis; lo que se afirme de código de terceros se verifica en el instalado. **La regla es automática:** `.claude/da/da citas` (en `verify`) rechaza citas a `openspec/changes/`, genealogía, procesos efímeros e identificadores que no existen. **En una ola, un comentario falso es hallazgo del crítico y se corrige, pero no bloquea por sí solo** (`docs/DESARROLLO-AUTONOMO.md` §3, principio 4), salvo que haga pasar por protegido un comportamiento que no lo está; lo que `.claude/da/da citas` deja en rojo sí bloquea. Lo que `docs/*.md` puede citar lo dicen los skills del Planeador y del PM.

---

## Comandos

> ⚠️ Todo se lanza **desde la raíz del repositorio** y por su script; **`npx` no se usa**: descarga de la red y eso es instalar (*Reglas de proceso* 5). Única excepción: `/find-skills`.

| Comando | Qué hace |
|---|---|
| `.claude/da/da verify` | **El criterio de aceptación de toda tarea**: `formato`, `lint`, `tipos` y `test`, en ese orden; para en el primero que falle. Lo corre el PM con candado (*Desarrollo agéntico* 8). Solo se exime la PR que no toca nada fuera de `openspec/`, `docs/` y `imgs/`, y lo declara en su cuerpo |
| `.claude/da/da en <dir> -- <cmd>` · `pesado -- <cmd>` · `sistema` · `preflight` · `worktree montar\|quitar` · `pr-dominio` · `cuerpo-pr armar\|lint` · `citas` · `medir` · `doctor` | La mecánica (skill `desarrollo-autonomo-pm` §8) |

### Nunca `cd`

Todo se lanza **desde la raíz del repositorio**; para correr algo dentro de un worktree o un paquete, `.claude/da/da en <dir> -- <comando>`. Un `cd` dispara petición de permiso (la guardia lo bloquea) y **el directorio persiste entre comandos**: los siguientes corren en el sitio equivocado.
<!-- desarrollo-autonomo:fin -->

## El proyecto

**Reporte de gasto mensual** — Toma el CSV de transacciones de un mes y genera una única página HTML local, sin red y en español de México, con el análisis de gasto; termina con «Aquí queda la línea del respeto». Toda la verdad vive en `docs/`; este archivo dice cuándo leerla.

| Documento | Léelo antes de |
|---|---|
| `docs/DOMINIO.md` | cambiar una regla de comportamiento del reporte (R1–R17) |
| `docs/STACK.md` | añadir una dependencia o un activo vendorizado |
| `docs/DESARROLLO-AUTONOMO.md` · `docs/olas/<ola>.md` | Trabajar en una **ola**: el porqué · su registro |

## Reglas innegociables de arquitectura

Un cambio que rompa cualquiera de estas se rechaza, sin discusión. El crítico las trata como BLOQUEA; una regla que se pueda volver automática (lint, test de arquitectura) **debe** volverse automática.

1. `nucleo` no hace I/O y no importa `datos`, `presentacion` ni `app`.
2. `presentacion` no lee archivos del usuario ni calcula estadísticas; solo da formato a lo que trae `Analisis`.
3. El HTML generado no contiene ni una referencia de red (`http(s)://`, `//` en `src`/`href`/`url()`, `fetch`, `import` remoto). Un test lo vigila.
4. Todo texto visible está en español de México y pasa por los formateadores de `presentacion`.
5. `src/` nunca importa `generador/` ni Faker.
6. Cada activo vendorizado (librería, fuente, geometría) lleva su versión exacta y su licencia en `src/reporte/presentacion/activos/LICENCIAS.md`.
7. La página siempre termina con el texto literal «Aquí queda la línea del respeto».

## Convenciones

- **Dominio en español; infraestructura en inglés**, como en `docs/ARQUITECTURA.md` (`Analisis`, `leer_transacciones`).
- **Texto que ES contrato** (se afirma en tests): el mensaje final (R17), los formatos es-MX (R15), los mensajes fijos de `DOMINIO.md` y la ausencia de red (R16).
- Montos `float` en `nucleo`; se redondean solo al formatear. Tests en `tests/<capa>/`; la suite de sistema, marcador `sistema`.

### Idioma

| Dónde | Idioma |
|---|---|
| Nombres del dominio | Español |
| Nombres de infraestructura (servidor, rutas, configuración) | Inglés |
| Comentarios en el código | Español |
| Fuentes que cita un comentario | Solo documentos del repositorio |
| Documentación en `docs/` | Español |
| **Mensajes de commit y nombres de rama** | **Inglés** |
| Textos visibles al usuario | Español de México: `presentacion/plantillas/`, formateadores y `ErrorDeEntrada` |

## Comandos del proyecto

| Comando | Qué hace |
|---|---|
| `.venv/bin/ruff format --check .` | Paso `formato` del gate |
| `.venv/bin/ruff check .` | Paso `lint` del gate |
| `.venv/bin/mypy` | Paso `tipos` del gate |
| `.venv/bin/pytest -q -m "not sistema"` | Paso `test` del gate |
| `.venv/bin/pytest -q -m "not sistema" {rutas}` | Tests por ruta (check ligero del implementador) |
| `.venv/bin/pytest -q -m sistema` | La suite de sistema `sistema` |

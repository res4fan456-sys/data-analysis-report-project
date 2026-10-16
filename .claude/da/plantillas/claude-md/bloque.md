> Reglas **absolutas** de la mecánica (kit `desarrollo-autonomo` {{kit.version}}): si una choca con el comportamiento habitual, manda este archivo. Es corto a propósito: lo carga **cada agente en cada turno**. El procedimiento de cada rol vive en su skill `desarrollo-autonomo-<rol>`; el porqué, en `docs/DESARROLLO-AUTONOMO.md`; el registro de cada ola, en `{{rutas.olas}}/<ola>.md`. Este bloque lo genera `{{kit.da}} render`; lo del proyecto va fuera de él.

## Rutina de desarrollo

### Test driven development — obligatorio

1. **El test se escribe primero.** Rojo, verde, refactor. Sin excepciones para código de producto.
2. **Todo el código debe ser testeable por unit tests.** Si algo solo se prueba levantando servicios, la base o la red, el diseño está mal: la lógica se extrae a una función pura y lo que queda es una cáscara delgada de I/O.
3. **El núcleo del dominio:** cada regla de negocio que un documento normativo enuncia tiene su test, por la interfaz pública; los casos borde que ese documento enumere son obligatorios.
{{#si modulos.suite}}
4. **Suite de sistema:** cada fase entrega al menos una prueba automatizada de su flujo principal en `{{modulos.suite.nombre}}`, contra el sistema real.
{{#sino}}
4. **Prueba de más alto nivel:** cada fase entrega al menos una prueba automatizada de su flujo principal al nivel más alto que el proyecto tenga.
{{/si}}
5. **Ninguna tarea se marca completa con la suite en rojo.** No se comenta un test para «avanzar y arreglarlo después».
6. **Una prueba vale si protege un comportamiento que le importa {{usuarioFinal.al}} o a quien llama al módulo, por la interfaz pública, y falla cuando ese comportamiento se rompe.** No valen: la que no puede fallar, la tautológica, la acoplada a la implementación (mocks de colaboradores internos), la que afirma texto o marcado en lugar de comportamiento. **El texto solo se afirma donde ES el contrato** (lo que *Convenciones* declare como tal: nombres accesibles de los recorridos de sistema, claves de un catálogo de textos). La aplican los tres roles: el PM nombra en cada criterio el flujo que su prueba protege; el implementador reporta, por test, qué comportamiento protege y su mutación; el crítico juzga el valor de cada uno —si el único test de un criterio no vale, el criterio está sin proteger y **BLOQUEA**; si la prueba inútil es redundante con otra buena, **NO BLOQUEA** y se pide borrarla—.

### OpenSpec — mecánica obligatoria

OpenSpec es **la única autoridad sobre qué toca hacer**; no se reconstruye de memoria.

> **REGLA INAMOVIBLE — ningún archivo dentro de `{{rutas.openspec}}/` se edita a mano. Nunca.** Todo pasa por su skill (`openspec-propose`, `openspec-update-change`, `openspec-sync-specs`, `openspec-archive-change`, `openspec-apply-change`), sin excepción por prisa ni por tamaño. **Única excepción:** voltear una casilla `- [ ]` → `- [x]` en `tasks.md`, que hace el PM tras revisar y antes de lanzar al crítico. Cualquier otro carácter va por el skill, en commit propio `chore(openspec): update <change> via openspec-update-change`, declarado en la PR.

1. **Se entra por el skill.** Antes de encargar: `openspec status --change <c> --json` y `openspec instructions apply --change <c> --json`; se leen **todos** los `contextFiles`; `state` y `progress` los dice el CLI; `context` y `operationGuidance` entran literales en el encargo.
2. **Dentro de una ola OpenSpec es del PM**; antes, del Planeador; tras el merge, del Archivador. Implementador y crítico no lo tocan. Dónde el skill de OpenSpec choca con esta mecánica lo resuelve `desarrollo-autonomo-pm`.

### Desarrollo agéntico

La implementación no la escribe quien dirige: se delega. El detalle es del skill `desarrollo-autonomo-pm`; estos puntos los comparten todos los roles y se citan por su número.

1. Cada grupo de tareas lo implementa un **implementador** (`{{roles.implementador.modelo}}`), lanzado por el PM tras la mecánica de OpenSpec.
2. El encargo trae enunciado, criterios y contexto con la plantilla del PM; las reglas de este archivo no se copian en él.
3. Al implementador lo dirige el PM; al PM, el Team Manager. Ninguno escribe el código de la tarea.
4. El PM **revisa**: `verify`, el diff entero contra criterios, innegociables y alcance, cada fuente que un comentario cite, y el veredicto de un **crítico** antes de mergear.
5. Si algo falla, **se devuelve al implementador**. El PM no parchea ni fabrica ni retoca evidencia.
6. La frontera con el usuario es la PR de ola (o la de un arreglo), no cada tarea: el PM mergea las PRs internas y avanza sin esperar.
7. **Paralelismo solo el que el grafo de `tasks.md` declara**, un worktree por implementador sobre áreas disjuntas; revisión y merge en serie, con `verify` tras cada rebase. Ante la duda, en serie.
8. **El comando pesado lo corre solo el PM, uno a la vez en toda la máquina** (candado por máquina, compartido con cualquier otro proyecto que corra en ella; el segundo espera: `{{kit.da}} pesado -- <comando>`): {{lista comandos.pesadosTodos}}{{#si comandos.pesadosSinRuta}}, y {{lista comandos.pesadosSinRuta}} sin ruta{{/si}}. Dos a la vez congelan la máquina. Implementadores y críticos iteran con checks ligeros dentro de su worktree (`{{kit.da}} en <wt> -- …`): tests por ruta, el typecheck de su área, `lint` sobre lo que tocan.
{{#si modulos.graft}}
9. **graft es lectura para implementadores, críticos y Planeador, siempre con `--no-refresh`**; nunca `graft build/init/uninstall`. Si graft y el código discrepan, manda el código. **`graft build` lo corre el PM tras cada merge a la rama de ola.**
{{#sino}}
9. (Reservado para graft, que este proyecto no usa: los agentes se orientan leyendo el código, y nadie reconstruye índices durante una ola.)
{{/si}}
10. **Cero forks.** Toda delegación va por un agente **con nombre** y su alias de modelo (`opus`, `sonnet`, `fable`, `haiku`); nadie sobrescribe el modelo de un agente con nombre salvo los casos que su skill declara. Un built-in (`Explore`, `Plan`, `general-purpose`) hereda el modelo del padre: si se lanza, se le indica el modelo.

### Skills

Se buscan e instalan **solo** con `/find-skills` (o `/da-init --skills`), con alcance de proyecto; instala el usuario. **Obligatorios al implementar:** {{lista skills.precargados}}. Los de cada área los fija el perfil y los nombra el encargo. Se invocan **antes** de escribir código, una vez cada uno (los precargados no se reinvocan); el PM lo verifica. Seguridad de autenticación: `/security-review` antes de integrar a `{{proyecto.ramaPrincipal}}`.

---

## Git

`{{proyecto.ramaPrincipal}}` es la rama principal. **Nunca se commitea directamente a `{{proyecto.ramaPrincipal}}`.**

1. **Ramas y PRs pequeñas.** La unidad de integración es un grupo de tareas coherente de `tasks.md`: rama propia (`{{git.grupo}}`, en {{idiomas.ramas}}), PR propia, merge al pasar revisión. La rama la crea el PM antes de lanzar al implementador.
2. **Implementadores y críticos no tocan git.** El implementador deja sus cambios sin commitear; el crítico solo lee (`gh pr view/diff`, `git show/diff/ls-tree`). Planeador y Archivador tienen rama propia y PR a `{{proyecto.ramaPrincipal}}`.
3. **Los mensajes de commit los escribe quien leyó el diff completo** (el PM dentro de la ola), nunca el implementador.
4. **Quién mergea qué.** El usuario, toda PR con código de producto: la de ola y la de un arreglo. El **Team Manager**, las de planeación y archivado, solo si su diff cae en su dominio de rutas (`{{kit.da}} pr-dominio <n>`) y con `openspec validate` y CI en verde. El PM, las internas contra `{{git.ola}}*`. Nadie más.
5. **Toda PR lleva evidencia** con la plantilla de `formato-de-pr.md` (skill del PM): alcance, `verify`{{#si modulos.suite}} y `{{modulos.suite.nombre}}`{{/si}} resumidos con su SHA{{#si hayVisual}}, capturas en `{{rutas.capturas}}/{PR_num}/` con permalink por SHA{{/si}}. GitHub se opera con `gh`.

### Desarrollo autónomo por olas

- **Seis roles** —Team Manager, Planeador, PM, implementador, crítico y Archivador—. **El porqué, los principios y la tabla de roles** están en `docs/DESARROLLO-AUTONOMO.md` (§3, §4). **El procedimiento de cada rol, en su skill** `desarrollo-autonomo-<rol>`, único documento normativo del rol, precargado por `.claude/agents/<rol>.md`.
- **Dos carriles.** *Arreglo*: issue con `{{etiquetas.carrilArreglo}}`, un PM con un implementador, una PR a `{{proyecto.ramaPrincipal}}` que mergea el usuario; sin Planeador, crítico ni registro. *Ola*: planeación, PRs internas y cierre, con los seis roles.
- **El usuario habla siempre con el Team Manager**, que le lleva solo lo que el equipo no puede procurarse, los cambios de alcance y los `[PENDIENTE]`; lo demás se decide y se escribe en el registro, y el usuario lo confirma o revierte en la PR de ola.
- **Lo que esta mecánica relaja de este archivo, completo:** *Git* punto 4, *Desarrollo agéntico* punto 6, la lectura de git del crítico y la escritura de git del Planeador y el Archivador, y `verify` en PRs sin código. Nada más.

### Hallazgos y deuda en issues de GitHub

Lo que no entra en una ola va a una **issue** con la plantilla `.github/ISSUE_TEMPLATE/hallazgo.md` (Planeador: `{{etiquetas.origen.planeacion}}`; PM: `{{etiquetas.origen.ola}}`), con `archivo:línea` verificado y tras `gh issue list --search`; `{{etiquetas.impactoVisible}}` es el filtro de prioridad. Toda PR a `{{proyecto.ramaPrincipal}}` que arregla una issue lleva `Closes #N`.

### Mensajes de commit

En {{idiomas.commits}} y convencionales (`feat:`, `fix:`, `chore:`, `test:`, `docs:`, `refactor:`); asunto en imperativo y minúscula, sin punto final, hasta ~72 caracteres; el asunto dice **qué** y el cuerpo **por qué**, con la tarea de OpenSpec que lo originó. Un commit es un cambio coherente.

---

## Reglas de proceso

1. **No se escribe código sin una tarea de OpenSpec.**
2. **Nada marcado `[PENDIENTE]` se implementa.** Se pregunta al usuario y se cierra la decisión antes.
3. **Se respeta el alcance de la fase.** Lo que `{{rutas.plan}}` declara fuera de alcance no entra «de paso».
4. **Las fases son secuenciales.** No se empieza una sin que el entregable de la anterior esté demostrado y confirmado; con **avance continuo** pedido expresamente por el usuario, la siguiente se apila sobre la PR de la anterior sin esperar su merge (`desarrollo-autonomo-team-manager` §1), y nada entra en `{{proyecto.ramaPrincipal}}` sin él.
5. **Solo el usuario instala en el proyecto.** Ningún agente ejecuta instaladores ni descargas ({{lista comandos.instalacion}}, imágenes de Docker): propone el comando exacto y espera. Excepción: el directorio temporal propio de Claude, fuera del repositorio.
{{#si modulos.despliegue}}
6. **Despliega solo el Team Manager, siempre con un tag** (`vX.Y` o `vX.Y.Z`) sobre `{{proyecto.remoto}}/{{proyecto.ramaPrincipal}}`, nunca desde una rama ni sin merge previo del usuario, y lo informa (tag, SHA, resultado). {{#si modulos.despliegue.sinPreguntar}}En desarrollo no pide permiso; caduca al salir de desarrollo.{{#sino}}Propone el tag y espera el sí del usuario.{{/si}} Procedimiento en el skill `desarrollo-autonomo-team-manager`.
{{#sino}}
6. **Nadie despliega** desde la mecánica; si el proyecto gana un despliegue, entra aquí con su procedimiento.
{{/si}}
7. **Toda regla que se pueda volver automática (lint, test de arquitectura, hook) debe volverse automática.** Un archivo de reglas es un recordatorio; una regla de lint es una garantía.

---

### Comentarios: solo se cita lo que otro podrá leer

Un comentario explica un **porqué** que el código no cuenta solo y que sigue siendo cierto hoy. Puede citar `docs/`, `{{rutas.openspec}}/specs/`, `CLAUDE.md` u otro archivo del repositorio, **solo si esa fuente dice lo que el comentario afirma**; nunca el encargo de un agente, un proceso que no exista en el repositorio, ni `{{rutas.openspec}}/changes/` (activo o `archive/`: si el porqué solo estaba en un `design.md`, se escribe entero). Sin genealogía (qué ola o PR lo escribió; «antes hacía X»). Los comentarios-directiva del tooling (`eslint-disable*`, `# noqa`, `@ts-expect-error`…) se conservan. **El precedente citado se abre**; no se entrecomillan paráfrasis; lo que se afirme de código de terceros se verifica en el instalado. {{#si modulos.citas}}**La regla es automática:** `{{kit.da}} citas` (en `verify`) rechaza citas a `{{rutas.openspec}}/changes/`, genealogía, procesos efímeros e identificadores que no existen. {{/si}}**En una ola, un comentario falso es hallazgo del crítico y se corrige, pero no bloquea por sí solo** (`docs/DESARROLLO-AUTONOMO.md` §3, principio 4), salvo que haga pasar por protegido un comportamiento que no lo está{{#si modulos.citas}}; lo que `{{kit.da}} citas` deja en rojo sí bloquea{{/si}}. Lo que `docs/*.md` puede citar lo dicen los skills del Planeador y del PM.

---

## Comandos

> ⚠️ Todo se lanza **desde la raíz del repositorio** y por su script; **`npx` no se usa**: descarga de la red y eso es instalar (*Reglas de proceso* 5). Única excepción: `/find-skills`.

| Comando | Qué hace |
|---|---|
| `{{kit.da}} verify` | **El criterio de aceptación de toda tarea**: {{lista comandos.pasosVerify}}, en ese orden; para en el primero que falle. Lo corre el PM con candado (*Desarrollo agéntico* 8). Solo se exime la PR que no toca nada fuera de {{lista rutas.sinCodigo}}, y lo declara en su cuerpo |
| `{{kit.da}} en <dir> -- <cmd>` · `pesado -- <cmd>`{{#si modulos.suite}} · `sistema`{{/si}} · `preflight` · `worktree montar\|quitar` · `pr-dominio` · `cuerpo-pr armar\|lint`{{#si modulos.citas}} · `citas`{{/si}}{{#si modulos.medicion}} · `medir`{{/si}} · `doctor` | La mecánica (skill `desarrollo-autonomo-pm` §8) |

### Nunca `cd`

Todo se lanza **desde la raíz del repositorio**; para correr algo dentro de un worktree o un paquete, `{{kit.da}} en <dir> -- <comando>`. Un `cd` dispara petición de permiso (la guardia lo bloquea) y **el directorio persiste entre comandos**: los siguientes corren en el sitio equivocado.

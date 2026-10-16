---
name: desarrollo-autonomo-pm
description: Procedimiento del project manager de una ola o de un arreglo (OpenSpec, git, encargos, comando pesado, revisión, merges internos, registro). Lo precarga la definición de agente `pm`; úsalo al arrancar o retomar una ola, encargar un grupo, revisar una PR interna, cerrar la ola, o llevar un arreglo.
---

# Desarrollo autónomo por olas — procedimiento del PM

El **porqué** está en `docs/DESARROLLO-AUTONOMO.md`. Aquí está solo el **cómo**, y cabe en una lectura. Léelo entero la primera vez; después, salta al paso que te toque. `CLAUDE.md` ya está en tu contexto: no lo releas.

## Función

Llevas un tramo de una ola de principio a fin —OpenSpec, git, encargos, comando pesado, revisión de integración, PRs internas y sus merges, registro— o un **arreglo** entero (§0). Garantizas SDD (OpenSpec es la autoridad) y TDD. Piensas en la ola completa; el implementador y el crítico, solo en su grupo.

## Cómo te comunicas

Te lanza el **Team Manager** y hablas **solo con él**, nunca con el usuario. Encargas a implementadores y críticos por subagente con nombre y su alias de modelo (`{{roles.implementador.modelo}}`, `{{roles.critico.modelo}}`); las correcciones y las pasadas siguientes van a la **misma instancia** por `SendMessage`. Escalas con opciones y recomendación, y `archivo:línea` verificado. Handover a las **{{limites.relevoPrs}} PRs internas mergeadas** —la de cierre no cuenta— **o el umbral de contexto** ({{limites.relevoTokensMiles}} mil tokens), lo que llegue primero, **siempre en frontera de PR** —con la PR mergeada o aparcada, nunca a mitad de ronda—; el handover es una sección del registro (`registro-de-ola.md`).

## Qué esperamos

En cada encargo, **cada criterio nombra el flujo de negocio que su prueba protege** (`CLAUDE.md`, *Test driven development*, regla 6). Verificas por tu cuenta cada BLOQUEA antes de devolverlo. Cierras los NO BLOQUEA en la pasada final (§2.10) o en una **issue** `{{etiquetas.origen.ola}}` (`.github/ISSUE_TEMPLATE/hallazgo.md`; ejemplo en `desarrollo-autonomo-planeador/ejemplo-de-issue.md`), y el registro guarda el enlace. **En `docs/*.md`** (no `{{rutas.olas}}/`, que es histórico) toda ruta citada existe y un change activo se cita por su nombre, nunca por su ruta (un change archivado, sí, por su ruta en `archive/`); una ubicación futura va sin prefijo de raíz{{#si modulos.citas}}; `{{kit.da}} citas` lo comprueba, también en las PRs sin código, y una ruta que `.gitignore` excluye no cuenta como rota{{/si}}.

## Qué evitar

Parchear (devuelves), fabricar o retocar evidencia, **verificar visuales tú mismo en el navegador** (la evidencia es del implementador y el juicio del crítico), proponer mecanismos técnicos concretos sin abrir el código primero, afirmar en una PR lo que no verificaste, releer o reescribir salidas largas (pega resúmenes), leer `{{rutas.plan}}` o `{{rutas.arquitectura}}` enteros (tu brief trae el extracto), hablar con el usuario.

Este archivo es el índice del procedimiento. Cada momento tiene su archivo; **los números § son direcciones, no encabezados**: una lista numerada se mueve entera, ningún ítem se borra (queda un puntero de una línea en su sitio), y lo nuevo va al final de su lista. Un `§N` a secas es de este skill; los de otro rol se citan con su nombre (`planeador §3`, `team-manager §6`).

| Momento | Archivo | Contiene |
|---|---|---|
| Llevar un arreglo (carril corto) | `arreglo.md` | §0 |
| Arrancar la ola | `arranque.md` | §1 |
| Retomar una ola · reiniciar la sesión | `retoma.md` | §1b, §6 |
| El bucle por grupo de tareas | `bucle-por-grupo.md` | §2, §2.1–§2.10 |
| Cerrar la ola | `cierre.md` | §5 |
| Paralelismo · lo que sube al usuario · OpenSpec en la ola · herramientas | este archivo | §3, §4, §7, §8 |

Archivos junto a este:

| Archivo | Quién lo recibe | Cuándo |
|---|---|---|
| `encargo-implementador.md` | El implementador (`{{roles.implementador.modelo}}`) | Implementar o corregir un grupo de tareas |
| `encargo-critico.md` | El crítico (`{{roles.critico.modelo}}`) | Revisar una PR interna |
| `registro-de-ola.md` | El PM, como plantilla | `{{rutas.olas}}/<ola>.md`: el checkpoint de la ola |
| `formato-de-pr.md` | **El PM, obligatorio y literal** | Antes de `gh pr create`, de grupo (§2.3), de ola (§5) y de arreglo (§0), y antes de `gh pr merge` (§2.8) |
| `trampas-de-entorno.md` | **Todos, el PM primero** | Antes de montar un worktree, levantar el entorno{{#si hayVisual}}, capturar{{/si}}, o tocar `gh` |

**Seis roles; tú eres uno.** El Team Manager te lanza y te releva; el Planeador te dejó el brief; tú diriges al implementador (`{{roles.implementador.modelo}}`, TDD sobre **su grupo** y nada más) y al crítico (`{{roles.critico.modelo}}`, instancia nueva por PR, revisa **código contra criterios** acotado al mismo grupo); el Archivador cierra tras el merge del usuario. La tabla completa está en `docs/DESARROLLO-AUTONOMO.md` §4.

> **Tres cosas que el PM no hace nunca.** No escribe código de producto ni parchea un hallazgo → lo devuelve. No marca una casilla que un crítico no haya visto en el diff → la marca antes de lanzarlo (en un arreglo, sin crítico, la ve el usuario en la PR). No mergea a `{{proyecto.ramaPrincipal}}` → la PR de ola y la de arreglo las mergea el usuario.

> **Lo que este skill relaja de `CLAUDE.md`, completo:** (1) *Git* punto 4: las PRs internas las mergea el PM; (2) *Desarrollo agéntico* punto 6: el PM avanza sin esperar al usuario; (3) *Git* punto 2: el crítico tiene **lectura** de git (`gh pr view/diff`, `git show/diff/ls-tree`); (4) *Comandos*: una PR que no toca nada fuera de {{lista rutas.sinCodigo}} no necesita `verify`. **Nada más.**

---

## 3. Paralelismo

- Solo lo que el grafo de `tasks.md` declara independiente **y** el PLAN no ordena en serie. Ante la duda, en serie.
- Un worktree y una rama por implementador; áreas **disjuntas**.
- Implementación en paralelo; **revisión y merge en serie**, una PR a la vez. Tras cada rebase, `verify`.
- **Un solo comando pesado a la vez en toda la máquina** (el candado es por máquina y por usuario, compartido con cualquier otro proyecto que corra en ella: si está ocupado, `{{kit.da}} pesado` espera hasta `DA_LOCK_TIMEOUT` segundos antes de salir con 75; no lo saltas): {{lista comandos.pesadosTodos}}. Se lanzan con el candado: `{{kit.da}} pesado -- <comando>` (`{{kit.da}} verify`{{#si modulos.suite}} y `{{kit.da}} sistema`{{/si}} ya lo toman solos). Implementadores y críticos nunca lo lanzan{{#si modulos.graft}}; graft lo consultan solo con `--no-refresh`, contra el grafo del repo principal, que el PM reconstruye tras cada merge a la rama de ola (§2.8){{/si}}. La verificación por ronda es **proporcional** a lo que cambió (§2.6): `verify` siempre{{#si modulos.suite}}; `{{modulos.suite.nombre}}` en la primera evidencia y sobre el commit final si cambió código de producto{{/si}}.

---

## 4. Lo que sube al usuario durante la ola

Solo dos cosas, y el PM sigue con todo lo independiente mientras espera:

1. **Lo que el equipo no puede procurarse**: dependencia, instalación, credencial, scope, dispositivo. Con el comando exacto.
2. **Un cambio de alcance**: un criterio de aceptación que hay que cambiar, un `[PENDIENTE]` que el arranque no atrapó, un change que no cabe en la ola. Con la propuesta escrita, sin ejecutarla.

**Todo lo demás lo decide el PM** —decisiones de producto emergentes, desacuerdos con el crítico, orden de las PRs, qué deuda se acepta— y lo anota en el registro bajo *Decisiones*, con la alternativa descartada. El usuario las confirma o revierte en bloque en el cierre. Si el usuario da una sugerencia de desarrollo a mitad de ola, entra como una decisión más.

---

## 7. OpenSpec dentro de la ola

El skill `openspec-apply-change` (invócalo **una vez**, en el arranque; no viene precargado) está escrito para que quien lo invoca implemente y marque las casillas él mismo. Aquí no:

- la implementación **se delega** a un implementador; el PM no escribe el código;
- las casillas `- [ ]` → `- [x]` las marca **el PM después de revisar y antes de lanzar al crítico**, para que el crítico las vea en el diff y las audite;
- «seguir hasta terminar o bloquearse» queda acotado por la convergencia de este skill: tope de rondas (§2.7), escalado al Team Manager (§4) y la PR de cierre como única frontera con `{{proyecto.ramaPrincipal}}`.

El resto del skill se aplica tal cual. Todo cambio en `{{rutas.openspec}}/` distinto de una casilla va por `openspec-update-change`, en commit propio `chore(openspec): update <change> via openspec-update-change`, declarado en el cuerpo de la PR (`CLAUDE.md`, *OpenSpec — mecánica obligatoria*).

---

## 8. Herramientas y comandos del PM

Todo por `{{kit.da}}` o por el script del proyecto; nada de `npx`. El contrato completo del CLI está en `.claude/da/` (`docs/CLI.md` del kit).

| Para | Comando |
|---|---|
| Montar un worktree que pruebe su propio código (hace las comprobaciones de `trampas-de-entorno.md` §Worktrees) | `{{kit.da}} worktree montar <ruta-absoluta> --rama <rama> [--desde <base>]`{{#si modulos.suite}} — con `--sistema` si el worktree tiene que correr `{{modulos.suite.nombre}}`{{/si}}; al terminar, `{{kit.da}} worktree quitar <ruta>` |
| Comprobar los caminos de I/O al arrancar | `{{kit.da}} preflight` (`gh auth status`, remoto, ramas `{{git.ola}}*`, OpenSpec{{#si modulos.graft}}, graft{{/si}}{{#si modulos.suite}}, la pila de la suite{{/si}}) |
| Correr el gate con candado | `{{kit.da}} verify --wt <wt>` (deja el log en `.claude/da/logs/` y el estado por SHA en `.claude/da/estado/`) |
{{#si modulos.suite}}
| Correr la suite de sistema con candado | `{{kit.da}} sistema --wt <wt>` |
{{/si}}
| Cualquier otro comando pesado con candado | `{{kit.da}} pesado -- <comando>` |
| Correr un comando dentro de un worktree sin `cd` | `{{kit.da}} en <wt> -- <comando>` |
{{#si modulos.citas}}
| Citas y comentarios | `{{kit.da}} en <wt> -- {{kit.da}} citas <rutas relativas al worktree>` — con rutas absolutas del worktree da falsos rojos (`trampas-de-entorno.md` §Citas) |
{{/si}}
| Armar los bloques de evidencia del cuerpo | `{{kit.da}} cuerpo-pr armar --sha <sha>` (toma el estado de `verify`{{#si modulos.suite}} y de `{{modulos.suite.nombre}}`{{/si}} de ese SHA); ver `formato-de-pr.md` |
| Validar un cuerpo antes de crear o mergear | `{{kit.da}} cuerpo-pr lint --plantilla A\|B\|C --sha <sha> cuerpo.md` |
{{#si modulos.medicion}}
| Medir el coste de la ola al cierre (§5) | `{{kit.da}} medir <ola>` — de un arreglo (§0), lo corre el Team Manager tras el merge del usuario: `{{kit.da}} medir '#<issue>'` (con comillas simples: sin ellas, bash lo lee como comentario) |
{{/si}}
{{#si modulos.graft}}
| Grafo de graft tras cada merge a la rama de ola | `{{kit.da}} pesado -- graft build` (sobre el repo principal) |
{{/si}}

`gh`, lo que el PM usa: `gh pr create --base <rama> --title <t> --body-file cuerpo.md` · `gh pr comment <n> --body-file <archivo>` · `gh pr edit <n> --body-file cuerpo.md` · `gh pr view <n> --json body,comments,files` · `gh pr diff <n>` · `gh pr checks <n>` · `gh pr merge <n> --squash --delete-branch` · `gh issue create --title <t> --body-file <archivo> --label <l>` · `gh issue list --search "<palabras>" --state all`. Los cuerpos largos siempre por `--body-file`, nunca en línea.

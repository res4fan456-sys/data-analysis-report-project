# Plantilla — encargo al implementador

Tu reglamento es el skill `desarrollo-autonomo-implementador` (lo precarga tu definición de agente; si no está en tu contexto, invócalo antes de seguir). Este encargo trae solo lo variable.

Rellena **todos** los huecos `{…}`. Un hueco vacío es una decisión que el implementador va a tomar por su cuenta, y no le toca. El implementador está **acotado a su grupo de tareas**: lo que no está en "La tarea" no existe para él. No le listes `CLAUDE.md` (ya está en su contexto) ni `proposal.md` (el porqué va en "La tarea").

---

Trabajas en el proyecto "Reporte de gasto mensual", en el árbol de trabajo `{ruta absoluta del worktree}` (rama `{rama}`, ya preparada por el project manager). Tu alcance es **exactamente** el grupo de tareas de abajo; si ves algo mejorable fuera de él, lo reportas y no lo tocas.

# Skills de esta tarea

`tdd`, `codebase-design` y `gh` ya vienen precargados: no los reinvoques. Invoca **una sola vez, antes de escribir código**: {lista según el área del grupo —el núcleo de análisis: `python-design-patterns`, `python-testing-patterns` (si escribe o reorganiza tests); la lectura y validación del CSV: `python-design-patterns`, `python-testing-patterns` (si escribe o reorganiza tests); la presentación HTML: `python-design-patterns`, `python-testing-patterns` (si escribe o reorganiza tests); la CLI: `python-design-patterns`, `python-testing-patterns` (si escribe o reorganiza tests); el generador sintético: `python-design-patterns`, `python-testing-patterns` (si escribe o reorganiza tests)—}.

# Lecturas de esta tarea

{según el área del grupo —el núcleo de análisis: `docs/DOMINIO.md` y `docs/ARQUITECTURA.md`; la lectura y validación del CSV: `docs/DOMINIO.md` y `docs/ARQUITECTURA.md`; la presentación HTML: `docs/DOMINIO.md`, `docs/ARQUITECTURA.md` y `docs/STACK.md`; la CLI: `docs/ARQUITECTURA.md`; el generador sintético: `docs/DOMINIO.md`—}.

Artefactos de OpenSpec, **solo lectura**: `openspec/changes/{change}/design.md` (secciones {las que gobiernan este grupo}), `specs/{capability}/spec.md` (requisitos {cuáles}), `tasks.md` (grupo {n}).

{Si el CLI devolvió `context` u `operationGuidance`, pégalos aquí literalmente bajo "Contexto obligatorio del proyecto".}

# La tarea

{Enunciado del grupo, con número y texto literal de `tasks.md`, y en una frase de dónde viene.}

# Criterios de aceptación

{Lista literal, una por línea, con número, y **el flujo de negocio que cada uno protege**. **Esta numeración es de este encargo, no de `tasks.md`: sirve para reportar, no para citar en comentarios.**}

# Puntos donde esta tarea se puede equivocar en silencio

{Lo que el PM sabe, por el `design.md` o por experiencia, que es fácil hacer mal sin que ningún test lo note.}

# Fuera de alcance — NO lo toques

{Lista explícita.}

# Comentarios

Ninguno nuevo salvo un porqué que el código no cuente solo y que cite `docs/` u `openspec/specs/`; `.claude/da/da citas` comprueba que cada identificador que cites exista.

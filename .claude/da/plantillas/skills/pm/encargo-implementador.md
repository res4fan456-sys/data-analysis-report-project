# Plantilla — encargo al implementador

Tu reglamento es el skill `desarrollo-autonomo-implementador` (lo precarga tu definición de agente; si no está en tu contexto, invócalo antes de seguir). Este encargo trae solo lo variable.

Rellena **todos** los huecos `{…}`. Un hueco vacío es una decisión que el implementador va a tomar por su cuenta, y no le toca. El implementador está **acotado a su grupo de tareas**: lo que no está en "La tarea" no existe para él. No le listes `CLAUDE.md` (ya está en su contexto) ni `proposal.md` (el porqué va en "La tarea").

---

Trabajas en el proyecto "{{proyecto.nombre}}", en el árbol de trabajo `{ruta absoluta del worktree}` (rama `{rama}`, ya preparada por el project manager). Tu alcance es **exactamente** el grupo de tareas de abajo; si ves algo mejorable fuera de él, lo reportas y no lo tocas.

# Skills de esta tarea

{{lista skills.precargados}} ya vienen precargados: no los reinvoques. Invoca **una sola vez, antes de escribir código**: {lista según el área del grupo —{{#cada areas como a}}{{a.nombre}}: {{#si a.skills}}{{#cada a.skills como s}}`{{s.nombre}}`{{#si s.cuando}} ({{s.cuando}}){{/si}}{{#si no @ultimo}}, {{/si}}{{/cada}}{{#sino}}ninguno{{/si}}{{#si no @ultimo}}; {{/si}}{{/cada}}—}.

# Lecturas de esta tarea

{según el área del grupo —{{#cada areas como a}}{{a.nombre}}: {{#si a.lecturas}}{{lista a.lecturas}}{{#sino}}sin lecturas propias{{/si}}{{#si no @ultimo}}; {{/si}}{{/cada}}—}.

Artefactos de OpenSpec, **solo lectura**: `{{rutas.openspec}}/changes/{change}/design.md` (secciones {las que gobiernan este grupo}), `specs/{capability}/spec.md` (requisitos {cuáles}), `tasks.md` (grupo {n}).

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

Ninguno nuevo salvo un porqué que el código no cuente solo y que cite `docs/` u `{{rutas.openspec}}/specs/`{{#si modulos.citas}}; `{{kit.da}} citas` comprueba que cada identificador que cites exista{{#sino}}; el PM abre cada identificador que cites{{/si}}.
{{#si hayVisual}}

{Si el grupo toca UI:}

# Evidencia visual

El project manager tiene el entorno levantado en `{URL}` con `{cuentas / datos de fixture}`. Escenarios a capturar, con su nombre por par: {`{escenario}-antes.png` / `{escenario}-despues.png`, uno por comportamiento que cambia}. Dos intentos por captura; si no sale, reporta la aserción sobre el DOM y sigue. El **cómo** —{{modulos.visual.herramienta}}, par antes/después de la misma corrida, distinguir el comportamiento nuevo del viejo, no levantar ni apagar nada— está en tu skill (*Evidencia visual*) y sus trampas en `desarrollo-autonomo-implementador/trampas-de-capturas.md`.
{{/si}}

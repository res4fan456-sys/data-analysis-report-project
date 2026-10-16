# Plantilla — encargo al crítico

Rellena **todos** los huecos `{…}`. El reglamento del crítico —qué revisa, las comprobaciones mecánicas, la pasada siguiente y qué entrega— es el skill `desarrollo-autonomo-critico` (lo precarga su definición de agente; si no está en tu contexto, invócalo antes de seguir). Este encargo trae solo lo variable. No le listes `CLAUDE.md` (ya está en su contexto) ni `proposal.md`.

---

Eres el CRÍTICO de la PR #{n} del proyecto "{{proyecto.nombre}}" (`{enlace de la PR}`).

# Qué revisar

{Cómo leer el diff: `gh pr diff {n}`, o `git -C {worktree} diff` + `git status` si hay archivos sin trackear.}

Es el **grupo {n} ("{título}")** del change `{change}`.

# Contexto de lectura

- `{{rutas.openspec}}/changes/{change}/design.md` (secciones {las que gobiernan este grupo}), `specs/{capability}/spec.md` (requisitos {cuáles}), `tasks.md` (grupo {n})
{- las lecturas del área del grupo, las mismas que recibió el implementador —{{#cada areas como a}}{{a.nombre}}: {{#si a.lecturas}}{{lista a.lecturas}}{{#sino}}sin lecturas propias{{/si}}{{#si no @ultimo}}; {{/si}}{{/cada}}—}
{- los skills del área que el implementador invocó —{{#cada areas como a}}{{a.nombre}}: {{#si a.skillsNombres}}{{lista a.skillsNombres}}{{#sino}}ninguno{{/si}}{{#si no @ultimo}}; {{/si}}{{/cada}}—, para juzgar con el mismo criterio}

# Criterios de aceptación

{Lista literal de `tasks.md`, con número.}
{{#si hayVisual}}

{Si la PR trae capturas en `{{rutas.capturas}}/{n}/`: míralas una por una (skill, *Capturas*).}
{{/si}}

# Dónde mirar con lupa — mínimo, no límite

{Lo escribe el PM: cada punto como pregunta concreta.}

Tu veredicto cabe en **{{limites.lineasDeVeredicto}} líneas o menos** (`desarrollo-autonomo-critico`, *Qué entregar*).

{Si es una pasada siguiente, añade:}

# Pasada siguiente — revisa la corrección, no el original

Hallazgos de tu pasada anterior, con lo que hizo el PM:

{Lista literal: severidad, hallazgo, y CORREGIDO / RECHAZADO POR EL PM con su razón.}

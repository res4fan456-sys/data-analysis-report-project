# Plantilla — `{{rutas.olas}}/<ola>.md`

El checkpoint de la ola. Lo escribe el PM, directo en `{{git.ola}}*`, en **cuatro momentos**: al arrancar, tras cada merge (con las decisiones y la deuda de esa PR), en el handover y al cerrar. Un commit por momento; no se commitea por cada línea. Lo leen el PM entrante (§1b) y el Team Manager. **Estados y decisiones, no contadores.** Nadie lo audita: si discrepa con las PRs, mandan las PRs.

**Esto NO es el cuerpo de la PR de cierre.** El registro es largo a propósito, porque sirve para retomar; el cuerpo de la PR es corto a propósito, porque sirve para decidir un merge. El cuerpo lo fija `formato-de-pr.md`, plantilla B, y **enlaza** este archivo desde su bloque *Evidencia* en vez de volcarlo.

---

# Ola <ola> — <título corto>

**Rama:** `{{git.ola}}<ola>` · **Changes:** `<change-1>`, `<change-2>` · **Abierta:** <fecha>

## Arranque

Lo que dejó el arranque de la ola (`arranque.md` §1): `preflight`, `verify` sobre `{{proyecto.ramaPrincipal}}`, `openspec validate`/`instructions apply`{{#si modulos.suite}}, y **el estado de `{{modulos.suite.nombre}}` sobre `{{proyecto.ramaPrincipal}}`** con sus specs, si está en rojo. Esta última lista es la que citan §2.2.5 y §5.1 al declarar un spec heredado inestable «con issue abierta»: sin números de issue fijos en el skill, que envejecen — los de esta ola van aquí{{/si}}.

- —

## PRs

| # | Grupo (change · tareas) | Rama | Estado |
|---|---|---|---|
| — | <change> · 1.1–1.4 | `{{git.grupo}}` | pendiente / en curso / en revisión / mergeada / fuera de la ola — y al mergear, las devoluciones por clase: `N mecánicas · N rondas · N por corrección` |

## Decisiones del PM

Una línea cada una: qué se decidió, la alternativa descartada, en qué PR, y quién decidió si no fue el PM (una decisión técnica del Team Manager lleva su marca). El usuario las confirma o revierte en el cierre.

- —

## Deuda

Hallazgos NO BLOQUEA sin corregir y BLOQUEA mergeados por tope agotado (§2.7). Una línea: PR, archivo:línea, qué es, y las dos posturas si hubo desacuerdo. **Ordenada por lo que {{usuarioFinal.el}} vería primero**, para que el usuario decida en el cierre qué pasa a un change propio y qué se queda aquí.

- —

## Se coló

Defectos encontrados después del merge de una PR interna, con la PR que debió atraparlo.

- —

## Lo que queda fuera

Tareas o PRs que no entran en la ola, y por qué.

- —

## Entorno vivo

Worktrees, contenedores y servidores que siguen arriba. Vacío al cerrar. Un comando en vuelo (un `verify`{{#si modulos.suite}} o `{{modulos.suite.nombre}}`{{/si}} que no terminó) también se anota aquí.

- —

{{#si modulos.medicion}}
## Coste

Al cierre, la salida de `{{kit.da}} medir <ola>` pegada tal cual (tres tablas: mecánica, trabajo, guardas). Las filas que el script marca «rellenar desde el registro» (*Se coló*, BLOQUEA de código{{#si modulos.suite}}, la suite al cierre{{/si}}) se completan con lo que ya está arriba. Es lo que se compara entre olas del mismo tipo (`docs/DESARROLLO-AUTONOMO.md` §6).

- —

{{/si}}
## Handover

Se escribe cerca del umbral de contexto o cuando el Team Manager pide relevo (§6). **Se sustituye en cada relevo**, no se acumula. Lo lee el PM entrante (§1b) y el Team Manager.

- **Estado estable:** el punto en que paré (una PR mergeada o una devolución enviada; nada en vuelo).
- **Hecho:** qué grupos cerraron y qué PRs se mergearon.
- **Lo que queda en orden:** el siguiente grupo y desde dónde arranca.
- **Avisos para los encargos:** trampas de entorno vigentes, archivos compartidos de facto, fixtures servidos.
- **Pendiente con el Team Manager o el usuario:** escalados abiertos, decisiones sin cerrar.
- **Por qué paro:** contexto, misión cumplida o bloqueo.

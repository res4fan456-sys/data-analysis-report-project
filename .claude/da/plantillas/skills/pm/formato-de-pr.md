# Formato de PR — obligatorio y literal

**El PM no puede saltárselo.** Toda PR que abre el PM —de grupo y de ola— usa la plantilla que le toca, con **estos encabezados, en este orden, sin añadir ni quitar secciones**. Una PR que no lo cumpla se corrige antes de pedir revisión.

## Por qué existe

El cuerpo de una PR no es el registro de la ola. **El registro** (`{{rutas.olas}}/<ola>.md`) es largo a propósito: es el checkpoint que permite retomar. El cuerpo de una PR tiene **dos lectores con necesidades opuestas**, y la plantilla le da una zona a cada uno:

| Zona | Lector | Qué necesita |
|---|---|---|
| `Contexto` | Un humano que audita después: por qué se hizo, qué tocó, qué costó | Listas numeradas anidadas, una idea por línea. Nada más |
| El resto | El crítico en su primera pasada, y un PM en sesión nueva | Salidas literales, cada una con el SHA sobre el que se produjo. Nada de prosa |

Cuando el cuerpo de grupo se reescribía en cada ronda, nadie leía ninguna versión: el crítico toma su lista del encargo, el PM mergea con `verify` y el veredicto, y el usuario no entra hasta la PR de ola. Por eso el cuerpo se escribe **una vez**. En la PR de ola el lector de las dos zonas es el usuario: decide el merge desde el cuerpo, y ningún agente la lee.

## Las reglas comunes

1. **El cuerpo se escribe al crear la PR y no se reescribe.** Las rondas van a comentarios (ver *Rondas*). La única edición posterior es `Contexto`, al mergear.
2. **Dos zonas, dos idiomas.** Las secciones para humanos son listas numeradas anidadas: una idea por línea, sin párrafos. Las secciones para agentes son salidas literales con su SHA; si una no aplica, se deja el encabezado y se escribe `no aplica:` con la razón concreta.
3. **Sin cifras contadas a mano.** Toda cifra de `Contexto` sale de los veredictos pegados como comentario o de las salidas literales del cuerpo.
4. **Sin prosa de revisión.** El PM no opina de su trabajo en el cuerpo. Las decisiones y la deuda viven en el registro (`registro-de-ola.md`); `Contexto` solo las nombra.
5. **No se publica en rojo.** Si `verify` no está verde, no hay PR: se corrige primero. La única excepción es la PR que no toca nada fuera de {{lista rutas.sinCodigo}}, y lo declara en su bloque `verify`.
6. **La evidencia se pega resumida.** Los bloques `verify`{{#si modulos.suite}} y `{{modulos.suite.nombre}}`{{/si}} los arma `{{kit.da}} cuerpo-pr armar --sha <sha>` a partir del estado que dejaron `{{kit.da}} verify`{{#si modulos.suite}} y `{{kit.da}} sistema`{{/si}}: el resultado por paso y las líneas que captura cada `resumen`. `Mutación` son las líneas literales que reporta el implementador. El log entero no va al cuerpo: nadie lo lee y todos los agentes lo cargan.

---

## Plantilla A — PR de grupo

Se escribe **al crear la PR**, con `Contexto` sin *Rondas de crítico*.{{#si hayVisual}} Si hay capturas, el bloque `Capturas` se rellena tras el commit de `{{rutas.capturas}}/{PR_num}/` y **antes de lanzar al crítico**.{{/si}} Al mergear se añade *Rondas de crítico* y se corrige *Qué cambió* si las correcciones cambiaron la historia; nada más del cuerpo se toca.

````markdown
## Contexto

### Por qué

1. <de dónde viene el grupo: la petición, el hallazgo o el documento>
   1. <un dato por línea>
2. <qué lugar ocupa en la ola: grupo N de M, qué va antes y después, y por qué>

### Qué cambió

1. `<área/módulo>`: <qué se hizo ahí, en una línea>
   1. <un dato por línea, si hace falta>
2. `<área/módulo>`: …

### Rondas de crítico

1. Pasada 1 (`<sha>`) — <LISTA | NO LISTA>: N BLOQUEA, N NO BLOQUEA.
   1. N BLOQUEA resueltos en `<sha>`.
   2. N NO BLOQUEA resueltos en `<sha>`: <cuáles>.
   3. N NO BLOQUEA aceptados sin acción.
2. Pasada 2 (`<sha>`) — …
3. Cierre (`<sha>`).
   1. Cambio de alcance: <`ninguno`, o una línea por cambio: quién lo pidió y si pasó por el crítico>
   2. Causa de los BLOQUEA: <una línea por causa>
   3. Deuda que heredan las PRs siguientes: <titulares; el detalle, en el registro>
   4. Pasada final de comentarios (§2.10 del skill): <`<sha>` con lo corregido, o `sin hallazgos`>

## Alcance

`<change>` · grupo N · tareas X.Y–X.Z · sin marcar: <tareas del grupo que quedan `- [ ]`, con el motivo, o `ninguna`> · base `{{git.ola}}<ola>`

## Evidencia — `<sha>`

### `verify` — worktree `<ruta>`

```
<resumen que arma `{{kit.da}} cuerpo-pr armar`: `enlaces del worktree: OK`, el resultado de cada paso ({{lista comandos.pasosVerify}}) y las líneas que captura cada `resumen`>
```
{{#si modulos.suite}}

### `{{modulos.suite.nombre}}`

<qué se probó: qué build y qué servicios, de dónde se sirvieron, y las variables confirmadas>

```
<la línea de resumen de la suite y todo fallo o inestable; los specs heredados en rojo, listados>
```
{{/si}}
{{#si hayVisual}}

### Capturas — <dispositivo y viewport>

| Escenario (`specs/<capability>/spec.md`) | Antes | Después |
|---|---|---|
| <nombre del escenario> | <permalink por SHA, o `—`> | <permalink por SHA> |
{{/si}}

### `{{rutas.openspec}}/`

`<sha>` — solo casillas: X.Y–X.Z de `tasks.md`.

### Mutación

```
<las líneas del implementador, literales: `archivo:test — falla con <mutante>: sí` o `sin garantía: <qué intentó>`>
```
````

**Cuando un bloque no aplica**, se deja el encabezado y se escribe la razón concreta debajo: `no aplica: la PR no toca nada fuera de {{frase rutas.sinCodigo}}` en `verify`{{#si modulos.suite}}; en `{{modulos.suite.nombre}}`, `no corrida: la PR no toca nada fuera de {{frase rutas.sinCodigo}} y .claude/` para el cuerpo inicial (§2.2.5 del skill: es la única razón válida ahí, y el crítico la juzga), y en un comentario de ronda, además, `no corrida: código de producto idéntico a <sha>` cuando esa ronda solo tocó comentarios, tests unitarios o documentos (§2.6){{/si}}{{#si hayVisual}}; `no aplica: un sonido no se ve` en `Capturas`{{/si}}. Un bloque `{{rutas.openspec}}/` con cambios más allá de casillas lleva, por commit, el texto viejo y el nuevo (§2.3.2).

### Para quién es cada bloque

| Bloque | Quién lo lee | Para qué |
|---|---|---|
| `Contexto` | Un humano, después | Por qué, qué tocó y qué costó, sin leer el diff ni los veredictos. Ningún agente lo necesita; por eso va sin opiniones del PM: no debe anclar al crítico |
| `Alcance` | Crítico; PM en sesión nueva | Cruzar cada `- [x]` del diff con las tareas (skill `desarrollo-autonomo-critico`, comprobación mecánica 2), y saber qué queda sin marcar a propósito |
| `verify` | Crítico; PM en sesión nueva | Contrastar el recuento con el diff (skill `desarrollo-autonomo-critico`, *Sobre el verify*) y que se probó el worktree, no código viejo. El SHA es el gate de §2.8 |
{{#si modulos.suite}}
| `{{modulos.suite.nombre}}` | Crítico | Juzgar qué se probó de verdad —17/17 contra el build equivocado no dice nada—; en una PR sin código, que la razón de no correrla sea la única que §2.2.5 admite; en un comentario de ronda, que «código de producto idéntico a `<sha>`» sea cierto (§2.6) |
{{/si}}
{{#si hayVisual}}
| `Capturas` | Crítico | «¿Muestra el comportamiento nuevo, o sería idéntica con el código anterior?» Necesita el escenario que cada una afirma y el par antes/después |
{{/si}}
| `{{rutas.openspec}}/` | Crítico | Comprobación mecánica 3: todo cambio fuera de casillas, declarado y por skill |
| `Mutación` | Crítico | Punto 1 de su skill: contrastar la mutación por test. Aquí caza los `sin garantía` y los mutantes que no muerden |

### Rondas: comentarios, no reescrituras

El hilo de la PR es el registro de sus rondas, en orden y sin editar:

1. El cuerpo: `Evidencia — <sha>` del primer commit.
2. El veredicto del crítico, pegado tal cual (§2.4).
3. El triage del PM, en el mismo comentario (§2.5).
4. Tras cada corrección, un comentario **`## Evidencia — <sha>`** con los mismos bloques de la plantilla, **solo los que cambiaron**: `verify` siempre;{{#si modulos.suite}} `{{modulos.suite.nombre}}` si la ronda tocó código de producto{{#si modulos.suite.soloComentarios}} —`diff-solo-comentarios` no salió 0, o cambió otro archivo de producto (§2.6)—{{/si}}, o si no, la razón (`no corrida: código de producto idéntico a <sha>`);{{/si}}{{#si hayVisual}} `Capturas` si se rehicieron;{{/si}} `{{rutas.openspec}}/` si se tocó; `Mutación` con las líneas nuevas.
5. El veredicto siguiente, tal cual.
6. Si hubo hallazgos NO BLOQUEA pendientes, la pasada final de §2.10: un comentario `## Evidencia — <sha>` del PM con `verify` y qué se corrigió — **sin** veredicto de crítico si la corrección fue trivial; **con** el veredicto corto del crítico, pegado tal cual, si no lo fue y el PM eligió esa salida (§2.10).

El gate de merge (§2.8) se lee del hilo: el último `Evidencia — <sha>` es el SHA de la rama{{#si hayVisual}} — o, si la punta lleva el commit de capturas de §2.3.3 (solo `{{rutas.capturas}}/{PR_num}/`, sin `verify` propio), la punta difiere de ese `<sha>` únicamente en eso{{/si}}.

### Cómo se comprueba — PR de grupo

Primero lo mecánico, con `{{kit.da}} cuerpo-pr lint`: encabezados exactos y en orden, ningún párrafo en la zona humana, `Alcance` de una línea, secciones de `Evidencia` no vacías y el SHA.

```
{{kit.da}} cuerpo-pr lint --plantilla A --sha $(git rev-parse HEAD) cuerpo.md        # antes de gh pr create
gh pr view <n> --json body --jq .body | {{kit.da}} cuerpo-pr lint --plantilla A --cierre   # antes de gh pr merge
```

Después, lo que es juicio y el script no ve:

1. ¿Alguna línea de `Contexto` lleva más de una idea?
2. ¿Las tareas de `Alcance` son exactamente las casillas volteadas en el commit de §2.2.1 (el mismo que corrió `verify`; las casillas van dentro, no en un commit de `{{rutas.openspec}}/` aparte)?
{{#si hayVisual}}
3. ¿Cada fila de `Capturas` apunta a un archivo que existe en `{{rutas.capturas}}/{PR_num}/`?
{{#sino}}
3. (Reservado para las capturas, que este proyecto no produce.)
{{/si}}
4. ¿Toda cifra de *Rondas de crítico* se cuenta en un veredicto pegado en el hilo?
5. Al mergear: ¿el último `Evidencia — <sha>` del hilo es el SHA de la rama{{#si hayVisual}}, o difiere de la punta solo por el commit de capturas de §2.3.3{{/si}}?
{{#si modulos.suite}}
6. Al mergear: ¿el `{{modulos.suite.nombre}}` de la `Evidencia` corresponde a un SHA cuyo código de producto es idéntico al del commit final, o se repitió porque no lo era (§2.8)?
{{#sino}}
6. (Reservado para la suite de sistema, que este proyecto no declara.)
{{/si}}

Un `no` se arregla antes de seguir. **El crítico no audita el cuerpo** (principio 3): esta lista es del PM.

---

## Plantilla B — PR de cierre de ola

Se escribe **una vez, al cerrar la ola** (§5). Su lector es el usuario, que decide el merge desde el cuerpo y no lee ninguna PR de grupo; ningún agente la lee. Por eso lleva **un bloque por grupo, siempre con la misma forma** —qué entregó, qué costó y qué tuvo de particular— y una *Deuda* escrita para quien no abrió ninguna PR. Si el usuario necesita más de un grupo, entra a su PR; el cuerpo de ola no la sustituye. Las issues absorbidas por la ola van enlazadas al final del cuerpo con líneas `Closes #N`, para que GitHub las cierre sola al mergear.

### Reglas de la plantilla B

1. **Todo lo que no es `Evidencia` es zona humana:** listas anidadas, una idea por línea, sin párrafos. La única tabla es la mini tabla de cada grupo, de exactamente una fila.
2. **Un bloque por PR mergeada, con el mismo esqueleto:** encabezado `Grupo N — #NNN — <una oración>`, *Entrega*, mini tabla, *Clases*, *Destacable*. *Destacable* se omite entera si el grupo fue trabajo sin novedades; nunca se rellena por rellenar.
3. **Las cifras salen de la tabla de devoluciones del registro** (`registro-de-ola.md`) y de los veredictos pegados en cada PR. No se cuenta nada nuevo a mano.
4. **Cada item de *Deuda* lleva tres líneas —qué, impacto hoy, si no se hace— y su PR**, en palabras de producto, para alguien que no leyó la PR. La deuda heredada no se repite aquí: vive en el registro.
5. **El registro no se vuelca: se enlaza desde `Evidencia`.** `verify` no se pega —lo enseña GitHub—{{#si modulos.suite}}; `{{modulos.suite.nombre}}` sí, porque no corre en CI: sobre qué SHA, con qué pila, y el resultado{{/si}}.
6. **La mecánica no se discute en la PR de ola.** Ni propuestas de cambio ni la métrica *Se coló*: viven en el registro y se tratan en conversaciones aparte. El PM que lleva una ola no se enfoca en la mecánica.

````markdown
## Estado

`{{git.ola}}<ola>` → `{{proyecto.ramaPrincipal}}` · N PRs internas mergeadas ·{{#si modulos.suite}} `{{modulos.suite.nombre}}` N/N sobre `<sha>` ·{{/si}} N de M casillas: <las que no, y de quién son> · **<lista para mergear | lista para mergear, si <condición> | no mergeable: razón>**

## Contexto

### Por qué

1. <de dónde viene la ola: el feedback, el PLAN, el change>
2. <qué changes, cuántos grupos y cuántas PRs>
   1. <un dato por línea>
3. <qué mecánica rigió, y de qué rama salió si no fue `{{proyecto.ramaPrincipal}}`>

### Grupo N — #NNN — <una oración: qué era el grupo>

- Entrega:
  - <qué ve {{usuarioFinal.el}}, una idea por línea>

| Mecánicas | Crítico |
|---|---|
| <N> | <N rondas + N pasadas finales tras LISTA> |

- Clases:
  - mecánicas:
    - `<clase>` <(nueva)>
  - crítico:
    - `<clase>` <×N>
- Destacable:
  - <solo si el grupo fue especialmente interesante o problemático; si no, se omite la viñeta entera>

### PM — fuera de los grupos

| Mecánicas | Crítico |
|---|---|
| — | — |

- Clases:
  - `prosa-pm` <×N>: <qué>
- Destacable:
  - <errores del PM que costaron corridas o rondas, o `—`>

## Deuda

1. **<título en palabras de producto>** (#NNN<, tarea X.Y sin marcar>).
   1. Qué: <qué se encontró o qué no se pudo hacer>
   2. Impacto hoy: <qué afecta ahora, o `ninguno`>
   3. Si no se hace: <qué pasa, o qué riesgo se corre>

## Fuera de alcance

1. <qué no entró, y por qué>

## Decisiones que confirmar o revertir

1. <decidí X>
   1. En vez de: <alternativa descartada>

## Evidencia — `<sha>`

{{#si modulos.suite}}
1. `{{modulos.suite.nombre}}`: corrida sobre `<sha>`, <pila y fixture>: **N/N** (<duración>). <O: no corrida, y por qué.>
{{#sino}}
1. `verify`: verde sobre `<sha>` en CI (enlace al run).
{{/si}}
2. Casillas: N de M (`openspec instructions apply`); sin marcar: <cuáles y por qué>.
3. Registro: `{{rutas.olas}}/<ola>.md` — <qué tiene: decisiones completas, tabla de devoluciones, deuda heredada, entorno vivo>.
````

### Cómo se comprueba — PR de ola

Primero lo mecánico, con el script: encabezados exactos y en orden, un bloque por grupo con su mini tabla de una fila y sus viñetas, `Estado` de una línea, cada item de `Deuda` con sus tres líneas y su PR, ningún párrafo fuera de `Evidencia`, y el SHA.

```
{{kit.da}} cuerpo-pr lint --plantilla B --sha $(git rev-parse HEAD) cuerpo.md
```

Después, lo que es juicio y el script no ve:

1. ¿Hay un bloque por PR mergeada, y ninguno de una PR que no lo esté?
2. ¿Alguna línea lleva más de una idea?
3. ¿Cada cifra de los bloques de grupo aparece en la tabla de devoluciones del registro?
4. ¿Cada item de *Deuda* se entiende sin abrir la PR?
{{#si modulos.suite}}
5. ¿`{{modulos.suite.nombre}}` corrió sobre el SHA de `Evidencia`?
{{#sino}}
5. ¿`verify` está verde en CI sobre el SHA de `Evidencia`?
{{/si}}
6. ¿La primera línea dice si esto es mergeable, y bajo qué condición?

Un `no` se arregla antes de abrir la PR. **El crítico no audita el cuerpo** (principio 3): esta lista es del PM.

---

## Plantilla C — PR de arreglo

Se escribe **una vez**, al abrir la única PR del carril de arreglo (`desarrollo-autonomo-pm` §0). Su lector es el usuario, que decide el merge desde el cuerpo; no hay crítico. `Contexto` cabe en {{limites.arreglo.lineasContexto}} líneas. Las líneas `Closes #N` van al final, como en la plantilla B.

````markdown
## Contexto

1. <la issue: qué pasaba, en una línea> (#N)
2. <qué cambió, en una línea, con el archivo>
3. <cómo se comprobó: el test que falla sin el cambio{{#si hayVisual}}, el par antes/después,{{/si}} o «verificación en vivo del usuario»>

## Alcance

#N · `<change>` · tareas 1.1–1.N · archivado en esta rama · base `{{proyecto.ramaPrincipal}}`

## Evidencia — `<sha>`

### CI

<enlace al run de `verify` sobre esta PR, o, si no corrió (`gh pr checks <n>` sin el check, o sin arrancar): `CI no corrió` con el resumen de `{{kit.da}} cuerpo-pr armar --sha <sha>` y su SHA>

### `{{rutas.openspec}}/`

`<sha>` — propose · casillas · sync · archive, por skill.
{{#si hayVisual}}

### Capturas

| Escenario | Antes | Después |
|---|---|---|
| <nombre> | <permalink por SHA, o `—`> | <permalink por SHA, o `no aplica: …`> |
{{/si}}

Closes #N
````

Comprobación: `{{kit.da}} cuerpo-pr lint --plantilla C --sha $(git rev-parse HEAD) cuerpo.md`; y a mano, ¿`Contexto` cabe en {{limites.arreglo.lineasContexto}} líneas y dice cómo se comprobó?

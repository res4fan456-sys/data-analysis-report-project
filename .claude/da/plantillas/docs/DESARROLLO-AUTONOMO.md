<!-- generado: {{kit.da}} render (kit desarrollo-autonomo {{kit.version}}); lo del proyecto va a {{rutas.olas}}/ -->
# Desarrollo autónomo por olas — el porqué

> **Estado: mecánica v4.1.4, instalada con el kit `desarrollo-autonomo` {{kit.version}}.** El procedimiento paso a paso está en los skills `.claude/skills/desarrollo-autonomo-<rol>/`, uno por rol; este documento dice **por qué** la mecánica es como es, qué enseñaron las olas que la probaron en su proyecto de origen, y qué no resuelve. La mecánica cambia solo entre olas, ensayada y medida (§10); lo que este proyecto aprenda se escribe en los registros de `{{rutas.olas}}/` y en las semillas de cada skill, no aquí.

---

## 1. El objetivo

El usuario no opera el desarrollo: **lo revisa una vez por ola**. Un **Team Manager** mantiene el desarrollo continuo: lanza al **Planeador** que prepara cada ola, a un **project manager** que la lleva con implementadores y críticos hasta una sola PR a `{{proyecto.ramaPrincipal}}`, y al **Archivador** que la cierra tras el merge. El usuario entra, por el Team Manager, en dos momentos: para decidir lo que solo él puede decidir (alcance, instalaciones, credenciales, `[PENDIENTE]`), y para revisar y mergear la PR de ola. El relevo del project manager cuando su contexto se llena lo hace el Team Manager, no el usuario. Un cambio pequeño no paga la ola: va por el **carril de arreglo** (§8).

## 2. Glosario

| Término | Qué es |
|---|---|
| **Fase** | Un tramo de `{{rutas.plan}}` con objetivo, entregable verificable y lo que queda fuera de alcance. Las fases son secuenciales en `{{proyecto.ramaPrincipal}}`; con avance continuo (petición expresa del usuario) se apilan sin esperar el merge |
| **Ola** | La unidad de entrega: {{limites.changesPorOla}} changes de OpenSpec como mucho, hasta {{limites.prsInternasPorOla}} PRs internas, una rama `{{git.ola}}<ola>` y una PR de cierre que revisa el usuario |
| **Carril** | El camino de un cambio: *ola* (completo) o *arreglo* (corto: ≤{{limites.arreglo.lineasDeProducto}} líneas de producto, un PM con un implementador, sin crítico ni registro) |
| **Grupo de tareas** | El subconjunto de `tasks.md` que entrega una PR interna (unas {{limites.lineasPorGrupo}} líneas de diff o menos) |
| **Encargo** | La orden de trabajo del PM a un implementador o a un crítico, con la plantilla de su skill y todos los huecos rellenos |
| **Brief** | El documento autocontenido con el que el Planeador entrega una ola al PM, o el Team Manager releva a un PM |
| **Registro** | `{{rutas.olas}}/<ola>.md`: el checkpoint de la ola, escrito en cuatro momentos, con el que un PM de relevo retoma |
| **Pre-vuelo** | La verificación que el Planeador hace de una ola antes de delegarla (changes contra el plan y el código) |
| **Devolución mecánica** | La que hace el PM antes de que el crítico vea nada (`verify` en rojo, una cita rota, un comentario falso); no cuenta como ronda |
| **Pasada** | Una revisión del crítico |
| **Ronda** | Una devolución al implementador por un hallazgo del crítico que **bloquea**; tope de {{limites.rondasDeCritico}} por PR |
| **Gate** (`verify`) | El criterio de aceptación de toda tarea: {{lista comandos.pasosVerify}}, en ese orden, hasta el primero que falle |
| **Checks ligeros** | Lo que un implementador corre dentro de su worktree mientras itera (`{{comandos.ligeros.test}}` y los de su área) |
| **Comando pesado** | Lo que solo corre el PM, uno a la vez en toda la máquina (el candado es por máquina y lo comparten todos los proyectos que corran en ella): {{lista comandos.pesadosTodos}} |
{{#si modulos.suite}}
| **Suite de sistema** | `{{modulos.suite.nombre}}`: la prueba de más alto nivel contra el sistema real; exclusiva por máquina |
{{/si}}
| **El usuario** | La persona que decide alcance y mergea a `{{proyecto.ramaPrincipal}}`. Distinto de **{{usuarioFinal.el}}**, para quien se construye el producto |
| **Severidades** | El crítico: `BLOQUEA` / `NO BLOQUEA` dentro de `LISTA` / `NO LISTA`. El Planeador: `BLOQUEA EL ARRANQUE` / `CORREGIR ANTES DE ENCARGAR` / `DEUDA`. Una issue lleva *Riesgo* y la etiqueta `{{etiquetas.impactoVisible}}`, que son prioridad, no severidad |

## 3. Principios

Ninguna optimización de velocidad puede romper uno de estos. Son la única lista; `CLAUDE.md` y los skills la citan por número.

1. **OpenSpec es la única autoridad sobre qué se hace.** Se entra por su skill, nunca a mano. Ninguna casilla se marca sin que un crítico la haya visto en el diff (en el carril de arreglo, sin crítico, la ve el usuario en la PR).
2. **Quien escribe no juzga.** Implementador y crítico son agentes distintos; el PM no parchea, devuelve. La evidencia visual la produce el implementador y la juzga el crítico; el PM nunca la verifica él mismo en el navegador.
3. **El crítico revisa código contra criterios, no papeleo.** Dos cosas bloquean: cada tarea cumple y tiene un test que puede fallar; ninguna regla innegociable rota ni trabajo fuera de alcance. Los comentarios y citas los revisa con el mismo rigor, en su propia sección del veredicto. No audita cuerpos, ni registro, ni al PM.
4. **Dos severidades.** Bloquea o no bloquea. Solo lo que bloquea genera ronda. **Un comentario o una cita falsos no bloquean por sí solos** —van a NO BLOQUEA, en su propia sección del veredicto—, salvo que hagan pasar por protegido un comportamiento que no lo está: eso sigue bloqueando, como hallazgo de clase test. Antes de mergear, el PM cierra todos los NO BLOQUEA acumulados —de comentarios y de código— en **una única pasada de corrección**: el PM la juzga solo, sin nueva pasada del crítico, **solo si la corrección es trivial**; si no, una pasada corta del mismo crítico, acotada a esa corrección, o una issue —nunca el PM solo ante código no trivial (`desarrollo-autonomo-pm` §2.10)—, y comprueba él mismo cada cita que quede.{{#si modulos.citas}} Lo que `{{kit.da}} citas` deja en rojo sí bloquea.{{/si}} Tope de {{limites.rondasDeCritico}} rondas de crítico por PR —las devoluciones mecánicas del PM no cuentan—; después **decide el PM**, pensando en el producto y el alcance de la ola, y lo deja escrito con la clase de cada ronda.
5. **El PM escribe lo mínimo.** Cuerpos de PR sin redactar (tareas, resumen de `verify` con su SHA, capturas, veredicto pegado tal cual), armados por `{{kit.da}} cuerpo-pr armar`; un registro de estados y decisiones, escrito en cuatro momentos (arranque, cada merge, handover, cierre), sin cifras contadas a mano.
6. **Toda afirmación se verifica contra su fuente**: un comentario que cita, un test que dice cubrir, una captura que dice probar, un `verify` que dice estar en verde.
7. **El comando pesado lo corre solo el PM, uno a la vez en toda la máquina.** El candado es por máquina, no por proyecto: si otro proyecto lo tiene, el segundo espera. Lo que es por proyecto es el PM: uno, lanzado por el Team Manager del proyecto. Y **la verificación de cada ronda es proporcional a lo que cambió**: `verify` en cada ronda{{#si modulos.suite}}; `{{modulos.suite.nombre}}` en la primera evidencia de la PR y, al mergear, solo si el código de producto cambió desde la última corrida. Una ronda que solo toca comentarios, tests unitarios o documentos no repite la suite{{/si}}.
8. **Nada se mergea en rojo**, ni siquiera a la rama de ola.
9. **Una ola cabe en el contexto del PM**: uno o dos changes, hasta {{limites.prsInternasPorOla}} PRs internas, cada grupo de unas {{limites.lineasPorGrupo}} líneas de diff o menos, y el PM **hace handover a las {{limites.relevoPrs}} PRs internas mergeadas o las {{limites.relevoTokensMiles}} mil de contexto**, lo que llegue primero, siempre en frontera de PR (nunca a mitad de ronda), dejando el registro al día; el Team Manager lo releva con otro PM, que retoma por el registro.
10. **La mecánica cambia entre olas**, en su propia PR, nunca a mitad de una. Y **se ensaya y se mide antes de adoptarse** (§10).
11. **El cuerpo de toda PR que abre el PM sigue su plantilla de `formato-de-pr.md`, literal.** Dos zonas: `Contexto`, para un humano; y la evidencia para los agentes, resumida y con su SHA. El cuerpo se escribe una vez: las rondas van a comentarios. El registro no se vuelca: se enlaza.
12. **Cero forks.** Toda delegación va por un agente lanzado **con nombre** y con el alias de modelo que le toca (`opus`, `sonnet`, `fable`, `haiku`); nadie sobrescribe el modelo de un agente con nombre salvo los casos declarados en §4. Los subagentes built-in heredan el modelo del padre: si un rol los lanza, indica el modelo.
13. **La lista `Agent(...)` de un agente no es garantía.** En el hilo principal es lista blanca; dentro de un subagente, la plataforma la ignora o la hereda según su versión. Por eso quién lanza a quién —el Team Manager solo al Planeador, al PM, al Archivador y al lector— lo garantiza el hook `.claude/da/guardia.cjs` (`PreToolUse` sobre `Agent`), no la lista de tools.
14. **Cada agente carga lo mínimo.** `CLAUDE.md` es corto porque lo carga cada agente en cada turno; lo que comparten varios roles se repite en cada skill, porque cada agente carga un solo skill. Las definiciones de agente precargan solo el skill del rol (y {{lista skills.precargados}} en el implementador); lo demás lo nombra el encargo y se invoca una vez.
15. **El código llega a `{{proyecto.ramaPrincipal}}` solo con el merge del usuario.** El Team Manager mergea las PRs de planeación y de archivado, y solo dentro de su dominio de rutas (`{{kit.da}} pr-dominio`); el PM, las internas contra `{{git.ola}}*`. Nadie más.

## 4. El equipo

Seis roles. El modelo se nombra por **alias**, y quien delega lo menciona al lanzar (principio 12).

| Rol | Modelo · esfuerzo | Lo lanza | Hace | No hace | Skill · agente |
|---|---|---|---|---|---|
| Team Manager | `{{roles.team-manager.modelo}}` · {{roles.team-manager.esfuerzo}} | El usuario (su sesión de Claude Code) | Mantiene el desarrollo continuo: lanza al Planeador, a un PM por ola o por arreglo y al Archivador; releva al PM tras su handover; decide lo técnico dentro del alcance aprobado; **mergea las PRs de planeación y de archivado** dentro de su dominio de rutas; único interlocutor del usuario{{#si modulos.avisos}}; le avisa fuera del chat por `{{modulos.avisos.herramienta}}`: lo que necesita de él (PR lista, decisión, bloqueo) y el avance (ola arrancada, PRs internas mergeadas, ola cerrada){{/si}}{{#si modulos.despliegue}}; lleva el despliegue de `{{proyecto.ramaPrincipal}}`{{/si}} | Código, encargar a implementadores o críticos, comando pesado, escribir en `{{git.ola}}*`, cambiar la rama del checkout principal, decidir alcance/instalaciones/credenciales/`[PENDIENTE]`, mergear código a `{{proyecto.ramaPrincipal}}` | `desarrollo-autonomo-team-manager` · `team-manager.md` |
| Planeador | `{{roles.planeador.modelo}}` · {{roles.planeador.esfuerzo}}{{#si roles.planeador.disparadoresArquitectura}} (`{{roles.planeador.modeloArquitectura}}` solo si la ola toca {{lista roles.planeador.disparadoresArquitectura}}; lo decide el TM al lanzarlo){{/si}} | Team Manager, o el usuario en sesión independiente | Pre-vuelo de una ola: verifica los changes contra el PLAN y el código, reporta, refina los artefactos por su skill, escribe el brief del PM, abre la PR de planeación acotada a su dominio de rutas | Código, encargos, lanzar PMs, tocar `{{git.ola}}*`, comando pesado | `desarrollo-autonomo-planeador` · `planeador.md` |
| Project manager | `{{roles.pm.modelo}}` · {{roles.pm.esfuerzo}}, uno a la vez por ola | Team Manager | Lleva un tramo de ola o un arreglo: OpenSpec, git, encargos, comando pesado, diff con mirada de integración, merges internos, registro, decisiones; handover a las {{limites.relevoPrs}} PRs internas mergeadas o el umbral, en frontera de PR | Código de producto, parchear, verificar visuales en el navegador, hablar con el usuario, mergear a `{{proyecto.ramaPrincipal}}` | `desarrollo-autonomo-pm` · `pm.md` |
| Implementador | `{{roles.implementador.modelo}}` · {{roles.implementador.esfuerzo}}, uno por grupo{{#si hayVariasAreas}} (una variante por área: {{lista variantes}}){{/si}} | Project manager | TDD acotado a su grupo; por test, la mutación y el comportamiento que protege;{{#si hayVisual}} capturas si toca UI;{{/si}} reporta por criterio | Git, `{{rutas.openspec}}/`, comando pesado, instalar, forks, salir de su grupo, comentarios nuevos sin un porqué que cite `docs/` u `{{rutas.openspec}}/specs/` | `desarrollo-autonomo-implementador` · `{{#cada areas como a}}{{a.agente}}.md{{#si no @ultimo}}, {{/si}}{{/cada}}` |
| Crítico | `{{roles.critico.modelo}}` · {{roles.critico.esfuerzo}}, una instancia por PR | Project manager | Revisa el código de la PR contra los criterios de su grupo; juzga el valor de cada test; veredicto LISTA / NO LISTA con hallazgos BLOQUEA / NO BLOQUEA y una sección propia de *Comentarios y citas*, en {{limites.lineasDeVeredicto}} líneas o menos | Código, git (salvo lectura), comando pesado, revisar al PM | `desarrollo-autonomo-critico` · `critico.md` |
| Archivador | `{{roles.archivador.modelo}}` (`{{roles.archivador.modeloConDelta}}` con delta specs) | Team Manager, tras el merge a `{{proyecto.ramaPrincipal}}` | Sincroniza specs, archiva los changes, cierra las issues absorbidas, abre su PR a `{{proyecto.ramaPrincipal}}` (la mergea el TM) | Código, comando pesado, mergear | `desarrollo-autonomo-archivador` · `archivador.md` |

Un `lector` (`{{roles.lector.modelo}}`, solo lectura) responde preguntas concretas con `archivo:línea` a quien no debe cargar su contexto leyendo código.

**Dónde está el usuario.** Habla siempre con el Team Manager.

| Momento | Qué |
|---|---|
| Planeación | Solo si hay una decisión de alcance (un criterio cambia, un change no cabe, un `[PENDIENTE]`), una contradicción entre el PLAN y el código que obliga a elegir, algo que el equipo no puede procurarse, o una planeación que pasa de {{limites.planeacionMaxHoras}} hora(s) sin brief. Lo demás lo decide el TM y queda en `{{rutas.olas}}/<ola>-revision.md` y en el brief. La PR de planeación la mergea el TM. |
| Arranque de la ola | Recibe un **aviso** (qué ola, qué changes, qué PRs vendrán). La lista única de arranque llega solo si contiene algo que él debe proveer: instalaciones, credenciales, scopes, dispositivos, `[PENDIENTE]`. |
| Durante la ola | Le llegan solo dos cosas, por el Team Manager: lo que el equipo no puede procurarse y un cambio de alcance. Puede dar sugerencias; entran como decisiones del registro. |
| Cierre de la ola | Revisa y mergea la PR `{{git.ola}}<ola>` → `{{proyecto.ramaPrincipal}}`; confirma o revierte en bloque las decisiones y la deuda del registro{{#si hayVisual}}; comprobaciones en dispositivo físico{{/si}}. La PR de archivado que sigue la mergea el TM. |
| Arreglo | Revisa y mergea su única PR a `{{proyecto.ramaPrincipal}}`; si el arreglo es visual, la verificación en vivo es suya. |

**Por qué un Team Manager.** Una ola larga encadena varios PMs, cada uno relevado cuando su contexto se llena; alguien tiene que lanzarlos, recibir sus handovers y resolver los escalados sin molestar al usuario. Una decisión técnica dentro del alcance no necesita al usuario: el Team Manager la toma y la deja escrita.

**Por qué un Planeador.** El pre-vuelo de una ola lo corre una sesión aparte antes de delegar. Nombrarlo lo separa del PM: el Planeador protege el entregable de la ola; el PM lo construye. Verifica changes contra el código, no diseña arquitectura de cero: por eso corre en `{{roles.planeador.modelo}}`{{#si roles.planeador.disparadoresArquitectura}} y sube a `{{roles.planeador.modeloArquitectura}}` solo en las olas que tocan la arquitectura{{/si}}.

**Por qué un Archivador.** Sincronizar specs y archivar los changes deja `{{proyecto.ramaPrincipal}}` en rojo cuando lo hace el mismo que cierra la ola: las specs pasan a describir código que todavía no llegó. Separarlo, con su propia PR validada por CI y **sin** correr el comando pesado en local, corta esa clase de fallo.

**Por qué el mismo crítico en las pasadas siguientes.** Una instancia nueva por pasada evita el anclaje, pero cuesta releer la PR entera cada vez y no atrapa nada que la primera pasada no hubiera visto. Un crítico que revisa su propia lista sabe exactamente qué buscar; el sesgo de anclaje se acepta a cambio.

**El límite, dicho desde el principio.** Crítico y PM son el mismo modelo con distinto prompt: separación de información, no de sesgo. El PM le fija parte del foco («dónde mirar con lupa»), declarado como mínimo y no como límite.

## 5. Lecciones que la mecánica recoge

Cada una nació de un incidente real en el proyecto de origen; aquí queda la lección y la regla que la recoge.

| | Lección | Regla |
|---|---|---|
| L0 | El `verify` verde puede ser falso: un worktree que toma prestadas dependencias del checkout principal prueba el código viejo | `{{kit.da}} worktree montar` comprueba que toda ruta resuelta caiga bajo el worktree antes del primer `verify`; `desarrollo-autonomo-pm/trampas-de-entorno.md` §Worktrees |
| L1 | La prosa segura de sí misma es el escondite: comentarios que citan documentos que dicen lo contrario, o procesos que no existen | El crítico abre cada cita; `CLAUDE.md` *Comentarios*{{#si modulos.citas}}; `{{kit.da}} citas` comprueba que cada identificador citado exista{{/si}} |
| L2 | La corrección puede reintroducir lo que corrige | Pasada sobre la corrección tras todo BLOQUEA |
| L3 | Un test de regresión puede no poder fallar | Mutación por test, binaria; «mutante equivalente» no es salida |
| L4 | La evidencia manual miente y el autor no lo ve | La produce el implementador, la juzga el crítico; par antes/después |
| L5 | Las herramientas de captura fabrican falsos positivos | `desarrollo-autonomo-implementador/trampas-de-capturas.md` |
| L6 | Una PR de solo evidencia necesita otras preguntas | Bloque de capturas en el skill `desarrollo-autonomo-critico` |
| L7 | Al PM también hay que revisarlo | **Retirada como mecanismo**: el PM produce lo mínimo y el usuario lo revisa en el cierre |
| L8 | Los cambios de `{{rutas.openspec}}/` deben ser auditables | Flips en el diff; lo demás por skill, en commit propio declarado |
| L9 | Un desacuerdo no se resuelve mergeando por cansancio | Tope de {{limites.rondasDeCritico}} rondas; después decide el PM y lo deja escrito como deuda o deja la PR fuera |
| L10 | Cambiar la mecánica a mitad de ola cuesta más que la ola | La mecánica cambia entre olas, en su propia PR, y no se barre nada: se cambia lo que cambia |
| L11 | Lo mecánico consumía el tope de rondas: `verify` en un paquete no comprobado, citas a fuentes inexistentes, frases vecinas sin barrer | Devolución mecánica del PM que no cuenta como ronda{{#si modulos.citas}}; `{{kit.da}} citas`{{/si}}; barrido del archivo entero al corregir; skill del PM §2.2 y §2.6 |
| L12 | Una decisión de diseño escrita sin verificar contra el código falla, y cuesta un grupo cuando el código la hace imposible | Diseño verificado antes de encargar; experimento como primera tarea; barrer los diseños activos cuando una regla cambia; skill del PM §1.3 |
| L13 | El encargo del PM produce defectos que nadie audita: paquetes «fuera de alcance» que dependen del cambio, criterios numerados que acaban citados | El alcance de comprobación es mayor que el de edición; la numeración del encargo no se cita; skill del PM §2.1 y regla 3 del skill `desarrollo-autonomo-implementador` |
| L14 | La evidencia visual aplazada «por alcanzabilidad» llega tarde y destapa lo que ya se mergeó | El fixture es el grupo 1; el PM mira cada captura; ante una duda visual, medir el DOM antes que retomar; skill del PM §1.1 y §2.2 |
| L15 | Un implementador que **para y reporta** ante un criterio imposible ahorra más que uno que lo rodea | Regla 13 del skill `desarrollo-autonomo-implementador` |
| L16 | El gasto es contexto × turnos: lo que cada agente carga al arrancar es la mitad de lo que lee en toda su vida | Principio 14; `CLAUDE.md` corto; precargas mínimas; encargos sin relecturas |
| L17 | La mitad de los BLOQUEA eran comentarios o citas, y cada uno costaba una ronda entera con el gate y la suite | Principios 4 y 7: comentarios NO BLOQUEA con excepción; pasada final única; verificación proporcional |
| L18 | Un cambio de una línea pagaba la ola entera: cuatro PRs, seis agentes, decenas de líneas de OpenSpec | Carril de arreglo (§8) |
| L19 | El usuario era el cuello de botella de tres merges por ola, dos de ellos sin código | Principio 15: el TM mergea planeación y archivado dentro de su dominio de rutas |

## 6. Cómo se mide

El registro de cada ola lleva *Se coló* (defectos encontrados tras el merge de una PR interna, atribuidos a la PR que debió atraparlos), *Deuda* y{{#si modulos.medicion}} `## Coste`, producido por `{{kit.da}} medir`, nunca a mano{{#sino}} las devoluciones por clase de cada PR{{/si}}. La regla de decisión la ejecuta el usuario al cerrar cada ola: si lo que se cuela crece dos olas seguidas, la mecánica se revisa; si un defecto colado llega a producción, se revisa de inmediato.

{{#si modulos.medicion}}
Se miden tres familias, con `{{kit.da}} medir`, y cada carril tiene su propia línea base: **métricas de mecánica**, que deben bajar sea cual sea la tarea (contexto de arranque por rol; caché leída del PM por PR interna; PRs y merges del usuario por ola; horas de espera al usuario; corridas del gate por PR; rondas por clase); **métricas de trabajo**, que dependen de la tarea y se normalizan por línea de diff; y **guardas**, que no pueden empeorar (*Se coló*, BLOQUEA de código que llegaron al crítico, suite en verde al cierre).
{{/si}}

## 7. Lo que no resuelve

- **El contexto del PM.** La ola se acota a {{limites.prsInternasPorOla}} PRs, y el project manager hace handover a las {{limites.relevoPrs}} PRs internas mergeadas o al umbral de {{limites.relevoTokensMiles}} mil tokens, siempre en frontera de PR; el registro es el checkpoint y el Team Manager releva (skill del PM §1b).
- **La deuda no se consolida.** Cada registro de ola lleva su *Deuda*, y los hallazgos van a issues de GitHub; el usuario decide en cada cierre qué pasa a un change propio.
- **Mismo modelo a ambos lados.** Un crítico de otra familia sería la mitigación real; no está disponible.
- **El orden real de TDD no es auditable** desde un commit único; el crítico lo infiere de la forma de los tests.
- **Olas solapadas.** Una ola **activa** a la vez por proyecto (una con su PR de ola abierta en espera de merge no cuenta: en avance continuo la siguiente se apila sobre ella); `git ls-remote --heads {{proyecto.remoto}} '{{git.ola}}*'` lo comprueba. Otras sesiones del mismo repo las coordina el Team Manager. Otro proyecto de la misma máquina tiene su propio Team Manager y su propio PM: no se coordinan entre sí ni se detienen al verse; lo único que comparten es el candado del comando pesado.
{{#si modulos.medicion}}
- **Medir exige la máquina de las olas.** `{{kit.da}} medir` lee las transcripciones locales de Claude Code: se corre donde corrieron los agentes.
{{/si}}

## 8. Los dos carriles y el flujo de una ola

**Arreglo.** Una issue con `{{etiquetas.carrilArreglo}}` ({{limites.arreglo.lineasDeProducto}} líneas de producto o menos, sin {{frase limites.arreglo.excluye}}); un PM que entra por `desarrollo-autonomo-pm` §0 con un implementador, sin Planeador, crítico ni registro; OpenSpec mínimo sincronizado y archivado en la misma rama; una sola PR a `{{proyecto.ramaPrincipal}}` que mergea el usuario.

**Ola.** Tres PRs a `{{proyecto.ramaPrincipal}}` y el usuario mergea una:

1. **Planeación** (Planeador): valida los changes contra el plan y el código, los parte en ≤{{limites.prsInternasPorOla}} PRs internas, escribe `{{rutas.olas}}/<ola>-revision.md` y `<ola>-brief.md`, abre la PR de planeación. La mergea el Team Manager con `{{kit.da}} pr-dominio`.
2. **Arranque** (PM): `{{kit.da}} preflight`, `verify` en `{{proyecto.ramaPrincipal}}`, diseño verificado contra el código, una sola lista al Team Manager; rama `{{git.ola}}<ola>`, worktree, registro.
3. **Bucle por grupo** (PM, implementador, crítico): encargo → implementación en su worktree → revisión propia del PM sobre el árbol sin commitear → commit con las casillas volteadas y `verify` → PR interna → crítico → triage → ≤{{limites.rondasDeCritico}} rondas → pasada final de comentarios → squash a `{{git.ola}}<ola>` y línea en el registro.
4. **Handover** (PM → Team Manager → PM de relevo): a las {{limites.relevoPrs}} PRs mergeadas o al umbral de contexto, siempre en frontera de PR, por la sección *Handover* del registro.
5. **Cierre** (PM): `verify`{{#si modulos.suite}} y `{{modulos.suite.nombre}}`{{/si}} sobre `{{git.ola}}<ola>`{{#si modulos.medicion}}, `## Coste` con `{{kit.da}} medir`{{/si}}, PR de ola con la plantilla B. **La mergea el usuario.**
6. **Archivado** (Archivador): sincroniza specs si hay delta, archiva los changes, cierra las issues absorbidas; su PR la mergea el Team Manager.

## 9. Módulos

Un módulo apagado nunca relaja una regla; la alternativa va siempre hacia lo estricto.

| Módulo | Estado aquí | Si está apagado |
|---|---|---|
| graft (orientación en el código por grafo) | {{#si modulos.graft}}activo{{#sino}}apagado{{/si}} | Los agentes leen el código; nadie reconstruye índices en una ola |
| citas (lint de citas y comentarios) | {{#si modulos.citas}}activo{{#sino}}apagado{{/si}} | El crítico abre cada cita y bloquea lo que el lint habría bloqueado |
| medición (`{{kit.da}} medir`) | {{#si modulos.medicion}}activo{{#sino}}apagado{{/si}} | El registro cuenta a mano las devoluciones por clase; sin `## Coste` |
| suite de sistema | {{#si modulos.suite}}activa (`{{modulos.suite.nombre}}`){{#sino}}apagada{{/si}} | Ninguna ronda es «solo comentarios»: toda verificación es completa |
| evidencia visual | {{#si hayVisual}}activa ({{#cada areasVisuales como a}}{{a.nombre}}{{#si no @ultimo}}, {{/si}}{{/cada}}){{#sino}}apagada{{/si}} | Un arreglo visual lo verifica en vivo el usuario |
| despliegue | {{#si modulos.despliegue}}activo{{#sino}}apagado{{/si}} | Nadie despliega |

## 10. Cómo cambia la mecánica

Entre olas, en su propia PR, nunca a mitad de una (principio 10). Un cambio de mecánica se **ensaya** en una rama antes de entrar a `{{proyecto.ramaPrincipal}}`: la sesión del Team Manager corre desde un worktree en esa rama mientras las ramas `{{git.ola}}*` y `{{git.arreglo}}*` siguen naciendo de `{{proyecto.ramaPrincipal}}`; la muestra es una ola del backlog y un arreglo; el criterio de entrada se fija **antes** sobre las métricas del §6 y lo juzga el usuario con las tablas delante. Si no se cumple, la rama se borra.

Lo que un proyecto aprende de su propio stack —trampas de entorno, trampas de captura, casos del pre-vuelo— va a las semillas de cada skill, que son del proyecto y el kit nunca pisa. Lo que corrige la mecánica misma vuelve al kit, para todos.

## Apéndice. Evidencia de origen

La mecánica nació en un monorepo TypeScript (un juego de cartas online) y se midió allí; las cifras son de ese proyecto y no se extrapolan, pero marcan la línea base que un proyecto nuevo debe igualar:

| Versión | Qué cambió | Qué midió |
|---|---|---|
| v1 | Cuatro roles, crítico nuevo por pasada, «todo lo del PM pasa por crítico» | La ola de origen: 4 changes, 6 PRs, 10 pasadas, ninguna aprobada a la primera |
| v2 | Tres roles, dos severidades, mismo crítico, ≤6 PRs: **quitar en vez de añadir** | La ola anterior gastó 8 PRs, 22 pasadas y 20 rondas; 34 de 55 hallazgos serios eran papeleo del PM, 3–4 de código |
| v3 | Pre-vuelo del PM que no cuenta como ronda, diseño verificado antes de encargar, evidencia en el grupo 1, lint de citas, montaje de worktrees, ≤5 PRs | El tope se agotaba en 3 de 4 grupos con rondas mecánicas; el PM llegó al 61 % de contexto con un grupo pendiente |
| v3.1 | Plantillas literales de PR | Cuerpos «muy grandes y desordenados» |
| v4 | Team Manager, Planeador y Archivador nombrados; un skill por rol; issues de GitHub | Seis PMs en fila en una ola; archivar dejó la rama principal en rojo tres veces |
| v4.1 | Dos carriles, tres PRs por ola y un merge del usuario, contexto a la mitad, comentarios NO BLOQUEA, verificación proporcional | 96,7 % del gasto era caché leída; 79 % del tiempo de una PR era posterior a la primera pasada; la mitad de los BLOQUEA eran comentarios. Ensayo: ola abierta → cierre 1 h 37 (antes 5 h 19 y 8 h 36), 0 rondas, 1 merge del usuario, caché leída 92 M (antes 253 M y ≈1 354 M) |
| v4.1.1 | Método del Archivador: worktree dentro del repo, `{{rutas.openspec}}/` solo por sus dos skills, parar ante el filtro de permisos, retirar el worktree tras el merge | Archivadores que improvisaban: uno escribió una spec con `cat >>` desde `/tmp` y el filtro lo bloqueó |
| v4.1.2 | Un PM por proyecto, no por máquina: un Team Manager por proyecto, cada uno con su PM; solo el comando pesado es exclusivo por máquina, con un candado compartido que espera | Un segundo Team Manager, en otro proyecto de la misma máquina, se detuvo al ver al primero |
| v4.1.3 | Avisos al usuario fuera del chat (un MCP de mensajería, p. ej. Telegram): solo el Team Manager, solo en las fronteras del usuario —PR lista para su merge, escalado, bloqueo, cierre de ola—; módulo `avisos` del perfil, apagado por defecto; la lista `tools` de cada agente es el raíl (solo el Team Manager la tiene) | El usuario no mira la terminal mientras la ola corre: cada frontera esperaba a que volviera por su cuenta |
| v4.1.4 | **Avance continuo a petición expresa del usuario**: las olas y las fases se apilan sobre la PR de la anterior sin esperar su merge; nada entra en la rama principal sin él, y una decisión suya, una instalación o un rojo sin arreglo detienen igual. Los avisos ganan la clase **avance** (ola arrancada, PRs internas mergeadas, ola o fase cerrada) junto a lo que necesita al usuario. `verify` corre `citas` cuando el módulo está activo | Un Team Manager se negó a seguir con la fase siguiente por «las fases son secuenciales» con el usuario pidiéndolo; los avisos solo de frontera dejaban al usuario sin saber cómo iba la ola; el lint de citas salía en rojo en un proyecto recién instalado por textos del propio kit |
| Fase autónoma | 10 olas, 43 PRs internas, 21 PMs en 33,8 h | 89 % del reloj con un PM activo, ~8 % esperando al usuario, 26 BLOQUEA y 0 defectos colados |

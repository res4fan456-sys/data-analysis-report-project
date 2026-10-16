## 1b. Retomar una ola — un PM en sesión nueva

1. `git ls-remote --heads {{proyecto.remoto}} '{{git.ola}}*'`; monta un worktree del PM sobre la rama viva con `{{kit.da}} worktree montar <ruta> --rama {{git.ola}}<ola>`. **No cambies la rama del checkout principal**, que otra sesión comparte para leer.
2. Leer `{{rutas.olas}}/<ola>.md`. Es el checkpoint: estado por PR, decisiones, deuda, entorno vivo.
3. `gh pr list --base {{git.ola}}<ola> --state all`. Por cada PR abierta, su cuerpo (`formato-de-pr.md`, plantilla A) y sus comentarios: el último veredicto del crítico está pegado ahí, y el último `## Evidencia — <sha>` dice sobre qué commit hay `verify`. Si el registro y las PRs discrepan, mandan las PRs.
4. `openspec status --change <c> --json` de cada change.
5. `{{kit.da}} worktree listar`{{#si comandos.entorno.estado}}, `{{comandos.entorno.estado}}`{{/si}}{{#si comandos.entorno.puertos}}, y los puertos: Linux `ss -ltn | grep -E ':({{comandos.entorno.puertosRegex}}) '`, macOS `lsof -nP -iTCP -sTCP:LISTEN | grep -E ':({{comandos.entorno.puertosRegex}}) '`{{/si}}. Apagar lo que no tenga PR abierta.
6. Seguir por §2 en el primer grupo pendiente.

## 6. Handover — a las {{limites.relevoPrs}} PRs internas mergeadas o el umbral de contexto

El registro se actualiza tras cada merge y cada decisión, así que **la ola es reanudable en cualquier momento**. Cuando el PM llegue a **{{limites.relevoPrs}} PRs internas mergeadas** —la de cierre no cuenta— **o al umbral de contexto** —o el Team Manager se lo pida—: termina la PR en curso hasta su merge o la aparca fuera de la ola (§2.7) —**nunca hace handover a mitad de ronda**: un relevo a mitad de ronda pierde lo que está en vuelo, el SHA de un `verify`, un reporte de mutación, una corrida de la suite—, escribe *Handover* en el registro (`registro-de-ola.md`), lo deja pusheado, y devuelve el control al Team Manager, que lanza otro PM. El PM nuevo entra por §1b. Sin tope de relevos: una ola grande se lleva en varias instancias.

# Trampas de entorno conocidas

<!-- Semilla del kit: este archivo es del proyecto. Cada trampa costó tiempo real o produjo un falso positivo en algún proyecto; añade las tuyas cuando aparezcan y borra las que no apliquen. Los encabezados §Worktrees, §Comando pesado, §OpenSpec, §Citas y §gh los citan los skills: no los renombres. -->

Cada una costó tiempo real o produjo un falso positivo. Todo comando de este archivo **funciona igual en macOS y en Linux, lleva las dos variantes, o dice dónde está por comprobar**. **El PM las lee antes de montar un worktree o levantar el entorno.** Se añaden cuando aparecen.

## Worktrees — y el `verify` que miente (L0)

- **Un worktree que toma prestadas las dependencias del checkout principal produce un `verify` verde falso.** Un enlace relativo o un directorio compartido hacen que el worktree pruebe el código **del repo principal**, sin el cambio, y el gate sale verde sobre lo que no se tocó. La comprobación es resolver rutas reales, no mirar el texto de un enlace: `.claude/da/da worktree montar` corre el gancho `comprobar` del perfil y exige que **toda** ruta resuelta caiga bajo `<worktree>/`; si el worktree lo montó otra sesión, repite la comprobación antes del primer `verify`.
  - **El montaje correcto lo hace el gancho `preparar` del perfil** (`.claude/desarrollo-autonomo.json`, `worktree.preparar`): dependencias propias del worktree, nunca un enlace al directorio del principal. Lo que el gancho no resuelva se escribe aquí.
- **`gh pr merge --delete-branch` no borra la rama local** si un worktree la tiene checked out. La remota sí. Limpia con `.claude/da/da worktree quitar <ruta>`.
- **Tras rebasar sobre la rama de ola, `verify` de nuevo.** La base cambió.
- **Nunca desprendas el checkout principal**: es la raíz de la sesión del Team Manager, no un worktree desechable. Todo lo que necesite otra rama va en un worktree.

## Comando pesado y procesos largos

- **El entorno lo levanta el PM**, como comando pesado. En reposo no cuenta como comando pesado; una corrida de la suite contra él, sí.
- **Un comando largo se lanza con la salida a un archivo, nunca a un pipe**: un `tail` no suelta nada hasta el final y el log queda vacío si el proceso muere. Si el harness corta el comando por su tope de tiempo, se lanza desacoplado —Linux `setsid nohup … > log 2>&1 < /dev/null & disown`, macOS `nohup … > log 2>&1 < /dev/null & disown`— y se espera sobre el log.
- **La suite de sistema es exclusiva por máquina**: una sola pila a la vez. Antes de levantarla desde un worktree, para cualquier otra que retenga sus puertos.
- **`graft build` corre sobre el repo principal**, no desde un worktree (`graft/` vive en la raíz).

## OpenSpec

- **El CLI de `openspec` no tiene `--cwd`**, y la guardia que bloquea `cd` lo atrapa igual: usa `.claude/da/da en <worktree> -- openspec …` para operar sobre un worktree sin moverte de la raíz.

## Citas y formato

- **`.claude/da/da citas` con rutas absolutas del worktree, invocado desde la raíz de la sesión, da falsos rojos**: busca los identificadores citados en el checkout principal, que no tiene el cambio del worktree, en vez de en el worktree mismo. Siempre `.claude/da/da en <wt> -- .claude/da/da citas <rutas relativas al worktree>`.
- **Un check de formato con una ruta absoluta puede dar un falso verde; la misma ruta, relativa al worktree, lo marca.** La forma segura es correr el check dentro del worktree (`.claude/da/da en <wt> -- <check>`), sin rutas sueltas.

## `gh` y GitHub

- **Publicar un workflow necesita el scope `workflow`.** El push falla con `refusing to allow an OAuth App to create or update workflow`. Se comprueba en el arranque con `gh auth status`, no a mitad.

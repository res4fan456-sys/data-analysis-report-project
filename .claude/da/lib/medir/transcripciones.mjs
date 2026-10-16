// Agregación de uso de tokens de las transcripciones de Claude Code: de
// líneas `type: "assistant"` ya extraídas de un `.jsonl` a turnos únicos (un
// `message.id` puede repetirse en varias líneas, una por bloque de
// contenido de la respuesta) y de ahí a un agregado por rol (`agentType` del
// `.meta.json` de un subagente, o `principal` para la sesión raíz). Sin I/O:
// leer los `.jsonl` y sus `.meta.json` es la cáscara, `comandos/medir.mjs`.

/**
 * Colapsa las líneas `assistant` de UN transcript por `message.id`: un mismo
 * id aparece en varias líneas (una por bloque de contenido de la
 * respuesta), y cada campo de `usage` se queda con el máximo visto entre
 * ellas -- nunca la suma, que contaría el mismo turno varias veces. El
 * `timestamp` del turno es el de la ÚLTIMA línea de ese id (la línea final
 * de la respuesta, cuando ya se conoce el uso completo).
 * @param {Array<{messageId: string, modelo: string, uso: object, timestamp: string}>} lineas
 */
export function maximoPorMensaje(lineas) {
  const porId = new Map();
  for (const linea of lineas) {
    const existente = porId.get(linea.messageId);
    if (!existente) {
      porId.set(linea.messageId, { messageId: linea.messageId, modelo: linea.modelo, uso: { ...linea.uso }, timestamp: linea.timestamp });
      continue;
    }
    existente.uso = {
      input_tokens: Math.max(existente.uso.input_tokens, linea.uso.input_tokens),
      output_tokens: Math.max(existente.uso.output_tokens, linea.uso.output_tokens),
      cache_creation_input_tokens: Math.max(existente.uso.cache_creation_input_tokens, linea.uso.cache_creation_input_tokens),
      cache_read_input_tokens: Math.max(existente.uso.cache_read_input_tokens, linea.uso.cache_read_input_tokens),
    };
    existente.timestamp = linea.timestamp;
  }
  return [...porId.values()];
}

/** El contexto de un turno: `input` + `cache_read` + `cache_creation` -- nunca `output`, que no es contexto de entrada. */
export function contextoDeTurno(turno) {
  return turno.uso.input_tokens + turno.uso.cache_read_input_tokens + turno.uso.cache_creation_input_tokens;
}

/** Los turnos de `turnos` cuyo `timestamp` cae dentro de `[desde, hasta]` (cualquiera de los dos, opcional). */
export function filtrarPorVentana(turnos, desde, hasta) {
  return turnos.filter((turno) => {
    if (desde !== undefined && turno.timestamp < desde) return false;
    if (hasta !== undefined && turno.timestamp > hasta) return false;
    return true;
  });
}

/**
 * Reduce una sesión cruda (`{rol, turnos}` sin recortar) a la sesión que
 * `agregarPorRol` necesita: `ctx0` sale del primer turno SIN recortar
 * -- antes de aplicar la ventana --, y `turnos` sale de recortar esos
 * mismos turnos a `[desde, hasta]` (`filtrarPorVentana`). Separada de la
 * cáscara para poder probar, sin tocar el disco, que el recorte por ventana
 * nunca contamina `ctx0`: una sesión cuyo trabajo empieza antes de la
 * ventana (el Planeador, casi siempre) debe medir su arranque en frío real,
 * no el primer turno que sobrevive al recorte, ya a mitad de conversación.
 */
export function recortarSesion(sesionCruda, desde, hasta) {
  const primerTurno = sesionCruda.turnos[0];
  return {
    rol: sesionCruda.rol,
    turnos: filtrarPorVentana(sesionCruda.turnos, desde, hasta),
    ctx0: primerTurno !== undefined ? contextoDeTurno(primerTurno) : undefined,
  };
}

const USO_VACIO = { input_tokens: 0, output_tokens: 0, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 };

function sumarUso(a, b) {
  return {
    input_tokens: a.input_tokens + b.input_tokens,
    output_tokens: a.output_tokens + b.output_tokens,
    cache_creation_input_tokens: a.cache_creation_input_tokens + b.cache_creation_input_tokens,
    cache_read_input_tokens: a.cache_read_input_tokens + b.cache_read_input_tokens,
  };
}

/**
 * Agrupa sesiones por rol (`sesion.rol`) y agrega, por rol: cuántas
 * sesiones y turnos tuvo, la suma de sus tokens, el ctx0 (el campo `ctx0`
 * de cada sesión -- el primer turno SIN recortar por ventana --,
 * promediado entre las sesiones del rol; nunca `turnos[0]`, que puede
 * llegar ya recortado), el contexto máximo visto en cualquier turno, y la
 * ventana de tiempo (primer a último timestamp) que cubrió.
 */
export function agregarPorRol(sesiones) {
  const porRol = new Map();
  for (const sesion of sesiones) {
    const lista = porRol.get(sesion.rol) ?? [];
    lista.push(sesion);
    porRol.set(sesion.rol, lista);
  }

  const resultado = [];
  for (const [rol, sesionesDelRol] of porRol) {
    const todosLosTurnos = sesionesDelRol.flatMap((sesion) => sesion.turnos);
    const tokens = todosLosTurnos.reduce((acumulado, turno) => sumarUso(acumulado, turno.uso), { ...USO_VACIO });

    const ctx0PorSesion = sesionesDelRol.map((sesion) => sesion.ctx0).filter((ctx0) => ctx0 !== undefined);
    const ctx0Promedio = ctx0PorSesion.length > 0 ? ctx0PorSesion.reduce((suma, valor) => suma + valor, 0) / ctx0PorSesion.length : 0;

    const contextoMaximo = todosLosTurnos.length > 0 ? Math.max(...todosLosTurnos.map(contextoDeTurno)) : 0;

    const timestamps = todosLosTurnos.map((turno) => turno.timestamp).sort();

    resultado.push({
      rol,
      sesiones: sesionesDelRol.length,
      turnos: todosLosTurnos.length,
      tokens,
      ctx0Promedio,
      contextoMaximo,
      desdeIso: timestamps[0],
      hastaIso: timestamps.at(-1),
    });
  }

  return resultado.sort((a, b) => a.rol.localeCompare(b.rol));
}

// ---------------------------------------------------------------------------
// Caché leída: con datos reales, domina el total de tokens por rol sin medir
// trabajo hecho -- solo cuánto contexto se releyó. `input_tokens`/
// `output_tokens` tampoco sirven de señal de trabajo: todos los bloques de
// contenido de un mismo `message.id` (`thinking`, `tool_use`, `text`...)
// comparten el mismo `output_tokens` en `message.usage`, el valor que había
// al EMPEZAR ese mensaje, no lo que costó cada bloque ni el tamaño final de
// la respuesta -- así que ni el máximo por mensaje (`maximoPorMensaje`) lo
// corrige. La tabla Mecánica publica ctx0, caché escrita y caché leída por
// rol; nunca una cifra de "tokens de trabajo".
// ---------------------------------------------------------------------------

/** `cache_read_input_tokens`, sumado sobre varios turnos -- la atribución de caché leída de un rol a una PR concreta. */
export function sumaCacheLeida(turnos) {
  return turnos.reduce((suma, turno) => suma + turno.uso.cache_read_input_tokens, 0);
}

/** El agregado de un rol, reducido a su fila de la tabla Mecánica: ctx0 y caché (escrita/leída) por separado. */
export function filaMecanicaDeAgregado(agregado) {
  return {
    rol: agregado.rol,
    ctx0: agregado.ctx0Promedio,
    cacheEscrita: agregado.tokens.cache_creation_input_tokens,
    cacheLeida: agregado.tokens.cache_read_input_tokens,
  };
}

// ---------------------------------------------------------------------------
// Qué sesión trabajó una PR -- la abrió o creó/empujó su rama -- y sus
// descendientes: solo esas cuentan hacia el coste de un rol (evita sumar
// sesiones paralelas que compartían la ventana de tiempo sin tocar el
// trabajo medido).
// ---------------------------------------------------------------------------

function textoDeContenido(content) {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content.map((bloque) => (bloque.type === 'text' ? (bloque.text ?? '') : '')).join('\n');
  }
  return '';
}

/**
 * Si alguna línea de `lineas` es un `tool_use` de Bash cuyo comando contiene
 * `gh pr create`, Y el `tool_result` de ESE MISMO `tool_use_id` trae la URL
 * que `gh pr create` imprime al crear (`/pull/<numeroDePr>`). No basta con
 * que el transcript MENCIONE esa URL en otro sitio -- un `grep`, un `gh pr
 * view` -- porque eso no significa que esta sesión la haya abierto.
 */
export function abrioLaPr(lineas, numeroDePr) {
  const idsDeCreacion = new Set();
  for (const linea of lineas) {
    if (linea.type !== 'assistant') continue;
    for (const bloque of linea.message?.content ?? []) {
      if (bloque.type === 'tool_use' && bloque.name === 'Bash' && typeof bloque.id === 'string' && typeof bloque.input?.command === 'string' && bloque.input.command.includes('gh pr create')) {
        idsDeCreacion.add(bloque.id);
      }
    }
  }
  if (idsDeCreacion.size === 0) return false;

  // Sin el `(?!\d)`, `/pull/45` casaría dentro de `/pull/455` -- el número
  // de PR es un límite exacto, no un prefijo.
  const marcador = new RegExp(`/pull/${numeroDePr}(?!\\d)`);
  for (const linea of lineas) {
    if (linea.type !== 'user') continue;
    for (const bloque of linea.message?.content ?? []) {
      if (bloque.type === 'tool_result' && typeof bloque.tool_use_id === 'string' && idsDeCreacion.has(bloque.tool_use_id) && marcador.test(textoDeContenido(bloque.content))) {
        return true;
      }
    }
  }
  return false;
}

/** Los tokens de un tramo de comando, separado por espacios (aproximado: no es un parser de shell completo). */
function tokenizarTramo(tramo) {
  return tramo.trim().split(/\s+/).filter(Boolean);
}

/**
 * El subcomando de `git` en `tokens` (`tokens[0] === 'git'`), saltando las
 * flags globales que se anteponen (`-C <ruta>`, `-c <k=v>`, y cualquier
 * flag de un solo token) -- el PM lanza sus `git` con `-C $R`, y sin este
 * salto `branch`/`push`/etc. nunca aparecerían en la posición esperada.
 * Devuelve el índice del subcomando, o `-1` si `tokens` no empieza con `git`.
 */
function indiceDelSubcomandoGit(tokens) {
  if (tokens[0] !== 'git') return -1;
  let i = 1;
  while (i < tokens.length) {
    const token = tokens[i];
    if (token === '-C' || token === '-c' || token === '--git-dir' || token === '--work-tree') {
      i += 2;
      continue;
    }
    if (token?.startsWith('-')) {
      i += 1;
      continue;
    }
    return i;
  }
  return -1;
}

// `git branch` con cualquiera de estas flags borra o renombra, nunca crea --
// una limpieza de la rama tras el merge (`git branch -d <head>`) no debe
// contar como que esa raíz "trabajó" la PR.
const FLAGS_DE_BORRADO_O_RENOMBRE_DE_BRANCH = new Set(['-d', '-D', '--delete', '-m', '-M', '--move']);
// `git push` con cualquiera de estas flags borra la rama remota, no la crea
// ni la empuja.
const FLAGS_DE_BORRADO_DE_PUSH = new Set(['-d', '--delete']);

/** El primer token de `resto` que no es una flag (no empieza por `-`), o `undefined` si no hay ninguno. */
function primerPositional(resto) {
  return resto.find((token) => !token.startsWith('-'));
}

/**
 * Si algún token de `resto` es un refspec `<origen>:<destino>` cuyo
 * `<destino>` es `head`, con `<origen>` NO vacío -- un refspec con origen
 * vacío (`:<head>`) es el borrado remoto de `head`, no su creación ni su
 * empuje, y ya lo trata aparte `FLAGS_DE_BORRADO_DE_PUSH`.
 */
function algunRefspecEmpujaLaRama(resto, head) {
  return resto.some((token) => {
    const indice = token.indexOf(':');
    if (indice === -1) return false;
    return token.slice(0, indice) !== '' && token.slice(indice + 1) === head;
  });
}

/**
 * Si `tramo` es un comando `git` que crea o empuja la rama `head`: `git
 * branch <head>` (el PRIMER positional tras las flags -- un segundo
 * positional es el punto de partida, no la rama creada; y nunca con
 * `-d`/`-D`/`--delete`/`-m`/`-M`/`--move`), `git checkout ... -b|-B <head>`,
 * `git switch ... -c|-C|--create <head>`, `git worktree add -b <head> ...`
 * (SIN `-b` no crea, solo adjunta un worktree a una rama que ya existe) o
 * `git push ... <head>` / `git push ... <origen>:<head>` (sin
 * `-d`/`--delete`, y sin que `<origen>` quede vacío -- `:<head>` a secas
 * sigue siendo un borrado). `<head>` se compara como TOKEN exacto (elemento
 * del array, o lado de un refspec, nunca substring): un prefijo compartido
 * (`feature/x` dentro de `feature/x-2`) nunca casa.
 *
 * No reconoce la rama pasada por variable de shell (`git branch $RAMA`) ni
 * un `git` prefijado por `env`, una asignación (`VAR=x git ...`) o
 * `timeout`: el primer token del tramo tiene que ser literalmente `git`.
 */
function tramoCreaOEmpujaLaRama(tramo, head) {
  const tokens = tokenizarTramo(tramo);
  const indice = indiceDelSubcomandoGit(tokens);
  if (indice === -1) return false;
  const sub = tokens[indice];
  const resto = tokens.slice(indice + 1);

  if (sub === 'branch') {
    if (resto.some((token) => FLAGS_DE_BORRADO_O_RENOMBRE_DE_BRANCH.has(token))) return false;
    return primerPositional(resto) === head;
  }
  if (sub === 'checkout') {
    const indiceDeCreacion = resto.findIndex((token) => token === '-b' || token === '-B');
    return indiceDeCreacion !== -1 && resto[indiceDeCreacion + 1] === head;
  }
  if (sub === 'switch') {
    const indiceDeCreacion = resto.findIndex((token) => token === '-c' || token === '-C' || token === '--create');
    return indiceDeCreacion !== -1 && resto[indiceDeCreacion + 1] === head;
  }
  if (sub === 'push') {
    if (resto.some((token) => FLAGS_DE_BORRADO_DE_PUSH.has(token))) return false;
    return resto.includes(head) || algunRefspecEmpujaLaRama(resto, head);
  }
  if (sub === 'worktree' && tokens[indice + 1] === 'add') {
    const indiceDeB = tokens.indexOf('-b', indice + 2);
    return indiceDeB !== -1 && tokens[indiceDeB + 1] === head;
  }
  return false;
}

/**
 * Si algún `tool_use` de Bash en `lineas` corrió un comando que crea o
 * empuja la rama `head` (`tramoCreaOEmpujaLaRama`, tramo a tramo -- un
 * comando compuesto con `&&`/`;` casa si CUALQUIERA de sus tramos lo hace).
 * Cubre al PM que arrancó una PR (creó o empujó su rama) pero fue relevado
 * antes de abrirla: sin este chequeo, `abrioLaPr` deja fuera su trabajo
 * -- y el de sus descendientes -- por completo.
 */
export function creoOEmpujoLaRama(lineas, head) {
  for (const linea of lineas) {
    if (linea.type !== 'assistant') continue;
    for (const bloque of linea.message?.content ?? []) {
      if (bloque.type !== 'tool_use' || bloque.name !== 'Bash') continue;
      const comando = bloque.input?.command;
      if (typeof comando !== 'string') continue;
      for (const tramo of comando.split(/&&|\|\||[;&|\n]/)) {
        if (tramoCreaOEmpujaLaRama(tramo, head)) return true;
      }
    }
  }
  return false;
}

/**
 * `abrioLaPr` y `creoOEmpujoLaRama`, aplicadas a cada PR de `prs` sobre
 * las MISMAS líneas crudas de una sesión. Vive junto a esas dos porque la
 * cáscara la llama una vez por archivo, con sus líneas crudas todavía en
 * memoria, y guarda solo este resumen (dos conjuntos de números/strings) en
 * vez de las líneas -- que son la parte pesada de una transcripción.
 * @param {Array<{number: number, headRefName: string}>} prs
 * @returns {{prsAbiertas: Set<number>, ramasCreadas: Set<string>}}
 */
export function resumenDeTrabajo(lineas, prs) {
  const prsAbiertas = new Set();
  const ramasCreadas = new Set();
  for (const pr of prs) {
    if (abrioLaPr(lineas, pr.number)) prsAbiertas.add(pr.number);
    if (creoOEmpujoLaRama(lineas, pr.headRefName)) ramasCreadas.add(pr.headRefName);
  }
  return { prsAbiertas, ramasCreadas };
}

/**
 * El pegamento de la selección: para cada PR de `prs`, las sesiones que la
 * trabajaron -- la abrieron (`resumen.prsAbiertas`) O crearon/empujaron su
 * rama (`resumen.ramasCreadas`); puede ser más de una (un PM relevado que
 * creó la rama, y su relevo, que abrió la PR) -- y sus descendientes, todos
 * unidos. Una PR sin ninguna sesión que la trabajara no aporta nada al
 * conjunto de ids (nunca "todas las sesiones" como alternativa); su número
 * va aparte, en `prsSinSesion`, para que la cáscara avise por stderr.
 * @returns {{ids: Set<string>, prsSinSesion: number[]}}
 */
export function sesionesDelTrabajo(sesiones, prs) {
  const ids = new Set();
  const prsSinSesion = [];
  for (const pr of prs) {
    const trabajadoras = sesiones.filter((sesion) => sesion.resumen.prsAbiertas.has(pr.number) || sesion.resumen.ramasCreadas.has(pr.headRefName));
    if (trabajadoras.length === 0) {
      prsSinSesion.push(pr.number);
      continue;
    }
    for (const trabajadora of trabajadoras) {
      for (const id of idsDescendientesDeSesion(sesiones, trabajadora.id)) ids.add(id);
    }
  }
  return { ids, prsSinSesion };
}

/**
 * El slug de directorio bajo `~/.claude/projects/` para una ruta de
 * checkout: la ruta absoluta con cada carácter que no sea `[A-Za-z0-9]`
 * cambiado a `-`.
 */
export function slugDeRuta(ruta) {
  return ruta.replace(/[^A-Za-z0-9]/g, '-');
}

/**
 * Los ids de `nodos` (`{id, raiz, esRaiz, parentAgentId}`) que cuentan
 * cuando la sesión que abrió el trabajo medido es `idQueAbrio`. Si es la
 * raíz, entran ella y TODOS sus subagentes -- viven planos bajo
 * `<raiz>/subagents/`, así que "abrió la raíz" cubre cualquier trabajo hecho
 * bajo su nombre, aunque no desciendan unos de otros. Si es un subagente,
 * entran él y sus descendientes por `parentAgentId`, recursivo, pero no la
 * raíz ni sus hermanos.
 */
export function idsDescendientesDeSesion(nodos, idQueAbrio) {
  const nodoQueAbrio = nodos.find((nodo) => nodo.id === idQueAbrio);
  if (!nodoQueAbrio) return new Set([idQueAbrio]);
  if (nodoQueAbrio.esRaiz) {
    return new Set(nodos.filter((nodo) => nodo.raiz === nodoQueAbrio.raiz).map((nodo) => nodo.id));
  }

  const resultado = new Set([idQueAbrio]);
  let cambio = true;
  while (cambio) {
    cambio = false;
    for (const nodo of nodos) {
      if (nodo.raiz !== nodoQueAbrio.raiz) continue;
      if (resultado.has(nodo.id)) continue;
      if (nodo.parentAgentId !== undefined && resultado.has(nodo.parentAgentId)) {
        resultado.add(nodo.id);
        cambio = true;
      }
    }
  }
  return resultado;
}

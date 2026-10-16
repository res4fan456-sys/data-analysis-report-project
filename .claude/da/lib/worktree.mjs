// Montaje de worktrees (`da worktree`): decidir los argumentos de `git worktree
// add` y el estado que se anota. Pura; la cáscara corre git y los ganchos.

/**
 * Qué `git worktree add` toca.
 * @param {object} p
 * @param {string} p.ruta destino absoluto
 * @param {string} [p.rama] rama que se quiere (obligatoria salvo lectura)
 * @param {string} [p.desde] base para crear la rama o para la lectura
 * @param {boolean} p.lectura worktree desprendido de solo lectura
 * @param {boolean} p.existeLocal la rama ya existe en local
 * @param {boolean} p.existeRemota la rama ya existe en el remoto
 * @param {string} p.remoto
 * @param {string} p.ramaPrincipal
 */
export function planMontaje({ ruta, rama, desde, lectura, existeLocal, existeRemota, remoto, ramaPrincipal }) {
  const base = desde ?? `${remoto}/${ramaPrincipal}`;
  if (lectura) return { argumentos: ['worktree', 'add', '--detach', ruta, base], descripcion: `lectura desprendida de ${base}` };
  if (!rama) throw new Error('hace falta --rama (o --lectura)');
  if (existeLocal) return { argumentos: ['worktree', 'add', ruta, rama], descripcion: `rama local ${rama}` };
  if (existeRemota) return { argumentos: ['worktree', 'add', '--track', '-b', rama, ruta, `${remoto}/${rama}`], descripcion: `rama remota ${remoto}/${rama}` };
  return { argumentos: ['worktree', 'add', '-b', rama, ruta, base], descripcion: `rama nueva ${rama} desde ${base}` };
}

/** La entrada que se guarda en estado/worktrees.json. */
export function entradaDeEstado({ ruta, rama, lectura, sistema, fecha }) {
  return { ruta, rama: lectura ? null : rama, lectura: Boolean(lectura), sistema: Boolean(sistema), fecha };
}

export function sinEntrada(lista, ruta) {
  return lista.filter((e) => e.ruta !== ruta);
}

/** Tabla de `da worktree listar`. */
export function formatearLista(lista) {
  if (lista.length === 0) return 'sin worktrees anotados';
  return lista.map((e) => `${e.ruta}  ${e.lectura ? '(lectura)' : e.rama}${e.sistema ? '  [sistema]' : ''}  ${e.fecha}`).join('\n');
}

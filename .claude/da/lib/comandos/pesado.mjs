// `da pesado -- <cmd> [args…]`: toma el candado global de la máquina y corre el
// comando heredando la terminal. 75 si el candado está ocupado.

import { bajoCandado } from '../procesos.mjs';

export async function ejecutar(args, ctx) {
  const separador = args.indexOf('--');
  const comando = separador === -1 ? args : args.slice(separador + 1);
  if (comando.length === 0) {
    ctx.stderr('uso: da pesado -- <comando> [args…]\n');
    return 2;
  }
  const r = bajoCandado(ctx.baseDelKit, comando, { cwd: ctx.cwd });
  if (r.error) ctx.stderr(`da pesado: ${r.error.message}\n`);
  return r.codigo;
}

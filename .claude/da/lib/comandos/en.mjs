// `da en <dir> -- <cmd> [args…]`: corre el comando con cwd en <dir>, heredando
// la terminal. Sustituye a `cd` (vetado), a `bun run --cwd` y a `env -C` (que
// el `env` de macOS no tiene). Devuelve el código del hijo; 2 si <dir> no
// existe o falta el comando.

import { resolve } from 'node:path';
import { correrEnTerminal, esDirectorio } from '../procesos.mjs';

export async function ejecutar(args, ctx) {
  const separador = args.indexOf('--');
  const dir = args[0];
  const comando = separador === -1 ? args.slice(1) : args.slice(separador + 1);
  if (!dir || dir === '--' || comando.length === 0) {
    ctx.stderr('uso: da en <dir> -- <comando> [args…]\n');
    return 2;
  }
  const absoluta = resolve(ctx.cwd, dir);
  if (!esDirectorio(absoluta)) {
    ctx.stderr(`da en: no existe el directorio ${absoluta}\n`);
    return 2;
  }
  const r = correrEnTerminal(comando, { cwd: absoluta });
  if (r.error) ctx.stderr(`da en: ${r.error.message}\n`);
  return r.codigo;
}

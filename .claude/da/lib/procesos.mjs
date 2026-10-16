// Lanzar procesos desde los subcomandos: comandos del perfil (por shell, con
// cwd), `gh`/`git` (por argumentos) y el candado del comando pesado.

import { spawnSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

/** Corre un comando de shell en `cwd`, capturando la salida. */
export function correr(comando, { cwd, env } = {}) {
  const r = spawnSync(comando, { shell: '/bin/bash', cwd, env: { ...process.env, ...env }, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  return { codigo: r.status ?? (r.error ? 2 : 1), stdout: r.stdout ?? '', stderr: r.stderr ?? '', error: r.error };
}

/** Corre un comando heredando la terminal (para `da en`, `da pesado`). */
export function correrEnTerminal(argumentos, { cwd, env } = {}) {
  const [cmd, ...resto] = argumentos;
  const r = spawnSync(cmd, resto, { cwd, env: { ...process.env, ...env }, stdio: 'inherit' });
  if (r.error) return { codigo: 2, error: r.error };
  return { codigo: r.status ?? 1 };
}

/** `git`/`gh` por argumentos, sin shell. */
export function ejecutar(binario, argumentos, { cwd, env } = {}) {
  const r = spawnSync(binario, argumentos, { cwd, env: env ? { ...process.env, ...env } : process.env, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  return { codigo: r.status ?? (r.error ? 2 : 1), stdout: r.stdout ?? '', stderr: r.stderr ?? '', error: r.error };
}

export function esDirectorio(ruta) {
  return existsSync(ruta) && statSync(ruta).isDirectory();
}

/** Ruta de `pesado.sh` junto a `da.mjs`. */
export function rutaDelCandado(baseDelKit) {
  return join(baseDelKit, 'pesado.sh');
}

/** Corre `argumentos` bajo el candado del comando pesado, heredando la terminal. */
export function bajoCandado(baseDelKit, argumentos, opciones = {}) {
  return correrEnTerminal(['bash', rutaDelCandado(baseDelKit), ...argumentos], opciones);
}

export function shaDe(cwd) {
  const r = ejecutar('git', ['rev-parse', '--short=12', 'HEAD'], { cwd });
  return r.codigo === 0 ? r.stdout.trim() : null;
}

/** ¿Hay cambios sin commitear? Los logs y el estado del propio kit no cuentan. */
export function arbolSucio(cwd) {
  const r = ejecutar('git', ['status', '--porcelain', '--', '.', ':(exclude).claude/da/logs', ':(exclude).claude/da/estado'], { cwd });
  return r.codigo === 0 ? r.stdout.trim() !== '' : null;
}

// Copiar el kit dentro del proyecto (`<raíz>/.claude/da/`): nucleo/, plantillas/
// y VERSION. Lo usan `kit.mjs instalar` y `kit.mjs actualizar`.

import { chmodSync, cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const DESTINO = '.claude/da';

/**
 * @param {string} kit raíz del clon del kit
 * @param {string} raiz raíz del proyecto
 * @returns {{destino: string, version: string}}
 */
export function vendorizar(kit, raiz) {
  const destino = join(raiz, DESTINO);
  mkdirSync(destino, { recursive: true });
  // Lo del kit se reemplaza entero; lo del proyecto (logs, estado, guardia.json, manifiesto) se conserva.
  for (const sub of ['lib', 'plantillas']) if (existsSync(join(destino, sub))) rmSync(join(destino, sub), { recursive: true, force: true });
  cpSync(join(kit, 'nucleo'), destino, { recursive: true });
  cpSync(join(kit, 'plantillas'), join(destino, 'plantillas'), { recursive: true });
  const version = readFileSync(join(kit, 'VERSION'), 'utf8').trim();
  writeFileSync(join(destino, 'VERSION'), `${version}\n`);
  for (const ejecutable of ['da', 'pesado.sh']) chmodSync(join(destino, ejecutable), 0o755);
  return { destino, version };
}

/** Versión del kit que el proyecto tiene vendorizada, o null. */
export function versionVendorizada(raiz) {
  const ruta = join(raiz, DESTINO, 'VERSION');
  return existsSync(ruta) ? readFileSync(ruta, 'utf8').trim() : null;
}

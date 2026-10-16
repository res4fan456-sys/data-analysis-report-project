// Dónde están las cosas: la raíz del proyecto anfitrión, las plantillas y la
// versión del kit. Vale tanto vendorizado (`<proyecto>/.claude/da/`) como
// dentro del repo del kit (`nucleo/` con `plantillas/` y `VERSION` al lado).

import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Directorio de `da.mjs` (resuelto, aunque se invoque por symlink). */
export function baseDelKit() {
  return dirname(dirname(fileURLToPath(import.meta.url)));
}

/** La raíz del proyecto: `--raiz`; si no, el proyecto que vendoriza este `da`
 * (`<raíz>/.claude/da`); si no, la del repo git que contiene `cwd`. */
export function raizDelProyecto(argRaiz, cwd, base) {
  if (argRaiz) return resolve(cwd, argRaiz);
  if (base && /[\\/]\.claude[\\/]da$/.test(base)) return dirname(dirname(base));
  try {
    return execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return cwd;
  }
}

function primeroQueExista(candidatos, descripcion) {
  const hallado = candidatos.find((c) => existsSync(c));
  if (!hallado) throw new Error(`no encuentro ${descripcion}; busqué en ${candidatos.join(', ')}`);
  return hallado;
}

export function dirDePlantillas(base) {
  return primeroQueExista([join(base, 'plantillas'), join(base, '..', 'plantillas')], 'las plantillas');
}

export function versionDelKit(base) {
  const ruta = primeroQueExista([join(base, 'VERSION'), join(base, '..', 'VERSION')], 'VERSION');
  return readFileSync(ruta, 'utf8').trim();
}

/** Todos los archivos bajo `dir`, como `{ ruta relativa posix: contenido }`. */
export function leerArbol(dir) {
  const salida = {};
  const recorrer = (actual) => {
    for (const nombre of readdirSync(actual).sort()) {
      const ruta = join(actual, nombre);
      if (statSync(ruta).isDirectory()) recorrer(ruta);
      else salida[relative(dir, ruta).split('\\').join('/')] = readFileSync(ruta, 'utf8');
    }
  };
  recorrer(dir);
  return salida;
}

/** Separa `--clave valor` / `--bandera` de los argumentos posicionales. */
export function analizarArgumentos(args, { banderas = [], repetibles = [] } = {}) {
  const opciones = {};
  const posicionales = [];
  for (const repetible of repetibles) opciones[repetible] = [];
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--') {
      posicionales.push(...args.slice(i + 1));
      break;
    }
    if (!arg.startsWith('--')) {
      posicionales.push(arg);
      continue;
    }
    const clave = arg.slice(2);
    if (banderas.includes(clave)) {
      opciones[clave] = true;
      continue;
    }
    const valor = args[i + 1];
    if (valor === undefined || valor.startsWith('--')) throw new Error(`--${clave} necesita un valor`);
    i += 1;
    if (repetibles.includes(clave)) opciones[clave].push(valor);
    else opciones[clave] = valor;
  }
  return { opciones, posicionales };
}

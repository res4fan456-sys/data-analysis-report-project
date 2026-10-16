// `da cuerpo-pr lint --plantilla A|B|C --sha <sha> [--cierre] [cuerpo.md]`
//   valida el cuerpo (o la entrada estándar) con los encabezados del perfil.
//   0 vale · 1 hallazgos · 2 uso.
// `da cuerpo-pr armar --sha <sha> [--ronda] [--capturas <json>] [--openspec <texto>] [--mutacion <archivo>] [--sin-sistema <razón>] [--pila <texto>]`
//   arma el bloque de Evidencia (o el comentario de ronda) con el estado que
//   dejaron `da verify` y `da sistema` para ese SHA. 0 · 2.

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { analizarArgumentos, raizDelProyecto } from '../entorno.mjs';
import { cargarPerfil } from './render.mjs';
import { opcionesDePerfil, plantillasDe, validarCuerpo } from '../cuerpo-pr/validar.mjs';
import { bloqueDeRonda, ensamblarEvidencia } from '../cuerpo-pr/ensamblar.mjs';

function leerEstado(raiz, nombre, sha) {
  const dir = join(raiz, '.claude/da/estado');
  if (!existsSync(dir)) return null;
  const exacto = join(dir, `${nombre}-${sha}.json`);
  if (existsSync(exacto)) return JSON.parse(readFileSync(exacto, 'utf8'));
  // El SHA puede venir largo o corto: vale el estado cuyo SHA sea prefijo o lo tenga de prefijo.
  for (const f of readdirSync(dir)) {
    const m = new RegExp(`^${nombre}-([0-9a-f]+)\\.json$`).exec(f);
    if (m && (sha.startsWith(m[1]) || m[1].startsWith(sha))) return JSON.parse(readFileSync(join(dir, f), 'utf8'));
  }
  return null;
}

async function lint(args, ctx) {
  const { opciones, posicionales } = analizarArgumentos(args, { banderas: ['cierre'] });
  if (!['A', 'B', 'C'].includes(opciones.plantilla)) {
    ctx.stderr('uso: da cuerpo-pr lint --plantilla A|B|C [--sha <sha>] [--cierre] [cuerpo.md]\n');
    return 2;
  }
  const raiz = raizDelProyecto(opciones.raiz, ctx.cwd, ctx.baseDelKit);
  const perfil = cargarPerfil(raiz);
  const texto = posicionales[0] ? readFileSync(posicionales[0], 'utf8') : readFileSync(0, 'utf8');
  const errores = validarCuerpo(texto, opciones.plantilla, { sha: opciones.sha, cierre: Boolean(opciones.cierre) }, plantillasDe(opcionesDePerfil(perfil)));
  if (errores.length === 0) {
    ctx.stdout(`cuerpo-pr lint: plantilla ${opciones.plantilla} OK\n`);
    return 0;
  }
  ctx.stdout(errores.map((e) => `${e.linea}: ${e.mensaje}`).join('\n') + '\n');
  return 1;
}

async function armar(args, ctx) {
  const { opciones } = analizarArgumentos(args, { banderas: ['ronda'] });
  if (!opciones.sha) {
    ctx.stderr('uso: da cuerpo-pr armar --sha <sha> [--ronda] [--capturas <json>] [--openspec <texto>] [--mutacion <archivo>] [--sin-sistema <razón>] [--pila <texto>]\n');
    return 2;
  }
  const raiz = raizDelProyecto(opciones.raiz, ctx.cwd, ctx.baseDelKit);
  const perfil = cargarPerfil(raiz);
  const opcionesPlantilla = opcionesDePerfil(perfil);
  const verify = leerEstado(raiz, 'verify', opciones.sha);
  let suite = leerEstado(raiz, 'sistema', opciones.sha);
  if (!suite && opciones['sin-sistema']) suite = { noCorrida: opciones['sin-sistema'] };
  if (suite && opciones.pila) suite.pila = opciones.pila;
  const datos = {
    sha: opciones.sha,
    verify: verify ? { ...verify, worktree: verify.worktree } : undefined,
    suite: suite ?? undefined,
    capturas: opciones.capturas ? JSON.parse(readFileSync(opciones.capturas, 'utf8')) : undefined,
    openspec: opciones.openspec,
    mutacion: opciones.mutacion ? readFileSync(opciones.mutacion, 'utf8').trimEnd() : undefined,
  };
  ctx.stdout(opciones.ronda ? bloqueDeRonda(datos, opcionesPlantilla) : ensamblarEvidencia(datos, opcionesPlantilla));
  return 0;
}

export async function ejecutar(args, ctx) {
  const [sub, ...resto] = args;
  if (sub === 'lint') return lint(resto, ctx);
  if (sub === 'armar') return armar(resto, ctx);
  ctx.stderr('uso: da cuerpo-pr lint|armar …\n');
  return 2;
}

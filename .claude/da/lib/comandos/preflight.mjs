// `da preflight`: corre las comprobaciones de arranque del perfil, guarda la
// salida cruda en .claude/da/logs/preflight-<fecha>.log e imprime OK/FALLA
// por línea. 0 si todas pasan, 1 si alguna falla.

import { appendFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { analizarArgumentos, raizDelProyecto } from '../entorno.mjs';
import { cargarPerfil } from './render.mjs';
import { correr } from '../procesos.mjs';
import { construirComprobaciones, resumen, todoOk } from '../preflight.mjs';

export async function ejecutar(args, ctx) {
  const { opciones } = analizarArgumentos(args);
  const raiz = raizDelProyecto(opciones.raiz, ctx.cwd, ctx.baseDelKit);
  const perfil = cargarPerfil(raiz);
  const dir = join(raiz, '.claude/da/logs');
  mkdirSync(dir, { recursive: true });
  const rutaLog = join(dir, `preflight-${new Date().toISOString().slice(0, 10)}.log`);
  const resultados = construirComprobaciones(perfil).map((c) => {
    const r = correr(c.comando, { cwd: raiz, env: c.env });
    appendFileSync(rutaLog, `\n===== ${c.nombre} :: ${c.comando} =====\n${r.stdout}${r.stderr}\n(exit ${r.codigo})\n`);
    return { nombre: c.nombre, ok: r.codigo === 0, pista: c.pista };
  });
  ctx.stdout(`${resumen(resultados)}\nlog: ${rutaLog}\n`);
  return todoOk(resultados) ? 0 : 1;
}

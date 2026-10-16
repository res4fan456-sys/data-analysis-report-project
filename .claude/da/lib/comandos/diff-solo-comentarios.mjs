// `da diff-solo-comentarios <sha-base>` (módulo de la suite de sistema): 0 si
// todo archivo de producto que cambió desde <sha-base> (commiteado o no)
// difiere solo en comentarios y espacio; 1 si alguno cambió código o es de un
// tipo sin léxico (estilos, datos, binarios); 2 si el SHA no existe. Los
// archivos de test y los de las rutas sin código se listan aparte: el PM
// decide con §2.6 del skill.

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { analizarArgumentos, raizDelProyecto } from '../entorno.mjs';
import { cargarPerfil } from './render.mjs';
import { ejecutar as git } from '../procesos.mjs';
import { clasificarCambios } from '../diff-solo-comentarios.mjs';

export async function ejecutar(args, ctx) {
  const { opciones, posicionales } = analizarArgumentos(args);
  const base = posicionales[0];
  if (!base) {
    ctx.stderr('uso: da diff-solo-comentarios <sha-base>\n');
    return 2;
  }
  const raiz = raizDelProyecto(opciones.raiz, ctx.cwd, ctx.baseDelKit);
  const perfil = cargarPerfil(raiz);
  if (git('git', ['cat-file', '-e', `${base}^{commit}`], { cwd: raiz }).codigo !== 0) {
    ctx.stderr(`da diff-solo-comentarios: ${base} no es un commit de este repo\n`);
    return 2;
  }
  const nombres = git('git', ['diff', '--name-only', base], { cwd: raiz });
  const sinTrackear = git('git', ['ls-files', '--others', '--exclude-standard'], { cwd: raiz });
  const rutas = [...new Set([...nombres.stdout.split('\n'), ...sinTrackear.stdout.split('\n')].map((l) => l.trim()).filter(Boolean))];
  const cambios = rutas.map((ruta) => {
    const antes = git('git', ['show', `${base}:${ruta}`], { cwd: raiz });
    const absoluta = join(raiz, ruta);
    return { ruta, antes: antes.codigo === 0 ? antes.stdout : null, despues: existsSync(absoluta) ? readFileSync(absoluta, 'utf8') : null };
  });
  const sinCodigo = [...perfil.rutas.sinCodigo, '.claude/'];
  const r = clasificarCambios(cambios, sinCodigo);
  for (const p of r.producto) ctx.stdout(`${p.clase.padEnd(16)} ${p.ruta}\n`);
  for (const t of r.tests) ctx.stdout(`test             ${t}\n`);
  for (const i of r.ignorados) ctx.stdout(`sin código       ${i}\n`);
  ctx.stdout(r.soloComentarios ? `solo comentarios en el código de producto desde ${base} (${r.producto.length} archivo(s))\n` : `hay cambios de código de producto desde ${base}\n`);
  return r.soloComentarios ? 0 : 1;
}

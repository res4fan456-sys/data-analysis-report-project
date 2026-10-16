// `da etiquetas [--aplicar]`: diff entre las etiquetas del perfil y las del
// repo (`gh label list`); con --aplicar crea las que faltan. 0 si no falta
// ninguna, 1 si faltan (sin --aplicar), 2 si gh falla.

import { analizarArgumentos, raizDelProyecto, versionDelKit } from '../entorno.mjs';
import { cargarPerfil } from './render.mjs';
import { construirVista } from '../vista.mjs';
import { ejecutar as ejecutarBinario } from '../procesos.mjs';
import { diferencia, etiquetasEsperadas } from '../etiquetas.mjs';

export async function ejecutar(args, ctx) {
  const { opciones } = analizarArgumentos(args, { banderas: ['aplicar'] });
  const raiz = raizDelProyecto(opciones.raiz, ctx.cwd, ctx.baseDelKit);
  const perfil = cargarPerfil(raiz);
  const vista = construirVista(perfil, { version: versionDelKit(ctx.baseDelKit) });
  const r = ejecutarBinario('gh', ['label', 'list', '--json', 'name', '--limit', '300'], { cwd: raiz });
  if (r.codigo !== 0) {
    ctx.stderr(`da etiquetas: gh falló — ${r.stderr.trim() || r.error?.message || ''}\n`);
    return 2;
  }
  const existentes = JSON.parse(r.stdout).map((l) => l.name);
  const esperadas = etiquetasEsperadas(perfil, vista);
  const { faltan, ajenasConPrefijo } = diferencia(esperadas, existentes);
  if (faltan.length === 0) {
    ctx.stdout(`etiquetas: las ${esperadas.length} del perfil existen\n`);
  } else {
    ctx.stdout(`etiquetas: faltan ${faltan.length} de ${esperadas.length}:\n${faltan.map((e) => `  - ${e.nombre}\n`).join('')}`);
  }
  if (ajenasConPrefijo.length > 0) ctx.stdout(`con prefijo de la mecánica pero fuera del perfil (no se tocan): ${ajenasConPrefijo.join(', ')}\n`);
  if (faltan.length === 0) return 0;
  if (!opciones.aplicar) return 1;
  let fallos = 0;
  for (const e of faltan) {
    const c = ejecutarBinario('gh', ['label', 'create', e.nombre, '--color', e.color, '--description', e.descripcion, '--force'], { cwd: raiz });
    if (c.codigo === 0) ctx.stdout(`creada ${e.nombre}\n`);
    else {
      fallos += 1;
      ctx.stderr(`no se pudo crear ${e.nombre}: ${c.stderr.trim()}\n`);
    }
  }
  return fallos === 0 ? 0 : 2;
}

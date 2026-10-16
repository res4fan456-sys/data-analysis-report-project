// `da render`: la cáscara de I/O del planificador (render.mjs).
//
//   da render [--check] [--raiz <dir>] [--plantillas <dir>] [--forzar <ruta>]... [--expulsar <ruta>]...
//
// Salida: 0 todo aplicado (o, con --check, nada que cambiar) · 1 quedan
// conflictos (o, con --check, habría cambios) · 2 perfil inválido o error.

import { existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { analizarArgumentos, dirDePlantillas, leerArbol, raizDelProyecto, versionDelKit } from '../entorno.mjs';
import { completar, validar } from '../perfil.mjs';
import { construirVista } from '../vista.mjs';
import { hashDe, manifiestoVacio } from '../manifiesto.mjs';
import { planificarRender, resumirPlan } from '../render.mjs';

export const RUTA_PERFIL = '.claude/desarrollo-autonomo.json';
export const RUTA_MANIFIESTO = '.claude/da/manifiesto.json';

export function cargarPerfil(raiz) {
  const ruta = join(raiz, RUTA_PERFIL);
  if (!existsSync(ruta)) throw new Error(`no hay perfil en ${RUTA_PERFIL}; corre /da-init primero`);
  let crudo;
  try {
    crudo = JSON.parse(readFileSync(ruta, 'utf8'));
  } catch (e) {
    throw new Error(`${RUTA_PERFIL} no es JSON válido: ${e.message}`);
  }
  const perfil = completar(crudo);
  const errores = validar(perfil);
  if (errores.length > 0) throw new Error(`perfil inválido:\n  - ${errores.join('\n  - ')}`);
  return perfil;
}

export function cargarPlantillas(dir) {
  const todo = leerArbol(dir);
  const indice = JSON.parse(todo['indice.json'] ?? '[]');
  delete todo['indice.json'];
  delete todo['anclas.json'];
  return { indice, plantillas: todo };
}

function leerManifiesto(raiz, version) {
  const ruta = join(raiz, RUTA_MANIFIESTO);
  if (!existsSync(ruta)) return manifiestoVacio(version);
  return JSON.parse(readFileSync(ruta, 'utf8'));
}

function escribir(raiz, ruta, contenido) {
  const absoluta = join(raiz, ruta);
  mkdirSync(dirname(absoluta), { recursive: true });
  writeFileSync(absoluta, contenido, 'utf8');
}

function serializarManifiesto(manifiesto) {
  const archivos = Object.fromEntries(Object.entries(manifiesto.archivos).sort(([a], [b]) => a.localeCompare(b)));
  return `${JSON.stringify({ ...manifiesto, archivos }, null, 2)}\n`;
}

export async function ejecutar(args, ctx) {
  const { opciones } = analizarArgumentos(args, { banderas: ['check'], repetibles: ['forzar', 'expulsar'] });
  const raiz = raizDelProyecto(opciones.raiz, ctx.cwd, ctx.baseDelKit);
  const version = versionDelKit(ctx.baseDelKit);
  const perfil = cargarPerfil(raiz);
  const { indice, plantillas } = cargarPlantillas(opciones.plantillas ?? dirDePlantillas(ctx.baseDelKit));
  const manifiesto = leerManifiesto(raiz, version);
  manifiesto.expulsados = [...new Set([...(manifiesto.expulsados ?? []), ...opciones.expulsar])];
  for (const ruta of opciones.expulsar) delete manifiesto.archivos[ruta];

  const vista = construirVista(perfil, { version });
  const plan = planificarRender({
    indice,
    plantillas,
    vista,
    leer: (ruta) => (existsSync(join(raiz, ruta)) ? readFileSync(join(raiz, ruta), 'utf8') : null),
    manifiesto,
    version,
  });
  if (plan.errores.length > 0) {
    ctx.stderr(`render: ${plan.errores.length} error(es)\n  - ${plan.errores.join('\n  - ')}\n`);
    return 2;
  }
  ctx.stdout(`${resumirPlan(plan)}\n`);
  const cambia = plan.salidas.some((s) => ['creado', 'actualizado', 'retirado', 'conflicto'].includes(s.estado));
  if (opciones.check) return cambia ? 1 : 0;

  const forzar = new Set(opciones.forzar);
  let conflictos = 0;
  for (const salida of plan.salidas) {
    const absoluta = join(raiz, salida.ruta);
    switch (salida.estado) {
      case 'creado':
      case 'actualizado':
        escribir(raiz, salida.ruta, salida.contenido);
        break;
      case 'retirado':
        unlinkSync(absoluta);
        break;
      case 'conflicto':
        if (!forzar.has(salida.ruta)) {
          conflictos += 1;
          break;
        }
        renameSync(absoluta, `${absoluta}.antes-de-render`);
        if (salida.contenido === null) {
          delete plan.manifiesto.archivos[salida.ruta];
        } else {
          escribir(raiz, salida.ruta, salida.contenido);
          plan.manifiesto.archivos[salida.ruta] = { tipo: salida.tipo, hash: hashDe(salida.contenido) };
        }
        ctx.stdout(`forzado     ${salida.ruta} (copia en ${salida.ruta}.antes-de-render)\n`);
        break;
      default:
        break;
    }
  }
  escribir(raiz, RUTA_MANIFIESTO, serializarManifiesto(plan.manifiesto));
  if (conflictos > 0) {
    ctx.stderr(`render: ${conflictos} conflicto(s) sin aplicar. Lleva el cambio al perfil o a la plantilla, o usa --forzar <ruta> (deja copia) o --expulsar <ruta> (pasa a ser del proyecto).\n`);
    return 1;
  }
  return 0;
}

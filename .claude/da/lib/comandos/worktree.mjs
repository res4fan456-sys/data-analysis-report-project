// `da worktree montar <ruta> --rama <r> [--desde <base>] [--sistema] [--lectura]`
// `da worktree quitar <ruta>` · `da worktree listar`
//
// montar: git worktree add → gancho preparar (o prepararSistema) → gancho
// comprobar (toda ruta impresa bajo <ruta>/, o falla). quitar: gancho limpiar
// → git worktree remove sin --force; se niega con cambios sin commitear.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { analizarArgumentos, raizDelProyecto } from '../entorno.mjs';
import { cargarPerfil } from './render.mjs';
import { arbolSucio, correr, ejecutar as git, esDirectorio } from '../procesos.mjs';
import { comprobarRutasBajo } from '../verify.mjs';
import { entradaDeEstado, formatearLista, planMontaje, sinEntrada } from '../worktree.mjs';
import { sustituirWt } from './verify.mjs';

const ESTADO = '.claude/da/estado/worktrees.json';

function leerEstado(raiz) {
  const ruta = join(raiz, ESTADO);
  return existsSync(ruta) ? JSON.parse(readFileSync(ruta, 'utf8')) : [];
}

function escribirEstado(raiz, lista) {
  const ruta = join(raiz, ESTADO);
  mkdirSync(dirname(ruta), { recursive: true });
  writeFileSync(ruta, `${JSON.stringify(lista, null, 2)}\n`);
}

function ramaExiste(raiz, rama, remoto) {
  const local = git('git', ['show-ref', '--verify', '--quiet', `refs/heads/${rama}`], { cwd: raiz }).codigo === 0;
  const remota = git('git', ['ls-remote', '--exit-code', '--heads', remoto, rama], { cwd: raiz }).codigo === 0;
  return { local, remota };
}

async function montar(args, ctx) {
  const { opciones, posicionales } = analizarArgumentos(args, { banderas: ['sistema', 'lectura'] });
  const destino = posicionales[0];
  if (!destino) {
    ctx.stderr('uso: da worktree montar <ruta> --rama <rama> [--desde <base>] [--sistema] [--lectura]\n');
    return 2;
  }
  const raiz = raizDelProyecto(opciones.raiz, ctx.cwd, ctx.baseDelKit);
  const perfil = cargarPerfil(raiz);
  const ruta = resolve(ctx.cwd, destino);
  if (existsSync(ruta)) {
    ctx.stderr(`da worktree montar: ${ruta} ya existe\n`);
    return 2;
  }
  const existe = opciones.rama ? ramaExiste(raiz, opciones.rama, perfil.proyecto.remoto) : { local: false, remota: false };
  let plan;
  try {
    plan = planMontaje({ ruta, rama: opciones.rama, desde: opciones.desde, lectura: Boolean(opciones.lectura), existeLocal: existe.local, existeRemota: existe.remota, remoto: perfil.proyecto.remoto, ramaPrincipal: perfil.proyecto.ramaPrincipal });
  } catch (e) {
    ctx.stderr(`da worktree montar: ${e.message}\n`);
    return 2;
  }
  mkdirSync(dirname(ruta), { recursive: true });
  const add = git('git', plan.argumentos, { cwd: raiz });
  if (add.codigo !== 0) {
    ctx.stderr(`da worktree montar: git worktree add falló (${plan.descripcion}): ${add.stderr.trim()}\n`);
    return 1;
  }
  ctx.stdout(`worktree: ${ruta} (${plan.descripcion})\n`);
  const gancho = opciones.sistema ? perfil.worktree.prepararSistema ?? perfil.worktree.preparar : perfil.worktree.preparar;
  if (gancho) {
    const r = correr(sustituirWt(gancho, ruta), { cwd: ruta });
    if (r.codigo !== 0) {
      ctx.stderr(`da worktree montar: el gancho preparar falló (exit ${r.codigo}):\n${`${r.stdout}${r.stderr}`.trim().split('\n').slice(-20).join('\n')}\n`);
      return 1;
    }
    ctx.stdout('preparar: OK\n');
  }
  if (perfil.worktree.comprobar) {
    const r = correr(sustituirWt(perfil.worktree.comprobar, ruta), { cwd: ruta });
    const c = r.codigo === 0 ? comprobarRutasBajo(ruta, r.stdout) : { estado: 'FUERA', fuera: [] };
    if (c.estado !== 'OK') {
      ctx.stderr(`da worktree montar: el worktree no prueba su propio código (comprobar: ${c.estado}${c.fuera.length ? `; fuera: ${c.fuera.join(', ')}` : ''}; exit ${r.codigo})\n`);
      return 1;
    }
    ctx.stdout('comprobar: OK (toda ruta resuelta cae bajo el worktree)\n');
  } else {
    ctx.stdout('comprobar: — (el perfil no declara worktree.comprobar; da doctor lo avisa)\n');
  }
  const lista = sinEntrada(leerEstado(raiz), ruta);
  lista.push(entradaDeEstado({ ruta, rama: opciones.rama, lectura: opciones.lectura, sistema: opciones.sistema, fecha: new Date().toISOString() }));
  escribirEstado(raiz, lista);
  return 0;
}

async function quitar(args, ctx) {
  const { opciones, posicionales } = analizarArgumentos(args);
  const destino = posicionales[0];
  if (!destino) {
    ctx.stderr('uso: da worktree quitar <ruta>\n');
    return 2;
  }
  const raiz = raizDelProyecto(opciones.raiz, ctx.cwd, ctx.baseDelKit);
  const perfil = cargarPerfil(raiz);
  const ruta = resolve(ctx.cwd, destino);
  if (!esDirectorio(ruta)) {
    ctx.stderr(`da worktree quitar: no existe ${ruta}\n`);
    return 2;
  }
  if (arbolSucio(ruta)) {
    ctx.stderr(`da worktree quitar: ${ruta} tiene cambios sin commitear; commitea o descarta antes\n`);
    return 1;
  }
  if (perfil.worktree.limpiar) {
    const r = correr(sustituirWt(perfil.worktree.limpiar, ruta), { cwd: ruta });
    if (r.codigo !== 0) ctx.stderr(`da worktree quitar: el gancho limpiar devolvió ${r.codigo}; sigo con git worktree remove\n`);
  }
  const rm = git('git', ['worktree', 'remove', ruta], { cwd: raiz });
  if (rm.codigo !== 0) {
    ctx.stderr(`da worktree quitar: git worktree remove falló: ${rm.stderr.trim()} (si algo retiene archivos, bájalo primero; nunca --force a ciegas)\n`);
    return 1;
  }
  escribirEstado(raiz, sinEntrada(leerEstado(raiz), ruta));
  ctx.stdout(`quitado ${ruta}\n`);
  return 0;
}

async function listar(args, ctx) {
  const { opciones } = analizarArgumentos(args);
  const raiz = raizDelProyecto(opciones.raiz, ctx.cwd, ctx.baseDelKit);
  ctx.stdout(`${formatearLista(leerEstado(raiz))}\n`);
  const porcelain = git('git', ['worktree', 'list'], { cwd: raiz });
  if (porcelain.codigo === 0) ctx.stdout(`\ngit worktree list:\n${porcelain.stdout}`);
  return 0;
}

export async function ejecutar(args, ctx) {
  const [sub, ...resto] = args;
  if (sub === 'montar') return montar(resto, ctx);
  if (sub === 'quitar') return quitar(resto, ctx);
  if (sub === 'listar') return listar(resto, ctx);
  ctx.stderr('uso: da worktree montar|quitar|listar …\n');
  return 2;
}

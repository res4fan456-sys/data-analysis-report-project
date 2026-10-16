// `da verify [--wt <dir>] [--sin-candado]` y `da sistema [--wt <dir>] [--sin-candado]`.
//
// Sin `--sin-candado`, el subcomando se relanza a sí mismo bajo pesado.sh:
// así el candado envuelve toda la corrida y el código de salida llega tal
// cual. Con él, corre los pasos del perfil en el worktree (o la raíz), deja
// el log en .claude/da/logs/, el estado en .claude/da/estado/<nombre>-<sha>.json
// y imprime el resumen por paso. 0 verde · 1 rojo · 75 candado · 2 config.

import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { analizarArgumentos, raizDelProyecto } from '../entorno.mjs';
import { cargarPerfil } from './render.mjs';
import { arbolSucio, bajoCandado, correr, esDirectorio, shaDe } from '../procesos.mjs';
import { comprobarRutasBajo, correrPasos, resumirVerify } from '../verify.mjs';

function fecha() {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

export function sustituirWt(cmd, wt) {
  return cmd.split('{wt}').join(wt);
}

async function ejecutarComun(nombre, args, ctx) {
  const { opciones } = analizarArgumentos(args, { banderas: ['sin-candado'] });
  if (!opciones['sin-candado']) {
    const propios = args.filter((a) => a !== '--sin-candado');
    return bajoCandado(ctx.baseDelKit, ['node', join(ctx.baseDelKit, 'da.mjs'), nombre, ...propios, '--sin-candado'], { cwd: ctx.cwd }).codigo;
  }
  const raiz = raizDelProyecto(opciones.raiz, ctx.cwd, ctx.baseDelKit);
  const perfil = cargarPerfil(raiz);
  const wt = opciones.wt ? resolve(ctx.cwd, opciones.wt) : raiz;
  if (!esDirectorio(wt)) {
    ctx.stderr(`da ${nombre}: no existe el worktree ${wt}\n`);
    return 2;
  }
  let pasos;
  if (nombre === 'verify') {
    // Con el módulo `citas`, el gate también lo corre: es lo que CLAUDE.md promete
    // («`da citas` (en `verify`)»), y así el PM no descubre las citas rotas en CI.
    pasos = perfil.modulos.citas ? [...perfil.comandos.verify, { paso: 'citas', cmd: `node "${join(ctx.baseDelKit, 'da.mjs')}" citas --raiz "${wt}"` }] : perfil.comandos.verify;
  } else {
    const suite = perfil.modulos.suiteDeSistema;
    if (!suite) {
      ctx.stderr('da sistema: el perfil no declara modulos.suiteDeSistema\n');
      return 2;
    }
    pasos = [...(suite.preparar ? [{ paso: 'preparar', cmd: suite.preparar }] : []), { paso: suite.nombre, cmd: suite.cmd, resumen: suite.resumen }];
  }
  const sha = shaDe(wt);
  const sucio = arbolSucio(wt) === true;
  const dirLogs = join(raiz, '.claude/da/logs');
  const dirEstado = join(raiz, '.claude/da/estado');
  mkdirSync(dirLogs, { recursive: true });
  mkdirSync(dirEstado, { recursive: true });
  const rutaLog = join(dirLogs, `${nombre}-${sha ?? 'sin-git'}-${fecha()}.log`);
  writeFileSync(rutaLog, `# ${nombre} en ${wt} @ ${sha}${sucio ? '+sucio' : ''}\n`);

  const resultado = correrPasos(pasos, (cmd) => {
    const efectivo = sustituirWt(cmd, wt);
    appendFileSync(rutaLog, `\n===== ${efectivo} =====\n`);
    const r = correr(efectivo, { cwd: wt });
    appendFileSync(rutaLog, `${r.stdout}${r.stderr}\n(exit ${r.codigo})\n`);
    return r;
  });

  let enlaces = null;
  if (perfil.worktree.comprobar && wt !== raiz) {
    const r = correr(sustituirWt(perfil.worktree.comprobar, wt), { cwd: wt });
    appendFileSync(rutaLog, `\n===== comprobar =====\n${r.stdout}${r.stderr}\n(exit ${r.codigo})\n`);
    const c = r.codigo === 0 ? comprobarRutasBajo(wt, r.stdout) : { estado: 'FUERA', fuera: [] };
    enlaces = c.estado;
    if (c.estado === 'FUERA') resultado.verde = false;
  }

  const estado = {
    nombre,
    sha,
    sucio,
    worktree: wt,
    fecha: new Date().toISOString(),
    verde: resultado.verde,
    enlaces,
    pasos: resultado.pasos.map((p) => ({ paso: p.paso, cmd: p.cmd, estado: p.estado, lineas: p.lineas })),
    log: rutaLog,
  };
  writeFileSync(join(dirEstado, `${nombre}-${sha ?? 'sin-git'}.json`), `${JSON.stringify(estado, null, 2)}\n`);
  ctx.stdout(`${resumirVerify({ nombre, sha, sucio, pasos: estado.pasos, enlaces })}\nlog: ${rutaLog}\n`);
  if (!resultado.verde) {
    const roto = resultado.pasos.find((p) => p.estado === 'FALLA');
    if (roto) ctx.stderr(`${nombre}: ${roto.paso} en rojo (exit ${roto.codigo}); últimas líneas:\n${roto.salida.trim().split('\n').slice(-15).join('\n')}\n`);
    if (enlaces === 'FUERA') ctx.stderr(`${nombre}: el worktree no prueba su propio código (gancho comprobar)\n`);
  }
  return resultado.verde ? 0 : 1;
}

export async function ejecutar(args, ctx) {
  return ejecutarComun('verify', args, ctx);
}

export async function ejecutarSistema(args, ctx) {
  return ejecutarComun('sistema', args, ctx);
}

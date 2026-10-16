// Los prerrequisitos de la máquina: todo lo que el flujo entero —`install.sh`,
// `/da-plan`, `/da-init` y las olas— da por hecho. Una sola lista, con para
// qué sirve cada cosa, que leen el instalador y `doctor`: el instalador dice
// puntualmente qué falta y no sigue hasta que esté; cómo instalarlo es del
// usuario (solo los tres instalables por npm se ofrecen con su comando).
//
// Lo del stack del proyecto (python, bun, docker…) no está aquí: lo declara el
// perfil y lo comprueba `doctor` en el proyecto.

import { accessSync, constants, existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { ejecutar } from './procesos.mjs';

/** @type {Array<{id: string, nombre: string, para: string, obligatorio: boolean, comando?: string[], env?: object, minimo?: string, archivo?: string, instalable?: string}>} */
export const REQUISITOS = [
  { id: 'node', nombre: 'node', para: 'el kit entero (el CLI da, la guardia, el render)', obligatorio: true, comando: ['node', '--version'], minimo: '20' },
  { id: 'git', nombre: 'git', para: 'ramas, worktrees y la medición', obligatorio: true, comando: ['git', '--version'], minimo: '2.31' },
  { id: 'gh', nombre: 'gh (GitHub CLI)', para: 'PRs, issues, etiquetas y pr-dominio', obligatorio: true, comando: ['gh', '--version'] },
  { id: 'gh-sesion', nombre: 'gh con sesión iniciada', para: 'todo lo que toca GitHub', obligatorio: true, comando: ['gh', 'auth', 'status'] },
  { id: 'claude', nombre: 'claude (Claude Code)', para: '/da-plan, /da-init y la sesión del Team Manager', obligatorio: true, comando: ['claude', '--version'] },
  { id: 'npm', nombre: 'npm', para: 'instalar openspec y graft', obligatorio: true, comando: ['npm', '--version'] },
  { id: 'npx', nombre: 'npx', para: 'el ajuste de skills por área de /da-init (npx skills)', obligatorio: true, comando: ['npx', '--version'] },
  { id: 'openspec', nombre: 'openspec', para: 'la mecánica entera: changes, specs y archivado', obligatorio: true, comando: ['openspec', '--version'], env: { OPENSPEC_TELEMETRY: '0' }, minimo: '1.9', instalable: 'npm i -g @fission-ai/openspec' },
  { id: 'candado', nombre: 'flock o lockf', para: 'el candado del comando pesado', obligatorio: true, archivo: 'candado' },
  { id: 'find-skills', nombre: 'skill de usuario find-skills', para: 'el ajuste de skills por área de /da-init', obligatorio: true, archivo: join(homedir(), '.claude', 'skills', 'find-skills'), instalable: 'npx skills add vercel-labs/skills --skill find-skills -g -y' },
  { id: 'skills-escribible', nombre: '~/.claude/skills con permiso de escritura', para: 'enlazar /da-plan y /da-init', obligatorio: true, archivo: 'skills-escribible' },
  { id: 'graft', nombre: 'graft', para: 'el módulo graft (opcional; modulos.graft en el perfil)', obligatorio: false, comando: ['graft', '--version'], instalable: 'npm i -g @nanonets/graft' },
  { id: 'mcp-avisar', nombre: 'servidor MCP avisar', para: 'el módulo avisos (opcional; avisos por Telegram del Team Manager)', obligatorio: false, archivo: 'mcp-avisar' },
];

export function versionDe(texto) {
  const m = /(\d+)\.(\d+)(?:\.(\d+))?/.exec(texto ?? '');
  return m ? `${m[1]}.${m[2]}.${m[3] ?? '0'}` : null;
}

export function cumpleMinimo(version, minimo) {
  const a = version.split('.').map(Number);
  const b = minimo.split('.').map(Number);
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    if (x !== y) return x > y;
  }
  return true;
}

/**
 * Evalúa un requisito con el resultado de su comprobación: `{codigo, stdout,
 * stderr}` para un comando, `{existe}` para un archivo o condición.
 * @returns {{id: string, estado: 'OK'|'FALTA'|'VIEJO'|'OPCIONAL', version?: string}}
 */
export function evaluar(requisito, resultado) {
  const ausente = requisito.obligatorio ? 'FALTA' : 'OPCIONAL';
  if (requisito.comando) {
    if (resultado.codigo !== 0) return { id: requisito.id, estado: ausente };
    const version = versionDe(`${resultado.stdout}\n${resultado.stderr}`);
    if (requisito.minimo && version && !cumpleMinimo(version, requisito.minimo)) return { id: requisito.id, estado: 'VIEJO', version };
    return version ? { id: requisito.id, estado: 'OK', version } : { id: requisito.id, estado: 'OK' };
  }
  return { id: requisito.id, estado: resultado.existe ? 'OK' : ausente };
}

function comprobarArchivo(requisito) {
  if (requisito.archivo === 'candado') return { existe: ejecutar('flock', ['--version']).codigo === 0 || ejecutar('which', ['lockf']).codigo === 0 };
  if (requisito.archivo === 'skills-escribible') {
    const skills = join(homedir(), '.claude', 'skills');
    try {
      accessSync(existsSync(skills) ? skills : join(homedir(), '.claude'), constants.W_OK);
      return { existe: true };
    } catch {
      return { existe: false };
    }
  }
  if (requisito.archivo === 'mcp-avisar') {
    try {
      return { existe: Object.keys(JSON.parse(readFileSync(join(homedir(), '.claude.json'), 'utf8')).mcpServers ?? {}).includes('avisar') };
    } catch {
      return { existe: false };
    }
  }
  return { existe: existsSync(requisito.archivo) };
}

/** Corre todas las comprobaciones en esta máquina. Cáscara mínima: el juicio es de `evaluar`. */
export function correrPrerrequisitos() {
  return REQUISITOS.map((r) => {
    const resultado = r.comando ? ejecutar(r.comando[0], r.comando.slice(1), { env: r.env }) : comprobarArchivo(r);
    return { ...evaluar(r, resultado), nombre: r.nombre, para: r.para, minimo: r.minimo, instalable: r.instalable, obligatorio: r.obligatorio };
  });
}

export function listo(filas) {
  return filas.every((f) => f.estado === 'OK' || f.estado === 'OPCIONAL');
}

/** Una línea por requisito y el veredicto: qué falta, puntualmente; el cómo es del usuario. */
export function resumen(filas) {
  const lineas = filas.map((f) => {
    const version = f.version ? ` ${f.version}` : '';
    const viejo = f.estado === 'VIEJO' ? ` (hace falta ${f.minimo} o más)` : '';
    return `${f.estado.padEnd(8)} · ${f.nombre}${version}${viejo} — ${f.para}`;
  });
  const faltan = filas.filter((f) => f.estado === 'FALTA' || f.estado === 'VIEJO').map((f) => (f.estado === 'VIEJO' ? `${f.nombre} ${f.minimo} o más` : f.nombre));
  lineas.push(faltan.length > 0 ? `El instalador no puede seguir hasta que tengas: ${faltan.join(', ')}.` : 'Prerrequisitos completos.');
  return lineas.join('\n');
}

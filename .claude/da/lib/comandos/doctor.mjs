// `da doctor [--con-verify] [--con-worktree] [--sin-red] [--json]`: comprueba que
// la mecánica está bien instalada. Imprime una línea por comprobación
// (OK / FALLA / AVISO / OMITIDO) y sale con 0 si no hay FALLA, 1 si la hay,
// 2 si ni siquiera hay perfil.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { analizarArgumentos, dirDePlantillas, leerArbol, raizDelProyecto, versionDelKit } from '../entorno.mjs';
import { DOCUMENTOS_DEL_PLAN, estadoDelPlan } from '../instalar/plan.mjs';
import { cargarPerfil, cargarPlantillas, RUTA_MANIFIESTO } from './render.mjs';
import { construirVista } from '../vista.mjs';
import { planificarRender, LIMITE_CLAUDE_MD } from '../render.mjs';
import { manifiestoVacio } from '../manifiesto.mjs';
import { comprobarAnclas } from '../anclas.mjs';
import { ejecutar as binario, correr } from '../procesos.mjs';
import { correrPrerrequisitos } from '../prerrequisitos.mjs';
import { diferencia, etiquetasEsperadas } from '../etiquetas.mjs';
import { MARCA_KIT } from '../fusion.mjs';

const COLORES = new Set(['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'cyan']);
const MODELOS = new Set(['opus', 'sonnet', 'haiku', 'fable', 'inherit']);

function version(binarioNombre, args = ['--version']) {
  const r = binario(binarioNombre, args);
  return r.codigo === 0 ? `${r.stdout}${r.stderr}`.trim().split('\n')[0] : null;
}

function frontmatter(texto) {
  const m = /^---\n([\s\S]*?)\n---/.exec(texto);
  if (!m) return null;
  const campos = {};
  for (const linea of m[1].split('\n')) {
    const c = /^([\w-]+):\s*(.*)$/.exec(linea);
    if (c) campos[c[1]] = c[2].trim();
  }
  return campos;
}

export async function ejecutar(args, ctx) {
  const { opciones } = analizarArgumentos(args, { banderas: ['con-verify', 'con-worktree', 'sin-red', 'sin-maquina', 'json'] });
  const raiz = raizDelProyecto(opciones.raiz, ctx.cwd, ctx.baseDelKit);
  const resultados = [];
  const anotar = (nombre, estado, detalle = '') => resultados.push({ nombre, estado, detalle });
  const ok = (nombre, condicion, detalle = '') => anotar(nombre, condicion ? 'OK' : 'FALLA', condicion ? '' : detalle);

  // Herramientas: la misma lista que el instalador (`prerrequisitos.mjs`), para que no diverjan.
  // `--sin-maquina` las salta para juzgar solo el proyecto, como en el CI del kit,
  // cuyo runner no tiene ni claude ni la sesión de gh.
  if (opciones['sin-maquina']) anotar('prerrequisitos de la máquina', 'OMITIDO', '--sin-maquina');
  else {
    for (const f of correrPrerrequisitos()) {
      const nombre = `${f.nombre}${f.version ? ` ${f.version}` : ''}`;
      if (f.estado === 'OK') anotar(nombre, 'OK');
      else if (f.estado === 'OPCIONAL') anotar(nombre, 'AVISO', `no está; ${f.para}`);
      else anotar(nombre, 'FALLA', f.estado === 'VIEJO' ? `hace falta ${f.minimo} o más — ${f.para}` : `falta — ${f.para}`);
    }
  }

  // Perfil
  let perfil;
  try {
    perfil = cargarPerfil(raiz);
    anotar('perfil', 'OK', '.claude/desarrollo-autonomo.json válido');
  } catch (e) {
    anotar('perfil', 'FALLA', e.message.split('\n')[0]);
    imprimir(ctx, resultados, opciones.json);
    return 2;
  }
  const vista = construirVista(perfil, { version: versionDelKit(ctx.baseDelKit) });
  if (perfil.modulos.graft) {
    const graft = version('graft');
    ok(`graft${graft ? ` ${graft}` : ''}`, Boolean(graft), 'npm i -g @nanonets/graft; graft init');
  }
  if (!opciones['sin-red']) {
    const auth = binario('gh', ['auth', 'status']);
    ok('gh autenticado', auth.codigo === 0, 'gh auth login');
  } else anotar('gh autenticado', 'OMITIDO', '--sin-red');

  // Render al día y manifiesto
  try {
    const { indice, plantillas } = cargarPlantillas(opciones.plantillas ?? dirDePlantillas(ctx.baseDelKit));
    const manifiestoRuta = join(raiz, RUTA_MANIFIESTO);
    const manifiesto = existsSync(manifiestoRuta) ? JSON.parse(readFileSync(manifiestoRuta, 'utf8')) : manifiestoVacio('0');
    ok('manifiesto', existsSync(manifiestoRuta), 'corre da render');
    const plan = planificarRender({ indice, plantillas, vista, leer: (r) => (existsSync(join(raiz, r)) ? readFileSync(join(raiz, r), 'utf8') : null), manifiesto, version: vista.kit.version });
    const pendientes = plan.salidas.filter((s) => ['creado', 'actualizado', 'retirado'].includes(s.estado));
    const conflictos = plan.salidas.filter((s) => s.estado === 'conflicto');
    ok('render al día', pendientes.length === 0 && plan.errores.length === 0, pendientes.length ? `${pendientes.length} archivo(s) por renderizar: da render` : plan.errores.join('; '));
    ok('generados sin editar a mano', conflictos.length === 0, conflictos.map((c) => c.ruta).join(', '));
    if (manifiesto.kit && manifiesto.kit !== vista.kit.version) anotar('versión vendorizada', 'AVISO', `el proyecto se renderizó con el kit ${manifiesto.kit}; este da es ${vista.kit.version}`);
  } catch (e) {
    anotar('render', 'FALLA', e.message);
  }

  // settings.json
  const settingsRuta = join(raiz, '.claude/settings.json');
  if (existsSync(settingsRuta)) {
    const settings = JSON.parse(readFileSync(settingsRuta, 'utf8'));
    const hooks = (settings.hooks?.PreToolUse ?? []).flatMap((e) => e.hooks ?? []);
    const guardia = hooks.find((h) => typeof h.command === 'string' && h.command.includes(`${MARCA_KIT}/guardia.cjs`));
    ok('hook de la guardia en settings.json', Boolean(guardia));
    ok('timeout del hook razonable (segundos)', !guardia || guardia.timeout === undefined || guardia.timeout <= 60, `timeout ${guardia?.timeout}: va en segundos`);
    ok('deny Agent(fork)', (settings.permissions?.deny ?? []).includes('Agent(fork)'));
    ok('CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH', Boolean(settings.env?.CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH));
    ok('claudeMdExcludes de worktrees', (settings.claudeMdExcludes ?? []).some((g) => g.includes(perfil.rutas.worktrees)));
  } else anotar('settings.json', 'FALLA', 'no existe .claude/settings.json: da render');

  // Guardia: archivo, configuración y autoprueba
  const guardiaCjs = join(raiz, '.claude/da/guardia.cjs');
  const guardiaJson = join(raiz, '.claude/da/guardia.json');
  ok('guardia.cjs vendorizada', existsSync(guardiaCjs), 'copia nucleo/ a .claude/da/ (kit instalar)');
  ok('guardia.json generada', existsSync(guardiaJson), 'da render');
  if (existsSync(guardiaCjs) && existsSync(guardiaJson)) {
    try {
      const require = createRequire(import.meta.url);
      const g = require(guardiaCjs);
      const config = JSON.parse(readFileSync(guardiaJson, 'utf8'));
      const casos = [
        [g.evaluar('implementador', 'git commit -m x', config).deny, true],
        [g.evaluar('critico', 'git diff', config).deny, false],
        [g.evaluar('pm', 'cd /tmp', config).deny, true],
        [g.evaluar('implementador', `${config.da} verify`, config).deny, true],
        [g.evaluar('pm', `${config.da} verify`, config).deny, false],
        [g.evaluarAgent('team-manager', 'critico', config).deny, true],
        [g.evaluarAgent('team-manager', 'pm', config).deny, false],
      ];
      const fallidos = casos.filter(([a, b]) => a !== b).length;
      ok('autoprueba de la guardia (7 casos)', fallidos === 0, `${fallidos} caso(s) no responden como deben`);
    } catch (e) {
      anotar('autoprueba de la guardia', 'FALLA', e.message);
    }
  }

  // CLAUDE.md y anclas
  const claudeRuta = join(raiz, 'CLAUDE.md');
  if (existsSync(claudeRuta)) {
    const claude = readFileSync(claudeRuta, 'utf8');
    const bloques = (claude.match(/<!-- desarrollo-autonomo:inicio/g) ?? []).length;
    ok('un bloque de normas en CLAUDE.md', bloques === 1, `${bloques} bloque(s)`);
    ok(`CLAUDE.md ≤ 16 KB (${Buffer.byteLength(claude, 'utf8')} B)`, Buffer.byteLength(claude, 'utf8') <= LIMITE_CLAUDE_MD);
    for (const seccion of ['## Reglas innegociables de arquitectura', '## Convenciones']) ok(`CLAUDE.md tiene «${seccion}»`, claude.includes(seccion), 'sección del proyecto que los skills citan');
  } else anotar('CLAUDE.md', 'FALLA', 'no existe');
  try {
    const archivos = {};
    for (const ruta of ['CLAUDE.md', 'docs/DESARROLLO-AUTONOMO.md']) if (existsSync(join(raiz, ruta))) archivos[ruta] = readFileSync(join(raiz, ruta), 'utf8');
    for (const dir of ['.claude/agents', '.claude/skills']) {
      if (!existsSync(join(raiz, dir))) continue;
      for (const [rel, texto] of Object.entries(leerArbol(join(raiz, dir)))) {
        const ruta = `${dir}/${rel}`;
        if (ruta.startsWith('.claude/skills/') && !ruta.startsWith('.claude/skills/desarrollo-autonomo-')) continue;
        archivos[ruta] = texto;
      }
    }
    const rotas = comprobarAnclas(archivos);
    ok('anclas: toda cita resuelve', rotas.length === 0, rotas.slice(0, 3).join(' | '));
  } catch (e) {
    anotar('anclas', 'FALLA', e.message);
  }

  // Agentes
  const agentesDir = join(raiz, '.claude/agents');
  if (existsSync(agentesDir)) {
    const esperados = ['team-manager', 'planeador', 'pm', 'critico', 'archivador', 'lector', ...vista.variantes];
    const faltan = esperados.filter((a) => !existsSync(join(agentesDir, `${a}.md`)));
    ok('agentes de la mecánica presentes', faltan.length === 0, faltan.join(', '));
    const malos = [];
    for (const archivo of readdirSync(agentesDir).filter((f) => f.endsWith('.md'))) {
      const fm = frontmatter(readFileSync(join(agentesDir, archivo), 'utf8'));
      if (!fm || !fm.name) malos.push(`${archivo}: sin frontmatter`);
      else if (fm.model && !MODELOS.has(fm.model)) malos.push(`${archivo}: modelo ${fm.model}`);
      else if (fm.color && !COLORES.has(fm.color)) malos.push(`${archivo}: color ${fm.color}`);
    }
    ok('frontmatter de los agentes', malos.length === 0, malos.join('; '));
  } else anotar('agentes', 'FALLA', 'no existe .claude/agents: da render');

  // Skills
  const skillsDir = join(raiz, '.claude/skills');
  const requeridos = new Set([
    ...perfil.skills.precargados,
    ...perfil.skills.archivador,
    ...perfil.areas.flatMap((a) => (a.skills ?? []).map((s) => (typeof s === 'string' ? s : s.nombre))),
    'openspec-propose', 'openspec-apply-change', 'openspec-update-change', 'openspec-sync-specs', 'openspec-archive-change', 'openspec-explore',
  ]);
  const sinSkill = [...requeridos].filter((s) => !existsSync(join(skillsDir, s, 'SKILL.md')));
  ok(`skills requeridos (${requeridos.size})`, sinSkill.length === 0, sinSkill.length ? `faltan: ${sinSkill.join(', ')} (npx skills add … / openspec init)` : '');

  // Docs y plantilla de issue. El plan del proyecto (PLAN y STACK escritos
  // para él, no las semillas) es lo que /da-plan deja y /da-init exige.
  const plan = estadoDelPlan(Object.fromEntries(DOCUMENTOS_DEL_PLAN.map((d) => [d.ruta, existsSync(join(raiz, d.ruta)) ? readFileSync(join(raiz, d.ruta), 'utf8') : null])));
  ok('plan del proyecto (docs/PLAN.md, docs/STACK.md)', plan.listo, Object.entries(plan.faltas).map(([r, f]) => `${r}: ${f.join('; ')}`).join(' · ') || '');
  if (plan.recomendados.length > 0) anotar('docs recomendados', 'AVISO', `sin escribir: ${plan.recomendados.join(', ')} (/da-plan)`);
  ok(`${perfil.rutas.arquitectura}`, existsSync(join(raiz, perfil.rutas.arquitectura)), 'capas, contratos y pruebas (/da-plan)');
  ok(`${perfil.rutas.olas}/`, existsSync(join(raiz, perfil.rutas.olas)) && statSync(join(raiz, perfil.rutas.olas)).isDirectory(), 'mkdir y un .gitkeep');
  ok('.github/ISSUE_TEMPLATE/hallazgo.md', existsSync(join(raiz, '.github/ISSUE_TEMPLATE/hallazgo.md')));
  ok(`${perfil.rutas.openspec}/`, existsSync(join(raiz, perfil.rutas.openspec)), 'openspec init --tools claude');
  if (!perfil.worktree.comprobar) anotar('worktree.comprobar', 'AVISO', 'sin gancho comprobar el worktree no demuestra que prueba su propio código (L0)');

  // GitHub: etiquetas y squash
  if (!opciones['sin-red']) {
    const labels = binario('gh', ['label', 'list', '--json', 'name', '--limit', '300'], { cwd: raiz });
    if (labels.codigo === 0) {
      const { faltan } = diferencia(etiquetasEsperadas(perfil, vista), JSON.parse(labels.stdout).map((l) => l.name));
      ok('etiquetas de GitHub', faltan.length === 0, faltan.length ? `faltan ${faltan.length}: da etiquetas --aplicar` : '');
    } else anotar('etiquetas de GitHub', 'FALLA', labels.stderr.trim().split('\n')[0]);
    const repo = binario('gh', ['repo', 'view', '--json', 'squashMergeAllowed'], { cwd: raiz });
    if (repo.codigo === 0) ok('merge squash habilitado', JSON.parse(repo.stdout).squashMergeAllowed === true);
    else anotar('merge squash habilitado', 'FALLA', repo.stderr.trim().split('\n')[0]);
  } else {
    anotar('etiquetas de GitHub', 'OMITIDO', '--sin-red');
    anotar('merge squash habilitado', 'OMITIDO', '--sin-red');
  }

  // Opcionales
  if (opciones['con-verify']) {
    const r = correr(`${join(ctx.baseDelKit, 'da')} verify`, { cwd: raiz });
    ok('verify en verde', r.codigo === 0, r.codigo === 75 ? 'candado ocupado' : `exit ${r.codigo}`);
  }
  if (opciones['con-worktree']) {
    const ruta = join(raiz, perfil.rutas.worktrees, `doctor-${Date.now()}`);
    const montar = correr(`${join(ctx.baseDelKit, 'da')} worktree montar ${ruta} --rama doctor/${Date.now()} --desde HEAD`, { cwd: raiz });
    const quitar = montar.codigo === 0 ? correr(`${join(ctx.baseDelKit, 'da')} worktree quitar ${ruta}`, { cwd: raiz }) : { codigo: -1 };
    ok('worktree: montar → comprobar → quitar', montar.codigo === 0 && quitar.codigo === 0, `${montar.stdout}${montar.stderr}${quitar.stderr ?? ''}`.trim().split('\n').slice(-2).join(' | '));
  }

  imprimir(ctx, resultados, opciones.json);
  return resultados.some((r) => r.estado === 'FALLA') ? 1 : 0;
}

function imprimir(ctx, resultados, json) {
  if (json) {
    ctx.stdout(`${JSON.stringify(resultados, null, 2)}\n`);
    return;
  }
  for (const r of resultados) ctx.stdout(`${r.estado.padEnd(7)} · ${r.nombre}${r.detalle ? ` — ${r.detalle}` : ''}\n`);
  const cuenta = { OK: 0, FALLA: 0, AVISO: 0, OMITIDO: 0 };
  for (const r of resultados) cuenta[r.estado] = (cuenta[r.estado] ?? 0) + 1;
  ctx.stdout(`${cuenta.OK} OK · ${cuenta.FALLA} FALLA · ${cuenta.AVISO} AVISO · ${cuenta.OMITIDO} OMITIDO\n`);
}

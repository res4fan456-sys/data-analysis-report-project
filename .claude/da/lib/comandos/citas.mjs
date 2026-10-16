// `da citas [rutas…]` (módulo citas): recorre docs/*.md, CLAUDE.md, los skills
// de la mecánica y el código de las áreas del perfil, e imprime cada cita
// rota como `archivo:línea: texto`. 0 limpio · 1 hallazgos · 2 config.
//
// Alcance: rutas citadas y changes activos en `docs/*.md` (no en el
// histórico de olas) y en CLAUDE.md; secciones de CLAUDE.md citadas en docs,
// skills y agentes; en los comentarios del código de las áreas (y de
// .claude/da no, que es del kit): fuentes irresolubles, citas a
// openspec/changes/, genealogía e identificadores inexistentes. La lista
// blanca de identificadores es del proyecto: `.claude/da/citas-lista-blanca.txt`.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, relative, resolve } from 'node:path';
import { analizarArgumentos, raizDelProyecto } from '../entorno.mjs';
import { cargarPerfil } from './render.mjs';
import * as d from '../citas/detector.mjs';

const IGNORAR = new Set(['node_modules', '.git', '.venv', 'venv', 'dist', 'build', 'target', '__pycache__', '.pytest_cache', '.ruff_cache', 'coverage', '.claude', 'graft']);

function recorrer(dir, raiz, acumulado) {
  for (const nombre of readdirSync(dir)) {
    if (IGNORAR.has(nombre)) continue;
    const ruta = join(dir, nombre);
    const st = statSync(ruta);
    if (st.isDirectory()) recorrer(ruta, raiz, acumulado);
    else if (st.isFile()) acumulado.push(relative(raiz, ruta));
  }
  return acumulado;
}

function globAPrefijo(glob) {
  return glob.replace(/\/?\*\*?.*$/, '').replace(/\/+$/, '');
}

export async function ejecutar(args, ctx) {
  const { opciones, posicionales } = analizarArgumentos(args);
  const raiz = raizDelProyecto(opciones.raiz, ctx.cwd, ctx.baseDelKit);
  const perfil = cargarPerfil(raiz);
  const openspec = perfil.rutas.openspec.replace(/\/+$/, '');
  const olas = perfil.rutas.olas.replace(/\/+$/, '');
  // Prefijos citables: los directorios de primer nivel que existen y, además,
  // los que el perfil declara en `areas[].rutas` aunque aún no existan: así una
  // ruta `src/…` citada por el plan se revisa desde el primer día, y la que
  // cae bajo un área declarada pero todavía no existe es un aviso, no un error
  // (ni un silencio que se vuelve veinte errores al crear `src/`).
  const areas = perfil.areas.flatMap((a) => a.rutas.map(globAPrefijo)).filter(Boolean);
  const existentes = readdirSync(raiz).filter((n) => !n.startsWith('.') && !IGNORAR.has(n) && statSync(join(raiz, n)).isDirectory());
  const prefijos = [...new Set([...existentes, ...areas.map((p) => p.split('/')[0])])];
  // Las carpetas que gestiona OpenSpec existen aunque git no las versione vacías.
  const gestionadasPorOpenspec = new Set([openspec, `${openspec}/specs`, `${openspec}/changes`, `${openspec}/changes/archive`]);
  const bajoAreaDeclarada = (r) => areas.some((p) => r === p || r.startsWith(`${p}/`));
  const todos = recorrer(raiz, raiz, []);
  const seleccion = posicionales.length > 0 ? new Set(posicionales.map((p) => relative(raiz, resolve(ctx.cwd, p)))) : null;
  const dentro = (ruta) => !seleccion || seleccion.has(ruta) || [...seleccion].some((s) => ruta.startsWith(`${s}/`));

  const docs = todos.filter((r) => (r.startsWith('docs/') && r.endsWith('.md') && !r.startsWith(`${olas}/`)) || r === 'CLAUDE.md');
  const normativos = todos.filter((r) => r.startsWith('.claude/skills/desarrollo-autonomo-') || r.startsWith('.claude/agents/'));
  const codigo = todos.filter((r) => areas.some((p) => r === p || r.startsWith(`${p}/`)) && d.lexicoDe(r) && !r.endsWith('.md'));
  const skillsYAgentes = recorrer(join(raiz, '.claude'), raiz, []).filter((r) => r.startsWith('.claude/skills/desarrollo-autonomo-') || r.startsWith('.claude/agents/'));

  const listaBlancaRuta = join(raiz, '.claude/da/citas-lista-blanca.txt');
  const listaBlanca = new Set(existsSync(listaBlancaRuta) ? readFileSync(listaBlancaRuta, 'utf8').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#')) : []);
  const encabezados = existsSync(join(raiz, 'CLAUDE.md')) ? d.encabezadosDeMarkdown(readFileSync(join(raiz, 'CLAUDE.md'), 'utf8')) : [];
  const hallazgos = [];
  const avisos = [];
  const anotar = (ruta, linea, texto) => hallazgos.push(`${ruta}:${linea}: ${texto}`);

  // Docs: rutas rotas (con git check-ignore), change activo, secciones.
  const candidatasRotas = [];
  for (const ruta of docs.filter(dentro)) {
    readFileSync(join(raiz, ruta), 'utf8').split('\n').forEach((l, i) => {
      for (const citada of d.extraerRutas(l, prefijos)) {
        if (d.esCitaAChangeActivo(citada, openspec)) anotar(ruta, i + 1, `cita por ruta un change activo: ${citada} (cítalo por su nombre)`);
        else if (!existsSync(join(raiz, citada)) && !gestionadasPorOpenspec.has(citada.replace(/\/+$/, ''))) candidatasRotas.push({ ruta, linea: i + 1, citada });
      }
      for (const s of d.hallazgosDeSeccionInexistente(l, encabezados)) anotar(ruta, i + 1, `sección de CLAUDE.md que no existe: *${s}*`);
    });
  }
  if (candidatasRotas.length > 0) {
    // Una ruta que .gitignore excluye no cuenta como rota (un log, una captura sin versionar).
    const ignoradas = new Set(ejecutarCheckIgnore(raiz, candidatasRotas.map((c) => c.citada)));
    for (const c of candidatasRotas) {
      if (ignoradas.has(c.citada)) continue;
      if (bajoAreaDeclarada(c.citada.replace(/\/+$/, ''))) avisos.push(`${c.ruta}:${c.linea}: aviso: ruta declarada en el perfil, aún no existe: ${c.citada}`);
      else anotar(c.ruta, c.linea, `ruta que no existe: ${c.citada}`);
    }
  }
  // Skills y agentes: secciones de CLAUDE.md.
  for (const ruta of [...new Set([...normativos, ...skillsYAgentes])].filter(dentro)) {
    readFileSync(join(raiz, ruta), 'utf8').split('\n').forEach((l, i) => {
      for (const s of d.hallazgosDeSeccionInexistente(l, encabezados)) anotar(ruta, i + 1, `sección de CLAUDE.md que no existe: *${s}*`);
    });
  }
  // Código: comentarios.
  const indice = d.construirIndiceDeIdentificadores(codigo.flatMap((r) => d.lineasDeCodigo(readFileSync(join(raiz, r), 'utf8'), r)));
  for (const ruta of codigo.filter(dentro)) {
    const contenido = readFileSync(join(raiz, ruta), 'utf8');
    for (const c of d.lineasDeComentario(contenido, ruta)) {
      for (const f of d.buscarFuentesIrresolubles(c.texto)) anotar(ruta, c.linea, `fuente que nadie podrá abrir: «${f}»`);
      for (const ch of d.buscarCitasAChanges(c.texto, openspec)) anotar(ruta, c.linea, `cita a ${openspec}/changes/: ${ch}`);
      for (const g of d.buscarGenealogia(c.texto)) anotar(ruta, c.linea, `genealogía: «${g}»`);
      for (const id of d.hallazgosDeIdentificadorInexistente(c.texto, indice, listaBlanca)) anotar(ruta, c.linea, `identificador citado que no existe: \`${id}\``);
    }
  }
  const unicos = [...new Set(hallazgos)];
  const avisosUnicos = [...new Set(avisos)];
  if (avisosUnicos.length > 0) ctx.stdout(`${avisosUnicos.join('\n')}\n`);
  if (unicos.length === 0) {
    ctx.stdout(`citas: limpio (${docs.length} docs, ${codigo.length} archivos de código, ${skillsYAgentes.length} de la mecánica${avisosUnicos.length ? `; ${avisosUnicos.length} aviso(s)` : ''})\n`);
    return 0;
  }
  ctx.stdout(`${unicos.join('\n')}\ncitas: ${unicos.length} hallazgo(s)${avisosUnicos.length ? `, ${avisosUnicos.length} aviso(s)` : ''}\n`);
  return 1;
}

function ejecutarCheckIgnore(raiz, rutas) {
  const r = spawnSync('git', ['check-ignore', '--stdin'], { cwd: raiz, input: `${rutas.join('\n')}\n`, encoding: 'utf8' });
  if (r.status !== 0 && r.status !== 1) return [];
  return r.stdout.split('\n').map((l) => l.trim()).filter(Boolean);
}

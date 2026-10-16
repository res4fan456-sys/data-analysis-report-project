// `da medir <ola|'#issue'>` (módulo medicion): mide el coste de una ola (o del
// arreglo de una sola issue) para el registro: cuánta caché leyó cada rol,
// cuántas PRs entraron y de qué categoría, cuántas corridas de evidencia y
// hallazgos hubo, y cuánto costaron los minutos de Actions. La lógica pura
// vive en `../medir/*.mjs`, cada módulo con su test; este archivo es solo la
// cáscara que lee las transcripciones del disco y llama a `gh`.
//
// Uso:
//   da medir <ola>                                 # identificador de ola
//   da medir '#<issue>'                            # el arreglo de una sola issue/PR
//   da medir <ola> --transcripciones <dir>         # otra máquina
//   da medir <ola> --desde <iso> --hasta <iso>
//
// Imprime en stdout un bloque Markdown `## Coste` con las tablas Mecánica,
// Trabajo y Guardas. Un `gh` que falla se reporta por stderr y esa fuente
// queda vacía en el reporte, en vez de abortar el resto -- salvo el arreglo
// sin ninguna PR que lo mida, que sale con 1 (uso incorrecto de argumentos,
// código 2); una PR medida que sigue sin mergear, o una pasada de crítico
// cuyo formato el contrato vigente no reconoce, también avisan por stderr,
// sin abortar ni cambiar el código de salida.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { analizarArgumentos, raizDelProyecto } from '../entorno.mjs';
import { cargarPerfil } from './render.mjs';
import { ejecutar as ejecutarBinario } from '../procesos.mjs';
import { agregarPorRol, maximoPorMensaje, recortarSesion, resumenDeTrabajo, sesionesDelTrabajo, slugDeRuta } from '../medir/transcripciones.mjs';
import { avisosDePrsSinMergear, prsDeLaOla, prsDeProductoDeLaOla, prsDelArreglo } from '../medir/prs.mjs';
import { calcularVentana, calcularVentanaDeArreglo } from '../medir/ventana.mjs';
import { atribuirCacheLeida, datosDeUnaPr, datosMecanicaDe, filasTrabajoDe, leerLineaAsistente } from '../medir/coste.mjs';
import { renderTablaGuardas, renderTablaMecanica, renderTablaTrabajo } from '../medir/tablas.mjs';

const USO = "uso: da medir <ola|'#issue'> [--transcripciones <dir>] [--desde <iso>] [--hasta <iso>]";

/**
 * La raíz del checkout PRINCIPAL (nunca la de un worktree): el padre de
 * `git rev-parse --git-common-dir`, que desde cualquier worktree resuelve
 * al `.git` que todos comparten. Las transcripciones de Claude Code viven
 * bajo el slug de esa raíz, no el de cada worktree -- ninguno tiene su
 * propia carpeta en `~/.claude/projects/`.
 */
function raizDelCheckoutPrincipal(raiz, avisar) {
  const r = ejecutarBinario('git', ['rev-parse', '--path-format=absolute', '--git-common-dir'], { cwd: raiz });
  if (r.codigo !== 0) {
    avisar(`da medir: git rev-parse --git-common-dir falló -- ${r.stderr.trim()}`);
    return raiz;
  }
  return dirname(r.stdout.trim());
}

/**
 * Una sola pasada por el `.jsonl`: junta las líneas `assistant` ya reducidas
 * a lo que hace falta para tokens y, con las líneas `assistant`/`user`
 * completas todavía en memoria, calcula el resumen de trabajo contra las
 * PRs -- las líneas crudas en sí NUNCA salen de esta función: son la parte
 * pesada de una transcripción, y retenerlas todas a la vez para cada sesión
 * de la máquina llega a picos de varios GB.
 */
function leerLineasDeArchivo(ruta, prsParaSeleccion) {
  const asistente = [];
  const crudas = [];
  for (const lineaTexto of readFileSync(ruta, 'utf8').split('\n')) {
    if (lineaTexto.trim() === '') continue;
    let objeto;
    try {
      objeto = JSON.parse(lineaTexto);
    } catch {
      // Línea corrupta o cortada a mitad de escritura: se ignora, no aborta el resto del archivo.
      continue;
    }
    const lineaAsistente = leerLineaAsistente(objeto);
    if (lineaAsistente) asistente.push(lineaAsistente);
    if (objeto.type === 'assistant' || objeto.type === 'user') crudas.push(objeto);
  }
  return { asistente, resumen: resumenDeTrabajo(crudas, prsParaSeleccion) };
}

/**
 * Las sesiones de `directorio`: cada `.jsonl` de nivel superior es una
 * sesión raíz; cada `<raiz>/subagents/agent-*.jsonl` es la sesión de un
 * subagente de esa raíz, con su rol tomado de `agentType` en el
 * `.meta.json` que vive al lado (o `principal` si no hay meta o no trae
 * `agentType`), y su `parentAgentId` del mismo meta (o `undefined` si el
 * padre es la raíz).
 */
export function listarSesiones(directorio, prsParaSeleccion) {
  const sesiones = [];
  if (!existsSync(directorio)) return sesiones;

  for (const nombre of readdirSync(directorio)) {
    const ruta = join(directorio, nombre);
    const info = statSync(ruta);

    if (info.isFile() && nombre.endsWith('.jsonl')) {
      const raiz = nombre.replace(/\.jsonl$/, '');
      const { asistente, resumen } = leerLineasDeArchivo(ruta, prsParaSeleccion);
      sesiones.push({ id: raiz, raiz, esRaiz: true, parentAgentId: undefined, rol: 'principal', turnos: maximoPorMensaje(asistente), resumen });
      continue;
    }

    if (!info.isDirectory()) continue;
    const subagentes = join(ruta, 'subagents');
    if (!existsSync(subagentes)) continue;
    const raiz = nombre;

    for (const nombreAgente of readdirSync(subagentes)) {
      if (!nombreAgente.startsWith('agent-') || !nombreAgente.endsWith('.jsonl')) continue;
      const rutaAgente = join(subagentes, nombreAgente);
      const rutaMeta = rutaAgente.replace(/\.jsonl$/, '.meta.json');
      let rol = 'principal';
      let parentAgentId;
      if (existsSync(rutaMeta)) {
        try {
          const meta = JSON.parse(readFileSync(rutaMeta, 'utf8'));
          if (meta.agentType) rol = meta.agentType;
          if (typeof meta.parentAgentId === 'string') parentAgentId = meta.parentAgentId;
        } catch {
          // .meta.json corrupto: la sesión se cuenta como "principal" antes que perderla.
        }
      }
      const id = nombreAgente.replace(/^agent-/, '').replace(/\.jsonl$/, '');
      const { asistente, resumen } = leerLineasDeArchivo(rutaAgente, prsParaSeleccion);
      sesiones.push({ id, raiz, esRaiz: false, parentAgentId, rol, turnos: maximoPorMensaje(asistente), resumen });
    }
  }

  return sesiones;
}

export async function ejecutar(args, ctx) {
  let opciones;
  let posicionales;
  try {
    ({ opciones, posicionales } = analizarArgumentos(args));
  } catch (e) {
    ctx.stderr(`${e.message}\n${USO}\n`);
    return 2;
  }
  const objetivo = posicionales[0];
  if (!objetivo) {
    ctx.stderr(`${USO}\n`);
    return 2;
  }
  const esArreglo = objetivo.startsWith('#');
  const numeroDeArreglo = esArreglo ? Number(objetivo.slice(1)) : undefined;
  const ola = esArreglo ? undefined : objetivo;
  if (esArreglo && (!numeroDeArreglo || !Number.isInteger(numeroDeArreglo))) {
    ctx.stderr(`${USO}\n`);
    return 2;
  }

  const raiz = raizDelProyecto(opciones.raiz, ctx.cwd, ctx.baseDelKit);
  const perfil = cargarPerfil(raiz);
  const prefijoDeRama = perfil.git.ola;
  const ramaPrincipal = perfil.proyecto.ramaPrincipal;
  const etiquetaDeArreglo = perfil.etiquetas.carrilArreglo;
  const avisar = (texto) => ctx.stderr(`${texto}\n`);
  const ahora = ctx.ahora ?? new Date().toISOString();

  // `gh` por argumentos; en los tests se inyecta por `ctx.gh`. Devuelve el
  // JSON parseado, o `undefined` tras avisar por stderr si falló.
  const gh = (argumentos, descripcion) => {
    const r = ctx.gh ? ctx.gh(argumentos) : ejecutarBinario('gh', argumentos, { cwd: raiz });
    if (r.codigo !== 0) {
      avisar(`da medir: gh ${descripcion} falló -- ${(r.stderr || r.error?.message || '').trim()}`);
      return undefined;
    }
    return r.stdout;
  };
  const ghJson = (argumentos, descripcion) => {
    const salida = gh(argumentos, descripcion);
    if (salida === undefined) return undefined;
    try {
      return JSON.parse(salida);
    } catch (e) {
      avisar(`da medir: gh ${descripcion} no devolvió JSON -- ${e.message}`);
      return undefined;
    }
  };

  // --- PRs -------------------------------------------------------------------
  const todasLasPrs = ghJson(['pr', 'list', '--state', 'all', '--limit', '200', '--json', 'number,title,createdAt,mergedAt,additions,deletions,changedFiles,baseRefName,headRefName,closingIssuesReferences'], 'pr list') ?? [];
  const prsRelevantes = esArreglo ? prsDelArreglo(numeroDeArreglo, todasLasPrs) : prsDeLaOla(todasLasPrs, ola, prefijoDeRama);
  if (esArreglo && prsRelevantes.length === 0) {
    avisar(`da medir: ninguna PR mide el arreglo '#${numeroDeArreglo}' -- no es el número de una PR y ninguna PR trae esa issue en closingIssuesReferences. No se cuentan totales históricos como respaldo.`);
    return 1;
  }
  for (const aviso of avisosDePrsSinMergear(prsRelevantes)) avisar(aviso);

  // --- Ventana: la explícita manda; si no, la de la ola (rango de las PRs)
  // o, para un arreglo, la que abre en lo más temprano entre el primer
  // commit de cada PR y el etiquetado del carril de la issue que cierra -- la
  // issue ya trae esa etiqueta cuando el PM entra, y el PM commitea antes de
  // abrir la PR, así que `createdAt` de la PR por sí sola pierde ese tramo.
  const fechaDePrimerCommit = (numeroDePr) => {
    const datos = ghJson(['pr', 'view', String(numeroDePr), '--json', 'commits'], `pr view ${numeroDePr} --json commits`);
    // `authoredDate` primero: un rebase reescribe `committedDate` a la hora
    // del rebase, no de cuando el PM realmente escribió el commit.
    const fechas = (datos?.commits ?? []).map((c) => c.authoredDate ?? c.committedDate).filter((f) => typeof f === 'string');
    return fechas.length > 0 ? fechas.reduce((a, b) => (a < b ? a : b)) : undefined;
  };
  // `gh api` pagina de 30 en 30: una issue con muchos eventos puede dejar el
  // `labeled` del carril fuera de la primera página. `--paginate` las junta
  // todas, y `--jq` filtra el evento que hace falta antes de traerlo.
  const fechaDeEtiquetadoDeArreglo = (numeroDeIssue) => {
    const salida = gh(['api', '--paginate', `repos/{owner}/{repo}/issues/${numeroDeIssue}/events`, '--jq', `.[] | select(.event=="labeled" and .label.name=="${etiquetaDeArreglo}") | .created_at`], `api issues/${numeroDeIssue}/events`);
    const fechas = (salida ?? '').split('\n').map((l) => l.trim()).filter((l) => l !== '');
    return fechas.length > 0 ? fechas.reduce((a, b) => (a < b ? a : b)) : undefined;
  };
  const ventanaDelArreglo = (prs) => {
    const ventanasPorPr = prs.map((pr) => {
      const etiquetados = (pr.closingIssuesReferences ?? []).map((ref) => fechaDeEtiquetadoDeArreglo(ref.number)).filter((f) => f !== undefined);
      return calcularVentanaDeArreglo(
        { primerCommit: fechaDePrimerCommit(pr.number), etiquetado: etiquetados.length > 0 ? etiquetados.reduce((a, b) => (a < b ? a : b)) : undefined, prCreatedAt: pr.createdAt, prMergedAt: pr.mergedAt },
        ahora,
      );
    });
    let desde = ventanasPorPr[0].desde;
    let hasta = ventanasPorPr[0].hasta;
    for (const v of ventanasPorPr) {
      if (v.desde < desde) desde = v.desde;
      if (v.hasta > hasta) hasta = v.hasta;
    }
    return { desde, hasta };
  };
  const ventana = opciones.desde !== undefined || opciones.hasta !== undefined ? calcularVentana({ desde: opciones.desde, hasta: opciones.hasta }, prsRelevantes) : esArreglo ? ventanaDelArreglo(prsRelevantes) : calcularVentana({}, prsRelevantes);

  // --- Transcripciones ---------------------------------------------------------
  // Solo cuentan las sesiones que trabajaron una de las PRs medidas -- la
  // abrieron, o crearon/empujaron su rama (un PM relevado antes de abrir la
  // PR) -- y sus descendientes: cualquier otra sesión que compartiera la
  // ventana de tiempo sin haber trabajado esa PR queda fuera, aunque su rol
  // coincida.
  const prsParaSeleccion = prsRelevantes.map((pr) => ({ number: pr.number, headRefName: pr.headRefName }));
  const directorio = opciones.transcripciones ?? join(homedir(), '.claude', 'projects', slugDeRuta(raizDelCheckoutPrincipal(raiz, avisar)));
  const todasLasSesiones = listarSesiones(directorio, prsParaSeleccion);
  const { ids, prsSinSesion } = sesionesDelTrabajo(todasLasSesiones, prsParaSeleccion);
  for (const numero of prsSinSesion) {
    avisar(`da medir: ninguna sesión de estas transcripciones trabajó la PR #${numero}; sus tokens no se atribuyen a ningún rol (no se cuentan todas las sesiones como alternativa)`);
  }
  // `recortarSesion` saca `ctx0` del primer turno ANTES de recortar por la
  // ventana: una sesión cuyo trabajo empieza antes de que se abra (el PM o
  // el Planeador, que arrancan antes de la primera PR) tiene, tras el
  // recorte, un primer turno que ya no es el arranque en frío.
  const sesionesFiltradas = todasLasSesiones
    .filter((s) => ids.has(s.id))
    .map((s) => recortarSesion(s, ventana.desde, ventana.hasta))
    .filter((s) => s.turnos.length > 0);
  const agregadosPorRol = agregarPorRol(sesionesFiltradas);

  // --- PRs: evidencias, veredictos, líneas ---------------------------------------
  const datosPorPr = prsRelevantes.map((pr) => {
    const datos = ghJson(['pr', 'view', String(pr.number), '--json', 'body,comments,files'], `pr view ${pr.number}`) ?? {};
    const d = datosDeUnaPr(pr, datos);
    for (const aviso of d.avisos) avisar(aviso);
    return d;
  });

  // --- Actions ------------------------------------------------------------------
  const runs = ghJson(['run', 'list', '--limit', '200', '--json', 'workflowName,createdAt,updatedAt,event,headBranch'], 'run list') ?? [];

  // --- Atribución y render -----------------------------------------------------
  const cacheLeidaPorPasada = atribuirCacheLeida(sesionesFiltradas, prsRelevantes, ventana, { ventanaEntera: esArreglo && prsRelevantes.length === 1 });
  const datosMecanica = datosMecanicaDe({ agregadosPorRol, cacheLeidaPorPasada, datosPorPr, runs, ventana, ola, prefijoDeRama, ramaPrincipal, esArreglo });

  // La tabla Trabajo solo lleva PRs con trabajo de producto: en una ola, las
  // internas y la de cierre; en un arreglo, todas las suyas.
  const numerosDeProducto = new Set((esArreglo ? prsRelevantes : prsDeProductoDeLaOla(prsRelevantes, ola, prefijoDeRama)).map((pr) => pr.number));
  const filasTrabajo = filasTrabajoDe(datosPorPr.filter((d) => numerosDeProducto.has(d.pr.number)), cacheLeidaPorPasada);

  const suiteCfg = perfil.modulos.suiteDeSistema;
  const suite = suiteCfg && typeof suiteCfg === 'object' ? suiteCfg.nombre || 'Suite de sistema' : false;
  ctx.stdout(`${['## Coste', '', renderTablaMecanica(datosMecanica, { ramaPrincipal }), '', renderTablaTrabajo(filasTrabajo), '', renderTablaGuardas({ suite })].join('\n')}\n`);
  return 0;
}

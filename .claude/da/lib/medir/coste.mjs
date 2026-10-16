// El armado de `## Coste` a partir de datos ya leídos: la atribución de caché
// leída del PM y del crítico a cada PR, los minutos de Actions por workflow,
// los agregados de la tabla Mecánica y las filas de la tabla Trabajo.
// Funciones puras; leer transcripciones y llamar a `gh` es de
// `comandos/medir.mjs`.

import { sumaCacheLeida, filaMecanicaDeAgregado } from './transcripciones.mjs';
import { categoriaDeMergeDeLaOla, contarCorridasDeEvidencia, esPasadaDeVeredicto, hallazgosDeVeredicto, lineasDeProductoYTest, veredictoSinFormatoNumerado } from './prs.mjs';

export function horasEntre(desdeIso, hastaIso) {
  return (new Date(hastaIso).getTime() - new Date(desdeIso).getTime()) / (1000 * 60 * 60);
}

/**
 * Una línea `type: "assistant"` de un `.jsonl`, reducida a lo que hace falta
 * para tokens; `undefined` si la línea no es de asistente o no trae uso.
 */
export function leerLineaAsistente(objeto) {
  if (objeto.type !== 'assistant') return undefined;
  const mensaje = objeto.message;
  const uso = mensaje?.usage;
  const id = mensaje?.id;
  if (typeof id !== 'string' || !uso || typeof uso !== 'object') return undefined;
  const numero = (campo) => (typeof uso[campo] === 'number' ? uso[campo] : 0);
  return {
    messageId: id,
    modelo: typeof mensaje.model === 'string' ? mensaje.model : 'desconocido',
    uso: {
      input_tokens: numero('input_tokens'),
      output_tokens: numero('output_tokens'),
      cache_creation_input_tokens: numero('cache_creation_input_tokens'),
      cache_read_input_tokens: numero('cache_read_input_tokens'),
    },
    timestamp: typeof objeto.timestamp === 'string' ? objeto.timestamp : '',
  };
}

/**
 * Lo que una PR aporta al coste, a partir de su cuerpo, sus comentarios y
 * sus archivos (`gh pr view --json body,comments,files`): horas abierta
 * hasta el merge, corridas de evidencia (en el cuerpo o en cualquier
 * comentario), pasadas de veredicto y sus hallazgos, y líneas de producto y
 * de test. `avisos` trae una línea por pasada cuyo formato el contrato no
 * reconoce: sus hallazgos no se cuentan (`hallazgosDeVeredicto` decide en un
 * solo sitio, así que el aviso y la suma nunca discrepan).
 */
export function datosDeUnaPr(pr, { body = '', comments = [], files = [] }) {
  const { producto, test } = lineasDeProductoYTest(files);
  const veredictos = comments.filter(esPasadaDeVeredicto);
  const avisos = [];
  const hallazgos = veredictos.reduce(
    (acumulado, comentario, indice) => {
      if (veredictoSinFormatoNumerado(comentario.body)) {
        avisos.push(`da medir: la PR #${pr.number}, pasada ${indice + 1}, no sigue el formato numerado de hallazgos -- sus BLOQUEA/NO BLOQUEA de esa pasada no se cuentan`);
      }
      const conteo = hallazgosDeVeredicto(comentario.body);
      return { bloquea: acumulado.bloquea + conteo.bloquea, noBloquea: acumulado.noBloquea + conteo.noBloquea };
    },
    { bloquea: 0, noBloquea: 0 },
  );
  const corridasDeEvidencia = contarCorridasDeEvidencia(body) + comments.reduce((suma, comentario) => suma + contarCorridasDeEvidencia(comentario.body), 0);
  return {
    pr,
    horasAbiertaAMerge: pr.mergedAt ? horasEntre(pr.createdAt, pr.mergedAt) : 0,
    corridasDeEvidencia,
    pasadasDeVeredicto: veredictos.length,
    bloquea: hallazgos.bloquea,
    noBloquea: hallazgos.noBloquea,
    producto,
    test,
    avisos,
  };
}

/** Minutos de Actions por workflow, de los runs (`gh run list --json workflowName,createdAt,updatedAt`) creados dentro de la ventana. */
export function minutosDeActionsPorWorkflow(runs, ventana) {
  const porWorkflow = new Map();
  for (const run of runs) {
    if (ventana.desde && run.createdAt < ventana.desde) continue;
    if (ventana.hasta && run.createdAt > ventana.hasta) continue;
    const minutos = (new Date(run.updatedAt).getTime() - new Date(run.createdAt).getTime()) / (1000 * 60);
    porWorkflow.set(run.workflowName, (porWorkflow.get(run.workflowName) ?? 0) + minutos);
  }
  return [...porWorkflow.entries()].map(([workflow, minutos]) => ({ workflow, minutos }));
}

/** Si las ventanas `[createdAt, mergedAt]` de las PRs mergeadas no se solapan: solo entonces un turno cae en una sola PR y se le puede atribuir. */
export function ventanasNoSeSuperponen(prs) {
  const ordenadas = prs.filter((pr) => pr.mergedAt !== null && pr.mergedAt !== undefined).sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
  for (let i = 1; i < ordenadas.length; i += 1) {
    if (ordenadas[i].createdAt < ordenadas[i - 1].mergedAt) return false;
  }
  return true;
}

/**
 * Atribución de caché leída del PM y del crítico a una PR concreta: solo
 * cuando las ventanas de las PRs relevantes no se superponen -- si se
 * superponen, un turno cae dentro de más de una y atribuirlo a una sola
 * mentiría. En un arreglo con UNA sola PR, la ventana de atribución es la
 * del arreglo entero (`ventana`), no `[createdAt, mergedAt]` de la PR: el
 * trabajo del PM empieza antes de abrir la PR, y cortar ahí pierde ese
 * tramo. Con más de una PR (varias PRs cerrando la misma issue) o en una
 * ola, cada PR usa su propio `[createdAt, mergedAt]`: darle a cada una la
 * ventana entera duplicaría la caché leída del PM entre ellas.
 * @param {object[]} sesiones sesiones ya recortadas (`{rol, turnos}`)
 * @param {object[]} prs PRs relevantes
 * @param {{desde?: string, hasta?: string}} ventana
 * @param {{ventanaEntera?: boolean, roles?: string[]}} [opciones]
 */
export function atribuirCacheLeida(sesiones, prs, ventana, { ventanaEntera = false, roles = ['pm', 'critico'] } = {}) {
  if (!ventanasNoSeSuperponen(prs)) return [];
  const atribuciones = [];
  for (const rol of roles) {
    const turnosDelRol = sesiones.filter((s) => s.rol === rol).flatMap((s) => s.turnos);
    for (const pr of prs) {
      if (!pr.mergedAt) continue;
      const desde = ventanaEntera ? (ventana.desde ?? pr.createdAt) : pr.createdAt;
      const hasta = ventanaEntera ? (ventana.hasta ?? pr.mergedAt) : pr.mergedAt;
      const cacheLeida = sumaCacheLeida(turnosDelRol.filter((t) => t.timestamp >= desde && t.timestamp <= hasta));
      if (cacheLeida > 0) atribuciones.push({ rol, pr: pr.number, cacheLeida });
    }
  }
  return atribuciones;
}

/**
 * Los datos de la tabla Mecánica. La categoría de merge a la rama principal
 * de una PR: en un arreglo, todas son `cierre-o-arreglo` -- una sola issue,
 * sin rama de ola que distinga planeación de cierre. En una ola, la da la
 * rama o el título (`categoriaDeMergeDeLaOla`) -- nunca los archivos que
 * toca, que es lo que usa `pr-dominio` y clasificaría una PR de planeación
 * que edita el plan como si fuera del usuario.
 */
export function datosMecanicaDe({ agregadosPorRol, cacheLeidaPorPasada, datosPorPr, runs, ventana, ola, prefijoDeRama, ramaPrincipal, esArreglo }) {
  const categoriaDePr = (pr) => (esArreglo ? 'cierre-o-arreglo' : categoriaDeMergeDeLaOla(pr, ola, prefijoDeRama));
  const mergeadas = datosPorPr.filter((d) => d.pr.baseRefName === ramaPrincipal && d.pr.mergedAt);
  const mergesDe = (categoria) => mergeadas.filter((d) => categoriaDePr(d.pr) === categoria).length;
  const horasDe = (categoria) => {
    const delGrupo = mergeadas.filter((d) => categoriaDePr(d.pr) === categoria);
    return delGrupo.length === 0 ? 0 : delGrupo.reduce((suma, d) => suma + d.horasAbiertaAMerge, 0) / delGrupo.length;
  };
  return {
    porRol: agregadosPorRol.map(filaMecanicaDeAgregado),
    cacheLeidaPorPasada,
    prsAGithub: datosPorPr.length,
    mergesCierreOArreglo: mergesDe('cierre-o-arreglo'),
    mergesPlaneacionYArchivado: mergesDe('planeacion-o-archivado'),
    horasDeEsperaCierreOArreglo: horasDe('cierre-o-arreglo'),
    horasDeEsperaPlaneacionYArchivado: horasDe('planeacion-o-archivado'),
    corridasDeEvidencia: datosPorPr.reduce((suma, d) => suma + d.corridasDeEvidencia, 0),
    pasadasDeCritico: datosPorPr.reduce((suma, d) => suma + d.pasadasDeVeredicto, 0),
    bloqueaTotal: datosPorPr.reduce((suma, d) => suma + d.bloquea, 0),
    noBloqueaTotal: datosPorPr.reduce((suma, d) => suma + d.noBloquea, 0),
    minutosDeActionsPorWorkflow: minutosDeActionsPorWorkflow(runs, ventana),
  };
}

/**
 * Las filas de la tabla Trabajo: solo PRs con trabajo de producto (las que
 * trae `datosDeProducto`), con la caché leída del PM atribuida a cada una
 * repartida por línea de producto y de test.
 */
export function filasTrabajoDe(datosDeProducto, cacheLeidaPorPasada) {
  const cachePmDe = (pr) => cacheLeidaPorPasada.find((c) => c.rol === 'pm' && c.pr === pr)?.cacheLeida ?? 0;
  return datosDeProducto.map((d) => {
    const cacheLeidaPm = cachePmDe(d.pr.number);
    const lineasProducto = d.producto.additions + d.producto.deletions;
    const lineasTest = d.test.additions + d.test.deletions;
    return {
      pr: d.pr.number,
      cacheLeidaPorLineaProducto: lineasProducto > 0 ? cacheLeidaPm / lineasProducto : 0,
      horasPorLineaProducto: lineasProducto > 0 ? d.horasAbiertaAMerge / lineasProducto : 0,
      cacheLeidaPorLineaTest: lineasTest > 0 ? cacheLeidaPm / lineasTest : 0,
      horasPorLineaTest: lineasTest > 0 ? d.horasAbiertaAMerge / lineasTest : 0,
    };
  });
}

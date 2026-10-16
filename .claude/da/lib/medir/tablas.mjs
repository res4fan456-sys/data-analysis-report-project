// Las tres tablas de `## Coste` (Mecánica, Trabajo, Guardas): funciones
// puras que reciben los datos ya calculados (agregados por rol, por PR, de
// Actions) y devuelven el bloque Markdown listo para pegar en stdout. La
// cáscara (`comandos/medir.mjs`) es quien junta esos datos desde las
// transcripciones y `gh`.

import { formatearCifra, tablaMarkdown } from './formato.mjs';

/**
 * La tabla Mecánica: ctx0 y caché (escrita/leída, aparte) por rol, caché
 * leída de quien revisa por PR, y los agregados de la ola (PRs a GitHub,
 * merges y horas de espera a la rama principal -- de cierre/arreglo aparte
 * de planeación/archivado, para no mezclar en una sola cifra lo que decide
 * el usuario con lo que mergean otras manos --, corridas de evidencia,
 * pasadas de crítico, minutos de Actions por workflow). Nunca una fila de
 * "tokens de trabajo": `input_tokens`/`output_tokens` no son una señal
 * fiable (`transcripciones.mjs`). Una fila por dato, «Métrica | Valor»: la
 * granularidad de cada uno es distinta (por rol, por PR, por workflow, o un
 * solo agregado de la ola), así que una tabla de dos columnas los aloja a
 * todos sin forzar columnas que la mayoría de las filas dejarían vacías.
 * @param {object} datos
 * @param {{ramaPrincipal?: string}} [opciones]
 */
export function renderTablaMecanica(datos, { ramaPrincipal = 'main' } = {}) {
  const filas = [];
  for (const fila of datos.porRol) {
    filas.push([`ctx0 — ${fila.rol}`, formatearCifra(fila.ctx0)]);
    filas.push([`caché escrita — ${fila.rol}`, formatearCifra(fila.cacheEscrita)]);
    filas.push([`caché leída — ${fila.rol}`, formatearCifra(fila.cacheLeida)]);
  }
  for (const pasada of datos.cacheLeidaPorPasada) {
    filas.push([`caché leída — ${pasada.rol} — PR #${pasada.pr}`, formatearCifra(pasada.cacheLeida)]);
  }
  filas.push(['PRs a GitHub', `${datos.prsAGithub}`]);
  filas.push([`Merges a ${ramaPrincipal} — cierre o arreglo`, `${datos.mergesCierreOArreglo}`]);
  filas.push([`Merges a ${ramaPrincipal} — planeación y archivado`, `${datos.mergesPlaneacionYArchivado}`]);
  filas.push(['Horas de espera (promedio) — cierre o arreglo', datos.horasDeEsperaCierreOArreglo.toFixed(1)]);
  filas.push(['Horas de espera (promedio) — planeación y archivado', datos.horasDeEsperaPlaneacionYArchivado.toFixed(1)]);
  filas.push(['Corridas de evidencia', `${datos.corridasDeEvidencia}`]);
  filas.push(['Pasadas de crítico', `${datos.pasadasDeCritico}`]);
  filas.push(['BLOQUEA en veredictos', `${datos.bloqueaTotal}`]);
  filas.push(['NO BLOQUEA en veredictos', `${datos.noBloqueaTotal}`]);
  for (const actions of datos.minutosDeActionsPorWorkflow) {
    filas.push([`Actions — ${actions.workflow}`, `${formatearCifra(actions.minutos)} min`]);
  }
  return ['### Mecánica', '', tablaMarkdown(['Métrica', 'Valor'], filas)].join('\n');
}

/** La tabla Trabajo: caché leída (del PM, atribuida) y horas por línea de diff, de producto y de test, una fila por PR de producto (internas y la de cierre, o las del arreglo). */
export function renderTablaTrabajo(filas) {
  const cuerpo = filas.map((fila) => [
    `#${fila.pr}`,
    formatearCifra(fila.cacheLeidaPorLineaProducto),
    fila.horasPorLineaProducto.toFixed(1),
    formatearCifra(fila.cacheLeidaPorLineaTest),
    fila.horasPorLineaTest.toFixed(1),
  ]);
  const encabezados = ['PR', 'Caché leída/línea (producto)', 'Horas/línea (producto)', 'Caché leída/línea (test)', 'Horas/línea (test)'];
  return ['### Trabajo', '', tablaMarkdown(encabezados, cuerpo)].join('\n');
}

/**
 * La tabla Guardas: sin fuente automática todavía -- `Se coló` y `BLOQUEA
 * de código` salen del registro de la ola, que este comando no lee; la
 * suite al cierre (solo si el proyecto tiene suite de sistema) sale de la
 * evidencia de la PR de cierre. Deja las filas marcadas para que quien arma
 * el reporte final las rellene a mano.
 * @param {{suite?: string|false}} [opciones] nombre de la suite de sistema, o `false` si el proyecto no tiene
 */
export function renderTablaGuardas({ suite = false } = {}) {
  const filas = [
    ['Se coló', '(rellenar desde el registro)'],
    ['BLOQUEA de código', '(rellenar desde el registro)'],
  ];
  if (suite) filas.push([`${suite} al cierre`, '(rellenar)']);
  return ['### Guardas', '', tablaMarkdown(['Guarda', 'Valor'], filas)].join('\n');
}

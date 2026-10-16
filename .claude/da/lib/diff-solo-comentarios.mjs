// ¿Lo que cambió entre dos versiones de un archivo es solo comentarios y
// espacio? Pura: compara las líneas que no son comentario, con el espacio
// colapsado. Una línea de código con un comentario al final cuenta como
// código (heurística conservadora: ante la duda, «hay código»).

import { lineasDeCodigo, lexicoDe } from './citas/detector.mjs';

const PATRONES_DE_TEST = [/(^|\/)tests?\//, /(^|\/)__tests__\//, /(^|\/)test_[^/]+\.py$/, /_test\.py$/, /\.test\.[cm]?[jt]sx?$/, /\.spec\.[cm]?[jt]sx?$/, /_test\.go$/, /(^|\/)e2e\//];

function normalizar(lineas) {
  return lineas.map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n');
}

/**
 * @returns {'solo-comentarios'|'codigo'|'sin-lexico'}
 */
export function clasificarCambio(ruta, antes, despues) {
  if (!lexicoDe(ruta)) return 'sin-lexico';
  return normalizar(lineasDeCodigo(antes ?? '', ruta)) === normalizar(lineasDeCodigo(despues ?? '', ruta)) ? 'solo-comentarios' : 'codigo';
}

export function esDeTest(ruta) {
  return PATRONES_DE_TEST.some((p) => p.test(ruta));
}

/**
 * Clasifica una lista de archivos cambiados.
 * @param {Array<{ruta: string, antes: string|null, despues: string|null}>} cambios
 * @param {string[]} sinCodigo prefijos que no son producto (docs/, openspec/, imgs/, .claude/)
 * @returns {{producto: Array<{ruta, clase}>, tests: string[], ignorados: string[], soloComentarios: boolean}}
 */
export function clasificarCambios(cambios, sinCodigo) {
  const producto = [];
  const tests = [];
  const ignorados = [];
  for (const c of cambios) {
    if (sinCodigo.some((p) => c.ruta.startsWith(p))) {
      ignorados.push(c.ruta);
      continue;
    }
    if (esDeTest(c.ruta)) {
      tests.push(c.ruta);
      continue;
    }
    producto.push({ ruta: c.ruta, clase: clasificarCambio(c.ruta, c.antes, c.despues) });
  }
  return { producto, tests, ignorados, soloComentarios: producto.every((p) => p.clase === 'solo-comentarios') };
}

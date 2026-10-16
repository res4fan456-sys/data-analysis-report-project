// El manifiesto (`.claude/da/manifiesto.json`) recuerda qué dejó el kit en el
// proyecto y con qué hash, para distinguir «lo generó el kit» de «lo editó
// alguien» al volver a renderizar.

import { createHash } from 'node:crypto';

export function hashDe(texto) {
  return createHash('sha256').update(texto, 'utf8').digest('hex');
}

/**
 * Estado de un archivo generado.
 * @returns {'creado'|'igual'|'actualizado'|'conflicto'}
 */
export function estadoDeGenerado({ actual, nuevo, hashRegistrado }) {
  if (actual === null || actual === undefined) return 'creado';
  if (actual === nuevo) return 'igual';
  if (hashRegistrado && hashDe(actual) === hashRegistrado) return 'actualizado';
  return 'conflicto';
}

/**
 * Estado de una semilla: se crea una vez y nunca se pisa; si la semilla del kit
 * cambió desde que se sembró, solo se avisa.
 * @returns {{estado: 'creado'|'omitido', aviso?: string}}
 */
export function estadoDeSembrado({ actual, nuevo, hashSemilla }) {
  if (actual === null || actual === undefined) return { estado: 'creado' };
  if (hashSemilla && hashDe(nuevo) !== hashSemilla) {
    return { estado: 'omitido', aviso: 'la semilla del kit cambió desde que se sembró; compara a mano si te interesa' };
  }
  return { estado: 'omitido' };
}

export function manifiestoVacio(version) {
  return { kit: version, archivos: {} };
}

// El planificador del render: dado el índice de plantillas, la vista y lo que
// hay en disco, decide qué archivo se crea, se actualiza, se deja (semilla),
// se retira o está en conflicto. Es lógica pura; la cáscara que lee y escribe
// vive en comandos/render.mjs.

import { renderizar } from './plantillas.mjs';
import { estadoDeGenerado, estadoDeSembrado, hashDe } from './manifiesto.mjs';
import { fusionarClaudeMd, fusionarGitignore, fusionarSettings } from './fusion.mjs';
import { GENERADORES } from './generadores.mjs';

export const LIMITE_CLAUDE_MD = 16 * 1024;

function valorEn(objeto, ruta) {
  return ruta.split('.').reduce((v, k) => (v !== null && v !== undefined ? v[k] : undefined), objeto);
}

function esVerdadero(valor) {
  if (valor === undefined || valor === null || valor === false || valor === 0 || valor === '') return false;
  if (Array.isArray(valor)) return valor.length > 0;
  return true;
}

function parcialesDe(plantillas) {
  const parciales = {};
  for (const [ruta, texto] of Object.entries(plantillas)) {
    if (ruta.startsWith('comun/')) parciales[ruta.replace(/\.[^.]+$/, '')] = texto;
  }
  return parciales;
}

/**
 * @param {object} p
 * @param {Array<{plantilla: string, salida: string, tipo: string, porArea?: boolean, requiere?: string, semilla?: string}>} p.indice
 * @param {Record<string, string>} p.plantillas ruta relativa → texto
 * @param {object} p.vista
 * @param {(ruta: string) => string|null} p.leer contenido actual de una ruta del proyecto
 * @param {{kit: string, archivos: Record<string, object>, expulsados?: string[]}} p.manifiesto
 * @param {string} p.version versión del kit
 */
export function planificarRender({ indice, plantillas, vista, leer, manifiesto, version }) {
  const parciales = parcialesDe(plantillas);
  const salidas = [];
  const errores = [];
  const nuevo = { kit: version, archivos: {}, expulsados: [...(manifiesto.expulsados ?? [])] };
  const expulsados = new Set(nuevo.expulsados);
  const producidas = new Set();

  const render = (nombre, datos) => {
    const texto = plantillas[nombre];
    if (typeof texto !== 'string') throw new Error(`plantilla ausente en el índice: ${nombre}`);
    return renderizar(texto, datos, { nombre, parciales });
  };

  const emitir = (ruta, tipo, datos, entrada) => {
    if (expulsados.has(ruta)) {
      salidas.push({ ruta, tipo, estado: 'expulsado', contenido: null });
      producidas.add(ruta);
      return;
    }
    const actual = leer(ruta);
    const registrado = manifiesto.archivos[ruta];
    let contenido;
    let estado;
    let aviso;
    switch (tipo) {
      case 'generado': {
        contenido = render(entrada.plantilla, datos);
        estado = estadoDeGenerado({ actual, nuevo: contenido, hashRegistrado: registrado?.hash });
        nuevo.archivos[ruta] = { tipo, hash: estado === 'conflicto' ? registrado?.hash : hashDe(contenido) };
        break;
      }
      case 'sembrado': {
        contenido = render(entrada.plantilla, datos);
        const r = estadoDeSembrado({ actual, nuevo: contenido, hashSemilla: registrado?.hashSemilla });
        estado = r.estado;
        aviso = r.aviso;
        nuevo.archivos[ruta] = { tipo, hashSemilla: estado === 'creado' ? hashDe(contenido) : registrado?.hashSemilla ?? hashDe(contenido) };
        break;
      }
      case 'claude-md': {
        const bloque = render(entrada.plantilla, datos);
        const semilla = entrada.semilla ? render(entrada.semilla, datos) : '';
        const r = fusionarClaudeMd(actual, bloque, { version, semilla });
        contenido = r.contenido;
        estado = r.estado;
        if (Buffer.byteLength(contenido, 'utf8') > LIMITE_CLAUDE_MD) {
          errores.push(`CLAUDE.md pesaría ${Buffer.byteLength(contenido, 'utf8')} B, por encima de ${LIMITE_CLAUDE_MD} (16 KB): recorta el bloque o las secciones del proyecto`);
        }
        nuevo.archivos[ruta] = { tipo, hash: hashDe(contenido) };
        break;
      }
      case 'settings': {
        const aporte = JSON.parse(render(entrada.plantilla, datos));
        let actualJson = null;
        if (actual !== null) {
          try {
            actualJson = JSON.parse(actual);
          } catch (e) {
            errores.push(`${ruta}: no es JSON válido (${e.message})`);
            return;
          }
        }
        const r = fusionarSettings(actualJson, aporte);
        contenido = `${JSON.stringify(r.settings, null, 2)}\n`;
        estado = actual === null ? 'creado' : r.cambios.length === 0 && contenido === actual ? 'igual' : 'actualizado';
        nuevo.archivos[ruta] = { tipo, hash: hashDe(contenido) };
        break;
      }
      case 'gitignore': {
        const lineas = render(entrada.plantilla, datos).split('\n').map((l) => l.trim()).filter(Boolean);
        contenido = fusionarGitignore(actual, lineas);
        estado = actual === null ? 'creado' : contenido === actual ? 'igual' : 'actualizado';
        nuevo.archivos[ruta] = { tipo, hash: hashDe(contenido) };
        break;
      }
      case 'generador': {
        const generador = GENERADORES[entrada.generador];
        if (!generador) throw new Error(`generador desconocido en el índice: ${entrada.generador}`);
        const generados = Object.entries(nuevo.archivos).filter(([, r]) => r.tipo === 'generado').map(([r]) => r);
        contenido = generador(datos, { generados });
        estado = estadoDeGenerado({ actual, nuevo: contenido, hashRegistrado: registrado?.hash });
        nuevo.archivos[ruta] = { tipo: 'generado', hash: estado === 'conflicto' ? registrado?.hash : hashDe(contenido) };
        break;
      }
      default:
        throw new Error(`tipo de salida desconocido en el índice: ${tipo} (${ruta})`);
    }
    producidas.add(ruta);
    salidas.push({ ruta, tipo, estado, contenido, ...(aviso ? { aviso } : {}) });
  };

  for (const entrada of indice) {
    if (entrada.requiere && !esVerdadero(valorEn(vista, entrada.requiere))) continue;
    try {
      if (entrada.porArea) {
        for (const area of vista.areas) {
          const datos = { ...vista, area };
          emitir(renderizar(entrada.salida, datos, { nombre: `${entrada.plantilla} (salida)` }), entrada.tipo, datos, entrada);
        }
      } else {
        const salida = entrada.salidaEsPlantilla ? renderizar(entrada.salida, vista, { nombre: `${entrada.plantilla ?? entrada.generador} (salida)` }) : entrada.salida;
        emitir(salida, entrada.tipo, vista, entrada);
      }
    } catch (e) {
      errores.push(e.message);
    }
  }

  for (const [ruta, registro] of Object.entries(manifiesto.archivos)) {
    if (producidas.has(ruta) || registro.tipo !== 'generado') {
      if (!producidas.has(ruta)) nuevo.archivos[ruta] = registro;
      continue;
    }
    const actual = leer(ruta);
    if (actual === null) continue;
    if (hashDe(actual) === registro.hash) {
      salidas.push({ ruta, tipo: 'generado', estado: 'retirado', contenido: null });
    } else {
      salidas.push({ ruta, tipo: 'generado', estado: 'conflicto', contenido: null, aviso: 'el kit ya no genera este archivo, pero alguien lo editó: bórralo o expúlsalo' });
      nuevo.archivos[ruta] = registro;
    }
  }

  return { salidas, manifiesto: nuevo, errores };
}

/** Resumen de un plan para la terminal: una línea por archivo y los totales. */
export function resumirPlan(plan) {
  const lineas = plan.salidas.map((s) => `${s.estado.padEnd(11)} ${s.ruta}${s.aviso ? `  ← ${s.aviso}` : ''}`);
  const cuenta = {};
  for (const s of plan.salidas) cuenta[s.estado] = (cuenta[s.estado] ?? 0) + 1;
  const totales = Object.entries(cuenta).map(([k, v]) => `${v} ${k}`).join(' · ');
  return `${lineas.join('\n')}\n${totales}`;
}

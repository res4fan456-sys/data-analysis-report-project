// Motor de plantillas del kit: lo mínimo para renderizar prosa normativa desde
// el perfil sin meter lógica en las plantillas.
//
//   {{ruta.a.valor}}      variable; error si no existe   {{ruta?}} opcional
//   {{#si x}}…{{#sino}}…{{/si}}   también {{#si no x}}
//   {{#cada xs como x}}…{{/cada}}  con @primero y @ultimo
//   {{> comun/parcial}}   parcial con los mismos datos
//   {{lista xs}}          → `a`, `b` y `c`     {{frase xs}} → a, b y c
//   {{!-- nota --}}       no sale
//   \{{                   llave literal
//
// Una línea que solo contiene una etiqueta de bloque (o un comentario)
// desaparece con su salto de línea, para que el markdown resultante quede
// limpio. Los huecos de una sola llave (`{PR_num}`) y los de ángulos (`<wt>`)
// no se tocan: los rellenan los agentes en tiempo de ejecución.

const ETIQUETA = /\\?\{\{(!--[\s\S]*?--|[^{}]*?)\}\}/g;

function esBlanco(texto) {
  return /^[ \t]*$/.test(texto);
}

/** Parte la plantilla en tokens de texto y etiqueta, quitando las líneas que
 * solo contienen una etiqueta de bloque. */
function tokenizar(texto) {
  const tokens = [];
  let cursor = 0;
  let linea = 1;
  const avanzarLinea = (desde, hasta) => {
    for (let i = desde; i < hasta; i += 1) if (texto[i] === '\n') linea += 1;
  };
  for (const coincidencia of texto.matchAll(ETIQUETA)) {
    let inicio = coincidencia.index;
    let fin = inicio + coincidencia[0].length;
    if (coincidencia[0].startsWith('\\')) {
      tokens.push({ tipo: 'texto', valor: texto.slice(cursor, inicio) + coincidencia[0].slice(1) });
      avanzarLinea(cursor, fin);
      cursor = fin;
      continue;
    }
    const etiqueta = analizarEtiqueta(coincidencia[1].trim());
    if (etiqueta.bloque) {
      const inicioLinea = texto.lastIndexOf('\n', inicio - 1) + 1;
      const finLineaBruto = texto.indexOf('\n', fin);
      const finLinea = finLineaBruto === -1 ? texto.length : finLineaBruto;
      const soloEtiqueta =
        inicioLinea >= cursor &&
        esBlanco(texto.slice(inicioLinea, inicio)) &&
        esBlanco(texto.slice(fin, finLinea));
      if (soloEtiqueta) {
        inicio = inicioLinea;
        fin = finLineaBruto === -1 ? texto.length : finLinea + 1;
      }
    }
    if (inicio > cursor) tokens.push({ tipo: 'texto', valor: texto.slice(cursor, inicio) });
    avanzarLinea(cursor, inicio);
    tokens.push({ ...etiqueta, linea });
    avanzarLinea(inicio, fin);
    cursor = fin;
  }
  if (cursor < texto.length) tokens.push({ tipo: 'texto', valor: texto.slice(cursor) });
  return tokens;
}

function analizarEtiqueta(cuerpo) {
  if (cuerpo.startsWith('!--')) return { tipo: 'comentario', bloque: true };
  let m;
  if ((m = /^#si\s+(no\s+)?([\w.@?-]+)$/.exec(cuerpo))) {
    return { tipo: 'si', negado: Boolean(m[1]), ruta: m[2], bloque: true };
  }
  if (cuerpo === '#sino') return { tipo: 'sino', bloque: true };
  if (cuerpo === '/si') return { tipo: 'fin-si', bloque: true };
  if ((m = /^#cada\s+([\w.@-]+)\s+como\s+(\w+)$/.exec(cuerpo))) {
    return { tipo: 'cada', ruta: m[1], variable: m[2], bloque: true };
  }
  if (cuerpo === '/cada') return { tipo: 'fin-cada', bloque: true };
  if ((m = /^>\s*([\w./-]+)$/.exec(cuerpo))) return { tipo: 'parcial', nombre: m[1] };
  if ((m = /^(lista|frase)\s+([\w.@-]+)$/.exec(cuerpo))) return { tipo: 'lista', ruta: m[2], crudo: m[1] === 'frase' };
  if ((m = /^([\w.@-]+)(\?)?$/.exec(cuerpo))) {
    return { tipo: 'variable', ruta: m[1], opcional: Boolean(m[2]) };
  }
  return { tipo: 'invalida', cuerpo };
}

/** Árbol: lista de nodos; los bloques anidan. */
function construir(tokens, nombre) {
  let i = 0;
  const error = (token, mensaje) => new Error(`${nombre}:${token.linea ?? '?'}: ${mensaje}`);
  function secuencia(cierres) {
    const nodos = [];
    while (i < tokens.length) {
      const token = tokens[i];
      if (cierres.includes(token.tipo)) return nodos;
      i += 1;
      switch (token.tipo) {
        case 'texto':
        case 'variable':
        case 'lista':
        case 'parcial':
          nodos.push(token);
          break;
        case 'comentario':
          break;
        case 'si': {
          const entonces = secuencia(['sino', 'fin-si']);
          let sino = [];
          if (i < tokens.length && tokens[i].tipo === 'sino') {
            i += 1;
            sino = secuencia(['fin-si']);
          }
          if (i >= tokens.length) throw error(token, `{{#si ${token.ruta}}} sin cerrar`);
          i += 1;
          nodos.push({ ...token, entonces, sino });
          break;
        }
        case 'cada': {
          const cuerpo = secuencia(['fin-cada']);
          if (i >= tokens.length) throw error(token, `{{#cada ${token.ruta}}} sin cerrar`);
          i += 1;
          nodos.push({ ...token, cuerpo });
          break;
        }
        case 'invalida':
          throw error(token, `etiqueta no reconocida: {{${token.cuerpo}}}`);
        default:
          throw error(token, `cierre inesperado {{${token.tipo}}}`);
      }
    }
    if (cierres.length > 0) throw error(tokens[tokens.length - 1] ?? {}, 'bloque sin cerrar');
    return nodos;
  }
  return secuencia([]);
}

const AUSENTE = Symbol('ausente');

function buscar(ruta, ambitos) {
  const [primero, ...resto] = ruta.split('.');
  for (let k = ambitos.length - 1; k >= 0; k -= 1) {
    const ambito = ambitos[k];
    if (ambito !== null && typeof ambito === 'object' && Object.hasOwn(ambito, primero)) {
      let valor = ambito[primero];
      for (const segmento of resto) {
        if (valor === null || typeof valor !== 'object' || !Object.hasOwn(valor, segmento)) {
          return AUSENTE;
        }
        valor = valor[segmento];
      }
      return valor;
    }
  }
  return AUSENTE;
}

function esVerdadero(valor) {
  if (valor === AUSENTE || valor === undefined || valor === null || valor === false) return false;
  if (valor === 0 || valor === '') return false;
  if (Array.isArray(valor)) return valor.length > 0;
  return true;
}

export function enumerar(valores, { crudo = false } = {}) {
  const items = valores.map((v) => (crudo ? String(v) : `\`${v}\``));
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}`;
}

function evaluar(nodos, ambitos, contexto) {
  let salida = '';
  const error = (nodo, mensaje) => new Error(`${contexto.nombre}:${nodo.linea}: ${mensaje}`);
  for (const nodo of nodos) {
    switch (nodo.tipo) {
      case 'texto':
        salida += nodo.valor;
        break;
      case 'variable': {
        const valor = buscar(nodo.ruta, ambitos);
        if (valor === AUSENTE || valor === undefined || valor === null) {
          if (nodo.opcional) break;
          throw error(nodo, `variable sin valor: ${nodo.ruta}`);
        }
        if (typeof valor === 'object' || typeof valor === 'boolean') {
          throw error(nodo, `${nodo.ruta} no es texto ni número; usa {{#si}}, {{#cada}} o {{lista}}`);
        }
        salida += String(valor);
        break;
      }
      case 'lista': {
        const valor = buscar(nodo.ruta, ambitos);
        if (!Array.isArray(valor)) throw error(nodo, `{{lista ${nodo.ruta}}} necesita una lista`);
        salida += enumerar(valor, { crudo: nodo.crudo });
        break;
      }
      case 'si': {
        const verdadero = esVerdadero(buscar(nodo.ruta, ambitos)) !== nodo.negado;
        salida += evaluar(verdadero ? nodo.entonces : nodo.sino, ambitos, contexto);
        break;
      }
      case 'cada': {
        const valor = buscar(nodo.ruta, ambitos);
        if (valor === AUSENTE) throw error(nodo, `{{#cada ${nodo.ruta}}} sin valor`);
        if (!Array.isArray(valor)) throw error(nodo, `{{#cada ${nodo.ruta}}} necesita una lista`);
        valor.forEach((elemento, indice) => {
          const ambito = {
            [nodo.variable]: elemento,
            '@primero': indice === 0,
            '@ultimo': indice === valor.length - 1,
            '@indice': indice,
            '@numero': indice + 1,
          };
          salida += evaluar(nodo.cuerpo, [...ambitos, ambito], contexto);
        });
        break;
      }
      case 'parcial': {
        const plantilla = contexto.parciales[nodo.nombre];
        if (typeof plantilla !== 'string') throw error(nodo, `parcial desconocido: ${nodo.nombre}`);
        salida += evaluar(
          construir(tokenizar(plantilla), nodo.nombre),
          ambitos,
          { ...contexto, nombre: nodo.nombre },
        );
        break;
      }
      default:
        throw error(nodo, `nodo inesperado ${nodo.tipo}`);
    }
  }
  return salida;
}

/**
 * Renderiza `texto` con `datos`.
 * @param {string} texto plantilla
 * @param {object} datos vista (ver vista.mjs)
 * @param {{nombre?: string, parciales?: Record<string,string>}} [opciones]
 */
export function renderizar(texto, datos, opciones = {}) {
  const contexto = { nombre: opciones.nombre ?? 'plantilla', parciales: opciones.parciales ?? {} };
  const arbol = construir(tokenizar(texto), contexto.nombre);
  return evaluar(arbol, [datos], contexto);
}

/** Rutas de variable que una plantilla consulta (para comprobar perfiles). */
export function variablesDe(texto, nombre = 'plantilla') {
  const rutas = new Set();
  const recorrer = (nodos) => {
    for (const nodo of nodos) {
      if (nodo.ruta) rutas.add(nodo.ruta);
      if (nodo.entonces) recorrer(nodo.entonces);
      if (nodo.sino) recorrer(nodo.sino);
      if (nodo.cuerpo && Array.isArray(nodo.cuerpo)) recorrer(nodo.cuerpo);
    }
  };
  recorrer(construir(tokenizar(texto), nombre));
  return [...rutas];
}

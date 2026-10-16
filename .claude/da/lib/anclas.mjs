// Anclas: los skills citan secciones de CLAUDE.md por nombre y número, párrafos
// de otros skills por §, y principios de DESARROLLO-AUTONOMO.md por número.
// Aquí se extraen las citas de un texto, se indican las anclas que un archivo
// define, y se comprueba que cada cita resuelva. Lo usan el test de fidelidad
// y `da doctor`.

const ROL_DE_ARCHIVO = /\.claude\/skills\/desarrollo-autonomo-([a-z-]+)\//;
const AGENTE_DE_ARCHIVO = /\.claude\/agents\/([a-z-]+)\.md$/;

/** Rol al que pertenece un archivo (skill o agente); los implementadores por área son `implementador`. */
export function rolDeArchivo(ruta) {
  const skill = ROL_DE_ARCHIVO.exec(ruta)?.[1];
  if (skill) return skill;
  const agente = AGENTE_DE_ARCHIVO.exec(ruta)?.[1];
  if (!agente) return null;
  return agente.startsWith('implementador') ? 'implementador' : agente;
}

function normalizarSeccion(texto) {
  return texto
    .replace(/[`*_]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Anclas que define un archivo: secciones (encabezados, con sus ítems de
 * primer nivel), párrafos § (encabezados numerados y etiquetas `(§N)`) e ítems
 * numerados por párrafo.
 */
export function indicarAnclas(texto) {
  const secciones = new Map(); // nombre normalizado → Set de números de ítem
  const parrafos = new Set(); // '1', '1b', '2.2', '2.10'
  const items = new Map(); // párrafo → Set de números de ítem de primer nivel
  let seccionActual = null;
  let parrafoActual = null;
  for (const linea of texto.split('\n')) {
    const encabezado = /^#{1,6}\s+(.*)$/.exec(linea);
    if (encabezado) {
      const titulo = encabezado[1].trim();
      const numerado = /^(\d+[a-z]?(?:\.\d+)*)\.?\s+(.*)$/.exec(titulo);
      // Un encabezado numerado («2.10 Pasada final») se cita también sin su número.
      seccionActual = normalizarSeccion(numerado ? numerado[2] : titulo);
      const conjunto = secciones.get(seccionActual) ?? new Set();
      secciones.set(seccionActual, conjunto);
      parrafoActual = numerado ? numerado[1] : null;
      if (parrafoActual) {
        parrafos.add(parrafoActual);
        items.set(parrafoActual, new Set());
      }
      continue;
    }
    for (const m of linea.matchAll(/\(§(\d+[a-z]?(?:\.\d+)*)\)\.?\*\*/g)) parrafos.add(m[1]);
    // Una viñeta con etiqueta en negrita («- **Escalados.**») también es una sección citable.
    const vineta = /^\s*[-*]\s+\*\*([^*]+?)\*\*/.exec(linea);
    if (vineta) {
      const nombre = normalizarSeccion(vineta[1].replace(/\s*\(§[^)]*\)/, '').replace(/[.:]$/, ''));
      if (!secciones.has(nombre)) secciones.set(nombre, new Set());
    }
    const item = /^(\d+)\.\s/.exec(linea);
    if (item) {
      const n = Number(item[1]);
      if (seccionActual) secciones.get(seccionActual).add(n);
      if (parrafoActual) items.get(parrafoActual).add(n);
    }
  }
  return { secciones, parrafos, items };
}

const RE_CLAUDE = /`CLAUDE\.md`,?\s*((?:\*[^*]+\*(?:,?\s*(?:punto|puntos|regla|reglas)?\s*\d+(?:\s*(?:y|,)\s*\d+)*)?(?:,?\s*(?:y|,)\s*)?)+)/g;
const RE_ITALICA = /\*([^*]+)\*(?:,?\s*(?:punto|puntos|regla|reglas)?\s*(\d+(?:\s*(?:y|,)\s*\d+)*))?/g;
const RE_PARRAFO_ROL = /`(?:desarrollo-autonomo-)?([a-z-]+)`?\s*§(\d+[a-z]?(?:\.\d+)*)/g;
const RE_PARRAFO = /(?<![`\w-])§(\d+[a-z]?(?:\.\d+)*)/g;
const RE_PRINCIPIO = /principios?\s+(\d+(?:\s*(?:y|,)\s*\d+)*)/g;
const RE_SKILL = /`desarrollo-autonomo-([a-z-]+)`,\s*\*([^*]+)\*/g;
const RE_SKILL_PROPIO = /\(skill,\s*\*([^*]+)\*\)/g;
const ROLES = new Set(['team-manager', 'planeador', 'pm', 'implementador', 'critico', 'archivador']);

function numeros(texto) {
  return texto ? texto.split(/\s*(?:y|,)\s*/).map(Number) : [null];
}

/** Citas que contiene un texto escrito desde el skill `rolPropio`. */
export function extraerCitas(texto, rolPropio) {
  const citas = [];
  const consumidos = [];
  for (const m of texto.matchAll(RE_CLAUDE)) {
    consumidos.push([m.index, m.index + m[0].length]);
    for (const it of m[1].matchAll(RE_ITALICA)) {
      for (const n of numeros(it[2])) citas.push({ tipo: 'claude-md', seccion: it[1].trim(), numero: n });
    }
  }
  for (const m of texto.matchAll(RE_SKILL)) citas.push({ tipo: 'skill', rol: m[1], seccion: m[2].trim() });
  for (const m of texto.matchAll(RE_SKILL_PROPIO)) citas.push({ tipo: 'skill', rol: rolPropio, seccion: m[1].trim() });
  const conRol = new Set();
  for (const m of texto.matchAll(RE_PARRAFO_ROL)) {
    const rol = m[1] === 'skill del pm' ? 'pm' : m[1];
    if (!ROLES.has(rol)) continue;
    conRol.add(m.index + m[0].indexOf('§'));
    citas.push({ tipo: 'parrafo', rol, parrafo: m[2] });
  }
  for (const m of texto.matchAll(/skill del PM\s*§(\d+[a-z]?(?:\.\d+)*)/g)) {
    conRol.add(m.index + m[0].indexOf('§'));
    citas.push({ tipo: 'parrafo', rol: 'pm', parrafo: m[1] });
  }
  // «§1b de `desarrollo-autonomo-pm`», «§1b del PM entrante»
  for (const m of texto.matchAll(/§(\d+[a-z]?(?:\.\d+)*) (?:de `desarrollo-autonomo-([a-z-]+)`|del PM\b)/g)) {
    conRol.add(m.index);
    citas.push({ tipo: 'parrafo', rol: m[2] ?? 'pm', parrafo: m[1] });
  }
  // «`desarrollo-autonomo-pm` (§6, §1.7)»
  for (const m of texto.matchAll(/`desarrollo-autonomo-([a-z-]+)` \(((?:§\d+[a-z]?(?:\.\d+)*(?:, )?)+)\)/g)) {
    for (const p of m[2].matchAll(/§(\d+[a-z]?(?:\.\d+)*)/g)) {
      conRol.add(m.index + m[0].indexOf(p[0], m[1].length));
      citas.push({ tipo: 'parrafo', rol: m[1], parrafo: p[1] });
    }
  }
  for (const m of texto.matchAll(RE_PARRAFO)) {
    if (conRol.has(m.index)) continue;
    const antes = texto.slice(Math.max(0, m.index - 40), m.index);
    if (/DESARROLLO-AUTONOMO\.md`?\s*$/.test(antes)) {
      citas.push({ tipo: 'porque', parrafo: m[1] });
      continue;
    }
    if (rolPropio) citas.push({ tipo: 'parrafo', rol: rolPropio, parrafo: m[1] });
  }
  for (const m of texto.matchAll(RE_PRINCIPIO)) {
    for (const n of numeros(m[1])) citas.push({ tipo: 'principio', numero: n });
  }
  return citas;
}

function resolverParrafo(anclas, parrafo) {
  if (anclas.parrafos.has(parrafo)) return true;
  const partes = parrafo.split('.');
  if (partes.length < 2) return false;
  const ultimo = Number(partes[partes.length - 1]);
  const padre = partes.slice(0, -1).join('.');
  if (anclas.parrafos.has(padre) && anclas.items.get(padre)?.has(ultimo)) return true;
  return false;
}

function resolverSeccion(anclas, nombre, numero) {
  const clave = normalizarSeccion(nombre);
  const encontrada = [...anclas.secciones.entries()].find(([k]) => k === clave || k.startsWith(`${clave} `) || k.startsWith(`${clave}:`) || k.startsWith(`${clave} —`));
  if (!encontrada) return false;
  if (numero === null || numero === undefined) return true;
  return encontrada[1].has(numero);
}

/**
 * Comprueba todas las citas de un conjunto de archivos renderizados
 * (`{ ruta: contenido }`). Devuelve las rotas como `ruta: cita`.
 */
export function comprobarAnclas(archivos) {
  const rotas = [];
  const anclasClaude = archivos['CLAUDE.md'] ? indicarAnclas(archivos['CLAUDE.md']) : null;
  const porque = archivos['docs/DESARROLLO-AUTONOMO.md'] ? indicarAnclas(archivos['docs/DESARROLLO-AUTONOMO.md']) : null;
  const porRol = {};
  for (const [ruta, texto] of Object.entries(archivos)) {
    const rol = ROL_DE_ARCHIVO.exec(ruta)?.[1];
    if (!rol) continue;
    const propias = indicarAnclas(texto);
    const acumulado = porRol[rol] ?? { secciones: new Map(), parrafos: new Set(), items: new Map() };
    for (const [k, v] of propias.secciones) acumulado.secciones.set(k, new Set([...(acumulado.secciones.get(k) ?? []), ...v]));
    for (const p of propias.parrafos) acumulado.parrafos.add(p);
    for (const [k, v] of propias.items) acumulado.items.set(k, new Set([...(acumulado.items.get(k) ?? []), ...v]));
    porRol[rol] = acumulado;
  }
  for (const [ruta, texto] of Object.entries(archivos)) {
    const rolPropio = rolDeArchivo(ruta);
    for (const cita of extraerCitas(texto, rolPropio)) {
      let ok = true;
      switch (cita.tipo) {
        case 'claude-md':
          ok = anclasClaude ? resolverSeccion(anclasClaude, cita.seccion, cita.numero) : true;
          break;
        case 'skill':
          ok = porRol[cita.rol] ? resolverSeccion(porRol[cita.rol], cita.seccion, null) : false;
          break;
        case 'parrafo':
          ok = porRol[cita.rol] ? resolverParrafo(porRol[cita.rol], cita.parrafo) : false;
          break;
        case 'porque':
          ok = porque ? porque.parrafos.has(cita.parrafo) : true;
          break;
        case 'principio':
          ok = porque ? (porque.items.get('3')?.has(cita.numero) ?? false) : true;
          break;
        default:
          ok = true;
      }
      if (!ok) rotas.push(`${ruta}: ${JSON.stringify(cita)}`);
    }
  }
  return rotas;
}

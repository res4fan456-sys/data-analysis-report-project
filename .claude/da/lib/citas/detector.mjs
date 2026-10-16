// Detector de citas rotas (módulo `citas`): funciones puras sobre texto. Las
// siete comprobaciones de la mecánica, con el alcance que da el perfil:
//
//   en docs/*.md y CLAUDE.md:      rutas rotas · cita por ruta a un change activo · secciones de CLAUDE.md citadas
//   en los comentarios del código: fuentes irresolubles · cita a openspec/changes/ · genealogía · identificadores inexistentes
//
// Los literales que este archivo necesita para reconocerse (las frases de
// «fuentes irresolubles», las marcas de genealogía) se construyen por
// concatenación: escritos enteros, el lint se detectaría a sí mismo.

// --- Comentarios por extensión: lo que el lint lee en cada lenguaje ---------

const LEXICO = [
  { extensiones: ['.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.go', '.rs', '.java', '.kt', '.cs', '.c', '.h', '.cpp', '.swift', '.scala', '.dart'], linea: ['//'], bloque: [['/*', '*/']] },
  { extensiones: ['.py', '.sh', '.bash', '.zsh', '.rb', '.pl', '.toml', '.yaml', '.yml', '.tf', '.r', '.jl', '.ex', '.exs', '.Dockerfile'], linea: ['#'], bloque: [] },
  { extensiones: ['.sql', '.lua', '.hs'], linea: ['--'], bloque: [] },
  { extensiones: ['.css', '.scss'], linea: [], bloque: [['/*', '*/']] },
  { extensiones: ['.md', '.html', '.vue', '.svelte', '.xml'], linea: [], bloque: [['<!--', '-->']] },
];

export function lexicoDe(ruta) {
  const base = ruta.slice(ruta.lastIndexOf('/') + 1);
  const ext = base.includes('.') ? base.slice(base.lastIndexOf('.')) : base === 'Dockerfile' ? '.Dockerfile' : '';
  return LEXICO.find((l) => l.extensiones.includes(ext)) ?? null;
}

/**
 * Las líneas de comentario de un archivo, con su número de línea (1-based) y
 * el texto del comentario sin la marca. Heurística de línea física: una línea
 * de código con un comentario al final cuenta como código.
 * @returns {Array<{linea: number, texto: string}>}
 */
export function lineasDeComentario(contenido, ruta) {
  const lexico = lexicoDe(ruta);
  if (!lexico) return [];
  const salida = [];
  let dentro = null; // cierre del bloque abierto
  contenido.split('\n').forEach((cruda, i) => {
    const recortada = cruda.trim();
    if (dentro) {
      const fin = recortada.indexOf(dentro);
      salida.push({ linea: i + 1, texto: (fin === -1 ? recortada : recortada.slice(0, fin)).replace(/^\*\s?/, '').trim() });
      if (fin !== -1) dentro = null;
      return;
    }
    for (const [abre, cierra] of lexico.bloque) {
      if (recortada.startsWith(abre)) {
        const resto = recortada.slice(abre.length);
        const fin = resto.indexOf(cierra);
        salida.push({ linea: i + 1, texto: (fin === -1 ? resto : resto.slice(0, fin)).trim() });
        if (fin === -1) dentro = cierra;
        return;
      }
    }
    for (const marca of lexico.linea) {
      if (recortada.startsWith(marca) && !recortada.startsWith('#!')) {
        salida.push({ linea: i + 1, texto: recortada.slice(marca.length).trim() });
        return;
      }
    }
  });
  return salida;
}

/** Las líneas que NO son comentario (para el índice de identificadores). */
export function lineasDeCodigo(contenido, ruta) {
  const comentadas = new Set(lineasDeComentario(contenido, ruta).map((c) => c.linea));
  return contenido.split('\n').filter((_, i) => !comentadas.has(i + 1));
}

// --- Fuentes irresolubles -------------------------------------------------

const FRASES = [
  'criterio [0-9]+',
  'el' + ' encargo',
  'encargo' + ',',
  'project' + ' manager',
  'el' + ' crítico',
  'la revisión' + ' de',
  'hallazgo' + ' de revisión',
  'devolución' + ' del',
  'coordina' + 'dor',
  'Team' + ' Manager',
];
const PATRON_FUENTE_IRRESOLUBLE = new RegExp(FRASES.join('|'), 'gi');

export function buscarFuentesIrresolubles(texto) {
  return [...texto.matchAll(PATRON_FUENTE_IRRESOLUBLE)].map((m) => m[0]);
}

// --- Genealogía -------------------------------------------------------------

const PATRON_GENEALOGIA = new RegExp(['tasks' + '\\.md', 'design' + '\\.md', 'proposal' + '\\.md', 'PR' + ' #[0-9]+', '\\(#[0-9]+\\)'].join('|'), 'g');
const PATRON_GENEALOGIA_INSENSIBLE = new RegExp(['\\bOla' + ' [0-9]+', '\\bFase' + ' [0-9]+', '\\btarea' + ' [0-9]+\\.[0-9]+'].join('|'), 'gi');
const PATRON_GENEALOGIA_FRASES = new RegExp(['grupo' + ' [0-9]+', 'esta' + '(?: misma)? ola', 'antes de este cambio', 'antes viv[íi]a', 'hasta ahora'].join('|'), 'gi');

export function buscarGenealogia(texto, patronIdDeOla = null) {
  const hallazgos = [
    ...[...texto.matchAll(PATRON_GENEALOGIA)].map((m) => m[0]),
    ...[...texto.matchAll(PATRON_GENEALOGIA_INSENSIBLE)].map((m) => m[0]),
    ...[...texto.matchAll(PATRON_GENEALOGIA_FRASES)].map((m) => m[0]),
  ];
  if (patronIdDeOla) hallazgos.push(...[...texto.matchAll(new RegExp(patronIdDeOla, 'gi'))].map((m) => m[0]));
  return hallazgos;
}

// --- Citas a openspec/changes/ ---------------------------------------------

export function buscarCitasAChanges(texto, openspec = 'openspec') {
  const re = new RegExp(`(?:^|[^A-Za-z0-9_/-])(${openspec.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/changes/[A-Za-z0-9_@.+/-]*)`, 'g');
  return [...texto.matchAll(re)].map((m) => m[1].replace(/[.,;:)]+$/, ''));
}

// --- Identificadores citados -------------------------------------------------

const PATRON_IDENTIFICADOR_CITADO = /`([A-Za-z_$][A-Za-z0-9_$]*)`/g;

function pareceIdentificadorDeCodigo(token) {
  return token.length >= 4 && /[a-z]/.test(token) && /[A-Z]/.test(token);
}

export function identificadoresCitados(texto) {
  return [...texto.matchAll(PATRON_IDENTIFICADOR_CITADO)].map((m) => m[1]).filter(pareceIdentificadorDeCodigo);
}

export function construirIndiceDeIdentificadores(lineas) {
  const indice = new Set();
  for (const linea of lineas) for (const m of linea.matchAll(/[A-Za-z_$][A-Za-z0-9_$]*/g)) indice.add(m[0]);
  return indice;
}

/** Un comentario que fija la versión de un paquete (`nombre@1.2`) o nombra un `@scope/paquete` habla de código ajeno: sus identificadores no tienen por qué estar aquí. */
export function citaUnaDependencia(texto) {
  return /[A-Za-z][\w.-]*(?:\/[\w.-]+)?@\d+\.\d+/.test(texto) || /@[A-Za-z][\w-]*\/[\w.-]+/.test(texto) || /\bnode_modules\b|\bsite-packages\b|\bpip\b|\bnpm\b/.test(texto);
}

export function hallazgosDeIdentificadorInexistente(texto, indice, listaBlanca = new Set()) {
  if (citaUnaDependencia(texto)) return [];
  return identificadoresCitados(texto).filter((id) => !indice.has(id) && !listaBlanca.has(id));
}

// --- Rutas citadas en docs ----------------------------------------------------

export function limpiarRuta(cruda) {
  let ruta = cruda.replace(/^[^A-Za-z.]/, '');
  if (/[<>{}*$]/.test(ruta)) return undefined;
  if (ruta.endsWith('-')) return undefined;
  const terminabaEnPunto = ruta.endsWith('.');
  ruta = ruta.replace(/[.,;:)]+$/, '');
  const base = ruta.slice(ruta.lastIndexOf('/') + 1);
  if (terminabaEnPunto && !base.includes('.')) return undefined;
  return ruta;
}

/** Rutas citadas en una línea: las que empiezan por uno de los prefijos de directorio del repo. */
export function extraerRutas(linea, prefijos) {
  if (prefijos.length === 0) return [];
  const alternativa = prefijos.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const re = new RegExp(`(^|[^A-Za-z0-9_/-])((?:${alternativa})/[A-Za-z0-9_@.+/-]+)`, 'g');
  const rutas = [];
  for (const m of linea.matchAll(re)) {
    const limpia = limpiarRuta(m[2]);
    if (limpia) rutas.push(limpia);
  }
  return rutas;
}

/** Si una ruta cita por su nombre un change de OpenSpec que no está archivado. */
export function esCitaAChangeActivo(ruta, openspec = 'openspec') {
  const m = new RegExp(`^${openspec.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/changes/([^/]+)(?:/|$)`).exec(ruta.replace(/\/+$/, ''));
  return Boolean(m) && m[1] !== 'archive';
}

// --- Secciones de CLAUDE.md citadas ---------------------------------------------

export function segmentosCitadosDeClaudeMd(linea) {
  const idx = linea.indexOf('CLAUDE.md');
  if (idx === -1) return [];
  let resto = linea.slice(idx + 'CLAUDE.md'.length);
  const cierre = resto.indexOf(')');
  if (cierre !== -1) resto = resto.slice(0, cierre);
  // Solo cursiva de un asterisco (`*Git*`): la negrita (`**solo si…**`) no nombra una sección.
  return [...resto.matchAll(/(?<!\*)\*([^*\n]+)\*(?!\*)/g)].map((m) => m[1].trim());
}

export function encabezadosDeMarkdown(texto) {
  return texto.split('\n').filter((l) => /^#{1,6}\s/.test(l)).map((l) => l.replace(/^#{1,6}\s+/, '').replace(/[`*_]/g, '').trim());
}

export function hallazgosDeSeccionInexistente(linea, encabezados) {
  const normalizados = encabezados.map((e) => e.toLowerCase());
  return segmentosCitadosDeClaudeMd(linea)
    .map((s) => s.replace(/[`*_]/g, '').toLowerCase())
    .filter((s) => !normalizados.some((e) => e === s || e.startsWith(`${s} `) || e.startsWith(`${s}:`) || e.startsWith(`${s} —`)));
}

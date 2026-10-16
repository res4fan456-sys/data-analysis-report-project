// ¿Está el proyecto entendido antes de montar la mecánica? La mecánica se
// instala sobre un proyecto que ya sabe qué es, para quién y con qué stack;
// eso lo escriben `/da-plan` y el usuario en `docs/PLAN.md` y `docs/STACK.md`
// (más `ARQUITECTURA.md` y `DOMINIO.md`, recomendados), y `/da-init` no
// arranca sin ellos. Pura: recibe el texto de cada documento (o `null`) y
// dice qué falta. La cáscara (`skill-da-init/kit.mjs`) lee el disco.

/** Los documentos del plan, con las secciones que `/da-init` lee de cada uno (por su encabezado). */
export const DOCUMENTOS_DEL_PLAN = [
  { ruta: 'docs/PLAN.md', obligatorio: true, secciones: ['Visión', 'Alcance del MVP', 'Fuera de alcance', 'Fases'] },
  { ruta: 'docs/STACK.md', obligatorio: true, secciones: ['Restricciones', 'Opciones evaluadas', 'Decisión', 'Reglas innegociables'] },
  { ruta: 'docs/ARQUITECTURA.md', obligatorio: false, secciones: ['Capas'] },
  { ruta: 'docs/DOMINIO.md', obligatorio: false, secciones: [] },
];

/** La marca que llevan las semillas del kit mientras nadie las ha escrito para el proyecto. */
export function esSemillaDelKit(texto) {
  return /<!--\s*Semilla del kit/i.test(texto ?? '');
}

const quitarAcentos = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function tieneSeccion(texto, seccion) {
  const buscada = quitarAcentos(seccion);
  return texto.split('\n').some((l) => /^#{1,6}\s/.test(l) && quitarAcentos(l).includes(buscada));
}

// Un hueco es `<…>` con texto en minúscula dentro (`<nombre>`, `<qué resuelve
// la fase>`): lo que dejan las semillas para rellenar. Un comentario HTML
// (`<!-- -->`) o una etiqueta de dos letras (`<br>`) no cuentan.
const HUECO = /<[a-záéíóúñ][^<>\n]{2,}>/g;

/** Qué le falta a un documento del plan: no existe, es la semilla, le faltan secciones o le quedan huecos. */
export function faltasDeDocumento(ruta, texto) {
  if (texto === null || texto === undefined) return ['no existe'];
  if (esSemillaDelKit(texto)) return ['es la semilla del kit, sin escribir para el proyecto'];
  const faltas = [];
  const doc = DOCUMENTOS_DEL_PLAN.find((d) => d.ruta === ruta);
  for (const seccion of doc?.secciones ?? []) {
    if (!tieneSeccion(texto, seccion)) faltas.push(`sin sección «${seccion}»`);
  }
  const huecos = [...new Set([...texto.matchAll(HUECO)].map((m) => m[0]))];
  if (huecos.length > 0) faltas.push(`quedan huecos sin rellenar: ${huecos.slice(0, 3).join(', ')}${huecos.length > 3 ? '…' : ''}`);
  return faltas;
}

/**
 * El estado del plan del proyecto.
 * @param {Record<string, string|null>} docs texto por ruta (`docs/PLAN.md`, …), `null` si no existe
 * @returns {{listo: boolean, faltas: Record<string, string[]>, recomendados: string[], pendientes: number}}
 */
export function estadoDelPlan(docs) {
  const faltas = {};
  const recomendados = [];
  let pendientes = 0;
  for (const doc of DOCUMENTOS_DEL_PLAN) {
    const texto = docs[doc.ruta] ?? null;
    const f = faltasDeDocumento(doc.ruta, texto);
    if (doc.obligatorio) {
      if (f.length > 0) faltas[doc.ruta] = f;
    } else if (f.length > 0) {
      recomendados.push(doc.ruta);
    }
    if (texto) pendientes += (texto.match(/\[PENDIENTE\]/g) ?? []).length;
  }
  return { listo: Object.keys(faltas).length === 0, faltas, recomendados, pendientes };
}

/** El estado en texto: una línea de veredicto y una por documento obligatorio. */
export function resumenDelPlan(estado) {
  const lineas = [estado.listo ? `plan: LISTO (${estado.pendientes} [PENDIENTE])` : 'plan: NO LISTO — corre /da-plan antes de /da-init'];
  for (const doc of DOCUMENTOS_DEL_PLAN.filter((d) => d.obligatorio)) {
    lineas.push(`  ${doc.ruta}: ${estado.faltas[doc.ruta] ? estado.faltas[doc.ruta].join('; ') : 'OK'}`);
  }
  if (estado.recomendados.length > 0) lineas.push(`  recomendados sin escribir: ${estado.recomendados.join(', ')}`);
  return `${lineas.join('\n')}\n`;
}

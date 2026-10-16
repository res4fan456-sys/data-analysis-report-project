// Valida el cuerpo de una PR contra las plantillas de formato-de-pr.md: la A
// (PR de grupo), la B (PR de cierre de ola) y la C (PR de arreglo). Comprueba
// solo lo mecánico —encabezados exactos y en orden, zona humana sin párrafos,
// SHA de la evidencia, forma de los bloques de grupo y de la deuda—; lo que es
// juicio sigue en la lista manual de ese archivo. Los encabezados que dependen
// del perfil (la suite de sistema, las capturas, la ruta de OpenSpec) salen de
// `plantillasDe(perfil)`, el mismo perfil que renderizó el skill.

const EXACTA = (texto) => (encabezado) => encabezado === texto;
const PREFIJO = (texto) => (encabezado) => encabezado.startsWith(texto);
export const EVIDENCIA = /^## Evidencia — `([0-9a-f]{7,40})`$/;
const GRUPO = /^### Grupos? .+ — #\d+ — .+$/;
const LINEA_DE_LISTA = /^\s*(#|[-*] |\d+\. |\|)/;
export const CABECERA_MINI_TABLA = '| Mecánicas | Crítico |';

/** Las tres plantillas, con los encabezados que el perfil determina. */
export function plantillasDe({ suiteNombre = null, hayVisual = false, openspecRuta = 'openspec' } = {}) {
  const evidencia = { etiqueta: '## Evidencia — `<sha>`', coincide: (h) => EVIDENCIA.test(h), obligatoria: true, abreEvidencia: true };
  const openspec = { etiqueta: `### \`${openspecRuta}/\``, coincide: EXACTA(`### \`${openspecRuta}/\``), obligatoria: true };
  const capturas = { etiqueta: '### Capturas', coincide: PREFIJO('### Capturas'), obligatoria: true };
  const suite = suiteNombre ? { etiqueta: `### \`${suiteNombre}\``, coincide: EXACTA(`### \`${suiteNombre}\``), obligatoria: true } : null;
  const A = [
    { etiqueta: '## Contexto', coincide: EXACTA('## Contexto'), obligatoria: true },
    { etiqueta: '### Por qué', coincide: EXACTA('### Por qué'), obligatoria: true },
    { etiqueta: '### Qué cambió', coincide: EXACTA('### Qué cambió'), obligatoria: true },
    { etiqueta: '### Rondas de crítico', coincide: EXACTA('### Rondas de crítico'), obligatoria: false, mensajeSiFalta: 'falta la sección «### Rondas de crítico» (obligatoria al mergear)' },
    { etiqueta: '## Alcance', coincide: EXACTA('## Alcance'), obligatoria: true, unaLinea: true },
    evidencia,
    { etiqueta: '### `verify`', coincide: PREFIJO('### `verify`'), obligatoria: true },
    ...(suite ? [suite] : []),
    ...(hayVisual ? [capturas] : []),
    openspec,
    { etiqueta: '### Mutación', coincide: EXACTA('### Mutación'), obligatoria: true },
  ];
  const C = [
    { etiqueta: '## Contexto', coincide: EXACTA('## Contexto'), obligatoria: true, maxLineas: 5 },
    { etiqueta: '## Alcance', coincide: EXACTA('## Alcance'), obligatoria: true, unaLinea: true },
    evidencia,
    { etiqueta: '### CI', coincide: EXACTA('### CI'), obligatoria: true },
    openspec,
    ...(hayVisual ? [capturas] : []),
  ];
  const B = [
    { etiqueta: '## Estado', coincide: EXACTA('## Estado'), obligatoria: true, unaLinea: true },
    { etiqueta: '## Contexto', coincide: EXACTA('## Contexto'), obligatoria: true },
    { etiqueta: '### Por qué', coincide: EXACTA('### Por qué'), obligatoria: true },
    { etiqueta: '### Grupo N — #NNN — …', coincide: (h) => GRUPO.test(h), obligatoria: true, repetible: true, mensajeSiFalta: 'falta al menos un bloque «### Grupo N — #NNN — …»' },
    { etiqueta: '### PM — fuera de los grupos', coincide: EXACTA('### PM — fuera de los grupos'), obligatoria: true },
    { etiqueta: '## Deuda', coincide: EXACTA('## Deuda'), obligatoria: true },
    { etiqueta: '## Fuera de alcance', coincide: EXACTA('## Fuera de alcance'), obligatoria: true },
    { etiqueta: '## Decisiones que confirmar o revertir', coincide: EXACTA('## Decisiones que confirmar o revertir'), obligatoria: true },
    evidencia,
  ];
  return { A, B, C };
}

/** Las opciones de plantilla que un perfil completado determina. */
export function opcionesDePerfil(perfil) {
  const suite = perfil.modulos.suiteDeSistema;
  const visual = perfil.modulos.evidenciaVisual && perfil.areas.some((a) => a.visual === true);
  return { suiteNombre: suite ? suite.nombre : null, hayVisual: Boolean(visual), openspecRuta: perfil.rutas.openspec.replace(/\/+$/, '') };
}

/**
 * @param {string} texto cuerpo de la PR
 * @param {'A'|'B'|'C'} plantilla
 * @param {{sha?: string, cierre?: boolean}} opciones
 * @param {object} [plantillas] salida de `plantillasDe`
 * @returns {Array<{linea: number, mensaje: string}>}
 */
export function validarCuerpo(texto, plantilla, opciones = {}, plantillas = plantillasDe()) {
  const esperadas = plantillas[plantilla];
  if (!esperadas) throw new Error(`plantilla desconocida: ${plantilla}`);
  const errores = [];
  const lineas = texto.split('\n');

  const encabezados = [];
  let enCodigo = false;
  for (const [i, linea] of lineas.entries()) {
    if (linea.trim().startsWith('```')) {
      enCodigo = !enCodigo;
      continue;
    }
    if (enCodigo || !/^#{2,3} /.test(linea)) continue;
    const indice = esperadas.findIndex((e) => e.coincide(linea));
    if (indice === -1) errores.push({ linea: i + 1, mensaje: `sección «${linea}» no está en la plantilla` });
    encabezados.push({ linea: i + 1, texto: linea, indice });
  }

  const vistas = new Map();
  let ultimoIndice = -1;
  for (const h of encabezados) {
    if (h.indice === -1) continue;
    const veces = (vistas.get(h.indice) ?? 0) + 1;
    vistas.set(h.indice, veces);
    if (veces > 1 && !esperadas[h.indice]?.repetible) errores.push({ linea: h.linea, mensaje: `sección «${h.texto}» repetida` });
    if (h.indice < ultimoIndice) errores.push({ linea: h.linea, mensaje: `sección «${h.texto}» fuera de orden` });
    else ultimoIndice = h.indice;
  }

  for (const [indice, esperada] of esperadas.entries()) {
    if (vistas.has(indice)) continue;
    const obligatoria = esperada.obligatoria || (opciones.cierre === true && plantilla === 'A');
    if (!obligatoria) continue;
    errores.push({ linea: 0, mensaje: esperada.mensajeSiFalta ?? `falta la sección «${esperada.etiqueta}»` });
  }

  const secciones = partirEnSecciones(lineas, encabezados);

  let enEvidencia = false;
  for (const seccion of secciones) {
    const esperada = esperadas[seccion.encabezado.indice];
    if (esperada?.abreEvidencia) enEvidencia = true;
    if (seccion.encabezado.indice === -1 || enEvidencia) continue;
    const noVacias = seccion.contenido.filter((l) => l.texto.trim() !== '');
    if (esperada?.unaLinea) {
      if (noVacias.length !== 1) errores.push({ linea: seccion.encabezado.linea, mensaje: `la sección «${esperada.etiqueta}» debe ser exactamente una línea` });
      continue;
    }
    if (esperada?.maxLineas !== undefined && noVacias.length > esperada.maxLineas) {
      errores.push({ linea: seccion.encabezado.linea, mensaje: `la sección «${esperada.etiqueta}» no puede pasar de ${esperada.maxLineas} líneas de contenido` });
    }
    for (const l of noVacias) {
      if (l.enCodigo || LINEA_DE_LISTA.test(l.texto)) continue;
      errores.push({ linea: l.linea, mensaje: 'párrafo en zona humana: solo encabezados, listas y tablas fuera de «Evidencia»' });
    }
  }

  const evidencia = encabezados.find((h) => esperadas[h.indice]?.abreEvidencia);
  if (evidencia && opciones.sha) {
    const shaCuerpo = EVIDENCIA.exec(evidencia.texto)?.[1] ?? '';
    if (!opciones.sha.startsWith(shaCuerpo) && !shaCuerpo.startsWith(opciones.sha)) {
      errores.push({ linea: evidencia.linea, mensaje: `el SHA de Evidencia (${shaCuerpo}) no es el de la rama (${opciones.sha})` });
    }
  }

  if (plantilla === 'A' || plantilla === 'C') validarEvidenciaDeGrupo(secciones, esperadas, errores);
  if (plantilla === 'B') validarBloquesDeOla(secciones, esperadas, errores);
  return errores.sort((a, b) => a.linea - b.linea);
}

function partirEnSecciones(lineas, encabezados) {
  return encabezados.map((encabezado, k) => {
    const fin = encabezados[k + 1]?.linea ?? lineas.length + 1;
    const contenido = [];
    let enCodigo = false;
    for (let n = encabezado.linea + 1; n < fin; n += 1) {
      const texto = lineas[n - 1] ?? '';
      if (texto.trim().startsWith('```')) {
        enCodigo = !enCodigo;
        contenido.push({ linea: n, texto, enCodigo: true });
        continue;
      }
      contenido.push({ linea: n, texto, enCodigo });
    }
    return { encabezado, contenido };
  });
}

function validarEvidenciaDeGrupo(secciones, esperadas, errores) {
  const indiceEvidencia = esperadas.findIndex((e) => e.abreEvidencia);
  for (const seccion of secciones) {
    const esperada = esperadas[seccion.encabezado.indice];
    if (!esperada || !seccion.encabezado.texto.startsWith('### ')) continue;
    if (seccion.encabezado.indice <= indiceEvidencia) continue;
    if (seccion.contenido.some((l) => l.texto.trim() !== '')) continue;
    errores.push({ linea: seccion.encabezado.linea, mensaje: `la sección «${esperada.etiqueta}» está vacía: salida literal o «no aplica: <razón>»` });
  }
}

function validarBloquesDeOla(secciones, esperadas, errores) {
  for (const seccion of secciones) {
    const esperada = esperadas[seccion.encabezado.indice];
    if (!esperada) continue;
    const titulo = seccion.encabezado.texto;
    const esGrupo = esperada.repetible === true;
    const esPm = esperada.etiqueta === '### PM — fuera de los grupos';
    if (esGrupo || esPm) {
      const filas = seccion.contenido.filter((l) => l.texto.trim().startsWith('|'));
      const cabecera = filas[0]?.texto.replace(/\s+/g, ' ').trim();
      if (filas.length !== 3 || cabecera !== CABECERA_MINI_TABLA) {
        errores.push({ linea: seccion.encabezado.linea, mensaje: `el bloque «${titulo}» debe tener una mini tabla Mecánicas | Crítico de exactamente una fila` });
      }
      for (const vineta of esGrupo ? ['- Entrega:', '- Clases:'] : ['- Clases:']) {
        if (seccion.contenido.some((l) => l.texto.trim() === vineta)) continue;
        errores.push({ linea: seccion.encabezado.linea, mensaje: `el bloque «${titulo}» no tiene la viñeta «${vineta}»` });
      }
    }
    if (esperada.etiqueta === '## Deuda') {
      const items = [];
      for (const l of seccion.contenido) {
        if (/^\d+\. /.test(l.texto)) items.push({ linea: l.linea, texto: l.texto, sublineas: [] });
        else if (l.texto.trim() !== '') items.at(-1)?.sublineas.push(l.texto);
      }
      if (items.length === 1 && items[0]?.texto.trim() === '1. —') continue;
      for (const [k, item] of items.entries()) {
        if (!/#\d+/.test(item.texto)) errores.push({ linea: item.linea, mensaje: `el item ${k + 1} de «## Deuda» no dice de qué PR viene (#NNN)` });
        for (const etiqueta of ['Qué:', 'Impacto hoy:', 'Si no se hace:']) {
          if (item.sublineas.some((s) => s.includes(etiqueta))) continue;
          errores.push({ linea: item.linea, mensaje: `el item ${k + 1} de «## Deuda» no tiene la línea «${etiqueta}»` });
        }
      }
    }
  }
}

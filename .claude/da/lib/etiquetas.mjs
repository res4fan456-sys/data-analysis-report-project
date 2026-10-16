// Las etiquetas de GitHub que la mecánica usa, desde el perfil, y el diff
// contra las que existen. Pura; la cáscara llama a `gh label`.

const COLORES = {
  tipo: 'd4c5f9',
  area: 'c2e0c6',
  origen: 'fef2c0',
  carril: 'f9d0c4',
  impacto: 'e11d21',
};

function colorDe(nombre) {
  const prefijo = nombre.split(':')[0];
  return COLORES[prefijo] ?? '0e8a16';
}

/** Lista `{nombre, color, descripcion}` que el proyecto debe tener. */
export function etiquetasEsperadas(perfil, vista) {
  const e = perfil.etiquetas;
  const lista = [
    { nombre: e.carrilArreglo, descripcion: `Cambio pequeño que no paga la ola: ≤${perfil.limites.arreglo.lineasDeProducto} líneas de producto, sin ${perfil.limites.arreglo.excluye.join(', ')}` },
    { nombre: e.origen.planeacion, descripcion: 'Hallazgo del Planeador en el pre-vuelo de una ola' },
    { nombre: e.origen.ola, descripcion: 'Hallazgo del PM durante una ola' },
    { nombre: e.origen.auditoria, descripcion: 'Hallazgo de una auditoría' },
    { nombre: e.impactoVisible, descripcion: `Filtro de prioridad: lo percibe ${vista.usuarioFinal.el}` },
    ...e.tipo.map((t) => ({ nombre: t, descripcion: 'Tipo de hallazgo' })),
    ...vista.etiquetas.areas.map((a) => ({ nombre: a, descripcion: 'Área del proyecto' })),
    ...e.transversales.map((a) => ({ nombre: a, descripcion: 'Área transversal' })),
  ];
  const vistas = new Set();
  return lista
    .filter((x) => (vistas.has(x.nombre) ? false : vistas.add(x.nombre)))
    .map((x) => ({ ...x, color: colorDe(x.nombre) }));
}

/** Qué falta y qué sobra (lo que sobra solo se informa; nunca se borra). */
export function diferencia(esperadas, existentes) {
  const nombres = new Set(existentes);
  const faltan = esperadas.filter((e) => !nombres.has(e.nombre));
  const prefijos = new Set(esperadas.map((x) => x.nombre.split(':')[0]));
  const ajenasConPrefijo = existentes.filter((n) => n.includes(':') && prefijos.has(n.split(':')[0]) && !esperadas.some((x) => x.nombre === n));
  return { faltan, ajenasConPrefijo };
}

// Formato compartido de las tres tablas de `## Coste`: cifras en k/M con un
// decimal, y una tabla Markdown (GFM) mínima a partir de encabezados y
// filas ya armadas.

/**
 * Una cifra legible: por debajo de mil, entero sin sufijo; desde mil,
 * dividida entre 1000 (o un millón) con UN decimal y el sufijo `k`/`M`. El
 * signo se conserva tal cual (una resta puede dar negativo en algún caso
 * borde, y truncarlo a 0 escondería el dato en vez de mostrarlo raro).
 */
export function formatearCifra(numero) {
  const absoluto = Math.abs(numero);
  if (absoluto >= 1_000_000) return `${(numero / 1_000_000).toFixed(1)}M`;
  if (absoluto >= 1_000) return `${(numero / 1_000).toFixed(1)}k`;
  return `${Math.round(numero)}`;
}

/** Una tabla Markdown (GFM) mínima: encabezado, fila separadora, y una fila por cada elemento de `filas`. */
export function tablaMarkdown(encabezados, filas) {
  const lineaDe = (celdas) => `| ${celdas.join(' | ')} |`;
  return [lineaDe(encabezados), lineaDe(encabezados.map(() => '---')), ...filas.map((fila) => lineaDe(fila))].join('\n');
}

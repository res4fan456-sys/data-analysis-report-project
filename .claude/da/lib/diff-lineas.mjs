// Diff de líneas sin dependencias (LCS cuadrático: los archivos de la mecánica
// tienen cientos de líneas, no miles). Lo usan el test de fidelidad y los
// subcomandos que enseñan un diff al usuario.

/**
 * @returns {Array<{tipo: ' '|'-'|'+', linea: string}>}
 */
export function diffLineas(a, b) {
  const n = a.length;
  const m = b.length;
  // lcs[i][j] = longitud de la subsecuencia común de a[i..] y b[j..]
  const lcs = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }
  const ops = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      ops.push({ tipo: ' ', linea: a[i] });
      i += 1;
      j += 1;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      ops.push({ tipo: '-', linea: a[i] });
      i += 1;
    } else {
      ops.push({ tipo: '+', linea: b[j] });
      j += 1;
    }
  }
  while (i < n) ops.push({ tipo: '-', linea: a[i++] });
  while (j < m) ops.push({ tipo: '+', linea: b[j++] });
  return ops;
}

function partirLineas(texto) {
  const lineas = texto.split('\n');
  if (lineas[lineas.length - 1] === '') lineas.pop();
  return lineas;
}

/**
 * Diff unificado de dos textos, con `contexto` líneas alrededor de cada cambio.
 * Devuelve '' si son iguales.
 */
export function diffUnificado(textoA, textoB, { contexto = 2, archivo } = {}) {
  const ops = diffLineas(partirLineas(textoA), partirLineas(textoB));
  if (!ops.some((o) => o.tipo !== ' ')) return '';
  // índices de las operaciones que cambian, agrupadas si distan ≤ 2·contexto
  const cambios = ops.map((o, k) => (o.tipo === ' ' ? -1 : k)).filter((k) => k !== -1);
  const grupos = [];
  for (const k of cambios) {
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && k - ultimo[ultimo.length - 1] <= 2 * contexto + 1) ultimo.push(k);
    else grupos.push([k]);
  }
  let salida = archivo ? `--- v4.1/${archivo}\n+++ kit/${archivo}\n` : '';
  // posiciones de línea de cada op en a y en b
  let la = 1;
  let lb = 1;
  const posA = [];
  const posB = [];
  for (const o of ops) {
    posA.push(la);
    posB.push(lb);
    if (o.tipo !== '+') la += 1;
    if (o.tipo !== '-') lb += 1;
  }
  for (const grupo of grupos) {
    const desde = Math.max(0, grupo[0] - contexto);
    const hasta = Math.min(ops.length - 1, grupo[grupo.length - 1] + contexto);
    const trozo = ops.slice(desde, hasta + 1);
    const cuentaA = trozo.filter((o) => o.tipo !== '+').length;
    const cuentaB = trozo.filter((o) => o.tipo !== '-').length;
    salida += `@@ -${posA[desde]},${cuentaA} +${posB[desde]},${cuentaB} @@\n`;
    for (const o of trozo) salida += `${o.tipo}${o.linea}\n`;
  }
  return salida;
}

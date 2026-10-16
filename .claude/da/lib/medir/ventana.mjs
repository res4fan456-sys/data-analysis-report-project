// La ventana temporal de una medición: la que el usuario da explícita
// (`--desde`/`--hasta`), o si no da ninguna, la que cubren las PRs de la
// ola -- de su apertura más temprana a su cierre más tardío. Funciones
// puras; leer el reloj o listar PRs de verdad es de `comandos/medir.mjs`.

/**
 * La ventana temporal a usar: si `explicita` trae `desde` o `hasta` (uno
 * basta), esa es la ventana entera, sin mirar las PRs. Si no, sale del
 * rango de `prs`: la `createdAt` más temprana a la más tardía entre
 * `mergedAt` (o `createdAt`, si una PR sigue sin mergear) de cada una. Las
 * fechas son ISO 8601, que ordenan igual como texto que como instante, así
 * que basta comparar cadenas.
 * @param {{desde?: string, hasta?: string}} explicita
 * @param {Array<{createdAt: string, mergedAt: string|null}>} prs
 * @returns {{desde: string|undefined, hasta: string|undefined}}
 */
export function calcularVentana(explicita, prs) {
  if (explicita.desde !== undefined || explicita.hasta !== undefined) {
    return { desde: explicita.desde, hasta: explicita.hasta };
  }
  if (prs.length === 0) return { desde: undefined, hasta: undefined };

  let desde = prs[0].createdAt;
  let hasta = prs[0].mergedAt ?? prs[0].createdAt;
  for (const pr of prs) {
    if (pr.createdAt < desde) desde = pr.createdAt;
    const fin = pr.mergedAt ?? pr.createdAt;
    if (fin > hasta) hasta = fin;
  }
  return { desde, hasta };
}

/**
 * La ventana de un arreglo: la issue ya trae la etiqueta del carril cuando
 * el PM entra, y el PM commitea (propone el change, arregla) ANTES de abrir
 * la PR, así que `createdAt` de la PR se pierde casi todo ese trabajo. Abre
 * en lo más temprano entre `primerCommit`, `etiquetado` y `prCreatedAt` --
 * `prCreatedAt` SIEMPRE entra en el mínimo, no solo como respaldo cuando
 * faltan los otros dos: una fecha de commit o de etiquetado más tardía que
 * `createdAt` (un commit rehecho, una issue reetiquetada) no debe angostar
 * la ventana por debajo de lo que ya daba `createdAt` sola. Cierra en
 * `prMergedAt`, o en `ahora` (que pasa la cáscara -- esta función no lee el
 * reloj) si la PR sigue abierta.
 * @param {{primerCommit?: string, etiquetado?: string, prCreatedAt: string, prMergedAt: string|null}} fechas
 * @param {string} ahora
 */
export function calcularVentanaDeArreglo(fechas, ahora) {
  const candidatosDeApertura = [fechas.primerCommit, fechas.etiquetado, fechas.prCreatedAt].filter((valor) => valor !== undefined);
  const desde = candidatosDeApertura.reduce((a, b) => (a < b ? a : b));
  const hasta = fechas.prMergedAt ?? ahora;
  return { desde, hasta };
}

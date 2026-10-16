// Comprobación de arranque de una ola (`da preflight`): la lista de
// comprobaciones sale del perfil, y el formato del resumen es fijo. Pura; la
// cáscara corre cada comando y guarda su log.

/**
 * @param {object} perfil perfil completado
 * @returns {Array<{nombre: string, comando: string, pista: string, env?: object}>}
 */
export function construirComprobaciones(perfil) {
  const comprobaciones = [
    { nombre: 'gh auth', comando: 'gh auth status', pista: 'corre: gh auth login' },
    {
      nombre: `remoto ${perfil.proyecto.remoto} y ramas ${perfil.git.ola}*`,
      comando: `git ls-remote --heads ${perfil.proyecto.remoto} '${perfil.git.ola}*'`,
      pista: `revisa la red o el remoto ${perfil.proyecto.remoto}`,
    },
    { nombre: 'openspec', comando: 'openspec list --json', pista: 'instala openspec (npm i -g @fission-ai/openspec) o corre openspec init', env: { OPENSPEC_TELEMETRY: '0' } },
  ];
  if (perfil.modulos.graft) {
    comprobaciones.push({ nombre: 'graft', comando: 'graft --version', pista: 'instala graft (npm i -g @nanonets/graft) y corre graft init' });
  }
  if (perfil.comandos.entorno?.estado) {
    comprobaciones.push({ nombre: 'entorno', comando: perfil.comandos.entorno.estado, pista: 'levanta el entorno o revisa el runtime de contenedores' });
  }
  return comprobaciones;
}

/** Una línea por comprobación, y una final «N/M OK». */
export function resumen(resultados) {
  const lineas = resultados.map((c) => (c.ok ? `OK    · ${c.nombre}` : `FALLA · ${c.nombre}${c.pista ? ` — ${c.pista}` : ''}`));
  const oks = resultados.filter((c) => c.ok).length;
  lineas.push(`${oks}/${resultados.length} OK`);
  return lineas.join('\n');
}

export function todoOk(resultados) {
  return resultados.every((c) => c.ok);
}

// Clasifica de qué dominio es una PR por los archivos que toca: `planeacion`
// (un change de OpenSpec propuesto, un brief o una revisión de ola, una
// plantilla de issue), `archivado` (un change movido a archive/ y sus specs
// sincronizadas) o `usuario` (cualquier otra cosa: la que necesita ojos
// humanos). Pura; la cáscara (comandos/pr-dominio.mjs) llama a `gh`.

function sinBarraFinal(ruta) {
  return ruta.replace(/\/+$/, '');
}

/** Los prefijos y patrones de cada dominio, desde el perfil. */
export function dominiosDe(perfil) {
  const openspec = sinBarraFinal(perfil.rutas.openspec);
  const olas = sinBarraFinal(perfil.rutas.olas);
  const escapar = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return {
    changes: `${openspec}/changes/`,
    archive: `${openspec}/changes/archive/`,
    specs: `${openspec}/specs/`,
    issueTemplate: '.github/ISSUE_TEMPLATE/',
    brief: new RegExp(`^${escapar(olas)}/[^/]+-brief\\.md$`),
    revision: new RegExp(`^${escapar(olas)}/[^/]+-revision\\.md$`),
  };
}

/**
 * Si TODOS los archivos caen en planeación, `planeacion`; si todos caen en
 * archivado, `archivado`; si no, `usuario`, con `fuera` las rutas que no caen
 * en ninguno de los dos dominios.
 */
export function clasificarDominio(archivos, perfil) {
  const d = dominiosDe(perfil);
  const esPlaneacion = (a) => {
    if (a.startsWith(d.archive)) return false;
    return a.startsWith(d.changes) || d.brief.test(a) || d.revision.test(a) || a.startsWith(d.issueTemplate);
  };
  const esArchivado = (a) => a.startsWith(d.changes) || a.startsWith(d.specs);
  if (archivos.length > 0 && archivos.every(esPlaneacion)) return { veredicto: 'planeacion', fuera: [] };
  if (archivos.length > 0 && archivos.every(esArchivado)) return { veredicto: 'archivado', fuera: [] };
  return { veredicto: 'usuario', fuera: archivos.filter((a) => !esPlaneacion(a) && !esArchivado(a)) };
}

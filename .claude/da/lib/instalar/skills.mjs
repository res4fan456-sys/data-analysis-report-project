// Consultas para /find-skills a partir de la detección y el perfil: constantes
// de la mecánica, patrones del lenguaje, dependencias y señales. Pura; la
// búsqueda y la instalación las hace /da-init con /find-skills.

/**
 * @param {object} deteccion salida de detectar()
 * @param {object} mapa presets/skills-por-stack.json
 * @param {object} [perfil] perfil (para listar los skills que ya tiene cada área)
 * @returns {Array<{ambito: string, consulta: string, motivo: string, instalaPorDefecto?: string}>}
 */
export function sugerirConsultas(deteccion, mapa, perfil = null) {
  const consultas = [];
  const vistas = new Set();
  const añadir = (ambito, c) => {
    const clave = c.consulta.toLowerCase();
    if (vistas.has(clave)) return;
    vistas.add(clave);
    consultas.push({ ambito, ...c });
  };
  for (const c of mapa.constantes) añadir('constante', c);
  for (const lenguaje of deteccion.lenguajes ?? []) for (const c of mapa.porLenguaje[lenguaje] ?? []) añadir('lenguaje', c);
  for (const dep of deteccion.dependencias ?? []) {
    const consulta = mapa.porDependencia[dep];
    if (consulta) añadir('dependencia', { consulta, motivo: `dependencia detectada: ${dep}` });
  }
  const senales = deteccion.senales ?? {};
  if (senales.docker) añadir('senal', { consulta: mapa.porSenal['docker-compose'], motivo: 'hay docker compose' });
  if (senales.ci) añadir('senal', { consulta: mapa.porSenal['github-workflows'], motivo: 'hay workflows de GitHub Actions' });
  if (senales.ui) añadir('senal', { consulta: mapa.porSenal.ui, motivo: 'hay interfaz de usuario' });
  const instalados = new Set([...(perfil?.skills?.precargados ?? []), ...(perfil?.areas ?? []).flatMap((a) => (a.skills ?? []).map((s) => (typeof s === 'string' ? s : s.nombre)))]);
  return consultas.map((c) => ({ ...c, yaCubierto: instalados.size > 0 && [...instalados].some((s) => c.consulta.toLowerCase().includes(s.toLowerCase().split('-')[0])) }));
}

/** Los comandos `npx skills add` de las constantes, para imprimirlos. */
export function comandosDeConstantes(mapa) {
  return mapa.constantes.filter((c) => c.instalaPorDefecto).map((c) => `npx skills add ${c.instalaPorDefecto} -a claude-code -y`);
}

// La «vista»: lo que las plantillas leen. Toda derivación del perfil vive aquí,
// con tests, para que las plantillas solo consulten valores.

/** `el jugador` → el / al / un / del; `la analista` → la / a la / una / de la. */
export function formasDeUsuario(texto) {
  const limpio = texto.trim();
  if (/^el\s/i.test(limpio)) {
    const resto = limpio.slice(3);
    return { el: limpio, al: `al ${resto}`, un: `un ${resto}`, de: `del ${resto}` };
  }
  if (/^la\s/i.test(limpio)) {
    const resto = limpio.slice(3);
    return { el: limpio, al: `a la ${resto}`, un: `una ${resto}`, de: `de la ${resto}` };
  }
  return { el: limpio, al: `a ${limpio}`, un: limpio, de: `de ${limpio}` };
}

function normalizarSkills(skills = []) {
  return skills.map((s) => (typeof s === 'string' ? { nombre: s, cuando: '' } : { nombre: s.nombre, cuando: s.cuando ?? '' }));
}

function moduloActivo(valor) {
  return valor !== false && valor !== undefined && valor !== null;
}

/**
 * @param {object} perfil perfil ya completado y validado
 * @param {{version: string}} kit versión del kit que renderiza
 */
export function construirVista(perfil, kit) {
  const suitePerfil = moduloActivo(perfil.modulos.suiteDeSistema) ? perfil.modulos.suiteDeSistema : null;
  const areas = perfil.areas.map((area) => {
    const skills = normalizarSkills(area.skills);
    return {
      ejecutaSuite: Boolean(suitePerfil && (suitePerfil.rutas ?? []).some((r) => area.rutas.includes(r))),
      ...area,
      agente: area.principal ? 'implementador' : `implementador-${area.id}`,
      corto: area.corto ?? area.id,
      rutaCorta: area.rutas[0].replace(/\/?\*\*?$/, ''),
      etiqueta: area.etiqueta ?? area.id,
      skills,
      skillsNombres: skills.map((s) => s.nombre),
      lecturas: area.lecturas ?? [],
      visual: area.visual === true,
      contrato: area.contrato === true,
      descripcion: area.descripcion ?? area.nombre,
    };
  });
  const principal = areas.find((a) => a.principal);
  const modulosPerfil = perfil.modulos;
  const suite = moduloActivo(modulosPerfil.suiteDeSistema)
    ? {
        exclusiva: true,
        soloComentarios: [],
        rutas: [],
        puertos: [],
        ...modulosPerfil.suiteDeSistema,
      }
    : false;
  const evidenciaVisual = moduloActivo(modulosPerfil.evidenciaVisual) ? { herramienta: '', dispositivo: '', ...modulosPerfil.evidenciaVisual } : false;
  const areasVisuales = evidenciaVisual ? areas.filter((a) => a.visual) : [];
  const modulos = {
    graft: perfil.modulos.graft === true,
    citas: perfil.modulos.citas === true,
    medicion: perfil.modulos.medicion === true,
    ci: moduloActivo(modulosPerfil.ci) ? { ...modulosPerfil.ci } : false,
    suite,
    visual: evidenciaVisual,
    despliegue: moduloActivo(modulosPerfil.despliegue) ? { sinPreguntar: false, ...modulosPerfil.despliegue } : false,
    avisos: moduloActivo(modulosPerfil.avisos) ? { ...modulosPerfil.avisos } : false,
  };
  const da = perfil.kit.da;
  const pesadosTodos = [
    ...new Set([
      `${da} verify`,
      ...(suite ? [`${da} sistema`, suite.cmd] : []),
      ...perfil.comandos.pesados,
      ...(modulos.graft ? ['graft build'] : []),
    ]),
  ];
  const limites = {
    ...perfil.limites,
    relevoTokensMiles: Math.round(perfil.limites.relevoTokens / 1000),
  };
  const nombreIdioma = { en: 'inglés', es: 'español' };
  return {
    proyecto: perfil.proyecto,
    idiomas: {
      commits: nombreIdioma[perfil.proyecto.idiomaCommits],
      commitsTitulo: nombreIdioma[perfil.proyecto.idiomaCommits].replace(/^./, (c) => c.toUpperCase()),
      ramas: nombreIdioma[perfil.proyecto.idiomaRamas],
    },
    usuarioFinal: formasDeUsuario(perfil.proyecto.usuarioFinal),
    rutas: perfil.rutas,
    comandos: {
      ...perfil.comandos,
      entorno: { ...perfil.comandos.entorno, puertosRegex: (perfil.comandos.entorno.puertos ?? []).join('|') },
      pasosVerify: perfil.comandos.verify.map((p) => p.paso),
      pesadosTodos,
    },
    worktree: perfil.worktree,
    areas,
    principal,
    secundarias: areas.filter((a) => !a.principal),
    variantes: areas.map((a) => a.agente),
    hayVariasAreas: areas.length > 1,
    areasConContrato: areas.filter((a) => a.contrato),
    hayVisual: areasVisuales.length > 0,
    areasVisuales,
    skills: perfil.skills,
    roles: perfil.roles,
    limites,
    modulos,
    git: perfil.git,
    etiquetas: { ...perfil.etiquetas, areas: areas.map((a) => `area:${a.etiqueta}`) },
    guardia: perfil.guardia,
    kit: { ...perfil.kit, version: kit.version },
  };
}

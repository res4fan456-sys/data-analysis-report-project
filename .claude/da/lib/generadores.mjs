// Archivos que el render deriva del perfil con código, no con una plantilla:
// hoy, la configuración de la guardia (`.claude/da/guardia.json`). Puros.

/** Lo que la guardia necesita saber del proyecto. `generados` son las rutas que el kit generó (para `protegerGenerados`). */
export function configuracionDeGuardia(vista, { generados = [] } = {}) {
  return {
    rolesVetados: [...vista.variantes, 'critico'],
    tiposDelTeamManager: ['planeador', 'pm', 'archivador', 'lector'],
    lanzamientos: {
      'team-manager': ['planeador', 'pm', 'archivador', 'lector'],
      pm: [...vista.variantes, 'critico', 'lector'],
      planeador: ['lector'],
    },
    da: vista.kit.da,
    pesados: vista.comandos.pesadosTodos,
    pesadosSinRuta: vista.comandos.pesadosSinRuta ?? [],
    instalacion: vista.comandos.instalacion ?? [],
    graft: Boolean(vista.modulos.graft),
    interruptores: { ...vista.guardia },
    generados,
  };
}

export const GENERADORES = {
  guardia: (vista, extra) => `${JSON.stringify(configuracionDeGuardia(vista, extra), null, 2)}\n`,
};

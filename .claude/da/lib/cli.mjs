// Despachador de `da`: resuelve el subcomando y lo ejecuta con un contexto
// (cwd, salida, base del kit). Cada subcomando vive en comandos/<nombre>.mjs y
// exporta `ejecutar(args, ctx) → código de salida`.

const COMANDOS = {
  render: { carga: () => import('./comandos/render.mjs'), ayuda: 'Genera o actualiza los archivos de la mecánica en el proyecto desde el perfil' },
  en: { carga: () => import('./comandos/en.mjs'), ayuda: 'Corre un comando dentro de un directorio sin cd: da en <dir> -- <cmd>' },
  pesado: { carga: () => import('./comandos/pesado.mjs'), ayuda: 'Corre un comando bajo el candado global de la máquina: da pesado -- <cmd>' },
  verify: { carga: () => import('./comandos/verify.mjs'), ayuda: 'El gate: los pasos de comandos.verify del perfil, con candado, log y estado por SHA' },
  sistema: { carga: () => import('./comandos/sistema.mjs'), ayuda: 'La suite de sistema del perfil, con candado, log y estado por SHA' },
  preflight: { carga: () => import('./comandos/preflight.mjs'), ayuda: 'Comprobaciones de arranque de una ola (gh, remoto, openspec, graft, entorno)' },
  'pr-dominio': { carga: () => import('./comandos/pr-dominio.mjs'), ayuda: 'Clasifica una PR: planeacion | archivado | usuario' },
  etiquetas: { carga: () => import('./comandos/etiquetas.mjs'), ayuda: 'Diff de las etiquetas del perfil contra GitHub; --aplicar las crea' },
  worktree: { carga: () => import('./comandos/worktree.mjs'), ayuda: 'montar <ruta> --rama <r> [--desde <base>] [--sistema] [--lectura] · quitar <ruta> · listar' },
  'cuerpo-pr': { carga: () => import('./comandos/cuerpo-pr.mjs'), ayuda: 'lint --plantilla A|B|C --sha <sha> [--cierre] [cuerpo.md] · armar --sha <sha> [--ronda] …' },
  doctor: { carga: () => import('./comandos/doctor.mjs'), ayuda: 'Comprueba la instalación: herramientas, perfil, render, settings, guardia, anclas, agentes, skills, docs, GitHub' },
  citas: { carga: () => import('./comandos/citas.mjs'), ayuda: '(módulo) citas rotas en docs, skills y comentarios del código: da citas [rutas…]' },
  'diff-solo-comentarios': { carga: () => import('./comandos/diff-solo-comentarios.mjs'), ayuda: '(módulo) 0 si el código de producto solo cambió en comentarios desde <sha-base>' },
  medir: { carga: () => import('./comandos/medir.mjs'), ayuda: "(módulo) el bloque ## Coste de una ola o de un arreglo: da medir <ola|'#issue'> [--transcripciones <dir>] [--desde <iso>] [--hasta <iso>]" },
};

export function ayuda() {
  const lineas = Object.entries(COMANDOS).map(([nombre, c]) => `  ${nombre.padEnd(12)} ${c.ayuda}`);
  return `uso: da <subcomando> [opciones]\n\n${lineas.join('\n')}\n\nCódigos de salida: 0 bien · 1 comprobación fallida o conflictos · 2 uso o configuración · 75 candado ocupado\n`;
}

export async function ejecutar(argv, ctx) {
  const [nombre, ...resto] = argv;
  if (!nombre || nombre === 'ayuda' || nombre === '--help' || nombre === '-h') {
    ctx.stdout(ayuda());
    return nombre ? 0 : 2;
  }
  const comando = COMANDOS[nombre];
  if (!comando) {
    ctx.stderr(`da: subcomando desconocido «${nombre}»\n\n${ayuda()}`);
    return 2;
  }
  try {
    const modulo = await comando.carga();
    return await modulo.ejecutar(resto, ctx);
  } catch (e) {
    ctx.stderr(`da ${nombre}: ${e.message}\n`);
    return 2;
  }
}

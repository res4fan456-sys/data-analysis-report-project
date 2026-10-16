// De las respuestas de la entrevista de /da-init al perfil del proyecto. Pura.
// `respuestas` es lo que el skill recoge (ver skill-da-init/SKILL.md); el
// preset trae lo que depende del stack; la detección rellena huecos.

import { completar, fusionarProfundo, validar } from '../perfil.mjs';

function sinVacios(objeto) {
  return Object.fromEntries(Object.entries(objeto ?? {}).filter(([, v]) => v !== undefined && v !== null && v !== ''));
}

/**
 * @param {object} respuestas
 * @param {object} preset contenido de presets/<nombre>.json
 * @param {object} deteccion salida de detectar()
 * @returns {{perfil: object, errores: string[]}} el perfil tal como se escribe (sin defectos) y los errores de validación
 */
export function perfilDesdeRespuestas(respuestas, preset, deteccion = {}) {
  const r = respuestas;
  const stack = r.stack ?? {};
  const base = structuredClone(preset?.perfil ?? {});
  const paquete = stack.paqueteImportable ?? deteccion.paqueteImportable ?? 'app';
  const sustituir = (texto) => (typeof texto === 'string' ? texto.split('{paquete}').join(paquete) : texto);
  if (base.worktree) for (const k of Object.keys(base.worktree)) base.worktree[k] = sustituir(base.worktree[k]);
  if (preset?.tipoCheck && stack.tipos) {
    const [paso, cmd] = Object.entries(preset.tipoCheck)[0];
    base.comandos.verify.splice(1, 0, { paso: 'tipos', cmd });
    base.comandos.ligeros.typecheck = `${cmd.split(' ')[0]} {rutas}`;
    base.comandos.ligeros.typecheckTodos = cmd;
    void paso;
  }
  const propio = {
    version: 1,
    proyecto: sinVacios({
      nombre: r.proyecto?.nombre ?? deteccion.nombre ?? 'Proyecto',
      descripcion: r.proyecto?.descripcion,
      usuarioFinal: r.proyecto?.usuarioFinal,
      idiomaCommits: r.proyecto?.idiomaCommits,
      idiomaRamas: r.proyecto?.idiomaRamas ?? r.proyecto?.idiomaCommits,
      ramaPrincipal: r.proyecto?.ramaPrincipal,
      remoto: r.proyecto?.remoto,
      invariantes: r.invariantes,
      textosVisibles: r.proyecto?.textosVisibles,
    }),
    rutas: sinVacios({ documentos: r.documentos }),
    comandos: sinVacios({
      verify: stack.gate && stack.gate.length > 0 ? stack.gate : undefined,
      ligeros: stack.ligeros && Object.keys(stack.ligeros).length > 0 ? stack.ligeros : undefined,
      pesados: stack.pesados,
      entorno: stack.entorno && Object.keys(sinVacios(stack.entorno)).length > 0 ? sinVacios(stack.entorno) : undefined,
    }),
    worktree: stack.worktree ? sinVacios(stack.worktree) : undefined,
    areas: (r.areas ?? deteccion.areasPropuestas ?? [{ id: 'nucleo', principal: true, nombre: 'el núcleo', rutas: ['src/**'] }]).map((a) => sinVacios({ ...a, skills: a.skills?.length ? a.skills : undefined, lecturas: a.lecturas?.length ? a.lecturas : undefined })),
    skills: r.skills ? sinVacios(r.skills) : undefined,
    roles: r.mecanica?.roles,
    limites: r.mecanica?.limites,
    modulos: sinVacios({
      ...(r.mecanica?.modulos ?? {}),
      suiteDeSistema: stack.suite ? sinVacios(stack.suite) : r.mecanica?.modulos?.suiteDeSistema,
    }),
    git: r.mecanica?.git,
    guardia: r.mecanica?.guardia,
  };
  const perfil = sinVacios(fusionarProfundo(base, sinVacios(propio)));
  if (perfil.worktree && Object.keys(perfil.worktree).length === 0) delete perfil.worktree;
  const errores = validar(completar(perfil));
  return { perfil, errores };
}

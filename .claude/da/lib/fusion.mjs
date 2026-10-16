// Fusiones: los tres archivos que el kit comparte con el proyecto. Solo se toca
// lo propio; lo ajeno se conserva byte a byte en la medida de lo posible.

/** Fragmento de ruta que identifica un hook o comando como del kit. */
export const MARCA_KIT = '.claude/da';

const INICIO = /<!-- desarrollo-autonomo:inicio[^>]*-->\n?/g;
const FIN = '<!-- desarrollo-autonomo:fin -->';

function marcaInicio(version) {
  return `<!-- desarrollo-autonomo:inicio v${version} -->`;
}

/**
 * Inserta o reemplaza el bloque de normas en `CLAUDE.md`.
 * @param {string|null} actual contenido actual, o null si no existe
 * @param {string} bloque normas renderizadas (sin marcadores)
 * @param {{version: string, semilla?: string}} opciones `semilla`: secciones del
 *   proyecto que se añaden solo al crear el archivo
 */
export function fusionarClaudeMd(actual, bloque, { version, semilla = '' }) {
  const cuerpo = bloque.endsWith('\n') ? bloque : `${bloque}\n`;
  const envuelto = `${marcaInicio(version)}\n${cuerpo}${FIN}\n`;
  if (actual === null || actual === undefined) {
    const resto = semilla ? `\n${semilla.endsWith('\n') ? semilla : `${semilla}\n`}` : '';
    return { contenido: `# CLAUDE.md\n\n${envuelto}${resto}`, estado: 'creado' };
  }
  const inicios = [...actual.matchAll(INICIO)];
  if (inicios.length > 1) throw new Error('CLAUDE.md tiene más de un bloque de desarrollo-autonomo; deja uno');
  let contenido;
  if (inicios.length === 1) {
    const desde = inicios[0].index;
    const hastaFin = actual.indexOf(FIN, desde);
    if (hastaFin === -1) throw new Error('CLAUDE.md tiene el inicio del bloque pero no su fin');
    let hasta = hastaFin + FIN.length;
    if (actual[hasta] === '\n') hasta += 1;
    contenido = actual.slice(0, desde) + envuelto + actual.slice(hasta);
  } else {
    const titulo = /^# [^\n]*\n/.exec(actual);
    if (titulo) {
      const corte = titulo[0].length;
      const separador = actual.slice(corte).startsWith('\n') ? '\n' : '\n\n';
      const resto = actual.slice(corte).replace(/^\n+/, '');
      contenido = `${actual.slice(0, corte)}${separador}${envuelto}\n${resto}`;
    } else {
      contenido = `${envuelto}\n${actual}`;
    }
  }
  return { contenido, estado: contenido === actual ? 'igual' : 'actualizado' };
}

function esDelKit(entrada) {
  return Array.isArray(entrada.hooks) && entrada.hooks.length > 0 && entrada.hooks.every((h) => typeof h.command === 'string' && h.command.includes(MARCA_KIT));
}

function sinRepetidos(lista) {
  return lista.filter((v, i) => lista.indexOf(v) === i);
}

/**
 * Añade al `settings.json` lo que el kit necesita: `env`, `claudeMdExcludes`,
 * `permissions.deny` y sus hooks (reconocibles por `MARCA_KIT`). Idempotente.
 * @returns {{settings: object, cambios: string[]}}
 */
export function fusionarSettings(actual, aporte) {
  const settings = structuredClone(actual ?? {});
  const cambios = [];
  if (aporte.env) {
    settings.env = settings.env ?? {};
    for (const [clave, valor] of Object.entries(aporte.env)) {
      if (settings.env[clave] !== valor) {
        settings.env[clave] = valor;
        cambios.push(`env.${clave}`);
      }
    }
  }
  if (aporte.claudeMdExcludes) {
    const previos = settings.claudeMdExcludes ?? [];
    const nuevos = sinRepetidos([...previos, ...aporte.claudeMdExcludes]);
    if (nuevos.length !== previos.length) cambios.push('claudeMdExcludes');
    settings.claudeMdExcludes = nuevos;
  }
  if (aporte.permissions?.deny) {
    settings.permissions = settings.permissions ?? {};
    const previos = settings.permissions.deny ?? [];
    const nuevos = sinRepetidos([...previos, ...aporte.permissions.deny]);
    if (nuevos.length !== previos.length) cambios.push('permissions.deny');
    settings.permissions.deny = nuevos;
  }
  if (aporte.hooks) {
    settings.hooks = settings.hooks ?? {};
    for (const [evento, entradas] of Object.entries(aporte.hooks)) {
      const previas = settings.hooks[evento] ?? [];
      const ajenas = previas.filter((e) => !esDelKit(e));
      const propiasPrevias = previas.filter((e) => esDelKit(e));
      const nuevas = [...ajenas, ...structuredClone(entradas)];
      if (JSON.stringify(propiasPrevias) !== JSON.stringify(entradas)) cambios.push(`hooks.${evento}`);
      settings.hooks[evento] = nuevas;
    }
  }
  return { settings, cambios };
}

const GI_INICIO = '# desarrollo-autonomo:inicio';
const GI_FIN = '# desarrollo-autonomo:fin';

/** Bloque propio en `.gitignore`: se añade al final o se reemplaza. */
export function fusionarGitignore(actual, lineas) {
  const bloque = `${GI_INICIO}\n${lineas.join('\n')}\n${GI_FIN}\n`;
  if (actual === null || actual === undefined || actual === '') return bloque;
  const desde = actual.indexOf(GI_INICIO);
  if (desde !== -1) {
    const finIdx = actual.indexOf(GI_FIN, desde);
    if (finIdx === -1) throw new Error('.gitignore tiene el inicio del bloque de desarrollo-autonomo pero no su fin');
    let hasta = finIdx + GI_FIN.length;
    if (actual[hasta] === '\n') hasta += 1;
    return actual.slice(0, desde) + bloque + actual.slice(hasta);
  }
  const separador = actual.endsWith('\n\n') ? '' : actual.endsWith('\n') ? '\n' : '\n\n';
  return `${actual}${separador}${bloque}`;
}

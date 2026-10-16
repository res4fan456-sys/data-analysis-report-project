'use strict';
// Guardia por rol: el hook PreToolUse que vuelve raíl lo que CLAUDE.md escribe.
//
// 1. Bash: veta a implementadores y crítico lo que no es suyo —git y gh (salvo
//    la lectura del crítico), el comando pesado, las instalaciones por red,
//    graft sin `--no-refresh`—; y `cd` a todo el mundo (CLAUDE.md, *Nunca `cd`*).
// 2. Agent: acota al Team Manager a sus cuatro tipos; con el interruptor
//    `lanzamientosPorRol`, acota también al PM y al Planeador.
// 3. Write/Edit: con el interruptor `protegerGenerados`, nadie edita un archivo
//    que generó el kit.
//
// Es un raíl contra descuidos, NO un sandbox: un subshell, un `xargs` o un
// `sh -c` lo evaden a propósito, y no se persigue eso. La configuración (roles,
// comandos pesados, instaladores, interruptores) la escribe `da render` en
// `guardia.json`, junto a este archivo, desde el perfil del proyecto; las
// funciones `evaluar*` son puras y las prueban test/unit/guardia.test.mjs.
// Cuando node ejecuta este archivo como hook, lee el JSON de PreToolUse por
// stdin y, si hay veto, emite el `deny` con su motivo.

const fs = require('node:fs');
const path = require('node:path');

/** Parte un comando compuesto por sus separadores para juzgar cada tramo. */
function segmentar(comando) {
  return comando.split(/&&|\|\||[;&|\n]/);
}

/** Tokens de un tramo, sin asignaciones de entorno (`FOO=bar cmd`), envoltorios
 * inocuos (`sudo`, `env`, `command`, `nice`) ni `env -C <dir>` / `da en <dir> --`:
 * lo que se juzga es el comando que corre dentro. */
function tokenizar(segmento, da) {
  let tokens = segmento.trim().split(/\s+/).filter(Boolean);
  for (;;) {
    if (tokens.length === 0) return tokens;
    if (/^\w+=/.test(tokens[0]) || ['sudo', 'command', 'nice'].includes(tokens[0])) {
      tokens = tokens.slice(1);
      continue;
    }
    if (tokens[0] === 'env') {
      if (tokens[1] === '-C') tokens = tokens.slice(3);
      else tokens = tokens.slice(1);
      continue;
    }
    if (esDa(tokens[0], da) && tokens[1] === 'en') {
      const sep = tokens.indexOf('--');
      tokens = sep === -1 ? tokens.slice(3) : tokens.slice(sep + 1);
      continue;
    }
    return tokens;
  }
}

function esDa(token, da) {
  return token === da || token.endsWith('/da') || token === 'da';
}

/** Subcomando de git, saltando `-C <ruta>`, `-c k=v` y otras flags globales. */
function subcomandoGit(tokens) {
  let i = 1;
  while (i < tokens.length) {
    const t = tokens[i];
    if (t === '-C' || t === '-c' || t === '--git-dir' || t === '--work-tree') {
      i += 2;
      continue;
    }
    if (t.startsWith('-')) {
      i += 1;
      continue;
    }
    return t;
  }
  return '';
}

function empiezaPor(tokens, frase) {
  const partes = frase.trim().split(/\s+/);
  return partes.every((p, i) => tokens[i] === p);
}

function esPesado(tokens, config) {
  const normalizados = tokens.map((t) => (esDa(t, config.da) ? config.da : t));
  for (const pesado of config.pesados) if (empiezaPor(normalizados, pesado)) return pesado;
  for (const sinRuta of config.pesadosSinRuta) {
    const partes = sinRuta.trim().split(/\s+/);
    if (empiezaPor(normalizados, sinRuta) && normalizados.length === partes.length) return `${sinRuta} (sin ruta)`;
  }
  return null;
}

function esInstalacion(tokens, config) {
  for (const inst of config.instalacion) if (empiezaPor(tokens, inst)) return inst;
  return null;
}

/** Veto de un tramo ya tokenizado para un rol vetado (implementador o crítico), o `null`. */
function vetoDeTramo(tokens, rol, config) {
  if (tokens.length === 0) return null;
  const cmd = tokens[0];
  const sub = tokens[1] || '';
  const esCritico = rol === 'critico';
  if (cmd === 'git') {
    if (esCritico && ['show', 'diff', 'ls-tree', 'log', 'status'].includes(subcomandoGit(tokens))) return null;
    return esCritico ? 'El crítico solo lee git: show, diff, ls-tree, log, status (CLAUDE.md, Git 2). El resto es del PM.' : 'El implementador no toca git; deja los cambios sin commitear (CLAUDE.md, Git 2).';
  }
  if (cmd === 'gh') {
    if (esCritico && sub === 'pr' && ['view', 'diff', 'checks'].includes(tokens[2] || '')) return null;
    return esCritico ? 'El crítico solo lee gh: pr view, pr diff, pr checks (CLAUDE.md, Git 2).' : 'El implementador no toca gh (CLAUDE.md, Git 2).';
  }
  const inst = esInstalacion(tokens, config);
  if (inst) return `${inst} descarga o instala por red; eso lo hace el usuario (CLAUDE.md, Reglas de proceso 5).`;
  return null;
}

function vetoDePesado(tokens, config) {
  const pesado = esPesado(tokens, config);
  if (pesado) return `${pesado} es comando pesado; lo corre solo el PM, uno a la vez (CLAUDE.md, Desarrollo agéntico 8). Itera con checks ligeros por ruta.`;
  if (config.graft && (tokens[0] === 'graft' || tokens[0] === 'graft-dev')) {
    const sub = tokens[1] || '';
    if (['build', 'init', 'uninstall'].includes(sub)) return `graft ${sub} reconstruye o gestiona el grafo; es del PM (CLAUDE.md, Desarrollo agéntico 9).`;
    if (!tokens.includes('--no-refresh')) return 'graft sin --no-refresh puede reconstruir el grafo (comando pesado); añade --no-refresh (CLAUDE.md, Desarrollo agéntico 9).';
  }
  return null;
}

function tieneCd(tokens) {
  return tokens[0] === 'cd';
}

/**
 * ¿Se veta este comando Bash para este rol? Pura.
 * @param {string|undefined} rol  `agent_type` de quien llama (ausente en la sesión principal)
 * @param {string} comando        `.tool_input.command`
 * @param {object} config         guardia.json
 */
function evaluar(rol, comando, config) {
  if (typeof comando !== 'string' || comando.trim() === '') return { deny: false };
  const vetado = Boolean(rol && config.rolesVetados.includes(rol));
  const pesadoProhibido = vetado || (config.interruptores?.pesadoSoloPm && rol && rol !== 'pm');
  for (const tramo of segmentar(comando)) {
    const tokens = tokenizar(tramo, config.da);
    if (tieneCd(tokens)) {
      return { deny: true, motivo: `Prohibido cd (CLAUDE.md, Nunca cd): dispara petición de permiso y el directorio persiste entre comandos. Usa ${config.da} en <dir> -- <comando>, o rutas absolutas.` };
    }
    if (vetado) {
      const motivo = vetoDeTramo(tokens, rol, config);
      if (motivo) return { deny: true, motivo };
    }
    if (pesadoProhibido) {
      const motivo = vetoDePesado(tokens, config);
      if (motivo) return { deny: true, motivo };
    }
  }
  return { deny: false };
}

/** ¿Se veta este lanzamiento de subagente? Pura. */
function evaluarAgent(rol, tipo, config) {
  if (typeof tipo !== 'string' || tipo === '' || !rol) return { deny: false };
  if (rol === 'team-manager') {
    if (config.tiposDelTeamManager.includes(tipo)) return { deny: false };
    return { deny: true, motivo: `El Team Manager solo lanza ${config.tiposDelTeamManager.join(', ')}; '${tipo}' es del PM (docs/DESARROLLO-AUTONOMO.md §4).` };
  }
  if (!config.interruptores?.lanzamientosPorRol) return { deny: false };
  const permitidos = config.lanzamientos?.[rol] ?? [];
  if (permitidos.includes(tipo)) return { deny: false };
  return { deny: true, motivo: `${rol} ${permitidos.length ? `solo lanza ${permitidos.join(', ')}` : 'no lanza subagentes'}; '${tipo}' no está en su lista (docs/DESARROLLO-AUTONOMO.md §4).` };
}

/** ¿Se veta editar este archivo? Solo con `protegerGenerados`. Pura. */
function evaluarEdicion(rol, rutaArchivo, config) {
  if (!config.interruptores?.protegerGenerados || typeof rutaArchivo !== 'string') return { deny: false };
  const relativa = rutaArchivo.replace(/\\/g, '/');
  const generado = (config.generados ?? []).find((g) => relativa === g || relativa.endsWith(`/${g}`));
  if (!generado) return { deny: false };
  return { deny: true, motivo: `${generado} lo genera el kit (${config.da} render): cambia el perfil o la plantilla, no el archivo.` };
}

module.exports = { evaluar, evaluarAgent, evaluarEdicion, tokenizar, segmentar };

// --- Cáscara de hook: solo cuando node ejecuta este archivo directamente. ---
if (require.main === module) {
  let bruto = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (trozo) => {
    bruto += trozo;
  });
  process.stdin.on('end', () => {
    let payload = {};
    try {
      payload = JSON.parse(bruto || '{}');
    } catch {
      process.exit(0);
    }
    let config;
    try {
      config = JSON.parse(fs.readFileSync(path.join(__dirname, 'guardia.json'), 'utf8'));
    } catch {
      process.exit(0); // sin configuración no hay raíl; `da doctor` lo avisa
    }
    const rol = payload.agent_type || undefined;
    const entrada = payload.tool_input || {};
    let resultado;
    if (payload.tool_name === 'Agent') resultado = evaluarAgent(rol, entrada.subagent_type, config);
    else if (payload.tool_name === 'Bash') resultado = evaluar(rol, entrada.command || '', config);
    else resultado = evaluarEdicion(rol, entrada.file_path, config);
    if (resultado.deny) {
      process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: resultado.motivo } }));
    }
    process.exit(0);
  });
}

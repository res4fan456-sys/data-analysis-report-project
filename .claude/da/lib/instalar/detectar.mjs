// Detección del stack de un proyecto a partir de sus archivos de manifiesto.
// Pura: recibe `{ ruta: contenido|null }` y listas de directorios; la cáscara
// (skill-da-init/kit.mjs) lee el disco. Devuelve lo que /da-init propone en la
// entrevista: preset, gestor, lenguajes, dependencias, áreas candidatas y qué
// documentos de la mecánica ya existen, y si el plan del proyecto (PLAN y
// STACK escritos para él, `plan.mjs`) está listo para que /da-init arranque.

import { DOCUMENTOS_DEL_PLAN, estadoDelPlan } from './plan.mjs';

function nombresDeDependencias(paquete) {
  const campos = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];
  return [...new Set(campos.flatMap((c) => Object.keys(paquete[c] ?? {})))];
}

/** Dependencias de un pyproject sin parser de TOML: las listas `dependencies = [...]` y las de `[project.optional-dependencies]`. */
export function dependenciasDePyproject(texto) {
  const nombres = new Set();
  for (const bloque of texto.matchAll(/^\s*[\w-]+\s*=\s*\[([\s\S]*?)\]/gm)) {
    for (const item of bloque[1].matchAll(/["']([A-Za-z0-9_.-]+)/g)) nombres.add(item[1].toLowerCase());
  }
  // Herramientas configuradas en [tool.*] cuentan como señal aunque no sean dependencia declarada.
  for (const tool of texto.matchAll(/^\[tool\.([\w-]+)/gm)) nombres.add(tool[1].toLowerCase());
  return [...nombres];
}

function nombreDePyproject(texto) {
  const m = /^\s*name\s*=\s*["']([^"']+)["']/m.exec(texto);
  return m ? m[1] : null;
}

/**
 * @param {object} entrada
 * @param {Record<string, string|null>} entrada.archivos contenido de los manifiestos conocidos (null si no existe)
 * @param {string[]} entrada.directoriosSrc subdirectorios de `src/` (paquete importable en Python)
 * @param {boolean} entrada.hayCodigo si hay archivos de código fuera de los manifiestos
 * @param {string[]} entrada.workflows archivos de .github/workflows
 * @param {string[]} entrada.mcp nombres de los servidores MCP configurados (de usuario y del proyecto)
 */
export function detectar({ archivos, directoriosSrc = [], hayCodigo = false, workflows = [], mcp = [] }) {
  const existe = (r) => archivos[r] !== null && archivos[r] !== undefined;
  const deteccion = {
    stack: 'desconocido',
    preset: 'generico',
    lenguajes: [],
    gestor: null,
    nombre: null,
    dependencias: [],
    paquetes: [],
    paqueteImportable: null,
    senales: { docker: existe('docker-compose.yml') || existe('compose.yaml') || existe('docker-compose.yaml'), ci: workflows.length > 0, make: existe('Makefile'), just: existe('justfile'), avisar: mcp.includes('avisar') },
    greenfield: !hayCodigo,
    existentes: {
      claudeMd: existe('CLAUDE.md'),
      plan: existe('docs/PLAN.md'),
      stack: existe('docs/STACK.md'),
      arquitectura: existe('docs/ARQUITECTURA.md'),
      dominio: existe('docs/DOMINIO.md'),
      openspec: existe('openspec/config.yaml'),
      perfil: existe('.claude/desarrollo-autonomo.json'),
      graft: existe('.mcp.json') && /graft/.test(archivos['.mcp.json'] ?? ''),
    },
  };
  if (existe('package.json')) {
    let paquete = {};
    try {
      paquete = JSON.parse(archivos['package.json']);
    } catch {
      paquete = {};
    }
    deteccion.stack = 'node';
    deteccion.nombre = paquete.name ?? null;
    deteccion.dependencias = nombresDeDependencias(paquete);
    deteccion.gestor = existe('bun.lock') || existe('bun.lockb') ? 'bun' : existe('pnpm-lock.yaml') ? 'pnpm' : existe('yarn.lock') ? 'yarn' : 'npm';
    deteccion.preset = deteccion.gestor === 'bun' ? 'node-bun' : 'generico';
    deteccion.lenguajes = deteccion.dependencias.includes('typescript') || existe('tsconfig.json') ? ['typescript'] : ['javascript'];
    const ws = Array.isArray(paquete.workspaces) ? paquete.workspaces : paquete.workspaces?.packages ?? [];
    deteccion.paquetes = ws;
    if (deteccion.dependencias.some((d) => ['react', 'vue', 'svelte', 'next'].includes(d))) deteccion.senales.ui = true;
  } else if (existe('pyproject.toml') || existe('requirements.txt') || existe('setup.py')) {
    deteccion.stack = 'python';
    deteccion.preset = 'python';
    deteccion.lenguajes = ['python'];
    const pyproject = archivos['pyproject.toml'] ?? '';
    deteccion.nombre = nombreDePyproject(pyproject);
    deteccion.dependencias = [...new Set([...dependenciasDePyproject(pyproject), ...(archivos['requirements.txt'] ?? '').split('\n').map((l) => l.trim().split(/[=<>!\[ ]/)[0].toLowerCase()).filter(Boolean)])];
    deteccion.gestor = existe('uv.lock') || /\[tool\.uv\]/.test(pyproject) ? 'uv' : existe('poetry.lock') ? 'poetry' : 'pip';
    deteccion.paqueteImportable = directoriosSrc[0] ?? (deteccion.nombre ? deteccion.nombre.replace(/-/g, '_') : null);
    if (deteccion.dependencias.some((d) => ['streamlit', 'dash', 'gradio', 'panel', 'nicegui'].includes(d))) deteccion.senales.ui = true;
  } else if (existe('go.mod')) {
    deteccion.stack = 'go';
    deteccion.preset = 'generico';
    deteccion.lenguajes = ['go'];
    deteccion.gestor = 'go';
    deteccion.nombre = /^module\s+(\S+)/m.exec(archivos['go.mod'])?.[1]?.split('/').pop() ?? null;
  }
  deteccion.areasPropuestas = proponerAreas(deteccion, directoriosSrc);
  deteccion.plan = estadoDelPlan(Object.fromEntries(DOCUMENTOS_DEL_PLAN.map((d) => [d.ruta, archivos[d.ruta] ?? null])));
  return deteccion;
}

/** Áreas candidatas: una por paquete de workspace, o una por subdirectorio de src/, o una sola. */
export function proponerAreas(deteccion, directoriosSrc) {
  if (deteccion.paquetes.length > 0) {
    return deteccion.paquetes.map((glob, i) => {
      const base = glob.replace(/\/?\*\*?$/, '');
      const id = base.split('/').pop().replace(/[^a-z0-9-]/gi, '-').toLowerCase();
      return { id, principal: i === 0, nombre: `el paquete ${base}`, rutas: [`${base}/**`] };
    });
  }
  if (deteccion.stack === 'python' && directoriosSrc.length > 1) {
    return directoriosSrc.map((d, i) => ({ id: d.replace(/_/g, '-'), principal: i === 0, nombre: `el módulo ${d}`, rutas: [`src/${d}/**`] }));
  }
  const raiz = deteccion.stack === 'python' && directoriosSrc.length === 1 ? `src/${directoriosSrc[0]}/**` : 'src/**';
  return [{ id: 'nucleo', principal: true, nombre: 'el núcleo', rutas: [raiz] }];
}

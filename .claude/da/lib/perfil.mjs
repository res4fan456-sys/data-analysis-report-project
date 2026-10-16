// El perfil del proyecto (`.claude/desarrollo-autonomo.json`): esquema, defectos
// de la v4.1 y validación estricta, sin dependencias. El esquema se escribe una
// sola vez en el subconjunto de abajo y `aJsonSchema` lo convierte para los
// editores; el validador recorre el mismo objeto.

const texto = { tipo: 'texto' };
const entero = { tipo: 'entero' };
const booleano = { tipo: 'booleano' };
const listaDe = (de) => ({ tipo: 'lista', de });
const listaDeTexto = listaDe(texto);
const enumDe = (...valores) => ({ tipo: 'enum', valores });
const objeto = (campos, requeridos = []) => ({ tipo: 'objeto', campos, requeridos });
/** Un módulo opcional: `false` para apagarlo, o su configuración. */
const moduloOpcional = (configuracion) => ({ tipo: 'union', de: [enumDe(false), configuracion] });

const modelo = enumDe('opus', 'sonnet', 'haiku', 'fable', 'inherit');
const esfuerzo = enumDe('low', 'medium', 'high', 'xhigh', 'max');
const rol = objeto({ modelo, esfuerzo, maxTurns: entero });

export const ESQUEMA = objeto(
  {
    version: enumDe(1),
    proyecto: objeto(
      {
        nombre: texto,
        descripcion: texto,
        usuarioFinal: texto,
        idiomaCommits: enumDe('en', 'es'),
        idiomaRamas: enumDe('en', 'es'),
        ramaPrincipal: texto,
        remoto: texto,
        invariantes: listaDeTexto,
        textosVisibles: texto,
      },
      ['nombre'],
    ),
    rutas: objeto({
      plan: texto,
      arquitectura: texto,
      olas: texto,
      openspec: texto,
      worktrees: texto,
      capturas: texto,
      sinCodigo: listaDeTexto,
      documentos: listaDe(objeto({ ruta: texto, antesDe: texto }, ['ruta', 'antesDe'])),
    }),
    comandos: objeto(
      {
        verify: listaDe(objeto({ paso: texto, cmd: texto, resumen: texto }, ['paso', 'cmd'])),
        ligeros: objeto(
          { test: texto, typecheck: texto, typecheckTodos: texto, lint: texto, formato: texto },
          ['test'],
        ),
        pesados: listaDeTexto,
        pesadosSinRuta: listaDeTexto,
        instalacion: listaDeTexto,
        entorno: objeto({ levantar: texto, apagar: texto, estado: texto, puertos: listaDe(entero) }),
      },
      ['verify', 'ligeros'],
    ),
    worktree: objeto({ preparar: texto, prepararSistema: texto, comprobar: texto, limpiar: texto }),
    areas: listaDe(
      objeto(
        {
          id: texto,
          principal: booleano,
          nombre: texto,
          corto: texto,
          descripcion: texto,
          rutas: listaDeTexto,
          skills: listaDe({ tipo: 'union', de: [texto, objeto({ nombre: texto, cuando: texto }, ['nombre'])] }),
          lecturas: listaDeTexto,
          visual: booleano,
          contrato: booleano,
          etiqueta: texto,
        },
        ['id', 'nombre', 'rutas'],
      ),
    ),
    skills: objeto({ precargados: listaDeTexto, archivador: listaDeTexto }),
    roles: objeto({
      'team-manager': rol,
      planeador: objeto({
        modelo,
        esfuerzo,
        maxTurns: entero,
        modeloArquitectura: modelo,
        disparadoresArquitectura: listaDeTexto,
      }),
      pm: rol,
      implementador: rol,
      critico: rol,
      archivador: objeto({ modelo, esfuerzo, maxTurns: entero, modeloConDelta: modelo }),
      lector: objeto({ modelo, esfuerzo, maxTurns: entero, sinClaudeMd: booleano }),
    }),
    limites: objeto({
      changesPorOla: entero,
      prsInternasPorOla: entero,
      lineasPorGrupo: entero,
      lineasAlarma: entero,
      rondasDeCritico: entero,
      lineasDeVeredicto: entero,
      relevoPrs: entero,
      relevoTokens: entero,
      planeacionMaxHoras: entero,
      profundidadSubagentes: entero,
      arreglo: objeto({
        lineasDeProducto: entero,
        lineasEncargo: entero,
        lineasProposal: entero,
        lineasContexto: entero,
        excluye: listaDeTexto,
      }),
    }),
    modulos: objeto({
      graft: booleano,
      citas: booleano,
      medicion: booleano,
      ci: moduloOpcional(objeto({ workflowDocs: texto })),
      suiteDeSistema: moduloOpcional(
        objeto(
          {
            nombre: texto,
            cmd: texto,
            preparar: texto,
            resumen: texto,
            exclusiva: booleano,
            soloComentarios: listaDeTexto,
            rutas: listaDeTexto,
            puertos: listaDe(entero),
          },
          ['nombre', 'cmd'],
        ),
      ),
      evidenciaVisual: moduloOpcional(objeto({ herramienta: texto, dispositivo: texto })),
      despliegue: moduloOpcional(objeto({ workflow: texto, sinPreguntar: booleano })),
      // Avisos al usuario fuera del chat (p. ej. un MCP de Telegram): solo el Team Manager, solo en sus fronteras.
      avisos: moduloOpcional(objeto({ herramienta: texto }, ['herramienta'])),
    }),
    git: objeto({ merge: enumDe('squash', 'merge'), ola: texto, arreglo: texto, grupo: texto }),
    etiquetas: objeto({
      carrilArreglo: texto,
      origen: objeto({ planeacion: texto, ola: texto, auditoria: texto }),
      tipo: listaDeTexto,
      impactoVisible: texto,
      transversales: listaDeTexto,
    }),
    guardia: objeto({ pesadoSoloPm: booleano, lanzamientosPorRol: booleano, protegerGenerados: booleano }),
    kit: objeto({ da: texto }),
  },
  ['version', 'proyecto', 'comandos', 'areas'],
);

/** Valores de la mecánica v4.1. Lo que depende del stack lo trae el preset. */
export const DEFECTOS = Object.freeze({
  version: 1,
  proyecto: {
    usuarioFinal: 'quien usa el producto',
    idiomaCommits: 'en',
    idiomaRamas: 'en',
    ramaPrincipal: 'main',
    remoto: 'origin',
  },
  rutas: {
    plan: 'docs/PLAN.md',
    arquitectura: 'docs/ARQUITECTURA.md',
    olas: 'docs/olas',
    openspec: 'openspec',
    worktrees: '.claude/worktrees',
    capturas: 'imgs/screenshots',
    sinCodigo: ['openspec/', 'docs/', 'imgs/'],
    documentos: [],
  },
  comandos: {
    pesados: [],
    pesadosSinRuta: [],
    instalacion: ['npx', 'npm install', 'npm i', 'pnpm add', 'pnpm dlx', 'yarn add', 'bun add', 'bun install', 'bunx', 'pip install', 'pipx install', 'uv add', 'uv pip install', 'brew install'],
    entorno: { puertos: [] },
  },
  worktree: {},
  skills: { precargados: ['tdd', 'codebase-design'], archivador: ['gh'] },
  roles: {
    'team-manager': { modelo: 'opus', esfuerzo: 'high' },
    planeador: {
      modelo: 'opus',
      esfuerzo: 'high',
      maxTurns: 300,
      modeloArquitectura: 'fable',
      disparadoresArquitectura: [],
    },
    pm: { modelo: 'opus', esfuerzo: 'high', maxTurns: 500 },
    implementador: { modelo: 'sonnet', esfuerzo: 'high', maxTurns: 300 },
    critico: { modelo: 'opus', esfuerzo: 'xhigh', maxTurns: 150 },
    archivador: { modelo: 'haiku', modeloConDelta: 'sonnet' },
    lector: { modelo: 'haiku', sinClaudeMd: false },
  },
  limites: {
    changesPorOla: 2,
    prsInternasPorOla: 5,
    lineasPorGrupo: 600,
    lineasAlarma: 1800,
    rondasDeCritico: 2,
    lineasDeVeredicto: 80,
    relevoPrs: 3,
    relevoTokens: 400000,
    planeacionMaxHoras: 1,
    profundidadSubagentes: 3,
    arreglo: {
      lineasDeProducto: 30,
      lineasEncargo: 15,
      lineasProposal: 10,
      lineasContexto: 5,
      excluye: [
        'una regla de dominio en el núcleo',
        'un cambio de contrato entre módulos',
        'una migración',
        'un flujo nuevo en la suite de sistema',
      ],
    },
  },
  modulos: {
    graft: true,
    citas: true,
    medicion: true,
    ci: { workflowDocs: 'citas.yml' },
    suiteDeSistema: false,
    evidenciaVisual: false,
    despliegue: false,
    avisos: false,
  },
  git: { merge: 'squash', ola: 'ola/', arreglo: 'fix/', grupo: '<tipo>/<fase>-<descripcion-corta>' },
  etiquetas: {
    carrilArreglo: 'carril:arreglo',
    origen: { planeacion: 'origen:pre-vuelo', ola: 'origen:ola', auditoria: 'origen:auditoria' },
    tipo: ['tipo:fallo-latente', 'tipo:oportunidad', 'tipo:deuda-tecnica'],
    impactoVisible: 'impacto:visible',
    transversales: ['area:ui-ux', 'area:rendimiento', 'area:seguridad', 'area:infra', 'area:pruebas', 'area:mecanica'],
  },
  guardia: { pesadoSoloPm: false, lanzamientosPorRol: false, protegerGenerados: false },
  kit: { da: '.claude/da/da' },
});

function esObjetoPlano(valor) {
  return valor !== null && typeof valor === 'object' && !Array.isArray(valor);
}

/** Fusión profunda: los objetos se combinan, todo lo demás (listas incluidas) se reemplaza. */
export function fusionarProfundo(base, encima) {
  if (!esObjetoPlano(base) || !esObjetoPlano(encima)) return structuredClone(encima);
  const salida = structuredClone(base);
  for (const [clave, valor] of Object.entries(encima)) {
    salida[clave] = clave in salida ? fusionarProfundo(salida[clave], valor) : structuredClone(valor);
  }
  return salida;
}

/** defectos ← preset ← perfil. No muta ninguno. */
export function completar(perfil, preset = {}) {
  return fusionarProfundo(fusionarProfundo(DEFECTOS, preset), perfil);
}

function describirTipo(valor) {
  if (valor === null) return 'null';
  if (Array.isArray(valor)) return 'lista';
  return typeof valor;
}

function validarContra(esquema, valor, ruta, errores) {
  switch (esquema.tipo) {
    case 'texto':
      if (typeof valor !== 'string') errores.push(`${ruta}: se esperaba texto, llegó ${describirTipo(valor)}`);
      return;
    case 'entero':
      if (!Number.isInteger(valor)) errores.push(`${ruta}: se esperaba un entero, llegó ${describirTipo(valor)}`);
      return;
    case 'booleano':
      if (typeof valor !== 'boolean') errores.push(`${ruta}: se esperaba true o false, llegó ${describirTipo(valor)}`);
      return;
    case 'enum':
      if (!esquema.valores.includes(valor)) {
        errores.push(`${ruta}: valor fuera de ${JSON.stringify(esquema.valores)}: ${JSON.stringify(valor)}`);
      }
      return;
    case 'lista':
      if (!Array.isArray(valor)) {
        errores.push(`${ruta}: se esperaba una lista, llegó ${describirTipo(valor)}`);
        return;
      }
      valor.forEach((elemento, i) => validarContra(esquema.de, elemento, `${ruta}[${i}]`, errores));
      return;
    case 'union': {
      const intentos = esquema.de.map((opcion) => {
        const propios = [];
        validarContra(opcion, valor, ruta, propios);
        return propios;
      });
      if (!intentos.some((e) => e.length === 0)) {
        errores.push(`${ruta}: no encaja en ninguna de las formas admitidas (${intentos.map((e) => e[0]).join(' | ')})`);
      }
      return;
    }
    case 'objeto': {
      if (!esObjetoPlano(valor)) {
        errores.push(`${ruta}: se esperaba un objeto, llegó ${describirTipo(valor)}`);
        return;
      }
      for (const requerido of esquema.requeridos) {
        if (!(requerido in valor)) errores.push(`${ruta}.${requerido}: falta y es obligatorio`);
      }
      for (const [clave, hijo] of Object.entries(valor)) {
        if (!(clave in esquema.campos)) {
          errores.push(`${ruta}.${clave}: clave desconocida`);
          continue;
        }
        validarContra(esquema.campos[clave], hijo, `${ruta}.${clave}`, errores);
      }
      return;
    }
    default:
      throw new Error(`esquema con tipo desconocido: ${esquema.tipo}`);
  }
}

const ID_DE_AREA = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** La parte literal de un glob: lo que hay antes del primer `*`, `?` o `[`. */
function prefijoLiteral(glob) {
  const corte = glob.search(/[*?[]/);
  const literal = corte === -1 ? glob : glob.slice(0, corte);
  return literal.replace(/\/+$/, '');
}

function solapan(a, b) {
  const pa = prefijoLiteral(a);
  const pb = prefijoLiteral(b);
  if (pa === '' || pb === '') return true;
  return pa === pb || pa.startsWith(`${pb}/`) || pb.startsWith(`${pa}/`);
}

function validarSemantica(perfil, errores) {
  const areas = Array.isArray(perfil.areas) ? perfil.areas : [];
  if (areas.length === 0) errores.push('areas: hace falta al menos un área');
  const principales = areas.filter((a) => a && a.principal === true);
  if (areas.length > 0 && principales.length !== 1) {
    errores.push(`areas: debe haber exactamente un área principal (hay ${principales.length})`);
  }
  const ids = new Set();
  areas.forEach((area, i) => {
    if (!area || typeof area.id !== 'string') return;
    if (!ID_DE_AREA.test(area.id)) {
      errores.push(`areas[${i}].id: debe ser minúsculas, dígitos y guiones (${JSON.stringify(area.id)})`);
    }
    if (ids.has(area.id)) errores.push(`areas[${i}].id: repetido (${area.id})`);
    ids.add(area.id);
    if (Array.isArray(area.rutas) && area.rutas.length === 0) {
      errores.push(`areas[${i}].rutas: hace falta al menos una ruta`);
    }
  });
  for (let i = 0; i < areas.length; i += 1) {
    for (let j = i + 1; j < areas.length; j += 1) {
      const ra = areas[i]?.rutas ?? [];
      const rb = areas[j]?.rutas ?? [];
      for (const a of ra) {
        for (const b of rb) {
          if (typeof a === 'string' && typeof b === 'string' && solapan(a, b)) {
            errores.push(`areas: las rutas deben ser disjuntas; ${areas[i].id} (${a}) y ${areas[j].id} (${b}) se solapan`);
          }
        }
      }
    }
  }
  const pasos = perfil.comandos?.verify;
  if (Array.isArray(pasos)) {
    if (pasos.length === 0) errores.push('comandos.verify: hace falta al menos un paso');
    pasos.forEach((paso, i) => {
      if (paso && typeof paso.resumen === 'string') {
        try {
          new RegExp(paso.resumen);
        } catch (e) {
          errores.push(`comandos.verify[${i}].resumen: regex inválida (${e.message})`);
        }
      }
    });
  }
  const suite = perfil.modulos?.suiteDeSistema;
  if (suite && typeof suite === 'object' && typeof suite.resumen === 'string') {
    try {
      new RegExp(suite.resumen);
    } catch (e) {
      errores.push(`modulos.suiteDeSistema.resumen: regex inválida (${e.message})`);
    }
  }
}

/**
 * Valida un perfil ya completado. Devuelve la lista de errores (vacía si vale).
 * @param {object} perfil
 * @returns {string[]}
 */
export function validar(perfil) {
  const errores = [];
  validarContra(ESQUEMA, perfil, 'perfil', errores);
  validarSemantica(perfil, errores);
  return errores.map((e) => e.replace(/^perfil\./, ''));
}

/** El esquema interno como JSON Schema (para editores y para `docs/PERFIL.md`). */
export function aJsonSchema(esquema) {
  switch (esquema.tipo) {
    case 'texto':
      return { type: 'string' };
    case 'entero':
      return { type: 'integer' };
    case 'booleano':
      return { type: 'boolean' };
    case 'enum':
      return { enum: esquema.valores };
    case 'lista':
      return { type: 'array', items: aJsonSchema(esquema.de) };
    case 'union':
      return { anyOf: esquema.de.map(aJsonSchema) };
    case 'objeto': {
      const properties = {};
      for (const [clave, hijo] of Object.entries(esquema.campos)) properties[clave] = aJsonSchema(hijo);
      const salida = { type: 'object', properties, additionalProperties: false };
      if (esquema.requeridos.length > 0) salida.required = [...esquema.requeridos];
      return salida;
    }
    default:
      throw new Error(`esquema con tipo desconocido: ${esquema.tipo}`);
  }
}

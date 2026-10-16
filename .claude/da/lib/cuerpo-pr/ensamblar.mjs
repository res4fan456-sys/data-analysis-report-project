// Arma los bloques de Evidencia del cuerpo de una PR de grupo (plantilla A) o
// el comentario `## Evidencia — <sha>` de una ronda, a partir del estado que
// dejaron `da verify` y `da sistema` y de lo que el PM aporte (capturas,
// openspec, mutación). Pura; la cáscara (comandos/cuerpo-pr.mjs) lee los
// archivos. Produce exactamente los encabezados que `validar.mjs` exige.

import { resumirVerify } from '../verify.mjs';

const CERCA = '```';

function bloqueCodigo(salida) {
  return `${CERCA}\n${salida}\n${CERCA}`;
}

/** El texto del bloque `verify` desde el estado de `da verify`. */
export function textoDeEstado(estado) {
  return resumirVerify({ nombre: estado.nombre, sha: estado.sha, sucio: estado.sucio, pasos: estado.pasos, enlaces: estado.enlaces });
}

function renderVerify(verify) {
  if (!verify) return '### `verify`\n\nno aplica: sin estado de `da verify` para este SHA (si la PR no toca nada fuera de las rutas sin código, dilo aquí)';
  if (verify.noAplica) return `### \`verify\`\n\nno aplica: ${verify.noAplica}`;
  const worktree = verify.worktree ? ` — worktree \`${verify.worktree}\`` : '';
  return `### \`verify\`${worktree}\n\n${bloqueCodigo(textoDeEstado(verify))}`;
}

function renderSuite(nombre, suite) {
  if (!suite) return `### \`${nombre}\`\n\nno corrida: sin estado de \`da sistema\` para este SHA (declara aquí la razón de §2.2.5)`;
  if (suite.noCorrida) return `### \`${nombre}\`\n\nno corrida: ${suite.noCorrida}`;
  const pila = suite.pila ? `${suite.pila}\n\n` : '';
  return `### \`${nombre}\`\n\n${pila}${bloqueCodigo(textoDeEstado(suite))}`;
}

function renderCapturas(capturas) {
  if (!capturas || capturas.noAplica) return `### Capturas\n\nno aplica: ${capturas?.noAplica ?? 'sin cambios visuales'}`;
  const filas = capturas.filas.map((f) => `| ${f.escenario} | ${f.antes} | ${f.despues} |`).join('\n');
  return `### Capturas — ${capturas.dispositivo}\n\n| Escenario | Antes | Después |\n|---|---|---|\n${filas}`;
}

function renderOpenspec(openspecRuta, texto, sha) {
  return `### \`${openspecRuta}/\`\n\n${texto ?? `\`${sha}\` — solo casillas.`}`;
}

function renderMutacion(mutacion) {
  return `### Mutación\n\n${bloqueCodigo(mutacion ?? 'sin tests nuevos en este grupo')}`;
}

/**
 * El bloque de Evidencia completo (cuerpo de una PR de grupo).
 * @param {{sha: string, verify?: object, suite?: object, capturas?: object, openspec?: string, mutacion?: string}} datos
 * @param {{suiteNombre: string|null, hayVisual: boolean, openspecRuta: string}} opciones
 */
export function ensamblarEvidencia(datos, opciones) {
  const partes = [`## Evidencia — \`${datos.sha}\``, renderVerify(datos.verify)];
  if (opciones.suiteNombre) partes.push(renderSuite(opciones.suiteNombre, datos.suite));
  if (opciones.hayVisual) partes.push(renderCapturas(datos.capturas));
  partes.push(renderOpenspec(opciones.openspecRuta, datos.openspec, datos.sha), renderMutacion(datos.mutacion));
  return `${partes.join('\n\n')}\n`;
}

/** El comentario de una ronda: solo los bloques que cambiaron. */
export function bloqueDeRonda(datos, opciones) {
  const partes = [`## Evidencia — \`${datos.sha}\``];
  if (datos.verify) partes.push(renderVerify(datos.verify));
  if (opciones.suiteNombre && datos.suite) partes.push(renderSuite(opciones.suiteNombre, datos.suite));
  if (opciones.hayVisual && datos.capturas) partes.push(renderCapturas(datos.capturas));
  if (datos.openspec) partes.push(renderOpenspec(opciones.openspecRuta, datos.openspec, datos.sha));
  if (datos.mutacion) partes.push(renderMutacion(datos.mutacion));
  return `${partes.join('\n\n')}\n`;
}

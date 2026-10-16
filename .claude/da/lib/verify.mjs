// El gate (`da verify`) y la suite de sistema (`da sistema`): lógica pura
// sobre un `correr(cmd)` inyectado. La cáscara (comandos/verify.mjs) pone el
// candado, el cwd, el log y el estado por SHA.

/**
 * Corre los pasos en orden y para en el primero que falla.
 * @param {Array<{paso: string, cmd: string, resumen?: string}>} pasos
 * @param {(cmd: string) => {codigo: number, stdout: string, stderr: string}} correr
 */
export function correrPasos(pasos, correr) {
  const resultados = [];
  let roto = false;
  for (const p of pasos) {
    if (roto) {
      resultados.push({ paso: p.paso, cmd: p.cmd, estado: 'NO CORRIDO', lineas: [], salida: '' });
      continue;
    }
    const r = correr(p.cmd);
    const salida = `${r.stdout ?? ''}${r.stderr ?? ''}`;
    const regex = p.resumen ? new RegExp(p.resumen) : null;
    const lineas = regex ? salida.split('\n').filter((l) => regex.test(l)) : [];
    const estado = r.codigo === 0 ? 'OK' : 'FALLA';
    if (estado === 'FALLA') roto = true;
    resultados.push({ paso: p.paso, cmd: p.cmd, estado, codigo: r.codigo, lineas, salida });
  }
  return { pasos: resultados, verde: !roto };
}

/** Rutas impresas por el gancho `comprobar`: todas deben caer bajo el worktree. */
export function comprobarRutasBajo(wt, salida) {
  const rutas = salida.split('\n').map((l) => l.trim()).filter(Boolean);
  const base = wt.endsWith('/') ? wt : `${wt}/`;
  const fuera = rutas.filter((r) => r !== wt && !r.startsWith(base));
  if (rutas.length === 0) return { estado: 'FUERA', fuera: [] };
  return { estado: fuera.length === 0 ? 'OK' : 'FUERA', fuera };
}

/** El resumen que va al cuerpo de la PR: una cabecera por SHA, el estado por paso y las líneas capturadas. */
export function resumirVerify({ nombre, sha, sucio, pasos, enlaces }) {
  const cabecera = `${nombre} — ${sha ?? 'sin git'}${sucio ? '+sucio' : ''}: ${pasos.map((p) => `${p.paso} ${p.estado}`).join(' · ')}`;
  const capturadas = pasos.filter((p) => p.lineas.length > 0).map((p) => `  ${p.paso}: ${p.lineas.join(' | ')}`);
  const lineas = [cabecera, ...capturadas];
  if (enlaces) lineas.push(`enlaces del worktree: ${enlaces}`);
  return lineas.join('\n');
}

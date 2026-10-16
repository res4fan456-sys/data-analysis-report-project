// `da pr-dominio <n>`: imprime `DOMINIO: planeacion|archivado|usuario` y, si es
// `usuario`, una línea por ruta ajena a los dos dominios. 0 si es planeación o
// archivado, 1 si es usuario, 2 si los argumentos no valen o `gh` falla.

import { analizarArgumentos, raizDelProyecto } from '../entorno.mjs';
import { cargarPerfil } from './render.mjs';
import { ejecutar as ejecutarBinario } from '../procesos.mjs';
import { clasificarDominio } from '../pr-dominio.mjs';

export async function ejecutar(args, ctx) {
  const { opciones, posicionales } = analizarArgumentos(args);
  const numero = Number(posicionales[0]);
  if (!posicionales[0] || !Number.isInteger(numero) || numero <= 0) {
    ctx.stderr('uso: da pr-dominio <n>\n');
    return 2;
  }
  const raiz = raizDelProyecto(opciones.raiz, ctx.cwd, ctx.baseDelKit);
  const perfil = cargarPerfil(raiz);
  const r = ejecutarBinario('gh', ['pr', 'view', String(numero), '--json', 'number,files'], { cwd: raiz });
  if (r.codigo !== 0) {
    ctx.stderr(`da pr-dominio: gh falló — ${r.stderr.trim() || r.error?.message || ''}\n`);
    return 2;
  }
  const archivos = JSON.parse(r.stdout).files.map((f) => f.path);
  const resultado = clasificarDominio(archivos, perfil);
  ctx.stdout(`DOMINIO: ${resultado.veredicto}\n${resultado.fuera.map((f) => `${f}\n`).join('')}`);
  return resultado.veredicto === 'usuario' ? 1 : 0;
}

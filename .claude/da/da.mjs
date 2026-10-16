#!/usr/bin/env node
// Punto de entrada de `da`. Toda la lógica está en lib/; aquí solo se arma el
// contexto y se traduce el código de salida.

import { ejecutar } from './lib/cli.mjs';
import { baseDelKit } from './lib/entorno.mjs';

// Un `| head` que cierra la tubería no es un error del kit.
process.stdout.on('error', (e) => {
  if (e.code === 'EPIPE') process.exit(0);
  throw e;
});

const ctx = {
  cwd: process.cwd(),
  env: process.env,
  baseDelKit: baseDelKit(),
  stdout: (texto) => process.stdout.write(texto),
  stderr: (texto) => process.stderr.write(texto),
};

process.exitCode = await ejecutar(process.argv.slice(2), ctx);

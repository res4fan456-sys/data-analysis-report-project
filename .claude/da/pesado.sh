#!/usr/bin/env bash
# Candado del comando pesado entre sesiones: garantiza «un solo comando pesado a
# la vez en toda la máquina» (CLAUDE.md, Desarrollo agéntico 8). Dos corridas
# del gate o de la suite a la vez congelan la máquina; este envoltorio hace
# que la segunda espere o salga con 75 (EX_TEMPFAIL) sin correr nada.
#
# macOS no trae `flock`; sí `lockf`. Linux trae `flock` (util-linux) y no trae
# `lockf`. `lockf -t 0` y `flock -w 0 -E 75` toman el candado sin esperar y, si
# otra sesión lo tiene, salen con 75 sin correr el comando. `DA_LOCK_TIMEOUT`
# cambia la espera (segundos; por defecto 900: otro proyecto de la misma
# máquina puede tener el candado con su propio gate, y lo correcto es esperar
# a que suelte, no fallar). `DA_LOCK` cambia la ruta del candado; por defecto
# es uno por usuario y por máquina, no por proyecto: lo que satura es la
# máquina, y cada proyecto tiene su propio PM.
#
# Uso: pesado.sh <comando...>   (lo invoca `da pesado -- <comando>`)

set -uo pipefail

LOCK="${DA_LOCK:-${TMPDIR:-/tmp}/desarrollo-autonomo-${USER:-usuario}.lock}"
INFO="${LOCK}.info"
TIMEOUT="${DA_LOCK_TIMEOUT:-900}"

if [ "$#" -eq 0 ]; then
  echo "uso: pesado.sh <comando...>" >&2
  exit 2
fi

# El cuerpo que toma el candado: apunta el PID y el comando en el archivo de
# info (para que quien choque sepa contra qué), borra esa nota al salir aunque
# el comando falle, y corre el comando.
CUERPO='
  echo "$$ · $PWD · $*" > "$0"
  trap "rm -f \"$0\"" EXIT
  "$@"
'

# Si el candado ya está tomado y hay espera, se avisa antes de esperar: quien
# mira la terminal sabe contra qué proyecto y comando está esperando.
if [ "$TIMEOUT" != "0" ]; then
  if command -v lockf >/dev/null 2>&1; then lockf -s -t 0 "$LOCK" true 2>/dev/null; libre=$?; else flock -n -E 75 "$LOCK" true; libre=$?; fi
  if [ "$libre" -eq 75 ]; then
    echo "candado: ocupado por otro proceso ($(cat "$INFO" 2>/dev/null || true)); espero hasta ${TIMEOUT} s a que suelte." >&2
  fi
fi

if command -v lockf >/dev/null 2>&1; then
  lockf -s -t "$TIMEOUT" "$LOCK" bash -c "$CUERPO" "$INFO" "$@"
  codigo=$?
else
  flock -w "$TIMEOUT" -E 75 "$LOCK" bash -c "$CUERPO" "$INFO" "$@"
  codigo=$?
fi

if [ "$codigo" -eq 75 ]; then
  contenido="$(cat "$INFO" 2>/dev/null || true)"
  if [ -n "$contenido" ]; then
    echo "candado: ocupado por otro proceso ($contenido). No se lanza un segundo comando pesado a la vez (satura la máquina): espera a que termine y reintenta." >&2
  else
    echo "candado: ocupado por otro proceso. No se lanza un segundo comando pesado a la vez (satura la máquina): espera a que termine." >&2
  fi
fi
exit "$codigo"

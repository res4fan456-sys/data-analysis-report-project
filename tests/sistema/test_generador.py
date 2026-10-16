"""Guarda de reproducibilidad del generador sintético, ejecutado como lo corre el usuario."""

from __future__ import annotations

import csv
import hashlib
import io
import os
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path

import pytest

pytestmark = pytest.mark.sistema

RAIZ = Path(__file__).resolve().parents[2]
TIEMPO_MAXIMO_SEGUNDOS = 300

COLUMNAS = [
    "id_transaccion",
    "fecha",
    "monto",
    "concepto",
    "categoria",
    "cuenta",
    "zona",
    "latitud",
    "longitud",
]

SHA_CSV_SEPTIEMBRE = "f8dc956e3793c30b93e29331f13f2fd8e68337ecb4e499d36a1cc594d0938390"
SHA_RESUMEN_SEPTIEMBRE = "ba0b1f02b07bd20069357506f8240e9e790eb96557f343c5c85b070e6e8d1a21"
SHA_CSV_FEBRERO = "82db2f1552bd7f497f27f494ecc7faa50c34e269b972906ccfc3efc61d546cea"


@dataclass(frozen=True)
class Corrida:
    codigo: int
    csv: bytes
    salida: bytes
    errores: bytes


def _generar(directorio: Path, *argumentos: str) -> Corrida:
    ruta = directorio / "transacciones.csv"
    proceso = subprocess.run(
        [sys.executable, "generar_transacciones.py", *argumentos, "-o", str(ruta)],
        cwd=RAIZ,
        capture_output=True,
        check=False,
        timeout=TIEMPO_MAXIMO_SEGUNDOS,
        env={**os.environ, "PYTHONIOENCODING": "utf-8"},
    )
    contenido = ruta.read_bytes() if ruta.exists() else b""
    return Corrida(proceso.returncode, contenido, proceso.stdout, proceso.stderr)


def _exigir_exito(corrida: Corrida) -> None:
    assert corrida.codigo == 0, corrida.errores.decode("utf-8", errors="replace")


def _sha256(datos: bytes) -> str:
    return hashlib.sha256(datos).hexdigest()


def _filas(datos: bytes) -> list[list[str]]:
    return list(csv.reader(io.StringIO(datos.decode("utf-8"), newline="")))


@pytest.fixture(scope="module")
def septiembre_2026(tmp_path_factory: pytest.TempPathFactory) -> Corrida:
    directorio = tmp_path_factory.mktemp("septiembre_2026")
    return _generar(
        directorio,
        *("-n", "2000", "--mes", "2026-09", "--semilla", "42"),
        *("--categoria-dominante", "Comida", "-v"),
    )


def test_semilla_fija_genera_csv_con_contrato_de_nueve_columnas(septiembre_2026: Corrida) -> None:
    _exigir_exito(septiembre_2026)
    filas = _filas(septiembre_2026.csv)

    assert filas[0] == COLUMNAS
    assert len(filas) - 1 == 2000


def test_septiembre_2026_con_semilla_fija_reproduce_csv_y_perfil_inyectado(
    septiembre_2026: Corrida,
) -> None:
    _exigir_exito(septiembre_2026)
    # La primera línea de la salida nombra la ruta de salida, que cambia en cada corrida.
    _, _, resumen = septiembre_2026.salida.partition(b"\n")

    assert _sha256(septiembre_2026.csv) == SHA_CSV_SEPTIEMBRE
    assert _sha256(resumen) == SHA_RESUMEN_SEPTIEMBRE


def test_febrero_2028_bisiesto_reproduce_csv_y_no_revela_patrones_sin_verboso(
    tmp_path: Path,
) -> None:
    corrida = _generar(tmp_path, "-n", "1500", "--mes", "2028-02", "--semilla", "2026")

    _exigir_exito(corrida)
    fecha = _filas(corrida.csv)[-1][COLUMNAS.index("fecha")]

    assert fecha.startswith("2028-02-29")
    assert _sha256(corrida.csv) == SHA_CSV_FEBRERO
    assert corrida.salida == b""

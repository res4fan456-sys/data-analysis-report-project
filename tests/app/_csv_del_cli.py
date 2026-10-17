"""Ayudas de los tests de la CLI: escriben en disco un CSV de transacciones por la forma del contrato."""

import csv
import pathlib

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


def _fila(n: int, monto: str) -> dict[str, str]:
    return {
        "id_transaccion": f"TX{n:06d}",
        "fecha": "2026-09-15 10:00:00",
        "monto": monto,
        "concepto": "Café",
        "categoria": "Comida",
        "cuenta": "Tarjeta de Crédito ****1234",
        "zona": "Roma Norte, CDMX",
        "latitud": "19.419000",
        "longitud": "-99.160000",
    }


def escribir_septiembre(ruta: pathlib.Path, columnas_extra: tuple[str, ...] = ()) -> pathlib.Path:
    """CSV válido de septiembre de 2026 con dos transacciones ($100.00 y $250.50); cada columna extra
    se añade al final con un valor cualquiera."""
    ruta.parent.mkdir(parents=True, exist_ok=True)
    columnas = [*COLUMNAS, *columnas_extra]
    with ruta.open("w", encoding="utf-8", newline="") as salida:
        escritor = csv.writer(salida, lineterminator="\n")
        escritor.writerow(columnas)
        for n, monto in enumerate(("100.00", "250.50"), start=1):
            fila = _fila(n, monto)
            escritor.writerow([fila.get(c, "x") for c in columnas])
    return ruta

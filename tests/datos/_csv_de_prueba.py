"""Ayudas compartidas por los tests de `datos`: arman CSV en disco por la forma del contrato."""

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


def fila(n: int = 1, **cambios: str) -> dict[str, str]:
    """Una transacción válida de septiembre de 2026; `cambios` sobrescribe campos."""
    base = {
        "id_transaccion": f"TX{n:06d}",
        "fecha": "2026-09-15 10:00:00",
        "monto": "100.00",
        "concepto": "Café",
        "categoria": "Comida",
        "cuenta": "Tarjeta de Crédito ****1234",
        "zona": "Roma Norte, CDMX",
        "latitud": "19.419000",
        "longitud": "-99.160000",
    }
    base.update(cambios)
    return base


def escribir(
    carpeta: pathlib.Path,
    filas: list[dict[str, str]],
    columnas: list[str] | None = None,
) -> pathlib.Path:
    """Escribe un CSV UTF-8 sin BOM con las columnas dadas (por defecto, las del contrato)."""
    columnas = COLUMNAS if columnas is None else columnas
    ruta = carpeta / "transacciones.csv"
    with ruta.open("w", encoding="utf-8", newline="") as salida:
        escritor = csv.writer(salida, lineterminator="\n")
        escritor.writerow(columnas)
        for f in filas:
            escritor.writerow([f.get(c, "") for c in columnas])
    return ruta


def escribir_lineas(carpeta: pathlib.Path, lineas: list[str]) -> pathlib.Path:
    """Escribe líneas tal cual (para filas con campos de más o de menos)."""
    ruta = carpeta / "transacciones.csv"
    ruta.write_text("\n".join(lineas) + "\n", encoding="utf-8")
    return ruta


def linea(**cambios: str) -> str:
    """La fila válida como línea cruda, para armar CSV a mano."""
    return ",".join(f'"{v}"' if "," in v else v for v in fila(**cambios).values())

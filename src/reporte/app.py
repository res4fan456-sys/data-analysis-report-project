"""La CLI: encadena datos, núcleo y presentación, escribe la página y traduce los fallos a un mensaje
en español y un código de salida (docs/ARQUITECTURA.md, capa `app`)."""

import argparse
import os
import sys
import uuid
from pathlib import Path

from reporte.datos import ErrorDeEntrada, leer_transacciones
from reporte.nucleo import analizar
from reporte.presentacion import renderizar


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="python -m reporte",
        description="Genera la página HTML del reporte de gasto de un mes a partir de su CSV.",
    )
    parser.add_argument("csv", type=Path, help="CSV de transacciones del mes")
    parser.add_argument(
        "-o",
        "--salida",
        type=Path,
        help="ruta de la página; por defecto reporte_AAAA-MM.html junto al CSV",
    )
    return parser


def _escribir_sin_dejar_a_medias(destino: Path, pagina: str) -> None:
    """Escribe en un temporal de la carpeta del destino y lo mueve encima: queda la página anterior o
    la nueva completa, nunca una truncada, y un fallo no deja el temporal."""
    temporal = destino.with_name(f".{destino.name}.{uuid.uuid4().hex}.tmp")
    try:
        with temporal.open("x", encoding="utf-8") as archivo:
            archivo.write(pagina)
        os.replace(temporal, destino)
    except BaseException:
        temporal.unlink(missing_ok=True)
        raise


def main(argv: list[str] | None = None) -> int:
    """Devuelve el código de salida: 0 si escribió la página, 1 si el CSV se rechazó o la página no
    se pudo escribir. Un uso incorrecto lo termina `argparse` con código 2."""
    argumentos = _parser().parse_args(argv)
    try:
        analisis = analizar(leer_transacciones(argumentos.csv))
    except ErrorDeEntrada as error:
        print(error, file=sys.stderr)
        return 1
    except OSError:
        print(
            f"No se pudo leer el CSV «{argumentos.csv}». Revisa que tengas permiso de lectura.",
            file=sys.stderr,
        )
        return 1
    pagina = renderizar(analisis)
    destino: Path = argumentos.salida or (
        argumentos.csv.parent / f"reporte_{analisis.mes:%Y-%m}.html"
    )
    if destino.exists() and destino.samefile(argumentos.csv):
        print(
            f"La página no puede escribirse en «{destino}»: es el mismo archivo que el CSV.",
            file=sys.stderr,
        )
        return 1
    try:
        destino.parent.mkdir(parents=True, exist_ok=True)
        _escribir_sin_dejar_a_medias(destino, pagina)
    except OSError:
        print(
            f"No se pudo escribir la página en «{destino}». "
            "Revisa que la ruta sea un archivo y que tengas permiso de escritura.",
            file=sys.stderr,
        )
        return 1
    print(f"Reporte escrito en {destino}")
    return 0

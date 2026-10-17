"""La CLI: encadena datos, núcleo y presentación, escribe la página y traduce los fallos a un mensaje
en español y un código de salida (docs/ARQUITECTURA.md, capa `app`)."""

import argparse
import sys
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
    try:
        destino.parent.mkdir(parents=True, exist_ok=True)
        destino.write_text(pagina, encoding="utf-8")
    except OSError:
        print(
            f"No se pudo escribir la página en «{destino}». "
            "Revisa que la ruta sea un archivo y que tengas permiso de escritura.",
            file=sys.stderr,
        )
        return 1
    print(f"Reporte escrito en {destino}")
    return 0

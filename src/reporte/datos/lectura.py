"""La cáscara de I/O: abre el archivo, lo decodifica y lo separa en registros de texto."""

import csv
import io
from pathlib import Path

from reporte.datos.errores import ErrorDeEntrada
from reporte.datos.validacion import validar_registros
from reporte.nucleo.tipos import Transacciones


def leer_transacciones(ruta: Path) -> Transacciones:
    """Lee y valida el CSV de un mes; lanza `ErrorDeEntrada` con el primer problema que encuentra."""
    if not ruta.is_file():
        raise ErrorDeEntrada(f"La ruta «{ruta}» no existe o no es un archivo.")
    try:
        texto = ruta.read_bytes().decode("utf-8-sig")
    except UnicodeDecodeError:
        raise ErrorDeEntrada(
            f"El archivo «{ruta}» no está en UTF-8. Guárdalo con esa codificación."
        ) from None
    return validar_registros(_registros(texto))


def _registros(texto: str) -> list[list[str]]:
    # strict: unas comillas mal cerradas se rechazan; leerlas como otro texto alteraría una fila en
    # silencio y R2 de docs/DOMINIO.md prohíbe descartar o cambiar filas sin avisar.
    lector = csv.reader(io.StringIO(texto, newline=""), strict=True)
    try:
        return list(lector)
    except csv.Error:
        raise ErrorDeEntrada(
            f"El archivo no es un CSV bien formado (cerca de la línea {lector.line_num})."
        ) from None

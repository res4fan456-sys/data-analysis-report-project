"""Lectura y validación del CSV de transacciones (R1 a R3 de docs/DOMINIO.md)."""

from reporte.datos.errores import ErrorDeEntrada
from reporte.datos.lectura import leer_transacciones

__all__ = ["ErrorDeEntrada", "leer_transacciones"]

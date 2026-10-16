"""Formateadores es-MX: puros, sin `locale` (R15, `docs/DOMINIO.md`)."""

import datetime
from decimal import ROUND_HALF_UP, Decimal

MESES = (
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
)
DIAS = ("lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo")


def _redondear(valor: Decimal, decimales: int) -> Decimal:
    return valor.quantize(Decimal(1).scaleb(-decimales), rounding=ROUND_HALF_UP)


def formatear_monto(monto: float) -> str:
    # Se redondea sobre la representación decimal (`repr`), no sobre el binario: así 2.675 da
    # $2.68 como lo leería una persona.
    redondeado = _redondear(Decimal(repr(monto)), 2)
    return f"${redondeado:,.2f}"


def formatear_porcentaje(proporcion: float) -> str:
    """Recibe una proporción de 0 a 1. El espacio antes de `%` es el normal (U+0020), tal como
    lo escribe R15."""
    # La multiplicación va en `Decimal`: en `float`, 0.0045 * 100 da 0.44999… y bajaría la mitad.
    redondeado = _redondear(Decimal(repr(proporcion)) * 100, 1)
    return f"{redondeado:.1f} %"


def formatear_entero(valor: int) -> str:
    return f"{valor:,}"


def formatear_fecha(fecha: datetime.date) -> str:
    return f"{fecha.day} de {MESES[fecha.month - 1]} de {fecha.year}"


def formatear_mes(fecha: datetime.date) -> str:
    return f"{MESES[fecha.month - 1]} de {fecha.year}"


def dia_de_la_semana(fecha: datetime.date) -> str:
    return DIAS[fecha.weekday()]
